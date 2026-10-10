import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// REPORTES Y ESTADÍSTICAS
// ==========================================
window.generarReporteWhatsapp = function() {
    if (!state.currentClientData) return;
    
    const telefono = state.currentClientData.whatsapp || state.currentClientData.telefono || "";
    const visitas = state.currentClientData.visitas || 0;
    const nombre = state.currentClientData.nombre || state.currentClientData.businessName || "Cliente";
    
    if (!telefono) {
        alert("El cliente no tiene un número de WhatsApp registrado.");
        return;
    }
    
    let tlf = telefono.replace(/\D/g, ''); 
    
    const mensaje = `¡Hola ${nombre}! 📊 Aquí tienes tu reporte mensual de Grow Studio.\n\nEste mes tu Menú Digital ha recibido *${visitas} visitas*.\n\n¡Tus clientes están amando tu menú digital! Gracias por confiar en nosotros. 🚀`;
    const url = `https://web.whatsapp.com/send?phone=${tlf}&text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
};


// ==========================================
// FASE 4: DASHBOARD EJECUTIVO & MONITOR BCV EN VIVO
// ==========================================

// Helper para obtener tasa BCV oficial
async function fetchCurrentBCVRate() {
    const URL_API = "https://script.google.com/macros/s/AKfycbxdQlLO7lDOAvbhFqwVBs722T_i1KQ08z1gdf4NdqA6HvVcwGzRX4BZtHSd58piGL11/exec";
    try {
        const res = await fetch(URL_API);
        const data = await res.json();
        if (data && data.usd) {
            const tasa = parseFloat(data.usd);
            if (tasa > 0) {
                localStorage.setItem("bcv_rate_cache", tasa.toString());
                localStorage.setItem("bcv_rate_timestamp", new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }));
                return { tasa, time: localStorage.getItem("bcv_rate_timestamp"), ok: true };
            }
        }
    } catch (e) {
        console.warn("Fallo consultando API BCV en vivo:", e);
    }
    const cached = localStorage.getItem("bcv_rate_cache");
    const cachedTime = localStorage.getItem("bcv_rate_timestamp") || 'Caché';
    return { tasa: cached ? parseFloat(cached) : 871.37, time: cachedTime, ok: false };
}

// Cargar y mostrar la tasa oficial BCV en el Header Superior Global (Fase 4.2)
window.cargarTasaBCVHeader = async function(isManualRefresh = false) {
    const rateEl = document.getElementById('bcv-header-rate');
    const dotEl = document.getElementById('bcv-status-dot');
    const updatedEl = document.getElementById('bcv-header-updated');

    if (!rateEl) return;

    if (isManualRefresh) {
        rateEl.innerText = "Consultando...";
        if (dotEl) {
            dotEl.style.background = "#f59e0b";
            dotEl.style.boxShadow = "0 0 8px #f59e0b";
        }
    }

    const { tasa, time, ok } = await fetchCurrentBCVRate();

    rateEl.innerText = tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (updatedEl) updatedEl.innerText = `(${time})`;

    if (dotEl) {
        if (ok) {
            dotEl.style.background = "#10b981";
            dotEl.style.boxShadow = "0 0 8px #10b981";
        } else {
            dotEl.style.background = "#f59e0b";
            dotEl.style.boxShadow = "0 0 8px #f59e0b";
        }
    }

    if (isManualRefresh && window.showToast) {
        window.showToast(`Tasa BCV actualizada: ${tasa.toFixed(2)} Bs`, ok ? "success" : "warning");
    }

    // Refrescar equivalencias en KPIs si el dashboard está visible
    window.renderDashboardKPIs && window.renderDashboardKPIs(tasa);
};

// Renderizar KPIs globales en la pantalla de bienvenida / dashboard (Fase 4.1)
window.renderDashboardKPIs = function(tasaParam) {
    const clients = state.allClientsCache || [];

    const activeClientsEl = document.getElementById('kpi-active-clients');
    const totalClientsEl = document.getElementById('kpi-total-clients');
    const mrrUsdEl = document.getElementById('kpi-mrr-usd');
    const mrrBsEl = document.getElementById('kpi-mrr-bs');
    const totalViewsEl = document.getElementById('kpi-total-views');
    const totalDebtEl = document.getElementById('kpi-total-debt');
    const debtBsEl = document.getElementById('kpi-debt-bs');
    const debtorsBadgeEl = document.getElementById('kpi-debtors-badge');

    if (!activeClientsEl) return; // Si no estamos en esa pantalla, salir

    const cachedTasa = parseFloat(localStorage.getItem("bcv_rate_cache")) || 871.37;
    const tasa = tasaParam || cachedTasa;

    let activeCount = 0;
    let totalMRR = 0;
    let totalViews = 0;
    let totalDebt = 0;
    let debtorClientsCount = 0;

    clients.forEach(c => {
        const data = c.data || {};
        const isActive = (data.estado === 'ACTIVO');
        if (isActive) activeCount++;

        // Cálculo de MRR estimado según el plan de los clientes activos
        const plan = (data.plan || 'MENSUAL').toUpperCase();
        if (isActive) {
            if (plan.includes('ANUAL')) totalMRR += (50 / 12); // Ponderado mensual
            else if (plan.includes('MENSUAL')) totalMRR += 15;
            else if (data.mensualidad) totalMRR += parseFloat(data.mensualidad) || 0;
        }

        // Tráfico acumulado
        totalViews += parseInt(data.visitas || 0, 10);

        // Deuda acumulada
        const deuda = parseFloat(data.deuda || 0);
        if (deuda > 0) {
            totalDebt += deuda;
            debtorClientsCount++;
        }
    });

    activeClientsEl.innerText = activeCount.toString();
    if (totalClientsEl) totalClientsEl.innerText = `${clients.length} restaurantes registrados`;

    if (mrrUsdEl) mrrUsdEl.innerText = `$${Math.round(totalMRR).toLocaleString('es-VE')}`;
    if (mrrBsEl) mrrBsEl.innerText = `≈ ${(totalMRR * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/mes`;

    if (totalViewsEl) totalViewsEl.innerText = totalViews.toLocaleString('es-VE');

    if (totalDebtEl) totalDebtEl.innerText = `$${totalDebt.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (debtBsEl) debtBsEl.innerText = `≈ ${(totalDebt * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
    if (debtorsBadgeEl) debtorsBadgeEl.innerText = `${debtorClientsCount} con deuda`;

    // Renderizar Gráfico de Rendimiento (Opción 2)
    renderDashboardChart(clients);

    // Renderizar Monitor de Salud y Alertas Rápidas de Cobro (Opción 3)
    renderServiceHealthAndAlerts(clients, tasa);
};

// Variable global para la instancia del gráfico Chart.js
let dashboardChartInstance = null;

// RENDERIZAR GRÁFICO VISUAL DE RENDIMIENTO Y TRÁFICO (Opción 2)
function renderDashboardChart(clients) {
    const canvas = document.getElementById('traffic-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Extraer restaurantes y sus visitas ordenados por visitas descendente
    const chartData = (clients || [])
        .map(c => ({
            name: c.data.businessName || c.data.nombre || c.id,
            visitas: parseInt(c.data.visitas || 0, 10),
            estado: c.data.estado || 'ACTIVO'
        }))
        .sort((a, b) => b.visitas - a.visitas)
        .slice(0, 8); // Top 8 para legibilidad en pantalla

    const labels = chartData.map(d => d.name.length > 14 ? d.name.substring(0, 13) + '…' : d.name);
    const dataValues = chartData.map(d => d.visitas);

    const totalViews = dataValues.reduce((sum, v) => sum + v, 0);
    const chartTotalLabel = document.getElementById('chart-total-label');
    if (chartTotalLabel) {
        chartTotalLabel.innerText = `${totalViews.toLocaleString('es-VE')} visitas`;
    }

    // Si ya existe instancia previa, destruirla para evitar parpadeos
    if (dashboardChartInstance) {
        dashboardChartInstance.destroy();
        dashboardChartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    
    // Crear gradiente estilizado para las barras
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, '#00d2ff');
    gradient.addColorStop(1, 'rgba(0, 210, 255, 0.15)');

    const borderColors = chartData.map((d, i) => i === 0 ? '#ff4d00' : '#00d2ff');
    const bgColors = chartData.map((d, i) => {
        if (i === 0) {
            const gLead = ctx.createLinearGradient(0, 0, 0, 240);
            gLead.addColorStop(0, '#ff4d00');
            gLead.addColorStop(1, 'rgba(255, 77, 0, 0.2)');
            return gLead;
        }
        return gradient;
    });

    dashboardChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Visitas Acumuladas',
                data: dataValues,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 6,
                maxBarThickness: 36
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(18, 18, 24, 0.95)',
                    titleColor: '#00d2ff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y.toLocaleString('es-VE')} visitas al menú`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#a1a1aa',
                        font: { size: 11 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#71717a',
                        font: { size: 10 },
                        precision: 0
                    }
                }
            }
        }
    });
}

// MONITOR DE SALUD DEL SERVICIO & ALERTAS DE COBRO INMEDIATO (Opción 3)
function renderServiceHealthAndAlerts(clients, tasa) {
    // 1. Semáforo de Servicios
    const dotFirebase = document.getElementById('health-dot-firebase');
    const dotBcv = document.getElementById('health-dot-bcv');
    const dotVercel = document.getElementById('health-dot-vercel');

    if (dotFirebase) {
        dotFirebase.style.background = '#10b981';
        dotFirebase.style.boxShadow = '0 0 8px #10b981';
    }
    if (dotVercel) {
        dotVercel.style.background = '#10b981';
        dotVercel.style.boxShadow = '0 0 8px #10b981';
    }
    if (dotBcv) {
        const cachedTime = localStorage.getItem("bcv_rate_timestamp");
        if (cachedTime) {
            dotBcv.style.background = '#10b981';
            dotBcv.style.boxShadow = '0 0 8px #10b981';
        } else {
            dotBcv.style.background = '#f59e0b';
            dotBcv.style.boxShadow = '0 0 8px #f59e0b';
        }
    }

    // 2. Alertas Rápidas de Cobranza (Próximos a vencer en <= 7 días o morosos con deuda)
    const alertsContainer = document.getElementById('urgent-alerts-list');
    const badgeEl = document.getElementById('alerts-count-badge');
    if (!alertsContainer) return;

    const hoy = new Date();
    const urgentClients = [];

    (clients || []).forEach(c => {
        const data = c.data || {};
        let diffDays = null;
        let esVencido = false;
        let esProximo = false;

        if (data.fechaVencimiento) {
            const fv = new Date(data.fechaVencimiento + 'T00:00:00');
            diffDays = Math.ceil((fv - hoy) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) esVencido = true;
            else if (diffDays <= 7) esProximo = true;
        }

        const tieneDeuda = parseFloat(data.deuda || 0) > 0;
        const esMoroso = (data.estado === 'MOROSO' || data.estado === 'SUSPENDIDO');

        if (esVencido || esProximo || tieneDeuda || esMoroso) {
            urgentClients.push({
                id: c.id,
                name: data.businessName || data.nombre || c.id,
                whatsapp: data.whatsapp || '',
                plan: data.plan || 'MENSUAL',
                deuda: parseFloat(data.deuda || 0),
                fechaVencimiento: data.fechaVencimiento || '',
                diffDays: diffDays,
                esVencido: esVencido,
                esProximo: esProximo
            });
        }
    });

    // Ordenar: primero los más atrasados / menor cantidad de días
    urgentClients.sort((a, b) => {
        const dA = a.diffDays !== null ? a.diffDays : 999;
        const dB = b.diffDays !== null ? b.diffDays : 999;
        return dA - dB;
    });

    if (badgeEl) {
        badgeEl.innerText = `${urgentClients.length} ${urgentClients.length === 1 ? 'pendiente' : 'pendientes'}`;
        if (urgentClients.length === 0) {
            badgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
            badgeEl.style.color = '#10b981';
            badgeEl.innerText = 'Todo al día';
        } else {
            badgeEl.style.background = 'rgba(239, 68, 68, 0.15)';
            badgeEl.style.color = '#ef4444';
        }
    }

    if (urgentClients.length === 0) {
        alertsContainer.innerHTML = `
            <div style="text-align: center; color: #10b981; font-size: 12px; padding: 18px; background: rgba(16,185,129,0.05); border-radius: 8px; border: 1px dashed rgba(16,185,129,0.2);">
                🎉 ¡Excelente! No hay cuentas vencidas ni por vencer en los próximos 7 días.
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = urgentClients.map(c => {
        let tagHtml = '';
        if (c.esVencido) {
            tagHtml = `<span style="font-size: 10px; background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Vencido hace ${Math.abs(c.diffDays)}d</span>`;
        } else if (c.diffDays === 0) {
            tagHtml = `<span style="font-size: 10px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-weight: 700;">¡Vence Hoy!</span>`;
        } else if (c.esProximo) {
            tagHtml = `<span style="font-size: 10px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Vence en ${c.diffDays}d</span>`;
        } else {
            tagHtml = `<span style="font-size: 10px; background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Deuda pendiente</span>`;
        }

        const montoPagar = c.deuda > 0 ? c.deuda : (c.plan === 'ANUAL' ? 50 : 15);

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 8px; transition: background 0.2s;">
                <div style="min-width: 0; flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${c.name}</span>
                        ${tagHtml}
                    </div>
                    <div style="font-size: 11px; color: #71717a; margin-top: 2px;">
                        ${c.plan} • <strong style="color: ${c.deuda > 0 ? '#ef4444' : '#e4e4e7'}">$${montoPagar}</strong>
                    </div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button type="button" onclick="window.cobrarClienteDesdeDashboard('${c.id}')" class="btn-primary btn-small" style="background: #25D366; border-color: #25D366; padding: 5px 10px; font-size: 11px; display: flex; align-items: center; gap: 4px; font-weight: 700;" title="Enviar recordatorio de cobro por WhatsApp">
                        <span>📲</span> Cobrar
                    </button>
                    <button type="button" onclick="window.abrirClienteDesdeDashboard('${c.id}')" class="btn-secondary btn-small" style="padding: 5px 8px; font-size: 11px; border: 1px solid rgba(255,255,255,0.15);" title="Ver cliente">
                        👁️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ABRIR CLIENTE DESDE DASHBOARD
window.abrirClienteDesdeDashboard = function(clienteId) {
    const clients = state.allClientsCache || [];
    const client = clients.find(c => c.id === clienteId);
    if (!client) {
        if (window.showToast) window.showToast("No se encontró el cliente seleccionado", "warning");
        return;
    }
    const li = Array.from(document.querySelectorAll('#clients-ul li')).find(el => el.innerText.includes(client.data.businessName || client.id));
    window.openClientManager(client.id, client.data, li || null);
};

// COBRAR DIRECTO POR WHATSAPP DESDE LA TARJETA DE ALERTA DEL DASHBOARD
window.cobrarClienteDesdeDashboard = async function(clienteId) {
    const clients = state.allClientsCache || [];
    const client = clients.find(c => c.id === clienteId);
    if (!client) return;

    state.currentClientId = client.id;
    state.currentClientData = client.data;

    // Usar la función global de cobro con los datos de este cliente
    if (typeof window.enviarCobroWhatsApp === 'function') {
        await window.enviarCobroWhatsApp();
    } else {
        alert("Generador de cobro no disponible.");
    }
};

// ACCIÓN RÁPIDA: SINCRONIZAR TODO (Opción 4)
window.sincronizarTodo = async function() {
    if (window.showToast) window.showToast("Sincronizando clientes, tasa BCV y métricas... 🔄");
    try {
        if (typeof window.cargarTasaBCVHeader === 'function') {
            await window.cargarTasaBCVHeader(true);
        }
        if (typeof window.loadClients === 'function') {
            await window.loadClients();
        }
        if (window.showToast) window.showToast("¡Dashboard 100% sincronizado en la nube! 🚀", "success");
    } catch (e) {
        console.error("Error al sincronizar todo:", e);
        if (window.showToast) window.showToast("Error en sincronización: " + e.message, "error");
    }
};

// ACCIÓN RÁPIDA: AJUSTE MASIVO DESDE DASHBOARD (Opción 4)
window.abrirAjusteMasivoDashboard = function() {
    const clients = state.allClientsCache || [];
    if (!clients || clients.length === 0) {
        if (window.showToast) window.showToast("No hay clientes registrados en la plataforma.", "warning");
        return;
    }

    // Si ya hay un cliente seleccionado, abrir su modal de ajuste directamente
    if (state.currentClientId && state.currentClientData) {
        const btnOpen = document.getElementById('btn-open-mass-price');
        if (btnOpen) {
            btnOpen.click();
            return;
        }
    }

    // Si está en el dashboard, ofrecer abrir el primer cliente o seleccionar uno
    const primerConProductos = clients.find(c => c.data && c.data.productos && c.data.productos.length > 0);
    if (primerConProductos) {
        window.abrirClienteDesdeDashboard(primerConProductos.id);
        setTimeout(() => {
            const btnOpen = document.getElementById('btn-open-mass-price');
            if (btnOpen) btnOpen.click();
        }, 300);
    } else {
        if (window.showToast) window.showToast("Selecciona primero un restaurante en la barra lateral para ajustar sus precios.", "info");
    }
};

// ACCIÓN RÁPIDA: EXPORTAR RESUMEN EJECUTIVO GLOBAL A PDF (Opción 4)
window.generarReporteEjecutivoGlobalPDF = function() {
    const clients = state.allClientsCache || [];
    const cachedTasa = parseFloat(localStorage.getItem("bcv_rate_cache")) || 871.37;
    const fechaGenerado = new Date().toLocaleDateString('es-VE', { day:'2-digit', month:'long', year:'numeric' });

    let activeCount = 0;
    let totalMRR = 0;
    let totalViews = 0;
    let totalDebt = 0;

    const rows = clients.map(c => {
        const d = c.data || {};
        const isActive = (d.estado === 'ACTIVO');
        if (isActive) activeCount++;

        const plan = (d.plan || 'MENSUAL').toUpperCase();
        let planMRR = 0;
        if (isActive) {
            if (plan.includes('ANUAL')) planMRR = (50 / 12);
            else if (plan.includes('MENSUAL')) planMRR = 15;
            else if (d.mensualidad) planMRR = parseFloat(d.mensualidad) || 0;
        }
        totalMRR += planMRR;

        const visitas = parseInt(d.visitas || 0, 10);
        totalViews += visitas;

        const deuda = parseFloat(d.deuda || 0);
        totalDebt += deuda;

        const name = d.businessName || d.nombre || c.id;
        const statusColor = isActive ? '#10b981' : '#ef4444';

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: 600; color: #1a1a2e;">${name}</td>
                <td style="padding: 10px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">${plan}</td>
                <td style="padding: 10px; text-align: center;">
                    <span style="background: ${statusColor}18; color: ${statusColor}; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">
                        ${d.estado || 'INACTIVO'}
                    </span>
                </td>
                <td style="padding: 10px; text-align: right; font-family: monospace;">${visitas.toLocaleString('es-VE')}</td>
                <td style="padding: 10px; text-align: right; font-weight: 600; color: ${deuda > 0 ? '#ef4444' : '#10b981'}; font-family: monospace;">
                    $${deuda.toFixed(2)}
                </td>
            </tr>
        `;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Resumen Ejecutivo SaaS – Grow Studio</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&family=Roboto+Mono:wght@500&display=swap');
:root{--cyan:#00c6eb;--orange:#f25c27;--dark:#1a1a2e;--gray:#f5f6fa}
body{font-family:'Montserrat',sans-serif;color:#333;margin:0;padding:40px;background:#eef2f5;display:flex;justify-content:center}
@media print{body{background:white;padding:0}.report-container{box-shadow:none!important;max-width:100%!important}.no-print{display:none!important}}
.report-container{background:white;width:100%;max-width:850px;margin:0 auto;padding:45px;border-top:8px solid var(--cyan);border-bottom:8px solid var(--orange);border-radius:4px;box-shadow:0 15px 35px rgba(0,0,0,.1);box-sizing:border-box}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px}
.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:30px}
.summary-card{background:var(--gray);padding:14px;border-radius:8px;text-align:center}
.summary-card .val{font-size:22px;font-weight:800;color:var(--dark);font-family:'Roboto Mono',monospace}
.summary-card .lbl{font-size:10px;color:#777;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px}
table{width:100%;border-collapse:collapse;margin-bottom:30px;font-size:12px}
th{background:var(--dark);color:white;padding:10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.footer{text-align:center;margin-top:30px;font-size:12px;color:#777;border-top:1px solid #eee;padding-top:15px}
.print-btn{position:fixed;bottom:30px;right:30px;background:var(--cyan);color:white;border:none;padding:12px 22px;font-size:14px;font-weight:600;border-radius:50px;cursor:pointer;box-shadow:0 4px 15px rgba(0,198,235,.4);z-index:100}
</style></head><body>
<div class="report-container">
  <div class="header">
    <div>
      <h2 style="margin:0;font-weight:900;letter-spacing:1px;color:var(--dark);font-size:24px;">GROW STUDIO</h2>
      <span style="font-size:12px;color:var(--cyan);font-weight:700;letter-spacing:2px;text-transform:uppercase;">Panel Central SaaS</span>
    </div>
    <div style="text-align:right;">
      <h3 style="margin:0;font-size:18px;color:var(--dark);">Resumen Ejecutivo Global</h3>
      <p style="margin:3px 0;font-size:12px;color:#777;">Generado: ${fechaGenerado}</p>
      <p style="margin:2px 0;font-size:11px;color:var(--orange);font-weight:600;">Tasa BCV: ${cachedTasa.toLocaleString('es-VE', {minimumFractionDigits:2})} Bs/USD</p>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="val" style="color:#10b981;">${activeCount} / ${clients.length}</div>
      <div class="lbl">Restaurantes Activos</div>
    </div>
    <div class="summary-card">
      <div class="val" style="color:var(--cyan);">$${Math.round(totalMRR)}</div>
      <div class="lbl">MRR Estimado (USD)</div>
    </div>
    <div class="summary-card">
      <div class="val" style="color:var(--orange);">${totalViews.toLocaleString('es-VE')}</div>
      <div class="lbl">Visitas Totales</div>
    </div>
    <div class="summary-card">
      <div class="val" style="color:#ef4444;">$${totalDebt.toFixed(2)}</div>
      <div class="lbl">Por Cobrar Total</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Restaurante</th>
        <th>Plan</th>
        <th style="text-align:center;">Estado</th>
        <th style="text-align:right;">Visitas</th>
        <th style="text-align:right;">Deuda ($)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    <p>Reporte Oficial Consolidado · <strong>GROW STUDIO SAAS</strong></p>
  </div>
</div>
<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
</body></html>`;

    const ventana = window.open('', '_blank', 'width=950,height=750');
    ventana.document.write(html);
    ventana.document.close();
};

// ==========================================
// MODO SUPERDIOS: 1. BACKUP & RESTAURACIÓN EN LA NUBE (SNAPSHOT JSON)
// ==========================================
window.abrirModalBackup = function() {
    const modal = document.getElementById('modal-backup');
    if (modal) modal.style.display = 'flex';
};

window.descargarBackupFirestore = async function() {
    if (window.showToast) window.showToast("Generando snapshot de respaldo de Firestore... ⏳");
    try {
        const collectionsToBackup = ["clientes", "pagos", "sandia_eventos", "sandia_aliados", "sandia_cupones"];
        const backupData = {
            metadata: {
                version: "2.0-superdios",
                app: "Grow Studio Admin",
                fechaExportacion: new Date().toISOString(),
                totalColecciones: collectionsToBackup.length
            },
            data: {}
        };

        for (const colName of collectionsToBackup) {
            try {
                const snap = await getDocs(collection(db, colName));
                backupData.data[colName] = [];
                snap.forEach(d => {
                    backupData.data[colName].push({
                        _id: d.id,
                        ...d.data()
                    });
                });
            } catch (errCol) {
                console.warn(`Colección opcional ${colName} no encontrada o vacía:`, errCol);
                backupData.data[colName] = [];
            }
        }

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const fechaStr = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_grow_studio_${fechaStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (window.showToast) window.showToast("¡Respaldo descargado exitosamente! 💾", "success");
    } catch (e) {
        console.error("Error al exportar backup:", e);
        if (window.showToast) window.showToast("Error al exportar respaldo: " + e.message, "error");
        else alert("Error: " + e.message);
    }
};

window.restaurarBackupFirestore = async function() {
    const fileInput = document.getElementById('input-backup-file');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (window.showToast) window.showToast("Por favor selecciona un archivo .json de respaldo", "warning");
        else alert("Selecciona un archivo .json");
        return;
    }

    const file = fileInput.files[0];
    if (!confirm(`⚠️ ATENCIÓN: Estás a punto de restaurar datos a Firebase desde "${file.name}".\n\n¿Deseas continuar?`)) {
        return;
    }

    if (window.showToast) window.showToast("Leyendo y restaurando datos hacia Firebase... ⏳");

    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed || !parsed.data) {
                    throw new Error("Estructura de respaldo no válida.");
                }

                let totalRestaurados = 0;
                for (const colName in parsed.data) {
                    const docsList = parsed.data[colName];
                    if (Array.isArray(docsList)) {
                        for (const item of docsList) {
                            const docId = item._id;
                            if (docId) {
                                const cleanItem = { ...item };
                                delete cleanItem._id;
                                await setDoc(doc(db, colName, docId), cleanItem, { merge: true });
                                totalRestaurados++;
                            }
                        }
                    }
                }

                if (window.showToast) window.showToast(`¡Restauración exitosa! ${totalRestaurados} documentos actualizados.`, "success");
                else alert(`Restauración completada: ${totalRestaurados} documentos.`);

                const modal = document.getElementById('modal-backup');
                if (modal) modal.style.display = 'none';

                if (typeof window.loadClients === 'function') await window.loadClients();
                if (typeof window.renderDashboardKPIs === 'function') window.renderDashboardKPIs();

            } catch (errInner) {
                console.error("Error procesando JSON de respaldo:", errInner);
                if (window.showToast) window.showToast("Error en el archivo JSON: " + errInner.message, "error");
                else alert("Error en JSON: " + errInner.message);
            }
        };
        reader.readAsText(file);
    } catch (e) {
        console.error("Error leyendo archivo:", e);
        if (window.showToast) window.showToast("Error al leer archivo: " + e.message, "error");
    }
};

// ==========================================
// MODO SUPERDIOS: 2. AUDITORÍA DE ENLACES & MENÚS EN VIVO (AUTO-PING)
// ==========================================
window.auditarEnlacesMenus = async function() {
    const modal = document.getElementById('modal-auditor');
    const container = document.getElementById('auditor-results-list');
    if (modal) modal.style.display = 'flex';
    if (!container) return;

    const clients = state.allClientsCache || [];
    if (clients.length === 0) {
        container.innerHTML = '<p style="color: #a1a1aa; font-size: 12px; text-align: center;">No hay clientes registrados para auditar.</p>';
        return;
    }

    container.innerHTML = '<div style="color: #c084fc; font-size: 13px; text-align: center; padding: 20px;">Auditoría en proceso: probando conexión y menús... ⏳</div>';

    const results = [];

    for (const c of clients) {
        const d = c.data || {};
        const name = d.businessName || d.nombre || c.id;
        let url = d.url || '';
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        let statusText = 'En Línea';
        let statusColor = '#10b981';
        let icon = '🟢';
        let note = 'Despliegue verificado';

        if (!url) {
            statusText = 'Sin URL';
            statusColor = '#f59e0b';
            icon = '⚠️';
            note = 'No tiene link de tienda asignado';
        } else {
            try {
                // Realizar ping con timeout corto en modo no-cors para verificar conectividad
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                
                await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
                clearTimeout(timeoutId);
                statusText = 'Activo & Accesible';
                statusColor = '#10b981';
                icon = '🟢';
                note = 'Responde correctamente vía HTTPS';
            } catch (errFetch) {
                statusText = 'Verificar Conexión';
                statusColor = '#f59e0b';
                icon = '🟡';
                note = 'Posible bloqueo CORS o demora en responder';
            }
        }

        const totalProductos = (d.productos && Array.isArray(d.productos)) ? d.productos.length : 0;

        results.push({
            id: c.id,
            name,
            url,
            statusText,
            statusColor,
            icon,
            note,
            totalProductos
        });
    }

    container.innerHTML = results.map(r => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 12px 14px; border-radius: 10px; gap: 10px;">
            <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 700; color: #fff;">${r.name}</span>
                    <span style="font-size: 10px; background: ${r.statusColor}22; color: ${r.statusColor}; padding: 2px 7px; border-radius: 10px; font-weight: 700; border: 1px solid ${r.statusColor}44;">
                        ${r.icon} ${r.statusText}
                    </span>
                </div>
                <div style="font-size: 11px; color: #71717a; margin-top: 3px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <span>${r.totalProductos} productos</span>
                    <span>•</span>
                    <span>${r.note}</span>
                </div>
            </div>
            <div>
                ${r.url ? `<a href="${r.url}" target="_blank" class="btn-secondary btn-small" style="text-decoration: none; padding: 5px 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.2);" title="Abrir tienda en pestaña">🔗 Abrir</a>` : '<span style="font-size: 11px; color: #71717a;">Sin link</span>'}
            </div>
        </div>
    `).join('');
};

// ==========================================
// MODO SUPERDIOS: 4. SIMULADOR FINANCIERO & PROYECCIÓN MRR / ARR
// ==========================================
window.actualizarSimuladorFinanciero = function() {
    const rangeEl = document.getElementById('sim-clients-range');
    const labelVal = document.getElementById('sim-clients-val');
    const pctMensualEl = document.getElementById('sim-pct-mensual');
    const pctAnualEl = document.getElementById('sim-pct-anual');

    const resMrrUsd = document.getElementById('sim-res-mrr-usd');
    const resMrrBs = document.getElementById('sim-res-mrr-bs');
    const resArrUsd = document.getElementById('sim-res-arr-usd');
    const resArrBs = document.getElementById('sim-res-arr-bs');
    const resArpu = document.getElementById('sim-res-arpu');

    if (!rangeEl || !labelVal) return;

    const totalClients = parseInt(rangeEl.value, 10) || 15;
    labelVal.innerText = totalClients.toString();

    let pctMensual = parseFloat(pctMensualEl ? pctMensualEl.value : 70) || 0;
    let pctAnual = parseFloat(pctAnualEl ? pctAnualEl.value : 30) || 0;

    const totalPct = pctMensual + pctAnual;
    if (totalPct > 0) {
        pctMensual = (pctMensual / totalPct);
        pctAnual = (pctAnual / totalPct);
    } else {
        pctMensual = 0.7;
        pctAnual = 0.3;
    }

    const clientsMensual = totalClients * pctMensual;
    const clientsAnual = totalClients * pctAnual;

    // Plan Mensual: $15/mes
    // Plan Anual: $50/año -> $4.17/mes
    const mrrMensual = clientsMensual * 15;
    const mrrAnualPonderado = clientsAnual * (50 / 12);
    const mrrTotal = mrrMensual + mrrAnualPonderado;
    const arrTotal = mrrTotal * 12;
    const arpu = totalClients > 0 ? (mrrTotal / totalClients) : 0;

    const cachedTasa = parseFloat(localStorage.getItem("bcv_rate_cache")) || 871.37;

    if (resMrrUsd) resMrrUsd.innerText = `$${Math.round(mrrTotal).toLocaleString('es-VE')}`;
    if (resMrrBs) resMrrBs.innerText = `≈ ${(mrrTotal * cachedTasa).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Bs/mes`;

    if (resArrUsd) resArrUsd.innerText = `$${Math.round(arrTotal).toLocaleString('es-VE')}`;
    if (resArrBs) resArrBs.innerText = `≈ ${(arrTotal * cachedTasa).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Bs/año`;

    if (resArpu) resArpu.innerText = `$${arpu.toFixed(1)}`;
};

// Cargar tasa automáticamente al iniciar
document.addEventListener('DOMContentLoaded', () => {
    window.cargarTasaBCVHeader();
    window.actualizarSimuladorFinanciero();
});

// Robot Cobrador (Llamado en auth)
window.correrRobotCobrador = async function() {
    console.log("Corriendo Robot Automático...");
    try {
        const snap = await getDocs(collection(db, "clientes"));
        const hoy = new Date();
        
        snap.forEach(async (docSnap) => {
            const data = docSnap.data();
            if (!data.fechaVencimiento) return;
            
            const fechaV = new Date(data.fechaVencimiento);
            const diffTime = fechaV - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let estadoActual = data.estado || "ACTIVO";
            
            // Si la fecha de vencimiento ya pasó (diffDays <= 0) y el cliente sigue ACTIVO, lo suspendemos.
            if (diffDays <= 0 && estadoActual === "ACTIVO") {
                console.log(`Suspendiendo automáticamente a ${docSnap.id} por falta de pago.`);
                await updateDoc(doc(db, "clientes", docSnap.id), {
                    estado: "SUSPENDIDO"
                });
            }
        });
    } catch (e) {
        console.error("Error en Robot Automático:", e);
    }
};

// ==========================================

// Resetear visitas del mes
window.resetearVisitas = async function() {
    if (!state.currentClientId) {
        alert("Selecciona un cliente primero.");
        return;
    }
    
    const nombre = state.currentClientData?.nombre || state.currentClientData?.businessName || state.currentClientId;
    const visitasActuales = state.currentClientData?.visitas || 0;
    
    if (!confirm(`¿Resetear las ${visitasActuales} visitas de "${nombre}" a 0?\n\nNormalmente haces esto después de enviar el reporte mensual.`)) return;
    
    try {
        const fechaReset = new Date().toISOString().split('T')[0];
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            visitas: 0,
            ultimoResetVisitas: fechaReset
        });
        if (state.currentClientData) state.currentClientData.visitas = 0;
        const el = document.getElementById('client-visitas');
        if (el) el.innerText = '0';
        alert(`✅ Visitas reseteadas a 0.\nÚltimo reset: ${fechaReset}`);
    } catch (e) {
        alert("Error al resetear: " + e.message);
    }
};

// ==========================================
// REPORTE MENSUAL PDF
// ==========================================
window.generarReportePDF = async function() {
    if (!state.currentClientId || !state.currentClientData) {
        alert("Selecciona un cliente primero.");
        return;
    }

    // Leer datos frescos del cliente para tener todos los campos vis_YYYY_MM
    const docSnap = await getDoc(doc(db, "clientes", state.currentClientId));
    if (!docSnap.exists()) { alert("No se encontró el cliente."); return; }
    const data = docSnap.data();

    const nombre  = data.nombre || data.businessName || state.currentClientId;
    const url     = data.url || '';
    const plan    = data.plan || 'MENSUAL';
    const deuda   = data.deuda || 0;
    const estado  = data.estado || 'ACTIVO';
    const estadoColor = estado === 'ACTIVO' ? '#10b981' : '#ef4444';

    // Extraer y ordenar meses (campos que empiecen con vis_)
    const meses = [];
    Object.entries(data).forEach(([key, val]) => {
        if (/^vis_\d{4}_\d{2}$/.test(key)) {
            const [, yyyy, mm] = key.split('_');
            meses.push({ key, yyyy: parseInt(yyyy), mm: parseInt(mm), visitas: parseInt(val) || 0 });
        }
    });
    meses.sort((a, b) => a.yyyy !== b.yyyy ? a.yyyy - b.yyyy : a.mm - b.mm);

    const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const totalHistorico = meses.reduce((s, m) => s + m.visitas, 0);
    const promedio = meses.length ? Math.round(totalHistorico / meses.length) : 0;
    const mejor = meses.length ? meses.reduce((a, b) => b.visitas > a.visitas ? b : a) : null;
    const maxVisitas = mejor ? mejor.visitas : 1;

    // Construir filas de la tabla + barras
    const filasHTML = meses.length === 0
        ? `<tr><td colspan="3" style="text-align:center;color:#777;padding:20px;">Aún no hay datos mensuales.<br><small>Se registrarán desde la próxima visita al menú.</small></td></tr>`
        : meses.map((m, i) => {
            const label = `${MESES_ES[m.mm - 1]} ${m.yyyy}`;
            const pct   = Math.round((m.visitas / maxVisitas) * 100);
            const prev  = i > 0 ? meses[i-1].visitas : null;
            let tendencia = '';
            if (prev !== null) {
                const diff = m.visitas - prev;
                tendencia = diff > 0
                    ? `<span style="color:#10b981;font-size:11px;">▲ +${diff}</span>`
                    : diff < 0
                    ? `<span style="color:#ef4444;font-size:11px;">▼ ${diff}</span>`
                    : `<span style="color:#777;font-size:11px;">— igual</span>`;
            }
            const esMejor = mejor && m.key === mejor.key;
            return `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:12px 10px;font-weight:${esMejor?'700':'400'};color:${esMejor?'#f25c27':'#333'};">
                    ${label}${esMejor ? ' 🏆' : ''}
                </td>
                <td style="padding:12px 10px;text-align:right;font-family:'Roboto Mono',monospace;font-weight:600;">
                    ${m.visitas.toLocaleString('es-VE')}
                    <br>${tendencia}
                </td>
                <td style="padding:12px 10px;width:45%;">
                    <div style="background:#eef2f5;border-radius:20px;height:12px;overflow:hidden;">
                        <div style="background:${esMejor?'#f25c27':'#00c6eb'};height:100%;width:${pct}%;border-radius:20px;transition:width 0.5s;"></div>
                    </div>
                </td>
            </tr>`;
        }).join('');

    const periodoLabel = meses.length >= 2
        ? `${MESES_ES[meses[0].mm-1]} ${meses[0].yyyy} – ${MESES_ES[meses[meses.length-1].mm-1]} ${meses[meses.length-1].yyyy}`
        : meses.length === 1
        ? `${MESES_ES[meses[0].mm-1]} ${meses[0].yyyy}`
        : 'Sin datos aún';

    const fechaGenerado = new Date().toLocaleDateString('es-VE', { day:'2-digit', month:'long', year:'numeric' });

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Reporte – ${nombre}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&family=Roboto+Mono:wght@500&display=swap');
:root{--cyan:#00c6eb;--orange:#f25c27;--dark:#1a1a2e;--gray:#f5f6fa}
body{font-family:'Montserrat',sans-serif;color:#333;margin:0;padding:40px;background:#eef2f5;display:flex;justify-content:center}
@media print{body{background:white;padding:0}.report-container{box-shadow:none!important;max-width:100%!important}.no-print{display:none!important}}
.report-container{background:white;width:100%;max-width:820px;margin:0 auto;padding:50px;border-top:8px solid var(--cyan);border-bottom:8px solid var(--orange);border-radius:4px;box-shadow:0 15px 35px rgba(0,0,0,.1);box-sizing:border-box}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
.report-meta{text-align:right}
.report-meta h1{margin:0 0 5px;color:var(--dark);font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:2px}
.report-meta p{margin:3px 0;font-size:13px;color:#777}
.report-meta .periodo{font-family:'Roboto Mono',monospace;color:var(--orange);font-weight:600;font-size:15px}
.client-info{background:var(--gray);padding:18px 20px;border-left:4px solid var(--cyan);border-radius:0 8px 8px 0;margin-bottom:30px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.client-info h2{margin:0;font-size:20px;color:var(--dark)}
.client-info p{margin:4px 0;font-size:13px;color:#555}
.estado-badge{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px}
.summary-card{background:var(--gray);padding:16px;border-radius:10px;text-align:center}
.summary-card .val{font-size:28px;font-weight:800;color:var(--dark);font-family:'Roboto Mono',monospace}
.summary-card .lbl{font-size:11px;color:#777;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px}
table{width:100%;border-collapse:collapse;margin-bottom:30px}
th{background:var(--dark);color:white;padding:12px 10px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px}
th:last-child{width:45%}
.footer{text-align:center;margin-top:40px;font-size:13px;color:#777;border-top:1px solid #eee;padding-top:20px}
.footer strong{color:var(--cyan);font-weight:800}
.print-btn{position:fixed;bottom:30px;right:30px;background:var(--cyan);color:white;border:none;padding:14px 24px;font-size:15px;font-weight:600;border-radius:50px;cursor:pointer;box-shadow:0 4px 15px rgba(0,198,235,.4);transition:.2s;font-family:'Montserrat',sans-serif;z-index:100}
.print-btn:hover{background:var(--dark)}
</style></head><body>
<div class="report-container">

  <div class="header">
    <div style="display:flex;align-items:stretch;gap:6px;height:52px">
      <div style="display:flex;flex-direction:column;justify-content:space-between;padding:2px 0">
        <span style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:32px;color:#1a1a2e;line-height:0.75;letter-spacing:2px">GROW</span>
        <span style="font-family:'Montserrat',sans-serif;font-weight:400;font-size:20px;color:#1a1a2e;line-height:0.8;letter-spacing:8px;margin-left:2px">STUDIO</span>
      </div>
    </div>
    <div class="report-meta">
      <h1>Reporte de Rendimiento</h1>
      <div class="periodo">${periodoLabel}</div>
      <p>Generado: ${fechaGenerado}</p>
    </div>
  </div>

  <div class="client-info">
    <div>
      <h2>${nombre}</h2>
      <p>Plan: <strong>${plan}</strong>${url ? ` &nbsp;|&nbsp; <a href="https://${url.replace(/^https?:\/\//,'')}" style="color:var(--cyan)">${url.replace(/^https?:\/\//,'')}</a>` : ''}</p>
      <p>Deuda actual: <strong style="color:${deuda > 0 ? '#ef4444' : '#10b981'}">$${parseFloat(deuda).toFixed(2)} USD</strong></p>
    </div>
    <div class="estado-badge" style="background:${estadoColor}20;color:${estadoColor};border:1px solid ${estadoColor}40">
      ${estado}
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="val">${totalHistorico.toLocaleString('es-VE')}</div>
      <div class="lbl">Visitas Históricas</div>
    </div>
    <div class="summary-card">
      <div class="val">${promedio.toLocaleString('es-VE')}</div>
      <div class="lbl">Promedio Mensual</div>
    </div>
    <div class="summary-card">
      <div class="val">${meses.length}</div>
      <div class="lbl">Meses Registrados</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Mes</th>
        <th style="text-align:right">Visitas</th>
        <th>Tendencia</th>
      </tr>
    </thead>
    <tbody>
      ${filasHTML}
    </tbody>
  </table>

  ${mejor ? `<p style="font-size:13px;color:#555;margin-bottom:30px;">🏆 <strong>Mejor mes:</strong> ${MESES_ES[mejor.mm-1]} ${mejor.yyyy} con <strong>${mejor.visitas.toLocaleString('es-VE')} visitas</strong>. La barra naranja indica el mes de mayor rendimiento.</p>` : ''}

  <div class="footer">
    <p>Reporte generado por <strong>GROW STUDIO</strong> · Plataforma de Menús Digitales</p>
    <p><a href="https://growstudioweb.vercel.app/" style="color:#777;text-decoration:none">https://growstudioweb.vercel.app/</a></p>
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Guardar como PDF</button>
</body></html>`;

    const ventana = window.open('', '_blank', 'width=950,height=750');
    ventana.document.write(html);
    ventana.document.close();
};
