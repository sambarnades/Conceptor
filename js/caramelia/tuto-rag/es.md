<!--
Base de conocimientos de Caramelia (asistente pedagógica de Caramel).
Este archivo es DOCUMENTACIÓN DE REFERENCIA, no un prompt de sistema.
No debe añadirse aquí ninguna instrucción dirigida al LLM.

REGLA DE EDICIÓN: todas las etiquetas mencionadas a continuación
(botones, pestañas, campos, secciones) deben reproducir EXACTAMENTE
el texto visible en pantalla en Caramel. Fuente única de verdad:
js/locales/es.json + index.html. Toda edición se realiza mediante PR.
-->
---
version: 1.3.0
lang: es
audience: docentes
---

# Tutorial Caramel

Caramel es una herramienta web de código abierto que ayuda a los profesores a crear
actividades pedagógicas interactivas (H5P, Éléa, Magistère, Moodle)
con la ayuda de la IA. El sitio funciona 100 % en el navegador:
ningún dato pedagógico se envía a un servidor externo.

## Describir su necesidad (en la parte superior de la página)

En la parte superior de la página, dos pestañas permiten elegir cómo
describir su necesidad:

- **Modo Rápido** — formulario mínimo, dos campos.
- **Modo Avanzado** — los mismos campos más opciones adicionales,
  incluida la posibilidad de adjuntar documentos.

### Modo Rápido

Solo dos campos:

- **«¿Quién es usted? (ej: Profesor, formador...)»**
- **«¿Qué desea abordar? (ej: La revolución francesa...)»**

### Modo Avanzado

Los mismos campos que el Modo Rápido, además de:

- **«Para qué nivel (ej: Segundo de bachillerato profesional)»**
- **«Número de preguntas/elementos en el módulo (ej: 5)»** — según
  la actividad, esto corresponde al número de preguntas, de fechas
  en una línea de tiempo, de palabras en un glosario, etc.
- Un campo libre para añadir **información adicional**
  (instrucciones específicas, restricciones o cualquier otro
  detalle pertinente).

### Adjuntar documentos (opcional) — solo en Modo Avanzado

Esta sección, titulada **«Adjuntar documentos (opcional)»**,
solo aparece cuando se selecciona la pestaña **Modo Avanzado**.
Permite basar la generación en un contenido proporcionado por usted.

Tres posibilidades:

- **Copiar y pegar un texto** directamente en el área de entrada.
- **Arrastrar y soltar un documento** (o hacer clic en
  **«Seleccione un archivo»**) en formato **PDF, TXT, DOCX, PPTX, ODT,
  ODP, PNG, JPEG** (las imágenes **WebP** y **BMP** también se aceptan, sin figurar en la lista mostrada en pantalla). Una **imagen** depositada (foto, esquema, diagrama…) es **analizada por una IA de visión** que redacta una **descripción** de la misma y **transcribe fielmente el texto** que contiene — si la IA no está disponible, la lectura local (OCR) toma automáticamente el relevo. También puede soltar un **archivo de audio** (MP3, M4A, WAV…) o un **vídeo** (MP4, MOV…): solo se transcribe automáticamente la pista de audio (mediante Albert, el servicio soberano de la DINUM; véase la confidencialidad más abajo). La zona de carga muestra **«Arrastre y suelte uno o varios documentos aquí (PDF, TXT, DOCX, PPTX, ODT, ODP, PNG, JPEG)»** con
  un separador **«o»**.
- **Importar una página web**: pegar su enlace (`https://…`) en el
  campo situado debajo de la zona de carga y luego hacer clic en
  **«Añadir»**. El texto de la página se recupera automáticamente.

La extracción del texto de los **documentos** se realiza
**completamente en local** en su navegador (no se envía ningún dato).
**Tres excepciones transitan por nuestros servidores (alojados en
Francia):** el **análisis de las imágenes** (la imagen se envía al
modelo de visión durante el tiempo del análisis, nunca se conserva;
en caso de indisponibilidad, el OCR local — que no envía nada — toma
el relevo), la **transcripción de audio** y la **importación de una
página web** (el enlace que usted introduce se envía allí para
extraer su texto; los enlaces a PDF, vídeos o páginas de pago no son
compatibles).

Si deja esta zona vacía, la IA se basará únicamente en sus
conocimientos generales para generar la actividad.

## Elegir el tipo de actividad

Una vez realizada la descripción, las fichas de actividades se vuelven
clicables. Haga clic en la que corresponde a su objetivo
pedagógico. Los filtros encima de las fichas permiten restringir la
visualización: **Todo**, **Quiz & Tests**, **Manipulación de texto**,
**Memorización & Descubrimiento**, así como las plataformas **H5P**,
**Éléa**, **Moodle**.

Debajo del formulario, **Una actividad** muestra estas fichas; **Un itinerario** abre el taller que reúne varias actividades en un curso completo (véase «Crear y retomar un curso completo»).

### Actividades H5P

Actividades en formato H5P. Las marcadas con una estrella (★) integran
una retroalimentación detallada en 4 tramos de puntuación.

- **Línea de tiempo** — secuencia interactiva de eventos.
- **Tarjetas de memoria (Flashcards)** — anverso-reverso para la memorización.
- **Quiz de opción múltiple (Question Set)** ★ — quiz de preguntas de opción múltiple.
- **Quiz Verdadero/Falso (Question Set)** ★ — quiz verdadero o falso.
- **Quiz mixto (Question Set)** ★ — preguntas variadas (opción múltiple, arrastrar y soltar…).
- **Glosario** — acordeón desplegable o FAQ.
- **Crucigrama** ★ — cuadrícula generada a partir de definiciones.
- **Redacción** ★ — tema de redacción con corrección por palabras clave.
- **Resumen** ★ — el alumno reconstruye un resumen eligiendo las frases correctas.
- **Arrastrar palabras** ★ — texto con palabras faltantes para arrastrar.
- **Arrastrar y soltar** ★ — etiquetas que se colocan en una zona.
- **Texto para completar** ★ — el alumno escribe las palabras con el teclado.
- **Resaltar palabras** ★ — el alumno resalta ciertas palabras en un texto.
- **Verdadero/Falso** — preguntas binarias simples.
- **Opción múltiple** ★ — preguntas con una o varias respuestas correctas.
- **Sopa de letras** — cuadrícula de letras con palabras a encontrar.
- **Ordenar párrafos** ★ — colocar párrafos en el orden correcto.
- **Serie de elección única** ★ — preguntas con una sola respuesta correcta.
- **Tarjetas de diálogo** — tarjetas anverso-reverso con texto y audio.
- **Dictado** — dictado con audio: frases leídas por síntesis de voz (voz F/M, velocidad normal o lenta, 11 idiomas), el alumno las escribe y la corrección resalta los errores.
- **Texto para completar complejo** ★ — retroalimentaciones específicas por error.
- **Diagrama** — circular o de barras para visualizar datos.
- **Presentación de curso** — diapositivas interactivas con ejercicios integrados.
- **Libro interactivo** — libro multicapítulo (textos, tablas, imágenes, ejercicios) con índice y resumen.
- **Vídeo interactivo** — preguntas (opción múltiple, verdadero/falso, rellenar huecos) en momentos clave de un vídeo, con resumen final. Necesita una URL de vídeo (Tubes de Apps Éducation, PodEduc o YouTube); Caramelia la pide antes de generar.
- **Imagen interactiva** — puntos clicables sobre una imagen que usted adjunta. Caramel detecta automáticamente las zonas clave de la imagen según su contexto (disciplina, nivel, tema) y coloca los puntos, y luego redacta el contenido de cada punto. Después, en el editor, puede añadir manualmente texto, una imagen, un sonido o un vídeo en un punto, y elegir el color y el tipo de marca (números, icono). Pide adjuntar un archivo de imagen (PNG, JPEG, WebP, e incluso HEIC/foto de iPhone o TIFF); Caramel lo analiza desde el momento de la carga. También exportable como documento (DOCX, ODT, PDF) con pastillas numeradas.
- **Encontrar la zona (Find the Hotspot)** — pregunta que se responde haciendo clic directamente en una imagen que usted adjunta: Caramel detecta las zonas de la imagen, elige LA zona correcta según su contexto y redacta la consigna y los feedbacks (las demás zonas actúan como distractores; la puntuación se decide en el primer clic). Como en la Imagen interactiva, hay que adjuntar un archivo de imagen, analizado desde el momento de la carga. En el editor, las zonas se desplazan directamente sobre la imagen (verde = correcta, rojo = distractor). También exportable como documento (DOCX, ODT, PDF) con enunciado para el alumno y corrección.
- **Encontrar las zonas (Find Multiple Hotspots)** — búsqueda de zonas en una imagen que usted adjunta: el alumno debe hacer clic en TODAS las zonas correctas (las verduras, los errores, los riesgos…). Caramel elige las zonas correctas según su contexto, nombra lo que se busca y redacta la consigna y los feedbacks. Mismo flujo que la Imagen interactiva (archivo de imagen analizado desde el momento de la carga, zonas editables sobre la imagen). También exportable como documento (DOCX, ODT, PDF).

### Actividades Éléa / Magistère

- **Cuestionario (MBZ / XML / GIFT)** — actividad Cuestionario lista para restaurar en **`.mbz`**
  (banco de preguntas + cuestionario ya configurado), o banco de preguntas variadas (opción múltiple,
  emparejamiento…) para importar (XML / GIFT) en un cuestionario Éléa/Magistère.
- **Cuestionario de opción múltiple (MBZ)** — actividad de opción múltiple simple y rápida.
- **Emparejamiento (MBZ)** — juego de asociación entre pares de elementos.
- **Millonario (MBZ)** — quiz lúdico con dificultad creciente.
- **Glosario (XML)** — archivo de importación para un glosario Éléa/Magistère.
- **Página (MBZ / HTML)** — página de curso estructurada y formateada.
- **Libro (MBZ)** — libro de varios capítulos con navegación.
- **Tarea (MBZ)** — tarea con rúbrica de evaluación por criterios.

## Generar y afinar el contenido

Después de hacer clic en una ficha, se abre una ventana. Aquí es donde
interactúa con la IA. En la parte superior de esta ventana, una bascula
**Simple / Guiado** permite elegir el modo de visualización.

### Vista Simple — botón «Generar en un clic»

La vía rápida. Haga clic en **«Generar en un clic»**: la IA produce
el contenido y lo coloca directamente en la zona de resultado a la derecha.
La pequeña flecha a la derecha del botón permite elegir entre diferentes
modelos de IA (rápido, potente…).

### Vista Guiado — utilizar una IA externa

Para un control máximo. El prompt aparece a la izquierda.

1. Modifique el prompt si lo desea.
2. Haga clic en **«Copiar el prompt»** y abra una IA externa
   en una nueva pestaña.
3. Pegue el prompt en la IA, recupere su respuesta y luego péguela
   en la zona de resultado a la derecha en Caramel.

Dos iconos útiles, en la parte superior de la zona del prompt:
**«Pantalla completa»** para mayor comodidad, y **«Bloquear»**
(que se convierte en **«Desbloquear»**) para proteger el prompt.

## Visualizar, editar y descargar

Una vez generado el contenido, aparece la ventana **«¡Tu dulce está listo!»**,
con dos opciones: **«Visualizar y editar»** o **«Continuar»**
(para generar otra actividad).

### Visualizar

Un simulador integrado prueba la actividad como un alumno (haga clic,
arrastre, escriba…). Para los contenidos Éléa/Magistère, un simulador
muestra el resultado real.

### Editar (icono lápiz, botón **«Editar»**)

El editor visual se adapta automáticamente al tipo de actividad: lista
de elementos a la izquierda, detalle a la derecha.

- **Barra de texto enriquecido** en los campos compatibles: negrita, cursiva,
  subrayado, tachado, superíndice, subíndice, color, listas, enlace.
- Botón `</>` para cambiar al **modo código fuente**.
- **Fórmulas matemáticas** mediante el botón **√x**: 6 categorías
  (fracciones, raíces, potencias, letras griegas, operadores,
  estructuras), vista previa en tiempo real, doble clic para modificar.
- **Palabras a encontrar** (Arrastrar palabras, Resaltar palabras,
  Texto para completar): resaltado amarillo automático, botones
  Marcar / Quitar, o asteriscos `*palabra*`.
- **Texto para completar (Cloze)** en Cuestionario: tres tipos de huecos
  (Opción múltiple, Respuesta corta, Valor numérico), mostrados
  como pastillas de colores (azul, amarillo, verde).
- **Imágenes**: arrastrar y soltar, redimensionado automático
  (800×600), texto alternativo, formatos JPEG / PNG / WebP.

### Descargar

El botón **«Descargar»** ofrece dos familias de formatos:

- **Formatos interactivos** (digitales, para Éléa/Magistère):
  H5P, MBZ, XML.
- **Formatos imprimibles** (versiones desconectadas): DOCX, ODT, PDF.

## Integrar el archivo generado en Éléa

> Nota: las etiquetas entre comillas a continuación están en francés, ya que corresponden a la interfaz de la plataforma Éléa, utilizada principalmente en contexto francófono.

### Integrar un archivo H5P

- **Método rápido**: pasar al modo edición del recorrido,
  arrastrar y soltar el archivo `.h5p` directamente, elegir
  « Ajouter une activité H5P » y luego confirmar con **« DÉPOSER »**.
- **Método recomendado**: « Ajouter une activité ou une ressource »
  → « Contenu interactif (H5P) » → pestaña « Téléverser » →
  seleccionar el archivo → **« Utiliser »** → guardar.

### Integrar un archivo MBZ

1. Abrir el menú de edición a la derecha (haga clic en la flecha para
   desplegarlo si es necesario).
2. Hacer clic en **« IMPORT/EXPORT »** → **« Importer un parcours »**.
3. Arrastrar y soltar el archivo `.mbz` → **« IMPORTER »**.
4. **« CONTINUER »**.

### Integrar un XML (banco de preguntas Test)

1. Pestaña **« Plus »** → **« Banque de questions »**.
2. Menú **« Questions »** → **« Importer »**.
3. Marcar el formato (XML Magistère recomendado, o GIFT).
4. Arrastrar y soltar el archivo → **« IMPORTATION »** → **« CONTINUER »**.

### Integrar un XML Glosario

1. Crear un Glosario vacío en el recorrido.
2. Hacer clic en **« IMPORTER DES ARTICLES »**.
3. Arrastrar y soltar el archivo `.xml` → **« ENVOYER »** → **« CONTINUER »**.

### Integrar un archivo HTML en una actividad Página

1. Abrir el `.html` con un editor de texto, copiar todo el contenido.
2. En Éléa, añadir una actividad **« Page »**.
3. En el editor: **« Outils → Code source »**.
4. Pegar el HTML → guardar.

## Acerca de Caramel

### Autores

Si el usuario desea contactar al equipo:

- **Gauthier REMANDE** — Profesor de enseñanza profesional, Letras-Historia — gauthier.remande@ac-nantes.fr
- **Emmanuel GAUNARD** — Profesor de matemáticas y encargado de misión DRANE — Académie de Grenoble — emmanuel.gaunard@ac-grenoble.fr

### Aviso legal

#### Datos personales

No se recopila ni se almacena ningún dato personal. No se utiliza ninguna cookie de seguimiento.

#### Modelos de Inteligencia Artificial

La aplicación Caramel se apoya, únicamente durante la generación en un clic, en modelos de IA operados por ILaaS, una federación de infraestructuras de IA mutualizadas. Las solicitudes se envían a través de un workflow n8n alojado por el Incubateur y luego se transmiten a ILaaS para su ejecución en servidores de confianza alojados en centros de datos acreditados de la Enseñanza Superior y la Investigación francesa (ESR). Caramel no ejecuta los modelos y no procesa ni almacena datos por su cuenta; los datos se utilizan únicamente para ejecutar la solicitud y no se envían a IA de uso general. Los modelos actualmente disponibles incluyen Gemma 4 (31 mil millones de parámetros), Qwen 3.8 (27 mil millones de parámetros) y Mistral Small 4 (119 mil millones de parámetros). Las modalidades de alojamiento, registro y conservación que pueda efectuar ILaaS están sujetas a su propia política de privacidad y a sus condiciones de servicio, a las cuales conviene referirse.

#### Tratamiento de las solicitudes de los usuarios mediante n8n y el Incubateur del Ministerio de Educación nacional

Nuestro sitio utiliza una solución técnica desarrollada con n8n, una herramienta de código abierto alojada por el Incubateur del Ministerio de Educación nacional francés. Mediante un workflow automatizado, este servicio transforma las solicitudes de los usuarios en datos estructurados (formato JSON) para interactuar con una IA de la DINUM, por tanto soberana. Ninguna información sensible se expone ni se transmite sin cifrado, garantizando así la confidencialidad y seguridad de los intercambios.

#### Accesibilidad

La aplicación está diseñada para ser compatible con un uso en ordenador, incluyendo los modos oscuro/claro, la navegación con teclado y el contraste elevado según los temas. Se está realizando una mejora continua de la accesibilidad, en línea con las recomendaciones del RGAA.

### Enlaces útiles

- **Licencia**: GNU AGPL v3.0 o posterior — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
- **Reportar un error**: https://forge.apps.education.fr/caramel/caramel/-/issues
- **Código fuente**: https://forge.apps.education.fr/caramel/caramel
- **Changelog**: https://forge.apps.education.fr/caramel/caramel/-/blob/main/CHANGELOG

## Marco de respuesta de Caramelia

- Caramelia siempre responde en el idioma del usuario.
- Respuestas concisas, amigables, pedagógicas (1 a 3 párrafos).
- Emojis con moderación (1 o 2 como máximo).
- Cuando cita un botón, una pestaña, un campo o una sección del
  sitio, Caramelia utiliza **exactamente** la etiqueta visible en
  pantalla, tal como aparece arriba (por ejemplo **«Modo Avanzado»**,
  **«Adjuntar documentos (opcional)»**, **«Generar en un clic»**).
  No inventa nombres de pasos («etapa 1»…) ni términos técnicos
  internos («opción RAG»…) que no aparecen en la interfaz.
- Si el usuario quiere generar una actividad, Caramelia propone el
  tipo más adecuado pero NUNCA genera el JSON de una actividad.
- Para cualquier pregunta de integración, Caramelia da los pasos
  precisos indicados arriba.

<!-- parcours-complet -->
## Crear y retomar un curso completo

En Caramel, **Un itinerario** crea un curso para Éléa, Magistère o Moodle: varias actividades organizadas en secciones dentro de un solo archivo **.mbz**. El punto de partida es el formulario habitual: tema, público y documentos adjuntos. El taller usa el vocabulario de la plataforma elegida: alumnos en Éléa, personas en formación en Magistère, estudiantes en Moodle, tanto en pantalla como en el curso y en los textos que redacta la IA.

En el menú de Caramelia, **Crear un curso** abre directamente el taller sin llamar a la IA. Si existe un borrador, **Retomar mi curso** lo recupera. Se conservan los campos y las fuentes existentes. Revisa la configuración y el plan en el taller antes de iniciar la generación.

Elija **Un itinerario** debajo del formulario, después la plataforma, modalidad, extensión, **Un mismo camino para todos** o **Caminos según los resultados**, y una plantilla: las más habituales se proponen primero —aprender de forma autónoma, repasar, entrenarse, evaluar— y **Ver las demás plantillas** muestra las siguientes. **Componer el plan** adapta un plan al tema con IA. **Partir de la plantilla** abre inmediatamente una estructura por completar, sin llamar a la IA. Las actividades solo se generan después de validar el plan.

En **Plan**, edite el título, objetivo general, conceptos clave, etapas y actividades. Mueva actividades con las flechas o arrastrando su miniatura. **Instrucciones y etapa** permite ajustar las instrucciones de generación. Las orientaciones pedagógicas ayudan a revisar sin imponer un modelo. El máximo es de **12 actividades**.

En la tarjeta de un **Vídeo interactivo**, pegue el enlace del vídeo. La transcripción se obtiene durante la generación; también puede pegarla manualmente. Para **Imagen interactiva**, **Encontrar la zona** o **Encontrar las zonas**, adjunte una imagen en la tarjeta: se analizará antes de generar el contenido. También puede añadir estos recursos durante la generación. Una actividad sin recurso espera mientras las demás avanzan. El escenario conserva las imágenes y los enlaces de las actividades; los documentos del formulario inicial quedan aparte. Para un **Enlace web**, pegue la dirección del recurso en la tarjeta: la IA redacta la consigna de lectura sin abrir la página.

Con el contenido listo, **Modificar el contenido** abre el editor habitual y **Vista previa** abre el reproductor. **Revisar el curso** permite revisarlas en orden con **Anterior** y **Siguiente**. Guarde los cambios para incluirlos en el plan y los archivos exportados. Cambiar una instrucción del plan no reescribe el contenido existente.

Valide el plan para iniciar la generación. Puede detenerla, retomar actividades pendientes o regenerar una actividad. El candado **No generar esta actividad** reserva el contenido para completarlo manualmente: la IA no lo genera. Si falla una regeneración, se conserva el contenido anterior. Se indican las actividades ausentes antes de exportar.

**Exportar el guion (.json)** guarda el plan y los contenidos listos en un archivo **.json**. El botón **Personalizar el plan**, junto a **Componer el plan**, abre la misma ventana que para una actividad: copie el prompt en la IA que prefiera y pegue su respuesta. **Retomar un guion** está en esta ventana; el archivo **.json** se descarga en la entrega, junto al **.mbz**. El borrador solo se conserva en esta pestaña: exporte el escenario antes de cerrarla. El escenario no incluye tema, público ni adjuntos; introdúzcalos de nuevo antes de generar contenido nuevo.

En **Entrega**, descargue el **.mbz** y utilice la importación o restauración de cursos de su plataforma. Este archivo de curso no se carga en una actividad H5P. El itinerario aparece también en la zona de notificaciones: **Ver** abre la **Vista del itinerario**, con la bienvenida, cada etapa y sus actividades, que puede revisar y modificar antes de volver a descargar. Conserve el **.json** para volver a Caramel. La ficha de secuencia y el detalle de las actividades se exportan en **DOCX, ODT o PDF**.

El plan también propone los módulos de su Éléa, Magistère o Moodle, agrupados en el menú de cada actividad bajo **Módulos de la plataforma**: foro, consulta, cuestionario, encuesta, lección, taller de evaluación entre pares, tablero, wiki, documento colaborativo, glosario y base de datos por construir, aula virtual, elección de grupo, intercambio de archivos y enlace web. La IA redacta lo que la plataforma conserva al importar; los espacios colectivos llegan vacíos, con su consigna. Cuando un módulo requiere un ajuste en la plataforma (fases del taller, hora del aula virtual, grupos), Caramel lo indica en una nota **Por hacer antes de abrir el curso**, oculta para los alumnos, al principio del curso importado. El **paquete de contenido IMS** —páginas para leer con su índice, escritas íntegramente por Caramel— se elige en el mosaico; el plan no lo propone.

El mapa de progreso es exclusivo de Éléa. El mapa, el acceso progresivo y los caminos según los resultados aún requieren comprobaciones en uso real. La colaboración ocurre en la plataforma. La publicación del curso completo en Sucrerie aún no está disponible.

Para saber más: [ABC Learning Design (UCL)](https://www.ucl.ac.uk/short-courses/staff-resources/course-design/designing-learning-activities) ayuda a reflexionar sobre las actividades de aprendizaje. Las siete familias de Caramel, entre ellas **Debatir** y **Colaborar**, son orientaciones simplificadas según las herramientas, no los seis tipos ABC ni una evaluación de su enseñanza.
En Éléa, abre **Ajustes del curso**, activa el mapa de progreso y utiliza la tarjeta **+ Añadir mi imagen** para elegir tu propio fondo. Puedes cambiar o quitar la imagen y volver a los temas propuestos. El fondo se conserva en el escenario **.json** y se incluye en el curso **.mbz**. JPEG, PNG, HEIC, WebP, GIF, BMP, AVIF, SVG o TIFF · Máx. 12 MB. Conversión automática, sin recortar.

<!-- parcours-trames -->
### Elegir una plantilla

Tras **Un itinerario**, la plantilla da el desarrollo que la IA adapta al tema. La lista mostrada depende de la modalidad y la extensión elegidas; cada actividad sigue siendo modificable en el plan.

- **Aprender de forma autónoma** — Un concepto nuevo, aprendido en solitario: descubrirlo paso a paso, practicar con corrección inmediata, retener lo esencial y comprobar. *(Una sesión · De dos a tres sesiones · Una secuencia completa)*
- **Repasar antes de la evaluación** — Se sitúa lo adquirido, se vuelve a poner lo esencial a la vista, se practica y se hace una autoevaluación. *(Una sesión · De dos a tres sesiones)*
- **Entrenarse** — Un repaso para reactivar, ejercicios con opciones y después sin ellas, una comprobación final: la dificultad aumenta y no se repite la lección. *(Una sesión · De dos a tres sesiones · Una secuencia completa)*
- **Evaluar** — Lo que se espera, un entrenamiento con el formato y después la evaluación: un solo intento, cronometrado, sin corrección visible; al final, solo la calificación. *(Una sesión)*
- **Remediar tras la evaluación** — Se parte de los errores constatados: se nombran, se reexplica el punto exacto, se rehace y se vuelve a comprobar. *(Una sesión · De dos a tres sesiones · A distancia · Ambas)*
- **Ritual corto** — Diez minutos, siempre con la misma forma. Es la repetición la que fija, no la variedad. *(Una sesión)*
- **Descubrir un concepto** — Una situación que interroga, documentos que explorar, luego la síntesis, y solo después la aplicación. *(De dos a tres sesiones · Una secuencia completa)*
- **Clase invertida** — La cápsula y su comprobación en casa, la tarea que no se puede hacer solo en clase, el balance después. *(Una sesión · De dos a tres sesiones · Ambas)*
- **Estudiar una obra** — Entrar en el texto o la imagen, localizar, situar, interpretar, y luego producir su propia lectura. *(De dos a tres sesiones · Una secuencia completa)*
- **Llevar a cabo una investigación** — Una pregunta, una hipótesis, unos datos, una conclusión: el método científico, en orden. *(De dos a tres sesiones · Una secuencia completa · En clase · Ambas)*
- **Analizar una fuente** — De dónde viene la información, quién la produce, qué omite. Equipar la mirada antes de juzgar. *(Una sesión · De dos a tres sesiones)*
- **Debate argumentado** — Una votación para saber de dónde se parte, fuentes para informarse, un foro para debatir y un texto para concluir. *(De dos a tres sesiones · Una secuencia completa)*
- **Diferenciar desde el principio** — Una prueba inicial abre a cada alumno un camino adaptado a su resultado; todos se reúnen para un balance común. *(Una sesión · De dos a tres sesiones · Caminos según los resultados)*
- **Remediar sobre la marcha** — Se descubre y se hace balance con un quiz: según la puntuación, se repasa o se va más allá; después, todos aplican juntos lo aprendido. *(Una sesión · De dos a tres sesiones · Caminos según los resultados)*
- **Secuencia de lengua extranjera** — Primero el léxico, después la comprensión, la producción al final. *(De dos a tres sesiones)*
- **Preparar una intervención oral** — Qué se va a decir, en qué orden y cómo se ensaya decirlo. *(Una sesión · De dos a tres sesiones · En clase · Ambas)*
- **Aprender a aprender** — Lo que de verdad ayuda a recordar, probado con el tema del curso: ponerse a prueba, espaciar, explicar. Después, cada uno planifica sus repasos. *(Una sesión · De dos a tres sesiones)*
- **Formarse de manera autónoma** — Nadie detrás de la pantalla: el itinerario debe bastarse a sí mismo, del índice a la evaluación final. *(De dos a tres sesiones · Una secuencia completa · A distancia)*
- **Formación híbrida en tres tiempos** — La preparación a distancia, la sesión presencial, y después la puesta en práctica y el retorno de experiencia. El formato de los itinerarios de formación. *(Una secuencia completa · Ambas)*
- **Trabajo por proyectos** — Un encargo con sus criterios, documentación, trabajo en equipo, una producción revisada entre iguales y luego mejorada. *(Una secuencia completa · En clase · Ambas)*
- **Trabajo en equipo** — Formar los equipos, reunir las ideas, escribir juntos y revisarse entre compañeros con una rúbrica. *(De dos a tres sesiones · Una secuencia completa)*
- **Juego de escape** — Una misión, pistas, enigmas de dificultad creciente, un código final y el debate posterior. *(Una sesión · De dos a tres sesiones · En clase · Ambas)*
- **Estructura libre** — Ningún desarrollo impuesto: compones tú las etapas y Caramel rellena lo que coloques en ellas. *(Una sesión · De dos a tres sesiones · Una secuencia completa)*
<!-- /parcours-trames -->

<!-- parcours-chemins -->
### Caminos según los resultados

En la configuración, **Caminos según los resultados** hace que sus alumnos pasen una prueba: según su calificación en el primer intento, cada uno sigue uno de los 2 a 4 caminos —**Repasar las bases**, **Reforzar**, **Consolidar**, **Profundizar**— y después todos se reúnen en una etapa común. Cada alumno solo ve su camino. Hay dos plantillas pensadas para ello: **Diferenciar desde el principio** y **Remediar sobre la marcha**.

- En **Plan**, la barra de puntuaciones muestra qué camino se abre con cada número de respuestas correctas; los botones **−** y **+** adelantan o retrasan en una respuesta correcta el inicio de un camino. **Añadir un camino**, **Quitar un camino** y **Un solo camino para todos** modifican la bifurcación.
- La prueba que orienta es un **Quiz de opción múltiple**, un **Quiz Verdadero/Falso** o un **Cuestionario**, situado al final de la etapa que precede a los caminos. Cada pregunta vale un punto y la prueba no permite volver a intentarlo.
- **Ver como alumno** muestra la página del curso tal como la verá el alumno —antes de la prueba, durante su camino, al final— para la puntuación que usted elija.
- Para reorientar a un alumno, modifique su calificación de la prueba en el libro de calificaciones de la plataforma.

Importe un itinerario con caminos en un curso **vacío**: Moodle coloca las secciones del archivo en las del curso, y sus secciones existentes recibirían las restricciones de los caminos. Ahora todos los itinerarios terminan con una sección **Fin del itinerario**, y la duración estimada aparece debajo de cada actividad.
<!-- /parcours-chemins -->
<!-- /parcours-complet -->
