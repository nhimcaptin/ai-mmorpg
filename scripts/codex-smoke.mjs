import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codexArguments, runProcess, validateResult } from './auto-dev.mjs';
import { outputObserver, terminalProgress } from './auto-dev-output.mjs';

// Read-only transport/schema/auth smoke; never enters the autonomous task loop.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = path.join(root, 'logs', 'codex-smoke', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(logDir, { recursive: true });
const live = process.argv.includes('--live');
const progress = terminalProgress(undefined, Date.now(), { live });
const emit = (message, kind) => progress({ taskId: 'CODEX_SMOKE', message, kind });
const observer = outputObserver({ codex: true, live, emit, structuredLog: path.join(logDir, 'session.events.jsonl') });
const resultPath = path.join(logDir, 'result.json');
const controller = new AbortController();
process.once('SIGINT', () => controller.abort()); process.once('SIGTERM', () => controller.abort());
const specHash = () => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'GAME_SPEC.md'))).digest('hex');
const before = specHash();
let summary;
try {
  emit('Read-only smoke: kiểm tra stdin, argv, schema và backend đã xác thực');
  const result = await runProcess('codex', codexArguments({ root, resultPath, sandbox: 'read-only' }), {
    root, timeoutMs: 120_000, signal: controller.signal, log: path.join(logDir, 'session.jsonl'), onOutput: observer.write,
    input: 'Read-only smoke test. Do not use tools, edit files, run tasks or read project content. '
      + 'Reply ONLY with this JSON object: {"schemaVersion":1,"taskId":"CODEX_SMOKE","status":"BLOCKED",'
      + '"summary":"CODEX_OK","changedFiles":[],"requiresE2E":false,"blockers":["SMOKE_ONLY"]}.',
  });
  observer.end(); emit(`Codex exit ${result.code}`);
  if (result.code !== 0) throw new Error('Codex exit ' + result.code + ': ' + result.stderr.slice(-2000));
  const value = validateResult(JSON.parse(fs.readFileSync(resultPath, 'utf8')), 'CODEX_SMOKE');
  if (value.summary !== 'CODEX_OK' || value.status !== 'BLOCKED' || value.changedFiles.length
    || value.requiresE2E || JSON.stringify(value.blockers) !== '["SMOKE_ONLY"]') throw new Error('Smoke response không khớp yêu cầu.');
  if (specHash() !== before) throw new Error('GAME_SPEC hash thay đổi.');
  summary = { status: 'PASS', code: result.code, sandbox: 'read-only', response: value, logDir, specUnchanged: true };
} catch (error) {
  observer.end(); summary = { status: controller.signal.aborted ? 'INTERRUPTED' : 'FAIL', reason: error.message, logDir };
}
fs.writeFileSync(path.join(logDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.status === 'PASS' ? 0 : 1;
