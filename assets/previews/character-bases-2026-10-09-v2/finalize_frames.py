"""Remove resize-edge spill without changing geometry; keep Forge source bundles."""
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE.parents[2] / '.agents/skills/generate2dsprite/scripts'))
import forge_matte

output = BASE / 'frames'
output.mkdir(exist_ok=True)
reports = []
for sex in ['male', 'female']:
    source = BASE / (sex + '-aligned') / 'clean.png'
    pixels = np.asarray(Image.open(source).convert('RGBA')).copy()
    alpha_before = pixels[..., 3].copy()
    steps = []
    for key in ['#FF0000', '#FFFF00', '#FF00FF']:
        pixels, report = forge_matte.despill(pixels, mode='edge', radius=1, margin=8, key=key)
        steps.append({'key': key, **report})
    pixels[pixels[..., 3] == 0] = 0
    assert np.array_equal(alpha_before, pixels[..., 3])
    path = output / (sex + '.png')
    Image.fromarray(pixels).save(path)
    reports.append({'sex': sex, 'source': str(source.relative_to(BASE)),
                    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                    'output': str(path.relative_to(BASE)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                    'alphaUnchanged': True, 'edgeSteps': steps})
(BASE / 'finalize-report.json').write_text(json.dumps(reports, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': 'ok', 'outputs': reports}))
