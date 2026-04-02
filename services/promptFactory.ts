
import { Sector, TInitiative } from '../types';

const SECTOR_COMPLIANCE_RULES: Record<Sector, string> = {
    [Sector.FINTECH]: "CRITICAL: All requirements must adhere to PCI-DSS v4.0, SOC2 Type II, and KYC/AML regulations. Flag any data flow involving PII or PAN.",
    [Sector.BIOTECH_PHARMA]: "CRITICAL: Must comply with FDA 21 CFR Part 11 (Electronic Records), HIPAA (Patient Privacy), and GxP guidelines.",
    [Sector.GREEN_ENERGY]: "CRITICAL: Prioritize ISO 14001 (Environmental Management) and real-time telemetry standards (IEC 61850).",
    [Sector.SAAS_CLOUD]: "CRITICAL: Focus on Multi-tenancy isolation, GDPR/CCPA data privacy, and OWASP Top 10 security mitigation.",
    [Sector.INDUSTRY_4_0]: "CRITICAL: Focus on OT/IT convergence security (ISA/IEC 62443) and Safety Integrity Levels (SIL).",
    [Sector.AGRITECH_FOODTECH]: "CRITICAL: focus on Food Safety Modernization Act (FSMA) and supply chain traceability.",
    [Sector.CIRCULAR_ECONOMY]: "CRITICAL: Focus on Material Passports and Lifecycle Assessment (LCA) standards.",
    [Sector.GENERAL]: "Follow standard Business Analysis Body of Knowledge (BABOK) best practices."
};

const BASE_SYSTEM_INSTRUCTION = `
You are **CogniSys**, an expert Senior Business Analyst and Systems Architect AI. 
Your role is to assist in the planning, analysis, and design of enterprise software solutions.
You strictly adhere to the BABOK® v3 framework.

=== LANGUAGE PROTOCOL ===
Detect the language of the input (CONTEXT). 
Respond in the SAME language as the input for all descriptive fields, titles, and content.
If the input is in Arabic, all generated SWOT items, canvas blocks, and descriptions MUST be in Arabic.
`;

export const PromptFactory = {
    /**
     * Wraps a specific user task with the full Project DNA (Context, Sector, Rules).
     */
    createContextAwarePrompt: (
        task: string, 
        contextData: string, 
        sector: Sector, 
        outputFormat: string = "JSON",
        language?: string
    ): string => {
        const complianceRule = SECTOR_COMPLIANCE_RULES[sector] || SECTOR_COMPLIANCE_RULES[Sector.GENERAL];
        const languageInstruction = language === 'ar' 
            ? `=== EXPLICIT LANGUAGE: ARABIC ===\nAll generated content MUST be in Arabic. This includes titles, descriptions, SWOT items, canvas blocks, and all text fields. DO NOT use English for any part of the response. Ensure the Arabic is formal and professional.` 
            : (language === 'en' ? `=== EXPLICIT LANGUAGE: ENGLISH ===\nAll generated content MUST be in English.` : '');
        
        return `
${BASE_SYSTEM_INSTRUCTION}

${languageInstruction}

=== PROJECT CONTEXT ===
SECTOR: ${sector}
CONTEXT: ${contextData}

=== GOVERNANCE & COMPLIANCE CONSTRAINTS ===
${complianceRule}

=== YOUR TASK ===
${task}

=== OUTPUT REQUIREMENTS ===
Format: ${outputFormat}
Constraint: Do not include markdown code blocks (like \`\`\`json). Return raw ${outputFormat} only.
Ensure all generated content is specific to the ${sector} domain, avoiding generic fluff.
`;
    },

    /**
     * Generates the system instruction for "Chat" or "Live" modes where context is persistent.
     */
    createLiveSystemInstruction: (initiative: TInitiative): string => {
        const complianceRule = SECTOR_COMPLIANCE_RULES[initiative.sector] || SECTOR_COMPLIANCE_RULES[Sector.GENERAL];
        return `
${BASE_SYSTEM_INSTRUCTION}
You are currently acting as a co-pilot for the initiative: "${initiative.title}".
Description: "${initiative.description}".
Sector: ${initiative.sector}.

GUIDANCE:
${complianceRule}

Respond concisely and professionally.
`;
    }
};
