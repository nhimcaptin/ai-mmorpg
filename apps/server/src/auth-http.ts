import type { Express, ErrorRequestHandler } from 'express';
import express from 'express';
import type { AuthService } from './auth.js';
import { sendRecoveryEmail } from './recovery.js';
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
  app.post('/auth/recovery', async (_req, res) => {
    try { await sendRecoveryEmail(); } catch { res.status(503).json({ error: 'RECOVERY_NOT_CONFIGURED' }); }
  });
  const invalidBody: ErrorRequestHandler = (_error, _req, res, next) => { void next; res.status(400).json({ error: 'INVALID_REQUEST' }); };
  app.use('/auth', invalidBody);
}
