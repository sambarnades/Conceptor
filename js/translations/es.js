const translations_es = {
    subtitle: "Creación Asistida de Recursos y Actividades para Moodle y Éléa",
    help_button: "Ayuda",
    help_modal_title: "🚀 Guía de inicio rápido de Caramel",
    help_modal_content: `
        <div class="help-modal-content">
            <p>¡Bienvenido a <strong>Caramel</strong>! Esta herramienta te guía paso a paso para crear actividades educativas interactivas con la ayuda de la inteligencia artificial. Sigue estos sencillos pasos para convertir tus ideas en módulos listos para usar.</p>

            <div class="help-section">
                <h4><span class="help-step-number">1</span> Redacta tu idea (el "prompt")</h4>
                <p>Todo comienza con la descripción de tus necesidades. Tienes dos opciones para ello:</p>
                <ul>
                    <li><span class="badge-help-mode">Modo Rápido</span>: Ideal para empezar rápidamente. Simplemente indica <strong>quién eres</strong> (ej: <em>Profesor de Ciencias</em>) y <strong>qué quieres abordar</strong> (ej: <em>el ciclo del agua en 6º grado</em>).</li>
                    <li><span class="badge-help-mode">Modo Guiado</span>: Para una solicitud más precisa. Completa la <strong>disciplina</strong>, el <strong>tema</strong>, el <strong>nivel del estudiante</strong> y el <strong>número de elementos</strong> que deseas (preguntas, fechas, etc.).</li>
                </ul>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">2</span> Genera los prompts</h4>
                <p>Una vez que hayas introducido tu información, haz clic en el botón <button id="generateBtn" data-key="generate_prompts">Generar prompts</button>. La herramienta preparará entonces instrucciones detalladas (los "prompts") para cada tipo de actividad disponible.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">3</span> Elige tu actividad</h4>
                <p>Navega entre las pestañas <span class="badge-help-tab">H5P</span> y <span class="badge-help-tab">Módulos Éléa/Moodle</span> para descubrir las diferentes actividades disponibles. Haz clic en la que te interese (por ejemplo, "Línea de tiempo" o "MCQ"). El prompt correspondiente aparecerá en el área de texto.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">4</span> Utiliza la Inteligencia Artificial</h4>
                <p>¡Aquí es donde ocurre la magia! Tienes dos opciones para generar el contenido de tu actividad:</p>
                <div class="help-subsection">
                    <h5><i class="fas fa-robot"></i> Opción A: Generar con Albert (Recomendado)</h5>
                    <p>Haz clic en el botón <button class="action-btn albert-btn">Generar con Albert</button>. Puedes elegir el modelo de IA que mejor se adapte a tus necesidades (rápido, potente o especializado en código) haciendo clic en la pequeña flecha a la derecha del botón. El contenido de tu actividad se <strong>generará e insertará automáticamente</strong> en el campo de resultados, listo para ser utilizado.</p>
                    <ul class="advantages">
                        <li><strong>Puntos fuertes:</strong> Sencillo, rápido, IA integrada directamente en la herramienta.</li>
                        <li><strong>Puntos débiles:</strong> Sin búsqueda en la web, no es posible personalizar el prompt inicial de la IA.</li>
                    </ul>
                </div>
                <div class="help-subsection">
                    <h5><i class="fas fa-paste"></i> Opción B: Usa tu propia IA</h5>
                    <p>Haz clic en <button class="copy-btn">📋 Copiar prompt</button> y pega esta instrucción en tu inteligencia artificial favorita (ChatGPT, Le Chat, etc.). Luego, <strong>copia la respuesta de la IA</strong> y <strong>pégala</strong> en el campo de resultados de Caramel.</p>
                    <ul class="advantages">
                        <li><strong>Puntos fuertes:</strong> Flexibilidad total, posible acceso a internet, capacidad de modificar el prompt inicial y añadir documentos para la generación de contenido.</li>
                        <li><strong>Puntos débiles:</strong> Requiere copiar y pegar manualmente y una cuenta externa.</li>
                    </ul>
                </div>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">5</span> Crea y descarga tu archivo</h4>
                <p>Una vez que el contenido esté en el campo de resultados (ya sea generado por Albert o pegado por ti), haz clic en el botón <button class="download-btn">Generar H5P</button> (o .mbz/.xml según la actividad). Tu archivo se descargará, listo para ser integrado en tu plataforma Moodle o Éléa.</p>
                <p class="help-final-tip">¡Y ya está! Has creado una actividad interactiva en solo unos pocos clics. No dudes en experimentar con los diferentes modos y tipos de actividades para enriquecer tus cursos.</p>
            </div>
        </div>
    `,
    fast_mode: "Modo Rápido",
    guided_mode: "Modo Guiado",
    who_are_you: "¿Quién eres? (ej: Profesor, formador...)",
    what_to_address: "¿Qué quieres abordar? (ej: La naturaleza de un ángulo en 6º...)",
    discipline: "Disciplina (ej: Historia)",
    theme: "Tema (ej: La Revolución Francesa)",
    level: "Nivel (ej: Segundo de bachillerato profesional)",
    number_of_elements: "Número de elementos (ej: 10)",
    additional_info: "Información adicional y específica...",
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
    timeline_prompt_rule1_text: "-   `text`: Descripción en HTML (usa <p> y <strong>).",
    timeline_prompt_rule1_asset: "-   `asset`: Un objeto opcional para una imagen que ilustre el evento.",
    timeline_prompt_rule1_tag: "- `tag`: Una palabra clave que caracteriza el período (ej: 'historia', 'ciencia').",
    timeline_prompt_rule2: "2.  Para cada `asset`, busca activamente una imagen relevante y libre de derechos (ej: Wikimedia Commons). La URL en `media` debe ser un enlace directo y válido. Indica la fuente y la licencia en `credit`. Si no se encuentra ninguna imagen adecuada, omite el objeto `asset` por completo.",
    timeline_prompt_rule3: "3.  Para cada período (`era`), añade un campo `text` con una breve descripción y un `tag`.",
    timeline_prompt_example_json_title: "**Ejemplo de estructura JSON :**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Título de la línea de tiempo",
"text": "<p>Introducción al tema de la línea de tiempo.</p>",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Inicio de la Primera Guerra Mundial",
"text": "<p>Austria-Hungría declara la guerra a Serbia.</p>",
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
"text": "<p>Firma del armisticio en Rethondes, que marcó el fin de los combates.</p>",
"tag": "Tratado"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Primera Guerra Mundial",
"text": "<div>Es el período de la Gran Guerra.</div>",
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
    crossword_prompt_clue: "`clue`: La definición correspondiente.",
    crossword_prompt_extra_clue_optional: "`extraClue` (opcional): Un objeto que contiene una pista adicional. La IA debe juzgar la pertinencia de añadir una.",
    crossword_prompt_task_description: "`taskDescription`: Una instrucción clara.",
    crossword_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo.",
    crossword_prompt_content_rules_title: "**Reglas de contenido :**",
    crossword_prompt_rule1: "1.  Las palabras (`answer`) deben ser términos únicos y relevantes.",
    crossword_prompt_rule2: "2.  Las definiciones (`clue`) deben ser cortas y precisas.",
    crossword_prompt_rule3: "3.  El resto de la estructura JSON (comportamiento, tema, etc.) debe mantenerse tal cual.",
    crossword_prompt_example_json_title: "**Ejemplo de JSON para una palabra :**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Crucigrama sobre Biología",
"words": [
{
"answer": "Célula",
"clue": "Unidad básica de la vida.",
"extraClue": {
"params": {
"text": "<p>Puede ser animal o vegetal.</p>"
}
}
},
{
"answer": "ADN",
"clue": "Molécula que porta la información genética."
}
],
"taskDescription": "<p>Completa la cuadrícula del crucigrama.</p>"
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
    essay_prompt_task_description: "`taskDescription`: Una instrucción clara que invite al alumno a redactar un texto sobre el tema. El tema debe estar en negrita (<strong>) y cada frase debe terminar con un salto de línea (<p>).",
    essay_prompt_keywords_array: "`keywords`: Un array de ${nombreQuestions} objetos, cada uno definiendo una palabra clave que el sistema deberá encontrar en la respuesta del alumno.",
    essay_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo.",
    essay_prompt_content_rules_title: "**Reglas de contenido :**",
    essay_prompt_rule1: "1.  Cada objeto en `keywords` debe contener la clave `keyword` con la palabra a buscar.",
    essay_prompt_rule2: "2.  Las palabras clave deben ser relevantes y esenciales para evaluar la comprensión del tema.",
    essay_prompt_rule3: "3.  La estructura JSON (comportamiento, etc.) debe mantenerse.",
    essay_prompt_rule4: "4. La instrucción (`taskDescription`) debe fomentar la escritura sin utilizar las palabras clave enumeradas en `keywords`, a excepción del nombre del tema si es necesario para la comprensión.",
    essay_prompt_example_json_title: "**Ejemplo de JSON para una palabra clave :**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "<p>Redacta un texto breve que explique la fotosíntesis.</p>",
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

    // Moodle XML Prompt
    moodle_xml_prompt_role: "Eres un experto en ingeniería pedagógica creando un banco de preguntas para una actividad de Test en Moodle/Éléa.",
    moodle_xml_prompt_intro: "Deseo crear un cuestionario de ${nombreQuestions} preguntas.",
    moodle_xml_prompt_content_title: "En cuanto al contenido :",
    moodle_xml_prompt_content_rule1: "Las respuestas incorrectas deben ser coherentes con el tema pero claramente falsas para evitar el azar.",
    moodle_xml_prompt_content_rule2: "La dificultad de las preguntas debe variar, idealmente de lo más simple a lo más complejo.",
    moodle_xml_prompt_content_rule3: "Simplifica la formulación manteniendo la precisión del contenido.",
    moodle_xml_prompt_content_rule4: "Para generar la retroalimentación, darás en una o dos frases los elementos de respuesta esperados",
    moodle_xml_prompt_question_types_intro: "Las preguntas deben distribuirse equitativamente entre los siguientes tipos :",
    moodle_xml_prompt_question_type_multichoice: "- opción múltiple (QCM, con una sola respuesta correcta),",
    moodle_xml_prompt_question_type_matching: "- emparejamiento (matching),",
    moodle_xml_prompt_question_type_numerical: "- numérica (respuesta numérica con o sin tolerancia),",
    moodle_xml_prompt_question_type_truefalse: "- verdadero/falso (truefalse).",
    moodle_xml_prompt_question_type_shortanswer: "- shortanswer (respuesta breve) con posibles respuestas alternativas,",
    moodle_xml_prompt_question_type_cloze: "- cloze (texto con huecos) con las categorías MULTICHOICE, MULTICHOICE_H, MULTICHOICE_V, MULTICHOICE_S, MULTICHOICE_HS, MULTIRESPONSE, MULTIRESPONSE_H, MULTIRESPONSE_HS, NUMERICAL, SHORTANSWER o SHORTANWSER_C, según lo más adecuado al contexto.",
    moodle_xml_prompt_form_title: "En cuanto a la forma :",
    moodle_xml_prompt_form_rule1: "El archivo XML debe :",
    moodle_xml_prompt_form_rule1_encoding: "Estar codificado en UTF-8 (insertar la línea de codificación).",
    moodle_xml_prompt_form_rule1_reusable: "Ser directamente reutilizable en Moodle, sin errores de formato.",
    moodle_xml_prompt_form_rule1_standard_structure: "Seguir la estructura XML estándar de Moodle (con <quiz>, <question>, etc.).",
    moodle_xml_prompt_form_rule1_special_chars: "Los símbolos matemáticos como '<' o '>' deben codificarse como entidades HTML (por ejemplo, `<` para '<' y `>` para '>') para evitar cualquier confusión con las etiquetas XML.",
    moodle_xml_prompt_generate_only_xml: "No comentes, no formatees, no resumas: solo quiero el contenido bruto del archivo XML. Respeta escrupulosamente el formato descrito, ya que pegaré el resultado en otra herramienta que espera este formato. Produce la respuesta en formato de código preformateado.",

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
    flashcards_prompt_role: "Eres un experto en ingeniería pedagógica creando una actividad H5P \"Flashcards\".",
    flashcards_prompt_mission: "**Tu misión :**",
    flashcards_prompt_generate_json: "Genera un objeto JSON completo y válido para una actividad H5P de tipo Flashcards. El JSON debe ser directamente utilizable.",
    flashcards_prompt_json_structure_title: "**Estructura JSON esperada :**",
    flashcards_prompt_json_structure_main_object: "El objeto debe contener :",
    flashcards_prompt_title: "`title`: Un título relevante para la actividad.",
    flashcards_prompt_description: "`description`: Una instrucción clara para el alumno.",
    flashcards_prompt_cards_array: "`cards`: Un array de ${nombreQuestions} objetos, donde cada objeto representa una tarjeta y contiene :",
    flashcards_prompt_text: "`text`: La pregunta o el término a adivinar (anverso).",
    flashcards_prompt_answer: "`answer`: La respuesta o la definición (reverso). Importante: la respuesta solo puede contener una palabra simple o un número.",
    flashcards_prompt_tip: "`tip` (opcional): Una pista en formato HTML para ayudar al alumno si la pregunta es difícil. Solo añade una pista si crees que es relevante.",
    flashcards_prompt_example_json_title: "**Ejemplo de JSON :**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "Las capitales de Europa",
"description": "Memoriza la capital de cada país. Haz clic en la tarjeta para ver la respuesta.",
"cards": [
{
"text": "Francia",
"answer": "París"
},
{
"text": "Países Bajos",
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
            "question": "<p>¿Es Francia un país?</p>",
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
            "question": "<p>¿Cuál es la capital de Francia?</p>",
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
            "questions": ["<p>París es la *capital* de Francia.</p>"],
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
            "taskDescription": "<p>¿Cuál es la capital de Francia?</p>",
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
    glossary_prompt_content: "`text`: La definición en formato HTML (usa <p>, <strong>, etc.).",
    glossary_prompt_content_rules_title: "**Reglas de contenido:**",
    glossary_prompt_rule1: "1.  Las definiciones deben ser claras, concisas y adaptadas al nivel de los alumnos.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Ejemplo de JSON para una entrada :**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Fotosíntesis",
"text": "<p>Proceso mediante el cual las plantas verdes transforman la luz solar en energía.</p>"
},
{
"title": "Célula",
"text": "<p>Unidad básica de todos los seres vivos.</p>"
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
    summary_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo, relacionado con el tema.",
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
    drag_word_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo, relacionado con el tema.",

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
    blanks_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo, relacionado con el tema.",

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
    mark_words_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo, relacionado con el tema.",
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
"text": "<p>¿Cuál es la fecha de la Toma de la Bastilla?</p>",
"answers": [
{ "text": "<p>14 de julio de 1789</p>", "iscorrect": 1 },
{ "text": "<p>4 de agosto de 1789</p>", "iscorrect": 0 },
{ "text": "<p>26 de agosto de 1789</p>", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Genera únicamente el objeto JSON válido, sin ningún comentario.",

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
    moodle_xml_name: "Test (Banco de preguntas)",
    moodle_xml_description: "Genere un banco de 10 preguntas para una actividad de cuestionario listas para importarse en formato XML.",
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
 
    // Dynamic content
    prompt_for_ia: "Prompt para la IA",
    copy_prompt: "📋 Copiar prompt",
    go_duck: "🦆 Ir a Duck.ai",
    go_mistral: "Ⓜ️ Ir a Le Chat",
    create_h5p_file: "Crear archivo H5P",
    integrate_h5p_libraries: "Integrar bibliotecas H5P:",
    paste_ia_result: "Pega el resultado de la IA en el área de abajo para crear tu módulo.",
    generate_h5p: "Generar H5P",
    create_xml_file: "Crear el archivo XML",
    paste_ia_result_xml: "Pegue el XML generado por la IA a continuación.",
    generate_xml_file: "Generar el archivo XML",

    create_mbz_file_appariement: "Crear el archivo Emparejamiento (.mbz)",
    paste_ia_result_appariement: "Pega abajo el JSON generado por la IA. El título de la actividad se extraerá automáticamente del JSON.",
    generate_mbz_appariement: "Generar la actividad Emparejamiento (mbz)",
    create_mbz_file_millionnaire: "Crear el archivo Millonario (.mbz)",
    paste_ia_result_millionnaire: "Pega abajo el JSON generado por la IA. El título de la actividad se extraerá automáticamente del JSON.",
    generate_mbz_millionnaire: "Generar la actividad Millonario (mbz)",

    create_mbz_file_qcm: "Crear archivo MCQ (.mbz)",
    paste_ia_result_qcm: "Pega abajo el JSON generado por la IA. El título de la actividad se extraerá automáticamente del JSON.",
    generate_mbz_qcm: "Generar actividad MCQ (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "El XML de Moodle aparecerá aquí...",
    paste_xml_placeholder: "Pegue aquí el XML completo generado por la IA...",

    // H5P campos de texto vacíos
    generate_prompts_placeholder: "El prompt para la IA aparecerá aquí una vez que hagas clic en 'Generar los prompts'.",
    paste_json_or_text: "Pega aquí el contenido JSON o el texto generado por la IA para crear tu actividad.",

    // Notifications
    prompts_generated_successfully: "¡Prompts generados con éxito!",
    error_please_fill_fields: "Por favor, rellena todos los campos en modo simple.",
    error_please_fill_guided_fields: "Por favor, rellena todos los campos en modo guiado.",
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
"question": "<p>Oslo es la capital de Noruega.</p>",
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
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo.",
    multiple_choice_prompt_content_rules_title: "**Reglas de contenido:**",
    multiple_choice_prompt_rule1: "1.  Solo debe haber una respuesta correcta (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Proporciona varias respuestas incorrectas (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Ejemplo de JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "<p>¿Cuál es el color real de la grosella negra (cassis)?</p>",
"answers": [
{
"correct": true,
"text": "<div>Violeta muy oscuro</div>"
},
{
"correct": false,
"text": "<div>Azul</div>"
},
{
"correct": false,
"text": "<div>Negro</div>"
}
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
    find_the_words_prompt_rule1: "1.  La `wordList` debe ser una única cadena de caracteres con palabras separadas por comas.",
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
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Instrucciones claras para la actividad.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Un array de cadenas de texto, cada una representando un párrafo a ordenar. Los párrafos deben estar en el orden correcto.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo.",
    sort_the_paragraphs_prompt_content_rules_title: "**Reglas de contenido:**",
    sort_the_paragraphs_prompt_rule1: "1.  El array `paragraphs` debe contener una lista de párrafos en el orden lógico correcto.",
    sort_the_paragraphs_prompt_example_json_title: "**Ejemplo de JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "<p>Mi rutina de la mañana:</p>",
"paragraphs": [
"<p>Primero, me despierto a las 7:30</p>",
"<p>Después, me visto</p>",
"<p>Luego, desayuno</p>",
"<p>Después, me cepillo los dientes</p>",
"<p>Finalmente, voy a la escuela</p>"
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
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: Un array de 6 objetos para el feedback final, con puntuaciones de 0-10, 11-30, 31-50, 51-70, 71-90 y 91-100. El texto (`feedback`) debe ser benévolo, gradual y siempre formulado en afirmativo.",
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
{"from": 0, "to": 100, "feedback": "Has acertado :numcorrect de :maxscore"}
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
    dialog_cards_prompt_rule2: "2. No añadas imágenes ni sonidos.",
    dialog_cards_prompt_rule3: "",
    dialog_cards_prompt_example_json_title: "**Ejemplo de JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "<p>Aprende los nombres de las frutas en francés</p>",
"description": "<p>Los nombres de las frutas se muestran en español. Da la vuelta a las cartas para ver la traducción correcta en francés.</p>",
"dialogs": [
{
"text": "<p style=\"text-align: center;\">Fresas</p>",
"answer": "<p style=\"text-align: center;\">Fraises</p>",
"image": {
"copyright": {
"license": "CC BY-SA",
"source": "https://commons.wikimedia.org/wiki/File:Bowl_of_Strawberries.jpg",
"author": "ShakataGaNai",
"title": "Bowl_of_Strawberries.jpg",
"version": "4.0"
},
"imageAltText": "Frutas rojas con hojas verdes"
},
"audio": [],
"tips": {}
},
{
"text": "<p style=\"text-align: center;\">Frambuesas</p>",
"answer": "<p style=\"text-align: center;\">Framboises</p>",
"image": {
"copyright": {
"license": "CC BY",
"source": "https://commons.wikimedia.org/wiki/File:Summer_raspberries,_2008.jpg",
"title": "Summer_raspberries,_2008.jpg",
"author": "www.bluewaikiki.com",
"version": "4.0"
},
"imageAltText": "Bayas rojas"
},
"audio": [],
"tips": {}
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
{"from": 0, "to": 50, "feedback": "¡Inténtalo de nuevo!"},
{"from": 51, "to": 75, "feedback": "¡Está bastante bien!"},
{"from": 76, "to": 100, "feedback": "¡Muy bien hecho!"
}
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

    // Albert generation
    generate_with_albert: "Generar con Albert",
    generation_in_progress: "Generación en curso, por favor espere...",
    request_sent_to_ia: "Solicitud enviada a la IA, por favor espere...",
    generation_successful: "¡Contenido H5P generado con éxito!",
    generation_failed_empty: "La generación falló. La respuesta estaba vacía.",
    generation_failed_error: "Error durante la generación: {errorMessage}",

    // Albert models description
    albert_small_summary: "Rápido, simple, adecuado para ejercicios rápidos y estructurados.",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "Potente, matizado, ideal para tareas complejas y redacción.",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "Especializado, preciso, diseñado para la programación y el código.",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "Modelo de origen:",
    albert_model_parameters: "Tamaño del modelo:",
    albert_model_parameters_small: "8 mil millones de parámetros",
    albert_model_parameters_large: "24 mil millones de parámetros",
    albert_model_parameters_code: "32,5 mil millones de parámetros",
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
    -   \`definition\`: La definición clara y concisa.
    -   \`aliases\` (opcional): Un array de cadenas de texto para sinónimos o términos alternativos. Añade esta clave solo si existen alias relevantes.`,
    glossaire_xml_prompt_example_title: "**Ejemplo de JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "El léxico de la información",
  "entries": [
    {
      "concept": "Periodista",
      "definition": "Persona que recopila, verifica y difunde información.",
      "aliases": ["Reportero", "Cronista"]
    },
    {
      "concept": "Fuente",
      "definition": "Origen de una información."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Genera solo el código JSON válido, sin ningún comentario."
};