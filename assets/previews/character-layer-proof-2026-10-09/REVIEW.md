# Kiểm chứng layer — BLOCKED, chưa nghiệm thu

Chủ sản phẩm duyệt phong cách master v2, chưa duyệt layer/production. Không thay CHỐT hoặc tạo animation. Các file tại đây là thử nghiệm có lỗi được công khai; không dùng làm bộ production.

## Nguồn và nội dung độc lập

Forge make_anchor_layout tạo guide từ master đã duyệt để backend giữ vị trí. Guide là bản lặp reference, KHÔNG được dùng làm layer. Codex Client image_gen tạo atlas mới gồm6 part riêng. Không lấy/crop Body/clothing từ composite master v2. Có crop ownership rectangle từ atlas các part được vẽ riêng, công khai sourceBox/transforms trong report.json. Mỗi part có nội dung khác nhau; Body thật sự có thân/tay/waist/legs/feet được vẽ bổ sung, không xóa clothing để để lỗ. Tuy nhiên Body là mannequin xám và không đủ điều kiện nghiệm thu Body nhân vật.

Lượt Body nhân vật đầu tiên bị backend HTTP400/moderation_blocked tại output, category sexual; request8c881ffa-0115-4ac2-a65e-c0ef21f2f4d0. Không có artifact cho lượt đó. Đã thử phương án an toàn khác: búp bê gỗ xám faceless/inanimate chỉ để engineering. Không giả rằng đây là Body đúng master; xem rejected-attempt.json và prompt. Không gọi codex exec/API trả phí/cài dependency.

## File và phép thử

male/ và female/ có body,hair_back,hair_front,shirt,pants,shoes,weapon PNG RGBA128×128; metadata origin(64,113), baseline template113. Weapon là ảnh transparent trống đúng yêu cầu. Các rectangle registration chỉ là approximation sau khi backend không giữ vị trí guide; không tuyên bố geometry body pixel-perfect. Compositor order HairBack→Body→Pants→Shoes→Shirt→HairFront→Weapon.

Body dưới clothing được đo từ các pixel alpha phủ nhau trong file-validation.json. File uniqueness/không bằng master chỉ là kiểm cơ bản; nhìn atlas/layer gallery cho thấy part được vẽ riêng nhưng còn lỗi nội dung. Không dùng hash khác nhau để kết luận semantic layer independence PASS.

build_proof.py chạy18/18 kiểm data renderer: tắt từng layer làm render đổi (Weapon trống không đổi), đổi clothing giữ nguyên Body hash, ba class dùng cùng static layer set. Browser Chromium thật36/36 kiểm toggle/restore/swap/3-class static render,0pageerror, screenshot/report giữ. Các test này chỉ PASS về controls/data flow của preview offline; KHÔNG PASS nghiệm thu toàn bộ layer hoặc animation.

file-validation.json xác nhận14file PNG128×128 RGBA/có transparency,12nonweapon khác nhau và không bằng master. Không claim body/clothing sạch semantic hoặc art fidelity nhờ các check đó. Doctor còn0FAIL/2WARN/7MISSING được giữ trong doctor.json; không cần các route thiếu cho host_image. Runtime consistency --check và git diff --check PASS; không chạy gameplay lint/build/DB/E2E vì runtime không sửa. Browser riêng này không phải full game E2E.

## So sánh master: FAIL

Male composite khác3335pixels, silhouetteIoU0.8339; Female khác3675pixels,IoU0.8812. Không tự đặt threshold nghiệm thu mỹ thuật. Lỗi nhìn thấy: mất khuôn mặt, mannequin khác tỷ lệ/anatomy/skin, garment lệch neck/wrist/waist; Female HairFront dính tai/da, quần và giày trùng shin wrap. Phần đầu/back hair còn che sai vùng mặt. Các lớp không phải duplicate, nhưng chưa đạt fidelity hoặc clean ownership. Do đó overall BLOCKED, không được sản xuất96frame từ bộ này.

## Cách xem

preview.html cho phép chọn Male/Female, class, toggle từng layer và đổi clothing của base còn lại. Có thể mở file HTML trực tiếp; chỉ nạp PNG cùng project, không gọi API/server/game/DB. comparison.png đặt Master v2 / Composite / Clothing OFF cạnh nhau; layer-gallery.png hiển thị từng part; clothing-swapped.png và browser-proof.png giữ test thực tế.

Mỗi giới tính vẫn giữ contract N/E/S/W,IDLE4/RUN8,128×128 và common root; ba class dùng chung hệ thống. Chỉ có South static proof, không chứng minh animation hoặc fit clothing cross-gender. Swap cross-gender là kiểm renderer, không phải quy tắc trang bị mới. Weapon Class requirement giữ nguyên.

## Bước cần giải quyết trước duyệt layer

Cần nguồn Body hoàn chỉnh đúng identity/pose/chibi của master v2, cùng các part redraw khớp registration. Có thể nhận Body/layer do artist vẽ với anatomy stylized phù hợp, hoặc thực hiện thêm lượt thiết kế an toàn được chủ sản phẩm chấp nhận; không coi mannequin kỹ thuật này là thay thế ngầm. Sau đó sửa HairFront ownership/shin wrap và kiểm lại composite/điểm gắn. DỪNG tại kết quả BLOCKED để chủ sản phẩm xem/định hướng; chưa approval hoặc production integration.
