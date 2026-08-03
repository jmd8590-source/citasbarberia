/* =============================================
   auth.js — Authentication Module
   ============================================= */

const Auth = (() => {

    // ── Render Login Page ──
    function renderLogin() {
        return `
        <div class="auth-container">
            <div class="auth-card animate-fade-in-up">
                <div class="auth-header">
                    <div class="auth-logo">Barber<span>Club</span></div>
                    <p class="auth-tagline">Estilo, precisión y actitud</p>
                </div>
                <div class="auth-form">
                    <h2 class="auth-title">Bienvenido de nuevo</h2>
                    <p class="auth-subtitle">Inicia sesión para gestionar tus citas</p>
                    <form id="loginForm" onsubmit="Auth.handleLogin(event)">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <div class="form-input-icon">
                                <input type="email" id="loginEmail" class="form-input" placeholder="tu@email.com" required>
                                <i data-lucide="mail"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contraseña</label>
                            <div class="form-input-icon">
                                <input type="password" id="loginPassword" class="form-input" placeholder="••••••••" required>
                                <i data-lucide="lock"></i>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <i data-lucide="log-in"></i>
                            Iniciar sesión
                        </button>
                    </form>
                    <div class="auth-footer">
                        ¿No tienes cuenta? <a href="#" onclick="App.navigate('register'); return false;">Regístrate aquí</a>
                    </div>
                    <div class="divider-text" style="margin-top: var(--space-lg);">Demo</div>
                    <div style="margin-top: var(--space-md); display: flex; gap: var(--space-sm);">
                        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="Auth.demoLogin('admin')">
                            <i data-lucide="shield"></i> Admin
                        </button>
                        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="Auth.demoLogin('client')">
                            <i data-lucide="user"></i> Cliente
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // ── Render Register Page ──
    function renderRegister() {
        return `
        <div class="auth-container">
            <div class="auth-card animate-fade-in-up">
                <div class="auth-header">
                    <div class="auth-logo">Barber<span>Club</span></div>
                    <p class="auth-tagline">Únete a la comunidad</p>
                </div>
                <div class="auth-form">
                    <h2 class="auth-title">Crear cuenta</h2>
                    <p class="auth-subtitle">Reserva tu primera cita en minutos</p>
                    <form id="registerForm" onsubmit="Auth.handleRegister(event)">
                        <div class="form-group">
                            <label class="form-label">Nombre completo</label>
                            <div class="form-input-icon">
                                <input type="text" id="registerName" class="form-input" placeholder="Tu nombre" required>
                                <i data-lucide="user"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <div class="form-input-icon">
                                <input type="email" id="registerEmail" class="form-input" placeholder="tu@email.com" required>
                                <i data-lucide="mail"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Teléfono</label>
                            <div class="form-input-icon">
                                <input type="tel" id="registerPhone" class="form-input" placeholder="+34 600 000 000">
                                <i data-lucide="phone"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contraseña</label>
                            <div class="form-input-icon">
                                <input type="password" id="registerPassword" class="form-input" placeholder="Mínimo 6 caracteres" required minlength="6">
                                <i data-lucide="lock"></i>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg">
                            <i data-lucide="user-plus"></i>
                            Crear cuenta
                        </button>
                    </form>
                    <div class="auth-footer">
                        ¿Ya tienes cuenta? <a href="#" onclick="App.navigate('login'); return false;">Inicia sesión</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // ── Handle Login ──
    async function handleLogin(e) {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmail').value.trim();
        const passwordInput = document.getElementById('loginPassword').value;

        if (!Security.validateEmail(emailInput)) {
            App.showToast('error', 'Error', 'El formato del email no es válido');
            return;
        }

        const user = Storage.Users.getByEmail(emailInput);
        if (!user) {
            App.showToast('error', 'Error', 'Credenciales incorrectas');
            return;
        }

        const inputHash = await Security.hashPassword(passwordInput);
        const syncHash = Security.hashPasswordSync(passwordInput);

        // Support both hashed and legacy string comparison
        if (user.password !== inputHash && user.password !== syncHash && user.password !== passwordInput) {
            App.showToast('error', 'Error', 'Credenciales incorrectas');
            return;
        }

        _login(user);
    }

    // ── Handle Register ──
    async function handleRegister(e) {
        e.preventDefault();
        const name = Security.sanitizeString(document.getElementById('registerName').value, 100);
        const email = document.getElementById('registerEmail').value.trim().toLowerCase();
        const phone = Security.sanitizeString(document.getElementById('registerPhone').value, 20);
        const password = document.getElementById('registerPassword').value;

        if (!name || name.length < 2) {
            App.showToast('error', 'Error', 'Introduce un nombre válido');
            return;
        }

        if (!Security.validateEmail(email)) {
            App.showToast('error', 'Error', 'El formato del email no es válido');
            return;
        }

        if (phone && !Security.validatePhone(phone)) {
            App.showToast('error', 'Error', 'El formato del teléfono no es válido');
            return;
        }

        if (password.length < 6) {
            App.showToast('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        const existing = Storage.Users.getByEmail(email);
        if (existing) {
            App.showToast('error', 'Error', 'Ya existe una cuenta registrada con ese email');
            return;
        }

        const newUser = Storage.Users.create({
            name,
            email,
            phone,
            password, // Storage.Users.create automatically hashes it
            role: 'client', // Strictly client role
            avatar: ''
        });

        App.showToast('success', '¡Bienvenido!', 'Tu cuenta ha sido creada correctamente');
        _login(newUser);
    }

    // ── Demo Login ──
    function demoLogin(role) {
        if (role === 'admin') {
            const admin = Storage.Users.getByEmail('admin@barberia.com');
            if (admin) _login(admin);
        } else {
            const client = Storage.Users.getByEmail('alex@email.com');
            if (client) _login(client);
        }
    }

    // ── Internal Login ──
    function _login(user) {
        Storage.Session.set({
            userId: user.id,
            role: user.role,
            loginAt: new Date().toISOString()
        });

        App.showToast('success', '¡Hola!', `Bienvenido, ${user.name.split(' ')[0]}`);

        if (user.role === 'admin') {
            App.navigate('dashboard');
        } else {
            App.navigate('home');
        }
    }

    // ── Logout ──
    function logout() {
        Storage.Session.clear();
        App.showToast('info', 'Sesión cerrada', 'Has cerrado sesión correctamente');
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
