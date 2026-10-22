
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

// Elementos principales de la página.
const listaLibros = document.getElementById("lista-libros");
const campoBusqueda = document.getElementById("busqueda-libros");
const filtroCategoria = document.getElementById("filtro-categoria");
const contadorLibros = document.getElementById("contador-libros");
const botonTema = document.getElementById("boton-tema");
const anioActual = document.getElementById("anio-actual");

// Elementos de la ventana de detalles.
const dialogoLibro = document.getElementById("dialogo-libro");
const detalleTitulo = document.getElementById("detalle-titulo");
const detalleAutor = document.getElementById("detalle-autor");
const detalleCategoria = document.getElementById("detalle-categoria");
const detalleDescripcion = document.getElementById("detalle-descripcion");
const botonCerrarDetalle = document.getElementById("boton-cerrar-detalle");
const botonCerrarFinal = document.getElementById("boton-cerrar-final");

const nombresCategorias = {
    novela: "Novela",
    ciencia: "Ciencia",
    historia: "Historia",
    tecnologia: "Tecnología"
};

// Comprueba que existan los elementos principales.
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
        "Revisa los identificadores de index.html."
    );
} else {
    // Normaliza el texto para ignorar mayúsculas y tildes.
    function normalizarTexto(texto) {
        return String(texto)
            .toLocaleLowerCase("es")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    // Escapa texto para evitar que se interprete como HTML.
    function escaparHTML(texto) {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return String(texto).replace(/[&<>"']/g, (caracter) => {
            return entidades[caracter];
        });
    }

    // Devuelve los libros que coinciden con la búsqueda y la categoría.
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

    // Muestra las tarjetas del catálogo.
    function mostrarLibros() {
        const librosFiltrados = obtenerLibrosFiltrados();

        contadorLibros.textContent =
            `${librosFiltrados.length} ${
                librosFiltrados.length === 1
                    ? "libro encontrado"
                    : "libros encontrados"
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
                        aria-label="Ver información de ${escaparHTML(libro.titulo)}"
                    >
                        Ver información
                    </button>
                </div>
            </article>
        `).join("");
    }

    // Abre la ventana con los datos del libro seleccionado.
    function mostrarDetalleLibro(id) {
        const libro = libros.find((elemento) => elemento.id === id);

        if (!libro) {
            return;
        }

        // Si todavía no se ha añadido el diálogo al HTML,
        // muestra la información de manera alternativa.
        if (
            !dialogoLibro ||
            !detalleTitulo ||
            !detalleAutor ||
            !detalleCategoria ||
            !detalleDescripcion ||
            typeof dialogoLibro.showModal !== "function"
        ) {
            alert(
                `Título: ${libro.titulo}\n` +
                `Autor: ${libro.autor}\n` +
                `Categoría: ${nombresCategorias[libro.categoria]}\n\n` +
                `Descripción: ${libro.descripcion}`
            );
            return;
        }

        detalleTitulo.textContent = libro.titulo;
        detalleAutor.textContent = libro.autor;
        detalleCategoria.textContent = nombresCategorias[libro.categoria];
        detalleDescripcion.textContent = libro.descripcion;

        if (!dialogoLibro.open) {
            dialogoLibro.showModal();
        }
    }

    // Cierra la ventana de detalles.
    function cerrarDetalleLibro() {
        if (dialogoLibro && dialogoLibro.open) {
            dialogoLibro.close();
        }
    }

    // Limpia la búsqueda y restablece todas las categorías.
    function limpiarFiltros() {
        campoBusqueda.value = "";
        filtroCategoria.value = "todos";

        mostrarLibros();
        campoBusqueda.focus();
    }

    // Actualiza el catálogo mientras el usuario escribe.
    campoBusqueda.addEventListener("input", mostrarLibros);

    // Actualiza el catálogo al cambiar de categoría.
    filtroCategoria.addEventListener("change", mostrarLibros);

    // Gestiona los clics de las tarjetas mediante un solo evento.
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

    // Registra los eventos de cierre si el diálogo existe en el HTML.
    if (dialogoLibro) {
        if (botonCerrarDetalle) {
            botonCerrarDetalle.addEventListener(
                "click",
                cerrarDetalleLibro
            );
        }

        if (botonCerrarFinal) {
            botonCerrarFinal.addEventListener(
                "click",
                cerrarDetalleLibro
            );
        }

        // Cierra al hacer clic en el fondo de la ventana.
        dialogoLibro.addEventListener("click", (evento) => {
            if (evento.target === dialogoLibro) {
                cerrarDetalleLibro();
            }
        });

        // Escape cierra el diálogo de forma nativa.
    }

    // Alterna entre el tema claro y el oscuro.
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

    // Carga inicial del catálogo.
    mostrarLibros();
}
