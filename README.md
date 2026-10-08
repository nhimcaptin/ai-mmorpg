# Nền tảng 2D MMORPG

Phase 1: pnpm/Turborepo, Next.js/React/Phaser, Node.js/Colyseus, pure TypeScript game-core, shared contracts và PostgreSQL/Prisma.

## Chạy local

Yêu cầu Node >=20.9, pnpm 10.34.0. Docker Engine cần chạy để kiểm tra persistence.

```powershell
pnpm install --frozen-lockfile
pnpm db:generate
pnpm dev
```

Web: http://127.0.0.1:3000. Server: http://127.0.0.1:2567/health. Mở hai cửa sổ trình duyệt; WASD di chuyển và scroll zoom. `dev` khởi động phòng thử bằng cờ `--foundation`; server bind loopback. Cờ này bị từ chối trong NODE_ENV=production, không có endpoint đăng nhập tạm hoặc ghi nhân vật vào DB.

Phòng thử dùng hình học collision được hiển thị rõ và cấu hình `FOUNDATION_WORLD` trong packages/shared. World unit 32px; tọa độ x/y là chân, collision footprint độc lập sprite. Input không chứa vị trí; server tick cố định, normalize diagonal, kiểm sequence và timeout. Phaser hiển thị state server, không dự đoán client trong Phase 1. React không quản lý vị trí từng tick.

Tốc độ, bounds, spawn, obstacle và footprint là fixture hạ tầng, chưa phải balance/map phát hành. Asset South là một frame PNG được tạo thật và kiểm định, không phải bộ IDLE/RUN hoàn chỉnh. Không giả lập hướng/animation bằng lật hoặc lặp frame. Cảnh này chưa có auth, persistence gameplay, combat hoặc economy; không mark các hệ thống đó hoàn tất.

## PostgreSQL local

```powershell
docker compose up -d postgres
pnpm db:validate
pnpm db:migrate
# Migration test DB riêng, chỉ áp dụng trên DB local mới do Compose tạo.
$env:DATABASE_URL = 'postgresql://postgres@127.0.0.1:54329/mmorpg_test'
pnpm db:migrate
Remove-Item Env:DATABASE_URL
pnpm db:test
```

Compose dùng PostgreSQL 17, port loopback 54329, volume riêng và tạo mmorpg_dev/mmorpg_test khi volume mới được khởi tạo. Trust authentication chỉ cho local, không có secrets thật trong repo. Không xóa/reset volume cũ. `prisma.config.ts` lấy DATABASE_URL từ môi trường, fallback local dev; cấu hình Prisma không tự nạp `.env`. `.env.example` là tham khảo để export biến vào shell, không chứa credential production.

Schema hiện chỉ có FoundationProbe để chứng minh migration/transaction/rollback. Test DB chỉ chấp nhận hostname 127.0.0.1 và database mmorpg_test, không ghi vào DB game hoặc remote. Test rollback dữ liệu probe, đóng client trong finally. Account/Character chờ nhiệm vụ và quyết định nghiệp vụ phù hợp.

## Kiểm chứng

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright tự khởi động production web build ở cổng 3137 và server local thử ở 2567, rồi đóng các tiến trình; không dùng server sẵn có. Test hai context, movement replication, collision, resize, disconnect và reload. Screenshot/trace ở test-results; cần build trước E2E. Vitest server dùng threads để tránh IPC monitoring của Colyseus.

pnpm chỉ cho phép lifecycle scripts của Prisma, esbuild và sharp; optional msgpackr-extract native build chưa được cho chạy. CI workflow có quality gates; chưa push hoặc chạy CI remote. Tiến độ thực tế và các mục bị chặn ở docs/progress.md.
