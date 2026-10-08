import fs from 'node:fs';
import { StringDecoder } from 'node:string_decoder';
import { stripVTControlCharacters } from 'node:util';

export const concise = (value, limit = 240) => [...stripVTControlCharacters(String(value))]
  .filter((c) => c.codePointAt(0) >= 32 && c.codePointAt(0) !== 127).join('').slice(0, limit);

export function terminalProgress(sink = (line) => process.stderr.write(line + '\n'), startedAt = Date.now(),
  { live = false, color = !!process.stderr.isTTY && !('NO_COLOR' in process.env), now = Date.now } = {}) {
  const colors = { activity: 36, tool: 34, result: 32, file: 33, asset: 35, error: 31, reasoning: 90 };
  return ({ taskId = '-', attempt = 0, message, kind = 'activity' }) => {
    const time = now(), seconds = Math.max(0, Math.floor((time - startedAt) / 1000));
    const elapsed = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    const line = `${live ? `[${new Date(time).toISOString()}]` : ''}[${elapsed}][${concise(taskId, 40)}][sửa ${attempt}/3] ${concise(message)}`;
    sink(live && color ? `${String.fromCharCode(27)}[${colors[kind] || 36}m${line}${String.fromCharCode(27)}[0m` : line);
  };
}

// Only interpret exposed CLI item fields. Never inspect hidden/encrypted reasoning.
function liveMessages(event, previousOutputs) {
  const item = event.item;
  if (!item || !['item.started', 'item.updated', 'item.completed'].includes(event.type)) return null;
  if (item.type === 'file_change') {
    const changes = Array.isArray(item.changes) ? item.changes : [];
    return changes.filter((c) => typeof c.path === 'string').map((c) => ({ kind: 'file',
      message: `File ${item.status || event.type}: ${c.kind || 'change'} ${c.path}` }));
  }
  if (item.type === 'reasoning') return typeof item.text === 'string' && item.text
    ? [{ kind: 'reasoning', message: 'Tóm tắt reasoning CLI: ' + item.text }] : [];
  if (!['command_execution', 'mcp_tool_call'].includes(item.type)) return null;
  const name = item.command || `${item.server || ''}/${item.tool || item.id || ''}`;
  const asset = item.type === 'mcp_tool_call'
    ? /image_gen|imagegen|image_to_video|generate2d(sprite|map)/i.test(name)
    : /^\s*(?:&\s*)?(?:python|python3|py)(?:\.exe)?\s+["']?[^\r\n]*?(?:route_media\.py["']?\s+(?:image|video)|master_still\.py["']?\s+generate)\b/i.test(name);
  const messages = [{ kind: asset ? 'asset' : 'tool',
    message: `${asset ? 'Asset tool' : 'Tool'} ${item.status || event.type}${item.exit_code != null ? ` (exit ${item.exit_code})` : ''}: ${name}` }];
  if (typeof item.aggregated_output === 'string') {
    const key = item.id || name, old = previousOutputs.get(key) || '';
    const delta = item.aggregated_output.startsWith(old) ? item.aggregated_output.slice(old.length) : item.aggregated_output;
    previousOutputs.set(key, item.aggregated_output);
    for (const line of delta.split(/\r?\n/).filter(Boolean).slice(-4)) messages.push({ kind: 'result', message: 'Tool output: ' + line });
  }
  if (item.type === 'mcp_tool_call' && event.type === 'item.completed') {
    const blocks = item.result?.content;
    if (Array.isArray(blocks)) for (const block of blocks.filter((c) => c.type === 'text' && typeof c.text === 'string').slice(0, 2)) {
      messages.push({ kind: 'result', message: 'Tool result: ' + block.text });
    }
    if (item.error?.message) messages.push({ kind: 'error', message: 'Tool error: ' + item.error.message });
  }
  return messages;
}

function eventMessage(event) {
  const item = event.item;
  switch (event.type) {
    case 'thread.started': return 'Codex mở thread ' + (event.thread_id || '');
    case 'turn.started': return 'Codex bắt đầu lượt xử lý';
    case 'turn.completed': return 'Codex kết thúc lượt xử lý; chờ kiểm chứng độc lập';
    case 'turn.failed': return 'Codex turn lỗi: ' + (event.error?.message || 'không có chi tiết');
    case 'error': return 'Codex lỗi: ' + (event.message || event.error?.message || 'không có chi tiết');
    case 'item.started': case 'item.updated': case 'item.completed':
      if (!item || typeof item.type !== 'string') return 'Codex event ' + event.type;
      if (item.type === 'command_execution') return `Tool ${event.type}: ${item.command || item.id || ''}`
        + (item.exit_code != null ? `; exit ${item.exit_code}` : '');
      if (item.type === 'mcp_tool_call') return `Tool ${item.server || ''}/${item.tool || item.id || ''}: ${item.status || event.type}`;
      if (['reasoning', 'agent_message'].includes(item.type)) return `Codex ${item.type}: ${item.text || item.id || event.type}`;
      return `Codex ${item.type}: ${item.status || event.type}`;
    default: return typeof event.type === 'string' ? 'Codex event: ' + event.type : 'Codex JSON chưa nhận diện loại event';
  }
}

// Observational only. No event, text or tool output can declare task success.
export function outputObserver({ codex = false, live = false, emit = () => {}, structuredLog } = {}) {
  const channels = Object.fromEntries(['stdout', 'stderr'].map((c) => [c, { decoder: new StringDecoder('utf8'), pending: '', overflow: false }]));
  let ended = false;
  const previousOutputs = new Map();
  function record(channel, line, oversized = false) {
    if (!line && !oversized) return;
    const record = { time: new Date().toISOString(), channel };
    if (oversized) {
      record.kind = 'oversized_line'; record.preview = line;
      emit(`${channel}: dòng quá dài; xem raw log`, 'error');
    } else if (channel === 'stdout' && codex) {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        record.kind = 'invalid_json'; record.raw = line;
      }
      if (record.kind === 'invalid_json') emit('stdout không phải JSON: ' + line, 'error');
      else if (!event || typeof event !== 'object' || Array.isArray(event)) {
        record.kind = 'invalid_event'; record.raw = line;
        emit('stdout JSON không phải event object: ' + line, 'error');
      }
      else {
        record.kind = 'codex_event'; record.event = event;
        const messages = live ? liveMessages(event, previousOutputs) : null;
        if (messages) for (const message of messages) emit(message.message, message.kind);
        else emit(eventMessage(event), ['turn.failed', 'error'].includes(event.type) ? 'error' : 'activity');
      }
    } else {
      record.kind = 'text'; record.raw = line;
      // Gate start/exit are always reported by the controller. Keep routine package/cache
      // chatter in raw logs; show observed test/build outcomes and every stderr line live.
      if (channel === 'stderr' || /\b(?:Tests|Test Files|Tasks:|passed|failed|error|warning)\b|^\s*(?:ok|not ok) \d|^# (?:tests|pass|fail|cancelled|skipped)/i.test(line)) {
        emit(`${channel === 'stderr' ? 'stderr: ' : ''}${line}`, channel === 'stderr' ? 'error' : 'result');
      }
    }
    if (structuredLog) fs.appendFileSync(structuredLog, JSON.stringify(record) + '\n');
  }
  function consume(channel, text, final = false) {
    const state = channels[channel];
    for (const part of text.split(/(\n)/)) {
      if (part === '\n') {
        record(channel, state.pending.replace(/\r$/, ''), state.overflow);
        state.pending = ''; state.overflow = false;
      } else if (!state.overflow) {
        state.pending += part;
        if (state.pending.length > 128_000) { state.pending = state.pending.slice(0, 240); state.overflow = true; }
      }
    }
    if (final) { record(channel, state.pending.replace(/\r$/, ''), state.overflow); state.pending = ''; }
  }
  return {
    write(channel, data) { if (!ended) consume(channel, channels[channel].decoder.write(data)); },
    end() {
      if (ended) return; ended = true;
      for (const channel of ['stdout', 'stderr']) consume(channel, channels[channel].decoder.end(), true);
    },
  };
}
