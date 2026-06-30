# Moniarquía — Firebase

> Documentación de la configuración y uso de Firebase en el proyecto.
> Actualizado: Julio 2026.

---

## 1. Proyecto Firebase

| Campo | Valor |
|---|---|
| **Project ID** | `moniarquiaapp` |
| **authDomain** | `moniarquiaapp.firebaseapp.com` |
| **storageBucket** | `moniarquiaapp.firebasestorage.app` |
| **Archivo de config** | `config.js` |

```js
// config.js
const firebaseConfig = {
    apiKey:            "...",
    authDomain:        "moniarquiaapp.firebaseapp.com",
    projectId:         "moniarquiaapp",
    storageBucket:     "moniarquiaapp.firebasestorage.app",
    messagingSenderId: "1091179201337",
    appId:             "1:1091179201337:web:..."
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// const storage = firebase.storage(); // eliminado — no se usa
```

---

## 2. SDKs cargados

```html
<!-- index.html -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<!-- Pendiente activar cuando se resuelva Auth: -->
<!-- <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script> -->

<!-- No usados: -->
<!-- firebase-storage-compat.js — eliminado -->
```

---

## 3. Firebase Authentication

### Estado actual: **NO ACTIVO**

La autenticación fue implementada con Firebase Auth (Etapa 8 del desarrollo) y luego revertida porque el método Email/Password no estaba habilitado en Firebase Console.

### Para activar Firebase Auth

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Proyecto `moniarquiaapp`
3. **Authentication → Sign-in method → Email/Password → Habilitar → Guardar**

### Para integrar en el código

El código tiene una implementación simulada completa con comentarios `// TODO:`:

```js
// app.js — función loginSimulado()
// TODO: reemplazar por:
firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => { /* onAuthStateChanged redirige */ })
    .catch(err => alert(mensajeErrorAuth(err.code)));

// app.js — función registroSimulado()
// TODO: reemplazar por:
firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(cred => db.collection('usuarios').doc(cred.user.uid).set({
        nombre, email, rol: 'empleado', estado: 'activo', createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));

// app.js — función cerrarSesionLocal()
// TODO: reemplazar por:
firebase.auth().signOut();

// app.js — función iniciarApp()
// TODO: reemplazar por:
firebase.auth().onAuthStateChanged(user => {
    if (user) navegarA('vista-home', { silencioso: true });
    else      navegarA('vista-splash', { silencioso: true });
});
```

---

## 4. Cloud Firestore

### Estado: **ACTIVO**

Modo: **Production** (en la práctica abierto para testing — ver sección de reglas).

### Colecciones

#### `/productos`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | string | Nombre de la prenda |
| `precio` | number | Precio en pesos argentinos |
| `categoria` | string | "Camperas" \| "Remeras" \| "Pantalones" \| "Buzos" \| "Shorts" |
| `colores` | string[] | Valores del selector: ["negro", "rojo", ...] |
| `descripcion` | string | Texto descriptivo (opcional) |
| `foto_url` | string | URL de imagen (vacío si no tiene) |
| `stockPorTalla` | object | `{ S: n, M: n, L: n, XL: n }` o `{ "36": n, ... }` |
| `tallas` | string[] | Talles con stock > 0 |
| `stock` | number | Suma total de `stockPorTalla` |
| `codigoQR` | string | `"MONIARQUIA_PRODUCTO_<docId>"` |
| `likes` | number | Sistema heredado, sin uso visual activo |
| `createdAt` | timestamp | |

**Colores predefinidos en el selector:**
`negro, blanco, rojo, verde, azul, amarillo, violeta, marron, rosa, naranja, beige, gris`

**Ejemplo de documento:**
```json
{
  "nombre": "Campera frizada",
  "precio": 38000,
  "categoria": "Camperas",
  "colores": ["gris", "negro"],
  "descripcion": "Con capucha, cierre frontal y bolsillos.",
  "foto_url": "docs/images/Campera frizada.png",
  "stockPorTalla": { "S": 3, "M": 10, "L": 7, "XL": 4 },
  "tallas": ["S", "M", "L", "XL"],
  "stock": 24,
  "codigoQR": "MONIARQUIA_PRODUCTO_abc123def456",
  "likes": 0
}
```

#### `/ventas`

| Campo | Tipo | Descripción |
|---|---|---|
| `idVenta` | string | Denormalización del doc ID — útil en exportaciones y tickets |
| `fecha` | timestamp | Fecha/hora de la venta (serverTimestamp) |
| `fechaCreacion` | timestamp | Igual a `fecha` al crear |
| `fechaActualizacion` | timestamp | Se actualiza al anular/devolver (futuro) |
| `clienteId` | string \| null | ID del cliente o null si anónima |
| `clienteNombre` | string \| null | Snapshot del nombre del cliente al momento de la venta |
| `vendedorId` | string \| null | `correo` del vendedor (hasta que haya Firebase Auth real — migrar a uid cuando esté activo) |
| `vendedorNombre` | string \| null | Snapshot del nombre del vendedor |
| `metodoPago` | string | `"efectivo"` \| `"mercadopago"` \| `"cuenta_corriente"` |
| `estado` | string | Estado de pago: `"completada"` (pagado) \| `"deuda"` (pago parcial/pendiente) |
| `estadoVenta` | string | Ciclo de vida: `"completada"` \| `"anulada"` \| `"devuelta"` — hoy siempre `"completada"` |
| `total` | number | Suma de todos los subtotales |
| `montoAbonado` | number | Igual a `total` para efectivo/MP; puede ser menor en cta. cte. |
| `origenVenta` | string | `"movil"` \| `"desktop"` — hoy siempre `"movil"` |
| `items` | array | Snapshot completo de los productos vendidos (inmutable) |
| `items[].productoId` | string | |
| `items[].nombre` | string | |
| `items[].talla` | string | |
| `items[].color` | string | |
| `items[].cantidad` | number | |
| `items[].precioUnitario` | number | |
| `items[].subtotal` | number | `precioUnitario × cantidad` |
| `items[].categoria` | string | Snapshot de la categoría del producto |

> **Nota sobre compatibilidad:** documentos creados antes de Julio 2026 no tienen los campos `idVenta`, `fechaCreacion`, `fechaActualizacion`, `vendedorId`, `vendedorNombre`, `clienteNombre`, `origenVenta`, `estadoVenta`, `items[].categoria`. El código de `renderizarDetalleVenta()` maneja su ausencia con fallbacks (`|| '—'`, `?? 0`, etc.).

> **Nota sobre `estado` vs `estadoVenta`:** `estado` indica el estado de pago (`completada`/`deuda`) — en uso desde el inicio, no renombrar. `estadoVenta` indica el ciclo de vida de la venta — campo nuevo, preparado para `anulada`/`devuelta` en una etapa futura.

#### `/clientes`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | string | |
| `telefono` | string | |
| `email` | string | |
| `deudaTotal` | number | Actualizado con `FieldValue.increment()` |
| `createdAt` | timestamp | |

#### `/cuentaCorriente`

| Campo | Tipo | Descripción |
|---|---|---|
| `clienteId` | string | ref a /clientes |
| `tipo` | string | "deuda" \| "pago" |
| `monto` | number | Monto de la deuda o del pago |
| `descripcion` | string | "Venta registrada" \| "Pago registrado" |
| `ventaId` | string | ref a /ventas (solo en deudas) |
| `fecha` | timestamp | |

#### `/cambios`

| Campo | Tipo | Descripción |
|---|---|---|
| `ventaId` | string | ref a /ventas |
| `productoId` | string | ref a /productos |
| `nombreProducto` | string | Snapshot del nombre |
| `talleDevuelto` | string | |
| `talleNuevo` | string | |
| `clienteId` | string \| null | |
| `fecha` | timestamp | |

#### `/usuarios` (definida, no activa)

```js
{
  nombre:    string,
  email:     string,
  rol:       "administrador" | "empleado",
  estado:    "activo" | "inactivo",
  createdAt: timestamp
}
```
> Esta colección está definida en el modelo pero no se escribe porque Firebase Auth está revertido. La gestión de usuarios usa `usuariosLocales[]` en memoria (`app.js` línea ~50).

---

## 5. Firebase Storage

### Estado: **NO USADO — eliminado**

Firebase Storage fue agregado (SDK + `const storage`) y luego eliminado porque:
1. El bucket requería configuración adicional en la consola
2. Las reglas de Storage bloqueaban las subidas (error en iPhone)
3. La carga de imágenes por URL manual es suficiente para el TP

Las imágenes de productos se cargan de dos formas:
1. **URL manual** ingresada en el formulario (`foto_url`)
2. **Imágenes locales** en `docs/images/` — mapeadas automáticamente por `obtenerFotoProducto(p)` según el nombre del producto

---

## 6. Reglas de Firestore

### Estado actual (para desarrollo/testing)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ← ABIERTO para testing
    }
  }
}
```

### Reglas recomendadas para producción

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'administrador';
    }
    match /ventas/{id} {
      allow read, write: if request.auth != null;
    }
    match /clientes/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /cuentaCorriente/{id} {
      allow read, write: if request.auth != null;
    }
    match /cambios/{id} {
      allow read, write: if request.auth != null;
    }
    match /usuarios/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'administrador';
    }
  }
}
```

> ⚠️ Estas reglas requieren que Firebase Auth esté activo y que cada usuario tenga un documento en `/usuarios/{uid}` con el campo `rol`.

---

## 7. Datos de prueba

### Productos de ejemplo (en `docs/images/`)

| Producto | Imagen local |
|---|---|
| Buzo | `docs/images/Buzo.png` |
| Campera frizada | `docs/images/Campera frizada.png` |
| Remera de modal (verde) | `docs/images/Remera de modal (verde).png` |
| Remera de modal (chocolate) | `docs/images/Remera de modal (chocolate).png` |

El mapeo es automático en `obtenerFotoProducto(p)` — si el nombre del producto contiene "buzo", "campera", "remera" + "chocolate" / verde, se usa la imagen local correspondiente.

### Usuarios mock (autenticación simulada)

```js
// app.js — USUARIOS_MOCK
{ nombre: 'Admin Principal', correo: 'admin@moniarquia.com',    password: '123456', rol: 'administrador' }
{ nombre: 'Empleado',        correo: 'empleado@moniarquia.com', password: '123456', rol: 'empleado'       }
```

---

## 8. Operaciones Firestore usadas

| Operación | Uso en el proyecto |
|---|---|
| `onSnapshot()` | Productos (tiempo real), Clientes (tiempo real), Movimientos de cuenta corriente |
| `.get()` | Buscar producto por QR, ventas de cliente, cambios |
| `.add()` | Alta de cliente (legado), alta de venta legado |
| `.doc().set()` | Alta de producto nuevo (con ID pre-generado para QR) |
| `.doc().update()` | Edición de producto, edición de cliente, actualizar stock, actualizar deuda |
| `.doc().delete()` | Eliminar producto, eliminar cliente |
| `batch.commit()` | Registro de venta + descuento de stock + deuda (atómico) |
| `FieldValue.increment()` | Actualización de `deudaTotal` en clientes, actualización de stock en cambios |
| `FieldValue.serverTimestamp()` | Fechas de creación |

---

*Firebase — Junio 2026.*
