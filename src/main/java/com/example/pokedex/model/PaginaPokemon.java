package com.example.pokedex.model; // Paquete del MODELO

import java.util.List; // Lista de elementos

/**
 * MODELO "página": agrupa un bloque de tarjetas + datos para pedir el siguiente bloque.
 *
 * Conexión con las demás partes:
 *  - PokemonService.listarPokemon(...) la devuelve.
 *  - PokemonViewController la manda al index.html (para pintar las primeras tarjetas
 *    y para saber desde qué "offset" debe seguir el botón "Cargar más").
 *  - PokemonRestController (endpoint 1) la devuelve como JSON a app.js.
 */
public class PaginaPokemon {

    private final List<PokemonResumen> resultados; // Tarjetas de esta página
    private final int total;                       // Total de Pokémon disponibles
    private final int siguienteOffset;             // Desde dónde pedir la siguiente página
    private final boolean hayMas;                  // true si todavía quedan Pokémon por cargar

    // Constructor con todos los campos
    public PaginaPokemon(List<PokemonResumen> resultados, int total, int siguienteOffset, boolean hayMas) {
        this.resultados = resultados;             // Guarda la lista
        this.total = total;                       // Guarda el total
        this.siguienteOffset = siguienteOffset;   // Guarda el siguiente offset
        this.hayMas = hayMas;                     // Guarda si hay más
    }

    // Getters (los necesitan Jackson y Thymeleaf)
    public List<PokemonResumen> getResultados() { return resultados; }
    public int getTotal() { return total; }
    public int getSiguienteOffset() { return siguienteOffset; }
    public boolean isHayMas() { return hayMas; } // Para booleanos el getter empieza con "is"
}
