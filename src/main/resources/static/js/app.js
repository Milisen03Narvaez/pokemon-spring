/* =====================================================================
   app.js  -  Comportamiento de la página (parte "dinámica" de la Vista)
   Lo carga index.html al final del <body>.

   Qué hace y con qué se conecta:
   1) Buscador con retardo de 4 s  -> llama al ENDPOINT 2  (/api/pokemon/search)
   2) Botón "Cargar más"           -> llama al ENDPOINT 1  (/api/pokemon)
   3) Clic en una tarjeta          -> llama al ENDPOINT 3  (/api/pokemon/{id}) y abre el popup
   4) Botón "Regresar" / Esc       -> cierra el popup

   Todos los endpoints están en PokemonRestController.java.
   ===================================================================== */

// ---------- CONSTANTES (valores fijos que se pueden cambiar fácil) ----------
const RETARDO_BUSQUEDA_MS = 4000;   // 4 segundos de espera antes de buscar
const URL_API = "/api/pokemon";     // Prefijo de PokemonRestController
const TAMANO_PAGINA = 30;           // Debe coincidir con pokedex.page-size de application.properties

// Traducción de nombres de estadísticas (la API los da en inglés)
const NOMBRES_STATS = {
    "hp": "PS", "attack": "Ataque", "defense": "Defensa",
    "special-attack": "At. especial", "special-defense": "Def. especial", "speed": "Velocidad"
};

// ---------- REFERENCIAS A ELEMENTOS DEL HTML (los ids vienen de index.html) ----------
const buscador = document.getElementById("buscador");       // Caja de texto
const estado = document.getElementById("estado");           // Párrafo de mensajes
const grilla = document.getElementById("grilla");           // Contenedor de tarjetas
const btnMas = document.getElementById("btn-mas");          // Botón "Cargar más"
const modal = document.getElementById("modal");             // Popup completo
const btnRegresar = document.getElementById("btn-regresar");// Botón Regresar
const modalError = document.getElementById("modal-error");  // Error del popup
const modalCuerpo = document.getElementById("modal-cuerpo");// Contenido del popup

// ---------- ESTADO (variables que cambian mientras se usa la página) ----------
let temporizador = null;                     // Guarda el "reloj" del retardo para poder cancelarlo
let offsetActual = Number(btnMas.dataset.offset); // Desde dónde pedir la siguiente página (viene de Thymeleaf)

// =====================================================================
// FUNCIONES AUXILIARES
// =====================================================================

// Pone la primera letra en mayúscula: "pikachu" -> "Pikachu"
function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Rellena con ceros: 25 -> "#025"
function formatearNumero(id) {
    return "#" + String(id).padStart(3, "0");
}

// Muestra un mensaje bajo el buscador
function mostrarEstado(texto) {
    estado.textContent = texto;
}

// Pide JSON a un endpoint; si la respuesta es un error, lanza una excepción con el mensaje
async function pedirJson(url) {
    const respuesta = await fetch(url);                 // Llamada HTTP al backend
    const datos = await respuesta.json();               // Convierte el cuerpo a objeto JS
    if (!respuesta.ok) {                                // Códigos 400/502 vienen de ManejadorErrores
        throw new Error(datos.error || "Error inesperado");
    }
    return datos;                                       // Devuelve el JSON
}

// =====================================================================
// TARJETAS
// =====================================================================

// Crea una tarjeta (igual a la que pinta Thymeleaf en index.html) para un PokemonResumen
function crearTarjeta(pokemon) {
    const tarjeta = document.createElement("article");  // <article>
    tarjeta.className = "tarjeta";                       // Clase de styles.css
    tarjeta.dataset.id = pokemon.id;                     // Guarda el id (lo usa el clic -> ENDPOINT 3)
    tarjeta.tabIndex = 0;                                // Permite enfocarla con teclado

    const numero = document.createElement("span");       // Número
    numero.className = "tarjeta__numero";
    numero.textContent = formatearNumero(pokemon.id);

    const imagen = document.createElement("img");        // Imagen
    imagen.className = "tarjeta__imagen";
    imagen.src = pokemon.imageUrl;
    imagen.alt = pokemon.name;
    imagen.loading = "lazy";

    const nombre = document.createElement("h2");         // Nombre
    nombre.className = "tarjeta__nombre";
    nombre.textContent = capitalizar(pokemon.name);      // textContent evita inyección de HTML

    tarjeta.append(numero, imagen, nombre);              // Arma la tarjeta
    return tarjeta;
}

// Dibuja una lista de tarjetas; si "reemplazar" es true, borra las anteriores
function pintarTarjetas(lista, reemplazar) {
    if (reemplazar) grilla.replaceChildren();            // Vacía la grilla
    lista.forEach(p => grilla.appendChild(crearTarjeta(p))); // Agrega cada tarjeta
}

// Muestra u oculta el botón "Cargar más"
function mostrarBotonMas(visible) {
    btnMas.classList.toggle("oculto", !visible);
}

// =====================================================================
// 1) ENDPOINT 1: lista por páginas ("Cargar más" y volver a la lista inicial)
// =====================================================================
async function cargarPagina(offset, reemplazar) {
    try {
        // GET /api/pokemon?offset=..&limit=..
        const pagina = await pedirJson(`${URL_API}?offset=${offset}&limit=${TAMANO_PAGINA}`);
        pintarTarjetas(pagina.resultados, reemplazar);   // Dibuja las tarjetas
        offsetActual = pagina.siguienteOffset;           // Recuerda dónde seguir
        mostrarBotonMas(pagina.hayMas);                  // Oculta el botón si ya no hay más
        mostrarEstado("");                               // Limpia mensajes
    } catch (error) {
        mostrarEstado(error.message);                    // Muestra el error al usuario
    }
}

// =====================================================================
// 2) ENDPOINT 2: búsqueda con retardo de 4 segundos
// =====================================================================
async function ejecutarBusqueda(texto) {
    try {
        mostrarEstado("Buscando...");
        // GET /api/pokemon/search?q=texto   (encodeURIComponent protege caracteres especiales)
        const resultados = await pedirJson(`${URL_API}/search?q=${encodeURIComponent(texto)}`);
        pintarTarjetas(resultados, true);                // Reemplaza las tarjetas por los resultados
        mostrarBotonMas(false);                          // En búsqueda no se usa "Cargar más"
        mostrarEstado(resultados.length === 0
            ? "Sin resultados. Prueba con otro nombre o número."
            : `${resultados.length} resultado(s).`);
    } catch (error) {
        mostrarEstado(error.message);
    }
}

// Cada vez que el usuario escribe, se reinicia el reloj de 4 segundos
buscador.addEventListener("input", () => {
    clearTimeout(temporizador);                          // Cancela el reloj anterior
    const texto = buscador.value.trim();                 // Texto sin espacios sobrantes

    if (texto === "") {                                  // Si borró todo, vuelve a la lista inicial
        cargarPagina(0, true);                           // (sin esperar los 4 s)
        return;
    }

    mostrarEstado("Buscando en 4 segundos... (Enter para buscar ya)");
    // setTimeout ejecuta la búsqueda SOLO si pasan 4 s sin escribir nada más
    temporizador = setTimeout(() => ejecutarBusqueda(texto), RETARDO_BUSQUEDA_MS);
});

// Atajo: con Enter se busca de inmediato
buscador.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && buscador.value.trim() !== "") {
        clearTimeout(temporizador);                      // Cancela la espera
        ejecutarBusqueda(buscador.value.trim());         // Busca ya
    }
});

// Botón "Cargar más": pide la siguiente página y la AGREGA (reemplazar = false)
btnMas.addEventListener("click", () => cargarPagina(offsetActual, false));

// =====================================================================
// 3) ENDPOINT 3: detalle en POPUP al seleccionar una tarjeta
// =====================================================================

// Abre el popup y carga los datos del Pokémon con ese id
async function abrirDetalle(id) {
    modal.classList.remove("oculto");                    // Muestra el popup
    modalError.classList.add("oculto");                  // Oculta errores anteriores
    modalCuerpo.classList.add("oculto");                 // Oculta contenido viejo mientras carga
    btnRegresar.focus();                                 // Lleva el foco al botón Regresar

    try {
        // GET /api/pokemon/{id}
        const d = await pedirJson(`${URL_API}/${id}`);
        rellenarModal(d);                                // Escribe los datos en el popup
        modalCuerpo.classList.remove("oculto");          // Muestra el contenido
    } catch (error) {
        modalError.textContent = error.message;          // Muestra el error dentro del popup
        modalError.classList.remove("oculto");
    }
}

// Escribe en el popup los datos del PokemonDetalle recibido
function rellenarModal(d) {
    document.getElementById("modal-imagen").src = d.imageUrl;
    document.getElementById("modal-imagen").alt = d.name;
    document.getElementById("modal-numero").textContent = formatearNumero(d.id);
    document.getElementById("modal-nombre").textContent = capitalizar(d.name);
    document.getElementById("modal-descripcion").textContent = d.description;
    document.getElementById("modal-altura").textContent = d.heightMeters + " m";
    document.getElementById("modal-peso").textContent = d.weightKg + " kg";
    document.getElementById("modal-exp").textContent = d.baseExperience;
    document.getElementById("modal-habilidades").textContent = d.abilities.join(", ");

    // ----- Tipos: una etiqueta de color por cada tipo -----
    const contTipos = document.getElementById("modal-tipos");
    contTipos.replaceChildren();                         // Limpia los anteriores
    d.types.forEach(tipo => {
        const etiqueta = document.createElement("span");
        etiqueta.className = "tipo tipo--" + tipo;       // Ej. "tipo tipo--fire"
        etiqueta.textContent = tipo;
        contTipos.appendChild(etiqueta);
    });

    // ----- Estadísticas: una barra por cada stat -----
    const contStats = document.getElementById("modal-stats");
    contStats.replaceChildren();
    Object.entries(d.stats).forEach(([nombre, valor]) => {
        const fila = document.createElement("div");      // Fila de la estadística
        fila.className = "stat";

        const etiqueta = document.createElement("span"); // Nombre traducido
        etiqueta.textContent = NOMBRES_STATS[nombre] || nombre;

        const numero = document.createElement("strong"); // Valor numérico
        numero.textContent = valor;

        const barra = document.createElement("span");    // Fondo de la barra
        barra.className = "stat__barra";
        const relleno = document.createElement("span");  // Parte rellena
        relleno.className = "stat__relleno";
        relleno.style.width = Math.min(100, (valor / 255) * 100) + "%"; // 255 = valor máximo posible
        barra.appendChild(relleno);

        fila.append(etiqueta, numero, barra);
        contStats.appendChild(fila);
    });
}

// Cierra el popup (volver a la lista)
function cerrarModal() {
    modal.classList.add("oculto");
}

// Clic en una tarjeta. Usamos "delegación de eventos": UN solo listener en la grilla
// sirve para las tarjetas de Thymeleaf Y para las que crea JavaScript después.
grilla.addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest(".tarjeta");   // Busca la tarjeta clicada
    if (tarjeta) abrirDetalle(tarjeta.dataset.id);       // Toma su id -> ENDPOINT 3
});

// Misma acción con teclado (Enter sobre una tarjeta enfocada)
grilla.addEventListener("keydown", (evento) => {
    const tarjeta = evento.target.closest(".tarjeta");
    if (tarjeta && evento.key === "Enter") abrirDetalle(tarjeta.dataset.id);
});

// ---------- Formas de cerrar el popup ----------
btnRegresar.addEventListener("click", cerrarModal);      // Botón "Regresar"
document.addEventListener("keydown", (evento) => {       // Tecla Esc
    if (evento.key === "Escape") cerrarModal();
});
modal.addEventListener("click", (evento) => {             // Clic en el fondo oscuro
    if (evento.target === modal) cerrarModal();
});
