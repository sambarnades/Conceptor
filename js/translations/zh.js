const translations_zh = {
    subtitle: "辅助创建 Magistère 与 Éléa 的资源与活动",
    help_button: "帮助",
    help_modal_title: "🚀 面向教师的 Caramel 全面指南",
    help_modal_content: `
    <p>欢迎使用 <strong>Caramel</strong>！本指南将以循序渐进的方式引导你，即使是初学者也能轻松上手。我们的目标是帮助你以简单高效的方式创建交互式学习活动。</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> 描述</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> 选择</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> 生成</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> 下载</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> 社区</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> 我们的理念：你始终掌舵！</h4>
        <p>在 Caramel 中，AI 只是助手；做决定的是你。每个阶段你都掌控全局：</p>
        <ul>
            <li><strong>之前：</strong> 通过填写说明字段来确定教学框架。</li>
            <li><strong>过程中：</strong> AI 生成内容（JSON 代码）后，你可在编辑器中直接修改与微调。</li>
            <li><strong>之后：</strong> 即使下载文件后，仍可在其他工具中打开并继续编辑。</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> 描述你的需求：起点</h4>
        <p>一切从这里开始。描述越清晰，结果越精准。你有两种方式：</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">快速模式</span></h5>
            <p>直达要点。填写两个字段：</p>
            <ul>
                <li><strong>你是谁？</strong> 直接说明，无需完整句子。示例：<em>数学教师</em>、<em>学术培训师</em>。</li>
                <li><strong>你要做什么？</strong> 需求核心。尽可能完整，包含主题、年级与约束。示例：<em>面向六年级的分数入门，包含如分蛋糕等具体例子。</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">高级模式</span></h5>
            <p>更结构化的请求可使用此模式提供的精确字段：</p>
            <ul>
                <li><strong>学科、主题、年级：</strong> 用于定义背景。</li>
                <li><strong>元素数量：</strong> 非常重要！对应题目数、时间线上的日期数、词汇表中的单词数等。</li>
                <li><strong>补充信息：</strong> 用于添加具体要求、限制或其他相关细节。</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> 启用文档阅读</span><br>
            该功能允许基于你提供的内容进行生成。可以<strong>复制粘贴文本</strong>或<strong>上传 PDF 文件</strong>。
            <br><strong><i class="fas fa-lock"></i> 隐私：</strong> 请放心，文档处理<strong>完全在你的电脑本地进行</strong>，不会向互联网发送任何数据。</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> 选择活动类型</h4>
        <p>描述完成后，活动卡片将可用。点击与你的教学目标相符的卡片。</p>
        <details>
            <summary><strong>点击查看可用活动的详细信息</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>H5P 格式的交互式活动。带有星标 <span class="feedback-star">*</span> 的活动默认包含 6 个分数区间的详细反馈。</p>
            <ul>
                <li><strong>时间线：</strong> 创建交互式时间线展示事件序列。</li>
                <li><strong>闪卡：</strong> 创建正反两面的记忆卡。</li>
                <li><strong>测验（Question Set）<span class="feedback-star">*</span>：</strong> 多样题型组合（选择题、拖放等）。</li>
                <li><strong>术语表：</strong> 以手风琴折叠形式呈现的术语表或 FAQ。</li>
                <li><strong>纵横填字 <span class="feedback-star">*</span>：</strong> 根据定义生成填字格。</li>
                <li><strong>写作 <span class="feedback-star">*</span>：</strong> 提供写作题，基于关键词自动批改。</li>
                <li><strong>摘要 <span class="feedback-star">*</span>：</strong> 学生通过选择句子重建正确摘要。</li>
                <li><strong>拖拽单词 <span class="feedback-star">*</span>：</strong> 在文本中拖入缺失词。</li>
                <li><strong>完形填空 <span class="feedback-star">*</span>：</strong> 键入缺失词。</li>
                <li><strong>突出单词 <span class="feedback-star">*</span>：</strong> 在文本中高亮特定词语。</li>
                <li><strong>判断题：</strong> 简单二元问题。</li>
                <li><strong>多项选择 <span class="feedback-star">*</span>：</strong> 一项或多项正确答案的 MCQ。</li>
                <li><strong>找词：</strong> 在字母表格中寻找单词。</li>
                <li><strong>段落排序 <span class="feedback-star">*</span>：</strong> 将段落排列为正确顺序。</li>
                <li><strong>单选系列 <span class="feedback-star">*</span>：</strong> 每题仅一项正确的系列问题。</li>
                <li><strong>对话卡：</strong> 带文本与音频的交互式正反卡片。</li>
                <li><strong>高级完形填空 <span class="feedback-star">*</span>：</strong> 针对每个错误给出特定反馈。</li>
                <li><strong>图表：</strong> 创建饼图或柱状图以可视化数据。</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>测验（XML / GIFT）：</strong> 生成题库（选择题、配对等）并导入 Moodle 测验。</li>
                <li><strong>选择题（MBZ）：</strong> 简单快速的 MCQ 活动。</li>
                <li><strong>配对（MBZ）：</strong> 成对元素的配对游戏。</li>
                <li><strong>百万富翁（MBZ）：</strong> 随题目递增难度的测验游戏。</li>
                <li><strong>术语表（XML）：</strong> 将定义列表导入 Moodle 术语表的文件。</li>
                <li><strong>页面（MBZ / HTML）：</strong> 为 Éléa 构建结构化、视觉排版良好的课程页面。</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> 生成并优化内容</h4>
        <p>点击某个卡片后会打开窗口。你将在此与 AI 交互。</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> 选项 A：一键生成</h5>
            <p>快捷方式。点击 <button class="help-btn-example-albert">一键生成</button>，AI 将生成内容并直接放入右侧结果区域。你可通过按钮右侧的小箭头选择不同模型（快速、强力等）。</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> 选项 B：使用外部 AI</h5>
            <p>用于获得最大控制力。左侧显示提示词（AI 指令）。</p>
            <ol>
                <li>如需可先编辑提示词。</li>
                <li>使用 <button class="help-btn-example-duck">打开 Duck.ai</button> 或 <button class="help-btn-example-mistral">打开 Le Chat</button>。这将<strong>自动复制提示词</strong>并在新标签页打开 AI。</li>
                <li>将提示词粘贴到 AI，获取输出后，粘贴到右侧的 Caramel 结果区域。</li>
            </ol>
            <p>实用图标：<span class="help-badge-icon"><i class="fas fa-expand"></i> 全屏</span> 与 <span class="help-badge-icon"><i class="fas fa-lock"></i> 锁定</span>（保护提示词）。</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> 下载并集成你的活动</h4>
        <p>内容准备就绪后，点击下载按钮（如：<button class="help-btn-example-download">生成 H5P</button>）。以下是在 Éléa/Moodle 中集成文件的方法：</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span>（H5P 活动）</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>简单方法：</strong> 在课程中启用编辑模式，将 .h5p 文件直接拖放到目标章节。适合快速使用。</li>
                        <li><strong>推荐方法（面向设计者）：</strong> 点击“添加活动或资源”→ 选择“交互式内容（H5P）”→ 在“文件”字段上传 .h5p。共享课程时可确保正确包含活动。</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span>（页面、百万富翁、配对、选择题）</summary>
                <div class="import-content">
                    <p>此格式会将完整活动导入课程。</p>
                    <ol>
                        <li>在课程设置（齿轮）菜单中点击“还原”。</li>
                        <li>将 .mbz 文件拖放到导入区域。</li>
                        <li>点击“继续”并按步骤进行。活动将添加到课程中。</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> 与 <span class="help-badge-file">GIFT</span>（测验活动）</summary>
                <div class="import-content">
                    <p>这些格式会把题目导入到“题库”。</p>
                    <ol>
                        <li>进入课程的“更多”菜单 → “题库”。</li>
                        <li>点击“导入”选项卡。</li>
                        <li>选择 “Moodle XML 格式” 或 “GIFT 格式”。</li>
                        <li>将文件拖到“导入”区域并确认。</li>
                        <li>题目现已在题库中，可添加到“测验”活动。</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span>（页面活动的替代方案）</summary>
                <div class="import-content">
                    <p>用于手动控制内容。</p>
                    <ol>
                        <li>用文本编辑器（如记事本）打开 .html 文件并复制全部内容。</li>
                        <li>在 Éléa 中添加“页面” 活动。</li>
                        <li>在页面编辑器中点击图标切换到 HTML 模式（通常显示为 \`</\>\`）。</li>
                        <li>粘贴复制的内容并保存。</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> 社区与支持</h4>
        <p>Caramel 是一个不断成长的项目，你的反馈十分宝贵！</p>
        <ul>
            <li><strong>交流与提问：</strong> 欢迎加入 <a href="https://tchap.beta.gouv.fr/#/room/#Caramel:agent.dinum.tchap.gouv.fr" target="_blank" rel="noopener noreferrer">Tchap</a> 房间与社区交流。</li>
            <li><strong>报告问题：</strong> 发现 Bug？请提交 <a href="https://github.com/g-rem/caramel/issues" target="_blank" rel="noopener noreferrer">issue</a>。若可能，请附上导致错误的 JSON 文件，便于我们快速修复。</li>
            <li><strong>支持项目：</strong> 如果你喜欢本工具，请在 <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">Forge 页面</a> 点亮一颗星。这是对我们最大的鼓励！</li>
        </ul>
    </div>
    `,
    fast_mode: "快速模式",
    guided_mode: "高级模式",
    who_are_you: "你是谁？（如：教师、培训师……）",
    what_to_address: "你想要讨论什么？（如：六年级的角的性质……）",
    discipline: "学科（如：历史）",
    theme: "主题（如：法国大革命）",
    level: "年级（如：职业高中二年级）",
    number_of_elements: "元素数量（如：10）",
    additional_info: "补充信息...",
    generate_prompts: "生成提示词",
    h5p_tab: "H5P",
    moodle_tab: "Éléa/Moodle 模块",

    // General Context (Advanced Mode)
    prompt_expert_intro: "你是一位教学法专家，将根据当前课程标准与学生水平，为以下课程调整语气与词汇：",
    prompt_context_title: "**背景：**",
    prompt_subject: "- **学科：**",
    prompt_student_level: "- **学生水平：**",
    prompt_theme: "- **主题：**",
    prompt_number_of_elements: "- **元素数量：**",
    prompt_additional_info: "- **补充信息：**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "我是一名**",
    prompt_simple_intro_part2: "**，我希望**",
    prompt_language_instruction: "生成的内容必须为中文，除非请求中指定了其他语言。",
    prompt_code_block_instruction: "你必须在代码块中生成结果。",

    // Timeline Prompt
    timeline_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Timeline（时间轴）”活动。",
    timeline_prompt_mission: "**你的任务：**",
    timeline_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 时间轴活动。该 JSON 必须可直接使用。",
    timeline_prompt_json_structure_title: "**预期的 JSON 结构：**",
    timeline_prompt_json_structure_main_object: "主对象必须包含键“timeline”。该“timeline”对象需包括：",
    timeline_prompt_headline: "`headline`：时间轴的总标题。",
    timeline_prompt_text: "`text`：一段简短的引言。",
    timeline_prompt_asset: "`asset`：封面图片对象，包含 `media`（URL）、`caption`（说明）与 `credit`（来源）。",
    timeline_prompt_date_array: "`date`：包含 ${nombreQuestions} 个对象的数组，每个对象代表一个事件。",
    timeline_prompt_era_array: "`era`：用于定义覆盖多个事件的时期的对象数组。",
    timeline_prompt_content_rules_title: "**内容规则：**",
    timeline_prompt_rule1: "1.  `date` 数组中的每个事件必须包含：",
    timeline_prompt_rule1_startDate: "-   `startDate` 和 `endDate`：日期格式为“AAAA,MM,JJ”或“AAAA”。使用 `endDate` 定义一个时间段。",
    timeline_prompt_rule1_headline: "-   `headline`：事件标题。",
    timeline_prompt_rule1_text: "-   `text`: 文本描述。加粗用 `*单词*`，斜体用 `**单词**`，换行用 `\\n`。",
    timeline_prompt_rule1_asset: "-   `asset`：用于展示该事件的可选图片对象。",
    timeline_prompt_rule1_tag: "- `tag`: 描述时期的关键词（例如：'历史'，'科学'）。",
    timeline_prompt_rule2: "2.  对于每个 `asset`，主动搜索相关的、免版税的图片（例如维基共享资源）。`media` 中的 URL 必须是直接且有效的链接。在 `credit` 中提供来源和许可证。如果没有找到合适的图片，请完全省略 `asset` 对象。",
    timeline_prompt_rule3: "3.  为每个时期（`era`）添加一个带有简短描述和`tag`的`text`字段。",
    timeline_prompt_example_json_title: "**JSON 结构示例：**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "时间线标题",
"text": "关于时间线主题的介绍。",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "第一次世界大战的开始",
"text": "奥匈帝国向塞尔维亚宣战。",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "大公弗朗茨·斐迪南遇刺前不久。",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "战争"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "1918年停战协定",
"text": "在雷东德签署停战协定，标志着战斗的结束。",
"tag": "条约"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "第一次世界大战",
"text": "这是“大战”的时期。",
"tag": "历史时期"
}
]
}
}
\`\`\` `,
    timeline_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。结果将被另一个工具直接使用。",

    // Crossword Prompt
    crossword_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Crossword（纵横填字）”活动。",
    crossword_prompt_mission: "**你的任务：**",
    crossword_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 纵横填字活动。",
    crossword_prompt_json_structure_title: "**预期的 JSON 结构：**",
    crossword_prompt_json_structure_main_object: "对象必须包含：",
    crossword_prompt_title: "`title`：活动标题。",
    crossword_prompt_words_array: "`words`：包含 ${nombreQuestions} 个对象的数组，每个对象包括：",
    crossword_prompt_answer: "`answer`：要猜的词。",
    crossword_prompt_clue: "`clue`: 文本对应的定义。提示中不得出现目标词本身。",
    crossword_prompt_extra_clue_optional: "`extraClue`（可选）：包含额外提示的对象。提示文本可使用 `*词*` 表示加粗，`**词**` 表示斜体，换行使用 `\\n`。是否添加提示由AI判断其必要性。",
    crossword_prompt_task_description: "`taskDescription`: 清晰且具语境的说明。加粗用 `*词*`，斜体用 `**词**`，换行用 `\\n`。换行后给出复合词规则：“复合词请连写为一个词，不要使用空格或连字符。”",
    crossword_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",
    crossword_prompt_content_rules_title: "**内容规则：**",
    crossword_prompt_rule1: "1.  严格规则：答案（`answer`）仅包含文字字符。复合词、缩写或词组需连写为一个词，不含空格、连字符或其他符号。",
    crossword_prompt_rule2: "2.  定义（`clue`）需简短且准确。",
    crossword_prompt_rule3: "3.  其余 JSON 结构（行为、主题等）保持不变。",
    crossword_prompt_example_json_title: "**单个词的 JSON 示例：**",
    crossword_prompt_example: `\`\`\`json
{
"title": "生物学填字游戏",
"words": [
{
"answer": "细胞",
"clue": "生命的基本单位。",
"extraClue": {
"params": {
"text": "它可以是*动物*或*植物*。"
}
}
},
{
"answer": "DNA",
"clue": "携带遗传信息的分子。"
}
],
"taskDescription": "*完成*这份**填字游戏**。"
}
\`\`\` `,
    crossword_prompt_generate_only_json: "生成完整有效的 JSON，填写标题、说明与“words”数组，不要添加其它注释。",

    // Crossword UI translations
    crossword_across: "横向",
    crossword_down: "纵向",
    crossword_check_answer: "检查",
    crossword_try_again: "重试",
    crossword_show_solution: "显示答案",
    crossword_extra_clue: "额外提示",
    crossword_close_window: "关闭窗口",
    crossword_submit_answer: "提交",

    // Essay Prompt
    essay_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Essay（作文）”活动。",
    essay_prompt_mission: "**你的任务：**",
    essay_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P Essay 活动。",
    essay_prompt_json_structure_title: "**预期的 JSON 结构：**",
    essay_prompt_json_structure_main_object: "对象必须包含：",
    essay_prompt_task_description: "`taskDescription`：清晰的指令，邀请学生就主题撰写一段文字。使用 `*单词*` 表示粗体，`**单词**` 表示斜体，`\\n` 表示换行。",
    essay_prompt_keywords_array: "`keywords`：包含 ${nombreQuestions} 个对象的数组，每个对象定义系统需在学生回答中检索的关键词。",
    essay_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",
    essay_prompt_content_rules_title: "**内容规则：**",
    essay_prompt_rule1: "1.  `keywords` 中的每个对象都必须包含键 `keyword`，其值为要检索的词。",
    essay_prompt_rule2: "2.  关键词需与主题密切相关，并能有效评估理解程度。",
    essay_prompt_rule3: "3. 保持 JSON 结构（行为等）不变。",
    essay_prompt_rule4: "4. 指示（`taskDescription`）应鼓励写作，而不是使用`keywords`中列出的关键字，除非为了理解需要使用主题名称。",
    essay_prompt_example_json_title: "**单个关键词的 JSON 示例：**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "写一段简短的文字解释光合作用。",
"keywords": [
{
"keyword": "光",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "叶绿素",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "生成完整有效的 JSON，填写指令与关键词清单，不要添加其它注释。",

    // Moodle XML 提示
    moodle_xml_prompt_role: "你是教学设计专家。你的任务是通过生成有效的 JSON 对象，为包含 Moodle/Éléa 题库的测试活动创建内容。",
    moodle_xml_prompt_intro: "我想创建一个包含 ${nombreQuestions} 道题的测验。",
    moodle_xml_prompt_content_title: "**内容规则：**",
    moodle_xml_prompt_content_rule1: "- 错误选项须看似合理但确为错误。",
    moodle_xml_prompt_content_rule2: "- 题目难度应当多样化。",
    moodle_xml_prompt_content_rule3: "- 表述应简洁准确。",
    moodle_xml_prompt_content_rule4: "- 反馈需简要解释正确答案。",
    moodle_xml_prompt_question_types_intro: "**期望的 JSON 结构：**\n主对象必须包含以下键：\n- `bank_name`: 题库的简短描述性名称。\n- `bank_description`: 一句描述题库内容的话。\n- `questions`: 一个对象数组，每个对象代表一道题，且必须包含 `type` 与 `content`。",
    moodle_xml_prompt_question_type_multichoice: `
- **\`multichoice\` 类型（选择题）：**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "题目标题",
      "questiontext": "题干。",
      "feedback": "总体反馈。",
      "answers": [
        { "text": "选项 1", "fraction": 100, "feedback": "选择该项时的反馈。" },
        { "text": "选项 2", "fraction": 0, "feedback": "选择该项时的反馈。" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **\`matching\` 类型（配对）：**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "题目标题",
      "questiontext": "题干。",
      "feedback": "总体反馈。",
      "subquestions": [
        { "text": "子题 1 文本", "answer": "答案 1" },
        { "text": "子题 2 文本", "answer": "答案 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **\`numerical\` 类型（数值题）：**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "题目标题",
      "questiontext": "题干。",
      "feedback": "总体反馈。",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "对此答案的反馈。" }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **\`truefalse\` 类型（判断题）：**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "题目标题",
      "questiontext": "题干。",
      "feedback": "总体反馈。",
      "answer": { "value": true, "feedback_true": "为 True 时的反馈。", "feedback_false": "为 False 时的反馈。" }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **\`shortanswer\` 类型（简答题）：**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "题目标题",
      "questiontext": "题干。",
      "feedback": "总体反馈。",
      "answers": [
        { "text": "精确答案 1", "fraction": 100, "feedback": "选择该项时的反馈。" },
        { "text": "替代答案", "fraction": 100, "feedback": "选择该项时的反馈。" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **\`cloze\` 类型（完形/填空）：**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "题目标题",
      "questiontext": "这是一个包含空格 {1:SHORTANSWER:=正确答案~反馈} 以及另一个 {1:MULTICHOICE:=正确答案~错误答案} 的文本。",
      "feedback": "总体反馈。"
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**最终说明：**",
    moodle_xml_prompt_form_rule1: "将问题在不同题型之间均衡分配。",
    moodle_xml_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。结果必须是一个包含 `questions` 键的单一 JSON 对象。",

    // 创建 Éléa 测试
    moodle_xml_success_generation: "文件 {fileName} 生成成功！",
    test_error_creation_mbz: "为测试创建 MBZ 时出错：",
    test_success_generation: "文件 {fileName} 生成成功！",
    test_error_generic: "错误：",
    test_backup_log: "由 Caramel 自动创建的备份\n",

    // GIFT Prompt
    gift_prompt_role: "你是一位教学工程专家，正在为Moodle/Éléa测试活动创建一个GIFT格式的题库。",
    gift_prompt_intro: "我希望创建一个包含 ${nombreQuestions} 道题目的测验。",
    gift_prompt_format_info: "测验须采用 GIFT 格式，以便导入 Moodle。",
    gift_prompt_question_quality: "每道题都必须清晰、简洁、无歧义，并应包含详细反馈。",
    gift_prompt_code_format_intro: "代码格式必须与下方提供的示例完全一致：",
    gift_prompt_example_question_comment: "// question: 1  name: 我们太阳系的中心天体是什么？",
    gift_prompt_example_question_text: "::我们太阳系的中心天体是什么？::我们太阳系的中心天体是什么？{",
    gift_prompt_example_answer_correct: "=太阳#正确！太阳是我们太阳系的中心恒星。做得好！",
    gift_prompt_example_answer_incorrect1: "~月球#错误。月球是地球的天然卫星。太阳才是中心天体。",
    gift_prompt_example_answer_incorrect2: "~木星#错误。木星是气体巨行星。太阳才是中心天体。",
    gift_prompt_example_answer_incorrect3: "~地球#错误。地球是我们居住的行星。太阳才是中心天体。",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "测验应随机包含多种题型：",
    gift_prompt_question_type_multichoice: "- 选择题（multichoice），1 个正确答案 + 3 个干扰项；",
    gift_prompt_question_type_truefalse: "- 判断题（truefalse）；",
    gift_prompt_question_type_numerical: "- 数值题（numerical），带可接受误差；",
    gift_prompt_question_type_matching: "- 配对题（matching），至少 4 组配对；",
    gift_prompt_generate_only_gift: "直接生成 GIFT 格式的测验，不要添加注释或额外标签。请严格遵守所述格式，因为我会将结果粘贴到另一个要求该格式的工具中。以预格式化代码形式给出答案。",

    // Flashcards Prompt
    flashcards_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Flashcards（抽认卡）”活动。",
    flashcards_prompt_mission: "**你的任务：**",
    flashcards_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 抽认卡活动。该 JSON 必须可直接使用。",
    flashcards_prompt_json_structure_title: "**预期的 JSON 结构：**",
    flashcards_prompt_json_structure_main_object: "对象必须包含：",
    flashcards_prompt_title: "`title`：活动的恰当标题。",
    flashcards_prompt_description: "`description`：给学生的清晰指令。",
    flashcards_prompt_association_principle: "正面与背面必须由单一且稳定的标准相联系（例如：术语→定义、图形→边数、日期→事件、作者→作品）。对所有卡片使用相同的对应关系，并按如下方式表述指令：« 将每个 X 与 Y 匹配 »。规范化的答案（`answer`）：一个简单词或一个数字，使用小写，不带冠词和标点；数字用阿拉伯数字表示。",
    flashcards_prompt_cards_array: "`cards`：包含 ${nombreQuestions} 个对象的数组，每个对象代表一张卡片，并包含：",
    flashcards_prompt_text: "`text`：题目或要辨认的术语（正面）。",
    flashcards_prompt_answer: "`answer`：答案或定义（背面）。注意：`answer` 只能包含一个简单单词或一个数字。",
    flashcards_prompt_tip: "`tip`（可选）：用于在问题较难时帮助学生的提示。仅在你认为有必要时才添加提示。",
    flashcards_prompt_tip_formatting: "对于提示（`tip`），你可以使用 `*mot*` 表示加粗，使用 `**mot**` 表示斜体，以突出重要信息。",
    flashcards_prompt_example_json_title: "**JSON 示例：**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "欧洲的首都",
"description": "记住每个国家的首都。点击卡片查看答案。",
"cards": [
{
"text": "法国",
"answer": "巴黎"
},
{
"text": "荷兰",
"answer": "阿姆斯特丹",
"tip": "<p>这是<strong>运河</strong>和郁金香之城！</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",

    // QuizSet Prompt
    quiz_set_prompt_role: "你是一位教学工程专家，正在为“H5P Quiz（Question Set）”活动编写内容。",
    quiz_set_prompt_mission: "**你的任务：**",
    quiz_set_prompt_generate_json: "生成一个**仅包含内容**的 H5P 测验 JSON 对象。该 JSON 可直接作为 `content.json` 使用。",
    quiz_set_prompt_json_structure_title: "**预期的 JSON 结构：**",
    quiz_set_prompt_json_structure_main_object: "主对象必须包含以下键：",
    quiz_set_prompt_progress_type: "`progressType`：\"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`：50",
    quiz_set_prompt_questions_array: "`questions`：包含 ${nombreQuestions} 个对象的数组，每个对象代表一道题。",
    quiz_set_prompt_content_rules_title: "**题目内容规则：**",
    quiz_set_prompt_rule1: "1.  每个题目对象必须包含 `library`、`params` 与 `subContentId`。",
    quiz_set_prompt_rule2: "2.  **结构:** 每个问题都必须是一个包含`library`、`metadata`和`params`键的对象。",
    quiz_set_prompt_rule3: "3.  题型要多样化。请使用以下库及其精确版本：",
    quiz_set_prompt_rule4: "4.  **反馈（关键规则）：** 对于**所有问题类型**（`MultiChoice`、`Blanks`、`DragText`、`MarkTheWords`、`Essay`），您**必须**生成一个包含6个分数范围的`overallFeedback`：0-10、11-30、31-50、51-70、71-90和91-100。对于`TrueFalse`问题，还需添加`feedbackOnCorrect`和`feedbackOnWrong`字段。反馈必须是善意的、渐进的，并且始终以肯定的方式表达。",
    quiz_set_prompt_rule5: "5.  **内容：** `params`中的内容必须在教学上相关，为多选题提供合理的干扰项，为其他活动提供连贯的文本。",
    quiz_set_prompt_rule6: "6.  **简洁性：** 不要添加图片或多余的行为参数。保持结构简单，如示例所示。",
    quiz_set_prompt_example_json_title: "**每种授权问题类型的结构示例：**",
    quiz_set_example_true_false: "对/错 :",
    quiz_set_example_multiple_choice: "多项选择 :",
    quiz_set_example_fill_in_the_blanks: "填空题 :",
    quiz_set_example_drag_the_words: "拖动单词 :",
    quiz_set_example_mark_the_words: "标记单词 :",
    quiz_set_example_essay: "写作 :",
    quiz_set_prompt_generate_only_json: "`{\"progressType\": \"dots\", ...}`で始まる有効なJSONのみを、コメントなしで生成してください。",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "判断题标题" },
        "params": {
            "question": "<p>法国是一个国家吗？</p>",
            "correct": "true",
            "feedbackOnCorrect": "正确！法国确实是一个国家。",
            "feedbackOnWrong": "错误。法国在国际上被认为是一个国家。",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "MCQ标题" },
        "params": {
            "question": "<p>法国的首都是哪里？</p>",
            "answers": [
                { "text": "巴黎", "correct": true },
                { "text": "柏林", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
                { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
                { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
                { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
                { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
                { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "填空题标题" },
        "params": {
            "questions": ["<p>巴黎是法国的*首都*。</p>"],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
                { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
                { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
                { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
                { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
                { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "拖动单词活动标题" },
        "params": {
            "taskDescription": "完成句子。",
            "textField": "*巴黎*是法国的首都。",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
                { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
                { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
                { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
                { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
                { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "标记单词活动标题" },
        "params": {
            "taskDescription": "突出显示首都。",
            "textField": "法国的首都是*巴黎*。",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
                { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
                { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
                { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
                { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
                { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "文章标题" },
        "params": {
            "taskDescription": "<p>法国的首都是哪里？</p>",
            "keywords": [
                { "keyword": "巴黎", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
                { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
                { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
                { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
                { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
                { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Accordion（手风琴）”活动。",
    glossary_prompt_mission: "**你的任务：**",
    glossary_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 术语表（Accordion）活动。该 JSON 必须可直接使用。",
    glossary_prompt_json_structure_title: "**预期的 JSON 结构：**",
    glossary_prompt_json_structure_main_object: "生成一个包含 ${nombreQuestions} 个 JSON 对象的数组。",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`：要定义的词或短语。",
    glossary_prompt_content: "`text`: 定义。加粗用 `*单词*`，斜体用 `**单词**`，换行用 `\\n`。",
    glossary_prompt_content_rules_title: "**内容规则：**",
    glossary_prompt_rule1: "1.  定义应清晰、简洁，并与学生水平相适应。",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**单个词条的 JSON 示例：**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "光合作用",
"text": "绿色植物将阳光转化为能量的过程。"
},
{
"title": "细胞",
"text": "所有生物的基本单位。"
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",

    // Summary Prompt
    summary_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Summary（要点归纳）”活动。",
    summary_prompt_mission: "**你的任务：**",
    summary_prompt_generate_json: "生成一个完整的 JSON 对象，用于 H5P Summary 活动。该 JSON 必须可直接使用。",
    summary_prompt_json_structure_title: "**预期的 JSON 结构：**",
    summary_prompt_json_structure_main_object: "对象必须包含以下键：",
    summary_prompt_intro_field: "`intro`: 活动的介绍性句子（例如，“选择正确的陈述。”）。",
    summary_prompt_summaries_array: "`summaries`: 一个包含 ${nombreQuestions} 个对象的数组，每个对象代表一个摘要步骤。",
    summary_prompt_summary_object: "`summaries` 中的每个对象必须包含：",
    summary_prompt_summary_array: "- `summary`: 一个句子数组。",
    summary_prompt_tip_field: "- `tip` (可选但建议): 帮助学生的提示。",
    summary_prompt_content_rules_title: "**内容规则：**",
    summary_prompt_rule1: "1.  在每个 \"summary\" 数组中，**第一句为正确陈述**。",
    summary_prompt_rule2: "2.  其余句子为看似合理但错误的干扰项。",
    summary_prompt_rule3: "3.  所有正确句子组合后应构成连贯的摘要。",
    summary_prompt_example_json_title: "**单个步骤的 JSON 示例：**",
   summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "这是正确的句子。",
    "这是一个干扰项。",
    "这是另一个干扰项。"
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",
    summary_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",

    // Summary UI translations
    summary_intro: "选择正确的陈述。",
    summary_solved_label: "进度：",
    summary_score_label: "错误答案：",
    summary_result_label: "你的结果",
    summary_feedback: "你答对了 @total 条陈述中的 @score 条（@percent %）。",
    summary_label_correct: "正确。",
    summary_label_incorrect: "不正确！请重试。",
    summary_label_correct_answers: "正确答案。",
    summary_tip_button_label: "显示提示",
    summary_score_bar_label: "你得到了 :num 分（共 :total 分）",
    summary_progress_text: "进度 :num / :total",
    summary_alternative_incorrect_label: "不正确",

    // Drag the Words Prompt
    drag_word_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Drag the Words（拖动单词）”活动。",
    drag_word_prompt_mission: "**你的任务：**",
    drag_word_prompt_generate_json: "生成一个完整的 JSON 对象，用于 H5P 拖动单词活动。该 JSON 必须可直接使用。",
    drag_word_prompt_json_structure_title: "**预期的 JSON 结构：**",
    drag_word_prompt_json_structure_main_object: "对象必须包含：",
    drag_word_prompt_task_description: "`taskDescription`：清晰的指令。",
    drag_word_prompt_text_field: "`textField`：待完成的文本。每个句子应以换行符 `\\n` 结尾。",
    drag_word_prompt_content_rules_title: "**内容规则：**",
    drag_word_prompt_rule1: "1.  围绕主题创作连贯的短句文本，每句以 `\\n` 结尾。",
    drag_word_prompt_rule2: "2.  可拖动的词用星号包裹。你可以用 `:我的提示` 添加提示，用 `\\+正确反馈 \\-错误反馈` 添加反馈。",
    drag_word_prompt_example_json_title: "**JSON 示例：**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "通过拖动单词完成文本。",
"textField": "*太阳系*由*八*颗行星组成，这些行星围绕*太阳*运行。"
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",
    drag_word_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",

    // Drag the Words UI translations
    drag_words_check_answer: "检查",
    drag_words_try_again: "重试",
    drag_words_show_solution: "显示答案",
    drag_words_score_feedback: "得分：@score / @total。",
    drag_words_tip_label: "显示提示",
    drag_words_correct_text: "正确！",
    drag_words_incorrect_text: "错误！",
    drag_words_score_bar_label: "你得到了 :num 分（共 :total 分）",
    drag_words_submit_answer: "提交",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Fill in the Blanks（填空）”活动。",
    blanks_prompt_mission: "**你的任务：**",
    blanks_prompt_generate_json: "生成一个完整的 JSON 对象，用于 H5P 填空活动。该 JSON 必须可直接使用。",
    blanks_prompt_json_structure_title: "**预期的 JSON 结构：**",
    blanks_prompt_json_structure_main_object: "对象必须包含键 `questions`，其值为字符串数组。每个字符串代表一段待完成的文本。",
    blanks_prompt_content_rules_title: "**内容规则：**",
    blanks_prompt_rule1: "-  要填写的词用星号包裹（*词*）。",
    blanks_prompt_rule2: "-  若有备选答案，用斜杠分隔：*巴黎/光之城*。",
    blanks_prompt_rule3: "-  若要添加提示，用冒号：*开源:公开的源代码*。",
    blanks_prompt_example_json_title: "**JSON 示例：**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"太阳系有*八*颗行星。最大的是*木星*。",
"法国的首都是*巴黎/光之城*。"
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",
    blanks_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "显示答案",
    blanks_try_again: "重试",
    blanks_check_answer: "检查",
    blanks_not_filled_out: "请填写所有空格。",
    blanks_answer_is_correct: "「:ans」是正确的",
    blanks_answer_is_wrong: "「:ans」是错误的",
    blanks_answered_correctly: "回答正确",
    blanks_answered_incorrectly: "回答错误",
    blanks_solution_label: "正确答案：",
    blanks_input_label: "第 @num 空，共 @total 空",
    blanks_input_has_tip_label: "有提示可用",
    blanks_tip_label: "提示",
    blanks_score_bar_label: "你得到了 :num 分（共 :total 分）",
    blanks_submit_answer: "提交",
    blanks_feedback: "你答对了 @total 个空格中的 @score 个。",
    blanks_finish_header: "完成？",
    blanks_finish_body: "你确定要完成吗？",
    blanks_cancel_label: "取消",
    blanks_finish_label: "完成",
    blanks_retry_header: "重试？",
    blanks_retry_body: "你确定要重试吗？",
    blanks_retry_confirm_label: "确认",
    blanks_checking_mode_header: "检查模式",
    blanks_a11y_check: "检查答案。答案将被标记为正确、错误或未回答。",
    blanks_a11y_show_solution: "显示答案。任务将标记其正确答案。",
    blanks_a11y_retry: "重试任务。重置所有回答并重新开始任务。",

    // Mark the Words Prompt
    mark_words_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Mark the Words（标注词语）”活动。",
    mark_words_prompt_mission: "**你的任务：**",
    mark_words_prompt_generate_json: "生成一个完整的 JSON 对象，用于 H5P 标注词语活动。该 JSON 必须可直接使用。",
    mark_words_prompt_json_structure_title: "**预期的 JSON 结构：**",
    mark_words_prompt_json_structure_main_object: "对象必须包含：",
    mark_words_prompt_task_description: "`taskDescription`：清晰的指令。",
    mark_words_prompt_text_field: "`textField`：需要标注的词用星号包裹（*词*）的文本。",
    mark_words_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",
    mark_words_prompt_content_rules_title: "**内容规则：**",
    mark_words_prompt_rule1: "1.  围绕主题写一段相关的文字。",
    mark_words_prompt_rule2: "2.  选择大约 ${nombreQuestions} 个重要关键词供标注。",
    mark_words_prompt_rule3: "3.  每个要标记的单词必须单独用星号括起来。例如, `*单词1* *单词2*` 是正确的, 但 `*单词1 单词2*` 是不正确的。",
    mark_words_prompt_rule4: "4.  撇号或其他标点符号不能附加到标记的单词上。例如, `l'*oiseau*` 是不正确的; 它应该写成 `l' *oiseau*` 才能正常工作。",
    mark_words_prompt_example_json_title: "**JSON 示例：**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "点击文本中的重要词语。",
"textField": "*太阳* *系*由*八*颗行星组成，这些行星围绕*太阳*运行。"
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",

    // Mark the Words UI translations
    mark_words_check_answer: "检查",
    mark_words_try_again: "重试",
    mark_words_show_solution: "显示答案",
    mark_words_correct_answer: "正确！",
    mark_words_incorrect_answer: "错误！",
    mark_words_missed_answer: "未答！",
    mark_words_display_solution_description: "任务已更新以包含答案。",
    mark_words_score_bar_label: "你得到了 :num 分（共 :total 分）",
    mark_words_submit_answer: "提交",
    mark_words_a11y_full_text_label: "完整可读文本",
    mark_words_a11y_clickable_text_label: "可以标记单词的完整文本",
    mark_words_a11y_solution_mode_header: "答案模式",
    mark_words_a11y_checking_header: "检查模式",
    mark_words_a11y_check: "检查答案。答案将被标记为正确、错误或未回答。",
    mark_words_a11y_show_solution: "显示答案。任务将标记其正确答案。",
    mark_words_a11y_retry: "重试任务。重置所有回答并重新开始任务。",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "压缩库（Tar.js 或 fflate）未加载。请检查您的互联网连接或刷新页面。",
    millionnaire_error_invalid_json: "JSON 结构无效。请确保其中包含 'title' 和一个包含 6 个问题的 'questions' 数组，与示例一致。",
    millionnaire_activity_intro: "参与此游戏以测试您的知识。",
    millionnaire_backup_log: "由 Caramel 自动创建的备份\n",
    millionnaire_success_generation: "文件 {fileName} 已成功生成！",
    millionnaire_error_creation_mbz: "创建 MBZ 文件时出错：",
    millionnaire_error_generic: "错误：",

    // Millionnaire Prompt
    millionnaire_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“Millionnaire（百万富翁）”活动。",
    millionnaire_prompt_num_questions: "**题目数量：** 6",
    millionnaire_prompt_mission: "**你的任务：**",
    millionnaire_prompt_generate_json: "生成一个 JSON 对象，其中包含标题以及 **6 道题**，用于“谁想成为百万富翁”类型的游戏。",
    millionnaire_prompt_important_rules_title: "**重要规则：**",
    millionnaire_prompt_rule1: "1.  `title` 必须是针对该活动的恰当且有吸引力的标题。",
    millionnaire_prompt_rule2: "2.  `questions` 数组中的题目难度需**循序渐进且具有教学性**，适配学生水平。第一题应非常简单，最后一题应非常困难。",
    millionnaire_prompt_rule3: "3.  内容必须严格准确，并与主题和学段相关。",
    millionnaire_prompt_json_structure_title: "**预期的 JSON 结构：**",
    millionnaire_prompt_main_object: "一个包含两项键的主对象：",
    millionnaire_prompt_title: "- `title`：活动标题（字符串）。",
    millionnaire_prompt_questions_array: "- `questions`：包含 6 个对象的数组，每个对象代表一道题，并包含：",
    millionnaire_prompt_question: "- `question`：题干（字符串）。",
    millionnaire_prompt_good_answer: "- `goodanswer`：正确答案（字符串）。",
    millionnaire_prompt_bad_answer: "- `badanswer`：3 个错误答案的数组（字符串）。",
    millionnaire_prompt_example_json_title: "**JSON 示例：**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "关于法国大革命的测验",
"questions": [
{
"question": "法国的首都是哪里？",
"goodanswer": "巴黎",
"badanswer": ["柏林", "伦敦", "马德里"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "仅生成有效的 JSON 对象，不要添加任何注释。",

    // Appariement Prompt
    appariement_prompt_role: "你是一名教学工程专家，正在创建一个 Moodle “配对” 活动。",
    appariement_prompt_num_questions: "**配对数：** 10",
    appariement_prompt_mission: "**你的任务：**",
    appariement_prompt_generate_json: "生成一个 JSON 对象，其中包含一个标题以及用于配对游戏的 **10 对**。",
    appariement_prompt_important_rules_title: "**重要规则：**",
    appariement_prompt_rule1: "1.  `title` 必须是与活动相关且有吸引力的标题。",
    appariement_prompt_rule2: "2.  `pairs` 数组必须包含 10 个对象，每个对象包含 `question`（左侧项）和 `answer`（右侧要匹配的项）。",
    appariement_prompt_rule3: "3.  内容必须严格准确，并与主题和学段相符。",
    appariement_prompt_json_structure_title: "**预期的 JSON 结构：**",
    appariement_prompt_main_object: "一个包含两个键的主对象：",
    appariement_prompt_title: "- `title`：活动标题（字符串）。",
    appariement_prompt_pairs_array: "- `pairs`：包含 10 个对象的数组，每个对象代表一对，并包含：",
    appariement_prompt_question: "- `question`：左侧的术语或图片（字符串）。",
    appariement_prompt_answer: "- `answer`：右侧对应的定义或术语（字符串）。",
    appariement_prompt_example_json_title: "**JSON 示例：**",
    appariement_prompt_example: `\`\`\`json
{
"title": "关于法国大革命的配对题",
"pairs": [
{
"question": "攻占巴士底狱",
"answer": "1789年7月14日"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "仅生成有效的 JSON 对象，不要添加任何注释。",

    // 配对创建
    appariement_error_invalid_json: "JSON 结构无效。请确保其中包含 'title' 和数组 'pairs'，并且每个配对都具有 'question' 和 'answer'。",
    appariement_activity_intro: "找到对应的配对。",
    appariement_success_generation: "文件 {fileName} 生成成功 !",
    appariement_error_creation_mbz: "为配对创建 MBZ 时出错:",

    // QCM Prompt
    qcm_prompt_role: "你是一名教学工程专家，正在创建一个 Moodle “MCQ” 活动。",
    qcm_prompt_num_questions: "**问题数量：** 10",
    qcm_prompt_mission: "**你的任务：**",
    qcm_prompt_generate_json: "生成一个 JSON 对象，其中包含一个标题以及用于 MCQ 的 **10 个问题**的列表。",
    qcm_prompt_important_rules_title: "**重要规则：**",
    qcm_prompt_rule1: "1.  `title` 必须是与活动相关且有吸引力的标题。",
    qcm_prompt_rule2: "2.  `questions` 数组必须包含 10 个对象，每个对象包含 `text`（问题措辞）和 `answers` 数组。",
    qcm_prompt_rule3: "3.  每个 `answers` 数组必须包含几个可能的答案。每个答案都是一个包含 `text` 和 `iscorrect`（1 为真，0 为假）的对象。根据问题的上下文，你可以提出只有一个正确答案或有多个正确答案的问题。",
    qcm_prompt_json_structure_title: "**预期的 JSON 结构：**",
    qcm_prompt_main_object: "一个包含两个键的主对象：",
    qcm_prompt_title: "- `title`：活动标题（字符串）。",
    qcm_prompt_questions_array: "- `questions`：包含 10 个对象的数组，每个对象代表一个问题并包含：",
    qcm_prompt_question_text: "- `text`：问题措辞（字符串，可以包含 HTML）。",
    qcm_prompt_answers_array: "- `answers`：对象的数组，每个对象代表一个答案并包含：",
    qcm_prompt_answer_text: "- `text`：答案文本（字符串，可以包含 HTML）。",
    qcm_prompt_answer_iscorrect: "- `iscorrect`：如果答案正确则为 1，否则为 0。",
    qcm_prompt_example_json_title: "**JSON 示例：**",
    qcm_prompt_example: `\`\`\`json
{
"title": "关于法国大革命的多项选择题",
"questions": [
{
"text": "攻占巴士底狱的日期是？",
"answers": [
{ "text": "1789年7月14日", "iscorrect": 1 },
{ "text": "1789年8月4日", "iscorrect": 0 },
{ "text": "1789年8月26日", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "仅生成有效的 JSON 对象，不要添加任何注释。",

    // 多项选择题创建
    qcm_error_invalid_json: "JSON 结构无效。请确保其中包含 'title' 和数组 'questions'，且至少有一个问题和答案。",
    qcm_activity_intro: "请回答以下问题。",
    qcm_success_generation: "文件 {fileName} 生成成功 !",
    qcm_error_creation_mbz: "为多项选择题创建 MBZ 时出错:",

    // H5P Modules
    h5p_timeline_name: "时间轴",
    h5p_timeline_description: "创建交互式时间轴，以展示一系列事件。",
    h5p_flashcards_name: "抽认卡",
    h5p_flashcards_description: "创建双面卡片，帮助记忆术语与定义。",
    h5p_quiz_set_name: "测验",
    h5p_quiz_set_description: "编制一组多样化题目（QCM、拖放等）以评估知识。",
    h5p_glossary_name: "术语表",
    h5p_glossary_description: "以手风琴折叠形式创建术语表或常见问答。",
    h5p_crossword_name: "纵横填字",
    h5p_crossword_description: "根据词语与定义列表生成纵横填字网格。",
    h5p_essay_name: "写作",
    h5p_essay_description: "给出写作主题并设定关键词，以便自动化批改。",
    h5p_summary_name: "摘要",
    h5p_summary_description: "学生需通过选择正确句子来重建正确摘要。",
    h5p_drag_the_words_name: "拖动单词",
    h5p_drag_the_words_description: "创建填空文本，学生需拖入缺失的词。",
    h5p_fill_in_the_blanks_name: "填空文本",
    h5p_fill_in_the_blanks_description: "学生直接用键盘填入文本中的缺失词语。",
    h5p_mark_the_words_name: "标注词语",
    h5p_mark_the_words_description: "要求学生在段落中标出特定词语。",
    h5p_true_false_name: "判断题",
    h5p_true_false_description: "创建答案为“是”或“否”的简单问题。",
    h5p_multiple_choice_name: "多项选择",
    h5p_multiple_choice_description: "创建具有一个或多个正确答案的多项选择题。",
    h5p_find_the_words_name: "单词搜索",
    h5p_find_the_words_description: "创建一个字母网格，学生必须在其中找到单词。",
    h5p_sort_the_paragraphs_name: "段落排序",
    h5p_sort_the_paragraphs_description: "创建一组段落，学生必须按正确顺序排序。",
    h5p_single_choice_set_name: "单选题集",
    h5p_single_choice_set_description: "创建一系列问题，每个问题只有一个正确答案。",
    h5p_dialog_cards_name: "对话卡",
    h5p_dialog_cards_description: "创建带有文本和可选图片（双面）的交互式卡片。",
    h5p_complex_fill_the_blanks_name: "复杂填空",
    h5p_complex_fill_the_blanks_description: "创建一个高级填空文本，并为每个错误提供具体反馈。",
    h5p_chart_name: "图表",
    h5p_chart_description: "创建饼图或条形图以可视化数据。",

    // Moodle Modules
    moodle_xml_name: "测验",
    moodle_xml_description: "生成一个问题库，以直接导入到测试活动中（支持xml或gift格式）",
    moodle_xml_help: "要在 Moodle 的“测验”活动中添加 XML 文件，首先创建活动。然后打开 <strong>更多</strong> 菜单并进入 <strong>题库</strong>。在此菜单中，点击 <strong>导入</strong>，选择 <strong>Moodle XML</strong> 格式，然后选择您的文件并确认。",
    moodle_gift_name: "GIFT 格式",
    moodle_gift_description: "以 GIFT 格式创建题目，这是一种将题目导入 Moodle 的简单方法。",
    moodle_millionnaire_name: "百万富翁",
    moodle_millionnaire_description: "生成一个独特的“百万富翁”活动，包含 6 道逐渐变难的问题。",
    moodle_appariement_name: "配对",
    moodle_appariement_description: "生成一个包含 10 个问题的配对活动。",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "生成一个简单的 MCQ 活动。",

    moodle_glossaire_xml_name: "术语表 (XML)",
    moodle_glossaire_xml_description: "生成一个可导入为 XML 格式的术语表。",

    elea_page_name: "页面",
    elea_page_description: "创建一个经过视觉排版的 Éléa 内容页面.",

    // Dynamic content
    prompt_for_ia: "供 AI 使用的提示词",
    copy_prompt: "复制提示词",
    fullscreen_prompt: "全屏",
    exit_fullscreen_prompt: "退出全屏",
    lock_prompt: "锁定提示词",
    unlock_prompt: "解锁提示词",
    go_duck: "访问 Duck.ai",
    go_mistral: "访问 Le Chat",
    create_h5p_file: "创建 H5P 文件",
    integrate_h5p_libraries: "集成 H5P 库：",
    paste_ia_result: "将 AI 的结果粘贴到下方区域以创建你的模块。",
    generate_h5p: "生成 H5P",
    create_xml_file: "创建 XML 文件",
    paste_ia_result_xml: "在下方粘贴 AI 生成的 XML。",
    generate_xml_file: "生成 XML 文件",
    export_mbz: "MBZ 格式",
    export_gift: "GIFT 格式",
    export_xml: "XML 格式",
    export_html: "HTML 格式",

    create_mbz_file_appariement: "创建“配对”文件 (.mbz)",
    paste_ia_result_appariement: "在下方粘贴由 AI 生成的 JSON。活动标题将自动从 JSON 中提取。",
    generate_mbz_appariement: "生成“配对”活动 (mbz)",
    create_mbz_file_millionnaire: "创建“百万富翁”文件 (.mbz)",
    paste_ia_result_millionnaire: "在下方粘贴由 AI 生成的 JSON。活动标题将自动从 JSON 中提取。",
    generate_mbz_millionnaire: "生成“百万富翁”活动 (mbz)",
    generate_mbz_test: "生成测试活动（mbz）",

    create_mbz_file_qcm: "创建 MCQ 文件 (.mbz)",
    paste_ia_result_qcm: "在下方粘贴由 AI 生成的 JSON。活动标题将自动从 JSON 中提取。",
    generate_mbz_qcm: "生成 MCQ 活动 (mbz)",

    create_mbz_file_page: "创建页面文件 (.mbz)",
    paste_ia_result_page: "在下方粘贴由 AI 生成的 JSON 以构建页面.",
    generate_mbz_page: "生成页面活动 (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "此处将显示 Moodle XML……",
    paste_xml_placeholder: "在此粘贴 AI 生成的完整 XML……",

    // H5P empty text fields
    generate_prompts_placeholder: "当你在快速模式或高级模式中至少填写一个字段后，这里将显示用于 AI 的提示词。",
    paste_json_or_text: "在此粘贴由 AI 生成的 JSON 内容或文本，以创建您的活动。",

    // Notifications
    prompts_generated_successfully: "提示词生成成功！",
    success_copy: "✓ 已复制 !",
    error_please_fill_fields: "请在快速模式中至少填写一个字段。",
    error_please_fill_guided_fields: "请在高级模式中至少填写一个字段。",
    error_field_empty: "字段为空。请先生成一个提示词。",
    error_copy_failed: "复制失败。",
    error_h5p_module_not_found: "未找到模块“{moduleKey}”。",
    error_invalid_quiz_json: "测验的 JSON 无效：{errorMessage}",
    error_invalid_json: "提供的 JSON 无效。错误：{errorMessage}",
    error_h5p_creation: "创建 H5P 出错：{errorMessage}",
    error_paste_ia_content: "请粘贴 AI 生成的内容。",
    error_compression_module_not_ready: "压缩模块尚未就绪。请稍后重试。",
    h5p_file_generated_successfully: "文件 {fileName} 已成功生成！",
    h5p_creation_failed: "创建 H5P 文件失败：{errorMessage}",
    license_info: "GNU GPL v3.0 或更高版本",

    // Notifications for JSON content
    error_paste_json_content: "请粘贴生成的JSON内容。",
    error_paste_xml_content: "请粘贴生成的XML内容。",

    // Flashcards specific UI translations
    flashcards_progress_text: "卡片 @card / @total",
    flashcards_next: "下一个",
    flashcards_previous: "上一个",
    flashcards_check_answer: "检查",
    flashcards_your_answer: "你的答案",
    flashcards_correct_answer: "正确",
    flashcards_incorrect_answer: "不正确",
    flashcards_show_solution: "正确答案",
    flashcards_results: "结果",
    flashcards_of_correct: "总共 @total 个，答对 @score 个",
    flashcards_show_results: "显示结果",
    flashcards_answer_short: "答：",
    flashcards_retry: "重试",
    flashcards_card_announcement: "回答错误。正确答案是 @answer",
    flashcards_correct_announcement: "@answer 是正确的。",
    flashcards_page_announcement: "第 @current 页，共 @total 页",

    ticket: "工单",
    legal_mentions: "法律声明",

    // Legal Mentions
    legal_title: "法律声明",
    legal_editor_title: "应用程序编辑",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "职务: 职业高中 文学-历史 教师",
    legal_editor_gauthier_remande_email: "电子邮件: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "地址: 39 avenue de Chanzy, 53000 Laval, 法国",
    legal_editor_gauthier_remande_phone: "电话: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "职务: 数学教师和DRANE任务官员 – 格勒诺布尔学院",
    legal_editor_emmanuel_gaunard_email: "电子邮件: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "地址: 30 boulevard de la République, 38200 Vienne, France",
    legal_editor_emmanuel_gaunard_phone: "电话: +33 6 46 74 20 94",
    legal_app_description: "“Caramel”网络应用程序是一个免费的非商业项目，用于创建H5P内容。无需帐户，不收集任何个人数据，所有互动都在浏览器本地进行。",
    legal_hosting_title: "托管",
    legal_host_name: "<strong>主机</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>公司名称</strong>: 国家教育和青年部",
    legal_host_address: "<strong>地址</strong>: 110 rue de Grenelle, 75007 Paris, France",
    legal_host_phone: "<strong>电话</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "出版总监",
    legal_publication_director_name: "Gauthier REMANDE 和 Emmanuel GAUNARD，作为志愿者编辑。",
    legal_terms_of_use_title: "一般使用条款",
    legal_terms_of_use_content: "本网站允许用户生成H5P内容。显示在本地完成，不传输用户数据。用户对生成内容的使用负全部责任。该应用程序免费提供，不保证任何操作或结果。编辑对内容的误解或不当使用不承担任何责任。",
    legal_intellectual_property_title: "知识产权",
    legal_intellectual_property_content: "所有源代码、图形元素和内容均根据免费的GNU AGPLv3许可证进行许可。允许在其各自许可证的条款下重复使用。任何重新分发或修改必须注明原作者：Gauthier REMANDE和Emmanuel GAUNARD。H5P模块中使用的图像来自H5P.org。",
    legal_personal_data_title: "个人数据",
    legal_personal_data_content: "不收集或存储任何个人数据。不使用任何跟踪cookie。会话历史记录存储在用户的本地浏览器（localStorage）中，不进行传输。根据GDPR，任何个人信息都不会传输给编辑或第三方。",
    legal_accessibility_title: "无障碍",
    legal_accessibility_content: "该应用程序设计为与计算机使用兼容，包括暗/亮模式、键盘导航和根据主题的高对比度。正在根据RGAA建议不断改进无障碍性。",
    legal_applicable_law_title: "适用法律",
    legal_applicable_law_content: "本网站受法国法律管辖。如有争议，主管法院将是里昂管辖范围内的法院。",
    legal_external_libraries_title: "使用的外部库",
    legal_external_libraries_intro: "Caramel应用程序使用以下许可证下的几个开源库：",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (许可证: CC BY 4.0, SIL OFL 1.1, MIT): 提供界面中使用的图标，以改善导航和视觉体验。",
    legal_library_jszip: "<strong>JSZip</strong> (许可证: MIT or GPLv3): 通过将必要内容压缩到zip存档中来创建.h5p文件。",
    legal_library_clientzip: "<strong>client-zip</strong> (许可证: MIT): 另一个用于文件压缩的库，为直接在浏览器中生成.h5p存档提供了高性能的替代方案。",
    legal_library_fflate: "<strong>fflate</strong> (许可证: MIT): 用于数据压缩和解压缩的非常快的库，用于为Moodle模块创建.mbz存档。",
    legal_library_tarjs: "<strong>tar-js</strong> (许可证: MIT): 允许创建.tar存档，这是压缩前形成Moodle模块的.mbz文件的必要步骤。",
    legal_library_ownership: "每个库均为其各自作者的财产，并根据其许可证使用。",

    // Essay specific UI translations
    essay_checkAnswer: "检查",
    essay_tryAgain: "重试",
    essay_showSolution: "显示答案",
    essay_feedbackHeader: "反馈",
    essay_solutionTitle: "范例答案",
    remainingChars: "剩余字符数：@chars",
    notEnoughChars: "您必须输入至少 @chars 个字符！",
    messageSave: "已保存",
    placeholderText: "从这里开始写作...",
    ariaYourResult: "您获得了 @total 分中的 @score 分",
    ariaNavigatedToSolution: "已导航至文本区域后新包含的范例答案。",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "你的作品是一个好的开始。继续探索这个主题，以丰富你的想法。",
    essay_overall_feedback_11_30: "你已经奠定了有趣的基础。通过深入研究某些要点，你的作品将变得更加精确。",
    essay_overall_feedback_31_50: "你对这个主题的理解正在顺利进行中。考虑进一步发展你的论点，以加强你的观点。",
    essay_overall_feedback_51_70: "这是一件好作品。你对这个主题有很好的掌握。再增加一些细节可以进一步改进它。",
    essay_overall_feedback_71_90: "非常好的作品！你的分析是相关的，结构良好。你表现出色的理解力。",
    essay_overall_feedback_91_100: "优秀的作品！你的思考是透彻的，论证充分，并显示出对主题的完全掌握。",

    // True/False Question
    true_false_prompt_role: "你是一位教学设计专家，正在为H5P活动创建一个判断题。",
    true_false_prompt_mission: "你的任务是为判断题生成一个JSON对象。",
    true_false_prompt_generate_json: "根据以下结构生成一个JSON对象：",
    true_false_prompt_json_structure_title: "--- 预期的JSON结构 ---",
    true_false_prompt_json_structure_main_object: "主对象必须包含以下键：",
    true_false_prompt_question: "`question`: (string) 待评估的陈述。可以包含HTML。",
    true_false_prompt_correct: "`correct`: (string) 正确答案，为“true”或“false”。",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) 如果答案正确，则显示评论。",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) 如果答案不正确，则显示评论。",
    true_false_prompt_content_rules_title: "--- 内容规则 ---",
    true_false_prompt_rule1: "问题必须是一个明确的陈述。",
    true_false_prompt_rule2: "`correct`的值必须是字符串：“true”或“false”。",
    true_false_prompt_example_json_title: "--- JSON示例 ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "奥斯陆是挪威的首都。",
"correct": "true",
"feedbackOnCorrect": "回答正确！奥斯陆确实是挪威的首都。",
"feedbackOnWrong": "回答错误。挪威的首都是奥斯陆。"
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "我希望你只生成JSON，不带任何注释或介绍性文字。",
    true_false_true_text: "正确",
    true_false_false_text: "错误",
    true_false_score: "你得到了@score/@total分",
    true_false_check_answer: "检查",
    true_false_show_solution_button: "显示答案",
    true_false_try_again: "重试",
    true_false_wrong_answer_message: "回答错误",
    true_false_correct_answer_message: "回答正确",
    true_false_score_bar_label: "你得到了:num/:total分",
    true_false_submit_answer: "提交",
    true_false_a11y_check: "检查答案。答案将被标记为正确、错误或未回答。",
    true_false_a11y_show_solution: "显示答案。任务将标记其正确答案。",
    true_false_a11y_retry: "重试任务。重置所有回答并重新开始任务。",
    true_false_finish_header: "完成？",
    true_false_finish_body: "你确定要完成吗？",
    true_false_cancel_label: "取消",
    true_false_finish_label: "完成",
    true_false_retry_header: "重试？",
    true_false_retry_body: "你确定要重试吗？",
    true_false_retry_confirm_label: "确认",

    // Multiple Choice UI translations
    checkAnswerButton: "检查",
    showSolutionButton: "显示答案",
    tryAgainButton: "重试",
    submitAnswerButton: "提交",
    scoreBarLabel: "你得到了:num/:total分",
    confirmCheckHeader: "完成？",
    confirmCheckBody: "你确定要完成吗？",
    confirmCheckCancelLabel: "取消",
    confirmCheckConfirmLabel: "完成",
    confirmRetryHeader: "重试？",
    confirmRetryBody: "你确定要重试吗？",
    confirmRetryCancelLabel: "取消",
    confirmRetryConfirmLabel: "确认",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“多项选择”活动。",
    multiple_choice_prompt_mission: "**你的任务:**",
    multiple_choice_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 多项选择活动。",
    multiple_choice_prompt_json_structure_title: "**预期的 JSON 结构:**",
    multiple_choice_prompt_json_structure_main_object: "对象必须包含：",
    multiple_choice_prompt_question: "`question`: 要提出的问题（HTML 格式）。",
    multiple_choice_prompt_answers_array: "`answers`: 一个对象数组，每个对象代表一个答案。",
    multiple_choice_prompt_text: "`text`: 答案文本（HTML 格式）。",
    multiple_choice_prompt_correct: "`correct`: 一个布尔值（`true` 或 `false`），指示是否为正确答案。",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",
    multiple_choice_prompt_content_rules_title: "**内容规则:**",
    multiple_choice_prompt_rule1: "1.  只能有一个正确答案 (`\"correct\": true`)。",
    multiple_choice_prompt_rule2: "2.  提供几个不正确的答案 (`\"correct\": false`)。",
    multiple_choice_prompt_example_json_title: "**JSON 示例:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "黑加仑（cassis）的真实颜色是什么？",
"answers": [
{
"correct": true,
"text": "深紫色"
},
{
"correct": false,
"text": "蓝色"
},
{
"correct": false,
"text": "黑色"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
    { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
    { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
    { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
    { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
    { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",

    // Find the Words UI translations
    check: "检查",
    tryAgain: "重试",
    showSolution: "显示答案",
    found: "已找到 @found / @totalWords 个单词",
    timeSpent: "用时",
    score: "您获得了 @score / @total 分",
    wordListHeader: "单词列表",

    // Find the Words Prompt
    find_the_words_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“单词搜索”活动。",
    find_the_words_prompt_mission: "**你的任务:**",
    find_the_words_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 单词搜索活动。",
    find_the_words_prompt_json_structure_title: "**预期的 JSON 结构:**",
    find_the_words_prompt_json_structure_main_object: "对象必须包含：",
    find_the_words_prompt_task_description: "`taskDescription`: 活动的清晰说明。",
    find_the_words_prompt_word_list: "`wordList`: 要查找的单词字符串，用逗号分隔，不含空格。",
    find_the_words_prompt_content_rules_title: "**内容规则:**",
    find_the_words_prompt_rule1: "1.  `wordList` 必须是一个用逗号分隔单词的单个字符串。每个词必须是单独的简单词（不可为多词短语）。禁止使用数字、标点符号和带变音符的字母；只用基础拉丁字母（例如将 'élève' 写成 'eleve'）。",
    find_the_words_prompt_example_json_title: "**JSON 示例:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "在下面的字母网格中找出城市名称",
"wordList": "堪培拉,明斯克,北京,奥斯陆,巴黎,伦敦,马德里,雅典,东京,莫斯科,华盛顿,斯德哥尔摩"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",
    fillPool: "",

    // Sort the Paragraphs UI translations
    checkAnswer: "检查",
    submitAnswer: "提交",
    up: "上",
    down: "下",
    disabled: "已禁用",
    a11y_yourResult: "您获得了 @total 分中的 @score 分",
    a11y_paragraph: "段落",
    a11y_correct: "正确",
    a11y_wrong: "错误",
    a11y_point: "@score 分",
    a11y_sevenOfNine: "@total 中的 @current",
    a11y_currentPosition: "列表中的当前位置",
    a11y_instructionsSelected: "按空格键重新排序",
    a11y_instructionsGrabbed: "按上下箭头键更改位置，按空格键放下，按 escape 取消",
    a11y_grabbed: "已抓住",
    a11y_moved: "已移动",
    a11y_dropped: "已放下",
    a11y_reorderCancelled: "重新排序已取消",
    a11y_finalPosition: "最终位置",
    a11y_nextParagraph: "下一段",
    a11y_correctParagraph: "位置正确的段落",
    a11y_listDescription: "可排序的段落列表。",
    a11y_listDescriptionCheckAnswer: "带结果的段落列表。",
    a11y_listDescriptionShowSolution: "带答案的段落列表。",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“段落排序”活动。",
    sort_the_paragraphs_prompt_mission: "**你的任务:**",
    sort_the_paragraphs_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 段落排序活动。",
    sort_the_paragraphs_prompt_json_structure_title: "**预期的 JSON 结构:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "对象必须包含：",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: 活动的清晰说明。使用 `*单词*` 表示粗体，`**单词**` 表示斜体，`\\n` 表示换行。",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: 字符串数组，每个字符串代表一个要排序的段落。段落必须按正确顺序排列。使用 `*单词*` 表示粗体，`**单词**` 表示斜体。",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",
    sort_the_paragraphs_prompt_content_rules_title: "**内容规则:**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` 必须由内容可推断出逻辑上的递进，不能使用人为线索（编号、日期/时间、“首先/然后/最后”），除非有明确要求。",
    sort_the_paragraphs_prompt_rule2: "2. 不要平铺直叙的清单：每句话都要推进同一条主线（原因→结果、准备→行动→结果、一般→特殊），使顺序可被推断。",
    sort_the_paragraphs_prompt_example_json_title: "**JSON 示例:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "我的早晨日常：",
"paragraphs": [
  "我把水壶装满清水。",
  "我打开电源。",
  "我把一个茶包放入杯子。",
  "我把沸水倒在茶包上。",
  "泡好后我把茶包取出。"
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "显示答案",
    retryButtonLabel: "重试",
    solutionViewTitle: "答案",
    correctText: "正确！",
    incorrectText: "错误！",
    muteButtonLabel: "静音",
    closeButtonLabel: "关闭",
    slideOfTotal: "幻灯片 @slide / @total",
    nextButtonLabel: "下一个",
    solutionListQuestionNumber: "问题 @question",
    a11yShowSolution: "显示答案。任务将标记其正确答案。",
    a11yRetry: "重试任务。重置所有回答并重新开始任务。",
    shouldSelect: "应选择",
    shouldNotSelect: "不应选择",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“单选题集”活动。",
    single_choice_set_prompt_mission: "**你的任务:**",
    single_choice_set_prompt_generate_json: "生成一个完整且有效的 JSON 对象，用于 H5P 单选题集活动。",
    single_choice_set_prompt_json_structure_title: "**预期的 JSON 结构:**",
    single_choice_set_prompt_json_structure_main_object: "对象必须包含：",
    single_choice_set_prompt_choices_array: "`choices`: 一个对象数组，每个对象代表一个问题并包含：",
    single_choice_set_prompt_question: "`question`: 要提出的问题。",
    single_choice_set_prompt_answers_array: "`answers`: 一个字符串数组。第一个字符串始终是正确答案。",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`:（严格规则）必须生成由6个对象组成的数组作为最终反馈，并结合练习主题严格遵循 0-10、11-30、31-50、51-70、71-90、91-100 的分段。每个对象形式为 `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`。`feedback` 文本需友好、不过分、循序渐进且始终为肯定表达。",
    single_choice_set_prompt_content_rules_title: "**内容规则:**",
    single_choice_set_prompt_rule1: "1. 在每个 `answers` 数组中，第一个答案始终是正确的。",
    single_choice_set_prompt_example_json_title: "**JSON 示例:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "枸杞也被称为 ...",
"answers": ["狼莓", "猫莓", "熊莓"]
},
{
"question": "枸杞原产于 ...",
"answers": ["亚洲", "非洲", "欧洲"]
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
    { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
    { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
    { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
    { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
    { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释。",

    // Dialog Cards UI translations
    answer: "翻转",
    next: "下一个",
    prev: "上一个",
    retry: "重试",
    progressText: "卡片 @card / @total",
    cardFrontLabel: "卡片正面",
    cardBackLabel: "卡片背面",
    tipButtonLabel: "显示提示",
    audioNotSupported: "您的浏览器不支持此音频",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "你是一位教学工程专家，正在创建一项 H5P“对话卡”活动。",
    dialog_cards_prompt_mission: "**你的任务:**",
    dialog_cards_prompt_generate_json: "生成一个仅包含 `title`、`description` 和 `dialogs` 键的 JSON 对象，用于 H5P 对话卡活动。",
    dialog_cards_prompt_json_structure_title: "**预期的 JSON 结构:**",
    dialog_cards_prompt_json_structure_main_object: "对象必须包含：",
    dialog_cards_prompt_title: "`title`: 活动的标题（HTML 格式）。",
    dialog_cards_prompt_description: "`description`: 简短的描述或说明（HTML 格式）。",
    dialog_cards_prompt_dialogs_array: "`dialogs`: 一个包含 ${nombreQuestions} 个对象的数组，每个对象代表一张卡片并包含：",
    dialog_cards_prompt_text: "`text`: 卡片正面的文本（HTML 格式）。",
    dialog_cards_prompt_answer: "`answer`: 卡片背面的文本（HTML 格式）。",
    dialog_cards_prompt_tips: "`tips` (可选): 提示对象。如果您认为在教学上有用，请使用 `front` 键为正面添加提示，和/或使用 `back` 键为背面添加提示。",
    dialog_cards_prompt_content_rules_title: "**内容规则:**",
    dialog_cards_prompt_rule1: "1. 正面（`text`）和背面（`answer`）的文本必须清晰简洁。**使用HTML（<strong>表示粗体，<em>表示斜体）格式化内容，以提高可读性并突出重要信息。**",
    dialog_cards_prompt_example_json_title: "**JSON 示例:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "学习英语中的水果名称",
"description": "水果名称以法语呈现。翻转卡片以查看正确的英文翻译。",
"dialogs": [
{
"title": "找出英语动词的一般现在时",
"description": "根据一条英语一般过去时的句子，找出动词的不定式。翻转卡片核对你的答案。",
"dialogs": [
{
"text": "He *visited* his grandmother.",
"answer": "to *visit*",
"tips": {
"front": "识别过去式动词。",
"back": "想到动词的基本形式（不定式）。"
}
},
{
"text": "She *played* soccer.",
"answer": "to *play*",
"tips": {
"front": "寻找句子中的过去式动词。",
"back": "想象动词的词典形式（不定式）。"
}
}
]
}
]
}
\`\`\` `,
   dialog_cards_prompt_generate_only_json: "仅生成包含 `title`、`description` 和 `dialogs` 键的有效 JSON 代码，不要添加任何注释。",

    // Dialog Cards specific UI translations
    correctAnswer: "我答对了！",
    incorrectAnswer: "我答错了",
    round: "第 @round 轮",
    cardsLeft: "剩余卡片：@number",
    nextRound: "进入第 @round 轮",
    startOver: "重新开始",
    showSummary: "下一步",
    summary: "总结",
    summaryCardsRight: "您答对的卡片：",
    summaryCardsWrong: "您答错的卡片：",
    summaryCardsNotShown: "牌组中未显示的卡片：",
    summaryOverallScore: "总分",
    summaryCardsCompleted: "您已完成学习的卡片：",
    summaryCompletedRounds: "已完成的轮次：",
    summaryAllDone: "做得好！您连续 @max 次答对了所有 @cards 张卡片！",
    confirmStartingOverHeader: "重新开始？",
    confirmStartingOverBody: "所有进度都将丢失。您确定要重新开始吗？",
    confirmStartingOverCancelLabel: "取消",
    confirmStartingOverConfirmLabel: "重新开始",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "你是一位教学设计专家，正在创建一个H5P活动“复杂填空”。",
    complex_blanks_prompt_mission: "**你的任务：**",
    complex_blanks_prompt_generate_json: "为H5P的“复杂填空”类型活动生成一个完整且有效的JSON对象。",
    complex_blanks_prompt_json_structure_title: "**预期的JSON结构：**",
    complex_blanks_prompt_json_structure_main_object: "主对象必须包含`content`和`overallFeedback`键。",
    complex_blanks_prompt_task: "`task`: 练习的说明（HTML格式）。",
    complex_blanks_prompt_blanks_text: "`blanksText`: 包含由`___________`表示的空格的文本。",
    complex_blanks_prompt_blanks_list: "`blanksList`: 对象的数组，每个空格一个，按出现顺序列出。",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: 正确答案（可以包含用`/`分隔的备选答案）。",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: 常见错误的对象数组。",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: 常见错误的文本。",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: 此错误的具体反馈（HTML格式）。",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: 基于分数的总体反馈数组。",
    complex_blanks_prompt_content_rules_title: "**内容规则：**",
    complex_blanks_prompt_rule1: "1. `blanksList`中对象的数量必须与`blanksText`中空格的数量相匹配。",
    complex_blanks_prompt_rule2: "2. 提供常见的错误和建设性的反馈。",
    complex_blanks_prompt_rule3: "3. 文本和反馈可以包含简单的HTML标签，如`<p>`、`<strong>`、`<em>`。",
    complex_blanks_prompt_example_json_title: "**JSON示例：**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>把动词放在正确的时态。你会得到典型错误的个别反馈。</p>",
"blanksList": [
{
"correctAnswerText": "不会说",
"incorrectAnswersList": [
{
"incorrectAnswerText": "说不",
"incorrectAnswerFeedback": "<div>记住中文的否定形式是在动词前加“不”或“没”。<em>(说 → 不会说)</em></div>"
},
{
"incorrectAnswerText": "我们不会说",
"incorrectAnswerFeedback": "<div>你忘了这里的主语是第三人称单数 <em>(他)</em>。</div>"
}
]
}
],
"blanksText": "<p>他会说英语，但他 (不会说) ___________<strong>&nbsp;</strong>德语。</p>"
},
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "0-10%的反馈" },
    { "from": 11, "to": 30, "feedback": "11-30%的反馈" },
    { "from": 31, "to": 50, "feedback": "31-50%的反馈" },
    { "from": 51, "to": 70, "feedback": "51-70%的反馈" },
    { "from": 71, "to": 90, "feedback": "71-90%的反馈" },
    { "from": 91, "to": 100, "feedback": "91-100%的反馈" }
]
}
\`\`\` `,
    complex_blanks_prompt_generate_only_json: "只生成有效的JSON代码，不含任何注释。",

    // Chart Prompt
    chart_prompt_role: "你是一位教学设计专家，正在创建一个H5P活动“图表”。",
    chart_prompt_mission: "**你的任务：**",
    chart_prompt_generate_json: "为H5P的图表类型活动生成一个完整且有效的JSON对象。",
    chart_prompt_json_structure_title: "**预期的JSON结构：**",
    chart_prompt_json_structure_main_object: "对象必须包含：",
    chart_prompt_graph_mode: "`graphMode`: 根据上下文选择最相关的图表类型，'pieChart'（饼图）或'barChart'（条形图），除非另有指示。",
    chart_prompt_list_of_types: "`listOfTypes`: 对象的数组，每个对象代表图表中的一个数据点。",
    chart_prompt_value: "`value`: 数据点的数值。",
    chart_prompt_color: "`color`: 数据点的颜色（十六进制代码）。",
    chart_prompt_font_color: "`fontColor`: 数据点文本的颜色（十六进制代码）。",
    chart_prompt_text: "`text`: 数据点的标签。",
    chart_prompt_figure_definition: "`figureDefinition`: 图表的简要说明。",
    chart_prompt_content_rules_title: "**内容规则：**",
    chart_prompt_rule1: "1. 选择对比鲜明的颜色以便于阅读。",
    chart_prompt_rule2: "2. 标签应简短明了。",
    chart_prompt_rule3: "3. 如果某个值与其他值相比非常低，请优先选择'barChart'以获得更好的可视化效果。",
    chart_prompt_example_json_title: "**JSON示例：**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "蓝莓"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "覆盆子"}
],
"figureDefinition": "图表"
}
\`\`\` `,
    chart_prompt_generate_only_json: "只生成有效的JSON代码，不含任何注释。",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "上一个",
    quiz_next_button: "下一个",
    quiz_finish_button: "完成",
    quiz_submit_button: "提交",
    quiz_textual_progress: "问题 @current / @total",
    quiz_no_result_message: "已完成",
    quiz_result_message: "你的结果：",
    quiz_score_bar_label: "你获得了 @totals 分中的 @finals 分",
    quiz_solution_button_text: "显示答案",
    quiz_retry_button_text: "重试",
    quiz_finish_button_text: "完成",
    quiz_submit_button_text: "提交",
    quiz_feedback_available: "反馈可用",
    quiz_read_feedback: "阅读反馈",
    quiz_wrong_answer: "错误答案",
    quiz_correct_answer: "正确答案",
    quiz_should_check: "应该已勾选",
    quiz_should_not_check: "不应该已勾选",
    quiz_no_input: "请在查看答案前回答。",
    quiz_a11y_check: "检查答案。答案将被标记为正确、错误或未回答。",
    quiz_a11y_show_solution: "显示答案。任务将标记其正确答案。",
    quiz_a11y_retry: "重试任务。重置所有回答并重新开始任务。",

    // Albert generation
    generate_with_albert: "使用Albert生成",
    generation_in_progress: "正在生成，请稍候...",
    request_sent_to_ia: "已向AI发送请求，请稍候...",
    generation_successful: "H5P内容已成功生成！",
    generation_failed_empty: "生成失败。响应为空。",
    generation_failed_error: "生成过程中出错：{errorMessage}",

    // Albert models description
    albert_small_summary: "快速、简单，适用于快速和结构化的练习。",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "功能强大，细致入微，非常适合复杂的任务和写作。",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "专业、精确，专为编程和代码设计。",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "源模型:",
    albert_model_parameters: "模型大小:",
    albert_model_parameters_small: "80亿参数",
    albert_model_parameters_large: "240亿参数",
    albert_model_parameters_code: "325亿参数",
    language: "语言",
    tutorial: "教程",
    
    // 术语表 XML 提示
    glossaire_xml_prompt_role: "你是一名教学设计专家，你将为一个术语表创建内容。",
    glossaire_xml_prompt_mission: "**你的任务：** 你需要生成一个简单的 JSON 对象，其中包含术语表的术语列表。每个术语都应包含一个概念、一个定义，以及（如适用）一个别名列表。",
    glossaire_xml_prompt_structure_title: "**期望的 JSON 结构：**",
    glossaire_xml_prompt_structure_rules: `
-   **根：** 一个主对象，包含两个键：\`name\`（术语表名称）和\`entries\`（对象数组）。
-   **\`entries\` 中的每个对象必须包含：**
    -   \`concept\`：需要定义的词或短语。
    -   \`definition\`：清晰而简明的定义。加粗用 *mot*，斜体用 **mot**，换行用 \\n，仅在教学上合适时使用。
    -   \`aliases\`（可选）：用于同义词或替代术语的字符串数组。仅在存在相关别名时添加此键。`,
    glossaire_xml_prompt_example_title: "**JSON 示例：**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "信息词汇表",
  "entries": [
    {
      "concept": "记者",
      "definition": "**采集**、核实并传播*信息*的人。",
      "aliases": ["通讯员", "专栏作家"]
    },
    {
      "concept": "来源",
      "definition": "一则*信息*的来源。"
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "只生成有效的 JSON 代码，不要添加任何注释。",

    //Barre de menu
    tab_all: "全部",
    tab_quiz: "测验与测试",
    tab_text: "文本处理",
    tab_memory: "记忆与发现",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 获取提示",
    create_file_step: "2/2 创建文件",
    generate_one_click: "一键生成",
    simple_mode: "简单",
    advanced_mode: "引导",

    // RAG feature
    activate_rag: "启用文档查阅",
    rag_tooltip: "允许粘贴文本或上传PDF。内容将作为生成活动的主要来源。",
    rag_title: "附加文件（可选）",
    rag_note: "如果您希望AI完全基于您的文档进行工作，请在此处粘贴文本或拖放文件。否则，请将此区域留空，以允许AI自行搜索信息。",
    upload_pdf: "或上传PDF进行分析",
    pdf_loading: "正在加载PDF...",
    pdf_processing_page: "正在处理页面",
    ocr_recognizing_page: "正在识别（OCR）页面",
    ocr_success: "文档已成功处理。",
    ocr_error: "处理过程中发生错误。",
    error_invalid_pdf: "请选择一个有效的PDF文件。",
    error_fullscreen: "全屏模式失败：",
    lock_text: "锁定",
    unlock_text: "解锁",
    rag_instruction: "\n\n您只能查阅以下信息来生成内容：",

    // 焦糖制作步骤
    caramel_animation_step_1: "将糖倒入锅中...",
    caramel_animation_step_2: "加入少许水...",
    caramel_animation_step_3: "用中火加热...",
    caramel_animation_step_4: "糖开始融化...",
    caramel_animation_step_5: "开始上色...",
    caramel_animation_step_6: "轻轻搅拌...",
    caramel_animation_step_7: "焦糖呈现出漂亮的琥珀色...",
    caramel_animation_step_8: "加入热奶油...",
    caramel_animation_step_9: "小心溅出！",
    caramel_animation_step_10: "充分搅拌...",
    caramel_animation_step_11: "快要完成了！",

    // 页面提示
    page_prompt_role: "你是一名教学设计专家，正在为 Éléa/Moodle 创建一个结构化的“页面”活动。",
    page_prompt_mission: "**你的任务 :**",
    page_prompt_generate_json: "生成一个 JSON 对象，用于构建 Éléa 内容页面。页面结构基于预定义的区块。你需要从下方列表中选择最相关的区块来满足用户的需求。",
    page_prompt_json_structure_title: "**期望的 JSON 结构 :**",
    page_prompt_json_structure_main_object: "主对象必须包含用于页面标题的键 \"title\"、用于对后续课程内容进行清晰易懂介绍的键 \"intro\"，以及作为对象数组的键 \"blocks\"。每个对象代表一个内容区块，必须具有与下列某个区块对应的 \"type\"，以及包含区块特定信息的 \"data\" 对象。",
    page_prompt_blocks_list_title: "**可用区块列表 :**",
    page_prompt_block_01: "- `#01_hero_header`: 开场横幅。 `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: 带内部链接的目录。 `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: 历史要点（3 张卡片）。 `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (最多 3 张)",
    page_prompt_block_04: "- `#04_callout_set`: 横幅：目标、须知、警示。 `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: 关键数据卡片。 `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: 词汇表（表格）。 `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: 术语表（chips 形式）。 `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: 含图片的纪念性建筑卡片。 `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: 两幅图像对比。 `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: 对比表。 `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: 定义框。 `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"定义\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: 课程段落。 `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: 详细资料卡。 `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: 常见问题。 `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: 谬误 vs 事实。 `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"谬误\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"事实\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: 描述图片的方法。 `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: 网络参考文献。 `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"网络参考文献\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: 双语引文。 `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**内容规则 :**",
    page_prompt_rule1: "1.  JSON 必须有效。",
    page_prompt_rule2: "2.  文本内容可以使用 Markdown 标签 `*词*` 表示加粗，`**词**` 表示斜体。",
    page_prompt_rule3: "3.  对于图片，请寻找相关且免版权的 URL（例如：Wikimedia Commons）。",
    page_prompt_example_json_title: "**JSON 示例 :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "法国大革命",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "法国大革命", "subtitle": "关键参照点" } },
    { "type": "#12_context_paragraphs", "data": { "title": "背景", "paragraphs": ["法国大革命是一个巨变的时期...", "多种原因解释了这一事件..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "关键事件", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "攻占巴士底狱", "caption": "1789年7月14日", "title": "攻占巴士底狱", "text": "这一事件标志着革命的开始。" }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "仅生成有效的 JSON 代码，不要添加任何注释.",
    drag_drop_text: "将 PDF 文件拖放到此处",
    or_text: "或",
    upload_pdf_btn: "选择一个文件",
    paste_your_text_here: "复制并在此处粘贴您的文本..."
};