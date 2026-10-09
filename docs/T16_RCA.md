# T16 — Điều tra regression và kiểm chứng, 09/10/2026

## Hiện tượng và phân loại

HEAD trước sửa: `4e63182182650abcb9b46e40b405d49ab894134a`, checkpoint T15 có gate9/9 theo progress. Diff server/game-core/shared/geometry so với HEAD rỗng; timer gửi input trong Scene.update và Phaser.AUTO đã có ở checkpoint đó. Không chạy lại toàn bộ checkout cũ hoặc tuyên bố driver máy mới giống máy cũ.

Đã đọc trace/console và xem cả4 screenshot ở logs/t16-browser-final. Auth vẫn connected với hai Character UUID; không có lỗi credential/network được xác định là nguyên nhân. Các lỗi cụ thể:

- Auth-room: observer x632, chưa vượt648; các lượt cũ640/624.
- Aggregate occlusion: waypoint x400 chưa tới624; có lượt alpha1 thay0.4. Screenshot vẫn cho thấy nhà mờ khi một actor thực sự đứng sau nhà; không phải mọi lỗi assertion fade đều là lỗi geometry/manager.
- Front-side: depth328.1 thay vì>400; actor đã đi quá điểm dừng trước nhà. Không sửa sortingAnchor/footprint để hợp thức hóa vị trí test sai.
- Starter collision approach: waypoint không tiếp cận footprint cần kiểm; screenshot actor nằm phía bên/trên nhà. Không có bằng chứng nhân vật xuyên footprint.

## Nguyên nhân và thử nghiệm phân biệt

Input/keyup trước sửa chỉ được gửi từ Scene.update, cadence50ms theo world config; server giữ intent tới timeout250ms. Vì vậy render chậm làm heartbeat và stop trễ: có thể đứng lại do intent hết hạn, hoặc tiếp tục đi sau release. Đây là coupling transport với render, không phải server cho client quyết định vị trí. Lỗi vốn tiềm ẩn trong checkpoint cũ, không kết luận toàn bộ thay đổi T16 đã phá server/collision.

Trace ghi cảnh báo WebGL `GPU stall due to ReadPixels`, với313/588/1044/1007 frame screencast ở bốn artifact tương ứng. Probe keyboard nhẹ ghi focus=true, visible, vector/sequence hợp lệ và movement thật. Chưa xác định driver/hardware nào gây stall; không khẳng định phần đó đã được sửa.

Thử SwiftShader vẫn2/5 PASS (logs/t16-software-gl.log), nên đổi backend đồ họa không đủ. Cùng code/assertion khi tắt screencast liên tục đạt5/5 riêng (logs/t16-no-screencast.log), nhưng gate đầy đủ đầu vẫn9/10, front-side còn lệch điểm dừng (logs/t16-fix-e2e.log). Vì vậy trace overhead là yếu tố góp phần, không tự coi thay trace đã giải quyết toàn bộ.

Sửa thứ2: keyboard intent và heartbeat nằm trong lifecycle scene, dùng native key events và timer world.tickMs riêng khỏi render; keyup/blur/focus panel/visibility gửi stop ngay, held state được clear. Cleanup hủy timer và mọi listener trên shutdown/destroy; callback sau unmount bị chặn. React chỉ giữ status/count, không có movement state. Không gửi position hoặc đổi tốc độ/tick/timeout/collision/server sequencing. Server tiếp tục validate strict intent/sequence và quyết định outcome.

Playwright giữ trace DOM/network/console/sources và screenshot khi thất bại, tắt riêng screencast liên tục; không tắt tracing hoàn toàn hoặc nới assertion/timeout. SwiftShader/probe/diagnostic test tạm đã bỏ; logs giữ bằng chứng. Unit kiểm release/focus loss/diagonal/opposing keys mà không cần renderer update; E2E lifecycle kiểm reconnect3 lần/SPA/entity/canvas/HUD/panel. Các4 test lỗi cũ không bị sửa.

## Gate và giới hạn

Lint/typecheck/build PASS;37 unit/integration +31 mock PASS (logs/t16-fix2-*). Browser đầy đủ10/10 PASS,1.9 phút (t16-fix2-e2e.log); chạy lại nhóm auth-room/occlusion/starter5/5 PASS,1.5 phút (t16-fix2-stability.log). DB7 suites trên mmorpg_test, runtime consistency và docs/machine registry được kiểm lại trước checkpoint; xem progress cho kết quả cuối.

Không sửa GAME_SPEC, backend, geometry, opacity0.4/tween180ms hoặc auth/reconnect policy; không reset DB, push/deploy, auto-dev/codex exec. Không claim đã kiểm mọi GPU/thiết bị/latency production. T17 vẫn phụ thuộc D05/A03; dừng sau T16.
