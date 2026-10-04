import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// NUEVAS FUNCIONALIDADES: COLOR, QR Y CONFIG
// ==========================================

// Color Picker Sync


if (DOM.colorPicker && DOM.colorHex) {
    DOM.colorPicker.addEventListener('input', (e) => {
        DOM.colorHex.value = e.target.value.toUpperCase();
    });
    DOM.colorHex.addEventListener('input', (e) => {
        DOM.colorPicker.value = e.target.value;
    });
}

// Guardar Config Web

if (DOM.btnSaveConfig) {
    DOM.btnSaveConfig.addEventListener('click', async () => {
        if (!state.currentClientId) return;
        
        const newColor = DOM.colorHex.value.trim();
        const recibirPedidos = document.getElementById('client-status-abierto').checked;
        
        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await updateDoc(doc(db, "clientes", state.currentClientId), {
                colorPrimario: newColor,
                recibirPedidos: recibirPedidos
            });
            state.currentClientData.colorPrimario = newColor;
            state.currentClientData.recibirPedidos = recibirPedidos;
            alert("Ajustes Web guardados correctamente.");
        } catch (e) {
            alert("Error al guardar Ajustes Web: " + e.message);
        }
    });
}

// Generador de QR






// ==============================================================
// GENERADOR DE QR
// ==============================================================

if (DOM.btnDownloadQr) {
    DOM.btnDownloadQr.addEventListener('click', () => {
        const img = DOM.qrContainer.querySelector('img');
        if (!img || !img.src) {
            alert("Aún no se ha generado el QR.");
            return;
        }
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `QR_Menu_${state.currentClientId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// ==========================================
// GENERADOR DE RECIBOS PDF
// ==========================================
window.generarReciboPDF = (clienteId, monto, fecha, referencia) => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurar color y estilo general
        doc.setFillColor(18, 18, 18); // Fondo oscuro
        doc.rect(0, 0, 210, 297, 'F');
        
        // Encabezado
        doc.setTextColor(249, 115, 22); // brand-orange
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("GROW STUDIO", 105, 30, { align: "center" });
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("Recibo de Pago", 105, 40, { align: "center" });
        
        // LÃƒÂ­nea separadora
        doc.setDrawColor(50, 50, 50);
        doc.line(20, 50, 190, 50);
        
        // Datos del recibo
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Fecha: ${fecha}`, 20, 70);
        doc.text(`Cliente / Cedula: ${clienteId.toUpperCase()}`, 20, 80);
        doc.text(`Referencia Bancaria: ${referencia}`, 20, 90);
        
        // Caja de monto
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, 110, 170, 30, 3, 3, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Monto Pagado: $${monto} USD`, 105, 129, { align: "center" });
        
        // Pie de pÃƒÂ¡gina
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("¡Gracias por confiar en Grow Studio!", 105, 270, { align: "center" });
        doc.text("growstudioweb.vercel.app", 105, 278, { align: "center" });
        
        // Guardar
        doc.save(`Recibo_GrowStudio_${clienteId}_${referencia}.pdf`);
    } catch(e) {
        alert("Error generando PDF: " + e.message);
    }
};




// Helper para obtener tasa BCV oficial con fallback a caché o API
window.obtenerTasaBCV = async function() {
    const URL_API = "https://script.google.com/macros/s/AKfycbxdQlLO7lDOAvbhFqwVBs722T_i1KQ08z1gdf4NdqA6HvVcwGzRX4BZtHSd58piGL11/exec";
    try {
        const res = await fetch(URL_API);
        const data = await res.json();
        if (data && data.usd) {
            const tasa = parseFloat(data.usd);
            if (tasa > 0) {
                localStorage.setItem("bcv_rate_cache", tasa.toString());
                return tasa;
            }
        }
    } catch (e) {
        console.warn("Fallo consultando API BCV, usando caché local:", e);
    }
    const cached = localStorage.getItem("bcv_rate_cache");
    return cached ? parseFloat(cached) : 870.00;
};

// Generador de Cobro por WhatsApp en 1 Clic (Fase 3.2)
window.enviarCobroWhatsApp = async function() {
    if (!state.currentClientData) {
        if (window.showToast) window.showToast("Primero selecciona un cliente", "warning");
        else alert("Selecciona un cliente.");
        return;
    }

    const data = state.currentClientData;
    const rawTel = (document.getElementById('client-whatsapp') && document.getElementById('client-whatsapp').value.trim()) || data.whatsapp || "";
    const tel = rawTel.replace(/\D/g, '');

    if (!tel) {
        if (window.showToast) window.showToast("Este cliente no tiene número de WhatsApp registrado", "warning");
        else alert("El cliente no tiene un WhatsApp registrado.");
        return;
    }

    const btnCobro = document.getElementById('btn-whatsapp-cobro');
    const originalText = btnCobro ? btnCobro.innerHTML : '';
    if (btnCobro) {
        btnCobro.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Calculando...`;
        btnCobro.disabled = true;
    }

    try {
        const nombre = data.businessName || data.nombre || state.currentClientId || 'Estimado Cliente';
        const plan = (data.plan || 'MENSUAL').toUpperCase();
        const planNombre = plan === 'ANUAL' ? 'Anual ($50)' : (plan === 'MENSUAL' ? 'Mensual ($15)' : 'de Prueba (7 días)');
        
        let montoUSD = parseFloat(data.deuda || 0);
        // Si no tiene deuda explícita anotada, sugerir el monto de renovación de su plan
        if (montoUSD <= 0) {
            montoUSD = plan === 'ANUAL' ? 50 : 15;
        }

        const fechaVenc = data.fechaVencimiento || 'Próximo corte';
        let fechaFormateada = fechaVenc;
        if (fechaVenc && fechaVenc.includes('-')) {
            const partes = fechaVenc.split('-');
            if (partes.length === 3) fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        // Obtener tasa BCV oficial
        const tasaBCV = await window.obtenerTasaBCV();
        const montoBs = (montoUSD * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const tasaFormateada = tasaBCV.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const mensaje = 
`¡Hola, *${nombre}*! 👋 Te saludamos cordialmente del equipo de *Grow Studio*.

Te recordamos que tu suscripción del servicio de *Menú Digital SaaS* (${planNombre}) tiene fecha de corte programada para el *${fechaFormateada}*.

💰 *Detalle de Facturación:*
• *Total a Pagar:* $${montoUSD.toFixed(2)} USD
• *Equivalente en Bolívares:* Bs. ${montoBs}
• *Tasa Oficial BCV:* ${tasaFormateada} Bs/USD

📱 *Datos para Pago Móvil:*
• Banco: Banesco (0134)
• Cédula: V-14.074.299
• Teléfono: 0412-6804153

*(Si prefieres transferir en USD vía Binance Pay, Zelle o Efectivo, indícanos por aquí).*

Una vez realizado tu pago, por favor compártenos el comprobante por este medio para registrarlo y mantener tu tienda 100% activa sin interrupciones. 🚀

¡Muchísimas gracias por confiar en Grow Studio!`;

        const encodedMsg = encodeURIComponent(mensaje);
        const waUrl = `https://wa.me/${tel}?text=${encodedMsg}`;
        window.open(waUrl, '_blank');

        if (window.showToast) window.showToast("WhatsApp abierto con mensaje y tasa BCV generados.");
    } catch (err) {
        console.error("Error al generar cobro por WhatsApp:", err);
        if (window.showToast) window.showToast("Error al generar cobro: " + err.message, "error");
        else alert("Error: " + err.message);
    } finally {
        if (btnCobro) {
            btnCobro.innerHTML = originalText;
            btnCobro.disabled = false;
        }
    }
};


// ==============================================================
// GENERADOR DE QR
// ==============================================================
window.generarQRMenu = function() {
    if (!state.currentClientData && !state.currentClientId) {
        alert("Primero selecciona un cliente de la lista lateral.");
        return;
    }

    const data = state.currentClientData || {};
    const clientUrlInput = document.getElementById('client-url');
    let urlToEncode = (clientUrlInput && clientUrlInput.value.trim()) || data.url || "";

    if (!urlToEncode) {
        const id = state.currentClientId || "demo";
        if (id === "demo") urlToEncode = "demomenudigital.vercel.app";
        else if (id === "laflaca") urlToEncode = "pasteleslaflaca.vercel.app";
        else urlToEncode = id + ".vercel.app";
    }

    if (!urlToEncode.startsWith('http://') && !urlToEncode.startsWith('https://')) {
        urlToEncode = 'https://' + urlToEncode;
    }

    const qrContainer = DOM.qrContainer || document.getElementById('qr-code-container');
    const qrModal = DOM.qrModal || document.getElementById('qr-modal');
    const qrUrlText = DOM.qrUrlText || document.getElementById('qr-url-text');

    if (!qrContainer) {
        alert("No se encontró el contenedor del código QR.");
        return;
    }

    if (typeof QRCode === 'undefined') {
        alert("La librería QRCode aún se está cargando. Reintenta en unos segundos.");
        return;
    }

    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
        text: urlToEncode,
        width: 190,
        height: 190,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Estilizado forzado para evitar estiramiento por CSS global de imágenes
    setTimeout(() => {
        const img = qrContainer.querySelector('img');
        const canvas = qrContainer.querySelector('canvas');
        if (img) {
            img.style.width = '190px';
            img.style.height = '190px';
            img.style.maxWidth = 'none';
            img.style.display = 'block';
            img.style.margin = '0 auto';
        }
        if (canvas) {
            canvas.style.display = 'none';
        }
    }, 50);

    if (qrUrlText) qrUrlText.innerText = urlToEncode;
    if (qrModal) qrModal.style.display = 'flex';
};

window.cerrarModalQR = function() {
    const qrModal = DOM.qrModal || document.getElementById('qr-modal');
    if (qrModal) qrModal.style.display = 'none';
};

const btnCloseQr = DOM.btnCloseQr || document.getElementById('btn-close-qr');
if (btnCloseQr) {
    btnCloseQr.onclick = window.cerrarModalQR;
}

const btnGenerateQr = DOM.btnGenerateQr || document.getElementById('btn-generate-qr');
if (btnGenerateQr) {
    btnGenerateQr.onclick = window.generarQRMenu;
}

const btnDownloadQr = DOM.btnDownloadQr || document.getElementById('btn-download-qr');
if (btnDownloadQr) {
    btnDownloadQr.onclick = function() {
        const img = document.querySelector('#qr-code-container img');
        if (img && img.src) {
            const link = document.createElement('a');
            link.download = `QR_Menu_${state.currentClientId || 'cliente'}.png`;
            link.href = img.src;
            link.click();
        } else {
            alert("El código QR se está generando, reintenta en un momento.");
        }
    };
}