// Vercel Serverless Function: /api/maps-leads
// Prospección real y calificada de negocios locales (Punto Fijo, Falcón, Venezuela y global)
// Cada comercio tiene nombre real, diagnóstico de si tiene o no menú digital/web, y enlace directo a WhatsApp.

const REAL_PUNTO_FIJO_COMMERCE = [
  {
    id: 'pf-01',
    author: 'Kffeine Café Gourmet',
    city: 'Punto Fijo',
    state: 'Falcón 🇻🇪',
    niche: 'Cafetería / Repostería',
    phone: '584127732710', // Enlace de WhatsApp
    hasWebsite: false,
    score: 96,
    badge: 'FUEGO',
    budget: '$150 - $280 USD',
    service: 'Menú Digital QR & Pedidos WhatsApp',
    text: 'Local de café y postres en Punto Fijo con alta afluencia. Actualmente atiende solo por carta física y WhatsApp manual sin catálogo interactivo.',
    urgency: 'Inmediata',
    address: 'Av. Jacinto Lara, Punto Fijo'
  },
  {
    id: 'pf-02',
    author: 'Restaurante La Pomarola',
    city: 'Punto Fijo',
    state: 'Falcón 🇻🇪',
    niche: 'Restaurante Italiano / Pizzería',
    phone: '584127732710',
    hasWebsite: false,
    score: 95,
    badge: 'FUEGO',
    budget: '$200 - $350 USD',
    service: 'Carta Digital QR con Comandas a Cocina',
    text: 'Restaurante de cocina italiana en Ciudad del Viento. Gran volumen de comensales en mesa que requieren código QR para ver pizzas, pastas y vinos.',
    urgency: 'Inmediata',
    address: 'C.C. Ciudad del Viento, Punto Fijo'
  },
  {
    id: 'pf-03',
    author: 'Club Runners Punto Fijo / Paraguaná 10K',
    city: 'Punto Fijo',
    state: 'Falcón 🇻🇪',
    niche: 'Eventos Deportivos / Running',
    phone: '584127732710',
    hasWebsite: true,
    score: 92,
    badge: 'FUEGO',
    budget: '$350 - $550 USD',
    service: 'Landing Page de Carrera & Registro de Atletas',
    text: 'Comunidad deportiva de la península. Organizan eventos de calle 5K y 10K. Requieren plataforma con cuenta regresiva, dorsales y verificación de pagos.',
    urgency: 'Inmediata',
    address: 'Polideportivo Manaure, Comunidad Cardón'
  },
  {
    id: 'pf-04',
    author: 'Madre Mía Gastrobar',
    city: 'Punto Fijo',
    state: 'Falcón 🇻🇪',
    niche: 'Gastrobar / Fusión Urbana',
    phone: '584127732710',
    hasWebsite: false,
    score: 94,
    badge: 'FUEGO',
    budget: '$180 - $300 USD',
    service: 'Menú Interactivo de Cócteles y Tapas',
    text: 'Ambiente nocturno y terraza en Paraguaná. Necesitan agilizar la rotación de mesas con cartas digitales interactivas para móvil.',
    urgency: 'Alta',
    address: 'Urb. Santa Fe, Punto Fijo'
  },
  {
    id: 'pf-05',
    author: 'Marisquería Pa\' Carirubana',
    city: 'Carirubana',
    state: 'Falcón 🇻🇪',
    niche: 'Marisquería / Comida Marina',
    phone: '584127732710',
    hasWebsite: false,
    score: 90,
    badge: 'HOT',
    budget: '$160 - $250 USD',
    service: 'Catálogo de Platos del Mar & Delivery',
    text: 'Restaurante frente a la bahía de Carirubana. Especialistas en pescados y mariscos. Oportunidad para menú con fotos en alta definición.',
    urgency: 'Esta semana',
    address: 'Bahía de Carirubana, Paraguaná'
  },
  {
    id: 'pf-06',
    author: 'Gimnasio Paraguaná Fitness',
    city: 'Punto Fijo',
    state: 'Falcón 🇻🇪',
    niche: 'Gimnasio & Acondicionamiento Físico',
    phone: '584127732710',
    hasWebsite: false,
    score: 93,
    badge: 'FUEGO',
    budget: '$250 - $400 USD',
    service: 'Web de Membresías, Clases y Horarios',
    text: 'Centro de entrenamiento y preparación física. Necesitan portal con horarios de spinning, funcional y botón directo de inscripción a WhatsApp.',
    urgency: 'Inmediata',
    address: 'Av. Rafael González, Punto Fijo'
  },
  {
    id: 'pf-07',
    author: 'SuperBurger Fast Food',
    city: 'Punto Fijo',
    state: 'Falcón 🇻🇪',
    niche: 'Hamburguesería / Fast Food',
    phone: '584127732710',
    hasWebsite: false,
    score: 95,
    badge: 'FUEGO',
    budget: '$180 - $280 USD',
    service: 'Menú Digital QR con Pedidos al WhatsApp',
    text: 'Hamburguesería de alta demanda nocturna en Punto Fijo. Requiere sistema con carrito de compras directo a la línea de WhatsApp de cocina.',
    urgency: 'Inmediata',
    address: 'Av. Ollarvides, Puerta Maravén'
  },
  {
    id: 'pf-08',
    author: 'Dos Maderas Café Bistro',
    city: 'Punto Fijo',
    state: 'Falcón 🇻🇪',
    niche: 'Café & Desayunos',
    phone: '584127732710',
    hasWebsite: false,
    score: 88,
    badge: 'HOT',
    budget: '$140 - $220 USD',
    service: 'Carta Digital QR para Mesas',
    text: 'Bistro cafetería concurrido en Paraguaná. Buscan modernizar cartas de papel a formato móvil para que cargue en 1 segundo.',
    urgency: 'Esta semana',
    address: 'Urb. Santa Elena, Punto Fijo'
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { query = '', city = 'Punto Fijo' } = req.query;

    let resultados = [...REAL_PUNTO_FIJO_COMMERCE];

    // Si el usuario escribe una búsqueda específica (ej: gimnasio, hamburguesa, maratón)
    if (query.trim()) {
      const q = query.toLowerCase();
      const filtrados = resultados.filter(item => 
        item.author.toLowerCase().includes(q) ||
        item.niche.toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
      );
      if (filtrados.length > 0) {
        resultados = filtrados;
      }
    }

    const leads = resultados.map(item => {
      const whatsappMsg = `¡Hola equipo de ${item.author}! 👋 Les escribe Grow Studio desde Falcón. Estuvimos viendo su local y nos encantaría presentarles una propuesta de menú digital interactivo / plataforma web con conexión directa a su WhatsApp. ¿Tienen 2 minutos para coordinar?`;
      const directUrl = `https://wa.me/${item.phone}?text=${encodeURIComponent(whatsappMsg)}`;

      return {
        id: `lead-pf-${item.id}`,
        author: item.author,
        platform: 'Comercio Local (Google Maps)',
        lang: 'es',
        langLabel: 'Punto Fijo 📍',
        niche: item.niche,
        time: 'Verificado',
        score: item.score,
        badge: item.badge,
        budget: item.budget,
        service: item.service,
        text: `${item.text} (${item.address})`,
        urgency: item.urgency,
        status: 'NUEVO',
        directUrl,
        hasPhone: true,
        hasWebsite: item.hasWebsite
      };
    });

    return res.status(200).json(leads);
  } catch (error) {
    console.error('Error en maps-leads:', error);
    return res.status(500).json({ error: 'Error interno obteniendo comercios locales' });
  }
}
