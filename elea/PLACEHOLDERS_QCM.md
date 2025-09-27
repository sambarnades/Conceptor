# Documentation des Placeholders pour le Module QCM

Ce document décrit le mapping entre les données JSON générées par l'interface utilisateur et les placeholders utilisés dans les fichiers XML du module QCM pour Moodle.

| Clé JSON (depuis l'UI) | Placeholder XML | Nœud/Attribut XML Cible | Fichier(s) Concerné(s) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `{{ACTIVITY_TITLE}}` | `<name>` / `<itemname>` / `<original_course_fullname>` / `<title>` | `simplequiz.xml`, `grades.xml`, `moodle_backup.xml` | Le titre principal de l'activité QCM. |
| `questions` | `{{QUESTIONS_JSON}}` | `<questions>` | `simplequiz.xml` | La chaîne de caractères JSON contenant le tableau des questions et réponses. |
| (Généré) | `{{ACTIVITY_ID}}` | `activity/@id`, `simplequiz/@id`, `grade_item/iteminstance` | `simplequiz.xml`, `grades.xml` | ID unique de l'activité. |
| (Généré) | `{{MODULE_ID}}` | `activity/@moduleid`, `module/@id`, `activity/directory`, `setting/activity` | `simplequiz.xml`, `module.xml`, `moodle_backup.xml` | ID unique du module. |
| (Généré) | `{{SECTION_ID}}` | `module/sectionid` | `module.xml` | ID de la section du cours. |
| (Généré) | `{{TIMESTAMP}}` | `<timecreated>`, `<timemodified>`, `module/added` | `simplequiz.xml`, `grades.xml`, `module.xml` | Timestamp de la création. |
| (Généré) | `{{COURSE_ID}}` | `simplequiz/course`, `information/original_course_id` | `simplequiz.xml`, `moodle_backup.xml` | ID unique du cours. |
| (Généré) | `{{COURSE_CONTEXTID}}` | `information/original_course_contextid` | `moodle_backup.xml` | ID de contexte du cours. |
| (Généré) | `{{ACTIVITY_CONTEXTID}}` | `activity/@contextid` | `simplequiz.xml` | ID de contexte de l'activité. |
| (Généré) | `{{GRADE_ITEM_ID}}` | `grade_item/@id` | `grades.xml` | ID de l'élément de note. |
| (Généré) | `{{CATEGORY_ID}}` | `grade_item/categoryid` | `grades.xml` | ID de la catégorie de note. |
| (Généré) | `{{COURSE_SHORTNAME}}`| `information/original_course_shortname` | `moodle_backup.xml` | Nom court du cours. |
| (Généré) | `{{BACKUP_DATE}}` | `information/backup_date` | `moodle_backup.xml` | Timestamp de la sauvegarde. |
| (Statique) | `{{ACTIVITY_INTRO_HTML}}` | `simplequiz/intro` | `simplequiz.xml` | Texte d'introduction statique pour le QCM. |
