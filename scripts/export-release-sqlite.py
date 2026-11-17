"""Build the standalone, pseudonymized 630-pair release database from the bundled corpus."""
import json
import sqlite3
import tempfile
from collections import Counter
from contextlib import closing
from pathlib import Path

data = Path(__file__).resolve().parents[1] / 'data'
pairs = json.loads((data / 'pairs-release.json').read_text(encoding='utf-8'))
groups = Counter((p['domain'], p['author'], p['level']) for p in pairs)
if (len(pairs) != 630 or len(groups) != 63 or set(groups.values()) != {10}
        or len({p['domain'] for p in pairs}) != 5 or len({p['author'] for p in pairs}) != 21):
    raise ValueError('Expected 21 authors, each with 10 pairs for each granularity, across 5 domains.')

with tempfile.TemporaryDirectory(dir=data) as tmp:
    path = Path(tmp) / 'annotation_dataset.sqlite'
    with closing(sqlite3.connect(path)) as db, db:
        db.executescript('''
            CREATE TABLE annotation_pairs (
                id TEXT PRIMARY KEY, item_id TEXT UNIQUE NOT NULL,
                domain TEXT NOT NULL, author TEXT NOT NULL,
                level TEXT NOT NULL CHECK (level IN ('passage', 'paragraph', 'sentence')),
                task TEXT NOT NULL, context_before TEXT NOT NULL, context_after TEXT NOT NULL,
                a TEXT NOT NULL, b TEXT NOT NULL, real TEXT NOT NULL CHECK (real IN ('A', 'B')),
                baseline TEXT NOT NULL, model TEXT NOT NULL, prompt_variant TEXT NOT NULL
            );
            CREATE INDEX corpus_group ON annotation_pairs(domain, author, level);
            CREATE VIEW coverage AS
                SELECT domain, author, level, COUNT(*) AS pairs
                FROM annotation_pairs GROUP BY domain, author, level;
        ''')
        db.executemany('''
            INSERT INTO annotation_pairs VALUES (
                :id, :item_id, :domain, :author, :level, :task, :context_before, :context_after,
                :a, :b, :real, :baseline, :model, :prompt_variant
            )
        ''', pairs)
        assert db.execute('PRAGMA integrity_check').fetchone() == ('ok',)
    path.replace(data / path.name)
print('630 verified pairs exported to data/annotation_dataset.sqlite')
