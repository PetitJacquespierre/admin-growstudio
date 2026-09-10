import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// Lógica para el botón Importar con IA
if(DOM.btnImportBulk) DOM.btnImportBulk.addEventListener('click', () => {
    DOM.importRawText.value = ''; // Limpiar el área de texto
    // Cargar API key guardada
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) DOM.geminiApiKey.value = savedKey;
    DOM.importModal.style.display = 'flex';
});

if(DOM.btnCancelImport) DOM.btnCancelImport.addEventListener('click', () => {
    DOM.importModal.style.display = 'none';
});

if(DOM.btnConfirmImport) DOM.btnConfirmImport.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    
    const rawText = DOM.importRawText.value.trim();
    const apiKey = DOM.geminiApiKey.value.trim();
    
    if (!rawText || !apiKey) {
        alert("Por favor, ingresa el texto del menú y tu API Key de Gemini.");
        return;
    }
    
    // Guardar la llave para el futuro
    localStorage.setItem('gemini_api_key', apiKey);
    
    try {
        DOM.btnConfirmImport.disabled = true;
        DOM.btnCancelImport.disabled = true;
        DOM.aiLoadingText.style.display = 'block';
        
        // Llamada a la API de Gemini (REST) usando el modelo más reciente (3.6-flash)
        const promptText = `
        Tengo este menú crudo de un restaurante. Extrae todos los productos y devuélvelos estrictamente como un arreglo de objetos JSON con esta estructura exacta, basándote en un esquema de Excel, sin texto extra:
        [
          {
            "id": "generar un ID numérico único",
            "categoria": "string (usa tu mejor juicio, ej: Hamburguesas, Bebidas)",
            "nombre": "string",
            "descripcion": "string (ingredientes)",
            "precio": number (solo el número, ej: 5.50),
            "imagen": "string (nombre archivo, ej: hamburguesa.jpg o url)",
            "activo": "SI"
          }
        ]
        
        Menú crudo a procesar:
        ${rawText}
        `;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        let aiResponseText = result.candidates[0].content.parts[0].text;
        
        // Limpiar el texto en caso de que Gemini haya devuelto markdown
        aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonData = JSON.parse(aiResponseText);
        
        if (!Array.isArray(jsonData)) {
            throw new Error("La IA no devolvió una lista válida.");
        }
        
        // Formatear precios por seguridad
        const cleanData = jsonData.map(p => ({
            ...p,
            precio: parseFloat(p.precio) || 0
        }));
        
        const docRef = doc(db, "clientes", state.currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        let productosActuales = data.productos || [];
        
        // Agregar los nuevos productos a los existentes
        productosActuales = productosActuales.concat(cleanData);
        
        await updateDoc(docRef, { productos: productosActuales });
        window.renderProducts(productosActuales);
        
        DOM.importModal.style.display = 'none';
        alert(`¡Inteligencia Artificial Exitosamente aplicada! Se importaron ${cleanData.length} productos automáticamente.`);
    } catch (e) {
        alert("Error de la IA o de red: " + e.message);
    } finally {
        DOM.btnConfirmImport.disabled = false;
        DOM.btnCancelImport.disabled = false;
        DOM.aiLoadingText.style.display = 'none';
    }
});



// ==========================================
// MÓDULO DE PAGOS Y FACTURACIÓN (ROBOT COBRADOR)
// ==========================================
const btnViewPayments = document.getElementById('btn-view-payments');
const paymentsScreen = document.getElementById('payments-screen');
const paymentsTbody = document.getElementById('payments-tbody');

// Botón sidebar para ver pagos
if(btnViewPayments) btnViewPayments.addEventListener('click', () => {
    DOM.clientManager.style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'none';
    paymentsScreen.style.display = 'flex';
    
    document.querySelectorAll('.menu-list li').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    btnViewPayments.classList.add('active');
    
    cargarPagos();
});

async function cargarPagos() {
    paymentsTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando pagos...</td></tr>';
    try {
        let docsArray = [];
        try {
            const q = query(collection(db, "pagos"), orderBy("fechaRegistro", "desc"));
            const snapshot = await getDocs(q);
            snapshot.forEach(d => docsArray.push({ id: d.id, ...d.data() }));
        } catch (e) {
            console.warn("Fallo orderBy fechaRegistro, obteniendo sin orden de Firebase:", e);
            const snapshot = await getDocs(collection(db, "pagos"));
            snapshot.forEach(d => docsArray.push({ id: d.id, ...d.data() }));
            docsArray.sort((a, b) => {
                const dateA = new Date(a.fechaRegistro || a.fecha || 0);
                const dateB = new Date(b.fechaRegistro || b.fecha || 0);
                return dateB - dateA;
            });
        }
        
        paymentsTbody.innerHTML = '';
        
        if (docsArray.length === 0) {
            paymentsTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: #9ca3af;">No hay pagos registrados aún.</td></tr>';
            return;
        }

        docsArray.forEach(p => {
            const tr = document.createElement('tr');
            
            let btnAccion = '';
            let badgeClass = 'por-revisar';
            if (p.estado === "POR REVISAR") {
                btnAccion = `<button class="btn-primary btn-small" onclick="window.aprobarPago('${p.id}', '${p.cedula || p.clienteId}', ${p.monto}, '${p.fechaLocal || 'Hoy'}', '${p.referencia || '-'}', '${p.clienteId || ''}')">✅ Aprobar</button>`;
            } else if (p.estado === "APROBADO") {
                badgeClass = 'aprobado';
                btnAccion = `<button class="btn-secondary btn-small" style="color:var(--brand-orange); border: 1px solid var(--brand-orange);" onclick="window.generarReciboPDF('${p.cedula || p.clienteId}', ${p.monto}, '${p.montoReportado || p.monto}', '${p.moneda || 'USD'}', ${p.tasaBcv || 0}, '${p.fechaLocal || 'Hoy'}', '${p.referencia || '-'}', '${p.nombre || ''}')">📥 PDF</button>`;
            }
            
            // Botón eliminar siempre visible
            const btnEliminar = `<button class="btn-secondary btn-small" style="color:#ef4444; border:1px solid #ef4444; margin-top:4px;" onclick="window.eliminarPago('${p.id}')">🗑️ Borrar</button>`;
            
            // Si el pago es en Bolívares (Pago Móvil), reflejar claramente los Bolívares y el monto equivalente en Dólares
            let montoHTML = '';
            if (p.moneda === 'Bs' || p.metodo === 'Pago Móvil') {
                const bsVal = p.montoReportado || p.monto;
                const tasaVal = p.tasaBcv ? Number(p.tasaBcv).toFixed(2) : '-';
                montoHTML = `
                    <div style="font-weight: bold; color: #4ade80; font-size: 14px;">
                        ${Number(bsVal).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                    </div>
                    <div style="font-size: 11px; color: #fff; margin-top: 2px;">
                        ($${Number(p.monto).toFixed(2)} USD)
                    </div>
                    <div style="font-size: 10px; color: #9ca3af;">
                        Tasa BCV: ${tasaVal}
                    </div>
                `;
            } else {
                montoHTML = `
                    <div style="font-weight: bold; color: #fff; font-size: 14px;">
                        $${Number(p.monto).toFixed(2)} USD
                    </div>
                    <div style="font-size: 11px; color: #a1a1aa; margin-top: 2px;">
                        ${p.metodo || 'Divisa'}
                    </div>
                `;
            }

            tr.innerHTML = `
                <td>${p.fechaLocal || 'Reciente'}</td>
                <td>
                    <strong>${p.cedula || p.clienteId || 'N/A'}</strong>
                    <small style="display:block; color:#9ca3af; font-size:11px;">${p.nombre || ''}</small>
                </td>
                <td>${p.plan || p.metodo || 'N/A'}</td>
                <td>${montoHTML}</td>
                <td>
                    <strong>${p.referencia}</strong>
                    <small style="display:block; color:#9ca3af; font-size:11px;">${p.metodo || ''}</small>
                </td>
                <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                <td style="display:flex; flex-direction:column; gap:4px;">
                    ${btnAccion}
                    ${btnEliminar}
                </td>
            `;
            paymentsTbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar pagos:", error);
        paymentsTbody.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar pagos: ' + error.message + '</td></tr>';
    }
}

// Eliminar pago
window.eliminarPago = async function(pagoId) {
    if (!confirm("¿Seguro que deseas eliminar este pago? Esta acción no se puede deshacer.")) return;
    try {
        await deleteDoc(doc(db, "pagos", pagoId));
        cargarPagos();
    } catch (error) {
        alert("Error al eliminar: " + error.message);
    }
};

// Helper: calcular nueva fecha de vencimiento según el plan
function calcularNuevaFecha(fechaActual, plan) {
    // Base: si la fecha ya venció, partir de hoy; si aún vigente, partir de esa fecha
    const hoy = new Date();
    let base = fechaActual ? new Date(fechaActual + 'T00:00:00') : hoy;
    if (base < hoy) base = hoy; // si ya venció, extender desde hoy
    
    const planUpper = (plan || 'MENSUAL').toUpperCase();
    if (planUpper.includes('ANUAL')) {
        base.setFullYear(base.getFullYear() + 1);
    } else if (planUpper.includes('SEMESTRAL')) {
        base.setMonth(base.getMonth() + 6);
    } else if (planUpper.includes('TRIMESTRAL')) {
        base.setMonth(base.getMonth() + 3);
    } else {
        // MENSUAL o PRUEBA o cualquier otro → +1 mes
        base.setMonth(base.getMonth() + 1);
    }
    // Devolver en formato YYYY-MM-DD
    return base.toISOString().split('T')[0];
}

// Hacer global para el onclick inline
window.aprobarPago = async function(pagoId, cedulaPago, montoPagado, fechaPago, referenciaPago, clienteIdDirecto) {
    if (!confirm("¿Confirmas que recibiste $" + montoPagado + " y deseas aprobarlo?")) return;
    
    try {
        const { doc: fDoc, updateDoc: fUpdateDoc, getDocs: fGetDocs, query: fQuery, collection: fCollection, where: fWhere, getDoc: fGetDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        await fUpdateDoc(fDoc(db, "pagos", pagoId), { estado: "APROBADO" });

        let clienteEncontrado = false;
        
        // Función interna para actualizar un cliente encontrado
        async function actualizarCliente(clienteId, clienteData) {
            const nuevaDeuda = Math.max(0, (clienteData.deuda || 0) - montoPagado);
            const nuevaFecha = calcularNuevaFecha(clienteData.fechaVencimiento, clienteData.plan);
            await fUpdateDoc(fDoc(db, "clientes", clienteId), {
                deuda: nuevaDeuda,
                estado: "ACTIVO",
                fechaVencimiento: nuevaFecha
            });
            return nuevaFecha;
        }
        
        let nuevaFechaFinal = '';
        
        // 1. Intentar por clienteId directo
        if (clienteIdDirecto) {
            try {
                const snap = await fGetDoc(fDoc(db, "clientes", clienteIdDirecto));
                if (snap.exists()) {
                    nuevaFechaFinal = await actualizarCliente(clienteIdDirecto, snap.data());
                    clienteEncontrado = true;
                }
            } catch(e) { console.warn("No se pudo por clienteIdDirecto:", e); }
        }
        
        // 2. Buscar por campo cedula
        if (!clienteEncontrado) {
            const q = fQuery(fCollection(db, "clientes"), fWhere("cedula", "==", cedulaPago));
            const snap = await fGetDocs(q);
            if (!snap.empty) {
                for (const cDoc of snap.docs) {
                    nuevaFechaFinal = await actualizarCliente(cDoc.id, cDoc.data());
                    clienteEncontrado = true;
                }
            }
        }
        
        // 3. Buscar por campo usuario
        if (!clienteEncontrado) {
            const q2 = fQuery(fCollection(db, "clientes"), fWhere("usuario", "==", cedulaPago.toLowerCase()));
            const snap2 = await fGetDocs(q2);
            if (!snap2.empty) {
                for (const cDoc of snap2.docs) {
                    nuevaFechaFinal = await actualizarCliente(cDoc.id, cDoc.data());
                    clienteEncontrado = true;
                }
            }
        }
        
        if (!clienteEncontrado) {
            alert("Pago marcado APROBADO, pero no se encontró el cliente para actualizar. Verifícalo manualmente.");
        } else {
            alert(`✅ Pago aprobado. Vencimiento extendido hasta: ${nuevaFechaFinal}`);
            
            // Actualizar el indicador de Cobranza en pantalla si el cliente está abierto
            const indicator = document.getElementById('billing-status-indicator');
            const inputVencimiento = document.getElementById('client-vencimiento');
            const inputDeuda = document.getElementById('client-deuda');
            if (indicator && inputVencimiento) {
                inputVencimiento.value = nuevaFechaFinal;
                const hoy = new Date();
                const fechaV = new Date(nuevaFechaFinal + 'T00:00:00');
                const diff = Math.ceil((fechaV - hoy) / (1000*60*60*24));
                if (diff > 7) indicator.style.background = '#10b981';
                else if (diff >= 0 && diff <= 7) indicator.style.background = '#f59e0b';
                else indicator.style.background = '#ef4444';
            }
            if (inputDeuda) {
                const deudaActual = parseFloat(inputDeuda.value) || 0;
                inputDeuda.value = Math.max(0, deudaActual - montoPagado);
            }
        }
        
        cargarPagos();
    } catch (error) {
        alert("Error al aprobar el pago: " + error.message);
    }
};

// Generar recibo PDF en ventana emergente basado en la plantilla recibo.html
window.generarReciboPDF = function(cedula, montoUSD, montoReportado, moneda, tasaBcv, fechaPago, referencia, nombreCliente) {
    const monto = parseFloat(montoUSD) || 0;
    const reportado = parseFloat(montoReportado) || monto;
    const tasa = parseFloat(tasaBcv) || 0;
    
    const montoTexto = (moneda === 'Bs' && tasa > 0)
        ? `Abono recibido en Bs (Tasa BCV: ${tasa.toLocaleString('es-VE', {minimumFractionDigits: 2})})`
        : `Abono recibido en ${moneda || 'USD'}`;
    
    const montoBs = (moneda === 'Bs' && tasa > 0)
        ? `- $${monto.toFixed(2)} (Bs. ${reportado.toLocaleString('es-VE', {minimumFractionDigits: 2})})`
        : `- $${monto.toFixed(2)}`;
    
    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Recibo Grow Studio</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&family=Roboto+Mono:wght@500&display=swap');
:root{--cyan:#00c6eb;--orange:#f25c27;--dark:#1a1a2e;--gray:#f5f6fa}
body{font-family:'Montserrat',sans-serif;color:#333;margin:0;padding:40px;background:#eef2f5;display:flex;justify-content:center}
@media print{body{background:white;padding:0}.receipt-container{box-shadow:none!important;border:none!important;margin:0!important;width:100%!important;max-width:100%!important}.no-print{display:none!important}}
.receipt-container{background:white;width:100%;max-width:800px;margin:0 auto;padding:50px;border-top:8px solid var(--cyan);border-bottom:8px solid var(--orange);border-radius:4px;position:relative;box-shadow:0 15px 35px rgba(0,0,0,.1);box-sizing:border-box}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:50px}
.receipt-details{text-align:right}
.receipt-details h1{margin:0 0 5px;color:var(--dark);font-size:32px;font-weight:800;text-transform:uppercase;letter-spacing:2px}
.receipt-num{font-family:'Roboto Mono',monospace;font-size:18px;color:var(--orange);font-weight:600;margin-bottom:5px}
.receipt-date{font-size:14px;color:#777}
.client-info{margin-bottom:40px;background:var(--gray);padding:20px;border-left:4px solid var(--cyan);border-radius:0 8px 8px 0}
.client-info h3{margin:0 0 10px;color:var(--dark);font-size:14px;text-transform:uppercase;letter-spacing:1px}
.client-info p{margin:5px 0;font-size:16px;color:#222}
.client-name{font-size:20px!important;font-weight:600;color:var(--dark)!important}
table{width:100%;border-collapse:collapse;margin-bottom:40px}
th{background:var(--dark);color:white;padding:15px;text-align:left;font-size:13px;text-transform:uppercase;letter-spacing:1px}
th.amount-col,td.amount-col{text-align:right}
td{padding:20px 15px;border-bottom:1px solid #eee;font-size:16px;color:#333}
td.amount-col{font-family:'Roboto Mono',monospace;font-weight:500}
.totals{width:50%;margin-left:auto;background:var(--gray);padding:20px;border-radius:8px}
.totals-row{display:flex;justify-content:space-between;padding:10px 0;font-size:15px;color:#555}
.totals-row.grand-total{font-weight:600;color:var(--dark);border-bottom:2px solid #ddd;padding-bottom:15px;margin-bottom:5px}
.totals-row.balance{font-weight:800;font-size:20px;color:var(--orange);padding-top:10px}
.footer{text-align:center;margin-top:60px;font-size:14px;color:#777;border-top:1px solid #eee;padding-top:25px}
.footer strong{color:var(--cyan);font-weight:800}
.print-btn{position:fixed;bottom:30px;right:30px;background:var(--cyan);color:white;border:none;padding:15px 25px;font-size:16px;font-weight:600;border-radius:50px;cursor:pointer;box-shadow:0 4px 15px rgba(0,198,235,.4);transition:.2s;font-family:'Montserrat',sans-serif;z-index:100}
.print-btn:hover{background:var(--dark);transform:translateY(-2px)}
</style></head><body>
<div class="receipt-container">
  <div class="header">
    <div style="display:flex;align-items:stretch;gap:6px;height:58px">
      <div style="display:flex;flex-direction:column;justify-content:space-between;padding:2px 0">
        <span style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:36px;color:#1a1a2e;line-height:0.75;letter-spacing:2px">GROW</span>
        <span style="font-family:'Montserrat',sans-serif;font-weight:400;font-size:22.5px;color:#1a1a2e;line-height:0.8;letter-spacing:8.5px;margin-left:2px">STUDIO</span>
      </div>
    </div>
    <div class="receipt-details">
      <h1>Recibo de Pago</h1>
      <div class="receipt-num">Ref: ${referencia}</div>
      <div class="receipt-date">Fecha: ${fechaPago}</div>
    </div>
  </div>
  <div class="client-info">
    <h3>Facturado a:</h3>
    <p class="client-name">${nombreCliente || cedula}</p>
    <p>Usuario / Cédula: ${cedula}</p>
  </div>
  <table>
    <thead><tr><th>Descripción del Servicio</th><th class="amount-col">Monto</th></tr></thead>
    <tbody><tr>
      <td>Plan Mensual – Plataforma Web Grow Studio</td>
      <td class="amount-col">$${monto.toFixed(2)}</td>
    </tr></tbody>
  </table>
  <div class="totals">
    <div class="totals-row grand-total">
      <span>${montoTexto}</span>
      <span style="color:#27ae60">${montoBs}</span>
    </div>
    <div class="totals-row balance">
      <span>Estado</span>
      <span>✅ PAGADO</span>
    </div>
  </div>
  <div class="footer">
    <p>Gracias por confiar en <strong>GROW STUDIO</strong> para tu desarrollo tecnológico.</p>
    <p><a href="https://growstudioweb.vercel.app/" target="_blank" style="color:#777;text-decoration:none">https://growstudioweb.vercel.app/</a></p>
  </div>
</div>
<button class="print-btn no-print" onclick="window.print()">🖨️ Guardar PDF</button>
</body></html>`;
    
    const ventana = window.open('', '_blank', 'width=900,height=700');
    ventana.document.write(html);
    ventana.document.close();
};

// ==========================================
// LÓGICA DE FACTURACIÓN EN EL PERFIL DEL CLIENTE
// ==========================================
    
    
    
    

if (DOM.btnSaveBilling) {
    DOM.btnSaveBilling.addEventListener('click', async () => {
        if (!state.currentClientId) return;
        const originalText = DOM.btnSaveBilling.innerText;
        DOM.btnSaveBilling.innerText = "Guardando...";
        DOM.btnSaveBilling.disabled = true;
        try {
            const cedulaVal = (DOM.inputCedula ? DOM.inputCedula.value.trim() : (document.getElementById('client-cedula') ? document.getElementById('client-cedula').value.trim() : ''));
            await updateDoc(doc(db, "clientes", state.currentClientId), {
                plan: DOM.inputPlan.value,
                deuda: parseFloat(DOM.inputDeuda.value) || 0,
                fechaVencimiento: DOM.inputVencimiento.value,
                cedula: cedulaVal,
                usuario: cedulaVal.toLowerCase()
            });
            if (state.currentClientData) {
                state.currentClientData.plan = DOM.inputPlan.value;
                state.currentClientData.deuda = parseFloat(DOM.inputDeuda.value) || 0;
                state.currentClientData.fechaVencimiento = DOM.inputVencimiento.value;
                state.currentClientData.cedula = cedulaVal;
                state.currentClientData.usuario = cedulaVal.toLowerCase();
            }
            
            if (DOM.billingStatusIndicator) {
                if (DOM.inputVencimiento.value) {
                    const hoy = new Date();
                    const fechaV = new Date(DOM.inputVencimiento.value + 'T00:00:00');
                    const diff = Math.ceil((fechaV - hoy) / (1000*60*60*24));
                    if (diff > 7) DOM.billingStatusIndicator.style.background = '#10b981';
                    else if (diff >= 0 && diff <= 7) DOM.billingStatusIndicator.style.background = '#f59e0b';
                    else DOM.billingStatusIndicator.style.background = '#ef4444';
                } else {
                    DOM.billingStatusIndicator.style.background = 'gray';
                }
            }
            
            DOM.btnSaveBilling.innerText = "¡Guardado!";
            setTimeout(() => {
                DOM.btnSaveBilling.innerText = originalText;
                DOM.btnSaveBilling.disabled = false;
            }, 2000);
        } catch (error) {
            alert("Error: " + error.message);
            DOM.btnSaveBilling.innerText = originalText;
            DOM.btnSaveBilling.disabled = false;
        }
    });
}

// ==========================================
