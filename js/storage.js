/* =============================================
   storage.js — Capa de datos (localStorage)
   ============================================= */

const Storage = (() => {
    // Keys
    const KEYS = {
        USERS: 'bb_users',
        APPOINTMENTS: 'bb_appointments',
        SERVICES: 'bb_services',
        SCHEDULE: 'bb_schedule',
        GALLERY: 'bb_gallery',
        SESSION: 'bb_session',
        SETTINGS: 'bb_settings'
    };

    // ── Helpers ──
    function _get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error reading ${key}:`, e);
            return null;
        }
    }

    function _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error writing ${key}:`, e);
            return false;
        }
    }

    function _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ── Generic CRUD ──
    function getAll(key) {
        return _get(key) || [];
    }

    function getById(key, id) {
        const items = getAll(key);
        return items.find(item => item.id === id) || null;
    }

    function create(key, item) {
        const items = getAll(key);
        const newItem = { ...item, id: _generateId(), createdAt: new Date().toISOString() };
        items.push(newItem);
        _set(key, items);
        return newItem;
    }

    function update(key, id, updates) {
        const items = getAll(key);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;
        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
        _set(key, items);
        return items[index];
    }

    function remove(key, id) {
        const items = getAll(key);
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length === items.length) return false;
        _set(key, filtered);
        return true;
    }

    function query(key, filterFn) {
        return getAll(key).filter(filterFn);
    }

    // ── Users ──
    const Users = {
        getAll: () => getAll(KEYS.USERS),
        getById: (id) => getById(KEYS.USERS, id),
        getByEmail: (email) => getAll(KEYS.USERS).find(u => u.email.toLowerCase() === email.toLowerCase()),
        create: (user) => create(KEYS.USERS, user),
        update: (id, data) => update(KEYS.USERS, id, data),
        remove: (id) => remove(KEYS.USERS, id),
        getClients: () => query(KEYS.USERS, u => u.role === 'client')
    };

    // ── Appointments ──
    const Appointments = {
        getAll: () => getAll(KEYS.APPOINTMENTS),
        getById: (id) => getById(KEYS.APPOINTMENTS, id),
        create: (appt) => create(KEYS.APPOINTMENTS, { ...appt, status: appt.status || 'pending' }),
        update: (id, data) => update(KEYS.APPOINTMENTS, id, data),
        remove: (id) => remove(KEYS.APPOINTMENTS, id),
        getByUser: (userId) => query(KEYS.APPOINTMENTS, a => a.userId === userId),
        getByDate: (date) => query(KEYS.APPOINTMENTS, a => a.date === date),
        getByDateRange: (startDate, endDate) => query(KEYS.APPOINTMENTS, a => a.date >= startDate && a.date <= endDate),
        getPending: () => query(KEYS.APPOINTMENTS, a => a.status === 'pending'),
        getUpcoming: (userId) => {
            const today = new Date().toISOString().split('T')[0];
            return query(KEYS.APPOINTMENTS, a =>
                a.userId === userId && a.date >= today && a.status === 'pending'
            ).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        },
        cancel: (id) => update(KEYS.APPOINTMENTS, id, { status: 'cancelled' }),
        complete: (id) => update(KEYS.APPOINTMENTS, id, { status: 'completed' }),
        isSlotTaken: (date, time, excludeId = null) => {
            return getAll(KEYS.APPOINTMENTS).some(a =>
                a.date === date && a.time === time && a.status !== 'cancelled' && a.id !== excludeId
            );
        },
        getOccupiedSlots: (date) => {
            const appts = query(KEYS.APPOINTMENTS, a => a.date === date && a.status !== 'cancelled');
            const occupied = [];
            appts.forEach(a => {
                const service = Services.getById(a.serviceId);
                if (service) {
                    const startMinutes = _timeToMinutes(a.time);
                    const slots = Math.ceil(service.duration / getScheduleConfig().slotDuration);
                    for (let i = 0; i < slots; i++) {
                        occupied.push(_minutesToTime(startMinutes + i * getScheduleConfig().slotDuration));
                    }
                } else {
                    occupied.push(a.time);
                }
            });
            return occupied;
        }
    };

    // ── Services ──
    const Services = {
        getAll: () => getAll(KEYS.SERVICES),
        getActive: () => query(KEYS.SERVICES, s => s.active !== false),
        getById: (id) => getById(KEYS.SERVICES, id),
        create: (service) => create(KEYS.SERVICES, { ...service, active: true }),
        update: (id, data) => update(KEYS.SERVICES, id, data),
        remove: (id) => remove(KEYS.SERVICES, id),
        toggle: (id) => {
            const service = getById(KEYS.SERVICES, id);
            if (service) return update(KEYS.SERVICES, id, { active: !service.active });
            return null;
        }
    };

    // ── Schedule Config ──
    function getScheduleConfig() {
        return _get(KEYS.SCHEDULE) || _defaultSchedule();
    }

    function updateScheduleConfig(config) {
        const current = getScheduleConfig();
        const updated = { ...current, ...config };
        _set(KEYS.SCHEDULE, updated);
        return updated;
    }

    function addBlock(block) {
        const config = getScheduleConfig();
        config.blocks = config.blocks || [];
        block.id = _generateId();
        config.blocks.push(block);
        _set(KEYS.SCHEDULE, config);
        return block;
    }

    function removeBlock(blockId) {
        const config = getScheduleConfig();
        config.blocks = (config.blocks || []).filter(b => b.id !== blockId);
        _set(KEYS.SCHEDULE, config);
    }

    function addVacation(vacation) {
        const config = getScheduleConfig();
        config.vacations = config.vacations || [];
        vacation.id = _generateId();
        config.vacations.push(vacation);
        _set(KEYS.SCHEDULE, config);
        return vacation;
    }

    function removeVacation(vacationId) {
        const config = getScheduleConfig();
        config.vacations = (config.vacations || []).filter(v => v.id !== vacationId);
        _set(KEYS.SCHEDULE, config);
    }

    function isDateBlocked(dateStr) {
        const config = getScheduleConfig();
        // Check specific blocks
        if ((config.blocks || []).some(b => b.date === dateStr)) return true;
        // Check vacation ranges
        if ((config.vacations || []).some(v => dateStr >= v.startDate && dateStr <= v.endDate)) return true;
        // Check work days
        const dayIndex = new Date(dateStr + 'T12:00:00').getDay(); // 0=Sun, 1=Mon...
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = dayMap[dayIndex];
        if (!config.workDays[dayKey]) return true;
        return false;
    }

    function getAvailableSlots(dateStr, serviceDuration = 30) {
        if (isDateBlocked(dateStr)) return [];
        const config = getScheduleConfig();
        const dayIndex = new Date(dateStr + 'T12:00:00').getDay();
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = dayMap[dayIndex];

        // Get custom hours for this day or default
        const dayHours = config.customHours && config.customHours[dayKey]
            ? config.customHours[dayKey]
            : { start: config.hours.start, end: config.hours.end };

        const startMin = _timeToMinutes(dayHours.start);
        const endMin = _timeToMinutes(dayHours.end);
        const slotDuration = config.slotDuration || 30;
        const slotsNeeded = Math.ceil(serviceDuration / slotDuration);

        const occupiedSlots = Appointments.getOccupiedSlots(dateStr);
        const available = [];

        for (let min = startMin; min + serviceDuration <= endMin; min += slotDuration) {
            const timeStr = _minutesToTime(min);
            // Check if all needed consecutive slots are free
            let allFree = true;
            for (let s = 0; s < slotsNeeded; s++) {
                const checkTime = _minutesToTime(min + s * slotDuration);
                if (occupiedSlots.includes(checkTime)) {
                    allFree = false;
                    break;
                }
            }
            if (allFree) available.push(timeStr);
        }
        return available;
    }

    // ── Gallery ──
    const Gallery = {
        getAll: () => getAll(KEYS.GALLERY),
        getByUser: (userId) => query(KEYS.GALLERY, g => g.userId === userId),
        create: (item) => create(KEYS.GALLERY, item),
        update: (id, data) => update(KEYS.GALLERY, id, data),
        remove: (id) => remove(KEYS.GALLERY, id)
    };

    // ── Session ──
    const Session = {
        get: () => _get(KEYS.SESSION),
        set: (session) => _set(KEYS.SESSION, session),
        clear: () => localStorage.removeItem(KEYS.SESSION),
        isLoggedIn: () => !!_get(KEYS.SESSION),
        getCurrentUser: () => {
            const session = _get(KEYS.SESSION);
            if (!session) return null;
            return Users.getById(session.userId);
        },
        isAdmin: () => {
            const session = _get(KEYS.SESSION);
            if (!session) return false;
            const user = Users.getById(session.userId);
            return user && user.role === 'admin';
        }
    };

    // ── Settings ──
    const Settings = {
        get: () => _get(KEYS.SETTINGS) || _defaultSettings(),
        update: (settings) => {
            const current = Settings.get();
            const updated = { ...current, ...settings };
            _set(KEYS.SETTINGS, updated);
            return updated;
        }
    };

    // ── Time Helpers ──
    function _timeToMinutes(time) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    function _minutesToTime(minutes) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    // ── Default Data ──
    function _defaultSchedule() {
        return {
            workDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
            hours: { start: '09:00', end: '20:00' },
            slotDuration: 30,
            blocks: [],
            vacations: []
        };
    }

    function _defaultSettings() {
        return {
            shopName: 'BarberClub',
            address: 'Calle Principal 42, Madrid',
            phone: '+34 612 345 678',
            email: 'info@barberclub.es',
            instagram: '@barberclub_madrid',
            description: 'Tu barbería de confianza. Estilo, precisión y actitud.'
        };
    }

    // ── Seed Demo Data ──
    function seedDemoData() {
        // Only seed if no users exist
        if (getAll(KEYS.USERS).length > 0) return;

        // Admin user
        const admin = {
            id: 'admin001',
            name: 'Carlos Martínez',
            email: 'admin@barberia.com',
            phone: '+34 600 000 001',
            password: 'admin123',
            role: 'admin',
            avatar: '',
            createdAt: '2026-01-15T10:00:00Z'
        };

        // Demo clients
        const client1 = {
            id: 'client001',
            name: 'Alejandro García',
            email: 'alex@email.com',
            phone: '+34 611 111 111',
            password: '123456',
            role: 'client',
            avatar: '',
            createdAt: '2026-03-10T14:30:00Z'
        };

        const client2 = {
            id: 'client002',
            name: 'Daniel López',
            email: 'daniel@email.com',
            phone: '+34 622 222 222',
            password: '123456',
            role: 'client',
            avatar: '',
            createdAt: '2026-04-05T09:15:00Z'
        };

        const client3 = {
            id: 'client003',
            name: 'Miguel Fernández',
            email: 'miguel@email.com',
            phone: '+34 633 333 333',
            password: '123456',
            role: 'client',
            avatar: '',
            createdAt: '2026-05-20T11:00:00Z'
        };

        _set(KEYS.USERS, [admin, client1, client2, client3]);

        // Services
        const services = [
            {
                id: 'srv001',
                name: 'Corte de cabello',
                description: 'Corte personalizado adaptado a tu estilo. Incluye lavado y peinado.',
                duration: 30,
                price: 12,
                icon: 'scissors',
                active: true,
                createdAt: '2026-01-15T10:00:00Z'
            },
            {
                id: 'srv002',
                name: 'Arreglo de barba',
                description: 'Perfilado y arreglo de barba con navaja. Incluye toalla caliente.',
                duration: 20,
                price: 8,
                icon: 'pen-tool',
                active: true,
                createdAt: '2026-01-15T10:00:00Z'
            },
            {
                id: 'srv003',
                name: 'Corte + Barba',
                description: 'Combo completo: corte de cabello y arreglo de barba. El pack más popular.',
                duration: 45,
                price: 18,
                icon: 'star',
                active: true,
                createdAt: '2026-01-15T10:00:00Z'
            }
        ];
        _set(KEYS.SERVICES, services);

        // Schedule
        _set(KEYS.SCHEDULE, _defaultSchedule());

        // Settings
        _set(KEYS.SETTINGS, _defaultSettings());

        // Demo appointments
        const today = new Date();
        const formatDate = (d) => d.toISOString().split('T')[0];

        // Past appointments
        const pastDate1 = new Date(today);
        pastDate1.setDate(today.getDate() - 14);
        const pastDate2 = new Date(today);
        pastDate2.setDate(today.getDate() - 7);
        const pastDate3 = new Date(today);
        pastDate3.setDate(today.getDate() - 3);

        // Future appointments
        const futureDate1 = new Date(today);
        futureDate1.setDate(today.getDate() + 2);
        const futureDate2 = new Date(today);
        futureDate2.setDate(today.getDate() + 5);

        // Ensure future dates are on work days
        function nextWorkDay(date) {
            const d = new Date(date);
            while (d.getDay() === 0) d.setDate(d.getDate() + 1); // Skip Sunday
            return d;
        }

        const appointments = [
            {
                id: 'appt001',
                userId: 'client001',
                serviceId: 'srv001',
                date: formatDate(pastDate1),
                time: '10:00',
                status: 'completed',
                notes: '',
                createdAt: pastDate1.toISOString()
            },
            {
                id: 'appt002',
                userId: 'client002',
                serviceId: 'srv003',
                date: formatDate(pastDate2),
                time: '11:30',
                status: 'completed',
                notes: '',
                createdAt: pastDate2.toISOString()
            },
            {
                id: 'appt003',
                userId: 'client001',
                serviceId: 'srv002',
                date: formatDate(pastDate3),
                time: '16:00',
                status: 'completed',
                notes: '',
                createdAt: pastDate3.toISOString()
            },
            {
                id: 'appt004',
                userId: 'client001',
                serviceId: 'srv003',
                date: formatDate(nextWorkDay(futureDate1)),
                time: '10:30',
                status: 'pending',
                notes: '',
                createdAt: new Date().toISOString()
            },
            {
                id: 'appt005',
                userId: 'client003',
                serviceId: 'srv001',
                date: formatDate(nextWorkDay(futureDate2)),
                time: '15:00',
                status: 'pending',
                notes: '',
                createdAt: new Date().toISOString()
            },
            {
                id: 'appt006',
                userId: 'client002',
                serviceId: 'srv002',
                date: formatDate(nextWorkDay(futureDate1)),
                time: '12:00',
                status: 'pending',
                notes: '',
                createdAt: new Date().toISOString()
            }
        ];
        _set(KEYS.APPOINTMENTS, appointments);

        console.log('✅ Demo data seeded successfully');
    }

    // ── Public API ──
    return {
        KEYS,
        Users,
        Appointments,
        Services,
        Gallery,
        Session,
        Settings,
        getScheduleConfig,
        updateScheduleConfig,
        addBlock,
        removeBlock,
        addVacation,
        removeVacation,
        isDateBlocked,
        getAvailableSlots,
        seedDemoData,
        _timeToMinutes,
        _minutesToTime
    };
})();
