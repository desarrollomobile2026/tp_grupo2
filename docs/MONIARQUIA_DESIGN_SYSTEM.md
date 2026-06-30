# Moniarquía — Design System

> Referencia visual del proyecto. Actualizado: 30 de junio de 2026.
> Consultar siempre antes de agregar nuevas pantallas o componentes.

---

## 1. Paleta de colores

```css
:root {
    --rosa-base:       #FFDFDF;  /* fondo de app, cards, fondo home */
    --rosa-viejo:      #FF8C98;  /* avatar de cliente, botones secundarios, chips activos */
    --rojo-moniarquia: #FF6677;  /* botón primario, precios, acentos de marca */
    --blanco:          #FFFFFF;  /* fondos de cards, nav, inputs */
    --negro-pleno:     #000000;  /* bordes, íconos */
    --negro-texto:     #1E1E1E;  /* texto principal */
    --gris:            #5A5A5A;  /* textos secundarios, placeholders, metadatos */
    --verde-ok:        #41EC5B;  /* confirmaciones de éxito, checkmarks */
    --sombra:  0px 4px 4px rgba(0, 0, 0, 0.25);
}
```

### Uso de colores por contexto

| Color | Usos principales |
|---|---|
| `--rojo-moniarquia` | Botón primario, precios de productos, badges de rol, avatar de perfil, ícono del QR |
| `--rosa-base` | Fondo general de la app, cards del home, fondos de chips de talla, fondo del header en Home |
| `--rosa-viejo` | Avatar de clientes, menú items, botones de acción secundaria |
| `--verde-ok` | Ícono de check en pantallas de éxito, saldo 0 en detalle de cliente |
| `--gris` | Texto secundario, placeholders, metadatos, subtítulos |
| `--blanco` | Fondo de cards, formularios, header en pantallas no-Home |

---

## 2. Tipografía

### Fuentes cargadas

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Mr+Dafoe&display=swap">
```

| Fuente | Uso | Notas |
|---|---|---|
| **Inter** | Todo el cuerpo de la app | Pesos: 400, 500, 600, 700 |
| **Mr Dafoe** | Solo el logotipo "Moniarquía" | 64px, weight 400, line-height 0.9 |

### Escala tipográfica

| Estilo | Tamaño | Peso | Uso |
|---|---|---|---|
| Logo | 64px | 400 | Logotipo en Home, Splash, pantallas de éxito |
| Título de sección | 20px | 700 | Títulos dentro del contenido (`.section-title`) |
| Nombre de producto | 16–18px | 700 | Nombres en cards y detalle |
| Precio | 14–20px | 700 | Precio destacado en rojo |
| Texto de botón | 16px | 700 | Todos los botones primarios y secundarios |
| Texto normal | 13–14px | 400–600 | Descripciones, metadatos |
| Texto pequeño | 10–12px | 400–700 | Chips, badges, texto debug |
| Placeholder | 14px | 400 | Inputs de formularios |

### Jerarquía en el header

- **Título en header:** 16px, 700 (`.header-titulo`)
- **Logo en Home:** Mr Dafoe 64px + subtítulo "INDUMENTARIA" 14px 600 letter-spacing 2px

---

## 3. Iconografía

**Librería:** [Lucide Icons](https://lucide.dev/) — CDN

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

**Uso:**
```html
<i data-lucide="shopping-cart"></i>
<!-- Después de renderizar dinámicamente: -->
<script>if (typeof lucide !== 'undefined') lucide.createIcons();</script>
```

### Íconos principales del proyecto

| Ícono | Uso |
|---|---|
| `chevron-left` | Botón volver en header |
| `menu` | Botón hamburguesa en header |
| `home` | Menú: Inicio |
| `package` | Menú: Inventario |
| `users` | Menú: Clientes |
| `archive-restore` | Menú: Cambios y devoluciones |
| `settings` | Menú: Configuración |
| `log-out` | Cerrar sesión |
| `shopping-cart` | Iniciar venta, carrito |
| `search` | Buscar |
| `plus` | Agregar producto |
| `pencil` | Editar |
| `trash-2` | Eliminar |
| `check` | Confirmación de éxito |
| `check-circle` | Confirmar pago |
| `download` | Descargar QR |
| `refresh-cw` | Reintentar escaneo |
| `scan-line` | Escanear (en inventario) |
| `camera` | Botón de foto en formulario |
| `heart` | Decoración del logo |
| `chevron-right` | Navegación en listas |
| `user`, `user-round`, `user-round-plus` | Perfil, login, registro |
| `lock-keyhole` | Contraseña |
| `mail` | Correo electrónico |
| `package-plus` | Gestionar stock (empleados) |
| `shield` | Cambiar rol |
| `user-x`, `user-check` | Desactivar/activar usuario |
| `alert-triangle` | Card de alertas de stock bajo (Home) |
| `package-check` | Ítem "Alertas de stock bajo" en Configuración |

> **Importante:** cuando Lucide reemplaza `<i data-lucide="X">` por `<svg>`, el SVG hereda la clase del `<i>`. Los selectores CSS deben apuntar al nombre de clase, no a `svg:first-child`.

---

## 4. Estructura de la app (layout)

```
body (flex, 100dvh, overflow: hidden)
└── #app-container (flex column, max-width: 412px, overflow: hidden)
    ├── .top-header (flex row, min-height: 72px, z-index: 100)
    │   ├── #btn-volver (44×44px, visibility: hidden en Home/Splash)
    │   ├── .header-titulo (centrado, display: none por defecto)
    │   └── #btn-menu (44×44px)
    ├── <main class="vista active"> (flex column, flex-grow: 1, overflow-y: auto)
    ├── ... otras vistas (display: none)
    ├── <nav class="bottom-nav"> (oculta — display: none)
    ├── #menu-overlay (position: absolute, z-index: 200)
    └── #menu-lateral (position: absolute, z-index: 201, width: 72%)
```

### Control de vistas

```css
.vista { display: none; flex-direction: column; flex-grow: 1; overflow-y: auto; padding: 24px 20px 24px; }
.vista.active { display: flex; animation: aparecer 0.2s ease-in; }
```

### Títulos de header dinámicos

Los títulos en el header se controlan con `data-vista` en `#app-container`:

```css
.header-titulo { display: none; flex: 1; text-align: center; font-size: 16px; font-weight: 700; }
#app-container[data-vista="vista-inventario"] .header-titulo--inventario { display: block; }
/* ... etc. para cada vista ... */
```

El `data-vista` se actualiza en `navegarA(vistaId)`.

---

## 5. Componentes

### Botones

```css
/* Primario */
.btn-primary {
    width: 100%; background-color: var(--rojo-moniarquia); color: var(--blanco);
    border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700;
    box-shadow: var(--sombra);
}

/* Secundario outline (rojo) */
.btn-secondary-outline {
    width: 100%; background: transparent; color: var(--rojo-moniarquia);
    border: 2px solid var(--rojo-moniarquia); padding: 14px; border-radius: 12px;
    font-size: 16px; font-weight: 700;
}

/* Outline neutro */
.btn-outline {
    width: 100%; background: transparent; color: var(--negro-pleno);
    border: 1px solid var(--negro-pleno); padding: 16px; border-radius: 12px;
    font-size: 16px; font-weight: 700;
}

/* Destructivo */
.btn-danger {
    width: 100%; background-color: var(--rojo-moniarquia); color: var(--blanco);
    border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700;
}
```

**Botón con ícono:** agregar clase `.btn-con-icono` (display: flex, gap: 8px, svg: 20px stroke blanco).

### Inputs

```css
.form-moniarquia input, .form-moniarquia select, .form-moniarquia textarea {
    width: 100%; padding: 14px; border-radius: 10px;
    border: 1px solid var(--negro-pleno); font-size: 14px;
    background-color: var(--blanco); color: var(--gris);
    box-shadow: inset 0 2px 2px rgba(0,0,0,0.05);
}

.form-moniarquia input:focus { border: 2px solid var(--rojo-moniarquia); }
```

### Cards generales

```css
/* Card de item en lista (cliente, usuario, etc.) */
.cliente-item {
    background: var(--blanco); border: 1px solid var(--negro-pleno);
    border-radius: 12px; padding: 12px 14px; display: flex;
    align-items: center; gap: 12px; box-shadow: var(--sombra);
}

/* Card de confirmación */
.confirmar-card {
    background: var(--blanco); border: 1px solid var(--negro-pleno);
    border-radius: 16px; padding: 32px 24px; text-align: center;
    box-shadow: var(--sombra);
}

/* Card de éxito */
.exito-card {
    background: var(--blanco); border: 1px solid var(--negro-pleno);
    border-radius: 16px; padding: 28px 20px; display: flex;
    flex-direction: column; align-items: center; gap: 12px;
}
```

### Menú hamburguesa

- Ancho: 72% del `#app-container`
- Posición: `position: absolute; right: 0; height: 100%; z-index: 201`
- Animación: `transform: translateX(100%)` → `translateX(0)` (0.25s ease)
- Items: fondo `var(--rosa-viejo)`, border-radius 12px, gap 10px entre items

### Chips de categoría

```css
.chip { background: var(--blanco); border: 1px solid var(--negro-pleno); padding: 8px 18px; border-radius: 20px; }
.chip.active { background: var(--rosa-viejo); color: var(--blanco); }
```

### Avatar circular

- Clientes: 40px, fondo `var(--rosa-viejo)`, texto inicial blanco 700
- Usuarios: 40px, fondo `var(--rosa-viejo)` o `var(--rojo-moniarquia)` según rol
- Perfil: 56px, fondo `var(--rojo-moniarquia)`

### Card de alerta (stock bajo)

Card de fondo rojo sólido para avisos críticos, usada en Home.

```css
.home-alerta-stock {
    background-color: var(--rojo-moniarquia);
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: var(--sombra);
}
```

- Encabezado con ícono `alert-triangle` (blanco) + título en blanco 700
- Lista de ítems con `max-height: 90px` y `overflow-y: auto` (se trunca si hay muchas alertas)
- Botón "Ver productos" con fondo semitransparente (`rgba(255,255,255,0.2)`) y borde blanco translúcido
- Oculta por defecto (`display:none`), visible solo cuando `calcularAlertasStock()` devuelve resultados

**Patrón de layout — wrapper anclado al fondo:** cuando un elemento opcional (como esta alerta) debe aparecer *arriba* de unos botones que ya usan `margin-top: auto`, no agregar el elemento como hermano suelto — el margen automático se recalcula y los botones se desplazan. En su lugar, agrupar ambos en un wrapper y mover el `margin-top: auto` al wrapper:

```css
.home-bottom { display: flex; flex-direction: column; gap: 14px; margin-top: auto; }
.home-cards  { display: flex; flex-direction: column; gap: 14px; } /* sin margin-top */
```

```html
<div class="home-bottom">
    <div id="home-alertas-stock" style="display:none;">...</div>
    <div class="home-cards">...</div>
</div>
```

Así, cuando la alerta está oculta, los botones quedan en la misma posición de siempre; cuando aparece, crece hacia arriba sin desplazar los botones.

### Chip de talla en alerta

Variante de `.inv-talla-chip` para indicar stock bajo en el Inventario.

```css
.inv-talla-chip.inv-chip-alerta {
    background-color: #FEF3C7;
    border-color: #F59E0B;
}
.inv-talla-chip.inv-chip-alerta span,
.inv-talla-chip.inv-chip-alerta em { color: #92400E; }
```

### Toggle switch

Switch ON/OFF reutilizable, usado en la configuración de alertas de stock.

```css
.toggle-switch { position: relative; width: 46px; height: 26px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-slider {
    position: absolute; inset: 0; background-color: #ccc;
    border-radius: 26px; cursor: pointer; transition: background-color 0.2s;
}
.toggle-slider::before {
    content: ''; position: absolute; width: 20px; height: 20px;
    left: 3px; bottom: 3px; background-color: #fff; border-radius: 50%;
    transition: transform 0.2s;
}
.toggle-switch input:checked + .toggle-slider { background-color: var(--rojo-moniarquia); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }
```

```html
<label class="toggle-switch">
    <input type="checkbox" id="config-stock-activo">
    <span class="toggle-slider"></span>
</label>
```

### Splash de presentación

Pantalla introductoria de 2 segundos, sin interacción del usuario. Reutiliza la estructura del logo de Home (`.logo-text`, `.sub-logo`, `.home-deco`) centrada vertical y horizontalmente.

```css
#vista-splash-presentacion {
    background-color: var(--rosa-base);
    align-items: center;
    justify-content: center;
    gap: 28px;
    text-align: center;
}
```

**Capa de refuerzo:** se agrega/quita una clase adicional durante la ventana de 2s para garantizar prioridad visual absoluta, independiente de cualquier otro elemento posicionado dentro de `#app-container`:

```css
.splash-presentacion-forzado {
    display: flex !important;
    position: absolute;
    inset: 0;
    z-index: 9999;
}
```

---

## 6. Patrones de navegación

### Header en cada pantalla

| Vista | Back visible | Menú visible | Título header |
|---|---|---|---|
| Splash de presentación | ❌ oculto | ❌ oculto | — |
| Home | ❌ oculto | ✅ | — |
| Splash/Login/Registro | ❌ oculto | ❌ oculto | — |
| Alertas de stock bajo (config) | ✅ | ✅ | "Alertas de stock bajo" |
| Inventario | ✅ | ✅ | "Inventario" |
| Carrito (venta) | ✅ | ✅ | "Carrito" |
| Clientes | ✅ | ✅ | "Clientes" |
| Seleccionar cliente | ✅ | ✅ | "Asociar a cliente" |
| Método de pago | ✅ | ✅ | "Método de pago" |
| Confirmar pago | ✅ | ✅ | "Confirmar pago" |
| Movimientos | ✅ | ✅ | "Movimientos" |
| Configuración | ✅ | ✅ | "Configuración" |
| Escanear producto | ✅ | ✅ | "Escanear producto" |
| Cambios | ✅ | ✅ | "Cambio o devolución" |
| Pantallas de éxito (logo) | ❌ | ✅ | — |

### Botón volver

El botón volver (`#btn-volver`) usa un **stack de historial** (`historialNavegacion[]`).
- `navegarA(vistaId)` → empuja la vista actual al stack (si no es silencioso)
- `volverAtras()` → pop del stack y navega
- Si el stack está vacío → va al Home

**Vistas sin botón volver:** `vista-home`, `vista-splash`, `vista-perfil-creado`, `vista-correo-enviado`, `vista-password-actualizada`

---

## 7. Espaciados y layout mobile

### Principios UX aplicados

- **Una mano:** botones de acción principal en la mitad inferior de la pantalla
- **Thumb zone:** `margin-top: auto` en botones para anclarlos al fondo del área útil
- **Respiración del header:** `padding-top: 24px` en todas las vistas (base de `.vista`)
- **Safe area inferior:** `padding-bottom: clamp(24px, 4dvh, 48px)` en vistas con botón al fondo

### Viewport y responsive

```css
body { height: 100dvh; } /* dvh = dynamic viewport height — excluye chrome del browser en móvil */
#app-container { max-width: 412px; overflow: hidden; min-height: 0; }
.vista { padding: 24px 20px 24px; overflow-y: auto; }
```

Uso de `clamp()` para adaptación a pantallas:
```css
/* Ejemplos reales del proyecto */
padding: clamp(16px, 4dvh, 28px) 20px clamp(20px, 4dvh, 36px);
height: clamp(160px, 28dvh, 220px);
font-size: 48px; /* solo en @media (max-height: 640px) */
```

---

## 8. Formularios

### Patrón estándar

```html
<form class="form-moniarquia" onsubmit="miFuncion(event)">
    <div class="input-group">
        <label>Etiqueta</label>
        <input type="text" id="mi-campo" placeholder="Texto de ayuda">
    </div>
    <button type="submit" class="btn-primary btn-submit">Guardar</button>
</form>
```

**Botón al fondo (patrón ergonómico):**
```css
#vista-mi-formulario .form-moniarquia { flex: 1; }
#vista-mi-formulario .btn-submit { margin-top: auto; }
```

### Selector de colores (custom)

Componente especial `.color-selector` con panel desplegable. No usa `<select>` nativo.
- Trigger: `.color-selector-trigger`
- Panel: `.color-selector-panel.abierto`
- Opciones: `.color-option` con `.color-swatch` y `.color-check.seleccionado`
- Estado: `coloresSeleccionados[]` (array global)

### Grid de stock por talla

```html
<div id="inv-stock-grid" class="inv-stock-grid">
    <!-- Generado dinámicamente por renderizarStockGrid(categoria, stockActual) -->
</div>
```

Genera inputs con IDs `inv-stock-S`, `inv-stock-M`, etc. (o números para pantalones).

---

*Design System — Actualizado 30 de junio de 2026.*
