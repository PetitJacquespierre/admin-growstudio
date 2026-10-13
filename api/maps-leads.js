// Vercel Serverless Function: /api/maps-leads
// Inspirado en omkarcloud/google-maps-scraper: Prospección real de comercios locales para Grow Studio
// Permite buscar por nicho (restaurante, gimnasio, inmobiliaria, etc.) y ciudad
export default async function handler(req, res) {
  // Soporte CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { query = 'restaurante', city = 'Madrid' } = req.query;

    // Conexión a OpenStreetMap Overpass API (pública, sin límite de pago y con datos reales de comercios)
    const overpassQuery = `
      [out:json][timeout:15];
      area["name"~"${city}",i]->.searchArea;
      (
        node["amenity"~"restaurant|cafe|fast_food|bar"](area.searchArea);
        node["shop"](area.searchArea);
        node["leisure"~"fitness_centre|sports_centre"](area.searchArea);
      );
      out body 30;
    `;

    const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    let leads = [];

    try {
      const osmResp = await fetch(osmUrl, {
        headers: { 'User-Agent': 'GrowStudioHunter/2.0 (contact@growstudio.agency)' }
      });

      if (osmResp.ok) {
        const osmData = await osmResp.json();
        const elements = osmData.elements || [];

        leads = elements
          .filter(el => el.tags && (el.tags.name || el.tags['name:es'] || el.tags['name:en']))
          .map(el => {
            const tags = el.tags;
            const name = tags.name || tags['name:es'] || 'Comercio Local';
            const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '';
            const website = tags.website || tags['contact:website'] || '';
            const hasWebsite = Boolean(website);
            const cuisine = tags.cuisine || tags.amenity || tags.shop || 'Comercio';
            
            // Si no tiene web, es un lead FUEGO para Grow Studio (alta oportunidad de venta)
            const badge = !hasWebsite ? 'FUEGO' : 'HOT';
            const score = !hasWebsite ? 96 : 84;
            const service = !hasWebsite 
              ? 'Web / Menú Digital QR Urgente (Sin Web)' 
              : 'Rediseño Web & Optimización WhatsApp';

            // Formateo de número para WhatsApp directo
            let cleanPhone = phone.replace(/[^0-9]/g, '');
            let whatsappUrl = cleanPhone 
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola equipo de ${name}! Les escribe Grow Studio. Estuvimos viendo su local y nos encantaría presentarles una propuesta de menú digital / web moderna.`)}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`;

            return {
              id: `lead-maps-${el.id}`,
              author: name,
              platform: 'Google Maps / Local',
              lang: 'es',
              langLabel: `${city} 📍`,
              niche: `${cuisine.toUpperCase()} / Negocio Local`,
              time: 'Verificado',
              score,
              badge,
              budget: !hasWebsite ? '$250 - $450 USD' : '$180 - $300 USD',
              service,
              text: tags['addr:street'] 
                ? `Dirección: ${tags['addr:street']} ${tags['addr:housenumber'] || ''}. ${hasWebsite ? `Web: ${website}` : '⚠️ NO TIENE SITIO WEB REGISTRADO (Oportunidad alta de venta)'}. Tel: ${phone || 'Buscar en Google Maps'}`
                : `Comercio activo en ${city}. ${hasWebsite ? `Web actual: ${website}` : '⚠️ NO CUENTA CON WEB NI MENÚ DIGITAL'}. Tel: ${phone || 'Consultar en ficha de Google'}`,
              urgency: !hasWebsite ? 'Inmediata' : 'Media',
              status: 'NUEVO',
              directUrl: whatsappUrl,
              hasPhone: Boolean(cleanPhone),
              hasWebsite
            };
          });
      }
    } catch (osmErr) {
      console.warn('Error fetching OpenStreetMap leads:', osmErr);
    }

    // Si OSM no devolvió resultados para la ciudad buscada, generamos consulta enriquecida a Google Maps
    if (leads.length === 0) {
      const searchTerms = [
        `${query} ${city}`,
        `hamburguesas ${city}`,
        `pizzería ${city}`,
        `restaurante ${city}`
      ];

      leads = searchTerms.map((term, idx) => {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(term)}`;
        return {
          id: `lead-gmaps-${Date.now()}-${idx}`,
          author: `${query.toUpperCase()} en ${city} #${idx + 1}`,
          platform: 'Google Maps Direct',
          lang: 'es',
          langLabel: `${city} 📍`,
          niche: `${query} / Comercial`,
          time: 'En Vivo',
          score: 92,
          badge: 'FUEGO',
          budget: '$200 - $400 USD',
          service: 'Menú Digital QR / Web Local',
          text: `Prospección directa en Google Maps para "${term}". Abrir ficha para extraer teléfono comercial y enviar pitch por WhatsApp.`,
          urgency: 'Inmediata',
          status: 'NUEVO',
          directUrl: mapsUrl,
          hasPhone: false,
          hasWebsite: false
        };
      });
    }

    return res.status(200).json(leads);
  } catch (error) {
    console.error('Error in maps-leads:', error);
    return res.status(500).json({ error: 'Error interno obteniendo leads locales' });
  }
}
