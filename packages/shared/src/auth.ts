import { z } from 'zod';
// Transport resource limits, not gameplay balance or username normalization rules.
export const credentialsSchema = z.object({ username: z.string().min(1).max(256), password: z.string().min(1).max(1024) }).strict();
export const registrationSchema = credentialsSchema.extend({ class: z.enum(['PHYSICAL_DPS', 'MAGIC_DPS', 'TANK']), requestId: z.string().uuid() }).strict();
export const authenticatedJoinSchema = z.object({ version: z.literal(1), token: z.string().regex(/^[a-f0-9]{64}$/), reconnect: z.boolean().default(false) }).strict();
export const AUTHENTICATED_ROOM = 'starter-village';
