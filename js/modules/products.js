import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// RENDERIZADO Y CONTROL DE PRODUCTOS Y PROMOS
// ==========================================
 // Guardar datos para actualizaciones rápidas

window.openClientManager = async function(id, data, liElement) {
    try {
        state.currentClientId = id;
        state.currentClientData = data || {};
        
        // Ocultar todas las secciones del contenido principal y mostrar client-manager
        document.querySelectorAll('.main-content > section, #dashboard-screen > main > section').forEach(sec => {
            sec.style.display = 'none';
        });
        if (DOM.clientManager) {
            DOM.clientManager.style.display = 'block';
        } else {
            const cm = document.getElementById('client-manager');
            if (cm) cm.style.display = 'block';
        }

        // Título y Enlace a la tienda
        const clientDisplayName = data.businessName || data.nombre || id;
        if (DOM.managerTitle) {
            DOM.managerTitle.innerHTML = '';
            const titleText = document.createTextNode(`Menú de: ${clientDisplayName} `);
            DOM.managerTitle.appendChild(titleText);
            
            if (DOM.clientLink) {
                if (data.url) {
                    DOM.clientLink.href = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                    DOM.clientLink.style.display = 'inline-block';
                    DOM.managerTitle.appendChild(DOM.clientLink);
                } else {
                    DOM.clientLink.style.display = 'none';
                }
            }
        }

        const heroUrlInput = document.getElementById('client-hero-url');
        if (heroUrlInput) heroUrlInput.value = data.headerMedia || '';

        if (document.getElementById('client-mensualidad')) {
            document.getElementById('client-mensualidad').value = data.mensualidad || 0;
            document.getElementById('client-deuda').value = data.deuda || 0;
            document.getElementById('client-corte').value = data.diaCorte || 1;
        }

        if (DOM.clientStatus) DOM.clientStatus.value = data.estado || "ACTIVO";
        if (DOM.storeStatus) DOM.storeStatus.value = data.tiendaAbierta || "AUTO";
        if (DOM.clientWhatsapp) DOM.clientWhatsapp.value = data.whatsapp || "";
        if (DOM.clientInstagram) DOM.clientInstagram.value = data.instagram || "";
        if (DOM.clientUrl) DOM.clientUrl.value = data.url || "";
        if (DOM.btnDeleteClient) DOM.btnDeleteClient.style.display = 'block';
        
        if (DOM.receiveOrdersEl) DOM.receiveOrdersEl.checked = (data.recibirPedidos !== false);
        const visitasEl = document.getElementById('client-visitas');
        if (visitasEl) visitasEl.innerText = data.visitas || 0;
        
        // Actualizar selector activo en el sidebar
        document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
        const btnNew = document.getElementById('btn-new-client');
        if (btnNew) btnNew.classList.remove('active');
        const btnSandia = document.getElementById('btn-nav-sandia');
        if (btnSandia) btnSandia.classList.remove('active');
        const btnPay = document.getElementById('btn-view-payments');
        if (btnPay) btnPay.classList.remove('active');
        if (liElement) liElement.classList.add('active');
        
        // Si no tiene promos creadas por defecto, creamos promo1 y promo2 apagadas visualmente
        if (!data.promos || data.promos.length === 0) {
            data.promos = [
                { imagen: 'promo1.jpg', activo: 'NO' },
                { imagen: 'promo2.jpg', activo: 'NO' }
            ];
        }
        
        // Poblar Facturación / Cobranza
        if (document.getElementById('client-plan')) {
            document.getElementById('client-plan').value = data.plan || 'PRUEBA';
            if (document.getElementById('client-cedula')) document.getElementById('client-cedula').value = data.cedula || '';
            const vencInput = document.getElementById('client-vencimiento');
            if (vencInput) vencInput.value = data.fechaVencimiento || '';
            const deudaInput = document.getElementById('client-deuda');
            if (deudaInput) deudaInput.value = data.deuda || 0;
            
            const indicator = document.getElementById('billing-status-indicator');
            if (indicator) {
                if (data.fechaVencimiento) {
                    const hoy = new Date();
                    const fechaV = new Date(data.fechaVencimiento + 'T00:00:00');
                    const diff = Math.ceil((fechaV - hoy) / (1000*60*60*24));
                    if (diff > 7) indicator.style.background = '#10b981';
                    else if (diff >= 0 && diff <= 7) indicator.style.background = '#f59e0b';
                    else indicator.style.background = '#ef4444';
                } else {
                    indicator.style.background = 'gray';
                }
            }
        }

        state.activeProductCategoryFilter = 'ALL';
        window.renderProducts(data.productos || []);
        window.renderPromos(data.promos || []);
        
        // Auto-scroll al contenido en móviles
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    } catch (err) {
        console.error("Error abriendo panel del cliente:", err);
        if (window.showToast) window.showToast("Error al abrir cliente: " + err.message, "error");
    }
}

// Eliminar Cliente
DOM.btnDeleteClient.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    const confirmacion = confirm(`¿Estás SEGURO de que quieres borrar a ${state.currentClientId} por completo? Esto eliminará todo su menú y configuración.`);
    if (confirmacion) {
        try {
            const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await deleteDoc(doc(db, "clientes", state.currentClientId));
            alert("Cliente eliminado correctamente.");
            DOM.clientManager.style.display = 'none';
            document.getElementById('welcome-screen').style.display = 'flex';
            DOM.btnDeleteClient.style.display = 'none';
            state.currentClientId = null;
            window.loadClients();
        } catch (error) {
            alert("Error al eliminar cliente: " + error.message);
        }
    }
});

// Cambiar estado (Kill Switch)
DOM.clientStatus.addEventListener('change', async (e) => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            estado: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar estado.");
    }
});

// Cambiar Horario (Abierto/Cerrado/Auto)
DOM.storeStatus.addEventListener('change', async (e) => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            tiendaAbierta: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar horario.");
    }
});

// Cambiar WhatsApp
DOM.btnSaveWhatsapp.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            whatsapp: DOM.clientWhatsapp.value.trim()
        });
        if (window.showToast) window.showToast("Número de WhatsApp guardado en la nube.");
        else alert("Número de WhatsApp guardado en la nube.");
    } catch (error) {
        if (window.showToast) window.showToast("Error al guardar WhatsApp.", "error");
        else alert("Error al guardar WhatsApp.");
    }
});

// Cambiar Instagram
DOM.btnSaveInstagram.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            instagram: DOM.clientInstagram.value.trim()
        });
        if (window.showToast) window.showToast("Instagram guardado en la nube.");
        else alert("Instagram guardado en la nube.");
    } catch (error) {
        if (window.showToast) window.showToast("Error al guardar Instagram.", "error");
        else alert("Error al guardar Instagram.");
    }
});

// Cambiar URL
DOM.btnSaveUrl.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const newUrl = DOM.clientUrl.value.trim();
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            url: newUrl
        });
        
        // Update the link UI immediately
        if (newUrl) {
            DOM.clientLink.href = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
            DOM.clientLink.style.display = 'inline-block';
        } else {
            DOM.clientLink.style.display = 'none';
        }
        
        if (window.showToast) window.showToast("URL de la tienda actualizada con éxito.");
        else alert("URL guardada en la nube.");
    } catch (error) {
        if (window.showToast) window.showToast("Error al guardar URL.", "error");
        else alert("Error al guardar URL.");
    }
});

// Guardar Portada (Hero Video/Imagen)
const btnSaveHero = document.getElementById('btn-save-hero');
if (btnSaveHero) {
    btnSaveHero.addEventListener('click', async () => {
        if (!state.currentClientId) return;
        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const heroUrlInput = document.getElementById('client-hero-url');
            const newHero = heroUrlInput ? heroUrlInput.value.trim() : '';
            
            await updateDoc(doc(db, "clientes", state.currentClientId), {
                headerMedia: newHero
            });
            
            const msg = newHero === '' ? "Portada eliminada (se usará el diseño normal)" : "Portada guardada exitosamente.";
            if (window.showToast) window.showToast(msg);
            else alert(msg);
        } catch (error) {
            if (window.showToast) window.showToast("Error al guardar la portada: " + error.message, "error");
            else alert("Error al guardar la portada: " + error.message);
        }
    });
}

// Visitar Tienda
DOM.btnVisitUrl.addEventListener('click', () => {
    const url = DOM.clientUrl.value.trim();
    if (url) {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(fullUrl, '_blank');
    } else {
        if (window.showToast) window.showToast("Ingresa primero un link de tienda.", "warning");
        else alert('Por favor ingresa un link de tienda primero.');
    }
});

// Productos
// ==========================================
// FASE 2: GESTIÓN DE PRODUCTOS, MINIATURAS, FILTROS Y AJUSTE MASIVO
// ==========================================
state.activeProductCategoryFilter = 'ALL';

// Helper: Limpiar nombre de archivo y corregir extensiones truncadas
function sanitizeImageFilename(filename) {
    if (!filename) return '';
    let clean = filename.trim().replace(/^img\//, '').replace(/^\.\.\/[^\/]+\/img\//, '');
    // Corregir truncamientos conocidos de la base de datos como .j o .jpe
    if (clean.endsWith('.j') || clean.endsWith('.jpe')) {
        clean = clean.replace(/\.jpe?$/, '.jpeg');
    }
    return clean;
}

// Helper: Resolver URL de imagen para preview (web o archivo local de cada cliente)
function resolveImagePreviewUrl(imgSrc) {
    if (!imgSrc || typeof imgSrc !== 'string' || imgSrc.trim() === '') {
        return 'https://placehold.co/80x80/27272a/a1a1aa?text=Sin+Foto';
    }
    const trimmed = imgSrc.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        return trimmed;
    }

    const cleanFile = sanitizeImageFilename(trimmed);

    // Mapeo conocido de carpetas locales y URLs de fallback en vivo por cliente
    const clientMetaMap = {
        'neneburger_rock': { folder: '../Burguer Rock Metal/img/', liveUrl: 'https://burger-rock-metal.vercel.app' },
        'burger_rock': { folder: '../Burguer Rock Metal/img/', liveUrl: 'https://burger-rock-metal.vercel.app' },
        'burger rock metal': { folder: '../Burguer Rock Metal/img/', liveUrl: 'https://burger-rock-metal.vercel.app' },
        'la_flaca': { folder: '../Pasteles La Flaca/img/', liveUrl: 'https://pasteles-la-flaca.vercel.app' },
        'pasteles_la_flaca': { folder: '../Pasteles La Flaca/img/', liveUrl: 'https://pasteles-la-flaca.vercel.app' },
        'pasteles la flaca': { folder: '../Pasteles La Flaca/img/', liveUrl: 'https://pasteles-la-flaca.vercel.app' },
        'foodpoint': { folder: '../The Food Point/img/', liveUrl: 'https://thefoodpoint.vercel.app' },
        'the_food_point': { folder: '../The Food Point/img/', liveUrl: 'https://thefoodpoint.vercel.app' },
        'the food point': { folder: '../The Food Point/img/', liveUrl: 'https://thefoodpoint.vercel.app' },
        'grow_studio_demo': { folder: '../Demo_Menu_Digital/img/', liveUrl: 'https://growstudiodemo.vercel.app' },
        'demo_grow_studio': { folder: '../Demo_Menu_Digital/img/', liveUrl: 'https://growstudiodemo.vercel.app' },
        'demo_menu': { folder: '../Demo_Menu_Digital/img/', liveUrl: 'https://growstudiodemo.vercel.app' },
        'demo grow studio': { folder: '../Demo_Menu_Digital/img/', liveUrl: 'https://growstudiodemo.vercel.app' },
        'cactus_empanadas': { folder: '../Cactus Empanadas/img/', liveUrl: '' },
        'mi_lechuga': { folder: '../Mi Lechuga/img/', liveUrl: '' }
    };

    const currentId = String(state.currentClientId || '').toLowerCase();
    const currentName = String((state.currentClientData && (state.currentClientData.businessName || state.currentClientData.nombre)) || '').toLowerCase();

    let matched = clientMetaMap[currentId] || clientMetaMap[currentName];

    if (!matched) {
        if (currentId.includes('rock') || currentName.includes('rock')) matched = clientMetaMap['burger_rock'];
        else if (currentId.includes('flaca') || currentName.includes('flaca')) matched = clientMetaMap['la_flaca'];
        else if (currentId.includes('food') || currentName.includes('food')) matched = clientMetaMap['foodpoint'];
        else if (currentId.includes('demo') || currentName.includes('demo') || currentId.includes('grow')) matched = clientMetaMap['demo_grow_studio'];
        else if (currentId.includes('cactus')) matched = clientMetaMap['cactus_empanadas'];
        else if (currentId.includes('lechuga')) matched = clientMetaMap['mi_lechuga'];
    }

    // Asegurar si el archivo carece de extensión para el primer intento
    let fileToUse = cleanFile;
    const hasExtension = /\.(jpe?g|png|webp|gif|svg|mp4)$/i.test(fileToUse);
    if (!hasExtension) {
        // En Burger Rock la gran mayoría son .jpeg o .jpg
        fileToUse = `${fileToUse}.jpeg`;
    }

    // 1. Si estamos bajo protocolo http/https (Live Server, Vite o Vercel),
    // las rutas relativas tipo ../ no siempre son accesibles por restricciones del navegador.
    // Usamos el liveUrl si existe o la URL guardada del cliente.
    const isHttp = (window.location.protocol === 'http:' || window.location.protocol === 'https:');
    let clientLiveUrl = '';
    if (state.currentClientData && state.currentClientData.url) {
        let u = String(state.currentClientData.url).trim();
        if (!u.startsWith('http')) u = `https://${u}`;
        clientLiveUrl = u.replace(/\/$/, '');
    } else if (matched && matched.liveUrl) {
        clientLiveUrl = matched.liveUrl;
    }

    // Si está en http/https y tenemos URL en vivo, preferir la web oficial para asegurar visualización
    if (isHttp && clientLiveUrl) {
        return `${clientLiveUrl}/img/${fileToUse}`;
    }

    // 2. Si hay carpeta local identificada
    if (matched && matched.folder) {
        return `${matched.folder}${fileToUse}`;
    }

    // 3. Fallback genérico
    if (clientLiveUrl) {
        return `${clientLiveUrl}/img/${fileToUse}`;
    }

    return `img/${fileToUse}`;
}

// Fallback dinámico inteligente para miniaturas: prueba extensiones y URL en vivo antes de desistir
window.handleImageError = function(imgElement, originalSrc) {
    if (!imgElement) return;
    const currentAttempt = parseInt(imgElement.getAttribute('data-fallback-attempt') || '0', 10);
    const rawClean = sanitizeImageFilename(originalSrc || imgElement.getAttribute('data-raw-img') || '');
    const baseName = rawClean.replace(/\.[^/.]+$/, ''); // Quita extensión si tiene

    const currentId = String(state.currentClientId || '').toLowerCase();
    const currentName = String((state.currentClientData && (state.currentClientData.businessName || state.currentClientData.nombre)) || '').toLowerCase();
    
    // Obtener posible carpeta local y web en vivo
    let folder = 'img/';
    let liveUrl = '';
    if (state.currentClientData && state.currentClientData.url) {
        let u = String(state.currentClientData.url).trim();
        if (!u.startsWith('http')) u = `https://${u}`;
        liveUrl = u.replace(/\/$/, '');
    }

    if (currentId.includes('rock') || currentName.includes('rock')) {
        folder = '../Burguer Rock Metal/img/';
        if (!liveUrl) liveUrl = 'https://burger-rock-metal.vercel.app';
    } else if (currentId.includes('flaca') || currentName.includes('flaca')) {
        folder = '../Pasteles La Flaca/img/';
        if (!liveUrl) liveUrl = 'https://pasteles-la-flaca.vercel.app';
    } else if (currentId.includes('food') || currentName.includes('food')) {
        folder = '../The Food Point/img/';
        if (!liveUrl) liveUrl = 'https://thefoodpoint.vercel.app';
    } else if (currentId.includes('demo') || currentName.includes('demo') || currentId.includes('grow')) {
        folder = '../Demo_Menu_Digital/img/';
        if (!liveUrl) liveUrl = 'https://growstudiodemo.vercel.app';
    }

    // Secuencia de intentos de rescate
    // 0 -> Probar .jpeg en carpeta local
    // 1 -> Probar .jpg en carpeta local
    // 2 -> Probar .png en carpeta local
    // 3 -> Probar en URL en vivo con .jpeg
    // 4 -> Probar en URL en vivo con .jpg
    // 5 -> Probar en URL en vivo con .png
    // 6 -> Si todo falla, mostrar placeholder limpio "No Img"
    
    imgElement.setAttribute('data-fallback-attempt', (currentAttempt + 1).toString());

    if (currentAttempt === 0) {
        imgElement.src = `${folder}${baseName}.jpeg`;
        if (imgElement.parentElement && imgElement.parentElement.tagName === 'A') imgElement.parentElement.href = imgElement.src;
    } else if (currentAttempt === 1) {
        imgElement.src = `${folder}${baseName}.jpg`;
        if (imgElement.parentElement && imgElement.parentElement.tagName === 'A') imgElement.parentElement.href = imgElement.src;
    } else if (currentAttempt === 2) {
        imgElement.src = `${folder}${baseName}.png`;
        if (imgElement.parentElement && imgElement.parentElement.tagName === 'A') imgElement.parentElement.href = imgElement.src;
    } else if (currentAttempt === 3 && liveUrl) {
        imgElement.src = `${liveUrl}/img/${baseName}.jpeg`;
        if (imgElement.parentElement && imgElement.parentElement.tagName === 'A') imgElement.parentElement.href = imgElement.src;
    } else if (currentAttempt === 4 && liveUrl) {
        imgElement.src = `${liveUrl}/img/${baseName}.jpg`;
        if (imgElement.parentElement && imgElement.parentElement.tagName === 'A') imgElement.parentElement.href = imgElement.src;
    } else if (currentAttempt === 5 && liveUrl) {
        imgElement.src = `${liveUrl}/img/${baseName}.png`;
        if (imgElement.parentElement && imgElement.parentElement.tagName === 'A') imgElement.parentElement.href = imgElement.src;
    } else {
        imgElement.onerror = null;
        imgElement.src = 'https://placehold.co/80x80/27272a/a1a1aa?text=No+Img';
        if (imgElement.parentElement && imgElement.parentElement.tagName === 'A') imgElement.parentElement.href = '#';
    }
};

// Actualizar un campo específico de producto
window.actualizarProducto = async function(index, campo, valor) {
    if (!state.currentClientId || !state.currentClientData.productos) return;
    state.currentClientData.productos[index][campo] = valor;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
        
        // Si se editó imagen o categoría, re-renderizar para refrescar tabs o miniatura
        if (campo === 'imagen' || campo === 'categoria') {
            window.renderProducts(state.currentClientData.productos);
        }
    } catch(e) { 
        console.error(e); 
        if (window.showToast) window.showToast("Error al guardar cambios del producto", "error");
        else alert("Error guardando"); 
    }
};

window.agregarProductoRapido = async function() {
    if (!state.currentClientId) return;
    const nombreInput = document.getElementById('new-prod-nombre');
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    if (!nombre) {
        if (window.showToast) window.showToast("Ingresa el nombre del producto", "warning");
        return;
    }

    const prod = {
        nombre: nombre,
        descripcion: document.getElementById('new-prod-desc') ? document.getElementById('new-prod-desc').value.trim() : "",
        imagen: (document.getElementById('new-prod-imagen') && document.getElementById('new-prod-imagen').value.trim()) ? document.getElementById('new-prod-imagen').value.trim() : 'hamburguesa.png',
        categoria: (document.getElementById('new-prod-categoria') && document.getElementById('new-prod-categoria').value.trim()) ? document.getElementById('new-prod-categoria').value.trim() : (state.activeProductCategoryFilter !== 'ALL' ? state.activeProductCategoryFilter : 'General'),
        precio: parseFloat(document.getElementById('new-prod-precio') ? document.getElementById('new-prod-precio').value : 0) || 0,
        activo: "SI"
    };

    if (!state.currentClientData.productos) state.currentClientData.productos = [];
    state.currentClientData.productos.unshift(prod); // Agregar al inicio para verlo de inmediato

    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
        
        // Limpiar inputs
        if (nombreInput) nombreInput.value = '';
        if (document.getElementById('new-prod-desc')) document.getElementById('new-prod-desc').value = '';
        if (document.getElementById('new-prod-imagen')) document.getElementById('new-prod-imagen').value = '';
        if (document.getElementById('new-prod-precio')) document.getElementById('new-prod-precio').value = '';
        
        if (window.showToast) window.showToast(`Producto "${prod.nombre}" añadido`);
        window.renderProducts(state.currentClientData.productos);
    } catch(e) { 
        console.error(e); 
        if (window.showToast) window.showToast("Error al agregar producto", "error");
    }
};

// Renderizado de pestañas de categorías
window.renderCategoryFilterTabs = function(productos) {
    const container = document.getElementById('product-category-filters');
    if (!container) return;
    container.innerHTML = '';

    const categoriesSet = new Set();
    (productos || []).forEach(p => {
        const cat = (p.categoria || 'General').trim();
        if (cat) categoriesSet.add(cat);
    });
    const categories = Array.from(categoriesSet).sort();

    // Actualizar también el select del modal de ajuste masivo
    const massSelect = document.getElementById('mass-price-category');
    if (massSelect) {
        massSelect.innerHTML = `<option value="ALL">Todo el Menú (${(productos || []).length} productos)</option>`;
        categories.forEach(cat => {
            const count = (productos || []).filter(p => (p.categoria || 'General').trim() === cat).length;
            massSelect.innerHTML += `<option value="${cat}">${cat} (${count} productos)</option>`;
        });
    }

    if (categories.length === 0) return;

    // Botón "Todas"
    const isAllActive = state.activeProductCategoryFilter === 'ALL';
    const btnAll = document.createElement('button');
    btnAll.type = 'button';
    btnAll.className = 'btn-category-tab';
    btnAll.style.cssText = `
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid ${isAllActive ? 'var(--brand-orange)' : 'rgba(255,255,255,0.12)'};
        background: ${isAllActive ? 'var(--brand-orange)' : 'rgba(255,255,255,0.05)'};
        color: ${isAllActive ? '#000' : '#d4d4d8'};
        transition: all 0.2s ease;
        white-space: nowrap;
    `;
    btnAll.innerHTML = `Todas (${(productos || []).length})`;
    btnAll.onclick = () => {
        state.activeProductCategoryFilter = 'ALL';
        window.renderProducts(state.currentClientData.productos || []);
    };
    container.appendChild(btnAll);

    // Botones por categoría
    categories.forEach(cat => {
        const count = (productos || []).filter(p => (p.categoria || 'General').trim() === cat).length;
        const isActive = state.activeProductCategoryFilter === cat;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-category-tab';
        btn.style.cssText = `
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid ${isActive ? 'var(--brand-orange)' : 'rgba(255,255,255,0.12)'};
            background: ${isActive ? 'var(--brand-orange)' : 'rgba(255,255,255,0.05)'};
            color: ${isActive ? '#000' : '#d4d4d8'};
            transition: all 0.2s ease;
            white-space: nowrap;
        `;
        btn.innerHTML = `${cat} (${count})`;
        btn.onclick = () => {
            state.activeProductCategoryFilter = cat;
            window.renderProducts(state.currentClientData.productos || []);
        };
        container.appendChild(btn);
    });
};

window.renderProducts = function(productos) {
    DOM.productsTbody.innerHTML = '';
    
    // Renderizar pestañas de categorías arriba
    window.renderCategoryFilterTabs(productos);

    // Fila para agregar rápido (Excel style)
    const newTr = document.createElement('tr');
    newTr.style.background = "rgba(16, 185, 129, 0.1)"; // Fondo verdecito
    newTr.innerHTML = `
        <td>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 36px; height: 36px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;" title="Nueva imagen">🖼️</div>
                <input type="text" id="new-prod-imagen" class="modern-select" placeholder="ej. pizza.jpg" style="width: 90px; padding: 4px; font-size: 11px;">
            </div>
        </td>
        <td><input type="text" id="new-prod-nombre" class="modern-select" placeholder="Nuevo Producto..." style="width: 120px; padding: 4px;"></td>
        <td><input type="text" id="new-prod-desc" class="modern-select" placeholder="Descripción..." style="width: 150px; padding: 4px;"></td>
        <td><input type="text" id="new-prod-categoria" class="modern-select" placeholder="${state.activeProductCategoryFilter !== 'ALL' ? state.activeProductCategoryFilter : 'Categoría'}" style="width: 80px; padding: 4px;"></td>
        <td><input type="number" step="0.01" id="new-prod-precio" class="modern-select" placeholder="0.00" style="width: 60px; padding: 4px;"></td>
        <td><span style="font-size: 11px; color: #10b981;">Activo</span></td>
        <td><button class="btn-primary btn-small" onclick="agregarProductoRapido()">+ Añadir</button></td>
    `;
    DOM.productsTbody.appendChild(newTr);

    if (!productos || productos.length === 0) return;

    // Filtrar productos según la pestaña activa
    const filteredProductsWithOriginalIndex = productos
        .map((p, index) => ({ prod: p, originalIndex: index }))
        .filter(item => {
            if (state.activeProductCategoryFilter === 'ALL') return true;
            return (item.prod.categoria || 'General').trim() === state.activeProductCategoryFilter;
        });

    filteredProductsWithOriginalIndex.forEach(({ prod: p, originalIndex }) => {
        const tr = document.createElement('tr');
        const isChecked = p.activo === 'SI' ? 'selected' : '';
        const isNotChecked = p.activo === 'NO' ? 'selected' : '';
        const previewUrl = resolveImagePreviewUrl(p.imagen);
        
        const rawImgStr = (p.imagen || '').replace(/'/g, "\\'");
        
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <a href="${previewUrl}" target="_blank" title="Clic para ver imagen grande" style="flex-shrink: 0; text-decoration: none;">
                        <img src="${previewUrl}" data-raw-img="${rawImgStr}" alt="Preview" onerror="window.handleImageError(this, '${rawImgStr}')" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: #000; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                    </a>
                    <input type="text" class="modern-select" value="${p.imagen || ''}" onchange="actualizarProducto(${originalIndex}, 'imagen', this.value)" style="width: 90px; padding: 4px; font-size: 11px;" placeholder="URL o archivo">
                </div>
            </td>
            <td><input type="text" class="modern-select" value="${p.nombre || ''}" onchange="actualizarProducto(${originalIndex}, 'nombre', this.value)" style="width: 120px; padding: 4px;"></td>
            <td><input type="text" class="modern-select" value="${p.descripcion || ''}" onchange="actualizarProducto(${originalIndex}, 'descripcion', this.value)" style="width: 150px; padding: 4px;"></td>
            <td><input type="text" class="modern-select" value="${p.categoria || ''}" onchange="actualizarProducto(${originalIndex}, 'categoria', this.value)" style="width: 80px; padding: 4px;"></td>
            <td><input type="number" step="0.01" class="modern-select" value="${p.precio || 0}" onchange="actualizarProducto(${originalIndex}, 'precio', parseFloat(this.value))" style="width: 60px; padding: 4px;"></td>
            <td>
                <select class="modern-select" style="padding: 4px; font-size: 11px;" onchange="actualizarProducto(${originalIndex}, 'activo', this.value)">
                    <option value="SI" ${isChecked}>Activo</option>
                    <option value="NO" ${isNotChecked}>Oculto</option>
                </select>
            </td>
            <td>
                <button class="btn-secondary btn-small" style="padding: 2px 5px;" onclick="window.moveProduct(${originalIndex}, -1)" title="Subir fila">🔼</button>
                <button class="btn-secondary btn-small" style="padding: 2px 5px;" onclick="window.moveProduct(${originalIndex}, 1)" title="Bajar fila">🔽</button>
                <button class="btn-secondary btn-small" onclick="window.deleteProduct(${originalIndex})" title="Eliminar">❌</button>
            </td>
        `;
        DOM.productsTbody.appendChild(tr);
    });
};

window.moveProduct = async function(index, direction) {
    if (!state.currentClientId || !state.currentClientData.productos) return;
    const newIndex = index + direction;
    
    // Evitar salir de los límites del array
    if (newIndex < 0 || newIndex >= state.currentClientData.productos.length) return;

    // Intercambiar elementos
    const temp = state.currentClientData.productos[index];
    state.currentClientData.productos[index] = state.currentClientData.productos[newIndex];
    state.currentClientData.productos[newIndex] = temp;

    // Actualizar vista inmediatamente
    window.renderProducts(state.currentClientData.productos);

    // Guardar en la nube
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
    } catch (e) {
        if (window.showToast) window.showToast("Error al guardar orden en Firestore", "error");
        else alert("Error guardando el nuevo orden.");
        console.error(e);
    }
};

window.deleteProduct = async function(index) {
    const prod = state.currentClientData.productos[index];
    const nombre = prod ? prod.nombre : "este producto";
    if(!confirm(`¿Eliminar "${nombre}"?`)) return;
    state.currentClientData.productos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
        if (window.showToast) window.showToast(`Producto "${nombre}" eliminado`);
        window.renderProducts(state.currentClientData.productos);
    } catch (e) { 
        if (window.showToast) window.showToast("Error al eliminar", "error");
        else alert("Error."); 
    }
};

// ==========================================
// MODAL DE AJUSTE MASIVO DE PRECIOS (FASE 2.2)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const modalMassPrice = document.getElementById('modal-mass-price');
    const btnOpenMass = document.getElementById('btn-open-mass-price');
    const btnCloseMass = document.getElementById('btn-close-mass-price');
    const btnCancelMass = document.getElementById('btn-cancel-mass-price');
    const btnApplyMass = document.getElementById('btn-apply-mass-price');

    const selectCategory = document.getElementById('mass-price-category');
    const selectType = document.getElementById('mass-price-type');
    const selectOperation = document.getElementById('mass-price-operation');
    const inputValue = document.getElementById('mass-price-value');
    const previewBox = document.getElementById('mass-price-preview');

    function updateMassPreview() {
        if (!previewBox) return;
        const type = selectType ? selectType.value : 'percent';
        const op = selectOperation ? selectOperation.value : 'increase';
        const val = parseFloat(inputValue ? inputValue.value : 0) || 0;
        const cat = selectCategory ? selectCategory.value : 'ALL';
        const targetText = cat === 'ALL' ? 'todos los productos' : `los productos de la categoría "${cat}"`;

        let sampleOriginal = 10.00;
        let sampleCalculated = sampleOriginal;

        if (type === 'percent') {
            if (op === 'increase') sampleCalculated = sampleOriginal * (1 + (val / 100));
            else sampleCalculated = Math.max(0, sampleOriginal * (1 - (val / 100)));
            previewBox.innerHTML = `💡 <strong>Simulación en ${targetText}:</strong><br>Un producto de <strong>$${sampleOriginal.toFixed(2)}</strong> pasará a costar <strong>$${sampleCalculated.toFixed(2)}</strong> (${op === 'increase' ? '+' : '-'}${val}%).`;
        } else {
            if (op === 'increase') sampleCalculated = sampleOriginal + val;
            else sampleCalculated = Math.max(0, sampleOriginal - val);
            previewBox.innerHTML = `💡 <strong>Simulación en ${targetText}:</strong><br>Un producto de <strong>$${sampleOriginal.toFixed(2)}</strong> pasará a costar <strong>$${sampleCalculated.toFixed(2)}</strong> (${op === 'increase' ? '+' : '-'}$${val.toFixed(2)}).`;
        }
    }

    if (btnOpenMass && modalMassPrice) {
        btnOpenMass.addEventListener('click', () => {
            if (!state.currentClientId || !state.currentClientData || !state.currentClientData.productos || state.currentClientData.productos.length === 0) {
                if (window.showToast) window.showToast("Este cliente no tiene productos cargados para ajustar", "warning");
                else alert("No hay productos cargados.");
                return;
            }
            if (inputValue) inputValue.value = '';
            // Si hay un filtro de categoría activo, pre-seleccionarlo
            if (selectCategory && state.activeProductCategoryFilter && state.activeProductCategoryFilter !== 'ALL') {
                selectCategory.value = state.activeProductCategoryFilter;
            }
            updateMassPreview();
            modalMassPrice.style.display = 'flex';
        });
    }

    const closeModal = () => {
        if (modalMassPrice) modalMassPrice.style.display = 'none';
    };

    if (btnCloseMass) btnCloseMass.addEventListener('click', closeModal);
    if (btnCancelMass) btnCancelMass.addEventListener('click', closeModal);

    if (selectCategory) selectCategory.addEventListener('change', updateMassPreview);
    if (selectType) selectType.addEventListener('change', updateMassPreview);
    if (selectOperation) selectOperation.addEventListener('change', updateMassPreview);
    if (inputValue) inputValue.addEventListener('input', updateMassPreview);

    if (btnApplyMass) {
        btnApplyMass.addEventListener('click', async () => {
            if (!state.currentClientId || !state.currentClientData.productos) return;
            const val = parseFloat(inputValue ? inputValue.value : 0);
            if (isNaN(val) || val <= 0) {
                if (window.showToast) window.showToast("Ingresa un valor mayor a 0", "warning");
                return;
            }

            const cat = selectCategory ? selectCategory.value : 'ALL';
            const type = selectType ? selectType.value : 'percent';
            const op = selectOperation ? selectOperation.value : 'increase';

            const originalBtnText = btnApplyMass.innerText;
            btnApplyMass.innerText = "Aplicando...";
            btnApplyMass.disabled = true;

            let modifiedCount = 0;
            const updatedProducts = state.currentClientData.productos.map(p => {
                const pCat = (p.categoria || 'General').trim();
                if (cat !== 'ALL' && pCat !== cat) {
                    return p;
                }

                let currentPrice = parseFloat(p.precio) || 0;
                let newPrice = currentPrice;

                if (type === 'percent') {
                    if (op === 'increase') newPrice = currentPrice * (1 + (val / 100));
                    else newPrice = Math.max(0, currentPrice * (1 - (val / 100)));
                } else {
                    if (op === 'increase') newPrice = currentPrice + val;
                    else newPrice = Math.max(0, currentPrice - val);
                }

                // Redondear a 2 decimales
                newPrice = Math.round(newPrice * 100) / 100;
                modifiedCount++;

                return {
                    ...p,
                    precio: newPrice
                };
            });

            try {
                const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                await updateDoc(doc(db, "clientes", state.currentClientId), { productos: updatedProducts });
                state.currentClientData.productos = updatedProducts;
                window.renderProducts(updatedProducts);
                
                closeModal();
                if (window.showToast) window.showToast(`⚡ ¡Listo! Se actualizaron los precios de ${modifiedCount} productos.`);
                else alert(`Ajustados ${modifiedCount} productos.`);
            } catch (err) {
                console.error("Error al aplicar ajuste masivo:", err);
                if (window.showToast) window.showToast("Error al guardar ajuste masivo: " + err.message, "error");
                else alert("Error: " + err.message);
            } finally {
                btnApplyMass.innerText = originalBtnText;
                btnApplyMass.disabled = false;
            }
        });
    }
});

// Promociones


window.actualizarPromo = async function(index, campo, valor) {
    if (!state.currentClientId || !state.currentClientData.promos) return;
    state.currentClientData.promos[index][campo] = valor;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { promos: state.currentClientData.promos });
        if (campo === 'imagen') {
            window.renderPromos(state.currentClientData.promos);
        }
    } catch(e) { console.error(e); }
};

window.renderPromos = function(promos) {
    DOM.promosTbody.innerHTML = '';
    if (!promos || promos.length === 0) return;

    promos.forEach((p, index) => {
        const tr = document.createElement('tr');
        const isChecked = p.activo === 'SI' ? 'selected' : '';
        const isNotChecked = p.activo === 'NO' ? 'selected' : '';
        const previewUrl = resolveImagePreviewUrl(p.imagen);
        
        const rawPromoStr = (p.imagen || '').replace(/'/g, "\\'");
        
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <a href="${previewUrl}" target="_blank" title="Clic para ver promo grande" style="flex-shrink: 0; text-decoration: none;">
                        <img src="${previewUrl}" data-raw-img="${rawPromoStr}" alt="Promo" onerror="window.handleImageError(this, '${rawPromoStr}')" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: #000; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                    </a>
                    <input type="text" class="modern-select" value="${p.imagen || ''}" onchange="actualizarPromo(${index}, 'imagen', this.value)" style="width: 90px; padding: 4px; font-size: 11px;" placeholder="promo1.jpg">
                </div>
            </td>
            <td><input type="text" class="modern-select" value="${p.nombre || ''}" onchange="actualizarPromo(${index}, 'nombre', this.value)" style="width: 120px; padding: 4px;" placeholder="Ej. Promo Chori"></td>
            <td><input type="text" class="modern-select" value="${p.descripcion || ''}" onchange="actualizarPromo(${index}, 'descripcion', this.value)" style="width: 150px; padding: 4px;" placeholder="Detalles de la promo"></td>
            <td><input type="number" step="0.01" class="modern-select" value="${p.precio || 0}" onchange="actualizarPromo(${index}, 'precio', parseFloat(this.value))" style="width: 60px; padding: 4px;"></td>
            <td>
                <select class="modern-select" style="padding: 4px; font-size: 11px;" onchange="actualizarPromo(${index}, 'activo', this.value)">
                    <option value="SI" ${isChecked}>SI (Prendido)</option>
                    <option value="NO" ${isNotChecked}>NO (Apagado)</option>
                </select>
            </td>
            <td>
                <button class="btn-secondary btn-small" onclick="window.deletePromo(${index})" title="Eliminar">❌</button>
            </td>
        `;
        DOM.promosTbody.appendChild(tr);
    });
}

window.deletePromo = async function(index) {
    if(!confirm("¿Eliminar esta promo de la lista?")) return;
    state.currentClientData.promos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            promos: state.currentClientData.promos
        });
        window.renderPromos(state.currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
};

DOM.btnAddPromo.addEventListener('click', async () => {
    const filename = prompt("Nombre del archivo de imagen (ej. promo3.jpg):");
    if(!filename) return;
    
    state.currentClientData.promos.push({ imagen: filename, activo: 'SI' });
    
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            promos: state.currentClientData.promos
        });
        window.renderPromos(state.currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
});









// Añadir Producto Mínimo Viable (usando prompts por rapidez de la primera versión)
DOM.btnAddProduct.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    
    const nombre = prompt("Nombre del producto:");
    if (!nombre) return;
    const precio = prompt("Precio en dólares (ej. 5.50):");
    const categoria = prompt("Categoría (ej. Promociones, Hamburguesas):");
    const imagen = prompt("URL de la imagen:");
    const descripcion = prompt("Descripción corta:");
    const extras = prompt("Nombres de los extras separados por coma (opcional):");

    const nuevoProducto = {
        nombre: nombre,
        precio: parseFloat(precio) || 0,
        categoria: categoria || "General",
        imagen: imagen || "https://placehold.co/400",
        descripcion: descripcion || "",
        extras: extras || ""
    };

    try {
        const docRef = doc(db, "clientes", state.currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        const productosActuales = data.productos || [];
        productosActuales.push(nuevoProducto);
        
        await updateDoc(docRef, { productos: productosActuales });
        window.renderProducts(productosActuales);
    } catch (e) {
        alert("Error al guardar producto.");
    }
});

// Lógica para el botón Importar con IA
if(DOM.btnImportBulk) DOM.btnImportBulk.addEventListener('click', () => {
    DOM.importRawText.value = ''; // Limpiar el área de texto
    // Cargar API key guardada
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) DOM.geminiApiKey.value = savedKey;
    DOM.importModal.style.display = 'flex';
});

if(DOM.btnCancelImport) DOM.btnCancelImport.addEventListener('click', () => {
    DOM.importModal.style.display = 'none';
});

if(DOM.btnConfirmImport) DOM.btnConfirmImport.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    
    const rawText = DOM.importRawText.value.trim();
    const apiKey = DOM.geminiApiKey.value.trim();
    
    if (!rawText || !apiKey) {
        alert("Por favor, ingresa el texto del menú y tu API Key de Gemini.");
        return;
    }
    
    // Guardar la llave para el futuro
    localStorage.setItem('gemini_api_key', apiKey);
    
    try {
        DOM.btnConfirmImport.disabled = true;
        DOM.btnCancelImport.disabled = true;
        DOM.aiLoadingText.style.display = 'block';
        
        // Llamada a la API de Gemini (REST) usando el modelo más reciente (3.6-flash)
        const promptText = `
        Tengo este menú crudo de un restaurante. Extrae todos los productos y devuélvelos estrictamente como un arreglo de objetos JSON con esta estructura exacta, basándote en un esquema de Excel, sin texto extra:
        [
          {
            "id": "generar un ID numérico único",
            "categoria": "string (usa tu mejor juicio, ej: Hamburguesas, Bebidas)",
            "nombre": "string",
            "descripcion": "string (ingredientes)",
            "precio": number (solo el número, ej: 5.50),
            "imagen": "string (nombre archivo, ej: hamburguesa.jpg o url)",
            "activo": "SI"
          }
        ]
        
        Menú crudo a procesar:
        ${rawText}
        `;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        let aiResponseText = result.candidates[0].content.parts[0].text;
        
        // Limpiar el texto en caso de que Gemini haya devuelto markdown
        aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonData = JSON.parse(aiResponseText);
        
        if (!Array.isArray(jsonData)) {
            throw new Error("La IA no devolvió una lista válida.");
        }
        
        // Formatear precios por seguridad
        const cleanData = jsonData.map(p => ({
            ...p,
            precio: parseFloat(p.precio) || 0
        }));
        
        const docRef = doc(db, "clientes", state.currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        let productosActuales = data.productos || [];
        
        // Agregar los nuevos productos a los existentes
        productosActuales = productosActuales.concat(cleanData);
        
        await updateDoc(docRef, { productos: productosActuales });
        window.renderProducts(productosActuales);
        
        DOM.importModal.style.display = 'none';
        alert(`¡Inteligencia Artificial Exitosamente aplicada! Se importaron ${cleanData.length} productos automáticamente.`);
    } catch (e) {
        alert("Error de la IA o de red: " + e.message);
    } finally {
        DOM.btnConfirmImport.disabled = false;
        DOM.btnCancelImport.disabled = false;
        DOM.aiLoadingText.style.display = 'none';
    }
});



// ==========================================
