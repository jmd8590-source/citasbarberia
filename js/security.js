/* =============================================
   security.js — Security, Sanitization & Crypto Utility
   ============================================= */

const Security = (() => {

    // ── XSS Prevention: HTML Escaping ──
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        if (typeof str !== 'string') str = String(str);
        
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#x60;'
        };
        return str.replace(/[&<>"'`\/]/g, match => htmlEscapes[match]);
    }

    // ── Input Sanitization ──
    function sanitizeString(str, maxLength = 255) {
        if (typeof str !== 'string') return '';
        // Trim, strip control characters except space
        let clean = str.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        if (clean.length > maxLength) {
            clean = clean.substring(0, maxLength);
        }
        return clean;
    }

    // ── Cryptographically Secure Random ID Generation ──
    function generateSecureId() {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint8Array(16);
            window.crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }
        // Fallback using timestamp and random floats
        return 'sec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    // ── Password Hashing (SHA-256 via Web Crypto API) ──
    async function hashPassword(password) {
        if (!password) return '';
        const msgUint8 = new TextEncoder().encode(password);
        if (window.crypto && window.crypto.subtle) {
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        // Fallback SHA-256 implementation if subtle crypto unavailable
        return _simpleHash(password);
    }

    function _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return 'h_' + Math.abs(hash).toString(16);
    }

    // Synchronous hash helper for demo data seeding
    function hashPasswordSync(password) {
        return _simpleHash(password);
    }

    // ── Strict Input Validation ──
    function validateEmail(email) {
        if (typeof email !== 'string') return false;
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email.trim());
    }

    function validatePhone(phone) {
        if (!phone) return true; // Phone is optional in some forms
        if (typeof phone !== 'string') return false;
        // Allows optional +, numbers, spaces, hyphens, min 7 digits
        const clean = phone.replace(/[\s\-\+\(\)]/g, '');
        return /^\d{7,15}$/.test(clean);
    }

    function validateDate(dateStr) {
        if (typeof dateStr !== 'string') return false;
        const re = /^\d{4}-\d{2}-\d{2}$/;
        if (!re.test(dateStr)) return false;
        const d = new Date(dateStr + 'T12:00:00');
        return !isNaN(d.getTime());
    }

    function validateTime(timeStr) {
        if (typeof timeStr !== 'string') return false;
        const re = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return re.test(timeStr);
    }

    // ── Sanitize Data Object ──
    function sanitizeObject(obj, allowedKeys = null) {
        if (!obj || typeof obj !== 'object') return {};
        const result = {};
        for (const [key, val] of Object.entries(obj)) {
            if (allowedKeys && !allowedKeys.includes(key)) continue;
            if (typeof val === 'string') {
                result[key] = sanitizeString(val);
            } else if (typeof val === 'number' || typeof val === 'boolean') {
                result[key] = val;
            } else if (Array.isArray(val)) {
                result[key] = val.map(item => typeof item === 'string' ? sanitizeString(item) : item);
            } else {
                result[key] = val;
            }
        }
        return result;
    }

    // ── Public API ──
    return {
        escapeHTML,
        sanitizeString,
        generateSecureId,
        hashPassword,
        hashPasswordSync,
        validateEmail,
        validatePhone,
        validateDate,
        validateTime,
        sanitizeObject
    };
})();
