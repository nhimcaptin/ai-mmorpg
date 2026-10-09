"""Regression tests for refusal gates. Never approve or synthesize production art."""
import copy
import json
import unittest
import uuid
from pathlib import Path
import numpy as np
from PIL import Image
import pipeline

BASE = Path(__file__).resolve().parent
RUN = BASE / 'gate-tests' / uuid.uuid4().hex
RUN.mkdir(parents=True)
REJECTED = json.loads((BASE / 'rejected-audit.json').read_text(encoding='utf-8'))

class PipelineGateTests(unittest.TestCase):
    def output(self):
        return RUN / self._testMethodName

    def test_rejected_legacy_cannot_pass(self):
        report = pipeline.inspect(copy.deepcopy(REJECTED), self.output())
        self.assertEqual(report['overall'], 'BLOCKED')
        self.assertFalse(report['productionReady'])

    def test_missing_layers_block(self):
        report = pipeline.inspect({'purpose': 'candidate', 'characters': {}}, self.output())
        self.assertEqual(report['overall'], 'BLOCKED')
        self.assertTrue(any('Missing layer:body' in c['issues'] for c in report['characters']))

    def test_down_idle0_origin_is_enforced(self):
        candidate = copy.deepcopy(REJECTED)
        body = candidate['characters']['male']['layers']['body']
        body.update(direction='UP', animation='RUN', frame=1, origin=[63, 112])
        report = pipeline.inspect(candidate, self.output())
        issues = report['characters'][0]['issues']
        for key in ['direction', 'animation', 'frame', 'origin']:
            self.assertTrue(any('invalid ' + key in issue for issue in issues))

    def test_composite_duplicates_rejected_even_with_claimed_review(self):
        candidate = copy.deepcopy(REJECTED)
        candidate['purpose'] = 'candidate'
        for sex, character in candidate['characters'].items():
            for name, entry in character['layers'].items():
                if name == 'weapon':
                    continue
                entry.update(path=f'assets/previews/character-bases-2026-10-09-v2/frames/{sex}.png',
                             sourceKind='independently_painted_layer', review='USER_APPROVED_CONTENT')
            for key in ['bodyMatchesApprovedMaster', 'hairHasNoSkinOrFace', 'registrationMatchesBody', 'visualDiffApproval']:
                character[key] = 'USER_APPROVED'
        report = pipeline.inspect(candidate, self.output())
        self.assertEqual(report['overall'], 'BLOCKED')
        self.assertTrue(all(any('identical to clothed master' in issue for issue in c['issues']) for c in report['characters']))

    def test_mannequin_not_accepted_by_review_flag(self):
        candidate = copy.deepcopy(REJECTED)
        candidate['purpose'] = 'candidate'
        for character in candidate['characters'].values():
            for entry in character['layers'].values():
                entry['review'] = 'USER_APPROVED_CONTENT'
        report = pipeline.inspect(candidate, self.output())
        self.assertEqual(report['overall'], 'BLOCKED')
        self.assertTrue(all(any('body: source is not independently painted valid layer' in issue for issue in c['issues']) for c in report['characters']))

    def test_master_hash_is_locked(self):
        old = pipeline.MASTER_SHA['male']
        try:
            pipeline.MASTER_SHA['male'] = 'not-approved-sha'
            report = pipeline.inspect(copy.deepcopy(REJECTED), self.output())
        finally:
            pipeline.MASTER_SHA['male'] = old
        self.assertIn('Approved master v2 hash mismatch', report['characters'][0]['issues'])

    def test_individual_shirt_pants_shoes_off_and_diff_exported(self):
        report = pipeline.inspect(copy.deepcopy(REJECTED), self.output())
        for sex in ['male', 'female']:
            folder = self.output() / sex
            image = np.array(Image.open(folder / 'composite.png'))
            for name in ['shirt', 'pants', 'shoes']:
                toggled = np.array(Image.open(folder / ('without-' + name + '.png')))
                self.assertFalse(np.array_equal(image, toggled))
            self.assertTrue((folder / 'absolute-diff.png').exists())
            self.assertTrue((folder / 'visual-diff.png').exists())
        self.assertEqual(report['overall'], 'BLOCKED')

    def test_existing_evidence_not_overwritten(self):
        output = self.output()
        pipeline.inspect(copy.deepcopy(REJECTED), output)
        before = (output / 'report.json').read_bytes()
        with self.assertRaisesRegex(ValueError, 'already exists'):
            pipeline.inspect(copy.deepcopy(REJECTED), output)
        self.assertEqual(before, (output / 'report.json').read_bytes())

if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(PipelineGateTests)
    with (BASE / 'gate-tests.log').open('w', encoding='utf-8') as log:
        result = unittest.TextTestRunner(stream=log, verbosity=2).run(suite)
    report = {'gateTests': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
              'evidence': str(RUN.relative_to(BASE)), 'assetAcceptance': 'BLOCKED'}
    (BASE / 'gate-test-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report))
    raise SystemExit(0 if result.wasSuccessful() else 1)
