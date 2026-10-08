# Authenticated room lifecycle — T13

Room starter-village nhận authenticatedJoinSchema version/token/reconnect, mọi join/rejoin kiểm DB session. Character UUID là entity ID; option chọn Character hoặc vị trí từ caller bị strict schema từ chối. Chỉ Character của session đúng starter_village/area_01 được nhận vào room hiện tại; chưa mở map/area/content mới.

State network giữ version và players {id,x,y,direction,lastSequence}. AccountID, username/password/hash/email/session/token chỉ ở service/server connection, không broadcast. Metadata public chỉ Map/Area ID. Không thêm visibility channel, room khác hoặc opacity messages.

Consent leave loại entity ngay. Mất kết nối bất ngờ giữ entity trong30s để authenticated reconnect theo D01; hết hạn loại entity. Room rỗng chỉ giữ khi có pending grace; sau grace framework auto-dispose, simulation/listener/state/resources được dọn. Logout/reset/replacement xóa pending theo session hiện tại. Khi cần vào lại room mới, dùng cùng Character lưu DB, không tạo Character mới.

DB/WebSocket suite room-lifecycle.smoke.ts kiểm đúng room ID, public state whitelist, forged/extra/version/wrong-area, movement/reconnect/leave/dispose/recreate. Browser auth-room.spec.ts kiểm hai account đăng nhập thật, stable IDs/movement observer/logout/reload/unique Character. Fixture accounts nằm DB test local và được cleanup theo UUID/receipt; không tạo account mẫu production.

Phạm vi hiện tại local một process; TLS/multi-process/load và nội dung map khác còn D14/D05, không claim đã nghiệm thu phát hành. Collision/Occlusion/art giữ nguyên.

T15: acceptMovementInput dùng chung cho room preview/authenticated. Chỉ nhận direction (-1/0/1), protocol version và safe integer sequence tăng so với cả applied/queued input; extra position, packet trùng/cũ bị từ chối. Held intent được tick server lặp đến inputTimeoutMs; số packet không quyết định số bước. Không sửa move/collision/wall slide hoặc thêm client-authoritative position.

DB suite room-lifecycle.smoke.ts bổ sung20 packet trước một explicit tick, duplicate/reordered/teleport/version/bounds, diagonal speed và timeout. Chỉ freeze timer/đặt tọa độ fixture trên server của test để kiểm tick xác định; packets vẫn qua SDK/WebSocket thật, session và Character vẫn tạo/xác thực bằng DB thật. Browser regression kiểm movement/collision/camera/remote observer và reconnect.
