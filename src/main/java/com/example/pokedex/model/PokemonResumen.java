package com.example.pokedex.model; // Paquete del MODELO (M de MVC): clases que solo guardan datos

/**
 * MODELO "resumen": los datos mínimos para pintar UNA TARJETA del index.
 *
 * Conexión con las demás partes:
 *  - PokemonService la CREA (a partir del JSON de la PokeAPI).
 *  - PokemonViewController la envía a Thymeleaf (index.html) dentro de la lista "pokemones".
 *  - PokemonRestController la devuelve como JSON en los endpoints 1 y 2;
 *    app.js recibe ese JSON y dibuja tarjetas con él.
 */
public class PokemonResumen {

    private final int id;          // Número en la Pokédex (ej. 25)
    private final String name;     // Nombre en minúsculas tal como lo da la API (ej. "pikachu")
    private final String imageUrl; // URL de la imagen oficial

    // Constructor: recibe todos los datos de una sola vez (el objeto no cambia después)
    public PokemonResumen(int id, String name, String imageUrl) {
        this.id = id;                 // Guarda el id
        this.name = name;             // Guarda el nombre
        this.imageUrl = imageUrl;     // Guarda la URL de la imagen
    }

    // Getters: Jackson (JSON) y Thymeleaf los usan para leer los campos
    public int getId() { return id; }
    public String getName() { return name; }
    public String getImageUrl() { return imageUrl; }
}
