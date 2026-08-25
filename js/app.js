import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase (Generada automáticamente)
const firebaseConfig = {
    projectId: "grow-studio-menus",
    appId: "1:152582182898:web:cf17e88b6b1f861cdc7d6b",
    storageBucket: "grow-studio-menus.firebasestorage.app",
    apiKey: "AIzaSyAv7GDSLS3Kwb-aMAhyQE3YgnPkCNg8cvg",
    authDomain: "grow-studio-menus.firebaseapp.com",
    messagingSenderId: "152582182898",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userEmailDisplay = document.getElementById('user-email');
const btnLogout = document.getElementById('btn-logout');
const clientsUl = document.getElementById('clients-ul');
const btnNewClient = document.getElementById('btn-new-client');
const clientManager = document.getElementById('client-manager');
const managerTitle = document.getElementById('manager-title');
const clientStatus = document.getElementById('client-status');
const storeStatus = document.getElementById('store-status');
const clientWhatsapp = document.getElementById('client-whatsapp');
const btnSaveWhatsapp = document.getElementById('btn-save-whatsapp');
const clientUrl = document.getElementById('client-url');
const btnSaveUrl = document.getElementById('btn-save-url');
const clientLink = document.getElementById('client-link');
const productsTbody = document.getElementById('products-tbody');
const btnAddProduct = document.getElementById('btn-add-product');
const btnDeleteClient = document.getElementById('btn-delete-client');

let currentClientId = null;

// ==========================================
// AUTENTICACIÓN
// ==========================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario Logueado
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        userEmailDisplay.innerText = user.email;
        loadClients();
    } else {
        // No logueado
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
        currentClientId = null;
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            loginError.innerText = "Credenciales incorrectas o usuario no existe.";
            loginError.style.display = 'block';
        });
});

btnLogout.addEventListener('click', () => {
    signOut(auth);
});

const btnForgotPassword = document.getElementById('btn-forgot-password');
btnForgotPassword.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    if (!email) {
        alert("Por favor, ingresa tu correo electrónico primero en la casilla de arriba para enviarte el link de recuperación.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("¡Enlace de recuperación enviado! Revisa tu bandeja de entrada (y la carpeta de SPAM).");
    } catch (error) {
        alert("Error al enviar el correo. Verifica que el correo esté bien escrito y exista.");
    }
});

// ==========================================
// GESTIÓN DE CLIENTES
// ==========================================

async function loadClients() {
    clientsUl.innerHTML = '<li style="color:gray">Cargando...</li>';
    try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        clientsUl.innerHTML = '';
        
        if (querySnapshot.empty) {
            clientsUl.innerHTML = '<li style="color:gray">No hay clientes aún</li>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `👤 ${data.businessName || doc.id}`;
            li.onclick = () => openClientManager(doc.id, data, li);
            clientsUl.appendChild(li);
        });
    } catch (error) {
        console.error("Error cargando clientes:", error);
        clientsUl.innerHTML = '<li style="color:red">Error de conexión</li>';
    }
}

btnNewClient.addEventListener('click', async () => {
    document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
    btnNewClient.classList.add('active');
    
    const id = prompt("Ingresa el ID único del cliente (ej. la_flaca, foodpoint):");
    if (!id) return;
    
    const name = prompt("Nombre comercial del cliente (ej. Pasteles La Flaca):");
    if (!name) return;

    const whatsapp = prompt("Número de WhatsApp del cliente con código de país (ej. 584120000000):") || "";
    const url = prompt("Link de la tienda en Vercel (Opcional, ej: https://laflaca.vercel.app):") || "";

    try {
        await setDoc(doc(db, "clientes", id), {
            businessName: name,
            estado: "ACTIVO",
            tiendaAbierta: "AUTO",
            whatsapp: whatsapp,
            url: url,
            productos: []
        });
        loadClients();
    } catch (e) {
        alert("Error creando cliente: " + e.message);
    }
});

// ==========================================
// RENDERIZADO Y CONTROL DE PRODUCTOS Y PROMOS
// ==========================================
let currentClientData = null; // Guardar datos para actualizaciones rápidas

async function openClientManager(id, data, liElement) {
    currentClientId = id;
    currentClientData = data;
    
    document.getElementById('welcome-screen').style.display = 'none';
    clientManager.style.display = 'block';
    
    // Titulo y Link
    const titleText = document.createTextNode(`Menú de: ${data.businessName || id} `);
    managerTitle.innerHTML = '';
    managerTitle.appendChild(titleText);
    
    if (data.url) {
        clientLink.href = data.url.startsWith('http') ? data.url : `https://${data.url}`;
        clientLink.style.display = 'inline-block';
        managerTitle.appendChild(clientLink);
    } else {
        clientLink.style.display = 'none';
        managerTitle.appendChild(clientLink); // mantener en dom
    }

    clientStatus.value = data.estado || "ACTIVO";
    storeStatus.value = data.tiendaAbierta || "AUTO";
    clientWhatsapp.value = data.whatsapp || "";
    clientUrl.value = data.url || "";
    btnDeleteClient.style.display = 'block';
    
    document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
    document.getElementById('btn-new-client').classList.remove('active');
    if (liElement) liElement.classList.add('active');
    
    // Si no tiene promos creadas por defecto, creamos promo1 y promo2 apagadas visualmente
    if (!data.promos || data.promos.length === 0) {
        data.promos = [
            { imagen: 'promo1.jpg', activo: 'NO' },
            { imagen: 'promo2.jpg', activo: 'NO' }
        ];
    }
    
    renderProducts(data.productos || []);
    renderPromos(data.promos);
}

// Eliminar Cliente
btnDeleteClient.addEventListener('click', async () => {
    if (!currentClientId) return;
    const confirmacion = confirm(`¿Estás SEGURO de que quieres borrar a ${currentClientId} por completo? Esto eliminará todo su menú y configuración.`);
    if (confirmacion) {
        try {
            const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await deleteDoc(doc(db, "clientes", currentClientId));
            alert("Cliente eliminado correctamente.");
            clientManager.style.display = 'none';
            document.getElementById('welcome-screen').style.display = 'flex';
            btnDeleteClient.style.display = 'none';
            currentClientId = null;
            loadClients();
        } catch (error) {
            alert("Error al eliminar cliente: " + error.message);
        }
    }
});

// Cambiar estado (Kill Switch)
clientStatus.addEventListener('change', async (e) => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            estado: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar estado.");
    }
});

// Cambiar Horario (Abierto/Cerrado/Auto)
storeStatus.addEventListener('change', async (e) => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            tiendaAbierta: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar horario.");
    }
});

// Cambiar WhatsApp
btnSaveWhatsapp.addEventListener('click', async () => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            whatsapp: clientWhatsapp.value.trim()
        });
        alert("Número de WhatsApp guardado en la nube.");
    } catch (error) {
        alert("Error al guardar WhatsApp.");
    }
});

// Cambiar URL
btnSaveUrl.addEventListener('click', async () => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const newUrl = clientUrl.value.trim();
        await updateDoc(doc(db, "clientes", currentClientId), {
            url: newUrl
        });
        
        // Update the link UI immediately
        if (newUrl) {
            clientLink.href = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
            clientLink.style.display = 'inline-block';
        } else {
            clientLink.style.display = 'none';
        }
        
        alert("URL guardada en la nube. ¡Ya puedes hacer clic en el link 🔗 junto al título!");
    } catch (error) {
        alert("Error al guardar URL.");
    }
});

// Productos
function renderProducts(productos) {
    productsTbody.innerHTML = '';
    if (productos.length === 0) {
        productsTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:gray">No hay productos.</td></tr>';
        return;
    }

    productos.forEach((p, index) => {
        const tr = document.createElement('tr');
        
        let imgHtml = '';
        if (p.imagen && (p.imagen.startsWith('http://') || p.imagen.startsWith('https://'))) {
            imgHtml = `<img src="${p.imagen}" width="50" height="50" alt="img" style="border-radius:4px; object-fit:cover;">`;
        } else {
            imgHtml = `<div style="width: 50px; height: 50px; background: var(--bg-dark); border: 1px dashed var(--border); display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center; color: gray; border-radius: 4px; overflow: hidden;" title="img/${p.imagen}">📁<br>${p.imagen}</div>`;
        }
        
        const isChecked = p.activo === 'SI' ? 'checked' : '';
        
        tr.innerHTML = `
            <td>${imgHtml}</td>
            <td><strong>${p.nombre}</strong><br><small style="color:gray">${p.descripcion}</small></td>
            <td>${p.categoria}</td>
            <td>$${parseFloat(p.precio).toFixed(2)}</td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${isChecked} onchange="toggleProduct(${index})">
                    <span class="slider round"></span>
                </label>
            </td>
            <td>
                <button class="btn-secondary btn-small" onclick="deleteProduct(${index})">Eliminar</button>
            </td>
        `;
        productsTbody.appendChild(tr);
    });
}

window.toggleProduct = async function(index) {
    const p = currentClientData.productos[index];
    p.activo = p.activo === 'SI' ? 'NO' : 'SI';
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            productos: currentClientData.productos
        });
    } catch (e) {
        alert("Error al cambiar estado.");
        // Revert UI on failure
        p.activo = p.activo === 'SI' ? 'NO' : 'SI'; 
        renderProducts(currentClientData.productos);
    }
};

window.deleteProduct = async function(index) {
    if(!confirm("¿Eliminar este producto?")) return;
    currentClientData.productos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            productos: currentClientData.productos
        });
        renderProducts(currentClientData.productos);
    } catch (e) {
        alert("Error.");
    }
};

// Promociones
const promosTbody = document.getElementById('promos-tbody');
const btnAddPromo = document.getElementById('btn-add-promo');

function renderPromos(promos) {
    promosTbody.innerHTML = '';
    if (promos.length === 0) {
        promosTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:gray">No hay promos.</td></tr>';
        return;
    }

    promos.forEach((p, index) => {
        const tr = document.createElement('tr');
        
        const isChecked = p.activo === 'SI' ? 'checked' : '';
        
        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 30px; background: var(--bg-dark); border: 1px dashed var(--border); display: flex; align-items: center; justify-content: center; font-size: 10px; color: gray; border-radius: 4px;">📁</div>
                    <strong>${p.imagen}</strong>
                </div>
            </td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${isChecked} onchange="togglePromo(${index})">
                    <span class="slider round"></span>
                </label>
            </td>
            <td>
                <button class="btn-secondary btn-small" onclick="deletePromo(${index})">🗑️</button>
            </td>
        `;
        promosTbody.appendChild(tr);
    });
}

window.togglePromo = async function(index) {
    const p = currentClientData.promos[index];
    p.activo = p.activo === 'SI' ? 'NO' : 'SI';
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            promos: currentClientData.promos
        });
    } catch (e) {
        alert("Error al cambiar promo.");
        p.activo = p.activo === 'SI' ? 'NO' : 'SI'; 
        renderPromos(currentClientData.promos);
    }
};

window.deletePromo = async function(index) {
    if(!confirm("¿Eliminar esta promo de la lista?")) return;
    currentClientData.promos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            promos: currentClientData.promos
        });
        renderPromos(currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
};

btnAddPromo.addEventListener('click', async () => {
    const filename = prompt("Nombre del archivo de imagen (ej. promo3.jpg):");
    if(!filename) return;
    
    currentClientData.promos.push({ imagen: filename, activo: 'SI' });
    
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            promos: currentClientData.promos
        });
        renderPromos(currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
});

const btnImportBulk = document.getElementById('btn-import-bulk');
const importModal = document.getElementById('import-modal');
const btnConfirmImport = document.getElementById('btn-confirm-import');
const btnCancelImport = document.getElementById('btn-cancel-import');
const importRawText = document.getElementById('import-raw-text');
const geminiApiKey = document.getElementById('gemini-api-key');
const aiLoadingText = document.getElementById('ai-loading-text');

// Añadir Producto Mínimo Viable (usando prompts por rapidez de la primera versión)
btnAddProduct.addEventListener('click', async () => {
    if (!currentClientId) return;
    
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
        const docRef = doc(db, "clientes", currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        const productosActuales = data.productos || [];
        productosActuales.push(nuevoProducto);
        
        await updateDoc(docRef, { productos: productosActuales });
        renderProducts(productosActuales);
    } catch (e) {
        alert("Error al guardar producto.");
    }
});

// Lógica para el botón Importar con IA
btnImportBulk.addEventListener('click', () => {
    importRawText.value = ''; // Limpiar el área de texto
    // Cargar API key guardada
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) geminiApiKey.value = savedKey;
    importModal.style.display = 'flex';
});

btnCancelImport.addEventListener('click', () => {
    importModal.style.display = 'none';
});

btnConfirmImport.addEventListener('click', async () => {
    if (!currentClientId) return;
    
    const rawText = importRawText.value.trim();
    const apiKey = geminiApiKey.value.trim();
    
    if (!rawText || !apiKey) {
        alert("Por favor, ingresa el texto del menú y tu API Key de Gemini.");
        return;
    }
    
    // Guardar la llave para el futuro
    localStorage.setItem('gemini_api_key', apiKey);
    
    try {
        btnConfirmImport.disabled = true;
        btnCancelImport.disabled = true;
        aiLoadingText.style.display = 'block';
        
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
        
        const docRef = doc(db, "clientes", currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        let productosActuales = data.productos || [];
        
        // Agregar los nuevos productos a los existentes
        productosActuales = productosActuales.concat(cleanData);
        
        await updateDoc(docRef, { productos: productosActuales });
        renderProducts(productosActuales);
        
        importModal.style.display = 'none';
        alert(`¡Inteligencia Artificial Exitosamente aplicada! Se importaron ${cleanData.length} productos automáticamente.`);
    } catch (e) {
        alert("Error de la IA o de red: " + e.message);
    } finally {
        btnConfirmImport.disabled = false;
        btnCancelImport.disabled = false;
        aiLoadingText.style.display = 'none';
    }
});

// Exponer la función delete al window para el onclick del HTML
window.deleteProduct = async (index) => {
    if (!currentClientId || !confirm("¿Eliminar producto?")) return;
    
    try {
        const docRef = doc(db, "clientes", currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        let productosActuales = data.productos || [];
        productosActuales.splice(index, 1); // Remover el item
        
        await updateDoc(docRef, { productos: productosActuales });
        renderProducts(productosActuales);
    } catch (e) {
        alert("Error al eliminar.");
    }
};
