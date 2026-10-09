# GAME_SPEC.md
# ĐẶC TẢ NGHIỆP VỤ — 2D MMORPG WEB

> Đây là SOURCE OF TRUTH về nghiệp vụ của game.
> Codex phải đọc file này trước khi thiết kế hoặc sửa các hệ thống gameplay.
> Không tự ý thay đổi các rule đã đánh dấu CHỐT.
> Các con số được ghi là "balance/config" phải nằm trong dữ liệu cấu hình, không hardcode vào logic.

## 1. Tầm nhìn và công nghệ

Game 2D top-down multiplayer web RPG, cảm hứng tu luyện / Đấu Phá Thương Khung.

Stack đã chốt:
- TypeScript.
- Monorepo: pnpm workspace + Turborepo.
- Web: Next.js + React.
- World/rendering: Phaser.
- Multiplayer server: Node.js + Colyseus.
- Database: PostgreSQL + Prisma.
- Map editor: Tiled.
- Redis chỉ thêm khi thực sự cần.
- `packages/game-core`: pure TypeScript, không import React/Next/Phaser/Colyseus.
- `packages/shared`: contract/type dùng chung client-server.

Nguyên tắc:
- Server authoritative đối với movement, collision, combat, reward, inventory, currency và các transaction quan trọng.
- React quản lý HUD/panel/UI.
- Phaser quản lý map, player, monster, NPC, effect, camera và input gameplay.
- Không đẩy realtime movement qua React state.

## 2. World, camera và art direction — CHỐT

### 2.1 World / camera / collision
- Base world unit: 32px.
- Player source frame: **128x128 px** cho mỗi frame animation.
- Player render scale là tham số cấu hình theo map/camera; không hardcode giá trị cũ 0.5 của frame 192px. Ưu tiên chiều cao hiển thị nhân vật khoảng 70–100 world px, điều chỉnh bằng preview thực tế.
- Collision body player chỉ bao quanh vùng chân / ground footprint, KHÔNG dùng toàn bộ bounding box sprite.
- Foot position, baseline và origin phải nhất quán giữa animation, direction và các visual layer.
- Reference gameplay viewport: 1920x1080; camera responsive và có zoom clamp.
- UI React responsive độc lập với Phaser camera.
- Map có thể khác kích thước nhưng phải tuân theo cùng world coordinate system.
- Movement gameplay vẫn cho phép đi chéo; chỉ **animation hướng** giới hạn ở 4 hướng chính. Mapping hướng chéo sang N/E/S/W phải nhất quán, không làm thay đổi tốc độ di chuyển hay server-authoritative movement.

- Bổ sung theo yêu cầu chủ sản phẩm 08/10/2026: giữ input khi gặp collision thì server cho nhân vật men theo cạnh footprint nếu có lối hợp lệ, không xuyên vật cản hoặc tăng tốc; khi buông phím thì dừng. Đây là movement authoritative, không do client tự sửa vị trí.

### 2.2 Art direction nhân vật — CHỐT
- Tham khảo **phong cách hình ảnh gameplay của Thiên Kiếp Lục (tklgame.com)**, đặc biệt tỷ lệ nhân vật và cách shading; KHÔNG sao chép nguyên mẫu nhân vật, logo hay sprite có bản quyền.
- Chibi anime fantasy MMORPG, tiên hiệp / tu luyện, góc nhìn top-down 3/4.
- Đầu lớn vừa phải; thân nhỏ nhưng tay/chân rõ, không quá lùn hoặc quá đơn giản.
- Mặt anime, mắt tương đối lớn; tóc và trang phục nhiều layer, đường viền sạch, silhouette dễ đọc khi hiển thị nhỏ.
- **2D painted/cartoon sprite với soft shading**, KHÔNG sử dụng pixel art thuần hoặc pixelation nặng.
- Thiết kế character nhất quán giữa các hướng, frame, animation; trang phục tiên hiệp Trung Hoa fantasy.
- Sprite có nền trong suốt thật (alpha); không bake map, text, grid, vũ khí mặc định hay hiệu ứng vào base body.
- **Bóng mềm dạng ellipse tách riêng khỏi sprite**, render dưới chân nhân vật bằng Phaser; không bake shadow vào spritesheet.
- Với asset mới (player, NPC, monster tương thích, trang phục), giữ cùng hệ thẩm mỹ, ánh sáng, tỉ lệ và độ chi tiết. Có thể dùng screenshot TKL do user cung cấp làm *style reference*.

### 2.3 Hướng và animation — CHỐT
- Bổ sung CHỐT 09/10/2026: có Male Base và Female Base; mỗi giới tính có hình animation riêng nhưng dùng chung animation state machine và format metadata. IDLE/RUN cho mỗi base tuân thủ contract dưới đây: 48 frame/base, tổng 96 frame cho hai base. Master phải được chủ sản phẩm duyệt trước khi sản xuất animation; preview không phải production-ready.
- Base body, tóc, trang phục, vũ khí, hiệu ứng và bóng chân là các layer độc lập; không bake trang phục trang bị, vũ khí, hiệu ứng hoặc bóng vào base body. Master preview được thể hiện với trang phục cơ bản trung tính để duyệt hình ảnh, chưa chứng minh đã tách layer production.
- Chỉ có **4 hướng animation: N, E, S, W**. Không yêu cầu tạo NE/SE/SW/NW.
- **IDLE: 4 frames / hướng**; thở, tóc/quần áo lay nhẹ, chân không trượt.
- **RUN: 8 frames / hướng**; bước chân/tay rõ ràng, loop mượt, không foot sliding.
- Mỗi frame **128x128 px**, consistent origin/foot baseline, consistent visual scale.
- Asset animation ưu tiên `1 animation × 1 direction = 1 spritesheet`; có metadata mô tả thứ tự frame, hướng, origin, baseline và preview.
- Khi tạo animation mới phải lấy cùng một character reference để tránh biến đổi mặt, tóc, quần áo, tỷ lệ giữa IDLE/RUN và các hướng.
- Nếu nhân vật có nhiều layer: BODY / HAIR / ARMOR / PANTS / SHOES / WEAPON / EFFECT, mọi layer phải đồng bộ animation, direction, frame index, frame size, origin và baseline.
- Equipment dùng Visual Set; nhiều ItemTemplate có thể dùng chung Visual Set. Equip đổi layer tương ứng, không yêu cầu sprite riêng cho từng item.

### 2.4 Asset generation và validation
- Codex dùng `$generate2dsprite` khi cần sprite/animation và `$generate2dmap` khi cần map, nếu các skill đã được cài và khả dụng.
- Asset mới phải tuân theo mục 2.2–2.3; không tự ý chuyển lại 8 hướng hay 192x192.
- Validate transparency, frame dimensions/count, alignment, origin, baseline, visual consistency và animation preview trước khi integrate.
- Map phải hỗ trợ props, collision, depth/Y-sort và world coordinates thống nhất FE/BE.
- Collision nhà/cây/công trình bám chân đế thực tế, dùng polygon hoặc nhiều AABB; không dùng toàn bộ sprite/image bounding box. Cho phép đi sau mái/tán ở vùng ngoài footprint. Water dùng polygon theo bờ thực tế.
- Occlusion áp dụng cho mọi object theo mục 2.5, thay thế quy tắc tree-only/local-only/alpha 0.5 trước đây theo CHỐT mới của chủ sản phẩm.
- Collision authoritative ở server; tree fade là hiệu ứng visual client-side. Không thay đổi movement/camera/networking ổn định chỉ vì thay art.

### 2.5 Collision và multiplayer occlusion — CHỐT (08/10/2026)

- Áp dụng toàn game, không chỉ Starter Village. Collision footprint, visual bounds, occlusion region và sorting anchor là các dữ liệu tách biệt; FE/BE dùng cùng collision. Vùng đỏ tham chiếu cũ là tool tạo sai, đường trắng là mục tiêu; thiếu ảnh/tọa độ chính xác phải xem asset và cung cấp editor trực quan, không claim đã khớp đường trắng.
- Server authoritative vị trí/collision; không phá movement, camera, Y-sort. Không đổi collision khi object mờ; không đổi painted/cartoon soft shading.
- Khi bất kỳ local hoặc remote Character được phép quan sát trong cùng Area thực sự bị object phía trước che, object fade về opacity 0.4 trong 150–200ms trên tất cả client quan sát object. Không fade Character/map hoặc chỉ vì đứng gần. Nhiều Character cùng che vẫn mờ, chỉ về 1 khi không còn ai bị che. Có cơ chế ổn định ranh giới chống flicker.
- Client tính từ toàn bộ vị trí Character liên quan nhận qua đồng bộ hiện có và metadata chung; không gửi opacity liên tục qua WebSocket, không nhận/lộ vị trí ngoài visibility được phép. Cơ chế chung cho mọi object, ưu tiên spatial index hoặc viewport/nearby filter thay vì duyệt toàn map mỗi frame.
- Metadata object hỗ trợ objectId, visualBounds, collisionFootprint (polygon/multiple AABB), occlusionRegion, sortingAnchor, fadeOpacity. Debug/editor có thể hiển thị footprint, occlusion, anchor, local/remote và bật/tắt overlays. Disconnect/reconnect phải cập nhật occupancy đúng, không lưu coverage của entity đã rời snapshot.
- Mọi thay đổi geometry cần kiểm định loader, server collision, unit và browser hai client; việc duyệt đường trắng bằng hình ảnh là riêng khi chưa có tham chiếu chính xác.

## 3. Account và Character — CHỐT

- 1 Account = 1 Character.
- Class chọn khi tạo character và không thể đổi.
- CHỐT 09/10/2026: giới tính ngoại hình có hai lựa chọn Male/Female, độc lập với class. Physical DPS, Magic DPS và Tank dùng chung hệ thống Male Base/Female Base và animation, không tạo body hoặc animation riêng theo class.
- Trang phục và vũ khí hiển thị bằng layer riêng theo class hoặc trang bị đang mặc. Trang bị thông thường không yêu cầu class; Weapon vẫn có Class requirement theo mục 6. Kiến trúc visual không thay đổi điều kiện sử dụng trang bị.
- Chưa CHỐT quy tắc đổi giới tính ngoại hình sau khi tạo nhân vật; không tự cho phép hoặc cấm vĩnh viễn. Contract/persistence và luồng đăng ký cần bổ sung lựa chọn Male/Female ở tác vụ triển khai sau; bước master preview không migration hoặc sửa dữ liệu account hiện hữu.
- Class MVP:
  - Physical DPS.
  - Magic DPS.
  - Tank.

### 3.1 Tài khoản, xác thực và phiên — CHỐT D01 (08/10/2026)

- Đăng ký và đăng nhập bằng username/password.
- Mỗi account có đúng một Character; class được chọn lúc đăng ký account và không thể đổi sau đăng ký.
- Khôi phục mật khẩu dùng địa chỉ email đã xác minh. Xác minh email bắt buộc cho khôi phục mật khẩu; không mặc định bắt buộc cho đăng nhập thông thường.
- Chỉ một phiên gameplay hoạt động trên mỗi account. Khi đăng nhập từ thiết bị khác, server phải ngắt phiên gameplay trước.
- Khi mất kết nối bất ngờ, giữ phiên Character trong 30 giây để reconnect. Reconnect thành công khôi phục Character/phiên hiện có, không tạo Character mới.
- Sau 30 giây không reconnect, đánh dấu offline và loại Character khỏi active world theo quy tắc server hiện có.
- Xác thực, quản lý phiên và validation reconnect do server quyết định.
- Password phải được hash an toàn, không lưu plaintext.
- Session token được server quản lý và kiểm định; phiên sai hoặc hết hạn không được truy cập thao tác gameplay được bảo vệ.

### 3.2 Nhân vật khởi đầu khi đăng ký — CHỐT (08/10/2026)

- Đăng ký thành công phải tạo Character ngay; mỗi Account có đúng một Character, class chọn lúc đăng ký và không đổi.
- Realm khởi đầu Đấu Chi Khí, 1★, tiến độ tu luyện 0%.
- Gold khởi đầu 0n (BigInt), PK OFF. Current HP = Max HP, Current KI = Max KI.

| Class | Max HP | Current HP | Max KI | Current KI |
|---|---:|---:|---:|---:|
| Physical DPS | 120 | 120 | 60 | 60 |
| Magic DPS | 90 | 90 | 120 | 120 |
| Tank | 180 | 180 | 50 | 50 |

- Map ID `starter_village`, Area ID `area_01`, Respawn ID `starter_respawn_01`; khu vực SAFE, không cho phép PK.
- Trước dùng trong đăng ký, server phải xác minh map load được, Area thuộc map, Respawn thuộc khu vực và tọa độ nằm trên vùng đi được, không mắc collision/vật cản; FE/BE/DB dùng cùng ID.
- Không thay ID khác hoặc dùng fixture kỹ thuật Phase 1 làm dữ liệu đăng ký. Chỉ tạo registry/config/seed cho các ID này khi có đủ dữ liệu map/area/collision/spawn hợp lệ; thiếu map/tọa độ phải BLOCKED, không tự đặt tọa độ.
- Account và Character được tạo cùng transaction; lỗi tạo Character rollback toàn bộ đăng ký. Concurrent request/retry không tạo trùng, theo hợp đồng idempotency.
- Dữ liệu khởi đầu lấy từ cấu hình server được kiểm định, không cho client ghi đè HP/KI/Gold/Realm/Star hoặc vị trí. Quyết định này không mở khóa các nghiệp vụ D02 khác.

## 4. Chỉ số — CHỐT

Stats:
- HP
- KI
- PHYS_ATK
- MAGIC_ATK
- DEF
- CRIT_RATE
- CRIT_DMG
- ATK_SPEED
- MOVE_SPEED

Không có cộng điểm thủ công.

### 4.1 Biểu diễn số và làm tròn — CHỐT (quyết định T08, 08/10/2026)

- HP và KI được lưu bằng số nguyên không âm.
- Kết quả tính damage và lượng hồi HP/KI phải làm tròn xuống.
- Gold dùng BigInt trong tính toán domain và lưu trữ ở nơi hỗ trợ.
- HP, KI và Gold không bao giờ được âm.
- Khi truyền BigInt qua JSON/WebSocket, dùng chuỗi rõ ràng, bảo toàn giá trị; không chuyển qua Number gây mất chính xác.
- Validation và giao dịch Gold vẫn do server quyết định, thực hiện atomically.
- Quyết định này không xác định thêm công thức combat, giới hạn cân bằng hoặc dữ liệu khởi đầu.

## 5. Tu luyện — CHỐT

Không dùng conventional level.

Realm:
1. Đấu Chi Khí
2. Đấu Giả
3. Đấu Sư
4. Đại Đấu Sư
5. Đấu Linh
6. Đấu Vương
7. Đấu Hoàng
8. Đấu Tông
9. Đấu Tôn
10. Đấu Thánh
11. Đấu Đế

Mỗi Realm có 1★–9★.

- Tăng sao bằng Cultivation EXP.
- Đủ EXP thì tự tăng sao.
- Tăng sao hồi đầy HP + KI.
- EXP được overflow giữa các sao trong cùng Realm.
- Tại 9★100%: hard cap.
- Không overflow EXP sang Realm tiếp theo.

Đột phá:
- Thực hiện tại NPC.
- Chỉ khi 9★100%.
- Tốn Gold + materials theo config.
- Realm thấp có thể cấu hình 100%; Realm cao có thể thất bại.
- Không pity.
- Thất bại: mất chi phí, giữ nguyên 9★100%, không chết.
- Thành công: Realm tiếp theo 1★, EXP = 0, full HP + KI.

## 6. Item / Inventory — CHỐT

Rarity:
White / Green / Blue / Purple / Orange / Red / Gold.

- Cùng ItemTemplate có thể drop nhiều rarity.
- Rarity ảnh hưởng base multiplier + affix count/quality.
- Random rolls được cố định tại thời điểm drop.
- MVP không reroll.

Item architecture:
- ItemTemplate: dữ liệu tĩnh.
- ItemInstance: instance riêng cho equipment.
- Binding: LOCKED / UNLOCKED.
- Binding do source quyết định và không thay đổi khi equip.
- Locked vẫn equip/use/NPC sell/discard được, nhưng không trade.
- Stackable chỉ merge khi cùng template + binding.
- Stack tối đa 999.

Inventory:
- Mặc định 25 slots.
- Mỗi expansion +5.
- Tối đa 40.

Equipment slots:
- Weapon
- Helmet
- Armor
- Pants
- Shoes

Requirement:
- Realm + Star.
- Weapon thêm Class requirement.

## 7. Enhancement — CHỐT

- Chỉ tại NPC.
- Equipment phải unequipped.
- Fail mất Gold/material nhưng không downgrade/break.
- Mỗi enhancement level tăng 5% Base Stat.
- Một loại Enhancement Stone dùng chung.
- NPC không bán Enhancement Stone.
- Stone UNLOCKED có thể trade.

Max enhancement:
- White +4
- Green +6
- Blue +8
- Purple +10
- Orange +12
- Red +14
- Gold +16

Success rate/cost/material phải data-driven qua EnhancementConfig.

## 8. Gold và NPC Shop — CHỐT

Currency duy nhất: Gold.

NPC Shop:
- Infinite stock.
- NPC sell price lấy cố định từ ItemTemplate.sellPrice.
- Không cộng giá theo rarity/affix/enhancement.
- Không buyback.
- `canSellToNpc` quyết định item có bán được không.

## 9. Monster — CHỐT

Monster type:
NORMAL / ELITE / BOSS / WORLD_BOSS.

Behavior độc lập:
PASSIVE / AGGRESSIVE.

Normal/Elite/Boss:
- Aggro.
- Chase.
- Leash.
- Vượt leash → reset vị trí/state và full HP.

World Boss không áp dụng leash reset kiểu trên.

## 10. Combat cơ bản — CHỐT

Combat semi-auto:
- WASD movement.
- Click/select target.
- Auto basic attack target.
- Skills kích hoạt bằng keyboard.
- Có optional Auto Farm.

Combat outcome phải do server quyết định.

## 11. Reward normal / elite / boss — CHỐT

Last Hit:
- 100% Cultivation EXP.
- Gold.
- Loot ownership.

Party member:
- Không nhận Gold từ kill.
- Không có personal loot từ rule này.
- Member đủ điều kiện cùng Map + Area nhận bonus EXP = 5% EXP của killer.
- Bonus này không trừ EXP của killer.

## 12. Ground Loot — CHỐT

- 0–30 giây: owner / eligible party.
- 30–60 giây: public.
- 60 giây: despawn.

LootTable phải data-driven.

## 13. Party — CHỐT

- Member offline không tự rời party.
- Leader có thể kick.
- Nếu leader offline, member vẫn có thể leave.
- Mọi member có thể invite player.
- Join request/application chỉ leader được accept.

## 14. Skills — CHỐT

Grade:
Hoàng / Huyền / Địa / Thiên.

- Skill class-specific.
- Thiên skill phải có nguồn drop từ Boss.
- Learned skills không giới hạn số lượng.
- Skill level tối đa 10.
- Loadout chính xác 5 slots.
- Independent cooldowns.
- Không Global Cooldown.
- Skill có thể có castTime.
- Skill EXP từ valid cast hoặc Skill EXP item.
- Auto cast hợp lệ vẫn nhận Skill EXP.
- Duplicate skill book không chuyển thành Skill EXP.

## 15. Potions — CHỐT

- HP/KI potion hồi fixed amount.
- HP và KI có cooldown riêng 10 giây.
- Có thể mua NPC và drop từ monster.
- Stack max 999.
- Auto-use theo threshold cấu hình.

## 16. Auto Farm — CHỐT

Online Auto Farm có thể:
- Movement.
- Target.
- Basic attack.
- Selected skills.
- Loot.
- Potion.

Offline auto:
- Có thể nhận Cultivation EXP.
- Có thể nhận Skill EXP.
- Không có item drops.
- Giới hạn/balance cụ thể để config sau.

## 17. Map / Area / Portal — CHỐT

Map và Area là hai khái niệm riêng.

Travel qua Portal/NPC.

Portal có thể yêu cầu:
- Realm.
- Star.
- Optional MAIN quest.

MVP không tốn Gold để travel.

Area có thể override PvP rule của Map.

## 18. NPC — CHỐT

Một NPC có thể có nhiều capabilities:
SHOP / QUEST / RESPAWN / PORTAL / ENHANCEMENT / BREAKTHROUGH.

## 19. Quest — CHỐT

MVP:
- MAIN
- SIDE

Objective:
- KILL: chỉ Last Hit tính.
- COLLECT: dùng quantity thật trong Inventory và consume khi turn-in.
- TALK.

Rules:
- Manual accept.
- Unlimited active quests.
- Reward cố định: Cultivation EXP / Gold / Item.
- Inventory full → PendingReward.

## 20. Death / Respawn — CHỐT

Hai lựa chọn:
- Free revive tại saved RespawnPoint.
- Revive tại chỗ bằng Gold.

Không mất:
- Item.
- Cultivation EXP.
- Realm/Star.

RespawnPoint được tham chiếu bằng ID và có default newbie point.

## 21. PvP / PK — CHỐT

Zone:
SAFE / CONDITIONAL_PK / CHAOS.

SAFE:
- Không PvP.

CONDITIONAL_PK:
- Player có `pkEnabled`.
- Nếu ít nhất một trong hai player PK ON → có thể đánh nhau.
- PK ON killer nhận Hiếu Chiến.
- PK OFF giết player PK ON → không nhận Hiếu Chiến.

CHAOS:
- Force effective PvP.
- Không nhận Hiếu Chiến từ rule PK.

PvP combat lock:
- Sau hoạt động PvP không thể tắt PK ngay.
- PK state persist sau death.

Hiếu Chiến:
- Decay chỉ khi online.
- Có tier.
- Tier áp dụng EXP multiplier penalty.
- Giá trị cụ thể là balance/config.

## 22. Direct Trade — CHỐT

Điều kiện:
- Hai player online.
- Cùng Map + Area.
- Ở trong interaction range.

Cancel nếu:
- Di chuyển ra khỏi range.
- Đổi Map/Area.
- Disconnect.
- Death.

Trade:
- Item + Gold.
- Partial stack quantity.
- Không fee.
- Chỉ UNLOCKED item.
- Equipped item phải unequip.
- Bất kỳ thay đổi offer nào reset confirmation của cả hai.
- Trước commit phải validate inventory capacity.
- Commit bằng atomic server transaction.

## 23. World Boss — CHỐT

- Spawn theo fixed server schedule.
- Một global encounter.
- Global HP + global contribution.
- Có thể có nhiều Area Instance để chia tải.
- Boss AI/threat local theo từng Area.
- Timeout → encounter fail → không reward.
- Một phase nhưng có nhiều skills.
- Telegraph + castTime.
- Taunt hoạt động.
- Các CC/interrupt khác immune.
- Auto Farm được dùng.
- Không auto-dodge.

Contribution cá nhân:
`effectiveBossDamage + effectiveDamageActuallyTakenFromBoss * TankWeight`

- Có minContribution.
- Tie-break: ai đạt contribution trước xếp trên.

Reward tiers:
- Rank 1
- Rank 2
- Rank 3–10
- Rank 11–20
- Rank 21–50
- Rank 51–100
- Rank 101–500
- >500: không reward

Reward personal → Inventory hoặc PendingReward.

## 24. PendingReward — CHỐT

Dùng cho reward không thể giao trực tiếp, ví dụ Inventory full.

Delivery/claim phải idempotent để tránh mất hoặc duplicate reward.

## 25. Nguyên tắc implementation bắt buộc cho Codex

1. Không tự thay đổi business rule trong file này.
2. Nếu requirement chưa được file này định nghĩa, không tự suy diễn thành rule vĩnh viễn.
3. Balance values phải config/data-driven khi có khả năng tune.
4. Client gửi intent/input; server quyết định outcome quan trọng.
5. Economy operation phải ưu tiên atomic transaction + idempotency.
6. Shared contract không được duplicate tùy tiện giữa client/server.
7. `game-core` giữ domain logic thuần TypeScript khi có thể.
8. Gameplay realtime không phụ thuộc React state.
9. Code phải có cấu trúc dễ maintain, mở rộng và test.
10. Khi task mâu thuẫn với GAME_SPEC.md, phải báo conflict trước khi implementation.
