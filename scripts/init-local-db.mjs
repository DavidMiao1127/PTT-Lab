import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const builtConfig = new URL('dist/server/wrangler.json', root);
const localConfig = new URL('dist/server/wrangler.local.json', root);
const config = JSON.parse(readFileSync(builtConfig, 'utf8'));
const database = config.d1_databases.find(entry => entry.binding === 'DB');
if (!database) throw new Error('The build is missing the DB binding.');
database.migrations_dir = '../../drizzle';
writeFileSync(localConfig, JSON.stringify(config, null, 2) + '\n');

const result = spawnSync(process.execPath, [
  '--import', './scripts/sites-env.mjs',
  './node_modules/wrangler/bin/wrangler.js',
  'd1', 'migrations', 'apply', 'DB',
  '--config', fileURLToPath(localConfig), '--local', '--persist-to', '.wrangler/state',
], { cwd: fileURLToPath(root), stdio: 'inherit' });

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
