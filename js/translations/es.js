const translations_es = {
    subtitle: "Creación Asistida de Recursos y Actividades para Magistère y Éléa",
    help_button: "Ayuda",
    help_modal_title: "🚀 Guía completa de Caramel para docentes",
    help_modal_content: `
    <p>¡Bienvenido/a a <strong>Caramel</strong>! Esta guía está pensada para acompañarte paso a paso, incluso si estás empezando. Nuestro objetivo es ayudarte a crear actividades de aprendizaje interactivas de forma sencilla y eficaz.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Describir</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Elegir</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generar</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Descargar</a>
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
            Esta opción permite basar la generación en contenido que aportes. Puedes <strong>copiar-pegar un texto</strong> o <strong>subir un archivo PDF</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacidad:</strong> Tranquilidad: el procesamiento de tu documento se realiza <strong>totalmente de forma local en tu ordenador</strong>. No se envían datos a Internet.</p>
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
            <h5><i class="fas fa-rocket"></i> Opción A: Generar con un clic</h5>
            <p>La vía rápida. Haz clic en <button class="help-btn-example-llm">Generar con un clic</button> para que la IA produzca el contenido y lo coloque directamente en el área de resultados a la derecha. Puedes elegir distintos modelos de IA (rápido, potente...) mediante la flecha del lado derecho del botón.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Opción B: Usar una IA externa</h5>
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
        <h4><span class="help-step-number">4</span> Descargar e integrar tu actividad</h4>
        <p>Cuando el contenido esté listo, haz clic en el botón de descarga (p. ej.: <button class="help-btn-example-download">Generar el H5P</button>). Así se integran los archivos en Éléa/Moodle:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Actividades H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>Método simple:</strong> Activa la edición en tu curso y arrastra-suelta el .h5p directamente en la sección deseada. Ideal para uso rápido.</li>
                        <li><strong>Método recomendado (para diseñadores):</strong> “Añadir actividad o recurso” → “Contenido interactivo (H5P)” → campo “Archivo”: sube tu .h5p. Garantiza que la actividad se incluya al compartir tu curso.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Página, Millonario, Emparejamiento, MCQ)</summary>
                <div class="import-content">
                    <p>Este formato importa una actividad completa a tu curso.</p>
                    <ol>
                        <li>En tu curso, menú de ajustes (rueda) → “Restaurar”.</li>
                        <li>Arrastra-suelta tu archivo .mbz en el área de importación.</li>
                        <li>Sigue los pasos haciendo clic en “Continuar”. La actividad se añadirá al curso.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> y <span class="help-badge-file">GIFT</span> (Actividad Test)</summary>
                <div class="import-content">
                    <p>Estos formatos importan preguntas en el “Banco de preguntas”.</p>
                    <ol>
                        <li>Menú “Más” del curso → “Banco de preguntas”.</li>
                        <li>Haz clic en la pestaña “Importar”.</li>
                        <li>Elige “Formato XML de Moodle” o “Formato GIFT”.</li>
                        <li>Arrastra tu archivo al área “Importar” y confirma.</li>
                        <li>Tus preguntas están ahora en el banco, listas para agregarse a un “Test”.</li>
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
                        <li>En el editor de la página, haz clic en el icono para cambiar a modo HTML (a menudo representado por \`</\>\`).</li>
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
            <li><strong>Conversar y preguntar:</strong> Únete a la sala de <a href="https://tchap.beta.gouv.fr/#/room/#Caramel:agent.dinum.tchap.gouv.fr" target="_blank" rel="noopener noreferrer">Tchap</a> para intercambiar con la comunidad.</li>
            <li><strong>Reportar un error:</strong> ¿Algún problema? Crea un <a href="https://github.com/g-rem/caramel/issues" target="_blank" rel="noopener noreferrer">issue</a>. Si es posible, adjunta el JSON que provocó el error: ayuda muchísimo.</li>
            <li><strong>Apoyar el proyecto:</strong> Si te gusta la herramienta, déjanos una estrella en la <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">página de la Forge</a>. ¡Es nuestra mejor recompensa!</li>
        </ul>
    </div>
    `,
    fast_mode: "Modo Rápido",
    guided_mode: "Modo Avanzado",
    who_are_you: "¿Quién eres? (ej: Profesor, formador...)",
    what_to_address: "¿Qué quieres abordar? (ej: La naturaleza de un ángulo en 6º...)",
    discipline: "Disciplina (ej: Historia)",
    theme: "Tema (ej: La Revolución Francesa)",
    level: "Nivel (ej: Segundo de bachillerato profesional)",
    number_of_elements: "Número de elementos (ej: 10)",
    additional_info: "Información adicional...",
    generate_prompts: "Generar prompts",
    h5p_tab: "H5P",
    moodle_tab: "Módulos Éléa/Moodle",

    // General Context (Advanced Mode)
    prompt_expert_intro: "Eres un profesor experto en pedagogía que adaptará el tono y el vocabulario según el contenido de los programas actuales y el nivel de los alumnos para el curso de ",
    prompt_context_title: "**Contexto :**",
    prompt_subject: "- **Materia :**",
    prompt_student_level: "- **Nivel de los alumnos :**",
    prompt_theme: "- **Tema :**",
    prompt_number_of_elements: "- **Número de elementos :**",
    prompt_additional_info: "- **Información adicional :**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "Soy un(a) **",
    prompt_simple_intro_part2: "** y deseo **",
    prompt_language_instruction: "El contenido generado debe estar en español, a menos que se especifique otro idioma en la solicitud.",
    prompt_code_block_instruction: "Debes generar el resultado en un bloque de código.",

    // Timeline Prompt
    timeline_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Timeline\".",
    timeline_prompt_mission: "**Tu misión :**",
    timeline_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de tipo Timeline. El JSON debe ser directamente utilizable.",
    timeline_prompt_json_structure_title: "**Estructura JSON esperada :**",
    timeline_prompt_json_structure_main_object: "El objeto principal debe contener una clave \"timeline\". Este objeto \"timeline\" debe incluir :",
    timeline_prompt_headline: "`headline`: Un título general para la línea de tiempo.",
    timeline_prompt_text: "`text`: Un párrafo introductorio corto.",
    timeline_prompt_asset: "`asset`: Un objeto para la imagen de portada con `media` (URL), `caption` (leyenda) y `credit` (fuente).",
    timeline_prompt_date_array: "`date`: Un array que contiene ${nombreQuestions} objetos, cada uno representando un evento.",
    timeline_prompt_era_array: "`era`: Un array de objetos para definir períodos que cubren varios eventos.",
    timeline_prompt_content_rules_title: "**Reglas de contenido :**",
    timeline_prompt_rule1: "1.  Cada evento en el array `date` debe tener :",
    timeline_prompt_rule1_startDate: "-   `startDate` y `endDate`: Fecha en formato \"AAAA,MM,DD\" o \"AAAA\". Usa `endDate` para definir un período.",
    timeline_prompt_rule1_headline: "-   `headline`: Título del evento.",
    timeline_prompt_rule1_text: "-   `text`: Descripción del texto. Usa `*palabra*` para negrita, `**palabra**` para cursiva y `\\n` para saltos de línea.",
    timeline_prompt_rule1_asset: "-   `asset`: Un objeto opcional para una imagen que ilustre el evento.",
    timeline_prompt_rule1_tag: "- `tag`: Una palabra clave que caracteriza el período (ej: 'historia', 'ciencia').",
    timeline_prompt_rule2: "2.  Para cada `asset`, busca activamente una imagen relevante y libre de derechos (ej: Wikimedia Commons). La URL en `media` debe ser un enlace directo y válido. Indica la fuente y la licencia en `credit`. Si no se encuentra ninguna imagen adecuada, omite el objeto `asset` por completo.",
    timeline_prompt_rule3: "3.  Para cada período (`era`), añade un campo `text` con una breve descripción y un `tag`.",
    timeline_prompt_example_json_title: "**Ejemplo de estructura JSON :**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Título de la línea de tiempo",
"text": "Introducción al tema de la línea de tiempo.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Inicio de la Primera Guerra Mundial",
"text": "Austria-Hungría declara la guerra a Serbia.",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "El archiduque Francisco Fernando poco antes de su asesinato.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "Guerra"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Armisticio de 1918",
"text": "Firma del armisticio en Rethondes, que marcó el fin de los combates.",
"tag": "Tratado"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Primera Guerra Mundial",
"text": "Es el período de la Gran Guerra.",
"tag": "Período histórico"
}
]
}
}
\`\`\` `,  
    timeline_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario. El resultado será utilizado directamente por otra herramienta.",

    // Crossword Prompt
    crossword_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Crossword\".",
    crossword_prompt_mission: "**Tu misión :**",
    crossword_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad de crucigrama H5P.",
    crossword_prompt_json_structure_title: "**Estructura JSON esperada :**",
    crossword_prompt_json_structure_main_object: "El objeto debe contener :",
    crossword_prompt_title: "`title`: Un título para la actividad.",
    crossword_prompt_words_array: "`words`: Un array de ${nombreQuestions} objetos, cada uno con :",
    crossword_prompt_answer: "`answer`: La palabra a adivinar.",
    crossword_prompt_clue: "`clue`: La definición correspondiente. Está prohibido escribir la palabra buscada en la pista.",
    crossword_prompt_extra_clue_optional: "`extraClue` (opcional): Un objeto con una pista adicional. El texto de la pista puede usar `*palabra*` para negrita, `**palabra**` para cursiva y `\\n` para saltos de línea. La IA debe valorar si conviene añadirla.",
    crossword_prompt_task_description: "`taskDescription`: Una consigna clara y contextualizada. Usa `*palabra*` para negrita, `**palabra**` para cursiva y `\\n` para saltos de línea. Tras un salto de línea, especifica la regla para palabras compuestas: \"Escribe las palabras compuestas como una sola palabra, sin espacios ni guiones.\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",
    crossword_prompt_content_rules_title: "**Reglas de contenido:**",
    crossword_prompt_rule1: "1.  REGLA ESTRICTA: Las respuestas (`answer`) solo deben contener letras. Cualquier palabra compuesta, acrónimo o expresión se fusiona en una sola palabra sin espacios, guiones ni otros caracteres.",
    crossword_prompt_rule2: "2.  Las definiciones (`clue`) deben ser cortas y precisas.",
    crossword_prompt_rule3: "3.  El resto de la estructura JSON (comportamiento, tema, etc.) debe mantenerse tal cual.",
    crossword_prompt_example_json_title: "**Ejemplo de JSON para una palabra :**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Crucigrama de Biología",
"words": [
{
"answer": "Célula",
"clue": "Unidad básica de la vida.",
"extraClue": {
"params": {
"text": "Puede ser *animal* o *vegetal*."
}
}
},
{
"answer": "ADN",
"clue": "Molécula que porta la información genética."
}
],
"taskDescription": "*Completa* la **sopa de letras**."
}
\`\`\` `,
    crossword_prompt_generate_only_json: "Genera el JSON completo y válido, rellenando el título, la descripción y el array \"words\", sin ningún otro comentario.",

    // Crossword UI translations
    crossword_across: "Horizontal",
    crossword_down: "Vertical",
    crossword_check_answer: "Comprobar",
    crossword_try_again: "Reintentar",
    crossword_show_solution: "Mostrar solución",
    crossword_extra_clue: "Pista extra",
    crossword_close_window: "Cerrar ventana",
    crossword_submit_answer: "Enviar",

    // Essay Prompt
    essay_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Essay\".",
    essay_prompt_mission: "**Tu misión :**",
    essay_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de tipo Ensayo.",
    essay_prompt_json_structure_title: "**Estructura JSON esperada :**",
    essay_prompt_json_structure_main_object: "El objeto debe contener :",
    essay_prompt_task_description: "`taskDescription`: Una instrucción clara que invite al alumno a redactar un texto sobre el tema. Usa `*palabra*` para negrita, `**palabra**` para cursiva y `\\n` para saltos de línea.",
    essay_prompt_keywords_array: "`keywords`: Un array de ${nombreQuestions} objetos, cada uno definiendo una palabra clave que el sistema deberá encontrar en la respuesta del alumno.",
    essay_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",
    essay_prompt_content_rules_title: "**Reglas de contenido :**",
    essay_prompt_rule1: "1.  Cada objeto en `keywords` debe contener la clave `keyword` con la palabra a buscar.",
    essay_prompt_rule2: "2.  Las palabras clave deben ser relevantes y esenciales para evaluar la comprensión del tema.",
    essay_prompt_rule3: "3.  La estructura JSON (comportamiento, etc.) debe mantenerse.",
    essay_prompt_rule4: "4. La instrucción (`taskDescription`) debe fomentar la escritura sin utilizar las palabras clave enumeradas en `keywords`, a excepción del nombre del tema si es necesario para la comprensión.",
    essay_prompt_example_json_title: "**Ejemplo de JSON para una palabra clave :**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "Redacta un texto breve que explique la fotosíntesis.",
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
    essay_prompt_generate_only_json: "Genera el JSON completo y válido, rellenando la instrucción y la lista de palabras clave, sin ningún otro comentario.",

    // Prompt de Moodle XML
    moodle_xml_prompt_role: "Eres experto en diseño instruccional. Tu misión es crear el contenido de una actividad de Examen con su banco de preguntas Moodle/Éléa generando un objeto JSON válido.",
    moodle_xml_prompt_intro: "Quiero crear un cuestionario de ${nombreQuestions} preguntas.",
    moodle_xml_prompt_content_title: "**Reglas para el contenido:**",
    moodle_xml_prompt_content_rule1: "- Las respuestas incorrectas deben ser plausibles pero falsas.",
    moodle_xml_prompt_content_rule2: "- La dificultad de las preguntas debe ser variada.",
    moodle_xml_prompt_content_rule3: "- La redacción debe ser simple y precisa.",
    moodle_xml_prompt_content_rule4: "- El feedback debe explicar brevemente la respuesta correcta.",
    moodle_xml_prompt_question_types_intro: "**Estructura JSON esperada:**\nEl objeto principal debe contener las siguientes claves:\n- `bank_name`: Un nombre corto y descriptivo para el banco de preguntas.\n- `bank_description`: Una frase que describa el contenido del banco.\n- `questions`: Un arreglo de objetos donde cada objeto representa una pregunta y debe tener `type` y `content`.",
    moodle_xml_prompt_question_type_multichoice: `
- **Para el tipo \`multichoice\` (Opción múltiple):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Título de la pregunta",
      "questiontext": "Enunciado de la pregunta.",
      "feedback": "Retroalimentación general.",
      "answers": [
        { "text": "Respuesta 1", "fraction": 100, "feedback": "Feedback si se elige." },
        { "text": "Respuesta 2", "fraction": 0, "feedback": "Feedback si se elige." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **Para el tipo \`matching\` (Emparejamiento):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Título de la pregunta",
      "questiontext": "Enunciado de la pregunta.",
      "feedback": "Retroalimentación general.",
      "subquestions": [
        { "text": "Texto de la pregunta 1", "answer": "Respuesta 1" },
        { "text": "Texto de la pregunta 2", "answer": "Respuesta 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **Para el tipo \`numerical\` (Numérica):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Título de la pregunta",
      "questiontext": "Enunciado de la pregunta.",
      "feedback": "Retroalimentación general.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "Feedback para la respuesta." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **Para el tipo \`truefalse\` (Verdadero/Falso):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Título de la pregunta",
      "questiontext": "Enunciado de la pregunta.",
      "feedback": "Retroalimentación general.",
      "answer": { "value": true, "feedback_true": "Feedback si es Verdadero.", "feedback_false": "Feedback si es Falso." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **Para el tipo \`shortanswer\` (Respuesta corta):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Título de la pregunta",
      "questiontext": "Enunciado de la pregunta.",
      "feedback": "Retroalimentación general.",
      "answers": [
        { "text": "Respuesta exacta 1", "fraction": 100, "feedback": "Feedback si se elige." },
        { "text": "Respuesta alternativa", "fraction": 100, "feedback": "Feedback si se elige." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **Para el tipo \`cloze\` (Texto con huecos):**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Título de la pregunta",
      "questiontext": "Este es un texto con un hueco {1:SHORTANSWER:=Respuesta correcta~Feedback} y otro {1:MULTICHOICE:=Respuesta correcta~Respuesta incorrecta}.",
      "feedback": "Retroalimentación general."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**Instrucciones finales:**",
    moodle_xml_prompt_form_rule1: "Distribuye las preguntas equitativamente entre los distintos tipos.",
    moodle_xml_prompt_generate_only_json: "Genera únicamente código JSON válido, sin comentarios. El resultado debe ser un único objeto JSON que contenga la clave `questions`.",

    // Creación de prueba Éléa
    moodle_xml_success_generation: "¡Archivo {fileName} generado con éxito!",
    test_error_creation_mbz: "Error al crear el MBZ para la prueba:",
    test_success_generation: "¡Archivo {fileName} generado con éxito!",
    test_error_generic: "Error:",
    test_backup_log: "Copia de seguridad creada automáticamente por Caramel\n",

    // GIFT Prompt
    gift_prompt_role: "Eres un experto en ingeniería pedagógica creando un banco de preguntas para una actividad de Test en Moodle/Éléa en formato GIFT.",
    gift_prompt_intro: "Deseo crear un cuestionario de ${nombreQuestions} preguntas.",
    gift_prompt_format_info: "El cuestionario debe estar en formato GIFT, destinado a ser importado en Moodle.",
    gift_prompt_question_quality: "Cada pregunta debe ser clara, concisa, sin ambigüedad. Debe tener retroalimentación detallada.",
    gift_prompt_code_format_intro: "El código debe tener exactamente el mismo formato que el proporcionado a continuación:",
    gift_prompt_example_question_comment: "// question: 1  name: ¿Cuál es el objeto central de nuestro sistema solar ?",
    gift_prompt_example_question_text: "::¿Cuál es el objeto central de nuestro sistema solar ?::¿Cuál es el objeto central de nuestro sistema solar ?{",
    gift_prompt_example_answer_correct: "=El Sol#¡Exacto! El Sol es la estrella central de nuestro sistema solar. ¡Bien hecho!",
    gift_prompt_example_answer_incorrect1: "~La Luna#Falso. La Luna es un satélite natural de la Tierra. El Sol es el objeto central.",
    gift_prompt_example_answer_incorrect2: "~Júpiter#Falso. Júpiter es un planeta gigante gaseoso. El Sol es el objeto central.",
    gift_prompt_example_answer_incorrect3: "~La Tierra#Falso. La Tierra es el planeta donde vivimos. El Sol es el objeto central.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "El cuestionario debe incluir diferentes tipos de preguntas de forma aleatoria :",
    gift_prompt_question_type_multichoice: "- preguntas de opción múltiple (QCM), con 1 respuesta correcta y 3 distractores.",
    gift_prompt_question_type_truefalse: "- preguntas de verdadero/falso (truefalse).",
    gift_prompt_question_type_numerical: "- preguntas numéricas (numerical) con un margen de error aceptable.",
    gift_prompt_question_type_matching: "- preguntas de emparejamiento (matching) con al menos 4 pares.",
    gift_prompt_generate_only_gift: "Genera el cuestionario directamente en formato GIFT, sin comentarios o etiquetas adicionales. Respeta escrupulosamente el formato descrito, ya que pegaré el resultado en otra herramienta que espera este formato. Produce la respuesta en formato de código preformateado.",

    // Flashcards Prompt
    flashcards_prompt_role: "Eres un experto en diseño pedagógico que crea una actividad H5P de 'Tarjetas de memoria'.",
    flashcards_prompt_mission: "**Tu misión:**",
    flashcards_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de tipo Flashcards. El JSON debe ser directamente utilizable.",
    flashcards_prompt_json_structure_title: "**Estructura JSON esperada:**",
    flashcards_prompt_json_structure_main_object: "El objeto debe contener:",
    flashcards_prompt_title: "`title`: Un título relevante para la actividad.",
    flashcards_prompt_description: "`description`: Una instrucción clara para el estudiante.",
    flashcards_prompt_association_principle: "El anverso y el reverso deben estar relacionados por un criterio único y coherente (por ejemplo: definición→término, figura→número de lados, evento→fecha, autor→obra). Usa la misma relación para todas las tarjetas y formula la consigna así: «Asocia cada X con Y». Las respuestas (`answer`) deben estar normalizadas: una palabra simple o un número, en minúsculas, sin artículos ni puntuación; los números en cifras.",
    flashcards_prompt_cards_array: "`cards`: Un array de ${nombreQuestions} objetos, donde cada objeto representa una tarjeta y contiene:",
    flashcards_prompt_text: "`text`: La pregunta o el término que se debe adivinar (anverso).",
    flashcards_prompt_answer: "`answer`: La respuesta o definición (reverso). Importante: 'answer' solo puede contener una palabra o número simple, sin palabras compuestas ni separadas.",
    flashcards_prompt_tip: "`tip` (opcional): Una pista para ayudar al alumno si la pregunta es difícil. Añade una pista solo si es relevante.",
    flashcards_prompt_tip_formatting: "En las pistas (`tip`), puedes usar `*palabra*` para negrita y `**palabra**` para cursiva para resaltar información importante.",
    flashcards_prompt_example_json_title: "**Ejemplo de JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "Las capitales de Europa",
"description": "Memoriza la capital de cada país. Haz clic en la tarjeta para ver la respuesta.",
"cards": [
{
"text": "La capital de Francia",
"answer": "París"
},
{
"text": "La capital de los Países Bajos",
"answer": "Ámsterdam",
"tip": "<p>¡Es la ciudad de los <strong>canales</strong> y los tulipanes!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // QuizSet Prompt
    quiz_set_prompt_role: "Eres un experto en ingeniería pedagógica creando contenido para una actividad \"H5P Quiz (Question Set)\".",
    quiz_set_prompt_mission: "**Tu misión :**",
    quiz_set_prompt_generate_json: "Genera un objeto JSON **solo para el contenido** de un cuestionario H5P. El JSON debe ser directamente utilizable como un archivo `content.json`.",
    quiz_set_prompt_json_structure_title: "**Estructura JSON esperada :**",
    quiz_set_prompt_json_structure_main_object: "El objeto principal debe contener las siguientes claves :",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: Un array de ${nombreQuestions} objetos, cada uno representando una pregunta.",
    quiz_set_prompt_content_rules_title: "**Reglas para el contenido de las preguntas :**",
    quiz_set_prompt_rule1: "1.  Cada objeto de pregunta debe tener las claves `library`, `params` y `subContentId`.",
    quiz_set_prompt_rule2: "2.  **Estructura:** Cada pregunta debe ser un objeto con las claves `library`, `metadata` y `params`.",
    quiz_set_prompt_rule3: "3.  Varía los tipos de preguntas. Utiliza las siguientes bibliotecas con sus versiones exactas :",
    quiz_set_prompt_rule4: "4.  **Retroalimentación (REGLA CRUCIAL):** Para **todos los tipos de preguntas** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), **debes** generar un `overallFeedback` con exactamente 6 rangos de puntuación: 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Para las preguntas `TrueFalse`, añade también los campos `feedbackOnCorrect` y `feedbackOnWrong`. La retroalimentación debe ser benévola, gradual y siempre formulada en afirmativo.",
    quiz_set_prompt_rule5: "5.  **Contenido:** El contenido en `params` debe ser pedagógicamente relevante, con distractores plausibles para los MCQ y textos coherentes para otras actividades.",
    quiz_set_prompt_rule6: "6.  **Sencillez:** No añadas imágenes ni parámetros de comportamiento superfluos. Mantén la estructura simple como en los ejemplos.",
    quiz_set_prompt_example_json_title: "**Ejemplos de estructuras para cada tipo de pregunta autorizada:**",
    quiz_set_example_true_false: "Verdadero/Falso :",
    quiz_set_example_multiple_choice: "Opción múltiple :",
    quiz_set_example_fill_in_the_blanks: "Texto con huecos :",
    quiz_set_example_drag_the_words: "Arrastrar las palabras :",
    quiz_set_example_mark_the_words: "Marcar las palabras :",
    quiz_set_example_essay: "Redacción :",
    quiz_set_prompt_generate_only_json: "Genera solo el JSON válido, comenzando con `{\"progressType\": \"dots\", ...}`, sin ningún comentario.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Título de la pregunta Verdadero/Falso" },
        "params": {
            "question": "¿Es Francia un país?",
            "correct": "true",
            "feedbackOnCorrect": "¡Correcto! Francia es efectivamente un país.",
            "feedbackOnWrong": "Incorrecto. Francia es reconocida internacionalmente como un país.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Título del MCQ" },
        "params": {
            "question": "¿Cuál es la capital de Francia?",
            "answers": [
                { "text": "París", "correct": true },
                { "text": "Berlín", "correct": false }
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
        "metadata": { "title": "Título del ejercicio de rellenar huecos" },
        "params": {
            "questions": ["París es la *capital* de Francia."],
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
        "metadata": { "title": "Título de la actividad de arrastrar palabras" },
        "params": {
            "taskDescription": "Completa la frase.",
            "textField": "*París* es la capital de Francia.",
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
        "metadata": { "title": "Título de la actividad de marcar palabras" },
        "params": {
            "taskDescription": "Subraya la capital.",
            "textField": "La capital de Francia es *París*.",
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
        "metadata": { "title": "Título del ensayo" },
        "params": {
            "taskDescription": "¿Cuál es la capital de Francia?",
            "keywords": [
                { "keyword": "París", "options": { "points": 1, "caseSensitive": false } }
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
    glossary_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Accordion\".",
    glossary_prompt_mission: "**Tu misión :**",
    glossary_prompt_generate_json: "Genera un objeto JSON completo y válido para un glosario H5P de tipo Acordeón. El JSON debe ser directamente utilizable.",
    glossary_prompt_json_structure_title: "**Estructura JSON esperada :**",
    glossary_prompt_json_structure_main_object: "Genera un array de ${nombreQuestions} objetos JSON.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: La palabra o expresión a definir.",
    glossary_prompt_content: "`text`: La definición. Usa `*palabra*` para negrita, `**palabra**` para cursiva y `\\n` para saltos de línea.",
    glossary_prompt_content_rules_title: "**Reglas de contenido:**",
    glossary_prompt_rule1: "1.  Las definiciones deben ser claras, concisas y adaptadas al nivel de los alumnos.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Ejemplo de JSON para una entrada :**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Fotosíntesis",
"text": "Proceso mediante el cual las plantas verdes transforman la luz solar en energía."
},
{
"title": "Célula",
"text": "Unidad básica de todos los seres vivos."
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // Summary Prompt
    summary_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Summary\".",
    summary_prompt_mission: "**Tu misión :**",
    summary_prompt_generate_json: "Genera un objeto JSON completo para una actividad H5P de tipo Resumen. El JSON debe ser directamente utilizable.",
    summary_prompt_json_structure_title: "**Estructura JSON esperada :**",
    summary_prompt_json_structure_main_object: "El objeto debe contener las siguientes claves:",
    summary_prompt_intro_field: "`intro`: Una frase introductoria para la actividad (ej: \"Elige la afirmación correcta.\").",
    summary_prompt_summaries_array: "`summaries`: Un array de ${nombreQuestions} objetos, cada uno representando un paso del resumen.",
    summary_prompt_summary_object: "Cada objeto en `summaries` debe contener:",
    summary_prompt_summary_array: "- `summary`: Un array de frases.",
    summary_prompt_tip_field: "- `tip` (opcional pero recomendado): Una pista para ayudar al alumno.",
    summary_prompt_content_rules_title: "**Reglas de contenido :**",
    summary_prompt_rule1: "1.  En cada array \"summary\", la **primera frase es correcta**.",
    summary_prompt_rule2: "2.  Las frases siguientes son distractores plausibles pero incorrectos.",
    summary_prompt_rule3: "3.  Todas las frases correctas deben formar un resumen coherente.",
    summary_prompt_example_json_title: "**Ejemplo de JSON para un paso :**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "Esta es la frase correcta.",
    "Este es un distractor.",
    "Este es otro distractor."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",
    summary_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // Summary UI translations
    summary_intro: "Elige la afirmación correcta.",
    summary_solved_label: "Progreso:",
    summary_score_label: "Respuestas incorrectas:",
    summary_result_label: "Tu resultado",
    summary_feedback: "Has acertado @score de @total afirmaciones (@percent %).",
    summary_label_correct: "Correcto.",
    summary_label_incorrect: "¡Incorrecto! Por favor, inténtalo de nuevo.",
    summary_label_correct_answers: "Respuestas correctas.",
    summary_tip_button_label: "Mostrar pista",
    summary_score_bar_label: "Has obtenido :num de :total puntos",
    summary_progress_text: "Progreso :num de :total",
    summary_alternative_incorrect_label: "Incorrecto",

    // Drag the Words Prompt
    drag_word_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Drag the Words\".",
    drag_word_prompt_mission: "**Tu misión :**",
    drag_word_prompt_generate_json: "Genera un objeto JSON completo para una actividad H5P de tipo Arrastrar Palabras. El JSON debe ser directamente utilizable.",
    drag_word_prompt_json_structure_title: "**Estructura JSON esperada :**",
    drag_word_prompt_json_structure_main_object: "El objeto debe contener :",
    drag_word_prompt_task_description: "`taskDescription`: Una instrucción clara.",
    drag_word_prompt_text_field: "`textField`: El texto a completar. Cada frase debe terminar con un salto de línea `\\n`.",
    drag_word_prompt_content_rules_title: "**Reglas de contenido :**",
    drag_word_prompt_rule1: "1.  Crea un texto coherente sobre el tema, con frases cortas que terminen con `\\n`.",
    drag_word_prompt_rule2: "2.  Las palabras a arrastrar están entre asteriscos. Puedes añadir una pista con `:mi pista` y feedback con `\\+feedback correcto \\-feedback incorrecto`.",
    drag_word_prompt_example_json_title: "**Ejemplo de JSON :**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Completa el texto arrastrando las palabras.",
"textField": "El *sistema solar* está compuesto por *ocho* planetas que giran alrededor del *Sol*."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",

    // Drag the Words UI translations
    drag_words_check_answer: "Comprobar",
    drag_words_try_again: "Reintentar",
    drag_words_show_solution: "Mostrar solución",
    drag_words_score_feedback: "Puntuación: @score de @total.",
    drag_words_tip_label: "Mostrar pista",
    drag_words_correct_text: "¡Correcto!",
    drag_words_incorrect_text: "¡Incorrecto!",
    drag_words_score_bar_label: "Has obtenido :num de :total puntos",
    drag_words_submit_answer: "Enviar",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Fill in the Blanks\".",
    blanks_prompt_mission: "**Tu misión :**",
    blanks_prompt_generate_json: "Genera un objeto JSON completo para una actividad H5P de tipo Rellenar Espacios en Blanco. El JSON debe ser directamente utilizable.",
    blanks_prompt_json_structure_title: "**Estructura JSON esperada :**",
    blanks_prompt_json_structure_main_object: "El objeto debe contener una clave `questions`, que es un array de cadenas de caracteres. Cada cadena representa un bloque de texto a completar.",
    blanks_prompt_content_rules_title: "**Reglas de contenido :**",
    blanks_prompt_rule1: "-   Las palabras a adivinar están entre asteriscos (*palabra*).",
    blanks_prompt_rule2: "-   Para respuestas alternativas, usa una barra: *París/Ciudad de la Luz*.",
    blanks_prompt_rule3: "-   Para añadir una información sobre herramientas, usa dos puntos: *código-abierto:Código fuente público*.",
    blanks_prompt_example_json_title: "**Ejemplo de JSON :**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"El sistema solar tiene *ocho* planetas. El más grande es *Júpiter*.",
"La capital de Francia es *París/Ciudad de la Luz*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",
    blanks_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Mostrar soluciones",
    blanks_try_again: "Reintentar",
    blanks_check_answer: "Comprobar",
    blanks_not_filled_out: "Por favor, rellena todos los huecos.",
    blanks_answer_is_correct: "'':ans' es correcto",
    blanks_answer_is_wrong: "'':ans' es incorrecto",
    blanks_answered_correctly: "Respuesta correcta",
    blanks_answered_incorrectly: "Respuesta incorrecta",
    blanks_solution_label: "Respuesta correcta:",
    blanks_input_label: "Espacio @num de @total",
    blanks_input_has_tip_label: "Pista disponible",
    blanks_tip_label: "Pista",
    blanks_score_bar_label: "Has obtenido :num de :total puntos",
    blanks_submit_answer: "Enviar",
    blanks_feedback: "Has acertado @score de @total huecos.",
    blanks_finish_header: "¿Terminar?",
    blanks_finish_body: "¿Estás seguro de que deseas terminar?",
    blanks_cancel_label: "Cancelar",
    blanks_finish_label: "Terminar",
    blanks_retry_header: "¿Reintentar?",
    blanks_retry_body: "¿Estás seguro de que deseas reintentar?",
    blanks_retry_confirm_label: "Confirmar",
    blanks_checking_mode_header: "Modo de comprobación",
    blanks_a11y_check: "Comprobar las respuestas. Las respuestas se marcarán como correctas, incorrectas o sin responder.",
    blanks_a11y_show_solution: "Mostrar la solución. La tarea se marcará con su solución correcta.",
    blanks_a11y_retry: "Reintentar la tarea. Restablecer todas las respuestas y empezar de nuevo.",

    // Mark the Words Prompt
    mark_words_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Mark the Words\".",
    mark_words_prompt_mission: "**Tu misión :**",
    mark_words_prompt_generate_json: "Genera un objeto JSON completo para una actividad H5P de tipo Marcar Palabras. El JSON debe ser directamente utilizable.",
    mark_words_prompt_json_structure_title: "**Estructura JSON esperada :**",
    mark_words_prompt_json_structure_main_object: "El objeto debe contener :",
    mark_words_prompt_task_description: "`taskDescription`: Una instrucción clara.",
    mark_words_prompt_text_field: "`textField`: El texto donde las palabras a marcar están entre asteriscos (*palabra*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",
    mark_words_prompt_content_rules_title: "**Reglas de contenido :**",
    mark_words_prompt_rule1: "1.  Crea un párrafo relevante sobre el tema.",
    mark_words_prompt_rule2: "2.  Identifica aproximadamente ${nombreQuestions} palabras clave importantes para marcar.",
    mark_words_prompt_rule3: "3.  Cada palabra a marcar debe estar individualmente entre asteriscos. Por ejemplo, `*palabra1* *palabra2*` es correcto, pero `*palabra1 palabra2*` no lo es.",
    mark_words_prompt_rule4: "4.  Los apóstrofes u otros signos de puntuación no deben estar pegados a las palabras marcadas. Por ejemplo, `l'*árbol*` es incorrecto; debe escribirse `el *árbol*` para que funcione.",
    mark_words_prompt_example_json_title: "**Ejemplo de JSON :**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Haz clic en las palabras importantes del texto.",
"textField": "El *sistema* *solar* está compuesto por *ocho* planetas que giran alrededor del *Sol*."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // Mark the Words UI translations
    mark_words_check_answer: "Comprobar",
    mark_words_try_again: "Reintentar",
    mark_words_show_solution: "Mostrar solución",
    mark_words_correct_answer: "¡Correcto!",
    mark_words_incorrect_answer: "¡Incorrecto!",
    mark_words_missed_answer: "¡Omitido!",
    mark_words_display_solution_description: "La tarea se actualiza para contener la solución.",
    mark_words_score_bar_label: "Has obtenido :num de :total puntos",
    mark_words_submit_answer: "Enviar",
    mark_words_a11y_full_text_label: "Texto completo legible",
    mark_words_a11y_clickable_text_label: "Texto completo donde se pueden marcar palabras",
    mark_words_a11y_solution_mode_header: "Modo solución",
    mark_words_a11y_checking_header: "Modo de comprobación",
    mark_words_a11y_check: "Comprobar las respuestas. Las respuestas se marcarán como correctas, incorrectas o sin responder.",
    mark_words_a11y_show_solution: "Mostrar la solución. La tarea se marcará con su solución correcta.",
    mark_words_a11y_retry: "Reintentar la tarea. Restablecer todas las respuestas y empezar de nuevo.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "Las bibliotecas de compresión (Tar.js o fflate) no están cargadas. Verifica tu conexión a internet o actualiza la página.",
    millionnaire_error_invalid_json: "La estructura JSON no es válida. Asegúrate de que contenga un 'title' y un arreglo 'questions' con 6 preguntas según el ejemplo.",
    millionnaire_activity_intro: "Participa en este juego para poner a prueba tus conocimientos.",
    millionnaire_backup_log: "Copia de seguridad creada automáticamente por Caramel\n",
    millionnaire_success_generation: "¡Archivo {fileName} generado con éxito!",
    millionnaire_error_creation_mbz: "Error al crear el archivo MBZ:",
    millionnaire_error_generic: "Error:",

    // Millionnaire Prompt
    millionnaire_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Millionnaire\".",
    millionnaire_prompt_num_questions: "**Número de preguntas :** 6",
    millionnaire_prompt_mission: "**Tu misión :**",
    millionnaire_prompt_generate_json: "Genera un objeto JSON que contenga un título y una lista de **6 preguntas** para un juego tipo \"Quién quiere ser millonario\".",
    millionnaire_prompt_important_rules_title: "**Reglas importantes :**",
    millionnaire_prompt_rule1: "1.  El `title` debe ser un título relevante y atractivo para la actividad.",
    millionnaire_prompt_rule2: "2.  La dificultad de las preguntas en el array `questions` debe ser **creciente y pedagógica**, adaptada al nivel de los alumnos. La primera pregunta debe ser muy fácil, la última muy difícil.",
    millionnaire_prompt_rule3: "3.  El contenido debe ser rigurosamente exacto y relevante para el tema y el nivel académico.",
    millionnaire_prompt_json_structure_title: "**Estructura JSON esperada :**",
    millionnaire_prompt_main_object: "Un objeto principal con dos claves :",
    millionnaire_prompt_title: "- `title`: El título de la actividad (cadena de caracteres).",
    millionnaire_prompt_questions_array: "- `questions`: Un array de 6 objetos, donde cada objeto representa una pregunta y contiene :",
    millionnaire_prompt_question: "- `question`: La pregunta (cadena de caracteres).",
    millionnaire_prompt_good_answer: "- `goodanswer`: La respuesta correcta (cadena de caracteres).",
    millionnaire_prompt_bad_answer: "- `badanswer`: Un array de 3 respuestas incorrectas (cadenas de caracteres).",
    millionnaire_prompt_example_json_title: "**Ejemplo de JSON :**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "Quiz sobre la Revolución Francesa",
"questions": [
{
"question": "¿Cuál es la capital de Francia?",
"goodanswer": "París",
"badanswer": ["Berlín", "Londres", "Madrid"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Genera solo el objeto JSON válido, sin ningún comentario.",

    // Appariement Prompt
    appariement_prompt_role: "Eres un experto en ingeniería pedagógica que crea una actividad de Moodle \"Emparejamiento\".",
    appariement_prompt_num_questions: "**Número de parejas:** 10",
    appariement_prompt_mission: "**Tu misión:**",
    appariement_prompt_generate_json: "Genera un objeto JSON que contenga un título y una lista de **10 parejas** para un juego de emparejamiento.",
    appariement_prompt_important_rules_title: "**Reglas importantes:**",
    appariement_prompt_rule1: "1.  El `title` debe ser un título pertinente y atractivo para la actividad.",
    appariement_prompt_rule2: "2.  El arreglo `pairs` debe contener 10 objetos, cada uno con una `question` (el elemento de la izquierda) y una `answer` (el elemento de la derecha a emparejar).",
    appariement_prompt_rule3: "3.  El contenido debe ser rigurosamente exacto y pertinente al tema y al nivel escolar.",
    appariement_prompt_json_structure_title: "**Estructura JSON esperada:**",
    appariement_prompt_main_object: "Un objeto principal con dos claves:",
    appariement_prompt_title: "- `title`: El título de la actividad (cadena).",
    appariement_prompt_pairs_array: "- `pairs`: Un arreglo de 10 objetos, donde cada objeto representa una pareja y contiene:",
    appariement_prompt_question: "- `question`: El término o la imagen a la izquierda (cadena).",
    appariement_prompt_answer: "- `answer`: La definición o el término correspondiente a la derecha (cadena).",
    appariement_prompt_example_json_title: "**Ejemplo de JSON:**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Emparejamiento sobre la Revolución Francesa",
"pairs": [
{
"question": "Toma de la Bastilla",
"answer": "14 de julio de 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "Genera únicamente el objeto JSON válido, sin ningún comentario.",

   // Creación de emparejamientos
   appariement_error_invalid_json: "La estructura JSON no es válida. Asegúrese de que contenga un 'title' y un array 'pairs' donde cada par tenga una 'question' y una 'answer'.",
   appariement_activity_intro: "Encuentra las parejas correspondientes.",
   appariement_success_generation: "Archivo {fileName} generado con éxito !",
   appariement_error_creation_mbz: "Error al crear el MBZ para el emparejamiento:",

    // QCM Prompt
    qcm_prompt_role: "Eres un experto en diseño instruccional creando una actividad de Moodle \"MCQ\".",
    qcm_prompt_num_questions: "**Número de preguntas:** 10",
    qcm_prompt_mission: "**Tu misión:**",
    qcm_prompt_generate_json: "Genera un objeto JSON que contenga un título y una lista de **10 preguntas** para un MCQ.",
    qcm_prompt_important_rules_title: "**Reglas importantes:**",
    qcm_prompt_rule1: "1.  El `title` debe ser un título pertinente y atractivo para la actividad.",
    qcm_prompt_rule2: "2.  El arreglo `questions` debe contener 10 objetos, cada uno con un `text` (el enunciado de la pregunta) y un arreglo `answers`.",
    qcm_prompt_rule3: "3.  Cada arreglo `answers` debe contener varias respuestas posibles. Cada respuesta es un objeto con `text` y `iscorrect` (1 para verdadero, 0 para falso). Dependiendo del contexto de la pregunta, puedes proponer preguntas con una sola respuesta correcta o con varias respuestas correctas.",
    qcm_prompt_json_structure_title: "**Estructura JSON esperada:**",
    qcm_prompt_main_object: "Un objeto principal con dos claves:",
    qcm_prompt_title: "- `title`: El título de la actividad (cadena).",
    qcm_prompt_questions_array: "- `questions`: Un arreglo de 10 objetos, donde cada objeto representa una pregunta y contiene:",
    qcm_prompt_question_text: "- `text`: El enunciado de la pregunta (cadena, puede contener HTML).",
    qcm_prompt_answers_array: "- `answers`: Un arreglo de objetos, donde cada objeto representa una respuesta y contiene:",
    qcm_prompt_answer_text: "- `text`: El texto de la respuesta (cadena, puede contener HTML).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 si la respuesta es correcta, 0 en caso contrario.",
    qcm_prompt_example_json_title: "**Ejemplo de JSON:**",
    qcm_prompt_example: `\`\`\`json
{
"title": "QCM sobre la Revolución Francesa",
"questions": [
{
"text": "¿Cuál es la fecha de la Toma de la Bastilla?",
"answers": [
{ "text": "14 de julio de 1789", "iscorrect": 1 },
{ "text": "4 de agosto de 1789", "iscorrect": 0 },
{ "text": "26 de agosto de 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Genera únicamente el objeto JSON válido, sin ningún comentario.",

    // Creación de cuestionario de opción múltiple
    qcm_error_invalid_json: "La estructura JSON no es válida. Asegúrese de que contenga un 'title' y un array 'questions' con al menos una pregunta y respuestas.",
    qcm_activity_intro: "Responda las siguientes preguntas.",
    qcm_success_generation: "Archivo {fileName} generado con éxito !",
    qcm_error_creation_mbz: "Error al crear el MBZ para el cuestionario de opción múltiple:",
    
    // H5P Modules
    h5p_timeline_name: "Línea de tiempo",
    h5p_timeline_description: "Crea una línea de tiempo interactiva para presentar una secuencia de eventos.",
    h5p_flashcards_name: "Tarjetas de memoria",
    h5p_flashcards_description: "Crea tarjetas de doble cara para ayudar a memorizar términos y definiciones.",
    h5p_quiz_set_name: "Cuestionario",
    h5p_quiz_set_description: "Compón una serie de preguntas variadas (QCM, arrastrar y soltar, etc.) para evaluar conocimientos.",
    h5p_glossary_name: "Glosario",
    h5p_glossary_description: "Crea un glosario o FAQ en formato de acordeón.",
    h5p_crossword_name: "Crucigrama",
    h5p_crossword_description: "Genera una cuadrícula de crucigrama a partir de una lista de palabras y definiciones.",
    h5p_essay_name: "Ensayo",
    h5p_essay_description: "Propón un tema de ensayo y define palabras clave para una corrección automatizada.",
    h5p_summary_name: "Resumen",
    h5p_summary_description: "Los alumnos deben reconstruir un resumen correcto eligiendo las frases adecuadas.",
    h5p_drag_the_words_name: "Arrastrar palabras",
    h5p_drag_the_words_description: "Crea un texto con huecos donde los alumnos deben arrastrar las palabras que faltan.",
    h5p_fill_in_the_blanks_name: "Rellenar huecos",
    h5p_fill_in_the_blanks_description: "Los alumnos deben rellenar las palabras que faltan en un texto directamente con el teclado.",
    h5p_mark_the_words_name: "Marcar palabras",
    h5p_mark_the_words_description: "Pide a los alumnos que resalten ciertas palabras en un párrafo.",
    h5p_true_false_name: "Pregunta Verdadero/Falso",
    h5p_true_false_description: "Crea preguntas simples con una respuesta binaria: verdadero o falso.",
    h5p_multiple_choice_name: "Opción múltiple",
    h5p_multiple_choice_description: "Crea preguntas de opción múltiple con una o más respuestas correctas.",
    h5p_find_the_words_name: "Sopa de letras",
    h5p_find_the_words_description: "Crea una cuadrícula de letras donde los alumnos deben encontrar palabras.",
    h5p_sort_the_paragraphs_name: "Ordenar los párrafos",
    h5p_sort_the_paragraphs_description: "Crea un conjunto de párrafos que los alumnos deben ordenar correctamente.",
    h5p_single_choice_set_name: "Conjunto de opción única",
    h5p_single_choice_set_description: "Crea una serie de preguntas donde cada pregunta tiene solo una respuesta correcta.",
    h5p_dialog_cards_name: "Tarjetas de diálogo",
    h5p_dialog_cards_description: "Crea tarjetas interactivas con texto y, opcionalmente, imágenes en ambos lados.",
    h5p_complex_fill_the_blanks_name: "Rellenar huecos complejo",
    h5p_complex_fill_the_blanks_description: "Crea un texto avanzado para rellenar huecos con retroalimentación específica para cada error.",
    h5p_chart_name: "Gráfico",
    h5p_chart_description: "Crea un gráfico circular o de barras para visualizar datos.",

    // Módulos de Moodle
    moodle_xml_name: "Test",
    moodle_xml_description: "Genere un banco de preguntas para importar directamente en una actividad de Test (en formato xml o gift)",
    moodle_xml_help: "Para añadir un archivo XML en una actividad de «Cuestionario» en Moodle, primero cree la actividad. Luego abra el menú <strong>Más</strong> y vaya a <strong>Banco de preguntas</strong>. En este menú, haga clic en <strong>Importar</strong>, elija el formato <strong>Moodle XML</strong>, seleccione su archivo y confirme.",
    moodle_gift_name: "Formato GIFT",
    moodle_gift_description: "Cree preguntas en formato GIFT, una forma sencilla de importar preguntas en Moodle.",
    moodle_millionnaire_name: "Millonario",
    moodle_millionnaire_description: "Genere una actividad única 'Millonario' con 6 preguntas de dificultad creciente.",
    moodle_appariement_name: "Emparejamiento",
    moodle_appariement_description: "Genera una actividad de emparejamiento de 10 preguntas.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Generar una actividad MCQ simple.",

    moodle_glossaire_xml_name: "Glosario (XML)",
    moodle_glossaire_xml_description: "Generar un glosario listo para ser importado en formato XML.",
 
    elea_page_name: "Página",
    elea_page_description: "Crear una página de contenido de Éléa con formato visual.",

    // Dynamic content
    prompt_for_ia: "Prompt para la IA",
    copy_prompt: "Copiar prompt",
    fullscreen_prompt: "Pantalla completa",
    exit_fullscreen_prompt: "Salir de pantalla completa",
    lock_prompt: "Bloquear el prompt",
    unlock_prompt: "Desbloquear el prompt",
    go_duck: "Ir a Duck.ai",
    go_mistral: "Ir a Le Chat",
    create_h5p_file: "Crear archivo H5P",
    integrate_h5p_libraries: "Integrar bibliotecas H5P:",
    paste_ia_result: "Pega el resultado de la IA en el área de abajo para crear tu módulo.",
    generate_h5p: "Generar H5P",
    create_xml_file: "Crear el archivo XML",
    paste_ia_result_xml: "Pegue el XML generado por la IA a continuación.",
    generate_xml_file: "Generar el archivo XML",
    export_mbz: "Formato MBZ",
    export_gift: "Formato GIFT",
    export_xml: "Formato XML",
    export_html: "Formato HTML",

    create_mbz_file_appariement: "Crear el archivo Emparejamiento (.mbz)",
    paste_ia_result_appariement: "Pega abajo el JSON generado por la IA. El título de la actividad se extraerá automáticamente del JSON.",
    generate_mbz_appariement: "Generar la actividad Emparejamiento (mbz)",
    create_mbz_file_millionnaire: "Crear el archivo Millonario (.mbz)",
    paste_ia_result_millionnaire: "Pega abajo el JSON generado por la IA. El título de la actividad se extraerá automáticamente del JSON.",
    generate_mbz_millionnaire: "Generar la actividad Millonario (mbz)",
    generate_mbz_test: "Generar la actividad de Examen (mbz)",

    create_mbz_file_qcm: "Crear archivo MCQ (.mbz)",
    paste_ia_result_qcm: "Pega abajo el JSON generado por la IA. El título de la actividad se extraerá automáticamente del JSON.",
    generate_mbz_qcm: "Generar actividad MCQ (mbz)",

    create_mbz_file_page: "Crear el archivo Página (.mbz)",
    paste_ia_result_page: "Pegue a continuación el JSON generado por la IA para construir la página.",
    generate_mbz_page: "Generar la actividad Página (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "El XML de Moodle aparecerá aquí...",
    paste_xml_placeholder: "Pegue aquí el XML completo generado por la IA...",

    // H5P campos de texto vacíos
    generate_prompts_placeholder: "El prompt para la IA aparecerá aquí una vez que haya completado al menos un campo en el modo Rápido o en el modo Avanzado.",
    paste_json_or_text: "Pega aquí el contenido JSON o el texto generado por la IA para crear tu actividad.",
    info_prompt_copy: "No pegue este prompt en el panel derecho. Cópielo en una IA externa para obtener el resultado y luego pegue ese resultado en el panel derecho.",

    // Notifications
    prompts_generated_successfully: "¡Prompts generados con éxito!",
    success_copy: "✓ Copiado !",
    error_please_fill_fields: "Por favor, rellena al menos un campo en el modo Rápido.",
    error_please_fill_guided_fields: "Por favor, rellena al menos un campo en el modo Avanzado.",
    error_field_empty: "El campo está vacío. Por favor, genera primero un prompt.",
    error_copy_failed: "Copia fallida.",
    error_h5p_module_not_found: "Módulo '{moduleKey}' no encontrado.",
    error_invalid_quiz_json: "El JSON para el Cuestionario no es válido: {errorMessage}",
    error_invalid_json: "El JSON proporcionado no es válido. Error: {errorMessage}",
    error_h5p_creation: "Error en la creación de H5P: {errorMessage}",
    error_paste_ia_content: "Por favor, pega el contenido generado por la IA.",
    error_compression_module_not_ready: "El módulo de compresión no está listo. Por favor, inténtalo de nuevo en un momento.",
    h5p_file_generated_successfully: "¡Archivo {fileName} generado con éxito!",
    h5p_creation_failed: "La creación del archivo H5P falló: {errorMessage}",
    license_info: "GNU GPL v3.0 o posterior",

    // Notifications for JSON content
    error_paste_json_content: "Por favor, pegue el contenido JSON generado.",
    error_paste_xml_content: "Por favor, pegue el contenido XML generado.",

    // Flashcards specific UI translations
    flashcards_progress_text: "Tarjeta @card de @total",
    flashcards_next: "Siguiente",
    flashcards_previous: "Anterior",
    flashcards_check_answer: "Comprobar",
    flashcards_your_answer: "Tu respuesta",
    flashcards_correct_answer: "Correcto",
    flashcards_incorrect_answer: "Incorrecto",
    flashcards_show_solution: "Respuesta correcta",
    flashcards_results: "Resultados",
    flashcards_of_correct: "@score de @total correctas",
    flashcards_show_results: "Mostrar resultados",
    flashcards_answer_short: "R:",
    flashcards_retry: "Reintentar",
    flashcards_card_announcement: "Respuesta incorrecta. La respuesta correcta era @answer",
    flashcards_correct_announcement: "@answer es correcto.",
    flashcards_page_announcement: "Página @current de @total",

    ticket: "Ticket",
    legal_mentions: "Menciones legales",

    // Legal Mentions
    legal_title: "Menciones legales",
    legal_editor_title: "Editor de la aplicación",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Función: Profesor de Instituto de Formación Profesional en Letras-Historia",
    legal_editor_gauthier_remande_email: "Correo electrónico: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Dirección: 39 avenue de Chanzy, 53000 Laval, Francia",
    legal_editor_gauthier_remande_phone: "Teléfono: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Función: Profesor de matemáticas y encargado de misión DRANE – Academia de Grenoble",
    legal_editor_emmanuel_gaunard_email: "Correo electrónico: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Dirección: 30 boulevard de la République, 38200 Vienne, Francia",
    legal_editor_emmanuel_gaunard_phone: "Teléfono: +33 6 46 74 20 94",
    legal_app_description: "La aplicación web «Caramel» es un proyecto libre y no comercial para la creación de contenido H5P. No se requiere cuenta, no se recopilan datos personales y todas las interacciones se realizan localmente en el navegador.",
    legal_hosting_title: "Alojamiento",
    legal_host_name: "<strong>Proveedor de alojamiento</strong>: Forge des Communs Numériques Éducatifs",
    legal_host_company: "<strong>Razón social</strong>: Ministerio de Educación Nacional y de la Juventud",
    legal_host_address: "<strong>Dirección</strong>: 110 rue de Grenelle, 75007 París, Francia",
    legal_host_phone: "<strong>Teléfono</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Director de la publicación",
    legal_publication_director_name: "Gauthier REMANDE y Emmanuel GAUNARD, en calidad de editores voluntarios.",
    legal_terms_of_use_title: "Condiciones generales de uso",
    legal_terms_of_use_content: "Este sitio permite a los usuarios generar contenido H5P. La visualización se realiza localmente, sin transmisión de datos del usuario. El usuario es el único responsable del uso que haga del contenido generado. La aplicación se ofrece de forma gratuita, sin garantía de funcionamiento o resultado. El editor declina toda responsabilidad en caso de mala interpretación del contenido o uso inapropiado.",
    legal_intellectual_property_title: "Propiedad intelectual",
    legal_intellectual_property_content: "Todos los códigos fuente, elementos gráficos y contenidos están bajo la licencia libre GNU AGPLv3. Su reutilización está permitida bajo las condiciones de sus respectivas licencias. Cualquier redistribución o modificación debe citar a los autores originales: Gauthier REMANDE y Emmanuel GAUNARD. Las imágenes utilizadas en los módulos H5P se obtienen de H5P.org.",
    legal_personal_data_title: "Datos personales",
    legal_personal_data_content: "No se recopilan ni almacenan datos personales. No se utilizan cookies de seguimiento. El historial de la sesión se almacena en el navegador local del usuario (localStorage), sin transmisión. De conformidad con el RGPD, no se transmite ninguna información personal al editor ni a terceros.",
    legal_ai_models_title: "Modelos de Inteligencia Artificial",
    legal_ai_models_content: "La aplicación Caramel se apoya, únicamente durante la generación con un clic, en modelos de IA operados por ILAAS, una federación de infraestructuras de IA compartidas. Las solicitudes se enrutan mediante un flujo de trabajo n8n alojado por el Incubador y se transmiten a ILAAS para su ejecución en servidores de confianza alojados en centros de datos etiquetados por el sector de Educación Superior e Investigación (ESR). Caramel no ejecuta los modelos ni trata o almacena los datos por cuenta propia; los datos se usan únicamente para realizar la solicitud y no se envían a IA públicas de consumo. Los modelos disponibles actualmente incluyen Mistral Small 3.2 (24B parámetros), Llama 3.3 (70B parámetros) y GPT‑OSS 120B (120B parámetros). Cualquier alojamiento, registro o conservación realizada por ILAAS se rige por su política de privacidad y sus condiciones de servicio.",
    legal_user_requests_processing_title: "Tratamiento de las solicitudes de los usuarios mediante n8n y la Incubadora del Ministerio de Educación Nacional",
    legal_user_requests_processing_content: "Nuestro sitio utiliza una solución técnica desarrollada con n8n, una herramienta de código abierto alojada por la Incubadora del Ministerio de Educación Nacional. Mediante un flujo de trabajo automatizado, este servicio transforma las solicitudes de los usuarios en datos estructurados (formato JSON) para interactuar con una inteligencia artificial de la DINUM, por lo tanto soberana. No se expone ni transmite ninguna información sensible sin cifrado, garantizando así la confidencialidad y la seguridad de los intercambios.",
    legal_accessibility_title: "Accesibilidad",
    legal_accessibility_content: "La aplicación está diseñada para ser compatible con el uso en ordenadores, incluyendo los modos oscuro/claro, la navegación por teclado y el alto contraste según los temas. Se está llevando a cabo una mejora continua de la accesibilidad, en línea con las recomendaciones del RGAA.",
    legal_applicable_law_title: "Derecho aplicable",
    legal_applicable_law_content: "Este sitio está sujeto a la legislación francesa. En caso de litigio, los tribunales competentes serán los de la jurisdicción de Lyon.",
    legal_external_libraries_title: "Bibliotecas externas utilizadas",
    legal_external_libraries_intro: "La aplicación Caramel utiliza varias bibliotecas de código abierto, bajo las siguientes licencias:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licencia: CC BY 4.0, SIL OFL 1.1, MIT): Proporciona los iconos utilizados en la interfaz para mejorar la navegación y la experiencia visual.",
    legal_library_jszip: "<strong>JSZip</strong> (Licencia: MIT o GPLv3): Permite crear archivos .h5p comprimiendo el contenido necesario en un archivo zip.",
    legal_library_clientzip: "<strong>client-zip</strong> (Licencia: MIT): Otra biblioteca utilizada para la compresión de archivos, que ofrece una alternativa de alto rendimiento para generar archivos .h5p directamente en el navegador.",
    legal_library_fflate: "<strong>fflate</strong> (Licencia: MIT): Biblioteca muy rápida para la compresión y descompresión de datos, utilizada para la creación de archivos .mbz para los módulos de Moodle.",
    legal_library_tarjs: "<strong>tar-js</strong> (Licencia: MIT): Permite crear archivos .tar, un paso necesario antes de la compresión para formar los archivos .mbz de los módulos de Moodle.",
    legal_library_ownership: "Cada biblioteca sigue siendo propiedad de sus respectivos autores y se utiliza de acuerdo con su(s) licencia(s).",

    // Essay specific UI translations
    essay_checkAnswer: "Comprobar",
    essay_tryAgain: "Reintentar",
    essay_showSolution: "Mostrar solución",
    essay_feedbackHeader: "Comentario",
    essay_solutionTitle: "Solución de ejemplo",
    remainingChars: "Caracteres restantes: @chars",
    notEnoughChars: "¡Debes introducir al menos @chars caracteres!",
    messageSave: "guardado",
    placeholderText: "Empieza a escribir aquí...",
    ariaYourResult: "Has conseguido @score de @total puntos",
    ariaNavigatedToSolution: "Navegado a la solución de ejemplo recién incluida después del área de texto.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "Tu trabajo es un buen comienzo. Sigue explorando el tema para enriquecer tus ideas.",
    essay_overall_feedback_11_30: "Has sentado unas bases interesantes. Profundizando en ciertos puntos, tu trabajo ganará en precisión.",
    essay_overall_feedback_31_50: "Tu comprensión del tema está bien encaminada. Considera desarrollar más tus argumentos para reforzar tu punto de vista.",
    essay_overall_feedback_51_70: "Es un buen trabajo. Demuestras un buen dominio del tema. Algunos detalles más podrían mejorarlo aún.",
    essay_overall_feedback_71_90: "¡Muy buen trabajo! Tu análisis es pertinente y está bien estructurado. Demuestras una excelente comprensión.",
    essay_overall_feedback_91_100: "¡Excelente trabajo! Tu reflexión es profunda, bien argumentada y demuestra un dominio completo del tema.",

    // True/False Question
    true_false_prompt_role: "Eres un experto en diseño instruccional creando una pregunta de Verdadero/Falso para una actividad H5P.",
    true_false_prompt_mission: "Tu misión es generar un objeto JSON para una pregunta de Verdadero/Falso.",
    true_false_prompt_generate_json: "Genera un objeto JSON basado en la siguiente estructura:",
    true_false_prompt_json_structure_title: "--- ESTRUCTURA JSON ESPERADA ---",
    true_false_prompt_json_structure_main_object: "El objeto principal debe contener las siguientes claves:",
    true_false_prompt_question: "`question`: (string) La afirmación a evaluar. Puede contener HTML.",
    true_false_prompt_correct: "`correct`: (string) La respuesta correcta, ya sea \"true\" o \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Comentario que se muestra si la respuesta es correcta.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Comentario que se muestra si la respuesta es incorrecta.",
    true_false_prompt_content_rules_title: "--- REGLAS DE CONTENIDO ---",
    true_false_prompt_rule1: "La pregunta debe ser una afirmación clara.",
    true_false_prompt_rule2: "El valor de `correct` debe ser una cadena de texto: \"true\" o \"false\".",
    true_false_prompt_example_json_title: "--- EJEMPLO DE JSON ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "Oslo es la capital de Noruega.",
"correct": "true",
"feedbackOnCorrect": "¡Respuesta correcta! Oslo es efectivamente la capital de Noruega.",
"feedbackOnWrong": "Respuesta incorrecta. La capital de Noruega es Oslo."
}
    \`\`\` `,
   true_false_prompt_generate_only_json: "Quiero que generes solo el JSON, sin comentarios ni texto introductorio.",
    true_false_true_text: "Verdadero",
    true_false_false_text: "Falso",
    true_false_score: "Obtuviste @score de @total puntos",
    true_false_check_answer: "Comprobar",
    true_false_show_solution_button: "Mostrar solución",
    true_false_try_again: "Reintentar",
    true_false_wrong_answer_message: "Respuesta incorrecta",
    true_false_correct_answer_message: "Respuesta correcta",
    true_false_score_bar_label: "Obtuviste :num de :total puntos",
    true_false_submit_answer: "Enviar",
    true_false_a11y_check: "Comprueba las respuestas. Las respuestas se marcarán como correctas, incorrectas o sin responder.",
    true_false_a11y_show_solution: "Muestra la solución. La tarea se marcará con su solución correcta.",
    true_false_a11y_retry: "Reintenta la tarea. Restablece todas las respuestas y comienza la tarea de nuevo.",
    true_false_finish_header: "¿Terminar?",
    true_false_finish_body: "¿Estás seguro de que deseas terminar?",
    true_false_cancel_label: "Cancelar",
    true_false_finish_label: "Terminar",
    true_false_retry_header: "¿Reintentar?",
    true_false_retry_body: "¿Estás seguro de que deseas reintentar?",
    true_false_retry_confirm_label: "Confirmar",

    // Multiple Choice UI translations
    checkAnswerButton: "Comprobar",
    showSolutionButton: "Mostrar solución",
    tryAgainButton: "Reintentar",
    submitAnswerButton: "Enviar",
    scoreBarLabel: "Has obtenido :num de :total puntos",
    confirmCheckHeader: "¿Terminar?",
    confirmCheckBody: "¿Estás seguro de que deseas terminar?",
    confirmCheckCancelLabel: "Cancelar",
    confirmCheckConfirmLabel: "Terminar",
    confirmRetryHeader: "¿Reintentar?",
    confirmRetryBody: "¿Estás seguro de que deseas reintentar?",
    confirmRetryCancelLabel: "Cancelar",
    confirmRetryConfirmLabel: "Confirmar",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Opción Múltiple\".",
    multiple_choice_prompt_mission: "**Tu misión:**",
    multiple_choice_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de Opción Múltiple.",
    multiple_choice_prompt_json_structure_title: "**Estructura JSON esperada:**",
    multiple_choice_prompt_json_structure_main_object: "El objeto debe contener:",
    multiple_choice_prompt_question: "`question`: La pregunta a formular (formato HTML).",
    multiple_choice_prompt_answers_array: "`answers`: Un array de objetos, cada uno representando una respuesta.",
    multiple_choice_prompt_text: "`text`: El texto de la respuesta (formato HTML).",
    multiple_choice_prompt_correct: "`correct`: Un booleano (`true` o `false`) que indica si es la respuesta correcta.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",
    multiple_choice_prompt_content_rules_title: "**Reglas de contenido:**",
    multiple_choice_prompt_rule1: "1.  Solo debe haber una respuesta correcta (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Proporciona varias respuestas incorrectas (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Ejemplo de JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "¿Cuál es el color real de la grosella negra (cassis)?",
"answers": [
{
"correct": true,
"text": "Violeta muy oscuro"
},
{
"correct": false,
"text": "Azul"
},
{
"correct": false,
"text": "Negro"
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
    multiple_choice_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // Find the Words UI translations
    check: "Comprobar",
    tryAgain: "Reintentar",
    showSolution: "Mostrar solución",
    found: "@found de @totalWords encontradas",
    timeSpent: "Tiempo empleado",
    score: "Has obtenido @score de @total puntos",
    wordListHeader: "Lista de palabras",

    // Find the Words Prompt
    find_the_words_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Sopa de letras\".",
    find_the_words_prompt_mission: "**Tu misión:**",
    find_the_words_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de Sopa de letras.",
    find_the_words_prompt_json_structure_title: "**Estructura JSON esperada:**",
    find_the_words_prompt_json_structure_main_object: "El objeto debe contener:",
    find_the_words_prompt_task_description: "`taskDescription`: Instrucciones claras para la actividad.",
    find_the_words_prompt_word_list: "`wordList`: Una cadena de palabras a encontrar, separadas por comas sin espacios.",
    find_the_words_prompt_content_rules_title: "**Reglas de contenido:**",
    find_the_words_prompt_rule1: "1.  La `wordList` debe ser una única cadena con las palabras separadas por comas. Cada palabra debe ser simple (sin expresiones de varias palabras). Están prohibidos los números, los signos de puntuación y las letras con acentos/diacríticos (ej.: escribir 'eleve' en lugar de 'élève').",
    find_the_words_prompt_example_json_title: "**Ejemplo de JSON:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Encuentra los nombres de las ciudades en la cuadrícula de abajo",
"wordList": "Canberra,Minsk,Pekín,Oslo,París,Londres,Madrid,Atenas,Tokio,Moscú,Washington,Estocolmo"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",
    fillPool: "abcdefghijklmnopqrstuvwxyzñ",

    // Sort the Paragraphs UI translations
    checkAnswer: "Comprobar",
    submitAnswer: "Enviar",
    up: "Arriba",
    down: "Abajo",
    disabled: "Desactivado",
    a11y_yourResult: "Has obtenido @score de @total puntos",
    a11y_paragraph: "Párrafo",
    a11y_correct: "correcto",
    a11y_wrong: "incorrecto",
    a11y_point: "@score punto",
    a11y_sevenOfNine: "@current de @total",
    a11y_currentPosition: "Posición actual en la lista",
    a11y_instructionsSelected: "Pulsa la barra espaciadora para reordenar",
    a11y_instructionsGrabbed: "Pulsa las flechas arriba y abajo para cambiar de posición, la barra espaciadora para soltar, escape para cancelar",
    a11y_grabbed: "Agarrado",
    a11y_moved: "Movido",
    a11y_dropped: "Soltado",
    a11y_reorderCancelled: "Reordenación cancelada",
    a11y_finalPosition: "Posición final",
    a11y_nextParagraph: "Siguiente párrafo",
    a11y_correctParagraph: "Párrafo correcto en la posición",
    a11y_listDescription: "Lista de párrafos ordenables.",
    a11y_listDescriptionCheckAnswer: "Lista de párrafos con resultados.",
    a11y_listDescriptionShowSolution: "Lista de párrafos con soluciones.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Ordenar los párrafos\".",
    sort_the_paragraphs_prompt_mission: "**Tu misión:**",
    sort_the_paragraphs_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de ordenar párrafos.",
    sort_the_paragraphs_prompt_json_structure_title: "**Estructura JSON esperada:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "El objeto debe contener:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Instrucciones claras para la actividad. Usa `*palabra*` para negrita, `**palabra**` para cursiva y `\\n` para saltos de línea.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Un array de cadenas de texto, cada una representando un párrafo a ordenar. Los párrafos deben estar en el orden correcto. Usa `*palabra*` para negrita, `**palabra**` para cursiva.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",
    sort_the_paragraphs_prompt_content_rules_title: "**Reglas de contenido:**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` debe formar una progresión lógica deducible por el contenido, sin pistas artificiales (números, fechas/horarios, «primero/luego/finalmente»), salvo petición explícita.",
    sort_the_paragraphs_prompt_rule2: "2. Nada de lista plana: cada frase hace avanzar el mismo hilo (causa→efecto, preparación→acción→resultado, general→particular) para que el orden sea deducible.",
    sort_the_paragraphs_prompt_example_json_title: "**Ejemplo de JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "Mi rutina de la mañana:",
"paragraphs": [
  "Lleno la tetera con agua fresca.",
  "La enciendo.",
  "Pongo una bolsa de té en la taza.",
  "Vierto el agua hirviendo sobre la bolsa.",
  "Retiro la bolsa cuando la infusión está lista."
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Mostrar solución",
    retryButtonLabel: "Reintentar",
    solutionViewTitle: "Solución",
    correctText: "¡Correcto!",
    incorrectText: "¡Incorrecto!",
    muteButtonLabel: "Silenciar",
    closeButtonLabel: "Cerrar",
    slideOfTotal: "Diapositiva @slide de @total",
    nextButtonLabel: "Siguiente",
    solutionListQuestionNumber: "Pregunta @question",
    a11yShowSolution: "Muestra la solución. La tarea se marcará con su solución correcta.",
    a11yRetry: "Reintenta la tarea. Restablece todas las respuestas y comienza la tarea de nuevo.",
    shouldSelect: "Debería seleccionar",
    shouldNotSelect: "No debería seleccionar",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Conjunto de opción única\".",
    single_choice_set_prompt_mission: "**Tu misión:**",
    single_choice_set_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de tipo Conjunto de opción única.",
    single_choice_set_prompt_json_structure_title: "**Estructura JSON esperada:**",
    single_choice_set_prompt_json_structure_main_object: "El objeto debe contener:",
    single_choice_set_prompt_choices_array: "`choices`: Un array de objetos, donde cada objeto representa una pregunta y contiene:",
    single_choice_set_prompt_question: "`question`: La pregunta a formular.",
    single_choice_set_prompt_answers_array: "`answers`: Un array de cadenas de texto. La primera cadena es siempre la respuesta correcta.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (REGLA ESTRICTA) Debes generar un arreglo de 6 objetos para la retroalimentación final, contextualizada al tema del ejercicio, respetando estrictamente los rangos 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. Cada objeto tendrá la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. El `feedback` debe ser amable, gradual y siempre en positivo, sin exageraciones.",
    single_choice_set_prompt_content_rules_title: "**Reglas de contenido:**",
    single_choice_set_prompt_rule1: "1.  En cada array `answers`, la primera respuesta es siempre la correcta.",
    single_choice_set_prompt_example_json_title: "**Ejemplo de JSON:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "Las bayas de goji también se conocen como ...",
"answers": ["Bayas de lobo", "Bayas de gato", "Bayas de oso"]
},
{
"question": "Las bayas de goji son originarias de ...",
"answers": ["Asia", "África", "Europa"]
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
    single_choice_set_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // Dialog Cards UI translations
    answer: "Girar",
    next: "Siguiente",
    prev: "Anterior",
    retry: "Reintentar",
    progressText: "Tarjeta @card de @total",
    cardFrontLabel: "Anverso de la tarjeta",
    cardBackLabel: "Reverso de la tarjeta",
    tipButtonLabel: "Mostrar pista",
    audioNotSupported: "Tu navegador no soporta este audio",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Tarjetas de diálogo\".",
    dialog_cards_prompt_mission: "**Tu misión:**",
    dialog_cards_prompt_generate_json: "Genera un objeto JSON que contenga únicamente las claves `title`, `description` y `dialogs` para una actividad H5P de tipo Tarjetas de diálogo.",
    dialog_cards_prompt_json_structure_title: "**Estructura JSON esperada:**",
    dialog_cards_prompt_json_structure_main_object: "El objeto debe contener:",
    dialog_cards_prompt_title: "`title`: Un título para la actividad (formato HTML).",
    dialog_cards_prompt_description: "`description`: Una breve descripción o instrucción (formato HTML).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: Un array de ${nombreQuestions} objetos, cada uno representando una tarjeta y conteniendo:",
    dialog_cards_prompt_text: "`text`: El texto en el anverso de la tarjeta (formato HTML).",
    dialog_cards_prompt_answer: "`answer`: El texto en el reverso de la tarjeta (formato HTML).",
    dialog_cards_prompt_tips: "`tips` (opcional): Un objeto para pistas. Si lo consideras pedagógicamente útil, añade una pista para el anverso con la clave `front` y/o para el reverso con la clave `back`.",
    dialog_cards_prompt_content_rules_title: "**Reglas de contenido:**",
    dialog_cards_prompt_rule1: "1. Los textos para el anverso (`text`) y el reverso (`answer`) deben ser claros y concisos. **Formatea el contenido con HTML (<strong> para negrita, <em> para cursiva) para mejorar la legibilidad y resaltar la información importante.**",
    dialog_cards_prompt_example_json_title: "**Ejemplo de JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "Aprende los nombres de las frutas en inglés",
"description": "Los nombres de las frutas se presentan en francés. Da la vuelta a las tarjetas para ver la traducción correcta al inglés.",
"dialogs": [
{
"title": "Encuentra los verbos ingleses en presente",
"description": "A partir de una oración en inglés en pasado simple, encuentra el verbo en infinitivo. Da la vuelta a las tarjetas para comprobar tus respuestas.",
"dialogs": [
{
"text": "He *visited* his grandmother.",
"answer": "to *visit*",
"tips": {
"front": "Identifica el verbo en pasado.",
"back": "Piensa en la forma base (infinitivo) del verbo."
}
},
{
"text": "She *played* soccer.",
"answer": "to *play*",
"tips": {
"front": "Busca el verbo en pasado.",
"back": "Imagina el verbo en su forma de diccionario (infinitivo)."
}
}
]
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Genera solo el código JSON válido que contenga las claves `title`, `description` y `dialogs`, sin ningún comentario.",

    // Dialog Cards specific UI translations
    correctAnswer: "¡Lo he acertado!",
    incorrectAnswer: "Me equivoqué",
    round: "Ronda @round",
    cardsLeft: "Tarjetas restantes: @number",
    nextRound: "Pasar a la ronda @round",
    startOver: "Empezar de nuevo",
    showSummary: "Siguiente",
    summary: "Resumen",
    summaryCardsRight: "Tarjetas que acertaste:",
    summaryCardsWrong: "Tarjetas que fallaste:",
    summaryCardsNotShown: "Tarjetas no mostradas en el grupo:",
    summaryOverallScore: "Puntuación general",
    summaryCardsCompleted: "Tarjetas que has completado:",
    summaryCompletedRounds: "Rondas completadas:",
    summaryAllDone: "¡Bien hecho! ¡Has acertado todas las @cards tarjetas @max veces seguidas!",
    confirmStartingOverHeader: "¿Empezar de nuevo?",
    confirmStartingOverBody: "Se perderá todo el progreso. ¿Estás seguro de que quieres empezar de nuevo?",
    confirmStartingOverCancelLabel: "Cancelar",
    confirmStartingOverConfirmLabel: "Empezar de nuevo",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "Eres un experto en diseño instruccional creando una actividad H5P \"Complex Fill the Blanks\".",
    complex_blanks_prompt_mission: "**Tu misión:**",
    complex_blanks_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de tipo Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Estructura JSON esperada:**",
    complex_blanks_prompt_json_structure_main_object: "El objeto principal debe contener las claves `content` y `overallFeedback`.",
    complex_blanks_prompt_task: "`task`: Las instrucciones para el ejercicio (en HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: El texto que contiene los huecos, representados por `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: Un array de objetos, uno por cada hueco, en orden de aparición.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: La respuesta correcta (puede incluir alternativas con `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: Un array de objetos para errores comunes.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: El texto de un error común.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: La retroalimentación específica para este error (en HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: Un array para retroalimentación general basada en la puntuación.",
    complex_blanks_prompt_content_rules_title: "**Reglas de contenido:**",
    complex_blanks_prompt_rule1: "1. El número de objetos en `blanksList` debe coincidir con el número de huecos en `blanksText`.",
    complex_blanks_prompt_rule2: "2. Proporciona errores comunes y retroalimentación constructiva.",
    complex_blanks_prompt_rule3: "3. El texto y la retroalimentación pueden contener etiquetas HTML simples como `<p>`, `<strong>`, `<em>`.",
    complex_blanks_prompt_example_json_title: "**Ejemplo de JSON:**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Pon los verbos en el tiempo correcto. Recibirás retroalimentación individual para errores típicos.</p>",
"blanksList": [
{
"correctAnswerText": "no habla",
"incorrectAnswersList": [
{
"incorrectAnswerText": "habla no",
"incorrectAnswerFeedback": "<div>Recuerda que en español la negación va antes del verbo <em>(hablar)</em>.</div>"
},
{
"incorrectAnswerText": "no hablamos",
"incorrectAnswerFeedback": "<div>Olvidaste que el sujeto es tercera persona singular <em>(él)</em>.</div>"
}
]
}
],
"blanksText": "<p>Él habla inglés pero (no / hablar) ___________<strong>&nbsp;</strong>alemán.</p>"
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
    complex_blanks_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // Chart Prompt
    chart_prompt_role: "Eres un experto en diseño instruccional creando una actividad H5P \"Gráfico\".",
    chart_prompt_mission: "**Tu misión:**",
    chart_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de Gráfico.",
    chart_prompt_json_structure_title: "**Estructura JSON esperada:**",
    chart_prompt_json_structure_main_object: "El objeto debe contener:",
    chart_prompt_graph_mode: "`graphMode`: Elige el tipo de gráfico más relevante, 'pieChart' (circular) o 'barChart' (de barras), según el contexto, a menos que se indique lo contrario.",
    chart_prompt_list_of_types: "`listOfTypes`: Un array de objetos, cada uno representando un punto de datos en el gráfico.",
    chart_prompt_value: "`value`: El valor numérico del punto de datos.",
    chart_prompt_color: "`color`: El color del punto de datos (código hexadecimal).",
    chart_prompt_font_color: "`fontColor`: El color del texto para el punto de datos (código hexadecimal).",
    chart_prompt_text: "`text`: La etiqueta para el punto de datos.",
    chart_prompt_figure_definition: "`figureDefinition`: Una breve descripción del gráfico.",
    chart_prompt_content_rules_title: "**Reglas de contenido:**",
    chart_prompt_rule1: "1. Elige colores contrastantes para una buena legibilidad.",
    chart_prompt_rule2: "2. Las etiquetas deben ser cortas y claras.",
    chart_prompt_rule3: "3. Si un valor es muy bajo en comparación con otros, prefiere un 'barChart' para una mejor visualización.",
    chart_prompt_example_json_title: "**Ejemplo de JSON:**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Arándanos"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Frambuesas"}
],
"figureDefinition": "Gráfico"
}
\`\`\` `,
    chart_prompt_generate_only_json: "Genera solo el código JSON válido, sin ningún comentario.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Anterior",
    quiz_next_button: "Siguiente",
    quiz_finish_button: "Finalizar",
    quiz_submit_button: "Enviar",
    quiz_textual_progress: "Pregunta @current de @total",
    quiz_no_result_message: "Finalizado",
    quiz_result_message: "Tus resultados:",
    quiz_score_bar_label: "Obtuviste @finals de @totals puntos",
    quiz_solution_button_text: "Ver solución",
    quiz_retry_button_text: "Reintentar",
    quiz_finish_button_text: "Finalizar",
    quiz_submit_button_text: "Enviar",
    quiz_feedback_available: "Feedback disponible",
    quiz_read_feedback: "Leer feedback",
    quiz_wrong_answer: "Respuesta incorrecta",
    quiz_correct_answer: "Respuesta correcta",
    quiz_should_check: "Debería haber sido marcado",
    quiz_should_not_check: "No debería haber sido marcado",
    quiz_no_input: "Por favor, responde antes de ver la solución.",
    quiz_a11y_check: "Comprueba las respuestas. Las respuestas se marcarán como correctas, incorrectas o sin responder.",
    quiz_a11y_show_solution: "Muestra la solución. La tarea se marcará con su solución correcta.",
    quiz_a11y_retry: "Reintenta la tarea. Restablece todas las respuestas y comienza la tarea de nuevo.",

    // IA de Caramel — generación
    generate_with_llm: "Generar con la IA de Caramel",
    generation_in_progress: "Generación en curso, por favor espere...",
    request_sent_to_ia: "Solicitud enviada a la IA, por favor espere...",
    generation_successful: "¡Contenido H5P generado con éxito!",
    generation_failed_empty: "La generación ha fallado. La respuesta estaba vacía.",
    generation_failed_error: "Error durante la generación: {errorMessage}",
    generation_failed_llm: "La generación a través de la IA de Caramel ha fallado. Causa: {errorMessage}",

    // Descripciones de los modelos (IA de Caramel)
    llm_small_summary: "Caramelo blando: rápido, ligero, perfecto para ejercicios exprés y respuestas sin espera. Consume poco.",
    llm_small_technical: "Mistral AI",
    llm_large_summary: "Caramelo líquido: más rico y más matizado, ideal para tareas que requieren algo de profundidad. Consume más.",
    llm_large_technical: "Meta AI",
    llm_xl_summary: "Caramelo duro: potente y complejo, reservado para proyectos ambiciosos. Se requiere paciencia, ¡resultado garantizado! Consume mucho más.",
    llm_xl_technical: "OpenAI",

    // Nombres amigables para los modelos (visualización del menú)
    llm_display_small: "Mistral-Small-3.2",
    llm_display_large: "LLaMa-3.3",
    llm_display_xl: "GPT-OSS",

    // Indicaciones de los modelos (IA de Caramel)
    llm_model_source: "Proveedor del modelo:",
    llm_model_parameters: "Tamaño del modelo:",
    llm_model_parameters_small: "24 Mrd parámetros",
    llm_model_parameters_large: "70 Mrd parámetros",
    llm_model_parameters_xl: "120 Mrd parámetros",

    language: "Idioma",
    tutorial: "Tutorial",

    // Glossaire XML Prompt
    glossaire_xml_prompt_role: "Eres un experto en diseño instruccional y vas a crear el contenido para un glosario de Moodle en formato XML.",
    glossaire_xml_prompt_mission: "**Tu misión:** Debes generar un objeto JSON simple que contenga una lista de términos para un glosario. Cada término debe tener un concepto, una definición y, si es relevante, una lista de alias.",
    glossaire_xml_prompt_structure_title: "**Estructura JSON esperada:**",
    glossaire_xml_prompt_structure_rules: `
-   **Raíz:** Un objeto principal que contiene dos claves: \`name\` (el nombre del glosario) y \`entries\` (un array de objetos).
-   **Cada objeto en \`entries\` debe contener:**
    -   \`concept\`: La palabra o expresión a definir.
    -   \`definition\`: Una definición clara y concisa. Usa *mot* para negrita, **mot** para cursiva y \\n para saltos de línea, solo cuando sea pedagógicamente pertinente.
    -   \`aliases\` (opcional): Un array de cadenas de texto para sinónimos o términos alternativos. Añade esta clave solo si existen alias relevantes.`,
    glossaire_xml_prompt_example_title: "**Ejemplo de JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "El léxico de la información",
  "entries": [
    {
      "concept": "Periodista",
      "definition": "Persona que **recopila**, verifica y difunde *información*.",
      "aliases": ["Reportero", "Columnista"]
    },
    {
      "concept": "Fuente",
      "definition": "Origen de una *información*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Genera solo el código JSON válido, sin ningún comentario.",

    //Barre de menu
    tab_all: "Todo",
    tab_quiz: "Quiz & Pruebas",
    tab_text: "Manipulación de texto",
    tab_memory: "Memorización & Descubrimiento",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 Obtener el prompt",
    create_file_step: "2/2 Crear el archivo",
    generate_one_click: "Generación con un clic",
    simple_mode: "Sencillo",
    advanced_mode: "Guiado",

    // RAG feature
    activate_rag: "Activar consulta de documentos",
    rag_tooltip: "Permite pegar texto o subir un PDF. El contenido se utilizará como fuente principal para generar las actividades.",
    rag_title: "Adjuntar documentos (opcional)",
    rag_note: "Si deseas que la IA trabaje exclusivamente a partir de tus documentos, pega tu texto o suelta tus archivos aquí. De lo contrario, deja esta área vacía para permitir que la IA busque información por sí misma.",
    upload_pdf: "O subir un PDF para su análisis",
    pdf_loading: "Cargando PDF...",
    pdf_processing_page: "Procesando página",
    ocr_recognizing_page: "Reconociendo (OCR) página",
    ocr_success: "El documento ha sido procesado con éxito.",
    ocr_error: "Ocurrió un error durante el procesamiento.",
    error_invalid_pdf: "Por favor, seleccione un archivo PDF válido.",
    error_duplicate_pdf: "Este archivo ya se ha añadido.",
    error_fullscreen: "El modo de pantalla completa falló:",
    lock_text: "Bloquear",
    unlock_text: "Desbloquear",
    rag_instruction: "\n\nSolo deberás consultar la siguiente información para generar el contenido:",
    drag_drop_text: "Arrastra y suelta un archivo PDF aquí",
    or_text: "o",
    upload_pdf_btn: "Seleccionar un archivo",
    paste_your_text_here: "Copie y pegue su texto aquí...",
    rag_tags_tuto: "A continuación encontrará los documentos subidos. Haga clic en el círculo de color para personalizar el resaltado de cada documento.",

    // Pasos para preparar el caramelo
    caramel_animation_step_1: "Vertemos el azúcar en la cacerola...",
    caramel_animation_step_2: "Añadimos un poco de agua...",
    caramel_animation_step_3: "Calentamos a fuego medio...",
    caramel_animation_step_4: "El azúcar empieza a derretirse...",
    caramel_animation_step_5: "Empieza a tomar color...",
    caramel_animation_step_6: "Removemos suavemente...",
    caramel_animation_step_7: "El caramelo adquiere un bonito color ámbar...",
    caramel_animation_step_8: "Añadimos la nata caliente...",
    caramel_animation_step_9: "¡Cuidado con las salpicaduras!",
    caramel_animation_step_10: "Mezclamos bien...",
    caramel_animation_step_11: "¡Ya casi está listo!",

    // Indicaciones de la página
    page_prompt_role: "Eres una persona experta en diseño instruccional que crea una actividad Página, estructurada, para Éléa/Moodle.",
    page_prompt_mission: "**Tu misión :**",
    page_prompt_generate_json: "Genera un objeto JSON para construir una página de contenido de Éléa. La estructura de la página se basa en bloques predefinidos. Debes seleccionar los bloques más pertinentes de la lista siguiente para responder a la solicitud del usuario.",
    page_prompt_json_structure_title: "**Estructura JSON esperada :**",
    page_prompt_json_structure_main_object: "El objeto principal debe contener la clave \"title\" para el título de la página, la clave \"intro\" para una introducción clara y comprensible del contenido del curso que sigue, y la clave \"blocks\", que es un arreglo de objetos. Cada objeto representa un bloque de contenido y debe tener un \"type\" que corresponda a uno de los bloques de abajo, y un objeto \"data\" que contenga la información específica del bloque.",
    page_prompt_blocks_list_title: "**Lista de bloques disponibles :**",
    page_prompt_block_01: "- `#01_hero_header`: Banner de apertura. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: Sumario con enlaces internos. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: Hitos históricos en 3 tarjetas. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (máx. 3 tarjetas)",
    page_prompt_block_04: "- `#04_callout_set`: Banners Objetivos, Para saber, Alerta. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: Cifras clave en tarjetas. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: Tabla de vocabulario. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: Glosario en chips. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: Tarjetas de monumentos con imágenes. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: Dos imágenes comparadas. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: Tabla de comparación. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: Recuadro de Definición. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"Definición\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: Párrafos del curso. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: Ficha detallada. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: Preguntas frecuentes. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: Mitos vs Realidades. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"Mitos\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"Realidades\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: Método para describir una imagen. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: Webografía. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"Webografía\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: Cita bilingüe. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**Reglas para el contenido :**",
    page_prompt_rule1: "1.  El JSON debe ser válido.",
    page_prompt_rule2: "2.  El contenido textual puede usar etiquetas Markdown `*palabra*` para negrita y `**palabra**` para cursiva.",
    page_prompt_rule3: "3.  Para las imágenes, busca URLs pertinentes y libres de derechos (p. ej.: Wikimedia Commons).",
    page_prompt_example_json_title: "**Ejemplo de JSON :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "La Revolución Francesa",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "La Revolución Francesa", "subtitle": "Puntos de referencia esenciales" } },
    { "type": "#12_context_paragraphs", "data": { "title": "Contexto", "paragraphs": ["La Revolución Francesa es un período de transformaciones...", "Varias causas explican este acontecimiento..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "Eventos clave", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "Toma de la Bastilla", "caption": "14 de julio de 1789", "title": "Toma de la Bastilla", "text": "Este acontecimiento marca el inicio de la Revolución." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "Genera únicamente código JSON válido, sin ningún comentario."
};
