// Serverless Function para rastrear URLs en backend Vercel (bypasea CORS y saturación de proxies)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'Missing url query param' });
    }

    try {
        let target = decodeURIComponent(url);
        if (!target.startsWith('http://') && !target.startsWith('https://')) {
            target = 'https://' + target;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(target, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 GrowStudioBot/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

        const html = await response.text();
        const headersObj = {};
        response.headers.forEach((val, key) => {
            headersObj[key.toLowerCase()] = val;
        });

        return res.status(200).json({
            ok: true,
            status: response.status,
            html,
            headers: headersObj
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err.message
        });
    }
}
