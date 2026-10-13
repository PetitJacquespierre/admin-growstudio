// ==============================================================================
// 🚀 HUNTER ENGINE V2 — MÓDULO INDEPENDIENTE DE EXTRACCIÓN MULTICANAL CONTINUA
// Diseñado para captación y venta de leads de alto valor en macro
// Soporta Auto-Rastreo continuo (búsqueda cada 15 segundos hasta presionar Pausa)
// Fuentes: Reddit en vivo, Twitter/X, Instagram, Facebook y Foros especializados
// Almacenamiento aislado: 'hunter_v2_leads_standalone_db'
// ==============================================================================

const STORAGE_V2_KEY = 'hunter_v2_leads_standalone_db';

export class HunterEngineV2 {
    constructor() {
        this.leads = [];
        this.isScanning = false;
        this.autoScanActive = false;
        this.autoScanInterval = null;
        this.activeFilter = 'ALL';
        this.init();
    }

    init() {
        this.cargarDatos();
        this.vincularEventos();
    }

    cargarDatos() {
        const stored = localStorage.getItem(STORAGE_V2_KEY);
        let parsed = stored ? JSON.parse(stored) : [];
        // Purgar de inmediato cualquier lead simulado anterior (@invest_capital_eu, etc.)
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
        // Botón Escanear Ahora
        const btnScan = document.getElementById('btn-v2-scan-now');
        if (btnScan) {
            btnScan.addEventListener('click', () => this.escanearCompradores());
        }

        // Switch Auto-Rastreo Continuo (Búsqueda continua hasta pausar)
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

            // Ejecuta inmediatamente y programa escaneo cada 15s
            this.escanearCompradores(true);
            this.autoScanInterval = setInterval(() => {
                this.escanearCompradores(true);
            }, 15000);

            if (window.mostrarToast) {
                window.mostrarToast('📡 Rastreo Continuo Activado: Buscando en Reddit, Twitter y Redes sin parar.');
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
            btn.innerHTML = '<span>⏳</span> Rastreando multicanal...';
            btn.disabled = true;
        }

        try {
            const resp = await fetch('/api/v2-leads?limit=30');
            const data = await resp.json();

            if (Array.isArray(data) && data.length > 0) {
                // Filtrar duplicados por ID
                const nuevos = data.filter(d => !this.leads.some(l => l.id === d.id));
                if (nuevos.length > 0) {
                    this.leads = [...nuevos, ...this.leads];
                    this.guardarDatos();
                    this.renderizar();

                    if (window.mostrarToast) {
                        window.mostrarToast(`💎 Hunter V2: +${nuevos.length} compradores detectados en vivo.`);
                    }
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
        const tbody = document.getElementById('v2-leads-tbody');
        const countBadge = document.getElementById('v2-leads-count');
        const statTotal = document.getElementById('v2-stat-total');
        const statCapital = document.getElementById('v2-stat-capital');

        if (countBadge) countBadge.textContent = `${this.leads.length} compradores listos`;
        if (statTotal) statTotal.textContent = this.leads.length;

        // Calcular volumen estimado de capital en juego
        if (statCapital) {
            const volumen = this.leads.length * 520;
            statCapital.textContent = `€${volumen.toLocaleString()}K+`;
        }

        if (!tbody) return;

        if (this.leads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 45px 20px; color: #71717a;">
                        <span style="font-size: 32px; display: block; margin-bottom: 10px;">🎯</span>
                        <strong style="color: #fff; font-size: 14px;">Bandeja V2 vacía</strong><br>
                        <span style="font-size: 12px; margin-top: 6px; display: inline-block;">
                            Haz clic en <strong>"Extraer Compradores V2"</strong> o activa el <strong>"Auto-Rastreo Continuo"</strong> para comenzar a acumular prospectos en vivo.
                        </span>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.leads.map(lead => {
            const isHigh = lead.category && lead.category.includes('High-Ticket');
            const badgeColor = isHigh ? '#10b981' : 'var(--brand-cyan)';
            const badgeBg = isHigh ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 210, 255, 0.15)';

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s;" class="hover-row">
                    <!-- Calificación / Score -->
                    <td style="padding: 12px; text-align: center;">
                        <span style="font-size: 12px; font-weight: 800; color: ${badgeColor}; font-family: monospace; background: ${badgeBg}; padding: 4px 8px; border-radius: 6px; border: 1px solid ${badgeColor};">
                            ★ ${lead.score}
                        </span>
                    </td>

                    <!-- Prospecto & Canal -->
                    <td style="padding: 12px;">
                        <div style="font-weight: 700; color: #fff; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                            <span>${lead.platformIcon || '💬'}</span>
                            <a href="${lead.profileUrl || lead.contactUrl}" target="_blank" rel="noopener noreferrer" style="color: #fff; text-decoration: none;" title="Abrir perfil real del usuario" onmouseover="this.style.color='#10b981'" onmouseout="this.style.color='#fff'">
                                ${lead.author}
                            </a>
                        </div>
                        <span style="font-size: 10px; color: var(--brand-cyan); font-weight: 600;">${lead.source || 'Comunidad Real'}</span>
                        <span style="font-size: 10px; color: #a1a1aa; margin-left: 4px;">• ${lead.time}</span>
                    </td>

                    <!-- Intención & Perfil -->
                    <td style="padding: 12px; max-width: 340px;">
                        <div style="font-size: 11px; font-weight: 700; color: var(--brand-cyan); margin-bottom: 2px;">
                            ${lead.intent}
                        </div>
                        <p style="margin: 0; font-size: 11px; color: #d4d4d8; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${lead.details}">
                            "${lead.details}"
                        </p>
                    </td>

                    <!-- Presupuesto Estimado -->
                    <td style="padding: 12px;">
                        <div style="font-size: 13px; font-weight: 800; color: #10b981; font-family: monospace;">
                            ${lead.budget}
                        </div>
                        <span style="font-size: 9px; color: #a1a1aa; text-transform: uppercase;">Interés Inmobiliario Real</span>
                    </td>

                    <!-- Categoría -->
                    <td style="padding: 12px; text-align: center;">
                        <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor};">
                            ${lead.category}
                        </span>
                    </td>

                    <!-- Contacto / CRM Directo -->
                    <td style="padding: 12px; text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end;">
                            <a href="${lead.directMsgUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-small" style="background: linear-gradient(135deg, #10b981, #059669); color: #000; font-weight: 700; font-size: 11px; padding: 5px 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Enviar mensaje directo privado a este usuario">
                                <span>💬</span> Contactar
                            </a>
                            <a href="${lead.contactUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-small" style="padding: 5px 8px; font-size: 11px; text-decoration: none; color: var(--brand-cyan); border-color: rgba(0, 210, 255, 0.4);" title="Abrir la publicación original">
                                <span>🔗</span> Ver Post
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    exportarExcelCRM() {
        if (!this.leads.length) {
            if (window.mostrarToast) window.mostrarToast('⚠️ No hay leads para exportar.');
            return;
        }

        const headers = ["ID", "Usuario", "Plataforma", "Fuente", "Categoria", "Intencion_Compra", "Detalles", "Presupuesto_Estimado", "Score", "Canal_Contacto", "Fecha_Deteccion"];
        
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
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Leads_Compradores_V2_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        if (window.mostrarToast) {
            window.mostrarToast('📊 Lote exportado en formato CSV / Excel listo para ventas.');
        }
    }
}

// Inicialización global del motor V2
window.initHunterV2 = function() {
    window.hunterEngineV2 = new HunterEngineV2();
};
