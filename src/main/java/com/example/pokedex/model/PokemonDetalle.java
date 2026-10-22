package com.example.pokedex.model; // Paquete del MODELO

import java.util.List; // Lista de textos (tipos, habilidades)
import java.util.Map;  // Pares clave-valor (estadísticas)

/**
 * MODELO "detalle": toda la información que se muestra en el POPUP al elegir una tarjeta.
 *
 * Conexión con las demás partes:
 *  - PokemonService.obtenerDetalle(id) la arma combinando DOS llamadas a la PokeAPI
 *    (/pokemon/{id} para datos físicos y /pokemon-species/{id} para la descripción).
 *  - PokemonRestController (endpoint 3) la devuelve como JSON.
 *  - app.js (función abrirDetalle) recibe el JSON y rellena el popup (modal).
 */
public class PokemonDetalle {

    private int id;                        // Número de Pokédex
    private String name;                   // Nombre
    private String imageUrl;               // Imagen grande
    private double heightMeters;           // Altura en metros
    private double weightKg;               // Peso en kilogramos
    private int baseExperience;            // Experiencia base
    private List<String> types;            // Tipos (fire, water...)
    private List<String> abilities;        // Habilidades
    private Map<String, Integer> stats;    // Estadísticas: hp, attack, defense...
    private String description;            // Descripción en texto (viene de pokemon-species)

    // Getters y setters: el servicio usa los setters para llenar el objeto
    // y Jackson usa los getters para convertirlo a JSON.
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public double getHeightMeters() { return heightMeters; }
    public void setHeightMeters(double heightMeters) { this.heightMeters = heightMeters; }

    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double weightKg) { this.weightKg = weightKg; }

    public int getBaseExperience() { return baseExperience; }
    public void setBaseExperience(int baseExperience) { this.baseExperience = baseExperience; }

    public List<String> getTypes() { return types; }
    public void setTypes(List<String> types) { this.types = types; }

    public List<String> getAbilities() { return abilities; }
    public void setAbilities(List<String> abilities) { this.abilities = abilities; }

    public Map<String, Integer> getStats() { return stats; }
    public void setStats(Map<String, Integer> stats) { this.stats = stats; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
