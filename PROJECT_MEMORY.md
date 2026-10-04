# 💼 MEMORIA DE PROYECTO — GROW STUDIO ADMIN

Archivo de contexto local y memoria viva para el Dashboard Central de Gestión de Clientes y Menús SaaS de **Grow Studio**.

---

## 🎯 1. VISIÓN Y CONTEXTO DEL SISTEMA
* **Tipo:** Panel de Administración / SaaS Dashboard de Agencia.
* **Propósito:** Centralizar la gestión de clientes, monitorear catálogos de menús activos, actualizar tasas de cambio y consultar estadísticas comerciales.
* **Usuarios:** Administrador y equipo de Grow Studio.

---

## 🎨 2. IDENTIDAD Y DISEÑO
* **Estilo Visual:** Dark Dashboard Moderno y Limpio (`#0D1117`, paneles `#161B22`, bordes translúcidos `border-white/10`, métricas destacadas con glow y acentos cian/azul).
* **Componentes Clave:** Sidebar de navegación colapsable, tarjetas de KPI (Clientes Activos, Pedidos, Ingresos estimados), tablas de gestión y selector de tasa de cambio.

---

## ⚙️ 3. REGLAS TÉCNICAS Y SEGURIDAD
1. **Acceso Seguro:** Panel protegido sin enlaces públicos huérfanos.
2. **Modularidad:** Estructura pensada para conectar con el script generador de clientes (`generar_cliente.js`) y las bases de datos de clientes.
3. **Cero Dependencias Pesadas:** Renderizado ágil sin sobrecarga de frameworks innecesarios.

---

## 📌 4. ESTADO ACTUAL Y TAREAS PENDIENTES
- [x] Maquetación base del dashboard y widgets principales.
- [x] Módulo visual de estadísticas y métricas generales.
- [ ] Conexión y sincronización automática de catálogos de clientes.
- [ ] Panel para modificar tasa oficial del día de forma centralizada.

---

## 📝 5. BITÁCORA Y DECISIONES TÉCNICAS
* **2026-09-30:** Creación de memoria local modular para Grow Studio Admin.
