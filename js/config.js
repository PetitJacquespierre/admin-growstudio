// Configuración Maestra del Cliente
const clientConfig = {
    id: "Demo_Menu_Digital", // Identificador único para el Kill Switch
    businessName: "Demo Grow Studio",
    whatsapp: "584127732710", // Reemplazar con el número de WhatsApp del cliente
    hojaDeCalculo: "https://script.google.com/macros/s/AKfycbzvneNnzQZuQh92LPy18mZp2PppLzr1bA4EIe_3PR4Gyhzk_kaO3dA6JOyFxMPvrWc/exec", // Enlace al Google Sheets de la Demo
    colors: {
        primary: "#F59E0B",   // Color principal (Ámbar por defecto)
        bgDark: "#09090b",    // Fondo principal (Negro Carbón)
        bgCard: "#18181b"     // Color de las tarjetas (Gris Oscuro)
    }
};

// Auto-inyectar los colores en el CSS
document.documentElement.style.setProperty('--primary', clientConfig.colors.primary);
document.documentElement.style.setProperty('--bg-dark', clientConfig.colors.bgDark);
document.documentElement.style.setProperty('--bg-card', clientConfig.colors.bgCard);
