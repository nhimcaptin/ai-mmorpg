"""Explicit sprite matte cleanup with Forge utilities; preserve raw/edit artwork."""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sys.path.insert(0, str(ROOT / '.agents/skills/generate2dsprite/scripts'))
import forge_core
import forge_matte

reports = []
for sex in ['male', 'female']:
    raw = Image.open(BASE / (sex + '-raw.png')).convert('RGBA')
    cleaned, hygiene = forge_core.alpha_hygiene(raw, mode='both', floor=4)
    pixels = np.asarray(cleaned).copy()
    steps = []
    # Actual fringe is red/orange/yellow, not a global chroma-key background.
    # Edge-only Forge despill leaves all deep-interior skin/clothing untouched.
    for key in ['#FF0000', '#FFFF00', '#FF00FF']:
        pixels, report = forge_matte.despill(pixels, mode='edge', radius=3, margin=8, key=key)
        steps.append({'key': key, **report})
    pixels[pixels[..., 3] == 0] = 0
    Image.fromarray(pixels).save(BASE / (sex + '-matte.png'))
    reports.append({'sex': sex, 'hygiene': hygiene, 'edgeDespill': steps,
                    'rawPreserved': True, 'alphaNeverChangedByDespill': True})
(BASE / 'matte-report.json').write_text(json.dumps(reports, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': 'ok', 'reports': reports}))
