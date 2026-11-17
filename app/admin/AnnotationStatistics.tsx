import { useLanguage } from '../Language';
import { baselineLabels, type AdminStatistics, type Metrics } from '../../lib/admin-statistics';

export const exposureLabels: Record<string, string> = {
  general: '不提供额外信息', basic: '基础资料', full: '全面资料',
};

const granularityLabels: Record<string, { zh: string; en: string }> = {
  passage: { zh: '篇章生成', en: 'Passage generation' },
  paragraph: { zh: '段落补全', en: 'Paragraph infilling' },
  sentence: { zh: '句子补全', en: 'Sentence infilling' },
};

export function useStatisticFormats() {
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'zh-CN';
  const count = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const decimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    count: (value: number) => count.format(value),
    accuracy: (value: Metrics) => value.scored ? percent.format(value.correct / value.scored) : '—',
    confidence: (value: Metrics) => value.count ? decimal.format(value.confidenceTotal / value.count) : '—',
  };
}

export default function AnnotationStatistics({ statistics }: { statistics: AdminStatistics }) {
  const { t, language } = useLanguage();
  const label = (zh: string, en: string) => language === 'en' ? en : zh;
  const unknown = label('待分类', 'Unclassified');
  const formats = useStatisticFormats();
  const sections = [
    {
      title: label('按文本粒度', 'By granularity'),
      rows: statistics.granularity.map(row => ({ ...row, label: granularityLabels[row.id]?.[language] ?? unknown })),
    },
    {
      title: label('按资料展示', 'By information exposure'),
      rows: statistics.exposure.map(row => ({ ...row, label: exposureLabels[row.id] ? t(exposureLabels[row.id]) : unknown })),
    },
    {
      title: label('按生成基线', 'By baseline'),
      rows: statistics.baseline.map(row => ({ ...row, label: row.id === 'unknown' ? unknown : baselineLabels[row.id] ?? row.id })),
    },
  ];

  return <div className="statistic-groups">
    {sections.map(({ title, rows }) => <section key={title} className="statistic-group">
      <table>
        <caption>{title}</caption>
        <thead><tr>
          <th scope="col">{label('分组', 'Group')}</th>
          <th scope="col">{label('判断数', 'Judgments')}</th>
          <th scope="col">{label('准确率', 'Accuracy')}</th>
          <th scope="col">{label('平均信心（1–5）', 'Avg. confidence (1–5)')}</th>
        </tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
          <th scope="row">{row.label}</th>
          <td>{formats.count(row.count)}</td>
          <td>{formats.accuracy(row)}</td>
          <td>{formats.confidence(row)}</td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="statistic-empty">{label('暂无标注数据。', 'No annotation data yet.')}</p>}
    </section>)}
  </div>;
}
