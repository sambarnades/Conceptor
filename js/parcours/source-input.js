/** Le même support dans le plan et dans la file, sans quitter la carte. */
import { t } from '../core/translation.js';
import { action } from './dom.js';
import { typeSource, joindreImage, purgerMedias, transcriptionDecalee } from './sources.js';

export function construireSaisieSource(carte, plan, surChangement) {
    const type = typeSource(carte.module);
    if (!type) return null;
    const node = document.createElement('fieldset');
    let rafraichirSupport = () => {};
    node.className = 'pc-source';
    const texte = (tag, cle, classe = '') => {
        const n = document.createElement(tag);
        n.className = classe;
        n.textContent = t(cle);
        return n;
    };
    node.append(texte('legend', type === 'image' ? 'editor_ih_background' : type === 'lien' ? 'parcours_source_lien_label' : 'video_url_label'));
    const corps = document.createElement('div');
    corps.className = 'pc-source__corps';
    const message = texte('p', '', 'pc-source__message');
    message.setAttribute('role', 'status');
    const avertissement = texte('p', 'parcours_source_modifiee', 'pc-source__message');
    const avertir = () => {
        // Un lien corrigé après la génération n'impose pas de la refaire :
        // l'adresse est lue sur la carte au moment de l'assemblage.
        avertissement.hidden = type === 'lien' || !carte.contenu || !carte.sourceUtilisee
            || carte.sourceUtilisee === JSON.stringify(carte.source || null);
    };
    const changer = () => { avertir(); surChangement(); };
    node.append(corps, message, avertissement);
    avertir();

    if (type === 'lien') {
        // L'adresse d'un lien web : rien à analyser, juste une URL valide.
        const champ = document.createElement('input');
        champ.type = 'url';
        champ.className = 'pc-form__saisie';
        champ.placeholder = 'https://…';
        champ.setAttribute('aria-label', t('parcours_source_lien_label'));
        champ.value = carte.source?.url || '';
        champ.addEventListener('input', () => {
            carte.source = { type, url: champ.value.trim() };
            changer();
        });
        corps.append(champ, texte('p', 'parcours_source_lien_hint', 'pc-source__hint'));
    } else if (type === 'video') {
        const champ = document.createElement('input');
        champ.type = 'url';
        champ.className = 'pc-form__saisie';
        champ.placeholder = t('video_url_placeholder');
        champ.setAttribute('aria-label', t('video_url_label'));
        champ.value = carte.source?.url || '';
        champ.addEventListener('input', () => {
            carte.source = { type, url: champ.value.trim(), transcription: transcription.value,
                transcriptionUrl: carte.source?.transcriptionUrl || carte.source?.url || '' };
            verifierTranscription(); changer();
        });
        const details = document.createElement('details');
        details.className = 'pc-source__transcription';
        details.append(texte('summary', 'video_manual_toggle'));
        const transcription = document.createElement('textarea');
        transcription.className = 'pc-form__saisie';
        transcription.rows = 4;
        transcription.placeholder = t('video_paste_placeholder');
        transcription.setAttribute('aria-label', t('video_transcript_title'));
        transcription.value = carte.source?.transcription || '';
        transcription.addEventListener('input', () => {
            carte.source = { type, url: champ.value.trim(), transcription: transcription.value, transcriptionUrl: champ.value.trim() };
            verifierTranscription(); changer();
        });
        const valider = action('video_paste_btn', 'fa-check', () => {
            carte.source.transcriptionUrl = carte.source.url;
            verifierTranscription(); changer();
        });
        function verifierTranscription() {
            const decalee = transcriptionDecalee(carte);
            valider.hidden = !decalee;
            message.textContent = decalee ? t('parcours_source_transcription_changee') : '';
            if (decalee) details.open = true;
        }
        rafraichirSupport = verifierTranscription;
        details.append(transcription, valider);
        corps.append(champ, texte('p', 'parcours_source_video_hint', 'pc-source__hint'), details);
        verifierTranscription();
    } else {
        const fichier = document.createElement('input');
        fichier.type = 'file';
        fichier.accept = 'image/*,.heic,.heif,.tif,.tiff';
        fichier.hidden = true;
        const apercu = document.createElement('img');
        apercu.className = 'pc-source__apercu';
        apercu.alt = '';
        const controles = document.createElement('div');
        controles.className = 'pc-source__controles';
        const nom = document.createElement('span');
        nom.className = 'pc-source__nom';
        const choisir = action('ih_image_choose', 'fa-paperclip', () => fichier.click());
        const retirer = action('ih_remove_image', 'fa-xmark', () => {
            if (node.disabled) return;
            delete carte.source;
            purgerMedias(carte);
            message.textContent = '';
            peindre(); changer(); choisir.focus({ preventScroll: true });
        });
        function peindre() {
            const uri = carte.medias?.[carte.source?.path];
            apercu.hidden = !uri;
            if (uri) apercu.src = uri;
            else apercu.removeAttribute('src');
            nom.textContent = uri ? carte.source.nom : '';
            retirer.hidden = !uri;
        }
        rafraichirSupport = peindre;
        async function joindre(f) {
            if (!f || node.disabled) return;
            choisir.disabled = true;
            message.textContent = t('parcours_source_preparation');
            try {
                // Le traitement local peut finir après une navigation : ne pas ressusciter la carte.
                if (await joindreImage(carte, f, plan, () => node.isConnected && !node.disabled)) {
                    message.textContent = ''; peindre(); changer();
                }
            } catch (e) {
                message.textContent = t(String(e.message || '').startsWith('parcours_source_') ? e.message
                    : f.size > 12 * 1024 * 1024 ? 'ih_image_size_error' : 'ih_image_format_error');
            } finally { choisir.disabled = false; fichier.value = ''; }
        }
        fichier.addEventListener('change', () => joindre(fichier.files[0]));
        node.addEventListener('dragover', e => { if (!node.disabled) { e.preventDefault(); node.classList.add('pc-source--survol'); } });
        node.addEventListener('dragleave', () => node.classList.remove('pc-source--survol'));
        node.addEventListener('drop', e => {
            e.preventDefault(); e.stopPropagation(); node.classList.remove('pc-source--survol');
            joindre(e.dataTransfer?.files[0]);
        });
        controles.append(choisir, retirer, nom, texte('p', 'parcours_source_image_hint', 'pc-source__hint'));
        corps.classList.add('pc-source__corps--image');
        corps.append(fichier, apercu, controles);
        peindre();
    }
    return { node, actualiser: (occupe = false) => { node.disabled = occupe; rafraichirSupport(); avertir(); } };
}
