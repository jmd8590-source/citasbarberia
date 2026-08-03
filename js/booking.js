/* =============================================
   booking.js — Booking Flow Module
   ============================================= */

const Booking = (() => {
    let state = {
        step: 1,
        selectedService: null,
        selectedDate: null,
        selectedTime: null,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear()
    };

    function resetState() {
        state = {
            step: 1,
            selectedService: null,
            selectedDate: null,
            selectedTime: null,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear()
        };
    }

    // ── Main Render ──
    function render() {
        resetState();
        return `
        <div class="booking-container animate-fade-in-up">
            <div class="page-header text-center">
                <h1 class="page-title">Reservar cita</h1>
                <p class="page-subtitle">Selecciona tu servicio, fecha y hora</p>
            </div>
            ${_renderProgressBar()}
            <div id="bookingStepContent">
                ${_renderStep1()}
            </div>
        </div>
        `;
    }

    // ── Progress Bar ──
    function _renderProgressBar() {
        return `
        <div class="progress-bar" id="bookingProgress">
            <div class="progress-step ${state.step >= 1 ? 'active' : ''} ${state.step > 1 ? 'completed' : ''}">
                <div class="progress-step-number">${state.step > 1 ? '✓' : '1'}</div>
                <span class="progress-step-label">Servicio</span>
            </div>
            <div class="progress-line ${state.step > 1 ? 'completed' : ''}"></div>
            <div class="progress-step ${state.step >= 2 ? 'active' : ''} ${state.step > 2 ? 'completed' : ''}">
                <div class="progress-step-number">${state.step > 2 ? '✓' : '2'}</div>
                <span class="progress-step-label">Fecha y hora</span>
            </div>
            <div class="progress-line ${state.step > 2 ? 'completed' : ''}"></div>
            <div class="progress-step ${state.step >= 3 ? 'active' : ''}">
                <div class="progress-step-number">3</div>
                <span class="progress-step-label">Confirmar</span>
            </div>
        </div>
        `;
    }

    // ── Step 1: Select Service ──
    function _renderStep1() {
        const services = Storage.Services.getActive();
        const iconMap = {
            'scissors': 'scissors',
            'pen-tool': 'pen-tool',
            'star': 'star'
        };

        return `
        <div class="booking-step">
            <h3 style="margin-bottom: var(--space-lg);">¿Qué servicio necesitas?</h3>
            <div class="service-grid">
                ${services.map(service => `
                    <div class="service-card ${state.selectedService === service.id ? 'selected' : ''}"
                         onclick="Booking.selectService('${service.id}')">
                        <div class="service-icon">
                            <i data-lucide="${iconMap[service.icon] || 'scissors'}"></i>
                        </div>
                        <div class="service-info">
                            <div class="service-name">${Security.escapeHTML(service.name)}</div>
                            <div class="service-description">${Security.escapeHTML(service.description)}</div>
                            <div class="service-meta">
                                <span><i data-lucide="clock"></i> ${service.duration} min</span>
                            </div>
                        </div>
                        <div class="service-price">${service.price}€</div>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: var(--space-xl);">
                <button class="btn btn-primary btn-lg" id="btnStep1Next"
                    onclick="Booking.goToStep(2)" ${!state.selectedService ? 'disabled style="opacity:0.5; pointer-events:none;"' : ''}>
                    Continuar
                    <i data-lucide="arrow-right"></i>
                </button>
            </div>
        </div>
        `;
    }

    // ── Step 2: Select Date & Time ──
    function _renderStep2() {
        return `
        <div class="booking-step">
            <h3 style="margin-bottom: var(--space-lg);">Elige fecha y hora</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
                <div>
                    ${_renderCalendar()}
                </div>
                <div>
                    ${_renderTimeSlots()}
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: var(--space-xl);">
                <button class="btn btn-secondary btn-lg" onclick="Booking.goToStep(1)">
                    <i data-lucide="arrow-left"></i>
                    Atrás
                </button>
                <button class="btn btn-primary btn-lg" id="btnStep2Next"
                    onclick="Booking.goToStep(3)" ${!state.selectedDate || !state.selectedTime ? 'disabled style="opacity:0.5; pointer-events:none;"' : ''}>
                    Continuar
                    <i data-lucide="arrow-right"></i>
                </button>
            </div>
        </div>
        `;
    }

    // ── Calendar ──
    function _renderCalendar() {
        const year = state.currentYear;
        const month = state.currentMonth;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay(); // 0=Sun

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

        let days = '';

        // Weekday headers
        weekDays.forEach(d => {
            days += `<div class="calendar-weekday">${d}</div>`;
        });

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            days += '<div class="calendar-day empty"></div>';
        }

        // Days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(year, month, d);
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === state.selectedDate;
            const isBlocked = Storage.isDateBlocked(dateStr);
            const isDisabled = isPast || isBlocked;

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (isDisabled) classes += ' disabled';

            days += `<div class="${classes}" ${!isDisabled ? `onclick="Booking.selectDate('${dateStr}')"` : ''}>
                ${d}
            </div>`;
        }

        const canGoPrev = month > today.getMonth() || year > today.getFullYear();

        return `
        <div class="calendar-container">
            <div class="calendar-header">
                <button class="btn btn-ghost btn-icon btn-sm" ${!canGoPrev ? 'disabled style="opacity:0.3"' : ''}
                    onclick="Booking.changeMonth(-1)">
                    <i data-lucide="chevron-left"></i>
                </button>
                <span class="calendar-month">${monthNames[month]} ${year}</span>
                <button class="btn btn-ghost btn-icon btn-sm" onclick="Booking.changeMonth(1)">
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
                ${days}
            </div>
        </div>
        `;
    }

    // ── Time Slots ──
    function _renderTimeSlots() {
        if (!state.selectedDate) {
            return `
            <div class="time-slots-container">
                <div class="time-slots-title">
                    <i data-lucide="clock"></i>
                    Horarios disponibles
                </div>
                <div class="empty-state" style="padding: var(--space-xl);">
                    <i data-lucide="calendar" style="width:40px; height:40px; color: var(--text-muted); margin-bottom: var(--space-md);"></i>
                    <p style="color: var(--text-muted); font-size: var(--fs-sm);">Selecciona una fecha para ver los horarios</p>
                </div>
            </div>
            `;
        }

        const service = Storage.Services.getById(state.selectedService);
        const slots = Storage.getAvailableSlots(state.selectedDate, service ? service.duration : 30);

        // Group slots by period
        const morning = slots.filter(s => { const h = parseInt(s.split(':')[0]); return h < 13; });
        const afternoon = slots.filter(s => { const h = parseInt(s.split(':')[0]); return h >= 13; });

        if (slots.length === 0) {
            return `
            <div class="time-slots-container">
                <div class="time-slots-title">
                    <i data-lucide="clock"></i>
                    Horarios disponibles
                </div>
                <div class="empty-state" style="padding: var(--space-xl);">
                    <i data-lucide="calendar-x" style="width:40px; height:40px; color: var(--text-muted); margin-bottom: var(--space-md);"></i>
                    <p style="color: var(--text-muted); font-size: var(--fs-sm);">No hay horarios disponibles este día</p>
                </div>
            </div>
            `;
        }

        let slotsHTML = '';

        if (morning.length > 0) {
            slotsHTML += `<div style="margin-bottom: var(--space-md);">
                <div style="font-size: var(--fs-xs); color: var(--text-muted); margin-bottom: var(--space-sm); font-weight: 600;">MAÑANA</div>
                <div class="time-slots-grid">
                    ${morning.map(slot => `
                        <div class="time-slot ${state.selectedTime === slot ? 'selected' : ''}"
                             onclick="Booking.selectTime('${slot}')">
                            ${slot}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        if (afternoon.length > 0) {
            slotsHTML += `<div>
                <div style="font-size: var(--fs-xs); color: var(--text-muted); margin-bottom: var(--space-sm); font-weight: 600;">TARDE</div>
                <div class="time-slots-grid">
                    ${afternoon.map(slot => `
                        <div class="time-slot ${state.selectedTime === slot ? 'selected' : ''}"
                             onclick="Booking.selectTime('${slot}')">
                            ${slot}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        return `
        <div class="time-slots-container">
            <div class="time-slots-title">
                <i data-lucide="clock"></i>
                Horarios disponibles
                <span class="badge badge-accent" style="margin-left: auto;">${slots.length} disponibles</span>
            </div>
            ${slotsHTML}
        </div>
        `;
    }

    // ── Step 3: Confirmation ──
    function _renderStep3() {
        const service = Storage.Services.getById(state.selectedService);
        const dateObj = new Date(state.selectedDate + 'T12:00:00');
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        const dateFormatted = `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} de ${monthNames[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

        return `
        <div class="booking-step">
            <h3 style="margin-bottom: var(--space-lg);">Confirma tu reserva</h3>
            <div class="booking-summary">
                <div class="booking-summary-row">
                    <span class="booking-summary-label">Servicio</span>
                    <span class="booking-summary-value">${Security.escapeHTML(service.name)}</span>
                </div>
                <div class="booking-summary-row">
                    <span class="booking-summary-label">Duración</span>
                    <span class="booking-summary-value">${service.duration} minutos</span>
                </div>
                <div class="booking-summary-row">
                    <span class="booking-summary-label">Fecha</span>
                    <span class="booking-summary-value">${dateFormatted}</span>
                </div>
                <div class="booking-summary-row">
                    <span class="booking-summary-label">Hora</span>
                    <span class="booking-summary-value">${state.selectedTime} h</span>
                </div>
                <div class="booking-summary-row" style="padding-top: var(--space-lg);">
                    <span class="booking-summary-label" style="font-size: var(--fs-md); font-weight: 600;">Total</span>
                    <span class="booking-summary-value" style="font-size: var(--fs-xl); color: var(--accent);">${service.price}€</span>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: var(--space-xl);">
                <button class="btn btn-secondary btn-lg" onclick="Booking.goToStep(2)">
                    <i data-lucide="arrow-left"></i>
                    Atrás
                </button>
                <button class="btn btn-primary btn-xl" onclick="Booking.confirmBooking()">
                    <i data-lucide="check-circle"></i>
                    Confirmar reserva
                </button>
            </div>
        </div>
        `;
    }

    // ── Success Screen ──
    function _renderSuccess() {
        return `
        <div class="booking-success">
            <div class="booking-success-icon">
                <i data-lucide="check"></i>
            </div>
            <h2 style="margin-bottom: var(--space-sm);">¡Reserva confirmada!</h2>
            <p style="color: var(--text-secondary); margin-bottom: var(--space-xl);">
                Tu cita ha sido reservada correctamente. Te esperamos.
            </p>
            <div style="display: flex; gap: var(--space-md); justify-content: center;">
                <button class="btn btn-secondary btn-lg" onclick="App.navigate('history')">
                    <i data-lucide="list"></i>
                    Ver mis citas
                </button>
                <button class="btn btn-primary btn-lg" onclick="App.navigate('home')">
                    <i data-lucide="home"></i>
                    Ir al inicio
                </button>
            </div>
        </div>
        `;
    }

    // ── Actions ──
    function selectService(serviceId) {
        state.selectedService = serviceId;
        _updateStepContent();
    }

    function selectDate(dateStr) {
        state.selectedDate = dateStr;
        state.selectedTime = null; // Reset time when date changes
        _updateStepContent();
    }

    function selectTime(time) {
        state.selectedTime = time;
        _updateStepContent();
    }

    function changeMonth(delta) {
        state.currentMonth += delta;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        } else if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        state.selectedDate = null;
        state.selectedTime = null;
        _updateStepContent();
    }

    function goToStep(step) {
        if (step === 2 && !state.selectedService) return;
        if (step === 3 && (!state.selectedDate || !state.selectedTime)) return;
        state.step = step;

        // Update progress bar
        const progressEl = document.getElementById('bookingProgress');
        if (progressEl) {
            progressEl.outerHTML = _renderProgressBar();
        }

        _updateStepContent();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function confirmBooking() {
        const user = Storage.Session.getCurrentUser();
        if (!user) {
            App.showToast('error', 'Error', 'Debes iniciar sesión');
            App.navigate('login');
            return;
        }

        // Double-check availability
        const service = Storage.Services.getById(state.selectedService);
        const availableSlots = Storage.getAvailableSlots(state.selectedDate, service.duration);
        if (!availableSlots.includes(state.selectedTime)) {
            App.showToast('error', 'No disponible', 'Este horario ya ha sido reservado. Por favor, elige otro.');
            goToStep(2);
            return;
        }

        // Create appointment
        Storage.Appointments.create({
            userId: user.id,
            serviceId: state.selectedService,
            date: state.selectedDate,
            time: state.selectedTime,
            notes: ''
        });

        App.showToast('success', '¡Reserva confirmada!', 'Tu cita ha sido creada correctamente');

        // Show success screen
        const content = document.getElementById('bookingStepContent');
        if (content) {
            content.innerHTML = _renderSuccess();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    function _updateStepContent() {
        const content = document.getElementById('bookingStepContent');
        if (!content) return;

        switch (state.step) {
            case 1: content.innerHTML = _renderStep1(); break;
            case 2: content.innerHTML = _renderStep2(); break;
            case 3: content.innerHTML = _renderStep3(); break;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ── Public API ──
    return {
        render,
        selectService,
        selectDate,
        selectTime,
        changeMonth,
        goToStep,
        confirmBooking
    };
})();
