
export interface TPrompt {
  id: string; // Machine name (e.g. 'risk-assessment')
  version: string; // e.g. '1.0.2' or 'v1'
  content: string; // The full prompt template with {{variables}}
  description?: string;
  isActive: boolean;
  tags?: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface TPromptVersion {
  version: string;
  content: string;
  createdAt: string;
  author: string;
  comment?: string;
}
