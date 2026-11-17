import { env } from 'cloudflare:workers';
import { pairMap, pairs, retiredPairMetadata, type Pair, type PairMetadata } from './pairs';
import { pseudonymize } from './author-aliases.server';

function database() {
  if (!env.DB) throw new Error('Database unavailable.');
  return env.DB;
}

export const mask = '⟪ACADEMIC_GAP⟫';
export type Source = {
  item_id: string;
  domain: string;
  author: string;
  level: 'sentence' | 'paragraph' | 'passage';
  task: string;
  context_before: string;
  context_after: string;
  real_text: string;
};

const builtInSources = new Map<string, Source>();
for (const pair of pairs) {
  if (!pair.item_id || builtInSources.has(pair.item_id)) continue;
  builtInSources.set(pair.item_id, {
    item_id: pair.item_id, domain: pair.domain, author: pair.author,
    level: pair.level as Source['level'], task: pair.task,
    context_before: pair.context_before || '', context_after: pair.context_after || '',
    real_text: pair.real === 'A' ? pair.a : pair.b,
  });
}

type ImportedMeta = {
  id: string;
  item_id: string;
  author: string;
  domain: string;
  level: Source['level'];
  baseline: string;
  model: string;
  run_id: string;
};

export async function loadSources(ids?: string[]) {
  const sources = new Map(builtInSources);
  const query = ids
    ? database().prepare('SELECT payload FROM imported_sources WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ids))
    : database().prepare('SELECT payload FROM imported_sources ORDER BY id');
  const { results } = await query.all<{payload: string}>();
  for (const row of results) {
    const source = JSON.parse(row.payload) as Source;
    sources.set(source.item_id, source);
  }
  return sources;
}

export function exportSource(source: Source) {
  return {
    ...source,
    schema_version: 'apt-source-v1',
    masked_context: source.level === 'passage' ? null : source.context_before + mask + source.context_after,
  };
}

export async function pairInventory(domain?: string) {
  const filter = domain ? ' WHERE domain = ?' : '';
  const query = database().prepare('SELECT id, item_id, author, domain, level, method AS baseline, model, run_id FROM imported_pairs' + filter);
  const { results } = await (domain ? query.bind(domain) : query).all<ImportedMeta>();
  return [...pairs.filter(p => !domain || p.domain === domain), ...results]
    .map(pair => ({ ...pair, author: pseudonymize(pair.author) }));
}

export async function loadPairs(ids: string[]) {
  const selected = new Map<string, Pair>();
  const missing: string[] = [];
  for (const id of new Set(ids)) {
    const pair = pairMap.get(id);
    if (pair) selected.set(id, pair);
    else missing.push(id);
  }
  if (!missing.length) return selected;
  const { results } = await database().prepare(`
    SELECT p.id, p.item_id, p.author, p.domain, p.level, p.method AS baseline,
           p.model, p.run_id, p.generated_text, s.payload
    FROM imported_pairs p LEFT JOIN imported_sources s ON s.id = p.item_id
    WHERE p.id IN (SELECT value FROM json_each(?))
  `).bind(JSON.stringify(missing)).all<ImportedMeta & {generated_text: string; payload: string | null}>();
  for (const row of results) {
    const source = builtInSources.get(row.item_id) || (row.payload && JSON.parse(row.payload) as Source);
    if (!source) throw new Error('题目原文记录不存在');
    selected.set(row.id, {
      id: row.id, item_id: row.item_id, author: row.author, domain: row.domain,
      level: row.level, baseline: row.baseline, model: row.model, run_id: row.run_id,
      task: source.task, context_before: source.context_before, context_after: source.context_after,
      a: source.real_text, b: row.generated_text, real: 'A',
    });
  }
  return selected;
}

export async function loadPairMetadata(ids: string[]) {
  const selected = new Map<string, PairMetadata>();
  const missing: string[] = [];
  for (const id of new Set(ids)) {
    const pair = pairMap.get(id) || retiredPairMetadata.get(id);
    if (pair) selected.set(id, pair);
    else missing.push(id);
  }
  if (!missing.length) return selected;
  const { results } = await database().prepare(`
    SELECT id, item_id, author, domain, level, method AS baseline, model, run_id
    FROM imported_pairs WHERE id IN (SELECT value FROM json_each(?))
  `).bind(JSON.stringify(missing)).all<ImportedMeta>();
  for (const row of results) selected.set(row.id, { ...row, real: 'A' });
  return selected;
}
