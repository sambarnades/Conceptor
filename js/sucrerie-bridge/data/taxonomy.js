/**
 * Taxonomies de référence Sucrerie : disciplines + niveaux + langues + systèmes éducatifs.
 *
 * Slugs alignés sur les tables PostgreSQL `sucrerie.discipline` et
 * `sucrerie.level` (cf. docs/sucrerie-migrations/2026-05-06_*.sql).
 *
 * Ce module est volontairement agnostique de Caramel pour pouvoir être
 * réutilisé par Sucrerie et aManDe (vision « pont universel »).
 *
 * --- Modèle ---
 *
 * 3 axes indépendants :
 *   - Langue de l'activité       (LANGUAGES)        — la langue dans laquelle le contenu est rédigé
 *   - Système éducatif cible     (EDUCATION_SYSTEMS) — francais | international | formation
 *   - Discipline                 (DISCIPLINES_*) + Niveau (LEVEL_GROUPS_*) — dépendent du système
 *
 * La langue d'interface n'est pas modélisée ici : elle est gérée par
 * l'application hôte et sert uniquement de défaut à proposer.
 */

// ----- Systèmes éducatifs --------------------------------------------

export const EDUCATION_SYSTEMS = Object.freeze([
    { slug: 'francais',       labelKey: 'education_system_francais',       icon: 'fa-school' },
    { slug: 'universitaire',  labelKey: 'education_system_universitaire',  icon: 'fa-graduation-cap' },
    { slug: 'international',  labelKey: 'education_system_international',  icon: 'fa-globe' },
    { slug: 'formation',      labelKey: 'education_system_formation',     icon: 'fa-user-tie' }
]);

// ----- Disciplines : scolaire (FR + international) -------------------

export const DISCIPLINES_SCOLAIRE = Object.freeze([
    { slug: 'francais',                          pole: 'lettres-shs-arts', labelKey: 'discipline_francais' },
    { slug: 'philosophie',                       pole: 'lettres-shs-arts', labelKey: 'discipline_philosophie' },
    { slug: 'histoire-geographie',               pole: 'lettres-shs-arts', labelKey: 'discipline_histoire_geographie' },
    { slug: 'emc',                               pole: 'lettres-shs-arts', labelKey: 'discipline_emc' },
    { slug: 'ses',                               pole: 'lettres-shs-arts', labelKey: 'discipline_ses' },
    { slug: 'documentation',                     pole: 'lettres-shs-arts', labelKey: 'discipline_documentation' },
    { slug: 'arts-plastiques',                   pole: 'lettres-shs-arts', labelKey: 'discipline_arts_plastiques' },
    { slug: 'education-musicale',                pole: 'lettres-shs-arts', labelKey: 'discipline_education_musicale' },
    { slug: 'theatre',                           pole: 'lettres-shs-arts', labelKey: 'discipline_theatre' },
    { slug: 'histoire-des-arts',                 pole: 'lettres-shs-arts', labelKey: 'discipline_histoire_des_arts' },
    { slug: 'cinema-audiovisuel',                pole: 'lettres-shs-arts', labelKey: 'discipline_cinema_audiovisuel' },
    { slug: 'arts-appliques',                    pole: 'lettres-shs-arts', labelKey: 'discipline_arts_appliques' },
    { slug: 'mathematiques',                     pole: 'sciences-tech', labelKey: 'discipline_mathematiques' },
    { slug: 'physique-chimie',                   pole: 'sciences-tech', labelKey: 'discipline_physique_chimie' },
    { slug: 'svt',                               pole: 'sciences-tech', labelKey: 'discipline_svt' },
    { slug: 'biotechnologies',                   pole: 'sciences-tech', labelKey: 'discipline_biotechnologies' },
    { slug: 'technologie',                       pole: 'sciences-tech', labelKey: 'discipline_technologie' },
    { slug: 'sciences-ingenieur',                pole: 'sciences-tech', labelKey: 'discipline_sciences_ingenieur' },
    { slug: 'nsi',                               pole: 'sciences-tech', labelKey: 'discipline_nsi' },
    { slug: 'snt',                               pole: 'sciences-tech', labelKey: 'discipline_snt' },
    { slug: 'economie-gestion',                  pole: 'sciences-tech', labelKey: 'discipline_economie_gestion' },
    { slug: 'maths-sciences',                    pole: 'sciences-tech', labelKey: 'discipline_maths_sciences' },
    { slug: 'sms-sbssa',                         pole: 'sciences-tech', labelKey: 'discipline_sms_sbssa' },
    { slug: 'anglais',                           pole: 'langues-vivantes', labelKey: 'discipline_anglais' },
    { slug: 'espagnol',                          pole: 'langues-vivantes', labelKey: 'discipline_espagnol' },
    { slug: 'allemand',                          pole: 'langues-vivantes', labelKey: 'discipline_allemand' },
    { slug: 'italien',                           pole: 'langues-vivantes', labelKey: 'discipline_italien' },
    { slug: 'portugais',                         pole: 'langues-vivantes', labelKey: 'discipline_portugais' },
    { slug: 'arabe',                             pole: 'langues-vivantes', labelKey: 'discipline_arabe' },
    { slug: 'chinois',                           pole: 'langues-vivantes', labelKey: 'discipline_chinois' },
    { slug: 'russe',                             pole: 'langues-vivantes', labelKey: 'discipline_russe' },
    { slug: 'neerlandais',                       pole: 'langues-vivantes', labelKey: 'discipline_neerlandais' },
    { slug: 'norvegien',                         pole: 'langues-vivantes', labelKey: 'discipline_norvegien' },
    { slug: 'polonais',                          pole: 'langues-vivantes', labelKey: 'discipline_polonais' },
    { slug: 'suedois',                           pole: 'langues-vivantes', labelKey: 'discipline_suedois' },
    { slug: 'turc',                              pole: 'langues-vivantes', labelKey: 'discipline_turc' },
    { slug: 'langues-regionales',                pole: 'langues-vivantes', labelKey: 'discipline_langues_regionales' },
    { slug: 'lsf',                               pole: 'langues-vivantes', labelKey: 'discipline_lsf' },
    { slug: 'autres-langues',                    pole: 'langues-vivantes', labelKey: 'discipline_autres_langues' },
    { slug: 'latin',                             pole: 'antiquite', labelKey: 'discipline_latin' },
    { slug: 'grec-ancien',                       pole: 'antiquite', labelKey: 'discipline_grec_ancien' },
    { slug: 'eps',                               pole: 'eps', labelKey: 'discipline_eps' },
    { slug: 'commerce-vente',                    pole: 'enseignement-pro', labelKey: 'discipline_commerce_vente' },
    { slug: 'accueil',                           pole: 'enseignement-pro', labelKey: 'discipline_accueil' },
    { slug: 'hotellerie-restauration',           pole: 'enseignement-pro', labelKey: 'discipline_hotellerie_restauration' },
    { slug: 'alimentation',                      pole: 'enseignement-pro', labelKey: 'discipline_alimentation' },
    { slug: 'transport-logistique',              pole: 'enseignement-pro', labelKey: 'discipline_transport_logistique' },
    { slug: 'securite',                          pole: 'enseignement-pro', labelKey: 'discipline_securite' },
    { slug: 'assistance-gestion',                pole: 'enseignement-pro', labelKey: 'discipline_assistance_gestion' },
    { slug: 'sciences-techniques-industrielles', pole: 'enseignement-pro', labelKey: 'discipline_sciences_techniques_industrielles' },
    { slug: 'design-arts-appliques',             pole: 'enseignement-pro', labelKey: 'discipline_design_arts_appliques' },
    { slug: 'prepa-metiers',                     pole: 'enseignement-pro', labelKey: 'discipline_prepa_metiers' },
    { slug: 'pluridisciplinaire',                pole: null, labelKey: 'discipline_pluridisciplinaire' },
]);

// ----- Disciplines : formation continue ------------------------------

export const DISCIPLINES_FORMATION = Object.freeze([
    { slug: 'formation-numerique-pedagogique', labelKey: 'discipline_formation_numerique_pedagogique' },
    { slug: 'formation-didactique',            labelKey: 'discipline_formation_didactique' },
    { slug: 'formation-gestion',               labelKey: 'discipline_formation_gestion' },
    { slug: 'formation-accompagnement',        labelKey: 'discipline_formation_accompagnement' },
    { slug: 'formation-bureautique',           labelKey: 'discipline_formation_bureautique' },
    { slug: 'formation-langues',               labelKey: 'discipline_formation_langues' },
    { slug: 'formation-autre',                 labelKey: 'discipline_formation_autre' }
]);

// ----- Pôles disciplinaires (regroupement du menu Discipline en <optgroup>) ----
// Miroir de assets/js/core/referentials.js (POLES) de Sucrerie. Ordre = ordre
// d'affichage des groupes. Les disciplines sans pôle (pole:null) restent à plat.
export const POLES = Object.freeze([
    { slug: 'lettres-shs-arts',    labelKey: 'pole_lettres_shs_arts' },
    { slug: 'sciences-tech',       labelKey: 'pole_sciences_tech' },
    { slug: 'langues-vivantes',    labelKey: 'pole_langues_vivantes' },
    { slug: 'antiquite',           labelKey: 'pole_antiquite' },
    { slug: 'eps',                 labelKey: 'pole_eps' },
    { slug: 'enseignement-pro',    labelKey: 'pole_enseignement_pro' },
    { slug: 'formation',           labelKey: 'pole_formation' },
]);

/**
 * Regroupe une liste de disciplines (avec champ `pole`) par pôle, dans l'ordre
 * de POLES. Retourne { ungrouped, byPole } — ungrouped = pole null/inconnu (à
 * plat, en fin de menu). Miroir de getDisciplinesByPole côté Sucrerie.
 */
export function groupDisciplinesByPole(disciplines) {
    const ungrouped = [];
    const byPole = new Map();
    for (const p of POLES) byPole.set(p.slug, []);
    for (const d of disciplines) {
        if (d.pole && byPole.has(d.pole)) byPole.get(d.pole).push(d);
        else ungrouped.push(d);
    }
    for (const [slug, list] of byPole) if (!list.length) byPole.delete(slug);
    return { ungrouped, byPole };
}

/**
 * Renvoie la liste des disciplines applicables au système éducatif donné.
 * Pour `francais` ET `international` → mêmes disciplines scolaires (les
 * disciplines sont universelles, seuls les niveaux changent).
 */
export function getDisciplinesForSystem(system) {
    return system === 'formation' ? DISCIPLINES_FORMATION : DISCIPLINES_SCOLAIRE;
}

// ----- Niveaux : système français (cycles + lycée) -------------------
// Le post-bac français est désormais dans son propre segment "Universitaire"
// avec sa granularité propre (cf. LEVEL_GROUPS_UNIVERSITAIRE).

export const LEVEL_GROUPS_FR = Object.freeze([
    { titleKey: 'level_cycle_1',   levels: ['ps', 'ms', 'gs'] },
    { titleKey: 'level_cycle_2',   levels: ['cp', 'ce1', 'ce2'] },
    { titleKey: 'level_cycle_3',   levels: ['cm1', 'cm2', '6e'] },
    { titleKey: 'level_cycle_4',   levels: ['5e', '4e', '3e'] },
    { titleKey: 'level_lycee',     levels: ['2nde', '1ere', 'terminale'] }
]);

// ----- Niveaux : enseignement supérieur français (post-bac) ----------

export const LEVEL_GROUPS_UNIVERSITAIRE = Object.freeze([
    { titleKey: 'level_group_bts',     levels: ['bts1', 'bts2'] },
    { titleKey: 'level_group_but',     levels: ['but1', 'but2', 'but3'] },
    { titleKey: 'level_group_cpge',    levels: ['cpge1', 'cpge2'] },
    { titleKey: 'level_group_licence', levels: ['l1', 'l2', 'l3'] },
    { titleKey: 'level_group_master',  levels: ['m1', 'm2'] },
    { titleKey: 'level_group_doctorat',levels: ['doctorat'] },
    { titleKey: 'level_group_ecoles',  levels: ['ecole-ing', 'ecole-comm'] }
]);

// ----- Niveaux : formation (3 niveaux de difficulté) -----------------

export const LEVELS_FORMATION = Object.freeze([
    { slug: 'formation-debutant',      labelKey: 'level_formation_debutant' },
    { slug: 'formation-intermediaire', labelKey: 'level_formation_intermediaire' },
    { slug: 'formation-expert',        labelKey: 'level_formation_expert' }
]);

// ----- Langues d'activité --------------------------------------------
//
// Alignées sur les 12 langues de l'interface Caramel : fr, en, es, de, it,
// nl, pt, ar, zh, jp, el, br. Le label en langue native pour faciliter le
// repérage quel que soit le contexte hôte (Caramel / Sucrerie / aManDe).

export const LANGUAGES = Object.freeze([
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'pt', label: 'Português' },
    { code: 'ar', label: 'العربية' },
    { code: 'zh', label: '中文' },
    { code: 'jp', label: '日本語' },
    { code: 'el', label: 'Ελληνικά' },
    { code: 'br', label: 'Brezhoneg' }
]);

// ----- Licence imposée -----------------------------------------------
//
// Toutes les activités déposées sur Sucrerie/aManDe sont publiées sous la
// même licence — pas de choix offert à l'utilisateur. Le code est conservé
// pour traçabilité dans le payload, mais le frontend ne propose aucun
// sélecteur. Le défaut Postgres est aligné (cf. migration 2026-05-06).
//
// 2026-06-26 : passage de CC-BY-NC-SA-4.0 → CC-BY-SA-4.0. La clause NC
// empêchait l'intégration des contenus dans d'autres projets libres en
// CC-BY-SA (recommandation Forge). CC-BY-SA reste suffisante pour bloquer
// la réappropriation marchande (obligation de partage à l'identique).

export const FORCED_LICENSE = Object.freeze({
    code: 'CC-BY-SA-4.0',
    labelKey: 'license_cc_by_sa_label',   // ex: "CC BY-SA 4.0"
    descKey:  'license_cc_by_sa_desc'      // ex: "Attribution, partage à l'identique"
});
