import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, setDoc, query, orderBy } from "./firebase-init.js";

// Lista predefinida de imágenes de Sandía Production
export const sandiaImagesList = [
    "10kparaguana2026.png",
    "7maCarreraInfantilNewGeneration.png",
    "Chinita10K2026.png",
    "Copaiba10K2026.png",
    "Isotipo.png",
    "Logo.png",
    "Logo1.png",
    "banner_horiz_horror.jpeg",
    "bicolor10k2026.png",
    "caricatura.png",
    "chirimenaextrema15ksep27.png",
    "coffee_run.png",
    "madremia.jpg",
    "matea_run.png",
    "paraguanahorror.jpeg",
    "paraguanahorror_50cupos.jpg",
    "paraguanahorror_agotada.jpg",
    "runfree.png",
    "runfreelogo.png",
    "runmusicfest.png",
    "teamfslogo1.png",
    "trailbotanico2026.png"
];

let unsubscribeEventos = null;
let unsubscribeAliados = null;
let unsubscribeCupones = null;
let currentEventId = null;
let currentAliadoId = null;

// Función para resolver rutas de imágenes sin romper el entorno ni entrar en loops
export function resolveSandiaImgPath(img) {
    if (!img || typeof img !== 'string') return 'https://www.sandiaproduction.com/img/Isotipo.png';
    const trimmed = img.trim();
    if (!trimmed) return 'https://www.sandiaproduction.com/img/Isotipo.png';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        return trimmed;
    }
    const clean = trimmed.replace(/^img\//, '').replace(/^\.\.\/Sandia Production\/img\//, '');
    
    // Si estamos corriendo en un servidor local (localhost / 127.0.0.1) o en la nube (Vercel)
    // donde ../Sandia Production/ no es accesible por el navegador, usar la URL oficial en vivo
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        return `https://www.sandiaproduction.com/img/${clean}`;
    }
    // Si se abre directo como archivo local file:///
    return `../Sandia Production/img/${clean}`;
}

function previewImage(previewEl, imageVal) {
    if (!previewEl) return;
    if (!imageVal) {
        previewEl.style.display = 'none';
        return;
    }
    previewEl.onerror = () => {
        previewEl.onerror = null;
        previewEl.src = 'img/growisotipo.png';
    };
    previewEl.src = resolveSandiaImgPath(imageVal);
    previewEl.style.display = 'block';
}

// Inicializador del Módulo
export function initSandiaAdmin() {
    window.openSandiaScreen = function() {
        const btnNavSandia = document.getElementById('btn-nav-sandia');
        const sandiaScreen = document.getElementById('sandia-screen');
        
        document.querySelectorAll('#dashboard-screen > main > section').forEach(sec => sec.style.display = 'none');
        document.querySelectorAll('.menu-btn, .menu-list li').forEach(el => el.classList.remove('active'));
        
        if (btnNavSandia) btnNavSandia.classList.add('active');
        if (sandiaScreen) {
            sandiaScreen.style.display = 'flex';
            loadSandiaData();
        }
        if (typeof window.cerrarSidebarMobile === 'function') {
            window.cerrarSidebarMobile();
        }
    };

    const btnNavSandia = document.getElementById('btn-nav-sandia');
    if (btnNavSandia) {
        btnNavSandia.addEventListener('click', window.openSandiaScreen);
    }

    initSandiaConfig();

    // Modal Crear/Editar Evento
    const btnNewEvent = document.getElementById('btn-new-sandia-event');
    const modalEvent = document.getElementById('modal-sandia-event');
    const btnCloseEventModal = document.getElementById('btn-close-sandia-event');
    const formEvent = document.getElementById('form-sandia-event');
    const selectEventImg = document.getElementById('sandia-event-img-select');
    const customEventImg = document.getElementById('sandia-event-custom-img');
    const eventImgPreview = document.getElementById('sandia-event-img-preview');

    // Poblar Selector de Imágenes de Eventos
    if (selectEventImg) {
        selectEventImg.innerHTML = '<option value="">-- Selecciona una imagen de img/ --</option>' + 
            sandiaImagesList.map(img => `<option value="${img}">${img}</option>`).join('');
        
        selectEventImg.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
                if (customEventImg) customEventImg.value = '';
                previewImage(eventImgPreview, val);
            } else if (customEventImg && customEventImg.value.trim()) {
                previewImage(eventImgPreview, customEventImg.value.trim());
            } else {
                eventImgPreview.style.display = 'none';
            }
        });
    }

    if (customEventImg) {
        customEventImg.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) {
                if (selectEventImg) selectEventImg.value = '';
                previewImage(eventImgPreview, val);
            } else if (selectEventImg && selectEventImg.value) {
                previewImage(eventImgPreview, selectEventImg.value);
            } else {
                eventImgPreview.style.display = 'none';
            }
        });
    }

    if (btnNewEvent) {
        btnNewEvent.addEventListener('click', () => {
            currentEventId = null;
            if (formEvent) formEvent.reset();
            const titleEl = document.getElementById('sandia-modal-title');
            if (titleEl) titleEl.innerText = "🏆 Nuevo Evento Deportivo";
            if (eventImgPreview) eventImgPreview.style.display = 'none';
            if (modalEvent) modalEvent.style.display = 'flex';
        });
    }

    if (btnCloseEventModal) {
        btnCloseEventModal.addEventListener('click', () => {
            if (modalEvent) modalEvent.style.display = 'none';
        });
    }

    if (formEvent) {
        formEvent.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formEvent.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Guardando...";

            const eventData = {
                titulo: document.getElementById('sandia-event-titulo').value.trim(),
                dia: document.getElementById('sandia-event-dia').value.trim(),
                mes: document.getElementById('sandia-event-mes').value.trim().toUpperCase(),
                ubicacion: document.getElementById('sandia-event-ubicacion').value.trim(),
                categoria: document.getElementById('sandia-event-categoria').value,
                enlace: document.getElementById('sandia-event-enlace').value.trim(),
                textoBoton: document.getElementById('sandia-event-boton-texto').value.trim() || "Inscribirme Ahora",
                imagen: document.getElementById('sandia-event-img-select').value || (document.getElementById('sandia-event-custom-img') ? document.getElementById('sandia-event-custom-img').value.trim() : "") || "Isotipo.png",
                estado: document.getElementById('sandia-event-estado').value, // 'ACTIVO', 'COMPLETADO', 'OCULTO'
                destacado_index: document.getElementById('sandia-event-destacado').checked,
                fechaActualizacion: new Date().toISOString()
            };

            try {
                if (currentEventId) {
                    await updateDoc(doc(db, "sandia_eventos", currentEventId), eventData);
                } else {
                    eventData.fechaCreacion = new Date().toISOString();
                    await addDoc(collection(db, "sandia_eventos"), eventData);
                }
                modalEvent.style.display = 'none';
                formEvent.reset();
            } catch (err) {
                console.error("Error al guardar evento:", err);
                alert("Error al guardar evento: " + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Guardar Evento";
            }
        });
    }

    // Modal Aliados
    const btnNewAliado = document.getElementById('btn-new-sandia-aliado');
    const modalAliado = document.getElementById('modal-sandia-aliado');
    const btnCloseAliadoModal = document.getElementById('btn-close-sandia-aliado');
    const formAliado = document.getElementById('form-sandia-aliado');
    const selectAliadoImg = document.getElementById('sandia-aliado-img-select');
    const customAliadoImg = document.getElementById('sandia-aliado-custom-img');
    const aliadoImgPreview = document.getElementById('sandia-aliado-img-preview');
    const btnSeedData = document.getElementById('btn-seed-sandia-data');

    // Poblar Selector de Imágenes de Aliados
    if (selectAliadoImg) {
        selectAliadoImg.innerHTML = '<option value="">-- Selecciona un logo de img/ --</option>' + 
            sandiaImagesList.map(img => `<option value="${img}">${img}</option>`).join('');
        
        selectAliadoImg.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
                if (customAliadoImg) customAliadoImg.value = '';
                previewImage(aliadoImgPreview, val);
            } else if (customAliadoImg && customAliadoImg.value.trim()) {
                previewImage(aliadoImgPreview, customAliadoImg.value.trim());
            } else {
                aliadoImgPreview.style.display = 'none';
            }
        });
    }

    if (customAliadoImg) {
        customAliadoImg.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) {
                if (selectAliadoImg) selectAliadoImg.value = '';
                previewImage(aliadoImgPreview, val);
            } else if (selectAliadoImg && selectAliadoImg.value) {
                previewImage(aliadoImgPreview, selectAliadoImg.value);
            } else {
                aliadoImgPreview.style.display = 'none';
            }
        });
    }

    if (btnNewAliado) {
        btnNewAliado.addEventListener('click', () => {
            currentAliadoId = null;
            if (formAliado) formAliado.reset();
            const titleAliado = document.getElementById('sandia-aliado-modal-title');
            if (titleAliado) titleAliado.innerText = "🤝 Nuevo Aliado Comercial";
            if (aliadoImgPreview) aliadoImgPreview.style.display = 'none';
            if (modalAliado) modalAliado.style.display = 'flex';
        });
    }

    if (btnCloseAliadoModal) {
        btnCloseAliadoModal.addEventListener('click', () => {
            if (modalAliado) modalAliado.style.display = 'none';
        });
    }

    if (formAliado) {
        formAliado.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formAliado.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Guardando...";

            const nombre = document.getElementById('sandia-aliado-nombre').value.trim();
            const imagen = (selectAliadoImg && selectAliadoImg.value) || (customAliadoImg && customAliadoImg.value.trim()) || "Isotipo.png";
            const enlace = document.getElementById('sandia-aliado-enlace').value.trim() || "#";

            try {
                if (currentAliadoId) {
                    await updateDoc(doc(db, "sandia_aliados", currentAliadoId), {
                        nombre,
                        imagen,
                        enlace,
                        fechaActualizacion: new Date().toISOString()
                    });
                } else {
                    await addDoc(collection(db, "sandia_aliados"), {
                        nombre,
                        imagen,
                        enlace,
                        activo: true,
                        fechaCreacion: new Date().toISOString()
                    });
                }
                modalAliado.style.display = 'none';
                formAliado.reset();
                if (aliadoImgPreview) aliadoImgPreview.style.display = 'none';
            } catch (err) {
                console.error("Error guardando aliado:", err);
                alert("Error: " + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Guardar Aliado";
            }
        });
    }

    // Botón de Importar / Sembrar Datos Iniciales de Respaldo
    if (btnSeedData) {
        btnSeedData.addEventListener('click', seedInitialSandiaData);
    }

    // --- GESTIÓN DE CUPONES DE CORTESÍA / SORTEO ---
    const btnQuickRunfree = document.getElementById('btn-quick-habilitar-runfree');
    const btnNuevoCupon = document.getElementById('btn-nuevo-cupon-sandia');
    const boxCrearCupon = document.getElementById('box-crear-cupon-sandia');
    const btnGuardarCupon = document.getElementById('btn-guardar-nuevo-cupon');
    const btnCancelarCupon = document.getElementById('btn-cancelar-nuevo-cupon');
    const inputCuponCodigo = document.getElementById('input-nuevo-cupon-codigo');

    const inputCuponPrecio = document.getElementById('input-nuevo-cupon-precio');
    const selectCuponTipo = document.getElementById('select-nuevo-cupon-tipo');

    if (btnNuevoCupon && boxCrearCupon) {
        btnNuevoCupon.addEventListener('click', () => {
            boxCrearCupon.style.display = boxCrearCupon.style.display === 'none' ? 'block' : 'none';
            if (inputCuponCodigo) inputCuponCodigo.focus();
        });
    }

    if (btnCancelarCupon && boxCrearCupon) {
        btnCancelarCupon.addEventListener('click', () => {
            boxCrearCupon.style.display = 'none';
            if (inputCuponCodigo) inputCuponCodigo.value = '';
            if (inputCuponPrecio) inputCuponPrecio.value = '0';
        });
    }

    if (btnGuardarCupon) {
        btnGuardarCupon.addEventListener('click', async () => {
            const rawCodigo = inputCuponCodigo ? inputCuponCodigo.value.trim().toUpperCase() : '';
            const precioUSD = inputCuponPrecio ? Math.max(0, parseFloat(inputCuponPrecio.value) || 0) : 0;
            const tipo = selectCuponTipo ? selectCuponTipo.value : 'REUTILIZABLE';

            if (!rawCodigo) {
                alert("Por favor ingresa un código para el cupón (ej: RUNFREE o PROMO10).");
                return;
            }
            await habilitarCuponEnFirestore(rawCodigo, precioUSD, tipo);
            if (inputCuponCodigo) inputCuponCodigo.value = '';
            if (inputCuponPrecio) inputCuponPrecio.value = '0';
            if (boxCrearCupon) boxCrearCupon.style.display = 'none';
        });
    }

    if (btnQuickRunfree) {
        btnQuickRunfree.addEventListener('click', async () => {
            btnQuickRunfree.disabled = true;
            btnQuickRunfree.innerText = "Calculando...";
            try {
                // Obtener todos los cupones actuales para calcular el siguiente número
                const snap = await getDocs(collection(db, "sandia_cupones_horror"));
                let maxNum = 0;
                snap.forEach(d => {
                    const match = d.id.match(/^RUNFREE(\d+)$/i);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num > maxNum) maxNum = num;
                    }
                });
                const nextNum = maxNum + 1;
                const nextCodigo = `RUNFREE${nextNum}`;

                if (confirm(`¿Deseas habilitar el cupón ${nextCodigo} como cortesía 100% (0$) para el sorteo?`)) {
                    await habilitarCuponEnFirestore(nextCodigo, 0, 'REUTILIZABLE');
                }
            } catch (err) {
                console.error("Error al habilitar RUNFREE:", err);
                alert("Error: " + err.message);
            } finally {
                btnQuickRunfree.disabled = false;
                btnQuickRunfree.innerText = "⚡ Habilitar Siguiente RUNFREE";
            }
        });
    }
}

// Cargar Datos en Tiempo Real
export function loadSandiaData() {
    const tableBody = document.getElementById('sandia-events-tbody');
    const tableAliadosBody = document.getElementById('sandia-aliados-tbody');

    if (unsubscribeEventos) unsubscribeEventos();
    if (unsubscribeAliados) unsubscribeAliados();

    // Eventos
    const qEventos = query(collection(db, "sandia_eventos"));
    unsubscribeEventos = onSnapshot(qEventos, (snapshot) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #888;">No hay eventos registrados. Haz clic en '+ Nuevo Evento'.</td></tr>`;
            return;
        }

        const docsArray = [];
        snapshot.forEach(d => docsArray.push({ id: d.id, ...d.data() }));

        // Ordenar en memoria (si no tienen 'orden', usar 0)
        docsArray.sort((a, b) => (a.orden !== undefined ? a.orden : 999) - (b.orden !== undefined ? b.orden : 999));

        docsArray.forEach((ev, index) => {
            const id = ev.id;
            
            let badgeEstado = '';
            if (ev.estado === 'ACTIVO') badgeEstado = '<span style="background: rgba(46, 204, 113, 0.2); color: #2ecc71; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🟢 Próximo (Activo)</span>';
            else if (ev.estado === 'COMPLETADO') badgeEstado = '<span style="background: rgba(230, 126, 34, 0.2); color: #e67e22; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🏁 Completado</span>';
            else badgeEstado = '<span style="background: rgba(149, 165, 166, 0.2); color: #95a5a6; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">⚪ Oculto (Borrador)</span>';

            const imgSrc = resolveSandiaImgPath(ev.imagen);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space: nowrap;">
                    <button class="btn-secondary btn-small btn-move-event-up" style="padding: 2px 6px; font-size: 11px;" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>⬆️</button>
                    <button class="btn-secondary btn-small btn-move-event-down" style="padding: 2px 6px; font-size: 11px;" ${index === docsArray.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>⬇️</button>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${imgSrc}" onerror="this.onerror=null; this.src='img/growisotipo.png'" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: #1a1f2c;">
                        <div>
                            <strong>${ev.titulo}</strong>
                            <div style="font-size: 11px; color: #888;">${ev.ubicacion || ''}</div>
                        </div>
                    </div>
                </td>
                <td><strong style="color: var(--brand-orange);">${ev.dia} ${ev.mes}</strong></td>
                <td><span style="font-size: 11px; text-transform: uppercase; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px;">${ev.categoria}</span></td>
                <td>${badgeEstado}</td>
                <td>${ev.destacado_index ? '⭐ Sí (Home)' : 'No'}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-secondary btn-small btn-edit-event" data-id="${id}" style="margin-right: 5px;">✏️ Editar</button>
                    <button class="btn-secondary btn-small btn-del-event" data-id="${id}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">🗑️</button>
                </td>
            `;

            const btnUp = tr.querySelector('.btn-move-event-up');
            const btnDown = tr.querySelector('.btn-move-event-down');
            if (btnUp && index > 0) btnUp.addEventListener('click', () => moverPosicion('sandia_eventos', docsArray, index, index - 1));
            if (btnDown && index < docsArray.length - 1) btnDown.addEventListener('click', () => moverPosicion('sandia_eventos', docsArray, index, index + 1));

            tr.querySelector('.btn-edit-event').addEventListener('click', () => editEvent(id, ev));
            tr.querySelector('.btn-del-event').addEventListener('click', () => deleteEvent(id, ev.titulo));

            tableBody.appendChild(tr);
        });
    });

    // Aliados Comerciales (Patrocinantes)
    const qAliados = query(collection(db, "sandia_aliados"));
    unsubscribeAliados = onSnapshot(qAliados, (snapshot) => {
        if (!tableAliadosBody) return;
        tableAliadosBody.innerHTML = '';

        if (snapshot.empty) {
            tableAliadosBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #888;">No hay aliados comerciales registrados. Haz clic en '+ Nuevo Aliado'.</td></tr>`;
            return;
        }

        const aliadosArray = [];
        snapshot.forEach(d => aliadosArray.push({ id: d.id, ...d.data() }));

        // Ordenar en memoria
        aliadosArray.sort((a, b) => (a.orden !== undefined ? a.orden : 999) - (b.orden !== undefined ? b.orden : 999));

        aliadosArray.forEach((al, index) => {
            const id = al.id;
            const imgSrc = resolveSandiaImgPath(al.imagen);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space: nowrap;">
                    <button class="btn-secondary btn-small btn-move-aliado-up" style="padding: 2px 6px; font-size: 11px;" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>⬆️</button>
                    <button class="btn-secondary btn-small btn-move-aliado-down" style="padding: 2px 6px; font-size: 11px;" ${index === aliadosArray.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>⬇️</button>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${imgSrc}" onerror="this.onerror=null; this.src='img/growisotipo.png'" style="width: 35px; height: 35px; object-fit: contain; background: #fff; border-radius: 6px; padding: 2px;">
                        <strong>${al.nombre}</strong>
                    </div>
                </td>
                <td><span style="font-size: 12px; color: #888;">${al.imagen || ''}</span></td>
                <td><a href="${al.enlace}" target="_blank" style="color: var(--brand-cyan); text-decoration: none; font-size: 12px;">${al.enlace}</a></td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-secondary btn-small btn-edit-aliado" data-id="${id}" style="margin-right: 5px;">✏️ Editar</button>
                    <button class="btn-secondary btn-small btn-del-aliado" data-id="${id}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">🗑️</button>
                </td>
            `;

            const btnUp = tr.querySelector('.btn-move-aliado-up');
            const btnDown = tr.querySelector('.btn-move-aliado-down');
            if (btnUp && index > 0) btnUp.addEventListener('click', () => moverPosicion('sandia_aliados', aliadosArray, index, index - 1));
            if (btnDown && index < aliadosArray.length - 1) btnDown.addEventListener('click', () => moverPosicion('sandia_aliados', aliadosArray, index, index + 1));

            tr.querySelector('.btn-edit-aliado').addEventListener('click', () => editAliado(id, al));
            tr.querySelector('.btn-del-aliado').addEventListener('click', () => deleteAliado(id, al.nombre));
            tableAliadosBody.appendChild(tr);
        });
    });

    // Cupones de Cortesía (5K Horror Story / Sorteos)
    const tableCuponesBody = document.getElementById('sandia-cupones-tbody');
    const inputSearchCupones = document.getElementById('input-search-cupones');
    const selectFiltroEstado = document.getElementById('select-filtro-cupones-estado');
    const badgeCountCupones = document.getElementById('cupones-count-badge');
    let allCuponesCache = [];

    function calcularEstadoCupon(c) {
        const tipoCupon = c.tipo || 'REUTILIZABLE';
        const maxUsos = tipoCupon === 'UN_SOLO_USO' ? 1 : (tipoCupon === 'DOS_USOS' ? 2 : (tipoCupon === 'TRES_USOS' ? 3 : (tipoCupon === 'CUATRO_USOS' ? 4 : (tipoCupon === 'CINCO_USOS' ? 5 : (typeof c.maxUsos === 'number' && c.maxUsos > 0 ? c.maxUsos : null)))));
        const esReutilizable = maxUsos === null;
        const usosActuales = Number(c.usosCount !== undefined ? c.usosCount : (c.estado === 'USADO' ? 1 : 0));
        const estaUsado = !esReutilizable && (c.estado === 'USADO' || usosActuales >= maxUsos || (!!c.usadoEn && !c.habilitado && maxUsos === 1));
        const estaHabilitado = c.estado === 'HABILITADO' || (c.habilitado === true && !estaUsado);

        if (estaUsado) return 'USADO';
        if (estaHabilitado) return 'ACTIVO';
        return 'PAUSADO';
    }

    function renderCuponesFiltrados() {
        if (!tableCuponesBody) return;
        tableCuponesBody.innerHTML = '';

        const estadoFiltro = selectFiltroEstado ? selectFiltroEstado.value : 'TODOS';
        const filterQuery = (inputSearchCupones ? inputSearchCupones.value.trim().toLowerCase() : '');

        const filtrados = allCuponesCache.filter(c => {
            const estadoCalculado = calcularEstadoCupon(c);

            // Filtro por Estado (ACTIVO, PAUSADO, USADO)
            if (estadoFiltro !== 'TODOS' && estadoCalculado !== estadoFiltro) {
                return false;
            }

            // Filtro por Búsqueda (código o atleta)
            if (!filterQuery) return true;
            const cod = (c.id || '').toLowerCase();
            const atletaNombre = (c.atleta && c.atleta.nombre ? c.atleta.nombre : '').toLowerCase();
            const atletaCedula = (c.atleta && c.atleta.cedula ? c.atleta.cedula : '').toLowerCase();
            return cod.includes(filterQuery) || atletaNombre.includes(filterQuery) || atletaCedula.includes(filterQuery);
        });

        if (badgeCountCupones) {
            const textoFiltro = estadoFiltro === 'TODOS' ? '' : ` • ${estadoFiltro}`;
            badgeCountCupones.innerText = `${filtrados.length} / ${allCuponesCache.length} cupones${textoFiltro}`;
        }

        if (filtrados.length === 0) {
            tableCuponesBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">No se encontraron cupones con ese criterio.</td></tr>`;
            return;
        }

        filtrados.forEach(c => {
            const id = c.id;
            const tipoCupon = c.tipo || 'REUTILIZABLE';
            const maxUsos = tipoCupon === 'UN_SOLO_USO' ? 1 : (tipoCupon === 'DOS_USOS' ? 2 : (tipoCupon === 'TRES_USOS' ? 3 : (tipoCupon === 'CUATRO_USOS' ? 4 : (tipoCupon === 'CINCO_USOS' ? 5 : (typeof c.maxUsos === 'number' && c.maxUsos > 0 ? c.maxUsos : null)))));
            const esReutilizable = maxUsos === null;
            const usosActuales = Number(c.usosCount !== undefined ? c.usosCount : (c.estado === 'USADO' ? 1 : 0));
            const precioUSD = (c.precioUSD !== undefined) ? Number(c.precioUSD) : 0;
            const estaUsado = !esReutilizable && (c.estado === 'USADO' || usosActuales >= maxUsos || (!!c.usadoEn && !c.habilitado && maxUsos === 1));
            const estaHabilitado = c.estado === 'HABILITADO' || (c.habilitado === true && !estaUsado);

            let badge = '';
            if (estaUsado) {
                badge = `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🔒 Canjeado (Quemado)</span>`;
            } else if (estaHabilitado) {
                badge = `<span style="background: rgba(46, 204, 113, 0.2); color: #2ecc71; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🟢 Activo</span>`;
            } else {
                badge = `<span style="background: rgba(149, 165, 166, 0.2); color: #95a5a6; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">⏸️ Pausado</span>`;
            }

            let badgeTipo = `<span style="background: rgba(0, 210, 255, 0.15); color: var(--brand-cyan); padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">♾️ Multiuso</span>`;
            if (tipoCupon === 'UN_SOLO_USO') {
                badgeTipo = `<span style="background: rgba(255, 165, 0, 0.15); color: #ffa500; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">🔒 1 Solo Uso</span>`;
            } else if (tipoCupon === 'DOS_USOS') {
                badgeTipo = `<span style="background: rgba(255, 165, 0, 0.15); color: #ffa500; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">🔒 2 Usos</span>`;
            } else if (tipoCupon === 'TRES_USOS') {
                badgeTipo = `<span style="background: rgba(255, 165, 0, 0.15); color: #ffa500; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">🔒 3 Usos</span>`;
            } else if (tipoCupon === 'CUATRO_USOS') {
                badgeTipo = `<span style="background: rgba(255, 165, 0, 0.15); color: #ffa500; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">🔒 4 Usos</span>`;
            } else if (tipoCupon === 'CINCO_USOS') {
                badgeTipo = `<span style="background: rgba(255, 165, 0, 0.15); color: #ffa500; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">🔒 5 Usos</span>`;
            }

            const badgePrecio = precioUSD === 0 
                ? `<span style="color: #00ff66; font-weight: 800; font-size: 12px;">GRATIS ($0)</span>`
                : `<span style="color: #ffffff; font-weight: 800; font-size: 12px;">$${precioUSD} USD</span>`;

            let atletasRegistradosText = '-';
            if (maxUsos !== null) {
                const infoAtleta = (c.atleta && c.atleta.nombre)
                    ? ` <span style="font-size:10px; color:#888;">(${c.atleta.nombre})</span>`
                    : (c.ultimoAtleta && c.ultimoAtleta.nombre ? ` <span style="font-size:10px; color:#888;">(${c.ultimoAtleta.nombre})</span>` : '');
                atletasRegistradosText = `<strong style="color: var(--brand-cyan);">${usosActuales} / ${maxUsos}</strong> usos${infoAtleta}`;
            } else if (c.usosCount !== undefined) {
                atletasRegistradosText = `<strong style="color: var(--brand-cyan);">${c.usosCount}</strong> atletas`;
            } else if (c.atleta) {
                atletasRegistradosText = `${c.atleta.nombre || 'Atleta'} <span style="font-size:10px; color:#888;">(C.I. ${c.atleta.cedula || 'N/A'})</span>`;
            }

            const linkVIP = `https://www.sandiaproduction.com/paraguanahorror.html?vip=${id}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px 14px;"><strong style="color: var(--brand-orange); font-family: monospace; font-size: 13px;">${id}</strong></td>
                <td style="padding: 10px 14px;">${badgePrecio}</td>
                <td style="padding: 10px 14px;">${badgeTipo}</td>
                <td style="padding: 10px 14px;">${badge}</td>
                <td style="padding: 10px 14px; font-size: 12px;">${atletasRegistradosText}</td>
                <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
                    <button class="btn-secondary btn-small btn-copiar-vip" title="Copiar enlace VIP oficial listo para enviar por WhatsApp" style="margin-right: 6px; font-size: 11px; background: rgba(0, 210, 255, 0.12); border-color: var(--brand-cyan); color: var(--brand-cyan); font-weight: 700; padding: 5px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                        🔗 Copiar Link VIP
                    </button>
                    <button class="btn-secondary btn-small btn-edit-cupon" title="Editar precio o modalidad del cupón" style="margin-right: 4px; font-size: 11px; border-color: rgba(255,255,255,0.25); padding: 5px 8px; cursor: pointer;">✏️</button>
                    <button class="btn-secondary btn-small btn-deshabilitar-cupon" style="margin-right: 4px; font-size: 11px; color: ${estaHabilitado ? '#f39c12' : '#2ecc71'}; border-color: ${estaHabilitado ? 'rgba(243, 156, 18, 0.4)' : 'rgba(46, 204, 113, 0.4)'}; padding: 5px 9px; cursor: pointer;">
                        ${estaHabilitado ? 'Pausar' : 'Activar'}
                    </button>
                    <button class="btn-secondary btn-small btn-del-cupon" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); font-size: 11px; padding: 5px 8px; cursor: pointer;">🗑️</button>
                </td>
            `;

            const btnCopiar = tr.querySelector('.btn-copiar-vip');
            btnCopiar.addEventListener('click', () => {
                const onCopied = () => {
                    const originalHtml = btnCopiar.innerHTML;
                    btnCopiar.innerHTML = '✔ ¡Copiado!';
                    btnCopiar.style.background = 'rgba(0, 255, 102, 0.2)';
                    btnCopiar.style.borderColor = '#00ff66';
                    btnCopiar.style.color = '#00ff66';
                    setTimeout(() => {
                        btnCopiar.innerHTML = originalHtml;
                        btnCopiar.style.background = 'rgba(0, 210, 255, 0.12)';
                        btnCopiar.style.borderColor = 'var(--brand-cyan)';
                        btnCopiar.style.color = 'var(--brand-cyan)';
                    }, 2200);

                    if (window.showToast) window.showToast(`¡Enlace VIP copiado! 🎟️ Listo para pegar en WhatsApp: ${linkVIP}`);
                    else alert(`¡Enlace VIP copiado!\n\n${linkVIP}`);
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(linkVIP).then(onCopied).catch(() => {
                        copiarTextoFallback(linkVIP);
                    });
                } else {
                    copiarTextoFallback(linkVIP);
                }
            });

            tr.querySelector('.btn-edit-cupon').addEventListener('click', () => {
                abrirModalEditarCupon(c);
            });

            tr.querySelector('.btn-deshabilitar-cupon').addEventListener('click', async () => {
                await toggleEstadoCupon(id, estaHabilitado);
            });

            tr.querySelector('.btn-del-cupon').addEventListener('click', () => {
                eliminarCupon(id);
            });

            tableCuponesBody.appendChild(tr);
        });
    }

    if (inputSearchCupones) {
        inputSearchCupones.addEventListener('input', () => {
            renderCuponesFiltrados();
        });
    }

    if (selectFiltroEstado) {
        selectFiltroEstado.addEventListener('change', () => {
            renderCuponesFiltrados();
        });
    }

    if (unsubscribeCupones) unsubscribeCupones();
    const qCupones = query(collection(db, "sandia_cupones_horror"));
    unsubscribeCupones = onSnapshot(qCupones, (snapshot) => {
        allCuponesCache = [];
        snapshot.forEach(d => allCuponesCache.push({ id: d.id, ...d.data() }));

        // Ordenamiento Inteligente y Jerárquico:
        // 1. Estados: ACTIVO (Peso 1 - Arriba de primeros) > PAUSADO (Peso 2) > USADO/QUEMADO (Peso 3 - Al fondo)
        // 2. Cronología: Los recién creados o actualizados saltan inmediatamente a la primera fila
        allCuponesCache.sort((a, b) => {
            const pesoEstado = (c) => {
                const est = calcularEstadoCupon(c);
                if (est === 'ACTIVO') return 1;
                if (est === 'PAUSADO') return 2;
                return 3; // USADO / QUEMADO
            };

            const pA = pesoEstado(a);
            const pB = pesoEstado(b);
            if (pA !== pB) return pA - pB;

            // Recién creados o modificados arriba de primeros
            const timeA = new Date(a.fechaActualizacion || a.fechaCreacion || 0).getTime();
            const timeB = new Date(b.fechaActualizacion || b.fechaCreacion || 0).getTime();
            if (timeA && timeB && timeA !== timeB) return timeB - timeA;

            const numA = parseInt((a.id.match(/\d+/) || [0])[0], 10);
            const numB = parseInt((b.id.match(/\d+/) || [0])[0], 10);
            if (numA && numB && numA !== numB) return numB - numA;
            return a.id.localeCompare(b.id);
        });

        renderCuponesFiltrados();
    });
}

function copiarTextoFallback(texto) {
    const tempInput = document.createElement("input");
    tempInput.value = texto;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand("copy");
        if (window.showToast) window.showToast(`¡Enlace VIP copiado! 📋`);
        else alert(`¡Enlace VIP copiado!\n\n${texto}`);
    } catch (e) {
        prompt("Copia manualmente este enlace VIP:", texto);
    }
    document.body.removeChild(tempInput);
}

function abrirModalEditarCupon(cupon) {
    if (!cupon) return;
    const modal = document.getElementById('modal-editar-cupon');
    const inputId = document.getElementById('edit-cupon-id');
    const inputCodigo = document.getElementById('edit-cupon-codigo');
    const inputPrecio = document.getElementById('edit-cupon-precio');
    const selectTipo = document.getElementById('edit-cupon-tipo');

    if (!modal) return;
    const idVal = String(cupon.id || cupon.codigo || '').trim().toUpperCase();
    if (inputId) inputId.value = idVal;
    if (inputCodigo) inputCodigo.value = idVal;
    if (inputPrecio) inputPrecio.value = cupon.precioUSD !== undefined ? Number(cupon.precioUSD) : 0;
    if (selectTipo) selectTipo.value = cupon.tipo || 'REUTILIZABLE';

    modal.style.display = 'flex';
}

const formEditarCupon = document.getElementById('form-editar-cupon');
if (formEditarCupon) {
    formEditarCupon.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = (document.getElementById('edit-cupon-id')?.value || '').trim().toUpperCase();
        if (!id) {
            alert("Error: No se pudo identificar el código del cupón.");
            return;
        }

        const inputPrecio = document.getElementById('edit-cupon-precio');
        const precioUSD = inputPrecio ? Math.max(0, parseFloat(inputPrecio.value) || 0) : 0;
        const selectTipo = document.getElementById('edit-cupon-tipo');
        const tipo = selectTipo ? selectTipo.value : 'REUTILIZABLE';
        const maxUsos = tipo === 'UN_SOLO_USO' ? 1 : (tipo === 'DOS_USOS' ? 2 : (tipo === 'TRES_USOS' ? 3 : (tipo === 'CUATRO_USOS' ? 4 : (tipo === 'CINCO_USOS' ? 5 : null))));

        const btnSubmit = formEditarCupon.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Guardando...";
        }

        try {
            const payload = {
                codigo: id,
                precioUSD: Number(precioUSD),
                tipo: tipo,
                maxUsos: maxUsos !== null ? Number(maxUsos) : null,
                fechaActualizacion: new Date().toISOString()
            };

            const cached = allCuponesCache.find(item => item.id === id);
            const usosActuales = cached ? Number(cached.usosCount !== undefined ? cached.usosCount : (cached.estado === 'USADO' ? 1 : 0)) : 0;
            if (maxUsos === null || usosActuales < maxUsos) {
                payload.estado = 'HABILITADO';
                payload.habilitado = true;
            }

            // Usar setDoc con merge: true (mismo método infalible que habilitar y toggle)
            await setDoc(doc(db, "sandia_cupones_horror", id), payload, { merge: true });

            if (window.showToast) window.showToast(`✔ Cupón ${id} actualizado correctamente ($${precioUSD} USD - ${tipo})`);
            else alert(`✔ Cupón ${id} actualizado correctamente.`);

            const modal = document.getElementById('modal-editar-cupon');
            if (modal) modal.style.display = 'none';
        } catch (err) {
            console.error("Error al actualizar cupón:", err);
            alert("Error al actualizar cupón: " + err.message);
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Guardar Cambios";
            }
        }
    });
}

async function habilitarCuponEnFirestore(codigo, precioUSD = 0, tipo = 'REUTILIZABLE') {
    try {
        const idSanitizado = codigo.trim().toUpperCase();
        const maxUsos = tipo === 'UN_SOLO_USO' ? 1 : (tipo === 'DOS_USOS' ? 2 : (tipo === 'TRES_USOS' ? 3 : (tipo === 'CUATRO_USOS' ? 4 : (tipo === 'CINCO_USOS' ? 5 : null))));
        await setDoc(doc(db, "sandia_cupones_horror", idSanitizado), {
            codigo: idSanitizado,
            precioUSD: Number(precioUSD),
            tipo: tipo, // 'REUTILIZABLE', 'UN_SOLO_USO', 'DOS_USOS', 'TRES_USOS'
            maxUsos: maxUsos,
            usosCount: 0,
            estado: 'HABILITADO',
            habilitado: true,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            evento: '5K Paraguaná Horror Story'
        }, { merge: true });
        const linkVIP = `https://www.sandiaproduction.com/paraguanahorror.html?vip=${idSanitizado}`;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(linkVIP);
            }
        } catch(clipErr) {}

        if (window.showToast) {
            window.showToast(`✔ Cupón ${idSanitizado} creado. ¡Enlace VIP copiado al portapapeles! 🎟️`);
        } else {
            prompt(`✔ Cupón ${idSanitizado} creado ($${precioUSD} USD - ${tipo}). Copia este enlace VIP:`, linkVIP);
        }
    } catch (e) {
        console.error("Error al habilitar cupón:", e);
        alert("Error al habilitar cupón: " + e.message);
    }
}

async function toggleEstadoCupon(id, estaHabilitado) {
    try {
        await updateDoc(doc(db, "sandia_cupones_horror", id), {
            estado: estaHabilitado ? 'PAUSADO' : 'HABILITADO',
            habilitado: !estaHabilitado
        });
    } catch (e) {
        alert("Error: " + e.message);
    }
}

async function eliminarCupon(id) {
    if (confirm(`¿Estás seguro de eliminar el cupón ${id}?`)) {
        try {
            await deleteDoc(doc(db, "sandia_cupones_horror", id));
        } catch (e) {
            alert("Error al eliminar: " + e.message);
        }
    }
}

function editEvent(id, ev) {
    currentEventId = id;
    const titleEl = document.getElementById('sandia-modal-title');
    if (titleEl) titleEl.innerText = "✏️ Editar Evento Deportivo";
    
    document.getElementById('sandia-event-titulo').value = ev.titulo || '';
    document.getElementById('sandia-event-dia').value = ev.dia || '';
    document.getElementById('sandia-event-mes').value = ev.mes || '';
    document.getElementById('sandia-event-ubicacion').value = ev.ubicacion || '';
    document.getElementById('sandia-event-categoria').value = ev.categoria || 'SANDIA';
    document.getElementById('sandia-event-enlace').value = ev.enlace || '';
    document.getElementById('sandia-event-boton-texto').value = ev.textoBoton || 'Inscribirme Ahora';
    
    const selectImg = document.getElementById('sandia-event-img-select');
    const customImg = document.getElementById('sandia-event-custom-img');
    
    if (sandiaImagesList.includes(ev.imagen)) {
        if (selectImg) selectImg.value = ev.imagen;
        if (customImg) customImg.value = '';
    } else {
        if (selectImg) selectImg.value = '';
        if (customImg) customImg.value = ev.imagen || '';
    }

    document.getElementById('sandia-event-estado').value = ev.estado || 'ACTIVO';
    document.getElementById('sandia-event-destacado').checked = !!ev.destacado_index;

    const eventImgPreview = document.getElementById('sandia-event-img-preview');
    if (ev.imagen) {
        previewImage(eventImgPreview, ev.imagen);
    } else if (eventImgPreview) {
        eventImgPreview.style.display = 'none';
    }

    document.getElementById('modal-sandia-event').style.display = 'flex';
}

function editAliado(id, al) {
    currentAliadoId = id;
    const titleAliado = document.getElementById('sandia-aliado-modal-title');
    if (titleAliado) titleAliado.innerText = "✏️ Editar Aliado Comercial";
    
    document.getElementById('sandia-aliado-nombre').value = al.nombre || '';
    document.getElementById('sandia-aliado-enlace').value = al.enlace || '';

    const selectAliadoImg = document.getElementById('sandia-aliado-img-select');
    const customAliadoImg = document.getElementById('sandia-aliado-custom-img');

    if (sandiaImagesList.includes(al.imagen)) {
        if (selectAliadoImg) selectAliadoImg.value = al.imagen;
        if (customAliadoImg) customAliadoImg.value = '';
    } else {
        if (selectAliadoImg) selectAliadoImg.value = '';
        if (customAliadoImg) customAliadoImg.value = al.imagen || '';
    }

    const aliadoImgPreview = document.getElementById('sandia-aliado-img-preview');
    if (al.imagen) {
        previewImage(aliadoImgPreview, al.imagen);
    } else if (aliadoImgPreview) {
        aliadoImgPreview.style.display = 'none';
    }

    document.getElementById('modal-sandia-aliado').style.display = 'flex';
}

async function deleteEvent(id, titulo) {
    if (confirm(`¿Estás seguro de que deseas eliminar el evento '${titulo}'?`)) {
        try {
            await deleteDoc(doc(db, "sandia_eventos", id));
        } catch (err) {
            alert("Error al eliminar: " + err.message);
        }
    }
}

async function deleteAliado(id, nombre) {
    if (confirm(`¿Eliminar aliado comercial '${nombre}'?`)) {
        try {
            await deleteDoc(doc(db, "sandia_aliados", id));
        } catch (err) {
            alert("Error al eliminar aliado: " + err.message);
        }
    }
}

// Función auxiliar para reordenar (cambiar posición con flechas ⬆️ / ⬇️)
async function moverPosicion(coleccion, itemsArray, indexActual, indexDestino) {
    if (indexDestino < 0 || indexDestino >= itemsArray.length) return;

    const itemActual = itemsArray[indexActual];
    const itemDestino = itemsArray[indexDestino];

    const ordenActual = itemActual.orden !== undefined ? itemActual.orden : indexActual;
    const ordenDestino = itemDestino.orden !== undefined ? itemDestino.orden : indexDestino;

    try {
        await updateDoc(doc(db, coleccion, itemActual.id), { orden: ordenDestino });
        await updateDoc(doc(db, coleccion, itemDestino.id), { orden: ordenActual });
    } catch (e) {
        console.error("Error al reordenar:", e);
        alert("Error al cambiar la posición: " + e.message);
    }
}

// ==========================================
// CONTROL DE ESTADO WEB Y COBRANZA
// ==========================================
function initSandiaConfig() {
    const btnSaveStatus = document.getElementById('btn-save-sandia-status');
    const selectStatus = document.getElementById('sandia-web-status');
    const badgeStatus = document.getElementById('sandia-web-status-badge');

    const selectHorrorInsc = document.getElementById('sandia-horror-inscripciones-status');
    const btnSaveHorrorInsc = document.getElementById('btn-save-horror-inscripciones');

    const btnSaveBilling = document.getElementById('btn-save-sandia-billing');
    const selectPlan = document.getElementById('sandia-plan');
    const inputVencimiento = document.getElementById('sandia-vencimiento');
    const inputDeuda = document.getElementById('sandia-deuda');

    const visitasCountEl = document.getElementById('sandia-visitas-count');
    const btnResetVisitas = document.getElementById('btn-reset-sandia-visitas');

    const statusBox = document.getElementById('sandia-cobranza-status-box');
    const statusBadge = document.getElementById('sandia-cobranza-badge');

    // Escuchar cambios de configuración en Firestore
    onSnapshot(doc(db, "sandia_config", "general"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.sandiaConfigCache = data;
            if (typeof window.renderDashboardKPIs === 'function' && window.state && window.state.allClientsCache) {
                window.renderDashboardKPIs(window.state.allClientsCache);
            }
            if (selectStatus && data.estadoWeb) selectStatus.value = data.estadoWeb;
            if (selectHorrorInsc) {
                const abiertas = data.inscripcionesHorrorAbiertas !== false;
                selectHorrorInsc.value = abiertas ? 'ABIERTAS' : 'CERRADAS';
            }
            if (badgeStatus) {
                if (data.estadoWeb === 'ONLINE') badgeStatus.style.background = '#2ecc71';
                else if (data.estadoWeb === 'MANTENIMIENTO') badgeStatus.style.background = '#f39c12';
                else badgeStatus.style.background = '#e74c3c';
            }
            if (selectPlan && data.plan) selectPlan.value = data.plan;
            if (inputVencimiento && data.vencimiento) inputVencimiento.value = data.vencimiento;
            if (inputDeuda) inputDeuda.value = (data.deuda !== undefined ? data.deuda : 0);
            if (visitasCountEl) {
                const totalVisitas = data.visitas || 0;
                visitasCountEl.innerText = totalVisitas.toLocaleString('es-VE');
            }

            // Cálculo dinámico de período de gracia (5 días después de la fecha de corte)
            if (statusBox && statusBadge && data.vencimiento) {
                const hoy = new Date();
                hoy.setHours(0,0,0,0);
                const fechaCorte = new Date(data.vencimiento + 'T00:00:00');
                const fechaGracia = new Date(fechaCorte);
                fechaGracia.setDate(fechaGracia.getDate() + 5); // 5 días de gracia (ej. corte día 10 -> gracia hasta el 15)

                const deudaTotal = parseFloat(data.deuda || 0);

                if (deudaTotal <= 0) {
                    statusBox.style.background = 'rgba(16, 185, 129, 0.1)';
                    statusBox.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    statusBox.style.color = '#10b981';
                    statusBadge.innerText = '🟢 Solvente / Al día';
                } else if (hoy <= fechaCorte) {
                    statusBox.style.background = 'rgba(0, 210, 255, 0.1)';
                    statusBox.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                    statusBox.style.color = 'var(--brand-cyan)';
                    statusBadge.innerText = `⏳ Próximo corte: ${data.vencimiento} (5 días de gracia hasta el ${fechaGracia.toISOString().split('T')[0]})`;
                } else if (hoy <= fechaGracia) {
                    statusBox.style.background = 'rgba(245, 158, 11, 0.15)';
                    statusBox.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                    statusBox.style.color = '#f59e0b';
                    statusBadge.innerText = `⚠️ En Período de Gracia (Venció el ${data.vencimiento}. Límite holgura: ${fechaGracia.toISOString().split('T')[0]} antes de Mantenimiento)`;
                } else {
                    statusBox.style.background = 'rgba(239, 68, 68, 0.15)';
                    statusBox.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    statusBox.style.color = '#ef4444';
                    statusBadge.innerText = `🔴 Fuera de Gracia (Pasó el ${fechaGracia.toISOString().split('T')[0]} - Se activa Modo Mantenimiento)`;
                }
            }
        }
    });

    if (btnResetVisitas) {
        btnResetVisitas.addEventListener('click', async () => {
            const visitasActuales = visitasCountEl ? visitasCountEl.innerText : '0';
            if (confirm(`¿Resetear el contador de visitas (${visitasActuales}) de Sandía Production a 0?`)) {
                try {
                    await setDoc(doc(db, "sandia_config", "general"), { visitas: 0, ultimoResetVisitas: new Date().toISOString() }, { merge: true });
                    alert("¡Contador de visitas reseteado a 0!");
                } catch(e) {
                    alert("Error al resetear visitas: " + e.message);
                }
            }
        });
    }

    if (btnSaveStatus) {
        btnSaveStatus.addEventListener('click', async () => {
            const estadoWeb = selectStatus.value;
            btnSaveStatus.disabled = true;
            btnSaveStatus.innerText = "Guardando...";
            try {
                await setDoc(doc(db, "sandia_config", "general"), { estadoWeb, fechaModificacion: new Date().toISOString() }, { merge: true });
                alert("¡Estado del sitio web actualizado!");
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                btnSaveStatus.disabled = false;
                btnSaveStatus.innerText = "Guardar Estado Web";
            }
        });
    }

    if (btnSaveHorrorInsc && selectHorrorInsc) {
        btnSaveHorrorInsc.addEventListener('click', async () => {
            const abiertas = selectHorrorInsc.value === 'ABIERTAS';
            btnSaveHorrorInsc.disabled = true;
            btnSaveHorrorInsc.innerText = "...";
            try {
                await setDoc(doc(db, "sandia_config", "general"), {
                    inscripcionesHorrorAbiertas: abiertas,
                    fechaModificacionHorror: new Date().toISOString()
                }, { merge: true });
                if (window.showToast) {
                    window.showToast(abiertas ? "🟢 ¡Inscripciones 5K Horror ABIERTAS!" : "🔒 ¡Inscripciones 5K Horror CERRADAS (Triple Candado Activo)!");
                } else {
                    alert(abiertas ? "🟢 ¡Inscripciones 5K Horror ABIERTAS!" : "🔒 ¡Inscripciones 5K Horror CERRADAS!");
                }
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                btnSaveHorrorInsc.disabled = false;
                btnSaveHorrorInsc.innerText = "Aplicar";
            }
        });
    }

    if (btnSaveBilling) {
        btnSaveBilling.addEventListener('click', async () => {
            const plan = selectPlan.value;
            const vencimiento = inputVencimiento.value;
            const deuda = inputDeuda ? (parseFloat(inputDeuda.value) || 0) : 0;
            btnSaveBilling.disabled = true;
            btnSaveBilling.innerText = "Guardando...";
            try {
                await setDoc(doc(db, "sandia_config", "general"), { 
                    plan, 
                    vencimiento, 
                    deuda,
                    mensualidad: 20, 
                    fechaModificacion: new Date().toISOString() 
                }, { merge: true });
                alert("¡Datos de cobranza actualizados!");
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                btnSaveBilling.disabled = false;
                btnSaveBilling.innerText = "Guardar Cobranza";
            }
        });
    }
}

// ==========================================
// GENERADOR DE REPORTES PARA SANDÍA PRODUCTION
// ==========================================
window.generarReporteSandiaWhatsapp = async function() {
    try {
        let visitas = 0;
        try {
            const docSnap = await getDoc(doc(db, "sandia_config", "general"));
            if (docSnap.exists()) {
                visitas = docSnap.data().visitas || 0;
            }
        } catch(e) {}

        if (!visitas) {
            const countEl = document.getElementById('sandia-visitas-count');
            if (countEl) visitas = parseInt(countEl.innerText.replace(/\D/g, '')) || 0;
        }

        const telefono = "584126574354";
        const mensaje = `¡Hola Sandía Production! 📊 Aquí tienes tu reporte de tráfico web de Grow Studio.\n\nTu portal de eventos deportivos ha recibido *${visitas.toLocaleString('es-VE')} visitas* acumuladas.\n\n¡La comunidad runner sigue atenta a los próximos retos! 🏃‍♂️💨🚀`;
        const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    } catch (e) {
        alert("Error al generar reporte de WhatsApp: " + e.message);
    }
};

window.generarReporteSandiaPDF = async function() {
    try {
        let data = {};
        try {
            const docSnap = await getDoc(doc(db, "sandia_config", "general"));
            if (docSnap.exists()) data = docSnap.data();
        } catch(e) {}

        const countEl = document.getElementById('sandia-visitas-count');
        const visitasDom = countEl ? (parseInt(countEl.innerText.replace(/\D/g, '')) || 0) : 0;

        const nombre = "Sandía Production";
        const plan = data.plan || "MENSUAL ($20)";
        const visitas = data.visitas !== undefined ? data.visitas : visitasDom;

        // Extraer campos vis_YYYY_MM
        const meses = [];
        Object.entries(data).forEach(([key, val]) => {
            if (/^vis_\d{4}_\d{2}$/.test(key)) {
                const [, yyyy, mm] = key.split('_');
                meses.push({ key, yyyy: parseInt(yyyy), mm: parseInt(mm), visitas: parseInt(val) || 0 });
            }
        });
        meses.sort((a, b) => a.yyyy !== b.yyyy ? a.yyyy - b.yyyy : a.mm - b.mm);

        const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const totalHistorico = visitas;
        const promedio = meses.length ? Math.round(totalHistorico / meses.length) : totalHistorico;
        const mejor = meses.length ? meses.reduce((a, b) => b.visitas > a.visitas ? b : a) : null;
        const maxVisitas = mejor ? mejor.visitas : (totalHistorico || 1);

        const filasHTML = meses.length === 0
            ? `<tr>
                <td style="padding:12px 10px;font-weight:700;color:#ff334b;">Total Acumulado 🏆</td>
                <td style="padding:12px 10px;text-align:right;font-family:'Roboto Mono',monospace;font-weight:600;">${totalHistorico.toLocaleString('es-VE')}</td>
                <td style="padding:12px 10px;width:45%;">
                    <div style="background:#eef2f5;border-radius:20px;height:12px;overflow:hidden;">
                        <div style="background:#ff334b;height:100%;width:100%;border-radius:20px;"></div>
                    </div>
                </td>
               </tr>`
            : meses.map((m, i) => {
                const label = `${MESES_ES[m.mm - 1]} ${m.yyyy}`;
                const pct = Math.round((m.visitas / maxVisitas) * 100);
                const prev = i > 0 ? meses[i-1].visitas : null;
                let tendencia = '';
                if (prev !== null) {
                    const diff = m.visitas - prev;
                    tendencia = diff > 0
                        ? `<span style="color:#10b981;font-size:11px;">▲ +${diff}</span>`
                        : diff < 0
                        ? `<span style="color:#ef4444;font-size:11px;">▼ ${diff}</span>`
                        : `<span style="color:#777;font-size:11px;">— igual</span>`;
                }
                const esMejor = mejor && m.key === mejor.key;
                return `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px 10px;font-weight:${esMejor?'700':'400'};color:${esMejor?'#ff334b':'#333'};">
                        ${label}${esMejor ? ' 🏆' : ''}
                    </td>
                    <td style="padding:12px 10px;text-align:right;font-family:'Roboto Mono',monospace;font-weight:600;">
                        ${m.visitas.toLocaleString('es-VE')}
                        <br>${tendencia}
                    </td>
                    <td style="padding:12px 10px;width:45%;">
                        <div style="background:#eef2f5;border-radius:20px;height:12px;overflow:hidden;">
                            <div style="background:${esMejor?'#ff334b':'#00c6eb'};height:100%;width:${pct}%;border-radius:20px;"></div>
                        </div>
                    </td>
                </tr>`;
            }).join('');

        const periodoLabel = meses.length >= 2
            ? `${MESES_ES[meses[0].mm-1]} ${meses[0].yyyy} – ${MESES_ES[meses[meses.length-1].mm-1]} ${meses[meses.length-1].yyyy}`
            : meses.length === 1
            ? `${MESES_ES[meses[0].mm-1]} ${meses[0].yyyy}`
            : 'Histórico General';

        const fechaGenerado = new Date().toLocaleDateString('es-VE', { day:'2-digit', month:'long', year:'numeric' });

        const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Reporte Rendimiento - Sandía Production</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&family=Roboto+Mono:wght@500&display=swap');
:root{--cyan:#00c6eb;--red:#e62035;--dark:#1a1a2e;--gray:#f5f6fa}
body{font-family:'Montserrat',sans-serif;color:#333;margin:0;padding:40px;background:#eef2f5;display:flex;justify-content:center}
@media print{body{background:white;padding:0}.report-container{box-shadow:none!important;max-width:100%!important}.no-print{display:none!important}}
.report-container{background:white;width:100%;max-width:820px;margin:0 auto;padding:50px;border-top:8px solid var(--red);border-bottom:8px solid var(--cyan);border-radius:4px;box-shadow:0 15px 35px rgba(0,0,0,.1);box-sizing:border-box}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
.report-meta{text-align:right}
.report-meta h1{margin:0 0 5px;color:var(--dark);font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:2px}
.report-meta p{margin:3px 0;font-size:13px;color:#777}
.report-meta .periodo{font-family:'Roboto Mono',monospace;color:var(--red);font-weight:600;font-size:15px}
.client-info{background:var(--gray);padding:18px 20px;border-left:4px solid var(--red);border-radius:0 8px 8px 0;margin-bottom:30px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.client-info h2{margin:0;font-size:20px;color:var(--dark)}
.client-info p{margin:4px 0;font-size:13px;color:#555}
.estado-badge{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:rgba(46,204,113,0.15);color:#2ecc71;border:1px solid rgba(46,204,113,0.3)}
.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px}
.summary-card{background:var(--gray);padding:16px;border-radius:10px;text-align:center}
.summary-card .val{font-size:28px;font-weight:800;color:var(--dark);font-family:'Roboto Mono',monospace}
.summary-card .lbl{font-size:11px;color:#777;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px}
table{width:100%;border-collapse:collapse;margin-bottom:30px}
th{background:var(--dark);color:white;padding:12px 10px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px}
th:last-child{width:45%}
.footer{text-align:center;margin-top:40px;font-size:13px;color:#777;border-top:1px solid #eee;padding-top:20px}
.footer strong{color:var(--red);font-weight:800}
.print-btn{position:fixed;bottom:30px;right:30px;background:var(--red);color:white;border:none;padding:14px 24px;font-size:15px;font-weight:600;border-radius:50px;cursor:pointer;box-shadow:0 4px 15px rgba(230,32,53,.4);transition:.2s;font-family:'Montserrat',sans-serif;z-index:100}
.print-btn:hover{background:var(--dark)}
</style></head><body>
<div class="report-container">

  <div class="header">
    <div style="display:flex;align-items:stretch;gap:6px;height:52px">
      <div style="display:flex;flex-direction:column;justify-content:space-between;padding:2px 0">
        <span style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:32px;color:#1a1a2e;line-height:0.75;letter-spacing:2px">GROW</span>
        <span style="font-family:'Montserrat',sans-serif;font-weight:400;font-size:20px;color:#1a1a2e;line-height:0.8;letter-spacing:8px;margin-left:2px">STUDIO</span>
      </div>
    </div>
    <div class="report-meta">
      <h1>Reporte de Rendimiento</h1>
      <div class="periodo">${periodoLabel}</div>
      <p>Generado: ${fechaGenerado}</p>
    </div>
  </div>

  <div class="client-info">
    <div>
      <h2>🍉 ${nombre}</h2>
      <p>Plan: <strong>${plan}</strong> &nbsp;|&nbsp; Portal Oficial de Eventos Deportivos</p>
      <p>Estado Web: <strong style="color:#2ecc71;">ONLINE</strong></p>
    </div>
    <div class="estado-badge">
      CLIENTE OFICIAL
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="val">${totalHistorico.toLocaleString('es-VE')}</div>
      <div class="lbl">Visitas Totales</div>
    </div>
    <div class="summary-card">
      <div class="val">${promedio.toLocaleString('es-VE')}</div>
      <div class="lbl">Promedio Mensual</div>
    </div>
    <div class="summary-card">
      <div class="val">${meses.length || 1}</div>
      <div class="lbl">Período Activo</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Mes</th>
        <th style="text-align:right">Visitas</th>
        <th>Tendencia</th>
      </tr>
    </thead>
    <tbody>
      ${filasHTML}
    </tbody>
  </table>

  <div class="footer">
    <p>Reporte de analítica generado por <strong>GROW STUDIO</strong> · Producción & Desarrollo Web</p>
    <p><a href="https://growstudioweb.vercel.app/" style="color:#777;text-decoration:none">https://growstudioweb.vercel.app/</a></p>
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Guardar como PDF</button>
</body></html>`;

        const ventana = window.open('', '_blank', 'width=950,height=750');
        ventana.document.write(html);
        ventana.document.close();
    } catch (e) {
        alert("Error al generar el PDF de Sandía: " + e.message);
    }
};

// ==========================================
// IMPORTACIÓN AUTOMÁTICA DE TODOS LOS EVENTOS & FLYERS
// ==========================================
async function seedInitialSandiaData() {
    if (!confirm("¿Deseas importar TODOS los eventos del Calendario (Locales, Regionales, Nacionales y Aliados) a Firebase Firestore automáticamente?")) return;

    const btn = document.getElementById('btn-seed-sandia-data');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Sincronizando Todo...";
    }

    try {
        // 1. Catálogo Completo de Eventos y Carreras (Local, Regional, Nacional y Pasados)
        const catalogoCompletoEventos = [
            {
                titulo: "5K Paraguaná Horror Story",
                dia: "31",
                mes: "OCT",
                ubicacion: "Sambil Paraguaná / 7:00 PM",
                categoria: "SANDIA",
                etiqueta: "Punto Fijo",
                imagen: "paraguanahorror_agotada.jpg",
                enlace: "paraguanahorror.html",
                textoBoton: "AGOTADA 🔒",
                estado: "COMPLETADO",
                activo: "NO",
                destacado_index: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Coffee Run ¡Madre Mía! 3K",
                dia: "27",
                mes: "SEP",
                ubicacion: "Av. Francisco de Miranda / Madre Mía",
                categoria: "REGIONAL",
                etiqueta: "Punto Fijo",
                imagen: "madremia.jpg",
                enlace: "https://forms.gle/CqN4gF54xLK3vo6T6",
                textoBoton: "INSCRIBIRME",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Matea Arepa Run 5K",
                dia: "04",
                mes: "SEP",
                ubicacion: "Punto Fijo, Falcón",
                categoria: "LOCAL",
                etiqueta: "Punto Fijo",
                imagen: "matea_run.png",
                enlace: "",
                textoBoton: "",
                estado: "COMPLETADO",
                activo: "NO",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "1era Coffee Run Terraza Tinaja 3K",
                dia: "15",
                mes: "AGO",
                ubicacion: "Punto Fijo, Falcón",
                categoria: "LOCAL",
                etiqueta: "Punto Fijo",
                imagen: "coffee_run.png",
                enlace: "https://fotoshare.co/e/mLqiMWncPCFtJhfZkTRIY?fbclid=PAZn",
                textoBoton: "Ver Galería",
                estado: "COMPLETADO",
                activo: "NO",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "7ma Carrera Infantil New Generation",
                dia: "15",
                mes: "AGO",
                ubicacion: "Maracaibo, Zulia",
                categoria: "NACIONAL",
                etiqueta: "Nacional",
                imagen: "7maCarreraInfantilNewGeneration.png",
                enlace: "",
                textoBoton: "",
                estado: "COMPLETADO",
                activo: "NO",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "10k Paraguana 2026",
                dia: "23",
                mes: "AGO",
                ubicacion: "Punto Fijo, Falcón",
                categoria: "LOCAL",
                etiqueta: "Punto Fijo",
                imagen: "10kparaguana2026.png",
                enlace: "https://papaya25.info/modp25.php?idc=16947",
                textoBoton: "Inscribirse",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Trail Botánico 10K",
                dia: "30",
                mes: "AGO",
                ubicacion: "Maracaibo, Zulia",
                categoria: "NACIONAL",
                etiqueta: "Nacional",
                imagen: "trailbotanico2026.png",
                enlace: "https://papaya25.info/modp25.php?idc=16892",
                textoBoton: "Inscribirse",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Run and Music Fest 10K",
                dia: "20",
                mes: "SEP",
                ubicacion: "Maracaibo, Zulia",
                categoria: "NACIONAL",
                etiqueta: "Nacional",
                imagen: "runmusicfest.png",
                enlace: "https://papaya25.info/modp25.php?idc=16923",
                textoBoton: "Inscribirse",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Chirimena Extrema 15K",
                dia: "27",
                mes: "SEP",
                ubicacion: "Miranda",
                categoria: "NACIONAL",
                etiqueta: "Nacional",
                imagen: "chirimenaextrema15ksep27.png",
                enlace: "",
                textoBoton: "",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Bicolor 10K",
                dia: "10",
                mes: "OCT",
                ubicacion: "San Francisco, Zulia",
                categoria: "NACIONAL",
                etiqueta: "Nacional",
                imagen: "bicolor10k2026.png",
                enlace: "https://papaya25.info/modp25.php?idc=16901",
                textoBoton: "Inscribirse",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Copaiba 10K 2026",
                dia: "25",
                mes: "OCT",
                ubicacion: "Cabimas, Zulia",
                categoria: "NACIONAL",
                etiqueta: "Nacional",
                imagen: "Copaiba10K2026.png",
                enlace: "https://papaya25.info/modp25.php?idc=16911",
                textoBoton: "Inscribirse",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "CHINITA 10K 2026",
                dia: "29",
                mes: "NOV",
                ubicacion: "Maracaibo, Zulia",
                categoria: "NACIONAL",
                etiqueta: "Nacional",
                imagen: "Chinita10K2026.png",
                enlace: "https://papaya25.info/modp25.php?idc=16956",
                textoBoton: "Inscribirse",
                estado: "ACTIVO",
                activo: "SI",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            }
        ];

        // Guardar todos los eventos en Firestore
        for (let idx = 0; idx < catalogoCompletoEventos.length; idx++) {
            await addDoc(collection(db, "sandia_eventos"), { 
                ...catalogoCompletoEventos[idx], 
                orden: idx 
            });
        }

        // 2. Aliados Comerciales Oficiales
        const aliadosBase = [
            {
                nombre: "Runner Club",
                imagen: "runfreelogo.png",
                enlace: "https://www.instagram.com/runfreest/",
                activo: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                nombre: "Grow Studio Agency",
                imagen: "Logo.png",
                enlace: "https://growstudioweb.vercel.app/",
                activo: true,
                fechaCreacion: new Date().toISOString()
            }
        ];

        for (let idx = 0; idx < aliadosBase.length; idx++) {
            await addDoc(collection(db, "sandia_aliados"), { ...aliadosBase[idx], orden: idx });
        }

        alert(`🎉 ¡Éxito! Se sincronizaron ${catalogoCompletoEventos.length} eventos y flyers a Firebase Firestore.`);
    } catch (error) {
        console.error("Error sembrando datos:", error);
        alert("Error al sincronizar datos: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "🌱 Importar Datos Iniciales";
        }
    }
}