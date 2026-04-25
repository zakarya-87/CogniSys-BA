import { ModelRouter, ModelType } from './ModelRouter';
import { PromptManager } from './PromptManager';
import { ValidationService } from '../services/ValidationService';
import { TInitiative, TWorkBreakdown } from '../../types';
import { jsonrepair } from 'jsonrepair';

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
      Include 'effort' (total hours per node), 'duration' (days), 'complexity' (Low, Medium, High), and 'dependencies'.
      
      IMPORTANT MATH RULE: 
      - The 'effort' of a parent node MUST be the exact sum of the 'effort' of its children.
      - Total 'effort' at the root must be comprehensive.
    `;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const providerChain: ModelType[] = [ModelType.REASONING, ModelType.MISTRAL, ModelType.AZURE];
    let lastError: Error | null = null;

    for (const provider of providerChain) {
      try {
        const response = await this.router.generateContent(fullPrompt, provider);
        
        // Use jsonrepair for robustness
        const rawJson = response.text.replace(/```json|```/g, '').trim();
        const repairedJson = jsonrepair(rawJson);
        const wbsData = JSON.parse(repairedJson) as TWorkBreakdown;

        // Predictive Validation Layer (HIVE-03)
        const validation = ValidationService.validateWBS(wbsData as any);
        if (!validation.isValid) {
          throw new Error(`Mathematical validation failed: ${validation.errors.join('; ')}`);
        }

        return wbsData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`WBSGeneratorAgent: provider ${provider} failed or invalid, trying next...`, lastError.message);
      }
    }

    throw new Error(`WBSGeneratorAgent: all providers failed or output invalid math. Last error: ${lastError?.message}`);
  }
}

