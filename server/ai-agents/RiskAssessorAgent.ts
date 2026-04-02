import { ModelRouter, ModelType } from './ModelRouter';
import { PromptManager } from './PromptManager';
import { TInitiative } from '../../types';

export class RiskAssessorAgent {
  private router = new ModelRouter();

  async assessRisks(initiative: TInitiative, wbs?: any): Promise<any[]> {
    const systemPrompt = await PromptManager.getPrompt('risk_assessor_system') || 
      "You are a Risk Management Expert. Identify potential risks for the following initiative and its WBS. Output ONLY a valid JSON array of risk objects.";
    
    const userPrompt = `
      Initiative: ${initiative.title}
      Description: ${initiative.description}
      WBS: ${JSON.stringify(wbs || 'Not provided')}
      
      Identify 5-10 specific risks. For each risk, include:
      - category (Technical, Financial, Operational, Regulatory)
      - probability (0.0 to 1.0)
      - impact (0.0 to 1.0)
      - mitigationStrategy
    `;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const providerChain: ModelType[] = [ModelType.REASONING, ModelType.MISTRAL, ModelType.AZURE];
    let lastError: Error | null = null;

    for (const provider of providerChain) {
      try {
        const response = await this.router.generateContent(fullPrompt, provider);
        const jsonStr = response.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`RiskAssessorAgent: provider ${provider} failed, trying next...`, lastError.message);
      }
    }

    throw new Error(`RiskAssessorAgent: all providers failed. Last error: ${lastError?.message}`);
  }
}

