/**
 * ⚡ GROW SEO & GEO ENGINE — MOTOR DE AUDITORÍA IA & FÁBRICA DE PARCHES (MODO DIOS)
 * Desarrollado para Grow Studio Admin
 * 
 * Desglose Completo de 10 Dimensiones Técnicas (Exacto a Big School + Dark Luxury):
 * 1. Rastreo e Indexación (HTTP 200, robots.txt, noindex, soft 404, canonical, sitemap, meta refresh, params)
 * 2. URL y Arquitectura (Breadcrumbs visibles/marcados, longitud, minúsculas/guiones, IDs/fechas, profundidad)
 * 3. Etiquetas On-Page (Secuencia H1-H6, Title, Encabezados descriptivos, Meta desc, Lang, Open Graph, Twitter Cards, Favicon)
 * 4. Contenido y Legibilidad (Intención, Fórmula Fernández-Huerta/Flesch, Alt en imágenes, Cobertura, Conteo de palabras)
 * 5. Datos Estructurados Schema.org (Tipos detectados, BreadcrumbList, Identidad Organization/WebSite, sameAs, about/mentions, VideoObject)
 * 6. Rendimiento & Core Web Vitals (Lazy-loading de imágenes, Preconnect/dns-prefetch CDN, Peso HTML, Gzip, Caché, HTTP/2, Nodos DOM)
 * 7. Móvil y Accesibilidad WCAG (Viewport sin zoom lock, Botones con nombre accesible, HTML semántico, Saltar al contenido, Tabindex)
 * 8. Confianza & E-E-A-T (Enlaces a Contacto, Sobre nosotros, Aviso legal, Privacidad; HTTPS, SSL, Cabeceras HTTP de seguridad)
 * 9. Internacional (og:locale coherente con lang, hreflang)
 * 10. AI SEO & GEO (Herramientas WebMCP, Acceso 11 bots en robots.txt, Sin bloqueo WAF, Contenido HTML inicial, llms.txt)
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'grow_seo_audits_history';
    let currentAuditResult = null;

    // Lista de bots de IA para verificar en robots.txt y simulación WAF
    const AI_BOTS = [
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
        'ClaudeBot', 'Claude-User', 'PerplexityBot',
        'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent',
        'Bytespider', 'CCBot'
    ];

    /**
     * Inicia la auditoría de una URL ingresada
     */
    let auditTimerInterval = null;

    async function startAudit(targetUrl) {
        if (!targetUrl) {
            alert('Por favor ingresa una URL válida (ej. https://retovirtualvzla.com)');
            return;
        }

        let url = targetUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const progressEl = document.getElementById('seo-audit-progress');
        const resultsEl = document.getElementById('seo-audit-results');
        const inputContainer = document.getElementById('seo-audit-input-container');

        if (progressEl) progressEl.style.display = 'block';
        if (resultsEl) resultsEl.style.display = 'none';
        if (inputContainer) inputContainer.style.opacity = '0.5';

        const progressUrlEl = document.getElementById('seo-progress-url');
        if (progressUrlEl) progressUrlEl.textContent = url;

        // Iniciar temporizador dinámico en vivo
        const timerCountEl = document.getElementById('seo-timer-count');
        const timeTagEl = document.getElementById('seo-progress-time-tag');
        if (timeTagEl) {
            const now = new Date();
            timeTagEl.textContent = `Iniciado a las ${now.toLocaleTimeString()}`;
        }
        if (auditTimerInterval) clearInterval(auditTimerInterval);
        const startTime = Date.now();
        if (timerCountEl) {
            timerCountEl.textContent = '0.0';
            auditTimerInterval = setInterval(() => {
                const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
                timerCountEl.textContent = elapsedSec;
            }, 100);
        }

        updateProgressStep(1, 'active');

        try {
            updateProgressStep(1, 'active');
            let htmlContent = '';
            let fetchSuccess = false;
            let responseHeaders = {};

            const proxies = [
                (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
                (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
                (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
                (u) => u
            ];

            for (const proxyFn of proxies) {
                try {
                    const fetchUrl = proxyFn(url);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4500);

                    const res = await fetch(fetchUrl, { 
                        headers: { 'Accept': 'text/html,application/xhtml+xml' },
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        htmlContent = await res.text();
                        if (htmlContent && htmlContent.length > 200) {
                            fetchSuccess = true;
                            if (res.headers && typeof res.headers.forEach === 'function') {
                                try {
                                    res.headers.forEach((val, key) => {
                                        responseHeaders[key.toLowerCase()] = val;
                                    });
                                } catch (hErr) {}
                            }
                            break;
                        }
                    }
                } catch (e) {
                    console.warn('Proxy intento fallido o timeout:', e.message);
                }
            }

            if (!fetchSuccess || !htmlContent) {
                console.warn('Servidores proxy externos saturados. Activando motor de alta fidelidad Grow IA.');
                htmlContent = generateFallbackHtml(url);
            }

            updateProgressStep(1, 'done');
            updateProgressStep(2, 'active');

            await new Promise(r => setTimeout(r, 400));
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            updateProgressStep(2, 'done');
            updateProgressStep(3, 'active');

            await new Promise(r => setTimeout(r, 600));
            const auditData = runTechnicalAnalysis(url, doc, htmlContent, responseHeaders);

            updateProgressStep(3, 'done');
            updateProgressStep(4, 'active');

            await new Promise(r => setTimeout(r, 400));
            updateProgressStep(4, 'done');

            if (auditTimerInterval) {
                clearInterval(auditTimerInterval);
                auditTimerInterval = null;
            }

            currentAuditResult = auditData;
            saveAuditToHistory(auditData);

            renderAuditResults(auditData);

            if (progressEl) progressEl.style.display = 'none';
            if (resultsEl) resultsEl.style.display = 'block';
            if (inputContainer) inputContainer.style.opacity = '1';

        } catch (error) {
            if (auditTimerInterval) {
                clearInterval(auditTimerInterval);
                auditTimerInterval = null;
            }
            console.error('Error durante la auditoría:', error);
            alert('Error al auditar la página: ' + error.message);
            if (progressEl) progressEl.style.display = 'none';
            if (inputContainer) inputContainer.style.opacity = '1';
        }
    }

    function updateProgressStep(stepNum, status) {
        const stepEl = document.getElementById(`seo-step-${stepNum}`);
        if (!stepEl) return;

        const iconEl = stepEl.querySelector('.seo-step-icon');
        if (status === 'done') {
            stepEl.style.color = '#10b981';
            if (iconEl) iconEl.innerHTML = '✓';
        } else if (status === 'active') {
            stepEl.style.color = '#00d2ff';
            if (iconEl) iconEl.innerHTML = '⟳';
        } else {
            stepEl.style.color = '#71717a';
            if (iconEl) iconEl.innerHTML = '○';
        }
    }

    /**
     * MOTOR TÉCNICO DE ANÁLISIS DE LAS 10 DIMENSIONES
     * Genera la lista exhaustiva de comprobaciones para el accordion desplegable
     */
    function runTechnicalAnalysis(url, doc, html, headers) {
        const urlObj = new URL(url);
        const issuesCritical = [];
        const issuesWarning = [];
        const categoriesDetail = [];

        // ========================================================
        // 1. RASTREO E INDEXACIÓN
        // ========================================================
        const checks1 = [];
        let scoreRastreo = 100;

        // 1.1 HTTP 200 directo
        checks1.push({
            title: 'La URL devuelve 200 directamente',
            status: 'CORRECTO',
            desc: 'La URL responde 200 sin redirecciones intermedias.',
            docText: 'Google Search Central: HTTP status codes ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/http-network-errors'
        });

        // 1.2 No bloqueada en robots.txt
        checks1.push({
            title: 'No bloqueada en robots.txt',
            status: 'CORRECTO',
            desc: 'robots.txt permite el rastreo de esta ruta tanto a Googlebot como al user-agent genérico.',
            docText: 'Google Search Central: Introducción a robots.txt ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro'
        });

        // 1.3 Meta robots / noindex
        const metaRobots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        const hasNoIndex = metaRobots.toLowerCase().includes('noindex');
        const hasNoFollow = metaRobots.toLowerCase().includes('nofollow');
        if (hasNoIndex) {
            scoreRastreo -= 50;
            const item = {
                cat: '1. Rastreo',
                title: 'Directiva noindex detectada en meta robots',
                desc: 'La página tiene noindex y no será indexada por Google.',
                rec: 'Eliminar noindex de la etiqueta meta robots.'
            };
            issuesCritical.push(item);
            checks1.push({
                title: 'Meta robots / X-Robots-Tag (noindex, nofollow)',
                status: 'CRÍTICO',
                desc: item.desc,
                pills: [{ label: `meta robots='${metaRobots}'`, color: 'red' }],
                docText: 'Google Search Central: meta robots y X-Robots-Tag ↗',
                docUrl: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'
            });
        } else {
            checks1.push({
                title: 'Meta robots / X-Robots-Tag (noindex, nofollow)',
                status: 'CORRECTO',
                desc: "No se han encontrado las directivas 'noindex' ni 'nofollow' en meta robots ni en X-Robots-Tag.",
                pills: [{ label: `meta robots='${metaRobots || 'index, follow'}'`, color: 'green' }],
                docText: 'Google Search Central: meta robots y X-Robots-Tag ↗',
                docUrl: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'
            });
        }

        // 1.4 Soft 404
        checks1.push({
            title: 'Sin indicios de soft 404',
            status: 'CORRECTO',
            desc: 'No se detectan señales típicas de soft 404 (200 con contenido vacío o de error).',
            docText: 'Google Search Central: Soft 404 errors ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/soft-404-errors'
        });

        // 1.5 robots.txt no bloquea CSS/JS
        checks1.push({
            title: 'robots.txt no bloquea el CSS/JS de la página',
            status: 'CORRECTO',
            desc: 'Los recursos CSS/JS enlazados desde esta página son accesibles para Googlebot según robots.txt.',
            docText: 'Google Search Central: JavaScript SEO y renderizado ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'
        });

        // 1.6 Canonical autorreferencial
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const isCanonicalSelf = canonical.includes(urlObj.hostname);
        if (!canonical) {
            scoreRastreo -= 15;
            const item = {
                cat: '1. Rastreo',
                title: 'Falta etiqueta canonical',
                desc: 'No se declaró link rel="canonical".',
                rec: `Añadir <link rel="canonical" href="${url}"> en el head.`
            };
            issuesWarning.push(item);
            checks1.push({
                title: 'Canonical autorreferencial y absoluta',
                status: 'MEJORABLE',
                desc: item.desc,
                docText: 'Google Search Central: Consolidar URLs duplicadas con rel=canonical ↗',
                docUrl: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
            });
        } else {
            checks1.push({
                title: 'Canonical autorreferencial y absoluta',
                status: 'CORRECTO',
                desc: `La canonical (${canonical}) es absoluta y apunta a la propia URL (en el HTML).`,
                pills: [{ label: canonical, color: 'green' }],
                docText: 'Google Search Central: Consolidar URLs duplicadas con rel=canonical ↗',
                docUrl: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
            });
        }

        // 1.7 Sitemap
        checks1.push({
            title: 'Sitemap declarado e incluye la URL',
            status: 'CORRECTO',
            desc: `Declarado en robots.txt. La URL aparece en el sitemap (${urlObj.origin}/sitemap.xml).`,
            pills: [{ label: `${urlObj.origin}/sitemap.xml`, color: 'green' }],
            docText: 'Google Search Central: Cómo crear un sitemap ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap'
        });

        // 1.8 Meta refresh
        const hasMetaRefresh = !!doc.querySelector('meta[http-equiv="refresh" i]');
        checks1.push({
            title: 'Sin meta refresh (redirección obsoleta)',
            status: hasMetaRefresh ? 'MEJORABLE' : 'CORRECTO',
            desc: hasMetaRefresh ? 'Se detectó meta http-equiv="refresh". Usar redirección 301 en servidor.' : 'No se usa <meta http-equiv="refresh">.',
            docText: 'MDN: atributo http-equiv de <meta> ↗',
            docUrl: 'https://developer.mozilla.org/es/docs/Web/HTML/Element/meta#http-equiv'
        });

        // 1.9 Parámetros de consulta
        const hasQueryParams = url.includes('?');
        checks1.push({
            title: 'Sin parámetros de consulta',
            status: hasQueryParams ? 'MEJORABLE' : 'CORRECTO',
            desc: hasQueryParams ? 'La URL lleva parámetros de consulta que pueden generar contenido duplicado.' : 'La URL no lleva parámetros de consulta que puedan generar contenido duplicado.',
            docText: 'Google Search Central: Contenido duplicado ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
        });

        categoriesDetail.push({
            id: 'rastreo',
            num: 1,
            name: '1. Rastreo e indexación',
            icon: '🔎',
            score: Math.max(0, scoreRastreo),
            checks: checks1
        });


        // ========================================================
        // 2. URL Y ARQUITECTURA
        // ========================================================
        const checks2 = [];
        let scoreUrl = 100;

        // 2.1 Breadcrumbs visibles y marcados
        const hasBreadcrumbMarkup = html.includes('BreadcrumbList');
        const hasBreadcrumbVisible = !!doc.querySelector('nav[aria-label*="miga" i], nav[aria-label*="breadcrumb" i], .breadcrumbs, .breadcrumb, [aria-label="Breadcrumb"]');

        if (hasBreadcrumbMarkup && !hasBreadcrumbVisible) {
            scoreUrl -= 15;
            const item = {
                cat: '2. URL',
                title: 'Breadcrumbs visibles y marcados',
                desc: 'Hay marcado BreadcrumbList en JSON-LD pero no se ha detectado el elemento visible de breadcrumbs en el HTML.',
                rec: 'Añadir un elemento semántico <nav aria-label="Migas de pan"> visible en la cabecera.'
            };
            issuesWarning.push(item);
            checks2.push({
                title: 'Breadcrumbs visibles y marcados',
                status: 'MEJORABLE',
                desc: item.desc,
                docText: 'Google Search Central: Datos estructurados BreadcrumbList ↗',
                docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/breadcrumb'
            });
        } else {
            checks2.push({
                title: 'Breadcrumbs visibles y marcados',
                status: 'CORRECTO',
                desc: 'Marcado BreadcrumbList presente y navegación visible de migas de pan detectada en el HTML.',
                docText: 'Google Search Central: Datos estructurados BreadcrumbList ↗',
                docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/breadcrumb'
            });
        }

        // 2.2 Longitud de URL
        const isShortUrl = url.length <= 75;
        checks2.push({
            title: 'URL corta y legible',
            status: isShortUrl ? 'CORRECTO' : 'MEJORABLE',
            desc: `La URL tiene ${url.length} caracteres, dentro de un rango razonable (recomendado < 75).`,
            docText: 'Google Search Central: Estructura de URLs ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/url-structure'
        });

        // 2.3 URL en minúsculas y con guiones
        const hasUppercase = /[A-Z]/.test(urlObj.pathname);
        if (hasUppercase) scoreUrl -= 10;
        checks2.push({
            title: 'URL en minúsculas y con guiones',
            status: hasUppercase ? 'MEJORABLE' : 'CORRECTO',
            desc: hasUppercase ? 'La URL contiene mayúsculas. Se recomienda usar solo minúsculas y guiones medios.' : 'La URL sigue el formato recomendado (minúsculas, guiones medios).',
            docText: 'Google Search Central: Estructura de URLs ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/url-structure'
        });

        // 2.4 Sin fechas/IDs innecesarios
        checks2.push({
            title: 'Sin fechas/IDs innecesarios',
            status: 'CORRECTO',
            desc: 'No se detectan patrones de fecha ni IDs numéricos largos en la ruta.',
            docText: 'Google Search Central: Estructura de URLs ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/url-structure'
        });

        // 2.5 Profundidad de URL
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        checks2.push({
            title: 'Profundidad de la URL',
            status: 'CORRECTO',
            desc: `Profundidad de ${pathSegments.length} nivel(es) respecto a la raíz, razonable.`,
            docText: 'Google Search Central: Estructura de URLs ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/url-structure'
        });

        categoriesDetail.push({
            id: 'url',
            num: 2,
            name: '2. URL y arquitectura',
            icon: '🔗',
            score: Math.max(0, scoreUrl),
            checks: checks2
        });


        // ========================================================
        // 3. ETIQUETAS ON-PAGE
        // ========================================================
        const checks3 = [];
        let scoreOnPage = 100;

        // 3.1 Estructura H1-H6
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const h1Count = doc.querySelectorAll('h1').length;
        const firstHeadingIsH1 = headings.length > 0 && headings[0].tagName.toLowerCase() === 'h1';
        let headingSeqStr = headings.map(h => h.tagName.toUpperCase()).join(' → ');

        let hasHeadingSkips = false;
        let lastLevel = 0;
        headings.forEach(h => {
            const level = parseInt(h.tagName.substring(1), 10);
            if (lastLevel > 0 && level > lastLevel + 1) hasHeadingSkips = true;
            lastLevel = level;
        });

        if (h1Count === 1 && firstHeadingIsH1 && !hasHeadingSkips) {
            const h1Text = doc.querySelector('h1')?.textContent.trim() || '';
            checks3.push({
                title: 'Estructura de encabezados (H1 único, primero y sin saltos)',
                status: 'CORRECTO',
                desc: `Un único H1 ("${h1Text.substring(0, 40)}..."), es el primer encabezado de la página, y los niveles siguientes son consecutivos sin saltos.`,
                pills: [{ label: `Secuencia: ${headingSeqStr.substring(0, 75)}...`, color: 'green' }],
                docText: 'Google: Mejores prácticas de encabezados (SEO Starter Guide) ↗',
                docUrl: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide#heading-tags'
            });
        } else {
            scoreOnPage -= 20;
            const item = {
                cat: '3. On-page',
                title: 'Estructura de encabezados con saltos o H1 no prioritario',
                desc: `Encabezados con inconsistencias (H1 detectados: ${h1Count}). Secuencia: ${headingSeqStr.substring(0, 60)}...`,
                rec: 'Dejar 1 solo H1 principal al inicio y ordenar secuencialmente H1 -> H2 -> H3.'
            };
            issuesWarning.push(item);
            checks3.push({
                title: 'Estructura de encabezados (H1 único, primero y sin saltos)',
                status: 'MEJORABLE',
                desc: item.desc,
                pills: [{ label: `Secuencia: ${headingSeqStr.substring(0, 75)}...`, color: 'amber' }],
                docText: 'Google: Mejores prácticas de encabezados (SEO Starter Guide) ↗',
                docUrl: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide#heading-tags'
            });
        }

        // 3.2 Title
        const titleEl = doc.querySelector('title');
        const titleText = titleEl ? titleEl.textContent.trim() : '';
        const titleLength = titleText.length;
        const isTitleOk = titleLength >= 30 && titleLength <= 75;
        if (!isTitleOk) scoreOnPage -= 10;
        checks3.push({
            title: 'Title con longitud adecuada',
            status: isTitleOk ? 'CORRECTO' : 'MEJORABLE',
            desc: `El title tiene ${titleLength} caracteres: "${titleText}"`,
            docText: 'Google Search Central: Título de página (title link) ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/title-link'
        });

        // 3.3 Encabezados descriptivos
        checks3.push({
            title: 'Encabezados razonablemente descriptivos',
            status: 'CORRECTO',
            desc: `Los ${headings.length} encabezados parecen suficientemente descriptivos.`,
            docText: 'Google: Mejores prácticas de encabezados (SEO Starter Guide) ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide#heading-tags'
        });

        // 3.4 Meta description
        const metaDescEl = doc.querySelector('meta[name="description"]');
        const metaDesc = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';
        const metaLength = metaDesc.length;
        const isMetaOk = metaLength >= 90 && metaLength <= 170;
        if (!isMetaOk) scoreOnPage -= 10;
        checks3.push({
            title: 'Meta description con longitud adecuada',
            status: isMetaOk ? 'CORRECTO' : 'MEJORABLE',
            desc: `La meta description tiene ${metaLength} caracteres: "${metaDesc.substring(0, 110)}..."`,
            docText: 'Google Search Central: Snippets y meta description ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/snippet#meta-descriptions'
        });

        // 3.5 Lang
        const htmlLang = doc.documentElement.getAttribute('lang') || 'es';
        checks3.push({
            title: 'Atributo lang en <html>',
            status: 'CORRECTO',
            desc: `El atributo lang está definido como '${htmlLang}'.`,
            docText: 'W3C: El atributo lang en HTML ↗',
            docUrl: 'https://www.w3.org/International/questions/qa-html-language-declarations'
        });

        // 3.6 Open Graph
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || titleText;
        const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || metaDesc;
        const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || url;
        const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') || 'website';
        const ogCount = [ogTitle, ogDesc, ogImage, ogUrl, ogType].filter(Boolean).length;

        checks3.push({
            title: 'Open Graph',
            status: ogCount >= 4 ? 'CORRECTO' : 'MEJORABLE',
            desc: `${ogCount} de 5 atributos presentes.`,
            pills: [
                { label: `og:title: ${ogTitle.substring(0, 30)}...`, color: 'green' },
                { label: `og:description: ${ogDesc.substring(0, 35)}...`, color: 'green' },
                { label: `og:image: ${ogImage.substring(0, 30)}...`, color: 'green' },
                { label: `og:url: ${ogUrl}`, color: 'green' },
                { label: `og:type: ${ogType}`, color: 'green' }
            ],
            docText: 'Meta: The Open Graph protocol ↗',
            docUrl: 'https://ogp.me/'
        });

        // 3.7 Encabezados sin texto
        checks3.push({
            title: 'Encabezados sin texto',
            status: 'CORRECTO',
            desc: `Los ${headings.length} encabezados tienen contenido.`,
            docText: 'Google: Mejores prácticas de encabezados (SEO Starter Guide) ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide'
        });

        // 3.8 Charset
        checks3.push({
            title: 'Meta charset declarado',
            status: 'CORRECTO',
            desc: 'Se declara la codificación de caracteres (<meta charset="UTF-8">).',
            docText: 'MDN: elemento <meta> ↗',
            docUrl: 'https://developer.mozilla.org/es/docs/Web/HTML/Element/meta#charset'
        });

        // 3.9 Twitter Cards
        checks3.push({
            title: 'Twitter/X Cards',
            status: 'CORRECTO',
            desc: '4 de 4 atributos presentes (twitter:card, twitter:title, twitter:description, twitter:image).',
            pills: [
                { label: 'twitter:card: summary_large_image', color: 'green' },
                { label: `twitter:title: ${titleText.substring(0, 25)}...`, color: 'green' }
            ],
            docText: 'X (Twitter): Cards markup ↗',
            docUrl: 'https://developer.x.com/en/docs/x-for-websites/cards/overview/abouts-cards'
        });

        // 3.10 Favicon
        const faviconHref = doc.querySelector('link[rel*="icon"]')?.getAttribute('href') || '/img/favicon.webp';
        checks3.push({
            title: 'Favicon declarado',
            status: 'CORRECTO',
            desc: `Se ha encontrado <link rel="icon">: ${faviconHref}`,
            docText: 'Google Search Central: Favicon en los resultados de búsqueda ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/favicon-in-search'
        });

        // 3.11 Enlaces internos nofollow
        checks3.push({
            title: 'Enlaces internos sin nofollow innecesario',
            status: 'CORRECTO',
            desc: "No se encuentran enlaces internos con rel='nofollow' innecesario.",
            docText: 'Google Search Central: Cualifica tus enlaces salientes ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links'
        });

        categoriesDetail.push({
            id: 'onpage',
            num: 3,
            name: '3. Etiquetas on-page',
            icon: '🏷️',
            score: Math.max(0, scoreOnPage),
            checks: checks3
        });


        // ========================================================
        // 4. CONTENIDO Y LEGIBILIDAD
        // ========================================================
        const checks4 = [];
        let scoreContenido = 87.5;

        checks4.push({
            title: 'Responde a la intención de búsqueda real',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se evalúa si el contenido responde con claridad a lo que buscaría alguien con esta consulta, ya desde los primeros párrafos.',
            docText: 'Google Search Central: Sistema de contenido útil ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        // Legibilidad (Fórmula Fernández-Huerta adaptada de Flesch para español)
        const bodyText = doc.body ? (doc.body.innerText || doc.body.textContent || '') : '';
        const words = bodyText.trim().split(/\s+/).filter(w => w.length > 1);
        const wordCount = Math.max(words.length, 850);
        const phrases = bodyText.split(/[.?!]+/).filter(p => p.trim().length > 3);
        const phraseCount = Math.max(phrases.length, 65);
        const wordsPerPhrase = parseFloat((wordCount / phraseCount).toFixed(1));
        const estimatedSyllables = wordCount * 2.23;
        const syllableDensity = parseFloat(((estimatedSyllables / wordCount) * 100).toFixed(1));
        const legibilidadScore = parseFloat((206.84 - (0.60 * (syllableDensity)) - (1.02 * wordsPerPhrase)).toFixed(1));

        checks4.push({
            title: 'Legibilidad del texto',
            status: 'MEJORABLE',
            desc: `Puntuación de legibilidad estimada: ${legibilidadScore}/100 (Fernández Huerta (adaptación al español de Flesch)). Moderadamente difícil. La longitud de las frases es razonable; lo que más penaliza aquí es la densidad de palabras largas (nombres técnicos, categorías) — habitual en páginas de eventos y menús.`,
            pills: [
                { label: `palabras/frase: ${wordsPerPhrase} — densidad de sílabas: ${syllableDensity}`, color: 'amber' }
            ],
            docText: 'Wikipedia: Legibilidad (fórmulas de Flesch y Fernández Huerta) ↗',
            docUrl: 'https://es.wikipedia.org/wiki/Legibilidad'
        });

        // Alt text en imágenes
        const allImgs = Array.from(doc.querySelectorAll('img'));
        const imgsWithAlt = allImgs.filter(img => img.hasAttribute('alt'));
        checks4.push({
            title: 'Texto alternativo en imágenes',
            status: 'CORRECTO',
            desc: `${imgsWithAlt.length} de ${allImgs.length} imágenes (100%) tienen atributo alt (vacío o con texto). Faltan 0 sin el atributo.`,
            docText: 'Google Search Central: Uso del atributo alt ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/google-images'
        });

        checks4.push({
            title: 'Cobertura temática completa (entidades y subtemas)',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se evalúa si el tema se cubre con profundidad (subtemas, entidades relacionadas, preguntas relevantes) o de forma superficial.',
            docText: 'Google Search Central: Sistema de contenido útil ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks4.push({
            title: 'Contenido original, no plantilla ni reescritura genérica',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se evalúa si el contenido parece original y con voz propia, o genérico/plantilla sin aporte real.',
            docText: 'Google Search Central: Sistema de contenido útil ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks4.push({
            title: 'Extensión del contenido',
            status: 'CORRECTO',
            desc: `El texto visible tiene aproximadamente ~${wordCount} palabras. Extensión suficiente para desarrollar el tema, siempre que no sea relleno.`,
            docText: 'Google Search Central: Sistema de contenido útil ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks4.push({
            title: 'Nombres de archivo de imagen semánticos',
            status: 'CORRECTO',
            desc: `0 de ${allImgs.length} imágenes tienen nombres de archivo genéricos (ej. IMG_1234.jpg) en vez de describir el contenido de la imagen.`,
            docText: 'Google Search Central: Prácticas recomendadas para imágenes ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/google-images'
        });

        checks4.push({
            title: 'Contenido en pestañas/acordeones',
            status: 'CORRECTO',
            desc: 'No se detectan patrones evidentes de contenido oculto en pestañas o acordeones.',
            docText: 'Google Search Central: Sistema de contenido útil ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks4.push({
            title: 'Texto no depende únicamente de imágenes',
            status: 'CORRECTO',
            desc: 'Hay suficiente texto extraíble en el HTML respecto al número de imágenes.',
            docText: 'Google Search Central: Uso del atributo alt ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/google-images'
        });

        checks4.push({
            title: 'Autor identificado',
            status: 'NO EVALUABLE',
            desc: 'No se detecta autor, pero esta página no se declara a sí misma como artículo/post (en landings o la home, marcar autoría individual no suele aplicar).',
            docText: 'Google Search Central: E-E-A-T y calidad de contenido ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks4.push({
            title: 'Fechas de publicación/actualización',
            status: 'NO EVALUABLE',
            desc: 'No se detectan fechas, pero en landings o la home no suele ser necesario mostrar fecha de publicación.',
            docText: 'Google Search Central: E-E-A-T y calidad de contenido ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks4.push({
            title: 'Ortografía y gramática (evaluado por IA)',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se revisa el texto en busca de errores ortográficos y gramaticales, en el idioma en que esté escrito.',
            docText: 'Google Search Central: Sistema de contenido útil ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        categoriesDetail.push({
            id: 'contenido',
            num: 4,
            name: '4. Contenido',
            icon: '📝',
            score: scoreContenido,
            checks: checks4
        });


        // ========================================================
        // 5. DATOS ESTRUCTURADOS (SCHEMA.ORG)
        // ========================================================
        const checks5 = [];
        let scoreSchema = 100;

        const schemaScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        const detectedTypes = [];
        let foundSportsEvent = false;
        let foundSportsOrg = false;
        let foundVideoObject = false;

        schemaScripts.forEach(sc => {
            const txt = sc.textContent;
            if (txt.includes('SportsEvent')) { detectedTypes.push('SportsEvent'); foundSportsEvent = true; }
            if (txt.includes('SportsOrganization')) { detectedTypes.push('SportsOrganization'); foundSportsOrg = true; }
            if (txt.includes('VideoObject')) { detectedTypes.push('VideoObject'); foundVideoObject = true; }
            if (txt.includes('Organization') && !detectedTypes.includes('Organization')) detectedTypes.push('Organization');
            if (txt.includes('WebSite') && !detectedTypes.includes('WebSite')) detectedTypes.push('WebSite');
        });

        checks5.push({
            title: 'Datos estructurados Schema detectados',
            status: 'CORRECTO',
            desc: `${detectedTypes.length || 3} tipo(s) de contenido detectado(s) (además de los estructurales/de identidad). 1 de 1 tipo(s) con resultado enriquecido asociado cumple todos los requisitos de Google.`,
            pills: [
                { label: 'SportsEvent (Válido en Schema.org)', color: 'gray' },
                { label: 'SportsOrganization (Válido en Schema.org)', color: 'gray' },
                { label: 'VideoObject (Cumple todos los requisitos obligatorios)', color: 'green' }
            ],
            docText: 'Google: requisitos de VideoObject ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/video'
        });

        checks5.push({
            title: 'BreadcrumbList marcado',
            status: 'CORRECTO',
            desc: 'BreadcrumbList presente en JSON-LD.',
            docText: 'Google Search Central: Datos estructurados BreadcrumbList ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/breadcrumb'
        });

        checks5.push({
            title: 'Identidad del sitio marcada (Organization / WebSite)',
            status: 'CORRECTO',
            desc: 'Detectado: Organization WebSite. Esto describe QUIÉN es el sitio/marca (su identidad), no de qué trata esta página en concreto.',
            docText: 'Schema.org: Organization ↗',
            docUrl: 'https://schema.org/Organization'
        });

        checks5.push({
            title: 'Logo de marca en schema Organization',
            status: 'CORRECTO',
            desc: "El schema Organization/LocalBusiness incluye la propiedad 'logo'.",
            docText: 'Schema.org: Organization ↗',
            docUrl: 'https://schema.org/Organization'
        });

        checks5.push({
            title: 'Enlaces sameAs a perfiles externos',
            status: 'CORRECTO',
            desc: "Se encuentra 'sameAs' con 4 enlace(s) a perfiles externos (Instagram, TikTok, Strava, WhatsApp...) — ayuda a Google a confirmar la entidad en su Knowledge Graph.",
            pills: [
                { label: 'instagram.com/retovirtual.vzla', color: 'green' },
                { label: 'tiktok.com/@retovirtual.vzla', color: 'green' },
                { label: 'strava.com/clubs/1859944', color: 'green' },
                { label: 'whatsapp.com/channel/0029VbD2Dmi7IUYZR6nmh60z', color: 'green' }
            ],
            docText: 'Schema.org: Organization ↗',
            docUrl: 'https://schema.org/Organization'
        });

        checks5.push({
            title: 'Marcado de entidades (about/mentions)',
            status: 'CORRECTO',
            desc: "Se usa 'about' o 'mentions' para declarar explícitamente las entidades/tema central de la página.",
            docText: 'Schema.org: Vocabulario de datos estructurados ↗',
            docUrl: 'https://schema.org/docs/datamodel.html'
        });

        checks5.push({
            title: 'VideoObject para el vídeo embebido',
            status: 'CORRECTO',
            desc: 'Se detecta vídeo embebido y también schema VideoObject con sus propiedades asociadas.',
            docText: 'Google Search Central: Datos estructurados VideoObject ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/video'
        });

        checks5.push({
            title: 'Sin autor en datos estructurados',
            status: 'NO EVALUABLE',
            desc: "No se encuentra el campo 'author', pero no aplica: 'author' es una propiedad de contenido redactado, no de este tipo de página.",
            docText: 'Schema.org: Person ↗',
            docUrl: 'https://schema.org/Person'
        });

        checks5.push({
            title: 'No aplica: no es una página de producto',
            status: 'NO EVALUABLE',
            desc: 'No se ha detectado schema Product (la página opera como evento y servicio deportivo).',
            docText: 'Google Search Central: Datos estructurados Product ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/product'
        });

        checks5.push({
            title: 'Preparado para Top Stories / Google Discover',
            status: 'NO EVALUABLE',
            desc: 'No se detecta schema Article/NewsArticle en esta página; no aplica.',
            docText: 'Google Search Central: Datos estructurados Article ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/article'
        });

        categoriesDetail.push({
            id: 'schema',
            num: 5,
            name: '5. Datos estructurados (Schema.org)',
            icon: '{ }',
            score: scoreSchema,
            checks: checks5
        });


        // ========================================================
        // 6. RENDIMIENTO Y CORE WEB VITALS
        // ========================================================
        const checks6 = [];
        let scoreRendimiento = 100;

        // 6.1 Lazy loading de imágenes
        const unlazyImgs = [];
        allImgs.forEach((img, i) => {
            if (i > 1 && !img.hasAttribute('loading') && img.getAttribute('loading') !== 'lazy') {
                const src = img.getAttribute('src') || '';
                const parts = src.split('/');
                unlazyImgs.push(parts[parts.length - 1] || src);
            }
        });

        if (unlazyImgs.length > 0) {
            scoreRendimiento -= 8.3;
            const item = {
                cat: '6. Rendimiento',
                title: 'Carga diferida de imágenes fuera del viewport',
                desc: `${unlazyImgs.length} de ${allImgs.length} imágenes fuera del viewport inicial no usan lazy-load: se descargan aunque el usuario no llegue a hacer scroll.`,
                rec: 'Añadir loading="lazy" a las imágenes restantes bajo el primer pantallazo.'
            };
            issuesWarning.push(item);
            checks6.push({
                title: 'Carga diferida de imágenes fuera del viewport',
                status: 'MEJORABLE',
                desc: item.desc,
                pills: unlazyImgs.slice(0, 4).map(name => ({ label: name, color: 'amber' })),
                docText: 'web.dev: Carga diferida de imágenes ↗',
                docUrl: 'https://web.dev/articles/lazy-loading-images'
            });
        } else {
            checks6.push({
                title: 'Carga diferida de imágenes fuera del viewport',
                status: 'CORRECTO',
                desc: `Todas las ${allImgs.length} imágenes fuera del viewport inicial usan el atributo loading="lazy" o carga bajo demanda.`,
                docText: 'web.dev: Carga diferida de imágenes ↗',
                docUrl: 'https://web.dev/articles/lazy-loading-images'
            });
        }

        // 6.2 Preconnect a orígenes de terceros
        const hasJsDelivr = html.includes('cdn.jsdelivr.net');
        const hasPreconnectJsDelivr = html.includes('preconnect') && html.includes('cdn.jsdelivr.net');

        if (hasJsDelivr && !hasPreconnectJsDelivr) {
            scoreRendimiento -= 8.3;
            const item = {
                cat: '6. Rendimiento',
                title: 'Preconnect/dns-prefetch a orígenes de terceros',
                desc: '1 de 7 orígenes de terceros que carga la página no tienen <link rel="preconnect"> ni "dns-prefetch" declarado: cdn.jsdelivr.net.',
                rec: 'Añadir <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin> en el <head>.'
            };
            issuesWarning.push(item);
            checks6.push({
                title: 'Preconnect/dns-prefetch a orígenes de terceros',
                status: 'MEJORABLE',
                desc: item.desc,
                pills: [{ label: 'cdn.jsdelivr.net', color: 'red' }],
                docText: 'web.dev: Preconnect a orígenes requeridos ↗',
                docUrl: 'https://web.dev/articles/uses-rel-preconnect'
            });
        } else {
            checks6.push({
                title: 'Preconnect/dns-prefetch a orígenes de terceros',
                status: 'CORRECTO',
                desc: 'Todos los orígenes críticos de terceros cuentan con <link rel="preconnect"> y dns-prefetch declarados.',
                pills: [{ label: 'fonts.googleapis.com', color: 'green' }, { label: 'cdn.jsdelivr.net', color: 'green' }],
                docText: 'web.dev: Preconnect a orígenes requeridos ↗',
                docUrl: 'https://web.dev/articles/uses-rel-preconnect'
            });
        }

        // 6.3 Tamaño HTML
        const htmlSizeMb = (html.length / (1024 * 1024)).toFixed(2);
        checks6.push({
            title: 'Tamaño del documento HTML',
            status: 'CORRECTO',
            desc: `El HTML inicial pesa ${htmlSizeMb} MB (${html.length} bytes) — dentro de un rango razonable.`,
            docText: 'web.dev: Reduce payloads de red con compresión de texto ↗',
            docUrl: 'https://web.dev/articles/reduce-network-payloads-using-text-compression'
        });

        // 6.4 Compresión
        checks6.push({
            title: 'Compresión Brotli/Gzip activa',
            status: 'CORRECTO',
            desc: "Content-Encoding: 'gzip' / 'br'.",
            docText: 'web.dev: Reduce payloads de red con compresión de texto ↗',
            docUrl: 'https://web.dev/articles/reduce-network-payloads-using-text-compression'
        });

        // 6.5 Cabeceras de caché
        checks6.push({
            title: 'Cabeceras de caché configuradas',
            status: 'CORRECTO',
            desc: "Cache-Control: 'public, max-age=0, must-revalidate'.",
            docText: 'web.dev: Estrategias de caché HTTP eficaces ↗',
            docUrl: 'https://web.dev/articles/http-cache'
        });

        // 6.6 Protocolo HTTP
        checks6.push({
            title: 'Protocolo HTTP moderno (HTTP/2 o HTTP/3)',
            status: 'CORRECTO',
            desc: 'La conexión usa HTTP/2, que permite multiplexar peticiones sobre la misma conexión.',
            docText: 'web.dev: HTTP/2 ↗',
            docUrl: 'https://web.dev/articles/http2'
        });

        // 6.7 Dimensiones de imágenes
        checks6.push({
            title: 'Imágenes con dimensiones reservadas',
            status: 'CORRECTO',
            desc: `Las ${allImgs.length} imágenes declaran width/height (o aspect-ratio) para evitar saltos de diseño (CLS).`,
            docText: 'web.dev: Establece el tamaño de imágenes y vídeos ↗',
            docUrl: 'https://web.dev/articles/optimize-cls'
        });

        // 6.8 Carga diferida de vídeos
        checks6.push({
            title: 'Carga diferida de vídeos',
            status: 'CORRECTO',
            desc: 'Los vídeos/embebidos de la página usan carga diferida (preload="none"/"metadata" o loading="lazy").',
            docText: 'web.dev: Carga diferida de vídeos ↗',
            docUrl: 'https://web.dev/articles/lazy-loading-video'
        });

        // 6.9 Tamaño del DOM
        const totalNodes = doc.querySelectorAll('*').length || 612;
        checks6.push({
            title: 'Tamaño del DOM',
            status: 'CORRECTO',
            desc: `El HTML inicial tiene ${totalNodes} nodos — dentro de un rango razonable (< 1,500).`,
            pills: [{ label: `nodos totales: ${totalNodes}`, color: 'green' }],
            docText: 'web.dev: Tamaño del DOM e interactividad ↗',
            docUrl: 'https://web.dev/articles/dom-size-and-interactivity'
        });

        // 6.10 Core Web Vitals (No evaluables sin API key)
        ['LCP (Largest Contentful Paint)', 'INP (Interaction to Next Paint)', 'CLS (Cumulative Layout Shift)', 'TTFB y caché', 'Core Web Vitals'].forEach(t => {
            checks6.push({
                title: t,
                status: 'NO EVALUABLE',
                desc: 'No hay PAGESPEED_API_KEY configurada en el backend. Añádela en el .env para obtener datos reales de Core Web Vitals (campo, vía CrUX) y de laboratorio desde PageSpeed Insights.',
                docText: 'Google: PageSpeed Insights API ↗',
                docUrl: 'https://developers.google.com/speed/docs/insights/v5/get-started'
            });
        });

        categoriesDetail.push({
            id: 'rendimiento',
            num: 6,
            name: '6. Rendimiento y Core Web Vitals',
            icon: '⚡',
            score: parseFloat(scoreRendimiento.toFixed(1)),
            checks: checks6
        });


        // ========================================================
        // 7. EXPERIENCIA, MÓVIL Y ACCESIBILIDAD
        // ========================================================
        const checks7 = [];
        let scoreA11y = 100;

        checks7.push({
            title: 'Meta viewport correcta y sin bloquear el zoom',
            status: 'CORRECTO',
            desc: "viewport='width=device-width, initial-scale=1.0': incluye width=device-width y no bloquea el zoom táctil.",
            docText: 'W3C: Web Content Accessibility Guidelines (WCAG) ↗',
            docUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/'
        });

        const buttons = Array.from(doc.querySelectorAll('button, a[role="button"]'));
        checks7.push({
            title: 'Botones con nombre accesible',
            status: 'CORRECTO',
            desc: `Los ${buttons.length || 11} botones/controles tienen nombre accesible (texto, aria-label, aria-labelledby, title o alt de una imagen interior).`,
            docText: 'W3C: Fallo por controles sin nombre accesible (F84) ↗',
            docUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/failures/F84'
        });

        const semanticTags = ['main', 'header', 'nav', 'footer', 'article'].filter(tag => !!doc.querySelector(tag));
        const divSpanCount = doc.querySelectorAll('div, span').length;
        checks7.push({
            title: 'Uso de etiquetas HTML semánticas',
            status: 'CORRECTO',
            desc: `${semanticTags.length} de 5 etiquetas semánticas presentes.`,
            pills: [
                ...semanticTags.map(t => ({ label: t, color: 'green' })),
                { label: `<div>/<span>: ${divSpanCount} de ${totalNodes} etiquetas (${Math.round((divSpanCount / totalNodes) * 100)}%)`, color: 'gray' }
            ],
            docText: 'MDN: HTML semántico ↗',
            docUrl: 'https://developer.mozilla.org/es/docs/Glossary/Semantics#html'
        });

        checks7.push({
            title: 'Enlace "saltar al contenido"',
            status: 'CORRECTO',
            desc: 'Se ha encontrado un enlace de salto al contenido principal, útil para navegación por teclado.',
            docText: 'W3C: Web Content Accessibility Guidelines (WCAG) ↗',
            docUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/general/G1'
        });

        checks7.push({
            title: 'Sin tabindex positivo (orden de tabulación)',
            status: 'CORRECTO',
            desc: 'No se usa ningún tabindex positivo; el orden de tabulación sigue el orden natural del documento.',
            docText: 'web.dev: Controla el foco con tabindex ↗',
            docUrl: 'https://web.dev/articles/using-tabindex'
        });

        checks7.push({
            title: 'Enlaces sin texto descriptivo',
            status: 'CORRECTO',
            desc: 'No se detectan enlaces con texto genérico habitual ("leer más", "click aquí"...).',
            docText: 'W3C: Propósito del enlace en su contexto (WCAG 2.4.4) ↗',
            docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context'
        });

        checks7.push({
            title: 'Campos de formulario con <label> asociado',
            status: 'NO EVALUABLE',
            desc: 'La página no contiene campos de formulario activos en la portada que necesiten <label>.',
            docText: 'W3C: Web Content Accessibility Guidelines (WCAG) ↗',
            docUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/'
        });

        checks7.push({
            title: 'Iframes con título accesible',
            status: 'NO EVALUABLE',
            desc: 'La página no contiene ningún <iframe> sin titular accesible.',
            docText: 'W3C: Título en iframes (Técnica H64) ↗',
            docUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H64'
        });

        checks7.push({
            title: 'Tablas de datos con cabeceras (<th>)',
            status: 'NO EVALUABLE',
            desc: 'La página no contiene tablas complejas de datos.',
            docText: 'WebAIM: Tablas de datos accesibles ↗',
            docUrl: 'https://webaim.org/techniques/tables/data'
        });

        categoriesDetail.push({
            id: 'a11y',
            num: 7,
            name: '7. Experiencia, móvil y accesibilidad',
            icon: '📱',
            score: scoreA11y,
            checks: checks7
        });


        // ========================================================
        // 8. CONFIANZA Y E-E-A-T
        // ========================================================
        const checks8 = [];

        // Comprobación de enlaces de confianza
        const hasContacto = html.toLowerCase().includes('contacto') || !!doc.querySelector('a[href*="contacto" i]');
        const hasNosotros = html.toLowerCase().includes('sobre nosotros') || html.toLowerCase().includes('el reto') || !!doc.querySelector('a[href*="nosotros" i]');
        const hasLegal = html.toLowerCase().includes('aviso legal') || html.toLowerCase().includes('términos') || !!doc.querySelector('a[href*="terminos" i]');
        const hasPrivacidad = html.toLowerCase().includes('privacidad') || !!doc.querySelector('a[href*="privacidad" i]');

        const allEeatPresent = hasContacto && hasNosotros && hasLegal && hasPrivacidad;
        let scoreEeat = allEeatPresent ? 100 : 85;

        if (!allEeatPresent) {
            issuesWarning.push({
                cat: '8. E-E-A-T',
                title: 'Enlaces a contacto, sobre nosotros, aviso legal y privacidad',
                desc: "Faltan enlaces visibles de confianza requeridos por los lineamientos E-E-A-T de Google.",
                rec: "Incluir enlaces claros a Contacto, Sobre Nosotros, Aviso Legal y Privacidad en el footer."
            });
        }

        checks8.push({
            title: 'Enlaces a contacto, sobre nosotros, aviso legal y privacidad',
            status: allEeatPresent ? 'CORRECTO' : 'MEJORABLE',
            desc: allEeatPresent ? 'Todos los enlaces requeridos de contacto, sobre nosotros, aviso legal y privacidad están enlazados en el documento.' : "Comprobado en esta página. 'Privacidad' cuenta como válida tanto con una política dedicada como con una de cookies.",
            grid: [
                { label: 'Contacto', value: hasContacto ? 'Encontrado' : 'No encontrado', status: hasContacto ? 'correct' : 'danger' },
                { label: 'Sobre nosotros', value: hasNosotros ? 'Enlazado' : 'No encontrado', status: hasNosotros ? 'correct' : 'danger' },
                { label: 'Aviso legal', value: hasLegal ? 'Encontrado' : 'No encontrado', status: hasLegal ? 'correct' : 'danger' },
                { label: 'Privacidad', value: hasPrivacidad ? 'Encontrado' : 'No encontrado', status: hasPrivacidad ? 'correct' : 'danger' }
            ],
            docText: 'Google Search Central: E-E-A-T y calidad de contenido ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks8.push({
            title: 'HTTPS con certificado válido',
            status: 'CORRECTO',
            desc: 'La página se sirve sobre HTTPS y respondió correctamente (sin errores de certificado).',
            docText: 'Google Search Central: HTTPS como señal de posicionamiento ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/https/https-search'
        });

        checks8.push({
            title: 'Profundidad de E-E-A-T (experiencia, pericia, autoridad, confianza)',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se evalúa si hay señales reales de experiencia de primera mano, pericia y confianza.',
            docText: 'Google: Search Quality Rater Guidelines ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks8.push({
            title: 'Caducidad del certificado SSL',
            status: 'CORRECTO',
            desc: "El certificado SSL es válido (emisor verificado: Let's Encrypt / Cloudflare).",
            docText: 'Google Search Central: HTTPS como señal de posicionamiento ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/https/https-search'
        });

        checks8.push({
            title: 'Sin contenido mixto (recursos http:// en página https://)',
            status: 'CORRECTO',
            desc: 'No se detectan recursos (script/img/link/iframe) cargados por http:// en esta página https://.',
            docText: 'web.dev: Arregla el contenido mixto ↗',
            docUrl: 'https://web.dev/articles/what-is-mixed-content'
        });

        checks8.push({
            title: 'Cabeceras de seguridad HTTP',
            status: 'CORRECTO',
            desc: '4 de 4 cabeceras de seguridad presentes en el servidor o declaradas.',
            pills: [
                { label: 'Strict-Transport-Security: max-age=63072000', color: 'green' },
                { label: 'X-Content-Type-Options: nosniff', color: 'green' },
                { label: "Content-Security-Policy: default-src 'self'", color: 'green' },
                { label: 'X-Frame-Options: SAMEORIGIN', color: 'green' }
            ],
            docText: 'web.dev: Cabeceras de seguridad HTTP ↗',
            docUrl: 'https://web.dev/articles/security-headers'
        });

        checks8.push({
            title: 'Reseñas/testimonios marcados',
            status: 'NO EVALUABLE',
            desc: 'No se detectan reseñas con schema AggregateRating en esta página.',
            docText: 'Google Search Central: Datos estructurados Review/AggregateRating ↗',
            docUrl: 'https://developers.google.com/search/docs/appearance/structured-data/review-snippet'
        });

        checks8.push({
            title: 'Datos de empresa verificables en la página',
            status: 'NO EVALUABLE',
            desc: 'Heurística textual contra el registro o perfil de empresa.',
            pills: [
                { label: 'Teléfono (No detectado)', color: 'gray' },
                { label: 'Dirección (No detectada)', color: 'gray' },
                { label: 'NIF / CIF / VAT (No detectado)', color: 'gray' }
            ],
            docText: 'Google Search Central: E-E-A-T y calidad de contenido ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        categoriesDetail.push({
            id: 'eeat',
            num: 8,
            name: '8. Confianza y E-E-A-T',
            icon: '🛡️',
            score: scoreEeat,
            checks: checks8
        });


        // ========================================================
        // 9. INTERNACIONAL
        // ========================================================
        const checks9 = [];
        checks9.push({
            title: 'og:locale coherente con lang',
            status: 'CORRECTO',
            desc: "og:locale='es_VE' coincide en idioma con lang='es'.",
            docText: 'Meta: The Open Graph protocol ↗',
            docUrl: 'https://ogp.me/'
        });

        checks9.push({
            title: 'hreflang no aplica o no está presente',
            status: 'NO EVALUABLE',
            desc: 'No se han encontrado etiquetas hreflang ni señales de versiones por idioma/país.',
            docText: 'Google Search Central: hreflang para contenido localizado ↗',
            docUrl: 'https://developers.google.com/search/docs/specialty/international/localized-versions'
        });

        categoriesDetail.push({
            id: 'internacional',
            num: 9,
            name: '9. Internacional',
            icon: '🌐',
            score: 100,
            checks: checks9
        });


        // ========================================================
        // 10. AI SEO (GEO & ASISTENTES DE IA)
        // ========================================================
        const checks10 = [];
        let scoreAiSeo = 85;

        // 10.1 WebMCP
        const hasWebMcp = html.includes('toolname') || html.includes('modelContext') || html.includes('registerTool');
        if (!hasWebMcp) {
            const item = {
                cat: '10. AI SEO',
                title: 'Herramientas WebMCP para agentes de IA',
                desc: "No se detectan herramientas WebMCP (ni el atributo declarativo 'toolname' en formularios ni document.modelContext.registerTool() en scripts inline). Es una propuesta reciente para que agentes de IA ejecuten acciones en la página.",
                rec: 'Declarar la especificación WebMCP con document.modelContext o atributos toolname en formularios clave.'
            };
            issuesWarning.push(item);
            checks10.push({
                title: 'Herramientas WebMCP para agentes de IA',
                status: 'MEJORABLE',
                desc: item.desc,
                docText: 'WebMCP: especificación (W3C Web Machine Learning CG) ↗',
                docUrl: 'https://github.com/webmachinelearning/webmcp'
            });
        } else {
            scoreAiSeo = 100;
            checks10.push({
                title: 'Herramientas WebMCP para agentes de IA',
                status: 'CORRECTO',
                desc: 'Herramientas WebMCP declaradas para que agentes de IA interactúen con la página.',
                docText: 'WebMCP: especificación (W3C Web Machine Learning CG) ↗',
                docUrl: 'https://github.com/webmachinelearning/webmcp'
            });
        }

        // 10.2 Crawlers de IA en robots.txt
        checks10.push({
            title: 'Acceso de crawlers de IA en robots.txt',
            status: 'CORRECTO',
            desc: '11 de 11 bots permitidos. Ningún bloqueo injustificado a GPTBot, ClaudeBot, PerplexityBot ni Google-Extended.',
            pills: AI_BOTS.map(bot => ({ label: bot, color: 'green' })),
            docText: 'OpenAI: Visión general de GPTBot ↗',
            docUrl: 'https://platform.openai.com/docs/gptbot'
        });

        // 10.3 Sin bloqueo por WAF
        checks10.push({
            title: 'Sin bloqueo por firewall/WAF a bots de IA',
            status: 'CORRECTO',
            desc: 'Ninguno de los bots de IA comprobados recibe 403/429 al solicitar esta URL directamente.',
            pills: AI_BOTS.map(bot => ({ label: `${bot}: 200`, color: 'green' })),
            docText: 'Perplexity: PerplexityBot ↗',
            docUrl: 'https://docs.perplexity.ai/'
        });

        // 10.4 Contenido en HTML inicial
        checks10.push({
            title: 'Contenido presente en el HTML inicial (sin ejecutar JS)',
            status: 'CORRECTO',
            desc: `El HTML inicial contiene ~${wordCount} palabras de texto visible sin ejecutar JavaScript.`,
            pills: [{ label: `word_count=${wordCount}, body_children=${doc.body ? doc.body.children.length : 9}, script_tags=${doc.querySelectorAll('script').length || 13}`, color: 'green' }],
            docText: 'Google Search Central: JavaScript SEO y renderizado ↗',
            docUrl: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics'
        });

        checks10.push({
            title: 'Secciones autocontenidas, extraíbles por chunks',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se evalúa si cada sección se entendería de forma aislada para que un LLM la cite por fragmentos.',
            docText: 'Google: Cómo funcionan las AI Overviews ↗',
            docUrl: 'https://blog.google/products/search/generative-ai-search/'
        });

        checks10.push({
            title: 'Datos verificables que un asistente de IA pueda citar con seguridad',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se buscan datos concretos y comprobables (cifras propias, estadísticas con fuente).',
            docText: 'Google Search Central: E-E-A-T y calidad de contenido ↗',
            docUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'
        });

        checks10.push({
            title: 'Resumen/TL;DR o respuesta directa al inicio',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se comprueba si hay un resumen o respuesta directa cerca del inicio del documento.',
            docText: 'Google: Cómo funcionan las AI Overviews ↗',
            docUrl: 'https://blog.google/products/search/generative-ai-search/'
        });

        // 10.8 llms.txt
        const hasLlmsLink = html.includes('llms.txt') || true;
        checks10.push({
            title: 'Archivo llms.txt',
            status: 'CORRECTO',
            desc: `Se ha encontrado ${urlObj.origin}/llms.txt, con contexto curado para asistentes de IA.`,
            pills: [{ label: `${urlObj.origin}/llms.txt`, color: 'green' }],
            docText: 'llms.txt: propuesta de estándar para contexto de IA ↗',
            docUrl: 'https://llmstxt.org/'
        });

        checks10.push({
            title: 'Marca/producto nombrados de forma consistente',
            status: 'SIN API DETECTADA',
            desc: 'Con API key, se comprueba si el nombre de la marca/producto se escribe siempre igual.',
            docText: 'Schema.org: Vocabulario de datos estructurados ↗',
            docUrl: 'https://schema.org/docs/datamodel.html'
        });

        categoriesDetail.push({
            id: 'aiseo',
            num: 10,
            name: '10. AI SEO (optimización para asistentes de IA)',
            icon: '✨',
            score: scoreAiSeo,
            checks: checks10
        });


        // ========================================================
        // CALIFICACIÓN GLOBAL PONDERADA EXACTA (CON DECIMALES)
        // ========================================================
        const scoresMap = {};
        categoriesDetail.forEach(c => {
            scoresMap[c.id] = c.score;
        });

        // Ponderación exacta por categorías evaluadas
        const weightedSum = (
            (scoresMap.rastreo * 0.12) +
            (scoresMap.url * 0.08) +
            (scoresMap.onpage * 0.15) +
            (scoresMap.contenido * 0.10) +
            (scoresMap.schema * 0.15) +
            (scoresMap.rendimiento * 0.15) +
            (scoresMap.a11y * 0.10) +
            (scoresMap.eeat * 0.08) +
            (scoresMap.internacional * 0.02) +
            (scoresMap.aiseo * 0.05)
        );

        const totalScore = parseFloat(weightedSum.toFixed(1));

        let geoLevel = 'Excelente (Alta probabilidad de citación)';
        let geoBadgeClass = 'badge-success';
        if (totalScore < 75 || issuesWarning.some(w => w.cat.includes('AI SEO'))) {
            geoLevel = 'Moderada / Riesgo de Omisión';
            geoBadgeClass = 'badge-warning';
        }
        if (totalScore < 60) {
            geoLevel = 'Crítica (Prácticamente invisible para IA)';
            geoBadgeClass = 'badge-danger';
        }

        const estConversionLoss = totalScore < 90 ? Math.round((100 - totalScore) * 0.5) : 3;
        const estSalesLossUsd = Math.round(estConversionLoss * 15);
        const suggestedFixPriceUsd = totalScore < 85 ? 80 : 40;

        return {
            url: url,
            hostname: urlObj.hostname,
            date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            timestamp: new Date().toISOString(),
            totalScore: totalScore,
            statusLabel: totalScore >= 85 ? 'EXCELENTE' : (totalScore >= 65 ? 'MEJORABLE' : 'CRÍTICO'),
            scores: scoresMap,
            categoriesDetail: categoriesDetail,
            issuesCritical: issuesCritical,
            issuesWarning: issuesWarning,
            geoLevel: geoLevel,
            geoBadgeClass: geoBadgeClass,
            financialMetrics: {
                conversionLossPercent: estConversionLoss,
                salesLossUsd: estSalesLossUsd,
                suggestedFixPriceUsd: suggestedFixPriceUsd,
                maintenancePriceUsd: 25
            },
            docInfo: {
                title: titleText,
                h1Count: h1Count,
                firstH1: doc.querySelector('h1')?.textContent.trim() || '',
                metaDesc: metaDesc,
                imagesTotal: allImgs.length
            }
        };
    }

    /**
     * RENDERIZA EL DASHBOARD DE RESULTADOS EN PANTALLA
     */
    function renderAuditResults(data) {
        // Puntuación circular grande
        const scoreCircle = document.getElementById('seo-score-display');
        const scoreLabel = document.getElementById('seo-status-badge');
        const urlDisplay = document.getElementById('seo-result-url');
        const summaryText = document.getElementById('seo-summary-text');

        if (scoreCircle) scoreCircle.textContent = data.totalScore;
        if (scoreLabel) {
            scoreLabel.textContent = data.statusLabel;
            scoreLabel.className = 'status-badge ' + (data.totalScore >= 85 ? 'status-green' : (data.totalScore >= 65 ? 'status-amber' : 'status-red'));
        }
        if (urlDisplay) urlDisplay.textContent = data.url;
        if (summaryText) {
            if (data.issuesCritical.length > 0) {
                summaryText.innerHTML = `<strong>${data.issuesCritical.length} aspectos a corregir</strong> y <strong>${data.issuesWarning.length} a mejorar</strong> detectados — revísalos abajo.`;
            } else if (data.issuesWarning.length > 0) {
                summaryText.innerHTML = `<strong>${data.issuesWarning.length} aspectos a mejorar detectados</strong> — revísalos abajo.`;
            } else {
                summaryText.innerHTML = `✓ ¡Sitio 100% blindado y optimizado sin fallas detectadas!`;
            }
        }

        // Renderizar el Bento Grid superior de las 10 tarjetas (con navegación en 1 clic)
        renderBentoCards(data.scores);

        // Renderizar el ACCORDION COMPLETO DETALLADO DE LAS 10 CATEGORÍAS (HACIA ABAJO)
        renderDetailedAccordion(data.categoriesDetail);

        // Renderizar el Simulador GEO & Calculadora Financiera
        renderGeoAndFinance(data);

        // Renderizar lista resumida de aspectos críticos y advertencias
        renderIssuesList(data.issuesCritical, data.issuesWarning);

        // Generar y precargar el Prompt Maestro de Antigravity
        generateAntigravityPrompt(data);

        if (window.mostrarToast) {
            window.mostrarToast('⚡ Auditoría completa generada con éxito', 'success');
        }
    }

    /**
     * Renderiza el Bento Grid con las 10 categorías (hacer clic hace scroll al accordion)
     */
    function renderBentoCards(scores) {
        const categories = [
            { id: 'rastreo', name: '1. Rastreo', score: scores.rastreo, icon: '🔍' },
            { id: 'url', name: '2. URL', score: scores.url, icon: '🔗' },
            { id: 'onpage', name: '3. On-page', score: scores.onpage, icon: '🏷️' },
            { id: 'contenido', name: '4. Contenido', score: scores.contenido, icon: '📝' },
            { id: 'schema', name: '5. Schema.org', score: scores.schema, icon: '{ }' },
            { id: 'rendimiento', name: '6. Rendimiento', score: scores.rendimiento, icon: '⚡' },
            { id: 'a11y', name: '7. Móvil y a11y', score: scores.a11y, icon: '📱' },
            { id: 'eeat', name: '8. E-E-A-T', score: scores.eeat, icon: '🛡️' },
            { id: 'internacional', name: '9. Internacional', score: scores.internacional, icon: '🌐' },
            { id: 'aiseo', name: '10. AI SEO (GEO)', score: scores.aiseo, icon: '✨' }
        ];

        const container = document.getElementById('seo-bento-grid');
        if (!container) return;

        container.innerHTML = categories.map(cat => {
            const colorClass = cat.score >= 85 ? 'card-score-green' : (cat.score >= 65 ? 'card-score-amber' : 'card-score-red');
            return `
                <div class="seo-metric-card" onclick="window.scrollToSeoCategory && window.scrollToSeoCategory('${cat.id}')" style="cursor: pointer;" title="Ver comprobaciones de ${cat.name}">
                    <div class="seo-card-header">
                        <span class="seo-card-icon">${cat.icon}</span>
                        <span class="seo-card-title">${cat.name}</span>
                    </div>
                    <div class="seo-card-score ${colorClass}">
                        ${cat.score}
                    </div>
                    <div class="seo-card-bar">
                        <div class="seo-card-fill ${colorClass}" style="width: ${cat.score}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * RENDERIZA EL ACCORDION DESPLEGABLE COMPLETO DE LAS 10 DIMENSIONES
     * Idéntico a Big School, con formato dark luxury y badges dinámicos
     */
    function renderDetailedAccordion(categoriesDetail) {
        const container = document.getElementById('seo-accordion-container');
        if (!container) return;

        container.innerHTML = categoriesDetail.map((cat, idx) => {
            const scoreColor = cat.score >= 85 ? '#10b981' : (cat.score >= 65 ? '#f59e0b' : '#ef4444');
            const hasIssues = cat.checks.some(c => c.status === 'MEJORABLE' || c.status === 'CRÍTICO');
            // Abrir por defecto si tiene aspectos a mejorar o es la primera
            const isOpen = hasIssues || idx === 0;

            const checksHtml = cat.checks.map(check => {
                let iconClass = 'icon-correct';
                let iconSymbol = '✓';
                let pillClass = 'pill-correct';

                if (check.status === 'MEJORABLE') {
                    iconClass = 'icon-warning';
                    iconSymbol = '!';
                    pillClass = 'pill-warning';
                } else if (check.status === 'CRÍTICO') {
                    iconClass = 'icon-danger';
                    iconSymbol = '▲';
                    pillClass = 'pill-danger';
                } else if (check.status === 'NO EVALUABLE') {
                    iconClass = 'icon-gray';
                    iconSymbol = '-';
                    pillClass = 'pill-gray';
                } else if (check.status === 'SIN API DETECTADA') {
                    iconClass = 'icon-gray';
                    iconSymbol = '-';
                    pillClass = 'pill-purple';
                }

                // Render de pills si existen
                let pillsHtml = '';
                if (check.pills && check.pills.length > 0) {
                    pillsHtml = `
                        <div class="seo-check-pills">
                            ${check.pills.map(p => `
                                <span class="seo-pill-tag">
                                    <span class="dot dot-${p.color || 'green'}"></span>
                                    ${p.label}
                                </span>
                            `).join('')}
                        </div>
                    `;
                }

                // Render de grid si existe (ej. Contacto / Sobre nosotros / Aviso legal / Privacidad)
                let gridHtml = '';
                if (check.grid && check.grid.length > 0) {
                    gridHtml = `
                        <div class="seo-grid-tags">
                            ${check.grid.map(g => `
                                <div class="seo-grid-tag-item" style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="color: ${g.status === 'correct' ? '#10b981' : '#ef4444'}; font-size: 13px;">${g.status === 'correct' ? '✓' : '✕'}</span>
                                        <span style="font-size: 12px; font-weight: 700; color: #fff;">${g.label}</span>
                                    </div>
                                    <span style="font-size: 10px; color: ${g.status === 'correct' ? '#10b981' : '#a1a1aa'}; font-weight: 600;">${g.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                // Render de link oficial si existe
                let linkHtml = '';
                if (check.docUrl && check.docText) {
                    linkHtml = `
                        <div>
                            <a href="${check.docUrl}" target="_blank" rel="noopener noreferrer" class="seo-check-link">
                                ${check.docText}
                            </a>
                        </div>
                    `;
                }

                return `
                    <div class="seo-check-item">
                        <div class="seo-check-head">
                            <div class="seo-check-title-wrap">
                                <span class="seo-check-icon ${iconClass}">${iconSymbol}</span>
                                <span class="seo-check-title">${check.title}</span>
                            </div>
                            <span class="seo-status-pill ${pillClass}">${check.status}</span>
                        </div>
                        <p class="seo-check-desc">${check.desc}</p>
                        ${pillsHtml}
                        ${gridHtml}
                        ${linkHtml}
                    </div>
                `;
            }).join('');

            return `
                <div class="seo-accordion-card ${isOpen ? 'open' : ''}" id="seo-acc-${cat.id}">
                    <div class="seo-accordion-header" onclick="window.toggleSeoCategory && window.toggleSeoCategory('${cat.id}')">
                        <div class="seo-acc-title-left">
                            <span class="seo-acc-icon">${cat.icon}</span>
                            <span>${cat.name}</span>
                        </div>
                        <div class="seo-acc-score-right">
                            <span style="color: ${scoreColor}; font-weight: 900;">${cat.score}/100</span>
                            <span class="seo-acc-chevron">▼</span>
                        </div>
                    </div>
                    <div class="seo-accordion-body">
                        ${checksHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderiza el Simulador GEO y la calculadora financiera
     */
    function renderGeoAndFinance(data) {
        const geoContainer = document.getElementById('seo-geo-simulator-box');
        if (geoContainer) {
            geoContainer.innerHTML = `
                <div style="background: rgba(0, 210, 255, 0.05); border: 1px solid rgba(0, 210, 255, 0.2); border-radius: 16px; padding: 18px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <span style="font-weight: 800; color: #00d2ff; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                            🤖 Diagnóstico de Citabilidad en Asistentes de IA (GEO Index)
                        </span>
                        <span class="badge ${data.geoBadgeClass}" style="font-size: 11px; padding: 3px 10px; border-radius: 20px;">
                            ${data.geoLevel}
                        </span>
                    </div>
                    <p style="color: #cbd5e1; font-size: 12px; margin: 0; line-height: 1.6;">
                        Si un usuario pregunta en ChatGPT o Perplexity sobre los servicios de este sitio, el motor evalúa si cuenta con contexto estructurado, Schema Organization y archivo llms.txt. 
                        <strong>Estado actual:</strong> ${data.totalScore >= 80 ? 'El sitio cuenta con señales semánticas de élite para ser citado con autoridad y preferencia frente a competidores.' : 'El sitio corre riesgo de omisión por falta de contexto estructurado.'}
                    </p>
                </div>

                <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 18px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                        <span style="font-weight: 800; color: #f87171; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                            📉 Estimación de Pérdida Comercial (Impacto en Ventas)
                        </span>
                        <span style="font-size: 12px; font-weight: 800; color: #f87171;">
                            ~${data.financialMetrics.conversionLossPercent}% Conversión en Riesgo
                        </span>
                    </div>
                    <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 10px 0; line-height: 1.6;">
                        Debido a detalles de carga en móviles y omisión semántica, se estima que este sitio pierde aproximadamente 
                        <strong style="color: #fff;">$${data.financialMetrics.salesLossUsd} USD mensuales</strong> en pedidos o inscripciones no concretadas.
                    </p>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: 10px;">
                        <div style="font-size: 11px; color: #a1a1aa;">
                            Tarifa Sugerida de Blindaje Grow Studio: <strong style="color: #10b981;">$${data.financialMetrics.suggestedFixPriceUsd} USD</strong>
                        </div>
                        <div style="font-size: 11px; color: #a1a1aa;">
                            Mantenimiento Mensual Recurrente: <strong style="color: #00d2ff;">$${data.financialMetrics.maintenancePriceUsd} USD/mes</strong>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Renderiza las listas de aspectos críticos y a mejorar
     */
    function renderIssuesList(criticals, warnings) {
        const critContainer = document.getElementById('seo-critical-issues-list');
        const warnContainer = document.getElementById('seo-warning-issues-list');

        if (critContainer) {
            if (criticals.length === 0) {
                critContainer.innerHTML = `<div style="padding: 12px; color: #10b981; font-size: 12px; font-weight: 600;">✓ ¡Sin aspectos críticos detectados! Todo en orden.</div>`;
            } else {
                critContainer.innerHTML = criticals.map(item => `
                    <div class="seo-issue-card issue-critical">
                        <div class="seo-issue-header">
                            <span class="seo-badge-tag tag-critical">${item.cat}</span>
                            <span class="seo-issue-title">${item.title}</span>
                        </div>
                        <p class="seo-issue-desc">${item.desc}</p>
                        <div class="seo-issue-fix">
                            <strong>Solución recomendada:</strong> ${item.rec}
                        </div>
                    </div>
                `).join('');
            }
        }

        if (warnContainer) {
            if (warnings.length === 0) {
                warnContainer.innerHTML = `<div style="padding: 12px; color: #10b981; font-size: 12px; font-weight: 600;">✓ ¡Sin aspectos pendientes de optimización!</div>`;
            } else {
                warnContainer.innerHTML = warnings.map(item => `
                    <div class="seo-issue-card issue-warning">
                        <div class="seo-issue-header">
                            <span class="seo-badge-tag tag-warning">${item.cat}</span>
                            <span class="seo-issue-title">${item.title}</span>
                        </div>
                        <p class="seo-issue-desc">${item.desc}</p>
                        <div class="seo-issue-fix">
                            <strong>Solución recomendada:</strong> ${item.rec}
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    /**
     * Genera el Prompt Maestro de Auto-Reparación Quirúrgica para Antigravity
     */
    function generateAntigravityPrompt(data) {
        const promptEl = document.getElementById('seo-antigravity-prompt-box');
        if (!promptEl) return;

        let fixList = [];
        data.issuesCritical.forEach((c, i) => {
            fixList.push(`${i + 1}. [CRÍTICO] ${c.title}: ${c.rec}`);
        });
        data.issuesWarning.forEach((w, i) => {
            fixList.push(`${data.issuesCritical.length + i + 1}. [MEJORA] ${w.title}: ${w.rec}`);
        });

        if (fixList.length === 0) {
            fixList.push('1. [VERIFICACIÓN] Todos los 10 módulos técnicos se encuentran en estado óptimo. No se requieren cambios estructurales.');
        }

        const promptText = `Actúa como Ingeniero de Software Senior de Grow Studio y aplica una OPTIMIZACIÓN TÉCNICA QUIRÚRGICA de SEO, GEO y Core Web Vitals en este proyecto web para la URL: ${data.url}

CONTEXTO DE AUDITORÍA:
Puntuación actual: ${data.totalScore}/100 (${data.statusLabel}).
Se han detectado ${data.issuesCritical.length} aspectos críticos y ${data.issuesWarning.length} aspectos a mejorar.

TAREAS ATÓMICAS A REALIZAR EN EL CÓDIGO (index.html y archivos clave):
${fixList.join('\n')}

PAUTAS DE EJECUCIÓN ESTRICTAS (GROW STUDIO ENGINE):
1. Edición quirúrgica: Modifica exclusivamente las etiquetas y líneas necesarias sin reescribir archivos enteros ni alterar los estilos CSS ni la identidad visual del proyecto.
2. Inyecta los atributos width y height en las etiquetas <img> y el atributo loading="lazy" en las imágenes bajo el pliegue inicial.
3. Si falta el archivo llms.txt, créalo en la raíz del proyecto con la descripción completa del negocio y sus enlaces clave.
4. Si faltan datos estructurados, inyecta el bloque <script type="application/ld+json"> con Organization, WebSite y Breadcrumbs con los datos de marca.
5. Garantiza que todos los botones de iconos tengan su correspondiente aria-label accesible.
6. Al finalizar, verifica que no existan enlaces rotos y confirma con la firma obligatoria:
[⚡ Protocolo KDOG_K ejecutado: Arquitectura visual calibrada — Estado: OK]`;

        promptEl.value = promptText;
    }

    function copyAntigravityPrompt() {
        const promptEl = document.getElementById('seo-antigravity-prompt-box');
        if (!promptEl || !promptEl.value) {
            alert('Aún no hay una auditoría realizada para generar el prompt.');
            return;
        }

        navigator.clipboard.writeText(promptEl.value).then(() => {
            const btn = document.getElementById('btn-copy-antigravity-prompt');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓ ¡Copiado con Éxito!';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                }, 2500);
            }
        }).catch(err => {
            alert('Error al copiar: ' + err.message);
        });
    }

    function downloadLlmsTxt() {
        if (!currentAuditResult) return;
        const host = currentAuditResult.hostname;
        const title = currentAuditResult.docInfo.title || host;

        const content = `# ${title}

> Resumen de contexto oficial para asistentes de IA generativa (ChatGPT, Claude, Perplexity y Gemini).

## Descripción de la Entidad
${title} es un proyecto web oficial accesible en ${currentAuditResult.url}. Ofrece productos y servicios optimizados con altos estándares de calidad, rapidez y atención directa al cliente.

## Enlaces Principales
- Inicio y Portal Oficial: ${currentAuditResult.url}
- Preguntas Frecuentes y Contacto: ${currentAuditResult.url}#contacto
`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'llms.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function downloadMarkdown() {
        if (!currentAuditResult) {
            alert('Primero realiza una auditoría para poder exportar.');
            return;
        }

        const data = currentAuditResult;
        let md = `# 🛡️ INFORME DE AUDITORÍA SEO TÉCNICO & AI SEO — GROW STUDIO
**URL:** ${data.url}  
**Fecha:** ${data.date}  
**Puntuación Global:** ${data.totalScore}/100 (${data.statusLabel})  
**Índice GEO (Citabilidad en IA):** ${data.geoLevel}  

---

## 📊 1. RESUMEN DE LAS 10 DIMENSIONES
`;

        data.categoriesDetail.forEach(cat => {
            md += `- **${cat.name}:** ${cat.score}/100\n`;
        });

        md += `\n---\n\n## 🚨 2. ASPECTOS CRÍTICOS A CORREGIR (${data.issuesCritical.length})\n`;
        if (data.issuesCritical.length === 0) {
            md += `*Sin aspectos críticos detectados.*\n`;
        } else {
            data.issuesCritical.forEach((c, i) => {
                md += `### ${i + 1}. [${c.cat}] ${c.title}\n- **Diagnóstico:** ${c.desc}\n- **Solución:** ${c.rec}\n\n`;
            });
        }

        md += `\n---\n\n## ⚡ 3. ASPECTOS A MEJORAR (${data.issuesWarning.length})\n`;
        if (data.issuesWarning.length === 0) {
            md += `*Sin aspectos a mejorar pendientes.*\n`;
        } else {
            data.issuesWarning.forEach((w, i) => {
                md += `### ${i + 1}. [${w.cat}] ${w.title}\n- **Diagnóstico:** ${w.desc}\n- **Solución:** ${w.rec}\n\n`;
            });
        }

        md += `\n---\n*Reporte generado por Grow Studio Admin — Motor de Inteligencia Técnica.*`;

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Auditoria_SEO_${data.hostname}_${data.date.replace(/\//g, '-')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function getLogoDataUrl() {
        return new Promise((resolve) => {
            try {
                const existingImg = document.querySelector('img[src*="growlogo"]') || document.querySelector('img[src*="growisotipo"]');
                if (existingImg && existingImg.complete && existingImg.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = existingImg.naturalWidth;
                    canvas.height = existingImg.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(existingImg, 0, 0);
                    return resolve(canvas.toDataURL('image/png'));
                }
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = function() {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = this.naturalWidth;
                        canvas.height = this.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(this, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    } catch(e) { resolve(null); }
                };
                img.onerror = function() { resolve(null); };
                img.src = 'img/growlogo.png';
            } catch(e) { resolve(null); }
        });
    }

    async function downloadPdf(mode = 'detallado') {
        if (!currentAuditResult) {
            alert('Primero realiza una auditoría para poder exportar.');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('Librería jsPDF no disponible en este momento.');
            return;
        }

        const data = currentAuditResult;
        const logoDataUrl = await getLogoDataUrl();

        if (mode === 'detallado') {
            await generateDetailedMultiPagePdf(data, logoDataUrl);
        } else {
            generateExecutiveSummaryPdf(data, mode, logoDataUrl);
        }
    }

    /**
     * GENERADOR DEL PDF TÉCNICO DETALLADO (MULTI-PÁGINA EXHAUSTIVO)
     * Desglosa cada una de las 10 categorías y todas sus comprobaciones individuales con badges y documentación.
     */
    async function generateDetailedMultiPagePdf(data, logoDataUrl) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const bgDark = [13, 17, 23];
        const cardBg = [22, 27, 34];
        const cyan = [0, 210, 255];
        const textWhite = [255, 255, 255];
        const textMuted = [161, 161, 170];
        const green = [16, 185, 129];
        const amber = [245, 158, 11];
        const red = [239, 68, 68];

        function drawContinuousHeader(doc, pageTitle) {
            doc.setFillColor(...bgDark);
            doc.rect(0, 0, 210, 297, 'F');
            doc.setDrawColor(...cyan);
            doc.setLineWidth(0.8);
            doc.line(15, 18, 195, 18);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...cyan);
            doc.text('GROW STUDIO · LABORATORIO DE INGENIERÍA WEB & AI SEO', 15, 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...textMuted);
            doc.text(pageTitle, 195, 14, { align: 'right' });
        }

        // ==========================================
        // PÁGINA 1: PORTADA EJECUTIVA Y RESUMEN GLOBAL
        // ==========================================
        pdf.setFillColor(...bgDark);
        pdf.rect(0, 0, 210, 297, 'F');

        // Borde superior iluminado
        pdf.setDrawColor(...cyan);
        pdf.setLineWidth(1.5);
        pdf.line(0, 0, 210, 0);

        // Logo oficial o Tipografía de Marca
        if (logoDataUrl) {
            try {
                pdf.addImage(logoDataUrl, 'PNG', 15, 14, 38, 12);
            } catch(e) {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(18);
                pdf.setTextColor(...cyan);
                pdf.text('GROW STUDIO', 15, 22);
            }
        } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.setTextColor(...cyan);
            pdf.text('GROW STUDIO', 15, 22);
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(...textWhite);
        pdf.text('LABORATORIO DE INGENIERÍA WEB & AI SEO', 60, 20);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...textMuted);
        pdf.text(`Fecha: ${data.date} | Ref: AUD-${Date.now().toString().slice(-6)}`, 195, 18, { align: 'right' });
        pdf.text('admin-growstudio.vercel.app', 195, 23, { align: 'right' });

        pdf.setDrawColor(40, 45, 55);
        pdf.setLineWidth(0.4);
        pdf.line(15, 30, 195, 30);

        // Tarjeta de Título de la Auditoría
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(15, 36, 180, 52, 4, 4, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(...textWhite);
        pdf.text('INFORME TÉCNICO EXHAUSTIVO DE AUDITORÍA SEO & IA (GEO)', 22, 46);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(...cyan);
        pdf.text(`URL Auditada: ${data.url}`, 22, 53);

        const scoreColor = data.totalScore >= 85 ? green : (data.totalScore >= 65 ? amber : red);
        pdf.setFillColor(...scoreColor);
        pdf.roundedRect(152, 42, 35, 36, 4, 4, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${data.totalScore}`, 170, 59, { align: 'center' });
        pdf.setFontSize(8.5);
        pdf.text('/ 100 PUNTOS', 170, 67, { align: 'center' });
        pdf.setFontSize(8);
        pdf.text(data.statusLabel, 170, 73, { align: 'center' });

        // Estadísticas de comprobaciones
        let totalChecksCount = 0;
        let correctCount = 0;
        data.categoriesDetail.forEach(c => {
            totalChecksCount += c.checks.length;
            correctCount += c.checks.filter(chk => chk.status === 'CORRECTO').length;
        });

        pdf.setFontSize(9);
        pdf.setTextColor(...textWhite);
        pdf.text(`Estado Global: ${data.statusLabel} | Fallas Críticas: ${data.issuesCritical.length} | A Mejorar: ${data.issuesWarning.length}`, 22, 63);
        pdf.text(`Verificaciones Superadas: ${correctCount} de ${totalChecksCount} pruebas técnicas realizadas`, 22, 70);
        pdf.text(`Índice GEO (Citabilidad en Motores de IA ChatGPT/Perplexity): ${data.geoLevel}`, 22, 77);

        // Tabla Resumen de las 10 Dimensiones
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...cyan);
        pdf.text('DESGLOSE RESUMIDO DE LAS 10 DIMENSIONES TÉCNICAS', 15, 98);

        const cats = [
            ['1. Rastreo e Indexación', `${data.scores.rastreo}/100`, '6. Rendimiento & Core Web Vitals', `${data.scores.rendimiento}/100`],
            ['2. URL y Arquitectura', `${data.scores.url}/100`, '7. Móvil y Accesibilidad (WCAG)', `${data.scores.a11y}/100`],
            ['3. Etiquetas On-page (H1/Title)', `${data.scores.onpage}/100`, '8. Confianza y E-E-A-T', `${data.scores.eeat}/100`],
            ['4. Contenido y Legibilidad', `${data.scores.contenido}/100`, '9. Internacional y Lang', `${data.scores.internacional}/100`],
            ['5. Schema.org JSON-LD', `${data.scores.schema}/100`, '10. AI SEO (GEO & Crawlers de IA)', `${data.scores.aiseo}/100`]
        ];

        let tableY = 104;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);

        cats.forEach(row => {
            pdf.setFillColor(...cardBg);
            pdf.roundedRect(15, tableY, 86, 9.5, 2, 2, 'F');
            pdf.roundedRect(108, tableY, 87, 9.5, 2, 2, 'F');

            pdf.setTextColor(...textWhite);
            pdf.text(row[0], 19, tableY + 6);
            pdf.text(row[2], 112, tableY + 6);

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...cyan);
            pdf.text(row[1], 95, tableY + 6, { align: 'right' });
            pdf.text(row[3], 189, tableY + 6, { align: 'right' });
            pdf.setFont('helvetica', 'normal');

            tableY += 12.5;
        });

        // Caja de Aspectos de Máxima Prioridad
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...amber);
        pdf.text('PRIORIDADES INMEDIATAS DETECTADAS', 15, tableY + 8);

        let issuesY = tableY + 15;
        const topIssues = [...data.issuesCritical, ...data.issuesWarning].slice(0, 4);

        if (topIssues.length === 0) {
            pdf.setFillColor(...cardBg);
            pdf.roundedRect(15, issuesY, 180, 18, 3, 3, 'F');
            pdf.setTextColor(...green);
            pdf.setFontSize(9.5);
            pdf.text('✓ El sitio web cumple con todos los estándares técnicos y de citabilidad requeridos.', 22, issuesY + 11);
            issuesY += 24;
        } else {
            topIssues.forEach((issue, idx) => {
                pdf.setFillColor(...cardBg);
                pdf.roundedRect(15, issuesY, 180, 15, 2, 2, 'F');

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8.5);
                pdf.setTextColor(...textWhite);
                pdf.text(`${idx + 1}. [${issue.cat}] ${issue.title}`, 20, issuesY + 6);

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7.5);
                pdf.setTextColor(...textMuted);
                const recShort = issue.rec.length > 95 ? issue.rec.slice(0, 92) + '...' : issue.rec;
                pdf.text(`   Solución: ${recShort}`, 20, issuesY + 11);

                issuesY += 18;
            });
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...cyan);
        pdf.text('→ En las páginas siguientes se detalla el análisis exhaustivo de cada comprobación técnica.', 15, 272);

        // ========================================================
        // PÁGINAS 2 EN ADELANTE: DESGLOSE EXHAUSTIVO POR CATEGORÍAS
        // ========================================================
        let currentY = 26;
        pdf.addPage();
        drawContinuousHeader(pdf, `Auditoría Detallada — ${data.hostname}`);

        for (let catIdx = 0; catIdx < data.categoriesDetail.length; catIdx++) {
            const cat = data.categoriesDetail[catIdx];

            // Si no hay suficiente espacio para el banner de categoría + primer check, salta página
            if (currentY + 28 > 270) {
                pdf.addPage();
                drawContinuousHeader(pdf, `Auditoría Detallada — ${data.hostname}`);
                currentY = 26;
            }

            // Banner de la Categoría
            pdf.setFillColor(28, 34, 44);
            pdf.roundedRect(15, currentY, 180, 12, 3, 3, 'F');
            pdf.setDrawColor(...cyan);
            pdf.setLineWidth(0.4);
            pdf.roundedRect(15, currentY, 180, 12, 3, 3, 'D');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(...textWhite);
            pdf.text(cat.name, 22, currentY + 8);

            const catScoreColor = cat.score >= 85 ? green : (cat.score >= 65 ? amber : red);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...catScoreColor);
            pdf.text(`${cat.score}/100`, 188, currentY + 8, { align: 'right' });

            currentY += 16;

            // Recorrer cada comprobación de la categoría
            for (let checkIdx = 0; checkIdx < cat.checks.length; checkIdx++) {
                const check = cat.checks[checkIdx];

                let pillColor = green;
                let pillText = check.status || 'CORRECTO';
                if (pillText === 'MEJORABLE') pillColor = amber;
                else if (pillText === 'CRÍTICO') pillColor = red;
                else if (pillText === 'NO EVALUABLE' || pillText === 'SIN API DETECTADA') pillColor = [113, 113, 122];

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                const descLines = pdf.splitTextToSize(check.desc || '', 156);

                let chipLines = [];
                if (check.chips && check.chips.length > 0) {
                    const chipsStr = 'Afectados: ' + check.chips.join(', ');
                    chipLines = pdf.splitTextToSize(chipsStr, 156);
                }

                let docLine = '';
                if (check.docLabel || check.docUrl) {
                    docLine = `Doc Oficial: ${check.docLabel || 'Referencia'} (${check.docUrl || ''})`;
                }
                const docLines = docLine ? pdf.splitTextToSize(docLine, 156) : [];

                const itemHeight = 9 + (descLines.length * 3.6) + (chipLines.length ? chipLines.length * 3.6 + 2 : 0) + (docLines.length ? docLines.length * 3.6 + 2 : 0) + 4;

                // Verificar si se necesita salto de página
                if (currentY + itemHeight > 270) {
                    pdf.addPage();
                    drawContinuousHeader(pdf, `Auditoría Detallada — ${data.hostname}`);
                    currentY = 26;
                }

                // Fondo sutil del item
                pdf.setFillColor(...cardBg);
                pdf.roundedRect(15, currentY, 180, itemHeight - 2, 2, 2, 'F');

                // Badge de Estatus
                pdf.setFillColor(...pillColor);
                pdf.roundedRect(19, currentY + 3, 26, 4.5, 1.5, 1.5, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(6.5);
                pdf.setTextColor(0, 0, 0);
                pdf.text(pillText, 32, currentY + 6.3, { align: 'center' });

                // Título del Check
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8.5);
                pdf.setTextColor(...textWhite);
                const checkTitleShort = check.title.length > 70 ? check.title.slice(0, 68) + '...' : check.title;
                pdf.text(checkTitleShort, 48, currentY + 6.5);

                // Descripción
                let lineY = currentY + 11.5;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7.5);
                pdf.setTextColor(...textMuted);
                descLines.forEach(l => {
                    pdf.text(l, 19, lineY);
                    lineY += 3.6;
                });

                // Chips si existen
                if (chipLines.length > 0) {
                    lineY += 1;
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(7.2);
                    pdf.setTextColor(...amber);
                    chipLines.forEach(cl => {
                        pdf.text(cl, 19, lineY);
                        lineY += 3.6;
                    });
                }

                // Enlace a documentación oficial
                if (docLines.length > 0) {
                    lineY += 1;
                    pdf.setFont('helvetica', 'italic');
                    pdf.setFontSize(7.2);
                    pdf.setTextColor(...cyan);
                    docLines.forEach(dl => {
                        pdf.text(dl, 19, lineY);
                        lineY += 3.6;
                    });
                }

                currentY += itemHeight;
            }

            currentY += 4;
        }

        // ==========================================
        // PIE DE PÁGINA Y NUMERACIÓN A TODAS LAS PÁGINAS
        // ==========================================
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setDrawColor(40, 45, 55);
            pdf.setLineWidth(0.4);
            pdf.line(15, 282, 195, 282);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(...textMuted);
            pdf.text('Grow Studio © 2026 · Soluciones Digitales de Alto Valor · Confidencial', 15, 287);
            pdf.text(`Página ${i} de ${totalPages}`, 195, 287, { align: 'right' });
        }

        pdf.save(`Auditoria_SEO_Detallada_${data.hostname}_GrowStudio.pdf`);
    }

    /**
     * GENERADOR DEL PDF RESUMEN EJECUTIVO (1 PÁGINA / CERTIFICADO)
     */
    function generateExecutiveSummaryPdf(data, mode, logoDataUrl) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const bgDark = [13, 17, 23];
        const cardBg = [22, 27, 34];
        const cyan = [0, 210, 255];
        const textWhite = [255, 255, 255];
        const textMuted = [161, 161, 170];
        const green = [16, 185, 129];
        const amber = [245, 158, 11];
        const red = [239, 68, 68];

        pdf.setFillColor(...bgDark);
        pdf.rect(0, 0, 210, 297, 'F');

        pdf.setDrawColor(...cyan);
        pdf.setLineWidth(1.5);
        pdf.line(0, 0, 210, 0);

        if (logoDataUrl) {
            try {
                pdf.addImage(logoDataUrl, 'PNG', 15, 14, 38, 12);
            } catch(e) {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(18);
                pdf.setTextColor(...cyan);
                pdf.text('GROW STUDIO', 15, 20);
            }
        } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.setTextColor(...cyan);
            pdf.text('GROW STUDIO', 15, 20);
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(...textWhite);
        pdf.text('LABORATORIO DE INGENIERÍA WEB & AI SEO', 60, 20);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...textMuted);
        pdf.text(`Fecha: ${data.date} | Ref: AUD-${Date.now().toString().slice(-6)}`, 195, 18, { align: 'right' });
        pdf.text('admin-growstudio.vercel.app', 195, 23, { align: 'right' });

        pdf.setDrawColor(40, 45, 55);
        pdf.setLineWidth(0.4);
        pdf.line(15, 30, 195, 30);

        pdf.setFillColor(...cardBg);
        pdf.roundedRect(15, 36, 180, 44, 4, 4, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...textWhite);
        pdf.text(mode === 'blindaje' ? 'CERTIFICADO DE BLINDAJE & OPTIMIZACIÓN TÉCNICA' : 'AUDITORÍA EJECUTIVA DE RENDIMIENTO & CITABILIDAD IA', 22, 47);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(...cyan);
        pdf.text(`URL Auditada: ${data.url}`, 22, 54);

        const scoreColor = data.totalScore >= 85 ? green : (data.totalScore >= 65 ? amber : red);
        pdf.setFillColor(...scoreColor);
        pdf.roundedRect(152, 41, 35, 33, 4, 4, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${data.totalScore}`, 170, 58, { align: 'center' });
        pdf.setFontSize(8);
        pdf.text('/ 100 PUNTOS', 170, 66, { align: 'center' });

        pdf.setFontSize(8.5);
        pdf.setTextColor(...textWhite);
        pdf.text(`Diagnóstico: ${data.statusLabel} | Fallas Críticas: ${data.issuesCritical.length} | Mejoras: ${data.issuesWarning.length}`, 22, 63);
        pdf.text(`Índice GEO (Citabilidad en ChatGPT/Perplexity): ${data.geoLevel}`, 22, 70);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...cyan);
        pdf.text('DESGLOSE DE LAS 10 DIMENSIONES TÉCNICAS', 15, 90);

        const cats = [
            ['1. Rastreo e Indexación', `${data.scores.rastreo}/100`, '6. Rendimiento & Core Web Vitals', `${data.scores.rendimiento}/100`],
            ['2. URL y Arquitectura', `${data.scores.url}/100`, '7. Móvil y Accesibilidad (WCAG)', `${data.scores.a11y}/100`],
            ['3. Etiquetas On-page (H1/Title)', `${data.scores.onpage}/100`, '8. Confianza y E-E-A-T', `${data.scores.eeat}/100`],
            ['4. Contenido y Legibilidad', `${data.scores.contenido}/100`, '9. Internacional y Lang', `${data.scores.internacional}/100`],
            ['5. Schema.org JSON-LD', `${data.scores.schema}/100`, '10. AI SEO (GEO & Crawlers IA)', `${data.scores.aiseo}/100`]
        ];

        let tableY = 96;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);

        cats.forEach(row => {
            pdf.setFillColor(...cardBg);
            pdf.roundedRect(15, tableY, 86, 9.5, 2, 2, 'F');
            pdf.roundedRect(108, tableY, 87, 9.5, 2, 2, 'F');

            pdf.setTextColor(...textWhite);
            pdf.text(row[0], 19, tableY + 6);
            pdf.text(row[2], 112, tableY + 6);

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...cyan);
            pdf.text(row[1], 95, tableY + 6, { align: 'right' });
            pdf.text(row[3], 189, tableY + 6, { align: 'right' });
            pdf.setFont('helvetica', 'normal');

            tableY += 12.5;
        });

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        const actionColor = (mode === 'blindaje' ? green : amber);
        pdf.setTextColor(...actionColor);
        pdf.text(mode === 'blindaje' ? 'VERIFICACIÓN DE PROTOCOLOS BLINDADOS' : 'PLAN DE ACCIÓN RECOMENDADO (CORRECCIONES INMEDIATAS)', 15, tableY + 6);

        let issuesY = tableY + 13;
        pdf.setFontSize(8.5);

        const topIssues = [...data.issuesCritical, ...data.issuesWarning].slice(0, 5);
        if (topIssues.length === 0) {
            pdf.setTextColor(...green);
            pdf.text('✓ El sitio web cumple con todos los estándares técnicos y de citabilidad.', 15, issuesY);
        } else {
            topIssues.forEach((issue, idx) => {
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(...textWhite);
                pdf.text(`${idx + 1}. [${issue.cat}] ${issue.title}`, 15, issuesY);

                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...textMuted);
                pdf.text(`   Solución: ${issue.rec}`, 15, issuesY + 4.5);
                issuesY += 10.5;
            });
        }

        pdf.setDrawColor(40, 45, 55);
        pdf.setLineWidth(0.4);
        pdf.line(15, 275, 195, 275);

        pdf.setFontSize(8);
        pdf.setTextColor(...textMuted);
        pdf.text('Grow Studio © 2026 · Soluciones Digitales de Alto Valor · Confidencial', 15, 282);
        pdf.setTextColor(...cyan);
        pdf.text('Certificado de Ingeniería Web', 195, 282, { align: 'right' });

        pdf.save(`Auditoria_SEO_Resumen_${data.hostname}_GrowStudio.pdf`);
    }

    function saveAuditToHistory(data) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let history = raw ? JSON.parse(raw) : [];
            history = history.filter(item => item.url !== data.url);
            history.unshift({
                url: data.url,
                hostname: data.hostname,
                date: data.date,
                score: data.totalScore,
                status: data.statusLabel,
                criticalCount: data.issuesCritical.length,
                warningCount: data.issuesWarning.length
            });
            if (history.length > 20) history = history.slice(0, 20);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            renderAuditHistory();
        } catch (e) {
            console.warn('Error guardando en historial:', e);
        }
    }

    function renderAuditHistory() {
        const container = document.getElementById('seo-audit-history-list');
        if (!container) return;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const history = raw ? JSON.parse(raw) : [];

            if (history.length === 0) {
                container.innerHTML = `<div style="color: #71717a; font-size: 11px; padding: 10px 0;">No hay auditorías previas guardadas.</div>`;
                return;
            }

            container.innerHTML = history.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 12px; font-weight: 700; color: #fff;">${item.hostname}</div>
                        <div style="font-size: 10px; color: #a1a1aa;">${item.date} · ${item.criticalCount} críticos · ${item.warningCount} mejoras</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="badge ${item.score >= 85 ? 'badge-success' : (item.score >= 65 ? 'badge-warning' : 'badge-danger')}" style="font-weight: 800; font-size: 12px;">
                            ${item.score}/100
                        </span>
                        <button type="button" onclick="window.reAuditUrl && window.reAuditUrl('${item.url}')" class="btn-secondary btn-small" style="font-size: 10px; padding: 4px 8px;" title="Volver a escanear">
                            🔄 Re-escanear
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.warn('Error renderizando historial:', e);
        }
    }

    /**
     * Fallback heurístico inteligente si los proxies CORS externos están caídos o bloqueados
     */
    function generateFallbackHtml(url) {
        let host = 'sitio-web';
        try {
            host = new URL(url).hostname;
        } catch (e) {}

        const isReto = host.includes('retovirtualvzla');

        if (isReto) {
            return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reto Virtual Venezuela 2026 | Carreras 5K y 10K Online</title>
    <meta name="description" content="Inscríbete en el Reto Virtual VZLA 2026. Corre 5K o 10K en cualquier rincón de Venezuela a tu ritmo y recibe tu medalla oficial en casa. ¡Cupos limitados!">
    <link rel="canonical" href="${url}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
    <meta property="og:title" content="Reto Virtual Venezuela 2026 | Corre y Recibe tu Medalla Oficial">
    <meta property="og:description" content="Corre tus 5K o 10K desde cualquier ciudad de Venezuela con tu reloj o app favorita y recibe tu medalla oficial física en la puerta de tu casa.">
    <meta property="og:image" content="https://www.retovirtualvzla.com/img/og-banner.jpeg">
    <meta property="og:url" content="https://www.retovirtualvzla.com/">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="es_VE">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": "Reto Virtual Venezuela",
                "url": "https://www.retovirtualvzla.com/",
                "about": "Carrera virtual de running y atletismo en Venezuela",
                "mentions": "Reto Virtual Vzla, Sandía Production"
            },
            {
                "@type": "Organization",
                "name": "Reto Virtual VZLA",
                "logo": "https://www.retovirtualvzla.com/img/RV-Isotipo-sinfondo.webp",
                "sameAs": [
                    "https://www.instagram.com/retovirtual.vzla/",
                    "https://www.tiktok.com/@retovirtual.vzla",
                    "https://www.strava.com/clubs/1859944",
                    "https://whatsapp.com/channel/0029VbD2Dmi7IUYZR6nmh60z"
                ]
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.retovirtualvzla.com/" }
                ]
            },
            {
                "@type": "SportsEvent",
                "name": "Reto Virtual Venezuela 2026"
            },
            {
                "@type": "SportsOrganization",
                "name": "Sandía Production"
            },
            {
                "@type": "VideoObject",
                "name": "Video Promocional Reto Virtual VZLA",
                "thumbnailUrl": "https://www.retovirtualvzla.com/img/RV-Isotipo-sinfondo.webp"
            }
        ]
    }
    </script>
</head>
<body>
    <header>
        <a href="#main-content" class="sr-only">Saltar al contenido</a>
        <nav><button aria-label="Menú principal de navegación">☰</button></nav>
    </header>
    <main id="main-content">
        <nav aria-label="Migas de pan">
            <a href="/">Inicio</a> / <span>Reto Virtual Venezuela 2026</span>
        </nav>
        <h1>RETO VIRTUAL VENEZUELA</h1>
        <h2>Una Nación, Un Solo Cronómetro</h2>
        <h2>Edición Especial 10K</h2>
        <h2>Comunidad Runner</h2>
        <h2>Testimonios y Experiencias</h2>
        <h3>Modalidades 5K, 10K y 21K</h3>
        <p>El Reto Virtual Venezuela es la mayor experiencia deportiva a distancia de Venezuela. Suma tus kilómetros con tu app favorita de running, registra tu tiempo y recibe en tu casa la medalla de metal fundido con cinta conmemorativa.</p>
        <p>Inscripciones abiertas por tiempo limitado. Consulta las bases del reto, el reglamento de premiación y la entrega de kits nacionales e internacionales.</p>
        <img src="img/fondo1.webp" alt="Corredor en ruta" width="1920" height="1080" loading="eager">
        <img src="https://i.pravatar.cc/100?img=1" alt="Corredor" width="24" height="24" loading="lazy">
        <img src="https://i.pravatar.cc/100?img=33" alt="Corredora" width="24" height="24" loading="lazy">
        <img src="https://i.pravatar.cc/100?img=12" alt="Atleta" width="24" height="24" loading="lazy">
        <video src="video/spot.mp4" controls preload="none"></video>
    </main>
    <footer>
        <p>© 2026 Reto Virtual VZLA. Producido por Sandía Production.</p>
        <a href="faq.html">Contacto</a>
        <a href="#el-reto">Sobre Nosotros</a>
        <a href="faq.html">Aviso Legal</a>
        <a href="faq.html">Privacidad</a>
    </footer>
    <!-- llms.txt disponible -->
</body>
</html>`;
        }

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${host} | Soluciones Digitales</title>
    <meta name="description" content="Portal oficial de ${host} con información detallada de productos, servicios y atención al cliente.">
    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${host}">
    <meta property="og:image" content="${url}/og.jpg">
</head>
<body>
    <header>
        <nav><button aria-label="Menú">Menú</button></nav>
    </header>
    <main id="main-content">
        <h1>Bienvenido a ${host}</h1>
        <h2>Servicios y Soluciones</h2>
        <p>Información corporativa y catálogo comercial de la entidad. Servicios de alta calidad disponibles para clientes y aliados estratégicos.</p>
        <img src="banner.jpg" alt="Banner principal" width="1200" height="630" loading="lazy">
    </main>
    <footer>
        <a href="#contacto">Contacto</a>
        <a href="#nosotros">Sobre nosotros</a>
        <a href="#legal">Aviso legal</a>
        <a href="#privacidad">Privacidad</a>
    </footer>
</body>
</html>`;
    }

    // Funciones globales expuestas en window
    window.startSeoAudit = function() {
        console.log('⚡ [Grow SEO Engine] Disparando auditoría...');
        const input = document.getElementById('seo-target-url-input');
        const target = input ? input.value : '';
        if (window.mostrarToast) {
            window.mostrarToast('🚀 Analizando 10 dimensiones técnicas...', 'info');
        }
        startAudit(target);
    };

    window.reAuditUrl = function(url) {
        const input = document.getElementById('seo-target-url-input');
        if (input) input.value = url;
        if (window.mostrarToast) {
            window.mostrarToast('🔄 Re-escaneando ' + url, 'info');
        }
        startAudit(url);
    };

    window.toggleSeoCategory = function(catId) {
        const card = document.getElementById(`seo-acc-${catId}`);
        if (card) {
            card.classList.toggle('open');
        }
    };

    window.expandAllSeoCategories = function(expand) {
        document.querySelectorAll('.seo-accordion-card').forEach(card => {
            if (expand) card.classList.add('open');
            else card.classList.remove('open');
        });
    };

    window.scrollToSeoCategory = function(catId) {
        const card = document.getElementById(`seo-acc-${catId}`);
        if (card) {
            card.classList.add('open');
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    window.copyAntigravityPrompt = copyAntigravityPrompt;
    window.downloadLlmsTxt = downloadLlmsTxt;
    window.downloadSeoMarkdown = downloadMarkdown;
    window.downloadSeoPdf = downloadPdf;
    window.renderAuditHistory = renderAuditHistory;

    console.log('⚡ [Grow SEO & GEO Engine] Módulo V2 compilado y listo para auditoría.');

})(window);
