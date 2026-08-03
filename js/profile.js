/* =============================================
   profile.js — User Profile Module
   ============================================= */

const Profile = (() => {

    // ── Main Render ──
    function render() {
        const user = Storage.Session.getCurrentUser();
        if (!user) return '<p>Error: usuario no encontrado</p>';

        const appointments = Storage.Appointments.getByUser(user.id);
        const completed = appointments.filter(a => a.status === 'completed').length;
        const gallery = Storage.Gallery.getByUser(user.id);

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">Mi perfil</h1>
                <p class="page-subtitle">Gestiona tu información personal</p>
            </div>

            <!-- Profile Header -->
            <div class="profile-header">
                <div class="profile-avatar-wrapper">
                    <div class="avatar avatar-2xl">
                        ${user.avatar
                            ? `<img src="${user.avatar}" alt="${user.name}">`
                            : _getInitials(user.name)
                        }
                    </div>
                    <label class="profile-avatar-edit" for="avatarUpload">
                        <i data-lucide="camera"></i>
                    </label>
                    <input type="file" id="avatarUpload" accept="image/*" style="display:none" onchange="Profile.uploadAvatar(event)">
                </div>
                <div class="profile-info">
                    <h2>${Security.escapeHTML(user.name)}</h2>
                    <p>${Security.escapeHTML(user.email)}</p>
                    ${user.phone ? `<p>${Security.escapeHTML(user.phone)}</p>` : ''}
                </div>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${completed}</div>
                        <div class="profile-stat-label">Visitas</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${gallery.length}</div>
                        <div class="profile-stat-label">Fotos</div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs mb-lg" style="max-width: 400px;">
                <div class="tab active" onclick="Profile.showTab('info')" id="tabInfo">Información</div>
                <div class="tab" onclick="Profile.showTab('gallery')" id="tabGallery">Galería</div>
            </div>

            <!-- Tab Content -->
            <div id="profileTabContent">
                ${_renderInfoTab(user)}
            </div>
        </div>
        `;
    }

    // ── Info Tab ──
    function _renderInfoTab(user) {
        return `
        <div class="card animate-fade-in" style="max-width: 600px;">
            <form onsubmit="Profile.saveProfile(event)">
                <div class="form-group">
                    <label class="form-label">Nombre completo</label>
                    <div class="form-input-icon">
                        <input type="text" id="profileName" class="form-input" value="${user.name}" required>
                        <i data-lucide="user"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <div class="form-input-icon">
                        <input type="email" id="profileEmail" class="form-input" value="${user.email}" required>
                        <i data-lucide="mail"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Teléfono</label>
                    <div class="form-input-icon">
                        <input type="tel" id="profilePhone" class="form-input" value="${user.phone || ''}">
                        <i data-lucide="phone"></i>
                    </div>
                </div>
                <div class="divider"></div>
                <h4 style="margin-bottom: var(--space-md);">Cambiar contraseña</h4>
                <div class="form-group">
                    <label class="form-label">Nueva contraseña</label>
                    <div class="form-input-icon">
                        <input type="password" id="profilePassword" class="form-input" placeholder="Dejar vacío para no cambiar" minlength="6">
                        <i data-lucide="lock"></i>
                    </div>
                    <span class="form-hint">Mínimo 6 caracteres</span>
                </div>
                <div style="display: flex; gap: var(--space-sm); justify-content: flex-end;">
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="save"></i>
                        Guardar cambios
                    </button>
                </div>
            </form>
        </div>
        `;
    }

    // ── Gallery Tab ──
    function _renderGalleryTab() {
        const user = Storage.Session.getCurrentUser();
        const gallery = Storage.Gallery.getByUser(user.id);

        return `
        <div class="animate-fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
                <p class="text-secondary">${gallery.length} foto${gallery.length !== 1 ? 's' : ''} de referencia</p>
            </div>
            <div class="gallery-grid">
                <label class="gallery-add" for="galleryUpload">
                    <i data-lucide="plus"></i>
                    <span>Añadir foto</span>
                    <input type="file" id="galleryUpload" accept="image/*" style="display:none" onchange="Profile.uploadGalleryPhoto(event)">
                </label>
                ${gallery.map(item => `
                    <div class="gallery-item" onclick="Profile.viewGalleryItem('${item.id}')">
                        <img src="${item.imageData}" alt="${Security.escapeHTML(item.caption || 'Foto')}">
                        <div class="gallery-item-overlay">
                            <span class="gallery-item-caption">${Security.escapeHTML(item.caption || '')}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    }

    // ── Actions ──
    function showTab(tab) {
        const user = Storage.Session.getCurrentUser();
        const content = document.getElementById('profileTabContent');
        if (!content) return;

        // Update tab active state
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        if (tab === 'info') {
            document.getElementById('tabInfo').classList.add('active');
            content.innerHTML = _renderInfoTab(user);
        } else {
            document.getElementById('tabGallery').classList.add('active');
            content.innerHTML = _renderGalleryTab();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function saveProfile(e) {
        e.preventDefault();
        const user = Storage.Session.getCurrentUser();
        const name = Security.sanitizeString(document.getElementById('profileName').value, 100);
        const email = document.getElementById('profileEmail').value.trim().toLowerCase();
        const phone = Security.sanitizeString(document.getElementById('profilePhone').value, 20);
        const password = document.getElementById('profilePassword').value;

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

        // Check email uniqueness
        const existing = Storage.Users.getByEmail(email);
        if (existing && existing.id !== user.id) {
            App.showToast('error', 'Error', 'Ese email ya está en uso');
            return;
        }

        const updates = { name, email, phone };
        if (password && password.length >= 6) {
            updates.password = password;
        } else if (password && password.length > 0 && password.length < 6) {
            App.showToast('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        Storage.Users.update(user.id, updates);
        App.showToast('success', 'Guardado', 'Tu perfil ha sido actualizado');
        App.refreshNav();
    }

    function uploadAvatar(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            App.showToast('error', 'Error', 'La imagen debe ser menor a 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const user = Storage.Session.getCurrentUser();
            Storage.Users.update(user.id, { avatar: ev.target.result });
            App.showToast('success', 'Avatar actualizado', 'Tu foto de perfil ha sido cambiada');
            App.renderPage();
        };
        reader.readAsDataURL(file);
    }

    function uploadGalleryPhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
            App.showToast('error', 'Error', 'La imagen debe ser menor a 3MB');
            return;
        }

        const rawCaption = prompt('Añade una descripción (opcional):') || '';
        const caption = Security.sanitizeString(rawCaption, 100);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const user = Storage.Session.getCurrentUser();
            Storage.Gallery.create({
                userId: user.id,
                imageData: ev.target.result,
                caption: caption,
                date: new Date().toISOString().split('T')[0]
            });
            App.showToast('success', 'Foto añadida', 'La foto se ha guardado en tu galería');
            showTab('gallery');
        };
        reader.readAsDataURL(file);
    }

    function viewGalleryItem(itemId) {
        const item = Storage.Gallery.getAll().find(g => g.id === itemId);
        if (!item) return;

        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">${Security.escapeHTML(item.caption || 'Foto de referencia')}</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body" style="padding:0;">
                <img src="${item.imageData}" alt="${Security.escapeHTML(item.caption || '')}" style="width:100%; border-radius: 0 0 var(--radius-lg) var(--radius-lg);">
            </div>
            <div class="modal-footer">
                <button class="btn btn-danger btn-sm" onclick="Profile.deleteGalleryItem('${item.id}')">
                    <i data-lucide="trash-2"></i> Eliminar
                </button>
            </div>
        `);
    }

    function deleteGalleryItem(itemId) {
        Storage.Gallery.remove(itemId);
        App.closeModal();
        App.showToast('info', 'Eliminada', 'La foto ha sido eliminada');
        showTab('gallery');
    }

    function _getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    // ── Public API ──
    return {
        render,
        showTab,
        saveProfile,
        uploadAvatar,
        uploadGalleryPhoto,
        viewGalleryItem,
        deleteGalleryItem
    };
})();
