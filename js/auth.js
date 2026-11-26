/* =============================================
   auth.js — Authentication Module
   ============================================= */

import { brandLogoHTML } from './brand.js';
import { Storage } from './storage.js';
import { Security } from './security.js';
import { App } from './app.js';
import { t } from './i18n.js';
import { account } from './appwrite-client.js';
import { AppwriteException } from 'appwrite';

export const Auth = (() => {

    // ── Render Login Page ──
    function renderLogin() {
        return `
        <div class="auth-container">
            <button class="btn btn-ghost btn-icon tooltip-below" onclick="App.toggleTheme()" style="position: absolute; top: var(--space-lg); right: var(--space-lg); z-index: 10;" data-tooltip="${t('Cambiar tema')}">
                <i data-lucide="${App.getTheme() === 'dark' ? 'sun' : 'moon'}"></i>
            </button>
            <button class="btn btn-ghost btn-sm tooltip-below" onclick="App.toggleLang()" style="position: absolute; top: var(--space-lg); right: calc(var(--space-lg) + 48px); z-index: 10;" data-tooltip="${t('Cambiar idioma')}">
                <i data-lucide="globe"></i> ${App.getLang().toUpperCase()}
            </button>
            <div class="auth-card animate-fade-in-up">
                <div class="auth-header">
                    <div class="auth-logo">${brandLogoHTML(44)}</div>
                    <p class="auth-tagline">${t('Estilo, precisión y actitud')}</p>
                </div>
                <div class="auth-form">
                    <h2 class="auth-title">${t('Bienvenido de nuevo')}</h2>
                    <p class="auth-subtitle">${t('Inicia sesión para gestionar tus citas')}</p>
                    <form id="loginForm" onsubmit="Auth.handleLogin(event)">
                        <div class="form-group">
                            <label class="form-label" for="loginEmail">${t('Email')}</label>
                            <div class="form-input-icon">
                                <input type="email" id="loginEmail" class="form-input" placeholder="tu@email.com" autocomplete="email" required>
                                <i data-lucide="mail"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="loginPassword">${t('Contraseña')}</label>
                            <div class="form-input-icon">
                                <input type="password" id="loginPassword" class="form-input" placeholder="••••••••" autocomplete="current-password" required>
                                <i data-lucide="lock"></i>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <i data-lucide="log-in"></i>
                            ${t('Iniciar sesión')}
                        </button>
                    </form>
                    <div class="auth-footer">
                        ${t('¿No tienes cuenta?')} <a href="#" onclick="App.navigate('register'); return false;">${t('Regístrate aquí')}</a>
                    </div>
                    <div class="divider-text" style="margin-top: var(--space-lg);">${t('DEMO')}</div>
                    <div style="margin-top: var(--space-md); display: flex; gap: var(--space-sm);">
                        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="Auth.demoLogin('admin')">
                            <i data-lucide="shield"></i> ${t('Admin')}
                        </button>
                        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="Auth.demoLogin('client')">
                            <i data-lucide="user"></i> ${t('Cliente')}
                        </button>
                    </div>
                </div>
            </div>
            <p class="auth-legal-links">
                <a href="#privacy">${t('Política de privacidad')}</a> · <a href="#terms">${t('Términos y condiciones')}</a>
            </p>
        </div>
        `;
    }

    // ── Render Register Page ──
    function renderRegister() {
        return `
        <div class="auth-container">
            <button class="btn btn-ghost btn-icon tooltip-below" onclick="App.toggleTheme()" style="position: absolute; top: var(--space-lg); right: var(--space-lg); z-index: 10;" data-tooltip="${t('Cambiar tema')}">
                <i data-lucide="${App.getTheme() === 'dark' ? 'sun' : 'moon'}"></i>
            </button>
            <button class="btn btn-ghost btn-sm tooltip-below" onclick="App.toggleLang()" style="position: absolute; top: var(--space-lg); right: calc(var(--space-lg) + 48px); z-index: 10;" data-tooltip="${t('Cambiar idioma')}">
                <i data-lucide="globe"></i> ${App.getLang().toUpperCase()}
            </button>
            <div class="auth-card animate-fade-in-up">
                <div class="auth-header">
                    <div class="auth-logo">${brandLogoHTML(44)}</div>
                    <p class="auth-tagline">${t('Únete a la comunidad')}</p>
                </div>
                <div class="auth-form">
                    <h2 class="auth-title">${t('Crear cuenta')}</h2>
                    <p class="auth-subtitle">${t('Reserva tu primera cita en minutos')}</p>
                    <form id="registerForm" onsubmit="Auth.handleRegister(event)">
                        <div class="form-group">
                            <label class="form-label" for="registerName">${t('Nombre completo')}</label>
                            <div class="form-input-icon">
                                <input type="text" id="registerName" class="form-input" placeholder="${t('Tu nombre')}" autocomplete="name" required>
                                <i data-lucide="user"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="registerEmail">${t('Email')}</label>
                            <div class="form-input-icon">
                                <input type="email" id="registerEmail" class="form-input" placeholder="tu@email.com" autocomplete="email" required>
                                <i data-lucide="mail"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="registerPhone">${t('Teléfono')}</label>
                            <div class="form-input-icon">
                                <input type="tel" id="registerPhone" class="form-input" placeholder="+34 600 000 000" autocomplete="tel">
                                <i data-lucide="phone"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="registerPassword">${t('Contraseña')}</label>
                            <div class="form-input-icon">
                                <input type="password" id="registerPassword" class="form-input" placeholder="${t('Mínimo 6 caracteres')}" autocomplete="new-password" required minlength="6">
                                <i data-lucide="lock"></i>
                            </div>
                        </div>
                        <p class="auth-consent-hint">
                            ${t('Al crear una cuenta aceptas nuestra {privacy} y nuestros {terms}.', {
                                privacy: `<a href="#privacy">${t('Política de privacidad')}</a>`,
                                terms: `<a href="#terms">${t('Términos y condiciones')}</a>`
                            })}
                        </p>
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <i data-lucide="user-plus"></i>
                            ${t('Crear cuenta')}
                        </button>
                    </form>
                    <div class="auth-footer">
                        ${t('¿Ya tienes cuenta?')} <a href="#" onclick="App.navigate('login'); return false;">${t('Inicia sesión')}</a>
                    </div>
                </div>
            </div>
            <p class="auth-legal-links">
                <a href="#privacy">${t('Política de privacidad')}</a> · <a href="#terms">${t('Términos y condiciones')}</a>
            </p>
        </div>
        `;
    }

    // ── Handle Login ──
    async function handleLogin(e) {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmail').value.trim();
        const passwordInput = document.getElementById('loginPassword').value;

        if (!Security.validateEmail(emailInput)) {
            App.showToast('error', t('Error'), t('El formato del email no es válido'));
            return;
        }

        await _authenticate(emailInput, passwordInput);
    }

    // ── Handle Register ──
    async function handleRegister(e) {
        e.preventDefault();
        const name = Security.sanitizeString(document.getElementById('registerName').value, 100);
        const email = document.getElementById('registerEmail').value.trim().toLowerCase();
        const phone = Security.sanitizeString(document.getElementById('registerPhone').value, 20);
        const password = document.getElementById('registerPassword').value;

        if (!name || name.length < 2) {
            App.showToast('error', t('Error'), t('Introduce un nombre válido'));
            return;
        }

        if (!Security.validateEmail(email)) {
            App.showToast('error', t('Error'), t('El formato del email no es válido'));
            return;
        }

        if (phone && !Security.validatePhone(phone)) {
            App.showToast('error', t('Error'), t('El formato del teléfono no es válido'));
            return;
        }

        if (password.length < 6) {
            App.showToast('error', t('Error'), t('La contraseña debe tener al menos 6 caracteres'));
            return;
        }

        try {
            const newUser = await Storage.Users.create({ name, email, phone, password });
            App.showToast('success', t('¡Bienvenido!'), t('Tu cuenta ha sido creada correctamente'));
            _afterLogin(newUser);
        } catch (err) {
            if (err instanceof AppwriteException && err.type === 'user_already_exists') {
                App.showToast('error', t('Error'), t('Ya existe una cuenta registrada con ese email'));
            } else {
                App.showToast('error', t('Error'), err.message || t('No se pudo crear la cuenta'));
            }
        }
    }

    // ── Demo Login ──
    async function demoLogin(role) {
        if (role === 'admin') {
            await _authenticate('admin@barberia.com', 'Admin12345!');
        } else {
            await _authenticate('alex@email.com', 'Cliente123!');
        }
    }

    // ── Internal: real Appwrite email/password session ──
    async function _authenticate(email, password) {
        try {
            await account.createEmailPasswordSession({ email, password });
            await Storage.restoreSession();
            const user = Storage.Session.getCurrentUser();
            _afterLogin(user);
        } catch (err) {
            if (err instanceof AppwriteException && (err.code === 401 || err.type === 'user_invalid_credentials')) {
                App.showToast('error', t('Error'), t('Credenciales incorrectas'));
            } else {
                App.showToast('error', t('Error'), err.message || t('Credenciales incorrectas'));
            }
        }
    }

    function _afterLogin(user) {
        App.showToast('success', t('¡Hola!'), t('Bienvenido, {name}', { name: Security.escapeHTML(user.name.split(' ')[0]) }));
        App.navigate(user.role === 'admin' ? 'dashboard' : 'home');
    }

    // ── Logout ──
    async function logout() {
        try {
            await account.deleteSession({ sessionId: 'current' });
        } catch { /* session may already be gone server-side; clear local state regardless */ }
        Storage.Session.clear();
        App.showToast('info', t('Sesión cerrada'), t('Has cerrado sesión correctamente'));
        App.navigate('login');
    }

    // ── Public API ──
    return {
        renderLogin,
        renderRegister,
        handleLogin,
        handleRegister,
        demoLogin,
        logout
    };
})();

// Exposed for inline event handlers rendered via innerHTML (App.navigate(), onclick="Auth.x()")
window.Auth = Auth;
