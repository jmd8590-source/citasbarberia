/* =============================================
   history.js — Appointment History Module
   ============================================= */

import { Storage } from './storage.js';
import { Security } from './security.js';
import { App } from './app.js';
import { t } from './i18n.js';

export const History = (() => {
    let currentFilter = 'all';

    // ── Main Render ──
    function render() {
        const user = Storage.Session.getCurrentUser();
        if (!user) return '';

        const appointments = Storage.Appointments.getByUser(user.id)
            .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

        const filtered = currentFilter === 'all'
            ? appointments
            : appointments.filter(a => a.status === currentFilter);

        const counts = {
            all: appointments.length,
            pending: appointments.filter(a => a.status === 'pending').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length
        };

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">${t('Historial de citas')}</h1>
                <p class="page-subtitle">${t('Revisa tus citas pasadas y pendientes')}</p>
            </div>

            <!-- Filters -->
            <div class="history-filters">
                <button class="history-filter ${currentFilter === 'all' ? 'active' : ''}" onclick="History.setFilter('all')">
                    ${t('Todas')} (${counts.all})
                </button>
                <button class="history-filter ${currentFilter === 'pending' ? 'active' : ''}" onclick="History.setFilter('pending')">
                    ${t('Pendientes')} (${counts.pending})
                </button>
                <button class="history-filter ${currentFilter === 'completed' ? 'active' : ''}" onclick="History.setFilter('completed')">
                    ${t('Completadas')} (${counts.completed})
                </button>
                <button class="history-filter ${currentFilter === 'cancelled' ? 'active' : ''}" onclick="History.setFilter('cancelled')">
                    ${t('Canceladas')} (${counts.cancelled})
                </button>
            </div>

            <!-- Appointments List -->
            <div class="history-list" id="historyList">
                ${filtered.length === 0
                    ? `<div class="empty-state">
                        <i data-lucide="calendar-x"></i>
                        <h3>${t('No hay citas')}</h3>
                        <p>${currentFilter === 'all' ? t('Aún no tienes ninguna cita registrada') : t('No hay citas con este estado')}</p>
                        <button class="btn btn-primary" onclick="App.navigate('booking')">
                            <i data-lucide="plus"></i> ${t('Reservar cita')}
                        </button>
                    </div>`
                    : filtered.map((appt, index) => _renderAppointmentCard(appt, index)).join('')
                }
            </div>
        </div>
        `;
    }

    // ── Appointment Card ──
    function _renderAppointmentCard(appt, index) {
        const service = Storage.Services.getById(appt.serviceId);
        const dateObj = new Date(appt.date + 'T12:00:00');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map(t);
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(t);

        const today = new Date().toISOString().split('T')[0];
        const isFuture = appt.date >= today;
        const isPending = appt.status === 'pending';
        const canModify = isPending && isFuture;

        const statusBadge = {
            pending: `<span class="badge badge-warning">${t('Pendiente')}</span>`,
            completed: `<span class="badge badge-success">${t('Completada')}</span>`,
            cancelled: `<span class="badge badge-error">${t('Cancelada')}</span>`
        };

        return `
        <div class="history-card animate-fade-in-up stagger-${Math.min(index + 1, 6)}">
            <div class="history-date-badge">
                <div class="day">${dateObj.getDate()}</div>
                <div class="month">${monthNames[dateObj.getMonth()]}</div>
            </div>
            <div class="history-card-info">
                <h4>${service ? Security.escapeHTML(service.name) : t('Servicio')}</h4>
                <p>${dayNames[dateObj.getDay()]} ${t('a las {time} h', { time: appt.time })} ${service ? `· ${service.duration} min` : ''}</p>
                <div style="margin-top: var(--space-xs);">
                    ${statusBadge[appt.status] || ''}
                    ${service ? `<span class="badge badge-accent" style="margin-left: 4px;">${service.price}€</span>` : ''}
                </div>
            </div>
            <div class="history-card-actions">
                ${canModify ? `
                    <button class="btn btn-secondary btn-sm" onclick="History.modifyAppointment('${appt.id}')">
                        <i data-lucide="edit-2"></i>
                        <span class="hide-mobile">${t('Modificar')}</span>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="History.cancelAppointment('${appt.id}')">
                        <i data-lucide="x"></i>
                        <span class="hide-mobile">${t('Cancelar')}</span>
                    </button>
                ` : ''}
            </div>
        </div>
        `;
    }

    // ── Actions ──
    function setFilter(filter) {
        currentFilter = filter;
        App.renderPage();
    }

    function cancelAppointment(apptId) {
        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">${t('Cancelar cita')}</h3>
                <button class="modal-close" onclick="App.closeModal()" aria-label="${t('Cerrar')}">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body text-center">
                <div class="confirm-icon confirm-icon-warning" style="margin: 0 auto var(--space-md);">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <h3 style="margin-bottom: var(--space-sm);">${t('¿Estás seguro?')}</h3>
                <p class="confirm-message">${t('Esta acción cancelará tu cita. No se puede deshacer.')}</p>
            </div>
            <div class="modal-footer" style="justify-content: center;">
                <button class="btn btn-secondary" onclick="App.closeModal()">${t('No, volver')}</button>
                <button class="btn btn-danger" onclick="History.confirmCancel('${apptId}')">
                    <i data-lucide="x"></i> ${t('Sí, cancelar')}
                </button>
            </div>
        `);
    }

    function confirmCancel(apptId) {
        const user = Storage.Session.getCurrentUser();
        const appt = Storage.Appointments.getById(apptId);

        // Security check: ensure user owns the appointment or is admin
        if (!appt || (appt.userId !== user.id && !Storage.Session.isAdmin())) {
            App.showToast('error', t('Error'), t('No tienes autorización para cancelar esta cita'));
            App.closeModal();
            return;
        }

        Storage.Appointments.cancel(apptId);
        App.closeModal();
        App.showToast('info', t('Cita cancelada'), t('Tu cita ha sido cancelada correctamente'));
        App.renderPage();
    }

    function modifyAppointment(apptId) {
        const appt = Storage.Appointments.getById(apptId);
        if (!appt) return;

        // Cancel the current and redirect to booking with pre-selected service
        Storage.Appointments.cancel(apptId);
        App.showToast('info', t('Cita cancelada'), t('Reserva una nueva cita con los datos que prefieras'));
        App.navigate('booking');
    }

    // ── Public API ──
    return {
        render,
        setFilter,
        cancelAppointment,
        confirmCancel,
        modifyAppointment
    };
})();

window.History = History;
