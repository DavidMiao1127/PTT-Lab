import json
from pathlib import Path
p=Path('data/reading/materials.json');data=json.loads(p.read_text())
rows='''The Problems of Philosophy|哲学问题|从日常知觉与怀疑出发，区分外观、感觉材料与物理对象，讨论知识的根据和哲学思考的价值。|Begins with perception and doubt, distinguishing appearance, sense-data and physical objects to examine the grounds of knowledge and the value of philosophy.
Our Knowledge of the External World|我们关于外间世界的知识|将逻辑分析用于外部世界的认识问题，考察经验、推断与科学方法之间的关系。|Applies logical analysis to knowledge of the external world, examining the relationships between experience, inference and scientific method.
Mysticism and Logic and Other Essays|神秘主义与逻辑及其他论文|论文集，比较神秘主义与科学精神，并讨论逻辑、数学及哲学分析的方法。|A collection comparing mysticism and the scientific outlook and discussing methods in logic, mathematics and philosophical analysis.
Introduction to Mathematical Philosophy|数理哲学导论|以较少的形式符号介绍数、序列、关系与无穷，说明数学基础问题如何转化为逻辑分析。|Introduces number, series, relations and infinity with limited formal notation, explaining how foundational questions in mathematics invite logical analysis.
Why Men Fight|人为什么争斗|从人的冲动、制度与社会组织出发，讨论战争、教育和经济生活，并探索减少冲突的社会条件。|Examines war, education and economic life through human impulses and social institutions, asking what social conditions could reduce conflict.
A System of Logic|逻辑体系|系统讨论演绎与归纳、因果推断和科学研究方法，并把方法问题延伸到社会与道德科学。|Examines deduction, induction, causal inference and scientific inquiry, extending methodological questions to the social and moral sciences.
Auguste Comte and Positivism|孔德与实证主义|评述孔德的实证哲学及其社会思想，既肯定其方法贡献，也分析其理论与制度主张的限度。|Assesses Comte's positive philosophy and social thought, recognizing methodological contributions while examining limits in his theoretical and institutional proposals.
On Liberty|论自由|讨论社会和国家干预个人生活的界限，论证思想表达、个性发展与多样生活方式的重要性。|Examines limits to social and governmental interference in individual life, defending expression, individuality and diverse ways of living.
Utilitarianism|功利主义|阐明以幸福为评价标准的伦理学，回应对功利主义的反对意见，并讨论正义与效用的关系。|Explains an ethics centered on happiness, answers objections to utilitarianism and examines the relationship between justice and utility.
Considerations on Representative Government|代议制政府|讨论良好政府的评价标准、代议制度的职责与缺陷，以及选举、代表和公共参与的安排。|Examines criteria for good government, the functions and weaknesses of representative institutions, and arrangements for elections, representation and participation.
The Subjection of Women|妇女的屈从地位|批判以性别为基础的法律与社会从属，讨论婚姻、教育和机会平等对个体与社会的意义。|Critiques legal and social subordination based on sex and examines marriage, education and equal opportunity for individuals and society.
Thus Spake Zarathustra|查拉图斯特拉如是说|以诗性叙述、演说和寓言展开价值创造、自我超越与生命肯定等主题，形式不同于通常的论证论文。|Uses poetic narrative, speeches and parables to explore value creation, self-overcoming and affirmation of life rather than conventional essay argument.
Beyond Good and Evil|善恶的彼岸|审视哲学偏见、道德判断与价值立场，借心理分析和视角转换追问思想背后的条件。|Examines philosophical prejudices, moral judgments and evaluative positions through psychological analysis and changes of perspective.
On the Genealogy of Morals|道德的谱系|通过历史与心理分析追问善恶、罪责、良心及禁欲理想的形成，强调价值判断自身也需要解释。|Uses historical and psychological inquiry to investigate moral values, guilt, conscience and ascetic ideals, treating evaluations themselves as objects of explanation.
The Gay Science|快乐的科学|以格言和短篇论述探讨知识、艺术、信仰与价值变化，兼具实验性、批判性和生命反思。|Uses aphorisms and short discussions to explore knowledge, art, belief and changing values through an experimental and critical reflection on life.
The Birth of Tragedy|悲剧的诞生|从古希腊悲剧出发讨论艺术、文化与生命体验，借日神和酒神的张力解释悲剧的形成与衰落。|Examines art, culture and life through Greek tragedy, using the tension between Apollonian and Dionysian impulses to interpret its emergence and decline.
Ecce Homo|瞧，这个人|以自我解释和作品回顾的方式说明思想道路，文字富于反讽与夸张，应结合其修辞语境阅读。|Revisits the author's intellectual path and writings through self-interpretation, irony and exaggeration that call for attention to rhetorical context.
The Theory of the Leisure Class|有闲阶级论|分析炫耀性消费、闲暇和身份竞争，考察经济行为如何受阶层习惯与社会评价支配。|Analyzes conspicuous consumption, leisure and status competition, examining how class habits and social judgments shape economic behavior.
The Instinct of Workmanship and the State of Industrial Arts|工艺本能和工业技艺的状态|研究工艺取向、技术知识与制度演变的关系，比较有效生产活动和既有社会安排之间的张力。|Studies workmanship, technical knowledge and institutional evolution, comparing productive activity with established social arrangements.
The Place of Science in Modern Civilisation and Other Essays|科学在现代文明中的地位及其他论文|论文集，讨论科学知识、经济学方法和现代制度，强调习惯、因果解释与文化条件。|A collection on scientific knowledge, economic method and modern institutions, emphasizing habits, causal explanation and cultural conditions.
An Inquiry into the Nature of Peace|和平的性质及其永久维持条件的探究|考察战争、民族主义和既得利益之间的联系，讨论持久和平需要怎样的制度与社会条件。|Examines connections between war, nationalism and vested interests, asking what institutional and social conditions could sustain peace.
The Higher Learning in America|美国高等教育|分析美国大学的治理与学术活动，批评商业价值和经营方式对高等学习与研究的影响。|Examines university governance and academic work in the United States, criticizing the effects of business values and managerial practices on learning and research.
The Economic Consequences of the Peace|和平的经济后果|从战后欧洲的经济联系与赔款安排出发，分析和平条约可能带来的生产、财政和社会后果。|Analyzes postwar Europe's economic connections and reparations arrangements, assessing the treaty's possible effects on production, public finance and society.
A Treatise on Probability|概率论|讨论证据如何支持理性信念，区分概率判断与单纯频率，并考察归纳和不确定性下的推理。|Examines how evidence supports rational belief, distinguishing probability judgments from mere frequencies and considering induction and uncertain reasoning.
Essays in Persuasion|劝说集|汇集面向公共议题的经济与政策文章，结合时事论辩和机制分析，讨论货币、就业和经济前景。|Collects public-facing economic and policy essays combining contemporary debate with analysis of money, employment and economic prospects.
The General Theory of Employment, Interest and Money|就业、利息和货币通论|从有效需求、消费、投资、预期及流动性偏好分析就业与产出的决定，讨论经济可能停留在非充分就业状态的原因。|Explains employment and output through effective demand, consumption, investment, expectations and liquidity preference, examining why an economy may remain below full employment.
A Tract on Monetary Reform|货币改革论|分析价格变动、汇率与货币安排对经济生活的影响，讨论货币政策目标及制度改革选择。|Examines how price changes, exchange rates and monetary arrangements affect economic life and considers policy aims and institutional reforms.
The Wealth of Nations|国富论|以分工、交换与市场为线索分析财富生产和分配，并讨论资本、贸易、税收及政府职能。|Analyzes production and distribution through division of labor, exchange and markets, discussing capital, trade, taxation and the functions of government.
The Theory of Moral Sentiments|道德情操论|从同情和相互评价出发解释道德判断，讨论旁观者视角、自我约束以及个人行为与社会秩序。|Explains moral judgment through sympathy and mutual appraisal, examining spectatorship, self-command, individual conduct and social order.
Lectures on Justice, Police, Revenue and Arms|法理学讲义|讲授法律、财产、治理、财政与国防等问题，把制度发展与社会生活的历史变化联系起来。|Lectures on law, property, governance, revenue and defense, linking institutional development to historical changes in social life.
Essays on Philosophical Subjects|哲学文集|收录关于科学解释、感官和艺术等主题的论文，展示其以心理机制与历史比较解释知识活动的方法。|Essays on scientific explanation, the senses and the arts illustrate psychological and historical approaches to the development of knowledge.
西方国家民商法概要|西方国家民商法概要|比较介绍西方民商法的基本概念与制度，涉及民事主体、财产、契约及商事组织等内容，常以不同法系和国家的规则相互参照。|A comparative introduction to civil and commercial law, covering legal persons, property, contracts and business organizations through comparisons across legal systems.
民商法论要|民商法论要|围绕民商法原理及制度改革展开论述，结合现实争议讨论权利保护、意思自治、企业制度与公权边界。|Discusses civil and commercial law and institutional reform through practical disputes concerning rights, private autonomy, enterprise institutions and the limits of public power.
中华人民共和国刑法的孕育诞生和发展完善|中华人民共和国刑法的孕育诞生和发展完善|梳理刑法从起草、颁行到修订完善的过程，对照草案、法条和不同意见，解释相关立法选择的背景与理由。|Traces the drafting, enactment and revision of China's criminal law, comparing drafts, provisions and competing views to explain legislative choices.
论刑事责任|论刑事责任|围绕刑事责任的地位、根据与范围展开理论分析，区分犯罪、责任和刑罚等概念，并讨论责任判断的规范条件。|Examines the place, grounds and scope of criminal responsibility, distinguishing crime, responsibility and punishment and discussing normative conditions for judgments of responsibility.'''
lookup={}
for line in rows.splitlines():
 title,zh,desc,en=line.split('|');lookup[title]=dict(titleZh=zh,summary={'zh':desc,'en':en})
for person in data:
 for book in person['works']:
  book.update(lookup[book['title']]);book['titleEn']=book['title'] if not any('\u4e00'<=c<='\u9fff' for c in book['title']) else {'西方国家民商法概要':'An Outline of Civil and Commercial Law in Western Countries','民商法论要':'Essentials of Civil and Commercial Law','中华人民共和国刑法的孕育诞生和发展完善':"The Gestation, Birth and Development of China's Criminal Law",'论刑事责任':'On Criminal Responsibility'}[book['title']]
  if not book['sourceUrl']:book['sourceUrl']={'scholar_001':'https://www.gutenberg.org/ebooks/author/355','scholar_002':'https://www.gutenberg.org/ebooks/author/1705','scholar_003':'https://www.gutenberg.org/ebooks/author/779','scholar_031':'https://www.aisixiang.com/data/44166.html','scholar_032':'https://libm.nwupl.edu.cn/bookInfo_01h0024305.html'}[person['id']]
 for ex in person['examples']:
  book=next(b for b in person['works'] if b['id']==ex['documentId']);ex['sourceUrl']=book['sourceUrl'];ex['titleZh']=book['titleZh'];ex['titleEn']=book['titleEn']
p.write_text(json.dumps(data,ensure_ascii=False,indent=2))
