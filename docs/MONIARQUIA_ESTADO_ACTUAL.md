# Moniarquía — Estado Actual del Proyecto

> Resumen ejecutivo. Actualizado: 30 de junio de 2026.
> Para detalles técnicos ver `docs/MONIARQUIA.md`.

---

## ✅ Qué funciona actualmente

### Splash de presentación
- Pantalla introductoria con logo, ícono de corazón y eslogan "VESTITE CON ONDA, VESTITE COMO QUIERAS."
- Se muestra siempre al abrir o recargar la app, durante 2 segundos exactos
- Forzada por JS (`splashPresentacionActivo`), no depende del HTML servido
- Bloquea cualquier navegación automática mientras está activa
- No se agrega al historial de navegación
- Luego de los 2s, continúa con la lógica normal: sesión guardada → Home; sin sesión → pantalla de bienvenida/login

### Autenticación (simulada)
- Login con dos usuarios mock: `admin@moniarquia.com` / `123456` y `empleado@moniarquia.com` / `123456`
- Sesión persistida en localStorage
- Logout limpia sesión y vuelve al splash
- Avatar de perfil en el header del Home
- Permisos visuales por rol (admin vs empleado)

### Home y navegación
- Pantalla de inicio con botones "Iniciar venta" y "Consultar stock"
- Card de alertas de stock bajo (fondo rojo), visible solo cuando hay productos afectados, ubicada entre el logo y los botones sin desplazarlos de su posición
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
- Botón "Descargar QR" dentro de la card del producto (debajo de talles/total) — único punto de acceso al QR
- Chips de talla con indicador visual (fondo amarillo) cuando el stock está en o por debajo del mínimo configurado
- Botón "Escanear producto" (solo admin) que abre directamente la edición del producto escaneado, sin pasar por el flujo de venta
- **Empleados:** pueden ver inventario y modificar stock por talle (sin editar/eliminar productos)
- **Administradores:** acceso CRUD completo
- Las cards se regeneran automáticamente al cambiar de rol (login, restauración de sesión) — corrige una regresión donde quedaban con los botones del rol anterior

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
- Alertas de stock bajo (solo admin): activar/desactivar + definir stock mínimo por talle
- Cambiar contraseña: flujo visual con validaciones
- Cerrar sesión: limpia estado y navega al splash

### Alertas de stock bajo
- Configuración persistida en localStorage (`moniarquia_config_stock`): `{ activo, stockMinimo }`
- Cálculo por talle (no por stock total del producto): cualquier talle con cantidad ≤ stockMínimo genera una alerta
- Card roja en Home con la lista de productos/talles afectados y botón "Ver productos"
- Chips amarillos en las cards del Inventario sobre los talles en alerta
- Solo administradores pueden modificar la configuración; empleados solo visualizan las alertas

### QR (generación, descarga y escaneo)
- `codigoQR: "MONIARQUIA_PRODUCTO_<idFirestore>"` guardado en Firestore
- El QR ya **no existe en el formulario "Editar producto"** — fue eliminado completamente de esa pantalla
- Único acceso: botón "Descargar QR" en la card del inventario, debajo de la fila de talles/total, ancho completo
- Descarga como PNG de 300px (calidad para impresión)
- **Escaneo QR funcional** — cámara, loop de jsQR y búsqueda en Firestore operativos
- El escaneo tiene comportamiento distinto según el origen: desde venta/carrito abre la selección de talle-color-cantidad; desde Inventario abre directamente la edición del producto
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
| ~~`dbgFrames`, `dbgSinQRTimer`, panel `#escaner-status`~~ | Eliminados — el código de diagnóstico del escáner ya fue removido (QR resuelto). |
| `abrirModalQR()`, `modalDescargarQR()`, `#modal-qr-overlay` | Quedaron sin ningún botón que los invoque tras mover la descarga directa a la card del inventario. Candidatos a eliminar si no se reutilizan. |
| Sin paginación | Las listas de clientes, productos y ventas cargan todos los documentos. Problema a escala. |

---

*Estado actual — Actualizado 30 de junio de 2026.*
