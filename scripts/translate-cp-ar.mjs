import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'js', 'locales');
const filePath = join(LOCALES_DIR, 'ar.json');
const json = JSON.parse(readFileSync(filePath, 'utf8'));

json.prompt_course_presentation_structure_json = `- أنشئ فقط JSON كاملًا وصالحًا داخل كتلة تعليمات برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا تضف أي نص أو تعليق آخر.
- يجب أن يحتوي الكائن الجذر على:
  - \`title\` : عنوان العرض التقديمي.
  - \`slides\` : مصفوفة من الكائنات. كل كائن يمثّل شريحة.

**بنية الشرائح حسب النوع:**

1. **عنوان** (\`type: "title"\`) : \`title\` (العنوان الرئيسي)، \`subtitle\` (عنوان فرعي اختياري)
2. **محتوى** (\`type: "content"\`) : \`title\`، \`text\` (نص بتنسيق Markdown : \`**غامق**\`، \`*مائل*\`)
3. **محتوى + جدول** (\`type: "content-with-table"\`) : \`title\`، \`text\` (نص بتنسيق Markdown)، \`table\` : كائن يحتوي على \`headers\` (مصفوفة سلاسل نصية) و\`rows\` (مصفوفة من مصفوفات سلاسل نصية)
4. **تمرين** (\`type: "quiz"\`) : \`title\`، \`exercise\` (كائن تمرين — انظر أدناه)
5. **محتوى + تمرين** (\`type: "content-quiz"\`) : \`title\`، \`text\` (نص بتنسيق Markdown)، \`exercise\` (كائن تمرين)
6. **ملخص** (\`type: "summary"\`) : \`title\`، \`exercise\` مع \`library: "H5P.Summary 1.10"\`

**بنية كائنات التمارين حسب النوع:**

كل تمرين يحتوي على \`library\` متبوعًا بالحقول الموصوفة أدناه. التزم تمامًا بأنواع البيانات المحددة.

1. **اختيار من متعدد** (\`library: "H5P.MultiChoice 1.16"\`) :
   - \`question\` (string) : نص السؤال.
   - \`answers\` (مصفوفة كائنات) : كل كائن يحتوي على \`text\` (string)، \`correct\` (boolean)، واختياريًا \`tipsAndFeedback\` : \`{ "tip": "...", "chosenFeedback": "..." }\`.
   - \`behaviour\` : \`{ singleAnswer: true }\` إذا كانت هناك إجابة صحيحة واحدة فقط، \`{ singleAnswer: false }\` إذا كانت هناك عدة إجابات صحيحة.
   - \`overallFeedback\` (4 شرائح)

2. **صح/خطأ** (\`library: "H5P.TrueFalse 1.8"\`) :
   - \`question\` (string) : العبارة المراد تقييمها.
   - \`correct\` (string) : \`"true"\` أو \`"false"\` — دائمًا سلسلة نصية، وليس قيمة منطقية أبدًا.
   - \`feedbackOnCorrect\` (string)، \`feedbackOnWrong\` (string)

3. **ملء الفراغات** (\`library: "H5P.Blanks 1.14"\`) :
   - \`taskDescription\` (string) : تعليمة قصيرة (جملة أو جملتان). يُمنع وضع علامات \`*كلمة*\` فيها.
   - \`questions\` (مصفوفة سلاسل نصية) : كل عنصر هو سلسلة نصية تحتوي على النص مع الفراغات المحددة بـ \`*كلمة*\`. البدائل: \`*كلمة1/كلمة2*\`. التلميح: \`*كلمة:تلميح*\`. لا تضع كائنات أبدًا في هذه المصفوفة.
   - \`overallFeedback\` (4 شرائح)

4. **سحب الكلمات** (\`library: "H5P.DragText 1.10"\`) :
   - \`taskDescription\` (string) : تعليمة واضحة.
   - \`textField\` (string) : النص الكامل مع \`*كلمة*\` لكل كلمة يجب سحبها. يجب أن تكون كل كلمة فريدة. الجمل مفصولة بـ \`\\n\`.
   - \`overallFeedback\` (4 شرائح)

5. **تظليل الكلمات** (\`library: "H5P.MarkTheWords 1.11"\`) :
   - \`taskDescription\` (string) : تعليمة واضحة. يُسمح بـ \`**غامق**\` و\`*مائل*\` هنا فقط.
   - \`textField\` (string) : النص مع \`*كلمة*\` لكل كلمة يجب تظليلها. كلمة واحدة لكل علامة (\`*كلمة1* و *كلمة2*\`، وليس \`*كلمة1 كلمة2*\`). مسافة قبل \`*\` وبعد \`*\`. الأداة منفصلة: \`ال *كلمة*\`.
   - \`overallFeedback\` (4 شرائح)

6. **اختيار واحد متسلسل** (\`library: "H5P.SingleChoiceSet 1.11"\`) :
   - \`choices\` (مصفوفة كائنات) : كل كائن يحتوي على \`question\` (string) و\`answers\` (مصفوفة سلاسل نصية — الإجابة الأولى هي الصحيحة دائمًا).
   - \`overallFeedback\` (4 شرائح)

7. **ملخص** (\`library: "H5P.Summary 1.10"\`) :
   - \`intro\` (string) : جملة تقديمية قصيرة.
   - \`summaries\` (مصفوفة كائنات) : كل كائن يحتوي على \`summary\` (مصفوفة سلاسل نصية — الأولى هي الصحيحة دائمًا) واختياريًا \`tip\` (string).
   - \`overallFeedback\` (4 شرائح)

8. **سحب وإفلات** (\`library: "H5P.DragQuestion 1.14"\`) :
   - \`title\` (string) : تعليمة توضح ما يجب على المتعلم فعله.
   - \`dropZones\` (مصفوفة كائنات) : كل كائن يحتوي على \`label\` (string) و\`correctElements\` (مصفوفة أعداد صحيحة = فهارس في \`elements\`، تبدأ من 0).
   - \`elements\` (مصفوفة كائنات) : كل كائن يحتوي على \`text\` (string، من 1 إلى 4 كلمات).
   - \`overallFeedback\` (4 شرائح)

9. **بطاقات الحوار** (\`library: "H5P.Dialogcards 1.9"\`) :
   - \`title\` (string)، \`description\` (string)
   - \`dialogs\` (مصفوفة كائنات) : كل كائن يحتوي على \`text\` (string، الوجه الأمامي) و\`answer\` (string، الوجه الخلفي). اختياريًا \`tips\` : \`{ "front": "...", "back": "..." }\`.

**كل تمرين يُحتسب فيه النقاط (باستثناء صح/خطأ وبطاقات الحوار) يجب أن يتضمن \`overallFeedback\` خاصًا به (4 شرائح).**
- **التنسيق:** استخدم صيغة Markdown للغامق (\`**نص**\`) والمائل (\`*نص*\`).
- **LaTeX :** بالنسبة للصيغ الرياضية، استخدم حصريًا تنسيق LaTeX مغلّفًا بتهريب مزدوج: \`\\\\( ... \\\\)\`. لا تستخدم أبدًا الرمز $- أنشئ فقط JSON كاملًا وصالحًا داخل كتلة تعليمات برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا تضف أي نص أو تعليق آخر.
- يجب أن يحتوي الكائن الجذر على:
  - \`title\` : عنوان العرض التقديمي.
  - \`slides\` : مصفوفة من الكائنات. كل كائن يمثّل شريحة.

**بنية الشرائح حسب النوع:**

1. **عنوان** (\`type: "title"\`) : \`title\` (العنوان الرئيسي)، \`subtitle\` (عنوان فرعي اختياري)
2. **محتوى** (\`type: "content"\`) : \`title\`، \`text\` (نص بتنسيق Markdown : \`**غامق**\`، \`*مائل*\`)
3. **محتوى + جدول** (\`type: "content-with-table"\`) : \`title\`، \`text\` (نص بتنسيق Markdown)، \`table\` : كائن يحتوي على \`headers\` (مصفوفة سلاسل نصية) و\`rows\` (مصفوفة من مصفوفات سلاسل نصية)
4. **تمرين** (\`type: "quiz"\`) : \`title\`، \`exercise\` (كائن تمرين — انظر أدناه)
5. **محتوى + تمرين** (\`type: "content-quiz"\`) : \`title\`، \`text\` (نص بتنسيق Markdown)، \`exercise\` (كائن تمرين)
6. **ملخص** (\`type: "summary"\`) : \`title\`، \`exercise\` مع \`library: "H5P.Summary 1.10"\`

**بنية كائنات التمارين حسب النوع:**

كل تمرين يحتوي على \`library\` متبوعًا بالحقول الموصوفة أدناه. التزم تمامًا بأنواع البيانات المحددة.

1. **اختيار من متعدد** (\`library: "H5P.MultiChoice 1.16"\`) :
   - \`question\` (string) : نص السؤال.
   - \`answers\` (مصفوفة كائنات) : كل كائن يحتوي على \`text\` (string)، \`correct\` (boolean)، واختياريًا \`tipsAndFeedback\` : \`{ "tip": "...", "chosenFeedback": "..." }\`.
   - \`behaviour\` : \`{ singleAnswer: true }\` إذا كانت هناك إجابة صحيحة واحدة فقط، \`{ singleAnswer: false }\` إذا كانت هناك عدة إجابات صحيحة.
   - \`overallFeedback\` (4 شرائح)

2. **صح/خطأ** (\`library: "H5P.TrueFalse 1.8"\`) :
   - \`question\` (string) : العبارة المراد تقييمها.
   - \`correct\` (string) : \`"true"\` أو \`"false"\` — دائمًا سلسلة نصية، وليس قيمة منطقية أبدًا.
   - \`feedbackOnCorrect\` (string)، \`feedbackOnWrong\` (string)

3. **ملء الفراغات** (\`library: "H5P.Blanks 1.14"\`) :
   - \`taskDescription\` (string) : تعليمة قصيرة (جملة أو جملتان). يُمنع وضع علامات \`*كلمة*\` فيها.
   - \`questions\` (مصفوفة سلاسل نصية) : كل عنصر هو سلسلة نصية تحتوي على النص مع الفراغات المحددة بـ \`*كلمة*\`. البدائل: \`*كلمة1/كلمة2*\`. التلميح: \`*كلمة:تلميح*\`. لا تضع كائنات أبدًا في هذه المصفوفة.
   - \`overallFeedback\` (4 شرائح)

4. **سحب الكلمات** (\`library: "H5P.DragText 1.10"\`) :
   - \`taskDescription\` (string) : تعليمة واضحة.
   - \`textField\` (string) : النص الكامل مع \`*كلمة*\` لكل كلمة يجب سحبها. يجب أن تكون كل كلمة فريدة. الجمل مفصولة بـ \`\\n\`.
   - \`overallFeedback\` (4 شرائح)

5. **تظليل الكلمات** (\`library: "H5P.MarkTheWords 1.11"\`) :
   - \`taskDescription\` (string) : تعليمة واضحة. يُسمح بـ \`**غامق**\` و\`*مائل*\` هنا فقط.
   - \`textField\` (string) : النص مع \`*كلمة*\` لكل كلمة يجب تظليلها. كلمة واحدة لكل علامة (\`*كلمة1* و *كلمة2*\`، وليس \`*كلمة1 كلمة2*\`). مسافة قبل \`*\` وبعد \`*\`. الأداة منفصلة: \`ال *كلمة*\`.
   - \`overallFeedback\` (4 شرائح)

6. **اختيار واحد متسلسل** (\`library: "H5P.SingleChoiceSet 1.11"\`) :
   - \`choices\` (مصفوفة كائنات) : كل كائن يحتوي على \`question\` (string) و\`answers\` (مصفوفة سلاسل نصية — الإجابة الأولى هي الصحيحة دائمًا).
   - \`overallFeedback\` (4 شرائح)

7. **ملخص** (\`library: "H5P.Summary 1.10"\`) :
   - \`intro\` (string) : جملة تقديمية قصيرة.
   - \`summaries\` (مصفوفة كائنات) : كل كائن يحتوي على \`summary\` (مصفوفة سلاسل نصية — الأولى هي الصحيحة دائمًا) واختياريًا \`tip\` (string).
   - \`overallFeedback\` (4 شرائح)

8. **سحب وإفلات** (\`library: "H5P.DragQuestion 1.14"\`) :
   - \`title\` (string) : تعليمة توضح ما يجب على المتعلم فعله.
   - \`dropZones\` (مصفوفة كائنات) : كل كائن يحتوي على \`label\` (string) و\`correctElements\` (مصفوفة أعداد صحيحة = فهارس في \`elements\`، تبدأ من 0).
   - \`elements\` (مصفوفة كائنات) : كل كائن يحتوي على \`text\` (string، من 1 إلى 4 كلمات).
   - \`overallFeedback\` (4 شرائح)

9. **بطاقات الحوار** (\`library: "H5P.Dialogcards 1.9"\`) :
   - \`title\` (string)، \`description\` (string)
   - \`dialogs\` (مصفوفة كائنات) : كل كائن يحتوي على \`text\` (string، الوجه الأمامي) و\`answer\` (string، الوجه الخلفي). اختياريًا \`tips\` : \`{ "front": "...", "back": "..." }\`.

**كل تمرين يُحتسب فيه النقاط (باستثناء صح/خطأ وبطاقات الحوار) يجب أن يتضمن \`overallFeedback\` خاصًا به (4 شرائح).** وحده. أمثلة: \`\\\\( \\\\frac{1}{2} \\\\)\`، \`\\\\( \\\\sqrt{2} \\\\)\`، \`\\\\( \\\\alpha \\\\)\`، \`\\\\( x^{2} \\\\)\`، \`\\\\( \\\\mathbb{R} \\\\)\`، \`\\\\( \\\\sin(\\\\theta) \\\\)\`، \`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`، \`\\\\( x \\\\geq 0 \\\\)\`، \`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`.
- **التغذية الراجعة:** التغذية الراجعة (\`overallFeedback\`، \`tipsAndFeedback\`) يجب ألا تحتوي على LaTeX أو Markdown. نص عادي فقط.`;

json.prompt_course_presentation_exemple_rendu = `\`\`\`json
{
  "title": "الثورة الفرنسية",
  "slides": [
    {
      "type": "title",
      "title": "الثورة الفرنسية",
      "subtitle": "من 1789 إلى 1799: تحولات سياسية واجتماعية"
    },
    {
      "type": "content",
      "title": "أسباب الثورة",
      "text": "كانت فرنسا في نهاية القرن الثامن عشر تعاني من **أزمة عميقة**:\\n- أزمة مالية: الدولة مثقلة بالديون\\n- أزمة اجتماعية: تفاوتات بين الطبقات الثلاث\\n- أزمة سياسية: الملكية المطلقة موضع تساؤل"
    },
    {
      "type": "content-with-table",
      "title": "التسلسل الزمني للأحداث",
      "text": "التواريخ الكبرى للثورة الفرنسية:",
      "table": {
        "headers": ["التاريخ", "الحدث", "النتيجة"],
        "rows": [
          ["14 يوليو 1789", "اقتحام الباستيل", "رمز سقوط الحكم المطلق"],
          ["26 أغسطس 1789", "إعلان حقوق الإنسان", "أساس الحقوق المدنية"]
        ]
      }
    },
    {
      "type": "quiz",
      "title": "التحقق من المعارف",
      "exercise": {
        "library": "H5P.MultiChoice 1.16",
        "question": "ما التاريخ الذي يُؤرّخ لاقتحام الباستيل؟",
        "answers": [
          { "text": "14 يوليو 1789", "correct": true, "tipsAndFeedback": { "chosenFeedback": "صحيح! أصبح هذا اليوم العيد الوطني الفرنسي." } },
          { "text": "26 أغسطس 1789", "correct": false, "tipsAndFeedback": { "chosenFeedback": "لا، هذا تاريخ إعلان حقوق الإنسان." } },
          { "text": "5 مايو 1789", "correct": false },
          { "text": "21 سبتمبر 1792", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "راجع التواريخ الكبرى للثورة." },
          { "from": 26, "to": 50, "feedback": "هذه بداية، واصل!" },
          { "from": 51, "to": 75, "feedback": "عمل جيد!" },
          { "from": 76, "to": 100, "feedback": "ممتاز!" }
        ]
      }
    },
    {
      "type": "content-quiz",
      "title": "إعلان الحقوق",
      "text": "يُعلن **إعلان حقوق الإنسان والمواطن** الصادر في 26 أغسطس 1789 أن *« يولد الناس أحرارًا ومتساوين في الحقوق ويظلون كذلك »*.",
      "exercise": {
        "library": "H5P.TrueFalse 1.8",
        "question": "تم اعتماد إعلان حقوق الإنسان في عام 1791.",
        "correct": "false",
        "feedbackOnCorrect": "أحسنت! لقد تم اعتماده فعلًا في 26 أغسطس 1789.",
        "feedbackOnWrong": "لا، تم اعتماد الإعلان في 26 أغسطس 1789 وليس في 1791."
      }
    },
    {
      "type": "quiz",
      "title": "أكمل الجمل",
      "exercise": {
        "library": "H5P.Blanks 1.14",
        "taskDescription": "أعد الكلمات الناقصة حول أحداث الثورة.",
        "questions": [
          "وقع اقتحام *الباستيل* في 14 يوليو *1789*.",
          "يؤكد إعلان حقوق الإنسان أن الناس يولدون *أحرارًا* و*متساوين:فكّر في المادة الأولى* في الحقوق."
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "راجع التواريخ والمفاهيم الأساسية." },
          { "from": 26, "to": 50, "feedback": "هذه بداية، واصل!" },
          { "from": 51, "to": 75, "feedback": "عمل جيد!" },
          { "from": 76, "to": 100, "feedback": "ممتاز!" }
        ]
      }
    },
    {
      "type": "content-quiz",
      "title": "أبرز شخصيات الثورة",
      "text": "تركت شخصيات عديدة بصمتها في الثورة: **روبسبيير** و**دانتون** و**ميرابو** وغيرهم.",
      "exercise": {
        "library": "H5P.DragText 1.10",
        "taskDescription": "أعد الكلمات الناقصة إلى مكانها في النص.",
        "textField": "*روبسبيير* هو شخصية محورية في عهد الإرهاب.\\n*دانتون* كان خطيبًا بارزًا في الثورة.\\n*ميرابو* حاول التوفيق بين الملكية والثورة.",
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "راجع شخصيات الثورة." },
          { "from": 26, "to": 50, "feedback": "هذه بداية، واصل!" },
          { "from": 51, "to": 75, "feedback": "عمل جيد!" },
          { "from": 76, "to": 100, "feedback": "ممتاز!" }
        ]
      }
    },
    {
      "type": "quiz",
      "title": "حدد الكلمات المفتاحية",
      "exercise": {
        "library": "H5P.MarkTheWords 1.11",
        "taskDescription": "انقر على **التواريخ** المذكورة في النص.",
        "textField": "اقتُحمت الباستيل في *14* *يوليو* *1789*. أُعلنت الجمهورية في *21* *سبتمبر* *1792*.",
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "أعد قراءة التواريخ جيدًا." },
          { "from": 26, "to": 50, "feedback": "هذه بداية جيدة." },
          { "from": 51, "to": 75, "feedback": "عمل جيد!" },
          { "from": 76, "to": 100, "feedback": "ممتاز!" }
        ]
      }
    },
    {
      "type": "quiz",
      "title": "اختبار سريع",
      "exercise": {
        "library": "H5P.SingleChoiceSet 1.11",
        "choices": [
          {
            "question": "في أي سنة اقتُحمت الباستيل؟",
            "answers": ["1789", "1791", "1792", "1799"]
          },
          {
            "question": "من صاغ إعلان حقوق الإنسان؟",
            "answers": ["الجمعية الوطنية", "الملك لويس السادس عشر", "نابليون بونابرت"]
          }
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "راجع الأساسيات." },
          { "from": 26, "to": 50, "feedback": "هذه بداية." },
          { "from": 51, "to": 75, "feedback": "عمل جيد!" },
          { "from": 76, "to": 100, "feedback": "ممتاز!" }
        ]
      }
    },
    {
      "type": "summary",
      "title": "ملخص",
      "exercise": {
        "library": "H5P.Summary 1.10",
        "intro": "اختر العبارات الصحيحة لكل مجموعة.",
        "summaries": [
          {
            "summary": [
              "اقتُحمت الباستيل في عام 1789",
              "اقتُحمت الباستيل في عام 1791",
              "اقتُحمت الباستيل في عام 1792"
            ]
          },
          {
            "summary": [
              "أُعلنت الجمهورية في 21 سبتمبر 1792",
              "أُعلنت الجمهورية في 14 يوليو 1789",
              "أُعلنت الجمهورية في 5 مايو 1789"
            ]
          }
        ],
        "overallFeedback": [
          { "from": 0, "to": 25, "feedback": "راجع النقاط الأساسية للدرس." },
          { "from": 26, "to": 50, "feedback": "هذه بداية جيدة." },
          { "from": 51, "to": 75, "feedback": "إتقان جيد للموضوع." },
          { "from": 76, "to": 100, "feedback": "ممتاز!" }
        ]
      }
    }
  ]
}
\`\`\``;

writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log('ar.json: course_presentation traduit');
