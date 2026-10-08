# Tiến độ dự án 2D MMORPG

## Chuyển sang Codex Client và phục hồi T03 BLOCKED — 08/10/2026

T07 DONE: atomicOperation dùng receipt scope/key, hash payload canonical, advisory transaction lock PostgreSQL và callback/receipt cùng transaction. Migration additive 202610080002 áp dụng thành công trên mmorpg_test; không đổi mmorpg_dev. DB thật PASS concurrent credit/debit, retry sau mất response, cùng key khác payload và lỗi mô phỏng trước commit không ghi nửa giao dịch. Chưa thử kill OS/mất điện DB; exception dùng để kiểm tra ranh giới rollback. verify -MaxMinutes 10 PASS lint/typecheck/test/build, 12 tests package (phần không đổi có Turbo cache) + 31 orchestrator. Log `logs/verify/2026-10-08T08-57-14-430Z/verification.json`. Không đổi browser ở T07 nên không chạy lại E2E; T05 đã PASS E2E. Cách dùng/scoping/callback side effect và migration dev được ghi trong TESTING.md.

Dừng sau 4 task DONE (T03/T04/T05/T07). T08 BLOCKED: GAME_SPEC và D02 chưa chốt HP/KI nguyên hay thập phân, precision/làm tròn và biểu diễn/validation Gold. Đã gửi câu hỏi chủ sản phẩm, thêm phụ thuộc D02 phần biểu diễn số vào roadmap để không chọn schema chứa luật số tự đặt. Chưa sửa model Account/Character. Journal CLI BLOCKED nguyên bản vẫn giữ, không chạy CLI loop hay ghi trạng thái COMPLETE giả. GAME_SPEC giữ nguyên.

Sau thay đổi dependency, `pnpm test:auto-dev` chạy mới PASS 31/31 (27.8s), registry khớp bảng roadmap; nextTask không có. `git diff --check` PASS; SHA256 GAME_SPEC vẫn `0dbaea03d64d9641b390e083656ad06c7c85354c2acca281765593e79cc0e92f`. Checkpoint local mỗi task, không push/deploy; các dòng tài liệu BLOCKED có sẵn đầu phiên được giữ trong lịch sử. Các yêu cầu decision còn lại D01–D14 không tự mở khóa.

T05 DONE trong phạm vi cấu hình nền tảng: schema strict/loader Map–Area, ID/reference, finite/bounds/spawn collision/zoom; unit 32 là CHỐT, các số fixture còn lại là config. Server validate trước khởi tạo. Bảng balance chưa có quyết định không được tự điền; xem TESTING.md. Verify -E2E PASS 5 gate, 12 tests package + 31 orchestrator; browser qua (17.6s). Log `logs/verify/2026-10-08T08-53-58-864Z/verification.json`.

T04 DONE: message IDs và protocol-error versioned/schema strict nằm shared, server reject INVALID_INTENT/STALE_SEQUENCE, client parse cùng schema; test server hai client xác minh lỗi và không đổi vị trí/sequence từ outcome giả. Verify -E2E PASS cả 5 gate, 11 tests package + 31 orchestrator, browser scenario qua (19.0s). Log `logs/verify/2026-10-08T08-51-18-520Z/verification.json`. Hợp đồng này dành phòng nền tảng; auth/combat contracts sẽ bổ sung ở task liên quan.

T03 DONE: bổ sung Runtime clock/RNG có thể inject cho domain, clock nhận input/tick cho room và hướng dẫn fixture cô lập trong TESTING.md. Giữ harness domain/server/DB/browser Phase 1. `pnpm db:test` PASS DB thật rollback; verify.ps1 -E2E PASS lint/typecheck/test/build/E2E, 10 tests package + 31 orchestrator, 1 scenario hai browser (26.5s). Log `logs/verify/2026-10-08T08-49-00-604Z/verification.json`. Không sinh asset vì task không yêu cầu. Chưa chạy worker CLI; verify wrapper chỉ chạy pnpm gates.

Theo yêu cầu người dùng, làm trực tiếp bằng công cụ file/command của Codex Client; không gọi auto-dev.ps1 hoặc codex exec. Phiên CLI `2026-10-08T08-30-22-031Z-fc9c9183-249b-4fc5-9744-42dd14960bf4` có journal BLOCKED/T03/attempt 0, result changedFiles rỗng, không checkpoint/verification. Raw event chỉ gồm thông báo worker và turn.completed, không có tool event xác minh policy. Vì vậy lỗi sandbox là chẩn đoán worker, không phải một lỗi policy đã chứng minh bằng tool trace.

Diff đầu lượt chỉ gồm trạng thái T03 BLOCKED và dòng progress do controller ghi; không có code triển khai dở. T03 chỉ phụ thuộc T02 DONE, không phụ thuộc D. Codex Client đã xác minh đọc/ghi/command bằng phép thử CLIENT_OK và đọc code trực tiếp thành công. Đã trả T03 về TODO cho workflow Client; giữ nguyên journal BLOCKED và tất cả log để CLI tiếp tục fail closed nếu ai chạy lại. Không mở khóa quyết định nghiệp vụ hoặc báo DONE từ recovery. Giữ các thay đổi tài liệu hiện có và bổ sung lịch sử, không xóa dòng lỗi cũ.

## Phục hồi journal T03 — 08/10/2026

Theo yêu cầu người dùng, đã dùng quy trình recovery thủ công có review trong AUTO_DEV.md, không sửa hoặc bỏ qua kiểm tra controller. Journal và summary cùng run ID `2026-10-08T07-40-27-702Z-d5a92c42-4f59-411f-9ac5-2bfc72430ea2`: FAILED, task T03, attempt 0, Codex exit 1, completed rỗng. Phiên chỉ có lỗi PowerShell binder trước khi Codex chạy; không có result/verification/checkpoint hay event triển khai.

Git trước recovery sạch, HEAD `eb98e2b`; đối chiếu commit nền `5e1c24e` chỉ khác script/test/tài liệu điều phối, không khác apps/packages/assets. Không có lock hoặc tiến trình controller/exec worker cũ. Không phát hiện T03 được triển khai dở trong phiên lỗi; các chức năng kiểm thử nền tảng đã có từ commit nền không phải bằng chứng task T03 hoàn tất.

Đã chuyển nguyên journal vào `logs/recovery/2026-10-08T08-28-19-105Z/journal.original.json`, xác nhận SHA256 trước/sau trùng nhau. `recovery.json` ghi run/task/trạng thái, HEAD, hash journal/session và bằng chứng; danh sách diff baseline nằm cùng thư mục. Toàn bộ log cũ giữ nguyên. T03 FAILED → TODO, không DONE; không tạo journal COMPLETE giả, xóa log, rollback hoặc commit thay đổi người dùng. Tài liệu AUTO_DEV.md được cập nhật để ghi rõ trường hợp đã phục hồi và điều kiện cho các phiên khác.

Kiểm chứng sau recovery: `pnpm test:auto-dev` qua 31/31, exit 0, bao gồm chặn replay journal lỗi, bảo toàn diff và không checkpoint khi gate thất bại. `powershell -NoProfile -File .\scripts\auto-dev.ps1 -Live -DryRun -MaxTasks 1 -MaxMinutes 5 -StopOnFailure` exit 0, chọn T03 TODO; không còn blocker journal/task FAILED. Summary tại `logs/auto-dev/2026-10-08T08-28-37-944Z-7405db56-88ea-4cf3-a2be-64d276248146/summary.json`. Blocker duy nhất còn lại: Git dirty do tài liệu recovery, cần người dùng review/checkpoint thủ công trước chạy thật. GAME_SPEC hash không đổi; không khởi chạy phát triển tự chủ, push hoặc deploy.

## Chế độ Live cho auto-dev — 08/10/2026

**DONE trong phạm vi công cụ; chưa chạy phát triển game tự chủ. T03 và journal cũ vẫn FAILED.**

Đã đọc lại AGENTS.md, GAME_SPEC.md, wrapper/helper, tài liệu và log lỗi; dùng skill lean-build để giới hạn phạm vi. Thêm `-Live` vào auto-dev.ps1 và truyền qua controller/observer. Event JSONL được hiển thị ngay khi nhận đủ dòng, có timestamp UTC, thời gian đã chạy, task/retry, hoạt động CLI, file, lệnh/tool output và kết quả verification. Màu bật khi terminal hỗ trợ; NO_COLOR hoặc redirect dùng chữ thường. Progress ra stderr, final summary stdout vẫn JSON tương thích. Log raw JSONL/stderr, invocation, process exit và summary được giữ nguyên.

Chỉ hiển thị reasoning text do CLI cung cấp; không đọc hidden reasoning. Nhận diện lời gọi asset thực tế, không coi tìm kiếm tên tool là sinh asset hoặc coi tool hoàn tất là asset đã được nghiệm thu. File thay đổi cũng được đối chiếu Git. SIGINT/SIGTERM dừng phiên đang chạy, lưu log/journal và không chọn task tiếp theo. Giữ workspace-write/on-request, Git preflight, ngân sách hữu hạn, tối đa ba lượt sửa và checkpoint chỉ sau verification PASS.

Bằng chứng kiểm chứng:

- `powershell -NoProfile -File .\scripts\verify.ps1 -MaxMinutes 10`: PASS cả lint/typecheck/test/build, exit 0. 31/31 tests orchestrator chạy mới; 9 tests nền tảng dùng Turbo cache vì gameplay không đổi. Log: `logs/verify/2026-10-08T08-18-59-779Z/verification.json`.
- Mock kiểm tra streaming trước process exit, output delta, timestamp/màu, file/tool/asset/reasoning thực, stderr, JSON sai, process exit 9, timeout exit 124, cancellation và không DONE khi verification thất bại. Regression launcher PowerShell với đối số stdin `-` vẫn qua. Ctrl+C được kiểm thử bằng SIGINT mô phỏng qua cùng handler runtime và subprocess cancellation; chưa thử phím Ctrl+C trực tiếp trong VS Code.
- `node scripts/codex-smoke.mjs --live`: CLI thật read-only, CODEX_OK, exit 0, schema hợp lệ, GAME_SPEC không đổi. Log: `logs/codex-smoke/2026-10-08T08-17-46-707Z/summary.json`. Warning shell snapshot PowerShell và skill prompt dài không chặn smoke. Chưa thử worker workspace-write thật.
- `powershell -NoProfile -File .\scripts\auto-dev.ps1 -Live -DryRun -MaxTasks 2 -MaxMinutes 5 -StopOnFailure`: exit 0, stdout parse JSON thành công; DRY_RUN, nextTask=null, hasHead=true, clean=false. Báo T03 FAILED và journal FAILED. Log: `logs/auto-dev/2026-10-08T08-19-49-009Z-923c1e32-e399-4bdb-9198-352fe8aa8337/summary.json`; transport `logs/live-dry-run.*`.
- GAME_SPEC SHA256 giữ nguyên `0dbaea03d64d9641b390e083656ad06c7c85354c2acca281765593e79cc0e92f`. Không sửa gameplay, sinh asset, cài dependency, checkpoint repo người dùng, push hoặc deploy. Không chạy lại E2E vì không đổi browser/gameplay.

Nguyên nhân T03 đã xác minh: launcher cũ `powershell -File codex.ps1` bị PowerShell binder từ chối đối số cuối `-`, trước khi Codex chạy. Bản sửa dùng Node gọi npm entry point với argv/stdin nguyên vẹn; giữ schema và cờ an toàn. Trước khi chạy thật vẫn cần review/checkpoint thay đổi hiện tại và xử lý thủ công T03/journal FAILED theo AUTO_DEV.md; công cụ không tự reset trạng thái hoặc retry budget.

## Sửa phiên auto-dev lỗi và progress realtime — 08/10/2026

**DONE trong phạm vi sửa công cụ. T03 vẫn FAILED; chưa chạy lại vòng phát triển tự chủ.**

Đã đọc AGENTS.md, hai wrapper PowerShell, AUTO_DEV.md, helper/schema/tests và log thật `logs/auto-dev/2026-10-08T07-40-27-702Z-d5a92c42-4f59-411f-9ac5-2bfc72430ea2`. Dùng skill investigate-first; xác minh trước khi sửa.

Nguyên nhân có bằng chứng: log cũ ghi `codex.ps1: ... argument "name" is not valid`, không có event model. Launcher cũ dùng `powershell -File codex.ps1` để chuyển argv, có đối số cuối `-` dành cho stdin. Phép tái hiện `exec --help -` qua đúng launcher trả exit 1, stdout rỗng, stderr đúng lỗi cũ; bỏ `-` thì exit 0. PowerShell binder lỗi trước khi chạy Codex, không phải Git preflight/model/schema. Log cũ trộn stdout/stderr nên không thể tách ngược channel; phép tái hiện ghi nhận riêng hai channel. Các cờ và schema giữ nguyên, smoke backend thật sau sửa chấp nhận schema.

Thay đổi: scripts/auto-dev.mjs gọi npm entry point đã cài qua Node với shell:false trên Windows, giữ nguyên argv/stdin; builder cờ chung cho worker và smoke. scripts/auto-dev-output.mjs đọc event JSONL/chunk UTF-8, format thời gian/task/retry/tool/exit/test và lỗi quan sát được. scripts/codex-smoke.mjs là lệnh kiểm tra read-only độc lập, timeout 120 giây, không vào vòng task. Tests bổ sung regression launcher, quoting/path/stdin, JSON lỗi/unknown/oversized, UTF-8 chia byte, output concise, stream tách riêng, cancellation và không DONE khi gate thất bại. AUTO_DEV.md ghi workflow, output/log và chẩn đoán/phục hồi. Hai wrapper PowerShell và JSON schema không cần sửa.

Log mới tách stdout raw, stderr raw, events JSONL, invocation (executable/argv/cwd/stdin byte count), process (exit code/signal/timeout/cancel), session-result và summary. Progress chỉ ra stderr, stdout cuối vẫn JSON machine-readable; không tạo progress giả hoặc dùng event turn.completed để nghiệm thu task. Git clean-tree, protected hashes, workspace-write/on-request, no-daemon, giới hạn một phiên đầu + ba lượt sửa và checkpoint sau PASS giữ nguyên. Không tự stage/commit/push/deploy repository hiện tại.

Bằng chứng kiểm chứng:

- `node --test tests/orchestrator/auto-dev.test.mjs`: 25/25 qua. Codex/pnpm dùng mock; Git thật chỉ trong repo tạm. Regression launcher trên Windows tái hiện lỗi `-` và kiểm tra Node nhận nguyên argv/stdin tiếng Việt có quote/khoảng trắng. Một assertion ban đầu đặt nhầm ở test BLOCKED đã chuyển sang case gate FAILED, không xóa/vô hiệu hóa test.
- `node scripts/codex-smoke.mjs`: PASS, CLI thật exit 0, sandbox read-only, cùng builder/cờ/schema của worker, trả summary CODEX_OK và changedFiles rỗng. Không có tool event. Log: `logs/codex-smoke/2026-10-08T07-57-14-304Z/summary.json`, `session.invocation.json`, `session.process.json`, `session.jsonl`, `session.stderr.log`. Có warning shell snapshot PowerShell không được hỗ trợ và skill interface.default_prompt quá dài; không chặn smoke.
- Gate cuối `powershell -NoProfile -File .\scripts\verify.ps1 -MaxMinutes 10`: PASS, lint/typecheck/test/build đều exit 0. 25 tests orchestrator chạy mới; 9 tests nền tảng lấy kết quả Turbo cache do gameplay không đổi. Log: `logs/verify/2026-10-08T08-02-17-379Z/verification.json`. Không có thay đổi browser/gameplay nên E2E không chạy lại cho bản sửa công cụ này.
- Dry-run wrapper thật exit 0; stdout parse JSON thành công, progress ở stderr. Kết quả DRY_RUN, nextTask=null, hasHead=true, clean=false; báo task FAILED và journal FAILED cần xử lý thủ công. Log: `logs/auto-dev/2026-10-08T07-58-04-500Z-ef2af3fc-2079-489e-bd07-0be2c416da2a/summary.json`, transport log `logs/dry-run-fix.*`.
- GAME_SPEC.md không có diff, SHA256 vẫn `0dbaea03d64d9641b390e083656ad06c7c85354c2acca281765593e79cc0e92f`. Không sửa apps/packages, tạo asset, cài dependency hay nâng quyền.

Blocker còn lại cho chạy thật: review/checkpoint các thay đổi hiện tại; xử lý T03 FAILED và journal FAILED theo quy trình phục hồi thủ công. Chưa xác nhận một task thật sử dụng shell workspace-write; smoke chỉ chứng minh transport/flags/schema/auth read-only. Không tự mở khóa task, archive journal hoặc reset retry budget trong lượt sửa này.

## Bộ điều phối auto-dev — 08/10/2026

**DONE: triển khai và kiểm chứng bộ công cụ; chưa chạy tự chủ phát triển game. Phase 1 vẫn hoàn tất, Phase 2 chưa bắt đầu.**

Đã đọc AGENTS.md, GAME_SPEC.md, roadmap, progress và mã nền tảng. Dùng skill lean-build để giới hạn phạm vi. Trước khi triển khai đã chạy `codex exec --help` và `codex --help` (CLI 0.161.0): exec có sandbox workspace-write, ignore-user-config, output-schema, JSON và output-last-message; root có approval on-request và no-daemon. Không dùng approval never/danger-full-access/bypass.

File mới: scripts/auto-dev.ps1, scripts/verify.ps1, scripts/auto-dev.mjs, scripts/auto-dev-result.schema.json, tests/orchestrator/auto-dev.test.mjs, docs/AUTO_DEV.md. Cập nhật .gitignore để loại logs/, package.json để đưa lint/test bộ điều phối vào quality gates, tasks.md để thêm registry trạng thái rõ ràng, giữ nguyên tiêu chí nghiệp vụ. T01/T02/T06 kế thừa bằng chứng nền tảng đã ghi bên dưới; các T/A còn lại chưa tự đánh dấu hoàn tất. D01–D14 vẫn BLOCKED.

Kiểm chứng thực tế:

- `node --test tests/orchestrator/auto-dev.test.mjs`: 18/18 qua. Codex/pnpm là mock; Git thật chỉ trong repo tạm, không stage/commit repository người dùng. Bao phủ tuần tự/dependency, checkpoint sau gate, dirty/staged tree, BLOCKED, JSON sai/exit lỗi, diff không khai báo, đặc tả bị sửa, E2E bắt buộc, tối đa 3 phiên sửa, StopOnFailure, recovery, capability thiếu, hook tùy chỉnh, lock cũ, ngân sách hữu hạn và interrupted journal. Timeout subprocess Node thật cũng qua. Kiểm thử registry đối chiếu dải dependency và các quyết định D với bảng gốc, không cố định trạng thái hiện tại để ngăn tiến độ sau này.
- Lint đầu phát hiện 2 biến destructuring không dùng; đã sửa, không tắt rule/test. Phần registry mới ban đầu bị mất dấu do encoding pipe PowerShell 5; đã sửa UTF-8 và mở rộng đúng dải dependency, thêm regression test trên roadmap thật. Các bảng gốc không bị đổi.
- `powershell -NoProfile -File .\scripts\verify.ps1 -E2E -MaxMinutes 10`: PASS, lint/typecheck/test/build/test:e2e đều exit 0. Lượt đó có 9 unit/integration tests nền tảng + 17 tests bộ điều phối; 1 Playwright scenario hai browser qua, 26.0 giây. Log: `logs/verify/2026-10-08T07-16-46-503Z/verification.json` và từng gate .log.
- Gate cuối sau mọi thay đổi code/test/registry: `powershell -NoProfile -File .\scripts\verify.ps1 -MaxMinutes 10` PASS, 4 gate exit 0; 9 tests nền tảng và 18 tests orchestrator qua. Log: `logs/verify/2026-10-08T07-24-12-815Z/verification.json`. Những thay đổi sau E2E chỉ liên quan controller/test/registry, không sửa browser/gameplay.
- Sau mock tests mới chạy dry-run thật. Lượt cuối: `powershell -NoProfile -File .\scripts\auto-dev.ps1 -DryRun -MaxTasks 1 -MaxMinutes 5`, status DRY_RUN, chọn T03 với dependency T02 DONE và e2e=true. Log: `logs/auto-dev/2026-10-08T07-25-24-800Z-035ec705-3845-4a76-a2b5-8f81878b0a28/summary.json`. Switch `-StopOnFailure` cũng đã chạy dry-run thành công. Không gọi worker Codex, không chạy task, không tạo checkpoint.
- `git check-ignore logs/auto-dev-probe.log` xác nhận log được ignore. GAME_SPEC.md giữ nguyên; SHA256 kiểm tra trước/sau: `0dbaea03d64d9641b390e083656ad06c7c85354c2acca281765593e79cc0e92f`.

Điều kiện còn thiếu để chạy thật: repository hiện có thay đổi/untracked của người dùng và chưa có HEAD. Công cụ sẽ từ chối chạy thật cho đến khi người dùng review và checkpoint thủ công. Chưa kiểm chứng phiên model thật trong sandbox qua bộ điều phối, chưa kiểm chứng asset backend/approval qua controller; chỉ kiểm tra help/capabilities và dùng mock session. Không push/deploy, cài dependencies hay sinh asset.

Giới hạn: hash/diff phát hiện vi phạm sau phiên, không thay thế sandbox hoặc review nghiệp vụ; không tự phục hồi ghi đè file. Git hook tùy chỉnh làm preflight dừng. Khi bị ngắt hoặc thất bại, giữ diff/index và journal, yêu cầu xử lý thủ công trước khi chạy lại. Hướng dẫn và lệnh đầy đủ: AUTO_DEV.md.

## Trạng thái ngày 08/10/2026

**Phase 1 hoàn tất trong phạm vi nền tảng và cảnh multiplayer thử local. Đã dừng, chưa bắt đầu Phase 2.**

Đã đọc AGENTS.md, GAME_SPEC.md, tasks.md và tiến độ trước khi triển khai. GAME_SPEC.md/AGENTS.md và luật CHỐT giữ nguyên. Không push, deploy, thay secrets, reset DB hoặc ghi đè asset người dùng. Không sinh thêm asset trong Phase 1.

## Kết quả theo tác vụ

| ID | Trạng thái | Kết quả và bằng chứng |
|---|---|---|
| P1-01 | DONE | pnpm 10.34.0 workspace, Turborepo; apps/web Next.js 16.4/React/Phaser, apps/server Node/Colyseus 0.16, game-core pure TS và shared contracts. Gate đầu lint/typecheck/build qua, 6 unit tests qua. CI workflow dùng frozen lockfile; chưa chạy remote. |
| P1-02 | DONE | Colyseus room local nhận versioned intent, schema runtime reject outcome giả, sequence cũ, server fixed tick, normalize diagonal và input timeout. Hai SDK client thật kiểm replication/rejection/disconnect. Gate server qua, 4 tests. |
| P1-03 | DONE | PostgreSQL 17 Compose, Prisma 6.19.3, FoundationProbe, migration và client. Compose config/schema validate/generate qua. Docker Engine 29.8.0 và postgres container healthy. Migration DB mới mmorpg_dev/mmorpg_test qua; round-trip+transaction rollback+disconnect trên test DB qua. |
| P1-04 | DONE | Phaser render vị trí chân, ellipse shadow riêng, camera responsive/zoom clamp. React không lưu realtime positions. Test hai browser WASD/replication/collision/resize/disconnect/reload và không duplicate canvas qua; screenshot đã xem. Asset South tĩnh có provenance và được revalidate trước tích hợp. |
| P1-05 | DONE | Gate cuối lint/typecheck/tests/build qua, 9 tests trong 4 package; E2E cuối 1 scenario hai browser qua trong 20.8s; README, roadmap và tiến độ cập nhật; dừng Phase 1. |

## Lệnh đã chạy

- `pnpm install`: thành công; root pnpm-lock.yaml đã tạo. Lifecycle scripts chỉ allow Prisma/esbuild/sharp. Native optional msgpackr-extract bị chặn và vẫn dùng fallback JS, không bypass test.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`: chạy sau từng lát cắt áp dụng; gate cuối qua (4 lint package, 4 typecheck package, 9 unit/integration tests, 4 build package). Turbo dùng cache cho phần không đổi, không remote cache.
- `pnpm --filter @mmorpg/server test/lint/typecheck/build`: kiểm chứng riêng sau sửa multiplayer và thêm Prisma, đều qua.
- `pnpm db:validate`, `pnpm db:generate`: qua. Root typecheck tự generate Prisma client để fresh checkout có types.
- `docker compose config --quiet`: qua. Docker info ban đầu lỗi Engine chưa chạy; `docker desktop start --timeout 45` khởi động Desktop đã cài thành công.
- Kiểm tra volume/container của project chưa có trước khi tạo; `docker compose up -d --wait postgres` tạo volume mới và container healthy, bind 127.0.0.1:54329.
- `pnpm db:migrate`: áp dụng migration 202610080001_foundation vào cả mmorpg_dev và mmorpg_test (DATABASE_URL đổi tạm trong shell và được khôi phục). Không chạy reset/drop.
- `pnpm db:test`: đọc/ghi probe trong transaction, rollback, kiểm không còn row và disconnect qua. Test chỉ chấp nhận DB local mmorpg_test.
- `pnpm exec playwright install --dry-run` và `pnpm exec playwright install chromium`: cache cũ không đúng revision; tải browser chính thức v1248 cùng runtime phụ trợ.
- `pnpm test:e2e`: scenario cuối qua, 2 context thật; production web ở 3137 và server thử ở 2567 tự đóng sau test. Cổng 3000 đang do tiến trình khác sử dụng, không dừng tiến trình đó.
- `pnpm install --lockfile-only --ignore-scripts`: xác nhận lockfile nhất quán sau cập nhật scripts. `git diff --check` qua; phần mới chưa được stage nên kiểm thêm file trực tiếp.

Screenshot: `test-results/foundation-scene.png`. Bằng chứng chi tiết quality gates ở `.turbo` và log package; các output kiểm thử không commit mặc định.

## Thất bại đã xử lý

- P1-02, lượt sửa 1: bỏ thuộc tính rate-limit không thuộc API Colyseus 0.16; chọn Vitest threads tránh process.send IPC của monitoring.
- P1-02, lượt sửa 2: teardown gọi leave client đã leave làm timeout; sửa sang gracefulShutdown để đóng toàn bộ room/client đúng lifecycle. Tất cả assertions giữ nguyên.
- P1-03: migration/DB test ban đầu không qua do Engine chưa chạy/P1001. Một lượt khởi động Engine và DB mới đã giải quyết; migration và test thật sau đó qua.
- P1-04, lượt sửa 1: E2E cổng 3000 bị chiếm; dùng 3137, đặt baseURL đúng cho các context. Không tăng timeout để che lỗi, không tắt test.

## Asset và giới hạn phạm vi

- Source giữ tại assets/test/cultivation-idle-south/clean.png; copy web ở apps/web/public/assets/test/cultivation-idle-south.png, manifest cùng thư mục.
- Đã đọc được PNG 128×128 RGBA, alpha 0–255 thật. SHA256: d5d32e4c439fe45a7573a313b138f0d96ee3707fac80da52b5b0e887ebdd5edb. Backend nguồn: local:codex-cli.
- Chỉ một frame South IDLE, chưa có IDLE 4/RUN 8 theo N/E/S/W; giao diện ghi rõ giới hạn. Không coi A02 hoàn tất; không flip/lặp frame thành animation giả.
- Map hình học, tốc độ, spawn và footprint là fixture kỹ thuật, không phải balance/map phát hành. Chưa có art map, tree occlusion/water polygon/content NPC, không coi A03/T17 hoàn tất.
- Server thử chỉ loopback với cờ --foundation; cờ bị từ chối trong production. Không tạo chính sách guest account của game, không lưu demo player vào Character.
- DB hiện chỉ FoundationProbe hạ tầng; Account/Character, idempotency economy, auth/reconnect policy, gameplay và các mục D01–D14 vẫn chưa triển khai/chốt. CI remote chưa chạy.

## Môi trường sau khi dừng

Docker Desktop và container my-mmorpg-postgres-1 còn chạy để phát triển local; volume my-mmorpg_foundation_postgres chứa DB dev/test mới. Không xóa volume. Playwright đã đóng tiến trình web/server thử do nó tạo. Chạy `pnpm dev` để mở lại cảnh thử; README có hướng dẫn DB và các gate.

Không còn blocker kỹ thuật cho phạm vi Phase 1 đã nghiệm thu. Các quyết định nghiệp vụ còn thiếu ở D01–D14 trong tasks.md sẽ chặn các tác vụ tương ứng khi có yêu cầu Phase 2.

### Auto-dev 2026-10-08T07:40:29.239Z — T03: FAILED

FAILED: Codex exit 1; không có checkpoint.. Không checkpoint; log logs/auto-dev/2026-10-08T07-40-27-702Z-d5a92c42-4f59-411f-9ac5-2bfc72430ea2/summary.json.

### Auto-dev 2026-10-08T08:30:46.348Z — T03: BLOCKED

Sandbox chỉ cho phép đọc, không có quyền ghi file để triển khai T03.; Lệnh đọc AGENTS.md, GAME_SPEC.md, docs/tasks.md và docs/progress.md bị chính sách thực thi từ chối (blocked by policy); chưa thể kiểm tra tài liệu và code bắt buộc trước khi sửa.
