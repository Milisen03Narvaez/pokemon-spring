package com.example.pokedex.controller; // Paquete de CONTROLADORES

import java.util.List; // Lista

import org.springframework.web.bind.annotation.GetMapping;       // Peticiones GET
import org.springframework.web.bind.annotation.PathVariable;     // Valor que viene dentro de la URL
import org.springframework.web.bind.annotation.RequestMapping;   // Prefijo común de las URLs
import org.springframework.web.bind.annotation.RequestParam;     // Valor que viene como ?clave=valor
import org.springframework.web.bind.annotation.RestController;   // Controlador que devuelve JSON

import com.example.pokedex.model.PaginaPokemon;   // Modelo: página
import com.example.pokedex.model.PokemonDetalle;  // Modelo: detalle
import com.example.pokedex.model.PokemonResumen;  // Modelo: tarjeta
import com.example.pokedex.service.PokemonService; // Servicio con la lógica

/**
 * CONTROLADOR REST: aquí están los 3 ENDPOINTS. Devuelven JSON y los consume app.js (fetch).
 *
 * CÓMO ESTÁN ENCADENADOS (el recorrido del usuario):
 *
 *   ENDPOINT 1  GET /api/pokemon?offset=0&limit=30   -> lista de tarjetas (ids + nombres + imagen)
 *        |  (el usuario ve tarjetas; cada tarjeta guarda su "id")
 *        v
 *   ENDPOINT 2  GET /api/pokemon/search?q=pika       -> mismas tarjetas, pero filtradas por texto
 *        |  (el usuario hace clic en una tarjeta; app.js toma su "id")
 *        v
 *   ENDPOINT 3  GET /api/pokemon/{id}                -> detalle completo para el popup
 *                (internamente el servicio encadena 2 llamadas más a la PokeAPI)
 *
 * El "id" que devuelven los endpoints 1 y 2 es justo el dato que necesita el endpoint 3.
 */
@RestController                 // Todos los métodos devuelven JSON automáticamente
@RequestMapping("/api/pokemon") // Prefijo común: todas las rutas empiezan con /api/pokemon
public class PokemonRestController {

    private final PokemonService pokemonService; // Servicio inyectado por Spring

    // Constructor: Spring entrega el servicio
    public PokemonRestController(PokemonService pokemonService) {
        this.pokemonService = pokemonService; // Guarda el servicio
    }

    // ---------------- ENDPOINT 1: listar por páginas ----------------
    // Ejemplo: GET /api/pokemon?offset=30&limit=30
    @GetMapping
    public PaginaPokemon listar(@RequestParam(defaultValue = "0") int offset,   // Desde dónde (por defecto 0)
                                @RequestParam(defaultValue = "30") int limit) { // Cuántos (por defecto 30)
        return pokemonService.listarPokemon(offset, limit); // Delegamos TODO al servicio
    }

    // ---------------- ENDPOINT 2: buscar ----------------
    // Ejemplo: GET /api/pokemon/search?q=char
    @GetMapping("/search")
    public List<PokemonResumen> buscar(@RequestParam("q") String texto) { // "q" = texto buscado
        return pokemonService.buscarPorNombre(texto); // Delegamos al servicio
    }

    // ---------------- ENDPOINT 3: detalle ----------------
    // Ejemplo: GET /api/pokemon/25
    @GetMapping("/{id}")
    public PokemonDetalle detalle(@PathVariable int id) { // {id} de la URL llega aquí
        return pokemonService.obtenerDetalle(id); // Delegamos al servicio
    }
}
