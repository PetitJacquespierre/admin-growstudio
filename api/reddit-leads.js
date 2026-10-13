// Vercel Serverless Function: /api/reddit-leads
// Inspirado en RedoraAI y JosephLai241/URS: Extracción directa de requerimientos de contratación en Reddit
// Soporte multicanal: r/forhire, r/freelance, r/webdev
export default async function handler(req, res) {
  // Soporte CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { sub = 'forhire', query = 'hiring' } = req.query;
    
    // Reddit API JSON endpoint público (sin credenciales privadas requeridas con User-Agent formal)
    const redditUrl = `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.json?q=flair%3Ahiring+OR+${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=40`;
    
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrowStudioHunter/2.0'
      }
    });

    if (!response.ok) {
      console.error('Reddit API error:', response.status, response.statusText);
      return res.status(502).json({ error: 'Fallo al consultar feed de Reddit' });
    }

    const json = await response.json();
    const children = json?.data?.children || [];

    const leads = children
      .filter(item => item.data && item.data.title && item.data.author !== '[deleted]')
      .map(item => {
        const d = item.data;
        const minutesAgo = Math.round((Date.now() / 1000 - d.created_utc) / 60);
        const timeLabel = minutesAgo < 60 ? `Hace ${minutesAgo}m` : `Hace ${Math.round(minutesAgo / 60)}h`;
        
        // Detección de idioma básico
        const textLower = (d.title + ' ' + (d.selftext || '')).toLowerCase();
        let lang = 'en';
        let langLabel = 'English 🇺🇸';
        if (textLower.includes('necesito') || textLower.includes('busco') || textLower.includes('desarrollador') || textLower.includes('página')) {
          lang = 'es';
          langLabel = 'Español 🇪🇸';
        } else if (textLower.includes('preciso') || textLower.includes('desenvolvedor') || textLower.includes('orçamento')) {
          lang = 'pt';
          langLabel = 'Português 🇧🇷';
        }

        // Estimación de presupuesto si contiene signos monetarios
        let budget = 'A convenir';
        const budgetMatch = (d.title + ' ' + d.selftext).match(/(\$|€|USD|EUR)\s?\d+([,\.]\d+)?(\s?-\s?(\$|€|USD|EUR)?\s?\d+)?/i);
        if (budgetMatch) {
          budget = budgetMatch[0];
        }

        // Score de relevancia
        const score = Math.min(99, Math.max(75, (d.score || 1) * 10 + 70));
        const badge = score > 88 ? 'FUEGO' : 'HOT';

        return {
          id: `lead-reddit-${d.id}`,
          author: `@${d.author}`,
          platform: `Reddit (r/${sub})`,
          lang,
          langLabel,
          niche: d.link_flair_text || 'Desarrollo / Web',
          time: timeLabel,
          score,
          badge,
          budget,
          service: d.title.length > 70 ? d.title.substring(0, 67) + '...' : d.title,
          text: (d.selftext || d.title).replace(/\n+/g, ' ').substring(0, 220),
          urgency: 'Inmediata',
          status: 'NUEVO',
          directUrl: `https://www.reddit.com${d.permalink}`
        };
      });

    return res.status(200).json(leads);
  } catch (error) {
    console.error('Error procesando Reddit leads:', error);
    return res.status(500).json({ error: 'Error interno en Reddit Leads' });
  }
}
