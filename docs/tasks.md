# Lộ trình triển khai 2D MMORPG

Ngày lập: 08/10/2026. Nguồn quy tắc: `../AGENTS.md` và `../GAME_SPEC.md` (mục 1–25). Tiến độ triển khai hiện tại ở bảng Phase 1 và `progress.md`. Mọi mục CHỐT được giữ nguyên.

## Cách sử dụng

- Trạng thái: `TODO` chưa làm; `BLOCKED` thiếu quyết định/phụ thuộc; `DOING` đang làm; `DONE` đã có bằng chứng nghiệm thu. Các tác vụ T bên dưới ban đầu đều là TODO, trừ khi ghi BLOCKED.
- Cột phụ thuộc là điều kiện bắt buộc trước khi bắt đầu; thứ tự bảng là thứ tự triển khai hợp lệ sau khi các quyết định D được giải quyết. Tác vụ độc lập có thể làm sau khi đủ phụ thuộc, không cần chờ toàn bộ giai đoạn trước.
- D là quyết định cần chủ sản phẩm xác nhận; A là gói asset; T là tác vụ kỹ thuật/nội dung. Mã A trong cột asset là phụ thuộc nghiệm thu hình ảnh, không được thay bằng placeholder rồi đánh dấu hoàn tất.
- Fixture phục vụ kiểm thử phải ghi rõ là dữ liệu kiểm thử, không phải cân bằng hoặc nội dung phát hành. Tác vụ logic không cần asset có thể nghiệm thu bằng kiểm thử tự động; màn hình/world tích hợp phải có asset đã được kiểm định.
- Mỗi tác vụ chỉ hoàn tất khi đạt tiêu chí riêng, lint/typecheck/tests/build áp dụng đều qua, có kiểm tra trình duyệt nếu liên quan giao diện và môi trường cho phép, rồi cập nhật tài liệu tiến độ. Nếu một lệnh chưa tồn tại hoặc môi trường không chạy được, ghi rõ; không báo đã qua.
- Tối đa 3 lượt sửa khi kiểm tra thất bại, sau đó dừng và báo nguyên nhân. Không vô hiệu hóa test. Chỉ tiếp tục sang tác vụ mới khi được yêu cầu chạy tự chủ.
- Không tự đặt luật nghiệp vụ lâu dài. Giá trị có thể cân bằng phải nằm trong cấu hình có kiểm định. Hằng số CHỐT phải được truy vết về đặc tả, không được tùy ý tune.
- Không push, triển khai, thay secrets, cài script không tin cậy hoặc chạy lệnh phá hủy khi chưa được phê duyệt.

## Quyết định nghiệp vụ và đầu vào còn thiếu

D01 xác thực/phiên đã CHỐT (registry DONE); các quyết định chưa trả lời vẫn BLOCKED. Phần numeric T08 đã CHỐT, phần còn lại D02 vẫn chờ. Đây là câu hỏi cần quyết định, không phải đề xuất luật mặc định. Không phát hiện mâu thuẫn trực tiếp giữa AGENTS.md và GAME_SPEC.md; nếu câu trả lời xung đột CHỐT phải báo trước khi triển khai.

| ID | Cần xác nhận | Chặn các phần |
|---|---|---|
| D01 | CHỐT: username/password, chọn class lúc đăng ký, đúng một Character, recovery qua email verified, một phiên gameplay, thay thế phiên cũ, reconnect 30 giây, hash/token/server validation. Nguồn GAME_SPEC 3.1; phần dữ liệu khởi đầu và tên chưa duyệt tách D15. | T09–T12, T20, T56 |
| D02 | Bảng stats theo class/Realm/Star, EXP từng sao, công thức tổng hợp và làm tròn ngoài damage/healing; chi phí/tỷ lệ đột phá, vật liệu; xử lý ở Đấu Đế 9★100%. Phần numeric T08 đã duyệt, không mở khóa các câu hỏi còn lại. | T22–T23, T34 |
| D03 | Công thức damage/DEF/crit, nhịp đánh/range, giới hạn stat; target hợp lệ, tấn công khi di chuyển, line-of-sight; cast bị hủy/hoàn chi phí khi nào; effect, threat, taunt và CC ngoài World Boss. | T26–T28, T38, T50 |
| D04 | Danh mục item/affix, multiplier từng rarity, phân bố roll, binding theo từng source, giá mua/bán; cách/chi phí mở túi; EnhancementConfig và nguồn đá. | T24–T25, T32–T35, T42 |
| D05 | Danh sách map/area, spawn/NPC/portal/respawn, nội dung Tiled; interaction range; monster stats, respawn, aggro/leash, LootTable/Gold/EXP. | A03–A04, T17–T19, T27, T30, T36–T37 |
| D06 | Party tối đa bao nhiêu; xử lý leader rời/kick/offline dài hạn, giải tán và lời mời; “eligible party” gồm ai, thời điểm chốt membership, điều kiện ngoài cùng Map+Area; EXP 5% làm tròn và tương tác penalty. | T29–T31 |
| D07 | Bộ skill từng class/grade, cách học/nâng cấp, valid cast và EXP, ngưỡng cấp, hotkey; duplicate book xử lý thế nào ngoài việc không đổi EXP; số slot trống được phép trong cấu trúc 5 slot. | A05, T38–T39 |
| D08 | Amount/giá potion, cách diễn giải threshold; Auto Farm chọn target/phạm vi/lộ trình/skill/loot và điều kiện dừng; offline auto kích hoạt, thời lượng, rate EXP, giới hạn, Gold có được nhận không và áp dụng penalty/cap thế nào. | T40, T47–T48 |
| D09 | Nội dung MAIN/SIDE, prerequisite, repeatability/abandon, cách chọn stack COLLECT để consume; reward/binding từng quest; cách mở và lưu RespawnPoint, HP/KI sau revive, giá revive tại chỗ. | T36–T37, T41–T42 |
| D10 | Thời gian combat lock, hành động PvP kích hoạt lock; Hiếu Chiến mỗi kill, decay/tier/multiplier và loại EXP bị áp dụng; chuyển vùng khi combat, toggle PK và điều kiện sống/chết. | T43–T44 |
| D11 | World Boss lịch và múi giờ server, timeout, HP/skills/local threat; TankWeight/minContribution/reward từng tier; damage effective/overkill, contribution trùng timestamp và có cho đồng hạng không; đổi instance/reconnect và credit sau death. | A04–A05, T49–T52 |
| D12 | Danh sách player/NPC/monster/Visual Set/icon/effect/map cần phát hành, appearance chọn khi tạo nhân vật; animation combat/death ngoài IDLE/RUN; phạm vi nội dung từng đợt và người duyệt mỹ thuật. | A01–A06, T12, T53 |
| D13 | Trade invite/timeout, điều kiện hai bên accept; PendingReward thời hạn, thứ tự claim và partial claim; quy tắc lưu ground loot/party/cooldown qua restart. | T31, T33, T45–T46, T55 |
| D14 | Thiết bị/trình duyệt hỗ trợ, có mobile/touch không; người đồng thời/room/instance, latency và FPS mục tiêu; yêu cầu lưu trữ/backup, môi trường vận hành và người phê duyệt phát hành. | T54–T58 |
| D15 | Starter stats/Realm/Star/0%/Gold/PK và ba ID CHỐT tại GAME_SPEC 3.2 đã được kiểm định bằng T59. BLOCKED còn chính sách tên nhân vật/đổi tên/xóa chưa duyệt; phần này không chặn auth hoặc khởi tạo Character không có trường tên. Không dùng fixture Phase 1. | T12 (tên) |

**Nghiệm thu mỗi D:** câu trả lời được chủ sản phẩm xác nhận, ghi vị trí nguồn và ngày trong `docs/progress.md`; cập nhật đặc tả/tài liệu quyết định bằng nội dung được duyệt, không sửa luật CHỐT. Các mục liên quan chưa có câu trả lời vẫn bị chặn; có thể chia D thành các câu hỏi nhỏ để mở khóa từng tác vụ.

## Các mốc kiểm chứng

| Mốc | Kết quả kiểm chứng | Tác vụ |
|---|---|---|
| M1 | Workspace có quality gates, cấu hình, persistence và đăng nhập/tạo nhân vật | T01–T12 |
| M2 | Hai trình duyệt thấy nhau di chuyển, collision server đúng và map/nhân vật đã duyệt | A01–A03, T13–T21 |
| M3 | Combat, reward, inventory, tu luyện và dịch vụ NPC vận hành có giao dịch an toàn | A04, T22–T37 |
| M4 | Skills, quest, PvP, trade và Auto Farm có kiểm chứng | A05, T38–T48 |
| M5 | World Boss toàn cục, nội dung/Visual Set hoàn chỉnh | A06, T49–T53 |
| M6 | Kiểm thử tải, bảo mật, phục hồi và nghiệm thu phát hành | T54–T58 |

Đây là các mốc kiểm chứng, không tự tuyên bố bỏ hệ thống nào khỏi phạm vi GAME_SPEC. Chưa ước lượng lịch cố định khi quyết định nghiệp vụ/nội dung/tải còn thiếu.

## 1. Nền tảng dự án, dữ liệu và tài khoản

| ID | Tác vụ nhỏ | Phụ thuộc | Asset | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| T01 | Khởi tạo pnpm workspace và Turborepo | Không | Không | Có apps/web, apps/server, packages/game-core, packages/shared; TypeScript strict; chạy workspace smoke thành công; game-core không import framework. |
| T02 | Thiết lập lint, typecheck, test, build và CI | T01 | Không | Bốn lệnh chạy được ở root; lỗi type/test fixture làm gate thất bại; CI dùng lockfile và cùng lệnh local; không cần secrets production. |
| T03 | Thiết lập bộ kiểm thử domain, server, DB và browser | T02 | Không | Có fixture tách production, clock/RNG có thể inject; một test mỗi tầng chạy được; DB test cô lập, browser khởi động/dọn tài nguyên đúng. |
| T04 | Lập hợp đồng client/server phiên bản đầu | T01, T03 | Không | packages/shared chứa intent/event/error và schema runtime; reject payload sai/không tương thích; không có contract sao chép giữa FE/BE; client không gửi outcome làm nguồn tin. |
| T05 | Thiết lập cấu hình gameplay có kiểm định | T03, T04 | Không | Schema và loader kiểm tra tham chiếu/giá trị sai; phân biệt CHỐT với balance; fixture hợp lệ nạp được; config lỗi chặn khởi động với thông báo rõ. |
| T06 | Thiết lập PostgreSQL và Prisma nền tảng | T01, T03 | Không | Migration tạo DB trống chạy thành công; kết nối/shutdown đúng; hướng dẫn môi trường local không chứa secrets; test không ghi vào DB thật. |
| T07 | Xây primitive giao dịch và idempotency | T04, T06 | Không | Test concurrent request/retry/crash tại ranh giới commit không double-credit/debit; rollback không ghi nửa giao dịch; cùng khóa khác payload bị từ chối. |
| T08 | Lập schema persistence Account/Character | T05–T07; numeric đã duyệt mục 4.1 | Không | Unique account-character bảo đảm tối đa một nhân vật; enum class đúng ba loại; lưu Realm/Star/HP/KI/Gold/map/respawn/PK với validation; migration và đọc/ghi round-trip qua. |
| T59 | Starter Village và loader production | T05, T08; style/ID theo xác nhận người dùng | Terrain/house/tree host_image trong assets/maps/starter_village | DONE: Tiled/registry dùng chung FE–BE; SAFE/PK OFF; respawn (624,624) hợp bounds/AABB; footprint nhà/cây hiện theo T60, Y-sort/camera; Forge validate/nav/route và gate PASS ở checkpoint T59. Geometry/occlusion mới thay bằng T60 đã verify; A02/A03 đầy đủ không tự DONE. |
| T09 | Backend xác thực và quản lý phiên | T04, T08, D01, T59 (vị trí starter đã kiểm định) | Không | DONE: atomic registration/login/logout/single-session/reconnect30s, email verification và verified-email reset dùng token hash/expiry/one-time, thu hồi phiên. Lint/typecheck/build,30 unit/integration+31 mock, DB6 suite và E2E6/6 PASS qua mock email test; thiếu transport vẫn503, không yêu cầu email production. |
| T10 | Backend tạo và tải nhân vật | T05, T07–T09, D01 | Không | DONE: đăng ký atomic tạo đúng ba class theo config đã duyệt; concurrent/idempotent/rollback/unique và class immutable DB PASS. GET /auth/me chỉ tải Character/session owner, shared strict DTO/Gold lossless/no credential. Lint/typecheck/build,30 unit+31 mock, DB6 suite và E2E6/6 PASS. |
| T11 | Frontend đăng nhập và phiên người dùng | T09 | Không | DONE: /login chờ/lỗi/recovery/verify/reset, HttpOnly SameSite cookie; /game kiểm session SSR và nối room xác thực theo Character UUID; refresh giữ account/Character, replacement/expiry/logout loại session UI, text focus không gửi movement. Lint/typecheck/build,30 unit+31 mock, DB6 suite và E2E8/8 PASS; UI2/2 kiểm lại sau duyệt nhãn tiếng Việt. |
| T12 | Frontend tạo/chọn nhân vật hiện có | T10–T11, D12 | A02 | Hiển thị ba class và appearance được duyệt; tạo một lần, lần sau vào nhân vật cũ; lỗi tên/phiên hiển thị rõ; không có điều khiển đổi class. |

| T60 | Collision footprint và multiplayer occlusion chung | T05, T59; CHỐT mới GAME_SPEC 2.5 | Art hiện hữu | DONE phạm vi kỹ thuật: polygon/multiple AABB, metadata/editor/debug, fade 0.4/180ms từ tất cả authorized actors. Đã áp dụng mẫu house v2 cho3 nhà và mẫu cây đã duyệt; sửa phía trước nhà/depth và server slide theo cạnh khi giữ input. Lint/typecheck/build, 28 unit/integration +31 mock và E2E6/6 hai client PASS tại checkpoint aca677f; regression resume E2E8/8 PASS. Không claim đối chiếu pixel-perfect với ảnh ngoài export. |

## 2. Pipeline tài nguyên đồ họa

Các gói A là tác vụ có nghiệm thu riêng, trạng thái ban đầu TODO/BLOCKED theo phụ thuộc. Khi thực hiện tạo sprite dùng `$generate2dsprite`, tạo map dùng `$generate2dmap` và đọc skill tương ứng lúc đó. Chưa tạo ảnh trong lượt lập kế hoạch này.

| ID | Gói asset / công việc | Phụ thuộc | Tiêu chí nghiệm thu |
|---|---|---|---|
| A01 | Danh mục asset, style reference và validator | T01, T03, D12 | Manifest có ID/version/path/license hoặc nguồn tạo, reference và người duyệt; phong cách chibi painted soft shading top-down 3/4; không sao chép nhân vật/logo/sprite TKL; validator có mẫu lỗi alpha/kích thước/count/alignment và báo lỗi đúng. |
| A02 | Base player và bóng chân riêng | A01 | Cùng character reference cho N/E/S/W; IDLE 4, RUN 8 frame/hướng, mỗi frame 128×128; 8 sheet theo animation×direction; alpha thật, không bake weapon/effect/shadow; metadata frame/origin/baseline/preview đầy đủ; không đổi mặt/tóc/tỷ lệ hoặc trượt chân trong preview; ellipse shadow riêng. |
| A03 | Map đầu tiên và props bằng Tiled | A01–A02, T05, D05 | Cùng world unit 32px; dữ liệu ground/props/collision/depth/occlusion/spawn/area có ID; building chặn vùng không đi phía sau, tree chỉ chặn trunk/root, water polygon theo bờ; preview scale 70–100 world px với A02; FE/BE đọc cùng tọa độ. |
| A04 | Bộ NPC, normal/elite/boss và World Boss | A01, D05, D11 | Từng nhóm nội dung được duyệt riêng; đủ manifest và preview; sprite tương thích 4 hướng/128×128, IDLE/RUN theo đặc tả khi có các animation này; animation bổ sung chờ D12; kiểm định alpha/alignment/style trước tích hợp. |
| A05 | Icon item/skill/potion và hiệu ứng/telegraph | A01, D04, D07, D11, D12 | ID khớp catalog, icon đọc rõ ở HUD; VFX/telegraph tách body, metadata origin/duration đầy đủ; không che thông tin target/phạm vi; preview và duyệt từng bộ, không tự đặt frame count cho animation chưa chốt. |
| A06 | Equipment Visual Set và map/nội dung còn lại | A02–A05, D12 | Mỗi Visual Set ánh xạ ItemTemplate/layer; BODY/HAIR/ARMOR/PANTS/SHOES/WEAPON/EFFECT đồng bộ direction/frame/size/origin/baseline; kiểm tra cả 4 hướng khi equip; map bổ sung qua validator A03; không cần sprite riêng từng item dùng chung set. |

Gói nội dung lớn A04–A06 được tách theo NPC/monster/Visual Set/map trong danh mục D12 trước khi làm; mỗi phần có cùng tiêu chí và ID con, tránh một tác vụ sản xuất không thể nghiệm thu độc lập.

## 3. World và multiplayer nền tảng

| ID | Tác vụ nhỏ | Phụ thuộc | Asset | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| T13 | Colyseus room và join có xác thực | T04, T09–T10 | Không | DONE: hai account cùng room/Character UUID ổn định, strict join và token giả/wrong-area reject, public state chỉ version/player IDs/position/direction/sequence. Room giữ30s grace rồi dispose khi rỗng, clear state/listener và recreate đúng. Lint/typecheck/build,30 unit+31 mock, DB7 suite và E2E9/9 PASS. |
| T14 | Loader Map/Area và collision thuần domain — DONE | T05, T13 | Không | Shared registry tách Map/Area/Respawn, validate IDs/references/bounds/polygon/spawn footprint; Starter dùng cùng tọa độ FE/BE. Building/tree/water footprint tests, lint/typecheck/build,33 unit/integration+31 mock, DB7 suites và E2E9/9 PASS; Collision/Occlusion giữ nguyên. |
| T15 | Movement authoritative và input sequence — DONE | T04, T13–T14 | Không | Room dùng chung strict intent/monotonic sequence guard; tick server tính movement/collision hiện hữu. Spam/duplicate/reordered/teleport/diagonal/timeout/boundary đã verify qua DB+WS thật; lint/typecheck/build,35 unit/integration+31 mock, DB7 suites và E2E9/9 PASS. |
| T16 | Phaser lifecycle, input và bridge HUD — DONE | T11, T13, T15 | Không | Mount/unmount/reconnect không nhân listener/canvas; React chỉ nhận dữ liệu HUD, không chứa state movement từng tick; input bỏ qua khi focus text/panel theo thiết kế UI. Native keyup/heartbeat không chờ render; lint/typecheck/build,37 unit/integration+31 mock, DB7 suites, E2E10/10 và nhóm regression5/5 PASS; xem T16_RCA.md/progress. |
| T17 | Render map, depth và tree occlusion | T14, T16 | A03 | Map Tiled tải đúng; Y-sort theo chân; đi dưới tán nhưng không xuyên trunk/building/water; occlusion chung theo GAME_SPEC 2.5/T60: mọi authorized local/remote actor, fade0.4/150–200ms, không đổi collision server. |
| T18 | Player animation, scale và camera responsive | T15–T17 | A02 | N/E/S/W, IDLE 4/RUN 8×128; mapping hướng chéo nhất quán; origin/baseline/shadow ổn định; scale map/camera cấu hình, preview 70–100 world px; viewport 1920×1080 và resize/zoom clamp qua browser. |
| T19 | Đặt entities và spawn theo dữ liệu map | T05, T14, T17, D05 | A03–A04 (phần map đầu) | NPC/monster/spawn/respawn ID đúng catalog; vị trí không mắc collision; render cùng vị trí server; spawn sai bị validator từ chối. |
| T20 | Đồng bộ, reconciliation và reconnect | T09, T13, T15, T18, D01 | A02–A03 | Hai browser thấy nhau di chuyển; mô phỏng latency/mất gói không tạo teleport hay duplicate player; reconnect áp dụng chính sách phiên và snapshot server, không ghi đè bằng vị trí client. |
| T21 | HUD và panel shell responsive | T04, T16, T18 | Không | HUD HP/KI/Realm/Star/Gold đọc server state; loading/error/disconnect rõ; panel không điều khiển outcome; resize không làm lệch camera; browser smoke và điều hướng bàn phím qua. |

## 4. Domain gameplay, economy và NPC

| ID | Tác vụ nhỏ | Phụ thuộc | Asset | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| T22 | Tính stats và progression sao | T03, T05, T08, D02 | Không | Đủ chín stats, không cộng điểm thủ công/conventional level; đúng 11 Realm×9 sao; auto tăng sao full HP/KI, overflow chỉ trong Realm, cap 9★100%; test multi-star/cap/làm tròn và max Realm theo duyệt. |
| T23 | Lưu và trao Cultivation EXP an toàn | T07–T08, T22 | Không | Một reward event retry không tăng EXP hai lần; persist sao/HP/KI atomically; reload giữ đúng cap; chưa có nguồn EXP tự phát ngoài event được server cho phép. |
| T24 | Catalog item, rarity/affix và roll khi drop | T05, T07, D04 | Không | Đủ 7 rarity; cùng template nhiều rarity; equipment instance có roll cố định và binding nguồn; replay event không reroll; không có reroll MVP; test RNG seed/boundary. |
| T25 | Inventory và expansion | T07–T08, T24, D04 | Không | Túi 25→30→35→40, không vượt 40; stack ≤999 chỉ merge template+binding; add/remove/split/expand atomic; full/overflow không mất item; khóa nguồn và chi phí expansion theo quyết định. |
| T26 | Combat basic thuần domain | T05, T15, T22, D03 | Không | Range/timing/crit/DEF theo cấu hình và công thức duyệt; click/select target dẫn auto basic attack; target sai/chết bị từ chối; client không quyết định damage/kill; test deterministic RNG và boundary. |
| T27 | Monster AI và lifecycle server | T14–T15, T19, T26, D05 | A04 (normal/elite/boss) | Type tách PASSIVE/AGGRESSIVE; aggro/chase/leash theo config; NORMAL/ELITE/BOSS vượt leash reset vị trí/state/full HP; WORLD_BOSS không dùng reset này; spawn/respawn và target test bằng clock giả. |
| T28 | Target/combat presentation | T18, T21, T26–T27 | A02, A04–A05 (combat) | Select target/auto attack hiển thị kết quả server và lỗi range; HP/damage/death không tự credit reward; VFX đã duyệt; browser hai client nhận cùng kết quả combat. |
| T29 | Party backend và lưu membership | T07–T10, T13, D06 | Không | Invite bởi mọi member, application chỉ leader accept, leader kick; offline không tự leave; member leave khi leader offline; kiểm thử quyền sai và concurrent join/kick theo limit/chuyển leader đã duyệt. |
| T30 | Reward kill và party EXP | T23–T24, T27, T29, D06 | Không | Last Hit nhận 100% EXP, Gold, loot ownership; eligible cùng Map+Area nhận bonus 5% theo rounding/penalty duyệt, không trừ killer; không Gold/personal loot cho party; xử lý kill đồng thời/retry đúng một lần. |
| T31 | Ground loot, quyền pickup và timer | T07, T25, T30, D06, D13 | A05 (loot/icon) | 0≤t<30 owner/eligible party, 30≤t<60 public, t≥60 despawn; test đúng mốc 30/60; pickup đồng thời chỉ một bên nhận; đầy túi không mất loot; restart theo chính sách duyệt. |
| T32 | Equip, unequip và stat recompute | T22, T24–T25 | Không | Năm slot Weapon/Helmet/Armor/Pants/Shoes; kiểm Realm+Star, weapon thêm class; LOCKED vẫn equip, binding không đổi; đầy túi/unequip atomic; stats đúng dữ liệu roll. |
| T33 | PendingReward lưu và claim | T07, T23, T25, D13 | Không | Reward có ID duy nhất; delivery/claim idempotent qua retry/concurrent/crash; inventory full giữ pending; giao item/Gold/EXP không mất/duplicate; partial claim/expiry theo duyệt. |
| T34 | NPC đa capability và đột phá | T19, T22–T25, D02, D05 | A04 (NPC) | Một NPC có thể nhiều capability; server validate NPC/range; breakthrough chỉ 9★100%, trả Gold/material; fail mất chi phí, giữ cap, không chết/pity; success Realm sau 1★ EXP0 full HP/KI; RNG/atomic test qua. |
| T35 | NPC shop và enhancement | T07, T24–T25, T32, T34, D04 | A04–A05 (NPC/icon) | Shop infinite stock, sellPrice cố định không cộng rarity/affix/enhancement, canSellToNpc, không buyback; LOCKED bán được; enhance chỉ NPC/unequipped, +5% Base Stat mỗi level, cap 4/6/8/10/12/14/16, fail không downgrade/break; một stone, NPC không bán; request trùng không mất phí hai lần. |
| T36 | Portal/NPC travel và save RespawnPoint | T14, T19, T34, D05, D09 | A03–A04 | Realm/Star/optional MAIN quest được server kiểm; không trừ Gold; Map/Area riêng, chuyển room an toàn không nhân đôi entity; lưu ID respawn hợp lệ và default newbie point; reject điểm đến giả. |
| T37 | Death và hai lựa chọn revive | T07, T26, T36, D09 | A02, A04–A05 (death/revive nếu cần) | Free tại saved RespawnPoint hoặc tại chỗ trả Gold cấu hình; không mất item/EXP/Realm/Star; HP/KI theo duyệt; retry revive không double-debit, hành động chết bị chặn; PK state giữ nguyên. |

## 5. Skills, quest, PvP và giao dịch người chơi

| ID | Tác vụ nhỏ | Phụ thuộc | Asset | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| T38 | Học skill, EXP và loadout | T05, T07, T24–T25, D07 | Không | Class-specific, bốn grade Hoàng/Huyền/Địa/Thiên, Thiên có nguồn Boss; learned không giới hạn, level≤10, cấu trúc đúng 5 slot; valid cast/item tăng EXP, duplicate book không đổi EXP; retry học/EXP không duplicate. |
| T39 | Cast skill authoritative và hotbar | T26, T28, T38, D03, D07 | A05 (skill/VFX) | Hotkey gửi intent; KI/range/castTime/cooldown server kiểm; cooldown độc lập, không GCD; hủy cast theo duyệt; auto cast hợp lệ có EXP; hotbar/cast bar phản ánh server, fake cast bị reject. |
| T40 | Potion thủ công và tự dùng | T25, T35, T39, D08 | A05 (potion) | HP/KI fixed amount cấu hình, clamp theo stats; hai cooldown riêng 10 giây; stack≤999; có nguồn shop+drop; threshold theo duyệt; consume+heal atomic, spam/retry không dùng hai lần. |
| T41 | Quest acceptance và objective tracking | T07, T25, T30, T34, D09 | Không | MAIN/SIDE manual accept, không giới hạn active; KILL chỉ Last Hit, COLLECT đọc quantity inventory thật, TALK đúng NPC; prerequisite/repeat/abandon theo duyệt; replay kill không tăng objective hai lần. |
| T42 | Quest turn-in và UI nhận thưởng | T21, T33, T41, D04, D09 | A05 (quest/item) | COLLECT consume quantity theo lựa chọn stack duyệt; reward cố định EXP/Gold/Item; full→PendingReward; consume/complete/reward atomic và idempotent; browser nhận/track/turn-in đủ ba objective. |
| T43 | Quyền PvP, PK toggle và combat lock | T14, T26, T36–T37, D10 | Không | Area override Map; SAFE cấm, CONDITIONAL_PK cho khi ít nhất một PK ON, CHAOS force effective PvP; lock chặn tắt PK theo duyệt; death không reset PK; test đủ bảng zone×PK và chuyển vùng. |
| T44 | Hiếu Chiến và giao diện PvP | T21, T23, T28, T43, D06, D10 | A05 (status) | PK ON killer nhận Hiếu Chiến ở CONDITIONAL_PK; PK OFF giết PK ON không nhận, CHAOS không cộng theo rule PK; decay chỉ online, tier/EXP penalty cấu hình; timer/tier persist theo duyệt, HUD đúng server. |
| T45 | Trade session và offer | T07, T25, T29, T32, T36–T37, D05, D13 | Không | Hai online cùng Map+Area/range; partial stack/Gold không fee, chỉ UNLOCKED unequipped; đổi offer reset cả hai confirm; rời range/đổi map-area/disconnect/death cancel; offer không thể tiêu đồng thời qua shop/loot/enhance. |
| T46 | Atomic trade commit và UI | T21, T45 | A05 (item) | Revalidate item/Gold/capacity/version trước commit; test hai confirm đồng thời, inventory đổi, retry/crash không nhân/mất tài sản; UI xem offer hai bên/confirm reset/cancel; tích hợp hai browser qua. |
| T47 | Online Auto Farm | T15, T31, T39–T40, T43, D08 | A02–A05 | Cấu hình movement/target/basic/selected skills/loot/potion theo duyệt; dùng cùng validator thủ công, không vượt quyền/cooldown; bật/tắt/dừng đúng, auto cast có Skill EXP; không auto-dodge World Boss. |
| T48 | Offline auto settlement | T07, T23, T38, T44, D01, D08 | Không | EXP tu luyện/skill theo config duyệt, không item drops; không tự gán rule Gold; giới hạn thời gian/cap/penalty đúng duyệt; concurrent login/claim/retry không thưởng hai lần; clock giả và round-trip DB qua. |

## 6. World Boss và nội dung hoàn chỉnh

| ID | Tác vụ nhỏ | Phụ thuộc | Asset | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| T49 | Scheduler và global encounter | T07, T13–T14, T27, D11, D14 | Không | Một encounter theo fixed server schedule/múi giờ duyệt; global HP lưu nhất quán, timeout fail không reward; hai worker/tick trùng không spawn hai encounter; không tự thêm Redis nếu chưa chứng minh cần. |
| T50 | World Boss AI local, telegraph và taunt | T27, T39, T43, T49, D03, D11 | A04–A05 (World Boss) | Một phase/nhiều skills, telegraph+castTime; AI/threat local từng Area, HP global; taunt hoạt động, CC/interrupt khác immune; không leash reset; Auto Farm được dùng nhưng không auto-dodge. |
| T51 | Contribution và bảng xếp hạng | T44, T49–T50, D11 | Không | effectiveBossDamage + effectiveDamageActuallyTakenFromBoss×TankWeight; minContribution; tie-break người đạt trước và biên trùng timestamp theo duyệt; overkill/retry/đổi instance không double-count; hai Area test cùng leaderboard. |
| T52 | Reward World Boss và UI encounter | T21, T33, T50–T51, D11 | A04–A05 | Đúng tiers 1/2/3–10/11–20/21–50/51–100/101–500; >500 không reward; timeout không reward; personal vào inventory/pending idempotent; test mốc rank/minContribution và hai instance nhận kết quả toàn cục. |
| T53 | Tích hợp Visual Set và catalog phát hành | T12, T18, T32, T35, T39, T42, T52, D12 | A06 và tất cả phần catalog được duyệt | Equip đổi đúng layer, nhiều template chung set; stats/network không đổi vì thay art; mọi reference có asset đã kiểm định, không placeholder ngầm; mỗi map có collision/portal/NPC/quest/loot/skill source đúng catalog. |

## 7. Kiểm chứng xuyên hệ thống và chuẩn bị phát hành

Test đơn vị/tích hợp nằm ngay trong từng tác vụ T, không dồn đến cuối. Các tác vụ dưới đây kiểm chứng các tương tác và rủi ro chỉ xuất hiện khi ghép hệ thống.

| ID | Tác vụ nhỏ | Phụ thuộc | Asset | Tiêu chí nghiệm thu |
|---|---|---|---|---|
| T54 | Kiểm thử lạm dụng và phân quyền xuyên hệ thống | T20, T23–T25, T31–T48, T52, D14 | Không | Ma trận intent giả/ID người khác/replay/rate abuse/integer overflow áp dụng endpoint và room; không teleport, tạo Gold/item/EXP hoặc trade LOCKED; log không lộ credential; sửa lỗi và chạy lại gate liên quan. |
| T55 | Persistence, restart và phục hồi economy | T07, T20, T29–T33, T45–T49, T52, D13–D14 | Không | Fault injection disconnect/crash quanh commit/settlement; restore DB test và migration trên bản sao thành công; party/cooldown/ground loot theo duyệt; reward/trade không mất hoặc duplicate; tài liệu recovery có bằng chứng. |
| T56 | Bộ browser E2E và regression gameplay | T48, T52–T55, D01, D14 | A02–A06 | Luồng đăng nhập→di chuyển hai client→kill/party/loot→equip/shop/enhance/breakthrough→quest/portal/death→skill/potion/auto→PvP/trade→World Boss/pending qua; kiểm riêng từng nhánh fail; resize và trình duyệt hỗ trợ qua; screenshot/trace lưu làm bằng chứng. |
| T57 | Kiểm thử tải và profiling FE/BE/DB | T20, T49–T56, D14 | A02–A06 | Kịch bản room đông, combat/loot/trade/boss nhiều Area chạy theo tải duyệt; đo tick latency, network, FPS, DB contention, memory; đạt ngưỡng được duyệt; chỉ thay kiến trúc/Redis khi có số đo và retest chứng minh. |
| T58 | Nghiệm thu đặc tả và hồ sơ phát hành | T53–T57 | A02–A06 | Ma trận GAME_SPEC 1–25 ánh xạ task/test/asset không bỏ sót; lint/typecheck/tests/build và browser qua, không còn D chặn phạm vi duyệt; config/asset manifest/version/changelog/runbook/backup đầy đủ; ghi rủi ro còn lại; triển khai/push chỉ là bước riêng sau phê duyệt, chưa thực hiện trong task này. |

## Phase 1 được yêu cầu ngày 08/10/2026

Phạm vi bổ sung được người dùng cho phép: nền tảng và cảnh multiplayer thử local. Các mục P1 là lát cắt nhỏ của roadmap; không tự đánh dấu hoàn tất T03/T06/T13/T18/T20 nếu chưa đủ DB, auth, map hay animation phát hành. Phòng thử không có Account/Character persistence, không phải chính sách đăng nhập tạm cho game. Cảnh hình học và tốc độ là fixture kỹ thuật, không phải balance chính thức; frame South đã tạo chỉ là asset thử tĩnh, không coi là A02 hoàn chỉnh.

| ID | Trạng thái | Phụ thuộc | Tiêu chí nghiệm thu |
|---|---|---|---|
| P1-01 | DONE | Không | Workspace bốn package/app đúng stack; lint/typecheck/unit tests/build qua; CI dùng lockfile; game-core thuần TS. Bằng chứng: lượt gate đầu 4 lint, 4 typecheck, 6 test, 4 build qua. CI mới viết, chưa chạy remote. |
| P1-02 | DONE | P1-01 | Colyseus local room nhận intent validated/versioned; chống sequence cũ và outcome giả; server tick/collision footprint/diagonal đúng; test hai client thật và disconnect qua. Gate server qua, 4 tests; 2 lượt sửa tích hợp/teardown. |
| P1-03 | DONE | P1-01 | Compose config, Prisma validate/generate và gate server qua; đã khởi động Docker Desktop đang cài, Engine 29.8.0; PostgreSQL 17 healthy loopback 54329. Migration trên DB dev và DB test mới qua; round-trip+rollback DB test qua. Blocker P1001 ban đầu đã giải quyết, không reset dữ liệu. |
| P1-04 | DONE | P1-02 | Lint/typecheck/9 unit-integration tests/build qua; Playwright 1 test hai browser qua (19.3s), movement/collision/resize/disconnect/reload; screenshot đã xem. Asset revalidate và giới hạn tĩnh ghi rõ. 1 lượt sửa cổng E2E/baseURL. |
| P1-05 | DONE | P1-02–P1-04 | Gate cuối lint/typecheck/9 tests/build qua; E2E cuối 1 test hai browser qua (20.8s); Prisma/DB migration/round-trip qua; README/progress/manifest cập nhật. Đã dừng cuối Phase 1, chưa push/deploy/chạy CI remote. |

## Việc tiếp theo

T09/T10/T11 DONE sau resume máy nhà: recovery mock test đầy đủ, backend tải Character và frontend session đã verify. T59/T60 giữ DONE. Phiên resume dừng đủ3 task; T13 đủ dependency để xem xét ở phiên tiếp theo, không tự DONE vì đã có code room từ T09. T12 còn D12/D15/A02; D02–D14 và policy tên Character chưa được tự chốt. Email production chưa cấu hình, không dùng mock thay email thật. AUTH_LOCAL.md/progress.md ghi gate hiện tại; các đoạn Phase1/handoff cũ là hồ sơ lịch sử.

Phase 1 hoàn tất trong phạm vi nền tảng/cảnh thử local và kiểm chứng DB. Dừng tại đây; chỉ bắt đầu Phase 2 khi có yêu cầu mới. Các tác vụ account/gameplay và tài nguyên phát hành tiếp tục chờ quyết định D tương ứng; P1 không tự hoàn tất T07–T12 hoặc A02–A03.

## Công cụ điều phối phát triển

| Công việc | Trạng thái | Tiêu chí và bằng chứng nghiệm thu |
|---|---|---|
| Xây bộ điều phối auto-dev an toàn | DONE | Có auto-dev.ps1, verify.ps1, JSON schema và AUTO_DEV.md; 18 kiểm thử Codex/pnpm giả qua, quality gates thật và browser smoke qua. Dry-run roadmap thật chọn T03, báo Git bẩn/chưa HEAD; chưa chạy phát triển game. Chi tiết bằng chứng trong progress.md. |
| Sửa launcher Windows và thêm progress realtime | DONE | Tái hiện lỗi PowerShell với đối số stdin `-`, sửa sang npm Node entry point; 25 kiểm thử qua, 4 quality gates qua, smoke CLI thật read-only/schema CODEX_OK exit 0. Progress ở stderr, summary stdout JSON thuần, log raw/structured riêng. Không chạy loop và không mở lại T03 FAILED. |
| Thêm chế độ Live có màu và timestamp | DONE | 31/31 kiểm thử gồm stream trước exit, stderr/JSON sai/timeout/SIGINT và regression launcher qua; lint/typecheck/test/build PASS. Smoke CLI thật read-only CODEX_OK và dry-run với Live/MaxTasks/MaxMinutes/StopOnFailure qua. Summary JSON giữ nguyên, checkpoint chỉ sau PASS; T03/journal FAILED không tự mở khóa. Bằng chứng và giới hạn Ctrl+C trong progress.md. |

## Registry trạng thái cho auto-dev

Registry dưới đây là nguồn trạng thái máy đọc; bảng phía trên giữ tên, phạm vi và tiêu chí nghiệm thu. T01/T02/T06 kế thừa bằng chứng nền tảng trong progress.md; các tác vụ đầy đủ khác vẫn TODO. P1 hoàn tất không đồng nghĩa toàn bộ T/A hoàn tất. Phụ thuộc D bao gồm các mục “Chặn các phần” đã ghi ở trên; không tự mở khóa quyết định. FAILED/DOING cần kiểm tra thủ công.

<!-- AUTO_DEV_TASKS_START -->
```json
{
  "version": 1,
  "tasks": [
    {
      "id": "T60",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T05",
        "T59"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "D15",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D01",
      "kind": "decision",
      "status": "DONE",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D02",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D03",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D04",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D05",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D06",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D07",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D08",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D09",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D10",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D11",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D12",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D13",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "D14",
      "kind": "decision",
      "status": "BLOCKED",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T01",
      "kind": "task",
      "status": "DONE",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T02",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T01"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T03",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T02"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T04",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T01",
        "T03"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T05",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T03",
        "T04"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T06",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T01",
        "T03"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T07",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T04",
        "T06"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T08",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T05",
        "T06",
        "T07"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T59",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T05",
        "T08"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T09",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T04",
        "T08",
        "D01",
        "T59"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T10",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T05",
        "T07",
        "T08",
        "T09",
        "D01",
        "T59"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T11",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T09",
        "D01"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T12",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T10",
        "T11",
        "D12",
        "D01",
        "D15"
      ],
      "assets": [
        "A02"
      ],
      "e2e": true
    },
    {
      "id": "A01",
      "kind": "asset",
      "status": "TODO",
      "dependencies": [
        "T01",
        "T03",
        "D12"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "A02",
      "kind": "asset",
      "status": "TODO",
      "dependencies": [
        "A01",
        "D12"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "A03",
      "kind": "asset",
      "status": "TODO",
      "dependencies": [
        "A01",
        "A02",
        "T05",
        "D05",
        "D12"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "A04",
      "kind": "asset",
      "status": "TODO",
      "dependencies": [
        "A01",
        "D05",
        "D11",
        "D12"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "A05",
      "kind": "asset",
      "status": "TODO",
      "dependencies": [
        "A01",
        "D04",
        "D07",
        "D11",
        "D12"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "A06",
      "kind": "asset",
      "status": "TODO",
      "dependencies": [
        "A02",
        "A03",
        "A04",
        "A05",
        "D12"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T13",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T04",
        "T09",
        "T10"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T14",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T05",
        "T13"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T15",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T04",
        "T13",
        "T14"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T16",
      "kind": "task",
      "status": "DONE",
      "dependencies": [
        "T11",
        "T13",
        "T15"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T17",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T14",
        "T16",
        "D05"
      ],
      "assets": [
        "A03"
      ],
      "e2e": true
    },
    {
      "id": "T18",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T15",
        "T16",
        "T17",
        "D05"
      ],
      "assets": [
        "A02"
      ],
      "e2e": true
    },
    {
      "id": "T19",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T05",
        "T14",
        "T17",
        "D05"
      ],
      "assets": [
        "A03",
        "A04"
      ],
      "e2e": true
    },
    {
      "id": "T20",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T09",
        "T13",
        "T15",
        "T18",
        "D01"
      ],
      "assets": [
        "A02",
        "A03"
      ],
      "e2e": true
    },
    {
      "id": "T21",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T04",
        "T16",
        "T18"
      ],
      "assets": [],
      "e2e": true
    },
    {
      "id": "T22",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T03",
        "T05",
        "T08",
        "D02"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T23",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T08",
        "T22",
        "D02"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T24",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T05",
        "T07",
        "D04"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T25",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T08",
        "T24",
        "D04"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T26",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T05",
        "T15",
        "T22",
        "D03"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T27",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T14",
        "T15",
        "T19",
        "T26",
        "D05",
        "D03"
      ],
      "assets": [
        "A04"
      ],
      "e2e": false
    },
    {
      "id": "T28",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T18",
        "T21",
        "T26",
        "T27",
        "D03"
      ],
      "assets": [
        "A02",
        "A04",
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T29",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T08",
        "T09",
        "T10",
        "T13",
        "D06"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T30",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T23",
        "T24",
        "T27",
        "T29",
        "D06",
        "D05"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T31",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T25",
        "T30",
        "D06",
        "D13"
      ],
      "assets": [
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T32",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T22",
        "T24",
        "T25",
        "D04"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T33",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T23",
        "T25",
        "D13",
        "D04"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T34",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T19",
        "T22",
        "T23",
        "T24",
        "T25",
        "D02",
        "D05",
        "D04"
      ],
      "assets": [
        "A04"
      ],
      "e2e": false
    },
    {
      "id": "T35",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T24",
        "T25",
        "T32",
        "T34",
        "D04"
      ],
      "assets": [
        "A04",
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T36",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T14",
        "T19",
        "T34",
        "D05",
        "D09"
      ],
      "assets": [
        "A03",
        "A04"
      ],
      "e2e": false
    },
    {
      "id": "T37",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T26",
        "T36",
        "D09",
        "D05"
      ],
      "assets": [
        "A02",
        "A04",
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T38",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T05",
        "T07",
        "T24",
        "T25",
        "D07",
        "D03"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T39",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T26",
        "T28",
        "T38",
        "D03",
        "D07"
      ],
      "assets": [
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T40",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T25",
        "T35",
        "T39",
        "D08"
      ],
      "assets": [
        "A05"
      ],
      "e2e": true
    },
    {
      "id": "T41",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T25",
        "T30",
        "T34",
        "D09"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T42",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T21",
        "T33",
        "T41",
        "D04",
        "D09"
      ],
      "assets": [
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T43",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T14",
        "T26",
        "T36",
        "T37",
        "D10"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T44",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T21",
        "T23",
        "T28",
        "T43",
        "D06",
        "D10"
      ],
      "assets": [
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T45",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T25",
        "T29",
        "T32",
        "T36",
        "T37",
        "D05",
        "D13"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T46",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T21",
        "T45",
        "D13"
      ],
      "assets": [
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T47",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T15",
        "T31",
        "T39",
        "T40",
        "T43",
        "D08"
      ],
      "assets": [
        "A02",
        "A03",
        "A04",
        "A05"
      ],
      "e2e": true
    },
    {
      "id": "T48",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T23",
        "T38",
        "T44",
        "D01",
        "D08"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T49",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T13",
        "T14",
        "T27",
        "D11",
        "D14"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T50",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T27",
        "T39",
        "T43",
        "T49",
        "D03",
        "D11"
      ],
      "assets": [
        "A04",
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T51",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T44",
        "T49",
        "T50",
        "D11"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T52",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T21",
        "T33",
        "T50",
        "T51",
        "D11"
      ],
      "assets": [
        "A04",
        "A05"
      ],
      "e2e": false
    },
    {
      "id": "T53",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T12",
        "T18",
        "T32",
        "T35",
        "T39",
        "T42",
        "T52",
        "D12"
      ],
      "assets": [
        "A06"
      ],
      "e2e": true
    },
    {
      "id": "T54",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T20",
        "T23",
        "T24",
        "T25",
        "T31",
        "T32",
        "T33",
        "T34",
        "T35",
        "T36",
        "T37",
        "T38",
        "T39",
        "T40",
        "T41",
        "T42",
        "T43",
        "T44",
        "T45",
        "T46",
        "T47",
        "T48",
        "T52",
        "D14"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T55",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T07",
        "T20",
        "T29",
        "T30",
        "T31",
        "T32",
        "T33",
        "T45",
        "T46",
        "T47",
        "T48",
        "T49",
        "T52",
        "D13",
        "D14"
      ],
      "assets": [],
      "e2e": false
    },
    {
      "id": "T56",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T48",
        "T52",
        "T53",
        "T54",
        "T55",
        "D01",
        "D14"
      ],
      "assets": [
        "A02",
        "A03",
        "A04",
        "A05",
        "A06"
      ],
      "e2e": false
    },
    {
      "id": "T57",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T20",
        "T49",
        "T50",
        "T51",
        "T52",
        "T53",
        "T54",
        "T55",
        "T56",
        "D14"
      ],
      "assets": [
        "A02",
        "A03",
        "A04",
        "A05",
        "A06"
      ],
      "e2e": true
    },
    {
      "id": "T58",
      "kind": "task",
      "status": "TODO",
      "dependencies": [
        "T53",
        "T54",
        "T55",
        "T56",
        "T57",
        "D14"
      ],
      "assets": [
        "A02",
        "A03",
        "A04",
        "A05",
        "A06"
      ],
      "e2e": true
    },
    {
      "id": "P1-01",
      "kind": "task",
      "status": "DONE",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "P1-02",
      "kind": "task",
      "status": "DONE",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "P1-03",
      "kind": "task",
      "status": "DONE",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "P1-04",
      "kind": "task",
      "status": "DONE",
      "dependencies": [],
      "assets": [],
      "e2e": false
    },
    {
      "id": "P1-05",
      "kind": "task",
      "status": "DONE",
      "dependencies": [],
      "assets": [],
      "e2e": false
    }
  ]
}
```
<!-- AUTO_DEV_TASKS_END -->

## Kiểm tra bàn giao máy nhà — 08/10/2026

Không thay registry hoặc mở task phát triển. T59 giữ DONE; T09 DOING/PAUSE, recovery chưa thực hiện và trả 503. Setup/runtime/core gates đã kiểm, E2E Starter Village FAIL hai lượt tại assertion điểm dừng x<328; cần xử lý trước khi xác nhận browser acceptance toàn bộ máy nhà. Xem HOME_SETUP.md và progress.md. Chưa resume T09 hoặc task phụ thuộc.
