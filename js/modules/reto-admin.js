import { db, doc, deleteDoc, onSnapshot, setDoc } from "./firebase-init.js";

let unsubscribeRetoCupones = null;
let allRetoCuponesCache = [];

function obtenerMaxUsosReto(tipo, maxUsosField) {
    const mapa = {
        'UN_SOLO_USO': 1,
        'DOS_USOS': 2,
        'TRES_USOS': 3,
        'CINCO_USOS': 5,
        'DIEZ_USOS': 10
    };
    if (mapa[tipo]) return mapa[tipo];
    if (typeof maxUsosField === 'number' && maxUsosField > 0) return maxUsosField;
    return null;
}

function calcularEstadoCuponReto(c) {
    const tipoCupon = c.tipo || 'REUTILIZABLE';
    const maxUsos = obtenerMaxUsosReto(tipoCupon, c.maxUsos);
    const esReutilizable = maxUsos === null;
    const usosActuales = Number(c.usosCount !== undefined ? c.usosCount : (c.estado === 'USADO' ? 1 : 0));
    const estaUsado = !esReutilizable && (c.estado === 'USADO' || usosActuales >= maxUsos);
    const estaHabilitado = c.estado === 'HABILITADO' || (c.habilitado === true && !estaUsado);

    if (estaUsado) return 'USADO';
    if (estaHabilitado) return 'ACTIVO';
    return 'PAUSADO';
}

function copiarTextoFallback(texto) {
    const tempInput = document.createElement("input");
    tempInput.value = texto;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand("copy");
        if (window.showToast) window.showToast("¡Enlace VIP copiado! 📋");
        else alert(`¡Enlace VIP copiado!\n\n${texto}`);
    } catch (e) {
        prompt("Copia manualmente este enlace VIP:", texto);
    }
    document.body.removeChild(tempInput);
}

function renderRetoCuponesFiltrados() {
    const tbody = document.getElementById('reto-cupones-tbody');
    const selectFiltro = document.getElementById('select-filtro-reto-cupones-estado');
    const inputSearch = document.getElementById('input-search-reto-cupones');
    const badgeCount = document.getElementById('reto-cupones-count-badge');
    if (!tbody) return;

    tbody.innerHTML = '';
    const estadoFiltro = selectFiltro ? selectFiltro.value : 'TODOS';
    const queryTxt = inputSearch ? inputSearch.value.trim().toLowerCase() : '';

    const filtrados = allRetoCuponesCache.filter(c => {
        const est = calcularEstadoCuponReto(c);
        if (estadoFiltro !== 'TODOS' && est !== estadoFiltro) return false;
        if (!queryTxt) return true;
        const cod = (c.id || '').toLowerCase();
        const nom = (c.ultimoAtleta && c.ultimoAtleta.nombre ? c.ultimoAtleta.nombre : '').toLowerCase();
        return cod.includes(queryTxt) || nom.includes(queryTxt);
    });

    if (badgeCount) {
        const suffix = estadoFiltro === 'TODOS' ? '' : ` • ${estadoFiltro}`;
        badgeCount.innerText = `${filtrados.length} / ${allRetoCuponesCache.length} cupones${suffix}`;
    }

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: #888;">No hay cupones registrados aún. Haz clic en "+ Crear Cupón VIP" arriba.</td></tr>`;
        return;
    }

    filtrados.forEach(c => {
        const id = c.id;
        const tipoCupon = c.tipo || 'REUTILIZABLE';
        const maxUsos = obtenerMaxUsosReto(tipoCupon, c.maxUsos);
        const usosActuales = Number(c.usosCount || 0);
        const precioUSD = c.precioUSD !== undefined ? Number(c.precioUSD) : 20;
        const estaUsado = maxUsos !== null && (c.estado === 'USADO' || usosActuales >= maxUsos);
        const estaHabilitado = c.estado === 'HABILITADO' || (c.habilitado === true && !estaUsado);

        let badgeEstado = '';
        if (estaUsado) badgeEstado = `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🔒 Canjeado</span>`;
        else if (estaHabilitado) badgeEstado = `<span style="background: rgba(46, 204, 113, 0.2); color: #2ecc71; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">🟢 Activo</span>`;
        else badgeEstado = `<span style="background: rgba(149, 165, 166, 0.2); color: #95a5a6; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">⏸️ Pausado</span>`;

        const badgeTipo = maxUsos !== null
            ? `<span style="background: rgba(255, 165, 0, 0.15); color: #ffa500; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">🔒 ${maxUsos === 1 ? '1 Solo Uso' : maxUsos + ' Usos'}</span>`
            : `<span style="background: rgba(0, 210, 255, 0.15); color: #00d2ff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">♾️ Multiuso</span>`;

        const badgePrecio = precioUSD === 0
            ? `<span style="color: #00ff66; font-weight: 800; font-size: 12px;">GRATIS ($0)</span>`
            : `<span style="color: #ffffff; font-weight: 800; font-size: 12px;">$${precioUSD.toFixed(2)} USD</span>`;

        const infoAtleta = c.ultimoAtleta && c.ultimoAtleta.nombre ? ` <span style="font-size:10px; color:#888;">(${c.ultimoAtleta.nombre})</span>` : '';
        const canjesText = maxUsos !== null
            ? `<strong style="color: #00d2ff;">${usosActuales} / ${maxUsos}</strong> usos${infoAtleta}`
            : `<strong style="color: #00d2ff;">${usosActuales}</strong> canjes${infoAtleta}`;

        const linkVIP = `https://www.retovirtualvzla.com/inscripcion.html?vip=${id}`;

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.innerHTML = `
            <td style="padding: 10px 14px;"><strong style="color: #00d2ff; font-family: monospace; font-size: 13px;">${id}</strong></td>
            <td style="padding: 10px 14px;">${badgePrecio}</td>
            <td style="padding: 10px 14px;">${badgeTipo}</td>
            <td style="padding: 10px 14px;">${badgeEstado}</td>
            <td style="padding: 10px 14px; font-size: 12px;">${canjesText}</td>
            <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
                <button class="btn-secondary btn-small btn-copiar-reto-vip" style="margin-right: 6px; font-size: 11px; background: rgba(0, 210, 255, 0.12); border-color: #00d2ff; color: #00d2ff; font-weight: 700; padding: 5px 10px; border-radius: 6px; cursor: pointer;">
                    🔗 Copiar Link VIP
                </button>
                <button class="btn-secondary btn-small btn-edit-reto-cupon" style="margin-right: 4px; font-size: 11px; border-color: rgba(255,255,255,0.25); padding: 5px 8px; cursor: pointer;">✏️</button>
                <button class="btn-secondary btn-small btn-toggle-reto-cupon" style="margin-right: 4px; font-size: 11px; color: ${estaHabilitado ? '#f39c12' : '#2ecc71'}; border-color: ${estaHabilitado ? 'rgba(243, 156, 18, 0.4)' : 'rgba(46, 204, 113, 0.4)'}; padding: 5px 9px; cursor: pointer;">
                    ${estaHabilitado ? 'Pausar' : 'Activar'}
                </button>
                <button class="btn-secondary btn-small btn-del-reto-cupon" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); font-size: 11px; padding: 5px 8px; cursor: pointer;">🗑️</button>
            </td>
        `;

        const btnCopiar = tr.querySelector('.btn-copiar-reto-vip');
        btnCopiar.addEventListener('click', () => {
            const onCopied = () => {
                const orig = btnCopiar.innerHTML;
                btnCopiar.innerHTML = '✔ ¡Copiado!';
                btnCopiar.style.background = 'rgba(0, 255, 102, 0.2)';
                btnCopiar.style.borderColor = '#00ff66';
                btnCopiar.style.color = '#00ff66';
                setTimeout(() => {
                    btnCopiar.innerHTML = orig;
                    btnCopiar.style.background = 'rgba(0, 210, 255, 0.12)';
                    btnCopiar.style.borderColor = '#00d2ff';
                    btnCopiar.style.color = '#00d2ff';
                }, 2000);
                if (window.showToast) window.showToast(`¡Enlace VIP copiado! 🎟️ Listo para WhatsApp: ${linkVIP}`);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(linkVIP).then(onCopied).catch(() => copiarTextoFallback(linkVIP));
            } else {
                copiarTextoFallback(linkVIP);
            }
        });

        tr.querySelector('.btn-edit-reto-cupon').addEventListener('click', () => {
            const modal = document.getElementById('modal-editar-reto-cupon');
            document.getElementById('edit-reto-cupon-id').value = id;
            document.getElementById('edit-reto-cupon-codigo').value = id;
            document.getElementById('edit-reto-cupon-precio').value = precioUSD;
            document.getElementById('edit-reto-cupon-tipo').value = tipoCupon;
            if (modal) modal.style.display = 'flex';
        });

        tr.querySelector('.btn-toggle-reto-cupon').addEventListener('click', async () => {
            const nuevoEstado = estaHabilitado ? 'PAUSADO' : 'HABILITADO';
            await setDoc(doc(db, "reto_cupones_10k", id), {
                estado: nuevoEstado,
                habilitado: !estaHabilitado,
                fechaActualizacion: new Date().toISOString()
            }, { merge: true });
        });

        tr.querySelector('.btn-del-reto-cupon').addEventListener('click', async () => {
            if (confirm(`¿Eliminar el cupón VIP "${id}"?`)) {
                await deleteDoc(doc(db, "reto_cupones_10k", id));
            }
        });

        tbody.appendChild(tr);
    });
}

function loadRetoData() {
    if (unsubscribeRetoCupones) return;
    unsubscribeRetoCupones = onSnapshot(
        // Importado dinámicamente o vía firebase-init
        window.firestoreCollection ? window.firestoreCollection(db, "reto_cupones_10k") : null,
        () => {}
    );
}

export async function initRetoAdmin() {
    const { collection } = await import("./firebase-init.js");

    window.openRetoScreen = function() {
        const btnNavReto = document.getElementById('btn-nav-reto');
        const retoScreen = document.getElementById('reto-screen');
        document.querySelectorAll('#dashboard-screen > main > section').forEach(sec => sec.style.display = 'none');
        document.querySelectorAll('.menu-btn, .menu-list li').forEach(el => el.classList.remove('active'));
        if (btnNavReto) btnNavReto.classList.add('active');
        if (retoScreen) {
            retoScreen.style.display = 'flex';
            if (!unsubscribeRetoCupones) {
                unsubscribeRetoCupones = onSnapshot(collection(db, "reto_cupones_10k"), (snapshot) => {
                    allRetoCuponesCache = [];
                    snapshot.forEach(d => allRetoCuponesCache.push({ id: d.id, ...d.data() }));
                    allRetoCuponesCache.sort((a, b) => new Date(b.fechaActualizacion || b.fechaCreacion || 0) - new Date(a.fechaActualizacion || a.fechaCreacion || 0));
                    renderRetoCuponesFiltrados();
                });
            }
        }
        if (typeof window.cerrarSidebarMobile === 'function') window.cerrarSidebarMobile();
    };

    const btnNuevo = document.getElementById('btn-nuevo-cupon-reto');
    const boxCrear = document.getElementById('box-crear-cupon-reto');
    const btnCancelar = document.getElementById('btn-cancelar-reto-cupon');
    const btnGuardar = document.getElementById('btn-guardar-reto-cupon');

    if (btnNuevo && boxCrear) {
        btnNuevo.addEventListener('click', () => {
            boxCrear.style.display = boxCrear.style.display === 'none' ? 'block' : 'none';
        });
    }
    if (btnCancelar && boxCrear) {
        btnCancelar.addEventListener('click', () => { boxCrear.style.display = 'none'; });
    }
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const codigo = (document.getElementById('input-reto-cupon-codigo').value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
            const precioUSD = Math.max(0, parseFloat(document.getElementById('input-reto-cupon-precio').value) || 0);
            const tipo = document.getElementById('select-reto-cupon-tipo').value;
            const maxUsos = obtenerMaxUsosReto(tipo);

            if (!codigo) return alert("Ingresa un código válido (ej: GROW10K).");

            btnGuardar.disabled = true;
            btnGuardar.innerText = "Guardando...";
            try {
                await setDoc(doc(db, "reto_cupones_10k", codigo), {
                    codigo,
                    precioUSD,
                    tipo,
                    maxUsos,
                    usosCount: 0,
                    estado: 'HABILITADO',
                    habilitado: true,
                    fechaCreacion: new Date().toISOString(),
                    fechaActualizacion: new Date().toISOString()
                }, { merge: true });

                document.getElementById('input-reto-cupon-codigo').value = '';
                boxCrear.style.display = 'none';
                if (window.showToast) window.showToast(`✅ Cupón VIP ${codigo} activado ($${precioUSD} USD).`);
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.innerText = "Guardar y Activar";
            }
        });
    }

    const inputSearch = document.getElementById('input-search-reto-cupones');
    const selectFiltro = document.getElementById('select-filtro-reto-cupones-estado');
    if (inputSearch) inputSearch.addEventListener('input', renderRetoCuponesFiltrados);
    if (selectFiltro) selectFiltro.addEventListener('change', renderRetoCuponesFiltrados);

    const formEditar = document.getElementById('form-editar-reto-cupon');
    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-reto-cupon-id').value;
            const precioUSD = Math.max(0, parseFloat(document.getElementById('edit-reto-cupon-precio').value) || 0);
            const tipo = document.getElementById('edit-reto-cupon-tipo').value;
            const maxUsos = obtenerMaxUsosReto(tipo);

            await setDoc(doc(db, "reto_cupones_10k", id), {
                precioUSD,
                tipo,
                maxUsos,
                estado: 'HABILITADO',
                habilitado: true,
                fechaActualizacion: new Date().toISOString()
            }, { merge: true });

            document.getElementById('modal-editar-reto-cupon').style.display = 'none';
            if (window.showToast) window.showToast(`✔ Cupón ${id} actualizado.`);
        });
    }
}
