# Kiểm thử nền tảng

Fixture FOUNDATION_WORLD chỉ là phòng kỹ thuật, không phải map/balance phát hành. Unit tests dùng dữ liệu cục bộ; `Runtime` trong game-core cho phép truyền clock/RNG, không định nghĩa xác suất nghiệp vụ. FoundationRoom nhận clock qua `now`, mặc định Date.now; simulation vẫn dùng fixed timestep.

- `pnpm test`: domain, contract, server hai client thật, coordinate client và orchestrator mock. Server test dùng cổng ephemeral và shutdown trong afterAll.
- `pnpm db:test`: chỉ cho phép database local `127.0.0.1/mmorpg_test`, ID riêng mỗi lượt, transaction rollback và disconnect trong finally. Không đổi TEST_DATABASE_URL sang DB production.
- `pnpm build` rồi `pnpm test:e2e`: Playwright khởi động server/web riêng, reuseExistingServer=false; kiểm tra hai browser, collision, disconnect/reload. Playwright quản lý vòng đời process/context; không dùng phiên đăng nhập production.

Khi thêm cơ chế ngẫu nhiên hoặc timeout mới, truyền Runtime/clock vào logic và dùng fixture deterministic; không thay Date.now/Math.random toàn process.

## Transaction và idempotency

`atomicOperation` dùng PostgreSQL advisory transaction lock cho scope/key, kiểm tra hash của payload canonical và lưu result cùng transaction với callback. Scope phải do server suy ra từ actor/operation tin cậy, không nhận trực tiếp từ client. Callback chỉ ghi qua TransactionClient; không gửi HTTP/email hoặc tác dụng ngoài DB. Retry trả receipt sau commit; cùng khóa khác payload bị từ chối. Không tự retry timeout hoặc đặt chính sách TTL; retention/cleanup theo nghiệp vụ sẽ quyết định sau.

Migration operation_receipts được deploy và kiểm chứng trên mmorpg_test, chưa áp dụng mmorpg_dev. Trước dùng model mới ở dev chạy `pnpm db:migrate` sau review migration additive. `pnpm db:test` kiểm tra concurrent credit/debit bằng giá trị probe kỹ thuật (không phải Gold), mất response sau commit, lỗi mô phỏng trước commit và conflict; chỉ dọn scope/ID riêng vừa tạo. Lỗi trước commit mô phỏng bằng exception, chưa kiểm tra kill OS/PostgreSQL mất điện.

## Cấu hình

`loadGameplayConfig` nhận dữ liệu chưa tin cậy, kiểm tra schema strict, ID/tham chiếu Map–Area, số hữu hạn, bounds/collision spawn và zoom. FOUNDATION_WORLD được validate ngay khi import; server kiểm tra catalog trước khi tạo phòng. WORLD_UNIT=32 truy vết GAME_SPEC 2.1 là CHỐT; moveSpeed, tick, footprint, renderScale/zoom và obstacle là dữ liệu fixture có thể thay theo catalog được duyệt. Chưa có stats, EXP, damage, loot hoặc các bảng cân bằng đang chờ D; loader không tự sinh default nghiệp vụ cho các bảng này.
