# Tiến độ dự án 2D MMORPG

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
