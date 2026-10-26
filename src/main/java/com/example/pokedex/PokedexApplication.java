package com.example.pokedex; // Paquete raíz: Spring escanea este paquete y TODOS sus subpaquetes

import org.springframework.boot.SpringApplication; // Clase que arranca la aplicación
import org.springframework.boot.autoconfigure.SpringBootApplication; // Anotación "todo en uno" de Spring Boot

/**
 * CLASE DE ARRANQUE (punto de entrada del proyecto).
 *
 * Conexión con las demás partes:
 *  - @SpringBootApplication hace que Spring busque (escanee) las clases anotadas con
 *    @Service y @Controller dentro de com.example.pokedex.* y las registre automáticamente.
 *  - Así Spring encuentra PokemonService y PokemonController sin que las instanciemos a mano.
 *    PokemonRestController y ManejadorErrores sin que las instanciemos a mano.
 */
@SpringBootApplication // Activa configuración automática + escaneo de componentes
public class PokedexApplication {

    // Método main: lo primero que ejecuta Java al iniciar el programa
    public static void main(String[] args) {
        // Arranca Spring Boot: levanta Tomcat en el puerto 8080 y crea todos los beans
        SpringApplication.run(PokedexApplication.class, args);
    }
}
