# T09 — xác thực local và phần chưa hoàn tất

Backend local có register/login/logout và room có xác thực. Đăng ký nhận username/password/class/requestId; các trường HP/KI/Gold/vị trí từ client bị strict schema từ chối. Username lưu nguyên văn, chưa có chính sách chuẩn hóa hay tên Character mới được CHỐT. Giới hạn độ dài payload là giới hạn tài nguyên transport, không phải balance.

Account, Credential, Character và CharacterInitialization tạo cùng transaction/idempotency receipt. Retry cùng requestId phải khớp username/class/password; receipt không chứa password hoặc fast hash của password. Unique username và account-character ở PostgreSQL chặn request đồng thời. Dữ liệu khởi đầu dùng config GAME_SPEC 3.2 và registry đã kiểm định; EXP=0n, max=current, PK OFF; không tạo threshold/công thức D02.

Password dùng async native Node scrypt với salt ngẫu nhiên 16 bytes, N=2^17/r=8/p=1 và timingSafeEqual. Tham khảo [Node crypto](https://nodejs.org/docs/latest-v20.x/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback) và [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Không có library/script mới được cài. Token opaque ngẫu nhiên 32 bytes; DB chỉ lưu SHA256 token, expiry và session ID. Login lock Account và thay duy nhất GameplaySession; phiên cũ bị disconnect trong process, đồng thời validation DB vô hiệu hóa token cũ.

Room nhận `{version:1, token, reconnect?:boolean}`. Mỗi join/re-join và tick nhận movement kiểm session hiện tại ở server. Entity ID là Character UUID, không phải transport sessionId. Mất kết nối giữ Character/vị trí 30 giây theo clock server; authenticated re-join với `reconnect:true` khôi phục cùng Character. Quá hạn xóa khỏi active world và từ chối reconnect; không tạo Character mới. Không dùng native Colyseus reconnection token để bỏ qua validation. Logout/expiry loại active connection; state broadcast không chứa account credential/token.

Theo xác nhận mới của chủ sản phẩm, gửi email recovery tạm hoãn đến production. `sendRecoveryEmail()` chưa gửi gì và báo `RECOVERY_NOT_CONFIGURED`; endpoint trả HTTP 503, không xác minh email giả hoặc trả thành công giả. Email verification/recovery token flow chưa triển khai/kiểm thử. D01 không bị sửa. **T09 chưa DONE đầy đủ**, các test chỉ chứng minh core auth/session local và recovery chưa khả dụng.

Các endpoint chỉ được bật bằng `--auth-local`, không bật production. Chưa nghiệm thu vận hành nhiều process, TLS, rate-limit phân tán hoặc frontend auth T11. HTTP có JSON body limit, giới hạn hai tác vụ hash đang xử lý qua endpoint, bearer auth không cookie và Cache-Control no-store; không log body/credential. Session TTL là config bắt buộc, không tự đặt TTL production. Cấu hình 120000ms trong E2E chỉ phục vụ test expiry, không là quy tắc CHỐT.

Chạy kiểm chứng:

```powershell
# Chỉ DB test cô lập, không reset DB:
$env:DATABASE_URL='postgresql://postgres@127.0.0.1:54329/mmorpg_test'
pnpm db:migrate
pnpm db:test
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

E2E tự bật auth-local với DB mmorpg_test và TTL test. Cleanup chỉ xóa rows có UUID/requestId của lượt test. Migration 004/005 additive; dữ liệu Account/Character cũ được giữ nguyên, không tự backfill credentials/initialization. DB dev chưa được migrate trong lượt này. Rollback ứng dụng có thể chạy code cũ cùng bảng mới; không tự drop bảng/cột. Các bảng mới chưa dùng cho production.

Chạy backend local riêng: đặt DATABASE_URL local đã migrate và AUTH_SESSION_TTL_MS hợp lệ do người vận hành lựa chọn, rồi `pnpm --filter @mmorpg/server exec node dist/index.js --auth-local`. Web `/starter` hiện vẫn nối room preview để xem map; frontend login/session là T11, chưa tự đánh dấu hoàn tất.
