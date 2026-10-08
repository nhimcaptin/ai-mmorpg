# Authenticated room lifecycle — T13

Room starter-village nhận authenticatedJoinSchema version/token/reconnect, mọi join/rejoin kiểm DB session. Character UUID là entity ID; option chọn Character hoặc vị trí từ caller bị strict schema từ chối. Chỉ Character của session đúng starter_village/area_01 được nhận vào room hiện tại; chưa mở map/area/content mới.

State network giữ version và players {id,x,y,direction,lastSequence}. AccountID, username/password/hash/email/session/token chỉ ở service/server connection, không broadcast. Metadata public chỉ Map/Area ID. Không thêm visibility channel, room khác hoặc opacity messages.

Consent leave loại entity ngay. Mất kết nối bất ngờ giữ entity trong30s để authenticated reconnect theo D01; hết hạn loại entity. Room rỗng chỉ giữ khi có pending grace; sau grace framework auto-dispose, simulation/listener/state/resources được dọn. Logout/reset/replacement xóa pending theo session hiện tại. Khi cần vào lại room mới, dùng cùng Character lưu DB, không tạo Character mới.

DB/WebSocket suite room-lifecycle.smoke.ts kiểm đúng room ID, public state whitelist, forged/extra/version/wrong-area, movement/reconnect/leave/dispose/recreate. Browser auth-room.spec.ts kiểm hai account đăng nhập thật, stable IDs/movement observer/logout/reload/unique Character. Fixture accounts nằm DB test local và được cleanup theo UUID/receipt; không tạo account mẫu production.

Phạm vi hiện tại local một process; TLS/multi-process/load và nội dung map khác còn D14/D05, không claim đã nghiệm thu phát hành. Collision/Occlusion/art giữ nguyên.
