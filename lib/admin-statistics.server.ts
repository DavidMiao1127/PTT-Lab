import { env } from 'cloudflare:workers';
import { loadPairMetadata } from './pair-library';
import { baselineGroup, baselineLabels, exposureLevels, granularities, type AdminStatistics, type Metrics } from './admin-statistics';

export async function annotationStatistics(): Promise<AdminStatistics> {
  const db = env.DB!;
  const [rounds, groups] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM sessions').first<{n: number}>(),
    db.prepare(`
      SELECT a.pair_id,
             json_extract(s.profile, '$.role') AS role,
             COUNT(*) AS count,
             SUM(a.confidence) AS confidenceTotal,
             SUM(CASE WHEN a.choice = CASE WHEN json_extract(item.value, '$.flip') THEN 'B' ELSE 'A' END
                      THEN 1 ELSE 0 END) AS correctIfA
      FROM answers a
      JOIN sessions s ON s.id = a.session_id
      LEFT JOIN json_each(s.items) item ON json_extract(item.value, '$.id') = a.pair_id
      GROUP BY a.pair_id, role
    `).all<{pair_id: string; role: string | null; count: number; confidenceTotal: number; correctIfA: number}>(),
  ]);
  const metadata = await loadPairMetadata(groups.results.map(group => group.pair_id));
  const empty = (): Metrics => ({ count: 0, scored: 0, correct: 0, confidenceTotal: 0 });
  const overall = empty();
  const granularity = new Map(granularities.map(id => [id, empty()]));
  const exposure = new Map(exposureLevels.map(id => [id, empty()]));
  const baseline = new Map(Object.keys(baselineLabels).map(id => [id, empty()]));

  function add(target: Map<string, Metrics>, id: string, value: Metrics) {
    const current = target.get(id) ?? empty();
    merge(current, value);
    target.set(id, current);
  }
  function merge(target: Metrics, value: Metrics) {
    target.count += value.count;
    target.scored += value.scored;
    target.correct += value.correct;
    target.confidenceTotal += value.confidenceTotal;
  }

  for (const group of groups.results) {
    const pair = metadata.get(group.pair_id);
    const value = {
      count: group.count, confidenceTotal: group.confidenceTotal,
      scored: pair ? group.count : 0,
      correct: pair?.real === 'A' ? group.correctIfA : pair?.real === 'B' ? group.count - group.correctIfA : 0,
    };
    const level = pair ? pair.level || 'passage' : 'unknown';
    const role = group.role && exposure.has(group.role) ? group.role : 'unknown';
    const method = baselineGroup(pair?.baseline);
    merge(overall, value);
    add(granularity, level, value);
    add(exposure, role, value);
    add(baseline, method, value);
  }
  const result = (map: Map<string, Metrics>) => [...map].map(([id, values]) => ({ id, ...values }));
  return {
    rounds: rounds?.n ?? 0, overall,
    granularity: result(granularity),
    exposure: result(exposure),
    baseline: result(baseline),
  };
}
