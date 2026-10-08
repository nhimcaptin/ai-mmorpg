import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';
import { orchestrate, roadmap, nextTask, runProcess, validateResult, verify, resolveCommand, codexArguments, cancellationController } from '../../scripts/auto-dev.mjs';
import { outputObserver, terminalProgress } from '../../scripts/auto-dev-output.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const help = '--sandbox --ignore-user-config --output-schema --json --output-last-message --cd';
const tasks = () => [
  { id: 'T01', kind: 'task', status: 'TODO', dependencies: [], assets: [], e2e: false },
  { id: 'T02', kind: 'task', status: 'TODO', dependencies: ['T01'], assets: [], e2e: false },
];
const document = (items) => '| T01 | Việc một | Không | Không | Có test |\n| T02 | Việc hai | T01 | Không | Có test |\n'
  + '<!-- AUTO_DEV_TASKS_START -->\n```json\n' + JSON.stringify({ version: 1, tasks: items }) + '\n```\n<!-- AUTO_DEV_TASKS_END -->\n';
const read = (p) => fs.readFileSync(p, 'utf8');

async function fixture(config = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-orchestrator-'));
  fs.mkdirSync(path.join(root, 'docs')); fs.mkdirSync(path.join(root, 'scripts'));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), 'Quy tắc');
  fs.writeFileSync(path.join(root, 'GAME_SPEC.md'), 'CHỐT');
  fs.writeFileSync(path.join(root, '.gitignore'), 'logs/\n');
  fs.writeFileSync(path.join(root, 'docs/tasks.md'), document(config.tasks || tasks()));
  fs.writeFileSync(path.join(root, 'docs/progress.md'), '# Tiến độ\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: Object.fromEntries(['lint', 'typecheck', 'test', 'build', 'test:e2e'].map((s) => [s, s])) }));
  for (const name of ['auto-dev.ps1', 'verify.ps1', 'auto-dev.mjs', 'auto-dev-output.mjs', 'auto-dev-result.schema.json']) {
    fs.copyFileSync(path.join(project, 'scripts', name), path.join(root, 'scripts', name));
  }
  const git = async (args) => {
    const r = await runProcess('git', ['-c', 'user.name=Mock Tests', '-c', 'user.email=mock@example.invalid', ...args], { root, timeoutMs: 15_000 });
    assert.equal(r.code, 0, r.stderr); return r.stdout.trim();
  };
  await git(['init']); await git(['add', '.']); await git(['commit', '-m', 'fixture']);
  const calls = [], sessions = [];
  let gateCount = 0;
  const runner = async (command, args, options) => {
    calls.push({ command, args });
    if (command === 'git') {
      if (config.commitFails && args[0] === 'commit') return { code: 1, stdout: '', stderr: 'mock commit failure' };
      return runProcess(command, ['-c', 'user.name=Mock Tests', '-c', 'user.email=mock@example.invalid', ...args], options);
    }
    if (command === 'pnpm') {
      gateCount++;
      options.onOutput?.('stdout', Buffer.from(`mock ${args[0]}\n`));
      return { code: config.failGate?.(args[0], gateCount) ? 1 : 0, stdout: '', stderr: '' };
    }
    assert.equal(command, 'codex');
    if (args.includes('--help')) return { code: 0, stdout: args[0] === 'exec' ? (config.help || help) : '--ask-for-approval on-request --no-daemon', stderr: '' };
    sessions.push(args);
    options.onOutput?.('stdout', Buffer.from('{"type":"turn.started"}\n'));
    const id = /tác vụ (T\d{2})/.exec(options.input)[1];
    const relative = config.relative || `${id}.txt`;
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), `mock ${sessions.length}`);
    const result = { schemaVersion: 1, taskId: id, status: config.status || 'READY_FOR_VERIFY',
      summary: 'Đã làm trong mock', changedFiles: [relative], requiresE2E: false,
      blockers: config.status ? ['Chờ quyết định'] : [] };
    if (config.specChange) fs.appendFileSync(path.join(root, 'GAME_SPEC.md'), ' changed');
    if (config.extraFile) fs.writeFileSync(path.join(root, 'extra.txt'), 'unexpected');
    if (config.interrupt) config.interrupt.abort();
    fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], config.invalid ? 'not json' : JSON.stringify(result));
    return { code: config.exitCode || 0, stdout: '', stderr: '' };
  };
  return { root, calls, sessions, runner, git };
}

test('success: sequential tasks, independent gates, local verified checkpoints, safe CLI flags', async () => {
  const f = await fixture();
  const r = await orchestrate({ root: f.root, maxTasks: 2 }, f.runner);
  assert.equal(r.status, 'COMPLETE', r.reason); assert.equal(r.completed.length, 2);
  assert.equal(f.sessions.length, 2);
  assert.equal(await f.git(['status', '--porcelain']), '');
  assert.deepEqual(f.calls.filter((c) => c.command === 'pnpm').map((c) => c.args[0]), ['lint', 'typecheck', 'test', 'build', 'lint', 'typecheck', 'test', 'build']);
  assert.equal(roadmap(read(path.join(f.root, 'docs/tasks.md'))).ids.get('T02').status, 'DONE');
  for (const args of f.sessions) {
    assert.equal(args[args.indexOf('--sandbox') + 1], 'workspace-write');
    assert.equal(args[args.indexOf('--ask-for-approval') + 1], 'on-request');
    assert.ok(args.includes('--ignore-user-config'));
    assert.ok(args.includes('--no-daemon'));
    assert.ok(!args.some((s) => s.includes('bypass') || s === 'danger-full-access' || s === 'never'));
  }
  assert.ok(!f.calls.some((c) => c.command === 'git' && ['push', 'reset', 'clean'].includes(c.args[0])));
});

test('dry-run reads roadmap without sessions, edits or checkpoints', async () => {
  const f = await fixture(); const before = read(path.join(f.root, 'docs/tasks.md'));
  fs.writeFileSync(path.join(f.root, 'user.txt'), 'preserve');
  const r = await orchestrate({ root: f.root, dryRun: true }, f.runner);
  assert.equal(r.status, 'DRY_RUN'); assert.equal(r.nextTask.id, 'T01');
  assert.equal(r.preflight.clean, false); assert.equal(f.sessions.length, 0);
  assert.equal(read(path.join(f.root, 'docs/tasks.md')), before);
});

test('dirty tree refuses live run and preserves user changes', async () => {
  const f = await fixture(); fs.writeFileSync(path.join(f.root, 'user.txt'), 'preserve');
  const r = await orchestrate({ root: f.root }, f.runner);
  assert.equal(r.status, 'FAILED'); assert.equal(f.sessions.length, 0);
  assert.equal(read(path.join(f.root, 'user.txt')), 'preserve');
});

test('BLOCKED stops immediately, writes explicit status, never commits', async () => {
  const f = await fixture({ status: 'BLOCKED' }); const head = await f.git(['rev-parse', 'HEAD']);
  const r = await orchestrate({ root: f.root, maxTasks: 2 }, f.runner);
  assert.equal(r.status, 'BLOCKED'); assert.equal(f.sessions.length, 1);
  assert.equal(roadmap(read(path.join(f.root, 'docs/tasks.md'))).ids.get('T01').status, 'BLOCKED');
  assert.equal(await f.git(['rev-parse', 'HEAD']), head);
});

test('3 fix attempts maximum (4 sessions total), failed gates never checkpoint', async () => {
  const f = await fixture({ failGate: () => true }); const head = await f.git(['rev-parse', 'HEAD']);
  const r = await orchestrate({ root: f.root }, f.runner);
  assert.equal(r.status, 'FAILED'); assert.equal(f.sessions.length, 4);
  assert.equal(await f.git(['rev-parse', 'HEAD']), head);
  assert.equal(roadmap(read(path.join(f.root, 'docs/tasks.md'))).ids.get('T01').status, 'FAILED');
});

test('StopOnFailure stops on first failure; recovery reruns all gates', async () => {
  const first = await fixture({ failGate: () => true });
  const stopped = await orchestrate({ root: first.root, stopOnFailure: true }, first.runner);
  assert.equal(stopped.status, 'FAILED'); assert.equal(first.sessions.length, 1);
  const second = await fixture({ failGate: (_, n) => n === 1 });
  const recovered = await orchestrate({ root: second.root }, second.runner);
  assert.equal(recovered.status, 'COMPLETE', recovered.reason); assert.equal(second.sessions.length, 2);
  assert.deepEqual(second.calls.filter((c) => c.command === 'pnpm').map((c) => c.args[0]), ['lint', 'lint', 'typecheck', 'test', 'build']);
});

test('malformed result, nonzero session, undeclared files, immutable spec: fail closed', async () => {
  for (const config of [{ invalid: true }, { exitCode: 1 }, { extraFile: true }, { specChange: true }]) {
    const f = await fixture(config), head = await f.git(['rev-parse', 'HEAD']);
    const r = await orchestrate({ root: f.root }, f.runner);
    assert.equal(r.status, 'FAILED'); assert.equal(f.sessions.length, 1);
    assert.equal(await f.git(['rev-parse', 'HEAD']), head);
    assert.equal(f.calls.filter((c) => c.command === 'pnpm').length, 0);
  }
});

test('browser changes force E2E, irrespective of assistant flag', async () => {
  const f = await fixture({ relative: 'apps/web/new.txt' });
  const r = await orchestrate({ root: f.root }, f.runner);
  assert.equal(r.status, 'COMPLETE', r.reason);
  assert.ok(f.calls.some((c) => c.command === 'pnpm' && c.args[0] === 'test:e2e'));
});

test('missing CLI capability stops before worker', async () => {
  const f = await fixture({ help: '--sandbox' });
  assert.equal((await orchestrate({ root: f.root }, f.runner)).status, 'FAILED');
  assert.equal(f.sessions.length, 0);
});

test('active Git hooks and staged user edits refuse live execution', async () => {
  const f = await fixture();
  fs.writeFileSync(path.join(f.root, '.git/hooks/pre-commit'), '# mock hook');
  const r = await orchestrate({ root: f.root }, f.runner);
  assert.equal(r.status, 'FAILED'); assert.match(r.reason, /hook/); assert.equal(f.sessions.length, 0);
  const staged = await fixture(); fs.writeFileSync(path.join(staged.root, 'user.txt'), 'preserve');
  await staged.git(['add', 'user.txt']);
  assert.equal((await orchestrate({ root: staged.root }, staged.runner)).status, 'FAILED');
  assert.ok((await staged.git(['diff', '--cached', '--name-only'])).includes('user.txt'));
});

test('stale lock prevents sessions, and no-ready pending roadmap reports blocker', async () => {
  const f = await fixture(); fs.mkdirSync(path.join(f.root, 'logs'));
  fs.writeFileSync(path.join(f.root, 'logs/auto-dev.lock'), 'old owner');
  assert.equal((await orchestrate({ root: f.root }, f.runner)).status, 'FAILED');
  assert.equal(read(path.join(f.root, 'logs/auto-dev.lock')), 'old owner'); assert.equal(f.sessions.length, 0);
  const items = tasks(); items[0].status = 'BLOCKED'; const blocked = await fixture({ tasks: items });
  const r = await orchestrate({ root: blocked.root }, blocked.runner);
  assert.equal(r.status, 'BLOCKED'); assert.equal(blocked.sessions.length, 0);
});

test('finite total budget expires before sessions and invalid budgets reject', async () => {
  const f = await fixture();
  const slow = async (...args) => { await new Promise((resolve) => setTimeout(resolve, 10)); return f.runner(...args); };
  const r = await orchestrate({ root: f.root, maxMinutes: 0.0001 }, slow);
  assert.equal(r.status, 'FAILED'); assert.equal(f.sessions.length, 0);
  await assert.rejects(() => orchestrate({ root: f.root, maxTasks: Infinity }, f.runner), /Ngân sách/);
});

test('interrupted journal prevents automatic replay even after manual clean checkpoint', async () => {
  const controller = new AbortController(), f = await fixture({ interrupt: controller });
  const r = await orchestrate({ root: f.root, signal: controller.signal }, f.runner);
  assert.equal(r.status, 'INTERRUPTED');
  await f.git(['add', '.']); await f.git(['commit', '-m', 'manual review']);
  const second = await orchestrate({ root: f.root }, f.runner);
  assert.equal(second.status, 'FAILED'); assert.match(second.reason, /Lượt trước/); assert.equal(f.sessions.length, 1);
});

test('checkpoint failure preserves modifications, records FAILED and does not advance', async () => {
  const f = await fixture({ commitFails: true });
  const r = await orchestrate({ root: f.root, maxTasks: 2 }, f.runner);
  assert.equal(r.status, 'FAILED'); assert.equal(r.completed.length, 0); assert.equal(f.sessions.length, 1);
  assert.ok((await f.git(['status', '--porcelain'])).length);
});

test('dependency selection rejects cycles and unknown references; blocked cannot be selected', () => {
  const t = tasks(); t[0].status = 'BLOCKED'; assert.equal(nextTask(roadmap(document(t))), undefined);
  t[0].dependencies = ['T02']; assert.throws(() => roadmap(document(t)), /Chu kỳ/);
  t[0].dependencies = ['T99']; assert.throws(() => roadmap(document(t)), /không tồn tại/);
});

test('real roadmap registry retains intermediate range dependencies and business blockers', () => {
  const text = read(path.join(project, 'docs/tasks.md')), parsed = roadmap(text);
  const rows = text.split(/\r?\n/).filter((s) => /^\| (T\d{2}|A\d{2}|D\d{2}|P1-\d{2}) \|/.test(s))
    .map((s) => s.split('|').map((c) => c.trim()).slice(1, -1));
  const references = (s) => {
    const ids = [];
    for (const m of s.matchAll(/\b(T|A|D)(\d{2})(?:[\u2013-](?:\1)?(\d{2}))?/g)) {
      for (let n = Number(m[2]); n <= Number(m[3] || m[2]); n++) ids.push(m[1] + String(n).padStart(2, '0'));
    }
    return ids;
  };
  assert.equal(parsed.registry.tasks.length, rows.length);
  for (const row of rows.filter((r) => /^[TA]/.test(r[0]))) {
    const t = parsed.ids.get(row[0]);
    for (const dep of references(row[2])) assert.ok(t.dependencies.includes(dep), `${t.id} thiếu ${dep}`);
    if (t.id.startsWith('T')) for (const asset of references(row[3])) assert.ok(t.assets.includes(asset));
    for (const decision of rows.filter((r) => r[0].startsWith('D'))) {
      if (references(decision[2]).includes(t.id)) assert.ok(t.dependencies.includes(decision[0]));
    }
  }
  // Statuses are intentionally not frozen: future verified tasks and approved decisions can progress.
  const next = nextTask(parsed);
  if (next) assert.ok([...next.dependencies, ...next.assets].every((id) => parsed.ids.get(id).status === 'DONE'));
});

test('result schema rejects traversal, unknown keys and false completion', () => {
  const r = { schemaVersion: 1, taskId: 'T01', status: 'READY_FOR_VERIFY', summary: '', changedFiles: ['../escape'], requiresE2E: false, blockers: [] };
  assert.throws(() => validateResult(r, 'T01'), /Đường dẫn/);
  r.changedFiles = ['ok']; r.status = 'DONE'; assert.throws(() => validateResult(r, 'T01'), /schema/);
});

test('real subprocess timeout returns bounded failure; verification propagates timeout', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-timeout-'));
  const r = await runProcess('node', ['-e', 'setInterval(()=>{},1000)'], { root, timeoutMs: 150 });
  assert.equal(r.code, 124); assert.equal(r.timedOut, true);
  const v = await verify({ root, logDir: root, deadline: Date.now() - 1,
    runner: async () => ({ code: 124, timedOut: true }) });
  assert.equal(v.status, 'FAIL'); assert.equal(v.gates.length, 1);
});

test('Windows launcher regression: literal dash, quoted config, paths and raw UTF-8 stdin reach Node intact', async () => {
  if (process.platform !== 'win32') return;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg argv '));
  fs.writeFileSync(path.join(root, 'codex.ps1'), '$args | ConvertTo-Json\n');
  const pkg = path.join(root, 'node_modules/@openai/codex'); fs.mkdirSync(path.join(pkg, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: '@openai/codex', bin: { codex: 'bin/codex.js' } }));
  fs.writeFileSync(path.join(pkg, 'bin/codex.js'), "const fs=require('fs'); console.log(JSON.stringify({args:process.argv.slice(2),input:fs.readFileSync(0,'utf8')}));");
  const legacy = await runProcess('powershell', ['-NoProfile', '-File', path.join(root, 'codex.ps1'), 'exec', '--help', '-'], { root, timeoutMs: 15000 });
  assert.equal(legacy.code, 1); assert.match(legacy.stderr, /name/);
  const executable = resolveCommand('codex', { platform: 'win32', pathValue: root });
  assert.equal(executable.command, process.execPath); assert.deepEqual(executable.prefix, [path.join(pkg, 'bin/codex.js')]);
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = root + ';' + oldPath;
    const args = codexArguments({ root, resultPath: path.join(root, 'result with spaces.json') });
    const input = 'Kiểm thử nguyên văn\n"quotes" $() ` & <>\n';
    const result = await runProcess('codex', args, { root, input, timeoutMs: 15000, log: path.join(root, 'raw.jsonl') });
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { args, input });
    assert.equal(JSON.parse(read(path.join(root, 'raw.process.json'))).exitCode, 0);
    assert.equal(read(path.join(root, 'raw.stderr.log')), '');
  } finally { process.env.PATH = oldPath; }
});

test('unsupported npm shim fails closed; argument builder refuses unsafe sandbox', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-bad-cli-'));
  fs.writeFileSync(path.join(root, 'codex.ps1'), '# no installed package');
  assert.throws(() => resolveCommand('codex', { platform: 'win32', pathValue: root }), /metadata/);
  assert.throws(() => codexArguments({ root, sandbox: 'danger-full-access' }), /Sandbox/);
});

test('live JSON events handle split UTF-8, stderr, malformed/unknown JSON and trailing lines; raw events remain structured', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-events-'));
  const messages = [], structuredLog = path.join(root, 'events.jsonl');
  const observer = outputObserver({ codex: true, emit: (message) => messages.push(message), structuredLog });
  const data = Buffer.from('{"type":"item.started","item":{"type":"command_execution","command":"pnpm test"}}\n'
    + '{"type":"item.completed","item":{"type":"reasoning","text":"Kiểm chứng"}}\n');
  for (const byte of data) observer.write('stdout', Buffer.from([byte]));
  observer.write('stderr', Buffer.from('actual error\n'));
  observer.write('stdout', Buffer.from('bad json\nnull\n{"type":"future.event"}\n'
    + '{"type":"turn.failed","error":{"message":"backend error"}}\n'
    + '{"type":"item.completed","item":{"type":"command_execution","command":"pnpm test","exit_code":1}}'));
  observer.end(); observer.end();
  assert.ok(messages.some((s) => s.includes('pnpm test')));
  assert.ok(messages.some((s) => s.includes('Kiểm chứng')));
  assert.ok(messages.some((s) => s.includes('stderr: actual error')));
  assert.ok(messages.some((s) => s.includes('stdout không phải JSON: bad json')));
  assert.ok(messages.some((s) => s.includes('future.event')));
  assert.ok(messages.some((s) => s.includes('backend error')));
  assert.ok(messages.some((s) => s.includes('exit 1')));
  assert.ok(!messages.some((s) => s.includes('DONE') || s.includes('PASS')));
  const lines = read(structuredLog).trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 8); assert.equal(lines[2].channel, 'stderr'); assert.equal(lines[3].kind, 'invalid_json');
  assert.equal(lines[4].kind, 'invalid_event');
});

test('gate live output is concise while routine stdout remains in structured logs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-gate-output-'));
  const messages = [], structuredLog = path.join(root, 'gate.events.jsonl');
  const observer = outputObserver({ emit: (m) => messages.push(m), structuredLog });
  observer.write('stdout', Buffer.from('cache hit\npackage chatter\n# tests 24\n# pass 24\nnot ok 1 - failure\n'));
  observer.write('stderr', Buffer.from('actual diagnostic\n')); observer.end();
  assert.equal(messages.length, 4);
  assert.ok(messages.some((m) => m.includes('# pass 24')));
  assert.ok(messages.some((m) => m.includes('actual diagnostic')));
  assert.equal(read(structuredLog).trim().split('\n').length, 6);
});

test('oversized event line is bounded, logged and followed by recoverable valid event', () => {
  const messages = [], observer = outputObserver({ codex: true, emit: (m) => messages.push(m) });
  observer.write('stdout', Buffer.from('x'.repeat(130_000) + '\n{"type":"turn.started"}\n')); observer.end();
  assert.equal(messages.length, 2); assert.match(messages[0], /quá dài/); assert.match(messages[1], /bắt đầu/);
});

test('progress reports retries and test exit codes without changing summary or granting completion on gate failure', async () => {
  const f = await fixture({ failGate: () => true }), events = [];
  const r = await orchestrate({ root: f.root, progress: (e) => events.push(e) }, f.runner);
  assert.equal(r.status, 'FAILED'); assert.deepEqual(r.completed, []);
  assert.ok(events.some((e) => e.taskId === 'T01' && e.attempt === 3 && e.message.includes('phiên sửa')));
  assert.ok(events.some((e) => e.message.includes('pnpm lint: exit 1')));
  assert.ok(!events.some((e) => e.message.includes('checkpoint local')));
  const lines = [], render = terminalProgress((line) => lines.push(line), Date.now() - 2000);
  render({ taskId: 'T03', attempt: 1, message: 'actual\u001b[31m event\n' });
  assert.match(lines[0], /^\[0:0[2-9]\]\[T03\]\[sửa 1\/3\]/); assert.ok(!lines[0].includes('\u001b'));
});

test('real process streams stdout/stderr separately, records exit code and cancellation', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-process-'));
  const seen = [], log = path.join(root, 'session.jsonl');
  const r = await runProcess('node', ['-e', 'console.log(JSON.stringify({type:"turn.started"})); console.error("actual stderr"); process.exitCode=7'],
    { root, timeoutMs: 15000, log, onOutput: (channel, data) => seen.push({ channel, text: data.toString() }) });
  assert.equal(r.code, 7); assert.equal(r.exitCode, 7);
  assert.ok(seen.some((s) => s.channel === 'stderr' && s.text.includes('actual stderr')));
  assert.equal(JSON.parse(read(log)).type, 'turn.started'); assert.match(read(path.join(root, 'session.stderr.log')), /actual stderr/);
  const controller = new AbortController(); setTimeout(() => controller.abort(), 200);
  const cancelled = await runProcess('node', ['-e', 'setInterval(()=>{},1000)'], { root, timeoutMs: 5000, signal: controller.signal });
  assert.equal(cancelled.code, 130); assert.equal(cancelled.interrupted, true);
});

test('Live renders timestamps/colors without changing plain mode or leaking terminal control codes', () => {
  const lines = [], time = Date.parse('2026-10-08T10:00:03Z');
  const render = terminalProgress((line) => lines.push(line), time - 3000, { live: true, color: true, now: () => time });
  render({ taskId: 'T03', attempt: 2, kind: 'file', message: 'File update: src/test.ts' });
  assert.ok(lines[0].includes('[2026-10-08T10:00:03.000Z][0:03][T03][sửa 2/3]'));
  assert.ok(lines[0].startsWith(String.fromCharCode(27) + '[33m'));
  const plain = [];
  terminalProgress((line) => plain.push(line), time, { live: true, color: false, now: () => time })({ message: 'Observed' });
  assert.ok(!plain[0].includes(String.fromCharCode(27)));
});

test('Live file changes, tool output deltas, asset tools and exposed reasoning are emitted immediately', () => {
  const events = [], observer = outputObserver({ codex: true, live: true, emit: (message, kind) => events.push({ message, kind }) });
  const send = (item, type = 'item.completed') => observer.write('stdout', Buffer.from(JSON.stringify({ type, item }) + '\n'));
  send({ type: 'file_change', status: 'completed', changes: [{ path: 'src/a.ts', kind: 'update' }] });
  assert.equal(events.length, 1); // Already visible before observer.end/process exit.
  send({ id: 'tool1', type: 'command_execution', command: 'pnpm test', aggregated_output: 'first line\n' }, 'item.updated');
  send({ id: 'tool1', type: 'command_execution', command: 'pnpm test', exit_code: 0, aggregated_output: 'first line\n25 passed\n' });
  assert.equal(events.filter((e) => e.message === 'Tool output: first line').length, 1);
  assert.ok(events.some((e) => e.message.includes('25 passed')));
  send({ type: 'mcp_tool_call', server: 'image_gen', tool: 'imagegen', status: 'completed', result: { content: [{ type: 'text', text: 'artifact: asset.png' }] } });
  send({ type: 'command_execution', command: 'python route_media.py image', status: 'in_progress' }, 'item.started');
  assert.equal(events.filter((e) => e.kind === 'asset').length, 2);
  assert.ok(events.some((e) => e.message.includes('artifact: asset.png')));
  send({ type: 'reasoning', text: 'Exposed CLI summary' });
  send({ type: 'reasoning', encrypted_content: 'HIDDEN_SENTINEL', internal_reasoning: 'HIDDEN_TEXT' });
  send({ type: 'command_execution', command: 'rg image_gen scripts/', status: 'completed', exit_code: 0 });
  observer.end();
  assert.equal(events.filter((e) => e.kind === 'asset').length, 2); // Searches are not generation events.
  assert.ok(events.some((e) => e.kind === 'reasoning' && e.message.includes('Exposed CLI summary')));
  assert.ok(!JSON.stringify(events).includes('HIDDEN_'));
});

test('real process streaming is observed before exit and preserves mock JSONL/stderr despite malformed events', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-live-stream-'));
  const messages = [], observer = outputObserver({ codex: true, live: true, emit: (message) => messages.push(message) });
  let exited = false, firstResolve;
  const first = new Promise((resolve) => { firstResolve = resolve; });
  const pending = runProcess('node', ['-e', 'console.log(JSON.stringify({type:"turn.started"})); console.error("stderr live"); console.log("invalid json"); setTimeout(()=>process.exit(9),1500)'],
    { root, timeoutMs: 10000, log: path.join(root, 'session.jsonl'), onOutput(channel, data) {
      observer.write(channel, data); if (messages.length) firstResolve();
    } }).then((r) => { exited = true; return r; });
  await first;
  assert.equal(exited, false); assert.ok(messages.length > 0);
  const result = await pending; observer.end();
  assert.equal(result.code, 9); assert.ok(messages.some((m) => m.includes('stderr live')));
  assert.ok(messages.some((m) => m.includes('stdout không phải JSON')));
  assert.match(read(path.join(root, 'session.jsonl')), /invalid json/);
  assert.equal(JSON.parse(read(path.join(root, 'session.process.json'))).code, 9);
});

test('Ctrl+C handler aborts once, preserves interrupted journal and prevents checkpoint/next task in Live', async () => {
  const signals = new EventEmitter(), messages = [];
  const cancel = cancellationController((e) => messages.push(e), signals);
  const f = await fixture({ interrupt: { abort() { signals.emit('SIGINT'); signals.emit('SIGINT'); } } });
  try {
    const result = await orchestrate({ root: f.root, live: true, maxTasks: 2, signal: cancel.controller.signal,
      progress: (e) => messages.push(e) }, f.runner);
    assert.equal(result.status, 'INTERRUPTED'); assert.deepEqual(result.completed, []); assert.equal(f.sessions.length, 1);
    assert.equal(JSON.parse(read(path.join(f.root, 'logs/auto-dev-state.json'))).status, 'INTERRUPTED');
    assert.equal(messages.filter((e) => e.message.includes('Nhận tín hiệu dừng')).length, 1);
  } finally { cancel.dispose(); }
  assert.equal(signals.listenerCount('SIGINT'), 0);
});

test('Live sequential task gates and confirmed file events retain bounded retries and safe CLI policy', async () => {
  const f = await fixture(), events = [];
  const result = await orchestrate({ root: f.root, live: true, maxTasks: 2, progress: (e) => events.push(e) }, f.runner);
  assert.equal(result.status, 'COMPLETE'); assert.equal(result.completed.length, 2);
  assert.ok(events.some((e) => e.kind === 'file' && e.message.includes('T01.txt')));
  for (const args of f.sessions) {
    assert.ok(args.includes('--json'));
    assert.equal(args[args.indexOf('--sandbox') + 1], 'workspace-write');
    assert.equal(args[args.indexOf('--ask-for-approval') + 1], 'on-request');
  }
});

test('Live stream timeout preserves observed events and process metadata without inventing completion', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mmorpg-live-timeout-'));
  const messages = [], observer = outputObserver({ codex: true, live: true, emit: (m) => messages.push(m) });
  const result = await runProcess('node', ['-e', 'console.log(JSON.stringify({type:"turn.started"})); setInterval(()=>{},1000)'],
    { root, timeoutMs: 500, log: path.join(root, 'session.jsonl'), onOutput: observer.write });
  observer.end();
  assert.equal(result.code, 124); assert.equal(result.timedOut, true);
  assert.ok(messages.some((m) => m.includes('bắt đầu')));
  assert.ok(!messages.some((m) => m.includes('kết thúc') || m.includes('PASS')));
  assert.equal(JSON.parse(read(path.join(root, 'session.process.json'))).timedOut, true);
});
