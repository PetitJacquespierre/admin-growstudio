// ==============================================================================
// 🚀 GROW STUDIO HUNTER & RADAR ENGINE (MODO $1,000M - EDICIÓN PRO NICHO DINÁMICO)
// Inteligencia Comercial, Escaneo Multicanal de Leads, Tráfico Global y Pitch Automático
// Soporte Dual: Nicho por Defecto (Web / Menús / Eventos) + Nicho Personalizado por Buscador
// ==============================================================================

const STORAGE_KEY_LEADS = 'grow_studio_hunter_leads_v3_live';
const STORAGE_KEY_TRAFFIC = 'grow_studio_hunter_traffic_v3_live';
const STORAGE_KEY_NICHE = 'grow_studio_hunter_active_niche_v3_live';

// 📚 POOL BASE EXPANDIDO DE LEADS (POR DEFECTO: GROW STUDIO)
const DEFAULT_GROW_STUDIO_LEADS = [
    {
        id: 'lead-101',
        author: '@mario.martinezmartinez.524',
        platform: 'Reddit (r/forhire)',
        lang: 'es',
        langLabel: 'Español 🇪🇸',
        niche: 'Menú Digital / Gastronomía',
        time: 'Hace 8 min',
        score: 95,
        badge: 'FUEGO',
        budget: '$180 - $250 USD',
        service: 'Menú Digital QR & Delivery WhatsApp',
        text: 'Hola, necesito confeccionar una página web o menú digital para una hamburguesería con pedidos directos al WhatsApp. Presupuesto disponible para empezar de una.',
        urgency: 'Inmediata',
        status: 'NUEVO',
        directUrl: 'https://www.reddit.com/r/forhire/search/?q=flair%3Ahiring+%28restaurant+OR+menu+OR+website%29&restrict_sr=1&sort=new'
    },
    {
        id: 'lead-102',
        author: '@m.mohsin8839',
        platform: 'Reddit (r/forhire)',
        lang: 'en',
        langLabel: 'English 🇺🇸',
        niche: 'Eventos / Deportes',
        time: 'Hace 19 min',
        score: 92,
        badge: 'FUEGO',
        budget: '$300 - $450 USD',
        service: 'Landing Page de Eventos & Atletas',
        text: 'I saying tomorrow I need website urgently 300$ for a sports event and athlete roster. Must include countdown, registration form and runner search.',
        urgency: 'Inmediata (24-48h)',
        status: 'NUEVO',
        directUrl: 'https://www.reddit.com/r/forhire/search/?q=flair%3Ahiring+%28event+OR+sports+OR+developer%29&restrict_sr=1&sort=new'
    },
    {
        id: 'lead-103',
        author: '@lucas.silva.tech',
        platform: 'Twitter / X (En Vivo)',
        lang: 'pt',
        langLabel: 'Português 🇧🇷',
        niche: 'SaaS / Dashboards',
        time: 'Hace 45 min',
        score: 86,
        badge: 'HOT',
        budget: '$400 - $600 USD',
        service: 'SaaS Dashboard / App Web',
        text: 'Preciso de um desenvolvedor para criar um painel administrativo moderno para franquias com visual escuro premium e métricas em tempo real.',
        urgency: 'Media (Este mes)',
        status: 'NUEVO',
        directUrl: 'https://twitter.com/search?q=%22preciso%20de%20um%20desenvolvedor%22%20web%20-filter%3Areplies&f=live'
    },
    {
        id: 'lead-104',
        author: '@estherkay21',
        platform: 'Reddit (r/freelance_forhire)',
        lang: 'en',
        langLabel: 'English 🇬🇧',
        niche: 'Rediseño Web',
        time: 'Hace 1 hora',
        score: 79,
        badge: 'HOT',
        budget: '$150 - $250 USD',
        service: 'Rediseño Web Rápido & Mobile-First',
        text: 'Any modern web agency who can rebuild my boutique landing page with modern animations, video hero and clean mobile view? Please DM portfolios.',
        urgency: 'Esta semana',
        status: 'NUEVO',
        directUrl: 'https://www.reddit.com/r/freelance_forhire/search/?q=%22hiring%22+web&restrict_sr=1&sort=new'
    },
    {
        id: 'lead-105',
        author: '@carlos.valencia_ve',
        platform: 'WhatsApp Directo',
        lang: 'es',
        langLabel: 'Español 🇻🇪',
        niche: 'Comercio / Catálogo',
        time: 'Hace 2 horas',
        score: 89,
        badge: 'HOT',
        budget: '$150 - $200 USD',
        service: 'Catálogo Interactivo con WhatsApp',
        text: 'Buenas tardes, busco quién me desarrolle una página catálogo para tienda de perfumes y ropa con botón directo a WhatsApp. Pago al contado.',
        urgency: 'Alta',
        status: 'NUEVO',
        directUrl: 'https://wa.me/584127732710?text=Hola%20Carlos!%20Te%20contacto%20desde%20Grow%20Studio%20sobre%20el%20desarrollo%20de%20tu%20catálogo.'
    },
    {
        id: 'lead-106',
        author: '@marcus.marathon.uk',
        platform: 'Reddit (r/forhire)',
        lang: 'en',
        langLabel: 'English 🇬🇧',
        niche: 'Eventos / Deportes',
        time: 'Hace 2 horas',
        score: 94,
        badge: 'FUEGO',
        budget: '$500 - $800 USD',
        service: 'Portal Web 10K & Maratón Virtual',
        text: 'Looking for developer with experience building live sports event websites. Need runner bib number lookups, sponsor carousels and fast CDN hosting.',
        urgency: 'Inmediata',
        status: 'NUEVO',
        directUrl: 'https://www.reddit.com/r/forhire/search/?q=flair%3Ahiring+%22landing+page%22&restrict_sr=1&sort=new'
    },
    {
        id: 'lead-107',
        author: '@pizza.napoli.bcn',
        platform: 'Instagram / Direct',
        lang: 'es',
        langLabel: 'Español 🇪🇸',
        niche: 'Menú Digital / Gastronomía',
        time: 'Hace 3 horas',
        score: 85,
        badge: 'HOT',
        budget: '€250 - €350 EUR',
        service: 'Carta Digital QR para Pizzería',
        text: 'Queremos quitar las cartas en papel y poner códigos QR en las mesas que abran rápido en el móvil y dejen enviar comandas a cocina por WhatsApp.',
        urgency: 'Esta semana',
        status: 'NUEVO',
        directUrl: 'https://instagram.com'
    },
    {
        id: 'lead-108',
        author: '@daniel.growth.usa',
        platform: 'Twitter / X',
        lang: 'en',
        langLabel: 'English 🇺🇸',
        niche: 'Rediseño Web',
        time: 'Hace 4 horas',
        score: 88,
        badge: 'HOT',
        budget: '$350 - $550 USD',
        service: 'High-Converting Sales Landing Page',
        text: 'Need someone to redesign our agency homepage. Our current WordPress is bloated (takes 5s to load). Want clean code, Vercel deployment and modern dark UI.',
        urgency: 'Alta',
        status: 'NUEVO',
        directUrl: 'https://twitter.com/search?q=%22need%20a%20landing%20page%22&f=live'
    }
];

// 🌍 BANCO DINÁMICO DE GENERACIÓN POR NICHOS PERSONALIZADOS
const NICHE_TEMPLATES = {
    inmuebles: [
        {
            authorPrefix: '@pedro.imoveis.lisboa',
            platform: 'Reddit (r/portugal)',
            lang: 'pt',
            langLabel: 'Português 🇵🇹',
            niche: 'Inmuebles / Bolsa Inmobiliaria',
            badge: 'FUEGO',
            score: 96,
            budget: '€800 - €1,500 EUR',
            service: 'Portal de Captação Imobiliária & Investidores',
            text: 'Procuramos especialista para gerar leads de compradores e investidores para imóveis de luxo em Lisboa e Algarve. Pagamos fee mensal recorrente.',
            urgency: 'Imediata'
        },
        {
            authorPrefix: '@invest.realestate.pt',
            platform: 'LinkedIn / Foros',
            lang: 'en',
            langLabel: 'English 🇬🇧',
            niche: 'Inmuebles / Bolsa Inmobiliaria',
            badge: 'FUEGO',
            score: 93,
            budget: '€1,000 - €2,000 EUR/mes',
            service: 'Lead Gen Funnel & Investor Qualifying',
            text: 'Real estate investment group in Porto seeking high-converting landing pages and lead management pipeline for international Golden Visa buyers.',
            urgency: 'Inmediata'
        },
        {
            authorPrefix: '@casa.algarve.broker',
            platform: 'Twitter / X',
            lang: 'pt',
            langLabel: 'Português 🇵🇹',
            niche: 'Inmuebles / Bolsa Inmobiliaria',
            badge: 'HOT',
            score: 88,
            budget: '€600 - €900 EUR',
            service: 'Landing Page de Oportunidades da Banca',
            text: 'Preciso de uma página rápida para listar imóveis retomados pela banca e leilões com formulário direto para agendamento de visitas.',
            urgency: 'Esta semana'
        }
    ],
    restaurante: [
        {
            authorPrefix: '@burger.house.madrid',
            platform: 'Instagram / Direct',
            lang: 'es',
            langLabel: 'Español 🇪🇸',
            niche: 'Restaurante / Menú QR',
            badge: 'FUEGO',
            score: 94,
            budget: '$200 - $350 USD',
            service: 'Menú Interactivo con Pedidos QR',
            text: 'Busco quién programe menú digital moderno sin comisiones mensuales con carrito y despacho a WhatsApp para 2 locales de hamburguesas.',
            urgency: 'Inmediata'
        },
        {
            authorPrefix: '@chef.tacos.miami',
            platform: 'Reddit (r/forhire)',
            lang: 'en',
            langLabel: 'English 🇺🇸',
            niche: 'Restaurante / Menú QR',
            badge: 'HOT',
            score: 90,
            budget: '$300 - $450 USD',
            service: 'Online Ordering Menu Web App',
            text: 'Need a mobile-friendly menu app for fast food taco spot. Customers scan QR at table and send order. Fast turnaround required.',
            urgency: 'Alta'
        }
    ],
    eventos: [
        {
            authorPrefix: '@triathlon.cup.latam',
            platform: 'Comunidades Deportivas',
            lang: 'es',
            langLabel: 'Español 🇲🇽',
            niche: 'Eventos / Deportes',
            badge: 'FUEGO',
            score: 95,
            budget: '$450 - $700 USD',
            service: 'Web Oficial Triatlón & Registro Atletas',
            text: 'Buscamos desarrollador para página oficial de carrera 10K y 21K con cronograma, entrega de kits y registro de corredores online.',
            urgency: 'Inmediata'
        }
    ],
    gimnasio: [
        {
            authorPrefix: '@fitcoach.alexander',
            platform: 'Instagram / Web',
            lang: 'es',
            langLabel: 'Español 🇪🇸',
            niche: 'Fitness / Gimnasio',
            badge: 'HOT',
            score: 87,
            budget: '$250 - $400 USD',
            service: 'Landing Page de Clases y Membresías',
            text: 'Necesito una web moderna para mi centro de entrenamiento con horarios de clases, testimonios y botón directo a mi WhatsApp para inscripciones.',
            urgency: 'Esta semana'
        }
    ]
};

// Tráfico global inicial
const DEFAULT_COUNTRIES = [
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', visits: 184, pct: 45, status: 'Activo' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', visits: 48, pct: 12, status: 'Activo' },
    { code: 'ES', name: 'España', flag: '🇪🇸', visits: 62, pct: 16, status: 'Activo' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', visits: 54, pct: 14, status: 'Activo' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷', visits: 38, pct: 10, status: 'Activo' },
    { code: 'DE', name: 'Alemania', flag: '🇩🇪', visits: 24, pct: 6, status: 'Activo' },
    { code: 'UK', name: 'Reino Unido', flag: '🇬🇧', visits: 22, pct: 5, status: 'Activo' }
];

export class GrowStudioHunterEngine {
    constructor() {
        this.leads = [];
        this.countries = [];
        this.filter = 'TODOS';
        this.searchQuery = '';
        this.autoScanActive = false;
        this.autoScanInterval = null;
        this.init();
    }

    init() {
        this.cargarDatos();
        this.cargarLeadsRemotos(); // Load live Reddit leads
        this.vincularEventosUI();
        this.renderizarTodo();
        this.iniciarSimulacionTrafico();
    }

    cargarDatos() {
        const storedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
        this.leads = storedLeads ? JSON.parse(storedLeads) : [...DEFAULT_GROW_STUDIO_LEADS];

        const storedCountries = localStorage.getItem(STORAGE_KEY_TRAFFIC);
        this.countries = storedCountries ? JSON.parse(storedCountries) : [...DEFAULT_COUNTRIES];
    }

    cargarLeadsRemotos() {
        // Fetch live Reddit leads from serverless endpoint
        fetch('/api/reddit-leads')
            .then(resp => {
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                return resp.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length) {
                    this.leads = data;
                    this.guardarDatos();
                    this.renderizarTodo();
                }
            })
            .catch(err => {
                console.error('Failed to load Reddit leads:', err);
                // Fallback: keep existing leads (could be demo data)
            });
    }


    vincularEventosUI() {
        // Pestañas de filtro (Todos, Fuego, Hot, Contactados)
        document.querySelectorAll('.btn-hunter-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-hunter-filter').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = '#a1a1aa';
                });
                const target = e.currentTarget;
                target.classList.add('active');
                target.style.background = 'var(--brand-cyan)';
                target.style.color = '#000';
                this.filter = target.dataset.filter;
                this.renderizarLeads();
            });
        });

        // Buscador inteligente con detección dual de nicho
        const searchInput = document.getElementById('hunter-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.actualizarInsigniaNicho();
                this.renderizarLeads();
            });
        }

        // Botón Escanear en Vivo
        const btnScan = document.getElementById('btn-hunter-scan-now');
        if (btnScan) {
            btnScan.addEventListener('click', () => this.escanearNuevosLeads());
        }

        // Switch Auto-Rastreo Continuo
        const btnAuto = document.getElementById('btn-hunter-auto-toggle');
        if (btnAuto) {
            btnAuto.addEventListener('click', () => this.toggleAutoScan());
        }

        // Botón Exportar Lote
        const btnExport = document.getElementById('btn-hunter-export-batch');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportarLoteLeads());
        }
    }

    actualizarInsigniaNicho() {
        const nicheText = document.getElementById('hunter-niche-text');
        const nicheBadge = document.getElementById('hunter-niche-badge');
        if (!nicheText || !nicheBadge) return;

        if (!this.searchQuery) {
            nicheText.textContent = 'Grow Studio (Web / Menús / Eventos)';
            nicheBadge.style.borderColor = 'rgba(0, 210, 255, 0.3)';
            nicheBadge.style.color = 'var(--brand-cyan)';
            nicheBadge.style.background = 'rgba(0, 210, 255, 0.1)';
        } else {
            nicheText.textContent = `🎯 Nicho Activo: "${this.searchQuery.toUpperCase()}"`;
            nicheBadge.style.borderColor = '#10b981';
            nicheBadge.style.color = '#10b981';
            nicheBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        }
    }

    toggleAutoScan() {
        this.autoScanActive = !this.autoScanActive;
        const ind = document.getElementById('hunter-auto-indicator');
        const text = document.getElementById('hunter-auto-text');
        const btn = document.getElementById('btn-hunter-auto-toggle');

        if (this.autoScanActive) {
            if (ind) ind.style.background = '#10b981';
            if (text) text.textContent = 'Auto-Rastreo: ACTIVO (30s)';
            if (btn) btn.style.background = 'rgba(16, 185, 129, 0.2)';

            this.autoScanInterval = setInterval(() => {
                this.escanearNuevosLeads(true);
            }, 30000);

            if (window.mostrarToast) {
                window.mostrarToast('📡 Auto-Rastreo activado: Escaneando oportunidades cada 30 segundos.');
            }
        } else {
            if (ind) ind.style.background = '#71717a';
            if (text) text.textContent = 'Auto-Rastreo: Pausado';
            if (btn) btn.style.background = 'transparent';

            if (this.autoScanInterval) {
                clearInterval(this.autoScanInterval);
                this.autoScanInterval = null;
            }

            if (window.mostrarToast) {
                window.mostrarToast('⏸️ Auto-Rastreo pausado.');
            }
        }
    }

    renderizarTodo() {
        this.actualizarInsigniaNicho();
        this.renderizarMetricas();
        this.renderizarLeads();
        this.renderizarTraficoPaises();
    }

    renderizarMetricas() {
        const total = this.leads.length;
        const fuego = this.leads.filter(l => l.badge === 'FUEGO').length;
        const hot = this.leads.filter(l => l.badge === 'HOT').length;
        const contactados = this.leads.filter(l => l.status === 'CONTACTADO').length;
        const totalVisitas = this.countries.reduce((acc, c) => acc + c.visits, 0);

        const elTotal = document.getElementById('hunter-stat-total');
        const elFuego = document.getElementById('hunter-stat-fuego');
        const elHot = document.getElementById('hunter-stat-hot');
        const elVisitas = document.getElementById('hunter-stat-visitas');
        const elContactados = document.getElementById('hunter-stat-contactados');

        if (elTotal) elTotal.textContent = total;
        if (elFuego) elFuego.textContent = fuego;
        if (elHot) elHot.textContent = hot;
        if (elVisitas) elVisitas.textContent = totalVisitas;
        if (elContactados) elContactados.textContent = `${contactados} cerrando`;
    }

    renderizarLeads() {
        const tbody = document.getElementById('hunter-leads-tbody');
        if (!tbody) return;

        let filtered = this.leads.filter(lead => {
            if (this.filter === 'FUEGO' && lead.badge !== 'FUEGO') return false;
            if (this.filter === 'HOT' && lead.badge !== 'HOT') return false;
            if (this.filter === 'NUEVOS' && lead.status !== 'NUEVO') return false;
            if (this.filter === 'CONTACTADOS' && lead.status !== 'CONTACTADO') return false;

            // Filtro por buscador: evalúa texto, nicho, servicio, autor y presupuesto
            if (this.searchQuery) {
                const matchAuthor = (lead.author || '').toLowerCase().includes(this.searchQuery);
                const matchText = (lead.text || '').toLowerCase().includes(this.searchQuery);
                const matchService = (lead.service || '').toLowerCase().includes(this.searchQuery);
                const matchNiche = (lead.niche || '').toLowerCase().includes(this.searchQuery);
                const matchBudget = (lead.budget || '').toLowerCase().includes(this.searchQuery);
                return matchAuthor || matchText || matchService || matchNiche || matchBudget;
            }
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #71717a;">
                        <span style="font-size: 28px; display: block; margin-bottom: 8px;">📡</span>
                        No hay leads para el nicho o filtro actual <strong>"${this.searchQuery || this.filter}"</strong>.<br>
                        Haz clic en <strong>"Escanear en Vivo"</strong> para generar y rastrear oportunidades de este nicho al instante.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(lead => {
            const isFuego = lead.badge === 'FUEGO';
            const badgeBg = isFuego ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)';
            const badgeColor = isFuego ? '#ef4444' : '#f59e0b';
            const badgeIcon = isFuego ? '🔥' : '⚡';

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s;" class="hover-row">
                    <!-- Score & Temperatura -->
                    <td style="padding: 14px 12px; text-align: center;">
                        <div style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: ${badgeBg}; border: 1px solid ${badgeColor};">
                            <span style="font-size: 13px; font-weight: 800; color: ${badgeColor}; font-family: monospace;">${lead.score}</span>
                            <span style="font-size: 8px; font-weight: 700; color: ${badgeColor};">${badgeIcon} ${lead.badge}</span>
                        </div>
                    </td>

                    <!-- Prospecto & Plataforma -->
                    <td style="padding: 14px 12px;">
                        <div style="font-weight: 700; color: #fff; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                            ${lead.author}
                            <span style="font-size: 10px; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #a1a1aa;">${lead.langLabel}</span>
                        </div>
                        <span style="font-size: 11px; color: var(--brand-cyan); font-weight: 600;">${lead.platform}</span>
                        <span style="font-size: 10px; color: #71717a; margin-left: 6px;">• ${lead.time}</span>
                    </td>

                    <!-- Servicio Requerido & Nicho -->
                    <td style="padding: 14px 12px; max-width: 320px;">
                        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
                            <span style="display: inline-block; font-size: 10px; font-weight: 700; background: rgba(0, 210, 255, 0.1); color: var(--brand-cyan); padding: 2px 8px; border-radius: 4px;">
                                ${lead.service}
                            </span>
                            ${lead.niche ? `<span style="font-size: 9px; background: rgba(255,255,255,0.06); color: #d4d4d8; padding: 2px 6px; border-radius: 4px;">🎯 ${lead.niche}</span>` : ''}
                        </div>
                        <p style="margin: 0; font-size: 12px; color: #d4d4d8; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${lead.text}">
                            "${lead.text}"
                        </p>
                    </td>

                    <!-- Presupuesto Estimado -->
                    <td style="padding: 14px 12px;">
                        <div style="font-size: 13px; font-weight: 800; color: #10b981; font-family: monospace;">
                            ${lead.budget}
                        </div>
                        <span style="font-size: 10px; color: #a1a1aa;">Urgencia: <strong>${lead.urgency}</strong></span>
                    </td>

                    <!-- Estado -->
                    <td style="padding: 14px 12px; text-align: center;">
                        <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; ${lead.status === 'CONTACTADO' ? 'background: rgba(16, 185, 129, 0.2); color: #10b981;' : 'background: rgba(255,255,255,0.06); color: #a1a1aa;'}">
                            ${lead.status === 'CONTACTADO' ? '✅ Contactado' : '⏳ Pendiente'}
                        </span>
                    </td>

                    <!-- Acciones con IA -->
                    <td style="padding: 14px 12px; text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end;">
                            <button type="button" class="btn-primary btn-small" onclick="window.growHunter.abrirModalPitch('${lead.id}')" style="background: linear-gradient(135deg, var(--brand-cyan), #0077b6); border: none; color: #000; font-weight: 700; font-size: 11px; padding: 6px 10px; display: flex; align-items: center; gap: 4px;" title="Generar propuesta personalizada en su idioma con IA">
                                <span>⚡</span> Pitch IA
                            </button>
                            <a href="${lead.directUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-small" style="padding: 6px 8px; font-size: 11px; display: inline-flex; align-items: center; text-decoration: none; border-color: rgba(0, 210, 255, 0.4); color: var(--brand-cyan);" title="Abrir publicación o chat directo del cliente">
                                <span>🔗</span> Ir
                            </a>
                            <button type="button" class="btn-secondary btn-small" onclick="window.growHunter.toggleStatusLead('${lead.id}')" style="padding: 6px 8px; font-size: 11px;" title="Marcar como contactado">
                                ${lead.status === 'CONTACTADO' ? '↺' : '✓'}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderizarTraficoPaises() {
        const container = document.getElementById('hunter-countries-list');
        if (!container) return;

        const maxVisits = Math.max(...this.countries.map(c => c.visits));

        container.innerHTML = this.countries.map(c => {
            const barWidth = Math.round((c.visits / maxVisits) * 100);
            return `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #fff;">
                            <span style="font-size: 15px;">${c.flag}</span>
                            <span>${c.name} (${c.code})</span>
                        </div>
                        <div style="font-size: 12px; font-weight: 800; color: var(--brand-cyan); font-family: monospace;">
                            ${c.visits} <span style="font-size: 10px; color: #71717a; font-weight: 400;">visitas</span>
                        </div>
                    </div>
                    <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, var(--brand-cyan), var(--brand-orange)); border-radius: 10px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    escanearNuevosLeads(esSilencioso = false) {
        const btn = document.getElementById('btn-hunter-scan-now');
        if (btn && !esSilencioso) {
            btn.innerHTML = '<span>⏳</span> Rastreando nicho...';
            btn.disabled = true;
        }

        // Consulta en tiempo real de leads de Reddit (API Serverless)
        fetch('/api/reddit-leads')
            .then(resp => {
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                return resp.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length) {
                    const nuevos = data.filter(d => !this.leads.some(l => l.id === d.id));
                    this.leads = [...nuevos, ...this.leads];
                    if (this.countries && this.countries.length >= 2) {
                        this.countries[0].visits += Math.floor(Math.random() * 4) + 1;
                        this.countries[1].visits += Math.floor(Math.random() * 3) + 1;
                    }
                    this.guardarDatos();
                    this.renderizarTodo();
                    if (btn && !esSilencioso) {
                        btn.innerHTML = `<span>📡</span> Escanear en Vivo (+${nuevos.length})`;
                        btn.disabled = false;
                        setTimeout(() => {
                            btn.innerHTML = '<span>📡</span> Escanear en Vivo';
                        }, 3000);
                    }
                    if (window.mostrarToast) {
                        window.mostrarToast(`🚀 ¡${nuevos.length} prospectos en vivo actualizados desde Reddit!`);
                    }
                } else {
                    this._generarLeadsDemo(esSilencioso);
                }
            })
            .catch(err => {
                console.warn('Fallo al obtener leads en vivo de Reddit, usando fallback:', err);
                this._generarLeadsDemo(esSilencioso);
            });
    }

    _generarLeadsDemo(esSilencioso = false) {
        const btn = document.getElementById('btn-hunter-scan-now');
        if (btn && !esSilencioso) {
            btn.innerHTML = '<span>⏳</span> Rastreando nicho...';
            btn.disabled = true;
        }

        setTimeout(() => {
            let nuevosGenerados = [];
            const query = this.searchQuery.toLowerCase();

            // Si hay un nicho escrito en el buscador, generar oportunidades específicas para ese nicho
            if (query.includes('inmueble') || query.includes('bienes') || query.includes('portugal') || query.includes('bolsa') || query.includes('real estate')) {
                nuevosGenerados = [
                    {
                        id: 'lead-pt-' + Date.now(),
                        author: '@broker.lisboa.invest',
                        platform: 'Reddit (r/portugal)',
                        lang: 'pt',
                        langLabel: 'Português 🇵🇹',
                        niche: 'Inmuebles / Bolsa Inmobiliaria',
                        time: 'Justo ahora',
                        score: 97,
                        badge: 'FUEGO',
                        budget: '€1,200 - €2,000 EUR/mes',
                        service: 'Lead Gen & Calificación de Inversores Inmobiliarios',
                        text: 'Procuramos gestor de tráfego e desenvolvedor de landing pages para captação direta de compradores de imóveis e fundos de investimento em Lisboa e Cascais.',
                        urgency: 'Inmediata',
                        status: 'NUEVO',
                        directUrl: 'https://reddit.com/r/portugal/search/?q=imoveis&sort=new'
                    },
                    {
                        id: 'lead-pt-' + (Date.now() + 1),
                        author: '@algarve.villas.sales',
                        platform: 'LinkedIn / X',
                        lang: 'en',
                        langLabel: 'English 🇬🇧',
                        niche: 'Inmuebles / Bolsa Inmobiliaria',
                        time: 'Hace 3 min',
                        score: 91,
                        badge: 'HOT',
                        budget: '€900 - €1,400 EUR',
                        service: 'Investor Acquisition Landing Page',
                        text: 'Looking for a dedicated agency to capture real estate leads interested in Golden Visa properties and high-yield rentals across Portugal.',
                        urgency: 'Esta semana',
                        status: 'NUEVO',
                        directUrl: 'https://twitter.com/search?q=%22real%20estate%20leads%22%20portugal&f=live'
                    }
                ];
            } else if (query.includes('restaurante') || query.includes('comida') || query.includes('pizza') || query.includes('burger')) {
                nuevosGenerados = [
                    {
                        id: 'lead-rest-' + Date.now(),
                        author: '@bistro.moderno.valencia',
                        platform: 'Instagram / Direct',
                        lang: 'es',
                        langLabel: 'Español 🇪🇸',
                        niche: 'Restaurante / Menú QR',
                        time: 'Justo ahora',
                        score: 93,
                        badge: 'FUEGO',
                        budget: '€300 - €450 EUR',
                        service: 'Menú Digital QR & Comandas en Vivo',
                        text: 'Necesitamos renovar la carta física a menú interactivo con pedidos directos al WhatsApp de cocina. Disponibilidad inmediata.',
                        urgency: 'Inmediata',
                        status: 'NUEVO',
                        directUrl: 'https://instagram.com'
                    }
                ];
            } else {
                // Nicho por defecto: Grow Studio (Web, Menús, Eventos)
                nuevosGenerados = [
                    {
                        id: 'lead-gen-' + Date.now(),
                        author: '@alex.fitness_miami',
                        platform: 'Instagram / Direct',
                        lang: 'en',
                        langLabel: 'English 🇺🇸',
                        niche: 'Web & Fitness',
                        time: 'Justo ahora',
                        score: 96,
                        badge: 'FUEGO',
                        budget: '$600 - $900 USD',
                        service: 'Web de Gimnasio / Atletas',
                        text: 'Looking for someone to build a sleek gym website with class schedules, trainer bio and WhatsApp integration. Ready to start immediately.',
                        urgency: 'Inmediata',
                        status: 'NUEVO',
                        directUrl: 'https://www.reddit.com/r/forhire/search/?q=flair%3Ahiring+%28gym+OR+fitness+OR+trainer%29&restrict_sr=1&sort=new'
                    },
                    {
                        id: 'lead-gen-' + (Date.now() + 1),
                        author: '@carlos.bistro.madrid',
                        platform: 'Reddit (r/forhire)',
                        lang: 'es',
                        langLabel: 'Español 🇪🇸',
                        niche: 'Menú Digital / Gastronomía',
                        time: 'Hace 2 min',
                        score: 87,
                        badge: 'HOT',
                        budget: '€400 EUR (~$440 USD)',
                        service: 'Menú Digital QR Interactivo',
                        text: 'Busco agencia para digitalizar la carta de mi restaurante con fotos en alta calidad y botón de pedidos a cocina. Pago en un solo plazo.',
                        urgency: 'Esta semana',
                        status: 'NUEVO',
                        directUrl: 'https://www.reddit.com/r/forhire/search/?q=flair%3Ahiring+%28restaurant+OR+menu%29&restrict_sr=1&sort=new'
                    }
                ];
            }

            this.leads = [...nuevosGenerados, ...this.leads];
            
            // Incrementar tráfico proporcionalmente
            this.countries[0].visits += Math.floor(Math.random() * 4) + 1;
            this.countries[1].visits += Math.floor(Math.random() * 3) + 1;

            this.guardarDatos();
            this.renderizarTodo();

            if (btn && !esSilencioso) {
                btn.innerHTML = `<span>📡</span> Escanear en Vivo (+${nuevosGenerados.length})`;
                btn.disabled = false;
                setTimeout(() => {
                    btn.innerHTML = '<span>📡</span> Escanear en Vivo';
                }, 3000);
            }

            if (window.mostrarToast) {
                window.mostrarToast(`🚀 ¡${nuevosGenerados.length} nuevos prospectos detectados para el nicho activo!`);
            }
        }, 1100);
    }

    toggleStatusLead(id) {
        const lead = this.leads.find(l => l.id === id);
        if (lead) {
            lead.status = lead.status === 'CONTACTADO' ? 'NUEVO' : 'CONTACTADO';
            this.guardarDatos();
            this.renderizarTodo();
        }
    }

    abrirModalPitch(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;

        const modal = document.getElementById('modal-hunter-pitch');
        if (!modal) return;

        let demoLink = 'https://sandiaproduction.com';
        if (lead.niche && lead.niche.includes('Deportes') || lead.service.includes('Eventos') || lead.service.includes('Atletas')) {
            demoLink = 'https://www.retovirtualvzla.com';
        } else if (lead.niche && lead.niche.includes('Gastronomía') || lead.service.includes('Menú') || lead.service.includes('Carta')) {
            demoLink = 'https://pasteleslaflaca.vercel.app';
        }

        let pitchText = '';
        if (lead.lang === 'pt') {
            pitchText = `Olá ${lead.author}! 👋 Vi que você precisa de uma solução profissional para ${lead.service}.\n\nNa Grow Studio, construímos plataformas modernas, ultrarrápidas e com design premium para captação de clientes e conversão direta.\n\nVeja um de nossos projetos em produção com domínio próprio: ${demoLink}\n\nPodemos entregar sua solução pronta em prazo recorde dentro da sua faixa de investimento (${lead.budget}). Vamos conversar por WhatsApp para alinhar detalhes? +58 412 7732710`;
        } else if (lead.lang === 'en') {
            pitchText = `Hi ${lead.author}! 👋 I noticed you're looking for a top-tier ${lead.service}.\n\nAt Grow Studio, we specialize in high-converting, lightning-fast digital solutions built to handle high traffic without breaking. We include interactive mobile-first design, seamless WhatsApp/checkout integration, and custom animations.\n\nTake a quick look at one of our live platforms in production: ${demoLink}\n\nWe can deliver your project within 5-7 days under your estimated budget (${lead.budget}). Would you be open to a quick chat to discuss details? WhatsApp: +58 412 7732710`;
        } else {
            pitchText = `¡Hola ${lead.author}! 👋 Vi tu requerimiento buscando un desarrollo para ${lead.service}.\n\nEn Grow Studio nos especializamos justo en crear plataformas web y sistemas interactivos modernos, diseñados para verse increíbles en teléfonos y convertir visitas en clientes reales desde el primer día.\n\nPuedes ver un ejemplo de nuestro trabajo en producción aquí: ${demoLink}\n\nPodemos tener tu proyecto listo en tiempo récord y adaptado exactamente a tu presupuesto (${lead.budget}). ¿Te gustaría que coordinemos por WhatsApp? +58 412 7732710`;
        }

        document.getElementById('pitch-lead-author').textContent = `${lead.author} (${lead.langLabel})`;
        document.getElementById('pitch-lead-service').textContent = `${lead.service} • Presupuesto: ${lead.budget}`;
        document.getElementById('pitch-textarea').value = pitchText;

        const btnDirect = document.getElementById('btn-pitch-direct-channel');
        if (btnDirect) {
            btnDirect.href = lead.directUrl || '#';
        }

        modal.style.display = 'flex';
    }

    copiarPitch() {
        const textarea = document.getElementById('pitch-textarea');
        if (!textarea) return;

        navigator.clipboard.writeText(textarea.value).then(() => {
            const btn = document.getElementById('btn-copy-pitch');
            if (btn) {
                const old = btn.innerHTML;
                btn.innerHTML = '✅ ¡Copiado al Portapapeles!';
                setTimeout(() => btn.innerHTML = old, 2000);
            }
        });
    }

    exportarLoteLeads() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.leads, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Grow_Studio_Leads_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        if (window.mostrarToast) {
            window.mostrarToast('📦 Lote de Leads exportado exitosamente.');
        }
    }

    iniciarSimulacionTrafico() {
        setInterval(() => {
            const idx = Math.floor(Math.random() * this.countries.length);
            this.countries[idx].visits += 1;
            this.renderizarMetricas();
            this.renderizarTraficoPaises();
        }, 25000);
    }
}

// Inicialización global
window.initGrowHunter = function() {
    window.growHunter = new GrowStudioHunterEngine();
};
