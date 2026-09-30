/** Tuile « + » et aperçu du fond personnel, à côté des thèmes Éléa. */
import { t } from './vocabulaire.js';
import { el, icone, action } from './dom.js';
import { preparerImageCarte, traceCartePersonnelle } from './carte-image.js';

export function construireFondPersonnel(plan, changer) {
    const tuile = el('button', 'pc-fond-tuile');
    tuile.type = 'button';
    tuile.append(icone('fa-plus'), el('span', null, t('parcours_carte_perso_ajouter')));
    const fichier = el('input');
    fichier.type = 'file';
    fichier.accept = 'image/*,.heic,.heif,.tif,.tiff';
    fichier.hidden = true;
    fichier.id = 'pc-fond-fichier';
    const suite = el('div', 'pc-fond-suite');
    const aide = el('p', 'pc-block__hint', t('parcours_carte_perso_formats'));
    const message = el('p', 'pc-fond-message');
    message.setAttribute('role', 'status');
    const figure = el('figure', 'pc-fond-apercu');
    const visuel = el('div', 'pc-fond-apercu__image');
    const photo = el('img');
    photo.alt = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    const trace = document.createElementNS(svg.namespaceURI, 'path');
    trace.setAttribute('fill', 'none');
    trace.setAttribute('class', 'pc-fond-apercu__trace');
    svg.append(trace);
    visuel.append(photo, svg);
    const legende = el('figcaption', null, t('parcours_carte_perso_apercu'));
    figure.append(visuel, legende);
    const controles = el('div', 'pc-fond-controles');
    const nom = el('span', 'pc-fond-nom');
    const remplacer = action('parcours_carte_perso_remplacer', 'fa-image', () => fichier.click());
    const retirer = action('ih_remove_image', 'fa-xmark', () => {
        generation++;
        delete plan.carte.image;
        delete plan.carte.personnalisee;
        message.textContent = '';
        changer(); actualiser(); tuile.focus({ preventScroll: true });
    });
    controles.append(nom, remplacer, retirer);
    suite.append(fichier, aide, message, figure, controles);
    let generation = 0, dessin = 0, occupe = false;
    function actualiser() {
        const tourDessin = ++dessin;
        const image = plan.carte.image, choisie = !!plan.carte.personnalisee;
        tuile.setAttribute('aria-pressed', String(choisie));
        tuile.disabled = occupe;
        remplacer.disabled = occupe;
        retirer.disabled = occupe;
        tuile.replaceChildren();
        if (image?.dataURL) {
            const miniature = el('img');
            miniature.src = image.dataURL; miniature.alt = '';
            tuile.append(miniature, el('span', null, t('parcours_carte_perso_titre')));
        } else tuile.append(icone('fa-plus'), el('span', null, t('parcours_carte_perso_ajouter')));
        figure.hidden = !choisie || !image?.dataURL;
        controles.hidden = !image;
        if (image?.dataURL && choisie) {
            photo.src = image.dataURL;
            svg.setAttribute('viewBox', `0 0 ${image.width} ${image.height}`);
            trace.setAttribute('d', traceCartePersonnelle(image));
            svg.querySelectorAll('g').forEach(n => n.remove());
            // Repères indicatifs ; le greffon calcule les icônes réelles après import.
            requestAnimationFrame(() => {
                if (tourDessin !== dessin || !trace.isConnected || figure.hidden) return;
                const n = plan.etapes.flatMap(e => e.cartes).filter(c => c.module !== 'parcours_etiquette').length;
                const longueur = trace.getTotalLength();
                for (let i = 0; i < n; i++) {
                    const p = trace.getPointAtLength(n > 1 ? i * longueur / (n - 1) : 0);
                    const groupe = document.createElementNS(svg.namespaceURI, 'g');
                    const rond = document.createElementNS(svg.namespaceURI, 'circle');
                    rond.setAttribute('cx', p.x); rond.setAttribute('cy', p.y); rond.setAttribute('r', '25');
                    const texte = document.createElementNS(svg.namespaceURI, 'text');
                    texte.setAttribute('x', p.x); texte.setAttribute('y', p.y);
                    texte.textContent = i + 1;
                    groupe.append(rond, texte); svg.append(groupe);
                }
            });
        } else photo.removeAttribute('src');
        nom.textContent = image?.nom || '';
        if (choisie && !image?.dataURL && !occupe) message.textContent = t('parcours_carte_perso_manquante');
    }
    async function joindre(file) {
        if (!file || occupe) return;
        const tour = ++generation;
        occupe = true;
        message.textContent = t('parcours_source_preparation'); actualiser();
        try {
            const image = await preparerImageCarte(file);
            if (tour !== generation || !tuile.isConnected) return;
            const poids = plan.etapes.flatMap(e => e.cartes).reduce((s, c) =>
                s + Object.values(c.medias || {}).reduce((n, uri) => n + uri.length, 0), image.dataURL.length);
            if (poids > 20 * 1024 * 1024) throw new Error('parcours_source_limite');
            plan.carte.image = image;
            plan.carte.personnalisee = true;
            message.textContent = '';
            changer();
        } catch (e) {
            if (tour === generation) message.textContent = t(e.message === 'parcours_source_limite'
                ? e.message : e.message === 'SIZE_EXCEEDED' ? 'ih_image_size_error' : 'ih_image_format_error');
        } finally {
            if (tour === generation) { occupe = false; fichier.value = ''; actualiser(); }
        }
    }
    tuile.addEventListener('click', () => {
        if (plan.carte.image?.dataURL) {
            plan.carte.personnalisee = true; message.textContent = '';
            changer(); actualiser();
        } else fichier.click();
    });
    fichier.addEventListener('change', () => joindre(fichier.files[0]));
    tuile.addEventListener('dragover', e => { e.preventDefault(); tuile.classList.add('pc-fond-tuile--survol'); });
    tuile.addEventListener('dragleave', () => tuile.classList.remove('pc-fond-tuile--survol'));
    tuile.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation(); tuile.classList.remove('pc-fond-tuile--survol');
        joindre(e.dataTransfer?.files[0]);
    });
    actualiser();
    return { tuile, suite, actualiser,
        annuler: () => {
            generation++; occupe = false; fichier.value = ''; message.textContent = ''; actualiser();
        },
        detruire: () => { generation++; dessin++; },
    };
}
