/**
 * Wrapper de compatibilité pour le worker PDF.js sur Safari < 17.4.
 * Injecte les polyfills nécessaires avant le chargement du worker réel.
 * Promise.withResolvers() est absent sur Safari < 17.4.
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

await import('./pdf.worker.min.mjs');
