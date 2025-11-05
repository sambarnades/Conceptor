const translations_ar = {
    subtitle: "الإنشاء المُساعَد للموارد والأنشطة في Magistère وÉléa",
    help_button: "مساعدة",
    help_modal_title: "🚀 الدليل الكامل لـ Caramel للمعلمين",
    help_modal_content: `
    <p>مرحبًا بك في <strong>Caramel</strong>! صُمِّم هذا الدليل ليرافقك خطوة بخطوة، حتى إن كنت مبتدئًا. هدفنا هو مساعدتك على إنشاء أنشطة تعليمية تفاعلية بطريقة بسيطة وفعّالة.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> الوصف</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> الاختيار</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> التوليد</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> تنزيل</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> المجتمع</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> فلسفتنا: أنت تظل المتحكّم!</h4>
        <p>مع Caramel، الذكاء الاصطناعي مجرد مساعد، بينما أنت القائد. لديك السيطرة في كل مرحلة:</p>
        <ul>
            <li><strong>قبلًا:</strong> أنت تحدّد الإطار التربوي بملء حقول الوصف.</li>
            <li><strong>أثناء:</strong> بعد أن تُولِّد الذكاء الاصطناعي المحتوى (كود JSON)، يمكنك تعديله مباشرة في المحرّر لضبطه.</li>
            <li><strong>بعدًا:</strong> حتى بعد تنزيل الملف، يمكنك دائمًا فتحه وتعديله في أدوات أخرى إذا لزم الأمر.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> وصف احتياجك: نقطة البداية</h4>
        <p>هنا يبدأ كل شيء. كلما كان وصفك أوضح، كانت النتيجة أدق. لديك خياران:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">الوضع السريع</span></h5>
            <p>مثالي للتركيز على الأساسيات. املأ الحقلين:</p>
            <ul>
                <li><strong>من أنت؟</strong> كن مباشرًا. لا حاجة لجملة كاملة. أمثلة: <em>معلّم رياضيات</em>، <em>مدرّب أكاديمي</em>.</li>
                <li><strong>ما الذي تريد تناوله؟</strong> هذا هو جوهر طلبك. كن شاملًا قدر الإمكان. لا تتردد في تضمين الموضوع، المستوى، والقيود. مثال: <em>مقدّمة عن الكسور لطلاب الصف السادس، مع أمثلة ملموسة مثل مشاركة قالب حلوى.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">"الوضع المتقدم"</span></h5>
            <p>لطلب أكثر تنظيمًا، يقدّم هذا الوضع حقولًا دقيقة:</p>
            <ul>
                <li><strong>التخصّص، الموضوع، المستوى:</strong> لتحديد السياق.</li>
                <li><strong>عدد العناصر:</strong> مهم جدًا! يمثّل عدد الأسئلة، أو التواريخ على خط الزمن، أو الكلمات في المسرد، إلخ.</li>
                <li><strong>معلومات إضافية:</strong> مساحة لإضافة تعليمات خاصة أو قيود أو أي تفاصيل ذات صلة.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> تفعيل قراءة المستند</span><br>
            يتيح لك هذا الخيار القوي الاعتماد في التوليد على محتوى توفّره أنت. يمكنك إما <strong>نسخ/لصق نص</strong> أو <strong>رفع ملف PDF</strong>.
            <br><strong><i class="fas fa-lock"></i> الخصوصية:</strong> لا تقلق، تتم معالجة مستندك <strong>محليًا بالكامل على جهازك</strong>. لا تُرسل أي بيانات إلى الإنترنت.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> اختيار نوع النشاط</h4>
        <p>بعد إتمام الوصف، تصبح بلاطات الأنشطة متاحة. انقر على ما يناسب هدفك التربوي.</p>
        <details>
            <summary><strong>انقر هنا لمشاهدة تفاصيل الأنشطة المتاحة</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>أنشطة تفاعلية بصيغة H5P. الأنشطة المعلَّمة بنجمة <span class="feedback-star">*</span> تدمج تلقائيًا تعليقات تفصيلية على 6 شرائح من الدرجات.</p>
            <ul>
                <li><strong>خط زمني:</strong> أنشئ خطًا زمنيًا تفاعليًا لعرض تسلسل أحداث.</li>
                <li><strong>بطاقات ذاكرة:</strong> أنشئ بطاقات وجوه/ظهور للمذاكرة.</li>
                <li><strong>اختبار (Question Set) <span class="feedback-star">*</span>:</strong> أنشئ مجموعة أسئلة متنوعة (اختيار من متعدد، سحب وإفلات، ...).</li>
                <li><strong>مسرد:</strong> أنشئ مسردًا أو أسئلة شائعة على شكل أكورديون.</li>
                <li><strong>كلمات متقاطعة <span class="feedback-star">*</span>:</strong> أنشئ شبكة كلمات متقاطعة من تعريفات.</li>
                <li><strong>كتابة <span class="feedback-star">*</span>:</strong> اقترح موضوع كتابة مع تصحيح تلقائي بالكلمات المفتاحية.</li>
                <li><strong>ملخّص <span class="feedback-star">*</span>:</strong> يعيد المتعلمون بناء ملخص صحيح باختيار الجمل المناسبة.</li>
                <li><strong>اسحب الكلمات <span class="feedback-star">*</span>:</strong> أنشئ نصًا يجرّ فيه المتعلمون الكلمات الناقصة.</li>
                <li><strong>نص بفراغات <span class="feedback-star">*</span>:</strong> يملأ المتعلمون الكلمات الناقصة عبر لوحة المفاتيح.</li>
                <li><strong>تظليل الكلمات <span class="feedback-star">*</span>:</strong> اطلب من المتعلمين تظليل كلمات محدّدة.</li>
                <li><strong>صح/خطأ:</strong> أسئلة بسيطة بإجابة ثنائية.</li>
                <li><strong>اختيار متعدد <span class="feedback-star">*</span>:</strong> أنشئ أسئلة باختيارات متعددة ذات إجابة/إجابات صحيحة.</li>
                <li><strong>كلمات مبعثرة:</strong> أنشئ شبكة حروف للعثور على كلمات.</li>
                <li><strong>ترتيب الفقرات <span class="feedback-star">*</span>:</strong> يعيد المتعلمون الفقرات إلى ترتيبها الصحيح.</li>
                <li><strong>سلسلة اختيارات أحادية <span class="feedback-star">*</span>:</strong> سلسلة أسئلة بإجابة صحيحة واحدة لكل سؤال.</li>
                <li><strong>بطاقات حوار:</strong> بطاقات تفاعلية وجوه/ظهور مع نص وصوت.</li>
                <li><strong>نص بفراغات متقدّم <span class="feedback-star">*</span>:</strong> نص متقدّم مع تعليقات محددة لكل خطأ.</li>
                <li><strong>مخطط:</strong> أنشئ مخططًا دائريًا أو أعمدة لعرض البيانات.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>اختبار (XML / GIFT):</strong> يولّد بنك أسئلة متنوعة (اختيار من متعدد، مطابقة، إلخ) للاستيراد في اختبار Moodle.</li>
                <li><strong>اختيار من متعدد (MBZ):</strong> ينشئ نشاط اختيار من متعدد بسيطًا وسريعًا.</li>
                <li><strong>مطابقة (MBZ):</strong> لعبة ربط أزواج من العناصر.</li>
                <li><strong>المليونير (MBZ):</strong> لعبة اختبار ممتعة تزداد صعوبتها مع كل سؤال.</li>
                <li><strong>مسرد (XML):</strong> يوفّر ملفًا لاستيراد قائمة تعريفات إلى مسرد Moodle.</li>
                <li><strong>صفحة (MBZ / HTML):</strong> يبني صفحة درس منظمة ومهيأة بصريًا لـ Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> توليد المحتوى وتحسينه</h4>
        <p>بعد النقر على بلاطة، تُفتح نافذة. هنا تتفاعل مع الذكاء الاصطناعي.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> الخيار أ: توليد بنقرة واحدة</h5>
            <p>طريق سريع. انقر زر <button class="help-btn-example-llm">توليد بنقرة واحدة</button> ليُنتج الذكاء الاصطناعي المحتوى ويضعه مباشرة في منطقة النتائج على اليمين. يمكنك اختيار نماذج ذكاء اصطناعي مختلفة (سريع، قوي...) عبر السهم الصغير يمين الزر.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> الخيار ب: استخدام ذكاء اصطناعي خارجي</h5>
            <p>لتحكّم أقصى. يظهر الـ prompt (تعليمات الذكاء الاصطناعي) على اليسار.</p>
            <ol>
                <li>عدّل الـ prompt إن رغبت.</li>
                <li>استخدموا زر <strong>نسخ الموجه</strong> وافتحوا أداة ذكاء اصطناعي موجهة للجمهور العام من اختياركم في علامة تبويب جديدة.</li>
                <li>ألصق الـ prompt في الذكاء الاصطناعي، ثم انسخ استجابته وألصقها في منطقة النتائج على اليمين داخل Caramel.</li>
            </ol>
            <p>توجد أيقونات مفيدة لمساعدتك: <span class="help-badge-icon"><i class="fas fa-expand"></i> ملء الشاشة</span> لمزيد من الراحة، و<span class="help-badge-icon"><i class="fas fa-lock"></i> قفل</span> لحماية الـ prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> تنزيل نشاطك ودمجه</h4>
        <p>بعد أن يصبح المحتوى جاهزًا، انقر زر التنزيل (مثل: <button class="help-btn-example-download">إنشاء H5P</button>). هكذا تدمج الملفات في Éléa/Moodle:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (أنشطة H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>طريقة بسيطة:</strong> فعّل وضع التحرير في مقررك، ثم اسحب وأفلِت ملف .h5p مباشرة في القسم المطلوب. مثالي للاستخدام السريع بلا مشاركة معقّدة.</li>
                        <li><strong>الطريقة المُوصى بها (للمصممين):</strong> انقر "إضافة نشاط أو مورد"، واختر "محتوى تفاعلي (H5P)"، ثم في حقل "ملف"، ارفع ملف .h5p. تضمن هذه الطريقة تضمين النشاط جيدًا عند مشاركة مسارك.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (صفحة، مليونير، مطابقة، اختيار متعدد)</summary>
                <div class="import-content">
                    <p>يستورد هذا التنسيق نشاطًا كاملًا إلى مقررك.</p>
                    <ol>
                        <li>في المقرر، اذهب إلى قائمة التحرير (ترس)، وانقر "استعادة".</li>
                        <li>اسحب وأفلِت ملف .mbz في منطقة الاستيراد.</li>
                        <li>اتبع الخطوات بالنقر على "متابعة". سيُضاف النشاط إلى مقررك.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> و<span class="help-badge-file">GIFT</span> (نشاط اختبار)</summary>
                <div class="import-content">
                    <p>تُدخل هذه التنسيقات أسئلة إلى "بنك الأسئلة".</p>
                    <ol>
                        <li>اذهب إلى قائمة "المزيد" في المقرر، ثم "بنك الأسئلة".</li>
                        <li>انقر تبويب "استيراد".</li>
                        <li>اختر تنسيق "Moodle XML" أو "GIFT".</li>
                        <li>اسحب ملفك إلى منطقة "استيراد" وأكد.</li>
                        <li>تصبح أسئلتك الآن في البنك، جاهزة للإضافة إلى نشاط "اختبار".</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (بديل لنشاط صفحة)</summary>
                <div class="import-content">
                    <p>لتحكّم يدوي بالمحتوى.</p>
                    <ol>
                        <li>افتح ملف .html بمحرر نص (مثل: المفكرة) وانسخ كامل المحتوى.</li>
                        <li>في Éléa، أضف نشاط "صفحة".</li>
                        <li>في محرّر نص الصفحة، انقر الأيقونة للتبديل إلى وضع HTML (غالبًا ممثّلة بـ \`</\>\`).</li>
                        <li>ألصق المحتوى الذي نسخته، ثم احفظ.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> المجتمع والدعم</h4>
        <p>Caramel مشروع حيّ، ورأيك قيّم!</p>
        <ul>
            <li><strong>النقاش وطرح الأسئلة:</strong> انضم إلينا على غرفة <a href="https://tchap.beta.gouv.fr/#/room/#Caramel:agent.dinum.tchap.gouv.fr" target="_blank" rel="noopener noreferrer">Tchap</a> للتبادل مع المجتمع.</li>
            <li><strong>الإبلاغ عن عطل:</strong> هل هناك مشكلة؟ أنشئ <a href="https://github.com/g-rem/caramel/issues" target="_blank" rel="noopener noreferrer">تذكرة</a>. إن أمكن، أرفق ملف JSON الذي سبّب الخطأ، فهذا يساعدنا كثيرًا على إصلاحه.</li>
            <li><strong>دعم المشروع:</strong> إذا أعجبك الأدوات، اترك لنا نجمة صغيرة على <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">صفحة Forge</a>. هذه أفضل مكافأة لنا!</li>
        </ul>
    </div>
    `,
    fast_mode: "الوضع السريع",
    guided_mode: "الوضع المتقدم",
    who_are_you: "من أنت؟ (مثال: معلّم، مدرّب...)",
    what_to_address: "ما الذي ترغب في معالجته؟ (مثال: طبيعة الزاوية في الصف السادس...)",
    discipline: "المادة (مثال: التاريخ)",
    theme: "الموضوع (مثال: الثورة الفرنسية)",
    level: "المستوى (مثال: الصف المهني الثاني)",
    number_of_elements: "عدد العناصر (مثال: 10)",
    additional_info: "معلومات إضافية...",
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
    timeline_prompt_rule1_text: "-   `text`: وصف للنص. استخدم `*كلمة*` للغامق، `**كلمة**` للمائل، و`\\n` لأسطر جديدة.",
    timeline_prompt_rule1_asset: "-   `asset`: كائن اختياري لصورة توضّح الحدث.",
    timeline_prompt_rule1_tag: "- `tag`: كلمة رئيسية تميز الفترة (مثال: 'تاريخ', 'علوم').",
    timeline_prompt_rule2: "2. لكل `asset`، ابحث بنشاط عن صورة ذات صلة وخالية من الحقوق (مثل Wikimedia Commons). يجب أن يكون الرابط في `media` مباشرًا وصالحًا. اذكر المصدر والترخيص في `credit`. إذا لم يتم العثور على صورة مناسبة، فاحذف كائن `asset` بالكامل.",
    timeline_prompt_rule3: "3. لكل فترة (`era`)، أضف حقل `text` مع وصف موجز و `tag`.",
    timeline_prompt_example_json_title: "**مثال على بنية JSON:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "عنوان الخط الزمني",
"text": "مقدمة حول موضوع الخط الزمني.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "بداية الحرب العالمية الأولى",
"text": "النمسا-المجر تعلن الحرب على صربيا.",
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
"text": "توقيع الهدنة في ريتوند، التي أنهت القتال.",
"tag": "معاهدة"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "الحرب العالمية الأولى",
"text": "إنها فترة الحرب العظمى.",
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
    crossword_prompt_clue: "`clue`: التعريف المقابل. يُحظر كتابة الكلمة المطلوب إيجادها داخل التلميح.",
    crossword_prompt_extra_clue_optional: "`extraClue` (اختياري): كائن يحتوي على تلميحًا إضافيًا. يمكن لنص التلميح استخدام `*كلمة*` للغامق، `**كلمة**` للمائل و`\\n` لأسطر جديدة. على الذكاء الاصطناعي أن يقيّم مدى جدوى إضافة تلميح.",
    crossword_prompt_task_description: "`taskDescription`: توجيه واضح ومؤطَّر سياقيًا. استخدم `*كلمة*` للغامق، `**كلمة**` للمائل و`\\n` لأسطر جديدة. بعد سطر جديد، وضّح قاعدة الكلمات المركبة: \"بالنسبة إلى الكلمات المركبة، اكتبها كلمةً واحدة بلا مسافات أو شرطات.\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",
    crossword_prompt_content_rules_title: "**قواعد المحتوى:**",
    crossword_prompt_rule1: "1.  قاعِدة صارِمة: يجب أن تتكوّن الكلمات (`answer`) من أحرف فقط. تُدمَج الكلمات المركبة أو الاختصارات أو التعابير في كلمة واحدة من دون مسافات أو شرطات أو رموز أخرى.",
    crossword_prompt_rule2: "2. ينبغي أن تكون التعريفات (`clue`) قصيرة ودقيقة.",
    crossword_prompt_rule3: "3. تُحفَظ بقية بنية JSON (السلوك، السمة، إلخ) كما هي.",
    crossword_prompt_example_json_title: "**مثال JSON لكلمة واحدة:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "كلمات متقاطعة عن علم الأحياء",
"words": [
{
"answer": "خلية",
"clue": "الوحدة الأساسية للحياة.",
"extraClue": {
"params": {
"text": "يمكن أن تكون *حيوانية* أو *نباتية*."
}
}
},
{
"answer": "دنا",
"clue": "جزيء يحمل المعلومات الوراثية."
}
],
"taskDescription": "*أكمِل* **شبكة** الكلمات المتقاطعة."
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
    essay_prompt_task_description: "`taskDescription`: تعليمات واضحة تدعو المتعلّم إلى كتابة نص حول الموضوع. استخدم `*word*` للنص العريض، `**word**` للنص المائل، و `\\n` للفواصل السطرية.",
    essay_prompt_keywords_array: "`keywords`: مصفوفة من ${nombreQuestions} كائنات، يحدّد كلٌّ منها كلمة مفتاحية يجب أن يعثر عليها النظام في إجابة المتعلّم.",
    essay_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",
    essay_prompt_content_rules_title: "**قواعد المحتوى:**",
    essay_prompt_rule1: "1. يحتوي كل كائن في `keywords` على المفتاح `keyword` مع الكلمة المطلوب البحث عنها.",
    essay_prompt_rule2: "2. يجب أن تكون الكلمات المفتاحية ذات صلة وأساسية لتقييم الفهم.",
    essay_prompt_rule3: "3. تُحفَظ بنية JSON (السلوك، إلخ).",
    essay_prompt_rule4: "4. يجب أن تشجع التعليمات (`taskDescription`) على الكتابة دون استخدام الكلمات المفتاحية المدرجة في `keywords`، باستثناء اسم الموضوع إذا كان ذلك ضروريًا للفهم.",
    essay_prompt_example_json_title: "**مثال JSON لكلمة مفتاحية:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "اكتب نصًا قصيرًا يشرح عملية البناء الضوئي.",
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

    // موجّه Moodle XML
    moodle_xml_prompt_role: "أنت خبير في الهندسة البيداغوجية. مهمتك هي إنشاء محتوى لنشاط اختبار مع بنك أسئلة Moodle/Éléa عبر توليد كائن JSON صالح.",
    moodle_xml_prompt_intro: "أرغب في إنشاء اختبار من ${nombreQuestions} أسئلة.",
    moodle_xml_prompt_content_title: "**قواعد المحتوى:**",
    moodle_xml_prompt_content_rule1: "- يجب أن تكون الإجابات الخاطئة معقولة لكنها غير صحيحة.",
    moodle_xml_prompt_content_rule2: "- يجب تنويع صعوبة الأسئلة.",
    moodle_xml_prompt_content_rule3: "- ينبغي أن تكون الصياغة بسيطة ودقيقة.",
    moodle_xml_prompt_content_rule4: "- يجب أن تشرح التغذية الراجعة بإيجاز الإجابة الصحيحة.",
    moodle_xml_prompt_question_types_intro: "**البنية المتوقعة لـ JSON:**\nيجب أن يحتوي الكائن الرئيسي على المفاتيح التالية:\n- `bank_name`: اسم قصير ووصفي لبنك الأسئلة.\n- `bank_description`: جملة تصف محتوى البنك.\n- `questions`: مصفوفة من الكائنات حيث يمثل كل كائن سؤالًا ويجب أن يحتوي على `type` و`content`.",
    moodle_xml_prompt_question_type_multichoice: `
- **لنمط \`multichoice\` (اختيار من متعدد):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "عنوان السؤال",
      "questiontext": "نص السؤال.",
      "feedback": "تغذية راجعة عامة.",
      "answers": [
        { "text": "إجابة 1", "fraction": 100, "feedback": "تغذية راجعة إذا تم اختيارها." },
        { "text": "إجابة 2", "fraction": 0, "feedback": "تغذية راجعة إذا تم اختيارها." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **لنمط \`matching\` (مطابقة):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "عنوان السؤال",
      "questiontext": "نص السؤال.",
      "feedback": "تغذية راجعة عامة.",
      "subquestions": [
        { "text": "نص السؤال 1", "answer": "إجابة 1" },
        { "text": "نص السؤال 2", "answer": "إجابة 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **لنمط \`numerical\` (عددي):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "عنوان السؤال",
      "questiontext": "نص السؤال.",
      "feedback": "تغذية راجعة عامة.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "تغذية راجعة للإجابة." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **لنمط \`truefalse\` (صح/خطأ):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "عنوان السؤال",
      "questiontext": "نص السؤال.",
      "feedback": "تغذية راجعة عامة.",
      "answer": { "value": true, "feedback_true": "تغذية راجعة إذا كان صحيحًا.", "feedback_false": "تغذية راجعة إذا كان خاطئًا." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **لنمط \`shortanswer\` (إجابة قصيرة):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "عنوان السؤال",
      "questiontext": "نص السؤال.",
      "feedback": "تغذية راجعة عامة.",
      "answers": [
        { "text": "إجابة صحيحة 1", "fraction": 100, "feedback": "تغذية راجعة إذا تم اختيارها." },
        { "text": "إجابة بديلة", "fraction": 100, "feedback": "تغذية راجعة إذا تم اختيارها." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **لنمط \`cloze\` (نص بفراغات):**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "عنوان السؤال",
      "questiontext": "هذا نص يتضمن فراغًا {1:SHORTANSWER:=إجابة صحيحة~تعليق} وآخر {1:MULTICHOICE:=إجابة صحيحة~إجابة خاطئة}.",
      "feedback": "تغذية راجعة عامة."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**تعليمات نهائية:**",
    moodle_xml_prompt_form_rule1: "وزّع الأسئلة بالتساوي بين الأنماط المختلفة.",
    moodle_xml_prompt_generate_only_json: "ولّد فقط كود JSON صالحًا، دون أي تعليق. يجب أن يكون الناتج كائن JSON واحدًا يحتوي على المفتاح `questions`.",

    // إنشاء اختبار Éléa
    moodle_xml_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
    test_error_creation_mbz: "حدث خطأ أثناء إنشاء ملف MBZ للاختبار:",
    test_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
    test_error_generic: "خطأ:",
    test_backup_log: "تم إنشاء نسخة احتياطية تلقائيًا بواسطة Caramel\n",

    // GIFT Prompt
    gift_prompt_role: "أنت خبير في هندسة التعلّم تنشئ بنك أسئلة لنشاط اختبار على Moodle/Éléa بصيغة GIFT.",
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
    flashcards_prompt_role: "أنت خبير في التصميم التربوي تقوم بإنشاء نشاط H5P من نوع 'بطاقات تعليمية'.",
    flashcards_prompt_mission: "**مهمتك:**",
    flashcards_prompt_generate_json: "أنشئ كائن JSON كامل وصالح لنشاط H5P من نوع Flashcards. يجب أن يكون JSON قابلاً للاستخدام مباشرة.",
    flashcards_prompt_json_structure_title: "**هيكل JSON المتوقع:**",
    flashcards_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على:",
    flashcards_prompt_title: "`title`: عنوان مناسب للنشاط.",
    flashcards_prompt_description: "`description`: تعليمات واضحة للطالب.",
    flashcards_prompt_association_principle: "يجب أن يكون الوجه الأمامي والخلفي مرتبطين بمعيار واحد وثابت (مثل: تعريف→مصطلح، شكل→عدد الأضلاع، حدث→تاريخ، مؤلف→عمل). استخدم نفس العلاقة لجميع البطاقات وصغ التعليمات على النحو التالي: «اربط كل X بـ Y». الإجابات (`answer`) يجب أن تكون موحدة: كلمة واحدة بسيطة أو رقم، بأحرف صغيرة، بدون أدوات تعريف أو علامات ترقيم؛ الأرقام بالأرقام.",
    flashcards_prompt_cards_array: "`cards`: مصفوفة تحتوي على ${nombreQuestions} من الكائنات، يمثل كل كائن بطاقة ويحتوي على:",
    flashcards_prompt_text: "`text`: السؤال أو المصطلح المراد تخمينه (الوجه الأمامي).",
    flashcards_prompt_answer: "`answer`: الإجابة أو التعريف (الوجه الخلفي). ملاحظة مهمة: يجب أن تحتوي الإجابة على كلمة بسيطة واحدة أو رقم فقط، بدون كلمات مركبة أو منفصلة.",
    flashcards_prompt_tip: "`tip` (اختياري): تلميح لمساعدة الطالب إذا كان السؤال صعبًا. أضف تلميحًا فقط إذا كان ذلك مناسبًا.",
    flashcards_prompt_tip_formatting: "في التلميحات (`tip`)، يمكنك استخدام `*كلمة*` لتكون بالخط العريض و`**كلمة**` للمائل لتأكيد المعلومات المهمة.",
    flashcards_prompt_example_json_title: "**مثال على JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "عواصم أوروبا",
"description": "احفظ عاصمة كل بلد. انقر على البطاقة لرؤية الإجابة.",
"cards": [
{
"text": "عاصمة فرنسا",
"answer": "باريس"
},
{
"text": "عاصمة هولندا",
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
            "question": "هل فرنسا دولة؟",
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
            "question": "ما هي عاصمة فرنسا؟",
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
            "questions": ["باريس هي *عاصمة* فرنسا."],
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
            "taskDescription": "ما هي عاصمة فرنسا؟",
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
    glossary_prompt_content: "`text`: التعريف. استخدم `*كلمة*` للغامق، `**كلمة**` للمائل و`\\n` لأسطر جديدة.",
    glossary_prompt_content_rules_title: "**قواعد المحتوى:**",
    glossary_prompt_rule1: "1. يجب أن تكون التعريفات واضحة وموجزة ومناسبة لمستوى المتعلمين.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**مثال JSON لمدخل واحد:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "البناء الضوئي",
"text": "عملية تقوم من خلالها النباتات الخضراء بتحويل ضوء الشمس إلى طاقة."
},
{
"title": "خلية",
"text": "الوحدة الأساسية لجميع الكائنات الحية."
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
    summary_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",
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
    drag_word_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",

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
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"يتكون النظام الشمسي من *ثماني* كواكب. أكبرها هو *المشتري*.",
"عاصمة فرنسا هي *باريس/مدينة النور*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط دون تعليقات.",
    blanks_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",

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
    mark_words_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",
    mark_words_prompt_content_rules_title: "**قواعد المحتوى:**",
    mark_words_prompt_rule1: "1. اكتب فقرة ذات صلة بالموضوع.",
    mark_words_prompt_rule2: "2. حدّد نحو ${nombreQuestions} كلمات مفتاحية مهمّة للتعليم.",
    mark_words_prompt_rule3: "3.  يجب أن تكون كل كلمة مراد تحديدها محاطة بنجمة بشكل فردي. على سبيل المثال، `*كلمة1* *كلمة2*` صحيح، لكن `*كلمة1 كلمة2*` غير صحيح.",
    mark_words_prompt_rule4: "4.  يجب ألا تكون الفواصل العليا أو علامات الترقيم الأخرى ملتصقة بالكلمات المحددة. على سبيل المثال، `ل'*الطائر*` غير صحيح؛ يجب أن تكتب `ال *طائر*` لكي تعمل.",
    mark_words_prompt_example_json_title: "**مثال JSON:**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "انقر على الكلمات المهمة في النص.",
"textField": "*النظام* *الشمسي* مكوّن من *ثماني* كواكب تدور حول *الشمس*."
}
\`\`\` `,
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

   // Millionnaire Creation
    millionnaire_error_compression_libs: "لم يتم تحميل مكتبات الضغط (Tar.js أو fflate). يرجى التحقق من اتصال الإنترنت أو تحديث الصفحة.",
    millionnaire_error_invalid_json: "بنية JSON غير صالحة. تأكد من أنها تحتوي على 'title' ومصفوفة 'questions' تتضمن 6 أسئلة مطابقة للمثال.",
    millionnaire_activity_intro: "شارك في هذه اللعبة لاختبار معلوماتك.",
    millionnaire_backup_log: "تم إنشاء نسخة احتياطية تلقائيًا بواسطة Caramel\n",
    millionnaire_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
    millionnaire_error_creation_mbz: "حدث خطأ أثناء إنشاء ملف MBZ:",
    millionnaire_error_generic: "خطأ:",
 
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
    millionnaire_prompt_example: `\`\`\`json
{
"title": "اختبار حول الثورة الفرنسية",
"questions": [
{
"question": "ما هي عاصمة فرنسا؟",
"goodanswer": "باريس",
"badanswer": ["برلين", "لندن", "مدريد"]
}
]
}
\`\`\` `,
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
    appariement_prompt_example: `\`\`\`json
{
"title": "مطابقة حول الثورة الفرنسية",
"pairs": [
{
"question": "اقتحام سجن الباستيل",
"answer": "14 يوليو 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "أنشئ فقط كائن JSON صالحًا، دون أي تعليق.",
 
    // إنشاء المطابقة
   appariement_error_invalid_json: "بنية JSON غير صالحة. تأكد من أنها تحتوي على 'title' ومصفوفة 'pairs' حيث يحتوي كل زوج على 'question' و 'answer'.",
   appariement_activity_intro: "اعثر على الأزواج المطابقة.",
   appariement_success_generation: "تم إنشاء الملف {fileName} بنجاح !",
   appariement_error_creation_mbz: "خطأ أثناء إنشاء MBZ للمطابقة:",

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
    qcm_prompt_example: `\`\`\`json
{
"title": "اختبار متعدد الاختيارات حول الثورة الفرنسية",
"questions": [
{
"text": "ما هو تاريخ اقتحام سجن الباستيل؟",
"answers": [
{ "text": "14 يوليو 1789", "iscorrect": 1 },
{ "text": "4 أغسطس 1789", "iscorrect": 0 },
{ "text": "26 أغسطس 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "أنشئ فقط كائن JSON صالحًا، دون أي تعليق.",

    // إنشاء اختبار اختيارات متعددة
    qcm_error_invalid_json: "بنية JSON غير صالحة. تأكد من أنها تحتوي على 'title' ومصفوفة 'questions' تضم سؤالًا واحدًا على الأقل وإجابات.",
    qcm_activity_intro: "أجب عن الأسئلة التالية.",
    qcm_success_generation: "تم إنشاء الملف {fileName} بنجاح !",
    qcm_error_creation_mbz: "خطأ أثناء إنشاء MBZ لاختبار الاختيارات المتعددة:",

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
    moodle_xml_name: "اختبار",
    moodle_xml_description: "أنشئ بنك أسئلة للاستيراد مباشرة في نشاط اختبار (بصيغة xml أو gift)",
    moodle_xml_help: "لإضافة ملف XML إلى نشاط «اختبار» على Moodle، ابدأ بإنشاء النشاط. بعد ذلك، افتح قائمة <strong>المزيد</strong> واذهب إلى <strong>بنك الأسئلة</strong>. في هذه القائمة، انقر على <strong>استيراد</strong>، واختر تنسيق <strong>Moodle XML</strong>، ثم حدد ملفك وقم بالتأكيد.",
    moodle_gift_name: "تنسيق GIFT",
    moodle_gift_description: "أنشئ أسئلة بتنسيق GIFT، وهو وسيلة بسيطة لاستيراد الأسئلة إلى Moodle.",
    moodle_millionnaire_name: "من سيربح المليون؟",
    moodle_millionnaire_description: "إنشاء نشاط فريد 'من سيربح المليون؟' من 6 أسئلة متدرجة في الصعوبة.",
    moodle_appariement_name: "المطابقة",
    moodle_appariement_description: "أنشئ نشاط مطابقة مكوّنًا من 10 أسئلة.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "إنشاء نشاط MCQ بسيط.",

    moodle_glossaire_xml_name: "مسرد (XML)",
    moodle_glossaire_xml_description: "قم بإنشاء مسرد جاهز للاستيراد بتنسيق XML.",

    elea_page_name: "صفحة",
    elea_page_description: "إنشاء صفحة محتوى Éléa مُنسّقة بصريًا.",

    // Dynamic content
    prompt_for_ia: "مطلب للذكاء الاصطناعي",
    copy_prompt: " نسخ المطلب",
    fullscreen_prompt: "ملء الشاشة",
    exit_fullscreen_prompt: "الخروج من ملء الشاشة",
    lock_prompt: "قفل البرومبت",
    unlock_prompt: "إلغاء قفل البرومبت",
    go_duck: "الانتقال إلى Duck.ai",
    go_mistral: "الانتقال إلى Le Chat",
    create_h5p_file: "إنشاء ملف H5P",
    integrate_h5p_libraries: "دمج مكتبات H5P:",
    paste_ia_result: "الصق نتيجة الذكاء الاصطناعي في المنطقة أدناه لإنشاء وحدتك.",
    generate_h5p: "توليد H5P",
    create_xml_file: "إنشاء ملف XML",
    paste_ia_result_xml: "الصق هنا ملف XML المُولَّد بواسطة الذكاء الاصطناعي.",
    generate_xml_file: "توليد ملف XML",
    export_mbz: "تنسيق MBZ",
    export_gift: "تنسيق GIFT",
    export_xml: "تنسيق XML",
    export_html: "تنسيق HTML",

    create_mbz_file_appariement: "أنشئ ملف المطابقة (.mbz)",
    paste_ia_result_appariement: "ألصق أدناه JSON الذي أنشأته الذكاء الاصطناعي. سيتم استخراج عنوان النشاط تلقائيًا من JSON.",
    generate_mbz_appariement: "أنشئ نشاط المطابقة (mbz)",
    create_mbz_file_millionnaire: "أنشئ ملف المليونير (.mbz)",
    paste_ia_result_millionnaire: "ألصق أدناه JSON الذي أنشأته الذكاء الاصطناعي. سيتم استخراج عنوان النشاط تلقائيًا من JSON.",
    generate_mbz_millionnaire: "أنشئ نشاط المليونير (mbz)",
    generate_mbz_test: "إنشاء نشاط الاختبار (mbz)",

    create_mbz_file_qcm: "إنشاء ملف MCQ (.mbz)",
    paste_ia_result_qcm: "ألصق أدناه JSON الذي أنشأته الذكاء الاصطناعي. سيتم استخراج عنوان النشاط تلقائيًا من JSON.",
    generate_mbz_qcm: "إنشاء نشاط MCQ (mbz)",

    create_mbz_file_page: "إنشاء ملف صفحة (.mbz)",
    paste_ia_result_page: "الصق JSON المُولَّد بواسطة الذكاء الاصطناعي أدناه لبناء الصفحة.",
    generate_mbz_page: "توليد نشاط صفحة (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "سيظهر Moodle XML هنا...",
    paste_xml_placeholder: "الصق هنا ملف XML الكامل الذي ولّده الذكاء الاصطناعي...",

    // H5P champs textes vides
    generate_prompts_placeholder: "سيظهر موجّه الذكاء الاصطناعي هنا بمجرد أن تُكمِل حقلاً واحدًا على الأقل في الوضع السريع أو الوضع المتقدم.",
    paste_json_or_text: "الصِق هنا محتوى JSON أو النص الذي أنشأه الذكاء الاصطناعي لإنشاء نشاطك.",
    info_prompt_copy: "لا تُلصق هذا الطلب في اللوحة اليمنى. انسخه في ذكاء اصطناعي خارجي للحصول على النتيجة، ثم ألصق هذه النتيجة في اللوحة اليمنى.",

    // Notifications
    prompts_generated_successfully: "تم توليد المطالبات بنجاح!",
    success_copy: "✓ تم النسخ !",
    error_please_fill_fields: "يرجى ملء حقل واحد على الأقل في الوضع السريع.",
    error_please_fill_guided_fields: "يرجى ملء حقل واحد على الأقل في الوضع المتقدم.",
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

    // Notifications for JSON content
    error_paste_json_content: "يرجى لصق محتوى JSON الذي تم إنشاؤه.",
    error_paste_xml_content: "يرجى لصق محتوى XML الذي تم إنشاؤه.",

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
    legal_ai_models_title: "نماذج الذكاء الاصطناعي",
    legal_ai_models_content: "يعتمد تطبيق Caramel، فقط أثناء التوليد بنقرة واحدة، على نماذج ذكاء اصطناعي تُشغِّلها ILAAS، وهي اتحاد لبنى تحتية مشتركة للذكاء الاصطناعي. تُوجَّه الطلبات عبر تدفق عمل n8n تستضيفه الحاضنة، ثم تُرسَل إلى ILAAS للتنفيذ على خوادم موثوقة تستضيفها مراكز بيانات معتمدة من قطاع التعليم العالي والبحث (ESR). لا تقوم Caramel بتشغيل النماذج ولا بمعالجة البيانات أو تخزينها ذاتيًا؛ تُستخدم البيانات حصريًا لتنفيذ الطلب ولا تُرسَل إلى أنظمة ذكاء اصطناعي عامة موجهة للمستهلكين. تشمل النماذج المتاحة حاليًا: Mistral Small 3.2 (24B معامل) وLlama 3.3 (70B معامل) وGPT‑OSS 120B (120B معامل). تخضع أي عمليات استضافة أو تسجيل سجلات (Logging) أو احتفاظ بالبيانات تقوم بها ILAAS لسياسة الخصوصية وشروط الخدمة الخاصة بها.",
    legal_user_requests_processing_title: "معالجة طلبات المستخدمين عبر n8n وحاضنة وزارة التربية الوطنية",
    legal_user_requests_processing_content: "يستخدم موقعنا حلاً تقنياً مطوراً بواسطة n8n، وهي أداة مفتوحة المصدر تستضيفها حاضنة وزارة التربية الوطنية. من خلال سير عمل مؤتمت، يحوّل هذا الخدمة طلبات المستخدمين إلى بيانات منظمة (بصيغة JSON) للتفاعل مع ذكاء اصطناعي تابع لـ DINUM، وهو بذلك ذو سيادة. لا يتم كشف أو نقل أي معلومات حساسة بدون تشفير، بما يضمن سرية وأمان التبادلات.",
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
    true_false_prompt_example: `\`\`\`json
{
"question": "أوسلو هي عاصمة النرويج.",
"correct": "true",
"feedbackOnCorrect": "إجابة صحيحة! أوسلو هي بالفعل عاصمة النرويج.",
"feedbackOnWrong": "إجابة خاطئة. عاصمة النرويج هي أوسلو."
}
    \`\`\` `,
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
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",
    multiple_choice_prompt_content_rules_title: "**قواعد المحتوى:**",
    multiple_choice_prompt_rule1: "1.  يجب أن تكون هناك إجابة صحيحة واحدة فقط (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  قدّم عدة إجابات خاطئة (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**مثال JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "ما هو اللون الحقيقي لتوت الكاسيس؟",
"answers": [
{
"correct": true,
"text": "بنفسجي داكن جدًا"
},
{
"correct": false,
"text": "أزرق"
},
{
"correct": false,
"text": "أسود"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
    { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
    { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
    { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
    { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
    { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
]
}
\`\`\` `,
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
    find_the_words_prompt_rule1: "1.  يجب أن تكون `wordList` سلسلة واحدة تتضمن كلمات مفصولة بفواصل. يجب أن تكون كل كلمة بسيطة (دون عبارات متعددة الكلمات). يُمنع استخدام الأرقام، وعلامات الترقيم، والحروف ذات العلامات/اللكنة؛ واكتب بالأحرف اللاتينية الأساسية فقط (مثال: اكتب 'eleve' بدلًا من 'élève').",
    find_the_words_prompt_example_json_title: "**مثال JSON:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "ابحث عن أسماء المدن في الشبكة أدناه",
"wordList": "كانبيرا,مينسك,بكين,أوسلو,باريس,لندن,مدريد,أثينا,طوكيو,موسكو,واشنطن,ستوكهولم"
}
\`\`\` `,
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
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: تعليمات واضحة للنشاط. استخدم `*word*` للنص العريض، `**word**` للنص المائل، و `\\n` للفواصل السطرية.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: مصفوفة من السلاسل النصية، تمثّل كلٌّ منها فقرة للترتيب. يجب أن تكون الفقرات بالترتيب الصحيح. استخدم `*word*` للنص العريض، `**word**` للنص المائل.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",
    sort_the_paragraphs_prompt_content_rules_title: "**قواعد المحتوى:**",
    sort_the_paragraphs_prompt_rule1: "1. يجب أن يُشكّل `paragraphs` تسلسلاً منطقيًا يمكن استنتاجه من المحتوى، دون مؤشرات مصطنعة (أرقام، تواريخ/أوقات، «أولًا/ثم/أخيرًا») إلا إذا طُلِب ذلك صراحةً.",
    sort_the_paragraphs_prompt_rule2: "2. لا قائمة مسطّحة: يجب أن يدفع كلّ سطر الخيط نفسه قُدمًا (سبب→نتيجة، تهيئة→إجراء→نتيجة، عام→خاص) لجعل الترتيب قابلًا للاستدلال.",
    sort_the_paragraphs_prompt_example_json_title: "**مثال JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "روتيني الصباحي:",
"paragraphs": [
  "أملأ الغلاية بالماء العذب.",
  "أشغّلها.",
  "أضع كيسَ شايٍ في الكوب.",
  "أصبّ الماءَ المغليّ فوق الكيس.",
  "أُزيل الكيس عندما تجهز عملية النقع."
]
}
 \`\`\` `, 
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
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (قاعِدة صارِمة) يجب عليك توليد مصفوفة من 6 كائنات للتغذية الراجعة النهائية، مُؤطّرة بموضوع التمرين، مع احترام الفترات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و91-100. يجب أن يكون لكل كائن الشكل `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. يجب أن يكون نص `feedback` إيجابيًا من دون مبالغة، تدريجيًا ودائمًا بصيغة إثبات.",
    single_choice_set_prompt_content_rules_title: "**قواعد المحتوى:**",
    single_choice_set_prompt_rule1: "1. في كل مصفوفة `answers`، تكون الإجابة الأولى هي الصحيحة دائمًا.",
    single_choice_set_prompt_example_json_title: "**مثال JSON:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "تُعرف توت الغوجي أيضًا باسم ...",
"answers": ["توت الذئب", "توت القط", "توت الدب"]
},
{
"question": "توت الغوجي موطنها الأصلي ...",
"answers": ["آسيا", "أفريقيا", "أوروبا"]
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
    { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
    { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
    { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
    { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
    { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
]
}
\`\`\` `,
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
    dialog_cards_prompt_role: "أنت خبير في الهندسة البيداغوجية تنشئ نشاط H5P \"بطاقات الحوار\".",
    dialog_cards_prompt_mission: "**مهمتك:**",
    dialog_cards_prompt_generate_json: "أنشئ كائن JSON يحتوي uniquement على المفاتيح `title` و`description` و`dialogs` لنشاط H5P من نوع بطاقات الحوار.",
    dialog_cards_prompt_json_structure_title: "**بنية JSON المتوقعة:**",
    dialog_cards_prompt_json_structure_main_object: "يجب أن يحتوي الكائن على :",
    dialog_cards_prompt_title: "`title`: عنوان للنشاط. لا تتضمن وسوم HTML.",
    dialog_cards_prompt_description: "`description`: وصف قصير أو توجيه (بتنسيق HTML).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: مصفوفة تضم ${nombreQuestions} كائنًا، يمثل كلٌّ منها بطاقة ويحتوي على :",
    dialog_cards_prompt_text: "`text`: نص وجه البطاقة. لا تتضمن وسوم HTML.",
    dialog_cards_prompt_answer: "`answer`: نص ظهر البطاقة. لا تتضمن وسوم HTML.",
    dialog_cards_prompt_tips: "`tips` (اختياري) : كائن للتلميحات (نص عادي فقط، دون تنسيق). إذا رأيت ذلك مفيدًا تربويًا، أضف تلميحًا للوجه بالمفتاح `front` و/أو للظهر بالمفتاح `back`.",
    dialog_cards_prompt_content_rules_title: "**قواعد المحتوى:**",
    dialog_cards_prompt_rule1: "1.  بالنسبة إلى `text` و`answer`، يمكنك استخدام `*كلمة*` للخط العريض و`**كلمة**` للمائل.",
    dialog_cards_prompt_example_json_title: "**مثال على JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
  "title": "تعلّم أسماء الفواكه بالإنجليزية",
  "description": "تُعرَض أسماء الفواكه بالفرنسية. اقلب البطاقات لرؤية الترجمة الإنجليزية الصحيحة.",
  "dialogs": [
    {
      "title": "استخرج الأفعال الإنجليزية في الزمن الحاضر",
      "description": "انطلاقًا من جملة بالإنجليزية في الماضي البسيط، استخرج الفعل بصيغة المصدر. اقلب البطاقات للتحقق من إجاباتك.",
      "dialogs": [
        {
          "text": "He *visited* his grandmother.",
          "answer": "to *visit*",
          "tips": {
            "front": "حدِّد الفعل في صيغة الماضي.",
            "back": "فكِّر في الصيغة الأساسية (المصدر) للفعل."
          }
        },
        {
          "text": "She *played* soccer.",
          "answer": "to *play*",
          "tips": {
            "front": "ابحث عن الفعل الماضي.",
            "back": "تخيّل الفعل بصيغته القاموسية."
          }
        }
      ]
    }
  ]
}
\`\`\` `,
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
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>ضع الأفعال في الزمن الصحيح. ستحصل على ملاحظات فردية للأخطاء الشائعة.</p>",
"blanksList": [
{
"correctAnswerText": "لا يتحدث",
"incorrectAnswersList": [
{
"incorrectAnswerText": "يتحدث لا",
"incorrectAnswerFeedback": "<div>تذكر أن النفي يكون قبل الفعل في العربية <em>(يتحدث)</em>.</div>"
},
{
"incorrectAnswerText": "لا نتحدث",
"incorrectAnswerFeedback": "<div>لقد نسيت أن الفاعل هو الغائب المفرد <em>(هو)</em>.</div>"
}
]
}
],
"blanksText": "<p>هو يتحدث الإنجليزية لكنه (لا / يتحدث) ___________<strong>&nbsp;</strong>الألمانية.</p>"
},
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "تقييم 0-10%" },
    { "from": 11, "to": 30, "feedback": "تقييم 11-30%" },
    { "from": 31, "to": 50, "feedback": "تقييم 31-50%" },
    { "from": 51, "to": 70, "feedback": "تقييم 51-70%" },
    { "from": 71, "to": 90, "feedback": "تقييم 71-90%" },
    { "from": 91, "to": 100, "feedback": "تقييم 91-100%" }
]
}
\`\`\` `,
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
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "توت أزرق"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "توت العليق"}
],
"figureDefinition": "رسم بياني"
}
\`\`\` `,
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

    // ذكاء Caramel الاصطناعي — التوليد
    generate_with_llm: "إنشاء باستخدام ذكاء Caramel الاصطناعي",
    generation_in_progress: "جاري الإنشاء، يرجى الانتظار...",
    request_sent_to_ia: "تم إرسال الطلب إلى الذكاء الاصطناعي، يرجى الانتظار...",
    generation_successful: "تم إنشاء محتوى H5P بنجاح!",
    generation_failed_empty: "فشل الإنشاء. كانت الاستجابة فارغة.",
    generation_failed_error: "حدث خطأ أثناء الإنشاء: {errorMessage}",
    generation_failed_llm: "فشل الإنشاء عبر ذكاء Caramel الاصطناعي. السبب: {errorMessage}",

    // أوصاف النماذج (ذكاء Caramel الاصطناعي)
    llm_small_summary: "كاراميل طري: سريع، خفيف، مثالي للتمارين السريعة والإجابات دون انتظار. يستهلك قليلاً.",
    llm_small_technical: "Mistral AI",
    llm_large_summary: "كاراميل سائل: أكثر غنىً وتنوعًا في الدقة، مثالي للمهام التي تتطلب بعض العمق. يستهلك أكثر.",
    llm_large_technical: "Meta AI",
    llm_xl_summary: "كاراميل صلب: قوي ومعقد، يُحفظ للمشاريع الطموحة. الصبر مطلوب، النتيجة مضمونة! يستهلك أكثر بكثير.",
    llm_xl_technical: "OpenAI",

    // أسماء ودّية للنماذج (عرض القائمة)
    llm_display_small: "Mistral-Small-3.2",
    llm_display_large: "LLaMa-3.3",
    llm_display_xl: "GPT-OSS",

    // مؤشرات النماذج (ذكاء Caramel الاصطناعي)
    llm_model_source: "مزود النموذج:",
    llm_model_parameters: "حجم النموذج:",
    llm_model_parameters_small: "24 Mrd معاملات",
    llm_model_parameters_large: "70 Mrd معاملات",
    llm_model_parameters_xl: "120 Mrd معاملات",

    language: "لغة",
    tutorial: "تعليمي",
 
    // توجيه مسرد XML
    glossaire_xml_prompt_role: "أنت خبير في التصميم التعليمي وستنشئ محتوى لمسرد.",
    glossaire_xml_prompt_mission: "**مهمتك:** يجب أن تُنشئ كائن JSON بسيطًا يحتوي على قائمة مصطلحات لمسرد. يجب أن يحتوي كل مصطلح على مفهوم وتعريف، وإذا كان مناسبًا، قائمة بأسماء بديلة.",
    glossaire_xml_prompt_structure_title: "**بنية JSON المتوقعة:**",
    glossaire_xml_prompt_structure_rules: `
-   **الجذر:** كائن رئيسي يحتوي على مفتاحين: \`name\` (اسم المسرد) و\`entries\` (مصفوفة كائنات).
-   **يجب أن يحتوي كل كائن في \`entries\` على:**
    -   \`concept\`: الكلمة أو التعبير المراد تعريفه.
    -   \`definition\`: تعريف واضح وموجز. استخدم *mot* للخط العريض، **mot** للمائل و \\n لانتقالات الأسطر، فقط عندما يكون ذلك مناسبًا تربويًا.
    -   \`aliases\` (اختياري): مصفوفة سلاسل نصية للمرادفات أو المصطلحات البديلة. أضِف هذا المفتاح فقط إذا وُجدت أسماء بديلة ذات صلة.`,
    glossaire_xml_prompt_example_title: "**مثال JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "معجم المعلومات",
  "entries": [
    {
      "concept": "صحفي",
      "definition": "شخص **يجمع**، يتحقق وينشر *المعلومات*.",
      "aliases": ["مراسل", "كاتب عمود"]
    },
    {
      "concept": "مصدر",
      "definition": "أصل *المعلومة*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "أنشئ كود JSON صالحًا فقط، دون أي تعليقات.",

    //Barre de menu
    tab_all: "الكل",
    tab_quiz: "اختبارات قصيرة وامتحانات",
    tab_text: "معالجة النصوص",
    tab_memory: "الحفظ والاستكشاف",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 الحصول على الموجه",
    create_file_step: "2/2 إنشاء الملف",
    generate_one_click: "إنشاء بنقرة واحدة",
    simple_mode: "بسيط",
    advanced_mode: "موجَّه",

    // RAG feature
    activate_rag: "تفعيل استشارة المستندات",
    rag_tooltip: "يسمح بلصق نص أو تحميل ملف PDF. سيتم استخدام المحتوى كمصدر رئيسي لإنشاء الأنشطة.",
    rag_title: "إرفاق مستندات (اختياري)",
    rag_note: "إذا كنت تريد أن يعمل الذكاء الاصطناعي حصريًا من مستنداتك، فالصق النص أو أسقط ملفاتك هنا. وإلا، اترك هذه المنطقة فارغة للسماح للذكاء الاصطناعي بالبحث عن المعلومات بنفسه.",
    upload_pdf: "أو قم بتحميل ملف PDF للتحليل",
    pdf_loading: "جاري تحميل PDF...",
    pdf_processing_page: "جاري معالجة الصفحة",
    ocr_recognizing_page: "التعرف الضوئي على الحروف (OCR) للصفحة",
    ocr_success: "تمت معالجة المستند بنجاح.",
    ocr_error: "حدث خطأ أثناء المعالجة.",
    error_invalid_pdf: "يرجى تحديد ملف PDF صالح.",
    error_duplicate_pdf: "تمت إضافة هذا الملف بالفعل.",
    error_fullscreen: "فشل وضع ملء الشاشة:",
    lock_text: "قفل",
    unlock_text: "فتح",
    rag_instruction: "\n\nيجب عليك فقط الرجوع إلى المعلومات التالية لإنشاء المحتوى:",
    drag_drop_text: "اسحب وأفلت ملف PDF هنا",
    or_text: "أو",
    upload_pdf_btn: "اختر ملفًا",
    paste_your_text_here: "انسخ والصق نصك هنا...",
    rag_tags_tuto: "ستجدون أدناه المستندات المرفوعة. انقروا على الدائرة الملوّنة لتخصيص تمييز كل مستند.",

    // خطوات تحضير الكراميل
    caramel_animation_step_1: "نصب السكر في القدر...",
    caramel_animation_step_2: "نضيف قليلًا من الماء...",
    caramel_animation_step_3: "نسخن على نار متوسطة...",
    caramel_animation_step_4: "يبدأ السكر بالذوبان...",
    caramel_animation_step_5: "يبدأ لونه بالتغيّر...",
    caramel_animation_step_6: "نحرّك بلطف...",
    caramel_animation_step_7: "يأخذ الكراميل لونًا كهرمانيًا جميلًا...",
    caramel_animation_step_8: "نضيف الكريمة الساخنة...",
    caramel_animation_step_9: "احذر من تناثر السائل!",
    caramel_animation_step_10: "نخلط جيدًا...",
    caramel_animation_step_11: "يكاد أن يكون جاهزًا!",

    // موجه الصفحة
    page_prompt_role: "أنت خبير في هندسة التعليم تنشئ نشاط صفحة مُنظَّمًا لمنصتَي Éléa/Moodle.",
    page_prompt_mission: "**مهمتك :**",
    page_prompt_generate_json: "ولِّد كائن JSON لبناء صفحة محتوى خاصة بـ Éléa. تستند بنية الصفحة إلى كتل محددة مسبقًا. يجب عليك اختيار أكثر الكتل ملاءمة من القائمة أدناه لتلبية طلب المستخدم.",
    page_prompt_json_structure_title: "**بنية JSON المتوقعة :**",
    page_prompt_json_structure_main_object: "يجب أن يحتوي الكائن الرئيسي على المفتاح \"title\" لعنوان الصفحة، والمفتاح \"intro\" لمقدّمة واضحة ومفهومة للمحتوى الدراسي اللاحق، والمفتاح \"blocks\" وهو مصفوفة من الكائنات. يمثّل كل كائن كتلة محتوى ويجب أن يحتوي على \"type\" يطابق أحد الكتل أدناه، وكائن \"data\" يتضمن المعلومات الخاصة بالكتلة.",
    page_prompt_blocks_list_title: "**قائمة الكتل المتاحة :**",
    page_prompt_block_01: "- `#01_hero_header`: شريط افتتاحي. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: ملخص مع روابط داخلية. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: معالم تاريخية في 3 بطاقات. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (حد أقصى 3 بطاقات)",
    page_prompt_block_04: "- `#04_callout_set`: لافتات الأهداف، الجدير بالمعرفة، التنبيه. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: إحصاءات/أرقام رئيسية في بطاقات. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: جدول مفردات. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: مسرد على هيئة شرائح. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: بطاقات معالم مع صور. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: صورتان للمقارنة. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: جدول مقارنة. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: صندوق تعريف. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"تعريف\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: فقرات درسية. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: بطاقة تفصيلية. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: الأسئلة الشائعة. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: خرافات مقابل حقائق. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"خرافات\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"حقائق\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: منهج لوصف صورة. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: بيبليوغرافيا المواقع. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"بيبليوغرافيا المواقع\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: اقتباس ثنائي اللغة. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**قواعد المحتوى :**",
    page_prompt_rule1: "1.  يجب أن يكون JSON صالحًا.",
    page_prompt_rule2: "2.  يمكن للمحتوى النصي استخدام وسوم Markdown `*كلمة*` للنص العريض و`**كلمة**` للنص المائل.",
    page_prompt_rule3: "3.  بالنسبة للصور، اعثر على عناوين URL ذات صلة وخالية من الحقوق (مثال: Wikimedia Commons).",
    page_prompt_example_json_title: "**مثال JSON :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "الثورة الفرنسية",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "الثورة الفرنسية", "subtitle": "مرتكزات أساسية" } },
    { "type": "#12_context_paragraphs", "data": { "title": "السياق", "paragraphs": ["الثورة الفرنسية فترة من التحولات...", "تفسّر عدة أسباب هذا الحدث..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "أحداث رئيسية", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "اقتحام الباستيل", "caption": "14 يوليو 1789", "title": "اقتحام الباستيل", "text": "يمثّل هذا الحدث بداية الثورة." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "ولِّد كود JSON صالحًا فقط، من دون أي تعليق."
};
