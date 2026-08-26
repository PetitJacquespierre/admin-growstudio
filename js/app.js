// =========================================
// CÓDIGO ESPECÍFICO DEL CLIENTE
// =========================================
// Nota: Toda la lógica principal (Carrito, PWA, BCV, Kill Switch) 
// ahora vive en el Cerebro Central (Grow Studio Core).
//
// Usa este archivo ÚNICAMENTE si este cliente en particular 
// necesita una función personalizada que los demás no tienen.

// =========================================
// OVERRIDE: WHATSAPP CHECKOUT (DEMO VERSION)
// =========================================
function sendOrder() {
    if (typeof cart === 'undefined' || cart.length === 0) {
        alert("¡Tu carrito está vacío! Agrega algunos productos para probar la demo.");
        return;
    }

    const nameInput = document.getElementById('customer-name');
    const addressInput = document.getElementById('customer-address');
    const notesInput = document.getElementById('customer-notes');
    const referralInput = document.getElementById('referral-code');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';
    const referral = referralInput ? referralInput.value.trim() : '';
    
    const deliverySelect = document.getElementById('delivery-zone');
    const deliveryName = deliverySelect ? deliverySelect.options[deliverySelect.selectedIndex].text : 'Delivery';
    const deliveryCost = deliverySelect ? parseFloat(deliverySelect.value) : 0;

    let subtotal = 0;
    
    let text = `==========================\r\n`;
    text += `*NUEVO LEAD / PRUEBA DE DEMO*\r\n`;
    text += `==========================\r\n\r\n`;
    
    text += `*DATOS DEL CLIENTE*\r\n`;
    text += `- Cliente: ${name || 'Cliente Demo'}\r\n`;
    if (address) text += `- Dirección: ${address}\r\n`;
    text += `- Zona: ${deliveryName}\r\n`;
    if (notes) text += `- Notas: ${notes}\r\n`;
    if (referral) text += `- Código de Referido: *${referral}*\r\n`;
    
    text += `\r\n*PRODUCTOS DE PRUEBA*\r\n`;

    cart.forEach(item => {
        const itemTotal = item.precio * item.qty;
        subtotal += itemTotal;
        text += `• ${item.qty}x ${item.nombre} ($${itemTotal.toFixed(2)})\r\n`;
    });

    const totalUsd = subtotal + deliveryCost;

    text += `\r\n*TOTAL A PAGAR: $${totalUsd.toFixed(2)}*\r\n\r\n`;
    text += `🔥 Hola! Estoy probando la Demo. Me interesa un menú digital interactivo como este para mi negocio. INFO DEMO`;

    const encodedText = encodeURIComponent(text);
    const whatsappNum = clientConfig && clientConfig.whatsapp ? clientConfig.whatsapp : "584127732710";
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
}
