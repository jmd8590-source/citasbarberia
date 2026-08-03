/* =============================================
   admin.js — Admin Panel Module
   ============================================= */

const Admin = (() => {
    let agendaDate = new Date().toISOString().split('T')[0];
    let agendaMonth = new Date().getMonth();
    let agendaYear = new Date().getFullYear();
    let agendaView = 'day'; // 'day' or 'month'
    let clientSearch = '';

    // ── Dashboard ──
    function renderDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const allAppts = Storage.Appointments.getAll().filter(a => a.status !== 'cancelled');
        const todayAppts = allAppts.filter(a => a.date === today && a.status === 'pending')
            .sort((a, b) => a.time.localeCompare(b.time));
        const clients = Storage.Users.getClients();

        // Week dates
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        const weekAppts = allAppts.filter(a => a.date >= weekStartStr && a.date <= weekEndStr);

        // Revenue this month
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const monthAppts = allAppts.filter(a => a.date >= monthStart && a.status === 'completed');
        let monthRevenue = 0;
        monthAppts.forEach(a => {
            const svc = Storage.Services.getById(a.serviceId);
            if (svc) monthRevenue += svc.price;
        });

        // Chart data (appointments per day this week)
        const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        weekAppts.forEach(a => {
            const d = new Date(a.date + 'T12:00:00');
            const dayIndex = (d.getDay() + 6) % 7; // Mon=0
            dayCounts[dayIndex]++;
        });
        const maxCount = Math.max(...dayCounts, 1);

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">Dashboard</h1>
                <p class="page-subtitle">Resumen de tu barbería</p>
            </div>

            <!-- Stats -->
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon stat-icon-accent">
                        <i data-lucide="calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${todayAppts.length}</div>
                        <div class="stat-label">Citas hoy</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon-info">
                        <i data-lucide="calendar-range"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${weekAppts.length}</div>
                        <div class="stat-label">Esta semana</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon-success">
                        <i data-lucide="users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${clients.length}</div>
                        <div class="stat-label">Clientes</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon-warning">
                        <i data-lucide="euro"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${monthRevenue}€</div>
                        <div class="stat-label">Ingresos mes</div>
                    </div>
                </div>
            </div>

            <!-- Charts & Today -->
            <div class="dashboard-charts">
                <div class="chart-card">
                    <div class="chart-title">Citas esta semana</div>
                    <div class="bar-chart">
                        ${dayLabels.map((label, i) => `
                            <div class="bar-chart-item">
                                <div class="bar-chart-value">${dayCounts[i]}</div>
                                <div class="bar-chart-bar" style="height: ${Math.max((dayCounts[i] / maxCount) * 100, 4)}%;"></div>
                                <div class="bar-chart-label">${label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="today-appointments">
                    <div class="chart-title">
                        Hoy, ${_formatDateFull(today)}
                    </div>
                    ${todayAppts.length === 0
                        ? '<p class="text-muted" style="text-align:center; padding: var(--space-xl); font-size: var(--fs-sm);">No hay citas programadas para hoy</p>'
                        : todayAppts.map(appt => {
                            const svc = Storage.Services.getById(appt.serviceId);
                            const user = Storage.Users.getById(appt.userId);
                            return `
                            <div class="today-appointment-item" onclick="Admin.viewAppointment('${appt.id}')">
                                <div class="today-appointment-time">${appt.time}</div>
                                <div class="today-appointment-info">
                                    <h4>${user ? user.name : 'Cliente'}</h4>
                                    <p>${svc ? svc.name : 'Servicio'}</p>
                                </div>
                                <span class="badge badge-warning">Pendiente</span>
                            </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>

            <!-- Quick Actions -->
            <div style="display: flex; gap: var(--space-md); flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="App.navigate('agenda')">
                    <i data-lucide="calendar"></i> Ver agenda completa
                </button>
                <button class="btn btn-secondary" onclick="App.navigate('admin-services')">
                    <i data-lucide="scissors"></i> Gestionar servicios
                </button>
                <button class="btn btn-secondary" onclick="App.navigate('schedule')">
                    <i data-lucide="clock"></i> Configurar horarios
                </button>
            </div>
        </div>
        `;
    }

    // ── Agenda ──
    function renderAgenda() {
        return `
        <div class="animate-fade-in-up">
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h1 class="page-title">Agenda</h1>
                    <p class="page-subtitle">Gestiona todas las citas</p>
                </div>
                <div class="agenda-view-toggle">
                    <button class="btn ${agendaView === 'day' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                        onclick="Admin.setAgendaView('day')">
                        <i data-lucide="list"></i> Día
                    </button>
                    <button class="btn ${agendaView === 'month' ? 'btn-primary' : 'btn-secondary'} btn-sm"
                        onclick="Admin.setAgendaView('month')">
                        <i data-lucide="grid-3x3"></i> Mes
                    </button>
                </div>
            </div>

            ${agendaView === 'day' ? _renderAgendaDayView() : _renderAgendaMonthView()}
        </div>
        `;
    }

    function _renderAgendaDayView() {
        const config = Storage.getScheduleConfig();
        const startMin = Storage._timeToMinutes(config.hours.start);
        const endMin = Storage._timeToMinutes(config.hours.end);
        const slotDuration = config.slotDuration || 30;

        const dayAppts = Storage.Appointments.getByDate(agendaDate)
            .filter(a => a.status !== 'cancelled');

        const slots = [];
        for (let min = startMin; min < endMin; min += slotDuration) {
            const time = Storage._minutesToTime(min);
            const appt = dayAppts.find(a => a.time === time);
            slots.push({ time, appointment: appt || null });
        }

        return `
        <div>
            <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
                <button class="btn btn-ghost btn-icon btn-sm" onclick="Admin.changeAgendaDay(-1)">
                    <i data-lucide="chevron-left"></i>
                </button>
                <h3 style="min-width: 200px; text-align: center;">${_formatDateFull(agendaDate)}</h3>
                <button class="btn btn-ghost btn-icon btn-sm" onclick="Admin.changeAgendaDay(1)">
                    <i data-lucide="chevron-right"></i>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="Admin.goToToday()" style="margin-left: var(--space-sm);">
                    Hoy
                </button>
            </div>

            ${Storage.isDateBlocked(agendaDate) 
                ? `<div class="card text-center" style="padding: var(--space-2xl);">
                    <i data-lucide="lock" style="width:48px; height:48px; color: var(--text-muted); margin: 0 auto var(--space-md);"></i>
                    <h3 style="color: var(--text-secondary);">Día bloqueado</h3>
                    <p class="text-muted">Este día no está disponible para citas</p>
                </div>`
                : `<div class="agenda-day-view">
                    ${slots.map(slot => {
                        if (slot.appointment) {
                            const svc = Storage.Services.getById(slot.appointment.serviceId);
                            const user = Storage.Users.getById(slot.appointment.userId);
                            return `
                            <div class="agenda-slot">
                                <div class="agenda-slot-time">${slot.time}</div>
                                <div class="agenda-slot-content" onclick="Admin.viewAppointment('${slot.appointment.id}')">
                                    <div class="agenda-slot-appointment">
                                        <h4>${user ? user.name : 'Cliente'}</h4>
                                        <p>${svc ? `${svc.name} · ${svc.duration} min` : ''}</p>
                                    </div>
                                </div>
                            </div>`;
                        }
                        return `
                        <div class="agenda-slot">
                            <div class="agenda-slot-time">${slot.time}</div>
                            <div class="agenda-slot-content">
                                <span class="text-muted" style="font-size: var(--fs-xs);">Disponible</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`
            }
        </div>
        `;
    }

    function _renderAgendaMonthView() {
        const year = agendaYear;
        const month = agendaMonth;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

        // Get all appointments for this month
        const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay.getDate()}`;
        const monthAppts = Storage.Appointments.getByDateRange(monthStart, monthEnd)
            .filter(a => a.status !== 'cancelled');

        // Count per day
        const apptsByDay = {};
        monthAppts.forEach(a => {
            apptsByDay[a.date] = (apptsByDay[a.date] || 0) + 1;
        });

        let days = '';
        weekDays.forEach(d => {
            days += `<div class="calendar-weekday">${d}</div>`;
        });
        for (let i = 0; i < startDay; i++) {
            days += '<div class="calendar-day empty"></div>';
        }
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const count = apptsByDay[dateStr] || 0;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isBlocked = Storage.isDateBlocked(dateStr);

            days += `<div class="calendar-day ${isToday ? 'today' : ''} ${isBlocked ? 'disabled' : ''} ${count > 0 ? 'has-appointments' : ''}"
                style="cursor: pointer; flex-direction: column;" 
                onclick="Admin.goToAgendaDay('${dateStr}')">
                <span>${d}</span>
                ${count > 0 ? `<span style="font-size: 9px; color: var(--accent); font-weight: 600;">${count}</span>` : ''}
            </div>`;
        }

        return `
        <div>
            <div class="calendar-container" style="max-width: 500px;">
                <div class="calendar-header">
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="Admin.changeAgendaMonth(-1)">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="calendar-month">${monthNames[month]} ${year}</span>
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="Admin.changeAgendaMonth(1)">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>
                <div class="calendar-grid">
                    ${days}
                </div>
            </div>
        </div>
        `;
    }

    // ── Clients ──
    function renderClients() {
        let clients = Storage.Users.getClients();

        if (clientSearch) {
            const q = clientSearch.toLowerCase();
            clients = clients.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                (c.phone && c.phone.includes(q))
            );
        }

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">Clientes</h1>
                <p class="page-subtitle">${Storage.Users.getClients().length} clientes registrados</p>
            </div>

            <div class="clients-search">
                <div class="form-input-icon">
                    <input type="text" class="form-input" placeholder="Buscar por nombre, email o teléfono..."
                        value="${clientSearch}" oninput="Admin.searchClients(this.value)">
                    <i data-lucide="search"></i>
                </div>
            </div>

            <div id="clientsList">
                ${clients.length === 0
                    ? `<div class="empty-state">
                        <i data-lucide="users"></i>
                        <h3>No hay clientes</h3>
                        <p>${clientSearch ? 'No se encontraron resultados' : 'Los clientes aparecerán aquí al registrarse'}</p>
                    </div>`
                    : clients.map(client => {
                        const appts = Storage.Appointments.getByUser(client.id);
                        const completed = appts.filter(a => a.status === 'completed').length;
                        const lastAppt = appts.filter(a => a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date))[0];
                        return `
                        <div class="client-list-item" onclick="Admin.viewClient('${client.id}')">
                            <div class="avatar">
                                ${client.avatar ? `<img src="${client.avatar}" alt="">` : _getInitials(client.name)}
                            </div>
                            <div class="client-info">
                                <h4>${client.name}</h4>
                                <p>${client.email} ${client.phone ? `· ${client.phone}` : ''}</p>
                            </div>
                            <div class="client-meta">
                                <div class="visits">${completed} visita${completed !== 1 ? 's' : ''}</div>
                                <div class="last-visit">${lastAppt ? `Última: ${_formatDateShort(lastAppt.date)}` : 'Sin visitas'}</div>
                            </div>
                        </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
        `;
    }

    // ── Settings ──
    function renderSettings() {
        const settings = Storage.Settings.get();

        return `
        <div class="animate-fade-in-up">
            <div class="page-header">
                <h1 class="page-title">Ajustes</h1>
                <p class="page-subtitle">Configuración general de la barbería</p>
            </div>

            <div class="settings-sections">
                <div class="settings-section">
                    <h3>Información de la barbería</h3>
                    <form onsubmit="Admin.saveSettings(event)">
                        <div class="form-group">
                            <label class="form-label">Nombre del negocio</label>
                            <input type="text" id="setShopName" class="form-input" value="${settings.shopName || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <input type="text" id="setAddress" class="form-input" value="${settings.address || ''}">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                            <div class="form-group">
                                <label class="form-label">Teléfono</label>
                                <input type="tel" id="setPhone" class="form-input" value="${settings.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="setEmail" class="form-input" value="${settings.email || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Instagram</label>
                            <input type="text" id="setInstagram" class="form-input" value="${settings.instagram || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Descripción</label>
                            <textarea id="setDescription" class="form-textarea" rows="3">${settings.description || ''}</textarea>
                        </div>
                        <div style="display: flex; justify-content: flex-end;">
                            <button type="submit" class="btn btn-primary">
                                <i data-lucide="save"></i> Guardar cambios
                            </button>
                        </div>
                    </form>
                </div>

                <div class="settings-section">
                    <h3>Datos y mantenimiento</h3>
                    <p class="text-secondary" style="font-size: var(--fs-sm); margin-bottom: var(--space-md);">
                        Acciones sobre los datos almacenados en el navegador.
                    </p>
                    <div style="display: flex; gap: var(--space-md);">
                        <button class="btn btn-danger btn-sm" onclick="Admin.resetAllData()">
                            <i data-lucide="trash-2"></i> Restablecer datos demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // ── Actions ──
    function viewAppointment(apptId) {
        const appt = Storage.Appointments.getById(apptId);
        if (!appt) return;
        const svc = Storage.Services.getById(appt.serviceId);
        const user = Storage.Users.getById(appt.userId);

        const statusLabels = { pending: 'Pendiente', completed: 'Completada', cancelled: 'Cancelada' };
        const statusBadges = { pending: 'badge-warning', completed: 'badge-success', cancelled: 'badge-error' };

        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">Detalle de cita</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
                    <div class="avatar avatar-lg">
                        ${user && user.avatar ? `<img src="${user.avatar}" alt="">` : (user ? _getInitials(user.name) : '?')}
                    </div>
                    <div>
                        <h4>${user ? user.name : 'Cliente desconocido'}</h4>
                        <p class="text-secondary" style="font-size: var(--fs-sm);">${user ? user.email : ''}</p>
                    </div>
                </div>
                <div class="booking-summary" style="border: none; padding: 0;">
                    <div class="booking-summary-row">
                        <span class="booking-summary-label">Servicio</span>
                        <span class="booking-summary-value">${svc ? svc.name : 'N/A'}</span>
                    </div>
                    <div class="booking-summary-row">
                        <span class="booking-summary-label">Fecha</span>
                        <span class="booking-summary-value">${_formatDateFull(appt.date)}</span>
                    </div>
                    <div class="booking-summary-row">
                        <span class="booking-summary-label">Hora</span>
                        <span class="booking-summary-value">${appt.time} h</span>
                    </div>
                    <div class="booking-summary-row">
                        <span class="booking-summary-label">Estado</span>
                        <span class="badge ${statusBadges[appt.status]}">${statusLabels[appt.status]}</span>
                    </div>
                    ${svc ? `
                    <div class="booking-summary-row">
                        <span class="booking-summary-label">Precio</span>
                        <span class="booking-summary-value text-accent">${svc.price}€</span>
                    </div>` : ''}
                </div>
            </div>
            ${appt.status === 'pending' ? `
            <div class="modal-footer">
                <button class="btn btn-danger btn-sm" onclick="Admin.adminCancelAppt('${appt.id}')">
                    <i data-lucide="x"></i> Cancelar
                </button>
                <button class="btn btn-primary btn-sm" onclick="Admin.adminCompleteAppt('${appt.id}')">
                    <i data-lucide="check"></i> Completar
                </button>
            </div>` : ''}
        `);
    }

    function adminCancelAppt(apptId) {
        Storage.Appointments.cancel(apptId);
        App.closeModal();
        App.showToast('info', 'Cancelada', 'La cita ha sido cancelada');
        App.renderPage();
    }

    function adminCompleteAppt(apptId) {
        Storage.Appointments.complete(apptId);
        App.closeModal();
        App.showToast('success', 'Completada', 'La cita ha sido marcada como completada');
        App.renderPage();
    }

    function viewClient(clientId) {
        const client = Storage.Users.getById(clientId);
        if (!client) return;

        const appts = Storage.Appointments.getByUser(clientId)
            .sort((a, b) => b.date.localeCompare(a.date));
        const gallery = Storage.Gallery.getByUser(clientId);

        const statusLabels = { pending: 'Pendiente', completed: 'Completada', cancelled: 'Cancelada' };
        const statusBadges = { pending: 'badge-warning', completed: 'badge-success', cancelled: 'badge-error' };

        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">Perfil del cliente</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: var(--space-lg);">
                    <div class="avatar avatar-xl" style="margin: 0 auto var(--space-md);">
                        ${client.avatar ? `<img src="${client.avatar}" alt="">` : _getInitials(client.name)}
                    </div>
                    <h3>${client.name}</h3>
                    <p class="text-secondary" style="font-size: var(--fs-sm);">${client.email}</p>
                    ${client.phone ? `<p class="text-muted" style="font-size: var(--fs-sm);">${client.phone}</p>` : ''}
                </div>

                <div class="divider"></div>

                <h4 style="margin-bottom: var(--space-md);">Historial de citas (${appts.length})</h4>
                ${appts.length === 0
                    ? '<p class="text-muted" style="font-size: var(--fs-sm);">Sin citas registradas</p>'
                    : `<div style="max-height: 250px; overflow-y: auto;">
                        ${appts.slice(0, 10).map(a => {
                            const svc = Storage.Services.getById(a.serviceId);
                            return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; border-bottom: 1px solid var(--border-color); font-size: var(--fs-sm);">
                                <div>
                                    <span>${_formatDateShort(a.date)}</span>
                                    <span class="text-muted"> — ${svc ? svc.name : 'N/A'} — ${a.time}</span>
                                </div>
                                <span class="badge ${statusBadges[a.status]}">${statusLabels[a.status]}</span>
                            </div>`;
                        }).join('')}
                    </div>`
                }

                ${gallery.length > 0 ? `
                <div class="divider"></div>
                <h4 style="margin-bottom: var(--space-md);">Galería (${gallery.length})</h4>
                <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
                    ${gallery.map(g => `
                        <img src="${g.imageData}" alt="" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `);
    }

    function setAgendaView(view) {
        agendaView = view;
        App.renderPage();
    }

    function changeAgendaDay(delta) {
        const d = new Date(agendaDate + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        agendaDate = d.toISOString().split('T')[0];
        App.renderPage();
    }

    function goToToday() {
        agendaDate = new Date().toISOString().split('T')[0];
        App.renderPage();
    }

    function goToAgendaDay(dateStr) {
        agendaDate = dateStr;
        agendaView = 'day';
        App.renderPage();
    }

    function changeAgendaMonth(delta) {
        agendaMonth += delta;
        if (agendaMonth > 11) { agendaMonth = 0; agendaYear++; }
        if (agendaMonth < 0) { agendaMonth = 11; agendaYear--; }
        App.renderPage();
    }

    function searchClients(query) {
        clientSearch = query;
        // Debounce rendering
        clearTimeout(Admin._searchTimeout);
        Admin._searchTimeout = setTimeout(() => App.renderPage(), 200);
    }

    function saveSettings(e) {
        e.preventDefault();
        Storage.Settings.update({
            shopName: document.getElementById('setShopName').value.trim(),
            address: document.getElementById('setAddress').value.trim(),
            phone: document.getElementById('setPhone').value.trim(),
            email: document.getElementById('setEmail').value.trim(),
            instagram: document.getElementById('setInstagram').value.trim(),
            description: document.getElementById('setDescription').value.trim()
        });
        App.showToast('success', 'Guardado', 'Los ajustes han sido actualizados');
    }

    function resetAllData() {
        App.showModal(`
            <div class="modal-header">
                <h3 class="modal-title">Restablecer datos</h3>
                <button class="modal-close" onclick="App.closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body text-center">
                <div class="confirm-icon confirm-icon-danger" style="margin: 0 auto var(--space-md);">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <h3 style="margin-bottom: var(--space-sm);">¿Restablecer todo?</h3>
                <p class="confirm-message">Se borrarán todos los datos y se cargarán los datos demo. Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer" style="justify-content: center;">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-danger" onclick="Admin.confirmReset()">
                    <i data-lucide="refresh-cw"></i> Restablecer
                </button>
            </div>
        `);
    }

    function confirmReset() {
        localStorage.clear();
        Storage.seedDemoData();
        App.closeModal();
        App.showToast('success', 'Restablecido', 'Los datos han sido restablecidos');
        Storage.Session.clear();
        App.navigate('login');
    }

    // ── Helpers ──
    function _getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    function _formatDateFull(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${dayNames[d.getDay()]}, ${d.getDate()} de ${monthNames[d.getMonth()]}`;
    }

    function _formatDateShort(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    // ── Public API ──
    return {
        renderDashboard,
        renderAgenda,
        renderClients,
        renderSettings,
        viewAppointment,
        adminCancelAppt,
        adminCompleteAppt,
        viewClient,
        setAgendaView,
        changeAgendaDay,
        goToToday,
        goToAgendaDay,
        changeAgendaMonth,
        searchClients,
        saveSettings,
        resetAllData,
        confirmReset,
        _searchTimeout: null
    };
})();
