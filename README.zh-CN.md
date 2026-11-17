# 个性化图灵测试标注平台（PTT-Lab）

[English](README.md) · [静态演示](https://davidmiao1127.github.io/PTT-Lab-Demo/)

个性化图灵测试标注平台用于评测模型生成的文本能否模拟特定学者的写作。标注端和研究后台均支持中英文切换。

- **标注者**选择领域、学者和资料展示条件，在匿名 A/B 对照中选择真实文本、填写 1–5 分信心，并为抽中的题目填写理由和原文证据。
- **研究者**通过管理密钥进入后台，可按文本粒度、资料展示条件和八种生成基线查看真实统计，逐轮复核用时、鼠标轨迹、文本选区和证据，也可[导出任务和导入生成结果或完整配对](docs/corpus-exchange.md)。

## 题库

发布题库覆盖法律、经济学、哲学、计算机科学和文学五个领域，共 **21 位化名学者、630 对文本**。每位学者有 10 道篇章生成、10 道段落补全和 10 道句子补全（仅为当前发布的样例）。

服务端读取 [pairs-release.json](data/pairs-release.json)。[annotation_dataset.sqlite](data/annotation_dataset.sqlite) 提供相同的配对和答案。参与者的作答与交互记录单独保存在部署环境的 D1 数据库。

## 本地运行

使用 Node.js 24 和 pnpm 11.25.0。

```sh
pnpm install --frozen-lockfile
pnpm build
node scripts/init-local-db.mjs
pnpm start
```

打开 `http://127.0.0.1:8787`。如需访问研究后台，启动前在 `dist/server/.dev.vars` 中设置 `ADMIN_TOKEN=<自选密钥>`，再到 `/admin` 输入同一个密钥。本地标注记录保存在 `.wrangler/state`。

## 部署

完整平台可部署到 Cloudflare Workers，数据库绑定名为 `DB`。在构建生成的 Wrangler 配置里填写自己的 Worker 名称、D1 数据库名称和 ID，并将 `migrations_dir` 设为 `../../drizzle`。应用远程迁移，将 `ADMIN_TOKEN` 配置为 Worker 密钥，再用该配置部署。保留 `dist/server` 和 `dist/client` 的相对目录结构。 [Cloudflare Workers 和 D1 配置说明](https://developers.cloudflare.com/d1/get-started/)
