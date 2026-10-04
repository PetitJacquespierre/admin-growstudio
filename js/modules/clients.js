import { db, collection, getDocs, doc, getDoc, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';

// ==========================================
// SISTEMA DE NOTIFICACIONES TOAST FLOTANTES
// ==========================================
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const borderColor = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#f59e0b');
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚠️');

    toast.style.cssText = `
        background: #18181b;
        color: #f4f4f5;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-left: 4px solid ${borderColor};
        padding: 12px 18px;
        border-radius: 8px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.7);
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 250px;
        max-width: 380px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(15px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Segoe UI', sans-serif;
    `;

    toast.innerHTML = `<span style="font-size: 16px;">${icon}</span> <span style="line-height: 1.4;">${message}</span>`;
    container.appendChild(toast);

    // Entrada animada
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Salida animada
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
};

// ==========================================
// GESTIÓN DE CLIENTES SAAS
// ==========================================
state.allClientsCache = [];

window.renderClientsList = function(clientsToRender) {
    DOM.clientsUl.innerHTML = '';

    if (!clientsToRender || clientsToRender.length === 0) {
        DOM.clientsUl.innerHTML = '<li style="color:gray; font-size: 12px; padding: 10px;">No se encontraron clientes</li>';
        return;
    }

    clientsToRender.forEach(({ id, data }) => {
        const li = document.createElement('li');
        const isActive = data.estado === 'ACTIVO';
        const statusColor = isActive ? '#10b981' : '#ef4444';
        const planText = data.plan ? `[${data.plan}]` : '';

        li.innerHTML = `
            <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
                🏪 ${data.businessName || data.nombre || id}
            </span>
            <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: flex; justify-content: space-between;">
                <span>Estado: <strong style="color: ${statusColor}">${data.estado || 'INACTIVO'}</strong> ${planText}</span>
                <span style="color: ${parseFloat(data.deuda || 0) > 0 ? '#ef4444' : '#a1a1aa'}">Deuda: $${data.deuda || 0}</span>
            </div>
        `;

        if (state.currentClientId === id) {
            li.classList.add('active');
        }

        li.onclick = () => window.openClientManager(id, data, li);
        DOM.clientsUl.appendChild(li);
    });
};

window.loadClients = async function() {
    DOM.clientsUl.innerHTML = '<li style="color:gray; padding: 10px; font-size: 12px;">Cargando clientes... ⏳</li>';
    try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        state.allClientsCache = [];

        if (querySnapshot.empty) {
            DOM.clientsUl.innerHTML = '<li style="color:gray; padding: 10px; font-size: 12px;">No hay clientes registrados aún</li>';
            const badge = document.getElementById('clients-count-badge');
            if (badge) badge.innerText = '0';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            state.allClientsCache.push({
                id: docSnap.id,
                data: docSnap.data()
            });
        });

        // Ordenar alfabéticamente por nombre
        state.allClientsCache.sort((a, b) => {
            const nameA = (a.data.businessName || a.data.nombre || a.id).toLowerCase();
            const nameB = (b.data.businessName || b.data.nombre || b.id).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // Actualizar contador del badge
        const badge = document.getElementById('clients-count-badge');
        if (badge) badge.innerText = state.allClientsCache.length.toString();

        window.renderClientsList(state.allClientsCache);
    } catch (error) {
        console.error("Error cargando clientes:", error);
        DOM.clientsUl.innerHTML = '<li style="color:#ef4444; padding: 10px; font-size: 12px;">Error de conexión con Firebase</li>';
        window.showToast("Error de conexión al cargar clientes", "error");
    }
};

// ==========================================
// BUSCADOR EN VIVO Y FILTROS DE COBRANZA EN EL SIDEBAR (FASE 1.2 Y 3.1)
// ==========================================
state.activeBillingFilter = 'ALL';

window.filterAndRenderClients = function() {
    const searchEl = document.getElementById('clients-search-input');
    const query = searchEl ? searchEl.value.toLowerCase().trim() : '';
    const activeFilter = state.activeBillingFilter || 'ALL';
    const hoy = new Date();

    let filtered = state.allClientsCache || [];

    // 1. Aplicar filtro de cobranza
    if (activeFilter !== 'ALL') {
        filtered = filtered.filter(item => {
            const data = item.data || {};
            const deuda = parseFloat(data.deuda || 0);
            const vencStr = data.fechaVencimiento;
            let diffDays = 999;
            
            if (vencStr) {
                const fechaV = new Date(vencStr + 'T00:00:00');
                diffDays = Math.ceil((fechaV - hoy) / (1000 * 60 * 60 * 24));
            }

            if (activeFilter === 'EXPIRING') {
                // Por vencer en 7 días o menos, o recién vencido en los últimos 3 días
                return diffDays >= -3 && diffDays <= 7;
            } else if (activeFilter === 'DEBTORS') {
                // Clientes con deuda pendiente > 0 o vencidos (diffDays < 0) o suspendidos
                return deuda > 0 || diffDays < 0 || data.estado === 'SUSPENDIDO' || data.estado === 'INACTIVO';
            }
            return true;
        });
    }

    // 2. Aplicar búsqueda de texto
    if (query) {
        filtered = filtered.filter(item => {
            const name = (item.data.businessName || item.data.nombre || '').toLowerCase();
            const id = item.id.toLowerCase();
            const plan = (item.data.plan || '').toLowerCase();
            const cedula = (item.data.cedula || '').toLowerCase();
            return name.includes(query) || id.includes(query) || plan.includes(query) || cedula.includes(query);
        });
    }

    // Actualizar badge con el número de clientes filtrados vs total
    const badge = document.getElementById('clients-count-badge');
    if (badge) {
        if (activeFilter === 'ALL' && !query) {
            badge.innerText = state.allClientsCache.length.toString();
        } else {
            badge.innerText = `${filtered.length}/${state.allClientsCache.length}`;
        }
    }

    window.renderClientsList(filtered);
}

const searchInput = document.getElementById('clients-search-input');
if (searchInput) {
    searchInput.addEventListener('input', () => filterAndRenderClients());
}

// Inicializar botones de filtro de cobranza
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.btn-filter-billing');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#a1a1aa';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--brand-cyan)';
            btn.style.color = '#000';

            state.activeBillingFilter = btn.getAttribute('data-filter') || 'ALL';
            filterAndRenderClients();
        });
    });
});

// ==========================================
// MODAL MODERNO DE "+ NUEVO CLIENTE"
// ==========================================
const modalNewClient = document.getElementById('modal-new-client');
const formNewClient = document.getElementById('form-new-client');
const ncError = document.getElementById('nc-error');

function openNewClientModal() {
    document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
    DOM.btnNewClient.classList.add('active');

    if (formNewClient) formNewClient.reset();
    if (ncError) {
        ncError.style.display = 'none';
        ncError.innerText = '';
    }

    if (modalNewClient) {
        modalNewClient.style.display = 'flex';
        const idInput = document.getElementById('nc-id');
        if (idInput) setTimeout(() => idInput.focus(), 50);
    }
}

function closeNewClientModal() {
    DOM.btnNewClient.classList.remove('active');
    if (modalNewClient) modalNewClient.style.display = 'none';
}

DOM.btnNewClient.addEventListener('click', openNewClientModal);

const btnCloseNc = document.getElementById('btn-close-new-client');
if (btnCloseNc) btnCloseNc.addEventListener('click', closeNewClientModal);

const btnCancelNc = document.getElementById('btn-cancel-new-client');
if (btnCancelNc) btnCancelNc.addEventListener('click', closeNewClientModal);

// Cerrar al hacer clic en el backdrop oscuro
if (modalNewClient) {
    modalNewClient.addEventListener('click', (e) => {
        if (e.target === modalNewClient) closeNewClientModal();
    });
}

// Procesar creación de cliente
if (formNewClient) {
    formNewClient.addEventListener('submit', async (e) => {
        e.preventDefault();

        const rawId = document.getElementById('nc-id').value.trim();
        const id = rawId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const name = document.getElementById('nc-name').value.trim();
        const whatsapp = document.getElementById('nc-whatsapp').value.trim();
        const cedula = document.getElementById('nc-cedula') ? document.getElementById('nc-cedula').value.trim() : '';
        const plan = document.getElementById('nc-plan') ? document.getElementById('nc-plan').value : 'ANUAL';
        const instagram = document.getElementById('nc-instagram') ? document.getElementById('nc-instagram').value.trim() : '';
        const url = document.getElementById('nc-url') ? document.getElementById('nc-url').value.trim() : '';
        const submitBtn = document.getElementById('btn-submit-new-client');

        if (!id || !name || !whatsapp) {
            ncError.innerText = 'Por favor completa el ID, Nombre Comercial y WhatsApp.';
            ncError.style.display = 'block';
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Creando... ⏳';

            // 1. Verificar si el ID ya existe en Firestore
            const existingDoc = await getDoc(doc(db, "clientes", id));
            if (existingDoc.exists()) {
                ncError.innerText = `El ID "${id}" ya está en uso. Elige otro para no sobrescribir datos.`;
                ncError.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerText = '🚀 Crear Cliente';
                return;
            }

            // 2. Calcular fecha de vencimiento inicial
            const hoy = new Date();
            let diasSumar = 365;
            if (plan === 'PRUEBA') diasSumar = 7;
            else if (plan === 'MENSUAL') diasSumar = 30;

            hoy.setDate(hoy.getDate() + diasSumar);
            const yyyy = hoy.getFullYear();
            const mm = String(hoy.getMonth() + 1).padStart(2, '0');
            const dd = String(hoy.getDate()).padStart(2, '0');
            const fechaVencimiento = `${yyyy}-${mm}-${dd}`;

            // 3. Crear documento en Firebase Firestore
            const newClientData = {
                businessName: name,
                estado: "ACTIVO",
                tiendaAbierta: "AUTO",
                whatsapp: whatsapp,
                cedula: cedula,
                plan: plan,
                fechaVencimiento: fechaVencimiento,
                deuda: 0,
                instagram: instagram,
                url: url,
                visitas: 0,
                productos: [],
                promos: [
                    { imagen: 'promo1.jpg', activo: 'NO' },
                    { imagen: 'promo2.jpg', activo: 'NO' }
                ]
            };

            await setDoc(doc(db, "clientes", id), newClientData);

            closeNewClientModal();
            window.showToast(`¡Cliente "${name}" creado exitosamente! 🚀`, 'success');
            await window.loadClients();

            // Abrir automáticamente el gestor del nuevo cliente
            window.openClientManager(id, newClientData, null);

        } catch (error) {
            console.error("Error creando cliente:", error);
            ncError.innerText = 'Error al guardar en Firebase: ' + error.message;
            ncError.style.display = 'block';
            window.showToast('Error al crear cliente', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = '🚀 Crear Cliente';
        }
    });
}
