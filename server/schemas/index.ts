/**
 * Zod validation schemas for all API request bodies.
 * Each schema mirrors the corresponding TypeScript type but enforces
 * runtime validation and provides clear 400 error messages.
 */
import { z } from 'zod';
import { Response } from 'express';

// ── Enums (mirrored from types.ts) ───────────────────────────────────────────

export const InitiativeStatusSchema = z.enum([
  'Planning',
  'Awaiting Approval',
  'In Development',
  'Live',
  'On Hold',
]);

export const SectorSchema = z.enum([
  'Cloud & SaaS',
  'Fintech',
  'Renewable Energy',
  'Circular Economy',
  'Agritech & Foodtech',
  'Industry 4.0 & IoT',
  'Biotech & Pharma',
  'General Business',
]);

export const UserRoleSchema = z.enum(['viewer', 'member', 'admin']);

// ── Organization ──────────────────────────────────────────────────────────────

export const CreateOrganizationSchema = z.object({
  id: z.string().min(1, 'id is required'),
  name: z.string().min(1, 'name is required').max(200),
  ownerId: z.string().min(1, 'ownerId is required'),
  members: z.array(
    z.object({
      userId: z.string().min(1),
      role: UserRoleSchema,
    })
  ).default([]),
});

// ── Project ───────────────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  id: z.string().min(1, 'id is required'),
  orgId: z.string().min(1, 'orgId is required'),
  name: z.string().min(1, 'name is required').max(200),
  description: z.string().max(2000).default(''),
});

// ── Initiative ────────────────────────────────────────────────────────────────

export const CreateInitiativeSchema = z.object({
  id: z.string().min(1, 'id is required'),
  orgId: z.string().min(1, 'orgId is required'),
  projectId: z.string().min(1, 'projectId is required'),
  title: z.string().min(1, 'title is required').max(300),
  description: z.string().max(5000).default(''),
  status: InitiativeStatusSchema.default('Planning'),
  sector: SectorSchema.default('General Business'),
  owner: z.object({
    name: z.string().min(1, 'owner.name is required'),
    avatarUrl: z.string().url().or(z.literal('')).default(''),
  }),
  wbs: z.unknown().optional(),
  artifacts: z.record(z.unknown()).optional(),
  readinessScore: z.number().min(0).max(100).optional(),
  lastUpdated: z.string().optional(),
});

export const UpdateInitiativeSchema = z.object({
  orgId: z.string().min(1, 'orgId is required'),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  status: InitiativeStatusSchema.optional(),
  sector: SectorSchema.optional(),
  owner: z.object({
    name: z.string().min(1),
    avatarUrl: z.string().url().or(z.literal('')).optional(),
  }).optional(),
  wbs: z.unknown().optional(),
  artifacts: z.record(z.unknown()).optional(),
  readinessScore: z.number().min(0).max(100).optional(),
  lastUpdated: z.string().optional(),
}).passthrough();

// ── Helper ────────────────────────────────────────────────────────────────────

/** Parse and validate a request body; sends 400 with details on failure. */
export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
  res: Response
): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({ error: 'Validation failed', details });
    return null;
  }
  return result.data;
}
