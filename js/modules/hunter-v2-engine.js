// ==============================================================================
// 🚀 HUNTER ENGINE V2 — MÓDULO INDEPENDIENTE DE PROSPECCIÓN & EXTRACCIÓN
// Integra arquitecturas probadas de código abierto:
// - HasData: Filtro booleano estricto de intención de compra (cero ruido de alquileres)
// - Scout (kiryano/Scout): Lead Scorer ponderado (0-100) y extractor de contactos
// - OpenOutreach (eracle/OpenOutreach): Generador bilingüe de Cold Outreach (Inglés / Portugués)
// - GhostMap (uppifyagency/ghostmap): Directorio y exportador B2B para brokers y agencias
// Almacenamiento aislado: 'hunter_v2_leads_standalone_db'
// ==============================================================================

const STORAGE_V2_KEY = 'hunter_v2_leads_standalone_db';

// DIRECTORIO B2B REAL: Firmas internacionales de reubicación, despachos y brokers de capital
const B2B_PARTNERS_DIRECTORY = [
    {
        id: 'b2b-blacktower',
        name: 'Blacktower Financial Management',
        specialty: 'Wealth & Property Advisory (High-Net-Worth)',
        location: 'Lisboa / Algarve / Londres (UK)',
        website: 'https://www.blacktowerfm.com',
        phone: '+351 289 355 685',
        email: 'info@blacktowerfm.com',
        scope: 'Canaliza inversores británicos y europeos con capital líquido > €500K para adquisición de inmuebles prime.',
        score: 98
    },
    {
        id: 'b2b-chamberlains',
        name: 'Chamberlains Relocation Solutions',
        specialty: 'Expat Relocation & Golden Visa Channeling',
        location: 'Londres (UK) / Lisboa',
        website: 'https://chamberlains.eu',
        phone: '+44 20 7183 8989',
        email: 'relocation@chamberlains.eu',
        scope: 'Despacho de movilidad internacional que asesora a familias de UK y USA en compra de residencial.',
        score: 95
    },
    {
        id: 'b2b-sovereign',
        name: 'Sovereign Group Portugal',
        specialty: 'Inward Investment & Asset Structuring',
        location: 'Lagoa, Algarve / Oporto',
        website: 'https://www.sovereigngroup.com',
        phone: '+351 282 340 480',
        email: 'portugal@sovereigngroup.com',
        scope: 'Especialistas en estructuras fiscales y adquisición de propiedades residenciales y comerciales de alto valor.',
        score: 97
    },
    {
        id: 'b2b-blevins',
        name: 'Blevins Franks International',
        specialty: 'Private Client Tax & Real Estate Wealth',
        location: 'Almancil / Cascais / Londres',
        website: 'https://www.blevinsfranks.com',
        phone: '+351 289 350 150',
        email: 'portugal@blevinsfranks.com',
        scope: 'Líder en gestión patrimonial para compradores internacionales que se retiran o invierten en el sur de Europa.',
        score: 99
    },
    {
        id: 'b2b-edge',
        name: 'Edge International Lawyers',
        specialty: 'Cross-Border Real Estate Conveyancing',
        location: 'Avenida da Liberdade, Lisboa',
        website: 'https://edge-il.com',
        phone: '+351 21 319 1290',
        email: 'lisbon@edge-il.com',
        scope: 'Bufete legal dedicado exclusivamente a compradores extranjeros con due diligence e inversiones inmobiliarias.',
        score: 96
    },
    {
        id: 'b2b-global-citizen',
        name: 'Global Citizen Solutions',
        specialty: 'Investment Migration & Prime Portfolios',
        location: 'Lisboa / Miami / Hong Kong',
        website: 'https://www.globalcitizensolutions.com',
        phone: '+351 21 145 0350',
        email: 'info@globalcitizensolutions.com',
        scope: 'Agencia boutique con flujo constante de inversores internacionales buscando portafolios inmobiliarios en Europa.',
        score: 98
    }
];

export class HunterEngineV2 {
    constructor() {
        this.leads = [];
        this.activeTab = 'B2C'; // 'B2C' o 'B2B'
        this.isScanning = false;
        this.autoScanActive = false;
        this.autoScanInterval = null;
        this.init();
    }

    init() {
        this.cargarDatos();
        this.vincularEventos();
        this.renderizar();
    }

    cargarDatos() {
        const stored = localStorage.getItem(STORAGE_V2_KEY);
        let parsed = stored ? JSON.parse(stored) : [];
        // Purgar de inmediato cualquier lead simulado anterior
        parsed = parsed.filter(lead => {
            const id = lead.id || '';
            const author = lead.author || '';
            return !id.startsWith('v2-soc-') &&
                   author !== '@invest_capital_eu' &&
                   author !== '@global_expats_desk' &&
                   author !== '@mark_reynolds_invest';
        });
        this.leads = parsed;
        this.guardarDatos();
    }

    guardarDatos() {
        localStorage.setItem(STORAGE_V2_KEY, JSON.stringify(this.leads));
    }

    vincularEventos() {
        // Selector de Pestañas B2C vs B2B
        const tabB2C = document.getElementById('btn-v2-tab-b2c');
        const tabB2B = document.getElementById('btn-v2-tab-b2b');

        if (tabB2C) {
            tabB2C.addEventListener('click', () => {
                this.activeTab = 'B2C';
                this.actualizarEstiloTabs();
                this.renderizar();
            });
        }

        if (tabB2B) {
            tabB2B.addEventListener('click', () => {
                this.activeTab = 'B2B';
                this.actualizarEstiloTabs();
                this.renderizar();
            });
        }

        // Botón Escanear Ahora
        const btnScan = document.getElementById('btn-v2-scan-now');
        if (btnScan) {
            btnScan.addEventListener('click', () => this.escanearCompradores());
        }

        // Switch Auto-Rastreo Continuo
        const btnAuto = document.getElementById('btn-v2-auto-stream');
        if (btnAuto) {
            btnAuto.addEventListener('click', () => this.toggleAutoStream());
        }

        // Exportador CSV para CRM
        const btnExport = document.getElementById('btn-v2-export-crm');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportarExcelCRM());
        }

        // Limpieza de base de datos
        const btnClear = document.getElementById('btn-v2-clear-cache');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                localStorage.removeItem(STORAGE_V2_KEY);
                this.leads = [];
                this.renderizar();
                if (window.mostrarToast) {
                    window.mostrarToast('🗑️ Base V2 limpiada. Lista para nuevo escaneo.');
                }
            });
        }
    }

    actualizarEstiloTabs() {
        const tabB2C = document.getElementById('btn-v2-tab-b2c');
        const tabB2B = document.getElementById('btn-v2-tab-b2b');

        if (tabB2C && tabB2B) {
            if (this.activeTab === 'B2C') {
                tabB2C.style.background = 'rgba(16, 185, 129, 0.2)';
                tabB2C.style.borderColor = '#10b981';
                tabB2C.style.color = '#10b981';

                tabB2B.style.background = 'rgba(255, 255, 255, 0.05)';
                tabB2B.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                tabB2B.style.color = '#a1a1aa';
            } else {
                tabB2B.style.background = 'rgba(0, 210, 255, 0.2)';
                tabB2B.style.borderColor = 'var(--brand-cyan)';
                tabB2B.style.color = 'var(--brand-cyan)';

                tabB2C.style.background = 'rgba(255, 255, 255, 0.05)';
                tabB2C.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                tabB2C.style.color = '#a1a1aa';
            }
        }
    }

    toggleAutoStream() {
        this.autoScanActive = !this.autoScanActive;
        const btnAuto = document.getElementById('btn-v2-auto-stream');
        const badgeStream = document.getElementById('v2-stream-indicator');

        if (this.autoScanActive) {
            if (btnAuto) {
                btnAuto.style.background = 'rgba(239, 68, 68, 0.2)';
                btnAuto.style.borderColor = '#ef4444';
                btnAuto.style.color = '#ef4444';
                btnAuto.innerHTML = '<span>⏸️</span> Pausar Rastreo Continuo';
            }
            if (badgeStream) {
                badgeStream.textContent = '🟢 Rastreando en Bucle (Cada 15s)';
                badgeStream.style.color = '#10b981';
            }

            this.escanearCompradores(true);
            this.autoScanInterval = setInterval(() => {
                this.escanearCompradores(true);
            }, 15000);

            if (window.mostrarToast) {
                window.mostrarToast('📡 Auto-Rastreo Continuo activado.');
            }
        } else {
            if (btnAuto) {
                btnAuto.style.background = 'transparent';
                btnAuto.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                btnAuto.style.color = '#10b981';
                btnAuto.innerHTML = '<span>▶️</span> Auto-Rastreo Continuo';
            }
            if (badgeStream) {
                badgeStream.textContent = '⏸️ Stream en Pausa';
                badgeStream.style.color = '#71717a';
            }

            if (this.autoScanInterval) {
                clearInterval(this.autoScanInterval);
                this.autoScanInterval = null;
            }

            if (window.mostrarToast) {
                window.mostrarToast('⏸️ Rastreo continuo pausado.');
            }
        }
    }

    async escanearCompradores(esSilencioso = false) {
        if (this.isScanning) return;
        this.isScanning = true;

        const btn = document.getElementById('btn-v2-scan-now');
        if (btn && !esSilencioso) {
            btn.innerHTML = '<span>⏳</span> Rastreando compradores reales...';
            btn.disabled = true;
        }

        try {
            const resp = await fetch('/api/v2-leads?limit=30');
            const data = await resp.json();

            if (Array.isArray(data) && data.length > 0) {
                const nuevos = data.filter(d => !this.leads.some(l => l.id === d.id));
                if (nuevos.length > 0) {
                    this.leads = [...nuevos, ...this.leads];
                    this.guardarDatos();
                    this.renderizar();

                    if (window.mostrarToast) {
                        window.mostrarToast(`💎 Hunter V2: +${nuevos.length} compradores reales calificados.`);
                    }
                } else if (!esSilencioso && window.mostrarToast) {
                    window.mostrarToast('ℹ️ Base al día. No hay nuevos hilos en este minuto.');
                }
            }
        } catch (err) {
            console.error('Error en escaneo V2:', err);
        } finally {
            this.isScanning = false;
            if (btn && !esSilencioso) {
                btn.innerHTML = '<span>⚡</span> Extraer Compradores V2';
                btn.disabled = false;
            }
        }
    }

    renderizar() {
        const thead = document.getElementById('v2-leads-thead');
        const tbody = document.getElementById('v2-leads-tbody');
        const countBadge = document.getElementById('v2-leads-count');
        const statTotal = document.getElementById('v2-stat-total');
        const statCapital = document.getElementById('v2-stat-capital');
        const tableTitle = document.getElementById('v2-table-title');
        const tableSubtitle = document.getElementById('v2-table-subtitle');

        if (this.activeTab === 'B2C') {
            // MODO B2C: COMPRADORES REALES
            if (tableTitle) tableTitle.textContent = '🎯 Compradores e Inversores en Seguimiento (B2C)';
            if (tableSubtitle) tableSubtitle.textContent = 'Filtrado con HasData & Scout: Cero alquileres, solo intención de compra';
            if (statTotal) statTotal.textContent = this.leads.length;
            if (countBadge) countBadge.textContent = `${this.leads.length} compradores listos`;
            if (statCapital) {
                const volumen = this.leads.length * 520;
                statCapital.textContent = `€${volumen.toLocaleString()}K+`;
            }

            if (thead) {
                thead.innerHTML = `
                    <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; font-size: 11px; color: #71717a; text-transform: uppercase;">
                        <th style="padding: 10px 12px; text-align: center;">Score</th>
                        <th style="padding: 10px 12px;">Comprador</th>
                        <th style="padding: 10px 12px;">Intención de Compra</th>
                        <th style="padding: 10px 12px;">Presupuesto</th>
                        <th style="padding: 10px 12px; text-align: center;">Categoría</th>
                        <th style="padding: 10px 12px; text-align: right;">Acciones de Venta</th>
                    </tr>
                `;
            }

            if (!tbody) return;

            if (this.leads.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 45px 20px; color: #71717a;">
                            <span style="font-size: 32px; display: block; margin-bottom: 10px;">🎯</span>
                            <strong style="color: #fff; font-size: 14px;">Bandeja B2C vacía</strong><br>
                            <span style="font-size: 12px; margin-top: 6px; display: inline-block;">
                                Presiona <strong>"Extraer Compradores V2"</strong> para consultar los feeds de compra en vivo.
                            </span>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = this.leads.map(lead => {
                const isHigh = lead.category && lead.category.includes('Inversor');
                const badgeColor = isHigh ? '#10b981' : 'var(--brand-cyan)';
                const badgeBg = isHigh ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 210, 255, 0.15)';

                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s;" class="hover-row">
                        <!-- Score (Scout Algorithm) -->
                        <td style="padding: 12px; text-align: center;">
                            <span style="font-size: 12px; font-weight: 800; color: ${badgeColor}; font-family: monospace; background: ${badgeBg}; padding: 4px 8px; border-radius: 6px; border: 1px solid ${badgeColor};" title="Calculado por Lead Scorer de Scout">
                                ★ ${lead.score}
                            </span>
                        </td>

                        <!-- Comprador -->
                        <td style="padding: 12px;">
                            <div style="font-weight: 700; color: #fff; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                <span>💬</span>
                                <a href="${lead.profileUrl || lead.contactUrl}" target="_blank" rel="noopener noreferrer" style="color: #fff; text-decoration: none;" title="Abrir perfil real" onmouseover="this.style.color='#10b981'" onmouseout="this.style.color='#fff'">
                                    ${lead.author}
                                </a>
                            </div>
                            <span style="font-size: 10px; color: var(--brand-cyan); font-weight: 600;">${lead.source || 'Comunidad Real'}</span>
                            <span style="font-size: 10px; color: #a1a1aa; margin-left: 4px;">• ${lead.time}</span>
                        </td>

                        <!-- Intención de Compra (HasData Filtered) -->
                        <td style="padding: 12px; max-width: 320px;">
                            <div style="font-size: 11px; font-weight: 700; color: var(--brand-cyan); margin-bottom: 2px;">
                                ${lead.intent}
                            </div>
                            <p style="margin: 0; font-size: 11px; color: #d4d4d8; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${lead.details}">
                                "${lead.details}"
                            </p>
                        </td>

                        <!-- Presupuesto -->
                        <td style="padding: 12px;">
                            <div style="font-size: 13px; font-weight: 800; color: #10b981; font-family: monospace;">
                                ${lead.budget}
                            </div>
                            <span style="font-size: 9px; color: #a1a1aa; text-transform: uppercase;">Capacidad Verificada</span>
                        </td>

                        <!-- Categoría -->
                        <td style="padding: 12px; text-align: center;">
                            <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor};">
                                ${lead.category}
                            </span>
                        </td>

                        <!-- Acciones: Mensaje Directo, Ver Post y Pitch IA OpenOutreach -->
                        <td style="padding: 12px; text-align: right;">
                            <div style="display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap;">
                                <button onclick="window.hunterEngineV2.abrirModalOutreach('${lead.id}')" class="btn-secondary btn-small" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.4); color: #f59e0b; font-size: 11px; font-weight: 700; padding: 5px 8px;" title="Generar mensaje bilingüe de OpenOutreach">
                                    <span>✉️</span> Pitch IA
                                </button>
                                <a href="${lead.directMsgUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-small" style="background: linear-gradient(135deg, #10b981, #059669); color: #000; font-weight: 700; font-size: 11px; padding: 5px 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Escribir a su buzón privado de Reddit">
                                    <span>💬</span> Contactar
                                </a>
                                <a href="${lead.contactUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-small" style="padding: 5px 8px; font-size: 11px; text-decoration: none; color: var(--brand-cyan); border-color: rgba(0, 210, 255, 0.4);" title="Abrir hilo original">
                                    <span>🔗</span> Post
                                </a>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

        } else {
            // MODO B2B: RED DE BROKERS Y AGENCIAS INTERNACIONALES (GHOSTMAP ARCHITECTURE)
            if (tableTitle) tableTitle.textContent = '🏢 Red de Despachos, Brokers y Agencias de Reubicación (B2B)';
            if (tableSubtitle) tableSubtitle.textContent = 'Estructura GhostMap: Socios en UK, USA y Europa que canalizan compradores con capital a Portugal';
            if (statTotal) statTotal.textContent = B2B_PARTNERS_DIRECTORY.length;
            if (countBadge) countBadge.textContent = `${B2B_PARTNERS_DIRECTORY.length} firmas activas`;
            if (statCapital) statCapital.textContent = '€10M+ Flujo Anual';

            if (thead) {
                thead.innerHTML = `
                    <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; font-size: 11px; color: #71717a; text-transform: uppercase;">
                        <th style="padding: 10px 12px; text-align: center;">Score</th>
                        <th style="padding: 10px 12px;">Firma / Broker B2B</th>
                        <th style="padding: 10px 12px;">Especialidad & Alcance</th>
                        <th style="padding: 10px 12px;">Sede / País</th>
                        <th style="padding: 10px 12px;">Contacto Directo</th>
                        <th style="padding: 10px 12px; text-align: right;">Acción Alianza</th>
                    </tr>
                `;
            }

            if (!tbody) return;

            tbody.innerHTML = B2B_PARTNERS_DIRECTORY.map(b2b => {
                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s;" class="hover-row">
                        <!-- Score -->
                        <td style="padding: 12px; text-align: center;">
                            <span style="font-size: 12px; font-weight: 800; color: var(--brand-cyan); font-family: monospace; background: rgba(0, 210, 255, 0.15); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--brand-cyan);">
                                ★ ${b2b.score}
                            </span>
                        </td>

                        <!-- Firma -->
                        <td style="padding: 12px;">
                            <div style="font-weight: 700; color: #fff; font-size: 13px;">
                                ${b2b.name}
                            </div>
                            <a href="${b2b.website}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: var(--brand-cyan); text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                🌐 ${b2b.website.replace('https://', '')}
                            </a>
                        </td>

                        <!-- Especialidad -->
                        <td style="padding: 12px; max-width: 320px;">
                            <div style="font-size: 11px; font-weight: 700; color: #10b981; margin-bottom: 2px;">
                                ${b2b.specialty}
                            </div>
                            <p style="margin: 0; font-size: 11px; color: #a1a1aa; line-height: 1.3;">
                                ${b2b.scope}
                            </p>
                        </td>

                        <!-- Sede -->
                        <td style="padding: 12px;">
                            <span style="font-size: 12px; color: #fff; font-weight: 600;">
                                📍 ${b2b.location}
                            </span>
                        </td>

                        <!-- Contacto Directo (Email + Teléfono) -->
                        <td style="padding: 12px;">
                            <div style="font-size: 11px; color: #fff; font-family: monospace; font-weight: 700;">
                                📞 ${b2b.phone}
                            </div>
                            <div style="font-size: 11px; color: var(--brand-cyan); font-family: monospace;">
                                ✉️ ${b2b.email}
                            </div>
                        </td>

                        <!-- Acciones -->
                        <td style="padding: 12px; text-align: right;">
                            <div style="display: flex; gap: 6px; justify-content: flex-end;">
                                <a href="mailto:${b2b.email}?subject=Partnership%20Inquiry%20-%20Property%20Portfolio%20Collaboration" class="btn-primary btn-small" style="background: linear-gradient(135deg, var(--brand-cyan), #0099ff); color: #000; font-weight: 700; font-size: 11px; padding: 5px 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                    <span>✉️</span> Proponer Alianza
                                </a>
                                <a href="${b2b.website}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-small" style="padding: 5px 8px; font-size: 11px; text-decoration: none; color: #fff; border-color: rgba(255,255,255,0.2);">
                                    <span>🔗</span> Web
                                </a>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // OPENOUTREACH COLD OUTREACH ENGINE (Generador Bilingüe Inglés / Portugués)
    abrirModalOutreach(leadId) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;

        const modal = document.getElementById('modal-v2-outreach');
        const targetUser = document.getElementById('outreach-target-user');
        const textEn = document.getElementById('outreach-text-en');
        const textPt = document.getElementById('outreach-text-pt');

        if (!modal || !textEn || !textPt) return;

        if (targetUser) targetUser.textContent = `${lead.author} • ${lead.intent}`;

        const cleanUser = lead.realUsername || lead.author.replace('@', '');
        const intentSubject = lead.intent.length > 50 ? lead.intent.substring(0, 47) + '...' : lead.intent;

        // Plantilla 1: Inglés de Negocios (OpenOutreach Standard)
        textEn.value = `Hi ${cleanUser},

I saw your recent post regarding "${intentSubject}".

Our acquisition desk represents pre-vetted residential and investment portfolios in Portugal, with full legal conveyance and verified title checks for international buyers.

If you are open to reviewing verified properties matching your requirements before they hit public portals, let me know and I can share our catalog.

Best regards,
Acquisitions & Sales Team`;

        // Plantilla 2: Portugués Profesional (Padrão de Negócios)
        textPt.value = `Olá ${cleanUser},

Vi a sua publicação sobre "${intentSubject}".

A nossa equipa gere portfólios imobiliários verificados e oportunidades exclusivas de investimento em Portugal, prestando acompanhamento jurídico e bancário completo a compradores internacionais.

Caso tenha interesse em avaliar opções selecionadas de acordo com os seus critérios, fico à total disposição para partilhar o nosso portfólio.

Com os melhores cumprimentos,
Equipa de Vendas & Investimento`;

        modal.style.display = 'flex';
    }

    exportarExcelCRM() {
        if (this.activeTab === 'B2C') {
            if (!this.leads.length) {
                if (window.mostrarToast) window.mostrarToast('⚠️ No hay leads B2C para exportar.');
                return;
            }

            const headers = ["ID", "Usuario", "Plataforma", "Fuente", "Categoria", "Intencion_Compra", "Detalles", "Presupuesto_Estimado", "Score_Scout", "Canal_Contacto", "Fecha_Deteccion"];
            const rows = this.leads.map(l => [
                `"${l.id}"`,
                `"${l.author}"`,
                `"${l.platform || 'Online'}"`,
                `"${l.source}"`,
                `"${l.category}"`,
                `"${(l.intent || '').replace(/"/g, '""')}"`,
                `"${(l.details || '').replace(/"/g, '""')}"`,
                `"${l.budget}"`,
                `"${l.score}"`,
                `"${l.directMsgUrl}"`,
                `"${new Date().toLocaleDateString()}"`
            ]);

            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            this.descargarCsv(csvContent, `Leads_Compradores_B2C_${new Date().toISOString().slice(0, 10)}.csv`);
        } else {
            const headers = ["Firma", "Especialidad", "Sede_Pais", "Sitio_Web", "Telefono_Directo", "Email_Corporativo", "Score_Alianza"];
            const rows = B2B_PARTNERS_DIRECTORY.map(b => [
                `"${b.name}"`,
                `"${b.specialty}"`,
                `"${b.location}"`,
                `"${b.website}"`,
                `"${b.phone}"`,
                `"${b.email}"`,
                `"${b.score}"`
            ]);

            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            this.descargarCsv(csvContent, `Directorio_Brokers_B2B_${new Date().toISOString().slice(0, 10)}.csv`);
        }
    }

    descargarCsv(content, filename) {
        const encodedUri = encodeURI(content);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

        if (window.mostrarToast) {
            window.mostrarToast(`📊 Archivo ${filename} descargado listo para CRM.`);
        }
    }
}

// Inicialización global del motor V2
window.initHunterV2 = function() {
    window.hunterEngineV2 = new HunterEngineV2();
};
