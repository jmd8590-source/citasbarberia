/* =============================================
   legal.js — Privacy Policy & Terms (static, bilingual)
   Long-form legal prose is kept as two full blocks (ES/EN) rather
   than wrapped sentence-by-sentence through t(), which would bloat
   the dictionary for text that is only ever read as whole paragraphs.
   ============================================= */

import { brandLogoHTML } from './brand.js';
import { getLang, t } from './i18n.js';

const CONTACT_EMAIL = 'privacidad@barberclub.es';

const content = {
    es: {
        privacyTitle: 'Política de privacidad',
        privacyBody: `
            <p><strong>Última actualización:</strong> noviembre de 2026</p>
            <h3>¿Quién trata tus datos?</h3>
            <p>BarberClub es el responsable del tratamiento de los datos personales que
            nos facilitas al registrarte y usar la aplicación. Puedes contactarnos en
            <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> para cualquier
            consulta sobre tus datos.</p>

            <h3>¿Qué datos tratamos y con qué base legal?</h3>
            <ul>
                <li><strong>Datos de tu cuenta</strong> (nombre, email, teléfono, contraseña
                cifrada, foto de perfil opcional): necesarios para crear tu cuenta y
                gestionar tus citas (ejecución del contrato de uso del servicio).</li>
                <li><strong>Datos de tus citas</strong> (servicio, fecha, hora, estado):
                necesarios para prestarte el servicio de reserva.</li>
                <li><strong>Fotos de galería</strong> que subas voluntariamente: tratadas
                con tu consentimiento explícito al subirlas, y eliminables por ti en
                cualquier momento.</li>
                <li><strong>Preferencias de la app</strong> (tema claro/oscuro, idioma,
                catálogo caballeros/señoras): se guardan solo en tu dispositivo
                (localStorage del navegador), nunca en nuestros servidores.</li>
            </ul>

            <h3>¿Dónde se almacenan tus datos?</h3>
            <p>Los datos de tu cuenta y tus citas se almacenan en servidores de Appwrite
            Cloud ubicados en Frankfurt (Alemania), dentro de la Unión Europea. No
            vendemos ni cedemos tus datos a terceros con fines publicitarios. No usamos
            cookies ni scripts de analítica o publicidad de terceros.</p>

            <h3>¿Cuánto tiempo conservamos tus datos?</h3>
            <p>Mientras mantengas tu cuenta activa. Si eliminas tu cuenta desde tu
            perfil, tus datos personales y tu historial de citas se eliminan de forma
            permanente en un plazo máximo de 30 días, salvo que la ley exija su
            conservación por motivos contables o fiscales.</p>

            <h3>Tus derechos (RGPD)</h3>
            <p>Puedes ejercer en cualquier momento, desde tu perfil o escribiéndonos a
            <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>, tus derechos de
            acceso, rectificación, supresión, portabilidad, limitación y oposición al
            tratamiento. También tienes derecho a reclamar ante tu autoridad de
            protección de datos (en España, la AEPD).</p>

            <h3>Seguridad</h3>
            <p>Tu contraseña se almacena cifrada y nunca en texto plano. Aplicamos
            control de acceso basado en roles (cliente/administrador) y cifrado en
            tránsito (HTTPS) para toda comunicación con nuestros servidores.</p>
        `,
        termsTitle: 'Términos y condiciones',
        termsBody: `
            <p><strong>Última actualización:</strong> noviembre de 2026</p>
            <h3>Objeto</h3>
            <p>BarberClub es una aplicación de reserva de citas para barbería y
            peluquería. Al crear una cuenta aceptas estos términos y nuestra
            <a href="#privacy">política de privacidad</a>.</p>
            <h3>Uso del servicio</h3>
            <p>Debes proporcionar datos veraces al registrarte. Eres responsable de la
            confidencialidad de tu contraseña. Las citas están sujetas a la
            disponibilidad configurada por el negocio y pueden ser modificadas o
            canceladas por el equipo del establecimiento con antelación razonable.</p>
            <h3>Contenido subido por el usuario</h3>
            <p>Las fotos que subas a tu galería personal son tuyas; nos autorizas
            únicamente a almacenarlas para mostrártelas a ti y, si eres cliente, al
            personal del establecimiento para fines de referencia del servicio.</p>
            <h3>Limitación de responsabilidad</h3>
            <p>El servicio se presta "tal cual". No garantizamos disponibilidad
            ininterrumpida. El establecimiento es responsable de la prestación real del
            servicio de barbería/peluquería reservado a través de la app.</p>
        `,
        back: 'Volver'
    },
    en: {
        privacyTitle: 'Privacy Policy',
        privacyBody: `
            <p><strong>Last updated:</strong> November 2026</p>
            <h3>Who processes your data?</h3>
            <p>BarberClub is the data controller for the personal data you provide when
            you register and use the app. You can contact us at
            <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with any question
            about your data.</p>

            <h3>What data do we process, and on what legal basis?</h3>
            <ul>
                <li><strong>Account data</strong> (name, email, phone, encrypted password,
                optional profile photo): needed to create your account and manage your
                appointments (performance of the service contract).</li>
                <li><strong>Appointment data</strong> (service, date, time, status):
                needed to provide the booking service.</li>
                <li><strong>Gallery photos</strong> you voluntarily upload: processed
                under your explicit consent when uploading, removable by you at any
                time.</li>
                <li><strong>App preferences</strong> (light/dark theme, language,
                men's/women's catalog): stored only on your device (browser
                localStorage), never on our servers.</li>
            </ul>

            <h3>Where is your data stored?</h3>
            <p>Your account and appointment data are stored on Appwrite Cloud servers
            located in Frankfurt (Germany), within the European Union. We do not sell
            or share your data with third parties for advertising purposes. We do not
            use third-party analytics or advertising cookies or scripts.</p>

            <h3>How long do we keep your data?</h3>
            <p>For as long as your account stays active. If you delete your account
            from your profile, your personal data and appointment history are
            permanently deleted within 30 days, unless the law requires us to keep it
            for accounting or tax reasons.</p>

            <h3>Your rights (GDPR)</h3>
            <p>At any time, from your profile or by writing to
            <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>, you can exercise
            your rights of access, rectification, erasure, portability, restriction
            and objection to processing. You also have the right to lodge a complaint
            with your data protection authority.</p>

            <h3>Security</h3>
            <p>Your password is stored encrypted, never in plain text. We apply
            role-based access control (client/admin) and encryption in transit (HTTPS)
            for all communication with our servers.</p>
        `,
        termsTitle: 'Terms & Conditions',
        termsBody: `
            <p><strong>Last updated:</strong> November 2026</p>
            <h3>Purpose</h3>
            <p>BarberClub is an appointment booking app for a barbershop/hair salon. By
            creating an account you accept these terms and our
            <a href="#privacy">privacy policy</a>.</p>
            <h3>Using the service</h3>
            <p>You must provide truthful information when registering. You're
            responsible for keeping your password confidential. Appointments are
            subject to the availability configured by the business and may be changed
            or cancelled by the venue's staff with reasonable notice.</p>
            <h3>User-uploaded content</h3>
            <p>Photos you upload to your personal gallery remain yours; you only
            authorize us to store them to show them to you and, if you are a client,
            to the venue's staff for service-reference purposes.</p>
            <h3>Limitation of liability</h3>
            <p>The service is provided "as is". We do not guarantee uninterrupted
            availability. The venue is responsible for actually providing the
            barbershop/salon service booked through the app.</p>
        `,
        back: 'Back'
    }
};

function _layout(title, body) {
    return `
    <div class="auth-container" style="align-items: flex-start; padding-top: var(--space-2xl);">
        <div class="auth-card animate-fade-in-up" style="max-width: 680px;">
            <div class="auth-header">
                <div class="auth-logo">${brandLogoHTML(40)}</div>
            </div>
            <div class="auth-form legal-page">
                <button class="btn btn-ghost btn-sm" onclick="App.navigate('login')" style="margin-bottom: var(--space-md);">
                    <i data-lucide="arrow-left"></i> ${content[getLang()].back}
                </button>
                <h2 class="auth-title">${title}</h2>
                <div class="legal-content">${body}</div>
            </div>
        </div>
    </div>
    `;
}

export const LegalPages = {
    renderPrivacy() {
        const c = content[getLang()];
        return _layout(c.privacyTitle, c.privacyBody);
    },
    renderTerms() {
        const c = content[getLang()];
        return _layout(c.termsTitle, c.termsBody);
    }
};
