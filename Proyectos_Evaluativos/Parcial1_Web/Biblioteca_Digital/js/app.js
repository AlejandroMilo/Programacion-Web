
const libros = [
    {
        id: 1,
        titulo: "Cien años de soledad",
        autor: "Gabriel García Márquez",
        categoria: "novela",
        descripcion: "Una historia inolvidable sobre la familia Buendía y el pueblo de Macondo.",
        simbolo: "✦",
        color: "#285943",
        fondo: "#e5ede5"
    },
    {
        id: 2,
        titulo: "El principito",
        autor: "Antoine de Saint-Exupéry",
        categoria: "novela",
        descripcion: "Un viaje que nos invita a descubrir el valor de la amistad y la imaginación.",
        simbolo: "★",
        color: "#a94f40",
        fondo: "#f4e5dc"
    },
    {
        id: 3,
        titulo: "Breve historia del tiempo",
        autor: "Stephen Hawking",
        categoria: "ciencia",
        descripcion: "Un recorrido por el universo, los agujeros negros y los misterios del tiempo.",
        simbolo: "☼",
        color: "#344c70",
        fondo: "#e3e9f1"
    },
    {
        id: 4,
        titulo: "Sapiens",
        autor: "Yuval Noah Harari",
        categoria: "historia",
        descripcion: "Una exploración de la historia de la humanidad y de cómo llegamos hasta aquí.",
        simbolo: "⌘",
        color: "#8b673e",
        fondo: "#f0e8dc"
    },
    {
        id: 5,
        titulo: "Clean Code",
        autor: "Robert C. Martin",
        categoria: "tecnologia",
        descripcion: "Principios prácticos para escribir código claro, mantenible y comprensible.",
        simbolo: "{ }",
        color: "#4c477d",
        fondo: "#e9e6f4"
    },
    {
        id: 6,
        titulo: "Cosmos",
        autor: "Carl Sagan",
        categoria: "ciencia",
        descripcion: "Una invitación a explorar el universo y nuestro lugar dentro de él.",
        simbolo: "✧",
        color: "#28556a",
        fondo: "#dfedf0"
    },
    {
        id: 7,
        titulo: "Don Quijote de la Mancha",
        autor: "Miguel de Cervantes",
        categoria: "novela",
        descripcion: "Las aventuras de un caballero que decide perseguir sus ideales.",
        simbolo: "⚔",
        color: "#8b7543",
        fondo: "#f1ead9"
    },
    {
        id: 8,
        titulo: "Una breve historia de casi todo",
        autor: "Bill Bryson",
        categoria: "ciencia",
        descripcion: "Preguntas fascinantes sobre la Tierra, la materia y el origen de la vida.",
        simbolo: "⚛",
        color: "#46705c",
        fondo: "#e2eee7"
    },
    {
        id: 9,
        titulo: "Historia del mundo",
        autor: "J. M. Roberts",
        categoria: "historia",
        descripcion: "Un panorama general de las civilizaciones y sus transformaciones.",
        simbolo: "⌛",
        color: "#8b5145",
        fondo: "#f2e5df"
    }
];

// Elementos de la página
const listaLibros = document.getElementById("lista-libros");
const campoBusqueda = document.getElementById("busqueda-libros");
const filtroCategoria = document.getElementById("filtro-categoria");
const contadorLibros = document.getElementById("contador-libros");
const botonTema = document.getElementById("boton-tema");
const anioActual = document.getElementById("anio-actual");

const nombresCategorias = {
    novela: "Novela",
    ciencia: "Ciencia",
    historia: "Historia",
    tecnologia: "Tecnología"
};

// Comprueba que los elementos necesarios existan en el HTML.
if (
    !listaLibros ||
    !campoBusqueda ||
    !filtroCategoria ||
    !contadorLibros ||
    !botonTema ||
    !anioActual
) {
    console.error(
        "No se encontraron todos los elementos necesarios. " +
        "Revisa los identificadores del archivo index.html."
    );
} else {
    // Convierte el texto a minúsculas y elimina las tildes.
    function normalizarTexto(texto) {
        return texto
            .toLocaleLowerCase("es")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    // Obtiene los libros que coinciden con la búsqueda y la categoría.
    function obtenerLibrosFiltrados() {
        const consulta = normalizarTexto(campoBusqueda.value);
        const categoriaSeleccionada = filtroCategoria.value;

        return libros.filter((libro) => {
            const titulo = normalizarTexto(libro.titulo);
            const autor = normalizarTexto(libro.autor);
            const descripcion = normalizarTexto(libro.descripcion);

            const coincideTexto =
                titulo.includes(consulta) ||
                autor.includes(consulta) ||
                descripcion.includes(consulta);

            const coincideCategoria =
                categoriaSeleccionada === "todos" ||
                libro.categoria === categoriaSeleccionada;

            return coincideTexto && coincideCategoria;
        });
    }

    // Dibuja las tarjetas del catálogo.
    function mostrarLibros() {
        const librosFiltrados = obtenerLibrosFiltrados();

        contadorLibros.textContent =
            `${librosFiltrados.length} ${
                librosFiltrados.length === 1 ? "libro encontrado" : "libros encontrados"
            }`;

        if (librosFiltrados.length === 0) {
            const consulta = campoBusqueda.value.trim();

            listaLibros.innerHTML = `
                <div class="sin-resultados">
                    <h3>No encontramos libros</h3>
                    <p>
                        ${
                            consulta
                                ? `No hay resultados para «${escaparHTML(consulta)}».`
                                : "No hay libros en esta categoría."
                        }
                    </p>
                    <button
                        class="boton-detalle"
                        type="button"
                        id="boton-limpiar-vacio"
                    >
                        Limpiar búsqueda y filtros
                    </button>
                </div>
            `;
            return;
        }

        listaLibros.innerHTML = librosFiltrados.map((libro) => `
            <article class="tarjeta-libro">
                <div
                    class="portada-libro"
                    style="--color-portada: ${libro.fondo}"
                >
                    <div
                        class="miniatura-libro"
                        style="--color-libro: ${libro.color}"
                    >
                        <span aria-hidden="true">${escaparHTML(libro.simbolo)}</span>
                        <strong>${escaparHTML(libro.titulo)}</strong>
                        <small>BIBLIOTECA DIGITAL</small>
                    </div>
                </div>

                <div class="informacion-libro">
                    <span class="categoria-libro">
                        ${nombresCategorias[libro.categoria]}
                    </span>

                    <h3>${escaparHTML(libro.titulo)}</h3>
                    <p class="autor-libro">
                        Por ${escaparHTML(libro.autor)}
                    </p>
                    <p class="descripcion-libro">
                        ${escaparHTML(libro.descripcion)}
                    </p>

                    <button
                        class="boton-detalle"
                        type="button"
                        data-libro-id="${libro.id}"
                    >
                        Ver información
                    </button>
                </div>
            </article>
        `).join("");
    }

    // Evita interpretar como HTML el texto insertado en las tarjetas.
    function escaparHTML(texto) {
        return String(texto).replace(/[&<>"']/g, (caracter) => {
            const entidades = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entidades[caracter];
        });
    }

    // Muestra toda la información del libro seleccionado.
    function mostrarDetalleLibro(id) {
        const libro = libros.find((elemento) => elemento.id === id);

        if (!libro) {
            return;
        }

        alert(
            `Título: ${libro.titulo}\n` +
            `Autor: ${libro.autor}\n` +
            `Categoría: ${nombresCategorias[libro.categoria]}\n\n` +
            `Descripción: ${libro.descripcion}`
        );
    }

    // Limpia el campo de búsqueda y devuelve el filtro a "todos".
    function limpiarFiltros() {
        campoBusqueda.value = "";
        filtroCategoria.value = "todos";
        mostrarLibros();
        campoBusqueda.focus();
    }

    // Búsqueda en tiempo real.
    campoBusqueda.addEventListener("input", mostrarLibros);

    // Filtrado por categoría.
    filtroCategoria.addEventListener("change", mostrarLibros);

    // Gestiona los botones de las tarjetas y el botón de resultados vacíos.
    listaLibros.addEventListener("click", (evento) => {
        const botonLimpiar = evento.target.closest("#boton-limpiar-vacio");

        if (botonLimpiar) {
            limpiarFiltros();
            return;
        }

        const botonDetalle = evento.target.closest("[data-libro-id]");

        if (!botonDetalle) {
            return;
        }

        mostrarDetalleLibro(Number(botonDetalle.dataset.libroId));
    });

    // Cambia entre tema claro y oscuro.
    botonTema.addEventListener("click", () => {
        const temaOscuro = document.body.classList.toggle("tema-oscuro");

        botonTema.setAttribute(
            "aria-label",
            temaOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
        );

        botonTema.title = temaOscuro
            ? "Cambiar a tema claro"
            : "Cambiar a tema oscuro";
    });

    // Muestra el año actual en el pie de página.
    anioActual.textContent = new Date().getFullYear();

    // Primera carga del catálogo.
    mostrarLibros();
}
