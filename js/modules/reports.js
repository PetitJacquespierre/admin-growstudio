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
