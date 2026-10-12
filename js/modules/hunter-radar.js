// ==============================================================================
// 🚀 GROW STUDIO HUNTER & RADAR ENGINE (MODO $1,000M)
// Inteligencia Comercial, Escaneo Multicanal de Leads, Tráfico Global y Pitch Automático
// ==============================================================================

// Base de datos de simulación inteligente y persistencia local (localStorage)
const STORAGE_KEY_LEADS = 'grow_studio_hunter_leads_v1';
const STORAGE_KEY_TRAFFIC = 'grow_studio_hunter_traffic_v1';
const STORAGE_KEY_STATS = 'grow_studio_hunter_stats_v1';

// Muestras de Leads calibrados para Grow Studio (Desde $150 USD hasta $600 USD)
const DEFAULT_LEADS = [
    {
        id: 'lead-101',
        author: '@mario.martinezmartinez.524',
        platform: 'Reddit (r/forhire)',
        lang: 'es',
        langLabel: 'Español 🇪🇸',
        time: 'Hace 14 min',
        score: 95,
        badge: 'FUEGO',
        budget: '$180 - $250 USD',
        service: 'Menú Digital QR & Delivery',
        text: 'Hola, necesito confeccionar una página web o menú digital para una hamburguesería con pedidos directos al WhatsApp. Presupuesto disponible para empezar de una.',
        urgency: 'Inmediata',
        status: 'NUEVO'
    },
    {
        id: 'lead-102',
        author: '@m.mohsin8839',
        platform: 'Upwork / RSS',
        lang: 'en',
        langLabel: 'English 🇺🇸',
        time: 'Hace 32 min',
        score: 90,
        badge: 'FUEGO',
        budget: '$200 - $300 USD',
        service: 'Landing Page de Eventos / Atletas',
        text: 'I need website urgently 300$ for a sports event agency. Must include countdown, registration form and athlete list. Looking for professional agency.',
        urgency: 'Inmediata (24-48h)',
        status: 'NUEVO'
    },
    {
        id: 'lead-103',
        author: '@lucas.silva.tech',
        platform: 'Twitter / X',
        lang: 'pt',
        langLabel: 'Português 🇧🇷',
        time: 'Hace 1 hora',
        score: 84,
        badge: 'HOT',
        budget: '$350 - $500 USD',
        service: 'SaaS Dashboard / App Web',
        text: 'Preciso de um desenvolvedor para criar um painel administrativo moderno para franquias com visual escuro premium e métricas em tempo real.',
        urgency: 'Media (Este mes)',
        status: 'NUEVO'
    },
    {
        id: 'lead-104',
        author: '@estherkay21',
        platform: 'Reddit (r/freelance_forhire)',
        lang: 'en',
        langLabel: 'English 🇬🇧',
        time: 'Hace 2 horas',
        score: 78,
        badge: 'HOT',
        budget: '$150 - $250 USD',
        service: 'Rediseño Web Rápido',
        text: 'Any modern web agency who can rebuild my boutique landing page with modern animations, video hero and clean mobile view? Please DM portfolios.',
        urgency: 'Esta semana',
        status: 'NUEVO'
    },
    {
        id: 'lead-105',
        author: '@carlos.valencia_ve',
        platform: 'Comunidad Emprendedores VE',
        lang: 'es',
        langLabel: 'Español 🇻🇪',
        time: 'Hace 3 horas',
        score: 89,
        badge: 'HOT',
        budget: '$150 - $200 USD',
        service: 'Catálogo Interactivo de Ventas',
        text: 'Buenas tardes, busco quién me desarrolle una página catálogo para tienda de perfumes y ropa con botón directo a WhatsApp. Pago al contado.',
        urgency: 'Alta',
        status: 'NUEVO'
    }
];

// Tráfico global inicial
const DEFAULT_COUNTRIES = [
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', visits: 184, pct: 45, status: 'Activo' },
    { code: 'ES', name: 'España', flag: '🇪🇸', visits: 62, pct: 16, status: 'Activo' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', visits: 54, pct: 14, status: 'Activo' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷', visits: 38, pct: 10, status: 'Activo' },
    { code: 'DE', name: 'Alemania', flag: '🇩🇪', visits: 24, pct: 6, status: 'Activo' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', visits: 19, pct: 5, status: 'Activo' },
    { code: 'JP', name: 'Japón', flag: '🇯🇵', visits: 12, pct: 4, status: 'Activo' }
];

export class GrowStudioHunterEngine {
    constructor() {
        this.leads = [];
        this.countries = [];
        this.filter = 'TODOS';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.cargarDatos();
        this.vincularEventosUI();
        this.renderizarTodo();
        this.iniciarSimulacionEnVivo();
    }

    cargarDatos() {
        const storedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
        this.leads = storedLeads ? JSON.parse(storedLeads) : [...DEFAULT_LEADS];

        const storedCountries = localStorage.getItem(STORAGE_KEY_TRAFFIC);
        this.countries = storedCountries ? JSON.parse(storedCountries) : [...DEFAULT_COUNTRIES];
    }

    guardarDatos() {
        localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(this.leads));
        localStorage.setItem(STORAGE_KEY_TRAFFIC, JSON.stringify(this.countries));
    }

    vincularEventosUI() {
        // Pestañas de filtro
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

        // Buscador de leads
        const searchInput = document.getElementById('hunter-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderizarLeads();
            });
        }

        // Botón Escanear en Vivo
        const btnScan = document.getElementById('btn-hunter-scan-now');
        if (btnScan) {
            btnScan.addEventListener('click', () => this.escanearNuevosLeads());
        }

        // Botón Exportar Lote para Vender
        const btnExport = document.getElementById('btn-hunter-export-batch');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportarLoteLeads());
        }
    }

    renderizarTodo() {
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

            if (this.searchQuery) {
                const matchAuthor = lead.author.toLowerCase().includes(this.searchQuery);
                const matchText = lead.text.toLowerCase().includes(this.searchQuery);
                const matchService = lead.service.toLowerCase().includes(this.searchQuery);
                return matchAuthor || matchText || matchService;
            }
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #71717a;">
                        <span style="font-size: 28px; display: block; margin-bottom: 8px;">📡</span>
                        No hay leads con los filtros actuales. Haz clic en <strong>"Escanear en Vivo"</strong> para rastrear más oportunidades.
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

                    <!-- Servicio Requerido & Mensaje -->
                    <td style="padding: 14px 12px; max-width: 320px;">
                        <span style="display: inline-block; font-size: 10px; font-weight: 700; background: rgba(0, 210, 255, 0.1); color: var(--brand-cyan); padding: 2px 8px; border-radius: 4px; margin-bottom: 4px;">
                            ${lead.service}
                        </span>
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

    escanearNuevosLeads() {
        const btn = document.getElementById('btn-hunter-scan-now');
        if (btn) {
            btn.innerHTML = '<span>⏳</span> Escaneando canales globales...';
            btn.disabled = true;
        }

        setTimeout(() => {
            const nuevosGenerados = [
                {
                    id: 'lead-' + Date.now(),
                    author: '@alex.fitness_miami',
                    platform: 'Instagram / Direct',
                    lang: 'en',
                    langLabel: 'English 🇺🇸',
                    time: 'Justo ahora',
                    score: 96,
                    badge: 'FUEGO',
                    budget: '$600 - $900 USD',
                    service: 'Web de Gimnasio / Entrenador',
                    text: 'Looking for someone to build a sleek gym website with class schedules, trainer bio and WhatsApp integration. Ready to start immediately.',
                    urgency: 'Inmediata',
                    status: 'NUEVO'
                },
                {
                    id: 'lead-' + (Date.now() + 1),
                    author: '@carlos.bistro.madrid',
                    platform: 'Reddit (r/startups)',
                    lang: 'es',
                    langLabel: 'Español 🇪🇸',
                    time: 'Hace 2 min',
                    score: 87,
                    badge: 'HOT',
                    budget: '€400 EUR (~$440 USD)',
                    service: 'Menú Digital QR Interactivo',
                    text: 'Busco agencia para digitalizar la carta de mi restaurante con fotos en alta calidad y botón de pedidos a cocina. Pago en un solo plazo.',
                    urgency: 'Esta semana',
                    status: 'NUEVO'
                }
            ];

            this.leads = [...nuevosGenerados, ...this.leads];
            // Sumar visitas aleatorias a países
            this.countries[0].visits += Math.floor(Math.random() * 5) + 2;
            this.countries[1].visits += Math.floor(Math.random() * 3) + 1;

            this.guardarDatos();
            this.renderizarTodo();

            if (btn) {
                btn.innerHTML = '<span>📡</span> Escanear en Vivo (+2 Encontrados)';
                btn.disabled = false;
                setTimeout(() => {
                    btn.innerHTML = '<span>📡</span> Escanear en Vivo';
                }, 3000);
            }

            if (window.mostrarToast) {
                window.mostrarToast('🚀 ¡2 nuevos clientes detectados con presupuesto activo!');
            }
        }, 1200);
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

        // Autogenerar propuesta persuasiva según idioma e industria (aplicando high-converting-copy)
        let pitchText = '';
        if (lead.lang === 'en') {
            pitchText = `Hi ${lead.author}! 👋 I noticed you're looking for a top-tier ${lead.service}.\n\nAt Grow Studio, we specialize in high-converting, lightning-fast digital solutions built to handle high traffic without breaking. We include interactive mobile-first design, seamless WhatsApp/checkout integration, and custom animations.\n\nTake a quick look at one of our live platforms: https://sandiaproduction.com\n\nWe can deliver your project within 5-7 days under your estimated budget (${lead.budget}). Would you be open to a quick 5-minute chat to discuss the details?`;
        } else if (lead.lang === 'pt') {
            pitchText = `Olá ${lead.author}! 👋 Vi que você está procurando um desenvolvimento de ${lead.service}.\n\nNa Grow Studio, construímos dashboards e plataformas modernas, ultrarrápidas e com design premium para marcas que querem escalar.\n\nVeja um de nossos projetos em produção: https://sandiaproduction.com\n\nPodemos entregar sua solução pronta em prazo recorde dentro da sua faixa de investimento (${lead.budget}). Vamos bater um papo rápido?`;
        } else if (lead.lang === 'de') {
            pitchText = `Hallo ${lead.author}! 👋 Ich habe gesehen, dass Sie eine professionelle Agentur für ${lead.service} suchen.\n\nBei Grow Studio entwickeln wir hochmoderne, mobiloptimierte Weblösungen mit extrem schnellen Ladezeiten und modernster Architektur.\n\nReferenz ansehen: https://sandiaproduction.com\n\nWir können Ihr Projekt termingerecht und innerhalb Ihres Budgets (${lead.budget}) realisieren. Wann passt Ihnen ein kurzes Gespräch?`;
        } else {
            pitchText = `¡Hola ${lead.author}! 👋 Vi tu publicación buscando un desarrollo para ${lead.service}.\n\nEn Grow Studio nos especializamos justo en crear plataformas web y sistemas interactivos modernos, diseñados para verse increíbles en teléfonos y convertir visitas en clientes reales desde el primer día.\n\nPuedes ver un ejemplo de nuestro trabajo en vivo aquí: https://sandiaproduction.com\n\nPodemos tener tu proyecto listo en tiempo récord y adaptado exactamente a tu presupuesto (${lead.budget}). ¿Te gustaría que te muestre una maqueta previa sin costo?`;
        }

        document.getElementById('pitch-lead-author').textContent = `${lead.author} (${lead.langLabel})`;
        document.getElementById('pitch-lead-service').textContent = `${lead.service} • Presupuesto: ${lead.budget}`;
        document.getElementById('pitch-textarea').value = pitchText;

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
        // Generar descarga de reporte de leads listo para vender o archivar
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.leads, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Grow_Studio_Leads_Report_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        if (window.mostrarToast) {
            window.mostrarToast('📦 Lote de Leads exportado exitosamente listo para comercializar.');
        }
    }

    iniciarSimulacionEnVivo() {
        // Incremento orgánico en visitas cada 35 segundos
        setInterval(() => {
            const idx = Math.floor(Math.random() * this.countries.length);
            this.countries[idx].visits += 1;
            this.renderizarMetricas();
            this.renderizarTraficoPaises();
        }, 35000);
    }
}

// Inicialización global
window.initGrowHunter = function() {
    window.growHunter = new GrowStudioHunterEngine();
};
