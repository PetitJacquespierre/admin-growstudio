// Serverless Function para Análisis Semántico Profundo de SEO & GEO con IA (Gemini, Claude o OpenAI)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }

    try {
        const { apiKey, provider = 'gemini', action = 'analyze', siteData, metaRequest } = req.body || {};

        const effectiveKey = apiKey || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

        if (!effectiveKey) {
            return res.status(400).json({
                ok: false,
                error: 'No se ha proporcionado ninguna API key para el análisis de IA.'
            });
        }

        let systemPrompt = '';
        let userPrompt = '';

        if (action === 'generate_meta_titles') {
            const { url = '', currentTitle = '', currentDesc = '', h1 = '', keyword = '', brand = '', pageType = 'Página web' } = metaRequest || {};

            systemPrompt = `Eres un redactor SEO de élite y especialista en optimización de CTR según las directrices oficiales de Google Search Central y Google Title Links.
Tu tarea es generar un diagnóstico ultrabreve y 3 alternativas distintas de <title> y <meta name="description"> listas para copiar.

REGLAS ESTRICTAS DE GOOGLE:
1. Title: 50 a 60 caracteres (máximo 60). Descriptivo, sin keyword stuffing, coherente con el H1. Incluye la marca concisa al final con separador " | " o " - ".
2. Description: 140 a 160 caracteres (máximo 160). Frase fluida con propuesta de valor y CTA suave, sin listas vacías de keywords.
3. Las 3 alternativas deben tener enfoques DIFERENTES:
   - Alternativa 1 (Keyword-First / Informativa): Palabra clave al inicio, máxima claridad de servicio o producto.
   - Alternativa 2 (Beneficio & Alto CTR): Gancho irresistible, diferencial o beneficio concreto para maximizar clics.
   - Alternativa 3 (Intención Long-Tail / GEO): Resuelve una consulta concreta o pregunta, ideal para AI Overviews y citabilidad.

Debes responder ÚNICAMENTE con un objeto JSON válido (sin markdown, sin bloques de código, solo JSON puro) con esta estructura:
{
  "currentDiagnosis": "Diagnóstico de 1 o 2 líneas de los problemas detectados en el título/descripción actuales (longitud, vaguedad, falta de marca o CTR bajo)",
  "keywordAssumed": "Palabra clave principal utilizada",
  "brandAssumed": "Marca identificada",
  "alternatives": [
    {
      "id": 1,
      "tag": "Keyword-First / Informativa",
      "focus": "Máxima claridad con la palabra clave principal al inicio",
      "title": "Texto del title (máx 60 caracteres)",
      "description": "Texto de la meta description (máx 160 caracteres)"
    },
    {
      "id": 2,
      "tag": "Beneficio & Alto CTR",
      "focus": "Orientada a clics con propuesta de valor irresistible",
      "title": "Texto del title (máx 60 caracteres)",
      "description": "Texto de la meta description (máx 160 caracteres)"
    },
    {
      "id": 3,
      "tag": "Intención Long-Tail / GEO",
      "focus": "Pregunta o solución directa optimizada para citabilidad en IA",
      "title": "Texto del title (máx 60 caracteres)",
      "description": "Texto de la meta description (máx 160 caracteres)"
    }
  ]
}`;

            userPrompt = `URL: ${url}
Tipo de página: ${pageType}
Título actual: ${currentTitle || '(Vacío)'}
Meta descripción actual: ${currentDesc || '(Vacía)'}
H1 visible: ${h1 || '(No detectado)'}
Keyword objetivo solicitada: ${keyword || '(Inferir de la página)'}
Marca solicitada: ${brand || '(Inferir de la página o dominio)'}

Genera el diagnóstico y las 3 alternativas en formato JSON puro.`;

        } else {
            // Auditoría Semántica Completa (Default)
            const { url = '', title = '', description = '', headings = [], sampleText = '' } = siteData || {};

            systemPrompt = `Eres un auditor experto en SEO Técnico, E-E-A-T de Google y Citabilidad de IA (GEO / AI Overviews).
Tu labor es analizar el texto extraído de la página web indicada y evaluar 6 aspectos críticos de calidad semántica.

Debes responder ÚNICAMENTE con un objeto JSON válido (sin bloques markdown de código, sin texto introductorio, solo JSON puro) con esta estructura exacta:
{
  "spellingGrammar": {
    "status": "CORRECTO" o "MEJORABLE",
    "errorsCount": número entero de faltas detectadas,
    "details": "descripción concisa de la ortografía y gramática en español",
    "suggestions": ["palabra_mal -> corrección"]
  },
  "eeatSemantic": {
    "status": "CORRECTO" o "MEJORABLE",
    "score": número entre 0 y 100,
    "details": "evaluación de experiencia de primera mano, pericia, autoridad y confianza del contenido",
    "trustSignals": ["señal 1", "señal 2"]
  },
  "chunking": {
    "status": "CORRECTO" o "MEJORABLE",
    "details": "si las secciones están autocontenidas y son extraíbles por fragmentos para RAG"
  },
  "verifiableFacts": {
    "status": "CORRECTO" o "MEJORABLE",
    "facts": ["dato concreto 1 (fechas, lugares, cifras)", "dato concreto 2"]
  },
  "tldrSummary": {
    "status": "CORRECTO" o "MEJORABLE",
    "summary": "resumen TL;DR de 1 sola frase potente de la entidad o servicio"
  },
  "brandConsistency": {
    "status": "CORRECTO" o "MEJORABLE",
    "details": "si el nombre de marca o productos se usa de forma consistente sin variaciones erráticas"
  }
}`;

            userPrompt = `URL Analizada: ${url}
Título: ${title}
Descripción meta: ${description}
Encabezados principales: ${headings.slice(0, 15).join(' | ')}

Fragmento visible de texto de la página:
"""
${sampleText.slice(0, 3500)}
"""

Analiza el contenido y devuelve el JSON requerido.`;
        }

        let rawResponseText = '';

        if (provider === 'gemini') {
            // Google Gemini API (Gemini 1.5 Flash / 2.0 Flash)
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`;
            const gResponse = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: 'application/json'
                    }
                })
            });

            if (!gResponse.ok) {
                const errJson = await gResponse.json().catch(() => ({}));
                throw new Error(errJson.error?.message || `Error HTTP ${gResponse.status} de Gemini API`);
            }

            const data = await gResponse.json();
            rawResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        } else if (provider === 'anthropic') {
            // Anthropic Claude API (claude-3-5-sonnet o claude-3-haiku)
            const aResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': effectiveKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-haiku-20241022',
                    max_tokens: 1500,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userPrompt }]
                })
            });

            if (!aResponse.ok) {
                const errJson = await aResponse.json().catch(() => ({}));
                throw new Error(errJson.error?.message || `Error HTTP ${aResponse.status} de Anthropic API`);
            }

            const data = await aResponse.json();
            rawResponseText = data.content?.[0]?.text || '{}';

        } else if (provider === 'openai') {
            // OpenAI API (gpt-4o-mini)
            const oResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${effectiveKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2
                })
            });

            if (!oResponse.ok) {
                const errJson = await oResponse.json().catch(() => ({}));
                throw new Error(errJson.error?.message || `Error HTTP ${oResponse.status} de OpenAI API`);
            }

            const data = await oResponse.json();
            rawResponseText = data.choices?.[0]?.message?.content || '{}';
        } else {
            throw new Error(`Proveedor de IA desconocido: ${provider}`);
        }

        // Limpiar backticks si el LLM incluyó markdown
        const cleaned = rawResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return res.status(200).json({
            ok: true,
            provider,
            analysis: parsed
        });

    } catch (err) {
        console.error('Error en /api/seo-ai-analyze:', err);
        return res.status(500).json({
            ok: false,
            error: err.message || 'Fallo al procesar con IA'
        });
    }
}
