
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HiveService } from './hiveService';
import { Microservices } from './microservices';
import { THiveState, THiveMessage } from '../types';

// Mock the Microservices to avoid real API calls during tests
vi.mock('./microservices', () => ({
    Microservices: {
        Orchestrator: { execute: vi.fn() },
        Scout: { execute: vi.fn() },
        Integromat: { execute: vi.fn(), executeTool: vi.fn() },
        Guardian: { execute: vi.fn() },
        Simulation: { execute: vi.fn() }
    }
}));

// Mock the summarizer to avoid AI calls
vi.mock('./geminiService', () => ({
    summarizeConversation: vi.fn().mockResolvedValue("Conversation summary.")
}));

describe('HiveService Integration Tests', () => {
    let initialState: THiveState;

    beforeEach(() => {
        initialState = {
            goal: 'Test Goal',
            status: 'running',
            activeAgent: 'Orchestrator',
            messages: [{ id: '1', role: 'user', agent: 'Orchestrator', content: 'Do research', timestamp: Date.now() }],
            artifacts: {},
            history: [],
            stepQueue: []
        };
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('Scenario: Orchestrator Delegates to Scout (The Worker Loop)', async () => {
        // 1. Mock Orchestrator deciding to delegate
        (Microservices.Orchestrator.execute as any).mockResolvedValue({
            nextAction: 'delegate',
            targetAgent: 'Scout',
            instructions: 'Find competitors'
        });

        // 2. Mock Scout performing the work
        (Microservices.Scout.execute as any).mockResolvedValue({
            content: 'Found 3 competitors.',
            metadata: { source: 'Google' }
        });

        // Execute Step
        const nextState = await HiveService.processStep(initialState);

        // Assertions
        expect(Microservices.Orchestrator.execute).toHaveBeenCalled();
        expect(Microservices.Scout.execute).toHaveBeenCalled();
        
        // Orchestrator should retain control after worker finishes in the synchronous loop
        expect(nextState.activeAgent).toBe('Orchestrator'); 
        
        // History should contain the delegation step
        expect(nextState.history).toHaveLength(1);
        expect(nextState.history[0].agent).toBe('Orchestrator');
        expect(nextState.history[0].action).toBe('delegate');
        
        // Messages should include: User Msg -> Orchestrator Delegation -> Scout Response
        expect(nextState.messages).toHaveLength(3);
        expect(nextState.messages[2].agent).toBe('Scout');
        expect(nextState.messages[2].content).toBe('Found 3 competitors.');
    });

    it('Scenario: Integromat triggers Human Approval (HITL)', async () => {
        // 1. Mock Orchestrator delegating to Integromat
        (Microservices.Orchestrator.execute as any).mockResolvedValue({
            nextAction: 'delegate',
            targetAgent: 'Integromat',
            instructions: 'Create Jira ticket'
        });

        // 2. Mock Integromat requiring approval
        (Microservices.Integromat.execute as any).mockResolvedValue({
            nextAction: 'approval_required',
            toolCall: { name: 'jira_create', args: { title: 'Bug' } },
            content: 'I need approval.'
        });

        // Execute Step
        const nextState = await HiveService.processStep(initialState);

        // Assertions
        expect(nextState.status).toBe('waiting_approval');
        expect(nextState.approvalRequest).toBeDefined();
        expect(nextState.approvalRequest?.toolName).toBe('jira_create');
        expect(nextState.activeAgent).toBe('Integromat'); // Worker stays active waiting
    });

    it('Scenario: Resuming after Approval', async () => {
        // Setup state waiting for approval
        const pendingState: THiveState = {
            ...initialState,
            status: 'waiting_approval',
            activeAgent: 'Integromat',
            approvalRequest: {
                id: '123',
                agent: 'Integromat',
                actionType: 'Create',
                summary: 'Create ticket',
                toolName: 'jira_create',
                data: { title: 'Bug' }
            }
        };

        // Mock Tool Execution
        (Microservices.Integromat.executeTool as any).mockResolvedValue({
            content: 'Ticket created: PROJ-101',
            metadata: { id: 'PROJ-101' }
        });

        // Execute Resume
        const nextState = await HiveService.resumeStep(pendingState, true);

        // Assertions
        expect(Microservices.Integromat.executeTool).toHaveBeenCalledWith('jira_create', { title: 'Bug' });
        expect(nextState.status).toBe('running');
        expect(nextState.approvalRequest).toBeUndefined();
        expect(nextState.activeAgent).toBe('Orchestrator'); // Control returned to brain
        
        const lastMsg = nextState.messages[nextState.messages.length - 1];
        expect(lastMsg.content).toContain('Ticket created');
    });

    it('Scenario: Orchestrator terminates loop (Direct Reply)', async () => {
        (Microservices.Orchestrator.execute as any).mockResolvedValue({
            nextAction: 'reply',
            content: 'Task complete.'
        });

        const nextState = await HiveService.processStep(initialState);

        expect(nextState.status).toBe('completed');
        expect(Microservices.Scout.execute).not.toHaveBeenCalled();
        expect(nextState.messages.length).toBe(2); // User + Orchestrator reply
    });

    it('Scenario: Handling Missing Agent Error', async () => {
        (Microservices.Orchestrator.execute as any).mockResolvedValue({
            nextAction: 'delegate',
            targetAgent: 'UnknownAgent' // Invalid agent
        });

        const nextState = await HiveService.processStep(initialState);

        // Should return to idle/error state but keep orchestrator active to recover
        expect(nextState.activeAgent).toBe('Orchestrator');
        const lastMsg = nextState.messages[nextState.messages.length - 1];
        expect(lastMsg.content).toContain('System Error');
        expect(lastMsg.content).toContain('Cannot delegate');
    });
});
