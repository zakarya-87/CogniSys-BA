import { ModelRouter, ModelType } from './ModelRouter';
import { PromptManager } from './PromptManager';
import { TInitiative, TWorkBreakdown } from '../../types';

export class WBSGeneratorAgent {
  private router = new ModelRouter();

  async generateWBS(initiative: TInitiative): Promise<TWorkBreakdown> {
    const systemPrompt = await PromptManager.getPrompt('wbs_generator_system') || 
      "You are an expert Business Analyst. Generate a detailed Work Breakdown Structure (WBS) for the following initiative. Output ONLY valid JSON matching the TWorkBreakdown interface.";
    
    const userPrompt = `
      Initiative Title: ${initiative.title}
      Description: ${initiative.description}
      Sector: ${initiative.sector}
      
      Generate a hierarchical WBS with at least 3 levels (Phases, Tasks, Sub-tasks).
      Include 'estimatedDuration', 'complexity' (Low, Medium, High), and 'dependencies'.
    `;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const providerChain: ModelType[] = [ModelType.REASONING, ModelType.MISTRAL, ModelType.AZURE];
    let lastError: Error | null = null;

    for (const provider of providerChain) {
      try {
        const response = await this.router.generateContent(fullPrompt, provider);
        const jsonStr = response.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as TWorkBreakdown;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`WBSGeneratorAgent: provider ${provider} failed, trying next...`, lastError.message);
      }
    }

    throw new Error(`WBSGeneratorAgent: all providers failed. Last error: ${lastError?.message}`);
  }
}

