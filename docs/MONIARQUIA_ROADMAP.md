# Moniarquía — Hoja de ruta

> Actualizado: Julio 2026.

---

## Implementado (ya no pendiente)

| Módulo | Completado |
|---|---|
| QR — generación, descarga, escaneo | ✅ Jun 2026 |
| Splash de presentación | ✅ Jun 2026 |
| Alertas de stock bajo | ✅ Jun 2026 |
| Venta en curso (card Home + pantalla menú) | ✅ Jun-Jul 2026 |
| Historial de ventas (lista + detalle + resumen pago parcial) | ✅ Jul 2026 |

---

## 🔴 Alta prioridad

### 1. Dashboard de métricas

**Objetivo:** Pantalla de resumen del negocio — la siguiente gran funcionalidad planificada.

**Métricas sugeridas:**
- Total vendido hoy / esta semana / este mes
- Cantidad de ventas en el período
- Medio de pago más usado
- Producto más vendido
- Clientes con mayor deuda
- Stock crítico (ítems con alerta activa)

**Notas de diseño:**
- Acceso desde menú hamburguesa
- Solo para administradores
- Reutilizar datos ya en Firestore (`/ventas`, `/clientes`, `calcularAlertasStock()`)
- Sin nueva colección — solo queries sobre datos existentes

---

### 2. Activar Firebase Authentication real

**Impacto:** Crítico — sin auth real la app no tiene seguridad para producción.
**Dependencias:** Acceso a Firebase Console → Authentication → Email/Password → Habilitar.

**Pasos:** ver `docs/MONIARQUIA_FIREBASE.md` sección 3 para el código exacto con comentarios `// TODO:` ya en `app.js`.

Después de activar Auth: conectar gestión de usuarios a Firestore, activar recuperación de contraseña real, migrar `vendedorId` de `correo` a `uid`.

---

### 3. Configurar reglas de seguridad en Firestore

**Impacto:** Crítico para producción — actualmente toda la base está abierta (`allow read, write: if true`).
**Dependencias:** Firebase Auth activo (ítem 2).
**Ver:** `docs/MONIARQUIA_FIREBASE.md` sección 6 para las reglas recomendadas.

---

## 🟡 Prioridad media

### 4. Cierre de caja diario

Resumen del día: ventas, ingresos, deudas generadas, cobros realizados. Navegable por fecha.

---

### 5. Reimpresión de tickets

Desde el Historial de ventas → Detalle → botón "Reimprimir". La infraestructura (snapshot inmutable de productos en `/ventas`) ya está lista.

---

### 6. Filtros avanzados en el Historial

- Por rango de fechas
- Por medio de pago
- Por vendedor (admin)
- Paginación real con cursor Firestore (`startAfter`)

Requiere índices compuestos en Firestore (Firestore los solicita con un link directo en el error de consola al ejecutar por primera vez).

---

### 7. Conectar gestión de usuarios a Firestore

**Dependencias:** Firebase Auth activo (ítem 2). Actualmente usa `usuariosLocales[]` en memoria.

---

## 🟢 Baja prioridad

### 8. Cambio por otro producto en C&D

Solo está implementado cambio de talle del mismo producto. Cambio por otro producto implica recalcular precios y diferencias.

---

### 9. Exportar reporte de ventas

CSV o HTML imprimible por período. Usando datos de `/ventas` ya existentes.

---

### 10. Versión desktop / sincronización

La arquitectura actual ya contempla:
- `origenVenta: 'movil'` en cada venta (campo para filtrar por origen)
- Todo el estado en Firestore (sin estado local que no se comparte)
- `vendedorId` en cada venta (para distinguir vendedor al sincronizar)

---

### 11. Limpieza de código huérfano

- `abrirModalQR()` / `modalDescargarQR()` / `#modal-qr-overlay` sin ningún botón que los invoque
- `vista-carrito` legacy en el DOM sin acceso visual
- `renderizarCatalogo()` / `renderizarFavoritos()` sin pantalla activa

---

*Roadmap — Julio 2026.*
