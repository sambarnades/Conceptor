const translations_pt = {
    subtitle: "Criação assistida de recursos e atividades para Moodle e Éléa",
    help_button: "Ajuda",
    help_modal_title: "🚀 Guia de Início Rápido do Caramel",
    help_modal_content: `
        <div class="help-modal-content">
            <p>Bem-vindo ao <strong>Caramel</strong>! Esta ferramenta guia-o passo a passo para criar atividades educativas interativas com a ajuda da inteligência artificial. Siga estes passos simples para transformar as suas ideias em módulos prontos a usar.</p>

            <div class="help-section">
                <h4><span class="help-step-number">1</span> Escreva a sua ideia (o "prompt")</h4>
                <p>Tudo começa com a descrição das suas necessidades. Tem duas opções para isso:</p>
                <ul>
                    <li><span class="badge-help-mode">Modo Rápido</span>: Ideal para um início rápido. Indique simplesmente <strong>quem você é</strong> (ex: <em>Professor de Ciências</em>) e <strong>o que quer abordar</strong> (ex: <em>o ciclo da água no 6º ano</em>).</li>
                    <li><span class="badge-help-mode">Modo Guiado</span>: Para um pedido mais preciso. Preencha a <strong>disciplina</strong>, o <strong>tema</strong>, o <strong>nível do aluno</strong> e o <strong>número de itens</strong> que deseja (perguntas, datas, etc.).</li>
                </ul>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">2</span> Gerar os prompts</h4>
                <p>Depois de inserir as suas informações, clique no botão <button id="generateBtn" data-key="generate_prompts">Gerar prompts</button>. A ferramenta preparará então instruções detalhadas (os "prompts") para cada tipo de atividade disponível.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">3</span> Escolha a sua atividade</h4>
                <p>Navegue entre os separadores <span class="badge-help-tab">H5P</span> e <span class="badge-help-tab">Módulos Éléa/Moodle</span> para descobrir as diferentes atividades disponíveis. Clique naquela que lhe interessa (por exemplo, "Linha do tempo" ou "MCQ"). O prompt correspondente aparecerá na área de texto.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">4</span> Utilize a Inteligência Artificial</h4>
                <p>É aqui que a magia acontece! Tem duas opções para gerar o conteúdo da sua atividade:</p>
                <div class="help-subsection">
                    <h5><i class="fas fa-robot"></i> Opção A: Gerar com Albert (Recomendado)</h5>
                    <p>Clique no botão <button class="action-btn albert-btn">Gerar com Albert</button>. Pode escolher o modelo de IA que melhor se adapta às suas necessidades (rápido, poderoso ou especializado em código) clicando na pequena seta à direita do botão. O conteúdo da sua atividade será <strong>gerado e inserido automaticamente</strong> no campo de resultados, pronto a ser utilizado.</p>
                    <ul class="advantages">
                        <li><strong>Pontos fortes:</strong> Simples, rápido, IA integrada diretamente na ferramenta.</li>
                        <li><strong>Pontos fracos:</strong> Sem pesquisa na web, sem possibilidade de personalizar o prompt inicial da IA.</li>
                    </ul>
                </div>
                <div class="help-subsection">
                    <h5><i class="fas fa-paste"></i> Opção B: Utilize a sua própria IA</h5>
                    <p>Clique em <button class="copy-btn">📋 Copiar prompt</button> e cole esta instrução na sua inteligência artificial favorita (ChatGPT, Le Chat, etc.). Em seguida, <strong>copie a resposta da IA</strong> e <strong>cole-a</strong> no campo de resultados do Caramel.</p>
                    <ul class="advantages">
                        <li><strong>Pontos fortes:</strong> Flexibilidade total, possível acesso à internet, capacidade de modificar o prompt inicial e adicionar documentos para a geração de conteúdo.</li>
                        <li><strong>Pontos fracos:</strong> Requer copiar e colar manualmente e uma conta externa.</li>
                    </ul>
                </div>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">5</span> Crie e descarregue o seu ficheiro</h4>
                <p>Assim que o conteúdo estiver no campo de resultados (gerado pelo Albert ou colado por si), clique no botão <button class="download-btn">Gerar H5P</button> (ou .mbz/.xml dependendo da atividade). O seu ficheiro será descarregado, pronto para ser integrado na sua plataforma Moodle ou Éléa.</p>
                <p class="help-final-tip">E pronto! Criou uma atividade interativa em apenas alguns cliques. Sinta-se à vontade para experimentar os diferentes modos e tipos de atividades para enriquecer os seus cursos.</p>
            </div>
        </div>
    `,
    fast_mode: "Modo Rápido",
    guided_mode: "Modo Guiado",
    who_are_you: "Quem é você? (ex.: Professor, formador...)",
    what_to_address: "O que deseja abordar? (ex.: A natureza de um ângulo no 6.º ano...)",
    discipline: "Disciplina (ex.: História)",
    theme: "Tema (ex.: A Revolução Francesa)",
    level: "Nível (ex.: Secundário profissional – 10.º ano)",
    number_of_elements: "Número de elementos (ex.: 10)",
    additional_info: "Informações complementares e específicas...",
    generate_prompts: "Gerar prompts",
    h5p_tab: "H5P",
    moodle_tab: "Módulos Éléa/Moodle",

    // General Context (Advanced Mode)
    prompt_expert_intro: "Você é um professor especialista em pedagogia que ajustará o tom e o vocabulário de acordo com os programas atuais e o nível dos alunos para a disciplina de ",
    prompt_context_title: "**Contexto:**",
    prompt_subject: "- **Matéria:**",
    prompt_student_level: "- **Nível dos alunos:**",
    prompt_theme: "- **Tema:**",
    prompt_number_of_elements: "- **Número de elementos:**",
    prompt_additional_info: "- **Informações complementares:**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "Sou um(a) **",
    prompt_simple_intro_part2: "** e desejo **",
    prompt_language_instruction: "O conteúdo gerado deve estar em português, a menos que outro idioma seja especificado no pedido.",
    prompt_code_block_instruction: "Você deve gerar o resultado em um bloco de código.",

    // Timeline Prompt
    timeline_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Timeline\".",
    timeline_prompt_mission: "**Sua missão:**",
    timeline_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P do tipo Timeline. O JSON deve ser diretamente utilizável.",
    timeline_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    timeline_prompt_json_structure_main_object: "O objeto principal deve conter a chave \"timeline\". Esse objeto \"timeline\" deve incluir:",
    timeline_prompt_headline: "`headline`: Um título geral para a linha do tempo.",
    timeline_prompt_text: "`text`: Um breve parágrafo de introdução.",
    timeline_prompt_asset: "`asset`: Um objeto para a imagem de capa com `media` (URL), `caption` (legenda) e `credit` (fonte).",
    timeline_prompt_date_array: "`date`: Um array contendo ${nombreQuestions} objetos, cada um representando um evento.",
    timeline_prompt_era_array: "`era`: Um array de objetos para definir períodos que abrangem vários eventos.",
    timeline_prompt_content_rules_title: "**Regras para o conteúdo:**",
    timeline_prompt_rule1: "1.  Cada evento no array `date` deve ter:",
    timeline_prompt_rule1_startDate: "-   `startDate` e `endDate`: Data no formato \"AAAA,MM,DD\" ou \"AAAA\". Use `endDate` para definir um período.",
    timeline_prompt_rule1_headline: "-   `headline`: Título do evento.",
    timeline_prompt_rule1_text: "-   `text`: Descrição em HTML (use <p> e <strong>).",
    timeline_prompt_rule1_asset: "-   `asset`: Objeto opcional com uma imagem ilustrativa do evento.",
    timeline_prompt_rule1_tag: "- `tag`: Uma palavra-chave que caracteriza o período (ex: 'história', 'ciência').",
    timeline_prompt_rule2: "2.  Para cada `asset`, pesquise ativamente por uma imagem relevante e livre de royalties (ex: Wikimedia Commons). O URL em `media` deve ser um link direto e válido. Forneça a fonte e a licença em `credit`. Se nenhuma imagem adequada for encontrada, omita completamente o objeto `asset`.",
    timeline_prompt_rule3: "3.  Para cada período (`era`), adicione um campo `text` com uma breve descrição e um `tag`.",
    timeline_prompt_example_json_title: "**Exemplo de estrutura JSON:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Título da linha do tempo",
"text": "<p>Introdução ao tema da linha do tempo.</p>",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Início da Primeira Guerra Mundial",
"text": "<p>O Império Austro-Húngaro declara guerra à Sérvia.</p>",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "O arquiduque Francisco Ferdinando pouco antes do seu assassinato.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "Guerra"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Armistício de 1918",
"text": "<p>Assinatura do armistício em Rethondes, marcando o fim dos combates.</p>",
"tag": "Tratado"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Primeira Guerra Mundial",
"text": "<div>É o período da Grande Guerra.</div>",
"tag": "Período histórico"
}
]
}
}
\`\`\` `,
    timeline_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário. O resultado será utilizado diretamente por outra ferramenta.",

    // Crossword Prompt
    crossword_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Crossword\".",
    crossword_prompt_mission: "**Sua missão:**",
    crossword_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P de palavras cruzadas.",
    crossword_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    crossword_prompt_json_structure_main_object: "O objeto deve conter:",
    crossword_prompt_title: "`title`: Um título para a atividade.",
    crossword_prompt_words_array: "`words`: Um array de ${nombreQuestions} objetos, cada um com:",
    crossword_prompt_answer: "`answer`: A palavra a ser descoberta.",
    crossword_prompt_clue: "`clue`: A definição correspondente.",
    crossword_prompt_extra_clue_optional: "`extraClue` (opcional): Um objeto contendo uma pista adicional. A IA deve julgar a relevância de adicionar uma.",
    crossword_prompt_task_description: "`taskDescription`: Uma instrução clara.",
    crossword_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa.",
    crossword_prompt_content_rules_title: "**Regras para o conteúdo:**",
    crossword_prompt_rule1: "1.  As palavras (`answer`) devem ser termos únicos e pertinentes.",
    crossword_prompt_rule2: "2.  As definições (`clue`) devem ser curtas e precisas.",
    crossword_prompt_rule3: "3.  O restante da estrutura JSON (comportamento, tema etc.) deve ser mantido como está.",
    crossword_prompt_example_json_title: "**Exemplo de JSON para uma palavra:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Palavras cruzadas sobre Biologia",
"words": [
{
"answer": "Célula",
"clue": "Unidade básica da vida.",
"extraClue": {
"params": {
"text": "<p>Pode ser animal ou vegetal.</p>"
}
}
},
{
"answer": "DNA",
"clue": "Molécula que carrega a informação genética."
}
],
"taskDescription": "<p>Complete a grade de palavras cruzadas.</p>"
}
\`\`\` `,
    crossword_prompt_generate_only_json: "Gere o JSON completo e válido, preenchendo o título, a descrição e o array \"words\", sem quaisquer outros comentários.",

    // Crossword UI translations
    crossword_across: "Horizontal",
    crossword_down: "Vertical",
    crossword_check_answer: "Verificar",
    crossword_try_again: "Tentar novamente",
    crossword_show_solution: "Mostrar solução",
    crossword_extra_clue: "Dica extra",
    crossword_close_window: "Fechar janela",
    crossword_submit_answer: "Enviar",

    // Essay Prompt
    essay_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Essay\".",
    essay_prompt_mission: "**Sua missão:**",
    essay_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P do tipo Essay.",
    essay_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    essay_prompt_json_structure_main_object: "O objeto deve conter:",
    essay_prompt_task_description: "`taskDescription`: Uma instrução clara convidando o aluno a redigir um texto sobre o tema. O tema deve estar em negrito (<strong>) e cada frase deve terminar com uma quebra de linha (<p>).",
    essay_prompt_keywords_array: "`keywords`: Um array com ${nombreQuestions} objetos, cada um definindo uma palavra-chave que o sistema deverá encontrar na resposta do aluno.",
    essay_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa.",
    essay_prompt_content_rules_title: "**Regras para o conteúdo:**",
    essay_prompt_rule1: "1.  Cada objeto em `keywords` deve conter a chave `keyword` com a palavra a ser encontrada.",
    essay_prompt_rule2: "2.  As palavras-chave devem ser pertinentes e essenciais para avaliar a compreensão do tema.",
    essay_prompt_rule3: "3.  A estrutura JSON (comportamento etc.) deve ser mantida.",
    essay_prompt_rule4: "4. A instrução (`taskDescription`) deve incentivar a escrita sem usar as palavras-chave listadas em `keywords`, exceto o nome do tema, se necessário para a compreensão.",
    essay_prompt_example_json_title: "**Exemplo de JSON para uma palavra-chave:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "<p>Escreve um texto curto explicando a fotossíntese.</p>",
"keywords": [
{
"keyword": "luz",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "clorofila",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "Gere o JSON completo e válido, preenchendo a instrução e a lista de palavras-chave, sem quaisquer outros comentários.",

    // Moodle XML Prompt
    moodle_xml_prompt_role: "Você é um especialista em engenharia pedagógica criando um banco de perguntas para uma atividade de Teste no Moodle/Éléa.",
    moodle_xml_prompt_intro: "Desejo criar um questionário com ${nombreQuestions} perguntas.",
    moodle_xml_prompt_content_title: "Quanto ao conteúdo:",
    moodle_xml_prompt_content_rule1: "As respostas incorretas devem ser coerentes com o tema, mas claramente falsas para evitar o acaso.",
    moodle_xml_prompt_content_rule2: "A dificuldade das perguntas deve variar, idealmente do mais simples ao mais complexo.",
    moodle_xml_prompt_content_rule3: "Simplifique a formulação mantendo a precisão do conteúdo.",
    moodle_xml_prompt_content_rule4: "Para gerar o feedback, forneça em uma ou duas frases os elementos de resposta esperados.",
    moodle_xml_prompt_question_types_intro: "As perguntas devem ser distribuídas equitativamente entre os seguintes tipos:",
    moodle_xml_prompt_question_type_multichoice: "- multichoice (QCM, com apenas uma resposta correta),",
    moodle_xml_prompt_question_type_matching: "- matching (correspondência),",
    moodle_xml_prompt_question_type_numerical: "- numerical (resposta numérica com ou sem tolerância),",
    moodle_xml_prompt_question_type_truefalse: "- truefalse (verdadeiro/falso).",
    moodle_xml_prompt_question_type_shortanswer: "- shortanswer (resposta curta) com possíveis respostas alternativas,",
    moodle_xml_prompt_question_type_cloze: "- cloze (texto com lacunas) com as categorias MULTICHOICE, MULTICHOICE_H, MULTICHOICE_V, MULTICHOICE_S, MULTICHOICE_HS, MULTIRESPONSE, MULTIRESPONSE_H, MULTIRESPONSE_HS, NUMERICAL, SHORTANSWER ou SHORTANWSER_C, conforme o mais adequado ao contexto.",
    moodle_xml_prompt_form_title: "Quanto à forma:",
    moodle_xml_prompt_form_rule1: "O ficheiro XML deve:",
    moodle_xml_prompt_form_rule1_encoding: "Estar codificado em UTF-8 (inserir a linha de codificação).",
    moodle_xml_prompt_form_rule1_reusable: "Ser diretamente reutilizável no Moodle, sem erros de formato.",
    moodle_xml_prompt_form_rule1_standard_structure: "Seguir a estrutura XML padrão do Moodle (com <quiz>, <question>, etc.).",
    moodle_xml_prompt_form_rule1_special_chars: "Símbolos matemáticos como '<' ou '>' devem ser codificados como entidades HTML (por exemplo, `<` para '<' e `>` para '>') para evitar qualquer confusão com as tags XML.",
    moodle_xml_prompt_generate_only_xml: "Não comente, não formate, não resuma: quero apenas o conteúdo bruto do ficheiro XML. Respeite rigorosamente o formato descrito, pois colarei o resultado noutro instrumento que espera esse formato. Forneça a resposta em forma de código pré-formatado",

    // GIFT Prompt
    gift_prompt_role: "Você é um especialista em engenharia pedagógica criando um banco de perguntas para uma atividade de Teste no Moodle/Éléa em formato GIFT.",
    gift_prompt_intro: "Desejo criar um questionário com ${nombreQuestions} perguntas.",
    gift_prompt_format_info: "O questionário deve estar no formato GIFT, destinado à importação no Moodle.",
    gift_prompt_question_quality: "Cada pergunta deve ser clara, concisa e sem ambiguidades. Deve conter feedback detalhado.",
    gift_prompt_code_format_intro: "O código deve estar exatamente no mesmo formato do exemplo abaixo:",
    gift_prompt_example_question_comment: "// question: 1  name: Qual é o objeto central do nosso sistema solar?",
    gift_prompt_example_question_text: "::Qual é o objeto central do nosso sistema solar?::Qual é o objeto central do nosso sistema solar?{",
    gift_prompt_example_answer_correct: "=O Sol#Exato! O Sol é a estrela central do nosso sistema solar. Muito bem!",
    gift_prompt_example_answer_incorrect1: "~A Lua#Errado. A Lua é um satélite natural da Terra. O Sol é o objeto central.",
    gift_prompt_example_answer_incorrect2: "~Júpiter#Errado. Júpiter é um planeta gigante gasoso. O Sol é o objeto central.",
    gift_prompt_example_answer_incorrect3: "~A Terra#Errado. A Terra é o planeta onde vivemos. O Sol é o objeto central.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "O questionário deve incluir, aleatoriamente, diferentes tipos de perguntas:",
    gift_prompt_question_type_multichoice: "- questões de múltipla escolha (multichoice), com 1 resposta correta e 3 distratores.",
    gift_prompt_question_type_truefalse: "- questões de verdadeiro/falso (truefalse).",
    gift_prompt_question_type_numerical: "- questões numéricas (numerical) com margem de erro aceitável.",
    gift_prompt_question_type_matching: "- questões de correspondência (matching) com pelo menos 4 pares.",
    gift_prompt_generate_only_gift: "Gere diretamente o questionário no formato GIFT, sem comentários nem etiquetas adicionais. Respeite rigorosamente o formato descrito, pois colarei o resultado noutro instrumento que espera esse formato. Forneça a resposta em forma de código pré-formatado.",

    // Flashcards Prompt
    flashcards_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Flashcards\".",
    flashcards_prompt_mission: "**Sua missão:**",
    flashcards_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P do tipo Flashcards. O JSON deve ser diretamente utilizável.",
    flashcards_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    flashcards_prompt_json_structure_main_object: "O objeto deve conter:",
    flashcards_prompt_title: "`title`: Um título pertinente para a atividade.",
    flashcards_prompt_description: "`description`: Uma instrução clara para o aluno.",
    flashcards_prompt_cards_array: "`cards`: Um array de ${nombreQuestions} objetos, em que cada objeto representa um cartão e contém:",
    flashcards_prompt_text: "`text`: A pergunta ou o termo a adivinhar (frente).",
    flashcards_prompt_answer: "`answer`: A resposta ou a definição (verso). Atenção: `answer` só pode conter uma palavra simples ou um número.",
    flashcards_prompt_tip: "`tip` (opcional): Uma dica em formato HTML para ajudar o aluno se a pergunta for difícil. Adicione uma dica apenas se achar relevante.",
    flashcards_prompt_example_json_title: "**Exemplo de JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "As capitais da Europa",
"description": "Memoriza a capital de cada país. Clica no cartão para ver a resposta.",
"cards": [
{
"text": "França",
"answer": "Paris"
},
{
"text": "Países Baixos",
"answer": "Amesterdão",
"tip": "<p>É a cidade dos <strong>canais</strong> e das túlipas!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // QuizSet Prompt
    quiz_set_prompt_role: "Você é um especialista em engenharia pedagógica criando o conteúdo para uma atividade \"H5P Quiz (Question Set)\".",
    quiz_set_prompt_mission: "**Sua missão:**",
    quiz_set_prompt_generate_json: "Gere um objeto JSON **apenas para o conteúdo** de um questionário H5P. O JSON deve ser diretamente utilizável como ficheiro `content.json`.",
    quiz_set_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    quiz_set_prompt_json_structure_main_object: "O objeto principal deve conter as seguintes chaves:",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: Um array de ${nombreQuestions} objetos, cada um representando uma pergunta.",
    quiz_set_prompt_content_rules_title: "**Regras para o conteúdo das perguntas:**",
    quiz_set_prompt_rule1: "1.  Cada objeto de pergunta deve ter as chaves `library`, `params` e `subContentId`.",
    quiz_set_prompt_rule2: "2.  **Estrutura:** Cada pergunta deve ser um objeto com as chaves `library`, `metadata` e `params`.",
    quiz_set_prompt_rule3: "3.  Varie os tipos de perguntas. Use as seguintes bibliotecas com as versões exatas:",
    quiz_set_prompt_rule4: "4.  **Feedback (REGRA CRUCIAL):** Para **todos os tipos de perguntas** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), você **deve** gerar um `overallFeedback` com exatamente 6 faixas de pontuação: 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Para perguntas `TrueFalse`, adicione também os campos `feedbackOnCorrect` e `feedbackOnWrong`. O feedback deve ser benevolente, gradual e sempre formulado de forma afirmativa.",
    quiz_set_prompt_rule5: "5.  **Conteúdo:** O conteúdo em `params` deve ser pedagogicamente relevante, com distratores plausíveis para MCQs e textos coerentes para outras atividades.",
    quiz_set_prompt_rule6: "6.  **Simplicidade:** Não adicione imagens ou parâmetros de comportamento supérfluos. Mantenha a estrutura simples como nos exemplos.",
    quiz_set_prompt_example_json_title: "**Exemplos de estruturas para cada tipo de pergunta autorizada:**",
    quiz_set_example_true_false: "Verdadeiro/Falso :",
    quiz_set_example_multiple_choice: "Escolha múltipla :",
    quiz_set_example_fill_in_the_blanks: "Texto com lacunas :",
    quiz_set_example_drag_the_words: "Arrastar as palavras :",
    quiz_set_example_mark_the_words: "Marcar as palavras :",
    quiz_set_example_essay: "Redação :",
    quiz_set_prompt_generate_only_json: "Gere apenas o JSON válido, começando por `{\"progressType\": \"dots\", ...}`, sem qualquer comentário.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Título da pergunta Verdadeiro/Falso" },
        "params": {
            "question": "<p>A França é um país?</p>",
            "correct": "true",
            "feedbackOnCorrect": "Correto! A França é de facto um país.",
            "feedbackOnWrong": "Incorreto. A França é reconhecida internacionalmente como um país.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Título do QCM" },
        "params": {
            "question": "<p>Qual é a capital da França?</p>",
            "answers": [
                { "text": "Paris", "correct": true },
                { "text": "Berlim", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "Título do exercício de preencher lacunas" },
        "params": {
            "questions": ["<p>Paris é a *capital* da França.</p>"],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "Título da atividade de arrastar palavras" },
        "params": {
            "taskDescription": "Complete a frase.",
            "textField": "*Paris* é a capital da França.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "Título da atividade de marcar palavras" },
        "params": {
            "taskDescription": "Sublinhe a capital.",
            "textField": "A capital da França é *Paris*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "Título da redação" },
        "params": {
            "taskDescription": "<p>Qual é a capital da França?</p>",
            "keywords": [
                { "keyword": "Paris", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Accordion\".",
    glossary_prompt_mission: "**Sua missão:**",
    glossary_prompt_generate_json: "Gere um objeto JSON completo e válido para um glossário H5P do tipo Accordion. O JSON deve ser diretamente utilizável.",
    glossary_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    glossary_prompt_json_structure_main_object: "Gere um array de ${nombreQuestions} objetos JSON.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: A palavra ou expressão a definir.",
    glossary_prompt_content: "`text`: A definição em formato HTML (use <p>, <strong>, etc.).",
    glossary_prompt_content_rules_title: "**Regras para o conteúdo:**",
    glossary_prompt_rule1: "1.  As definições devem ser claras, concisas e adequadas ao nível dos alunos.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Exemplo de JSON para uma entrada:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Fotossíntese",
"text": "<p>Processo pelo qual as plantas verdes transformam a luz solar em energia.</p>"
},
{
"title": "Célula",
"text": "<p>Unidade básica de todos os seres vivos.</p>"
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // Summary Prompt
    summary_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Summary\".",
    summary_prompt_mission: "**Sua missão:**",
    summary_prompt_generate_json: "Gere um objeto JSON completo para uma atividade H5P do tipo Summary. O JSON deve ser diretamente utilizável.",
    summary_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    summary_prompt_json_structure_main_object: "O objeto deve conter as seguintes chaves:",
    summary_prompt_intro_field: "`intro`: Uma frase introdutória para a atividade (ex.: \"Escolha a afirmação correta.\").",
    summary_prompt_summaries_array: "`summaries`: Um array de ${nombreQuestions} objetos, cada um representando uma etapa do resumo.",
    summary_prompt_summary_object: "Cada objeto em `summaries` deve conter:",
    summary_prompt_summary_array: "- `summary`: Um array de frases.",
    summary_prompt_tip_field: "- `tip` (opcional, mas recomendado): Uma dica para ajudar o aluno.",
    summary_prompt_content_rules_title: "**Regras para o conteúdo:**",
    summary_prompt_rule1: "1.  Em cada array \"summary\", **a primeira frase é a correta**.",
    summary_prompt_rule2: "2.  As frases seguintes são distratores plausíveis, porém incorretos.",
    summary_prompt_rule3: "3.  O conjunto das frases corretas deve formar um resumo coerente.",
    summary_prompt_example_json_title: "**Exemplo de JSON para uma etapa:**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "Esta é a frase correta.",
    "Este é um distrator.",
    "Este é outro distrator."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa, relacionado com o tema.",
    summary_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // Summary UI translations
    summary_intro: "Escolha a afirmação correta.",
    summary_solved_label: "Progresso:",
    summary_score_label: "Respostas erradas:",
    summary_result_label: "O seu resultado",
    summary_feedback: "Você acertou @score de @total afirmações (@percent %).",
    summary_label_correct: "Correto.",
    summary_label_incorrect: "Incorreto! Por favor, tente novamente.",
    summary_label_correct_answers: "Respostas corretas.",
    summary_tip_button_label: "Mostrar dica",
    summary_score_bar_label: "Você obteve :num de :total pontos",
    summary_progress_text: "Progresso :num de :total",
    summary_alternative_incorrect_label: "Incorreto",

    // Drag the Words Prompt
    drag_word_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Drag the Words\".",
    drag_word_prompt_mission: "**Sua missão:**",
    drag_word_prompt_generate_json: "Gere um objeto JSON completo para uma atividade H5P do tipo Drag the Words. O JSON deve ser diretamente utilizável.",
    drag_word_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    drag_word_prompt_json_structure_main_object: "O objeto deve conter:",
    drag_word_prompt_task_description: "`taskDescription`: Uma instrução clara.",
    drag_word_prompt_text_field: "`textField`: O texto a completar. Cada frase deve terminar com uma quebra de linha `\\n`.",
    drag_word_prompt_content_rules_title: "**Regras para o conteúdo:**",
    drag_word_prompt_rule1: "1.  Crie um texto coerente sobre o tema, com frases curtas que terminam com `\\n`.",
    drag_word_prompt_rule2: "2.  As palavras arrastáveis estão entre asteriscos. Pode adicionar uma dica com `:minha dica` e feedback com `\\+feedback correto \\-feedback incorreto`.",
    drag_word_prompt_example_json_title: "**Exemplo de JSON:**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Completa o texto arrastando as palavras.",
"textField": "O *sistema solar* é composto por *oito* planetas que orbitam em torno do *Sol*."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa, relacionado com o tema.",

    // Drag the Words UI translations
    drag_words_check_answer: "Verificar",
    drag_words_try_again: "Tentar novamente",
    drag_words_show_solution: "Mostrar solução",
    drag_words_score_feedback: "Pontuação: @score de @total.",
    drag_words_tip_label: "Mostrar dica",
    drag_words_correct_text: "Correto!",
    drag_words_incorrect_text: "Incorreto!",
    drag_words_score_bar_label: "Você obteve :num de :total pontos",
    drag_words_submit_answer: "Enviar",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Fill in the Blanks\".",
    blanks_prompt_mission: "**Sua missão:**",
    blanks_prompt_generate_json: "Gere um objeto JSON completo para uma atividade H5P do tipo Fill in the Blanks. O JSON deve ser diretamente utilizável.",
    blanks_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    blanks_prompt_json_structure_main_object: "O objeto deve conter a chave `questions`, que é um array de strings. Cada string representa um bloco de texto a completar.",
    blanks_prompt_content_rules_title: "**Regras para o conteúdo:**",
    blanks_prompt_rule1: "-   As palavras a adivinhar ficam entre asteriscos (*palavra*).",
    blanks_prompt_rule2: "-   Para respostas alternativas, utilize uma barra: *Paris/Cidade Luz*.",
    blanks_prompt_rule3: "-   Para adicionar uma dica, utilize dois pontos: *open-source:Código-fonte público*.",
    blanks_prompt_example_json_title: "**Exemplo de JSON:**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"O sistema solar tem *oito* planetas. O maior é *Júpiter*.",
"A capital da França é *Paris/Cidade da Luz*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",
    blanks_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa, relacionado com o tema.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Mostrar soluções",
    blanks_try_again: "Tentar novamente",
    blanks_check_answer: "Verificar",
    blanks_not_filled_out: "Por favor, preencha todos os espaços.",
    blanks_answer_is_correct: "':ans' está correto",
    blanks_answer_is_wrong: "':ans' está errado",
    blanks_answered_correctly: "Respondido corretamente",
    blanks_answered_incorrectly: "Respondido incorretamente",
    blanks_solution_label: "Resposta correta:",
    blanks_input_label: "Espaço @num de @total",
    blanks_input_has_tip_label: "Dica disponível",
    blanks_tip_label: "Dica",
    blanks_score_bar_label: "Você obteve :num de :total pontos",
    blanks_submit_answer: "Enviar",
    blanks_feedback: "Você acertou @score de @total espaços.",
    blanks_finish_header: "Terminar?",
    blanks_finish_body: "Tem certeza de que deseja terminar?",
    blanks_cancel_label: "Cancelar",
    blanks_finish_label: "Terminar",
    blanks_retry_header: "Tentar novamente?",
    blanks_retry_body: "Tem certeza de que deseja tentar novamente?",
    blanks_retry_confirm_label: "Confirmar",
    blanks_checking_mode_header: "Modo de verificação",
    blanks_a11y_check: "Verifique as respostas. As respostas serão marcadas como corretas, incorretas ou não respondidas.",
    blanks_a11y_show_solution: "Mostre a solução. A tarefa será marcada com a sua solução correta.",
    blanks_a11y_retry: "Tente a tarefa novamente. Redefina todas as respostas e comece a tarefa novamente.",

    // Mark the Words Prompt
    mark_words_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Mark the Words\".",
    mark_words_prompt_mission: "**Sua missão:**",
    mark_words_prompt_generate_json: "Gere um objeto JSON completo para uma atividade H5P do tipo Mark the Words. O JSON deve ser diretamente utilizável.",
    mark_words_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    mark_words_prompt_json_structure_main_object: "O objeto deve conter:",
    mark_words_prompt_task_description: "`taskDescription`: Uma instrução clara.",
    mark_words_prompt_text_field: "`textField`: O texto em que as palavras a marcar estão entre asteriscos (*palavra*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa, relacionado com o tema.",
    mark_words_prompt_content_rules_title: "**Regras para o conteúdo:**",
    mark_words_prompt_rule1: "1.  Crie um parágrafo pertinente sobre o tema.",
    mark_words_prompt_rule2: "2.  Identifique cerca de ${nombreQuestions} palavras-chave importantes a marcar.",
    mark_words_prompt_rule3: "3.  Cada palavra a ser marcada deve estar individualmente entre asteriscos. Por exemplo, `*palavra1* *palavra2*` está correto, mas `*palavra1 palavra2*` não.",
    mark_words_prompt_rule4: "4.  Apóstrofos ou outros sinais de pontuação não devem estar juntos às palavras marcadas. Por exemplo, `d'*água*` está incorreto; deve ser escrito `d' *água*` para funcionar.",
    mark_words_prompt_example_json_title: "**Exemplo de JSON:**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Clica nas palavras importantes do texto.",
"textField": "O *sistema* *solar* é composto por *oito* planetas que orbitam em torno do *Sol*."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // Mark the Words UI translations
    mark_words_check_answer: "Verificar",
    mark_words_try_again: "Tentar novamente",
    mark_words_show_solution: "Mostrar solução",
    mark_words_correct_answer: "Correto!",
    mark_words_incorrect_answer: "Incorreto!",
    mark_words_missed_answer: "Omitido!",
    mark_words_display_solution_description: "A tarefa foi atualizada para conter a solução.",
    mark_words_score_bar_label: "Você obteve :num de :total pontos",
    mark_words_submit_answer: "Enviar",
    mark_words_a11y_full_text_label: "Texto completo legível",
    mark_words_a11y_clickable_text_label: "Texto completo onde as palavras podem ser marcadas",
    mark_words_a11y_solution_mode_header: "Modo de solução",
    mark_words_a11y_checking_header: "Modo de verificação",
    mark_words_a11y_check: "Verifique as respostas. As respostas serão marcadas como corretas, incorretas ou não respondidas.",
    mark_words_a11y_show_solution: "Mostre a solução. A tarefa será marcada com a sua solução correta.",
    mark_words_a11y_retry: "Tente a tarefa novamente. Redefina todas as respostas e comece a tarefa novamente.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "As bibliotecas de compressão (Tar.js ou fflate) não estão carregadas. Verifica a tua ligação à internet ou atualiza a página.",
    millionnaire_error_invalid_json: "A estrutura JSON é inválida. Certifica-te de que contém um 'title' e um array 'questions' com 6 perguntas conforme o exemplo.",
    millionnaire_activity_intro: "Participa neste jogo para testar os teus conhecimentos.",
    millionnaire_backup_log: "Cópia de segurança criada automaticamente pelo Caramel\n",
    millionnaire_success_generation: "Ficheiro {fileName} gerado com sucesso!",
    millionnaire_error_creation_mbz: "Erro ao criar o ficheiro MBZ:",
    millionnaire_error_generic: "Erro:",

    // Millionnaire Prompt
    millionnaire_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Millionnaire\".",
    millionnaire_prompt_num_questions: "**Número de perguntas:** 6",
    millionnaire_prompt_mission: "**Sua missão:**",
    millionnaire_prompt_generate_json: "Gere um objeto JSON contendo um título e uma lista de **6 perguntas** para um jogo do tipo \"Quem quer ser milionário\".",
    millionnaire_prompt_important_rules_title: "**Regras importantes:**",
    millionnaire_prompt_rule1: "1.  O `title` deve ser um título pertinente e envolvente para a atividade.",
    millionnaire_prompt_rule2: "2.  A dificuldade das perguntas no array `questions` deve ser **crescente e pedagógica**, adequada ao nível dos alunos. A primeira deve ser muito fácil e a última muito difícil.",
    millionnaire_prompt_rule3: "3.  O conteúdo deve ser rigorosamente exato e pertinente ao tema e ao nível escolar.",
    millionnaire_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    millionnaire_prompt_main_object: "Um objeto principal com duas chaves:",
    millionnaire_prompt_title: "- `title`: O título da atividade (string).",
    millionnaire_prompt_questions_array: "- `questions`: Um array com 6 objetos, cada um representando uma pergunta e contendo:",
    millionnaire_prompt_question: "- `question`: A pergunta (string).",
    millionnaire_prompt_good_answer: "- `goodanswer`: A resposta correta (string).",
    millionnaire_prompt_bad_answer: "- `badanswer`: Um array com 3 respostas incorretas (strings).",
    millionnaire_prompt_example_json_title: "**Exemplo de JSON:**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "Quiz sobre a Revolução Francesa",
"questions": [
{
"question": "Qual é a capital da França?",
"goodanswer": "Paris",
"badanswer": ["Berlim", "Londres", "Madri"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Gere apenas o objeto JSON válido, sem qualquer comentário.",

    // Appariement Prompt
    appariement_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade do Moodle \"Correspondência\".",
    appariement_prompt_num_questions: "**Número de pares:** 10",
    appariement_prompt_mission: "**Sua missão:**",
    appariement_prompt_generate_json: "Gere um objeto JSON contendo um título e uma lista de **10 pares** para um jogo de correspondência.",
    appariement_prompt_important_rules_title: "**Regras importantes:**",
    appariement_prompt_rule1: "1.  O `title` deve ser um título relevante e envolvente para a atividade.",
    appariement_prompt_rule2: "2.  O array `pairs` deve conter 10 objetos, cada um com `question` (o item à esquerda) e `answer` (o item à direita a corresponder).",
    appariement_prompt_rule3: "3.  O conteúdo deve ser rigorosamente exato e pertinente ao tema e ao nível de ensino.",
    appariement_prompt_json_structure_title: "**Estrutura JSON esperada:**",
    appariement_prompt_main_object: "Um objeto principal com duas chaves:",
    appariement_prompt_title: "- `title`: O título da atividade (string).",
    appariement_prompt_pairs_array: "- `pairs`: Um array de 10 objetos, em que cada objeto representa um par e contém:",
    appariement_prompt_question: "- `question`: O termo ou a imagem à esquerda (string).",
    appariement_prompt_answer: "- `answer`: A definição ou o termo correspondente à direita (string).",
    appariement_prompt_example_json_title: "**Exemplo de JSON:**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Correspondência sobre a Revolução Francesa",
"pairs": [
{
"question": "Tomada da Bastilha",
"answer": "14 de julho de 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "Gere apenas o objeto JSON válido, sem nenhum comentário.",

    // QCM Prompt
    qcm_prompt_role: "Você é um especialista em design instrucional criando uma atividade Moodle \"MCQ\".",
    qcm_prompt_num_questions: "**Número de perguntas:** 10",
    qcm_prompt_mission: "**Sua missão:**",
    qcm_prompt_generate_json: "Gere um objeto JSON contendo um título e uma lista de **10 perguntas** para um MCQ.",
    qcm_prompt_important_rules_title: "**Regras importantes:**",
    qcm_prompt_rule1: "1.  O `title` deve ser um título relevante e envolvente para a atividade.",
    qcm_prompt_rule2: "2.  O array `questions` deve conter 10 objetos, cada um com `text` (o enunciado da pergunta) e um array `answers`.",
    qcm_prompt_rule3: "3.  Cada array `answers` deve conter várias respostas possíveis. Cada resposta é um objeto com `text` e `iscorrect` (1 para verdadeiro, 0 para falso). Dependendo do contexto da pergunta, você pode propor perguntas com uma única resposta correta ou com várias respostas corretas.",
    qcm_prompt_json_structure_title: "**Estrutura JSON esperada:**",
    qcm_prompt_main_object: "Um objeto principal com duas chaves:",
    qcm_prompt_title: "- `title`: O título da atividade (string).",
    qcm_prompt_questions_array: "- `questions`: Um array de 10 objetos, em que cada objeto representa uma pergunta e contém:",
    qcm_prompt_question_text: "- `text`: O enunciado da pergunta (string, pode conter HTML).",
    qcm_prompt_answers_array: "- `answers`: Um array de objetos, em que cada objeto representa uma resposta e contém:",
    qcm_prompt_answer_text: "- `text`: O texto da resposta (string, pode conter HTML).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 se a resposta for correta, 0 caso contrário.",
    qcm_prompt_example_json_title: "**Exemplo de JSON:**",
    qcm_prompt_example: `\`\`\`json
{
"title": "QCM sobre a Revolução Francesa",
"questions": [
{
"text": "<p>Qual é a data da Tomada da Bastilha?</p>",
"answers": [
{ "text": "<p>14 de julho de 1789</p>", "iscorrect": 1 },
{ "text": "<p>4 de agosto de 1789</p>", "iscorrect": 0 },
{ "text": "<p>26 de agosto de 1789</p>", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Gere apenas o objeto JSON válido, sem nenhum comentário.",

    // H5P Modules
    h5p_timeline_name: "Linha do tempo",
    h5p_timeline_description: "Crie uma linha do tempo interativa para apresentar uma sequência de eventos.",
    h5p_flashcards_name: "Flashcards",
    h5p_flashcards_description: "Crie cartões frente e verso para ajudar a memorizar termos e definições.",
    h5p_quiz_set_name: "Questionário",
    h5p_quiz_set_description: "Monte uma série de perguntas variadas (QCM, arrastar e soltar, etc.) para avaliar conhecimentos.",
    h5p_glossary_name: "Glossário",
    h5p_glossary_description: "Crie um glossário ou FAQ em formato acordeão.",
    h5p_crossword_name: "Palavras cruzadas",
    h5p_crossword_description: "Gere uma grelha de palavras cruzadas a partir de uma lista de termos e definições.",
    h5p_essay_name: "Redação",
    h5p_essay_description: "Proponha um tema de redação e defina palavras-chave para correção automatizada.",
    h5p_summary_name: "Resumo",
    h5p_summary_description: "Os alunos devem reconstruir um resumo correto escolhendo as frases certas.",
    h5p_drag_the_words_name: "Arrastar palavras",
    h5p_drag_the_words_description: "Crie um texto com lacunas em que os alunos devem arrastar as palavras em falta.",
    h5p_fill_in_the_blanks_name: "Preencher lacunas",
    h5p_fill_in_the_blanks_description: "Os alunos devem preencher diretamente no teclado as palavras em falta no texto.",
    h5p_mark_the_words_name: "Marcar palavras",
    h5p_mark_the_words_description: "Peça aos alunos que destaquem certas palavras num parágrafo.",
    h5p_true_false_name: "Questão Verdadeiro/Falso",
    h5p_true_false_description: "Crie perguntas simples com uma resposta binária: verdadeiro ou falso.",
    h5p_multiple_choice_name: "Múltipla Escolha",
    h5p_multiple_choice_description: "Crie perguntas de múltipla escolha com uma ou mais respostas corretas.",
    h5p_find_the_words_name: "Caça-palavras",
    h5p_find_the_words_description: "Crie uma grelha de letras onde os alunos devem encontrar palavras.",
    h5p_sort_the_paragraphs_name: "Ordenar os parágrafos",
    h5p_sort_the_paragraphs_description: "Crie um conjunto de parágrafos que os alunos devem ordenar corretamente.",
    h5p_single_choice_set_name: "Conjunto de escolha única",
    h5p_single_choice_set_description: "Crie uma série de perguntas em que cada pergunta tem apenas uma resposta correta.",
    h5p_dialog_cards_name: "Cartões de diálogo",
    h5p_dialog_cards_description: "Crie cartões interativos com texto e, opcionalmente, imagens em ambos os lados.",
    h5p_complex_fill_the_blanks_name: "Preencher lacunas complexo",
    h5p_complex_fill_the_blanks_description: "Crie um texto avançado de preenchimento de lacunas com feedback específico para cada erro.",
    h5p_chart_name: "Gráfico",
    h5p_chart_description: "Crie um gráfico de pizza ou de barras para visualizar dados.",

    // Moodle Modules
    moodle_xml_name: "Banco de perguntas (XML)",
    moodle_xml_description: "Gere um banco de 10 perguntas para uma atividade de Questionário prontas para serem importadas em formato XML.",
    moodle_xml_help: "Para adicionar um ficheiro XML numa atividade «Questionário» no Moodle, primeiro crie a atividade. Em seguida, abra o menu <strong>Mais</strong> e vá a <strong>Banco de perguntas</strong>. Nesse menu, clique em <strong>Importar</strong>, escolha o formato <strong>Moodle XML</strong>, selecione o seu ficheiro e confirme.",
    moodle_gift_name: "Formato GIFT",
    moodle_gift_description: "Crie perguntas no formato GIFT, uma forma simples de importar perguntas para o Moodle.",
    moodle_millionnaire_name: "Milionário",
    moodle_millionnaire_description: "Gere uma atividade única 'Milionário' com 6 perguntas de dificuldade crescente.",
    moodle_appariement_name: "Correspondência",
    moodle_appariement_description: "Gere uma atividade de correspondência com 10 questões.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Gere uma atividade MCQ simples.",

    moodle_glossaire_xml_name: "Glossário (XML)",
    moodle_glossaire_xml_description: "Gere um glossário pronto para ser importado no formato XML.",

    // Dynamic content
    prompt_for_ia: "Prompt para a IA",
    copy_prompt: "📋 Copiar prompt",
    go_duck: "🦆 Aceder ao Duck.ai",
    go_mistral: "Ⓜ️ Aceder ao Le Chat",
    create_h5p_file: "Criar ficheiro H5P",
    integrate_h5p_libraries: "Integrar bibliotecas H5P:",
    paste_ia_result: "Cole o resultado da IA na área abaixo para criar o seu módulo.",
    generate_h5p: "Gerar H5P",
    create_xml_file: "Criar ficheiro XML",
    paste_ia_result_xml: "Cole abaixo o XML gerado pela IA.",
    generate_xml_file: "Gerar ficheiro XML",

    create_mbz_file_appariement: "Criar o arquivo Correspondência (.mbz)",
    paste_ia_result_appariement: "Cole abaixo o JSON gerado pela IA. O título da atividade será extraído automaticamente do JSON.",
    generate_mbz_appariement: "Gerar a atividade Correspondência (mbz)",
    create_mbz_file_millionnaire: "Criar o arquivo Milionário (.mbz)",
    paste_ia_result_millionnaire: "Cole abaixo o JSON gerado pela IA. O título da atividade será extraído automaticamente do JSON.",
    generate_mbz_millionnaire: "Gerar a atividade Milionário (mbz)",

    create_mbz_file_qcm: "Criar ficheiro MCQ (.mbz)",
    paste_ia_result_qcm: "Cole abaixo o JSON gerado pela IA. O título da atividade será extraído automaticamente do JSON.",
    generate_mbz_qcm: "Gerar atividade MCQ (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "O XML do Moodle aparecerá aqui...",
    paste_xml_placeholder: "Cole aqui o XML completo gerado pela IA...",

    // H5P empty text fields
    generate_prompts_placeholder: "O prompt para a IA aparecerá aqui assim que clicar em 'Gerar prompts'.",
    paste_json_or_text: "Cole aqui o conteúdo JSON ou o texto gerado pela IA para criar a sua atividade.",

    // Notifications
    prompts_generated_successfully: "Prompts gerados com sucesso!",
    error_please_fill_fields: "Preencha todos os campos do modo simples.",
    error_please_fill_guided_fields: "Preencha todos os campos do modo guiado.",
    error_field_empty: "O campo está vazio. Primeiro gere um prompt.",
    error_copy_failed: "Falha ao copiar.",
    error_h5p_module_not_found: "Módulo '{moduleKey}' não encontrado.",
    error_invalid_quiz_json: "O JSON do Questionário é inválido: {errorMessage}",
    error_invalid_json: "O JSON fornecido é inválido. Erro: {errorMessage}",
    error_h5p_creation: "Erro na criação do H5P: {errorMessage}",
    error_paste_ia_content: "Cole o conteúdo gerado pela IA.",
    error_compression_module_not_ready: "O módulo de compressão não está pronto. Tente novamente dentro de instantes.",
    h5p_file_generated_successfully: "Ficheiro {fileName} gerado com sucesso!",
    h5p_creation_failed: "Falha na criação do ficheiro H5P: {errorMessage}",
    license_info: "GNU GPL v3.0 ou posterior",

    // Notifications for JSON content
    error_paste_json_content: "Por favor, cole o conteúdo JSON gerado.",
    error_paste_xml_content: "Por favor, cole o conteúdo XML gerado.",

    // Flashcards specific UI translations
    flashcards_progress_text: "Cartão @card de @total",
    flashcards_next: "Próximo",
    flashcards_previous: "Anterior",
    flashcards_check_answer: "Verificar",
    flashcards_your_answer: "Sua resposta",
    flashcards_correct_answer: "Correto",
    flashcards_incorrect_answer: "Incorreto",
    flashcards_show_solution: "Resposta correta",
    flashcards_results: "Resultados",
    flashcards_of_correct: "@score de @total corretas",
    flashcards_show_results: "Mostrar resultados",
    flashcards_answer_short: "R:",
    flashcards_retry: "Tentar novamente",
    flashcards_card_announcement: "Resposta incorreta. A resposta correta era @answer",
    flashcards_correct_announcement: "@answer está correto.",
    flashcards_page_announcement: "Página @current de @total",

    ticket: "Ticket",
    legal_mentions: "Menções legais",

    // Legal Mentions
    legal_title: "Menções legais",
    legal_editor_title: "Editor da aplicação",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Função: Professor de Escola Secundária Profissional de Letras-História",
    legal_editor_gauthier_remande_email: "Email: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Endereço: 39 avenue de Chanzy, 53000 Laval, França",
    legal_editor_gauthier_remande_phone: "Telefone: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Função: Professor de matemática e responsável pela missão DRANE – Academia de Grenoble",
    legal_editor_emmanuel_gaunard_email: "Email: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Endereço: 30 boulevard de la République, 38200 Vienne, França",
    legal_editor_emmanuel_gaunard_phone: "Telefone: +33 6 46 74 20 94",
    legal_app_description: "A aplicação web «Caramel» é um projeto livre e não comercial para a criação de conteúdos H5P. Não é necessária qualquer conta, não são recolhidos dados pessoais e todas as interações ocorrem localmente no navegador.",
    legal_hosting_title: "Alojamento",
    legal_host_name: "<strong>Anfitrião</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>Nome da empresa</strong>: Ministério da Educação Nacional e da Juventude",
    legal_host_address: "<strong>Endereço</strong>: 110 rue de Grenelle, 75007 Paris, França",
    legal_host_phone: "<strong>Telefone</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Diretor de publicação",
    legal_publication_director_name: "Gauthier REMANDE e Emmanuel GAUNARD, como editores voluntários.",
    legal_terms_of_use_title: "Termos gerais de utilização",
    legal_terms_of_use_content: "Este site permite aos utilizadores gerar conteúdos H5P. A exibição é feita localmente, sem transmissão de dados do utilizador. O utilizador é o único responsável pela utilização que faz dos conteúdos gerados. A aplicação é oferecida gratuitamente, sem qualquer garantia de funcionamento ou resultado. O editor declina qualquer responsabilidade em caso de má interpretação dos conteúdos ou utilização inadequada.",
    legal_intellectual_property_title: "Propriedade intelectual",
    legal_intellectual_property_content: "Todos os códigos-fonte, elementos gráficos e conteúdos estão licenciados sob a licença livre GNU AGPLv3. A sua reutilização é permitida nos termos das respetivas licenças. Qualquer redistribuição ou modificação deve creditar os autores originais: Gauthier REMANDE e Emmanuel GAUNARD. As imagens utilizadas nos módulos H5P são recuperadas de H5P.org.",
    legal_personal_data_title: "Dados pessoais",
    legal_personal_data_content: "Nenhuns dados pessoais são recolhidos ou armazenados. Não são utilizados cookies de rastreamento. O histórico da sessão é armazenado no navegador local do utilizador (localStorage), sem transmissão. De acordo com o RGPD, nenhuma informação pessoal é transmitida ao editor ou a terceiros.",
    legal_accessibility_title: "Acessibilidade",
    legal_accessibility_content: "A aplicação foi concebida para ser compatível com a utilização em computador, incluindo os modos escuro/claro, a navegação por teclado e o alto contraste, dependendo dos temas. Está em curso uma melhoria contínua da acessibilidade, em conformidade com as recomendações do RGAA.",
    legal_applicable_law_title: "Lei aplicável",
    legal_applicable_law_content: "Este site está sujeito à lei francesa. Em caso de litígio, os tribunais competentes serão os da jurisdição de Lyon.",
    legal_external_libraries_title: "Bibliotecas externas utilizadas",
    legal_external_libraries_intro: "A aplicação Caramel utiliza várias bibliotecas de código aberto, sob as seguintes licenças:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licença: CC BY 4.0, SIL OFL 1.1, MIT): Fornece os ícones utilizados na interface para melhorar a navegação e a experiência visual.",
    legal_library_jszip: "<strong>JSZip</strong> (Licença: MIT ou GPLv3): Permite criar ficheiros .h5p comprimindo o conteúdo necessário num arquivo zip.",
    legal_library_clientzip: "<strong>client-zip</strong> (Licença: MIT): Outra biblioteca utilizada para a compressão de ficheiros, oferecendo uma alternativa de alto desempenho para gerar arquivos .h5p diretamente no navegador.",
    legal_library_fflate: "<strong>fflate</strong> (Licença: MIT): Biblioteca muito rápida para compressão e descompressão de dados, utilizada para criar arquivos .mbz para módulos Moodle.",
    legal_library_tarjs: "<strong>tar-js</strong> (Licença: MIT): Permite criar arquivos .tar, um passo necessário antes da compressão para formar ficheiros .mbz para módulos Moodle.",
    legal_library_ownership: "Cada biblioteca permanece propriedade dos seus respetivos autores e é utilizada de acordo com a(s) sua(s) licença(s).",

    // Essay specific UI translations
    essay_checkAnswer: "Verificar",
    essay_tryAgain: "Tentar novamente",
    essay_showSolution: "Mostrar solução",
    essay_feedbackHeader: "Feedback",
    essay_solutionTitle: "Solução de exemplo",
    remainingChars: "Caracteres restantes: @chars",
    notEnoughChars: "Deve introduzir pelo menos @chars caracteres!",
    messageSave: "guardado",
    placeholderText: "Comece a escrever aqui...",
    ariaYourResult: "Obteve @score em @total pontos",
    ariaNavigatedToSolution: "Navegou para a solução de exemplo recém-incluída após a área de texto.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "O seu trabalho é um bom começo. Continue a explorar o tema para enriquecer as suas ideias.",
    essay_overall_feedback_11_30: "Você lançou bases interessantes. Ao aprofundar certos pontos, o seu trabalho ganhará em precisão.",
    essay_overall_feedback_31_50: "A sua compreensão do assunto está bem encaminhada. Considere desenvolver mais os seus argumentos para fortalecer o seu ponto de vista.",
    essay_overall_feedback_51_70: "Este é um bom trabalho. Você demonstra um bom domínio do assunto. Mais alguns detalhes poderiam ainda melhorá-lo.",
    essay_overall_feedback_71_90: "Muito bom trabalho! A sua análise é pertinente e bem estruturada. Você demonstra uma excelente compreensão.",
    essay_overall_feedback_91_100: "Excelente trabalho! A sua reflexão é aprofundada, bem argumentada e demonstra um domínio completo do assunto.",

    // True/False Question
    true_false_prompt_role: "Você é um especialista em design instrucional criando uma questão de Verdadeiro/Falso para uma atividade H5P.",
    true_false_prompt_mission: "Sua missão é gerar um objeto JSON para uma questão de Verdadeiro/Falso.",
    true_false_prompt_generate_json: "Gere um objeto JSON com base na seguinte estrutura:",
    true_false_prompt_json_structure_title: "--- ESTRUTURA JSON ESPERADA ---",
    true_false_prompt_json_structure_main_object: "O objeto principal deve conter as seguintes chaves:",
    true_false_prompt_question: "`question`: (string) A afirmação a ser avaliada. Pode conter HTML.",
    true_false_prompt_correct: "`correct`: (string) A resposta correta, \"true\" ou \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Comentário exibido se a resposta estiver correta.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Comentário exibido se a resposta estiver incorreta.",
    true_false_prompt_content_rules_title: "--- REGRAS DE CONTEÚDO ---",
    true_false_prompt_rule1: "A pergunta deve ser uma afirmação clara.",
    true_false_prompt_rule2: "O valor de `correct` deve ser uma string: \"true\" ou \"false\".",
    true_false_prompt_example_json_title: "--- EXEMPLO DE JSON ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "<p>Oslo é a capital da Noruega.</p>",
"correct": "true",
"feedbackOnCorrect": "Resposta correta! Oslo é de facto a capital da Noruega.",
"feedbackOnWrong": "Resposta errada. A capital da Noruega é Oslo."
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "Quero que você gere apenas o JSON, sem comentários ou texto introdutório.",
    true_false_true_text: "Verdadeiro",
    true_false_false_text: "Falso",
    true_false_score: "Você obteve @score de @total pontos",
    true_false_check_answer: "Verificar",
    true_false_show_solution_button: "Mostrar solução",
    true_false_try_again: "Tentar novamente",
    true_false_wrong_answer_message: "Resposta errada",
    true_false_correct_answer_message: "Resposta correta",
    true_false_score_bar_label: "Você obteve :num de :total pontos",
    true_false_submit_answer: "Enviar",
    true_false_a11y_check: "Verifique as respostas. As respostas serão marcadas como corretas, incorretas ou não respondidas.",
    true_false_a11y_show_solution: "Mostre a solução. A tarefa será marcada com a sua solução correta.",
    true_false_a11y_retry: "Tente a tarefa novamente. Redefina todas as respostas e comece a tarefa novamente.",
    true_false_finish_header: "Terminar?",
    true_false_finish_body: "Tem certeza de que deseja terminar?",
    true_false_cancel_label: "Cancelar",
    true_false_finish_label: "Terminar",
    true_false_retry_header: "Tentar novamente?",
    true_false_retry_body: "Tem certeza de que deseja tentar novamente?",
    true_false_retry_confirm_label: "Confirmar",

    // Multiple Choice UI translations
    checkAnswerButton: "Verificar",
    showSolutionButton: "Mostrar solução",
    tryAgainButton: "Tentar novamente",
    submitAnswerButton: "Enviar",
    scoreBarLabel: "Você obteve :num de :total pontos",
    confirmCheckHeader: "Terminar?",
    confirmCheckBody: "Tem certeza de que deseja terminar?",
    confirmCheckCancelLabel: "Cancelar",
    confirmCheckConfirmLabel: "Terminar",
    confirmRetryHeader: "Tentar novamente?",
    confirmRetryBody: "Tem certeza de que deseja tentar novamente?",
    confirmRetryCancelLabel: "Cancelar",
    confirmRetryConfirmLabel: "Confirmar",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Múltipla Escolha\".",
    multiple_choice_prompt_mission: "**Sua missão:**",
    multiple_choice_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P de Múltipla Escolha.",
    multiple_choice_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    multiple_choice_prompt_json_structure_main_object: "O objeto deve conter:",
    multiple_choice_prompt_question: "`question`: A pergunta a ser feita (formato HTML).",
    multiple_choice_prompt_answers_array: "`answers`: Um array de objetos, cada um representando uma resposta.",
    multiple_choice_prompt_text: "`text`: O texto da resposta (formato HTML).",
    multiple_choice_prompt_correct: "`correct`: Um booleano (`true` ou `false`) indicando se é a resposta correta.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa.",
    multiple_choice_prompt_content_rules_title: "**Regras para o conteúdo:**",
    multiple_choice_prompt_rule1: "1.  Deve haver apenas uma resposta correta (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Forneça várias respostas incorretas (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Exemplo de JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "<p>Qual é a cor real da groselha-preta (cassis)?</p>",
"answers": [
{
"correct": true,
"text": "<div>Roxo muito escuro</div>"
},
{
"correct": false,
"text": "<div>Azul</div>"
},
{
"correct": false,
"text": "<div>Preto</div>"
}
]
}
\`\`\` `,
   multiple_choice_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // Find the Words UI translations
    check: "Verificar",
    tryAgain: "Tentar novamente",
    showSolution: "Mostrar solução",
    found: "@found de @totalWords palavras encontradas",
    timeSpent: "Tempo gasto",
    score: "Você obteve @score de @total pontos",
    wordListHeader: "Lista de palavras",

    // Find the Words Prompt
    find_the_words_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Caça-palavras\".",
    find_the_words_prompt_mission: "**Sua missão:**",
    find_the_words_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P de Caça-palavras.",
    find_the_words_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    find_the_words_prompt_json_structure_main_object: "O objeto deve conter:",
    find_the_words_prompt_task_description: "`taskDescription`: Instruções claras para a atividade.",
    find_the_words_prompt_word_list: "`wordList`: Uma string de palavras a encontrar, separadas por vírgulas sem espaços.",
    find_the_words_prompt_content_rules_title: "**Regras para o conteúdo:**",
    find_the_words_prompt_rule1: "1.  A `wordList` deve ser uma única string com palavras separadas por vírgulas.",
    find_the_words_prompt_example_json_title: "**Exemplo de JSON:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Encontra os nomes das cidades na grelha abaixo",
"wordList": "Camberra,Minsk,Pequim,Oslo,Paris,Londres,Madrid,Atenas,Tóquio,Moscovo,Washington,Estocolmo"
}
\`\`\` `,
   find_the_words_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",
    fillPool: "abcdefghijklmnopqrstuvwxyzçãõéáíóúâêô",

    // Sort the Paragraphs UI translations
    checkAnswer: "Verificar",
    submitAnswer: "Enviar",
    up: "Cima",
    down: "Baixo",
    disabled: "Desativado",
    a11y_yourResult: "Você obteve @score de @total pontos",
    a11y_paragraph: "Parágrafo",
    a11y_correct: "correto",
    a11y_wrong: "errado",
    a11y_point: "@score ponto",
    a11y_sevenOfNine: "@current de @total",
    a11y_currentPosition: "Posição atual na lista",
    a11y_instructionsSelected: "Pressione a barra de espaço para reordenar",
    a11y_instructionsGrabbed: "Pressione as setas para cima e para baixo para mudar de posição, a barra de espaço para soltar, escape para cancelar",
    a11y_grabbed: "Agarrado",
    a11y_moved: "Movido",
    a11y_dropped: "Solto",
    a11y_reorderCancelled: "Reordenação cancelada",
    a11y_finalPosition: "Posição final",
    a11y_nextParagraph: "Próximo parágrafo",
    a11y_correctParagraph: "Parágrafo correto na posição",
    a11y_listDescription: "Lista de parágrafos ordenáveis.",
    a11y_listDescriptionCheckAnswer: "Lista de parágrafos com resultados.",
    a11y_listDescriptionShowSolution: "Lista de parágrafos com soluções.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Ordenar os parágrafos\".",
    sort_the_paragraphs_prompt_mission: "**Sua missão:**",
    sort_the_paragraphs_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P de ordenação de parágrafos.",
    sort_the_paragraphs_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "O objeto deve conter:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Instruções claras para a atividade.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Um array de strings, cada uma representando um parágrafo a ser ordenado. Os parágrafos devem estar na ordem correta.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa.",
    sort_the_paragraphs_prompt_content_rules_title: "**Regras para o conteúdo:**",
    sort_the_paragraphs_prompt_rule1: "1.  O array `paragraphs` deve conter uma lista de parágrafos na ordem lógica correta.",
    sort_the_paragraphs_prompt_example_json_title: "**Exemplo de JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "<p>A minha rotina da manhã:</p>",
"paragraphs": [
"<p>Primeiro, acordo às 7h30</p>",
"<p>Depois, visto-me</p>",
"<p>Em seguida, tomo o pequeno-almoço</p>",
"<p>Depois, escovo os dentes</p>",
"<p>Finalmente, vou para a escola</p>"
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Mostrar solução",
    retryButtonLabel: "Tentar novamente",
    solutionViewTitle: "Solução",
    correctText: "Correto!",
    incorrectText: "Incorreto!",
    muteButtonLabel: "Silenciar",
    closeButtonLabel: "Fechar",
    slideOfTotal: "Diapositivo @slide de @total",
    nextButtonLabel: "Próximo",
    solutionListQuestionNumber: "Pergunta @question",
    a11yShowSolution: "Mostre a solução. A tarefa será marcada com a sua solução correta.",
    a11yRetry: "Tente a tarefa novamente. Redefina todas as respostas e comece a tarefa novamente.",
    shouldSelect: "Deve selecionar",
    shouldNotSelect: "Não deve selecionar",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Conjunto de escolha única\".",
    single_choice_set_prompt_mission: "**Sua missão:**",
    single_choice_set_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P do tipo Conjunto de escolha única.",
    single_choice_set_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    single_choice_set_prompt_json_structure_main_object: "O objeto deve conter:",
    single_choice_set_prompt_choices_array: "`choices`: Um array de objetos, em que cada objeto representa uma pergunta e contém:",
    single_choice_set_prompt_question: "`question`: A pergunta a ser feita.",
    single_choice_set_prompt_answers_array: "`answers`: Um array de strings. A primeira string é sempre a resposta correta.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: Um array de 6 objetos para o feedback final, com pontuações de 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. O texto (`feedback`) deve ser benevolente, gradual e sempre formulado de forma afirmativa.",
    single_choice_set_prompt_content_rules_title: "**Regras para o conteúdo:**",
    single_choice_set_prompt_rule1: "1. Em cada array `answers`, a primeira resposta é sempre a correta.",
    single_choice_set_prompt_example_json_title: "**Exemplo de JSON:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "As bagas de goji também são conhecidas como ...",
"answers": ["Bagas de lobo", "Bagas de gato", "Bagas de urso"]
},
{
"question": "As bagas de goji são nativas de ...",
"answers": ["Ásia", "África", "Europa"]
}
],
"overallFeedback": [
{"from": 0, "to": 100, "feedback": "Acertaste :numcorrect de :maxscore"}
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // Dialog Cards UI translations
    answer: "Virar",
    next: "Próximo",
    prev: "Anterior",
    retry: "Tentar novamente",
    progressText: "Cartão @card de @total",
    cardFrontLabel: "Frente do cartão",
    cardBackLabel: "Verso do cartão",
    tipButtonLabel: "Mostrar dica",
    audioNotSupported: "O seu navegador não suporta este áudio",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "Você é um especialista em engenharia pedagógica criando uma atividade H5P \"Cartões de diálogo\".",
    dialog_cards_prompt_mission: "**Sua missão:**",
    dialog_cards_prompt_generate_json: "Gere um objeto JSON contendo apenas as chaves `title`, `description` e `dialogs` para uma atividade H5P do tipo Cartões de diálogo.",
    dialog_cards_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    dialog_cards_prompt_json_structure_main_object: "O objeto deve conter:",
    dialog_cards_prompt_title: "`title`: Um título para a atividade (formato HTML).",
    dialog_cards_prompt_description: "`description`: Uma breve descrição ou instrução (formato HTML).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: Um array de ${nombreQuestions} objetos, cada um representando um cartão e contendo:",
    dialog_cards_prompt_text: "`text`: O texto na frente do cartão (formato HTML).",
    dialog_cards_prompt_answer: "`answer`: O texto no verso do cartão (formato HTML).",
    dialog_cards_prompt_tips: "`tips` (opcional): Um objeto para dicas. Se considerar pedagogicamente útil, adicione uma dica para a frente com a chave `front` e/ou para o verso com a chave `back`.",
    dialog_cards_prompt_content_rules_title: "**Regras para o conteúdo:**",
    dialog_cards_prompt_rule1: "1. Os textos da frente (`text`) e do verso (`answer`) devem ser claros e concisos. **Formate o conteúdo com HTML (<strong> para negrito, <em> para itálico) para melhorar a legibilidade e destacar informações importantes.**",
    dialog_cards_prompt_rule2: "2. Não adicione imagens ou sons.",
    dialog_cards_prompt_rule3: "",
    dialog_cards_prompt_example_json_title: "**Exemplo de JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "<p>Aprenda os nomes das frutas em francês</p>",
"description": "<p>Os nomes das frutas são apresentados em português. Vire os cartões para ver a tradução correta em francês.</p>",
"dialogs": [
{
"text": "<p style=\"text-align: center;\">Morangos</p>",
"answer": "<p style=\"text-align: center;\">Fraises</p>",
"image": {
"copyright": {
"license": "CC BY-SA",
"source": "https://commons.wikimedia.org/wiki/File:Bowl_of_Strawberries.jpg",
"author": "ShakataGaNai",
"title": "Bowl_of_Strawberries.jpg",
"version": "4.0"
},
"imageAltText": "Frutos vermelhos com folhas verdes"
},
"audio": [],
"tips": {}
},
{
"text": "<p style=\"text-align: center;\">Framboesas</p>",
"answer": "<p style=\"text-align: center;\">Framboises</p>",
"image": {
"copyright": {
"license": "CC BY",
"source": "https://commons.wikimedia.org/wiki/File:Summer_raspberries,_2008.jpg",
"title": "Summer_raspberries,_2008.jpg",
"author": "www.bluewaikiki.com",
"version": "4.0"
},
"imageAltText": "Bagas vermelhas"
},
"audio": [],
"tips": {}
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Gere apenas o código JSON válido contendo as chaves `title`, `description` e `dialogs`, sem qualquer comentário.",

    // Dialog Cards specific UI translations
    correctAnswer: "Acertei!",
    incorrectAnswer: "Errei",
    round: "Rodada @round",
    cardsLeft: "Cartas restantes: @number",
    nextRound: "Avançar para a rodada @round",
    startOver: "Começar de novo",
    showSummary: "Próximo",
    summary: "Resumo",
    summaryCardsRight: "Cartas que você acertou:",
    summaryCardsWrong: "Cartas que você errou:",
    summaryCardsNotShown: "Cartas no baralho não mostradas:",
    summaryOverallScore: "Pontuação geral",
    summaryCardsCompleted: "Cartas que você concluiu o aprendizado:",
    summaryCompletedRounds: "Rodadas concluídas:",
    summaryAllDone: "Muito bem! Você acertou todas as @cards cartas @max vezes seguidas!",
    confirmStartingOverHeader: "Começar de novo?",
    confirmStartingOverBody: "Todo o progresso será perdido. Tem certeza de que deseja começar de novo?",
    confirmStartingOverCancelLabel: "Cancelar",
    confirmStartingOverConfirmLabel: "Começar de novo",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "Você é um especialista em design instrucional criando uma atividade H5P \"Complex Fill the Blanks\".",
    complex_blanks_prompt_mission: "**Sua missão:**",
    complex_blanks_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P do tipo Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    complex_blanks_prompt_json_structure_main_object: "O objeto principal deve conter as chaves `content` e `overallFeedback`.",
    complex_blanks_prompt_task: "`task`: As instruções para o exercício (em HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: O texto contendo as lacunas, representadas por `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: Um array de objetos, um para cada lacuna, na ordem de aparição.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: A resposta correta (pode incluir alternativas com `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: Um array de objetos para erros comuns.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: O texto de um erro comum.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: O feedback específico para este erro (em HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: Um array para feedback geral com base na pontuação.",
    complex_blanks_prompt_content_rules_title: "**Regras para o conteúdo:**",
    complex_blanks_prompt_rule1: "1. O número de objetos em `blanksList` deve corresponder ao número de lacunas em `blanksText`.",
    complex_blanks_prompt_rule2: "2. Forneça erros comuns e feedback construtivo.",
    complex_blanks_prompt_rule3: "3. O texto e o feedback podem conter tags HTML simples como `<p>`, `<strong>`, `<em>`.",
    complex_blanks_prompt_example_json_title: "**Exemplo de JSON:**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Coloca os verbos no tempo correto. Vais receber feedback individual para erros típicos.</p>",
"blanksList": [
{
"correctAnswerText": "não fala",
"incorrectAnswersList": [
{
"incorrectAnswerText": "fala não",
"incorrectAnswerFeedback": "<div>Lembra-te que em português a negação vem antes do verbo <em>(falar)</em>.</div>"
},
{
"incorrectAnswerText": "não falamos",
"incorrectAnswerFeedback": "<div>Esqueceste-te de que o sujeito é terceira pessoa do singular <em>(ele)</em>.</div>"
}
]
}
],
"blanksText": "<p>Ele fala inglês mas (não / falar) ___________<strong>&nbsp;</strong>alemão.</p>"
},
"overallFeedback": [
{"from": 0, "to": 50, "feedback": "Tenta de novo!"},
{"from": 51, "to": 75, "feedback": "Está razoável!"},
{"from": 76, "to": 100, "feedback": "Bom trabalho!"
}
]
}
\`\`\` `,
    complex_blanks_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // Chart Prompt
    chart_prompt_role: "Você é um especialista em design instrucional criando uma atividade H5P \"Gráfico\".",
    chart_prompt_mission: "**Sua missão:**",
    chart_prompt_generate_json: "Gere um objeto JSON completo e válido para uma atividade H5P de Gráfico.",
    chart_prompt_json_structure_title: "**Estrutura de JSON esperada:**",
    chart_prompt_json_structure_main_object: "O objeto deve conter:",
    chart_prompt_graph_mode: "`graphMode`: Escolha o tipo de gráfico mais relevante, 'pieChart' (pizza) ou 'barChart' (barras), com base no contexto, a menos que seja instruído de outra forma.",
    chart_prompt_list_of_types: "`listOfTypes`: Um array de objetos, cada um representando um ponto de dados no gráfico.",
    chart_prompt_value: "`value`: O valor numérico do ponto de dados.",
    chart_prompt_color: "`color`: A cor do ponto de dados (código hexadecimal).",
    chart_prompt_font_color: "`fontColor`: A cor do texto para o ponto de dados (código hexadecimal).",
    chart_prompt_text: "`text`: O rótulo para o ponto de dados.",
    chart_prompt_figure_definition: "`figureDefinition`: Uma breve descrição do gráfico.",
    chart_prompt_content_rules_title: "**Regras para o conteúdo:**",
    chart_prompt_rule1: "1. Escolha cores contrastantes para uma boa legibilidade.",
    chart_prompt_rule2: "2. Os rótulos devem ser curtos e claros.",
    chart_prompt_rule3: "3. Se um valor for muito baixo em comparação com outros, prefira um 'barChart' para uma melhor visualização.",
    chart_prompt_example_json_title: "**Exemplo de JSON:**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Mirtilos"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Framboesas"}
],
"figureDefinition": "Gráfico"
}
\`\`\` `,
   chart_prompt_generate_only_json: "Gere apenas o código JSON válido, sem qualquer comentário.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Anterior",
    quiz_next_button: "Próximo",
    quiz_finish_button: "Terminar",
    quiz_submit_button: "Enviar",
    quiz_textual_progress: "Pergunta @current de @total",
    quiz_no_result_message: "Concluído",
    quiz_result_message: "Os seus resultados:",
    quiz_score_bar_label: "Obteve @finals de @totals pontos",
    quiz_solution_button_text: "Mostrar solução",
    quiz_retry_button_text: "Tentar novamente",
    quiz_finish_button_text: "Terminar",
    quiz_submit_button_text: "Enviar",
    quiz_feedback_available: "Feedback disponível",
    quiz_read_feedback: "Ler feedback",
    quiz_wrong_answer: "Resposta errada",
    quiz_correct_answer: "Resposta correta",
    quiz_should_check: "Deveria ter sido marcado",
    quiz_should_not_check: "Não deveria ter sido marcado",
    quiz_no_input: "Por favor, responda antes de ver a solução.",
    quiz_a11y_check: "Verifique as respostas. As respostas serão marcadas como corretas, incorretas ou não respondidas.",
    quiz_a11y_show_solution: "Mostre a solução. A tarefa será marcada com a sua solução correta.",
    quiz_a11y_retry: "Tente a tarefa novamente. Redefina todas as respostas e comece a tarefa novamente.",

    // Albert generation
    generate_with_albert: "Gerar com Albert",
    generation_in_progress: "Geração em andamento, por favor aguarde...",
    request_sent_to_ia: "Pedido enviado à IA, por favor aguarde...",
    generation_successful: "Conteúdo H5P gerado com sucesso!",
    generation_failed_empty: "A geração falhou. A resposta estava vazia.",
    generation_failed_error: "Erro durante a geração: {errorMessage}",

    // Albert models description
    albert_small_summary: "Rápido, simples, adequado para exercícios rápidos e estruturados.",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "Poderoso, matizado, ideal para tarefas complexas e redação.",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "Especializado, preciso, projetado para programação e código.",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "Modelo de origem:",
    albert_model_parameters: "Tamanho do modelo:",
    albert_model_parameters_small: "8 mil milhões de parâmetros",
    albert_model_parameters_large: "24 mil milhões de parâmetros",
    albert_model_parameters_code: "32,5 mil milhões de parâmetros",
    language: "Língua",
    tutorial: "Tutorial",

    // Prompt de Glossário XML
    glossaire_xml_prompt_role: "Você é um especialista em design instrucional e vai criar o conteúdo para um glossário.",
    glossaire_xml_prompt_mission: "**Sua missão:** Você deve gerar um objeto JSON simples contendo uma lista de termos para um glossário. Cada termo deve ter um conceito, uma definição e, se pertinente, uma lista de aliases.",
    glossaire_xml_prompt_structure_title: "**Estrutura JSON esperada:**",
    glossaire_xml_prompt_structure_rules: `
-   **Raiz:** Um objeto principal contendo duas chaves: \`name\` (o nome do glossário) e \`entries\` (um array de objetos).
-   **Cada objeto em \`entries\` deve conter:**
    -   \`concept\`: A palavra ou expressão a ser definida.
    -   \`definition\`: A definição clara e concisa.
    -   \`aliases\` (opcional): Um array de strings para sinônimos ou termos alternativos. Adicione esta chave apenas se existirem aliases relevantes.`,
    glossaire_xml_prompt_example_title: "**Exemplo de JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "O léxico da informação",
  "entries": [
    {
      "concept": "Jornalista",
      "definition": "Pessoa que coleta, verifica e divulga informações.",
      "aliases": ["Repórter", "Cronista"]
    },
    {
      "concept": "Fonte",
      "definition": "Origem de uma informação."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Gere apenas o código JSON válido, sem nenhum comentário.",
};