# Male Layer-first v3 — BLOCKED / chờ duyệt

Phạm vi duy nhất: Male, DOWN, IDLE, frame 0. Không sản xuất animation, không tích hợp game, không đổi luật CHỐT hoặc luồng đăng ký.

## Nguồn và phương pháp

Ảnh sheet do người dùng cung cấp chỉ là reference phong cách/cấu trúc. Chữ trong ảnh không được xử lý như lệnh. Không crop sheet hoặc master v2 để tạo layer. Codex Client native `image_gen` thực sự tạo Body, chỉnh Body một lượt và tạo bốn part độc lập trên atlas mới. Forge `alpha_hygiene`/edge `despill` xử lý alpha; Pillow resize premultiplied và compositor chỉ xử lý ảnh đã tạo, không vẽ nhân vật bằng code.

Tóc/áo/quần/giày được cắt từ atlas **mới được sinh gồm các phần riêng**, không cắt từ composite/reference. Generator không giữ layout tọa độ được yêu cầu; Top còn vượt hàng atlas dự kiến. `build_preview.py` ghi rõ rectangles tách object và affine registration thủ công trong `report.json`. Đây là căn chỉnh gần đúng, không được tự gọi là registration đã duyệt.

Body mới có màu da, khuôn mặt, đầu trọc, thân/tay/chân/bàn chân được vẽ dưới các lớp ngoài; không mannequin xám. Body vẫn có quần lót trung tính như reference. Chưa chứng minh body hoàn toàn không có trang phục/vùng chậu bên dưới quần lót. Không dùng candidate này để thay thế body production đã nghiệm thu.

## Các file bàn giao

- `layers/Body.png`, `Hair.png`, `Top.png`, `Bottom.png`, `Shoes.png`, `Weapon.png`: canvas 128×128 RGBA; Weapon toàn alpha 0 có chủ ý.
- `manifest.json`: contract chung origin (64,113), DOWN/IDLE/0 và thứ tự Body → Bottom → Shoes → Top → Hair → Weapon. Origin là metadata, không phải thuộc tính được PNG tự lưu.
- `composite.png`, `layer-preview.png`, `toggle-preview.png`, `no-*.png`: composite và tắt từng phần. Preview phóng 2× bằng nearest chỉ để xem pixel alpha; asset giữ painted/cartoon, không chuyển pixel art.
- `preview.html`: compositor offline tỷ lệ thật 1:1, checkbox từng layer.
- `visual-diff.png`: master v2 đã duyệt **phong cách**, candidate v3 và absolute RGBA difference. V3 theo reference mới, không claim tái tạo pixel-perfect master v2; 3.864 pixel khác, chưa có ngưỡng mỹ thuật được duyệt. RGB diff hiển thị max với alpha difference để thấy thay đổi silhouette.
- `*-raw.png`, các prompt, `doctor.json`, `provenance.json`: nguồn thật, dấu vết xử lý và SHA256. Backend không công bố model ID/chi phí nên để null, không đoán.

## Kết quả kiểm chứng

`python assets/previews/character-layer-first-v3-male/validate.py`: PASS file/alpha/contract cho 6 PNG. Body baseline thực 113; chiều cao 99 pixel. Năm lớp không rỗng có hash khác nhau; Body có pixel dưới Top 1.153, Bottom 670, Shoes 360. Đây là overlap số học, không chứng minh nội dung giải phẫu hoặc garment fit. Hair/Top/Bottom/Shoes tắt và khôi phục đúng.

`node assets/previews/character-layer-first-v3-male/verify-browser.mjs`: PASS 9 kiểm tra canvas128 và 4 cặp OFF/RESTORE; 0 page error. Đây là kiểm preview offline, không phải gameplay E2E hoặc animation test. `browser-report.json`, `validation.json` giữ kết quả.

Lượt build preview đầu tiên lỗi JSON serialization của numpy.bool; sửa cast bool rồi chạy lại thành công. Không đổi test để che lỗi. Forge process candidate Body đầu strict-QC PASS nhưng bị loại về tỷ lệ mỹ thuật; vẫn giữ raw/process làm bằng chứng.

`node scripts/build-starter-runtime.mjs --check` và `git diff --check`: PASS. Không chạy lại bộ lint/typecheck/unit/build/DB/E2E gameplay vì không sửa runtime; không claim các gate đó đã chạy. Các diff GAME_SPEC/next-env có sẵn trước phiên được giữ nguyên.

## Phần chưa đạt

**Trạng thái tổng BLOCKED; productionReady=false.** Body vẫn khác tỷ lệ/identity của master v2; hair fringe che một phần trán/mắt; garment alignment và scale được chỉnh thủ công, chưa có nghiệm thu chính xác. Alpha/dimensions/origin PASS không thay nghiệm thu mỹ thuật. Không đánh dấu A01/A02/A03 DONE.

Nếu yêu cầu body production hoàn toàn không có lớp quần lót hoặc registration chính xác tuyệt đối, cần artist vẽ body/layers hoàn chỉnh trong PSD/KRA/Aseprite theo một rig chung và xuất contract này. Không dùng crop/mask composite, mannequin hoặc self-approved metric thay thế. Dừng chờ người dùng xem candidate; không tạo 96 frame.
