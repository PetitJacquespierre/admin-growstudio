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
    "runfree.png",
    "runfreelogo.png",
    "runmusicfest.png",
    "teamfslogo1.png",
    "trailbotanico2026.png"
];

let unsubscribeEventos = null;
let unsubscribeAliados = null;
let currentEventId = null;
let currentAliadoId = null;

// Función para resolver rutas de imágenes sin romper el entorno ni entrar en loops
export function resolveSandiaImgPath(img) {
    if (!img || typeof img !== 'string') return '../Sandia Production/img/Isotipo.png';
    const trimmed = img.trim();
    if (!trimmed) return '../Sandia Production/img/Isotipo.png';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        return trimmed;
    }
    const clean = trimmed.replace(/^img\//, '').replace(/^\.\.\/Sandia Production\/img\//, '');
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
}

// Cargar Datos en Tiempo Real
export function loadSandiaData() {
    const tableBody = document.getElementById('sandia-events-tbody');
    const tableAliadosBody = document.getElementById('sandia-aliados-tbody');

    if (unsubscribeEventos) unsubscribeEventos();
    if (unsubscribeAliados) unsubscribeAliados();

    // Eventos
    const qEventos = query(collection(db, "sandia_eventos"), orderBy("orden", "asc"));
    unsubscribeEventos = onSnapshot(qEventos, (snapshot) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #888;">No hay eventos registrados. Haz clic en '+ Nuevo Evento'.</td></tr>`;
            return;
        }

        const docsArray = [];
        snapshot.forEach(d => docsArray.push({ id: d.id, ...d.data() }));

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
    const qAliados = query(collection(db, "sandia_aliados"), orderBy("orden", "asc"));
    unsubscribeAliados = onSnapshot(qAliados, (snapshot) => {
        if (!tableAliadosBody) return;
        tableAliadosBody.innerHTML = '';

        if (snapshot.empty) {
            tableAliadosBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #888;">No hay aliados comerciales registrados. Haz clic en '+ Nuevo Aliado'.</td></tr>`;
            return;
        }

        const aliadosArray = [];
        snapshot.forEach(d => aliadosArray.push({ id: d.id, ...d.data() }));

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

    const btnSaveBilling = document.getElementById('btn-save-sandia-billing');
    const selectPlan = document.getElementById('sandia-plan');
    const inputVencimiento = document.getElementById('sandia-vencimiento');

    const visitasCountEl = document.getElementById('sandia-visitas-count');
    const btnResetVisitas = document.getElementById('btn-reset-sandia-visitas');

    // Escuchar cambios de configuración en Firestore
    onSnapshot(doc(db, "sandia_config", "general"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (selectStatus && data.estadoWeb) selectStatus.value = data.estadoWeb;
            if (badgeStatus) {
                if (data.estadoWeb === 'ONLINE') badgeStatus.style.background = '#2ecc71';
                else if (data.estadoWeb === 'MANTENIMIENTO') badgeStatus.style.background = '#f39c12';
                else badgeStatus.style.background = '#e74c3c';
            }
            if (selectPlan && data.plan) selectPlan.value = data.plan;
            if (inputVencimiento && data.vencimiento) inputVencimiento.value = data.vencimiento;
            if (visitasCountEl) {
                const totalVisitas = data.visitas || 0;
                visitasCountEl.innerText = totalVisitas.toLocaleString('es-VE');
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

    if (btnSaveBilling) {
        btnSaveBilling.addEventListener('click', async () => {
            const plan = selectPlan.value;
            const vencimiento = inputVencimiento.value;
            btnSaveBilling.disabled = true;
            btnSaveBilling.innerText = "Guardando...";
            try {
                await setDoc(doc(db, "sandia_config", "general"), { plan, vencimiento, mensualidad: 20, fechaModificacion: new Date().toISOString() }, { merge: true });
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
// IMPORTACIÓN AUTOMÁTICA DE DATOS INICIALES
// ==========================================
async function seedInitialSandiaData() {
    if (!confirm("¿Deseas importar los eventos y aliados iniciales a la base de datos de Firebase Firestore?")) return;

    const btn = document.getElementById('btn-seed-sandia-data');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Importando...";
    }

    try {
        // Eventos Iniciales Oficiales
        const eventosBase = [
            {
                titulo: "5K Paraguaná Horror Story",
                dia: "31",
                mes: "OCT",
                ubicacion: "Sambil Paraguaná / 7:00 PM",
                categoria: "SANDIA",
                imagen: "paraguanahorror.jpeg",
                enlace: "paraguanahorror.html",
                textoBoton: "Inscribirme Ahora 🎃",
                estado: "ACTIVO",
                destacado_index: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Coffee Run ¡Madre Mía! 3K Vol. 2",
                dia: "27",
                mes: "SEP",
                ubicacion: "Av. Francisco de Miranda / Madre Mía",
                categoria: "REGIONAL",
                imagen: "madremia.jpg",
                enlace: "https://forms.gle/CqN4gF54xLK3vo6T6",
                textoBoton: "Inscribirme en Google Forms",
                estado: "ACTIVO",
                destacado_index: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                titulo: "Coffee Run 3K Vol. 1",
                dia: "10",
                mes: "AGO",
                ubicacion: "Terraza Tinaja",
                categoria: "SANDIA",
                imagen: "coffee_run.png",
                enlace: "",
                textoBoton: "Galería de Fotos",
                estado: "COMPLETADO",
                destacado_index: false,
                fechaCreacion: new Date().toISOString()
            }
        ];

        for (let idx = 0; idx < eventosBase.length; idx++) {
            await addDoc(collection(db, "sandia_eventos"), { ...eventosBase[idx], orden: idx });
        }

        // Aliados Iniciales Oficiales
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

        alert("🎉 ¡Datos iniciales importados con éxito a Firebase Firestore!");
    } catch (error) {
        console.error("Error sembrando datos:", error);
        alert("Error al importar datos: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "🌱 Importar Datos Iniciales";
        }
    }
}