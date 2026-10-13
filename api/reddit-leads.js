// Vercel API route to fetch live Reddit hiring leads
// Endpoint: /api/reddit-leads
// Returns an array of lead objects compatible with GrowStudioHunterEngine
export default async function handler(req, res) {
  try {
    const redditUrl = 'https://www.reddit.com/r/forhire/search.json?q=flair%3Ahiring&restrict_sr=1&sort=new&limit=50';
    const response = await fetch(redditUrl, { headers: { 'User-Agent': 'grow-studio-hunter/1.0' } });
    if (!response.ok) {
      console.error('Reddit API error', response.status, response.statusText);
      return res.status(502).json({ error: 'Failed to fetch from Reddit' });
    }
    const json = await response.json();
    const leads = (json?.data?.children || []).map(item => {
      const d = item.data;
      // Approximate time ago in minutes/hours
      const minutesAgo = Math.round((Date.now() / 1000 - d.created_utc) / 60);
      const timeLabel = minutesAgo < 60 ? `${minutesAgo} min` : `${Math.round(minutesAgo / 60)} h`;
      return {
        id: `lead-${d.id}`,
        author: `@${d.author}`,
        platform: 'Reddit (r/forhire)',
        lang: 'en',
        langLabel: 'English 🇺🇸',
        niche: 'General',
        time: timeLabel,
        score: d.score || 0,
        badge: (d.score || 0) > 90 ? 'FUEGO' : 'HOT',
        budget: 'N/A',
        service: d.title,
        text: d.selftext || '',
        urgency: 'Inmediata',
        status: 'NUEVO',
        directUrl: `https://reddit.com${d.permalink}`
      };
    });
    return res.status(200).json(leads);
  } catch (e) {
    console.error('Unexpected error in reddit-leads API', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
