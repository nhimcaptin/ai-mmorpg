# T60 — Collision footprint và multiplayer occlusion

CHỐT ngày 08/10/2026 tại GAME_SPEC 2.5, áp dụng toàn game. Phạm vi triển khai là cơ chế dùng chung và tích hợp production map hiện hữu Starter Village; không mở content/gameplay/T09.

## Dữ liệu và công cụ

Nguồn geometry runtime: assets/maps/starter_village/object-metadata.json. Mỗi object có objectId, visualBounds, collisionFootprint (nhiều AABB/polygon đơn, kể cả lõm), occlusionRegion, sortingAnchor, fadeOpacity=0.4, fadeDurationMs=180 và boundaryInset=2 (tolerance kỹ thuật có thể chỉnh bằng metadata). Chân Character vẫn AABB (10,6), unit32, movement substep/server tick và camera giữ nguyên. Sorting anchor hiện hữu giữ nguyên; visual/image không đổi. Footprint nhà được chuyển khỏi toàn bounding box xuống phần chân đế. Tree footprint là vùng gốc/rễ. Mái/tán không chặn movement.

Không có ảnh đường trắng/đỏ chính xác trong inventory workspace đã kiểm tra. Đã mở prop.png và prop-2.png, dựng footprint/contour ban đầu dựa trên asset thật. Đây là bản authored cần duyệt hình ảnh, không claim khớp hoàn toàn đường trắng. OcclusionRegion là contour dành cho vị trí chân của actor bị che, kết hợp actor.y < sortingAnchor.y; không dùng visual bounding box đơn giản làm trigger. Contour góc trong suốt/nearby/front không fade, nhưng đây không phải pixel alpha mask tự động: đường contour vẫn cần artist review khi hình ảnh/reference thay đổi.

Loader shared strict kiểm shape đơn, self-intersection/degenerate polygon, object ID, bounds, anchor, spawn và geometry đồng nhất. Server collision dùng cùng polygons/AABB parsed. Không gửi opacity hoặc thay đổi quyền nhận vị trí; manager chỉ nhận actors từ state.players của room/Area hiện có, không có kênh dò entity ở ngoài visibility. Khi thêm AOI tương lai phải tiếp tục cung cấp snapshot actors được phép quan sát, không lấy dữ liệu toàn server.

Tiled map.embedded.tmj/map.tmj có các layer collision polygon, occlusion và sorting-anchors được đồng bộ từ metadata. packages/shared/src/starter-data.ts chứa bản embedded dùng ở cả FE/BE. Các report Forge/map-bundle/preview cũ là bằng chứng phiên art T59, không phải QA geometry T60 mới; không ghi đè art hay report lịch sử.

Editor: /tools/collision. Chọn object/geometry, kéo đỉnh, thêm/xóa đỉnh, thêm AABB, xem anchor, bật/tắt overlays, click thử local/remote và nhập/xuất JSON. Dữ liệu actor thử chỉ là preview editor, không gửi server hoặc tạo DB. Export/import chưa thay server; muốn tích hợp file đã duyệt:

```powershell
pnpm --filter @mmorpg/shared build
node scripts/import-object-metadata.mjs '<file JSON đã xuất>'
node scripts/build-starter-runtime.mjs --check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Importer kiểm loader đầy đủ trước ghi file. Lệnh update-metadata chỉ cập nhật source/generated metadata/Tiled layers, không sửa ảnh. Cần build/restart FE/BE để dùng bản mới; không có endpoint cho client tự sửa collision authoritative. Editor kiểm spawn/geometry khi export, importer kiểm lại. Sau khi xuất AABB có thể kéo các góc để chuyển thành polygon.

Runtime /starter có nút Collision debug: trắng footprint, cyan occlusion, vàng anchor, chân local xanh/remote magenta; toggle không đổi collision. Không đổi art style hoặc tạo asset thay thế. Actor hiện vẫn South tĩnh, không claim animation hoàn chỉnh.

## Cơ chế occlusion

OcclusionManager shared dùng static spatial grid, mỗi snapshot chỉ tra cells của các actor nhận được; không duyệt toàn map mỗi frame để xét coverage. Mỗi actor có set objects đang che, aggregate union cho tất cả actor. Chỉ đổi tween khi target đổi; opacity object về0.4 hoặc1 với tween180ms. Không đổi alpha nhân vật, terrain hoặc collision. Phần diagnostics chỉ cập nhật trong state/tween thay vì quét props mọi frame.

Schmitt inset: actor mới phải vào sâu ít nhất boundaryInset trước khi fade; actor đã trigger được giữ nếu vẫn nằm trong region gốc. Khi ra ngoài hoặc ra trước sorting anchor thì bỏ coverage. Tránh dao động quanh entry threshold; không cố fade chỉ vì đứng gần. Boundary tolerance2 là dữ liệu kỹ thuật, không thêm business balance. Client có cùng snapshot/metadata sẽ có cùng target; trong truyền mạng/tween có chênh lệch tạm thời theo độ trễ, không gửi opacity để đồng bộ giả. Mọi actor còn hiện trong snapshot đều được xét, bao gồm entity auth đang giữ trong reconnect grace theo session rule hiện hữu. Snapshot removal/room leave clear coverage và khôi phục object; không đổi grace30s.

## Verification

- Unit shared: aggregate một/hai actor, một rời còn một, tất cả rời; hai manager với thứ tự actor đảo vẫn cùng target; corner/nearby/front/unrelated không fade; inset boundary jitter, clear và snapshot rejoin; polygon lõm, touching boundary, invalid self-intersection; spatial grid.
- Domain: spawn/path, mái walkable/footprint blocked, tree root collision, multiple AABB/gaps và delayed tick không tunnel.
- Server: tick thật không xuyên chân đế nhà nhưng đi qua ground dưới mái; malformed/stale/caller position regression trong Colyseus hai SDK client hiện hữu.
- Browser hai context thật: remote actor trigger fade trên observer; hai actor cùng che; một rời còn mờ; người cuối disconnect, clear cả hai; reload/rejoin tại spawn không giữ coverage cũ; lần sau đi vào/đi ra opacity phục hồi; có sample alpha trung gian chứng minh tween không nhảy ngay. Debug screenshot và editor drag/overlays/invalid JSON.
- Browser regression: auth HTTP, hai client foundation movement/collision/resize/disconnect, starter canopy/root/building/zoom/resize; lỗi pageerror rỗng. DB suite test isolated kiểm starter invalid config/rollback và authenticated reconnect30s/replacement/expiry/logout hiện hữu.
- Chưa có browser gameplay UI authenticated T11: browser rejoin là preview disconnect/reload, còn authenticated reconnect kiểm bằng DB/WebSocket suite và unit manager snapshots. Không claim T09 DONE.

Lỗi E2E đầu được giữ trong logs/home-setup/collision-e2e.log: selector editor trùng nhãn Geometry, sửa exact selector; assertion cũ đòi tree về1 ở north root edge trong khi vẫn bị che, sửa test đi ra khỏi tán trước khi đòi1. Không tắt/nới collision assertion. Lượt E2E thứ hai 5/5 PASS. Kết quả gate cuối ghi tại progress.md; logs/collision-occlusion giữ log cuối, logs/home-setup giữ các lượt trước.

## Kiểm tra hình ảnh

Đã xem ảnh props gốc và screenshot multiplayer-house-occlusion.png với nhà mờ/footprint riêng; người dùng cần duyệt chính xác footprint/occlusion contour với đường trắng tham chiếu hoặc chỉnh bằng editor. Chưa nghiệm thu AOI nhiều khu, nhiều object stress test, mobile/touch, art animation hoặc map/content mới. Không mark A02/A03/T17/T09 hoặc business decisions DONE vì T60.
