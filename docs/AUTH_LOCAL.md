# T09 — xác thực và account recovery local

Backend local có register/login/logout và room có xác thực. Đăng ký nhận username/password/class/requestId; các trường HP/KI/Gold/vị trí từ client bị strict schema từ chối. Username lưu nguyên văn, chưa có chính sách chuẩn hóa hay tên Character mới được CHỐT. Giới hạn độ dài payload là giới hạn tài nguyên transport, không phải balance.

Account, Credential, Character và CharacterInitialization tạo cùng transaction/idempotency receipt. Retry cùng requestId phải khớp username/class/password; receipt không chứa password hoặc fast hash của password. Unique username và account-character ở PostgreSQL chặn request đồng thời. Dữ liệu khởi đầu dùng config GAME_SPEC 3.2 và registry đã kiểm định; EXP=0n, max=current, PK OFF; không tạo threshold/công thức D02.

Password dùng async native Node scrypt với salt ngẫu nhiên 16 bytes, N=2^17/r=8/p=1 và timingSafeEqual. Tham khảo [Node crypto](https://nodejs.org/docs/latest-v20.x/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback) và [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Không có library/script mới được cài. Token opaque ngẫu nhiên 32 bytes; DB chỉ lưu SHA256 token, expiry và session ID. Login lock Account và thay duy nhất GameplaySession; phiên cũ bị disconnect trong process, đồng thời validation DB vô hiệu hóa token cũ.

Room nhận `{version:1, token, reconnect?:boolean}`. Mỗi join/re-join và tick nhận movement kiểm session hiện tại ở server. Entity ID là Character UUID, không phải transport sessionId. Mất kết nối giữ Character/vị trí 30 giây theo clock server; authenticated re-join với `reconnect:true` khôi phục cùng Character. Quá hạn xóa khỏi active world và từ chối reconnect; không tạo Character mới. Không dùng native Colyseus reconnection token để bỏ qua validation. Logout/expiry loại active connection; state broadcast không chứa account credential/token.

Theo yêu cầu resume mới, đã triển khai xác minh email và recovery theo D01; không tự bắt buộc verified email cho login. EmailDelivery được inject; không cấu hình transport thì các endpoint email vẫn trả 503 RECOVERY_NOT_CONFIGURED. Mock chỉ dùng test, không giả gửi mail production. GAME_SPEC giữ nguyên.

| Endpoint POST | Input | Kết quả |
|---|---|---|
| /auth/email/request | Bearer phiên hiện tại; email, password hiện tại | 202; gửi token xác minh tới email yêu cầu; không cập nhật địa chỉ verified trước xác minh |
| /auth/email/verify | token | 204; token đúng mục đích/còn hạn/dùng một lần mới cập nhật email verified |
| /auth/recovery | username | 202 với cùng body cho account không tồn tại/chưa verified/verified; chỉ gửi tới địa chỉ đã verified |
| /auth/password/reset | token, password, confirmation | 204; hash mật khẩu mới, thu hồi mọi session/challenge của account, ngắt gameplay; không tự login |

Token ngẫu nhiên 32 bytes, DB chỉ giữ SHA256, ràng buộc account/purpose/email và TTL từ config. Row lock Account chống concurrent consume/login/reset; login kiểm lại hash sau lock để không tạo phiên từ mật khẩu đã reset. Resend thay token cũ sau cooldown; cooldown lưu DB và HTTP giới hạn IP/window/bounded concurrent workers là giới hạn tài nguyên kỹ thuật local, không là business balance. Gửi reset chạy ngoài đường response; response có scheduling floor100ms chung, không chờ latency email. Lỗi delivery xóa challenge tương ứng, không log credential/token. Đổi địa chỉ chỉ sau proof và vô hiệu reset cũ; reset vô hiệu verification đang chờ. Tham khảo [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

Mock side channel: --test-email yêu cầu NODE_ENV=test, URL loopback /mmorpg_test, EMAIL_MOCK_FILE, AUTH_EMAIL_TOKEN_TTL_MS và AUTH_EMAIL_COOLDOWN_MS. Mailbox JSONL chứa token **chỉ test**, nằm trong logs ignored; không có API đọc mailbox. Test dùng địa chỉ example.invalid, không gửi email thật. E2E tự cấu hình TTL120000/cooldown1000 test-only; chưa chọn TTL hoặc nhà cung cấp email production. Không in/copy mailbox vào commit hoặc báo cáo.

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
