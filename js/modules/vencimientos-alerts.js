import { state } from "./state.js";

// ==============================================================================
// 🔔 SISTEMA DE ALERTAS Y NOTIFICACIONES DE VENCIMIENTO DE MENÚS (GROW STUDIO)
// Notificaciones Web Push nativas para móvil y escritorio + Panel ejecutivo
// ==============================================================================

let alertaClientesCache = [];
let notificacionEnviadaSesion = false;

// 1. Solicitar Permiso para Notificaciones Nativas en Móvil/PC
export async function solicitarPermisoNotificaciones() {
    if (!('Notification' in window)) {
        if (window.showToast) window.showToast("Tu navegador no soporta Notificaciones Push.");
        else alert("Tu navegador no soporta Notificaciones Push.");
        return false;
    }

    try {
        const permiso = await Notification.requestPermission();
        actualizarBotonPermisoUI();

        if (permiso === 'granted') {
            if (window.showToast) window.showToast("🔔 Notificaciones de vencimiento activadas con éxito.");
            dispararNotificacionNativa(
                "Grow Studio SaaS",
                "Las alertas de vencimiento de menús digitales están ahora activas.",
                "img/growisotipo.png"
            );
            return true;
        } else {
            if (window.showToast) window.showToast("Permiso de notificaciones denegado.", "error");
            return false;
        }
    } catch (err) {
        console.error("Error solicitando permisos de notificación:", err);
        return false;
    }
}

// 2. Disparar Notificación Nativa en el Móvil/Sistema Operativo
export function dispararNotificacionNativa(titulo, cuerpo, icono = 'img/growisotipo.png', tag = 'grow-vencimientos') {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const opciones = {
        body: cuerpo,
        icon: icono,
        badge: 'img/growisotipo.png',
        tag: tag,
        vibrate: [200, 100, 200],
        requireInteraction: false
    };

    // Si el Service Worker está activo, usarlo para compatibilidad en móviles Android
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(titulo, opciones).catch(() => {
                new Notification(titulo, opciones);
            });
        }).catch(() => {
            new Notification(titulo, opciones);
        });
    } else {
        new Notification(titulo, opciones);
    }
}

// 3. Evaluar Estado de Vencimiento de Todos los Clientes
export function analizarVencimientosClientes() {
    const clientes = state.allClientsCache || [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const resultado = {
        vencidos: [],
        urgentes: [],   // 1 a 3 días
        proximos: [],   // 4 a 7 días
        alDia: [],
        totalAlertas: 0
    };

    clientes.forEach(c => {
        const data = c.data || {};
        const fechaVStr = data.fechaVencimiento || data.vencimiento;
        if (!fechaVStr) return;

        const [y, m, d] = fechaVStr.split('-').map(Number);
        if (!y || !m || !d) return;

        const fechaV = new Date(y, m - 1, d);
        fechaV.setHours(0, 0, 0, 0);

        const diffTime = fechaV - hoy;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const item = {
            id: c.id,
            nombre: data.businessName || data.nombre || c.id,
            telefono: data.whatsapp || data.telefono || '',
            plan: data.plan || 'MENSUAL',
            deuda: parseFloat(data.deuda) || 0,
            fechaVencimiento: fechaVStr,
            diffDays: diffDays,
            estado: data.estado || 'ACTIVO'
        };

        if (diffDays < 0) {
            resultado.vencidos.push(item);
        } else if (diffDays >= 0 && diffDays <= 3) {
            resultado.urgentes.push(item);
        } else if (diffDays > 3 && diffDays <= 7) {
            resultado.proximos.push(item);
        } else {
            resultado.alDia.push(item);
        }
    });

    // Ordenar de mayor a menor urgencia
    resultado.vencidos.sort((a, b) => a.diffDays - b.diffDays);
    resultado.urgentes.sort((a, b) => a.diffDays - b.diffDays);
    resultado.proximos.sort((a, b) => a.diffDays - b.diffDays);

    resultado.totalAlertas = resultado.vencidos.length + resultado.urgentes.length;
    alertaClientesCache = resultado;

    actualizarWidgetBadge(resultado);

    // Si hay alertas urgentes o vencidas y aún no se notificó en esta sesión
    if (resultado.totalAlertas > 0 && !notificacionEnviadaSesion) {
        notificacionEnviadaSesion = true;
        
        let textoNotif = "";
        if (resultado.vencidos.length > 0) {
            textoNotif = `🚨 Tienes ${resultado.vencidos.length} cliente(s) con menú VENCIDO (ej. ${resultado.vencidos[0].nombre}).`;
        } else if (resultado.urgentes.length > 0) {
            textoNotif = `⚠️ ${resultado.urgentes.length} cliente(s) vencen en 3 días o menos (ej. ${resultado.urgentes[0].nombre}).`;
        }

        dispararNotificacionNativa("Grow Studio SaaS: Alerta de Cobro", textoNotif);
    }

    return resultado;
}

// 4. Actualizar el Contador de la Campana en la Barra Superior
function actualizarWidgetBadge(res) {
    const badge = document.getElementById('badge-vencimientos-top');
    const widget = document.getElementById('vencimientos-top-widget');
    if (!badge) return;

    badge.innerText = res.totalAlertas;

    if (res.vencidos.length > 0) {
        badge.style.background = '#ef4444';
        badge.style.color = '#ffffff';
        badge.style.borderColor = '#ef4444';
        badge.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.7)';
        if (widget) widget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else if (res.urgentes.length > 0) {
        badge.style.background = '#f59e0b';
        badge.style.color = '#000000';
        badge.style.borderColor = '#f59e0b';
        badge.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.7)';
        if (widget) widget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    } else {
        badge.style.background = 'rgba(16, 185, 129, 0.2)';
        badge.style.color = '#10b981';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        badge.style.boxShadow = 'none';
        if (widget) widget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    }
}

// 5. Renderizar el Modal Interactivo de Alertas
export function renderModalAlertas() {
    const listContainer = document.getElementById('alertas-vencimiento-list');
    const resumenBox = document.getElementById('alertas-resumen-badges');
    if (!listContainer) return;

    const res = alertaClientesCache.totalAlertas !== undefined ? alertaClientesCache : analizarVencimientosClientes();
    actualizarBotonPermisoUI();

    if (resumenBox) {
        resumenBox.innerHTML = `
            <span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">
                🚨 ${res.vencidos.length} Vencidos
            </span>
            <span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">
                ⚠️ ${res.urgentes.length} Próximos (1-3 días)
            </span>
            <span style="background: rgba(0, 210, 255, 0.15); color: var(--brand-cyan); border: 1px solid rgba(0, 210, 255, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;">
                ⏰ ${res.proximos.length} En 4-7 días
            </span>
        `;
    }

    const todosLosAlertados = [...res.vencidos, ...res.urgentes, ...res.proximos];

    if (todosLosAlertados.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #a1a1aa;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">🎉</div>
                <h4 style="color: #10b981; margin: 0 0 6px 0; font-size: 1.1rem;">¡Todo al día!</h4>
                <p style="font-size: 12px; margin: 0;">No hay menús vencidos ni por vencer en los próximos 7 días.</p>
            </div>
        `;
        return;
    }

    const tasaBCV = parseFloat(localStorage.getItem('bcv_rate_cache')) || 876.80;

    let html = '';
    todosLosAlertados.forEach(c => {
        let tagEstado = '';
        let borderColor = 'rgba(255,255,255,0.08)';
        let bgCard = 'rgba(255,255,255,0.02)';

        if (c.diffDays < 0) {
            const diasVencido = Math.abs(c.diffDays);
            tagEstado = `<span style="background: rgba(239, 68, 68, 0.25); color: #ef4444; border: 1px solid #ef4444; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">🚨 Vencido hace ${diasVencido} día(s)</span>`;
            borderColor = 'rgba(239, 68, 68, 0.35)';
            bgCard = 'rgba(239, 68, 68, 0.04)';
        } else if (c.diffDays === 0) {
            tagEstado = `<span style="background: rgba(239, 68, 68, 0.25); color: #ef4444; border: 1px solid #ef4444; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">⚠️ Vence HOY</span>`;
            borderColor = 'rgba(239, 68, 68, 0.35)';
            bgCard = 'rgba(239, 68, 68, 0.04)';
        } else if (c.diffDays <= 3) {
            tagEstado = `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">⚠️ Vence en ${c.diffDays} día(s)</span>`;
            borderColor = 'rgba(245, 158, 11, 0.35)';
            bgCard = 'rgba(245, 158, 11, 0.04)';
        } else {
            tagEstado = `<span style="background: rgba(0, 210, 255, 0.15); color: var(--brand-cyan); border: 1px solid var(--brand-cyan); padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">⏰ Vence en ${c.diffDays} días</span>`;
        }

        // Monto referencial y cálculo en Bs
        const montoUSD = c.deuda > 0 ? c.deuda : (c.plan === 'ANUAL' ? 200 : 20);
        const montoBs = (montoUSD * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Mensaje WhatsApp profesional pre-redactado
        const tlfClean = c.telefono.replace(/\D/g, '');
        let mensajeWs = "";
        if (c.diffDays < 0) {
            mensajeWs = `Hola ${c.nombre}! Te saludamos cordialmente de Grow Studio. Te escribimos para recordarte que la mensualidad de tu plataforma de Menú Digital se encuentra vencida desde el ${c.fechaVencimiento}. El monto es de $${montoUSD} USD (${montoBs} Bs a tasa oficial BCV). Quedamos a tu orden para recibir el comprobante de pago y mantener tu menú activo. ¡Muchas gracias!`;
        } else if (c.diffDays === 0) {
            mensajeWs = `Hola ${c.nombre}! Te saludamos cordialmente de Grow Studio. Te recordamos que el día de hoy vence la mensualidad de tu Menú Digital. El monto es de $${montoUSD} USD (${montoBs} Bs a tasa oficial BCV). Quedamos atentos para renovar tu servicio con éxito. ¡Feliz día!`;
        } else {
            mensajeWs = `Hola ${c.nombre}! Te saludamos cordialmente de Grow Studio. Te escribimos para recordarte con antelación que tu servicio de Menú Digital vence en ${c.diffDays} día(s) (el ${c.fechaVencimiento}). El monto correspondiente es de $${montoUSD} USD (${montoBs} Bs a tasa BCV). ¡Gracias por tu confianza!`;
        }

        const linkWhatsApp = tlfClean ? `https://wa.me/${tlfClean}?text=${encodeURIComponent(mensajeWs)}` : '';

        html += `
            <div style="background: ${bgCard}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 220px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                        <strong style="color: #ffffff; font-size: 14px;">${c.nombre}</strong>
                        ${tagEstado}
                    </div>
                    <div style="font-size: 12px; color: #a1a1aa; display: flex; gap: 15px; flex-wrap: wrap;">
                        <span>🗓️ Fecha de Corte: <strong style="color: #fff;">${c.fechaVencimiento}</strong></span>
                        <span>💰 Monto: <strong style="color: #00ff66;">$${montoUSD} USD</strong> <span style="font-size: 11px; color: #888;">(≈ ${montoBs} Bs)</span></span>
                        <span>📱 WhatsApp: <strong style="color: #fff;">${c.telefono || 'No registrado'}</strong></span>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                    ${linkWhatsApp ? `
                        <a href="${linkWhatsApp}" target="_blank" class="btn-primary btn-small" style="background: #25D366; border-color: #25D366; color: #000; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 5px; text-decoration: none; padding: 7px 12px; border-radius: 8px;" title="Enviar recordatorio automático por WhatsApp">
                            <span>💬</span> Cobrar por WhatsApp
                        </a>
                    ` : `
                        <button disabled class="btn-secondary btn-small" style="font-size: 11px; opacity: 0.5;">Sin WhatsApp</button>
                    `}
                    <button type="button" onclick="window.abrirClienteDesdeAlerta('${c.id}')" class="btn-secondary btn-small" style="font-size: 11px; padding: 7px 10px; border-color: rgba(255,255,255,0.2);" title="Ver ficha del restaurante">
                        👀 Ver
                    </button>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// 6. Abrir Cliente Directamente desde una Alerta
window.abrirClienteDesdeAlerta = function(clienteId) {
    const modal = document.getElementById('modal-alertas-vencimiento');
    if (modal) modal.style.display = 'none';

    if (window.selectClient) {
        window.selectClient(clienteId);
    }
};

// 7. Abrir y Cerrar Modal
export function abrirModalAlertasVencimiento() {
    const modal = document.getElementById('modal-alertas-vencimiento');
    if (!modal) return;
    analizarVencimientosClientes();
    renderModalAlertas();
    modal.style.display = 'flex';
}

export function cerrarModalAlertasVencimiento() {
    const modal = document.getElementById('modal-alertas-vencimiento');
    if (modal) modal.style.display = 'none';
}

function actualizarBotonPermisoUI() {
    const btnPermiso = document.getElementById('btn-activar-push-notif');
    if (!btnPermiso) return;

    if (!('Notification' in window)) {
        btnPermiso.style.display = 'none';
        return;
    }

    if (Notification.permission === 'granted') {
        btnPermiso.innerHTML = `<span>🟢</span> Alertas Push Activas`;
        btnPermiso.style.background = 'rgba(16, 185, 129, 0.15)';
        btnPermiso.style.color = '#10b981';
        btnPermiso.style.borderColor = '#10b981';
        btnPermiso.disabled = true;
    } else {
        btnPermiso.innerHTML = `<span>🔔</span> Activar Alertas en Móvil / PC`;
        btnPermiso.style.background = 'rgba(0, 210, 255, 0.15)';
        btnPermiso.style.color = 'var(--brand-cyan)';
        btnPermiso.style.borderColor = 'var(--brand-cyan)';
        btnPermiso.disabled = false;
    }
}

// Funciones globales expuestas al window
window.abrirModalAlertasVencimiento = abrirModalAlertasVencimiento;
window.cerrarModalAlertasVencimiento = cerrarModalAlertasVencimiento;
window.solicitarPermisoNotificaciones = solicitarPermisoNotificaciones;
window.analizarVencimientosClientes = analizarVencimientosClientes;

// Inicialización automática periódica (cada 5 minutos y al cargar datos)
setInterval(() => {
    if (state.allClientsCache && state.allClientsCache.length > 0) {
        analizarVencimientosClientes();
    }
}, 5 * 60 * 1000);
