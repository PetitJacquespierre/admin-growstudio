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
    if (!img || typeof img !== 'string') return 'img/growisotipo.png';
    const trimmed = img.trim();
    if (!trimmed) return 'img/growisotipo.png';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        return trimmed;
    }
    const clean = trimmed.replace(/^img\//, '');
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

            const imgSrc = resolveSandiaImgPath(ev.imagen);
            const tr = document.createElement('tr');
            tr.innerHTML = `
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
            tableAliadosBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">No hay aliados comerciales registrados. Haz clic en '+ Nuevo Aliado'.</td></tr>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const al = docSnap.data();
            const id = docSnap.id;
            const imgSrc = resolveSandiaImgPath(al.imagen);
            const tr = document.createElement('tr');
            tr.innerHTML = `
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
        }
    });

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

        for (const ev of eventosBase) {
            await addDoc(collection(db, "sandia_eventos"), ev);
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

        for (const al of aliadosBase) {
            await addDoc(collection(db, "sandia_aliados"), al);
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