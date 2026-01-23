const translations_ar = {
  subtitle: "الإنشاء المُساعَد للموارد والأنشطة في Moodle وÉléa",
  help_modal_title: "🚀 الدليل الكامل لـ Caramel للمعلمين",
  help_modal_content: `
    <p>مرحبًا بك في <strong>Caramel</strong>! صُمِّم هذا الدليل ليرافقك خطوة بخطوة، حتى إن كنت مبتدئًا. هدفنا هو مساعدتك على إنشاء أنشطة تعليمية تفاعلية بطريقة بسيطة وفعّالة.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> الوصف</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> الاختيار</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> التوليد</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> عرض وتحميل</a>
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
            يتيح لك هذا الخيار القوي الاعتماد في التوليد على محتوى توفّره أنت. يمكنك إما <strong>نسخ/لصق نص</strong> أو <strong>رفع مستند (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
            <br><strong><i class="fas fa-lock"></i> الخصوصية :</strong> كن مطمئناً، تتم معالجة مستندك <strong>بالكامل محلياً على جهاز الكمبيوتر الخاص بك</strong>. لا يتم إرسال أي بيانات إلى الإنترنت.</p>
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
            <h5><i class="fas fa-rocket"></i> الخيار أ: عرض بسيط - توليد بنقرة واحدة</h5>
            <p>طريق سريع. انقر زر <button class="help-btn-example-llm">توليد بنقرة واحدة</button> ليُنتج الذكاء الاصطناعي المحتوى ويضعه مباشرة في منطقة النتائج على اليمين. يمكنك اختيار نماذج ذكاء اصطناعي مختلفة (سريع، قوي...) عبر السهم الصغير يمين الزر.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> الخيار ب: عرض موجه - استخدام ذكاء اصطناعي خارجي</h5>
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
        <h4><span class="help-step-number">4</span> العرض والتحميل</h4>
        <p>بمجرد إنشاء المحتوى، يمكنك عرضه واختباره وتحميله بتنسيقات مختلفة.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> العرض والاختبار</summary>
            <p>خذ وقتك للتحقق من نشاطك في نافذة العرض:</p>
            <ul>
                <li><strong>قم بالتمرير</strong> عبر المحتوى لمراجعة كل شيء.</li>
                <li><strong>اختبر</strong> النشاط كطالب (انقر، اسحب، اكتب...).</li>
                <li>بالنسبة لمحتوى <strong>Éléa/Magistère/Moodle</strong>، يظهر لك المحاكي العرض الحقيقي.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="نافذة العرض" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>اختبر النشاط مباشرة في المحاكي.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> التحميل (التنسيقات والصادرات)</summary>
            <p>لديك عدة خيارات لاستعادة عملك:</p>
            <ul>
                <li><strong>التنسيق التفاعلي (الزر الرئيسي):</strong> لاستعادة الملف الرقمي (مثل: .h5p، .mbz) لوضعه على منصتك.</li>
                <li><strong>تنسيقات أخرى (القائمة المنسدلة):</strong> انقر على السهم للتحميل بتنسيق <strong>PDF أو DOCX أو ODT</strong> (مفيد للطباعة أو الأرشفة).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="قائمة التصدير" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>افتح القائمة للوصول إلى صادرات PDF و DOCX...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> الدمج في Éléa/Magistère</h5>
        <p>بمجرد تحميل الملف، إليك كيفية إضافته إلى مقررك:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (أنشطة H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>طريقة بسيطة:</strong> فعِّل وضع التحرير في المقرر ثم اسحب ملف .h5p وأسقطه مباشرة في القسم المطلوب. اختر "Ajouter une activité H5P" ثم أنهِ بالزر "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="إضافة نشاط H5P بسرعة" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>أضف نشاط H5P ثم اضغط DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>طريقة موصى بها (للمصممين):</strong> انقر على "إضافة نشاط أو مورد"، اختر "محتوى تفاعلي (H5P)" ثم في حقل "المحرر" حدد تبويب "Téléverser" وتابع مع "Téléverser un fichier". اختتم بـ "Utiliser"، أضف العناصر المطلوبة ثم احفظ. بهذه الطريقة يتم تضمين النشاط عند مشاركة المقرر.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (صفحة، المليونير، مطابقة، اختيار من متعدد)</summary>
                <div class="import-content">
                    <p>يستورد هذا التنسيق نشاطًا كاملاً إلى مقررك.</p>
                    <ol>
                        <li>
                            <p>افتح قائمة التحرير الموجودة على يمين الشاشة. إذا كانت مطوية فاستخدم السهم الصغير لعرضها.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="قائمة التحرير في العمود الأيمن" style="width:75%;height:auto;">
                                    <figcaption><em>قائمة التحرير مفتوحة.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="سهم توسيع لوحة التحرير" style="width:75%;height:auto;">
                                    <figcaption><em>استخدم السهم إذا كان اللوح مخفياً.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>انقر على "IMPORT/EXPORT" ثم اختر "Importer un parcours" من القائمة الفرعية.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="زر IMPORT/EXPORT في Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>اختر Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            اسحب ملف .mbz وأسقطه في منطقة الاستيراد ثم اضغط "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="منطقة إسقاط ملف MBZ" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>أفلت الملف ثم أكد عبر IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>اتبع الخطوات بالضغط على "CONTINUER". سيُضاف النشاط إلى مقررك.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (نشاط المسرد)</summary>
                <div class="import-content">
                    <p>يتيح لك هذا التنسيق استيراد قائمة تعريفات إلى مسرد Éléa/Moodle.</p>
                    <ol>
                        <li>
                            <p>أنشئ نشاط مسرد فارغًا في مقررك وافتحه.</p>
                        </li>
                        <li>
                            <p>بمجرد دخولك إلى المسرد، انقر على زر "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="زر IMPORTER DES ARTICLES في المسرد" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>انقر على IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>اسحب وأفلت ملف .xml في منطقة الاستيراد وانقر على زر "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="منطقة الإفلات لملف XML الخاص بالمسرد" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>أفلت الملف وتحقق باستخدام ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>تم اكتشاف مقالاتك. أنهِ العملية بالنقر على زر "CONTINUER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="تأكيد اكتشاف المقالات" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>انقر على CONTINUER لإنهاء الاستيراد.</em></figcaption>
                            </figure>
                        </li>
                        <li>اكتمل الاستيراد. أصبحت تعريفاتك متاحة الآن في المسرد.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> و<span class="help-badge-file">.GIFT</span> (نشاط اختبار)</summary>
                <div class="import-content">
                    <p>تُدخل هذه التنسيقات أسئلة إلى "بنك الأسئلة".</p>
                    <ol>
                        <li>
                            <p>في مقرر Éléa الخاص بك، انتقل إلى تبويب "المزيد"، ثم انقر على "بنك الأسئلة".</p>
                        </li>
                        <li>
                            <p>في القائمة المنسدلة حيث يتم عرض "الأسئلة"، حدد "استيراد".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="تحديد زر الاستيراد في بنك الأسئلة" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>حدد استيراد من القائمة المنسدلة.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>حدد التنسيق المطابق لملفك:</p>
                            <ul>
                                <li><strong>تنسيق Moodle XML</strong> (موصى به): تنسيق كامل يدعم جميع أنواع الأسئلة.</li>
                                <li><strong>تنسيق GIFT</strong>: بديل أبسط ولكنه محدود في أنواع الأسئلة.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="الاختيار بين تنسيق Moodle XML وتنسيق GIFT" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>حدد التنسيق المناسب لملفك.</em></figcaption>
                            </figure>
                        </li>
                        <li>اسحب وأفلت ملفك في منطقة التحميل.</li>
                        <li>انقر على زر "IMPORTATION". ستعرض الشاشة الأسئلة المضافة (على سبيل المثال: تمت إضافة 10 أسئلة).</li>
                        <li>انتهِ بالنقر على "CONTINUER" في أسفل الصفحة.</li>
                        <li>الأسئلة الآن جاهزة لإضافتها إلى نشاط اختبار. راجع <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">برنامج Éléa التعليمي</a> لإنشاء نشاط اختبار وتحميل الأسئلة من البنك.</li>
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
                        <li>في محرر الصفحة، انقر على الأيقونة للانتقال إلى وضع HTML (غالباً ما تظهر بالشكل "&lt;&gt;").</li>
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
            <li><strong>النقاش وطرح الأسئلة:</strong> انضم إلينا على غرفة <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> للتبادل مع المجتمع.</li>
            <li><strong>الإبلاغ عن عطل:</strong> هل هناك مشكلة؟ أنشئ <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">تذكرة</a>. إن أمكن، أرفق ملف JSON الذي سبّب الخطأ، فهذا يساعدنا كثيرًا على إصلاحه.</li>
            <li><strong>دعم المشروع:</strong> إذا أعجبك الأدوات، اترك لنا نجمة صغيرة على <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">صفحة Forge</a>. هذه أفضل مكافأة لنا!</li>
        </ul>
    </div>
    `,

  // ============================================================================
  // الواجهة الرئيسية
  // ============================================================================
  language: "اللغة",
  tutorial: "دليل تعليمي",
  notifications: "الإشعارات",
  fast_mode: "الوضع السريع",
  guided_mode: "الوضع المتقدم",
  who_are_you: "من أنت؟ (مثال: معلم، مدرب...)",
  what_to_address: "ما الموضوع الذي تريد تناوله؟ (مثال: الثورة الفرنسية...)",
  level: "لأي مستوى (مثال: الصف الأول الثانوي المهني)",
  number_of_elements: "عدد الأسئلة/العناصر في الوحدة (مثال: 5)",

  // ============================================================================
  // معالجة المستندات (RAG/OCR)
  // ============================================================================
  rag_title: "إرفاق مستندات (اختياري)",
  rag_note: "إذا كنت تريد أن يعمل الذكاء الاصطناعي حصرياً بناءً على مستنداتك، فقم بلصق نصك أو وضع ملفاتك هنا. خلاف ذلك، اترك هذه المنطقة فارغة للسماح للذكاء الاصطناعي بالبحث عن المعلومات بنفسه.",
  error_duplicate_file: "تمت إضافة هذا الملف بالفعل.",
  error_unsupported_format: "تنسيق غير مدعوم. التنسيقات المقبولة: ",
  ocr_scanned_page: "تم اكتشاف صفحة ممسوحة ضوئياً، جاري التعرف الضوئي (OCR)",
  ocr_image_processing: "التعرف الضوئي (OCR) على الصورة",
  ocr_initializing: "جاري تهيئة OCR...",
  ocr_loading_language: "جاري تحميل نموذج اللغة...",
  ocr_preparing: "جاري تحضير التحليل...",
  docx_processing: "جاري استخراج نص DOCX...",
  pptx_processing: "جاري استخراج نص PPTX...",
  odt_processing: "جاري استخراج نص ODT...",
  odp_processing: "جاري استخراج نص ODP...",
  file_loading: "جاري تحميل الملف...",
  extraction_success: "تمت معالجة المستند بنجاح.",
  extraction_error: "حدث خطأ أثناء المعالجة.",
  error_fullscreen: "فشل وضع ملء الشاشة:",
  lock_text: "قفل",
  unlock_text: "إلغاء القفل",
  drag_drop_text: "قم بسحب وإفلات مستند هنا (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "أو",
  upload_pdf_btn: "اختر ملفاً",
  paste_your_text_here: "انسخ وانصق نصك هنا...",
  rag_tags_tuto: "تجدون أدناه المستندات التي تم رفعها. انقر على الدائرة الملونة لتخصيص تمييز كل مستند.",

  // ============================================================================
  // التبويبات
  // ============================================================================
  tab_all: "الكل",
  tab_quiz: "مسابقات واختبارات",
  tab_text: "التعامل مع النصوص",
  tab_memory: "حفظ واكتشاف",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // تفاصيل أنشطة H5P
  // ============================================================================
  h5p_timeline_name: "خط زمني",
  h5p_timeline_description: "أنشئ خطاً زمنياً تفاعلياً لعرض تسلسل الأحداث.",
  h5p_flashcards_name: "بطاقات تعليمية",
  h5p_flashcards_description: "أنشئ بطاقات ذات وجهين للمساعدة في حفظ المصطلحات والتعاريف.",
  h5p_quiz_set_name: "مسابقة مختلطة",
  h5p_quiz_set_description: "قم بتكوين سلسلة من الأسئلة المتنوعة (اختيارات، سحب وإفلات، إلخ) لتقييم المعرفة.",
  h5p_quiz_set_qcm_name: "مسابقة اختيار من متعدد",
  h5p_quiz_set_qcm_description: "أنشئ مسابقة تتكون حصرياً من أسئلة اختيار من متعدد.",
  h5p_quiz_set_vf_name: "مسابقة صح/خطأ",
  h5p_quiz_set_vf_description: "أنشئ مسابقة تتكون حصرياً من أسئلة من نوع صح أو خطأ.",
  h5p_glossary_name: "مسرد مصطلحات",
  h5p_glossary_description: "أنشئ مسرداً أو أسئلة شائعة على شكل قوائم قابلة للطي.",
  h5p_crossword_name: "كلمات متقاطعة",
  h5p_crossword_description: "أنشئ شبكة كلمات متقاطعة من قائمة كلمات وتعاريف.",
  h5p_essay_name: "كتابة موضوع",
  h5p_essay_description: "اقترح موضوعاً للكتابة وحدد كلمات مفتاحية للتصحيح التلقائي.",
  h5p_summary_name: "ملخص",
  h5p_summary_description: "على الطلاب إعادة بناء ملخص صحيح باختيار الجمل المناسبة.",
  h5p_drag_the_words_name: "سحب الكلمات",
  h5p_drag_the_words_description: "أنشئ نصاً بفرغات حيث يجب على الطلاب سحب الكلمات المفقودة.",
  h5p_fill_in_the_blanks_name: "نص بفرغات",
  h5p_fill_in_the_blanks_description: "يجب على الطلاب ملء الكلمات المفقودة في النص مباشرة باستخدام لوحة المفاتيح.",
  h5p_mark_the_words_name: "تظليل الكلمات",
  h5p_mark_the_words_description: "اطلب من الطلاب تظليل كلمات معينة في فقرة.",
  h5p_true_false_name: "صح/خطأ",
  h5p_true_false_description: "أنشئ سؤالاً بسيطاً <strong style='color: red;'>واحداً</strong> بإجابة ثنائية: صح أو خطأ.",
  h5p_multiple_choice_name: "خيارات متعددة",
  h5p_multiple_choice_description: "أنشئ سؤالاً <strong style='color: red;'>واحداً</strong> متعدد الخيارات مع إجابة صحيحة واحدة أو أكثر.",
  h5p_find_the_words_name: "البحث عن الكلمات",
  h5p_find_the_words_description: "أنشئ شبكة حروف حيث يجب على الطلاب العثور على الكلمات.",
  h5p_sort_the_paragraphs_name: "ترتيب الفقرات",
  h5p_sort_the_paragraphs_description: "أنشئ مجموعة من الفقرات التي يجب على الطلاب إعادة ترتيبها بشكل صحيح.",
  h5p_single_choice_set_name: "سلسلة خيارات وحيدة",
  h5p_single_choice_set_description: "أنشئ سلسلة أسئلة حيث لكل سؤال إجابة صحيحة واحدة فقط.",
  h5p_dialog_cards_name: "بطاقات حوارية",
  h5p_dialog_cards_description: "أنشئ بطاقات تفاعلية ذات وجهين تحتوي على نص وربما صور.",
  h5p_complex_fill_the_blanks_name: "نص بفرغات معقد",
  h5p_complex_fill_the_blanks_description: "أنشئ نصاً بفرغات متقدماً مع تغذية راجعة محددة لكل خطأ.",
  h5p_chart_name: "رسم بياني",
  h5p_chart_description: "أنشئ رسماً بيانياً دائرياً أو بالأعمدة لتصور البيانات.",

  // ============================================================================
  // تفاصيل أنشطة ÉLÉA/MOODLE
  // ============================================================================
  moodle_xml_name: "اختبار",
  moodle_xml_description: "أنشئ بنك أسئلة للاستيراد مباشرة في نشاط 'اختبار' (بتنسيق xml أو gift).",
  moodle_xml_help: "لإضافة ملف XML في نشاط 'اختبار' على Moodle، ابدأ بإنشاء النشاط. ثم افتح قائمة <strong>المزيد</strong> واذهب إلى <strong>بنك الأسئلة</strong>. في هذه القائمة، انقر على <strong>استيراد</strong>، اختر تنسيق <strong>XML Moodle</strong>، ثم حدد ملفك وقم بالتأكيد.",
  moodle_gift_name: "تنسيق GIFT",
  moodle_gift_description: "أنشئ أسئلة بتنسيق GIFT، وهي طريقة بسيطة لاستيراد الأسئلة إلى Moodle.",
  moodle_millionnaire_name: "من سيربح المليون",
  moodle_millionnaire_description: "أنشئ نشاطاً فريداً من نوع 'من سيربح المليون' يتكون من 6 أسئلة متدرجة الصعوبة.",
  moodle_appariement_name: "توصيل",
  moodle_appariement_description: "أنشئ نشاط توصيل يتكون من 10 أسئلة.",
  moodle_qcm_name: "QCM (اختيار من متعدد)",
  moodle_qcm_description: "أنشئ نشاط اختيار من متعدد بسيط.",
  moodle_glossaire_xml_name: "مسرد (XML)",
  moodle_glossaire_xml_description: "أنشئ مسرداً جاهزاً للاستيراد بتنسيق XML.",
  glossaire_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
  glossaire_error_creation: "خطأ أثناء إنشاء ملف XML للمسرد:",
  glossaire_error_invalid_json: "يجب أن يحتوي ملف JSON على اسم ('name') ومصفوفة إدخالات ('entries').",
  elea_page_name: "صفحة",
  elea_page_description: "أنشئ صفحة محتوى Éléa منسقة بصرياً.",

  // ============================================================================
  // نافذة الإنشاء
  // ============================================================================
  get_prompt_step: "1/2 الحصول على الأمر للنسخ",
  create_file_step: "2/2 إنشاء الملف من JSON",
  generate_one_click: "إنشاء بنقرة واحدة",
  simple_mode: "بسيط",
  advanced_mode: "موجه",
  prompt_for_ia: "أمر الذكاء الاصطناعي (Prompt)",
  copy_prompt: "نسخ الأمر",
  fullscreen_prompt: "ملء الشاشة",
  exit_fullscreen_prompt: "الخروج من ملء الشاشة",
  lock_prompt: "قفل",
  unlock_prompt: "إلغاء القفل",
  go_duck: "نسخ والذهاب إلى Duck.ai",
  go_mistral: "نسخ والذهاب إلى Le chat",
  create_h5p_file: "إنشاء ملف H5P",
  integrate_h5p_libraries: "دمج مكتبات H5P:",
  paste_ia_result: "قم بلصق نتيجة الذكاء الاصطناعي في المنطقة أدناه لإنشاء وحدتك.",
  generate_h5p: "إنشاء H5P",
  create_xml_file: "إنشاء ملف XML",
  paste_ia_result_xml: "قم بلصق ملف XML الذي أنشأه الذكاء الاصطناعي أدناه.",
  generate_xml_file: "إنشاء ملف XML",
  export_mbz: "تنسيق MBZ",
  export_gift: "تنسيق GIFT",
  export_xml: "تنسيق XML",
  export_html: "تنسيق HTML",
  export_docx: "تنسيق DOCX",
  export_odt: "تنسيق ODT",
  export_pdf: "صيغة PDF",
  export_error: "خطأ في التصدير",
  create_mbz_file_appariement: "إنشاء ملف توصيل (.mbz)",
  paste_ia_result_appariement: "قم بلصق JSON الذي أنشأه الذكاء الاصطناعي أدناه. سيتم استخراج عنوان النشاط تلقائياً من JSON.",
  generate_mbz_appariement: "إنشاء نشاط التوصيل (mbz)",
  create_mbz_file_millionnaire: "إنشاء ملف من سيربح المليون (.mbz)",
  paste_ia_result_millionnaire: "قم بلصق JSON الذي أنشأه الذكاء الاصطناعي أدناه. سيتم استخراج عنوان النشاط تلقائياً من JSON.",
  generate_mbz_millionnaire: "إنشاء نشاط المليونير (mbz)",
  generate_mbz_test: "إنشاء نشاط اختبار (mbz)",
  create_mbz_file_qcm: "إنشاء ملف QCM (.mbz)",
  paste_ia_result_qcm: "قم بلصق JSON الذي أنشأه الذكاء الاصطناعي أدناه. سيتم استخراج عنوان النشاط تلقائياً من JSON.",
  generate_mbz_qcm: "إنشاء نشاط QCM (mbz)",
  create_mbz_file_page: "إنشاء ملف صفحة (.mbz)",
  paste_ia_result_page: "قم بلصق JSON الذي أنشأه الذكاء الاصطناعي أدناه لبناء الصفحة.",
  generate_mbz_page: "إنشاء نشاط صفحة (mbz)",
  generate_prompts_placeholder: "سيظهر أمر الذكاء الاصطناعي هنا بمجرد إكمال حقل واحد على الأقل في الوضع السريع أو المتقدم.",
  paste_json_or_text: "قم بلصق محتوى JSON أو النص الذي أنشأه الذكاء الاصطناعي هنا لإنشاء نشاطك.",
  info_prompt_copy: "لا تقم بلصق هذا الأمر في اللوحة اليمنى. انسخه واستخدمه في ذكاء اصطناعي عام للحصول على النتيجة، ثم الصق تلك النتيجة في اللوحة اليمنى.",
  generate_with_llm: "إنشاء باستخدام ذكاء Caramel",
  generation_in_progress: "جاري الإنشاء، يرجى الانتظار...",
  request_sent_to_ia: "تم إرسال الطلب إلى الذكاء الاصطناعي، يرجى الانتظار...",
  generation_successful: "تم إنشاء محتوى H5P بنجاح!",
  generation_failed_empty: "فشل الإنشاء. الرد كان فارغاً.",
  generation_failed_error: "خطأ أثناء الإنشاء: {errorMessage}",
  generation_failed_llm: "فشل الإنشاء عبر ذكاء Caramel. السبب: {errorMessage}",
  llm_small_summary: "Caramel mou: سريع، خفيف، مثالي للتمارين السريعة والإجابات الفورية. استهلاك منخفض.",
  llm_large_summary: "Caramel coulant: أكثر ثراءً ودقة، مثالي للمهام التي تتطلب بعض العمق. استهلاك متوسط.",
  llm_xl_summary: "Caramel dur: قوي ومعقد، مخصص للمشاريع الطموحة. يتطلب الصبر، والنتيجة مضمونة! استهلاك عالٍ.",
  llm_model_source: "مزود النموذج:",
  llm_model_parameters: "حجم النموذج:",
  llm_model_parameters_unit: "مليار بارامتر",

  // ============================================================================
  // رسوم متحركة لطهي الكراميل
  // ============================================================================
  caramel_animation_step_1: "نصب السكر في المقلاة...",
  caramel_animation_step_2: "نضيف القليل من الماء...",
  caramel_animation_step_3: "نسخن على نار متوسطة...",
  caramel_animation_step_4: "يبدأ السكر في الذوبان...",
  caramel_animation_step_5: "يبدأ اللون في التغير...",
  caramel_animation_step_6: "نحرك بلطف...",
  caramel_animation_step_7: "يأخذ الكراميل لونا عنبريا جميلا...",
  caramel_animation_step_8: "نضيف الكريمة الساخنة...",
  caramel_animation_step_9: "انتبه من الرذاذ!",
  caramel_animation_step_10: "نخلط جيدا...",
  caramel_animation_step_11: "لقد أوشك على الجاهزية!",
  caramel_success_title: "حلواك جاهزة!",

  // ============================================================================
  // الإشعارات والأخطاء
  // ============================================================================
  prompts_generated_successfully: "تم إنشاء البرومبتات بنجاح!",
  success_copy: "✓ تم النسخ!",
  error_please_fill_fields: "يرجى ملء حقل واحد على الأقل في الوضع السريع.",
  error_please_fill_guided_fields: "يرجى ملء حقل واحد على الأقل في الوضع المتقدم.",
  error_field_empty: "الحقل فارغ. يرجى إنشاء برومبت أولاً.",
  error_copy_failed: "فشلت عملية النسخ.",
  error_h5p_module_not_found: "لم يتم العثور على الوحدة '{moduleKey}'.",
  error_invalid_quiz_json: "ملف JSON الخاص بالاختبار غير صالح: {errorMessage}",
  error_invalid_json: "ملف JSON المقدم غير صالح. الخطأ: {errorMessage}",
  error_h5p_creation: "خطأ في إنشاء H5P: {errorMessage}",
  error_paste_ia_content: "يرجى لصق المحتوى الذي تم إنشاؤه بواسطة الذكاء الاصطناعي.",
  error_compression_module_not_ready: "وحدة الضغط ليست جاهزة بعد. حاول مرة أخرى بعد قليل.",
  h5p_file_generated_successfully: "تم إنشاء الملف {fileName} بنجاح!",
  h5p_creation_failed: "فشل إنشاء ملف H5P: {errorMessage}",
  error_paste_json_content: "يرجى لصق محتوى JSON الذي تم إنشاؤه.",
  error_paste_xml_content: "يرجى لصق محتوى XML الذي تم إنشاؤه.",
  moodle_xml_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
  test_error_creation_mbz: "خطأ أثناء إنشاء ملف MBZ للاختبار:",
  test_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
  test_error_generic: "خطأ:",
  test_backup_log: "نسخة احتياطية تم إنشاؤها تلقائياً بواسطة Caramel\n",
  millionnaire_error_compression_libs: "مكتبات الضغط (Tar.js أو fflate) غير محملة. يرجى التحقق من اتصالك بالإنترنت أو تحديث الصفحة.",
  millionnaire_error_invalid_json: "بنية JSON غير صالحة. تأكد من أنها تحتوي على 'title' ومصفوفة 'questions' من 6 أسئلة مطابقة للمثال.",
  millionnaire_activity_intro: "شارك في هذه اللعبة لاختبار معلوماتك.",
  millionnaire_backup_log: "نسخة احتياطية تم إنشاؤها تلقائياً بواسطة Caramel\n",
  millionnaire_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
  millionnaire_error_creation_mbz: "خطأ أثناء إنشاء ملف MBZ:",
  millionnaire_error_generic: "خطأ:",
  appariement_error_invalid_json: "بنية JSON غير صالحة. تأكد من أنها تحتوي على 'title' ومصفوفة 'pairs' حيث يحتوي كل زوج على 'question' و 'answer'.",
  appariement_activity_intro: "جد الأزواج المتطابقة.",
  appariement_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
  appariement_error_creation_mbz: "خطأ أثناء إنشاء ملف MBZ للمطابقة:",
  qcm_error_invalid_json: "بنية JSON غير صالحة. تأكد من أنها تحتوي على 'title' ومصفوفة 'questions' مع سؤال واحد على الأقل وإجابات.",
  qcm_activity_intro: "أجب على الأسئلة التالية.",
  qcm_success_generation: "تم إنشاء الملف {fileName} بنجاح!",
  qcm_error_creation_mbz: "خطأ أثناء إنشاء ملف MBZ لـ QCM:",
  version_modal_title: "إصدار جديد متاح",
  version_modal_message: "أنت تستخدم حالياً الإصدار {currentVersion}. يتوفر إصدار أحدث ({latestVersion}). أعد تحميل الصفحة للاستفادة من آخر التحسينات.",
  version_modal_update: "تحميل الإصدار الجديد",
  version_modal_remind_later: "ذكرني لاحقاً",

  prompt_header_pedagogical_context: "السياق التربوي",
  prompt_header_specific_rules: "القواعد الخاصة",
  prompt_header_pedagogical_rules: "القواعد التربوية",
  prompt_header_sources: "المصادر",
  prompt_header_json_structure: "بنية JSON المتوقعة",
  prompt_header_rendering_example: "مثال على العرض",
  prompt_fallback_teacher: "معلم",
  prompt_fallback_activity: "إنشاء نشاط تربوي",

  // ============================================================================

  // --- مفاتيح عامة ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- دورك: [QUI]. خبير في الديداكتيك والهندسة البيداغوجية
- هدفك البيداغوجي: [QUOI]
- جمهورك: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- التكيف والمفردات: قم بتكييف النبرة والمفردات وصعوبة التعليمات مع الجمهور المستهدف. كن وثيق الصلة ومحفزاً.
- النبرة والتعليقات: يجب أن تكون التعليمات والملاحظات بناءة، مشجعة، وموجهة نحو التعلم.
- الامتثال: قم بتكييف المحتوى إجبارياً مع المراجع الرسمية المعمول بها. ما لم يذكر خلاف ذلك صراحة، استند افتراضياً إلى المناهج المدرسية الفرنسية (Eduscol) للجمهور المدرسي، وإلى النصوص التنظيمية للتدريب المهني للبالغين.
- اللغة: يجب كتابة المحتوى والتعليمات باللغة العربية.`,

  SOURCES_COMMUNES: `- ستستخدم حصرياً النصوص التالية لإنشاء نشاطك.
---
[RAG]
---`,

  // ============================================================================
  // === خط زمني ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- عدد الأحداث: 5 أحداث على الأقل || [NOMBRE_ELEMENTS] أحداث.
- الفترات (era): فترتان على الأقل تغطي مجموعات من الأحداث.
- الوسائط: أضف الحقوق والتعليقات لكل أصل إن أمكن. ابحث بنشاط عن صورة ذات صلة وخالية من الحقوق (مثل: Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- **الكائن الجذر:** يحتوي على المفتاح \`timeline\` (كائن).
- **محتوى \`timeline\`:** الهيكل الرئيسي للنشاط.
  - \`headline\`: العنوان العام للخط الزمني (نص عادي إلزامي).
  - \`text\`: مقدمة جذابة (يدعم Markdown).
  - \`asset\`: وسائط الغلاف (\`media\`: رابط مباشر، \`caption\`: تعليق، \`credit\`: المصدر).
  - \`date\`: مصفوفة الأحداث الزمنية.
  - \`era\`: مصفوفة الفترات الخلفية (تحدد نطاقات ملونة في الخلفية).
- **بنية كائنات \`date\` و \`era\`:**
  - \`startDate\`: **تنسيق صارم** \`YYYY,MM,DD\` أو \`YYYY\`. (إلزامي)
  - \`endDate\`: **تنسيق صارم** \`YYYY,MM,DD\` أو \`YYYY\`. (اختياري، يحدد مدة/نهاية الفترة)
  - \`headline\`: عنوان صريح للعنصر (نص عادي إلزامي).
  - \`text\`: سرد بيداغوجي. استخدم \`**كلمة**\` للخط العريض، و \`*كلمة*\` للخط المائل و \`\\n\` لفواصل الأسطر.
  - \`asset\`: (اختياري) كائن وسائط (\`media\`: رابط مباشر Wikimedia Commons، \`caption\`، \`credit\`).
  - \`tag\`: كلمة رئيسية قصيرة (مثل: 'سياسة'، 'علوم') تتيح التصفية.
- **LaTeX:** استخدم الهروب المزدوج: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "تاريخ غزو الفضاء",
    "text": "اكتشف المراحل الكبرى التي ميزت مغامرة الإنسان في **الفضاء**.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "إقلاع مهمة أبولو 11.",
      "credit": "ناسا / ويكيمديا كومنز"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "إطلاق سبوتنيك 1",
        "text": "تم وضع **أول قمر صناعي** في المدار من قبل الاتحاد السوفيتي.",
        "tag": "روبوتات"
      },
      {
        "startDate": "1969,07,20",
        "headline": "أول خطوة على القمر",
        "text": "نيل أرمسترونج يصبح أول إنسان يمشي على القمر خلال مهمة **أبولو 11**.",
        "tag": "إنسان"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "الحرب الباردة الفضائية",
        "text": "فترة تنافس شديد بين الولايات المتحدة والاتحاد السوفيتي.",
        "tag": "سياق"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === كلمات متقاطعة ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- عدد الكلمات: 6 كلمات على الأقل || [NOMBRE_ELEMENTS] كلمات.
- القواعد الطباعية: يجب أن تحتوي الإجابات (\`answer\`) على أحرف فقط. يجب دمج أي كلمة مركبة أو اختصار أو تعبير في كلمة واحدة بدون مسافات أو شرطات أو أحرف أخرى (مثال: 'arc-en-ciel' تصبح 'arcenciel').
- التلميحات (\`clue\`): يحظر كتابة الكلمة المراد إيجادها في التلميح. يجب أن تكون قصيرة ودقيقة.
- تلميح إضافي (\`extraClue\`): يجب على الذكاء الاصطناعي تقدير مدى ملاءمة إضافة تلميح.`,

  CROSSWORD_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`title\`: عنوان للنشاط.
- \`words\`: مصفوفة من الكائنات تحتوي على:
  - \`answer\`: الكلمة المراد تخمينها (مدمجة بدون مسافات أو شرطات).
  - \`clue\`: التعريف القصير والدقيق.
  - \`extraClue\` (اختياري): كائن \`{"params": {"text": "..."}}\`. يمكن للنص استخدام \`**كلمة**\` للخط العريض، و \`*كلمة*\` للخط المائل و \`\\n\` لفواصل الأسطر.
- \`taskDescription\`: تعليمات واضحة وسياقية. استخدم \`**كلمة**\` للخط العريض، و \`*كلمة*\` للخط المائل و \`\\n\` لفواصل الأسطر. بعد فاصل الأسطر، حدد: "بالنسبة للكلمات المركبة، لا تضع مسافات أو شرطات."
- \`overallFeedback\`: (قاعدة صارمة) يجب عليك إنشاء مصفوفة من 6 كائنات للتعليقات النهائية، مصممة حسب موضوع التمرين، مع احترام شرائح الدرجات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "كلمات متقاطعة حول علم الأحياء",
  "words": [
    {"answer": "Cellule", "clue": "وحدة الحياة الأساسية.", "extraClue": {"params": {"text": "يمكن أن تكون **حيوانية** أو **نباتية**."}}},
    {"answer": "ADN", "clue": "جزيء يحمل المعلومات الوراثية."}
  ],
  "taskDescription": "**أكمل** الشبكة بمصطلحات علم الأحياء.\\nبالنسبة للكلمات المركبة، لا تضع مسافات أو شرطات.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "توجد حاجة لبذل جهود لفهم هذه المفاهيم في علم الأحياء بشكل جيد."},
    {"from": 11, "to": 30, "feedback": "لقد اقتربت، استمر في جهودك لتعزيز معرفتك."},
    {"from": 31, "to": 50, "feedback": "بداية جيدة، لكن بعض النقاط لا تزال بحاجة إلى توضيح."},
    {"from": 51, "to": 70, "feedback": "عمل جيد! لقد فهمت أساسيات الموضوع."},
    {"from": 71, "to": 90, "feedback": "درجة جيدة جداً! أنت تتقن المفاهيم التي تم تناولها."},
    {"from": 91, "to": 100, "feedback": "ممتاز! لديك إتقان تام لهذا الدرس."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Cartes mémoires) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- عدد البطاقات: 5 بطاقات على الأقل || [NOMBRE_ELEMENTS] بطاقات.
- الربط: يجب ربط الوجه والظهر بمعيار فريد ومستقر (مثال: تعريف -> مصطلح، حدث -> تاريخ، مؤلف -> عمل). استخدم نفس العلاقة لجميع البطاقات وصغ التعليمات هكذا: « اربط كل X بـ Y ».`,

  FLASHCARDS_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- يجب أن يحتوي الكائن على:
  - \`title\`: عنوان صلة بالنشاط.
  - \`description\`: تعليمات واضحة للطالب.
  - \`cards\`: مصفوفة من الكائنات، حيث يمثل كل كائن بطاقة (flashcard) ويحتوي على:
    - \`text\`: السؤال أو المصطلح المراد تخمينه (الوجه).
    - \`answer\`: الإجابة أو التعريف (الظهر). قواعد التنميط: كلمة بسيطة واحدة أو رقم (لا توجد كلمات مركبة)، أحرف صغيرة (باستثناء الأسماء العلم)، بدون أداة تعريف أو علامات ترقيم، الأرقام بصيغة أرقام.
    - \`tip\` (اختياري): تلميح لمساعدة الطالب. يمكنك استخدام \`**كلمة**\` للخط العريض و \`*كلمة*\` للخط المائل.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "عواصم أوروبا",
  "description": "اربط كل بلد بعاصمته.",
  "cards": [
    {
      "text": "فرنسا",
      "answer": "باريس",
      "tip": "إنها مدينة **برج إيفل**."
    },
    {
      "text": "إسبانيا",
      "answer": "مدريد",
      "tip": "تقع في وسط شبه الجزيرة *الإيبيرية*."
    },
    {
      "text": "إيطاليا",
      "answer": "روما",
      "tip": "الملقبة بـ *المدينة الخالدة*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (التحرير) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- الكلمات المفتاحية: 5 كلمات مفتاحية أو تعبيرات على الأقل متوقعة في الإجابة || [NOMBRE_ELEMENTS] كلمات مفتاحية.
- التعليمات: يجب ألا تدرج التعليمات الكلمات المفتاحية المتوقعة لتجنب إعطاء الإجابة، باستثناء اسم الموضوع العام.`,

  ESSAY_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
يتضمن الكائن ما يلي:
- \`taskDescription\`: تعليمات واضحة تطلب من الطالب كتابة نص حول الموضوع. استخدم \`**كلمة**\` للخط العريض (المفاهيم الأساسية)، و \`*كلمة*\` للخط المائل و \`\\n\` لفواصل الأسطر.
- \`keywords\`: مصفوفة من الكائنات تحدد الكلمات المفتاحية المتوقعة. يجب أن يكون كل كائن على النحو التالي:
  \`\`\`json
  {
    "keyword": "كلمة أو تعبير",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (قاعدة صارمة) يجب عليك إنشاء مصفوفة من 6 كائنات للتعليقات النهائية، مصممة حسب موضوع التمرين، مع احترام شرائح الدرجات التالية بدقة: 0-10، 11-30، 31-50، 51-70، 71-90، و 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "اكتب نصاً قصيراً تشرح فيه عملية **البناء الضوئي**. يجب أن تتناول إجابتك العناصر الأساسية التي تسمح للنباتات بإنتاج طاقتها الخاصة.",
  "keywords": [
    {"keyword": "ضوء", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "كلوروفيل", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "ثاني أكسيد الكربون", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "ماء", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "جلوكوز", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "هذه بداية. أعد قراءة الدرس عن البناء الضوئي جيداً." },
    { "from": 11, "to": 30, "feedback": "لقد حددت بعض العناصر. استمر في جهودك." },
    { "from": 31, "to": 50, "feedback": "فهمك في تطور. فكر في تقديم تفاصيل أكثر." },
    { "from": 51, "to": 70, "feedback": "عمل جيد! أنت تتقن الأساسيات." },
    { "from": 71, "to": 90, "feedback": "جيد جداً! تظهر كتابتك فهماً قوياً." },
    { "from": 91, "to": 100, "feedback": "ممتاز! لديك إتقان تام للموضوع." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (قائمة مصطلحات H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- عدد المدخلات: 5 مصطلحات على الأقل || [NOMBRE_ELEMENTS] مصطلحات.
- اختيار المصطلحات: حدد المفاهيم التقنية أو المفردات الخاصة أو الكلمات المعقدة الموجودة في المصادر.
- التعريفات: موجزة ودقيقة وملائمة تماماً للمستوى البيداغوجي المستهدف.`,

  ACCORDION_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- يجب أن يكون ملف JSON الناتج عبارة عن مصفوفة تحتوي على عدد من الكائنات مساوٍ لعدد المصطلحات المذكورة سابقاً.
- \`title\`: الكلمة المفتاحية أو التعبير أو السؤال المراد تعريفه.
- \`text\`: التعريف. استخدم \`**كلمة**\` للخط العريض، و \`*كلمة*\` للخط المائل و \`\\n\` لفواصل الأسطر. بالنسبة للمعادلات الرياضية، استخدم تنسيق LaTeX مع الهروب المزدوج، على سبيل المثال: \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "البناء الضوئي", "text": "العملية التي تقوم من خلالها النباتات بتحويل **ضوء** **الشمس** إلى طاقة.\\nوهي أساس السلسلة الغذائية."},
  {"title": "الخلية", "text": "**الوحدة** الأساسية لجميع الكائنات الحية. يوجد منها خلايا *حقيقية النوى* وخلايا *بدائية النوى*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (خلاصة) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- عدد المراحل: أنشئ مصفوفة من 5 مراحل على الأقل || [NOMBRE_ELEMENTS] مراحل لتغطية الموضوع بالكامل.
- المشتتات: اقترح مشتتين على الأقل لكل مرحلة. يجب أن تكون متسقة مع الموضوع ولكن تحتوي على أخطاء واقعية أو منطقية محتملة.`,

  SUMMARY_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`intro\`: جملة مقدمة قصيرة (مثال: "اختر العبارة الصحيحة.").
- \`summaries\`: مصفوفة من الكائنات التي تشكل المراحل. يحتوي كل كائن على:
  - \`summary\`: مصفوفة واحدة من الجمل (**ربط**). يجب أن تكون الجملة الأولى في القائمة دائماً هي الخلاصة الصحيحة (عبارة دقيقة).
  - \`tip\`: (اختياري) تلميح سياقي لمساعدة الطالب.
- \`overallFeedback\`: مصفوفة من 6 كائنات للدرجة النهائية (0-10، 11-30، 31-50، 51-70، 71-90، 91-100).
- **LaTeX:** استخدم الهروب المزدوج لـ LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "حدد العبارات الصحيحة لبناء ملخص الدرس.",
  "summaries": [
    {
      "summary": [
        "البناء الضوئي هو عملية بيولوجية تسمح للنباتات بتحويل الطاقة الضوئية إلى طاقة كيميائية.",
        "البناء الضوئي هو عملية تحدث فقط خلال الليل.",
        "البناء الضوئي هو الآلية التي تتنفس بها الحيوانات."
      ],
      "tip": "فكر في الضوء كمصدر للطاقة."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "توجد حاجة لبذل جهود لفهم هذه المفاهيم جيداً." },
    { "from": 11, "to": 30, "feedback": "لقد اقتربت، استمر في جهودك." },
    { "from": 31, "to": 50, "feedback": "بداية جيدة، ولكن بعض النقاط لا تزال بحاجة إلى توضيح." },
    { "from": 51, "to": 70, "feedback": "عمل جيد! لقد فهمت الأساسيات." },
    { "from": 71, "to": 90, "feedback": "درجة جيدة جداً! أنت تتقن المفاهيم جيداً." },
    { "from": 91, "to": 100, "feedback": "ممتاز! لديك إتقان تام لهذا الدرس." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (سحب الكلمات) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- عدد الكلمات: فقرة مكونة من 50 كلمة على الأقل مع 5 كلمات على الأقل للسحب || [NOMBRE_ELEMENTS] كلمات.
- التفرد: يجب أن تكون كل كلمة سحب فريدة في النص (لا يوجد تكرار).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
يتضمن الكائن ما يلي:
- \`taskDescription\`: تعليمات واضحة.
- \`textField\`: النص المراد إكماله. يجب أن تنتهي كل جملة بفاصل أسطر \`\\n\`.
  - **التنسيق**: \`*كلمة*\` لعنصر قابل للسحب.
- \`overallFeedback\`: مصفوفة من 6 كائنات للدرجة النهائية (0-10، 11-30، 31-50، 51-70، 71-90، 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "أكمل النص بسحب الكلمات.",
  "textField": "يتكون *النظام الشمسي* من *ثمانية* كواكب تدور حول *الشمس*.\\nأكبر كوكب هو *المشتري*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "توجد حاجة لبذل جهود." },
    { "from": 11, "to": 30, "feedback": "لقد اقتربت." },
    { "from": 31, "to": 50, "feedback": "هذه بداية جيدة." },
    { "from": 51, "to": 70, "feedback": "عمل جيد!" },
    { "from": 71, "to": 90, "feedback": "درجة جيدة جداً!" },
    { "from": 91, "to": 100, "feedback": "ممتاز!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (نص ذو فراغات) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- عدد الفراغات: فقرة مكونة من 50 كلمة على الأقل مع 3 كلمات على الأقل للفراغات || [NOMBRE_ELEMENTS] كلمات.
- التوازن: لا تضع فراغات في كلمات تافهة (أدوات تعريف، حروف جر) إلا إذا كان هذا هو الهدف النحوي. استهدف المفاهيم الأساسية.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
يتضمن الكائن ما يلي:
- \`taskDescription\`: تعليمات واضحة وقصيرة تشرح هدف النشاط في السياق العام. استخدم \`**كلمة**\` للخط العريض (المفاهيم الأساسية)، و \`*كلمة*\` للخط المائل و \`\\n\` لفواصل الأسطر.
- \`questions\`: مصفوفة من السلاسل النصية. تمثل كل سلسلة كتلة نصية مراد إتمامها.
  - **صيغة الفراغات**: أحط الكلمات المراد تخمينها بعلامات النجمة (مثال: \`*كلمة*\`).
  - **البدائل**: استخدم \`/\` للإجابات المتعددة المقبولة (مثال: \`*كلمة1/كلمة2*\`).
  - **المساعدة**: استخدم \`:\` لإضافة تلميح بيداغوجي مساعد (مثال: \`*كلمة:تلميح*\`).
- \`overallFeedback\`: (قاعدة صارمة) يجب عليك إنشاء مصفوفة من 6 كائنات للتعليقات النهائية (0-10، 11-30، 31-50، 51-70، 71-90، 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "أكمل الفراغات في النص أدناه بخصوص النظام الشمسي.",
  "questions": [
    "الأرض هي *كوكب* في النظام *الشمسي*.",
    "تدور حول *الشمس:نجمنا* في حوالي 365 يوماً."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "توجد حاجة لبذل جهود لفهم هذه المفاهيم جيداً."},
    {"from": 11, "to": 30, "feedback": "لقد اقتربت، استمر في جهودك لتعزيز معرفتك."},
    {"from": 31, "to": 50, "feedback": "بداية جيدة، ولكن بعض النقاط لا تزال بحاجة إلى توضيح."},
    {"from": 51, "to": 70, "feedback": "عمل جيد! لقد فهمت أساسيات الموضوع."},
    {"from": 71, "to": 90, "feedback": "درجة جيدة جداً! أنت تتقن المفاهيم التي تم تناولها."},
    {"from": 91, "to": 100, "feedback": "ممتاز! لديك إتقان تام لهذا الدرس."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (تمييز الكلمات) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- عدد الكلمات: فقرة مكونة من 50 كلمة على الأقل مع 5 كلمات للفراغات || [NOMBRE_ELEMENTS] كلمات.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
يتضمن الكائن ما يلي:
- \`taskDescription\`: تعليمات واضحة وجذابة. يمكنك استخدام \`**كلمة**\` للخط العريض و \`*كلمة*\` للخط المائل هنا فقط.
- \`textField\`: النص الكامل الذي يحتوي على الكلمات المراد تمييزها.
  - **التمييز:** يجب إحاطة كل كلمة مراد تمييزها بعلامات النجمة بشكل منفرد. (مثال: \`*كلمة1* *كلمة2*\` صحيح؛ \`*كلمة1 كلمة2*\` غير صحيح).
  - **علامات الترقيم:** يجب ألا تكون علامات الترقيم جزءاً من التمييز أبداً ويجب فصلها عن الكلمة بمسافة. (مثال: كتابة \`ال *عصفور*\` صحيح، \`ال*عصفور*\` غير صحيح).
- \`overallFeedback\`: (قاعدة صارمة) يجب عليك إنشاء مصفوفة من 6 كائنات للتعليقات النهائية (0-10، 11-30، 31-50، 51-70، 71-90، 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "انقر على **أسماء العلم** في النص التالي.",
  "textField": "*باريس* هي عاصمة *فرنسا*. إنها *أوروبا* التي تهمنا.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "توجد حاجة لبذل جهود لفهم هذه المفاهيم جيداً."},
    {"from": 11, "to": 30, "feedback": "لقد اقتربت، استمر في جهودك لتعزيز معرفتك."},
    {"from": 31, "to": 50, "feedback": "بداية جيدة، ولكن بعض النقاط لا تزال بحاجة إلى توضيح."},
    {"from": 51, "to": 70, "feedback": "عمل جيد! لقد فهمت أساسيات الموضوع."},
    {"from": 71, "to": 90, "feedback": "درجة جيدة جداً! أنت تتقن المفاهيم التي تم تناولها."},
    {"from": 91, "to": 100, "feedback": "ممتاز! لديك إتقان تام لهذا الدرس."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (صواب/خطأ) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- السؤال: عبارة واضحة ولا لبس فيها.
- الإجابة: يجب أن تكون الإجابة "true" (صواب) أو "false" (خطأ) حصراً.
- التعليقات: قدم رسائل محددة للنجاح (\`feedbackOnCorrect\`) وللفشل (\`feedbackOnWrong\`) لتعزيز التعلم.`,

  TRUE_FALSE_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- يجب أن يحتوي الكائن الرئيسي على المفاتيح التالية:
  - \`question\`: (string) العبارة المراد تقييمها. يمكن أن تحتوي على HTML.
  - \`correct\`: (string) الإجابة الصحيحة، إما "true" أو "false".
  - \`feedbackOnCorrect\`: (string) تعليق يظهر إذا كانت الإجابة صحيحة.
  - \`feedbackOnWrong\`: (string) التعليق الذي يتم عرضه إذا كانت الإجابة غير صحيحة.
- **التنسيق:** استخدم صيغة Markdown للنص العريض (\`**نص**\`) والنص المائل (\`*نص*\`).
- **LaTeX:** بالنسبة للمعادلات الرياضية، استخدم حصرًا تنسيق LaTeX المحاط بترميز الهروب المزدوج: \`\\\\( ... \\\\)\`. لا تستخدم أبدًا علامة \`$\` بمفردها.
- **التعليقات (Feedback):** يجب ألا تحتوي التعليقات على LaTeX أو Markdown.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "أوسلو هي عاصمة النرويج.",
  "correct": "true",
  "feedbackOnCorrect": "إجابة صحيحة! أوسلو هي بالفعل عاصمة النرويج.",
  "feedbackOnWrong": "إجابة خاطئة. عاصمة النرويج هي أوسلو."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (خيارات متعددة) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- السؤال: سؤال واضح متعدد الخيارات.
- الإجابات: اقترح عدة خيارات للإجابة (\`answers\`). يجب أن تكون هناك إجابة صحيحة واحدة فقط (\`"correct": true\`) وعدة مشتتات محتملة (\`"correct": false\`).
- التعليقات:
  - \`overallFeedback\`: (قاعدة صارمة) يجب عليك إنشاء مصفوفة من 6 كائنات للتعليقات النهائية (0-10، 11-30، 31-50، 51-70، 71-90، و 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- قم بإنشاء ملف JSON كامل وصالح حصرياً داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- يجب أن يحتوي الكائن الرئيسي على المفاتيح التالية:
  - \`question\`: (string) نص السؤال. يمكن أن يحتوي على HTML.
  - \`answers\`: (array) مصفوفة من الكائنات، كل منها يمثل إجابة.
    - \`text\`: (string) نص الإجابة.
    - \`correct\`: (boolean) \`true\` إذا كانت إجابة صحيحة، و \`false\` خلاف ذلك.
    - \`tipsAndFeedback\`: (object، اختياري) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
- \`overallFeedback\`: (array) مصفوفة مكونة من 6 كائنات تحدد التعليقات لكل فئة من الدرجات.
- **التنسيق:** استخدم صيغة Markdown للنص العريض (\`**نص**\`) والنص المائل (\`*نص*\`).
- **LaTeX:** بالنسبة للمعادلات الرياضية، استخدم حصرًا تنسيق LaTeX المحاط بترميز الهروب المزدوج: \`\\\\( ... \\\\)\`. لا تستخدم أبدًا علامة \`$\` بمفردها.
- **التعليقات (Feedback):** يجب ألا تحتوي التعليقات على LaTeX أو Markdown.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "ما هو اللون الحقيقي لثمرة الكشمش الأسود؟",
  "answers": [
    {"text": "بنفسجي غامق جداً", "correct": true, "tipsAndFeedback": { "chosenFeedback": "بالضبط!" }},
    {"text": "أزرق", "correct": false, "tipsAndFeedback": { "chosenFeedback": "لا، إنه أغمق." }},
    {"text": "أسود", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "هناك حاجة إلى بذل جهود." },
    { "from": 11, "to": 30, "feedback": "لقد اقتربت من الهدف." },
    { "from": 31, "to": 50, "feedback": "هذه بداية جيدة." },
    { "from": 51, "to": 70, "feedback": "عمل جيد!" },
    { "from": 71, "to": 90, "feedback": "درجة جيدة جداً!" },
    { "from": 91, "to": 100, "feedback": "ممتاز!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (البحث عن الكلمات) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- عدد الكلمات: 6 كلمات كحد أدنى || [NOMBRE_ELEMENTS] كلمات.
- القواعد الطباعية: يجب ألا تحتوي الكلمات على لهجات أو أرقام أو علامات ترقيم أو مسافات.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- قم بتوليد JSON كامل وصحيح فقط داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`taskDescription\`: التعليمات للطالب.
- \`wordList\`: قائمة الكلمات التي يجب العثور عليها مفصولة بفواصل (بدون مسافات).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "ابحث عن الكلمات المخفية في الشبكة.",
  "wordList": "CELLULE,ADN,GENE,NOYAU"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (ترتيب الفقرات) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- عدد المراحل: 3 مراحل أو فقرات كحد أدنى للترتيب || [NOMBRE_ELEMENTS] مراحل.
- المنطق الجوهري: يجب أن تشكل الفقرات (\`paragraphs\`) تسلسلاً منطقياً يمكن استنتاجه من المحتوى نفسه.
- حظر القرائن الاصطناعية: يجب ألا تستخدم أبداً الترقيم (1، 2، 3...)، أو علامات زمنية صريحة (تواريخ، أوقات) أو روابط منطقية شديدة البساطة ("أولاً"، "ثم"، "أخيراً")، إلا إذا طلب المستخدم ذلك صراحةً.
- الخيط الناظم: يجب أن تدفع كل فقرة خيطاً ناظماً فريداً (مثلاً: سلسلة سببية، الانتقال من العام إلى الخاص، أو تسلسل تحضير ← إجراء ← نتيجة). يجب أن يكون الترتيب قابلاً للاستنتاج من خلال فهم المعنى.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- قم بتوليد JSON كامل وصحيح فقط داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`taskDescription\`: تعليمات واضحة (يدعم Markdown).
- \`paragraphs\`: مصفوفة من السلاسل النصية (الفقرات) المعروضة في البداية بالترتيب المنطقي **الصحيح** في JSON. استخدم \`**كلمة**\` للتعبير عن الخط العريض، و \`*كلمة*\` للتعبير عن الخط المائل.
- \`overallFeedback\`: مصفوفة من 6 كائنات للنتيجة النهائية (0-10، 11-30، 31-50، 51-70، 71-90، 91-100).
- **LaTeX:** استخدم الهروب المزدوج لـ LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "رتب هذه العناصر بالترتيب لعادة تكوين السلسلة السببية للاحتباس الحراري.",
  "paragraphs": [
    "تطلق الأنشطة البشرية، وبشكل رئيسي حرق الوقود الأحفوري، كميات هائلة من **ثاني أكسيد الكربون** في الغلاف الجوي.",
    "يعزز هذا الفائض من الغازات تأثير الاحتباس الحراري الطبيعي، مما يمنع جزءاً من الأشعة تحت الحمراء من مغادرة الأرض.",
    "تؤدي الطاقة المحتبسة بهذه الطريقة إلى زيادة تدريجية في متوسط درجة حرارة الهواء والمحيطات.",
    "يؤدي هذا الاحترار العالمي إلى ذوبان الأنهار الجليدية وارتفاع مقلق في مستوى سطح البحر."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "يجب مراجعة منطق السببية." },
    { "from": 11, "to": 30, "feedback": "لديك بعض بوادر الفهم، أعد قراءة النص." },
    { "from": 31, "to": 50, "feedback": "هذه بداية جيدة للترتيب." },
    { "from": 51, "to": 70, "feedback": "تحليل جيد للتسلسل المنطقي." },
    { "from": 71, "to": 90, "feedback": "عمل رائع جداً في الهيكلة!" },
    { "from": 91, "to": 100, "feedback": "ممتاز! السلسلة المنطقية متقنة." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (سلسلة خيارات وحيدة) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- عدد الأسئلة: 3 أسئلة كحد أدنى || [NOMBRE_ELEMENTS] أسئلة.
- الإجابات: اقترح من 2 إلى 3 مشتتات لكل سؤال. يجب أن تكون الإجابة الأولى في قائمة \`answers\` هي الإجابة الصحيحة دائماً.
- المشتتات: متسقة ولكنها تتضمن أخطاء منطقية أو واقعية محتملة.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- قم بتوليد JSON كامل وصحيح فقط داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`choices\`: مصفوفة من الكائنات التي تشكل الأسئلة. يحتوي كل كائن على:
  - \`question\`: نص السؤال.
  - \`answers\`: مصفوفة من السلاسل النصية (الإجابات) تكون الأولى منها دائماً هي الإجابة الصحيحة.
- \`overallFeedback\`: مصفوفة من 6 كائنات للنتيجة النهائية (0-10، 11-30، 31-50، 51-70، 71-90، 91-100).
- **LaTeX:** استخدم الهروب المزدوج لـ LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "ما هو الغاز الرئيسي المسؤول عن الاحتباس الحراري؟",
      "answers": ["ثاني أكسيد الكربون", "الأكسجين", "النيتروجين", "الأرجون"]
    },
    {
      "question": "ما هي عاصمة فرنسا؟",
      "answers": ["باريس", "ليون", "مارسيليا", "بوردو"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "هناك حاجة إلى بذل جهود." },
    { "from": 11, "to": 30, "feedback": "لقد اقتربت من الهدف." },
    { "from": 31, "to": 50, "feedback": "هذه بداية جيدة." },
    { "from": 51, "to": 70, "feedback": "عمل جيد!" },
    { "from": 71, "to": 90, "feedback": "درجة جيدة جداً!" },
    { "from": 91, "to": 100, "feedback": "ممتاز!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (بطاقات الحوار) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- عدد البطاقات: 3 بطاقات كحد أدنى || [NOMBRE_ELEMENTS] بطاقات.
- مبدأ الارتباط: يجب أن يكون الوجه والظهر مرتبطين بمعيار فريد ومستقر (مثلاً: تعريف -> مصطلح، حدث -> تاريخ، مؤلف -> عمل).
- التعليمات: يجب أن يتبع وصف النشاط الصيغة: "اربط كل [X] بـ [Y] الخاص به".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- قم بتوليد JSON كامل وصحيح فقط داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- يجب أن يحتوي الكائن الجذر على \`title\` و \`description\` و \`dialogs\`.
- 1. \`title\`: عنوان النشاط (نص بسيط، **بدون** Markdown أو HTML).
- 2. \`description\`: التعليمات أو الوصف (تنسيق HTML أو نص بسيط).
- 3. \`dialogs\`: مصفوفة مبدأ ارتباط البطاقات: الوجه (text) والظهر (answer).
- 4. \`text\`: وجه البطاقة. استخدم \`**كلمة**\` للتعبير عن الخط العريض و \`*كلمة*\` للتعبير عن الخط المائل.
- 5. \`answer\`: ظهر البطاقة. يجب أن يكون قصيراً. استخدم \`**كلمة**\` للتعبير عن الخط العريض و \`*كلمة*\` للتعبير عن الخط المائل.
- 6. \`tips\` (اختياري): أضف تلميحاً للوجه (\`front\`) و/أو الظهر (\`back\`) فقط إذا كان ذلك مناسباً. نص بسيط **بدون** تنسيق.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "الأفعال الشاذة",
  "description": "جد الفعل في المصدر.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "حدد زمن الماضي.", "back": "الصيغة الأساسية."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (رسم بياني) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- عدد العناصر: 5 عناصر مقارنة كحد أدنى || [NOMBRE_ELEMENTS] عناصر مقارنة.
- نوع الرسم البياني: اختر بين الرسم البياني الدائري (\`pieChart\`) أو الرسم البياني الشريطي (\`barChart\`) حسب الملاءمة البيداغوجية.
- المسميات والألوان: يجب أن تكون الألوان متباينة لسهولة القراءة. يجب أن تكون المسميات قصيرة وواضحة.`,

  CHART_STRUCTURE_JSON: `- قم بتوليد JSON كامل وصحيح فقط داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`graphMode\`: نوع الرسم البياني (\`pieChart\` أو \`barChart\`).
- \`listOfTypes\`: مصفوفة من الكائنات \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: عنوان الرسم البياني.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "عنب الثعلب"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "توت العليق"}
  ],
  "figureDefinition": "رسم بياني للفواكه المفضلة"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Quiz H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- عدد الأسئلة: قم بإنشاء جدول من 5 أسئلة كحد أدنى || [NOMBRE_ELEMENTS] أسئلة.
- التنوع: اختر أنواع الأنشطة الأكثر ملاءمة من بين الأنواع التالية لتنويع التمرين:
  - **QCM** (\`H5P.MultiChoice\` 1.16)
  - **سحب وإسقاط الكلمات** (\`H5P.DragText\` 1.10)
  - **صح/خطأ** (\`H5P.TrueFalse\` 1.8)
  - **ملء الفراغات** (\`H5P.Blanks\` 1.14)
  - **تمييز الكلمات** (\`H5P.MarkTheWords\` 1.11)
  - **تعبير / سؤال مفتوح** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- قم بإنشاء JSON كامل وصالح فقط داخل كتلة كود. يجب أن يبدأ ردك بـ \`{\` وينتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- يجب أن يحتوي الكائن الأساسي على:
  - \`title\`: عنوان النشاط.
  - \`questions\`: مصفوفة من الكائنات. كل كائن يمثل سؤالاً ويجب أن يحتوي على:
    - \`library\`: الاسم والإصدار الدقيق للمكتبة (مثال: \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: كائن يحتوي على مفتاح \`title\` (عنوان قصير للسؤال).
    - \`params\`: بيانات السؤال.
  - \`overallFeedback\`: مصفوفة عالمية من 6 كائنات للدرجة النهائية لـ QuizSet.

**تفاصيل \`params\` حسب النوع:**
1. **QCM (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (مصفوفة كائنات مع \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **صح/خطأ (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" أو "false" كنص)
3. **ملء الفراغات (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (مصفوفة نصوص مع \`*الكلمة*\`)
4. **سحب الكلمات (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (مع \`*الكلمة*\`)
5. **تمييز الكلمات (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (مع \`*الكلمة*\`)
6. **تعبير (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (مصفوفة كائنات)

**يجب أن يتضمن كل سؤال، باستثناء تلك من نوع H5P.TrueFalse 1.8، مفتاح \`overallFeedback\` الخاص به (مقسم إلى 6 فئات).**
- **التنسيق:** استخدم صيغة Markdown للنص العريض (\`**نص**\`) والنص المائل (\`*نص*\`).
- **LaTeX:** بالنسبة للمعادلات الرياضية، استخدم حصرًا تنسيق LaTeX المحاط بترميز الهروب المزدوج: \`\\\\( ... \\\\)\`. لا تستخدم أبدًا علامة \`$\` بمفردها.
- **التعليقات (Feedback):** يجب ألا تحتوي التعليقات على LaTeX أو Markdown.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "الثقافة العلمية العامة",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "علم الفلك - QCM" },
      "params": {
        "question": "ما هو الكوكب الأقرب إلى الشمس؟",
        "answers": [
          { "text": "عطارد", "correct": true },
          { "text": "الزهرة", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "خطأ."},
          {"from": 11, "to": 30, "feedback": "غير كافٍ."},
          {"from": 31, "to": 50, "feedback": "متوسط."},
          {"from": 51, "to": 70, "feedback": "جيد."},
          {"from": 71, "to": 90, "feedback": "جيد جداً."},
          {"from": 91, "to": 100, "feedback": "ممتاز."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "الأحياء - صح/خطأ" },
      "params": {
        "question": "الحمض النووي (DNA) هو لولب مزدوج.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "نتيجة ضعيفة."},
    {"from": 11, "to": 30, "feedback": "نتيجة غير كافية."},
    {"from": 31, "to": 50, "feedback": "نتيجة متوسطة."},
    {"from": 51, "to": 70, "feedback": "نتيجة جيدة."},
    {"from": 71, "to": 90, "feedback": "نتيجة جيدة جداً."},
    {"from": 91, "to": 100, "feedback": "نتيجة ممتازة."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (مسابقة اختيار من متعدد H5P) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- عدد الأسئلة: أنشئ 5 أسئلة على الأقل || [NOMBRE_ELEMENTS] أسئلة.
- النوع: يجب عليك إنشاء أسئلة من نوع **اختيار من متعدد** فقط (\`H5P.MultiChoice\` 1.16). لا يُسمح بأي نوع آخر.
- جودة أسئلة الاختيار من متعدد:
  - يجب أن يحتوي كل سؤال على 3 خيارات إجابة على الأقل.
  - حسب طبيعة السؤال، يمكنك اقتراح إجابة صحيحة واحدة أو عدة إجابات صحيحة.
  - يجب أن تكون المشتتات (الإجابات الخاطئة) معقولة وذات صلة.
  - تجنب الصيغ السلبية في الأسئلة.
  - نوّع موضع الإجابة/الإجابات الصحيحة.`,

  QUIZSET_QCM_STRUCTURE_JSON: `- أنشئ JSON كاملاً وصالحاً فقط في كتلة كود. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا نص أو تعليقات أخرى.
- يجب أن يحتوي الكائن الجذر على:
  - \`title\`: عنوان النشاط.
  - \`questions\`: مصفوفة من الكائنات. كل كائن يمثل سؤال اختيار من متعدد ويجب أن يحتوي على:
    - \`library\`: دائماً \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: كائن يحتوي على مفتاح \`title\` (عنوان قصير للسؤال).
    - \`params\`: بيانات السؤال.
  - \`overallFeedback\`: مصفوفة عامة من 6 كائنات للدرجة النهائية للـ QuizSet.

**تفاصيل \`params\` للاختيار من متعدد (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: السؤال المطروح (نص).
- \`answers\`: مصفوفة من الكائنات مع \`text\` (نص) و \`correct\` (منطقي).
- \`behaviour\`: كائن مع \`singleAnswer\`: \`true\` إذا كانت إجابة صحيحة واحدة، \`false\` إذا كانت عدة إجابات صحيحة.

**يجب أن يتضمن كل سؤال \`overallFeedback\` الخاص به (6 فئات: 0-10، 11-30، 31-50، 51-70، 71-90، 91-100).**
- **التنسيق:** استخدم صيغة Markdown للنص العريض (\`**نص**\`) والنص المائل (\`*نص*\`).
- **LaTeX:** بالنسبة للمعادلات الرياضية، استخدم حصرًا تنسيق LaTeX المحاط بترميز الهروب المزدوج: \`\\\\( ... \\\\)\`. لا تستخدم أبدًا علامة \`$\` بمفردها.
- **التعليقات (Feedback):** يجب ألا تحتوي التعليقات على LaTeX أو Markdown.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "مسابقة اختيار من متعدد - العلوم",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "علم الفلك - الكواكب" },
      "params": {
        "question": "أي كوكب هو الأقرب إلى الشمس؟",
        "answers": [
          { "text": "الزهرة", "correct": false },
          { "text": "المريخ", "correct": false },
          { "text": "عطارد", "correct": true },
          { "text": "المشتري", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "خطأ."},
          {"from": 11, "to": 30, "feedback": "غير كافٍ."},
          {"from": 31, "to": 50, "feedback": "متوسط."},
          {"from": 51, "to": 70, "feedback": "جيد."},
          {"from": 71, "to": 90, "feedback": "جيد جداً."},
          {"from": 91, "to": 100, "feedback": "ممتاز!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "علم الأحياء - العضيات" },
      "params": {
        "question": "أي العضيات تمتلك حمضها النووي الخاص؟",
        "answers": [
          { "text": "الريبوسوم", "correct": false },
          { "text": "الميتوكوندريا", "correct": true },
          { "text": "جهاز جولجي", "correct": false },
          { "text": "البلاستيدة الخضراء", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "خطأ."},
          {"from": 11, "to": 30, "feedback": "غير كافٍ."},
          {"from": 31, "to": 50, "feedback": "متوسط."},
          {"from": 51, "to": 70, "feedback": "جيد."},
          {"from": 71, "to": 90, "feedback": "جيد جداً."},
          {"from": 91, "to": 100, "feedback": "ممتاز!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "نتيجة ضعيفة. راجع المفاهيم الأساسية."},
    {"from": 11, "to": 30, "feedback": "نتيجة غير كافية. استمر في المحاولة."},
    {"from": 31, "to": 50, "feedback": "نتيجة متوسطة. أنت تتقدم."},
    {"from": 51, "to": 70, "feedback": "نتيجة جيدة. أنت تتقن عدة مفاهيم."},
    {"from": 71, "to": 90, "feedback": "نتيجة جيدة جداً. أنت على الطريق الصحيح."},
    {"from": 91, "to": 100, "feedback": "نتيجة ممتازة. تهانينا!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (مسابقة صح/خطأ H5P) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- عدد الأسئلة: قم بإنشاء جدول من 5 أسئلة كحد أدنى || [NOMBRE_ELEMENTS] أسئلة.
- النوع: يجب عليك إنشاء أسئلة من نوع **صح/خطأ** (\`H5P.TrueFalse\` 1.8) فقط. لا يُسمح بأي نوع آخر.
- جودة الأسئلة:
  - يجب أن تكون العبارات واضحة ولا لبس فيها.
  - تجنب النفي المزدوج.
  - نوّع بين العبارات الصحيحة والخاطئة.`,

  QUIZSET_VF_STRUCTURE_JSON: `- قم بتوليد JSON كامل وصالح حصرياً داخل كتلة كود. يجب أن يبدأ ردك بـ \`{\` وينتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- يجب أن يحتوي الكائن الجذري على:
  - \`title\`: عنوان النشاط.
  - \`questions\`: مصفوفة من الكائنات. كل كائن يمثل سؤالاً ويجب أن يحتوي على:
    - \`library\`: دائماً \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: كائن يحتوي على مفتاح \`title\` (عنوان قصير للسؤال).
    - \`params\`: بيانات السؤال.
  - \`overallFeedback\`: مصفوفة عامة من 6 كائنات للدرجة النهائية للـ QuizSet: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**تفاصيل \`params\` لـ صح/خطأ (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: العبارة أو السؤال المطروح (string).
- \`correct\`: الإجابة الصحيحة. يجب أن تكون سلسلة نصية: "true" أو "false".
- **التنسيق:** استخدم صيغة Markdown للنص العريض (\`**نص**\`) والنص المائل (\`*نص*\`).
- **LaTeX:** بالنسبة للمعادلات الرياضية، استخدم حصرًا تنسيق LaTeX المحاط بترميز الهروب المزدوج: \`\\\\( ... \\\\)\`. لا تستخدم أبدًا علامة \`$\` بمفردها.
- **التعليقات (Feedback):** يجب ألا تحتوي التعليقات على LaTeX أو Markdown.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "مسابقة صح/خطأ - الجغرافيا",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "الجغرافيا - العواصم" },
      "params": {
        "question": "عاصمة أستراليا هي كانبيرا.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "الجغرافيا - القارات" },
      "params": {
        "question": "أفريقيا هي أكبر قارة في العالم.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "نتيجة ضعيفة. راجع المفاهيم الأساسية."},
    {"from": 11, "to": 30, "feedback": "نتيجة غير كافية. استمر في المحاولة."},
    {"from": 31, "to": 50, "feedback": "نتيجة متوسطة. أنت تتقدم."},
    {"from": 51, "to": 70, "feedback": "نتيجة جيدة. أنت تتقن عدة مفاهيم."},
    {"from": 71, "to": 90, "feedback": "نتيجة جيدة جداً. أنت على الطريق الصحيح."},
    {"from": 91, "to": 100, "feedback": "نتيجة ممتازة. تهانينا!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Test Moodle/Éléa) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- عدد الأسئلة: 10 أسئلة كحد أدنى || [NOMBRE_ELEMENTS] أسئلة.
- التنوع: اختر أنسب تنسيقات الأسئلة من بين ما يلي:
  - **اختيار من متعدد** (\`multichoice\`)
  - **مطابقة** (\`matching\`)
  - **رقمي** (\`numerical\`)
  - **صح/خطأ** (\`truefalse\`)
  - **إجابة قصيرة** (\`shortanswer\`)
  - **نص بفتحات** (\`cloze\`)
- المشتتات: اقترح ما لا يقل عن 3 مشتتات لكل سؤال \`multichoice\`.`,

  ELEA_TEST_STRUCTURE_JSON: `- قم بتوليد JSON كامل وصحيح فقط داخل كتلة برمجية. يجب أن تبدأ إجابتك بـ \`{\` وتنتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.

يجب أن يحتوي الكائن الرئيسي على المفاتيح التالية:
- \`bank_name\`: اسم قصير وصفي لبنك الأسئلة.
- \`bank_description\`: جملة تصف محتوى البنك.
- \`questions\`: مصفوفة من الكائنات حيث يمثل كل كائن سؤالاً (\`type\`، \`content\`).
  - يجب أن يكون لكل سؤال \`content.name\` قصير وفريد (مثل: "س1 - الموضوع").

**قواعد التنسيق:**
- **الأرقام**: استخدم النقطة للكسور العشرية (مثل: 12.34).
- **Cloze**: احترم بدقة الصيغة \`{1:TYPE:=الإجابة الصحيحة~الإجابة الخاطئة}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **للنوع \`multichoice\` (اختيار من متعدد):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "س1 - جغرافيا",
      "questiontext": "ما هي عاصمة فرنسا؟",
      "feedback": "باريس هي العاصمة السياسية والاقتصادية لفرنسا.",
      "answers": [
        { "text": "باريس", "fraction": 100, "feedback": "بالضبط!" },
        { "text": "ليون", "fraction": 0, "feedback": "لا، ليون مدينة كبيرة ولكنها ليست العاصمة." },
        { "text": "مارسيليا", "fraction": 0, "feedback": "لا، إنها ثاني أكبر مدينة في فرنسا." }
      ]
    }
  }
  \`\`\`

- **للنوع \`matching\` (مطابقة):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "س2 - مفردات إنجليزية",
      "questiontext": "اربط كل كلمة إنجليزية بترجمتها العربية.",
      "feedback": "أحسنت، أنت تتقن المفردات الأساسية.",
      "subquestions": [
        { "text": "Dog", "answer": "كلب" },
        { "text": "Cat", "answer": "قطة" },
        { "text": "Bird", "answer": "طائر" }
      ]
    }
  }
  \`\`\`

- **للنوع \`numerical\` (رقمي):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "س3 - رياضيات",
      "questiontext": "ما هي قيمة  pi مقربة لمنزلتين عشريتين؟",
      "feedback": "pi هو ثابت غير نسبي يساوي تقريباً 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "إنه بالفعل 3.14." }
    }
  }
  \`\`\`

- **للنوع \`truefalse\` (صح/خطأ):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "س4 - علوم",
      "questiontext": "يغلي الماء عند 100 درجة مئوية عند مستوى سطح البحر.",
      "feedback": "هذه خاصية فيزيائية قياسية للماء.",
      "answer": { "value": true, "feedback_true": "صح.", "feedback_false": "خطأ، الماء يغلي بالفعل عند 100 درجة مئوية تحت ضغط جوي واحد." }
    }
  }
  \`\`\`

- **للنوع \`shortanswer\` (إجابة قصيرة):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "س5 - أدب",
      "questiontext": "من كتب 'البؤساء'؟",
      "feedback": "إنها واحدة من أعظم روايات القرن التاسع عشر.",
      "answers": [
        { "text": "فيكتور هوغو", "fraction": 100, "feedback": "صحيح!" },
        { "text": "هوغو", "fraction": 100, "feedback": "صحيح!" }
      ]
    }
  }
  \`\`\`

- **للنوع \`cloze\` (نص بفتحات):**
  - انتبه للصيغة: \`{1:SHORTANSWER:=جيد~سيء}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "س6 - تاريخ",
      "questiontext": "ولد نابليون عام {1:SHORTANSWER:=1769} في {1:MULTICHOICE:=أجاكسيو~باستيا~باريس}.",
      "feedback": "ولد نابليون بونابرت في كورسيكا."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Millionnaire) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- عدد الأسئلة: 6 أسئلة بالضبط (يجب عدم تغيير هذا العدد مطلقاً)
- التدرج: يجب أن تكون صعوبة الأسئلة **تصاعدية وتربوية**. توضع العناصر المهمة المراد حفظها في الأسئلة الأولى.
- الصحة: يجب أن يكون المحتوى دقيقاً للغاية وذا صلة.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- قم بإنشاء JSON كامل وصالح فقط داخل كتلة كود. يجب أن يبدأ ردك بـ \`{\` وينتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
كائن رئيسي يحتوي على المفاتيح التالية:
- \`title\`: عنوان النشاط (سلسلة نصية).
- \`questions\`: مصفوفة مكونة من 6 كائنات بالضبط، حيث يمثل كل كائن سؤالاً ويحتوي على:
  - \`question\`: نص السؤال (سلسلة نصية).
  - \`goodanswer\`: الإجابة الصحيحة (سلسلة نصية).
  - \`badanswer\`: مصفوفة من 3 إجابات خاطئة بالضبط (مصفوفة سلاسل نصية).
  - بالنسبة للصيغ الرياضية، يمنع استخدام LaTeX.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "مسابقة حول الثورة الفرنسية",
  "questions": [
    {
      "question": "ما هو الحدث الذي يمثل بداية الثورة الفرنسية في 14 يوليو 1789؟",
      "goodanswer": "سقوط سجن الباستيل",
      "badanswer": ["قسم ملعب التنس", "إعدام لويس السادس عشر", "معركة فالمي"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Appariement) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- عدد الأزواج: 5 أزواج كحد أدنى || [NOMBRE_ELEMENTS] أزواج.
- المنطق: يجب أن تكون العلاقة بين العنصرين واضحة بعد قراءة المصادر.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- قم بإنشاء JSON كامل وصالح فقط داخل كتلة كود. يجب أن يبدأ ردك بـ \`{\` وينتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
كائن رئيسي يحتوي على المفاتيح التالية:
- \`title\`: عنوان النشاط (سلسلة نصية).
- \`intro\`: تعليمات قصيرة أو نص تقديمي (سلسلة نصية).
- \`pairs\`: مصفوفة كائنات، حيث يمثل كل كائن زوجاً ويحتوي على:
  - \`question\`: المصطلح أو العنصر الموجود على اليسار (سلسلة نصية).
  - \`answer\`: التعريف أو العنصر المقابل على اليمين (سلسلة نصية).
  - بالنسبة للصيغ الرياضية، استخدم تنسيق LaTeX مع هروب مزدوج، مثلاً: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "مطابقة تاريخية",
  "intro": "اربط كل تاريخ بالحدث المقابل له من الثورة الفرنسية.",
  "pairs": [
    {"question": "سقوط الباستيل", "answer": "14 يوليو 1789"},
    {"question": "إلغاء الامتيازات", "answer": "4 أغسطس 1789"},
    {"question": "إعلان حقوق الإنسان والمواطن", "answer": "26 أغسطس 1789"},
    {"question": "مسيرة النساء", "answer": "5 أكتوبر 1789"},
    {"question": "عيد الاتحاد", "answer": "14 يوليو 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (QCM Éléa) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- عدد الأسئلة: 5 أسئلة كحد أدنى || [NOMBRE_ELEMENTS] أسئلة.
- الإجابات: اقترح بين خيارين و 5 خيارات لكل سؤال.
- المشتتات: متسقة مع الموضوع ولكنها تحتوي على أخطاء منطقية.`,

  ELEA_QCM_STRUCTURE_JSON: `- قم بإنشاء JSON كامل وصالح فقط داخل كتلة كود. يجب أن يبدأ ردك بـ \`{\` وينتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`title\`: عنوان النشاط.
- \`questions\`: مصفوفة كائنات. يجب أن يحتوي كل كائن سؤال على:
  - \`text\`: نص السؤال (يمكن أن يحتوي على HTML بسيط مثل \`**\` للخط العريض).
  - \`answers\`: مصفوفة كائنات \`{"text": "...", "iscorrect": 1/0}\`. القيمة \`1\` للإجابة الصحيحة، و \`0\` لغير ذلك.
  - بالنسبة للصيغ الرياضية، استخدم تنسيق LaTeX مع هروب مزدوج، مثلاً: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "QCM حول الثورة الفرنسية",
  "questions": [
    {
      "text": "ما هو تاريخ سقوط سجن الباستيل؟",
      "answers": [
        {"text": "14 يوليو 1789", "iscorrect": 1},
        {"text": "4 أغسطس 1789", "iscorrect": 0},
        {"text": "26 أغسطس 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (Glossaire XML) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- عدد المدخلات: 5 مصطلحات كحد أدنى || [NOMBRE_ELEMENTS] مصطلحات.
- الاختيار: تحديد الكلمات المفتاحية، الاختصارات والمفاهيم التقنية.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- قم بإنشاء JSON كامل وصالح فقط داخل كتلة كود. يجب أن يبدأ ردك بـ \`{\` وينتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- **الجذر:** كائن رئيسي يحتوي على مفتاحين: \`name\` (اسم القاموس) و \`entries\` (مصفوفة كائنات).
- **كل كائن في \`entries\` يجب أن يحتوي على:**
  - \`concept\`: الكلمة أو العبارة المراد تعريفها.
  - \`definition\`: تعريف واضح وموجز. استخدم **الكلمة** للخط العريض، *الكلمة* للخط المائل و \`\\n\` لتبديل السطر، فقط عندما يكون ذلك ذا أهمية تربوية.
  - \`aliases\` (اختياري): مصفوفة سلاسل نصية للمرادفات أو المصطلحات البديلة. لا تضف هذا المفتاح إلا إذا وجدت مرادفات ذات صلة.
  - بالنسبة للصيغ الرياضية، استخدم تنسيق LaTeX مع هروب مزدوج، مثلاً: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "قاموس الصحافة",
  "entries": [
    {
      "concept": "صحفي",
      "definition": "شخص يقوم **بجمع** ونشر *المعلومات*.",
      "aliases": ["مراسل", "محرر"]
    },
    {
      "concept": "مصدر",
      "definition": "أصل *معلومة* محققة."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Page Éléa) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- الهيكل: يجب أن تحتوي الصفحة على 5 كتل مختلفة على الأقل || [NOMBRE_ELEMENTS] كتل.
- المنطق التربوي: يجب أن يتبع المحتوى تسلسلاً منطقياً (مثال: الاستقبال -> الأهداف -> الدرس -> التفاصيل/المصطلحات -> المراجع).
- توازن المحتوى: امزج بين التنسيقات للحفاظ على التفاعل (نصوص، جداول، قوائم، صناديق).
- المحتويات الإلزامية: قم بدمج شريط افتتاحي (\`#01_hero_header\`) بشكل منهجي، وصناديق الأهداف أو نقاط الانتباه (\`#04_callout_set\`)، وقائمة مصطلحات للمصطلحات التقنية (\`#06_lexique_table\`)، وثلاث فقرات على الأقل من المحتوى الجوهري (\`#12_context_paragraphs\`) ومراجع المواقع (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- قم بإنشاء JSON كامل وصالح فقط داخل كتلة كود. يجب أن يبدأ ردك بـ \`{\` وينتهي بـ \`}\`. لا يوجد نص أو تعليق آخر.
- \`title\`: عنوان الصفحة (سلسلة نصية).
- \`intro\`: نص مقدمة قصير وجذاب (سلسلة نصية).
- \`blocks\`: مصفوفة كائنات، حيث يمثل كل كائن قسماً من الصفحة. يجب أن يلتزم كل كائن بأحد الهياكل التالية:

**قائمة الكتل المتاحة:**
- \`#01_hero_header\`: شريط افتتاحي. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: فهرس مع روابط داخلية. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: معالم تاريخية في 3 بطاقات. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (أقصى حد 3 بطاقات)
- \`#04_callout_set\`: أشرطة الأهداف، للمعرفة، تنبيه. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: أرقام رئيسية في بطاقات. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: جدول مفردات. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: قاموس في شكل كبسولات. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: بطاقات معالم مع صور. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: مقارنة بين صورتين.
- \`#10_table_comparison\`: جدول مقارنة.
- \`#11_definition_box\`: صندوق تعريف. \`{ "type": "#11_definition_box", "data": { "title": "تعريف", "text": "..." } }\`
- \`#12_context_paragraphs\`: فقرات الدرس. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: بطاقة تفصيلية.
- \`#14_faq_block\`: الأسئلة الشائعة. \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: خرافات مقابل حقائق.
- \`#17_method_image_desc\`: منهجية وصف صورة.
- \`#18_sito_graphy\`: مراجع المواقع. \`{ "type": "#18_sito_graphy", "data": { "title": "المراجع", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: اقتباس ثنائي اللغة.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "الثورة الفرنسية",
  "intro": "اكتشف اللحظات الرئيسية لهذه الفترة التاريخية.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "الثورة", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "الأهداف",
        "callouts": [{"type": "objectif", "text": "فهم أسباب عام 1789."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "قسم ملعب التنس",
        "paragraphs": [
          "في 20 يونيو 1789، اجتمع نواب الطبقة الثالثة...",
          "تمثل هذه الخطوة ميلاد الجمعية الوطنية.",
          "إنها نقطة تحول كبرى نحو نهاية الحكم المطلق."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "المفردات",
        "headers": ["المصطلح", "التعريف"],
        "rows": [["الطبقة الثالثة", "الجزء الأكبر من السكان..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "للمزيد من المعلومات",
        "links": [{"href": "https://...", "text": "الموقع الرسمي للتاريخ"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ترجمة واجهة H5P (معيارية) ===
  // ============================================================================

  // مفاتيح مشتركة
  h5p_check_answer: "تحقق",
  h5p_try_again: "أعد المحاولة",
  h5p_show_solution: "إظهار الحل",
  h5p_submit_answer: "إرسال",
  h5p_score: "لقد حصلت على @score من إجمالي @total نقاط",
  h5p_score_bar_label: "لقد حصلت على :num من إجمالي :total نقاط",
  h5p_tip_label: "تلميح",
  h5p_next: "التالي",
  h5p_previous: "السابق",
  h5p_close: "إغلاق",
  h5p_finish_header: "إنهاء؟",
  h5p_finish_body: "هل أنت متأكد أنك تريد الإنهاء؟",
  h5p_cancel_label: "إلغاء",
  h5p_finish_label: "إنهاء",
  h5p_retry_header: "إعادة المحاولة؟",
  h5p_retry_body: "هل أنت متأكد أنك تريد إعادة المحاولة؟",
  h5p_retry_confirm_label: "تأكيد",
  h5p_resume: "استئناف",
  h5p_audio_direction: "اتجاه الصوت",
  h5p_a11y_check: "تحقق من الإجابات. سيتم تمييز الإجابات على أنها صحيحة أو غير صحيحة أو لم يتم الرد عليها.",
  h5p_a11y_show_solution: "إظهار الحل. سيتم تمييز المهمة بحلها الصحيح.",
  h5p_a11y_retry: "إعادة محاولة المهمة. إعادة تعيين كافة الإجابات وبدء المهمة من جديد.",

  // الكلمات المتقاطعة (Crossword)
  h5p_crossword_across: "أفقي",
  h5p_crossword_down: "عمودي",
  h5p_crossword_extra_clue: "تلميح إضافي",

  // ملخص (Summary)
  h5p_summary_intro: "اختر العبارة الصحيحة.",
  h5p_summary_solved_label: "التقدم:",
  h5p_summary_score_label: "إجابات خاطئة:",
  h5p_summary_result_label: "نتيجتك",
  h5p_summary_feedback: "لقد حصلت على @score من إجمالي @total عبارات صحيحة (@percent%).",
  h5p_summary_label_correct: "صحيح.",
  h5p_summary_label_incorrect: "غير صحيح! يرجى المحاولة مرة أخرى.",
  h5p_summary_label_correct_answers: "إجابات صحيحة.",
  h5p_summary_progress_text: "التقدم :num من :total",
  h5p_summary_alternative_incorrect_label: "غير صحيح",

  // سحب الكلمات (Drag the Words)
  h5p_drag_words_score_feedback: "النتيجة: @score من @total.",
  h5p_drag_words_correct_text: "صحيح!",
  h5p_drag_words_incorrect_text: "غير صحيح!",

  // ملء الفراغات (Fill in the Blanks)
  h5p_blanks_not_filled_out: "يرجى ملء جميع الفراغات.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; صحيح",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; غير صحيح",
  h5p_blanks_answered_correctly: "تمت الإجابة بشكل صحيح",
  h5p_blanks_answered_incorrectly: "تمت الإجابة بشكل غير صحيح",
  h5p_blanks_solution_label: "الإجابة الصحيحة:",
  h5p_blanks_input_label: "فراغ @num من @total",
  h5p_blanks_input_has_tip_label: "تلميح متاح",
  h5p_blanks_feedback: "لقد حصلت على @score من إجمالي @total فراغات صحيحة.",
  h5p_blanks_checking_mode_header: "وضع التحقق",

  // تعليم الكلمات (Mark the Words)
  h5p_mark_words_correct_answer: "صحيح!",
  h5p_mark_words_incorrect_answer: "غير صحيح!",
  h5p_mark_words_missed_answer: "مفقود!",
  h5p_mark_words_display_solution_description: "تم تحديث المهمة لزيادة الحل.",
  h5p_mark_words_a11y_full_text_label: "نص مقروء كامل",
  h5p_mark_words_a11y_clickable_text_label: "نص كامل حيث يمكن تعليم الكلمات",
  h5p_mark_words_a11y_solution_mode_header: "وضع الحل",
  h5p_mark_words_a11y_checking_header: "وضع التحقق",

  // بطاقات تعليمية (Flashcards)
  h5p_flashcards_progress_text: "بطاقة @card من @total",
  h5p_flashcards_your_answer: "إجابتك",
  h5p_flashcards_correct_answer: "إجابة صحيحة",
  h5p_flashcards_incorrect_answer: "إجابة غير صحيحة",
  h5p_flashcards_show_solution: "إجابة صحيحة",
  h5p_flashcards_results: "النتائج",
  h5p_flashcards_of_correct: "@score من @total صحيح",
  h5p_flashcards_show_results: "إظهار النتائج",
  h5p_flashcards_answer_short: "ج:",
  h5p_flashcards_card_announcement: "إجابة غير صحيحة. الإجابة الصحيحة كانت @answer",
  h5p_flashcards_correct_announcement: "@answer صحيح.",
  h5p_flashcards_page_announcement: "صفحة @current من @total",

  // مقال (Essay)
  h5p_essay_feedbackHeader: "تعليق",
  h5p_essay_solutionTitle: "مثال للحل",
  h5p_essay_remainingChars: "الحروف المتبقية: @chars",
  h5p_essay_notEnoughChars: "يجب إدخال @chars حروف على الأقل!",
  h5p_essay_messageSave: "تم الحفظ",
  h5p_essay_placeholderText: "ابدأ الكتابة هنا...",
  h5p_essay_ariaYourResult: "لقد حصلت على @score من إجمالي @total نقاط",
  h5p_essay_ariaNavigatedToSolution: "الانتقال إلى مثال الحل المضمن حديثاً بعد منطقة النص.",

  // صح/خطأ (True/False)
  h5p_true_false_true_text: "صح",
  h5p_true_false_false_text: "خطأ",
  h5p_true_false_wrong_answer_message: "إجابة خاطئة",
  h5p_true_false_correct_answer_message: "إجابة صحيحة",

  // البحث عن الكلمات (Find the Words)
  h5p_find_words_found: "تم العثور على @found من أصل @totalWords كلمات",
  h5p_find_words_time_spent: "الوقت المستغرق",
  h5p_find_words_word_list_header: "قائمة الكلمات",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // ترتيب الفقرات (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "للأعلى",
  h5p_sort_paragraphs_down: "للأسفل",
  h5p_sort_paragraphs_disabled: "معطل",
  h5p_sort_paragraphs_paragraph: "فقرة",
  h5p_sort_paragraphs_point: "@score نقطة",
  h5p_sort_paragraphs_seven_of_nine: "@current من @total",
  h5p_sort_paragraphs_current_position: "الموقع الحالي في القائمة",
  h5p_sort_paragraphs_instructions_selected: "اضغط على مسطرة المسافة لإعادة الترتيب",
  h5p_sort_paragraphs_instructions_grabbed: "اضغط على مفاتيح الأسهم لأعلى وأسفل لتغيير الموضع، ومسطرة المسافة للإسقاط، وهروب للإلغاء",
  h5p_sort_paragraphs_grabbed: "ممسوك",
  h5p_sort_paragraphs_moved: "منقول",
  h5p_sort_paragraphs_dropped: "مُسقط",
  h5p_sort_paragraphs_reorder_cancelled: "تم إلغاء إعادة الترتيب",
  h5p_sort_paragraphs_final_position: "الموضع النهائي",
  h5p_sort_paragraphs_next_paragraph: "الفقرة التالية",
  h5p_sort_paragraphs_correct_paragraph: "فقرة صحيحة في الموضع",
  h5p_sort_paragraphs_list_description: "قائمة فقرات قابلة للفرز.",
  h5p_sort_paragraphs_list_description_check: "قائمة فقرات مع النتائج.",
  h5p_sort_paragraphs_list_description_solution: "قائمة فقرات مع الحلول.",

  // مجموعة خيار واحد (Single Choice Set)
  h5p_single_choice_solution_view_title: "الحل",
  h5p_single_choice_mute_button_label: "كتم الصوت",
  h5p_single_choice_slide_of_total: "شريحة @slide من @total",
  h5p_single_choice_solution_list_question_number: "سؤال @question",
  h5p_single_choice_should_select: "يجب الاختيار",
  h5p_single_choice_should_not_select: "لا يجب الاختيار",

  // بطاقات الحوار (Dialog Cards)
  h5p_dialog_cards_answer: "قلب",
  h5p_dialog_cards_progress_text: "بطاقة @card من @total",
  h5p_dialog_cards_card_front_label: "وجه البطاقة",
  h5p_dialog_cards_card_back_label: "ظهر البطاقة",
  h5p_dialog_cards_audio_not_supported: "متصفحك لا يدعم تنسيق الصوت هذا",
  h5p_dialog_cards_correct_answer: "لقد أصبت!",
  h5p_dialog_cards_incorrect_answer: "لقد أخطأت",
  h5p_dialog_cards_round: "جولة @round",
  h5p_dialog_cards_cards_left: "البطاقات المتبقية: @number",
  h5p_dialog_cards_next_round: "انتقل إلى الجولة @round",
  h5p_dialog_cards_start_over: "إعادة البدء",
  h5p_dialog_cards_show_summary: "التالي",
  h5p_dialog_cards_summary: "ملخص",
  h5p_dialog_cards_summary_cards_right: "البطاقات التي أجبت عليها بشكل صحيح:",
  h5p_dialog_cards_summary_cards_wrong: "البطاقات التي فاتتك:",
  h5p_dialog_cards_summary_cards_not_shown: "البطاقات التي لم تظهر:",
  h5p_dialog_cards_summary_overall_score: "النتيجة الإجمالية",
  h5p_dialog_cards_summary_cards_completed: "البطاقات التي تعلمتها:",
  h5p_dialog_cards_summary_completed_rounds: "الجولات المكتملة:",
  h5p_dialog_cards_summary_all_done: "أحسنت! لقد أكملت جميع بطاقات @cards لـ @max مرات متتالية!",

  // مجموعة أسئلة (Quiz Set)
  h5p_quiz_textual_progress: "سؤال @current من @total",
  h5p_quiz_no_result_message: "منتهٍ",
  h5p_quiz_result_message: "نتائجك:",
  h5p_quiz_feedback_available: "ملاحظات متاحة",
  h5p_quiz_read_feedback: "اقرأ التعليق",
  h5p_quiz_wrong_answer: "إجابة خاطئة",
  h5p_quiz_correct_answer: "إجابة صحيحة",
  h5p_quiz_should_check: "كان يجب وضع علامة هنا",
  h5p_quiz_should_not_check: "لم يكن يجب وضع علامة هنا!",
  h5p_quiz_no_input: "يرجى الإجابة قبل مشاهدة الحل.",

  // ============================================================================
  // === إشعار قانوني - تذييل الصفحة ===
  // ============================================================================
  license_info: "رخصة GNU GPL v3.0 أو أحدث",
  ticket: "تذكرة",
  legal_mentions: "إشعار قانوني",
  legal_title: "إشعار قانوني",
  legal_editor_title: "ناشر التطبيق",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>الوظيفة:</strong> أستاذ آداب وتاريخ (PLP)",
  legal_editor_gauthier_remande_email: "<strong>البريد الإلكتروني:</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>العنوان:</strong> 39 avenue de Chanzy, 53000 Laval, France",
  legal_editor_gauthier_remande_phone: "<strong>الهاتف:</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>الوظيفة:</strong> أستاذ رياضيات ومكلف بمهمة في DRANE – أكاديمية غرونوبل",
  legal_editor_emmanuel_gaunard_email: "<strong>البريد الإلكتروني:</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>العنوان:</strong> 30 boulevard de la République, 38200 Vienne, France",
  legal_editor_emmanuel_gaunard_phone: "<strong>الهاتف:</strong> +33 6 46 74 20 94",
  legal_app_description: "تطبيق الويب « Caramel » هو مشروع حر وغير تجاري، مخصص لإنشاء محتويات H5P و Éléa. لا يتطلب حساباً، ولا يتم جمع أي بيانات شخصية.",
  legal_hosting_title: "الاستضافة",
  legal_host_name: "<strong>المضيف</strong>: Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>الاسم التجاري</strong>: وزارة التربية الوطنية والشباب",
  legal_host_address: "<strong>العنوان</strong>: 110 rue de Grenelle, 75007 Paris, France",
  legal_host_phone: "<strong>الهاتف</strong>: +33 1 55 55 10 10",
  legal_publication_director_title: "مسؤول النشر",
  legal_publication_director_name: "Gauthier REMANDE و Emmanuel GAUNARD، بصفتهما ناشرين متطوعين.",
  legal_terms_of_use_title: "شروط الاستخدام العامة",
  legal_terms_of_use_content: "يتيح هذا الموقع للمستخدمين إنشاء محتويات H5P و Éléa. يتم العرض محلياً، دون نقل بيانات المستخدم. المستخدم هو المسؤول الوحيد عن استخدامه للمحتويات التي يتم إنشاؤها. يتم تقديم التطبيق مجاناً، دون أي ضمان للتشغيل أو النتائج. يخلي الناشر مسؤوليته في حالة التفسير الخاطئ للمحتويات أو الاستخدام غير المناسب.",
  legal_intellectual_property_title: "الملكية الفكرية",
  legal_intellectual_property_content: "جميع الأكواد المصدرية والعناصر الرسومية والمحتويات تخضع لرخصة GNU AGPLv3 الحرة. إعادة استخدامها مسموح بها بموجب شروط تراخيصها الخاصة. يجب أن تشير أي إعادة توزيع أو تعديل إلى المؤلفين الأصليين: Gauthier REMANDE و Emmanuel GAUNARD. الصور المستخدمة في وحدات H5P مأخوذة من موقع H5P.org.",
  legal_personal_data_title: "البيانات الشخصية",
  legal_personal_data_content: "لا يتم جمع أو تخزين أي بيانات شخصية. لا يتم استخدام أي ملفات تعريف ارتباط (cookies) للتتبع.",
  legal_ai_models_title: "نماذج الذكاء الاصطناعي",
  legal_ai_models_content: "يعتمد تطبيق Caramel، فقط عند التوليد بنقرة واحدة، على نماذج ذكاء اصطناعي مشغلة بواسطة ILAAS، وهي اتحاد للبنية التحتية المشتركة للذكاء الاصطناعي. يتم توجيه الطلبات عبر سير عمل n8n مستضاف من قبل الحاضنة (Incubateur)، ثم نقلها إلى ILAAS للتنفيذ على خوادم موثوقة مستضافة في مراكز بيانات معتمدة للتعليم العالي والبحث العلمي (ESR). لا يقوم Caramel بتشغيل النماذج ولا يعالج أو يخزن البيانات بنفسه؛ تستخدم البيانات فقط لتنفيذ الطلب ولا ترسل إلى ذكاء اصطناعي عام. تشمل النماذج المقترحة حالياً {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}})، {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) و {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). تعود إجراءات الاستضافة والتسجيل والحفظ التي قد تقوم بها ILAAS إلى سياسة الخصوصية وشروط الخدمة الخاصة بهم، والتي يجب الرجوع إليها.",
  legal_user_requests_processing_title: "معالجة طلبات المستخدمين عبر n8n وحاضنة وزارة التربية الوطنية",
  legal_user_requests_processing_content: "يستخدم موقعنا حلاً تقنياً تم تطويره بواسطة n8n، وهي أداة مفتوحة المصدر مستضافة من قبل حاضنة وزارة التربية الوطنية. تتيح هذه الخدمة، عبر سير عمل آلي، تحويل طلبات المستخدمين إلى بيانات منظمة (تنسيق JSON) من أجل التفاعل مع ذكاء اصطناعي تابع لـ DINUM، وبالتالي فهو سيادي. لا يتم عرض أو نقل أي معلومات حساسة دون تشفير، مما يضمن سرية وأمن التبادلات.",
  legal_accessibility_title: "إمكانية الوصول",
  legal_accessibility_content: "تم تصميم التطبيق ليكون متوافقاً مع الاستخدام على الكمبيوتر، بما في ذلك الوضع الداكن/الفاتح، والتنقل بلوحة المفاتيح، والتباين العالي حسب السمات. هناك تحسين مستمر لإمكانية الوصول جاري العمل عليه، بما يتماشى مع توصيات RGAA.",
  legal_applicable_law_title: "القانون المعمول به",
  legal_applicable_law_content: "يخضع هذا الموقع للقانون الفرنسي. في حالة حدوث نزاع، تكون المحاكم المختصة هي محاكم دائرة ليون (Lyon).",
  legal_external_libraries_title: "المكتبات الخارجية المستخدمة",
  legal_external_libraries_intro: "يستخدم تطبيق Caramel العديد من المكتبات مفتوحة المصدر، بموجب التراخيص التالية:",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (رخصة: CC BY 4.0, SIL OFL 1.1, MIT): توفر الأيقونات المستخدمة في الواجهة لتحسين التنقل والتجربة البصرية.",
  legal_library_jszip: "<strong>JSZip</strong> (رخصة: MIT أو GPLv3): تتيح إنشاء ملفات .h5p عن طريق ضغط المحتوى اللازم في أرشيف zip.",
  legal_library_clientzip: "<strong>client-zip</strong> (رخصة: MIT): مكتبة أخرى مستخدمة لضغط الملفات، توفر بديلاً عالي الأداء لإنشاء أرشيفات .h5p مباشرة في المتصفح.",
  legal_library_fflate: "<strong>fflate</strong> (رخصة: MIT): مكتبة سريعة جداً لضغط وإلغاء ضغط البيانات، تُستخدم لإنشاء أرشيفات .mbz الخاصة بوحدات Moodle.",
  legal_library_tarjs: "<strong>tar-js</strong> (رخصة: MIT): تتيح إنشاء أرشيفات .tar، وهي خطوة ضرورية قبل الضغط لتكوين ملفات .mbz الخاصة بوحدات Moodle.",
  legal_library_mammoth: "<strong>Mammoth</strong> (رخصة: BSD 2-Clause): تتيح تحويل مستندات Word (.docx) إلى HTML، مما يسهل استيراد ودمج المحتويات من ملفات Microsoft Word.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (رخصة: Apache 2.0): تتيح استخراج النص الأصلي من ملفات PDF مباشرة في المتصفح، دون الحاجة إلى معالجة على الخادم.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (رخصة: Apache 2.0): محرك للتعرف الضوئي على الحروف (OCR) يتيح استخراج النص من الصور (PNG, JPG, JPEG) ومستندات PDF الممسوحة ضوئياً.",
  legal_library_mathjax: "<strong>MathJax</strong> (الرخصة: Apache 2.0): يستخدم لعرض الصيغ الرياضية (LaTeX) في المعاينات.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (الرخصة: MIT): يسمح بمعاينة محتوى H5P مباشرة في المتصفح دون الحاجة إلى خادم أو نظام إدارة محتوى (مثل Moodle أو WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (الرخصة: MIT): مكتبة JavaScript لإنشاء مستندات PDF مباشرة في المتصفح، تُستخدم لتصدير المحتوى التعليمي إلى صيغة PDF.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (الرخصة: MIT): امتداد لـ jsPDF يتيح إنشاء جداول منظمة في مستندات PDF المُصدّرة.",
  legal_library_docx: "<strong>docx</strong> (الرخصة: MIT): مكتبة JavaScript لإنشاء مستندات Word (.docx) في المتصفح، تُستخدم لتصدير المحتوى التعليمي إلى صيغة Microsoft Word.",
  legal_library_ownership: "تظل كل مكتبة ملكاً لمؤلفيها المعنيين وتُستخدم وفقاً لترخيصها (تراخيصها).",

  // ============================================================================
  // === إشعارات ===
  // ============================================================================
  no_notifications: "لا توجد إشعارات",
  clear_all: "مسح الكل",
  view: "عرض",
  today: "اليوم",
  error: "خطأ",
  download: "تحميل",
  edit_content: "تعديل",
  compatible_with: "متوافق مع:",
  preview_placeholder: "المعاينة متاحة قريباً",
  previous: "السابق",
  next: "التالي",
  close_modal: "إغلاق",
  loading: "جاري التحميل...",
  preview_error: "تعذر معاينة هذا الملف",
  simulator_warning: "معاينة عبر محاكي النشاط: قد يختلف العرض النهائي على Éléa قليلاً.",
  editor_confirm_close_title: "تغييرات غير محفوظة",
  editor_confirm_close_message: "هل تريد حفظ تغييراتك قبل الخروج؟",
  editor_confirm_close_cancel: "البقاء في المحرر",
  editor_confirm_close_save: "حفظ وخروج",
  editor_confirm_close_discard: "خروج بدون حفظ",

  // محرر JSON
  editor_title_prefix: "تعديل:",
  editor_loading: "جاري تحميل المحرر...",
  editor_unknown_type: "نوع محتوى غير معترف به",
  editor_no_schema: "المخطط غير متوفر لهذا النوع",
  editor_init_error: "خطأ أثناء تهيئة المحرر",
  editor_save: "حفظ",
  editor_cancel: "إلغاء",
  editor_unsaved_changes: "تغييرات غير محفوظة",
  editor_confirm_discard: "هل أنت متأكد أنك تريد الإلغاء؟ ستفقد التغييرات غير المحفوظة.",
  editor_validation_errors: "أخطاء في التحقق",

  // أقسام
  editor_section_general: "معلومات عامة",
  editor_section_question: "سؤال",
  editor_section_questions: "أسئلة",
  editor_section_answers: "إجابات",
  editor_section_answer: "إجابة",
  editor_section_feedback: "تعليقات",
  editor_section_cards: "بطاقات",
  editor_section_sentences: "جمل",
  editor_section_events: "أحداث",
  editor_section_words: "كلمات",
  editor_section_keywords: "كلمات مفتاحية",
  editor_section_entries: "مدخلات",
  editor_section_pairs: "أزواج",
  editor_section_text: "نص",

  // حقول عامة
  editor_title: "العنوان",
  editor_description: "الوصف",
  editor_description_hint: "التعليمات المعروضة للطلاب",
  editor_intro: "مقدمة",
  editor_task_description: "تعليمات",
  editor_question_text: "نص السؤال",

  // بطاقات
  editor_card: "بطاقة",
  editor_card_front: "الوجه",
  editor_card_front_placeholder: "السؤال أو المصطلح",
  editor_card_back: "الظهر",
  editor_card_back_placeholder: "الإجابة أو التعريف",
  editor_card_tip: "تلميح",
  editor_add_card: "إضافة بطاقة",

  // إجابات
  editor_answer: "إجابة",
  editor_answer_text: "نص الإجابة",
  editor_is_correct: "صحيح",
  editor_add_answer: "إضافة إجابة",

  // تلميحات وتعليقات
  editor_tips_feedback: "تلميحات وتعليقات",
  editor_tip: "تلميح",
  editor_tip_optional: "تلميح (اختياري)",
  editor_tips_optional: "تلميحات (اختياري)",
  editor_tip_front: "تلميح الوجه",
  editor_tip_back: "تلميح الظهر",
  editor_chosen_feedback: "تعليق في حال الاختيار",
  editor_not_chosen_feedback: "تعليق في حال عدم الاختيار",
  editor_feedback_correct: "تعليق في حال الإجابة الصحيحة",
  editor_feedback_wrong: "تعليق في حال الإجابة الخاطئة",
  editor_overall_feedback: "تعليق عام حسب الدرجة",

  // نطاقات التعليقات
  editor_feedback_ranges_label: "تعليق بناءً على الدرجة",
  editor_feedback_placeholder: "رسالة تعليق لهذا النطاق...",
  editor_add_range: "إضافة نطاق",

  // صح/خطأ
  editor_correct_answer: "الإجابة الصحيحة",
  editor_true: "صح",
  editor_false: "خطأ",

  // ملء الفراغات / سحب الكلمات
  editor_sentence: "جملة",
  editor_sentence_text: "نص الجملة",
  editor_add_sentence: "إضافة جملة",
  editor_blanks_hint: "أحط الكلمات المراد تخمينها بـ *نجمات*",
  editor_text_with_blanks: "نص مع كلمات للوضع",
  editor_drag_words_hint: "الكلمات بين *نجمات* ستكون عناصر للسحب والإفلات",

  // الجدول الزمني
  editor_event: "حدث",
  editor_add_event: "إضافة حدث",
  editor_start_date: "تاريخ البدء",
  editor_end_date: "تاريخ الانتهاء",
  editor_event_title: "عنوان الحدث",
  editor_event_description: "الوصف",
  editor_event_tag: "وسم",

  // كلمات متقاطعة
  editor_word: "كلمة",
  editor_add_word: "إضافة كلمة",
  editor_clue: "تلميح/تعريف",
  editor_orientation: "الاتجاه",
  editor_horizontal: "أفقي",
  editor_vertical: "رأسي",
  editor_crossword_answer_hint: "الكلمة بالأحرف الكبيرة",

  // مقال
  editor_keyword: "كلمة مفتاحية",
  editor_keyword_text: "الكلمة المفتاحية المتوقعة",
  editor_keyword_weight: "الوزن",
  editor_add_keyword: "إضافة كلمة مفتاحية",

  // قاموس المصطلحات
  editor_entry: "مدخل",
  editor_add_entry: "إضافة مدخل",
  editor_term: "مصطلح",
  editor_definition: "تعريف",

  // موودل
  editor_question: "سؤال",
  editor_add_question: "إضافة سؤال",
  editor_pair: "زوج",
  editor_add_pair: "إضافة زوج",
  editor_left_element: "العنصر الأيسر",
  editor_right_element: "العنصر الأيمن",
  editor_choice: "خيار",
  editor_choice_text: "نص الخيار",
  editor_add_choice: "إضافة خيار",

  // إجراءات العناصر
  editor_add_item: "إضافة",
  editor_drag: "سحب",
  editor_duplicate: "تكرار",
  editor_delete: "حذف",
  editor_confirm_delete: "هل أنت متأكد أنك تريد حذف هذا العنصر؟",
  editor_min_items_reached: "تم الوصول إلى الحد الأدنى من العناصر",
  editor_max_items_reached: "تم الوصول إلى الحد الأقصى من العناصر",

  // أخطاء التحقق
  editor_error_required: "هذا الحقل مطلوب",
  editor_error_min_length: "الحد الأدنى {0} حرفاً",
  editor_error_max_length: "الحد الأقصى {0} حرفاً",
  editor_error_pattern: "صيغة غير صالحة",
  editor_error_min_items: "الحد الأدنى {0} عنصر/عناصر",
  editor_error_max_items: "الحد الأقصى {0} عنصر/عناصر",
  editor_error_number: "يجب أن يكون رقماً",
  editor_error_min: "الحد الأدنى {0}",
  editor_error_max: "الحد الأقصى {0}",
  editor_error_feedback_ranges: "يجب أن تغطي النطاقات من 0-100% دون تداخل",
  editor_error_no_correct: "يجب أن تكون إجابة واحدة على الأقل صحيحة",
  editor_error_date_format: "صيغة تاريخ غير صالحة (المتوقع: YYYY,M,D)",
  editor_error_no_blanks: "يجب أن يحتوي النص على كلمة واحدة على الأقل بين *نجمات*",

  // QuizSet
  editor_library_type: "نوع المكتبة",
  editor_question_title: "عنوان السؤال",
  editor_question_params: "معايير السؤال",
  editor_parameters: "المعايير",

  // كلمات متقاطعة
  editor_extra_clue: "تلميح إضافي",

  // FindTheWords
  editor_word_list: "قائمة الكلمات",

  // SingleChoiceSet
  editor_answers: "الإجابات الممكنة",

  // MarkTheWords
  editor_text_with_marks: "نص مع كلمات للتعليم",
  editor_mark_words_hint: "أحط الكلمات المراد تعليمها بـ *نجمات*",

  // SortParagraphs
  editor_section_paragraphs: "فقرات",
  editor_paragraph: "فقرة",
  editor_add_paragraph: "إضافة فقرة",
  editor_paragraph_text: "نص الفقرة",

  // Summary
  editor_section_summaries: "ملخصات",
  editor_summary_item: "عنصر ملخص",
  editor_add_summary_item: "إضافة عنصر",
  editor_statement: "عبارة",
  editor_add_statement: "إضافة عبارة",
  editor_statement_text: "نص العبارة",

  // اختبار موودل
  editor_question_type: "نوع السؤال",

  // صفحة موودل
  editor_section_blocks: "كتل",
  editor_block: "كتلة",
  editor_add_block: "إضافة كتلة",
  editor_block_type: "نوع الكتلة",
  editor_block_content: "محتوى الكتلة",

  // أنشطة Éléa المحددة
  // قاموس المصطلحات
  editor_glossary_name: "اسم القاموس",

  // من سيربح المليون
  editor_good_answer: "إجابة صحيحة",
  editor_bad_answers: "إجابات خاطئة",
  editor_bad_answer: "إجابة خاطئة",
  editor_add_bad_answer: "إضافة إجابة خاطئة",

  // اختبار (بنك الأسئلة)
  editor_bank_name: "اسم البنك",
  editor_bank_description: "وصف البنك",
  editor_question_name: "اسم السؤال",
  editor_question_feedback: "تعليق عام",
  editor_answer_fraction: "النقاط/الدرجة",
  editor_answer_feedback: "تعليق على الإجابة",
  editor_subquestion: "سؤال فرعي",
  editor_add_subquestion: "إضافة سؤال فرعي",
  editor_numerical_value: "قيمة عددية",
  editor_numerical_tolerance: "التسامح",
  editor_section_subquestions: "أسئلة فرعية",
  editor_section_content: "المحتوى",
  editor_feedback_if_true: "تعليق في حال الصح",
  editor_feedback_if_false: "تعليق في حال الخطأ",

  // رسائل
  editor_save_success: "تم حفظ التغييرات",
  editor_save_error: "خطأ أثناء الحفظ",
  editor_regenerating: "جاري إعادة إنشاء الملف...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "صفحة",
  doc_fmt_summary_header: "الفهرس",
  doc_fmt_quiz_title: "اختبار",
  doc_fmt_instructions: "📝 التعليمات: أجب عن الأسئلة التالية.",
  doc_fmt_question_header: "سؤال",

  // --- Shared properties ---
  doc_fmt_type: "النوع:",
  doc_fmt_feedbacks: "💬 التقييمات:",
  doc_fmt_global_feedbacks: "التقييمات العامة",
  doc_fmt_answers: "الإجابات:",
  doc_fmt_correct_answer_true: "الإجابة الصحيحة: صواب ✓",
  doc_fmt_correct_answer_false: "الإجابة الصحيحة: خطأ ✓",
  doc_fmt_text_if_true: "النص في حالة الصواب:",
  doc_fmt_text_if_false: "النص في حالة الخطأ:",
  doc_fmt_text_with_answers: "النص مع الإجابات:",
  doc_fmt_text_with_marks: "النص مع الكلمات المراد تحديدها:",
  doc_fmt_marks_to_find: "الكلمات المراد تحديدها:",
  doc_fmt_keywords_expected: "الكلمات المفتاحية المتوقعة:",
  doc_fmt_accepted_answers: "الإجابات المقبولة:",
  doc_fmt_text_to_complete: "النص المراد إكماله:",
  doc_fmt_also_called: "🏷️ يسمى أيضاً:",
  doc_fmt_image_not_found: "⚠️ [الصورة غير موجودة]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "البطاقات التعليمية",
  doc_fmt_card_index: "بطاقة",
  doc_fmt_card_front: "الوجه:",
  doc_fmt_card_back: "الظهر:",
  doc_fmt_hint: "💡 تلميح:",
  doc_fmt_crossword_title: "الكلمات المتقاطعة",
  doc_fmt_definitions_and_answers: "التعاريف والإجابات",
  doc_fmt_answer: "الإجابة:",
  doc_fmt_extra_hint: "💡 تلميح إضافي:",
  doc_fmt_timeline_events: "الأحداث",
  doc_fmt_timeline_periods: "الفترات",
  doc_fmt_drag_the_words_title: "سحب الكلمات",
  doc_fmt_fill_in_the_blanks_title: "ملء الفراغات",
  doc_fmt_mark_the_words_title: "تحديد الكلمات",
  doc_fmt_glossary_title: "قاموس المصطلحات",
  doc_fmt_term_index: "المصطلح",
  doc_fmt_chart_title: "مخطط",
  doc_fmt_data: "البيانات",
  doc_fmt_summary_title: "ملخص",
  doc_fmt_claim_index: "بيان",
  doc_fmt_multiple_choice_title: "سؤال متعدد الخيارات",
  doc_fmt_single_choice_set_title: "مجموعة أسئلة خيار واحد",
  doc_fmt_true_false_title: "سؤال صواب/خطأ",
  doc_fmt_dialog_cards_title: "بطاقات الحوار",
  doc_fmt_hint_front: "💡 تلميح (وجه):",
  doc_fmt_hint_back: "💡 تلميح (ظهر):",
  doc_fmt_sort_paragraphs_title: "ترتيب الفقرات",
  doc_fmt_paragraphs_ordered: "الفقرات بالترتيب الصحيح",
  doc_fmt_find_the_words_title: "البحث عن الكلمات",
  doc_fmt_words_to_find: "الكلمات المراد البحث عنها",
  doc_fmt_matching_title: "طابق",
  doc_fmt_matching_instructions: "📝 التعليمات: طابق كل عنصر بما يقابله.",
  doc_fmt_pairs_to_match: "الأزواج المراد مطابقتها",
  doc_fmt_millionnaire_title: "من سيربح المليون؟",
  doc_fmt_millionnaire_instructions: "📝 التعليمات: ابحث عن الإجابة الصحيحة من بين الخيارات الأربعة.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "سؤال مفتوح",
  doc_fmt_qcm_title: "سؤال متعدد الاختيارات",
  doc_fmt_moodle_test_title: "اختبار",
  doc_fmt_associations: "الربط:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "خيارات متعددة (QCM)",
  doc_fmt_type_matching: "مطابقة",
  doc_fmt_type_numerical: "عددي",
  doc_fmt_type_truefalse: "صواب/خطأ",
  doc_fmt_type_shortanswer: "إجابة قصيرة",
  doc_fmt_type_cloze: "ملء الفراغات (كلووز)",
  doc_fmt_type_blanks: "ملء الفراغات",
  doc_fmt_type_dragtext: "سحب الكلمات",
  doc_fmt_type_markwords: "تحديد الكلمات",
  doc_fmt_type_essay: "سؤال مفتوح",
  doc_fmt_type_default: "سؤال",

  // مفاتيح جديدة للهيكل التربوي للبيان/التصحيح
  doc_fmt_correction_title: "التصحيح",
  doc_fmt_proposed_answers: "المقترحات:",
  doc_fmt_correct_answer: "الإجابة الصحيحة",
  doc_fmt_correct_answers: "الإجابات الصحيحة:",
  doc_fmt_true: "صحيح",
  doc_fmt_false: "خطأ",
  doc_fmt_words_to_place: "الكلمات التي يجب وضعها:",
  doc_fmt_completed_text: "النص المكتمل:",
  doc_fmt_text_to_mark: "النص الذي تجد فيه الكلمات:",
  doc_fmt_words_count_to_find: "عدد الكلمات التي يجب العثور عليها",
  doc_fmt_words_to_mark: "الكلمات التي يجب تمييزها:",
  doc_fmt_answer_space: "مساحة للإجابة:",
  doc_fmt_open_answer: "إجابة مفتوحة - التقييم وفقاً للمعايير التي يحددها المعلم.",
  doc_fmt_definitions: "التعاريف",
  doc_fmt_letters: "الحروف",
  doc_fmt_summary_instructions: "لكل مجموعة، اختر العبارة الصحيحة.",
  doc_fmt_sort_instructions: "ضع الفقرات التالية في الترتيب الصحيح.",
  doc_fmt_paragraphs_to_sort: "الفقرات المراد ترتيبها",
  doc_fmt_correct_order: "الترتيب الصحيح",
  doc_fmt_find_instructions: "يجد",
  doc_fmt_hidden_words: "الكلمات المخفية في الشبكة.",
  doc_fmt_hints: "تلميحات",
  doc_fmt_flashcards_instructions: "لكل بطاقة، ابحث عن الإجابة المقابلة للسؤال.",
  doc_fmt_elements_to_match: "العناصر المراد مطابقتها:",
  doc_fmt_possible_matches: "التطابقات المحتملة:",
  doc_fmt_correct_associations: "الارتباطات الصحيحة:",

};