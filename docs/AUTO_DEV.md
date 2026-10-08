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

# Smoke thật, read-only, không vào vòng task; kiểm tra argv/stdin/schema/auth
node scripts/codex-smoke.mjs

# Xem task kế tiếp, dependencies và điều kiện chạy, không gọi phiên phát triển
powershell -NoProfile -File .\scripts\auto-dev.ps1 -DryRun -MaxTasks 1 -MaxMinutes 30

# Live trong terminal VS Code; kết hợp đầy đủ các tham số, vẫn không chạy worker
powershell -NoProfile -File .\scripts\auto-dev.ps1 -Live -DryRun -MaxTasks 1 -MaxMinutes 30 -StopOnFailure

# Kiểm chứng độc lập mã hiện tại, thêm browser smoke
powershell -NoProfile -File .\scripts\verify.ps1 -E2E -MaxMinutes 30

# Chỉ chạy khi người dùng đã chủ động quyết định bắt đầu và Git sạch
powershell -NoProfile -File .\scripts\auto-dev.ps1 -Live -MaxTasks 1 -MaxMinutes 30

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

Trên Windows, nếu PATH tìm thấy npm shim `codex.ps1`/`codex.cmd`, controller kiểm tra package đã cài `@openai/codex` và gọi trực tiếp `node.exe <package>/bin/codex.js` bằng argv array (`shell:false`). Không đi qua PowerShell/cmd cho Codex, không cài hay chạy script cài đặt. Điều này giữ nguyên dấu `-` cuối lệnh (stdin), dấu quote TOML và đường dẫn có khoảng trắng. Package/entry point không nhận diện được thì dừng, không fallback không an toàn. `codex.exe` thật trên PATH vẫn được hỗ trợ.

## Progress realtime và tương thích JSON

Progress đọc event thật từ `codex exec --json`: thread/turn, reasoning/agent_message, command_execution (lệnh/exit code), MCP tool, lỗi và event chưa nhận diện. Mỗi dòng hiển thị thời gian đã trôi, task ID và lượt sửa 0–3. Gate có dòng bắt đầu, kết quả test/build quan sát được, stderr và exit code; output cache/package thường chỉ lưu log để terminal ngắn gọn. Không có phần trăm tiến độ hay sự kiện giả; turn.completed không đồng nghĩa task DONE.

`-Live` bật timestamp ISO UTC, màu ANSI theo loại activity/tool/result/file/asset/error/reasoning trong terminal TTY (như terminal VS Code). Redirect/pipeline tự dùng text không màu; `NO_COLOR` cũng tắt màu. Chế độ mặc định giữ format gọn cũ. Live không đổi sandbox, approval, bộ chọn task, retry budget, checkpoint hoặc JSON summary.

Khi nhận một dòng event JSONL hoàn chỉnh, callback hiển thị ngay trong lúc process đang chạy; chỉ ghép chunk/ký tự UTF-8 đến hết dòng, không chờ process exit. File change hiển thị `path/kind/status` CLI cung cấp; sau phiên có thêm danh sách file Git thực sự xác nhận. Tool commands/status/exit code và tối đa 4 dòng output mới được hiển thị theo event (output đầy đủ vẫn trong raw log); text result MCP được preview, không dump ảnh/binary. Tool image/map/sprite được nhận diện từ invocation thực tế; nhãn asset tool không phải bằng chứng asset đã qua validator/nghiệm thu.

Chỉ hiển thị `reasoning.text` mà CLI chủ động cung cấp như summary. Không đọc/decode encrypted_content, internal_reasoning hay suy đoán bước suy nghĩ ẩn. Nếu CLI chưa phát event hoặc chưa gửi tool result, màn hình không tự tạo thông tin thay thế. Ctrl+C/SIGINT và SIGTERM đi qua handler hủy chung, bỏ qua tín hiệu lặp trong lúc đóng cây tiến trình và flush log; journal/diff được giữ để review, không chọn task tiếp theo.

Smoke kiểm tra Live read-only, không vào loop:

```powershell
node scripts/codex-smoke.mjs --live
```

Progress chỉ ghi **stderr**; **stdout cuối vẫn chỉ chứa JSON summary** với các trường cũ. `sessionExit` là thông tin chẩn đoán bổ sung, không thay status/completed/attempt. Có thể lấy JSON riêng:

```powershell
powershell -NoProfile -File .\scripts\auto-dev.ps1 -DryRun > logs\plan.json
```

Event được ghép theo dòng với UTF-8 decoder, bao gồm chunk bị chia giữa ký tự; stderr, JSON lỗi, JSON sai hình dạng và dòng cuối chưa newline đều được lưu/hiển thị đúng loại. Dòng quá dài được rút gọn ở màn hình/envelope, raw log vẫn giữ đầy đủ. Không dùng event hoặc văn xuôi để quyết định thành công; vẫn bắt buộc schema result, Git guard và quality gates PASS.

Kết quả worker chỉ là `READY_FOR_VERIFY`, `BLOCKED` hoặc `FAILED`, không được tự báo DONE. Controller kiểm tra schema, ID, exit code và `changedFiles` khớp Git diff; kiểm tra hash GAME_SPEC/AGENTS/tài liệu điều phối, HEAD/index và các lệnh quality gate. Không suy luận thành công từ văn xuôi assistant.

`verify` chạy lần lượt `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; fail đầu tiên dừng gate lượt đó. E2E bắt buộc khi metadata/worker yêu cầu hoặc diff liên quan web, asset, shared, domain, world-room, Playwright. Kết quả `verification.json` có exit code từng lệnh; không có exit code 0 đủ gate thì không checkpoint. Test DB chuyên biệt phải được task yêu cầu/triển khai trong unit/integration gate; controller không tự migration/reset DB.

Sau gate PASS, controller cập nhật registry DONE và ghi tiến độ tiếng Việt, stage **chỉ diff của task + hai tài liệu**, tạo commit local. BLOCKED/FAILED không commit. Git commit lỗi để nguyên index/diff và journal FAILED, cần kiểm tra thủ công. Không push/deploy, không rollback/clean/force.

## Log, gián đoạn và giới hạn an toàn

Log nằm `logs/auto-dev/<run-id>/`: help CLI, result JSON, verification JSON và summary JSON. Mỗi phiên có `session.jsonl` (stdout raw), `session.stderr.log` (stderr raw), `session.events.jsonl` (envelope JSON có timestamp/channel/event hoặc dòng lỗi), `session.invocation.json` (executable/argv/cwd/stdin byte count), `session.process.json` (exit code/signal/timeout/cancel) và `session-result.json` (kết quả chẩn đoán phiên). Prompt stdin không ghi vào invocation. Các gate cũng có log stdout/stderr, invocation, process và events tương tự. `logs/verify/` dành cho kiểm chứng riêng; `logs/codex-smoke/` cho smoke read-only có timeout 120 giây. Journal hiện tại `logs/auto-dev-state.json`; lock `logs/auto-dev.lock` ngăn hai controller chạy đồng thời. Log có thể chứa nội dung mã và output công cụ; không commit/chia sẻ nếu chưa xem lại.

Ctrl+C/timeout kết thúc cây tiến trình **do lượt chạy tạo**, giữ nguyên file đang sửa và ghi FAILED/INTERRUPTED. Máy bị tắt cưỡng bức có thể để lại lock cùng trạng thái RUNNING/VERIFYING. Không tự replay hay tự hồi phục: đọc journal/log, xem Git diff, xác minh không còn tiến trình cũ, xử lý task và checkpoint thủ công. Sau khi xác nhận, đổi tên journal/lock cũ để lưu hồ sơ rồi mới khởi chạy lại. Không xóa thay đổi đang làm. Task BLOCKED chỉ mở lại khi chủ sản phẩm đã trả lời hoặc dependency/backend đã được xử lý, ghi nguồn quyết định trong progress.md.

Hash/diff là hàng rào phát hiện sau phiên, không phải bộ cô lập trước ghi: nếu worker vi phạm sửa file được bảo vệ, controller dừng và **giữ diff để người dùng xem**, không tự ghi đè để phục hồi. Sandbox CLI là hàng rào thực thi; controller không tự nâng quyền nếu sandbox Windows hoặc image backend không hoạt động. Không tuyên bố có thể ngăn một agent độc hại, tool ngoài sandbox hoặc concurrent editor; không chạy chung với một người/agent khác đang chỉnh repository. Gate PASS không tự chứng minh đủ mọi tiêu chí nghiệp vụ hay ngăn mọi cách sửa test sai; cần review checkpoint trước khi hợp nhất/phát hành.

Asset task đọc skill tại `.agents/skills/generate2dsprite/SKILL.md` / `generate2dmap/SKILL.md`. Không tự duyệt master art, tạo placeholder, chuyển paid API hoặc sinh full sheet khi thiếu phê duyệt. Backend/credential/approval thiếu trả BLOCKED; chưa chạy thử asset qua controller này.

## Sự cố launcher đã xác minh

Lượt `2026-10-08T07-40-27-702Z-d5a92c42-4f59-411f-9ac5-2bfc72430ea2` dừng T03/attempt 0/exit 1 dù Git clean=true, hasHead=true. `T03-0/session.jsonl` cũ chỉ chứa lỗi PowerShell `codex.ps1: ... argument "name" is not valid`, không có event model. Log cũ trộn stdout/stderr nên không truy hồi riêng hai channel từ file này; phép tái hiện có stdout rỗng, stderr đúng lỗi đó.

Tái hiện tối thiểu qua launcher cũ: `powershell -NoProfile -File <codex.ps1> exec --help -` lỗi exit 1; bỏ `-` thì exit 0. PowerShell -File binder coi dấu `-` đơn là tên tham số không hợp lệ trước khi gọi Codex. Regression test tái hiện lỗi này và xác minh entry point Node mới nhận nguyên argv/stdin. Smoke thật dùng cùng builder/cờ/schema, chỉ thay sandbox thành read-only và trả CODEX_OK: exit 0. Schema giữ nguyên và được backend thật chấp nhận. Đây là lỗi launcher; chưa có bằng chứng lỗi auth/API/schema trong lượt hỏng này.

T03 đã được phục hồi thủ công theo yêu cầu người dùng sau khi đối chiếu log, Git và tiến trình: lỗi launcher xảy ra trước Codex, không có triển khai task. Journal FAILED nguyên bản được chuyển vào `logs/recovery/<recovery-id>/journal.original.json`, kèm `recovery.json` ghi hash và bằng chứng; T03 trở về TODO, không phải DONE. Không áp dụng kết luận này cho phiên khác. Smoke read-only không chứng minh task gameplay hoặc shell workspace-write đã được triển khai/kiểm chứng.

Recovery luôn là thao tác review riêng, không tự chạy trong loop. Kiểm tra journal/summary trùng run ID, task/attempt/exit và nội dung mọi phiên; kiểm tra diff tracked, staged, untracked, HEAD, lock và tiến trình. Nếu có worker đã chạy hoặc diff chưa giải thích được, giữ FAILED và yêu cầu review từng file cùng verification phù hợp. Chỉ đưa task về TODO khi chứng minh chưa thực hiện hoặc đã review phần dở dang; không dùng trạng thái COMPLETE để xóa lỗi. Trước khi chuyển journal, ghi bằng chứng và hash, kiểm tra đường dẫn nằm trong workspace và đích chưa tồn tại; chuyển nguyên bản, không xóa hoặc ghi đè. Giữ tất cả log phiên. Sau đó chạy tests và dry-run; Git dirty vẫn chặn chạy thật cho đến checkpoint thủ công.
