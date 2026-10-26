package com.example.pokedex.controller; // Paquete del CONTROLADOR (C de MVC)

import java.util.List; // Lista
import java.util.Map;  // Para armar el JSON del error

import org.springframework.beans.factory.annotation.Value;              // Lee application.properties
import org.springframework.http.HttpStatus;                              // Códigos HTTP (400, 502...)
import org.springframework.http.ResponseEntity;                          // Respuesta con código + cuerpo
import org.springframework.stereotype.Controller;                        // Controlador de Spring MVC
import org.springframework.ui.Model;                                     // Mochila de datos hacia la vista
import org.springframework.web.bind.annotation.ExceptionHandler;         // Captura excepciones de este controller
import org.springframework.web.bind.annotation.GetMapping;               // Peticiones GET
import org.springframework.web.bind.annotation.PathVariable;             // Valor que viene dentro de la URL
import org.springframework.web.bind.annotation.RequestParam;             // Valor que viene como ?clave=valor
import org.springframework.web.bind.annotation.ResponseBody;             // El método devuelve JSON (no una vista)
import org.springframework.web.client.RestClientException;               // Fallo al llamar a la PokeAPI

import com.example.pokedex.model.Pokemon;             // Modelo único
import com.example.pokedex.service.PokemonService;    // Servicio con la lógica

/**
 * CONTROLADOR ÚNICO: tiene la página HTML y los 3 ENDPOINTS JSON.
 *
 *   GET /                              -> la página (Thymeleaf: templates/index.html)
 *   ENDPOINT 1  GET /api/pokemon?offset=0&limit=30   -> lista de tarjetas
 *   ENDPOINT 2  GET /api/pokemon/search?q=pika       -> tarjetas filtradas por texto
 *   ENDPOINT 3  GET /api/pokemon/{id}                -> detalle completo para el popup
 *
 * Recorrido del usuario: ve tarjetas (1 o 2) -> hace clic en una -> app.js toma su "id" -> endpoint 3.
 *
 * Los métodos con @ResponseBody devuelven JSON (los consume app.js con fetch).
 * El método index() devuelve el NOMBRE de la plantilla HTML.
 */
@Controller
public class PokemonController {

    private final PokemonService pokemonService; // Servicio inyectado por Spring
    private final int pageSize;                  // Cuántas tarjetas mostrar al inicio

    // Constructor: Spring inyecta el servicio y el valor pokedex.page-size
    public PokemonController(PokemonService pokemonService,
                             @Value("${pokedex.page-size}") int pageSize) {
        this.pokemonService = pokemonService;
        this.pageSize = pageSize;
    }

    // ---------------- PÁGINA: se ejecuta al abrir http://localhost:8080/ ----------------
    @GetMapping("/")
    public String index(Model model) {
        // Valores por defecto (si la PokeAPI falla, el botón "Cargar más" queda oculto)
        model.addAttribute("siguienteOffset", 0);
        model.addAttribute("hayMas", false);
        try {
            List<Pokemon> pokemones = pokemonService.listar(0, pageSize); // Primera página
            model.addAttribute("pokemones", pokemones);                    // Para pintar las tarjetas
            model.addAttribute("siguienteOffset", pokemones.size());       // Desde dónde sigue "Cargar más"
            model.addAttribute("hayMas", pokemones.size() == pageSize);    // Si vino incompleta, ya no hay más
        } catch (RestClientException e) {
            // Mostramos un mensaje en la página en vez de una pantalla de error
            model.addAttribute("error", "No se pudo conectar con la PokeAPI. Intenta de nuevo en unos segundos.");
        }
        return "index"; // Thymeleaf busca templates/index.html
    }

    // ---------------- ENDPOINT 1: listar por páginas ----------------
    // Ejemplo: GET /api/pokemon?offset=30&limit=30
    @GetMapping("/api/pokemon")
    @ResponseBody
    public List<Pokemon> listar(@RequestParam(defaultValue = "0") int offset,    // Desde dónde (por defecto 0)
                                @RequestParam(defaultValue = "30") int limit) {  // Cuántos (por defecto 30)
        return pokemonService.listar(offset, limit);
    }

    // ---------------- ENDPOINT 2: buscar ----------------
    // Ejemplo: GET /api/pokemon/search?q=char
    @GetMapping("/api/pokemon/search")
    @ResponseBody
    public List<Pokemon> buscar(@RequestParam("q") String texto) { // "q" = texto buscado
        return pokemonService.buscar(texto);
    }

    // ---------------- ENDPOINT 3: detalle ----------------
    // Ejemplo: GET /api/pokemon/25
    @GetMapping("/api/pokemon/{id}")
    @ResponseBody
    public Pokemon detalle(@PathVariable int id) { // {id} de la URL llega aquí
        return pokemonService.obtenerDetalle(id);
    }

    // ---------------- ERRORES: se convierten en JSON {"error": "..."} ----------------
    // app.js lee ese "error" y lo muestra en pantalla.

    // Datos inválidos (ej. id fuera de rango) -> 400 Bad Request
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> datosInvalidos(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    // La PokeAPI no responde o dio error -> 502 Bad Gateway
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Map<String, String>> apiExternaCaida(RestClientException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", "No se pudo consultar la PokeAPI. Intenta de nuevo."));
    }
}