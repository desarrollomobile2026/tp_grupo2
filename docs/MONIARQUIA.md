# Moniarquía — Documento Maestro

> Versión: 3.0 — Actualizado: Julio 2026
> Fuente de verdad única del proyecto. Consultar antes de cualquier sesión de desarrollo.

---

## 1. Descripción del proyecto

**Moniarquía** es una PWA de gestión operativa para un showroom de ropa.
Permite administrar ventas, inventario, clientes y cuenta corriente desde un teléfono móvil.

| Campo | Valor |
|---|---|
| Institución | UNPAZ — Desarrollos para Dispositivos Móviles, C1, 2026 |
| Alumno | Oscar Castelani — castelani83@gmail.com |
| Repositorio | github.com/desarrollomobile2026/tp_grupo2 |
| Rama de trabajo | `oscar` (nunca tocar `main`) |

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla |
| Base de datos | Firebase Firestore (NoSQL, tiempo real) |
| Autenticación | Simulada en localStorage (Firebase Auth no activo) |
| Storage | Eliminado — imágenes por URL manual |
| Íconos | Lucide Icons (CDN) |
| Fuentes | Inter + Mr Dafoe (Google Fonts) |
| QR generación | QRious v4.0.2 (CDN) |
| QR lectura | jsQR v1.4.0 (CDN) — funcional |

### Estructura de archivos

```
tp_grupo2/
├── index.html      ← 57 vistas en un solo archivo SPA
├── style.css       ← Design system completo
├── app.js          ← Toda la lógica (~3300 líneas, ~140 funciones)
├── config.js       ← Credenciales Firebase (projectId: moniarquiaapp)
└── docs/
    ├── MONIARQUIA.md              ← Este archivo
    ├── MONIARQUIA_FIREBASE.md     ← Colecciones, campos, reglas
    ├── MONIARQUIA_Flujos.md       ← Flujos de navegación
    ├── MONIARQUIA_DESIGN_SYSTEM.md← Colores, tipografía, componentes
    ├── MONIARQUIA_ROADMAP.md      ← Próximas etapas
    ├── 00_REGLAS_DESARROLLO.md    ← Metodología de trabajo
    ├── referencias-ui/            ← Capturas del prototipo Figma
    └── images/                    ← Imágenes de productos de ejemplo
```

---

## 2. Estado actual del proyecto

> Actualizado: Julio 2026

| Módulo | Estado | Notas |
|---|---|---|
| **Splash de presentación** | ✅ Completo | 2s forzados por JS, bloquea navegación durante ese tiempo |
| **Autenticación** | ⚠️ Simulada | Mock con localStorage. Firebase Auth no activo aún. |
| **Home / Inicio** | ✅ Completo | Logo, avatar, alertas de stock bajo, card "Mi venta en curso", botones de acción |
| **Inventario** | ✅ Completo | CRUD, filtros, stock por talle, descarga de QR desde la card, chips de alerta |
| **Escaneo de cámara** | ✅ Completo | jsQR funcional. Comportamiento distinto según origen: venta/carrito → carrito; inventario → edición |
| **Carrito de venta** | ✅ Completo | Persiste en localStorage. "Venta en curso" recuperable desde Home y menú |
| **Venta en curso** | ✅ Completo | Card en Home + pantalla "Ventas en curso" en menú. Basado en `carritoVenta[]` existente |
| **Ventas** | ✅ Completo | 3 métodos de pago. Descuento de stock atómico via batch. |
| **Historial de ventas** | ✅ Completo | Lista paginada (50 más recientes). Detalle de venta con snapshot de productos. Filtro por rol (empleado ve solo las suyas). |
| **Detalle de venta** | ✅ Completo | Ticket completo: vendedor, cliente, medio de pago, estado, productos. Muestra resumen de pago parcial para cuenta corriente |
| **Clientes** | ✅ Completo | Lista, alta, edición, eliminación. Buscador en tiempo real. |
| **Cuenta corriente** | ✅ Completo | Detalle, movimientos en tiempo real, pagos completos y parciales |
| **Cambios y devoluciones** | ⚠️ Parcial | Solo cambio de talle del mismo producto |
| **Configuración** | ✅ Completo | Mi perfil, Gestión usuarios, Gestión clientes, Alertas de stock (admin), Cambiar contraseña, Logout |
| **Alertas de stock bajo** | ✅ Completo | Config en localStorage (activo/inactivo + umbral por talle), card roja en Home, chips amarillos en Inventario |
| **QR — Generación** | ✅ Completo | `codigoQR` guardado en Firestore. Acceso desde card del Inventario |
| **QR — Escaneo** | ✅ Completo | Funcional. Ver sección 8 de este documento |
| **Gestión de usuarios** | ⚠️ Mock | CRUD visual completo. Datos en memoria, no persisten |
| **Permisos por rol** | ✅ Completo | Admin vs Empleado. CSS (`data-rol`) + JS (`esAdmin()`). `aplicarRolUI()` re-renderiza el inventario al cambiar de sesión |

---

## 3. Roles y permisos

### Administrador/a
- CRUD de productos, clientes, gestión de usuarios
- Ver historial de ventas completo (todas las ventas)
- Configurar alertas de stock bajo
- Acceso completo a Configuración

### Empleado/Vendedor/a
- Ver inventario y modificar stock por talle
- Iniciar ventas, agregar al carrito, registrar pagos
- Ver y crear clientes (sin editar ni eliminar)
- Ver cuenta corriente del cliente
- Cambios y devoluciones
- Ver solo **sus propias ventas** en el historial (filtro automático por `vendedorId`)

**Implementación técnica:**
```css
#app-container[data-rol="empleado"] .solo-admin { display: none !important; }
```
```js
esAdmin()       // → sesionActual.rol === 'administrador'
aplicarRolUI()  // setea data-rol + re-renderiza inventario (crítico para evitar bug de timing)
```

---

## 4. Funcionalidades críticas que no deben romperse

Antes de cualquier cambio, verificar que estas funcionen:

1. **carritoVenta[]** — persiste en localStorage (`moniarquia_carrito_venta`). `sincronizarCarritoVenta()` actualiza Home + localStorage en cada mutación.
2. **registrarVenta()** — usa `batch.commit()` (venta + stock + cuenta corriente, atómico). No modificar la lógica de atomicidad.
3. **onSnapshot de productos** — `listaPrendasGlobal[]` es la fuente de verdad en memoria. Desconectarlo rompe el inventario y el flujo de venta.
4. **navegarA()** — tiene el guard `splashPresentacionActivo` (primeros 2s) que bloquea toda navegación. No eliminar sin entender implicancias.
5. **aplicarRolUI()** — llama `renderizarInventario()` al final. Si se quita ese llamado, los botones de editar/eliminar pueden quedar congelados con el rol incorrecto.
6. **Cuenta corriente** — `deudaTotal` se actualiza con `FieldValue.increment()`. No reemplazar por asignación directa.
7. **Historial de ventas** — Empleados tienen filtro automático por `vendedorId`. No quitar ese condicional en `cargarHistorialVentas()`.
8. **Selector de colores** — `coloresSeleccionados[]` se debe resetear en `inicializarColorSelector()` al abrir el formulario de producto.
9. **Splash de presentación** — `splashPresentacionActivo = true` al inicio + guard en `navegarA()`. La combinación garantiza el splash aunque el HTML servido venga sin la clase `active`.
10. **Permisos con data-rol** — `data-rol` se setea al hacer login. Si `aplicarRolUI()` no se llama en la restauración de sesión desde localStorage, los botones admin aparecen como empleado.

---

## 5. Base de datos Firestore

Ver `docs/MONIARQUIA_FIREBASE.md` para los schemas completos, reglas de seguridad y datos de prueba.

**Colecciones activas:**

| Colección | Propósito |
|---|---|
| `/productos` | Catálogo con stock, colores, talles, `codigoQR` |
| `/clientes` | Cartera de clientes con `deudaTotal` |
| `/ventas` | Registro de ventas con snapshot completo de productos + vendedor + cliente |
| `/cuentaCorriente` | Movimientos de deuda/pago por cliente |
| `/cambios` | Registro de cambios de talle |

**Campos nuevos en `/ventas` (Julio 2026):**
Los documentos nuevos incluyen: `idVenta`, `fechaCreacion`, `fechaActualizacion`, `vendedorId` (correo del vendedor), `vendedorNombre`, `clienteNombre` (snapshot), `origenVenta` (`'movil'`), `estadoVenta` (`'completada'`). Los documentos anteriores no tienen estos campos — el código los maneja con fallbacks (`|| '—'`, `|| 'Venta sin cliente'`).

---

## 6. Decisiones técnicas vigentes

**Sin Firebase Storage:** se intentó y se revirtió por problemas de configuración. Las imágenes se cargan por URL manual en `foto_url` o mediante mapeo automático de `obtenerFotoProducto()` a archivos en `docs/images/`.

**Autenticación simulada:** `USUARIOS_MOCK[]` hardcodeado. `sesionActual = { nombre, correo, rol }` en localStorage. Todo el código tiene comentarios `// TODO: reemplazar por firebase.auth()...` para la migración futura.

**Alertas de stock bajo en localStorage:** configuración del negocio (`{ activo, stockMinimo }`). Sincrónico, sin tocar Firestore. Migrable a `/configuracion/stockAlertas` cuando haya Auth real.

**Escaneo QR según origen:** `origenEscaneo` (`'venta'|'carrito'|'inventario'`) determina el destino. Desde inventario → `abrirFormProducto(id)`. Desde venta/carrito → `abrirProducto(id)` para agregar al carrito.

**Historial de ventas — paginación mínima:** se traen máximo 50 ventas, ordenadas por fecha en cliente (no via `orderBy` en Firestore para evitar requerir índices compuestos en el MVP). Los filtros avanzados + paginación real con cursor son próxima etapa.

**Layout del Home con `.home-bottom`:** la card "Mi venta en curso" y la card de alertas de stock van dentro de `.home-bottom { margin-top: auto }`. Las cards principales NO tienen `margin-top:auto` propio; si se agrega una card nueva al Home, debe ir dentro de `.home-bottom` y NO como hermano directo de `.home-logo`.

**Splash de presentación forzado por JS:** no depende de que el HTML servido traiga `class="active"` ya puesto. `DOMContentLoaded` limpia todas las vistas y fuerza el splash por código + agrega `.splash-presentacion-forzado` (`z-index:9999`). Esto evita que el hosting/CDN sirviendo una copia cacheada del HTML salte el splash.

---

## 7. Historial del módulo QR (resuelto)

El escaneo QR no funcionaba en iPhone. Tras múltiples iteraciones se descubrió que la causa no era técnica (no era jsQR ni iOS Safari): el QR solo era accesible desde el formulario "Editar producto". Al guardar el producto desde ese formulario se producía un estado inconsistente que impedía el escaneo.

**Solución:** el QR fue removido del formulario de edición y movido a la card del inventario (botón "Descargar QR" debajo de talles/total). El escaneo comenzó a funcionar correctamente.

**Estado actual:**
- Generación → ✅ funcional
- Descarga → ✅ desde card del Inventario (único acceso)
- Escaneo → ✅ funcional en iPhone con jsQR
- Panel de diagnóstico `#escaner-status` → eliminado (ya no necesario)

---

## 8. Deudas técnicas

| Deuda | Impacto | Prioridad |
|---|---|---|
| `abrirModalQR()` / `#modal-qr-overlay` sin caller | Bajo — código muerto, no afecta funcionalidad | Baja |
| `vista-carrito` legacy en el DOM | Bajo — sin acceso visual | Baja |
| `renderizarCatalogo()` / `renderizarFavoritos()` sin pantalla activa | Bajo — funciones huérfanas | Baja |
| Sin paginación real en historial/ventas | Medio — a escala de centenares de ventas, los 50 más recientes pueden no ser suficientes | Media |
| Firebase Auth no activo | Alto — sin seguridad real en producción | Alta |
| Reglas de Firestore abiertas (`allow read, write: if true`) | Alto — aceptable en desarrollo, crítico en producción | Alta |
| Gestión de usuarios sin persistencia (datos en memoria) | Medio | Media |
| `vendedorId` es el correo (no uid real) | Bajo ahora, requiere migración cuando se active Auth | Media |

---

## 9. Última iteración realizada

**Julio 2026 — Historial de ventas e iteraciones QR**

Funcionalidades agregadas en las últimas 5-6 sesiones de desarrollo:
1. Splash de presentación (`#vista-splash-presentacion`, 2s, forzado por JS)
2. Reubicación del QR al Inventario + eliminación del QR en "Editar producto"
3. Escaneo QR diferenciado por origen (venta/carrito vs inventario)
4. Corrección de bug de roles: `aplicarRolUI()` re-renderiza el inventario
5. Alertas de stock bajo (config + Home + Inventario)
6. Venta en curso: card en Home + pantalla "Ventas en curso" en menú
7. Historial de ventas: lista + detalle + resumen de pago parcial en cuenta corriente
8. Campos nuevos en `/ventas`: `vendedorId`, `vendedorNombre`, `clienteNombre`, `origenVenta`, `estadoVenta`, `fechaCreacion`, `fechaActualizacion`

---

## 10. Índice de documentación

| Archivo | Cuándo leer |
|---|---|
| **`MONIARQUIA.md`** (este archivo) | Siempre primero — visión completa del proyecto |
| **`MONIARQUIA_FIREBASE.md`** | Al tocar colecciones, campos o reglas de Firestore |
| **`MONIARQUIA_Flujos.md`** | Al implementar un flujo nuevo o modificar navegación |
| **`MONIARQUIA_DESIGN_SYSTEM.md`** | Al crear nuevas pantallas o componentes |
| **`MONIARQUIA_ROADMAP.md`** | Al decidir qué implementar a continuación |
| **`00_REGLAS_DESARROLLO.md`** | Al iniciar una nueva sesión de desarrollo |

---

*Documento maestro — Julio 2026.*
