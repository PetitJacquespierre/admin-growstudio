// Vercel Serverless Function: /api/maps-leads
// Prospección multiescala de comercios locales:
// 1. Local (Punto Fijo / Falcón 🇻🇪)
// 2. Nacional (Venezuela: Caracas, Maracaibo, Valencia, Barquisimeto 🇻🇪)
// 3. Global / Internacional (España, Portugal, EE.UU., México 🌎)

const COMMERCE_DATABASE = {
  // 1. ZONA LOCAL: PUNTO FIJO & PARAGUANÁ (FALCÓN)
  local: [
    {
      id: 'pf-01',
      author: 'Kffeine Café Gourmet',
      city: 'Punto Fijo',
      state: 'Falcón 🇻🇪',
      scope: 'local',
      niche: 'Cafetería / Repostería',
      phone: '584127732710',
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
      scope: 'local',
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
      scope: 'local',
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
      scope: 'local',
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
      scope: 'local',
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
      scope: 'local',
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
      scope: 'local',
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
      scope: 'local',
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
  ],

  // 2. ZONA NACIONAL: VENEZUELA (Caracas, Maracaibo, Valencia, Barquisimeto)
  national: [
    {
      id: 'vzla-01',
      author: 'Burger Shack Las Mercedes',
      city: 'Caracas',
      state: 'Distrito Capital 🇻🇪',
      scope: 'national',
      niche: 'Hamburguesería / Gastronomía',
      phone: '584127732710',
      hasWebsite: false,
      score: 96,
      badge: 'FUEGO',
      budget: '$300 - $500 USD',
      service: 'Menú Digital QR & Delivery Multisede',
      text: 'Local de comida americana en Las Mercedes con alto tráfico. Requieren catálogo interactivo con carrito y envío de comandas directas a WhatsApp.',
      urgency: 'Inmediata',
      address: 'Calle Madrid, Las Mercedes, Caracas'
    },
    {
      id: 'vzla-02',
      author: 'Caracas Runners / Media Maratón CCS',
      city: 'Caracas',
      state: 'Distrito Capital 🇻🇪',
      scope: 'national',
      niche: 'Eventos Deportivos / Maratón 21K',
      phone: '584127732710',
      hasWebsite: true,
      score: 95,
      badge: 'FUEGO',
      budget: '$450 - $800 USD',
      service: 'Plataforma Oficial de Carrera & Atletas',
      text: 'Organización deportiva nacional preparando circuito 10K y 21K. Requieren plataforma para registro de 1,500 corredores y consulta de dorsales.',
      urgency: 'Inmediata',
      address: 'Parque del Este, Caracas'
    },
    {
      id: 'vzla-03',
      author: 'Cevichería El Cují',
      city: 'Maracaibo',
      state: 'Zulia 🇻🇪',
      scope: 'national',
      niche: 'Restaurante Marino / Fusión',
      phone: '584127732710',
      hasWebsite: false,
      score: 91,
      badge: 'HOT',
      budget: '$250 - $400 USD',
      service: 'Menú Interactivo QR & Pedidos Rápidos',
      text: 'Restaurante concurrido en zona norte de Maracaibo. Desean optimizar el tiempo de toma de pedidos en mesas con catálogo digital para móvil.',
      urgency: 'Alta',
      address: 'Av. Bella Vista, Maracaibo'
    },
    {
      id: 'vzla-04',
      author: 'Fitness Zone El Viñedo',
      city: 'Valencia',
      state: 'Carabobo 🇻🇪',
      scope: 'national',
      niche: 'Gimnasio & Centro de Entrenamiento',
      phone: '584127732710',
      hasWebsite: false,
      score: 93,
      badge: 'FUEGO',
      budget: '$350 - $600 USD',
      service: 'Landing Page de Clases y Membresías',
      text: 'Gimnasio y centro de crossfit en El Viñedo. Necesitan captar nuevos miembros con reservas de clases online y botón directo a asesores.',
      urgency: 'Inmediata',
      address: 'El Viñedo, Valencia, Carabobo'
    },
    {
      id: 'vzla-05',
      author: 'Parrilla & Leña Barquisimeto',
      city: 'Barquisimeto',
      state: 'Lara 🇻🇪',
      scope: 'national',
      niche: 'Carnes & Parrilla Tradicional',
      phone: '584127732710',
      hasWebsite: false,
      score: 89,
      badge: 'HOT',
      budget: '$220 - $380 USD',
      service: 'Menú Digital QR sin Comisiones',
      text: 'Restaurante familiar de cortes de carne y gastronomía larense. Buscan reemplazar cartas impresas por solución digital rápida en smartphone.',
      urgency: 'Esta semana',
      address: 'Av. Los Leones, Barquisimeto'
    }
  ],

  // 3. ZONA GLOBAL / INTERNACIONAL (Madrid, Lisboa, Miami, etc.)
  global: [
    {
      id: 'glob-01',
      author: 'Boutique Inmobiliaria Lisboa Golden',
      city: 'Lisboa',
      state: 'Portugal 🇵🇹',
      scope: 'global',
      niche: 'Bolsa Inmobiliaria / Real Estate',
      phone: '584127732710',
      hasWebsite: true,
      score: 97,
      badge: 'FUEGO',
      budget: '€1,200 - €2,000 EUR/mes',
      service: 'Lead Gen Funnel & Captación de Inversores',
      text: 'Grupo de mediación inmobiliaria en Lisboa y Cascais. Buscan agencia para landing pages de alta conversión y embudo de compradores internacionales.',
      urgency: 'Inmediata',
      address: 'Avenida da Liberdade, Lisboa'
    },
    {
      id: 'glob-02',
      author: 'Pizzería Napolitana Malasaña',
      city: 'Madrid',
      state: 'España 🇪🇸',
      scope: 'global',
      niche: 'Restaurante / Menú QR',
      phone: '584127732710',
      hasWebsite: false,
      score: 94,
      badge: 'FUEGO',
      budget: '€350 - €500 EUR',
      service: 'Menú Interactivo QR con Pedidos a Barra',
      text: 'Pizzería artesanal en Malasaña con 20 mesas. Quieren agilizar las comandas eliminando cartas de papel y enviando comandas directas.',
      urgency: 'Inmediata',
      address: 'Calle del Pez, Malasaña, Madrid'
    },
    {
      id: 'glob-03',
      author: 'IronFit Miami Performance',
      city: 'Miami',
      state: 'Florida 🇺🇸',
      scope: 'global',
      niche: 'Gimnasio & Atletas Élite',
      phone: '584127732710',
      hasWebsite: false,
      score: 95,
      badge: 'FUEGO',
      budget: '$600 - $950 USD',
      service: 'High-Converting Gym Landing Page',
      text: 'Strength & conditioning facility in Wynwood looking for a clean dark-mode web landing page with trainer bios, class schedule and WhatsApp CTA.',
      urgency: 'Inmediata',
      address: 'NW 2nd Ave, Wynwood, Miami, FL'
    },
    {
      id: 'glob-04',
      author: 'Triathlon Series México 2026',
      city: 'Cancún',
      state: 'México 🇲🇽',
      scope: 'global',
      niche: 'Eventos Deportivos / Triatlón',
      phone: '584127732710',
      hasWebsite: true,
      score: 93,
      badge: 'FUEGO',
      budget: '$500 - $850 USD',
      service: 'Web Oficial de Evento & Registro de Atletas',
      text: 'Comité organizador de carreras 10K y 21K en Quintana Roo. Buscan portal con pasarela de inscripción, carrusel de patrocinadores y entrega de kits.',
      urgency: 'Alta',
      address: 'Zona Hotelera, Cancún, México'
    }
  ]
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { query = '', scope = 'local' } = req.query;

    let bancoSeleccionado = [];

    if (scope === 'local') {
      bancoSeleccionado = [...COMMERCE_DATABASE.local];
    } else if (scope === 'national') {
      bancoSeleccionado = [...COMMERCE_DATABASE.national];
    } else if (scope === 'global') {
      bancoSeleccionado = [...COMMERCE_DATABASE.global];
    } else {
      // Alcance mixto / total
      bancoSeleccionado = [
        ...COMMERCE_DATABASE.local,
        ...COMMERCE_DATABASE.national,
        ...COMMERCE_DATABASE.global
      ];
    }

    // Filtro por término si el usuario escribió algo en el buscador
    if (query.trim()) {
      const q = query.toLowerCase();
      const filtrados = bancoSeleccionado.filter(item => 
        item.author.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.niche.toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
      );
      if (filtrados.length > 0) {
        bancoSeleccionado = filtrados;
      }
    }

    const leads = bancoSeleccionado.map(item => {
      let pitchLocation = item.city;
      if (item.scope === 'local') pitchLocation = 'Punto Fijo / Falcón';
      else if (item.scope === 'national') pitchLocation = `${item.city}, Venezuela`;
      else pitchLocation = `${item.city}, ${item.state}`;

      const whatsappMsg = `¡Hola al equipo de ${item.author}! 👋 Les escribe Grow Studio. Estuvimos analizando la presencia digital de su local y nos encantaría presentarles una propuesta de menú digital interactivo / plataforma web adaptada para aumentar clientes desde el primer día. ¿Tienen 2 minutos para coordinar?`;
      const directUrl = `https://wa.me/${item.phone}?text=${encodeURIComponent(whatsappMsg)}`;

      return {
        id: `lead-${item.scope}-${item.id}`,
        author: item.author,
        platform: `Google Maps (${item.city})`,
        lang: item.state.includes('🇺🇸') ? 'en' : (item.state.includes('🇵🇹') ? 'pt' : 'es'),
        langLabel: `${item.city} (${item.state})`,
        scope: item.scope,
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
    return res.status(500).json({ error: 'Error interno obteniendo comercios' });
  }
}
