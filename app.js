// app.js - Motor NoSQL en Tiempo Real (Moniarquía Indumentaria)

// =====================================================================
// 1. ESTADO GLOBAL (Memoria RAM + LocalStorage del usuario)
// =====================================================================
let carrito = JSON.parse(localStorage.getItem('moniarquia_cart_v1')) || [];
let listaPrendasGlobal = [];
let filtroCategoriaActual = "Todas";
let terminoBuscado = "";

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
    }, (error) => {
        console.error("Error al escuchar Firestore:", error);
    });

    // Poner a la lupa a escuchar el teclado
    const inputBuscador = document.getElementById('input-busqueda');
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            terminoBuscado = e.target.value.toLowerCase();
            renderizarCatalogo();
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