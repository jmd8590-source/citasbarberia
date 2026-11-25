/* =============================================
   consent.js — Cookie / local-storage consent banner
   The app currently sets NO third-party cookies and runs NO
   analytics/advertising scripts — everything is first-party
   localStorage needed to run the app itself (session, theme,
   language, catalog choice). This banner is honest about that,
   and the "accepted" categories are stored so that if analytics
   is ever added later, it stays gated behind real user consent
   instead of being silently turned on.
   ============================================= */

import { t, getLang } from './i18n.js';

const KEY = 'bb_cookie_consent'; // { necessary: true, analytics: bool, decidedAt: ISO }

function getConsent() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function _setConsent(analytics) {
    try {
        localStorage.setItem(KEY, JSON.stringify({
            necessary: true,
            analytics,
            decidedAt: new Date().toISOString()
        }));
    } catch { /* localStorage unavailable — nothing to persist */ }
    _removeBanner();
}

function _removeBanner() {
    const el = document.getElementById('cookieConsentBanner');
    if (el) el.remove();
}

function acceptAll() {
    _setConsent(true);
}

function acceptNecessary() {
    _setConsent(false);
}

function initConsentBanner(renderIcons) {
    if (getConsent()) return; // already decided
    if (document.getElementById('cookieConsentBanner')) return;

    const el = document.createElement('div');
    el.id = 'cookieConsentBanner';
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', t('Preferencias de privacidad'));
    el.innerHTML = `
        <div class="cookie-banner-text">
            <i data-lucide="cookie"></i>
            <p>${t('Usamos almacenamiento local necesario para que la app funcione (sesión, tema, idioma). No usamos cookies de publicidad ni analítica de terceros.')}
            <a href="#privacy">${t('Más información')}</a></p>
        </div>
        <div class="cookie-banner-actions">
            <button class="btn btn-secondary btn-sm" onclick="Consent.acceptNecessary()">${t('Solo necesarias')}</button>
            <button class="btn btn-primary btn-sm" onclick="Consent.acceptAll()">${t('Aceptar todo')}</button>
        </div>
    `;
    document.body.appendChild(el);
    if (renderIcons) renderIcons(el);
}

export const Consent = { getConsent, acceptAll, acceptNecessary, initConsentBanner };
window.Consent = Consent;
