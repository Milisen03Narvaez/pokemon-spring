package com.example.pokedex.model; // Paquete del MODELO (M de MVC): clase que solo guarda datos

import java.util.List; // Lista de textos (tipos, habilidades)
import java.util.Map;  // Pares clave-valor (estadísticas)

import com.fasterxml.jackson.annotation.JsonInclude; // Controla qué campos salen en el JSON

/**
 * MODELO ÚNICO: un Pokémon. Sirve para las dos pantallas:
 *  - TARJETA de la lista: solo trae id, name e imageUrl (el resto queda en null).
 *  - POPUP de detalle: trae todos los campos.
 *
 * Conexión con las demás partes:
 *  - PokemonService la crea a partir del JSON de la PokeAPI.
 *  - PokemonController la manda a Thymeleaf (index.html) y la devuelve como JSON a app.js.
 */
@JsonInclude(JsonInclude.Include.NON_NULL) // En el JSON no salen los campos que están en null
public class Pokemon {

    // ----- Datos básicos (los tiene toda tarjeta) -----
    private int id;                        // Número de Pokédex (ej. 25)
    private String name;                   // Nombre en minúsculas, tal como lo da la API (ej. "pikachu")
    private String imageUrl;               // URL de la imagen oficial

    // ----- Datos de detalle (solo se llenan para el popup; son objetos para poder ser null) -----
    private Double heightMeters;           // Altura en metros
    private Double weightKg;               // Peso en kilogramos
    private Integer baseExperience;        // Experiencia base
    private List<String> types;            // Tipos (fire, water...)
    private List<String> abilities;        // Habilidades
    private Map<String, Integer> stats;    // Estadísticas: hp, attack, defense...
    private String description;            // Descripción en texto

    // Constructor vacío: lo pide Spring/Jackson
    public Pokemon() { }

    // Constructor para la TARJETA (solo los 3 datos básicos)
    public Pokemon(int id, String name, String imageUrl) {
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
    }

    // Getters y setters: el servicio usa los setters para llenar el objeto;
    // Jackson (JSON) y Thymeleaf usan los getters para leerlo.
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Double getHeightMeters() { return heightMeters; }
    public void setHeightMeters(Double heightMeters) { this.heightMeters = heightMeters; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public Integer getBaseExperience() { return baseExperience; }
    public void setBaseExperience(Integer baseExperience) { this.baseExperience = baseExperience; }

    public List<String> getTypes() { return types; }
    public void setTypes(List<String> types) { this.types = types; }

    public List<String> getAbilities() { return abilities; }
    public void setAbilities(List<String> abilities) { this.abilities = abilities; }

    public Map<String, Integer> getStats() { return stats; }
    public void setStats(Map<String, Integer> stats) { this.stats = stats; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}