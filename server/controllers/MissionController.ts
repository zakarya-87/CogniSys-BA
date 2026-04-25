
import { Request, Response } from 'express';
import { MissionRepository, TMission } from '../repositories/MissionRepository';
import { AuditLogService } from '../services/AuditLogService';

const repo = new MissionRepository();

export const MissionController = {
    async save(req: Request, res: Response) {
        try {
            const { mission } = req.body;
            if (!mission || !mission.id) {
                return res.status(400).json({ error: 'Invalid mission data' });
            }

            const data: TMission = {
                ...mission,
                updatedAt: Date.now()
            };

            await repo.saveMission(data);
            res.status(200).json({ success: true, mission: data });
        } catch (error: any) {
            console.error('Failed to save mission:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async getByInitiative(req: Request, res: Response) {
        try {
            const { initiativeId } = req.params;
            const missions = await repo.getByInitiativeId(initiativeId);
            res.status(200).json({ data: missions });
        } catch (error: any) {
            console.error('Failed to fetch missions:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const mission = await repo.getById(id);
            if (!mission) {
                return res.status(404).json({ error: 'Mission not found' });
            }
            res.status(200).json(mission);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async logAudit(req: Request, res: Response) {
        try {
            const { orgId } = req.params;
            const { userId, agent, action, metadata } = req.body;
            
            await AuditLogService.logAIAction(orgId, userId, agent, action, metadata);
            res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Failed to log AI audit:', error);
            res.status(500).json({ error: error.message });
        }
    }
};
