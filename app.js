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

        const total = TALLAS_INV.reduce((s, t) => s + (stockPorTalla[t] || 0), 0);
        const tallasHTML = TALLAS_INV.map(t => `
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
        document.getElementById('inv-stock-s').value   = stockPorTalla.S  ?? 0;
        document.getElementById('inv-stock-m').value   = stockPorTalla.M  ?? 0;
        document.getElementById('inv-stock-l').value   = stockPorTalla.L  ?? 0;
        document.getElementById('inv-stock-xl').value  = stockPorTalla.XL ?? 0;
    } else {
        if (titulo) titulo.textContent = 'Agregar producto';
        document.getElementById('form-inventario-producto').reset();
        ['inv-stock-s','inv-stock-m','inv-stock-l','inv-stock-xl']
            .forEach(idCampo => { document.getElementById(idCampo).value = 0; });
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
    const stockS    = parseInt(document.getElementById('inv-stock-s')?.value)  || 0;
    const stockM    = parseInt(document.getElementById('inv-stock-m')?.value)  || 0;
    const stockL    = parseInt(document.getElementById('inv-stock-l')?.value)  || 0;
    const stockXL   = parseInt(document.getElementById('inv-stock-xl')?.value) || 0;

    if (!nombre || isNaN(precio) || !categoria) {
        alert('Completá los campos obligatorios: nombre, precio y categoría.');
        return;
    }

    const colores = colorRaw
        ? colorRaw.split(',').map(c => c.trim()).filter(Boolean)
        : [];
    const stockPorTalla = { S: stockS, M: stockM, L: stockL, XL: stockXL };
    const tallas = Object.keys(stockPorTalla).filter(t => stockPorTalla[t] > 0);
    const stock  = stockS + stockM + stockL + stockXL;

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