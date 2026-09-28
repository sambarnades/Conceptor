#!/usr/bin/env node
/**
 * Écrit ce que Caramelia doit savoir des parcours à créer, dans les 12 langues.
 *
 * **Pourquoi un générateur.** Caramelia ne savait pas quels parcours on peut
 * créer : son aide ne nommait aucune trame, et les fiches du RAG en ligne
 * dataient d'avant les modules de la plateforme. Écrire ces listes à la main
 * dans douze langues, c'est les voir diverger au premier ajout. Ici tout ce qui
 * peut venir de la source en vient : `js/parcours/templates.js` (les trames,
 * leurs ampleurs et modalités), `js/locales/<lang>.json` (noms et descriptions
 * au caractère près de l'écran), `assets/data/tutorial/<lang>.json` (le texte
 * des modules de la plateforme). Seuls les conseils de construction, tirés de
 * l'état de l'art (D81), sont rédigés ici.
 *
 * Sorties :
 *   js/caramelia/tuto-rag/<lang>.md   la section « trames » entre
 *       <!-- parcours-trames --> et <!-- /parcours-trames -->, remplacée à
 *       chaque passage (jamais dupliquée) ; Caramelia la lit sans ingestion ;
 *   ../rag/caramelia/chunks/<lang>/parcours-{trames,modules,conseils}.md
 *       les fiches du RAG en ligne, si le dépôt `rag` est présent à côté.
 *       Leur INGESTION reste une décision à part : elle écrase la collection.
 *
 *   node scripts/aide-parcours.mjs             écrit
 *   node scripts/aide-parcours.mjs --verifier  échoue si une sortie n'est pas à jour
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { TRAMES } from '../js/parcours/templates.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAG = resolve(ROOT, '../rag/caramelia');
const VERSION = '1.0.0';
const DEBUT = '<!-- parcours-trames -->';
const FIN = '<!-- /parcours-trames -->';
const FAMILLES = ['decouvrir', 'memoriser', 'exercer', 'organiser', 'discuter', 'cooperer', 'produire'];
const TOUTES = ['presentiel', 'distanciel', 'hybride'];

/**
 * Ce qui ne se déduit pas des locales. {P} : « Un parcours » ; {MIROIR} : le
 * titre du panneau ; {FAMILLES} : les sept familles, telles qu'à l'écran.
 */
const TEXTES = {
    fr: {
        atelier: 'Atelier de parcours', sep: ', ',
        trames: 'Choisir une trame',
        intro: 'Après **{P}**, la trame donne le déroulé que l’IA adapte au sujet. La liste affichée dépend de la modalité et de l’ampleur choisies ; chaque activité reste modifiable dans le plan.',
        conseils: 'Bien construire son parcours',
        relecture: 'Dans **{P}**, Caramel relit le plan avant toute génération et signale ce qui manque, sans jamais bloquer : un objectif général, un objectif par étape, au moins une activité qui vérifie les acquis, une correction pendant l’entraînement, des types d’activité qui alternent, une durée qui tient. Le panneau **{MIROIR}** compte les activités en sept familles — {FAMILLES} — et nomme celles qui manquent ; aucune répartition n’est imposée.',
        aide: 'Ce qui aide vraiment à apprendre',
        principes: [
            'Se tester plutôt que relire : au moins une activité qui vérifie, avec un retour qui explique l’erreur.',
            'Revenir plus tard sur ce qu’on a vu au début : le test de fin porte sur tout le parcours.',
            'Guider la découverte par des questions, puis formuler clairement ce qu’il faut retenir.',
            'Faire suivre la critique des pairs d’une version améliorée.',
            'En formation d’enseignants : un exemple de pratique commenté, un essai, un plan d’action daté, la mise en œuvre en classe, puis le retour d’expérience.',
        ],
        renvoi: 'La trame **{A}** fait essayer ces méthodes sur le sujet du cours ; pour une formation d’enseignants, la trame **{F}** suit le dernier point.',
        regles: 'Un test ou un quiz note des connaissances qui ont une bonne réponse ; pour recueillir des pratiques, des habitudes ou des avis, choisissez un questionnaire, une enquête ou un sondage. Un document collaboratif ou un wiki se poursuit d’une étape à l’autre : on n’en ouvre pas un second pour améliorer le même travail.',
    },
    en: {
        atelier: 'Course workshop', sep: ', ',
        trames: 'Choosing a template',
        intro: 'After **{P}**, the template sets the sequence that the AI adapts to your topic. The list shown depends on the delivery mode and scope you choose; every activity can still be changed in the plan.',
        conseils: 'Building a good pathway',
        relecture: 'In **{P}**, Caramel reviews the plan before anything is generated and points out what is missing, without ever blocking: an overall objective, an objective for each stage, at least one activity that checks learning, correction during practice, activity types that alternate, a workable total duration. The **{MIROIR}** panel counts activities in seven families — {FAMILLES} — and names those that are missing; no ideal balance is imposed.',
        aide: 'What really helps people learn',
        principes: [
            'Test yourself rather than re-read: at least one activity that checks learning, with feedback that explains the mistake.',
            'Come back later to what was seen at the start: the final test covers the whole pathway.',
            'Guide discovery with questions, then state clearly what should be remembered.',
            'Follow peer critique with an improved version.',
            'In teacher training: a commented example of practice, a try-out, a dated action plan, classroom implementation, then feedback on the experience.',
        ],
        renvoi: 'The **{A}** template has learners try these methods on the course topic; for teacher training, the **{F}** template follows the last point.',
        regles: 'A test or quiz grades knowledge that has a right answer; to collect practices, habits or opinions, choose a questionnaire, a survey or a poll. A collaborative document or wiki carries on from one stage to the next: do not open a second one to improve the same work.',
    },
    es: {
        atelier: 'Taller de itinerarios', sep: ', ',
        trames: 'Elegir una plantilla',
        intro: 'Tras **{P}**, la plantilla da el desarrollo que la IA adapta al tema. La lista mostrada depende de la modalidad y la extensión elegidas; cada actividad sigue siendo modificable en el plan.',
        conseils: 'Construir bien el itinerario',
        relecture: 'En **{P}**, Caramel revisa el plan antes de cualquier generación y señala lo que falta, sin bloquear nunca: un objetivo general, un objetivo por etapa, al menos una actividad que compruebe lo aprendido, corrección durante la práctica, tipos de actividad que se alternan y una duración razonable. El panel **{MIROIR}** cuenta las actividades en siete familias — {FAMILLES} — y nombra las que faltan; no se impone ningún reparto.',
        aide: 'Lo que de verdad ayuda a aprender',
        principes: [
            'Ponerse a prueba en lugar de releer: al menos una actividad que compruebe, con una retroalimentación que explique el error.',
            'Volver más tarde sobre lo visto al principio: la prueba final abarca todo el itinerario.',
            'Guiar el descubrimiento con preguntas y formular después con claridad lo que hay que retener.',
            'Hacer que la crítica entre iguales vaya seguida de una versión mejorada.',
            'En formación docente: un ejemplo de práctica comentado, un ensayo, un plan de acción con fechas, la puesta en práctica en clase y la puesta en común de la experiencia.',
        ],
        renvoi: 'La plantilla **{A}** hace probar estos métodos con el tema del curso; para la formación docente, la plantilla **{F}** sigue el último punto.',
        regles: 'Una prueba o un cuestionario calificado evalúa conocimientos que tienen una respuesta correcta; para recoger prácticas, hábitos u opiniones, elija un cuestionario sin nota, una encuesta o un sondeo. Un documento colaborativo o una wiki continúa de una etapa a otra: no se abre uno nuevo para mejorar el mismo trabajo.',
    },
    de: {
        atelier: 'Lernpfad-Werkstatt', sep: ', ',
        trames: 'Eine Vorlage wählen',
        intro: 'Nach **{P}** gibt die Vorlage den Ablauf vor, den die KI an Ihr Thema anpasst. Die angezeigte Liste hängt von Unterrichtsform und Umfang ab; jede Aktivität bleibt im Plan veränderbar.',
        conseils: 'Einen guten Lernpfad bauen',
        relecture: 'Nach Auswahl von **{P}** prüft Caramel den Plan vor jeder Generierung und zeigt, was fehlt – ohne je zu blockieren: ein Gesamtziel, ein Ziel pro Abschnitt, mindestens eine Aktivität, die das Gelernte überprüft, Korrektur beim Üben, abwechselnde Aktivitätstypen und eine tragbare Gesamtdauer. Das Feld **{MIROIR}** zählt die Aktivitäten in sieben Kategorien – {FAMILLES} – und nennt die fehlenden; eine Idealverteilung wird nicht vorgegeben.',
        aide: 'Was beim Lernen wirklich hilft',
        principes: [
            'Sich selbst abfragen statt wiederlesen: mindestens eine Aktivität, die überprüft, mit einer Rückmeldung, die den Fehler erklärt.',
            'Später auf das zurückkommen, was am Anfang behandelt wurde: Der Abschlusstest umfasst den ganzen Lernpfad.',
            'Das Entdecken mit Fragen lenken und danach klar festhalten, was man sich merken soll.',
            'Auf die Kritik durch Mitlernende folgt eine verbesserte Fassung.',
            'In der Lehrkräftefortbildung: ein kommentiertes Praxisbeispiel, ein Ausprobieren, ein datierter Aktionsplan, die Umsetzung im Unterricht und der Erfahrungsaustausch.',
        ],
        renvoi: 'Die Vorlage **{A}** lässt diese Methoden am Thema des Kurses ausprobieren; für die Lehrkräftefortbildung folgt die Vorlage **{F}** dem letzten Punkt.',
        regles: 'Ein Test oder Quiz bewertet Wissen, das eine richtige Antwort hat; um Praktiken, Gewohnheiten oder Meinungen zu erheben, wählen Sie einen Fragebogen, eine Umfrage oder eine Abstimmung. Ein gemeinsames Dokument oder Wiki wird von Abschnitt zu Abschnitt fortgeführt: Für dieselbe Arbeit wird kein zweites eröffnet.',
    },
    it: {
        atelier: 'Laboratorio dei percorsi', sep: ', ',
        trames: 'Scegliere un modello',
        intro: 'Dopo **{P}**, il modello dà lo svolgimento che l’IA adatta all’argomento. L’elenco mostrato dipende dalla modalità e dall’ampiezza scelte; ogni attività resta modificabile nel piano.',
        conseils: 'Costruire bene il percorso',
        relecture: 'Con **{P}**, Caramel rilegge il piano prima di ogni generazione e segnala ciò che manca, senza mai bloccare: un obiettivo generale, un obiettivo per fase, almeno un’attività che verifica gli apprendimenti, una correzione durante l’esercizio, tipi di attività che si alternano, una durata sostenibile. Il pannello **{MIROIR}** conta le attività in sette famiglie — {FAMILLES} — e indica quelle assenti; nessuna ripartizione è imposta.',
        aide: 'Ciò che aiuta davvero ad apprendere',
        principes: [
            'Mettersi alla prova invece di rileggere: almeno un’attività che verifica, con un riscontro che spiega l’errore.',
            'Tornare più tardi su ciò che si è visto all’inizio: il test finale riguarda tutto il percorso.',
            'Guidare la scoperta con domande, poi formulare chiaramente ciò che va ricordato.',
            'Far seguire alla critica tra pari una versione migliorata.',
            'Nella formazione degli insegnanti: un esempio di pratica commentato, una prova, un piano d’azione datato, la messa in pratica in classe e il ritorno sull’esperienza.',
        ],
        renvoi: 'Il modello **{A}** fa provare questi metodi sull’argomento del corso; per la formazione degli insegnanti, il modello **{F}** segue l’ultimo punto.',
        regles: 'Un test o un quiz valuta conoscenze che hanno una risposta giusta; per raccogliere pratiche, abitudini o opinioni, scegli un questionario, un’indagine o un sondaggio. Un documento collaborativo o un wiki prosegue da una fase all’altra: non se ne apre un secondo per migliorare lo stesso lavoro.',
    },
    nl: {
        atelier: 'Leerpad-atelier', sep: ', ',
        trames: 'Een sjabloon kiezen',
        intro: 'Na **{P}** bepaalt het sjabloon het verloop dat de AI aan uw onderwerp aanpast. De getoonde lijst hangt af van de gekozen lesvorm en omvang; elke activiteit blijft aanpasbaar in het plan.',
        conseils: 'Een goed leerpad opbouwen',
        relecture: 'Bij **{P}** leest Caramel het plan na vóór elke generatie en meldt wat ontbreekt, zonder ooit te blokkeren: een algemeen doel, een doel per stap, minstens één activiteit die de kennis controleert, correctie tijdens het oefenen, afwisselende activiteitstypen en een haalbare duur. Het paneel **{MIROIR}** telt de activiteiten in zeven categorieën — {FAMILLES} — en noemt de ontbrekende; er wordt geen verdeling opgelegd.',
        aide: 'Wat echt helpt om te leren',
        principes: [
            'Jezelf overhoren in plaats van herlezen: minstens één activiteit die controleert, met feedback die de fout uitlegt.',
            'Later terugkomen op wat aan het begin aan bod kwam: de eindtoets gaat over het hele leerpad.',
            'Het ontdekken sturen met vragen en daarna helder formuleren wat je moet onthouden.',
            'Na de feedback van medeleerlingen volgt een verbeterde versie.',
            'In de professionalisering van leraren: een becommentarieerd praktijkvoorbeeld, een oefening, een actieplan met data, de uitvoering in de klas en de terugkoppeling op de ervaring.',
        ],
        renvoi: 'Het sjabloon **{A}** laat deze methoden uitproberen op het onderwerp van de les; voor de professionalisering van leraren volgt het sjabloon **{F}** het laatste punt.',
        regles: 'Een toets of quiz beoordeelt kennis waarop een juist antwoord bestaat; om werkwijzen, gewoonten of meningen te verzamelen, kies je een vragenlijst, een enquête of een peiling. Een gedeeld document of wiki loopt door van stap tot stap: voor hetzelfde werk open je geen tweede.',
    },
    pt: {
        atelier: 'Ateliê de percursos', sep: ', ',
        trames: 'Escolher um modelo',
        intro: 'Depois de **{P}**, o modelo dá o desenvolvimento que a IA adapta ao tema. A lista apresentada depende da modalidade e da extensão escolhidas; cada atividade continua editável no plano.',
        conseils: 'Construir bem o percurso',
        relecture: 'Em **{P}**, o Caramel revê o plano antes de qualquer geração e assinala o que falta, sem nunca bloquear: um objetivo geral, um objetivo por etapa, pelo menos uma atividade que verifica as aprendizagens, correção durante o treino, tipos de atividade que alternam e uma duração sustentável. O painel **{MIROIR}** conta as atividades em sete famílias — {FAMILLES} — e indica as que faltam; nenhuma distribuição é imposta.',
        aide: 'O que ajuda mesmo a aprender',
        principes: [
            'Testar-se em vez de reler: pelo menos uma atividade que verifica, com um feedback que explica o erro.',
            'Voltar mais tarde ao que se viu no início: o teste final abrange todo o percurso.',
            'Orientar a descoberta com perguntas e depois formular com clareza o que é preciso reter.',
            'Fazer seguir a crítica entre pares de uma versão melhorada.',
            'Na formação de professores: um exemplo de prática comentado, um ensaio, um plano de ação com datas, a aplicação em aula e o balanço da experiência.',
        ],
        renvoi: 'O modelo **{A}** faz experimentar estes métodos no tema do curso; para a formação de professores, o modelo **{F}** segue o último ponto.',
        regles: 'Um teste ou quiz avalia conhecimentos que têm uma resposta certa; para recolher práticas, hábitos ou opiniões, escolha um questionário, um inquérito ou uma sondagem. Um documento colaborativo ou uma wiki continua de uma etapa para a outra: não se abre um segundo para melhorar o mesmo trabalho.',
    },
    ar: {
        atelier: 'ورشة المسارات', sep: '، ',
        trames: 'اختيار قالب',
        intro: 'بعد **{P}**، يحدد القالب التسلسل الذي يكيّفه الذكاء الاصطناعي مع الموضوع. تتوقف القائمة المعروضة على نمط التعليم والنطاق المختارين، ويبقى كل نشاط قابلًا للتعديل في الخطة.',
        conseils: 'بناء مسار جيد',
        relecture: 'في **{P}**، يراجع Caramel الخطة قبل أي توليد ويشير إلى ما ينقص، من دون أن يمنع المتابعة أبدًا: هدف عام، وهدف لكل مرحلة، ونشاط واحد على الأقل يتحقق من المكتسبات، وتصحيح أثناء التمرّن، وأنواع أنشطة متناوبة، ومدة معقولة. وتَعُدّ لوحة **{MIROIR}** الأنشطة في سبع فئات — {FAMILLES} — وتسمّي الفئات الغائبة، دون فرض أي توزيع.',
        aide: 'ما يساعد فعلًا على التعلّم',
        principes: [
            'اختبار النفس بدل إعادة القراءة: نشاط واحد على الأقل يتحقق من المكتسبات، مع تغذية راجعة تشرح الخطأ.',
            'العودة لاحقًا إلى ما دُرس في البداية: يشمل الاختبار النهائي المسار كله.',
            'توجيه الاكتشاف بأسئلة، ثم صياغة ما يجب الاحتفاظ به بوضوح.',
            'إتباع نقد الأقران بنسخة محسّنة.',
            'في تكوين المعلمين: مثال مشروح لممارسة، ثم تجربة، وخطة عمل مؤرخة، والتطبيق في القسم، ثم العودة إلى التجربة.',
        ],
        renvoi: 'يجعل قالب **{A}** المتعلمين يجرّبون هذه الطرق على موضوع الدرس؛ ولتكوين المعلمين، يتبع قالب **{F}** النقطة الأخيرة.',
        regles: 'يقيّم الاختبار أو المسابقة معارف لها إجابة صحيحة؛ ولجمع الممارسات أو العادات أو الآراء، اختر استبيانًا أو استطلاعًا أو تصويتًا. ويستمر المستند التشاركي أو الويكي من مرحلة إلى أخرى: لا يُفتح مستند ثانٍ لتحسين العمل نفسه.',
    },
    zh: {
        atelier: '学习路径工作台', sep: '、',
        trames: '选择模板',
        intro: '选择 **{P}** 后，模板给出流程，由人工智能根据主题调整。显示的列表取决于所选的教学方式和规模；每个活动在方案中仍可修改。',
        conseils: '构建一条好的学习路径',
        relecture: '在 **{P}** 中，Caramel 会在任何生成之前审阅方案，指出缺少的内容，但从不阻止继续：总体目标、每个阶段的目标、至少一个检验学习成果的活动、练习中的纠正、交替的活动类型以及合理的总时长。**{MIROIR}** 面板把活动分为七类——{FAMILLES}——并指出缺少的类别；不强制任何比例。',
        aide: '真正有助于学习的做法',
        principes: [
            '自我测试而不是重读：至少安排一个检验活动，并提供解释错误的反馈。',
            '稍后回顾开头学过的内容：期末测试覆盖整条学习路径。',
            '用问题引导探索，然后清楚地总结需要记住的内容。',
            '同伴评议之后，要有一个改进后的版本。',
            '在教师培训中：一个带点评的实践示例、一次尝试、一份注明日期的行动计划、在课堂中实施，然后交流经验。',
        ],
        renvoi: '**{A}** 模板让学习者在课程主题上尝试这些方法；教师培训可使用 **{F}** 模板，它遵循最后一点。',
        regles: '测试或测验评估有正确答案的知识；如需收集做法、习惯或意见，请选择问卷、调查或投票。协作文档或维基在各阶段之间延续：不要为改进同一项工作再开一个新的。',
    },
    jp: {
        atelier: '学習コース工房', sep: '、',
        trames: 'テンプレートを選ぶ',
        intro: '**{P}** を選ぶと、テンプレートが流れを示し、AI がテーマに合わせて調整します。表示される一覧は選んだ授業形態と規模によって変わり、各アクティビティは計画で変更できます。',
        conseils: 'よい学習パスをつくる',
        relecture: '**{P}** では、Caramel が生成の前に計画を見直し、足りないものを指摘します（進行を止めることはありません）：全体目標、各段階の目標、学習を確かめるアクティビティが少なくとも一つ、練習中の訂正、交互に並ぶアクティビティの種類、無理のない所要時間。**{MIROIR}** パネルはアクティビティを7つの分類（{FAMILLES}）で数え、欠けている分類を示します。理想の配分は押しつけません。',
        aide: '本当に学びに役立つこと',
        principes: [
            '読み返すより自分をテストする：誤りを説明するフィードバック付きで、学習を確かめるアクティビティを少なくとも一つ。',
            '最初に学んだことに後で戻る：最後のテストは学習パス全体を対象にする。',
            '問いで発見を導き、そのあと覚えるべきことをはっきり言葉にする。',
            '仲間同士の講評のあとに、改善した版をつくる。',
            '教員研修では：解説つきの実践例、試行、日付入りの行動計画、授業での実践、そして経験の振り返り。',
        ],
        renvoi: '**{A}** テンプレートでは、授業のテーマでこれらの方法を試します。教員研修には、最後の項目に沿った **{F}** テンプレートを使います。',
        regles: 'テストやクイズは正解のある知識を評価します。実践や習慣、意見を集めるには、アンケート、調査、投票を選びます。共同編集ドキュメントやウィキは段階をまたいで続けて使い、同じ作業を改善するために新しいものを開きません。',
    },
    el: {
        atelier: 'Εργαστήριο διαδρομών', sep: ', ',
        trames: 'Επιλογή προτύπου',
        intro: 'Μετά το **{P}**, το πρότυπο δίνει την πορεία που η ΤΝ προσαρμόζει στο θέμα. Η λίστα που εμφανίζεται εξαρτάται από τον τρόπο διδασκαλίας και την έκταση· κάθε δραστηριότητα παραμένει τροποποιήσιμη στο σχέδιο.',
        conseils: 'Πώς χτίζεται μια καλή διαδρομή',
        relecture: 'Στο **{P}**, το Caramel ελέγχει το σχέδιο πριν από κάθε δημιουργία και επισημαίνει ό,τι λείπει, χωρίς ποτέ να μπλοκάρει: έναν γενικό στόχο, έναν στόχο ανά στάδιο, τουλάχιστον μία δραστηριότητα που ελέγχει τις γνώσεις, διόρθωση κατά την εξάσκηση, τύπους δραστηριοτήτων που εναλλάσσονται και μια ρεαλιστική διάρκεια. Ο πίνακας **{MIROIR}** μετρά τις δραστηριότητες σε επτά κατηγορίες — {FAMILLES} — και κατονομάζει όσες λείπουν· δεν επιβάλλεται καμία κατανομή.',
        aide: 'Τι βοηθά πραγματικά στη μάθηση',
        principes: [
            'Αυτοέλεγχος αντί για ξαναδιάβασμα: τουλάχιστον μία δραστηριότητα ελέγχου, με ανατροφοδότηση που εξηγεί το λάθος.',
            'Επιστροφή αργότερα σε ό,τι διδάχτηκε στην αρχή: το τελικό τεστ καλύπτει όλη τη διαδρομή.',
            'Καθοδήγηση της ανακάλυψης με ερωτήσεις και έπειτα σαφής διατύπωση όσων πρέπει να συγκρατηθούν.',
            'Η κριτική από συμμαθητές ακολουθείται από βελτιωμένη εκδοχή.',
            'Στην επιμόρφωση εκπαιδευτικών: ένα σχολιασμένο παράδειγμα πρακτικής, μια δοκιμή, ένα χρονολογημένο σχέδιο δράσης, η εφαρμογή στην τάξη και η ανασκόπηση της εμπειρίας.',
        ],
        renvoi: 'Το πρότυπο **{A}** βάζει τους εκπαιδευόμενους να δοκιμάσουν αυτές τις μεθόδους στο θέμα του μαθήματος· για την επιμόρφωση εκπαιδευτικών, το πρότυπο **{F}** ακολουθεί το τελευταίο σημείο.',
        regles: 'Ένα τεστ ή κουίζ βαθμολογεί γνώσεις που έχουν σωστή απάντηση· για να συγκεντρώσετε πρακτικές, συνήθειες ή απόψεις, επιλέξτε ερωτηματολόγιο, έρευνα ή ψηφοφορία. Ένα συνεργατικό έγγραφο ή wiki συνεχίζεται από στάδιο σε στάδιο: δεν ανοίγει δεύτερο για τη βελτίωση της ίδιας εργασίας.',
    },
    br: {
        atelier: 'Stal an heuliadoù', sep: ', ',
        trames: 'Dibab ur patrom',
        intro: 'Goude **{P}**, ar patrom a ro an droienn a vez azasaet gant an IA d’ar sujed. Ar roll diskouezet a zepant eus ar mod kelenn hag eus ar ment dibabet ; pep obererezh a c’haller kemmañ c’hoazh er steuñv.',
        conseils: 'Sevel un hent mat',
        relecture: 'Gant **{P}**, Caramel a adlenn ar steuñv a-raok pep genel hag a verk ar pezh a vank, hep stankañ biskoazh : ur pal hollek, ur pal evit pep pazenn, da nebeutañ un obererezh a wir an deskadurezh, un difazierezh e-pad ar pleustr, seurtoù obererezhioù a gemm, ur padelezh a zalc’h. Ar banell **{MIROIR}** a gont an obererezhioù e seizh familh — {FAMILLES} — hag a envel ar re a vank ; ne vez rediet ingaladur ebet.',
        aide: 'Ar pezh a sikour da vat da zeskiñ',
        principes: [
            'En em amprouiñ kentoc’h eget adlenn : da nebeutañ un obererezh a wir, gant un distro a zispleg ar fazi.',
            'Distreiñ diwezhatoc’h d’ar pezh a zo bet gwelet er penn-kentañ : an amprouadenn diwezhañ a bled gant an hent a-bezh.',
            'Hentañ an dizoloadenn gant goulennoù, ha goude lavaret sklaer ar pezh a zo da zerc’hel soñj.',
            'Lakaat ur stumm gwellaet da heuliañ burutelladenn ar re all.',
            'E stummadur ar gelennerien : ur skouer pleustr displeget, un amprouadenn, ur steuñv-ober deiziataet, al lakaat e pleustr er c’hlas, ha goude un eskemm war an arnodenn.',
        ],
        renvoi: 'Ar patrom **{A}** a lak da amprouiñ an doareoù-se war sujed ar gentel ; evit stummadur ar gelennerien, ar patrom **{F}** a heuilh ar poent diwezhañ.',
        regles: 'Un amprouadenn pe ur kwiz a notenn anaoudegezhioù o deus ur respont mat ; evit dastum boazioù pe alioù, dibabit ur goulennaoueg, un enklask pe ur votadeg. Un teul kenlabour pe ur wiki a gendalc’h eus ur bazenn d’eben : n’eus ket da zigeriñ un eil evit gwellaat an hevelep labour.',
    },
};

const lireJson = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

function donnees(lang) {
    const loc = lireJson(`js/locales/${lang}.json`);
    const x = TEXTES[lang];
    const P = loc.parcours_commutateur_parcours;
    const trames = TRAMES.map(tr => {
        const reperes = tr.ampleurs.map(a => loc[`parcours_ampleur_${a}`]);
        if (TOUTES.some(f => !tr.formats.includes(f))) reperes.push(...tr.formats.map(f => loc[`parcours_format_${f}`]));
        return `- **${loc[tr.nameKey]}** — ${loc[tr.descKey]} *(${reperes.join(' · ')})*`;
    });
    const corpsTrames = [x.intro.replace('{P}', P), '', ...trames].join('\n');

    // Les modules de la plateforme : le texte même du tutoriel, du titre à la note « À faire ».
    const blocs = lireJson(`assets/data/tutorial/${lang}.json`).chapters.find(c => c.id === 'parcours').blocks;
    const debut = blocs.findIndex(b => b.type === 'h');
    const partie = blocs.slice(debut, blocs.findIndex((b, i) => i > debut && b.type === 'tip') + 1);
    const titreModules = partie[0].text;
    const corpsModules = partie.slice(1).flatMap(b => b.type === 'list' ? [b.items.map(i => `- ${i}`).join('\n')]
        : b.type === 'shot' ? [] : [b.text]).join('\n\n');

    const familles = FAMILLES.map(f => loc[`parcours_type_${f}`]).join(x.sep);
    const corpsConseils = [
        x.relecture.replace('{P}', P).replace('{MIROIR}', loc.parcours_types_titre).replace('{FAMILLES}', familles), '',
        `## ${x.aide}`, '', ...x.principes.map(p => `- ${p}`), '',
        // Nommer les trames qui mettent ces conseils en œuvre : sans cela, « apprendre à
        // réviser » ou « formation d'enseignants » ne ramenaient pas vers elles (recherche du 28-09).
        x.renvoi.replace('{A}', loc.parcours_t_apprendre_name).replace('{F}', loc.parcours_t_formation_name), '', x.regles,
    ].join('\n');

    const texte = [corpsTrames, corpsModules, corpsConseils].join('\n');
    if (/undefined|\{[APFM]\}|\{MIROIR\}|\{FAMILLES\}|\*\*parcours_/.test(texte)) throw new Error(`${lang} : libellé manquant`);
    return { x, corpsTrames, titreModules, corpsModules, corpsConseils };
}

function fiche(lang, code, titre, corps) {
    return ['---', 'referentiel: caramelia', `code: ${code}`, `titre: "${titre}"`, `lang: ${lang}`,
        'categorie: integration-plateforme', `breadcrumb: "Caramel > ${titre}"`, `version: ${VERSION}`, '---', '',
        `> Contexte : Caramel — ${titre}`, '', `# ${titre}`, '', corps, ''].join('\n');
}

const verifier = process.argv.includes('--verifier');
const ecarts = [];
const ecrire = (chemin, contenu) => {
    if (existsSync(chemin) && readFileSync(chemin, 'utf8') === contenu) return;
    if (verifier) ecarts.push(chemin); else writeFileSync(chemin, contenu);
};
for (const lang of Object.keys(TEXTES)) {
    const d = donnees(lang);
    const chemin = join(ROOT, `js/caramelia/tuto-rag/${lang}.md`);
    const avant = readFileSync(chemin, 'utf8');
    const bloc = `${DEBUT}\n### ${d.x.trames}\n\n${d.corpsTrames}\n${FIN}`;
    let apres;
    if (avant.includes(DEBUT)) {
        apres = avant.slice(0, avant.indexOf(DEBUT)) + bloc + avant.slice(avant.indexOf(FIN) + FIN.length);
    } else {
        // Dans la section du parcours, juste avant sa fermeture.
        const fin = avant.indexOf('<!-- /parcours-complet -->');
        if (fin < 0) throw new Error(`${lang} : section du parcours introuvable`);
        apres = avant.slice(0, fin).replace(/\n*$/, '\n\n') + bloc + '\n' + avant.slice(fin);
    }
    ecrire(chemin, apres);
    if (existsSync(RAG)) {
        ecrire(join(RAG, `chunks/${lang}/parcours-trames.md`), fiche(lang, 'parcours-trames', `${d.x.atelier} · ${d.x.trames}`, d.corpsTrames));
        ecrire(join(RAG, `chunks/${lang}/parcours-modules.md`), fiche(lang, 'parcours-modules', `${d.x.atelier} · ${d.titreModules}`, d.corpsModules));
        ecrire(join(RAG, `chunks/${lang}/parcours-conseils.md`), fiche(lang, 'parcours-conseils', `${d.x.atelier} · ${d.x.conseils}`, d.corpsConseils));
    }
}
if (verifier && ecarts.length) { console.error(`Pas à jour — relancer node scripts/aide-parcours.mjs :\n${ecarts.join('\n')}`); process.exit(1); }
console.log(verifier ? 'Aide et fiches du parcours à jour.'
    : `Aide du parcours écrite : ${TRAMES.length} trames, modules, conseils (12 langues${existsSync(RAG) ? ', aide et RAG' : ', aide seule'}).`);
