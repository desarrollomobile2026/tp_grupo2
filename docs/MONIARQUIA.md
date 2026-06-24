# Moniarquía — Documento Maestro del Proyecto

> Referencia única para continuar el trabajo sin perder contexto entre sesiones.  
> Última actualización: Junio 2026

---

## 1. DATOS DEL PROYECTO ACADÉMICO

- **Materia:** Desarrollos para Dispositivos Móviles
- **Institución:** UNPAZ — Comisión C1, 2026
- **Alumno:** Oscar Castelani (castelani83@gmail.com)
- **Grupo:** Grupo 4 / Grupo 2 (según el repo de GitHub)

### Entregables del TP Integrador (3 pilares)

1. **Prototipo en Figma** — Revisar y completar con coherencia total con los UML
2. **Diagramas UML** — Actividad y secuencia para al menos 3 casos de uso
3. **Sitio web en GitHub** — Adaptación del código base a Moniarquía, con Firebase

Gestión del equipo: **Jira** (obligatorio) — tablero con tareas asignadas individualmente.

---

## 2. DESCRIPCIÓN DE LA APLICACIÓN

**Moniarquía** es una aplicación móvil para la gestión de un local de indumentaria (showroom de ropa).

### Funcionalidades
- Gestión de ventas
- Gestión de stock / inventario
- Gestión de clientes
- Cuenta corriente (deudas y pagos)
- Gestión de usuarios (roles: administrador / empleado)
- Cambios y devoluciones
- Registro de pagos (efectivo, Mercado Pago, cuenta corriente)
- Autenticación de usuarios

### Stack tecnológico previsto
- **Frontend móvil:** Por definir
- **Backend:** Firebase
- **Base de datos:** Cloud Firestore
- **Autenticación:** Firebase Authentication
- **Almacenamiento:** Firebase Storage

---

## 3. ARCHIVO FIGMA

- **Nombre:** `tp-avance2-planificacion`
- **File key:** `lgvsb4okC7eoXqqYNSXj1S`
- **URL:** `https://www.figma.com/design/lgvsb4okC7eoXqqYNSXj1S/tp-avance2-planificacion`
- **Frame Design System:** Frame 6, nodo `24-23` (2818×2441 px — "Guía de Diseño")
- **Modo de acceso de Claude:** Solo lectura. No se edita directamente.

### Pantallas identificadas (21 pantallas)

#### Autenticación
| Pantalla | Capa Figma |
|---|---|
| Splash / Inicio | `Inicio` |
| Iniciar sesión | `Iniciar sesión` |
| Registrarse | `Registrarse` |
| Perfil creado | `Perfil creado` |

#### Flujo principal / Home
| Pantalla | Capa Figma |
|---|---|
| Página de inicio | `Página de inicio` |
| Menú | `Menu` |
| Configuración | `Configuracion` |

#### Inventario / Ventas
| Pantalla | Capa Figma |
|---|---|
| Inventario | `Inventario` |
| Escaneo exitoso | `Escaneo exitoso 1` |
| Escaneo activo | `Escaneo 2` |
| Confirmar compra | `Confirmar compra` |
| Carrito vacío | `Carrito vacío` |
| Editar producto carrito | `Editar producto carrito` |
| Eliminar producto carrito | `Eliminar producto carrito` |

#### Clientes / Pagos
| Pantalla | Capa Figma |
|---|---|
| Agregar cliente | `agregar cliente` |
| Registrar deuda | `Registrar deuda` |
| Pago Mercado Pago | `Pago Mercado Pago` |
| Pago aprobado | `Pago aprobado` |

#### Cambios y Devoluciones
| Pantalla | Capa Figma |
|---|---|
| Cambio realizado | `Cambio realizado` |

### Flujo de navegación
```
Splash / Inicio
    ├── Iniciar sesión ──► Página de inicio
    └── Registrarse ──► Perfil creado ──► Página de inicio

Página de inicio
    ├── Inventario ──► Escaneo ──► Escaneo exitoso ──► Confirmar compra ──► Pago
    ├── Agregar cliente ──► formulario ──► confirmación
    ├── Registrar deuda ──► Cuenta corriente
    └── Configuración / Menú
```

### Patrones UX observados
- Navegación: bottom navigation o menú hamburguesa (capa "Menu")
- Flujo de venta: lineal (scan → confirmar → pago)
- Confirmaciones: pantallas de estado (éxito / error) con botón de retorno
- Formularios: inputs estándar con validación visual
- Diseñado para uso con una sola mano, en entorno comercial

---

## 4. DESIGN SYSTEM

Modo de análisis: lectura del Frame 6 (`node-id=24-23`) en Figma. Colores confirmados desde el inspector de propiedades y color picker.

### 4.1 Paleta de colores

Todos los colores están definidos como **Variables** en el panel "Bibliotecas" del archivo.

| Variable | Hex | Uso principal |
|---|---|---|
| **Negro pleno** | `#000000` | Textos, íconos |
| **gris** | `#5A5A5A` | Textos secundarios, placeholders |
| **Rojo** | `#FF6677` | Botones CTA primarios, color marca |
| **Rosa** | `#FFDFDF` | Fondos de cards, hover |
| **Rosa viejo** | ~`#FF8C98` | Acciones secundarias ⚠️ estimado |
| **Bordó** | ~`#8B0000` | Acento de marca ⚠️ estimado |
| **Blanco** | `#FFFFFF` | Fondos de pantalla |
| **Verde / Verde-ok** | `#41EC58` | Éxito, confirmaciones |

> ⚠️ Bordó y Rosa viejo son valores aproximados. Confirmar habilitando Figma Dev Mode MCP (Figma Desktop → Preferencias → Enable Dev Mode MCP Server → reiniciar Claude).

Fondo del frame Design System: `#DEDEDE` (uso interno, no es un token de la app).

#### Tokens → CSS
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

:root {
  --color-negro:     #000000;
  --color-gris:      #5A5A5A;
  --color-rojo:      #FF6677;
  --color-rosa:      #FFDFDF;
  --color-blanco:    #FFFFFF;
  --color-verde:     #41EC58;
  --font-base:       'Inter', sans-serif;
}
```

#### Tokens → Android / Compose
```kotlin
object MoniarquiaColors {
    val NegroPLeno = Color(0xFF000000)
    val Gris       = Color(0xFF5A5A5A)
    val Rojo       = Color(0xFFFF6677)
    val Rosa       = Color(0xFFFFDFDF)
    val Blanco     = Color(0xFFFFFFFF)
    val Verde      = Color(0xFF41EC58)
    // Rosa viejo y Bordó: verificar hex exacto
}
```

### 4.2 Tipografía

**Familia:** Inter — disponible en Google Fonts.  
**Peso predominante detectado:** Semi Bold.

| Estilo | Tamaño | Interlineado | Uso |
|---|---|---|---|
| Logo | 58px | 72px | Logotipo, splash |
| Títulos | 24px | 32px | Títulos de sección |
| Subtítulos | 20px | Auto | Subtítulos de cards |
| Botones | 24px | 24px | Texto de CTAs |
| Textos | 16px | Auto | Cuerpo, descripciones |
| Placeholder | 14px | Auto | Placeholders de inputs |
| Texto chico | 12px | 20px | Etiquetas, chips |
| Texto chico 2 | 12px | 32px | Variante de texto chico |

> ⚠️ El logotipo "Moniarquía" usa una tipografía script/cursiva diferente a Inter. Identificada como estilo "Logo" pero con fuente distinta. Requiere verificación.

#### Escala → Android / Compose
```kotlin
object MoniarquiaType {
    val Logo      = TextStyle(fontSize = 58.sp, lineHeight = 72.sp)
    val Titulo    = TextStyle(fontSize = 24.sp, lineHeight = 32.sp)
    val Subtitulo = TextStyle(fontSize = 20.sp)
    val Boton     = TextStyle(fontSize = 24.sp, lineHeight = 24.sp)
    val Texto     = TextStyle(fontSize = 16.sp)
    val Placeholder = TextStyle(fontSize = 14.sp)
    val TextoChico  = TextStyle(fontSize = 12.sp, lineHeight = 20.sp)
}
```

### 4.3 Componentes (31 total en el archivo)

#### Botones
| Variante | Estilo | Fondo | Texto | Uso |
|---|---|---|---|---|
| Primario grande | Filled, rounded | `#FF6677` | `#FFFFFF` | "Iniciar venta", "Iniciar sesión" |
| Primario normal | Filled, rounded | `#FF6677` | `#FFFFFF` | "Nueva venta", "Siguiente" |
| Secundario | Outline | Transparente | `#FF6677` | "Volver al inicio", "Escanear otro" |
| Confirmación | Filled, rounded | `#41EC58` | `#FFFFFF` | "Entendido" |
| Registro | Outline / ghost | Transparente | `#000000` | "Registrarse" |
| Link de acción | Sin borde | Transparente | variable | "Cuenta corriente" |

> Radio de esquina: estimado 8–12px. Padding: por confirmar en Dev Mode.

#### Inputs
- Bordes definidos, placeholder en `#5A5A5A`
- Estados: normal, activo (borde rosa), error

#### Cards de producto
- Imagen + nombre + precio
- Selector de talla/color
- Botón de cantidad (+/−)
- Precio total destacado en `#FF6677`

#### Items de lista
- Filas con imagen miniatura, nombre, precio, SKU
- Swipe actions implícitas (editar, eliminar)

#### Modales / Bottom sheets
- Confirmación de compra
- Estado vacío (carrito vacío)

### 4.4 Iconos

**Librería:** [Lucide Icons](https://lucide.dev/)

| Ícono | Uso |
|---|---|
| `archive-restore` | Cambios y devoluciones |
| `users` | Gestión de clientes |
| `lock-keyhole` | Autenticación / login |
| `search` | Buscador de inventario |
| `shopping-cart` | Ventas / carrito |
| `package` | Inventario / stock |
| `check-circle` | Confirmación / éxito |
| `triangle-warning` | Error / advertencia |
| `chevron-left` | Navegar hacia atrás |
| `menu` | Menú hamburguesa |
| `user` | Perfil de usuario |

```html
<!-- Web — CDN -->
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="shopping-cart"></i>
```

---

## 5. SITIO WEB (TP Integrador)

### Repositorio
- **URL:** `https://github.com/desarrollomobile2026/tp_grupo2`
- **Stack:** HTML5 + CSS3 + JS vanilla + Firebase Firestore SDK compat v10.7.1

### Estructura del código base
```
index.html   ← vistas, navegación, modales
style.css    ← estilos mobile-first
app.js       ← lógica de UI, carrito, Firestore
config.js    ← credenciales Firebase (completar con las del grupo)
README.md
```

### Funcionalidades ya implementadas
- SPA con vistas: inicio, productos, favoritos, carrito
- Catálogo desde Firestore en tiempo real (`onSnapshot`)
- Búsqueda por nombre
- Sistema de likes / destacados
- Carrito con localStorage
- Alta y baja de productos en Firestore
- Modal de detalle de producto

### Qué pide realmente la consigna

> "esta actividad se enfoca en la **adaptación del diseño y del contenido** del proyecto, no en una complejidad técnica adicional."

No hay que reescribir un sistema de gestión. Hay que adaptar el código base a la identidad de Moniarquía.

### Plan de adaptación

| Tarea | Complejidad | Prioridad |
|---|---|---|
| Aplicar Design System en `style.css` (colores + Inter) | Baja | Alta |
| Branding: título "Moniarquía", colores | Baja | Alta |
| Adaptar categorías a indumentaria en `index.html` | Baja | Alta |
| Completar `config.js` con Firebase del grupo | Baja | Alta |
| Cargar productos de ejemplo en Firestore | Baja | Alta |
| Coherencia visual con Figma (cards, botones, nav) | Media | Alta |
| Pantalla de Login con Firebase Auth | Media | Media |
| Pantalla de Registro | Media | Media |

### Lo que NO es necesario para el TP
- Cuenta corriente funcional
- Módulo de cambios y devoluciones
- Gestión de roles con reglas Firestore
- Integración real con Mercado Pago
- Escáner de código de barras

---

## 6. MODELO DE DATOS FIRESTORE

```
/usuarios/{userId}
  - email: string
  - nombre: string
  - rol: "administrador" | "empleado"
  - createdAt: timestamp

/productos/{productoId}
  - nombre: string
  - precio: number
  - stock: number
  - tallas: string[]
  - colores: string[]
  - imagen: string (Storage URL)
  - codigoBarras: string
  - categoria: string
  - createdAt: timestamp

/ventas/{ventaId}
  - clienteId: string (ref)
  - empleadoId: string (ref)
  - items: [{productoId, cantidad, talla, color, precioUnitario}]
  - total: number
  - metodoPago: "efectivo" | "mercadopago" | "cuenta_corriente"
  - estado: "completada" | "cancelada"
  - fecha: timestamp

/clientes/{clienteId}
  - nombre: string
  - telefono: string
  - email: string
  - deudaTotal: number
  - createdAt: timestamp

/cuentaCorriente/{registroId}
  - clienteId: string (ref)
  - tipo: "deuda" | "pago"
  - monto: number
  - descripcion: string
  - ventaId: string (ref, opcional)
  - fecha: timestamp
```

---

## 7. INSTRUCCIONES PARA CLAUDE

1. **Figma es read-only.** Generar specs de implementación para que el diseñador las aplique. No intentar editar el archivo.
2. **Design System es la fuente de verdad.** Usar siempre los tokens de color y tipografía de la sección 4.
3. **No generar cambios destructivos.** No eliminar ni modificar pantallas o flujos aprobados.
4. **Bordó y Rosa viejo son estimaciones.** Verificar activando Figma Dev Mode MCP.
5. **Para el sitio web:** la consigna pide adaptación, no reescritura. Partir del código base de `tp_grupo2`.
6. **Pensar siempre en Firebase.** Cualquier funcionalidad nueva debe considerar colección/documento, validaciones y reglas de seguridad.
7. **Cuando se pida una nueva pantalla:** generar specs detalladas (estructura del frame, componentes a reutilizar, jerarquía visual, espaciados, estados, comportamiento) sin asumir que se puede editar Figma directamente.

### Valores pendientes de verificar en Dev Mode
1. Hex exacto de **Bordó** (~#8B0000)
2. Hex exacto de **Rosa viejo** (~#FF8C98)
3. Pesos tipográficos específicos por estilo
4. Radio de esquina de botones (estimado: 8–12px)
5. Padding interno de botones y cards
6. Distinción entre variables "Verde", "verde" y "Verde-ok"
7. Fuente exacta del logotipo "Moniarquía"

---

*Documento unificado. Junio 2026.*
