const translations_pt = {
  subtitle: "Criação Assistida de Recursos e Atividades para Moodle e Éléa",
  help_modal_title: "🚀 Guia completo do Caramel para docentes",
  help_modal_content: `
    <p>Bem-vindo(a) ao <strong>Caramel</strong>! Este guia foi feito para acompanhar você passo a passo, mesmo que esteja começando agora. Nosso objetivo é ajudar a criar atividades de aprendizagem interativas de forma simples e eficiente.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Descrever</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Escolher</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Gerar</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Visualizar e baixar</a>
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
             Esta opção poderosa permite basear a geração em conteúdo que você fornecer. Você pode <strong>copiar e colar um texto</strong> ou <strong>carregar um documento (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacidade:</strong> Fique tranquilo, o processamento do seu documento é feito <strong>inteiramente local no seu computador</strong>. Nenhum dado é enviado para a Internet.</p>
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
            <h5><i class="fas fa-rocket"></i> Opção A: Exibição Simples - Gerar com um clique</h5>
            <p>A via rápida. Clique em <button class="help-btn-example-llm">Gerar com um clique</button> para a IA produzir o conteúdo e colocá-lo diretamente na área de resultados à direita. Você pode escolher diferentes modelos (rápido, poderoso...) pela setinha à direita do botão.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Opção B: Exibição Guiada - Usar uma IA externa</h5>
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
        <h4><span class="help-step-number">4</span> Visualizar e baixar</h4>
        <p>Assim que o conteúdo for gerado, pode visualizá-lo, testá-lo e baixá-lo em diferentes formatos.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> Visualizar e testar</summary>
            <p>Reserve um tempo para verificar a sua atividade na janela de visualização:</p>
            <ul>
                <li><strong>Faça scroll</strong> no conteúdo para reler touto.</li>
                <li><strong>Teste</strong> a atividade como um aluno (clique, arraste, escreva...).</li>
                <li>Para os conteúdos <strong>Éléa/Magistère/Moodle</strong>, um simulador mostra-lhe o resultado real.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Janela de visualização" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Teste a atividade diretamente no simulador.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Baixar (Formatos e Exportações)</summary>
            <p>Tem várias opções para recuperar o seu trabalho:</p>
            <ul>
                <li><strong>Formato interactivo (botão principal):</strong> Para recuperar o ficheiro digital (ex: .h5p, .mbz) para colocar na sua plataforma.</li>
                <li><strong>Outros formatos (menu suspenso):</strong> Clique na seta para baixar em <strong>PDF, DOCX ou ODT</strong> (útil para imprimir ou arquivar).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Menu de exportação" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Abra o menu para aceder às exportações PDF, DOCX...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Integrar no Éléa/Magistère</h5>
        <p>Assim que o ficheiro for baixado, veja como adicioná-lo ao seu curso:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Atividades H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Método simples:</strong> Ative a edição no curso e arraste-solte o arquivo .h5p diretamente na seção desejada. Escolha "Ajouter une activité H5P" e finalize com o botão "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="Tela para adicionar rapidamente uma atividade H5P" style="max-width:360px;width:75%;height:auto;">
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
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Menu de edição aberto na coluna direita" style="width:75%;height:auto;">
                                    <figcaption><em>Menu de edição aberto.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Seta para expandir o painel de edição" style="width:75%;height:auto;">
                                    <figcaption><em>Expanda o painel se necessário.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Clique em "IMPORT/EXPORT" e depois em "Importer un parcours" no submenu.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="Botão IMPORT/EXPORT no Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Selecione Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Arraste-solte o arquivo .mbz na área de importação e clique em "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Área para soltar o arquivo MBZ" style="max-width:460px;width:75%;height:auto;">
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
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="Botão IMPORTER DES ARTICLES no glossário" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Clique em IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Arraste e solte o arquivo .xml na área de importação e clique no botão "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Área de soltar para o arquivo XML do glossário" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Solte o arquivo e valide com ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Seus artigos foram detectados. Finalize clicando no botão "CONTINUER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Confirmação de artigos detectados" style="max-width:460px;width:75%;height:auto;">
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
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Seleção do botão Importar no banco de questões" style="max-width:460px;width:75%;height:auto;">
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
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Escolha entre Formato Moodle XML e Formato GIFT" style="max-width:460px;width:75%;height:auto;">
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

  // ============================================================================
  // INTERFACE PRINCIPAL
  // ============================================================================
  language: "Idioma",
  tutorial: "Tutorial",
  notifications: "Notificações",
  fast_mode: "Modo Rápido",
  guided_mode: "Modo Avançado",
  who_are_you: "Quem é você? (ex: Professor, formador...)",
  what_to_address: "O que deseja abordar? (ex: A Revolução Francesa...)",
  level: "Para qual nível (ex: Ensino Médio)",
  number_of_elements: "Número de questões/elementos no módulo (ex: 5)",

  // ============================================================================
  // RAG/OCR
  // ============================================================================
  rag_title: "Anexar documentos (opcional)",
  rag_note: "Se você deseja que a IA trabalhe exclusivamente a partir de seus documentos, cole seu texto ou solte seus arquivos aqui. Caso contrário, deixe esta área vazia para permitir que a IA busque informações por conta própria.",
  error_duplicate_file: "Este arquivo já foi adicionado.",
  error_unsupported_format: "Formato não suportado. Formatos aceitos: ",
  ocr_scanned_page: "Página digitalizada detectada, executando OCR",
  ocr_image_processing: "Reconhecimento (OCR) da imagem",
  ocr_initializing: "Inicializando OCR...",
  ocr_loading_language: "Carregando modelo de idioma...",
  ocr_preparing: "Preparando análise...",
  docx_processing: "Extraindo texto DOCX...",
  pptx_processing: "Extraindo texto PPTX...",
  odt_processing: "Extraindo texto ODT...",
  odp_processing: "Extraindo texto ODP...",
  file_loading: "Carregando arquivo...",
  extraction_success: "Documento processado com sucesso.",
  extraction_error: "Ocorreu um erro durante o processamento.",
  error_fullscreen: "Falha no modo tela cheia:",
  lock_text: "Bloquear",
  unlock_text: "Desbloquear",
  drag_drop_text: "Arraste e solte um documento aqui (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "ou",
  upload_pdf_btn: "Escolher arquivo",
  paste_your_text_here: "Cole seu texto aqui...",
  rag_tags_tuto: "Encontre abaixo os documentos enviados. Clique no círculo colorido para personalizar o realce de cada documento.",

  // ============================================================================
  // ABAS
  // ============================================================================
  tab_all: "Tudo",
  tab_quiz: "Quiz e Testes",
  tab_text: "Manipulação de texto",
  tab_memory: "Memorização e Descoberta",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // ATIVIDADES H5P - DETALHES
  // ============================================================================
  h5p_timeline_name: "Linha do tempo",
  h5p_timeline_description: "Crie uma linha do tempo interativa para apresentar uma sequência de eventos.",
  h5p_flashcards_name: "Cartões de memória",
  h5p_flashcards_description: "Crie cartões frente e verso para ajudar na memorização de termos e definições.",
  h5p_quiz_set_name: "Quiz misto",
  h5p_quiz_set_description: "Componha uma série de perguntas variadas (Múltipla escolha, arraste e solte, etc.) para avaliar conhecimentos.",
  h5p_quiz_set_qcm_name: "Quiz de múltipla escolha",
  h5p_quiz_set_qcm_description: "Crie um quiz composto exclusivamente de perguntas de múltipla escolha.",
  h5p_quiz_set_vf_name: "Quiz Verdadeiro/Falso",
  h5p_quiz_set_vf_description: "Crie um quiz composto exclusivamente por perguntas do tipo Verdadeiro ou Falso.",
  h5p_glossary_name: "Glossário",
  h5p_glossary_description: "Crie um glossário ou FAQ em formato de acordeão.",
  h5p_crossword_name: "Palavras cruzadas",
  h5p_crossword_description: "Gere uma grade de palavras cruzadas a partir de uma lista de palavras e definições.",
  h5p_essay_name: "Redação",
  h5p_essay_description: "Proponha um tema de redação e defina palavras-chave para uma correção automatizada.",
  h5p_summary_name: "Resumo",
  h5p_summary_description: "Os alunos devem reconstruir um resumo correto escolhendo as frases certas.",
  h5p_drag_the_words_name: "Arrastar palavras",
  h5p_drag_the_words_description: "Crie um texto com lacunas onde os alunos devem arrastar as palavras que faltam.",
  h5p_fill_in_the_blanks_name: "Preencher lacunas",
  h5p_fill_in_the_blanks_description: "Os alunos devem preencher as palavras que faltam diretamente pelo teclado.",
  h5p_mark_the_words_name: "Destacar palavras",
  h5p_mark_the_words_description: "Peça aos alunos para destacarem certas palavras em um parágrafo.",
  h5p_true_false_name: "Verdadeiro/Falso",
  h5p_true_false_description: "Crie uma <strong style='color: red;'>única</strong> pergunta simples com resposta binária: verdadeiro ou falso.",
  h5p_multiple_choice_name: "Múltipla escolha",
  h5p_multiple_choice_description: "Crie uma <strong style='color: red;'>única</strong> pergunta de múltipla escolha com uma ou mais respostas corretas.",
  h5p_find_the_words_name: "Caça-palavras",
  h5p_find_the_words_description: "Crie uma grade de letras onde os alunos devem encontrar palavras.",
  h5p_sort_the_paragraphs_name: "Ordenar parágrafos",
  h5p_sort_the_paragraphs_description: "Crie um conjunto de parágrafos que os alunos devem colocar na ordem correta.",
  h5p_single_choice_set_name: "Série de escolha única",
  h5p_single_choice_set_description: "Crie uma série de perguntas onde cada uma tem apenas uma resposta correta.",
  h5p_dialog_cards_name: "Cartões de diálogo",
  h5p_dialog_cards_description: "Crie cartões interativos frente e verso com texto e opcionalmente imagens.",
  h5p_complex_fill_the_blanks_name: "Lacunas complexas",
  h5p_complex_fill_the_blanks_description: "Crie um texto de lacunas avançado com feedbacks específicos para cada erro.",
  h5p_chart_name: "Gráfico",
  h5p_chart_description: "Crie um gráfico circular ou de barras para visualizar dados.",

  // ============================================================================
  // ATIVIDADES ÉLÉA/MOODLE - DETALHES
  // ============================================================================
  moodle_xml_name: "Teste",
  moodle_xml_description: "Gere um banco de questões para importar diretamente em uma atividade 'Teste' (formato XML ou GIFT).",
  moodle_xml_help: "Para adicionar um arquivo XML num 'Teste' no Moodle, crie a atividade, vá ao menu <strong>Mais</strong>, depois <strong>Banco de questões</strong>. Clique em <strong>Importar</strong>, escolha <strong>Moodle XML</strong>, selecione seu arquivo e valide.",
  moodle_gift_name: "Formato GIFT",
  moodle_gift_description: "Crie questões no formato GIFT, uma forma simples de importar questões para o Moodle.",
  moodle_millionnaire_name: "Milionário",
  moodle_millionnaire_description: "Gere uma atividade 'Milionário' de 6 perguntas com dificuldade progressiva.",
  moodle_appariement_name: "Associação",
  moodle_appariement_description: "Gere uma atividade de associação (ligar colunas) de 10 questões.",
  moodle_qcm_name: "Múltipla escolha (QCM)",
  moodle_qcm_description: "Gere uma atividade simples de múltipla escolha.",
  moodle_glossaire_xml_name: "Glossário (XML)",
  moodle_glossaire_xml_description: "Gere um glossário pronto para importar em formato XML.",
  glossaire_success_generation: "Arquivo {fileName} gerado com sucesso!",
  glossaire_error_creation: "Erro ao criar o XML do glossário:",
  glossaire_error_invalid_json: "O JSON deve conter um nome ('name') e um array de entradas ('entries').",
  elea_page_name: "Página",
  elea_page_description: "Criar uma página de conteúdo Éléa com formatação visual.",

  // ============================================================================
  // MODAL DE GERAÇÃO
  // ============================================================================
  get_prompt_step: "1/2 Obter o prompt para copiar",
  create_file_step: "2/2 Criar o arquivo a partir do JSON",
  generate_one_click: "Gerar em um clique",
  simple_mode: "Simples",
  advanced_mode: "Guiado",
  prompt_for_ia: "Prompt para a IA",
  copy_prompt: "Copiar prompt",
  fullscreen_prompt: "Tela cheia",
  exit_fullscreen_prompt: "Sair da tela cheia",
  lock_prompt: "Bloquear",
  unlock_prompt: "Desbloquear",
  go_duck: "Copiar e ir para Duck.ai",
  go_mistral: "Copiar e ir para Le chat",
  create_h5p_file: "Criar arquivo H5P",
  integrate_h5p_libraries: "Integrar bibliotecas H5P:",
  paste_ia_result: "Cole o resultado da IA na área abaixo para criar seu módulo.",
  generate_h5p: "Gerar H5P",
  create_xml_file: "Criar arquivo XML",
  paste_ia_result_xml: "Cole o XML gerado pela IA abaixo.",
  generate_xml_file: "Gerar arquivo XML",
  export_mbz: "Formato MBZ",
  export_gift: "Formato GIFT",
  export_xml: "Formato XML",
  export_html: "Formato HTML",
  export_docx: "Formato DOCX",
  export_odt: "Formato ODT",
  export_pdf: "Formato PDF",
  export_error: "Erro ao exportar",
  create_mbz_file_appariement: "Criar arquivo de Associação (.mbz)",
  paste_ia_result_appariement: "Cole o JSON gerado pela IA abaixo. O título será extraído automaticamente.",
  generate_mbz_appariement: "Gerar atividade de Associação (mbz)",
  create_mbz_file_millionnaire: "Criar arquivo Milionário (.mbz)",
  paste_ia_result_millionnaire: "Cole o JSON gerado pela IA abaixo. O título será extraído automaticamente.",
  generate_mbz_millionnaire: "Gerar atividade Milionário (mbz)",
  generate_mbz_test: "Gerar atividade Teste (mbz)",
  create_mbz_file_qcm: "Criar arquivo QCM (.mbz)",
  paste_ia_result_qcm: "Cole o JSON gerado pela IA abaixo. O título será extraído automaticamente.",
  generate_mbz_qcm: "Gerar atividade QCM (mbz)",
  create_mbz_file_page: "Criar arquivo Página (.mbz)",
  paste_ia_result_page: "Cole o JSON gerado pela IA abaixo para construir a página.",
  generate_mbz_page: "Gerar atividade Página (mbz)",
  generate_prompts_placeholder: "O prompt aparecerá aqui após preencher pelo menos um campo.",
  paste_json_or_text: "Cole aqui o conteúdo JSON ou o texto da IA para criar sua atividade.",
  info_prompt_copy: "Não cole este prompt no painel direito. Copie-o para uma IA externa e depois cole o resultado aqui.",
  generate_with_llm: "Gerar com a IA do Caramel",
  generation_in_progress: "Gerando, por favor aguarde...",
  request_sent_to_ia: "Pedido enviado para a IA, aguarde...",
  generation_successful: "Conteúdo H5P gerado com sucesso!",
  generation_failed_empty: "A geração falhou. A resposta estava vazia.",
  generation_failed_error: "Erro na geração: {errorMessage}",
  generation_failed_llm: "A geração via IA do Caramel falhou. Causa: {errorMessage}",
  llm_small_summary: "Caramel mou: rápido, leve, perfeito para exercícios rápidos. Baixo consumo.",
  llm_large_summary: "Caramel coulant: mais rico, mais nuances, ideal para tarefas profundas. Consumo médio.",
  llm_xl_summary: "Caramel dur: potente e complexo, para projetos ambiciosos. Requer paciência. Alto consumo.",
  llm_model_source: "Fornecedor do modelo:",
  llm_model_parameters: "Tamanho do modelo:",
  llm_model_parameters_unit: "bilhões de parâmetros",

  // ============================================================================
  // ANIMAÇÃO CARAMEL
  // ============================================================================
  caramel_animation_step_1: "Colocamos o açúcar na panela...",
  caramel_animation_step_2: "Adicionamos um pouco de água...",
  caramel_animation_step_3: "Aquecemos em fogo médio...",
  caramel_animation_step_4: "O açúcar começa a derreter...",
  caramel_animation_step_5: "Começa a ganhar cor...",
  caramel_animation_step_6: "Mexemos suavemente...",
  caramel_animation_step_7: "O caramelo ganha uma bela cor âmbar...",
  caramel_animation_step_8: "Adicionamos o creme de leite quente...",
  caramel_animation_step_9: "Cuidado com os salpicos!",
  caramel_animation_step_10: "Misturamos bem...",
  caramel_animation_step_11: "Está quase pronto!",
  caramel_success_title: "O seu doce está pronto!",

  // ============================================================================
  // NOTIFICAÇÕES E ERROS
  // ============================================================================
  prompts_generated_successfully: "Prompts gerados com sucesso!",
  success_copy: "✓ Copiado!",
  error_please_fill_fields: "Por favor, preencha pelo menos um campo do modo Rápido.",
  error_please_fill_guided_fields: "Por favor, preencha pelo menos um campo do modo Avançado.",
  error_field_empty: "O campo está vazio. Por favor, gere primeiro um prompt.",
  error_copy_failed: "A cópia falhou.",
  error_h5p_module_not_found: "Módulo '{moduleKey}' não encontrado.",
  error_invalid_quiz_json: "O JSON para o Quiz é inválido: {errorMessage}",
  error_invalid_json: "O JSON fornecido é inválido. Erro: {errorMessage}",
  error_h5p_creation: "Erro de criação H5P: {errorMessage}",
  error_paste_ia_content: "Por favor, cole o conteúdo gerado pela IA.",
  error_compression_module_not_ready: "O módulo de compressão não está pronto. Tente novamente em alguns instantes.",
  h5p_file_generated_successfully: "Arquivo {fileName} gerado com sucesso!",
  h5p_creation_failed: "Falha na criação do arquivo H5P: {errorMessage}",
  error_paste_json_content: "Por favor, cole o conteúdo JSON gerado.",
  error_paste_xml_content: "Por favor, cole o conteúdo XML gerado.",
  moodle_xml_success_generation: "Arquivo {fileName} gerado com sucesso!",
  test_error_creation_mbz: "Erro ao criar o MBZ para o Teste:",
  test_success_generation: "Arquivo {fileName} gerado com sucesso!",
  test_error_generic: "Erro:",
  test_backup_log: "Cópia de segurança criada automaticamente pelo Caramel\n",
  millionnaire_error_compression_libs: "As bibliotecas de compressão (Tar.js ou fflate) não estão carregadas. Por favor, verifique a sua ligação à internet ou atualize a página.",
  millionnaire_error_invalid_json: "A estrutura do JSON é inválida. Certifique-se de que contém um 'title' e um array 'questions' de 6 perguntas conforme o exemplo.",
  millionnaire_activity_intro: "Participe neste jogo para testar os seus conhecimentos.",
  millionnaire_backup_log: "Cópia de segurança criada automaticamente pelo Caramel\n",
  millionnaire_success_generation: "Arquivo {fileName} gerado com sucesso!",
  millionnaire_error_creation_mbz: "Erro ao criar o MBZ:",
  millionnaire_error_generic: "Erro:",
  appariement_error_invalid_json: "A estrutura do JSON é inválida. Certifique-se de que contém um 'title' e um array 'pairs' onde cada par tem uma 'question' e uma 'answer'.",
  appariement_activity_intro: "Encontre os pares correspondentes.",
  appariement_success_generation: "Arquivo {fileName} gerado com sucesso!",
  appariement_error_creation_mbz: "Erro ao criar o MBZ para o emparelhamento:",
  qcm_error_invalid_json: "A estrutura do JSON é inválida. Certifique-se de que contém um 'title' e um array 'questions' com pelo menos uma pergunta e respostas.",
  qcm_activity_intro: "Responda às seguintes perguntas.",
  qcm_success_generation: "Arquivo {fileName} gerado com sucesso!",
  qcm_error_creation_mbz: "Erro ao criar o MBZ para o QCM:",
  version_modal_title: "Nova versão disponível",
  version_modal_message: "Está a utilizar atualmente a versão {currentVersion}. Está disponível uma versão mais recente ({latestVersion}). Recarregue a página para aproveitar as melhorias mais recentes.",
  version_modal_update: "Carregar a nova versão",
  version_modal_remind_later: "Lembrar-me mais tarde",

  prompt_header_pedagogical_context: "CONTEXTO PEDAGÓGICO",
  prompt_header_specific_rules: "REGRAS ESPECÍFICAS",
  prompt_header_pedagogical_rules: "REGRAS PEDAGÓGICAS",
  prompt_header_sources: "FONTES",
  prompt_header_json_structure: "ESTRUTURA JSON ESPERADA",
  prompt_header_rendering_example: "EXEMPLO DE RENDERING",
  prompt_fallback_teacher: "um professor",
  prompt_fallback_activity: "criar uma atividade pedagógica",

  // ============================================================================

  // --- CHAVES COMUNS ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- O seu papel: [QUI]. Especialista em didática e engenharia pedagógica
- O seu objetivo pedagógico: [QUOI]
- O seu público: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Adaptação e vocabulário: Adapte o tom, o vocabulário e a dificuldade das instruções ao público indicado. Seja pertinente e envolvente.
- Tom e feedback: As instruções e observações devem ser construtivas, encorajadoras e voltadas para a aprendizagem.
- Conformidade: Adapte OBRIGATORIAMENTE os conteúdos às referências oficiais em vigor. Salvo indicação explícita em contrário, baseie-se por defeito nos programas escolares franceses (Eduscol) para o público escolar, e nos textos regulamentares da formação profissional para adultos.
- Língua: O conteúdo e as instruções devem ser redigidos em português.`,

  SOURCES_COMMUNES: `- Utilizará EXCLUSIVAMENTE os seguintes textos para gerar a sua atividade.
---
[RAG]
---`,

  // ============================================================================
  // === TIMELINE (Frise chronologique) ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Número de eventos: No mínimo 5 eventos || [NOMBRE_ELEMENTS] eventos.
- Períodos (era): No mínimo 2 períodos cobrindo grupos de eventos.
- Mídia: Adicione créditos e legendas para cada recurso, se possível. Procure ativamente uma imagem relevante e livre de direitos (ex: Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Gere EXCLUSIVAMENTE um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar por \`}\`. Nenhum outro texto ou comentário.
- **Objeto raiz:** Contém a chave \`timeline\` (objeto).
- **Conteúdo de \`timeline\`:** Estrutura principal da atividade.
  - \`headline\`: Título geral da linha do tempo (texto simples obrigatório).
  - \`text\`: Introdução cativante (Markdown suportado).
  - \`asset\`: Mídia de capa (\`media\`: URL direta, \`caption\`: legenda, \`credit\`: fonte).
  - \`date\`: Array de eventos cronológicos.
  - \`era\`: Array de períodos de fundo (definem intervalos coloridos no fundo).
- **Estrutura dos objetos \`date\` e \`era\`:**
  - \`startDate\`: **Formato estrito** \`YYYY,MM,DD\` ou \`YYYY\`. (Obrigatório)
  - \`endDate\`: **Formato estrito** \`YYYY,MM,DD\` ou \`YYYY\`. (Opcional, define uma duração/fim de período)
  - \`headline\`: Título explícito do elemento (texto simples obrigatório).
  - \`text\`: Narração pedagógica. Utilize \`**palavra**\` para negrito, \`*palavra*\` para itálico e \`\\n\` para quebras de linha.
  - \`asset\`: (Opcional) Objeto de mídia (\`media\`: URL direta Wikimedia Commons, \`caption\`, \`credit\`).
  - \`tag\`: Palavra-chave curta (ex: 'Política', 'Ciência') que permite a filtragem.
- **LaTeX:** Utilize o escape duplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "A História da Conquista Espacial",
    "text": "Descubra as grandes etapas que marcaram a aventura do homem no **espaço**.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Descolagem da missão Apollo 11.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Lançamento do Sputnik 1",
        "text": "O **primeiro satélite artificial** é colocado em órbita pela URSS.",
        "tag": "Robótica"
      },
      {
        "startDate": "1969,07,20",
        "headline": "Primeiro passo na Lua",
        "text": "Neil Armstrong torna-se o primeiro homem a caminhar na Lua durante a missão **Apollo 11**.",
        "tag": "Humano"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "A Guerra Fria Espacial",
        "text": "Período de rivalidade intensa entre os Estados Unidos e a URSS.",
        "tag": "Contexto"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === CROSSWORD (Mots croisés) ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Número de palavras: No mínimo 6 palavras || [NOMBRE_ELEMENTS] palavras.
- Regras tipográficas: As respostas (\`answer\`) devem conter apenas letras. Qualquer palavra composta, sigla ou expressão deve ser fundida numa única palavra sem espaços, hífenes ou outros caracteres (ex: 'arc-en-ciel' torna-se 'arcenciel', 'D-DAY' torna-se 'DDAY').
- Pistas (\`clue\`): É proibido escrever a palavra a encontrar na pista. Devem ser curtas e precisas.
- Pista suplementar (\`extraClue\`): A IA deve julgar a relevância de adicionar uma.`,

  CROSSWORD_STRUCTURE_JSON: `- Gere EXCLUSIVAMENTE um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar por \`}\`. Nenhum outro texto ou comentário.
- \`title\`: Um título para a atividade.
- \`words\`: Um array de objetos contendo:
  - \`answer\`: A palavra a adivinhar (fundida sem espaços nem hífenes).
  - \`clue\`: A definição curta e precisa.
  - \`extraClue\` (opcional): Um objeto \`{"params": {"text": "..."}}\`. O texto pode utilizar \`**palavra**\` para negrito, \`*palavra*\` para itálico e \`\\n\` para quebras de linha.
- \`taskDescription\`: Uma instrução clara e contextualizada. Utilize \`**palavra**\` para negrito, \`*palavra*\` para itálico e \`\\n\` para quebras de linha. Após uma quebra de linha, especifique: "Para palavras compostas, não coloque espaço nem hífen (ex: 'portachaves' para 'porta-chaves')."
- \`overallFeedback\`: (REGRA ESTRITA) Deve obrigatoriamente gerar um array de 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando escrupulosamente os seguintes intervalos de pontuação: 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Palavras Cruzadas sobre Biologia",
  "words": [
    {"answer": "Celula", "clue": "Unidade básica da vida.", "extraClue": {"params": {"text": "Pode ser **animal** ou **vegetal**."}}},
    {"answer": "ADN", "clue": "Molécula que carrega a informação genética."}
  ],
  "taskDescription": "**Complete** a grelha com os termos de biologia.\\nPara palavras compostas, não coloque espaço nem hífen (ex: 'portachaves' para 'porta-chaves').",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "São necessários esforços para compreender bem estas noções de biologia."},
    {"from": 11, "to": 30, "feedback": "Está quase lá, continue os seus esforços para consolidar os seus conhecimentos."},
    {"from": 31, "to": 50, "feedback": "É um bom começo, mas alguns pontos ainda precisam de ser esclarecidos."},
    {"from": 51, "to": 70, "feedback": "Bom trabalho! Compreendeu o essencial do assunto."},
    {"from": 71, "to": 90, "feedback": "Pontuação muito boa! Domina bem os conceitos abordados."},
    {"from": 91, "to": 100, "feedback": "Excelente! Tem um domínio perfeito desta lição."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Cartes mémoires) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Número de cartões: No mínimo 5 cartões || [NOMBRE_ELEMENTS] cartões.
- Associação: A frente e o verso devem estar ligados por um critério único e estável (ex: definição -> termo, evento -> data, autor -> obra). Utilize a mesma relação para todos os cartões e formule a instrução assim: « Associe cada X a Y ».`,

  FLASHCARDS_STRUCTURE_JSON: `- Gere EXCLUSIVAMENTE um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar por \`}\`. Nenhum outro texto ou comentário.
- O objeto deve conter:
  - \`title\`: Um título pertinente para a atividade.
  - \`description\`: Uma instrução clara para o aluno.
  - \`cards\`: Um array de objetos, onde cada objeto representa um cartão (flashcard) e contém:
    - \`text\`: A pergunta ou o termo a adivinhar (frente).
    - \`answer\`: Resposta ou definição (verso). Regras de normalização: uma única palavra simples ou um número (sem palavras compostas), minúsculas (exceto nomes próprios), sem artigo nem pontuação, números em algarismos.
    - \`tip\` (opcional): Pista para ajudar o aluno. Pode utilizar \`**palavra**\` para negrito e \`*palavra*\` para itálico.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Capitais da Europa",
  "description": "Associe cada país à sua capital.",
  "cards": [
    {
      "text": "França",
      "answer": "paris",
      "tip": "É a cidade da **Torre Eiffel**."
    },
    {
      "text": "Espanha",
      "answer": "madri",
      "tip": "Situada no centro da península *ibérica*."
    },
    {
      "text": "Itália",
      "answer": "roma",
      "tip": "Apelidada de *Cidade Eterna*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (Redação) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Palavras-chave: No mínimo 5 palavras-chave ou expressões esperadas na resposta || [NOMBRE_ELEMENTS] palavras-chave.
- Instrução: A instrução não deve listar as palavras-chave esperadas para não dar a resposta, exceto o nome do tema geral.`,

  ESSAY_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
O objeto deve conter:
- \`taskDescription\`: Uma instrução clara convidando o aluno a redigir um texto sobre o tema. Use \`**palavra**\` para negrito (conceitos-chave), \`*palavra*\` para itálico e \`\\n\` para quebras de linha.
- \`keywords\`: Um quadro de objetos definindo as palavras-chave esperadas. Cada objeto deve ter a forma:
  \`\`\`json
  {
    "keyword": "palavra ou expressão",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (REGRA ESTRITA) Você deve obrigatoriamente gerar um quadro de 6 objetos para o feedback final, contextualizado ao tema do exercício, respeitando escrupulosamente as seguintes faixas de pontuação: 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Escreva um texto curto explicando o processo da **fotossíntese**. Sua resposta deve abordar os elementos essenciais que permitem às plantas produzir sua própria energia.",
  "keywords": [
    {"keyword": "luz", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "clorofila", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "dióxido de carbono", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "água", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glicose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Este é um começo. Leia atentamente a aula sobre a fotossíntese." },
    { "from": 11, "to": 30, "feedback": "Você identificou alguns elementos. Continue seus esforços." },
    { "from": 31, "to": 50, "feedback": "Sua compreensão está progredindo. Pense em detalhar mais." },
    { "from": 51, "to": 70, "feedback": "Bom trabalho! Você domina o básico." },
    { "from": 71, "to": 90, "feedback": "Muito bem! Sua redação mostra uma compreensão sólida." },
    { "from": 91, "to": 100, "feedback": "Excelente! Você tem um domínio perfeito do assunto." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (Glossário H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Número de entradas: No mínimo 5 termos || [NOMBRE_ELEMENTS] termos.
- Seleção de termos: Identifique os conceitos técnicos, o vocabulário específico ou as palavras complexas presentes nas fontes.
- Definições: Concisas, precisas e perfeitamente adaptadas ao nível pedagógico visado.`,

  ACCORDION_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- O JSON gerado deve ser um QUADRO com tantos objetos quanto os termos mencionados anteriormente.
- \`title\`: A palavra-chave, a expressão ou a pergunta a ser definida.
- \`text\`: A definição. Use \`**palavra**\` para negrito, \`*palavra*\` para itálico e \`\\n\` para quebras de linha. Para fórmulas matemáticas, use o formato LaTeX com escape duplo, por exemplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Fotossíntese", "text": "Processo pelo qual as plantas transformam a **luz** do **sol** em energia.\\nÉ a base da cadeia alimentar."},
  {"title": "Célula", "text": "**Unidade** básica de todos os seres vivos. Existem as *eucariontes* e as *procariontes*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (Resumo) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Número de etapas: Gere um quadro de no mínimo 5 etapas || [NOMBRE_ELEMENTS] etapas para cobrir todo o assunto.
- Distratores: Proponha no mínimo 2 distratores por etapa. Eles devem ser coerentes com o assunto, mas conter erros fatuais ou lógicos plausíveis.`,

  SUMMARY_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- \`intro\`: Uma frase de introdução curta (ex: "Escolha a afirmação correta.").
- \`summaries\`: Quadro de objetos que constituem as etapas. Cada objeto contém:
  - \`summary\`: UM quadro de frases (**Associação**). A primeira frase da lista deve SEMPRE ser o resumo correto (afirmação exata).
  - \`tip\`: (Opcional) Uma dica contextual para ajudar o aluno.
- \`overallFeedback\`: Quadro de 6 objetos para a pontuação final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Use o escape duplo para LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Selecione as afirmações corretas para construir o resumo da aula.",
  "summaries": [
    {
      "summary": [
        "A fotossíntese é um processo biológico que permite às plantas transformar a energia luminosa em energia química.",
        "A fotossíntese é um processo que ocorre apenas durante a noite.",
        "A fotossíntese é o mecanismo pelo qual os animais respiram."
      ],
      "tip": "Pense na luz como fonte de energia."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "São necessários esforços para entender bem essas noções." },
    { "from": 11, "to": 30, "feedback": "Você está quase lá, continue seus esforços." },
    { "from": 31, "to": 50, "feedback": "É um bom começo, mas alguns pontos ainda precisam ser esclarecidos." },
    { "from": 51, "to": 70, "feedback": "Bom trabalho! Você entendeu o essencial." },
    { "from": 71, "to": 90, "feedback": "Pontuação muito boa! Você domina bem os conceitos." },
    { "from": 91, "to": 100, "feedback": "Excelente! Você tem um domínio perfeito desta lição." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (Arrastar as palavras) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Número de palavras: Parágrafo com no mínimo 50 palavras com pelo menos 5 palavras para arrastar || [NOMBRE_ELEMENTS] palavras.
- Unicidade: Cada palavra a ser arrastada deve ser ÚNICA no texto (sem duplicatas).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
O objeto deve conter:
- \`taskDescription\`: Uma instrução clara.
- \`textField\`: O texto a ser completado. Cada frase deve terminar com uma quebra de linha \`\\n\`.
  - **Formato**: \`*palavra*\` para um elemento arrastável.
- \`overallFeedback\`: Quadro de 6 objetos para a pontuação final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complete o texto arrastando as palavras.",
  "textField": "O *sistema solar* é composto por *oito* planetas que giram em torno do *Sol*.\\nA maior planeta é *Júpiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "São necessários esforços." },
    { "from": 11, "to": 30, "feedback": "Você está quase lá." },
    { "from": 31, "to": 50, "feedback": "É um bom começo." },
    { "from": 51, "to": 70, "feedback": "Bom trabalho!" },
    { "from": 71, "to": 90, "feedback": "Pontuação muito boa!" },
    { "from": 91, "to": 100, "feedback": "Excelente!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (Texto com lacunas) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Número de lacunas: Parágrafo com no mínimo 50 palavras com pelo menos 3 palavras com lacunas || [NOMBRE_ELEMENTS] palavras.
- Equilíbrio: Não crie lacunas em palavras triviais (artigos, preposições), a menos que esse seja o objetivo gramatical. Foque nos conceitos-chave.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
O objeto deve conter:
- \`taskDescription\`: Uma instrução clara e curta explicando o objetivo da atividade no contexto global. Use \`**palavra**\` para negrito (conceitos-chave), \`*palavra*\` para itálico e \`\\n\` para quebras de linha.
- \`questions\`: Um quadro de strings. Cada string representa um bloco de texto a ser completado.
  - **Sintaxe das lacunas**: Envolva as palavras a serem adivinhadas com asteriscos (ex: \`*palavra*\`).
  - **Alternativas**: Use \`/\` para múltiplas respostas aceitas (ex: \`*palavra1/palavra2*\`).
  - **Ajuda**: Use \`:\` para adicionar um ícone de ajuda pedagógica (ex: \`*palavra:dica*\`).
- \`overallFeedback\`: (REGRA ESTRITA) Você deve obrigatoriamente gerar um quadro de 6 objetos para o feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complete as lacunas do texto abaixo sobre o sistema solar.",
  "questions": [
    "A Terra é um *planeta* do sistema *solar*.",
    "Ela gira em torno do *Sol:nossa estrela* em cerca de 365 dias."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "São necessários esforços para entender bem essas noções."},
    {"from": 11, "to": 30, "feedback": "Você está quase lá, continue seus esforços para consolidar seus conhecimentos."},
    {"from": 31, "to": 50, "feedback": "É um bom começo, mas alguns pontos ainda precisam ser esclarecidos."},
    {"from": 51, "to": 70, "feedback": "Bom trabalho! Você entendeu o essencial do assunto."},
    {"from": 71, "to": 90, "feedback": "Pontuação muito boa! Você domina bem os conceitos abordados."},
    {"from": 91, "to": 100, "feedback": "Excelente! Você tem um domínio perfeito desta lição."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (Destacar as palavras) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Número de palavras: Parágrafo com no mínimo 50 palavras com pelo menos 5 palavras para destacar || [NOMBRE_ELEMENTS] palavras.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
O objeto deve conter:
- \`taskDescription\`: Uma instrução clara e envolvente. Você pode usar \`**palavra**\` para negrito e \`*palavra*\` para itálico aqui apenas.
- \`textField\`: O texto completo contendo as palavras a serem marcadas.
  - **MARCAÇÃO:** Cada palavra a ser marcada deve ser INDIVIDUALMENTE envolvida por asteriscos. (Ex: \`*palavra1* *palavra2*\` está correto; \`*palavra1 palavra2*\` está incorreto).
  - **PONTUAÇÃO:** Apóstrofos ou sinais de pontuação NUNCA DEVEM fazer parte da marcação e devem ser separados da palavra por um espaço. (Ex: Escrever \`o *pássaro*\` está correto, \`o*pássaro*\` está incorreto).
- \`overallFeedback\`: (REGRA ESTRITA) Você deve obrigatoriamente gerar um quadro de 6 objetos para o feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Clique nos **nomes próprios** no texto a seguir.",
  "textField": "*Paris* é a capital da *França*. É a *Europa* que nos interessa.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "São necessários esforços para entender bem essas noções."},
    {"from": 11, "to": 30, "feedback": "Você está quase lá, continue seus esforços para consolidar seus conhecimentos."},
    {"from": 31, "to": 50, "feedback": "É um bom começo, mas alguns pontos ainda precisam ser esclarecidos."},
    {"from": 51, "to": 70, "feedback": "Bom trabalho! Você entendeu o essencial do assunto."},
    {"from": 71, "to": 90, "feedback": "Pontuação muito boa! Você domina bem os conceitos abordados."},
    {"from": 91, "to": 100, "feedback": "Excelente! Você tem um domínio perfeito desta lição."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (Verdadeiro/Falso) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Pergunta: Uma afirmação clara e inequívoca.
- Resposta: A resposta deve ser estritamente "true" (Verdadeiro) ou "false" (Falso).
- Feedbacks: Preveja mensagens específicas para o sucesso (\`feedbackOnCorrect\`) e a falha (\`feedbackOnWrong\`) para reforçar a aprendizagem.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- O objeto principal deve conter as seguintes chaves:
  - \`question\`: (string) A afirmação a ser avaliada. Pode conter HTML.
  - \`correct\`: (string) A resposta correta, seja "true", seja "false".
  - \`feedbackOnCorrect\`: (string) Comentário exibido se a resposta estiver correta.
  - \`feedbackOnWrong\`: (string) Comentário exibido se a resposta estiver incorreta.
- **Formato:** Utilize a sintaxe Markdown para negrito (\`**texto**\`) e itálico (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utilize EXCLUSIVAMENTE o formato LaTeX com duplo escape: \`\\\\( ... \\\\)\`. NUNCA utilize o sinal \`$\` sozinho.
- **Feedback:** Os comentários NÃO DEVEM conter LaTeX nem Markdown.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo é a capital da Noruega.",
  "correct": "true",
  "feedbackOnCorrect": "Boa resposta! Oslo é mesmo a capital da Noruega.",
  "feedbackOnWrong": "Resposta errada. A capital da Noruega é Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (Escolha múltipla) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Pergunta: Uma pergunta clara de escolha múltipla.
- Respostas: Proponha várias opções de resposta (\`answers\`). Deve haver apenas uma resposta correta (\`"correct": true\`) e vários distratores plausíveis (\`"correct": false\`).
- Feedbacks:
  - \`overallFeedback\`: (REGRA ESTRITA) Você deve obrigatoriamente gerar um quadro de 6 objetos para o feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- O objeto principal deve conter as seguintes chaves:
  - \`question\`: (string) O enunciado da pergunta. Pode conter HTML.
  - \`answers\`: (array) Quadro de objetos, cada um representando uma resposta.
    - \`text\`: (string) O texto da resposta.
    - \`correct\`: (boolean) \`true\` se for uma boa resposta, \`false\` caso contrário.
    - \`tipsAndFeedback\`: (object, opcional) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (array) Quadro de 6 objetos definindo os feedbacks por faixa de pontuação.
- **Formato:** Utilize a sintaxe Markdown para negrito (\`**texto**\`) e itálico (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utilize EXCLUSIVAMENTE o formato LaTeX com duplo escape: \`\\\\( ... \\\\)\`. NUNCA utilize o sinal \`$\` sozinho.
- **Feedback:** Os comentários NÃO DEVEM conter LaTeX nem Markdown.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Qual é a cor real da baga de cassis?",
  "answers": [
    {"text": "Violet très foncé", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exactement !" }},
    {"text": "Bleu", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Non, c'est plus foncé." }},
    {"text": "Noir", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "São necessários esforços." },
    { "from": 11, "to": 30, "feedback": "Estás quase lá." },
    { "from": 31, "to": 50, "feedback": "É um bom começo." },
    { "from": 51, "to": 70, "feedback": "Bom trabalho !" },
    { "from": 71, "to": 90, "feedback": "Muito boa pontuação !" },
    { "from": 91, "to": 100, "feedback": "Excelente !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (Palavras cruzadas) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Número de palavras: No mínimo 6 palavras || [NOMBRE_ELEMENTS] palavras.
- Regras tipográficas: As palavras não devem conter acentos, números, sinais de pontuação ou espaços.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar em \`}\`. Nenhum outro texto ou comentário.
- \`taskDescription\`: Instrução para o aluno.
- \`wordList\`: Lista das palavras a encontrar separadas por vírgulas (sem espaços).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Encontre as palavras escondidas na grade.",
  "wordList": "CELULA,ADN,GENE,NUCLEO"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (Ordenar parágrafos) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Número de etapas: Mínimo de 3 etapas ou parágrafos a ordenar || [NOMBRE_ELEMENTS] etapas.
- Lógica intrínseca: Os parágrafos (\`paragraphs\`) devem formar uma progressão lógica inferível pelo próprio conteúdo.
- Proibição de pistas artificiais: NUNCA deve utilizar numeração (1, 2, 3...), marcadores temporais explícitos (datas, horários) ou conectores lógicos demasiado simplistas ("Primeiro", "Depois", "Finalmente"), a menos que o utilizador o solicite explicitamente.
- Fio condutor: Cada parágrafo deve fazer avançar um fio condutor único (ex: cadeia de causalidade, passagem do geral para o particular, ou uma sequência preparação → ação → resultado). A ordem deve ser dedutível através da compreensão do sentido.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar em \`}\`. Nenhum outro texto ou comentário.
- \`taskDescription\`: Uma instrução clara (suporta Markdown).
- \`paragraphs\`: Um quadro de cadeias de caracteres (parágrafos) inicialmente apresentados na **ordem lógica correcta** no JSON. Utilize \`**palavra**\` para o negrito, \`*palavra*\` para o itálico.
- \`overallFeedback\`: Quadro de 6 objetos para a pontuação final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Utilize o escape duplo para LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Coloque estes elementos em ordem para reconstituir a cadeia de causalidade do aquecimento global.",
  "paragraphs": [
    "As atividades humanas, principalmente a queima de combustíveis fósseis, libertam massivamente **dióxido de carbono** para a atmosfera.",
    "Este excesso de gases reforça o efeito de estufa natural, impedindo uma parte da radiação infravermelha de sair da Terra.",
    "A energia assim aprisionada provoca um aumento progressivo da temperatura média do ar e dos oceanos.",
    "Este aquecimento global leva ao derretimento de glaciares e a uma subida preocupante do nível do mar."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "A lógica da causalidade deve ser revista." },
    { "from": 11, "to": 30, "feedback": "Tens algumas noções de compreensão, relê o texto." },
    { "from": 31, "to": 50, "feedback": "É um bom começo de ordenação." },
    { "from": 51, "to": 70, "feedback": "Boa análise da progressão lógica." },
    { "from": 71, "to": 90, "feedback": "Muito bom trabalho de estruturação !" },
    { "from": 91, "to": 100, "feedback": "Perfeito ! A estrutura lógica está dominada." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (Série de escolhas únicas) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Número de perguntas: No mínimo 3 perguntas || [NOMBRE_ELEMENTS] perguntas.
- Respostas: Proponha de 2 a 3 distratores por pergunta. A primeira resposta da lista \`answers\` deve ser sempre a correta.
- Distratores: Coerentes, mas contendo erros lógicos ou factuais plausíveis.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar em \`}\`. Nenhum outro texto ou comentário.
- \`choices\`: Quadro de objetos que constituem as perguntas. Cada objeto contém:
  - \`question\`: O enunciado da pergunta.
  - \`answers\`: Quadro de cadeias de caracteres (respostas) cuja primeira é sempre a resposta correta.
- \`overallFeedback\`: Quadro de 6 objetos para a pontuação final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Utilize o escape duplo para LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "Qual é o principal gás responsável pelo efeito de estufa ?",
      "answers": ["O dióxido de carbono", "O oxigénio", "O azoto", "O árgon"]
    },
    {
      "question": "Qual é a capital da França ?",
      "answers": ["Paris", "Lyon", "Marselha", "Bordéus"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "São necessários esforços." },
    { "from": 11, "to": 30, "feedback": "Estás quase lá." },
    { "from": 31, "to": 50, "feedback": "É un bom começo." },
    { "from": 51, "to": 70, "feedback": "Bom trabalho !" },
    { "from": 71, "to": 90, "feedback": "Muito boa pontuação !" },
    { "from": 91, "to": 100, "feedback": "Excelente !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (Cartões de diálogo) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Número de cartões: No mínimo 3 cartões || [NOMBRE_ELEMENTS] cartões.
- Princípio de associação: A frente e o verso devem estar ligados por um critério único e estável (ex: definição -> termo, evento -> data, autor -> obra).
- Instrução: A descrição da atividade deve seguir a fórmula: "Associe cada [X] ao seu [Y]".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar em \`}\`. Nenhum outro texto ou comentário.
- O objeto raiz DEVE conter \`title\`, \`description\` e \`dialogs\`.
- 1. \`title\`: O título da atividade (Texto simples, **sem** Markdown nem HTML).
- 2. \`description\`: A instrução ou descrição (Formato HTML ou texto simples).
- 3. \`dialogs\`: O quadro de Princípio de associação dos cartões: A frente (text) e o verso (answer).
- 4. \`text\`: A frente do cartão. Utilize \`**palavra**\` para o negrito e \`*palavra*\` para o itálico.
- 5. \`answer\`: O verso do cartão. Deve ser curto. Utilize \`**palavra**\` para o negrito e \`*palavra*\` para o itálico.
- 6. \`tips\` (opcional): Adicione uma dica para a frente (\`front\`) e/ou o verso (\`back\`) apenas se for pertinente. Texto simples **sem** formatação.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Verbos irregulares",
  "description": "Encontre o verbo no infinitivo.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identifique o pretérito.", "back": "Forma básica."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (Gráfico) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Número de elementos: No mínimo 5 elementos de comparação || [NOMBRE_ELEMENTS] elementos de comparação.
- Tipo de gráfico: Escolha entre o gráfico de setores (\`pieChart\`) ou o gráfico de barras (\`barChart\`) de acordo com a pertinência pedagógica.
- Legendas e cores: As cores devem ser contrastadas para uma boa legibilidade. As legendas devem ser curtas e claras.`,

  CHART_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido num bloco de código. A sua resposta DEVE começar por \`{\` e terminar em \`}\`. Nenhum outro texto ou comentário.
- \`graphMode\`: O tipo de gráfico (\`pieChart\` ou \`barChart\`).
- \`listOfTypes\`: Um quadro de objetos \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: O título do gráfico.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Mirtilos"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Framboesas"}
  ],
  "figureDefinition": "Gráfico das frutas favoritas"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Quiz H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Número de perguntas: Gera uma tabela de no mínimo 5 perguntas || [NOMBRE_ELEMENTS] perguntas.
- Variedade: Escolhe os tipos de atividades mais adequados entre os seguintes para variar o exercício:
  - **Escolha Múltipla** (\`H5P.MultiChoice\` 1.16)
  - **Arrastar e soltar palavras** (\`H5P.DragText\` 1.10)
  - **Verdadeiro/Falso** (\`H5P.TrueFalse\` 1.8)
  - **Preencher espaços em branco** (\`H5P.Blanks\` 1.14)
  - **Destacar as palavras** (\`H5P.MarkTheWords\` 1.11)
  - **Redação / Pergunta aberta** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- O objeto raiz deve conter:
  - \`title\`: O título da atividade.
  - \`questions\`: Um array de objetos. Cada objeto representa uma pergunta e deve conter:
    - \`library\`: O nome e a versão exata da biblioteca (ex: \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: Um objeto contendo uma chave \`title\` (título curto da pergunta).
    - \`params\`: Os dados da pergunta.
  - \`overallFeedback\`: Tabela global de 6 objetos para a pontuação final do QuizSet.

**Detalhes dos \`params\` por tipo:**
1. **Escolha Múltipla (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (array de objetos com \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **Verdadeiro/Falso (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" ou "false" em string)
3. **Preencher espaços (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (array de strings com \`*palavra*\`)
4. **Arrastar palavras (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (com \`*palavra*\`)
5. **Destacar (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (com \`*palavra*\`)
6. **Redação (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (array de objetos)

**Cada pergunta, exceto as de tipo H5P.TrueFalse 1.8, deve incluir o seu próprio \`overallFeedback\` (6 faixas).**
- **Formato:** Utilize a sintaxe Markdown para negrito (\`**texto**\`) e itálico (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utilize EXCLUSIVAMENTE o formato LaTeX com duplo escape: \`\\\\( ... \\\\)\`. NUNCA utilize o sinal \`$\` sozinho.
- **Feedback:** Os comentários NÃO DEVEM conter LaTeX nem Markdown.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Cultura Geral Científica",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomia - Escolha Múltipla" },
      "params": {
        "question": "Qual planeta está mais próximo do Sol?",
        "answers": [
          { "text": "Mercúrio", "correct": true },
          { "text": "Vénus", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Errado."},
          {"from": 11, "to": 30, "feedback": "Insuficiente."},
          {"from": 31, "to": 50, "feedback": "Médio."},
          {"from": 51, "to": 70, "feedback": "Bom."},
          {"from": 71, "to": 90, "feedback": "Muito bom."},
          {"from": 91, "to": 100, "feedback": "Excelente."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Biologia - Verdadeiro/Falso" },
      "params": {
        "question": "O ADN é uma dupla hélice.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Resultado baixo."},
    {"from": 11, "to": 30, "feedback": "Resultado insuficiente."},
    {"from": 31, "to": 50, "feedback": "Resultado médio."},
    {"from": 51, "to": 70, "feedback": "Bom resultado."},
    {"from": 71, "to": 90, "feedback": "Muito bom resultado."},
    {"from": 91, "to": 100, "feedback": "Excelente resultado."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (Quiz de múltipla escolha H5P) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Número de perguntas: Gere no mínimo 5 perguntas || [NOMBRE_ELEMENTS] perguntas.
- Tipo: Você deve gerar APENAS perguntas de **múltipla escolha** (\`H5P.MultiChoice\` 1.16). Nenhum outro tipo é permitido.
- Qualidade das perguntas de múltipla escolha:
  - Cada pergunta deve ter pelo menos 3 opções de resposta.
  - Dependendo da natureza da pergunta, você pode propor uma ou várias respostas corretas.
  - Os distratores (respostas erradas) devem ser plausíveis e relevantes.
  - Evite formulações negativas nas perguntas.
  - Varie a posição da(s) resposta(s) correta(s).`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Gere APENAS um JSON completo e válido em um bloco de código. Sua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- O objeto raiz deve conter:
  - \`title\`: O título da atividade.
  - \`questions\`: Um array de objetos. Cada objeto representa uma pergunta de múltipla escolha e deve conter:
    - \`library\`: Sempre \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: Um objeto contendo uma chave \`title\` (título curto da pergunta).
    - \`params\`: Os dados da pergunta.
  - \`overallFeedback\`: Array global de 6 objetos para a pontuação final do QuizSet.

**Detalhes de \`params\` para múltipla escolha (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: A pergunta feita (string).
- \`answers\`: Array de objetos com \`text\` (string) e \`correct\` (boolean).
- \`behaviour\`: Objeto com \`singleAnswer\`: \`true\` se uma única resposta correta, \`false\` se várias respostas corretas.

**Cada pergunta deve incluir seu próprio \`overallFeedback\` (6 faixas: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Formato:** Utilize a sintaxe Markdown para negrito (\`**texto**\`) e itálico (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utilize EXCLUSIVAMENTE o formato LaTeX com duplo escape: \`\\\\( ... \\\\)\`. NUNCA utilize o sinal \`$\` sozinho.
- **Feedback:** Os comentários NÃO DEVEM conter LaTeX nem Markdown.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz de múltipla escolha - Ciências",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomia - Planetas" },
      "params": {
        "question": "Qual planeta está mais próximo do Sol?",
        "answers": [
          { "text": "Vênus", "correct": false },
          { "text": "Marte", "correct": false },
          { "text": "Mercúrio", "correct": true },
          { "text": "Júpiter", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorreto."},
          {"from": 11, "to": 30, "feedback": "Insuficiente."},
          {"from": 31, "to": 50, "feedback": "Médio."},
          {"from": 51, "to": 70, "feedback": "Bom."},
          {"from": 71, "to": 90, "feedback": "Muito bom."},
          {"from": 91, "to": 100, "feedback": "Excelente!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Biologia - Organelas" },
      "params": {
        "question": "Quais organelas possuem seu próprio DNA?",
        "answers": [
          { "text": "O ribossomo", "correct": false },
          { "text": "A mitocôndria", "correct": true },
          { "text": "O aparelho de Golgi", "correct": false },
          { "text": "O cloroplasto", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorreto."},
          {"from": 11, "to": 30, "feedback": "Insuficiente."},
          {"from": 31, "to": 50, "feedback": "Médio."},
          {"from": 51, "to": 70, "feedback": "Bom."},
          {"from": 71, "to": 90, "feedback": "Muito bom."},
          {"from": 91, "to": 100, "feedback": "Excelente!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Resultado baixo. Reveja os conceitos básicos."},
    {"from": 11, "to": 30, "feedback": "Resultado insuficiente. Continue se esforçando."},
    {"from": 31, "to": 50, "feedback": "Resultado médio. Você está progredindo."},
    {"from": 51, "to": 70, "feedback": "Bom resultado. Você domina vários conceitos."},
    {"from": 71, "to": 90, "feedback": "Muito bom risultato. Você está no caminho certo."},
    {"from": 91, "to": 100, "feedback": "Excelente resultado. Parabéns!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P Verdadeiro/Falso Quiz) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Número de perguntas: Gera um quadro de no mínimo 5 perguntas || [NOMBRE_ELEMENTS] perguntas.
- Tipo: Deves gerar APENAS perguntas de tipo **Verdadeiro/Falso** (\`H5P.TrueFalse\` 1.8). Nenhum outro tipo é permitido.
- Qualidade das perguntas:
  - As afirmações devem ser claras e sem ambiguidades.
  - Evite as duplas negações.
  - Varie entre afirmações verdadeiras e falsas.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- O objeto raiz deve conter:
  - \`title\`: O título da atividade.
  - \`questions\`: Um array de objetos. Cada objeto representa uma pergunta e deve conter:
    - \`library\`: Sempre \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: Um objeto contendo uma chave \`title\` (título curto da pergunta).
    - \`params\`: Os dados da pergunta.
  - \`overallFeedback\`: Tabela global de 6 objetos para a pontuação final do QuizSet: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Detalhes dos \`params\` para Verdadeiro/Falso (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: A afirmação ou a pergunta posta (string).
- \`correct\`: A resposta correta. DEVE ser uma string: "true" ou "false".
- **Formato:** Utilize a sintaxe Markdown para negrito (\`**texto**\`) e itálico (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utilize EXCLUSIVAMENTE o formato LaTeX com duplo escape: \`\\\\( ... \\\\)\`. NUNCA utilize o sinal \`$\` sozinho.
- **Feedback:** Os comentários NÃO DEVEM conter LaTeX nem Markdown.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz Verdadeiro/Falso - Geografia",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografia - Capitais" },
      "params": {
        "question": "A capital da Austrália é Camberra.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografia - Continentes" },
      "params": {
        "question": "A África é o maior continente do mundo.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Resultado baixo. Reveja os conceitos básicos."},
    {"from": 11, "to": 30, "feedback": "Resultado insuficiente. Continue se esforçando."},
    {"from": 31, "to": 50, "feedback": "Resultado médio. Você está progredindo."},
    {"from": 51, "to": 70, "feedback": "Bom resultado. Você domina vários conceitos."},
    {"from": 71, "to": 90, "feedback": "Muito bom risultato. Você está no caminho certo."},
    {"from": 91, "to": 100, "feedback": "Excelente resultado. Parabéns!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Teste Moodle/Éléa) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Número de perguntas: No mínimo 10 perguntas || [NOMBRE_ELEMENTS] perguntas.
- Variedade: Escolhe os formatos de perguntas mais adequados entre os seguintes:
  - **Escolha Múltipla** (\`multichoice\`)
  - **Correspondência** (\`matching\`)
  - **Numérico** (\`numerical\`)
  - **Verdadeiro/Falso** (\`truefalse\`)
  - **Resposta Curta** (\`shortanswer\`)
  - **Texto com Lacunas** (\`cloze\`)
- Distratores: Propõe pelo menos 3 distratores por pergunta \`multichoice\`.`,

  ELEA_TEST_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.

O objeto principal deve conter as seguintes chaves:
- \`bank_name\`: Um nome curto e descritivo para o banco de perguntas.
- \`bank_description\`: Uma frase a descrever o conteúdo do banco.
- \`questions\`: Um array de objetos onde cada objeto representa uma pergunta (\`type\`, \`content\`).
  - Cada pergunta deve ter um \`content.name\` curto e único (ex: "P1 - Tópico").

**Regras de formatação:**
- **Números**: usa o ponto para as casas decimais (ex: 12.34).
- **Cloze**: respeita estritamente a sintaxe \`{1:TYPE:=Resposta correta~Resposta errada}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **Para o tipo \`multichoice\` (Escolha Múltipla):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "P1 - Geografia",
      "questiontext": "Qual é a capital de França?",
      "feedback": "Paris é a capital política e económica de França.",
      "answers": [
        { "text": "Paris", "fraction": 100, "feedback": "Exatamente!" },
        { "text": "Lyon", "fraction": 0, "feedback": "Não, Lyon é uma grande cidade mas não é a capital." },
        { "text": "Marselha", "fraction": 0, "feedback": "Não, é a segunda maior cidade de França." }
      ]
    }
  }
  \`\`\`

- **Para o tipo \`matching\` (Correspondência):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "P2 - Vocabulário Inglês",
      "questiontext": "Associe cada palavra inglesa à sua tradução portuguesa.",
      "feedback": "Bravo, domina o vocabulário básico.",
      "subquestions": [
        { "text": "Dog", "answer": "Cão" },
        { "text": "Cat", "answer": "Gato" },
        { "text": "Bird", "answer": "Pássaro" }
      ]
    }
  }
  \`\`\`

- **Para o tipo \`numerical\` (Numérico):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "P3 - Matemática",
      "questiontext": "Qual é o valor de Pi arredondado a duas casas decimais?",
      "feedback": "Pi é uma constante irracional aproximadamente igual a 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "É de facto 3.14." }
    }
  }
  \`\`\`

- **Para o tipo \`truefalse\` (Verdadeiro/Falso):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "P4 - Ciências",
      "questiontext": "A água ferve a 100°C ao nível do mar.",
      "feedback": "É uma propriedade física padrão da água.",
      "answer": { "value": true, "feedback_true": "Verdadeiro.", "feedback_false": "Falso, a água ferve mesmo a 100°C a 1 atm." }
    }
  }
  \`\`\`

- **Para o tipo \`shortanswer\` (Resposta Curta):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "P5 - Literatura",
      "questiontext": "Quem escreveu 'Os Miseráveis'?",
      "feedback": "É um dos maiores romances do século XIX.",
      "answers": [
        { "text": "Victor Hugo", "fraction": 100, "feedback": "Correto!" },
        { "text": "Hugo", "fraction": 100, "feedback": "Correto!" }
      ]
    }
  }
  \`\`\`

- **Para o tipo \`cloze\` (Texto com Lacunas):**
  - Atenção à sintaxe: \`{1:SHORTANSWER:=Bom~Mau}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "P6 - História",
      "questiontext": "Napoleão nasceu em {1:SHORTANSWER:=1769} em {1:MULTICHOICE:=Ajaccio~Bastia~Paris}.",
      "feedback": "Napoleão Bonaparte nasceu na Córsega."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Quem quer ser Milionário) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Número de perguntas: EXATAMENTE 6 perguntas (não deve ser modificado em circunstância alguma)
- Progressividade: A dificuldade das perguntas deve ser **crescente e pedagógica**. Os elementos importantes a memorizar são colocados nas primeiras perguntas.
- Veracidade: O conteúdo deve ser rigorosamente exato e pertinente.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
Um objeto principal com as seguintes chaves:
- \`title\`: O título da atividade (String).
- \`questions\`: Um array de EXATAMENTE 6 objetos, onde cada objeto representa uma pergunta e contém:
  - \`question\`: O enunciado da pergunta (String).
  - \`goodanswer\`: A resposta correta (String).
  - \`badanswer\`: Um array de EXATAMENTE 3 respostas erradas (Array de strings).
  - Para as fórmulas matemáticas, o LaTeX é proibido.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz sobre a Revolução Francesa",
  "questions": [
    {
      "question": "Que acontecimento marca o início da Revolução Francesa a 14 de julho de 1789?",
      "goodanswer": "A tomada da Bastilha",
      "badanswer": ["O juramento do Jogo da Pela", "A execução de Luís XVI", "A batalha de Valmy"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Correspondência) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Número de pares: No mínimo 5 pares || [NOMBRE_ELEMENTS] pares.
- Lógica: A relação entre os dois elementos deve ser evidente após a leitura das fontes.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
Um objeto principal com as seguintes chaves:
- \`title\`: O título da atividade (String).
- \`intro\`: Curta instrução ou texto de introdução (String).
- \`pairs\`: Um array de objetos, onde cada objeto representa um par e contém:
  - \`question\`: O termo ou o elemento à esquerda (String).
  - \`answer\`: A definição ou o elemento correspondente à direita (String).
  - Para as fórmulas matemáticas, utiliza o formato LaTeX com dupla barra de escape, por exemplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Correspondência História",
  "intro": "Associe cada data ao acontecimento correspondente da Revolução Francesa.",
  "pairs": [
    {"question": "Tomada da Bastilha", "answer": "14 de julho de 1789"},
    {"question": "Abolição dos privilégios", "answer": "4 de agosto de 1789"},
    {"question": "DDHC", "answer": "26 de agosto de 1789"},
    {"question": "Marcha das mulheres", "answer": "5 de outubro de 1789"},
    {"question": "Festa da Federação", "answer": "14 de julho de 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (QCM Éléa) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Número de perguntas: No mínimo 5 perguntas || [NOMBRE_ELEMENTS] perguntas.
- Respostas: Propõe entre 2 e 5 escolhas por pergunta.
- Distratores: Coerentes com o assunto, mas contendo erros lógicos.`,

  ELEA_QCM_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- \`title\`: Título da atividade.
- \`questions\`: Array de objetos. Cada objeto de pergunta deve conter:
  - \`text\`: Enunciado da pergunta (pode conter HTML simples como \`**\` para negrito).
  - \`answers\`: Array de objetos \`{"text": "...", "iscorrect": 1/0}\`. \`1\` para uma resposta correta, \`0\` caso contrário.
  - Para as fórmulas matemáticas, utiliza o formato LaTeX com dupla barra de escape, por exemplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "QCM sobre a Revolução Francesa",
  "questions": [
    {
      "text": "Qual é a data da tomada da Bastilha?",
      "answers": [
        {"text": "14 de julho de 1789", "iscorrect": 1},
        {"text": "4 de agosto de 1789", "iscorrect": 0},
        {"text": "26 de agosto de 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (Glossário XML) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- Número de entradas: No mínimo 5 termos || [NOMBRE_ELEMENTS] termos.
- Seleção: Identifica as palavras-chave, acrónimos e conceitos técnicos.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- **Raiz:** Um objeto principal contendo duas chaves: \`name\` (o nome do glossário) e \`entries\` (um array de objetos).
- **Cada objeto em \`entries\` deve conter:**
  - \`concept\`: A palavra ou expressão a definir.
  - \`definition\`: A definição clara e concisa. Utiliza **palavra** para negrito, *palavra* para itálico e \`\\n\` para quebras de linha, apenas quando for pedagogicamente relevante.
  - \`aliases\` (opcional): Um array de strings para sinónimos ou termos alternativos. Adiciona esta chave apenas se existirem pseudónimos relevantes.
  - Para fórmulas matemáticas, utiliza o formato LaTeX com dupla barra de escape, por exemplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Glossário de Jornalismo",
  "entries": [
    {
      "concept": "Jornalista",
      "definition": "Pessoa que **recolhe** e difunde *informações*.",
      "aliases": ["Repórter", "Cronista"]
    },
    {
      "concept": "Fonte",
      "definition": "Origem de uma *informação* verificada."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Página Éléa) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Estrutura: A página deve conter no mínimo 5 blocos diferentes || [NOMBRE_ELEMENTS] blocos.
- Lógica pedagógica: Os conteúdos devem seguir uma progressão coerente (ex: Boas-vindas -> Objetivos -> Aula -> Detalhes/Léxico -> Sitografia).
- Equilíbrio de conteúdos: Mistura os formatos para manter o envolvimento (texto, tabelas, listas, caixas de destaque).
- Conteúdos obrigatórios: Integra sistematicamente um banner de abertura (\`#01_hero_header\`), caixas de objetivos ou pontos de atenção (\`#04_callout_set\`), um léxico para termos técnicos (\`#06_lexique_table\`), pelo menos três parágrafos de conteúdo substancial (\`#12_context_paragraphs\`) e uma sitografia de referência (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Gera APENAS um JSON completo e válido num bloco de código. A tua resposta DEVE começar com \`{\` e terminar com \`}\`. Nenhum outro texto ou comentário.
- \`title\`: Título da página (String).
- \`intro\`: Texto curto de introdução cativante (String).
- \`blocks\`: Um array de objetos, onde cada objeto representa uma secção da página. Cada bloco DEVE respeitar uma das seguintes estruturas:

**Lista de blocos disponíveis:**
- \`#01_hero_header\`: Banner de abertura. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Índice com links internos. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Marcos históricos em 3 cartões. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (máx 3 cartões)
- \`#04_callout_set\`: Banners de Objetivos, Sabia que, Alerta. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Números-chave em cartões. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Tabela de vocabulário. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Glossário em etiquetas. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Cartões de monumentos com imagens. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Comparação de duas imagens.
- \`#10_table_comparison\`: Tabela de comparação.
- \`#11_definition_box\`: Caixa de Definição. \`{ "type": "#11_definition_box", "data": { "title": "Definição", "text": "..." } }\`
- \`#12_context_paragraphs\`: Parágrafos de aula. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Ficha detalhada.
- \`#14_faq_block\`: Perguntas frequentes. \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Mitos vs Realidade.
- \`#17_method_image_desc\`: Método para descrever uma imagem.
- \`#18_sito_graphy\`: Sitografia. \`{ "type": "#18_sito_graphy", "data": { "title": "Sitografia", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Citação bilingue.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "A Revolução Francesa",
  "intro": "Descubra os momentos-chave deste período histórico.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "A Revolução", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Objetivos",
        "callouts": [{"type": "objectif", "text": "Compreender as causas de 1789."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "O Juramento do Jogo da Pela",
        "paragraphs": [
          "A 20 de junho de 1789, os deputados do Terceiro Estado reuniram-se...",
          "Este gesto marca o nascimento da Assembleia Nacional.",
          "É um ponto de viragem crucial para o fim do absolutismo."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Vocabulário",
        "headers": ["Termo", "Definição"],
        "rows": [["Terceiro Estado", "A maior parte da população..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Para ir mais longe",
        "links": [{"href": "https://...", "text": "Site oficial da História"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === TRADUÇÕES DA INTERFACE H5P (PADRONIZADAS) ===
  // ============================================================================

  // Chaves comuns
  h5p_check_answer: "Verificar",
  h5p_try_again: "Repetir",
  h5p_show_solution: "Mostrar solução",
  h5p_submit_answer: "Enviar",
  h5p_score: "Obteve @score de @total pontos",
  h5p_score_bar_label: "Obteve :num de :total pontos",
  h5p_tip_label: "Dica",
  h5p_next: "Próximo",
  h5p_previous: "Anterior",
  h5p_close: "Fechar",
  h5p_finish_header: "Terminar?",
  h5p_finish_body: "Tem a certeza que deseja terminar?",
  h5p_cancel_label: "Cancelar",
  h5p_finish_label: "Terminar",
  h5p_retry_header: "Repetir?",
  h5p_retry_body: "Tem a certeza que deseja repetir?",
  h5p_retry_confirm_label: "Confirmar",
  h5p_resume: "Retomar",
  h5p_audio_direction: "Direção do áudio",
  h5p_a11y_check: "Verificar as respostas. As respostas serão marcadas como corretas, incorretas ou não respondidas.",
  h5p_a11y_show_solution: "Mostrar a solução. A tarefa será marcada com a sua solução correta.",
  h5p_a11y_retry: "Repetir a tarefa. Repor todas as respostas e começar do início.",

  // Palavras cruzadas (Crossword)
  h5p_crossword_across: "Horizontal",
  h5p_crossword_down: "Vertical",
  h5p_crossword_extra_clue: "Dica extra",

  // Resumo (Summary)
  h5p_summary_intro: "Escolha a afirmação correta.",
  h5p_summary_solved_label: "Progresso:",
  h5p_summary_score_label: "Respostas incorretas:",
  h5p_summary_result_label: "O seu resultado",
  h5p_summary_feedback: "Obteve @score de @total afirmações corretas (@percent%).",
  h5p_summary_label_correct: "Correto.",
  h5p_summary_label_incorrect: "Incorreto! Por favor, tente novamente.",
  h5p_summary_label_correct_answers: "Respostas corretas.",
  h5p_summary_progress_text: "Progresso :num de :total",
  h5p_summary_alternative_incorrect_label: "Incorreto",

  // Arrastar as palavras (Drag the Words)
  h5p_drag_words_score_feedback: "Pontuação: @score de @total.",
  h5p_drag_words_correct_text: "Correto!",
  h5p_drag_words_incorrect_text: "Incorreto!",

  // Preencher os espaços (Fill in the Blanks)
  h5p_blanks_not_filled_out: "Por favor, preencha todos os espaços.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; está correto",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; está incorreto",
  h5p_blanks_answered_correctly: "Respondido corretamente",
  h5p_blanks_answered_incorrectly: "Respondido incorretamente",
  h5p_blanks_solution_label: "Resposta correta:",
  h5p_blanks_input_label: "Entrada @num de @total",
  h5p_blanks_input_has_tip_label: "Dica disponível",
  h5p_blanks_feedback: "Obteve @score de @total espaços corretos.",
  h5p_blanks_checking_mode_header: "Modo de verificação",

  // Marcar as palavras (Mark the Words)
  h5p_mark_words_correct_answer: "Correto!",
  h5p_mark_words_incorrect_answer: "Incorreto!",
  h5p_mark_words_missed_answer: "Falhado!",
  h5p_mark_words_display_solution_description: "A tarefa foi atualizada para conter a solução.",
  h5p_mark_words_a11y_full_text_label: "Texto legível completo",
  h5p_mark_words_a11y_clickable_text_label: "Texto completo onde as palavras podem ser marcadas",
  h5p_mark_words_a11y_solution_mode_header: "Modo de solução",
  h5p_mark_words_a11y_checking_header: "Modo de verificação",

  // Cartões de memória (Flashcards)
  h5p_flashcards_progress_text: "Cartão @card de @total",
  h5p_flashcards_your_answer: "A sua resposta",
  h5p_flashcards_correct_answer: "Resposta correta",
  h5p_flashcards_incorrect_answer: "Resposta incorreta",
  h5p_flashcards_show_solution: "Resposta correta",
  h5p_flashcards_results: "Resultados",
  h5p_flashcards_of_correct: "@score de @total corretos",
  h5p_flashcards_show_results: "Mostrar resultados",
  h5p_flashcards_answer_short: "R:",
  h5p_flashcards_card_announcement: "Resposta incorreta. A resposta correta era @answer",
  h5p_flashcards_correct_announcement: "@answer está correto.",
  h5p_flashcards_page_announcement: "Página @current de @total",

  // Ensaio (Essay)
  h5p_essay_feedbackHeader: "Feedback",
  h5p_essay_solutionTitle: "Exemplo de solução",
  h5p_essay_remainingChars: "Caracteres restantes: @chars",
  h5p_essay_notEnoughChars: "Deve introduzir pelo menos @chars caracteres!",
  h5p_essay_messageSave: "guardado",
  h5p_essay_placeholderText: "Comece a escrever aqui...",
  h5p_essay_ariaYourResult: "Obteve @score de @total pontos",
  h5p_essay_ariaNavigatedToSolution: "Navegação para o exemplo de solução recém-incluído após a área de texto.",

  // Verdadeiro/Falso (True/False)
  h5p_true_false_true_text: "Verdadeiro",
  h5p_true_false_false_text: "Falso",
  h5p_true_false_wrong_answer_message: "Resposta incorreta",
  h5p_true_false_correct_answer_message: "Resposta correta",

  // Encontrar as palavras (Find the Words)
  h5p_find_words_found: "@found de @totalWords palavras encontradas",
  h5p_find_words_time_spent: "Tempo gasto",
  h5p_find_words_word_list_header: "Lista de palavras",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Ordenar os parágrafos (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "Mover para cima",
  h5p_sort_paragraphs_down: "Mover para baixo",
  h5p_sort_paragraphs_disabled: "Desativado",
  h5p_sort_paragraphs_paragraph: "Parágrafo",
  h5p_sort_paragraphs_point: "@score ponto",
  h5p_sort_paragraphs_seven_of_nine: "@current de @total",
  h5p_sort_paragraphs_current_position: "Posição atual na lista",
  h5p_sort_paragraphs_instructions_selected: "Pressione a barra de espaços para reordenar",
  h5p_sort_paragraphs_instructions_grabbed: "Pressione as teclas de seta para cima e para baixo para mudar de posição, a barra de espaços para largar, escape para cancelar",
  h5p_sort_paragraphs_grabbed: "Segurado",
  h5p_sort_paragraphs_moved: "Movido",
  h5p_sort_paragraphs_dropped: "Largado",
  h5p_sort_paragraphs_reorder_cancelled: "Reordenação cancelada",
  h5p_sort_paragraphs_final_position: "Posição final",
  h5p_sort_paragraphs_next_paragraph: "Próximo parágrafo",
  h5p_sort_paragraphs_correct_paragraph: "Parágrafo correto na posição",
  h5p_sort_paragraphs_list_description: "Lista de parágrafos ordenáveis.",
  h5p_sort_paragraphs_list_description_check: "Lista de parágrafos com resultados.",
  h5p_sort_paragraphs_list_description_solution: "Lista de parágrafos com soluções.",

  // Conjunto de escolha única (Single Choice Set)
  h5p_single_choice_solution_view_title: "Solução",
  h5p_single_choice_mute_button_label: "Silenciar",
  h5p_single_choice_slide_of_total: "Slide @slide de @total",
  h5p_single_choice_solution_list_question_number: "Pergunta @question",
  h5p_single_choice_should_select: "Deveria selecionar",
  h5p_single_choice_should_not_select: "Não deveria selecionar",

  // Cartões de diálogo (Dialog Cards)
  h5p_dialog_cards_answer: "Virar",
  h5p_dialog_cards_progress_text: "Cartão @card de @total",
  h5p_dialog_cards_card_front_label: "Frente do cartão",
  h5p_dialog_cards_card_back_label: "Verso do cartão",
  h5p_dialog_cards_audio_not_supported: "O seu navegador não suporta este formato de áudio",
  h5p_dialog_cards_correct_answer: "Acertei!",
  h5p_dialog_cards_incorrect_answer: "Errei",
  h5p_dialog_cards_round: "Ronda @round",
  h5p_dialog_cards_cards_left: "Cartões restantes: @number",
  h5p_dialog_cards_next_round: "Passar para a ronda @round",
  h5p_dialog_cards_start_over: "Repetir",
  h5p_dialog_cards_show_summary: "Próximo",
  h5p_dialog_cards_summary: "Resumo",
  h5p_dialog_cards_summary_cards_right: "Cartões que acertou:",
  h5p_dialog_cards_summary_cards_wrong: "Cartões que errou:",
  h5p_dialog_cards_summary_cards_not_shown: "Cartões não mostrados:",
  h5p_dialog_cards_summary_overall_score: "Pontuação global",
  h5p_dialog_cards_summary_cards_completed: "Cartões que aprendeu:",
  h5p_dialog_cards_summary_completed_rounds: "Rondas concluídas:",
  h5p_dialog_cards_summary_all_done: "Bem feito! Completou todos os @cards cartões @max vezes seguidas!",

  // Conjunto de perguntas (Quiz Set)
  h5p_quiz_textual_progress: "Pergunta @current de @total",
  h5p_quiz_no_result_message: "Terminado",
  h5p_quiz_result_message: "Os seus resultados:",
  h5p_quiz_feedback_available: "Feedback disponível",
  h5p_quiz_read_feedback: "Ler feedback",
  h5p_quiz_wrong_answer: "Resposta incorreta",
  h5p_quiz_correct_answer: "Resposta correta",
  h5p_quiz_should_check: "Deveria ter sido selecionado",
  h5p_quiz_should_not_check: "Não deveria ter sido selecionado",
  h5p_quiz_no_input: "Por favor, responda antes de ver a solução.",

  // ============================================================================
  // === AVISO LEGAL - RODAPÉ ===
  // ============================================================================
  license_info: "GNU GPL v3.0 ou posterior",
  ticket: "Ticket",
  legal_mentions: "Aviso legal",
  legal_title: "Aviso legal",
  legal_editor_title: "Editor da aplicação",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Função:</strong> PLP Letras-História",
  legal_editor_gauthier_remande_email: "<strong>Email:</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Endereço:</strong> 39 avenue de Chanzy, 53000 Laval, França",
  legal_editor_gauthier_remande_phone: "<strong>Telefone:</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Função:</strong> Professor de matemática e encarregado de missão DRANE – Academia de Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>Email:</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Endereço:</strong> 30 boulevard de la République, 38200 Vienne, França",
  legal_editor_emmanuel_gaunard_phone: "<strong>Telefone:</strong> +33 6 46 74 20 94",
  legal_app_description: "A aplicação web « Caramel » é um projeto livre, não comercial, destinado à criação de conteúdos H5P e Éléa. Não é necessária nenhuma conta, e nenhuns dados pessoais são recolhidos.",
  legal_hosting_title: "Alojamento",
  legal_host_name: "<strong>Alojador</strong>: Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>Razão social</strong>: Ministério da Educação Nacional e da Juventude",
  legal_host_address: "<strong>Endereço</strong>: 110 rue de Grenelle, 75007 Paris, França",
  legal_host_phone: "<strong>Telefone</strong>: +33 1 55 55 10 10",
  legal_publication_director_title: "Responsável pela publicação",
  legal_publication_director_name: "Gauthier REMANDE e Emmanuel GAUNARD, na qualidade de editores voluntários.",
  legal_terms_of_use_title: "Condições gerais de utilização",
  legal_terms_of_use_content: "Este site permite aos utilizadores gerar conteúdos H5P e Éléa. A visualização é feita localmente, sem transmissão de dados do utilizador. O utilizador é o único responsável pelo uso que faz dos conteúdos gerados. A aplicação é oferecida gratuitamente, sem qualquer garantia de funcionamento ou de resultado. O editor declina qualquer responsabilidade em caso de má interpretação dos conteúdos ou de uso inapropriado.",
  legal_intellectual_property_title: "Propriedade intelectual",
  legal_intellectual_property_content: "O conjunto dos códigos-fonte, elementos gráficos e conteúdos estão sob licença livre GNU AGPLv3. A sua reutilização é permitida nas condições da respetiva licença. Qualquer redistribuição ou modificação deve citar os autores originais: Gauthier REMANDE e Emmanuel GAUNARD. As imagens utilizadas nos módulos H5P são recuperadas do site H5P.org.",
  legal_personal_data_title: "Dados pessoais",
  legal_personal_data_content: "Nenhuns dados pessoais são recolhidos ou armazenados. Não são utilizados cookies de rastreio.",
  legal_ai_models_title: "Modelos de Inteligência Artificial",
  legal_ai_models_content: "A aplicação Caramel apoia-se, apenas durante a geração num clique, em modelos de IA operados pela ILAAS, uma federação de infraestruturas de IA partilhadas. Os pedidos são encaminhados através de um workflow n8n alojado pelo Incubateur, e depois transmitidos à ILAAS para execução em servidores de confiança alojados em centros de dados com certificação do Ensino Superior e da Investigação (ESR). A Caramel não executa os modelos e não trata nem armazena dados próprios; os dados são utilizados apenas para executar o pedido e não são enviados para IAs de consumo geral. Os modelos atualmente propostos incluem {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) e {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). As modalidades de alojamento, registo e conservação eventualmente efetuadas pela ILAAS dependem da sua política de privacidade e das suas condições de serviço, às quais se deve referir.",
  legal_user_requests_processing_title: "Processamento de pedidos de utilizadores via n8n e o Incubateur do Ministério da Educação Nacional",
  legal_user_requests_processing_content: "O nosso site utiliza uma solução técnica desenvolvida pela n8n, uma ferramenta open source alojada pelo Incubateur do Ministério da Educação Nacional. Este serviço permite, através de um workflow automatizado, transformar os pedidos dos utilizadores em dados estruturados (formato JSON) para interagir com uma inteligência artificial da DINUM, portanto, soberana. Nenhuma informação sensível é exposta ou transmitida sem encriptação, garantindo assim a confidencialidade e a segurança das trocas.",
  legal_accessibility_title: "Acessibilidade",
  legal_accessibility_content: "A aplicação foi concebida para ser compatível com a utilização em computador, incluindo modos escuro/claro, navegação por teclado e alto contraste conforme os temas. Está em curso uma melhoria contínua da acessibilidade, em articulação com as recomendações do RGAA.",
  legal_applicable_law_title: "Direito aplicável",
  legal_applicable_law_content: "Este site está sujeito ao direito francês. Em caso de litígio, a jurisdição competente será a da comarca de Lyon.",
  legal_external_libraries_title: "Bibliotecas externas utilizadas",
  legal_external_libraries_intro: "A aplicação Caramel utiliza várias bibliotecas open source, sob as seguintes licenças:",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licença: CC BY 4.0, SIL OFL 1.1, MIT): Fornece os ícones utilizados na interface para melhorar a navegação e a experiência visual.",
  legal_library_jszip: "<strong>JSZip</strong> (Licença: MIT ou GPLv3): Permite criar ficheiros .h5p comprimindo o conteúdo necessário num arquivo zip.",
  legal_library_clientzip: "<strong>client-zip</strong> (Licença: MIT): Outra biblioteca utilizada para a compressão de ficheiros, oferecendo uma alternativa de alto desempenho para gerar os arquivos .h5p diretamente no navegador.",
  legal_library_fflate: "<strong>fflate</strong> (Licença: MIT): Biblioteca muito rápida para a compressão e descompressão de dados, utilizada para a criação dos arquivos .mbz dos módulos Moodle.",
  legal_library_tarjs: "<strong>tar-js</strong> (Licence: MIT): Permite criar arquivos .tar, uma etapa necessária antes da compressão para formar os ficheiros .mbz dos módulos Moodle.",
  legal_library_mammoth: "<strong>Mammoth</strong> (Licença: BSD 2-Clause): Permite converter documentos Word (.docx) em HTML, facilitando a importação e a integração de conteúdos a partir de ficheiros Microsoft Word.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (Licença: Apache 2.0): Permite extrair o texto nativo de ficheiros PDF diretamente no navegador, sem necessidade de processamento no servidor.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (Licença: Apache 2.0): Motor de reconhecimento ótico de caracteres (OCR) que permite extrair texto a partir de imagens (PNG, JPG, JPEG) e documentos PDF digitalizados.",
  legal_library_mathjax: "<strong>MathJax</strong> (Licença: Apache 2.0): Usado para renderização de fórmulas matemáticas (LaTeX) nas visualizações.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (Licença: MIT): Permite visualizar conteúdos H5P diretamente no navegador sem a necessidade de um servidor ou CMS (como Moodle ou WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (Licença: MIT): Biblioteca JavaScript para gerar documentos PDF diretamente no navegador, utilizada para exportar conteúdos educativos em formato PDF.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (Licença: MIT): Extensão do jsPDF que permite gerar tabelas estruturadas nos documentos PDF exportados.",
  legal_library_docx: "<strong>docx</strong> (Licença: MIT): Biblioteca JavaScript para criar documentos Word (.docx) no navegador, utilizada para exportar conteúdos educativos em formato Microsoft Word.",
  legal_library_ownership: "Cada biblioteca continua a ser propriedade dos seus respetivos autores e é utilizada de acordo com a(s) sua(s) licença(s).",

  // ============================================================================
  // === NOTIFICAÇÕES ===
  // ============================================================================
  no_notifications: "Sem notificações",
  clear_all: "Limpar tudo",
  view: "Visualizar",
  today: "Hoje",
  error: "Erro",
  download: "Descarregar",
  edit_content: "Editar",
  compatible_with: "Compatível com:",
  preview_placeholder: "Pré-visualização disponível em breve",
  previous: "Anterior",
  next: "Seguinte",
  close_modal: "Fechar",
  loading: "Carregando...",
  preview_error: "Não é possível visualizar este ficheiro",
  simulator_warning: "Pré-visualização através do simulador de atividades: a renderização final no Éléa pode ser ligeiramente diferente.",
  editor_confirm_close_title: "Alterações não guardadas",
  editor_confirm_close_message: "Deseja guardar as suas alterações antes de sair?",
  editor_confirm_close_cancel: "Permanecer no editor",
  editor_confirm_close_save: "Guardar e sair",
  editor_confirm_close_discard: "Sair sem guardar",

  // Editor JSON
  editor_title_prefix: "Edição:",
  editor_loading: "Carregando o editor...",
  editor_unknown_type: "Tipo de conteúdo não reconhecido",
  editor_no_schema: "Esquema não disponível para este tipo",
  editor_init_error: "Erro ao inicializar o editor",
  editor_save: "Guardar",
  editor_cancel: "Cancelar",
  editor_unsaved_changes: "Alterações não guardadas",
  editor_confirm_discard: "Tem a certeza de que deseja cancelar? As alterações não guardadas serão perdidas.",
  editor_validation_errors: "Erros de validação",

  // Secções
  editor_section_general: "Informações gerais",
  editor_section_question: "Pergunta",
  editor_section_questions: "Perguntas",
  editor_section_answers: "Respostas",
  editor_section_answer: "Resposta",
  editor_section_feedback: "Feedback",
  editor_section_cards: "Cartões",
  editor_section_sentences: "Frases",
  editor_section_events: "Eventos",
  editor_section_words: "Palavras",
  editor_section_keywords: "Palavras-chave",
  editor_section_entries: "Entradas",
  editor_section_pairs: "Pares",
  editor_section_text: "Texto",

  // Campos gerais
  editor_title: "Título",
  editor_description: "Descrição",
  editor_description_hint: "Instrução exibida aos alunos",
  editor_intro: "Introdução",
  editor_task_description: "Instrução",
  editor_question_text: "Enunciado da pergunta",

  // Cartões
  editor_card: "Cartão",
  editor_card_front: "Frente",
  editor_card_front_placeholder: "Pergunta ou termo",
  editor_card_back: "Verso",
  editor_card_back_placeholder: "Resposta ou definição",
  editor_card_tip: "Dica",
  editor_add_card: "Adicionar um cartão",

  // Respostas
  editor_answer: "Resposta",
  editor_answer_text: "Texto da resposta",
  editor_is_correct: "Correto",
  editor_add_answer: "Adicionar uma resposta",

  // Dicas e Feedback
  editor_tips_feedback: "Dicas e feedback",
  editor_tip: "Dica",
  editor_tip_optional: "Dica (opcional)",
  editor_tips_optional: "Dicas (opcional)",
  editor_tip_front: "Dica frente",
  editor_tip_back: "Dica verso",
  editor_chosen_feedback: "Feedback se selecionado",
  editor_not_chosen_feedback: "Feedback se não selecionado",
  editor_feedback_correct: "Feedback se correto",
  editor_feedback_wrong: "Feedback se incorreto",
  editor_overall_feedback: "Feedback global por pontuação",

  // Intervalos de feedback
  editor_feedback_ranges_label: "Feedback com base na pontuação",
  editor_feedback_placeholder: "Mensagem de feedback para este intervalo...",
  editor_add_range: "Adicionar um intervalo",

  // Verdadeiro/Falso
  editor_correct_answer: "Resposta correta",
  editor_true: "Verdadeiro",
  editor_false: "Falso",

  // Preencher espaços / Arrastar palavras
  editor_sentence: "Frase",
  editor_sentence_text: "Texto da frase",
  editor_add_sentence: "Adicionar uma frase",
  editor_blanks_hint: "Envolva as palavras a adivinhar com *asteriscos*",
  editor_text_with_blanks: "Texto com palavras para colocar",
  editor_drag_words_hint: "As palavras entre *asteriscos* serão elementos de arrastar e largar",

  // Linha do tempo
  editor_event: "Evento",
  editor_add_event: "Adicionar um evento",
  editor_start_date: "Data de início",
  editor_end_date: "Data de fim",
  editor_event_title: "Título do evento",
  editor_event_description: "Descrição",
  editor_event_tag: "Etiqueta",

  // Palavras cruzadas
  editor_word: "Palavra",
  editor_add_word: "Adicionar uma palavra",
  editor_clue: "Dica/Definição",
  editor_orientation: "Orientação",
  editor_horizontal: "Horizontal",
  editor_vertical: "Vertical",
  editor_crossword_answer_hint: "A palavra em maiúsculas",

  // Ensaio
  editor_keyword: "Palavra-chave",
  editor_keyword_text: "Palavra-chave esperada",
  editor_keyword_weight: "Peso",
  editor_add_keyword: "Adicionar uma palavra-chave",

  // Glossário
  editor_entry: "Entrada",
  editor_add_entry: "Adicionar uma entrada",
  editor_term: "Termo",
  editor_definition: "Definição",

  // Moodle
  editor_question: "Pergunta",
  editor_add_question: "Adicionar uma pergunta",
  editor_pair: "Par",
  editor_add_pair: "Adicionar um par",
  editor_left_element: "Elemento esquerdo",
  editor_right_element: "Elemento direito",
  editor_choice: "Opção",
  editor_choice_text: "Texto da opção",
  editor_add_choice: "Adicionar uma opção",

  // Ações de itens
  editor_add_item: "Adicionar",
  editor_drag: "Arrastar",
  editor_duplicate: "Duplicar",
  editor_delete: "Eliminar",
  editor_confirm_delete: "Tem a certeza de que deseja eliminar este item?",
  editor_min_items_reached: "Número mínimo de itens atingido",
  editor_max_items_reached: "Número máximo de itens atingido",

  // Erros de validação
  editor_error_required: "Este campo é obrigatório",
  editor_error_min_length: "Mínimo {0} caracteres",
  editor_error_max_length: "Máximo {0} caracteres",
  editor_error_pattern: "Formato inválido",
  editor_error_min_items: "Mínimo {0} item(ns)",
  editor_error_max_items: "Máximo {0} item(ns)",
  editor_error_number: "Deve ser um número",
  editor_error_min: "Mínimo {0}",
  editor_error_max: "Máximo {0}",
  editor_error_feedback_ranges: "Os intervalos devem cobrir 0-100% sem sobreposição",
  editor_error_no_correct: "Pelo menos uma resposta deve estar correta",
  editor_error_date_format: "Formato de data inválido (esperado: AAAA,M,D)",
  editor_error_no_blanks: "O texto deve conter pelo menos uma palavra entre *asteriscos*",

  // QuizSet
  editor_library_type: "Tipo de biblioteca",
  editor_question_title: "Título da pergunta",
  editor_question_params: "Parâmetros da pergunta",
  editor_parameters: "Parâmetros",

  // Palavras cruzadas
  editor_extra_clue: "Dica adicional",

  // FindTheWords
  editor_word_list: "Lista de palavras",

  // SingleChoiceSet
  editor_answers: "Respostas possíveis",

  // MarkTheWords
  editor_text_with_marks: "Texto com palavras para marcar",
  editor_mark_words_hint: "Envolva as palavras a marcar com *asteriscos*",

  // SortParagraphs
  editor_section_paragraphs: "Parágrafos",
  editor_paragraph: "Parágrafo",
  editor_add_paragraph: "Adicionar um parágrafo",
  editor_paragraph_text: "Texto do parágrafo",

  // Summary
  editor_section_summaries: "Resumos",
  editor_summary_item: "Elemento de resumo",
  editor_add_summary_item: "Adicionar um elemento",
  editor_statement: "Afirmação",
  editor_add_statement: "Adicionar uma afirmação",
  editor_statement_text: "Texto da afirmação",

  // Moodle Test
  editor_question_type: "Tipo de pergunta",

  // Moodle Page
  editor_section_blocks: "Blocos",
  editor_block: "Bloco",
  editor_add_block: "Adicionar um bloco",
  editor_block_type: "Tipo de bloco",
  editor_block_content: "Conteúdo do bloco",

  // Atividades Éléa específicas
  // Glossário
  editor_glossary_name: "Nome do glossário",

  // Millionnaire
  editor_good_answer: "Resposta correta",
  editor_bad_answers: "Respostas incorretas",
  editor_bad_answer: "Resposta incorreta",
  editor_add_bad_answer: "Adicionar uma resposta incorreta",

  // Test (banco de questões)
  editor_bank_name: "Nome do banco",
  editor_bank_description: "Descrição do banco",
  editor_question_name: "Nome da pergunta",
  editor_question_feedback: "Feedback geral",
  editor_answer_fraction: "Pontos/Pontuação",
  editor_answer_feedback: "Feedback da resposta",
  editor_subquestion: "Subpergunta",
  editor_add_subquestion: "Adicionar uma subpergunta",
  editor_numerical_value: "Valor numérico",
  editor_numerical_tolerance: "Tolerância",
  editor_section_subquestions: "Subperguntas",
  editor_section_content: "Conteúdo",
  editor_feedback_if_true: "Feedback se verdadeiro",
  editor_feedback_if_false: "Feedback se falso",

  // Mensagens
  editor_save_success: "Alterações guardadas",
  editor_save_error: "Erro ao guardar as alterações",
  editor_regenerating: "Regerando o ficheiro...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Página",
  doc_fmt_summary_header: "Índice",
  doc_fmt_quiz_title: "Quiz",
  doc_fmt_instructions: "📝 Instruções: Responda às seguintes perguntas.",
  doc_fmt_question_header: "Questão",

  // --- Shared properties ---
  doc_fmt_type: "Tipo:",
  doc_fmt_feedbacks: "💬 Feedbacks:",
  doc_fmt_global_feedbacks: "Feedbacks globaux",
  doc_fmt_answers: "Respostas:",
  doc_fmt_correct_answer_true: "Resposta correta: VERDADEIRO ✓",
  doc_fmt_correct_answer_false: "Resposta correta: FALSO ✓",
  doc_fmt_text_if_true: "Texto se verdadeiro:",
  doc_fmt_text_if_false: "Texto se falso:",
  doc_fmt_text_with_answers: "Texto con as respostas:",
  doc_fmt_text_with_marks: "Texto com as palavras a marcar:",
  doc_fmt_marks_to_find: "Palavras a marcar:",
  doc_fmt_keywords_expected: "Palavras-chave esperadas:",
  doc_fmt_accepted_answers: "Respostas aceites:",
  doc_fmt_text_to_complete: "Texto para completar:",
  doc_fmt_also_called: "🏷️ Também chamado:",
  doc_fmt_image_not_found: "⚠️ [Imagem não encontrada]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Cartões de memória",
  doc_fmt_card_index: "Cartão",
  doc_fmt_card_front: "Frente:",
  doc_fmt_card_back: "Verso:",
  doc_fmt_hint: "💡 Dica:",
  doc_fmt_crossword_title: "Palavras cruzadas",
  doc_fmt_definitions_and_answers: "Definições e respostas",
  doc_fmt_answer: "Resposta:",
  doc_fmt_extra_hint: "💡 Dica extra:",
  doc_fmt_timeline_events: "Eventos",
  doc_fmt_timeline_periods: "Períodos",
  doc_fmt_drag_the_words_title: "Arrastar as palavras",
  doc_fmt_fill_in_the_blanks_title: "Preencher as lacunas",
  doc_fmt_mark_the_words_title: "Marcar as palavras",
  doc_fmt_glossary_title: "Glossário",
  doc_fmt_term_index: "Termo",
  doc_fmt_chart_title: "Diagrama",
  doc_fmt_data: "Dados",
  doc_fmt_summary_title: "Resumo",
  doc_fmt_claim_index: "Afirmação",
  doc_fmt_multiple_choice_title: "Pergunta de escolha múltipla",
  doc_fmt_single_choice_set_title: "Conjunto de perguntas de escolha única",
  doc_fmt_true_false_title: "Pergunta de verdadeiro/falso",
  doc_fmt_dialog_cards_title: "Cartões de diálogo",
  doc_fmt_hint_front: "💡 Dica (frente):",
  doc_fmt_hint_back: "💡 Dica (verso):",
  doc_fmt_sort_paragraphs_title: "Ordenar os parágrafos",
  doc_fmt_paragraphs_ordered: "Paragraphes na ordem correta",
  doc_fmt_find_the_words_title: "Sopa de letras",
  doc_fmt_words_to_find: "Palavras a encontrar",
  doc_fmt_matching_title: "Combinações",
  doc_fmt_matching_instructions: "📝 Instruções: Combine cada item com o seu correspondente.",
  doc_fmt_pairs_to_match: "Pares para combinar",
  doc_fmt_millionnaire_title: "Quem quer ser milionário?",
  doc_fmt_millionnaire_instructions: "📝 Instruções: Encontre a resposta correta entre as quatro opções.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Pergunta aberta",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "Teste",
  doc_fmt_associations: "Associações:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Escolha múltipla (QCM)",
  doc_fmt_type_matching: "Combinações",
  doc_fmt_type_numerical: "Numérico",
  doc_fmt_type_truefalse: "Verdadeiro/Falso",
  doc_fmt_type_shortanswer: "Resposta curta",
  doc_fmt_type_cloze: "Texto para completar (Cloze)",
  doc_fmt_type_blanks: "Preencher as lacunas",
  doc_fmt_type_dragtext: "Arrastar as palavras",
  doc_fmt_type_markwords: "Marcar as palavras",
  doc_fmt_type_essay: "Pergunta aberta",
  doc_fmt_type_default: "Pergunta",

  // Novas chaves para a estrutura pedagógica enunciação/correção
  doc_fmt_correction_title: "Correção",
  doc_fmt_proposed_answers: "Proposições:",
  doc_fmt_correct_answer: "Resposta correta",
  doc_fmt_correct_answers: "Respostas corretas:",
  doc_fmt_true: "Verdadeiro",
  doc_fmt_false: "Falso",
  doc_fmt_words_to_place: "Palavras a colocar:",
  doc_fmt_completed_text: "Texto completado:",
  doc_fmt_text_to_mark: "Texto no qual encontrar as palavras:",
  doc_fmt_words_count_to_find: "Número de palavras a encontrar",
  doc_fmt_words_to_mark: "Palavras a marcar:",
  doc_fmt_answer_space: "Espaço para a resposta:",
  doc_fmt_open_answer: "Resposta aberta - avaliação de acordo com os critérios definidos pelo professor.",
  doc_fmt_definitions: "Definições",
  doc_fmt_letters: "letras",
  doc_fmt_summary_instructions: "Para cada grupo, escolha a afirmação correta.",
  doc_fmt_sort_instructions: "Coloque os parágrafos seguintes na ordem correta.",
  doc_fmt_paragraphs_to_sort: "Parágrafos a ordenar",
  doc_fmt_correct_order: "Ordem correta",
  doc_fmt_find_instructions: "Encontre",
  doc_fmt_hidden_words: "palavras escondidas na grelha.",
  doc_fmt_hints: "Dicas",
  doc_fmt_flashcards_instructions: "Para cada cartão, encontre a resposta correspondente à pergunta.",
  doc_fmt_elements_to_match: "Elementos a associar:",
  doc_fmt_possible_matches: "Correspondências possíveis:",
  doc_fmt_correct_associations: "Associações corretas:",

};