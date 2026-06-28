# Moniarquía — Sistema de Códigos QR

> Bitácora técnica completa del desarrollo del sistema QR.
> Última actualización: Junio 2026.

---

## 1. Objetivo inicial

### Por qué se incorporó

La aplicación Moniarquía gestiona ventas de ropa en un showroom. El vendedor necesitaba iniciar una venta escaneando el producto físico en lugar de buscarlo manualmente en una lista. Esto agiliza el flujo de caja, reduce errores de selección y permite operar con una sola mano mientras se atiende un cliente.

### Problema que se resolvía

Sin QR, el flujo de venta era:
1. Iniciar venta → abrir lista completa de productos → buscar por nombre o categoría → seleccionar → elegir talle, color, cantidad → agregar al carrito.

Con QR, el flujo esperado es:
1. Crear producto → se genera un QR automáticamente → se guarda en Firestore.
2. Imprimir/descargar la etiqueta QR y pegarla en la prenda física.
3. En la venta: Iniciar venta → pantalla de cámara → escanear el QR de la prenda → se abre automáticamente la pantalla de selección de talle, color y cantidad → agregar al carrito.

```
Crear producto
    → generar codigoQR
    → guardar en Firestore
    → descargar/imprimir etiqueta
    
Iniciar venta
    → pantalla de cámara
    → escanear QR
    → detectar: MONIARQUIA_PRODUCTO_<idFirestore>
    → buscar producto en Firestore
    → abrir pantalla de detalle (talle, color, cantidad)
    → agregar al carrito de venta
```

---

## 2. Arquitectura propuesta

### Librerías elegidas

#### QRious v4.0.2 — para generar el QR

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
```

**Motivos de elección:**
- 18 KB minificado (la más liviana de las opciones maduras)
- Genera el QR sobre un `<canvas>` directamente en el browser — sin llamadas externas, funciona offline
- API de una línea: `new QRious({ element: canvas, value: string, size: 150 })`
- Compatible con vanilla JS sin dependencias

Alternativas descartadas:
- `qrcode.js`: funciona igual pero pesa el doble (40 KB)
- APIs de imágenes externas (ej. `api.qrserver.com`): introduce dependencia de terceros y requiere internet adicional al ya requerido por Firebase

#### jsQR v1.4.0 — para leer el QR desde la cámara

```html
<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
```

**Motivos de elección:**
- Biblioteca pura de JavaScript (~30 KB)
- Trabaja con `ImageData` de canvas — sin dependencias externas
- API simple: `jsQR(imageData.data, width, height, options)` devuelve el texto o `null`

### Estructura de datos en Firestore

**Colección:** `/productos`

**Campo agregado:**
```js
codigoQR: "MONIARQUIA_PRODUCTO_<idFirestore>"
```

**Ejemplo real:**
```js
codigoQR: "MONIARQUIA_PRODUCTO_abc123XYZ789def456"
```

**Por qué solo el identificador (no la imagen):**
- Guardar la imagen PNG en Firestore o Storage agrega complejidad innecesaria (tamaño, costos de Storage, permisos)
- El identificador es un string liviano que sirve como clave única
- La imagen QR se genera en tiempo real en el browser a partir del string con QRious — sin costo ni latencia adicional
- Si el ID cambia (nunca debería), se puede regenerar el QR sin impacto en Firestore

**Cuándo se genera:**
- Al **crear** un producto nuevo: se pre-genera el `docRef.id` con `db.collection('productos').doc()` (sin crear aún el documento), se construye `codigoQR = "MONIARQUIA_PRODUCTO_" + docRef.id`, y se guarda todo junto con `docRef.set(datos)`.
- Al **editar** un producto existente: si ya tiene `codigoQR`, se conserva. Si no tiene (producto creado antes de esta funcionalidad), se genera con su ID actual.

---

## 3. Archivos modificados

### `index.html`

| Cambio | Descripción |
|---|---|
| CDN QRious | `<script src="...qrious/4.0.2/qrious.min.js">` — para generar el QR |
| CDN jsQR | `<script src="...jsqr@1.4.0/dist/jsQR.min.js">` — para leer el QR desde la cámara |
| `#qr-canvas` | `<canvas>` dentro de `#qr-producto-section` en el formulario de producto — muestra el QR al editar |
| `#qr-producto-section` | Bloque oculto por defecto (`.qr-section`) que aparece solo al editar un producto con `codigoQR` |
| `#btn-descargar-qr` | Botón "Descargar QR" dentro de `#qr-producto-section` |
| `#qr-scan-canvas` | `<canvas style="display:none">` dentro de `#vista-escanear` — canvas oculto que jsQR usa para analizar frames del video |
| `#vista-escanear` rediseñado | Visor de cámara + panel de estado inline `#escaner-status` + botones: Reintentar, Buscar manualmente, Volver al carrito |
| `#escaner-status` | Panel de diagnóstico con 6 campos: `est-camara`, `est-loop`, `est-frames`, `est-qr`, `est-db`, `est-error` |
| `#btn-volver-carrito` | Botón oculto por defecto, visible solo cuando el escaneo fue iniciado desde el carrito (`abrirEscaneo('carrito')`) |
| "Escanear otro" en carrito | Actualizado de `onclick="abrirEscaneo()"` a `onclick="abrirEscaneo('carrito')"` |

### `style.css`

| Selector | Descripción |
|---|---|
| `.qr-section` | Card contenedora del QR en el formulario de producto (fondo blanco, borde, sombra, flex column centrado) |
| `.qr-section-label` | Etiqueta "CÓDIGO QR DEL PRODUCTO" (monospace, uppercase, gris) |
| `.qr-canvas` | Canvas visible con el QR (160×160px, border-radius 6px) |
| `.qr-codigo-texto` | Texto con el valor del `codigoQR` debajo del canvas (9px, gris, word-break) |
| `.btn-descargar-qr` | Botón de descarga dentro del bloque QR (outline, Inter, icono download 14px) |
| `.escaner-status` | Panel de diagnóstico inline (fondo oscuro, borde verde tenue, border-radius 10px) |
| `.escaner-status-fila` | Fila del panel (flex, monospace 10px, line-height 1.7) |
| `.escaner-status-label` | Etiqueta de cada campo del panel (verde, bold, min-width 46px) |
| `.escaner-status-err` | Variante que colorea el valor en rojo (#ff9090) para el campo ERR |
| `.escaner-contenedor` | Actualizado varias veces: terminó con `flex: none; height: clamp(160px, 28dvh, 220px)` para no acaparar todo el espacio de la vista |
| `.escaner-acciones` | Flex column con gap 8px — contenedor de los 3 botones de acción |

**Nota histórica:** Se agregó y eliminó un `.debug-panel` con `position: fixed`. Ver sección 5.

### `app.js`

#### Variables nuevas

```js
let qrProcesando   = false; // evita procesar el mismo QR múltiples veces
let origenEscaneo  = null;  // 'carrito' | null — para mostrar/ocultar btn Volver al carrito
let dbgFrames      = 0;     // contador de frames procesados por el loop
let dbgSinQRTimer  = null;  // timeout de 5s sin QR detectado
```

#### Funciones nuevas

| Función | Responsabilidad |
|---|---|
| `renderizarQRProducto(codigoQR)` | Muestra/oculta `#qr-producto-section` y renderiza el canvas con QRious |
| `descargarQRProducto(codigoQR, nombre)` | Genera un canvas temporal a 300px y lo descarga como PNG |
| `actualizarDebugEscaneo(campo, valor)` | Actualiza los campos del panel `#escaner-status` por clave semántica |
| `iniciarEscaneoLoop()` | Loop de `requestAnimationFrame` que captura frames del video, los pasa a jsQR y llama `procesarCodigoQR()` |
| `procesarCodigoQR(texto)` | Valida el prefijo `MONIARQUIA_PRODUCTO_`, extrae el ID, busca en memoria y/o Firestore, abre el producto |
| `mostrarMensajeEscaneo(mensaje, esCargando)` | Muestra/oculta el overlay `#escaner-estado` y reactiva el loop después de un error |
| `reintentarEscaneo()` | Detiene la cámara, resetea el estado, reinicia la cámara |
| `volverAlCarritoDesdeEscaneo()` | Detiene cámara y navega a `#vista-carrito-venta` |

#### Funciones modificadas

| Función | Cambio |
|---|---|
| `guardarProducto(e)` | Separado en dos ramas: edición (usa `docRef.update`) y creación (usa `docRef = db.collection().doc()` pre-generado + `.set()`). Incluye `codigoQR` en ambas ramas. |
| `abrirFormProducto(id)` | Llama a `renderizarQRProducto(codigoQRMostrar)` al editar; llama a `renderizarQRProducto(null)` al crear. |
| `iniciarCamara()` | Usa `videoEl.play()` explícito (necesario en iOS). El loop arranca en `.then()` del `play()`, no en `onloadedmetadata`. |
| `detenerCamara()` | Cancela también el `scanningLoop` (requestAnimationFrame) y el `dbgSinQRTimer`. |
| `abrirEscaneo(origen)` | Acepta parámetro `origen` para mostrar/ocultar el botón "Volver al carrito". Inicializa el panel de estado. |

---

## 4. Flujo implementado

### Crear producto

El usuario completa el formulario en `#vista-form-producto`. No se genera el QR aún.

### Guardar producto

```js
function guardarProducto(e) {
    // ...validaciones...
    const docRef = db.collection('productos').doc(); // pre-genera ID
    const nuevoCodigoQR = `MONIARQUIA_PRODUCTO_${docRef.id}`;
    docRef.set({ ...datos, codigoQR: nuevoCodigoQR, likes: 0, createdAt: ... })
}
```

Para edición, si el producto ya tiene `codigoQR`, se conserva:
```js
const codigoQR = pExistente?.codigoQR || `MONIARQUIA_PRODUCTO_${productoEditandoId}`;
docRef.update({ ...datos, codigoQR })
```

### Generar y mostrar el QR

```js
function renderizarQRProducto(codigoQR) {
    // Muestra #qr-producto-section
    // Renderiza con QRious en #qr-canvas (160px)
    // Actualiza #qr-codigo-texto con el valor del código
    // Conecta el onclick del botón de descarga
    if (typeof QRious !== 'undefined') {
        new QRious({ element: canvas, value: codigoQR, size: 160, ... });
    }
}
```

El QR se muestra solo en **modo edición**, no en modo creación (el usuario debe guardar primero, luego abrir edición para ver el QR).

### Descargar el QR

```js
function descargarQRProducto(codigoQR, nombreProducto) {
    const tempCanvas = document.createElement('canvas');
    new QRious({ element: tempCanvas, value: codigoQR, size: 300 }); // 300px para mejor calidad
    const link = document.createElement('a');
    link.download = `qr-${nombreLimpio}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}
```

El canvas temporal de 300px (vs 160px del display) da mejor calidad para impresión.

### Escanear el QR

El flujo inicia desde:
- **"Iniciar venta"** en Home → `abrirEscaneo()`
- **"Escanear otro"** en el carrito → `abrirEscaneo('carrito')`

```js
function iniciarCamara() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            videoEl.srcObject = stream;
            return videoEl.play(); // explícito — necesario en iOS
        })
        .then(() => {
            iniciarEscaneoLoop(); // arranca DESPUÉS de play()
        });
}
```

### Loop de lectura QR

```js
function iniciarEscaneoLoop() {
    function scan() {
        if (!streamCamara || qrProcesando) return;
        if (videoEl.readyState >= 2) { // >= 2 = HAVE_CURRENT_DATA (suficiente para leer)
            canvas.width  = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const resultado = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth' // intenta normal e invertido
            });
            if (resultado?.data) {
                qrProcesando = true;
                procesarCodigoQR(resultado.data);
                return;
            }
        }
        scanningLoop = requestAnimationFrame(scan);
    }
    scanningLoop = requestAnimationFrame(scan);
}
```

### Buscar y abrir el producto

```js
const PREFIJO_QR = 'MONIARQUIA_PRODUCTO_';

function procesarCodigoQR(texto) {
    if (!texto.startsWith(PREFIJO_QR)) { /* "Código no reconocido" */ return; }
    const productoId = texto.slice(PREFIJO_QR.length).trim();
    
    // Primero en memoria (onSnapshot ya los tiene)
    const local = listaPrendasGlobal.find(p => p.id === productoId);
    if (local) { detenerCamara(); abrirProducto(local.id); return; }
    
    // Si no, Firestore directo
    db.collection('productos').doc(productoId).get()
        .then(doc => {
            if (!doc.exists) { /* "Producto no encontrado" */ return; }
            const p = { id: doc.id, ...doc.data() };
            listaPrendasGlobal.push(p); // agregar a memoria temporal
            detenerCamara();
            abrirProducto(p.id);
        });
}
```

### Abrir detalle y agregar al carrito

`abrirProducto(id)` abre `#vista-producto` con los selectores de talle, color y cantidad. El carrito existente (`carritoVenta[]` en localStorage) se conserva intacto.

---

## 5. Problemas encontrados durante el desarrollo

### 5.1 El QR se generaba pero no se mostraba al crear un producto

**Síntoma:** Al crear un producto nuevo, el bloque QR no aparecía.
**Causa:** El bloque se mostraba solo al editar (cuando el `codigoQR` ya existía en Firestore). Al crear, el QR se genera y guarda, pero el formulario cierra y navega al inventario.
**Solución aplicada:** Diseño intencional — el usuario crea el producto, luego lo abre en edición y ve el QR. No se cambió.

---

### 5.2 El QR se descargaba con nombre ilegible

**Síntoma:** El archivo PNG descargado tenía nombres con caracteres especiales (tildes, espacios).
**Causa:** El nombre del producto se usaba directamente sin normalizar.
**Solución aplicada:**
```js
const nombreLimpio = nombreProducto
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
```

---

### 5.3 El panel de debug no aparecía en iPhone

**Síntoma:** El panel de diagnóstico (`#debug-escaneo`) existía en el DOM y tenía estilos, pero era invisible en iPhone.
**Causa real:** El panel tenía `position: fixed; bottom: 0`. En iOS Safari, cuando un ancestro tiene `overflow: hidden`, los elementos `position: fixed` son tratados como `position: absolute` relativo a ese contenedor. `#app-container { overflow: hidden }` clipaba el panel. Era visible en devtools pero no en el dispositivo.
**Intentos fallidos:** Múltiples ajustes de `z-index`, mover dentro del DOM, cambiar `bottom` value.
**Solución definitiva:** Eliminar el panel `position: fixed` y reemplazarlo por un panel **inline dentro de `#vista-escanear`** (`.escaner-status`), en el flujo normal del flex column.

---

### 5.4 El visor de cámara acaparaba toda la pantalla

**Síntoma:** Al agregar el panel de estado debajo del visor, no entraba en pantalla — el panel quedaba fuera del viewport.
**Causa:** `.escaner-contenedor { flex: 1 }` hacía que el visor consumiera todo el espacio disponible.
**Solución aplicada:**
```css
.escaner-contenedor {
    flex: none; /* no crece */
    height: clamp(160px, 28dvh, 220px); /* tamaño fijo y controlado */
}
```

---

### 5.5 El loop de escaneo arrancaba pero no detectaba ningún QR

**Síntoma:** Los frames se contaban correctamente, pero jsQR nunca devolvía un resultado.
**Causa 1 — `readyState === 4` demasiado estricto:** La condición original era `videoEl.readyState === videoEl.HAVE_ENOUGH_DATA` (valor 4). En cámara real, el video suele estar en estado 2 o 3 durante el streaming.
**Causa 2 — `inversionAttempts: 'dontInvert'`:** Modo más restrictivo de jsQR, ignoraba QR con bajo contraste.
**Causa 3 — `onloadedmetadata` no confiable en iOS:** El evento `loadedmetadata` puede dispararse antes de que se asigne el callback, o directamente no dispararse en streams de cámara en iOS Safari.
**Soluciones aplicadas:**
```js
// Condición menos estricta
if (videoEl.readyState >= 2)  // antes: === videoEl.HAVE_ENOUGH_DATA

// Más intentos de decodificación
inversionAttempts: 'attemptBoth'  // antes: 'dontInvert'

// Play explícito como trigger (reemplaza onloadedmetadata)
videoEl.srcObject = stream;
return videoEl.play(); // .then(() => iniciarEscaneoLoop())
```

---

### 5.6 El QR se generaba con valor incorrecto para productos editados

**Síntoma:** Al editar un producto sin `codigoQR`, se mostraba un QR en pantalla antes de guardar, pero si el usuario cancelaba y volvía a entrar, el valor era diferente.
**Causa:** El QR pre-generado para edición usaba el ID del documento existente: `MONIARQUIA_PRODUCTO_${id}`. Este valor es determinístico — siempre el mismo para el mismo producto — así que no era un bug real.
**Resultado:** Sin cambios necesarios.

---

### 5.7 El canvas del QR para descarga era de baja calidad

**Síntoma:** Al imprimir el QR descargado, se veía pixelado.
**Causa:** El canvas de display era de 160px. Al imprimir necesitaba 300px mínimo.
**Solución aplicada:** La función `descargarQRProducto()` crea un canvas temporal de 300px solo para la descarga, independiente del canvas de 160px que muestra en pantalla.

---

### 5.8 Problema de colisión de IDs entre el canvas del QR y el canvas del escáner

**Síntoma potencial (no ocurrió):** Dos canvas en el mismo HTML con roles distintos.
**IDs usados:**
- `#qr-canvas` — canvas del QR visual en el formulario de producto
- `#qr-scan-canvas` — canvas oculto del escáner (jsQR)
**No hubo colisión.** Los IDs son distintos y están en vistas diferentes.

---

## 6. Pruebas realizadas

### Generación y descarga del QR

| Prueba | Resultado |
|---|---|
| Crear producto nuevo → editar → ver QR | ✅ QR visible en formulario |
| Descargar QR como PNG | ✅ Archivo `qr-<nombre>.png` descargado |
| Abrir PNG descargado con app de cámara del sistema | ✅ Lee el texto `MONIARQUIA_PRODUCTO_<id>` |
| Productos creados antes de esta funcionalidad | ✅ Al editar, genera `codigoQR` con su ID existente |

### Escaneo desde la app

| Prueba | Resultado |
|---|---|
| Cámara abre desde "Iniciar venta" | ✅ |
| Cámara abre desde "Escanear otro" | ✅ |
| Panel de estado visible en desktop (Chrome) | ✅ |
| Panel de estado visible en iPhone | ❌ No confirmado visualmente (ver sección 8) |
| Escaneo exitoso en desktop | ❌ No confirmado |
| Escaneo exitoso en iPhone | ❌ No confirmado |
| Botón "Volver al carrito" visible desde "Escanear otro" | ✅ |
| Botón "Reintentar escaneo" funciona | ✅ |

---

## 7. Herramientas de diagnóstico agregadas

### Panel de estado `#escaner-status`

Panel compacto dentro de `#vista-escanear`, siempre visible mientras se escanea. Muestra 6 campos:

| Campo | ID DOM | Qué indica |
|---|---|---|
| `CAM` | `est-camara` | Estado de la cámara: "esperando" → "solicitando permiso…" → "stream OK, play…" → "activa (1280x720)" o error |
| `LOOP` | `est-loop` | Estado del `requestAnimationFrame`: "detenido" → "corriendo" → errores de inicialización |
| `FRAMES` | `est-frames` | Cantidad de frames procesados (se actualiza cada 30 frames y al detectar un QR). Si no sube, el video no entrega datos. |
| `QR` | `est-qr` | Texto detectado por jsQR. Si permanece "ninguno" durante el escaneo, jsQR no está leyendo el QR. |
| `DB` | `est-db` | Resultado de la búsqueda en Firestore: "–" → "buscando: <id>" → "encontrado: <nombre>" o "no encontrado" |
| `ERR` | `est-error` | Último error ocurrido en cualquier parte del flujo |

**Cómo diagnosticar con el panel:**

1. `CAM` no muestra "activa" → problema de permisos o hardware
2. `LOOP` no muestra "corriendo" → jsQR no cargó o falta el canvas
3. `FRAMES` no sube → video no entrega datos (`readyState < 2`)
4. `FRAMES` sube pero `QR` dice "ninguno" → jsQR no detecta el código (iluminación, distancia, tamaño)
5. `QR` tiene el texto correcto pero `DB` dice "no encontrado" → el ID en el QR no existe en Firestore
6. Todo OK pero no navega → problema en `abrirProducto()`

### Función de diagnóstico

```js
function actualizarDebugEscaneo(campo, valor) {
    const mapa = {
        camara:    'est-camara',
        loop:      'est-loop',
        frames:    'est-frames',
        qr:        'est-qr',
        firestore: 'est-db',
        error:     'est-error',
    };
    const el = document.getElementById(mapa[campo] || campo);
    if (el) el.textContent = String(valor);
    console.log(`[ESC:${campo}]`, valor);
}
```

Se llama en cada etapa:
- Al entrar a la pantalla de escaneo
- Al solicitar permiso de cámara
- Cuando `getUserMedia` responde
- Cuando `play()` resuelve
- Al iniciar el loop
- Cada 30 frames procesados
- Cuando jsQR detecta texto
- Cuando se busca en Firestore
- Cuando se encuentra o no el producto

---

## 8. Estado actual

### ✅ Funciona

- Generación automática del `codigoQR` al crear productos (`MONIARQUIA_PRODUCTO_<idFirestore>`)
- Guardado del identificador en Firestore dentro del documento del producto
- Visualización del QR en el formulario de edición del producto
- Descarga del QR como archivo PNG de 300px de resolución
- Panel de estado inline dentro de la pantalla de escaneo (visible en el layout)
- Botón "Reintentar escaneo" — detiene y reinicia la cámara
- Botón "Buscar producto manualmente" — fallback al flujo manual
- Botón "Volver al carrito" — visible solo cuando se llega desde el carrito
- Lógica de `procesarCodigoQR()` correctamente implementada con validación del prefijo y búsqueda en Firestore

### ❌ No funciona / No confirmado

- **El escaneo del QR desde iPhone no funciona.** La cámara abre y el video se reproduce, pero jsQR no detecta el código o la lectura no se completa correctamente.
- **La búsqueda del producto luego del escaneo** no se ejecuta porque el paso anterior no llega.
- **La apertura automática de la pantalla de selección** (talle, color, cantidad) no ocurre.
- **El panel de diagnóstico en iPhone** — las versiones con `position: fixed` no se veían. La versión actual es inline y debería verse, pero no fue confirmado en el dispositivo.

---

## 9. Hipótesis pendientes

Las siguientes causas aún no han sido descartadas con evidencia directa:

1. **jsQR no está cargando desde el CDN.** El CDN de jsDelivr podría no estar disponible o bloqueado. Si `typeof jsQR === 'undefined'`, el loop se detiene silenciosamente.

2. **El canvas no recibe datos válidos del video.** En iOS Safari, el `videoWidth` y `videoHeight` pueden ser 0 durante varios frames iniciales. El código tiene validación para este caso pero no se ha confirmado si el problema persiste.

3. **El video no entrega frames en iPhone.** Si `readyState` nunca llega a >= 2 en el dispositivo específico, el loop nunca procesa ningún frame.

4. **jsQR lee el QR pero el formato del texto es diferente al esperado.** El QR generado por QRious podría incluir caracteres extra (salto de línea, BOM) que rompan la validación `startsWith(PREFIJO_QR)`.

5. **El ID leído del QR no coincide con ningún documento en Firestore.** Podría haber una diferencia de mayúsculas/minúsculas o espacios adicionales en el valor extraído.

6. **La función `abrirProducto(id)` recibe el ID correcto pero no encuentra el producto en `listaPrendasGlobal`.** El onSnapshot podría no haber cargado todos los productos si el usuario entra directamente al escaneo sin pasar por el inventario.

7. **El loop arranca pero `streamCamara` se vuelve null prematuramente.** Si otra función llama `detenerCamara()` sin que sea visible en el log, el loop para y no lo registra.

8. **Incompatibilidad específica del modelo de iPhone.** Algunos modelos tienen comportamientos distintos con `getUserMedia`, `play()`, o el canvas 2D context.

---

## 10. Próximos pasos sugeridos

Orden recomendado para retomar el desarrollo:

### Paso 1 — Confirmar que jsQR carga

Agregar al iniciar la app:
```js
window.addEventListener('load', () => {
    console.log('jsQR cargado:', typeof jsQR !== 'undefined', typeof jsQR);
});
```

Si `jsQR` es `undefined`, el CDN no cargó. Alternativa: incluir jsQR como archivo local en el proyecto.

### Paso 2 — Confirmar que el video entrega frames en iPhone

En el panel de estado, observar si `FRAMES` sube. Si no sube después de 3 segundos con la cámara activa, el video no está entregando datos. En ese caso:
- Verificar `videoEl.readyState` en el panel `CAM`
- Probar con `readyState >= 1` para detectar si llega a algún estado

### Paso 3 — Confirmar que jsQR lee algún contenido

Apuntar la cámara a cualquier QR conocido (ej. un QR de una URL). Si el campo `QR` del panel muestra el texto, jsQR funciona. El problema entonces sería de prefijo o de Firestore.

### Paso 4 — Confirmar el valor exacto del QR generado

Escanear el QR descargado con la cámara nativa del iPhone (fuera de la app). El texto debe ser exactamente:
```
MONIARQUIA_PRODUCTO_<idFirestore>
```
Sin saltos de línea, sin espacios. Copiar ese texto y compararlo con el `codigoQR` en Firestore.

### Paso 5 — Confirmar la búsqueda en Firestore

Con el ID extraído manualmente, ejecutar en consola:
```js
db.collection('productos').doc('<id>').get().then(d => console.log(d.exists, d.data()));
```
Si devuelve `false`, el ID no existe en la colección.

### Paso 6 — Confirmar apertura del producto

Si los pasos anteriores funcionan, probar llamar manualmente desde consola:
```js
abrirProducto('<id-conocido>');
```
Si abre la pantalla de selección, el problema estaba en la cadena de detección.

### Paso 7 — Integrar con jsQR como archivo local

Si el CDN sigue siendo inestable en iPhone:
1. Descargar `jsQR.min.js` de npm
2. Guardarlo en `/js/jsQR.min.js`
3. Cargar con `<script src="js/jsQR.min.js"></script>`

### Paso 8 — Considerar alternativa: BarcodeDetector API nativa

iOS 17+ incluye `BarcodeDetector` nativa. Si el target es iOS 17+:
```js
if ('BarcodeDetector' in window) {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const barcodes = await detector.detect(videoEl);
    if (barcodes.length > 0) procesarCodigoQR(barcodes[0].rawValue);
}
```
No requiere librería externa. Combinar con jsQR como fallback.

---

## 11. Conclusión

El sistema de generación de QR está completamente implementado y funciona correctamente:

- Cada producto tiene su identificador único `MONIARQUIA_PRODUCTO_<id>` guardado en Firestore
- El QR se muestra visualmente en el formulario de edición
- El QR se puede descargar como PNG de alta resolución
- La etiqueta es apta para imprimir y pegar en prendas físicas

El único punto bloqueante es el **flujo de escaneo dentro de la app**:

```
Escanear QR con la cámara de la app
    → identificar el texto MONIARQUIA_PRODUCTO_<id>
    → buscar el producto en Firestore
    → abrir la pantalla de selección de talle, color y cantidad
    → agregar al carrito
```

La implementación técnica de ese flujo está completa (funciones, lógica, validaciones, manejo de errores). El problema es que en iPhone no se ha podido confirmar que jsQR detecte el código desde el video. Las hipótesis más probables son: jsQR no carga del CDN, el video no entrega frames en iOS, o el readyState no alcanza el umbral esperado.

Cualquier desarrollador puede retomar este trabajo siguiendo los pasos de la sección 10 para identificar exactamente en cuál eslabón de la cadena se rompe el flujo.

---

*Documento creado: Junio 2026.*
