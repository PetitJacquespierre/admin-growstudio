# 📋 PLAN DE EVOLUCIÓN: GROW STUDIO ADMIN (MODO DIOS 2.0)

Documento maestro de ruta de desarrollo y tareas pendientes para convertir **Grow Studio Admin** en un centro de comando SaaS de clase mundial.

---

## 🚀 FASE 1: Experiencia de Usuario & Flujo de Creación (UX Rápida)
Optimizaciones esenciales para agilizar el trabajo diario y eliminar fricción visual.

- [x] **1.1 Modal Moderno de "+ Nuevo Cliente"**
  - Eliminar los 5 `prompt()` nativos del navegador.
  - Crear una ventana modal estilizada con campos limpios: ID único, Nombre Comercial, WhatsApp, Instagram, URL de Vercel y Plan inicial.
  - Validación de campos antes de guardar en Firestore.
- [x] **1.2 Buscador en Vivo en el Sidebar**
  - Campo de búsqueda interactivo en la barra lateral para filtrar clientes en tiempo real por nombre o ID.
- [x] **1.3 Sistema de Notificaciones Flotantes (Toasts)**
  - Reemplazar alertas nativas por notificaciones toast animadas en la esquina (*"✅ Guardado con éxito"*, *"⚠️ Revisa los campos"*).

---

## 🍔 FASE 2: Operaciones de Menú y Edición Rápida
Herramientas para ahorrar horas de trabajo al gestionar restaurantes grandes y actualizar precios.

- [ ] **2.1 Previsualización de Imágenes en la Tabla**
  - Miniatura visual interactiva (avatar de 36px) al lado del campo de imagen para confirmar que el enlace o archivo local carga correctamente.
- [ ] **2.2 Ajuste Masivo de Precios**
  - Botón para aplicar aumentos o descuentos por porcentaje (`+10%`, `+15%`) o por monto fijo (`+$1.00`) a una categoría específica o a todo el menú.
- [ ] **2.3 Filtro de Productos por Categoría en el Admin**
  - Botones de pestañas arriba de la tabla de productos para ver solo *"Hamburguesas"*, *"Bebidas"*, etc., facilitando la edición en cartas extensas.

---

## 💰 FASE 3: Cobranza y Finanzas SaaS Automatizadas
Herramientas para garantizar el cobro puntual y flujo de caja constante del negocio.

- [ ] **3.1 Filtro de Clientes por Estado de Pago**
  - Pestañas rápidas en el sidebar: `[Todos]` | `[Por Vencer (7 días)]` | `[Morosos]`.
- [ ] **3.2 Generador de Cobro por WhatsApp en 1 Clic**
  - Al pulsar el botón de cobro, abrir WhatsApp con un mensaje pre-redactado profesional con nombre del cliente, fecha de corte, monto en dólares y total calculado a la tasa oficial BCV del día.

---

## 📊 FASE 4: Dashboard Ejecutivo & Monitoreo Global
Convertir la pantalla de inicio en un panel de control empresarial con métricas clave.

- [ ] **4.1 KPIs Globales en Pantalla de Bienvenida**
  - Tarjetas de resumen en tiempo real: Clientes Activos, Ingresos Recurrentes Estimados (MRR en USD), y Tráfico Total de visitas del mes acumulado en todos los locales.
- [ ] **4.2 Indicador Central de Tasa BCV en la Barra Superior**
  - Widget en el encabezado que muestra la tasa oficial del día en vivo y permite verificar el estado de la conexión.
