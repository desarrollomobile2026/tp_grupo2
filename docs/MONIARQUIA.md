# Moniarquía — Documento Maestro del Proyecto

> Versión: 2.1 — Actualizado: 30 de junio de 2026
> Fuente de verdad única del proyecto. Consultar antes de cualquier sesión de desarrollo.

---

## 1. Información general

### Descripción

**Moniarquía** es una Progressive Web App (PWA) para la gestión operativa de un showroom de ropa.
Permite al equipo del local administrar ventas, inventario, clientes y cuenta corriente desde un dispositivo móvil, sin depender de software de escritorio.

### Contexto

- **Institución:** UNPAZ — Materia: Desarrollos para Dispositivos Móviles, Comisión C1, 2026
- **Alumno:** Oscar Castelani (castelani83@gmail.com)
- **Repositorio:** `https://github.com/desarrollomobile2026/tp_grupo2`
- **Rama de trabajo:** `oscar` (nunca modificar `main`)

### Actores y roles

| Rol | Permisos |
|---|---|
| **Administrador/a** | Acceso completo: ventas, inventario (CRUD), clientes (CRUD), cuenta corriente, configuración, gestión de usuarios |
| **Empleado/Vendedor/a** | Acceso restringido: iniciar ventas, ver inventario, gestionar stock por talle, ver y crear clientes, cambios y devoluciones |

La restricción por rol se aplica **visualmente en la interfaz**. Las reglas de seguridad de Firestore aún no están configuradas.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript vanilla (sin frameworks) |
| Backend | Firebase Firestore (NoSQL, tiempo real) |
| Autenticación | Simulada localmente (Firebase Auth no activo) |
| Almacenamiento | Firebase Storage (eliminado — no se usa) |
| Íconos | Lucide Icons (CDN) |
| Fuentes | Inter (body) + Mr Dafoe (logo) — Google Fonts |
| QR Generator | QRious v4.0.2 (CDN) |
| QR Reader | jsQR v1.4.0 (CDN) — funcional |

---

## 2. Estado actual del proyecto

> Última revisión: 30 de junio de 2026

| Módulo | Estado | Notas |
|---|---|---|
| **Splash de presentación** | ✅ Completo | Pantalla introductoria (logo + eslogan) visible 2s al abrir/recargar, antes de cualquier otra vista. Ver sección 4. |
| **Autenticación** | ⚠️ Simulada | Login/registro funcionan con datos mock. Firebase Auth está revertido. |
| **Home / Inicio** | ✅ Completo | Logo, menú hamburguesa, dos cards de acción, avatar de perfil, card de alertas de stock bajo. |
| **Inventario** | ✅ Completo | CRUD completo, búsqueda, filtros por categoría, talles por categoría, indicador visual de stock bajo. |
| **Escaneo de cámara** | ✅ Completo | Cámara, loop jsQR y búsqueda en Firestore funcionan correctamente. Comportamiento distinto según el origen (venta, carrito o inventario) — ver sección 4. |
| **Carrito de venta** | ✅ Completo | Selección de producto, talle, color, cantidad. Persiste en localStorage. |
| **Ventas** | ✅ Completo | Registro en Firestore, 3 métodos de pago, descuento de stock atómico. |
| **Clientes** | ✅ Completo | Lista, alta, edición, eliminación con confirmación. |
| **Cuenta corriente** | ✅ Completo | Detalle del cliente, historial de movimientos, pagos completos y parciales. |
| **Pagos** | ✅ Completo | Efectivo, Mercado Pago, Cuenta corriente. Mercado Pago no integra API (solo se confirma externamente). |
| **Cambios y devoluciones** | ⚠️ Parcial | Solo cambio de talle del mismo producto. Cambio por otro producto pendiente. |
| **Configuración** | ✅ Completo | Mi perfil, Gestión de usuarios, Gestión de clientes, Alertas de stock bajo (solo admin), Cambiar contraseña, Cerrar sesión. |
| **Gestión de usuarios** | ⚠️ Mock | Flujo visual completo (CRUD) pero con datos locales. No conectado a Firestore. |
| **Mi perfil / Cambiar contraseña** | ⚠️ Mock | Funcionalidad visual completa, no conectada a Firebase Auth. |
| **QR — Generación** | ✅ Completo | Se genera y guarda `codigoQR` en Firestore. |
| **QR — Descarga/Visualización** | ✅ Completo | Único acceso: botón "Descargar QR" en la card del inventario (debajo de talles/total). Ya no existe en "Editar producto". |
| **QR — Lectura/Escaneo** | ✅ Completo | Escaneo QR funcional. Causa raíz resuelta (ver `docs/MONIARQUIA_QR.md`). |
| **Alertas de stock bajo** | ✅ Completo | Nuevo módulo. Configuración de umbral (solo admin), card roja en Home, chips de alerta en Inventario. Ver sección 4. |
| **Permisos por rol** | ✅ Completo | Restricciones visuales aplicadas en inventario, clientes, configuración y alertas de stock. Corregido bug de timing al cambiar de rol (ver sección 5). |
| **Responsividad** | ✅ Completo | Corregida para múltiples tamaños de pantalla (dvh, clamp). |
| **Navegación con historial** | ✅ Completo | Stack de historial, botón volver inteligente. Bloqueado durante el splash de presentación. |

---

## 3. Base de datos Firestore

### Colecciones activas

#### `/productos/{productoId}`

```js
{
  nombre:       string,          // "Campera frizada"
  precio:       number,          // 38000
  categoria:    string,          // "Camperas" | "Remeras" | "Pantalones" | "Buzos" | "Shorts"
  colores:      string[],        // ["negro", "gris"]  — valores del selector predefinido
  descripcion:  string,          // "Manga larga, suave y frizada."
  foto_url:     string,          // URL de imagen (manual) o ""
  stockPorTalla: {               // mapa de talle → cantidad
    S: number, M: number, L: number, XL: number   // o 36, 38, 40, 42, 44 para pantalones
  },
  tallas:       string[],        // talles con stock > 0
  stock:        number,          // total de todas las tallas
  codigoQR:     string,          // "MONIARQUIA_PRODUCTO_<id>"  — agregado Jun 2026
  likes:        number,          // sistema heredado del código base (no se usa visualmente)
  createdAt:    timestamp
}
```

**Talles por categoría:**
- Remeras, Camperas, Buzos → `S, M, L, XL`
- Pantalones, Shorts → `36, 38, 40, 42, 44`

#### `/ventas/{ventaId}`

```js
{
  clienteId:    string | null,   // ref a /clientes o null si venta anónima
  items: [{
    productoId:     string,
    nombre:         string,
    talla:          string,
    color:          string,
    cantidad:       number,
    precioUnitario: number,
    subtotal:       number
  }],
  total:        number,
  metodoPago:   "efectivo" | "mercadopago" | "cuenta_corriente",
  estado:       "completada" | "deuda",
  montoAbonado: number,
  fecha:        timestamp
}
```

#### `/clientes/{clienteId}`

```js
{
  nombre:     string,
  telefono:   string,
  email:      string,
  deudaTotal: number,   // actualizado atómicamente con FieldValue.increment
  createdAt:  timestamp
}
```

#### `/cuentaCorriente/{registroId}`

```js
{
  clienteId:   string,   // ref a /clientes
  tipo:        "deuda" | "pago",
  monto:       number,
  descripcion: string,   // "Venta registrada" | "Pago registrado"
  ventaId:     string,   // ref a /ventas (solo en deudas)
  fecha:       timestamp
}
```

#### `/cambios/{cambioId}`

```js
{
  ventaId:        string,
  productoId:     string,
  nombreProducto: string,
  talleDevuelto:  string,
  talleNuevo:     string,
  clienteId:      string | null,
  fecha:          timestamp
}
```

### Colecciones definidas pero no activas

| Colección | Estado |
|---|---|
| `/usuarios` | Definida en el modelo. No se escribe (auth revertida). Gestión de usuarios usa datos mock. |

### Relaciones entre colecciones

```
/ventas  →  clienteId  →  /clientes
/ventas  →  items[].productoId  →  /productos
/cuentaCorriente  →  clienteId  →  /clientes
/cuentaCorriente  →  ventaId  →  /ventas
/cambios  →  productoId  →  /productos
/cambios  →  ventaId  →  /ventas
```

---

## 4. Decisiones técnicas importantes

### Firebase como backend

Firebase permite desplegar sin servidor propio, tiene integración nativa con Firestore en tiempo real (`onSnapshot`), y el SDK compat v10 es compatible con el enfoque vanilla JS del proyecto.

### QRious para generación de QR

18 KB minificado. Genera en canvas localmente sin llamadas externas. Simple API de una línea. Ver `docs/MONIARQUIA_QR.md` para detalles.

### jsQR para lectura de QR

Biblioteca pura JavaScript que trabaja con `ImageData` del canvas. Funciona con `requestAnimationFrame` + `canvas.getImageData()`. **Estado actual: funcional.** El problema inicial no era técnico — ver `docs/MONIARQUIA_QR.md` para el detalle de la resolución.

### Autenticación simulada (no Firebase Auth)

Firebase Auth fue implementado y luego revertido por problemas de configuración en la consola. Se reemplazó por un sistema simulado con:
- Datos mock hardcodeados (`USUARIOS_MOCK`)
- Sesión en localStorage (`moniarquia_session`)
- Sin tokens reales

El código tiene comentarios `// TODO: reemplazar por firebase.auth()...` en cada función para facilitar la integración futura.

### Carrito temporal en localStorage

El carrito de venta (`carritoVenta`) se persiste en localStorage con clave `moniarquia_carrito_venta`. Esto permite que el vendedor no pierda los productos si recarga accidentalmente. El carrito del código base original (`moniarquia_cart_v1`) se conservó sin tocar.

### Cuenta corriente como método de pago

En lugar de integrar una pasarela de pago real, se implementó un sistema de deuda donde el cliente se lleva el producto y paga después. La deuda se registra en `/cuentaCorriente` y el `deudaTotal` se actualiza con `FieldValue.increment()` (operación atómica).

### Gestión de stock atómica

Al registrar una venta, el descuento de stock se hace en un `batch.commit()` junto con el registro de la venta. Si alguna operación falla, toda la transacción se revierte. Esto evita inconsistencias entre stock y ventas.

### Escaneo QR con comportamiento según origen

El escaneo de QR se usa para dos propósitos distintos, diferenciados por la variable `origenEscaneo` (`'venta' | 'carrito' | 'inventario' | null`):
- Desde **Home → Iniciar venta** o **Carrito → Escanear otro**: al detectar el QR abre `abrirProducto(id)` (selección de talle/color/cantidad para agregar al carrito)
- Desde **Inventario → Escanear producto**: al detectar el QR abre `abrirFormProducto(id)` (edición directa del producto), sin pasar por el flujo de venta

`procesarCodigoQR()` decide el destino con un único condicional sobre `origenEscaneo`, sin duplicar lógica de búsqueda.

### Alertas de stock bajo (localStorage, no Firestore)

Se eligió `localStorage` (clave `moniarquia_config_stock`) en vez de una colección de Firestore para la configuración de alertas (`{ activo, stockMinimo }`). Es una configuración del negocio, no por-usuario, sincrónica de leer, y no requiere tocar Firebase. Si se activa Firebase Auth en el futuro, puede migrarse a `/configuracion/stockAlertas` sin cambiar la lógica de cálculo (`calcularAlertasStock()`). La alerta se evalúa **por talle**, no por stock total del producto.

### Splash de presentación forzado por JS

El splash inicial (`#vista-splash-presentacion`) no depende únicamente del HTML servido: `DOMContentLoaded` fuerza por JavaScript que sea la única vista `.active`, agrega una clase `.splash-presentacion-forzado` (`position:absolute; z-index:9999`) y bloquea cualquier `navegarA()` durante 2000ms mediante la variable `splashPresentacionActivo`. Esto evita que el splash se salte por estados intermedios del HTML o por otros scripts.

---

## 5. Problemas conocidos

| Problema | Impacto | Estado |
|---|---|---|
| ~~Escaneo QR no funcional~~ | Resuelto — ver `docs/MONIARQUIA_QR.md` | — |
| **Firebase Auth no activo** | Alto — autenticación es simulada, sin seguridad real | Pendiente (requiere activar en consola) |
| **Gestión de usuarios con datos mock** | Medio — los usuarios creados no persisten en Firestore | Pendiente |
| **Cambio por otro producto no implementado** | Bajo — solo se puede cambiar de talle del mismo producto | Pendiente |
| **Configuración de usuarios sin conectar** | Bajo — pantalla visual pero sin funcionalidad real | Pendiente |
| **Firebase Storage eliminado** | Informativo — las imágenes se cargan por URL manual | No hay plan de reimplementar por ahora |
| **Reglas de Firestore abiertas** | Alto (producción) — aceptable para desarrollo/TP | Documentar antes de producción |
| **Recuperación de contraseña sin backend** | Medio — flujo visual pero sin envío real de email | Requiere Firebase Auth activo |
| **Modal QR huérfano** | Bajo — `abrirModalQR()`, `modalDescargarQR()` y `#modal-qr-overlay` siguen en el código pero sin ningún botón que los invoque | Limpieza pendiente (ver `docs/MONIARQUIA_ESTADO_ACTUAL.md`) |

---

## 6. Documentación relacionada

| Archivo | Contenido |
|---|---|
| `docs/MONIARQUIA_Flujos.md` | Todos los flujos de navegación con diagramas textuales |
| `docs/MONIARQUIA_ESTADO_ACTUAL.md` | Resumen ejecutivo con prioridades |
| `docs/MONIARQUIA_FIREBASE.md` | Configuración, colecciones, datos de prueba |
| `docs/MONIARQUIA_DESIGN_SYSTEM.md` | Tokens de color, tipografía, componentes, UX |
| `docs/MONIARQUIA_QR.md` | Bitácora técnica completa del sistema QR |
| `docs/MONIARQUIA_ROADMAP.md` | Hoja de ruta con prioridades |
| `docs/00_REGLAS_DESARROLLO.md` | Metodología de trabajo, rama, etapas |

---

*Documento maestro — Actualizado 30 de junio de 2026. Actualizar al iniciar cada nueva sesión de desarrollo importante.*
