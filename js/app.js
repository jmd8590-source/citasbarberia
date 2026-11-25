/* =============================================
   app.js — SPA Router & App Shell
   ============================================= */

import { brandLogoHTML } from './brand.js';
import { renderIcons } from './icons.js';
import { Storage } from './storage.js';
import { Security } from './security.js';
import { Auth } from './auth.js';
import { Booking } from './booking.js';
import { Profile } from './profile.js';
import { History } from './history.js';
import { ServicesAdmin } from './services.js';
import { Schedule } from './schedule.js';
import { Admin } from './admin.js';
import { t, getLang, setLang } from './i18n.js';
import { LegalPages } from './legal.js';
import { Consent } from './consent.js';
import { Pwa } from './pwa.js';

export const App = (() => {
    let currentRoute = '';

    // ── Route Definitions ──
    const clientRoutes = ['home', 'booking', 'profile', 'history', 'contact'];
    const adminRoutes = ['dashboard', 'agenda', 'clients', 'admin-services', 'schedule', 'settings'];
    const publicRoutes = ['login', 'register'];
    // Viewable whether logged in or not, rendered without the app shell (privacy/terms links from the footer and from within the app)
    const standaloneRoutes = ['privacy', 'terms'];

    // ── Navigation Config (built fresh each render so labels follow the active language) ──
    function _clientNav() {
        return [
            { route: 'home', label: t('Inicio'), icon: 'home' },
            { route: 'booking', label: t('Reservar'), icon: 'scissors' },
            { route: 'profile', label: t('Mi perfil'), icon: 'user' },
            { route: 'history', label: t('Historial'), icon: 'clock' },
            { route: 'contact', label: t('Contacto'), icon: 'phone' }
        ];
    }

    function _adminNav() {
        return [
            { route: 'dashboard', label: t('Dashboard'), icon: 'layout-dashboard' },
            { route: 'agenda', label: t('Agenda'), icon: 'calendar' },
            { route: 'clients', label: t('Clientes'), icon: 'users' },
            { route: 'admin-services', label: t('Servicios'), icon: 'scissors' },
            { route: 'schedule', label: t('Horarios'), icon: 'clock' },
            { route: 'settings', label: t('Ajustes'), icon: 'settings' }
        ];
    }

    // ── Initialize ──
    function init() {
        Storage.seedDemoData();
        applyTheme();
        setLang(getLang());

        // Listen for hash changes
        window.addEventListener('hashchange', _handleRoute);

        // Initial route
        _handleRoute();

        // Cookie / local-storage consent notice (first visit only)
        Consent.initConsentBanner(renderIcons);

        // Re-render when install-ability changes so the "Install app" button can appear/disappear
        Pwa.initPwaInstall(() => _render());
    }

    // ── Router ──
    function _handleRoute() {
        const hash = window.location.hash.slice(1) || '';
        const route = hash || _getDefaultRoute();

        const isLoggedIn = Storage.Session.isLoggedIn();
        const isAdmin = Storage.Session.isAdmin();

        // Auth guard
        if (!isLoggedIn && !publicRoutes.includes(route) && !standaloneRoutes.includes(route)) {
            navigate('login');
            return;
        }

        // Redirect logged users away from auth pages
        if (isLoggedIn && publicRoutes.includes(route)) {
            navigate(isAdmin ? 'dashboard' : 'home');
            return;
        }

        // Role guard
        if (isLoggedIn && !isAdmin && adminRoutes.includes(route)) {
            navigate('home');
            return;
        }

        if (isLoggedIn && isAdmin && clientRoutes.includes(route)) {
            // Admins can visit client routes if needed — allow it
        }

        currentRoute = route;
        _render();
    }

    function _getDefaultRoute() {
        if (!Storage.Session.isLoggedIn()) return 'login';
        return Storage.Session.isAdmin() ? 'dashboard' : 'home';
    }

    function navigate(route) {
        window.location.hash = route;
    }

    // ── Main Render ──
    function _render() {
        const app = document.getElementById('app');
        if (!app) return;

        const isLoggedIn = Storage.Session.isLoggedIn();

        if (!isLoggedIn || publicRoutes.includes(currentRoute) || standaloneRoutes.includes(currentRoute)) {
            // Auth pages and standalone legal pages — no shell
            app.innerHTML = _renderPageContent();
        } else {
            // App shell
            app.innerHTML = _renderAppShell();
        }

        // Initialize Lucide icons
        renderIcons();
    }

    // ── App Shell ──
    function _renderAppShell() {
        const user = Storage.Session.getCurrentUser();
        const isAdmin = Storage.Session.isAdmin();
        const nav = isAdmin ? _adminNav() : _clientNav();

        return `
        <a href="#main-content" class="skip-link">${t('Saltar al contenido')}</a>
        <div class="app-layout">
            <!-- Sidebar (Desktop) -->
            <aside class="app-sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">${brandLogoHTML(32)}</div>
                </div>
                <nav class="sidebar-nav">
                    <div class="sidebar-section-label">${isAdmin ? t('Administración') : t('Menú')}</div>
                    ${nav.map(item => `
                        <div class="sidebar-nav-item ${currentRoute === item.route ? 'active' : ''}"
                             onclick="App.navigate('${item.route}')">
                            <i data-lucide="${item.icon}"></i>
                            ${item.label}
                        </div>
                    `).join('')}
                </nav>
                <div class="sidebar-footer">
                    <div class="sidebar-user" onclick="App.toggleUserMenu()">
                        <div class="sidebar-user-avatar">
                            ${user.avatar && Security.isSafeImageDataUrl(user.avatar) ? `<img src="${user.avatar}" alt="">` : _getInitials(user.name)}
                        </div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${Security.escapeHTML(user.name)}</div>
                            <div class="sidebar-user-role">${isAdmin ? t('Administrador') : t('Cliente')}</div>
                        </div>
                        <i data-lucide="log-out" style="width:18px; height:18px; color: var(--text-muted); cursor: pointer;" onclick="event.stopPropagation(); Auth.logout();" role="button" aria-label="${t('Salir')}" tabindex="0"></i>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="app-main">
                <!-- Top Bar -->
                <header class="app-topbar">
                    <div class="flex items-center gap-md">
                        <button class="btn btn-ghost btn-icon hide-desktop" id="menuToggle" onclick="App.toggleSidebar()" aria-label="${t('Menú')}">
                            <i data-lucide="menu"></i>
                        </button>
                        <h2 style="font-size: var(--fs-md); font-weight: 600;">${_getPageTitle()}</h2>
                    </div>
                    <div class="flex items-center gap-sm">
                        ${(Pwa.canInstall() || Pwa.canShowIOSHint()) ? `
                        <button class="btn btn-ghost btn-icon tooltip-below" onclick="App.installApp()" data-tooltip="${t('Instalar app')}">
                            <i data-lucide="download-cloud"></i>
                        </button>` : ''}
                        ${!isAdmin ? `
                        <button class="btn btn-ghost btn-icon tooltip-below" onclick="App.toggleCatalogMode()" data-tooltip="${getCatalogMode() === 'women' ? t('Ver catálogo Caballeros') : t('Ver catálogo Señoras')}">
                            <i data-lucide="${getCatalogMode() === 'women' ? 'venus' : 'mars'}"></i>
                        </button>` : ''}
                        <button class="btn btn-ghost btn-sm tooltip-below" onclick="App.toggleLang()" data-tooltip="${t('Cambiar idioma')}">
                            <i data-lucide="globe"></i> ${getLang().toUpperCase()}
                        </button>
                        <button class="btn btn-ghost btn-icon tooltip-below" onclick="App.toggleTheme()" data-tooltip="${t('Cambiar tema')}">
                            <i data-lucide="${getTheme() === 'dark' ? 'sun' : 'moon'}"></i>
                        </button>
                        <span class="text-secondary hide-mobile" style="font-size: var(--fs-sm);">
                            ${t('Hola, {name}', { name: Security.escapeHTML(user.name.split(' ')[0]) })}
                        </span>
                        <div class="avatar avatar-sm" style="cursor: pointer;" onclick="${isAdmin ? '' : "App.navigate('profile')" }">
                            ${user.avatar && Security.isSafeImageDataUrl(user.avatar) ? `<img src="${user.avatar}" alt="">` : _getInitials(user.name)}
                        </div>
                    </div>
                </header>

                <!-- Page Content -->
                <div class="app-content" id="main-content" tabindex="-1">
                    ${_renderPageContent()}
                </div>
            </main>

            <!-- Bottom Nav (Mobile) -->
            <nav class="bottom-nav">
                <div class="bottom-nav-items">
                    ${(isAdmin ? _adminNav().slice(0, 4) : _clientNav().slice(0, 4)).map(item => `
                        <div class="bottom-nav-item ${currentRoute === item.route ? 'active' : ''}"
                             onclick="App.navigate('${item.route}')">
                            <i data-lucide="${item.icon}"></i>
                            <span>${item.label}</span>
                        </div>
                    `).join('')}
                    <div class="bottom-nav-item bottom-nav-logout" onclick="Auth.logout()">
                        <i data-lucide="log-out"></i>
                        <span>${t('Salir')}</span>
                    </div>
                </div>
            </nav>
        </div>

        <!-- Sidebar Overlay (Mobile) -->
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="App.toggleSidebar()" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:400;"></div>

        <!-- Modal Container -->
        <div id="modalContainer"></div>

        <!-- Toast Container -->
        <div class="toast-container" id="toastContainer" aria-live="polite"></div>
        `;
    }

    // ── Page Content Router ──
    function _renderPageContent() {
        switch (currentRoute) {
            // Public
            case 'login': return Auth.renderLogin();
            case 'register': return Auth.renderRegister();
            case 'privacy': return LegalPages.renderPrivacy();
            case 'terms': return LegalPages.renderTerms();
            // Client
            case 'home': return _renderHome();
            case 'booking': return Booking.render();
            case 'profile': return Profile.render();
            case 'history': return History.render();
            case 'contact': return _renderContact();
            // Admin
            case 'dashboard': return Admin.renderDashboard();
            case 'agenda': return Admin.renderAgenda();
            case 'clients': return Admin.renderClients();
            case 'admin-services': return ServicesAdmin.render();
            case 'schedule': return Schedule.render();
            case 'settings': return Admin.renderSettings();
            default: return _renderHome();
        }
    }

    function _getPageTitle() {
        const titles = {
            home: t('Inicio'), booking: t('Reservar cita'), profile: t('Mi perfil'),
            history: t('Historial'), contact: t('Contacto'),
            dashboard: t('Dashboard'), agenda: t('Agenda'), clients: t('Clientes'),
            'admin-services': t('Servicios'), schedule: t('Horarios'), settings: t('Ajustes')
        };
        return titles[currentRoute] || 'BarberClub';
    }

    // ── Home Page ──
    function _renderHome() {
        const user = Storage.Session.getCurrentUser();
        if (!user) return '';

        const upcoming = Storage.Appointments.getUpcoming(user.id);
        const nextAppt = upcoming[0];
        const settings = Storage.Settings.get();

        let nextApptHTML = '';
        if (nextAppt) {
            const svc = Storage.Services.getById(nextAppt.serviceId);
            const d = new Date(nextAppt.date + 'T12:00:00');
            const monthNames = [t('Ene'), t('Feb'), t('Mar'), t('Abr'), t('May'), t('Jun'), t('Jul'), t('Ago'), t('Sep'), t('Oct'), t('Nov'), t('Dic')];
            const dayNames = [t('Domingo'), t('Lunes'), t('Martes'), t('Miércoles'), t('Jueves'), t('Viernes'), t('Sábado')];

            nextApptHTML = `
            <div class="home-next-appointment animate-fade-in-up stagger-2">
                <div class="home-next-appointment-header">
                    <i data-lucide="calendar-check" style="width:16px; height:16px;"></i>
                    ${t('Tu próxima cita')}
                </div>
                <div class="home-appointment-card">
                    <div class="home-appointment-date">
                        <div class="home-appointment-day">${d.getDate()}</div>
                        <div class="home-appointment-month">${monthNames[d.getMonth()]}</div>
                    </div>
                    <div class="home-appointment-info">
                        <h4>${svc ? Security.escapeHTML(svc.name) : t('Servicio')}</h4>
                        <p>${dayNames[d.getDay()]} ${t('a las {time} h', { time: nextAppt.time })} ${svc ? `· ${svc.duration} min` : ''}</p>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="App.navigate('history')">
                        ${t('Ver detalles')}
                    </button>
                </div>
            </div>
            `;
        }

        return `
        <div>
            <!-- Hero -->
            <div class="home-hero animate-fade-in-up">
                <p class="home-greeting">${t('Bienvenido')}, <strong>${Security.escapeHTML(user.name.split(' ')[0])}</strong></p>
                <h1>${Security.escapeHTML(settings.shopName || 'BarberClub')}</h1>
                <p>${Security.escapeHTML(settings.description) || t('Tu barbería de confianza')}</p>
                <button class="btn btn-primary btn-xl" onclick="App.navigate('booking')">
                    <i data-lucide="scissors"></i>
                    ${t('Reservar cita ahora')}
                </button>
            </div>

            ${nextApptHTML}

            <!-- Quick Actions -->
            <div class="home-quick-actions animate-fade-in-up stagger-3">
                <h3>${t('Accesos rápidos')}</h3>
                <div class="quick-action-grid">
                    <div class="quick-action-card" onclick="App.navigate('booking')">
                        <div class="quick-action-icon">
                            <i data-lucide="calendar-plus"></i>
                        </div>
                        <div>
                            <h4>${t('Nueva cita')}</h4>
                            <p>${t('Reserva rápidamente')}</p>
                        </div>
                    </div>
                    <div class="quick-action-card" onclick="App.navigate('history')">
                        <div class="quick-action-icon">
                            <i data-lucide="clock"></i>
                        </div>
                        <div>
                            <h4>${t('Mis citas')}</h4>
                            <p>${t('Ver historial completo')}</p>
                        </div>
                    </div>
                    <div class="quick-action-card" onclick="App.navigate('profile')">
                        <div class="quick-action-icon">
                            <i data-lucide="user"></i>
                        </div>
                        <div>
                            <h4>${t('Mi perfil')}</h4>
                            <p>${t('Editar información')}</p>
                        </div>
                    </div>
                    <div class="quick-action-card" onclick="App.navigate('contact')">
                        <div class="quick-action-icon">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <div>
                            <h4>${t('Contacto')}</h4>
                            <p>${t('Ubicación y horarios')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // ── Contact Page ──
    function _renderContact() {
        const settings = Storage.Settings.get();
        const config = Storage.getScheduleConfig();

        const dayNames = {
            mon: t('Lunes'), tue: t('Martes'), wed: t('Miércoles'), thu: t('Jueves'),
            fri: t('Viernes'), sat: t('Sábado'), sun: t('Domingo')
        };
        const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">${t('Contacto')}</h1>
                <p class="page-subtitle">${t('Estamos aquí para ti')}</p>
            </div>

            <div class="contact-grid">
                <div class="contact-info-card">
                    <h3 style="margin-bottom: var(--space-lg);">${t('Información')}</h3>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <div>
                            <h4>${t('Dirección')}</h4>
                            <p>${Security.escapeHTML(settings.address) || t('No configurada')}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="phone"></i>
                        </div>
                        <div>
                            <h4>${t('Teléfono')}</h4>
                            <p>${Security.escapeHTML(settings.phone) || t('No configurado')}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="mail"></i>
                        </div>
                        <div>
                            <h4>${t('Email')}</h4>
                            <p>${Security.escapeHTML(settings.email) || t('No configurado')}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="at-sign"></i>
                        </div>
                        <div>
                            <h4>${t('Instagram')}</h4>
                            <p>${Security.escapeHTML(settings.instagram) || t('No configurado')}</p>
                        </div>
                    </div>
                </div>

                <div class="contact-map">
                    <div class="contact-map-placeholder">
                        <i data-lucide="map"></i>
                        <p>${Security.escapeHTML(settings.address) || t('Ubicación de la barbería')}</p>
                        <p class="text-muted" style="font-size: var(--fs-xs); margin-top: var(--space-sm);">${t('Mapa interactivo')}</p>
                    </div>
                </div>
            </div>

            <div class="contact-schedule animate-fade-in-up stagger-2">
                <h3 style="margin-bottom: var(--space-lg);">${t('Horario de apertura')}</h3>
                ${dayOrder.map(day => `
                    <div class="schedule-row ${!config.workDays[day] ? 'closed' : ''}">
                        <span class="day">${dayNames[day]}</span>
                        <span class="hours">
                            ${config.workDays[day]
                                ? `${config.hours.start} — ${config.hours.end}`
                                : t('Cerrado')}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    }

    // ── UI Helpers ──
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (overlay) {
                overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
            }
        }
    }

    function toggleUserMenu() {
        // Simple toggle — could be extended with dropdown
    }

    let _modalKeydownHandler = null;
    let _modalLastFocused = null;

    function showModal(content) {
        const container = document.getElementById('modalContainer');
        if (!container) {
            // Create one if not exists (auth pages)
            const div = document.createElement('div');
            div.id = 'modalContainer';
            document.body.appendChild(div);
        }

        document.getElementById('modalContainer').innerHTML = `
            <div class="modal-overlay" onclick="App.closeModal(event)">
                <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick="event.stopPropagation()">
                    ${content}
                </div>
            </div>
        `;

        renderIcons();

        _modalLastFocused = document.activeElement;
        const modalEl = document.querySelector('#modalContainer .modal');
        if (modalEl) modalEl.focus();

        _modalKeydownHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                return;
            }
            if (e.key !== 'Tab' || !modalEl) return;
            const focusable = modalEl.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', _modalKeydownHandler);
    }

    function closeModal(event) {
        if (event && event.target && !event.target.classList.contains('modal-overlay')) return;
        const container = document.getElementById('modalContainer');
        if (container) container.innerHTML = '';
        if (_modalKeydownHandler) {
            document.removeEventListener('keydown', _modalKeydownHandler);
            _modalKeydownHandler = null;
        }
        if (_modalLastFocused && typeof _modalLastFocused.focus === 'function') {
            _modalLastFocused.focus();
        }
    }

    function showToast(type, title, message) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.id = 'toastContainer';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        const iconMap = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i data-lucide="${iconMap[type]}" class="toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <i data-lucide="x" class="toast-close" onclick="this.parentElement.remove()" role="button" tabindex="0" aria-label="${t('Cerrar')}"></i>
        `;

        container.appendChild(toast);
        renderIcons();

        // Auto-remove after 4s
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function renderPage() {
        _render();
    }

    function refreshNav() {
        // Re-render to update nav with new user data
        _render();
    }

    function getTheme() {
        return localStorage.getItem('bb_theme') || 'light';
    }

    function applyTheme() {
        const theme = getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#0A0A0B' : '#FAF8F4');
    }

    function toggleTheme() {
        const current = getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('bb_theme', next);
        applyTheme();
        showToast('info', t('Tema actualizado'), next === 'dark' ? t('Modo oscuro activado') : t('Modo claro activado'));
        _render();
    }

    function _getInitials(name) {
        return Security.escapeHTML(name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase());
    }

    // ── Catalog Mode (Caballeros / Señoras) ──
    function getCatalogMode() {
        return localStorage.getItem('bb_catalog_mode') || 'men';
    }

    function toggleCatalogMode() {
        const next = getCatalogMode() === 'men' ? 'women' : 'men';
        localStorage.setItem('bb_catalog_mode', next);
        showToast('info', next === 'women' ? t('Catálogo: Señoras') : t('Catálogo: Caballeros'),
            next === 'women' ? t('Mostrando servicios para señoras') : t('Mostrando servicios para caballeros'));
        _render();
    }

    // ── Language ──
    function toggleLang() {
        const next = getLang() === 'es' ? 'en' : 'es';
        setLang(next);
        _render();
    }

    // ── PWA install ──
    async function installApp() {
        if (Pwa.canInstall()) {
            await Pwa.promptInstall();
            return;
        }
        if (Pwa.canShowIOSHint()) {
            showToast('info', t('Instalar app'), t('Toca el botón Compartir de Safari y luego "Añadir a pantalla de inicio".'));
        }
    }

    // ── Public API ──
    return {
        init,
        navigate,
        renderPage,
        refreshNav,
        installApp,
        toggleSidebar,
        toggleUserMenu,
        getTheme,
        applyTheme,
        toggleTheme,
        getCatalogMode,
        toggleCatalogMode,
        getLang,
        toggleLang,
        showModal,
        closeModal,
        showToast
    };
})();

window.App = App;

// ── Boot ──
document.addEventListener('DOMContentLoaded', App.init);
