import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'js', 'locales');
const filePath = join(LOCALES_DIR, 'zh.json');
const json = JSON.parse(readFileSync(filePath, 'utf8'));

// Structure bloc (repeated twice in the original, matching fr.json pattern)
const structureBlock = `- 仅生成一个完整且有效的JSON代码块。你的回答必须以 \`{\` 开头，以 \`}\` 结尾。不要添加任何其他文字或注释。
- 根对象必须包含：
  - \`title\`：演示文稿的标题。
  - \`slides\`：一个对象数组。每个对象代表一张幻灯片。

**幻灯片类型结构：**

1. **标题**（\`type: "title"\`）：\`title\`（主标题），\`subtitle\`（可选副标题）
2. **内容**（\`type: "content"\`）：\`title\`，\`text\`（使用Markdown格式的文本：\`**粗体**\`，\`*斜体*\`）
3. **内容+表格**（\`type: "content-with-table"\`）：\`title\`，\`text\`（使用Markdown格式的文本），\`table\`：包含 \`headers\`（字符串数组）和 \`rows\`（字符串数组的数组）的对象
4. **练习**（\`type: "quiz"\`）：\`title\`，\`exercise\`（练习对象——见下文）
5. **内容+练习**（\`type: "content-quiz"\`）：\`title\`，\`text\`（使用Markdown格式的文本），\`exercise\`（练习对象）
6. **总结**（\`type: "summary"\`）：\`title\`，\`exercise\` 使用 \`library: "H5P.Summary 1.10"\`

**练习对象类型结构：**

每个练习包含 \`library\` 以及下述字段。请严格遵守所示的数据类型。

1. **选择题**（\`library: "H5P.MultiChoice 1.16"\`）：
   - \`question\`（string）：题目描述。
   - \`answers\`（对象数组）：每个对象包含 \`text\`（string），\`correct\`（boolean），以及可选的 \`tipsAndFeedback\`：\`{ "tip": "...", "chosenFeedback": "..." }\`。
   - \`behaviour\`：如果只有一个正确答案则为 \`{ singleAnswer: true }\`，如果有多个则为 \`{ singleAnswer: false }\`。
   - \`overallFeedback\`（4个分段）

2. **判断题**（\`library: "H5P.TrueFalse 1.8"\`）：
   - \`question\`（string）：需要判断的陈述。
   - \`correct\`（string）：\`"true"\` 或 \`"false"\`——始终为字符串，绝不是布尔值。
   - \`feedbackOnCorrect\`（string），\`feedbackOnWrong\`（string）

3. **填空题**（\`library: "H5P.Blanks 1.14"\`）：
   - \`taskDescription\`（string）：简短说明（1-2句）。禁止在此处使用 \`*词语*\` 标记。
   - \`questions\`（字符串数组）：每个元素是一个包含用 \`*词语*\` 标记空白处的字符串。可选项：\`*词语1/词语2*\`。提示：\`*词语:提示*\`。此数组中绝不能包含对象。
   - \`overallFeedback\`（4个分段）

4. **拖拽文字**（\`library: "H5P.DragText 1.10"\`）：
   - \`taskDescription\`（string）：清晰的说明。
   - \`textField\`（string）：完整文本，用 \`*词语*\` 标记每个需要拖拽的词语。每个词语必须是唯一的。句子之间用 \`\\n\` 分隔。
   - \`overallFeedback\`（4个分段）

5. **标记词语**（\`library: "H5P.MarkTheWords 1.11"\`）：
   - \`taskDescription\`（string）：清晰的说明。仅在此处允许使用 \`**粗体**\` 和 \`*斜体*\`。
   - \`textField\`（string）：文本中用 \`*词语*\` 标记每个需要标记的词语。每个标记只能包含一个词语（\`*词语1* 和 *词语2*\`，绝不能写成 \`*词语1 词语2*\`）。\`*\` 前后需要空格。
   - \`overallFeedback\`（4个分段）

6. **单选题组**（\`library: "H5P.SingleChoiceSet 1.11"\`）：
   - \`choices\`（对象数组）：每个对象包含 \`question\`（string）和 \`answers\`（字符串数组——第一个答案始终是正确答案）。
   - \`overallFeedback\`（4个分段）

7. **摘要**（\`library: "H5P.Summary 1.10"\`）：
   - \`intro\`（string）：简短的引导语。
   - \`summaries\`（对象数组）：每个对象包含 \`summary\`（字符串数组——第一个始终是正确的）以及可选的 \`tip\`（string）。
   - \`overallFeedback\`（4个分段）

8. **拖放题**（\`library: "H5P.DragQuestion 1.14"\`）：
   - \`title\`（string）：说明学生需要做什么。
   - \`dropZones\`（对象数组）：每个对象包含 \`label\`（string）和 \`correctElements\`（整数数组 = \`elements\` 中的索引，从0开始）。
   - \`elements\`（对象数组）：每个对象包含 \`text\`（string，1到4个词）。
   - \`overallFeedback\`（4个分段）

9. **对话卡片**（\`library: "H5P.Dialogcards 1.9"\`）：
   - \`title\`（string），\`description\`（string）
   - \`dialogs\`（对象数组）：每个对象包含 \`text\`（string，正面）和 \`answer\`（string，背面）。可选 \`tips\`：\`{ "front": "...", "back": "..." }\`。

**每个计分练习（判断题和对话卡片除外）必须包含自己的 \`overallFeedback\`（4个分段）。**`;

json.prompt_course_presentation_structure_json = structureBlock + `
- **格式化：** 使用Markdown语法表示粗体（\`**文本**\`）和斜体（\`*文本*\`）。
- **LaTeX：** 对于数学公式，请仅使用双转义封装的LaTeX格式：\`\\\\( ... \\\\)\`。绝不要单独使用 \`$\` 符号。` + structureBlock + ` 示例：\`\\\\( \\\\frac{1}{2} \\\\)\`，\`\\\\( \\\\sqrt{2} \\\\)\`，\`\\\\( \\\\alpha \\\\)\`，\`\\\\( x^{2} \\\\)\`，\`\\\\( \\\\mathbb{R} \\\\)\`，\`\\\\( \\\\sin(\\\\theta) \\\\)\`，\`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`，\`\\\\( x \\\\geq 0 \\\\)\`，\`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`。
- **反馈：** 反馈内容（\`overallFeedback\`，\`tipsAndFeedback\`）不得包含LaTeX或Markdown。仅使用纯文本。`;

json.prompt_course_presentation_exemple_rendu = `\`\`\`json
{
  "title": "法国大革命",
  "slides": [
    {
      "type": "title",
      "title": "法国大革命",
      "subtitle": "1789年至1799年：政治与社会的剧变"
    },
    {
      "type": "content",
      "title": "大革命的起因",
      "text": "18世纪末的法国正经历一场**深刻的危机**：\\n- 财政危机：国家债台高筑\\n- 社会危机：三个等级之间严重不平等\\n- 政治危机：绝对君主制受到质疑"
    },
    {
      "type": "content-with-table",
      "title": "大事年表",
      "text": "法国大革命的重要日期：",
      "table": {
        "headers": ["日期", "事件", "影响"],
        "rows": [
          ["1789年7月14日", "攻占巴士底狱", "象征着专制制度的崩溃"],
          ["1789年8月26日", "《人权宣言》", "公民权利的基石"]
        ]
      }
    },
    {
      "type": "quiz",
      "title": "知识检测",
      "exercise": {
        "library": "H5P.MultiChoice 1.16",
        "question": "哪个日期标志着攻占巴士底狱？",
        "answers": [
          { "text": "1789年7月14日", "correct": true, "tipsAndFeedback": { "chosenFeedback": "正确！这一天后来成为了法国国庆日。" } },
          { "text": "1789年8月26日", "correct": false, "tipsAndFeedback": { "chosenFeedback": "不对，这是《人权宣言》发布的日期。" } },
          { "text": "1789年5月5日", "correct": false },
          { "text": "1792年9月21日", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "请复习大革命的重要日期。" },
          { "from": 26, "to": 50, "feedback": "有了一个好的开始，继续加油！" },
          { "from": 51, "to": 75, "feedback": "做得不错！" },
          { "from": 76, "to": 100, "feedback": "太棒了！" }
        ]
      }
    },
    {
      "type": "content-quiz",
      "title": "《人权宣言》",
      "text": "1789年8月26日的**《人权和公民权利宣言》**宣告*"人人生而自由，在权利上一律平等"*。",
      "exercise": {
        "library": "H5P.TrueFalse 1.8",
        "question": "《人权宣言》是在1791年通过的。",
        "correct": "false",
        "feedbackOnCorrect": "很好！它确实是在1789年8月26日通过的。",
        "feedbackOnWrong": "不对，《人权宣言》是在1789年8月26日通过的，而不是1791年。"
      }
    },
    {
      "type": "quiz",
      "title": "完成句子",
      "exercise": {
        "library": "H5P.Blanks 1.14",
        "taskDescription": "找出关于大革命事件的缺失词语。",
        "questions": [
          "攻占 *巴士底狱* 发生在1789年7月 *14* 日。",
          "《人权宣言》宣告人人生而 *自由* 且 *平等:想想第一条* 。"
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "请复习关键日期和概念。" },
          { "from": 26, "to": 50, "feedback": "有了一个好的开始，继续加油！" },
          { "from": 51, "to": 75, "feedback": "做得不错！" },
          { "from": 76, "to": 100, "feedback": "太棒了！" }
        ]
      }
    },
    {
      "type": "content-quiz",
      "title": "大革命的重要人物",
      "text": "许多人物在大革命中留下了深刻印记：**罗伯斯庇尔**、**丹东**、**米拉波**等。",
      "exercise": {
        "library": "H5P.DragText 1.10",
        "taskDescription": "将缺失的词语拖放到文本中。",
        "textField": "*罗伯斯庇尔* 是恐怖统治时期的关键人物。\\n*丹东* 是大革命中重要的演说家。\\n*米拉波* 曾试图调和君主制与革命。",
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "请复习大革命的重要人物。" },
          { "from": 26, "to": 50, "feedback": "有了一个好的开始，继续加油！" },
          { "from": 51, "to": 75, "feedback": "做得不错！" },
          { "from": 76, "to": 100, "feedback": "太棒了！" }
        ]
      }
    },
    {
      "type": "quiz",
      "title": "识别关键词",
      "exercise": {
        "library": "H5P.MarkTheWords 1.11",
        "taskDescription": "点击文本中提到的**日期**。",
        "textField": "巴士底狱于 *1789年* *7月* *14日* 被攻占。共和国于 *1792年* *9月* *21日* 宣告成立。",
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "请仔细阅读文中的日期。" },
          { "from": 26, "to": 50, "feedback": "有了一个好的开始。" },
          { "from": 51, "to": 75, "feedback": "做得不错！" },
          { "from": 76, "to": 100, "feedback": "太棒了！" }
        ]
      }
    },
    {
      "type": "quiz",
      "title": "快速测验",
      "exercise": {
        "library": "H5P.SingleChoiceSet 1.11",
        "choices": [
          {
            "question": "巴士底狱是在哪一年被攻占的？",
            "answers": ["1789年", "1791年", "1792年", "1799年"]
          },
          {
            "question": "谁起草了《人权宣言》？",
            "answers": ["国民议会", "国王路易十六", "拿破仑·波拿巴"]
          }
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "请复习基础知识。" },
          { "from": 26, "to": 50, "feedback": "有了一个开始。" },
          { "from": 51, "to": 75, "feedback": "做得不错！" },
          { "from": 76, "to": 100, "feedback": "太棒了！" }
        ]
      }
    },
    {
      "type": "summary",
      "title": "总结",
      "exercise": {
        "library": "H5P.Summary 1.10",
        "intro": "为每组选择正确的陈述。",
        "summaries": [
          {
            "summary": [
              "巴士底狱于1789年被攻占",
              "巴士底狱于1791年被攻占",
              "巴士底狱于1792年被攻占"
            ]
          },
          {
            "summary": [
              "共和国于1792年9月21日宣告成立",
              "共和国于1789年7月14日宣告成立",
              "共和国于1789年5月5日宣告成立"
            ]
          }
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "请复习课程要点。" },
          { "from": 26, "to": 50, "feedback": "有了一个好的开始。" },
          { "from": 51, "to": 75, "feedback": "对这个主题掌握得不错。" },
          { "from": 76, "to": 100, "feedback": "完美！" }
        ]
      }
    }
  ]
}
\`\`\``;

writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log('zh.json: course_presentation traduit');
