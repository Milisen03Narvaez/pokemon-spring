package com.example.pokedex.config; // Paquete de configuración

import java.time.Duration; // Para definir tiempos de espera

import org.springframework.boot.web.client.RestTemplateBuilder; // Constructor de RestTemplate
import org.springframework.context.annotation.Bean; // Marca un método que crea un objeto gestionado por Spring
import org.springframework.context.annotation.Configuration; // Marca la clase como de configuración
import org.springframework.web.client.RestTemplate; // Cliente HTTP para llamar a otras APIs

/**
 * CONFIGURACIÓN: aquí creamos el "cliente HTTP" que usaremos para hablar con la PokeAPI.
 *
 * Conexión con las demás partes:
 *  - PokemonService recibe este RestTemplate por su constructor (inyección de dependencias).
 *    Spring ve que el servicio pide un RestTemplate y le entrega el que se crea aquí.
 */
@Configuration // Spring ejecuta esta clase al arrancar para registrar los beans que define
public class AppConfig {

    @Bean // El objeto que devuelve este método queda disponible para inyectarse en otras clases
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5)) // Máximo 5 s para conectar con la PokeAPI
                .setReadTimeout(Duration.ofSeconds(10))   // Máximo 10 s esperando la respuesta
                .build();                                  // Construye el RestTemplate final
    }
}
