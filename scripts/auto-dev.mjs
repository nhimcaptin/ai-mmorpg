import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const START = '<!-- AUTO_DEV_TASKS_START -->';
const END = '<!-- AUTO_DEV_TASKS_END -->';
const read = (p) => fs.readFileSync(p, 'utf8');
const writeJson = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
const digest = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const fail = (message) => { throw new Error(message); };
const protectedNames = ['GAME_SPEC.md', 'AGENTS.md', 'docs/tasks.md', 'docs/progress.md',
  'scripts/auto-dev.ps1', 'scripts/verify.ps1', 'scripts/auto-dev.mjs',
  'scripts/auto-dev-result.schema.json', '.gitignore'];

export function roadmap(text) {
  const a = text.indexOf(START), b = text.indexOf(END);
  if (a < 0 || b < a || text.indexOf(START, a + 1) >= 0) fail('Thiếu/nhân đôi registry AUTO_DEV_TASKS.');
  const block = text.slice(a + START.length, b).trim();
  if (!block.startsWith('```json\n') || !block.endsWith('```')) fail('Registry phải là JSON fence.');
  const registry = JSON.parse(block.slice(8, -3));
  if (registry.version !== 1 || !Array.isArray(registry.tasks)) fail('Registry không hợp lệ.');
  const ids = new Map();
  for (const t of registry.tasks) {
    if (!/^(T\d{2}|A\d{2}|D\d{2}|P1-\d{2})$/.test(t.id) || ids.has(t.id)
      || !['TODO', 'DOING', 'DONE', 'BLOCKED', 'FAILED'].includes(t.status)
      || !Array.isArray(t.dependencies) || !Array.isArray(t.assets)
      || typeof t.e2e !== 'boolean' || !['task', 'asset', 'decision'].includes(t.kind)) fail('Task metadata không hợp lệ: ' + t.id);
    const row = text.split(/\r?\n/).find((line) => line.startsWith(`| ${t.id} |`));
    if (!row) fail('Không có tiêu chí trong bảng: ' + t.id);
    const columns = row.split('|').map((s) => s.trim()).slice(1, -1);
    t.title = columns[1]; t.acceptance = columns.at(-1);
    ids.set(t.id, t);
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (!ids.has(id)) fail('Phụ thuộc không tồn tại: ' + id);
    if (visiting.has(id)) fail('Chu kỳ phụ thuộc: ' + id);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of [...ids.get(id).dependencies, ...ids.get(id).assets]) visit(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const id of ids.keys()) visit(id);
  return { registry, ids, a, b };
}

export function nextTask(parsed) {
  return parsed.registry.tasks.find((t) => t.kind !== 'decision' && t.status === 'TODO'
    && [...t.dependencies, ...t.assets].every((id) => parsed.ids.get(id).status === 'DONE'));
}

function updateTask(root, id, status, evidence) {
  const p = path.join(root, 'docs/tasks.md'), text = read(p), parsed = roadmap(text);
  parsed.ids.get(id).status = status;
  const tasks = parsed.registry.tasks.map((t) => ({ id: t.id, kind: t.kind, status: t.status,
    dependencies: t.dependencies, assets: t.assets, e2e: t.e2e }));
  fs.writeFileSync(p, text.slice(0, parsed.a) + START + '\n```json\n'
    + JSON.stringify({ version: 1, tasks }, null, 2) + '\n```\n' + text.slice(parsed.b));
  fs.appendFileSync(path.join(root, 'docs/progress.md'),
    `\n### Auto-dev ${new Date().toISOString()} — ${id}: ${status}\n\n${evidence}\n`);
}

function findExecutable(name) {
  if (process.platform !== 'win32') return { command: name, prefix: [] };
  const dirs = (process.env.PATH || '').split(';');
  // Invoke trusted npm launchers through PowerShell argument arrays, never cmd string interpolation.
  for (const dir of dirs) {
    for (const ext of ['.exe', '.ps1']) {
      const candidate = path.join(dir, name + ext);
      if (fs.existsSync(candidate)) return ext === '.exe' ? { command: candidate, prefix: [] }
        : { command: 'powershell.exe', prefix: ['-NoProfile', '-File', candidate] };
    }
  }
  fail(`Không tìm thấy ${name}.exe hoặc ${name}.ps1 trong PATH; không cài tự động.`);
}

export function runProcess(command, args, { root, timeoutMs, input = '', signal, log } = {}) {
  if (timeoutMs <= 0) return Promise.resolve({ code: 124, stdout: '', stderr: 'Hết thời gian', timedOut: true });
  const executable = findExecutable(command);
  return new Promise((resolve) => {
    let stdout = '', stderr = '', timedOut = false, interrupted = false, settled = false, killTimer;
    const output = log ? fs.createWriteStream(log, { flags: 'a' }) : null;
    const child = spawn(executable.command, [...executable.prefix, ...args], {
      cwd: root, shell: false, windowsHide: true, detached: process.platform !== 'win32',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    function stop() {
      if (!child.pid) return;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        killer.on('error', () => child.kill());
        killTimer = setTimeout(() => { child.kill(); finish(124, 'Không xác nhận đóng cây tiến trình; phải kiểm tra thủ công.'); }, 5000);
      }
      else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already ended. */ }
        killTimer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already ended. */ } }, 1000);
      }
    }
    const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
    const abort = () => { interrupted = true; stop(); };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.stdout.on('data', (data) => { stdout = (stdout + data).slice(-2_000_000); output?.write(data); });
    child.stderr.on('data', (data) => { stderr = (stderr + data).slice(-2_000_000); output?.write(data); });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
    function finish(code, error) {
      if (settled) return; settled = true;
      clearTimeout(timer); clearTimeout(killTimer); signal?.removeEventListener('abort', abort); output?.end();
      resolve({ code: interrupted ? 130 : timedOut ? 124 : code ?? 1,
        stdout, stderr: error ? String(error) : stderr, timedOut, interrupted });
    }
    child.on('error', (error) => finish(1, error));
    child.on('close', (code) => finish(code));
  });
}

export async function verify({ root, e2e = false, deadline, runner = runProcess, signal, logDir }) {
  const gates = [];
  for (const script of ['lint', 'typecheck', 'test', 'build', ...(e2e ? ['test:e2e'] : [])]) {
    const result = await runner('pnpm', [script], { root, signal, timeoutMs: deadline - Date.now(),
      log: path.join(logDir, script.replace(':', '-') + '.log') });
    gates.push({ command: `pnpm ${script}`, code: result.code, timedOut: !!result.timedOut, interrupted: !!result.interrupted });
    if (result.code !== 0) break;
  }
  const result = { status: gates.every((g) => g.code === 0) && gates.length === (e2e ? 5 : 4) ? 'PASS' : 'FAIL', gates };
  writeJson(path.join(logDir, 'verification.json'), result);
  return result;
}

export function validateResult(value, taskId) {
  const keys = ['schemaVersion', 'taskId', 'status', 'summary', 'changedFiles', 'requiresE2E', 'blockers'];
  if (!value || keys.some((k) => !(k in value)) || Object.keys(value).some((k) => !keys.includes(k))
    || value.schemaVersion !== 1 || value.taskId !== taskId
    || !['READY_FOR_VERIFY', 'BLOCKED', 'FAILED'].includes(value.status)
    || typeof value.summary !== 'string' || typeof value.requiresE2E !== 'boolean'
    || !Array.isArray(value.changedFiles) || !Array.isArray(value.blockers)
    || [...value.changedFiles, ...value.blockers].some((s) => typeof s !== 'string')
    || (value.status === 'READY_FOR_VERIFY' && (!value.changedFiles.length || value.blockers.length))
    || (value.status !== 'READY_FOR_VERIFY' && !value.blockers.length)) fail('Kết quả phiên sai schema/ID/trạng thái.');
  for (const p of value.changedFiles) {
    if (!p || p.includes('\\') || path.isAbsolute(p) || /^[A-Za-z]:/.test(p)
      || p.split('/').some((s) => s === '..' || s === '.' || s === '')
      || /^(\.git|logs)(\/|$)/.test(p)) fail('Đường dẫn kết quả không an toàn: ' + p);
  }
  return value;
}

const promptFor = (task, previous) => `Bạn thực hiện đúng MỘT tác vụ ${task.id}: ${task.title}.
Đọc AGENTS.md, GAME_SPEC.md, docs/tasks.md, docs/progress.md và code trước khi sửa.
Nghiệm thu: ${task.acceptance}
Phụ thuộc đã DONE: ${[...task.dependencies, ...task.assets].join(', ')}.
Giữ GAME_SPEC.md bất biến, không thay CHỐT/đặt luật nghiệp vụ. Nếu cần quyết định, trả BLOCKED.
Không sửa docs/tasks.md, docs/progress.md, AGENTS.md, .gitignore, scripts/auto-dev*, scripts/verify.ps1.
Không commit/stage/push/deploy, không cài dependency/script, sửa secrets, tắt test hay chạy lệnh phá hủy.
Không thay các lệnh lint/typecheck/test/build/test:e2e hoặc cấu hình nhằm bỏ kiểm tra.
Không nâng sandbox/approval, không gọi Codex lồng nhau. Nếu cần quyền hoặc môi trường thiếu: BLOCKED.
Task phải nhỏ và độc lập nghiệm thu; nếu cần tách hoặc duyệt mỹ thuật: BLOCKED, không làm cả gói.
Asset: đọc .agents/skills/generate2dsprite/SKILL.md và generate2dmap/SKILL.md khi phù hợp;
dùng backend được skill ghi nhận, kiểm định output trước tích hợp; backend lỗi thì BLOCKED,
không placeholder, không đổi API trả phí. Không sinh asset nếu không cần.
Chỉ sửa phạm vi task, không ghi đè thay đổi khác. Bộ điều phối tự chạy quality gates và ghi tiến độ.
Trả JSON theo schema: READY_FOR_VERIFY (chưa phải DONE), BLOCKED hoặc FAILED;
changedFiles liệt kê toàn bộ file sửa/tạo/xóa với đường dẫn tương đối slash; summary/blockers tiếng Việt.
Kết quả kiểm chứng lượt trước: ${JSON.stringify(previous || null)}.`;

export async function orchestrate(options, runner = runProcess) {
  const { root, dryRun = false, maxTasks = 1, maxMinutes = 30, stopOnFailure = false, signal } = options;
  if (!Number.isInteger(maxTasks) || maxTasks < 1 || maxTasks > 100
    || !Number.isFinite(maxMinutes) || maxMinutes <= 0 || maxMinutes > 240) fail('Ngân sách phải hữu hạn và hợp lệ.');
  const deadline = Date.now() + maxMinutes * 60_000;
  const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID();
  const logDir = path.join(root, 'logs', 'auto-dev', runId);
  fs.mkdirSync(logDir, { recursive: true });
  const stateFile = path.join(root, 'logs', 'auto-dev-state.json');
  const lockFile = path.join(root, 'logs', 'auto-dev.lock');
  const summary = { runId, status: 'STARTING', dryRun, completed: [], taskId: null, attempt: 0, logDir };
  let lock, currentTask, workerStarted = false, baseline;
  const save = () => { writeJson(path.join(logDir, 'summary.json'), summary); if (!dryRun && lock !== undefined) writeJson(stateFile, summary); };
  const invoke = (command, args, extra = {}) => runner(command, args,
    { root, signal, timeoutMs: deadline - Date.now(), ...extra });
  const git = async (args) => {
    const r = await invoke('git', args);
    if (r.code !== 0) fail('Git thất bại: ' + args[0] + ': ' + r.stderr);
    return r.stdout.trim();
  };
  const changes = async () => {
    const tracked = (await git(['diff', '--name-only', '-z', 'HEAD'])).split('\0').filter(Boolean);
    const untracked = (await git(['ls-files', '--others', '--exclude-standard', '-z'])).split('\0').filter(Boolean);
    return [...new Set([...tracked, ...untracked])].sort();
  };
  try {
    const help = await invoke('codex', ['exec', '--help']);
    const rootHelp = await invoke('codex', ['--help']);
    if (help.code !== 0 || rootHelp.code !== 0) fail('Codex CLI help không chạy được.');
    for (const flag of ['--sandbox', '--ignore-user-config', '--output-schema', '--json', '--output-last-message', '--cd']) {
      if (!help.stdout.includes(flag)) fail('Codex thiếu cờ bắt buộc: ' + flag);
    }
    if (!rootHelp.stdout.includes('--ask-for-approval') || !rootHelp.stdout.includes('on-request')) fail('Codex thiếu approval on-request.');
    if (!rootHelp.stdout.includes('--no-daemon')) fail('Codex thiếu --no-daemon để quản lý vòng đời tiến trình phiên.');
    fs.writeFileSync(path.join(logDir, 'codex-exec-help.txt'), help.stdout);
    const parsed = roadmap(read(path.join(root, 'docs/tasks.md')));
    const next = nextTask(parsed);
    summary.blockedTasks = parsed.registry.tasks.filter((t) => t.status === 'TODO' || t.status === 'BLOCKED')
      .map((t) => ({ taskId: t.id, status: t.status,
        waitingFor: [...t.dependencies, ...t.assets].filter((id) => parsed.ids.get(id).status !== 'DONE') }));
    const dirty = await git(['status', '--porcelain']);
    const headResult = await invoke('git', ['rev-parse', '--verify', 'HEAD']);
    summary.preflight = { clean: dirty === '', hasHead: headResult.code === 0 };
    if (dryRun) {
      summary.status = 'DRY_RUN'; summary.nextTask = next || null;
      summary.launchBlockers = [...(dirty ? ['Git còn thay đổi người dùng; cần checkpoint thủ công.'] : []),
        ...(headResult.code !== 0 ? ['Chưa có commit nền HEAD.'] : []),
        ...(fs.existsSync(lockFile) ? ['Có lock cần kiểm tra.'] : [])];
      save(); return summary;
    }
    if (dirty || headResult.code !== 0) fail('Yêu cầu Git sạch và commit HEAD; không stage/ghi đè thay đổi người dùng.');
    if (await git(['check-ignore', 'logs/auto-dev-probe.log']) !== 'logs/auto-dev-probe.log') fail('logs/ chưa được Git ignore.');
    if (fs.existsSync(stateFile)) {
      const previous = JSON.parse(read(stateFile));
      if (!['COMPLETE', 'NO_READY_TASK'].includes(previous.status)) fail('Lượt trước chưa kết thúc thành công; xem journal và xử lý thủ công trước khi chạy lại.');
    }
    if (parsed.registry.tasks.some((t) => t.status === 'DOING' || t.status === 'FAILED')) fail('Có task DOING/FAILED cần xử lý thủ công.');
    // Local commit must not trigger arbitrary hooks that could push/deploy or mutate files.
    const hooksPath = path.resolve(root, await git(['rev-parse', '--git-path', 'hooks']));
    if (fs.existsSync(hooksPath) && fs.readdirSync(hooksPath).some((name) => !name.endsWith('.sample'))) fail('Có Git hook tùy chỉnh; cần kiểm tra thủ công, không tự chạy/bypass hook.');
    lock = fs.openSync(lockFile, 'wx'); fs.writeSync(lock, JSON.stringify({ pid: process.pid, runId }));
    save();
    for (let count = 0; count < maxTasks; count++) {
      if (signal?.aborted || Date.now() >= deadline) fail(signal?.aborted ? 'INTERRUPTED' : 'Hết MaxMinutes.');
      currentTask = nextTask(roadmap(read(path.join(root, 'docs/tasks.md'))));
      if (!currentTask) {
        const pending = roadmap(read(path.join(root, 'docs/tasks.md'))).registry.tasks.filter((t) => t.status !== 'DONE');
        summary.status = pending.length ? 'BLOCKED' : 'NO_READY_TASK';
        if (pending.length) summary.reason = 'Không có task đủ phụ thuộc; cần quyết định/phụ thuộc được xử lý.';
        break;
      }
      summary.taskId = currentTask.id;
      const baselineHead = await git(['rev-parse', 'HEAD']);
      baseline = new Map(protectedNames.map((p) => [p, digest(path.join(root, p))]));
      const baselineScripts = JSON.parse(read(path.join(root, 'package.json'))).scripts;
      async function guard() {
        for (const [p, hash] of baseline) if (!fs.existsSync(path.join(root, p)) || digest(path.join(root, p)) !== hash) fail('File được bảo vệ bị thay đổi: ' + p);
        if (await git(['rev-parse', 'HEAD']) !== baselineHead || await git(['diff', '--cached', '--name-only'])) fail('Worker thay HEAD/index.');
        const scripts = JSON.parse(read(path.join(root, 'package.json'))).scripts;
        for (const s of ['lint', 'typecheck', 'test', 'build', 'test:e2e']) if (scripts[s] !== baselineScripts[s]) fail('Worker thay quality gate: ' + s);
      }
      let previous, success = false;
      for (let attempt = 0; attempt <= 3; attempt++) {
        summary.attempt = attempt; summary.status = 'RUNNING'; save();
        const attemptDir = path.join(logDir, `${currentTask.id}-${attempt}`); fs.mkdirSync(attemptDir);
        const resultPath = path.join(attemptDir, 'result.json');
        const args = ['--no-daemon', '--ask-for-approval', 'on-request', 'exec', '--ignore-user-config',
          '--sandbox', 'workspace-write', '-c', 'approval_policy="on-request"', '-c', 'sandbox_workspace_write.network_access=false',
          '--cd', root, '--output-schema', path.join(root, 'scripts/auto-dev-result.schema.json'),
          '--json', '--output-last-message', resultPath, '-'];
        workerStarted = true;
        const session = await invoke('codex', args, { input: promptFor(currentTask, previous), log: path.join(attemptDir, 'session.jsonl') });
        await guard();
        if (session.code !== 0) fail(`Codex exit ${session.code}; không có checkpoint.`);
        const result = validateResult(JSON.parse(read(resultPath)), currentTask.id);
        const changed = await changes();
        if (JSON.stringify(changed) !== JSON.stringify([...new Set(result.changedFiles)].sort())) fail('changedFiles không khớp Git diff.');
        for (const p of changed) {
          const absolute = path.join(root, p);
          if (fs.existsSync(absolute) && fs.lstatSync(absolute).isSymbolicLink()) fail('Không tự checkpoint symlink: ' + p);
          if (/^(\.env($|\.)|.*\/\.env($|\.))/.test(p) && !p.endsWith('.env.example')) fail('Worker thay file secrets.');
        }
        if (result.status !== 'READY_FOR_VERIFY') {
          summary.status = result.status; summary.reason = result.blockers.join('; ');
          updateTask(root, currentTask.id, result.status === 'BLOCKED' ? 'BLOCKED' : 'FAILED', summary.reason);
          save(); return summary;
        }
        const e2e = currentTask.e2e || result.requiresE2E || changed.some((p) => /^(apps\/web\/|assets\/|packages\/(shared|game-core)\/|tests\/e2e\/|playwright)/.test(p)
          || p === 'apps/server/src/world-room.ts');
        summary.status = 'VERIFYING'; save();
        previous = await verify({ root, e2e, deadline, runner, signal, logDir: attemptDir });
        await guard();
        if (previous.status === 'FAIL') {
          if (signal?.aborted || Date.now() >= deadline || stopOnFailure || attempt === 3) fail('Verification thất bại; dừng, không checkpoint.');
          continue;
        }
        if (JSON.stringify(await changes()) !== JSON.stringify(changed)) fail('Verification thay đổi file nguồn ngoài diff phiên.');
        updateTask(root, currentTask.id, 'DONE', `${result.summary}\n\nGate: ${previous.gates.map((g) => `${g.command} exit ${g.code}`).join(', ')}. Log: logs/auto-dev/${runId}/${currentTask.id}-${attempt}/verification.json. Kết quả checkpoint local xem summary.json của lượt chạy.`);
        await git(['add', '--', ...changed, 'docs/tasks.md', 'docs/progress.md']);
        await git(['commit', '-m', `chore(auto-dev): complete ${currentTask.id}`]);
        const commit = await git(['rev-parse', 'HEAD']);
        if (await git(['status', '--porcelain'])) fail('Git không sạch sau checkpoint; dừng.');
        summary.completed.push({ taskId: currentTask.id, commit, attempt, gates: previous.gates });
        summary.status = 'COMPLETE'; save(); success = true; workerStarted = false;
        break;
      }
      if (!success) fail('Hết retry budget.');
    }
    if (summary.status === 'STARTING') summary.status = 'NO_READY_TASK';
    save(); return summary;
  } catch (error) {
    summary.status = signal?.aborted ? 'INTERRUPTED' : 'FAILED'; summary.reason = error.message;
    // Leave worker changes untouched. Never restore or reset protected/user files.
    if (workerStarted && currentTask) {
      summary.recovery = 'Xem diff/journal; sửa trạng thái và checkpoint thủ công. Không tự chạy lại.';
      if (baseline && [...baseline].every(([p, hash]) => fs.existsSync(path.join(root, p)) && digest(path.join(root, p)) === hash)) {
        updateTask(root, currentTask.id, 'FAILED', `${summary.status}: ${summary.reason}. Không checkpoint; log logs/auto-dev/${runId}/summary.json.`);
      }
    }
    save(); return summary;
  } finally {
    if (lock !== undefined) { fs.closeSync(lock); fs.unlinkSync(lockFile); }
  }
}

async function main() {
  const args = process.argv.slice(2), mode = args.shift();
  const get = (key, fallback) => { const i = args.indexOf(key); return i < 0 ? fallback : args[i + 1]; };
  const root = path.resolve(get('--root', process.cwd()));
  const maxMinutes = Number(get('--max-minutes', '30'));
  const controller = new AbortController();
  process.once('SIGINT', () => controller.abort()); process.once('SIGTERM', () => controller.abort());
  let result;
  if (mode === 'verify') {
    if (!Number.isInteger(maxMinutes) || maxMinutes < 1 || maxMinutes > 240) fail('MaxMinutes không hợp lệ.');
    const logDir = path.join(root, 'logs', 'verify', new Date().toISOString().replace(/[:.]/g, '-'));
    fs.mkdirSync(logDir, { recursive: true });
    result = await verify({ root, e2e: args.includes('--e2e'), deadline: Date.now() + maxMinutes * 60_000, logDir, signal: controller.signal });
    result.logDir = logDir;
  } else if (mode === 'auto') result = await orchestrate({ root, maxMinutes,
    maxTasks: Number(get('--max-tasks', '1')), dryRun: args.includes('--dry-run'),
    stopOnFailure: get('--stop-on-failure', 'false') === 'true', signal: controller.signal });
  else fail('Mode phải là auto hoặc verify.');
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = ['PASS', 'COMPLETE', 'DRY_RUN', 'NO_READY_TASK'].includes(result.status) ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
