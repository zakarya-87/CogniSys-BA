
import { describe, it, expect } from 'vitest';
import { DomainRules } from './domainRules';
import { InitiativeStatus, Sector, TInitiative } from '../types';

describe('DomainRules', () => {
  describe('canAdvanceStatus', () => {
    const baseInitiative: TInitiative = {
      id: '1',
      orgId: 'org-0',
      projectId: 'proj-0',
      title: 'Test',
      description: 'Desc',
      status: InitiativeStatus.PLANNING,
      sector: Sector.GENERAL,
      owner: { name: 'User', avatarUrl: '' },
      artifacts: {}
    };

    it('prevents skipping Development phase (Planning -> Live)', () => {
      const result = DomainRules.canAdvanceStatus(baseInitiative, InitiativeStatus.LIVE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot skip Development phase');
    });

    it('allows Planning -> Awaiting Approval', () => {
        const result = DomainRules.canAdvanceStatus(baseInitiative, InitiativeStatus.AWAITING_APPROVAL);
        expect(result.allowed).toBe(true);
    });

    it('checks readiness score for Live transition', () => {
        const devInitiative = { ...baseInitiative, status: InitiativeStatus.IN_DEVELOPMENT, readinessScore: 50 };
        const result = DomainRules.canAdvanceStatus(devInitiative, InitiativeStatus.LIVE);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Readiness Score');
    });

    it('allows Live transition if score is sufficient', () => {
        const devInitiative = { ...baseInitiative, status: InitiativeStatus.IN_DEVELOPMENT, readinessScore: 90 };
        const result = DomainRules.canAdvanceStatus(devInitiative, InitiativeStatus.LIVE);
        expect(result.allowed).toBe(true);
    });
  });

  describe('isRiskCritical', () => {
    it('identifies critical risks (score >= 15)', () => {
      expect(DomainRules.isRiskCritical(5, 3)).toBe(true); // 15
      expect(DomainRules.isRiskCritical(5, 4)).toBe(true); // 20
    });

    it('identifies non-critical risks', () => {
      expect(DomainRules.isRiskCritical(2, 5)).toBe(false); // 10
      expect(DomainRules.isRiskCritical(3, 4)).toBe(false); // 12
    });
  });

  describe('validateUserStory', () => {
      it('validates a correct user story', () => {
          const story = "As a user, I want to login so that I can access my data.";
          const result = DomainRules.validateUserStory(story);
          expect(result.valid).toBe(true);
          expect(result.issues).toHaveLength(0);
      });

      it('flags missing persona', () => {
          const story = "I want to login so that I can access my data.";
          const result = DomainRules.validateUserStory(story);
          expect(result.valid).toBe(false);
          expect(result.issues).toContain("Missing persona ('As a...').");
      });

      it('flags missing intent', () => {
          const story = "As a user, so that I can access my data.";
          const result = DomainRules.validateUserStory(story);
          expect(result.valid).toBe(false);
          expect(result.issues).toContain("Missing intent ('I want to...').");
      });

      it('flags short stories', () => {
          const story = "As a user";
          const result = DomainRules.validateUserStory(story);
          expect(result.valid).toBe(false);
          expect(result.issues).toContain("Too short to be descriptive.");
      });
  });
});
