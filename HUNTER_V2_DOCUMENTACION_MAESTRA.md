# 🚀 HUNTER V2 HUB — DOCUMENTACIÓN TÉCNICA MAESTRA & DOSSIER DE REPOSITORIOS

Este documento recopila la **arquitectura completa, fuentes de código abierto extraídas de GitHub, lógica de negocio y estado operativo** de **Hunter V2 Hub**. Está diseñado para exportarse y transferirse directamente a cualquier nueva sesión de desarrollo sin perder contexto.

---

## 📌 1. FICHA GENERAL DEL SISTEMA

* **Nombre del Módulo:** Hunter V2 Hub (Standalone Engine).
* **Propósito:** Motor automatizado de prospección y extracción de leads calificados de alto valor para bolsa inmobiliaria, compra de propiedades y fondos de inversión en Portugal y sur de Europa.
* **Modelo Dual:**
  * **B2C (Compradores e Inversores Directos):** Extracción de hilos y personas reales con intención activa de compra o evaluación de hipoteca.
  * **B2B (Brokers, Despachos y Agencias de Reubicación):** Directorio de firmas internacionales en Londres, Lisboa y EE.UU. que canalizan compradores con capital.
* **Entorno de Despliegue:** Vercel Serverless Functions + Frontend Vanilla JS modular.
* **Almacenamiento Aislado:** `localStorage['hunter_v2_leads_standalone_db']` (completamente separado del panel de Grow Studio).

---

## 📚 2. REPOSITORIOS DE GITHUB CITADOS Y CÓDIGO EXTRAÍDO

Para garantizar que el software sea robusto, libre de datos simulados y con estándares de la industria, se adaptaron e integraron 4 arquitecturas probadas de código abierto en GitHub:

### 1. 📡 [HasData Social Listening Tool](https://github.com/HasData/social-listening-tool) (`HasData/social-listening-tool`)
* **Repositorio oficial:** `https://github.com/HasData/social-listening-tool`
* **Licencia / Acceso:** Código abierto (Open Source).
* **Lógica extraída e integrada:**
  * **Reglas Booleanas Estrictas de Intención:** Se implementó el filtrado de doble factor. Para que un post sea admitido, debe contener obligatoriamente:
    1. *Verbo de Adquisición/Capital:* `buy`, `buying`, `purchase`, `invest`, `mortgage`, `financing`, `cash buyer`, `down payment`.
    2. *Activo Inmobiliario Obligatorio:* `property`, `house`, `apartment`, `villa`, `real estate`, `distressed asset`.
  * **Filtro Anti-Ruido Negativo:** Regla de descarte que elimina automáticamente publicaciones sobre alquileres temporales, habitaciones compartidas, quejas o visas sin intención de compra (`rental`, `renting`, `room to rent`, `housemate`, `flatmate`, `lease agreement`, `sublet`).
  * **Normalizador de Presupuestos:** Extracción de patrones numéricos (`€450,000`, `500k`, `€1.2M`) para categorizar el ticket.

### 2. 🎯 [Scout](https://github.com/kiryano/Scout) (`kiryano/Scout`)
* **Repositorio oficial:** `https://github.com/kiryano/Scout`
* **Licencia / Acceso:** Código abierto (Open Source).
* **Lógica extraída e integrada:**
  * **Algoritmo de Lead Scoring Ponderado (0 a 100):** Se integró la fórmula de calificación matemática:
    * Base calificada por intención de compra y activo: `65 pts`.
    * Presupuesto explícito detectado en el texto: `+18 pts`.
    * Perfil de inversor / patrimonio / villa: `+10 pts`.
    * Frescura temporal (publicado en las últimas 24 horas): `+7 pts`.
  * **Extractor Regex de Contactos Directos:** Escaneo del cuerpo del post para identificar correos electrónicos (`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`) y números telefónicos internacionales (`(?:\+|00)[1-9]...`).

### 3. ✉️ [OpenOutreach](https://github.com/eracle/OpenOutreach) (`eracle/OpenOutreach`)
* **Repositorio oficial:** `https://github.com/eracle/OpenOutreach`
* **Licencia / Acceso:** Código abierto (Open Source / Self-Hosted AI Agent).
* **Lógica extraída e integrada:**
  * **Generador de Cold Outreach Bilingüe:** Sistema que toma los metadatos del lead (`usuario`, `intención`, `presupuesto`) y genera instantáneamente un mensaje formal adaptado con estándar de negocios en 2 idiomas:
    1. *🇬🇧 Inglés Profesional (UK / International Standard):* Enfocado en portafolio off-market, asistencia bancaria para extranjeros y verificación jurídica de títulos.
    2. *🇵🇹 Português Profissional (Padrão de Negócios):* Redacción nativa corporativa para compradores de habla portuguesa o despachos locales.
  * **Botones de Copiado Rápido:** Copia al portapapeles en 1 clic para enviar por Reddit DM, LinkedIn o correo.

### 4. 🏢 [GhostMap](https://github.com/uppifyagency/ghostmap) (`uppifyagency/ghostmap`)
* **Repositorio oficial:** `https://github.com/uppifyagency/ghostmap`
* **Licencia / Acceso:** Código abierto (Open Source).
* **Lógica extraída e integrada:**
  * **Arquitectura de Base de Datos B2B:** Estructura de entidades comerciales para alianzas estratégicas:
    * Campos: `Firma / Broker B2B`, `Especialidad & Alcance`, `Sede / País`, `Sitio Web Oficial`, `Teléfono / WhatsApp Directo`, `Email Corporativo` y `Score de Alianza`.
  * **Exportador CRM Dual:** Descarga independiente de hojas de cálculo (CSV) adaptadas para importarse en HubSpot, Salesforce o entregarse directamente al equipo comercial.

---

## 🏗️ 3. ARQUITECTURA DE ARCHIVOS IMPLEMENTADOS

### 1. Backend Serverless: `Grow Studio Admin/api/v2-leads.js`
* **Función:** Conexión y parseo en vivo de feeds Atom/RSS de comunidades internacionales.
* **Comunidades consultadas en paralelo:**
  * `r/PortugalExpats` (comunidad central de compradores y residentes extranjeros).
  * `r/eupersonalfinance` (inversores de capital y patrimonio en Europa).
  * `r/expats` (compradores globales con reubicación).
  * `r/IWantOut` (familias y profesionales con capital de compra).
* **Filtro Geográfico:** En las comunidades globales, solo admite publicaciones que mencionen explícitamente Portugal o zonas clave (`Lisboa`, `Oporto`, `Algarve`, `Cascais`, `Silver Coast`, `Sur de Europa`).
* **Blindaje:** Cero perfiles sintéticos o simulados. Caché en memoria de 60 segundos para evitar bloqueos por tasa de petición (error 429).

### 2. Frontend Motor: `Grow Studio Admin/js/modules/hunter-v2-engine.js`
* **Clase `HunterEngineV2`:**
  * Gestión de pestañas (`B2C` Compradores vs `B2B` Red de Brokers).
  * Motor de **Auto-Rastreo Continuo** (bucle cada 15 segundos con botón de pausa).
  * Renderizado reactivo con tabla estilizada, KPIs de capital estimado y badge de Score.
  * Modal interactivo de **OpenOutreach** con generación de mensajes en inglés y portugués.
  * Exportador CSV dual (`descargarCsv`).

### 3. Pantalla y Modal: `Grow Studio Admin/index.html`
* **Sección `#hunter-v2-screen`:** Pantalla independiente oculta del menú principal, accesible mediante el botón `⚡ Modo Hunter V2` en la cabecera.
* **Modal `#modal-v2-outreach`:** Ventana emergente con campos de texto para copiar el mensaje en inglés o portugués.

---

## 💼 4. GUÍA RÁPIDA DE OPERACIÓN

1. **Para buscar compradores directos (B2C):**
   * Estar en la pestaña `🎯 Compradores Directos (B2C)`.
   * Presionar **`⚡ Extraer Compradores V2`** o activar **`▶️ Auto-Rastreo Continuo`**.
   * Hacer clic en el nombre del usuario para ver su perfil, en **`🔗 Post`** para leer su consulta en Reddit, en **`💬 Contactar`** para abrir su buzón de mensajes privados, o en **`✉️ Pitch IA`** para copiar el mensaje bilingüe listo para enviar.
2. **Para contactar despachos y brokers de capital (B2B):**
   * Cambiar a la pestaña `🏢 Red de Brokers y Agencias (B2B)`.
   * Visualizar firmas como *Blacktower Financial Management*, *Blevins Franks*, *Sovereign Group* o *Chamberlains*.
   * Usar los botones directos de correo corporativo, teléfono o web oficial para proponer alianzas y captar sus clientes extranjeros.
3. **Para entregar al equipo de ventas:**
   * Presionar **`📊 Exportar CSV / CRM`** para descargar el archivo Excel limpio.

---

## 🔒 5. HISTORIAL DE COMMITS EN PRODUCCIÓN (REPOSITORIO GITHUB)

* **`ccdf452`**: Creación inicial de la pantalla y módulo aislado `Hunter V2 Hub`.
* **`9a8faa7`**: Incorporación del botón de auto-rastreo continuo en bucle cada 15s.
* **`1a31f14`**: Purga total de datos simulados y migración al parser nativo de feeds Atom/RSS en vivo.
* **`26e9fa4`**: Integración de los 4 repositorios de GitHub (HasData, Scout, OpenOutreach y GhostMap).
* **`64e6636`**: Expansión multi-comunidad paralela (`r/PortugalExpats`, `r/eupersonalfinance`, `r/expats`, `r/IWantOut`).
