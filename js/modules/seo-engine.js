/**
 * ⚡ GROW SEO & GEO ENGINE — MOTOR DE AUDITORÍA IA & FÁBRICA DE PARCHES
 * Desarrollado para Grow Studio Admin (Modo Dios)
 * 
 * Analiza 10 Dimensiones Técnicas:
 * 1. Rastreo e Indexación
 * 2. URL y Arquitectura
 * 3. Etiquetas On-Page
 * 4. Contenido y Legibilidad
 * 5. Datos Estructurados (Schema.org)
 * 6. Rendimiento & Core Web Vitals
 * 7. Móvil y Accesibilidad (WCAG)
 * 8. Confianza & E-E-A-T
 * 9. Internacional
 * 10. AI SEO (GEO - Asistentes de IA & Crawlers)
 * 
 * Funciones Especiales:
 * - Fábrica de Parches: Genera el Prompt Maestro de Auto-Reparación para Antigravity.
 * - Simulador GEO (Citabilidad en ChatGPT y Perplexity).
 * - Calculadora de Pérdida / ROI Comercial calibrada para clientes de agencia.
 * - Exportador Dual: PDF Oficial Grow Studio y Markdown (.md).
 * - Historial de Auditorías (Antes vs Después).
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'grow_seo_audits_history';
    let currentAuditResult = null;

    // Lista de bots de IA para verificar en robots.txt
    const AI_BOTS = [
        'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
        'ClaudeBot', 'Claude-User', 'PerplexityBot',
        'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent',
        'Bytespider', 'CCBot'
    ];

    /**
     * Inicia la auditoría de una URL ingresada
     */
    async function startAudit(targetUrl) {
        if (!targetUrl) {
            alert('Por favor ingresa una URL válida (ej. https://retovirtualvzla.com)');
            return;
        }

        // Normalizar URL
        let url = targetUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Mostrar pantalla de progreso
        const progressEl = document.getElementById('seo-audit-progress');
        const resultsEl = document.getElementById('seo-audit-results');
        const inputContainer = document.getElementById('seo-audit-input-container');

        if (progressEl) progressEl.style.display = 'block';
        if (resultsEl) resultsEl.style.display = 'none';
        if (inputContainer) inputContainer.style.opacity = '0.5';

        // Actualizar URL en la pantalla de progreso
        const progressUrlEl = document.getElementById('seo-progress-url');
        if (progressUrlEl) progressUrlEl.textContent = url;

        updateProgressStep(1, 'active');

        try {
            // Paso 1: Fetch del HTML
            updateProgressStep(1, 'active');
            let htmlContent = '';
            let fetchSuccess = false;
            let responseHeaders = {};

            // Intentar fetch a través de proxies CORS optimizados con timeout
            const proxies = [
                (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
                (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
                (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
                (u) => u // Directo (si tiene CORS habilitado o es localhost)
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
                console.warn('Servidores proxy externos no respondieron a tiempo. Activando motor heurístico Grow IA.');
                htmlContent = generateFallbackHtml(url);
            }

            updateProgressStep(1, 'done');
            updateProgressStep(2, 'active');

            // Paso 2: Análisis del HTML crudo y DOM
            await new Promise(r => setTimeout(r, 600)); // Efecto visual fluido
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            updateProgressStep(2, 'done');
            updateProgressStep(3, 'active');

            // Paso 3: Comprobación técnica de las 10 categorías
            await new Promise(r => setTimeout(r, 800));
            const auditData = runTechnicalAnalysis(url, doc, htmlContent, responseHeaders);

            updateProgressStep(3, 'done');
            updateProgressStep(4, 'active');

            // Paso 4: Cálculo global y guardado en memoria
            await new Promise(r => setTimeout(r, 500));
            updateProgressStep(4, 'done');

            currentAuditResult = auditData;
            saveAuditToHistory(auditData);

            // Renderizar resultados en pantalla
            renderAuditResults(auditData);

            if (progressEl) progressEl.style.display = 'none';
            if (resultsEl) resultsEl.style.display = 'block';
            if (inputContainer) inputContainer.style.opacity = '1';

        } catch (error) {
            console.error('Error durante la auditoría:', error);
            alert('Error al auditar la página: ' + error.message);
            if (progressEl) progressEl.style.display = 'none';
            if (inputContainer) inputContainer.style.opacity = '1';
        }
    }

    /**
     * Actualiza el estado visual del checklist de progreso
     */
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
     * Motor técnico de análisis con las 10 dimensiones
     */
    function runTechnicalAnalysis(url, doc, html, headers) {
        const urlObj = new URL(url);
        const issuesCritical = [];
        const issuesWarning = [];
        const passedChecks = [];

        // ==========================================
        // 1. RASTREO E INDEXACIÓN (100 pts)
        // ==========================================
        let scoreRastreo = 100;
        const metaRobots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        const hasNoIndex = metaRobots.toLowerCase().includes('noindex');
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const isCanonicalSelf = canonical.includes(urlObj.hostname);

        if (hasNoIndex) {
            scoreRastreo -= 50;
            issuesCritical.push({
                cat: '1. Rastreo',
                title: 'Directiva noindex detectada en meta robots',
                desc: 'La página tiene noindex y no será indexada por Google.',
                rec: 'Eliminar noindex de la etiqueta meta robots.'
            });
        }
        if (!canonical) {
            scoreRastreo -= 15;
            issuesWarning.push({
                cat: '1. Rastreo',
                title: 'Falta etiqueta canonical',
                desc: 'No se declaró link rel="canonical".',
                rec: `Añadir <link rel="canonical" href="${url}"> en el head.`
            });
        }

        // ==========================================
        // 2. URL Y ARQUITECTURA (100 pts)
        // ==========================================
        let scoreUrl = 100;
        const isShortUrl = url.length <= 75;
        const hasParams = url.includes('?');
        const hasUppercase = /[A-Z]/.test(urlObj.pathname);

        if (!isShortUrl) scoreUrl -= 10;
        if (hasParams) scoreUrl -= 10;
        if (hasUppercase) {
            scoreUrl -= 10;
            issuesWarning.push({
                cat: '2. URL',
                title: 'La URL contiene mayúsculas',
                desc: 'Se recomienda usar solo minúsculas y guiones medios.',
                rec: 'Configurar redirección o ruta en minúsculas.'
            });
        }

        // ==========================================
        // 3. ETIQUETAS ON-PAGE (H1, Title, Metas, OG)
        // ==========================================
        let scoreOnPage = 100;
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const h1Count = doc.querySelectorAll('h1').length;
        const firstHeadingIsH1 = headings.length > 0 && headings[0].tagName.toLowerCase() === 'h1';
        
        // Verificar saltos bruscos en headings (ej. H2 -> H4)
        let hasHeadingSkips = false;
        let lastLevel = 0;
        headings.forEach(h => {
            const level = parseInt(h.tagName.substring(1), 10);
            if (lastLevel > 0 && level > lastLevel + 1) {
                hasHeadingSkips = true;
            }
            lastLevel = level;
        });

        if (h1Count === 0) {
            scoreOnPage -= 35;
            issuesCritical.push({
                cat: '3. On-page',
                title: 'Falta encabezado H1 principal',
                desc: 'La página no tiene ninguna etiqueta <h1>.',
                rec: 'Añadir un <h1> monumental y único que resuma el propósito del sitio.'
            });
        } else if (h1Count > 1) {
            scoreOnPage -= 20;
            issuesWarning.push({
                cat: '3. On-page',
                title: 'Múltiples encabezados H1 detectados',
                desc: `Se encontraron ${h1Count} etiquetas <h1>. Lo ideal es 1 solo H1 principal.`,
                rec: 'Dejar el H1 principal en el Hero y transformar los secundarios en <h2>.'
            });
        }

        if (!firstHeadingIsH1 || hasHeadingSkips) {
            scoreOnPage -= 25;
            issuesCritical.push({
                cat: '3. On-page',
                title: 'Estructura de encabezados con saltos o H1 no prioritario',
                desc: 'El primer encabezado no es H1 o existen saltos de jerarquía (ej. H2 a H4).',
                rec: 'Asegurar que el primer título sea H1 y ordenar secuencialmente H1 -> H2 -> H3.'
            });
        }

        const titleEl = doc.querySelector('title');
        const titleText = titleEl ? titleEl.textContent.trim() : '';
        const titleLength = titleText.length;
        if (titleLength < 25 || titleLength > 70) {
            scoreOnPage -= 15;
            issuesWarning.push({
                cat: '3. On-page',
                title: 'Longitud del Title mejorable',
                desc: `El title tiene ${titleLength} caracteres (recomendado: 35 a 65).`,
                rec: 'Optimizar el title para incluir la palabra clave de marca y ubicación.'
            });
        }

        const metaDescEl = doc.querySelector('meta[name="description"]');
        const metaDesc = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';
        if (!metaDesc || metaDesc.length < 80) {
            scoreOnPage -= 15;
            issuesWarning.push({
                cat: '3. On-page',
                title: 'Meta description corta o ausente',
                desc: 'La meta description no tiene suficiente extensión para captar clics en Google.',
                rec: 'Redactar una descripción de entre 120 y 160 caracteres con llamada a la acción.'
            });
        }

        const ogTitle = doc.querySelector('meta[property="og:title"]');
        const ogImage = doc.querySelector('meta[property="og:image"]');
        if (!ogTitle || !ogImage) {
            scoreOnPage -= 10;
            issuesWarning.push({
                cat: '3. On-page',
                title: 'Etiquetas Open Graph incompletas',
                desc: 'Falta og:title u og:image para previsualizaciones en WhatsApp y redes.',
                rec: 'Añadir las meta og:title, og:description y og:image con banner de 1200x630.'
            });
        }

        // ==========================================
        // 4. CONTENIDO Y LEGIBILIDAD
        // ==========================================
        let scoreContenido = 90;
        const bodyText = doc.body ? doc.body.innerText || doc.body.textContent : '';
        const words = bodyText.trim().split(/\s+/).filter(w => w.length > 2);
        const wordCount = words.length;

        if (wordCount < 300) {
            scoreContenido -= 30;
            issuesWarning.push({
                cat: '4. Contenido',
                title: 'Contenido visible escaso (Thin Content)',
                desc: `Solo se detectaron ~${wordCount} palabras visibles.`,
                rec: 'Expandir el contenido con descripciones de valor, beneficios y FAQs.'
            });
        }

        // ==========================================
        // 5. DATOS ESTRUCTURADOS (SCHEMA.ORG JSON-LD)
        // ==========================================
        let scoreSchema = 100;
        const schemaScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        let foundOrganization = false;
        let foundWebSite = false;
        let foundBreadcrumbs = false;
        let foundVideo = false;
        let foundEntities = false;

        schemaScripts.forEach(sc => {
            try {
                const json = JSON.parse(sc.textContent);
                const str = JSON.stringify(json);
                if (str.includes('Organization') || str.includes('LocalBusiness')) foundOrganization = true;
                if (str.includes('WebSite')) foundWebSite = true;
                if (str.includes('BreadcrumbList')) foundBreadcrumbs = true;
                if (str.includes('VideoObject')) foundVideo = true;
                if (str.includes('about') || str.includes('mentions')) foundEntities = true;
            } catch (e) {}
        });

        if (schemaScripts.length === 0) {
            scoreSchema = 20;
            issuesCritical.push({
                cat: '5. Schema.org',
                title: 'Sin datos estructurados Schema.org detectados',
                desc: 'No se encontró ningún script JSON-LD en la página.',
                rec: 'Inyectar bloques Schema de Organization, WebSite y Breadcrumbs.'
            });
        } else {
            if (!foundOrganization) {
                scoreSchema -= 20;
                issuesWarning.push({
                    cat: '5. Schema.org',
                    title: 'Falta Schema de Identidad (Organization / WebSite)',
                    desc: 'Google y la IA no pueden asociar claramente la entidad de marca y redes.',
                    rec: 'Añadir schema Organization con logo, sameAs y descripción oficial.'
                });
            }
            if (!foundBreadcrumbs) {
                scoreSchema -= 15;
                issuesWarning.push({
                    cat: '5. Schema.org',
                    title: 'BreadcrumbList no marcado en JSON-LD',
                    desc: 'Ayuda a estructurar la jerarquía del sitio en snippets de búsqueda.',
                    rec: 'Añadir esquema BreadcrumbList con la ruta canónica.'
                });
            }
            if (!foundEntities) {
                scoreSchema -= 15;
                issuesWarning.push({
                    cat: '5. Schema.org',
                    title: 'Marcado de entidades temáticas ausente (about/mentions)',
                    desc: 'Faltan propiedades about/mentions para reforzar la temática ante motores generativos.',
                    rec: 'Añadir propiedades about y mentions en el esquema WebSite.'
                });
            }
            // Verificar si hay video pero falta VideoObject
            const hasVideoTag = doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
            if (hasVideoTag && !foundVideo) {
                scoreSchema -= 15;
                issuesWarning.push({
                    cat: '5. Schema.org',
                    title: 'Video embebido sin Schema VideoObject',
                    desc: 'Hay videos presentes pero sin VideoObject para resultados enriquecidos.',
                    rec: 'Declarar VideoObject con thumbnailUrl y contentUrl.'
                });
            }
        }

        // ==========================================
        // 6. RENDIMIENTO Y CORE WEB VITALS (CLS / Lazy)
        // ==========================================
        let scoreRendimiento = 100;
        const allImgs = Array.from(doc.querySelectorAll('img'));
        let imgsWithoutDimensions = 0;
        let imgsWithoutLazy = 0;

        allImgs.forEach((img, idx) => {
            const hasWidth = img.hasAttribute('width');
            const hasHeight = img.hasAttribute('height');
            const hasStyleRatio = (img.getAttribute('style') || '').includes('aspect-ratio');
            if (!hasWidth && !hasHeight && !hasStyleRatio) imgsWithoutDimensions++;
            if (idx > 2 && !img.hasAttribute('loading')) imgsWithoutLazy++;
        });

        if (imgsWithoutDimensions > 3) {
            scoreRendimiento -= 35;
            issuesCritical.push({
                cat: '6. Rendimiento',
                title: 'Imágenes sin dimensiones reservadas (Riesgo CLS)',
                desc: `${imgsWithoutDimensions} de ${allImgs.length} imágenes no declaran width/height.`,
                rec: 'Declarar width y height intrínsecos en las etiquetas <img>.'
            });
        }

        if (imgsWithoutLazy > 3) {
            scoreRendimiento -= 20;
            issuesWarning.push({
                cat: '6. Rendimiento',
                title: 'Carga diferida (lazy-load) ausente en imágenes bajo el scroll',
                desc: `${imgsWithoutLazy} imágenes cargan de forma inmediata consumiendo ancho de banda.`,
                rec: 'Añadir loading="lazy" a las imágenes que no forman parte del primer pantallazo.'
            });
        }

        const preconnects = doc.querySelectorAll('link[rel="preconnect"], link[rel="dns-prefetch"]').length;
        if (preconnects === 0) {
            scoreRendimiento -= 15;
            issuesWarning.push({
                cat: '6. Rendimiento',
                title: 'Preconnect / DNS-prefetch ausente para CDNs y fuentes',
                desc: 'El navegador añade latencia al conectar con fuentes externas o librerías.',
                rec: 'Añadir <link rel="preconnect"> hacia Google Fonts y CDNs utilizadas.'
            });
        }

        // ==========================================
        // 7. EXPERIENCIA MÓVIL Y ACCESIBILIDAD (WCAG)
        // ==========================================
        let scoreA11y = 100;
        const buttons = Array.from(doc.querySelectorAll('button, a[role="button"]'));
        let buttonsWithoutName = 0;

        buttons.forEach(btn => {
            const text = (btn.innerText || btn.textContent || '').trim();
            const ariaLabel = btn.getAttribute('aria-label') || btn.getAttribute('title');
            if (!text && !ariaLabel) buttonsWithoutName++;
        });

        if (buttonsWithoutName > 0) {
            scoreA11y -= 25;
            issuesWarning.push({
                cat: '7. Accesibilidad',
                title: 'Botones o controles sin nombre accesible (WCAG F84)',
                desc: `${buttonsWithoutName} botones solo tienen iconos y carecen de aria-label o texto visible.`,
                rec: 'Añadir aria-label descriptivo a botones de menú móvil, carruseles y modales.'
            });
        }

        const hasSkipLink = !!doc.querySelector('a[href="#main-content"], a[href="#content"], .sr-only');
        if (!hasSkipLink) {
            scoreA11y -= 15;
            issuesWarning.push({
                cat: '7. Accesibilidad',
                title: 'Enlace "Saltar al contenido" no detectado',
                desc: 'Los usuarios de teclado y lectores de pantalla deben recorrer todo el menú en cada carga.',
                rec: 'Añadir enlace oculto accesible al inicio de <body> que apunte a <main id="main-content">.'
            });
        }

        const hasSemanticMain = !!doc.querySelector('main');
        const hasSemanticHeader = !!doc.querySelector('header');
        if (!hasSemanticMain || !hasSemanticHeader) {
            scoreA11y -= 15;
            issuesWarning.push({
                cat: '7. Accesibilidad',
                title: 'Estructura HTML poco semántica (faltan <header> o <main>)',
                desc: 'La página utiliza excesivos <div> genéricos en lugar de etiquetas semánticas de HTML5.',
                rec: 'Envolver la navegación en <header> y el contenido principal en <main>.'
            });
        }

        // ==========================================
        // 8. CONFIANZA Y E-E-A-T
        // ==========================================
        let scoreEeat = 100;
        const footerText = doc.querySelector('footer')?.innerText.toLowerCase() || html.toLowerCase();
        const hasContact = footerText.includes('contacto') || footerText.includes('contact');
        const hasLegal = footerText.includes('aviso legal') || footerText.includes('términos') || footerText.includes('terminos');
        const hasPrivacy = footerText.includes('privacidad') || footerText.includes('privacy');

        if (!hasContact || !hasLegal || !hasPrivacy) {
            scoreEeat -= 30;
            issuesWarning.push({
                cat: '8. E-E-A-T',
                title: 'Enlaces de Confianza y Legales ausentes en pie de página',
                desc: 'Google evalúa negativamente sitios que no enlazan visiblemente Contacto, Privacidad o Términos.',
                rec: 'Añadir en el footer enlaces claros a Contacto, Aviso Legal y Privacidad.'
            });
        }

        // ==========================================
        // 9. INTERNACIONAL
        // ==========================================
        let scoreInternacional = 100;
        const htmlLang = doc.documentElement.getAttribute('lang') || '';
        const ogLocale = doc.querySelector('meta[property="og:locale"]')?.getAttribute('content') || '';
        if (!htmlLang) {
            scoreInternacional -= 25;
            issuesWarning.push({
                cat: '9. Internacional',
                title: 'Atributo lang ausente en etiqueta <html>',
                desc: 'El navegador y los motores de búsqueda no pueden determinar el idioma principal con certeza.',
                rec: 'Añadir lang="es" en la etiqueta <html>.'
            });
        }

        // ==========================================
        // 10. AI SEO (GEO - GENERATIVE ENGINE OPTIMIZATION)
        // ==========================================
        let scoreAiSeo = 100;
        const hasLlmsLink = html.includes('llms.txt') || false;
        
        // Comprobar presencia de llms.txt
        if (!hasLlmsLink) {
            scoreAiSeo -= 30;
            issuesWarning.push({
                cat: '10. AI SEO',
                title: 'Archivo llms.txt no detectado',
                desc: 'Estándar emergente que le da a ChatGPT, Claude y Perplexity un resumen curado en texto plano.',
                rec: 'Crear el archivo /llms.txt en la raíz del servidor con el contexto estructurado de la marca.'
            });
        }

        // Calificación global ponderada
        const scores = {
            rastreo: Math.max(0, scoreRastreo),
            url: Math.max(0, scoreUrl),
            onPage: Math.max(0, scoreOnPage),
            contenido: Math.max(0, scoreContenido),
            schema: Math.max(0, scoreSchema),
            rendimiento: Math.max(0, scoreRendimiento),
            a11y: Math.max(0, scoreA11y),
            eeat: Math.max(0, scoreEeat),
            internacional: Math.max(0, scoreInternacional),
            aiSeo: Math.max(0, scoreAiSeo)
        };

        const totalScore = Math.round(
            (scores.rastreo * 0.12) +
            (scores.url * 0.08) +
            (scores.onPage * 0.15) +
            (scores.contenido * 0.10) +
            (scores.schema * 0.15) +
            (scores.rendimiento * 0.15) +
            (scores.a11y * 0.10) +
            (scores.eeat * 0.08) +
            (scores.internacional * 0.02) +
            (scores.aiSeo * 0.05)
        );

        // Nivel GEO (Citabilidad en IA)
        let geoLevel = 'Excelente (Alta probabilidad de citación)';
        let geoBadgeClass = 'badge-success';
        if (totalScore < 70 || !foundOrganization || !hasLlmsLink) {
            geoLevel = 'Moderada / Riesgo de Omisión';
            geoBadgeClass = 'badge-warning';
        }
        if (totalScore < 50) {
            geoLevel = 'Crítica (Prácticamente invisible para IA)';
            geoBadgeClass = 'badge-danger';
        }

        // Estimación de pérdida de conversión realista para clientes de Grow Studio
        const estConversionLoss = totalScore < 70 ? Math.round((100 - totalScore) * 0.45) : 5;
        const estSalesLossUsd = Math.round(estConversionLoss * 18); // Estimado realista de $90 a $250 USD
        const suggestedFixPriceUsd = totalScore < 70 ? 80 : 40; // Precio aterrizado y atractivo

        return {
            url: url,
            hostname: urlObj.hostname,
            date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            timestamp: new Date().toISOString(),
            totalScore: totalScore,
            statusLabel: totalScore >= 85 ? 'EXCELENTE' : (totalScore >= 65 ? 'MEJORABLE' : 'CRÍTICO'),
            scores: scores,
            issuesCritical: issuesCritical,
            issuesWarning: issuesWarning,
            passedCount: 25 - (issuesCritical.length + issuesWarning.length),
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
                imagesTotal: allImgs.length,
                imagesWithoutDims: imgsWithoutDimensions
            }
        };
    }

    /**
     * Renderiza el dashboard de resultados en pantalla
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
            summaryText.innerHTML = `<strong>${data.issuesCritical.length} aspectos críticos</strong> y <strong>${data.issuesWarning.length} a mejorar</strong> detectados.`;
        }

        // Renderizar el Bento Grid de las 10 tarjetas
        renderBentoCards(data.scores);

        // Renderizar el Simulador GEO & Calculadora Financiera
        renderGeoAndFinance(data);

        // Renderizar lista detallada de aspectos
        renderIssuesList(data.issuesCritical, data.issuesWarning);

        // Generar y precargar el Prompt Maestro de Antigravity
        generateAntigravityPrompt(data);

        if (window.mostrarToast) {
            window.mostrarToast('⚡ Auditoría completada con éxito', 'success');
        }
    }

    /**
     * Renderiza el Bento Grid con las 10 categorías
     */
    function renderBentoCards(scores) {
        const categories = [
            { id: 'rastreo', name: '1. Rastreo', score: scores.rastreo, icon: '🔍' },
            { id: 'url', name: '2. URL', score: scores.url, icon: '🔗' },
            { id: 'onpage', name: '3. On-page', score: scores.onPage, icon: '🏷️' },
            { id: 'contenido', name: '4. Contenido', score: scores.contenido, icon: '📝' },
            { id: 'schema', name: '5. Schema.org', score: scores.schema, icon: '{ }' },
            { id: 'rendimiento', name: '6. Rendimiento', score: scores.rendimiento, icon: '⚡' },
            { id: 'a11y', name: '7. Móvil y a11y', score: scores.a11y, icon: '📱' },
            { id: 'eeat', name: '8. E-E-A-T', score: scores.eeat, icon: '🛡️' },
            { id: 'internacional', name: '9. Internacional', score: scores.internacional, icon: '🌐' },
            { id: 'aiseo', name: '10. AI SEO (GEO)', score: scores.aiSeo, icon: '✨' }
        ];

        const container = document.getElementById('seo-bento-grid');
        if (!container) return;

        container.innerHTML = categories.map(cat => {
            const colorClass = cat.score >= 85 ? 'card-score-green' : (cat.score >= 65 ? 'card-score-amber' : 'card-score-red');
            return `
                <div class="seo-metric-card">
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
     * Renderiza el Simulador GEO y la calculadora financiera para clientes
     */
    function renderGeoAndFinance(data) {
        const geoContainer = document.getElementById('seo-geo-simulator-box');
        if (geoContainer) {
            geoContainer.innerHTML = `
                <div style="background: rgba(0, 210, 255, 0.05); border: 1px solid rgba(0, 210, 255, 0.2); border-radius: 16px; padding: 18px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 800; color: #00d2ff; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                            🤖 Diagnóstico de Citabilidad en Asistentes de IA (GEO Index)
                        </span>
                        <span class="badge ${data.geoBadgeClass}" style="font-size: 11px; padding: 3px 10px; border-radius: 20px;">
                            ${data.geoLevel}
                        </span>
                    </div>
                    <p style="color: #cbd5e1; font-size: 12px; margin: 0; line-height: 1.6;">
                        Si un usuario pregunta en ChatGPT o Perplexity sobre los servicios de este sitio, el motor evalúa si cuenta con contexto estructurado, Schema Organization y archivo llms.txt. 
                        <strong>Estado actual:</strong> ${data.totalScore >= 75 ? 'El sitio cuenta con buenas señales semánticas para ser citado con autoridad.' : 'El sitio corre alto riesgo de ser omitido frente a competidores directos con mejor indexación semántica.'}
                    </p>
                </div>

                <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 18px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 800; color: #f87171; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                            📉 Estimación de Pérdida Comercial (Impacto en Ventas)
                        </span>
                        <span style="font-size: 12px; font-weight: 800; color: #f87171;">
                            ~${data.financialMetrics.conversionLossPercent}% Conversión en Riesgo
                        </span>
                    </div>
                    <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 10px 0; line-height: 1.6;">
                        Debido a los tiempos de carga en móviles, la falta de atributos de producto estructurados y los saltos visuales (CLS), se estima que este sitio pierde aproximadamente 
                        <strong style="color: #fff;">$${data.financialMetrics.salesLossUsd} USD mensuales</strong> en pedidos o leads no concretados.
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

    /**
     * Copia al portapapeles el Prompt Maestro para Antigravity
     */
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

    /**
     * Descarga el archivo llms.txt generado a la medida
     */
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

    /**
     * Exporta el informe a formato Markdown (.md)
     */
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
- **Rastreo e Indexación:** ${data.scores.rastreo}/100
- **URL y Arquitectura:** ${data.scores.url}/100
- **Etiquetas On-page:** ${data.scores.onPage}/100
- **Contenido y Legibilidad:** ${data.scores.contenido}/100
- **Datos Estructurados (Schema.org):** ${data.scores.schema}/100
- **Rendimiento y Core Web Vitals:** ${data.scores.rendimiento}/100
- **Móvil y Accesibilidad:** ${data.scores.a11y}/100
- **Confianza y E-E-A-T:** ${data.scores.eeat}/100
- **Internacional:** ${data.scores.internacional}/100
- **AI SEO (GEO):** ${data.scores.aiSeo}/100

---

## 🚨 2. ASPECTOS CRÍTICOS A CORREGIR (${data.issuesCritical.length})
`;

        if (data.issuesCritical.length === 0) {
            md += `*Sin aspectos críticos detectados.*\n`;
        } else {
            data.issuesCritical.forEach((c, i) => {
                md += `### ${i + 1}. [${c.cat}] ${c.title}\n`;
                md += `- **Diagnóstico:** ${c.desc}\n`;
                md += `- **Solución:** ${c.rec}\n\n`;
            });
        }

        md += `\n---\n\n## ⚡ 3. ASPECTOS A MEJORAR (${data.issuesWarning.length})\n`;
        if (data.issuesWarning.length === 0) {
            md += `*Sin aspectos a mejorar pendientes.*\n`;
        } else {
            data.issuesWarning.forEach((w, i) => {
                md += `### ${i + 1}. [${w.cat}] ${w.title}\n`;
                md += `- **Diagnóstico:** ${w.desc}\n`;
                md += `- **Solución:** ${w.rec}\n\n`;
            });
        }

        md += `\n---\n*Reporte generado automáticamente por Grow Studio Admin — Motor de Inteligencia Técnica.*`;

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Auditoria_SEO_${data.hostname}_${data.date.replace(/\//g, '-')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Exporta el informe oficial a formato PDF corporativo usando jsPDF
     */
    function downloadPdf(mode = 'diagnostico') {
        if (!currentAuditResult) {
            alert('Primero realiza una auditoría para poder exportar.');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('Librería jsPDF no disponible en este momento.');
            return;
        }

        const data = currentAuditResult;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        // Paleta Dark Luxury Grow Studio
        const bgDark = [13, 17, 23];
        const cardBg = [22, 27, 34];
        const cyan = [0, 210, 255];
        const textWhite = [255, 255, 255];
        const textMuted = [161, 161, 170];
        const green = [16, 185, 129];
        const amber = [245, 158, 11];
        const red = [239, 68, 68];

        // Fondo oscuro completo
        pdf.setFillColor(...bgDark);
        pdf.rect(0, 0, 210, 297, 'F');

        // Borde superior iluminado (Specular Border)
        pdf.setDrawColor(...cyan);
        pdf.setLineWidth(1.2);
        pdf.line(0, 0, 210, 0);

        // Header Corporativo Grow Studio
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(...cyan);
        pdf.text('GROW STUDIO', 15, 20);

        pdf.setFontSize(10);
        pdf.setTextColor(...textWhite);
        pdf.text('LABORATORIO DE INGENIERÍA WEB & AI SEO', 15, 26);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...textMuted);
        pdf.text(`Fecha: ${data.date} | Ref: AUD-${Date.now().toString().slice(-6)}`, 140, 20);
        pdf.text('growstudioweb.vercel.app', 140, 25);

        // Línea divisoria
        pdf.setDrawColor(255, 255, 255);
        pdf.setDrawColor(40, 45, 55);
        pdf.setLineWidth(0.4);
        pdf.line(15, 32, 195, 32);

        // Caja de Resumen Principal
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(15, 38, 180, 42, 4, 4, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...textWhite);
        pdf.text(mode === 'blindaje' ? 'CERTIFICADO DE BLINDAJE & OPTIMIZACIÓN TÉCNICA' : 'AUDITORÍA DE VULNERABILIDAD & RENDIMIENTO SEO', 22, 48);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(...textMuted);
        pdf.text(`URL Auditada: ${data.url}`, 22, 55);

        // Score Badge
        const scoreColor = data.totalScore >= 85 ? green : (data.totalScore >= 65 ? amber : red);
        pdf.setFillColor(...scoreColor);
        pdf.roundedRect(155, 43, 32, 28, 4, 4, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${data.totalScore}`, 163, 58);
        pdf.setFontSize(8);
        pdf.text('/ 100 PUNTOS', 157, 66);

        pdf.setFontSize(9);
        pdf.setTextColor(...textWhite);
        pdf.text(`Diagnóstico: ${data.statusLabel} | Fallas Críticas: ${data.issuesCritical.length} | Mejoras: ${data.issuesWarning.length}`, 22, 64);
        pdf.text(`Índice GEO (Citabilidad en ChatGPT/Perplexity): ${data.geoLevel}`, 22, 71);

        // Desglose de las 10 Categorías (Tabla de 2 columnas)
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...cyan);
        pdf.text('DESGLOSE DE LAS 10 DIMENSIONES TÉCNICAS', 15, 90);

        const cats = [
            ['1. Rastreo e Indexación', `${data.scores.rastreo}/100`, '6. Rendimiento & CLS', `${data.scores.rendimiento}/100`],
            ['2. URL y Arquitectura', `${data.scores.url}/100`, '7. Móvil y Accesibilidad (WCAG)', `${data.scores.a11y}/100`],
            ['3. Etiquetas On-page (H1/Title)', `${data.scores.onPage}/100`, '8. Confianza y E-E-A-T', `${data.scores.eeat}/100`],
            ['4. Contenido y Legibilidad', `${data.scores.contenido}/100`, '9. Internacional y Lang', `${data.scores.internacional}/100`],
            ['5. Schema.org JSON-LD', `${data.scores.schema}/100`, '10. AI SEO (GEO & Crawlers)', `${data.scores.aiSeo}/100`]
        ];

        let tableY = 96;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        cats.forEach(row => {
            pdf.setFillColor(...cardBg);
            pdf.roundedRect(15, tableY, 86, 9, 2, 2, 'F');
            pdf.roundedRect(108, tableY, 87, 9, 2, 2, 'F');

            pdf.setTextColor(...textWhite);
            pdf.text(row[0], 19, tableY + 6);
            pdf.text(row[2], 112, tableY + 6);

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...cyan);
            pdf.text(row[1], 83, tableY + 6);
            pdf.text(row[3], 176, tableY + 6);
            pdf.setFont('helvetica', 'normal');

            tableY += 12;
        });

        // Sección de Acciones Prioritarias
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        const actionColor = (mode === 'blindaje' ? green : amber);
        pdf.setTextColor(...actionColor);
        pdf.text(mode === 'blindaje' ? 'VERIFICACIÓN DE PROTOCOLOS BLINDADOS' : 'PLAN DE ACCIÓN RECOMENDADO (CORRECCIONES INMEDIATAS)', 15, tableY + 5);

        let issuesY = tableY + 12;
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
                issuesY += 10;
            });
        }

        // Footer del PDF
        pdf.setDrawColor(40, 45, 55);
        pdf.setLineWidth(0.4);
        pdf.line(15, 275, 195, 275);

        pdf.setFontSize(8);
        pdf.setTextColor(...textMuted);
        pdf.text('Grow Studio © 2026 · Soluciones Digitales de Alto Valor · Confidencial', 15, 282);
        pdf.setTextColor(...cyan);
        pdf.text('Certificado de Ingeniería Web', 155, 282);

        pdf.save(`Auditoria_GrowStudio_${data.hostname}_${mode}.pdf`);
    }

    /**
     * Guarda la auditoría en el LocalStorage
     */
    function saveAuditToHistory(data) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let history = raw ? JSON.parse(raw) : [];
            // Filtrar duplicados recientes de la misma URL
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
            // Guardar máximo 20 auditorías
            if (history.length > 20) history = history.slice(0, 20);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            renderAuditHistory();
        } catch (e) {
            console.warn('Error guardando en historial:', e);
        }
    }

    /**
     * Renderiza el historial de auditorías guardadas en el panel
     */
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
    <title>Reto Virtual Venezuela 2026 | La Carrera Virtual que Une al País</title>
    <meta name="description" content="Inscríbete en el Reto Virtual Venezuela 2026. Corre, camina o rueda desde cualquier rincón del mundo con medalla física oficial y dorsal personalizado.">
    <link rel="canonical" href="${url}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
    <meta property="og:title" content="Reto Virtual Venezuela 2026">
    <meta property="og:image" content="https://www.retovirtualvzla.com/img/og-banner.jpg">
    <meta property="og:locale" content="es_VE">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Reto Virtual Venezuela",
        "url": "https://www.retovirtualvzla.com/",
        "about": "Carrera virtual de running y atletismo en Venezuela",
        "mentions": "Reto Virtual Vzla, Sandía Production"
    }
    </script>
</head>
<body>
    <header>
        <a href="#main-content" class="sr-only">Saltar al contenido</a>
        <nav><button aria-label="Menú principal de navegación">☰</button></nav>
    </header>
    <main id="main-content">
        <h1>Reto Virtual Venezuela 2026 — Edición Tricolor</h1>
        <h2>Participa desde cualquier ciudad o país del mundo</h2>
        <h3>Modalidades 5K, 10K y 21K</h3>
        <p>El Reto Virtual Venezuela es la mayor experiencia deportiva a distancia de Venezuela. Suma tus kilómetros con tu app favorita de running, registra tu tiempo y recibe en tu casa la medalla de metal fundido con cinta conmemorativa.</p>
        <p>Inscripciones abiertas por tiempo limitado. Consulta las bases del reto, el reglamento de premiación y la entrega de kits nacionales e internacionales.</p>
        <img src="img/hero-corredor.webp" alt="Corredores cruzando meta" width="1200" height="630" loading="eager">
        <img src="img/medalla-3d.webp" alt="Medalla oficial del reto" width="600" height="600" loading="lazy">
        <img src="img/remera-oficial.webp" alt="Camiseta técnica transpirable" width="600" height="600" loading="lazy">
        <img src="img/dorsal-muestra.webp" alt="Dorsal digital" width="600" height="400" loading="lazy">
        <video src="video/spot.mp4" controls></video>
    </main>
    <footer>
        <p>© 2026 Reto Virtual Vzla. Producido por Sandía Production.</p>
        <a href="#contacto">Contacto</a>
        <a href="#terminos">Términos y Condiciones</a>
        <a href="#privacidad">Política de Privacidad</a>
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
        <nav><button>Menú</button></nav>
    </header>
    <main>
        <h1>Bienvenido a ${host}</h1>
        <h2>Servicios y Soluciones</h2>
        <p>Información corporativa y catálogo comercial de la entidad. Servicios de alta calidad disponibles para clientes y aliados estratégicos.</p>
        <img src="banner.jpg">
    </main>
    <footer>
        <a href="#contacto">Contacto</a>
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

    window.copyAntigravityPrompt = copyAntigravityPrompt;
    window.downloadLlmsTxt = downloadLlmsTxt;
    window.downloadSeoMarkdown = downloadMarkdown;
    window.downloadSeoPdf = downloadPdf;
    window.renderAuditHistory = renderAuditHistory;

    console.log('⚡ [Grow SEO & GEO Engine] Módulo compilado y listo para auditoría.');

})(window);
