# Pipeline DOWN / IDLE frame0 — BLOCKED

Ngày09/10/2026. Người dùng từ chối layer proof trước, chỉ master v2 Male/Female là chuẩn. Pipeline này sửa gate nghiệm thu; không thay mỹ thuật/rule hoặc tự sản xuất asset thay thế.

## Chuẩn đầu vào duy nhất

- Master Male: assets/previews/character-bases-2026-10-09-v2/frames/male.png; SHA2561f48274e05c3709481f1c8052fc5d90d81a8633f528e729cdb0c85f5308b3e84.
- Master Female: assets/previews/character-bases-2026-10-09-v2/frames/female.png; SHA2565eeb1f3fcb3c49d848c1b7dd3163eb34ac14dcf241d4a5a153319ed2267d757e.
- Mọi layer: RGBA128×128, origin(64,113), directionDOWN, animationIDLE, frame0. DOWN tương ứngS trong contract hiện tại; không đổi gameplay N/E/S/W.
- Body: hoàn chỉnh đúng face/tỷ lệ/màu da/pose; vẽ nội dung bị áo/quần/giày che, không có clothing/hair bake. Không mannequin, không crop composite để giả nội dung.
- HairBack/Front: không da/tai/mặt, đặc biệt Female; cùng registration với Body. Shirt/Pants/Shoes chỉ chứa garment tương ứng, không trùng ownership shin wrap. Weapon trống.
- Ba class dùng chung body/layer contract; không phân body theo class hoặc đổi Weapon requirement.

## Blocker thực tế

Đã thử một lượt BodyMale riêng với chính master v2 làm reference. Backend Codex Client image_gen trảHTTP400,moderation_blocked tại output/categorysexual,requesta35b1adf-7af7-4b87-bfe3-948e7acafa17; không tạo artifact. Prompt/bằng chứng được lưu body-prompt.txt/backend-blocker.json. Dừng, không gọi backend khác để lách kiểm duyệt, không tạo mannequin mới. FemaleBody chưa thử vì blocker chung. Không thể báo đạt mục Body/fidelity khi không có output hợp lệ.

## Gate đã sửa

pipeline.py khóa hash master, kiểm cả contract metadata lẫn mode/dimension PNG thật/alpha/hiddenRGB, từ chối mannequin/nguồn crop/copy/duplicate. Semantic review cần chủ sản phẩm duyệt Body completeness/identity, hair ownership và registration; unique hashes hoặc origin chung không tự chứng minh nội dung độc lập. Các trường USER_APPROVED trong manifest là bản ghi quyết định thật của người dùng, tuyệt đối không được tự điền để mở gate. Chưa có quyết định nên intake-template.json giữPENDING_USER. Thao tác crop mask không thể khôi phục anatomy bị che; pipeline không làm auto-fit từng layer hoặc đổi ratio để ép khớp.

Gate render đúng pixel128×128, không thêm transforms. Xuất composite, absolute RGBA diff, diff mask và visual panel. Đo số pixel khác/silhouetteIoU chỉ để chẩn đoán; không invent threshold rồi tự báo mỹ thuậtPASS. Cần phê duyệt visual diff thật; dù preview tĩnh được duyệt, productionReady vẫnfalse trong bước này. Output đã có bị từ chối để giữ bằng chứng.

## Visual diff hiện có — CHỈ BỘ ĐÃ BỊ TỪ CHỐI

rejected-diff/male và female chứa visual-diff.png (Master / REJECTED composite / absolute diff), composite.png,diff-mask.png,absolute-diff.png; toggle-shirt/pants/shoes.png và without-shirt/pants/shoes.png. Các ảnh này kiểm chứng lỗi cũ, KHÔNG phải layer mới hoặc candidate được duyệt. Male3335pixels khác/IoU0.8339; Female3675/0.8812. Face/mannequin/pose/skin và garment alignment sai thấy rõ. Audit overallBLOCKED,exit1,33issues; không báoPASS dù fileRGBA đúng.

## Kiểm thử và lệnh

verify_pipeline.py:8/8PASS,0fail/error; gate-test-report.json/gate-tests.log và output trong gate-tests/ giữ bằng chứng. Kiểm từ chốilegacy/missing/contract sai/composite copy/mannequin/đổi masterhash; kiểm xuất diff và tắt từng áo/quần/giày riêng; bảo toànoutput đã có. PASS ở đây chỉ nói codegate hoạt động, không nói asset được nghiệm thu. Runtime consistency và git diff --check PASS; không gameplay/DB/fullE2E vì không sửa runtime.

```powershell
$env:PYTHONUTF8='1'
python assets/previews/character-layer-pipeline-2026-10-09/verify_pipeline.py
# Điền path tới layer thật trong bản copy intake-template, giữ PENDING_USER cho phần chưa duyệt.
# Dùng output-dir mới mỗi lượt, không sửa bằng chứng đã xuất.
python assets/previews/character-layer-pipeline-2026-10-09/pipeline.py --manifest <candidate-manifest.json> --output-dir assets/previews/character-layer-pipeline-2026-10-09/<new-review-folder>
```

Exit1/overallBLOCKED là kết quả đúng khi thiếu asset/approval hoặc diff chưa đạt, không bypass. Không gọi auto-dev/codex exec, push/deploy/reset/production.

## Phương án thay thế đề xuất

Nhờ artist làm sourcePSD/KRA/Aseprite layered từ duy nhất master v2: giữ face/hands/skin được duyệt, vẽ Body hoàn chỉnh ở vùng bị che trên layer riêng; dựng lại phần HairBack/garment bị overlap. Đây phải là repaint có nội dung độc lập, không chỉ auto-segmentation/cắt master. Xuất7layer128×128/base tại vị trí gốc, không auto-fit; cung cấp file nguồn layered và ghi rõ vùng đã repaint. Chạy gate, xem tắt từng garment, overlay/diff trên nền sáng/tối và gameplay scale, rồi người dùng duyệt. Chỉ khi có Body/layer phù hợp mới tiếp tục; không tạo96frame để bù vấn đề master.
