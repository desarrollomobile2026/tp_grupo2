# Moniarquía — Estado Actual del Proyecto

> Resumen ejecutivo. Actualizado: Junio 2026.
> Para detalles técnicos ver `docs/MONIARQUIA.md`.

---

## ✅ Qué funciona actualmente

### Autenticación (simulada)
- Login con dos usuarios mock: `admin@moniarquia.com` / `123456` y `empleado@moniarquia.com` / `123456`
- Sesión persistida en localStorage
- Logout limpia sesión y vuelve al splash
- Avatar de perfil en el header del Home
- Permisos visuales por rol (admin vs empleado)

### Home y navegación
- Pantalla de inicio con botones "Iniciar venta" y "Consultar stock"
- Menú hamburguesa con todas las secciones
- Botón volver con historial de navegación
- Header consistente con título en todas las pantallas
- Responsividad corregida para iPhone SE hasta iPhone 14 Pro Max

### Inventario
- Listado con fotos, chips de talla/stock, nombre, categoría, precio
- Alta de producto con nombre, precio, categoría, colores (selector visual), descripción, URL de foto, stock por talle
- Edición completa con datos precargados
- Eliminación con confirmación
- Búsqueda por nombre y filtro por categoría
- Generación automática de QR (`codigoQR` en Firestore)
- Visualización y descarga del QR en el formulario de edición
- **Empleados:** pueden ver inventario y modificar stock por talle (sin editar/eliminar productos)
- **Administradores:** acceso CRUD completo

### Flujo de venta
- Selección de producto con foto, descripción, selector de color (visual), selector de talle, cantidad
- Carrito con todos los ítems, subtotales y total
- "Escanear otro" / "Buscar manualmente" para agregar más productos
- Modal "¿Asociar cliente?"
- Selección de cliente existente o alta rápida desde el flujo de venta
- Tres métodos de pago: Efectivo, Mercado Pago, Cuenta corriente
- Registro de venta en Firestore con descuento atómico de stock
- Pantallas de éxito por método de pago

### Clientes
- Lista con buscador, teléfono y email visibles
- Alta de cliente
- Edición y eliminación con confirmación
- Advertencia si el cliente tiene deuda al eliminar
- Búsqueda en tiempo real

### Cuenta corriente
- Detalle del cliente con saldo pendiente (rojo si debe, verde si está al día)
- Historial de movimientos (débitos y pagos) en tiempo real via onSnapshot
- Historial de compras asociadas
- Registro de pago completo
- Registro de pago parcial con cálculo del saldo restante

### Cambios y devoluciones
- Búsqueda de venta por nombre de cliente o ticket (últimos 6 caracteres del ID)
- Lista de ventas recientes
- Selección del ítem a cambiar (con foto del producto)
- Selección del nuevo talle (solo talles con stock disponible)
- Pantalla de confirmación con talle devuelto → talle nuevo
- Actualización atómica de stock en Firestore + registro en `/cambios`

### Configuración
- Mi perfil: ver nombre, email, rol, estado. Editar nombre y email.
- Gestión de usuarios: CRUD visual completo con datos mock
- Gestión de clientes: navega al módulo de clientes existente
- Cambiar contraseña: flujo visual con validaciones
- Cerrar sesión: limpia estado y navega al splash

### QR (generación, descarga y escaneo)
- `codigoQR: "MONIARQUIA_PRODUCTO_<idFirestore>"` guardado en Firestore
- Canvas con el QR visible desde la **card del inventario** (modal) y como acceso secundario en el formulario de edición
- Descarga como PNG de 300px (calidad para impresión) — disponible en el modal del inventario
- **Escaneo QR funcional** — cámara, loop de jsQR y búsqueda en Firestore operativos
- **Causa raíz del problema anterior resuelta:** el QR solo era accesible desde "Editar producto". Al reubicarlo en el inventario, el flujo se normalizó y el escaneo comenzó a funcionar.

---

## ⚠️ Qué está parcialmente implementado

### Autenticación
- Login/logout funcionan pero con datos hardcodeados, no con Firebase Auth real
- Registro crea un perfil visual pero no persiste en Firestore
- Recuperación de contraseña es solo visual (no envía emails)
- **Requiere:** activar Firebase Auth Email/Password en consola

### ~~QR — Lectura/Escaneo~~ ✅ Resuelto

El problema del escaneo QR fue identificado y resuelto. Ver `docs/MONIARQUIA_QR.md` sección de resolución final para el detalle completo.

### Gestión de usuarios (Configuración)
- Pantallas y flujos completos: lista, crear, editar, cambiar rol, activar/desactivar, eliminar
- **No conectado a Firestore** — usa `usuariosLocales[]` en memoria
- Código tiene comentarios `// TODO: reemplazar por db.collection('usuarios')...`

### Cambios y devoluciones
- Solo cambio de **talle del mismo producto** implementado
- **Pendiente:** cambio por otro producto diferente

---

## ❌ Qué está pendiente de implementar

| Funcionalidad | Prioridad | Dependencia |
|---|---|---|
| Firebase Auth real (login, registro, logout) | Alta | Activar en Firebase Console |
| ~~Escaneo QR funcional~~ | ✅ Resuelto | — |
| Gestión de usuarios conectada a Firestore | Media | Firebase Auth activo |
| Cambio por otro producto en C&D | Baja | Ninguna |
| Recuperación real de contraseña | Media | Firebase Auth activo |
| Reglas de seguridad en Firestore | Alta (producción) | Ninguna |
| Configuración de usuarios: roles reales | Media | Firebase Auth + Firestore /usuarios |

---

## 🔮 Próximas iteraciones sugeridas

### Iteración A — ~~Resolver QR en iPhone~~ ✅ Completado

El sistema QR (generación, descarga y escaneo) está funcionando correctamente. Ver `docs/MONIARQUIA_QR.md` para el detalle de la resolución.

### Iteración B — Activar Firebase Auth
1. Habilitar Email/Password en Firebase Console
2. Reemplazar `loginSimulado()` por `firebase.auth().signInWithEmailAndPassword()`
3. Reemplazar `registroSimulado()` por `createUserWithEmailAndPassword()` + escritura en `/usuarios`
4. Reemplazar `onAuthStateChanged` simulado por el real
5. Conectar gestión de usuarios a Firestore

### Iteración C — Producción
1. Configurar reglas de Firestore (leer/escribir solo si autenticado)
2. Agregar paginación en listas grandes
3. Optimizar onSnapshot (suscripciones selectivas)
4. Gestión de errores de red

---

## ⚡ Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| ~~jsQR no funciona en iOS~~ | Resuelto | jsQR funciona correctamente — el problema era de UX |
| Firestore sin reglas en producción | Alta | Alto | Agregar reglas antes de despliegue |
| Datos de sesión en localStorage expuestos | Media | Medio | Firebase Auth real reemplaza esto |
| CDN de jsQR/QRious no disponible | Baja | Alto | Incluir como archivos locales |
| Conflicto de onSnapshot sin cleanup | Media | Medio | Ya hay `unsubscribeMovimientos()` — revisar otros |

---

## 🔧 Deudas técnicas

| Deuda | Descripción |
|---|---|
| `vista-carrito` legacy | Vista del carrito del código base original en el DOM, sin acceso visual. Puede eliminarse. |
| `renderizarCatalogo()` / `renderizarFavoritos()` | Funciones del código base que ya no tienen pantalla activa. Candidatas a eliminar. |
| Contraseñas en USUARIOS_MOCK | Hardcodeadas en el código fuente. Solo aceptable para demo, no para producción. |
| `fun alta-foto`, `alta-nombre`, etc. | IDs del formulario de producto legacy comentados en HTML. Pueden eliminarse. |
| `dbgFrames`, `dbgSinQRTimer`, panel `#escaner-status` | Variables y panel de debug del escáner. QR resuelto — pueden eliminarse o mantenerse como diagnóstico. |
| Sin paginación | Las listas de clientes, productos y ventas cargan todos los documentos. Problema a escala. |

---

*Estado actual — Junio 2026.*
