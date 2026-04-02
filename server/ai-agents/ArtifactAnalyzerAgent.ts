import { ModelRouter, ModelType } from './ModelRouter';
import { PromptManager } from './PromptManager';

export class ArtifactAnalyzerAgent {
  private router = new ModelRouter();

  async analyzeArtifact(content: string, artifactType: string): Promise<any> {
    const systemPrompt = await PromptManager.getPrompt('artifact_analyzer_system') || 
      "You are a Senior Analyst. Analyze the provided document content and extract key business requirements, constraints, and stakeholders. Output ONLY valid JSON.";
    
    const userPrompt = `
      Artifact Type: ${artifactType}
      Content: ${content}
      
      Provide a structured analysis including:
      - Key Requirements
      - Identified Constraints
      - Stakeholders Mentioned
      - Potential Risks
    `;

    const response = await this.router.generateContent(`${systemPrompt}\n\n${userPrompt}`, ModelType.REASONING);
    
    try {
      const jsonStr = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error(`Failed to parse Artifact Analysis JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
