# Starter Village — dữ liệu và kiểm chứng

Map chính thức `starter_village`, Area `area_01`, Respawn `starter_respawn_01`, SAFE/PK OFF. Không dùng geometry hoặc spawn fixture Phase 1. Phong cách painted/cartoon soft shading theo GAME_SPEC 2.2–2.4; xác nhận mới của người dùng gỡ xung đột pixel art, không sửa CHỐT.

Nguồn ảnh thật: `image_gen` của Codex Client, route `host_image` theo Host notes của Agent Sprite Forge. Không gọi Codex CLI, paid API hoặc code-drawn art. Model và chi phí không được host tool công bố; không suy đoán. Ba lệnh sinh/edit ảnh và prompt nguyên văn được lưu ở `assets/maps/starter_village/prompts.json`; originals và SHA256 ở `raw/` và `generation.json`. Nhà/cây dùng native alpha, extraction 2 accepted, 0 placeholder/rejected. Giữ bản prop đầu và các report lỗi để truy vết.

World thực 1254×1254 px; unit 32px. Tiled grid bao 40×40 cell, extent gameplay đọc `worldWidth/worldHeight`, không lấy 1280 thay cho 1254. Terrain image-layer; props image collection; collision object-layer. Registry SAFE và tham số runtime ở `registry.json`. Tiled embedded và registry được chuyển thành TS dùng chung, ảnh được copy nguyên bytes cho web; `node scripts/build-starter-runtime.mjs --check` kiểm tra đồng nhất. Script mặc định từ chối ghi đè output có sẵn.

Respawn tại (624,624), tâm ô đi lại của quảng trường; kiểm bounds và footprint AABB (10,6), đi được bốn hướng. Ba nhà chặn toàn vùng ảnh, ba cây chỉ chặn rect thân/rễ. Y-sort dùng chân prop/actor; cây có vùng tán riêng ở client để alpha 0.5 khi che local actor, về 1 khi rời vùng. Collision vẫn do server áp dụng. Runtime kế thừa nguyên tham số movement/camera hiện có dưới dạng config riêng, không nhập fixture map hoặc đặt công thức balance mới. Làng không có water, NPC, portal hoặc combat; không coi đây là nghiệm thu các hệ thống đó.

Forge nav dùng circle radius 12 bảo thủ bao AABB chân (10,6), cell 6; không dùng circle này thay collision runtime. Hai đích kiểm định: (624,96), (96,624). `bundle-report-v4.json`: PASS/0 warnings; `nav-verified/nav-report.json`: 2 targets, 0 unreachable, 0 thin gaps; `preview-verified/preview-qa.json`: verify PASS và mọi route `ok:true`. Forge preview chỉ là debug actor; bằng chứng actor thật/scale/Phaser/camera/fade nằm ở E2E và screenshot game đã xem.

Browser kiểm thử: Chromium desktop và viewport 640×700, không tuyên bố mobile performance, touch hoặc mọi trình duyệt. Actor đang dùng một frame South 128×128 đã kiểm định, giao diện ghi rõ chưa phải A02 animation hoàn chỉnh. A03/T17 đầy đủ vẫn chưa DONE.

Chạy local sau `pnpm build`:

```powershell
pnpm --filter @mmorpg/server exec node dist/index.js --starter-preview
# Terminal khác:
pnpm --filter @mmorpg/web start --port 3137
# Mở http://127.0.0.1:3137/starter
```

Room preview chỉ loopback/local và từ chối `NODE_ENV=production`; không có chính sách guest account cho game. Authenticated room riêng tên `starter-village`, không dùng room preview làm protected gameplay.

Các report WARN/FAIL ban đầu được giữ nguyên và liệt kê bên dưới; không coi report cũ hoặc preview SKIPPED là bằng chứng hoàn tất.

## Report ban đầu và cảnh báo môi trường (nguyên văn)

`assets/maps/starter_village/bundle-report.json`:

```json
{
  "checks": [
    {
      "id": "schema",
      "status": "fail",
      "value": {
        "errors": 4,
        "warnings": 0
      },
      "threshold": {
        "errors": 0
      }
    }
  ],
  "problems": [
  {
    "severity": "error",
    "path": "$.provenance",
    "message": "'tool' is a required property",
    "code": "schema"
  },
  {
    "severity": "error",
    "path": "$.provenance",
    "message": "'version' is a required property",
    "code": "schema"
  },
  {
    "severity": "error",
    "path": "$.provenance",
    "message": "'params' is a required property",
    "code": "schema"
  },
  {
    "severity": "error",
    "path": "$.provenance",
    "message": "'inputs' is a required property",
    "code": "schema"
  }
]
}
```

`assets/maps/starter_village/bundle-report-v2.json`:

```json
{
  "checks": [
    {
      "id": "document",
      "status": "warn",
      "value": {
        "errors": 0,
        "warnings": 2
      },
      "threshold": {
        "errors": 0
      }
    }
  ],
  "problems": [
  {
    "severity": "warning",
    "path": "$",
    "message": "unknown top-level field(s) ignored: areas, routes, runtime",
    "code": "rule"
  },
  {
    "severity": "warning",
    "path": "$.nav.cell",
    "message": "nav.cell 32 differs from max(1, round(actorRadius/2)) = 6, which map_nav uses",
    "code": "rule"
  }
]
}
```

`assets/maps/starter_village/bundle-report-v3.json`:

```json
{
  "checks": [
    {
      "id": "schema",
      "status": "fail",
      "value": {
        "errors": 1,
        "warnings": 0
      },
      "threshold": {
        "errors": 0
      }
    }
  ],
  "problems": [
  {
    "severity": "error",
    "path": "$.anchors.paths",
    "message": "'point' is a required property",
    "code": "schema"
  }
]
}
```

`logs/starter-village-doctor.json` (MISSING API/ffmpeg/resvg không cần cho route host_image/static PNG):

```json
[
  {
    "id": "python.path",
    "status": "WARN",
    "detail": "other python.exe on PATH: ~/AppData/Local/Microsoft/WindowsApps/python.exe",
    "remedy": "PowerShell, cmd and Git Bash may resolve different interpreters; run Forge with the one shown in python.version"
  },
  {
    "id": "encoding.stdout",
    "status": "FAIL",
    "detail": "stdout=cp1252 cannot print U+2192, U+2190: Python scripts that print them (your own helpers, older tools) crash with UnicodeEncodeError after doing their work",
    "remedy": "set PYTHONUTF8=1 before running Python (PowerShell: $env:PYTHONUTF8=1; bash: export PYTHONUTF8=1)"
  },
  {
    "id": "encoding.files",
    "status": "WARN",
    "detail": "open() and read_text() without encoding= use cp1252",
    "remedy": "pass encoding='utf-8' in your own scripts, or set PYTHONUTF8=1"
  },
  {
    "id": "paths.cwd",
    "status": "WARN",
    "detail": "the working folder has spaces or non-ASCII characters",
    "remedy": "quote every path; prefer ASCII output folder names for ffmpeg frame patterns"
  }
]
```

`logs/starter-village-doctor-utf8.json` (MISSING API/ffmpeg/resvg không cần cho route host_image/static PNG):

```json
[
  {
    "id": "python.path",
    "status": "WARN",
    "detail": "other python.exe on PATH: ~/AppData/Local/Microsoft/WindowsApps/python.exe",
    "remedy": "PowerShell, cmd and Git Bash may resolve different interpreters; run Forge with the one shown in python.version"
  },
  {
    "id": "paths.cwd",
    "status": "WARN",
    "detail": "the working folder has spaces or non-ASCII characters",
    "remedy": "quote every path; prefer ASCII output folder names for ffmpeg frame patterns"
  }
]
```

Preview đầu `assets/maps/starter_village/preview/preview-qa.json`: verification SKIPPED vì npm Playwright chưa được resolver của Forge tìm thấy. Đã dùng NODE_PATH trỏ package Playwright đã cài, không cài mới; preview-verified sau đó PASS. Extraction đầu từ chối edge-touch; sửa alpha hygiene với alpha-floor=4, reject-edge-touch vẫn bật, detached components chỉ có max alpha=5. Prop-pack cuối PASS, không bypass QA.
