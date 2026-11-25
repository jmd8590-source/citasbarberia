/* =============================================
   pwa.js — "Add to Home Screen" install prompt handling
   ============================================= */

let deferredPrompt = null;
let onChangeCallback = null;

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function canInstall() {
    return !!deferredPrompt && !isStandalone();
}

function canShowIOSHint() {
    return isIOS() && !isStandalone();
}

async function promptInstall() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (onChangeCallback) onChangeCallback();
    return outcome === 'accepted';
}

function initPwaInstall(onChange) {
    onChangeCallback = onChange;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (onChangeCallback) onChangeCallback();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        if (onChangeCallback) onChangeCallback();
    });
}

export const Pwa = { initPwaInstall, canInstall, canShowIOSHint, promptInstall, isStandalone };
window.Pwa = Pwa;
