import raw from '../data/pairs-release.json';
import retired from '../data/retired-pair-metadata.json';
import { pseudonymize } from './author-aliases.server';

export type Pair = {
  id: string;
  author: string;
  domain: string;
  task: string;
  a: string;
  b: string;
  real: string;
  baseline: string;
  level?: string;
  context_before?: string;
  context_after?: string;
  item_id?: string;
  model?: string;
  run_id?: string;
  prompt_variant?: string;
};
export const pairs: Pair[] = raw;
export const pairMap = new Map<string, Pair>(pairs.map(p => [p.id, p]));
export type PairMetadata = Pick<Pair, 'id' | 'item_id' | 'author' | 'domain' | 'level' | 'baseline' | 'model' | 'run_id' | 'real'>;
export const retiredPairMetadata = new Map<string, PairMetadata>(
  Object.entries(retired).map(([id, entry]) => [id, { id, domain: '', ...entry }]),
);

export function visiblePair(p: Pair, flip: boolean) {
  return {
    id: p.id, author: pseudonymize(p.author), domain: p.domain, task: pseudonymize(p.task),
    level: p.level || 'passage',
    contextBefore: pseudonymize(p.context_before || ''), contextAfter: pseudonymize(p.context_after || ''),
    a: pseudonymize(flip ? p.b : p.a), b: pseudonymize(flip ? p.a : p.b),
  };
}

export function truth(p: Pick<Pair, 'real'>, flip: boolean) {
  return flip ? (p.real === 'A' ? 'B' : 'A') : p.real;
}
