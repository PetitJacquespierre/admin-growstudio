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

    // Modal Crear/Editar Evento
    const btnNewEvent = document.getElementById('btn-new-sandia-event');
    const modalEvent = document.getElementById('modal-sandia-event');
    const btnCloseEventModal = document.getElementById('btn-close-sandia-event');
    const formEvent = document.getElementById('form-sandia-event');
    const selectEventImg = document.getElementById('sandia-event-img-select');
    const eventImgPreview = document.getElementById('sandia-event-img-preview');

    // Poblar Selector de Imágenes
    if (selectEventImg) {
        selectEventImg.innerHTML = '<option value="">-- Selecciona una imagen --</option>' + 
            sandiaImagesList.map(img => `<option value="${img}">${img}</option>`).join('');
        
        selectEventImg.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val) {
                eventImgPreview.src = `../Sandia Production/img/${val}`;
                eventImgPreview.style.display = 'block';
            } else {
                eventImgPreview.style.display = 'none';
            }
        });
    }

    if (btnNewEvent) {
        btnNewEvent.addEventListener('click', () => {
            currentEventId = null;
            formEvent.reset();
            document.getElementById('sandia-modal-title').innerText = "🏆 Nuevo Evento Deportivo";
            eventImgPreview.style.display = 'none';
            modalEvent.style.display = 'flex';
        });
    }

    if (btnCloseEventModal) {
        btnCloseEventModal.addEventListener('click', () => {
            modalEvent.style.display = 'none';
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
                imagen: document.getElementById('sandia-event-img-select').value || document.getElementById('sandia-event-custom-img').value.trim() || "Isotipo.png",
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

    if (btnNewAliado) {
        btnNewAliado.addEventListener('click', () => {
            modalAliado.style.display = 'flex';
        });
    }

    if (btnCloseAliadoModal) {
        btnCloseAliadoModal.addEventListener('click', () => {
            modalAliado.style.display = 'none';
        });
    }

    if (formAliado) {
        formAliado.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('sandia-aliado-nombre').value.trim();
            const imagen = document.getElementById('sandia-aliado-img').value.trim();
            const enlace = document.getElementById('sandia-aliado-enlace').value.trim() || "#";

            try {
                await addDoc(collection(db, "sandia_aliados"), {
                    nombre,
                    imagen,
                    enlace,
                    activo: true,
                    fechaCreacion: new Date().toISOString()
                });
                modalAliado.style.display = 'none';
                formAliado.reset();
            } catch (err) {
                console.error("Error guardando aliado:", err);
                alert("Error: " + err.message);
            }
        });
    }
}

// Cargar Datos en Tiempo Real
function loadSandiaData() {
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
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">No hay eventos registrados. Haz clic en '+ Nuevo Evento'.</td></tr>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const ev = docSnap.data();
            const id = docSnap.id;
            
            let badgeEstado = '';
            if (ev.estado === 'ACTIVO') badgeEstado = '<span style="background: rgba(46, 204, 113, 0.2); color: #2ecc71; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🟢 Próximo (Activo)</span>';
            else if (ev.estado === 'COMPLETADO') badgeEstado = '<span style="background: rgba(230, 126, 34, 0.2); color: #e67e22; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🏁 Completado</span>';
            else badgeEstado = '<span style="background: rgba(149, 165, 166, 0.2); color: #95a5a6; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">⚪ Oculto (Borrador)</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="../Sandia Production/img/${ev.imagen}" onerror="this.src='../Sandia Production/img/Isotipo.png'" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
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
                <td style="text-align: right;">
                    <button class="btn-secondary btn-small btn-edit-event" data-id="${id}" style="margin-right: 5px;">✏️ Editar</button>
                    <button class="btn-secondary btn-small btn-del-event" data-id="${id}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">🗑️</button>
                </td>
            `;

            tr.querySelector('.btn-edit-event').addEventListener('click', () => editEvent(id, ev));
            tr.querySelector('.btn-del-event').addEventListener('click', () => deleteEvent(id, ev.titulo));

            tableBody.appendChild(tr);
        });
    });

    // Aliados
    const qAliados = query(collection(db, "sandia_aliados"));
    unsubscribeAliados = onSnapshot(qAliados, (snapshot) => {
        if (!tableAliadosBody) return;
        tableAliadosBody.innerHTML = '';

        if (snapshot.empty) {
            tableAliadosBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">No hay aliados comerciales registrados.</td></tr>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const al = docSnap.data();
            const id = docSnap.id;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="../Sandia Production/img/${al.imagen}" onerror="this.src='../Sandia Production/img/Isotipo.png'" style="width: 35px; height: 35px; object-fit: contain; background: #fff; border-radius: 6px; padding: 2px;">
                        <strong>${al.nombre}</strong>
                    </div>
                </td>
                <td><span style="font-size: 12px; color: #888;">img/${al.imagen}</span></td>
                <td><a href="${al.enlace}" target="_blank" style="color: var(--brand-cyan); text-decoration: none; font-size: 12px;">${al.enlace}</a></td>
                <td style="text-align: right;">
                    <button class="btn-secondary btn-small btn-del-aliado" data-id="${id}" style="color: #ef4444;">🗑️</button>
                </td>
            `;

            tr.querySelector('.btn-del-aliado').addEventListener('click', () => deleteAliado(id, al.nombre));
            tableAliadosBody.appendChild(tr);
        });
    });
}

function editEvent(id, ev) {
    currentEventId = id;
    document.getElementById('sandia-modal-title').innerText = "✏️ Editar Evento Deportivo";
    document.getElementById('sandia-event-titulo').value = ev.titulo || '';
    document.getElementById('sandia-event-dia').value = ev.dia || '';
    document.getElementById('sandia-event-mes').value = ev.mes || '';
    document.getElementById('sandia-event-ubicacion').value = ev.ubicacion || '';
    document.getElementById('sandia-event-categoria').value = ev.categoria || 'SANDIA';
    document.getElementById('sandia-event-enlace').value = ev.enlace || '';
    document.getElementById('sandia-event-boton-texto').value = ev.textoBoton || 'Inscribirme Ahora';
    document.getElementById('sandia-event-img-select').value = sandiaImagesList.includes(ev.imagen) ? ev.imagen : '';
    document.getElementById('sandia-event-custom-img').value = !sandiaImagesList.includes(ev.imagen) ? ev.imagen : '';
    document.getElementById('sandia-event-estado').value = ev.estado || 'ACTIVO';
    document.getElementById('sandia-event-destacado').checked = !!ev.destacado_index;

    const eventImgPreview = document.getElementById('sandia-event-img-preview');
    if (ev.imagen) {
        eventImgPreview.src = `../Sandia Production/img/${ev.imagen}`;
        eventImgPreview.style.display = 'block';
    } else {
        eventImgPreview.style.display = 'none';
    }

    document.getElementById('modal-sandia-event').style.display = 'flex';
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