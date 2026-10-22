package com.example.pokedex.service; // Paquete de SERVICIOS: aquí vive la lógica de negocio

import java.util.ArrayList;     // Lista modificable
import java.util.LinkedHashMap; // Mapa que conserva el orden de inserción
import java.util.List;          // Lista
import java.util.Locale;        // Para pasar a minúsculas sin problemas de idioma
import java.util.Map;           // Mapa clave-valor

import org.springframework.beans.factory.annotation.Value; // Lee valores de application.properties
import org.springframework.stereotype.Service;             // Marca la clase como servicio de Spring
import org.springframework.web.client.RestTemplate;        // Cliente HTTP

import com.example.pokedex.model.PaginaPokemon;   // Modelo: página de tarjetas
import com.example.pokedex.model.PokemonDetalle;  // Modelo: detalle del popup
import com.example.pokedex.model.PokemonResumen;  // Modelo: una tarjeta
import com.fasterxml.jackson.databind.JsonNode;   // Representa un JSON en memoria

/**
 * SERVICIO: contiene TODA la lógica. Es la única clase que habla con la PokeAPI.
 *
 * Reglas del MVC de este proyecto:
 *  - Los controllers NO saben cómo se obtienen los datos: solo llaman a este servicio.
 *  - Este servicio NO sabe nada de HTML ni de HTTP del navegador: solo devuelve modelos.
 *
 * Quién lo usa:
 *  - PokemonViewController  -> listarPokemon()                (pinta el index)
 *  - PokemonRestController  -> listarPokemon()                (ENDPOINT 1)
 *                           -> buscarPorNombre()              (ENDPOINT 2)
 *                           -> obtenerDetalle()               (ENDPOINT 3)
 */
@Service // Spring crea UNA instancia y la inyecta donde se pida
public class PokemonService {

    // La PokeAPI tiene Pokémon "normales" del 1 al 1025; los demás ids son formas especiales
    private static final int MAX_POKEMON = 1025;

    // Máximo de resultados que devuelve la búsqueda (evita pintar cientos de tarjetas)
    private static final int MAX_RESULTADOS_BUSQUEDA = 60;

    // Plantilla de la URL de la imagen oficial; %d se reemplaza por el id del Pokémon
    private static final String URL_IMAGEN =
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/%d.png";

    private final RestTemplate restTemplate; // Cliente HTTP (viene de AppConfig)
    private final String baseUrl;            // URL base de la PokeAPI (viene de application.properties)

    // Caché en memoria con TODOS los nombres; se llena la primera vez que se busca
    private List<PokemonResumen> catalogoCache;

    /**
     * Constructor con inyección de dependencias:
     * Spring entrega el RestTemplate (AppConfig) y el valor de pokeapi.base-url (application.properties).
     */
    public PokemonService(RestTemplate restTemplate, @Value("${pokeapi.base-url}") String baseUrl) {
        this.restTemplate = restTemplate; // Guarda el cliente HTTP
        this.baseUrl = baseUrl;           // Guarda la URL base
    }

    // =====================================================================
    // ENDPOINT 1 (lógica): listar Pokémon por páginas
    // Llama a la PokeAPI:  GET {baseUrl}/pokemon?limit=X&offset=Y
    // =====================================================================
    public PaginaPokemon listarPokemon(int offset, int limit) {
        if (offset < 0) offset = 0;          // No se permiten offsets negativos
        if (limit < 1) limit = 1;            // Mínimo 1 elemento
        if (limit > 100) limit = 100;        // Máximo 100 para no saturar la API

        // Si ya pedimos más allá del último Pokémon, devolvemos una página vacía
        if (offset >= MAX_POKEMON) {
            return new PaginaPokemon(new ArrayList<>(), MAX_POKEMON, MAX_POKEMON, false);
        }

        // Evita pasarnos del Pokémon 1025 (para no traer formas especiales)
        int limiteReal = Math.min(limit, MAX_POKEMON - offset);

        // Arma la URL final de la PokeAPI
        String url = baseUrl + "/pokemon?limit=" + limiteReal + "&offset=" + offset;

        // Llama a la PokeAPI y convierte la respuesta en un JsonNode
        JsonNode respuesta = restTemplate.getForObject(url, JsonNode.class);

        List<PokemonResumen> lista = new ArrayList<>(); // Aquí guardamos las tarjetas

        // "results" es un arreglo de objetos {name, url}
        for (JsonNode item : respuesta.get("results")) {
            // Convertimos cada elemento en un PokemonResumen
            lista.add(construirResumen(item.get("name").asText(), item.get("url").asText()));
        }

        int siguiente = offset + lista.size(); // Dónde empieza la siguiente página
        // Devolvemos la página con el dato de si todavía hay más
        return new PaginaPokemon(lista, MAX_POKEMON, siguiente, siguiente < MAX_POKEMON);
    }

    // =====================================================================
    // ENDPOINT 2 (lógica): buscar por nombre o número
    // Usa el catálogo completo en caché y filtra en memoria.
    // =====================================================================
    public List<PokemonResumen> buscarPorNombre(String texto) {
        List<PokemonResumen> encontrados = new ArrayList<>(); // Resultado

        // Si no hay texto, no hay nada que buscar
        if (texto == null || texto.isBlank()) {
            return encontrados;
        }

        // Normaliza: quita espacios y pasa a minúsculas
        String buscado = texto.trim().toLowerCase(Locale.ROOT);

        // Recorre todo el catálogo (se descarga una sola vez)
        for (PokemonResumen p : obtenerCatalogo()) {
            // Coincide si el nombre contiene el texto, o si el texto es exactamente el número
            if (p.getName().contains(buscado) || String.valueOf(p.getId()).equals(buscado)) {
                encontrados.add(p); // Lo agregamos al resultado
            }
            // Cortamos al llegar al máximo permitido
            if (encontrados.size() >= MAX_RESULTADOS_BUSQUEDA) {
                break;
            }
        }
        return encontrados; // Lista final para el controller
    }

    // =====================================================================
    // ENDPOINT 3 (lógica): detalle completo (ENCADENA 2 llamadas a la PokeAPI)
    //   llamada A: GET {baseUrl}/pokemon/{id}          -> tipos, stats, peso, altura...
    //   llamada B: GET {baseUrl}/pokemon-species/{id}  -> descripción en texto
    // =====================================================================
    public PokemonDetalle obtenerDetalle(int id) {
        // Validamos que el id sea de un Pokémon normal
        if (id < 1 || id > MAX_POKEMON) {
            throw new IllegalArgumentException("El id debe estar entre 1 y " + MAX_POKEMON);
        }

        // Llamada A: datos "físicos" del Pokémon
        JsonNode datos = restTemplate.getForObject(baseUrl + "/pokemon/" + id, JsonNode.class);

        // Llamada B: datos de la "especie" (aquí viene el texto descriptivo)
        JsonNode especie = restTemplate.getForObject(baseUrl + "/pokemon-species/" + id, JsonNode.class);

        PokemonDetalle detalle = new PokemonDetalle(); // Objeto que vamos a llenar

        detalle.setId(datos.get("id").asInt());                       // Número
        detalle.setName(datos.get("name").asText());                  // Nombre
        detalle.setImageUrl(String.format(URL_IMAGEN, id));           // Imagen oficial
        detalle.setHeightMeters(datos.get("height").asInt() / 10.0);  // La API da decímetros -> metros
        detalle.setWeightKg(datos.get("weight").asInt() / 10.0);      // La API da hectogramos -> kg
        detalle.setBaseExperience(datos.path("base_experience").asInt(0)); // 0 si no existe

        // ----- Tipos -----
        List<String> tipos = new ArrayList<>();
        for (JsonNode t : datos.get("types")) {
            tipos.add(t.get("type").get("name").asText()); // ej. "electric"
        }
        detalle.setTypes(tipos);

        // ----- Habilidades -----
        List<String> habilidades = new ArrayList<>();
        for (JsonNode a : datos.get("abilities")) {
            habilidades.add(a.get("ability").get("name").asText().replace("-", " "));
        }
        detalle.setAbilities(habilidades);

        // ----- Estadísticas (LinkedHashMap conserva el orden hp, attack, defense...) -----
        Map<String, Integer> stats = new LinkedHashMap<>();
        for (JsonNode s : datos.get("stats")) {
            stats.put(s.get("stat").get("name").asText(), s.get("base_stat").asInt());
        }
        detalle.setStats(stats);

        // ----- Descripción (de la llamada B) -----
        detalle.setDescription(extraerDescripcion(especie));

        return detalle; // Lo devuelve al controller
    }

    // ---------------------------------------------------------------------
    // MÉTODOS PRIVADOS (ayudantes internos, nadie fuera de esta clase los usa)
    // ---------------------------------------------------------------------

    // Descarga (una sola vez) la lista de todos los Pokémon y la guarda en caché
    private synchronized List<PokemonResumen> obtenerCatalogo() {
        if (catalogoCache == null) { // Solo si todavía no se descargó
            String url = baseUrl + "/pokemon?limit=" + MAX_POKEMON + "&offset=0";
            JsonNode respuesta = restTemplate.getForObject(url, JsonNode.class);
            List<PokemonResumen> todos = new ArrayList<>();
            for (JsonNode item : respuesta.get("results")) {
                todos.add(construirResumen(item.get("name").asText(), item.get("url").asText()));
            }
            catalogoCache = todos; // Guardamos para no volver a pedirlo
        }
        return catalogoCache;
    }

    // Crea un PokemonResumen a partir del nombre y la URL que da la PokeAPI
    private PokemonResumen construirResumen(String nombre, String url) {
        int id = extraerId(url); // Sacamos el número desde la URL
        return new PokemonResumen(id, nombre, String.format(URL_IMAGEN, id));
    }

    // La PokeAPI no da el id directo: viene al final de la URL, ej. ".../pokemon/25/"
    private int extraerId(String url) {
        String limpia = url.endsWith("/") ? url.substring(0, url.length() - 1) : url; // Quita "/" final
        String ultimo = limpia.substring(limpia.lastIndexOf('/') + 1);                  // Toma lo que sigue al último "/"
        return Integer.parseInt(ultimo);                                                // Lo convierte a número
    }

    // Busca el texto descriptivo: primero en español, si no hay, en inglés
    private String extraerDescripcion(JsonNode especie) {
        String espanol = null; // Texto en español (si existe)
        String ingles = null;  // Texto en inglés (si existe)
        for (JsonNode entrada : especie.get("flavor_text_entries")) {
            String idioma = entrada.get("language").get("name").asText(); // "es", "en", ...
            String texto = entrada.get("flavor_text").asText().replaceAll("[\\n\\f]", " "); // Limpia saltos
            if ("es".equals(idioma) && espanol == null) espanol = texto; // Primer texto en español
            if ("en".equals(idioma) && ingles == null) ingles = texto;   // Primer texto en inglés
        }
        if (espanol != null) return espanol;   // Preferimos español
        if (ingles != null) return ingles;     // Si no, inglés
        return "Sin descripción disponible.";  // Último recurso
    }
}
