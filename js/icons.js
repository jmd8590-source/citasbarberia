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
}
