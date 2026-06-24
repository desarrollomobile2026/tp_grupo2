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

// Estado del flujo de venta (Etapa 3)
let carritoVenta = JSON.parse(localStorage.getItem('moniarquia_carrito_venta')) || [];
let productoActual = null;
let tallaSeleccionada = null;
let colorSeleccionado = null;
let cantidadSeleccionada = 1;
let filtroVentaCategoria = 'Todos';
let terminoVentaBusqueda = '';

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

function navegarA(vistaId) {
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
    // Actualiza data-vista para controlar estilos contextuales (ej: color del header)
    document.getElementById('app-container')?.setAttribute('data-vista', vistaId);
}

function volverAtras() {
    navegarA('vista-home');
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
        .then(() => navegarA('vista-inventario'))
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
            navegarA('vista-inventario');
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
    navegarA('vista-metodo-pago');
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