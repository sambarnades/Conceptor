import { translations, translatePage } from '../core/translation.js';
import { getCaramelVersionFromFooter } from '../core/utils.js';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // vérification toutes les 5 minutes
const INITIAL_DELAY_MS = 8000; // délai initial
const DISMISSED_STORAGE_KEY = 'caramelDismissedVersion';

let modalElement = null;
let langObserver = null;
let localVersion = null;

export function initVersionChecker(options = {}) {
    if (!isHttpProtocol()) {
        return;
    }

    localVersion = getCaramelVersionFromFooter();
    if (!localVersion) {
        return;
    }

    const delay = typeof options.initialDelay === 'number' ? options.initialDelay : INITIAL_DELAY_MS;
    const interval = typeof options.interval === 'number' ? options.interval : CHECK_INTERVAL_MS;

    setTimeout(runVersionCheck, Math.max(0, delay));
    if (interval > 0) {
        setInterval(runVersionCheck, interval);
    }
}

async function runVersionCheck() {
    try {
        const remoteVersion = await fetchPublishedVersion();
        if (!remoteVersion || remoteVersion === localVersion) {
            return;
        }

        if (shouldSkip(remoteVersion)) {
            return;
        }

        openVersionModal(remoteVersion);
    } catch (error) {
        console.debug('[Caramel] Version check skipped:', error);
    }
}

function shouldSkip(remoteVersion) {
    const dismissedVersion = sessionStorage.getItem(DISMISSED_STORAGE_KEY);
    if (dismissedVersion && dismissedVersion === remoteVersion) {
        return true;
    }

    // Ne compare que les deux premières parties de la version du site
    return compareVersions(remoteVersion, localVersion, 2) <= 0;
}

async function fetchPublishedVersion() {
    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set('version-check', Date.now().toString());

    const response = await fetch(targetUrl.toString(), {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });

    if (!response.ok) {
        throw new Error(`Status ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const footerLink = doc.querySelector('footer.footer a[href*="CHANGELOG"]');
    const footerText = footerLink?.textContent || doc.querySelector('footer.footer')?.textContent || '';
    return extractVersionNumber(footerText);
}

function extractVersionNumber(text) {
    if (!text) {
        return null;
    }

    const match = text.match(/v?\s*(\d+(?:\.\d+){0,3})/i);
    return match ? match[1] : null;
}

function compareVersions(a, b, segmentLimit = Infinity) {
    if (!a || !b) {
        return 0;
    }

    const parse = (value) => value.split('.').map(num => parseInt(num, 10) || 0);
    const left = parse(a);
    const right = parse(b);
    const maxLength = Math.max(left.length, right.length);
    const segmentsToCompare = Math.min(maxLength, segmentLimit);

    for (let i = 0; i < segmentsToCompare; i++) {
        const diff = (left[i] || 0) - (right[i] || 0);
        if (diff > 0) return 1;
        if (diff < 0) return -1;
    }

    return 0;
}

function openVersionModal(remoteVersion) {
    if (!modalElement) {
        modalElement = createModal();
    }

    modalElement.dataset.latestVersion = remoteVersion;
    modalElement.dataset.currentVersion = localVersion || '';
    updateModalTexts();

    modalElement.classList.add('visible');
    document.body.classList.add('version-modal-open');
}

function createModal() {
    const wrapper = document.createElement('div');
    wrapper.id = 'version-update-modal';
    wrapper.className = 'version-modal';
    wrapper.innerHTML = `
        <div class="version-modal__overlay" role="presentation"></div>
        <div class="version-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="version-modal-title">
            <div class="version-modal__content">
                <div class="version-modal__icon" aria-hidden="true">
                    <i class="fas fa-sync-alt"></i>
                </div>
                <div class="version-modal__text">
                    <h3 id="version-modal-title" data-key="version_modal_title"></h3>
                    <p id="version-modal-message"></p>
                </div>
                <div class="version-modal__actions">
                    <button type="button" class="action-btn primary-btn version-modal__refresh" data-key="version_modal_update"></button>
                    <button type="button" class="version-modal__dismiss" data-key="version_modal_remind_later"></button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(wrapper);
    translatePage(wrapper);

    wrapper.querySelector('.version-modal__overlay').addEventListener('click', dismissModalForSession);
    wrapper.querySelector('.version-modal__dismiss').addEventListener('click', dismissModalForSession);
    wrapper.querySelector('.version-modal__refresh').addEventListener('click', handleRefreshClick);

    ensureLangObserver();
    return wrapper;
}

function updateModalTexts() {
    if (!modalElement) {
        return;
    }

    translatePage(modalElement);

    const { currentVersion = '', latestVersion = '' } = modalElement.dataset;
    const messageElement = modalElement.querySelector('#version-modal-message');
    if (!messageElement) {
        return;
    }

    const template = translations.version_modal_message || 'Version {latestVersion} disponible (actuelle : {currentVersion}).';
    messageElement.textContent = template
        .replace('{currentVersion}', currentVersion)
        .replace('{latestVersion}', latestVersion);
}

function dismissModalForSession() {
    if (modalElement?.dataset?.latestVersion) {
        sessionStorage.setItem(DISMISSED_STORAGE_KEY, modalElement.dataset.latestVersion);
    }
    closeModal();
}

function handleRefreshClick() {
    sessionStorage.removeItem(DISMISSED_STORAGE_KEY);
    performHardReload();
}

function closeModal() {
    modalElement?.classList.remove('visible');
    document.body.classList.remove('version-modal-open');
}

function performHardReload() {
    window.location.reload();
}

function ensureLangObserver() {
    if (langObserver) {
        return;
    }

    langObserver = new MutationObserver(() => updateModalTexts());
    langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}

function isHttpProtocol() {
    return window.location && /^https?:$/.test(window.location.protocol);
}
