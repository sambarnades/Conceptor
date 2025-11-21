/**
 * @file Gestion de l'internationalisation (i18n) de l'application.
 * Ce module gère le chargement des fichiers de langue, l'application des traductions
 * sur le DOM, et la logique du sélecteur de langue.
 */

import { AVAILABLE_MODELS } from './llm.js';
import { generateTiles, toggleActivityContent } from './ui.js';

/**
 * @property {Object} translations - Dictionnaire contenant les clés de traduction de la langue courante.
 */
export let translations = {};
/**
 * @property {string} currentLang - Code de la langue actuellement affichée (ex: 'fr').
 */
export let currentLang  = 'fr';

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
 * Essaie de récupérer l'objet de traductions exposé par le fichier JS.
 */
function resolveLoadedTranslations(lang) {
  const key = `translations_${lang}`;
  // 1) Cas "propre" : propriété sur window
  if (window[key] && typeof window[key] === 'object') return window[key];
  // 2) Certains packs n’exposent qu’un "translations" global sur window
  if (window.translations && typeof window.translations === 'object') return window.translations;

  // 3) Fallback : la variable peut exister en global (const/let/var) sans être sur window
  //    On la récupère par eval *minimal* (même comportement que ton implémentation initiale).
  try {
    // Ex: si le fichier a "const translations_fr = {...}"
    const candidate = eval(`(typeof ${key} !== 'undefined') ? ${key} : (typeof translations !== 'undefined' ? translations : null)`);
    if (candidate && typeof candidate === 'object') {
      // On "miroire" sur window pour les prochains chargements
      window[key] = candidate;
      return candidate;
    }
  } catch (_) { /* ignore */ }

  return null;
}

/**
 * Charge js/translations/<lang>.js en <script> et résout quand le script est EXÉCUTÉ.
 */
function loadTranslationScript(lang) {
  return new Promise((resolve, reject) => {
    const scriptId = 'translation-script';
    // Supprimer un éventuel précédent
    const prev = document.getElementById(scriptId);
    if (prev) prev.remove();

    const s = document.createElement('script');
    s.id = scriptId;
    // Cache-bust léger pour éviter des surprises de cache en changement rapide
    s.src = `js/translations/${lang}.js?v=${Date.now()}`;
    s.async = true;

    // Si la page utilise un nonce CSP, on le réplique (meilleure compat CSP)
    const firstNonceScript = document.querySelector('script[nonce]');
    if (firstNonceScript && firstNonceScript.nonce) {
      s.setAttribute('nonce', firstNonceScript.nonce);
    }

    s.onload = () => {
      const data = resolveLoadedTranslations(lang);
      if (data) {
        resolve(data);
      } else {
        reject(new Error(`Objet de traduction introuvable pour "${lang}".`));
      }
    };
    s.onerror = () => reject(new Error(`Échec du chargement de ${s.src}`));

    document.head.appendChild(s);
  });
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

    // Mettre à jour l'attribut lang du <html>
    document.documentElement.lang = lang;

    // Appliquer les traductions + mettre à jour l'UI du sélecteur
    translatePage();
    updateLanguageSelector();
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
