// app.js - Motor NoSQL en Tiempo Real (Moniarquía Indumentaria)

// =====================================================================
// 1. ESTADO GLOBAL (Memoria RAM + LocalStorage del usuario)
// =====================================================================
let carrito = JSON.parse(localStorage.getItem('moniarquia_cart_v1')) || [];
let listaPrendasGlobal = [];
let filtroCategoriaActual = "Todas";
let terminoBuscado = "";

// Estado del inventario (Etapa 2)
let filtroInvCategoria = "Todos";
let terminoInvBusqueda = "";
let productoEditandoId = null;
let productoAEliminar = null;

// Stack de navegación (Back button)
let historialNavegacion = [];

// Stream de cámara activo (escaneo)
let streamCamara = null;

// Estado del flujo de venta (Etapa 3)
let carritoVenta = JSON.parse(localStorage.getItem('moniarquia_carrito_venta')) || [];
let productoActual = null;
let tallaSeleccionada = null;
let colorSeleccionado = null;
let cantidadSeleccionada = 1;
let filtroVentaCategoria = 'Todos';
let terminoVentaBusqueda = '';

// Estado de clientes y ventas (Etapa 4)
let listClientesGlobal = [];
let clienteSeleccionado = null;
let metodoPagoActual = null;
let origenAgregarCliente = 'venta';

// =====================================================================
// 2. CONEXIÓN A FIRESTORE (El "Woki-Toki" con Google)
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const btnVolver = document.getElementById('btn-volver');
    if (btnVolver) btnVolver.style.visibility = 'hidden';

    actualizarBadgeCarrito();
    renderizarCarrito();

    // ESCUCHA EN TIEMPO REAL: db.collection().onSnapshot()
    db.collection('productos').onSnapshot((snapshot) => {
        listaPrendasGlobal = [];

        snapshot.forEach((doc) => {
            listaPrendasGlobal.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderizarCatalogo();
        renderizarFavoritos();
        renderizarInventario();
        renderizarSelectorProductos();
    }, (error) => {
        console.error("Error al escuchar Firestore:", error);
    });

    // Buscador catálogo anterior (conservado)
    const inputBuscador = document.getElementById('input-busqueda');
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            terminoBuscado = e.target.value.toLowerCase();
            renderizarCatalogo();
        });
    }

    // Buscador inventario (Etapa 2)
    const inputInv = document.getElementById('inv-busqueda');
    if (inputInv) {
        inputInv.addEventListener('input', (e) => {
            terminoInvBusqueda = e.target.value.toLowerCase();
            renderizarInventario();
        });
    }

    // Cambio de categoría en formulario: regenerar grid de talles
    const selectCat = document.getElementById('inv-categoria');
    if (selectCat) {
        selectCat.addEventListener('change', (e) => {
            renderizarStockGrid(e.target.value, {});
        });
    }

    // Buscador selector de productos en venta (Etapa 3)
    const inputVenta = document.getElementById('venta-busqueda');
    if (inputVenta) {
        inputVenta.addEventListener('input', (e) => {
            terminoVentaBusqueda = e.target.value.toLowerCase();
            renderizarSelectorProductos();
        });
    }

    // Restaurar carrito de venta desde localStorage
    renderizarCarritoVenta();

    // Suscripción en tiempo real a la colección de clientes (Etapa 4)
    db.collection('clientes').onSnapshot(snapshot => {
        listClientesGlobal = [];
        snapshot.forEach(doc => {
            listClientesGlobal.push({ id: doc.id, ...doc.data() });
        });
        listClientesGlobal.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        renderizarListaClientes('clientes-lista', false);
        renderizarListaClientes('seleccionar-lista', true);
    }, err => console.error('Error clientes onSnapshot:', err));

    // Buscadores de clientes
    document.getElementById('clientes-busqueda')?.addEventListener('input', () => {
        renderizarListaClientes('clientes-lista', false);
    });
    document.getElementById('seleccionar-busqueda')?.addEventListener('input', () => {
        renderizarListaClientes('seleccionar-lista', true);
    });
});

// =====================================================================
// 3. MOTORES DE RENDERIZADO EN PANTALLA
// =====================================================================

function renderizarCatalogo() {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const prendasFiltradas = listaPrendasGlobal.filter(prenda => {
        const pasaCat = (filtroCategoriaActual === "Todas") || (prenda.categoria === filtroCategoriaActual);
        const pasaNom = prenda.nombre.toLowerCase().includes(terminoBuscado);
        return pasaCat && pasaNom;
    });

    if (prendasFiltradas.length === 0) {
        contenedor.innerHTML = '<p class="cargando" style="grid-column: span 2;">No hay stock cargado para esta sección.</p>';
        return;
    }

    prendasFiltradas.forEach(p => {
        contenedor.innerHTML += `
            <div class="card-producto">
                <img src="${p.foto_url}" alt="${p.nombre}" onerror="this.src='https://placehold.co/300x400/FFDFDF/1E1E1E?text=Sin+Foto'">
                <div class="card-info">
                    <div>
                        <h3 class="nombre-prenda">${p.nombre}</h3>
                        <p class="precio-prenda">$ ${p.precio.toLocaleString('es-AR')}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn-like ${p.likes > 0 ? 'liked' : ''}" onclick="darLike('${p.id}')">
                            ❤️ <span>${p.likes}</span>
                        </button>
                        <button class="btn-add" onclick="agregarAlCarrito('${p.id}')">+</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderizarFavoritos() {
    const contenedor = document.getElementById('contenedor-destacados');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    // Ordenar de mayor a menor por likes y agarrar los 3 primeros
    const top3 = [...listaPrendasGlobal].sort((a, b) => b.likes - a.likes).slice(0, 3);

    top3.forEach(p => {
        contenedor.innerHTML += `
            <div class="card-producto">
                <img src="${p.foto_url}" alt="${p.nombre}">
                <div class="card-info" style="padding: 6px; text-align:center;">
                    <h3 class="nombre-prenda" style="font-size:11px;">${p.nombre}</h3>
                    <button class="btn-like liked" style="width:100%; justify-content:center;" onclick="darLike('${p.id}')">
                        ❤️ ${p.likes} deseos
                    </button>
                </div>
            </div>
        `;
    });
}

// =====================================================================
// 4. ACCIONES CRUD CON FIRESTORE
// =====================================================================

function darLike(idPrenda) {
    // Incremento Atómico NoSQL: Le suma 1 directo en el servidor de Google
    db.collection('productos').doc(idPrenda).update({
        likes: firebase.firestore.FieldValue.increment(1)
    }).catch(err => console.error("Fallo el like:", err));
}

// ALTA DESDE EL PANEL ADMIN
document.getElementById('form-alta-producto')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const botonBoton = e.target.querySelector('button[type="submit"]');
    botonBoton.innerText = "Subiendo a Google...";
    botonBoton.disabled = true;

    const nuevaPrenda = {
        nombre: document.getElementById('alta-nombre').value,
        precio: parseFloat(document.getElementById('alta-precio').value),
        categoria: document.getElementById('alta-categoria').value,
        foto_url: document.getElementById('alta-foto').value,
        descripcion: document.getElementById('alta-desc').value,
        likes: 0
    };

    db.collection('productos').add(nuevaPrenda)
        .then(() => {
            alert("¡Prenda guardada con éxito en Firestore!");
            e.target.reset();
            document.querySelector('.bottom-nav .nav-item').click(); // Simula tocar el botón "Inicio"
        })
        .catch(err => alert("Error de Firestore: " + err))
        .finally(() => {
            botonBoton.innerText = "Guardar en Base de Datos";
            botonBoton.disabled = false;
        });
});

// =====================================================================
// 5. LÓGICA DEL CARRITO (PERSISTENCIA LOCAL)
// =====================================================================

function agregarAlCarrito(idFirestore) {
    const item = listaPrendasGlobal.find(p => p.id === idFirestore);
    if (!item) return;

    carrito.push({ cartId: Date.now() + Math.random(), ...item });
    sincronizarCarritoLocal();
}

function borrarDelCarrito(cartId) {
    carrito = carrito.filter(i => i.cartId !== cartId);
    sincronizarCarritoLocal();
}

function sincronizarCarritoLocal() {
    localStorage.setItem('moniarquia_cart_v1', JSON.stringify(carrito));
    actualizarBadgeCarrito();
    renderizarCarrito();
}

function actualizarBadgeCarrito() {
    const b = document.getElementById('badge-carrito');
    if(b) b.innerText = carrito.length;
}

function renderizarCarrito() {
    const cont = document.getElementById('contenedor-items-carrito');
    const montoTotDom = document.getElementById('monto-total-carrito');
    if(!cont) return;

    cont.innerHTML = "";
    let suma = 0;

    if (carrito.length === 0) {
        cont.innerHTML = '<p class="cargando">Tu carrito está vacío.</p>';
        montoTotDom.innerText = "$ 0";
        return;
    }

    carrito.forEach(i => {
        suma += i.precio;
        cont.innerHTML += `
            <div class="item-carrito">
                <div class="item-carrito-info">
                    <h4>${i.nombre}</h4>
                    <p>$ ${i.precio.toLocaleString('es-AR')}</p>
                </div>
                <button class="btn-borrar" onclick="borrarDelCarrito(${i.cartId})">X</button>
            </div>
        `;
    });

    montoTotDom.innerText = "$ " + suma.toLocaleString('es-AR');
}

function finalizarPedido() {
    if(carrito.length === 0) return alert("El carrito está vacío.");
    
    let msj = "¡Hola Moniarquía! Quiero encargar este pedido:%0A%0A";
    carrito.forEach(p => msj += `• ${p.nombre} ($${p.precio})%0A`);
    const tot = carrito.reduce((acc, p) => acc + p.precio, 0);
    msj += `%0A*Total a pagar: $${tot}*`;

    window.open(`https://wa.me/5491100000000?text=${msj}`, '_blank');
    carrito = [];
    sincronizarCarritoLocal();
}

// Controlador de vistas inferior
function cambiarVista(idDestino, btn) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(idDestino)?.classList.add('active');
    btn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filtrarCategoria(cat) {
    filtroCategoriaActual = cat;
    document.querySelectorAll('.categorias-scroll .chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    renderizarCatalogo();
}

// =====================================================================
// 6. NAVEGACIÓN Y MENÚ HAMBURGUESA (Etapa 1)
// =====================================================================

function navegarA(vistaId, opciones) {
    // Si se abandona la vista de escaneo, apagar la cámara
    if (document.querySelector('.vista.active')?.id === 'vista-escanear' && vistaId !== 'vista-escanear') {
        detenerCamara();
    }

    const silencioso = opciones?.silencioso === true;

    if (!silencioso) {
        const vistaActualEl = document.querySelector('.vista.active');
        if (vistaActualEl?.id && vistaActualEl.id !== vistaId) {
            historialNavegacion.push(vistaActualEl.id);
        }
    }

    document.querySelectorAll('.vista').forEach(v => v.classList.remove('active'));
    const destino = document.getElementById(vistaId);
    if (destino) {
        destino.classList.add('active');
        destino.scrollTop = 0;
    }
    const btnVolver = document.getElementById('btn-volver');
    if (btnVolver) {
        btnVolver.style.visibility = (vistaId === 'vista-home') ? 'hidden' : 'visible';
    }
    document.getElementById('app-container')?.setAttribute('data-vista', vistaId);
}

function volverAtras() {
    if (historialNavegacion.length > 0) {
        const anterior = historialNavegacion.pop();
        navegarA(anterior, { silencioso: true });
    } else {
        navegarA('vista-home', { silencioso: true });
    }
}

// Ir al inicio limpiando el historial (usado en pantallas de éxito)
function irAlInicio() {
    historialNavegacion = [];
    navegarA('vista-home', { silencioso: true });
}

function abrirMenu() {
    document.getElementById('menu-lateral')?.classList.add('activo');
    document.getElementById('menu-overlay')?.classList.add('activo');
}

function cerrarMenu() {
    document.getElementById('menu-lateral')?.classList.remove('activo');
    document.getElementById('menu-overlay')?.classList.remove('activo');
}

function mostrarProximamente(seccion) {
    cerrarMenu();
    alert(`"${seccion}" estará disponible próximamente.`);
}

// =====================================================================
// 7. INVENTARIO — CRUD (Etapa 2)
// =====================================================================

const TALLAS_INV = ['S', 'M', 'L', 'XL'];

// Mapeo de producto a imagen local según nombre y color
function obtenerFotoProducto(p) {
    if (p.foto_url) return p.foto_url;
    if (p.imagen)   return p.imagen;
    const nombre = (p.nombre || '').toLowerCase();
    const color  = (Array.isArray(p.colores) ? p.colores[0] : (p.colores || '')).toLowerCase();
    if (nombre.includes('buzo'))    return 'docs/images/Buzo.png';
    if (nombre.includes('campera')) return 'docs/images/Campera frizada.png';
    if (nombre.includes('remera') || nombre.includes('modal')) {
        if (color.includes('chocolate') || nombre.includes('chocolate'))
            return 'docs/images/Remera de modal (chocolate).png';
        return 'docs/images/Remera de modal (verde).png';
    }
    return '';
}

function renderizarInventario() {
    const lista = document.getElementById('inv-lista');
    if (!lista) return;

    const filtrados = listaPrendasGlobal.filter(p => {
        const pasaCat  = filtroInvCategoria === 'Todos' || p.categoria === filtroInvCategoria;
        const nombre   = (p.nombre || '').toLowerCase();
        const cat      = (p.categoria || '').toLowerCase();
        const pasaBusq = terminoInvBusqueda === ''
            || nombre.includes(terminoInvBusqueda)
            || cat.includes(terminoInvBusqueda);
        return pasaCat && pasaBusq;
    });

    if (filtrados.length === 0) {
        lista.innerHTML = '<p class="cargando" style="text-align:center;padding:30px 0;">No hay productos en esta sección.</p>';
        return;
    }

    lista.innerHTML = filtrados.map(p => {
        const foto          = obtenerFotoProducto(p);
        const fotoFallback  = 'https://placehold.co/76x76/FFDFDF/5A5A5A?text=Sin+Foto';
        const stockPorTalla = p.stockPorTalla || {};
        const color = Array.isArray(p.colores) ? p.colores[0] : (p.colores || '');

        const metaParts = [];
        if (p.categoria) metaParts.push(`Categoría: ${p.categoria}`);
        if (color)       metaParts.push(`Color: ${color}`);
        const meta = metaParts.join('  ');

        const tallasParaMostrar = TALLES_POR_CATEGORIA[p.categoria] || TALLAS_INV;
        const total = tallasParaMostrar.reduce((s, t) => s + (stockPorTalla[t] || 0), 0);
        const tallasHTML = tallasParaMostrar.map(t => `
            <span class="inv-talla-chip">
                <span>${t}</span>
                <em>${stockPorTalla[t] ?? 0}</em>
            </span>`).join('') + `
            <span class="inv-talla-chip inv-chip-total">
                <span>Total</span>
                <em>${total}</em>
            </span>`;

        const descHTML = p.descripcion
            ? `<p class="inv-desc">${p.descripcion}</p>` : '';

        return `
        <div class="inv-item">
            <img class="inv-thumb"
                 src="${foto || fotoFallback}"
                 alt="${p.nombre}"
                 onerror="this.src='${fotoFallback}'">
            <div class="inv-info">
                <div class="inv-fila-top">
                    <h3 class="inv-nombre">${p.nombre}</h3>
                    <div class="inv-acciones">
                        <button class="inv-btn-accion" onclick="abrirFormProducto('${p.id}')" title="Editar">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="inv-btn-accion inv-btn-eliminar" onclick="confirmarEliminar('${p.id}')" title="Eliminar">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                ${meta ? `<p class="inv-meta">${meta}</p>` : ''}
                ${descHTML}
                <div class="inv-tallas-row">${tallasHTML}</div>
                <div class="inv-fila-bottom">
                    <p class="inv-precio">$ ${(p.precio || 0).toLocaleString('es-AR')}</p>
                </div>
            </div>
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filtrarInv(cat) {
    filtroInvCategoria = cat;
    document.querySelectorAll('#vista-inventario .categorias-scroll .chip')
        .forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    renderizarInventario();
}

function renderizarStockGrid(categoria, stockActual) {
    const contenedor = document.getElementById('inv-stock-grid');
    if (!contenedor) return;
    const talles = TALLES_POR_CATEGORIA[categoria] || ['S', 'M', 'L', 'XL'];
    contenedor.innerHTML = talles.map(t => `
        <div class="inv-stock-item">
            <span>${t}</span>
            <input type="number"
                   id="inv-stock-${t}"
                   min="0"
                   value="${(stockActual && stockActual[t] !== undefined) ? stockActual[t] : 0}">
        </div>`).join('');
}

function abrirFormProducto(id) {
    productoEditandoId = id;
    const titulo = document.getElementById('form-titulo');

    if (id) {
        const p = listaPrendasGlobal.find(prod => prod.id === id);
        if (!p) return;
        if (titulo) titulo.textContent = 'Editar producto';
        const stockPorTalla = p.stockPorTalla || {};
        const color = Array.isArray(p.colores) ? p.colores.join(', ') : (p.colores || '');
        document.getElementById('inv-nombre').value    = p.nombre    || '';
        document.getElementById('inv-precio').value    = p.precio    || '';
        document.getElementById('inv-categoria').value = p.categoria || '';
        document.getElementById('inv-color').value     = color;
        document.getElementById('inv-foto').value      = p.foto_url || p.imagen || '';
        renderizarStockGrid(p.categoria, stockPorTalla);
    } else {
        if (titulo) titulo.textContent = 'Agregar producto';
        document.getElementById('form-inventario-producto').reset();
        renderizarStockGrid('', {});
    }

    navegarA('vista-form-producto');
}

function guardarProducto(e) {
    e.preventDefault();

    const nombre    = (document.getElementById('inv-nombre')?.value    || '').trim();
    const precio    = parseFloat(document.getElementById('inv-precio')?.value);
    const categoria = document.getElementById('inv-categoria')?.value  || '';
    const colorRaw  = (document.getElementById('inv-color')?.value     || '').trim();
    const foto      = (document.getElementById('inv-foto')?.value      || '').trim();

    if (!nombre || isNaN(precio) || !categoria) {
        alert('Completá los campos obligatorios: nombre, precio y categoría.');
        return;
    }

    const colores = colorRaw
        ? colorRaw.split(',').map(c => c.trim()).filter(Boolean)
        : [];

    // Leer stock desde los inputs dinámicos según la categoría del producto
    const tallesCat = TALLES_POR_CATEGORIA[categoria] || ['S', 'M', 'L', 'XL'];
    const stockPorTalla = {};
    tallesCat.forEach(t => {
        stockPorTalla[t] = parseInt(document.getElementById(`inv-stock-${t}`)?.value) || 0;
    });
    const tallas = tallesCat.filter(t => stockPorTalla[t] > 0);
    const stock  = tallesCat.reduce((s, t) => s + stockPorTalla[t], 0);

    const datos = { nombre, precio, categoria, colores, foto_url: foto, stockPorTalla, tallas, stock };

    const btn = document.getElementById('btn-guardar-producto');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    const operacion = productoEditandoId
        ? db.collection('productos').doc(productoEditandoId).update(datos)
        : db.collection('productos').add({
              ...datos,
              likes: 0,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

    operacion
        .then(() => navegarA('vista-inventario', { silencioso: true }))
        .catch(err => alert('Error al guardar: ' + err.message))
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = 'Guardar producto'; }
        });
}

function confirmarEliminar(id) {
    productoAEliminar = id;
    const p = listaPrendasGlobal.find(prod => prod.id === id);
    const el = document.getElementById('confirmar-nombre-producto');
    if (el) el.textContent = p ? `¿Eliminar "${p.nombre}"?` : '¿Eliminar este producto?';
    navegarA('vista-confirmar-eliminar');
}

function eliminarProducto() {
    if (!productoAEliminar) return;
    const btn = document.querySelector('#vista-confirmar-eliminar .btn-danger');
    if (btn) { btn.disabled = true; btn.textContent = 'Eliminando...'; }

    db.collection('productos').doc(productoAEliminar).delete()
        .then(() => {
            productoAEliminar = null;
            navegarA('vista-inventario', { silencioso: true });
        })
        .catch(err => alert('Error al eliminar: ' + err.message))
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = 'Sí, eliminar'; }
        });
}

// =====================================================================
// 8. FLUJO DE VENTA — ETAPA 3
// =====================================================================

// Talles por defecto según categoría (se usan cuando el producto no tiene tallas cargadas)
const TALLES_POR_CATEGORIA = {
    'Remeras':    ['S', 'M', 'L', 'XL'],
    'Camperas':   ['S', 'M', 'L', 'XL'],
    'Buzos':      ['S', 'M', 'L', 'XL'],
    'Pantalones': ['36', '38', '40', '42', '44'],
    'Shorts':     ['36', '38', '40', '42', '44'],
};

// Mapa de nombres de color → hex para los selectores de color
const COLORES_HEX = {
    negro: '#1E1E1E', blanco: '#F5F5F5', gris: '#9E9E9E',
    rojo: '#FF6677', rosa: '#FFDFDF', verde: '#4CAF50',
    azul: '#2196F3', amarillo: '#FFC107', naranja: '#FF9800',
    terracota: '#C1694F', bordo: '#8B0000', bordó: '#8B0000',
    celeste: '#87CEEB', chocolate: '#7B4F2E', beige: '#F5F0E8',
    lila: '#CE93D8', violeta: '#673AB7', turquesa: '#00BCD4',
    coral: '#FF6B6B', crema: '#FFFDD0', mostaza: '#FFDB58',
};

function obtenerHexColor(nombre) {
    const key = (nombre || '').toLowerCase().trim();
    return COLORES_HEX[key] || '#CCCCCC';
}

// ----- Entrada al flujo de venta -----

function iniciarVenta() {
    filtroVentaCategoria = 'Todos';
    terminoVentaBusqueda = '';
    const inputBusq = document.getElementById('venta-busqueda');
    if (inputBusq) inputBusq.value = '';
    document.querySelectorAll('#vista-seleccionar-producto .categorias-scroll .chip')
        .forEach((c, i) => c.classList.toggle('active', i === 0));
    renderizarSelectorProductos();
    navegarA('vista-seleccionar-producto');
}

// ----- Lista de productos en modo venta -----

function renderizarSelectorProductos() {
    const lista = document.getElementById('venta-lista');
    if (!lista) return;

    const filtrados = listaPrendasGlobal.filter(p => {
        const pasaCat  = filtroVentaCategoria === 'Todos' || p.categoria === filtroVentaCategoria;
        const nombre   = (p.nombre || '').toLowerCase();
        const pasaBusq = terminoVentaBusqueda === '' || nombre.includes(terminoVentaBusqueda);
        return pasaCat && pasaBusq;
    });

    if (filtrados.length === 0) {
        lista.innerHTML = '<p class="cargando" style="text-align:center;padding:30px 0;">No hay productos disponibles.</p>';
        return;
    }

    const fotoFallback = 'https://placehold.co/56x56/FFDFDF/5A5A5A?text=Sin+Foto';
    lista.innerHTML = filtrados.map(p => {
        const foto = obtenerFotoProducto(p);
        return `
        <div class="venta-item" onclick="abrirProducto('${p.id}')">
            <img class="venta-thumb"
                 src="${foto || fotoFallback}"
                 alt="${p.nombre}"
                 onerror="this.src='${fotoFallback}'">
            <div class="venta-info">
                <h3 class="venta-nombre">${p.nombre}</h3>
                <p class="venta-cat">${p.categoria || ''}</p>
            </div>
            <p class="venta-precio">$ ${(p.precio || 0).toLocaleString('es-AR')}</p>
        </div>`;
    }).join('');
}

function filtrarVenta(cat) {
    filtroVentaCategoria = cat;
    document.querySelectorAll('#vista-seleccionar-producto .categorias-scroll .chip')
        .forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    renderizarSelectorProductos();
}

// ----- Card de producto (detalle + selectores) -----

function abrirProducto(id) {
    const p = listaPrendasGlobal.find(prod => prod.id === id);
    if (!p) return;

    productoActual    = p;
    tallaSeleccionada  = null;
    colorSeleccionado  = null;
    cantidadSeleccionada = 1;

    const foto        = obtenerFotoProducto(p);
    const fotoFallback = 'https://placehold.co/400x220/FFDFDF/5A5A5A?text=Sin+Foto';

    // Determinar colores disponibles
    const colores = Array.isArray(p.colores)
        ? p.colores.filter(Boolean)
        : (p.colores ? [p.colores] : []);

    // Determinar talles disponibles.
    // La categoría define el FORMATO de talles (S/M/L/XL o 36-44).
    // Si stockPorTalla existe pero sus claves no coinciden con el formato esperado
    // (ej: Pantalón con claves S/M/L/XL), se ignoran y se muestran los talles de categoría.
    const stockPorTalla   = p.stockPorTalla || null;
    const tallasArr       = Array.isArray(p.tallas) ? p.tallas : [];
    const tallesEsperados = TALLES_POR_CATEGORIA[p.categoria] || null;
    let tallasDisponibles;
    let sinStock = false;

    if (stockPorTalla && tallesEsperados) {
        // Mostrar SIEMPRE todos los talles de la categoría, independientemente del stock.
        // El stock 0 no oculta el talle; el botón "Sin stock" se activa solo si TODOS
        // los talles esperados fueron cargados explícitamente con stock = 0.
        tallasDisponibles = tallesEsperados;
        const conStock             = tallesEsperados.filter(t => (stockPorTalla[t] || 0) > 0);
        const clavesCorrectas      = tallesEsperados.every(t => t in stockPorTalla);
        sinStock = conStock.length === 0 && clavesCorrectas;
    } else if (stockPorTalla) {
        // Categoría sin talles definidos en TALLES_POR_CATEGORIA: usar stockPorTalla directo
        const conStock = Object.keys(stockPorTalla).filter(t => (stockPorTalla[t] || 0) > 0);
        if (conStock.length > 0) {
            tallasDisponibles = conStock;
        } else {
            sinStock = true;
            tallasDisponibles = [];
        }
    } else if (tallasArr.length > 0) {
        tallasDisponibles = tallasArr;
    } else {
        tallasDisponibles = tallesEsperados || ['S', 'M', 'L', 'XL'];
    }

    // HTML de selectores
    const coloresHTML = colores.length > 0 ? `
        <div class="producto-seccion">
            <p class="producto-seccion-label">Color:</p>
            <div class="producto-colores">
                ${colores.map(c => `
                    <button class="producto-color-circulo"
                            style="background-color:${obtenerHexColor(c)}"
                            data-color="${c}"
                            onclick="seleccionarColor('${c}', this)"
                            title="${c}"></button>`).join('')}
            </div>
        </div>` : '';

    const tallasHTML = tallasDisponibles.length > 0 ? `
        <div class="producto-seccion">
            <p class="producto-seccion-label">Talle:</p>
            <div class="producto-talles">
                ${tallasDisponibles.map(t => `
                    <button class="producto-talle-chip"
                            data-talle="${t}"
                            onclick="seleccionarTalla('${t}', this)">${t}</button>`).join('')}
            </div>
        </div>` : '';

    const contenido = document.getElementById('producto-contenido');
    if (!contenido) return;

    contenido.innerHTML = `
        <img class="producto-imagen"
             src="${foto || fotoFallback}"
             alt="${p.nombre}"
             onerror="this.src='${fotoFallback}'">
        <div class="producto-detalles">
            <div class="producto-fila-top">
                <h2 class="producto-nombre">${p.nombre}</h2>
                <p class="producto-precio">$ ${(p.precio || 0).toLocaleString('es-AR')}</p>
            </div>
            ${p.descripcion ? `<p class="producto-desc">${p.descripcion}</p>` : ''}
            ${p.categoria    ? `<p class="producto-cat"><i data-lucide="tag"></i>${p.categoria}</p>` : ''}
            ${coloresHTML}
            ${tallasHTML}
            <div class="producto-seccion">
                <p class="producto-seccion-label">Cantidad:</p>
                <div class="producto-cantidad">
                    <button class="cantidad-btn" onclick="cambiarCantidad(-1)">−</button>
                    <span id="cantidad-display" class="cantidad-num">1</span>
                    <button class="cantidad-btn" onclick="cambiarCantidad(1)">+</button>
                </div>
            </div>
        </div>
        <button class="btn-agregar-carrito btn-con-icono"
                onclick="agregarAlCarritoVenta()"
                ${sinStock ? 'disabled' : ''}>
            <i data-lucide="shopping-cart"></i>
            ${sinStock ? 'Sin stock disponible' : 'Agregar al carrito'}
        </button>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    navegarA('vista-producto');
}

function seleccionarTalla(talla, btn) {
    tallaSeleccionada = talla;
    document.querySelectorAll('.producto-talle-chip').forEach(c => c.classList.remove('activo'));
    btn.classList.add('activo');
}

function seleccionarColor(color, btn) {
    colorSeleccionado = color;
    document.querySelectorAll('.producto-color-circulo').forEach(c => c.classList.remove('activo'));
    btn.classList.add('activo');
}

function cambiarCantidad(delta) {
    cantidadSeleccionada = Math.max(1, cantidadSeleccionada + delta);
    const display = document.getElementById('cantidad-display');
    if (display) display.textContent = cantidadSeleccionada;
}

function agregarAlCarritoVenta() {
    if (!productoActual) return;

    const colores = Array.isArray(productoActual.colores)
        ? productoActual.colores.filter(Boolean)
        : (productoActual.colores ? [productoActual.colores] : []);

    // Todos los productos tienen selector de talle (por stockPorTalla, tallas[] o categoría)
    if (!tallaSeleccionada) {
        alert('Seleccioná un talle antes de agregar al carrito.');
        return;
    }
    if (colores.length > 0 && !colorSeleccionado) {
        alert('Seleccioná un color antes de agregar al carrito.');
        return;
    }

    carritoVenta.push({
        cartId:   Date.now() + Math.random(),
        id:       productoActual.id,
        nombre:   productoActual.nombre,
        precio:   productoActual.precio,
        talla:    tallaSeleccionada  || '',
        color:    colorSeleccionado  || '',
        cantidad: cantidadSeleccionada,
        foto:     obtenerFotoProducto(productoActual),
    });

    sincronizarCarritoVenta();
    renderizarCarritoVenta();
    navegarA('vista-carrito-venta');
}

// ----- Carrito de venta -----

function sincronizarCarritoVenta() {
    localStorage.setItem('moniarquia_carrito_venta', JSON.stringify(carritoVenta));
}

function quitarDelCarritoVenta(cartId) {
    carritoVenta = carritoVenta.filter(i => i.cartId !== cartId);
    sincronizarCarritoVenta();
    renderizarCarritoVenta();
}

function renderizarCarritoVenta() {
    const lista   = document.getElementById('carrito-venta-lista');
    const totalEl = document.getElementById('carrito-venta-total');
    if (!lista) return;

    if (carritoVenta.length === 0) {
        lista.innerHTML = `
            <div class="carrito-venta-vacio">
                <p>El carrito está vacío.</p>
                <button class="btn-outline" style="margin-top:12px;width:auto;padding:10px 20px;"
                        onclick="navegarA('vista-seleccionar-producto')">
                    Agregar productos
                </button>
            </div>`;
        if (totalEl) totalEl.textContent = '$ 0';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const fotoFallback = 'https://placehold.co/52x52/FFDFDF/5A5A5A?text=Sin+Foto';
    lista.innerHTML = carritoVenta.map(i => {
        const infoParts = [];
        if (i.talla)    infoParts.push(`Talle ${i.talla}`);
        if (i.color)    infoParts.push(`Color: ${i.color}`);
        infoParts.push(`Cantidad: ${i.cantidad}`);
        const subtotal = (i.precio || 0) * (i.cantidad || 1);
        return `
        <div class="carrito-venta-item">
            <img class="carrito-venta-thumb"
                 src="${i.foto || fotoFallback}"
                 alt="${i.nombre}"
                 onerror="this.src='${fotoFallback}'">
            <div class="carrito-venta-info">
                <div class="carrito-venta-fila-top">
                    <h4 class="carrito-venta-nombre">${i.nombre}</h4>
                    <button class="inv-btn-accion inv-btn-eliminar"
                            onclick="quitarDelCarritoVenta(${i.cartId})" title="Quitar">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                <p class="carrito-venta-meta">${infoParts.join(' · ')}</p>
                <p class="carrito-venta-precio">$ ${subtotal.toLocaleString('es-AR')}</p>
            </div>
        </div>`;
    }).join('');

    const total = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
    if (totalEl) totalEl.textContent = '$ ' + total.toLocaleString('es-AR');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function siguienteDesdeCarrito() {
    if (carritoVenta.length === 0) {
        alert('El carrito está vacío. Agregá al menos un producto.');
        return;
    }
    navegarA('vista-asociar-cliente');
}

// ----- Pantalla de método de pago -----

function irAMetodoPago() {
    renderizarResumenVenta();
    actualizarSeccionClienteEnPago();
    navegarA('vista-metodo-pago', { silencioso: true });
}

// =====================================================================
// 9. CLIENTES — ETAPA 4
// =====================================================================

function renderizarListaClientes(contenedorId, modoSeleccion) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    const inputId = modoSeleccion ? 'seleccionar-busqueda' : 'clientes-busqueda';
    const termino = (document.getElementById(inputId)?.value || '').toLowerCase();

    const filtrados = listClientesGlobal.filter(c =>
        (c.nombre || '').toLowerCase().includes(termino)
    );

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p class="cargando" style="text-align:center;padding:20px 0;">No hay clientes registrados.</p>';
        return;
    }

    const onclick = modoSeleccion
        ? id => `seleccionarClienteParaVenta('${id}')`
        : id => `abrirDetalleCliente('${id}')`;

    contenedor.innerHTML = filtrados.map(c => {
        const inicial = (c.nombre || '?')[0].toUpperCase();
        return `
        <div class="cliente-item" onclick="${onclick(c.id)}">
            <div class="cliente-avatar">${inicial}</div>
            <div class="cliente-info">
                <p class="cliente-nombre">${c.nombre || ''}</p>
                <p class="cliente-dato">${c.telefono || c.email || ''}</p>
            </div>
            <i data-lucide="chevron-right" class="cliente-chevron"></i>
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function irAClientes() {
    const input = document.getElementById('clientes-busqueda');
    if (input) input.value = '';
    renderizarListaClientes('clientes-lista', false);
    navegarA('vista-clientes');
    cerrarMenu();
}

function irASeleccionarCliente() {
    const input = document.getElementById('seleccionar-busqueda');
    if (input) input.value = '';
    renderizarListaClientes('seleccionar-lista', true);
    navegarA('vista-seleccionar-cliente');
}

function seleccionarClienteParaVenta(id) {
    const c = listClientesGlobal.find(cl => cl.id === id);
    if (!c) return;
    clienteSeleccionado = c;
    actualizarSeccionClienteEnPago();
    irAMetodoPago();
}

function actualizarSeccionClienteEnPago() {
    const wrap = document.getElementById('pago-cliente-wrap');
    if (!wrap) return;

    if (clienteSeleccionado) {
        const inicial = (clienteSeleccionado.nombre || '?')[0].toUpperCase();
        wrap.innerHTML = `
            <div class="cliente-avatar">${inicial}</div>
            <div class="pago-cliente-info">
                <p class="pago-cliente-nombre">${clienteSeleccionado.nombre}</p>
                <p class="pago-cliente-dato">${clienteSeleccionado.telefono || clienteSeleccionado.email || ''}</p>
            </div>
            <button class="pago-btn-cambiar" onclick="irASeleccionarCliente()">Cambiar cliente</button>`;
    } else {
        wrap.innerHTML = `
            <div class="pago-cliente-avatar">
                <i data-lucide="user"></i>
            </div>
            <div class="pago-cliente-info">
                <p class="pago-cliente-nombre">Sin cliente asociado</p>
                <p class="pago-cliente-dato">Venta anónima</p>
            </div>
            <button class="pago-btn-cambiar" onclick="irASeleccionarCliente()">Cambiar cliente</button>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function irAAgregarCliente(origen) {
    origenAgregarCliente = origen || 'venta';
    const form = document.getElementById('form-agregar-cliente');
    if (form) form.reset();
    navegarA('vista-agregar-cliente');
}

function guardarCliente(e) {
    e.preventDefault();

    const nombre   = (document.getElementById('cli-nombre')?.value || '').trim();
    const telefono = (document.getElementById('cli-telefono')?.value || '').trim();
    const email    = (document.getElementById('cli-email')?.value || '').trim();

    if (!nombre) {
        alert('El nombre del cliente es obligatorio.');
        return;
    }

    const btn = document.getElementById('btn-guardar-cliente');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    db.collection('clientes').add({
        nombre,
        telefono,
        email,
        deudaTotal: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(docRef => {
        if (origenAgregarCliente === 'venta') {
            clienteSeleccionado = { id: docRef.id, nombre, telefono, email, deudaTotal: 0 };
        }
        navegarA('vista-cliente-agregado', { silencioso: true });
    })
    .catch(err => alert('Error al guardar cliente: ' + err.message))
    .finally(() => {
        if (btn) { btn.disabled = false; btn.textContent = 'Agregar'; }
    });
}

function continuarTrasAgregarCliente() {
    if (origenAgregarCliente === 'venta') {
        actualizarSeccionClienteEnPago();
        irAMetodoPago();
    } else {
        volverAtras(); // pop vista-agregar-cliente → vuelve a vista-clientes
    }
}

// =====================================================================
// 10. REGISTRO DE VENTAS Y MÉTODOS DE PAGO — ETAPA 4
// =====================================================================

function seleccionarMetodoPago(metodo) {
    metodoPagoActual = metodo;

    if (metodo === 'cuenta_corriente') {
        if (!clienteSeleccionado) {
            alert('La cuenta corriente requiere un cliente asociado.\nSeleccioná un cliente primero.');
            irASeleccionarCliente();
            return;
        }
        const total = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
        const totalLabel = document.getElementById('deuda-total-label');
        const inputMonto = document.getElementById('deuda-monto-abonado');
        const deudaEl   = document.getElementById('deuda-calculada');
        if (totalLabel) totalLabel.textContent = '$ ' + total.toLocaleString('es-AR');
        if (inputMonto) inputMonto.value = 0;
        if (deudaEl)    deudaEl.textContent = '$ ' + total.toLocaleString('es-AR');
        navegarA('vista-registrar-deuda');
        return;
    }

    // Efectivo y Mercado Pago
    const total = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
    const labelEl = document.getElementById('confirmar-pago-metodo');
    const totalEl = document.getElementById('confirmar-pago-total');
    const descEl  = document.getElementById('confirmar-pago-desc');

    if (labelEl) labelEl.textContent = metodo === 'efectivo' ? 'Efectivo' : 'Mercado Pago';
    if (totalEl) totalEl.textContent = '$ ' + total.toLocaleString('es-AR');
    if (descEl)  descEl.textContent  = metodo === 'efectivo'
        ? 'Confirmá que recibiste el pago en efectivo.'
        : 'Confirmá que recibiste el pago por Mercado Pago. El cobro se realizó por fuera de la app.';

    navegarA('vista-confirmar-pago');
}

function actualizarDeudaCalculada() {
    const total      = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
    const montoInput = parseFloat(document.getElementById('deuda-monto-abonado')?.value) || 0;
    const monto      = Math.max(0, Math.min(montoInput, total));
    const deuda      = total - monto;
    const el         = document.getElementById('deuda-calculada');
    if (el) el.textContent = '$ ' + deuda.toLocaleString('es-AR');
}

function confirmarPagoSimple() {
    const total = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
    registrarVenta({ metodoPago: metodoPagoActual, montoAbonado: total, deuda: 0, estado: 'completada' });
}

function confirmarDeuda() {
    const total   = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
    const monto   = Math.max(0, parseFloat(document.getElementById('deuda-monto-abonado')?.value) || 0);
    const deuda   = Math.max(0, total - monto);

    if (monto > total) {
        alert('El monto abonado no puede superar el total de la venta.');
        return;
    }

    registrarVenta({ metodoPago: 'cuenta_corriente', montoAbonado: monto, deuda, estado: 'deuda' });
}

function registrarVenta({ metodoPago, montoAbonado, deuda, estado }) {
    const total = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);

    const btnConfirmar = document.getElementById('btn-confirmar-pago');
    const btnDeuda     = document.getElementById('btn-confirmar-deuda');
    const btnActivo    = btnConfirmar || btnDeuda;
    if (btnActivo) { btnActivo.disabled = true; btnActivo.textContent = 'Registrando...'; }

    const ventaData = {
        clienteId: clienteSeleccionado?.id || null,
        items: carritoVenta.map(i => ({
            productoId:     i.id,
            nombre:         i.nombre,
            talla:          i.talla  || '',
            color:          i.color  || '',
            cantidad:       i.cantidad,
            precioUnitario: i.precio,
            subtotal:       i.precio * i.cantidad
        })),
        total,
        metodoPago,
        estado,
        montoAbonado,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Usamos batch para atomicidad: venta + stock + (deuda si aplica)
    const batch   = db.batch();
    const ventaRef = db.collection('ventas').doc();
    batch.set(ventaRef, ventaData);

    // Descontar stock por cada ítem del carrito
    carritoVenta.forEach(item => {
        const prodRef = db.collection('productos').doc(item.id);
        const upd = { stock: firebase.firestore.FieldValue.increment(-item.cantidad) };
        if (item.talla) {
            upd[`stockPorTalla.${item.talla}`] = firebase.firestore.FieldValue.increment(-item.cantidad);
        }
        batch.update(prodRef, upd);
    });

    // Cuenta corriente: registrar deuda y actualizar saldo del cliente
    if (metodoPago === 'cuenta_corriente' && clienteSeleccionado && deuda > 0) {
        const deudaRef = db.collection('cuentaCorriente').doc();
        batch.set(deudaRef, {
            clienteId:   clienteSeleccionado.id,
            tipo:        'deuda',
            monto:       deuda,
            descripcion: 'Venta registrada',
            ventaId:     ventaRef.id,
            fecha:       firebase.firestore.FieldValue.serverTimestamp()
        });
        const cliRef = db.collection('clientes').doc(clienteSeleccionado.id);
        batch.update(cliRef, {
            deudaTotal: firebase.firestore.FieldValue.increment(deuda)
        });
    }

    batch.commit()
        .then(() => {
            // Limpiar estado post-venta
            carritoVenta = [];
            sincronizarCarritoVenta();
            renderizarCarritoVenta();
            const montoDeuda = deuda || 0;
            clienteSeleccionado = null;
            metodoPagoActual    = null;

            if (metodoPago === 'cuenta_corriente') {
                const montoEl = document.getElementById('deuda-registrada-monto');
                if (montoEl) montoEl.textContent = '$ ' + montoDeuda.toLocaleString('es-AR');
                navegarA('vista-deuda-registrada', { silencioso: true });
            } else {
                navegarA('vista-pago-registrado', { silencioso: true });
            }
        })
        .catch(err => {
            alert('Error al registrar la venta: ' + err.message);
            if (btnActivo) {
                btnActivo.disabled = false;
                btnActivo.textContent = metodoPago === 'cuenta_corriente' ? 'Registrar deuda' : 'Confirmar pago';
            }
        });
}

function nuevaVenta() {
    historialNavegacion = [];    // reset completo: empieza un flujo nuevo
    carritoVenta = [];
    sincronizarCarritoVenta();
    renderizarCarritoVenta();
    clienteSeleccionado = null;
    metodoPagoActual    = null;
    iniciarVenta();
}

// =====================================================================
// 11. CUENTA CORRIENTE Y DETALLE DE CLIENTE — ETAPA 6
// =====================================================================

let clienteActual           = null;
let movimientosClienteActual = [];
let ventasClienteActual     = [];
let ventasPorId             = {}; // caché de ventas indexadas por ID
let unsubscribeMovimientos  = null;

function abrirDetalleCliente(id) {
    const c = listClientesGlobal.find(cl => cl.id === id);
    if (!c) return;
    clienteActual = c;

    // Limpiar suscripción anterior
    if (unsubscribeMovimientos) {
        unsubscribeMovimientos();
        unsubscribeMovimientos = null;
    }

    // Suscripción en tiempo real a los movimientos de este cliente
    unsubscribeMovimientos = db.collection('cuentaCorriente')
        .where('clienteId', '==', id)
        .onSnapshot(snapshot => {
            movimientosClienteActual = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            movimientosClienteActual.sort((a, b) => {
                const fa = a.fecha?.toDate?.() || new Date(0);
                const fb = b.fecha?.toDate?.() || new Date(0);
                return fb - fa;
            });
            renderizarMovimientos();
            renderizarDetalleCliente(); // actualiza saldo si el detalle está visible
        }, err => console.error('Error movimientos:', err));

    renderizarDetalleCliente();
    navegarA('vista-detalle-cliente');
}

function renderizarDetalleCliente() {
    if (!clienteActual) return;

    // Refrescar desde el onSnapshot de clientes (siempre actualizado)
    const fresco = listClientesGlobal.find(c => c.id === clienteActual.id) || clienteActual;
    clienteActual = fresco;

    const deuda   = fresco.deudaTotal || 0;
    const inicial = (fresco.nombre || '?')[0].toUpperCase();

    const avatarEl  = document.getElementById('detalle-avatar');
    const nombreEl  = document.getElementById('detalle-nombre');
    const telEl     = document.getElementById('detalle-telefono');
    const emailEl   = document.getElementById('detalle-email');
    const saldoEl   = document.getElementById('detalle-saldo');
    const btnPagoEl = document.getElementById('btn-registrar-pago');

    if (avatarEl)  avatarEl.textContent  = inicial;
    if (nombreEl)  nombreEl.textContent  = fresco.nombre   || '-';
    if (telEl)     telEl.textContent     = fresco.telefono || '';
    if (emailEl)   emailEl.textContent   = fresco.email    || '';

    if (saldoEl) {
        saldoEl.textContent = '$ ' + deuda.toLocaleString('es-AR');
        saldoEl.className   = 'detalle-saldo ' + (deuda > 0 ? 'detalle-saldo--deuda' : 'detalle-saldo--ok');
    }
    if (btnPagoEl) btnPagoEl.disabled = deuda <= 0;
}

function abrirHistorialCliente() {
    if (!clienteActual) return;
    const el = document.getElementById('historial-cliente-nombre');
    if (el) el.textContent = clienteActual.nombre || '';

    const lista = document.getElementById('historial-lista');
    if (lista) lista.innerHTML = '<p class="cargando" style="text-align:center;padding:24px 0;">Cargando movimientos...</p>';

    navegarA('vista-historial-cliente');

    // Pre-fetchar ventas referenciadas antes de renderizar
    cargarVentasParaMovimientos().then(() => renderizarMovimientos());
}

function cargarVentasParaMovimientos() {
    const idsNecesarios = movimientosClienteActual
        .filter(m => m.tipo === 'deuda' && m.ventaId && !ventasPorId[m.ventaId])
        .map(m => m.ventaId);

    if (idsNecesarios.length === 0) return Promise.resolve();

    return Promise.all(idsNecesarios.map(id => db.collection('ventas').doc(id).get()))
        .then(docs => {
            docs.forEach(doc => {
                if (doc.exists) ventasPorId[doc.id] = { id: doc.id, ...doc.data() };
            });
        })
        .catch(err => console.error('Error al cargar ventas para movimientos:', err));
}

function renderizarMovimientos() {
    const lista = document.getElementById('historial-lista');
    if (!lista) return;

    if (movimientosClienteActual.length === 0) {
        lista.innerHTML = '<p class="cargando" style="text-align:center;padding:24px 0;">Sin movimientos registrados.</p>';
        return;
    }

    lista.innerHTML = movimientosClienteActual.map(m => {
        const esDeuda = m.tipo === 'deuda';
        const signo   = esDeuda ? '−' : '+';
        const clase   = esDeuda ? 'mov-deuda' : 'mov-pago';
        const icono   = esDeuda ? 'trending-down' : 'trending-up';
        const fecha   = m.fecha?.toDate?.()
            ? m.fecha.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';

        // Card enriquecida para deudas con ventaId
        let detalleHTML = '';
        if (esDeuda && m.ventaId && ventasPorId[m.ventaId]) {
            const venta    = ventasPorId[m.ventaId];
            const productos = (venta.items || []).map(i => i.nombre).join(', ');
            const total    = (venta.total || 0).toLocaleString('es-AR');
            const abonado  = (venta.montoAbonado || 0).toLocaleString('es-AR');
            const adeudado = (m.monto || 0).toLocaleString('es-AR');
            detalleHTML = `
                ${productos ? `<p class="mov-productos">${productos}</p>` : ''}
                <div class="mov-detalle-venta">
                    <span>Total venta: <strong>$ ${total}</strong></span>
                    <span>Abonado: <strong>$ ${abonado}</strong></span>
                    <span class="mov-adeudado">Adeudado: <strong>$ ${adeudado}</strong></span>
                </div>`;
        }

        return `
        <div class="mov-item ${clase}">
            <div class="mov-icono"><i data-lucide="${icono}"></i></div>
            <div class="mov-info">
                <p class="mov-desc">${m.descripcion || (esDeuda ? 'Deuda' : 'Pago')}</p>
                <p class="mov-fecha">${fecha}</p>
                ${detalleHTML}
            </div>
            <p class="mov-monto">${signo} $ ${(m.monto || 0).toLocaleString('es-AR')}</p>
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function abrirHistorialCompras() {
    if (!clienteActual) return;
    const el = document.getElementById('compras-cliente-nombre');
    if (el) el.textContent = clienteActual.nombre || '';

    const lista = document.getElementById('compras-lista');
    if (lista) lista.innerHTML = '<p class="cargando" style="text-align:center;padding:24px 0;">Cargando compras...</p>';

    navegarA('vista-historial-compras');

    db.collection('ventas')
        .where('clienteId', '==', clienteActual.id)
        .get()
        .then(snapshot => {
            ventasClienteActual = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            ventasClienteActual.sort((a, b) => {
                const fa = a.fecha?.toDate?.() || new Date(0);
                const fb = b.fecha?.toDate?.() || new Date(0);
                return fb - fa;
            });
            renderizarVentasCliente();
        })
        .catch(err => {
            if (lista) lista.innerHTML = '<p class="cargando" style="text-align:center;padding:24px 0;">Error al cargar compras.</p>';
            console.error('Error compras:', err);
        });
}

function renderizarVentasCliente() {
    const lista = document.getElementById('compras-lista');
    if (!lista) return;

    // Poblar el caché para que "Ver movimientos" ya tenga los datos
    ventasClienteActual.forEach(v => { ventasPorId[v.id] = v; });

    if (ventasClienteActual.length === 0) {
        lista.innerHTML = '<p class="cargando" style="text-align:center;padding:24px 0;">Sin compras registradas.</p>';
        return;
    }

    const METODO = { efectivo: 'Efectivo', mercadopago: 'Mercado Pago', cuenta_corriente: 'Cta. cte.' };

    lista.innerHTML = ventasClienteActual.map(v => {
        const fecha   = v.fecha?.toDate?.()
            ? v.fecha.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        const metodo  = METODO[v.metodoPago] || v.metodoPago || '—';
        const itemsStr = (v.items || []).map(i => `${i.nombre} x${i.cantidad}`).join(', ');
        return `
        <div class="compra-item">
            <div class="compra-info">
                <p class="compra-fecha">${fecha} · ${metodo}</p>
                <p class="compra-items">${itemsStr || '—'}</p>
            </div>
            <p class="compra-total">$ ${(v.total || 0).toLocaleString('es-AR')}</p>
        </div>`;
    }).join('');
}

function abrirRegistrarPago() {
    if (!clienteActual) return;

    const fresco = listClientesGlobal.find(c => c.id === clienteActual.id) || clienteActual;
    clienteActual = fresco;
    const deuda  = fresco.deudaTotal || 0;

    if (deuda <= 0) {
        alert('Este cliente no tiene deuda pendiente.');
        return;
    }

    const nombreEl  = document.getElementById('pago-cc-nombre');
    const saldoEl   = document.getElementById('pago-saldo-actual');
    const restEl    = document.getElementById('pago-saldo-restante');
    const montoInput = document.getElementById('pago-monto');

    if (nombreEl)   nombreEl.textContent  = fresco.nombre || '';
    if (saldoEl)    saldoEl.textContent   = '$ ' + deuda.toLocaleString('es-AR');
    if (montoInput) montoInput.value      = deuda;         // default: pago total
    if (restEl)     restEl.textContent    = '$ 0';         // saldo restante si paga todo

    navegarA('vista-registrar-pago');
}

function actualizarSaldoRestante() {
    const fresco  = listClientesGlobal.find(c => c.id === clienteActual?.id) || clienteActual;
    const deuda   = fresco?.deudaTotal || 0;
    const monto   = Math.max(0, parseFloat(document.getElementById('pago-monto')?.value) || 0);
    const restante = Math.max(0, deuda - monto);
    const el = document.getElementById('pago-saldo-restante');
    if (el) el.textContent = '$ ' + restante.toLocaleString('es-AR');
}

function guardarPagoCliente(e) {
    e.preventDefault();
    if (!clienteActual) return;

    const fresco  = listClientesGlobal.find(c => c.id === clienteActual.id) || clienteActual;
    const deuda   = fresco.deudaTotal || 0;
    const monto   = parseFloat(document.getElementById('pago-monto')?.value) || 0;

    if (monto <= 0) {
        alert('El monto debe ser mayor a $0.');
        return;
    }
    if (monto > deuda) {
        alert(`El monto no puede superar el saldo pendiente de $ ${deuda.toLocaleString('es-AR')}.`);
        return;
    }

    const montoPago = Math.min(monto, deuda); // clampeado por seguridad

    const btn = document.getElementById('btn-guardar-pago');
    if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }

    const batch  = db.batch();

    const pagoRef = db.collection('cuentaCorriente').doc();
    batch.set(pagoRef, {
        clienteId:   clienteActual.id,
        tipo:        'pago',
        monto:       montoPago,
        descripcion: 'Pago registrado',
        fecha:       firebase.firestore.FieldValue.serverTimestamp()
    });

    const cliRef = db.collection('clientes').doc(clienteActual.id);
    batch.update(cliRef, {
        deudaTotal: firebase.firestore.FieldValue.increment(-montoPago)
    });

    batch.commit()
        .then(() => {
            const saldoRestante = Math.max(0, deuda - montoPago);
            const descEl = document.getElementById('pago-ok-desc');
            if (descEl) {
                descEl.textContent = saldoRestante > 0
                    ? `Pago de $ ${montoPago.toLocaleString('es-AR')} registrado. Saldo restante: $ ${saldoRestante.toLocaleString('es-AR')}.`
                    : `Pago de $ ${montoPago.toLocaleString('es-AR')} registrado. La deuda quedó saldada.`;
            }
            navegarA('vista-pago-cliente-ok', { silencioso: true });
        })
        .catch(err => alert('Error al registrar pago: ' + err.message))
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = 'Confirmar pago'; }
        });
}

function volverAlDetalleCliente() {
    renderizarDetalleCliente();
    volverAtras();  // pop vista-registrar-pago → vuelve a vista-detalle-cliente
}

function renderizarResumenVenta() {
    const lista   = document.getElementById('pago-resumen-items');
    const totalEl = document.getElementById('pago-total');
    if (!lista) return;

    if (carritoVenta.length === 0) {
        lista.innerHTML = '<p style="font-size:12px;color:var(--gris);">Sin productos.</p>';
        if (totalEl) totalEl.textContent = '$ 0';
        return;
    }

    const fotoFallback = 'https://placehold.co/44x44/FFDFDF/5A5A5A?text=Sin+Foto';
    lista.innerHTML = carritoVenta.map(i => {
        const metaParts = [];
        if (i.talla)  metaParts.push(`Talle: ${i.talla}`);
        if (i.color)  metaParts.push(`Color: ${i.color}`);
        metaParts.push(`Cantidad: ${i.cantidad}`);
        const subtotal = (i.precio || 0) * (i.cantidad || 1);
        return `
        <div class="pago-resumen-item">
            <img class="pago-resumen-thumb"
                 src="${i.foto || fotoFallback}"
                 alt="${i.nombre}"
                 onerror="this.src='${fotoFallback}'">
            <div class="pago-resumen-info">
                <p class="pago-resumen-nombre">${i.nombre}</p>
                <p class="pago-resumen-meta">${metaParts.join(' · ')}</p>
            </div>
            <p class="pago-resumen-precio">$ ${subtotal.toLocaleString('es-AR')}</p>
        </div>`;
    }).join('');

    const total = carritoVenta.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
    if (totalEl) totalEl.textContent = '$ ' + total.toLocaleString('es-AR');
}

// =====================================================================
// 12. CAMBIOS Y DEVOLUCIONES — ETAPA 7
// =====================================================================

let ventasCambiosGlobal   = [];
let ventaSeleccionada     = null;
let itemCambio            = null;
let talleCambioNuevo      = null;
let mostrarTodasVentas    = false;
let terminoBusquedaCambio = '';

function irACambios() {
    ventaSeleccionada      = null;
    itemCambio             = null;
    talleCambioNuevo       = null;
    mostrarTodasVentas     = false;
    terminoBusquedaCambio  = '';
    const input = document.getElementById('cambios-busqueda');
    if (input) input.value = '';
    navegarA('vista-cambios');
    cerrarMenu();
    cargarVentasParaCambios();
}

function cargarVentasParaCambios() {
    const lista = document.getElementById('cambios-ventas-lista');
    if (lista) lista.innerHTML = '<p class="cargando" style="text-align:center;padding:12px 0;">Cargando ventas recientes...</p>';

    db.collection('ventas').get()
        .then(snapshot => {
            ventasCambiosGlobal = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const fa = a.fecha?.toDate?.() || new Date(0);
                    const fb = b.fecha?.toDate?.() || new Date(0);
                    return fb - fa;
                });
            renderizarVentasCambio();
        })
        .catch(err => {
            const lista = document.getElementById('cambios-ventas-lista');
            if (lista) lista.innerHTML = '<p class="cargando" style="text-align:center;">Error al cargar ventas.</p>';
            console.error('Error cargando ventas para cambios:', err);
        });
}

function buscarVentaCambio() {
    const input = document.getElementById('cambios-busqueda');
    terminoBusquedaCambio = (input?.value || '').toLowerCase().trim();
    mostrarTodasVentas    = false;
    renderizarVentasCambio();
}

function verTodasLasVentas() {
    mostrarTodasVentas = true;
    renderizarVentasCambio();
}

function renderizarVentasCambio() {
    const lista = document.getElementById('cambios-ventas-lista');
    if (!lista) return;

    const termino = terminoBusquedaCambio;
    let filtradas = ventasCambiosGlobal;

    if (termino) {
        filtradas = ventasCambiosGlobal.filter(v => {
            const cliente = listClientesGlobal.find(c => c.id === v.clienteId);
            const nombre  = (cliente?.nombre || '').toLowerCase();
            const ticket  = v.id.slice(-6).toLowerCase();
            return nombre.includes(termino) || ticket.includes(termino);
        });
    }

    const mostrar = (mostrarTodasVentas || termino) ? filtradas : filtradas.slice(0, 5);

    if (mostrar.length === 0) {
        lista.innerHTML = '<p class="cargando" style="text-align:center;padding:12px 0;">No se encontraron ventas.</p>';
        return;
    }

    lista.innerHTML = mostrar.map(v => {
        const cliente  = listClientesGlobal.find(c => c.id === v.clienteId);
        const nombre   = cliente?.nombre || 'Venta anónima';
        const inicial  = nombre[0].toUpperCase();
        const ticket   = '#' + v.id.slice(-6).toUpperCase();
        const fecha    = v.fecha?.toDate?.()
            ? v.fecha.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        return `
        <div class="cliente-item" onclick="seleccionarVentaParaCambio('${v.id}')">
            <div class="cliente-avatar">${inicial}</div>
            <div class="cliente-info">
                <p class="cliente-nombre">${nombre}</p>
                <p class="cliente-dato">${ticket} — ${fecha}</p>
            </div>
            <p class="cambio-venta-monto">$ ${(v.total || 0).toLocaleString('es-AR')}</p>
            <i data-lucide="chevron-right" class="cliente-chevron"></i>
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function seleccionarVentaParaCambio(id) {
    const venta = ventasCambiosGlobal.find(v => v.id === id);
    if (!venta) return;
    ventaSeleccionada = venta;
    renderizarItemsVentaCambio();
    navegarA('vista-items-venta');
}

function renderizarItemsVentaCambio() {
    const lista = document.getElementById('items-venta-lista');
    if (!lista || !ventaSeleccionada) return;

    const items = ventaSeleccionada.items || [];
    if (items.length === 0) {
        lista.innerHTML = '<p class="cargando" style="text-align:center;padding:24px 0;">Esta venta no tiene productos registrados.</p>';
        return;
    }

    lista.innerHTML = items.map((item, idx) => {
        const tieneTalle  = !!(item.talla && item.talla.trim());
        const clsDis      = !tieneTalle ? 'cambio-item-disabled' : '';
        const onclick     = tieneTalle ? `onclick="seleccionarItemParaCambio(${idx})"` : '';
        const metaLinea   = [
            item.talla  ? `Talle: ${item.talla}` : '',
            item.color  ? `Color: ${item.color}` : ''
        ].filter(Boolean).join(' · ');
        return `
        <div class="cambio-item ${clsDis}" ${onclick}>
            <div class="cambio-item-info">
                <p class="cambio-item-nombre">${item.nombre || '—'}</p>
                ${metaLinea ? `<p class="cambio-item-meta">${metaLinea}</p>` : ''}
                ${!tieneTalle ? '<p class="cambio-item-nota">Sin talle registrado — no disponible para cambio</p>' : ''}
            </div>
            ${tieneTalle ? '<i data-lucide="chevron-right" class="cliente-chevron"></i>' : ''}
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function seleccionarItemParaCambio(idx) {
    const item = ventaSeleccionada?.items?.[idx];
    if (!item || !item.talla) return;

    itemCambio        = { ...item };
    talleCambioNuevo  = null;

    const nombreEl   = document.getElementById('talle-cambio-producto-nombre');
    const actualEl   = document.getElementById('talle-cambio-actual');
    const contenedor = document.getElementById('talle-cambio-contenido');

    if (nombreEl)   nombreEl.textContent   = item.nombre || '—';
    if (actualEl)   actualEl.textContent   = item.talla;
    if (contenedor) contenedor.innerHTML   = '<p class="cargando" style="text-align:center;padding:16px 0;">Cargando talles disponibles...</p>';

    navegarA('vista-seleccionar-talle');

    db.collection('productos').doc(item.productoId).get()
        .then(doc => {
            if (!doc.exists) {
                if (contenedor) contenedor.innerHTML = '<p class="cargando" style="text-align:center;">Producto no encontrado en el inventario.</p>';
                return;
            }
            const stockPorTalla = doc.data().stockPorTalla;
            if (!stockPorTalla) {
                if (contenedor) contenedor.innerHTML = '<p class="cargando" style="text-align:center;">Este producto no tiene stock por talle registrado.</p>';
                return;
            }

            const disponibles = Object.entries(stockPorTalla)
                .filter(([t, stock]) => stock > 0 && t !== item.talla)
                .map(([t, stock]) => ({ talle: t, stock }));

            if (disponibles.length === 0) {
                if (contenedor) contenedor.innerHTML = '<p class="cargando" style="text-align:center;">No hay otros talles disponibles en stock para este producto.</p>';
                return;
            }

            if (contenedor) {
                contenedor.innerHTML = `
                    <p style="font-size:13px;color:var(--gris);margin-bottom:10px;">Seleccioná el nuevo talle:</p>
                    <div class="producto-talles">
                        ${disponibles.map(({ talle, stock }) => `
                            <button class="producto-talle-chip"
                                    onclick="seleccionarTalleNuevo('${talle}')">
                                ${talle}
                            </button>`).join('')}
                    </div>`;
            }
        })
        .catch(err => {
            if (contenedor) contenedor.innerHTML = '<p class="cargando" style="text-align:center;">Error al cargar los talles.</p>';
            console.error('Error talles cambio:', err);
        });
}

function seleccionarTalleNuevo(talle) {
    talleCambioNuevo = talle;

    document.querySelectorAll('#talle-cambio-contenido .producto-talle-chip')
        .forEach(c => c.classList.toggle('activo', c.textContent.trim() === talle));

    renderizarConfirmarCambio();
    navegarA('vista-confirmar-cambio');
}

function renderizarConfirmarCambio() {
    const productoEl = document.getElementById('confirmar-cambio-producto');
    const desdeEl    = document.getElementById('confirmar-cambio-desde');
    const haciaEl    = document.getElementById('confirmar-cambio-hacia');
    const clienteEl  = document.getElementById('confirmar-cambio-cliente');

    if (productoEl) productoEl.textContent = itemCambio?.nombre     || '—';
    if (desdeEl)    desdeEl.textContent    = itemCambio?.talla      || '—';
    if (haciaEl)    haciaEl.textContent    = talleCambioNuevo       || '—';

    const cliente = listClientesGlobal.find(c => c.id === ventaSeleccionada?.clienteId);
    if (clienteEl) clienteEl.textContent   = cliente?.nombre || 'Venta anónima';

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function ejecutarCambio() {
    // Validaciones previas
    if (!itemCambio?.talla || !talleCambioNuevo || !itemCambio?.productoId) {
        alert('Datos incompletos para realizar el cambio.');
        return;
    }
    if (talleCambioNuevo === itemCambio.talla) {
        alert('El talle nuevo debe ser diferente al talle actual.');
        return;
    }

    const btn = document.getElementById('btn-confirmar-cambio');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

    // Re-verificar stock antes del commit (evita race conditions)
    db.collection('productos').doc(itemCambio.productoId).get()
        .then(doc => {
            if (!doc.exists) throw new Error('Producto no encontrado en el inventario.');

            const stockPorTalla = doc.data().stockPorTalla;
            if (!stockPorTalla) throw new Error('El producto no tiene stock por talle registrado.');

            const stockNuevo = stockPorTalla[talleCambioNuevo] ?? 0;
            if (stockNuevo <= 0) throw new Error(`El talle ${talleCambioNuevo} ya no tiene stock disponible.`);

            const batch   = db.batch();
            const prodRef = db.collection('productos').doc(itemCambio.productoId);

            // Sumar 1 al talle devuelto, restar 1 al talle nuevo
            batch.update(prodRef, {
                [`stockPorTalla.${itemCambio.talla}`]:  firebase.firestore.FieldValue.increment(1),
                [`stockPorTalla.${talleCambioNuevo}`]:  firebase.firestore.FieldValue.increment(-1)
            });

            // Registrar el cambio en /cambios
            const cambioRef = db.collection('cambios').doc();
            batch.set(cambioRef, {
                ventaId:        ventaSeleccionada.id,
                productoId:     itemCambio.productoId,
                nombreProducto: itemCambio.nombre   || '',
                talleDevuelto:  itemCambio.talla,
                talleNuevo:     talleCambioNuevo,
                clienteId:      ventaSeleccionada.clienteId || null,
                fecha:          firebase.firestore.FieldValue.serverTimestamp()
            });

            return batch.commit();
        })
        .then(() => {
            navegarA('vista-cambio-realizado', { silencioso: true });
        })
        .catch(err => {
            alert(err.message || 'Error al registrar el cambio.');
        })
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = 'Confirmar cambio'; }
        });
}

// =====================================================================
// 12b. ESCANEO DE PRODUCTO (cámara simulada)
// =====================================================================

function abrirEscaneo() {
    navegarA('vista-escanear');
    // Limpiar estado anterior antes de iniciar
    const estadoEl = document.getElementById('escaner-estado');
    const videoEl  = document.getElementById('escaner-video');
    if (estadoEl) { estadoEl.textContent = ''; estadoEl.style.display = 'none'; }
    if (videoEl)  videoEl.style.display = 'block';
    iniciarCamara();
}

function iniciarCamara() {
    const videoEl = document.getElementById('escaner-video');
    if (!videoEl) return;

    if (!navigator.mediaDevices?.getUserMedia) {
        mostrarErrorCamara('Tu dispositivo no soporta acceso a la cámara desde esta app.');
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
        .then(stream => {
            streamCamara = stream;
            videoEl.srcObject = stream;
        })
        .catch(err => {
            console.error('Cámara — error:', err.name, err.message);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                mostrarErrorCamara('Permiso de cámara denegado.\nPodés buscar el producto manualmente.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                mostrarErrorCamara('No se encontró una cámara en este dispositivo.');
            } else {
                mostrarErrorCamara('No se pudo acceder a la cámara.\nPodés buscar el producto manualmente.');
            }
        });
}

function mostrarErrorCamara(mensaje) {
    const videoEl  = document.getElementById('escaner-video');
    const estadoEl = document.getElementById('escaner-estado');
    if (videoEl)  videoEl.style.display = 'none';
    if (estadoEl) { estadoEl.textContent = mensaje; estadoEl.style.display = 'flex'; }
}

function detenerCamara() {
    if (streamCamara) {
        streamCamara.getTracks().forEach(t => t.stop());
        streamCamara = null;
    }
    const videoEl = document.getElementById('escaner-video');
    if (videoEl) videoEl.srcObject = null;
}

function buscarManualmente() {
    detenerCamara();
    iniciarVenta();
}

function reiniciarCambios() {
    ventaSeleccionada     = null;
    itemCambio            = null;
    talleCambioNuevo      = null;
    mostrarTodasVentas    = false;
    terminoBusquedaCambio = '';
    historialNavegacion   = [];
    const input = document.getElementById('cambios-busqueda');
    if (input) input.value = '';
    navegarA('vista-cambios', { silencioso: true });
    cargarVentasParaCambios();
}