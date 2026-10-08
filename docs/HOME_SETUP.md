# Kiểm tra máy nhà — 08/10/2026 (Asia/Bangkok)

Chỉ setup và kiểm tra bàn giao. Không phát triển gameplay, sửa GAME_SPEC/CHỐT, push/deploy, chạy auto-dev.ps1/codex exec hoặc reset DB. Không tạo dữ liệu để che lỗi; dùng suite test hiện hữu trên DB test cô lập.

## Kết luận

Runtime local PASS; toàn bộ nghiệm thu FAIL vì E2E Starter Village thất bại hai lượt. Trang /starter vẫn tải map thật, connected, không pageerror và health ok; đã xem screenshot logs/home-setup/starter-live.png. FE/BE đang chạy tại http://127.0.0.1:3137/starter và http://127.0.0.1:2567/health, bằng pnpm --filter @mmorpg/web start --port 3137 và pnpm --filter @mmorpg/server exec node dist/index.js --foundation --starter-preview. Auth local được kiểm trong DB/E2E, không bật ở server preview đang giữ chạy. Frontend login T11 chưa có.

## Môi trường

- Node 20.20.2, pnpm 10.34.0, Git 2.52.0.windows.1 PASS.
- Docker Engine 29.8.2, Compose 5.5.1, PostgreSQL 17-alpine healthy; bind 127.0.0.1:54329. Volume mới ai-mmorpg_foundation_postgres; không phải dữ liệu chuyển từ máy công ty. mmorpg_dev và mmorpg_test có thật; dev còn 0 public tables, không migrate dev.
- pnpm install --frozen-lockfile PASS; optional msgpackr-extract script vẫn bị chặn theo allowlist hiện hữu, không mở quyền chạy script đó.
- Prisma 6.19.3 validate/generate PASS; đủ 5 migrations trên mmorpg_test, db:test PASS cả database/transactions/characters/starter/auth. Lượt kiểm trước interruption đã áp dụng migrations; lượt sau xác nhận không còn pending. Không reset/drop.
- Lệnh python trên PATH FAIL (Windows Store alias). Python bundled Codex 3.12.14 chạy được; numpy 2.3.5/Pillow 12.3.0 PASS. Executable: C:\Users\nhimc\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe.
- FFmpeg 9.0.2 PASS. Forge đủ 5 skills, 164 files khớp manifest. Doctor ban đầu FAIL encoding cp1252; đặt PYTHONUTF8=1 trong shell kiểm tra thì 0 FAIL, overall WARN. scipy/resvg-py chưa có (tùy chọn cho nhánh xử lý tương ứng); host image_gen available, không gọi sinh asset. API keys chưa cấu hình; chưa có route video; local CLI generation chưa verify phiên bản mới, không gọi codex exec để verify.

## Gates và lỗi còn lại

- lint/typecheck/build PASS. Log ở logs/home-setup/{lint,typecheck,build}.log.
- 19 unit/integration PASS; mock orchestrator ban đầu 30/31 do Windows PowerShell chặn script mock. Đặt PSExecutionPolicyPreference=RemoteSigned chỉ trong tiến trình kiểm thử, pnpm test chạy lại PASS 31/31; không đổi policy máy/user, code hoặc assertion. Log test.log/test-retry.log giữ cả hai kết quả.
- Playwright Chromium đã cài. test:e2e hai lượt: auth và foundation hai browser PASS; starter FAIL tại tests/e2e/starter.spec.ts:27, expected x<328, received 336 rồi 328. Có dấu hiệu phụ thuộc cadence input/patch và điểm dừng test; chưa kết luận lỗi gameplay. Không nới assertion/sửa test. Log e2e.log/e2e-retry.log, ảnh lỗi đầu starter-failure.png và trace lượt cuối trong test-results.
- node scripts/build-starter-runtime.mjs --check PASS.

## Biến môi trường và việc thủ công

Template đúng nằm ở apps/server/.env.example, không có template root. DATABASE_URL/TEST_DATABASE_URL/AUTH_SESSION_TTL_MS chưa có trong shell ban đầu. Đã tạo apps/server/.env từ template non-secret, Git ignored; Prisma và entrypoint không tự nạp file này. Dùng biến shell trỏ mmorpg_test cho kiểm chứng; E2E đặt TTL 120000ms riêng cho test. NEXT_PUBLIC_SERVER_URL có fallback loopback, PORT fallback 2567; preview không cần DB/auth env.

Để chạy Forge bằng lệnh python thường: cài/chọn Python thật và sửa PATH/Store alias; hoặc dùng absolute path bundled ở trên, đặt PYTHONUTF8=1. Không cần API key để chạy game/map đã commit. Nếu cần sinh animation mới phải chuẩn bị route video; chưa tự cài hoặc cấu hình provider.

Để bật auth local ngoài E2E: chọn DATABASE_URL local đã migrate và AUTH_SESSION_TTL_MS do người vận hành lựa chọn. Không lấy TTL test thành policy production. DB dev mới chưa có schema: kiểm tra đúng URL/local trước khi migrate nếu muốn dùng auth với DB dev. Nếu cần dữ liệu máy công ty phải chuyển backup riêng; clone Git không mang DB volume. Không đưa secrets production vào local.

## Git và bàn giao

Branch main; HEAD bcf04e8, sau 6878577 (bàn giao) và 21613ff (triển khai). Cả checkpoint là ancestor của HEAD, Git sạch trước kiểm tra. Commit bcf04e8 đã đưa đúng 30 dòng D01/starter vào GAME_SPEC; không apply pending patch lần nữa. GAME_SPEC SHA256 giữ nguyên trong lượt setup: 1c34ddfebbbfcf497b06bcbb3edf82aeb623cb7648d623c226d2057e42b83746d (so sánh không phân biệt hoa thường); hash bàn giao khác; chưa xác minh nguyên nhân khác hash, đã đối chiếu commit 30 dòng và các mục CHỐT. Nội dung 3.1/3.2 có trong HEAD.

T59 DONE theo registry/checkpoint và báo cáo Forge/browser cũ; map consistency và load/connect hiện PASS. Browser acceptance hiện có regression chưa giải quyết nên không tuyên bố mọi kiểm tra T59 máy nhà PASS.

T09 DOING/PAUSE: core registration, scrypt, DB session, replacement, reconnect 30 giây, expiry/logout đã kiểm lại PASS. Account recovery còn thiếu gửi email thật, email verification và recovery token/reset flow/test; sendRecoveryEmail chỉ throw RECOVERY_NOT_CONFIGURED, HTTP 503. Chủ sản phẩm đã hoãn đến production. Cần yêu cầu resume và quyết định triển khai phần hoãn/provider/cấu hình trước khi hoàn tất T09; không tự mark DONE hoặc mở T10/T11/T13.

D02–D14 và D15 phần tên/đổi tên/xóa vẫn BLOCKED. A02/A03/T17 đầy đủ chưa DONE; actor South tĩnh. Setup không thay trạng thái task.
