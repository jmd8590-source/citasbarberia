/* =============================================
   schedule.js — Schedule Configuration (Admin)
   ============================================= */

import { Storage } from './storage.js';
import { Security } from './security.js';
import { App } from './app.js';
import { t } from './i18n.js';

export const Schedule = (() => {
    function _dayNames() {
        return {
            mon: t('Lunes'), tue: t('Martes'), wed: t('Miércoles'), thu: t('Jueves'),
            fri: t('Viernes'), sat: t('Sábado'), sun: t('Domingo')
        };
    }
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    // ── Main Render ──
    function render() {
        // The route guard in app.js already keeps non-owners off this page;
        // this is a defensive fallback in case it's reached another way.
        if (!Storage.Session.isOwner()) return '';

        const config = Storage.getScheduleConfig();
        const dayNames = _dayNames();

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">${t('Horarios')}</h1>
                <p class="page-subtitle">${t('Configura tu disponibilidad y bloqueos')}</p>
            </div>

            <div class="schedule-config">
                <!-- Left: Work Days & Hours -->
                <div>
                    <div class="schedule-days">
                        <div class="card-header">
                            <h3 class="card-title">${t('Días laborables')}</h3>
                        </div>
                        ${dayOrder.map(day => `
                            <div class="schedule-day-row">
                                <div style="display: flex; align-items: center; gap: var(--space-md);">
                                    <label class="toggle-switch">
                                        <input type="checkbox" ${config.workDays[day] ? 'checked' : ''}
                                            onchange="Schedule.toggleDay('${day}', this.checked)">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="schedule-day-name">${dayNames[day]}</span>
                                </div>
                                <div class="schedule-day-hours" ${!config.workDays[day] ? 'style="opacity:0.3; pointer-events:none;"' : ''}>
                                    <input type="time" value="${config.hours.start}" id="start_${day}"
                                        onchange="Schedule.updateHours()">
                                    <span>—</span>
                                    <input type="time" value="${config.hours.end}" id="end_${day}"
                                        onchange="Schedule.updateHours()">
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="card mt-lg" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-lg);">
                        <div class="card-header">
                            <h3 class="card-title">${t('Duración de slots')}</h3>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <select class="form-select" id="slotDuration" value="${config.slotDuration}"
                                onchange="Schedule.updateSlotDuration(this.value)">
                                <option value="15" ${config.slotDuration === 15 ? 'selected' : ''}>15 ${t('minutos')}</option>
                                <option value="20" ${config.slotDuration === 20 ? 'selected' : ''}>20 ${t('minutos')}</option>
                                <option value="30" ${config.slotDuration === 30 ? 'selected' : ''}>30 ${t('minutos')}</option>
                                <option value="45" ${config.slotDuration === 45 ? 'selected' : ''}>45 ${t('minutos')}</option>
                                <option value="60" ${config.slotDuration === 60 ? 'selected' : ''}>60 ${t('minutos')}</option>
                            </select>
                            <span class="form-hint">${t('Intervalo mínimo entre citas')}</span>
                        </div>
                    </div>
                </div>

                <!-- Right: Blocks & Vacations -->
                <div>
                    <!-- Blocks -->
                    <div class="schedule-blocks">
                        <div class="card-header">
                            <h3 class="card-title">${t('Bloqueos puntuales')}</h3>
                            <button class="btn btn-ghost btn-sm" onclick="Schedule.showAddBlockModal()">
                                <i data-lucide="plus"></i> ${t('Añadir')}
                            </button>
                        </div>
                        <p class="text-secondary" style="font-size: var(--fs-sm); margin-bottom: var(--space-md);">
                            ${t('Días específicos en los que no aceptas citas')}
                        </p>
                        <div class="block-list" id="blockList">
                            ${(config.blocks || []).length === 0
                                ? `<p class="text-muted" style="font-size: var(--fs-sm); text-align: center; padding: var(--space-md);">${t('No hay bloqueos configurados')}</p>`
                                : (config.blocks || []).map(block => `
                                    <div class="block-item">
                                        <div class="block-item-info">
                                            <span class="block-item-date">${_formatDate(block.date)}</span>
                                            ${block.reason ? `<span class="block-item-reason">— ${Security.escapeHTML(block.reason)}</span>` : ''}
                                        </div>
                                        <button class="btn btn-ghost btn-sm" onclick="Schedule.removeBlock('${block.id}')">
                                            <i data-lucide="x"></i>
                                        </button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>

                    <!-- Vacations -->
                    <div class="schedule-blocks mt-lg">
                        <div class="card-header">
                            <h3 class="card-title">${t('Vacaciones')}</h3>
                            <button class="btn btn-ghost btn-sm" onclick="Schedule.showAddVacationModal()">
                                <i data-lucide="plus"></i> ${t('Añadir')}
                            </button>
                        </div>
                        <p class="text-secondary" style="font-size: var(--fs-sm); margin-bottom: var(--space-md);">
                            ${t('Periodos de vacaciones en los que cierras')}
                        </p>
                        <div class="block-list" id="vacationList">
                            ${(config.vacations || []).length === 0
                                ? `<p class="text-muted" style="font-size: var(--fs-sm); text-align: center; padding: var(--space-md);">${t('No hay vacaciones configuradas')}</p>`
                                : (config.vacations || []).map(vac => `
                                    <div class="block-item">
                                        <div class="block-item-info">
                                            <span class="block-item-date">${_formatDate(vac.startDate)} — ${_formatDate(vac.endDate)}</span>
                                            ${vac.reason ? `<span class="block-item-reason">— ${Security.escapeHTML(vac.reason)}</span>` : ''}
                                        </div>
                                        <button class="btn btn-ghost btn-sm" onclick="Schedule.removeVacation('${vac.id}')">
                                            <i data-lucide="x"></i>
                                        </button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // ── Actions ──
    async function toggleDay(day, enabled) {
        const config = Storage.getScheduleConfig();
        config.workDays[day] = enabled;
        await Storage.updateScheduleConfig(config);
        App.renderPage();
    }

    async function updateHours() {
        const config = Storage.getScheduleConfig();
        // Use first active day's hours as default
        const firstActiveDay = dayOrder.find(d => config.workDays[d]);
        if (firstActiveDay) {
            const startEl = document.getElementById(`start_${firstActiveDay}`);
            const endEl = document.getElementById(`end_${firstActiveDay}`);
            if (startEl && endEl) {
                config.hours.start = startEl.value;
                config.hours.end = endEl.value;
            }
        }
        await Storage.updateScheduleConfig(config);
        App.showToast('success', t('Guardado'), t('Horarios actualizados'));
    }

    async function updateSlotDuration(value) {
        await Storage.updateScheduleConfig({ slotDuration: parseInt(value) });
        App.showToast('success', t('Guardado'), t('Duración de slots actualizada'));
    }

    function showAddBlockModal() {
        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">${t('Añadir bloqueo')}</h3>
                <button class="modal-close" onclick="App.closeModal()" aria-label="${t('Cerrar')}">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="blockForm" onsubmit="Schedule.saveBlock(event)">
                    <div class="form-group">
                        <label class="form-label" for="blockDate">${t('Fecha')}</label>
                        <input type="date" id="blockDate" class="form-input" required
                            min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="blockReason">${t('Motivo (opcional)')}</label>
                        <input type="text" id="blockReason" class="form-input" placeholder="${t('Ej: Reunión, formación...')}">
                    </div>
                    <div class="modal-footer" style="padding: var(--space-md) 0 0; border-top: none;">
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('Cancelar')}</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="lock"></i> ${t('Bloquear día')}
                        </button>
                    </div>
                </form>
            </div>
        `);
    }

    async function saveBlock(e) {
        e.preventDefault();
        const date = document.getElementById('blockDate').value;
        const reason = Security.sanitizeString(document.getElementById('blockReason').value, 150);

        if (!Security.validateDate(date)) {
            App.showToast('error', t('Error'), t('Fecha no válida'));
            return;
        }

        await Storage.addBlock({ date, reason });
        App.closeModal();
        App.showToast('success', t('Bloqueado'), t('El día {date} ha sido bloqueado', { date: _formatDate(date) }));
        App.renderPage();
    }

    async function removeBlock(blockId) {
        await Storage.removeBlock(blockId);
        App.showToast('info', t('Eliminado'), t('El bloqueo ha sido eliminado'));
        App.renderPage();
    }

    function showAddVacationModal() {
        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">${t('Añadir vacaciones')}</h3>
                <button class="modal-close" onclick="App.closeModal()" aria-label="${t('Cerrar')}">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="vacationForm" onsubmit="Schedule.saveVacation(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                        <div class="form-group">
                            <label class="form-label" for="vacStart">${t('Fecha inicio')}</label>
                            <input type="date" id="vacStart" class="form-input" required
                                min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="vacEnd">${t('Fecha fin')}</label>
                            <input type="date" id="vacEnd" class="form-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="vacReason">${t('Motivo (opcional)')}</label>
                        <input type="text" id="vacReason" class="form-input" placeholder="${t('Ej: Vacaciones de verano')}">
                    </div>
                    <div class="modal-footer" style="padding: var(--space-md) 0 0; border-top: none;">
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">${t('Cancelar')}</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="palmtree"></i> ${t('Guardar vacaciones')}
                        </button>
                    </div>
                </form>
            </div>
        `);
    }

    async function saveVacation(e) {
        e.preventDefault();
        const startDate = document.getElementById('vacStart').value;
        const endDate = document.getElementById('vacEnd').value;
        const reason = Security.sanitizeString(document.getElementById('vacReason').value, 150);

        if (endDate < startDate) {
            App.showToast('error', t('Error'), t('La fecha de fin debe ser posterior a la de inicio'));
            return;
        }

        await Storage.addVacation({ startDate, endDate, reason });
        App.closeModal();
        App.showToast('success', t('Guardado'), t('Las vacaciones han sido registradas'));
        App.renderPage();
    }

    async function removeVacation(vacationId) {
        await Storage.removeVacation(vacationId);
        App.showToast('info', t('Eliminado'), t('Las vacaciones han sido eliminadas'));
        App.renderPage();
    }

    // ── Helpers ──
    function _formatDate(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].map(t);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    // ── Public API ──
    return {
        render,
        toggleDay,
        updateHours,
        updateSlotDuration,
        showAddBlockModal,
        saveBlock,
        removeBlock,
        showAddVacationModal,
        saveVacation,
        removeVacation
    };
})();

window.Schedule = Schedule;
