/* =============================================
   brand.js — BarberClub logo mark (inline SVG, currentColor)
   ============================================= */

// Razor-blade mark only, no background — inherits CSS `color`.
export const BRAND_MARK_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <g transform="rotate(-45 24 24)">
    <rect x="7" y="21.5" width="15" height="5" rx="2.5" fill="currentColor"/>
    <rect x="9.5" y="22.5" width="10" height="1" rx="0.5" fill="var(--bg-primary)" opacity="0.3"/>
    <circle cx="23.5" cy="24" r="2.1" fill="var(--bg-primary)"/>
    <circle cx="23.5" cy="24" r="1.1" fill="currentColor"/>
    <path d="M24.5 22.3 L40.5 19.2 C42 18.9 42.6 20.6 41.3 21.4 L26.3 30.5 Q23.5 24.6 24.5 22.3 Z" fill="currentColor"/>
  </g>
</svg>`.trim();

// Full lockup: icon badge + "BarberClub" wordmark. `size` controls the badge box (px).
export function brandLogoHTML(size = 36) {
    return `
    <span class="brand-logo">
        <span class="brand-mark" style="width:${size}px;height:${size}px;">${BRAND_MARK_SVG}</span>
        <span class="brand-word">Barber<span>Club</span></span>
    </span>`;
}
