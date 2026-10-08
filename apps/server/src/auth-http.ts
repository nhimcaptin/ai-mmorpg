import type { Express, ErrorRequestHandler } from 'express';
import express from 'express';
import type { AuthService } from './auth.js';
import { setTimeout as delay } from 'node:timers/promises';
import { recoveryRequestSchema } from '@mmorpg/shared';
export function mountAuth(app: Express, auth: AuthService) {
  app.use('/auth', express.json({ limit: '8kb' }));
  // Local development only; no cookies or implicit ambient authentication.
  let inFlight = 0;
  for (const action of ['register', 'login', 'logout'] as const) app.post(`/auth/${action}`, async (req, res) => {
    if (inFlight >= 2) { res.status(429).json({ error: 'TRY_LATER' }); return; }
    inFlight++;
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (action === 'register') res.status(201).json(await auth.register(req.body));
      else if (action === 'login') res.json(await auth.login(req.body));
      else { await auth.logout(req.headers.authorization?.replace(/^Bearer /, '') ?? ''); res.status(204).end(); }
    } catch { res.status(action === 'register' ? 400 : 401).json({ error: action === 'register' ? 'INVALID_REGISTRATION' : 'INVALID_CREDENTIALS_OR_SESSION' }); }
    finally { inFlight--; }
  });
  const requests = new Map<string, { count: number; until: number }>();
  for (const action of ['email/request', 'email/verify', 'recovery', 'password/reset'] as const) app.post(`/auth/${action}`, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!auth.recovery) { res.status(503).json({ error: 'RECOVERY_NOT_CONFIGURED' }); return; }
    const now = auth.now();
    for (const [key, record] of requests) if (record.until <= now) requests.delete(key);
    const key = req.ip ?? 'unknown', record = requests.get(key) ?? { count: 0, until: now + 60000 };
    if (record.count >= 20 || inFlight >= 2 || requests.size >= 1000 && !requests.has(key)) { res.status(429).json({ error: 'TRY_LATER' }); return; }
    record.count++; requests.set(key, record); inFlight++;
    let queued = false;
    try {
      if (action === 'recovery') {
        const input = recoveryRequestSchema.parse(req.body);
        // Delivery runs out of the response path so SMTP latency cannot reveal existence.
        queued = true;
        void auth.recovery.requestReset(input).catch(() => {}).finally(() => { inFlight--; });
        await delay(100);
        res.status(202).json({ accepted: true });
      } else if (action === 'email/request') {
        await auth.recovery.requestVerification(req.headers.authorization?.replace(/^Bearer /, '') ?? '', req.body);
        res.status(202).json({ accepted: true });
      } else {
        if (action === 'email/verify') await auth.recovery.verifyEmail(req.body);
        else await auth.recovery.resetPassword(req.body);
        res.status(204).end();
      }
    } catch { res.status(400).json({ error: 'INVALID_REQUEST_OR_TOKEN' }); }
    finally { if (!queued) inFlight--; }
  });
  const invalidBody: ErrorRequestHandler = (_error, _req, res, next) => { void next; res.status(400).json({ error: 'INVALID_REQUEST' }); };
  app.use('/auth', invalidBody);
}
