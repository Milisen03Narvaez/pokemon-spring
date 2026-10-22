package com.example.pokedex.controller; // Paquete de CONTROLADORES (C de MVC)

import org.springframework.beans.factory.annotation.Value; // Lee application.properties
import org.springframework.stereotype.Controller;           // Controlador que devuelve VISTAS (HTML)
import org.springframework.ui.Model;                        // Mochila de datos que viaja hacia la vista
import org.springframework.web.bind.annotation.GetMapping;  // Responde a peticiones GET
import org.springframework.web.client.RestClientException;  // Error al llamar a la PokeAPI

import com.example.pokedex.model.PaginaPokemon;  // Modelo: página de tarjetas
import com.example.pokedex.service.PokemonService; // Servicio con la lógica

/**
 * CONTROLADOR DE VISTA: entrega la página HTML (Thymeleaf).
 *
 * Flujo:  Navegador --GET /--> este controller --> PokemonService --> PokeAPI
 *         este controller --(Model)--> templates/index.html (Thymeleaf) --> HTML al navegador
 *
 * Diferencia con PokemonRestController: este devuelve HTML, el otro devuelve JSON.
 */
@Controller // Los métodos devuelven el NOMBRE de una plantilla (no JSON)
public class PokemonViewController {

    private final PokemonService pokemonService; // Servicio inyectado
    private final int pageSize;                  // Cuántas tarjetas mostrar al inicio

    // Constructor: Spring inyecta el servicio y el valor pokedex.page-size
    public PokemonViewController(PokemonService pokemonService,
                                 @Value("${pokedex.page-size}") int pageSize) {
        this.pokemonService = pokemonService; // Guarda el servicio
        this.pageSize = pageSize;             // Guarda el tamaño de página
    }

    // Se ejecuta cuando el navegador abre http://localhost:8080/
    @GetMapping("/")
    public String index(Model model) {
        try {
            // Pide al servicio la primera página (offset 0)
            PaginaPokemon pagina = pokemonService.listarPokemon(0, pageSize);

            // Datos que Thymeleaf podrá leer en index.html con ${...}
            model.addAttribute("pagina", pagina);                        // Para el botón "Cargar más"
            model.addAttribute("pokemones", pagina.getResultados());     // Para pintar las tarjetas
        } catch (RestClientException e) {
            // Si la PokeAPI falla, mostramos un mensaje en la página en vez de una pantalla de error
            model.addAttribute("error", "No se pudo conectar con la PokeAPI. Intenta de nuevo en unos segundos.");
        }
        return "index"; // Thymeleaf busca templates/index.html
    }
}
