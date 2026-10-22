# 🐾 Pokedex Spring Boot - Arquitectura MVC & REST

Aplicación web full-stack construida con **Java 17** y **Spring Boot 3**, diseñada para consumir y procesar datos de la [PokeAPI](https://pokeapi.co/). El proyecto implementa un patrón de diseño híbrido que combina **MVC (Model-View-Controller)** para el renderizado inicial del lado del servidor (SSR) mediante Thymeleaf, y una **API REST interna** para la interacción asíncrona del cliente (SPA parcial) con JavaScript Vanilla.

---

## 🚀 Funcionalidades de la Interfaz y Características Técnicas

*   **Renderizado Híbrido:** La primera carga de la página (Index) la pinta Thymeleaf en el servidor, optimizando el rendimiento inicial.
*   **Buscador con Debounce:** Retraso (debounce) de 4 segundos: se ejecuta cuando el usuario deja de escribir durante 4s, con cuenta atrás visible. El valor es dinámico y se lee desde `pokemon.search-delay-ms` en las properties del backend.
*   **Paginación Asíncrona:** Botón "Cargar más" que solicita las siguientes páginas a la API interna sin recargar el navegador.
*   **Diseño Responsivo (Mobile-First):** Index con grilla de tarjetas adaptable (3 columnas en Desktop, 2 columnas ≤700px, 1 columna ≤440px).
*   **Modal de Detalles (Popup):** Interfaz superpuesta al seleccionar una tarjeta, con botón `← Regresar` (también se cierra con la tecla `Escape` o clic en el fondo oscuro).
*   **Manejo de Errores Global:** Estandarización de respuestas HTTP evitando exponer stacktraces al cliente.

---

## 🛠️ Requisitos

*   **Java 17** o superior.
*   **Maven 3.8+** (o abrir el proyecto en IntelliJ / Eclipse / VS Code y ejecutar la clase `PokedexApplication`).
*   **Conexión a internet** activa (requerida para consumir la PokeAPI).

---

## ⚙️ Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/TU_USUARIO/pokemon-spring.git](https://github.com/TU_USUARIO/pokemon-spring.git)
    cd pokemon-spring
    ```

2.  **Ejecutar la aplicación:**
    ```bash
    mvn spring-boot:run
    ```

3.  **Acceder en el navegador:**
    Abre [http://localhost:8080](http://localhost:8080)

---

## 🏗️ Flujo General de Peticiones

El sistema actúa como un intermediario que orquesta y limpia las respuestas masivas de la PokeAPI antes de enviarlas al cliente.

**1. Carga Inicial (MVC):**
`Navegador (GET /)` ➔ `PokemonViewController` ➔ `PokemonService` ➔ `Model` ➔ `templates/index.html (Thymeleaf)`

**2. Navegación Asíncrona (REST):**
`Navegador (JS: GET /api/*)` ➔ `PokemonRestController` ➔ `PokemonService` ➔ `PokemonServiceImpl` ➔ `PokeAPI` 
*(En este punto interviene `PokemonMapper` para limpiar y transformar el JSON crudo)* ➔ `Navegador (Actualiza DOM)`

---

## 📂 Estructura del Código y Conexiones

### Backend (Java)
Ubicado en `src/main/java/com/example/pokedex/`:

*   **`PokedexApplication.java`**: Clase principal con el `main()` que arranca Spring Boot.
*   **`config/`**:
    *   `PokemonProperties.java`: Valores de `application.properties` mapeados como objeto (ej. delay del buscador).
    *   `AppConfig.java`: Configura Beans (como `RestTemplate`) y registra `PokemonProperties`.
*   **`model/` (MODELO)**: Clases de dominio como `PokemonCard`, `PokemonPage`, `PokemonDetail`, `PokemonSpecies`.
*   **`mapper/`**:
    *   `PokemonMapper.java`: Se encarga de transformar el JSON crudo/complejo de la PokeAPI a los modelos limpios internos.
*   **`service/`**:
    *   `PokemonService.java`: Interfaz (contrato) que define los 3 endpoints de negocio.
    *   `impl/PokemonServiceImpl.java`: Implementación que habla con PokeAPI, maneja la caché local y el encadenamiento de peticiones.
*   **`controller/`**:
    *   `PokemonRestController.java`: CONTROLADOR REST que expone los 3 endpoints JSON para el frontend.
    *   `PokemonViewController.java`: CONTROLADOR MVC que devuelve la vista principal de Thymeleaf.
*   **`exception/`**: Excepciones propias y `GlobalExceptionHandler` que formatea los errores en JSON.

### Frontend (Recursos estáticos y Plantillas)
Ubicado en `src/main/resources/`:

*   **`application.properties`**: Configura puerto, URLs base, límites y retraso del buscador (4 s).
*   **`templates/index.html`**: VISTA Thymeleaf (Layout base de 3 columnas, barra de búsqueda y contenedor popup).
*   **`static/css/styles.css`**: Estilos responsivos (transición de 3 → 2 → 1 columnas).
*   **`static/js/api.js`**: Llama a los endpoints REST internos desde el navegador.
*   **`static/js/view.js`**: Dibuja las tarjetas y renderiza los datos en el popup.
*   **`static/js/app.js`**: Controlador del frontend que maneja los eventos de usuario y el debounce de 4 segundos.

---

## 🔌 Los 3 Endpoints REST (Internos)

| # | Método y Ruta | Qué hace |
| :--- | :--- | :--- |
| 1 | `GET /api/pokemon?limit=12&offset=0&search=pika` | Lista paginada de tarjetas (id, nombre, imagen). Si lleva el parámetro `search`, filtra por nombre. |
| 2 | `GET /api/pokemon/{idOrName}` | Detalle principal: tipos, habilidades, estadísticas, altura, peso y url de la especie (`speciesUrl`). |
| 3 | `GET /api/pokemon/{idOrName}/species` | Descripción, categoría, hábitat y evolución. **Encadena llamadas:** endpoint 2 → URL de especie → datos de especie → cadena evolutiva. |

---

## 🚨 Protocolo de Errores

Los errores (400, 404, 500, 502) están encapsulados. Por ejemplo, si no se encuentra un Pokémon, el backend responde con un JSON estandarizado:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Pokemon no encontrado.",
  "timestamp": "2023-10-25T15:30:00Z"
}