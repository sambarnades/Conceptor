const translations_jp = {
    subtitle: "Moodle・Éléaリソース・アクティビティの支援作成",
    help_button: "ヘルプ",
    help_modal_title: "🚀 Caramel スタートガイド",
    help_modal_content: `
        <div class="help-modal-content">
            <p><strong>Caramel</strong>へようこそ！このツールは、人工知能の助けを借りてインタラクティブな教育活動を作成するためのステップバイステップガイドです。これらの簡単な手順に従って、あなたのアイデアをすぐに使えるモジュールに変換しましょう。</p>

            <div class="help-section">
                <h4><span class="help-step-number">1</span> アイデアを記述する（「プロンプト」）</h4>
                <p>すべてはあなたのニーズを記述することから始まります。これには2つのオプションがあります：</p>
                <ul>
                    <li><span class="badge-help-mode">クイックモード</span>: 素早く始めるのに最適です。単に<strong>あなたの役割</strong>（例：<em>理科の先生</em>）と<strong>扱いたい内容</strong>（例：<em>6年生の水の循環</em>）を指定してください。</li>
                    <li><span class="badge-help-mode">ガイドモード</span>: より正確なリクエストのために。<strong>専門分野</strong>、<strong>テーマ</strong>、<strong>生徒のレベル</strong>、そして希望する<strong>アイテム数</strong>（質問、日付など）を記入してください。</li>
                </ul>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">2</span> プロンプトを生成する</h4>
                <p>情報を入力したら、<button id="generateBtn" data-key="generate_prompts">プロンプトを生成</button>ボタンをクリックしてください。ツールは、利用可能な各アクティビティタイプのための詳細な指示（「プロンプト」）を準備します。</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">3</span> アクティビティを選択する</h4>
                <p><span class="badge-help-tab">H5P</span>と<span class="badge-help-tab">Éléa/Moodleモジュール</span>タブを切り替えて、利用可能なさまざまなアクティビティをご覧ください。興味のあるものをクリックしてください（例：「タイムライン」や「MCQ」）。対応するプロンプトがテキストエリアに表示されます。</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">4</span> 人工知能を利用する</h4>
                <p>ここで魔法が起こります！アクティビティのコンテンツを生成するには2つのオプションがあります：</p>
                <div class="help-subsection">
                    <h5><i class="fas fa-robot"></i> オプションA：Albertで生成（推奨）</h5>
                    <p><button class="action-btn albert-btn">Albertで生成</button>ボタンをクリックしてください。ボタンの右側にある小さな矢印をクリックすることで、あなたのニーズに最適なAIモデル（高速、強力、またはコードに特化）を選択できます。アクティビティのコンテンツは<strong>自動的に生成され、結果フィールドに挿入</strong>され、すぐに使用できます。</p>
                    <ul class="advantages">
                        <li><strong>長所：</strong> シンプル、高速、ツールに直接統合されたAI。</li>
                        <li><strong>短所：</strong> ウェブ検索なし、初期AIプロンプトのカスタマイズ不可。</li>
                    </ul>
                </div>
                <div class="help-subsection">
                    <h5><i class="fas fa-paste"></i> オプションB：独自のAIを使用する</h5>
                    <p><button class="copy-btn">📋 プロンプトをコピー</button>をクリックし、この指示をお好みの人工知能（ChatGPT、Le Chatなど）に貼り付けてください。次に、<strong>AIの応答をコピー</strong>し、Caramelの結果フィールドに<strong>貼り付け</strong>てください。</p>
                    <ul class="advantages">
                        <li><strong>長所：</strong> 完全な柔軟性、インターネットアクセス可能、初期プロンプトの変更やコンテンツ生成のためのドキュメント追加機能。</li>
                        <li><strong>短所：</strong> 手動でのコピー＆ペーストと外部アカウントが必要。</li>
                    </ul>
                </div>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">5</span> ファイルを作成してダウンロードする</h4>
                <p>コンテンツが結果フィールドに入力されたら（Albertによって生成されたか、自分で貼り付けたかに関わらず）、<button class="download-btn">H5Pを生成</button>ボタン（またはアクティビティに応じて.mbz/.xml）をクリックしてください。ファイルがダウンロードされ、MoodleまたはÉléaプラットフォームに統合する準備が整います。</p>
                <p class="help-final-tip">これで完了です！数回のクリックでインタラクティブなアクティビティを作成しました。さまざまなモードやアクティビティタイプを試して、コースを充実させてください。</p>
            </div>
        </div>
    `,
    fast_mode: "クイックモード",
    guided_mode: "ガイドモード",
    who_are_you: "あなたは誰ですか？（例：教師、講師...）",
    what_to_address: "何を扱いたいですか？（例：6年生での角の性質...）",
    discipline: "科目（例：歴史）",
    theme: "テーマ（例：フランス革命）",
    level: "レベル（例：職業高校2年生）",
    number_of_elements: "要素数（例：10）",
    additional_info: "補足・詳細情報...",
    generate_prompts: "プロンプトを生成",
    h5p_tab: "H5P",
    moodle_tab: "Éléa/Moodleモジュール",

    // General Context (Advanced Mode)
    prompt_expert_intro: "あなたは、現在の教育プログラムの内容と生徒のレベルに応じて、トーンと語彙を適応させる教育学のエキスパート教師です。授業科目：",
    prompt_context_title: "**コンテキスト：**",
    prompt_subject: "- **科目：**",
    prompt_student_level: "- **生徒のレベル：**",
    prompt_theme: "- **テーマ：**",
    prompt_number_of_elements: "- **要素数：**",
    prompt_additional_info: "- **補足情報：**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "私は**",
    prompt_simple_intro_part2: "**で、**",
    prompt_language_instruction: "生成されるコンテンツは日本語である必要がありますが、リクエストで他の言語が指定されている場合を除きます。",
    prompt_code_block_instruction: "結果をコードブロックで生成する必要があります。",

    // Timeline Prompt
    timeline_prompt_role: "あなたはH5P「Timeline」アクティビティを作成する教育工学の専門家です。",
    timeline_prompt_mission: "**あなたの使命：**",
    timeline_prompt_generate_json: "H5PのTimeline型アクティビティ用の完全で有効なJSONオブジェクトを生成してください。JSONは直接使用可能である必要があります。",
    timeline_prompt_json_structure_title: "**期待されるJSON構造：**",
    timeline_prompt_json_structure_main_object: "メインオブジェクトには「timeline」キーが含まれている必要があります。この「timeline」オブジェクトには以下を含める必要があります：",
    timeline_prompt_headline: "`headline`：年表の全体的なタイトル。",
    timeline_prompt_text: "`text`：短い導入段落。",
    timeline_prompt_asset: "`asset`：カバー画像用のオブジェクト。`media`（URL）、`caption`（キャプション）、`credit`（出典）を含む。",
    timeline_prompt_date_array: "`date`：${nombreQuestions}個のオブジェクトを含む配列。各オブジェクトはイベントを表します。",
    timeline_prompt_era_array: "`era`：複数のイベントをカバーする期間を定義するオブジェクトの配列。",
    timeline_prompt_content_rules_title: "**コンテンツのルール：**",
    timeline_prompt_rule1: "1. `date`配列の各イベントには以下が必要です：",
    timeline_prompt_rule1_startDate: "- `startDate` と `endDate`: 日付は「YYYY,MM,DD」または「YYYY」形式。期間を定義するには `endDate` を使用します。",
    timeline_prompt_rule1_headline: "- `headline`：イベントのタイトル。",
    timeline_prompt_rule1_text: "- `text`：HTML形式の説明（<p>と<strong>を使用）。",
    timeline_prompt_rule1_asset: "- `asset`：イベントを説明する画像用のオプションオブジェクト。",
    timeline_prompt_rule1_tag: "- `tag`: 期間を特徴づけるキーワード（例：「歴史」、「科学」）。",
    timeline_prompt_rule2: "2. 各`asset`について、関連性のあるロイヤリティフリーの画像（例：Wikimedia Commons）を積極的に検索してください。`media`のURLは直接的で有効なリンクでなければなりません。`credit`にソースとライセンスを記載してください。適切な画像が見つからない場合は、`asset`オブジェクトを完全に省略してください。",
    timeline_prompt_rule3: "3. 各期間（`era`）に、簡単な説明と`tag`を含む`text`フィールドを追加してください。",
    timeline_prompt_example_json_title: "**JSON構造の例：**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "年表のタイトル",
"text": "<p>年表のテーマに関する序文。</p>",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "第一次世界大戦の始まり",
"text": "<p>オーストリア＝ハンガリー帝国がセルビアに宣戦布告。</p>",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "暗殺直前のフランツ・フェルディナント大公。",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "戦争"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "1918年の休戦協定",
"text": "<p>レトンドで休戦協定が署名され、戦闘が終結した。</p>",
"tag": "条約"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "第一次世界大戦",
"text": "<div>これは「大戦」と呼ばれる時代です。</div>",
"tag": "歴史的時代"
}
]
}
}
\`\`\` `,  
    timeline_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。結果は他のツールで直接使用されます。",

    // Crossword Prompt
    crossword_prompt_role: "あなたはH5P「Crossword」アクティビティを作成する教育工学の専門家です。",
    crossword_prompt_mission: "**あなたの使命：**",
    crossword_prompt_generate_json: "H5Pクロスワードアクティビティ用の完全で有効なJSONオブジェクトを生成してください。",
    crossword_prompt_json_structure_title: "**期待されるJSON構造：**",
    crossword_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    crossword_prompt_title: "`title`：アクティビティのタイトル。",
    crossword_prompt_words_array: "`words`：${nombreQuestions}個のオブジェクトの配列。各オブジェクトには以下を含みます：",
    crossword_prompt_answer: "`answer`：推測する単語。",
    crossword_prompt_clue: "`clue`：対応する定義。",
    crossword_prompt_extra_clue_optional: "`extraClue` (任意): 追加のヒントを含むオブジェクト。AIは追加の妥当性を判断する必要があります。",
    crossword_prompt_task_description: "`taskDescription`：明確な指示。",
    crossword_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現する必要があります。",
    crossword_prompt_content_rules_title: "**コンテンツのルール：**",
    crossword_prompt_rule1: "1. 単語（`answer`）は固有で関連性のある用語である必要があります。",
    crossword_prompt_rule2: "2. 定義（`clue`）は短く正確である必要があります。",
    crossword_prompt_rule3: "3. JSON構造の残り（動作、テーマなど）はそのまま保持してください。",
    crossword_prompt_example_json_title: "**単語のJSON例：**",
    crossword_prompt_example: `\`\`\`json
{
"title": "生物学に関するクロスワード",
"words": [
{
"answer": "細胞",
"clue": "生命の基本単位。",
"extraClue": {
"params": {
"text": "<p>動物または植物のものがある。</p>"
}
}
},
{
"answer": "DNA",
"clue": "遺伝情報を運ぶ分子。"
}
],
"taskDescription": "<p>クロスワードのマスを埋めなさい。</p>"
}
\`\`\` `,
    crossword_prompt_generate_only_json: "タイトル、説明、「words」配列を埋めた完全で有効なJSONを、他のコメントなしで生成してください。",

    // Crossword UI translations
    crossword_across: "横",
    crossword_down: "縦",
    crossword_check_answer: "チェック",
    crossword_try_again: "再試行",
    crossword_show_solution: "解答を表示",
    crossword_extra_clue: "追加ヒント",
    crossword_close_window: "ウィンドウを閉じる",
    crossword_submit_answer: "送信",

    // Essay Prompt
    essay_prompt_role: "あなたはH5P「Essay」アクティビティを作成する教育工学の専門家です。",
    essay_prompt_mission: "**あなたの使命：**",
    essay_prompt_generate_json: "H5PのEssay型アクティビティ用の完全で有効なJSONオブジェクトを生成してください。",
    essay_prompt_json_structure_title: "**期待されるJSON構造：**",
    essay_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    essay_prompt_task_description: "`taskDescription`：生徒にテーマについてのテキストを書くように促す明確な指示。テーマは太字（<strong>）にし、各文は改行（<p>）で終わる必要があります。",
    essay_prompt_keywords_array: "`keywords`：${nombreQuestions}個のオブジェクトの配列。各オブジェクトはシステムが生徒の回答で見つけるべきキーワードを定義します。",
    essay_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現する必要があります。",
    essay_prompt_content_rules_title: "**コンテンツのルール：**",
    essay_prompt_rule1: "1. `keywords`の各オブジェクトには、検索する単語が含まれた`keyword`キーが必要です。",
    essay_prompt_rule2: "2. キーワードは関連性があり、テーマの理解を評価するために不可欠である必要があります。",
    essay_prompt_rule3: "3. JSON構造（動作など）は保持してください。",
    essay_prompt_rule4: "4. 指示（`taskDescription`）は、理解のために必要な場合を除き、`keywords`にリストされているキーワードを使用せずに書くことを奨励する必要があります。",
    essay_prompt_example_json_title: "**キーワードのJSON例：**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "<p>光合成を説明する短い文章を書きなさい。</p>",
"keywords": [
{
"keyword": "光",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "クロロフィル",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "指示とキーワードリストを埋めた完全で有効なJSONを、他のコメントなしで生成してください。",

    // Moodle XML Prompt
    moodle_xml_prompt_intro: "${nombreQuestions}問のクイズを作成したいと思います。",
    moodle_xml_prompt_content_title: "内容について：",
    moodle_xml_prompt_content_rule1: "間違った回答は、トピックと一致しているが、偶然を避けるために明らかに間違っている必要があります。",
    moodle_xml_prompt_content_rule2: "質問の難易度を変える必要があります。理想的には簡単なものから複雑なものまで。",
    moodle_xml_prompt_content_rule3: "内容の正確さを保ちながら表現を簡素化してください。",
    moodle_xml_prompt_content_rule4: "フィードバックを生成するには、期待される回答要素を1～2文で提供してください。",
    moodle_xml_prompt_question_types_intro: "質問は以下のタイプに均等に分散する必要があります：",
    moodle_xml_prompt_question_type_multichoice: "- multichoice（選択肢、正解は1つ）、",
    moodle_xml_prompt_question_type_matching: "- matching（マッチング）、",
    moodle_xml_prompt_question_type_numerical: "- numerical（許容誤差ありまたはなしの数値回答）、",
    moodle_xml_prompt_question_type_truefalse: "- truefalse（正誤問題）。",
    moodle_xml_prompt_question_type_shortanswer: "- shortanswer（短答）で、必要に応じて代替解答を含めてもよい,",
    moodle_xml_prompt_question_type_cloze: "- cloze（穴埋め）では、カテゴリ MULTICHOICE, MULTICHOICE_H, MULTICHOICE_V, MULTICHOICE_S, MULTICHOICE_HS, MULTIRESPONSE, MULTIRESPONSE_H, MULTIRESPONSE_HS, NUMERICAL, SHORTANSWER または SHORTANWSER_C を用い、文脈に最も適したものを選びます。",
    moodle_xml_prompt_form_title: "形式について：",
    moodle_xml_prompt_form_rule1: "XMLファイルは以下を満たす必要があります：",
    moodle_xml_prompt_form_rule1_encoding: "UTF-8でエンコードされている（エンコード行を挿入）。",
    moodle_xml_prompt_form_rule1_reusable: "形式エラーなしで、Moodleで直接再利用可能。",
    moodle_xml_prompt_form_rule1_standard_structure: "Moodleの標準XML構造に従う（<quiz>、<question>などを含む）。",
    moodle_xml_prompt_form_rule1_special_chars: "数式記号 '<' や '>' は HTML エンティティとしてエンコードする必要があります（例: '<' の場合は `<`、'>' の場合は `>`）、XML タグとの混同を避けるためです。",
    moodle_xml_prompt_generate_only_xml: "コメント、形式設定、要約はしないでください。XMLファイルの生の内容のみが必要です。説明された形式を厳密に守ってください。結果を他のツールに貼り付けるため、この形式が期待されています。回答をプリフォーマットされたコードとして生成してください。",

    // GIFT Prompt
    gift_prompt_intro: "${nombreQuestions}問のクイズを作成したいと思います。",
    gift_prompt_format_info: "クイズはGIFT形式で、Moodleにインポートする予定です。",
    gift_prompt_question_quality: "各質問は明確で簡潔、曖昧さがない必要があります。詳細なフィードバックが必要です。",
    gift_prompt_code_format_intro: "コードは以下に提供されるものと全く同じ形式である必要があります：",
    gift_prompt_example_question_comment: "// question: 1  name: 太陽系の中心にある天体は何ですか？",
    gift_prompt_example_question_text: "::太陽系の中心にある天体は何ですか？::太陽系の中心にある天体は何ですか？{",
    gift_prompt_example_answer_correct: "=太陽#正解！太陽は私たちの太陽系の中心星です。よくできました！",
    gift_prompt_example_answer_incorrect1: "~月#間違いです。月は地球の自然衛星です。太陽が中心天体です。",
    gift_prompt_example_answer_incorrect2: "~木星#間違いです。木星はガス巨星惑星です。太陽が中心天体です。",
    gift_prompt_example_answer_incorrect3: "~地球#間違いです。地球は私たちが住んでいる惑星です。太陽が中心天体です。",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "クイズはランダムに異なるタイプの質問を含む必要があります：",
    gift_prompt_question_type_multichoice: "- 選択肢問題（multichoice）、正解1つと3つの選択肢。",
    gift_prompt_question_type_truefalse: "- 正誤問題（truefalse）。",
    gift_prompt_question_type_numerical: "- 数値問題（numerical）、許容誤差付き。",
    gift_prompt_question_type_matching: "- マッチング問題（matching）、最低4組のペア。",
    gift_prompt_generate_only_gift: "コメントや追加のタグなしで、GIFT形式のクイズを直接生成してください。説明された形式を厳密に守ってください。結果を他のツールに貼り付けるため、この形式が期待されています。回答をプリフォーマットされたコードとして生成してください。",

    // Flashcards Prompt
    flashcards_prompt_role: "あなたはH5P「Flashcards」アクティビティを作成する教育工学の専門家です。",
    flashcards_prompt_mission: "**あなたの使命：**",
    flashcards_prompt_generate_json: "H5PのFlashcards型アクティビティ用の完全で有効なJSONオブジェクトを生成してください。JSONは直接使用可能である必要があります。",
    flashcards_prompt_json_structure_title: "**期待されるJSON構造：**",
    flashcards_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    flashcards_prompt_title: "`title`：アクティビティに関連するタイトル。",
    flashcards_prompt_description: "`description`：生徒への明確な指示。",
    flashcards_prompt_cards_array: "`cards`：${nombreQuestions}個のオブジェクトの配列。各オブジェクトはカードを表し、以下を含みます：",
    flashcards_prompt_text: "`text`：推測する質問または用語（表）。",
    flashcards_prompt_answer: "`answer`：回答または定義（裏）。注意、重要：answerには単純な単語一つまたは数字のみを含めることができます。",
    flashcards_prompt_tip: "`tip` (任意): 質問が難しい場合に学生を助けるためのHTML形式のヒント。関連性があると思われる場合にのみヒントを追加してください。",
    flashcards_prompt_example_json_title: "**JSONの例：**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "ヨーロッパの首都",
"description": "各国の首都を覚えましょう。カードをクリックすると答えが表示されます。",
"cards": [
{
"text": "フランス",
"answer": "パリ"
},
{
"text": "オランダ",
"answer": "アムステルダム",
"tip": "<p><strong>運河</strong>とチューリップの街です！</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // QuizSet Prompt
    quiz_set_prompt_role: "あなたは「H5P Quiz (Question Set)」アクティビティのコンテンツを作成する教育工学の専門家です。",
    quiz_set_prompt_mission: "**あなたの使命：**",
    quiz_set_prompt_generate_json: "H5Pクイズの**コンテンツのみ**のJSONオブジェクトを生成してください。JSONは`content.json`ファイルとして直接使用可能である必要があります。",
    quiz_set_prompt_json_structure_title: "**期待されるJSON構造：**",
    quiz_set_prompt_json_structure_main_object: "メインオブジェクトには以下のキーを含める必要があります：",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`：${nombreQuestions}個のオブジェクトの配列。各オブジェクトは質問を表します。",
    quiz_set_prompt_content_rules_title: "**質問内容のルール：**",
    quiz_set_prompt_rule1: "1. 各質問オブジェクトには`library`、`params`、`subContentId`キーが必要です。",
    quiz_set_prompt_rule2: "2.  **構造:** 各質問は`library`、`metadata`、`params`のキーを持つオブジェクトでなければなりません。",
    quiz_set_prompt_rule3: "3. 質問の種類を変えてください。正確なバージョンで以下のライブラリを使用してください：",
    quiz_set_prompt_rule4: "4.  **フィードバック（重要ルール）：** **すべての質問タイプ**（`MultiChoice`、`Blanks`、`DragText`、`MarkTheWords`、`Essay`）について、**必ず**6つのスコア範囲（0-10、11-30、31-50、51-70、71-90、91-100）を持つ`overallFeedback`を生成する必要があります。`TrueFalse`の質問には、`feedbackOnCorrect`と`feedbackOnWrong`フィールドも追加してください。フィードバックは親切で、段階的で、常に肯定的に表現する必要があります。",
    quiz_set_prompt_rule5: "5.  **内容：** `params`の内容は教育的に適切で、MCQにはもっともらしい選択肢を、他のアクティビティには一貫したテキストを含める必要があります。",
    quiz_set_prompt_rule6: "6.  **シンプルさ：** 画像や余分な動作パラメータを追加しないでください。例のように構造をシンプルに保ってください。",
    quiz_set_prompt_example_json_title: "**許可されている各質問タイプの構造例：**",
    quiz_set_example_true_false: "正誤問題 :",
    quiz_set_example_multiple_choice: "多肢選択 :",
    quiz_set_example_fill_in_the_blanks: "穴埋め問題 :",
    quiz_set_example_drag_the_words: "単語をドラッグ :",
    quiz_set_example_mark_the_words: "単語をマーク :",
    quiz_set_example_essay: "作文 :",
    quiz_set_prompt_generate_only_json: "`{\"progressType\": \"dots\", ...}`で始まる有効なJSONのみを、コメントなしで生成してください。",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "正誤問題のタイトル" },
        "params": {
            "question": "<p>フランスは国ですか？</p>",
            "correct": "true",
            "feedbackOnCorrect": "正解です！フランスは確かに国です。",
            "feedbackOnWrong": "不正解です。フランスは国際的に国として認められています。",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "MCQのタイトル" },
        "params": {
            "question": "<p>フランスの首都はどこですか？</p>",
            "answers": [
                { "text": "パリ", "correct": true },
                { "text": "ベルリン", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%のフィードバック" },
                { "from": 11, "to": 30, "feedback": "11-30%のフィードバック" },
                { "from": 31, "to": 50, "feedback": "31-50%のフィードバック" },
                { "from": 51, "to": 70, "feedback": "51-70%のフィードバック" },
                { "from": 71, "to": 90, "feedback": "71-90%のフィードバック" },
                { "from": 91, "to": 100, "feedback": "91-100%のフィードバック" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "穴埋め問題のタイトル" },
        "params": {
            "questions": ["<p>パリはフランスの*首都*です。</p>"],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%のフィードバック" },
                { "from": 11, "to": 30, "feedback": "11-30%のフィードバック" },
                { "from": 31, "to": 50, "feedback": "31-50%のフィードバック" },
                { "from": 51, "to": 70, "feedback": "51-70%のフィードバック" },
                { "from": 71, "to": 90, "feedback": "71-90%のフィードバック" },
                { "from": 91, "to": 100, "feedback": "91-100%のフィードバック" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "単語ドラッグアクティビティのタイトル" },
        "params": {
            "taskDescription": "文を完成させてください。",
            "textField": "*パリ*はフランスの首都です。",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%のフィードバック" },
                { "from": 11, "to": 30, "feedback": "11-30%のフィードバック" },
                { "from": 31, "to": 50, "feedback": "31-50%のフィードバック" },
                { "from": 51, "to": 70, "feedback": "51-70%のフィードバック" },
                { "from": 71, "to": 90, "feedback": "71-90%のフィードバック" },
                { "from": 91, "to": 100, "feedback": "91-100%のフィードバック" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "単語マーキングアクティビティのタイトル" },
        "params": {
            "taskDescription": "首都をハイライトしてください。",
            "textField": "フランスの首都は*パリ*です。",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%のフィードバック" },
                { "from": 11, "to": 30, "feedback": "11-30%のフィードバック" },
                { "from": 31, "to": 50, "feedback": "31-50%のフィードバック" },
                { "from": 51, "to": 70, "feedback": "51-70%のフィードバック" },
                { "from": 71, "to": 90, "feedback": "71-90%のフィードバック" },
                { "from": 91, "to": 100, "feedback": "91-100%のフィードバック" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "エッセイのタイトル" },
        "params": {
            "taskDescription": "<p>フランスの首都はどこですか？</p>",
            "keywords": [
                { "keyword": "パリ", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "0-10%のフィードバック" },
                { "from": 11, "to": 30, "feedback": "11-30%のフィードバック" },
                { "from": 31, "to": 50, "feedback": "31-50%のフィードバック" },
                { "from": 51, "to": 70, "feedback": "51-70%のフィードバック" },
                { "from": 71, "to": 90, "feedback": "71-90%のフィードバック" },
                { "from": 91, "to": 100, "feedback": "91-100%のフィードバック" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "あなたはH5P「Accordion」アクティビティを作成する教育工学の専門家です。",
    glossary_prompt_mission: "**あなたの使命：**",
    glossary_prompt_generate_json: "H5PのAccordion型用語集用の完全で有効なJSONオブジェクトを生成してください。JSONは直接使用可能である必要があります。",
    glossary_prompt_json_structure_title: "**期待されるJSON構造：**",
    glossary_prompt_json_structure_main_object: "${nombreQuestions}個のJSONオブジェクトの配列を生成してください。",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`：定義する単語または表現。",
    glossary_prompt_content: "`text`：HTML形式の定義（<p>、<strong>などを使用）。",
    glossary_prompt_content_rules_title: "**コンテンツのルール：**",
    glossary_prompt_rule1: "1. 定義は明確で簡潔、生徒のレベルに適している必要があります。",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**エントリのJSON例：**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "光合成",
"text": "<p>緑色植物が太陽光をエネルギーに変換するプロセス。</p>"
},
{
"title": "細胞",
"text": "<p>すべての生物の基本単位。</p>"
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // Summary Prompt
    summary_prompt_role: "あなたはH5P「Summary」アクティビティを作成する教育工学の専門家です。",
    summary_prompt_mission: "**あなたの使命：**",
    summary_prompt_generate_json: "H5PのSummary型アクティビティ用の完全なJSONオブジェクトを生成してください。JSONは直接使用可能である必要があります。",
    summary_prompt_json_structure_title: "**期待されるJSON構造：**",
    summary_prompt_json_structure_main_object: "オブジェクトには以下のキーが含まれている必要があります：",
    summary_prompt_intro_field: "`intro`: アクティビティの導入文（例：「正しい記述を選んでください。」）。",
    summary_prompt_summaries_array: "`summaries`: ${nombreQuestions}個のオブジェクトを含む配列で、各オブジェクトが要約のステップを表します。",
    summary_prompt_summary_object: "`summaries`内の各オブジェクトには以下が含まれている必要があります：",
    summary_prompt_summary_array: "- `summary`: 文の配列。",
    summary_prompt_tip_field: "- `tip` (任意ですが推奨): 生徒を助けるためのヒント。",
    summary_prompt_content_rules_title: "**コンテンツのルール：**",
    summary_prompt_rule1: "1. 各「summary」配列で、**最初の文が正解**です。",
    summary_prompt_rule2: "2. 続く文は、もっともらしいが間違っている選択肢です。",
    summary_prompt_rule3: "3. 正解の文の集合は一貫した要約を形成する必要があります。",
    summary_prompt_example_json_title: "**ステップのJSON例：**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "これは正しい文です。",
    "これは誤答です。",
    "これは別の誤答です。"
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現し、トピックに関連している必要があります。",
    summary_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // Summary UI translations
    summary_intro: "正しい記述を選んでください。",
    summary_solved_label: "進捗：",
    summary_score_label: "不正解：",
    summary_result_label: "あなたの結果",
    summary_feedback: "全@total問中、@score問正解です（@percent %）。",
    summary_label_correct: "正解です。",
    summary_label_incorrect: "不正解です！もう一度お試しください。",
    summary_label_correct_answers: "正解はこちらです。",
    summary_tip_button_label: "ヒントを表示",
    summary_score_bar_label: "合計@total点中、@num点を獲得しました",
    summary_progress_text: "進捗 @num / @total",
    summary_alternative_incorrect_label: "不正解",

    // Drag the Words Prompt
    drag_word_prompt_role: "あなたはH5P「Drag the Words」アクティビティを作成する教育工学の専門家です。",
    drag_word_prompt_mission: "**あなたの使命：**",
    drag_word_prompt_generate_json: "H5PのDrag the Words型アクティビティ用の完全なJSONオブジェクトを生成してください。JSONは直接使用可能である必要があります。",
    drag_word_prompt_json_structure_title: "**期待されるJSON構造：**",
    drag_word_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    drag_word_prompt_task_description: "`taskDescription`：明確な指示。",
    drag_word_prompt_text_field: "`textField`：完成させるテキスト。各文は改行 `\\n` で終わる必要があります。",
    drag_word_prompt_content_rules_title: "**コンテンツのルール：**",
    drag_word_prompt_rule1: "1. テーマに関する一貫した短い文でテキストを作成し、各文を `\\n` で終えてください。",
    drag_word_prompt_rule2: "2. ドラッグ可能な単語はアスタリスクで囲みます。ヒントは `:私のヒント` で、フィードバックは `\\+正しいフィードバック \\-不正解のフィードバック` で追加できます。",
    drag_word_prompt_example_json_title: "**JSONの例：**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "単語をドラッグして文章を完成させなさい。",
"textField": "*太陽系*は*8*つの惑星で構成されており、これらは*太陽*の周りを公転している。"
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",
    drag_word_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現し、トピックに関連している必要があります。",

    // Drag the Words UI translations
    drag_words_check_answer: "チェック",
    drag_words_try_again: "再試行",
    drag_words_show_solution: "解答を表示",
    drag_words_score_feedback: "スコア：@score / @total。",
    drag_words_tip_label: "ヒントを表示",
    drag_words_correct_text: "正解！",
    drag_words_incorrect_text: "不正解！",
    drag_words_score_bar_label: "合計@total点中、@num点を獲得しました",
    drag_words_submit_answer: "送信",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "あなたはH5P「Fill in the Blanks」アクティビティを作成する教育工学の専門家です。",
    blanks_prompt_mission: "**あなたの使命：**",
    blanks_prompt_generate_json: "H5PのFill in the Blanks型アクティビティ用の完全なJSONオブジェクトを生成してください。JSONは直接使用可能である必要があります。",
    blanks_prompt_json_structure_title: "**期待されるJSON構造：**",
    blanks_prompt_json_structure_main_object: "オブジェクトには`questions`キーが含まれている必要があります。これは文字列の配列です。各文字列は完成させるテキストブロックを表します。",
    blanks_prompt_content_rules_title: "**コンテンツのルール：**",
    blanks_prompt_rule1: "- 推測する単語はアスタリスク（*単語*）で囲まれています。",
    blanks_prompt_rule2: "- 代替回答には、スラッシュを使用してください：*Paris/光の都*。",
    blanks_prompt_rule3: "- ツールチップを追加するには、コロンを使用してください：*オープンソース:公開されたソースコード*。",
    blanks_prompt_example_json_title: "**JSONの例：**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"太陽系には*8*つの惑星があり、最大のものは*木星*です。",
"フランスの首都は*パリ/光の都*です。"
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",
    blanks_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現し、トピックに関連している必要があります。",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "解答を表示",
    blanks_try_again: "再試行",
    blanks_check_answer: "チェック",
    blanks_not_filled_out: "すべての空欄を埋めてください。",
    blanks_answer_is_correct: "「:ans」は正解です",
    blanks_answer_is_wrong: "「:ans」は不正解です",
    blanks_answered_correctly: "正解しました",
    blanks_answered_incorrectly: "不正解でした",
    blanks_solution_label: "正解:",
    blanks_input_label: "空欄 @num / @total",
    blanks_input_has_tip_label: "ヒントあり",
    blanks_tip_label: "ヒント",
    blanks_score_bar_label: "合計:total点中、:num点を獲得しました",
    blanks_submit_answer: "送信",
    blanks_feedback: "合計@total個の空欄のうち、@score個正解しました。",
    blanks_finish_header: "終了しますか？",
    blanks_finish_body: "本当に終了しますか？",
    blanks_cancel_label: "キャンセル",
    blanks_finish_label: "終了",
    blanks_retry_header: "再試行しますか？",
    blanks_retry_body: "本当に再試行しますか？",
    blanks_retry_confirm_label: "確認",
    blanks_checking_mode_header: "チェックモード",
    blanks_a11y_check: "解答をチェックします。解答は正解、不正解、または未回答としてマークされます。",
    blanks_a11y_show_solution: "解答を表示します。課題には正解が表示されます。",
    blanks_a11y_retry: "課題を再試行します。すべての解答をリセットして、課題を最初からやり直します。",

    // Mark the Words Prompt
    mark_words_prompt_role: "あなたはH5P「Mark the Words」アクティビティを作成する教育工学の専門家です。",
    mark_words_prompt_mission: "**あなたの使命：**",
    mark_words_prompt_generate_json: "H5PのMark the Words型アクティビティ用の完全なJSONオブジェクトを生成してください。JSONは直接使用可能である必要があります。",
    mark_words_prompt_json_structure_title: "**期待されるJSON構造：**",
    mark_words_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    mark_words_prompt_task_description: "`taskDescription`：明確な指示。",
    mark_words_prompt_text_field: "`textField`：マークする単語がアスタリスク（*単語*）で囲まれたテキスト。",
    mark_words_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現し、トピックに関連している必要があります。",
    mark_words_prompt_content_rules_title: "**コンテンツのルール：**",
    mark_words_prompt_rule1: "1. テーマに関する関連する段落を作成してください。",
    mark_words_prompt_rule2: "2. マークする重要なキーワードを約${nombreQuestions}個特定してください。",
    mark_words_prompt_rule3: "3. マークする各単語は個別にアスタリスクで囲む必要があります。例えば、`*単語1* *単語2*`は正しいですが、`*単語1 単語2*`は正しくありません。",
    mark_words_prompt_rule4: "4. アポストロフィやその他の句読点は、マークされた単語に付けてはいけません。例えば、`l'*oiseau*`は不正解です。`l' *oiseau*`と書くことで機能します。",
    mark_words_prompt_example_json_title: "**JSONの例：**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "文中の重要な語をクリックしなさい。",
"textField": "*太陽* *系*は*8*つの惑星で構成されており、それらは*太陽*の周りを公転している。"
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // Mark the Words UI translations
    mark_words_check_answer: "チェック",
    mark_words_try_again: "再試行",
    mark_words_show_solution: "解答を表示",
    mark_words_correct_answer: "正解！",
    mark_words_incorrect_answer: "不正解！",
    mark_words_missed_answer: "未解答！",
    mark_words_display_solution_description: "課題が更新され、解答が含まれました。",
    mark_words_score_bar_label: "合計:total点中、:num点を獲得しました",
    mark_words_submit_answer: "送信",
    mark_words_a11y_full_text_label: "全文読み上げテキスト",
    mark_words_a11y_clickable_text_label: "単語をマークできる全文テキスト",
    mark_words_a11y_solution_mode_header: "解答モード",
    mark_words_a11y_checking_header: "チェックモード",
    mark_words_a11y_check: "解答をチェックします。解答は正解、不正解、または未回答としてマークされます。",
    mark_words_a11y_show_solution: "解答を表示します。課題には正解が表示されます。",
    mark_words_a11y_retry: "課題を再試行します。すべての解答をリセットして、課題を最初からやり直します。",

    // Millionnaire Prompt
    millionnaire_prompt_role: "あなたはH5P「Millionnaire」アクティビティを作成する教育工学の専門家です。",
    millionnaire_prompt_num_questions: "**質問数：** 6",
    millionnaire_prompt_mission: "**あなたの使命：**",
    millionnaire_prompt_generate_json: "「億万長者になりたい人」タイプのゲーム用のタイトルと**6問**のリストを含むJSONオブジェクトを生成してください。",
    millionnaire_prompt_important_rules_title: "**重要なルール：**",
    millionnaire_prompt_rule1: "1. `title`はアクティビティにとって関連性があり魅力的なタイトルである必要があります。",
    millionnaire_prompt_rule2: "2. `questions`配列の質問の難易度は**段階的で教育的**である必要があり、生徒のレベルに適している必要があります。最初の質問は非常に簡単で、最後は非常に難しい必要があります。",
    millionnaire_prompt_rule3: "3. コンテンツはテーマと学年レベルに関して厳密に正確で関連性がある必要があります。",
    millionnaire_prompt_json_structure_title: "**期待されるJSON構造：**",
    millionnaire_prompt_main_object: "2つのキーを持つメインオブジェクト：",
    millionnaire_prompt_title: "- `title`：アクティビティのタイトル（文字列）。",
    millionnaire_prompt_questions_array: "- `questions`：6個のオブジェクトの配列。各オブジェクトは質問を表し、以下を含みます：",
    millionnaire_prompt_question: "- `question`：質問（文字列）。",
    millionnaire_prompt_good_answer: "- `goodanswer`：正解（文字列）。",
    millionnaire_prompt_bad_answer: "- `badanswer`：3つの間違った回答の配列（文字列）。",
    millionnaire_prompt_example_json_title: "**JSONの例：**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "フランス革命に関するクイズ",
"questions": [
{
"question": "フランスの首都はどこですか？",
"goodanswer": "パリ",
"badanswer": ["ベルリン", "ロンドン", "マドリード"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "コメントなしで、有効なJSONオブジェクトのみを生成してください。",

    // Appariement Prompt
    appariement_prompt_role: "あなたは教育設計の専門家で、Moodleの「マッチング」活動を作成しています。",
    appariement_prompt_num_questions: "**ペアの数：** 10",
    appariement_prompt_mission: "**あなたのミッション：**",
    appariement_prompt_generate_json: "マッチングゲーム用に、タイトルと**10組**のペア一覧を含むJSONオブジェクトを生成してください。",
    appariement_prompt_important_rules_title: "**重要なルール：**",
    appariement_prompt_rule1: "1.  `title` は活動にとって関連性が高く魅力的なタイトルでなければならない。",
    appariement_prompt_rule2: "2.  `pairs` 配列には10個のオブジェクトが必要で、それぞれに `question`（左側の項目）と `answer`（右側で対応づける項目）が含まれる。",
    appariement_prompt_rule3: "3.  内容はテーマと学年水準に対して厳密に正確であること。",
    appariement_prompt_json_structure_title: "**想定されるJSON構造：**",
    appariement_prompt_main_object: "2つのキーを持つメインオブジェクト：",
    appariement_prompt_title: "- `title`: 活動のタイトル（文字列）。",
    appariement_prompt_pairs_array: "- `pairs`: 10個のオブジェクトからなる配列。各オブジェクトは1組を表し、次を含む：",
    appariement_prompt_question: "- `question`: 左側の用語または画像（文字列）。",
    appariement_prompt_answer: "- `answer`: 右側の定義または対応する用語（文字列）。",
    appariement_prompt_example_json_title: "**JSON例：**",
    appariement_prompt_example: `\`\`\`json
{
"title": "フランス革命に関する対応問題",
"pairs": [
{
"question": "バスティーユ襲撃",
"answer": "1789年7月14日"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "有効なJSONオブジェクトのみを生成し、コメントは一切付けないでください。",

    // QCM Prompt
    qcm_prompt_role: "あなたは教育設計の専門家で、Moodleの「MCQ」活動を作成しています。",
    qcm_prompt_num_questions: "**質問数：** 10",
    qcm_prompt_mission: "**あなたのミッション：**",
    qcm_prompt_generate_json: "MCQ用に、タイトルと**10問**の質問一覧を含むJSONオブジェクトを生成してください。",
    qcm_prompt_important_rules_title: "**重要なルール：**",
    qcm_prompt_rule1: "1.  `title` は活動にとって関連性が高く魅力的なタイトルでなければならない。",
    qcm_prompt_rule2: "2.  `questions` 配列には10個のオブジェクトが必要で、それぞれに `text`（質問文）と `answers` 配列が含まれる。",
    qcm_prompt_rule3: "3.  各 `answers` 配列には複数の回答候補が必要です。各回答は `text` と `iscorrect`（正解は1、不正解は0）を持つオブジェクトです。質問の文脈に応じて、正解が1つの質問や複数の正解がある質問を提案できます。",
    qcm_prompt_json_structure_title: "**想定されるJSON構造：**",
    qcm_prompt_main_object: "2つのキーを持つメインオブジェクト：",
    qcm_prompt_title: "- `title`: 活動のタイトル（文字列）。",
    qcm_prompt_questions_array: "- `questions`: 10個のオブジェクトからなる配列。各オブジェクトは1つの質問を表し、次を含む：",
    qcm_prompt_question_text: "- `text`: 質問文（文字列、HTMLを含むことがある）。",
    qcm_prompt_answers_array: "- `answers`: オブジェクトの配列。各オブジェクトは1つの回答を表し、次を含む：",
    qcm_prompt_answer_text: "- `text`: 回答文（文字列、HTMLを含むことがある）。",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 回答が正しければ1、そうでなければ0。",
    qcm_prompt_example_json_title: "**JSON例：**",
    qcm_prompt_example: `\`\`\`json
{
"title": "フランス革命に関する多肢選択クイズ",
"questions": [
{
"text": "<p>バスティーユ襲撃の日付はいつですか？</p>",
"answers": [
{ "text": "<p>1789年7月14日</p>", "iscorrect": 1 },
{ "text": "<p>1789年8月4日</p>", "iscorrect": 0 },
{ "text": "<p>1789年8月26日</p>", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "有効なJSONオブジェクトのみを生成し、コメントは一切付けないでください。",

    // H5P Modules
    h5p_timeline_name: "年表",
    h5p_timeline_description: "イベントの順序を示すインタラクティブな年表を作成します。",
    h5p_flashcards_name: "記憶カード",
    h5p_flashcards_description: "用語と定義の暗記を支援するための表裏カードを作成します。",
    h5p_quiz_set_name: "クイズ",
    h5p_quiz_set_description: "知識を評価するための様々な質問（選択肢、ドラッグ・ドロップなど）のシリーズを作成します。",
    h5p_glossary_name: "用語集",
    h5p_glossary_description: "展開可能なアコーディオン形式で用語集やFAQを作成します。",
    h5p_crossword_name: "クロスワード",
    h5p_crossword_description: "単語と定義のリストからクロスワードグリッドを生成します。",
    h5p_essay_name: "作文",
    h5p_essay_description: "作文のテーマを提案し、自動評価のためのキーワードを定義します。",
    h5p_summary_name: "要約",
    h5p_summary_description: "生徒は正しい文を選択して正確な要約を再構成する必要があります。",
    h5p_drag_the_words_name: "単語をドラッグ",
    h5p_drag_the_words_description: "生徒が欠落した単語をドラッグする穴埋めテキストを作成します。",
    h5p_fill_in_the_blanks_name: "穴埋めテキスト",
    h5p_fill_in_the_blanks_description: "生徒がキーボードで直接テキストの欠落した単語を入力します。",
    h5p_mark_the_words_name: "単語をハイライト",
    h5p_mark_the_words_description: "生徒に段落の特定の単語をハイライトするよう求めます。",
    h5p_true_false_name: "正誤問題",
    h5p_true_false_description: "正解か不正解かの二者択一で答える簡単な問題を作成します。",
    h5p_multiple_choice_name: "多肢選択",
    h5p_multiple_choice_description: "1つまたは複数の正解を持つ多肢選択問題を作成します。",
    h5p_find_the_words_name: "単語探し",
    h5p_find_the_words_description: "生徒が単語を見つける文字グリッドを作成します。",
    h5p_sort_the_paragraphs_name: "段落の並べ替え",
    h5p_sort_the_paragraphs_description: "生徒が正しい順序に並べ替える必要がある段落のセットを作成します。",
    h5p_single_choice_set_name: "単一選択セット",
    h5p_single_choice_set_description: "各質問に正解が1つしかない一連の質問を作成します。",
    h5p_dialog_cards_name: "ダイアログカード",
    h5p_dialog_cards_description: "テキストとオプションの画像を含むインタラクティブな両面カードを作成します。",
    h5p_complex_fill_the_blanks_name: "複雑な穴埋め問題",
    h5p_complex_fill_the_blanks_description: "各エラーに特定のフィードバックが付いた高度な穴埋めテキストを作成します。",
    h5p_chart_name: "チャート",
    h5p_chart_description: "データを視覚化するために円グラフまたは棒グラフを作成します。",

    // Moodle Modules
    moodle_xml_name: "XML Éléa/Moodle",
    moodle_xml_description: "XML 形式でインポート可能な小テスト用に 10 問の問題バンクを作成します。",
    moodle_xml_help: "Moodle の「小テスト」活動に XML ファイルを追加するには、まず活動を作成します。その後、<strong>その他</strong> メニューを開き、<strong>問題バンク</strong> に移動します。そこで <strong>インポート</strong> をクリックし、<strong>Moodle XML</strong> 形式を選択し、ファイルを選んで確認します。",
    moodle_gift_name: "GIFT フォーマット",
    moodle_gift_description: "GIFT 形式で問題を作成します。これは Moodle に問題をインポートする簡単な方法です。",
    moodle_millionnaire_name: "ミリオネア",
    moodle_millionnaire_description: "難易度が徐々に上がる 6 問のユニークな「ミリオネア」活動を作成します。",
    moodle_appariement_name: "マッチング",
    moodle_appariement_description: "10問のマッチング活動を生成します。",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "簡単なMCQ活動を生成します。",

    // Dynamic content
    prompt_for_ia: "AI用プロンプト",
    copy_prompt: "📋 プロンプトをコピー",
    go_duck: "🦆 Duck.aiにアクセス",
    go_mistral: "Ⓜ️ Le chatにアクセス",
    create_h5p_file: "H5Pファイルを作成",
    integrate_h5p_libraries: "H5Pライブラリを統合：",
    paste_ia_result: "モジュールを作成するために、下のエリアにAIの結果を貼り付けてください。",
    generate_h5p: "H5Pを生成",
    create_xml_file: "XMLファイルを作成",
    paste_ia_result_xml: "下にAIで生成されたXMLを貼り付けてください。",
    generate_xml_file: "XMLファイルを生成",

    create_mbz_file_appariement: "「マッチング」ファイル (.mbz) を作成",
    paste_ia_result_appariement: "下にAIが生成したJSONを貼り付けてください。アクティビティのタイトルはJSONから自動的に抽出されます。",
    generate_mbz_appariement: "「マッチング」活動を生成 (mbz)",
    create_mbz_file_millionnaire: "「ミリオネア」ファイル (.mbz) を作成",
    paste_ia_result_millionnaire: "下にAIが生成したJSONを貼り付けてください。アクティビティのタイトルはJSONから自動的に抽出されます。",
    generate_mbz_millionnaire: "「ミリオネア」活動を生成 (mbz)",

    create_mbz_file_qcm: "MCQファイル (.mbz) を作成",
    paste_ia_result_qcm: "下にAIが生成したJSONを貼り付けてください。アクティビティのタイトルはJSONから自動的に抽出されます。",
    generate_mbz_qcm: "MCQ活動を生成 (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "Moodle XMLがここに表示されます...",
    paste_xml_placeholder: "AIで生成された完全なXMLをここに貼り付けてください...",

    // H5P 空のテキストフィールド
    generate_prompts_placeholder: "『プロンプトを生成』をクリックすると、AI 用プロンプトがここに表示されます。",
    paste_json_or_text: "アクティビティ作成のため、AI が生成した JSON コンテンツまたはテキストをここに貼り付けてください。",

    // Notifications
    prompts_generated_successfully: "プロンプトが正常に生成されました！",
    error_please_fill_fields: "簡単モードのすべてのフィールドを入力してください。",
    error_please_fill_guided_fields: "ガイドモードのすべてのフィールドを入力してください。",
    error_field_empty: "フィールドが空です。まずプロンプトを生成してください。",
    error_copy_failed: "コピーに失敗しました。",
    error_h5p_module_not_found: "モジュール'{moduleKey}'が見つかりません。",
    error_invalid_quiz_json: "クイズのJSONが無効です：{errorMessage}",
    error_invalid_json: "提供されたJSONが無効です。エラー：{errorMessage}",
    error_h5p_creation: "H5P作成エラー：{errorMessage}",
    error_paste_ia_content: "AIで生成されたコンテンツを貼り付けてください。",
    error_compression_module_not_ready: "圧縮モジュールの準備ができていません。少し待ってから再試行してください。",
    h5p_file_generated_successfully: "ファイル{fileName}が正常に生成されました！",
    h5p_creation_failed: "H5Pファイルの作成に失敗しました：{errorMessage}",
    license_info: "GNU GPL v3.0 以降",

    // Flashcards specific UI translations
    flashcards_progress_text: "カード @card / @total",
    flashcards_next: "次へ",
    flashcards_previous: "前へ",
    flashcards_check_answer: "チェック",
    flashcards_your_answer: "あなたの答え",
    flashcards_correct_answer: "正解",
    flashcards_incorrect_answer: "不正解",
    flashcards_show_solution: "正解を表示",
    flashcards_results: "結果",
    flashcards_of_correct: "@total 問中 @score 問正解",
    flashcards_show_results: "結果を表示",
    flashcards_answer_short: "A:",
    flashcards_retry: "再試行",
    flashcards_card_announcement: "不正解です。正解は @answer でした",
    flashcards_correct_announcement: "@answer は正解です。",
    flashcards_page_announcement: "ページ @current / @total",

    ticket: "チケット",
    legal_mentions: "法的通知",

    // Legal Mentions
    legal_title: "法的通知",
    legal_editor_title: "アプリケーション編集者",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "職務: 専門高校 文学-歴史 教師",
    legal_editor_gauthier_remande_email: "メール: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "住所: 39 avenue de Chanzy, 53000 Laval, フランス",
    legal_editor_gauthier_remande_phone: "電話: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "役職: 数学教師およびDRANEミッション担当 – グルノーブルアカデミー",
    legal_editor_emmanuel_gaunard_email: "メール: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "住所: 30 boulevard de la République, 38200 Vienne, France",
    legal_editor_emmanuel_gaunard_phone: "電話: +33 6 46 74 20 94",
    legal_app_description: "ウェブアプリケーション「Caramel」は、H5Pコンテンツを作成するための無料の非営利プロジェクトです。アカウントは不要で、個人データは収集されず、すべてのやり取りはブラウザ内でローカルに行われます。",
    legal_hosting_title: "ホスティング",
    legal_host_name: "<strong>ホスト</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>会社名</strong>: 国民教育・青少年省",
    legal_host_address: "<strong>住所</strong>: 110 rue de Grenelle, 75007 Paris, France",
    legal_host_phone: "<strong>電話</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "発行責任者",
    legal_publication_director_name: "Gauthier REMANDE および Emmanuel GAUNARD、ボランティア編集者として。",
    legal_terms_of_use_title: "一般利用規約",
    legal_terms_of_use_content: "このサイトでは、ユーザーがH5Pコンテンツを生成できます。表示はローカルで行われ、ユーザーデータは送信されません。生成されたコンテンツの使用については、ユーザーが単独で責任を負います。このアプリケーションは無料で提供されており、動作や結果について一切保証しません。編集者は、コンテンツの誤解や不適切な使用について一切の責任を負いません。",
    legal_intellectual_property_title: "知的財産",
    legal_intellectual_property_content: "すべてのソースコード、グラフィック要素、コンテンツは、無料のGNU AGPLv3ライセンスの下でライセンスされています。それぞれのライセンスの条件の下で再利用が許可されています。再配布や変更を行う場合は、元の作成者であるGauthier REMANDEとEmmanuel GAUNARDをクレジットする必要があります。H5Pモジュールで使用されている画像はH5P.orgから取得しています。",
    legal_personal_data_title: "個人データ",
    legal_personal_data_content: "個人データは収集も保存もされません。追跡クッキーは使用されません。セッション履歴はユーザーのローカルブラウザ（localStorage）に保存され、送信されません。GDPRに従い、個人情報は編集者や第三者に送信されません。",
    legal_accessibility_title: "アクセシビリティ",
    legal_accessibility_content: "このアプリケーションは、テーマに応じたダーク/ライトモード、キーボードナビゲーション、ハイコントラストなど、コンピュータでの使用に対応するように設計されています。RGAAの推奨事項に沿って、アクセシビリティの継続的な改善が進められています。",
    legal_applicable_law_title: "適用法",
    legal_applicable_law_content: "このサイトはフランス法に準拠します。紛争が生じた場合、管轄裁判所はリヨンの管轄区域内の裁判所とします。",
    legal_external_libraries_title: "使用されている外部ライブラリ",
    legal_external_libraries_intro: "Caramelアプリケーションは、以下のライセンスの下でいくつかのオープンソースライブラリを使用しています：",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (ライセンス: CC BY 4.0, SIL OFL 1.1, MIT): インターフェースで使用されるアイコンを提供し、ナビゲーションと視覚体験を向上させます。",
    legal_library_jszip: "<strong>JSZip</strong> (ライセンス: MIT または GPLv3): 必要なコンテンツをzipアーカイブに圧縮して.h5pファイルを作成できます。",
    legal_library_clientzip: "<strong>client-zip</strong> (ライセンス: MIT): ファイル圧縮に使用される別のライブラリで、ブラウザで直接.h5pアーカイブを生成するための高性能な代替手段を提供します。",
    legal_library_fflate: "<strong>fflate</strong> (ライセンス: MIT): Moodleモジュール用の.mbzアーカイブを作成するために使用される、データ圧縮および解凍用の非常に高速なライブラリ。",
    legal_library_tarjs: "<strong>tar-js</strong> (ライセンス: MIT): Moodleモジュール用の.mbzファイルを形成するために圧縮前に必要なステップである.tarアーカイブを作成できます。",
    legal_library_ownership: "各ライブラリはそれぞれの作成者の所有物であり、そのライセンスに従って使用されます。",

    // Essay specific UI translations
    essay_checkAnswer: "チェック",
    essay_tryAgain: "再試行",
    essay_showSolution: "解答を表示",
    essay_feedbackHeader: "フィードバック",
    essay_solutionTitle: "解答例",
    remainingChars: "残り文字数: @chars",
    notEnoughChars: "最低@chars文字入力してください！",
    messageSave: "保存しました",
    placeholderText: "ここに書き始めてください...",
    ariaYourResult: "合計@total点中@score点を獲得しました",
    ariaNavigatedToSolution: "テキストエリアの後に新しく含まれた解答例に移動しました。",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "あなたの作品は良いスタートです。アイデアを豊かにするために、トピックを探求し続けてください。",
    essay_overall_feedback_11_30: "興味深い基礎を築きましたね。特定の点を掘り下げることで、あなたの作品はより正確になります。",
    essay_overall_feedback_31_50: "主題の理解は順調に進んでいます。あなたの主張を強化するために、議論をさらに発展させることを検討してください。",
    essay_overall_feedback_51_70: "これは良い作品です。主題をよく理解していることがわかります。いくつかの詳細を追加することで、さらに改善できます。",
    essay_overall_feedback_71_90: "非常に良い作品です！あなたの分析は適切で、よく構成されています。優れた理解を示しています。",
    essay_overall_feedback_91_100: "素晴らしい作品です！あなたの考察は徹底的で、十分に論じられており、主題の完全な習熟を示しています。",

    // True/False Question
    true_false_prompt_role: "あなたは教育設計の専門家で、H5Pアクティビティの正誤問題を作成しています。",
    true_false_prompt_mission: "あなたのミッションは、正誤問題のJSONオブジェクトを生成することです。",
    true_false_prompt_generate_json: "次の構造に基づいてJSONオブジェクトを生成してください：",
    true_false_prompt_json_structure_title: "--- 期待されるJSON構造 ---",
    true_false_prompt_json_structure_main_object: "メインオブジェクトには次のキーが含まれている必要があります：",
    true_false_prompt_question: "`question`: (string) 評価するステートメント。HTMLを含めることができます。",
    true_false_prompt_correct: "`correct`: (string) 正解、「true」または「false」のいずれか。",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) 正解の場合に表示されるコメント。",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) 不正解の場合に表示されるコメント。",
    true_false_prompt_content_rules_title: "--- コンテンツのルール ---",
    true_false_prompt_rule1: "質問は明確なステートメントでなければなりません。",
    true_false_prompt_rule2: "`correct`の値は文字列でなければなりません：「true」または「false」。",
    true_false_prompt_example_json_title: "--- JSONの例 ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "<p>オスロはノルウェーの首都です。</p>",
"correct": "true",
"feedbackOnCorrect": "正解です！オスロは確かにノルウェーの首都です。",
"feedbackOnWrong": "不正解です。ノルウェーの首都はオスロです。"
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "コメントや紹介文なしで、JSONのみを生成してください。",
    true_false_true_text: "正解",
    true_false_false_text: "不正解",
    true_false_score: "合計@total点中@score点を獲得しました",
    true_false_check_answer: "チェック",
    true_false_show_solution_button: "解答を表示",
    true_false_try_again: "再試行",
    true_false_wrong_answer_message: "不正解",
    true_false_correct_answer_message: "正解",
    true_false_score_bar_label: "合計:total点中、:num点を獲得しました",
    true_false_submit_answer: "送信",
    true_false_a11y_check: "解答をチェックします。解答は正解、不正解、または未回答としてマークされます。",
    true_false_a11y_show_solution: "解答を表示します。課題には正解が表示されます。",
    true_false_a11y_retry: "課題を再試行します。すべての解答をリセットして、課題を最初からやり直します。",
    true_false_finish_header: "終了しますか？",
    true_false_finish_body: "本当に終了しますか？",
    true_false_cancel_label: "キャンセル",
    true_false_finish_label: "終了",
    true_false_retry_header: "再試行しますか？",
    true_false_retry_body: "本当に再試行しますか？",
    true_false_retry_confirm_label: "確認",

    // Multiple Choice UI translations
    checkAnswerButton: "チェック",
    showSolutionButton: "解答を表示",
    tryAgainButton: "再試行",
    submitAnswerButton: "送信",
    scoreBarLabel: "合計:total点中、:num点を獲得しました",
    confirmCheckHeader: "終了しますか？",
    confirmCheckBody: "本当に終了しますか？",
    confirmCheckCancelLabel: "キャンセル",
    confirmCheckConfirmLabel: "終了",
    confirmRetryHeader: "再試行しますか？",
    confirmRetryBody: "本当に再試行しますか？",
    confirmRetryCancelLabel: "キャンセル",
    confirmRetryConfirmLabel: "確認",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "あなたはH5P「多肢選択」アクティビティを作成する教育工学の専門家です。",
    multiple_choice_prompt_mission: "**あなたの使命:**",
    multiple_choice_prompt_generate_json: "H5P多肢選択アクティビティ用の完全で有効なJSONオブジェクトを生成してください。",
    multiple_choice_prompt_json_structure_title: "**期待されるJSON構造:**",
    multiple_choice_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    multiple_choice_prompt_question: "`question`: 質問（HTML形式）。",
    multiple_choice_prompt_answers_array: "`answers`: 各回答を表すオブジェクトの配列。",
    multiple_choice_prompt_text: "`text`: 回答テキスト（HTML形式）。",
    multiple_choice_prompt_correct: "`correct`: 正解かどうかを示すブール値（`true`または`false`）。",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現する必要があります。",
    multiple_choice_prompt_content_rules_title: "**コンテンツのルール:**",
    multiple_choice_prompt_rule1: "1.  正解は1つだけです（`\"correct\": true`）。",
    multiple_choice_prompt_rule2: "2.  複数の不正解を提供してください（`\"correct\": false`）。",
    multiple_choice_prompt_example_json_title: "**JSONの例:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "<p>カシス（クロスグリ）の実の本当の色は何ですか？</p>",
"answers": [
{
"correct": true,
"text": "<div>非常に濃い紫</div>"
},
{
"correct": false,
"text": "<div>青</div>"
},
{
"correct": false,
"text": "<div>黒</div>"
}
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // Find the Words UI translations
    check: "チェック",
    tryAgain: "再試行",
    showSolution: "解答を表示",
    found: "@totalWords個中@found個見つかりました",
    timeSpent: "経過時間",
    score: "合計@total点中@score点を獲得しました",
    wordListHeader: "単語リスト",

    // Find the Words Prompt
    find_the_words_prompt_role: "あなたはH5P「単語探し」アクティビティを作成する教育工学の専門家です。",
    find_the_words_prompt_mission: "**あなたの使命:**",
    find_the_words_prompt_generate_json: "H5P単語探しアクティビティ用の完全で有効なJSONオブジェクトを生成してください。",
    find_the_words_prompt_json_structure_title: "**期待されるJSON構造:**",
    find_the_words_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    find_the_words_prompt_task_description: "`taskDescription`: アクティビティの明確な指示。",
    find_the_words_prompt_word_list: "`wordList`: 見つけるべき単語の文字列。カンマ区切りでスペースなし。",
    find_the_words_prompt_content_rules_title: "**コンテンツのルール:**",
    find_the_words_prompt_rule1: "1.  `wordList`はカンマで区切られた単語の単一文字列である必要があります。",
    find_the_words_prompt_example_json_title: "**JSONの例:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "下のグリッドで都市名を探しなさい",
"wordList": "キャンベラ,ミンスク,北京,オスロ,パリ,ロンドン,マドリード,アテネ,東京,モスクワ,ワシントン,ストックホルム"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",
    fillPool: "",

    // Sort the Paragraphs UI translations
    checkAnswer: "チェック",
    submitAnswer: "送信",
    up: "上へ",
    down: "下へ",
    disabled: "無効",
    a11y_yourResult: "合計@total点中@score点を獲得しました",
    a11y_paragraph: "段落",
    a11y_correct: "正解",
    a11y_wrong: "不正解",
    a11y_point: "@score点",
    a11y_sevenOfNine: "@total個中@current個",
    a11y_currentPosition: "リスト内の現在位置",
    a11y_instructionsSelected: "スペースキーを押して並べ替える",
    a11y_instructionsGrabbed: "上下矢印キーで位置を変更、スペースキーでドロップ、エスケープでキャンセル",
    a11y_grabbed: "つかんだ",
    a11y_moved: "移動した",
    a11y_dropped: "ドロップした",
    a11y_reorderCancelled: "並べ替えをキャンセルしました",
    a11y_finalPosition: "最終位置",
    a11y_nextParagraph: "次の段落",
    a11y_correctParagraph: "位置が正しい段落",
    a11y_listDescription: "並べ替え可能な段落のリスト。",
    a11y_listDescriptionCheckAnswer: "結果付きの段落のリスト。",
    a11y_listDescriptionShowSolution: "解答付きの段落のリスト。",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "あなたはH5P「段落の並べ替え」アクティビティを作成する教育工学の専門家です。",
    sort_the_paragraphs_prompt_mission: "**あなたの使命:**",
    sort_the_paragraphs_prompt_generate_json: "H5P段落の並べ替えアクティビティ用の完全で有効なJSONオブジェクトを生成してください。",
    sort_the_paragraphs_prompt_json_structure_title: "**期待されるJSON構造:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: アクティビティの明確な指示。",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: 並べ替える段落を表す文字列の配列。段落は正しい順序でなければなりません。",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現する必要があります。",
    sort_the_paragraphs_prompt_content_rules_title: "**コンテンツのルール:**",
    sort_the_paragraphs_prompt_rule1: "1.  `paragraphs`配列には、正しい論理順序の段落のリストが含まれている必要があります。",
    sort_the_paragraphs_prompt_example_json_title: "**JSONの例:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "<p>私の朝のルーティン:</p>",
"paragraphs": [
"<p>まず、7時30分に起きます</p>",
"<p>次に、服を着ます</p>",
"<p>それから、朝ごはんを食べます</p>",
"<p>その後、歯を磨きます</p>",
"<p>最後に、学校へ行きます</p>"
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "解答を表示",
    retryButtonLabel: "再試行",
    solutionViewTitle: "解答",
    correctText: "正解！",
    incorrectText: "不正解！",
    muteButtonLabel: "ミュート",
    closeButtonLabel: "閉じる",
    slideOfTotal: "スライド @slide / @total",
    nextButtonLabel: "次へ",
    solutionListQuestionNumber: "質問 @question",
    a11yShowSolution: "解答を表示します。課題には正解が表示されます。",
    a11yRetry: "課題を再試行します。すべての解答をリセットして、課題を最初からやり直します。",
    shouldSelect: "選択する必要があります",
    shouldNotSelect: "選択しないでください",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "あなたはH5P「単一選択セット」アクティビティを作成する教育工学の専門家です。",
    single_choice_set_prompt_mission: "**あなたの使命:**",
    single_choice_set_prompt_generate_json: "H5P単一選択セットアクティビティ用の完全で有効なJSONオブジェクトを生成してください。",
    single_choice_set_prompt_json_structure_title: "**期待されるJSON構造:**",
    single_choice_set_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    single_choice_set_prompt_choices_array: "`choices`: 各質問を表すオブジェクトの配列。各オブジェクトには以下が含まれます：",
    single_choice_set_prompt_question: "`question`: 質問。",
    single_choice_set_prompt_answers_array: "`answers`: 文字列の配列。最初の文字列が常に正解です。",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: 最終フィードバック用の6つのオブジェクトの配列で、スコアは0-10、11-30、31-50、51-70、71-90、91-100です。テキスト（`feedback`）は親切で、段階的で、常に肯定的に表現する必要があります。",
    single_choice_set_prompt_content_rules_title: "**コンテンツのルール:**",
    single_choice_set_prompt_rule1: "1. 各`answers`配列では、最初の回答が常に正解です。",
    single_choice_set_prompt_example_json_title: "**JSONの例:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "クコの実は別名 ... とも呼ばれます",
"answers": ["オオカミの実", "ネコの実", "クマの実"]
},
{
"question": "クコの実の原産地は ...",
"answers": ["アジア", "アフリカ", "ヨーロッパ"]
}
],
"overallFeedback": [
{"from": 0, "to": 100, "feedback": ":maxscore 問中 :numcorrect 問正解しました"}
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // Dialog Cards UI translations
    answer: "裏返す",
    next: "次へ",
    prev: "前へ",
    retry: "再試行",
    progressText: "カード @card / @total",
    cardFrontLabel: "カードの表",
    cardBackLabel: "カードの裏",
    tipButtonLabel: "ヒントを表示",
    audioNotSupported: "お使いのブラウザはこのオーディオをサポートしていません",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "あなたはH5P「ダイアログカード」アクティビティを作成する教育工学の専門家です。",
    dialog_cards_prompt_mission: "**あなたの使命:**",
    dialog_cards_prompt_generate_json: "H5Pダイアログカードアクティビティ用の`title`、`description`、`dialogs`キーのみを含むJSONオブジェクトを生成してください。",
    dialog_cards_prompt_json_structure_title: "**期待されるJSON構造:**",
    dialog_cards_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    dialog_cards_prompt_title: "`title`: アクティビティのタイトル（HTML形式）。",
    dialog_cards_prompt_description: "`description`: 簡単な説明または指示（HTML形式）。",
    dialog_cards_prompt_dialogs_array: "`dialogs`: 各カードを表す${nombreQuestions}個のオブジェクトの配列。各オブジェクトには以下が含まれます：",
    dialog_cards_prompt_text: "`text`: カードの表のテキスト（HTML形式）。",
    dialog_cards_prompt_answer: "`answer`: カードの裏のテキスト（HTML形式）。",
    dialog_cards_prompt_tips: "`tips` (任意): ヒント用のオブジェクト。教育的に有用だと判断した場合は、`front`キーで表のヒント、`back`キーで裏のヒントを追加してください。",
    dialog_cards_prompt_content_rules_title: "**コンテンツのルール:**",
    dialog_cards_prompt_rule1: "1. 表（`text`）と裏（`answer`）のテキストは明確かつ簡潔でなければなりません。**読みやすさを向上させ、重要な情報を強調するために、HTML（<strong>で太字、<em>で斜体）でコンテンツをフォーマットしてください。**",
    dialog_cards_prompt_rule2: "2. 画像や音声は追加しないでください。",
    dialog_cards_prompt_rule3: "",
    dialog_cards_prompt_example_json_title: "**JSONの例:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "<p>フランス語で果物の名前を学びましょう</p>",
"description": "<p>果物の名前は日本語で表示されます。カードをめくって正しいフランス語訳を確認しましょう。</p>",
"dialogs": [
{
"text": "<p style=\"text-align: center;\">いちご</p>",
"answer": "<p style=\"text-align: center;\">Fraises</p>",
"image": {
"copyright": {
"license": "CC BY-SA",
"source": "https://commons.wikimedia.org/wiki/File:Bowl_of_Strawberries.jpg",
"author": "ShakataGaNai",
"title": "Bowl_of_Strawberries.jpg",
"version": "4.0"
},
"imageAltText": "緑の葉のついた赤い果物"
},
"audio": [],
"tips": {}
},
{
"text": "<p style=\"text-align: center;\">ラズベリー</p>",
"answer": "<p style=\"text-align: center;\">Framboises</p>",
"image": {
"copyright": {
"license": "CC BY",
"source": "https://commons.wikimedia.org/wiki/File:Summer_raspberries,_2008.jpg",
"title": "Summer_raspberries,_2008.jpg",
"author": "www.bluewaikiki.com",
"version": "4.0"
},
"imageAltText": "赤いベリー"
},
"audio": [],
"tips": {}
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "コメントなしで、`title`、`description`、`dialogs`キーを含む有効なJSONコードのみを生成してください。",

    // Dialog Cards specific UI translations
    correctAnswer: "正解しました！",
    incorrectAnswer: "間違えました",
    round: "ラウンド @round",
    cardsLeft: "残りカード: @number",
    nextRound: "ラウンド @round に進む",
    startOver: "最初からやり直す",
    showSummary: "次へ",
    summary: "概要",
    summaryCardsRight: "正解したカード:",
    summaryCardsWrong: "間違えたカード:",
    summaryCardsNotShown: "プールに表示されなかったカード:",
    summaryOverallScore: "総合スコア",
    summaryCardsCompleted: "学習を完了したカード:",
    summaryCompletedRounds: "完了したラウンド:",
    summaryAllDone: "おめでとうございます！全 @cards 枚のカードを @max 回連続で正解しました！",
    confirmStartingOverHeader: "最初からやり直しますか？",
    confirmStartingOverBody: "すべての進捗が失われます。本当に最初からやり直しますか？",
    confirmStartingOverCancelLabel: "キャンセル",
    confirmStartingOverConfirmLabel: "最初からやり直す",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "あなたは教育設計の専門家で、H5Pアクティビティ「Complex Fill the Blanks」を作成しています。",
    complex_blanks_prompt_mission: "**あなたのミッション:**",
    complex_blanks_prompt_generate_json: "H5PのComplex Fill the Blanksタイプのアクティビティ用に、完全で有効なJSONオブジェクトを生成してください。",
    complex_blanks_prompt_json_structure_title: "**期待されるJSON構造:**",
    complex_blanks_prompt_json_structure_main_object: "メインオブジェクトには`content`と`overallFeedback`キーが含まれている必要があります。",
    complex_blanks_prompt_task: "`task`: 演習の指示（HTML形式）。",
    complex_blanks_prompt_blanks_text: "`blanksText`: `___________`で表される空白を含むテキスト。",
    complex_blanks_prompt_blanks_list: "`blanksList`: 各空白に対応するオブジェクトの配列。出現順に並べます。",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: 正解（`/`で代替案を含めることができます）。",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: 一般的な間違いに対応するオブジェクトの配列。",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: 一般的な間違いのテキスト。",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: この間違いに対する特定のフィードバック（HTML形式）。",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: スコアに基づく一般的なフィードバックの配列。",
    complex_blanks_prompt_content_rules_title: "**コンテンツのルール:**",
    complex_blanks_prompt_rule1: "1. `blanksList`内のオブジェクトの数は、`blanksText`内の空白の数と一致する必要があります。",
    complex_blanks_prompt_rule2: "2. 一般的な間違いと建設的なフィードバックを提供してください。",
    complex_blanks_prompt_rule3: "3. テキストとフィードバックには、`<p>`、`<strong>`、`<em>`などの単純なHTMLタグを含めることができます。",
    complex_blanks_prompt_example_json_title: "**JSONの例:**",
    complex_blanks_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // Chart Prompt
    chart_prompt_role: "あなたは教育設計の専門家で、H5Pアクティビティ「チャート」を作成しています。",
    chart_prompt_mission: "**あなたのミッション:**",
    chart_prompt_generate_json: "H5Pチャートアクティビティ用の完全で有効なJSONオブジェクトを生成してください。",
    chart_prompt_json_structure_title: "**期待されるJSON構造:**",
    chart_prompt_json_structure_main_object: "オブジェクトには以下を含める必要があります：",
    chart_prompt_graph_mode: "`graphMode`: 文脈に基づいて最も関連性の高いチャートの種類（「pieChart」（円グラフ）または「barChart」（棒グラフ））を選択してください。特に指示がない限り。",
    chart_prompt_list_of_types: "`listOfTypes`: チャート内のデータポイントを表すオブジェクトの配列。",
    chart_prompt_value: "`value`: データポイントの数値。",
    chart_prompt_color: "`color`: データポイントの色（16進コード）。",
    chart_prompt_font_color: "`fontColor`: データポイントのテキストの色（16進コード）。",
    chart_prompt_text: "`text`: データポイントのラベル。",
    chart_prompt_figure_definition: "`figureDefinition`: チャートの簡単な説明。",
    chart_prompt_content_rules_title: "**コンテンツのルール:**",
    chart_prompt_rule1: "1. 読みやすさのために対照的な色を選択してください。",
    chart_prompt_rule2: "2. ラベルは短く明確でなければなりません。",
    chart_prompt_rule3: "3. 他の値と比較して非常に低い値がある場合は、視覚化を向上させるために「barChart」を優先してください。",
    chart_prompt_example_json_title: "**JSONの例:**",
    chart_prompt_generate_only_json: "コメントなしで、有効なJSONコードのみを生成してください。",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "前へ",
    quiz_next_button: "次へ",
    quiz_finish_button: "終了",
    quiz_submit_button: "送信",
    quiz_textual_progress: "質問 @current / @total",
    quiz_no_result_message: "完了しました",
    quiz_result_message: "あなたの結果：",
    quiz_score_bar_label: "合計@totals点中@finals点を獲得しました",
    quiz_solution_button_text: "解答を表示",
    quiz_retry_button_text: "再試行",
    quiz_finish_button_text: "終了",
    quiz_submit_button_text: "送信",
    quiz_feedback_available: "フィードバックあり",
    quiz_read_feedback: "フィードバックを読む",
    quiz_wrong_answer: "不正解",
    quiz_correct_answer: "正解",
    quiz_should_check: "チェックされているべきでした",
    quiz_should_not_check: "チェックされているべきではありませんでした",
    quiz_no_input: "解答を表示する前に回答してください。",
    quiz_a11y_check: "解答をチェックします。解答は正解、不正解、または未回答としてマークされます。",
    quiz_a11y_show_solution: "解答を表示します。課題には正解が表示されます。",
    quiz_a11y_retry: "課題を再試行します。すべての解答をリセットして、課題を最初からやり直します。",

    // Albert generation
    generate_with_albert: "Albertで生成",
    generation_in_progress: "生成中です、お待ちください...",
    request_sent_to_ia: "AIにリクエストを送信しました、お待ちください...",
    generation_successful: "H5Pコンテンツが正常に生成されました！",
    generation_failed_empty: "生成に失敗しました。応答が空でした。",
    generation_failed_error: "生成中にエラーが発生しました：{errorMessage}",

    // Albert models description
    albert_small_summary: "高速、シンプル、迅速で構造化された演習に適しています。",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "強力でニュアンスがあり、複雑なタスクやライティングに最適です。",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "専門的で正確、プログラミングとコード用に設計されています。",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "ソースモデル:",
    albert_model_parameters: "モデルサイズ:",
    albert_model_parameters_small: "80億パラメータ",
    albert_model_parameters_large: "240億パラメータ",
    albert_model_parameters_code: "325億パラメータ",
    language: "言語",
    tutorial: "チュートリアル"
};
