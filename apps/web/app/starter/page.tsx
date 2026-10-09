import World from '../world';
import Link from 'next/link';
export default function Page() {
  return <main><h1>Starter Village — SAFE</h1>
    <p>WASD di chuyển, cuộn để zoom. Map chính thức; phòng preview local chưa xác thực. Nhân vật South tĩnh dùng kiểm tra tỷ lệ, chưa phải bộ animation phát hành.</p>
    <Link href="/">Về phòng thử nền tảng</Link>
    <World starter />
  </main>;
}
