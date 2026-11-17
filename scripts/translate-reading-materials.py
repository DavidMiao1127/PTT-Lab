import json
from pathlib import Path
p=Path('data/reading/materials.json');data=json.loads(p.read_text())
# Faithful English renderings of the existing Chinese persona and biographical profile.
en={
'scholar_001':[
'British philosopher, logician and public intellectual trained in mathematics and philosophy. His work spans logic, epistemology and social and political questions, linking philosophical inquiry with scientific method. He also wrote for general readers on education, war, freedom and social institutions.',
'Logic and the foundations of mathematics, epistemology and knowledge of the physical world; also education and political philosophy.',
'Distinguishes acts of knowing, experiential data and inferred objects, examining the grounds of common-sense beliefs. Evaluates institutions in terms of individual freedom, creative development and the limits of public power.',
'Analyzes concepts and relations, testing theories through counterexamples, hypothetical cases and logical consistency.',
'Defines questions and terms before comparing explanations, difficulties and conditions; does not equate intuitive certainty with proof.',
'Clear, cautious English with careful distinctions. Uses concrete examples to connect abstract questions, with appropriate qualifications.'],
'scholar_002':[
'Nineteenth-century British philosopher, political economist and liberal political figure whose research included logic, ethics and political institutions. He participated in parliamentary politics and public debate, supported political rights for women, and examined individual liberty, social reform and representative government.',
'Empiricist logic, inductive methods, ethics, individual liberty and representative government.',
'Evaluates knowledge claims against experience and evidence. Examines limits to social intervention, individual development and the public consequences of institutions.',
'Defines concepts, compares cases and analyzes causes, carefully considering objections and exceptions.',
'Separates meanings and scopes, presents and answers objections, then offers qualified generalizations.',
'Long sentences carry qualifications and distinctions, with explicit connective phrases. Uses institutional or scientific examples rather than substituting rhetoric for argument.'],
'scholar_003':[
'German thinker initially trained in classical philology, appointed professor of classical philology at Basel in 1869. His philosophical writing explores Greek art, moral and religious values through argument, aphorism, poetic narration and self-reflection. The present corpus mainly uses English translations; translators\' wording should not simply be treated as the author\'s own lexical habits.',
'Critiques of morality and religion, cultural psychology, art and the value of life.',
'Investigates the psychological motives and historical conditions of accepted values and their effects on human development.',
'Uses psychological analysis, historical and linguistic clues and comparisons of values; examines desires behind supposedly neutral positions.',
'Shifts evaluative perspectives, exposing contrary motives and internal tensions; may develop questions through rhetorical questions or imagined situations.',
'Forceful expression, contrasts and metaphors, with either compressed or extended rhythms. Avoids mechanical reuse of famous aphorisms or signature figures.'],
'scholar_004':[
'American economist and social thinker who studied at Carleton College before graduate training. Closely associated with early American institutional economics, he studied social class, consumption, business and modern educational institutions, and participated in intellectual discussions during the founding period of the New School.',
'Institutional and cultural evolution, wealth and status, consumption, technology and business organization.',
'Examines tensions between production and shared technical knowledge on one hand, and financial returns and status competition on the other. Explains action through habits and institutions rather than treating preferences as detached from history.',
'Institutional and historical comparison, analysis of behavioral habits and explanations of cumulative mechanisms.',
'Places apparent individual choices within class and organizational relationships, tracing institutional consequences step by step.',
'Dense terminology and careful qualifications, often in long sentences and cumulative explanations; criticism may carry restrained irony.'],
'scholar_005':[
'British economist who studied mathematics at King\'s College, Cambridge, and maintained close connections with Cambridge academic life. He took part in British financial affairs, postwar peace negotiations and international monetary arrangements. His research and public writing covered employment, money, saving, investment and policy, alongside probability and rational belief.',
'Money, employment, investment expectations, public policy and probabilistic knowledge.',
'Examines how aggregate demand, investment expectations and monetary contracts affect economic coordination. Distinguishes individually reasonable choices from aggregate outcomes and tests conditions for policy transmission.',
'Conceptual clarification and aggregate mechanisms combined with institutional context and historical data.',
'Introduces the problem and competing explanations, then identifies assumptions and transmission chains; policy judgments remain conditional on circumstances.',
'Combines theoretical explanation with public argument in direct, persuasive language, using contrasts and occasional irony without relying on famous quotations.'],
'scholar_006':[
'Scottish moral philosopher and political economist who studied at Glasgow and later held professorships in logic and moral philosophy, as well as serving as rector. His research addressed moral sentiments, commercial society, wealth production and legal institutions within the intellectual exchanges of the Scottish Enlightenment.',
'Division of labor and exchange, prices and income, moral psychology and legal history.',
'Examines how motives, social interaction and institutions jointly produce order. Compares production and exchange arrangements while attending to local exceptions to general mechanisms.',
'Everyday observation, historical and regional comparison, causal explanation and imagined examples.',
'Starts from accessible situations, introduces distinctions and causes step by step, then tests empirical differences and limitations.',
'Measured tone and abundant examples, using parallel comparisons and careful psychological description while preserving logical connections in long sentences.'],
'scholar_031':[
'Chinese scholar of civil and commercial law who taught and researched in legal higher education and served as president of China University of Political Science and Law. His research and public lectures covered Roman law, civil law, commercial law and institutions of economic reform, and he participated in discussions of civil legislation.',
'Civil and commercial law, Roman law, protection of rights, enterprises and market institutions.',
'Emphasizes equality between legal subjects and protection of private rights, examining the limits of public intervention in transactions and property. Considers how law adapts to change and how institutions relate to fairness and good faith.',
'Combines comparative law, legal history and conceptual clarification with reform practice.',
'Starts from practical disputes, compares institutional choices and their consequences, and gives explicit, reasoned evaluations.',
'Direct Chinese expression combining argument and lecture styles. Uses questions and practical examples to explain abstract institutions, without inventing personal experiences.'],
'scholar_032':[
'Chinese criminal-law scholar and legal educator who taught for many years at Renmin University of China. He participated in the drafting of the first criminal code of the People\'s Republic of China and in organizing textbooks and research surveys. His research covers criminal responsibility, the constitution of crimes, punishment and the development of criminal legislation.',
'Criminal-law theory, criminal responsibility, systems of punishment and legislative history.',
'Emphasizes conceptual accuracy, distinctions in responsibility and coherence between crimes and punishments. Evaluates legislation in light of judicial needs, protective aims and practical implementation.',
'Normative interpretation, comparisons of drafts and provisions, surveys of research positions and legislative history.',
'Defines the disputed issue, presents competing arguments and compares normative changes before explaining reasons for adoption or reservation.',
'Precise, clearly structured Chinese, organizing arguments through classifications, relations between provisions and revisions; distinguishes statutory quotations from personal evaluation.']}
for person in data:
 vals=en[person['id']];person['biography']['en']=vals[0]
 for row,text in zip(person['persona'],vals[1:]):row['summary']['en']=[text]
p.write_text(json.dumps(data,ensure_ascii=False,indent=2))
