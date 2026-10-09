"""Package Forge-processed masters on the existing map; no game data is changed."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
TILED = ROOT / 'assets/maps/starter_village/tiled'
map_data = json.loads((TILED / 'map.tmj').read_text(encoding='utf-8'))
scene = Image.open(TILED / 'images/terrain.png').convert('RGBA')
props = []
for layer in map_data['layers']:
    if layer['type'] != 'objectgroup' or layer['name'] != 'props':
        continue
    for obj in layer['objects']:
        values = {v['name']: v['value'] for v in obj.get('properties', [])}
        path = TILED / ('images/prop.png' if obj['gid'] == 1 else 'images/prop-2.png')
        art = Image.open(path).convert('RGBA').resize((round(obj['width']), round(obj['height'])), Image.Resampling.LANCZOS)
        props.append((values['sortY'], art, (round(obj['x']), round(obj['y'] - obj['height']))))
assets = []
pair = Image.new('RGBA', (512, 320), (235, 230, 217, 255))
draw = ImageDraw.Draw(pair)
for i, sex in enumerate(['male', 'female']):
    path = BASE / (sex + '-aligned') / 'clean.png'
    with Image.open(path) as source:
        source.load()
        assert source.size == (128, 128) and source.mode == 'RGBA'
        image = source.copy()
    alpha = image.getchannel('A')
    assert alpha.getextrema() == (0, 255)
    meta = json.loads((path.parent / 'pipeline-meta.json').read_text(encoding='utf-8'))
    assert meta['qa']['status'] == 'pass'
    assert meta['frames'][0]['output_subject_height_px'] == 99
    assert meta['frames'][0]['output_anchor'][1] == 113
    pair.alpha_composite(image.resize((256, 256), Image.Resampling.LANCZOS), (i * 256, 32))
    draw.text((i * 256 + 95, 8), sex.title(), fill=(30, 40, 40, 255))
    scale = 0.9
    placed = image.resize((round(128 * scale), round(128 * scale)), Image.Resampling.LANCZOS)
    foot = [574 + i * 100, 624]
    origin = [64, 113]
    props.append((foot[1] + 0.1, placed, (round(foot[0] - origin[0] * scale), round(foot[1] - origin[1] * scale))))
    raw = BASE / (sex + '-raw.png')
    with Image.open(raw) as raw_image:
        raw_size = list(raw_image.size)
        raw_alpha = raw_image.getchannel('A').getextrema()
    assets.append({'id': sex + '-base-south-preview', 'status': 'PENDING_ART_APPROVAL', 'productionReady': False,
        'raw': raw.name, 'rawSize': raw_size, 'rawAlphaRange': raw_alpha,
        'rawSha256': hashlib.sha256(raw.read_bytes()).hexdigest(),
        'frame': str(path.relative_to(BASE)), 'frameSize': [128, 128], 'frameCount': 1, 'direction': 'S',
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'alphaRange': alpha.getextrema(),
        'originPx': origin, 'baselinePx': 113, 'measuredFootAnchorPx': meta['frames'][0]['output_anchor'],
        'visibleHeightPx': 99, 'renderScale': scale, 'displayHeightWorldPx': 89.1,
        'previewFootWorld': foot, 'prompt': sex + '-prompt/exact-host-prompt.txt',
        'source': 'host_image:Codex Client image_gen', 'model': None, 'cost': None,
        'references': ['assets/maps/starter_village/runtime-qa/starter-scene.png'] + (['male-raw.png'] if sex == 'female' else []),
        'layersSeparated': False, 'qa': str((path.parent / 'pipeline-meta.json').relative_to(BASE))})
for _, art, pos in sorted(props, key=lambda x: x[0]):
    scene.alpha_composite(art, pos)
scene.convert('RGB').save(BASE / 'starter-village-preview.png')
scene.crop((240, 200, 1040, 840)).convert('RGB').save(BASE / 'starter-village-detail.png')
pair.convert('RGB').save(BASE / 'master-pair-preview.png')
report = {'schema': 'character-master-preview.v1', 'approval': 'PENDING_USER', 'assets': assets,
    'mapSource': 'assets/maps/starter_village/tiled/map.tmj',
    'mapSha256': hashlib.sha256((TILED / 'map.tmj').read_bytes()).hexdigest(),
    'previewOnly': True, 'runtimeIntegrated': False,
    'limitations': ['Static South masters only; no animation/foot-sliding proof',
        'Sample clothing/hair painted in visual candidate; production layers not separated',
        'Measured horizontal stance anchors differ by about 0.69px despite common canvas origin',
        'Identity, chibi proportions and top-down perspective require user art approval',
        'Offline composition uses official Tiled geometry; not a new runtime or collision test']}
(BASE / 'manifest.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'status': 'pass', 'frames': 2, 'size': [128, 128], 'baseline': 113, 'approval': 'PENDING_USER'}))
