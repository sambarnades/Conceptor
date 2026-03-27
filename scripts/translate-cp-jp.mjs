import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'js', 'locales');
const filePath = join(LOCALES_DIR, 'jp.json');
const json = JSON.parse(readFileSync(filePath, 'utf8'));

json.prompt_course_presentation_structure_json = `- 完全で有効なJSONのみをコードブロックで生成してください。回答は必ず \`{\` で始まり \`}\` で終わること。他のテキストやコメントは一切不要です。
- ルートオブジェクトには以下を含めてください：
  - \`title\` : プレゼンテーションのタイトル。
  - \`slides\` : オブジェクトの配列。各オブジェクトは1枚のスライドを表します。

**スライドの種類別構造：**

1. **タイトル** (\`type: "title"\`) : \`title\`（メインタイトル）、\`subtitle\`（任意のサブタイトル）
2. **コンテンツ** (\`type: "content"\`) : \`title\`、\`text\`（Markdownを使用したテキスト：\`**太字**\`、\`*斜体*\`）
3. **コンテンツ＋表** (\`type: "content-with-table"\`) : \`title\`、\`text\`（Markdownを使用したテキスト）、\`table\` : \`headers\`（文字列の配列）と\`rows\`（文字列配列の配列）を持つオブジェクト
4. **問題** (\`type: "quiz"\`) : \`title\`、\`exercise\`（問題オブジェクト — 以下を参照）
5. **コンテンツ＋問題** (\`type: "content-quiz"\`) : \`title\`、\`text\`（Markdownを使用したテキスト）、\`exercise\`（問題オブジェクト）
6. **まとめ** (\`type: "summary"\`) : \`title\`、\`exercise\` に \`library: "H5P.Summary 1.10"\` を指定

**問題オブジェクトの種類別構造：**

各問題には \`library\` と以下に記載されたフィールドを含めます。指定されたデータ型を正確に守ってください。

1. **多肢選択** (\`library: "H5P.MultiChoice 1.16"\`) :
   - \`question\`（string）: 問題文。
   - \`answers\`（オブジェクトの配列）: 各オブジェクトは \`text\`（string）、\`correct\`（boolean）を持ち、任意で \`tipsAndFeedback\` : \`{ "tip": "...", "chosenFeedback": "..." }\` を含めます。
   - \`behaviour\` : 正解が1つの場合は \`{ singleAnswer: true }\`、複数の場合は \`{ singleAnswer: false }\`。
   - \`overallFeedback\`（4段階）

2. **正誤問題** (\`library: "H5P.TrueFalse 1.8"\`) :
   - \`question\`（string）: 評価する命題。
   - \`correct\`（string）: \`"true"\` または \`"false"\` — 必ず文字列で、booleanにしないこと。
   - \`feedbackOnCorrect\`（string）、\`feedbackOnWrong\`（string）

3. **穴埋め問題** (\`library: "H5P.Blanks 1.14"\`) :
   - \`taskDescription\`（string）: 短い指示文（1〜2文）。\`*単語*\` マーカーを入れることは禁止。
   - \`questions\`（文字列の配列）: 各要素は \`*単語*\` で空欄を示したテキストを含む文字列です。選択肢：\`*単語1/単語2*\`。ヒント：\`*単語:ヒント*\`。この配列にオブジェクトを入れないこと。
   - \`overallFeedback\`（4段階）

4. **単語ドラッグ** (\`library: "H5P.DragText 1.10"\`) :
   - \`taskDescription\`（string）: 明確な指示文。
   - \`textField\`（string）: ドラッグする各単語を \`*単語*\` で示した完全なテキスト。各単語は一意でなければなりません。文は \`\\n\` で区切ります。
   - \`overallFeedback\`（4段階）

5. **単語ハイライト** (\`library: "H5P.MarkTheWords 1.11"\`) :
   - \`taskDescription\`（string）: 明確な指示文。ここでのみ \`**太字**\` と \`*斜体*\` が使用可能。
   - \`textField\`（string）: ハイライトする各単語を \`*単語*\` で示したテキスト。1つのマーカーにつき1単語（\`*単語1* と *単語2*\`、\`*単語1 単語2*\` は不可）。\`*\` の前後にスペースを入れること。
   - \`overallFeedback\`（4段階）

6. **連続単一選択** (\`library: "H5P.SingleChoiceSet 1.11"\`) :
   - \`choices\`（オブジェクトの配列）: 各オブジェクトは \`question\`（string）と \`answers\`（文字列の配列 — 最初の回答が常に正解）を持ちます。
   - \`overallFeedback\`（4段階）

7. **要約** (\`library: "H5P.Summary 1.10"\`) :
   - \`intro\`（string）: 短い導入文。
   - \`summaries\`（オブジェクトの配列）: 各オブジェクトは \`summary\`（文字列の配列 — 最初が常に正解）を持ち、任意で \`tip\`（string）を含めます。
   - \`overallFeedback\`（4段階）

8. **ドラッグ＆ドロップ** (\`library: "H5P.DragQuestion 1.14"\`) :
   - \`title\`（string）: 生徒が行うべきことを説明する指示文。
   - \`dropZones\`（オブジェクトの配列）: 各オブジェクトは \`label\`（string）と \`correctElements\`（\`elements\` 内のインデックスの整数配列、0から開始）を持ちます。
   - \`elements\`（オブジェクトの配列）: 各オブジェクトは \`text\`（string、1〜4単語）を持ちます。
   - \`overallFeedback\`（4段階）

9. **対話カード** (\`library: "H5P.Dialogcards 1.9"\`) :
   - \`title\`（string）、\`description\`（string）
   - \`dialogs\`（オブジェクトの配列）: 各オブジェクトは \`text\`（string、表面）と \`answer\`（string、裏面）を持ちます。任意で \`tips\` : \`{ "front": "...", "back": "..." }\` を含めます。

**スコア付き問題（正誤問題と対話カードを除く）には、それぞれ独自の \`overallFeedback\`（4段階）を含めてください。**
- **書式設定：** 太字（\`**テキスト**\`）と斜体（\`*テキスト*\`）にはMarkdown構文を使用してください。
- **LaTeX：** 数式にはダブルエスケープで囲まれたLaTeX形式のみを使用してください：\`\\\\( ... \\\\)\`。単独の\`$\`記号は絶対に使用しないでください。例：\`\\\\( \\\\frac{1}{2} \\\\)\`、\`\\\\( \\\\sqrt{2} \\\\)\`、\`\\\\( \\\\alpha \\\\)\`、\`\\\\( x^{2} \\\\)\`、\`\\\\( \\\\mathbb{R} \\\\)\`、\`\\\\( \\\\sin(\\\\theta) \\\\)\`、\`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`、\`\\\\( x \\\\geq 0 \\\\)\`、\`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`。
- **フィードバック：** フィードバック（\`overallFeedback\`、\`tipsAndFeedback\`）にはLaTeXやMarkdownを含めないでください。プレーンテキストのみにしてください。`;

json.prompt_course_presentation_exemple_rendu = `\`\`\`json
{
  "title": "フランス革命",
  "slides": [
    {
      "type": "title",
      "title": "フランス革命",
      "subtitle": "1789年から1799年：政治的・社会的大変革"
    },
    {
      "type": "content",
      "title": "革命の原因",
      "text": "18世紀末のフランスは**深刻な危機**に直面していました：\\n- 財政危機：国家は多額の負債を抱えていた\\n- 社会的危機：三つの身分間の不平等\\n- 政治的危機：絶対王政への異議申し立て"
    },
    {
      "type": "content-with-table",
      "title": "出来事の年表",
      "text": "フランス革命の主要な日付：",
      "table": {
        "headers": ["日付", "出来事", "結果"],
        "rows": [
          ["1789年7月14日", "バスティーユ襲撃", "絶対王政崩壊の象徴"],
          ["1789年8月26日", "人権宣言", "市民的権利の基盤"]
        ]
      }
    },
    {
      "type": "quiz",
      "title": "知識の確認",
      "exercise": {
        "library": "H5P.MultiChoice 1.16",
        "question": "バスティーユ襲撃が行われた日付はいつですか？",
        "answers": [
          { "text": "1789年7月14日", "correct": true, "tipsAndFeedback": { "chosenFeedback": "正解！この日はフランスの国民の祝日になりました。" } },
          { "text": "1789年8月26日", "correct": false, "tipsAndFeedback": { "chosenFeedback": "いいえ、それは人権宣言の日付です。" } },
          { "text": "1789年5月5日", "correct": false },
          { "text": "1792年9月21日", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "革命の主要な日付を復習してください。" },
          { "from": 26, "to": 50, "feedback": "良いスタートです。続けましょう！" },
          { "from": 51, "to": 75, "feedback": "よくできました！" },
          { "from": 76, "to": 100, "feedback": "素晴らしい！" }
        ]
      }
    },
    {
      "type": "content-quiz",
      "title": "人権宣言",
      "text": "1789年8月26日の**人権宣言**は、*「人は生まれながらにして自由であり、権利において平等である」*と宣言しています。",
      "exercise": {
        "library": "H5P.TrueFalse 1.8",
        "question": "人権宣言は1791年に採択された。",
        "correct": "false",
        "feedbackOnCorrect": "正解！人権宣言は1789年8月26日に採択されました。",
        "feedbackOnWrong": "不正解。人権宣言は1791年ではなく、1789年8月26日に採択されました。"
      }
    },
    {
      "type": "quiz",
      "title": "文を完成させてください",
      "exercise": {
        "library": "H5P.Blanks 1.14",
        "taskDescription": "革命の出来事に関する欠けている単語を見つけてください。",
        "questions": [
          "*バスティーユ* 襲撃は *1789* 年7月14日に起きました。",
          "人権宣言は、人は *自由* で *平等:第一条を思い出してください* な権利を持って生まれると述べています。"
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "重要な日付と概念を復習してください。" },
          { "from": 26, "to": 50, "feedback": "良いスタートです。続けましょう！" },
          { "from": 51, "to": 75, "feedback": "よくできました！" },
          { "from": 76, "to": 100, "feedback": "素晴らしい！" }
        ]
      }
    },
    {
      "type": "content-quiz",
      "title": "革命の主要人物",
      "text": "多くの人物が革命に影響を与えました：**ロベスピエール**、**ダントン**、**ミラボー**など。",
      "exercise": {
        "library": "H5P.DragText 1.10",
        "taskDescription": "テキストの中の欠けている単語を元の位置に戻してください。",
        "textField": "*ロベスピエール* は恐怖政治の中心的人物です。\\n*ダントン* は革命の偉大な雄弁家でした。\\n*ミラボー* は王政と革命の調和を試みました。",
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "革命の人物を復習してください。" },
          { "from": 26, "to": 50, "feedback": "良いスタートです。続けましょう！" },
          { "from": 51, "to": 75, "feedback": "よくできました！" },
          { "from": 76, "to": 100, "feedback": "素晴らしい！" }
        ]
      }
    },
    {
      "type": "quiz",
      "title": "キーワードを特定してください",
      "exercise": {
        "library": "H5P.MarkTheWords 1.11",
        "taskDescription": "テキスト中の**日付**をクリックしてください。",
        "textField": "バスティーユ襲撃は *1789* *年* *7月* *14日* に起きました。共和制は *1792* *年* *9月* *21日* に宣言されました。",
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "日付をよく読み直してください。" },
          { "from": 26, "to": 50, "feedback": "良いスタートです。" },
          { "from": 51, "to": 75, "feedback": "よくできました！" },
          { "from": 76, "to": 100, "feedback": "素晴らしい！" }
        ]
      }
    },
    {
      "type": "quiz",
      "title": "クイックテスト",
      "exercise": {
        "library": "H5P.SingleChoiceSet 1.11",
        "choices": [
          {
            "question": "バスティーユが襲撃されたのは何年ですか？",
            "answers": ["1789年", "1791年", "1792年", "1799年"]
          },
          {
            "question": "人権宣言を起草したのは誰ですか？",
            "answers": ["国民議会", "ルイ16世", "ナポレオン・ボナパルト"]
          }
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "基本を復習してください。" },
          { "from": 26, "to": 50, "feedback": "良いスタートです。" },
          { "from": 51, "to": 75, "feedback": "よくできました！" },
          { "from": 76, "to": 100, "feedback": "素晴らしい！" }
        ]
      }
    },
    {
      "type": "summary",
      "title": "まとめ",
      "exercise": {
        "library": "H5P.Summary 1.10",
        "intro": "各グループについて正しい文を選んでください。",
        "summaries": [
          {
            "summary": [
              "バスティーユ襲撃は1789年に起きた",
              "バスティーユ襲撃は1791年に起きた",
              "バスティーユ襲撃は1792年に起きた"
            ]
          },
          {
            "summary": [
              "共和制は1792年9月21日に宣言された",
              "共和制は1789年7月14日に宣言された",
              "共和制は1789年5月5日に宣言された"
            ]
          }
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "授業の重要なポイントを復習してください。" },
          { "from": 26, "to": 50, "feedback": "良いスタートです。" },
          { "from": 51, "to": 75, "feedback": "よく理解しています。" },
          { "from": 76, "to": 100, "feedback": "完璧です！" }
        ]
      }
    }
  ]
}
\`\`\``;

writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log('jp.json: course_presentation traduit');
