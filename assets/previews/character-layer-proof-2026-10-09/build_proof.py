"""Package genuinely generated separate parts; never extract parts from approved master.

Registration is a disclosed engineering approximation, not an accepted art result.
"""
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sys.path.insert(0, str(ROOT / '.agents/skills/generate2dsprite/scripts'))
import forge_core
import forge_matte

NAMES = ['body', 'hair_back', 'hair_front', 'shirt', 'pants', 'shoes']
SOURCES = {
    'male': [[128, 48, 392, 550], [600, 75, 920, 380], [1120, 100, 1420, 380],
             [90, 570, 430, 900], [600, 640, 920, 930], [1110, 760, 1410, 970]],
    'female': [[120, 40, 390, 580], [600, 20, 940, 460], [1120, 30, 1430, 450],
               [80, 580, 430, 960], [610, 630, 910, 990], [1130, 770, 1410, 1010]]}
TARGETS = {
    'male': [[43, 14, 85, 113], [49, 14, 80, 44], [49, 14, 80, 44],
             [43, 42, 85, 87], [47, 72, 82, 99], [47, 89, 82, 113]],
    'female': [[44, 14, 84, 113], [40, 14, 88, 76], [47, 14, 83, 65],
               [45, 42, 83, 87], [47, 72, 83, 99], [47, 89, 83, 113]]}
ORDER = ['hair_back', 'body', 'pants', 'shoes', 'shirt', 'hair_front', 'weapon']

def composite(layers, disabled=(), clothing=None):
    out = Image.new('RGBA', (128, 128))
    for name in ORDER:
        if name not in disabled:
            out.alpha_composite((clothing or layers)[name] if name in ['shirt', 'pants', 'shoes'] else layers[name])
    return out

all_layers = {}
report = {'schema': 'character-layer-proof.v1', 'overall': 'BLOCKED', 'productionReady': False,
          'frameSize': [128, 128], 'originPx': [64, 113], 'baselinePx': 113,
          'contract': {'directions': ['N', 'E', 'S', 'W'], 'idleFrames': 4, 'runFrames': 8},
          'classes': ['Physical DPS', 'Magic DPS', 'Tank'], 'layers': [], 'comparison': [],
          'blockers': ['Requested human character body generation rejected by backend output moderation',
              'Gray featureless mannequin is explicitly an engineering substitute, not the approved body',
              'Source atlas parts not registered to original pose; manual target rectangles are approximations',
              'Female hair front contains ear/skin pixels; pants and shoes overlap shin wraps',
              'Face, body proportions and seamless garment fit do not reproduce approved master'],
          'notProven': ['Production layer independence', 'Three-class animation playback', '96 frames/other directions']}
for sex in ['male', 'female']:
    raw_path = BASE / (sex + '-atlas-raw.png')
    atlas = Image.open(raw_path).convert('RGBA')
    assert atlas.size == (1536, 1024)
    folder = BASE / sex
    folder.mkdir(exist_ok=True)
    layers = {}
    for name, source_box, target_box in zip(NAMES, SOURCES[sex], TARGETS[sex]):
        part, hygiene = forge_core.alpha_hygiene(atlas.crop(source_box), mode='both', floor=16)
        px = np.asarray(part).copy()
        px[px[..., 3] <= 16] = 0
        part = Image.fromarray(px)
        bbox = part.getbbox()
        assert bbox is not None
        # Crop only the owning standalone atlas asset, not pixels from clothed master.
        isolated = part.crop(bbox)
        x0, y0, x1, y1 = target_box
        resized = isolated.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
        frame = Image.new('RGBA', (128, 128))
        frame.alpha_composite(resized, (x0, y0))
        px = np.asarray(frame).copy()
        for key in ['#FF0000', '#FFFF00', '#FF00FF']:
            px, _ = forge_matte.despill(px, mode='edge', radius=1, margin=8, key=key)
        px[px[..., 3] == 0] = 0
        frame = Image.fromarray(px)
        path = folder / (name + '.png')
        frame.save(path)
        layers[name] = frame
        report['layers'].append({'sex': sex, 'name': name, 'path': str(path.relative_to(BASE)),
            'originPx': [64, 113], 'source': raw_path.name, 'sourceBox': source_box,
            'ownedAssetBBox': bbox, 'approximateTargetBox': target_box,
            'sourceKind': 'newly_generated_standalone_atlas_part', 'copiedFromMaster': False,
            'hygiene': hygiene, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'bodyIsApprovedCharacter': False if name == 'body' else None})
    layers['weapon'] = Image.new('RGBA', (128, 128))
    layers['weapon'].save(folder / 'weapon.png')
    all_layers[sex] = layers
    assembled = composite(layers)
    assembled.save(folder / 'composite.png')
    master = Image.open(ROOT / 'assets/previews/character-bases-2026-10-09-v2/frames' / (sex + '.png')).convert('RGBA')
    a, b = np.asarray(assembled), np.asarray(master)
    ma, mb = a[..., 3] > 16, b[..., 3] > 16
    union = (ma | mb).sum()
    report['comparison'].append({'sex': sex, 'identicalRGBA': bool(np.array_equal(a, b)),
        'changedPixels': int(np.any(a != b, axis=2).sum()),
        'silhouetteIoU': round(float((ma & mb).sum() / union), 4),
        'acceptance': 'FAIL_MASTER_FIDELITY', 'reason': 'Substitute body and approximate registration; no invented numerical approval threshold'})
    sheet = Image.new('RGB', (384, 176), (230, 229, 221))
    for col, pic in enumerate([master, assembled, composite(layers, ['shirt', 'pants', 'shoes'])]):
        sheet.paste(pic, (col * 128, 24), pic)
    d = ImageDraw.Draw(sheet)
    for col, text in enumerate(['Master v2', 'Layer composite', 'Clothing OFF']):
        d.text((col * 128 + 8, 5), text, fill=(20, 30, 40))
    sheet.save(folder / 'comparison.png')
    gallery = Image.new('RGB', (128 * 4, 176 * 2), (232, 232, 223))
    for i, name in enumerate(ORDER):
        pic = layers[name]
        pos = ((i % 4) * 128, (i // 4) * 176 + 24)
        gallery.paste(pic, pos, pic)
        ImageDraw.Draw(gallery).text((pos[0] + 5, pos[1] - 19), name, fill=(20, 30, 40))
    gallery.save(folder / 'layer-gallery.png')

tests = []
for sex, layers in all_layers.items():
    original = composite(layers)
    for name in ORDER:
        changed = not np.array_equal(np.asarray(original), np.asarray(composite(layers, [name])))
        tests.append({'sex': sex, 'test': 'toggle:' + name, 'renderChanged': changed,
                      'expected': name != 'weapon', 'passed': changed == (name != 'weapon')})
    other = all_layers['female' if sex == 'male' else 'male']
    body_before = hashlib.sha256(layers['body'].tobytes()).hexdigest()
    swapped = composite(layers, clothing=other)
    swapped.save(BASE / sex / 'clothing-swapped.png')
    tests.append({'sex': sex, 'test': 'swap_clothing',
        'passed': not np.array_equal(np.asarray(original), np.asarray(swapped)) and body_before == hashlib.sha256(layers['body'].tobytes()).hexdigest(),
        'scope': 'Renderer/data independence only; garment fit not accepted'})
    hashes = [hashlib.sha256(composite(layers).tobytes()).hexdigest() for _ in report['classes']]
    tests.append({'sex': sex, 'test': 'same_layer_set_for_3_classes', 'passed': len(set(hashes)) == 1,
        'scope': 'Static render reuse; no animation playback proven'})
report['technicalTests'] = tests
report['technicalTestsPassed'] = sum(t['passed'] for t in tests)
report['technicalTestsTotal'] = len(tests)
report['backend'] = 'Codex Client image_gen / host_image'
report['rawHashes'] = {s: hashlib.sha256((BASE / (s + '-atlas-raw.png')).read_bytes()).hexdigest() for s in all_layers}
(BASE / 'report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'overall': report['overall'], 'technicalTests': f"{report['technicalTestsPassed']}/{report['technicalTestsTotal']}", 'comparison': report['comparison']}))
