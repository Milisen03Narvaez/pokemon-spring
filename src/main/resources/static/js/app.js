/* =====================================================================
   app.js  -  Comportamiento de la página (parte "dinámica" de la Vista)
   Lo carga index.html al final del <body>.

   Qué hace y con qué se conecta:
   1) Buscador con retardo de 4 s  -> llama al ENDPOINT 2  (/api/pokemon/search)
   2) Botón "Cargar más"           -> llama al ENDPOINT 1  (/api/pokemon)
   3) Clic en una tarjeta          -> llama al ENDPOINT 3  (/api/pokemon/{id}) y abre el popup
   4) Botón "Regresar" / Esc       -> cierra el popup

   Todos los endpoints están en PokemonController.java.
   ===================================================================== */

// ---------- CONSTANTES (valores fijos que se pueden cambiar fácil) ----------
const RETARDO_BUSQUEDA_MS = 4000;   // 4 segundos de espera antes de buscar
const URL_API = "api/pokemon";   // Prefijo de los endpoints de PokemonController
const TAMANO_PAGINA = 30;           // Debe coincidir con pokedex.page-size de application.properties

// Traducción de nombres de estadísticas (la API los da en inglés)
const NOMBRES_STATS = {
    "hp": "PS", "attack": "Ataque", "defense": "Defensa",
    "special-attack": "At. especial", "special-defense": "Def. especial", "speed": "Velocidad"
};


// ---------- CLASES DE TAILWIND para lo que se crea con JavaScript ----------
// Deben ser iguales a las de las tarjetas que pinta Thymeleaf en index.html.
// Se escriben COMPLETAS (sin armarlas con + ) para que Tailwind las detecte siempre.
const CLASES_TARJETA = "bg-papel border border-linea rounded-xl p-4 text-center cursor-pointer " +
    "transition-[border-color,transform] duration-150 motion-reduce:transition-none " +
    "hover:border-rojo hover:-translate-y-[3px] " +
    "focus-visible:border-rojo focus-visible:-translate-y-[3px] focus-visible:outline-none";
const CLASES_NUMERO = "block text-tinta-suave text-[.85rem] text-left";
const CLASES_IMAGEN = "w-full max-w-[140px] aspect-square object-contain mx-auto";
const CLASES_NOMBRE = "mt-1 text-[1.05rem] font-bold";

// Etiqueta de tipo: base + color según el tipo (antes eran .tipo--fire, .tipo--water...)
const CLASES_TIPO = "px-3 py-[.15rem] rounded-full text-white text-[.85rem] ";
const COLORES_TIPO = {
    "fire": "bg-[#e8622c]",     "water": "bg-[#3b82d6]",    "grass": "bg-[#3f9b4a]",
    "electric": "bg-[#c99a00]", "psychic": "bg-[#d6457a]",  "ice": "bg-[#3fa7b5]",
    "dragon": "bg-[#5a4fd1]",   "dark": "bg-[#4a4350]",     "fairy": "bg-[#c46fb0]",
    "poison": "bg-[#8e4fb3]",   "ground": "bg-[#a77a3a]",   "rock": "bg-[#8c8458]",
    "bug": "bg-[#7a9a1f]",      "ghost": "bg-[#5c4f94]",    "steel": "bg-[#6f8795]",
    "fighting": "bg-[#b3422e]", "flying": "bg-[#6f8fd6]",   "normal": "bg-[#7f8794]"
};
const COLOR_TIPO_DEFECTO = "bg-[#6b7385]"; // Si aparece un tipo desconocido
// ---------- POPUPS ANIDADOS (niveles 2 y 3) ----------
// Cada nivel tiene tamaño (max-w), color (borde y insignia), posición (left/top) y z-index propios.
// Las clases van COMPLETAS (sin armarlas con +) para que Tailwind las detecte siempre.
const ESTILOS_NIVEL = {
    2: { fondo: "z-20",   // z-20 > z-10 del nivel 1: queda encima
        caja: "max-w-[440px] border-t-8 border-[#3b82d6] min-[561px]:left-6 min-[561px]:top-4",
        insignia: "bg-[#3b82d6]" },
    3: { fondo: "z-30",   // z-30 > z-20: queda encima del nivel 2
        caja: "max-w-[360px] border-t-8 border-[#c99a00] min-[561px]:left-12 min-[561px]:top-8",
        insignia: "bg-[#c99a00]" }
};
const CLASES_BOTON_ROJO = "bg-rojo text-white rounded-lg px-4 py-2 text-base cursor-pointer hover:bg-rojo-oscuro " +
    "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amarillo";
const CLASES_ERROR = "hidden bg-alerta-fondo text-alerta-texto border border-alerta-borde rounded-lg px-4 py-3 mb-3";

// PILA de popups extra abiertos: el último de la lista es el de más arriba.
// Al cerrar se hace pop() -> se vuelve al anterior (3 -> 2 -> 1).
const pilaPopups = [];
// Barras de estadísticas
const CLASES_STAT = "grid grid-cols-[110px_40px_1fr] items-center gap-2 mb-[.35rem] text-[.9rem]";
const CLASES_STAT_BARRA = "bg-fondo rounded-full h-2 overflow-hidden";
const CLASES_STAT_RELLENO = "block h-full bg-rojo"; // El ancho lo pone JavaScript abajo


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

// Crea una tarjeta (igual a la que pinta Thymeleaf en index.html) para un Pokemon (solo id, nombre e imagen)
function crearTarjeta(pokemon) {
    const tarjeta = document.createElement("article");  // <article>
    tarjeta.className = CLASES_TARJETA;                  // Clases de Tailwind
    tarjeta.dataset.id = pokemon.id;                     // Guarda el id (lo usa el clic -> ENDPOINT 3)
    tarjeta.tabIndex = 0;                                // Permite enfocarla con teclado

    const numero = document.createElement("span");       // Número
    numero.className = CLASES_NUMERO;
    numero.textContent = formatearNumero(pokemon.id);

    const imagen = document.createElement("img");        // Imagen
    imagen.className = CLASES_IMAGEN;
    imagen.src = pokemon.imageUrl;
    imagen.alt = pokemon.name;
    imagen.loading = "lazy";

    const nombre = document.createElement("h2");         // Nombre
    nombre.className = CLASES_NOMBRE;
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
    btnMas.classList.toggle("hidden", !visible);   // "hidden" = display:none de Tailwind
}

// =====================================================================
// 1) ENDPOINT 1: lista por páginas ("Cargar más" y volver a la lista inicial)
// =====================================================================
async function cargarPagina(offset, reemplazar) {
    try {
        // GET /api/pokemon?offset=..&limit=..   (devuelve directamente la lista de Pokémon)
        const lista = await pedirJson(`${URL_API}?offset=${offset}&limit=${TAMANO_PAGINA}`);
        pintarTarjetas(lista, reemplazar);               // Dibuja las tarjetas
        offsetActual = offset + lista.length;            // Recuerda dónde seguir
        mostrarBotonMas(lista.length === TAMANO_PAGINA); // Si la lista vino incompleta, ya no hay más
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
    modal.classList.remove("hidden");                    // Muestra el popup
    modalError.classList.add("hidden");                  // Oculta errores anteriores
    modalCuerpo.classList.add("hidden");                 // Oculta contenido viejo mientras carga
    btnRegresar.focus();                                 // Lleva el foco al botón Regresar

    try {
        // GET /api/pokemon/{id}
        const d = await pedirJson(`${URL_API}/${id}`);
        rellenarModal(d);                                // Escribe los datos en el popup
        modalCuerpo.classList.remove("hidden");          // Muestra el contenido
    } catch (error) {
        modalError.textContent = error.message;          // Muestra el error dentro del popup
        modalError.classList.remove("hidden");
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
        const etiqueta = document.createElement("button");   // Ahora es botón (se puede pulsar)
        etiqueta.type = "button";
        etiqueta.className = CLASES_TIPO + (COLORES_TIPO[tipo] || COLOR_TIPO_DEFECTO) +
            " cursor-pointer hover:brightness-110 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amarillo";
        etiqueta.textContent = tipo;
        etiqueta.title = "Ver detalle del tipo " + tipo;
        etiqueta.addEventListener("click", () => abrirTipo(tipo)); // Abre el NIVEL 2
        contTipos.appendChild(etiqueta);
    });

    // ----- Estadísticas: una barra por cada stat -----
    const contStats = document.getElementById("modal-stats");
    contStats.replaceChildren();
    Object.entries(d.stats).forEach(([nombre, valor]) => {
        const fila = document.createElement("div");      // Fila de la estadística
        fila.className = CLASES_STAT;

        const etiqueta = document.createElement("span"); // Nombre traducido
        etiqueta.textContent = NOMBRES_STATS[nombre] || nombre;

        const numero = document.createElement("strong"); // Valor numérico
        numero.textContent = valor;

        const barra = document.createElement("span");    // Fondo de la barra
        barra.className = CLASES_STAT_BARRA;
        const relleno = document.createElement("span");  // Parte rellena
        relleno.className = CLASES_STAT_RELLENO;
        relleno.style.width = Math.min(100, (valor / 255) * 100) + "%"; // 255 = valor máximo posible
        barra.appendChild(relleno);

        fila.append(etiqueta, numero, barra);
        contStats.appendChild(fila);
    });
}

// Cierra el popup del nivel 1 (y antes cualquier popup extra que siga abierto)
function cerrarModal() {
    while (pilaPopups.length > 0) cerrarUltimoPopup();
    modal.classList.add("hidden");
}

// Clic en una tarjeta. Usamos "delegación de eventos": UN solo listener en la grilla
// sirve para las tarjetas de Thymeleaf Y para las que crea JavaScript después.
grilla.addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest("[data-id]");   // Busca la tarjeta clicada (la que tiene data-id)
    if (tarjeta) abrirDetalle(tarjeta.dataset.id);       // Toma su id -> ENDPOINT 3
});

// Misma acción con teclado (Enter sobre una tarjeta enfocada)
grilla.addEventListener("keydown", (evento) => {
    const tarjeta = evento.target.closest("[data-id]");
    if (tarjeta && evento.key === "Enter") abrirDetalle(tarjeta.dataset.id);
});

// ---------- Formas de cerrar el popup ----------
btnRegresar.addEventListener("click", cerrarModal);      // Botón "Regresar"
document.addEventListener("keydown", (evento) => {       // Tecla Esc
    if (evento.key === "Escape") {
        if (pilaPopups.length > 0) cerrarUltimoPopup();  // Cierra SOLO el popup de más arriba
        else cerrarModal();                              // Si no hay extras, cierra el nivel 1
    }
});
modal.addEventListener("click", (evento) => {             // Clic en el fondo oscuro
    if (evento.target === modal) cerrarModal();
});
// =====================================================================
// 4) POPUPS ANIDADOS: nivel 2 (tipo) y nivel 3 (mini ficha del Pokémon)
// =====================================================================

// Atajo para crear un elemento con clases y texto (usa textContent: evita inyección de HTML)
function crearElemento(etiqueta, clases, texto) {
    const e = document.createElement(etiqueta);
    e.className = clases;
    if (texto !== undefined) e.textContent = texto;
    return e;
}

// Crea un popup extra (nivel 2 o 3), lo agrega a la pantalla y lo mete en la pila.
// Devuelve { cuerpo, error } para que cada nivel escriba su contenido.
function crearPopupExtra(nivel, titulo) {
    const estilo = ESTILOS_NIVEL[nivel];

    // Fondo oscuro que cubre la pantalla (su z-index decide quién queda arriba)
    const fondo = crearElemento("div", "fixed inset-0 bg-[#141822]/50 flex items-center justify-center p-4 " + estilo.fondo);
    fondo.setAttribute("role", "dialog");
    fondo.setAttribute("aria-modal", "true");
    fondo.setAttribute("aria-label", `Nivel ${nivel}: ${titulo}`);

    // Caja blanca (tamaño, color y posición salen de ESTILOS_NIVEL)
    const caja = crearElemento("div", "relative bg-papel rounded-[14px] w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl " + estilo.caja);

    // Fila superior: botón "Regresar al nivel N-1" + insignia "Nivel N"
    const cabecera = crearElemento("div", "flex items-center justify-between mb-4");
    const btnVolver = crearElemento("button", CLASES_BOTON_ROJO, `← Regresar al nivel ${nivel - 1}`);
    btnVolver.type = "button";
    btnVolver.addEventListener("click", cerrarUltimoPopup);
    const insignia = crearElemento("span", "text-white text-[.85rem] font-bold px-3 py-1 rounded-full " + estilo.insignia, `Nivel ${nivel}`);
    cabecera.append(btnVolver, insignia);

    const error = crearElemento("p", CLASES_ERROR);   // Mensaje de error (oculto)
    const cuerpo = crearElemento("div", "");          // Aquí va el contenido de la PokeAPI
    cuerpo.append(crearElemento("p", "text-center text-tinta-suave", "Cargando..."));

    caja.append(cabecera, error, cuerpo);
    fondo.appendChild(caja);
    fondo.addEventListener("click", (evento) => {     // Clic en el fondo oscuro = cerrar este nivel
        if (evento.target === fondo) cerrarUltimoPopup();
    });

    document.body.appendChild(fondo);                 // Lo muestra
    pilaPopups.push(fondo);                           // Lo registra en la pila
    btnVolver.focus();                                // Accesibilidad: foco al botón
    return { cuerpo, error };
}

// Cierra el popup de más arriba y devuelve el foco al de abajo
function cerrarUltimoPopup() {
    const popup = pilaPopups.pop();                   // Saca el último de la pila
    if (popup) popup.remove();                        // Lo quita de la pantalla
    const anterior = pilaPopups[pilaPopups.length - 1];
    (anterior ? anterior.querySelector("button") : btnRegresar).focus();
}

// ---------- NIVEL 2: detalle de un tipo -> ENDPOINT 4 ----------
async function abrirTipo(nombreTipo) {
    const { cuerpo, error } = crearPopupExtra(2, nombreTipo);
    try {
        // GET /api/pokemon/tipo/{nombre}
        const t = await pedirJson(`${URL_API}/tipo/${encodeURIComponent(nombreTipo)}`);
        pintarTipo(cuerpo, t);
    } catch (e) {
        cuerpo.replaceChildren();
        error.textContent = e.message;
        error.classList.remove("hidden");
    }
}

// Dibuja el contenido del nivel 2
function pintarTipo(cuerpo, t) {
    const titulo = crearElemento("h2", "mb-3 text-[1.5rem] font-bold text-center", "Tipo " + capitalizar(t.name));
    const subtitulo = crearElemento("h3", "mt-5 mb-2 text-base font-bold", "Algunos Pokémon de este tipo (toca uno)");

    // Cuadrícula de Pokémon: cada uno es un botón con data-id
    const lista = crearElemento("div", "grid grid-cols-3 gap-2");
    t.pokemon.forEach(p => {
        const boton = crearElemento("button",
            "bg-fondo border border-linea rounded-lg p-2 text-center cursor-pointer hover:border-rojo " +
            "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amarillo");
        boton.type = "button";
        boton.dataset.id = p.id;
        const imagen = crearElemento("img", "w-full aspect-square object-contain");
        imagen.src = p.imageUrl;
        imagen.alt = p.name;
        imagen.loading = "lazy";
        boton.append(imagen, crearElemento("span", "block text-[.8rem] font-semibold", capitalizar(p.name)));
        lista.appendChild(boton);
    });
    // Delegación de eventos: un solo listener para todos los botones
    lista.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-id]");
        if (boton) abrirPokemonNivel3(boton.dataset.id);   // Abre el NIVEL 3
    });

    cuerpo.replaceChildren(
        titulo,
        crearBloqueTipos("Fuerte contra (hace doble daño)", t.doubleDamageTo),
        crearBloqueTipos("Débil contra (recibe doble daño)", t.doubleDamageFrom),
        subtitulo,
        lista
    );
}

// Título + etiquetas de colores con una lista de tipos
function crearBloqueTipos(titulo, nombres) {
    const bloque = crearElemento("div", "mt-3");
    bloque.appendChild(crearElemento("h3", "mb-1 text-base font-bold", titulo));
    const fila = crearElemento("div", "flex flex-wrap gap-2");
    if (nombres.length === 0) fila.appendChild(crearElemento("span", "text-tinta-suave", "Ninguno"));
    nombres.forEach(n => fila.appendChild(
        crearElemento("span", CLASES_TIPO + (COLORES_TIPO[n] || COLOR_TIPO_DEFECTO), n)));
    bloque.appendChild(fila);
    return bloque;
}

// ---------- NIVEL 3: mini ficha del Pokémon -> reutiliza el ENDPOINT 3 ----------
async function abrirPokemonNivel3(id) {
    const { cuerpo, error } = crearPopupExtra(3, "Pokémon " + id);
    try {
        const d = await pedirJson(`${URL_API}/${id}`);     // GET /api/pokemon/{id}
        pintarPokemonNivel3(cuerpo, d);
    } catch (e) {
        cuerpo.replaceChildren();
        error.textContent = e.message;
        error.classList.remove("hidden");
    }
}

// Contenido compacto del nivel 3 (aquí NO hay más clics: el máximo son 3 niveles)
function pintarPokemonNivel3(cuerpo, d) {
    const imagen = crearElemento("img", "block w-[160px] max-w-[60%] mx-auto");
    imagen.src = d.imageUrl;
    imagen.alt = d.name;
    const tipos = crearElemento("div", "flex justify-center gap-2 flex-wrap");
    d.types.forEach(tp => tipos.appendChild(
        crearElemento("span", CLASES_TIPO + (COLORES_TIPO[tp] || COLOR_TIPO_DEFECTO), tp)));

    cuerpo.replaceChildren(
        imagen,
        crearElemento("p", "text-center text-tinta-suave", formatearNumero(d.id)),
        crearElemento("h2", "mb-2 text-center text-[1.4rem] font-bold", capitalizar(d.name)),
        tipos,
        crearElemento("p", "my-3 text-[.95rem]", d.description),
        crearElemento("p", "text-center font-semibold", `${d.heightMeters} m · ${d.weightKg} kg`)
    );
}
