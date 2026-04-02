
import { THiveState, THiveMessage, THiveAgent, THiveStep, TInitiative } from '../types';
import { Microservices } from './microservices';
import { summarizeConversation } from './geminiService';

// --- HIVE GATEWAY (Orchestration Layer) ---

export const HiveService = {
    /**
     * Executes one step of the Agentic Graph.
     * Routes logic to the appropriate Microservice based on the active agent.
     */
    async processStep(state: THiveState, initiative?: TInitiative): Promise<THiveState> {
        
        // --- 0. Context Pruning (Memory Management) ---
        // If message history exceeds 12 items, summarize to prevent token overflow.
        let messages = state.messages;
        if (messages.length > 12) {
             console.log("Hive Context pruning triggered...");
             try {
                 const summary = await summarizeConversation(messages.slice(0, -4)); // Summarize all but the last 4
                 const recentMessages = messages.slice(-4);
                 
                 const summaryMsg: THiveMessage = {
                     id: `summary-${Date.now()}`,
                     role: 'system',
                     agent: 'Orchestrator',
                     content: `[MEMORY RECALL]: Previous context summary: ${summary}`,
                     timestamp: Date.now(),
                     status: 'done'
                 };
                 messages = [summaryMsg, ...recentMessages];
             } catch (e) {
                 console.warn("Failed to summarize history, proceeding with full context.", e);
             }
        }

        // 1. Identification: Who is currently holding the "conch"?
        const currentAgentName = state.activeAgent;
        const currentService = Microservices[currentAgentName];

        if (!currentService) {
            console.error(`Service for ${currentAgentName} not found. Returning control to Orchestrator.`);
            return { ...state, activeAgent: 'Orchestrator' };
        }

        // 2. Execution: If it's a Worker (Scout/Guardian/Integromat/Simulation), they execute and return to Orchestrator.
        if (currentAgentName !== 'Orchestrator') {
             // Worker finished (simulated sync return for now)
             return {
                ...state,
                activeAgent: 'Orchestrator',
                messages // Update context with pruned version if applicable
            };
        }

        // 3. Orchestration: The Orchestrator plans the next move.
        // It reads the history and decides routing.
        try {
            const response = await Microservices.Orchestrator.execute(
                messages, 
                "Review history and decide next step.", 
                initiative
            );

            // Create the Orchestrator's internal thought/command message
            const orchMsg: THiveMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                agent: 'Orchestrator',
                content: response.nextAction === 'delegate' 
                    ? `Delegating to ${response.targetAgent}: "${response.instructions}"` 
                    : response.content || "Processing...",
                thought: response.thought, // Capture Chain of Thought
                timestamp: Date.now(),
                status: 'done'
            };

            const updatedMessages = [...messages, orchMsg];

            if (response.nextAction === 'delegate' && response.targetAgent) {
                // -- EXECUTE GRAPH EDGE (Call Worker Microservice) --
                
                // Safety: Check if target agent exists
                const targetService = Microservices[response.targetAgent as THiveAgent];
                if (!targetService) {
                    console.warn(`Orchestrator attempted to delegate to unknown agent: ${response.targetAgent}`);
                    return {
                         ...state,
                         messages: [...updatedMessages, {
                             id: `err-${Date.now()}`,
                             role: 'system',
                             agent: 'Orchestrator',
                             content: `System Error: Cannot delegate to '${response.targetAgent}'. Agent does not exist.`,
                             timestamp: Date.now(),
                             status: 'done'
                         }],
                         activeAgent: 'Orchestrator', // Stay on Orchestrator to try again
                         status: 'idle'
                    };
                }

                const workerResponse = await targetService.execute(updatedMessages, response.instructions || '', initiative);

                // --- HITL CHECK ---
                if (workerResponse.nextAction === 'approval_required' && workerResponse.toolCall) {
                    return {
                        ...state,
                        status: 'waiting_approval',
                        activeAgent: response.targetAgent as THiveAgent, // Worker stays active
                        messages: updatedMessages, // Orchestrator message added
                        approvalRequest: {
                            id: `approval-${Date.now()}`,
                            agent: response.targetAgent as THiveAgent,
                            actionType: 'Execute',
                            summary: `Execute tool: ${workerResponse.toolCall.name}`,
                            toolName: workerResponse.toolCall.name,
                            data: workerResponse.toolCall.args
                        }
                    };
                }

                // Normal Execution
                const workerMsg: THiveMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    agent: response.targetAgent as THiveAgent,
                    content: workerResponse.content,
                    thought: workerResponse.thought,
                    timestamp: Date.now(),
                    status: 'done',
                    metadata: workerResponse.metadata
                };

                const step: THiveStep = {
                    id: `step-${Date.now()}`,
                    agent: 'Orchestrator',
                    action: 'delegate',
                    nextAgent: response.targetAgent as THiveAgent,
                    status: 'completed'
                };

                return {
                    ...state,
                    activeAgent: 'Orchestrator', // Control returns after worker finishes
                    messages: [...updatedMessages, workerMsg],
                    history: [...(state.history || []), step]
                };

            } else {
                // -- TERMINATE GRAPH --
                 return {
                     ...state,
                     status: 'completed',
                     messages: updatedMessages
                 };
            }
        } catch (error: any) {
            console.error("Orchestrator execution failed:", error);
             return {
                 ...state,
                 status: 'idle',
                 messages: [...messages, {
                     id: `err-${Date.now()}`,
                     role: 'system',
                     agent: 'Orchestrator',
                     content: `System Error during orchestration: ${error.message}`,
                     timestamp: Date.now()
                 }]
             };
        }
    },

    /**
     * Resumes execution after Human Approval
     */
    async resumeStep(state: THiveState, approved: boolean): Promise<THiveState> {
        if (!state.approvalRequest || state.status !== 'waiting_approval') {
            return state;
        }

        const agentName = state.approvalRequest.agent;
        const service = Microservices[agentName];
        
        // Use type guard or simple check for Integromat specifically since it has executeTool
        if (agentName !== 'Integromat') {
            // Only Integromat supports tools currently in this demo
            return { ...state, status: 'idle', approvalRequest: undefined }; 
        }

        const integromat = service as typeof Microservices.Integromat;

        if (approved) {
            // Execute the suspended tool
            const result = await integromat.executeTool(state.approvalRequest.toolName, state.approvalRequest.data);
            
            const workerMsg: THiveMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                agent: agentName,
                content: result.content,
                timestamp: Date.now(),
                status: 'done',
                metadata: result.metadata
            };

            return {
                ...state,
                status: 'running',
                activeAgent: 'Orchestrator', // Hand back to Orchestrator
                messages: [...state.messages, workerMsg],
                approvalRequest: undefined
            };
        } else {
             // User Rejected
             const rejectionMsg: THiveMessage = {
                id: Date.now().toString(),
                role: 'system',
                agent: agentName,
                content: `Action ${state.approvalRequest.toolName} was rejected by the user.`,
                timestamp: Date.now(),
                status: 'done'
            };

            return {
                ...state,
                status: 'running',
                activeAgent: 'Orchestrator',
                messages: [...state.messages, rejectionMsg],
                approvalRequest: undefined
            };
        }
    }
};
