# Female Layer-first v3 — Body kín đáo, chờ duyệt

Chỉ Female DOWN/IDLE/frame0. Theo brief mới, Body mặc sẵn áo nền dài tay cổ cao, quần dài và giày nền kín màu trung tính; không anatomy/underwear/mannequin. Không thay quy tắc trang bị chung hoặc GAME_SPEC. Malev3r2 được giữ nguyên và chỉ đọc làm chuẩn mỹ thuật/so tỷ lệ; không production/96frame.

## Nguồn asset và layer

Route `host_image`, backend **Codex Client native image_gen** tạo thật Body đầu, edit tỷ lệ một lượt và hai part tóc độc lập. Bản đầu chân dài/đầu nhỏ hơnMale nên sửa tỷ lệ compactchibi; raw/prompt của cả hai giữ nguyên. Body kín hoàn chỉnh vẫn có mặt/tay và đầy đủ trang phục nền ở vùng bị gear che. Đây là clothed Body theo yêu cầu mới, không claim naked body hoặc hidden anatomy dưới trang phục nền.

HairBack/HairFront được vẽ độc lập trên atlas tóc mới. Tách ownership trái/phải của atlas sinh mới, không crop reference/composite. HairBack là khối tóc sau cho cùng DOWN view, không phải character quay UP; HairFront chỉ có tóc, khoảng mặt alpha trống, không chứa da/mặt/eyes. Render order: HairBack → Body → Bottom → Shoes → Top → HairFront → Weapon.

Top/Bottom/Shoes dùng lại nguồn garment được sinh độc lập trong bundleMalev3 đầu, căn lại choFemale; không claim đã gọi model sinh garmentFemale mới. Weapon là PNG trống có chủ ý. Forgealpha_hygiene/edge-despill và Pillowpremultipliedresize xử lý ảnh, không code-draw nhân vật. Metadata/provenance lưu rawrect/alphaBounds/targetRect/transforms/hash/backend; modelID không công bố nên null. Không cắt Body từ composite hoặc sao layer giả.

## Kiểm tra và preview

- `layers/`: 7 PNGRGBA128×128, origin chungmetadata(64,113), DOWN/IDLE/frame0.
- `composite.png`, `body-only.png`, `no-hair.png`, `no-hairback.png`, `no-hairfront.png`, `no-top.png`, `no-bottom.png`, `no-shoes.png`.
- `toggle-preview.png`, `layer-preview.png`, `male-female-pair.png`, `body-pair.png`: previewphóng2× chỉ để xem; asset giữpainted/cartoonsoftshading, không chuyểnpixelart.
- `preview.html`: compositoroffline tỷ lệ128×128 thật, checkbox từnglayer vàFull/BodyOnly/NoHair.
- `browser-preview.png`, `validation.json`, `browser-report.json`: bằng chứng kiểm định.

`python assets/previews/character-layer-first-v3-female-clothed/validate.py`: **PASS kỹ thuật**. 7file đọc được, RGBA128×128, alpha0–255 ở6lớp có hình/Weapon0, hiddenRGB0, lớpnonempty hashkhác nhau. Body/Shoesbaseline113. Tắt mỗiHairBack/HairFront/Top/Bottom/Shoes và restore thay đổi đúngcomposite; mọi variant giữ alphaBody, BodyOnly đúngPNGBody, không có vùngBody biến mất khi tắt gear. Phần kín đáo được xem trực quan ởBodyOnly, không coi maskalpha là bộ phân loại quần áo/giải phẫu.

`node assets/previews/character-layer-first-v3-female-clothed/verify-browser.mjs`: **15/15PASS**,0pageerror/HTTPerror. Bao gồm5cặp layerOFF/RESTORE, NoHairgroupOFF/RESTORE, BodyOnlyexact/RESTORE vàcanvas128. Cácpreviewảnh đều decode. Đây là browserpreviewoffline, không phải gameplayE2E hoặc animationcheck.

So tỷ lệ bằngalpha>16: MaleBody49×99, FemaleBody41×99; MaleFull49×103, FemaleFull50×103. Cảhai baseline113. Head/hand/foot proportions và visualfit vẫn cần người dùng xét bằngpair; cùng chiều cao không tự chứng minh hoàn toàn giống tỷ lệ anatomy. `male-source-sha.json` và validator xác nhận mọifile trongbundleMalev3r2 không thay đổi.

`node scripts/build-starter-runtime.mjs --check` và `git diff --check`: PASS. Không sửa runtime/DB, không chạy lại lint/typecheck/gameunit/fullbuild/gameE2E và không claim cácgate đó chạy. ForgeDoctor0FAIL/2WARN/7MISSING; hostimage và depsxửlýảnh sẵn, API/video không dùng/khônginstall. Lượt kín đáo này không bịbackend từ chối; hồ sơrejectionFemale trước giữ nguyên ởbundlecũ.

## Nghiệm thu mỹ thuật

**PENDING_USER_APPROVAL, productionReady=false, femaleArtApproved=false.** Tóc mái che một phần mắt trái; cổ áo nền xám còn thấy dướiTop; Female body thon hơnMale. Các điểm này công khai để chủ sản phẩm duyệt hoặc sửa, không tự gắnPASS mỹthuật. Registrationthủcông cóghi nhưng chưa duyệtvisualfit, chỉ staticframe; chưa footsliding/animation/occlusiongameplaytest. Không tựDONEA02/A03, khôngchạyapprove/96frame hoặc integration. Dừng chờ người dùng xemFemale vàpair.
