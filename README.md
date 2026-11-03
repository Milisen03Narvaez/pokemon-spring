# 🐾 Pokédex Spring Boot

Aplicación web desarrollada con **Java 17 y Spring Boot 3.2** que permite consultar y explorar información de Pokémon mediante la integración con la [PokeAPI](https://pokeapi.co/).

El proyecto utiliza una arquitectura **MVC**, combinando Thymeleaf para el renderizado inicial de la página y una API REST interna para gestionar las consultas realizadas desde el navegador mediante JavaScript.

La interfaz está desarrollada con HTML, JavaScript y Tailwind CSS.

## 1. Funcionalidades

- **Listado de Pokémon:** muestra tarjetas con el nombre, número e imagen de cada Pokémon.
- **Buscador:** permite filtrar Pokémon por nombre. La búsqueda se ejecuta después de 4 segundos sin escribir.
- **Paginación:** incorpora el botón «Cargar más» para consultar nuevos Pokémon sin recargar la página.
- **Detalle de Pokémon:** muestra información sobre tipos, habilidades, estadísticas, altura, peso y descripción.
- **Información de tipos:** permite consultar las fortalezas, debilidades y Pokémon asociados a cada tipo.
- **Ventanas emergentes:** permite abrir hasta tres niveles de ventanas relacionadas entre sí.
- **Diseño adaptable:** la interfaz se ajusta a diferentes tamaños de pantalla.
- **Manejo de errores:** controla los problemas de conexión y las solicitudes inválidas, devolviendo mensajes en formato JSON.

## 2. Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Java 17 | Lenguaje de programación |
| Spring Boot 3.2 | Desarrollo del backend |
| Spring MVC | Gestión de rutas y solicitudes |
| Thymeleaf | Renderizado de vistas |
| JavaScript | Interacciones y solicitudes asíncronas |
| HTML5 | Estructura de la interfaz |
| Tailwind CSS | Estilos y diseño responsivo |
| PokeAPI | Fuente externa de información |
| Maven | Gestión de dependencias y compilación |
| Docker | Contenerización de la aplicación |

## 3. Requisitos previos

Antes de ejecutar el proyecto, es necesario contar con las siguientes herramientas:

| Herramienta | Versión |
|---|---|
| Java JDK | 17 o superior |
| Maven | 3.8 o superior |
| Docker | Opcional |
| Conexión a Internet | Requerida para consultar la PokeAPI |

## 4. Instalación y ejecución

### Opción A. Ejecutar localmente con Maven

**Paso 1.** Clonar el repositorio:

```bash
git clone https://github.com/Milisen03Narvaez/pokemon-spring.git
```

**Paso 2.** Ingresar a la carpeta del proyecto:

```bash
cd pokemon-spring
```

**Paso 3.** Ejecutar la aplicación:

```bash
mvn spring-boot:run
```

**Paso 4.** Abrir el navegador y acceder a:

```text
http://localhost:8080
```

También se puede importar el proyecto en IntelliJ IDEA y ejecutar la clase principal `PokedexApplication.java`.

### Opción B. Ejecutar con Docker

El proyecto incluye un `Dockerfile` con construcción multi-etapa. La primera etapa compila la aplicación mediante Maven y la segunda utiliza una imagen JRE para ejecutar el archivo `.jar`.

**Paso 1.** Construir la imagen:

```bash
docker build -t pokedex-springboot .
```

**Paso 2.** Crear y ejecutar el contenedor:

```bash
docker run --rm -p 8080:8080 pokedex-springboot
```

**Paso 3.** Acceder desde el navegador:

```text
http://localhost:8080
```

Para detener la aplicación, presionar `Ctrl + C` en la terminal.

## 5. Estructura del proyecto

El proyecto está organizado siguiendo el patrón arquitectónico MVC, separando las responsabilidades de cada componente.

```text
src/
└── main/
    ├── java/
    │   └── com/example/pokedex/
    │       ├── PokedexApplication.java
    │       ├── model/
    │       │   └── Pokemon.java
    │       ├── service/
    │       │   └── PokemonService.java
    │       └── controller/
    │           └── PokemonController.java
    │
    └── resources/
        ├── application.properties
        ├── templates/
        │   └── index.html
        └── static/
            └── js/
                └── app.js
```

### Descripción de los componentes

| Componente | Archivo | Responsabilidad |
|---|---|---|
| Model | `Pokemon.java` | Representa la información de cada Pokémon, incluyendo nombre, imagen, tipos, habilidades y estadísticas. |
| Service | `PokemonService.java` | Gestiona las consultas a la PokeAPI, procesa la información y mantiene en caché el catálogo de nombres. |
| Controller | `PokemonController.java` | Atiende las solicitudes del navegador, muestra la página principal y proporciona los endpoints REST. |
| View | `index.html` | Contiene la estructura visual de la aplicación y utiliza Thymeleaf para mostrar los datos iniciales. |
| JavaScript | `app.js` | Gestiona el buscador, la paginación y las ventanas emergentes mediante solicitudes `fetch`. |
| Configuración | `application.properties` | Define el puerto, la dirección de la PokeAPI y el tamaño de página. |

## 6. Funcionamiento de la aplicación

La aplicación trabaja mediante dos flujos principales:

### 6.1. Carga inicial (MVC)

Cuando el usuario ingresa a la página, Spring Boot procesa la solicitud y obtiene los primeros datos desde la PokeAPI. Posteriormente, Thymeleaf utiliza esa información para generar el HTML que recibe el navegador.

```text
Navegador
    ↓
GET /
    ↓
PokemonController
    ↓
PokemonService
    ↓
PokeAPI
    ↓
Modelo Pokemon
    ↓
Thymeleaf (index.html)
    ↓
Página renderizada
```

### 6.2. Interacciones desde el navegador

Cuando el usuario realiza una búsqueda, solicita más resultados o abre una ventana emergente, JavaScript realiza una petición a la API REST interna mediante `fetch`.

```text
Usuario
    ↓
app.js
    ↓
fetch("/api/...")
    ↓
PokemonController
    ↓
PokemonService
    ↓
PokeAPI
    ↓
Respuesta JSON
    ↓
Actualización del DOM
```

De esta manera, las interacciones posteriores no necesitan recargar toda la página.

## 7. Endpoints de la API REST

La aplicación dispone de cuatro endpoints principales para consultar la información de los Pokémon.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/pokemon?offset=0&limit=30` | Obtiene una lista paginada de Pokémon. |
| GET | `/api/pokemon/search?q=pika` | Busca Pokémon por su nombre. |
| GET | `/api/pokemon/{id}` | Obtiene la información completa de un Pokémon según su ID. |
| GET | `/api/pokemon/tipo/{nombre}` | Consulta la información de un tipo, sus fortalezas, debilidades y Pokémon asociados. |

### Ejemplos de solicitudes

**Obtener los primeros 30 Pokémon:**

```http
GET /api/pokemon?offset=0&limit=30
```

**Buscar un Pokémon:**

```http
GET /api/pokemon/search?q=pika
```

**Consultar el detalle de Pikachu:**

```http
GET /api/pokemon/25
```

**Consultar información del tipo fuego:**

```http
GET /api/pokemon/tipo/fire
```

## 8. Ventanas emergentes (Popups)

La aplicación permite consultar información relacionada mediante un sistema de ventanas emergentes anidadas. Se pueden abrir hasta tres niveles simultáneamente.

| Nivel | Acción | Información mostrada | Endpoint |
|---|---|---|---|
| 1 | Seleccionar una tarjeta de Pokémon. | Imagen, descripción, altura, peso, habilidades, tipos y estadísticas. | `/api/pokemon/{id}` |
| 2 | Seleccionar un tipo dentro del primer popup. | Fortalezas, debilidades y hasta 12 Pokémon relacionados con ese tipo. | `/api/pokemon/tipo/{nombre}` |
| 3 | Seleccionar un Pokémon dentro del segundo popup. | Información resumida del Pokémon seleccionado. | `/api/pokemon/{id}` |

Cada nivel cuenta con una identificación visual propia:

- **Nivel 1:** borde rojo y `z-index: 10`.
- **Nivel 2:** borde azul y `z-index: 20`.
- **Nivel 3:** borde amarillo y `z-index: 30`.

### Cierre de ventanas

- **Botón regresar:** cierra el popup actual y vuelve al nivel anterior.
- **Tecla ESC:** cierra únicamente la ventana que se encuentra en primer plano.
- **Fondo oscuro:** permite cerrar el popup correspondiente.
- **Cierre del primer nivel:** cierra también las ventanas que dependen de él.

Las ventanas se administran mediante una pila (*stack*), por lo que la última ventana abierta es la primera en cerrarse.

## 9. Manejo de errores

El backend controla los errores que pueden producirse durante las consultas y devuelve respuestas en formato JSON.

| Situación | Código HTTP | Respuesta |
|---|---|---|
| Solicitud con datos inválidos, como un ID fuera de rango. | 400 | `{"error": "mensaje"}` |
| Error de conexión o respuesta de la PokeAPI. | 502 | `{"error": "No se pudo consultar la PokeAPI. Intenta de nuevo."}` |

El archivo `app.js` recibe estas respuestas y muestra el mensaje correspondiente en la interfaz, evitando exponer información interna del servidor o stacktraces.

## 10. Control de versiones y trabajo con Git

Para organizar el desarrollo se utilizan ramas por funcionalidad o tarea, relacionadas con las actividades registradas en Jira.

### Flujo de trabajo

```text
feature/POK-n-descripcion
          ↓
      Pull Request
          ↓
          dev
          ↓
      Pull Request
          ↓
          main
```

### Convención de commits

Los commits siguen la siguiente estructura:

```text
tipo(POK-n): descripción
```

Ejemplo:

```bash
git commit -m "docs(POK-3): actualiza README"
```

Se utiliza el identificador de la tarea de Jira para mantener relacionados los cambios realizados con sus respectivas actividades.

## 11. Repositorio

**GitHub:** [pokemon-spring](https://github.com/Milisen03Narvaez/pokemon-spring)

**API externa:** [PokeAPI](https://pokeapi.co/)

---

**Proyecto:** Pokédex Spring Boot  
**Lenguaje:** Java 17  
**Framework:** Spring Boot 3.2  
**Puerto de ejecución:** 8080