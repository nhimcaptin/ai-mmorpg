# Kiểm thử nền tảng

Fixture FOUNDATION_WORLD chỉ là phòng kỹ thuật, không phải map/balance phát hành. Unit tests dùng dữ liệu cục bộ; `Runtime` trong game-core cho phép truyền clock/RNG, không định nghĩa xác suất nghiệp vụ. FoundationRoom nhận clock qua `now`, mặc định Date.now; simulation vẫn dùng fixed timestep.

- `pnpm test`: domain, contract, server hai client thật, coordinate client và orchestrator mock. Server test dùng cổng ephemeral và shutdown trong afterAll.
- `pnpm db:test`: chỉ cho phép database local `127.0.0.1/mmorpg_test`, ID riêng mỗi lượt, transaction rollback và disconnect trong finally. Không đổi TEST_DATABASE_URL sang DB production.
- `pnpm build` rồi `pnpm test:e2e`: Playwright khởi động server/web riêng, reuseExistingServer=false; kiểm tra hai browser, collision, disconnect/reload. Playwright quản lý vòng đời process/context; không dùng phiên đăng nhập production.

Khi thêm cơ chế ngẫu nhiên hoặc timeout mới, truyền Runtime/clock vào logic và dùng fixture deterministic; không thay Date.now/Math.random toàn process.
