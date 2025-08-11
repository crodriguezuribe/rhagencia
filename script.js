document.addEventListener('DOMContentLoaded', function() {
    // --- 1. CONFIGURACIÓN DE FIREBASE ---
    // ¡¡¡CRUCIAL!!! REEMPLAZA ESTO con tu propia configuración de Firebase.
    const firebaseConfig = {
        apiKey: "TU_API_KEY",
        authDomain: "TU_AUTH_DOMAIN",
        projectId: "TU_PROJECT_ID",
        storageBucket: "TU_STORAGE_BUCKET",
        messagingSenderId: "TU_MESSAGING_SENDER_ID",
        appId: "TU_APP_ID"
    };

    // --- 2. INICIALIZACIÓN Y REFERENCIAS ---
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Error al inicializar Firebase. ¿Están correctas tus credenciales en firebaseConfig?", e);
        return;
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    let cmsData = null;

    const themeSwitcher = document.getElementById('theme-switcher');
    const langSwitcher = document.getElementById('lang-switcher');
    const body = document.body;

    // --- 3. DICCIONARIO DE TRADUCCIONES ---
    const translations = {
        es: {
            pageTitle: "RH Agencia Creativa - Portal",
            navNosotros: "Nosotros", navServicios: "Servicios", navPortafolio: "Portafolio", navContacto: "Contacto", navPortal: "Portal Clientes",
            heroTitle: "Estrategia y Creatividad que Generan Resultados.",
            heroSubtitle: "Combinamos estrategia que funciona con producción visual que impacta, creando proyectos que no solo se ven bien, sino que logran lo que te propones.",
            heroCTA: "Ver Proyectos",
            aboutHeading: "Nosotros", aboutSubheading: "Ideas Claras. Trabajo Honesto.",
            aboutP1: "Somos una agencia digital que realmente entiende lo que necesitas. No complicamos las cosas, las hacemos funcionar. Creemos en la colaboración codo a codo, porque nadie conoce tu negocio mejor que tú.",
            aboutP2: "Nuestro proceso es simple: te escuchamos, armamos un plan claro y lo ejecutamos juntos para obtener resultados reales y medibles.",
            servicesHeading: "Servicios", portfolioHeading: "Portafolio",
            loginHeading: "Acceso Clientes", loginSubheading: "Ingresa tus credenciales para ver el estado de tus proyectos.",
            loginEmailPlaceholder: "Correo Electrónico", loginPasswordPlaceholder: "Contraseña", loginButton: "Ingresar",
            dashboardHeading: "Mis Proyectos", dashboardLogout: "Cerrar Sesión",
            contactHeading: "¿Hacemos algo bueno juntos?", contactSubheading: "Hablemos",
            contactText: "Estamos listos para escuchar tu idea y convertirla en un proyecto exitoso. Escríbenos o llámanos.",
            contactNamePlaceholder: "Tu Nombre", contactEmailPlaceholder: "Tu Correo Electrónico", contactMessagePlaceholder: "Cuéntanos sobre tu proyecto", contactButton: "Enviar Mensaje",
            footerText: "© 2025 RH Agencia Creativa. Todos los derechos reservados."
        },
        en: {
            pageTitle: "RH Creative Agency - Portal",
            navNosotros: "About Us", navServicios: "Services", navPortafolio: "Portfolio", navContacto: "Contact", navPortal: "Client Portal",
            heroTitle: "Strategy and Creativity that Drive Results.",
            heroSubtitle: "We combine strategy that works with visual production that impacts, creating projects that not only look good, but achieve your goals.",
            heroCTA: "View Projects",
            aboutHeading: "About Us", aboutSubheading: "Clear Ideas. Honest Work.",
            aboutP1: "We are a digital agency that truly understands what you need. We don't complicate things; we make them work. We believe in side-by-side collaboration because no one knows your business better than you.",
            aboutP2: "Our process is simple: we listen to you, create a clear plan, and execute it together to obtain real, measurable results.",
            servicesHeading: "Services", portfolioHeading: "Portfolio",
            loginHeading: "Client Access", loginSubheading: "Enter your credentials to see the status of your projects.",
            loginEmailPlaceholder: "Email Address", loginPasswordPlaceholder: "Password", loginButton: "Login",
            dashboardHeading: "My Projects", dashboardLogout: "Log Out",
            contactHeading: "Let's make something great together?", contactSubheading: "Let's Talk",
            contactText: "We are ready to listen to your idea and turn it into a successful project. Write or call us.",
            contactNamePlaceholder: "Your Name", contactEmailPlaceholder: "Your Email Address", contactMessagePlaceholder: "Tell us about your project", contactButton: "Send Message",
            footerText: "© 2025 RH Creative Agency. All rights reserved."
        }
    };

    // --- 4. LÓGICA DE RENDERIZADO Y TRADUCCIÓN ---
    const setLanguage = (lang = 'es') => {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            const translation = translations[lang]?.[key];
            if (translation) {
                if (el.placeholder) el.placeholder = translation;
                else el.textContent = translation;
            }
        });
        if (cmsData) renderDynamicContent(lang);
        localStorage.setItem('language', lang);
        langSwitcher.textContent = lang === 'es' ? 'EN' : 'ES';
        langSwitcher.dataset.lang = lang === 'es' ? 'en' : 'es';
    };

    const renderDynamicContent = (lang) => {
        if (!cmsData) return;
        
        document.querySelector('[data-cms="hero-title"]').textContent = cmsData.hero['title_' + lang];
        document.querySelector('[data-cms="hero-subtitle"]').textContent = cmsData.hero['subtitle_' + lang];
        document.querySelector('[data-cms="about-title"]').textContent = cmsData.about['title_' + lang];
        document.querySelector('[data-cms="about-p1"]').textContent = cmsData.about['p1_' + lang];
        document.querySelector('[data-cms="contact-text"]').textContent = cmsData.contact['text_' + lang];

        const serviceContainer = document.getElementById('service-list-container');
        serviceContainer.innerHTML = '';
        cmsData.services?.forEach(service => {
            const li = document.createElement('li');
            li.className = 'service-item fade-in';
            li.innerHTML = `<h3>${service['name_' + lang]}</h3><span>${service.id}</span>`;
            serviceContainer.appendChild(li);
        });

        const portfolioContainer = document.getElementById('portfolio-grid-container');
        portfolioContainer.innerHTML = '';
        cmsData.portfolio?.forEach(item => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'portfolio-item fade-in';
            a.innerHTML = `
                <img src="${item.imageUrl}" alt="${item['title_' + lang]}">
                <div class="portfolio-overlay"><h3>${item['title_' + lang]} / ${item['category_' + lang]}</h3></div>
            `;
            portfolioContainer.appendChild(a);
        });
    };

    const loadCMSContent = async () => {
        try {
            const doc = await db.collection('cms').doc('siteContent').get();
            if (doc.exists) {
                cmsData = doc.data();
                setLanguage(localStorage.getItem('language') || 'es');
            } else {
                console.error("Error: No se encontró el documento 'siteContent' en Firestore.");
            }
        } catch (error) {
            console.error("Error al cargar contenido del CMS:", error);
        }
    };

    // --- 5. LÓGICA DE UI Y AUTENTICACIÓN ---
    const initUI = () => {
        // --- Lógica de Tema Mejorada ---
        const applyTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme === 'dark-mode' || (!savedTheme && systemPrefersDark)) {
                body.classList.add('dark-mode');
                themeSwitcher.textContent = '☀️';
            } else {
                body.classList.remove('dark-mode');
                themeSwitcher.textContent = '🌙';
            }
        };
        
        applyTheme();

        themeSwitcher.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const newTheme = body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
            localStorage.setItem('theme', newTheme);
            themeSwitcher.textContent = newTheme === 'dark-mode' ? '☀️' : '🌙';
        });

        // --- Lógica de Menú Móvil ---
        const navToggle = document.getElementById('nav-toggle');
        const closeNav = document.getElementById('close-nav');
        const mobileNavMenu = document.getElementById('mobile-nav-menu');
        navToggle.addEventListener('click', () => mobileNavMenu.classList.add('active'));
        closeNav.addEventListener('click', () => mobileNavMenu.classList.remove('active'));
        mobileNavMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileNavMenu.classList.remove('active'));
        });
    };
    
    const setupAuth = () => {
        const loginForm = document.getElementById('login-form');
        const logoutButton = document.getElementById('logout-button');
        const allPublicSections = document.querySelectorAll('main section:not(#login):not(#dashboard)');
        const dashboardSection = document.getElementById('dashboard');

        auth.onAuthStateChanged(user => {
            if (user) {
                allPublicSections.forEach(s => s.style.display = 'none');
                dashboardSection.style.display = 'flex';
            } else {
                allPublicSections.forEach(s => s.style.display = 'flex');
                dashboardSection.style.display = 'none';
            }
        });

        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = e.target.querySelector('#login-email').value;
            const password = e.target.querySelector('#login-password').value;
            auth.signInWithEmailAndPassword(email, password).catch(err => {
                document.getElementById('login-error').textContent = 'Credenciales incorrectas.';
            });
        });

        logoutButton.addEventListener('click', () => auth.signOut());
    };

    // --- 6. INICIALIZACIÓN GENERAL ---
    initUI();
    setupAuth();
    loadCMSContent();
    langSwitcher.addEventListener('click', () => setLanguage(langSwitcher.dataset.lang));
});

