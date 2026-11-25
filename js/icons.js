/* =============================================
   icons.js — Local Lucide icon registry (no CDN)
   Only the icons actually used by data-lucide="..."
   in the app are imported, for a small bundle.
   ============================================= */
import {
    createIcons,
    AlertCircle, AlertTriangle, ArrowLeft, ArrowRight,
    Calendar, CalendarCheck, CalendarPlus, CalendarRange, CalendarX,
    Camera, Check, CheckCircle, ChevronLeft, ChevronRight, Clock, Crown,
    Download, Edit2, Euro, Eye, EyeOff, Gem, Grid3x3, Heart, Home, Info,
    AtSign, LayoutDashboard, Link, List, Lock, LogIn, LogOut, Mail,
    Map, MapPin, Menu, Moon, Palmtree, PenTool, Phone, Plus, Printer,
    RefreshCw, Save, Scissors, Search, Settings, Shield, Sparkles, Star,
    Sun, Trash2, User, UserPlus, Users, X, Zap,
    Globe, Cookie, Accessibility, WifiOff, Share2, Venus, Mars, Download as DownloadCloud
} from 'lucide';

const appIcons = {
    AlertCircle, AlertTriangle, ArrowLeft, ArrowRight,
    Calendar, CalendarCheck, CalendarPlus, CalendarRange, CalendarX,
    Camera, Check, CheckCircle, ChevronLeft, ChevronRight, Clock, Crown,
    Download, Edit2, Euro, Eye, EyeOff, Gem, Grid3x3, Heart, Home, Info,
    AtSign, LayoutDashboard, Link, List, Lock, LogIn, LogOut, Mail,
    Map, MapPin, Menu, Moon, Palmtree, PenTool, Phone, Plus, Printer,
    RefreshCw, Save, Scissors, Search, Settings, Shield, Sparkles, Star,
    Sun, Trash2, User, UserPlus, Users, X, Zap,
    Globe, Cookie, Accessibility, WifiOff, Share2, Venus, Mars, DownloadCloud
};

export function renderIcons(root) {
    createIcons({ icons: appIcons, root: root || document });
    enhanceInteractiveDivs(root);
}

// ── a11y retrofit: the app renders many clickable <div>/<i> elements
// (cards, calendar days, list rows) via onclick= in template strings.
// Make them keyboard-reachable and operable without rewriting every
// call site: give them a tab stop, a button role, and Enter/Space support.
const SKIP_CLASSES = ['modal-overlay', 'sidebar-overlay'];

function enhanceInteractiveDivs(root) {
    const scope = root || document;
    const candidates = scope.querySelectorAll('[onclick]');
    candidates.forEach(el => {
        const tag = el.tagName;
        if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'LABEL') return;
        if (el.hasAttribute('tabindex')) return; // already enhanced (idempotent) or intentionally set
        if (SKIP_CLASSES.some(c => el.classList.contains(c))) return; // backdrop click-to-dismiss, not a control
        el.setAttribute('tabindex', '0');
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                el.click();
            }
        });
    });
}
