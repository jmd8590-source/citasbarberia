/* =============================================
   app.js — SPA Router & App Shell
   ============================================= */

const App = (() => {
    let currentRoute = '';

    // ── Route Definitions ──
    const clientRoutes = ['home', 'booking', 'profile', 'history', 'contact'];
    const adminRoutes = ['dashboard', 'agenda', 'clients', 'admin-services', 'schedule', 'settings'];
    const publicRoutes = ['login', 'register'];

    // ── Navigation Config ──
    const clientNav = [
        { route: 'home', label: 'Inicio', icon: 'home' },
        { route: 'booking', label: 'Reservar', icon: 'scissors' },
        { route: 'profile', label: 'Mi perfil', icon: 'user' },
        { route: 'history', label: 'Historial', icon: 'clock' },
        { route: 'contact', label: 'Contacto', icon: 'phone' }
    ];

    const adminNav = [
        { route: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { route: 'agenda', label: 'Agenda', icon: 'calendar' },
        { route: 'clients', label: 'Clientes', icon: 'users' },
        { route: 'admin-services', label: 'Servicios', icon: 'scissors' },
        { route: 'schedule', label: 'Horarios', icon: 'clock' },
        { route: 'settings', label: 'Ajustes', icon: 'settings' }
    ];

    // ── Initialize ──
    function init() {
        Storage.seedDemoData();
        applyTheme();

        // Listen for hash changes
        window.addEventListener('hashchange', _handleRoute);

        // Initial route
        _handleRoute();
    }

    // ── Router ──
    function _handleRoute() {
        const hash = window.location.hash.slice(1) || '';
        const route = hash || _getDefaultRoute();

        const isLoggedIn = Storage.Session.isLoggedIn();
        const isAdmin = Storage.Session.isAdmin();

        // Auth guard
        if (!isLoggedIn && !publicRoutes.includes(route)) {
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

        if (!isLoggedIn || publicRoutes.includes(currentRoute)) {
            // Auth pages — no shell
            app.innerHTML = _renderPageContent();
        } else {
            // App shell
            app.innerHTML = _renderAppShell();
        }

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ── App Shell ──
    function _renderAppShell() {
        const user = Storage.Session.getCurrentUser();
        const isAdmin = Storage.Session.isAdmin();
        const nav = isAdmin ? adminNav : clientNav;

        return `
        <div class="app-layout">
            <!-- Sidebar (Desktop) -->
            <aside class="app-sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">Barber<span>Club</span></div>
                </div>
                <nav class="sidebar-nav">
                    <div class="sidebar-section-label">${isAdmin ? 'Administración' : 'Menú'}</div>
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
                            ${user.avatar ? `<img src="${user.avatar}" alt="">` : _getInitials(user.name)}
                        </div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${Security.escapeHTML(user.name)}</div>
                            <div class="sidebar-user-role">${isAdmin ? 'Administrador' : 'Cliente'}</div>
                        </div>
                        <i data-lucide="log-out" style="width:18px; height:18px; color: var(--text-muted); cursor: pointer;" onclick="event.stopPropagation(); Auth.logout();"></i>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="app-main">
                <!-- Top Bar -->
                <header class="app-topbar">
                    <div class="flex items-center gap-md">
                        <button class="btn btn-ghost btn-icon hide-desktop" id="menuToggle" onclick="App.toggleSidebar()">
                            <i data-lucide="menu"></i>
                        </button>
                        <h2 style="font-size: var(--fs-md); font-weight: 600;">${_getPageTitle()}</h2>
                    </div>
                    <div class="flex items-center gap-sm">
                        <button class="btn btn-ghost btn-icon" onclick="App.toggleTheme()" data-tooltip="Cambiar tema">
                            <i data-lucide="${App.getTheme() === 'dark' ? 'sun' : 'moon'}"></i>
                        </button>
                        <span class="text-secondary hide-mobile" style="font-size: var(--fs-sm);">
                            Hola, ${Security.escapeHTML(user.name.split(' ')[0])}
                        </span>
                        <div class="avatar avatar-sm" style="cursor: pointer;" onclick="${isAdmin ? '' : "App.navigate('profile')" }">
                            ${user.avatar ? `<img src="${Security.escapeHTML(user.avatar)}" alt="">` : _getInitials(user.name)}
                        </div>
                    </div>
                </header>

                <!-- Page Content -->
                <div class="app-content">
                    ${_renderPageContent()}
                </div>
            </main>

            <!-- Bottom Nav (Mobile) -->
            <nav class="bottom-nav">
                <div class="bottom-nav-items">
                    ${(isAdmin ? adminNav.slice(0, 5) : clientNav).map(item => `
                        <div class="bottom-nav-item ${currentRoute === item.route ? 'active' : ''}"
                             onclick="App.navigate('${item.route}')">
                            <i data-lucide="${item.icon}"></i>
                            <span>${item.label}</span>
                        </div>
                    `).join('')}
                </div>
            </nav>
        </div>

        <!-- Sidebar Overlay (Mobile) -->
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="App.toggleSidebar()" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:400;"></div>

        <!-- Modal Container -->
        <div id="modalContainer"></div>

        <!-- Toast Container -->
        <div class="toast-container" id="toastContainer"></div>
        `;
    }

    // ── Page Content Router ──
    function _renderPageContent() {
        switch (currentRoute) {
            // Public
            case 'login': return Auth.renderLogin();
            case 'register': return Auth.renderRegister();
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
            home: 'Inicio', booking: 'Reservar cita', profile: 'Mi perfil',
            history: 'Historial', contact: 'Contacto',
            dashboard: 'Dashboard', agenda: 'Agenda', clients: 'Clientes',
            'admin-services': 'Servicios', schedule: 'Horarios', settings: 'Ajustes'
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
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

            nextApptHTML = `
            <div class="home-next-appointment animate-fade-in-up stagger-2">
                <div class="home-next-appointment-header">
                    <i data-lucide="calendar-check" style="width:16px; height:16px;"></i>
                    Tu próxima cita
                </div>
                <div class="home-appointment-card">
                    <div class="home-appointment-date">
                        <div class="home-appointment-day">${d.getDate()}</div>
                        <div class="home-appointment-month">${monthNames[d.getMonth()]}</div>
                    </div>
                    <div class="home-appointment-info">
                        <h4>${svc ? svc.name : 'Servicio'}</h4>
                        <p>${dayNames[d.getDay()]} a las ${nextAppt.time} h ${svc ? `· ${svc.duration} min` : ''}</p>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="App.navigate('history')">
                        Ver detalles
                    </button>
                </div>
            </div>
            `;
        }

        return `
        <div>
            <!-- Hero -->
            <div class="home-hero animate-fade-in-up">
                <p class="home-greeting">Bienvenido, <strong>${Security.escapeHTML(user.name.split(' ')[0])}</strong></p>
                <h1>${Security.escapeHTML(settings.shopName || 'BarberClub')}</h1>
                <p>${Security.escapeHTML(settings.description || 'Tu barbería de confianza')}</p>
                <button class="btn btn-primary btn-xl" onclick="App.navigate('booking')">
                    <i data-lucide="scissors"></i>
                    Reservar cita ahora
                </button>
            </div>

            ${nextApptHTML}

            <!-- Quick Actions -->
            <div class="home-quick-actions animate-fade-in-up stagger-3">
                <h3>Accesos rápidos</h3>
                <div class="quick-action-grid">
                    <div class="quick-action-card" onclick="App.navigate('booking')">
                        <div class="quick-action-icon">
                            <i data-lucide="calendar-plus"></i>
                        </div>
                        <div>
                            <h4>Nueva cita</h4>
                            <p>Reserva rápidamente</p>
                        </div>
                    </div>
                    <div class="quick-action-card" onclick="App.navigate('history')">
                        <div class="quick-action-icon">
                            <i data-lucide="clock"></i>
                        </div>
                        <div>
                            <h4>Mis citas</h4>
                            <p>Ver historial completo</p>
                        </div>
                    </div>
                    <div class="quick-action-card" onclick="App.navigate('profile')">
                        <div class="quick-action-icon">
                            <i data-lucide="user"></i>
                        </div>
                        <div>
                            <h4>Mi perfil</h4>
                            <p>Editar información</p>
                        </div>
                    </div>
                    <div class="quick-action-card" onclick="App.navigate('contact')">
                        <div class="quick-action-icon">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <div>
                            <h4>Contacto</h4>
                            <p>Ubicación y horarios</p>
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
            mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves',
            fri: 'Viernes', sat: 'Sábado', sun: 'Domingo'
        };
        const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">Contacto</h1>
                <p class="page-subtitle">Estamos aquí para ti</p>
            </div>

            <div class="contact-grid">
                <div class="contact-info-card">
                    <h3 style="margin-bottom: var(--space-lg);">Información</h3>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <div>
                            <h4>Dirección</h4>
                            <p>${settings.address || 'No configurada'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="phone"></i>
                        </div>
                        <div>
                            <h4>Teléfono</h4>
                            <p>${settings.phone || 'No configurado'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="mail"></i>
                        </div>
                        <div>
                            <h4>Email</h4>
                            <p>${settings.email || 'No configurado'}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon">
                            <i data-lucide="instagram"></i>
                        </div>
                        <div>
                            <h4>Instagram</h4>
                            <p>${settings.instagram || 'No configurado'}</p>
                        </div>
                    </div>
                </div>

                <div class="contact-map">
                    <div class="contact-map-placeholder">
                        <i data-lucide="map"></i>
                        <p>${settings.address || 'Ubicación de la barbería'}</p>
                        <p class="text-muted" style="font-size: var(--fs-xs); margin-top: var(--space-sm);">Mapa interactivo</p>
                    </div>
                </div>
            </div>

            <div class="contact-schedule animate-fade-in-up stagger-2">
                <h3 style="margin-bottom: var(--space-lg);">Horario de apertura</h3>
                ${dayOrder.map(day => `
                    <div class="schedule-row ${!config.workDays[day] ? 'closed' : ''}">
                        <span class="day">${dayNames[day]}</span>
                        <span class="hours">
                            ${config.workDays[day]
                                ? `${config.hours.start} — ${config.hours.end}`
                                : 'Cerrado'}
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
                <div class="modal" onclick="event.stopPropagation()">
                    ${content}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeModal(event) {
        if (event && event.target && !event.target.classList.contains('modal-overlay')) return;
        const container = document.getElementById('modalContainer');
        if (container) container.innerHTML = '';
    }

    function showToast(type, title, message) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.id = 'toastContainer';
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
            <i data-lucide="x" class="toast-close" onclick="this.parentElement.remove()"></i>
        `;

        container.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();

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
        if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#0A0A0A' : '#F8FAFD');
    }

    function toggleTheme() {
        const current = getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('bb_theme', next);
        applyTheme();
        showToast('info', 'Tema actualizado', next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
        _render();
    }

    function _getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    // ── Public API ──
    return {
        init,
        navigate,
        renderPage,
        refreshNav,
        toggleSidebar,
        toggleUserMenu,
        getTheme,
        applyTheme,
        toggleTheme,
        showModal,
        closeModal,
        showToast
    };
})();

// ── Boot ──
document.addEventListener('DOMContentLoaded', App.init);
