/**
 * Orchestration du flow de dépôt Sucrerie depuis Caramel.
 *
 * États : closed → email → loading → (rejected | preview) → publish → success
 *                                                     │
 *                                                     └─ erreur passe 2 → reste sur preview
 *
 * Stocke ses références sur `modal._sucrerieBridgeFlow` pour permettre
 * une réentrance propre lors de la navigation prev/next entre notifications.
 */

import { escapeHtml } from '../../core/escape.js';
import { SUCRERIE_BRIDGE } from '../config.js';
import { t, getCurrentLang } from '../i18n/index.js';
import { createPanel } from './panel.js';
import { showConfirmDialog } from './confirm-dialog.js';
import { openAccessRequestDialog, ensureAccessRequestStyles } from './access-request-dialog.js';
import { extractMarkdownFromBlob } from '../services/extract.js';
import { fetchEnrich } from '../services/enrich.js';
import { fetchProfileLookup } from '../services/profile.js';
import { fetchPublish } from '../services/publish.js';
import { fetchRecheck, buildRecheckMarkdown } from '../services/recheck.js';
import { testProfanity, preloadProfanityList } from '../services/profanity-filter.js';
import {
    ensureAllowedDomainsLoaded,
    areAllowedDomainsLoaded,
    isEmailAllowed
} from '../services/allowed-domains.js';
import { blobToBase64 } from '../utils/blob-base64.js';
import { FORCED_LICENSE } from '../data/taxonomy.js';
import { safeSession } from '../../core/utils.js';

// Délai (ms) avant de relancer la modération après la dernière frappe
// utilisateur dans un champ texte du formulaire d'édition.
const RECHECK_DEBOUNCE_MS = 1500;

const MODAL_ACTIVE_CLASS = 'preview-modal--sucrerie';

const SS = (key) => `${SUCRERIE_BRIDGE.storagePrefix}${key}`;

/**
 * Purge les données personnelles mémorisées (email, prénom, nom).
 * Appelée à l'abandon explicite du flux de dépôt (RGPD : pas de rétention
 * d'identité au-delà du flux ; le pré-remplissage ne vaut que pendant celui-ci).
 */
function purgeStoredIdentity() {
    ['email', 'firstname', 'lastname'].forEach((k) => safeSession.remove(SS(k)));
}

/**
 * Démarre le flow Sucrerie sur la modale courante.
 * No-op si le kill switch est désactivé.
 */
export function runSucrerieFlow({ modal, notification, translations, userIntent }) {
    if (!SUCRERIE_BRIDGE.enabled) return;
    if (!modal || !notification) return;
    const intent = userIntent || {};

    if (modal._sucrerieBridgeFlow) {
        modal._sucrerieBridgeFlow.exit();
    }

    const panel = createPanel({ modal, translations });
    modal.classList.add(MODAL_ACTIVE_CLASS);

    // ----- Pré-remplissage depuis sessionStorage -----
    const storedEmail     = safeSession.get(SS('email')) || '';
    const storedFirstName = safeSession.get(SS('firstname')) || '';
    const storedLastName  = safeSession.get(SS('lastname')) || '';
    if (storedEmail) panel.setEmailValue(storedEmail);
    if (storedFirstName) panel.setName('firstname', storedFirstName);
    if (storedLastName)  panel.setName('lastname', storedLastName);

    // Pré-sélection initiale du système éducatif basée sur l'email mémorisé
    // (ac-*.fr → francais, sinon → international). L'IA pourra ensuite
    // l'écraser via fillSuggestions() en passe 1.
    panel.setEducationSystem(guessEducationSystemFromEmail(storedEmail), { auto: true });

    panel.showStep('email');
    setTimeout(() => panel.focusEmail(), 50);

    // ----- Auto-détection prénom/nom + validation live de l'email -----
    panel.onEmailInput(() => {
        updateEmailFeedback();
        const guess = guessNamesFromEmail(panel.getEmailValue());
        if (!guess) return;
        if (!panel.getName('firstname') && guess.firstname) panel.setName('firstname', guess.firstname);
        if (!panel.getName('lastname')  && guess.lastname)  panel.setName('lastname', guess.lastname);
    });

    // ----- Persistance prénom/nom au fur et à mesure -----
    panel.onNameChange(() => {
        const fn = panel.getName('firstname');
        const ln = panel.getName('lastname');
        if (fn) safeSession.set(SS('firstname'), fn);
        if (ln) safeSession.set(SS('lastname'), ln);
        syncAuthorDisplay();
        updatePublishGate();
    });

    // ----- Signature publique « Nom d'auteur·rice » -----
    // Pré-remplie « Prénom Nom » et tenue à jour TANT QUE l'auteur ne l'a pas
    // éditée (flow.authorDisplayTouched). Dès qu'il la personnalise (pseudo, nom
    // de groupe), on cesse de l'écraser.
    panel.onAuthorDisplayInput(() => {
        flow.authorDisplayTouched = true;
        panel.setAuthorDisplayCounter(`${panel.getAuthorDisplay().length} / 30`);
        updatePublishGate();
    });

    panel.onLegalChange(updatePublishGate);

    function updatePublishGate() {
        // Pendant qu'une re-vérif live est "blocked", le bouton est verrouillé
        // par installLiveRecheck — on ne réécrit pas son état.
        if (panel.root.querySelector('[data-recheck-badge][data-state="blocked"]')) return;
        panel.setPublishEnabled(canPublishGate());
    }

    function canPublishGate() {
        const form = panel.readForm();
        // Prénom/nom requis SEULEMENT pour un compte nouveau ; signature TOUJOURS.
        const namesOk = flow.accountExists || (!!form.firstname && !!form.lastname);
        return namesOk && !!form.author_display && !!form.legal_accept && !flow.publishing;
    }

    // Compte existant → masque prénom/nom + ne les exige plus (seule la signature
    // reste demandée). Compte nouveau → tout visible et requis.
    function applyAccountExistsToForm() {
        panel.setAuthorNamesHidden(flow.accountExists);
        updatePublishGate();
    }

    // Recopie « Prénom Nom » dans la signature tant qu'elle n'a pas été éditée.
    function syncAuthorDisplay() {
        if (flow.authorDisplayTouched) return;
        const full = `${panel.getName('firstname')} ${panel.getName('lastname')}`.trim().slice(0, 30);
        panel.setAuthorDisplay(full);
        panel.setAuthorDisplayCounter(`${full.length} / 30`);
    }

    // ----- État partagé du flow -----
    const flow = {
        email: '',
        enrichment: null,
        markdownSent: '',           // markdown envoyé à enrich (réutilisé pour passe 2 publish)
        activityTypeMeta: '',       // mainLibrary du h5p.json
        contentFormat: 'h5p',
        iaSnapshot: null,           // snapshot des suggestions IA pour user_modified
        publishing: false,
        accountExists: false,        // lookup workflow D : compte déjà connu pour cet email ?
        accountExistsForEmail: null, // email pour lequel accountExists a été résolu
        authorDisplayTouched: false, // l'auteur a-t-il édité la signature manuellement ?
        exit() {
            uninstallCloseGuards();
            modal.classList.remove(MODAL_ACTIVE_CLASS);
            panel.destroy();
            modal._sucrerieBridgeFlow = null;
        },
        /**
         * Ré-applique les traductions au panneau de dépôt en cours sans
         * détruire les saisies ni les listeners. Appelé par le
         * MutationObserver sur `<html lang>` (cf. index.js).
         */
        refreshTranslations(translations) {
            panel.refreshTranslations(translations);
        }
    };
    modal._sucrerieBridgeFlow = flow;

    // ----- Whitelist de dépôt : chargement au plus tôt -----
    // Lancée dès l'ouverture (et non à la première frappe) pour que la liste
    // soit là avant que l'utilisateur ait fini de saisir son adresse. Tant
    // qu'elle n'est pas arrivée, `emailPassesLocalGate` laisse passer — donc
    // aucun faux « adresse non reconnue » pendant le chargement.
    // Au retour, on rejoue le feedback : l'email peut déjà être pré-rempli
    // depuis sessionStorage. Garde de réentrance — le flow a pu être quitté
    // (ou remplacé par un prev/next) pendant la requête.
    ensureAllowedDomainsLoaded().then(() => {
        if (modal._sucrerieBridgeFlow !== flow) return;
        updateEmailFeedback();
    });

    // ----- Garde-fous fermeture pendant le flow -----
    // On confirme la fermeture si l'utilisateur est en train de remplir
    // (étape `loading` ou `preview`). Sur `email` vide ou `success` (déjà
    // publié) ou `rejected` (rien à perdre) → fermeture libre.
    const overlay = document.querySelector('.preview-modal-overlay');
    const closeBtn = modal.querySelector('.preview-modal__close');

    function shouldConfirmClose() {
        if (flow.publishing) return true;
        const step = panel.getCurrentStep();
        return step === 'loading' || step === 'preview';
    }

    function isConfirmDialogOpen() {
        return !!document.querySelector('[data-sucrerie-bridge-confirm]');
    }

    function askConfirmExit() {
        return showConfirmDialog({
            title:        t('sucrerie_bridge_close_confirm_title', translations),
            message:      t('sucrerie_bridge_close_confirm', translations),
            confirmLabel: t('sucrerie_bridge_close_confirm_yes', translations),
            cancelLabel:  t('sucrerie_bridge_close_confirm_no', translations),
            variant:      'warning'
        });
    }

    /**
     * Intercepteur générique : si on est sur une étape à risque, bloque le
     * close natif, ouvre la modale de confirmation, puis :
     *   - confirmé  → exit du flow + relance la fermeture native
     *   - annulé    → ne fait rien, la modale Caramel reste ouverte
     */
    function interceptCloseAttempt(ev) {
        if (isConfirmDialogOpen()) return;       // évite double-déclenchement
        if (!shouldConfirmClose()) return;       // laisse passer naturellement
        ev.preventDefault();
        ev.stopImmediatePropagation();
        askConfirmExit().then((ok) => {
            if (!ok) return;
            purgeStoredIdentity(); // abandon confirmé → pas de rétention d'identité
            flow.exit();          // détruit le panel, retire la classe, désinstalle les guards
            // Re-déclenche la fermeture Caramel (les guards sont retirés)
            closeBtn?.click();
        });
    }

    const onCloseClick   = (ev) => interceptCloseAttempt(ev);
    const onOverlayClick = (ev) => {
        if (ev.target !== overlay) return;       // clic descendant : ignore
        interceptCloseAttempt(ev);
    };
    const onEscKey = (ev) => {
        if (ev.key !== 'Escape') return;
        interceptCloseAttempt(ev);
    };

    /**
     * Intercepte les raccourcis « refresh / fermer onglet » au niveau keydown
     * AVANT que le navigateur déclenche son unload. C'est le seul moyen
     * d'afficher la modale Sucrerie au lieu du dialogue natif moche.
     *   - F5
     *   - Ctrl+R (refresh)
     *   - Ctrl+Shift+R (hard refresh)
     *   - Ctrl+W (close tab) — pas garanti sur tous les OS, le navigateur
     *     peut le réserver, mais on tente le coup.
     * Si confirmé → exit du flow + on relance le refresh manuellement
     * (`location.reload()`) pour que l'utilisateur retrouve le comportement
     * attendu sans l'interception.
     */
    const onRefreshShortcut = (ev) => {
        if (!shouldConfirmClose()) return;
        if (isConfirmDialogOpen()) return;
        const isRefresh =
            ev.key === 'F5' ||
            ((ev.ctrlKey || ev.metaKey) && (ev.key === 'r' || ev.key === 'R')) ||
            ((ev.ctrlKey || ev.metaKey) && (ev.key === 'w' || ev.key === 'W'));
        if (!isRefresh) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const wantsClose = (ev.key === 'w' || ev.key === 'W');
        askConfirmExit().then((ok) => {
            if (!ok) return;
            purgeStoredIdentity(); // abandon confirmé → pas de rétention d'identité
            flow.exit();
            if (wantsClose) {
                window.close();          // peut être bloqué par le navigateur
            } else {
                window.location.reload();
            }
        });
    };

    /**
     * beforeunload : filet de sécurité ultime pour les cas qu'on ne peut PAS
     * intercepter au keydown — clic sur un lien externe, fermeture de la
     * fenêtre via le bouton X de l'OS, navigation arrière. Le navigateur
     * impose son propre dialogue natif, on ne peut pas le styler. C'est le
     * comportement standard "Modifications non enregistrées" de toute webapp.
     */
    const onBeforeUnload = (ev) => {
        if (shouldConfirmClose()) {
            ev.preventDefault();
            ev.returnValue = '';
        }
    };

    closeBtn?.addEventListener('click', onCloseClick, { capture: true });
    overlay?.addEventListener('click', onOverlayClick, { capture: true });
    document.addEventListener('keydown', onEscKey, { capture: true });
    document.addEventListener('keydown', onRefreshShortcut, { capture: true });
    window.addEventListener('beforeunload', onBeforeUnload);

    function uninstallCloseGuards() {
        closeBtn?.removeEventListener('click', onCloseClick, { capture: true });
        overlay?.removeEventListener('click', onOverlayClick, { capture: true });
        document.removeEventListener('keydown', onEscKey, { capture: true });
        document.removeEventListener('keydown', onRefreshShortcut, { capture: true });
        window.removeEventListener('beforeunload', onBeforeUnload);
    }

    panel.on('cancel', () => {
        // Confirmation explicite si l'utilisateur a déjà avancé dans le flow
        // (cas typique : clic "Retour" depuis l'étape preview avec données IA
        // chargées + champs auteur saisis — rien n'a encore été envoyé mais
        // tout sera perdu). Contrairement au X close, "Retour" ferme uniquement
        // le flow Sucrerie ; la modale Caramel reste ouverte sur la preview.
        if (!shouldConfirmClose()) {
            purgeStoredIdentity(); // annulation → pas de rétention d'identité
            flow.exit();
            return;
        }
        askConfirmExit().then((ok) => {
            if (!ok) return;
            purgeStoredIdentity(); // annulation confirmée → pas de rétention d'identité
            flow.exit();
        });
    });
    panel.on('continue',        () => onContinue());
    panel.on('retry',           () => panel.showStep('email'));
    panel.on('publish',         () => onPublish());
    panel.on('back-to-preview', () => flow.exit());

    // Validation LIVE de l'email (frappe + blur, pas seulement au clic « Continuer ») :
    // message « adresse personnelle » (GAFAM/FAI → bloc sec) OU lien « Demander un
    // accès » (domaine pro non listé). Évite qu'un message périmé d'un essai précédent
    // reste affiché quand on change d'adresse. Parité avec la Sucrerie.
    let lastEmailFeedbackState = null;
    function updateEmailFeedback() {
        const email = panel.getEmailValue();
        const looksComplete = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        // État rendu (pas la valeur) : le contenu est identique pour tout domaine non
        // académique → on ne re-render QUE si l'état change. Crucial : (a) zéro jitter à
        // chaque frappe, (b) le bouton n'est pas détruit/recréé au blur déclenché par le
        // clic dessus (sinon 1er clic perdu → double-clic).
        let state;
        if (!looksComplete || emailPassesLocalGate(email)) state = 'clear';
        else if (isPersonalEmailDomain(email)) state = 'personal';
        else state = 'prompt';
        if (state === lastEmailFeedbackState) return;
        lastEmailFeedbackState = state;

        if (state === 'clear') { panel.setEmailError(null); return; }
        if (state === 'personal') { panel.setEmailError(t('sucrerie_bridge_error_email_personal_blocked', translations)); return; }
        showAccessRequestPrompt(email);
    }

    // Affiche sous le champ email le message « domaine non reconnu » + un BOUTON
    // « Demander un accès » qui ouvre la modale de demande d'accès INTÉGRÉE au pont
    // (et non un lien externe). Partagé par la validation live et onContinue.
    function showAccessRequestPrompt(email) {
        ensureAccessRequestStyles(); // CSS du bouton dispo dès son apparition
        const baseMsg = t('sucrerie_bridge_error_email_not_allowed', translations);
        const btnLabel = t('sucrerie_bridge_error_email_request_access', translations);
        panel.setEmailErrorHtml(
            `<span class="sucrerie-bridge__email-error-msg">${escapeHtml(baseMsg)}</span>` +
            `<button type="button" class="sucrerie-bridge__access-request-btn" data-access-request>` +
            `<i class="fas fa-paper-plane" aria-hidden="true"></i> ${escapeHtml(btnLabel)}</button>`
        );
        const btn = panel.root.querySelector('[data-access-request]');
        if (btn) {
            btn.addEventListener('click', () => {
                openAccessRequestDialog({ email: panel.getEmailValue(), translations, triggerElement: btn });
            });
        }
    }

    async function onContinue() {
        const email = panel.getEmailValue();
        panel.setEmailError(null);

        if (!email || !email.includes('@')) {
            panel.setEmailError(t('sucrerie_bridge_error_email_invalid', translations));
            panel.focusEmail();
            return;
        }
        if (!emailPassesLocalGate(email)) {
            if (isPersonalEmailDomain(email)) {
                // Adresse personnelle (GAFAM/FAI) : refus certain → on bloque sec,
                // SANS proposer de demande d'accès (inutile de la soumettre).
                panel.setEmailError(t('sucrerie_bridge_error_email_personal_blocked', translations));
                panel.focusEmail();
                return;
            }
            // Domaine pro plausible mais non listé : message + bouton « Demander un
            // accès » qui ouvre la modale intégrée au pont (formulaire in-app).
            showAccessRequestPrompt(email);
            panel.focusEmail();
            return;
        }

        safeSession.set(SS('email'), email);
        flow.email = email;

        panel.showStep('loading');

        let enrichment = null;
        try {
            const fmt = detectFormat(notification);
            const titleHint = getTitleHint(notification);
            flow.contentFormat = fmt;
            const { markdown, activityType } = await extractMarkdownFromBlob(
                notification.blob, fmt, titleHint
            );
            flow.markdownSent = markdown;
            // Pour markdown (aManDe), `notification.titleKey` contient le slug
            // du renderer (ex. `e-marguerite-mot`) — c'est cette valeur qui doit
            // alimenter le catalogue Sucrerie pour la résolution d'icône et de
            // nom localisé (resolveActivityName/Icon). Sinon on stockerait un
            // libellé déjà rendu (modal title) et le catalogue afficherait du
            // brut + fallback mindmap.svg au lieu de l'icône famille.
            // Pour les binaires (h5p/mbz/xml), on garde la valeur extraite du
            // fichier (mainLibrary h5p.json / moduleName mbz).
            flow.activityTypeMeta = (fmt === 'markdown' && notification.titleKey)
                ? notification.titleKey
                : activityType;

            enrichment = await fetchEnrich({
                markdown,
                activity_type: flow.activityTypeMeta || titleHint || '',
                user_intent_who:  intent.qui  || '',
                user_intent_what: intent.quoi || ''
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[sucrerie-bridge] enrich failed', err);
            panel.setEmailError(t('sucrerie_bridge_error_network', translations));
            panel.showStep('email');
            return;
        }

        if (enrichment && enrichment.moderation === 'rejete') {
            panel.setRejectedReason(enrichment.moderation_reason || '');
            panel.showStep('rejected');
            return;
        }

        // Strip du suffixe de type ("X - Flashcards") avant remplissage
        if (enrichment && enrichment.titre) {
            enrichment.titre = stripActivityTypeSuffix(
                enrichment.titre, flow.activityTypeMeta, getTitleHint(notification)
            );
        }

        flow.enrichment = enrichment;

        // Si l'IA n'a pas renseigné le système éducatif, on déduit depuis l'email :
        // domaine académique français → 'francais', sinon → 'international'.
        if (!enrichment.systeme_educatif) {
            enrichment.systeme_educatif = guessEducationSystemFromEmail(email);
        }
        panel.fillSuggestions(enrichment);

        // Snapshot des suggestions IA → permet de détecter `user_modified` à la
        // publication, ce qui déclenche la passe 2 modération côté backend.
        flow.iaSnapshot = {
            title:       enrichment?.titre || '',
            description: enrichment?.description || '',
            objectifs:   enrichment?.objectifs || '',
            tags:        Array.isArray(enrichment?.tags) ? enrichment.tags.slice().sort().join('|') : ''
        };

        // Restaurer les valeurs persistées qui ne viennent pas de l'IA
        if (storedFirstName) panel.setName('firstname', storedFirstName);
        if (storedLastName)  panel.setName('lastname', storedLastName);

        const guess = guessNamesFromEmail(email);
        if (guess) {
            if (!panel.getName('firstname') && guess.firstname) panel.setName('firstname', guess.firstname);
            if (!panel.getName('lastname')  && guess.lastname)  panel.setName('lastname', guess.lastname);
        }

        // Le compte existe-t-il déjà ? Décide si l'écran preview demande prénom+nom
        // (compte nouveau) ou seulement la signature (compte connu). Re-vérifié si
        // l'email change (cross-utilisateur sur le même navigateur). Échec → false
        // (on retombe sur « demander prénom/nom », jamais bloquant).
        if (flow.accountExistsForEmail !== email) {
            flow.accountExists = (await fetchProfileLookup(email)).exists;
            flow.accountExistsForEmail = email;
        }
        applyAccountExistsToForm();
        // Pré-remplit la signature « Prénom Nom » (sauf si déjà personnalisée).
        syncAuthorDisplay();

        // Précharge la wordlist profanity de la langue d'activité courante
        // (snapshot IA) pour que le 1er test soit synchrone à la 1re frappe.
        const lang = enrichment?.langue || 'fr';
        preloadProfanityList(lang);

        // Re-vérification live des champs texte modifiés par l'utilisateur.
        // Le snapshot IA vient juste d'être posé : la première frappe quelques
        // secondes plus tard déclenchera une passe modération seule.
        installLiveRecheck();

        updatePublishGate();
        panel.showStep('preview');
    }

    // ----- Re-vérification live des modifications utilisateur -----
    //
    // Le bouton Publier passe en `disabled` dès qu'un champ est modifié, le
    // temps que la modération LLM revienne. Trois garanties anti-blocage :
    //
    //   1. Idempotence : `flow._liveRecheckInstalled` empêche les listeners
    //      multiples si onContinue est rappelé (retry, ré-entrance flow).
    //   2. Timeout de sécurité : si la modération prend plus de 6 s, on libère
    //      le bouton — la passe 2 backend re-modérera de toute façon au moment
    //      du publish, donc c'est safe.
    //   3. `finally` qui rétablit l'indicateur en `idle` ou propage l'état
    //      attendu, pour qu'aucun chemin d'erreur ne laisse le bouton coincé.

    const RECHECK_SAFETY_TIMEOUT_MS = 6000;

    function installLiveRecheck() {
        if (flow._liveRecheckInstalled) return;
        flow._liveRecheckInstalled = true;

        let timer = null;
        let abortCtrl = null;
        let safetyTimer = null;

        const clearAll = () => {
            if (timer)       { clearTimeout(timer);       timer = null; }
            if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
            if (abortCtrl)   { abortCtrl.abort();         abortCtrl = null; }
        };

        const releaseGate = () => {
            panel.setRecheckState('idle');
            panel.setPublishEnabled(canPublishGate());
        };

        panel.onPreviewFieldChange(() => {
            clearAll();

            const form = panel.readForm();
            const snap = flow.iaSnapshot || { title:'', description:'', objectifs:'', tags:'' };
            const tagsKeyNow = form.tags.slice().sort().join('|');
            const changed =
                form.title       !== snap.title ||
                form.description !== snap.description ||
                form.objectifs   !== snap.objectifs ||
                tagsKeyNow       !== snap.tags;

            if (!changed) {
                releaseGate();
                return;
            }

            // ─── Pré-filtre profanity (instantané, sans appel réseau) ───
            // On teste la concaténation des 4 champs texte contre la wordlist
            // de la langue de l'activité. Match → blocage immédiat, on ne va
            // PAS jusqu'au LLM (économie + latence nulle pour les cas évidents).
            const lang = form.language || flow.enrichment?.langue || 'fr';
            const sample = [form.title, form.description, form.objectifs, form.tags.join(' ')].join(' ');
            testProfanity(sample, lang).then(hit => {
                if (!hit) return;       // pas de match → on laisse le LLM check faire
                // Annule le LLM check en vol (sera re-déclenché si l'utilisateur corrige)
                clearAll();
                const reason = (t('sucrerie_bridge_profanity_blocked', translations) || 'Terme inapproprié détecté : "{term}".')
                    .replace('{term}', hit);
                panel.setRecheckState('blocked', reason);
                panel.showPublishError(formatBlockedHtml(reason, translations));
                panel.setPublishEnabled(false);
            }).catch(() => { /* silent — le LLM check prendra le relais */ });

            // Visuel immédiat : "Vérification…" + bouton publier coupé
            panel.setRecheckState('pending');
            panel.setPublishEnabled(false);

            // Garde-fou : si après 6 s aucune réponse n'est arrivée, on libère
            // le bouton pour ne pas piéger l'utilisateur. La modération sera
            // refaite par la passe 2 backend au moment du publish.
            safetyTimer = setTimeout(() => {
                // eslint-disable-next-line no-console
                console.warn('[sucrerie-bridge] recheck timeout — release publish gate');
                clearAll();
                releaseGate();
            }, RECHECK_SAFETY_TIMEOUT_MS);

            timer = setTimeout(async () => {
                abortCtrl = new AbortController();
                let aborted = false;
                try {
                    const data = await fetchRecheck({
                        markdown: buildRecheckMarkdown(form),
                        activity_type: flow.activityTypeMeta || notification.titleKey || ''
                    }, abortCtrl.signal);
                    // En pré-publication on est strict : 'doute' ET 'rejete'
                    // bloquent tous deux le bouton publier. L'utilisateur doit
                    // adapter sa rédaction pour avoir un 'approuve' clair.
                    if (data.moderation === 'rejete' || data.moderation === 'doute') {
                        panel.setRecheckState('blocked', data.moderation_reason);
                        panel.showPublishError(formatBlockedHtml(data.moderation_reason, translations));
                        panel.setPublishEnabled(false);
                    } else {
                        panel.setRecheckState('ok');
                        panel.showPublishError(null);
                        panel.setPublishEnabled(canPublishGate());
                    }
                } catch (err) {
                    if (err && err.name === 'AbortError') {
                        aborted = true;
                        return; // une autre vérif a pris le relais — elle gérera l'état
                    }
                    // eslint-disable-next-line no-console
                    console.warn('[sucrerie-bridge] recheck failed', err);
                    // Erreur réseau / parsing : on ne bloque pas la publication
                    // (la passe 2 backend re-modérera au publish). On rétablit
                    // l'indicateur et on libère le bouton.
                    releaseGate();
                } finally {
                    if (!aborted) {
                        if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
                    }
                }
            }, RECHECK_DEBOUNCE_MS);
        });
    }

    async function onPublish() {
        const form = panel.readForm();

        const namesOk = flow.accountExists || (form.firstname && form.lastname);
        if (!namesOk || !form.author_display || !form.legal_accept) {
            // Le bouton est en théorie disabled mais on revérifie
            return;
        }

        flow.publishing = true;
        panel.showPublishError(null);
        panel.setPublishLoading(true);

        // Détection user_modified (snapshot IA vs valeurs courantes)
        const snap = flow.iaSnapshot || { title: '', description: '', objectifs: '', tags: '' };
        const tagsKeyNow = form.tags.slice().sort().join('|');
        const userModified =
            form.title       !== snap.title ||
            form.description !== snap.description ||
            form.objectifs   !== snap.objectifs ||
            tagsKeyNow       !== snap.tags;

        // binary_base64 : on n'envoie le blob binaire QUE pour les formats
        // qui sont effectivement des fichiers (h5p/mbz/xml/scorm). Pour le
        // markdown (aManDe), le workflow PostgreSQL XOR-chiffre la chaîne
        // `markdown` et stocke le résultat dans `public_blob`. Si on envoyait
        // aussi binary_base64, il prendrait la priorité dans le workflow
        // (`publicBlob = binaryBase64 || xorEncrypt(markdown)`) et stockerait
        // le base64 du texte tel quel. Au render, xorDecrypt mangerait ce
        // base64 comme s'il était chiffré → bytes illisibles à l'écran.
        let binary_base64 = null;
        if (flow.contentFormat !== 'markdown') {
            try {
                binary_base64 = await blobToBase64(notification.blob);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('[sucrerie-bridge] blob → base64 failed', err);
                flow.publishing = false;
                panel.setPublishLoading(false);
                panel.showPublishError(escapeHtml(t('sucrerie_bridge_error_publish_network', translations)));
                updatePublishGate();
                return;
            }
        }

        const enrichment = flow.enrichment || {};
        const payload = {
            // markdown : alimente la passe 2 LLM côté backend si user_modified
            markdown: flow.markdownSent || '',
            binary_base64,

            email: flow.email,

            // Métadonnées éditoriales
            title:                 form.title,
            description:           form.description,
            objectifs:             form.objectifs,
            tags:                  form.tags,
            tags_ia:               Array.isArray(enrichment.tags) ? enrichment.tags : [],
            discipline:            form.discipline,
            discipline_suggestion: form.discipline_suggestion,
            levels:                form.levels,
            language:              form.language,
            ui_language:           getCurrentLang(),   // langue de l'interface (pour l'e-mail)
            license:               FORCED_LICENSE.code,

            // Système éducatif cible (cf. migration 2026-05-06)
            education_system:       form.education_system,
            education_level_custom: form.education_level_custom,

            // Identité de COMPTE (prénom/nom, initiales avatar). Vides pour un
            // compte existant : le backend C réutilise les valeurs déjà confirmées
            // (COALESCE NULLIF ... prior). Jamais affichés publiquement.
            author_first_name: form.firstname,
            author_last_name:  form.lastname,
            // Identité de PUBLICATION : signature publique « Nom d'auteur·rice »,
            // par activité, affichée seule dans le catalogue. Saisie dédiée (défaut
            // « Prénom Nom », personnalisable). Repli défensif si jamais vide.
            author_display_name: form.author_display || `${form.firstname || ''} ${form.lastname || ''}`.trim().slice(0, 30),

            // Provenance
            source:         SUCRERIE_BRIDGE.sourceId,
            submitted_via:  SUCRERIE_BRIDGE.sourceId,
            content_format: flow.contentFormat,
            // Préférer la mainLibrary du h5p.json (ex. "H5P.Timeline") plutôt
            // que la clé i18n Caramel ("h5p_timeline_name"). C'est cette
            // valeur que Sucrerie utilise pour mapper l'icône, le nom court
            // affiché en lecture, et le filtrage par type côté catalogue.
            activity_type:  flow.activityTypeMeta || notification.titleKey || '',

            // Flux 2-passes
            user_modified:     userModified,
            moderation:        enrichment.moderation || 'approuve',
            moderation_score:  enrichment.moderation_score || 0,
            moderation_reason: enrichment.moderation_reason || ''
        };

        let data;
        try {
            data = await fetchPublish(payload);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[sucrerie-bridge] publish failed', err);
            flow.publishing = false;
            panel.setPublishLoading(false);
            panel.showPublishError(escapeHtml(t('sucrerie_bridge_error_publish_network', translations)));
            updatePublishGate();
            return;
        }

        // Cas 1 : passe 2 a rejeté → message inline, formulaire toujours actif
        if (data && data.error === 'moderation_blocked') {
            flow.publishing = false;
            panel.setPublishLoading(false);
            panel.showPublishError(formatBlockedHtml(data.moderation_reason || '', translations));
            updatePublishGate();
            return;
        }

        if (data && data.error) {
            flow.publishing = false;
            panel.setPublishLoading(false);
            panel.showPublishError(escapeHtml(data.message || data.error));
            updatePublishGate();
            return;
        }

        // Cas 2 : succès — affichage écran final
        // `status` (défaut 'published') gouverne le double opt-in (CDC §9.3) :
        // 'pending_confirmation' ⇒ rien n'est public encore → pas de lien catalogue.
        const status     = data.status || 'published';
        const moderation = data.moderation || 'approuve';
        const publicId   = data.public_id || '';
        const viewUrl    = (status === 'published' && moderation === 'approuve' && publicId)
            ? SUCRERIE_BRIDGE.viewUrlPattern.replace('{public_id}', encodeURIComponent(publicId))
            : '';

        // Marquer cette activité comme partagée pour la session courante.
        // On stocke aussi `status` pour que le bouton ne clame pas « Déjà partagé »
        // de façon trompeuse quand la publication n'est qu'en attente de confirmation.
        const sharedKey = SS('shared_' + notificationKey(notification));
        safeSession.set(sharedKey, JSON.stringify({
            public_id: publicId,
            moderation,
            status,
            at: Date.now()
        }));

        // Mettre immédiatement à jour le bouton du footer-left pour qu'au
        // retour à la visualisation il apparaisse en état "Déjà partagé"
        // sans nécessiter un re-mount via la navigation prev/next.
        markSucrerieButtonAsShared(modal, translations);

        panel.setSuccessState({
            status,
            moderation,
            publicId,
            viewUrl,
            // Double opt-in : afficher l'adresse MASQUÉE renvoyée par le backend
            // (email_masked), comme Sucrerie, plutôt que l'e-mail en clair saisi.
            // Repli sur l'e-mail saisi si le backend ne fournit pas le masque.
            email: data.email_masked || flow.email
        });

        flow.publishing = false;
        panel.setPublishLoading(false);
        panel.showStep('success');
    }
}

// ===== Helpers =====

function detectFormat(notification) {
    const tt = (notification.type || '').toLowerCase();
    if (tt === 'h5p' || tt === 'mbz' || tt === 'xml' || tt === 'scorm') return tt;
    // 'md' / 'markdown' / 'text/markdown' → format unifié 'markdown'
    // (canonical Sucrerie, cf. reader-modal.js qui teste content_format === 'markdown').
    if (tt === 'md' || tt === 'markdown' || tt.startsWith('text/markdown')) return 'markdown';
    return 'h5p';
}

function getTitleHint(notification) {
    const fromModal = document.querySelector('.preview-modal__title')?.textContent?.trim();
    if (fromModal) return fromModal;
    return notification.titleKey || '';
}

/**
 * Clé de session stable pour marquer une notification comme déjà partagée.
 * Privilégie `notification.id` (UUID Caramel) puis `titleKey`+ taille blob
 * comme fallback raisonnable.
 */
function notificationKey(notification) {
    if (notification.id) return String(notification.id);
    const size = notification.blob?.size || 0;
    return `${notification.titleKey || 'unknown'}_${size}`;
}

function guessNamesFromEmail(email) {
    if (!email || !email.includes('@')) return null;
    const local = email.split('@')[0].trim();
    if (!local) return null;
    const parts = local.split(/[._\-+]/).filter(p => p && /^[a-zà-ÿ]/i.test(p));
    if (parts.length === 0) return null;
    if (parts.length === 1) {
        return { firstname: capitalize(parts[0]), lastname: '' };
    }
    return {
        firstname: capitalize(parts[0]),
        lastname:  parts.slice(1).map(capitalize).join('-')
    };
}

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function stripActivityTypeSuffix(title, activityType, titleHint) {
    if (!title) return title;
    let str = String(title).trim();

    const candidates = new Set();
    if (activityType) {
        candidates.add(activityType);
        candidates.add(activityType.replace(/^H5P\./, ''));
    }
    if (titleHint) candidates.add(titleHint);
    ['H5P', 'Flashcards', 'QCM', 'Quiz', 'Quizz', 'QuestionSet',
     'Cartes mémoires', 'Vrai/Faux', 'Vrai ou Faux', 'Mots croisés'
    ].forEach(c => candidates.add(c));

    for (let i = 0; i < 3; i++) {
        const before = str;
        for (const c of candidates) {
            if (!c) continue;
            const esc = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            str = str.replace(new RegExp(`[\\s]*[-–—:][\\s]*${esc}[\\s]*$`, 'i'), '').trim();
            str = str.replace(new RegExp(`[\\s]*\\(${esc}\\)[\\s]*$`, 'i'), '').trim();
            str = str.replace(new RegExp(`[\\s]*\\[${esc}\\][\\s]*$`, 'i'), '').trim();
        }
        if (str === before) break;
    }
    return str || String(title).trim();
}

// Doublon retiré : sémantique strictement identique au canonique
// (`String(s == null ? '' : s)` ≡ `escapeHtml`).

/**
 * Fournisseurs d'email PERSONNELS connus (GAFAM + FAI), jamais académiques.
 * Sert au routage UX : pour ces domaines on bloque sec (refus certain), sans
 * proposer la demande d'accès. PAS un contrôle de sécurité — la whitelist
 * Postgres côté backend Sucrerie reste l'autorité. Liste non exhaustive.
 * Dupliqué volontairement (self-contained) de Sucrerie `core/allowed-domain.js`.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
    // GAFAM / international
    'gmail.com', 'googlemail.com',
    'outlook.com', 'outlook.fr', 'hotmail.com', 'hotmail.fr', 'live.com', 'live.fr', 'msn.com',
    'yahoo.com', 'yahoo.fr', 'ymail.com', 'rocketmail.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com', 'mail.com', 'gmx.com', 'gmx.fr', 'gmx.net',
    'proton.me', 'protonmail.com', 'pm.me', 'tutanota.com',
    'yandex.com', 'yandex.ru', 'qq.com', '163.com', '126.com', 'zoho.com',
    // FAI français
    'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'neuf.fr', 'laposte.net',
    'bbox.fr', 'numericable.fr', 'numericable.com', 'club-internet.fr',
    'aliceadsl.fr', 'cegetel.net', 'voila.fr', 'noos.fr', 'libertysurf.fr', 'tiscali.fr'
]);

/** Vrai si l'email appartient à un fournisseur personnel connu (cf. ci-dessus). */
function isPersonalEmailDomain(email) {
    if (!email || typeof email !== 'string') return false;
    const at = email.trim().toLowerCase().lastIndexOf('@');
    if (at < 0) return false;
    return PERSONAL_EMAIL_DOMAINS.has(email.trim().toLowerCase().slice(at + 1));
}

/**
 * Devine le système éducatif depuis l'email :
 *   - domaine académique français → 'francais'
 *   - tout autre domaine          → 'international'
 * Sert d'auto-pré-sélection si l'IA n'a rien proposé en passe 1.
 * 'formation' n'est jamais deviné automatiquement (l'IA seule peut le détecter).
 */
function guessEducationSystemFromEmail(email) {
    if (!email || typeof email !== 'string') return 'francais';
    const lower = email.trim().toLowerCase();
    if (/@(ac-[a-z-]+\.fr|education\.gouv\.fr|region-academique-[a-z-]+\.fr|reseau-canope\.fr)$/i.test(lower)) {
        return 'francais';
    }
    // Académies d'outre-mer : `.nc`, `.pf`, `.wf` — Éducation nationale française
    // malgré un TLD hors `.fr`. Sans ça, un enseignant de Nouméa se voyait
    // pré-sélectionner « international » (2026-08-16, même cause racine que la
    // regex d'autorisation supprimée de config.js).
    if (SUCRERIE_BRIDGE.frenchEducationExtraDomains.some(d => lower.endsWith('@' + d))) {
        return 'francais';
    }
    return 'international';
}

/**
 * Le pont a-t-il le droit de LAISSER PASSER cet email sans rien afficher ?
 *
 * Remplace l'ancien `SUCRERIE_BRIDGE.emailDomainPattern.test(email)`, qui était
 * une copie figée — et périmée — de la whitelist (cf. services/allowed-domains.js).
 *
 * Trois cas :
 *   - whitelist NON chargée (endpoint injoignable) → on laisse passer. Le backend
 *     (workflow C) revalide et refusera proprement le cas échéant. Inventer un
 *     refus local sans la liste, c'est exactement le bug qu'on corrige : mieux
 *     vaut un refus tardif et juste qu'un refus immédiat et faux.
 *   - whitelist chargée + email autorisé → on laisse passer.
 *   - whitelist chargée + email non autorisé → false (message + demande d'accès).
 *
 * Le blocage « adresse personnelle » (GAFAM/FAI) reste indépendant et local :
 * il n'a jamais dépendu de la whitelist.
 *
 * @param {string} email
 * @returns {boolean}
 */
function emailPassesLocalGate(email) {
    if (!areAllowedDomainsLoaded()) return true;
    return isEmailAllowed(email);
}

/**
 * Construit le HTML d'erreur "modération bloquée" (utilisé aussi bien par
 * la passe 2 publish que par la re-vérif live).
 */
function formatBlockedHtml(reason, translations) {
    const intro = t('sucrerie_bridge_error_publish_blocked_intro', translations);
    const reasonLabel = t('sucrerie_bridge_error_publish_blocked_reason', translations);
    const retry = t('sucrerie_bridge_error_publish_blocked_retry', translations);
    return (
        `<p>${escapeHtml(intro)}</p>` +
        (reason ? `<p><strong>${escapeHtml(reasonLabel)} :</strong> ${escapeHtml(reason)}</p>` : '') +
        `<p>${escapeHtml(retry)}</p>`
    );
}

/**
 * Met à jour le bouton "Vers la Sucrerie" (déjà injecté dans .preview-modal__footer-left)
 * en état "Déjà partagé" disabled, sans nécessiter de re-mount.
 * Au prochain ouverture/navigation, button.js relira sessionStorage et fera
 * le bon rendu nativement — cette fonction sert juste pour la transition
 * directe écran de succès → écran de visualisation.
 */
function markSucrerieButtonAsShared(modal, translations) {
    const btn = modal.querySelector('[data-sucrerie-bridge-btn]');
    if (!btn) return;
    btn.disabled = true;
    const span = btn.querySelector('.sucrerie-bridge__btn-label-long');
    if (span) span.textContent = translations.sucrerie_bridge_already_shared || 'Déjà partagé';
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'fas fa-circle-check';
}
