# ==============================================================================
# 🚀 GROW STUDIO — RADAR SCRAPER MULTICANAL REAL (PYTHON)
# Rastreador de Leads en Vivo desde Reddit, RSS de Empleos y Twitter/X
# Sin APIs de pago: Lee feeds RSS y JSON públicos en tiempo real
# ==============================================================================

import urllib.request
import json
import xml.etree.ElementTree as ET
import time
import os
import re

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "live_leads.json")

# Feeds públicos de clientes buscando desarrollo web
SOURCES = [
    {
        "name": "Reddit r/forhire",
        "url": "https://www.reddit.com/r/forhire/new/.rss",
        "type": "rss"
    },
    {
        "name": "Reddit r/freelance_forhire",
        "url": "https://www.reddit.com/r/freelance_forhire/new/.rss",
        "type": "rss"
    }
]

KEYWORDS_CLIENTES = [
    "hiring", "looking for", "need a website", "need developer", "need web", 
    "busco diseñador", "busco programador", "landing page", "web design",
    "wordpress", "menu digital", "delivery", "qr", "frontend"
]

KEYWORDS_DESCARTAR = [
    "[for hire]", "for hire", "i am offering", "i am a developer", "freelancer available"
]

def limpiar_html(raw_html):
    clean = re.sub(r'<.*?>', '', raw_html)
    return clean.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').strip()

def estimar_presupuesto(texto):
    # Buscar patrones de dinero como $200, $500, 300$, €400, etc.
    match = re.search(r'(\$\s?\d{2,4}|\d{2,4}\s?\$|\€\s?\d{2,4})', texto)
    if match:
        return match.group(0).strip()
    return "$150 - $350 USD (Estimado)"

def calcular_temperatura(texto):
    texto_lower = texto.lower()
    urgente = any(u in texto_lower for u in ["urgent", "urgente", "asap", "inmediato", "today", "ready to pay"])
    tiene_presupuesto = bool(re.search(r'(\$|\€)\s?\d+', texto))
    
    if urgente or tiene_presupuesto:
        return 92, "FUEGO", "Alta (Inmediata)"
    return 80, "HOT", "Media"

def escanear_canales():
    print("📡 [GROW RADAR] Iniciando escaneo en canales globales...")
    leads_encontrados = []
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrowStudioBot/2.0'}

    for fuente in SOURCES:
        try:
            req = urllib.request.Request(fuente["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read()
                root = ET.fromstring(content)
                
                # Espacio de nombres de Atom / RSS
                ns = {'atom': 'http://www.w3.org/2005/Atom'}
                entries = root.findall('atom:entry', ns) or root.findall('.//item')

                for entry in entries[:15]:
                    title_elem = entry.find('atom:title', ns) if entry.find('atom:title', ns) is not None else entry.find('title')
                    content_elem = entry.find('atom:content', ns) if entry.find('atom:content', ns) is not None else entry.find('description')
                    author_elem = entry.find('atom:author/atom:name', ns) if entry.find('atom:author/atom:name', ns) is not None else entry.find('author')

                    titulo = title_elem.text if title_elem is not None else ""
                    contenido = limpiar_html(content_elem.text) if content_elem is not None else ""
                    autor = author_elem.text if author_elem is not None else "@usuario_prospecto"

                    texto_completo = f"{titulo} {contenido}"
                    texto_lower = texto_completo.lower()

                    # Comprobar si es un cliente real (Hiring) y no un freelancer vendiendo
                    es_descarte = any(d in texto_lower for d in KEYWORDS_DESCARTAR)
                    es_comprador = any(k in texto_lower for k in KEYWORDS_CLIENTES) or "[hiring]" in texto_lower

                    if es_comprador and not es_descarte:
                        score, badge, urgencia = calcular_temperatura(texto_completo)
                        presupuesto = estimar_presupuesto(texto_completo)
                        
                        lead = {
                            "id": "lead-" + str(int(time.time())) + "-" + str(len(leads_encontrados)),
                            "author": autor,
                            "platform": fuente["name"],
                            "lang": "es" if any(pal in texto_lower for pal in ["hola", "busco", "página", "necesito"]) else "en",
                            "langLabel": "Español 🇪🇸" if any(pal in texto_lower for pal in ["hola", "busco", "página", "necesito"]) else "English 🇺🇸",
                            "time": "En vivo (Canal directo)",
                            "score": score,
                            "badge": badge,
                            "budget": presupuesto,
                            "service": "Diseño Web / Landing",
                            "text": titulo[:160] + "...",
                            "urgency": urgencia,
                            "status": "NUEVO"
                        }
                        leads_encontrados.append(lead)

        except Exception as e:
            print(f"⚠️ Error escaneando {fuente['name']}: {e}")

    print(f"✅ [GROW RADAR] Escaneo finalizado. {len(leads_encontrados)} prospectos filtrados.")
    
    if leads_encontrados:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(leads_encontrados, f, ensure_ascii=False, indent=2)
        print(f"📁 Guardado en: {OUTPUT_FILE}")

if __name__ == "__main__":
    escanear_canales()
