package com.example.pokedex.controller; // Mismo paquete que los controladores

import java.util.Map; // Para armar el JSON del error

import org.springframework.http.HttpStatus;         // Códigos HTTP (400, 502...)
import org.springframework.http.ResponseEntity;      // Respuesta con código + cuerpo
import org.springframework.web.bind.annotation.ExceptionHandler;   // Captura excepciones
import org.springframework.web.bind.annotation.RestControllerAdvice; // Aplica a todos los @RestController
import org.springframework.web.client.RestClientException;          // Fallo al llamar a la PokeAPI

/**
 * MANEJADOR DE ERRORES GLOBAL para los endpoints REST.
 *
 * Conexión: si PokemonService lanza una excepción mientras PokemonRestController
 * atiende una petición, Spring la captura AQUÍ y responde un JSON {"error": "..."} con el código correcto.
 * app.js lee ese "error" y lo muestra en pantalla.
 */
@RestControllerAdvice // Escucha las excepciones de todos los controladores REST
public class ManejadorErrores {

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
