const translations_zh = {
  subtitle: "辅助创建 Moodle 与 Éléa 的资源与活动",
  help_modal_title: "🚀 面向教师的 Caramel 全面指南",
  help_modal_content: `
    <p>欢迎使用 <strong>Caramel</strong>！本指南将以循序渐进的方式引导你，即使是初学者也能轻松上手。我们的目标是帮助你以简单高效的方式创建交互式学习活动。</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> 描述</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> 选择</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> 生成</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> 预览与下载</a>
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
            这一强大的功能允许你基于提供的多内容进行生成。你可以<strong>复制粘贴文本</strong>，或者<strong>上传文档 (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>。
            <br><strong><i class="fas fa-lock"></i> 隐私：</strong> 请放心，你的文档处理<strong>完全在你的电脑本地完成</strong>。不会有任何数据被发送到互联网。 </p>
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
            <h5><i class="fas fa-rocket"></i> 选项 A：简单显示 - 一键生成</h5>
            <p>快捷方式。点击 <button class="help-btn-example-llm">一键生成</button>，AI 将生成内容并直接放入右侧结果区域。你可通过按钮右侧的小箭头选择不同模型（快速、强力等）。</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> 选项 B：引导显示 - 使用外部 AI</h5>
            <p>用于获得最大控制力。左侧显示提示词（AI 指令）。</p>
            <ol>
                <li>如需可先编辑提示词。</li>
                <li>请使用 <strong>复制提示词</strong> 按钮，并在新标签页中打开您选择的面向大众的人工智能服务。</li>
                <li>将提示词粘贴到 AI，获取输出后，粘贴到右侧的 Caramel 结果区域。</li>
            </ol>
            <p>实用图标：<span class="help-badge-icon"><i class="fas fa-expand"></i> 全屏</span> 与 <span class="help-badge-icon"><i class="fas fa-lock"></i> 锁定</span>（保护提示词）。</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> 预览与下载</h4>
        <p>内容生成后，您可以进行预览、测试并以不同格式下载。</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> 预览与测试</summary>
            <p>请花点时间在预览窗口中检查您的活动：</p>
            <ul>
                <li><strong>滚动</strong>查看内容以进行全文校对。</li>
                <li>以学生身份<strong>测试</strong>活动（点击、拖动、输入...）。</li>
                <li>对于 <strong>Éléa/Magistère/Moodle</strong> 内容，模拟器会向您展示真实效果。</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="预览窗口" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>直接在模拟器中测试活动。</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> 下载（格式与导出）</summary>
            <p>您有多种获取作品的选择：</p>
            <ul>
                <li><strong>交互格式（主按钮）：</strong> 获取数字文件（如 .h5p, .mbz）并放置在您的平台上。</li>
                <li><strong>其他格式（下拉菜单）：</strong> 点击箭头下载为 <strong>PDF, DOCX 或 ODT</strong>（适用于打印或存档）。</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="导出菜单" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>展开菜单以访问 PDF, DOCX 导出...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> 集成到 Éléa/Magistère</h5>
        <p>文件下载后，以下是将其添加到课程的方法：</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span>（H5P 活动）</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>快速方法：</strong> 启用课程的编辑模式，将 .h5p 文件直接拖放到目标区块。选择 “Ajouter une activité H5P”，再用 “DÉPOSER” 按钮完成。
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="快速添加 H5P 活动" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>添加 H5P 活动并点击 DÉPOSER。</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>推荐方法（适合设计者）：</strong> 点击 "添加活动或资源"，选择 "互动内容 (H5P)"，然后在 "编辑器" 字段选择 "Téléverser" 分页并继续 "Téléverser un fichier"。最后点击 "Utiliser"，补充必要信息后保存，分享课程时即可确保活动被打包。</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span>（页面、百万富翁、匹配、MCQ）</summary>
                <div class="import-content">
                    <p>此格式会将完整活动导入课程。</p>
                    <ol>
                        <li>
                            <p>打开屏幕右侧的编辑菜单。如果被收起，请使用小箭头展开。</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="右侧展开的编辑菜单" style="width:75%;height:auto;">
                                    <figcaption><em>编辑菜单展开。</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="展开编辑面板的小箭头" style="width:75%;height:auto;">
                                    <figcaption><em>需要时点击箭头展开。</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>点击 "IMPORT/EXPORT"，然后在子菜单中选择 "Importer un parcours"。</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="Moodle/Éléa 的 IMPORT/EXPORT 按钮" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>选择 Importer un parcours。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            将 .mbz 文件拖放到导入区域并点击 "IMPORTER"。
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="拖放 MBZ 文件的区域" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>放入文件并用 IMPORTER 确认。</em></figcaption>
                            </figure>
                        </li>
                        <li>最后在向导的末步点击 "CONTINUER"，活动就会添加到课程中。</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span>（词汇表活动）</summary>
                <div class="import-content">
                    <p>此格式允许您将定义列表导入到 Éléa/Moodle 词汇表中。</p>
                    <ol>
                        <li>
                            <p>在课程中创建一个空白的词汇表活动并打开它。</p>
                        </li>
                        <li>
                            <p>进入词汇表后，点击 "IMPORTER DES ARTICLES" 按钮。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="词汇表中的 IMPORTER DES ARTICLES 按钮" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>点击 IMPORTER DES ARTICLES。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>将 .xml 文件拖放到导入区域，然后点击 "ENVOYER" 按钮。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="词汇表 XML 文件的放置区域" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>放置文件并用 ENVOYER 验证。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>您的条目已被检测到。点击 "CONTINUER" 按钮完成操作。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="确认检测到的条目" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>点击 CONTINUER 完成导入。</em></figcaption>
                            </figure>
                        </li>
                        <li>导入完成。您的定义现已在词汇表中可用。</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> 与 <span class="help-badge-file">.GIFT</span>（测验活动）</summary>
                <div class="import-content">
                    <p>这些格式会把题目导入到"题库"。</p>
                    <ol>
                        <li>
                            <p>在您的 Éléa 课程中，转到"更多"选项卡，然后点击"题库"。</p>
                        </li>
                        <li>
                            <p>在显示"题目"的下拉菜单中，选择"导入"。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="在题库中选择导入按钮" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>在下拉菜单中选择导入。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>选择与您的文件对应的格式：</p>
                            <ul>
                                <li><strong>Moodle XML 格式</strong>（推荐）：支持所有题目类型的完整格式。</li>
                                <li><strong>GIFT 格式</strong>：更简单的替代方案，但题目类型有限。</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="在 Moodle XML 格式和 GIFT 格式之间选择" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>选择适合您文件的格式。</em></figcaption>
                            </figure>
                        </li>
                        <li>将文件拖放到上传区域。</li>
                        <li>点击"IMPORTATION"按钮。屏幕将显示添加的题目（例如：已添加 10 道题目）。</li>
                        <li>通过点击页面底部的"CONTINUER"完成操作。</li>
                        <li>题目现已准备好添加到测验活动中。请参阅 <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">Éléa 教程</a> 以创建测验活动并从题库加载题目。</li>
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
                        <li>在页面编辑器中点击图标切换到 HTML 模式（通常以 "&lt;&gt;" 显示）。</li>
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
            <li><strong>交流与提问：</strong> 欢迎加入 <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> 房间与社区交流。</li>
            <li><strong>报告问题：</strong> 发现 Bug？请提交 <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">issue</a>。若可能，请附上导致错误的 JSON 文件，便于我们快速修复。</li>
            <li><strong>支持项目：</strong> 如果你喜欢本工具，请在 <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">Forge 页面</a> 点亮一颗星。这是对我们最大的鼓励！</li>
        </ul>
    </div>
    `,

  // ============================================================================
  // 主界面
  // ============================================================================
  language: "语言",
  tutorial: "教程",
  notifications: "通知",
  fast_mode: "快速模式",
  guided_mode: "高级模式",
  who_are_you: "你是谁？（如：教师、培训师...）",
  what_to_address: "你想讨论什么？（如：法国大革命...）",
  level: "针对级别（如：高中）",
  number_of_elements: "模块中的问题/元素数量（如：5）",

  // ============================================================================
  // 文档处理 (RAG/OCR)
  // ============================================================================
  rag_title: "添加文档（可选）",
  rag_note: "如果你希望 AI 仅根据你的文档工作，请在此处粘贴文本或上传文件。否则，请留空，让 AI 自行搜索信息。",
  error_duplicate_file: "该文件已添加。",
  error_unsupported_format: "不支持的格式。接受的格式：",
  ocr_scanned_page: "检测到扫描页，正在运行 OCR",
  ocr_image_processing: "正在进行图像文字识别 (OCR)",
  ocr_initializing: "正在初始化 OCR...",
  ocr_loading_language: "正在加载语言模型...",
  ocr_preparing: "正在准备分析...",
  docx_processing: "正在提取 DOCX 文本...",
  pptx_processing: "正在提取 PPTX 文本...",
  odt_processing: "正在提取 ODT 文本...",
  odp_processing: "正在提取 ODP 文本...",
  file_loading: "正在加载文件...",
  extraction_success: "文档处理成功。",
  extraction_error: "处理过程中发生错误。",
  error_fullscreen: "全屏模式失败：",
  lock_text: "锁定",
  unlock_text: "解锁",
  drag_drop_text: "在此处拖放文档 (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "或",
  upload_pdf_btn: "选择文件",
  paste_your_text_here: "在此处粘贴你的文本...",
  rag_tags_tuto: "以下是已上传的文档。点击彩色圆圈可自定义每个文档的高亮显示。",

  // ============================================================================
  // 标签页
  // ============================================================================
  tab_all: "全部",
  tab_quiz: "测验与测试",
  tab_text: "文本处理",
  tab_memory: "记忆与发现",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // H5P 活动详情
  // ============================================================================
  h5p_timeline_name: "时间轴",
  h5p_timeline_description: "创建交互式时间轴以展示一系列事件。",
  h5p_flashcards_name: "抽认卡",
  h5p_flashcards_description: "创建双面卡片以帮助记忆术语和定义。",
  h5p_quiz_set_name: "混合测验",
  h5p_quiz_set_description: "组合各种类型的问题（单选、拖放等）以评估知识。",
  h5p_quiz_set_qcm_name: "选择题测验",
  h5p_quiz_set_qcm_description: "创建一个完全由选择题组成的测验。",
  h5p_quiz_set_vf_name: "判断对错测验",
  h5p_quiz_set_vf_description: "创建一个仅包含“对”或“错”类型问题的测验。",
  h5p_glossary_name: "术语表",
  h5p_glossary_description: "以折叠面板的形式创建术语表或常见问题解答。",
  h5p_crossword_name: "填字游戏",
  h5p_crossword_description: "根据单词和定义列表生成填字游戏网格。",
  h5p_essay_name: "作文",
  h5p_essay_description: "布置作文题目并定义关键词以实现自动评分。",
  h5p_summary_name: "总结",
  h5p_summary_description: "学生必须通过选择正确的句子来重构一段总结。",
  h5p_drag_the_words_name: "拖动单词",
  h5p_drag_the_words_description: "创建一个文本填空，学生必须将缺失的单词拖入其中。",
  h5p_fill_in_the_blanks_name: "文本填空",
  h5p_fill_in_the_blanks_description: "学生必须通过键盘直接在文本中填写缺失的单词。",
  h5p_mark_the_words_name: "标记单词",
  h5p_mark_the_words_description: "要求学生在段落中标记出某些单词。",
  h5p_true_false_name: "判断正误",
  h5p_true_false_description: "创建<strong style='color: red;'>一个</strong>只有“正确”或“错误”两个选项的简单问题。",
  h5p_multiple_choice_name: "多选题",
  h5p_multiple_choice_description: "创建<strong style='color: red;'>一个</strong>具有一个或多个正确答案的多选题。",
  h5p_find_the_words_name: "单词搜索",
  h5p_find_the_words_description: "创建一个字母网格，学生必须在其中找到特定单词。",
  h5p_sort_the_paragraphs_name: "段落排序",
  h5p_sort_the_paragraphs_description: "创建一组段落，学生必须将它们重新排列成正确的顺序。",
  h5p_single_choice_set_name: "单选题集",
  h5p_single_choice_set_description: "创建一系列问题，每个问题只有一个正确答案。",
  h5p_dialog_cards_name: "对话卡片",
  h5p_dialog_cards_description: "创建包含文本（及可选图片）的交互式双面卡片。",
  h5p_complex_fill_the_blanks_name: "复杂填空",
  h5p_complex_fill_the_blanks_description: "创建一个高级填空练习，并为每个错误提供特定的反馈。",
  h5p_chart_name: "图表",
  h5p_chart_description: "创建饼图或条形图以可视化数据。",

  // ============================================================================
  // ÉLÉA/MOODLE 活动详情
  // ============================================================================
  moodle_xml_name: "测试",
  moodle_xml_description: "生成可直接导入“测试”活动的题库（XML 或 GIFT 格式）。",
  moodle_xml_help: "要在 Moodle 的“测试”活动中添加 XML 文件，请先创建活动。然后打开<strong>更多</strong>菜单并进入<strong>题库</strong>。点击<strong>导入</strong>，选择 <strong>Moodle XML 格式</strong>，然后选择你的文件并确认。",
  moodle_gift_name: "GIFT 格式",
  moodle_gift_description: "以 GIFT 格式创建问题，这是一种向 Moodle 导入问题的简单方式。",
  moodle_millionnaire_name: "百万富翁",
  moodle_millionnaire_description: "生成一个包含 6 个难度递增问题的“百万富翁”活动。",
  moodle_appariement_name: "匹配",
  moodle_appariement_description: "生成一个包含 10 个问题的匹配练习。",
  moodle_qcm_name: "选择题 (QCM)",
  moodle_qcm_description: "生成一个简单的选择题活动。",
  moodle_glossaire_xml_name: "术语表 (XML)",
  moodle_glossaire_xml_description: "生成一个准备以 XML 格式导入的术语表。",
  glossaire_success_generation: "文件 {fileName} 生成成功！",
  glossaire_error_creation: "创建术语表 XML 时出错：",
  glossaire_error_invalid_json: "JSON 必须包含名称 ('name') 和条目数组 ('entries')。",
  elea_page_name: "页面",
  elea_page_description: "创建一个具有视觉美化效果的 Éléa 内容页面。",

  // ============================================================================
  // 生成弹窗
  // ============================================================================
  get_prompt_step: "1/2 获取并复制提示词",
  create_file_step: "2/2 根据 JSON 创建文件",
  generate_one_click: "一键生成",
  simple_mode: "简单",
  advanced_mode: "引导",
  prompt_for_ia: "AI 提示词 (Prompt)",
  copy_prompt: "复制提示词",
  fullscreen_prompt: "全屏",
  exit_fullscreen_prompt: "退出全屏",
  lock_prompt: "锁定",
  unlock_prompt: "解锁",
  go_duck: "复制并前往 Duck.ai",
  go_mistral: "复制并前往 Le chat",
  create_h5p_file: "创建 H5P 文件",
  integrate_h5p_libraries: "集成 H5P 库：",
  paste_ia_result: "将 AI 的结果粘贴在下方区域以创建你的模块。",
  generate_h5p: "生成 H5P",
  create_xml_file: "创建 XML 文件",
  paste_ia_result_xml: "请将 AI 生成的 XML 粘贴在下方。",
  generate_xml_file: "生成 XML 文件",
  export_mbz: "MBZ 格式",
  export_gift: "GIFT 格式",
  export_xml: "XML 格式",
  export_html: "HTML 格式",
  export_docx: "DOCX 格式",
  export_odt: "ODT 格式",
  export_pdf: "PDF 格式",
  export_error: "导出错误",
  create_mbz_file_appariement: "创建匹配文件 (.mbz)",
  paste_ia_result_appariement: "请将 AI 生成的 JSON 粘贴在下方。活动标题将自动从 JSON 中提取。",
  generate_mbz_appariement: "生成匹配活动 (mbz)",
  create_mbz_file_millionnaire: "创建百万富翁文件 (.mbz)",
  paste_ia_result_millionnaire: "请将 AI 生成的 JSON 粘贴在下方。活动标题将自动从 JSON 中提取。",
  generate_mbz_millionnaire: "生成百万富翁活动 (mbz)",
  generate_mbz_test: "生成测试活动 (mbz)",
  create_mbz_file_qcm: "创建 QCM 文件 (.mbz)",
  paste_ia_result_qcm: "请将 AI 生成的 JSON 粘贴在下方。活动标题将自动从 JSON 中提取。",
  generate_mbz_qcm: "生成 QCM 活动 (mbz)",
  create_mbz_file_page: "创建页面文件 (.mbz)",
  paste_ia_result_page: "请将 AI 生成的 JSON 粘贴在下方以构建页面。",
  generate_mbz_page: "生成页面活动 (mbz)",
  generate_prompts_placeholder: "一旦你在快速或高级模式中完成至少一个字段，AI 提示词将显示在这里。",
  paste_json_or_text: "在此处粘贴 AI 生成的 JSON 内容或文本以创建活动。",
  info_prompt_copy: "请勿将此提示词粘贴在右侧面板。请将其复制到通用 AI 中获取结果，然后将该结果粘贴在右侧面板。",
  generate_with_llm: "使用 Caramel AI 生成",
  generation_in_progress: "正在生成，请稍候...",
  request_sent_to_ia: "请求已发送至 AI，请稍候...",
  generation_successful: "H5P 内容生成成功！",
  generation_failed_empty: "生成失败。响应为空。",
  generation_failed_error: "生成错误：{errorMessage}",
  generation_failed_llm: "通过 Caramel AI 生成失败。原因：{errorMessage}",
  llm_small_summary: "Caramel mou：快速、轻量，适合快速练习和即时回答。低资源消耗。",
  llm_large_summary: "Caramel coulant：更丰富、细腻，适合需要一定深度的任务。中资源消耗。",
  llm_xl_summary: "Caramel dur：强大且复杂，适用于雄心勃勃的项目。需耐心等待，结果有保证！高资源消耗。",
  llm_model_source: "模型提供商：",
  llm_model_parameters: "模型规模：",
  llm_model_parameters_unit: "亿参数",

  // ============================================================================
  // 焦糖烹饪动画
  // ============================================================================
  caramel_animation_step_1: "将糖倒入锅中...",
  caramel_animation_step_2: "加入少许水...",
  caramel_animation_step_3: "用中火加热...",
  caramel_animation_step_4: "糖开始融化...",
  caramel_animation_step_5: "开始变色...",
  caramel_animation_step_6: "轻轻搅拌...",
  caramel_animation_step_7: "焦糖呈现出美丽的琥珀色...",
  caramel_animation_step_8: "加入热奶油...",
  caramel_animation_step_9: "小心溅洒！",
  caramel_animation_step_10: "充分混合...",
  caramel_animation_step_11: "快要准备好了！",
  caramel_success_title: "您的甜点准备好了！",

  // ============================================================================
  // 通知与错误
  // ============================================================================
  prompts_generated_successfully: "提示词生成成功！",
  success_copy: "✓ 已复制！",
  error_please_fill_fields: "请在快速模式下至少填写一个字段。",
  error_please_fill_guided_fields: "请在高级模式下至少填写一个字段。",
  error_field_empty: "字段为空。请先生成提示词。",
  error_copy_failed: "复制失败。",
  error_h5p_module_not_found: "未找到模块 '{moduleKey}'。",
  error_invalid_quiz_json: "测验的 JSON 无效：{errorMessage}",
  error_invalid_json: "提供的 JSON 无效。错误：{errorMessage}",
  error_h5p_creation: "H5P 创建错误：{errorMessage}",
  error_paste_ia_content: "请粘贴由 AI 生成的内容。",
  error_compression_module_not_ready: "压缩模块尚未准备好。请稍后再试。",
  h5p_file_generated_successfully: "文件 {fileName} 生成成功！",
  h5p_creation_failed: "H5P 文件创建失败：{errorMessage}",
  error_paste_json_content: "请粘贴生成的 JSON 内容。",
  error_paste_xml_content: "请粘贴生成的 XML 内容。",
  moodle_xml_success_generation: "文件 {fileName} 生成成功！",
  test_error_creation_mbz: "创建测试 MBZ 时出错：",
  test_success_generation: "文件 {fileName} 生成成功！",
  test_error_generic: "错误：",
  test_backup_log: "由 Caramel 自动创建的备份\n",
  millionnaire_error_compression_libs: "压缩库（Tar.js 或 fflate）未加载。请检查您的网络连接或刷新页面。",
  millionnaire_error_invalid_json: "JSON 结构无效。请确保它包含 'title' 和一个包含 6 个符合示例问题的 'questions' 数组。",
  millionnaire_activity_intro: "参加此游戏以测试您的知识。",
  millionnaire_backup_log: "由 Caramel 自动创建的备份\n",
  millionnaire_success_generation: "文件 {fileName} 生成成功！",
  millionnaire_error_creation_mbz: "创建 MBZ 时出错：",
  millionnaire_error_generic: "错误：",
  appariement_error_invalid_json: "JSON 结构无效。请确保它包含 'title' 和一个 'pairs' 数组，其中每对都有 'question' 和 'answer'。",
  appariement_activity_intro: "找到对应的配对。",
  appariement_success_generation: "文件 {fileName} 生成成功！",
  appariement_error_creation_mbz: "创建匹配 MBZ 时出错：",
  qcm_error_invalid_json: "JSON 结构无效。请确保它包含 'title' 和一个至少包含一个问题及选项的 'questions' 数组。",
  qcm_activity_intro: "回答以下问题。",
  qcm_success_generation: "文件 {fileName} 生成成功！",
  qcm_error_creation_mbz: "创建 QCM MBZ 时出错：",
  version_modal_title: "有新版本可用",
  version_modal_message: "您当前使用的是版本 {currentVersion}。已有更新的版本 ({latestVersion})。请重新加载页面以享受最新的改进。",
  version_modal_update: "加载新版本",
  version_modal_remind_later: "稍后提醒我",

  prompt_header_pedagogical_context: "教学背景",
  prompt_header_specific_rules: "特定规则",
  prompt_header_pedagogical_rules: "教学规则",
  prompt_header_sources: "来源",
  prompt_header_json_structure: "预期 JSON 结构",
  prompt_header_rendering_example: "渲染示例",
  prompt_fallback_teacher: "一名教师",
  prompt_fallback_activity: "创建教学活动",

  // ============================================================================

  // --- 通用键 ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- 你的角色：[QUI]。教学法和教学工程专家
- 你的教学目标：[QUOI]
- 你的受众：[NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- 适应与词汇：根据指定的受众调整语言基调、词汇和指令难度。保持相关性和吸引力。
- 基调与反馈：指令和备注应当具有建设性、鼓励性，并以学习为导向。
- 合规性：强制要求内容符合现行的官方参考标准。除非有明确说明，否则默认针对学生受众参考法国学校教学大纲 (Eduscol)，针对成人受众参考职业培训的相关法律文件。
- 语言：内容和指令必须以中文编写。`,

  SOURCES_COMMUNES: `- 你将仅使用以下文本来生成你的活动。
---
[RAG]
---`,

  // ============================================================================
  // === 时间轴 ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- 事件数量：至少 5 个事件 || [NOMBRE_ELEMENTS] 个事件。
- 时期 (era)：至少 2 个时期，涵盖若干事件组。
- 媒体：如果可能，为每个素材添加来源和说明。积极寻找相关的且无版权限制的图像（例如：Wikimedia Commons）。`,

  TIMELINE_STRUCTURE_JSON: `- 在代码块中仅生成一个完整且有效的 JSON。你的回答必须以 \`{\` 开头，以 \`}\` 结尾。不要有任何其他文本或注释。
- **根对象：** 包含键 \`timeline\` (对象)。
- **\`timeline\` 的内容：** 活动的主体结构。
  - \`headline\`: 时间轴的总标题（必须是纯文本）。
  - \`text\`: 吸引人的介绍（支持 Markdown）。
  - \`asset\`: 封面媒体 (\`media\`: 直接链接，\`caption\`: 说明，\`credit\`: 来源)。
  - \`date\`: 按时间顺序排列的事件数组。
  - \`era\`: 背景时期数组（在背景中定义彩色区域）。
- **\`date\` 和 \`era\` 对象的结构：**
  - \`startDate\`: **严格格式** \`YYYY,MM,DD\` 或 \`YYYY\`。(必填)
  - \`endDate\`: **严格格式** \`YYYY,MM,DD\` 或 \`YYYY\`。(可选，定义时期的持续时间/结束)
  - \`headline\`: 元素的明确标题（必须是纯文本）。
  - \`text\`: 教学叙述。使用 \`**文字**\` 表示加粗，\`*文字*\` 表示斜体，\`\\n\` 表示换行。
  - \`asset\`: (可选) 媒体对象 (\`media\`: Wikimedia Commons 直接链接，\`caption\`，\`credit\`)。
  - \`tag\`: 用于筛选的简短关键词（例如：'政治'、'科学'）。
- **LaTeX:** 使用双转义：\`\\\\( (2^3)^2 \\\\)\`。`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "太空探索史",
    "text": "了解人类在**太空**冒险中经历的重大阶段。",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "阿波罗 11 号任务发射。",
      "credit": "NASA / 维基共享资源"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "斯普特尼克 1 号发射",
        "text": "苏联成功将**首颗人造卫星**送入轨道。",
        "tag": "机器人"
      },
      {
        "startDate": "1969,07,20",
        "headline": "月球第一步",
        "text": "尼尔·阿姆斯特朗在**阿波罗 11 号**任务中成为首位登上月球的人。",
        "tag": "人类"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "太空冷战",
        "text": "美国与苏联之间激烈竞争的时期。",
        "tag": "背景"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === 填字游戏 ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- 单词数量：至少 6 个单词 || [NOMBRE_ELEMENTS] 个单词。
- 拼写规则：答案 (\`answer\`) 只能包含字母。任何复合词、缩写或短语必须合并为一个单词，不留空格、连字符或其他字符（例如：'arc-en-ciel' 变为 'arcenciel'）。
- 提示 (\`clue\`)：禁止在提示中出现待猜单词。提示应当简短、准确。
- 额外提示 (\`extraClue\`)：AI 应当判断是否有必要添加额外提示。`,

  CROSSWORD_STRUCTURE_JSON: `- 在代码块中仅生成一个完整且有效的 JSON。你的回答必须以 \`{\` 开头，以 \`}\` 结尾。不要有任何其他文本或注释。
- \`title\`: 活动的标题。
- \`words\`: 包含以下内容的数组：
  - \`answer\`: 待猜单词（合并后不含空格或连字符）。
  - \`clue\`: 简短准确的定义。
  - \`extraClue\` (可选): \`{"params": {"text": "..."}}\` 对象。文本可以使用 \`**文字**\` 表示加粗，\`*文字*\` 表示斜体，\`\\n\` 表示换行。
- \`taskDescription\`: 明确且情境化的指令。使用 \`**文字**\` 表示加粗，\`*文字*\` 表示斜体，\`\\n\` 表示换行。换行后说明：“对于复合词，请勿使用空格或连字符”。
- \`overallFeedback\`: (严格规则) 你必须生成一个包含 6 个最终反馈对象的数组，情境化地贴合练习主题，严格遵守以下分值段：0-10, 11-30, 31-50, 51-70, 71-90 和 91-100。`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "生物学交叉词",
  "words": [
    {"answer": "Cellule", "clue": "生命的基本单位。", "extraClue": {"params": {"text": "它可以是**动物性的**或**植物性的**。"}}},
    {"answer": "ADN", "clue": "携带遗传信息的分子。"}
  ],
  "taskDescription": "**完成**生物学术语填空。\\n对于复合词，请勿使用空格或连字符。",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "需要努力来更好地理解这些生物学概念。"},
    {"from": 11, "to": 30, "feedback": "你快要成功了，继续努力巩固你的知识。"},
    {"from": 31, "to": 50, "feedback": "这是一个良好的开始，但有些点仍需澄清。"},
    {"from": 51, "to": 70, "feedback": "做的不错！你已经理解了主题的重点。"},
    {"from": 71, "to": 90, "feedback": "非常棒的得分！你很好地掌握了所涉及的概念。"},
    {"from": 91, "to": 100, "feedback": "卓越！你完全掌握了这节课的内容。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Cartes mémoires) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- 卡片数量：至少 5 张卡片 || [NOMBRE_ELEMENTS] 张卡片。
- 关联：正面和背面必须通过一个唯一且稳定的标准相关联（例如：定义 -> 术语、事件 -> 日期、作者 -> 作品）。对所有卡片使用相同的逻辑，并按以下格式编写指令：“将每个 X 与 Y 关联起来”。`,

  FLASHCARDS_STRUCTURE_JSON: `- 在代码块中仅生成一个完整且有效的 JSON。你的回答必须以 \`{\` 开头，以 \`}\` 结尾。不要有任何其他文本或注释。
- 该对象必须包含：
  - \`title\`: 活动的相关标题。
  - \`description\`: 给学生的明确指令。
  - \`cards\`: 对象的数组，每个对象代表一张卡片并包含：
    - \`text\`: 待猜的问题或术语（正面）。
    - \`answer\`: 答案或定义（背面）。规范化规则：单个简单单词或数字（无复合词），小写（专有名词除外），无冠词或标点，数字使用阿拉伯数字。
    - \`tip\` (可选): 帮助学生的提示。你可以使用 \`**文字**\` 表示加粗，\`*文字*\` 表示斜体。`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "欧洲国家首都",
  "description": "将每个国家与其首都关联起来。",
  "cards": [
    {
      "text": "法国",
      "answer": "巴黎",
      "tip": "这是**埃菲尔铁塔**所在的城市。"
    },
    {
      "text": "西班牙",
      "answer": "马德里",
      "tip": "位于*伊比利亚*半岛的中心。"
    },
    {
      "text": "意大利",
      "answer": "罗马",
      "tip": "被称为*永恒之城*。"
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (写作) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- 关键词：答案中至少应包含 5 个关键词或短语 || [NOMBRE_ELEMENTS] 个关键词。
- 指令：指令不应列出预期的关键词，以免直接给出答案，但可以提及总主题的名称。`,

  ESSAY_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
对象必须包含：
- \`taskDescription\`: 一个清晰的指令，邀请学生围绕该主题撰写文本。使用 \`**词**\` 表示加粗（核心概念），\`*词*\` 表示斜体，\`\\n\` 表示换行。
- \`keywords\`: 一个定义预期关键词的对象数组。每个对象的形式如下：
  \`\`\`json
  {
    "keyword": "词或短语",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (严格规则) 你必须为最终反馈生成一个包含 6 个对象的数组，并结合练习主题，严格遵守以下分数段：0-10, 11-30, 31-50, 51-70, 71-90 和 91-100。`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "写一段短文解释**光合作用**的过程。你的回答必须涵盖植物产生自身能量的核心要素。",
  "keywords": [
    {"keyword": "光", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "叶绿素", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "二氧化碳", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "水", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "葡萄糖", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "这是一个开始。请仔细阅读关于光合作用的课程。" },
    { "from": 11, "to": 30, "feedback": "你已经识别出了一些要素。继续努力。" },
    { "from": 31, "to": 50, "feedback": "你的理解正在进步。考虑增加更多细节。" },
    { "from": 51, "to": 70, "feedback": "做得好！你掌握了基础知识。" },
    { "from": 71, "to": 90, "feedback": "非常好！你的写作展示了扎实的理解。" },
    { "from": 91, "to": 100, "feedback": "出色！你完美地掌握了该主题。" }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (H5P 词汇表) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- 条目数量：至少 5 个术语 || [NOMBRE_ELEMENTS] 个术语。
- 术语选择：识别资料中出现的专业概念、特定词汇或复杂词汇。
- 定义：简洁、准确，并完全适应预期的教学水平。`,

  ACCORDION_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- 生成的 JSON 必须是一个数组，其对象数量与上述术语数量一致。
- \`title\`: 关键词、短语或要定义的问题。
- \`text\`: 定义。使用 \`**词**\` 表示加粗，\`*词*\` 表示斜体，\`\\n\` 表示换行。对于数学公式，使用双转义的 LaTeX 格式，例如：\`\\\\( (2^3)^2 \\\\)\`。`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "光合作用", "text": "植物将**太阳**光转化为能量的过程。\\n这是食物链的基础。"},
  {"title": "细胞", "text": "所有生物的基本**单位**。存在*真核细胞*和*原核细胞*。"}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (总结) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- 步骤数量：生成至少包含 5 个步骤的数组 || [NOMBRE_ELEMENTS] 个步骤，以涵盖整个主题。
- 干扰项：每步至少提供 2 个干扰项。它们必须与主题一致，但包含合理的客观错误或逻辑错误。`,

  SUMMARY_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- \`intro\`: 一句简短的介绍语（例如：“选择正确的陈述。”）。
- \`summaries\`: 构成步骤的对象数组。每个对象包含：
  - \`summary\`: 一个句子数组（**关联**）。列表中的第一句话必须始终是正确的总结（准确的陈述）。
  - \`tip\`: (可选) 帮助学生的背景提示。
- \`overallFeedback\`: 用于最终分数的 6 个对象的数组 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。
- **LaTeX:** 对 LaTeX 使用双转义：\`\\\\( (2^3)^2 \\\\)\`。`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "选择正确的陈述来构建课程总结。",
  "summaries": [
    {
      "summary": [
        "光合作用是植物将光能转化为化学能的生物过程。",
        "光合作用是一个仅在夜间进行的过程。",
        "光合作用是动物呼吸的机制。"
      ],
      "tip": "将光视为能量来源。"
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "需要努力才能很好地理解这些概念。" },
    { "from": 11, "to": 30, "feedback": "你快成功了，继续努力。" },
    { "from": 31, "to": 50, "feedback": "这是一个好的开始，但有些点仍需澄清。" },
    { "from": 51, "to": 70, "feedback": "做得好！你已经理解了重点。" },
    { "from": 71, "to": 90, "feedback": "非常好的分数！你很好地掌握了这些概念。" },
    { "from": 91, "to": 100, "feedback": "优秀！你完美地掌握了这节课。" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (拖拽词汇) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- 单词数量：一段至少 50 个单词的文本，其中至少包含 5 个拖拽词 || [NOMBRE_ELEMENTS] 个单词。
- 唯一性：文本中每个拖拽词必须是唯一的（无重复）。`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
对象必须包含：
- \`taskDescription\`: 一个清晰的指令。
- \`textField\`: 待补全的文本。每句话必须以换行符 \`\\n\` 结尾。
  - **格式**: \`*词*\` 表示一个可拖拽元素。
- \`overallFeedback\`: 用于最终分数的 6 个对象的数组 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "通过拖拽单词补全文本。",
  "textField": "*太阳系*由围绕*太阳*旋转的*八*颗行星组成。\\n最大的行星是*木星*。",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "需要努力。" },
    { "from": 11, "to": 30, "feedback": "你快成功了。" },
    { "from": 31, "to": 50, "feedback": "这是一个好的开始。" },
    { "from": 51, "to": 70, "feedback": "做得好！" },
    { "from": 71, "to": 90, "feedback": "非常好的分数！" },
    { "from": 91, "to": 100, "feedback": "优秀！" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (填空题) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- 空位数量：一段至少 50 个单词的文本，其中至少包含 3 个填空词 || [NOMBRE_ELEMENTS] 个单词。
- 平衡：不要在琐碎的词（冠词、介词）上设置空位，除非那是语法目标。针对核心概念。`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
对象必须包含：
- \`taskDescription\`: 一个清晰简洁的指令，说明活动在全局背景下的目标。使用 \`**词**\` 表示加粗（核心概念），\`*词*\` 表示斜体，\`\\n\` 表示换行。
- \`questions\`: 一个字符串数组。每个字符串代表一个待补全的文本块。
  - **空位语法**: 用星号包围要猜的词（例如：\`*词*\`）。
  - **备选答案**: 使用 \`/\` 表示接受多个答案（例如：\`*答案1/答案2*\`）。
  - **帮助**: 使用 \`:\` 添加教学帮助气泡（例如：\`*词:提示*\`）。
- \`overallFeedback\`: (严格规则) 你必须为最终反馈生成一个包含 6 个对象的数组 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "补全下面关于太阳系的文本空缺。",
  "questions": [
    "地球是*太阳系*的一颗*行星*。",
    "它在大约 365 天内绕着*太阳:我们的恒星*旋转。"
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "需要努力才能很好地理解这些概念。"},
    {"from": 11, "to": 30, "feedback": "你快成功了，继续努力巩固你的知识。"},
    {"from": 31, "to": 50, "feedback": "这是一个好的开始，但有些点仍需澄清。"},
    {"from": 51, "to": 70, "feedback": "做得好！你已经理解了主题的核心。"},
    {"from": 71, "to": 90, "feedback": "非常好的分数！你很好地掌握了所涉及的概念。"},
    {"from": 91, "to": 100, "feedback": "优秀！你完美地掌握了这节课。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (标记单词) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- 单词数量：一段至少 50 个单词的文本，其中至少包含 5 个待标记单词 || [NOMBRE_ELEMENTS] 个单词。`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
对象必须包含：
- \`taskDescription\`: 一个清晰且吸引人的指令。在此只能使用 \`**词**\` 表示加粗和 \`*词*\` 表示斜体。
- \`textField\`: 包含待标记单词的完整文本。
  - **标记：** 每个待标记单词必须被星号单独包围。（例如：\`*词1* *词2*\` 是正确的；\`*词1 词2*\` 是错误的）。
  - **标点：** 撇号或标点符号绝不能成为标记的一部分，必须通过空格与单词隔开。（例如：\`的 *词*\` 是正确的，\`的*词*\` 是错误的）。
- \`overallFeedback\`: (严格规则) 你必须为最终反馈生成一个包含 6 个对象的数组 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "点击下面文本中的**专有名词**。",
  "textField": "*巴黎*是*法国*的首都。我们感兴趣的是*欧洲*。",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "需要努力才能很好地理解这些概念。"},
    {"from": 11, "to": 30, "feedback": "你快成功了，继续努力巩固你的知识。"},
    {"from": 31, "to": 50, "feedback": "这是一个好的开始，但有些点仍需澄清。"},
    {"from": 51, "to": 70, "feedback": "做得好！你已经理解了主题的核心。"},
    {"from": 71, "to": 90, "feedback": "非常好的分数！你很好地掌握了所涉及的概念。"},
    {"from": 91, "to": 100, "feedback": "优秀！你完美地掌握了这节课。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (正确/错误) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- 问题：一个清晰且明确的陈述。
- 回答：回答必须严格为 "true" (正确) 或 "false" (错误)。
- 反馈：为成功 (\`feedbackOnCorrect\`) 和失败 (\`feedbackOnWrong\`) 提供特定的消息，以加强学习。`,

  TRUE_FALSE_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- 主对象必须包含以下键：
  - \`question\`: (string) 要评估的陈述。可以包含 HTML。
  - \`correct\`: (string) 正确答案，要么是 "true"，要么是 "false"。
  - \`feedbackOnCorrect\`: (string) 回答正确时显示的评论。
  - \`feedbackOnWrong\`: (string) 回答错误时显示的评论。
- **格式：** 使用 Markdown 语法表示粗体（\`**文本**\`）和斜体（\`*文本*\`）。
- **LaTeX：** 对于数学公式，**仅**使用带有双重转义的 LaTeX 格式：\`\\\\( ... \\\\)\`。**切勿**单独使用 \`$\` 符号。
- **反馈：** 评论不得包含 LaTeX 或 Markdown。`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "奥斯陆是挪威的首都。",
  "correct": "true",
  "feedbackOnCorrect": "回答正确！奥斯陆确实是挪威的首都。",
  "feedbackOnWrong": "回答错误。挪威的首都是奥斯陆。"
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (多选题) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- 问题：一个清晰的多选题。
- 回答：提供多个备选答案 (\`answers\`)。必须只有一个正确回答 (\`"correct": true\`) 和多个合理的干扰项 (\`"correct": false\`)。
- 反馈：
  - \`overallFeedback\`: (严格规则) 你必须为最终反馈生成一个包含 6 个对象的数组 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- 主对象必须包含以下键：
  - \`question\`: (string) 问题的表述。可以包含 HTML。
  - \`answers\`: (array) 对象数组，每个对象代表一个答案。
    - \`text\`: (string) 答案文本。
    - \`correct\`: (boolean) 如果是正确答案则为 \`true\`，否则为 \`false\`。
    - \`tipsAndFeedback\`: (object, 可选) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`。
  - \`overallFeedback\`: (array) 定义按分数段反馈的 6 个对象的数组定义。
- **格式：** 使用 Markdown 语法表示粗体（\`**文本**\`）和斜体（\`*文本*\`）。
- **LaTeX：** 对于数学公式，**仅**使用带有双重转义的 LaTeX 格式：\`\\\\( ... \\\\)\`。**切勿**单独使用 \`$\` 符号。
- **反馈：** 评论不得包含 LaTeX 或 Markdown。`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "黑醋栗真正的颜色是什么？",
  "answers": [
    {"text": "深紫色", "correct": true, "tipsAndFeedback": { "chosenFeedback": "完全正确！" }},
    {"text": "蓝色", "correct": false, "tipsAndFeedback": { "chosenFeedback": "不，它更深一点。" }},
    {"text": "黑色", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "需要努力。" },
    { "from": 11, "to": 30, "feedback": "你快成功了。" },
    { "from": 31, "to": 50, "feedback": "这是一个好的开始。" },
    { "from": 51, "to": 70, "feedback": "做得好！" },
    { "from": 71, "to": 90, "feedback": "非常好的分数！" },
    { "from": 91, "to": 100, "feedback": "优秀！" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (寻词游戏) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- 单词数量：至少 6 个单词 || [NOMBRE_ELEMENTS] 个单词。
- 拼写规则：单词不应包含重音、数字、标点符号或空格。`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- \`taskDescription\`: 给学生的指令。
- \`wordList\`: 待发现的单词列表，用逗号分隔（无空格）。`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "找出网格中隐藏的单词。",
  "wordList": "CELLULE,ADN,GENE,NOYAU"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (排序段落) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- 步骤数量：至少 3 个待排序的步骤或段落 || [NOMBRE_ELEMENTS] 个步骤。
- 内在逻辑：段落 (\`paragraphs\`) 必须通过内容本身推导出逻辑衔接。
- 禁止人工线索：你绝不能使用编号 (1, 2, 3...)、显式时间标记 (日期、时间) 或过于简单的逻辑连接词 ("首先", "然后", "最后")，除非用户明确要求。
- 核心脉络：每个段落必须推动一个单一的线索（例如：因果链、从一般到特殊，或 准备 → 行动 → 结果 序列）。顺序必须能通过理解意义推导出来。`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- \`taskDescription\`: 一个清晰的指令（支持 Markdown）。
- \`paragraphs\`: 一个字符串数组（段落），最初在 JSON 中以**正确逻辑顺序**呈现。使用 \`**词**\` 表示加粗，\`*词*\` 表示斜体。
- \`overallFeedback\`: 用于最终分数的 6 个对象的数组 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。
- **LaTeX:** 对 LaTeX 使用双转义：\`\\\\( (2^3)^2 \\\\)\`。`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "将这些元素重新排序，以重构气候变暖的因果链。",
  "paragraphs": [
    "人类活动，主要是化石燃料的燃烧，向大气中大量排放**二氧化碳**。",
    "这些过量的气体强化了自然温室效应，阻止了一部分红外线辐射离开地球。",
    "被困住的能量导致空气和海洋的平均温度逐渐上升。",
    "这种全球变暖导致冰川融化和令人担忧的海平面上升。"
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "因果逻辑需要重新审视。" },
    { "from": 11, "to": 30, "feedback": "你有一些初步理解，请重新阅读文本。" },
    { "from": 31, "to": 50, "feedback": "排序有一个好的开始。" },
    { "from": 51, "to": 70, "feedback": "对逻辑进展分析得不错。" },
    { "from": 71, "to": 90, "feedback": "结构化工作做得非常好！" },
    { "from": 91, "to": 100, "feedback": "完美！逻辑结构已经掌握。" }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (单选题集) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- 问题数量：至少 3 个问题 || [NOMBRE_ELEMENTS] 个问题。
- 回答：每题提供 2 到 3 个干扰项。列表 \`answers\` 中的第一个回答必须始终是正确答案。
- 干扰项：一致但包含合理的逻辑或事实错误。`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- \`choices\`: 构成问题的对象数组。每个对象包含：
  - \`question\`: 问题的表述。
  - \`answers\`: 字符串数组（回答），其中第一个始终是正确答案。
- \`overallFeedback\`: 用于最终分数的 6 个对象的数组 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。
- **LaTeX:** 对 LaTeX 使用双转义：\`\\\\( (2^3)^2 \\\\)\`。`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "导致温室效应的主要气体是什么？",
      "answers": ["二氧化碳", "氧气", "氮气", "氩气"]
    },
    {
      "question": "法国的首都是哪里？",
      "answers": ["巴黎", "里昂", "马赛", "波尔多"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "需要努力。" },
    { "from": 11, "to": 30, "feedback": "你快成功了。" },
    { "from": 31, "to": 50, "feedback": "这是一个好的开始。" },
    { "from": 51, "to": 70, "feedback": "做得好！" },
    { "from": 71, "to": 90, "feedback": "非常好的分数！" },
    { "from": 91, "to": 100, "feedback": "优秀！" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (对话卡) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- 卡片数量：至少 3 张卡片 || [NOMBRE_ELEMENTS] 张卡片。
- 关联原则：正面和反面必须通过一个唯一且稳定的标准相关联（例如：定义 -> 术语，事件 -> 日期，作者 -> 作品）。
- 指令：活动描述必须遵循以下公式：“将每个 [X] 与其 [Y] 关联起来”。`,

  DIALOG_CARDS_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- 根对象必须包含 \`title\`、\`description\` 和 \`dialogs\`。
- 1. \`title\`: 活动标题（简单文本，**不含** Markdown 或 HTML）。
- 2. \`description\`: 指令或描述（HTML 格式或简单文本）。
- 3. \`dialogs\`: 卡片关联原则数组：正面 (text) 和反面 (answer)。
- 4. \`text\`: 卡片正面。使用 \`**词**\` 表示加粗，\`*词*\` 表示斜体。
- 5. \`answer\`: 卡片反面。应简短。使用 \`**词**\` 表示加粗，\`*词*\` 表示斜体。
- 6. \`tips\` (可选): 仅在相关时为正面 (\`front\`) 和/或反面 (\`back\`) 添加提示。简单文本，**无**格式化。`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "不规则动词",
  "description": "找出动词原形。",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "识别过去时。", "back": "基本形式。"}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (图表) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- 元素数量：至少 5 个比较元素 || [NOMBRE_ELEMENTS] 个比较元素。
- 图表类型：根据教学相关性选择饼图 (\`pieChart\`) 或条形图 (\`barChart\`)。
- 标签和颜色：颜色必须有对比度以保证良好的可读性。标签必须简短清晰。`,

  CHART_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。
- \`graphMode\`: 图表类型 (\`pieChart\` 或 \`barChart\`)。
- \`listOfTypes\`: 对象数组 \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`。
- \`figureDefinition\`: 图表标题。`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "蓝莓"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "树莓"}
  ],
  "figureDefinition": "最喜爱的水果图表"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (H5P 测试集) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- 问题数量：生成至少 5 个问题的列表 || [NOMBRE_ELEMENTS] 个问题。
- 多样性：从以下类型中选择最合适的活动以增加练习的变化：
  - **选择题** (\`H5P.MultiChoice\` 1.16)
  - **拖拽填空** (\`H5P.DragText\` 1.10)
  - **判断对错** (\`H5P.TrueFalse\` 1.8)
  - **文本填空** (\`H5P.Blanks\` 1.14)
  - **标记文本** (\`H5P.MarkTheWords\` 1.11)
  - **写作/开放性问题** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- 仅在一个代码块内生成完整且有效的 JSON。你的回答必须以 \`{\` 开头并以 \`}\` 结尾。不得有任何其他文字或注释。
- 根对象必须包含：
  - \`title\`：活动标题。
  - \`questions\`：对象数组。每个对象代表一个问题，且必须包含：
    - \`library\`：库的名称和准确版本（例如：\`H5P.MultiChoice 1.16\`）。
    - \`metadata\`：包含 \`title\` 键的对象（问题的简短标题）。
    - \`params\`：问题数据。
  - \`overallFeedback\`：包含 6 个对象的全局数组，用于 QuizSet 的最终评分反馈。

**各类型的 \`params\` 详情：**
1. **选择题 (\`H5P.MultiChoice 1.16\`)**：\`question\`，\`answers\`（包含 \`text\` 和 \`correct\` 的对象数组），\`behaviour: {singleAnswer: true}\`
2. **判断对错 (\`H5P.TrueFalse 1.8\`)**：\`question\`，\`correct\`（字符串形式的 "true" 或 "false"）
3. **文本填空 (\`H5P.Blanks 1.14\`)**：\`taskDescription\`，\`questions\`（包含 \`*单词*\` 的字符串数组）
4. **拖拽填空 (\`H5P.DragText 1.10\`)**：\`taskDescription\`，\`textField\`（包含 \`*单词*\`）
5. **标记文本 (\`H5P.MarkTheWords 1.11\`)**：\`taskDescription\`，\`textField\`（包含 \`*单词*\`）
6. **写作 (\`H5P.Essay 1.5\`)**：\`taskDescription\`，\`keywords\`（对象数组）

**除 H5P.TrueFalse 1.8 类型的问题外，每个问题必须包含其自身的 \`overallFeedback\`（6 个分段）。**
- **格式：** 使用 Markdown 语法表示粗体（\`**文本**\`）和斜体（\`*文本*\`）。
- **LaTeX：** 对于数学公式，**仅**使用带有双重转义的 LaTeX 格式：\`\\\\( ... \\\\)\`。**切勿**单独使用 \`$\` 符号。
- **反馈：** 评论不得包含 LaTeX 或 Markdown。`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "科学常识测试",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "天文学 - 选择题" },
      "params": {
        "question": "哪颗行星距离太阳最近？",
        "answers": [
          { "text": "水星", "correct": true },
          { "text": "金星", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "错误。"},
          {"from": 11, "to": 30, "feedback": "不合格。"},
          {"from": 31, "to": 50, "feedback": "一般。"},
          {"from": 51, "to": 70, "feedback": "良好。"},
          {"from": 71, "to": 90, "feedback": "优秀。"},
          {"from": 91, "to": 100, "feedback": "卓越。"}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "生物学 - 判断对错" },
      "params": {
        "question": "DNA 是双螺旋结构。",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "成绩较差。"},
    {"from": 11, "to": 30, "feedback": "成绩不合格。"},
    {"from": 31, "to": 50, "feedback": "成绩一般。"},
    {"from": 51, "to": 70, "feedback": "成绩良好。"},
    {"from": 71, "to": 90, "feedback": "成绩优秀。"},
    {"from": 91, "to": 100, "feedback": "成绩卓越。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (H5P 选择题测验) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- 问题数量：最少生成5个问题 || [NOMBRE_ELEMENTS]个问题。
- 类型：您必须仅生成**选择题**类型的问题（\`H5P.MultiChoice\` 1.16）。不允许其他类型。
- 选择题质量：
  - 每个问题必须至少有3个答案选项。
  - 根据问题的性质，您可以提供一个或多个正确答案。
  - 干扰项（错误答案）必须合理且相关。
  - 避免在问题中使用否定句式。
  - 变化正确答案的位置。`,

  QUIZSET_QCM_STRUCTURE_JSON: `- 仅生成完整有效的JSON代码块。您的回答必须以\`{\`开头，以\`}\`结尾。不得包含其他文本或注释。
- 根对象必须包含：
  - \`title\`：活动标题。
  - \`questions\`：对象数组。每个对象代表一个选择题，必须包含：
    - \`library\`：始终为\`H5P.MultiChoice 1.16\`。
    - \`metadata\`：包含\`title\`键（问题简短标题）的对象。
    - \`params\`：问题数据。
  - \`overallFeedback\`：包含6个对象的全局数组，用于最终QuizSet分数。

**选择题（\`H5P.MultiChoice 1.16\`）的\`params\`详细信息**：
- \`question\`：提出的问题（字符串）。
- \`answers\`：包含\`text\`（字符串）和\`correct\`（布尔值）的对象数组。
- \`behaviour\`：对象，\`singleAnswer\`：如果只有一个正确答案则为\`true\`，如果有多个正确答案则为\`false\`。

**每个问题都必须包含自己的\`overallFeedback\`（6个范围：0-10、11-30、31-50、51-70、71-90、91-100）。**
- **格式：** 使用 Markdown 语法表示粗体（\`**文本**\`）和斜体（\`*文本*\`）。
- **LaTeX：** 对于数学公式，**仅**使用带有双重转义的 LaTeX 格式：\`\\\\( ... \\\\)\`。**切勿**单独使用 \`$\` 符号。
- **反馈：** 评论不得包含 LaTeX 或 Markdown。`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "选择题测验 - 科学",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "天文学 - 行星" },
      "params": {
        "question": "哪颗行星离太阳最近？",
        "answers": [
          { "text": "金星", "correct": false },
          { "text": "火星", "correct": false },
          { "text": "水星", "correct": true },
          { "text": "木星", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "错误。"},
          {"from": 11, "to": 30, "feedback": "不及格。"},
          {"from": 31, "to": 50, "feedback": "一般。"},
          {"from": 51, "to": 70, "feedback": "良好。"},
          {"from": 71, "to": 90, "feedback": "很好。"},
          {"from": 91, "to": 100, "feedback": "优秀！"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "生物学 - 细胞器" },
      "params": {
        "question": "哪些细胞器拥有自己的DNA？",
        "answers": [
          { "text": "核糖体", "correct": false },
          { "text": "线粒体", "correct": true },
          { "text": "高尔基体", "correct": false },
          { "text": "叶绿体", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "错误。"},
          {"from": 11, "to": 30, "feedback": "不及格。"},
          {"from": 31, "to": 50, "feedback": "一般。"},
          {"from": 51, "to": 70, "feedback": "良好。"},
          {"from": 71, "to": 90, "feedback": "很好。"},
          {"from": 91, "to": 100, "feedback": "优秀！"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "成绩较弱。复习基础知识。"},
    {"from": 11, "to": 30, "feedback": "成绩不足。继续努力。"},
    {"from": 31, "to": 50, "feedback": "成绩一般。您正在进步。"},
    {"from": 51, "to": 70, "feedback": "成绩良好。您掌握了多个概念。"},
    {"from": 71, "to": 90, "feedback": "成绩优秀。您走在正确的道路上。"},
    {"from": 91, "to": 100, "feedback": "成绩卓越。恭喜！"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P 判断对错测验) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- 问题数量：生成至少 5 个问题的列表 || [NOMBRE_ELEMENTS] 个问题。
- 类型：您必须仅生成**判断对错**（\`H5P.TrueFalse\` 1.8）类型的问题。不允许使用任何其他类型。
- 问题质量：
  - 陈述必须清晰且无歧义。
  - 避免使用双重否定。
  - 交替设置正确和错误的陈述。`,

  QUIZSET_VF_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。您的回答必须以 \`{\` 开头，以 \`}\` 结尾。不得有任何其他文本或注释。
- 根对象必须包含：
  - \`title\`：活动标题。
  - \`questions\`：对象数组。每个对象代表一个问题，且必须包含：
    - \`library\`：始终为 \`H5P.TrueFalse 1.8\`。
    - \`metadata\`：包含 \`title\` 键的对象（问题的简短标题）。
    - \`params\`：问题数据。
  - \`overallFeedback\`：QuizSet 最终得分的 6 个对象的全局数组：0-10, 11-30, 31-50, 51-70, 71-90, 91-100。

**真假题 (\`H5P.TrueFalse 1.8\`) 的 \`params\` 详情**：
- \`question\`：提出的断言或问题 (string)。
- \`correct\`：正确答案。必须是字符串："true" 或 "false"。
- **格式设置：** 使用 Markdown 语法实现加粗 (\`**文本**\`) 和斜体 (\`*文本*\`)。
- **LaTeX：** 对于数学公式，必须使用双反斜杠转义的 LaTeX 格式：\`\\\\( ... \\\\)\`。严禁单独使用 \`$\` 符号。
- **反馈 (Feedback)：** 反馈内容不得包含 LaTeX 和 Markdown。`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "判断对错测验 - 地理",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "地理 - 首都" },
      "params": {
        "question": "澳大利亚的首都是堪培拉。",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "地理 - 大洲" },
      "params": {
        "question": "非洲是世界上最大的洲。",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "成绩较弱。请复习基础知识。"},
    {"from": 11, "to": 30, "feedback": "成绩不足。请继续努力。"},
    {"from": 31, "to": 50, "feedback": "成绩一般。你正在进步。"},
    {"from": 51, "to": 70, "feedback": "成绩良好。你掌握了多个概念。"},
    {"from": 71, "to": 90, "feedback": "成绩优秀。你走在正确的道路上。"},
    {"from": 91, "to": 100, "feedback": "成绩卓越。恭喜！"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Moodle/Éléa 测试) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- 问题数量：至少 10 个问题 || [NOMBRE_ELEMENTS] 个问题。
- 多样性：从以下类型中选择最合适的活动：
  - **选择题** (\`multichoice\`)
  - **配对题** (\`matching\`)
  - **数值题** (\`numerical\`)
  - **判断对错** (\`truefalse\`)
  - **简答题** (\`shortanswer\`)
  - **完形填空** (\`cloze\`)
- 干扰项：为每个 \`multichoice\`（选择题）提供至少 3 个干扰项。`,

  ELEA_TEST_STRUCTURE_JSON: `- 仅在代码块中生成完整且有效的 JSON。你的回答必须以 \`{\` 开始，以 \`}\` 结束。没有其他文本或注释。

主对象必须包含以下键：
- \`bank_name\`: 题库的简短描述性名称。
- \`bank_description\`: 描述题库内容的短语。
- \`questions\`: 对象数组，其中每个对象代表一个问题 (\`type\`, \`content\`)。
  - 每个问题必须有一个简短且唯一的 \`content.name\`（例如："Q1 - 主题"）。

**格式规则:**
- **数字**: 小数使用点号（例如：12.34）。
- **Cloze**: 严格遵守语法 \`{1:TYPE:=正确答案~错误答案}\`。`,

  ELEA_TEST_EXEMPLE_RENDU: `- **对于 \`multichoice\` 类型 (选择题):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Q1 - 地理",
      "questiontext": "法国的首都是哪里？",
      "feedback": "巴黎是法国的政治和经济中心。",
      "answers": [
        { "text": "巴黎", "fraction": 100, "feedback": "完全正确！" },
        { "text": "里昂", "fraction": 0, "feedback": "不，里昂是大城市但不是首都。" },
        { "text": "马赛", "fraction": 0, "feedback": "不，它是法国第二大城市。" }
      ]
    }
  }
  \`\`\`

- **对于 \`matching\` 类型 (配对题):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Q2 - 英语词汇",
      "questiontext": "将每个英语单词与其中文翻译匹配。",
      "feedback": "太棒了，你掌握了基础词汇。",
      "subquestions": [
        { "text": "Dog", "answer": "狗" },
        { "text": "Cat", "answer": "猫" },
        { "text": "Bird", "answer": "鸟" }
      ]
    }
  }
  \`\`\`

- **对于 \`numerical\` 类型 (数值题):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Q3 - 数学",
      "questiontext": "Pi 的值四舍五入到两位小数是多少？",
      "feedback": "Pi 是一个无理常数，大约等于 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "确实是 3.14。" }
    }
  }
  \`\`\`

- **对于 \`truefalse\` 类型 (判断对错):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Q4 - 科学",
      "questiontext": "水在海平面 100°C 沸腾。",
      "feedback": "这是水的标准物理性质。",
      "answer": { "value": true, "feedback_true": "正确。", "feedback_false": "错误，水确实在 1 个大气压下 100°C 沸腾。" }
    }
  }
  \`\`\`

- **对于 \`shortanswer\` 类型 (简答题):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Q5 - 文学",
      "questiontext": "谁写了《悲惨世界》？",
      "feedback": "这是 19 世纪最伟大的小说之一。",
      "answers": [
        { "text": "维克多·雨果", "fraction": 100, "feedback": "正确！" },
        { "text": "雨果", "fraction": 100, "feedback": "正确！" }
      ]
    }
  }
  \`\`\`

- **对于 \`cloze\` 类型 (完形填空):**
  - 注意语法：\`{1:SHORTANSWER:=好~坏}\`。
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Q6 - 历史",
      "questiontext": "拿破仑出生于 {1:SHORTANSWER:=1769} 年在 {1:MULTICHOICE:=阿雅克肖~巴斯蒂亚~巴黎}。",
      "feedback": "拿破仑·波拿巴出生于科西嘉岛。"
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (大富翁/百万富翁游戏) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- 问题数量：必须正好是 6 个问题（严禁修改数量）。
- 循序渐进：问题的难度必须呈**递增式且符合教学逻辑**。需要重点记忆的内容应放在前几道题。
- 准确性：内容必须严格准确且具有相关性。`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- 仅在一个代码块内生成完整且有效的 JSON。你的回答必须以 \`{\` 开头并以 \`}\` 结尾。不得有任何其他文字或注释。
包含以下键的主对象：
- \`title\`：活动标题（字符串）。
- \`questions\`：正好包含 6 个对象的数组，每个对象代表一个问题并包含：
  - \`question\`：问题描述（字符串）。
  - \`goodanswer\`：正确答案（字符串）。
  - \`badanswer\`：正好包含 3 个错误答案的数组（字符串数组）。
  - 数学公式禁止使用 LaTeX。`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "法国大革命知识竞赛",
  "questions": [
    {
      "question": "1789年7月14日，哪一事件标志着法国大革命的开始？",
      "goodanswer": "攻占巴士底狱",
      "badanswer": ["网球场宣誓", "处决路易十六", "瓦尔密战役"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (配对题) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- 配对数量：至少 5 对 || [NOMBRE_ELEMENTS] 对。
- 逻辑：阅读素材后，两个元素之间的关系必须显而易见。`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- 仅在一个代码块内生成完整且有效的 JSON。你的回答必须以 \`{\` 开头并以 \`}\` 结尾。不得有任何其他文字或注释。
包含以下键的主对象：
- \`title\`：活动标题（字符串）。
- \`intro\`：简短的指令或介绍文本（字符串）。
- \`pairs\`：对象数组，每个对象代表一个配对并包含：
  - \`question\`：左侧的术语或元素（字符串）。
  - \`answer\`：右侧对应的定义或元素（字符串）。
  - 对于数学公式，请使用带有双斜杠转义的 LaTeX 格式，例如：\`\\\\( (2^3)^2 \\\\)\`。`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "历史配对练习",
  "intro": "将每个日期与法国大革命中对应的事件联系起来。",
  "pairs": [
    {"question": "攻占巴士底狱", "answer": "1789年7月14日"},
    {"question": "废除特权", "answer": "1789年8月4日"},
    {"question": "人权宣言", "answer": "1789年8月26日"},
    {"question": "凡尔赛妇女大游行", "answer": "1789年10月5日"},
    {"question": "联盟节", "answer": "1790年7月14日"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (Éléa 选择题) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- 问题数量：至少 5 个问题 || [NOMBRE_ELEMENTS] 个问题。
- 选项：每个问题提供 2 到 5 个选项。
- 干扰项：与主题相关但包含逻辑错误。`,

  ELEA_QCM_STRUCTURE_JSON: `- 仅在一个代码块内生成完整且有效的 JSON。你的回答必须以 \`{\` 开头并以 \`}\` 结尾。不得有任何其他文字或注释。
- \`title\`：活动标题。
- \`questions\`：对象数组。每个问题对象必须包含：
  - \`text\`：问题描述（可以包含简单的 HTML，如 \`**\` 加粗）。
  - \`answers\`：对象数组 \`{"text": "...", "iscorrect": 1/0}\`。\`1\` 代表正确答案，\`0\` 代表错误。
  - 对于数学公式，请使用带有双斜杠转义的 LaTeX 格式，例如：\`\\\\( (2^3)^2 \\\\)\`。`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "关于法国大革命的选择题",
  "questions": [
    {
      "text": "攻占巴士底狱的日期是哪天？",
      "answers": [
        {"text": "1789年7月14日", "iscorrect": 1},
        {"text": "1789年8月4日", "iscorrect": 0},
        {"text": "1789年8月26日", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (XML 词汇表) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- 条目数量：至少 5 个术语 || [NOMBRE_ELEMENTS] 个术语。
- 筛选：识别关键词、缩写和技术概念。`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- 仅在一个代码块内生成完整且有效的 JSON。你的回答必须以 \`{\` 开头并以 \`}\` 结尾。不得有任何其他文字或注释。
- **根：** 一个包含两个键的主对象：\`name\`（词汇表名称）和 \`entries\`（对象数组）。
- **\`entries\` 中的每个对象必须包含：**
  - \`concept\`：要定义的词或短语。
  - \`definition\`：清晰简洁的定义。使用 **单词** 表示加粗，*单词* 表示斜体，\`\\n\` 表示换行（仅在具有教学意义时使用）。
  - \`aliases\`（可选）：字符串数组，用于存放同义词或替代术语。仅在存在相关别名时添加此键。
  - 对于数学公式，请使用带有双斜杠转义的 LaTeX 格式，例如：\`\\\\( (2^3)^2 \\\\)\`。`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "新闻术语表",
  "entries": [
    {
      "concept": "记者",
      "definition": "**搜集**并传播*信息*的人。",
      "aliases": ["特派员", "专栏作家"]
    },
    {
      "concept": "消息源",
      "definition": "经过验证的*信息*出处。"
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Éléa 页面) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- 结构：页面必须包含至少 5 个不同的区块 || [NOMBRE_ELEMENTS] 个区块。
- 教学逻辑：内容必须遵循连贯的递进过程（例如：欢迎 -> 目标 -> 课程 -> 详情/词汇表 -> 参考网站）。
- 内容平衡：混合多种格式以保持参与度（文本、表格、列表、侧边栏）。
- 必填内容：系统地整合开启横幅 (\`#01_hero_header\`)、目标或注意事项侧边栏 (\`#04_callout_set\`)、技术术语表 (\`#06_lexique_table\`)、至少三个实质性的内容段落 (\`#12_context_paragraphs\`) 以及参考网站 (\`#18_sito_graphy\`)。`,

  ELEA_PAGE_STRUCTURE_JSON: `- 仅在一个代码块内生成完整且有效的 JSON。你的回答必须以 \`{\` 开头并以 \`}\` 结尾。不得有任何其他文字或注释。
- \`title\`：页面标题（字符串）。
- \`intro\`：简短且引人入胜的介绍文本（字符串）。
- \`blocks\`：对象数组，每个对象代表页面的一个部分。每个区块必须符合以下结构之一：

**可用区块列表：**
- \`#01_hero_header\`: 开启横幅。\`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: 带有内部链接的目录。\`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: 3 张卡片形式的历史地标。\`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\`（最多 3 张）
- \`#04_callout_set\`: 目标、须知、警示横幅。\`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: 卡片形式的关键数字。\`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: 词汇表表格。\`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: 标签形式的词汇表。\`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: 带有图像的古迹卡片。\`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: 两个图像对比。
- \`#10_table_comparison\`: 对比表格。
- \`#11_definition_box\`: 定义框。\`{ "type": "#11_definition_box", "data": { "title": "定义", "text": "..." } }\`
- \`#12_context_paragraphs\`: 课程段落。\`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: 详细卡片。
- \`#14_faq_block\`: 常见问题解答。\`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: 神话 vs 现实。
- \`#17_method_image_desc\`: 描述图像的方法。
- \`#18_sito_graphy\`: 参考网站。\`{ "type": "#18_sito_graphy", "data": { "title": "参考网站", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: 双语引用。`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "法国大革命",
  "intro": "探索这一历史时期的关键时刻。",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "大革命", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "教学目标",
        "callouts": [{"type": "objectif", "text": "了解 1789 年爆发的原因。"}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "网球场宣誓",
        "paragraphs": [
          "1789年6月20日，第三等级的代表们聚集在...",
          "这一举动标志着国民议会的诞生。",
          "这是走向专制制度终结的重要转折点。"
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "词汇表",
        "headers": ["术语", "定义"],
        "rows": [["第三等级", "占人口绝大多数的阶层..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "延伸阅读",
        "links": [{"href": "https://...", "text": "官方历史网站"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === H5P 界面翻译 (标准化) ===
  // ============================================================================

  // 通用键
  h5p_check_answer: "检查",
  h5p_try_again: "重试",
  h5p_show_solution: "显示答案",
  h5p_submit_answer: "提交",
  h5p_score: "你在 @total 分中获得了 @score 分",
  h5p_score_bar_label: "你在 :total 分中获得了 :num 分",
  h5p_tip_label: "提示",
  h5p_next: "下一步",
  h5p_previous: "上一步",
  h5p_close: "关闭",
  h5p_finish_header: "结束？",
  h5p_finish_body: "你确定要结束吗？",
  h5p_cancel_label: "取消",
  h5p_finish_label: "结束",
  h5p_retry_header: "重试？",
  h5p_retry_body: "你确定要重试吗？",
  h5p_retry_confirm_label: "确认",
  h5p_resume: "继续",
  h5p_audio_direction: "音频方向",
  h5p_a11y_check: "检查答案。答案将被标记为正确、错误或未回答。",
  h5p_a11y_show_solution: "显示答案。任务将标记出正确答案。",
  h5p_a11y_retry: "重试任务。重置所有答案并重新开始任务。",

  // 填字游戏 (Crossword)
  h5p_crossword_across: "横向",
  h5p_crossword_down: "纵向",
  h5p_crossword_extra_clue: "额外线索",

  // 总结 (Summary)
  h5p_summary_intro: "选择正确的陈述。",
  h5p_summary_solved_label: "进度：",
  h5p_summary_score_label: "错误回答：",
  h5p_summary_result_label: "你的结果",
  h5p_summary_feedback: "你在 @total 个陈述中答对了 @score 个 (@percent%)。",
  h5p_summary_label_correct: "正确。",
  h5p_summary_label_incorrect: "错误！请重试。",
  h5p_summary_label_correct_answers: "正确答案。",
  h5p_summary_progress_text: "进度 :num / :total",
  h5p_summary_alternative_incorrect_label: "错误",

  // 拖动单词 (Drag the Words)
  h5p_drag_words_score_feedback: "得分：@score / @total。",
  h5p_drag_words_correct_text: "正确！",
  h5p_drag_words_incorrect_text: "错误！",

  // 填空题 (Fill in the Blanks)
  h5p_blanks_not_filled_out: "请填写所有空格。",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; 是正确的",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; 是错误的",
  h5p_blanks_answered_correctly: "回答正确",
  h5p_blanks_answered_incorrectly: "回答错误",
  h5p_blanks_solution_label: "正确答案：",
  h5p_blanks_input_label: "第 @num 个空格，共 @total 个",
  h5p_blanks_input_has_tip_label: "有可用提示",
  h5p_blanks_feedback: "你在 @total 个空格中填对了 @score 个。",
  h5p_blanks_checking_mode_header: "检查模式",

  // 标记单词 (Mark the Words)
  h5p_mark_words_correct_answer: "正确！",
  h5p_mark_words_incorrect_answer: "错误！",
  h5p_mark_words_missed_answer: "遗漏！",
  h5p_mark_words_display_solution_description: "任务已更新以包含答案。",
  h5p_mark_words_a11y_full_text_label: "完整可读文本",
  h5p_mark_words_a11y_clickable_text_label: "可标记单词的完整文本",
  h5p_mark_words_a11y_solution_mode_header: "答案模式",
  h5p_mark_words_a11y_checking_header: "检查模式",

  // 闪卡 (Flashcards)
  h5p_flashcards_progress_text: "第 @card 张卡片，共 @total 张",
  h5p_flashcards_your_answer: "你的回答",
  h5p_flashcards_correct_answer: "正确答案",
  h5p_flashcards_incorrect_answer: "错误答案",
  h5p_flashcards_show_solution: "正确答案",
  h5p_flashcards_results: "结果",
  h5p_flashcards_of_correct: "@total 个中答对 @score 个",
  h5p_flashcards_show_results: "显示结果",
  h5p_flashcards_answer_short: "答:",
  h5p_flashcards_card_announcement: "回答错误。正确答案是 @answer",
  h5p_flashcards_correct_announcement: "@answer 是正确的。",
  h5p_flashcards_page_announcement: "第 @current 页，共 @total 页",

  // 文章 (Essay)
  h5p_essay_feedbackHeader: "反馈",
  h5p_essay_solutionTitle: "标准答案",
  h5p_essay_remainingChars: "剩余字符：@chars",
  h5p_essay_notEnoughChars: "你必须输入至少 @chars 个字符！",
  h5p_essay_messageSave: "已保存",
  h5p_essay_placeholderText: "在这里开始写作...",
  h5p_essay_ariaYourResult: "你在 @total 分中获得了 @score 分",
  h5p_essay_ariaNavigatedToSolution: "已导航到文本框后新增的标准答案。",

  // 正误题 (True/False)
  h5p_true_false_true_text: "正确",
  h5p_true_false_false_text: "错误",
  h5p_true_false_wrong_answer_message: "错误回答",
  h5p_true_false_correct_answer_message: "正确回答",

  // 找单词 (Find the Words)
  h5p_find_words_found: "已找到 @totalWords 个单词中的 @found 个",
  h5p_find_words_time_spent: "所用时间",
  h5p_find_words_word_list_header: "单词列表",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // 段落排序 (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "上移",
  h5p_sort_paragraphs_down: "下移",
  h5p_sort_paragraphs_disabled: "已禁用",
  h5p_sort_paragraphs_paragraph: "段落",
  h5p_sort_paragraphs_point: "@score 分",
  h5p_sort_paragraphs_seven_of_nine: "@current / @total",
  h5p_sort_paragraphs_current_position: "列表中的当前位置",
  h5p_sort_paragraphs_instructions_selected: "按空格键重新排序",
  h5p_sort_paragraphs_instructions_grabbed: "按上下箭头键更改位置，空格键放置，Esc 键取消",
  h5p_sort_paragraphs_grabbed: "已抓取",
  h5p_sort_paragraphs_moved: "已移动",
  h5p_sort_paragraphs_dropped: "已放置",
  h5p_sort_paragraphs_reorder_cancelled: "重新排序已取消",
  h5p_sort_paragraphs_final_position: "最终位置",
  h5p_sort_paragraphs_next_paragraph: "下一段落",
  h5p_sort_paragraphs_correct_paragraph: "该位置的正确段落",
  h5p_sort_paragraphs_list_description: "可排序的段落列表。",
  h5p_sort_paragraphs_list_description_check: "带结果的段落列表。",
  h5p_sort_paragraphs_list_description_solution: "带答案的段落列表。",

  // 单选题集 (Single Choice Set)
  h5p_single_choice_solution_view_title: "答案",
  h5p_single_choice_mute_button_label: "静音",
  h5p_single_choice_slide_of_total: "第 @slide 页，共 @total 页",
  h5p_single_choice_solution_list_question_number: "第 @question 题",
  h5p_single_choice_should_select: "应该选择",
  h5p_single_choice_should_not_select: "不应该选择",

  // 对话卡 (Dialog Cards)
  h5p_dialog_cards_answer: "反转",
  h5p_dialog_cards_progress_text: "第 @card 张卡片，共 @total 张",
  h5p_dialog_cards_card_front_label: "卡片正面",
  h5p_dialog_cards_card_back_label: "卡片反面",
  h5p_dialog_cards_audio_not_supported: "您的浏览器不支持该音频格式",
  h5p_dialog_cards_correct_answer: "我答对了！",
  h5p_dialog_cards_incorrect_answer: "我答错了",
  h5p_dialog_cards_round: "第 @round 轮",
  h5p_dialog_cards_cards_left: "剩余卡片：@number",
  h5p_dialog_cards_next_round: "进入第 @round 轮",
  h5p_dialog_cards_start_over: "重新开始",
  h5p_dialog_cards_show_summary: "下一步",
  h5p_dialog_cards_summary: "总结",
  h5p_dialog_cards_summary_cards_right: "你答对的卡片：",
  h5p_dialog_cards_summary_cards_wrong: "你答错的卡片：",
  h5p_dialog_cards_summary_cards_not_shown: "未显示的卡片：",
  h5p_dialog_cards_summary_overall_score: "总分",
  h5p_dialog_cards_summary_cards_completed: "你掌握的卡片：",
  h5p_dialog_cards_summary_completed_rounds: "已完成轮次：",
  h5p_dialog_cards_summary_all_done: "做得好！你已经连续 @max 次完成所有 @cards 张卡片！",

  // 问题集 (Quiz Set)
  h5p_quiz_textual_progress: "第 @current 题，共 @total 题",
  h5p_quiz_no_result_message: "已完成",
  h5p_quiz_result_message: "你的结果：",
  h5p_quiz_feedback_available: "有反馈可用",
  h5p_quiz_read_feedback: "阅读反馈",
  h5p_quiz_wrong_answer: "错误回答",
  h5p_quiz_correct_answer: "正确回答",
  h5p_quiz_should_check: "本该勾选此处",
  h5p_quiz_should_not_check: "不该勾选此处",
  h5p_quiz_no_input: "请在查看答案前回答问题。",

  // ============================================================================
  // === 法律声明 - 页脚 ===
  // ============================================================================
  license_info: "GNU GPL v3.0 或更高版本",
  ticket: "工单/反馈",
  legal_mentions: "法律声明",
  legal_title: "法律声明",
  legal_editor_title: "应用程序编辑器",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>职务：</strong> 文学与历史 PLP 教师",
  legal_editor_gauthier_remande_email: "<strong>电子邮件：</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>地址：</strong> 39 avenue de Chanzy, 53000 Laval, France",
  legal_editor_gauthier_remande_phone: "<strong>电话：</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>职务：</strong> 数学教师及 DRANE 项目负责人 – 格勒诺布尔学区",
  legal_editor_emmanuel_gaunard_email: "<strong>电子邮件：</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>地址：</strong> 30 boulevard de la République, 38200 Vienne, France",
  legal_editor_emmanuel_gaunard_phone: "<strong>电话：</strong> +33 6 46 74 20 94",
  legal_app_description: "“Caramel” Web 应用程序是一个自由、非商业性的项目，旨在创建 H5P 和 Éléa 内容。无需账户，不收集任何个人数据。",
  legal_hosting_title: "托管信息",
  legal_host_name: "<strong>服务商</strong>：教育数字公共锻造 (Forge des Communs Numériques Éducatifs)",
  legal_host_company: "<strong>组织名称</strong>：法国国民教育部和青年部",
  legal_host_address: "<strong>地址</strong>：110 rue de Grenelle, 75007 Paris, France",
  legal_host_phone: "<strong>电话</strong>：+33 1 55 55 10 10",
  legal_publication_director_title: "出版负责人",
  legal_publication_director_name: "Gauthier REMANDE 和 Emmanuel GAUNARD，作为志愿者编辑。",
  legal_terms_of_use_title: "一般使用条款",
  legal_terms_of_use_content: "本网站允许用户生成 H5P 和 Éléa 内容。所有内容均在本地显示，不传输用户数据。用户对其生成的內容的使用承担全部责任。本应用程序免费提供，不保证运行或结果。编辑器对内容的误解或不当使用不承担任何责任。",
  legal_intellectual_property_title: "知识产权",
  legal_intellectual_property_content: "所有源代码、图形元素和内容均采用 GNU AGPLv3 自由许可协议。在符合各自许可条款的前提下允许重用。任何再分发或修改必须注明原作者：Gauthier REMANDE 和 Emmanuel GAUNARD。H5P 模块中使用的图像来源于 H5P.org 网站。",
  legal_personal_data_title: "个人数据",
  legal_personal_data_content: "不收集也不存储任何个人数据。不使用追踪 Cookie。",
  legal_ai_models_title: "人工智能模型",
  legal_ai_models_content: "Caramel 应用程序仅在点击生成功能时，调用由 ILAAS（一个共享 AI 基础设施联盟）运行的 AI 模型。请求通过由 Incubateur 托管的 n8n 工作流进行路由，随后传输至 ILAAS，在托管于高等教育与研究部 (ESR) 认证的数据中心内的可信服务器上执行。Caramel 不直接运行模型，也不处理或存储自有数据；数据仅用于执行请求，不会发送给大众消费类 AI。目前提供的模型包括 {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}})、{{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) 和 {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}})。ILAAS 可能执行的托管、日志记录和存储方式受其隐私政策和服务条款约束，请参阅相关说明。",
  legal_user_requests_processing_title: "通过 n8n 和国民教育部孵化器 (Incubateur) 处理用户请求",
  legal_user_requests_processing_content: "我们的网站使用由 n8n 开发的技术解决方案，这是一个由国民教育部孵化器托管的开源工具。该服务通过自动化工作流，将用户请求转化为结构化数据（JSON 格式），以便与 DINUM 提供的具有主权的 AI 进行交互。在不加密的情况下，不会暴露或传输任何敏感信息，从而确保交流的机密性和安全性。",
  legal_accessibility_title: "无障碍环境",
  legal_accessibility_content: "本应用程序专为电脑端使用设计，包括深色/浅色模式、键盘导航和符合主题的高对比度。无障碍环境的持续改进正在根据 RGAA 建议进行中。",
  legal_applicable_law_title: "适用法律",
  legal_applicable_law_content: "本网站受法国法律约束。如发生争议，里昂管辖范围内的法院具有管辖权。",
  legal_external_libraries_title: "使用的外部库",
  legal_external_libraries_intro: "Caramel 应用程序使用了多个开源库，分别遵循以下许可协议：",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong>（许可：CC BY 4.0, SIL OFL 1.1, MIT）：提供界面中使用的图标，以改善导航和视觉体验。",
  legal_library_jszip: "<strong>JSZip</strong>（许可：MIT 或 GPLv3）：通过将必要内容压缩到 zip 存档中来创建 .h5p 文件。",
  legal_library_clientzip: "<strong>client-zip</strong>（许可：MIT）：另一个用于文件压缩的库，为直接在浏览器中生成 .h5p 存档提供高性能替代方案。",
  legal_library_fflate: "<strong>fflate</strong>（许可：MIT）：极速数据压解库，用于创建 Moodle 模块的 .mbz 存档。",
  legal_library_tarjs: "<strong>tar-js</strong>（许可：MIT）：用于创建 .tar 存档，这是在压缩形成 Moodle 模块 .mbz 文件之前的必要步骤。",
  legal_library_mammoth: "<strong>Mammoth</strong>（许可：BSD 2-Clause）：可将 Word 文档 (.docx) 转换为 HTML，便于从 Microsoft Word 文件导入和集成内容。",
  legal_library_pdfjs: "<strong>PDF.js</strong>（许可：Apache 2.0）：允许直接在浏览器中提取 PDF 文件的原生文本，无需服务器处理。",
  legal_library_tesseract: "<strong>Tesseract.js</strong>（许可：Apache 2.0）：光学字符识别 (OCR) 引擎，可从图像 (PNG, JPG, JPEG) 和扫描的 PDF 文档中提取文本。",
  legal_library_mathjax: "<strong>MathJax</strong> (许可证: Apache 2.0): 用于在预览中渲染数学公式 (LaTeX)。",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (许可证: MIT): 允许直接在浏览器中预览 H5P 内容，无需服务器或 CMS（如 Moodle 或 WordPress）。",
  legal_library_jspdf: "<strong>jsPDF</strong> (许可证: MIT): 用于在浏览器中直接生成 PDF 文档的 JavaScript 库，用于将教育内容导出为 PDF 格式。",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (许可证: MIT): jsPDF 的扩展，可在导出的 PDF 文档中生成结构化表格。",
  legal_library_docx: "<strong>docx</strong> (许可证: MIT): 用于在浏览器中创建 Word 文档 (.docx) 的 JavaScript 库，用于将教育内容导出为 Microsoft Word 格式。",
  legal_library_ownership: "每个库均归其各自作者所有，并按照其许可协议使用。",

  // ============================================================================
  // === 通知 ===
  // ============================================================================
  no_notifications: "没有通知",
  clear_all: "全部清除",
  view: "查看",
  today: "今天",
  error: "错误",
  download: "下载",
  edit_content: "编辑",
  compatible_with: "兼容:",
  preview_placeholder: "预览即将推出",
  previous: "上一个",
  next: "下一个",
  close_modal: "关闭",
  loading: "正在加载...",
  preview_error: "无法预览此文件",
  simulator_warning: "通过活动模拟器预览：在 Éléa 上的最终呈现可能会略有不同。",
  editor_confirm_close_title: "未保存的更改",
  editor_confirm_close_message: "您想在退出前保存更改吗？",
  editor_confirm_close_cancel: "留在编辑器中",
  editor_confirm_close_save: "保存并退出",
  editor_confirm_close_discard: "退出但不保存",

  // JSON 编辑器
  editor_title_prefix: "编辑：",
  editor_loading: "正在加载编辑器...",
  editor_unknown_type: "无法识别的内容类型",
  editor_no_schema: "此类型没有可用的架构",
  editor_init_error: "初始化编辑器时出错",
  editor_save: "保存",
  editor_cancel: "取消",
  editor_unsaved_changes: "未保存的更改",
  editor_confirm_discard: "您确定要取消吗？未保存的更改将丢失。",
  editor_validation_errors: "验证错误",

  // 章节
  editor_section_general: "基本信息",
  editor_section_question: "问题",
  editor_section_questions: "问题",
  editor_section_answers: "回答",
  editor_section_answer: "回答",
  editor_section_feedback: "反馈",
  editor_section_cards: "卡片",
  editor_section_sentences: "句子",
  editor_section_events: "事件",
  editor_section_words: "单词",
  editor_section_keywords: "关键词",
  editor_section_entries: "条目",
  editor_section_pairs: "配对",
  editor_section_text: "文本",

  // 通用字段
  editor_title: "标题",
  editor_description: "描述",
  editor_description_hint: "面向学生的说明",
  editor_intro: "介绍",
  editor_task_description: "说明",
  editor_question_text: "问题正文",

  // 卡片
  editor_card: "卡片",
  editor_card_front: "正面",
  editor_card_front_placeholder: "问题或术语",
  editor_card_back: "反面",
  editor_card_back_placeholder: "回答或定义",
  editor_card_tip: "提示",
  editor_add_card: "添加卡片",

  // 回答
  editor_answer: "回答",
  editor_answer_text: "回答文本",
  editor_is_correct: "正确",
  editor_add_answer: "添加回答",

  // 提示与反馈
  editor_tips_feedback: "提示与反馈",
  editor_tip: "提示",
  editor_tip_optional: "提示（可选）",
  editor_tips_optional: "提示（可选）",
  editor_tip_front: "正面提示",
  editor_tip_back: "反面提示",
  editor_chosen_feedback: "选中时的反馈",
  editor_not_chosen_feedback: "未选中时的反馈",
  editor_feedback_correct: "正确时的反馈",
  editor_feedback_wrong: "错误时的反馈",
  editor_overall_feedback: "按分数划分的总体反馈",

  // 反馈范围
  editor_feedback_ranges_label: "根据分数反馈",
  editor_feedback_placeholder: "此范围的反馈消息...",
  editor_add_range: "添加范围",

  // 正确/错误
  editor_correct_answer: "正确答案",
  editor_true: "正确",
  editor_false: "错误",

  // 填空 / 拖拽单词
  editor_sentence: "句子",
  editor_sentence_text: "句子文本",
  editor_add_sentence: "添加句子",
  editor_blanks_hint: "用 *星号* 括起需要猜测的单词",
  editor_text_with_blanks: "带有待放置单词的文本",
  editor_drag_words_hint: "*星号* 之间的单词将作为拖拽元素",

  // 时间轴
  editor_event: "事件",
  editor_add_event: "添加事件",
  editor_start_date: "开始日期",
  editor_end_date: "结束日期",
  editor_event_title: "事件标题",
  editor_event_description: "描述",
  editor_event_tag: "标签",

  // 填字游戏
  editor_word: "单词",
  editor_add_word: "添加单词",
  editor_clue: "提示/定义",
  editor_orientation: "方向",
  editor_horizontal: "水平",
  editor_vertical: "垂直",
  editor_crossword_answer_hint: "单词请使用大写",

  // 论文
  editor_keyword: "关键词",
  editor_keyword_text: "预期关键词",
  editor_keyword_weight: "权重",
  editor_add_keyword: "添加关键词",

  // 术语表
  editor_entry: "条目",
  editor_add_entry: "添加条目",
  editor_term: "术语",
  editor_definition: "定义",

  // Moodle
  editor_question: "问题",
  editor_add_question: "添加问题",
  editor_pair: "配对",
  editor_add_pair: "添加配对",
  editor_left_element: "左侧元素",
  editor_right_element: "右侧元素",
  editor_choice: "选项",
  editor_choice_text: "选项文本",
  editor_add_choice: "添加选项",

  // 条目操作
  editor_add_item: "添加",
  editor_drag: "移动",
  editor_duplicate: "复制",
  editor_delete: "删除",
  editor_confirm_delete: "您确定要删除此条目吗？",
  editor_min_items_reached: "已达到最小条目数",
  editor_max_items_reached: "已达到最大条目数",

  // 验证错误
  editor_error_required: "此字段为必填项",
  editor_error_min_length: "至少 {0} 个字符",
  editor_error_max_length: "最多 {0} 个字符",
  editor_error_pattern: "格式无效",
  editor_error_min_items: "至少 {0} 个条目",
  editor_error_max_items: "最多 {0} 个条目",
  editor_error_number: "必须是数字",
  editor_error_min: "最小值为 {0}",
  editor_error_max: "最大值为 {0}",
  editor_error_feedback_ranges: "范围必须覆盖 0-100% 且不得重叠",
  editor_error_no_correct: "至少有一个答案必须是正确的",
  editor_error_date_format: "日期格式无效（预期格式：YYYY,M,D）",
  editor_error_no_blanks: "文本必须包含至少一个由 *星号* 括起的单词",

  // QuizSet
  editor_library_type: "库类型",
  editor_question_title: "问题标题",
  editor_question_params: "问题参数",
  editor_parameters: "参数",

  // 填字游戏
  editor_extra_clue: "额外提示",

  // FindTheWords
  editor_word_list: "单词列表",

  // SingleChoiceSet
  editor_answers: "可能答案",

  // MarkTheWords
  editor_text_with_marks: "带有标记单词的文本",
  editor_mark_words_hint: "用 *星号* 括起需要标记的单词",

  // SortParagraphs
  editor_section_paragraphs: "段落",
  editor_paragraph: "段落",
  editor_add_paragraph: "添加段落",
  editor_paragraph_text: "段落文本",

  // Summary
  editor_section_summaries: "总结",
  editor_summary_item: "总结条目",
  editor_add_summary_item: "添加条目",
  editor_statement: "陈述",
  editor_add_statement: "添加陈述",
  editor_statement_text: "陈述文本",

  // Moodle Test
  editor_question_type: "问题类型",

  // Moodle Page
  editor_section_blocks: "区块",
  editor_block: "区块",
  editor_add_block: "添加区块",
  editor_block_type: "区块类型",
  editor_block_content: "区块内容",

  // 特殊 Éléa 活动
  // 术语表
  editor_glossary_name: "术语表名称",

  // 百万富翁
  editor_good_answer: "正确答案",
  editor_bad_answers: "错误答案",
  editor_bad_answer: "错误答案",
  editor_add_bad_answer: "添加错误答案",

  // 测试（题库）
  editor_bank_name: "题库名称",
  editor_bank_description: "题库描述",
  editor_question_name: "问题名称",
  editor_question_feedback: "总体反馈",
  editor_answer_fraction: "点数/分数",
  editor_answer_feedback: "回答反馈",
  editor_subquestion: "子问题",
  editor_add_subquestion: "添加子问题",
  editor_numerical_value: "数值",
  editor_numerical_tolerance: "容差",
  editor_section_subquestions: "子问题",
  editor_section_content: "内容",
  editor_feedback_if_true: "正确时的反馈",
  editor_feedback_if_false: "错误时的反馈",

  // 消息
  editor_save_success: "更改已保存",
  editor_save_error: "保存时出错",
  editor_regenerating: "正在重新生成文件...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "页面",
  doc_fmt_summary_header: "目录",
  doc_fmt_quiz_title: "测验",
  doc_fmt_instructions: "📝 说明：回答以下问题。",
  doc_fmt_question_header: "问题",

  // --- Shared properties ---
  doc_fmt_type: "类型：",
  doc_fmt_feedbacks: "💬 反馈：",
  doc_fmt_global_feedbacks: "总体反馈",
  doc_fmt_answers: "答案：",
  doc_fmt_correct_answer_true: "正确答案：正确 ✓",
  doc_fmt_correct_answer_false: "正确答案：错误 ✓",
  doc_fmt_text_if_true: "正确时的文本：",
  doc_fmt_text_if_false: "错误时的文本：",
  doc_fmt_text_with_answers: "包含答案的文本：",
  doc_fmt_text_with_marks: "包含标记词的文本：",
  doc_fmt_marks_to_find: "待标记词汇：",
  doc_fmt_keywords_expected: "预期的关键词：",
  doc_fmt_accepted_answers: "接受的答案：",
  doc_fmt_text_to_complete: "待完成文本：",
  doc_fmt_also_called: "🏷️ 也称为：",
  doc_fmt_image_not_found: "⚠️ [找不到图片]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "抽认卡",
  doc_fmt_card_index: "卡片",
  doc_fmt_card_front: "正面：",
  doc_fmt_card_back: "背面：",
  doc_fmt_hint: "💡 提示：",
  doc_fmt_crossword_title: "填字游戏",
  doc_fmt_definitions_and_answers: "定义与答案",
  doc_fmt_answer: "答案：",
  doc_fmt_extra_hint: "💡 额外提示：",
  doc_fmt_timeline_events: "事件",
  doc_fmt_timeline_periods: "时期",
  doc_fmt_drag_the_words_title: "拖动词汇",
  doc_fmt_fill_in_the_blanks_title: "填空",
  doc_fmt_mark_the_words_title: "标记词汇",
  doc_fmt_glossary_title: "术语表",
  doc_fmt_term_index: "术语",
  doc_fmt_chart_title: "图表",
  doc_fmt_data: "数据",
  doc_fmt_summary_title: "摘要",
  doc_fmt_claim_index: "陈述",
  doc_fmt_multiple_choice_title: "多项选择题",
  doc_fmt_single_choice_set_title: "单项选择题集",
  doc_fmt_true_false_title: "判断题",
  doc_fmt_dialog_cards_title: "对话卡",
  doc_fmt_hint_front: "💡 提示（正面）：",
  doc_fmt_hint_back: "💡 提示（背面）：",
  doc_fmt_sort_paragraphs_title: "段落排序",
  doc_fmt_paragraphs_ordered: "正确顺序后的段落",
  doc_fmt_find_the_words_title: "单词搜索",
  doc_fmt_words_to_find: "待搜索单词",
  doc_fmt_matching_title: "配对",
  doc_fmt_matching_instructions: "📝 说明：将每个项目与其对应的项目匹配。",
  doc_fmt_pairs_to_match: "待配对项",
  doc_fmt_millionnaire_title: "谁想成为百万富翁？",
  doc_fmt_millionnaire_instructions: "📝 说明：在四个选项中找出正确答案。",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "开放式问题",
  doc_fmt_qcm_title: "多选题",
  doc_fmt_moodle_test_title: "测试",
  doc_fmt_associations: "关联：",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "多项选择 (MCQ)",
  doc_fmt_type_matching: "配对",
  doc_fmt_type_numerical: "数值",
  doc_fmt_type_truefalse: "判断",
  doc_fmt_type_shortanswer: "简答",
  doc_fmt_type_cloze: "填空 (Cloze)",
  doc_fmt_type_blanks: "填空",
  doc_fmt_type_dragtext: "拖动词语",
  doc_fmt_type_markwords: "标记词语",
  doc_fmt_type_essay: "开放式问题",
  doc_fmt_type_default: "问题",

  // 教学结构陈述/校正的新键
  doc_fmt_correction_title: "校正",
  doc_fmt_proposed_answers: "建议：",
  doc_fmt_correct_answer: "正确答案",
  doc_fmt_correct_answers: "正确答案：",
  doc_fmt_true: "正确",
  doc_fmt_false: "错误",
  doc_fmt_words_to_place: "要放置的单词：",
  doc_fmt_completed_text: "完成的文本：",
  doc_fmt_text_to_mark: "可在其中找到单词的文本：",
  doc_fmt_words_count_to_find: "要查找的单词数",
  doc_fmt_words_to_mark: "要标记的单词：",
  doc_fmt_answer_space: "回答空间：",
  doc_fmt_open_answer: "开放式回答 - 根据教师定义的标准进行评估。",
  doc_fmt_definitions: "定义",
  doc_fmt_letters: "字母",
  doc_fmt_summary_instructions: "对于每个组，选择正确的陈述。",
  doc_fmt_sort_instructions: "将以下段落按正确顺序排列。",
  doc_fmt_paragraphs_to_sort: "要排序的段落",
  doc_fmt_correct_order: "正确顺序",
  doc_fmt_find_instructions: "查找",
  doc_fmt_hidden_words: "网格中的隐藏单词。",
  doc_fmt_hints: "提示",
  doc_fmt_flashcards_instructions: "对于每张卡片，找出与问题对应的答案。",
  doc_fmt_elements_to_match: "要配对的项目：",
  doc_fmt_possible_matches: "可能的匹配项：",
  doc_fmt_correct_associations: "正确的关联：",

};