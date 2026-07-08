/**
 * Wrapper de compatibilité pour le worker PDF.js.
 * Injecte les polyfills nécessaires avant le chargement du worker réel.
 * - Promise.withResolvers() : absent sur Safari < 17.4.
 * - structuredClone() : absent sur Safari < 15.4.
 * - Uint8Array.prototype.toHex() : absent sur Chrome < 140, Safari < 18.2,
 *   Firefox < 133. Le worker l'appelle pour le fingerprint de CHAQUE document
 *   (shadow(this,"fingerprints",[a.toHex(),...])) → sans ça « toHex is not a
 *   function » et la transcription échoue sur les vieux Chrome.
 *   (Voir aussi les mêmes polyfills côté thread principal dans core/lib-loader.js.)
 */

if (typeof Promise.withResolvers === 'undefined') {
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

if (typeof globalThis.structuredClone === 'undefined') {
    globalThis.structuredClone = function (value) {
        return JSON.parse(JSON.stringify(value));
    };
}

if (typeof Uint8Array.prototype.toHex === 'undefined') {
    Uint8Array.prototype.toHex = function () {
        let s = '';
        for (let i = 0; i < this.length; i++) {
            s += this[i].toString(16).padStart(2, '0');
        }
        return s;
    };
}

if (typeof Uint8Array.fromHex === 'undefined') {
    Uint8Array.fromHex = function (hex) {
        const len = hex.length >> 1;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            out[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return out;
    };
}

if (typeof Uint8Array.prototype.toBase64 === 'undefined') {
    Uint8Array.prototype.toBase64 = function () {
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < this.length; i += chunk) {
            bin += String.fromCharCode.apply(null, this.subarray(i, i + chunk));
        }
        return btoa(bin);
    };
}

if (typeof Uint8Array.fromBase64 === 'undefined') {
    Uint8Array.fromBase64 = function (b64) {
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            out[i] = bin.charCodeAt(i);
        }
        return out;
    };
}

await import('./pdf.worker.min.mjs');
