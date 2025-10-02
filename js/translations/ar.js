const translations_ar = {
    subtitle: "إنشاء مُساعَد للموارد والأنشطة على Moodle وÉléa",
    help_button: "مساعدة",
    help_modal_title: "🚀 دليل البدء السريع لـ Caramel",
    help_modal_content: `
        <div class="help-modal-content">
            <p>مرحباً بك في <strong>Caramel</strong>! هذا الدليل يرشدك خطوة بخطوة لإنشاء أنشطة تعليمية تفاعلية بمساعدة الذكاء الاصطناعي. اتبع هذه الخطوات البسيطة لتحويل أفكارك إلى وحدات جاهزة للاستخدام.</p>

            <div class="help-section">
                <h4><span class="help-step-number">1</span> اكتب فكرتك (الـ "prompt")</h4>
                <p>كل شيء يبدأ بوصف احتياجاتك. لديك خياران لذلك:</p>
                <ul>
                    <li><span class="badge-help-mode">الوضع السريع</span>: مثالي لبداية سريعة. ببساطة، حدد <strong>من أنت</strong> (مثال: <em>مدرس علوم</em>) و<strong>ماذا تريد أن تتناول</strong> (مثال: <em>دورة الماء في الصف السادس</em>).</li>
                    <li><span class="badge-help-mode">الوضع الموجه</span>: لطلب أكثر دقة. املأ <strong>المادة</strong>، <strong>الموضوع</strong>، <strong>مستوى الطالب</strong>، و<strong>عدد العناصر</strong> التي تريدها (أسئلة، تواريخ، إلخ).</li>
                </ul>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">2</span> أنشئ الـ prompts</h4>
                <p>بعد إدخال معلوماتك، انقر على زر <button id="generateBtn" data-key="generate_prompts">أنشئ الـ prompts</button>. ستقوم الأداة بعد ذلك بإعداد تعليمات مفصلة ("prompts") لكل نوع نشاط متاح.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">3</span> اختر نشاطك</h4>
                <p>تنقل بين علامات التبويب <span class="badge-help-tab">H5P</span> و <span class="badge-help-tab">وحدات Éléa/Moodle</span> لاكتشاف الأنشطة المختلفة المتاحة. انقر على النشاط الذي يثير اهتمامك (على سبيل المثال، "خط زمني" أو "MCQ"). سيظهر الـ prompt المقابل في مربع النص.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">4</span> استخدم الذكاء الاصطناعي</h4>
                <p>هنا يحدث السحر! لديك خياران لإنشاء محتوى نشاطك:</p>
                <div class="help-subsection">
                    <h5><i class="fas fa-robot"></i> الخيار أ: أنشئ مع Albert (موصى به)</h5>
                    <p>انقر على زر <button class="action-btn albert-btn">أنشئ مع Albert</button>. يمكنك اختيار نموذج الذكاء الاصطناعي الذي يناسب احتياجاتك (سريع، قوي، أو متخصص في الكود) بالنقر على السهم الصغير يمين الزر. سيتم <strong>إنشاء وإدراج محتوى نشاطك تلقائياً</strong> في حقل النتائج، جاهزاً للاستخدام.</p>
                    <ul class="advantages">
                        <li><strong>نقاط القوة:</strong> بسيط، سريع، ذكاء اصطناعي مدمج مباشرة في الأداة.</li>
                        <li><strong>نقاط الضعف:</strong> لا يوجد بحث على الويب، لا يمكن تخصيص الـ prompt الأولي للذكاء الاصطناعي.</li>
                    </ul>
                </div>
                <div class="help-subsection">
                    <h5><i class="fas fa-paste"></i> الخيار ب: استخدم الذكاء الاصطناعي الخاص بك</h5>
                    <p>انقر على <button class="copy-btn">📋 نسخ الـ prompt</button> والصق هذه التعليمات في الذكاء الاصطناعي المفضل لديك (ChatGPT, Le Chat, etc.). ثم، <strong>انسخ رد الذكاء الاصطناعي</strong> و<strong>الصقه</strong> في حقل النتائج في Caramel.</p>
                    <ul class="advantages">
                        <li><strong>نقاط القوة:</strong> مرونة كاملة، إمكانية الوصول إلى الإنترنت، القدرة على تعديل الـ prompt الأولي وإضافة مستندات لإنشاء المحتوى.</li>
                        <li><strong>نقاط الضعف:</strong> يتطلب نسخ ولصق يدوي وحساب خارجي.</li>
                    </ul>
                </div>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">5</span> أنشئ وحمّل ملفك</h4>
                <p>بمجرد أن يكون المحتوى في حقل النتائج (سواء تم إنشاؤه بواسطة Albert أو قمت بلصقه)، انقر على زر <button class="download-btn">أنشئ H5P</button> (أو .mbz/.xml حسب النشاط). سيتم تنزيل ملفك، جاهزاً للدمج في منصة Moodle أو Éléa الخاصة بك.</p>
                <p class="help-final-tip">وهكذا! لقد أنشأت نشاطاً تفاعلياً ببضع نقرات فقط. لا تتردد في تجربة الأوضاع والأنشطة المختلفة لإثراء دوراتك.</p>
            </div>
        </div>
    `,
    fast_mode: "الوضع السريع",
    guided_mode: "الوضع المُوجَّه",
    who_are_you: "من أنت؟ (مثال: معلّم، مدرّب...)",
    what_to_address: "ما الذي ترغب في معالجته؟ (مثال: طبيعة الزاوية في الصف السادس...)",
    discipline: "المادة (مثال: التاريخ)",
    theme: "الموضوع (مثال: الثورة الفرنسية)",
    level: "المستوى (مثال: الصف المهني الثاني)",
    number_of_elements: "عدد العناصر (مثال: 10)",
    additional_info: "معلومات إضافية وخاصّة...",
    generate_prompts: "توليد المطالبات",
    h5p_tab: "H5P",
    moodle_tab: "وحدات Éléa/Moodle",

    // General Context (Advanced Mode)
    prompt_expert_intro: "أنت أستاذ خبير في التربية ستُكيِّف النبرة والمفردات وفق محتوى البرامج الحالية ومستوى المتعلمين لمادّة ",
    prompt_context_title: "**السياق:**",
    prompt_subject: "- **المادة:**",
    prompt_student_level: "- **مستوى المتعلمين:**",
    prompt_theme: "- **الموضوع:**",
    prompt_number_of_elements: "- **عدد العناصر:**",
    prompt_additional_info: "- **معلومات إضافية:**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "أنا **",
    prompt_simple_intro_part2: "** وأرغب في **",
    prompt_language_instruction: "يجب أن يكون المحتوى المُولَّد باللغة العربية، ما لم تُحدَّد لغة أخرى في الطلب.",
    prompt_code_block_instruction: "يجب عليك إنشاء النتيجة في كتلة تعليمة برمجية.",

    // Timeline Prompt
    timeline_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Timeline\".",
    timeline_prompt_mission: "**مهمتك:**",
    timeline_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط H5P من نوع Timeline. يجب أن يكون JSON قابلًا للاستخدام مباشرة.",
    timeline_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    timeline_prompt_json_structure_main_object: "يجب أن يحتوي الكائن الرئيس على المفتاح \"timeline\". ويجب أن يتضمّن هذا الكائن:",
    timeline_prompt_headline: "`headline`: عنوان عام للخط الزمني.",
    timeline_prompt_text: "`text`: فقرة تمهيدية قصيرة.",
    timeline_prompt_asset: "`asset`: كائن لصورة الغلاف يحتوي `media` (رابط)، و`caption` (توضيح)، و`credit` (المصدر).",
    timeline_prompt_date_array: "`date`: مصفوفة تضم ${nombreQuestions} كائنات، يمثّل كلٌّ منها حدثًا.",
    timeline_prompt_era_array: "`era`: مصفوفة كائنات لتحديد فترات تغطّي عدة أحداث.",
    timeline_prompt_content_rules_title: "**قواعد المحتوى:**",
    timeline_prompt_rule1: "1. يجب أن يحتوي كل حدث في مصفوفة `date` على:",
    timeline_prompt_rule1_startDate: "-   `startDate` و `endDate`: تاريخ بالصيغة \"AAAA,MM,JJ\" أو \"AAAA\". استخدم `endDate` لتحديد فترة زمنية.",
    timeline_prompt_rule1_headline: "-   `headline`: عنوان الحدث.",
    timeline_prompt_rule1_text: "-   `text`: وصف بصيغة HTML (استخدم <p> و<strong>).",
    timeline_prompt_rule1_asset: "-   `asset`: كائن اختياري لصورة توضّح الحدث.",
    timeline_prompt_rule1_tag: "- `tag`: كلمة رئيسية تميز الفترة (مثال: 'تاريخ', 'علوم').",
    timeline_prompt_rule2: "2. لكل `asset`، ابحث بنشاط عن صورة ذات صلة وخالية من الحقوق (مثل Wikimedia Commons). يجب أن يكون الرابط في `media` مباشرًا وصالحًا. اذكر المصدر والترخيص في `credit`. إذا لم يتم العثور على صورة مناسبة، فاحذف كائن `asset` بالكامل.",
    timeline_prompt_rule3: "3. لكل فترة (`era`)، أضف حقل `text` مع وصف موجز و `tag`.",
    timeline_prompt_example_json_title: "**مثال على بنية JSON:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "عنوان الخط الزمني",
"text": "<p>مقدمة حول موضوع الخط الزمني.</p>",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "بداية الحرب العالمية الأولى",
"text": "<p>النمسا-المجر تعلن الحرب على صربيا.</p>",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "الأرشيدوق فرانز فرديناند قبل اغتياله مباشرة.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "حرب"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "هدنة 1918",
"text": "<p>توقيع الهدنة في ريتوند، التي أنهت القتال.</p>",
"tag": "معاهدة"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "الحرب العالمية الأولى",
"text": "<div>إنها فترة الحرب العظمى.</div>",
"tag": "فترة تاريخية"
}
]
}
}
\`\`\` `,
    timeline_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون أي تعليقات. سيتم استخدام النتيجة مباشرة في أداة أخرى.",

    // Crossword Prompt
    crossword_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Crossword\".",
    crossword_prompt_mission: "**مهمتك:**",
    crossword_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط كلمات متقاطعة عبر H5P.",
    crossword_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    crossword_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    crossword_prompt_title: "`title`: عنوان للنشاط.",
    crossword_prompt_words_array: "`words`: مصفوفة من ${nombreQuestions} كائنات، يحتوي كل منها على:",
    crossword_prompt_answer: "`answer`: الكلمة المطلوب اكتشافها.",
    crossword_prompt_clue: "`clue`: التعريف المقابل.",
    crossword_prompt_extra_clue_optional: "`extraClue` (اختياري): كائن يحتوي على تلميح إضافي. يجب على الذكاء الاصطناعي الحكم على مدى ملاءمة إضافته.",
    crossword_prompt_task_description: "`taskDescription`: تعليمات واضحة.",
    crossword_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي.",
    crossword_prompt_content_rules_title: "**قواعد المحتوى:**",
    crossword_prompt_rule1: "1. يجب أن تكون الكلمات (`answer`) فريدة وذات صلة.",
    crossword_prompt_rule2: "2. ينبغي أن تكون التعريفات (`clue`) قصيرة ودقيقة.",
    crossword_prompt_rule3: "3. تُحفَظ بقية بنية JSON (السلوك، السمة، إلخ) كما هي.",
    crossword_prompt_example_json_title: "**مثال JSON لكلمة واحدة:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "الكلمات المتقاطعة حول علم الأحياء",
"words": [
{
"answer": "خلية",
"clue": "الوحدة الأساسية للحياة.",
"extraClue": {
"params": {
"text": "<p>يمكن أن تكون حيوانية أو نباتية.</p>"
}
}
},
{
"answer": "DNA",
"clue": "الجزيء الذي يحمل المعلومات الوراثية."
}
],
"taskDescription": "<p>أكمل شبكة الكلمات المتقاطعة.</p>"
}
\`\`\` `,
    crossword_prompt_generate_only_json: "ولِّد JSON كاملًا وصالحًا بملء العنوان والوصف ومصفوفة \"words\" دون أي تعليقات إضافية.",

    // Crossword UI translations
    crossword_across: "أفقي",
    crossword_down: "عمودي",
    crossword_check_answer: "تحقق",
    crossword_try_again: "إعادة المحاولة",
    crossword_show_solution: "إظهار الحل",
    crossword_extra_clue: "تلميح إضافي",
    crossword_close_window: "إغلاق النافذة",
    crossword_submit_answer: "إرسال",

    // Essay Prompt
    essay_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Essay\".",
    essay_prompt_mission: "**مهمتك:**",
    essay_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط مقال عبر H5P.",
    essay_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    essay_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    essay_prompt_task_description: "`taskDescription`: تعليمات واضحة تدعو المتعلّم إلى كتابة نص حول الموضوع. يجب أن يكون الموضوع بالخط العريض (<strong>) ويجب أن تنتهي كل جملة بفاصل أسطر (<p>).",
    essay_prompt_keywords_array: "`keywords`: مصفوفة من ${nombreQuestions} كائنات، يحدّد كلٌّ منها كلمة مفتاحية يجب أن يعثر عليها النظام في إجابة المتعلّم.",
    essay_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي.",
    essay_prompt_content_rules_title: "**قواعد المحتوى:**",
    essay_prompt_rule1: "1. يحتوي كل كائن في `keywords` على المفتاح `keyword` مع الكلمة المطلوب البحث عنها.",
    essay_prompt_rule2: "2. يجب أن تكون الكلمات المفتاحية ذات صلة وأساسية لتقييم الفهم.",
    essay_prompt_rule3: "3. تُحفَظ بنية JSON (السلوك، إلخ).",
    essay_prompt_rule4: "4. يجب أن تشجع التعليمات (`taskDescription`) على الكتابة دون استخدام الكلمات المفتاحية المدرجة في `keywords`، باستثناء اسم الموضوع إذا كان ذلك ضروريًا للفهم.",
    essay_prompt_example_json_title: "**مثال JSON لكلمة مفتاحية:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "<p>اكتب نصًا قصيرًا يشرح عملية البناء الضوئي.</p>",
"keywords": [
{
"keyword": "ضوء",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "كلوروفيل",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "ولِّد JSON كاملًا وصالحًا بملء التعليمات وقائمة الكلمات المفتاحية دون أي تعليقات.",

    // Moodle XML Prompt
    moodle_xml_prompt_intro: "أرغب في إنشاء اختبار مكوَّن من ${nombreQuestions} أسئلة.",
    moodle_xml_prompt_content_title: "فيما يخصّ المحتوى:",
    moodle_xml_prompt_content_rule1: "يجب أن تكون الإجابات الخاطئة متسقة مع الموضوع ولكن خاطئة بوضوح لتجنّب التخمين.",
    moodle_xml_prompt_content_rule2: "يجب تنويع صعوبة الأسئلة، ويفضَّل من الأسهل إلى الأصعب.",
    moodle_xml_prompt_content_rule3: "بسِّط الصياغة مع الحفاظ على دقّة المحتوى.",
    moodle_xml_prompt_content_rule4: "لإنتاج التغذية الراجعة، قدّم في جملة أو جملتين عناصر الإجابة المتوقعة.",
    moodle_xml_prompt_question_types_intro: "توزَّع الأسئلة بالتساوي بين الأنواع التالية:",
    moodle_xml_prompt_question_type_multichoice: "- اختيار من متعدد (multichoice) مع إجابة صحيحة واحدة،",
    moodle_xml_prompt_question_type_matching: "- المطابقة (matching)،",
    moodle_xml_prompt_question_type_numerical: "- عددية (numerical) بإجابة رقمية مع أو بدون سماحية،",
    moodle_xml_prompt_question_type_truefalse: "- صواب/خطأ (truefalse).",
    moodle_xml_prompt_question_type_shortanswer: "- shortanswer (إجابة قصيرة) مع إجابات بديلة محتملة،",
    moodle_xml_prompt_question_type_cloze: "- cloze (نصٌّ بفراغات) باستخدام الفئات MULTICHOICE, MULTICHOICE_H, MULTICHOICE_V, MULTICHOICE_S, MULTICHOICE_HS, MULTIRESPONSE, MULTIRESPONSE_H, MULTIRESPONSE_HS, NUMERICAL, SHORTANSWER أو SHORTANWSER_C، وفقًا لما تراه الأنسب للسياق.",
    moodle_xml_prompt_form_title: "فيما يخصّ الشكل:",
    moodle_xml_prompt_form_rule1: "يجب أن يكون ملف XML:",
    moodle_xml_prompt_form_rule1_encoding: "مشفَّرًا بترميز UTF-8 (ضمّن سطر الترميز).",
    moodle_xml_prompt_form_rule1_reusable: "قابلًا لإعادة الاستخدام مباشرة في Moodle دون أخطاء في التنسيق.",
    moodle_xml_prompt_form_rule1_standard_structure: "متّبعًا لبنية XML القياسية في Moodle (مع <quiz> و<question>... إلخ).",
    moodle_xml_prompt_form_rule1_special_chars: "يجب ترميز الرموز الرياضية مثل '<' أو '>' ككيانات HTML (على سبيل المثال، `<` لـ '<' و `>` لـ '>') لتجنب أي لبس مع وسوم XML.",
    moodle_xml_prompt_generate_only_xml: "لا تُعلّق، لا تُنسّق، لا تُلخّص: أريد المحتوى الخام لملف XML فقط. التزم بدقة بالتنسيق الموصوف، لأنني سأُلصق النتيجة في أداة أخرى تتوقّع هذا التنسيق. قدِّم الإجابة ككود مُنسَّق مسبقًا.",

    // GIFT Prompt
    gift_prompt_intro: "أرغب في إنشاء اختبار مكوَّن من ${nombreQuestions} أسئلة.",
    gift_prompt_format_info: "يجب أن يكون الاختبار بصيغة GIFT ليُستورد في Moodle.",
    gift_prompt_question_quality: "على كل سؤال أن يكون واضحًا وموجزًا وبدون لبس، مع تغذية راجعة مفصّلة.",
    gift_prompt_code_format_intro: "يجب أن يتبع الكود تمامًا نفس الصيغة الموضحة أدناه:",
    gift_prompt_example_question_comment: "// question: 1  name: ما الجسم المركزي في مجموعتنا الشمسية؟",
    gift_prompt_example_question_text: "::ما الجسم المركزي في مجموعتنا الشمسية؟::ما الجسم المركزي في مجموعتنا الشمسية؟{",
    gift_prompt_example_answer_correct: "=الشمس#صحيح! الشمس هي النجم المركزي في مجموعتنا الشمسية. أحسنت!",
    gift_prompt_example_answer_incorrect1: "~القمر#خطأ. القمر قمرٌ طبيعي للأرض. الشمس هي الجسم المركزي.",
    gift_prompt_example_answer_incorrect2: "~المشتري#خطأ. المشتري كوكبٌ غازي عملاق. الشمس هي الجسم المركزي.",
    gift_prompt_example_answer_incorrect3: "~الأرض#خطأ. الأرض هي الكوكب الذي نعيش عليه. الشمس هي الجسم المركزي.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "يجب أن يتضمن الاختبار عشوائيًا أنواعًا مختلفة من الأسئلة:",
    gift_prompt_question_type_multichoice: "- أسئلة اختيار من متعدد (multichoice) مع إجابة صحيحة واحدة و3 مشتّتات.",
    gift_prompt_question_type_truefalse: "- أسئلة صواب/خطأ (truefalse).",
    gift_prompt_question_type_numerical: "- أسئلة عددية (numerical) بهامش خطأ مقبول.",
    gift_prompt_question_type_matching: "- أسئلة مطابقة (matching) تحتوي على 4 أزواج على الأقل.",
    gift_prompt_generate_only_gift: "ولِّد الاختبار مباشرة بصيغة GIFT دون تعليقات أو وسوم إضافية. التزم بدقة بالتنسيق الموصوف؛ سأُلصق النتيجة في أداة أخرى تتوقّع هذا التنسيق. قدِّم الإجابة ككود مُنسَّق مسبقًا.",

    // Flashcards Prompt
    flashcards_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Flashcards\".",
    flashcards_prompt_mission: "**مهمتك:**",
    flashcards_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط H5P من نوع بطاقات الذاكرة. يجب أن يكون جاهزًا للاستخدام مباشرة.",
    flashcards_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    flashcards_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    flashcards_prompt_title: "`title`: عنوان مناسب للنشاط.",
    flashcards_prompt_description: "`description`: تعليمات واضحة للمتعلّم.",
    flashcards_prompt_cards_array: "`cards`: مصفوفة من ${nombreQuestions} كائنات؛ يمثّل كل كائن بطاقةً ويحتوي على:",
    flashcards_prompt_text: "`text`: السؤال أو المصطلح المطلوب تخمينه (الوجه الأمامي).",
    flashcards_prompt_answer: "`answer`: الإجابة أو التعريف (الوجه الخلفي). تنبيه: يجب أن تحتوي `answer` على كلمة بسيطة واحدة أو رقم فقط.",
    flashcards_prompt_tip: "`tip` (اختياري): تلميح بصيغة HTML لمساعدة الطالب إذا كان السؤال صعبًا. أضف تلميحًا فقط إذا كنت تعتقد أنه مناسب.",
    flashcards_prompt_example_json_title: "**مثال JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "عواصم أوروبا",
"description": "احفظ عاصمة كل بلد. انقر على البطاقة لرؤية الإجابة.",
"cards": [
{
"text": "فرنسا",
"answer": "باريس"
},
{
"text": "هولندا",
"answer": "أمستردام",
"tip": "<p>إنها مدينة <strong>القنوات</strong> وزهور التوليب!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون تعليقات.",

    // QuizSet Prompt
    quiz_set_prompt_role: "أنت خبير في هندسة التعلّم تُنشئ محتوى لنشاط \"H5P Quiz (Question Set)\".",
    quiz_set_prompt_mission: "**مهمتك:**",
    quiz_set_prompt_generate_json: "ولِّد كائن JSON **للمحتوى فقط** لاختبار H5P، بحيث يمكن استخدامه مباشرة كملف `content.json`.",
    quiz_set_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    quiz_set_prompt_json_structure_main_object: "يحتوي الكائن الرئيس على المفاتيح التالية:",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: مصفوفة من ${nombreQuestions} كائنات، يمثّل كلٌّ منها سؤالًا.",
    quiz_set_prompt_content_rules_title: "**قواعد محتوى الأسئلة:**",
    quiz_set_prompt_rule1: "1. يجب أن يحتوي كل كائن سؤال على المفاتيح `library` و`params` و`subContentId`.",
    quiz_set_prompt_rule2: "2.  **البنية:** يجب أن تكون كل سؤال كائنًا يحتوي على المفاتيح `library` و `metadata` و `params`.",
    quiz_set_prompt_rule3: "3. نوِّع أنواع الأسئلة. استخدم المكتبات التالية بالإصدارات الدقيقة:",
    quiz_set_prompt_rule4: "4.  **التقييم (قاعدة حاسمة):** لـ **جميع أنواع الأسئلة** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), **يجب** عليك إنشاء `overallFeedback` بستة نطاقات درجات بالضبط: 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. بالنسبة لأسئلة `TrueFalse`، أضف أيضًا حقلي `feedbackOnCorrect` و `feedbackOnWrong`. يجب أن يكون التقييم إيجابيًا وتدريجيًا ومصاغًا دائمًا بشكل إيجابي.",
    quiz_set_prompt_rule5: "5.  **المحتوى:** يجب أن يكون المحتوى في `params` ذا صلة من الناحية التربوية، مع مشتتات معقولة للأسئلة متعددة الخيارات ونصوص متماسكة للأنشطة الأخرى.",
    quiz_set_prompt_rule6: "6.  **البساطة:** لا تضف صورًا أو معلمات سلوك غير ضرورية. حافظ على بساطة البنية كما في الأمثلة.",
    quiz_set_prompt_example_json_title: "**أمثلة على الهياكل لكل نوع سؤال مسموح به:**",
    quiz_set_example_true_false: "صح/خطأ :",
    quiz_set_example_multiple_choice: "اختيار من متعدد :",
    quiz_set_example_fill_in_the_blanks: "نص مع فراغات :",
    quiz_set_example_drag_the_words: "اسحب الكلمات :",
    quiz_set_example_mark_the_words: "تمييز الكلمات :",
    quiz_set_example_essay: "كتابة :",
    quiz_set_prompt_generate_only_json: "ولِّد فقط JSON صالحًا، بدءًا من `{\"progressType\": \"dots\", ...}`، دون أي تعليقات.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "عنوان سؤال صح/خطأ" },
        "params": {
            "question": "<p>هل فرنسا دولة؟</p>",
            "correct": "true",
            "feedbackOnCorrect": "صحيح! فرنسا بالفعل دولة.",
            "feedbackOnWrong": "خطأ. فرنسا معترف بها دوليًا كدولة.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "عنوان MCQ" },
        "params": {
            "question": "<p>ما هي عاصمة فرنسا؟</p>",
            "answers": [
                { "text": "باريس", "correct": true },
                { "text": "برلين", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
                { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
                { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
                { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
                { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
                { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "عنوان تمرين ملء الفراغات" },
        "params": {
            "questions": ["<p>باريس هي *عاصمة* فرنسا.</p>"],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
                { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
                { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
                { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
                { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
                { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "عنوان نشاط سحب الكلمات" },
        "params": {
            "taskDescription": "أكمل الجملة.",
            "textField": "*باريس* هي عاصمة فرنسا.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
                { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
                { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
                { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
                { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
                { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "عنوان نشاط تحديد الكلمات" },
        "params": {
            "taskDescription": "حدد العاصمة.",
            "textField": "عاصمة فرنسا هي *باريس*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
                { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
                { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
                { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
                { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
                { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "عنوان المقال" },
        "params": {
            "taskDescription": "<p>ما هي عاصمة فرنسا؟</p>",
            "keywords": [
                { "keyword": "باريس", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
                { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
                { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
                { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
                { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
                { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Accordion\".",
    glossary_prompt_mission: "**مهمتك:**",
    glossary_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لمسرد مصطلحات (Accordion) عبر H5P. يجب أن يكون جاهزًا للاستخدام مباشرة.",
    glossary_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    glossary_prompt_json_structure_main_object: "أنشئ مصفوفة من ${nombreQuestions} كائنات JSON.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: الكلمة أو التعبير المراد تعريفه.",
    glossary_prompt_content: "`text`: التعريف بصيغة HTML (استخدم <p> و<strong> وغيرهما).",
    glossary_prompt_content_rules_title: "**قواعد المحتوى:**",
    glossary_prompt_rule1: "1. يجب أن تكون التعريفات واضحة وموجزة ومناسبة لمستوى المتعلمين.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**مثال JSON لمدخل واحد:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "البناء الضوئي",
"text": "<p>عملية تقوم من خلالها النباتات الخضراء بتحويل ضوء الشمس إلى طاقة.</p>"
},
{
"title": "خلية",
"text": "<p>الوحدة الأساسية لجميع الكائنات الحية.</p>"
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون تعليقات.",

    // Summary Prompt
    summary_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Summary\".",
    summary_prompt_mission: "**مهمتك:**",
    summary_prompt_generate_json: "ولِّد كائن JSON كاملًا لنشاط H5P من نوع Summary، جاهزًا للاستخدام مباشرة.",
    summary_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    summary_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على المفاتيح التالية:",
    summary_prompt_intro_field: "`intro`: جملة تمهيدية للنشاط (مثال: \"اختر العبارة الصحيحة.\").",
    summary_prompt_summaries_array: "`summaries`: مصفوفة من ${nombreQuestions} كائنات، يمثل كل منها خطوة في الملخص.",
    summary_prompt_summary_object: "يجب أن يحتوي كل كائن في `summaries` على:",
    summary_prompt_summary_array: "- `summary`: مصفوفة من الجمل.",
    summary_prompt_tip_field: "- `tip` (اختياري ولكن موصى به): تلميح لمساعدة الطالب.",
    summary_prompt_content_rules_title: "**قواعد المحتوى:**",
    summary_prompt_rule1: "1. في كل مصفوفة \"summary\" تكون **الجملة الأولى صحيحة**.",
    summary_prompt_rule2: "2. الجمل التالية مُشتّتات معقولة لكنها غير صحيحة.",
    summary_prompt_rule3: "3. يجب أن تكوّن جميع الجمل الصحيحة معًا ملخّصًا متماسكًا.",
    summary_prompt_example_json_title: "**مثال JSON لخطوة واحدة:**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "هذه هي الجملة الصحيحة.",
    "هذا خيار خاطئ.",
    "هذا خيار خاطئ آخر."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي، ومرتبطًا بالموضوع.",
    summary_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون تعليقات.",

    // Summary UI translations
    summary_intro: "اختر العبارة الصحيحة.",
    summary_solved_label: "التقدم:",
    summary_score_label: "إجابات خاطئة:",
    summary_result_label: "نتيجتك",
    summary_feedback: "لقد أجبت بشكل صحيح على @score من @total عبارة (@percent %).",
    summary_label_correct: "صحيح.",
    summary_label_incorrect: "خطأ! يرجى المحاولة مرة أخرى.",
    summary_label_correct_answers: "الإجابات الصحيحة.",
    summary_tip_button_label: "إظهار التلميح",
    summary_score_bar_label: "لقد حصلت على :num من :total نقطة",
    summary_progress_text: "التقدم :num من :total",
    summary_alternative_incorrect_label: "خطأ",

    // Drag the Words Prompt
    drag_word_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Drag the Words\".",
    drag_word_prompt_mission: "**مهمتك:**",
    drag_word_prompt_generate_json: "ولِّد كائن JSON كاملًا لنشاط H5P من نوع Drag the Words، جاهزًا للاستخدام.",
    drag_word_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    drag_word_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    drag_word_prompt_task_description: "`taskDescription`: تعليمات واضحة.",
    drag_word_prompt_text_field: "`textField`: النص المراد إكماله. يجب أن تنتهي كل جملة بفاصل أسطر `\\n`.",
    drag_word_prompt_content_rules_title: "**قواعد المحتوى:**",
    drag_word_prompt_rule1: "1. أنشئ نصًا متماسكًا حول الموضوع، بجمل قصيرة تنتهي بـ `\\n`.",
    drag_word_prompt_rule2: "2. الكلمات القابلة للسحب محاطة بنجوم. يمكنك إضافة تلميح باستخدام `:تلميحي` وملاحظات باستخدام `\\+ملاحظات صحيحة \\-ملاحظات غير صحيحة`.",
    drag_word_prompt_example_json_title: "**مثال JSON:**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "أكمل النص عن طريق سحب الكلمات.",
"textField": "يتكون *النظام الشمسي* من *ثماني* كواكب تدور حول *الشمس*."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون تعليقات.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي، ومرتبطًا بالموضوع.",

    // Drag the Words UI translations
    drag_words_check_answer: "تحقق",
    drag_words_try_again: "إعادة المحاولة",
    drag_words_show_solution: "إظهار الحل",
    drag_words_score_feedback: "النتيجة: @score من @total.",
    drag_words_tip_label: "إظهار تلميح",
    drag_words_correct_text: "صحيح!",
    drag_words_incorrect_text: "خطأ!",
    drag_words_score_bar_label: "لقد حصلت على :num من :total نقطة",
    drag_words_submit_answer: "إرسال",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Fill in the Blanks\".",
    blanks_prompt_mission: "**مهمتك:**",
    blanks_prompt_generate_json: "ولِّد كائن JSON كاملًا لنشاط H5P من نوع املأ الفراغات، جاهزًا للاستخدام.",
    blanks_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    blanks_prompt_json_structure_main_object: "يحتوي الكائن على المفتاح `questions` وهي مصفوفة من سلاسل نصية؛ تمثّل كل سلسلة كتلة نص يجب إكمالها.",
    blanks_prompt_content_rules_title: "**قواعد المحتوى:**",
    blanks_prompt_rule1: "- تُحاط الكلمات المطلوب تخمينها بنجمتين (*كلمة*).",
    blanks_prompt_rule2: "- للإجابات البديلة استخدم الشرطة المائلة: *Paris/مدينة النور*.",
    blanks_prompt_rule3: "- لإضافة تلميح استخدم نقطتين: *open-source:مصدر مفتوح عام*. ",
    blanks_prompt_example_json_title: "**مثال JSON:**",
    blanks_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون تعليقات.",
    blanks_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي، ومرتبطًا بالموضوع.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "إظهار الحلول",
    blanks_try_again: "إعادة المحاولة",
    blanks_check_answer: "تحقق",
    blanks_not_filled_out: "يرجى ملء جميع الفراغات.",
    blanks_answer_is_correct: "'':ans' صحيح",
    blanks_answer_is_wrong: "'':ans' خطأ",
    blanks_answered_correctly: "تمت الإجابة بشكل صحيح",
    blanks_answered_incorrectly: "تمت الإجابة بشكل غير صحيح",
    blanks_solution_label: "الإجابة الصحيحة:",
    blanks_input_label: "فراغ @num من @total",
    blanks_input_has_tip_label: "تلميح متاح",
    blanks_tip_label: "تلميح",
    blanks_score_bar_label: "لقد حصلت على :num من :total نقطة",
    blanks_submit_answer: "إرسال",
    blanks_feedback: "لقد أجبت بشكل صحيح على @score من @total فراغ.",
    blanks_finish_header: "إنهاء؟",
    blanks_finish_body: "هل أنت متأكد من رغبتك في الإنهاء؟",
    blanks_cancel_label: "إلغاء",
    blanks_finish_label: "إنهاء",
    blanks_retry_header: "إعادة المحاولة؟",
    blanks_retry_body: "هل أنت متأكد من رغبتك في إعادة المحاولة؟",
    blanks_retry_confirm_label: "تأكيد",
    blanks_checking_mode_header: "وضع التحقق",
    blanks_a11y_check: "تحقق من الإجابات. سيتم تمييز الإجابات بأنها صحيحة أو غير صحيحة أو لم تتم الإجابة عليها.",
    blanks_a11y_show_solution: "إظهار الحل. سيتم تمييز المهمة بالحل الصحيح.",
    blanks_a11y_retry: "إعادة محاولة المهمة. إعادة تعيين جميع الإجابات والبدء من جديد.",

    // Mark the Words Prompt
    mark_words_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Mark the Words\".",
    mark_words_prompt_mission: "**مهمتك:**",
    mark_words_prompt_generate_json: "ولِّد كائن JSON كاملًا لنشاط H5P من نوع Mark the Words، جاهزًا للاستخدام.",
    mark_words_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    mark_words_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    mark_words_prompt_task_description: "`taskDescription`: تعليمات واضحة.",
    mark_words_prompt_text_field: "`textField`: نص تُحاط فيه الكلمات المطلوب تعليمها بنجمتين (*كلمة*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي، ومرتبطًا بالموضوع.",
    mark_words_prompt_content_rules_title: "**قواعد المحتوى:**",
    mark_words_prompt_rule1: "1. اكتب فقرة ذات صلة بالموضوع.",
    mark_words_prompt_rule2: "2. حدّد نحو ${nombreQuestions} كلمات مفتاحية مهمّة للتعليم.",
    mark_words_prompt_rule3: "3.  يجب أن تكون كل كلمة مراد تحديدها محاطة بنجمة بشكل فردي. على سبيل المثال، `*كلمة1* *كلمة2*` صحيح، لكن `*كلمة1 كلمة2*` غير صحيح.",
    mark_words_prompt_rule4: "4.  يجب ألا تكون الفواصل العليا أو علامات الترقيم الأخرى ملتصقة بالكلمات المحددة. على سبيل المثال، `ل'*الطائر*` غير صحيح؛ يجب أن تكتب `ال *طائر*` لكي تعمل.",
    mark_words_prompt_example_json_title: "**مثال JSON:**",
    mark_words_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون تعليقات.",

    // Mark the Words UI translations
    mark_words_check_answer: "تحقق",
    mark_words_try_again: "إعادة المحاولة",
    mark_words_show_solution: "إظهار الحل",
    mark_words_correct_answer: "صحيح!",
    mark_words_incorrect_answer: "خطأ!",
    mark_words_missed_answer: "فاتك!",
    mark_words_display_solution_description: "تم تحديث المهمة لتتضمن الحل.",
    mark_words_score_bar_label: "لقد حصلت على :num من :total نقطة",
    mark_words_submit_answer: "إرسال",
    mark_words_a11y_full_text_label: "نص كامل قابل للقراءة",
    mark_words_a11y_clickable_text_label: "نص كامل يمكن فيه تمييز الكلمات",
    mark_words_a11y_solution_mode_header: "وضع الحل",
    mark_words_a11y_checking_header: "وضع التحقق",
    mark_words_a11y_check: "تحقق من الإجابات. سيتم تمييز الإجابات بأنها صحيحة أو غير صحيحة أو لم تتم الإجابة عليها.",
    mark_words_a11y_show_solution: "إظهار الحل. سيتم تمييز المهمة بالحل الصحيح.",
    mark_words_a11y_retry: "إعادة محاولة المهمة. إعادة تعيين جميع الإجابات والبدء من جديد.",

    // Millionnaire Prompt
    millionnaire_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"Millionnaire\".",
    millionnaire_prompt_num_questions: "**عدد الأسئلة:** 6",
    millionnaire_prompt_mission: "**مهمتك:**",
    millionnaire_prompt_generate_json: "ولِّد كائن JSON يحتوي على عنوان وقائمة من **6 أسئلة** للعبة من نوع \"من سيربح المليون\".",
    millionnaire_prompt_important_rules_title: "**قواعد مهمّة:**",
    millionnaire_prompt_rule1: "1. يجب أن يكون `title` عنوانًا مناسبًا وجذّابًا للنشاط.",
    millionnaire_prompt_rule2: "2. ينبغي أن تتدرّج صعوبة الأسئلة في `questions` **تصاعديًا وبشكل تربوي** بما يلائم مستوى المتعلمين؛ السؤال الأول سهل جدًا والأخير صعب جدًا.",
    millionnaire_prompt_rule3: "3. يجب أن يكون المحتوى دقيقًا تمامًا وملائمًا للموضوع والمستوى الدراسي.",
    millionnaire_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    millionnaire_prompt_main_object: "كائن رئيس يضم مفتاحين:",
    millionnaire_prompt_title: "- `title`: عنوان النشاط (سلسلة نصية).",
    millionnaire_prompt_questions_array: "- `questions`: مصفوفة من 6 كائنات؛ يمثّل كل كائن سؤالًا ويحتوي على:",
    millionnaire_prompt_question: "- `question`: السؤال (سلسلة).",
    millionnaire_prompt_good_answer: "- `goodanswer`: الإجابة الصحيحة (سلسلة).",
    millionnaire_prompt_bad_answer: "- `badanswer`: مصفوفة من 3 إجابات خاطئة (سلاسل).",
    millionnaire_prompt_example_json_title: "**مثال JSON:**",
    millionnaire_prompt_generate_only_json: "ولِّد الكائن JSON الصالح فقط دون أي تعليقات.",

    // Appariement Prompt
    appariement_prompt_role: "أنت خبير في الهندسة البيداغوجية تنشئ نشاط مودل \"المطابقة\".",
    appariement_prompt_num_questions: "**عدد الأزواج:** 10",
    appariement_prompt_mission: "**مهمتك:**",
    appariement_prompt_generate_json: "أنشئ كائن JSON يحتوي على عنوان وقائمة من **10 أزواج** للعبة مطابقة.",
    appariement_prompt_important_rules_title: "**قواعد مهمة:**",
    appariement_prompt_rule1: "1.  يجب أن يكون `title` عنوانًا ذا صلة وجاذبية للنشاط.",
    appariement_prompt_rule2: "2.  يجب أن يحتوي مصفوف `pairs` على 10 كائنات، يحتوي كل منها على `question` (العنصر على اليسار) و`answer` (العنصر على اليمين للمطابقة).",
    appariement_prompt_rule3: "3.  يجب أن يكون المحتوى دقيقًا وصحيحًا وملائمًا للموضوع والمستوى الدراسي.",
    appariement_prompt_json_structure_title: "**بنية JSON المتوقعة:**",
    appariement_prompt_main_object: "كائن رئيسي يحتوي على مفتاحين:",
    appariement_prompt_title: "- `title`: عنوان النشاط (سلسلة محارف).",
    appariement_prompt_pairs_array: "- `pairs`: مصفوفة من 10 كائنات، حيث يمثل كل كائن زوجًا ويحتوي على:",
    appariement_prompt_question: "- `question`: المصطلح أو الصورة على اليسار (سلسلة محارف).",
    appariement_prompt_answer: "- `answer`: التعريف أو المصطلح المقابل على اليمين (سلسلة محارف).",
    appariement_prompt_example_json_title: "**مثال JSON:**",
    appariement_prompt_generate_only_json: "أنشئ فقط كائن JSON صالحًا، دون أي تعليق.",

    // QCM Prompt
    qcm_prompt_role: "أنت خبير في تصميم التعليم تنشئ نشاط Moodle \"MCQ\".",
    qcm_prompt_num_questions: "**عدد الأسئلة:** 10",
    qcm_prompt_mission: "**مهمتك:**",
    qcm_prompt_generate_json: "أنشئ كائن JSON يحتوي على عنوان وقائمة من **10 أسئلة** لـ MCQ.",
    qcm_prompt_important_rules_title: "**قواعد مهمة:**",
    qcm_prompt_rule1: "1.  يجب أن يكون `title` عنوانًا ذا صلة وجاذبية للنشاط.",
    qcm_prompt_rule2: "2.  يجب أن يحتوي مصفوف `questions` على 10 كائنات، يحتوي كل منها على `text` (نص السؤال) ومصفوف `answers`.",
    qcm_prompt_rule3: "3.  يجب أن يحتوي كل مصفوف `answers` على عدة إجابات محتملة. كل إجابة هي كائن يحتوي على `text` و `iscorrect` (1 للصواب، 0 للخطأ). بناءً على سياق السؤال، يمكنك اقتراح أسئلة بإجابة صحيحة واحدة أو عدة إجابات صحيحة.",
    qcm_prompt_json_structure_title: "**بنية JSON المتوقعة:**",
    qcm_prompt_main_object: "كائن رئيسي يحتوي على مفتاحين:",
    qcm_prompt_title: "- `title`: عنوان النشاط (سلسلة محارف).",
    qcm_prompt_questions_array: "- `questions`: مصفوفة من 10 كائنات، حيث يمثل كل كائن سؤالًا ويحتوي على:",
    qcm_prompt_question_text: "- `text`: نص السؤال (سلسلة محارف، قد تحتوي على HTML).",
    qcm_prompt_answers_array: "- `answers`: مصفوفة من الكائنات، حيث يمثل كل كائن إجابة ويحتوي على:",
    qcm_prompt_answer_text: "- `text`: نص الإجابة (سلسلة محارف، قد تحتوي على HTML).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 إذا كانت الإجابة صحيحة، وإلا 0.",
    qcm_prompt_example_json_title: "**مثال JSON:**",
    qcm_prompt_generate_only_json: "أنشئ فقط كائن JSON صالحًا، دون أي تعليق.",

    // H5P Modules
    h5p_timeline_name: "الخط الزمني",
    h5p_timeline_description: "أنشِئ خطًا زمنيًا تفاعليًا لعرض تسلسل من الأحداث.",
    h5p_flashcards_name: "بطاقات الذاكرة",
    h5p_flashcards_description: "أنشِئ بطاقات ذات وجهين للمساعدة على حفظ المصطلحات والتعاريف.",
    h5p_quiz_set_name: "اختبار",
    h5p_quiz_set_description: "كوِّن سلسلة من أسئلة متنوّعة (اختيار من متعدد، سحب وإفلات، إلخ) لتقييم المعارف.",
    h5p_glossary_name: "مسرد",
    h5p_glossary_description: "أنشِئ مسردًا أو قسم أسئلة شائعة بصيغة الأكورديون.",
    h5p_crossword_name: "كلمات متقاطعة",
    h5p_crossword_description: "ولِّد شبكة كلمات متقاطعة انطلاقًا من قائمة كلمات وتعريفات.",
    h5p_essay_name: "مقال",
    h5p_essay_description: "اقترح موضوع كتابة وحدِّد كلمات مفتاحية لتصحيح آلي.",
    h5p_summary_name: "ملخّص",
    h5p_summary_description: "على المتعلمين إعادة بناء ملخص صحيح باختيار الجمل المناسبة.",
    h5p_drag_the_words_name: "اسحب الكلمات",
    h5p_drag_the_words_description: "أنشِئ نصًا بفراغات يجرّ فيه المتعلمون الكلمات الناقصة.",
    h5p_fill_in_the_blanks_name: "املأ الفراغات",
    h5p_fill_in_the_blanks_description: "يملأ المتعلمون الكلمات الناقصة مباشرة بواسطة لوحة المفاتيح.",
    h5p_mark_the_words_name: "علِّم الكلمات",
    h5p_mark_the_words_description: "اطلب من المتعلمين تمييز كلمات معيّنة داخل فقرة.",
    h5p_true_false_name: "سؤال صح/خطأ",
    h5p_true_false_description: "أنشئ أسئلة بسيطة بإجابة ثنائية: صح أم خطأ.",
    h5p_multiple_choice_name: "الاختيار من متعدد",
    h5p_multiple_choice_description: "أنشئ أسئلة الاختيار من متعدد مع إجابة صحيحة واحدة أو أكثر.",
    h5p_find_the_words_name: "البحث عن الكلمات",
    h5p_find_the_words_description: "أنشئ شبكة حروف حيث يجب على الطلاب العثور على الكلمات.",
    h5p_sort_the_paragraphs_name: "ترتيب الفقرات",
    h5p_sort_the_paragraphs_description: "أنشئ مجموعة من الفقرات التي يجب على الطلاب ترتيبها بالترتيب الصحيح.",
    h5p_single_choice_set_name: "مجموعة الاختيار الفردي",
    h5p_single_choice_set_description: "أنشئ سلسلة من الأسئلة حيث يكون لكل سؤال إجابة صحيحة واحدة فقط.",
    h5p_dialog_cards_name: "بطاقات الحوار",
    h5p_dialog_cards_description: "أنشئ بطاقات تفاعلية تحتوي على نص وصور اختيارية على كلا الوجهين.",
    h5p_complex_fill_the_blanks_name: "املأ الفراغات المعقدة",
    h5p_complex_fill_the_blanks_description: "أنشئ نصًا متقدمًا لملء الفراغات مع ملاحظات محددة لكل خطأ.",
    h5p_chart_name: "رسم بياني",
    h5p_chart_description: "أنشئ رسمًا بيانيًا دائريًا أو شريطيًا لتصور البيانات.",

    // Moodle Modules
    moodle_xml_name: "XML Éléa/Moodle",
    moodle_xml_description: "إنشاء بنك من 10 أسئلة لنشاط اختبار جاهزة للاستيراد بتنسيق XML.",
    moodle_xml_help: "لإضافة ملف XML إلى نشاط «اختبار» على Moodle، ابدأ بإنشاء النشاط. بعد ذلك، افتح قائمة <strong>المزيد</strong> واذهب إلى <strong>بنك الأسئلة</strong>. في هذه القائمة، انقر على <strong>استيراد</strong>، واختر تنسيق <strong>Moodle XML</strong>، ثم حدد ملفك وقم بالتأكيد.",
    moodle_gift_name: "تنسيق GIFT",
    moodle_gift_description: "أنشئ أسئلة بتنسيق GIFT، وهو وسيلة بسيطة لاستيراد الأسئلة إلى Moodle.",
    moodle_millionnaire_name: "من سيربح المليون؟",
    moodle_millionnaire_description: "إنشاء نشاط فريد 'من سيربح المليون؟' من 6 أسئلة متدرجة في الصعوبة.",
    moodle_appariement_name: "المطابقة",
    moodle_appariement_description: "أنشئ نشاط مطابقة مكوّنًا من 10 أسئلة.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "إنشاء نشاط MCQ بسيط.",

    // Dynamic content
    prompt_for_ia: "مطلب للذكاء الاصطناعي",
    copy_prompt: "📋 نسخ المطلب",
    go_duck: "🦆 الانتقال إلى Duck.ai",
    go_mistral: "Ⓜ️ الانتقال إلى Le Chat",
    create_h5p_file: "إنشاء ملف H5P",
    integrate_h5p_libraries: "دمج مكتبات H5P:",
    paste_ia_result: "الصق نتيجة الذكاء الاصطناعي في المنطقة أدناه لإنشاء وحدتك.",
    generate_h5p: "توليد H5P",
    create_xml_file: "إنشاء ملف XML",
    paste_ia_result_xml: "الصق هنا ملف XML المُولَّد بواسطة الذكاء الاصطناعي.",
    generate_xml_file: "توليد ملف XML",

    create_mbz_file_appariement: "أنشئ ملف المطابقة (.mbz)",
    paste_ia_result_appariement: "ألصق أدناه JSON الذي أنشأته الذكاء الاصطناعي. سيتم استخراج عنوان النشاط تلقائيًا من JSON.",
    generate_mbz_appariement: "أنشئ نشاط المطابقة (mbz)",
    create_mbz_file_millionnaire: "أنشئ ملف المليونير (.mbz)",
    paste_ia_result_millionnaire: "ألصق أدناه JSON الذي أنشأته الذكاء الاصطناعي. سيتم استخراج عنوان النشاط تلقائيًا من JSON.",
    generate_mbz_millionnaire: "أنشئ نشاط المليونير (mbz)",

    create_mbz_file_qcm: "إنشاء ملف MCQ (.mbz)",
    paste_ia_result_qcm: "ألصق أدناه JSON الذي أنشأته الذكاء الاصطناعي. سيتم استخراج عنوان النشاط تلقائيًا من JSON.",
    generate_mbz_qcm: "إنشاء نشاط MCQ (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "سيظهر Moodle XML هنا...",
    paste_xml_placeholder: "الصق هنا ملف XML الكامل الذي ولّده الذكاء الاصطناعي...",

    // H5P champs textes vides
    generate_prompts_placeholder: "سيظهر موجّه الذكاء الاصطناعي هنا بعد النقر على 'توليد الـprompts'.",
    paste_json_or_text: "الصِق هنا محتوى JSON أو النص الذي أنشأه الذكاء الاصطناعي لإنشاء نشاطك.",

    // Notifications
    prompts_generated_successfully: "تم توليد المطالبات بنجاح!",
    error_please_fill_fields: "يرجى ملء جميع حقول الوضع البسيط.",
    error_please_fill_guided_fields: "يرجى ملء جميع حقول الوضع المُوجَّه.",
    error_field_empty: "الحقل فارغ. يرجى توليد مطلب أولًا.",
    error_copy_failed: "فشل النسخ.",
    error_h5p_module_not_found: "الوحدة '{moduleKey}' غير موجودة.",
    error_invalid_quiz_json: "JSON الخاص بالاختبار غير صالح: {errorMessage}",
    error_invalid_json: "JSON المزوَّد غير صالح. خطأ: {errorMessage}",
    error_h5p_creation: "خطأ في إنشاء H5P: {errorMessage}",
    error_paste_ia_content: "يرجى لصق المحتوى المُولَّد بواسطة الذكاء الاصطناعي.",
    error_compression_module_not_ready: "وحدة الضغط غير جاهزة بعد. أعد المحاولة بعد قليل.",
    h5p_file_generated_successfully: "تم إنشاء الملف {fileName} بنجاح!",
    h5p_creation_failed: "فشل إنشاء ملف H5P: {errorMessage}",
    license_info: "رخصة GNU GPL الإصدار 3.0 أو الأحدث",

    // Flashcards specific UI translations
    flashcards_progress_text: "البطاقة @card من @total",
    flashcards_next: "التالي",
    flashcards_previous: "السابق",
    flashcards_check_answer: "تحقق",
    flashcards_your_answer: "إجابتك",
    flashcards_correct_answer: "صحيح",
    flashcards_incorrect_answer: "غير صحيح",
    flashcards_show_solution: "الإجابة الصحيحة",
    flashcards_results: "النتائج",
    flashcards_of_correct: "@score من @total صحيح",
    flashcards_show_results: "عرض النتائج",
    flashcards_answer_short: "ج:",
    flashcards_retry: "إعادة المحاولة",
    flashcards_card_announcement: "إجابة غير صحيحة. الإجابة الصحيحة كانت @answer",
    flashcards_correct_announcement: "@answer صحيح.",
    flashcards_page_announcement: "صفحة @current من @total",

    ticket: "تذكرة",
    legal_mentions: "ملاحظات قانونية",

    // Legal Mentions
    legal_title: "ملاحظات قانونية",
    legal_editor_title: "محرر التطبيق",
    legal_editor_gauthier_remande: "<strong>غوتييه ريماند</strong>",
    legal_editor_gauthier_remande_function: "الوظيفة: أستاذ في المدرسة الثانوية المهنية للآداب والتاريخ",
    legal_editor_gauthier_remande_email: "البريد الإلكتروني: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "العنوان: 39 avenue de Chanzy، 53000 Laval، فرنسا",
    legal_editor_gauthier_remande_phone: "الهاتف: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>إيمانويل غونار</strong>",
    legal_editor_emmanuel_gaunard_function: "الوظيفة: أستاذ رياضيات ومسؤول بعثة DRANE – أكاديمية غرونوبل",
    legal_editor_emmanuel_gaunard_email: "البريد الإلكتروني: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "العنوان: 30 boulevard de la République, 38200 Vienne, France",
    legal_editor_emmanuel_gaunard_phone: "الهاتف: +33 6 46 74 20 94",
    legal_app_description: "تطبيق الويب «كراميل» هو مشروع حر وغير تجاري لإنشاء محتوى H5P. لا يلزم وجود حساب، ولا يتم جمع أي بيانات شخصية، وتتم جميع التفاعلات محليًا في المتصفح.",
    legal_hosting_title: "الاستضافة",
    legal_host_name: "<strong>المستضيف</strong>: Forge des Communs Numériques Éducatifs",
    legal_host_company: "<strong>اسم الشركة</strong>: وزارة التربية الوطنية والشباب",
    legal_host_address: "<strong>العنوان</strong>: 110 rue de Grenelle, 75007 Paris, France",
    legal_host_phone: "<strong>الهاتف</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "مدير النشر",
    legal_publication_director_name: "غوتييه ريماند وإيمانويل غونار، بصفتهما محررين متطوعين.",
    legal_terms_of_use_title: "الشروط العامة للاستخدام",
    legal_terms_of_use_content: "يسمح هذا الموقع للمستخدمين بإنشاء محتوى H5P. يتم العرض محليًا، دون نقل بيانات المستخدم. المستخدم هو المسؤول الوحيد عن استخدام المحتوى الذي تم إنشاؤه. يتم تقديم التطبيق مجانًا، دون أي ضمان للتشغيل أو النتيجة. يخلي المحرر مسؤوليته في حالة سوء تفسير المحتوى أو الاستخدام غير المناسب.",
    legal_intellectual_property_title: "الملكية الفكرية",
    legal_intellectual_property_content: "جميع أكواد المصدر والعناصر الرسومية والمحتوى مرخصة بموجب رخصة GNU AGPLv3 الحرة. يُسمح بإعادة استخدامها بموجب شروط تراخيصها المعنية. يجب أن يذكر أي إعادة توزيع أو تعديل المؤلفين الأصليين: غوتييه ريماند وإيمانويل غونار. يتم استرداد الصور المستخدمة في وحدات H5P من H5P.org.",
    legal_personal_data_title: "البيانات الشخصية",
    legal_personal_data_content: "لا يتم جمع أو تخزين أي بيانات شخصية. لا يتم استخدام أي ملفات تعريف ارتباط للتتبع. يتم تخزين محفوظات الجلسة في المتصفح المحلي للمستخدم (localStorage)، دون نقل. وفقًا للائحة العامة لحماية البيانات، لا يتم نقل أي معلومات شخصية إلى المحرر أو إلى طرف ثالث.",
    legal_accessibility_title: "إمكانية الوصول",
    legal_accessibility_content: "تم تصميم التطبيق ليكون متوافقًا مع استخدام الكمبيوتر، بما في ذلك الأوضاع الداكنة/الفاتحة، والتنقل بلوحة المفاتيح، والتباين العالي حسب السمات. يجري تحسين مستمر لإمكانية الوصول، بما يتماشى مع توصيات RGAA.",
    legal_applicable_law_title: "القانون المطبق",
    legal_applicable_law_content: "يخضع هذا الموقع للقانون الفرنسي. في حالة النزاع، تكون المحاكم المختصة هي تلك الموجودة في دائرة اختصاص ليون.",
    legal_external_libraries_title: "المكتبات الخارجية المستخدمة",
    legal_external_libraries_intro: "يستخدم تطبيق كراميل العديد من المكتبات مفتوحة المصدر، بموجب التراخيص التالية:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (الترخيص: CC BY 4.0, SIL OFL 1.1, MIT): يوفر الرموز المستخدمة في الواجهة لتحسين التنقل والتجربة المرئية.",
    legal_library_jszip: "<strong>JSZip</strong> (الترخيص: MIT أو GPLv3): يسمح بإنشاء ملفات .h5p عن طريق ضغط المحتوى الضروري في أرشيف مضغوط.",
    legal_library_clientzip: "<strong>client-zip</strong> (الترخيص: MIT): مكتبة أخرى تستخدم لضغط الملفات، وتقدم بديلاً عالي الأداء لإنشاء أرشيفات .h5p مباشرة في المتصفح.",
    legal_library_fflate: "<strong>fflate</strong> (الترخيص: MIT): مكتبة سريعة جدًا لضغط وفك ضغط البيانات، تستخدم لإنشاء أرشيفات .mbz لوحدات Moodle.",
    legal_library_tarjs: "<strong>tar-js</strong> (الترخيص: MIT): يسمح بإنشاء أرشيفات .tar، وهي خطوة ضرورية قبل الضغط لتكوين ملفات .mbz لوحدات Moodle.",
    legal_library_ownership: "تظل كل مكتبة ملكًا لمؤلفيها المعنيين وتستخدم وفقًا لترخيصها (تراخيصها).",

    // Essay specific UI translations
    essay_checkAnswer: "تحقق",
    essay_tryAgain: "إعادة المحاولة",
    essay_showSolution: "إظهار الحل",
    essay_feedbackHeader: "ملاحظات",
    essay_solutionTitle: "حل نموذجي",
    remainingChars: "الأحرف المتبقية: @chars",
    notEnoughChars: "يجب إدخال @chars أحرف على الأقل!",
    messageSave: "تم الحفظ",
    placeholderText: "ابدأ الكتابة هنا...",
    ariaYourResult: "لقد حصلت على @score من @total نقطة",
    ariaNavigatedToSolution: "تم الانتقال إلى الحل النموذجي المضمن حديثًا بعد منطقة النص.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "عملك بداية جيدة. استمر في استكشاف الموضوع لإثراء أفكارك.",
    essay_overall_feedback_11_30: "لقد وضعت أسسًا مثيرة للاهتمام. من خلال التعمق في نقاط معينة، سيكتسب عملك دقة أكبر.",
    essay_overall_feedback_31_50: "فهمك للموضوع في طريقه الصحيح. فكر في تطوير حججك أكثر لتعزيز وجهة نظرك.",
    essay_overall_feedback_51_70: "هذا عمل جيد. تظهر إتقانًا جيدًا للموضوع. بعض التفاصيل الإضافية يمكن أن تحسنه أكثر.",
    essay_overall_feedback_71_90: "عمل جيد جدًا! تحليلك وثيق الصلة ومنظم جيدًا. تظهر فهمًا ممتازًا.",
    essay_overall_feedback_91_100: "عمل ممتاز! تفكيرك عميق، مدعوم بحجج جيدة، ويظهر إتقانًا كاملاً للموضوع.",

    // True/False Question
    true_false_prompt_role: "أنت خبير في تصميم التعليم تنشئ سؤال صح/خطأ لنشاط H5P.",
    true_false_prompt_mission: "مهمتك هي إنشاء كائن JSON لسؤال صح/خطأ.",
    true_false_prompt_generate_json: "أنشئ كائن JSON بناءً على البنية التالية:",
    true_false_prompt_json_structure_title: "--- بنية JSON المتوقعة ---",
    true_false_prompt_json_structure_main_object: "يجب أن يحتوي الكائن الرئيسي على المفاتيح التالية:",
    true_false_prompt_question: "`question`: (string) العبارة التي سيتم تقييمها. يمكن أن تحتوي على HTML.",
    true_false_prompt_correct: "`correct`: (string) الإجابة الصحيحة، إما \"true\" أو \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) تعليق يظهر إذا كانت الإجابة صحيحة.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) تعليق يظهر إذا كانت الإجابة غير صحيحة.",
    true_false_prompt_content_rules_title: "--- قواعد المحتوى ---",
    true_false_prompt_rule1: "يجب أن يكون السؤال عبارة واضحة.",
    true_false_prompt_rule2: "يجب أن تكون قيمة `correct` سلسلة نصية: \"true\" أو \"false\".",
    true_false_prompt_example_json_title: "--- مثال على JSON ---",
    true_false_prompt_generate_only_json: "أريدك أن تنشئ JSON فقط، بدون أي تعليقات أو نص تمهيدي.",
    true_false_true_text: "صح",
    true_false_false_text: "خطأ",
    true_false_score: "لقد حصلت على @score من @total نقطة",
    true_false_check_answer: "تحقق",
    true_false_show_solution_button: "إظهار الحل",
    true_false_try_again: "إعادة المحاولة",
    true_false_wrong_answer_message: "إجابة خاطئة",
    true_false_correct_answer_message: "إجابة صحيحة",
    true_false_score_bar_label: "لقد حصلت على :num من :total نقطة",
    true_false_submit_answer: "إرسال",
    true_false_a11y_check: "تحقق من الإجابات. سيتم تمييز الإجابات بأنها صحيحة أو خاطئة أو لم تتم الإجابة عليها.",
    true_false_a11y_show_solution: "إظهار الحل. سيتم تمييز المهمة بالحل الصحيح.",
    true_false_a11y_retry: "أعد محاولة المهمة. أعد تعيين جميع الإجابات وابدأ المهمة من جديد.",
    true_false_finish_header: "إنهاء؟",
    true_false_finish_body: "هل أنت متأكد من رغبتك في الإنهاء؟",
    true_false_cancel_label: "إلغاء",
    true_false_finish_label: "إنهاء",
    true_false_retry_header: "إعادة المحاولة؟",
    true_false_retry_body: "هل أنت متأكد من رغبتك في إعادة المحاولة؟",
    true_false_retry_confirm_label: "تأكيد",

    // Multiple Choice UI translations
    checkAnswerButton: "تحقق",
    showSolutionButton: "إظهار الحل",
    tryAgainButton: "إعادة المحاولة",
    submitAnswerButton: "إرسال",
    scoreBarLabel: "لقد حصلت على :num من :total نقطة",
    confirmCheckHeader: "إنهاء؟",
    confirmCheckBody: "هل أنت متأكد من رغبتك في الإنهاء؟",
    confirmCheckCancelLabel: "إلغاء",
    confirmCheckConfirmLabel: "إنهاء",
    confirmRetryHeader: "إعادة المحاولة؟",
    confirmRetryBody: "هل أنت متأكد من رغبتك في إعادة المحاولة؟",
    confirmRetryCancelLabel: "إلغاء",
    confirmRetryConfirmLabel: "تأكيد",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"الاختيار من متعدد\".",
    multiple_choice_prompt_mission: "**مهمتك:**",
    multiple_choice_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط H5P من نوع الاختيار من متعدد.",
    multiple_choice_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    multiple_choice_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    multiple_choice_prompt_question: "`question`: السؤال المراد طرحه (بصيغة HTML).",
    multiple_choice_prompt_answers_array: "`answers`: مصفوفة من الكائنات، يمثّل كلٌّ منها إجابة.",
    multiple_choice_prompt_text: "`text`: نص الإجابة (بصيغة HTML).",
    multiple_choice_prompt_correct: "`correct`: قيمة منطقية (`true` أو `false`) تشير إلى ما إذا كانت الإجابة صحيحة.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي.",
    multiple_choice_prompt_content_rules_title: "**قواعد المحتوى:**",
    multiple_choice_prompt_rule1: "1.  يجب أن تكون هناك إجابة صحيحة واحدة فقط (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  قدّم عدة إجابات خاطئة (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**مثال JSON:**",
    multiple_choice_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون أي تعليقات.",

    // Find the Words UI translations
    check: "تحقق",
    tryAgain: "إعادة المحاولة",
    showSolution: "إظهار الحل",
    found: "تم العثور على @found من @totalWords",
    timeSpent: "الوقت المستغرق",
    score: "لقد حصلت على @score من @total نقطة",
    wordListHeader: "قائمة الكلمات",

    // Find the Words Prompt
    find_the_words_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"البحث عن الكلمات\".",
    find_the_words_prompt_mission: "**مهمتك:**",
    find_the_words_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط H5P من نوع البحث عن الكلمات.",
    find_the_words_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    find_the_words_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    find_the_words_prompt_task_description: "`taskDescription`: تعليمات واضحة للنشاط.",
    find_the_words_prompt_word_list: "`wordList`: سلسلة من الكلمات للبحث عنها، مفصولة بفواصل وبدون مسافات.",
    find_the_words_prompt_content_rules_title: "**قواعد المحتوى:**",
    find_the_words_prompt_rule1: "1.  يجب أن تكون `wordList` سلسلة واحدة من الكلمات مفصولة بفواصل.",
    find_the_words_prompt_example_json_title: "**مثال JSON:**",
    find_the_words_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون أي تعليقات.",
    fillPool: "ابتثجحخدذرزسشصضطظعغفقكلمنهوي",

    // Sort the Paragraphs UI translations
    checkAnswer: "تحقق",
    submitAnswer: "إرسال",
    up: "أعلى",
    down: "أسفل",
    disabled: "معطل",
    a11y_yourResult: "لقد حصلت على @score من @total نقطة",
    a11y_paragraph: "فقرة",
    a11y_correct: "صحيح",
    a11y_wrong: "خطأ",
    a11y_point: "@score نقطة",
    a11y_sevenOfNine: "@current من @total",
    a11y_currentPosition: "الموضع الحالي في القائمة",
    a11y_instructionsSelected: "اضغط على مفتاح المسافة لإعادة الترتيب",
    a11y_instructionsGrabbed: "اضغط على مفاتيح الأسهم لأعلى ولأسفل لتغيير الموضع، ومفتاح المسافة للإفلات، ومفتاح الهروب للإلغاء",
    a11y_grabbed: "تم الإمساك به",
    a11y_moved: "تم نقله",
    a11y_dropped: "تم إفلاته",
    a11y_reorderCancelled: "تم إلغاء إعادة الترتيب",
    a11y_finalPosition: "الموضع النهائي",
    a11y_nextParagraph: "الفقرة التالية",
    a11y_correctParagraph: "فقرة صحيحة في الموضع",
    a11y_listDescription: "قائمة فقرات قابلة للفرز.",
    a11y_listDescriptionCheckAnswer: "قائمة فقرات مع النتائج.",
    a11y_listDescriptionShowSolution: "قائمة فقرات مع الحلول.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"ترتيب الفقرات\".",
    sort_the_paragraphs_prompt_mission: "**مهمتك:**",
    sort_the_paragraphs_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط H5P من نوع ترتيب الفقرات.",
    sort_the_paragraphs_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: تعليمات واضحة للنشاط.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: مصفوفة من السلاسل النصية، تمثّل كلٌّ منها فقرة للترتيب. يجب أن تكون الفقرات بالترتيب الصحيح.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي.",
    sort_the_paragraphs_prompt_content_rules_title: "**قواعد المحتوى:**",
    sort_the_paragraphs_prompt_rule1: "1.  يجب أن تحتوي مصفوفة `paragraphs` على قائمة من الفقرات بالترتيب المنطقي الصحيح.",
    sort_the_paragraphs_prompt_example_json_title: "**مثال JSON:**",
    sort_the_paragraphs_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون أي تعليقات.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "إظهار الحل",
    retryButtonLabel: "إعادة المحاولة",
    solutionViewTitle: "الحل",
    correctText: "صحيح!",
    incorrectText: "خطأ!",
    muteButtonLabel: "كتم الصوت",
    closeButtonLabel: "إغلاق",
    slideOfTotal: "شريحة @slide من @total",
    nextButtonLabel: "التالي",
    solutionListQuestionNumber: "سؤال @question",
    a11yShowSolution: "إظهار الحل. سيتم تمييز المهمة بالحل الصحيح.",
    a11yRetry: "أعد محاولة المهمة. أعد تعيين جميع الإجابات وابدأ المهمة من جديد.",
    shouldSelect: "يجب أن تختار",
    shouldNotSelect: "لا يجب أن تختار",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"مجموعة الاختيار الفردي\".",
    single_choice_set_prompt_mission: "**مهمتك:**",
    single_choice_set_prompt_generate_json: "ولِّد كائن JSON كاملًا وصالحًا لنشاط H5P من نوع مجموعة الاختيار الفردي.",
    single_choice_set_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    single_choice_set_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    single_choice_set_prompt_choices_array: "`choices`: مصفوفة من الكائنات، يمثّل كلٌّ منها سؤالًا ويحتوي على:",
    single_choice_set_prompt_question: "`question`: السؤال المراد طرحه.",
    single_choice_set_prompt_answers_array: "`answers`: مصفوفة من السلاسل النصية. السلسلة الأولى هي دائمًا الإجابة الصحيحة.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: مصفوفة من 6 كائنات للتقييم النهائي، مع درجات من 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100. يجب أن يكون النص (`feedback`) إيجابيًا ومتدرجًا ومصاغًا دائمًا بشكل إيجابي.",
    single_choice_set_prompt_content_rules_title: "**قواعد المحتوى:**",
    single_choice_set_prompt_rule1: "1. في كل مصفوفة `answers`، تكون الإجابة الأولى هي الصحيحة دائمًا.",
    single_choice_set_prompt_example_json_title: "**مثال JSON:**",
    single_choice_set_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون أي تعليقات.",

    // Dialog Cards UI translations
    answer: "اقلب",
    next: "التالي",
    prev: "السابق",
    retry: "إعادة المحاولة",
    progressText: "البطاقة @card من @total",
    cardFrontLabel: "وجه البطاقة الأمامي",
    cardBackLabel: "وجه البطاقة الخلفي",
    tipButtonLabel: "إظهار التلميح",
    audioNotSupported: "متصفحك لا يدعم هذا الصوت",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "أنت خبير في هندسة التعلّم تنشئ نشاط H5P من نوع \"بطاقات الحوار\".",
    dialog_cards_prompt_mission: "**مهمتك:**",
    dialog_cards_prompt_generate_json: "ولِّد كائن JSON يحتوي فقط على المفاتيح `title` و `description` و `dialogs` لنشاط H5P من نوع بطاقات الحوار.",
    dialog_cards_prompt_json_structure_title: "**البنية المتوقَّعة لملف JSON:**",
    dialog_cards_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    dialog_cards_prompt_title: "`title`: عنوان للنشاط (بصيغة HTML).",
    dialog_cards_prompt_description: "`description`: وصف قصير أو تعليمات (بصيغة HTML).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: مصفوفة من ${nombreQuestions} كائنات، يمثّل كلٌّ منها بطاقة ويحتوي على:",
    dialog_cards_prompt_text: "`text`: النص على وجه البطاقة الأمامي (بصيغة HTML).",
    dialog_cards_prompt_answer: "`answer`: النص على وجه البطاقة الخلفي (بصيغة HTML).",
    dialog_cards_prompt_tips: "`tips` (اختياري): كائن للتلميحات. إذا رأيت أنه مفيد من الناحية التربوية، أضف تلميحًا للوجه الأمامي بالمفتاح `front` و/أو للوجه الخلفي بالمفتاح `back`.",
    dialog_cards_prompt_content_rules_title: "**قواعد المحتوى:**",
    dialog_cards_prompt_rule1: "1. يجب أن تكون نصوص الوجه الأمامي (`text`) والوجه الخلفي (`answer`) واضحة وموجزة. **نسق المحتوى باستخدام HTML (<strong> للنص العريض، <em> للنص المائل) لتحسين القراءة وإبراز المعلومات المهمة.**",
    dialog_cards_prompt_rule2: "2. لا تقم بإضافة أي صور أو أصوات.",
    dialog_cards_prompt_rule3: "",
    dialog_cards_prompt_example_json_title: "**مثال JSON:**",
    dialog_cards_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط يحتوي على المفاتيح `title` و `description` و `dialogs`، دون أي تعليقات.",

    // Dialog Cards specific UI translations
    correctAnswer: "أجبت بشكل صحيح!",
    incorrectAnswer: "أخطأت",
    round: "جولة @round",
    cardsLeft: "البطاقات المتبقية: @number",
    nextRound: "الانتقال إلى الجولة @round",
    startOver: "البدء من جديد",
    showSummary: "التالي",
    summary: "ملخص",
    summaryCardsRight: "البطاقات التي أجبت عليها بشكل صحيح:",
    summaryCardsWrong: "البطاقات التي أخطأت فيها:",
    summaryCardsNotShown: "البطاقات غير المعروضة في المجموعة:",
    summaryOverallScore: "النتيجة الإجمالية",
    summaryCardsCompleted: "البطاقات التي أكملت تعلمها:",
    summaryCompletedRounds: "الجولات المكتملة:",
    summaryAllDone: "أحسنت! لقد أجبت على جميع البطاقات @cards بشكل صحيح @max مرات متتالية!",
    confirmStartingOverHeader: "البدء من جديد؟",
    confirmStartingOverBody: "سيتم فقدان كل التقدم. هل أنت متأكد من أنك تريد البدء من جديد؟",
    confirmStartingOverCancelLabel: "إلغاء",
    confirmStartingOverConfirmLabel: "البدء من جديد",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "أنت خبير في تصميم التعليم تنشئ نشاط H5P \"املأ الفراغات المعقدة\".",
    complex_blanks_prompt_mission: "**مهمتك:**",
    complex_blanks_prompt_generate_json: "أنشئ كائن JSON كاملاً وصالحًا لنشاط H5P من نوع املأ الفراغات المعقدة.",
    complex_blanks_prompt_json_structure_title: "**بنية JSON المتوقعة:**",
    complex_blanks_prompt_json_structure_main_object: "يجب أن يحتوي الكائن الرئيسي على المفتاحين `content` و `overallFeedback`.",
    complex_blanks_prompt_task: "`task`: تعليمات التمرين (بتنسيق HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: النص الذي يحتوي على الفراغات، ممثلة بـ `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: مصفوفة من الكائنات، واحد لكل فراغ، بترتيب ظهورها.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: الإجابة الصحيحة (يمكن أن تتضمن بدائل مع `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: مصفوفة من الكائنات للأخطاء الشائعة.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: نص خطأ شائع.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: الملاحظات المحددة لهذا الخطأ (بتنسيق HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: مصفوفة للملاحظات العامة بناءً على النتيجة.",
    complex_blanks_prompt_content_rules_title: "**قواعد المحتوى:**",
    complex_blanks_prompt_rule1: "1. يجب أن يتطابق عدد الكائنات في `blanksList` مع عدد الفراغات في `blanksText`.",
    complex_blanks_prompt_rule2: "2. قدم أخطاء شائعة وملاحظات بناءة.",
    complex_blanks_prompt_rule3: "3. يمكن أن يحتوي النص والملاحظات على علامات HTML بسيطة مثل `<p>` و `<strong>` و `<em>`.",
    complex_blanks_prompt_example_json_title: "**مثال JSON:**",
    complex_blanks_prompt_generate_only_json: "أنشئ فقط كود JSON صالحًا، بدون أي تعليقات.",

    // Chart Prompt
    chart_prompt_role: "أنت خبير في تصميم التعليم تنشئ نشاط H5P \"رسم بياني\".",
    chart_prompt_mission: "**مهمتك:**",
    chart_prompt_generate_json: "أنشئ كائن JSON كاملاً وصالحًا لنشاط H5P من نوع رسم بياني.",
    chart_prompt_json_structure_title: "**بنية JSON المتوقعة:**",
    chart_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    chart_prompt_graph_mode: "`graphMode`: اختر نوع الرسم البياني الأنسب، 'pieChart' (دائري) أو 'barChart' (شريطي)، بناءً على السياق، ما لم يُطلب خلاف ذلك.",
    chart_prompt_list_of_types: "`listOfTypes`: مصفوفة من الكائنات، يمثل كل منها نقطة بيانات في الرسم البياني.",
    chart_prompt_value: "`value`: القيمة الرقمية لنقطة البيانات.",
    chart_prompt_color: "`color`: لون نقطة البيانات (رمز ست عشري).",
    chart_prompt_font_color: "`fontColor`: لون نص نقطة البيانات (رمز ست عشري).",
    chart_prompt_text: "`text`: تسمية نقطة البيانات.",
    chart_prompt_figure_definition: "`figureDefinition`: وصف موجز للرسم البياني.",
    chart_prompt_content_rules_title: "**قواعد المحتوى:**",
    chart_prompt_rule1: "1. اختر ألوانًا متباينة لسهولة القراءة.",
    chart_prompt_rule2: "2. يجب أن تكون التسميات قصيرة وواضحة.",
    chart_prompt_rule3: "3. إذا كانت إحدى القيم منخفضة جدًا مقارنة بالقيم الأخرى، ففضل 'barChart' لتصور أفضل.",
    chart_prompt_example_json_title: "**مثال JSON:**",
    chart_prompt_generate_only_json: "أنشئ فقط كود JSON صالحًا، بدون أي تعليقات.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "السابق",
    quiz_next_button: "التالي",
    quiz_finish_button: "إنهاء",
    quiz_submit_button: "إرسال",
    quiz_textual_progress: "سؤال @current من @total",
    quiz_no_result_message: "اكتمل",
    quiz_result_message: "نتائجك:",
    quiz_score_bar_label: "لقد حصلت على @finals من @totals نقطة",
    quiz_solution_button_text: "عرض الحل",
    quiz_retry_button_text: "إعادة المحاولة",
    quiz_finish_button_text: "إنهاء",
    quiz_submit_button_text: "إرسال",
    quiz_feedback_available: "تقييم متاح",
    quiz_read_feedback: "قراءة التقييم",
    quiz_wrong_answer: "إجابة خاطئة",
    quiz_correct_answer: "إجابة صحيحة",
    quiz_should_check: "كان يجب تحديد هذا الخيار",
    quiz_should_not_check: "لم يكن يجب تحديد هذا الخيار",
    quiz_no_input: "يرجى الإجابة قبل عرض الحل.",
    quiz_a11y_check: "تحقق من الإجابات. سيتم تمييز الإجابات بأنها صحيحة أو غير صحيحة أو لم تتم الإجابة عليها.",
    quiz_a11y_show_solution: "إظهار الحل. سيتم تمييز المهمة بالحل الصحيح.",
    quiz_a11y_retry: "إعادة محاولة المهمة. إعادة تعيين جميع الإجابات والبدء من جديد.",

    // Albert generation
    generate_with_albert: "إنشاء بواسطة Albert",
    generation_in_progress: "قيد الإنشاء، يرجى الانتظار...",
    request_sent_to_ia: "تم إرسال الطلب إلى الذكاء الاصطناعي، يرجى الانتظار...",
    generation_successful: "تم إنشاء محتوى H5P بنجاح!",
    generation_failed_empty: "فشل الإنشاء. كانت الاستجابة فارغة.",
    generation_failed_error: "خطأ أثناء الإنشاء: {errorMessage}",

    // Albert models description
    albert_small_summary: "سريع، بسيط، مناسب للتمارين السريعة والمنظمة.",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "قوي، دقيق، مثالي للمهام المعقدة والكتابة.",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "متخصص، دقيق، مصمم للبرمجة والكود.",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "نموذج المصدر:",
    albert_model_parameters: "حجم النموذج:",
    albert_model_parameters_small: "8 مليار معلمة",
    albert_model_parameters_large: "24 مليار معلمة",
    albert_model_parameters_code: "32.5 مليار معلمة",
    language: "لغة",
    tutorial: "تعليمي"
};
