export type Metrics = { count: number; scored: number; correct: number; confidenceTotal: number };
export type MetricGroup = Metrics & { id: string };
export type AdminStatistics = {
  rounds: number;
  overall: Metrics;
  granularity: MetricGroup[];
  exposure: MetricGroup[];
  baseline: MetricGroup[];
};

export const granularities = ['passage', 'paragraph', 'sentence'];
export const exposureLevels = ['general', 'basic', 'full'];
export const baselineLabels: Record<string, string> = {
  '1': 'No persona', '2': 'Name-only prompting', '3': 'Multi-tier persona',
  '4': 'Biographical profile', '5': 'Few-shot prompting', '6': 'Personalized RAG',
  '8': 'User-specific LoRA', '9': 'User embedding',
};

function methodKey(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

const baselineIds = new Map(Object.entries(baselineLabels).flatMap(([id, label]) => [
  [id, id], ['b' + id, id], [methodKey(label), id],
]));
baselineIds.set('name only', '2');
baselineIds.set('few shot', '5');

export function baselineGroup(method?: string) {
  return method ? baselineIds.get(methodKey(method)) ?? method : 'unknown';
}
