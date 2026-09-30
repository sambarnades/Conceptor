<!--
Base de conhecimento de Caramelia (assistente pedagógica do Caramel).
Este arquivo é DOCUMENTAÇÃO DE REFERÊNCIA, não um prompt de sistema.
Nenhuma instrução destinada ao LLM deve ser adicionada aqui.

REGRA DE EDIÇÃO: todos os rótulos mencionados abaixo (botões, abas,
campos, seções) devem reproduzir EXATAMENTE o texto visível na
interface do Caramel. Fonte única de verdade: js/locales/pt.json
+ index.html. Toda edição é feita via PR.
-->
---
version: 1.3.0
lang: pt
audience: professores
---

# Tutorial Caramel

O Caramel é uma ferramenta web de código aberto que ajuda professores a
criar atividades pedagógicas interativas (H5P, Éléa, Magistère, Moodle)
com a ajuda da IA. O site funciona 100 % no navegador:
nenhum dado pedagógico é enviado a um servidor de terceiros.

## Descrever sua necessidade (no topo da página)

No topo da página, duas abas permitem escolher como descrever
sua necessidade:

- **Modo Rápido** — formulário mínimo, dois campos.
- **Modo Avançado** — os mesmos campos mais opções adicionais,
  inclusive a possibilidade de anexar documentos.

### Modo Rápido

Apenas dois campos:

- **"Quem é você? (ex: Professor, formador...)"**
- **"O que deseja abordar? (ex: A Revolução Francesa...)"**

### Modo Avançado

Os mesmos campos do Modo Rápido, mais:

- **"Para qual nível (ex: Ensino Médio)"**
- **"Número de questões/elementos no módulo (ex: 5)"** — conforme
  a atividade, isso corresponde ao número de questões, datas em uma
  linha do tempo, palavras em um glossário, etc.
- Um campo livre para acrescentar **informações complementares**
  (instruções específicas, restrições ou qualquer outro detalhe
  relevante).

### Anexar documentos (opcional) — apenas no Modo Avançado

Esta seção, intitulada **"Anexar documentos (opcional)"**, só
aparece quando a aba **Modo Avançado** está selecionada. Permite
basear a geração em um conteúdo fornecido por você.

Três possibilidades:

- **Copiar e colar um texto** diretamente na área de entrada.
- **Arrastar e soltar um documento** (ou clicar em
  **"Escolher arquivo"**) em formato **PDF, TXT, DOCX, PPTX, ODT, ODP,
  PNG, JPEG** (as imagens **WebP** e **BMP** também são aceites, sem serem listadas na tela). Uma **imagem** depositada (foto, esquema, diagrama…) é **analisada por uma IA de visão** que redige uma **descrição** dela e **transcreve fielmente o texto** que ela contém — se a IA estiver indisponível, a leitura local (OCR) assume automaticamente. Também pode soltar um **ficheiro de áudio** (MP3, M4A, WAV…) ou um **vídeo** (MP4, MOV…): apenas a faixa de áudio é então transcrita automaticamente (pelo Albert, o serviço soberano da DINUM; ver confidencialidade abaixo). A área de soltar mostra **"Arraste e solte um ou mais documentos aqui (PDF, TXT, DOCX, PPTX, ODT, ODP, PNG, JPEG)"** com o
  separador **"ou"**.
- **Importar uma página web**: colar o seu link (`https://…`) no
  campo abaixo da zona de depósito, depois clicar em **"Adicionar"**.
  O texto da página é recuperado automaticamente.

A extração do texto dos **documentos** acontece
**inteiramente local** no seu navegador (nenhum dado enviado).
**Três exceções transitam pelos nossos servidores (alojados em
França):** a **análise das imagens** (a imagem é enviada ao modelo de
visão durante o tempo da análise, nunca conservada; em caso de
indisponibilidade, o OCR local — que nada envia — assume), a
**transcrição de áudio** e a **importação de uma página web** (o link
que você introduz é enviado para extrair o seu texto; os links para
PDF, vídeos ou páginas pagas não são suportados).

Se você deixar essa zona vazia, a IA se baseará apenas em seus
conhecimentos gerais para gerar a atividade.

## Escolher o tipo de atividade

Uma vez feita a descrição, os blocos de atividades tornam-se
clicáveis. Clique no que corresponde ao seu objetivo
pedagógico. Os filtros acima dos blocos permitem restringir a
exibição: **Tudo**, **Quiz e Testes**, **Manipulação de texto**,
**Memorização e Descoberta**, bem como as plataformas **H5P**,
**Éléa**, **Moodle**.

Abaixo do formulário, **Uma atividade** mostra estes mosaicos; **Um percurso** abre o atelier que reúne várias atividades num curso completo (ver «Criar e retomar um curso completo»).

### Atividades H5P

Atividades em formato H5P. As marcadas com uma estrela (★) incluem
feedback detalhado em 4 faixas de pontuação.

- **Linha do tempo** — sequência interativa de eventos.
- **Cartões de memória (Flashcards)** — frente e verso para memorização.
- **Quiz de múltipla escolha (Question Set)** ★ — quiz com questões de múltipla escolha.
- **Quiz Verdadeiro/Falso (Question Set)** ★ — quiz de verdadeiro ou falso.
- **Quiz misto (Question Set)** ★ — questões variadas (múltipla escolha, arrastar e soltar…).
- **Glossário** — sanfona expansível ou FAQ.
- **Palavras cruzadas** ★ — grade gerada a partir de definições.
- **Redação** ★ — tema de redação com correção por palavras-chave.
- **Resumo** ★ — o aluno reconstitui um resumo escolhendo as frases corretas.
- **Arrastar palavras** ★ — texto com palavras faltantes para arrastar.
- **Arrastar e soltar** ★ — etiquetas para soltar em uma área.
- **Preencher lacunas** ★ — o aluno digita as palavras faltantes.
- **Destacar palavras** ★ — o aluno destaca certas palavras em um texto.
- **Verdadeiro/Falso** — questões binárias simples.
- **Múltipla escolha** ★ — questões com uma ou várias respostas corretas.
- **Caça-palavras** — grade de letras com palavras a encontrar.
- **Ordenar parágrafos** ★ — recolocar parágrafos na ordem correta.
- **Série de escolha única** ★ — questões com apenas uma resposta correta.
- **Cartões de diálogo** — cartões frente e verso com texto e áudio.
- **Ditado** — ditado com áudio: frases lidas por síntese de voz (voz F/M, velocidade normal ou lenta, 11 línguas), o aluno escreve-as e a correção destaca os erros.
- **Preencher lacunas complexo** ★ — feedbacks específicos por erro.
- **Gráfico** — circular ou de barras para visualizar dados.
- **Apresentação de curso** — slideshow interativo com exercícios integrados.
- **Livro interativo** — livro com vários capítulos (textos, tabelas, imagens, exercícios) com índice e resumo.
- **Vídeo interativo** — perguntas (escolha múltipla, verdadeiro/falso, preenchimento) em momentos-chave de um vídeo, com resumo final. Precisa de um URL de vídeo (Tubes da Apps Éducation, PodEduc ou YouTube); o Caramelia pede-o antes de gerar.
- **Imagem interativa** — pontos clicáveis sobre uma imagem que você anexa. O Caramel localiza automaticamente as zonas-chave da imagem segundo o seu contexto (disciplina, nível, tema) e posiciona os pontos, depois redige o conteúdo de cada ponto. Em seguida, no editor, você pode adicionar manualmente texto, uma imagem, um som ou um vídeo a um ponto, e escolher a cor e o tipo de marcador (números, ícone). Pede para anexar um ficheiro de imagem (PNG, JPEG, WebP, e até HEIC/foto iPhone ou TIFF); o Caramel analisa-o assim que é depositado. Também exportável em documento (DOCX, ODT, PDF) com pastilhas numeradas.
- **Encontrar a zona (Find the Hotspot)** — uma pergunta que se responde clicando diretamente numa imagem que anexa: o Caramel deteta as zonas da imagem, escolhe A zona correta segundo o seu contexto e redige o enunciado e os feedbacks (as outras zonas servem de distratores; a pontuação decide-se no primeiro clique). Como na Imagem interativa, é preciso anexar um ficheiro de imagem, analisado assim que é carregado. No editor, as zonas movem-se diretamente sobre a imagem (verde = correta, vermelho = distrator). Também exportável como documento (DOCX, ODT, PDF) com folha do aluno e correção.
- **Encontrar as zonas (Find Multiple Hotspots)** — uma caça às zonas numa imagem que anexa: o aluno deve clicar em TODAS as zonas corretas (os legumes, os erros, os riscos…). O Caramel escolhe as zonas corretas segundo o seu contexto, dá nome ao que se procura e redige enunciado e feedbacks. Mesmo fluxo da Imagem interativa (ficheiro de imagem analisado assim que é carregado, zonas editáveis sobre a imagem). Também exportável como documento (DOCX, ODT, PDF).

### Atividades Éléa / Magistère

- **Teste (MBZ / XML / GIFT)** — atividade Teste pronta a restaurar em **`.mbz`**
  (banco de questões + quiz já montado), ou banco de questões variadas (múltipla
  escolha, associação…) para importar (XML / GIFT) em um teste Éléa/Magistère.
- **Múltipla escolha (QCM) (MBZ)** — atividade de múltipla escolha simples e rápida.
- **Associação (MBZ)** — jogo de associação entre pares de elementos.
- **Milionário (MBZ)** — quiz lúdico com dificuldade crescente.
- **Glossário (XML)** — arquivo de importação para um glossário Éléa/Magistère.
- **Página (MBZ / HTML)** — página de curso estruturada e formatada.
- **Livro (MBZ)** — livro com vários capítulos e navegação.
- **Tarefa (MBZ)** — tarefa com matriz de avaliação por critérios.

## Gerar e refinar o conteúdo

Após clicar em um bloco, abre-se uma janela. É aqui que
você interage com a IA. No topo dessa janela, um interruptor
**Simples / Guiado** permite escolher o modo de exibição.

### Exibição Simples — botão "Gerar em um clique"

O caminho rápido. Clique em **"Gerar em um clique"**: a IA produz
o conteúdo e o coloca diretamente na área de resultado à direita.
A pequena seta à direita do botão permite escolher entre diferentes
modelos de IA (rápido, potente…).

### Exibição Guiado — usar uma IA externa

Para controle máximo. O prompt aparece à esquerda.

1. Modifique o prompt se desejar.
2. Clique em **"Copiar prompt"** e abra uma IA externa
   em uma nova aba.
3. Cole o prompt na IA, recupere a resposta e cole-a
   na área de resultado à direita no Caramel.

Dois ícones úteis, no topo da área do prompt: **"Tela cheia"** para
mais conforto, e **"Bloquear"** (que se torna **"Desbloquear"**) para
proteger o prompt.

## Visualizar, editar e baixar

Uma vez gerado o conteúdo, aparece a janela **"O seu doce está pronto!"**,
com duas opções: **"Visualizar e editar"** ou **"Continuar"**
(para gerar outra atividade).

### Visualizar

Um simulador integrado testa a atividade como um aluno (clicar,
arrastar, escrever…). Para os conteúdos Éléa/Magistère, um simulador
mostra a renderização real.

### Editar (ícone de lápis, botão **"Editar"**)

O editor visual adapta-se automaticamente ao tipo de atividade: lista
dos elementos à esquerda, detalhes à direita.

- **Barra rich-text** nos campos compatíveis: negrito, itálico,
  sublinhado, riscado, sobrescrito, subscrito, cor, listas, link.
- Botão `</>` para alternar para o **modo código-fonte**.
- **Fórmulas matemáticas** via o botão **√x**: 6 categorias
  (frações, raízes, potências, letras gregas, operadores,
  estruturas), pré-visualização em tempo real, duplo clique para modificar.
- **Palavras a encontrar** (Arrastar palavras, Destacar palavras,
  Preencher lacunas): destaque amarelo automático, botões
  Marcar / Remover, ou asteriscos `*palavra*`.
- **Preencher lacunas (Cloze)** no Teste: três tipos de lacunas
  (Múltipla escolha, Resposta curta, Valor numérico), exibidos
  como pílulas coloridas (azul, amarelo, verde).
- **Imagens**: arrastar e soltar, redimensionamento automático
  (800×600), texto alternativo, formatos JPEG / PNG / WebP.

### Baixar

O botão **"Descarregar"** oferece duas famílias de formatos:

- **Formatos interativos** (digitais, para Éléa/Magistère):
  H5P, MBZ, XML.
- **Formatos imprimíveis** (versões desplugadas): DOCX, ODT, PDF.

## Integrar o arquivo gerado no Éléa

> Observação: os rótulos de botões entre aspas abaixo são mantidos em
> francês porque correspondem exatamente à interface do Éléa, utilizada
> majoritariamente em contexto francófono.

### Integrar um arquivo H5P

- **Método rápido**: passar o curso para o modo de edição,
  arrastar e soltar o arquivo `.h5p` diretamente, escolher
  « Ajouter une activité H5P » e confirmar com **DÉPOSER**.
- **Método recomendado**: « Ajouter une activité ou une ressource »
  → « Contenu interactif (H5P) » → aba « Téléverser » →
  selecionar o arquivo → **« Utiliser »** → salvar.

### Integrar um arquivo MBZ

1. Abrir o menu de edição à direita (clicar na seta para expandi-lo,
   se necessário).
2. Clicar em **« IMPORT/EXPORT »** → **« Importer un parcours »**.
3. Arrastar e soltar o arquivo `.mbz` → **IMPORTER**.
4. **CONTINUER**.

### Integrar um XML (banco de questões Teste)

1. Aba **« Plus »** → **« Banque de questions »**.
2. Menu **« Questions »** → **« Importer »**.
3. Marcar o formato (XML Magistère recomendado, ou GIFT).
4. Arrastar e soltar o arquivo → **IMPORTATION** → **CONTINUER**.

### Integrar um XML de Glossário

1. Criar um Glossário vazio no curso.
2. Clicar em **« IMPORTER DES ARTICLES »**.
3. Arrastar e soltar o arquivo `.xml` → **ENVOYER** → **CONTINUER**.

### Integrar um arquivo HTML em uma atividade Página

1. Abrir o `.html` com um editor de texto, copiar todo o conteúdo.
2. No Éléa, adicionar uma atividade **« Page »**.
3. No editor: **Outils → Code source**.
4. Colar o HTML → salvar.

## Sobre o Caramel

### Autores

Se o usuário desejar entrar em contato com a equipe:

- **Gauthier REMANDE** — Professor de ensino profissional, Letras-História — gauthier.remande@ac-nantes.fr
- **Emmanuel GAUNARD** — Professor de matemática e encarregado de missão DRANE — Académie de Grenoble — emmanuel.gaunard@ac-grenoble.fr

### Avisos legais

#### Dados pessoais

Nenhum dado pessoal é coletado ou armazenado. Nenhum cookie de rastreamento é utilizado.

#### Modelos de Inteligência Artificial

A aplicação Caramel apoia-se, exclusivamente durante a geração com um clique, em modelos de IA operados pela ILaaS, uma federação de infraestruturas de IA mutualizadas. As solicitações são encaminhadas através de um workflow n8n hospedado pelo Incubateur, e em seguida transmitidas à ILaaS para execução em servidores confiáveis hospedados em data centers certificados do Ensino Superior e da Pesquisa francesa (ESR). O Caramel não executa os modelos e não processa nem armazena dados em seu próprio nome; os dados são utilizados unicamente para executar a solicitação e não são enviados a IAs de uso geral. Os modelos atualmente disponíveis incluem Gemma 4 (31 bilhões de parâmetros), Qwen 3.8 (27 bilhões de parâmetros) e Mistral Small 4 (119 bilhões de parâmetros). Eventuais práticas de hospedagem, registro e conservação efetuadas pela ILaaS estão sujeitas à sua própria política de privacidade e às suas condições de serviço, às quais convém referir-se.

#### Tratamento das solicitações dos usuários via n8n e o Incubateur do Ministério da Educação Nacional

Nosso site utiliza uma solução técnica desenvolvida com n8n, uma ferramenta de código aberto hospedada pelo Incubateur do Ministério da Educação Nacional francês. Através de um workflow automatizado, este serviço transforma as solicitações dos usuários em dados estruturados (formato JSON) para interagir com uma IA da DINUM, portanto soberana. Nenhuma informação sensível é exposta ou transmitida sem criptografia, garantindo assim a confidencialidade e a segurança das trocas.

#### Acessibilidade

A aplicação foi concebida para ser compatível com o uso em computador, incluindo os modos escuro/claro, a navegação por teclado e o alto contraste segundo os temas. Uma melhoria contínua da acessibilidade está em curso, em linha com as recomendações do RGAA.

### Links úteis

- **Licença**: GNU AGPL v3.0 ou posterior — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
- **Reportar um bug**: https://forge.apps.education.fr/caramel/caramel/-/issues
- **Código-fonte**: https://forge.apps.education.fr/caramel/caramel
- **Changelog**: https://forge.apps.education.fr/caramel/caramel/-/blob/main/CHANGELOG

## Quadro de resposta de Caramelia

- Caramelia sempre responde no idioma do usuário.
- Respostas concisas, amigáveis, pedagógicas (1 a 3 parágrafos).
- Emojis com parcimônia (1 ou 2 no máximo).
- Quando cita um botão, uma aba, um campo ou uma seção do site,
  Caramelia usa **exatamente** o rótulo visível na tela, conforme
  listado acima (por exemplo **"Modo Avançado"**, **"Anexar
  documentos (opcional)"**, **"Gerar em um clique"**). Não inventa
  nomes de etapas ("etapa 1"…) nem termos técnicos internos
  ("opção RAG"…) que não aparecem em lugar algum da interface.
- Se o usuário quiser gerar uma atividade, Caramelia propõe o
  tipo mais adequado, mas NUNCA gera o JSON de uma atividade.
- Para qualquer pergunta de integração, Caramelia fornece as
  etapas precisas acima.

<!-- parcours-complet -->
## Criar e retomar um curso completo

No Caramel, **Um percurso** cria um curso para Éléa, Magistère ou Moodle: várias atividades organizadas em secções num único ficheiro **.mbz**. O ponto de partida continua a ser o formulário habitual: tema, público e documentos anexos. O ateliê usa o vocabulário da plataforma escolhida: alunos no Éléa, formandos no Magistère, estudantes no Moodle — no ecrã, no curso e nos textos que a IA redige.

No menu da Caramelia, **Criar um percurso** abre diretamente o ateliê sem chamar a IA. Se existir um rascunho, **Retomar o meu percurso** recupera-o. Os campos e as fontes existentes são mantidos. Revê o enquadramento e o plano no ateliê antes de iniciar a geração.

Escolha **Um percurso** abaixo do formulário e depois a plataforma, modalidade, extensão, **Um mesmo caminho para todos** ou **Caminhos consoante os resultados**, e um modelo: os mais habituais são propostos primeiro — aprender de forma autónoma, rever, treinar, avaliar — e **Ver os outros modelos** mostra os seguintes. **Compor o plano** adapta o plano ao tema com IA. **Partir do modelo** abre imediatamente uma estrutura para completar sem chamar a IA. As atividades só são geradas após a sua aprovação do plano.

Em **Plano**, edite o título, objetivo geral, conceitos-chave, etapas e atividades. Mova as atividades com as setas ou arrastando a miniatura. **Instruções e etapa** permite ajustar as instruções de geração. As orientações pedagógicas ajudam a rever sem impor um modelo. O máximo é de **12 atividades**.

Na ficha de um **Vídeo interativo**, cole a ligação do vídeo. A transcrição é obtida durante a geração; também pode colá-la manualmente. Para **Imagem interativa**, **Encontrar a zona** ou **Encontrar as zonas**, anexe uma imagem à ficha: será analisada antes da geração. Também pode adicionar estes recursos na fase de geração. Uma atividade sem recurso aguarda enquanto as restantes avançam. O cenário conserva as imagens e ligações das atividades; os documentos do formulário inicial ficam separados. Para uma **Ligação web**, cole o endereço do recurso na ficha: a IA redige a instrução de leitura sem abrir a página.

Quando o conteúdo está pronto, **Alterar o conteúdo** abre o editor habitual e **Pré-visualização** o leitor. **Rever o curso** permite rever as atividades por ordem com **Anterior** e **Seguinte**. Guarde as alterações para as incluir no plano e nas exportações. Alterar uma instrução do plano não reescreve os conteúdos existentes.

Aprove o plano para iniciar a geração. Pode parar, retomar atividades em falta ou gerar novamente uma atividade. O cadeado **Não gerar esta atividade** reserva o conteúdo para preenchimento manual: a IA não o preenche. Uma nova geração falhada conserva o conteúdo anterior. As atividades ausentes são identificadas antes da exportação.

**Exportar o guião (.json)** guarda o plano e os conteúdos prontos num ficheiro **.json**. O botão **Personalizar o plano**, junto a **Compor o plano**, abre a mesma janela que para uma atividade: copie o prompt para a IA da sua escolha e cole a resposta. **Retomar um guião** está nesta janela; o ficheiro **.json** descarrega-se na entrega, junto ao **.mbz**. O rascunho fica apenas neste separador: exporte o cenário antes de o fechar. O cenário não inclui tema, público nem anexos; introduza-os novamente antes de gerar novos conteúdos.

Em **Entrega**, descarregue o **.mbz** e use a importação ou o restauro de cursos da plataforma. Este ficheiro de curso não deve ser carregado numa atividade H5P. O percurso aparece também na zona de notificações: **Visualizar** abre a **Vista do percurso**, com as boas-vindas, cada etapa e as suas atividades, que pode rever e modificar antes de voltar a descarregar. Conserve também o **.json** para voltar ao Caramel. A ficha de sequência e os detalhes das atividades podem ser exportados em **DOCX, ODT ou PDF**.

O plano propõe também os módulos do seu Éléa, Magistère ou Moodle, agrupados no menu de cada atividade em **Módulos da plataforma**: fórum, sondagem, questionário, inquérito, lição, workshop de avaliação entre pares, quadro, wiki, documento colaborativo, glossário e base de dados a construir, sala de aula virtual, escolha de grupo, partilha de ficheiros e ligação web. A IA redige o que a plataforma conserva na importação; os espaços coletivos chegam vazios, com a respetiva instrução. Quando um módulo exige uma definição na plataforma (fases do workshop, hora da sala de aula virtual, grupos), o Caramel escreve-a numa nota **A fazer antes de abrir o curso**, oculta para os alunos, no início do curso importado. O **pacote de conteúdo IMS** — páginas para ler com o seu índice, escritas inteiramente pelo Caramel — escolhe-se no mosaico; o plano não o propõe.

O mapa de progressão é específico do Éléa. O mapa, o acesso progressivo e os caminhos consoante os resultados ainda requerem verificações em utilização real. A colaboração acontece na plataforma. A publicação de um percurso completo na Sucrerie ainda não está disponível.

Para saber mais: [ABC Learning Design (UCL)](https://www.ucl.ac.uk/short-courses/staff-resources/course-design/designing-learning-activities) ajuda a refletir sobre as atividades de aprendizagem. As sete famílias do Caramel, entre as quais **Discutir** e **Colaborar**, são orientações simplificadas baseadas nas ferramentas, não os seis tipos ABC nem uma avaliação do seu ensino.
No Éléa, abra **Definições do curso**, ative o mapa de progresso e use o bloco **+ Adicionar a minha imagem** para escolher o seu fundo. Pode alterar ou remover a imagem e voltar aos temas propostos. O fundo é guardado no cenário **.json** e incluído no curso **.mbz**. JPEG, PNG, HEIC, WebP, GIF, BMP, AVIF, SVG ou TIFF · Máx. 12 MB. Conversão automática, sem recorte.

<!-- parcours-trames -->
### Escolher um modelo

Depois de **Um percurso**, o modelo dá o desenvolvimento que a IA adapta ao tema. A lista apresentada depende da modalidade e da extensão escolhidas; cada atividade continua editável no plano.

- **Aprender de forma autónoma** — Uma noção nova, aprendida sozinho: descobri-la passo a passo, praticar com correção imediata, reter o essencial, verificar. *(Uma aula · Duas a três aulas · Uma sequência completa)*
- **Rever antes da avaliação** — Identifica-se o que está adquirido, volta-se a pôr o essencial à vista, treina-se, faz-se uma autoavaliação. *(Uma aula · Duas a três aulas)*
- **Treinar** — Uma recordação para reativar, exercícios primeiro com opções e depois sem, uma verificação final: a dificuldade aumenta e a aula não é repetida. *(Uma aula · Duas a três aulas · Uma sequência completa)*
- **Avaliar** — O que se espera, um treino no formato da prova e depois a avaliação: uma única tentativa, cronometrada, sem correção visível; no fim, apenas a nota. *(Uma aula)*
- **Remediar depois da avaliação** — Parte-se dos erros constatados: nomeá-los, reexplicar o ponto exato, refazer e voltar a verificar. *(Uma aula · Duas a três aulas · À distância · Ambas)*
- **Ritual curto** — Dez minutos, sempre com a mesma forma. É a repetição que fixa, não a variedade. *(Uma aula)*
- **Descobrir uma noção** — Uma situação que interroga, documentos para explorar, depois a síntese, e só então a aplicação. *(Duas a três aulas · Uma sequência completa)*
- **Sala de aula invertida** — O vídeo e a sua verificação em casa, a tarefa que não se faz sozinho na aula, o balanço depois. *(Uma aula · Duas a três aulas · Ambas)*
- **Estudar uma obra** — Entrar no texto ou na imagem, identificar, situar, interpretar, e depois produzir a sua própria leitura. *(Duas a três aulas · Uma sequência completa)*
- **Conduzir uma investigação** — Uma pergunta, uma hipótese, dados, uma conclusão: o método científico, por ordem. *(Duas a três aulas · Uma sequência completa · Na aula · Ambas)*
- **Analisar uma fonte** — De onde vem a informação, quem a produz, o que omite. Preparar o olhar antes de julgar. *(Uma aula · Duas a três aulas)*
- **Debate argumentado** — Uma votação para dizer de onde se parte, fontes para se informar, um fórum para debater e um texto para concluir. *(Duas a três aulas · Uma sequência completa)*
- **Diferenciar desde o início** — Um teste inicial abre a cada aluno um caminho adaptado ao seu resultado; todos se reencontram para um balanço comum. *(Uma aula · Duas a três aulas · Caminhos consoante os resultados)*
- **Remediar durante o percurso** — Descobre-se, faz-se o ponto da situação com um quiz: consoante a pontuação, revê-se ou vai-se mais longe, e depois aplica-se tudo em conjunto. *(Uma aula · Duas a três aulas · Caminhos consoante os resultados)*
- **Sequência de língua estrangeira** — Primeiro o léxico, depois a compreensão, a produção no fim. *(Duas a três aulas)*
- **Preparar uma apresentação oral** — O que se vai dizer, por que ordem, e como se treina a dizê-lo. *(Uma aula · Duas a três aulas · Na aula · Ambas)*
- **Aprender a aprender** — O que ajuda mesmo a memorizar, experimentado no tema do curso: testar-se, espaçar, explicar. Depois, cada um planeia as suas revisões. *(Uma aula · Duas a três aulas)*
- **Formar-se de forma autónoma** — Ninguém atrás do ecrã: o percurso tem de bastar-se a si próprio, do índice à avaliação final. *(Duas a três aulas · Uma sequência completa · À distância)*
- **Formação híbrida em três tempos** — A preparação à distância, o encontro presencial, depois a aplicação e o retorno de experiência. O formato dos percursos de formação. *(Uma sequência completa · Ambas)*
- **Trabalho por projeto** — Uma encomenda com os seus critérios, documentação, trabalho de equipa, uma produção revista entre pares e depois melhorada. *(Uma sequência completa · Na aula · Ambas)*
- **Trabalho em equipa** — Formar as equipas, reunir as ideias, escrever em conjunto, rever o trabalho dos colegas com uma grelha. *(Duas a três aulas · Uma sequência completa)*
- **Jogo de fuga** — Uma missão, pistas, enigmas de dificuldade crescente, um código final e o debate final. *(Uma aula · Duas a três aulas · Na aula · Ambas)*
- **Estrutura livre** — Nenhum desenvolvimento imposto: compõe as etapas você mesmo e o Caramel preenche o que lá colocar. *(Uma aula · Duas a três aulas · Uma sequência completa)*
<!-- /parcours-trames -->

<!-- parcours-chemins -->
### Caminhos consoante os resultados

Na configuração, **Caminhos consoante os resultados** leva os seus alunos a fazer um teste: consoante a nota na primeira tentativa, cada um segue um dos 2 a 4 caminhos — **Retomar as bases**, **Reforçar**, **Consolidar**, **Aprofundar** — e depois todos se reencontram numa etapa comum. Cada aluno só vê o seu caminho. Há dois modelos pensados para isso: **Diferenciar desde o início** e **Remediar durante o percurso**.

- Em **Plano**, a barra de pontuações mostra que caminho se abre para cada número de respostas certas; os botões **−** e **+** antecipam ou adiam numa resposta certa o início de um caminho. **Adicionar um caminho**, **Retirar um caminho** e **Um só caminho para todos** alteram a bifurcação.
- O teste que encaminha é um **Quiz de múltipla escolha**, um **Quiz Verdadeiro/Falso** ou um **Teste**, colocado no fim da etapa que antecede os caminhos. Cada pergunta vale um ponto e o teste não propõe nova tentativa.
- **Ver como aluno** mostra a página do curso tal como o aluno a verá — antes do teste, durante o seu caminho, no fim — para a pontuação que escolher.
- Para reencaminhar um aluno, altere a nota dele no teste no livro de notas da plataforma.

Importe um percurso com caminhos para um curso **vazio**: o Moodle arruma as secções do ficheiro nas do curso, e as suas secções existentes receberiam as restrições dos caminhos. Todos os percursos terminam agora com uma secção **Fim do percurso**, e a duração estimada aparece por baixo de cada atividade.
<!-- /parcours-chemins -->
<!-- /parcours-complet -->
