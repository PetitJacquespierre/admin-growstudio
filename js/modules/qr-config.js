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






let currentQrcode = null;

if (DOM.btnGenerateQr) {
    DOM.btnGenerateQr.addEventListener('click', () => {
        if (!state.currentClientData || !state.currentClientData.url) {
            alert("El cliente no tiene un Link de la Tienda configurado.");
            return;
        }
        
        DOM.qrModal.style.display = 'flex';
        DOM.qrContainer.innerHTML = ''; // Limpiar anterior
        
        let urlToEncode = state.currentClientData.url;
        if (!urlToEncode.startsWith('http')) urlToEncode = 'https://' + urlToEncode;
        DOM.qrUrlText.innerText = urlToEncode;
        
        // Timeout ligero para asegurar renderizado del DOM
        setTimeout(() => {
            currentQrcode = new QRCode(DOM.qrContainer, {
                text: urlToEncode,
                width: 250,
                height: 250,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }, 100);
    });
}

if (DOM.btnCloseQr) {
    DOM.btnCloseQr.addEventListener('click', () => {
        DOM.qrModal.style.display = 'none';
    });
}

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




window.enviarCobroWhatsApp = function() {
    if (!state.currentClientData || !state.currentClientData.whatsapp) {
        alert("El cliente no tiene un WhatsApp registrado.");
        return;
    }
    const tel = state.currentClientData.whatsapp.replace(/\D/g, '');
    const planStr = state.currentClientData.plan === 'ANUAL' ? 'Anual' : (state.currentClientData.plan === 'MENSUAL' ? 'Mensual' : 'de Prueba');
    const msg = encodeURIComponent(`Hola 👋 Te escribimos de Grow Studio. Te recordamos que tu Plan ${planStr} para tu Menú Digital está próximo a vencer (o acaba de vencer). Para evitar interrupciones en tu servicio y seguir recibiendo pedidos sin comisiones, puedes realizar el pago aquí:

[TUS DATOS DE PAGO AQUI]

¡Cualquier duda estamos a la orden!`);
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
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
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

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