# Male/Female shared base — CHỐT kiến trúc, chờ duyệt master

Previewmới09/10: briefBodyFemale kín đáo (áodàitay/quầndài nền trungtính) tạo thànhcông bằnghostimage; bundle `character-layer-first-v3-female-clothed/REVIEW.md`. HairBack/Front độc lập, garmentouterriêng, kỹthuật7PNG/alpha/baseline/toggle/browserPASS. **Femalechưaduyệtmỹthuật/production**, tóc mái che mộtphần mắttrái vàvisualfit chờreviewpair. Malev3r2 giữnguyênmỹthuậtđãduyệt, hashkhôngđổi. Không tựnângA02/96frame hoặc đổi quy tắcCHỐT; rejectionởdưới là lịch sử briefcũ.

Quyết định mới09/10: chủ sản phẩm CHỐT Male Layer-first v3r2 là chuẩn mỹ thuật riêngDOWN/IDLE/frame0; approval ở bundleMale/art-approval.json. Không duyệt production hoặc toàn animation. Femalev3 cần tạo và review riêng; thử Body bằnghostimage bịHTTP400outputmoderation_blocked, không cóartifact. GiữBLOCKED tạoFemale; chưaalpha/baseline/fit/pair/duyệtmỹthuật. Chi tiết bundleFemale/REVIEW.md. Những trạng thái chờMale ở dưới là lịch sử, không phủ nhận phê duyệt mới; không tựDONEA01/A02/A03.

Phản hồi mới09/10: chủ sản phẩm duyệt hướng thiết kế Malev3 nhưng chưa production; ưu tiên tỷ lệchibi, không bắt khớp pixel masterv2. Bản chỉnh r2 giảm nhẹ cơBody, giữ pixelFace/fileHair và căn garment; kết quả `assets/previews/character-layer-first-v3-male-r2/REVIEW.md`. PENDING_USER_APPROVAL cuối, không tự mở A02/96frame hoặc duyệt production. Đây là cập nhật scopepreview, không thay luậtCHỐT; các blocker/bản bị từ chối bên dưới giữ làm lịch sử.

Thử nghiệm mới09/10: người dùng cung cấp sheet reference và yêu cầu Male Layer-first v3, chỉDOWN/IDLE0. Candidate và kiểm chứng ở `assets/previews/character-layer-first-v3-male/REVIEW.md`. Đây là source ảnh mới cho thử nghiệm, không thay masterv2 đã duyệt phong cách hoặc chuẩn production. Body có da đầy đủ cho torso/chi nhưng còn under-shorts; affine registration Hair/Top/Bottom/Shoes chưa nghiệm thu, tổng BLOCKED. File/alpha/origin và preview-toggle PASS không tự duyệt anatomy/art. Không mở A02/96frame hoặc cập nhật luậtCHỐT; các lần từ chối ở dưới giữ làm lịch sử.

Phản hồi mới09/10: layer proof bị chủ sản phẩm từ chối, giữBLOCKED. Master v2 là chuẩn duy nhất; mannequin không được dùng Body production. Contract thử perlayer128×128RGBA/origin(64,113)/DOWN/IDLE/frame0; gate và visual diff diagnostic ở `assets/previews/character-layer-pipeline-2026-10-09/README.md`. Lượt BodyMale đúngmaster bị backend từ chối, chưa có sourceBody phù hợp; không autoapprove hoặc tạo96frame. Cần source layer repaint độc lập và nghiệm thu composite gầnmaster; art style đã duyệt không đồng nghĩa body/layers đạt.

09/10: chủ sản phẩm đã duyệt phong cách hình ảnh master v2 và chuyển sang layer proof. Nghiệm thu layer vẫn BLOCKED: xem `assets/previews/character-layer-proof-2026-10-09/REVIEW.md`. Backend từ chối Body nhân vật ở lượt đầu; mannequin kỹ thuật thay thế và part registration chưa khớp master. Không coi phê duyệt style là duyệt bộ layer/96frame/production. Các trạng thái chờ master ở dưới là lịch sử trước phản hồi mới này.

Master hiện tại: revision v2 tại `assets/previews/character-bases-2026-10-09-v2/REVIEW.md`, sửa theo yêu cầu chủ sản phẩm09/10 vì bản đầu chưa được duyệt. Male tóc ngắn/mặt góc cạnh, Female tóc dài/mặt mềm; frame cuối qua validator alpha/baseline và preview gameplay, vẫn PENDING_USER_APPROVAL. Các số đo/bundle ở dưới là lịch sử v1, được giữ nguyên để đối chiếu; không coi v1 hoặc v2 là production-ready.

Ngày09/10/2026, nguồn: xác nhận trực tiếp của chủ sản phẩm trong Codex Client. Giữ Weapon Class requirement; không thay luật trang bị khác.

## Phạm vi đã CHỐT

Male Base và Female Base độc lập với class. Physical DPS/Magic DPS/Tank dùng chung hệ thống base và animation state machine/metadata. Mỗi base có hình riêng N/E/S/W, IDLE4/RUN8 frame/hướng128×128, tổng16 sheet/96 frame. Painted/cartoon soft shading, chibi top-down, không pixel art; layer body/hair/clothing/weapon/effect/shadow tách biệt khi sản xuất. Không tự đặt quy tắc đổi giới tính sau tạo nhân vật. Chủ sản phẩm duyệt mỹ thuật trước production-ready.

## Preview hiện có

Bundle: `assets/previews/character-bases-2026-10-09/`. Hai raw1254×1254 được tạo thật bằng Codex Client `image_gen`, route `host_image`; không gọi CLI/API trả phí. Model và cost không được tool công bố. Spec và prompt gốc Forge ở male/female-prompt, `exact-host-prompt.txt` là nguyên văn prompt gửi backend. Raw copy nguyên vẹn, hash/reference và QA trong manifest/pipeline metadata.

Workflow: Forge doctor → master_still.py prompt → host image_gen → generate2dsprite.py process native_alpha/strict-qc → preview packaging. Chưa chạy lệnh master_still approve vì chưa được chủ sản phẩm duyệt. Chưa tạo video/animation.

Master runtime candidate: mỗi mẫu1 frame South128×128 RGBA, alpha range0–255, figure99px; cùng canvas origin(64,113), baseline113. Scale hiện hữu0.9 cho figure89.1world px, trong khoảng70–100 của spec. Measured stance anchors Male(64.0962,113), Female(64.7896,113): lệch ngang0.6934px; chưa chứng minh alignment animation hoặc foot sliding.

`starter-village-preview.png` và crop `starter-village-detail.png` là bản ghép offline từ terrain/props Tiled chính thức, giữ hình/geometry. Vị trí preview(574,624)/(674,624) chỉ bố cục duyệt hình, không đổi respawn(624,624) hoặc world/DB. Chưa tích hợp vào runtime. `master-pair-preview.png` phóng2× các candidate để so sánh; raw giữ chất lượng nguồn.

Cần chủ sản phẩm đánh giá: tỷ lệ chibi và góc nhìn top-down, độ phân biệt Male/Female (tóc/mặt khác nhưng outfit/body gần nhau), độ đọc khi thu nhỏ, sự đồng bộ shading với làng. Raw có vài điểm viền đỏ/cam quanh tóc/tay cần xem khi duyệt; không coi kiểm alpha là bảo đảm màu mép sạch. Trang phục/tóc hiện nằm trong hình master minh họa; chưa tách BODY/HAIR/CLOTHING thành asset production. Không có weapon/effect/baked shadow qua kiểm hình. Alpha/kích thước PASS không thay thế nghiệm thu identity/anatomy.

## Kiểm định và giới hạn

Forge process lần đầu feet và lần sau stance đều strict-QC PASS. Lệnh thử anchor-px với fit bị từ chối (`--anchor-px needs --scale-strategy preserve or registered.`), không publish output; dùng stance hợp lệ thay thế. Các bản thử được giữ để truy vết. Packaging xác minh file đọc được,128×128/RGBA/alpha0–255,99px/baseline113 và QA status, không sửa raw.

Doctor lần đầu FAIL encoding.stdout(cp1252); chạy lại với PYTHONUTF8=1 trong process, không sửa config local. Kết quả cuối0 FAIL/2 WARN/7 MISSING: WARN python.path (Python khác trên PATH), paths.cwd (đường dẫn có space); MISSING deps.resvg-py (codeart SVG, không cần ở đây), media.api.openai/gemini/xai/byteplus/fal và media.cli.grok (không cần cho host_image). Các chi tiết nguyên văn nằm doctor.json/doctor-utf8.json. Backend video none, không tự thay bằng hình lặp hoặc asset code-drawn. Pipeline QC có body_scale_cv/anchor_y_std SKIPPED vì master đơn không cấu hình ngưỡng; không claim kiểm animation. Mọi WARN/FAIL/SKIPPED envelope được giữ trong bundle.

## Dependency còn lại

A01/A02/A03 vẫn TODO, D12 vẫn BLOCKED phần identity/reference/catalog/animation bổ sung và nghiệm thu. Việc chọn giới tính cần shared registration contract/validation, persistence/migration tương thích account cũ và UI đăng ký/T12 sau này; code hiện chưa có trường lựa chọn. Không thay dữ liệu hoặc tự chọn giới tính cho account hiện hữu trong phiên preview. Cần quyết định cách xử lý account cũ trước migration; không tự đặt default/backfill.

DỪNG chờ chủ sản phẩm phê duyệt hoặc yêu cầu sửa master; chưa tạo96 frame, chưa mark production-ready.
