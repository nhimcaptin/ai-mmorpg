# PAUSE & HANDOFF — 08/10/2026 (Asia/Bangkok)

## Bàn giao mới nhất — PAUSE 09/10/2026

**Task hiện tại: A02, phần preview/layer proof — PAUSED / PENDING_USER_APPROVAL Female.** Registry toàn A02 vẫn TODO, chưa tạo animation hoặc nghiệm thu production. A01/D12 mới duyệt một phần kiến trúc/mỹ thuật; không đổi toàn gói thành DONE. Không bắt đầu task mới trong phiên pause.

### Git và checkpoint

HEAD trước pause: `a7de0cf` (T17 rendering kỹ thuật DONE). T16 đã DONE tại `d3496cb`. Checkpoint bàn giao là commit local có subject `chore: checkpoint WIP character layers`; dùng `git log -1 --format="%H %s"` trên máy mới để lấy hash thực tế. Không ghi hash tự tham chiếu vào chính commit. Các section phía dưới là lịch sử, không phải trạng thái mới nhất.

Đầu pause có diff GAME_SPEC.md, apps/web/next-env.d.ts, docs/tasks.md, docs/progress.md và các bundle assets/previews cùng CHARACTER_ART_DECISION.md chưa commit. Được bảo toàn trong checkpoint, gồm cả thử nghiệm thất bại/bị từ chối. Không reset/clean/amend/push/deploy. GAME_SPEC chứa quyết định Male/Female/chung animation contract đã được người dùng chốt ở phiên trước; pause không sửa spec. next-env.d.ts là diff có sẵn của Next (đường import `.next/dev/types`), giữ nguyên theo yêu cầu bảo toàn, không coi là feature mới đã verify build.

Danh sách path chính xác: `docs/handoff/files-at-pause-2026-10-09.txt`; danh sách commit có thể xem bằng `git show --name-status HEAD`. Logs/test artifacts bị Gitignore vẫn giữ local, cần copy riêng khi chuyển máy; không đưa .env/secrets/node_modules/.next vào checkpoint.

### Đã hoàn thành và phần hiện tại

- Roadmap T08–T11, T13–T17, T59/T60 đã DONE theo docs/tasks.md và các checkpoint trước; không làm lại. T17 geometry/editor/multiplayer occlusion/runtime không sửa ở loạt preview này. Kết quả full gameplay gate gần nhất thuộc checkpoint T17: lint/typecheck/build,39 unit/integration+31 mock, DB7 suites, browser10/10 và nhóm map/occlusion/editor4/4 PASS (lịch sử, không phải chạy lại hôm nay).
- Male Layer-first v3 r2: chủ sản phẩm CHỐT mỹ thuật riêng DOWN/IDLE/frame0; `assets/previews/character-layer-first-v3-male-r2/art-approval.json` là phê duyệt mới nhất. Manifest/validator/report cũ ghi PENDING được giữ làm lịch sử kỹ thuật; không diễn giải chúng để phủ nhận user approval. Không production/toàn animation.
- Female kín đáo: `assets/previews/character-layer-first-v3-female-clothed/`. Body mặc áo dài tay/quần dài/giày nền; HairBack/HairFront độc lập; outer Top/Bottom/Shoes dùng nguồn garment đãgen và căn Female; Weapon trống. 7PNG128×128RGBA/origin(64,113), DOWN/IDLE0. Full/BodyOnly/toggle/pair/raw/prompt/doctor/provenance/metadata và offline compositor đã tạo. **Chưa duyệt mỹ thuật Female hoặc production.**
- Female brief undergarments trước bị backendHTTP400outputmoderation_blocked; bundle `character-layer-first-v3-female/` lưu lỗi/prompt, khôngartifact. Brief kín đáo mới tạo thành công; blocker backend cũ không còn chặn candidate mới. Các bộ mannequin/layer cũ bị từ chối không được dùng production.

### Files thay đổi và lý do

- `assets/previews/**`: mọi master v1/v2, layer proof bị từ chối, pipeline gates/diff, Malev3/r2 và Femaleclothed; giữ toàn bộ nguồn/QA/historical failures để truy vết. Các frame đều preview, không copied vào apps/web/public để production.
- `docs/CHARACTER_ART_DECISION.md`: quyết định đã duyệt/phần chưa duyệt, provenance và dependency.
- `docs/tasks.md`, `docs/progress.md`, `docs/HANDOFF.md`: roadmap/trạng thái/bằng chứng/pause. Không tự DONE A01/A02/A03.
- `GAME_SPEC.md`: diff quyết định đã duyệt từ trước pause; `apps/web/next-env.d.ts`: diff generated có sẵn được giữ nguyên, không overwrite user work.
- `.gitattributes`: `assets/previews/** -text` giữ nguyên byte source/JSON/script và checksum qua Windows/Linux, tránh autocrlf làm verifierMaleSHA báo sai sau checkout. Không sửa asset để đổi hash; index được đối chiếu byte với working files.
- Quy tắc `docs/tasks.md text eol=lf` có sẵn được giữ. Staged diff đầu sau bảo toàn rawCRLF báo trailing-whitespace vì carriage return; khai báo cr-at-eol hợp lệ riêng bundle, vẫn kiểm blank-at-eol/blank-at-eof/space-before-tab. Không sửa/normalize raw để làm test/hash pass.

### Chưa xong / blockers / bước còn lại

1. **Hành động khuyến nghị tiếp theo:** người dùng xem Female Full/BodyOnly/toggle và male-female-pair.png, duyệt hoặc yêu cầu sửa. Tóc mái đang che một phần mắt trái; cổáonềnxám hiện dướiTop; affine registration và tỷ lệ head/hand/foot cần visual review, technical PASS không thay nghiệm thu.
2. Chưa có IDLE4/RUN8 ×4hướng ×2base (96frame); không tự tạo trước khi được phép. Chưa xử lý animation/foot-sliding, clothing/hair motion, combat/death hoặc production integration.
3. Luồng đăng ký/persistence chưa có giới tính ngoại hình; chính sách account cũ/backfill/đổi ngoại hình chưa duyệt. Không migration hoặc default ngầm.
4. D12 còn catalog/reference/VisualSets/animation combat và phạm vi phát hành; D05 còn content/NPC/portal/monster/loot. T18 cần A02 nghiệm thu; T19 cần D05/A03/A04. Không tự mở nghiệp vụ BLOCKED.
5. Forge hostimage hoạt động trên máy hiện tại; video route thiếu. Máy mới phải kiểm lại Python/Pillow/numpy/Phaser dependencies và image tool nếu sau này được yêu cầu generation; không cài script không tin cậy hoặc đổi paid API để né lỗi.

### Kiểm tra đã chạy khi pause

- Female `validate.py`: PASS7PNG/alpha/contract, BodyOnly/toggle/restore, Body alpha không mất khi tháogear; Body/Shoesbaseline113; Male/FemaleBody99px, Full103px; Male files unchanged quaSHA.
- Female `verify-browser.mjs`: **15/15PASS**,0pageerror/HTTPerror; preview images decode. Đây là offline preview, không gameplayE2E.
- Male r2 `validate.py`: PASS6PNG/alpha/contract, mặt/tóc giữ nguyên,baseline113,toggle/restore. Approval art riêng trongsidecar.
- `node scripts/build-starter-runtime.mjs --check`: PASS Tiled/registry/generatedTS/publicimage consistency.
- `git diff --check`: PASS trước checkpoint. Không chạy lại full lint/typecheck/unit/build/DB/gameE2E vì không sửa gameplay; không claim cácgate đó đã chạy ở phiên pause.
- `pnpm test:auto-dev`: mock orchestrator31/31PASS,0FAIL/skip; không real Codex/autonomous game loop. StagedwhitespacecheckPASS sau khai báoCR-at-EOL và byteaudit392assetfiles0mismatch.

### Resume và lệnh verify chính xác (PowerShell, repo root)

```powershell
git status --short
git log -4 --oneline
Get-Content AGENTS.md
Get-Content GAME_SPEC.md
Get-Content docs/tasks.md
Get-Content docs/progress.md
Get-Content docs/HANDOFF.md
node --version
pnpm --version
python --version
# Nếu máy mới chưa có node_modules: pnpm install --frozen-lockfile
$env:PYTHONUTF8='1'
python -c "import numpy, PIL; print(numpy.__version__, PIL.__version__)"
python assets/previews/character-layer-first-v3-female-clothed/validate.py
node assets/previews/character-layer-first-v3-female-clothed/verify-browser.mjs
python assets/previews/character-layer-first-v3-male-r2/validate.py
node scripts/build-starter-runtime.mjs --check
pnpm test:auto-dev
git diff --check
```

Nếu thiếu Chromium, báo dependency trước; `pnpm exec playwright install chromium` tải browser khi người dùng cho phép thiết lập máy mới. Python verifier không cần DB/API. Không chạy `build_preview.py` của các bundle lịch sử để verify: nó ghi lại artifact và một số script trỏ absolute Downloads của máy cũ. Raw/output đã checkpoint đủ để validate/render. Có thể thiếu ảnh reference ngoài repo trên máy mới; source pointer/provenance ghi rõ, không ảnh hưởng lệnhverify trên.

Nếu cần kiểm toàn gameplay ở phiên được cho phép: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; DB/E2E chỉ sau khi kiểm local .env/DB hiện hữu theo tài liệu AUTH_LOCAL/MULTIPLAYER và không reset. Không tiết lộ secret; không gọi auto-dev.ps1/codex exec. Logs bịignore phải copy riêng từ máy cũ nếu cần RCA.

**Dừng phát triển sau checkpoint.** Không tiếp tục A02 hoặc task khác cho đến khi người dùng resume/duyệt.

## Trạng thái hiện hành — T17 kỹ thuật DONE,09/10/2026

Từ d3496cb/Git sạch, người dùng cho phép phạm vi Starter Village/area_01 SAFE giữ nguyên geometry/art, chỉ rendering/depth/occlusion/hiệu năng; chủ sản phẩm duyệt mỹ thuật trước production-ready. T17 dependency nay T14/T16/T59/T60, registry/bảng đồng bộ. A03 là task nghiệm thu asset riêng, giữ A01/A02/A03 TODO và D05/D12 BLOCKED cho phần chưa duyệt; không coi frame South đã có là bộ4 hướng hoàn chỉnh hoặc tự mở T18.

T17 dùng delta aggregate targets và lookup objectId, không quét mọi prop để tìm target/restart tween khi snapshot ổn định; gom diagnostics mỗi frame khi cần. Unit1.000 object xa vẫn1 candidate gần; clear/disconnect/rejoin và local/remote giữ đúng fade0.4/tween180ms. Không đổi geometry/Y-sort semantics, server/physics/input/auth/art hoặc channel visibility. Không tạo asset mới cần duyệt; GAME_SPEC không sửa.

Lint/typecheck/build PASS;39 unit/integration+31 mock PASS; DB7 suites và runtime consistency PASS; browser10/10 và lặp map/occlusion/editor4/4 PASS. Logs/t17-* giữ gate và lỗi cũ: docs guard scope chưa khớp (đã sửa docs); front-side staging đi quá thành(64,296) (đã sửa input setup test bằng bounded key presses thật và thêm assertion tọa độ, không đổi outcome/geometry/assertion depth/fade/timeout). Progress đầu file ghi chi tiết. Screenshot final house-front-visible đã xem; artifacts/logs ignored cần copy riêng nếu chuyển máy.

Checkpoint chứa apps/web/app/world.tsx, packages/shared/src/occlusion.ts và test, tests/e2e/occlusion.spec.ts, docs/tasks/progress/HANDOFF. Hash lấy từ git log sau commit, không giả định checkpoint cố định. Không tiếp tục task ngoài yêu cầu hiện tại. T18 còn A02/D05; art catalog/appearance/content chưa duyệt và D14 FPS/tải vẫn còn. Không push/deploy/reset DB hoặc auto-dev/codex exec. Các mục T17 bị chặn toàn gói ở dưới là lịch sử trước quyết định scope mới.

## Trạng thái hiện hành — T16 DONE, 09/10/2026

Phiên sửa tiếp tục từ HEAD4e63182 và giữ nguyên toàn bộ diff T16 chưa commit. T16 nay DONE: lint/typecheck/build,37 unit/integration+31 mock, DB7 suites và runtime consistency PASS; browser đầy đủ10/10, kiểm ổn định nhóm lỗi cũ5/5 PASS. Có2 lượt sửa, không nới/bỏ test. T16_RCA.md/progress đầu file là bằng chứng hiện tại; các phần DOING/FAIL phía dưới chỉ là lịch sử.

Root cause: input transport/stop gắn với Scene.update khi render stall; continuous trace screencast có cảnh báo GPU ReadPixels và làm timing nặng. Tắt screencast chỉ đủ9/10 trong gate đầy đủ đầu; tách native keyup/heartbeat theo timer world.tickMs khỏi render mới đạt10/10 và5/5 lặp lại. Vẫn giữ trace DOM/network/console/sources/failure screenshots; không kết luận GPU driver cụ thể. Không đổi server-authoritative movement, footprint, sorting/occlusion0.4/180ms hoặc auth/reconnect.

Checkpoint mới chứa apps/web/app/{world.tsx,world-input.ts,game/game.tsx,page.tsx,starter/page.tsx}, apps/web/test/world-input.test.ts, tests/e2e/world-lifecycle.spec.ts, playwright.config.ts và docs/{tasks,progress,HANDOFF,T16_RCA}. Hash checkpoint lấy từ git log sau commit, không dùng hash cũ cố định. Logs/t16-fix2-* và artifacts logs/t16-browser-final giữ local/ignored, cần copy riêng nếu chuyển máy. Không đưa secrets vào Git.

Dừng sau T16, không bắt đầu T17: D05/A03 còn thiếu, A02/A03 còn D12. GAME_SPEC/server/domain/shared/asset không sửa; DB test schema006 đã có từ lượt trước, DB dev vẫn001 và không reset/migrate thêm trong phiên sửa. Khi resume: đọc trạng thái mới nhất, kiểm Git/DB config, không apply patch spec lịch sử hoặc tự mở D blockers. Không push/deploy/auto-dev/codex exec.

## Trạng thái hiện hành — resume09/10/2026, T16 chưa nghiệm thu

HEAD thực tế `4e63182`; Git sạch đầu phiên. T09–T11/T13–T15 đã DONE. T16 DOING: frontend lifecycle/input/HUD đã sửa và có test; **chưa tạo commit mới vì browser regression FAIL**. Không apply patch spec lịch sử hoặc làm lại task DONE.

Thay đổi chưa commit: apps/web/app/world.tsx, world-input.ts, game/game.tsx, page.tsx, starter/page.tsx; apps/web/test/world-input.test.ts; tests/e2e/world-lifecycle.spec.ts; docs/tasks.md, progress.md, HANDOFF.md. Giữ nguyên diff này và logs/test-results khi chuyển máy; chúng chưa nằm trong checkpoint. GAME_SPEC/collision metadata/server không đổi.

Lint/typecheck/build PASS,36 unit/integration+31 mock PASS, Prisma validate/runtime consistency PASS; DB7 suites PASS. E2E lượt1 6/10, lượt riêng2/5; lượt cuối6/10; lỗi chi tiết trong logs/t16-e2e-final.log. T16 lifecycle mới PASS ở lượt1, nhưng auth-room movement/multiplayer occlusion và có lượt starter approach FAIL. Chưa rõ root cause; không coi task DONE hoặc xác nhận regression toàn bộ PASS. Dừng sau3 lượt kiểm browser,0 task hoàn thành.

Docker Desktop/compose PostgreSQL local healthy, DB test được deploy additive006_recovery; DB dev vẫn001, chưa migrate. Không reset/ghi đè .env. Không có cấu hình auth TTL thực được kiểm thấy; E2E dùng env test riêng. Forge image host_image sẵn, video route thiếu; không sinh asset. Không push/deploy/auto-dev/codex exec.

Tiếp tục: xem progress đầu file và log/trace thất bại, bảo toàn diff/log trước mọi so sánh baseline4e63182. Điều tra focus/input/update cadence và movement/occlusion bằng dữ liệu thực, không đoán nguyên nhân hoặc nới tests. Verify đủ gate rồi mới mark T16 DONE/commit local. Task sau T17 còn D05/A03 (A02/A03 còn D12); không tự mở các quyết định này. Các trạng thái “Git sạch/T16 đủ dependency cho phiên sau” bên dưới chỉ là lịch sử trước phiên này.

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
