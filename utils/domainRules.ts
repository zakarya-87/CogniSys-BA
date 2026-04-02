
import { InitiativeStatus, TInitiative, Sector } from '../types';

export const DomainRules = {
    /**
     * Determines if an initiative can transition to the next status based on lifecycle rules.
     */
    canAdvanceStatus: (
        initiative: TInitiative,
        targetStatus: InitiativeStatus
    ): { allowed: boolean; reason?: string } => {
        const currentStatus = initiative.status;

        // Rule: Impossible transitions (e.g., Planning -> Live directly)
        if (currentStatus === InitiativeStatus.PLANNING && targetStatus === InitiativeStatus.LIVE) {
            return { allowed: false, reason: "Cannot skip Development phase." };
        }

        // Rule: Launch Gate
        if (targetStatus === InitiativeStatus.LIVE) {
            // Check if readiness score is sufficient (mock logic if not present)
            const score = initiative.readinessScore || 0;
            if (score < 80) {
                return { allowed: false, reason: `Readiness Score (${score}%) is below the 80% threshold for launch.` };
            }
            // Check for blockers (mock logic, ideally check Risk/Issue artifacts)
            // In a real app, we'd query the artifacts registry here
        }

        return { allowed: true };
    },

    /**
     * Enforces Risk criticality thresholds
     */
    isRiskCritical: (probability: number, impact: number): boolean => {
        return (probability * impact) >= 15;
    },

    /**
     * Returns mandatory compliance standards based on sector
     */
    getMandatoryCompliance: (sector: Sector): string[] => {
        switch (sector) {
            case Sector.FINTECH: return ['PCI-DSS', 'SOC2', 'GDPR'];
            case Sector.BIOTECH_PHARMA: return ['HIPAA', 'FDA 21 CFR Part 11', 'GxP'];
            case Sector.GREEN_ENERGY: return ['ISO 14001', 'IEC 61850'];
            case Sector.SAAS_CLOUD: return ['GDPR', 'OWASP Top 10'];
            default: return ['General Data Privacy'];
        }
    },

    /**
     * Validates if a user story meets INVEST criteria (Basic check)
     */
    validateUserStory: (storyTitle: string): { valid: boolean; issues: string[] } => {
        const issues: string[] = [];
        if (storyTitle.length < 10) issues.push("Too short to be descriptive.");
        if (!storyTitle.toLowerCase().includes('as a')) issues.push("Missing persona ('As a...').");
        if (!storyTitle.toLowerCase().includes('want to')) issues.push("Missing intent ('I want to...').");
        
        return { 
            valid: issues.length === 0,
            issues 
        };
    }
};
