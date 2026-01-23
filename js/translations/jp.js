const translations_jp = {
  subtitle: "Moodle と Éléa のための教材・活動の支援作成",
  help_modal_title: "🚀 先生のための Caramel 完全ガイド",
  help_modal_content: `
    <p><strong>Caramel</strong> へようこそ！このガイドは、はじめての方でも安心して使えるよう、手順を一つずつ案内します。目標は、対話的な学習活動を、かんたん・効率的に作成できるようにすることです。</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> 記述する</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> 選ぶ</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> 生成する</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> プレビューとダウンロード</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> コミュニティ</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> 私たちの理念：主導権は先生に！</h4>
        <p>Caramel では、AI はアシスタントにすぎません。操縦するのは先生です。各段階で先生がコントロールします。</p>
        <ul>
            <li><strong>前：</strong> 記述フィールドを埋めて、授業の枠組みを先生が定めます。</li>
            <li><strong>中：</strong> AI が内容（JSON コード）を生成したら、エディタで直接編集して微調整できます。</li>
            <li><strong>後：</strong> ファイルをダウンロードした後でも、他のツールで開いて編集できます。</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> ニーズを記述：出発点</h4>
        <p>すべてはここから始まります。説明が明確であるほど、結果は適切になります。方法は 2 つあります。</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">クイックモード</span></h5>
            <p>要点重視。次の 2 項目を入力します。</p>
            <ul>
                <li><strong>あなたは誰？</strong> 端的に。文章である必要はありません。例：<em>数学教師</em>、<em>アカデミックトレーナー</em>。</li>
                <li><strong>何を扱う？</strong> 依頼の核心です。できるだけ具体的に。テーマ・学年・条件など。例：<em>中学 1 年生向けの分数入門。ケーキを分けるなどの具体例を含む。</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">高度なモード</span></h5>
            <p>より構造化した依頼に。以下のような正確な入力欄があります。</p>
            <ul>
                <li><strong>教科・テーマ・学年：</strong> 文脈を定義。</li>
                <li><strong>要素数：</strong> 重要！ 質問数、年表の件数、用語集の語数など。</li>
                <li><strong>追加情報：：</strong> 指示・制約・その他の詳細を記入。</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> ドキュメント参照を有効化</span><br>
            この強力なオプションにより、提供されたコンテンツに基づいて生成を行うことができます。<strong>テキストをコピー＆ペースト</strong>するか、<strong>ドキュメントをアップロード (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>することができます。
            <br><strong><i class="fas fa-lock"></i> プライバシー：</strong> ご安心ください。ドキュメントの処理は<strong>すべてお使いのコンピューター上でローカルに</strong>行われます。インターネットにデータが送信されることはありません。</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> 活動タイプを選択</h4>
        <p>記述が完了すると、活動タイルが有効になります。目的に合うものをクリックしてください。</p>
        <details>
            <summary><strong>利用可能な活動の詳細を見る</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>H5P 形式の対話型活動。<span class="feedback-star">*</span> が付いたものは、6 段階のスコア帯に対応した詳細フィードバックを既定で含みます。</p>
            <ul>
                <li><strong>年表：</strong> 出来事の連なりを示す対話的タイムライン。</li>
                <li><strong>フラッシュカード：</strong> 暗記用の表裏カード。</li>
                <li><strong>クイズ（Question Set）<span class="feedback-star">*</span>：</strong> 多様な問題（選択式・ドラッグ＆ドロップ等）。</li>
                <li><strong>用語集：</strong> アコーディオン形式の用語集／FAQ。</li>
                <li><strong>クロスワード <span class="feedback-star">*</span>：</strong> 定義からクロスワードを生成。</li>
                <li><strong>作文 <span class="feedback-star">*</span>：</strong> キーワードに基づく自動採点つき課題。</li>
                <li><strong>要約 <span class="feedback-star">*</span>：</strong> 適切な文を選んで要約を再構成。</li>
                <li><strong>語句ドラッグ <span class="feedback-star">*</span>：</strong> 欠落語をドラッグで補完するテキスト。</li>
                <li><strong>穴埋め <span class="feedback-star">*</span>：</strong> 欠落語をキーボードで入力。</li>
                <li><strong>語句ハイライト <span class="feedback-star">*</span>：：</strong> 指定語を本文で強調。</li>
                <li><strong>○/×：</strong> 単純な二択。</li>
                <li><strong>多肢選択 <span class="feedback-star">*</span>：</strong> 正解が一つまたは複数の MCQ。</li>
                <li><strong>ワードサーチ：：</strong> 文字盤から単語を探す。</li>
                <li><strong>段落並べ替え <span class="feedback-star">*</span>：</strong> 段落を正しい順に。</li>
                <li><strong>単一選択シリーズ <span class="feedback-star">*</span>：</strong> 各問 1 正解の連続問題。</li>
                <li><strong>ダイアログカード：</strong> 文字と音声の表裏カード。</li>
                <li><strong>高度な穴埋め <span class="feedback-star">*</span>：</strong> 誤答ごとの特定フィードバック。</li>
                <li><strong>グラフ：</strong> 円グラフ・棒グラフでデータ可視化。</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>テスト（XML / GIFT）：</strong> 多様な問題バンク（選択式・マッチング等）を Moodle にインポート。</li>
                <li><strong>MCQ（MBZ）：</strong> かんたん・迅速な多肢選択活動。</li>
                <li><strong>マッチング（MBZ）：：</strong> 要素ペアを対応させるゲーム。</li>
                <li><strong>ミリオネア（MBZ）：</strong> 問ごとに難度が上がるクイズ。</li>
                <li><strong>用語集（XML）：</strong> 定義リストを Moodle の用語集へインポート。</li>
                <li><strong>ページ（MBZ / HTML）：</strong> Éléa 向けの構造化・装飾済みページ。</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> 生成して磨く</h4>
        <p>タイルをクリックするとウィンドウが開き、ここで AI とやり取りします。</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> オプションA：シンプル表示 - ワンクリック生成</h5>
            <p>最短ルート。<button class="help-btn-example-llm">ワンクリック生成</button> を押すと、AI が内容を生成し、右の結果領域に直接配置します。ボタン右側の小さな矢印から（高速・高性能など）モデルを選べます。</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> オプションB：ガイド表示 - 外部 AI を使う</h5>
            <p>最大限のコントロールに。左側にプロンプト（AI への指示）が表示されます。</p>
            <ol>
                <li>必要に応じてプロンプトを編集。</li>
                <li><strong>プロンプトをコピー</strong> ボタンを使用し、お好みの一般向けAIを新しいタブで開いてください。</li>
                <li>AI に貼り付けて実行し、結果を右の結果領域（Caramel）に貼り付けます。</li>
            </ol>
            <p>便利なアイコン：<span class="help-badge-icon"><i class="fas fa-expand"></i> 全画面</span>、<span class="help-badge-icon"><i class="fas fa-lock"></i> ロック</span>（プロンプト保護）。</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> プレビューとダウンロード</h4>
        <p>コンテンツが生成されると、さまざまな形式でプレビュー、テスト、ダウンロードができます。</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> プレビューとテスト</summary>
            <p>プレビューウィンドウでアクティビティを確認してください：</p>
            <ul>
                <li><strong>スクロール</strong>して内容をすべて読み返します。</li>
                <li>生徒としてアクティビティを<strong>テスト</strong>します（クリック、ドラッグ、入力など）。</li>
                <li><strong>Éléa/Magistère/Moodle</strong> コンテンツの場合、シミュレーターで実際の表示を確認できます。</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="プレビューウィンドウ" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>シミュレーターで直接アクティビティをテストします。</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> ダウンロード（形式とエクスポート）</summary>
            <p>作業内容を取得するためのオプションがいくつかあります：</p>
            <ul>
                <li><strong>インタラクティブ形式（メインボタン）：</strong> プラットフォームに配置するためのデジタルファイル（例：.h5p, .mbz）を取得します。</li>
                <li><strong>その他の形式（ドロップダウンメニュー）：</strong> 矢印をクリックして <strong>PDF, DOCX, ODT</strong> 形式でダウンロードします（印刷やアーカイブに便利です）。</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="エクスポートメニュー" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>メニューを展開して PDF や DOCX のエクスポートにアクセスします...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Éléa/Magistère への統合</h5>
        <p>ファイルをダウンロードしたら、コースに追加する方法は次のとおりです：</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span>（H5P 活動）</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>簡単な方法:</strong> コースの編集モードをオンにし、.h5p ファイルを目的のセクションへドラッグ＆ドロップします。「Ajouter une activité H5P」を選び、「DÉPOSER」ボタンで完了します。
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="H5P アクティビティを素早く追加" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>H5P アクティビティを追加して DÉPOSER をクリック。</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>推奨方法 (制作者向け):</strong> 「活動またはリソースを追加」をクリックし、「インタラクティブコンテンツ (H5P)」を選択。続いて「エディター」欄で「Téléverser」タブを開き、「Téléverser un fichier」を実行します。「Utiliser」で確定し、必要な要素を追加して保存してください。共有しても活動が確実に含まれます。</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span>（ページ、ミリオネア、マッチング、MCQ）</summary>
                <div class="import-content">
                    <p>この形式は完全な活動をコースにインポートします。</p>
                    <ol>
                        <li>
                            <p>画面右側の編集メニューを開きます。閉じている場合は小さな矢印で展開してください。</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="右カラムに表示された編集メニュー" style="width:75%;height:auto;">
                                    <figcaption><em>編集メニューを展開。</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="編集パネルを開く矢印" style="width:75%;height:auto;">
                                    <figcaption><em>必要ならパネルを開く。</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>「IMPORT/EXPORT」をクリックし、表示されたサブメニューから「Importer un parcours」を選びます。</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="Moodle/Éléa の IMPORT/EXPORT ボタン" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Importer un parcours を選択。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            .mbz ファイルをインポート領域へドラッグ＆ドロップし、「IMPORTER」をクリックします。
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="MBZ ファイルを配置するエリア" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>ファイルを置き、IMPORTER で確定。</em></figcaption>
                            </figure>
                        </li>
                        <li>最後に「CONTINUER」を押してウィザードを完了すると、活動がコースに追加されます。</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span>（用語集活動）</summary>
                <div class="import-content">
                    <p>この形式により、定義のリストをÉléa/Moodle用語集にインポートできます。</p>
                    <ol>
                        <li>
                            <p>コースに空の用語集活動を作成し、開きます。</p>
                        </li>
                        <li>
                            <p>用語集の中に入ったら、「IMPORTER DES ARTICLES」ボタンをクリックします。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="用語集のIMPORTER DES ARTICLESボタン" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>IMPORTER DES ARTICLESをクリックします。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>.xmlファイルをインポート領域にドラッグ＆ドロップし、「ENVOYER」ボタンをクリックします。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="用語集XMLファイルのドロップゾーン" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>ファイルをドロップし、ENVOYERで検証します。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>エントリが検出されました。「CONTINUER」ボタンをクリックして完了します。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="検出されたエントリの確認" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>CONTINUERをクリックしてインポートを完了します。</em></figcaption>
                            </figure>
                        </li>
                        <li>インポートが完了しました。定義が用語集で利用可能になりました。</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> と <span class="help-badge-file">.GIFT</span>（テスト活動）</summary>
                <div class="import-content">
                    <p>これらは「問題バンク」に質問をインポートします。</p>
                    <ol>
                        <li>
                            <p>Éléaコースで、「その他」タブに移動し、「問題バンク」をクリックします。</p>
                        </li>
                        <li>
                            <p>「質問」と表示されているドロップダウンメニューで、「インポート」を選択します。</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="問題バンクのインポートボタンの選択" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>ドロップダウンメニューからインポートを選択します。</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>ファイルに対応する形式を選択します：</p>
                            <ul>
                                <li><strong>Moodle XML 形式</strong>（推奨）：すべての質問タイプをサポートする完全な形式。</li>
                                <li><strong>GIFT 形式</strong>：より簡単な代替形式ですが、質問タイプが制限されています。</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Moodle XML形式とGIFT形式の選択" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>ファイルに適した形式を選択します。</em></figcaption>
                            </figure>
                        </li>
                        <li>ファイルをアップロード領域にドラッグ＆ドロップします。</li>
                        <li>「IMPORTATION」ボタンをクリックします。画面には追加された質問が表示されます（例：10問が追加されました）。</li>
                        <li>ページ下部の「CONTINUER」をクリックして完了します。</li>
                        <li>質問はテスト活動に追加する準備が整いました。テスト活動を作成し、バンクから質問を読み込む方法については、<a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">Éléaチュートリアル</a>を参照してください。</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span>（ページ活動の代替）</summary>
                <div class="import-content">
                    <p>内容を手動で管理したい場合。</p>
                    <ol>
                        <li>.html をテキストエディタ（例：メモ帳）で開き、全内容をコピー。</li>
                        <li>Éléa で「ページ」活動を追加。</li>
                        <li>ページのエディターでアイコンをクリックしてHTMLモードに切り替えます（多くの場合「&lt;&gt;」で表示されます）。</li>
                        <li>コピーした内容を貼り付け、保存します。</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> コミュニティとサポート</h4>
        <p>Caramel は生きたプロジェクト。皆さまの声が力になります！</p>
        <ul>
            <li><strong>交流・質問：</strong> コミュニティと交流できる <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> ルームに参加してください。</li>
            <li><strong>バグ報告：</strong> 問題が見つかったら <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">Issue</a> を作成。可能ならエラーを引き起こした JSON を添付してください。</li>
            <li><strong>プロジェクト支援：</strong> 気に入ったら <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">Forge ページ</a> にスターを。最高の励みになります！</li>
        </ul>
    </div>
    `,

  // ============================================================================
  // メインインターフェース
  // ============================================================================
  language: "言語",
  tutorial: "チュートリアル",
  notifications: "通知",
  fast_mode: "クイックモード",
  guided_mode: "詳細モード",
  who_are_you: "あなたの役割は？（例：教師、トレーナーなど）",
  what_to_address: "取り組みたいテーマは？（例：フランス革命など）",
  level: "対象レベル（例：高校2年生）",
  number_of_elements: "問題数/要素数（例：5）",

  // ============================================================================
  // ドキュメント解析 (RAG/OCR)
  // ============================================================================
  rag_title: "ドキュメントの添付（任意）",
  rag_note: "AIに自分のドキュメントのみに基づいて作業させたい場合は、ここにテキストを貼り付けるかファイルをドロップしてください。空欄のままにすると、AIが自ら情報を検索します。",
  error_duplicate_file: "このファイルは既に追加されています。",
  error_unsupported_format: "未対応の形式です。対応形式：",
  ocr_scanned_page: "スキャンされたページを検出、OCRを実行中",
  ocr_image_processing: "画像の文字認識 (OCR) 中",
  ocr_initializing: "OCRを初期化中...",
  ocr_loading_language: "言語モデルを読み込み中...",
  ocr_preparing: "解析を準備中...",
  docx_processing: "DOCXテキストを抽出中...",
  pptx_processing: "PPTXテキストを抽出中...",
  odt_processing: "ODTテキストを抽出中...",
  odp_processing: "ODPテキストを抽出中...",
  file_loading: "ファイルを読み込み中...",
  extraction_success: "ドキュメントの処理に成功しました。",
  extraction_error: "処理中にエラーが発生しました。",
  error_fullscreen: "全画面表示に失敗しました:",
  lock_text: "ロック",
  unlock_text: "ロック解除",
  drag_drop_text: "ここにドキュメントをドラッグ＆ドロップ (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "または",
  upload_pdf_btn: "ファイルを選択",
  paste_your_text_here: "ここにテキストを貼り付けてください...",
  rag_tags_tuto: "以下はアップロードされたドキュメントです。色の付いた円をクリックして、各ドキュメントのハイライトをカスタマイズできます。",

  // ============================================================================
  // タブ
  // ============================================================================
  tab_all: "すべて",
  tab_quiz: "クイズ＆テスト",
  tab_text: "テキスト操作",
  tab_memory: "暗記＆発見",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // H5P アクティビティ詳細
  // ============================================================================
  h5p_timeline_name: "年表",
  h5p_timeline_description: "一連の出来事を提示するためのインタラクティブな年表を作成します。",
  h5p_flashcards_name: "フラッシュカード",
  h5p_flashcards_description: "用語と定義の暗記を助ける両面のカードを作成します。",
  h5p_quiz_set_name: "ミックスクイズ",
  h5p_quiz_set_description: "知識を評価するために、さまざまな問題（選択式、ドラッグ＆ドロップなど）を構成します。",
  h5p_quiz_set_qcm_name: "選択式クイズ",
  h5p_quiz_set_qcm_description: "選択式問題のみで構成されるクイズを作成します。",
  h5p_quiz_set_vf_name: "〇×クイズ",
  h5p_quiz_set_vf_description: "真偽（〇×）形式の質問のみで構成されるクイズを作成します。",
  h5p_glossary_name: "用語集",
  h5p_glossary_description: "折りたたみ式のアコーディオン形式で用語集やFAQを作成します。",
  h5p_crossword_name: "クロスワード",
  h5p_crossword_description: "単語と定義のリストからクロスワードパズルを生成します。",
  h5p_essay_name: "作文",
  h5p_essay_description: "作文のテーマを提示し、自動採点用のキーワードを設定します。",
  h5p_summary_name: "要約",
  h5p_summary_description: "生徒は正しい文章を選択して要約を完成させます。",
  h5p_drag_the_words_name: "単語のドラッグ",
  h5p_drag_the_words_description: "生徒が欠けている単語をドラッグして埋める穴埋め問題を作成します。",
  h5p_fill_in_the_blanks_name: "穴埋めテキスト",
  h5p_fill_in_the_blanks_description: "生徒がキーボードで欠けている単語を直接入力する穴埋め問題です。",
  h5p_mark_the_words_name: "単語のマーク",
  h5p_mark_the_words_description: "パラグラフ内の特定の単語を生徒にマークさせます。",
  h5p_true_false_name: "○×クイズ",
  h5p_true_false_description: "「正しい」か「間違い」かの二択問題を<strong style='color: red;'>1問</strong>作成します。",
  h5p_multiple_choice_name: "多肢選択問題",
  h5p_multiple_choice_description: "1つまたは複数の正解がある選択肢問題を<strong style='color: red;'>1問</strong>作成します。",
  h5p_find_the_words_name: "ワードサーチ",
  h5p_find_the_words_description: "文字のグリッドから単語を見つけるパズルを作成します。",
  h5p_sort_the_paragraphs_name: "段落の並べ替え",
  h5p_sort_the_paragraphs_description: "生徒が正しい順序に並べ替える段落のセットを作成します。",
  h5p_single_choice_set_name: "単一選択クイズセット",
  h5p_single_choice_set_description: "各問題に正解が1つだけある一連のクイズを作成します。",
  h5p_dialog_cards_name: "ダイアログカード",
  h5p_dialog_cards_description: "テキストや画像を含むインタラクティブな両面カードを作成します。",
  h5p_complex_fill_the_blanks_name: "高度な穴埋め",
  h5p_complex_fill_the_blanks_description: "間違いごとに特定のフィードバックを設定できる高度な穴埋め問題です。",
  h5p_chart_name: "チャート",
  h5p_chart_description: "データを視覚化するための円グラフや棒グラフを作成します。",

  // ============================================================================
  // ÉLÉA/MOODLE アクティビティ詳細
  // ============================================================================
  moodle_xml_name: "テスト",
  moodle_xml_description: "「小テスト」アクティビティに直接インポートできる問題バンクを生成します (XMLまたはGIFT形式)。",
  moodle_xml_help: "Moodleの「小テスト」にXMLファイルを追加するには、まずアクティビティを作成します。次に、<strong>さらに表示</strong>メニューから<strong>問題バンク</strong>に移動し、<strong>インポート</strong>をクリックして<strong>Moodle XML形式</strong>を選択し、ファイルをアップロードして実行してください。",
  moodle_gift_name: "GIFT形式",
  moodle_gift_description: "Moodleに問題を簡単にインポートできるGIFT形式で問題を作成します。",
  moodle_millionnaire_name: "ミリオネア",
  moodle_millionnaire_description: "難易度が段階的に上がる6問構成の「ミリオネア」アクティビティを生成します。",
  moodle_appariement_name: "マッチング",
  moodle_appariement_description: "10問のマッチング（結びつけ）アクティビティを生成します。",
  moodle_qcm_name: "多肢選択式",
  moodle_qcm_description: "シンプルな多肢選択式アクティビティを生成します。",
  moodle_glossaire_xml_name: "用語集 (XML)",
  moodle_glossaire_xml_description: "XML形式でインポート可能な用語集を生成します。",
  glossaire_success_generation: "ファイル {fileName} が正常に生成されました！",
  glossaire_error_creation: "用語集XMLの作成中にエラーが発生しました:",
  glossaire_error_invalid_json: "JSONには名前 ('name') とエントリ配列 ('entries') が含まれている必要があります。",
  elea_page_name: "ページ",
  elea_page_description: "視覚的にデザインされた Éléa コンテンツページを作成します。",

  // ============================================================================
  // 生成モーダル
  // ============================================================================
  get_prompt_step: "1/2 プロンプトを取得してコピー",
  create_file_step: "2/2 JSONからファイルを作成",
  generate_one_click: "ワンクリック生成",
  simple_mode: "シンプル",
  advanced_mode: "ガイド付き",
  prompt_for_ia: "AI用プロンプト",
  copy_prompt: "プロンプトをコピー",
  fullscreen_prompt: "全画面表示",
  exit_fullscreen_prompt: "全画面解除",
  lock_prompt: "ロック",
  unlock_prompt: "ロック解除",
  go_duck: "コピーして Duck.ai へ",
  go_mistral: "コピーして Le chat へ",
  create_h5p_file: "H5Pファイルを作成",
  integrate_h5p_libraries: "H5Pライブラリを統合：",
  paste_ia_result: "以下のエリアにAIの結果を貼り付けてモジュールを作成してください。",
  generate_h5p: "H5Pを生成",
  create_xml_file: "XMLファイルを作成",
  paste_ia_result_xml: "AIによって生成されたXMLを以下に貼り付けてください。",
  generate_xml_file: "XMLファイルを生成",
  export_mbz: "MBZ形式",
  export_gift: "GIFT形式",
  export_xml: "XML形式",
  export_html: "HTML形式",
  export_docx: "DOCX形式",
  export_odt: "ODT形式",
  export_pdf: "PDF形式",
  export_error: "エクスポートエラー",
  create_mbz_file_appariement: "マッチングファイルを作成 (.mbz)",
  paste_ia_result_appariement: "AIが生成したJSONを以下に貼り付けてください。タイトルは自動的に抽出されます。",
  generate_mbz_appariement: "マッチングアクティビティを生成 (mbz)",
  create_mbz_file_millionnaire: "ミリオネアファイルを作成 (.mbz)",
  paste_ia_result_millionnaire: "AIが生成したJSONを以下に貼り付けてください。タイトルは自動的に抽出されます。",
  generate_mbz_millionnaire: "ミリオネアアクティビティを生成 (mbz)",
  generate_mbz_test: "テストアクティビティを生成 (mbz)",
  create_mbz_file_qcm: "多肢選択式ファイルを作成 (.mbz)",
  paste_ia_result_qcm: "AIが生成したJSONを以下に貼り付けてください。タイトルは自動的に抽出されます。",
  generate_mbz_qcm: "多肢選択式アクティビティを生成 (mbz)",
  create_mbz_file_page: "ページファイルを作成 (.mbz)",
  paste_ia_result_page: "ページを構築するために、AIが生成したJSONを以下に貼り付けてください。",
  generate_mbz_page: "ページアクティビティを生成 (mbz)",
  generate_prompts_placeholder: "クイックモードまたは詳細モードで少なくとも1つのフィールドを入力すると、AI用プロンプトがここに表示されます。",
  paste_json_or_text: "アクティビティを作成するために、AIが生成したJSONまたはテキストをここに貼り付けてください。",
  info_prompt_copy: "このプロンプトを右側のパネルに貼り付けないでください。一般のAIにコピーして結果を取得し、その結果を右側のパネルに貼り付けてください。",
  generate_with_llm: "Caramel AI で生成",
  generation_in_progress: "生成中、少々お待ちください...",
  request_sent_to_ia: "AIにリクエストを送信しました。お待ちください...",
  generation_successful: "H5Pコンテンツの生成に成功しました！",
  generation_failed_empty: "生成に失敗しました。応答が空でした。",
  generation_failed_error: "生成エラー：{errorMessage}",
  generation_failed_llm: "Caramel AI による生成に失敗しました。原因：{errorMessage}",
  llm_small_summary: "Caramel mou：高速で軽量。簡単な演習や即座の回答に最適。低リソース消費。",
  llm_large_summary: "Caramel coulant：より豊かで繊細。深みが必要なタスクに理想的。中リソース消費。",
  llm_xl_summary: "Caramel dur：強力で複雑。野心的なプロジェクト用。時間はかかりますが結果は保証されます。高リソース消費。",
  llm_model_source: "モデル提供元：",
  llm_model_parameters: "モデルサイズ：",
  llm_model_parameters_unit: "億パラメータ",

  // ============================================================================
  // キャラメル調理アニメーション
  // ============================================================================
  caramel_animation_step_1: "鍋に砂糖を入れます...",
  caramel_animation_step_2: "少し水を加えます...",
  caramel_animation_step_3: "中火にかけます...",
  caramel_animation_step_4: "砂糖が溶け始めます...",
  caramel_animation_step_5: "色づき始めます...",
  caramel_animation_step_6: "ゆっくりとかき混ぜます...",
  caramel_animation_step_7: "キャラメルがきれいな琥珀色になります...",
  caramel_animation_step_8: "温めた生クリームを加えます...",
  caramel_animation_step_9: "はねるのに気をつけて！",
  caramel_animation_step_10: "よく混ぜます...",
  caramel_animation_step_11: "もうすぐ出来上がりです！",
  caramel_success_title: "お菓子が完成しました！",

  // ============================================================================
  // 通知とエラー
  // ============================================================================
  prompts_generated_successfully: "プロンプトの生成に成功しました！",
  success_copy: "✓ コピーしました！",
  error_please_fill_fields: "クイックモードのフィールドを1つ以上入力してください。",
  error_please_fill_guided_fields: "詳細モードのフィールドを1つ以上入力してください。",
  error_field_empty: "フィールドが空です。まずプロンプトを生成してください。",
  error_copy_failed: "コピーに失敗しました。",
  error_h5p_module_not_found: "モジュール '{moduleKey}' が見つかりません。",
  error_invalid_quiz_json: "クイズのJSONが無効です : {errorMessage}",
  error_invalid_json: "指定されたJSONは無効です。エラー: {errorMessage}",
  error_h5p_creation: "H5P作成エラー: {errorMessage}",
  error_paste_ia_content: "AIによって生成されたコンテンツを貼り付けてください。",
  error_compression_module_not_ready: "圧縮モジュールの準備ができていません。しばらくしてからやり直してください。",
  h5p_file_generated_successfully: "ファイル {fileName} の生成に成功しました！",
  h5p_creation_failed: "H5Pファイルの作成に失敗しました : {errorMessage}",
  error_paste_json_content: "生成されたJSONコンテンツを貼り付けてください。",
  error_paste_xml_content: "生成されたXMLコンテンツを貼り付けてください。",
  moodle_xml_success_generation: "ファイル {fileName} の生成に成功しました！",
  test_error_creation_mbz: "テスト用MBZの作成中にエラーが発生しました:",
  test_success_generation: "ファイル {fileName} の生成に成功しました！",
  test_error_generic: "エラー :",
  test_backup_log: "Caramelによって自動生成されたバックアップ\n",
  millionnaire_error_compression_libs: "圧縮ライブラリ（Tar.jsまたはfflate）が読み込まれていません。インターネット接続を確認するか、ページを更新してください。",
  millionnaire_error_invalid_json: "JSON構造が無効です。例に従って、'title'と6つの質問を含む'questions'配列があることを確認してください。",
  millionnaire_activity_intro: "知識を試すためにこのゲームに参加してください。",
  millionnaire_backup_log: "Caramelによって自動生成されたバックアップ\n",
  millionnaire_success_generation: "ファイル {fileName} の生成に成功しました！",
  millionnaire_error_creation_mbz: "MBZ作成中にエラーが発生しました:",
  millionnaire_error_generic: "エラー :",
  appariement_error_invalid_json: "JSON構造が無効です。'title'と、各ペアに'question'と'answer'が含まれる'pairs'配列があることを確認してください。",
  appariement_activity_intro: "対応するペアを見つけてください。",
  appariement_success_generation: "ファイル {fileName} の生成に成功しました！",
  appariement_error_creation_mbz: "マッチング用MBZの作成中にエラーが発生しました:",
  qcm_error_invalid_json: "JSON構造が無効です。'title'と、少なくとも1つの質問と回答を含む'questions'配列があることを確認してください。",
  qcm_activity_intro: "以下の質問に答えてください。",
  qcm_success_generation: "ファイル {fileName} の生成に成功しました！",
  qcm_error_creation_mbz: "QCM用MBZの作成中にエラーが発生しました:",
  version_modal_title: "新しいバージョンが利用可能です",
  version_modal_message: "現在バージョン {currentVersion} を使用しています。より新しいバージョン ({latestVersion}) が利用可能です。ページをリロードして最新の改善機能を利用してください。",
  version_modal_update: "新バージョンを読み込む",
  version_modal_remind_later: "後で知らせる",

  prompt_header_pedagogical_context: "教育的背景",
  prompt_header_specific_rules: "特定のルール",
  prompt_header_pedagogical_rules: "教育的ルール",
  prompt_header_sources: "ソース",
  prompt_header_json_structure: "期待されるJSON構造",
  prompt_header_rendering_example: "レンダリング例",
  prompt_fallback_teacher: "教師",
  prompt_fallback_activity: "教育活動を作成する",

  // ============================================================================

  // --- 共通キー ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- あなたの役割：[QUI]。教育学および教育工学の専門家
- あなたの教育目標：[QUOI]
- 対象：[NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- 適応と言語：指示のトーン、語彙、難易度を指定された対象に合わせて調整してください。適切で魅力的な内容にしてください。
- トーンとフィードバック：指示とコメントは建設的で、励ましになり、学習に向けられたものである必要があります。
- 遵守：内容は必ず現行の公式リファレンスに合わせてください。特に明記されていない限り、デフォルトで学齢対象の場合はフランスの教育課程（Eduscol）に、成人の場合は職業訓練の規制テキストに基づき作成してください。
- 言語：内容と指示は日本語で記述してください。`,

  SOURCES_COMMUNES: `- アクティビティの生成には、以下のテキストのみを使用してください。
---
[RAG]
---`,

  // ============================================================================
  // === 年表 ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- イベント数：最低5つのイベント || [NOMBRE_ELEMENTS] 個のイベント。
- 期間 (era)：イベントのグループをカバーする最低2つの期間。
- メディア：可能な限り、各アセットにクレジットとキャプションを追加してください。関連性があり、著作権フリーの画像（例：Wikimedia Commons）を積極的に探してください。`,

  TIMELINE_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- **ルートオブジェクト：** \`timeline\`（オブジェクト）キーを含みます。
- **\`timeline\`の内容：** アクティビティのメイン構造。
  - \`headline\`：年表の全体的なタイトル（必須のプレーンテキスト）。
  - \`text\`：魅力的な導入文（Markdown対応）。
  - \`asset\`：カバーメディア （\`media\`：直接URL、 \`caption\`：キャプション、 \`credit\`：出典）。
  - \`date\`：時系列イベントの配列。
  - \`era\`：背景期間の配列（背景に色付きの範囲を定義します）。
- **\`date\` および \`era\` オブジェクトの構造：**
  - \`startDate\`：**厳密な形式** \`YYYY,MM,DD\` または \`YYYY\`。（必須）
  - \`endDate\`：**厳密な形式** \`YYYY,MM,DD\` または \`YYYY\`。（任意、期間の長さ/終了を定義します）
  - \`headline\`：要素の明示的なタイトル（必須のプレーンテキスト）。
  - \`text\`：教育的なナラティブ。太字は \`**太字**\`、斜体は \`*斜体*\`、改行は \`\\n\` を使用してください。
  - \`asset\`：(任意) メディアオブジェクト（\`media\`：Wikimedia Commonsの直接URL、 \`caption\`、 \`credit\`）。
  - \`tag\`：フィルタリングを可能にする短いキーワード（例：'政治'、'科学'）。
- **LaTeX：** ダブルエスケープを使用してください： \`\\\\( (2^3)^2 \\\\)\`。`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "宇宙征服の歴史",
    "text": "人類の**宇宙**への冒険を彩った大きな段階を発見しましょう。",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "アポロ11号の打ち上げ。",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "スプートニク1号の打ち上げ",
        "text": "ソ連によって**世界初の人工衛星**が軌道に投入されました。",
        "tag": "ロボット工学"
      },
      {
        "startDate": "1969,07,20",
        "headline": "月面への第一歩",
        "text": "ニール・アームストロングが**アポロ11号**のミッションで月を歩いた最初の人間となりました。",
        "tag": "人類"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "宇宙の冷戦",
        "text": "アメリカ合衆国とソ連の間の激しい競争の時代。",
        "tag": "背景"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === クロスワード ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- 単語数：最低6語 || [NOMBRE_ELEMENTS] 語。
- 表記規則：回答 (\`answer\`) は文字のみを含める必要があります。複合語、略語、表現は、スペース、ハイフン、その他の文字を含まず、1つの単語に結合する必要があります（例：'arc-en-ciel' は 'arcenciel' になります）。
- ヒント (\`clue\`)：ヒントの中に答えとなる単語を書くことは禁止されています。短く、正確である必要があります。
- 追加ヒント (\`extraClue\`)：AIは追加することの妥当性を判断する必要があります。`,

  CROSSWORD_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- \`title\`：アクティビティのタイトル。
- \`words\`：以下を含むオブジェクトの配列：
  - \`answer\`：推測する単語（スペースやハイフンなしで結合）。
  - \`clue\`：短く正確な定義。
  - \`extraClue\`（任意）： \`{"params": {"text": "..."}}\` オブジェクト。テキスト内では、太字は \`**太字**\`、斜体は \`*斜体*\`、改行は \`\\n\` を使用できます。
- \`taskDescription\`：明確で文脈に沿った指示。太字は \`**太字**\`、斜体は \`*斜体*\`、改行は \`\\n\` を使用してください。改行の後、次のように明記してください：「複合語の場合は、スペースやハイフンを入れないでください（例：'porte-clés' の場合は 'portecles'）。」
- \`overallFeedback\`：（厳密なルール）演習のテーマに沿った最終フィードバックとして、0-10、11-30, 31-50, 51-70, 71-90、そして91-100のスコア範囲を厳密に守り、6つのオブジェクトの配列を必ず生成してください。`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "生物学に関するクロスワード",
  "words": [
    {"answer": "Cellule", "clue": "生命の基本単位。", "extraClue": {"params": {"text": "それは**動物性**または**植物性**であり得ます。"}}},
    {"answer": "ADN", "clue": "遺伝情報を運ぶ分子。"}
  ],
  "taskDescription": "**生物学**の用語でグリッドを完成させてください。\\n複合語の場合は、スペースやハイフンを入れないでください。",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "これらの生物学の概念をよく理解するために努力が必要です。"},
    {"from": 11, "to": 30, "feedback": "惜しいです。知識を定着させるために努力を続けてください。"},
    {"from": 31, "to": 50, "feedback": "良いスタートですが、いくつかの点はまだ明確にする必要があります。"},
    {"from": 51, "to": 70, "feedback": "よくできました！主題の要点を理解しています。"},
    {"from": 71, "to": 90, "feedback": "非常に高いスコアです！扱われた概念をよくマスターしています。"},
    {"from": 91, "to": 100, "feedback": "素晴らしい！このレッスンを完璧にマスターしました。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Cartes mémoires) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- カード数：最低5枚 || [NOMBRE_ELEMENTS] 枚。
- 関連付け：表面と裏面は、一意的で安定した基準によって関連付けられている必要があります（例：定義 -> 用語、イベント -> 日付、著者 -> 作品）。すべてのカードで同じ関係を使用し、指示を次のように作成します：「各XをYに関連付けてください」。`,

  FLASHCARDS_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- オブジェクトは以下を含む必要があります：
  - \`title\`：アクティビティに関連するタイトル。
  - \`description\`：児童・生徒向けの明確な指示。
  - \`cards\`：カード（フラッシュカード）を表すオブジェクトの配列。各オブジェクトの内容：
    - \`text\`：推測する質問または用語（表面）。
    - \`answer\`：回答または定義（裏面）。正規化ルール：単純な1単語または数字（複合語は不可）、小文字（固有名詞を除く）、冠詞や句読点なし、数字は算用数字。
    - \`tip\`（任意）：児童・生徒を助けるためのヒント。太字は \`**太字**\`、斜体は \`*斜体*\` を使用できます。`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "ヨーロッパの首都",
  "description": "各地域をその首都に関連付けてください。",
  "cards": [
    {
      "text": "フランス",
      "answer": "paris",
      "tip": "**エッフェル塔**がある街です。"
    },
    {
      "text": "スペイン",
      "answer": "madrid",
      "tip": "*イベリア* 半島の中心に位置しています。"
    },
    {
      "text": "イタリア",
      "answer": "rome",
      "tip": "*永遠の都* と呼ばれています。"
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (記述問題) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- キーワード: 解答に含めるべきキーワードまたは表現を最低5つ || [NOMBRE_ELEMENTS] 個。
- 指示: 答えを教えてしまわないよう、一般的なテーマ名を除き、期待されるキーワードを指示文に記載してはいけません。`,

  ESSAY_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
オブジェクトには以下を含める必要があります：
- \`taskDescription\`: テーマに沿って文章を書くよう促す、明確な指示文。太字には \`**単語**\`（重要概念）、斜体には \`*単語*\`、改行には \`\\n\` を使用してください。
- \`keywords\`: 期待されるキーワードを定義するオブジェクトの配列。各オブジェクトの形式は以下の通りです：
  \`\`\`json
  {
    "keyword": "単語または表現",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (厳格なルール) 演習のテーマに合わせた、スコア範囲（0-10, 11-30, 31-50, 51-70, 71-90, 91-100）を厳守した6つのオブジェクトの配列を必ず生成してください。`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "**光合成**のプロセスを説明する短い文章を書いてください。植物が自らエネルギーを作り出すための必須要素について触れる必要があります。",
  "keywords": [
    {"keyword": "光", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "葉緑素", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "二酸化炭素", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "水", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "グルコース", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "まずは第一歩です。光合成の授業をよく復習しましょう。" },
    { "from": 11, "to": 30, "feedback": "いくつかの要素を特定できました。その調子で頑張りましょう。" },
    { "from": 31, "to": 50, "feedback": "理解が進んでいます。もう少し詳しく説明してみましょう。" },
    { "from": 51, "to": 70, "feedback": "よくできました！基本をマスターしています。" },
    { "from": 71, "to": 90, "feedback": "素晴らしい！しっかりとした理解が示されています。" },
    { "from": 91, "to": 100, "feedback": "完璧です！このテーマを完全にマスターしています。" }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (H5P 用語集) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- 項目数: 最低5項目 || [NOMBRE_ELEMENTS] 項目。
- 項目の選定: ソース内に登場する専門用語、特定の語彙、または複雑な単語を特定してください。
- 定義: 簡潔、正確であり、想定される学習レベルに完全に適している必要があります。`,

  ACCORDION_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- 生成されるJSONは、前述の項目数と同数のオブジェクトを含む配列である必要があります。
- \`title\`: 定義するキーワード、表現、または質問。
- \`text\`: 定義。太字には \`**単語**\`、斜体には \`*単語*\`、改行には \`\\n\` を使用してください。数式の場合は、二重エスケープ付きのLaTeX形式を使用してください。例： \`\\\\( (2^3)^2 \\\\)\`。`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "光合成", "text": "植物が**太陽**の**光**をエネルギーに変えるプロセスのこと。\\n食物連鎖の基礎となります。"},
  {"title": "細胞", "text": "すべての生物の基本**単位**。*真核生物*と*原核生物*が存在します。"}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (要約問題) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- ステップ数: テーマ全体を網羅する最低5つのステップ || [NOMBRE_ELEMENTS] ステップ。
- 誤答（ディストラクター）: 各ステップに最低2つの誤答を提案してください。テーマに関連しつつも、事実誤認や論理的な誤りを含むもっともらしい内容にする必要があります。`,

  SUMMARY_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- \`intro\`: 短い導入文（例：「正しい記述を選択してください」）。
- \`summaries\`: 各ステップを構成するオブジェクトの配列。各オブジェクトには以下が含まれます：
  - \`summary\`: 文章の配列（**関連付け**）。配列の最初の文章は常に正解（正しい記述）である必要があります。
  - \`tip\`: (任意) 学習者を助けるためのヒント。
- \`overallFeedback\`: スコア範囲（0-10, 11-30, 31-50, 51-70, 71-90, 91-100）に基づいた6つのオブジェクトの配列。
- **LaTeX:** 二重エスケープを使用してください： \`\\\\( (2^3)^2 \\\\)\`。`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "授業の要約を作成するために、正しい記述を選択してください。",
  "summaries": [
    {
      "summary": [
        "光合成は、植物が光エネルギーを化学エネルギーに変換する生物学的プロセスです。",
        "光合成は、夜間にのみ行われるプロセスです。",
        "光合成は、動物が呼吸をするための仕組みです。"
      ],
      "tip": "光をエネルギー源として考えてみましょう。"
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "これらの概念を理解するためには、さらなる努力が必要です。" },
    { "from": 11, "to": 30, "feedback": "あと少しです。知識を定着させるために努力を続けましょう。" },
    { "from": 31, "to": 50, "feedback": "良い滑り出しですが、まだ明確にする必要がある点があります。" },
    { "from": 51, "to": 70, "feedback": "よくできました！要点を理解しています。" },
    { "from": 71, "to": 90, "feedback": "非常に良いスコアです！概念をよくマスターしています。" },
    { "from": 91, "to": 100, "feedback": "完璧です！このレッスンを完全にマスターしています。" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (単語ドラッグ) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- 単語数: 最低50語の文章の中に、ドラッグ対象の単語を最低5つ配置 || [NOMBRE_ELEMENTS] 個。
- 一意性: ドラッグ対象の単語は、文章内で一意である必要があります（重複不可）。`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
オブジェクトには以下を含める必要があります：
- \`taskDescription\`: 明確な指示文。
- \`textField\`: 完成させる文章。各文の終わりには改行文字 \`\\n\` を入れてください。
  - **形式**: ドラッグ対象の要素を \`*単語*\` で囲みます。
- \`overallFeedback\`: スコア範囲（0-10, 11-30, 31-50, 51-70, 71-90, 91-100）に基づいた6つのオブジェクトの配列。`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "単語をドラッグして文章を完成させてください。",
  "textField": "*太陽系*は、*太陽*の周りを回る*8つ*の惑星で構成されています。\\n最も大きな惑星は*木星*です。",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "努力が必要です。" },
    { "from": 11, "to": 30, "feedback": "あと少しです。" },
    { "from": 31, "to": 50, "feedback": "良いスタートです。" },
    { "from": 51, "to": 70, "feedback": "よくできました！" },
    { "from": 71, "to": 90, "feedback": "非常に良いスコアです！" },
    { "from": 91, "to": 100, "feedback": "完璧です！" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (穴埋め問題) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- 空欄の数: 最低50語の文章の中に、最低3つの空欄を配置 || [NOMBRE_ELEMENTS] 個。
- バランス: 文法的な目的がある場合を除き、些細な単語（冠詞や前置詞など）を空欄にしないでください。重要概念を対象にしてください。`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
オブジェクトには以下を含める必要があります：
- \`taskDescription\`: 全体的な文脈における活動の目的を説明する、簡潔で明確な指示文。太字には \`**単語**\`（重要概念）、斜体には \`*単語*\`、改行には \`\\n\` を使用してください。
- \`questions\`: 文字列の配列。各文字列は完成させるテキストブロックを表します。
  - **空欄の構文**: 当てる単語をアスタリスクで囲みます（例： \`*単語*\`）。
  - **選択肢**: 複数の正解を認める場合は \`/\` を使用します（例： \`*単語1/単語2*\`）。
  - **ヒント**: 教育的なヒントを追加するには \`:\` を使用します（例： \`*単語:ヒント*\`）。
- \`overallFeedback\`: (厳格なルール) 6つのオブジェクトの配列を必ず生成してください（0-10, 11-30, 31-50, 51-70, 71-90, 91-100）。`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "以下の太陽系に関する文章の空欄を埋めてください。",
  "questions": [
    "地球は*太陽*系の*惑星*の一つです。",
    "地球は約365日で*太陽:私たちの恒星*の周りを公転しています。"
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "これらの概念を理解するためには、さらなる努力が必要です。"},
    {"from": 11, "to": 30, "feedback": "あと少しです。知識を定着させるために努力を続けましょう。"},
    {"from": 31, "to": 50, "feedback": "良いスタートですが、まだ明確にする必要がある点があります。"},
    {"from": 51, "to": 70, "feedback": "よくできました！テーマの要点を理解しています。"},
    {"from": 71, "to": 90, "feedback": "非常に良いスコアです！扱われた概念をよくマスターしています。"},
    {"from": 91, "to": 100, "feedback": "完璧です！このレッスンを完全にマスターしています。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (単語ハイライト) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- 単語数: 最低50語の文章の中に、最低5つのハイライト対象単語を配置 || [NOMBRE_ELEMENTS] 個。`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
オブジェクトには以下を含める必要があります：
- \`taskDescription\`: 明確で魅力的な指示文。ここでは太字に \`**単語**\`、斜体に \`*単語*\` を使用できます。
- \`textField\`: ハイライト対象の単語を含む全文。
  - **マーキング:** ハイライト対象の各単語を個別にアスタリスクで囲みます（正しい例： \`*単語1* *単語2*\`、誤った例： \`*単語1 単語2*\`）。
  - **句読点:** 句読点は決してマーキングに含めず、単語との間にスペースを空ける必要があります（正しい例： \`*単語* 。\`、誤った例： \`*単語。*\`）。
- \`overallFeedback\`: (厳格なルール) 6つのオブジェクトの配列を必ず生成してください（0-10, 11-30, 31-50, 51-70, 71-90, 91-100）。`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "次の文章の中の**固有名詞**をクリックしてください。",
  "textField": "*パリ* は *フランス* の首都です。私たちが興味があるのは *ヨーロッパ* です。",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "これらの概念を理解するためには、さらなる努力が必要です。"},
    {"from": 11, "to": 30, "feedback": "あと少しです。知識を定着させるために努力を続けましょう。"},
    {"from": 31, "to": 50, "feedback": "良いスタートですが、まだ明確にする必要がある点があります。"},
    {"from": 51, "to": 70, "feedback": "よくできました！テーマの要点を理解しています。"},
    {"from": 71, "to": 90, "feedback": "非常に良いスコアです！扱われた概念をよくマスターしています。"},
    {"from": 91, "to": 100, "feedback": "完璧です！このレッスンを完全にマスターしています。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (間違い探し/正誤判定) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- 質問: 明確で曖昧さのない記述。
- 回答: 回答は厳密に "true"（真）または "false"（偽）である必要があります。
- フィードバック: 学習を強化するために、正解時（\`feedbackOnCorrect\`）と不正解時（\`feedbackOnWrong\`）の特定のメッセージを用意してください。`,

  TRUE_FALSE_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- メインオブジェクトには以下のキーを含める必要があります：
  - \`question\`: (string) 評価対象となる記述。HTMLを含めることが可能です。
  - \`correct\`: (string) 正解。"true" または "false" のいずれか。
  - \`feedbackOnCorrect\`: (string) 正解時に表示されるフィードバック。
  - \`feedbackOnWrong\`: (string) 不正解時に表示されるフィードバック。
- **書式設定:** 太字はMarkdownの構文 (\`**テキスト**\`)、斜体は (\`*テキスト*\`) を使用してください。
- **LaTeX:** 数式には、必ずダブルエスケープされたLaTeX形式 \`\\\\( ... \\\\)\` を使用してください。\`$\` 記号のみを使用することは厳禁です。
- **フィードバック:** フィードバック内には LaTeX および Markdown を含めないでください。`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "オスロはノルウェーの首都である。",
  "correct": "true",
  "feedbackOnCorrect": "正解です！オスロは確かにノルウェーの首都です。",
  "feedbackOnWrong": "不正解です。ノルウェーの首都はオスロです。"
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (選択問題) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- 質問: 明確な多肢選択式質問。
- 回答: 複数の選択肢（\`answers\`）を提案してください。正解は1つだけ（\`"correct": true\`）とし、もっともらしい誤答（ディストラクター）を複数（\`"correct": false\`）含めてください。
- フィードバック:
  - \`overallFeedback\`: (厳格なルール) 6つのオブジェクトの配列を必ず生成してください（0-10, 11-30, 31-50, 51-70, 71-90, 91-100）。`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- メインオブジェクトには以下のキーを含める必要があります：
  - \`question\`: (string) 問題文。HTMLを含めることが可能です。
  - \`answers\`: (array) 回答を表すオブジェクトの配列。
    - \`text\`: (string) 回答のテキスト。
    - \`correct\`: (boolean) 正解の場合は \`true\`、それ以外は \`false\`。
    - \`tipsAndFeedback\`: (object, オプション) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`。
  - \`overallFeedback\`: (array) スコア範囲ごとのフィードバックを定義する6つのオブジェクトの配列。
- **書式設定:** 太字はMarkdownの構文 (\`**テキスト**\`)、斜体は (\`*テキスト*\`) を使用してください。
- **LaTeX:** 数式には、必ずダブルエスケープされたLaTeX形式 \`\\\\( ... \\\\)\` を使用してください。\`$\` 記号のみを使用することは厳禁です。
- **フィードバック:** フィードバック内には LaTeX および Markdown を含めないでください。`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "カシスの実の本来の色は何色ですか？",
  "answers": [
    {"text": "非常に濃い紫", "correct": true, "tipsAndFeedback": { "chosenFeedback": "その通り！" }},
    {"text": "青", "correct": false, "tipsAndFeedback": { "chosenFeedback": "いいえ、もっと濃い色です。" }},
    {"text": "黒", "correct": false}
  ],
    "overallFeedback": [
        { "from": 0, "to": 10, "feedback": "努力が必要です。" },
        { "from": 11, "to": 30, "feedback": "あと少しです。" },
        { "from": 31, "to": 50, "feedback": "良いスタートです。" },
        { "from": 51, "to": 70, "feedback": "よくできました！" },
        { "from": 71, "to": 90, "feedback": "非常に良いスコアです！" },
        { "from": 91, "to": 100, "feedback": "素晴らしい！" }
    ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (単語探し) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- 単語数：最低 6 単語 || [NOMBRE_ELEMENTS] 単語。
- 表記規則：単語にはアクセント、数字、句読点、スペースを含めてはいけません。`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- コードブロック内に完全で有効な JSON のみを生成してください。回答は \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- \`taskDescription\`: 学習者への指示。
- \`wordList\`: 見つける単語のリスト。カンマで区切ります（スペースなし）。`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "グリッドに隠された単語を見つけましょう。",
  "wordList": "CELLULE,ADN,GENE,NOYAU"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (段落の並べ替え) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- ステップ数：並べ替えるステップまたは段落を最低 3 つ || [NOMBRE_ELEMENTS] ステップ。
- 本質的な論理：段落（\`paragraphs\`）は、内容自体から推測できる論理的な進行を形成する必要があります。
- 人工的なヒントの禁止：ユーザーから明示的な要求がない限り、番号（1, 2, 3...）、明示的な時間マーカー（日付、時刻）、または単純すぎる論理接続詞（「まず」、「次に」、「最後に」）を使用してはいけません。
- 核となる糸口：各段落は、単一の糸口（例：因果関係の連鎖、一般論から各論への移行、または「準備 → 実行 → 結果」のシーケンス）を前進させる必要があります。順序は意味の理解によって導き出せるものでなければなりません。`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- コードブロック内に完全で有効な JSON のみを生成してください。回答は \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- \`taskDescription\`: 明確な指示（Markdown 対応）。
- \`paragraphs\`: JSON 内で最初は**正しい論理的な順序**で示された文字列（段落）の配列。太字には \`**単語**\` を、斜体には \`*単語*\` を使用してください。
- \`overallFeedback\`: 最終スコアに応じた 6 つのオブジェクトの配列 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。
- **LaTeX:** LaTeX にはダブルエスケープを使用してください：\`\\\\( (2^3)^2 \\\\)\`。`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "地球温暖化の因果関係を再構成するために、これらの要素を正しい順序に並べ替えてください。",
  "paragraphs": [
    "人間の活動、主に化石燃料の燃焼により、大量の**二酸化炭素**が大気中に放出されます。",
    "これらの余分なガスは自然の温室効果を強化し、赤外線放射の一部が地球から放出されるのを妨げます。",
    "こうして閉じ込められたエネルギーは、空気や海洋の平均温度を徐々に上昇させます。",
    "この地球温暖化は氷河の融解を招き、深刻な海面上昇を引き起こします。"
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "因果関係の論理を見直す必要があります。" },
    { "from": 11, "to": 30, "feedback": "断片的な理解はできています。テキストを読み直してください。" },
    { "from": 31, "to": 50, "feedback": "並べ替えの良いスタートです。" },
    { "from": 51, "to": 70, "feedback": "論理的な進行をよく分析できています。" },
    { "from": 71, "to": 90, "feedback": "構成力が非常に素晴らしいです！" },
    { "from": 91, "to": 100, "feedback": "完璧です！論理構造をマスターしました。" }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (単一選択問題集) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- 質問数：最低 3 問 || [NOMBRE_ELEMENTS] 問。
- 回答：各問に 2 〜 3 個の誤答（ダミー）を提示してください。リスト \`answers\` の最初の回答は常に正解である必要があります。
- 誤答（ダミー）：内容に矛盾はないが、妥当な論理的または事実に基づいた誤りを含むもの。`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- コードブロック内に完全で有効な JSON のみを生成してください。回答は \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- \`choices\`: 質問を構成するオブジェクトの配列。各オブジェクトの内容：
  - \`question\`: 質問文。
  - \`answers\`: 文字列の配列（回答）。最初のものが常に正解です。
- \`overallFeedback\`: 最終スコアに応じた 6 つのオブジェクトの配列 (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)。
- **LaTeX:** LaTeX にはダブルエスケープを使用してください：\`\\\\( (2^3)^2 \\\\)\`。`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "温室効果の主な原因となるガスは何ですか？",
      "answers": ["二酸化炭素", "酸素", "窒素", "アルゴン"]
    },
    {
      "question": "フランスの首都はどこですか？",
      "answers": ["パリ", "リヨン", "マルセイユ", "ボルドー"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "努力が必要です。" },
    { "from": 11, "to": 30, "feedback": "あと少しです。" },
    { "from": 31, "to": 50, "feedback": "良いスタートです。" },
    { "from": 51, "to": 70, "feedback": "よくできました！" },
    { "from": 71, "to": 90, "feedback": "非常に良いスコアです！" },
    { "from": 91, "to": 100, "feedback": "素晴らしい！" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (対話カード) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- カード数：最低 3 枚 || [NOMBRE_ELEMENTS] 枚。
- 関連付けの原則：表面と裏面は、唯一の安定した基準（例：定義 -> 用語、出来事 -> 日付、著者 -> 作品）によって関連付けられている必要があります。
- 指示：アクティビティの説明は、「各 [X] をその [Y] に関連付けましょう」という形式に従う必要があります。`,

  DIALOG_CARDS_STRUCTURE_JSON: `- コードブロック内に完全で有効な JSON のみを生成してください。回答は \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- ルートオブジェクトには、 \`title\`、 \`description\`、 \`dialogs\` を含める必要があります。
- 1. \`title\`: アクティビティのタイトル（Markdown や HTML を**含まない**プレーンテキスト）。
- 2. \`description\`: 指示または説明（HTML 形式またはプレーンテキスト）。
- 3. \`dialogs\`: カードの関連付け原則の配列：表面 (text) と裏面 (answer)。
- 4. \`text\`: カードの表面。太字には \`**単語**\` を、斜体には \`*単語*\` を使用してください。
- 5. \`answer\`: カードの裏面。短くする必要があります。太字には \`**単語**\` を、斜体には \`*単語*\` を使用してください。
- 6. \`tips\` (オプション): 関連する場合のみ、表面 (\`front\`) または裏面 (\`back\`) にヒントを追加してください。フォーマット**なし**のプレーンテキスト。`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "不規則動詞",
  "description": "動詞の原形を見つけましょう。",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "過去形を特定してください。", "back": "基本の形です。"}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (グラフ) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- 構成要素数：最低 5 つの比較要素 || [NOMBRE_ELEMENTS] 比較要素。
- グラフの種類：教育的な関連性に応じて、円グラフ（\`pieChart\`）または棒グラフ（\`barChart\`）から選択してください。
- ラベルと色：読みやすさを確保するために、色はコントラストをきかせる必要があります。ラベルは短く明確にしてください。`,

  CHART_STRUCTURE_JSON: `- コードブロック内に完全で有効な JSON のみを生成してください。回答は \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。
- \`graphMode\`: グラフの種類（\`pieChart\` または \`barChart\`）。
- \`listOfTypes\`: オブジェクトの配列 \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: グラフのタイトル。`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "ブルーベリー"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "ラズベリー"}
  ],
  "figureDefinition": "好きな果物のグラフ"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Quiz H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- 質問数：最低5問の配列を生成 || [NOMBRE_ELEMENTS] 問。
- 多様性：演習に変化を持たせるため、以下から最も適切なアクティビティタイプを選択してください：
  - **多肢選択式 (QCM)** (\`H5P.MultiChoice\` 1.16)
  - **ドラッグ＆ドロップテキスト** (\`H5P.DragText\` 1.10)
  - **○×クイズ (真偽値)** (\`H5P.TrueFalse\` 1.8)
  - **穴埋め問題** (\`H5P.Blanks\` 1.14)
  - **単語ハイライト** (\`H5P.MarkTheWords\` 1.11)
  - **記述式 / 自由回答** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- ルートオブジェクトには以下を含める必要があります：
  - \`title\`: アクティビティのタイトル。
  - \`questions\`: オブジェクトの配列。各オブジェクトは1つの質問を表し、以下を含む必要があります：
    - \`library\`: ライブラリ名と正確なバージョン（例: \`H5P.MultiChoice 1.16\`）。
    - \`metadata\`: \`title\` キー（質問の短いタイトル）を含むオブジェクト。
    - \`params\`: 質問のデータ。
  - \`overallFeedback\`: QuizSet全体の最終スコア用フィードバック（6つのオブジェクトの配列）。

**タイプ別の \`params\` 詳細:**
1. **QCM (多肢選択式) (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (\`text\`, \`correct\` を含むオブジェクトの配列), \`behaviour: {singleAnswer: true}\`
2. **○×問題 (真偽式) (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` (文字列としての "true" または "false")
3. **穴埋め問題 (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (\`*単語*\` を含む文字列の配列)
4. **ドラッグ＆ドロップ (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (\`*単語*\` を使用)
5. **単語のマーク (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (\`*単語*\` を使用)
6. **記述式 (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (オブジェクトの配列)

**H5P.TrueFalse 1.8 以外の各質問には、独自の \`overallFeedback\`（6つのスコア範囲）を含める必要があります。**
- **書式設定:** 太字はMarkdownの構文 (\`**テキスト**\`)、斜体は (\`*テキスト*\`) を使用してください。
- **LaTeX:** 数式には、必ずダブルエスケープされたLaTeX形式 \`\\\\( ... \\\\)\` を使用してください。\`$\` 記号のみを使用することは厳禁です。
- **フィードバック:** フィードバック内には LaTeX および Markdown を含めないでください。`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "科学の一般教養",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "天文学 - QCM" },
      "params": {
        "question": "太陽に最も近い惑星はどれですか？",
        "answers": [
          { "text": "水星", "correct": true },
          { "text": "金星", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "不正解。"},
          {"from": 11, "to": 30, "feedback": "不十分です。"},
          {"from": 31, "to": 50, "feedback": "平均的です。"},
          {"from": 51, "to": 70, "feedback": "良いです。"},
          {"from": 71, "to": 90, "feedback": "大変良いです。"},
          {"from": 91, "to": 100, "feedback": "素晴らしい！"}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "生物学 - ○×" },
      "params": {
        "question": "DNAは二重螺旋構造である。",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "低い結果です。"},
    {"from": 11, "to": 30, "feedback": "不十分な結果です。"},
    {"from": 31, "to": 50, "feedback": "平均的な結果です。"},
    {"from": 51, "to": 70, "feedback": "良い結果です。"},
    {"from": 71, "to": 90, "feedback": "非常に良い結果です。"},
    {"from": 91, "to": 100, "feedback": "最高の結果です。"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (H5P 選択式クイズ) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- 問題数：最低5問を作成 || [NOMBRE_ELEMENTS]問を作成。
- タイプ：**選択式**タイプの問題のみを生成してください（\`H5P.MultiChoice\` 1.16）。他のタイプは許可されていません。
- 選択式問題の品質：
  - 各問題は最低3つの選択肢を持つ必要があります。
  - 問題の性質に応じて、1つまたは複数の正解を提案できます。
  - 誤答選択肢は妥当で関連性のあるものにしてください。
  - 問題では否定形の表現を避けてください。
  - 正解の位置を変化させてください。`,

  QUIZSET_QCM_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- ルートオブジェクトには以下を含める必要があります：
  - \`title\`: アクティビティのタイトル。
  - \`questions\`: オブジェクトの配列。各オブジェクトは多肢選択式（QCM）の質問を表し、以下を含む必要があります：
    - \`library\`: 常に \`H5P.MultiChoice 1.16\`。
    - \`metadata\`: \`title\` キー（質問の短いタイトル）を含むオブジェクト。
    - \`params\`: 質問のデータ。
  - \`overallFeedback\`: QuizSet全体の最終スコア用フィードバック（6つのオブジェクトの配列）。

**QCM (\`H5P.MultiChoice 1.16\`) の \`params\` 詳細**:
- \`question\`: 質問文 (string)。
- \`answers\`: \`text\` (string) と \`correct\` (boolean) を含むオブジェクトの配列。
- \`behaviour\`: \`singleAnswer\` を含むオブジェクト。正解が1つの場合は \`true\`、複数の場合は \`false\`。

**各質問には独自の \`overallFeedback\` を含める必要があります（6つの範囲：0-10, 11-30, 31-50, 51-70, 71-90, 91-100）。**
- **書式設定:** 太字はMarkdownの構文 (\`**テキスト**\`)、斜体は (\`*テキスト*\`) を使用してください。
- **LaTeX:** 数式には、必ずダブルエスケープされたLaTeX形式 \`\\\\( ... \\\\)\` を使用してください。\`$\` 記号のみを使用することは厳禁です。
- **フィードバック:** フィードバック内には LaTeX および Markdown を含めないでください。`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "選択式クイズ - 科学",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "天文学 - 惑星" },
      "params": {
        "question": "太陽に最も近い惑星はどれですか？",
        "answers": [
          { "text": "金星", "correct": false },
          { "text": "火星", "correct": false },
          { "text": "水星", "correct": true },
          { "text": "木星", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "不正解です。"},
          {"from": 11, "to": 30, "feedback": "不十分です。"},
          {"from": 31, "to": 50, "feedback": "普通です。"},
          {"from": 51, "to": 70, "feedback": "良いです。"},
          {"from": 71, "to": 90, "feedback": "とても良いです。"},
          {"from": 91, "to": 100, "feedback": "素晴らしい！"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "生物学 - 細胞小器官" },
      "params": {
        "question": "独自のDNAを持つ細胞小器官はどれですか？",
        "answers": [
          { "text": "リボソーム", "correct": false },
          { "text": "ミトコンドリア", "correct": true },
          { "text": "ゴルジ体", "correct": false },
          { "text": "葉緑体", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "不正解です。"},
          {"from": 11, "to": 30, "feedback": "不十分です。"},
          {"from": 31, "to": 50, "feedback": "普通です。"},
          {"from": 51, "to": 70, "feedback": "良いです。"},
          {"from": 71, "to": 90, "feedback": "とても良いです。"},
          {"from": 91, "to": 100, "feedback": "素晴らしい！"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "弱い結果です。基礎を復習してください。"},
    {"from": 11, "to": 30, "feedback": "不十分な結果です。引き続き努力してください。"},
    {"from": 31, "to": 50, "feedback": "平均的な結果です。進歩しています。"},
    {"from": 51, "to": 70, "feedback": "良い結果です。いくつかの概念を習得しています。"},
    {"from": 71, "to": 90, "feedback": "非常に良い結果です。正しい道を歩んでいます。"},
    {"from": 91, "to": 100, "feedback": "最高の結果です。おめでとうございます！"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P ○×クイズ) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- 質問数：最低5問の配列を生成 || [NOMBRE_ELEMENTS] 問。
- タイプ：**○×クイズ** (\`H5P.TrueFalse\` 1.8) 形式の問題のみを生成してください。他のタイプは許可されていません。
- 質問の品質：
  - 記述は明確で曖昧さがないようにしてください。
  - 二重否定は避けてください。
  - 正解と不正解を織り交ぜてください。`,

  QUIZSET_VF_STRUCTURE_JSON: `- コードブロック内に、完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- ルートオブジェクトには以下を含める必要があります：
  - \`title\`: アクティビティのタイトル。
  - \`questions\`: オブジェクトの配列。各オブジェクトは1つの質問を表し、以下を含む必要があります：
    - \`library\`: 常に \`H5P.TrueFalse 1.8\`。
    - \`metadata\`: \`title\` キー（質問の短いタイトル）を含むオブジェクト。
    - \`params\`: 質問のデータ。
  - \`overallFeedback\`: QuizSet全体の最終スコア用フィードバック（6つのオブジェクトの配列：0-10, 11-30, 31-50, 51-70, 71-90, 91-100）。

**○×問題 (\`H5P.TrueFalse 1.8\`) の \`params\` 詳細**:
- \`question\`: 提示される主張または質問 (string)。
- \`correct\`: 正解。必ず文字列で "true" または "false" としてください。
- **書式設定:** 太字はMarkdownの構文 (\`**テキスト**\`)、斜体は (\`*テキスト*\`) を使用してください。
- **LaTeX:** 数式には、必ずダブルエスケープされたLaTeX形式 \`\\\\( ... \\\\)\` を使用してください。\`$\` 記号のみを使用することは厳禁です。
- **フィードバック:** フィードバック内には LaTeX および Markdown を含めないでください。`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "○×クイズ - 地理",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "地理 - 首都" },
      "params": {
        "question": "オーストラリアの首都はキャンベラである。",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "地理 - 大陸" },
      "params": {
        "question": "アフリカは世界で最も大きな大陸である。",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "低い結果です。基礎を復習してください。"},
    {"from": 11, "to": 30, "feedback": "不十分な結果です。引き続き努力してください。"},
    {"from": 31, "to": 50, "feedback": "平均的な結果です。進歩しています。"},
    {"from": 51, "to": 70, "feedback": "良い結果です。いくつかの概念を習得しています。"},
    {"from": 71, "to": 90, "feedback": "非常に良い結果です。正しい道を歩んでいます。"},
    {"from": 91, "to": 100, "feedback": "最高の結果です。おめでとうございます！"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Moodle/Éléa テスト) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- 質問数：最低10問 || [NOMBRE_ELEMENTS] 問。
- 多様性：以下の最も適切な質問形式を選択してください：
  - **多肢選択式** (\`multichoice\`)
  - **マッチング** (\`matching\`)
  - **数値** (\`numerical\`)
  - **正誤** (\`truefalse\`)
  - **記述式** (\`shortanswer\`)
  - **穴埋め** (\`cloze\`)
- 誤答選択肢：\`multichoice\` の質問ごとに少なくとも3つの誤答（デストラクター）を提案してください。`,

  ELEA_TEST_STRUCTURE_JSON: `- コードブロック内に完全で有効な JSON のみを生成してください。回答は \`{\` で始まり、 \`}\` で終わる必要があります。他のテキストやコメントは含めないでください。

メインオブジェクトには以下のキーを含める必要があります：
- \`bank_name\`: 質問バンクの短く説明的な名前。
- \`bank_description\`: バンクの内容を説明する文。
- \`questions\`: 各オブジェクトが質問を表すオブジェクトの配列 (\`type\`, \`content\`)。
  - 各質問には、短く一意の \`content.name\` が必要です（例：「Q1 - トピック」）。

**フォーマットルール:**
- **数値**: 小数点にはドットを使用してください（例：12.34）。
- **Cloze**: 構文 \`{1:TYPE:=正解~不正解}\` を厳守してください。`,

  ELEA_TEST_EXEMPLE_RENDU: `- **タイプ \`multichoice\` (多肢選択式) の場合:**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Q1 - 地理",
      "questiontext": "フランスの首都はどこですか？",
      "feedback": "パリはフランスの政治的および経済的な首都です。",
      "answers": [
        { "text": "パリ", "fraction": 100, "feedback": "その通り！" },
        { "text": "リヨン", "fraction": 0, "feedback": "いいえ、リヨンは大都市ですが首都ではありません。" },
        { "text": "マルセイユ", "fraction": 0, "feedback": "いいえ、それはフランスで2番目に大きな都市です。" }
      ]
    }
  }
  \`\`\`

- **タイプ \`matching\` (マッチング) の場合:**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Q2 - 英語の語彙",
      "questiontext": "各英単語を日本語の翻訳と一致させてください。",
      "feedback": "よくできました、基本的な語彙をマスターしています。",
      "subquestions": [
        { "text": "Dog", "answer": "犬" },
        { "text": "Cat", "answer": "猫" },
        { "text": "Bird", "answer": "鳥" }
      ]
    }
  }
  \`\`\`

- **タイプ \`numerical\` (数値) の場合:**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Q3 - 数学",
      "questiontext": "円周率（Pi）の値を小数点以下2桁に丸めるといくつですか？",
      "feedback": "Piは無理数で、約3.14159...に等しい定数です。",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "確かに3.14です。" }
    }
  }
  \`\`\`

- **タイプ \`truefalse\` (正誤) の場合:**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Q4 - 科学",
      "questiontext": "水は海面で100°Cで沸騰します。",
      "feedback": "これは水の標準的な物理的性質です。",
      "answer": { "value": true, "feedback_true": "正しい。", "feedback_false": "間違い、水は1気圧で確かに100°Cで沸騰します。" }
    }
  }
  \`\`\`

- **タイプ \`shortanswer\` (記述式) の場合:**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Q5 - 文学",
      "questiontext": "「レ・ミゼラブル」を書いたのは誰ですか？",
      "feedback": "それは19世紀の最も偉大な小説の1つです。",
      "answers": [
        { "text": "ヴィクトル・ユーゴー", "fraction": 100, "feedback": "正解！" },
        { "text": "ユーゴー", "fraction": 100, "feedback": "正解！" }
      ]
    }
  }
  \`\`\`

- **タイプ \`cloze\` (穴埋め) の場合:**
  - 構文に注意してください: \`{1:SHORTANSWER:=良い~悪い}\`。
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Q6 - 歴史",
      "questiontext": "ナポレオンは{1:SHORTANSWER:=1769}年に{1:MULTICHOICE:=アジャクシオ~バスティア~パリ}で生まれました。",
      "feedback": "ナポレオン・ボナパルトはコルシカ島で生まれました。"
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (ミリオネア) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- 質問数：厳密に6問（絶対に変更しないでください）。
- 段階性：質問の難易度は**教育的に徐々に上がる**ように設定してください。記憶すべき重要な要素は最初の質問に配置します。
- 正確性：内容は厳密に正確かつ適切である必要があります。`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
以下のキーを持つメインオブジェクト：
- \`title\`：アクティビティのタイトル（文字列）。
- \`questions\`：厳密に6つのオブジェクトの配列。各オブジェクトは1つの質問を表し、以下を含みます：
  - \`question\`：質問文（文字列）。
  - \`goodanswer\`：正解（文字列）。
  - \`badanswer\`：厳密に3つの誤答の配列（文字列の配列）。
  - 数式において LaTeX の使用は禁止です。`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "フランス革命に関するクイズ",
  "questions": [
    {
      "question": "1789年7月14日にフランス革命の始まりを告げた出来事は何ですか？",
      "goodanswer": "バスティーユ牢獄の襲撃",
      "badanswer": ["テニスコートの誓い", "ルイ16世の処刑", "ヴァルミーの戦い"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (マッチング) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- ペア数：最低5ペア || [NOMBRE_ELEMENTS] ペア。
- ロジック：2つの要素間の関係は、ソースを読んだ後に明白である必要があります。`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
以下のキーを持つメインオブジェクト：
- \`title\`：アクティビティのタイトル（文字列）。
- \`intro\`：短い指示または導入文（文字列）。
- \`pairs\`：オブジェクトの配列。各オブジェクトは1つのペアを表し、以下を含みます：
  - \`question\`：左側の用語または要素（文字列）。
  - \`answer\`：右側の対応する定義または要素（文字列）。
  - 数式については、ダブルエスケープを使用したLaTeX形式を使用してください。例：\`\\\\( (2^3)^2 \\\\)\`。`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "歴史マッチング",
  "intro": "各日付をフランス革命の対応する出来事と結びつけなさい。",
  "pairs": [
    {"question": "バスティーユ襲撃", "answer": "1789年7月14日"},
    {"question": "特権の廃止", "answer": "1789年8月4日"},
    {"question": "人間と市民の権利の宣言", "answer": "1789年8月26日"},
    {"question": "ヴェルサイユ行進", "answer": "1789年10月5日"},
    {"question": "連盟祭", "answer": "1790年7月14日"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (Éléa 多肢選択式) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- 質問数：最低5問 || [NOMBRE_ELEMENTS] 問。
- 回答：1問につき2～5つの選択肢を提示してください。
- 誤答選択肢（デストラクター）：トピックと整合性がありつつ、論理的な誤りを含むもの。`,

  ELEA_QCM_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- \`title\`：アクティビティのタイトル。
- \`questions\`：オブジェクトの配列。各質問オブジェクトは以下を含む必要があります：
  - \`text\`：質問文（太字用の \`**\` などの単純なHTMLを含めることが可能）。
  - \`answers\`：\`{"text": "...", "iscorrect": 1/0}\` 形式のオブジェクトの配列。正解の場合は \`1\`、それ以外は \`0\`。
  - 数式については、ダブルエスケープを使用したLaTeX形式を使用してください。例：\`\\\\( (2^3)^2 \\\\)\`。`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "フランス革命に関するQCM",
  "questions": [
    {
      "text": "バスティーユ襲撃の日付はいつですか？",
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
  // === ELEA_GLOSSAIRE (XML用語集) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- エントリ数：最低5項目 || [NOMBRE_ELEMENTS] 項目。
- 選定：キーワード、略語、技術概念を特定してください。`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- **ルート：** \`name\`（用語集の名前）と \`entries\`（オブジェクトの配列）の2つのキーを持つメインオブジェクト。
- **\`entries\` 内の各オブジェクトには以下を含める必要があります：**
  - \`concept\`：定義する単語または表現。
  - \`definition\`：明確で簡潔な定義。教育的に適切な場合のみ、太字には **単語**、斜体には *単語*、改行には \`\\n\` を使用してください。
  - \`aliases\`（オプション）：類義語または代替用語の文字列配列。関連するエイリアスが存在する場合のみこのキーを追加してください。
  - 数式については、ダブルエスケープを使用したLaTeX形式を使用してください。例：\`\\\\( (2^3)^2 \\\\)\`。`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "ジャーナリズム用語集",
  "entries": [
    {
      "concept": "ジャーナリスト",
      "definition": "*情報*を**収集**し、発信する人。",
      "aliases": ["レポーター", "コラムニスト"]
    },
    {
      "concept": "ソース",
      "definition": "検証された*情報*の出所。"
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Éléa ページ) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- 構造：ページは最低5つの異なるブロックで構成されている必要があります || [NOMBRE_ELEMENTS] ブロック。
- 教育的ロジック：コンテンツは一貫した流れに従う必要があります（例：ホーム -> 目標 -> 講義 -> 詳細/用語集 -> 参考サイト）。
- コンテンツのバランス：エンゲージメントを維持するために形式（テキスト、表、リスト、ボックス）を組み合わせてください。
- 必須コンテンツ：オープニングバナー（\`#01_hero_header\`）、目標または注意点のボックス（\`#04_callout_set\`）、専門用語の用語集（\`#06_lexique_table\`）、少なくとも3つの実質的な内容の段落（\`#12_context_paragraphs\`）、および参照用の参考サイト（\`#18_sito_graphy\`）を体系的に組み込んでください。`,

  ELEA_PAGE_STRUCTURE_JSON: `- コードブロック内に完全で有効なJSONのみを生成してください。回答は必ず \`{\` で始まり \`}\` で終わる必要があります。他のテキストやコメントは一切含めないでください。
- \`title\`：ページのタイトル（文字列）。
- \`intro\`：魅力的な短い導入文（文字列）。
- \`blocks\`：オブジェクトの配列。各オブジェクトはページのセクションを表します。各ブロックは以下の構造のいずれかに従わなければなりません：

**利用可能なブロックリスト：**
- \`#01_hero_header\`: オープニングバナー。 \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: 内部リンク付き目次。 \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: 3枚のカードによる歴史的指標。 \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\`（最大3枚）
- \`#04_callout_set\`: 目標、知識、アラートのバナー。 \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: カード形式の主要数値。 \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: 語彙表。 \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: チップ形式の用語集。 \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: 画像付きモニュメントカード。 \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: 2つの画像の比較。
- \`#10_table_comparison\`: 比較表。
- \`#11_definition_box\`: 定義ボックス。 \`{ "type": "#11_definition_box", "data": { "title": "定義", "text": "..." } }\`
- \`#12_context_paragraphs\`: 講義の段落。 \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: 詳細シート。
- \`#14_faq_block\`: よくある質問。 \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: 神話 vs 現実。
- \`#17_method_image_desc\`: 画像描写メソッド。
- \`#18_sito_graphy\`: 参考サイト。 \`{ "type": "#18_sito_graphy", "data": { "title": "参考サイト", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: 2か国語の引用。`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "フランス革命",
  "intro": "この歴史的期間の重要な瞬間を発見しましょう。",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "フランス革命", "subtitle": "1789年-1799年"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "学習目標",
        "callouts": [{"type": "objectif", "text": "1789年の原因を理解する。"}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "テニスコートの誓い",
        "paragraphs": [
          "1789年6月20日、第三身分の議員たちが集まり...",
          "この行為は国民議会の誕生を象徴しています。",
          "これは絶対主義の終焉に向けた大きな転換点です。"
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "語彙",
        "headers": ["用語", "定義"],
        "rows": [["第三身分", "人口の大部分を占める..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "さらに詳しく知るために",
        "links": [{"href": "https://...", "text": "歴史公式サイト"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === H5P インターフェース翻訳（標準化） ===
  // ============================================================================

  // 共通キー
  h5p_check_answer: "確認",
  h5p_try_again: "もう一度",
  h5p_show_solution: "答えを表示",
  h5p_submit_answer: "送信",
  h5p_score: "@totalポイント中@scoreポイント獲得しました",
  h5p_score_bar_label: ":totalポイント中:numポイント獲得しました",
  h5p_tip_label: "ヒント",
  h5p_next: "次へ",
  h5p_previous: "前へ",
  h5p_close: "閉じる",
  h5p_finish_header: "終了しますか？",
  h5p_finish_body: "本当に終了してもよろしいですか？",
  h5p_cancel_label: "キャンセル",
  h5p_finish_label: "終了",
  h5p_retry_header: "やり直しますか？",
  h5p_retry_body: "本当にやり直してもよろしいですか？",
  h5p_retry_confirm_label: "確定",
  h5p_resume: "再開",
  h5p_audio_direction: "音声の方向",
  h5p_a11y_check: "回答を確認します。回答は正解、不正解、または未回答としてマークされます。",
  h5p_a11y_show_solution: "解答を表示します。タスクに正解が表示されます。",
  h5p_a11y_retry: "タスクをやり直します。すべての回答をリセットして最初から開始します。",

  // クロスワード (Crossword)
  h5p_crossword_across: "横",
  h5p_crossword_down: "縦",
  h5p_crossword_extra_clue: "追加のヒント",

  // 要約 (Summary)
  h5p_summary_intro: "正しい文を選択してください。",
  h5p_summary_solved_label: "進捗：",
  h5p_summary_score_label: "不正解：",
  h5p_summary_result_label: "結果",
  h5p_summary_feedback: "@total文のうち@score文正解しました（@percent%）。",
  h5p_summary_label_correct: "正解です。",
  h5p_summary_label_incorrect: "不正解です！もう一度試してください。",
  h5p_summary_label_correct_answers: "正解。",
  h5p_summary_progress_text: "進捗：:total中:num",
  h5p_summary_alternative_incorrect_label: "不正解",

  // ドラッグ・ザ・ワード (Drag the Words)
  h5p_drag_words_score_feedback: "スコア：@total中@score",
  h5p_drag_words_correct_text: "正解！",
  h5p_drag_words_incorrect_text: "不正解！",

  // 穴埋め問題 (Fill in the Blanks)
  h5p_blanks_not_filled_out: "すべての空欄を埋めてください。",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; は正解です",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; は不正解です",
  h5p_blanks_answered_correctly: "正解しました",
  h5p_blanks_answered_incorrectly: "不正解でした",
  h5p_blanks_solution_label: "正解：",
  h5p_blanks_input_label: "@total中@num番目の空欄",
  h5p_blanks_input_has_tip_label: "ヒントあり",
  h5p_blanks_feedback: "@total箇所中@score箇所の空欄を正しく埋めました。",
  h5p_blanks_checking_mode_header: "確認モード",

  // マーク・ザ・ワード (Mark the Words)
  h5p_mark_words_correct_answer: "正解！",
  h5p_mark_words_incorrect_answer: "不正解！",
  h5p_mark_words_missed_answer: "見逃し！",
  h5p_mark_words_display_solution_description: "タスクが更新され正解が表示されています。",
  h5p_mark_words_a11y_full_text_label: "読み上げ用全文",
  h5p_mark_words_a11y_clickable_text_label: "単語を選択できる全文",
  h5p_mark_words_a11y_solution_mode_header: "解答モード",
  h5p_mark_words_a11y_checking_header: "確認モード",

  // フラッシュカード (Flashcards)
  h5p_flashcards_progress_text: "@total枚中@card枚目",
  h5p_flashcards_your_answer: "あなたの回答",
  h5p_flashcards_correct_answer: "正解",
  h5p_flashcards_incorrect_answer: "不正解",
  h5p_flashcards_show_solution: "正解を表示",
  h5p_flashcards_results: "結果",
  h5p_flashcards_of_correct: "@total問中@score問正解",
  h5p_flashcards_show_results: "結果を表示",
  h5p_flashcards_answer_short: "答:",
  h5p_flashcards_card_announcement: "不正解です。正解は @answer でした",
  h5p_flashcards_correct_announcement: "@answer は正解です。",
  h5p_flashcards_page_announcement: "@totalページ中@currentページ目",

  // エッセイ (Essay)
  h5p_essay_feedbackHeader: "フィードバック",
  h5p_essay_solutionTitle: "解答例",
  h5p_essay_remainingChars: "残り文字数：@chars",
  h5p_essay_notEnoughChars: "少なくとも@chars文字入力する必要があります！",
  h5p_essay_messageSave: "保存済み",
  h5p_essay_placeholderText: "ここに書き始めてください...",
  h5p_essay_ariaYourResult: "@totalポイント中@scoreポイント獲得しました",
  h5p_essay_ariaNavigatedToSolution: "テキストエリアの後に新しく含まれた解答例に移動しました。",

  // 正誤問題 (True/False)
  h5p_true_false_true_text: "正しい",
  h5p_true_false_false_text: "誤り",
  h5p_true_false_wrong_answer_message: "不正解",
  h5p_true_false_correct_answer_message: "正解",

  // 単語探し (Find the Words)
  h5p_find_words_found: "@totalWords個中@found個の単語が見つかりました",
  h5p_find_words_time_spent: "経過時間",
  h5p_find_words_word_list_header: "単語リスト",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // パラグラフの並べ替え (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "上へ",
  h5p_sort_paragraphs_down: "下へ",
  h5p_sort_paragraphs_disabled: "無効",
  h5p_sort_paragraphs_paragraph: "パラグラフ",
  h5p_sort_paragraphs_point: "@scoreポイント",
  h5p_sort_paragraphs_seven_of_nine: "@total中@current",
  h5p_sort_paragraphs_current_position: "リスト内の現在の位置",
  h5p_sort_paragraphs_instructions_selected: "スペースキーで並べ替え",
  h5p_sort_paragraphs_instructions_grabbed: "上下矢印キーで位置変更、スペースキーで配置、Escキーでキャンセル",
  h5p_sort_paragraphs_grabbed: "掴みました",
  h5p_sort_paragraphs_moved: "移動しました",
  h5p_sort_paragraphs_dropped: "配置しました",
  h5p_sort_paragraphs_reorder_cancelled: "並べ替えがキャンセルされました",
  h5p_sort_paragraphs_final_position: "最終位置",
  h5p_sort_paragraphs_next_paragraph: "次のパラグラフ",
  h5p_sort_paragraphs_correct_paragraph: "この位置の正しいパラグラフ",
  h5p_sort_paragraphs_list_description: "並べ替え可能なパラグラフのリスト。",
  h5p_sort_paragraphs_list_description_check: "結果表示付きパラグラフのリスト。",
  h5p_sort_paragraphs_list_description_solution: "正解表示付きパラグラフのリスト。",

  // 単一選択セット (Single Choice Set)
  h5p_single_choice_solution_view_title: "解答",
  h5p_single_choice_mute_button_label: "ミュート",
  h5p_single_choice_slide_of_total: "@total枚中@slide枚目のスライド",
  h5p_single_choice_solution_list_question_number: "第@question問",
  h5p_single_choice_should_select: "選択すべきもの",
  h5p_single_choice_should_not_select: "選択すべきでないもの",

  // ダイアログカード (Dialog Cards)
  h5p_dialog_cards_answer: "めくる",
  h5p_dialog_cards_progress_text: "@total枚中@card枚目",
  h5p_dialog_cards_card_front_label: "カードの表面",
  h5p_dialog_cards_card_back_label: "カードの裏面",
  h5p_dialog_cards_audio_not_supported: "お使いのブラウザはこのオーディオ形式をサポートしていません",
  h5p_dialog_cards_correct_answer: "正解しました！",
  h5p_dialog_cards_incorrect_answer: "間違えました",
  h5p_dialog_cards_round: "ラウンド @round",
  h5p_dialog_cards_cards_left: "残りカード：@number",
  h5p_dialog_cards_next_round: "ラウンド@roundへ進む",
  h5p_dialog_cards_start_over: "最初から",
  h5p_dialog_cards_show_summary: "次へ",
  h5p_dialog_cards_summary: "まとめ",
  h5p_dialog_cards_summary_cards_right: "正解したカード：",
  h5p_dialog_cards_summary_cards_wrong: "間違えたカード：",
  h5p_dialog_cards_summary_cards_not_shown: "表示されなかったカード：",
  h5p_dialog_cards_summary_overall_score: "全体のスコア",
  h5p_dialog_cards_summary_cards_completed: "マスターしたカード：",
  h5p_dialog_cards_summary_completed_rounds: "完了したラウンド：",
  h5p_dialog_cards_summary_all_done: "お疲れ様でした！すべての@cards枚のカードを@max回連続で正解しました！",

  // クイズセット (Quiz Set)
  h5p_quiz_textual_progress: "@total問中@current問目",
  h5p_quiz_no_result_message: "終了",
  h5p_quiz_result_message: "結果:",
  h5p_quiz_feedback_available: "フィードバックあり",
  h5p_quiz_read_feedback: "フィードバックを読む",
  h5p_quiz_wrong_answer: "不正解",
  h5p_quiz_correct_answer: "正解",
  h5p_quiz_should_check: "ここを選択すべきでした",
  h5p_quiz_should_not_check: "ここを選択すべきではありませんでした",
  h5p_quiz_no_input: "解答を表示する前に回答してください。",

  // ============================================================================
  // === 免責事項・フッター ===
  // ============================================================================
  license_info: "GNU GPL v3.0 またはそれ以降",
  ticket: "チケット",
  legal_mentions: "免責事項",
  legal_title: "免責事項",
  legal_editor_title: "アプリケーション発行者",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>職務：</strong> 文学・歴史科教諭 (PLP)",
  legal_editor_gauthier_remande_email: "<strong>メール：</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>住所：</strong> 39 avenue de Chanzy, 53000 Laval, France",
  legal_editor_gauthier_remande_phone: "<strong>電話：</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>職務：</strong> 数学科教諭および DRANE 担当官（グルノーブル学区）",
  legal_editor_emmanuel_gaunard_email: "<strong>メール：</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>住所：</strong> 30 boulevard de la République, 38200 Vienne, France",
  legal_editor_emmanuel_gaunard_phone: "<strong>電話：</strong> +33 6 46 74 20 94",
  legal_app_description: "ウェブアプリケーション「Caramel」は、H5P および Éléa コンテンツの作成を目的とした、非営利のフリープロジェクトです。アカウント作成は不要であり、個人データも収集されません。",
  legal_hosting_title: "ホスティング",
  legal_host_name: "<strong>ホスト名</strong>：Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>商号</strong>：フランス国民教育・青年省 (Ministère de l’Éducation nationale et de la Jeunesse)",
  legal_host_address: "<strong>住所</strong>：110 rue de Grenelle, 75007 Paris, France",
  legal_host_phone: "<strong>電話</strong>：+33 1 55 55 10 10",
  legal_publication_director_title: "発行責任者",
  legal_publication_director_name: "Gauthier REMANDE および Emmanuel GAUNARD（ボランティア発行者として）",
  legal_terms_of_use_title: "利用規約",
  legal_terms_of_use_content: "当サイトは、ユーザーが H5P および Éléa コンテンツを生成することを可能にします。表示はローカルで行われ、ユーザーデータが送信されることはありません。生成されたコンテンツの使用については、ユーザーが単独で責任を負うものとします。本アプリケーションは無償で提供され、動作や結果についての保証は一切ありません。発行者は、コンテンツの誤解や不適切な使用について一切の責任を負いません。",
  legal_intellectual_property_title: "知的財産権",
  legal_intellectual_property_content: "すべてのソースコード、グラフィック要素、およびコンテンツは GNU AGPLv3 ライセンスの下で公開されています。それらの再利用は、それぞれのライセンス条件に従って許可されます。再配布または改変を行う場合は、原著作者（Gauthier REMANDE および Emmanuel GAUNARD）を明記する必要があります。H5P モジュール内で使用されている画像は H5P.org から取得されています。",
  legal_personal_data_title: "個人データ",
  legal_personal_data_content: "個人データの収集および保存は一切行われません。追跡用クッキーも使用されていません。",
  legal_ai_models_title: "人工知能モデル",
  legal_ai_models_content: "Caramel は、1クリック生成機能においてのみ、ILAAS（共同AIインフラ連盟）が運用するAIモデルを利用しています。リクエストは、Incubateur がホストする n8n ワークフローを介して ILAAS に送られ、高等教育・研究（ESR）ラベル付きのデータセンターにある信頼されたサーバーで実行されます。Caramel 自体はモデルを実行せず、データを独自に処理・保存することもありません。データはリクエストの実行にのみ使用され、一般向けのAIに送信されることはありません。現在提供されているモデルには、{{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}})、{{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}})、および {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}) が含まれます。ILAAS によるホスティング、ログ記録、保存に関する詳細は、同組織のプライバシーポリシーおよび利用規約をご参照ください。",
  legal_user_requests_processing_title: "n8n および国民教育省 Incubateur を介したユーザーリクエストの処理",
  legal_user_requests_processing_content: "当サイトは、フランス国民教育省の Incubateur がホストするオープンソースツール n8n を使用した技術ソリューションを採用しています。このサービスは自動ワークフローを通じて、ユーザーのリクエストを構造化データ（JSON形式）に変換し、DINUM（フランスデジタル局）が管理する主権的なAIと相互作用させます。機密情報が暗号化なしに公開または送信されることはなく、通信の機密性と安全性が確保されています。",
  legal_accessibility_title: "アクセシビリティ",
  legal_accessibility_content: "本アプリケーションは、ダーク/ライトモード、キーボードナビゲーション、高コントラストテーマなど、PCでの利用に適した設計となっています。RGAA（フランスのアクセシビリティ基準）の推奨事項に基づき、継続的な改善を行っています。",
  legal_applicable_law_title: "準拠法",
  legal_applicable_law_content: "当サイトはフランス法に準拠します。紛争が生じた場合、リヨン（Lyon）の管轄裁判所を専属的合意管轄裁判所とします。",
  legal_external_libraries_title: "使用されている外部ライブラリ",
  legal_external_libraries_intro: "Caramel は、以下のライブラリおよびライセンスに基づき、複数のオープンソースライブラリを使用しています：",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (ライセンス：CC BY 4.0, SIL OFL 1.1, MIT)：ナビゲーションと視覚体験を向上させるためのアイコンを提供します。",
  legal_library_jszip: "<strong>JSZip</strong> (ライセンス：MIT または GPLv3)：必要なコンテンツをzipアーカイブに圧縮し、.h5p ファイルを作成することを可能にします。",
  legal_library_clientzip: "<strong>client-zip</strong> (ライセンス：MIT)：ブラウザ上で直接 .h5p アーカイブを生成するための、高性能なファイル圧縮ライブラリです。",
  legal_library_fflate: "<strong>fflate</strong> (ライセンス：MIT)：非常に高速なデータ圧縮・展開ライブラリで、Moodle モジュールの .mbz アーカイブ作成に使用されます。",
  legal_library_tarjs: "<strong>tar-js</strong> (ライセンス：MIT)：Moodle モジュールの .mbz ファイルを構成するための、圧縮前の .tar アーカイブ作成を可能にします。",
  legal_library_mammoth: "<strong>Mammoth</strong> (ライセンス：BSD 2-Clause)：Word ドキュメント (.docx) を HTML に変換し、Microsoft Word ファイルからのコンテンツのインポートと統合を容易にします。",
  legal_library_pdfjs: "<strong>PDF.js</strong> (ライセンス：Apache 2.0)：サーバーを介さず、ブラウザ上で直接 PDF ファイルからテキストを抽出することを可能にします。",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (ライセンス：Apache 2.0)：画像 (PNG, JPG, JPEG) やスキャンされた PDF からテキストを抽出するための光学文字認識 (OCR) エンジンです。",
  legal_library_mathjax: "<strong>MathJax</strong> (ライセンス: Apache 2.0): プレビューでの数式 (LaTeX) のレンダリングに使用されます。",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (ライセンス: MIT): サーバーやCMS（MoodleやWordPressなど）を必要とせず、ブラウザで直接H5Pコンテンツをプレビューできます。",
  legal_library_jspdf: "<strong>jsPDF</strong> (ライセンス: MIT): ブラウザ上で直接PDFドキュメントを生成するJavaScriptライブラリで、教育コンテンツをPDF形式にエクスポートするために使用されます。",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (ライセンス: MIT): エクスポートされたPDFドキュメント内に構造化された表を生成できるjsPDFの拡張機能です。",
  legal_library_docx: "<strong>docx</strong> (ライセンス: MIT): ブラウザ上でWordドキュメント (.docx) を作成するJavaScriptライブラリで、教育コンテンツをMicrosoft Word形式にエクスポートするために使用されます。",
  legal_library_ownership: "各ライブラリはそれぞれの著作者の財産であり、該当するライセンスに従って使用されています。",

  // ============================================================================
  // === 通知 ===
  // ============================================================================
  no_notifications: "通知はありません",
  clear_all: "すべてクリア",
  view: "表示",
  today: "今日",
  error: "エラー",
  download: "ダウンロード",
  edit_content: "編集",
  compatible_with: "対応:",
  preview_placeholder: "プレビューは近日公開予定",
  previous: "前へ",
  next: "次へ",
  close_modal: "閉じる",
  loading: "読み込み中...",
  preview_error: "このファイルのプレビューを表示できません",
  simulator_warning: "アクティビティシミュレータによるプレビュー：Éléaでの最終的な表示は若干異なる場合があります。",
  editor_confirm_close_title: "保存されていない変更",
  editor_confirm_close_message: "終了する前に変更を保存しますか？",
  editor_confirm_close_cancel: "エディタに留まる",
  editor_confirm_close_save: "保存して終了",
  editor_confirm_close_discard: "保存せずに終了",

  // JSON エディタ
  editor_title_prefix: "編集:",
  editor_loading: "エディタを読み込み中...",
  editor_unknown_type: "認識されないコンテンツタイプ",
  editor_no_schema: "このタイプにはスキーマがありません",
  editor_init_error: "エディタの初期化中にエラーが発生しました",
  editor_save: "保存",
  editor_cancel: "キャンセル",
  editor_unsaved_changes: "保存されていない変更",
  editor_confirm_discard: "本当にキャンセルしますか？保存されていない変更は失われます。",
  editor_validation_errors: "検証エラー",

  // セクション
  editor_section_general: "基本情報",
  editor_section_question: "問題",
  editor_section_questions: "問題",
  editor_section_answers: "回答",
  editor_section_answer: "回答",
  editor_section_feedback: "フィードバック",
  editor_section_cards: "カード",
  editor_section_sentences: "文章",
  editor_section_events: "イベント",
  editor_section_words: "単語",
  editor_section_keywords: "キーワード",
  editor_section_entries: "エントリ",
  editor_section_pairs: "ペア",
  editor_section_text: "テキスト",

  // 全般フィールド
  editor_title: "タイトル",
  editor_description: "説明",
  editor_description_hint: "生徒に表示される指示",
  editor_intro: "導入",
  editor_task_description: "指示",
  editor_question_text: "問題文",

  // カード
  editor_card: "カード",
  editor_card_front: "表面",
  editor_card_front_placeholder: "問題または用語",
  editor_card_back: "裏面",
  editor_card_back_placeholder: "回答または定義",
  editor_card_tip: "ヒント",
  editor_add_card: "カードを追加",

  // 回答
  editor_answer: "回答",
  editor_answer_text: "回答テキスト",
  editor_is_correct: "正解",
  editor_add_answer: "回答を追加",

  // ヒントとフィードバック
  editor_tips_feedback: "ヒントとフィードバック",
  editor_tip: "ヒント",
  editor_tip_optional: "ヒント（任意）",
  editor_tips_optional: "ヒント（任意）",
  editor_tip_front: "表面のヒント",
  editor_tip_back: "裏面のヒント",
  editor_chosen_feedback: "選択された時のフィードバック",
  editor_not_chosen_feedback: "選択されなかった時のフィードバック",
  editor_feedback_correct: "正解時のフィードバック",
  editor_feedback_wrong: "不正解時のフィードバック",
  editor_overall_feedback: "スコア別の全体的なフィードバック",

  // フィードバック範囲
  editor_feedback_ranges_label: "スコアに基づくフィードバック",
  editor_feedback_placeholder: "この範囲のフィードバックメッセージ...",
  editor_add_range: "範囲を追加",

  // 正誤 (True/False)
  editor_correct_answer: "正解",
  editor_true: "はい",
  editor_false: "いいえ",

  // 穴埋め / 単語ドラッグ
  editor_sentence: "文章",
  editor_sentence_text: "文章テキスト",
  editor_add_sentence: "文章を追加",
  editor_blanks_hint: "推測させたい単語を *アスタリスク* で囲んでください",
  editor_text_with_blanks: "単語を配置するテキスト",
  editor_drag_words_hint: "*アスタリスク* で囲まれた単語はドラッグ要素になります",

  // タイムライン
  editor_event: "イベント",
  editor_add_event: "イベントを追加",
  editor_start_date: "開始日",
  editor_end_date: "終了日",
  editor_event_title: "イベント名",
  editor_event_description: "説明",
  editor_event_tag: "タグ",

  // クロスワード
  editor_word: "単語",
  editor_add_word: "単語を追加",
  editor_clue: "ヒント/定義",
  editor_orientation: "方向",
  editor_horizontal: "横",
  editor_vertical: "縦",
  editor_crossword_answer_hint: "単語は大文字で記入してください",

  // エッセイ
  editor_keyword: "キーワード",
  editor_keyword_text: "期待されるキーワード",
  editor_keyword_weight: "比重",
  editor_add_keyword: "キーワードを追加",

  // 用語集
  editor_entry: "エントリ",
  editor_add_entry: "エントリを追加",
  editor_term: "用語",
  editor_definition: "定義",

  // Moodle
  editor_question: "問題",
  editor_add_question: "問題を追加",
  editor_pair: "ペア",
  editor_add_pair: "ペアを追加",
  editor_left_element: "左の要素",
  editor_right_element: "右の要素",
  editor_choice: "選択肢",
  editor_choice_text: "選択肢テキスト",
  editor_add_choice: "選択肢を追加",

  // 項目アクション
  editor_add_item: "追加",
  editor_drag: "移動",
  editor_duplicate: "複製",
  editor_delete: "削除",
  editor_confirm_delete: "この項目を本当に削除しますか？",
  editor_min_items_reached: "最小項目数に達しました",
  editor_max_items_reached: "最大項目数に達しました",

  // 検証エラー
  editor_error_required: "このフィールドは必須です",
  editor_error_min_length: "{0}文字以上入力してください",
  editor_error_max_length: "{0}文字以内で入力してください",
  editor_error_pattern: "無効な形式です",
  editor_error_min_items: "少なくとも {0} 個の項目が必要です",
  editor_error_max_items: "項目数は最大 {0} 個までです",
  editor_error_number: "数値を入力してください",
  editor_error_min: "最小値は {0} です",
  editor_error_max: "最大値は {0} です",
  editor_error_feedback_ranges: "範囲は重複なく0-100%をカバーする必要があります",
  editor_error_no_correct: "少なくとも1つの回答を正解にする必要があります",
  editor_error_date_format: "無効な日付形式です (期待値: YYYY,M,D)",
  editor_error_no_blanks: "テキストには少なくとも1つの *アスタリスク* で囲まれた単語が必要です",

  // QuizSet
  editor_library_type: "ライブラリタイプ",
  editor_question_title: "問題タイトル",
  editor_question_params: "問題パラメータ",
  editor_parameters: "パラメータ",

  // クロスワード
  editor_extra_clue: "追加ヒント",

  // FindTheWords
  editor_word_list: "単語リスト",

  // SingleChoiceSet
  editor_answers: "選択肢",

  // MarkTheWords
  editor_text_with_marks: "マークする単語を含むテキスト",
  editor_mark_words_hint: "マークさせたい単語を *アスタリスク* で囲んでください",

  // SortParagraphs
  editor_section_paragraphs: "段落",
  editor_paragraph: "段落",
  editor_add_paragraph: "段落を追加",
  editor_paragraph_text: "段落テキスト",

  // Summary
  editor_section_summaries: "まとめ",
  editor_summary_item: "項目のまとめ",
  editor_add_summary_item: "項目を追加",
  editor_statement: "記述",
  editor_add_statement: "記述を追加",
  editor_statement_text: "記述テキスト",

  // Moodle 小テスト
  editor_question_type: "問題タイプ",

  // Moodle ページ
  editor_section_blocks: "ブロック",
  editor_block: "ブロック",
  editor_add_block: "ブロックを追加",
  editor_block_type: "ブロックタイプ",
  editor_block_content: "ブロックの内容",

  // Éléa 特有のアクティビティ
  // 用語集
  editor_glossary_name: "用語集の名前",

  // ミリオネア
  editor_good_answer: "正解",
  editor_bad_answers: "不正解の選択肢",
  editor_bad_answer: "不正解の選択肢",
  editor_add_bad_answer: "不正解の選択肢を追加",

  // テスト (問題バンク)
  editor_bank_name: "問題バンク名",
  editor_bank_description: "問題バンクの説明",
  editor_question_name: "問題名",
  editor_question_feedback: "全体的なフィードバック",
  editor_answer_fraction: "点数/スコア",
  editor_answer_feedback: "回答へのフィードバック",
  editor_subquestion: "小問",
  editor_add_subquestion: "小問を追加",
  editor_numerical_value: "数値",
  editor_numerical_tolerance: "許容範囲",
  editor_section_subquestions: "小問",
  editor_section_content: "コンテンツ",
  editor_feedback_if_true: "「はい」の場合のフィードバック",
  editor_feedback_if_false: "「いいえ」の場合のフィードバック",

  // メッセージ
  editor_save_success: "変更を保存しました",
  editor_save_error: "保存中にエラーが発生しました",
  editor_regenerating: "ファイルを再生成中...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "ページ",
  doc_fmt_summary_header: "目次",
  doc_fmt_quiz_title: "クイズ",
  doc_fmt_instructions: "📝 手順：次の質問に答えてください。",
  doc_fmt_question_header: "質問",

  // --- Shared properties ---
  doc_fmt_type: "タイプ：",
  doc_fmt_feedbacks: "💬 フィードバック：",
  doc_fmt_global_feedbacks: "全体的なフィードバック",
  doc_fmt_answers: "回答：",
  doc_fmt_correct_answer_true: "正解：正しい ✓",
  doc_fmt_correct_answer_false: "正解：誤り ✓",
  doc_fmt_text_if_true: "正しい場合のテキスト：",
  doc_fmt_text_if_false: "誤りの場合のテキスト：",
  doc_fmt_text_with_answers: "回答付きテキスト：",
  doc_fmt_text_with_marks: "マークする単語を含むテキスト：",
  doc_fmt_marks_to_find: "マークする単語：",
  doc_fmt_keywords_expected: "期待されるキーワード：",
  doc_fmt_accepted_answers: "受け入れられる回答：",
  doc_fmt_text_to_complete: "完成させるテキスト：",
  doc_fmt_also_called: "🏷️ 別名：",
  doc_fmt_image_not_found: "⚠️ [画像が見つかりません]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "単語カード",
  doc_fmt_card_index: "カード",
  doc_fmt_card_front: "表面：",
  doc_fmt_card_back: "裏面：",
  doc_fmt_hint: "💡 ヒント：",
  doc_fmt_crossword_title: "クロスワードパズル",
  doc_fmt_definitions_and_answers: "定義と回答",
  doc_fmt_answer: "回答：",
  doc_fmt_extra_hint: "💡 追加のヒント：",
  doc_fmt_timeline_events: "イベント",
  doc_fmt_timeline_periods: "期間",
  doc_fmt_drag_the_words_title: "単語のドラッグ",
  doc_fmt_fill_in_the_blanks_title: "穴埋め問題",
  doc_fmt_mark_the_words_title: "単語のマーク",
  doc_fmt_glossary_title: "用語集",
  doc_fmt_term_index: "用語",
  doc_fmt_chart_title: "チャート",
  doc_fmt_data: "データ",
  doc_fmt_summary_title: "要約",
  doc_fmt_claim_index: "声明",
  doc_fmt_multiple_choice_title: "多肢選択問題",
  doc_fmt_single_choice_set_title: "単一選択問題セット",
  doc_fmt_true_false_title: "正誤問題",
  doc_fmt_dialog_cards_title: "対話カード",
  doc_fmt_hint_front: "💡 ヒント（表面）：",
  doc_fmt_hint_back: "💡 ヒント（裏面）：",
  doc_fmt_sort_paragraphs_title: "段落の並べ替え",
  doc_fmt_paragraphs_ordered: "正しい順序の段落",
  doc_fmt_find_the_words_title: "単語探し",
  doc_fmt_words_to_find: "探す単語",
  doc_fmt_matching_title: "マッチング",
  doc_fmt_matching_instructions: "📝 手順：各項目を対応するものと一致させてください。",
  doc_fmt_pairs_to_match: "マッチングするペア",
  doc_fmt_millionnaire_title: "クイズ$ミリオネア",
  doc_fmt_millionnaire_instructions: "📝 説明：4つの選択肢の中から正解を見つけてください。",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "記述式問題",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "テスト",
  doc_fmt_associations: "関連付け：",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "多肢選択 (MCQ)",
  doc_fmt_type_matching: "マッチング",
  doc_fmt_type_numerical: "数値",
  doc_fmt_type_truefalse: "正誤",
  doc_fmt_type_shortanswer: "短答",
  doc_fmt_type_cloze: "穴埋め (Cloze)",
  doc_fmt_type_blanks: "穴埋め",
  doc_fmt_type_dragtext: "単語のドラッグ",
  doc_fmt_type_markwords: "単語のマーク",
  doc_fmt_type_essay: "記述式問題",
  doc_fmt_type_default: "質問",

  // 教育構造の記述/修正のための新しいキー
  doc_fmt_correction_title: "修正",
  doc_fmt_proposed_answers: "提案：",
  doc_fmt_correct_answer: "正解",
  doc_fmt_correct_answers: "正解：",
  doc_fmt_true: "真",
  doc_fmt_false: "偽",
  doc_fmt_words_to_place: "配置する単語：",
  doc_fmt_completed_text: "補完されたテキスト：",
  doc_fmt_text_to_mark: "単語を見つけるためのテキスト：",
  doc_fmt_words_count_to_find: "見つける単語数",
  doc_fmt_words_to_mark: "マークする単語：",
  doc_fmt_answer_space: "回答スペース：",
  doc_fmt_open_answer: "自由回答 - 教師が定義した基準に従った評価。",
  doc_fmt_definitions: "定義",
  doc_fmt_letters: "文字",
  doc_fmt_summary_instructions: "各グループについて、正しい記述を選択してください。",
  doc_fmt_sort_instructions: "次の段落を正しい順序に並べ替えてください。",
  doc_fmt_paragraphs_to_sort: "並べ替える段落",
  doc_fmt_correct_order: "正しい順序",
  doc_fmt_find_instructions: "見つけてください",
  doc_fmt_hidden_words: "グリッド内の隠し単語。",
  doc_fmt_hints: "ヒント",
  doc_fmt_flashcards_instructions: "各カードについて、質問に対応する回答を見つけてください。",
  doc_fmt_elements_to_match: "一致させる要素：",
  doc_fmt_possible_matches: "可能な一致：",
  doc_fmt_correct_associations: "正しい関連付け：",

};