# Moniarquía — Contexto para IA

> **Documento de onboarding.** Leer este archivo antes de cualquier sesión de desarrollo.
> Actualizado: 30 de junio de 2026 — Rama: `oscar` — Versión: 2.1

---

## 1. Resumen del proyecto

**Moniarquía** es una Progressive Web App (PWA) de gestión operativa para un showroom de ropa.
Permite al equipo del local administrar ventas, stock, clientes y cuenta corriente desde un teléfono móvil.

**Problema que resuelve:**
El showroom operaba con anotaciones manuales y sin control de stock en tiempo real. La app centraliza la operación: un vendedor puede iniciar una venta, escanear una prenda, registrar el pago y actualizar el stock sin salir de la pantalla.

**Tipo de negocio:** Showroom / local de indumentaria femenina.

**Objetivo académico:** Trabajo Práctico Integrador de la materia "Desarrollos para Dispositivos Móviles" — UNPAZ, Comisión C1, 2026. Alumno: Oscar Castelani (castelani83@gmail.com).

**Tecnologías:**

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla (sin frameworks) |
| Base de datos | Firebase Firestore (NoSQL, tiempo real) |
| Autenticación | Simulada localmente (Firebase Auth no activo aún) |
| Storage | Eliminado — imágenes por URL manual o archivos locales |
| Íconos | Lucide Icons (CDN) |
| Fuentes | Inter + Mr Dafoe (Google Fonts) |
| QR generación | QRious v4.0.2 (CDN) |
| QR lectura | jsQR v1.4.0 (CDN) — funcional |

**Repositorio:** `https://github.com/desarrollomobile2026/tp_grupo2` — rama `oscar`

---

## 2. Estado general del proyecto

| Módulo | Estado | Observaciones |
|---|---|---|
| **Splash de presentación** | ✅ Implementado | Logo + eslogan, 2s, forzado por JS, bloquea navegación mientras dura. |
| **Autenticación** | ⚠️ Parcial | Funciona con datos mock. Firebase Auth no activado. Ver sección 9. |
| **Inicio / Home** | ✅ Implementado | Logo, menú, 2 cards de acción, avatar de perfil con rol, card de alertas de stock bajo. |
| **Inventario** | ✅ Implementado | CRUD completo, filtros, selector visual de colores, stock por talla, descarga de QR, chips de alerta de stock bajo. |
| **Escaneo de cámara** | ✅ Implementado | Cámara, loop jsQR y búsqueda en Firestore funcionan correctamente. Comportamiento distinto según `origenEscaneo` (venta/carrito → carrito; inventario → edición). |
| **Carrito** | ✅ Implementado | Selección de producto/talle/color/cantidad. Persiste en localStorage. |
| **Ventas** | ✅ Implementado | Registro en Firestore, 3 métodos de pago, stock descontado atómicamente. |
| **Clientes** | ✅ Implementado | Lista, alta, edición, eliminación. Buscador en tiempo real. |
| **Cuenta corriente** | ✅ Implementado | Detalle, movimientos en tiempo real, pagos completos y parciales. |
| **Pagos** | ✅ Implementado | Efectivo, Mercado Pago (externo), Cuenta corriente. |
| **Cambios y devoluciones** | ⚠️ Parcial | Solo cambio de talle del mismo producto. Cambio por otro producto: pendiente. |
| **Configuración** | ✅ Implementado | Mi perfil, Gestión usuarios, Gestión clientes, Alertas de stock bajo (solo admin), Cambiar contraseña, Logout. |
| **Gestión de usuarios** | ⚠️ Parcial | CRUD visual completo. Datos en memoria, no en Firestore. |
| **QR — generación** | ✅ Implementado | codigoQR en Firestore. |
| **QR — descarga** | ✅ Implementado | Único acceso: card del inventario. Eliminado del formulario "Editar producto". |
| **QR — escaneo** | ✅ Implementado | Escaneo QR funcional. Causa raíz resuelta (ver sección 9 y `docs/MONIARQUIA_QR.md`). |
| **Alertas de stock bajo** | ✅ Implementado | Configuración en localStorage, card en Home, chips en Inventario. Cálculo por talle. |
| **Permisos por rol** | ✅ Implementado | Restricciones visuales: admin vs empleado. Bug de timing al cambiar de rol corregido (`aplicarRolUI()` re-renderiza el inventario). |

---

## 3. Estructura del proyecto

```
tp_grupo2/
├── index.html      ← TODAS las vistas (54 vistas en un solo archivo SPA)
├── style.css       ← Design system + estilos de todos los componentes
├── app.js          ← Toda la lógica: ~3100 líneas, 137 funciones
├── config.js       ← Credenciales Firebase (projectId: moniarquiaapp)
├── README.md       ← Instrucciones básicas del código base original
└── docs/
    ├── MONIARQUIA_CONTEXTO_PARA_IA.md   ← Este archivo
    ├── MONIARQUIA.md                    ← Documento maestro
    ├── MONIARQUIA_ESTADO_ACTUAL.md      ← Resumen ejecutivo
    ├── MONIARQUIA_FIREBASE.md           ← Configuración Firebase
    ├── MONIARQUIA_DESIGN_SYSTEM.md      ← Colores, tipografía, componentes
    ├── MONIARQUIA_Flujos.md             ← Flujos de navegación (22 flujos)
    ├── MONIARQUIA_QR.md                 ← Bitácora técnica del QR
    ├── MONIARQUIA_ROADMAP.md            ← Hoja de ruta priorizada
    ├── 00_REGLAS_DESARROLLO.md          ← Metodología de trabajo
    ├── referencias-ui/                  ← Capturas del prototipo Figma (.png)
    └── images/                          ← Imágenes de productos de ejemplo
```

### Responsabilidades de cada archivo

**`index.html`:** Declara las 54 vistas como elementos `<main class="vista">`. Solo una está activa (`.active`) — al cargar, `#vista-splash-presentacion` es la inicial. Contiene los CDN de Firebase, Lucide, QRious, jsQR. No contiene lógica.

**`style.css`:** Design system completo. Variables CSS con los tokens de color (`--rojo-moniarquia: #FF6677`, etc.). Estilos de todos los componentes. El control de vistas activas usa `data-vista` en `#app-container`. No usar `!important` salvo en permisos por rol.

**`app.js`:** Todo el JavaScript. Organizado en secciones numeradas (1 a 14+). Funciona como un monolito vanilla JS. Las funciones están en el scope global (window) porque se llaman desde atributos `onclick` del HTML.

**`config.js`:** Inicializa Firebase. Declara `const db = firebase.firestore()`. Firebase Auth y Storage no están inicializados actualmente.

---

## 4. Base de datos

### Colecciones activas en Firestore

| Colección | Propósito | Tiempo real |
|---|---|---|
| `/productos` | Catálogo de prendas con stock | ✅ onSnapshot |
| `/clientes` | Cartera de clientes | ✅ onSnapshot |
| `/ventas` | Registro de transacciones | No (get puntual) |
| `/cuentaCorriente` | Movimientos de deuda/pago | ✅ onSnapshot (por cliente) |
| `/cambios` | Registro de cambios de talle | No (solo escritura) |

### Campos clave de `/productos`

```js
{
  nombre, precio, categoria, colores: string[],
  descripcion, foto_url,
  stockPorTalla: { S: n, M: n, L: n, XL: n }, // o 36/38/40/42/44
  tallas: string[], stock: number,
  codigoQR: "MONIARQUIA_PRODUCTO_<docId>",
  likes: 0, createdAt: timestamp
}
```

### Campos clave de `/ventas`

```js
{
  clienteId: string | null, // null = venta anónima
  items: [{ productoId, nombre, talla, color, cantidad, precioUnitario, subtotal }],
  total, metodoPago: "efectivo"|"mercadopago"|"cuenta_corriente",
  estado: "completada"|"deuda", montoAbonado, fecha: timestamp
}
```

### Datos de prueba — Usuarios demo (autenticación simulada)

```
Admin:    admin@moniarquia.com    / 123456
Empleado: empleado@moniarquia.com / 123456
```

### Productos de ejemplo locales (en `docs/images/`)

Los productos cuyo nombre contiene "buzo", "campera", o "remera" muestran automáticamente una foto local via `obtenerFotoProducto(p)`. No requieren URL en Firestore.

---

## 5. Roles de la aplicación

### Administrador/a

Acceso completo:
- CRUD de productos (agregar, editar, eliminar)
- Ver y modificar stock
- CRUD de clientes (incluyendo editar y eliminar)
- Registrar ventas con cualquier método de pago
- Ver historial de cuenta corriente
- Registrar pagos de clientes
- Cambios y devoluciones
- Gestión de usuarios (configuración)
- Acceso a toda la configuración

### Empleado/Vendedor

Acceso restringido:
- Ver inventario (sin agregar, editar ni eliminar productos)
- Modificar stock por talle (tiene su propio botón: ícono `package-plus`)
- Iniciar ventas y agregar al carrito
- Ver y crear clientes (sin editar ni eliminar)
- Registrar ventas con todos los métodos de pago
- Ver cuenta corriente del cliente
- Cambios y devoluciones
- Mi perfil y Cambiar contraseña
- **NO puede:** Gestión de usuarios, eliminar productos/clientes

**Implementación técnica de permisos:**
- CSS: `#app-container[data-rol="empleado"] .solo-admin { display: none !important; }`
- JS: `esAdmin()` → compara `sesionActual.rol === 'administrador'`
- `aplicarRolUI()` setea `data-rol` en `#app-container` al hacer login
- Funciones sensibles tienen `if (!verificarPermisoAccion('...')) return;` al inicio

---

## 6. Funcionalidades críticas que no deben romperse

Antes de mergear cualquier cambio, verificar que estas funciones siguen operativas:

1. **Carrito de venta** — `carritoVenta[]` en localStorage (`moniarquia_carrito_venta`). Al agregar un producto, talle y color son obligatorios. El carrito persiste entre navegaciones.
2. **Registro de venta** — `registrarVenta()` usa `batch.commit()` que actualiza stock y registra la venta atómicamente. Si falla, no se descuenta stock.
3. **Cuenta corriente** — `deudaTotal` se actualiza con `FieldValue.increment()`. Las lecturas de movimientos usan `onSnapshot`.
4. **onSnapshot de productos** — `listaPrendasGlobal[]` es la fuente de verdad en memoria. Si se corrompe, todo el flujo de venta falla.
5. **onSnapshot de clientes** — `listClientesGlobal[]` idem para el módulo de clientes.
6. **Navegación con historial** — `historialNavegacion[]` + `navegarA(vistaId, { silencioso: true })`. El parámetro `silencioso: true` evita agregar al historial (post-acciones). No omitirlo en redirects programáticos.
7. **Permisos por rol** — `data-rol` en `#app-container`. Se setea al hacer login y NO al navegar entre vistas.
8. **Búsqueda manual de productos** — `buscarManualmente()` es el fallback cuando el QR no funciona. Siempre debe estar disponible en la pantalla de escaneo.
9. **Inventario tiempo real** — El `onSnapshot` de `/productos` inicia en `DOMContentLoaded`. Si se desactiva o se rompe, el inventario y el flujo de venta quedan sin datos.
10. **Selector de colores** — `coloresSeleccionados[]` es el estado del selector visual. Al abrir el formulario, `inicializarColorSelector(coloresExistentes)` debe resetear el estado correctamente.
11. **Splash de presentación** — `splashPresentacionActivo` bloquea `navegarA()` durante los primeros 2 segundos. No quitar el guard de `navegarA()` ni reducir el `setTimeout` sin revisar que no rompa la secuencia splash → home/login.
12. **Re-render del inventario al cambiar de rol** — `aplicarRolUI()` llama `renderizarInventario()` al final. Si se quita, los botones de editar/eliminar pueden quedar "congelados" con el rol del primer render (bug ya corregido, no reintroducirlo).

---

## 7. Decisiones técnicas importantes

### ¿Por qué Firebase (Firestore)?
Sin servidor propio. Tiene SDK compat v10 compatible con vanilla JS. Los `onSnapshot` en tiempo real eliminan la necesidad de polling. El `batch.commit()` permite transacciones atómicas simples.

### ¿Por qué Firestore y no Realtime Database?
Firestore tiene mejor estructura para consultas complejas (where + orderBy), mejor integración con reglas de seguridad y soporte offline nativo.

### Eliminación de Firebase Storage
Se intentó implementar carga de imágenes desde galería. El bucket requería configuración adicional y las reglas bloqueaban las subidas en iOS. Revertido. Las imágenes se manejan hoy con:
1. URL manual en el campo `foto_url`
2. Mapeo automático a imágenes locales en `docs/images/` via `obtenerFotoProducto(p)`

### Sistema de QR
- **QRious** genera el QR en un canvas (client-side, sin servidor)
- El código guardado es solo el string `"MONIARQUIA_PRODUCTO_<idFirestore>"` — no la imagen
- El canvas de display es 160px; la descarga usa un canvas temporal de 300px para mejor calidad
- **jsQR** lee los frames del video con `requestAnimationFrame` + `canvas.getImageData()`
- El loop empieza después de `videoEl.play()` (no en `onloadedmetadata` — no confiable en iOS)

### Búsqueda manual como fallback
La app siempre ofrece "Buscar producto manualmente" en la pantalla de escaneo. Esto previene que el usuario quede bloqueado si la cámara o el QR fallan.

### Hallazgo: causa raíz del problema de escaneo QR (Junio 2026)

El problema del escaneo no estaba relacionado con jsQR, iOS Safari, ni el CDN. La causa fue funcional: el QR solo era accesible desde el formulario "Editar producto". Al interactuar con ese formulario y guardar, se producía un estado inconsistente que afectaba el escaneo. La reubicación del acceso al QR hacia el inventario (modal desde la card) resolvió el problema. **jsQR funciona correctamente en iPhone.**

### Autenticación simulada
Firebase Auth fue implementado y luego revertido. El sistema actual usa:
- `USUARIOS_MOCK[]` — array con email, password (hardcoded), rol
- `sesionActual` en localStorage — `{ nombre, correo, rol }` (sin contraseña)
- Funciones con comentarios `// TODO: reemplazar por firebase.auth()...`

### Escaneo QR según origen
La variable `origenEscaneo` (`'venta' | 'carrito' | 'inventario' | null`) se setea en `abrirEscaneo(origen)` y se lee en `procesarCodigoQR()` para decidir el destino: `abrirProducto(id)` (flujo de venta) o `abrirFormProducto(id)` (edición directa desde Inventario). Antes de esto, el botón de escaneo del Inventario reusaba el mismo flujo que "Iniciar venta", lo cual era incorrecto — escanear un producto desde Inventario debía abrir su edición, no agregarlo a un carrito.

### Alertas de stock bajo en localStorage
Ver el detalle de la decisión en `docs/MONIARQUIA.md` sección 4. En resumen: configuración del negocio (no por-usuario), sincrónica, sin tocar Firestore. La alerta se evalúa por talle (`cant <= configStock.stockMinimo`), no por el stock total del producto.

### Splash de presentación forzado por JS, no solo por HTML
La primera implementación dependía de que el HTML llegara con `class="vista active"` ya puesta en `#vista-splash-presentacion`. Se reforzó para que el propio `DOMContentLoaded` fuerce ese estado por JavaScript (clase `.active` + `.splash-presentacion-forzado` con `z-index:9999`) y bloquee `navegarA()` con `splashPresentacionActivo` durante 2000ms. Esto elimina cualquier dependencia de que el HTML servido ya venga en el estado correcto.

### Bug de timing en permisos por rol (corregido)
`renderizarInventario()` se dispara desde el `onSnapshot` de productos, que puede ejecutarse **antes** de que `sesionActual` esté cargada (al iniciar la app sin sesión guardada). El template de la card quedaba "congelado" con los botones de empleado aunque el usuario fuera admin. Se corrigió agregando `renderizarInventario()` al final de `aplicarRolUI()`, que se llama en cada login y en la restauración de sesión — garantiza que el inventario se re-renderice con el rol correcto.

### Desarrollo por iteraciones pequeñas
Se usó una metodología de etapas (1 a 8+). Cada etapa agrega funcionalidad sin romper la anterior. Los cambios deben ser presentados ANTES de implementarlos y esperar confirmación. Ver `docs/00_REGLAS_DESARROLLO.md`.

---

## 8. Estado actual del desarrollo

### ✅ Qué funciona

- Splash de presentación (2s, forzado por JS) al abrir/recargar la app
- Login/logout con usuarios demo (simulado)
- Home con permisos visuales por rol + card de alertas de stock bajo
- Inventario completo (CRUD, filtros, colores visual, stock por talla, descarga de QR, chips de alerta)
- Escaneo QR funcional, con comportamiento distinto según el origen (venta/carrito vs. inventario)
- Flujo de venta completo (selección → carrito → cliente → pago → confirmación)
- Tres métodos de pago con registro en Firestore
- Módulo de clientes completo (lista, alta, edición, eliminación)
- Cuenta corriente (deuda, pagos, historial en tiempo real)
- Cambios y devoluciones (cambio de talle, actualización de stock atómica)
- Configuración completa (Mi perfil, Gestión usuarios visual, Alertas de stock bajo, Cambiar contraseña)
- Generación y descarga de QR por producto (único acceso: card del Inventario)
- Sistema de alertas de stock bajo (configuración, Home, Inventario)
- Permisos por rol consistentes incluso al cambiar de usuario sin recargar la página

### ⚠️ Parcialmente implementado

- **Autenticación:** funciona con mock; no conectada a Firebase Auth real
- **Gestión de usuarios:** UI completa pero datos en memoria (no Firestore)
- **Cambios y devoluciones:** solo cambio de talle del mismo producto

### ❌ Pendiente

- Firebase Auth real habilitado en consola
- Gestión de usuarios conectada a Firestore
- Recuperación de contraseña real (requiere Auth)
- Reglas de seguridad en Firestore (actualmente abiertas)
- Cambio por otro producto en C&D
- Limpieza del modal QR huérfano (`abrirModalQR()`, `modalDescargarQR()`, `#modal-qr-overlay` sin invocadores)

---

## 9. Problemas abiertos (priorizados)

### ~~1. 🔴 Escaneo QR no funcional en iPhone~~ ✅ Resuelto

**Causa raíz identificada:**
El problema no era técnico. El QR solo era accesible desde el formulario "Editar producto". Al descargar y luego guardar el producto desde ese formulario, se producía un estado inconsistente que afectaba el escaneo.

**Solución implementada (estado final):**
El acceso al QR se reubicó en el inventario — botón "Descargar QR" de ancho completo dentro de cada card, debajo de talles/total, que descarga directamente sin pasar por un modal intermedio. El QR fue eliminado por completo del formulario de edición (ya no existe ahí ni como acceso secundario).

**Resultado:** jsQR, la cámara y la búsqueda en Firestore funcionan correctamente. Sistema QR estable. Además, se diferenció el comportamiento del escaneo según el origen: desde Inventario abre la edición del producto; desde venta/carrito abre la selección para agregar al carrito.

Ver `docs/MONIARQUIA_QR.md` sección de resolución final para el detalle completo.

---

### ~~2. 🟡 Botones editar/eliminar desaparecían en Inventario~~ ✅ Resuelto

**Causa raíz:** `renderizarInventario()` se ejecuta desde el `onSnapshot` de productos, que puede dispararse antes de que `sesionActual` esté cargada. El template quedaba "congelado" con los botones de empleado aunque el usuario fuera admin, porque nada volvía a renderizar el inventario después del login.

**Solución:** se agregó `renderizarInventario()` al final de `aplicarRolUI()`, que se llama en cada login y restauración de sesión.

---

### ~~3. 🟡 Splash de presentación no se mostraba~~ ✅ Resuelto

**Causa raíz:** la primera versión dependía de que el HTML llegara con la clase `active` ya puesta en `#vista-splash-presentacion`. Tras descartar caché de navegador, se confirmó que el verdadero problema era que los cambios nunca habían sido commiteados/pusheados al repositorio que alimenta el hosting — el sitio desplegado no tenía la implementación.

**Solución:** además de hacer commit y push de los cambios, se reforzó la implementación para que ya no dependa solo del HTML: `DOMContentLoaded` fuerza el estado del splash por JS (`splashPresentacionActivo`, clase `.splash-presentacion-forzado` con `z-index:9999`) y bloquea `navegarA()` durante 2000ms.

---

### 4. 🟡 Firebase Auth no activo

**Síntoma:** El login funciona con datos hardcodeados. Si se pierde la sesión en localStorage, el acceso vuelve al splash pero no hay un backend real que valide identidades.

**Para resolver:**
1. Firebase Console → Authentication → Email/Password → Habilitar
2. Reemplazar funciones simuladas (ya tienen comentarios `// TODO:`)
3. Ver `docs/MONIARQUIA_FIREBASE.md` sección 3 para el código exacto

---

### 5. 🟡 Gestión de usuarios sin persistencia

**Síntoma:** Los usuarios creados desde Configuración desaparecen al recargar la app.

**Para resolver:** Reemplazar `usuariosLocales[]` por `db.collection('usuarios').onSnapshot()` una vez que Auth esté activo.

---

## 10. Última iteración realizada

**Fecha:** 30 de junio de 2026

**Qué se desarrolló:**
1. Limpieza final del módulo QR: eliminado el código de diagnóstico del escáner (`actualizarDebugEscaneo()`, panel `#escaner-status`, variables `dbgFrames`/`dbgSinQRTimer`)
2. Reubicación definitiva del botón "Descargar QR": de un modal en Inventario, a un botón de ancho completo dentro de cada card (debajo de talles/total) con descarga directa, sin modal
3. Eliminación completa del bloque QR del formulario "Editar producto" (varias iteraciones de ida y vuelta hasta confirmar el estado final correcto)
4. Escaneo QR con comportamiento según origen: `origenEscaneo` (`'venta' | 'carrito' | 'inventario'`) determina si el QR detectado abre el carrito de venta o la edición directa del producto
5. Corrección de una regresión: los botones editar/eliminar desaparecían de las cards del Inventario por un bug de timing entre `onSnapshot` y la carga de la sesión — resuelto agregando `renderizarInventario()` a `aplicarRolUI()`
6. Sistema completo de alertas de stock bajo: configuración (activo/inactivo + stock mínimo) en Configuración (solo admin), persistida en localStorage; card roja en Home; chips de alerta en Inventario; cálculo por talle
7. Corrección de layout en Home: la card de alertas de stock empujaba los botones "Iniciar venta"/"Consultar stock" fuera de la zona ergonómica — resuelto agrupando alerta + botones en un wrapper `.home-bottom` con `margin-top: auto`
8. Splash screen de presentación: nueva vista `#vista-splash-presentacion` (logo + eslogan) visible 2 segundos al iniciar/recargar, forzada por JS con guard en `navegarA()`
9. Commit y push a `origin/oscar` — los cambios del splash no se reflejaban en el hosting porque nunca habían sido subidos al repositorio

**Archivos modificados en la última sesión:**
- `index.html` — vista de escaneo simplificada (sin panel de debug), card de alertas en Home, vista `#vista-config-stock`, vista `#vista-splash-presentacion`, botón de escaneo en Inventario con origen explícito
- `style.css` — estilos de card de alertas, chips de alerta, toggle switch, vista de configuración de stock, splash de presentación, wrapper `.home-bottom`
- `app.js` — `descargarQRDesdeInventario()`, `calcularAlertasStock()`, `renderizarAlertasHome()`, `abrirConfigStock()`, `guardarConfigStockForm()`, `cargarConfigStock()`/`guardarConfigStock()`, `origenEscaneo` en `procesarCodigoQR()`, `splashPresentacionActivo` + guard en `navegarA()`, `aplicarRolUI()` actualizada
- `docs/*.md` — actualización de toda la documentación existente (este archivo incluido)

**Resultado:** El sistema QR se considera estable y cerrado. Se sumó un módulo nuevo completo (alertas de stock bajo) y una pantalla nueva (splash de presentación). Los cambios están commiteados y pusheados a `oscar`.

---

## 11. Próxima iteración recomendada

### Opción A (recomendada): Activar Firebase Auth

**Objetivo:** Reemplazar autenticación simulada por Firebase Auth real.

**Dependencias:** Acceso a Firebase Console para habilitar Email/Password.

**Archivos a modificar:** `index.html` (agregar SDK), `app.js` (reemplazar funciones simuladas), `config.js` (agregar `firebase.auth()`).

**Ver:** `docs/MONIARQUIA_FIREBASE.md` sección 3 para el código exacto.

### Opción B: Conectar Gestión de usuarios a Firestore

**Objetivo:** Reemplazar `usuariosLocales[]` por una colección real, una vez que Firebase Auth esté activo (depende de la Opción A).

**Archivos a modificar:** `app.js` (funciones de gestión de usuarios).

### Opción C: Limpieza de código huérfano

**Objetivo:** Eliminar `abrirModalQR()`, `modalDescargarQR()` y `#modal-qr-overlay`, que quedaron sin ningún botón que los invoque tras la reubicación de la descarga del QR.

**Riesgo:** Muy bajo — es código sin uso, no afecta ningún flujo activo.

---

## 12. Cómo trabajar este proyecto

### Reglas de trabajo

1. **Trabajar por iteraciones pequeñas.** Cada módulo completo antes de pasar al siguiente.
2. **Presentar cambios antes de implementar.** Indicar: archivos a modificar, resumen de cambios, riesgos potenciales. Esperar confirmación.
3. **No modificar varios módulos al mismo tiempo.** Inventario, ventas, clientes, pagos son independientes. No mezclarlos en un mismo cambio.
4. **Respetar funcionalidades estables.** Si un cambio puede romper el carrito, los pagos o el inventario, detener y proponer alternativa.
5. **No eliminar código obsoleto sin avisar.** Conservarlo comentado hasta confirmar que no se necesita.
6. **Mantener Firebase funcionando.** Nunca desconectar los `onSnapshot` sin reemplazarlos.
7. **Actualizar los .md** cuando cambie el estado de un módulo.
8. **Rama de trabajo:** siempre `oscar`. Nunca modificar `main`.

### Comandos útiles

```bash
# Estado del repo
git status && git log --oneline -5

# Contar vistas y funciones
grep -c "id=\"vista-" index.html
grep -c "^function " app.js

# Verificar colecciones activas
grep "db\.collection(" app.js | grep -v "//"
```

### Patrón de navegación (recordatorio)

```js
// Navegación que agrega al historial (acción del usuario)
navegarA('vista-inventario');

// Navegación silenciosa (post-acción, no agrega al historial)
navegarA('vista-home', { silencioso: true });

// Volver atrás
volverAtras(); // pop del historial o va al home si está vacío
```

---

## 13. Índice de documentación

| Archivo | Descripción | Cuándo leer |
|---|---|---|
| **`MONIARQUIA_CONTEXTO_PARA_IA.md`** | Este archivo — onboarding completo | Siempre primero |
| **`MONIARQUIA.md`** | Documento maestro: info general, módulos, Firestore, decisiones técnicas | Al iniciar una nueva sesión |
| **`MONIARQUIA_ESTADO_ACTUAL.md`** | Resumen ejecutivo: qué funciona, qué no, riesgos, deudas | Al priorizar trabajo |
| **`MONIARQUIA_FIREBASE.md`** | Configuración Firebase, colecciones, reglas, datos de prueba | Al tocar Firebase |
| **`MONIARQUIA_DESIGN_SYSTEM.md`** | Colores, tipografía, componentes, UX móvil | Al crear nuevas pantallas |
| **`MONIARQUIA_Flujos.md`** | 22 flujos de navegación con diagramas textuales | Al implementar un flujo nuevo |
| **`MONIARQUIA_QR.md`** | Bitácora técnica completa del sistema QR | Al continuar el desarrollo del QR |
| **`MONIARQUIA_ROADMAP.md`** | Hoja de ruta priorizada con 13 ítems | Al decidir qué hacer a continuación |
| **`00_REGLAS_DESARROLLO.md`** | Metodología de trabajo, rama, etapas | Como referencia de proceso |

---

## 14. Punto exacto donde se detuvo el proyecto

**Fecha de parada:** 30 de junio de 2026

**Qué estaba en desarrollo:** Cierre del módulo QR, sistema de alertas de stock bajo y splash de presentación.

**Lo que funciona hoy:**
- Sistema QR completo y estable: generación automática, descarga única desde la card del Inventario, escaneo funcional con comportamiento según origen (venta/carrito vs. inventario)
- Sistema de alertas de stock bajo completo: configuración (solo admin), card en Home, chips en Inventario
- Splash de presentación funcional: se muestra 2 segundos al abrir/recargar, forzado por JS, no depende del estado inicial del HTML
- Cambios commiteados y pusheados a `origin/oscar` (el hosting debería reflejar estos cambios según su flujo de deploy configurado)

**Lo que no funciona / queda pendiente:**
- Firebase Auth sigue simulado (no activado en consola)
- Gestión de usuarios sigue en memoria, no en Firestore
- `abrirModalQR()`, `modalDescargarQR()` y `#modal-qr-overlay` quedaron como código huérfano (sin invocadores) tras simplificar la descarga del QR a un botón directo

**Consecuencia práctica:**
Ninguna funcionalidad crítica está bloqueada. Lo pendiente es expansión (Firebase Auth real) o limpieza menor (código huérfano), no bugs activos.

**Qué hacer al retomar:**
1. Confirmar que el hosting ya refleja el último push (`git log --oneline -3` debería mostrar el commit del splash screen como el más reciente o cercano)
2. Si se va a continuar el desarrollo, ver `docs/MONIARQUIA_ROADMAP.md` para elegir el siguiente ítem por prioridad
3. Seguir la metodología de `docs/00_REGLAS_DESARROLLO.md`: presentar el plan antes de implementar, esperar aprobación

---

## 15. Información de versión

| Campo | Valor |
|---|---|
| **Fecha de actualización** | 30 de junio de 2026 |
| **Rama activa** | `oscar` |
| **Versión del proyecto** | 2.1 |
| **Vistas en la app** | 54 vistas declaradas en `index.html` |
| **Funciones en app.js** | ~137 funciones, ~3100 líneas |
| **Colecciones Firebase activas** | productos, clientes, ventas, cuentaCorriente, cambios |
| **Firebase Auth** | NO activo — simulado en localStorage |
| **Firebase Storage** | NO activo — eliminado |
| **Última iteración documentada** | Cierre del módulo QR, alertas de stock bajo, splash de presentación |
| **Próxima iteración recomendada** | Activar Firebase Auth real (ver sección 11) |

---

*Este documento debe actualizarse al finalizar cada iteración importante. Si estás leyendo esto en el futuro, verificar que la fecha y el estado coincidan con el código real antes de comenzar.*
