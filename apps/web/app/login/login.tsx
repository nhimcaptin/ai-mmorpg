'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
export default function Login() {
  const router = useRouter(), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { if (new URLSearchParams(window.location.search).has('expired')) setMessage('Phiên đã hết hạn hoặc bị thay thế. Vui lòng đăng nhập lại.'); }, []);
  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('Đang xử lý…');
    const form = event.currentTarget, fields = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch(`/api/auth/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      if (!response.ok) throw new Error();
      if (action === 'login') await response.json(); // Finish response before route navigation.
      form.reset();
      if (action === 'login') { router.replace('/game'); router.refresh(); }
      else setMessage(action === 'recovery' ? 'Nếu tài khoản có email đã xác minh, hướng dẫn khôi phục sẽ được gửi tới email đó.' : 'Thành công. Bạn có thể đăng nhập bằng mật khẩu hiện tại.');
    } catch { setMessage(action === 'login' ? 'Không thể đăng nhập. Kiểm tra thông tin hoặc thử lại.' : 'Không thể xử lý. Kiểm tra mã, thông tin và cấu hình email rồi thử lại.'); }
    finally { setBusy(false); }
  }
  return <div className="auth-panel">
    <p role="status" aria-live="polite">{message}</p>
    <form aria-label="Đăng nhập tài khoản" onSubmit={event => void submit(event, 'login')}>
      <label>Tên đăng nhập<input name="username" autoComplete="username" required maxLength={256} /></label>
      <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required maxLength={1024} /></label>
      <button disabled={busy}>Đăng nhập</button>
    </form>
    <details><summary>Quên mật khẩu</summary>
      <form aria-label="Khôi phục mật khẩu" onSubmit={event => void submit(event, 'recovery')}>
        <label>Tên tài khoản cần khôi phục<input name="username" autoComplete="username" required maxLength={256} /></label>
        <button disabled={busy}>Gửi hướng dẫn khôi phục</button>
      </form>
    </details>
    <details><summary>Xác minh email bằng mã</summary>
      <form aria-label="Xác minh email" onSubmit={event => void submit(event, 'email/verify')}>
        <label>Mã xác minh<input name="token" autoComplete="off" required pattern="[a-f0-9]{64}" /></label>
        <button disabled={busy}>Xác minh email</button>
      </form>
    </details>
    <details><summary>Đặt lại mật khẩu bằng mã</summary>
      <form aria-label="Đặt lại mật khẩu" onSubmit={event => void submit(event, 'password/reset')}>
        <label>Mã khôi phục<input name="token" autoComplete="off" required pattern="[a-f0-9]{64}" /></label>
        <label>Mật khẩu mới<input name="password" type="password" autoComplete="new-password" required maxLength={1024} /></label>
        <label>Nhập lại mật khẩu<input name="confirmation" type="password" autoComplete="new-password" required maxLength={1024} /></label>
        <button disabled={busy}>Đặt lại mật khẩu</button>
      </form>
    </details>
  </div>;
}
