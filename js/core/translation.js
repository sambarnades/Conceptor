/**
 * @file Gestion de l'internationalisation (i18n) de l'application.
 * Ce module gère le chargement des fichiers de langue, l'application des traductions
 * sur le DOM, et la logique du sélecteur de langue.
 */

import { AVAILABLE_MODELS } from '../services/llm.js';
import { generateTiles, toggleActivityContent } from '../ui/ui.js';

/**
 * Traductions françaises par défaut pour les tuiles (affichage immédiat avant chargement complet)
 */
const defaultTranslations = {
    // Noms des modules H5P
    h5p_timeline_name: "Frise chronologique",
    h5p_flashcards_name: "Cartes mémoires",
    h5p_quiz_set_name: "Quiz mixte",
    h5p_quiz_set_qcm_name: "Quiz QCM",
    h5p_quiz_set_vf_name: "Quiz Vrai/Faux",
    h5p_glossary_name: "Glossaire",
    h5p_crossword_name: "Mots croisés",
    h5p_essay_name: "Rédaction",
    h5p_summary_name: "Résumé",
    h5p_drag_the_words_name: "Glisser les mots",
    h5p_drag_and_drop_name: "Glisser-déposer",
    h5p_fill_in_the_blanks_name: "Texte à trous",
    h5p_mark_the_words_name: "Surligner les mots",
    h5p_true_false_name: "Vrai/Faux",
    h5p_multiple_choice_name: "Choix multiples",
    h5p_find_the_words_name: "Mots mêlés",
    h5p_sort_the_paragraphs_name: "Ordonner les paragraphes",
    h5p_single_choice_set_name: "Série de choix uniques",
    h5p_dialog_cards_name: "Cartes de dialogue",
    h5p_complex_fill_the_blanks_name: "Texte à trous complexe",
    h5p_chart_name: "Diagramme",
    h5p_course_presentation_name: "Présentation de cours",
    // Noms des modules Moodle/Éléa
    elea_test_xml_name: "Test",
    elea_test_gift_name: "Format GIFT",
    elea_millionnaire_name: "Millionnaire",
    elea_appariement_name: "Appariement",
    elea_qcm_name: "QCM",
    elea_glossaire_xml_name: "Glossaire",
    elea_page_name: "Page",
    elea_devoir_name: "Devoir",
    // Sous-titres des modules Moodle/Éléa
    elea_test_xml_subtitle: "(Banque de questions)",
    elea_millionnaire_subtitle: "(Activité pour Éléa)",
    elea_appariement_subtitle: "(Activité pour Éléa)",
    elea_qcm_subtitle: "(Activité pour Éléa)",
    elea_glossaire_xml_subtitle: "(Articles en XML)",
    elea_page_subtitle: "(Page de cours)",
    elea_devoir_subtitle: "(Grille d'évaluation)",
    // Onglets
    tab_all: "Tout",
    tab_quiz: "Quiz & Tests",
    tab_text: "Manipulation de texte",
    tab_memory: "Mémorisation & Découverte",
    tab_elea: "Éléa",
    tab_h5p: "H5P"
};

/**
 * @property {Object} translations - Dictionnaire contenant les clés de traduction de la langue courante.
 * Initialisé avec les traductions françaises par défaut pour un affichage immédiat des tuiles.
 */
export let translations = { ...defaultTranslations };
/**
 * @property {string} currentLang - Code de la langue actuellement affichée (ex: 'fr').
 */
export let currentLang  = 'fr';

/**
 * Fonction utilitaire pour obtenir une traduction.
 * Retourne la clé elle-même si la traduction n'existe pas.
 * @param {string} key - Clé de traduction
 * @returns {string} - La traduction ou la clé
 */
export function t(key) {
    if (!key) return '';
    return translations[key] !== undefined ? translations[key] : key;
}

const languageSwitcher = document.querySelector('.language-switcher');
const languageDropdown = document.querySelector('.language-dropdown');
const languageBtn      = document.querySelector('.language-btn');

let _langToken   = 0;           // Anti-course : ne garde que la dernière demande

const languageConfig = {
  'fr': { name: 'Français',  code: 'fr' },
  'de': { name: 'Deutsch',   code: 'de' },
  'en': { name: 'English',   code: 'gb' },
  'ar': { name: 'عربي',      code: 'sa' },
  'zh': { name: '中文',       code: 'cn' },
  'es': { name: 'Español',   code: 'es' },
  'el': { name: 'ελληνικά',  code: 'gr' },
  'it': { name: 'Italiano',  code: 'it' },
  'jp': { name: '日本語',     code: 'jp' },
  'nl': { name: 'Nederlands',code: 'nl' },
  'pt': { name: 'Português', code: 'pt' }
};

function getFeaturedLLMModels(count = 3) {
  return AVAILABLE_MODELS
    .filter(model => model.featured)
    .sort((a, b) => {
      const ao = (typeof a.order === 'number') ? a.order : Number.POSITIVE_INFINITY;
      const bo = (typeof b.order === 'number') ? b.order : Number.POSITIVE_INFINITY;
      return ao - bo;
    })
    .slice(0, count);
}

function formatLLMModelLabel(model, unit) {
  if (!model) return '';
  const label = model.displayName || model.id || '';
  if (!label) return '';
  const value = model.param ? ` (${model.param}${unit ? ` ${unit}` : ''})` : '';
  return `${label}${value}`;
}

function hydrateLegalLLMLine() {
  const legalText = translations.legal_ai_models_content;
  if (typeof legalText !== 'string') return;

  const unit = translations.llm_model_parameters_unit || '';
  const featured = getFeaturedLLMModels(3);

  const replacements = { llm_model_parameters_unit: unit };
  featured.forEach((model, index) => {
    const idx = index + 1;
    replacements[`llm_model_${idx}_name`] = model?.displayName || model?.id || '';
    replacements[`llm_model_${idx}_param`] = model?.param || '';
    replacements[`llm_model_${idx}`] = formatLLMModelLabel(model, unit);
  });

  translations.legal_ai_models_content = Object.entries(replacements).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    legalText
  );
}



/**
 * Récupère le numéro de version depuis le footer (ex: "5.0.0")
 * Utilisé pour le cache-busting des fichiers de traduction
 */
function getVersionFromFooter() {
    const footerLink = document.querySelector('footer.footer a[href*="CHANGELOG"]');
    const versionText = footerLink?.textContent?.trim();
    if (!versionText) return null;
    const match = versionText.match(/v?(\d+(?:\.\d+)*)/i);
    return match ? match[1] : null;
}

/**
 * Charge un fichier de traduction JSON via fetch().
 * Les fichiers de traduction sont des fichiers JSON standard.
 * @param {string} lang - Code de la langue (ex: 'fr', 'en')
 * @returns {Promise<Object>} - L'objet de traductions
 */
async function loadTranslationScript(lang) {
    const version = getVersionFromFooter();
    const versionQuery = version ? `?v=${version}` : '';
    const response = await fetch(`./js/locales/${lang}.json${versionQuery}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Orchestrateur : charge la langue puis applique la traduction à la page.
 */
/**
 * Charge le fichier de traduction pour une langue donnée, met à jour l'état global
 * et applique les traductions à la page.
 * @param {string} lang - Le code de la langue à charger (ex: 'en').
 */
export async function loadTranslations(lang) {
  const myToken = ++_langToken;
  try {
    const data = await loadTranslationScript(lang);
    if (myToken !== _langToken) return; // une autre langue a été demandée entre-temps

    // On ne modifie plus la variable globale, on la réassigne
    translations = Object.assign(translations, data);
    currentLang = lang;
    hydrateLegalLLMLine();

    // Mettre à jour l'attribut lang et la direction du texte
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    // Appliquer les traductions + mettre à jour l'UI du sélecteur
    translatePage();
    updateLanguageSelector();
    window.dispatchEvent(new CustomEvent('caramel:language-changed', { detail: { lang } }));
  } catch (err) {
    console.error(`Erreur lors du chargement des traductions "${lang}" :`, err);
  }
}

/**
 * Met à jour l'affichage du sélecteur (drapeau principal + item actif).
 */
function updateLanguageSelector() {
  const mainFlagIcon = document.querySelector('.language-btn .fi');
  if (mainFlagIcon && languageConfig[currentLang]) {
    mainFlagIcon.className = `fi fi-${languageConfig[currentLang].code}`;
  }

  document.querySelectorAll('.language-dropdown a').forEach(link => {
    const lang = link.getAttribute('data-lang');
    if (lang === currentLang) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Applique les traductions aux éléments annotés.
 * (ne change pas le nom de la fonction)
 */
/**
 * Parcourt un conteneur DOM et remplace le contenu des éléments ayant des attributs
 * `data-key`, `data-translate`, ou `data-tooltip-key` par la traduction correspondante.
 * @param {HTMLElement} [container=document] - L'élément DOM à l'intérieur duquel appliquer les traductions.
 */
export function translatePage(container = document) {
  container.querySelectorAll('[data-key], [data-translate], [data-tooltip-key], [data-key-placeholder], [data-placeholder-key]').forEach(element => {
    const key = element.getAttribute('data-key') || element.getAttribute('data-translate');
    const tooltipKey = element.getAttribute('data-tooltip-key');
    const placeholderKey = element.getAttribute('data-key-placeholder');
    const dataPlaceholderKey = element.getAttribute('data-placeholder-key');

    if (key) {
        const t = translations[key];
        if (typeof t !== 'undefined') {
            if ('placeholder' in element && !placeholderKey) { // Gère le cas où data-key est utilisé pour le placeholder
                element.placeholder = String(t);
            } else {
                const textNode = Array.from(element.childNodes).find(
                    node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                );
                if (textNode) {
                    textNode.textContent = String(t);
                } else if (element.tagName !== 'I') { // ne pas écraser les icônes
                    element.innerHTML = String(t);
                }
            }
        }
    }

    if (placeholderKey) {
        const t = translations[placeholderKey];
        if (typeof t !== 'undefined' && 'placeholder' in element) {
            element.placeholder = String(t);
        }
    }

    if (dataPlaceholderKey) {
        const t = translations[dataPlaceholderKey];
        if (typeof t !== 'undefined') {
            element.setAttribute('data-placeholder', String(t));
        }
    }

    if (tooltipKey) {
        const tt = translations[tooltipKey];
        if (typeof tt !== 'undefined') {
            element.setAttribute('data-tooltip', String(tt));
        }
    }
  });
}

/**
 * Initialise les écouteurs d'événements pour le sélecteur de langue (bouton et menu déroulant).
 */
export function initLanguageSwitcher() {
    if (languageBtn) {
        languageBtn.addEventListener('click', (e) => {
            if (languageSwitcher) {
                languageSwitcher.classList.toggle('open');
            }
            e.stopPropagation();
        });
    }

    if (languageDropdown) {
        languageDropdown.addEventListener('click', async (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            e.preventDefault();
            const lang = link.getAttribute('data-lang');
            if (!lang || lang === currentLang) {
                languageSwitcher?.classList.remove('open');
                return;
            }

            await loadTranslations(lang);
            languageSwitcher?.classList.remove('open');

            generateTiles();

            if (window.activeTile) {
                const moduleKey = window.activeTile.dataset?.module;
                if (moduleKey) {
                    toggleActivityContent(moduleKey, window.activeTile);
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (languageSwitcher &&
            !languageSwitcher.contains(e.target) &&
            !(languageBtn && languageBtn.contains(e.target))) {
            languageSwitcher.classList.remove('open');
        }
    });
}
