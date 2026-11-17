'use client';

import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useLanguage } from '../Language';
import './corpus-exchange.css';

const endpoint = '/api/admin/corpus';
const outputExample = '{"item_id":"<ID from export>","method":"my-method","model":"model-v1","run_id":"run-01","generated_text":"Candidate text"}';
const pairExample = '{"domain":"philosophy","author":"Adrian Hartwell","level":"sentence","task":"","context_before":"Shared text before. ","context_after":" Shared text after.","a":"Authentic sentence.","b":"Generated sentence.","real":"A","method":"my-method","run_id":"run-02"}';

export default function CorpusExchange({ adminKey }: { adminKey: string }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const label = (zh: string, english: string) => en ? english : zh;
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; existing: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function task(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try { await action(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function request(options?: RequestInit) {
    const response = await fetch(endpoint, {
      ...options,
      headers: { ...options?.headers, Authorization: 'Bearer ' + adminKey },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as {error?: string} | null;
      throw new Error(body?.error || label('请求失败，请重试。', 'Request failed. Please retry.'));
    }
    return response;
  }

  function download() {
    void task(async () => {
      const response = await request();
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'apt-source-tasks.jsonl';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  function upload() {
    if (!file) return;
    setResult(null);
    void task(async () => {
      if (file.size > 1_500_000) throw new Error(label('请将文件拆分为每份不超过 1.5 MB。', 'Split files into parts of up to 1.5 MB.'));
      const response = await request({ method: 'POST', body: file, headers: { 'Content-Type': 'application/x-ndjson' } });
      setResult(await response.json());
      setFile(null);
      if (input.current) input.current.value = '';
    });
  }

  return (
    <section className="corpus-exchange" aria-labelledby="corpus-exchange-title">
      <div>
        <h2 id="corpus-exchange-title">{label('题库导入与导出', 'Corpus import and export')}</h2>
        <p>{label('下载带编号的真实文本、挖空上下文和写作任务，再导入生成结果或完整配对。', 'Download numbered source texts, masked contexts and writing tasks, then import generated outputs or complete pairs.')}</p>
      </div>
      <div className="corpus-controls">
        <button type="button" className="secondary" disabled={busy} onClick={download}><Download size={16} />{label('导出真实文本与任务', 'Export source texts and tasks')}</button>
        <div className="corpus-file-picker">
          <input ref={input} type="file" accept=".jsonl,.ndjson" hidden disabled={busy}
            onChange={e => { setFile(e.target.files?.[0] || null); setError(''); setResult(null); }} />
          <button type="button" className="secondary" disabled={busy} aria-describedby="corpus-file-status"
            onClick={() => input.current?.click()}>{label('选择文件', 'Choose file')}</button>
          <span id="corpus-file-status" aria-live="polite" title={file?.name}>
            {file?.name || label('未选择任何文件', 'No file selected')}
          </span>
        </div>
        <button type="button" className="primary" disabled={busy || !file} onClick={upload}><Upload size={16} />{label('导入配对题目', 'Import evaluation pairs')}</button>
      </div>
      <div aria-live="polite">
        {busy && <p>{label('正在处理文件…', 'Processing file…')}</p>}
        {error && <p className="error">{error}</p>}
        {result && <p>{label(`已导入 ${result.imported} 对，跳过 ${result.existing} 对重复记录。新增题目可进入新轮次抽样。`, `Imported ${result.imported} pairs. Skipped ${result.existing} existing pairs. New pairs are available for future rounds.`)}</p>}
      </div>
      <details>
        <summary>{label('JSONL 格式说明', 'JSONL format guide')}</summary>
        <p>{label('UTF-8，每行一个 JSON 对象。每份最多 1,000 条和 1.5 MB。', 'Use UTF-8 with one JSON object per line. Each file supports up to 1,000 rows and 1.5 MB.')}</p>
        <h3>{label('格式一 · 生成结果', 'Option 1 · Generated output')}</h3>
        <pre>{outputExample}</pre>
        <p>{label('保留导出文件中的 item_id。补全题只提交缺口内容，篇章题提交完整篇章。', 'Keep the item_id from the export. Supply only the replacement for infilling tasks, or a full passage for passage tasks.')}</p>
        <h3>{label('格式二 · A/B 配对', 'Option 2 · A/B pair')}</h3>
        <pre>{pairExample}</pre>
        <p>{label('real 指明真实侧。可填写已有 item_id 复用任务和上下文；新原文需提供示例中的作者、领域和粒度。篇章题填写 task，前后文留空；补全题填写共享前后文。', 'Set real to the authentic side. Reuse an exported item_id or supply the author, domain and level for a new source. For passages, provide task and leave both context fields empty. For infilling, provide the shared context.')}</p>
        <p>{label('method 必填。model 和 run_id 可省；同一任务、方法和模型提交不同结果时，使用新的 run_id。', 'method is required. model and run_id are optional. Use a new run_id when submitting a different result for the same item, method and model.')}</p>
      </details>
    </section>
  );
}
