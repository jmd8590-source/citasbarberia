/* =============================================
   storage.js — Data layer backed by Appwrite
   ─────────────────────────────────────────────
   Online-first with an offline-readable cache: after login (or on
   page load with an existing session) hydrate() pulls everything the
   current user is allowed to see into an in-memory cache. Every page
   in the app reads that cache *synchronously* (unchanged from the
   previous localStorage-based version), so none of the render
   functions elsewhere in the app had to change. Writes call Appwrite
   first and only update the cache once the server confirms — if the
   network call fails, the cache is left untouched and the caller's
   catch/toast runs instead of a false "saved" state.
   ============================================= */

import {
    account, tablesDB, storage, ID, Query,
    DB_ID, BUCKET_ID, ADMIN_TEAM_ID, TABLE, MEDIA_FOLDER
} from './appwrite-client.js';
import { Security } from './security.js';

export const Storage = (() => {
    let cache = _emptyCache();

    function _emptyCache() {
        return {
            currentUser: null,
            isAdmin: false,
            clients: [],
            appointments: [],
            slots: [],
            services: [],
            gallery: [],
            scheduleConfig: null,
            settings: null
        };
    }

    // ── Row <-> app-shape helpers ──
    function _normalizeRow(row) {
        if (!row) return row;
        const { $id, $sequence, $tableId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = row;
        return { id: $id, createdAt: $createdAt, updatedAt: $updatedAt, ...data };
    }

    function _avatarUrl(fileId) {
        if (!fileId) return '';
        try {
            return storage.getFileView({ bucketId: BUCKET_ID, fileId }).toString();
        } catch {
            return '';
        }
    }

    const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    function _fromScheduleRow(row) {
        return {
            workDays: {
                mon: !!row.workMon, tue: !!row.workTue, wed: !!row.workWed, thu: !!row.workThu,
                fri: !!row.workFri, sat: !!row.workSat, sun: !!row.workSun
            },
            hours: { start: row.hoursStart, end: row.hoursEnd },
            slotDuration: row.slotDuration,
            blocks: _safeParse(row.blocksJson, []),
            vacations: _safeParse(row.vacationsJson, [])
        };
    }

    function _toScheduleRowData(config) {
        return {
            workMon: !!config.workDays.mon, workTue: !!config.workDays.tue, workWed: !!config.workDays.wed,
            workThu: !!config.workDays.thu, workFri: !!config.workDays.fri, workSat: !!config.workDays.sat,
            workSun: !!config.workDays.sun,
            hoursStart: config.hours.start, hoursEnd: config.hours.end,
            slotDuration: config.slotDuration,
            blocksJson: JSON.stringify(config.blocks || []),
            vacationsJson: JSON.stringify(config.vacations || [])
        };
    }

    function _safeParse(json, fallback) {
        try { return JSON.parse(json ?? ''); } catch { return fallback; }
    }

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
            address: '',
            phone: '',
            email: '',
            instagram: '',
            description: ''
        };
    }

    // ── Session bootstrap ──
    async function restoreSession() {
        let authUser;
        try {
            authUser = await account.get();
        } catch {
            // No valid Appwrite session — this is the normal "logged out" state.
            cache = _emptyCache();
            return false;
        }
        try {
            await _loadSessionUser(authUser);
            return true;
        } catch (err) {
            // A session exists but hydrating app data failed (network/permissions/bug).
            // Surface this instead of silently pretending the user is logged out.
            cache = _emptyCache();
            console.error('restoreSession: failed to hydrate session data', err);
            throw err;
        }
    }

    async function _loadSessionUser(authUser) {
        let profile;
        try {
            profile = _normalizeRow(await tablesDB.getRow({ databaseId: DB_ID, tableId: TABLE.PROFILES, rowId: authUser.$id }));
        } catch {
            // First login right after registration can race the profile row creation — retry once.
            await new Promise(r => setTimeout(r, 400));
            profile = _normalizeRow(await tablesDB.getRow({ databaseId: DB_ID, tableId: TABLE.PROFILES, rowId: authUser.$id }));
        }

        cache.currentUser = {
            id: authUser.$id,
            name: profile.name || authUser.name,
            email: profile.email || authUser.email,
            phone: profile.phone || '',
            role: profile.role,
            avatarFileId: profile.avatarFileId || '',
            avatar: _avatarUrl(profile.avatarFileId)
        };
        cache.isAdmin = profile.role === 'admin';
        await hydrate();
    }

    async function hydrate() {
        const user = cache.currentUser;
        if (!user) return;

        const [servicesRes, slotsRes, scheduleRow, settingsRow] = await Promise.all([
            tablesDB.listRows({ databaseId: DB_ID, tableId: TABLE.SERVICES, queries: [Query.limit(200)] }),
            tablesDB.listRows({ databaseId: DB_ID, tableId: TABLE.SLOTS, queries: [Query.limit(2000)] }),
            tablesDB.getRow({ databaseId: DB_ID, tableId: TABLE.SCHEDULE, rowId: 'config' }).catch(() => null),
            tablesDB.getRow({ databaseId: DB_ID, tableId: TABLE.SETTINGS, rowId: 'config' }).catch(() => null)
        ]);
        cache.services = servicesRes.rows.map(_normalizeRow);
        cache.slots = slotsRes.rows.map(_normalizeRow);
        cache.scheduleConfig = scheduleRow ? _fromScheduleRow(_normalizeRow(scheduleRow)) : _defaultSchedule();
        cache.settings = settingsRow ? _normalizeRow(settingsRow) : _defaultSettings();

        if (cache.isAdmin) {
            const [apptsRes, clientsRes] = await Promise.all([
                tablesDB.listRows({ databaseId: DB_ID, tableId: TABLE.APPOINTMENTS, queries: [Query.limit(1000)] }),
                tablesDB.listRows({ databaseId: DB_ID, tableId: TABLE.PROFILES, queries: [Query.equal('role', 'client'), Query.limit(500)] })
            ]);
            cache.appointments = apptsRes.rows.map(_normalizeRow);
            cache.clients = clientsRes.rows.map(r => {
                const p = _normalizeRow(r);
                return { ...p, avatar: _avatarUrl(p.avatarFileId) };
            });
            cache.gallery = [];
        } else {
            const apptsRes = await tablesDB.listRows({
                databaseId: DB_ID, tableId: TABLE.APPOINTMENTS,
                queries: [Query.equal('userId', user.id), Query.limit(500)]
            });
            cache.appointments = apptsRes.rows.map(_normalizeRow);
            cache.clients = [];
            cache.gallery = await _fetchGalleryFor(user.id);
        }
    }

    async function _fetchGalleryFor(userId) {
        const res = await tablesDB.listRows({
            databaseId: DB_ID, tableId: TABLE.GALLERY,
            queries: [Query.equal('userId', userId), Query.limit(200)]
        });
        return res.rows.map(_normalizeRow).map(g => ({ ...g, imageData: _avatarUrl(g.fileId) }));
    }

    // ── Users / Profiles ──
    const Users = {
        getAll: () => cache.isAdmin ? cache.clients.concat(cache.currentUser ? [cache.currentUser] : []) : (cache.currentUser ? [cache.currentUser] : []),
        getById: (id) => {
            if (cache.currentUser && cache.currentUser.id === id) return cache.currentUser;
            return cache.clients.find(c => c.id === id) || null;
        },
        getByEmail: (email) => {
            if (!email) return null;
            const q = email.trim().toLowerCase();
            if (cache.currentUser && cache.currentUser.email.toLowerCase() === q) return cache.currentUser;
            return cache.clients.find(c => c.email.toLowerCase() === q) || null;
        },
        getClients: () => cache.clients,
        // Full registration: Appwrite Auth account + profile row + session.
        create: async ({ name, email, phone, password }) => {
            const cleanName = Security.sanitizeString(name, 100);
            const cleanEmail = Security.sanitizeString(email, 255).toLowerCase();
            const cleanPhone = Security.sanitizeString(phone || '', 20);
            const userId = ID.unique();

            await account.create({ userId, email: cleanEmail, password, name: cleanName });
            await account.createEmailPasswordSession({ email: cleanEmail, password });
            await tablesDB.createRow({
                databaseId: DB_ID, tableId: TABLE.PROFILES, rowId: userId,
                data: { name: cleanName, email: cleanEmail, phone: cleanPhone, role: 'client' },
                permissions: [
                    `read("user:${userId}")`, `update("user:${userId}")`,
                    `read("team:${ADMIN_TEAM_ID}")`, `update("team:${ADMIN_TEAM_ID}")`
                ]
            });

            const authUser = await account.get();
            await _loadSessionUser(authUser);
            return cache.currentUser;
        },
        update: async (id, data) => {
            const updates = {};
            if (data.name) updates.name = Security.sanitizeString(data.name, 100);
            if (data.phone !== undefined) updates.phone = Security.sanitizeString(data.phone, 20);

            await tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLE.PROFILES, rowId: id, data: updates });

            if (data.password && data.password.length >= 6) {
                await account.updatePassword({ password: data.password, oldPassword: data.currentPassword });
            }
            if (updates.name) await account.updateName({ name: updates.name }).catch(() => {});

            if (cache.currentUser && cache.currentUser.id === id) {
                cache.currentUser = { ...cache.currentUser, ...updates };
            }
            const idx = cache.clients.findIndex(c => c.id === id);
            if (idx !== -1) cache.clients[idx] = { ...cache.clients[idx], ...updates };

            return Users.getById(id);
        },
        updateAvatar: async (file) => {
            const user = cache.currentUser;
            if (!user) throw new Error('not logged in');

            const fileId = ID.unique();
            await storage.createFile({
                bucketId: BUCKET_ID, fileId, file,
                permissions: [`read("users")`, `update("user:${user.id}")`, `delete("user:${user.id}")`],
                folder: MEDIA_FOLDER.AVATARS
            });

            await tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLE.PROFILES, rowId: user.id, data: { avatarFileId: fileId } });

            const url = _avatarUrl(fileId);
            cache.currentUser = { ...cache.currentUser, avatarFileId: fileId, avatar: url };
            return cache.currentUser;
        },
        remove: async (id) => {
            // Cascade: this user's appointments, slots and gallery, then their profile row.
            const appts = Appointments.getByUser(id);
            for (const a of appts) await Appointments.remove(a.id);
            const photos = cache.currentUser && cache.currentUser.id === id ? cache.gallery : [];
            for (const g of photos) await Gallery.remove(g.id);
            await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE.PROFILES, rowId: id });
            return true;
        }
    };

    // ── Appointments ──
    const Appointments = {
        getAll: () => cache.appointments,
        getById: (id) => cache.appointments.find(a => a.id === id) || null,
        create: async (appt) => {
            const permissions = [
                `read("user:${appt.userId}")`, `update("user:${appt.userId}")`,
                `read("team:${ADMIN_TEAM_ID}")`, `update("team:${ADMIN_TEAM_ID}")`
            ];
            const row = await tablesDB.createRow({
                databaseId: DB_ID, tableId: TABLE.APPOINTMENTS, rowId: ID.unique(),
                data: {
                    userId: appt.userId, serviceId: appt.serviceId,
                    date: appt.date, time: appt.time,
                    status: appt.status || 'pending', notes: appt.notes || ''
                },
                permissions
            });
            const normalized = _normalizeRow(row);

            // Privacy-preserving availability index: date/time/duration only — no name,
            // service or status — so any client can block the right number of consecutive
            // slots without being able to read who booked them or what for.
            const service = Services.getById(appt.serviceId);
            const slotRow = await tablesDB.createRow({
                databaseId: DB_ID, tableId: TABLE.SLOTS, rowId: ID.unique(),
                data: { date: appt.date, time: appt.time, appointmentId: normalized.id, duration: service ? service.duration : 30 },
                permissions: [`delete("user:${appt.userId}")`, `delete("team:${ADMIN_TEAM_ID}")`, `update("team:${ADMIN_TEAM_ID}")`]
            });

            cache.appointments.push(normalized);
            cache.slots.push(_normalizeRow(slotRow));
            return normalized;
        },
        update: async (id, data) => {
            const row = await tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLE.APPOINTMENTS, rowId: id, data });
            const normalized = _normalizeRow(row);
            const idx = cache.appointments.findIndex(a => a.id === id);
            if (idx !== -1) cache.appointments[idx] = normalized;
            return normalized;
        },
        remove: async (id) => {
            const slot = cache.slots.find(s => s.appointmentId === id);
            if (slot) {
                await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE.SLOTS, rowId: slot.id }).catch(() => {});
                cache.slots = cache.slots.filter(s => s.id !== slot.id);
            }
            await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE.APPOINTMENTS, rowId: id });
            cache.appointments = cache.appointments.filter(a => a.id !== id);
            return true;
        },
        getByUser: (userId) => cache.appointments.filter(a => a.userId === userId),
        getByDate: (date) => cache.appointments.filter(a => a.date === date),
        getByDateRange: (startDate, endDate) => cache.appointments.filter(a => a.date >= startDate && a.date <= endDate),
        getPending: () => cache.appointments.filter(a => a.status === 'pending'),
        getUpcoming: (userId) => {
            const today = new Date().toISOString().split('T')[0];
            return cache.appointments
                .filter(a => a.userId === userId && a.date >= today && a.status === 'pending')
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        },
        cancel: async (id) => {
            // Cancelling keeps the appointment (history) but frees the slot for others.
            const slot = cache.slots.find(s => s.appointmentId === id);
            if (slot) {
                await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE.SLOTS, rowId: slot.id }).catch(() => {});
                cache.slots = cache.slots.filter(s => s.id !== slot.id);
            }
            return Appointments.update(id, { status: 'cancelled' });
        },
        complete: async (id) => Appointments.update(id, { status: 'completed' }),
        isSlotTaken: (date, time) => cache.slots.some(s => s.date === date && s.time === time),
        getOccupiedSlots: (date) => {
            // Every booked time plus however many consecutive slots its duration spans.
            // Duration comes straight from the slots index (not from other users'
            // appointment rows, which this user may have no permission to read).
            const daySlots = cache.slots.filter(s => s.date === date);
            const slotDuration = getScheduleConfig().slotDuration;
            const occupied = [];
            daySlots.forEach(slot => {
                const startMinutes = _timeToMinutes(slot.time);
                const count = Math.ceil((slot.duration || slotDuration) / slotDuration);
                for (let i = 0; i < count; i++) {
                    occupied.push(_minutesToTime(startMinutes + i * slotDuration));
                }
            });
            return occupied;
        }
    };

    // ── Services ──
    const Services = {
        getAll: () => cache.services,
        getByCategory: (category) => cache.services.filter(s => s.category === category),
        getActive: (category) => cache.services.filter(s => s.active !== false && (!category || s.category === category)),
        getById: (id) => cache.services.find(s => s.id === id) || null,
        create: async (service) => {
            const row = await tablesDB.createRow({
                databaseId: DB_ID, tableId: TABLE.SERVICES, rowId: ID.unique(),
                data: {
                    category: service.category === 'women' ? 'women' : 'men',
                    name: service.name, description: service.description || '',
                    duration: service.duration, price: service.price,
                    icon: service.icon || '', active: true
                }
            });
            const normalized = _normalizeRow(row);
            cache.services.push(normalized);
            return normalized;
        },
        update: async (id, data) => {
            const row = await tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLE.SERVICES, rowId: id, data });
            const normalized = _normalizeRow(row);
            const idx = cache.services.findIndex(s => s.id === id);
            if (idx !== -1) cache.services[idx] = normalized;
            return normalized;
        },
        remove: async (id) => {
            await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE.SERVICES, rowId: id });
            cache.services = cache.services.filter(s => s.id !== id);
            return true;
        },
        toggle: async (id) => {
            const service = Services.getById(id);
            if (!service) return null;
            return Services.update(id, { active: !service.active });
        }
    };

    // ── Schedule Config ──
    function getScheduleConfig() {
        return cache.scheduleConfig || _defaultSchedule();
    }

    async function updateScheduleConfig(partial) {
        const current = getScheduleConfig();
        const updated = {
            ...current,
            ...partial,
            workDays: { ...current.workDays, ...(partial.workDays || {}) },
            hours: { ...current.hours, ...(partial.hours || {}) }
        };
        await tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLE.SCHEDULE, rowId: 'config', data: _toScheduleRowData(updated) });
        cache.scheduleConfig = updated;
        return updated;
    }

    async function addBlock(block) {
        const config = getScheduleConfig();
        block = { ...block, id: Security.generateSecureId() };
        const blocks = [...(config.blocks || []), block];
        await updateScheduleConfig({ blocks });
        return block;
    }

    async function removeBlock(blockId) {
        const config = getScheduleConfig();
        const blocks = (config.blocks || []).filter(b => b.id !== blockId);
        await updateScheduleConfig({ blocks });
    }

    async function addVacation(vacation) {
        const config = getScheduleConfig();
        vacation = { ...vacation, id: Security.generateSecureId() };
        const vacations = [...(config.vacations || []), vacation];
        await updateScheduleConfig({ vacations });
        return vacation;
    }

    async function removeVacation(vacationId) {
        const config = getScheduleConfig();
        const vacations = (config.vacations || []).filter(v => v.id !== vacationId);
        await updateScheduleConfig({ vacations });
    }

    function isDateBlocked(dateStr) {
        const config = getScheduleConfig();
        if ((config.blocks || []).some(b => b.date === dateStr)) return true;
        if ((config.vacations || []).some(v => dateStr >= v.startDate && dateStr <= v.endDate)) return true;
        const dayIndex = new Date(dateStr + 'T12:00:00').getDay();
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return !config.workDays[dayMap[dayIndex]];
    }

    function getAvailableSlots(dateStr, serviceDuration = 30) {
        if (isDateBlocked(dateStr)) return [];
        const config = getScheduleConfig();
        const dayIndex = new Date(dateStr + 'T12:00:00').getDay();
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = dayMap[dayIndex];

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
        getAll: () => cache.gallery,
        getByUser: (userId) => cache.currentUser && cache.currentUser.id === userId
            ? cache.gallery
            : [], // admin fetches another client's gallery on demand — see fetchGalleryForClient
        create: async (item) => {
            const user = cache.currentUser;
            const row = await tablesDB.createRow({
                databaseId: DB_ID, tableId: TABLE.GALLERY, rowId: ID.unique(),
                data: { userId: item.userId, fileId: item.fileId, caption: item.caption || '', date: item.date },
                permissions: [
                    `read("user:${item.userId}")`, `delete("user:${item.userId}")`,
                    `read("team:${ADMIN_TEAM_ID}")`, `delete("team:${ADMIN_TEAM_ID}")`
                ]
            });
            const normalized = { ..._normalizeRow(row), imageData: _avatarUrl(item.fileId) };
            if (user && user.id === item.userId) cache.gallery.push(normalized);
            return normalized;
        },
        uploadPhoto: async (file, caption) => {
            const user = cache.currentUser;
            if (!user) throw new Error('not logged in');
            const fileId = ID.unique();
            await storage.createFile({
                bucketId: BUCKET_ID, fileId, file,
                permissions: [`read("user:${user.id}")`, `delete("user:${user.id}")`, `read("team:${ADMIN_TEAM_ID}")`],
                folder: MEDIA_FOLDER.GALLERY
            });
            return Gallery.create({
                userId: user.id, fileId, caption,
                date: new Date().toISOString().split('T')[0]
            });
        },
        remove: async (id) => {
            const item = cache.gallery.find(g => g.id === id);
            await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE.GALLERY, rowId: id });
            if (item && item.fileId) {
                await storage.deleteFile({ bucketId: BUCKET_ID, fileId: item.fileId }).catch(() => {});
            }
            cache.gallery = cache.gallery.filter(g => g.id !== id);
            return true;
        }
    };

    async function fetchGalleryForClient(userId) {
        return _fetchGalleryFor(userId);
    }

    // ── Session ──
    const Session = {
        isLoggedIn: () => !!cache.currentUser,
        isAdmin: () => cache.isAdmin,
        getCurrentUser: () => cache.currentUser,
        clear: () => { cache = _emptyCache(); }
    };

    // ── Settings ──
    const Settings = {
        get: () => cache.settings || _defaultSettings(),
        update: async (settings) => {
            await tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLE.SETTINGS, rowId: 'config', data: settings });
            cache.settings = { ...Settings.get(), ...settings };
            return cache.settings;
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

    // ── Public API ──
    return {
        Users,
        Appointments,
        Services,
        Gallery,
        Session,
        Settings,
        restoreSession,
        hydrate,
        fetchGalleryForClient,
        getScheduleConfig,
        updateScheduleConfig,
        addBlock,
        removeBlock,
        addVacation,
        removeVacation,
        isDateBlocked,
        getAvailableSlots,
        _timeToMinutes,
        _minutesToTime
    };
})();
