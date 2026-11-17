# 题库导入与导出

打开 `/admin`，用管理密钥登录，在「题库导入与导出」下载真实文本和任务，或上传 JSONL。下载包含真实答案，请只在获得授权的范围内发放。给生成模型提供 task 或 masked_context 时，去掉 real_text。

## 导出字段

| 字段 | 含义 |
| --- | --- |
| `schema_version` | 导出格式版本，目前为 `apt-source-v1` |
| `item_id` | 稳定的原文任务编号，导入时按此关联 |
| `domain`, `author` | 领域代码及平台内的学者名称 |
| `level` | `sentence`、`paragraph` 或 `passage` |
| `task` | 写作任务。篇章题以此为模型输入 |
| `real_text` | 真实目标文本。补全题只含被挖去的部分 |
| `context_before`, `context_after` | 缺口前后文，保留原始空格和换行 |
| `masked_context` | 补全题的前文 + `⟪ACADEMIC_GAP⟫` + 后文。篇章题为 null |

每个编号只导出一次。首次导出包括现行题库的 480 个真实任务。通过完整配对加入的新原文也会进入之后的导出。

## 格式一：使用已有任务，提交生成结果

从导出文件复制 `item_id`。将下方占位编号替换成实际编号。

```json
{"item_id":"<导出的 item_id>","method":"my-persona","model":"model-v1","run_id":"run-01","generated_text":"生成的目标文本"}
```

句子／段落题只提交填入缺口的片段。篇章题提交完整生成篇章。所有文件使用 UTF-8，每行一个 JSON 对象，单份最多 1,000 条且不超过 1.5 MB。较大的批次可以拆成多份上传。

## 格式二：提交完整 A/B 配对

已有任务也可提交双侧文本，系统会逐字核对真实侧。补全题的 a、b 仍只放缺口内容。

```json
{"item_id":"<导出的 item_id>","method":"my-persona","run_id":"run-02","a":"与导出 real_text 完全一致的文本","b":"生成文本","real":"A"}
```

为新的原文建题时，省略 `item_id`，明确填写作者、领域、任务粒度和共享上下文。以下短句仅示意数据结构。实际上传时应使用你有权使用且来源可核实的文本。

```json
{"domain":"philosophy","author":"Bertrand Russell","level":"sentence","task":"","context_before":"Shared text before. ","context_after":" Shared text after.","a":"Generated sentence.","b":"Authentic sentence.","real":"B","method":"my-persona","run_id":"run-03"}
```

可用作者和领域代码以导出文件为准。新篇章题必须给出 `task`，前后文留空。新补全题至少需要一侧上下文。补全内容与上下文会按原样拼接，所以需保留应有的分隔空格或换行。新任务编号由系统分配，可从下一次导出获取。

## 导入结果

- `method` 必填。 `model` 和 `run_id` 可省略。
- 重传相同的任务、方法、模型、运行和文本会跳过。更换文本时请使用新的 `run_id`。
- 一份文件作为一批校验和保存。遇到格式问题时会提示行号。已有记录发生版本冲突时会拒绝整份文件。
- 导入后，新配对自动进入对应领域和学者的抽题池。新轮次继续按粒度、学者与方法抽题，并随机安排真实侧。
- 研究后台的轮次详情导出包含 `pairMetadata`，可用来关联原文编号、方法、模型和运行。

API 同样使用 `/api/admin/corpus`，GET 返回 JSONL，POST 接收原始 JSONL 文件内容。两者均需管理密钥的 Bearer 授权。POST 需设置站点自身的 Origin。
