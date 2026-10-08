import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authBackend, SESSION_COOKIE } from '../auth-server';
import Game from './game';
export default async function GamePage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');
  let response: Response;
  try { response = await fetch(`${authBackend()}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) }); }
  catch { return <main><h1>Không thể kết nối server</h1><a href="/game">Thử lại</a></main>; }
  if (response.status === 401) redirect('/login?expired=1');
  if (!response.ok) return <main><h1>Không thể tải nhân vật</h1><a href="/game">Thử lại</a></main>;
  return <main><h1>Starter Village — Nhân vật của bạn</h1><Game /></main>;
}
