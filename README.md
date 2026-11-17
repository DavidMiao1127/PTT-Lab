# Personalized Turing Test Lab (PTT-Lab)

[简体中文](README.zh-CN.md) · [Static demo](https://davidmiao1127.github.io/PTT-Lab-Demo/)

PTT-Lab is a research platform for evaluating whether generated text resembles a particular scholar’s writing. It provides bilingual interfaces for annotation and research inspection.

- **Annotators** choose a domain, scholars, and an information exposure condition. They select the authentic passage in blinded A/B comparisons, rate their confidence on a 1–5 scale, and annotate reasons and textual evidence for a sampled subset of judgments.
- **Researchers** inspect real judgments by text granularity, information exposure, and eight baseline methods. The password-protected dashboard also supports round-level review of timing, pointer traces, text selections and evidence, plus [JSONL corpus import and export](docs/corpus-exchange.md).

## Corpus

The bundled corpus contains **630 pairs across 21 pseudonymous scholars** in law, economics, philosophy, computer science, and literature. Each scholar has 10 tasks at each granularity as a sample.

The server loads [pairs-release.json](data/pairs-release.json). The same pairs and answer labels are available in [annotation_dataset.sqlite](data/annotation_dataset.sqlite). Participant responses and interaction records are stored separately in the deployment’s D1 database.

## Run locally

Use Node.js 24 and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm build
node scripts/init-local-db.mjs
pnpm start
```

Open `http://127.0.0.1:8787`. For researcher access, set `ADMIN_TOKEN=<your own token>` in `dist/server/.dev.vars` before starting the server. Open `/admin` and enter that token. Local annotation records are stored in `.wrangler/state`.

## Deploy

Deploy the full platform to Cloudflare Workers with a D1 binding named `DB`. In the built Wrangler configuration, set your Worker name, D1 name and ID, and `migrations_dir` to `../../drizzle`. Apply the remote migrations, configure `ADMIN_TOKEN` as a Worker secret, and deploy using that configuration. Keep `dist/server` and `dist/client` together. [Cloudflare Workers and D1 setup](https://developers.cloudflare.com/d1/get-started/)
