# Male Layer-first v3 r2 — chờ duyệt cuối

Người dùng duyệt hướng thiết kế v3, chưa duyệt production. Revision này chỉ Male DOWN/IDLE/frame0, painted/cartoon soft shading; không yêu cầu khớp pixel master v2. Giữ nguyên bundle v3 trước để đối chiếu.

## Chỉnh sửa

Codex Client native `image_gen` edit Body thật: giảm nhẹ độ nổi và shading cơ vai/ngực/tay. Raw và prompt được giữ. Đăng ký Body bằng transform cũ, không thay scale/origin; compositor giữ vùng đầu/mặt cũ ở rows0–48 và vùng dưới từ88 trở đi. Mọi pixel mặt giữ nguyên; Hair.png giữ nguyên byte/hash. Đây là bảo toàn phần của Body độc lập đã tạo, không crop reference hoặc composite để giả layer.

Top được căn về target rect(40,48,48,42), Bottom(47,71,34,32), Shoes(45,95,39,18), theo mốc cổ/vai, eo, cổ chân và soles của Body. Bottom vốn khớp eo/chân nên giữ transform. Hair và Weapon không đổi. Body vẫn có under-shorts trung tính như v3; không claim body nude đầy đủ. Registration là căn chỉnh thủ công có ghi tọa độ, cần người dùng duyệt visual fit cuối; không tự nghiệm thu production.

## Preview

- `composite.png`: Full.
- `body-only.png`: Body Only.
- `no-hair.png`, `no-top.png`, `no-bottom.png`, `no-shoes.png`: tắt riêng từng layer.
- `toggle-preview.png`: sáu trạng thái cạnh nhau; phóng2× nearest để xem pixel, không chuyển phong cách asset sang pixel art.
- `layer-preview.png`: sáu layer riêng.
- `preview.html`: compositor offline128×128 với checkbox; `browser-preview.png` là ảnh browser.
- `visual-diff-full.png`, `visual-diff-body.png`: v3 trước / r2 / absolute RGBA diff. Composite khác2036pixels, Body khác1495pixels. Không dùng số này làm threshold mỹ thuật; giảm cơ là đánh giá trực quan ở raw/Body Only, không tự suy từ diff.

## Kiểm định thực tế

`python assets/previews/character-layer-first-v3-male-r2/validate.py`: PASS6PNG128×128RGBA, alpha thật0–255 cho năm lớp có hình, Weapon toàn0 có chủ ý; hiddenRGB0; contract DOWN/IDLE0/origin(64,113). Origin là metadata chung, không phải thuộc tính PNG tự lưu. Body/Shoes baseline113. Năm lớp không rỗng khác hash; mặt bytepixel giữ nguyên, tóc file giữ nguyên. Bốn toggle/restore đúng và Body có pixel dưới clothing. Overlap không tự chứng minh giải phẫu/fit mỹ thuật.

`node assets/previews/character-layer-first-v3-male-r2/verify-browser.mjs`: PASS9checks (4cặp OFF/RESTORE + canvas128),0pageerror/0HTTPerror, tất cả preview images decode được. Đây là preview offline, không phải gameplay E2E hoặc animation check.

`node scripts/build-starter-runtime.mjs --check` và `git diff --check`: PASS. Không thay runtime; không chạy lại lint/typecheck/build/DB/E2E game và không claim chúng đã PASS trong phiên này.

`manifest.json`, `report.json`, `validation.json`, `browser-report.json`, `provenance.json` lưu contract/source/hash/transforms/kết quả. Backend là host_image/native image_gen, model ID không được công bố nên null. Các lượt nguồn v3 có provenance riêng được tham chiếu; không giả generation mới cho Hair/clothing giữ lại.

## Trạng thái

PENDING_USER_APPROVAL; productionReady=false. Chỉ hướng v3 đã duyệt, bản r2 và garment fit chờ duyệt cuối. Chưa có bằng chứng animation alignment/foot sliding vì chỉ một frame. Không tạo96frame, không gọi approve, không tích hợp game, không đổi luậtCHỐT hoặc registration/migration. A01/A02/A03 chưaDONE. Dừng chờ người dùng duyệt.
