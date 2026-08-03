/* =============================================
   schedule.js — Schedule Configuration (Admin)
   ============================================= */

const Schedule = (() => {
    const dayNames = {
        mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves',
        fri: 'Viernes', sat: 'Sábado', sun: 'Domingo'
    };
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    // ── Main Render ──
    function render() {
        const config = Storage.getScheduleConfig();

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">Horarios</h1>
                <p class="page-subtitle">Configura tu disponibilidad y bloqueos</p>
            </div>

            <div class="schedule-config">
                <!-- Left: Work Days & Hours -->
                <div>
                    <div class="schedule-days">
                        <div class="card-header">
                            <h3 class="card-title">Días laborables</h3>
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
                            <h3 class="card-title">Duración de slots</h3>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <select class="form-select" id="slotDuration" value="${config.slotDuration}"
                                onchange="Schedule.updateSlotDuration(this.value)">
                                <option value="15" ${config.slotDuration === 15 ? 'selected' : ''}>15 minutos</option>
                                <option value="20" ${config.slotDuration === 20 ? 'selected' : ''}>20 minutos</option>
                                <option value="30" ${config.slotDuration === 30 ? 'selected' : ''}>30 minutos</option>
                                <option value="45" ${config.slotDuration === 45 ? 'selected' : ''}>45 minutos</option>
                                <option value="60" ${config.slotDuration === 60 ? 'selected' : ''}>60 minutos</option>
                            </select>
                            <span class="form-hint">Intervalo mínimo entre citas</span>
                        </div>
                    </div>
                </div>

                <!-- Right: Blocks & Vacations -->
                <div>
                    <!-- Blocks -->
                    <div class="schedule-blocks">
                        <div class="card-header">
                            <h3 class="card-title">Bloqueos puntuales</h3>
                            <button class="btn btn-ghost btn-sm" onclick="Schedule.showAddBlockModal()">
                                <i data-lucide="plus"></i> Añadir
                            </button>
                        </div>
                        <p class="text-secondary" style="font-size: var(--fs-sm); margin-bottom: var(--space-md);">
                            Días específicos en los que no aceptas citas
                        </p>
                        <div class="block-list" id="blockList">
                            ${(config.blocks || []).length === 0
                                ? '<p class="text-muted" style="font-size: var(--fs-sm); text-align: center; padding: var(--space-md);">No hay bloqueos configurados</p>'
                                : (config.blocks || []).map(block => `
                                    <div class="block-item">
                                        <div class="block-item-info">
                                            <span class="block-item-date">${_formatDate(block.date)}</span>
                                            ${block.reason ? `<span class="block-item-reason">— ${block.reason}</span>` : ''}
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
                            <h3 class="card-title">Vacaciones</h3>
                            <button class="btn btn-ghost btn-sm" onclick="Schedule.showAddVacationModal()">
                                <i data-lucide="plus"></i> Añadir
                            </button>
                        </div>
                        <p class="text-secondary" style="font-size: var(--fs-sm); margin-bottom: var(--space-md);">
                            Periodos de vacaciones en los que cierras
                        </p>
                        <div class="block-list" id="vacationList">
                            ${(config.vacations || []).length === 0
                                ? '<p class="text-muted" style="font-size: var(--fs-sm); text-align: center; padding: var(--space-md);">No hay vacaciones configuradas</p>'
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
    function toggleDay(day, enabled) {
        const config = Storage.getScheduleConfig();
        config.workDays[day] = enabled;
        Storage.updateScheduleConfig(config);
        App.renderPage();
    }

    function updateHours() {
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
        Storage.updateScheduleConfig(config);
        App.showToast('success', 'Guardado', 'Horarios actualizados');
    }

    function updateSlotDuration(value) {
        Storage.updateScheduleConfig({ slotDuration: parseInt(value) });
        App.showToast('success', 'Guardado', 'Duración de slots actualizada');
    }

    function showAddBlockModal() {
        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">Añadir bloqueo</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="blockForm" onsubmit="Schedule.saveBlock(event)">
                    <div class="form-group">
                        <label class="form-label">Fecha</label>
                        <input type="date" id="blockDate" class="form-input" required
                            min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Motivo (opcional)</label>
                        <input type="text" id="blockReason" class="form-input" placeholder="Ej: Reunión, formación...">
                    </div>
                    <div class="modal-footer" style="padding: var(--space-md) 0 0; border-top: none;">
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="lock"></i> Bloquear día
                        </button>
                    </div>
                </form>
            </div>
        `);
    }

    function saveBlock(e) {
        e.preventDefault();
        const date = document.getElementById('blockDate').value;
        const reason = Security.sanitizeString(document.getElementById('blockReason').value, 150);

        if (!Security.validateDate(date)) {
            App.showToast('error', 'Error', 'Fecha no válida');
            return;
        }

        Storage.addBlock({ date, reason });
        App.closeModal();
        App.showToast('success', 'Bloqueado', `El día ${_formatDate(date)} ha sido bloqueado`);
        App.renderPage();
    }

    function removeBlock(blockId) {
        Storage.removeBlock(blockId);
        App.showToast('info', 'Eliminado', 'El bloqueo ha sido eliminado');
        App.renderPage();
    }

    function showAddVacationModal() {
        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">Añadir vacaciones</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="vacationForm" onsubmit="Schedule.saveVacation(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                        <div class="form-group">
                            <label class="form-label">Fecha inicio</label>
                            <input type="date" id="vacStart" class="form-input" required
                                min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha fin</label>
                            <input type="date" id="vacEnd" class="form-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Motivo (opcional)</label>
                        <input type="text" id="vacReason" class="form-input" placeholder="Ej: Vacaciones de verano">
                    </div>
                    <div class="modal-footer" style="padding: var(--space-md) 0 0; border-top: none;">
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="palmtree"></i> Guardar vacaciones
                        </button>
                    </div>
                </form>
            </div>
        `);
    }

    function saveVacation(e) {
        e.preventDefault();
        const startDate = document.getElementById('vacStart').value;
        const endDate = document.getElementById('vacEnd').value;
        const reason = Security.sanitizeString(document.getElementById('vacReason').value, 150);

        if (endDate < startDate) {
            App.showToast('error', 'Error', 'La fecha de fin debe ser posterior a la de inicio');
            return;
        }

        Storage.addVacation({ startDate, endDate, reason });
        App.closeModal();
        App.showToast('success', 'Guardado', 'Las vacaciones han sido registradas');
        App.renderPage();
    }

    function removeVacation(vacationId) {
        Storage.removeVacation(vacationId);
        App.showToast('info', 'Eliminado', 'Las vacaciones han sido eliminadas');
        App.renderPage();
    }

    // ── Helpers ──
    function _formatDate(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
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
