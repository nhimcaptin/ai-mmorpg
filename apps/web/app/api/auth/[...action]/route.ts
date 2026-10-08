import { NextRequest, NextResponse } from 'next/server';
import { accountSessionSchema } from '@mmorpg/shared';
import { authBackend, SESSION_COOKIE } from '../../../auth-server';
type Context = { params: Promise<{ action: string[] }> };
const noStore = { 'Cache-Control': 'no-store' };
function error(status: number) { return NextResponse.json({ error: status === 401 ? 'INVALID_SESSION' : 'REQUEST_FAILED' }, { status, headers: noStore }); }
async function forward(request: NextRequest, context: Context) {
  const action = (await context.params).action.join('/');
  const allowed = request.method === 'GET' ? ['me', 'world-session'] : ['login', 'logout', 'email/request', 'email/verify', 'recovery', 'password/reset'];
  if (!allowed.includes(action)) return error(404);
  // Next normalizes loopback nextUrl to localhost; browser Origin retains the Host.
  const host = request.headers.get('host');
  if (!host || !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return error(403);
  if (request.method === 'POST' && request.headers.get('origin') !== `${request.nextUrl.protocol}//${host}`) return error(403);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  try {
    const body = request.method === 'POST' ? await request.text() : undefined;
    if (body && Buffer.byteLength(body) > 8192) return error(413);
    const response = await fetch(`${authBackend()}/auth/${action === 'world-session' ? 'me' : action}`, {
      method: request.method, cache: 'no-store', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body
    });
    if (!response.ok) {
      const failed = error(response.status);
      if (response.status === 401) failed.cookies.delete(SESSION_COOKIE);
      return failed;
    }
    if (action === 'login') {
      const session = await response.json() as { token: string; expiresAt: string; sessionId: string };
      if (!/^[a-f0-9]{64}$/.test(session.token) || !Number.isFinite(Date.parse(session.expiresAt))) return error(502);
      const result = NextResponse.json({ expiresAt: session.expiresAt }, { headers: noStore });
      result.cookies.set(SESSION_COOKIE, session.token, { httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/', expires: new Date(session.expiresAt) });
      return result;
    }
    if (action === 'me' || action === 'world-session') {
      const session = accountSessionSchema.parse(await response.json());
      return NextResponse.json(action === 'me' ? session : { session, token }, { headers: noStore });
    }
    const result = response.status === 204 ? new NextResponse(null, { status: 204, headers: noStore }) : NextResponse.json(await response.json(), { status: response.status, headers: noStore });
    if (action === 'logout') result.cookies.delete(SESSION_COOKIE);
    return result;
  } catch { return error(503); }
}
export const GET = forward;
export const POST = forward;
