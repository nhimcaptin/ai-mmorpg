# Bộ điều phối phát triển tự chủ

Chỉ điều phối từng tác vụ nhỏ đã đủ phụ thuộc; không tự quyết nghiệp vụ. Lượt xây dựng bộ công cụ này chỉ dùng Codex giả lập và dry-run, chưa bắt đầu phát triển game tự chủ.

## Điều kiện chạy

- Node.js ≥20.9, PowerShell 5.1 hoặc mới hơn, Git, pnpm và Codex CLI đã xác thực. Không cài dependency tự động.
- CLI phải có `exec --help`: `--sandbox`, `--ignore-user-config`, `--output-schema`, `--json`, `--output-last-message`, `--cd`; root help phải hỗ trợ `--ask-for-approval on-request` và `--no-daemon`. Đã kiểm tra bản 0.161.0. Thiếu cờ thì dừng.
- Chạy thật yêu cầu HEAD và Git sạch, gồm index và file untracked. Người dùng tự xem diff và tạo commit nền trước; công cụ không gom thay đổi có sẵn của người dùng vào checkpoint. `logs/` phải được ignore.
- Git hook tùy chỉnh làm preflight dừng để tránh commit kích hoạt push/deploy hoặc sửa file. Công cụ không tự tắt/bypass hook.
- PostgreSQL/Prisma và browser Playwright cần sẵn khi task/test sử dụng. Thiếu môi trường, quyền hoặc quyết định D: dừng, không cài hay đổi luật tự động.

## Lệnh

Chạy từ root repository, không dùng `ExecutionPolicy Bypass`:

```powershell
# Kiểm thử bộ điều phối bằng Codex/pnpm giả; Git thật chỉ trong repo tạm
node --test tests/orchestrator/auto-dev.test.mjs

# Xem task kế tiếp, dependencies và điều kiện chạy, không gọi phiên phát triển
powershell -NoProfile -File .\scripts\auto-dev.ps1 -DryRun -MaxTasks 1 -MaxMinutes 30

# Kiểm chứng độc lập mã hiện tại, thêm browser smoke
powershell -NoProfile -File .\scripts\verify.ps1 -E2E -MaxMinutes 30

# Chỉ chạy khi người dùng đã chủ động quyết định bắt đầu và Git sạch
powershell -NoProfile -File .\scripts\auto-dev.ps1 -MaxTasks 1 -MaxMinutes 30

# Dừng ngay khi gate đầu tiên thất bại
powershell -NoProfile -File .\scripts\auto-dev.ps1 -MaxTasks 1 -MaxMinutes 30 -StopOnFailure
```

`MaxTasks` mặc định 1, phạm vi 1–100. `MaxMinutes` mặc định 30, phạm vi 1–240, tính chung cho help, phiên, sửa, kiểm chứng và checkpoint. Mỗi task có một phiên đầu và tối đa **3 phiên sửa** mới, tuần tự. `StopOnFailure` mặc định false cho phép sửa gate thất bại; true dừng ngay. Cả hai luôn dừng khi có blocker, session lỗi, JSON sai, vi phạm bảo vệ, timeout hoặc hết số lượt sửa. Không có chế độ tiếp tục qua task thất bại.

## Trạng thái và bằng chứng

`docs/tasks.md` chứa JSON registry giữa `AUTO_DEV_TASKS_START/END`: ID, kind, status, dependencies, assets, e2e. Tiêu chí vẫn lấy từ dòng bảng cùng ID. Thứ tự registry quyết định thứ tự chọn; chỉ `TODO` có tất cả dependency/asset `DONE` được chọn. Decision không bao giờ được chạy. Chu kỳ, tham chiếu sai, `DOING`/`FAILED` chưa xử lý làm chạy thật dừng. Các gói asset lớn cần chia task nhỏ và duyệt danh mục trước khi thực hiện.

Mỗi phiên sử dụng stdin và schema `scripts/auto-dev-result.schema.json`. Backend gọi tương đương:

```text
codex --no-daemon --ask-for-approval on-request exec --ignore-user-config --sandbox workspace-write -c approval_policy="on-request" -c sandbox_workspace_write.network_access=false --cd <root> --output-schema <schema> --json --output-last-message <result.json> -
```

Không dùng `danger-full-access`, approval `never`, cờ bypass, `--ignore-rules`, thêm thư mục writable hay tự động review approval. `--no-daemon` giữ vòng đời phiên trong cây tiến trình của controller. Cấu hình người dùng bị bỏ qua nhưng auth vẫn dùng CODEX_HOME. Execpolicy của dự án/người dùng vẫn được CLI áp dụng. Phiên không tương tác có thể không đáp ứng được yêu cầu approval; khi đó dừng và người dùng xử lý ngoài vòng tự chủ.

Kết quả worker chỉ là `READY_FOR_VERIFY`, `BLOCKED` hoặc `FAILED`, không được tự báo DONE. Controller kiểm tra schema, ID, exit code và `changedFiles` khớp Git diff; kiểm tra hash GAME_SPEC/AGENTS/tài liệu điều phối, HEAD/index và các lệnh quality gate. Không suy luận thành công từ văn xuôi assistant.

`verify` chạy lần lượt `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; fail đầu tiên dừng gate lượt đó. E2E bắt buộc khi metadata/worker yêu cầu hoặc diff liên quan web, asset, shared, domain, world-room, Playwright. Kết quả `verification.json` có exit code từng lệnh; không có exit code 0 đủ gate thì không checkpoint. Test DB chuyên biệt phải được task yêu cầu/triển khai trong unit/integration gate; controller không tự migration/reset DB.

Sau gate PASS, controller cập nhật registry DONE và ghi tiến độ tiếng Việt, stage **chỉ diff của task + hai tài liệu**, tạo commit local. BLOCKED/FAILED không commit. Git commit lỗi để nguyên index/diff và journal FAILED, cần kiểm tra thủ công. Không push/deploy, không rollback/clean/force.

## Log, gián đoạn và giới hạn an toàn

Log nằm `logs/auto-dev/<run-id>/`: help CLI, session JSONL, result JSON, gate log, verification JSON và summary JSON. `logs/verify/` dành cho kiểm chứng riêng. Journal hiện tại `logs/auto-dev-state.json`; lock `logs/auto-dev.lock` ngăn hai controller chạy đồng thời. Log có thể chứa nội dung mã và output công cụ; không commit/chia sẻ nếu chưa xem lại.

Ctrl+C/timeout kết thúc cây tiến trình **do lượt chạy tạo**, giữ nguyên file đang sửa và ghi FAILED/INTERRUPTED. Máy bị tắt cưỡng bức có thể để lại lock cùng trạng thái RUNNING/VERIFYING. Không tự replay hay tự hồi phục: đọc journal/log, xem Git diff, xác minh không còn tiến trình cũ, xử lý task và checkpoint thủ công. Sau khi xác nhận, đổi tên journal/lock cũ để lưu hồ sơ rồi mới khởi chạy lại. Không xóa thay đổi đang làm. Task BLOCKED chỉ mở lại khi chủ sản phẩm đã trả lời hoặc dependency/backend đã được xử lý, ghi nguồn quyết định trong progress.md.

Hash/diff là hàng rào phát hiện sau phiên, không phải bộ cô lập trước ghi: nếu worker vi phạm sửa file được bảo vệ, controller dừng và **giữ diff để người dùng xem**, không tự ghi đè để phục hồi. Sandbox CLI là hàng rào thực thi; controller không tự nâng quyền nếu sandbox Windows hoặc image backend không hoạt động. Không tuyên bố có thể ngăn một agent độc hại, tool ngoài sandbox hoặc concurrent editor; không chạy chung với một người/agent khác đang chỉnh repository. Gate PASS không tự chứng minh đủ mọi tiêu chí nghiệp vụ hay ngăn mọi cách sửa test sai; cần review checkpoint trước khi hợp nhất/phát hành.

Asset task đọc skill tại `.agents/skills/generate2dsprite/SKILL.md` / `generate2dmap/SKILL.md`. Không tự duyệt master art, tạo placeholder, chuyển paid API hoặc sinh full sheet khi thiếu phê duyệt. Backend/credential/approval thiếu trả BLOCKED; chưa chạy thử asset qua controller này.
