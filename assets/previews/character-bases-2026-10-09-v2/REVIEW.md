# Master Male/Female v2 — CHỜ DUYỆT MỸ THUẬT

Chủ sản phẩm yêu cầu sửa bản09/10, chưa duyệt production. Revision này giữ art/contract/geometry, không thay GAME_SPEC hoặc nghiệm thu A02.

Male: tóc ngắn nhọn, mắt hẹp/lông mày thẳng, mặt góc cạnh và vai vuông. Female: tóc dài đến eo tạo contour khác rõ, mắt lớn/mặt mềm, vai trang phục gọn hơn. Đây là đề xuất nhận diện cho hai identity cụ thể, không phải quy tắc ngoại hình áp dụng mọi nhân vật.

## Các ảnh cần duyệt

- frames/male.png và frames/female.png:1 frame South/base128×128 RGBA, cùng origin(64,113), baseline113, silhouette cao99px.
- master-pair-preview.png: phóng2× để kiểm hình; không phải gameplay scale.
- starter-village-preview.png/starter-village-detail.png: ghép offline trên terrain/props Tiled hiện hữu, hai mẫu scale0.9/cao khoảng89world px. Respawn/geometry/SAFE/runtime không thay.
- gameplay-alpha-review.png: mỗi mẫu ở kích thước gameplay trên nền sáng/tối.
- silhouette-review.png: kiểm contour đơn sắc không dựa vào màu outfit.

Origin chung không phải cam kết center chân pixel-perfect: stance đo Male(64.0488,113)/Female(64.2495,113), lệch ngang0.2006px; cùng baseline. Chưa có các hướng khác hoặc motion nên không claim foot-sliding/animation alignment đã kiểm.

## Alpha và validator

Backend edit thật Codex Client image_gen/host_image; prompt nguyên văn và raw được giữ. Raw vẫn chứa pixel viền màu và không dùng trực tiếp. Forge alpha_hygiene both/floor4 loại haze/island, despill edge-only red/yellow/magenta radius3 trên raw; native_alpha strict-QC đóng frame. Lượt resize tái sinh viền màu: đo ban đầu Male30/Female12 warm-rim pixels. Thêm Forge despill radius1 trên frame cuối, alpha/geometry không đổi; không sửa published Forge bundle hoặc raw, kết quả lưu frames/ và finalize-report.json.

validate_preview.py PASS: file đọc được/RGBA128×128, alpha0–255, không opaque border, RGB dưới alpha0 bằng0,0 pixel warm-rim theo detector, mỗi hình chỉ1 connected visible component, cùng height99/baseline113, Forge strict-QC PASS. Các ngưỡng detector chỉ là kiểm ảnh, không phải luật gameplay;0 theo detector không chứng minh mọi lỗi màu bằng mắt đã hết. Đã xem pair/map/nền sáng-tối/silhouette và không còn viền đỏ/cam rõ ở kích thước gameplay.

Khác biệt đo:471 silhouette pixels; IoU0.8441, Female có thêm348 dark pixels trong band tóc/vai(rows40–74). Đây chỉ là proxy hình ảnh, không phải classifier giới tính hoặc bằng chứng người chơi luôn nhận diện được. Kiểm nhận diện do Codex nhìn ảnh: tóc ngắn/nhọn và mặt góc cạnh khác tóc dài/mặt mềm ngay trong bản gameplay; nghiệm thu cuối vẫn PENDING_USER_APPROVAL.

## Chuẩn bị layer

layer-plan.json định nghĩa cùng canvas/root cho BODY/HAIR/CLOTHING/WEAPON/EFFECT/SHADOW. Female long hair cần phần trước/sau để không gắn cứng vào quần áo; cổ/cổ tay/eo/cổ chân rõ đường seam, bàn tay không cầm gì. Không sinh weapon/shadow/effect. Body anatomy bị clothing che phải được vẽ bổ sung sau khi duyệt; composite hiện tại chưa phải các layer tách sẵn. Weapon Class requirement giữ nguyên.

## Dừng

Không96frame/animation/video, không production integration/đăng ký/migration/DB, không sửa CHỐT, push/deploy. Chờ chủ sản phẩm duyệt hoặc yêu cầu sửa master v2. Bản cũ giữ nguyên.
