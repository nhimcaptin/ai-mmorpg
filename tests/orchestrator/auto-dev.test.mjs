import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { orchestrate, roadmap, nextTask, runProcess, validateResult, verify } from '../../scripts/auto-dev.mjs';

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
  for (const name of ['auto-dev.ps1', 'verify.ps1', 'auto-dev.mjs', 'auto-dev-result.schema.json']) {
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
      return { code: config.failGate?.(args[0], gateCount) ? 1 : 0, stdout: '', stderr: '' };
    }
    assert.equal(command, 'codex');
    if (args.includes('--help')) return { code: 0, stdout: args[0] === 'exec' ? (config.help || help) : '--ask-for-approval on-request --no-daemon', stderr: '' };
    sessions.push(args);
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
