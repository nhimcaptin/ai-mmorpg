"""Fail-closed intake of DOWN/IDLE0 layered assets anchored to approved v2 masters.

No generation, repaint, automatic fit or reconstruction tricks are performed here.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
MASTER_DIR = ROOT / 'assets/previews/character-bases-2026-10-09-v2/frames'
MASTER_SHA = {'male': '1f48274e05c3709481f1c8052fc5d90d81a8633f528e729cdb0c85f5308b3e84',
              'female': '5eeb1f3fcb3c49d848c1b7dd3163eb34ac14dcf241d4a5a153319ed2267d757e'}
ORDER = ['hair_back', 'body', 'pants', 'shoes', 'shirt', 'hair_front', 'weapon']
CONTRACT = {'canvas': [128, 128], 'origin': [64, 113], 'direction': 'DOWN', 'animation': 'IDLE', 'frame': 0}

def render(layers, disabled=None):
    image = Image.new('RGBA', (128, 128))
    for name in ORDER:
        if name != disabled and name in layers:
            image.alpha_composite(layers[name])
    return image

def panel(images, labels):
    out = Image.new('RGB', (len(images) * 256, 286), (235, 232, 221))
    draw = ImageDraw.Draw(out)
    for i, (image, label) in enumerate(zip(images, labels)):
        out.paste(image.resize((256, 256), Image.Resampling.NEAREST), (i * 256, 26), image.resize((256, 256), Image.Resampling.NEAREST))
        draw.text((i * 256 + 5, 5), label, fill=(20, 30, 40))
    return out

def inspect(manifest, output):
    if output.exists():
        raise ValueError('Output directory already exists; preserve previous evidence.')
    output.mkdir(parents=True)
    report = {'schema': 'layer-intake-gate.v2', 'overall': 'BLOCKED', 'productionReady': False,
              'directionMappingNote': 'DOWN is S in existing game contract; no game rule changed',
              'contract': CONTRACT, 'issues': [], 'characters': [], 'visualDiffReview': 'PENDING_USER'}
    if manifest.get('purpose') != 'candidate':
        report['issues'].append('DIAGNOSTIC_ONLY: rejected legacy source must never become accepted candidate')
    for sex in ['male', 'female']:
        issues = []
        master_path = MASTER_DIR / (sex + '.png')
        if hashlib.sha256(master_path.read_bytes()).hexdigest() != MASTER_SHA[sex]:
            issues.append('Approved master v2 hash mismatch')
        master = Image.open(master_path).convert('RGBA')
        character = manifest.get('characters', {}).get(sex, {})
        entries = character.get('layers', {})
        layers, digests, validations = {}, {}, []
        for name in ORDER:
            entry = entries.get(name)
            if entry is None:
                issues.append('Missing layer:' + name)
                continue
            for key, expected in CONTRACT.items():
                if entry.get(key) != expected:
                    issues.append(f'{name}: invalid {key}, expected {expected}')
            if name != 'weapon' and entry.get('sourceKind') != 'independently_painted_layer':
                issues.append(name + ': source is not independently painted valid layer (no mannequin/composite crop)')
            if name != 'weapon' and entry.get('review') != 'USER_APPROVED_CONTENT':
                issues.append(name + ': semantic content review missing/rejected; hash uniqueness cannot prove independence')
            try:
                path = (ROOT / entry['path']).resolve()
                if not path.is_relative_to(ROOT.resolve()):
                    issues.append(name + ': source path outside workspace')
                    continue
                with Image.open(path) as opened:
                    opened.load()
                    if opened.mode != 'RGBA' or opened.size != (128, 128):
                        issues.append(name + ': file must be actual RGBA128x128')
                        continue
                    image = opened.copy()
                pixels = np.asarray(image)
                alpha = pixels[..., 3]
                if name == 'weapon':
                    if alpha.any():
                        issues.append('weapon: expected blank layer in this proof')
                elif not alpha.any() or not (alpha == 0).any():
                    issues.append(name + ': missing content or real transparency')
                if np.any(pixels[alpha == 0, :3] != 0):
                    issues.append(name + ': hidden background RGB residue')
                if np.array_equal(pixels, np.asarray(master)):
                    issues.append(name + ': layer is identical to clothed master')
                digest = hashlib.sha256(image.tobytes()).hexdigest()
                if name != 'weapon' and digest in digests.values():
                    issues.append(name + ': duplicate nonweapon layer')
                digests[name] = digest
                layers[name] = image
                validations.append({'name': name, 'actualSize': list(image.size), 'mode': image.mode,
                    'sourceKind': entry.get('sourceKind'), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
            except (OSError, KeyError) as error:
                issues.append(name + ': unreadable/missing: ' + str(error))
        result = {'sex': sex, 'issues': issues, 'layers': validations, 'rendered': False}
        if len(layers) == len(ORDER):
            target = output / sex
            target.mkdir()
            composite = render(layers)
            composite.save(target / 'composite.png')
            a, b = np.asarray(master).astype(np.int16), np.asarray(composite).astype(np.int16)
            changed = np.any(a != b, axis=2)
            delta = np.abs(a - b).astype(np.uint8)
            # Diff has no subjective pass threshold; user reviews actual images.
            heat = np.zeros((128, 128, 4), dtype=np.uint8)
            heat[changed] = [235, 30, 170, 255]
            Image.fromarray(heat).save(target / 'diff-mask.png')
            visible_diff = np.zeros((128, 128, 4), dtype=np.uint8)
            visible_diff[..., :3] = np.maximum(delta[..., :3], delta[..., 3, None])
            visible_diff[..., 3] = 255
            diff = Image.fromarray(visible_diff)
            diff.save(target / 'absolute-diff.png')
            panel([master, composite, diff], ['Master v2', 'REJECTED composite' if manifest.get('purpose') != 'candidate' else 'Candidate', 'Absolute RGBA diff']).save(target / 'visual-diff.png')
            for name in ['shirt', 'pants', 'shoes']:
                without = render(layers, name)
                without.save(target / ('without-' + name + '.png'))
                panel([composite, without], ['Composite', name + ' OFF']).save(target / ('toggle-' + name + '.png'))
            result['rendered'] = True
            ma, mb = a[..., 3] > 16, b[..., 3] > 16
            result['diff'] = {'changedPixels': int(changed.sum()),
                              'silhouetteIoU': round(float((ma & mb).sum() / (ma | mb).sum()), 4),
                              'acceptance': 'NO_AUTO_PASS: requires user visual diff approval'}
        if character.get('bodyMatchesApprovedMaster') != 'USER_APPROVED':
            issues.append('Body identity/skin/proportion/pose/completeness not approved; mannequin forbidden')
        if character.get('hairHasNoSkinOrFace') != 'USER_APPROVED':
            issues.append('Hair ownership not approved; female front/back must contain no skin/face')
        if character.get('registrationMatchesBody') != 'USER_APPROVED':
            issues.append('Exact registration to Body not approved; common origin alone does not prove it')
        if character.get('visualDiffApproval') != 'USER_APPROVED':
            issues.append('Visual diff acceptance missing; no invented similarity threshold')
        report['characters'].append(result)
    all_issues = report['issues'] + [f"{c['sex']}: {i}" for c in report['characters'] for i in c['issues']]
    if not all_issues:
        report['overall'] = 'VERIFIED_STATIC_LAYER_PREVIEW'
        report['visualDiffReview'] = 'USER_APPROVED'
    report['issueCount'] = len(all_issues)
    (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    report = inspect(json.loads(args.manifest.read_text(encoding='utf-8')), args.output_dir)
    print(json.dumps({'overall': report['overall'], 'issueCount': report['issueCount'], 'productionReady': False}))
    raise SystemExit(0 if report['overall'] == 'VERIFIED_STATIC_LAYER_PREVIEW' else 1)
