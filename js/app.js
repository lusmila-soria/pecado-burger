// ============ SELECCIÓN DE ELEMENTOS DEL DOM (querySelector) ============

const contenedorProductos = document.querySelector("#contenedorProductos");
const sinResultados       = document.querySelector("#sinResultados");
const listaCarrito        = document.querySelector("#listaCarrito");
const totalCarrito        = document.querySelector("#totalCarrito");
const contadorCarrito     = document.querySelector("#contadorCarrito");
const contadorFavoritos   = document.querySelector("#contadorFavoritos");
const filtroCategoria     = document.querySelector("#filtroCategoria");
const soloFavoritos       = document.querySelector("#soloFavoritos");
const btnFavoritos        = document.querySelector("#btnFavoritos");
const btnTema             = document.querySelector("#btnTema");
const btnVaciar           = document.querySelector("#btnVaciar");
const btnFinalizar        = document.querySelector("#btnFinalizar");
const formCheckout        = document.querySelector("#formCheckout");
const toastContainer      = document.querySelector("#toastContainer");
const carritoOffcanvas    = document.querySelector("#carritoOffcanvas");
const checkoutModal       = document.querySelector("#checkoutModal");
const campoDireccion      = document.querySelector("#campoDireccion");
const inputDireccion      = document.querySelector("#inputDireccion");


// ============ ESTADO DE LA APLICACIÓN Y PERSISTENCIA ============

let carrito   = [];
let favoritos = new Set();

const STORAGE = {
  CARRITO:   "pecado_carrito",
  FAVORITOS: "pecado_favoritos",
  TEMA:      "pecado_tema"
};

function cargarCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(STORAGE.CARRITO));
    carrito = Array.isArray(datos) ? datos : [];
  } catch {
    carrito = [];
  }
}
function guardarCarrito() {
  localStorage.setItem(STORAGE.CARRITO, JSON.stringify(carrito));
}

function cargarFavoritos() {
  try {
    const datos = JSON.parse(localStorage.getItem(STORAGE.FAVORITOS));
    favoritos = new Set(Array.isArray(datos) ? datos : []);
  } catch {
    favoritos = new Set();
  }
}
function guardarFavoritos() {
  localStorage.setItem(STORAGE.FAVORITOS, JSON.stringify([...favoritos]));
}

function formatoPrecio(numero) {
  return "$" + numero.toLocaleString("es-AR");
}

function precioUnitario(item) {
  return item.precioBase;
}


// ============ RENDER DEL CATÁLOGO ============

function cardProducto(p) {
  const esFavorito = favoritos.has(p.id);
  const etiquetaHTML = p.etiqueta
    ? `<span class="etiqueta-card">${p.etiqueta}</span>`
    : "";

  return `
  <div class="col-12 col-sm-6 col-lg-3">
    <div class="card card-producto h-100 shadow-sm position-relative">
      ${etiquetaHTML}
      <img src="${p.imagen}" alt="${p.nombre}" class="card-img-top" loading="lazy" />
      <div class="card-body d-flex flex-column">
        <span class="badge text-bg-secondary mb-2 align-self-start">${p.categoria}</span>
        <h5 class="card-title h6">${p.nombre}</h5>
        <p class="card-text small text-muted flex-grow-1">${p.descripcion}</p>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <span class="card-precio">${formatoPrecio(p.precio)}</span>
          <button class="btn btn-favorito border-0 fs-5 ${esFavorito ? "active" : ""}"
                  data-action="favorito" data-id="${p.id}" title="Favorito" aria-label="Favorito">
            <i class="bi ${esFavorito ? "bi-heart-fill" : "bi-heart"}"></i>
          </button>
        </div>
        <button class="btn btn-pecado w-100 mt-2" data-action="agregar" data-id="${p.id}">
          <i class="bi bi-cart-plus"></i> Agregar
        </button>
      </div>
    </div>
  </div>`;
}

// Filtra por categoría y favoritos (sin buscador)
function renderProductos() {
  const cat   = filtroCategoria.value;

  const lista = productos.filter((p) => {
    const coincideCat   = !cat || p.categoria === cat;
    const coincideFav   = !soloFavoritos.checked || favoritos.has(p.id);
    return coincideCat && coincideFav;
  });

  contenedorProductos.innerHTML = lista.map(cardProducto).join("");
  sinResultados.classList.toggle("d-none", lista.length > 0);
}

function cargarCategorias() {
  const categorias = [...new Set(productos.map((p) => p.categoria))];
  categorias.forEach((c) => {
    const opcion = document.createElement("option");
    opcion.value = c;
    opcion.textContent = c;
    filtroCategoria.appendChild(opcion);
  });
}


// ============ CARRITO ============

function generarKey(productoId) {
  return `${productoId}`;
}

function agregarAlCarrito(id) {
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;

  const key  = generarKey(id);
  const item = carrito.find((i) => i.key === key);

  if (item) {
    item.cantidad++;
  } else {
    carrito.push({
      key,
      productoId: id,
      nombre: producto.nombre,
      precioBase: producto.precio,
      cantidad: 1,
      imagen: producto.imagen
    });
  }

  guardarCarrito();
  renderCarrito();
  mostrarToast(`<strong>${producto.nombre}</strong> agregado al pedido.`);
}

function aumentarCantidad(key) {
  const item = carrito.find((i) => i.key === key);
  if (item) item.cantidad++;
  guardarCarrito();
  renderCarrito();
}

function disminuirCantidad(key) {
  const item = carrito.find((i) => i.key === key);
  if (!item) return;
  if (item.cantidad > 1) {
    item.cantidad--;
  } else {
    carrito = carrito.filter((i) => i.key !== key);
  }
  guardarCarrito();
  renderCarrito();
}

function eliminarDelCarrito(key) {
  carrito = carrito.filter((i) => i.key !== key);
  guardarCarrito();
  renderCarrito();
  mostrarToast("Producto eliminado del pedido.", "error");
}

function vaciarCarrito() {
  if (carrito.length === 0) return;
  carrito = [];
  guardarCarrito();
  renderCarrito();
  mostrarToast("Pedido vaciado.", "error");
}

function itemCarritoHTML(item) {
  const unitario = precioUnitario(item);
  const subtotal = unitario * item.cantidad;

  return `
  <div class="item-carrito d-flex gap-2 align-items-center">
    <img src="${item.imagen}" alt="${item.nombre}" />
    <div class="flex-grow-1">
      <div class="fw-semibold small">${item.nombre}</div>
      <div class="text-muted small">${formatoPrecio(unitario)} c/u</div>
      <div class="cantidad-control mt-1">
        <button class="btn btn-sm btn-outline-secondary" data-action="disminuir" data-key="${item.key}" aria-label="Disminuir">
          <i class="bi bi-dash"></i>
        </button>
        <span class="fw-bold px-1">${item.cantidad}</span>
        <button class="btn btn-sm btn-outline-secondary" data-action="aumentar" data-key="${item.key}" aria-label="Aumentar">
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>
    </div>
    <div class="text-end">
      <div class="fw-bold">${formatoPrecio(subtotal)}</div>
      <button class="btn btn-sm btn-outline-danger mt-1" data-action="eliminar" data-key="${item.key}" title="Eliminar" aria-label="Eliminar">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  </div>`;
}

function renderCarrito() {
  if (carrito.length === 0) {
    listaCarrito.innerHTML = `
      <div class="carrito-vacio">
        <i class="bi bi-bag-x fs-1 d-block mb-2"></i>
        Tu pedido está vacío. ¡Agregá algo rico!
      </div>`;
  } else {
    listaCarrito.innerHTML = carrito.map(itemCarritoHTML).join("");
  }

  const total = carrito.reduce((s, i) => s + precioUnitario(i) * i.cantidad, 0);
  totalCarrito.textContent = formatoPrecio(total);
  actualizarBadges();
}

function actualizarBadges() {
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
  contadorCarrito.textContent = totalItems;
  contadorCarrito.classList.toggle("d-none", totalItems === 0);

  contadorFavoritos.textContent = favoritos.size;
  contadorFavoritos.classList.toggle("d-none", favoritos.size === 0);
}


// ============ FAVORITOS ============

function toggleFavorito(id) {
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;

  if (favoritos.has(id)) {
    favoritos.delete(id);
    mostrarToast(`<strong>${producto.nombre}</strong> quitado de favoritos.`, "error");
  } else {
    favoritos.add(id);
    mostrarToast(`<strong>${producto.nombre}</strong> agregado a favoritos.`);
  }

  guardarFavoritos();
  renderProductos();
  actualizarBadges();
}


// ============ NOTIFICACIONES Y MODO OSCURO ============

function mostrarToast(mensaje, tipo = "exito") {
  const el = document.createElement("div");
  el.className = `toast align-items-center text-bg-${tipo === "error" ? "danger" : "success"} border-0`;
  el.setAttribute("role", "alert");
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>`;
  toastContainer.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 2500 });
  toast.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-bs-theme", tema);
  const icono = btnTema.querySelector("i");
  icono.className = tema === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
  localStorage.setItem(STORAGE.TEMA, tema);
}
function cargarTema() {
  const guardado = localStorage.getItem(STORAGE.TEMA);
  aplicarTema(guardado === "dark" ? "dark" : "light");
}


// ============ EVENTOS Y DELEGACIÓN ============

contenedorProductos.addEventListener("click", (e) => {
  const boton = e.target.closest("[data-action]");
  if (!boton) return;

  const id     = Number(boton.dataset.id);
  const accion = boton.dataset.action;

  if (accion === "agregar") {
    agregarAlCarrito(id);
  }
  if (accion === "favorito") toggleFavorito(id);
});

listaCarrito.addEventListener("click", (e) => {
  const boton = e.target.closest("[data-action]");
  if (!boton) return;
  const key    = boton.dataset.key;
  const accion = boton.dataset.action;

  if (accion === "aumentar")  aumentarCantidad(key);
  if (accion === "disminuir") disminuirCantidad(key);
  if (accion === "eliminar")  eliminarDelCarrito(key);
});

// Filtros de categoría y favoritos (sin buscador)
filtroCategoria.addEventListener("change", renderProductos);
soloFavoritos.addEventListener("change", renderProductos);

btnFavoritos.addEventListener("click", () => {
  soloFavoritos.checked = !soloFavoritos.checked;
  renderProductos();
  document.querySelector("#catalogo").scrollIntoView({ behavior: "smooth" });
});

btnTema.addEventListener("click", () => {
  const actual = document.documentElement.getAttribute("data-bs-theme");
  aplicarTema(actual === "dark" ? "light" : "dark");
});

btnVaciar.addEventListener("click", vaciarCarrito);

btnFinalizar.addEventListener("click", () => {
  if (carrito.length === 0) {
    mostrarToast("El pedido está vacío.", "error");
    return;
  }
  bootstrap.Offcanvas.getOrCreateInstance(carritoOffcanvas).hide();
  bootstrap.Modal.getOrCreateInstance(checkoutModal).show();
});

document.querySelectorAll('input[name="entrega"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const esDomicilio = document.querySelector("#entregaDomicilio").checked;
    campoDireccion.style.display = esDomicilio ? "block" : "none";
    inputDireccion.required = esDomicilio;
  });
});

formCheckout.addEventListener("submit", (e) => {
  e.preventDefault();
  formCheckout.classList.add("was-validated");

  if (!formCheckout.checkValidity()) {
    mostrarToast("Completá correctamente todos los campos.", "error");
    return;
  }

  const nombre = document.querySelector("#inputNombre").value.trim();

  carrito = [];
  guardarCarrito();
  renderCarrito();

  bootstrap.Modal.getOrCreateInstance(checkoutModal).hide();
  formCheckout.reset();
  formCheckout.classList.remove("was-validated");
  campoDireccion.style.display = "none";

  mostrarToast(`¡Gracias ${nombre}! Tu pedido de Pecado Burger fue confirmado.`);
});


// ============ INICIALIZACIÓN ============

function init() {
  cargarCarrito();
  cargarFavoritos();
  cargarTema();
  cargarCategorias();
  renderProductos();
  renderCarrito();
}

init();