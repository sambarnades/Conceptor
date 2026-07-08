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
version: 1.2.0
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
  **«Seleccione un archivo»**) en formato **PDF, DOCX, PPTX, ODT,
  ODP, PNG, JPEG**. También puede soltar un **archivo de audio** (MP3, M4A, WAV…) o un **vídeo** (MP4, MOV…): solo se transcribe automáticamente la pista de audio (mediante Albert, el servicio soberano de la DINUM; véase la confidencialidad más abajo). La zona de carga muestra **«Arrastre y suelte
  un documento aquí (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)»** con
  un separador **«o»**.
- **Importar una página web**: pegar su enlace (`https://…`) en el
  campo situado debajo de la zona de carga y luego hacer clic en
  **«Añadir»**. El texto de la página se recupera automáticamente.

La extracción del texto de los **documentos e imágenes** se realiza
**completamente en local** en su navegador (no se envía ningún dato).
**Dos excepciones transitan por nuestros servidores (alojados en
Francia):** la **transcripción de audio** y la **importación de una
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
- **Texto para completar complejo** ★ — retroalimentaciones específicas por error.
- **Diagrama** — circular o de barras para visualizar datos.
- **Presentación de curso** — diapositivas interactivas con ejercicios integrados.
- **Libro interactivo** — libro multicapítulo (textos, tablas, imágenes, ejercicios) con índice y resumen.
- **Vídeo interactivo** — preguntas (opción múltiple, verdadero/falso, rellenar huecos) en momentos clave de un vídeo, con resumen final. Necesita una URL de vídeo (Tubes de Apps Éducation, PodEduc o YouTube); Caramelia la pide antes de generar.
- **Imagen interactiva** — puntos clicables sobre una imagen que usted adjunta. Caramel detecta automáticamente las zonas clave de la imagen según su contexto (disciplina, nivel, tema) y coloca los puntos, y luego redacta el contenido de cada punto. Después, en el editor, puede añadir manualmente texto, una imagen, un sonido o un vídeo en un punto, y elegir el color y el tipo de marca (números, icono). Pide adjuntar un archivo de imagen (PNG, JPEG, WebP, e incluso HEIC/foto de iPhone o TIFF); Caramel lo analiza desde el momento de la carga. También exportable como documento (DOCX, ODT, PDF) con pastillas numeradas.
- **Encontrar la zona (Find the Hotspot)** — pregunta que se responde haciendo clic directamente en una imagen que usted adjunta: Caramel detecta las zonas de la imagen, elige LA zona correcta según su contexto y redacta la consigna y los feedbacks (las demás zonas actúan como distractores; la puntuación se decide en el primer clic). Como en la Imagen interactiva, hay que adjuntar un archivo de imagen, analizado desde el momento de la carga. En el editor, las zonas se desplazan directamente sobre la imagen (verde = correcta, rojo = distractor). También exportable como documento (DOCX, ODT, PDF) con enunciado para el alumno y corrección.
- **Encontrar las zonas (Find Multiple Hotspots)** — búsqueda de zonas en una imagen que usted adjunta: el alumno debe hacer clic en TODAS las zonas correctas (las verduras, los errores, los riesgos…). Caramel elige las zonas correctas según su contexto, nombra lo que se busca y redacta la consigna y los feedbacks. Mismo flujo que la Imagen interactiva (archivo de imagen analizado desde el momento de la carga, zonas editables sobre la imagen). También exportable como documento (DOCX, ODT, PDF).

### Actividades Éléa / Magistère

- **Cuestionario (XML / GIFT)** — banco de preguntas variadas (opción múltiple, emparejamiento…)
  para importar en un cuestionario Éléa/Magistère.
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

La aplicación Caramel se apoya, únicamente durante la generación en un clic, en modelos de IA operados por ILaaS, una federación de infraestructuras de IA mutualizadas. Las solicitudes se envían a través de un workflow n8n alojado por el Incubateur y luego se transmiten a ILaaS para su ejecución en servidores de confianza alojados en centros de datos acreditados de la Enseñanza Superior y la Investigación francesa (ESR). Caramel no ejecuta los modelos y no procesa ni almacena datos por su cuenta; los datos se utilizan únicamente para ejecutar la solicitud y no se envían a IA de uso general. Los modelos actualmente disponibles incluyen Mistral-Small-3.2 (24 mil millones de parámetros), Qwen 3.6 (35 mil millones de parámetros) y GPT-OSS (120 mil millones de parámetros). Las modalidades de alojamiento, registro y conservación que pueda efectuar ILaaS están sujetas a su propia política de privacidad y a sus condiciones de servicio, a las cuales conviene referirse.

#### Tratamiento de las solicitudes de los usuarios mediante n8n y el Incubateur del Ministerio de Educación nacional

Nuestro sitio utiliza una solución técnica desarrollada con n8n, una herramienta de código abierto alojada por el Incubateur del Ministerio de Educación nacional francés. Mediante un workflow automatizado, este servicio transforma las solicitudes de los usuarios en datos estructurados (formato JSON) para interactuar con una IA de la DINUM, por tanto soberana. Ninguna información sensible se expone ni se transmite sin cifrado, garantizando así la confidencialidad y seguridad de los intercambios.

#### Accesibilidad

La aplicación está diseñada para ser compatible con un uso en ordenador, incluyendo los modos oscuro/claro, la navegación con teclado y el contraste elevado según los temas. Se está realizando una mejora continua de la accesibilidad, en línea con las recomendaciones del RGAA.

### Enlaces útiles

- **Licencia**: GNU GPL v3.0 o posterior — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
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
