/**
 * Construction du panneau Sucrerie surimprimé sur la zone preview de la modale.
 *
 * Le panneau est inséré dans `.preview-modal__content` comme sibling de
 * `.preview-modal__preview`. La visibilité respective est gérée par la classe
 * CSS `preview-modal--sucrerie` posée sur la modale (cf. styles.css).
 *
 * Cinq étapes sont construites une seule fois et alternées via `showStep()` :
 *   email      — accueil + saisie email
 *   loading    — spinner pendant l'appel /sucrerie-enrich
 *   rejected   — verdict modération "rejete"
 *   preview    — formulaire complet de suggestions IA éditables
 *   success    — confirmation + lien catalogue
 *
 * --- Système éducatif (segmented control) ---
 *
 * 3 segments : `francais` / `international` / `formation`.
 * Selon le segment :
 *   - le `<select>` de discipline n'expose que les options de l'audience
 *     correspondante (scolaire pour francais+international, formation pour
 *     formation) ;
 *   - la zone niveaux affiche soit les chips cycles FR, soit un input libre
 *     ("Year 7", "5° primaria"…), soit 3 chips difficulté + un input public
 *     cible (formation) ;
 *   - le bouton segmenté est pré-sélectionné par l'IA en passe 1 quand
 *     l'enrichissement renvoie `systeme_educatif`.
 *
 * --- Licence ---
 *
 * Pas de sélecteur : la licence CC BY-SA 4.0 est imposée par Caramel/Sucrerie.
 * Le code reste envoyé en dur dans le payload (FORCED_LICENSE.code).
 */

import { escapeHtml as escape } from '../../core/escape.js';
import { t, getCurrentLang } from '../i18n/index.js';
import {
    DISCIPLINES_SCOLAIRE,
    DISCIPLINES_FORMATION,
    LEVEL_GROUPS_FR,
    LEVEL_GROUPS_UNIVERSITAIRE,
    LEVELS_FORMATION,
    LANGUAGES,
    EDUCATION_SYSTEMS,
    FORCED_LICENSE,
    getDisciplinesForSystem,
    POLES,
    groupDisciplinesByPole
} from '../data/taxonomy.js';
import { enhanceBridgeSelect } from './combobox.js';

const PANEL_DATA_ATTR = 'data-sucrerie-bridge-panel';

/**
 * @param {Object}      ctx
 * @param {HTMLElement} ctx.modal
 * @param {Object}      ctx.translations
 * @returns {Object} contrôleur du panneau
 */
export function createPanel({ modal, translations }) {
    // `_translations` est mutable pour permettre `refreshTranslations()` à la
    // volée. Tous les helpers locaux passent par `tr(k)` qui lit ce binding,
    // pas par une closure figée sur la valeur initiale.
    let _translations = translations || {};
    const tr = (k) => t(k, _translations);

    // États qu'on ne peut pas reconstruire à partir du DOM seul (textes
    // calculés depuis des données : moderation/email/reason/loading…). Ils
    // sont mémorisés pour pouvoir être re-rendus à chaque switch de langue.
    let _lastSuccessState = null;       // { status, moderation, publicId, viewUrl, email }
    let _lastRecheckState = { state: 'idle', reason: '' };
    let _isPublishLoading = false;

    const root = document.createElement('div');
    root.className = 'sucrerie-bridge__panel';
    root.setAttribute(PANEL_DATA_ATTR, '');

    root.appendChild(buildEmailStep(tr));
    root.appendChild(buildLoadingStep(tr));
    root.appendChild(buildRejectedStep(tr));
    root.appendChild(buildPreviewStep(tr));
    root.appendChild(buildSuccessStep(tr));

    const content = modal.querySelector('.preview-modal__content');
    if (!content) throw new Error('preview-modal__content introuvable');

    content.querySelectorAll(`[${PANEL_DATA_ATTR}]`).forEach(el => el.remove());
    content.appendChild(root);

    // ---- helpers internes ----
    const $  = (sel) => root.querySelector(sel);
    const $$ = (sel) => root.querySelectorAll(sel);

    // Bind du segmented control "système éducatif" (effet : refilter discipline + zone niveaux)
    bindEducationSystemSegmented(root, tr);
    // Bind du toggle "Autre…" / retour à la liste pour la discipline
    bindDisciplineToggle(root);
    // Combobox cherchable (recherche + pôles) sur discipline + langue
    mountComboboxes(root, tr);
    // Widget tag-editor (chips + input). Expose getTags/setTags via root.querySelector.
    const _tagEditor = setupTagEditor(root.querySelector('[data-tag-editor]'), tr);

    return {
        root,
        showStep(name) {
            $$('.sucrerie-bridge__step').forEach(s => {
                s.hidden = (s.dataset.stepId !== name);
            });
        },
        getCurrentStep() {
            const visible = Array.from($$('.sucrerie-bridge__step')).find(s => !s.hidden);
            return visible ? visible.dataset.stepId : null;
        },
        setRejectedReason(reason) {
            const el = $('[data-rejected-reason]');
            if (el) el.textContent = reason || tr('sucrerie_bridge_rejected_default_reason');
        },
        setEmailError(message) {
            const err = $('[data-email-error]');
            if (!err) return;
            err.textContent = message || '';
            // Toujours en layout (jamais display:none) : la zone réserve une hauteur
            // fixe (CSS) → afficher/masquer un message ne décale plus rien à l'écran.
            err.hidden = false;
        },
        /**
         * Variante HTML pour les messages d'erreur enrichis (ex. domaine email
         * non reconnu → lien "Demander l'ajout du domaine X" vers la forge).
         * L'appelant est responsable de l'escape du HTML qu'il fournit.
         */
        setEmailErrorHtml(html) {
            const err = $('[data-email-error]');
            if (!err) return;
            err.innerHTML = html || '';
            err.hidden = false; // cf. setEmailError : zone à hauteur réservée
        },
        getEmailValue() {
            return $('input[name="email"]')?.value.trim() || '';
        },
        setEmailValue(v) {
            const input = $('input[name="email"]');
            if (input) input.value = v || '';
        },
        focusEmail() {
            $('input[name="email"]')?.focus();
        },
        onEmailInput(handler) {
            $('input[name="email"]')?.addEventListener('input', handler);
            $('input[name="email"]')?.addEventListener('blur', handler);
        },
        setName(field, value) {
            const input = $(`input[name="${field}"]`);
            if (input) input.value = value || '';
        },
        getName(field) {
            return $(`input[name="${field}"]`)?.value.trim() || '';
        },
        onNameChange(handler) {
            ['firstname', 'lastname'].forEach(f => {
                $(`input[name="${f}"]`)?.addEventListener('input', handler);
                $(`input[name="${f}"]`)?.addEventListener('blur', handler);
            });
        },
        // ----- Signature publique « Nom d'auteur·rice » -----
        getAuthorDisplay() {
            return $('input[name="author_display"]')?.value.trim() || '';
        },
        setAuthorDisplay(value) {
            const input = $('input[name="author_display"]');
            if (input) input.value = value || '';
        },
        onAuthorDisplayInput(handler) {
            $('input[name="author_display"]')?.addEventListener('input', handler);
        },
        setAuthorDisplayCounter(text) {
            const c = $('[data-author-display-counter]');
            if (c) c.textContent = text || '';
        },
        /**
         * Compte existant (lookup workflow D) → masque prénom/nom (déjà confirmés
         * une fois) et les rend non requis ; seule la signature reste demandée.
         * Compte nouveau → tout visible et requis.
         */
        setAuthorNamesHidden(hidden) {
            const wrap = $('[data-author-names]');
            if (wrap) wrap.hidden = !!hidden;
            ['firstname', 'lastname'].forEach(f => {
                const input = $(`input[name="${f}"]`);
                if (input) input.required = !hidden;
            });
        },
        setLegalAccept(checked) {
            const cb = $('input[name="legal_accept"]');
            if (cb) cb.checked = !!checked;
        },
        onLegalChange(handler) {
            $('input[name="legal_accept"]')?.addEventListener('change', handler);
        },
        setPublishEnabled(enabled) {
            const btn = $('[data-action="publish"]');
            if (btn) btn.disabled = !enabled;
        },
        /**
         * Pose le système éducatif. `auto` à true → branchement IA (n'écrase pas
         * un choix utilisateur déjà posé), false → forçage explicite.
         */
        setEducationSystem(slug, { auto = false } = {}) {
            const valid = EDUCATION_SYSTEMS.some(s => s.slug === slug);
            if (!valid) return;
            const radios = $$('input[name="education_system"]');
            if (auto && Array.from(radios).some(r => r.checked && r.dataset.userChoice === '1')) {
                return; // déjà choisi par l'utilisateur, on respecte
            }
            radios.forEach(r => { r.checked = (r.value === slug); });
            applyEducationSystem(root, tr, slug);
        },
        getEducationSystem() {
            return $('input[name="education_system"]:checked')?.value || 'francais';
        },
        setEducationLevelCustom(value) {
            const inp = $('input[name="education_level_custom"]');
            if (inp) inp.value = value || '';
        },
        onPreviewFieldChange(handler) {
            // Pour la re-vérif live : titre, description, objectifs, tags
            ['title','description','objectives','tags'].forEach(name => {
                $$(`[name="${name}"]`).forEach(el => {
                    el.addEventListener('input', handler);
                });
            });
        },
        setRecheckState(state /* 'idle' | 'pending' | 'ok' | 'blocked' */, reason = '') {
            _lastRecheckState = { state, reason };
            const badge = $('[data-recheck-badge]');
            if (!badge) return;
            badge.dataset.state = state;
            const labelKey = {
                pending: 'sucrerie_bridge_recheck_pending',
                ok:      'sucrerie_bridge_recheck_ok',
                blocked: 'sucrerie_bridge_recheck_blocked'
            }[state];
            if (state === 'idle' || !labelKey) {
                badge.hidden = true;
                badge.textContent = '';
            } else {
                badge.hidden = false;
                const icon = state === 'pending' ? '<i class="fas fa-spinner fa-spin"></i>'
                           : state === 'ok'      ? '<i class="fas fa-check-circle"></i>'
                           : '<i class="fas fa-circle-exclamation"></i>';
                badge.innerHTML = `${icon} <span>${escape(tr(labelKey))}</span>`;
                if (state === 'blocked' && reason) {
                    badge.title = reason;
                }
            }
        },
        fillSuggestions(enrichment) {
            const e = enrichment || {};
            setVal($, 'title',       e.titre || '');
            setVal($, 'description', e.description || '');
            setVal($, 'objectives',  e.objectifs || '');
            const tagsSeed = Array.isArray(e.tags)
                ? e.tags
                : (typeof e.tags === 'string' ? e.tags.split(',') : []);
            _tagEditor.setTags(tagsSeed);

            // Système éducatif : appliqué en premier pour que le filtre discipline
            // et la zone niveaux soient à jour avant qu'on les remplisse.
            const sys = ['francais','universitaire','international','formation'].includes(e.systeme_educatif)
                ? e.systeme_educatif
                : 'francais';
            const sysRadios = $$('input[name="education_system"]');
            sysRadios.forEach(r => { r.checked = (r.value === sys); });
            applyEducationSystem(root, tr, sys);

            // Discipline : si l'IA propose un slug connu (selon l'audience) → select ;
            // sinon → "Autre…" + custom
            const allDisc = sys === 'formation' ? DISCIPLINES_FORMATION : DISCIPLINES_SCOLAIRE;
            const known = allDisc.some(d => d.slug === e.discipline_slug);
            const discSelect = $('select[name="discipline"]');
            const discOtherInput = $('input[name="discipline_other"]');
            const discOtherWrap = $('.sucrerie-bridge__discipline-other');
            if (discSelect) {
                if (known) {
                    discSelect.value = e.discipline_slug || '';
                    setDisciplinePickerHidden(discSelect, false);
                    if (discOtherWrap) discOtherWrap.hidden = true;
                } else if (e.discipline_slug) {
                    discSelect.value = 'autre';
                    setDisciplinePickerHidden(discSelect, true);
                    if (discOtherWrap) discOtherWrap.hidden = false;
                    if (discOtherInput) discOtherInput.value = e.discipline_slug;
                } else {
                    discSelect.value = '';
                }
                discSelect._combobox?.sync();
            }

            const langSelect = $('select[name="language"]');
            if (langSelect) { langSelect.value = e.langue || 'fr'; langSelect._combobox?.sync(); }

            // Niveaux : selon le système, on remplit la bonne zone
            if (sys === 'francais') {
                const levels = Array.isArray(e.niveaux) ? e.niveaux : [];
                $$('input[name="level_fr"]').forEach(cb => {
                    cb.checked = levels.includes(cb.value);
                });
            } else if (sys === 'universitaire') {
                const levels = Array.isArray(e.niveaux) ? e.niveaux : [];
                $$('input[name="level_univ"]').forEach(cb => {
                    cb.checked = levels.includes(cb.value);
                });
            } else if (sys === 'formation') {
                const levels = Array.isArray(e.niveaux) ? e.niveaux : [];
                $$('input[name="level_formation"]').forEach(cb => {
                    cb.checked = levels.includes(cb.value);
                });
                const audInp = $('input[name="formation_audience"]');
                if (audInp) audInp.value = e.public_cible || '';
            } else if (sys === 'international') {
                const inp = $('input[name="education_level_custom"]');
                if (inp) inp.value = e.niveau_libre || '';
            }
        },
        readForm() {
            const tags = _tagEditor.getTags();

            const sys = $('input[name="education_system"]:checked')?.value || 'francais';
            const levels = [];
            let educationLevelCustom = '';

            if (sys === 'francais') {
                $$('input[name="level_fr"]:checked').forEach(cb => levels.push(cb.value));
            } else if (sys === 'universitaire') {
                $$('input[name="level_univ"]:checked').forEach(cb => levels.push(cb.value));
            } else if (sys === 'formation') {
                $$('input[name="level_formation"]:checked').forEach(cb => levels.push(cb.value));
                educationLevelCustom = $('input[name="formation_audience"]')?.value.trim() || '';
            } else if (sys === 'international') {
                educationLevelCustom = $('input[name="education_level_custom"]')?.value.trim() || '';
            }

            const discipline = $('select[name="discipline"]')?.value || '';
            const disciplineSuggestion = discipline === 'autre'
                ? ($('input[name="discipline_other"]')?.value.trim() || '')
                : '';

            return {
                title:                   $('input[name="title"]')?.value.trim() || '',
                description:             $('textarea[name="description"]')?.value.trim() || '',
                objectifs:               $('textarea[name="objectives"]')?.value.trim() || '',
                tags,
                discipline:              discipline === 'autre' ? '' : discipline,
                discipline_suggestion:   disciplineSuggestion,
                levels,
                education_system:        sys,
                education_level_custom:  educationLevelCustom,
                language:                $('select[name="language"]')?.value || 'fr',
                ui_language:             getCurrentLang(),   // langue de l'interface (pour l'e-mail)
                license:                 FORCED_LICENSE.code,
                firstname:               $('input[name="firstname"]')?.value.trim() || '',
                lastname:                $('input[name="lastname"]')?.value.trim() || '',
                author_display:          $('input[name="author_display"]')?.value.trim() || '',
                legal_accept:            !!$('input[name="legal_accept"]')?.checked
            };
        },
        on(name, handler) {
            $$(`[data-action="${name}"]`).forEach(btn => btn.addEventListener('click', handler));
        },
        setPublishLoading(loading) {
            _isPublishLoading = !!loading;
            const btn = $('[data-action="publish"]');
            if (!btn) return;
            if (loading) {
                btn.dataset.originalHtml = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ${escape(tr('sucrerie_bridge_btn_publishing'))}`;
            } else if (btn.dataset.originalHtml) {
                btn.innerHTML = btn.dataset.originalHtml;
                delete btn.dataset.originalHtml;
            }
        },
        showPublishError(html) {
            const box = $('[data-publish-error]');
            if (!box) return;
            if (!html) {
                box.innerHTML = '';
                box.hidden = true;
            } else {
                box.innerHTML = html;
                box.hidden = false;
            }
        },
        setSuccessState({ status, moderation, publicId, viewUrl, email }) {
            _lastSuccessState = { status, moderation, publicId, viewUrl, email };
            renderSuccessState(_lastSuccessState);
        },
        /**
         * Ré-applique toutes les chaînes traduites au DOM en place, sans
         * détruire les inputs ni les listeners. Appelé par le MutationObserver
         * sur `<html lang>` (cf. index.js). Préserve :
         *   - les valeurs saisies dans les inputs/selects/textarea ;
         *   - l'état du segmented control + des zones niveaux ;
         *   - l'état du badge recheck, du bouton publier (loading ou idle),
         *     de l'écran succès si déjà affiché.
         */
        refreshTranslations(newTranslations) {
            _translations = newTranslations || {};

            // 1) Tous les nœuds annotés data-i18n-key
            root.querySelectorAll('[data-i18n-key]').forEach(el => {
                const key  = el.dataset.i18nKey;
                const attr = el.dataset.i18nAttr;   // "placeholder", "aria-label title", …
                const html = el.dataset.i18nHtml === '1';
                if (!key) return;
                const value = tr(key);
                if (attr) {
                    attr.split(/\s+/).filter(Boolean).forEach(a => el.setAttribute(a, value));
                } else if (html) {
                    el.innerHTML = value;
                } else {
                    el.textContent = value;
                }
            });

            // 2) Régions dynamiques dépendantes du système éducatif courant
            //    (discipline select reconstruit, légende niveaux, label discipline)
            const sys = $('input[name="education_system"]:checked')?.value || 'francais';
            applyEducationSystem(root, tr, sys);
            // Combobox langue : resync (placeholder de recherche dans la nouvelle langue)
            $('select[name="language"]')?._combobox?.sync();

            // 3) Badge recheck (icône + libellé selon state)
            if (_lastRecheckState && _lastRecheckState.state !== 'idle') {
                const badge = $('[data-recheck-badge]');
                if (badge) {
                    const labelKey = {
                        pending: 'sucrerie_bridge_recheck_pending',
                        ok:      'sucrerie_bridge_recheck_ok',
                        blocked: 'sucrerie_bridge_recheck_blocked'
                    }[_lastRecheckState.state];
                    if (labelKey) {
                        const icon = _lastRecheckState.state === 'pending' ? '<i class="fas fa-spinner fa-spin"></i>'
                                   : _lastRecheckState.state === 'ok'      ? '<i class="fas fa-check-circle"></i>'
                                   : '<i class="fas fa-circle-exclamation"></i>';
                        badge.innerHTML = `${icon} <span>${escape(tr(labelKey))}</span>`;
                    }
                }
            }

            // 4) Bouton "Publier" si en cours de publication → ré-écrit le label
            if (_isPublishLoading) {
                const btn = $('[data-action="publish"]');
                if (btn) {
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ${escape(tr('sucrerie_bridge_btn_publishing'))}`;
                }
            }

            // 5) Écran succès s'il a déjà été rempli
            if (_lastSuccessState) renderSuccessState(_lastSuccessState);

            // 6) Tag-editor : ré-applique aria-label "Supprimer le tag {tag}"
            //    sur chaque croix (le template est traduit, le tag est dynamique)
            _tagEditor.refresh();
        },
        destroy() {
            root.remove();
        }
    };

    function renderSuccessState({ status, moderation, viewUrl, email }) {
        // 3 branches (CDC §9.3) :
        //   - pending_confirmation : double opt-in, rien n'est public → lien masqué,
        //     et la ligne « lien de gestion » est remplacée par le message de confirmation.
        //   - published + approuve : publié, lien catalogue visible.
        //   - published + doute/en_attente : en modération humaine.
        const isPendingConfirm = status === 'pending_confirmation';
        const isApproved = !isPendingConfirm && moderation === 'approuve';
        const titleEl = $('[data-success-title]');
        const msgEl = $('[data-success-message]');
        const emailEl = $('[data-success-email-line]');
        const linkEl = $('[data-success-link]');
        const wrapEl = $('.sucrerie-bridge__success');
        const iconEl = $('.sucrerie-bridge__success-icon');

        // Icône : en attente de confirmation, rien n'est publié → on remplace la
        // coche verte (ambiguë : « c'est en ligne ») par une enveloppe ambre
        // « action requise », cohérente avec les états « à confirmer ».
        if (wrapEl) wrapEl.classList.toggle('sucrerie-bridge__success--pending', isPendingConfirm);
        if (iconEl) {
            iconEl.classList.toggle('fa-circle-check', !isPendingConfirm);
            iconEl.classList.toggle('fa-envelope-circle-check', isPendingConfirm);
        }

        if (titleEl) {
            titleEl.textContent = isPendingConfirm
                ? tr('sucrerie_bridge_success_title_pending_confirmation')
                : isApproved
                    ? tr('sucrerie_bridge_success_title_approved')
                    : tr('sucrerie_bridge_success_title_pending');
        }
        if (msgEl) {
            if (isPendingConfirm) {
                // Message multilingue avec {email} → l'adresse est mise en gras
                // (segment language-agnostique). Construit en DOM : l'e-mail,
                // donnée utilisateur, n'est jamais interprété comme du HTML.
                renderMessageWithEmail(
                    msgEl,
                    tr('sucrerie_bridge_success_message_pending_confirmation'),
                    email || ''
                );
            } else {
                msgEl.textContent = isApproved
                    ? tr('sucrerie_bridge_success_message_approved')
                    : tr('sucrerie_bridge_success_message_pending');
            }
        }
        if (emailEl) {
            // En attente de confirmation, le message porte déjà le lien + {email} :
            // on masque la ligne « lien de gestion » (envoyé plus tard, à la confirmation).
            if (isPendingConfirm) {
                emailEl.textContent = '';
                emailEl.hidden = true;
            } else {
                emailEl.textContent = tr('sucrerie_bridge_success_email_sent').replace('{email}', email || '');
                emailEl.hidden = false;
            }
        }
        if (linkEl) {
            if (isApproved && viewUrl) {
                linkEl.href = viewUrl;
                linkEl.hidden = false;
            } else {
                linkEl.removeAttribute('href');
                linkEl.hidden = true;
            }
        }
    }
}

// =====================================================================
//   Helpers : <select> discipline (optgroups par pôle) + comboboxes
// =====================================================================

/**
 * Construit les <option>/<optgroup> internes du <select> discipline : les pôles
 * en <optgroup> (ordre POLES), puis les disciplines hors pôle à plat. N'inclut ni
 * le placeholder ni l'option « Autre… » (ajoutés par l'appelant). L'audience
 * formation (sans champ pole) se retrouve entièrement à plat.
 */
function buildDisciplineOptionsInner(disciplines, tr) {
    const { ungrouped, byPole } = groupDisciplinesByPole(disciplines);
    let html = '';
    for (const [poleSlug, list] of byPole) {
        const pole = POLES.find(p => p.slug === poleSlug);
        const label = pole ? tr(pole.labelKey) : poleSlug;
        html += `<optgroup label="${escape(label)}">`
            + list.map(d => `<option value="${escape(d.slug)}">${escape(tr(d.labelKey))}</option>`).join('')
            + `</optgroup>`;
    }
    html += ungrouped.map(d => `<option value="${escape(d.slug)}">${escape(tr(d.labelKey))}</option>`).join('');
    return html;
}

/**
 * Monte (une fois) le combobox cherchable sur les <select> discipline et langue
 * (même UX que le filtre Explorer Sucrerie : recherche + pôles en optgroups).
 * L'instance est mémorisée sur l'élément (`select._combobox`) pour resync après
 * reconstruction des options / changement de langue. Idempotent.
 */
function mountComboboxes(root, tr) {
    const disc = root.querySelector('select[name="discipline"]');
    if (disc && !disc.dataset.comboboxEnhanced) {
        disc._combobox = enhanceBridgeSelect(disc, {
            tr,
            searchPlaceholderKey: 'sucrerie_bridge_combobox_search',
            noResultKey: 'sucrerie_bridge_combobox_no_result'
        });
        disc._combobox?.wrapper.classList.add('sucrerie-bridge__combobox--field');
    }
    const lang = root.querySelector('select[name="language"]');
    if (lang && !lang.dataset.comboboxEnhanced) {
        lang._combobox = enhanceBridgeSelect(lang, { tr });
        lang._combobox?.wrapper.classList.add('sucrerie-bridge__combobox--field');
    }
}

/**
 * Masque/affiche le sélecteur de discipline lors de la bascule « Autre… ». Agit
 * sur le wrapper du combobox si monté, sinon directement sur le <select>.
 */
function setDisciplinePickerHidden(select, hidden) {
    const target = select?._combobox?.wrapper || select;
    if (target) target.style.display = hidden ? 'none' : '';
}

// =====================================================================
//   Helpers : segmented control "système éducatif"
// =====================================================================

/**
 * Applique un choix de système éducatif :
 *   - filtre les options du <select> discipline selon l'audience
 *   - bascule la bonne zone de niveaux (fr / international / formation)
 *   - met à jour le titre du fieldset niveaux
 */
function applyEducationSystem(root, tr, system) {
    // 1) Filtre des options de discipline
    const discSelect = root.querySelector('select[name="discipline"]');
    if (discSelect) {
        const wanted = system === 'formation' ? DISCIPLINES_FORMATION : DISCIPLINES_SCOLAIRE;
        const previous = discSelect.value;
        // Vide puis reconstruit (pôles en <optgroup> pour le scolaire ; formation à plat)
        discSelect.innerHTML =
            `<option value="">${escape(tr('sucrerie_bridge_field_discipline_choose'))}</option>` +
            buildDisciplineOptionsInner(wanted, tr) +
            `<option value="autre">${escape(tr('sucrerie_bridge_field_discipline_other'))}</option>`;
        // Tente de restaurer si compatible avec la nouvelle audience
        // (`autre` est toujours présent → on le préserve aussi pour ne pas
        // orpheliner la saisie de l'input `discipline_other`).
        if (previous === 'autre' || wanted.some(d => d.slug === previous)) {
            discSelect.value = previous;
        } else {
            discSelect.value = '';
        }
        discSelect._combobox?.sync();
    }

    // 2) Bascule des zones de niveaux
    root.querySelector('[data-levels-fr]')?.toggleAttribute('hidden',            system !== 'francais');
    root.querySelector('[data-levels-univ]')?.toggleAttribute('hidden',          system !== 'universitaire');
    root.querySelector('[data-levels-international]')?.toggleAttribute('hidden', system !== 'international');
    root.querySelector('[data-levels-formation]')?.toggleAttribute('hidden',     system !== 'formation');

    // 3) Titre du fieldset niveaux
    const legend = root.querySelector('[data-levels-legend]');
    if (legend) {
        const labelKey = {
            francais:      'sucrerie_bridge_field_levels',
            universitaire: 'sucrerie_bridge_field_levels_universitaire',
            international: 'sucrerie_bridge_field_levels_international',
            formation:     'sucrerie_bridge_field_levels_formation'
        }[system];
        legend.textContent = tr(labelKey);
    }

    // 4) Label "Discipline" / "Formation" + placeholder "Autre…"
    const discLabel = root.querySelector('[data-discipline-label]');
    if (discLabel) {
        discLabel.textContent = tr(system === 'formation'
            ? 'sucrerie_bridge_field_formation'
            : 'sucrerie_bridge_field_discipline');
    }
    const otherInput = root.querySelector('input[name="discipline_other"]');
    if (otherInput) {
        otherInput.placeholder = tr(system === 'formation'
            ? 'sucrerie_bridge_field_formation_other_placeholder'
            : 'sucrerie_bridge_field_discipline_other_placeholder');
    }
}

function bindEducationSystemSegmented(root, tr) {
    root.querySelectorAll('input[name="education_system"]').forEach(radio => {
        radio.addEventListener('change', () => {
            radio.dataset.userChoice = '1';   // marque comme choix utilisateur
            if (radio.checked) applyEducationSystem(root, tr, radio.value);
        });
    });
}

function bindDisciplineToggle(root) {
    const select = root.querySelector('select[name="discipline"]');
    const otherWrap = root.querySelector('.sucrerie-bridge__discipline-other');
    if (!select || !otherWrap) return;
    // Le `<select>` est reconstruit à chaque changement d'audience, on délègue
    // donc l'écoute sur un parent stable.
    const slot = root.querySelector('.sucrerie-bridge__discipline-slot');
    slot?.addEventListener('change', (ev) => {
        if (ev.target?.name !== 'discipline') return;
        if (ev.target.value === 'autre') {
            setDisciplinePickerHidden(ev.target, true);
            otherWrap.hidden = false;
            otherWrap.querySelector('input')?.focus();
        }
    });
    const backBtn = root.querySelector('[data-action="discipline-back"]');
    backBtn?.addEventListener('click', () => {
        const sel = root.querySelector('select[name="discipline"]');
        otherWrap.hidden = true;
        if (sel) {
            sel.value = '';
            setDisciplinePickerHidden(sel, false);
            sel._combobox?.sync();
            (sel._combobox?.wrapper.querySelector('.sucrerie-bridge__combobox-trigger') || sel).focus();
        }
    });
}

// =====================================================================
//   Construction des étapes
// =====================================================================

function buildEmailStep(tr) {
    const step = stepWrapper('email');
    step.innerHTML = `
        <div class="sucrerie-bridge__step-body sucrerie-bridge__welcome">
            <div class="sucrerie-bridge__welcome-icon" aria-hidden="true">
                <img class="sucrerie-bridge__welcome-logo" src="${new URL('../boutique.svg', import.meta.url).href}" alt="" aria-hidden="true">
            </div>
            <h3 class="sucrerie-bridge__welcome-title" data-i18n-key="sucrerie_bridge_welcome_title">${escape(tr('sucrerie_bridge_welcome_title'))}</h3>
            <p class="sucrerie-bridge__welcome-subtitle" data-i18n-key="sucrerie_bridge_welcome_subtitle">${escape(tr('sucrerie_bridge_welcome_subtitle'))}</p>

            <a class="sucrerie-bridge__catalog-link"
               href="https://sucrerie.forge.apps.education.fr/"
               target="_blank" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                <span data-i18n-key="sucrerie_bridge_visit_catalog">${escape(tr('sucrerie_bridge_visit_catalog'))}</span>
            </a>

            <label class="sucrerie-bridge__field">
                <span data-i18n-key="sucrerie_bridge_email_label">${escape(tr('sucrerie_bridge_email_label'))}</span>
                <input type="email" name="email" autocomplete="email" required
                       data-i18n-key="sucrerie_bridge_email_placeholder" data-i18n-attr="placeholder"
                       placeholder="${escape(tr('sucrerie_bridge_email_placeholder'))}">
                <small class="sucrerie-bridge__hint" data-i18n-key="sucrerie_bridge_email_hint">${escape(tr('sucrerie_bridge_email_hint'))}</small>
                <small class="sucrerie-bridge__error sucrerie-bridge__email-feedback" data-email-error></small>
            </label>
        </div>
        <div class="sucrerie-bridge__step-actions">
            <button type="button" class="sucrerie-bridge__btn-ghost" data-action="cancel" data-i18n-key="sucrerie_bridge_btn_cancel">
                ${escape(tr('sucrerie_bridge_btn_cancel'))}
            </button>
            <button type="button" class="sucrerie-bridge__btn-primary" data-action="continue">
                <i class="fas fa-search" aria-hidden="true"></i>
                <span data-i18n-key="sucrerie_bridge_btn_continue">${escape(tr('sucrerie_bridge_btn_continue'))}</span>
            </button>
        </div>
    `;
    return step;
}

function buildLoadingStep(tr) {
    const step = stepWrapper('loading');
    step.hidden = true;
    step.innerHTML = `
        <div class="sucrerie-bridge__loading">
            <div class="sucrerie-bridge__spinner" aria-hidden="true"></div>
            <p class="sucrerie-bridge__loading-title" data-i18n-key="sucrerie_bridge_loading_title">${escape(tr('sucrerie_bridge_loading_title'))}</p>
            <small data-i18n-key="sucrerie_bridge_loading_subtitle">${escape(tr('sucrerie_bridge_loading_subtitle'))}</small>
        </div>
    `;
    return step;
}

function buildRejectedStep(tr) {
    const step = stepWrapper('rejected');
    step.hidden = true;
    step.innerHTML = `
        <div class="sucrerie-bridge__rejected">
            <i class="fas fa-circle-xmark" aria-hidden="true"></i>
            <h3 data-i18n-key="sucrerie_bridge_rejected_title">${escape(tr('sucrerie_bridge_rejected_title'))}</h3>
            <p data-rejected-reason></p>
        </div>
        <div class="sucrerie-bridge__step-actions">
            <button type="button" class="sucrerie-bridge__btn-ghost" data-action="cancel" data-i18n-key="sucrerie_bridge_btn_cancel">
                ${escape(tr('sucrerie_bridge_btn_cancel'))}
            </button>
            <button type="button" class="sucrerie-bridge__btn-primary" data-action="retry" data-i18n-key="sucrerie_bridge_btn_retry">
                ${escape(tr('sucrerie_bridge_btn_retry'))}
            </button>
        </div>
    `;
    return step;
}

function buildPreviewStep(tr) {
    const step = stepWrapper('preview');
    step.hidden = true;

    // ----- Segmented control "système éducatif" -----
    const segments = EDUCATION_SYSTEMS.map((s, i) => `
        <label class="sucrerie-bridge__seg">
            <input type="radio" name="education_system" value="${escape(s.slug)}"${i === 0 ? ' checked' : ''}>
            <span><i class="fas ${escape(s.icon)}" aria-hidden="true"></i> <span data-i18n-key="${escape(s.labelKey)}">${escape(tr(s.labelKey))}</span></span>
        </label>
    `).join('');

    // ----- Discipline initiale (système=francais → DISCIPLINES_SCOLAIRE, par pôle) -----
    const disciplineOptions = buildDisciplineOptionsInner(DISCIPLINES_SCOLAIRE, tr);

    // ----- Niveaux FR (chips groupées par cycle) -----
    const levelGroupsFr = LEVEL_GROUPS_FR.map(g => {
        const checkboxes = g.levels.map(slug => `
            <label class="sucrerie-bridge__level">
                <input type="checkbox" name="level_fr" value="${escape(slug)}">
                <span data-i18n-key="${escape('level_' + slug)}">${escape(tr('level_' + slug))}</span>
            </label>
        `).join('');
        return `
            <div class="sucrerie-bridge__level-group">
                <strong data-i18n-key="${escape(g.titleKey)}">${escape(tr(g.titleKey))}</strong>
                ${checkboxes}
            </div>
        `;
    }).join('');

    // ----- Niveaux universitaires (BTS, BUT, CPGE, L1-3, M1-2, Doctorat, Écoles) -----
    const levelGroupsUniv = LEVEL_GROUPS_UNIVERSITAIRE.map(g => {
        const checkboxes = g.levels.map(slug => `
            <label class="sucrerie-bridge__level">
                <input type="checkbox" name="level_univ" value="${escape(slug)}">
                <span data-i18n-key="${escape('level_' + slug)}">${escape(tr('level_' + slug))}</span>
            </label>
        `).join('');
        return `
            <div class="sucrerie-bridge__level-group">
                <strong data-i18n-key="${escape(g.titleKey)}">${escape(tr(g.titleKey))}</strong>
                ${checkboxes}
            </div>
        `;
    }).join('');

    // ----- Niveaux formation (3 chips difficulté) -----
    const levelChipsFormation = LEVELS_FORMATION.map(l => `
        <label class="sucrerie-bridge__level">
            <input type="checkbox" name="level_formation" value="${escape(l.slug)}">
            <span data-i18n-key="${escape(l.labelKey)}">${escape(tr(l.labelKey))}</span>
        </label>
    `).join('');

    const languageOptions = LANGUAGES.map(l =>
        `<option value="${escape(l.code)}"${l.code === 'fr' ? ' selected' : ''}>${escape(l.label)}</option>`
    ).join('');

    step.innerHTML = `
        <div class="sucrerie-bridge__step-body sucrerie-bridge__step-body--scroll">
            <div class="sucrerie-bridge__step-header">
                <h3 class="sucrerie-bridge__step-title">
                    <i class="fas fa-magic" aria-hidden="true"></i>
                    <span data-i18n-key="sucrerie_bridge_preview_title">${escape(tr('sucrerie_bridge_preview_title'))}</span>
                </h3>
                <span class="sucrerie-bridge__recheck-badge" data-recheck-badge hidden></span>
            </div>

            <div class="sucrerie-bridge__form-row">
                <label class="sucrerie-bridge__field" style="flex:2;">
                    <span data-i18n-key="sucrerie_bridge_field_title">${escape(tr('sucrerie_bridge_field_title'))}</span>
                    <input type="text" name="title" maxlength="300">
                </label>
                <div class="sucrerie-bridge__field" style="flex:1;">
                    <span data-i18n-key="sucrerie_bridge_field_language">${escape(tr('sucrerie_bridge_field_language'))}</span>
                    <select name="language">${languageOptions}</select>
                </div>
            </div>

            <div class="sucrerie-bridge__form-row">
                <label class="sucrerie-bridge__field" style="flex:1;">
                    <span data-i18n-key="sucrerie_bridge_field_description">${escape(tr('sucrerie_bridge_field_description'))}</span>
                    <textarea name="description" rows="2" maxlength="1000"
                              data-i18n-key="sucrerie_bridge_field_description_placeholder" data-i18n-attr="placeholder"
                              placeholder="${escape(tr('sucrerie_bridge_field_description_placeholder'))}"></textarea>
                </label>
                <label class="sucrerie-bridge__field" style="flex:1;">
                    <span data-i18n-key="sucrerie_bridge_field_objectives">${escape(tr('sucrerie_bridge_field_objectives'))}</span>
                    <textarea name="objectives" rows="2" maxlength="500"
                              data-i18n-key="sucrerie_bridge_field_objectives_placeholder" data-i18n-attr="placeholder"
                              placeholder="${escape(tr('sucrerie_bridge_field_objectives_placeholder'))}"></textarea>
                </label>
            </div>

            <div class="sucrerie-bridge__field">
                <span data-i18n-key="sucrerie_bridge_field_tags">${escape(tr('sucrerie_bridge_field_tags'))}</span>
                <div class="sucrerie-bridge__tag-editor" data-tag-editor tabindex="-1">
                    <input type="text" class="sucrerie-bridge__tag-editor__input"
                           data-tag-editor-input
                           autocomplete="off" autocapitalize="off" spellcheck="false"
                           data-i18n-key="sucrerie_bridge_field_tags_placeholder" data-i18n-attr="placeholder"
                           placeholder="${escape(tr('sucrerie_bridge_field_tags_placeholder'))}">
                    <input type="hidden" name="tags" value="">
                </div>
            </div>

            <fieldset class="sucrerie-bridge__field sucrerie-bridge__seg-field">
                <legend data-i18n-key="sucrerie_bridge_field_education_system">${escape(tr('sucrerie_bridge_field_education_system'))}</legend>
                <div class="sucrerie-bridge__seg-group">${segments}</div>
            </fieldset>

            <div class="sucrerie-bridge__form-row">
                <div class="sucrerie-bridge__field" style="flex:1;">
                    <span data-discipline-label>${escape(tr('sucrerie_bridge_field_discipline'))}</span>
                    <div class="sucrerie-bridge__discipline-slot">
                        <select name="discipline">
                            <option value="">${escape(tr('sucrerie_bridge_field_discipline_choose'))}</option>
                            ${disciplineOptions}
                            <option value="autre">${escape(tr('sucrerie_bridge_field_discipline_other'))}</option>
                        </select>
                        <div class="sucrerie-bridge__discipline-other" hidden>
                            <input type="text" name="discipline_other" maxlength="100"
                                   placeholder="${escape(tr('sucrerie_bridge_field_discipline_other_placeholder'))}">
                            <button type="button" class="sucrerie-bridge__discipline-back-btn"
                                    data-action="discipline-back"
                                    data-i18n-key="sucrerie_bridge_field_discipline_back_aria" data-i18n-attr="aria-label title"
                                    aria-label="${escape(tr('sucrerie_bridge_field_discipline_back_aria'))}"
                                    title="${escape(tr('sucrerie_bridge_field_discipline_back_aria'))}">
                                <i class="fas fa-list" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <fieldset class="sucrerie-bridge__field sucrerie-bridge__levels">
                <legend data-levels-legend>${escape(tr('sucrerie_bridge_field_levels'))}</legend>

                <div data-levels-fr>${levelGroupsFr}</div>

                <div data-levels-univ hidden>${levelGroupsUniv}</div>

                <div data-levels-international hidden>
                    <input type="text" name="education_level_custom" maxlength="200"
                           data-i18n-key="sucrerie_bridge_field_levels_international_placeholder" data-i18n-attr="placeholder"
                           placeholder="${escape(tr('sucrerie_bridge_field_levels_international_placeholder'))}">
                </div>

                <div data-levels-formation hidden class="sucrerie-bridge__formation-block">
                    <div class="sucrerie-bridge__level-group">${levelChipsFormation}</div>
                    <label class="sucrerie-bridge__field" style="margin-top:8px;">
                        <span data-i18n-key="sucrerie_bridge_field_audience_formation">${escape(tr('sucrerie_bridge_field_audience_formation'))}</span>
                        <input type="text" name="formation_audience" maxlength="200"
                               data-i18n-key="sucrerie_bridge_field_audience_formation_placeholder" data-i18n-attr="placeholder"
                               placeholder="${escape(tr('sucrerie_bridge_field_audience_formation_placeholder'))}">
                    </label>
                </div>
            </fieldset>

            <div class="sucrerie-bridge__legal">
                <!-- Prénom/nom : demandés UNIQUEMENT à la création du compte (1ᵉʳ dépôt).
                     Masqués + non requis pour un compte existant (cf. lookup workflow D,
                     deposit-flow.js > applyAccountExistsToForm). -->
                <div class="sucrerie-bridge__author-names" data-author-names>
                    <div class="sucrerie-bridge__form-row">
                        <label class="sucrerie-bridge__field" style="flex:1;">
                            <span data-i18n-key="sucrerie_bridge_field_firstname">${escape(tr('sucrerie_bridge_field_firstname'))}</span>
                            <input type="text" name="firstname" maxlength="100" required>
                        </label>
                        <label class="sucrerie-bridge__field" style="flex:1;">
                            <span data-i18n-key="sucrerie_bridge_field_lastname">${escape(tr('sucrerie_bridge_field_lastname'))}</span>
                            <input type="text" name="lastname" maxlength="100" required>
                        </label>
                    </div>
                    <p class="sucrerie-bridge__hint" data-i18n-key="sucrerie_bridge_author_warning">${escape(tr('sucrerie_bridge_author_warning'))}</p>
                </div>

                <!-- Nom public : TOUJOURS demandé, par activité, affiché seul dans
                     le catalogue (jamais prénom/nom). Peut être un nom, un pseudo
                     ou un nom de groupe ; modifiable après coup. -->
                <label class="sucrerie-bridge__field sucrerie-bridge__field--counter">
                    <span data-i18n-key="sucrerie_bridge_field_author_display">${escape(tr('sucrerie_bridge_field_author_display'))}</span>
                    <input type="text" name="author_display" maxlength="30"
                           data-i18n-key="sucrerie_bridge_author_display_placeholder" data-i18n-attr="placeholder"
                           placeholder="${escape(tr('sucrerie_bridge_author_display_placeholder'))}">
                    <span class="sucrerie-bridge__field-counter" data-author-display-counter aria-hidden="true"></span>
                </label>
                <p class="sucrerie-bridge__hint" data-i18n-key="sucrerie_bridge_author_display_hint">${escape(tr('sucrerie_bridge_author_display_hint'))}</p>

                <label class="sucrerie-bridge__legal-label">
                    <input type="checkbox" name="legal_accept">
                    <span data-i18n-key="sucrerie_bridge_legal_text" data-i18n-html="1">${tr('sucrerie_bridge_legal_text')}</span>
                </label>
            </div>

            <div class="sucrerie-bridge__publish-error" data-publish-error hidden></div>
        </div>
        <div class="sucrerie-bridge__step-actions">
            <button type="button" class="sucrerie-bridge__btn-ghost" data-action="cancel" data-i18n-key="sucrerie_bridge_btn_back">
                ${escape(tr('sucrerie_bridge_btn_back'))}
            </button>
            <button type="button" class="sucrerie-bridge__btn-primary" data-action="publish" disabled>
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
                <span data-i18n-key="sucrerie_bridge_btn_publish">${escape(tr('sucrerie_bridge_btn_publish'))}</span>
            </button>
        </div>
    `;

    return step;
}

function buildSuccessStep(tr) {
    const step = stepWrapper('success');
    step.hidden = true;
    step.innerHTML = `
        <div class="sucrerie-bridge__success">
            <i class="fas fa-circle-check sucrerie-bridge__success-icon" aria-hidden="true"></i>
            <h3 data-success-title></h3>
            <p data-success-message></p>
            <p class="sucrerie-bridge__success-email" data-success-email-line></p>
            <a class="sucrerie-bridge__success-link" data-success-link target="_blank" rel="noopener noreferrer" hidden>
                <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                <span data-i18n-key="sucrerie_bridge_success_view_link">${escape(tr('sucrerie_bridge_success_view_link'))}</span>
            </a>
        </div>
        <div class="sucrerie-bridge__step-actions">
            <button type="button" class="sucrerie-bridge__btn-primary" data-action="back-to-preview">
                <i class="fas fa-arrow-left" aria-hidden="true"></i>
                <span data-i18n-key="sucrerie_bridge_btn_back_to_preview">${escape(tr('sucrerie_bridge_btn_back_to_preview'))}</span>
            </button>
        </div>
    `;
    return step;
}

function stepWrapper(id) {
    const div = document.createElement('div');
    div.className = 'sucrerie-bridge__step';
    div.dataset.stepId = id;
    return div;
}

function setVal($, name, value) {
    const el = $(`[name="${name}"]`);
    if (el) el.value = value;
}

// Doublon retiré : sémantique strictement identique au canonique.
// (`escape` masquait en plus la globale du même nom.)

/**
 * Rend un message contenant le jeton `{email}` dans un élément, l'adresse étant
 * mise en gras (`<strong class="sucrerie-bridge__success-email-strong">`). Le
 * reste du texte est posé en nœuds texte → l'e-mail (donnée utilisateur) n'est
 * jamais interprété comme du HTML. Language-agnostique : marche pour les 12
 * locales tant que le jeton `{email}` est présent.
 */
function renderMessageWithEmail(el, template, email) {
    el.replaceChildren();
    const parts = String(template == null ? '' : template).split('{email}');
    parts.forEach((part, i) => {
        if (part) el.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
            const strong = document.createElement('strong');
            strong.className = 'sucrerie-bridge__success-email-strong';
            strong.textContent = email;
            el.appendChild(strong);
        }
    });
}

// =====================================================================
//   Widget tag-editor : chips avec ajout (Entrée / , / Tab) + suppression
// =====================================================================

/**
 * Transforme le conteneur `[data-tag-editor]` en mini-éditeur de tags.
 *
 * - L'état interne (tableau `tags`) est la source de vérité.
 * - Un input hidden `[name="tags"]` (déjà présent dans le markup) reflète
 *   `tags.join(',')` et émet un événement `input` à chaque mutation, pour
 *   rester compatible avec `onPreviewFieldChange` (re-vérif live).
 * - Ajout : taper du texte puis Entrée, virgule ou Tab. Au blur du champ,
 *   ce qui reste est aussi committé. Coller "a, b, c" → 3 chips d'un coup.
 * - Suppression : croix × sur le chip, ou Backspace sur input vide pour
 *   cibler le dernier chip (1er coup : focus, 2e coup : suppression).
 * - Garde-fous : trim, dédoublonnage (case-insensitive), limite par tag,
 *   limite globale.
 *
 * @param {HTMLElement} container — élément `[data-tag-editor]`
 * @param {(key: string) => string} tr — fonction de traduction
 * @returns {{ getTags: () => string[], setTags: (arr: string[]) => void, refresh: () => void }}
 */
function setupTagEditor(container, tr) {
    const MAX_TAG_LENGTH = 40;
    const MAX_TAGS = 20;

    if (!container) {
        return { getTags: () => [], setTags: () => {}, refresh: () => {} };
    }

    const input  = container.querySelector('[data-tag-editor-input]');
    const hidden = container.querySelector('input[name="tags"]');
    let tags = [];

    function syncHidden() {
        hidden.value = tags.join(',');
        // Notifie les listeners de `input[name="tags"]` (re-vérif live)
        hidden.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function renderChips() {
        // On supprime les chips existants (tout sauf input + hidden)
        Array.from(container.querySelectorAll('[data-tag-chip]')).forEach(el => el.remove());
        const removeLabelTpl = tr('sucrerie_bridge_field_tags_remove_aria') || 'Supprimer le tag {tag}';
        // Insère les chips avant l'input (qui doit rester en dernière position visible)
        tags.forEach((tag, idx) => {
            const chip = document.createElement('span');
            chip.className = 'sucrerie-bridge__tag-chip';
            chip.dataset.tagChip = '';
            chip.dataset.tagIndex = String(idx);
            chip.innerHTML = `
                <span class="sucrerie-bridge__tag-chip__label"></span>
                <button type="button" class="sucrerie-bridge__tag-chip__remove" tabindex="-1" aria-label="">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            `;
            chip.querySelector('.sucrerie-bridge__tag-chip__label').textContent = tag;
            const btn = chip.querySelector('.sucrerie-bridge__tag-chip__remove');
            btn.setAttribute('aria-label', removeLabelTpl.replace('{tag}', tag));
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                removeAt(idx);
                input.focus();
            });
            // Double-clic sur le chip → édition inline du tag à la même position
            chip.addEventListener('dblclick', (ev) => {
                // Si on a double-cliqué sur la croix, on ne déclenche pas l'édition
                if (ev.target.closest('.sucrerie-bridge__tag-chip__remove')) return;
                ev.preventDefault();
                startEdit(idx);
            });
            container.insertBefore(chip, input);
        });
    }

    /**
     * Passe le chip n°`idx` en mode édition : remplace le label par un input
     * pré-rempli avec la valeur, focus + sélection. Enter / blur committent
     * (vide → suppression du tag, doublon d'un AUTRE tag → annulation),
     * Escape annule sans modifier. Préserve la position du tag dans la liste.
     */
    function startEdit(idx) {
        const chip = container.querySelector(`[data-tag-chip][data-tag-index="${idx}"]`);
        if (!chip) return;
        const currentValue = tags[idx];
        const label = chip.querySelector('.sucrerie-bridge__tag-chip__label');
        if (!label) return;

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'sucrerie-bridge__tag-chip__edit';
        editInput.value = currentValue;
        editInput.maxLength = MAX_TAG_LENGTH;
        chip.classList.add('is-editing');
        // Auto-dimensionne le champ à la largeur du texte (évite un input fixe
        // trop large/étroit dans la bulle).
        const autosize = () => {
            editInput.size = Math.max(2, editInput.value.length + 1);
        };
        autosize();
        editInput.addEventListener('input', autosize);
        label.replaceWith(editInput);
        editInput.focus();
        editInput.select();

        let settled = false;
        const commitEdit = () => {
            if (settled) return;
            settled = true;
            const newVal = normalize(editInput.value);
            if (!newVal) {
                // Vide → suppression du tag
                removeAt(idx);
                return;
            }
            // Doublon avec un AUTRE tag → annule (re-render sans modif)
            const lc = newVal.toLowerCase();
            if (tags.some((t, i) => i !== idx && t.toLowerCase() === lc)) {
                renderChips();
                return;
            }
            // OK : remplace en place
            if (newVal !== tags[idx]) {
                tags[idx] = newVal;
                commit();
            } else {
                renderChips();
            }
        };
        const cancelEdit = () => {
            if (settled) return;
            settled = true;
            renderChips();
        };
        editInput.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                commitEdit();
                input.focus();
            } else if (ev.key === 'Escape') {
                ev.preventDefault();
                cancelEdit();
                input.focus();
            }
        });
        editInput.addEventListener('blur', commitEdit);
    }

    function commit() {
        renderChips();
        syncHidden();
    }

    function normalize(raw) {
        return String(raw == null ? '' : raw).trim().slice(0, MAX_TAG_LENGTH);
    }

    function addOne(raw) {
        const v = normalize(raw);
        if (!v) return false;
        if (tags.length >= MAX_TAGS) return false;
        const lc = v.toLowerCase();
        if (tags.some(t => t.toLowerCase() === lc)) return false;
        tags.push(v);
        return true;
    }

    function addMany(rawList) {
        let changed = false;
        rawList.forEach(r => { if (addOne(r)) changed = true; });
        if (changed) commit();
        return changed;
    }

    function removeAt(index) {
        if (index < 0 || index >= tags.length) return;
        tags.splice(index, 1);
        commit();
    }

    // --- saisie ---
    input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ',' || (ev.key === 'Tab' && input.value.trim())) {
            ev.preventDefault();
            addMany([input.value]);
            input.value = '';
        } else if (ev.key === 'Backspace' && input.value === '' && tags.length) {
            // Backspace sur champ vide → retire le dernier tag direct
            ev.preventDefault();
            removeAt(tags.length - 1);
        }
    });

    // Coller "a, b ; c" → multi-ajout. Si pas de séparateur, comportement normal (texte dans l'input).
    input.addEventListener('paste', (ev) => {
        const data = (ev.clipboardData || window.clipboardData)?.getData('text') || '';
        if (!/[,;\n\t]/.test(data)) return;
        ev.preventDefault();
        addMany(data.split(/[,;\n\t]/));
        input.value = '';
    });

    // Au blur, on commit ce qui reste — évite que l'utilisateur perde un tag
    // qu'il a tapé sans valider explicitement.
    input.addEventListener('blur', () => {
        if (input.value.trim()) {
            addMany([input.value]);
            input.value = '';
        }
    });

    // Cliquer dans la zone vide focus l'input (ergonomie : tout le conteneur est cliquable)
    container.addEventListener('click', (ev) => {
        if (ev.target === container) input.focus();
    });

    return {
        getTags() {
            // Inclut un éventuel tag tapé mais pas encore validé
            const pending = normalize(input.value);
            if (!pending) return tags.slice();
            const lc = pending.toLowerCase();
            if (tags.some(t => t.toLowerCase() === lc)) return tags.slice();
            return tags.concat([pending]);
        },
        setTags(arr) {
            tags = [];
            (Array.isArray(arr) ? arr : []).forEach(r => addOne(r));
            input.value = '';
            commit();
        },
        refresh() {
            // Re-render des chips pour rafraîchir l'aria-label "Supprimer le tag X"
            renderChips();
        }
    };
}
