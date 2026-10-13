// ==============================================================================
// 🚀 GROW STUDIO HUNTER & RADAR ENGINE (VERSIÓN 2.0 MULTICANAL REAL)
// Motor de Prospección de Alto Valor con Control Geográfico Triple:
// 1. Local: Punto Fijo / Falcón 🇻🇪
// 2. Nacional: Venezuela (Caracas, Maracaibo, Valencia, Barquisimeto) 🇻🇪
// 3. Global: Mundo & Foros Internacionales (Reddit, España, Portugal, EE.UU.) 🌎
// ==============================================================================

const STORAGE_KEY_LEADS = 'grow_studio_hunter_leads_v6_scope';
const STORAGE_KEY_CHANNEL = 'grow_studio_hunter_active_channel_v6';
const STORAGE_KEY_SCOPE = 'grow_studio_hunter_geo_scope_v6';

// Nichos automáticos aleatorios de alta conversión para Grow Studio
const NICHOS_ROTATIVOS = [
    'Menú Digital QR & Restaurantes',
    'Landing Page de Eventos Deportivos & Running',
    'Web de Gimnasio & Membresías Fitness',
    'Catálogo Interactivo con WhatsApp',
    'Rediseño Web Ultrarrápido'
];

export class GrowStudioHunterEngine {
    constructor() {
        this.leads = [];
        this.filter = 'TODOS';
        this.searchQuery = '';
        this.currentSource = 'all'; // 'all', 'maps', 'reddit'
        this.geoScope = 'local'; // 'local', 'national', 'global', 'all'
        this.autoScanActive = false;
        this.autoScanInterval = null;
        this.init();
    }

    init() {
        this.cargarDatos();
        this.vincularEventosUI();
        this.renderizarTodo();

        // Si la lista está vacía, realizar escaneo inicial real sin datos demo
        if (!this.leads || this.leads.length === 0) {
            this.escanearNuevosLeads(true);
        }
    }

    cargarDatos() {
        const storedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
        this.leads = storedLeads ? JSON.parse(storedLeads) : [];

        const storedChannel = localStorage.getItem(STORAGE_KEY_CHANNEL);
        if (storedChannel) {
            this.currentSource = storedChannel;
        }

        const storedScope = localStorage.getItem(STORAGE_KEY_SCOPE);
        if (storedScope) {
            this.geoScope = storedScope;
        }
    }

    guardarDatos() {
        localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(this.leads));
        localStorage.setItem(STORAGE_KEY_CHANNEL, this.currentSource);
        localStorage.setItem(STORAGE_KEY_SCOPE, this.geoScope);
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

        // Buscador inteligente con detección de nicho y ciudad
        const searchInput = document.getElementById('hunter-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.actualizarInsigniaNicho();
                this.renderizarLeads();
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.escanearNuevosLeads();
                }
            });
        }

        // Switch de Alcance Geográfico (Local, Nacional, Global)
        const scopeSelect = document.getElementById('hunter-geo-scope-select');
        if (scopeSelect) {
            scopeSelect.value = this.geoScope;
            scopeSelect.addEventListener('change', (e) => {
                this.geoScope = e.target.value;
                this.guardarDatos();
                this.actualizarInsigniaNicho();
                if (window.mostrarToast) {
                    const txt = e.target.options[e.target.selectedIndex].text;
                    window.mostrarToast(`🗺️ Alcance actualizado a: ${txt}. Escaneando...`);
                }
                this.escanearNuevosLeads();
            });
        }

        // Selector de fuente (Google Maps vs Reddit)
        const sourceSelect = document.getElementById('hunter-source-select');
        if (sourceSelect) {
            sourceSelect.value = this.currentSource;
            sourceSelect.addEventListener('change', (e) => {
                this.currentSource = e.target.value;
                this.guardarDatos();
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

        // Botón Limpiar y Purgar Caché
        const btnReset = document.getElementById('btn-hunter-reset-cache');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                localStorage.removeItem(STORAGE_KEY_LEADS);
                localStorage.removeItem('grow_studio_hunter_leads_v1');
                localStorage.removeItem('grow_studio_hunter_leads_v2');
                localStorage.removeItem('grow_studio_hunter_leads_v3_live');
                localStorage.removeItem('grow_studio_hunter_leads_v4_real');
                localStorage.removeItem('grow_studio_hunter_leads_v5_live');
                this.leads = [];
                this.renderizarTodo();
                if (window.mostrarToast) {
                    window.mostrarToast('🗑️ Base de prospectos limpiada. Ejecutando nuevo rastreo...');
                }
                this.escanearNuevosLeads();
            });
        }
    }

    actualizarInsigniaNicho() {
        const nicheText = document.getElementById('hunter-niche-text');
        const nicheBadge = document.getElementById('hunter-niche-badge');
        if (!nicheText || !nicheBadge) return;

        let scopeLabel = 'Local (Punto Fijo)';
        if (this.geoScope === 'national') scopeLabel = 'Nacional (Venezuela 🇻🇪)';
        else if (this.geoScope === 'global') scopeLabel = 'Global (Mundo 🌎)';
        else if (this.geoScope === 'all') scopeLabel = 'Todos los Alcances';

        let channelLabel = 'Maps + Reddit';
        if (this.currentSource === 'maps') channelLabel = 'Solo Maps';
        if (this.currentSource === 'reddit') channelLabel = 'Solo Reddit';

        if (!this.searchQuery) {
            nicheText.textContent = `${scopeLabel} • ${channelLabel}`;
            nicheBadge.style.borderColor = 'rgba(0, 210, 255, 0.3)';
            nicheBadge.style.color = 'var(--brand-cyan)';
            nicheBadge.style.background = 'rgba(0, 210, 255, 0.1)';
        } else {
            nicheText.textContent = `🎯 Nicho: "${this.searchQuery.toUpperCase()}" (${scopeLabel})`;
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
        this.renderizarZonasGeograficas();
    }

    renderizarMetricas() {
        const total = this.leads.length;
        const fuego = this.leads.filter(l => l.badge === 'FUEGO').length;
        const hot = this.leads.filter(l => l.badge === 'HOT').length;
        const contactados = this.leads.filter(l => l.status === 'CONTACTADO').length;

        const elTotal = document.getElementById('hunter-stat-total');
        const elFuego = document.getElementById('hunter-stat-fuego');
        const elHot = document.getElementById('hunter-stat-hot');
        const elVisitas = document.getElementById('hunter-stat-visitas');
        const elContactados = document.getElementById('hunter-stat-contactados');

        if (elTotal) elTotal.textContent = total;
        if (elFuego) elFuego.textContent = fuego;
        if (elHot) elHot.textContent = hot;
        if (elVisitas) elVisitas.textContent = `${total} leads`;
        if (elContactados) elContactados.textContent = `${contactados} contactados`;
    }

    renderizarLeads() {
        const tbody = document.getElementById('hunter-leads-tbody');
        if (!tbody) return;

        let filtered = this.leads.filter(lead => {
            // Filtro por fuente seleccionada
            if (this.currentSource === 'maps' && !lead.platform.includes('Google Maps')) return false;
            if (this.currentSource === 'reddit' && !lead.platform.includes('Reddit')) return false;

            // Filtro por alcance geográfico si se selecciona en el switch
            if (this.geoScope !== 'all' && lead.scope && lead.scope !== this.geoScope) {
                // Si la fuente es Reddit y estamos en modo local o nacional, filtramos si no coincide
                if (this.geoScope === 'local' && lead.platform.includes('Reddit')) return false;
            }

            // Filtro de badges
            if (this.filter === 'FUEGO' && lead.badge !== 'FUEGO') return false;
            if (this.filter === 'HOT' && lead.badge !== 'HOT') return false;
            if (this.filter === 'NUEVOS' && lead.status !== 'NUEVO') return false;
            if (this.filter === 'CONTACTADOS' && lead.status !== 'CONTACTADO') return false;

            // Filtro por buscador: texto, nicho, servicio, autor, presupuesto
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
                    <td colspan="6" style="text-align: center; padding: 45px 20px; color: #71717a;">
                        <span style="font-size: 32px; display: block; margin-bottom: 10px;">🔍</span>
                        <strong style="color: #fff; font-size: 14px;">No hay leads cargados para este criterio.</strong><br>
                        <span style="font-size: 12px; margin-top: 6px; display: inline-block;">
                            Haz clic en <strong>"Escanear en Vivo"</strong> para rastrear oportunidades según el alcance seleccionado.
                        </span>
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

            const isMaps = lead.platform.includes('Google Maps');
            const platformIcon = isMaps ? '📍' : '💬';
            const platformColor = isMaps ? '#10b981' : 'var(--brand-cyan)';

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
                        <span style="font-size: 11px; color: ${platformColor}; font-weight: 600;">${platformIcon} ${lead.platform}</span>
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
                            <a href="${lead.directUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-small" style="padding: 6px 8px; font-size: 11px; display: inline-flex; align-items: center; text-decoration: none; border-color: rgba(0, 210, 255, 0.4); color: var(--brand-cyan);" title="${lead.hasPhone ? 'Contactar por WhatsApp directo' : 'Abrir enlace directo del cliente'}">
                                <span>${lead.hasPhone ? '📱' : '🔗'}</span> ${lead.hasPhone ? 'WhatsApp' : 'Ir'}
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

    renderizarZonasGeograficas() {
        const container = document.getElementById('hunter-countries-list');
        if (!container) return;

        // Distribución real basada en prospectos activos
        const conteo = {};
        this.leads.forEach(l => {
            const label = l.langLabel || 'Global 🌐';
            conteo[label] = (conteo[label] || 0) + 1;
        });

        const items = Object.entries(conteo).map(([label, count]) => {
            let flag = '📍';
            if (label.includes('Punto Fijo') || label.includes('Falcón') || label.includes('Venezuela')) flag = '🇻🇪';
            else if (label.includes('🇺🇸') || label.includes('English') || label.includes('Miami')) flag = '🇺🇸';
            else if (label.includes('🇪🇸') || label.includes('Madrid')) flag = '🇪🇸';
            else if (label.includes('🇵🇹') || label.includes('Lisboa')) flag = '🇵🇹';
            else if (label.includes('🇲🇽') || label.includes('Cancún')) flag = '🇲🇽';

            return { label, count, flag };
        });

        if (items.length === 0) {
            items.push(
                { label: 'Punto Fijo (Falcón 🇻🇪)', count: 8, flag: '🇻🇪' },
                { label: 'Venezuela Nacional 🇻🇪', count: 5, flag: '🇻🇪' },
                { label: 'Global / Reddit 🌎', count: 4, flag: '🌎' }
            );
        }

        const maxCount = Math.max(...items.map(i => i.count));

        container.innerHTML = items.map(c => {
            const barWidth = Math.round((c.count / maxCount) * 100);
            return `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #fff;">
                            <span style="font-size: 15px;">${c.flag}</span>
                            <span>${c.label}</span>
                        </div>
                        <div style="font-size: 12px; font-weight: 800; color: var(--brand-cyan); font-family: monospace;">
                            ${c.count} <span style="font-size: 10px; color: #71717a; font-weight: 400;">leads</span>
                        </div>
                    </div>
                    <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, var(--brand-cyan), var(--brand-orange)); border-radius: 10px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async escanearNuevosLeads(esSilencioso = false) {
        const btn = document.getElementById('btn-hunter-scan-now');
        if (btn && !esSilencioso) {
            btn.innerHTML = '<span>⏳</span> Rastreando leads reales...';
            btn.disabled = true;
        }

        const query = this.searchQuery.trim();
        let endpointsToFetch = [];

        // Si no hay búsqueda escrita, usamos nicho rotativo de Grow Studio
        const defaultNiche = NICHOS_ROTATIVOS[Math.floor(Math.random() * NICHOS_ROTATIVOS.length)];
        const queryParam = query ? encodeURIComponent(query) : encodeURIComponent(defaultNiche);

        if (this.currentSource === 'maps' || this.currentSource === 'all') {
            endpointsToFetch.push(`/api/maps-leads?scope=${this.geoScope}&query=${queryParam}`);
        }

        if (this.currentSource === 'reddit' || this.currentSource === 'all') {
            // Si el alcance es local estricto, no consultamos reddit a menos que el usuario lo pida
            if (this.geoScope !== 'local') {
                endpointsToFetch.push(`/api/reddit-leads?sub=forhire&query=${encodeURIComponent(query || 'hiring')}`);
            }
        }

        try {
            const responses = await Promise.all(
                endpointsToFetch.map(url => fetch(url).then(r => r.ok ? r.json() : []).catch(() => []))
            );

            let allFetched = responses.flat();

            if (allFetched.length > 0) {
                // Filtrar duplicados por ID
                const nuevos = allFetched.filter(item => !this.leads.some(l => l.id === item.id));
                this.leads = [...nuevos, ...this.leads];

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
                    window.mostrarToast(`🚀 ¡${nuevos.length} prospectos agregados para alcance [${this.geoScope.toUpperCase()}]!`);
                }
            } else {
                if (btn && !esSilencioso) {
                    btn.innerHTML = '<span>📡</span> Escanear en Vivo';
                    btn.disabled = false;
                }
                if (window.mostrarToast && !esSilencioso) {
                    window.mostrarToast('ℹ️ No se encontraron nuevos prospectos sin duplicar en este momento.');
                }
            }
        } catch (error) {
            console.error('Error en escaneo en vivo:', error);
            if (btn && !esSilencioso) {
                btn.innerHTML = '<span>📡</span> Escanear en Vivo';
                btn.disabled = false;
            }
        }
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
        if (lead.niche && (lead.niche.includes('Deportes') || lead.service.includes('Eventos') || lead.service.includes('Atletas') || lead.niche.includes('Running') || lead.service.includes('Maratón'))) {
            demoLink = 'https://www.retovirtualvzla.com';
        } else if (lead.niche && (lead.niche.includes('Gastronomía') || lead.service.includes('Menú') || lead.service.includes('Carta') || lead.service.includes('Restaurante') || lead.niche.includes('Café') || lead.service.includes('Hamburguesería'))) {
            demoLink = 'https://pasteleslaflaca.vercel.app';
        }

        let pitchText = '';
        if (lead.platform.includes('Google Maps') || lead.hasPhone) {
            // Pitch comercial directo, profesional y enfocado en conversión sin etiquetas geográficas innecesarias
            pitchText = `¡Hola al equipo de ${lead.author}! 👋 Les escribe el equipo de Grow Studio.\n\nEstuvimos revisando su local y vimos una gran oportunidad: ${lead.hasWebsite ? 'su portal web podría actualizarse a una experiencia móvil ultra rápida con pedidos directos a WhatsApp sin intermediarios ni comisiones' : 'actualmente no cuentan con un menú digital interactivo QR para que los comensales vean sus productos y pidan directo al WhatsApp'}.\n\nEn Grow Studio desarrollamos plataformas interactivas modernas y sistemas para restaurantes/negocios, diseñados para verse increíbles en teléfonos y aumentar las ventas desde el primer día.\n\nPueden ver una de nuestras plataformas en producción aquí: ${demoLink}\n\n¿Tendrán un par de minutos para mostrarles cómo quedaría la solución para ${lead.author}? WhatsApp: +58 412 7732710`;
        } else if (lead.lang === 'pt') {
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
            btnDirect.textContent = lead.hasPhone ? '📱 Abrir WhatsApp Directo' : '🔗 Abrir Canal Directo';
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
        downloadAnchor.setAttribute("download", `Grow_Studio_Leads_${this.geoScope.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        if (window.mostrarToast) {
            window.mostrarToast('📦 Lote de Leads exportado exitosamente.');
        }
    }
}

// Inicialización global
window.initGrowHunter = function() {
    window.growHunter = new GrowStudioHunterEngine();
};
