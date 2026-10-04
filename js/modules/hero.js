import { db, updateDoc, doc } from './firebase-init.js';
import { DOM, state } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    const heroInput = document.getElementById('client-hero-url');
    const btnSaveHero = document.getElementById('btn-save-hero');

    if (btnSaveHero && heroInput) {
        btnSaveHero.addEventListener('click', async () => {
            if (!state.currentClientId) return;
            const url = heroInput.value.trim();
            try {
                btnSaveHero.innerText = 'Guardando...';
                await updateDoc(doc(db, 'clientes', state.currentClientId), {
                    headerMedia: url
                });
                state.currentClientData.headerMedia = url;
                btnSaveHero.innerText = '¡Guardado!';
                if (window.showToast) window.showToast("Portada Hero guardada con éxito.");
                setTimeout(() => btnSaveHero.innerText = 'Guardar Portada', 2000);
            } catch(e) {
                if (window.showToast) window.showToast('Error al guardar portada: ' + e.message, 'error');
                else alert('Error al guardar: ' + e.message);
                btnSaveHero.innerText = 'Guardar Portada';
            }
        });
    }
});
