import World from './world';
import Link from 'next/link';
export default function Page() {
  return <main><h1>Phòng thử nền tảng MMORPG</h1>
    <p>WASD để di chuyển, cuộn để zoom. Server quyết định vị trí và va chạm vùng chân.</p>
    <p className="notice">Cảnh kỹ thuật local, chưa đăng nhập hoặc lưu nhân vật. Hình học là dữ liệu thử. Asset South chỉ có một frame tĩnh; chưa có animation N/E/S/W hoặc RUN.</p>
    <Link href="/starter">Mở preview Starter Village</Link>
    <World />
  </main>;
}
