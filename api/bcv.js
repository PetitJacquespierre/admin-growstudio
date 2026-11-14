/**
 * GROW STUDIO — MOTOR OFICIAL DIRECTO BCV.ORG.VE & MULTI-PROVEEDOR (v3.0)
 * Extrae la tasa oficial en vivo directamente desde https://www.bcv.org.ve/
 * Bypasea el certificado SSL incompleto del BCV (rejectUnauthorized: false) y soporta <strong class="strong-tb">
 */
import https from 'https';

let memoryCache = {
    data: null,
    timestamp: 0
};

const MEMORY_TTL_MS = 10 * 60 * 1000; // 10 minutos en RAM
const FALLBACK_DEFAULT = {
    usd: 914.02,
    eur: 1010.56,
    usdt: 1073.78,
    binance: 1073.78
};

/**
 * Descarga el HTML de https://www.bcv.org.ve/ ignorando errores de cadena SSL incompleta del servidor BCV
 */
function fetchBCVHtmlDirect(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const req = https.get('https://www.bcv.org.ve/', {
            rejectUnauthorized: false,
            timeout: timeoutMs,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-VE,es;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache'
            }
        }, (res) => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 400)) {
                return reject(new Error(`BCV HTTP ${res.statusCode}`));
            }
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => resolve(rawData));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout conectando a bcv.org.ve'));
        });

        req.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * FUENTE 1 (PRIMARIA): Extracción directa de bcv.org.ve (#dolar y #euro)
 */
async function fetchFromBCVDirect() {
    const html = await fetchBCVHtmlDirect(5000);

    const extractRate = (containerId) => {
        const regex = new RegExp(`id=["']${containerId}["'][\\s\\S]*?<strong[^>]*>\\s*([0-9.,]+)\\s*<\\/strong>`, 'i');
        const match = html.match(regex);
        if (!match || !match[1]) return null;
        const clean = match[1].trim().replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);
        return (!isNaN(num) && num > 10) ? Number(num.toFixed(2)) : null;
    };

    const usd = extractRate('dolar');
    const eur = extractRate('euro');

    const fechaMatch = html.match(/class=["']date-display-single["'][^>]*>\s*([^<]+)\s*<\/span>/i);
    const fechaValor = fechaMatch && fechaMatch[1] ? fechaMatch[1].trim() : null;

    if (!usd) throw new Error('No se pudo extraer #dolar de bcv.org.ve');

    return {
        usd,
        eur: eur || Number((usd * 1.1056).toFixed(2)),
        fechaValor,
        source: 'BCV Oficial Directo (bcv.org.ve)'
    };
}

/**
 * Helper de fetch estándar con timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

/**
 * FUENTE 2 (SECUNDARIA): DolarApi Venezuela (Oficial + Paralelo)
 */
async function fetchFromDolarApi() {
    const [resOficial, resEur, resParalelo] = await Promise.allSettled([
        fetchWithTimeout('https://ve.dolarapi.com/v1/dolares/oficial', {}, 3500),
        fetchWithTimeout('https://ve.dolarapi.com/v1/euros/oficial', {}, 3500),
        fetchWithTimeout('https://ve.dolarapi.com/v1/dolares/paralelo', {}, 3500)
    ]);

    let usd = null;
    let eur = null;
    let usdt = null;

    if (resOficial.status === 'fulfilled' && resOficial.value.ok) {
        const dataOficial = await resOficial.value.json();
        const val = parseFloat(dataOficial?.promedio);
        if (!isNaN(val) && val > 10) usd = Number(val.toFixed(2));
    }

    if (resEur.status === 'fulfilled' && resEur.value.ok) {
        const dataEur = await resEur.value.json();
        const valE = parseFloat(dataEur?.promedio);
        if (!isNaN(valE) && valE > 10) eur = Number(valE.toFixed(2));
    }

    if (resParalelo.status === 'fulfilled' && resParalelo.value.ok) {
        const dataParalelo = await resParalelo.value.json();
        const valP = parseFloat(dataParalelo?.promedio);
        if (!isNaN(valP) && valP > 10) usdt = Number(valP.toFixed(2));
    }

    return { usd, eur, usdt, source: 'DolarApi VE' };
}

/**
 * FUENTE USDT: Binance P2P directo
 */
async function fetchBinanceP2P() {
    const res = await fetchWithTimeout('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            asset: 'USDT',
            fiat: 'VES',
            merchantCheck: true,
            page: 1,
            payTypes: ['PagoMovil'],
            publisherType: null,
            rows: 5,
            tradeType: 'BUY'
        })
    }, 3500);

    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
    const json = await res.json();
    const ads = json?.data || [];
    const prices = ads.map(item => parseFloat(item?.adv?.price)).filter(p => !isNaN(p) && p > 10);

    if (prices.length === 0) throw new Error('Sin anuncios P2P válidos');
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Number(avg.toFixed(2));
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const forceRefresh = req.query?.refresh === '1' || req.query?.force === 'true';
    const now = Date.now();

    if (!forceRefresh && memoryCache.data && (now - memoryCache.timestamp) < MEMORY_TTL_MS) {
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ ...memoryCache.data, fromCache: true });
    }

    let usd = null;
    let eur = null;
    let usdt = null;
    let fechaValor = null;
    let fuentes = [];

    const [bcvRes, dolarApiRes, binanceRes] = await Promise.allSettled([
        fetchFromBCVDirect(),
        fetchFromDolarApi(),
        fetchBinanceP2P()
    ]);

    // Prioridad 1 absoluta: BCV Oficial Directo (bcv.org.ve)
    if (bcvRes.status === 'fulfilled' && bcvRes.value.usd) {
        usd = bcvRes.value.usd;
        eur = bcvRes.value.eur;
        fechaValor = bcvRes.value.fechaValor;
        fuentes.push('BCV Oficial Directo (bcv.org.ve)');
    }

    // Prioridad 2: Si BCV directo estuviera caído o si DolarApi tiene una tasa mayor/igual de respaldo
    if (!usd && dolarApiRes.status === 'fulfilled' && dolarApiRes.value.usd) {
        usd = dolarApiRes.value.usd;
        eur = dolarApiRes.value.eur;
        fuentes.push('DolarApi Oficial');
    }

    if (!eur && dolarApiRes.status === 'fulfilled' && dolarApiRes.value.eur) {
        eur = dolarApiRes.value.eur;
    }

    // Paralelo / Binance P2P
    if (binanceRes.status === 'fulfilled' && binanceRes.value) {
        usdt = binanceRes.value;
        fuentes.push('Binance P2P');
    } else if (dolarApiRes.status === 'fulfilled' && dolarApiRes.value.usdt) {
        usdt = dolarApiRes.value.usdt;
        fuentes.push('DolarApi Paralelo');
    }

    const isLiveSuccess = Boolean(usd && usd > 10);
    const finalUsd = isLiveSuccess ? usd : FALLBACK_DEFAULT.usd;
    const finalEur = (eur && eur > 10) ? eur : FALLBACK_DEFAULT.eur;
    const finalUsdt = (usdt && usdt > 10) ? usdt : FALLBACK_DEFAULT.binance;

    const payload = {
        ok: true,
        usd: finalUsd,
        eur: finalEur,
        usdt: finalUsdt,
        binance: finalUsdt,
        fechaValor: fechaValor || 'Vigente BCV',
        meta: {
            fuente: isLiveSuccess ? fuentes.join(' + ') : 'Respaldo Verificado BCV',
            actualizado: new Date().toISOString(),
            live: isLiveSuccess
        }
    };

    if (isLiveSuccess) {
        memoryCache = {
            data: payload,
            timestamp: now
        };
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    } else {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
    }

    return res.status(200).json(payload);
}
