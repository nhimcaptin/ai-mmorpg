'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { accountSessionSchema, type AccountSession } from '@mmorpg/shared';
import World from '../world';
const classNames = { PHYSICAL_DPS: 'Sát thương vật lý', MAGIC_DPS: 'Sát thương phép', TANK: 'Đỡ đòn' };
export default function Game() {
  const router = useRouter(), [session, setSession] = useState<AccountSession>(), [auth, setAuth] = useState<{ token: string; characterId: string }>();
  const [message, setMessage] = useState('Đang kiểm tra phiên…'), [busy, setBusy] = useState(false);
  const invalid = useCallback(() => { setAuth(undefined); router.replace('/login?expired=1'); router.refresh(); }, [router]);
  useEffect(() => {
    let disposed = false;
    void fetch('/api/auth/world-session', { cache: 'no-store' }).then(async response => {
      if (response.status === 401) { if (!disposed) invalid(); return; }
      if (!response.ok) throw new Error();
      const data = await response.json() as { session: unknown; token: string };
      const current = accountSessionSchema.parse(data.session);
      if (!disposed) { setSession(current); setAuth({ token: data.token, characterId: current.character.id }); setMessage(''); }
    }).catch(() => { if (!disposed) setMessage('Không thể tải phiên. Tải lại trang để thử lại.'); });
    const timer = setInterval(() => { void fetch('/api/auth/me', { cache: 'no-store' }).then(response => { if (!disposed && response.status === 401) invalid(); }).catch(() => {}); }, 5000);
    return () => { disposed = true; clearInterval(timer); };
  }, [invalid]);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(invalid, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [session, invalid]);
  async function logout() {
    if (busy) return; setBusy(true);
    try { const response = await fetch('/api/auth/logout', { method: 'POST' }); if (!response.ok && response.status !== 401) throw new Error(); invalid(); }
    catch { setMessage('Không thể đăng xuất. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  async function requestEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); const form = event.currentTarget;
    try {
      const response = await fetch('/api/auth/email/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      if (response.status === 401) { invalid(); return; }
      if (!response.ok) throw new Error(); form.reset(); setMessage('Đã yêu cầu mã xác minh email. Dùng mã trong mục Xác minh email tại trang đăng nhập.');
    } catch { setMessage('Không thể gửi mã. Kiểm tra mật khẩu và cấu hình email rồi thử lại.'); }
    finally { setBusy(false); }
  }
  return <>
    <p role="status">{message}</p>
    {session && <div className="toolbar"><span data-testid="character-id" data-character-id={session.character.id}>Class: {classNames[session.character.class]}</span><span>Email: {session.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</span><button disabled={busy} onClick={() => void logout()}>Đăng xuất</button></div>}
    {auth && <World starter auth={auth} onSessionInvalid={invalid} />}
    <details className="auth-panel" data-block-world-input><summary>Xác minh địa chỉ email để khôi phục tài khoản</summary>
      <form onSubmit={event => void requestEmail(event)}><label>Email<input name="email" type="email" required maxLength={254} /></label><label>Mật khẩu hiện tại<input name="password" type="password" autoComplete="current-password" required /></label><button disabled={busy}>Gửi mã xác minh</button></form>
    </details>
    <p className="notice">Nhân vật hiện dùng frame South tĩnh đã kiểm định; bộ animation đầy đủ đang chờ nghiệm thu.</p>
  </>;
}
