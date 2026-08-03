/* =============================================
   services.js — Services Management (Admin)
   ============================================= */

const ServicesAdmin = (() => {
    const iconOptions = [
        { value: 'scissors', label: 'Tijeras' },
        { value: 'pen-tool', label: 'Navaja' },
        { value: 'star', label: 'Estrella' },
        { value: 'sparkles', label: 'Destellos' },
        { value: 'zap', label: 'Rayo' },
        { value: 'crown', label: 'Corona' },
        { value: 'gem', label: 'Gema' },
        { value: 'heart', label: 'Corazón' }
    ];

    // ── Main Render ──
    function render() {
        const services = Storage.Services.getAll();

        return `
        <div class="animate-fade-in-up">
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h1 class="page-title">Servicios</h1>
                    <p class="page-subtitle">Gestiona los servicios que ofreces</p>
                </div>
                <button class="btn btn-primary" onclick="ServicesAdmin.showAddModal()">
                    <i data-lucide="plus"></i>
                    Nuevo servicio
                </button>
            </div>

            <div class="services-admin-list">
                ${services.length === 0
                    ? `<div class="empty-state">
                        <i data-lucide="scissors"></i>
                        <h3>Sin servicios</h3>
                        <p>Añade tu primer servicio para empezar</p>
                    </div>`
                    : services.map(service => _renderServiceCard(service)).join('')
                }
            </div>
        </div>
        `;
    }

    // ── Service Card ──
    function _renderServiceCard(service) {
        return `
        <div class="service-admin-card ${!service.active ? 'inactive' : ''}">
            <div class="service-icon">
                <i data-lucide="${service.icon || 'scissors'}"></i>
            </div>
            <div class="service-admin-info">
                <h4>${service.name} ${!service.active ? '<span class="badge badge-neutral">Inactivo</span>' : ''}</h4>
                <p>${service.description || 'Sin descripción'}</p>
                <div class="service-admin-meta">
                    <span class="badge badge-accent">
                        <i data-lucide="clock" style="width:12px;height:12px"></i>
                        ${service.duration} min
                    </span>
                    <span class="badge badge-accent">
                        <i data-lucide="euro" style="width:12px;height:12px"></i>
                        ${service.price}€
                    </span>
                </div>
            </div>
            <div class="service-admin-actions">
                <button class="btn btn-ghost btn-sm" onclick="ServicesAdmin.toggleService('${service.id}')"
                    data-tooltip="${service.active ? 'Desactivar' : 'Activar'}">
                    <i data-lucide="${service.active ? 'eye-off' : 'eye'}"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="ServicesAdmin.showEditModal('${service.id}')"
                    data-tooltip="Editar">
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="ServicesAdmin.deleteService('${service.id}')"
                    data-tooltip="Eliminar">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
        `;
    }

    // ── Modal: Add/Edit Service ──
    function showAddModal() {
        _showServiceModal(null);
    }

    function showEditModal(serviceId) {
        const service = Storage.Services.getById(serviceId);
        if (!service) return;
        _showServiceModal(service);
    }

    function _showServiceModal(service) {
        const isEdit = !!service;
        const title = isEdit ? 'Editar servicio' : 'Nuevo servicio';

        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="serviceForm" onsubmit="ServicesAdmin.saveService(event, '${isEdit ? service.id : ''}')">
                    <div class="form-group">
                        <label class="form-label">Nombre del servicio</label>
                        <input type="text" id="svcName" class="form-input" value="${isEdit ? service.name : ''}" required placeholder="Ej: Corte de cabello">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea id="svcDescription" class="form-textarea" rows="2" placeholder="Descripción breve del servicio">${isEdit ? (service.description || '') : ''}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                        <div class="form-group">
                            <label class="form-label">Duración (min)</label>
                            <input type="number" id="svcDuration" class="form-input" value="${isEdit ? service.duration : '30'}" required min="5" max="240" step="5">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Precio (€)</label>
                            <input type="number" id="svcPrice" class="form-input" value="${isEdit ? service.price : ''}" required min="0" step="0.5">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Icono</label>
                        <select id="svcIcon" class="form-select">
                            ${iconOptions.map(opt => `
                                <option value="${opt.value}" ${isEdit && service.icon === opt.value ? 'selected' : ''}>
                                    ${opt.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="modal-footer" style="padding: var(--space-md) 0 0; border-top: none;">
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="save"></i>
                            ${isEdit ? 'Guardar cambios' : 'Crear servicio'}
                        </button>
                    </div>
                </form>
            </div>
        `);
    }

    // ── Save Service ──
    function saveService(e, serviceId) {
        e.preventDefault();
        const data = {
            name: document.getElementById('svcName').value.trim(),
            description: document.getElementById('svcDescription').value.trim(),
            duration: parseInt(document.getElementById('svcDuration').value),
            price: parseFloat(document.getElementById('svcPrice').value),
            icon: document.getElementById('svcIcon').value
        };

        if (serviceId) {
            Storage.Services.update(serviceId, data);
            App.showToast('success', 'Actualizado', 'El servicio ha sido actualizado');
        } else {
            Storage.Services.create(data);
            App.showToast('success', 'Creado', 'El nuevo servicio ha sido añadido');
        }

        App.closeModal();
        App.renderPage();
    }

    // ── Toggle Service ──
    function toggleService(serviceId) {
        const service = Storage.Services.toggle(serviceId);
        if (service) {
            App.showToast('info', service.active ? 'Activado' : 'Desactivado',
                `El servicio ha sido ${service.active ? 'activado' : 'desactivado'}`);
        }
        App.renderPage();
    }

    // ── Delete Service ──
    function deleteService(serviceId) {
        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">Eliminar servicio</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body text-center">
                <div class="confirm-icon confirm-icon-danger" style="margin: 0 auto var(--space-md);">
                    <i data-lucide="trash-2"></i>
                </div>
                <h3 style="margin-bottom: var(--space-sm);">¿Eliminar servicio?</h3>
                <p class="confirm-message">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer" style="justify-content: center;">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-danger" onclick="ServicesAdmin.confirmDelete('${serviceId}')">
                    <i data-lucide="trash-2"></i> Eliminar
                </button>
            </div>
        `);
    }

    function confirmDelete(serviceId) {
        Storage.Services.remove(serviceId);
        App.closeModal();
        App.showToast('info', 'Eliminado', 'El servicio ha sido eliminado');
        App.renderPage();
    }

    // ── Public API ──
    return {
        render,
        showAddModal,
        showEditModal,
        saveService,
        toggleService,
        deleteService,
        confirmDelete
    };
})();
