const translations_es = {
  subtitle: "Creación Asistida de Recursos y Actividades para Moodle y Éléa",
  help_modal_title: "🚀 Guía completa de Caramel para docentes",
  help_modal_content: `
    <p>¡Bienvenido/a a <strong>Caramel</strong>! Esta guía está pensada para acompañarte paso a paso, incluso si estás empezando. Nuestro objetivo es ayudarte a crear actividades de aprendizaje interactivas de forma sencilla y eficaz.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Describir</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Elegir</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generar</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Visualizar y descargar</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Comunidad</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> Nuestra filosofía: ¡tú mantienes el control!</h4>
        <p>Con Caramel, la IA es asistente, pero tú pilotas. Conservas el control en cada etapa:</p>
        <ul>
            <li><strong>Antes:</strong> Defines el marco pedagógico rellenando los campos de descripción.</li>
            <li><strong>Durante:</strong> Una vez generado el contenido por la IA (el código JSON), puedes modificarlo directamente en el editor para ajustarlo.</li>
            <li><strong>Después:</strong> Incluso tras descargar el archivo, puedes abrirlo y editarlo en otras herramientas si es necesario.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Describe tu necesidad: el punto de partida</h4>
        <p>Todo empieza aquí. Cuanto más clara sea tu descripción, más pertinente será el resultado. Dos opciones:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Modo Rápido</span></h5>
            <p>Ideal para ir al grano. Completa dos campos:</p>
            <ul>
                <li><strong>¿Quién eres?</strong> Sé directo/a. No hace falta una frase. Ejemplos: <em>Profesor/a de matemáticas</em>, <em>Formador/a académico/a</em>.</li>
                <li><strong>¿Qué deseas abordar?</strong> Es el núcleo de tu solicitud. Sé lo más completo/a posible. Incluye tema, nivel y restricciones. Ejemplo: <em>Introducción a las fracciones para 1º de ESO, con ejemplos concretos como compartir una tarta.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Modo Avanzado</span></h5>
            <p>Para una solicitud más estructurada, este modo ofrece campos precisos:</p>
            <ul>
                <li><strong>Disciplina, Tema, Nivel:</strong> Para definir el contexto.</li>
                <li><strong>Número de elementos:</strong> ¡Muy importante! Corresponde al número de preguntas, fechas en una línea de tiempo, palabras en un glosario, etc.</li>
                <li><strong>Información adicional:</strong> Espacio para añadir consignas específicas, restricciones u otros detalles relevantes.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Activar lectura de documento</span><br>
            Esta opción permite basar la generación en contenido que aportes. Puedes <strong>copiar-pegar un texto</strong> o <strong>subir un documento (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacidad:</strong> No se preocupe, el procesamiento de su documento se realiza <strong>íntegramente en local en su ordenador</strong>. No se envía ningún dato a Internet.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Elegir el tipo de actividad</h4>
        <p>Una vez hecha la descripción, se activan las tarjetas de actividades. Haz clic en la que corresponda a tu objetivo pedagógico.</p>
        <details>
            <summary><strong>Haz clic aquí para ver el detalle de las actividades disponibles</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Actividades interactivas en formato H5P. Las marcadas con estrella <span class="feedback-star">*</span> incluyen por defecto retroalimentación detallada en 6 tramos de puntuación.</p>
            <ul>
                <li><strong>Línea de tiempo:</strong> Crea una línea temporal interactiva para presentar una secuencia de eventos.</li>
                <li><strong>Tarjetas de memoria:</strong> Crea tarjetas anverso/reverso para la memorización.</li>
                <li><strong>Quiz (Question Set) <span class="feedback-star">*</span>:</strong> Conjunto de preguntas variadas (MCQ, arrastrar-soltar, etc.).</li>
                <li><strong>Glosario:</strong> Crea un glosario o una FAQ en acordeón.</li>
                <li><strong>Crucigrama <span class="feedback-star">*</span>:</strong> Genera una cuadrícula de crucigrama a partir de definiciones.</li>
                <li><strong>Redacción <span class="feedback-star">*</span>:</strong> Propón un tema de escritura con corrección automática por palabras clave.</li>
                <li><strong>Resumen <span class="feedback-star">*</span>:</strong> El alumnado recompone un resumen correcto eligiendo las frases adecuadas.</li>
                <li><strong>Arrastrar palabras <span class="feedback-star">*</span>:</strong> Crea un texto donde se arrastran las palabras faltantes.</li>
                <li><strong>Texto con huecos <span class="feedback-star">*</span>:</strong> Se completan las palabras faltantes con el teclado.</li>
                <li><strong>Resaltar palabras <span class="feedback-star">*</span>:</strong> Señalar palabras específicas en un texto.</li>
                <li><strong>Verdadero/Falso:</strong> Preguntas binarias simples.</li>
                <li><strong>Opción múltiple <span class="feedback-star">*</span>:</strong> Crea MCQ con una o varias respuestas correctas.</li>
                <li><strong>Sopa de letras:</strong> Crea una cuadrícula de letras para encontrar palabras.</li>
                <li><strong>Ordenar párrafos <span class="feedback-star">*</span>:</strong> Reordenar párrafos en el orden correcto.</li>
                <li><strong>Serie de opción única <span class="feedback-star">*</span>:</strong> Serie de preguntas con una sola respuesta correcta.</li>
                <li><strong>Tarjetas de diálogo:</strong> Tarjetas interactivas anverso/reverso con texto y audio.</li>
                <li><strong>Texto con huecos avanzado <span class="feedback-star">*</span>:</strong> Cloze avanzado con retroalimentación específica por error.</li>
                <li><strong>Diagrama:</strong> Crea un gráfico circular o de barras para visualizar datos.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Test (XML / GIFT):</strong> Genera un banco de preguntas (MCQ, emparejamiento, etc.) para importar en un test de Moodle.</li>
                <li><strong>MCQ (MBZ):</strong> Crea una actividad de opción múltiple rápida y sencilla.</li>
                <li><strong>Emparejamiento (MBZ):</strong> Juego de asociación de pares.</li>
                <li><strong>Millonario (MBZ):</strong> Juego de cuestionario con dificultad creciente.</li>
                <li><strong>Glosario (XML):</strong> Archivo para importar una lista de definiciones en un glosario de Moodle.</li>
                <li><strong>Página (MBZ / HTML):</strong> Construye una página de curso estructurada y con formato visual para Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Generar y afinar el contenido</h4>
        <p>Tras hacer clic en una tarjeta, se abre una ventana. Aquí interactúas con la IA.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Opción A: Pantalla Simple - Generar con un clic</h5>
            <p>La vía rápida. Haz clic en <button class="help-btn-example-llm">Generar con un clic</button> para que la IA produzca el contenido y lo coloque directamente en el área de resultados a la derecha. Puedes elegir distintos modelos de IA (rápido, potente...) mediante la flecha del lado derecho del botón.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Opción B: Pantalla Guiada - Usar una IA externa</h5>
            <p>Para un control máximo. El prompt (instrucción para la IA) aparece a la izquierda.</p>
            <ol>
                <li>Modifica el prompt si lo deseas.</li>
                <li>Utilice el botón <strong>Copiar el prompt</strong> y abra una IA de acceso público de su elección en una nueva pestaña.</li>
                <li>Pega el prompt en la IA, recupera su respuesta y pégala en el área de resultados a la derecha en Caramel.</li>
            </ol>
            <p>Hay iconos útiles para ayudarte: <span class="help-badge-icon"><i class="fas fa-expand"></i> Pantalla completa</span> para mayor comodidad, y <span class="help-badge-icon"><i class="fas fa-lock"></i> Bloquear</span> para proteger el prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Visualizar y descargar</h4>
        <p>Una vez generado el contenido, puede visualizarlo, probarlo y descargarlo en diferentes formatos.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> Visualizar y probar</summary>
            <p>Tómese el tempo de revisar su actividad en la ventana de visualización:</p>
            <ul>
                <li><strong>Desplace</strong> el contenido para leerlo todo.</li>
                <li><strong>Pruebe</strong> la actividad como un alumno (haga clic, arrastre, escriba...).</li>
                <li>Para los contenidos <strong>Éléa/Magistère/Moodle</strong>, un simulador le muestra el resultado real.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Ventana de visualización" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Pruebe la actividad directamente en el simulador.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Descargar (Formatos y Exportaciones)</summary>
            <p>Tiene varias opciones para recuperar su trabajo:</p>
            <ul>
                <li><strong>Formato interactivo (botón principal):</strong> Para recuperar el archivo digital (ej: .h5p, .mbz) para subirlo a su plataforma.</li>
                <li><strong>Otros formatos (menú desplegable):</strong> Haga clic en la flecha para descargar en <strong>PDF, DOCX o ODT</strong> (útil para imprimir o archivar).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Menú de exportación" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Despliegue el menú para acceder a las exportaciones PDF, DOCX...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Integrar en Éléa/Magistère</h5>
        <p>Una vez descargado el archivo, así es como puede añadirlo a su curso:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Actividades H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Método simple:</strong> Activa la edición en tu curso y arrastra-suelta el archivo .h5p directamente en la sección elegida. Elige "Ajouter une activité H5P" y termina con el botón "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="Acceso rápido para añadir una actividad H5P" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Añade la actividad H5P y haz clic en DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Método recomendado (para diseñadores):</strong> Haz clic en "Añadir una actividad o un recurso", elige "Contenido interactivo (H5P)" y, en el campo "Editor", selecciona la pestaña "Subir" para continuar con "Subir un archivo". Termina con "Utiliser", añade los elementos necesarios y guarda. Este método garantiza que la actividad se incluya si compartes tu curso.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Página, Millonario, Emparejamiento, MCQ)</summary>
                <div class="import-content">
                    <p>Este formato importa una actividad completa a tu curso.</p>
                    <ol>
                        <li>
                            <p>Abre el menú de edición situado a la derecha de la pantalla. Si está plegado, utiliza la pequeña flecha para mostrarlo.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Menú de edición abierto en la columna derecha" style="width:75%;height:auto;">
                                    <figcaption><em>Menú de edición desplegado.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Flecha para desplegar el panel de edición" style="width:75%;height:auto;">
                                    <figcaption><em>Despliega el panel si es necesario.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Haz clic en "IMPORT/EXPORT" y luego en "Importer un parcours" en el submenú.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="Botón IMPORT/EXPORT en Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Selecciona Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Arrastra y suelta tu archivo .mbz en la zona de importación y haz clic en "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Zona para soltar el archivo MBZ" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Suelta el archivo y valida con IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>Finaliza haciendo clic en "CONTINUER" en el último paso: la actividad ya está en tu curso.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Actividad Glosario)</summary>
                <div class="import-content">
                    <p>Este formato permite importar una lista de definiciones en un glosario Éléa/Moodle.</p>
                    <ol>
                        <li>
                            <p>Crea una actividad Glosario vacía en tu curso y ábrela.</p>
                        </li>
                        <li>
                            <p>Una vez dentro del Glosario, haz clic en el botón "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="Botón IMPORTER DES ARTICLES en el glosario" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Haz clic en IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Arrastra y suelta tu archivo .xml en la zona de importación y haz clic en el botón "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Zona de arrastre para el archivo XML del glosario" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Deposita el archivo y valida con ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Tus artículos han sido detectados. Finaliza haciendo clic en el botón "CONTINUER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Confirmación de artículos detectados" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Haz clic en CONTINUER para finalizar la importación.</em></figcaption>
                            </figure>
                        </li>
                        <li>La importación ha terminado. Tus definiciones ya están disponibles en el Glosario.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> y <span class="help-badge-file">.GIFT</span> (Actividad Test)</summary>
                <div class="import-content">
                    <p>Estos formatos importan preguntas en el "Banco de preguntas".</p>
                    <ol>
                        <li>
                            <p>En tu curso Éléa, ve a la pestaña "Más", luego haz clic en "Banco de preguntas".</p>
                        </li>
                        <li>
                            <p>En el menú desplegable donde aparece "Preguntas", selecciona "Importar".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Selección del botón Importar en el banco de preguntas" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Selecciona Importar en el menú desplegable.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Marca el formato correspondiente a tu archivo:</p>
                            <ul>
                                <li><strong>Formato XML de Moodle</strong> (recomendado): formato completo compatible con todos los tipos de preguntas.</li>
                                <li><strong>Formato GIFT</strong>: alternativa más simple pero limitada en tipos de preguntas.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Elección entre Formato XML de Moodle y Formato GIFT" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Selecciona el formato adaptado a tu archivo.</em></figcaption>
                            </figure>
                        </li>
                        <li>Arrastra y suelta tu archivo en la zona de carga.</li>
                        <li>Haz clic en el botón "IMPORTATION". La pantalla mostrará las preguntas añadidas (por ejemplo: se han añadido 10 preguntas).</li>
                        <li>Termina haciendo clic en "CONTINUER" en la parte inferior de la página.</li>
                        <li>Las preguntas están ahora listas para ser añadidas a una actividad Test. Consulta el <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">tutorial de Éléa</a> para crear una actividad Test y cargar preguntas desde el banco.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternativa para la actividad Página)</summary>
                <div class="import-content">
                    <p>Para un control manual del contenido.</p>
                    <ol>
                        <li>Abre el archivo .html con un editor de texto (p. ej., Bloc de notas) y copia todo su contenido.</li>
                        <li>En Éléa, añade una actividad “Página”.</li>
                        <li>En el editor de la página, haz clic en el icono para cambiar a modo HTML (a menudo representado por "&lt;&gt;").</li>
                        <li>Pega el contenido copiado y guarda.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Comunidad y Soporte</h4>
        <p>Caramel es un proyecto vivo, ¡y tu opinión es valiosa!</p>
        <ul>
            <li><strong>Conversar y preguntar:</strong> Únete a la sala de <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> para intercambiar con la comunidad.</li>
            <li><strong>Reportar un error:</strong> ¿Algún problema? Crea un <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">issue</a>. Si es posible, adjunta el JSON que provocó el error: ayuda muchísimo.</li>
            <li><strong>Apoyar el proyecto:</strong> Si te gusta la herramienta, déjanos una estrella en la <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">página de la Forge</a>. ¡Es nuestra mejor recompensa!</li>
        </ul>
    </div>
    `,

  // ============================================================================
  // INTERFAZ PRINCIPAL
  // ============================================================================
  language: "Idioma",
  tutorial: "Tutorial",
  notifications: "Notificaciones",
  fast_mode: "Modo Rápido",
  guided_mode: "Modo Avanzado",
  who_are_you: "¿Quién es usted? (ej: Profesor, formador...)",
  what_to_address: "¿Qué desea abordar? (ej: La revolución francesa...)",
  level: "Para qué nivel (ej: Segundo de bachillerato profesional)",
  number_of_elements: "Número de preguntas/elementos en el módulo (ej: 5)",

  // ============================================================================
  // RAG/OCR
  // ============================================================================
  rag_title: "Adjuntar documentos (opcional)",
  rag_note: "Si desea que la IA trabaje exclusivamente a partir de sus documentos, pegue su texto o suba sus archivos aquí. De lo contrario, deje esta zona vacía para permitir que la IA busque la información por sí misma.",
  error_duplicate_file: "Este archivo ya ha sido añadido.",
  error_unsupported_format: "Formato no soportado. Formatos aceptados: ",
  ocr_scanned_page: "Página escaneada detectada, OCR en curso",
  ocr_image_processing: "Reconocimiento (OCR) de la imagen",
  ocr_initializing: "Inicializando el OCR...",
  ocr_loading_language: "Cargando el modelo de idioma...",
  ocr_preparing: "Preparando el análisis...",
  docx_processing: "Extrayendo texto DOCX...",
  pptx_processing: "Extrayendo texto PPTX...",
  odt_processing: "Extrayendo texto ODT...",
  odp_processing: "Extrayendo texto ODP...",
  file_loading: "Cargando el archivo...",
  extraction_success: "El documento ha sido procesado con éxito.",
  extraction_error: "Ha ocurrido un error durante el procesamiento.",
  error_fullscreen: "El modo pantalla completa ha fallado:",
  lock_text: "Bloquear",
  unlock_text: "Desbloquear",
  drag_drop_text: "Arrastre y suelte un documento aquí (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "o",
  upload_pdf_btn: "Seleccione un archivo",
  paste_your_text_here: "Copie y pegue su texto aquí...",
  rag_tags_tuto: "Encuentre a continuación los documentos depositados. Haga clic en el círculo de color para personalizar el resaltado de cada documento.",

  // ============================================================================
  // PESTAÑAS
  // ============================================================================
  tab_all: "Todo",
  tab_quiz: "Quiz & Tests",
  tab_text: "Manipulación de texto",
  tab_memory: "Memorización & Descubrimiento",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // ACTIVIDADES H5P - DETALLES
  // ============================================================================
  h5p_timeline_name: "Línea de tiempo",
  h5p_timeline_description: "Cree una línea de tiempo interactiva para presentar una secuencia de eventos.",
  h5p_flashcards_name: "Tarjetas de memoria",
  h5p_flashcards_description: "Cree tarjetas de dos caras para ayudar a la memorización de términos y definiciones.",
  h5p_quiz_set_name: "Quiz mixto",
  h5p_quiz_set_description: "Componga una serie de preguntas variadas (opción múltiple, arrastrar y soltar, etc.) para evaluar conocimientos.",
  h5p_quiz_set_qcm_name: "Quiz de opción múltiple",
  h5p_quiz_set_qcm_description: "Cree un quiz compuesto exclusivamente de preguntas de opción múltiple.",
  h5p_quiz_set_vf_name: "Quiz Verdadero/Falso",
  h5p_quiz_set_vf_description: "Crea un quiz compuesto exclusivamente por preguntas de tipo Verdadero o Falso.",
  h5p_glossary_name: "Glosario",
  h5p_glossary_description: "Cree un glosario o una FAQ en forma de acordeón desplegable.",
  h5p_crossword_name: "Crucigrama",
  h5p_crossword_description: "Genere una cuadrícula de crucigrama a partir de una lista de palabras y definiciones.",
  h5p_essay_name: "Redacción",
  h5p_essay_description: "Proponga un tema de redacción y defina palabras clave para una corrección automatizada.",
  h5p_summary_name: "Resumen",
  h5p_summary_description: "Los alumnos deben reconstruir un resumen correcto eligiendo las frases adecuadas.",
  h5p_drag_the_words_name: "Arrastrar palabras",
  h5p_drag_the_words_description: "Cree un texto con huecos donde los alumnos deban arrastrar las palabras faltantes.",
  h5p_fill_in_the_blanks_name: "Texto para completar",
  h5p_fill_in_the_blanks_description: "Los alumnos deben escribir las palabras faltantes en un texto directamente con el teclado.",
  h5p_mark_the_words_name: "Resaltar palabras",
  h5p_mark_the_words_description: "Pida a los alumnos que resalten ciertas palabras en un párrafo.",
  h5p_true_false_name: "Verdadero/Falso",
  h5p_true_false_description: "Cree una <strong style='color: red;'>única</strong> pregunta simple con una respuesta binaria: verdadero o falso.",
  h5p_multiple_choice_name: "Opción múltiple",
  h5p_multiple_choice_description: "Cree una <strong style='color: red;'>única</strong> pregunta de opción múltiple con una o varias respuestas correctas.",
  h5p_find_the_words_name: "Sopa de letras",
  h5p_find_the_words_description: "Cree una cuadrícula de letras donde los alumnos deban encontrar palabras.",
  h5p_sort_the_paragraphs_name: "Ordenar párrafos",
  h5p_sort_the_paragraphs_description: "Cree un conjunto de párrafos que los alumnos deban poner en el orden correcto.",
  h5p_single_choice_set_name: "Serie de elección única",
  h5p_single_choice_set_description: "Cree una serie de preguntas donde cada pregunta tenga solo una respuesta correcta.",
  h5p_dialog_cards_name: "Tarjetas de diálogo",
  h5p_dialog_cards_description: "Cree tarjetas interactivas de dos caras con texto y, opcionalmente, imágenes.",
  h5p_complex_fill_the_blanks_name: "Texto para completar complejo",
  h5p_complex_fill_the_blanks_description: "Cree un texto con huecos avanzado con comentarios específicos para cada error.",
  h5p_chart_name: "Diagrama",
  h5p_chart_description: "Cree un diagrama circular o de barras para visualizar datos.",

  // ============================================================================
  // ACTIVIDADES ÉLÉA/MOODLE - DETALLES
  // ============================================================================
  moodle_xml_name: "Cuestionario",
  moodle_xml_description: "Genere un banco de preguntas para importar directamente a una actividad de Cuestionario (en formato XML o GIFT)",
  moodle_xml_help: "Para añadir un archivo XML a una actividad «Cuestionario» en Moodle, primero cree la actividad. Luego, abra el menú <strong>Más</strong> y vaya a <strong>Banco de preguntas</strong>. En este menú, haga clic en <strong>Importar</strong>, elija el formato <strong>XML Moodle</strong>, seleccione su archivo y valide.",
  moodle_gift_name: "Formato GIFT",
  moodle_gift_description: "Cree preguntas en formato GIFT, una forma sencilla de importar preguntas a Moodle.",
  moodle_millionnaire_name: "Millonario",
  moodle_millionnaire_description: "Genere una actividad única tipo 'Millonario' de 6 preguntas graduales en términos de dificultad.",
  moodle_appariement_name: "Emparejamiento",
  moodle_appariement_description: "Genere una actividad de emparejamiento de 10 preguntas.",
  moodle_qcm_name: "Cuestionario de opción múltiple",
  moodle_qcm_description: "Genere una actividad simple de opción múltiple.",
  moodle_glossaire_xml_name: "Glosario (XML)",
  moodle_glossaire_xml_description: "Genere un glosario listo para ser importado en formato XML.",
  glossaire_success_generation: "¡Archivo {fileName} generado con éxito!",
  glossaire_error_creation: "Error durante la creación del XML del glosario:",
  glossaire_error_invalid_json: "El JSON debe contener un nombre ('name') y un array de entradas ('entries').",
  elea_page_name: "Página",
  elea_page_description: "Crear una página de contenido Éléa con formato visual.",

  // ============================================================================
  // MODAL DE GENERACIÓN
  // ============================================================================
  get_prompt_step: "1/2 Obtener el prompt para copiar",
  create_file_step: "2/2 Crear el archivo a partir del JSON",
  generate_one_click: "Generar en un clic",
  simple_mode: "Simple",
  advanced_mode: "Guiado",
  prompt_for_ia: "Prompt para la IA",
  copy_prompt: "Copiar el prompt",
  fullscreen_prompt: "Pantalla completa",
  exit_fullscreen_prompt: "Salir de pantalla completa",
  lock_prompt: "Bloquear",
  unlock_prompt: "Desbloquear",
  go_duck: "Copiar e ir a Duck.ai",
  go_mistral: "Copiar e ir a Le chat",
  create_h5p_file: "Crear el archivo H5P",
  integrate_h5p_libraries: "Integrar las librerías H5P:",
  paste_ia_result: "Pegue el resultado de la IA en la zona de abajo para crear su módulo.",
  generate_h5p: "Generar el H5P",
  create_xml_file: "Crear el archivo XML",
  paste_ia_result_xml: "Pegue el XML generado por la IA a continuación.",
  generate_xml_file: "Generar el archivo XML",
  export_mbz: "Formato MBZ",
  export_gift: "Formato GIFT",
  export_xml: "Formato XML",
  export_html: "Formato HTML",
  export_docx: "Formato DOCX",
  export_odt: "Formato ODT",
  export_pdf: "Formato PDF",
  export_error: "Error al exportar",
  create_mbz_file_appariement: "Crear el archivo de Emparejamiento (.mbz)",
  paste_ia_result_appariement: "Pegue el JSON generado por la IA a continuación. El título de la actividad se extraerá automáticamente del JSON.",
  generate_mbz_appariement: "Generar la actividad de Emparejamiento (mbz)",
  create_mbz_file_millionnaire: "Crear el archivo de Millonario (.mbz)",
  paste_ia_result_millionnaire: "Pegue el JSON generado por la IA a continuación. El título de la actividad se extraerá automáticamente del JSON.",
  generate_mbz_millionnaire: "Generar la actividad de Millonario (mbz)",
  generate_mbz_test: "Generar la actividad de Cuestionario (mbz)",
  create_mbz_file_qcm: "Crear el archivo de Opción Múltiple (.mbz)",
  paste_ia_result_qcm: "Pegue el JSON generado por la IA a continuación. El título de la actividad se extraerá automáticamente del JSON.",
  generate_mbz_qcm: "Generar la actividad de Opción Múltiple (mbz)",
  create_mbz_file_page: "Crear el archivo de Página (.mbz)",
  paste_ia_result_page: "Pegue el JSON generado por la IA a continuación para construir la página.",
  generate_mbz_page: "Generar la actividad de Página (mbz)",
  generate_prompts_placeholder: "El prompt para la IA aparecerá aquí una vez que haya completado al menos un campo del modo Rápido o del modo Avanzado.",
  paste_json_or_text: "Pegue aquí el contenido JSON o el texto generado por la IA para crear su actividad.",
  info_prompt_copy: "No pegue este prompt en el panel de la derecha. Cópielo en una IA de uso general para obtener el resultado y luego pegue dicho resultado en el panel de la derecha.",
  generate_with_llm: "Generar con la IA de Caramel",
  generation_in_progress: "Generación en curso, por favor espere...",
  request_sent_to_ia: "Petición lanzada a la IA, por favor espere...",
  generation_successful: "¡Contenido H5P generado con éxito!",
  generation_failed_empty: "La generación ha fallado. La respuesta estaba vacía.",
  generation_failed_error: "Error durante la generación: {errorMessage}",
  generation_failed_llm: "La generación a través de la IA de Caramel ha fallado. Causa: {errorMessage}",
  llm_small_summary: "Caramelo blando: rápido, ligero, perfecto para ejercicios flash y respuestas sin espera. Consume poco.",
  llm_large_summary: "Caramelo líquido: más rico, más matizado, ideal para tareas que requieren cierta profundidad. Consume más.",
  llm_xl_summary: "Caramelo duro: potente y complejo, reservado para proyectos ambiciosos. ¡Paciencia requerida, resultado garantizado! Consume mucho más.",
  llm_model_source: "Proveedor del modelo:",
  llm_model_parameters: "Tamaño del modelo:",
  llm_model_parameters_unit: "Mrd de parámetros",

  // ============================================================================
  // ANIMACIÓN CARAMEL
  // ============================================================================
  caramel_animation_step_1: "Echamos el azúcar en la cacerola...",
  caramel_animation_step_2: "Añadimos un poco de agua...",
  caramel_animation_step_3: "Calentamos a fuego medio...",
  caramel_animation_step_4: "El azúcar empieza a derretirse...",
  caramel_animation_step_5: "Empieza a coger color...",
  caramel_animation_step_6: "Removemos suavemente...",
  caramel_animation_step_7: "El caramelo adquiere un bonito color ámbar...",
  caramel_animation_step_8: "Añadimos la nata caliente...",
  caramel_animation_step_9: "¡Cuidado con las salpicaduras!",
  caramel_animation_step_10: "Mezclamos bien...",
  caramel_animation_step_11: "¡Ya casi está listo!",
  caramel_success_title: "¡Tu dulce está listo!",

  // ============================================================================
  // NOTIFICACIONES Y ERRORES
  // ============================================================================
  prompts_generated_successfully: "¡Prompts generados con éxito!",
  success_copy: "✓ ¡Copiado!",
  error_please_fill_fields: "Por favor, rellene al menos un campo del modo Rápido.",
  error_please_fill_guided_fields: "Por favor, rellene al menos un campo del modo Avanzado.",
  error_field_empty: "El campo está vacío. Por favor, genere primero un prompt.",
  error_copy_failed: "La copia ha fallado.",
  error_h5p_module_not_found: "Módulo '{moduleKey}' no encontrado.",
  error_invalid_quiz_json: "El JSON para el Quiz es inválido: {errorMessage}",
  error_invalid_json: "El JSON proporcionado es inválido. Error: {errorMessage}",
  error_h5p_creation: "Error de creación H5P: {errorMessage}",
  error_paste_ia_content: "Por favor, pegue el contenido generado por la IA.",
  error_compression_module_not_ready: "El módulo de compresión no está listo. Reinténtelo en un momento.",
  h5p_file_generated_successfully: "¡Archivo {fileName} generado con éxito!",
  h5p_creation_failed: "Fallo en la creación del archivo H5P: {errorMessage}",
  error_paste_json_content: "Por favor, pegue el contenido JSON generado.",
  error_paste_xml_content: "Por favor, pegue el contenido XML generado.",
  moodle_xml_success_generation: "¡Archivo {fileName} generado con éxito!",
  test_error_creation_mbz: "Error durante la creación del MBZ para el Cuestionario:",
  test_success_generation: "¡Archivo {fileName} generado con éxito!",
  test_error_generic: "Error:",
  test_backup_log: "Copia de seguridad creada automáticamente por Caramel\n",
  millionnaire_error_compression_libs: "Las librerías de compresión (Tar.js o fflate) no están cargadas. Por favor, compruebe su conexión a internet o refresque la página.",
  millionnaire_error_invalid_json: "La estructura del JSON es inválida. Asegúrese de que contenga un 'title' y un array 'questions' de 6 preguntas conformes al ejemplo.",
  millionnaire_activity_intro: "Participe en este juego para poner a prueba sus conocimientos.",
  millionnaire_backup_log: "Copia de seguridad creada automáticamente por Caramel\n",
  millionnaire_success_generation: "¡Archivo {fileName} generado con éxito!",
  millionnaire_error_creation_mbz: "Error durante la creación del MBZ:",
  millionnaire_error_generic: "Error:",
  appariement_error_invalid_json: "La estructura del JSON es inválida. Asegúrese de que contenga un 'title' y un array 'pairs' donde cada par tenga una 'question' y una 'answer'.",
  appariement_activity_intro: "Encuentre las parejas correspondientes.",
  appariement_success_generation: "¡Archivo {fileName} generado con éxito!",
  appariement_error_creation_mbz: "Error durante la creación del MBZ para el emparejamiento:",
  qcm_error_invalid_json: "La estructura del JSON es inválida. Asegúrese de que contenga un 'title' y un array 'questions' con al menos una pregunta y respuestas.",
  qcm_activity_intro: "Responda a las siguientes preguntas.",
  qcm_success_generation: "¡Archivo {fileName} generado con éxito!",
  qcm_error_creation_mbz: "Error durante la creación del MBZ para el Cuestionario de opción múltiple:",
  version_modal_title: "Nueva versión disponible",
  version_modal_message: "Actualmente está utilizando la versión {currentVersion}. Una versión más reciente ({latestVersion}) está disponible. Recargue la página para disfrutar de las últimas mejoras.",
  version_modal_update: "Cargar la nueva versión",
  version_modal_remind_later: "Recordármelo más tarde",

  prompt_header_pedagogical_context: "CONTEXTO PEDAGÓGICO",
  prompt_header_specific_rules: "REGLAS ESPECÍFICAS",
  prompt_header_pedagogical_rules: "REGLAS PEDAGÓGICAS",
  prompt_header_sources: "FUENTES",
  prompt_header_json_structure: "ESTRUCTURA JSON ESPERADA",
  prompt_header_rendering_example: "EJEMPLO DE RENDIDO",
  prompt_fallback_teacher: "un profesor",
  prompt_fallback_activity: "crear una actividad pedagógica",

  // ============================================================================

  // --- CLAVES COMUNES ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- Tu rol: [QUI]. Experto en didáctica e ingeniería pedagógica
- Tu objetivo pedagógico: [QUOI]
- Tu público: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Adaptación y vocabulario: Adapta el tono, el vocabulario y la dificultad de las instrucciones al público indicado. Sé relevante y motivador.
- Tono y feedback: Las instrucciones y comentarios deben ser constructivos, alentadores y orientados al aprendizaje.
- Conformidad: Adapta OBLIGATORIAMENTE los contenidos a las referencias oficiales vigentes. Salvo indicación contraria explícita, básate por defecto en los programas escolares franceses (Eduscol) para el público escolar, y en los textos reglamentarios de la formación profesional para adultos.
- Idioma: El contenido y las instrucciones deben estar redactados en español.`,

  SOURCES_COMMUNES: `- Utilizarás ÚNICAMENTE los siguientes textos para generar tu actividad.
---
[RAG]
---`,

  // ============================================================================
  // === TIMELINE (Línea de tiempo) ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Número de eventos: Mínimo 5 eventos || [NOMBRE_ELEMENTS] eventos.
- Periodos (era): Mínimo 2 periodos que cubran grupos de eventos.
- Medios: Añade créditos y leyendas para cada recurso si es posible. Busca activamente una imagen relevante y libre de derechos (ej: Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- **Objeto raíz:** Contiene la clave \`timeline\` (objeto).
- **Contenido de \`timeline\`:** Estructura principal de la actividad.
  - \`headline\`: Título general de la línea de tiempo (texto plano obligatorio).
  - \`text\`: Introducción cautivadora (soporta Markdown).
  - \`asset\`: Medio de portada (\`media\`: URL directa, \`caption\`: leyenda, \`credit\`: fuente).
  - \`date\`: Tabla de eventos cronológicos.
  - \`era\`: Tabla de periodos de fondo (definen franjas coloreadas en el fondo).
- **Estructura de los objetos \`date\` y \`era\`:**
  - \`startDate\`: **Formato estricto** \`YYYY,MM,DD\` o \`YYYY\`. (Obligatorio)
  - \`endDate\`: **Formato estricto** \`YYYY,MM,DD\` o \`YYYY\`. (Opcional, define una duración/fin de periodo)
  - \`headline\`: Título explícito del elemento (texto plano obligatorio).
  - \`text\`: Narración pedagógica. Usa \`**palabra**\` para negrita, \`*palabra*\` para cursiva y \`\\n\` para saltos de línea.
  - \`asset\`: (Opcional) Objeto de medio (\`media\`: URL directa de Wikimedia Commons, \`caption\`, \`credit\`).
  - \`tag\`: Palabra clave corta (ej: 'Política', 'Ciencia') que permite el filtrado.
- **LaTeX:** Usa el doble escape: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "La historia de la conquista espacial",
    "text": "Descubra las grandes etapas que han marcado la aventura del hombre en el **espacio**.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Despegue de la misión Apolo 11.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Lanzamiento del Sputnik 1",
        "text": "El **primer satélite artificial** es puesto en órbita por la URSS.",
        "tag": "Robótica"
      },
      {
        "startDate": "1969,07,20",
        "headline": "Primer paso en la Luna",
        "text": "Neil Armstrong se convierte en el primer hombre en caminar sobre la Luna durante la misión **Apolo 11**.",
        "tag": "Humano"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "La Guerra Fría espacial",
        "text": "Periodo de rivalidad intensa entre los Estados Unidos y la URSS.",
        "tag": "Contexto"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === CROSSWORD (Crucigrama) ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Número de palabras: Mínimo 6 palabras || [NOMBRE_ELEMENTS] palabras.
- Reglas tipográficas: Las respuestas (\`answer\`) solo deben contener letras. Cualquier palabra compuesta, acrónimo o expresión debe fusionarse en una sola palabra sin espacios, guiones u otros caracteres (ej: 'arco iris' se convierte en 'arcoiris', 'D-DAY' se convierte en 'DDAY').
- Pistas (\`clue\`): Está prohibido escribir la palabra a encontrar en la pista. Deben ser cortas y precisas.
- Pista suplementaria (\`extraClue\`): La IA debe juzgar la pertinencia de añadir una.`,

  CROSSWORD_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`title\`: Un título para la actividad.
- \`words\`: Una tabla de objetos que contienen:
  - \`answer\`: La palabra a adivinar (fusionada sin espacios ni guiones).
  - \`clue\`: La definición corta y precisa.
  - \`extraClue\` (opcional): Un objeto \`{"params": {"text": "..."}}\`. El texto puede usar \`**palabra**\` para negrita, \`*palabra*\` para cursiva y \`\\n\` para saltos de línea.
- \`taskDescription\`: Una instrucción clara y contextualizada. Usa \`**palabra**\` para negrita, \`*palabra*\` para cursiva y \`\\n\` para saltos de línea. Después de un salto de línea, especifica: "Para las palabras compuestas, no ponga ni espacios ni guiones (ej: 'llavero' para 'lleva-llaves')."
- \`overallFeedback\`: (REGLA ESTRICTA) Debes generar obligatoriamente una tabla de 6 objetos para el feedback final, contextualizado al tema del ejercicio, respetando escrupulosamente los siguientes rangos de puntuación: 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Crucigrama de Biología",
  "words": [
    {"answer": "Célula", "clue": "Unidad básica de la vida.", "extraClue": {"params": {"text": "Puede ser **animal** o **vegetal**."}}},
    {"answer": "ADN", "clue": "Molécula que porta la información genética."}
  ],
  "taskDescription": "**Completa** la cuadrícula con los términos de biología.\\nPara las palabras compuestas, no ponga ni espacios ni guiones (ej: 'guardamuebles' para 'guarda-muebles').",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Es necesario esforzarse para comprender bien estas nociones de biología."},
    {"from": 11, "to": 30, "feedback": "Casi lo tienes, continúa esforzándote para consolidar tus conocimientos."},
    {"from": 31, "to": 50, "feedback": "Es un buen comienzo, pero algunos puntos aún deben aclararse."},
    {"from": 51, "to": 70, "feedback": "¡Buen trabajo! Has comprendido lo esencial del tema."},
    {"from": 71, "to": 90, "feedback": "¡Muy buena puntuación! Dominas bien los conceptos abordados."},
    {"from": 91, "to": 100, "feedback": "¡Excelente! Tienes un dominio perfecto de esta lección."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Tarjetas de memoria) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Número de tarjetas: Mínimo 5 tarjetas || [NOMBRE_ELEMENTS] tarjetas.
- Asociación: El anverso y el reverso deben estar vinculados por un criterio único y estable (ej: definición -> término, evento -> fecha, autor -> obra). Utiliza la misma relación para todas las tarjetas y formula la instrucción así: «Asocia cada X con Y».`,

  FLASHCARDS_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El objeto debe contener:
  - \`title\`: Un título pertinente para la actividad.
  - \`description\`: Una instrucción clara para el alumno.
  - \`cards\`: Una tabla de objetos, donde cada objeto representa una tarjeta (flashcard) y contiene:
    - \`text\`: La pregunta o el término a adivinar (anverso).
    - \`answer\`: Respuesta o definición (reverso). Reglas de normalización: una sola palabra simple o un número (sin palabras compuestas), minúsculas (salvo nombres propios), sin artículo ni puntuación, números en cifras.
    - \`tip\` (opcional): Pista para ayudar al alumno. Puedes usar \`**palabra**\` para negrita y \`*palabra*\` para cursiva.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Capitales de Europa",
  "description": "Asocia cada país con su capital.",
  "cards": [
    {
      "text": "Francia",
      "answer": "parís",
      "tip": "Es la ciudad de la **Torre Eiffel**."
    },
    {
      "text": "España",
      "answer": "madrid",
      "tip": "Situada en el centro de la península *ibérica*."
    },
    {
      "text": "Italia",
      "answer": "roma",
      "tip": "Apodada la *Ciudad Eterna*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (Redacción) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Palabras clave: Mínimo 5 palabras clave o expresiones esperadas en la respuesta || [NOMBRE_ELEMENTS] palabras clave.
- Instrucción: La instrucción no debe enumerar las palabras clave esperadas para no dar la respuesta, salvo el nombre del tema general.`,

  ESSAY_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
El objeto debe contener:
- \`taskDescription\`: Una instrucción clara que invite al alumno a redactar un texto sobre el tema. Usa \`**palabra**\` para negrita (conceptos clave), \`*palabra*\` para cursiva y \`\\n\` para saltos de línea.
- \`keywords\`: Una tabla de objetos que definen las palabras clave esperadas. Cada objeto debe tener la forma:
  \`\`\`json
  {
    "keyword": "palabra o expresión",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (REGLA ESTRICTA) Debes generar obligatoriamente una tabla de 6 objetos para el feedback final, contextualizado al tema del ejercicio, respetando escrupulosamente los siguientes rangos de puntuación: 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Redacte un breve texto explicando el proceso de la **fotosíntesis**. Su respuesta debe abordar los elementos esenciales que permiten a las plantas producir su propia energía.",
  "keywords": [
    {"keyword": "luz", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "clorofila", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "dióxido de carbono", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "agua", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glucosa", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Es un comienzo. Vuelve a leer la lección sobre la fotosíntesis." },
    { "from": 11, "to": 30, "feedback": "Has identificado algunos elementos. Continúa esforzándote." },
    { "from": 31, "to": 50, "feedback": "Tu comprensión progresa. Intenta detallar más." },
    { "from": 51, "to": 70, "feedback": "¡Buen trabajo! Dominas las bases." },
    { "from": 71, "to": 90, "feedback": "¡Muy bien! Tu redacción muestra una sólida comprensión." },
    { "from": 91, "to": 100, "feedback": "¡Excelente! Tienes un dominio perfecto del tema." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (Glosario H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Número de entradas: Mínimo 5 términos || [NOMBRE_ELEMENTS] términos.
- Selección de términos: Identifica los conceptos técnicos, el vocabulario específico o las palabras complejas presentes en las fuentes.
- Definiciones: Concisas, precisas y perfectamente adaptadas al nivel pedagógico previsto.`,

  ACCORDION_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El JSON generado debe ser una TABLA con tantos objetos como términos mencionados anteriormente.
- \`title\`: La palabra clave, expresión o pregunta a definir.
- \`text\`: La definición. Usa \`**palabra**\` para negrita, \`*palabra*\` para cursiva y \`\\n\` para saltos de línea. Para las fórmulas matemáticas, usa el formato LaTeX con doble escape, por ejemplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Fotosíntesis", "text": "Proceso por el cual las plantas transforman la **luz** del **sol** en energía.\\nEs la base de la cadena alimentaria."},
  {"title": "Célula", "text": "**Unidad** básica de todos los seres vivos. Existen *eucariotas* y *procariotas*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (Resumen) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Número de etapas: Genera una tabla de mínimo 5 pasos || [NOMBRE_ELEMENTS] pasos para cubrir la totalidad del tema.
- Distractores: Propón al menos 2 distractores por etapa. Deben ser coherentes con el tema pero contener errores fácticos o lógicos plausibles.`,

  SUMMARY_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`intro\`: Una frase de introducción corta (ej: "Elija la afirmación correcta.").
- \`summaries\`: Tabla de objetos que constituyen las etapas. Cada objeto contiene:
  - \`summary\`: UNA tabla de frases (**Asociación**). La primera frase de la lista debe ser SIEMPRE el resumen correcto (afirmación exacta).
  - \`tip\`: (Opcional) Una pista contextual para ayudar al alumno.
- \`overallFeedback\`: Tabla de 6 objetos para la puntuación final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Usa el doble escape para LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Seleccione las afirmaciones correctas para construir el resumen de la lección.",
  "summaries": [
    {
      "summary": [
        "La fotosíntesis es un proceso biológico que permite a las plantas transformar la energía luminosa en energía química.",
        "La fotosíntesis es un proceso que ocurre únicamente durante la noche.",
        "La fotosíntesis es el mecanismo por el cual los animales respiran."
      ],
      "tip": "Piense en la luz como fuente de energía."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Es necesario esforzarse para comprender bien estas nociones." },
    { "from": 11, "to": 30, "feedback": "Casi lo tienes, continúa esforzándote." },
    { "from": 31, "to": 50, "feedback": "Es un buen comienzo, pero algunos puntos aún deben aclararse." },
    { "from": 51, "to": 70, "feedback": "¡Buen trabajo! Has comprendido lo esencial." },
    { "from": 71, "to": 90, "feedback": "¡Muy buena puntuación! Dominas bien los conceptos." },
    { "from": 91, "to": 100, "feedback": "¡Excelente! Tienes un dominio perfecto de esta lección." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (Arrastrar las palabras) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Número de palabras: Párrafo de mínimo 50 palabras con al menos 5 palabras para arrastrar || [NOMBRE_ELEMENTS] palabras.
- Unicidad: Cada palabra para arrastrar debe ser ÚNICA en el texto (sin duplicados).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
El objeto debe contener:
- \`taskDescription\`: Una instrucción clara.
- \`textField\`: El texto a completar. Cada frase debe terminar con un salto de línea \`\\n\`.
  - **Formato**: \`*palabra*\` para un elemento arrastrable.
- \`overallFeedback\`: Tabla de 6 objetos para la puntuación final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complete el texto arrastrando las palabras.",
  "textField": "El *sistema solar* está compuesto por *ocho* planetas que giran alrededor del *Sol*.\\nEl planeta más grande es *Júpiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Es necesario esforzarse." },
    { "from": 11, "to": 30, "feedback": "Casi lo tienes." },
    { "from": 31, "to": 50, "feedback": "Es un buen comienzo." },
    { "from": 51, "to": 70, "feedback": "¡Buen trabajo!" },
    { "from": 71, "to": 90, "feedback": "¡Muy buena puntuación!" },
    { "from": 91, "to": 100, "feedback": "¡Excelente!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (Texto para completar) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Número de huecos: Párrafo de mínimo 50 palabras con al menos 3 huecos || [NOMBRE_ELEMENTS] palabras.
- Equilibrio: No crees huecos en palabras triviales (artículos, preposiciones) a menos que sea el objetivo gramatical. Enfócate en conceptos clave.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
El objeto debe contener:
- \`taskDescription\`: Una instrucción clara y corta explicando el objetivo de la actividad en el contexto global. Usa \`**palabra**\` para negrita (conceptos clave), \`*palabra*\` para cursiva y \`\\n\` para saltos de línea.
- \`questions\`: Una tabla de cadenas de caracteres. Cada cadena representa un bloque de texto a completar.
  - **Sintaxis de los huecos**: Rodea las palabras a adivinar con asteriscos (ej: \`*palabra*\`).
  - **Alternativas**: Usa \`/\` para respuestas múltiples aceptadas (ej: \`*palabra1/palabra2*\`).
  - **Ayuda**: Usa \`:\` para añadir una burbuja de ayuda pedagógica (ej: \`*palabra:pista*\`).
- \`overallFeedback\`: (REGLA ESTRICTA) Debes generar obligatoriamente una tabla de 6 objetos para el feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complete los espacios en blanco del siguiente texto sobre el sistema solar.",
  "questions": [
    "La Tierra es un *planeta* del sistema *solar*.",
    "Gira alrededor del *Sol:nuestra estrella* en aproximadamente 365 días."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Es necesario esforzarse para comprender bien estas nociones."},
    {"from": 11, "to": 30, "feedback": "Casi lo tienes, continúa esforzándote para consolidar tus conocimientos."},
    {"from": 31, "to": 50, "feedback": "Es un buen comienzo, pero algunos puntos aún deben aclararse."},
    {"from": 51, "to": 70, "feedback": "¡Buen trabajo! Has comprendido lo esencial del tema."},
    {"from": 71, "to": 90, "feedback": "¡Muy buena puntuación! Dominas bien los conceptos abordados."},
    {"from": 91, "to": 100, "feedback": "¡Excelente! Tienes un dominio perfecto de esta lección."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (Resaltar las palabras) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Número de palabras: Párrafo de mínimo 50 palabras con al menos 5 palabras para resaltar || [NOMBRE_ELEMENTS] palabras.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
El objeto debe contener:
- \`taskDescription\`: Una instrucción clara y motivadora. Puedes usar \`**palabra**\` para negrita y \`*palabra*\` para cursiva únicamente aquí.
- \`textField\`: El texto completo que contiene las palabras a marcar.
  - **MARCADO:** Cada palabra a marcar debe estar INDIVIDUALMENTE rodeada de asteriscos. (Ej: \`*palabra1* *palabra2*\` es correcto; \`*palabra1 palabra2*\` es incorrecto).
  - **PUNTUACIÓN:** Los apóstrofos o signos de puntuación NO DEBEN formar parte NUNCA del marcado y deben estar separados de la palabra por un espacio. (Ej: Escribir \`el *pájaro*\` es correcto, \`el*pájaro*\` es incorrecto).
- \`overallFeedback\`: (REGLA ESTRICTA) Debes generar obligatoriamente una tabla de 6 objetos para el feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Haga clic en los **nombres propios** en el siguiente texto.",
  "textField": "*Madrid* es la capital de *España*. Es *Europa* lo que nos interesa.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Es necesario esforzarse para comprender bien estas nociones."},
    {"from": 11, "to": 30, "feedback": "Casi lo tienes, continúa esforzándote para consolidar tus conocimientos."},
    {"from": 31, "to": 50, "feedback": "Es un buen comienzo, pero algunos puntos aún deben aclararse."},
    {"from": 51, "to": 70, "feedback": "¡Buen trabajo! Has comprendido lo esencial del tema."},
    {"from": 71, "to": 90, "feedback": "¡Muy buena puntuación! Dominas bien los conceptos abordados."},
    {"from": 91, "to": 100, "feedback": "¡Excelente! Tienes un dominio perfecto de esta lección."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (Verdadero/Falso) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Pregunta: Una afirmación clara y sin ambigüedades.
- Respuesta: La respuesta debe ser estrictamente "true" (Verdadero) o "false" (Falso).
- Feedbacks: Prevé mensajes específicos para el éxito (\`feedbackOnCorrect\`) y el fallo (\`feedbackOnWrong\`) para reforzar el aprendizaje.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El objeto principal debe contener las siguientes claves:
  - \`question\`: (string) La afirmación a evaluar. Puede contener HTML.
  - \`correct\`: (string) La respuesta correcta, ya sea "true" o "false".
  - \`feedbackOnCorrect\`: (string) Comentario mostrado si la respuesta es correcta.
  - \`feedbackOnWrong\`: (string) Comentario mostrado si la respuesta es incorrecta.
- **Formato:** Utiliza la sintaxis Markdown para negrita (\`**texto**\`) y cursiva (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utiliza EXCLUSIVAMENTE el formato LaTeX encapsulado por doble escape: \`\\\\( ... \\\\)\`. NUNCA utilices el signo \`$\` solo.
- **Feedback/Comentarios:** Los comentarios NO DEBEN contener LaTeX ni Markdown.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo es la capital de Noruega.",
  "correct": "true",
  "feedbackOnCorrect": "¡Respuesta correcta! Oslo es, efectivamente, la capital de Noruega.",
  "feedbackOnWrong": "Respuesta incorrecta. La capital de Noruega es Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (Opción múltiple) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Pregunta: Una pregunta clara de opción múltiple.
- Respuestas: Propón varias opciones de respuesta (\`answers\`). Solo debe haber una respuesta correcta (\`"correct": true\`) y varios distractores plausibles (\`"correct": false\`).
- Feedbacks:
  - \`overallFeedback\`: (REGLA ESTRICTA) Debes generar obligatoriamente una tabla de 6 objetos para el feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El objeto principal debe contener las siguientes claves:
  - \`question\`: (string) El enunciado de la pregunta. Puede contener HTML.
  - \`answers\`: (array) Tabla de objetos, cada uno representando una respuesta.
    - \`text\`: (string) El texto de la respuesta.
    - \`correct\`: (boolean) \`true\` si es una respuesta correcta, \`false\` en caso contrario.
    - \`tipsAndFeedback\`: (object, opcional) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (array) Tabla de 6 objetos que definen los feedbacks por rango de puntuación.
- **Formato:** Utiliza la sintaxis Markdown para negrita (\`**texto**\`) y cursiva (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utiliza EXCLUSIVAMENTE el formato LaTeX encapsulado por doble escape: \`\\\\( ... \\\\)\`. NUNCA utilices el signo \`$\` solo.
- **Feedback/Comentarios:** Los comentarios NO DEBEN contener LaTeX ni Markdown.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "¿Cuál es el color real de la baya del grosellero negro?",
  "answers": [
    {"text": "Violeta muy oscuro", "correct": true, "tipsAndFeedback": { "chosenFeedback": "¡Exactamente!" }},
    {"text": "Azul", "correct": false, "tipsAndFeedback": { "chosenFeedback": "No, es más oscuro." }},
    {"text": "Negro", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Es necesario esforzarse." },
    { "from": 11, "to": 30, "feedback": "Casi lo tienes." },
    { "from": 31, "to": 50, "feedback": "Es un buen comienzo." },
    { "from": 51, "to": 70, "feedback": "¡Buen trabajo!" },
    { "from": 71, "to": 90, "feedback": "¡Muy buena puntuación!" },
    { "from": 91, "to": 100, "feedback": "¡Excelente!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (Sopa de letras) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Número de palabras: Al menos 6 palabras || [NOMBRE_ELEMENTS] palabras.
- Reglas tipográficas: Las palabras no deben contener ni acentos, ni números, ni signos de puntuación, ni espacios.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`taskDescription\`: Instrucción para el alumno.
- \`wordList\`: Lista de palabras a encontrar separadas por comas (sin espacios).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Encuentre las palabras ocultas en la cuadrícula.",
  "wordList": "CELULA,ADN,GEN,NUCLEO"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (Ordenar los párrafos) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Número de etapas: Mínimo 3 pasos o párrafos para ordenar || [NOMBRE_ELEMENTS] pasos.
- Lógica intrínseca: Los párrafos (\`paragraphs\`) deben formar una progresión lógica deducible por el contenido mismo.
- Prohibición de pistas artificiales: NO debes usar NUNCA numeración (1, 2, 3...), marcas temporales explícitas (fechas, horarios) o conectores lógicos demasiado simplistas ("Primero", "Luego", "Finalmente"), a menos que el usuario lo solicite explícitamente.
- Hilo conductor: Cada párrafo debe avanzar un hilo conductor único (ej: cadena de causalidad, paso de lo general a lo particular, o una secuencia preparación → acción → resultado). El orden debe ser deducible mediante la comprensión del sentido.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`taskDescription\`: Una instrucción clara (soporta Markdown).
- \`paragraphs\`: Una tabla de cadenas de caracteres (párrafos) presentados inicialmente en el **orden correcto** lógico en el JSON. Usa \`**palabra**\` para negrita, \`*palabra*\` para cursiva.
- \`overallFeedback\`: Tabla de 6 objetos para la puntuación final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Usa el doble escape para LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Ordene estos elementos para reconstruir la cadena de causalidad del calentamiento climático.",
  "paragraphs": [
    "Las actividades humanas, principalmente la combustión de energías fósiles, liberan masivamente **dióxido de carbono** a la atmósfera.",
    "Este exceso de gas refuerza el efecto invernadero natural, impidiendo que una parte de la radiación infrarroja salga de la Tierra.",
    "La energía así atrapada provoca un aumento progresivo de la temperatura media del aire y de los océanos.",
    "Este calentamiento global conlleva el derretimiento de los glaciares y una elevación preocupante del nivel del mar."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "La lógica de causalidad debe revisarse." },
    { "from": 11, "to": 30, "feedback": "Tienes algunos indicios de comprensión, vuelve a leer el texto." },
    { "from": 31, "to": 50, "feedback": "Es un buen comienzo en la puesta en orden." },
    { "from": 51, "to": 70, "feedback": "Buen análisis de la progresión lógica." },
    { "from": 71, "to": 90, "feedback": "¡Muy buen trabajo de estructuración!" },
    { "from": 91, "to": 100, "feedback": "¡Perfecto! El dominio de la estructura lógica es total." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (Serie de opciones únicas) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Número de preguntas: Mínimo 3 preguntas || [NOMBRE_ELEMENTS] preguntas.
- Respuestas: Propón de 2 a 3 distractores por pregunta. La primera respuesta de la lista \`answers\` debe ser siempre la correcta.
- Distractores: Coherentes pero con errores lógicos o fácticos plausibles.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`choices\`: Tabla de objetos que constituyen las preguntas. Cada objeto contiene:
  - \`question\`: El enunciado de la pregunta.
  - \`answers\`: Tabla de cadenas de caracteres (respuestas) donde la primera es siempre la respuesta correcta.
- \`overallFeedback\`: Tabla de 6 objetos para la puntuación final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Usa el doble escape para LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "¿Cuál es el principal gas responsable del efecto invernadero?",
      "answers": ["El dióxido de carbono", "El oxígeno", "El nitrógeno", "El argón"]
    },
    {
      "question": "¿Cuál es la capital de Francia?",
      "answers": ["París", "Lyon", "Marsella", "Burdeos"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Es necesario esforzarse." },
    { "from": 11, "to": 30, "feedback": "Casi lo tienes." },
    { "from": 31, "to": 50, "feedback": "Es un buen comienzo." },
    { "from": 51, "to": 70, "feedback": "¡Buen trabajo!" },
    { "from": 71, "to": 90, "feedback": "¡Muy buena puntuación!" },
    { "from": 91, "to": 100, "feedback": "¡Excelente!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (Tarjetas de diálogo) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Número de tarjetas: Mínimo 3 tarjetas || [NOMBRE_ELEMENTS] tarjetas.
- Principio de asociación: El anverso y el reverso deben estar conectados por un criterio único y estable (ej: definición -> término, evento -> fecha, autor -> obra).
- Instrucción: La descripción de la actividad debe seguir la fórmula: "Asocia cada [X] con su [Y]".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El objeto raíz DEBE contener \`title\`, \`description\` y \`dialogs\`.
- 1. \`title\`: El título de la actividad (Texto simple, **sin** Markdown ni HTML).
- 2. \`description\`: La instrucción o descripción (Formato HTML o texto simple).
- 3. \`dialogs\`: La tabla de asociación de las tarjetas: El anverso (text) y el reverso (answer).
- 4. \`text\`: El anverso de la tarjeta. Usa \`**palabra**\` para negrita y \`*palabra*\` para cursiva.
- 5. \`answer\`: El reverso de la tarjeta. Debe ser corta. Usa \`**palabra**\` para negrita y \`*palabra*\` para cursiva.
- 6. \`tips\` (opcional): Añade una pista para el anverso (\`front\`) y/o el reverso (\`back\`) solo si es pertinente. Texto simple **sin** formato.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Verbos irregulares",
  "description": "Encuentra el verbo en infinitivo.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identifica el pasado.", "back": "Forma base."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (Gráfico) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Número de elementos: Mínimo 5 elementos de comparación || [NOMBRE_ELEMENTS] elementos de comparación.
- Tipo de gráfico: Elige entre el gráfico circular (\`pieChart\`) o el gráfico de barras (\`barChart\`) según la pertinencia pedagógica.
- Etiquetas y colores: Los colores deben ser contrastados para una buena legibilidad. Las etiquetas deben ser cortas y claras.`,

  CHART_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`graphMode\`: El tipo de gráfico (\`pieChart\` o \`barChart\`).
- \`listOfTypes\`: Una tabla de objetos \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: El título del gráfico.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Arándanos"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Frambuesas"}
  ],
  "figureDefinition": "Gráfico de frutas preferidas"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Cuestionario H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Número de preguntas: Genera una tabla de mínimo 5 preguntas || [NOMBRE_ELEMENTS] preguntas.
- Variedad: Elige los tipos de actividades más adecuados entre los siguientes para variar el ejercicio:
  - **QCM** (\`H5P.MultiChoice\` 1.16)
  - **Arrastrar palabras** (\`H5P.DragText\` 1.10)
  - **Verdadero/Falso** (\`H5P.TrueFalse\` 1.8)
  - **Texto para completar** (\`H5P.Blanks\` 1.14)
  - **Resaltar palabras** (\`H5P.MarkTheWords\` 1.11)
  - **Ensayo / Pregunta abierta** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El objeto raíz debe contener:
  - \`title\`: El título de la actividad.
  - \`questions\`: Una tabla de objetos. Cada objeto representa una pregunta y debe contener:
    - \`library\`: El nombre y la versión exacta de la biblioteca (ej: \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: Un objeto que contiene una clave \`title\` (título corto de la pregunta).
    - \`params\`: Los datos de la pregunta.
  - \`overallFeedback\`: Tabla global de 6 objetos para la puntuación final del QuizSet.

**Detalles de \`params\` por tipo:**
1. **QCM (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (tabla de objetos con \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **Verdadero/Falso (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" o "false" en string)
3. **Texto para completar (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (tabla de strings con \`*palabra*\`)
4. **Arrastrar palabras (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (con \`*palabra*\`)
5. **Resaltar (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (con \`*palabra*\`)
6. **Ensayo (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (tabla de objetos)

**Cada pregunta, excepto las de tipo H5P.TrueFalse 1.8, debe incluir su propio \`overallFeedback\` (6 rangos).**
- **Formato:** Utiliza la sintaxis Markdown para negrita (\`**texto**\`) y cursiva (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utiliza EXCLUSIVAMENTE el formato LaTeX encapsulado por doble escape: \`\\\\( ... \\\\)\`. NUNCA utilices el signo \`$\` solo.
- **Feedback/Comentarios:** Los comentarios NO DEBEN contener LaTeX ni Markdown.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Cultura General Científica",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomía - QCM" },
      "params": {
        "question": "¿Qué planeta está más cerca del Sol?",
        "answers": [
          { "text": "Mercurio", "correct": true },
          { "text": "Venus", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorrecto."},
          {"from": 11, "to": 30, "feedback": "Insuficiente."},
          {"from": 31, "to": 50, "feedback": "Regular."},
          {"from": 51, "to": 70, "feedback": "Bien."},
          {"from": 71, "to": 90, "feedback": "Muy bien."},
          {"from": 91, "to": 100, "feedback": "Excelente."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Biología - Verdadero/Falso" },
      "params": {
        "question": "El ADN es una doble hélice.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Resultado bajo."},
    {"from": 11, "to": 30, "feedback": "Resultado insuficiente."},
    {"from": 31, "to": 50, "feedback": "Resultado regular."},
    {"from": 51, "to": 70, "feedback": "Buen resultado."},
    {"from": 71, "to": 90, "feedback": "Muy buen resultado."},
    {"from": 91, "to": 100, "feedback": "Resultado excelente."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (Quiz de opción múltiple H5P) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Número de preguntas: Genere un conjunto de 5 preguntas como mínimo || [NOMBRE_ELEMENTS] preguntas.
- Tipo: Debes generar ÚNICAMENTE preguntas de tipo **opción múltiple** (\`H5P.MultiChoice\` 1.16). No se permite ningún otro tipo.
- Calidad de las preguntas de opción múltiple:
  - Cada pregunta debe tener al menos 3 opciones de respuesta.
  - Según la naturaleza de la pregunta, puedes proponer una o varias respuestas correctas.
  - Los distractores (respuestas incorrectas) deben ser plausibles y relevantes.
  - Evita formulaciones negativas en las preguntas.
  - Varía la posición de la(s) respuesta(s) correcta(s).`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Genere ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El objeto raíz debe contener:
  - \`title\`: El título de la actividad.
  - \`questions\`: Un array de objetos. Cada objeto representa una pregunta de opción múltiple y debe contener:
    - \`library\`: Siempre \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: Un objeto que contiene una clave \`title\` (título corto de la pregunta).
    - \`params\`: Los datos de la pregunta.
  - \`overallFeedback\`: Array global de 6 objetos para la puntuación final del QuizSet.

**Detalles de \`params\` para opción múltiple (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: La pregunta formulada (string).
- \`answers\`: Array de objetos con \`text\` (string) y \`correct\` (boolean).
- \`behaviour\`: Objeto con \`singleAnswer\`: \`true\` si una sola respuesta correcta, \`false\` si varias respuestas correctas.

**Cada pregunta debe incluir su propio \`overallFeedback\` (6 tramos: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Formato:** Utiliza la sintaxis Markdown para negrita (\`**texto**\`) y cursiva (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utiliza EXCLUSIVAMENTE el formato LaTeX encapsulado por doble escape: \`\\\\( ... \\\\)\`. NUNCA utilices el signo \`$\` solo.
- **Feedback/Comentarios:** Los comentarios NO DEBEN contener LaTeX ni Markdown.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz de opción múltiple - Ciencias",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomía - Planetas" },
      "params": {
        "question": "¿Qué planeta está más cerca del Sol?",
        "answers": [
          { "text": "Venus", "correct": false },
          { "text": "Marte", "correct": false },
          { "text": "Mercurio", "correct": true },
          { "text": "Júpiter", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorrecto."},
          {"from": 11, "to": 30, "feedback": "Insuficiente."},
          {"from": 31, "to": 50, "feedback": "Regular."},
          {"from": 51, "to": 70, "feedback": "Bien."},
          {"from": 71, "to": 90, "feedback": "Muy bien."},
          {"from": 91, "to": 100, "feedback": "¡Excelente!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Biología - Orgánulos" },
      "params": {
        "question": "¿Qué orgánulos poseen su propio ADN?",
        "answers": [
          { "text": "El ribosoma", "correct": false },
          { "text": "La mitocondria", "correct": true },
          { "text": "El aparato de Golgi", "correct": false },
          { "text": "El cloroplasto", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorrecto."},
          {"from": 11, "to": 30, "feedback": "Insuficiente."},
          {"from": 31, "to": 50, "feedback": "Regular."},
          {"from": 51, "to": 70, "feedback": "Bien."},
          {"from": 71, "to": 90, "feedback": "Muy bien."},
          {"from": 91, "to": 100, "feedback": "¡Excelente!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Resultado bajo. Revise los conceptos básicos."},
    {"from": 11, "to": 30, "feedback": "Resultado insuficiente. Continúe esforzándose."},
    {"from": 31, "to": 50, "feedback": "Resultado regular. Está progresando."},
    {"from": 51, "to": 70, "feedback": "Buen resultado. Domina varios conceptos."},
    {"from": 71, "to": 90, "feedback": "Muy buen resultado. Va por buen camino."},
    {"from": 91, "to": 100, "feedback": "Resultado excelente. ¡Felicitaciones!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P Verdadero/Falso Quiz) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Número de preguntas: Genera una tabla de mínimo 5 preguntas || [NOMBRE_ELEMENTS] preguntas.
- Tipo: Debes generar ÚNICAMENTE preguntas de tipo **Verdadero/Falso** (\`H5P.TrueFalse\` 1.8). No se permite ningún otro tipo.
- Calidad de las preguntas:
  - Las afirmaciones deben ser claras y sin ambigüedades.
  - Evite las dobles negaciones.
  - Varíe entre afirmaciones verdaderas y falsas.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- El objeto raíz debe contener:
  - \`title\`: El título de la actividad.
  - \`questions\`: Una tabla de objetos. Cada objeto representa una pregunta y debe contener:
    - \`library\`: Siempre \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: Un objeto que contiene una clave \`title\` (título corto de la pregunta).
    - \`params\`: Los datos de la pregunta.
  - \`overallFeedback\`: Tabla global de 6 objetos para la puntuación final del QuizSet: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Detalles de \`params\` para Verdadero/Falso (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: La afirmación o pregunta formulada (string).
- \`correct\`: La respuesta correcta. DEBE ser un string: "true" o "false".
- **Formato:** Utiliza la sintaxis Markdown para negrita (\`**texto**\`) y cursiva (\`*texto*\`).
- **LaTeX:** Para fórmulas matemáticas, utiliza EXCLUSIVAMENTE el formato LaTeX encapsulado por doble escape: \`\\\\( ... \\\\)\`. NUNCA utilices el signo \`$\` solo.
- **Feedback/Comentarios:** Los comentarios NO DEBEN contener LaTeX ni Markdown.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz Verdadero/Falso - Geografía",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografía - Capitales" },
      "params": {
        "question": "La capital de Australia es Canberra.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografía - Continentes" },
      "params": {
        "question": "África es el continente más grande del mundo.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Resultado bajo. Revise los conceptos básicos."},
    {"from": 11, "to": 30, "feedback": "Resultado insuficiente. Continúe esforzándose."},
    {"from": 31, "to": 50, "feedback": "Resultado regular. Está progresando."},
    {"from": 51, "to": 70, "feedback": "Buen resultado. Domina varios conceptos."},
    {"from": 71, "to": 90, "feedback": "Muy buen resultado. Va por buen camino."},
    {"from": 91, "to": 100, "feedback": "Resultado excelente. ¡Felicitaciones!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Test Moodle/Éléa) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Número de preguntas: Al menos 10 preguntas || [NOMBRE_ELEMENTS] preguntas.
- Variedad: Elige los formatos de pregunta más adecuados de entre los siguientes:
  - **QCM** (\`multichoice\`)
  - **Emparejamiento** (\`matching\`)
  - **Numérico** (\`numerical\`)
  - **Verdadero/Falso** (\`truefalse\`)
  - **Respuesta corta** (\`shortanswer\`)
  - **Texto con huecos** (\`cloze\`)
- Distractores: Propón al menos 3 distractores por pregunta \`multichoice\`.`,

  ELEA_TEST_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.

El objeto principal debe contener las siguientes claves:
- \`bank_name\`: Un nombre corto y descriptivo para el banco de preguntas.
- \`bank_description\`: Una frase describiendo el contenido del banco.
- \`questions\`: Una tabla de objetos donde cada objeto representa una pregunta (\`type\`, \`content\`).
  - Cada pregunta debe tener un \`content.name\` corto y único (ej: "P1 - Tema").

**Reglas de formato:**
- **Números**: usa el punto para los decimales (ej: 12.34).
- **Cloze**: respeta estrictamente la sintaxis \`{1:TYPE:=Respuesta correcta~Respuesta incorrecta}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **Para el tipo \`multichoice\` (QCM):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "P1 - Geografía",
      "questiontext": "¿Cuál es la capital de Francia?",
      "feedback": "París es la capital política y económica de Francia.",
      "answers": [
        { "text": "París", "fraction": 100, "feedback": "¡Exactamente!" },
        { "text": "Lyon", "fraction": 0, "feedback": "No, Lyon es una gran ciudad pero no es la capital." },
        { "text": "Marsella", "fraction": 0, "feedback": "No, es la segunda ciudad de Francia." }
      ]
    }
  }
  \`\`\`

- **Para el tipo \`matching\` (Emparejamiento):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "P2 - Vocabulario Inglés",
      "questiontext": "Asocie cada palabra inglesa con su traducción al español.",
      "feedback": "¡Bravo! Dominas el vocabulario básico.",
      "subquestions": [
        { "text": "Dog", "answer": "Perro" },
        { "text": "Cat", "answer": "Gato" },
        { "text": "Bird", "answer": "Pájaro" }
      ]
    }
  }
  \`\`\`

- **Para el tipo \`numerical\` (Numérico):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "P3 - Matemáticas",
      "questiontext": "¿Cuál es el valor de Pi redondeado a dos decimales?",
      "feedback": "Pi es una constante irracional aproximadamente igual a 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "Es, en efecto, 3.14." }
    }
  }
  \`\`\`

- **Para el tipo \`truefalse\` (Verdadero/Falso):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "P4 - Ciencias",
      "questiontext": "El agua hierve a 100°C al nivel del mar.",
      "feedback": "Es una propiedad física estándar del agua.",
      "answer": { "value": true, "feedback_true": "Cierto.", "feedback_false": "Falso, el agua hierve a 100°C a 1 atm." }
    }
  }
  \`\`\`

- **Para el tipo \`shortanswer\` (Respuesta corta):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "P5 - Literatura",
      "questiontext": "¿Quién escribió 'Los Miserables'?",
      "feedback": "Es una de las grandes novelas del siglo XIX.",
      "answers": [
        { "text": "Victor Hugo", "fraction": 100, "feedback": "¡Correcto!" },
        { "text": "Hugo", "fraction": 100, "feedback": "¡Correcto!" }
      ]
    }
  }
  \`\`\`

- **Para el tipo \`cloze\` (Texto con huecos):**
  - Atención a la sintaxis: \`{1:SHORTANSWER:=Buena~Mala}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "P6 - Historia",
      "questiontext": "Napoleón nació en {1:SHORTANSWER:=1769} en {1:MULTICHOICE:=Ajaccio~Bastia~París}.",
      "feedback": "Napoleón Bonaparte nació en Córcega."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Millonario) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Número de preguntas: EXACTAMENTE 6 preguntas (no debe modificarse bajo ningún concepto).
- Progresividad: La dificultad de las preguntas debe ser **creciente y pedagógica**. Los elementos importantes para memorizar se colocan en las primeras preguntas.
- Veracidad: El contenido debe ser rigurosamente exacto y pertinente.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
Un objeto principal con las siguientes claves:
- \`title\`: El título de la actividad (Cadena de caracteres).
- \`questions\`: Un tablero de EXACTAMENTE 6 objetos, donde cada objeto representa una pregunta y contiene:
  - \`question\`: El enunciado de la pregunta (Cadena de caracteres).
  - \`goodanswer\`: La respuesta correcta (Cadena de caracteres).
  - \`badanswer\`: Un tablero de EXACTAMENTE 3 respuestas incorrectas (Tablero de cadenas de caracteres).
  - Para las fórmulas matemáticas, el uso de LaTeX está prohibido.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz sobre la Revolución Francesa",
  "questions": [
    {
      "question": "¿Qué evento marca el inicio de la Revolución Francesa el 14 de julio de 1789?",
      "goodanswer": "La toma de la Bastilla",
      "badanswer": ["El juramento del Juego de Pelota", "La ejecución de Luis XVI", "La batalla de Valmy"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Emparejamiento) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Número de parejas: Mínimo 5 pares || [NOMBRE_ELEMENTS] pares.
- Lógica: La relación entre los dos elementos debe ser evidente tras la lectura de las fuentes.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
Un objeto principal con las siguientes claves:
- \`title\`: El título de la actividad (Cadena de caracteres).
- \`intro\`: Instrucción corta o texto de introducción (Cadena de caracteres).
- \`pairs\`: Un tablero de objetos, donde cada objeto representa una pareja y contiene:
  - \`question\`: El término o elemento de la izquierda (Cadena de caracteres).
  - \`answer\`: La definición o elemento correspondiente a la derecha (Cadena de caracteres).
  - Para las fórmulas matemáticas, usa el formato LaTeX con doble escape, por ejemplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Emparejamiento de Historia",
  "intro": "Asocie cada fecha con el evento correspondiente de la Revolución Francesa.",
  "pairs": [
    {"question": "Toma de la Bastilla", "answer": "14 de julio de 1789"},
    {"question": "Abolición de los privilegios", "answer": "4 de agosto de 1789"},
    {"question": "Declaración de los Derechos del Hombre", "answer": "26 de agosto de 1789"},
    {"question": "Marcha de las mujeres", "answer": "5 de octubre de 1789"},
    {"question": "Fiesta de la Federación", "answer": "14 de julio de 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (Cuestionario Éléa) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Número de preguntas: Mínimo 5 preguntas || [NOMBRE_ELEMENTS] preguntas.
- Respuestas: Propón entre 2 y 5 opciones por pregunta.
- Distractores: Coherentes con el tema pero que contengan errores lógicos.`,

  ELEA_QCM_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`title\`: Título de la actividad.
- \`questions\`: Tablero de objetos. Cada objeto de pregunta debe contener:
  - \`text\`: Enunciado de la pregunta (puede contener HTML simple como \`**\` para negrita).
  - \`answers\`: Tablero de objetos \`{"text": "...", "iscorrect": 1/0}\`. \`1\` para respuesta correcta, \`0\` para incorrecta.
  - Para las fórmulas matemáticas, usa el formato LaTeX con doble escape, por ejemplo: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Cuestionario sobre la Revolución Francesa",
  "questions": [
    {
      "text": "¿Cuál es la fecha de la toma de la Bastilla?",
      "answers": [
        {"text": "14 de julio de 1789", "iscorrect": 1},
        {"text": "4 de agosto de 1789", "iscorrect": 0},
        {"text": "26 de agosto de 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (Glosario XML) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- Número de entradas: Al menos 5 términos || [NOMBRE_ELEMENTS] términos.
- Selección: Identifica palabras clave, acrónimos y conceptos técnicos.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- **Raíz:** Un objeto principal que contiene dos claves: \`name\` (el nombre del glosario) y \`entries\` (un tablero de objetos).
- **Cada objeto en \`entries\` debe contener:**
  - \`concept\`: La palabra o expresión a definir.
  - \`definition\`: Definición clara y concisa. Usa **palabra** para negrita, *palabra* para cursiva y \`\\n\` para saltos de línea, solo cuando sea pedagógicamente relevante.
  - \`aliases\` (opcional): Un tablero de cadenas para sinónimos o términos alternativos.
  - Para las fórmulas matemáticas, usa el formato LaTeX con doble escape: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Glosario de Periodismo",
  "entries": [
    {
      "concept": "Periodista",
      "definition": "Persona que **recopila** y difunde *información*.",
      "aliases": ["Reportero", "Cronista"]
    },
    {
      "concept": "Fuente",
      "definition": "Origen de una *información* verificada."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Página Éléa) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Estructura: La página debe contener mínimo 5 bloques diferentes || [NOMBRE_ELEMENTS] bloques.
- Lógica pedagógica: Los contenidos deben seguir una progresión coherente (ej: Inicio -> Objetivos -> Lección -> Detalles/Léxico -> Sitografía).
- Equilibrio de contenidos: Mezcla formatos para mantener el interés (texto, tablas, listas, recuadros).
- Contenidos obligatorios: Integra sistemáticamente un banner de apertura (\`#01_hero_header\`), recuadros de objetivos o puntos de atención (\`#04_callout_set\`), un léxico para términos técnicos (\`#06_lexique_table\`), al menos tres párrafos de contenido sustancial (\`#12_context_paragraphs\`) y una sitografía de referencia (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Genera ÚNICAMENTE un JSON completo y válido en un bloque de código. Tu respuesta DEBE empezar con \`{\` y terminar con \`}\`. Ningún otro texto o comentario.
- \`title\`: Título de la página.
- \`intro\`: Texto corto de introducción motivador.
- \`blocks\`: Un tablero de objetos que representan secciones. Cada bloque DEBE seguir una de las estructuras disponibles.

**Lista de bloques disponibles:**
- \`#01_hero_header\`: Banner de apertura. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Sumario con enlaces internos. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Hitos históricos en 3 tarjetas. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (máx 3 tarjetas)
- \`#04_callout_set\`: Paneles de Objetivos, Información (A saber), Alerta. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Cifras clave en tarjetas. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Tabla de vocabulario. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Glosario en pastillas. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Cuadrícula de monumentos con imágenes. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Comparación de dos imágenes.
- \`#10_table_comparison\`: Tabla de comparación.
- \`#11_definition_box\`: Recuadro de definición. \`{ "type": "#11_definition_box", "data": { "title": "Definición", "text": "..." } }\`
- \`#12_context_paragraphs\`: Párrafos de la lección. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Ficha detallada.
- \`#14_faq_block\`: Preguntas frecuentes (FAQ). \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Mitos vs Realidades.
- \`#17_method_image_desc\`: Metodología para describir una imagen.
- \`#18_sito_graphy\`: Sitografía. \`{ "type": "#18_sito_graphy", "data": { "title": "Sitografía", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Cita bilingüe.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "La Revolución Francesa",
  "intro": "Descubra los momentos clave de este periodo histórico.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "La Revolución", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Objetivos",
        "callouts": [{"type": "objectif", "text": "Comprender las causas de 1789."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "El Juramento del Juego de Pelota",
        "paragraphs": [
          "El 20 de junio de 1789, los diputados del Tercer Estado se reunieron...",
          "Este gesto marca el nacimiento de la Asamblea Nacional.",
          "Es un giro crucial hacia el fin del absolutismo."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Vocabulario",
        "headers": ["Término", "Definición"],
        "rows": [["Tercer Estado", "La mayor parte de la población..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Para profundizar",
        "links": [{"href": "https://...", "text": "Sitio oficial de Historia"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === TRADUCCIONES DE LA INTERFAZ H5P (ESTANDARIZADAS) ===
  // ============================================================================

  // Claves comunes
  h5p_check_answer: "Comprobar",
  h5p_try_again: "Reintentar",
  h5p_show_solution: "Mostrar solución",
  h5p_submit_answer: "Enviar",
  h5p_score: "Has obtenido @score de @total puntos",
  h5p_score_bar_label: "Has obtenido :num de :total puntos",
  h5p_tip_label: "Pista",
  h5p_next: "Siguiente",
  h5p_previous: "Anterior",
  h5p_close: "Cerrar",
  h5p_finish_header: "¿Terminar?",
  h5p_finish_body: "¿Estás seguro de que quieres terminar?",
  h5p_cancel_label: "Cancelar",
  h5p_finish_label: "Terminar",
  h5p_retry_header: "¿Reintentar?",
  h5p_retry_body: "¿Estás seguro de que quieres reintentar?",
  h5p_retry_confirm_label: "Confirmar",
  h5p_resume: "Reanudar",
  h5p_audio_direction: "Dirección del audio",
  h5p_a11y_check: "Comprueba las respuestas. Las respuestas se marcarán como correctas, incorrectas o sin respuesta.",
  h5p_a11y_show_solution: "Muestra la solución. La tarea se marcará con su solución correcta.",
  h5p_a11y_retry: "Reintenta la tarea. Borra todas las respuestas y empieza de nuevo.",

  // Crucigrama (Crossword)
  h5p_crossword_across: "Horizontal",
  h5p_crossword_down: "Vertical",
  h5p_crossword_extra_clue: "Pista extra",

  // Resumen (Summary)
  h5p_summary_intro: "Elige la afirmación correcta.",
  h5p_summary_solved_label: "Progreso:",
  h5p_summary_score_label: "Respuestas incorrectas:",
  h5p_summary_result_label: "Tu resultado",
  h5p_summary_feedback: "Has obtenido @score de @total afirmaciones correctas (@percent%).",
  h5p_summary_label_correct: "Correcto.",
  h5p_summary_label_incorrect: "¡Incorrecto! Por favor, inténtalo de nuevo.",
  h5p_summary_label_correct_answers: "Respuestas correctas.",
  h5p_summary_progress_text: "Progreso :num de :total",
  h5p_summary_alternative_incorrect_label: "Incorrecto",

  // Arrastrar palabras (Drag the Words)
  h5p_drag_words_score_feedback: "Puntuación: @score de @total.",
  h5p_drag_words_correct_text: "¡Correcto!",
  h5p_drag_words_incorrect_text: "¡Incorrecto!",

  // Completar huecos (Fill in the Blanks)
  h5p_blanks_not_filled_out: "Por favor, completa todos los huecos.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; es correcto",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; es incorrecto",
  h5p_blanks_answered_correctly: "Respondido correctamente",
  h5p_blanks_answered_incorrectly: "Respondido incorrectamente",
  h5p_blanks_solution_label: "Respuesta correcta:",
  h5p_blanks_input_label: "Hueco @num de @total",
  h5p_blanks_input_has_tip_label: "Pista disponible",
  h5p_blanks_feedback: "Has obtenido @score de @total huecos correctos.",
  h5p_blanks_checking_mode_header: "Modo de comprobación",

  // Marcar palabras (Mark the Words)
  h5p_mark_words_correct_answer: "¡Correcto!",
  h5p_mark_words_incorrect_answer: "¡Incorrecto!",
  h5p_mark_words_missed_answer: "¡Olvidado!",
  h5p_mark_words_display_solution_description: "La tarea se actualiza para mostrar la solución.",
  h5p_mark_words_a11y_full_text_label: "Texto completo legible",
  h5p_mark_words_a11y_clickable_text_label: "Texto completo donde se pueden marcar las palabras",
  h5p_mark_words_a11y_solution_mode_header: "Modo solución",
  h5p_mark_words_a11y_checking_header: "Modo de comprobación",

  // Tarjetas de memoria (Flashcards)
  h5p_flashcards_progress_text: "Tarjeta @card de @total",
  h5p_flashcards_your_answer: "Tu respuesta",
  h5p_flashcards_correct_answer: "Respuesta correcta",
  h5p_flashcards_incorrect_answer: "Respuesta incorrecta",
  h5p_flashcards_show_solution: "Respuesta correcta",
  h5p_flashcards_results: "Resultados",
  h5p_flashcards_of_correct: "@score de @total correctas",
  h5p_flashcards_show_results: "Mostrar resultados",
  h5p_flashcards_answer_short: "R:",
  h5p_flashcards_card_announcement: "Respuesta incorrecta. La respuesta correcta era @answer",
  h5p_flashcards_correct_announcement: "@answer es correcto.",
  h5p_flashcards_page_announcement: "Página @current de @total",

  // Ensayo (Essay)
  h5p_essay_feedbackHeader: "Comentario",
  h5p_essay_solutionTitle: "Ejemplo de solución",
  h5p_essay_remainingChars: "Caracteres restantes: @chars",
  h5p_essay_notEnoughChars: "¡Debes introducir al menos @chars caracteres!",
  h5p_essay_messageSave: "guardado",
  h5p_essay_placeholderText: "Empieza a escribir aquí...",
  h5p_essay_ariaYourResult: "Has obtenido @score de @total puntos",
  h5p_essay_ariaNavigatedToSolution: "Navegado a la solución de ejemplo después del área de texto.",

  // Verdadero/Falso (True/False)
  h5p_true_false_true_text: "Verdadero",
  h5p_true_false_false_text: "Falso",
  h5p_true_false_wrong_answer_message: "Respuesta incorrecta",
  h5p_true_false_correct_answer_message: "Respuesta correcta",

  // Encontrar las palabras (Find the Words)
  h5p_find_words_found: "@found de @totalWords palabras encontradas",
  h5p_find_words_time_spent: "Tiempo empleado",
  h5p_find_words_word_list_header: "Lista de palabras",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Ordenar párrafos (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "Mover arriba",
  h5p_sort_paragraphs_down: "Mover abajo",
  h5p_sort_paragraphs_disabled: "Desactivado",
  h5p_sort_paragraphs_paragraph: "Párrafo",
  h5p_sort_paragraphs_point: "@score punto",
  h5p_sort_paragraphs_seven_of_nine: "@current de @total",
  h5p_sort_paragraphs_current_position: "Posición actual en la lista",
  h5p_sort_paragraphs_instructions_selected: "Pulsa la barra espaciadora para reordenar",
  h5p_sort_paragraphs_instructions_grabbed: "Pulsa las flechas arriba y abajo para cambiar de posición, la barra espaciadora para soltar, escape para cancelar",
  h5p_sort_paragraphs_grabbed: "Sujetado",
  h5p_sort_paragraphs_moved: "Movido",
  h5p_sort_paragraphs_dropped: "Soltado",
  h5p_sort_paragraphs_reorder_cancelled: "Reordenación cancelada",
  h5p_sort_paragraphs_final_position: "Posición final",
  h5p_sort_paragraphs_next_paragraph: "Siguiente párrafo",
  h5p_sort_paragraphs_correct_paragraph: "Párrafo correcto en la posición",
  h5p_sort_paragraphs_list_description: "Lista de párrafos reordenables.",
  h5p_sort_paragraphs_list_description_check: "Lista de párrafos con resultados.",
  h5p_sort_paragraphs_list_description_solution: "Lista de párrafos con soluciones.",

  // Serie de opciones únicas (Single Choice Set)
  h5p_single_choice_solution_view_title: "Solución",
  h5p_single_choice_mute_button_label: "Silenciar",
  h5p_single_choice_slide_of_total: "Diapositiva @slide de @total",
  h5p_single_choice_solution_list_question_number: "Pregunta @question",
  h5p_single_choice_should_select: "Debe seleccionar",
  h5p_single_choice_should_not_select: "No debe seleccionar",

  // Tarjetas de diálogo (Dialog Cards)
  h5p_dialog_cards_answer: "Girar",
  h5p_dialog_cards_progress_text: "Tarjeta @card de @total",
  h5p_dialog_cards_card_front_label: "Anverso de la tarjeta",
  h5p_dialog_cards_card_back_label: "Reverso de la tarjeta",
  h5p_dialog_cards_audio_not_supported: "Tu navegador no soporta este formato de audio",
  h5p_dialog_cards_correct_answer: "¡Lo hice bien!",
  h5p_dialog_cards_incorrect_answer: "Lo hice mal",
  h5p_dialog_cards_round: "Ronda @round",
  h5p_dialog_cards_cards_left: "Tarjetas restantes: @number",
  h5p_dialog_cards_next_round: "Pasar a la ronda @round",
  h5p_dialog_cards_start_over: "Reintentar",
  h5p_dialog_cards_show_summary: "Siguiente",
  h5p_dialog_cards_summary: "Resumen",
  h5p_dialog_cards_summary_cards_right: "Tarjetas que has acertado:",
  h5p_dialog_cards_summary_cards_wrong: "Tarjetas que has fallado:",
  h5p_dialog_cards_summary_cards_not_shown: "Tarjetas no mostradas:",
  h5p_dialog_cards_summary_overall_score: "Puntuación global",
  h5p_dialog_cards_summary_cards_completed: "Tarjetas que has aprendido:",
  h5p_dialog_cards_summary_completed_rounds: "Rondas completadas:",
  h5p_dialog_cards_summary_all_done: "¡Bien hecho! ¡Has completado las @cards tarjetas @max veces seguidas!",

  // Conjunto de preguntas (Quiz Set)
  h5p_quiz_textual_progress: "Pregunta @current de @total",
  h5p_quiz_no_result_message: "Finalizado",
  h5p_quiz_result_message: "Tus resultados:",
  h5p_quiz_feedback_available: "Comentario disponible",
  h5p_quiz_read_feedback: "Leer comentario",
  h5p_quiz_wrong_answer: "Respuesta incorrecta",
  h5p_quiz_correct_answer: "Respuesta correcta",
  h5p_quiz_should_check: "Debería haber sido marcado",
  h5p_quiz_should_not_check: "No debería haber sido marcado",
  h5p_quiz_no_input: "Por favor, responde antes de ver la solución.",

  // ============================================================================
  // === AVISOS LEGALES - PIE DE PÁGINA ===
  // ============================================================================
  license_info: "GNU GPL v3.0 o posterior",
  ticket: "Ticket",
  legal_mentions: "Aviso legal",
  legal_title: "Avisos legales",
  legal_editor_title: "Editor de la aplicación",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Cargo:</strong> PLP Lengua-Historia",
  legal_editor_gauthier_remande_email: "<strong>Email:</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Dirección:</strong> 39 avenue de Chanzy, 53000 Laval, Francia",
  legal_editor_gauthier_remande_phone: "<strong>Teléfono:</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Cargo:</strong> Profesor de matemáticas y responsable de misión DRANE – Academia de Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>Email:</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Dirección:</strong> 30 boulevard de la République, 38200 Vienne, Francia",
  legal_editor_emmanuel_gaunard_phone: "<strong>Teléfono:</strong> +33 6 46 74 20 94",
  legal_app_description: "La aplicación web «Caramel» es un proyecto libre, no comercial, destinado a la creación de contenidos H5P y Éléa. No se requiere cuenta y no se recopilan datos personales.",
  legal_hosting_title: "Alojamiento",
  legal_host_name: "<strong>Proveedor</strong>: Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>Razón social</strong>: Ministerio de Educación Nacional y Juventud",
  legal_host_address: "<strong>Dirección</strong>: 110 rue de Grenelle, 75007 París, Francia",
  legal_host_phone: "<strong>Teléfono</strong>: +33 1 55 55 10 10",
  legal_publication_director_title: "Responsable de la publicación",
  legal_publication_director_name: "Gauthier REMANDE y Emmanuel GAUNARD, en calidad de editores voluntarios.",
  legal_terms_of_use_title: "Condiciones generales de uso",
  legal_terms_of_use_content: "Este sitio permite a los usuarios generar contenidos H5P y Éléa. La visualización se realiza localmente, sin transmisión de datos del usuario. El usuario es el único responsable del uso de los contenidos generados. La aplicación se ofrece de forma gratuita, sin garantía de funcionamiento o resultado. El editor declina toda responsabilidad por interpretaciones erróneas de los contenidos o usos inapropiados.",
  legal_intellectual_property_title: "Propiedad intelectual",
  legal_intellectual_property_content: "Todo el código fuente, elementos gráficos y contenidos están bajo licencia libre GNU AGPLv3. Su reutilización se permite bajo las condiciones de su licencia respectiva. Cualquier redistribución o modificación debe citar a los autores originales: Gauthier REMANDE y Emmanuel GAUNARD. Las imágenes utilizadas en los módulos H5P se recuperan del sitio H5P.org.",
  legal_personal_data_title: "Datos personales",
  legal_personal_data_content: "No se recopila ni almacena ningún dato personal. No se utilizan cookies de seguimiento.",
  legal_ai_models_title: "Modelos de Inteligencia Artificial",
  legal_ai_models_content: "La aplicación Caramel se apoya, únicamente durante la generación con un clic, en modelos de IA operados por ILAAS, una federación de infraestructuras de IA compartidas. Las solicitudes se canalizan a través de un flujo de trabajo n8n alojado por la Incubadora, y luego se transmiten a ILAAS para su ejecución en servidores de confianza en centros de datos certificados de Enseñanza Superior e Investigación (ESR). Caramel no ejecuta los modelos ni procesa o almacena datos propios; los datos se usan únicamente para ejecutar la solicitud y no se envían a IAs de consumo general. Los modelos propuestos actualmente incluyen {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) y {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Las modalidades de alojamiento, registro y conservación realizadas por ILAAS dependen de su política de privacidad y condiciones de servicio.",
  legal_user_requests_processing_title: "Tratamiento de solicitudes mediante n8n y la Incubadora del Ministerio de Educación Nacional",
  legal_user_requests_processing_content: "Nuestro sitio utiliza una solución técnica desarrollada por n8n, una herramienta open source alojada por la Incubadora del Ministerio de Educación Nacional. Este servicio permite transformar las solicitudes en datos estructurados (JSON) para interactuar con una inteligencia artificial soberana de la DINUM. No se expone información sensible sin cifrado, garantizando la seguridad de los intercambios.",
  legal_accessibility_title: "Accesibilidad",
  legal_accessibility_content: "La aplicación está diseñada para ser compatible con ordenadores, incluyendo modos oscuro/claro, navegación por teclado y alto contraste. Hay una mejora continua de la accesibilidad en curso según las recomendaciones del RGAA.",
  legal_applicable_law_title: "Ley aplicable",
  legal_applicable_law_content: "Este sitio está sujeto al derecho francés. En caso de litigio, las jurisdicciones competentes serán las del ámbito de Lyon.",
  legal_external_libraries_title: "Bibliotecas externas utilizadas",
  legal_external_libraries_intro: "La aplicación Caramel utiliza varias bibliotecas de código abierto bajo las siguientes licencias:",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licencia: CC BY 4.0, SIL OFL 1.1, MIT): Proporciona los iconos de la interfaz.",
  legal_library_jszip: "<strong>JSZip</strong> (Licencia: MIT o GPLv3): Permite crear archivos .h5p comprimiendo el contenido en un zip.",
  legal_library_clientzip: "<strong>client-zip</strong> (Licencia: MIT): Alternativa de alto rendimiento para generar archivos .h5p en el navegador.",
  legal_library_fflate: "<strong>fflate</strong> (Licencia: MIT): Biblioteca rápida para compresión/descompresión usada en archivos .mbz de Moodle.",
  legal_library_tarjs: "<strong>tar-js</strong> (Licencia: MIT): Crea archivos .tar necesarios para los módulos de Moodle.",
  legal_library_mammoth: "<strong>Mammoth</strong> (Licencia: BSD 2-Clause): Convierte documentos Word (.docx) a HTML.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (Licencia: Apache 2.0): Extrae texto de archivos PDF en el navegador.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (Licencia: Apache 2.0): Motor OCR para extraer texto de imágenes y PDFs escaneados.",
  legal_library_mathjax: "<strong>MathJax</strong> (Licencia: Apache 2.0): Utilizado para la renderización de fórmulas matemáticas (LaTeX) en las vistas previas.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (Licencia: MIT): Permite previsualizar los contenidos H5P directamente en el navegador sin requerir servidor o CMS (como Moodle o WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (Licencia: MIT): Biblioteca JavaScript para generar documentos PDF directamente en el navegador, utilizada para exportar contenidos educativos a formato PDF.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (Licencia: MIT): Extensión de jsPDF que permite generar tablas estructuradas en los documentos PDF exportados.",
  legal_library_docx: "<strong>docx</strong> (Licencia: MIT): Biblioteca JavaScript para crear documentos Word (.docx) en el navegador, utilizada para exportar contenidos educativos a formato Microsoft Word.",
  legal_library_ownership: "Cada biblioteca es propiedad de sus respectivos autores y se utiliza conforme a sus licencias.",

  // ============================================================================
  // === NOTIFICACIONES ===
  // ============================================================================
  no_notifications: "Sin notificaciones",
  clear_all: "Borrar todo",
  view: "Ver",
  today: "Hoy",
  error: "Error",
  download: "Descargar",
  edit_content: "Editar",
  compatible_with: "Compatible con:",
  preview_placeholder: "Vista previa disponible próximamente",
  previous: "Anterior",
  next: "Siguiente",
  close_modal: "Cerrar",
  loading: "Cargando...",
  preview_error: "No se puede previsualizar este archivo",
  simulator_warning: "Vista previa mediante el simulador de actividades: el renderizado final en Éléa puede ser ligeramente diferente.",
  editor_confirm_close_title: "Cambios no guardados",
  editor_confirm_close_message: "¿Desea guardar los cambios antes de salir?",
  editor_confirm_close_cancel: "Permanecer en el editor",
  editor_confirm_close_save: "Guardar y salir",
  editor_confirm_close_discard: "Salir sin guardar",

  // Editor JSON
  editor_title_prefix: "Edición:",
  editor_loading: "Cargando el editor...",
  editor_unknown_type: "Tipo de contenido no reconocido",
  editor_no_schema: "Esquema no disponible para este tipo",
  editor_init_error: "Error al inicializar el editor",
  editor_save: "Guardar",
  editor_cancel: "Cancelar",
  editor_unsaved_changes: "Cambios no guardados",
  editor_confirm_discard: "¿Realmente desea cancelar? Los cambios no guardados se perderán.",
  editor_validation_errors: "Errores de validación",

  // Secciones
  editor_section_general: "Información general",
  editor_section_question: "Pregunta",
  editor_section_questions: "Preguntas",
  editor_section_answers: "Respuestas",
  editor_section_answer: "Respuesta",
  editor_section_feedback: "Feedback",
  editor_section_cards: "Tarjetas",
  editor_section_sentences: "Frases",
  editor_section_events: "Eventos",
  editor_section_words: "Palabras",
  editor_section_keywords: "Palabras clave",
  editor_section_entries: "Entradas",
  editor_section_pairs: "Pares",
  editor_section_text: "Texto",

  // Campos generales
  editor_title: "Título",
  editor_description: "Descripción",
  editor_description_hint: "Instrucción mostrada a los alumnos",
  editor_intro: "Introducción",
  editor_task_description: "Instrucción",
  editor_question_text: "Enunciado de la pregunta",

  // Tarjetas
  editor_card: "Tarjeta",
  editor_card_front: "Anverso",
  editor_card_front_placeholder: "Pregunta o término",
  editor_card_back: "Reverso",
  editor_card_back_placeholder: "Respuesta o definición",
  editor_card_tip: "Pista",
  editor_add_card: "Añadir una tarjeta",

  // Respuestas
  editor_answer: "Respuesta",
  editor_answer_text: "Texto de la respuesta",
  editor_is_correct: "Correcto",
  editor_add_answer: "Añadir una respuesta",

  // Pistas y Feedback
  editor_tips_feedback: "Pistas y feedback",
  editor_tip: "Pista",
  editor_tip_optional: "Pista (opcional)",
  editor_tips_optional: "Pistas (opcional)",
  editor_tip_front: "Pista anverso",
  editor_tip_back: "Pista reverso",
  editor_chosen_feedback: "Feedback si se selecciona",
  editor_not_chosen_feedback: "Feedback si no se selecciona",
  editor_feedback_correct: "Feedback si es correcto",
  editor_feedback_wrong: "Feedback si es incorrecto",
  editor_overall_feedback: "Feedback global por puntuación",

  // Rangos de feedback
  editor_feedback_ranges_label: "Feedback según la puntuación",
  editor_feedback_placeholder: "Mensaje de feedback para este rango...",
  editor_add_range: "Añadir un rango",

  // Verdadero/Falso
  editor_correct_answer: "Respuesta correcta",
  editor_true: "Verdadero",
  editor_false: "Falso",

  // Rellenar huecos / Arrastrar palabras
  editor_sentence: "Frase",
  editor_sentence_text: "Texto de la frase",
  editor_add_sentence: "Añadir una frase",
  editor_blanks_hint: "Rodee las palabras a adivinar con *asteriscos*",
  editor_text_with_blanks: "Texto con palabras para colocar",
  editor_drag_words_hint: "Las palabras entre *asteriscos* serán elementos para arrastrar y soltar",

  // Línea de tiempo
  editor_event: "Evento",
  editor_add_event: "Añadir un evento",
  editor_start_date: "Fecha de inicio",
  editor_end_date: "Fecha de fin",
  editor_event_title: "Título del evento",
  editor_event_description: "Descripción",
  editor_event_tag: "Etiqueta",

  // Crucigrama
  editor_word: "Palabra",
  editor_add_word: "Añadir una palabra",
  editor_clue: "Pista/Definición",
  editor_orientation: "Orientación",
  editor_horizontal: "Horizontal",
  editor_vertical: "Vertical",
  editor_crossword_answer_hint: "La palabra en mayúsculas",

  // Ensayo
  editor_keyword: "Palabra clave",
  editor_keyword_text: "Palabra clave esperada",
  editor_keyword_weight: "Peso",
  editor_add_keyword: "Añadir una palabra clave",

  // Glosario
  editor_entry: "Entrada",
  editor_add_entry: "Añadir una entrada",
  editor_term: "Término",
  editor_definition: "Definición",

  // Moodle
  editor_question: "Pregunta",
  editor_add_question: "Añadir una pregunta",
  editor_pair: "Par",
  editor_add_pair: "Añadir un par",
  editor_left_element: "Elemento izquierdo",
  editor_right_element: "Elemento derecho",
  editor_choice: "Opción",
  editor_choice_text: "Texto de la opción",
  editor_add_choice: "Añadir una opción",

  // Acciones de elementos
  editor_add_item: "Añadir",
  editor_drag: "Arrastrar",
  editor_duplicate: "Duplicar",
  editor_delete: "Eliminar",
  editor_confirm_delete: "¿Realmente desea eliminar este elemento?",
  editor_min_items_reached: "Número mínimo de elementos alcanzado",
  editor_max_items_reached: "Número máximo de elementos alcanzado",

  // Errores de validación
  editor_error_required: "Este campo es obligatorio",
  editor_error_min_length: "Mínimo {0} caracteres",
  editor_error_max_length: "Máximo {0} caracteres",
  editor_error_pattern: "Formato inválido",
  editor_error_min_items: "Mínimo {0} elemento(s)",
  editor_error_max_items: "Máximo {0} elemento(s)",
  editor_error_number: "Debe ser un número",
  editor_error_min: "Mínimo {0}",
  editor_error_max: "Máximo {0}",
  editor_error_feedback_ranges: "Los rangos deben cubrir 0-100% sin solapamientos",
  editor_error_no_correct: "Al menos una respuesta debe ser correcta",
  editor_error_date_format: "Formato de fecha inválido (esperado: AAAA,M,D)",
  editor_error_no_blanks: "El texto debe contener al menos una palabra entre *asteriscos*",

  // QuizSet
  editor_library_type: "Tipo de biblioteca",
  editor_question_title: "Título de la pregunta",
  editor_question_params: "Parámetros de la pregunta",
  editor_parameters: "Parámetros",

  // Crucigrama
  editor_extra_clue: "Pista adicional",

  // FindTheWords
  editor_word_list: "Lista de palabras",

  // SingleChoiceSet
  editor_answers: "Respuestas posibles",

  // MarkTheWords
  editor_text_with_marks: "Texto con palabras para marcar",
  editor_mark_words_hint: "Rodee las palabras a marcar con *asteriscos*",

  // SortParagraphs
  editor_section_paragraphs: "Párrafos",
  editor_paragraph: "Párrafo",
  editor_add_paragraph: "Añadir un párrafo",
  editor_paragraph_text: "Texto del párrafo",

  // Summary
  editor_section_summaries: "Resúmenes",
  editor_summary_item: "Elemento de resumen",
  editor_add_summary_item: "Añadir un elemento",
  editor_statement: "Afirmación",
  editor_add_statement: "Añadir una afirmación",
  editor_statement_text: "Texto de la afirmación",

  // Moodle Test
  editor_question_type: "Tipo de pregunta",

  // Moodle Page
  editor_section_blocks: "Bloques",
  editor_block: "Bloque",
  editor_add_block: "Añadir un bloque",
  editor_block_type: "Tipo de bloque",
  editor_block_content: "Contenido del bloque",

  // Actividades específicas de Éléa
  // Glosario
  editor_glossary_name: "Nombre del glosario",

  // Millonario
  editor_good_answer: "Respuesta correcta",
  editor_bad_answers: "Respuestas incorrectas",
  editor_bad_answer: "Respuesta incorrecta",
  editor_add_bad_answer: "Añadir una respuesta incorrecta",

  // Test (banco de preguntas)
  editor_bank_name: "Nombre del banco",
  editor_bank_description: "Descripción del banco",
  editor_question_name: "Nombre de la pregunta",
  editor_question_feedback: "Feedback general",
  editor_answer_fraction: "Puntos/Puntuación",
  editor_answer_feedback: "Feedback de la respuesta",
  editor_subquestion: "Subpregunta",
  editor_add_subquestion: "Añadir una subpregunta",
  editor_numerical_value: "Valor numérico",
  editor_numerical_tolerance: "Tolerancia",
  editor_section_subquestions: "Subpreguntas",
  editor_section_content: "Contenido",
  editor_feedback_if_true: "Feedback si es verdadero",
  editor_feedback_if_false: "Feedback si es falso",

  // Mensajes
  editor_save_success: "Cambios guardados",
  editor_save_error: "Error al guardar los cambios",
  editor_regenerating: "Regenerando el archivo...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Página",
  doc_fmt_summary_header: "Índice",
  doc_fmt_quiz_title: "Cuestionario",
  doc_fmt_instructions: "📝 Instrucciones: Responda a las siguientes preguntas.",
  doc_fmt_question_header: "Pregunta",

  // --- Shared properties ---
  doc_fmt_type: "Tipo:",
  doc_fmt_feedbacks: "💬 Comentarios:",
  doc_fmt_global_feedbacks: "Comentarios globales",
  doc_fmt_answers: "Respuestas:",
  doc_fmt_correct_answer_true: "Respuesta correcta: VERDADERO ✓",
  doc_fmt_correct_answer_false: "Respuesta correcta: FALSO ✓",
  doc_fmt_text_if_true: "Texto si es verdadero:",
  doc_fmt_text_if_false: "Texto si es falso:",
  doc_fmt_text_with_answers: "Texto con las respuestas:",
  doc_fmt_text_with_marks: "Texto con las palabras a marcar:",
  doc_fmt_marks_to_find: "Palabras a marcar:",
  doc_fmt_keywords_expected: "Palabras clave esperadas:",
  doc_fmt_accepted_answers: "Respuestas aceptadas:",
  doc_fmt_text_to_complete: "Texto a completar:",
  doc_fmt_also_called: "🏷️ También llamado:",
  doc_fmt_image_not_found: "⚠️ [Imagen no encontrada]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Tarjetas de memoria",
  doc_fmt_card_index: "Tarjeta",
  doc_fmt_card_front: "Anverso:",
  doc_fmt_card_back: "Reverso:",
  doc_fmt_hint: "💡 Pista:",
  doc_fmt_crossword_title: "Crucigrama",
  doc_fmt_definitions_and_answers: "Definiciones y respuestas",
  doc_fmt_answer: "Respuesta:",
  doc_fmt_extra_hint: "💡 Pista adicional:",
  doc_fmt_timeline_events: "Eventos",
  doc_fmt_timeline_periods: "Períodos",
  doc_fmt_drag_the_words_title: "Arrastrar las palabras",
  doc_fmt_fill_in_the_blanks_title: "Completar los huecos",
  doc_fmt_mark_the_words_title: "Marcar las palabras",
  doc_fmt_glossary_title: "Glosario",
  doc_fmt_term_index: "Término",
  doc_fmt_chart_title: "Diagramme",
  doc_fmt_data: "Datos",
  doc_fmt_summary_title: "Resumen",
  doc_fmt_claim_index: "Afirmación",
  doc_fmt_multiple_choice_title: "Pregunta de opción múltiple",
  doc_fmt_single_choice_set_title: "Conjunto de preguntas de opción única",
  doc_fmt_true_false_title: "Pregunta de verdadero/falso",
  doc_fmt_dialog_cards_title: "Tarjetas de diálogo",
  doc_fmt_hint_front: "💡 Pista (anverso):",
  doc_fmt_hint_back: "💡 Pista (reverso):",
  doc_fmt_sort_paragraphs_title: "Ordenar los párrafos",
  doc_fmt_paragraphs_ordered: "Párrafos en el orden correcto",
  doc_fmt_find_the_words_title: "Sopa de letras",
  doc_fmt_words_to_find: "Palabras a encontrar",
  doc_fmt_matching_title: "Emparejamiento",
  doc_fmt_matching_instructions: "📝 Instrucciones: Empareje cada elemento con su correspondiente.",
  doc_fmt_pairs_to_match: "Pares a emparejar",
  doc_fmt_millionnaire_title: "¿Quién quiere ser millonario?",
  doc_fmt_millionnaire_instructions: "📝 Instrucciones: Encuentra la respuesta correcta entre las cuatro opciones.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Pregunta abierta",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "Examen",
  doc_fmt_associations: "Asociaciones:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Opción múltiple (QCM)",
  doc_fmt_type_matching: "Emparejamiento",
  doc_fmt_type_numerical: "Numérico",
  doc_fmt_type_truefalse: "Verdadero/Falso",
  doc_fmt_type_shortanswer: "Respuesta corta",
  doc_fmt_type_cloze: "Texto a completar (Cloze)",
  doc_fmt_type_blanks: "Texto a completar",
  doc_fmt_type_dragtext: "Arrastrar las palabras",
  doc_fmt_type_markwords: "Marcar las palabras",
  doc_fmt_type_essay: "Pregunta abierta",
  doc_fmt_type_default: "Pregunta",

  // Nuevas claves para la estructura pedagógica enunciado/corrección
  doc_fmt_correction_title: "Corrección",
  doc_fmt_proposed_answers: "Propuestas:",
  doc_fmt_correct_answer: "Respuesta correcta",
  doc_fmt_correct_answers: "Respuestas correctas:",
  doc_fmt_true: "Verdadero",
  doc_fmt_false: "Falso",
  doc_fmt_words_to_place: "Palabras a colocar:",
  doc_fmt_completed_text: "Texto completado:",
  doc_fmt_text_to_mark: "Texto en el que encontrar las palabras:",
  doc_fmt_words_count_to_find: "Número de palabras a encontrar",
  doc_fmt_words_to_mark: "Palabras a marcar:",
  doc_fmt_answer_space: "Espacio para la respuesta:",
  doc_fmt_open_answer: "Respuesta abierta - evaluación según los criterios definidos por el profesor.",
  doc_fmt_definitions: "Definiciones",
  doc_fmt_letters: "letras",
  doc_fmt_summary_instructions: "Para cada grupo, elija la afirmación correcta.",
  doc_fmt_sort_instructions: "Ponga los siguientes párrafos en el orden correcto.",
  doc_fmt_paragraphs_to_sort: "Párrafos a ordenar",
  doc_fmt_correct_order: "Orden correcto",
  doc_fmt_find_instructions: "Encuentre",
  doc_fmt_hidden_words: "palabras ocultas en la cuadrícula.",
  doc_fmt_hints: "Pistas",
  doc_fmt_flashcards_instructions: "Para cada tarjeta, busque la respuesta correspondiente a la pregunta.",
  doc_fmt_elements_to_match: "Elementos a asociar:",
  doc_fmt_possible_matches: "Posibles correspondencias:",
  doc_fmt_correct_associations: "Asociaciones correctas:",

};