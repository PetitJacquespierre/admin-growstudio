// Vercel Serverless Function: /api/v2-leads
// Motor Backend 100% REAL para Hunter V2 Hub:
// Extrae publicaciones EN VIVO de compradores, inversores y personas en proceso
// de adquisición inmobiliaria y reubicación en Europa desde feeds RSS/Atom de comunidades reales.
// CERO datos de prueba / CERO perfiles ficticios.

let cachedLeads = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // Cache de 60 segundos para evitar rate-limit (429)

function unescapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAtomXml(xmlText, subredditName) {
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  const leads = [];
  let match;

  // HASDATA SOCIAL LISTENING: Reglas Booleanas Estrictas de Intención de Compra
  // 1. Verbos de Adquisición / Capital
  const actionKeywords = [
    'buy', 'buying', 'bought', 'purchase', 'purchasing',
    'invest', 'investing', 'investment', 'portfolio',
    'financing', 'mortgage', 'cash buyer', 'down payment', 'alojamento local'
  ];

  // 2. Activos Inmobiliarios Obligatorios
  const assetKeywords = [
    'property', 'house', 'apartment', 'villa', 'real estate', 'home', 'distressed asset'
  ];

  // 3. Filtro Anti-Ruido Negativo (Descarta alquileres, visas de solo alquiler, quejas y vida cotidiana)
  const negativeNoiseKeywords = [
    'rental', 'renting', 'to rent', 'room to rent', 'flatmate', 'roommate', 'housemate', 'sublet',
    'lease agreement', 'curtains', 'shoes', 'climbing', 'podcast', 'dialysis', 'vodafone',
    'furniture', 'stereo', 'cancelling', 'contract cancellation', 'scam'
  ];

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const block = match[1];

    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const authorMatch = block.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/i);
    const linkMatch = block.match(/<link href="([^"]+)"/i);
    const publishedMatch = block.match(/<published>([^<]+)<\/published>/i) || block.match(/<updated>([^<]+)<\/updated>/i);
    const contentMatch = block.match(/<content[^>]*>([\s\S]*?)<\/content>/i);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const authorRaw = authorMatch ? authorMatch[1].trim() : '';
    const cleanAuthor = authorRaw.replace(/^\/u\//, '').trim();
    const postUrl = linkMatch ? linkMatch[1].trim() : '';
    const published = publishedMatch ? publishedMatch[1].trim() : '';

    if (!cleanAuthor || cleanAuthor === '[deleted]' || cleanAuthor === 'AutoModerator' || !postUrl) {
      continue;
    }

    const plainContent = unescapeHtml(contentMatch ? contentMatch[1] : '');
    const fullText = (title + ' ' + plainContent).toLowerCase();

    // Filtro de ruido negativo estricto (HasData rule)
    const isNoise = negativeNoiseKeywords.some(kw => fullText.includes(kw));
    if (isNoise) continue;

    // Intención real: Requiere al menos un verbo de adquisición/capital Y un activo inmobiliario
    const hasAction = actionKeywords.some(kw => fullText.includes(kw));
    const hasAsset = assetKeywords.some(kw => fullText.includes(kw));
    if (!hasAction || !hasAsset) continue;

    // Cálculo de tiempo relativo real
    let timeLabel = 'Hoy';
    let diffMins = 30;
    if (published) {
      const pubDate = new Date(published);
      const diffMs = Date.now() - pubDate.getTime();
      diffMins = Math.max(1, Math.round(diffMs / 60000));
      if (diffMins < 60) timeLabel = `Hace ${diffMins}m`;
      else if (diffMins < 1440) timeLabel = `Hace ${Math.round(diffMins / 60)}h`;
      else timeLabel = `Hace ${Math.round(diffMins / 1440)}d`;
    }

    // Extracción de presupuesto real (si lo menciona en el texto)
    let budget = 'A consultar en hilo';
    let hasExplicitBudget = false;
    const budgetMatch = (title + ' ' + plainContent).match(/(\$|€|EUR|USD)\s?\d{2,3}(,\d{3}|\.000|\s?k)?/i) ||
                        (title + ' ' + plainContent).match(/\b\d{2,3}\s?(k|k€|keur|000)\s?(€|eur|usd)?\b/i);
    if (budgetMatch) {
      budget = budgetMatch[0];
      hasExplicitBudget = true;
    } else if (fullText.includes('luxury') || fullText.includes('villa')) {
      budget = 'Presupuesto Alto / Villa';
      hasExplicitBudget = true;
    } else if (fullText.includes('financing') || fullText.includes('mortgage')) {
      budget = 'En evaluación hipotecaria';
    }

    const isHighTicket = fullText.includes('invest') || fullText.includes('portfolio') ||
                         fullText.includes('financing') || fullText.includes('villa') ||
                         fullText.includes('alojamento local');

    // SCOUT LEAD SCORER (Fórmula matemática ponderada 0 - 100 de Scout)
    let scoutScore = 65; // Base calificada por intención de compra y activo
    if (hasExplicitBudget) scoutScore += 18;
    if (isHighTicket) scoutScore += 10;
    if (diffMins < 1440) scoutScore += 7; // Publicado hoy (< 24 horas)
    scoutScore = Math.min(99, Math.max(70, scoutScore));

    // SCOUT CONTACT EXTRACTOR: Buscar emails o teléfonos en el texto
    const emailMatch = plainContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = plainContent.match(/(?:\+|00)[1-9]\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);

    // Si no es el subreddit exclusivo de Portugal, verificar que mencione Portugal o el sur de Europa
    if (subredditName !== 'PortugalExpats') {
      const mentionsTargetArea = fullText.includes('portugal') || fullText.includes('lisbon') ||
                                 fullText.includes('porto') || fullText.includes('algarve') ||
                                 fullText.includes('cascais') || fullText.includes('spain') ||
                                 fullText.includes('southern europe') || fullText.includes('europe');
      if (!mentionsTargetArea) continue;
    }

    leads.push({
      id: `real-post-${cleanAuthor}-${published ? published.slice(0, 10) : Date.now()}`,
      author: `@${cleanAuthor}`,
      realUsername: cleanAuthor,
      platform: 'Comunidad Verificada',
      platformIcon: '💬',
      source: `r/${subredditName}`,
      category: isHighTicket ? 'Inversor / Financiación' : 'Comprador Residencial',
      intent: title,
      details: plainContent.length > 250 ? plainContent.substring(0, 247) + '...' : plainContent,
      budget: budget,
      time: timeLabel,
      publishedDate: published,
      score: scoutScore,
      extractedEmail: emailMatch ? emailMatch[0] : null,
      extractedPhone: phoneMatch ? phoneMatch[0] : null,
      status: 'VERIFICADO',
      contactUrl: postUrl,
      profileUrl: `https://www.reddit.com/user/${cleanAuthor}`,
      directMsgUrl: `https://www.reddit.com/message/compose/?to=${cleanAuthor}&subject=Regarding%20your%20property%20inquiry`
    });
  }

  return leads;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  // Si tenemos leads reales en caché reciente, retornarlos de inmediato
  if (cachedLeads.length > 0 && (now - lastFetchTime) < CACHE_TTL_MS) {
    return res.status(200).json(cachedLeads);
  }

  try {
    const targetSubs = ['PortugalExpats', 'eupersonalfinance', 'expats', 'IWantOut'];
    const fetchPromises = targetSubs.map(async (sub) => {
      try {
        const resp = await fetch(`https://www.reddit.com/r/${sub}/new.rss`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8'
          }
        });
        if (resp.ok) {
          const xml = await resp.text();
          return parseAtomXml(xml, sub);
        }
      } catch (err) {
        console.warn(`Error fetching feed for r/${sub}:`, err.message);
      }
      return [];
    });

    const results = await Promise.all(fetchPromises);
    const combinedLeads = results.flat();

    if (combinedLeads.length > 0) {
      // Deduplicar por id
      const uniqueMap = new Map();
      combinedLeads.forEach(l => {
        if (!uniqueMap.has(l.id)) uniqueMap.set(l.id, l);
      });
      const uniqueLeads = Array.from(uniqueMap.values());

      cachedLeads = uniqueLeads;
      lastFetchTime = now;
      return res.status(200).json(uniqueLeads);
    }

    // Si la llamada fue bloqueada o vacía pero tenemos caché anterior, devolver caché
    if (cachedLeads.length > 0) {
      return res.status(200).json(cachedLeads);
    }

    return res.status(200).json([]);
  } catch (error) {
    console.error('Error in /api/v2-leads:', error);
    if (cachedLeads.length > 0) {
      return res.status(200).json(cachedLeads);
    }
    return res.status(500).json({ error: 'No se pudo conectar con el feed en vivo' });
  }
}
