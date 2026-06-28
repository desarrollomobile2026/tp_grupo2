# Moniarquía — Contexto para IA

> **Documento de onboarding.** Leer este archivo antes de cualquier sesión de desarrollo.
> Actualizado: Junio 2026 — Rama: `oscar` — Versión: 2.0

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
| QR lectura | jsQR v1.4.0 (CDN) — pendiente resolver en iPhone |

**Repositorio:** `https://github.com/desarrollomobile2026/tp_grupo2` — rama `oscar`

---

## 2. Estado general del proyecto

| Módulo | Estado | Observaciones |
|---|---|---|
| **Autenticación** | ⚠️ Parcial | Funciona con datos mock. Firebase Auth no activado. Ver sección 9. |
| **Inicio / Home** | ✅ Implementado | Logo, menú, 2 cards de acción, avatar de perfil con rol. |
| **Inventario** | ✅ Implementado | CRUD completo, filtros, selector visual de colores, stock por talla. |
| **Escaneo de cámara** | ⚠️ Parcial | Cámara abre. Loop de lectura implementado. No funciona en iPhone. |
| **Carrito** | ✅ Implementado | Selección de producto/talle/color/cantidad. Persiste en localStorage. |
| **Ventas** | ✅ Implementado | Registro en Firestore, 3 métodos de pago, stock descontado atómicamente. |
| **Clientes** | ✅ Implementado | Lista, alta, edición, eliminación. Buscador en tiempo real. |
| **Cuenta corriente** | ✅ Implementado | Detalle, movimientos en tiempo real, pagos completos y parciales. |
| **Pagos** | ✅ Implementado | Efectivo, Mercado Pago (externo), Cuenta corriente. |
| **Cambios y devoluciones** | ⚠️ Parcial | Solo cambio de talle del mismo producto. Cambio por otro producto: pendiente. |
| **Configuración** | ✅ Implementado | Mi perfil, Gestión usuarios, Gestión clientes, Cambiar contraseña, Logout. |
| **Gestión de usuarios** | ⚠️ Parcial | CRUD visual completo. Datos en memoria, no en Firestore. |
| **QR — generación** | ✅ Implementado | codigoQR en Firestore, canvas visible, descarga PNG. |
| **QR — escaneo** | ❌ Pendiente | Loop implementado pero no funciona en iPhone. Ver sección 9. |
| **Permisos por rol** | ✅ Implementado | Restricciones visuales: admin vs empleado. |

---

## 3. Estructura del proyecto

```
tp_grupo2/
├── index.html      ← TODAS las vistas (52 vistas en un solo archivo SPA)
├── style.css       ← Design system + estilos de todos los componentes
├── app.js          ← Toda la lógica: ~7800 líneas, 129 funciones
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

**`index.html`:** Declara las 52 vistas como elementos `<main class="vista">`. Solo una está activa (`.active`). Contiene los CDN de Firebase, Lucide, QRious, jsQR. No contiene lógica.

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

### Autenticación simulada
Firebase Auth fue implementado y luego revertido. El sistema actual usa:
- `USUARIOS_MOCK[]` — array con email, password (hardcoded), rol
- `sesionActual` en localStorage — `{ nombre, correo, rol }` (sin contraseña)
- Funciones con comentarios `// TODO: reemplazar por firebase.auth()...`

### Desarrollo por iteraciones pequeñas
Se usó una metodología de etapas (1 a 8+). Cada etapa agrega funcionalidad sin romper la anterior. Los cambios deben ser presentados ANTES de implementarlos y esperar confirmación. Ver `docs/00_REGLAS_DESARROLLO.md`.

---

## 8. Estado actual del desarrollo

### ✅ Qué funciona

- Login/logout con usuarios demo (simulado)
- Home con permisos visuales por rol
- Inventario completo (CRUD, filtros, colores visual, stock por talla, QR)
- Flujo de venta completo (selección → carrito → cliente → pago → confirmación)
- Tres métodos de pago con registro en Firestore
- Módulo de clientes completo (lista, alta, edición, eliminación)
- Cuenta corriente (deuda, pagos, historial en tiempo real)
- Cambios y devoluciones (cambio de talle, actualización de stock atómica)
- Configuración completa (Mi perfil, Gestión usuarios visual, Cambiar contraseña)
- Generación y descarga de QR por producto
- Panel de diagnóstico en pantalla de escaneo

### ⚠️ Parcialmente implementado

- **Escaneo QR:** loop de jsQR implementado, cámara funciona, pero en iPhone no detecta el QR impreso/descargado
- **Autenticación:** funciona con mock; no conectada a Firebase Auth real
- **Gestión de usuarios:** UI completa pero datos en memoria (no Firestore)
- **Cambios y devoluciones:** solo cambio de talle del mismo producto

### ❌ Pendiente

- Firebase Auth real habilitado en consola
- Escaneo QR funcional en iPhone
- Gestión de usuarios conectada a Firestore
- Recuperación de contraseña real (requiere Auth)
- Reglas de seguridad en Firestore (actualmente abiertas)
- Cambio por otro producto en C&D

---

## 9. Problemas abiertos (priorizados)

### 1. 🔴 Escaneo QR no funcional en iPhone

**Síntoma:** La cámara se activa, el video se reproduce, el usuario ve el QR dentro del visor, pero la app nunca detecta el código ni abre el producto.

**Lo que se sabe:**
- jsQR está correctamente integrado con loop de `requestAnimationFrame`
- `inversionAttempts: 'attemptBoth'` está configurado
- `readyState >= 2` como condición (no `=== 4` que era demasiado estricto)
- `videoEl.play()` se llama explícitamente (no `onloadedmetadata`)
- El panel de diagnóstico muestra `CAM`, `LOOP`, `FRAMES`, `QR`, `DB`, `ERR`

**Hipótesis no descartadas:**
- jsQR no carga desde el CDN de jsDelivr en determinadas redes
- El video entrega frames pero con `videoWidth/videoHeight === 0` en iOS
- jsQR lee el QR pero el texto tiene caracteres extra (salto de línea, BOM)
- El ID extraído no coincide con ningún documento en Firestore

**Próximo paso para resolver:**
Observar el panel de diagnóstico en iPhone y reportar el valor de `FRAMES` y `QR`.
Si `FRAMES` no sube → el video no entrega datos.
Si `FRAMES` sube pero `QR` dice "ninguno" → jsQR no decodifica.
Si `QR` tiene texto → verificar ese texto contra Firestore manualmente.
Ver `docs/MONIARQUIA_QR.md` sección 10 para pasos detallados.

---

### 2. 🟡 Firebase Auth no activo

**Síntoma:** El login funciona con datos hardcodeados. Si se pierde la sesión en localStorage, el acceso vuelve al splash pero no hay un backend real que valide identidades.

**Para resolver:**
1. Firebase Console → Authentication → Email/Password → Habilitar
2. Reemplazar funciones simuladas (ya tienen comentarios `// TODO:`)
3. Ver `docs/MONIARQUIA_FIREBASE.md` sección 3 para el código exacto

---

### 3. 🟡 Gestión de usuarios sin persistencia

**Síntoma:** Los usuarios creados desde Configuración desaparecen al recargar la app.

**Para resolver:** Reemplazar `usuariosLocales[]` por `db.collection('usuarios').onSnapshot()` una vez que Auth esté activo.

---

## 10. Última iteración realizada

**Fecha:** Junio 2026

**Qué se desarrolló:**
1. Sistema completo de generación y descarga de QR por producto
2. Integración de jsQR para lectura de QR desde la cámara
3. Múltiples correcciones al loop de escaneo (readyState, inversionAttempts, play(), onloadedmetadata)
4. Panel de diagnóstico inline en la pantalla de escaneo
5. Botones "Reintentar escaneo" y "Volver al carrito" en el escáner
6. Documentación completa del proyecto (8 archivos .md)
7. Ajustes de UI/UX: spacing, responsive, headers consistentes
8. Permisos por rol visuales
9. Botón de escaneo en inventario (solo admin)
10. Gestión de clientes completa (CRUD)
11. Configuración completa (Mi perfil, Gestión usuarios, etc.)

**Archivos modificados en la última sesión:**
- `index.html` — vista de escaneo rediseñada, panel de estado inline
- `style.css` — panel de diagnóstico, escaner-status, responsive fixes
- `app.js` — `iniciarEscaneoLoop()`, `procesarCodigoQR()`, `actualizarDebugEscaneo()`, `reintentarEscaneo()`, `volverAlCarritoDesdeEscaneo()`
- `docs/*.md` — 4 archivos creados, 2 actualizados

**Resultado:** El QR se genera y descarga correctamente. El escaneo está implementado pero no funciona en iPhone.

---

## 11. Próxima iteración recomendada

### Opción A (recomendada): Resolver escaneo QR

**Objetivo:** Confirmar en cuál eslabón falla el flujo de escaneo y corregirlo.

**Dependencias:** Ninguna externa.

**Archivos a modificar:** Solo `app.js` (funciones de cámara).

**Pasos:**
1. Abrir la app en iPhone y entrar a "Iniciar venta"
2. Observar el panel de diagnóstico en la pantalla:
   - Si `FRAMES = 0` después de 3 segundos → el video no entrega datos → cambiar condición de readyState o agregar evento `timeupdate`
   - Si `FRAMES` sube pero `QR = ninguno` → jsQR no decodifica → probar jsQR como archivo local (no CDN), o implementar `BarcodeDetector` nativa
   - Si `QR` tiene texto → ese texto NO pasa `startsWith(PREFIJO_QR)` → comparar manualmente
3. Alternativa rápida — implementar `BarcodeDetector` para iOS 17+:
   ```js
   if ('BarcodeDetector' in window) {
       const detector = new BarcodeDetector({ formats: ['qr_code'] });
       detector.detect(videoEl).then(barcodes => {
           if (barcodes[0]) procesarCodigoQR(barcodes[0].rawValue);
       });
   }
   ```

**Riesgos:** Bajo. Solo se modifica el loop de escaneo, no el carrito ni el inventario.

### Opción B: Activar Firebase Auth

**Objetivo:** Reemplazar autenticación simulada por Firebase Auth real.

**Dependencias:** Acceso a Firebase Console para habilitar Email/Password.

**Archivos a modificar:** `index.html` (agregar SDK), `app.js` (reemplazar funciones simuladas), `config.js` (agregar `firebase.auth()`).

**Ver:** `docs/MONIARQUIA_FIREBASE.md` sección 3 para el código exacto.

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
| **`MONIARQUIA_ROADMAP.md`** | Hoja de ruta priorizada con 12 ítems | Al decidir qué hacer a continuación |
| **`00_REGLAS_DESARROLLO.md`** | Metodología de trabajo, rama, etapas | Como referencia de proceso |

---

## 14. Punto exacto donde se detuvo el proyecto

**Fecha de parada:** Junio 2026

**Qué estaba en desarrollo:** El sistema de códigos QR para productos.

**Lo que funciona hoy:**
- La app genera automáticamente un código QR (`MONIARQUIA_PRODUCTO_<idFirestore>`) al crear un producto
- El QR se visualiza en el formulario de edición del producto
- El QR se puede descargar como PNG de 300px
- La pantalla de escaneo abre la cámara correctamente
- El panel de diagnóstico muestra el estado del loop en pantalla
- Los botones "Reintentar escaneo" y "Buscar manualmente" funcionan

**Lo que no funciona:**
El escáner no detecta el QR cuando se apunta la cámara a la etiqueta descargada. La causa exacta no ha sido confirmada — puede ser que jsQR no cargue desde el CDN, que el video no entregue frames en iOS, o que el texto leído tenga un formato inesperado.

**Consecuencia práctica:**
El flujo "Escanear QR → identificar producto → abrir pantalla de selección → agregar al carrito" no funciona en iPhone. El fallback "Buscar manualmente" sí funciona y permite completar la venta.

**Qué hacer al retomar:**
1. Abrir la app en iPhone y entrar a "Iniciar venta"
2. Observar los valores del panel de diagnóstico (`CAM`, `LOOP`, `FRAMES`, `QR`)
3. Reportar esos valores para decidir cuál es el problema real
4. Seguir los pasos de `docs/MONIARQUIA_QR.md` sección 10

---

## 15. Información de versión

| Campo | Valor |
|---|---|
| **Fecha de actualización** | Junio 2026 |
| **Rama activa** | `oscar` |
| **Versión del proyecto** | 2.0 |
| **Vistas en la app** | 52 vistas declaradas en `index.html` |
| **Funciones en app.js** | ~129 funciones, ~7800 líneas |
| **Colecciones Firebase activas** | productos, clientes, ventas, cuentaCorriente, cambios |
| **Firebase Auth** | NO activo — simulado en localStorage |
| **Firebase Storage** | NO activo — eliminado |
| **Última iteración documentada** | Generación/lectura QR + documentación completa |
| **Próxima iteración recomendada** | Resolver escaneo QR en iPhone (ver sección 11) |

---

*Este documento debe actualizarse al finalizar cada iteración importante. Si estás leyendo esto en el futuro, verificar que la fecha y el estado coincidan con el código real antes de comenzar.*
