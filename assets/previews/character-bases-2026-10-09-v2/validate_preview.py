"""Technical gates plus measurable visual-difference proxies, not gender inference."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, label

BASE = Path(__file__).resolve().parent
assets = []
masks = []
problems = []
review = Image.new('RGB', (560, 180), (230, 229, 220))
draw = ImageDraw.Draw(review)
for i, sex in enumerate(['male', 'female']):
    path = BASE / 'frames' / (sex + '.png')
    with Image.open(path) as source:
        source.load()
        mode, size = source.mode, list(source.size)
        image = source.convert('RGBA')
    pixels = np.asarray(image)
    alpha = pixels[..., 3]
    rgb = pixels[..., :3].astype(float)
    visible = alpha > 16
    masks.append(visible)
    ring = (alpha > 0) & binary_dilation(alpha == 0, structure=np.ones((3, 3)))
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    sat = (rgb.max(2) - rgb.min(2)) / np.maximum(rgb.max(2), 1)
    # QC detector for conspicuous warm spill on the outer pixel ring. Skin/interior excluded.
    warm = ring & (rgb.max(2) > 90) & (sat > 0.5) & (r >= g - 8) & (g > b)
    hidden = (alpha == 0) & (rgb.max(2) != 0)
    _, components = label(visible, structure=np.ones((3, 3)))
    bbox = Image.fromarray(alpha).getbbox()
    border = np.concatenate([alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]])
    meta = json.loads((BASE / (sex + '-aligned') / 'pipeline-meta.json').read_text(encoding='utf-8'))
    checks = {'readableRGBA128': mode == 'RGBA' and size == [128, 128],
        'realAlpha': int(alpha.min()) == 0 and int(alpha.max()) == 255,
        'cleanHiddenRGB': int(hidden.sum()) == 0, 'noVisibleCanvasBorder': not bool(border.any()),
        'warmRimPixelsZero': int(warm.sum()) == 0, 'noDisconnectedVisibleIsland': components == 1,
        'commonBaseline113': bbox[3] == 113 and meta['frames'][0]['output_anchor'][1] == 113,
        'commonVisibleHeight99': bbox[3] - bbox[1] == 99,
        'ForgeStrictQC': meta['qa']['status'] == 'pass'}
    for key, ok in checks.items():
        if not ok:
            problems.append(sex + ':' + key)
    dark_band = int(((rgb.max(2) < 110) & (alpha >= 128))[40:75].sum())
    assets.append({'id': sex, 'checks': checks, 'alphaRange': [int(alpha.min()), int(alpha.max())],
        'alphaLevels': int(np.unique(alpha).size), 'bbox': bbox, 'warmRimPixels': int(warm.sum()),
        'hiddenRGBPixels': int(hidden.sum()), 'visibleComponents': int(components),
        'canvasOriginPx': [64, 113], 'measuredStancePx': meta['frames'][0]['output_anchor'],
        'visibleHeightPx': 99, 'targetDisplayHeightWorldPx': 89.1,
        'darkSideHairBandPixels': dark_band,
        'nonPassForgeChecks': [c for c in meta['qa']['checks'] if c['status'] != 'pass']})
    small = image.resize((115, 115), Image.Resampling.LANCZOS)
    for col, background in enumerate([(248, 248, 248), (20, 25, 30)]):
        tile = Image.new('RGBA', (140, 140), background + (255,))
        tile.alpha_composite(small, (12, 12))
        review.paste(tile.convert('RGB'), (i * 280 + col * 140, 28))
    draw.text((i * 280 + 65, 5), sex.title() + ' ~89 world px', fill=(30, 30, 30))
review.save(BASE / 'gameplay-alpha-review.png')
silhouette = Image.new('RGBA', (280, 160), (236, 232, 223, 255))
for i, mask in enumerate(masks):
    ink = np.zeros((128, 128, 4), dtype=np.uint8)
    ink[mask] = [30, 35, 40, 255]
    silhouette.alpha_composite(Image.fromarray(ink), (i * 140 + 6, 16))
silhouette.convert('RGB').save(BASE / 'silhouette-review.png')
union = (masks[0] | masks[1]).sum()
diff = int((masks[0] ^ masks[1]).sum())
report = {'schema': 'master-preview-validation.v2', 'status': 'PASS' if not problems else 'FAIL',
    'assets': assets, 'failures': problems,
    'visualDifference': {'differentSilhouettePixels': diff,
        'silhouetteIoU': round(float((masks[0] & masks[1]).sum() / union), 4),
        'femaleMinusMaleDarkHairBandPixels': assets[1]['darkSideHairBandPixels'] - assets[0]['darkSideHairBandPixels'],
        'interpretation': 'Difference proxies only; these do not prove human recognition or gender.'},
    'manualReview': {'status': 'PENDING_USER_APPROVAL',
        'observed': ['Male short spiky hair/angular eyebrows/face and square shoulders',
            'Female long hair to waist, softer face/larger eyes and narrower clothing shoulder silhouette',
            'Both inspected side-by-side at gameplay scale and on original Starter Village'],
        'notProven': ['Recognition by players without labels', 'Layer separation/hidden anatomy',
            'Animation stability, foot sliding or other directions']},
    'qcThresholds': {'warmRim': 'outer 1px ring, RGB max>90, saturation>0.5, R>=G-8 and G>B',
        'geometryAlphaThreshold': 16, 'darkHairBand': 'rows40..74, maxRGB<110, alpha>=128'},
    'thresholdScope': 'Image QC measurements only, not new game or balance rules'}
(BASE / 'validation-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report))
raise SystemExit(1 if problems else 0)
