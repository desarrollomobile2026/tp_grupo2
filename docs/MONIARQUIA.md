# Moniarquía — Documento Maestro del Proyecto

> Versión: 2.0 — Actualizado: Junio 2026
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
| QR Reader | jsQR v1.4.0 (CDN) — **pendiente de resolver en iOS** |

---

## 2. Estado actual del proyecto

> Última revisión: Junio 2026

| Módulo | Estado | Notas |
|---|---|---|
| **Autenticación** | ⚠️ Simulada | Login/registro funcionan con datos mock. Firebase Auth está revertido. |
| **Home / Inicio** | ✅ Completo | Logo, menú hamburguesa, dos cards de acción, avatar de perfil. |
| **Inventario** | ✅ Completo | CRUD completo, búsqueda, filtros por categoría, talles por categoría. |
| **Escaneo de cámara** | ⚠️ Parcial | Cámara abre correctamente. jsQR integrado pero lectura QR no confirmada en iPhone. |
| **Carrito de venta** | ✅ Completo | Selección de producto, talle, color, cantidad. Persiste en localStorage. |
| **Ventas** | ✅ Completo | Registro en Firestore, 3 métodos de pago, descuento de stock atómico. |
| **Clientes** | ✅ Completo | Lista, alta, edición, eliminación con confirmación. |
| **Cuenta corriente** | ✅ Completo | Detalle del cliente, historial de movimientos, pagos completos y parciales. |
| **Pagos** | ✅ Completo | Efectivo, Mercado Pago, Cuenta corriente. Mercado Pago no integra API (solo se confirma externamente). |
| **Cambios y devoluciones** | ⚠️ Parcial | Solo cambio de talle del mismo producto. Cambio por otro producto pendiente. |
| **Configuración** | ✅ Completo | Pantalla con 5 opciones: Mi perfil, Gestión de usuarios, Gestión de clientes, Cambiar contraseña, Cerrar sesión. |
| **Gestión de usuarios** | ⚠️ Mock | Flujo visual completo (CRUD) pero con datos locales. No conectado a Firestore. |
| **Mi perfil / Cambiar contraseña** | ⚠️ Mock | Funcionalidad visual completa, no conectada a Firebase Auth. |
| **QR — Generación** | ✅ Completo | Se genera y guarda `codigoQR` en Firestore. Se visualiza y descarga en PDF. |
| **QR — Lectura/Escaneo** | ❌ Pendiente | Loop implementado, no funciona en iPhone. Ver `docs/MONIARQUIA_QR.md`. |
| **Permisos por rol** | ✅ Completo | Restricciones visuales aplicadas en inventario, clientes y configuración. |
| **Responsividad** | ✅ Completo | Corregida para múltiples tamaños de pantalla (dvh, clamp). |
| **Navegación con historial** | ✅ Completo | Stack de historial, botón volver inteligente. |

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

Biblioteca pura JavaScript que trabaja con `ImageData` del canvas. Alternativa a `BarcodeDetector` nativa (no disponible en iOS < 17). **Estado actual: implementado pero no funcional en iPhone.** Ver `docs/MONIARQUIA_QR.md`.

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

---

## 5. Problemas conocidos

| Problema | Impacto | Estado |
|---|---|---|
| **Escaneo QR no funcional en iPhone** | Alto — impide el flujo principal de venta por QR | Pendiente (ver `docs/MONIARQUIA_QR.md`) |
| **Firebase Auth no activo** | Alto — autenticación es simulada, sin seguridad real | Pendiente (requiere activar en consola) |
| **Gestión de usuarios con datos mock** | Medio — los usuarios creados no persisten en Firestore | Pendiente |
| **Cambio por otro producto no implementado** | Bajo — solo se puede cambiar de talle del mismo producto | Pendiente |
| **Configuración de usuarios sin conectar** | Bajo — pantalla visual pero sin funcionalidad real | Pendiente |
| **Firebase Storage eliminado** | Informativo — las imágenes se cargan por URL manual | No hay plan de reimplementar por ahora |
| **Reglas de Firestore abiertas** | Alto (producción) — aceptable para desarrollo/TP | Documentar antes de producción |
| **Recuperación de contraseña sin backend** | Medio — flujo visual pero sin envío real de email | Requiere Firebase Auth activo |

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

*Documento maestro — Junio 2026. Actualizar al iniciar cada nueva sesión de desarrollo importante.*
