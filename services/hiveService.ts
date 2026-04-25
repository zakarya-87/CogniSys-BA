
import { THiveState, THiveMessage, THiveAgent, THiveStep, TInitiative } from '../types';
import { Microservices } from './microservices';
import { summarizeConversation } from './geminiService';
import { MissionAPI } from '../src/services/api';
import { TelemetryService } from './telemetryService';

// --- HIVE GATEWAY (Orchestration Layer) ---

export const HiveService = {
    /**
     * Executes one step of the Agentic Graph.
     * Routes logic to the appropriate Microservice based on the active agent.
     */
    async processStep(state: THiveState, orgId: string, missionId: string, initiative?: TInitiative): Promise<THiveState> {
        const syncState = async (newState: THiveState) => {
            try {
                await MissionAPI.save(orgId, {
                    id: missionId,
                    orgId,
                    initiativeId: initiative?.id || 'global',
                    state: newState,
                    status: newState.status,
                    updatedAt: Date.now()
                });
            } catch (e) {
                console.warn("Failed to sync Hive state to server:", e);
            }
        };

        const logAudit = async (agent: string, action: string, response: any, verdict?: string) => {
            try {
                await MissionAPI.logAudit(orgId, 'system_orchestrator', agent, action, {
                    thought: response.thought,
                    instructions: response.instructions,
                    toolCall: response.toolCall,
                    usage: response.usage, // Added usage
                    safetyVerdict: verdict,
                    missionId,
                    initiativeId: initiative?.id
                });
            } catch (e) {
                console.warn("Audit logging failed:", e);
            }
        };
        
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

            // Accumulate usage for Orchestrator
            if (response.usage) {
                state.totalTokens = TelemetryService.accumulateUsage(state.totalTokens, response.usage);
                const modelId = (response as any).modelId || 'pro'; // Orchestrator typically uses pro
                state.totalCost = (state.totalCost || 0) + TelemetryService.calculateCost(modelId, response.usage);
            }

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
                status: 'done',
                usage: response.usage,
                cost: response.usage ? TelemetryService.calculateCost((response as any).modelId || 'pro', response.usage) : 0
            };

            const updatedMessages = [...messages, orchMsg];

            if (response.nextAction === 'delegate' && response.targetAgent) {
                // -- EXECUTE GRAPH EDGE (Call Worker Microservice) --
                
                // --- PHASE 3: SAFETY INTERLEAVING (GUARDIAN SCAN) ---
                let safetyVerdict = 'Pass';
                if (['Integromat', 'Scout', 'Simulation'].includes(response.targetAgent)) {
                     const guardianCheck = await Microservices.Guardian.execute(
                         updatedMessages, 
                         `Ethics Scan: Is it safe for ${response.targetAgent} to proceed with: "${response.instructions}"?`, 
                         initiative
                     );
                     safetyVerdict = guardianCheck?.metadata?.data?.verdict || 'Pass';
                     
                     if (safetyVerdict === 'Fail') {
                          const failMsg: THiveMessage = {
                              id: `safe-${Date.now()}`,
                              role: 'system',
                              agent: 'Guardian',
                              content: `SAFETY ALERT: ${guardianCheck?.content}`,
                              metadata: { safetyStatus: 'violation', verdict: 'Fail' },
                              timestamp: Date.now(),
                              status: 'done'
                          };
                          
                          const failState: THiveState = {
                              ...state,
                              status: 'waiting_approval',
                              activeAgent: 'Orchestrator',
                              messages: [...updatedMessages, failMsg],
                              approvalRequest: {
                                  id: `safety-${Date.now()}`,
                                  agent: 'Guardian',
                                  actionType: 'Safety Override',
                                  summary: `The Guardian flagged this action as high risk: ${guardianCheck?.content}`,
                                  toolName: 'safety_override',
                                  data: { verdict: 'Fail', reason: guardianCheck?.content }
                              }
                          };
                          await logAudit(response.targetAgent, 'delegate', response, 'Fail');
                          return failState;
                     }
                }

                const targetService = Microservices[response.targetAgent as string];
                if (!targetService) {
                    const errMsg = `Cannot delegate — target service ${response.targetAgent} not found`;
                    await logAudit(response.targetAgent, 'delegate', response, 'Fail');
                    return {
                        ...state,
                        status: 'idle',
                        messages: [...updatedMessages, {
                            id: `err-${Date.now()}`,
                            role: 'system',
                            agent: 'Orchestrator',
                            content: `System Error during orchestration: ${errMsg}`,
                            timestamp: Date.now()
                        }]
                    };
                }
                const workerResponse = await targetService.execute(updatedMessages, response.instructions || '', initiative);
                await logAudit(response.targetAgent, 'delegate', response, safetyVerdict);

                // Accumulate usage for Worker
                if (workerResponse.usage) {
                    state.totalTokens = TelemetryService.accumulateUsage(state.totalTokens, workerResponse.usage);
                    const modelId = (workerResponse as any).modelId || 'flash'; // Workers typically use flash
                    state.totalCost = (state.totalCost || 0) + TelemetryService.calculateCost(modelId, workerResponse.usage);
                }

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
                    metadata: workerResponse.metadata,
                    usage: workerResponse.usage,
                    cost: workerResponse.usage ? TelemetryService.calculateCost((workerResponse as any).modelId || 'flash', workerResponse.usage) : 0
                };

                const step: THiveStep = {
                    id: `step-${Date.now()}`,
                    agent: 'Orchestrator',
                    action: 'delegate',
                    nextAgent: response.targetAgent as THiveAgent,
                    status: 'completed'
                };

                const newState: THiveState = {
                    ...state,
                    activeAgent: 'Orchestrator', // Control returns after worker finishes
                    messages: [...updatedMessages, workerMsg],
                    history: [...(state.history || []), step]
                };

                await syncState(newState);
                return newState;

            } else {
                // -- TERMINATE GRAPH --
                 const completeState: THiveState = {
                     ...state,
                     status: 'completed',
                     messages: updatedMessages
                 };
                 await syncState(completeState);
                 return completeState;
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
            
            // Accumulate usage if available (e.g. from generated artifacts)
            if (result.usage) {
                state.totalTokens = TelemetryService.accumulateUsage(state.totalTokens, result.usage);
                const modelId = (result as any).modelId || 'flash';
                state.totalCost = (state.totalCost || 0) + TelemetryService.calculateCost(modelId, result.usage);
            }

            const workerMsg: THiveMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                agent: agentName,
                content: result.content,
                timestamp: Date.now(),
                status: 'done',
                metadata: result.metadata,
                usage: result.usage,
                cost: result.usage ? TelemetryService.calculateCost((result as any).modelId || 'flash', result.usage) : 0
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

