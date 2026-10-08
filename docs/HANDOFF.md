# PAUSE & HANDOFF — 08/10/2026 (Asia/Bangkok)

## Trạng thái mới nhất sau checkpoint708ae90 — 08/10/2026

Phiên tiếp tục đã xác nhận Git sạch và T09/T10/T11 DONE. Hoàn thành đúng3 task: T13 (57fcb62), T14 (202e999), T15 (checkpoint sau cập nhật này, xem git log). Gate cuối lint/typecheck/build,35 unit/integration+31 mock, DB7 suites và E2E9/9 PASS; không có lượt sửa gate thất bại. T13 xác thực/private state/room lifecycle, T14 shared Map/Area/Respawn validator, T15 strict input sequence + movement tests trên DB/WebSocket thật. Collision/Occlusion/art/CHỐT không sửa. Không push/deploy/reset DB/auto-dev.ps1/codex exec.

Dừng đủ3 task theo yêu cầu hiện tại; T16 đủ dependency cho phiên sau. T12 còn D12/D15/A02; nội dung map mới D05 và email production/vận hành vẫn cần quyết định/cấu hình. Đọc progress.md, MULTIPLAYER.md, WORLD_REGISTRY.md và registry tasks.md để tiếp tục. Các mục pause, T09 DOING và dependency chưa đủ bên dưới chỉ là lịch sử, không áp dụng cho trạng thái mới nhất; không apply lại GAME_SPEC.pending.patch.

## Cập nhật resume máy nhà — 08/10/2026

Phiên resume đã hoàn thành đúng3 task: T09 (7d01781), T10 (c750fff), T11 (checkpoint sau cập nhật này). Gate cuối30 unit+31 mock/DB6 suite/E2E8/8 và lint/typecheck/build PASS; UI2/2 kiểm lại sau duyệt nhãn. T60 giữ DONE, chỉ thêm auth parameter/Character UUID vào World dùng chung. /login và /game local có HttpOnly session cookie và server auth; tạo account qua backend /auth/register, frontend creation/appearance T12 vẫn chờ D12/D15/A02. DB dev local đã kiểm trống và migrate additive001–006, không reset/backfill; DB test đã migration006. Không apply lại spec patch. T13 đủ dependency để bắt đầu ở phiên sau, chưa tự DONE. Dừng đủ3 task, không push/deploy/auto-dev/codex exec. AUTH_LOCAL.md và README là hướng dẫn hiện tại.

Người dùng đã yêu cầu resume; các mục PAUSE/hoãn email bên dưới là lịch sử. Checkpoint trước resume aca677f: T60 Collision Editor/Multiplayer Occlusion/house-v2/slide DONE và Git sạch. T09 recovery nay triển khai/verify đầy đủ bằng mock email test; lint/typecheck/build,30 unit/integration+31 mock, DB6 suite và E2E6/6 PASS. Migration006 chỉ trên mmorpg_test, không reset/migrate dev. GAME_SPEC không sửa. AUTH_LOCAL.md/progress.md là hướng dẫn hiện tại; không apply lại patch GAME_SPEC.pending.patch. T09 DONE, tiếp tục tối đa3 task theo yêu cầu mới; không push/deploy/auto-dev/codex exec. Email production cần chọn/cấu hình transport và TTL riêng, mock không dùng production.

**Đã PAUSE theo yêu cầu chủ sản phẩm. Không bắt đầu task mới hoặc tiếp tục code.** Chỉ tiếp tục khi người dùng yêu cầu resume trên máy mới. Không chạy auto-dev.ps1/codex exec, push/deploy, reset/clean hoặc tự sửa CHỐT.

## Git và dữ liệu chưa commit

- Branch: `main`.
- Checkpoint triển khai: `21613ffcd7560e79b76a31b26d92bbb50e273127` — `feat: add starter village and local auth`.
- Lệnh commit trước bị ngắt ở giao diện nhưng **đã hoàn tất thật**: HEAD là 21613ff, index sạch, code/assets/docs triển khai đã commit.
- Trước checkpoint bàn giao, Git còn duy nhất ` M GAME_SPEC.md`: 30 dòng D01 và starter config đã được phê duyệt từ lượt trước. Không sửa hoặc stage file này trong lượt pause.
- SHA256 GAME_SPEC hiện tại: `2c0b1f5b60547a92cb22b2e8f566549e9afebb622af92b4712a8a4d8bfddb9f0`.
- Để không mất quyết định khi chuyển máy chỉ qua Git, diff nguyên văn được bảo toàn trong [GAME_SPEC.pending.patch](handoff/GAME_SPEC.pending.patch). Đây là bản bàn giao, không phải thay đổi mới của quy tắc. Đã chạy `git apply --check --reverse` trên workspace hiện tại: patch khớp các thay đổi đang có; chưa tự áp dụng/reset gì.
- Commit tài liệu bàn giao được tạo sau checkpoint này; lấy hash bằng `git log -1 --oneline` hoặc báo cáo cuối của phiên. Không ghi tự tham chiếu hash chưa tồn tại vào tài liệu.

## Trạng thái thực tế

| Công việc | Trạng thái | Bằng chứng / phần còn lại |
|---|---|---|
| Phase 1 P1-01–P1-05; T01–T08 | DONE theo roadmap hiện tại | Nền tảng workspace/DB/contracts/movement/transaction/numeric có kiểm chứng trong progress.md. D01 DONE chỉ nghĩa quyết định đã CHỐT. |
| T59 Starter Village | DONE | Ảnh thật painted/cartoon soft shading từ host_image; Tiled/shared registry/collision/SAFE/spawn (624,624); camera, Y-sort, fade cây; Forge QA và browser PASS. |
| T09 auth/session | DOING, đang PAUSE | Đăng ký atomic/idempotent và đủ ba class, native scrypt, token DB, single-session replacement, authenticated reconnect 30 giây, expiry/logout đã kiểm chứng local. Chưa DONE toàn bộ acceptance. |
| Email verification/recovery trong T09 | Tạm hoãn theo người dùng | Người dùng yêu cầu để function chưa thực hiện, làm khi lên production. `sendRecoveryEmail()` báo RECOVERY_NOT_CONFIGURED; HTTP 503. Không gửi/xác minh email giả hoặc claim recovery thành công. D01 giữ nguyên. |
| D15 phần tên/đổi tên/xóa | BLOCKED | Chưa được CHỐT. Phần starter/vị trí đã giải quyết bằng T59; không dùng tên chưa duyệt để chặn auth không có trường Character name. |
| D02–D14 | BLOCKED theo registry | Các công thức, nội dung, appearance, balance/vận hành còn thiếu quyết định; xem từng mục trong tasks.md. Không suy diễn từ dữ liệu starter. |
| T10/T11/T13 và các task phụ thuộc T09 | Chưa đủ dependency, chưa DONE | T09 chưa nghiệm thu recovery đầy đủ. T11 frontend auth chưa triển khai; `/starter` là preview local, không phải gameplay guest policy. |
| A02/A03/T17 đầy đủ | Chưa DONE | Actor đang dùng South tĩnh 128×128; chưa có đủ animation 4 hướng. T59 là lát cắt map riêng, không tự hoàn tất asset/content/render roadmap đầy đủ. |

Registry chọn task read-only gần nhất: `nextTask=null`, T59 DONE/T09 DOING. Không đổi trạng thái DOING thành DONE vì pause hoặc vì function email được hoãn. Không xóa Auto-Dev journal hay log lịch sử.

## Các file đã thay đổi

Danh sách chính xác 77 file trong checkpoint 21613ff: [files-at-21613ff.txt](handoff/files-at-21613ff.txt).

- Map source/ảnh/QA/prompt: `assets/maps/starter_village/**`; ảnh runtime: `apps/web/public/assets/maps/starter_village/**`.
- Shared loader/data/contracts: `packages/shared/src/{map,starter-data,auth,index,numeric}.ts`, test map; `packages/game-core/test/starter-map.test.ts`.
- Phaser: `apps/web/app/world.tsx`, `apps/web/app/starter/page.tsx`.
- Server: `auth.ts`, `auth-http.ts`, `auth-room.ts`, `password.ts`, `recovery.ts`, `starter.ts`, `index.ts`, `server.ts`, `world-room.ts`; test starter/auth/password và gate DB.
- Prisma: schema và migrations `202610080004_starter`, `202610080005_auth`.
- Scripts/verification: `scripts/build-starter-map.mjs`, `scripts/build-starter-runtime.mjs`, `playwright.config.ts`, `tests/e2e/{auth,starter}.spec.ts`, `.gitignore`, `.gitattributes`.
- Tài liệu triển khai: `docs/tasks.md`, `docs/progress.md`, `docs/STARTER_MAP.md`, `docs/AUTH_LOCAL.md`.
- Lượt PAUSE chỉ thêm/cập nhật tài liệu bàn giao này, progress, inventory và patch bảo toàn spec; không sửa code/gameplay.

## Kết quả kiểm thử gần nhất

| Kiểm tra | Kết quả thực tế |
|---|---|
| pnpm lint / pnpm typecheck | PASS; root 4 package, Prisma generate thành công. |
| pnpm test | PASS cuối: 19 unit/integration tests (lượt cuối dùng Turbo cache vì code không đổi), 31/31 mock orchestrator chạy lại. |
| pnpm build | PASS cuối: 4 package/app. |
| pnpm db:migrate | Migration 004/005 PASS trên DB mmorpg_test; DB dev không được migrate ở lượt triển khai này. Không reset/drop. |
| pnpm db:test | PASS, JSON năm suite database/transactions/characters/starter/auth. Có DB concurrent registration/retry/rollback, uniqueness, auth + WebSocket thật. |
| DB negative gate | `--fail-gate-test` trả JSON FAIL và exit 1 đúng mong đợi; chứng minh assertion lỗi không bị Colyseus exception logger che thành exit 0. |
| pnpm test:e2e | 3/3 PASS gần nhất, 31.7s: auth HTTP contract, foundation hai browser regression, starter collision/canopy/camera/zoom/resize. |
| Forge | bundle-report-v4 PASS/0 warnings; nav-verified 2 targets, 0 unreachable/thin gaps; preview-verified PASS, mọi route ok:true. |
| Runtime consistency | `node scripts/build-starter-runtime.mjs --check` PASS: TS/Tiled/registry/ảnh public đồng nhất. |
| Pause docs | Kiểm diff/patch bàn giao; không chạy lại build/browser/DB vì không sửa code. |

Giữ các report WARN/FAIL cũ để truy vết; bản preview SKIPPED và nav 0 targets cũ không là bằng chứng nghiệm thu. Chi tiết nguyên văn ở STARTER_MAP.md. Screenshot game đã xem và commit tại `assets/maps/starter_village/runtime-qa/`. Log `logs/starter-final` có lượt gate đầu fail vì CRLF/dependency docs; đã sửa, test toàn bộ/build sau đó PASS. Không tắt test hoặc bypass gate.

## Chuyển sang máy nhà

1. Mang repo cùng `.git` và các commit local mới nhất; chưa có push nên remote không tự có chúng. Có thể copy thư mục hoặc **tự chạy** `git bundle create "..\my-mmorpg-handoff.bundle" main`, rồi trên máy nhà `git clone "<đường dẫn bundle>" my-mmorpg`. Không cần push/deploy.
2. Nếu copy workspace hiện tại, giữ GAME_SPEC đang sửa, **không apply patch lần nữa**. Nếu clone từ commit, đọc patch, chạy `git apply --check docs/handoff/GAME_SPEC.pending.patch`, rồi `git apply docs/handoff/GAME_SPEC.pending.patch` khi check thành công; nếu conflict dừng đối chiếu thủ công, không ghi đè. Xác minh 3.1 D01, 3.2 starter và T08/2.2–2.4 vẫn đúng CHỐT. `git status --short` phải phản ánh spec chưa commit nếu đã áp dụng patch.
3. `logs/`, `.env*`, node_modules, build outputs và Docker volume không đi theo Git. Copy log/journal riêng nếu cần giữ lịch sử; không đưa secrets vào commit/chat. DB volume không nằm trong repo: nếu cần dữ liệu hiện hữu hãy backup riêng, không reset DB. Fresh local DB chỉ để phát triển/test, không tự coi là chuyển dữ liệu cũ.
4. Chuẩn bị Node >=20.9, pnpm 10.34.0, Git, Docker Desktop/Compose. Sau khi người dùng yêu cầu resume: `pnpm install --frozen-lockfile`, `pnpm db:generate`. Python/numpy/Pillow chỉ cần khi chạy lại Forge; ảnh/map đã commit nên không cần sinh lại. Kiểm backend host_image/Forge trên máy mới, không fallback asset giả. ffmpeg thiếu ở máy hiện tại, không claim pipeline animation ready.
5. Khởi động Docker và `docker compose up -d --wait postgres` trên máy mới khi cần DB local. Compose bind loopback 54329, có mmorpg_dev và init-test.sql tạo mmorpg_test trên volume mới. Không xóa volume cũ nếu hai DB chưa tồn tại; kiểm tra/chuẩn bị thủ công.
6. Dùng env local riêng theo `apps/server/.env.example`. Trên PowerShell, chọn **mmorpg_test** cho kiểm chứng:

```powershell
$env:DATABASE_URL='postgresql://postgres@127.0.0.1:54329/mmorpg_test'
pnpm db:migrate
pnpm db:test
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
node scripts/build-starter-runtime.mjs --check
```

7. Chỉ migrate DB dev khi đúng URL/local và đã xem dữ liệu hiện hữu; migrations additive, không tự backfill credential cho account kỹ thuật. Không chạy reset/drop. Playwright E2E dùng DB test + TTL 120000ms test-only; TTL production chưa tự chốt.
8. Xem map local sau build: terminal server `pnpm --filter @mmorpg/server exec node dist/index.js --starter-preview`; terminal web `pnpm --filter @mmorpg/web start --port 3137`; mở `http://127.0.0.1:3137/starter`. Auth riêng dùng `--auth-local`, yêu cầu DATABASE_URL đã migrate và AUTH_SESSION_TTL_MS hợp lệ; hiện không có frontend login hoàn chỉnh. Cả hai cờ local bị từ chối trong production.
9. Khi resume: đọc AGENTS/GAME_SPEC/tasks/progress/HANDOFF, kiểm Git status và checkpoint; tiếp tục T09 đúng phần chưa hoàn tất hoặc tách scope theo quyết định rõ của chủ sản phẩm. Không đánh dấu recovery DONE khi email còn hoãn; không tự mở D02/D12/name. Giới hạn task/retry và kiểm chứng như roadmap. Không gọi Auto-Dev/codex exec theo workflow Codex Client hiện tại.

Chưa tắt Docker Desktop/container/volume của người dùng; không có thao tác hủy dữ liệu. Không bắt đầu worker/loop phát triển mới trong lượt bàn giao.
