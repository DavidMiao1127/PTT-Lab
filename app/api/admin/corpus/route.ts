import { env } from 'cloudflare:workers';
import { exportSource, loadSources, mask, type Source } from '../../../../lib/pair-library';
import { authorSubjects } from '../../../../lib/study';

export const dynamic = 'force-dynamic';
const maxBytes = 1_500_000;
const maxRows = 1000;
const headers = { 'Cache-Control': 'no-store' };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers });
}

function authorized(request: Request) {
  const secret = (env as unknown as {ADMIN_TOKEN?: string}).ADMIN_TOKEN;
  return !!secret && request.headers.get('authorization') === 'Bearer ' + secret;
}

async function digest(value: unknown) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readJsonl(request: Request) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new Error('File exceeds 1.5 MB.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Choose a JSONL file.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('File exceeds 1.5 MB.');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  const rows: { line: number; row: Record<string, unknown> }[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let row: unknown;
    try { row = JSON.parse(line); }
    catch { throw new Error(`Line ${index + 1}: invalid JSON.`); }
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Line ${index + 1}: expected a JSON object.`);
    }
    rows.push({ line: index + 1, row: row as Record<string, unknown> });
  }
  if (!rows.length || rows.length > maxRows) throw new Error('Provide 1 to 1,000 data rows.');
  return rows;
}

function field(row: Record<string, unknown>, name: string, max: number, allowEmpty = false) {
  const value = row[name];
  if (value === undefined && allowEmpty) return '';
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && !value.trim())) {
    throw new Error(`Invalid ${name} (maximum ${max} characters).`);
  }
  return value;
}

function readStandalone(row: Record<string, unknown>, real_text: string): Omit<Source, 'item_id'> {
  const domain = field(row, 'domain', 40);
  const author = field(row, 'author', 160);
  if (!authorSubjects.some(entry => entry.domain === domain && entry.name === author)) {
    throw new Error('Use an author and domain from the exported source catalogue.');
  }
  const level = row.level;
  if (level !== 'passage' && level !== 'paragraph' && level !== 'sentence') {
    throw new Error('level must be passage, paragraph or sentence.');
  }
  const task = field(row, 'task', 4000, level !== 'passage');
  const context_before = field(row, 'context_before', 24000, true);
  const context_after = field(row, 'context_after', 24000, true);
  if (level === 'passage' && (context_before || context_after)) {
    throw new Error('Passage tasks use a writing instruction and empty context fields.');
  }
  if (level !== 'passage' && !(context_before.trim() || context_after.trim())) {
    throw new Error('Infilling tasks require shared context.');
  }
  if ([context_before, context_after, task, real_text].some(text => text.includes(mask))) {
    throw new Error('Keep the mask in masked_context, separate from the displayed text.');
  }
  return { domain, author, level, task, context_before, context_after, real_text };
}

export async function GET(request: Request) {
  if (!authorized(request)) return json({ error: 'Admin key required.' }, 403);
  if (!env.DB) return json({ error: 'Database unavailable.' }, 503);
  const sources = await loadSources();
  const encoder = new TextEncoder();
  const iterator = sources.values();
  return new Response(new ReadableStream({
    pull(controller) {
      const next = iterator.next();
      if (next.done) controller.close();
      else controller.enqueue(encoder.encode(JSON.stringify(exportSource(next.value)) + '\n'));
    },
  }), {
    headers: {
      ...headers,
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Content-Disposition': 'attachment; filename="apt-source-tasks.jsonl"',
    },
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: 'Admin key required.' }, 403);
  if (!env.DB) return json({ error: 'Database unavailable.' }, 503);
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin.' }, 403);
  }

  try {
    const rows = await readJsonl(request);
    const ids = rows.flatMap(({row}) => typeof row.item_id === 'string' ? [row.item_id] : []);
    const sources = await loadSources([...new Set(ids)]);
    const newSources = new Map<string, Source>();
    const seen = new Set<string>();
    const records = [];
    for (const { line, row } of rows) {
      try {
        const method = field(row, 'method', 120).trim();
        const model = field(row, 'model', 160, true).trim();
        const run_id = field(row, 'run_id', 120, true).trim();
        const isPair = 'a' in row || 'b' in row || 'real' in row;
        if (isPair && 'generated_text' in row) throw new Error('Use either A/B fields or generated_text.');
        let generated_text: string;
        let realText: string | undefined;
        if (isPair) {
          if (row.real !== 'A' && row.real !== 'B') throw new Error('real must be A or B.');
          const a = field(row, 'a', 24000);
          const b = field(row, 'b', 24000);
          [realText, generated_text] = row.real === 'A' ? [a, b] : [b, a];
        } else {
          generated_text = field(row, 'generated_text', 24000);
        }

        let source: Source;
        if ('item_id' in row) {
          const id = field(row, 'item_id', 256);
          const match = sources.get(id);
          if (!match) throw new Error('Unknown item_id. Use the ID in the exported file.');
          source = match;
          if (realText !== undefined && realText !== source.real_text) {
            throw new Error('The authentic side does not match real_text for this item_id.');
          }
          for (const key of ['domain', 'author', 'level', 'task', 'context_before', 'context_after'] as const) {
            if (key in row && row[key] !== source[key]) throw new Error(`${key} does not match the exported task.`);
          }
        } else {
          if (realText === undefined) throw new Error('item_id is required for generated_text.');
          const input = readStandalone(row, realText);
          const item_id = 'src-' + await digest(input);
          source = { item_id, ...input };
          newSources.set(item_id, source);
        }

        if (generated_text.includes(mask)) throw new Error('generated_text contains the mask marker.');
        if (generated_text.trim() === source.real_text.trim()) throw new Error('The two candidates must differ.');
        const contextLength = source.context_before.length + source.context_after.length;
        if (contextLength + Math.max(source.real_text.length, generated_text.length) > 24000) {
          throw new Error('A reconstructed text exceeds 24,000 characters.');
        }
        const identity = [source.item_id, method, model, run_id];
        const naturalKey = JSON.stringify(identity);
        if (seen.has(naturalKey)) throw new Error('Duplicate task, method, model and run_id in this file.');
        seen.add(naturalKey);
        records.push({
          id: 'imp-' + await digest([...identity, generated_text]),
          item_id: source.item_id, author: source.author, domain: source.domain,
          level: source.level, method, model, run_id, generated_text,
        });
      } catch (error) {
        return json({ error: `Line ${line}: ${(error as Error).message}` }, 400);
      }
    }
    const sourceData = JSON.stringify([...newSources.values()]);
    const pairData = JSON.stringify(records);
    const encoder = new TextEncoder();
    if ([sourceData, pairData].some(text => encoder.encode(text).byteLength > 1_900_000)) {
      return json({ error: 'The validated batch is too large. Split it into smaller files.' }, 413);
    }
    const insertSources = env.DB.prepare(`
      INSERT INTO imported_sources(id, payload)
      SELECT value->>'$.item_id', value FROM json_each(?) WHERE true
      ON CONFLICT(id) DO NOTHING
    `).bind(sourceData);
    const insertPairs = env.DB.prepare(`
      INSERT INTO imported_pairs(id, item_id, author, domain, level, method, model, run_id, generated_text, created_at)
      SELECT value->>'$.id', value->>'$.item_id', value->>'$.author', value->>'$.domain',
             value->>'$.level', value->>'$.method', value->>'$.model', value->>'$.run_id',
             value->>'$.generated_text', ?
      FROM json_each(?) WHERE true
      ON CONFLICT(id) DO NOTHING
    `).bind(Date.now(), pairData);
    const [, result] = await env.DB.batch([insertSources, insertPairs]);
    return json({ imported: result.meta.changes, existing: records.length - result.meta.changes });
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes('UNIQUE constraint failed')) {
      return json({ error: 'A task, method and model already use this run_id with different text. Use a new run_id.' }, 409);
    }
    if (message.startsWith('Line ') || /^(File|Choose|Provide)/.test(message)) {
      return json({ error: message }, 400);
    }
    if (error instanceof TypeError) return json({ error: 'Could not read a UTF-8 JSONL file.' }, 400);
    console.error('Corpus import failed', error);
    return json({ error: 'Import could not be saved. Please retry.' }, 500);
  }
}
