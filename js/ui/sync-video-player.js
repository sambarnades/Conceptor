/**
 * Lecteur vidéo partagé (Caramel) : abstraction commune `<video>` natif ↔ embed YouTube, avec
 * horloge de lecture (`onTime`) et `seekTo`. Utilisé par :
 *   - l'éditeur Vidéo interactive (`js/editor/interactive-video-panel.js`) — bouton « capturer » ;
 *   - le popover de transcription synchronisée (`js/ui/ui.js`) — défilement calé sur la lecture.
 *
 * YouTube : iframe `youtube-nocookie.com` créée via l'IFrame API (une `<video>` ne lit pas une URL
 * `watch?v=…`). CSP déjà ouverte (`frame-src youtube-nocookie`, `script-src www.youtube.com s.ytimg.com`).
 *
 * Module **sans dépendance** (importable partout, pas d'effet de bord à l'import).
 * @module ui/sync-video-player
 */

let ytApiPromise = null;

/** Identifiant vidéo d'une URL YouTube (watch, youtu.be, embed, shorts, live). */
export function ytVideoId(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
        if (/^(?:m\.|music\.)?youtube(?:-nocookie)?\.com$/.test(host)) {
            if (u.searchParams.get('v')) return u.searchParams.get('v');
            const m = u.pathname.match(/^\/(?:embed|shorts|v|live)\/([\w-]+)/);
            if (m) return m[1];
        }
    } catch { /* URL invalide */ }
    return null;
}

/** Vrai si la source doit être lue via l'embed YouTube. */
export function isYouTubeSource(videoSource) {
    if (!videoSource || !videoSource.url) return false;
    if (videoSource.mime === 'video/YouTube') return true;
    return !!ytVideoId(videoSource.url);
}

/** Charge (une seule fois) l'API IFrame YouTube et résout quand `window.YT` est prêt. */
function loadYTApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof prev === 'function') { try { prev(); } catch { /* hook concurrent */ } }
            resolve(window.YT);
        };
        if (!document.querySelector('script[data-yt-iframe-api]')) {
            const s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            s.async = true;
            s.setAttribute('data-yt-iframe-api', '1');
            document.head.appendChild(s);
        }
    });
    return ytApiPromise;
}

/**
 * Crée un lecteur dans `mountEl` et renvoie une poignée de contrôle.
 * @param {HTMLElement} mountEl - Conteneur (vidé n'est pas requis ; on y ajoute l'élément).
 * @param {{url:string, mime?:string}} videoSource
 * @param {{ onReady?:Function, onTime?:(seconds:number)=>void }} [opts]
 * @returns {{ getCurrentTime:Function, seekTo:Function, isYouTube:boolean, destroy:Function }}
 */
export function createVideoPlayer(mountEl, videoSource, opts = {}) {
    const url = videoSource && videoSource.url;
    const yt = isYouTubeSource(videoSource);
    const onReady = typeof opts.onReady === 'function' ? opts.onReady : () => {};
    const onTime = typeof opts.onTime === 'function' ? opts.onTime : null;

    let ytPlayer = null;
    let videoEl = null;
    let holder = null;
    let timer = null;
    let destroyed = false;

    if (yt) {
        holder = document.createElement('div');
        mountEl.appendChild(holder);
        loadYTApi().then((YT) => {
            if (destroyed || !holder.isConnected) return;
            ytPlayer = new YT.Player(holder, {
                host: 'https://www.youtube-nocookie.com',
                videoId: ytVideoId(url),
                playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
                events: {
                    onReady: () => {
                        onReady();
                        // L'API YouTube n'émet pas d'événement « temps » continu → on sonde.
                        if (onTime) timer = setInterval(() => {
                            if (ytPlayer && ytPlayer.getCurrentTime) {
                                const v = ytPlayer.getCurrentTime();
                                if (Number.isFinite(v)) onTime(v);
                            }
                        }, 250);
                    }
                }
            });
        }).catch(() => { /* API indisponible */ });
    } else {
        videoEl = document.createElement('video');
        videoEl.controls = true;
        videoEl.preload = 'metadata';
        videoEl.setAttribute('crossorigin', 'anonymous');
        videoEl.src = url || '';
        // crossorigin='anonymous' casse la lecture si l'hôte n'a pas d'en-tête CORS → repli sans.
        videoEl.addEventListener('error', () => {
            if (videoEl && videoEl.getAttribute('crossorigin')) {
                videoEl.removeAttribute('crossorigin');
                const s = videoEl.src; videoEl.src = ''; videoEl.src = s;
            }
        }, { once: true });
        videoEl.addEventListener('loadedmetadata', () => onReady(), { once: true });
        // Garde `destroyed` : `destroy()` met videoEl à null puis appelle load(), qui peut émettre un
        // dernier 'timeupdate' APRÈS — sans garde, on lirait `null.currentTime`.
        if (onTime) videoEl.addEventListener('timeupdate', () => { if (!destroyed && videoEl) onTime(videoEl.currentTime || 0); });
        mountEl.appendChild(videoEl);
    }

    return {
        isYouTube: yt,
        getCurrentTime() {
            if (videoEl) return videoEl.currentTime || 0;
            if (ytPlayer && ytPlayer.getCurrentTime) { const v = ytPlayer.getCurrentTime(); return Number.isFinite(v) ? v : 0; }
            return 0;
        },
        getDuration() {
            if (videoEl) return Number.isFinite(videoEl.duration) ? videoEl.duration : 0;
            if (ytPlayer && ytPlayer.getDuration) { const d = ytPlayer.getDuration(); return Number.isFinite(d) ? d : 0; }
            return 0;
        },
        seekTo(sec) {
            const s = Math.max(0, Number(sec) || 0);
            if (videoEl) { try { videoEl.currentTime = s; } catch { /* metadata pas prête */ } }
            else if (ytPlayer && ytPlayer.seekTo) { try { ytPlayer.seekTo(s, true); } catch { /* pas prêt */ } }
        },
        destroy() {
            destroyed = true;
            if (timer) { clearInterval(timer); timer = null; }
            if (ytPlayer && ytPlayer.destroy) { try { ytPlayer.destroy(); } catch { /* déjà détruit */ } ytPlayer = null; }
            if (videoEl) { try { videoEl.pause(); videoEl.removeAttribute('src'); videoEl.load(); } catch { /* ignore */ } videoEl.remove(); videoEl = null; }
            // Retirer du DOM le conteneur YouTube (restauré à la place de l'iframe par
            // ytPlayer.destroy()) : sans ça, chaque destroy/re-création (bascule Plan ↔ Direct
            // du panneau Vidéo interactive) empile un élément mort de plus dans mountEl.
            if (holder) { try { holder.remove(); } catch { /* ignore */ } holder = null; }
        }
    };
}
