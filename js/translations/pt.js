const translations_pt = {
    subtitle: "Criação Assistida de Recursos e Atividades para Moodle e Éléa",
    help_button: "Ajuda",
    help_modal_title: "🚀 Guia completo do Caramel para docentes",
    help_modal_content: `
    <p>Bem-vindo(a) ao <strong>Caramel</strong>! Este guia foi feito para acompanhar você passo a passo, mesmo que esteja começando agora. Nosso objetivo é ajudar a criar atividades de aprendizagem interativas de forma simples e eficiente.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Descrever</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Escolher</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Gerar</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Baixar</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Comunidade</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> Nossa filosofia: você mantém o controle!</h4>
        <p>Com o Caramel, a IA é assistente, mas quem pilota é você. O controle é seu em todas as etapas:</p>
        <ul>
            <li><strong>Antes:</strong> Você define o enquadramento pedagógico preenchendo os campos de descrição.</li>
            <li><strong>Durante:</strong> Depois que a IA gera o conteúdo (código JSON), você pode editá-lo diretamente no editor.</li>
            <li><strong>Depois:</strong> Mesmo após baixar o arquivo, ainda pode abri-lo e editá-lo em outras ferramentas, se necessário.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Descreva sua necessidade: o ponto de partida</h4>
        <p>Tudo começa aqui. Quanto mais clara a descrição, mais pertinente o resultado. Duas opções:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Modo Rápido</span></h5>
            <p>Ideal para ir direto ao ponto. Preencha dois campos:</p>
            <ul>
                <li><strong>Quem é você?</strong> Seja direto(a). Não precisa frase completa. Exemplos: <em>Professor(a) de Matemática</em>, <em>Formador(a) acadêmico(a)</em>.</li>
                <li><strong>O que deseja abordar?</strong> O coração do pedido. Seja o mais completo possível. Inclua tema, nível e restrições. Ex.: <em>Introdução às frações para 6º ano, com exemplos concretos como dividir um bolo.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Modo avançado</span></h5>
            <p>Para um pedido mais estruturado, este modo oferece campos precisos:</p>
            <ul>
                <li><strong>Disciplina, Tema, Nível:</strong> Para definir o contexto.</li>
                <li><strong>Número de itens:</strong> Muito importante! Corresponde à quantidade de perguntas, datas na linha do tempo, palavras do glossário etc.</li>
                <li><strong>Informações complementares:</strong> Espaço para orientações específicas, restrições ou outros detalhes relevantes.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Ativar leitura de documento</span><br>
            Com esta opção, a geração se baseia no conteúdo que você fornece. Você pode <strong>copiar e colar um texto</strong> ou <strong>enviar um arquivo PDF</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacidade:</strong> Fique tranquilo(a): o processamento ocorre <strong>inteiramente no seu computador</strong>. Nenhum dado é enviado à Internet.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Escolha o tipo de atividade</h4>
        <p>Depois de descrever, as telhas de atividades ficam disponíveis. Clique na que melhor atende ao seu objetivo pedagógico.</p>
        <details>
            <summary><strong>Clique aqui para ver os detalhes das atividades disponíveis</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Atividades interativas em formato H5P. As marcadas com estrela <span class="feedback-star">*</span> incluem, por padrão, feedback detalhado em 6 faixas de pontuação.</p>
            <ul>
                <li><strong>Linha do tempo:</strong> Crie uma sequência interativa de eventos.</li>
                <li><strong>Flashcards:</strong> Crie cartões frente/verso para memorização.</li>
                <li><strong>Quiz (Question Set) <span class="feedback-star">*</span>:</strong> Conjunto de questões variadas (MCQ, arrastar-soltar etc.).</li>
                <li><strong>Glossário:</strong> Crie glossário ou FAQ em formato acordeão.</li>
                <li><strong>Palavras cruzadas <span class="feedback-star">*</span>:</strong> Gere uma grade de cruzadas a partir de definições.</li>
                <li><strong>Redação <span class="feedback-star">*</span>:</strong> Proponha um tema de escrita com correção automática por palavras-chave.</li>
                <li><strong>Resumo <span class="feedback-star">*</span>:</strong> Estudantes recompõem um resumo correto escolhendo frases certas.</li>
                <li><strong>Arrastar palavras <span class="feedback-star">*</span>:</strong> Texto em que as palavras faltantes são arrastadas.</li>
                <li><strong>Texto lacunado <span class="feedback-star">*</span>:</strong> Completar lacunas digitando as palavras.</li>
                <li><strong>Realçar palavras <span class="feedback-star">*</span>:</strong> Destacar palavras específicas no texto.</li>
                <li><strong>Verdadeiro/Falso:</strong> Perguntas binárias simples.</li>
                <li><strong>Múltipla escolha <span class="feedback-star">*</span>:</strong> MCQ com uma ou mais respostas corretas.</li>
                <li><strong>Caça-palavras:</strong> Grade de letras para encontrar palavras.</li>
                <li><strong>Ordenar parágrafos <span class="feedback-star">*</span>:</strong> Reordenar parágrafos na sequência correta.</li>
                <li><strong>Série de escolha única <span class="feedback-star">*</span>:</strong> Série com exatamente uma resposta correta por questão.</li>
                <li><strong>Cartões de diálogo:</strong> Cartões interativos frente/verso com texto e áudio.</li>
                <li><strong>Texto lacunado avançado <span class="feedback-star">*</span>:</strong> Cloze avançado com feedback específico por erro.</li>
                <li><strong>Gráfico:</strong> Crie gráfico de pizza ou barras para visualizar dados.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Teste (XML / GIFT):</strong> Gera um banco de questões (MCQ, correspondência etc.) para importar no Moodle.</li>
                <li><strong>MCQ (MBZ):</strong> Atividade de múltipla escolha simples e rápida.</li>
                <li><strong>Correspondência (MBZ):</strong> Jogo de associação de pares.</li>
                <li><strong>Milionário (MBZ):</strong> Quiz com dificuldade crescente.</li>
                <li><strong>Glossário (XML):</strong> Arquivo para importar uma lista de definições no glossário do Moodle.</li>
                <li><strong>Página (MBZ / HTML):</strong> Página de curso estruturada e formatada visivelmente para o Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Gerar e aprimorar o conteúdo</h4>
        <p>Após clicar em uma telha, abre-se uma janela. Aqui você interage com a IA.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Opção A: Gerar com um clique</h5>
            <p>A via rápida. Clique em <button class="help-btn-example-llm">Gerar com um clique</button> para a IA produzir o conteúdo e colocá-lo diretamente na área de resultados à direita. Você pode escolher diferentes modelos (rápido, poderoso...) pela setinha à direita do botão.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Opção B: Usar uma IA externa</h5>
            <p>Para controle máximo. O prompt (instrução para a IA) aparece à esquerda.</p>
            <ol>
                <li>Edite o prompt, se desejar.</li>
                <li>Utilize o botão <strong>Copiar o prompt</strong> e abra uma IA de acesso público à sua escolha num novo separador.</li>
                <li>Cole o prompt na IA, recupere a resposta e cole na área de resultados à direita no Caramel.</li>
            </ol>
            <p>Ícones úteis: <span class="help-badge-icon"><i class="fas fa-expand"></i> Tela cheia</span> e <span class="help-badge-icon"><i class="fas fa-lock"></i> Bloquear</span> para proteger o prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Baixar e integrar sua atividade</h4>
        <p>Quando o conteúdo estiver pronto, clique no botão de download (ex.: <button class="help-btn-example-download">Gerar o H5P</button>). Veja como integrar arquivos no Éléa/Moodle:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Atividades H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Método simples:</strong> Ative a edição no curso e arraste-solte o arquivo .h5p diretamente na seção desejada. Escolha "Ajouter une activité H5P" e finalize com o botão "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.png" alt="Tela para adicionar rapidamente uma atividade H5P" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Adicione a atividade H5P e clique em DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Método recomendado (para designers):</strong> Clique em "Adicionar atividade ou recurso", escolha "Conteúdo interativo (H5P)" e, no campo "Editor", selecione a aba "Téléverser" para continuar com "Téléverser un fichier". Finalize com "Utiliser", acrescente os elementos necessários e salve. Assim, a atividade será incluída quando você compartilhar o curso.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Página, Milionário, Correspondência, MCQ)</summary>
                <div class="import-content">
                    <p>Esse formato importa uma atividade completa para o curso.</p>
                    <ol>
                        <li>
                            <p>Abra o menu de edição localizado à direita da tela. Se estiver recolhido, use a pequena seta para exibi-lo.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;">
                                    <img src="images/tutoriels/elea-import-parcours-1.png" alt="Menu de edição aberto na coluna direita" style="width:75%;height:auto;">
                                    <figcaption><em>Menu de edição aberto.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;">
                                    <img src="images/tutoriels/elea-import-parcours-2.png" alt="Seta para expandir o painel de edição" style="width:75%;height:auto;">
                                    <figcaption><em>Expanda o painel se necessário.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Clique em "IMPORT/EXPORT" e depois em "Importer un parcours" no submenu.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.png" alt="Botão IMPORT/EXPORT no Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Selecione Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Arraste-solte o arquivo .mbz na área de importação e clique em "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.png" alt="Área para soltar o arquivo MBZ" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Solte o arquivo e confirme com IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>Finalize clicando em "CONTINUER" na última etapa: a atividade já está no curso.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Atividade de Glossário)</summary>
                <div class="import-content">
                    <p>Este formato permite importar uma lista de definições em um glossário Éléa/Moodle.</p>
                    <ol>
                        <li>
                            <p>Crie uma atividade de Glossário vazia no curso e abra-a.</p>
                        </li>
                        <li>
                            <p>Dentro do Glossário, clique no botão "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.png" alt="Botão IMPORTER DES ARTICLES no glossário" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Clique em IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Arraste e solte o arquivo .xml na área de importação e clique no botão "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.png" alt="Área de soltar para o arquivo XML do glossário" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Solte o arquivo e valide com ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Seus artigos foram detectados. Finalize clicando no botão "CONTINUER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.png" alt="Confirmação de artigos detectados" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Clique em CONTINUER para finalizar a importação.</em></figcaption>
                            </figure>
                        </li>
                        <li>A importação está concluída. Suas definições agora estão disponíveis no Glossário.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> e <span class="help-badge-file">.GIFT</span> (Atividade de Teste)</summary>
                <div class="import-content">
                    <p>Esses formatos importam questões no "Banco de questões".</p>
                    <ol>
                        <li>
                            <p>No seu curso Éléa, vá para a aba "Mais" e clique em "Banco de questões".</p>
                        </li>
                        <li>
                            <p>No menu suspenso onde "Questões" é exibido, selecione "Importar".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.png" alt="Seleção do botão Importar no banco de questões" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Selecione Importar no menu suspenso.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Selecione o formato correspondente ao seu arquivo:</p>
                            <ul>
                                <li><strong>Formato Moodle XML</strong> (recomendado): formato completo que suporta todos os tipos de questões.</li>
                                <li><strong>Formato GIFT</strong>: alternativa mais simples, mas limitada em tipos de questões.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.png" alt="Escolha entre Formato Moodle XML e Formato GIFT" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Selecione o formato adequado ao seu arquivo.</em></figcaption>
                            </figure>
                        </li>
                        <li>Arraste e solte o seu arquivo na área de upload.</li>
                        <li>Clique no botão "IMPORTATION". A tela exibirá as questões adicionadas (por exemplo: 10 questões foram adicionadas).</li>
                        <li>Finalize clicando em "CONTINUER" na parte inferior da página.</li>
                        <li>As questões estão agora prontas para serem adicionadas a uma atividade de Teste. Consulte o <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">tutorial do Éléa</a> para criar uma atividade de Teste e carregar questões do banco.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternativa para a atividade Página)</summary>
                <div class="import-content">
                    <p>Para controle manual do conteúdo.</p>
                    <ol>
                        <li>Abra o .html com um editor de texto (ex.: Bloco de notas) e copie todo o conteúdo.</li>
                        <li>No Éléa, adicione a atividade “Página”.</li>
                        <li>No editor da página, clique no ícone para alternar para o modo HTML (geralmente representado por "&lt;&gt;").</li>
                        <li>Cole o conteúdo copiado e salve.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Comunidade & Suporte</h4>
        <p>O Caramel é um projeto vivo, e sua opinião é valiosa!</p>
        <ul>
            <li><strong>Conversar & Tirar dúvidas:</strong> Participe da sala no <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> para interagir com a comunidade.</li>
            <li><strong>Reportar bug:</strong> Problema? Abra um <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">issue</a>. Se possível, anexe o JSON que causou o erro: ajuda muito a corrigir.</li>
            <li><strong>Apoiar o projeto:</strong> Se curtir a ferramenta, deixe uma estrela na <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">página da Forge</a>. É a nossa melhor recompensa!</li>
        </ul>
    </div>
    `,
    fast_mode: "Modo Rápido",
    guided_mode: "Modo avançado",
    who_are_you: "Quem é você? (ex.: Professor, formador...)",
    what_to_address: "O que deseja abordar? (ex.: A natureza de um ângulo no 6.º ano...)",
    discipline: "Disciplina (ex.: História)",
    theme: "Tema (ex.: A Revolução Francesa)",
    level: "Nível (ex.: Secundário profissional – 10.º ano)",
    number_of_elements: "Número de elementos (ex.: 10)",
    additional_info: "Informações complementares...",
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
    timeline_prompt_rule1_text: "-   `text`: Descrição do texto. Use `*palavra*` para negrito, `**palavra**` para itálico e `\\n` para quebras de linha.",
    timeline_prompt_rule1_asset: "-   `asset`: Objeto opcional com uma imagem ilustrativa do evento.",
    timeline_prompt_rule1_tag: "- `tag`: Uma palavra-chave que caracteriza o período (ex: 'história', 'ciência').",
    timeline_prompt_rule2: "2.  Para cada `asset`, pesquise ativamente por uma imagem relevante e livre de royalties (ex: Wikimedia Commons). O URL em `media` deve ser um link direto e válido. Forneça a fonte e a licença em `credit`. Se nenhuma imagem adequada for encontrada, omita completamente o objeto `asset`.",
    timeline_prompt_rule3: "3.  Para cada período (`era`), adicione um campo `text` com uma breve descrição e um `tag`.",
    timeline_prompt_example_json_title: "**Exemplo de estrutura JSON:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Título da linha do tempo",
"text": "Introdução ao tema da linha do tempo.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Início da Primeira Guerra Mundial",
"text": "O Império Austro-Húngaro declara guerra à Sérvia.",
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
"text": "Assinatura do armistício em Rethondes, marcando o fim dos combates.",
"tag": "Tratado"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Primeira Guerra Mundial",
"text": "É o período da Grande Guerra.",
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
    crossword_prompt_clue: "`clue`: A definição correspondente. É proibido escrever a palavra-alvo na dica.",
    crossword_prompt_extra_clue_optional: "`extraClue` (opcional): Objeto contendo uma dica adicional. O texto da dica pode usar `*palavra*` para negrito, `**palavra**` para itálico e `\\n` para quebras de linha. A IA deve avaliar a pertinência de adicioná-la.",
    crossword_prompt_task_description: "`taskDescription`: Uma instrução clara e contextualizada. Use `*palavra*` para negrito, `**palavra**` para itálico e `\\n` para quebras de linha. Após uma quebra de linha, especifique a regra para compostos: \"Escreva palavras compostas como uma única palavra, sem espaços nem hífens.\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",
    crossword_prompt_content_rules_title: "**Regras de conteúdo:**",
    crossword_prompt_rule1: "1.  REGRA ESTRITA: As respostas (`answer`) devem conter apenas letras. Qualquer palavra composta, acrônimo ou expressão deve ser fundida em uma única palavra, sem espaços, hífens ou outros caracteres.",
    crossword_prompt_rule2: "2.  As definições (`clue`) devem ser curtas e precisas.",
    crossword_prompt_rule3: "3.  O restante da estrutura JSON (comportamento, tema etc.) deve ser mantido como está.",
    crossword_prompt_example_json_title: "**Exemplo de JSON para uma palavra:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Palavras cruzadas de Biologia",
"words": [
{
"answer": "Célula",
"clue": "Unidade básica da vida.",
"extraClue": {
"params": {
"text": "Pode ser *animal* ou *vegetal*."
}
}
},
{
"answer": "DNA",
"clue": "Molécula que carrega a informação genética."
}
],
"taskDescription": "*Complete* as **palavras cruzadas**."
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
    essay_prompt_task_description: "`taskDescription`: Uma instrução clara convidando o aluno a redigir um texto sobre o tema. Use `*palavra*` para negrito, `**palavra**` para itálico e `\\n` para quebras de linha.",
    essay_prompt_keywords_array: "`keywords`: Um array com ${nombreQuestions} objetos, cada um definindo uma palavra-chave que o sistema deverá encontrar na resposta do aluno.",
    essay_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",
    essay_prompt_content_rules_title: "**Regras para o conteúdo:**",
    essay_prompt_rule1: "1.  Cada objeto em `keywords` deve conter a chave `keyword` com a palavra a ser encontrada.",
    essay_prompt_rule2: "2.  As palavras-chave devem ser pertinentes e essenciais para avaliar a compreensão do tema.",
    essay_prompt_rule3: "3.  A estrutura JSON (comportamento etc.) deve ser mantida.",
    essay_prompt_rule4: "4. A instrução (`taskDescription`) deve incentivar a escrita sem usar as palavras-chave listadas em `keywords`, exceto o nome do tema, se necessário para a compreensão.",
    essay_prompt_example_json_title: "**Exemplo de JSON para uma palavra-chave:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "Escreve um texto curto explicando a fotossíntese.",
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

    // Prompt Moodle XML
    moodle_xml_prompt_role: "Você é especialista em design instrucional. Sua missão é criar o conteúdo de uma atividade Prova com seu banco de questões Moodle/Éléa gerando um objeto JSON válido.",
    moodle_xml_prompt_intro: "Quero criar um quiz com ${nombreQuestions} perguntas.",
    moodle_xml_prompt_content_title: "**Regras para o conteúdo:**",
    moodle_xml_prompt_content_rule1: "- As respostas incorretas devem ser plausíveis, porém erradas.",
    moodle_xml_prompt_content_rule2: "- A dificuldade das questões deve variar.",
    moodle_xml_prompt_content_rule3: "- A redação deve ser simples e precisa.",
    moodle_xml_prompt_content_rule4: "- O feedback deve explicar brevemente a resposta correta.",
    moodle_xml_prompt_question_types_intro: "**Estrutura JSON esperada:**\nO objeto principal deve conter as seguintes chaves:\n- `bank_name`: Um nome curto e descritivo para o banco de questões.\n- `bank_description`: Uma frase descrevendo o conteúdo do banco.\n- `questions`: Um array de objetos em que cada objeto representa uma questão e deve ter `type` e `content`.",
    moodle_xml_prompt_question_type_multichoice: `
- **Para o tipo \`multichoice\` (Múltipla escolha):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Título da questão",
      "questiontext": "Enunciado da questão.",
      "feedback": "Feedback geral.",
      "answers": [
        { "text": "Resposta 1", "fraction": 100, "feedback": "Feedback se escolhida." },
        { "text": "Resposta 2", "fraction": 0, "feedback": "Feedback se escolhida." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **Para o tipo \`matching\` (Correspondência):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Título da questão",
      "questiontext": "Enunciado da questão.",
      "feedback": "Feedback geral.",
      "subquestions": [
        { "text": "Texto da questão 1", "answer": "Resposta 1" },
        { "text": "Texto da questão 2", "answer": "Resposta 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **Para o tipo \`numerical\` (Numérica):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Título da questão",
      "questiontext": "Enunciado da questão.",
      "feedback": "Feedback geral.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "Feedback para a resposta." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **Para o tipo \`truefalse\` (Verdadeiro/Falso):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Título da questão",
      "questiontext": "Enunciado da questão.",
      "feedback": "Feedback geral.",
      "answer": { "value": true, "feedback_true": "Feedback se Verdadeiro.", "feedback_false": "Feedback se Falso." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **Para o tipo \`shortanswer\` (Resposta curta):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Título da questão",
      "questiontext": "Enunciado da questão.",
      "feedback": "Feedback geral.",
      "answers": [
        { "text": "Resposta exata 1", "fraction": 100, "feedback": "Feedback se escolhida." },
        { "text": "Resposta alternativa", "fraction": 100, "feedback": "Feedback se escolhida." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **Para o tipo \`cloze\` (Texto lacunado):**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Título da questão",
      "questiontext": "Este é um texto com uma lacuna {1:SHORTANSWER:=Resposta correta~Feedback} e outra {1:MULTICHOICE:=Resposta correta~Resposta errada}.",
      "feedback": "Feedback geral."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**Instruções finais:**",
    moodle_xml_prompt_form_rule1: "Distribua as questões de forma equilibrada entre os diferentes tipos.",
    moodle_xml_prompt_generate_only_json: "Gere apenas código JSON válido, sem comentários. O resultado deve ser um único objeto JSON contendo a chave `questions`.",

    // Criação de teste Éléa
    moodle_xml_success_generation: "Arquivo {fileName} gerado com sucesso!",
    test_error_creation_mbz: "Erro ao criar o MBZ para o teste:",
    test_success_generation: "Arquivo {fileName} gerado com sucesso!",
    test_error_generic: "Erro:",
    test_backup_log: "Backup criado automaticamente pelo Caramel\n",

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
    flashcards_prompt_role: "És um especialista em design instrucional a criar uma atividade H5P 'Flashcards'.",
    flashcards_prompt_mission: "**A tua missão:**",
    flashcards_prompt_generate_json: "Gera um objeto JSON completo e válido para uma atividade H5P do tipo Flashcards. O JSON deve ser utilizável diretamente.",
    flashcards_prompt_json_structure_title: "**Estrutura JSON esperada:**",
    flashcards_prompt_json_structure_main_object: "O objeto deve conter:",
    flashcards_prompt_title: "`title`: Um título pertinente para a atividade.",
    flashcards_prompt_description: "`description`: Uma instrução clara para o aluno.",
    flashcards_prompt_association_principle: "A frente e o verso devem estar ligados por um critério único e consistente (ex.: definição→termo, figura→número de lados, evento→data, autor→obra). Usa a mesma relação para todas as cartas e formula a consigna assim: «Associa cada X a Y». Respostas (`answer`) normalizadas: uma palavra simples ou um número, minúsculas, sem artigo nem pontuação; números em algarismos.",
    flashcards_prompt_cards_array: "`cards`: Um array de ${nombreQuestions} objetos, onde cada objeto representa uma carta e contém:",
    flashcards_prompt_text: "`text`: A pergunta ou termo a adivinhar (frente).",
    flashcards_prompt_answer: "`answer`: A resposta ou definição (verso). Importante: `answer` só pode conter uma palavra simples ou um número — não palavras compostas ou separadas.",
    flashcards_prompt_tip: "`tip` (opcional): Uma pista para ajudar o aluno se a pergunta for difícil. Adiciona uma pista apenas se for relevante.",
    flashcards_prompt_tip_formatting: "Para as pistas (`tip`), podes usar `*palavra*` para negrito e `**palavra**` para itálico para enfatizar informação importante.",
    flashcards_prompt_example_json_title: "**Exemplo de JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "As capitais da Europa",
"description": "Memoriza a capital de cada país. Clica no cartão para ver a resposta.",
"cards": [
{
"text": "A capital de França",
"answer": "Paris"
},
{
"text": "A capital dos Países Baixos",
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
    quiz_set_prompt_rule7: "7.  **Fórmulas matemáticas:** Para fórmulas matemáticas, use a notação LaTeX com duplo escape de barras invertidas. Envolva as fórmulas com \\( e \\). Exemplo: em vez de escrever ( (2^3)^2 ), escreva \\( (2^3)^2 \\). O mesmo para respostas: \\( 2^{12} \\) em vez de ( 2^{12} ).",
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
            "question": "A França é um país?",
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
            "question": "Qual é a capital da França?",
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
            "questions": ["Paris é a *capital* da França."],
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
            "taskDescription": "Qual é a capital da França?",
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
    glossary_prompt_content: "`text`: A definição. Use `*palavra*` para negrito, `**palavra**` para itálico e `\\n` para quebras de linha.",
    glossary_prompt_content_rules_title: "**Regras para o conteúdo:**",
    glossary_prompt_rule1: "1.  As definições devem ser claras, concisas e adequadas ao nível dos alunos.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Exemplo de JSON para uma entrada:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Fotossíntese",
"text": "Processo pelo qual as plantas verdes transformam a luz solar em energia."
},
{
"title": "Célula",
"text": "Unidade básica de todos os seres vivos."
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
    summary_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",
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
    drag_word_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",

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
    blanks_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",

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
    mark_words_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",
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

   // Criação de correspondências
   appariement_error_invalid_json: "A estrutura JSON é inválida. Certifique-se de que contenha um 'title' e um array 'pairs' em que cada par tenha uma 'question' e uma 'answer'.",
   appariement_activity_intro: "Encontre os pares correspondentes.",
   appariement_success_generation: "Arquivo {fileName} gerado com sucesso !",
   appariement_error_creation_mbz: "Erro ao criar o MBZ para a correspondência:",

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
"text": "Qual é a data da Tomada da Bastilha?",
"answers": [
{ "text": "14 de julho de 1789", "iscorrect": 1 },
{ "text": "4 de agosto de 1789", "iscorrect": 0 },
{ "text": "26 de agosto de 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Gere apenas o objeto JSON válido, sem nenhum comentário.",

    // Criação de questionário de múltipla escolha
    qcm_error_invalid_json: "A estrutura JSON é inválida. Certifique-se de que contenha um 'title' e um array 'questions' com pelo menos uma pergunta e respostas.",
    qcm_activity_intro: "Responda às seguintes perguntas.",
    qcm_success_generation: "Arquivo {fileName} gerado com sucesso !",
    qcm_error_creation_mbz: "Erro ao criar o MBZ para o questionário de múltipla escolha:",

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
    h5p_true_false_description: "Crie uma única pergunta simples com uma resposta binária: verdadeiro ou falso.",
    h5p_multiple_choice_name: "Múltipla Escolha",
    h5p_multiple_choice_description: "Crie uma única pergunta de múltipla escolha com uma ou mais respostas corretas.",
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
    moodle_xml_name: "Teste",
    moodle_xml_description: "Gere um banco de perguntas para importar diretamente para uma atividade de Teste (em formato xml ou gift)",
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

    elea_page_name: "Página",
    elea_page_description: "Criar uma página de conteúdo Éléa com formatação visual.",

    // Dynamic content
    prompt_for_ia: "Prompt para a IA",
    copy_prompt: "Copiar prompt",
    fullscreen_prompt: "Tela cheia",
    exit_fullscreen_prompt: "Sair da tela cheia",
    lock_prompt: "Bloquear o prompt",
    unlock_prompt: "Desbloquear o prompt",
    go_duck: "Aceder ao Duck.ai",
    go_mistral: "Aceder ao Le Chat",
    create_h5p_file: "Criar ficheiro H5P",
    integrate_h5p_libraries: "Integrar bibliotecas H5P:",
    paste_ia_result: "Cole o resultado da IA na área abaixo para criar o seu módulo.",
    generate_h5p: "Gerar H5P",
    create_xml_file: "Criar ficheiro XML",
    paste_ia_result_xml: "Cole abaixo o XML gerado pela IA.",
    generate_xml_file: "Gerar ficheiro XML",
    export_mbz: "Formato MBZ",
    export_gift: "Formato GIFT",
    export_xml: "Formato XML",
    export_html: "Formato HTML",

    create_mbz_file_appariement: "Criar o arquivo Correspondência (.mbz)",
    paste_ia_result_appariement: "Cole abaixo o JSON gerado pela IA. O título da atividade será extraído automaticamente do JSON.",
    generate_mbz_appariement: "Gerar a atividade Correspondência (mbz)",
    create_mbz_file_millionnaire: "Criar o arquivo Milionário (.mbz)",
    paste_ia_result_millionnaire: "Cole abaixo o JSON gerado pela IA. O título da atividade será extraído automaticamente do JSON.",
    generate_mbz_millionnaire: "Gerar a atividade Milionário (mbz)",
    generate_mbz_test: "Gerar a atividade Prova (mbz)",

    create_mbz_file_qcm: "Criar ficheiro MCQ (.mbz)",
    paste_ia_result_qcm: "Cole abaixo o JSON gerado pela IA. O título da atividade será extraído automaticamente do JSON.",
    generate_mbz_qcm: "Gerar atividade MCQ (mbz)",

    create_mbz_file_page: "Criar o arquivo Página (.mbz)",
    paste_ia_result_page: "Cole abaixo o JSON gerado pela IA para construir a página.",
    generate_mbz_page: "Gerar a atividade Página (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "O XML do Moodle aparecerá aqui...",
    paste_xml_placeholder: "Cole aqui o XML completo gerado pela IA...",

    // H5P empty text fields
    generate_prompts_placeholder: "O prompt para a IA aparecerá aqui assim que você preencher pelo menos um campo no modo Rápido ou no modo Avançado.",
    paste_json_or_text: "Cole aqui o conteúdo JSON ou o texto gerado pela IA para criar a sua atividade.",
    info_prompt_copy: "Não cole este prompt no painel direito. Copie-o para uma IA externa para obter o resultado e, em seguida, cole esse resultado no painel direito.",

    // Notifications
    caramel_success_title: "A sua guloseima está pronta!",
    prompts_generated_successfully: "Prompts gerados com sucesso!",
    success_copy: "✓ Copiado !",
    error_please_fill_fields: "Preencha pelo menos um campo no modo Rápido.",
    error_please_fill_guided_fields: "Preencha pelo menos um campo no modo Avançado.",
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
    legal_app_description: "A aplicação web «Caramel» é um projeto livre e não comercial, destinado à criação de conteúdos H5P e Éléa. Não é necessária conta e não são recolhidos dados pessoais.",
    legal_hosting_title: "Alojamento",
    legal_host_name: "<strong>Anfitrião</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>Nome da empresa</strong>: Ministério da Educação Nacional e da Juventude",
    legal_host_address: "<strong>Endereço</strong>: 110 rue de Grenelle, 75007 Paris, França",
    legal_host_phone: "<strong>Telefone</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Diretor de publicação",
    legal_publication_director_name: "Gauthier REMANDE e Emmanuel GAUNARD, como editores voluntários.",
    legal_terms_of_use_title: "Termos gerais de utilização",
    legal_terms_of_use_content: "Este site permite aos utilizadores gerar conteúdos H5P e Éléa. A visualização é feita localmente, sem transmissão de dados do utilizador. O utilizador é o único responsável pela forma como utiliza os conteúdos gerados. A aplicação é oferecida gratuitamente, sem qualquer garantia de funcionamento ou de resultado. O editor declina qualquer responsabilidade em caso de má interpretação dos conteúdos ou de utilização inadequada.",
    legal_intellectual_property_title: "Propriedade intelectual",
    legal_intellectual_property_content: "Todos os códigos-fonte, elementos gráficos e conteúdos estão licenciados sob a licença livre GNU AGPLv3. A sua reutilização é permitida nos termos das respetivas licenças. Qualquer redistribuição ou modificação deve creditar os autores originais: Gauthier REMANDE e Emmanuel GAUNARD. As imagens utilizadas nos módulos H5P são recuperadas de H5P.org.",
    legal_personal_data_title: "Dados pessoais",
    legal_personal_data_content: "Nenhum dado pessoal é recolhido nem armazenado. Não são usados cookies de rastreamento.",
    legal_ai_models_title: "Modelos de Inteligência Artificial",
    legal_ai_models_content: "A aplicação Caramel baseia‑se, apenas durante a geração com um clique, em modelos de IA operados pela ILAAS, uma federação de infraestruturas de IA partilhadas. Os pedidos são encaminhados por um workflow n8n alojado pela Incubadora e depois transmitidos à ILAAS para execução em servidores de confiança, alojados em data centers certificados pelo setor do Ensino Superior e Investigação (ESR). A Caramel não executa os modelos nem trata ou armazena dados por conta própria; os dados são usados exclusivamente para satisfazer o pedido e não são enviados para IAs públicas de consumo. Os modelos atualmente disponíveis incluem {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) e {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Qualquer alojamento, registo (logging) ou retenção efetuados pela ILAAS é regido pela sua política de privacidade e pelos seus termos de serviço.",
    legal_user_requests_processing_title: "Tratamento dos pedidos dos utilizadores via n8n e a Incubadora do Ministério da Educação Nacional",
    legal_user_requests_processing_content: "O nosso site utiliza uma solução técnica desenvolvida com o n8n, uma ferramenta open source alojada pela Incubadora do Ministério da Educação Nacional. Através de um fluxo de trabalho automatizado, este serviço transforma os pedidos dos utilizadores em dados estruturados (formato JSON) para interagir com uma inteligência artificial da DINUM, portanto soberana. Nenhuma informação sensível é exposta ou transmitida sem encriptação, garantindo a confidencialidade e a segurança das trocas.",
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
"question": "Oslo é a capital da Noruega.",
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
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",
    multiple_choice_prompt_content_rules_title: "**Regras para o conteúdo:**",
    multiple_choice_prompt_rule1: "1.  Deve haver apenas uma resposta correta (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Forneça várias respostas incorretas (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Exemplo de JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "Qual é a cor real da groselha-preta (cassis)?",
"answers": [
{
"correct": true,
"text": "Roxo muito escuro"
},
{
"correct": false,
"text": "Azul"
},
{
"correct": false,
"text": "Preto"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
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
    find_the_words_prompt_rule1: "1.  A `wordList` deve ser uma única string com as palavras separadas por vírgulas. Cada palavra deve ser simples (sem termos com várias palavras). São proibidos números, sinais de pontuação e letras com acentos/diacríticos (ex.: escrever 'eleve' em vez de 'élève').",
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
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Instruções claras para a atividade. Use `*palavra*` para negrito, `**palavra**` para itálico e `\\n` para quebras de linha.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Um array de strings, cada uma representando um parágrafo a ser ordenado. Os parágrafos devem estar na ordem correta. Use `*palavra*` para negrito, `**palavra**` para itálico.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",
    sort_the_paragraphs_prompt_content_rules_title: "**Regras para o conteúdo:**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` deve formar uma progressão lógica inferível pelo conteúdo, sem pistas artificiais (números, datas/horários, «primeiro/depois/por fim»), salvo pedido explícito.",
    sort_the_paragraphs_prompt_rule2: "2. Nada de lista plana: cada frase faz avançar o mesmo fio (causa→efeito, preparação→ação→resultado, geral→particular) para tornar a ordem dedutível.",
    sort_the_paragraphs_prompt_example_json_title: "**Exemplo de JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "A minha rotina da manhã:",
"paragraphs": [
  "Encho a chaleira com água fresca.",
  "Ligo-a.",
  "Coloco um saquinho de chá na xícara.",
  "Despejo a água a ferver sobre o saquinho.",
  "Retiro o saquinho quando a infusão estiver pronta."
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
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (REGRA ESTRITA) Você deve gerar obrigatoriamente um array com 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando rigorosamente as faixas 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Cada objeto deve ter o formato `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. O texto de `feedback` deve ser gentil, graduado e sempre afirmativo, sem exageros.",
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
    { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
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
    dialog_cards_prompt_example_json_title: "**Exemplo de JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "Aprenda os nomes das frutas em inglês",
"description": "Os nomes das frutas são apresentados em francês. Vire as cartas para ver a tradução correta em inglês.",
"dialogs": [
{
"title": "Encontre os verbos ingleses no presente",
"description": "A partir de uma frase em inglês no passado simples, encontre o verbo no infinitivo. Vire as cartas para conferir suas respostas.",
"dialogs": [
{
"text": "He *visited* his grandmother.",
"answer": "to *visit*",
"tips": {
"front": "Identifique o verbo no passado.",
"back": "Pense na forma básica (infinitivo) do verbo."
}
},
{
"text": "She *played* soccer.",
"answer": "to *play*",
"tips": {
"front": "Procure o verbo no passado.",
"back": "Imagine o verbo na forma de dicionário (infinitivo)."
}
}
]
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
    { "from": 0, "to": 10, "feedback": "Feedback para 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback para 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback para 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback para 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback para 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback para 91-100%" }
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

    // IA do Caramel — geração
    generate_with_llm: "Gerar com a IA do Caramel",
    generation_in_progress: "Geração em andamento, aguarde...",
    request_sent_to_ia: "Solicitação enviada à IA, aguarde...",
    generation_successful: "Conteúdo H5P gerado com sucesso!",
    generation_failed_empty: "A geração falhou. A resposta estava vazia.",
    generation_failed_error: "Erro durante a geração: {errorMessage}",
    generation_failed_llm: "A geração via IA do Caramel falhou. Causa: {errorMessage}",

    // Descrições dos modelos (IA do Caramel)
    llm_small_summary: "Caramelo macio: rápido, leve, perfeito para exercícios relâmpago e respostas sem espera. Consome pouco.",
    llm_large_summary: "Caramelo fluido: mais rico e mais matizado, ideal para tarefas que pedem um pouco de profundidade. Consome mais.",
    llm_xl_summary: "Caramelo duro: potente e complexo, reservado para projetos ambiciosos. Paciência necessária, resultado garantido! Consome muito mais.",

    // Nomes amigáveis dos modelos (exibição do menu)

    // Indicações dos modelos (IA do Caramel)
    llm_model_source: "Fornecedor do modelo:",
    llm_model_parameters: "Tamanho do modelo:",
    llm_model_parameters_unit: "Mrd parâmetros",

    language: "Língua",
    tutorial: "Tutorial",
    version_modal_title: "Nova versão disponível",
    version_modal_message: "Você está usando a versão {currentVersion}. Uma versão mais recente ({latestVersion}) já está online. Recarregue a página para obter as últimas melhorias.",
    version_modal_update: "Carregar a nova versão",
    version_modal_remind_later: "Lembrar mais tarde",

    // Prompt de Glossário XML
    glossaire_xml_prompt_role: "Você é um especialista em design instrucional e vai criar o conteúdo para um glossário.",
    glossaire_xml_prompt_mission: "**Sua missão:** Você deve gerar um objeto JSON simples contendo uma lista de termos para um glossário. Cada termo deve ter um conceito, uma definição e, se pertinente, uma lista de aliases.",
    glossaire_xml_prompt_structure_title: "**Estrutura JSON esperada:**",
    glossaire_xml_prompt_structure_rules: `
-   **Raiz:** Um objeto principal contendo duas chaves: \`name\` (o nome do glossário) e \`entries\` (um array de objetos).
-   **Cada objeto em \`entries\` deve conter:**
    -   \`concept\`: A palavra ou expressão a ser definida.
    -   \`definition\`: Uma definição clara e concisa. Use *mot* para negrito, **mot** para itálico e \\n para quebras de linha, apenas quando pedagogicamente pertinente.
    -   \`aliases\` (opcional): Um array de strings para sinônimos ou termos alternativos. Adicione esta chave apenas se existirem aliases relevantes.`,
    glossaire_xml_prompt_example_title: "**Exemplo de JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "O léxico da informação",
  "entries": [
    {
      "concept": "Jornalista",
      "definition": "Pessoa que **coleta**, verifica e difunde *informações*.",
      "aliases": ["Repórter", "Colunista"]
    },
    {
      "concept": "Fonte",
      "definition": "Origem de uma *informação*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Gere apenas o código JSON válido, sem nenhum comentário.",
  
    //Barre de menu
    tab_all: "Todos",
    tab_quiz: "Quiz & Testes",
    tab_text: "Manipulação de Texto",
    tab_memory: "Memorização & Descoberta",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 Obter o prompt",
    create_file_step: "2/2 Criar o ficheiro",
    generate_one_click: "Geração com um clique",
    simple_mode: "Simples",
    advanced_mode: "Guiado",

    // RAG feature
    activate_rag: "Ativar consulta de documentos",
    rag_tooltip: "Permite colar texto ou carregar um PDF. O conteúdo será usado como a principal fonte para gerar as atividades.",
    rag_title: "Anexar documentos (opcional)",
    rag_note: "Se desejar que a IA trabalhe exclusivamente a partir dos seus documentos, cole o seu texto ou largue os seus ficheiros aqui. Caso contrário, deixe esta área vazia para permitir que a IA procure informações por si própria.",
    upload_pdf: "Ou carregue um PDF para análise",
    pdf_loading: "Carregando PDF...",
    pdf_processing_page: "Processando página",
    ocr_recognizing_page: "Reconhecendo (OCR) página",
    ocr_success: "O documento foi processado com sucesso.",
    ocr_error: "Ocorreu um erro durante o processamento.",
    error_invalid_pdf: "Selecione um arquivo PDF válido.",
    error_duplicate_pdf: "Este ficheiro já foi adicionado.",
    error_fullscreen: "O modo de tela cheia falhou:",
    lock_text: "Bloquear",
    unlock_text: "Desbloquear",
    rag_instruction: "\n\nVocê só deve consultar as seguintes informações para gerar o conteúdo:",
    drag_drop_text: "Arraste e solte um arquivo PDF aqui",
    or_text: "ou",
    upload_pdf_btn: "Escolha um arquivo",
    paste_your_text_here: "Copie e cole seu texto aqui...",
    rag_tags_tuto: "Encontre abaixo os documentos enviados. Clique no círculo colorido para personalizar o realce de cada documento.",

    // Etapas da preparação do caramelo
    caramel_animation_step_1: "Deitamos o açúcar na panela...",
    caramel_animation_step_2: "Adicionamos um pouco de água...",
    caramel_animation_step_3: "Aquecemos em fogo médio...",
    caramel_animation_step_4: "O açúcar começa a derreter...",
    caramel_animation_step_5: "Começa a ganhar cor...",
    caramel_animation_step_6: "Mexemos suavemente...",
    caramel_animation_step_7: "O caramelo adquire uma bela cor âmbar...",
    caramel_animation_step_8: "Adicionamos o creme quente...",
    caramel_animation_step_9: "Cuidado com os salpicos!",
    caramel_animation_step_10: "Misturamos bem...",
    caramel_animation_step_11: "Está quase pronto!",

    // Prompt da Página
    page_prompt_role: "Você é um especialista em design instrucional que cria uma atividade Página, estruturada, para Éléa/Moodle.",
    page_prompt_mission: "**Sua missão :**",
    page_prompt_generate_json: "Gere um objeto JSON para construir uma página de conteúdo Éléa. A estrutura da página baseia-se em blocos predefinidos. Você deve selecionar, na lista abaixo, os blocos mais pertinentes para atender ao pedido do usuário.",
    page_prompt_json_structure_title: "**Estrutura JSON esperada :**",
    page_prompt_json_structure_main_object: "O objeto principal deve conter a chave \"title\" para o título da página, a chave \"intro\" para uma introdução clara e compreensível ao conteúdo do curso que se segue, e a chave \"blocks\", que é um array de objetos. Cada objeto representa um bloco de conteúdo e deve ter um \"type\" correspondente a um dos blocos abaixo, além de um objeto \"data\" contendo as informações específicas do bloco.",
    page_prompt_blocks_list_title: "**Lista de blocos disponíveis :**",
    page_prompt_block_01: "- `#01_hero_header`: Banner de abertura. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: Sumário com links internos. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: Marcos históricos em 3 cartões. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (máx. 3 cartões)",
    page_prompt_block_04: "- `#04_callout_set`: Banners Objetivos, Para saber, Alerta. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: Números-chave em cartões. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: Tabela de vocabulário. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: Glossário em chips. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: Cartões de monumentos com imagens. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: Duas imagens comparadas. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: Tabela de comparação. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: Caixa de Definição. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"Definição\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: Parágrafos do curso. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: Ficha detalhada. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: Perguntas frequentes. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: Mitos vs Realidades. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"Mitos\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"Realidades\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: Método para descrever uma imagem. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: Webografia. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"Webografia\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: Citação bilíngue. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**Regras para o conteúdo :**",
    page_prompt_rule1: "1.  O JSON deve ser válido.",
    page_prompt_rule2: "2.  O conteúdo textual pode usar as tags Markdown `*palavra*` para negrito e `**palavra**` para itálico.",
    page_prompt_rule3: "3.  Para as imagens, encontre URLs relevantes e livres de direitos (ex.: Wikimedia Commons).",
    page_prompt_example_json_title: "**Exemplo de JSON :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "A Revolução Francesa",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "A Revolução Francesa", "subtitle": "Pontos de referência essenciais" } },
    { "type": "#12_context_paragraphs", "data": { "title": "Contexto", "paragraphs": ["A Revolução Francesa é um período de transformações...", "Várias causas explicam esse acontecimento..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "Eventos-chave", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "Tomada da Bastilha", "caption": "14 de julho de 1789", "title": "Tomada da Bastilha", "text": "Esse evento marca o início da Revolução." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "Gere apenas código JSON válido, sem nenhum comentário."
};
