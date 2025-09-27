# Documentation des Placeholders pour le Module Appariement

Ce document décrit le mapping between les données JSON générées par l'interface utilisateur et les placeholders utilisés dans les fichiers XML du module Appariement pour Moodle.

| Clé JSON (depuis l'UI) | Placeholder XML | Nœud/Attribut XML Cible | Fichier(s) Concerné(s) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `{{ACTIVITY_TITLE}}` | `<name>` / `<itemname>` / `<original_course_fullname>` / `<title>` | `epikmatch.xml`, `grades.xml`, `moodle_backup.xml` | Le titre principal de l'activité d'appariement. |
| `pairs` | `{{ASSOCIATIONS_JSON}}` | `<associations>` | `epikmatch.xml` | La chaîne de caractères JSON contenant les paires question/réponse. |
| (Généré) | `{{ACTIVITY_ID}}` | `activity/@id`, `epikmatch/@id`, `grade_item/iteminstance` | `epikmatch.xml`, `grades.xml` | ID unique de l'activité. |
| (Généré) | `{{MODULE_ID}}` | `activity/@moduleid`, `module/@id`, `activity/directory`, `setting/activity` | `epikmatch.xml`, `module.xml`, `moodle_backup.xml` | ID unique du module. |
| (Généré) | `{{SECTION_ID}}` | `module/sectionid` | `module.xml` | ID de la section du cours. |
| (Généré) | `{{TIMESTAMP}}` | `<timecreated>`, `<timemodified>`, `module/added` | `epikmatch.xml`, `grades.xml`, `module.xml` | Timestamp de la création. |
| (Généré) | `{{COURSE_ID}}` | `epikmatch/course`, `information/original_course_id` | `epikmatch.xml`, `moodle_backup.xml` | ID unique du cours. |
| (Généré) | `{{COURSE_CONTEXTID}}` | `information/original_course_contextid` | `moodle_backup.xml` | ID de contexte du cours. |
| (Généré) | `{{ACTIVITY_CONTEXTID}}` | `activity/@contextid` | `epikmatch.xml` | ID de contexte de l'activité. |
| (Généré) | `{{GRADE_ITEM_ID}}` | `grade_item/@id` | `grades.xml` | ID de l'élément de note. |
| (Généré) | `{{CATEGORY_ID}}` | `grade_item/categoryid` | `grades.xml` | ID de la catégorie de note. |
| (Généré) | `{{COURSE_SHORTNAME}}`| `information/original_course_shortname` | `moodle_backup.xml` | Nom court du cours. |
| (Généré) | `{{BACKUP_DATE}}` | `information/backup_date` | `moodle_backup.xml` | Timestamp de la sauvegarde. |
| (Statique) | `{{ACTIVITY_INTRO_HTML}}` | `epikmatch/intro` | `epikmatch.xml` | Texte d'introduction statique pour l'appariement. |
