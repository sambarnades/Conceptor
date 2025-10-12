# Documentation des Placeholders pour le Module Page

Ce document décrit le mapping entre les données JSON générées par l'interface utilisateur et les placeholders utilisés dans les fichiers XML du module Page pour Moodle.

| Clé JSON (depuis l'UI) | Placeholder XML | Nœud/Attribut XML Cible | Fichier(s) Concerné(s) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `{{ACTIVITY_TITLE}}` | `<name>` / `<fullname>` / `<shortname>` | `page.xml`, `module.xml`, `moodle_backup.xml`, `course.xml` | Le titre principal de l'activité Page. |
| `blocks` | `{{CONTENT}}` | `page/content` | `page.xml` | Le contenu HTML complet de la page, généré à partir des blocs JSON. |
| `intro` | `{{INTRO}}` | `page/intro` | `page.xml` | Texte d'introduction optionnel pour l'activité. |
| (Généré) | `{{ACTIVITY_ID}}` | `activity/@id`, `page/@id` | `moodle_backup.xml`, `page.xml` | ID unique de l'activité. |
| (Généré) | `{{MODULE_ID}}` | `activity/@moduleid`, `module/@id`, `activity/directory` | `moodle_backup.xml`, `module.xml` | ID unique du module. |
| (Généré) | `{{SECTION_ID}}` | `module/sectionid`, `section/directory` | `module.xml`, `moodle_backup.xml` | ID de la section du cours. |
| (Généré) | `{{TIMESTAMP}}` | `<timecreated>`, `<timemodified>`, `module/added` | `page.xml`, `module.xml` | Timestamp de la création/modification. |
| (Généré) | `{{COURSE_ID}}` | `page/course`, `course/@id`, `information/original_course_id` | `page.xml`, `course.xml`, `moodle_backup.xml` | ID unique du cours. |
| (Généré) | `{{COURSE_CONTEXTID}}` | `course/@contextid`, `information/original_course_contextid` | `course.xml`, `moodle_backup.xml` | ID de contexte du cours. |
| (Généré) | `{{ACTIVITY_CONTEXTID}}` | `activity/@contextid` | `moodle_backup.xml` | ID de contexte de l'activité. |
| (Généré) | `{{COURSE_FULLNAME}}`| `information/original_course_fullname` | `moodle_backup.xml` | Nom complet du cours. |
| (Généré) | `{{COURSE_SHORTNAME}}`| `information/original_course_shortname` | `moodle_backup.xml` | Nom court du cours. |
| (Généré) | `{{BACKUP_DATE}}` | `information/backup_date` | `moodle_backup.xml` | Timestamp de la sauvegarde. |
