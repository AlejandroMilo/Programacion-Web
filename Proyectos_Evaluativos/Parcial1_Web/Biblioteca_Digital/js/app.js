
"use strict";

/* =========================================================
   BIBLIOTECA DIGITAL
   Datos, reglas de negocio y funcionamiento de la interfaz
   ========================================================= */

const CLAVE_ALMACENAMIENTO = "bibliotecaDigital.v2";
const $ = (id) => document.getElementById(id);

const paletas = [
  { portada: "#e5ede5", libro: "#285943", simbolo: "✦" },
  { portada: "#f4e5dc", libro: "#a94f40", simbolo: "★" },
  { portada: "#e3e9f1", libro: "#344c70", simbolo: "☼" },
  { portada: "#f0e8dc", libro: "#8b673e", simbolo: "⌘" },
  { portada: "#e9e6f4", libro: "#4c477d", simbolo: "{ }" },
  { portada: "#dfedf0", libro: "#28556a", simbolo: "✧" },
  { portada: "#f1ead9", libro: "#8b7543", simbolo: "⚔" },
  { portada: "#e2eee7", libro: "#46705c", simbolo: "⚛" },
  { portada: "#f2e5df", libro: "#8b5145", simbolo: "⌛" }
];

function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function hoyISO() {
  return fechaISO(new Date());
}

function sumarDias(fechaBase, cantidad) {
  const fecha = new Date(`${fechaBase}T12:00:00`);
  fecha.setDate(fecha.getDate() + cantidad);
  return fechaISO(fecha);
}

function diferenciaDias(fechaInicial, fechaFinal) {
  const inicio = new Date(`${fechaInicial}T12:00:00`);
  const final = new Date(`${fechaFinal}T12:00:00`);
  return Math.round((final - inicio) / 86400000);
}

function normalizar(texto) {
  return String(texto ?? "")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);

  if (clase) {
    elemento.className = clase;
  }

  if (texto !== undefined && texto !== null) {
    elemento.textContent = String(texto);
  }

  return elemento;
}

function crearBoton(texto, accion, id, clase = "") {
  const boton = crearElemento("button", clase, texto);
  boton.type = "button";
  boton.dataset.accion = accion;
  boton.dataset.id = String(id);
  return boton;
}

function limpiar(elemento) {
  elemento.replaceChildren();
}

function mostrarMensaje(id, texto, esError = false) {
  const elemento = $(id);

  if (!elemento) return;

  elemento.textContent = texto;
  elemento.classList.toggle("error", esError);
}

function fechaLegible(fecha) {
  if (!fecha) return "—";

  const partes = fecha.split("-");

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* =========================================================
   DATOS INICIALES
   ========================================================= */

function crearDatosIniciales() {
  const hoy = hoyISO();

  const libros = [
    {
      id: 1,
      titulo: "Cien años de soledad",
      autor: "Gabriel García Márquez",
      anio: 1967,
      genero: "Novela",
      comentario: "Una historia sobre la familia Buendía y el pueblo de Macondo.",
      coleccion: false,
      paleta: 0
    },
    {
      id: 2,
      titulo: "El principito",
      autor: "Antoine de Saint-Exupéry",
      anio: 1943,
      genero: "Novela",
      comentario: "Un viaje que nos invita a descubrir el valor de la amistad.",
      coleccion: false,
      paleta: 1
    },
    {
      id: 3,
      titulo: "Breve historia del tiempo",
      autor: "Stephen Hawking",
      anio: 1988,
      genero: "Ciencia",
      comentario: "Un recorrido por el universo, los agujeros negros y el tiempo.",
      coleccion: false,
      paleta: 2
    },
    {
      id: 4,
      titulo: "Sapiens",
      autor: "Yuval Noah Harari",
      anio: 2011,
      genero: "Historia",
      comentario: "Una exploración de la historia de la humanidad.",
      coleccion: true,
      paleta: 3
    },
    {
      id: 5,
      titulo: "Clean Code",
      autor: "Robert C. Martin",
      anio: 2008,
      genero: "Tecnología",
      comentario: "Principios prácticos para escribir código claro y mantenible.",
      coleccion: false,
      paleta: 4
    },
    {
      id: 6,
      titulo: "Cosmos",
      autor: "Carl Sagan",
      anio: 1980,
      genero: "Ciencia",
      comentario: "Una invitación a explorar el universo y nuestro lugar en él.",
      coleccion: false,
      paleta: 5
    },
    {
      id: 7,
      titulo: "Don Quijote de la Mancha",
      autor: "Miguel de Cervantes",
      anio: 1605,
      genero: "Novela",
      comentario: "Las aventuras de un caballero que persigue sus ideales.",
      coleccion: true,
      paleta: 6
    },
    {
      id: 8,
      titulo: "Una breve historia de casi todo",
      autor: "Bill Bryson",
      anio: 2003,
      genero: "Ciencia",
      comentario: "Preguntas fascinantes sobre la Tierra y el origen de la vida.",
      coleccion: false,
      paleta: 7
    },
    {
      id: 9,
      titulo: "Historia del mundo",
      autor: "J. M. Roberts",
      anio: 1976,
      genero: "Historia",
      comentario: "Un panorama de las civilizaciones y sus transformaciones.",
      coleccion: false,
      paleta: 8
    }
  ];

  const prestamos = [
    {
      id: 1,
      idLibro: 1,
      persona: "Ana",
      fechaPrestamo: sumarDias(hoy, -20),
      fechaLimite: sumarDias(hoy, -6),
      fechaDevolucion: null
    },
    {
      id: 2,
      idLibro: 5,
      persona: "Carlos",
      fechaPrestamo: sumarDias(hoy, -4),
      fechaLimite: sumarDias(hoy, 10),
      fechaDevolucion: null
    },
    {
      id: 3,
      idLibro: 2,
      persona: "Lucía",
      fechaPrestamo: sumarDias(hoy, -22),
      fechaLimite: sumarDias(hoy, -8),
      fechaDevolucion: sumarDias(hoy, -9)
    },
    {
      id: 4,
      idLibro: 6,
      persona: "Miguel",
      fechaPrestamo: sumarDias(hoy, -18),
      fechaLimite: sumarDias(hoy, -4),
      fechaDevolucion: sumarDias(hoy, -2)
    }
  ];

  return {
    libros,
    prestamos,
    temaOscuro: false,
    nombreUsuario: "",
    orden: "titulo-asc",
    siguienteLibro: 10,
    siguientePrestamo: 5
  };
}

/* =========================================================
   ESTADO Y ALMACENAMIENTO LOCAL
   ========================================================= */

function cargarEstado() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);

    if (!guardado) {
      return crearDatosIniciales();
    }

    const datos = JSON.parse(guardado);

    if (!datos ||
        !Array.isArray(datos.libros) ||
        !Array.isArray(datos.prestamos)) {
      return crearDatosIniciales();
    }

    const inicial = crearDatosIniciales();

    return {
      ...inicial,
      ...datos,
      siguienteLibro: Number(datos.siguienteLibro) ||
        Math.max(0, ...datos.libros.map(l => Number(l.id) || 0)) + 1,
      siguientePrestamo: Number(datos.siguientePrestamo) ||
        Math.max(0, ...datos.prestamos.map(p => Number(p.id) || 0)) + 1
    };
  } catch (error) {
    console.error("No se pudieron cargar los datos guardados:", error);
    return crearDatosIniciales();
  }
}

let estado = cargarEstado();
let vistaActual = "catalogo";
let accionPendiente = null;
let temporizadorNotificacion = null;

function guardarEstado() {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(estado));
    return true;
  } catch (error) {
    console.error("No se pudieron guardar los datos:", error);
    mostrarNotificacion("No se pudieron guardar los cambios en este navegador.");
    return false;
  }
}

/* =========================================================
   FUNCIONES PARA CONSULTAR LOS DATOS
   ========================================================= */

function buscarLibro(id) {
  return estado.libros.find(libro => libro.id === Number(id));
}

function buscarPrestamoActivo(idLibro) {
  return estado.prestamos.find(prestamo =>
    prestamo.idLibro === Number(idLibro) &&
    prestamo.fechaDevolucion === null
  );
}

function obtenerPrestamosActivos() {
  return estado.prestamos.filter(prestamo => prestamo.fechaDevolucion === null);
}

function obtenerPrestamosDevueltos() {
  return estado.prestamos.filter(prestamo => prestamo.fechaDevolucion !== null);
}

function estaVencido(prestamo) {
  return prestamo.fechaLimite < hoyISO();
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function cambiarVista(nombre) {
  vistaActual = nombre;

  document.querySelectorAll("[data-panel]").forEach(panel => {
    const activa = panel.dataset.panel === nombre;
    panel.hidden = !activa;
    panel.classList.toggle("activa", activa);
  });

  document.querySelectorAll(".enlace-nav[data-vista]").forEach(boton => {
    boton.classList.toggle("activo", boton.dataset.vista === nombre);
  });

  if (nombre === "catalogo") renderizarCatalogo();
  if (nombre === "prestamos") renderizarPrestamos();
  if (nombre === "resumen") renderizarResumen();

  if (nombre === "formulario" && !$("libro-id").value) {
    prepararFormulario();
  }

  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth"
  });
}

document.querySelectorAll("[data-vista]").forEach(boton => {
  boton.addEventListener("click", () => cambiarVista(boton.dataset.vista));
});

/* =========================================================
   ENCABEZADO Y NOTIFICACIONES
   ========================================================= */

function actualizarEncabezado() {
  $("contador-prestamos").textContent = obtenerPrestamosActivos().length;

  $("saludo-usuario").textContent =
    `Hola, ${estado.nombreUsuario.trim() || "lector"}`;

  document.body.classList.toggle("tema-oscuro", estado.temaOscuro);

  $("boton-tema").setAttribute(
    "aria-label",
    estado.temaOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
  );

  $("boton-tema").title =
    estado.temaOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  $("anio-actual").textContent = new Date().getFullYear();
}

function mostrarNotificacion(texto) {
  const elemento = $("notificacion");
  elemento.textContent = texto;
  elemento.classList.add("visible");

  clearTimeout(temporizadorNotificacion);

  temporizadorNotificacion = setTimeout(() => {
    elemento.classList.remove("visible");
  }, 3200);
}

$("boton-tema").addEventListener("click", () => {
  estado.temaOscuro = !estado.temaOscuro;
  guardarEstado();
  actualizarEncabezado();
});

/* =========================================================
   GÉNEROS Y ORDEN DEL CATÁLOGO
   ========================================================= */

const generosPredeterminados = [
  "Novela", "Ciencia", "Historia", "Tecnología",
  "Fantasía", "Poesía", "Otro"
];

function actualizarOpcionesGenero() {
  const selector = $("filtro-genero");
  const seleccionAnterior = selector.value;

  const generos = [
    ...new Set([
      ...generosPredeterminados,
      ...estado.libros.map(libro => libro.genero)
    ])
  ].sort((a, b) => a.localeCompare(b, "es"));

  selector.replaceChildren(new Option("Todos los géneros", "todos"));

  generos.forEach(genero => {
    selector.add(new Option(genero, genero));
  });

  if ([...selector.options].some(opcion => opcion.value === seleccionAnterior)) {
    selector.value = seleccionAnterior;
  }
}

function ordenarLibros(libros) {
  const [campo, direccion] = estado.orden.split("-");

  return [...libros].sort((a, b) => {
    let comparacion;

    if (campo === "anio") {
      comparacion = Number(a.anio) - Number(b.anio);
    } else {
      comparacion = String(a[campo]).localeCompare(
        String(b[campo]),
        "es",
        { sensitivity: "base" }
      );
    }

    return direccion === "desc" ? -comparacion : comparacion;
  });
}

$("orden-catalogo").value = estado.orden;

$("orden-catalogo").addEventListener("change", () => {
  estado.orden = $("orden-catalogo").value;
  guardarEstado();
  renderizarCatalogo();
});

$("busqueda-libros").addEventListener("input", renderizarCatalogo);
$("filtro-genero").addEventListener("change", renderizarCatalogo);
$("filtro-estado").addEventListener("change", renderizarCatalogo);

/* =========================================================
   RENDERIZAR TARJETAS DE LIBROS
   ========================================================= */

function renderizarCatalogo() {
  actualizarOpcionesGenero();

  const consulta = normalizar($("busqueda-libros").value);
  const genero = $("filtro-genero").value;
  const filtroEstado = $("filtro-estado").value;

  const librosFiltrados = ordenarLibros(estado.libros.filter(libro => {
    const coincideTexto =
      normalizar(libro.titulo).includes(consulta) ||
      normalizar(libro.autor).includes(consulta);

    const coincideGenero =
      genero === "todos" || libro.genero === genero;

    const prestamo = buscarPrestamoActivo(libro.id);

    let coincideEstado = true;

    if (filtroEstado === "disponible") {
      coincideEstado = !prestamo && !libro.coleccion;
    } else if (filtroEstado === "prestado") {
      coincideEstado = Boolean(prestamo);
    } else if (filtroEstado === "coleccion") {
      coincideEstado = libro.coleccion;
    }

    return coincideTexto && coincideGenero && coincideEstado;
  }));

  $("contador-libros").textContent =
    `Mostrando ${librosFiltrados.length} de ${estado.libros.length} libros`;

  const contenedor = $("lista-libros");
  limpiar(contenedor);

  if (librosFiltrados.length === 0) {
    const vacio = crearElemento("div", "sin-resultados");
    vacio.append(
      crearElemento("h3", "", "No encontramos libros"),
      crearElemento("p", "", "Prueba a cambiar la búsqueda o los filtros.")
    );

    const boton = crearElemento("button", "boton-secundario", "Limpiar filtros");
    boton.type = "button";
    boton.addEventListener("click", () => {
      $("busqueda-libros").value = "";
      $("filtro-genero").value = "todos";
      $("filtro-estado").value = "todos";
      mostrarMensaje("mensaje-catalogo", "");
      renderizarCatalogo();
    });

    vacio.append(boton);
    contenedor.append(vacio);
    return;
  }

  librosFiltrados.forEach(libro => {
    contenedor.append(crearTarjetaLibro(libro));
  });
}

function crearTarjetaLibro(libro) {
  const tarjeta = crearElemento("article", "tarjeta-libro");
  const paleta = paletas[libro.paleta % paletas.length] || paletas[0];
  const prestamo = buscarPrestamoActivo(libro.id);

  const portada = crearElemento("div", "portada-libro");
  portada.style.setProperty("--color-portada", paleta.portada);

  const miniatura = crearElemento("div", "miniatura-libro");
  miniatura.style.setProperty("--color-libro", paleta.libro);

  miniatura.append(
    crearElemento("span", "", paleta.simbolo),
    crearElemento("strong", "", libro.titulo),
    crearElemento("small", "", "BIBLIOTECA DIGITAL")
  );

  portada.append(miniatura);

  const informacion = crearElemento("div", "informacion-libro");
  informacion.append(
    crearElemento("span", "categoria-libro", libro.genero)
  );

  let estadoLibro;

  if (libro.coleccion) {
    estadoLibro = crearElemento("span", "estado coleccion", "De colección");
  } else if (prestamo && estaVencido(prestamo)) {
    estadoLibro = crearElemento("span", "estado vencido", "Préstamo vencido");
  } else if (prestamo) {
    estadoLibro = crearElemento("span", "estado prestado", "Prestado");
  } else {
    estadoLibro = crearElemento("span", "estado", "Disponible");
  }

  informacion.append(
    estadoLibro,
    crearElemento("h3", "", libro.titulo),
    crearElemento("p", "autor-libro", `Por ${libro.autor}`),
    crearElemento("p", "meta-libro", `Año: ${libro.anio}`),
    crearElemento("p", "descripcion-libro", libro.comentario || "Sin descripción.")
  );

  if (prestamo) {
    const detalle = crearElemento("p", "datos-prestamo");
    detalle.append(
      document.createTextNode(`Prestado a ${prestamo.persona}`),
      document.createElement("br"),
      document.createTextNode(`Fecha límite: ${fechaLegible(prestamo.fechaLimite)}`)
    );

    if (estaVencido(prestamo)) {
      const retraso = crearElemento(
        "span",
        "texto-vencido",
        ` · ${diferenciaDias(prestamo.fechaLimite, hoyISO())} días de retraso`
      );
      detalle.append(retraso);
    }

    informacion.append(detalle);
  }

  const acciones = crearElemento("div", "acciones-tarjeta");

  if (prestamo) {
    acciones.append(
      crearBoton("Registrar devolución", "devolver", prestamo.id)
    );
  } else if (libro.coleccion) {
    const botonNoPrestable = crearElemento("button", "", "No prestable");
    botonNoPrestable.type = "button";
    botonNoPrestable.disabled = true;
    botonNoPrestable.title = "Los libros de colección no se prestan";
    acciones.append(botonNoPrestable);
  } else {
    acciones.append(
      crearBoton("Prestar", "prestar", libro.id, "accion-destacada")
    );
  }

  acciones.append(
    crearBoton("Editar", "editar", libro.id)
  );

  const botonEliminar = crearBoton("Eliminar", "eliminar", libro.id);

  if (prestamo) {
    botonEliminar.disabled = true;
    botonEliminar.title = "No puedes eliminar un libro con préstamo activo";
  }

  acciones.append(botonEliminar);
  informacion.append(acciones);
  tarjeta.append(portada, informacion);

  return tarjeta;
}

/* =========================================================
   FORMULARIO DE LIBROS: AÑADIR Y EDITAR
   ========================================================= */

function prepararFormulario(libro = null) {
  $("form-libro").reset();
  $("libro-id").value = libro ? libro.id : "";

  $("titulo-formulario").textContent =
    libro ? "Editar libro" : "Añadir un libro";

  $("guardar-libro").textContent =
    libro ? "Guardar cambios" : "Guardar libro";

  $("titulo").value = libro?.titulo || "";
  $("autor").value = libro?.autor || "";
  $("anio").value = libro?.anio || "";
  $("genero").value = libro?.genero || "";
  $("comentario").value = libro?.comentario || "";
  $("coleccion").checked = Boolean(libro?.coleccion);

  $("contador-caracteres").textContent = $("comentario").value.length;

  ["titulo", "autor", "anio", "genero"].forEach(campo => {
    $(`error-${campo}`).textContent = "";
  });

  mostrarMensaje("mensaje-formulario", "");
}

$("comentario").addEventListener("input", () => {
  $("contador-caracteres").textContent = $("comentario").value.length;
});

function validarLibro() {
  const valores = {
    titulo: $("titulo").value.trim(),
    autor: $("autor").value.trim(),
    anio: Number($("anio").value),
    genero: $("genero").value
  };

  const errores = {};
  const anioActual = new Date().getFullYear();
  const idActual = Number($("libro-id").value);

  if (valores.titulo.length < 3 || valores.titulo.length > 60) {
    errores.titulo = "El título debe tener entre 3 y 60 caracteres.";
  }

  if (!valores.autor) {
    errores.autor = "Escribe el nombre del autor.";
  }

  if (
    !Number.isInteger(valores.anio) ||
    valores.anio < 1000 ||
    valores.anio > anioActual
  ) {
    errores.anio = `Introduce un año entre 1000 y ${anioActual}.`;
  }

  if (!valores.genero) {
    errores.genero = "Selecciona un género.";
  }

  const duplicado = estado.libros.some(libro =>
    libro.id !== idActual &&
    normalizar(libro.titulo) === normalizar(valores.titulo) &&
    normalizar(libro.autor) === normalizar(valores.autor)
  );

  if (duplicado) {
    errores.titulo = "Ya existe un libro con ese título y autor.";
  }

  ["titulo", "autor", "anio", "genero"].forEach(campo => {
    $(`error-${campo}`).textContent = errores[campo] || "";
  });

  if (Object.keys(errores).length > 0) {
    $(Object.keys(errores)[0]).focus();
    return null;
  }

  return valores;
}

$("form-libro").addEventListener("submit", evento => {
  evento.preventDefault();

  const valores = validarLibro();

  if (!valores) return;

  const id = Number($("libro-id").value);
  const libroExistente = buscarLibro(id);
  const marcarColeccion = $("coleccion").checked;

  if (
    libroExistente &&
    buscarPrestamoActivo(id) &&
    marcarColeccion &&
    !libroExistente.coleccion
  ) {
    mostrarMensaje(
      "mensaje-formulario",
      "No puedes convertir en libro de colección una obra con préstamo activo.",
      true
    );
    return;
  }

  const datosLibro = {
    titulo: valores.titulo,
    autor: valores.autor,
    anio: valores.anio,
    genero: valores.genero,
    comentario: $("comentario").value.trim().slice(0, 120),
    coleccion: marcarColeccion
  };

  if (libroExistente) {
    Object.assign(libroExistente, datosLibro);
  } else {
    estado.libros.push({
      id: estado.siguienteLibro++,
      ...datosLibro,
      paleta: (estado.siguienteLibro + 2) % paletas.length
    });
  }

  guardarEstado();
  actualizarEncabezado();
  renderizarCatalogo();
  renderizarPrestamos();
  renderizarResumen();

  mostrarMensaje(
    "mensaje-formulario",
    libroExistente ? "Cambios guardados correctamente." : "Libro añadido correctamente."
  );

  mostrarNotificacion(
    libroExistente ? "Libro actualizado." : "Libro añadido."
  );

  setTimeout(() => cambiarVista("catalogo"), 550);
});

$("cancelar-formulario").addEventListener("click", () => {
  prepararFormulario();
  cambiarVista("catalogo");
});

/* =========================================================
   PRÉSTAMOS
   ========================================================= */

function abrirDialogoPrestamo(idLibro) {
  const libro = buscarLibro(idLibro);

  if (!libro) return;

  if (libro.coleccion) {
    mostrarNotificacion("Los libros de colección no se pueden prestar.");
    return;
  }

  if (buscarPrestamoActivo(idLibro)) {
    mostrarNotificacion("Este libro ya tiene un préstamo activo.");
    return;
  }

  if (obtenerPrestamosActivos().length >= 3) {
    mostrarMensaje(
      "mensaje-catalogo",
      "Has alcanzado el límite de 3 préstamos activos.",
      true
    );
    mostrarNotificacion("No puedes tener más de 3 préstamos activos.");
    return;
  }

  $("id-libro-prestamo").value = libro.id;
  $("libro-para-prestar").textContent = `Libro: ${libro.titulo}`;
  $("persona-prestamo").value = "";
  $("error-persona").textContent = "";
  mostrarMensaje("mensaje-prestamo", "");

  $("dialogo-prestamo").showModal();
  $("persona-prestamo").focus();
}

$("form-prestamo").addEventListener("submit", evento => {
  evento.preventDefault();

  const persona = $("persona-prestamo").value.trim();

  if (persona.length < 2 || persona.length > 40) {
    $("error-persona").textContent =
      "El nombre debe tener entre 2 y 40 caracteres.";
    $("persona-prestamo").focus();
    return;
  }

  const idLibro = Number($("id-libro-prestamo").value);
  const libro = buscarLibro(idLibro);

  // Se vuelven a comprobar las reglas antes de guardar.
  if (
    !libro ||
    libro.coleccion ||
    buscarPrestamoActivo(idLibro) ||
    obtenerPrestamosActivos().length >= 3
  ) {
    mostrarMensaje(
      "mensaje-prestamo",
      "No se puede registrar este préstamo. Comprueba la disponibilidad y el límite de 3.",
      true
    );
    return;
  }

  const hoy = hoyISO();

  estado.prestamos.push({
    id: estado.siguientePrestamo++,
    idLibro,
    persona,
    fechaPrestamo: hoy,
    fechaLimite: sumarDias(hoy, 14),
    fechaDevolucion: null
  });

  guardarEstado();
  $("dialogo-prestamo").close();

  actualizarEncabezado();
  renderizarCatalogo();
  renderizarPrestamos();
  renderizarResumen();

  mostrarNotificacion(
    `Préstamo registrado. Fecha límite: ${fechaLegible(sumarDias(hoy, 14))}.`
  );
});

document.querySelectorAll("[data-cerrar-dialogo]").forEach(boton => {
  boton.addEventListener("click", () => $("dialogo-prestamo").close());
});

/* =========================================================
   DEVOLUCIONES E HISTORIAL
   ========================================================= */

function registrarDevolucion(idPrestamo) {
  const prestamo = estado.prestamos.find(p =>
    p.id === Number(idPrestamo) && p.fechaDevolucion === null
  );

  if (!prestamo) return;

  prestamo.fechaDevolucion = hoyISO();

  guardarEstado();
  actualizarEncabezado();
  renderizarCatalogo();
  renderizarPrestamos();
  renderizarResumen();

  const retraso = diferenciaDias(
    prestamo.fechaLimite,
    prestamo.fechaDevolucion
  );

  if (retraso > 0) {
    mostrarNotificacion(`Devolución registrada con ${retraso} días de retraso.`);
  } else {
    mostrarNotificacion("Devolución registrada a tiempo.");
  }
}

function renderizarPrestamos() {
  const contenedorActivos = $("lista-activos");
  const contenedorHistorial = $("lista-historial");

  limpiar(contenedorActivos);
  limpiar(contenedorHistorial);

  const listaActivos = obtenerPrestamosActivos()
    .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));

  $("contador-activos").textContent = listaActivos.length;

  if (listaActivos.length === 0) {
    const vacio = crearElemento("div", "sin-resultados");
    vacio.append(
      crearElemento("h3", "", "No hay préstamos activos"),
      crearElemento("p", "", "Cuando prestes un libro, aparecerá aquí.")
    );
    contenedorActivos.append(vacio);
  } else {
    listaActivos.forEach(prestamo => {
      const libro = buscarLibro(prestamo.idLibro);
      const vencido = estaVencido(prestamo);
      const fila = crearElemento(
        "article",
        vencido ? "fila-prestamo vencido" : "fila-prestamo"
      );

      const datos = crearElemento("div");
      datos.append(
        crearElemento("h3", "", libro?.titulo || "Libro no encontrado"),
        crearElemento("p", "", `Prestado a ${prestamo.persona}`),
        crearElemento(
          "p",
          vencido ? "texto-vencido" : "",
          `Fecha límite: ${fechaLegible(prestamo.fechaLimite)}`
        )
      );

      if (vencido) {
        datos.append(
          crearElemento(
            "p",
            "texto-vencido",
            `${diferenciaDias(prestamo.fechaLimite, hoyISO())} días de retraso`
          )
        );
      }

      fila.append(
        datos,
        crearBoton(
          "Registrar devolución",
          "devolver",
          prestamo.id,
          "boton-principal"
        )
      );

      contenedorActivos.append(fila);
    });
  }

  const historial = obtenerPrestamosDevueltos()
    .sort((a, b) => b.fechaDevolucion.localeCompare(a.fechaDevolucion));

  if (historial.length === 0) {
    const vacio = crearElemento("div", "sin-resultados");
    vacio.append(
      crearElemento("p", "", "Todavía no hay devoluciones registradas.")
    );
    contenedorHistorial.append(vacio);
  } else {
    historial.forEach(prestamo => {
      const libro = buscarLibro(prestamo.idLibro);
      const tarde = prestamo.fechaDevolucion > prestamo.fechaLimite;
      const fila = crearElemento("article", "fila-prestamo");
      const datos = crearElemento("div");

      datos.append(
        crearElemento("h3", "", libro?.titulo || "Libro eliminado"),
        crearElemento("p", "", `Persona: ${prestamo.persona}`),
        crearElemento(
          "p",
          "",
          `Préstamo: ${fechaLegible(prestamo.fechaPrestamo)} · Devolución: ${fechaLegible(prestamo.fechaDevolucion)}`
        ),
        crearElemento(
          "p",
          tarde ? "texto-vencido" : "estado-cumplimiento",
          tarde
            ? `Devuelto con ${diferenciaDias(prestamo.fechaLimite, prestamo.fechaDevolucion)} días de retraso`
            : "Devuelto a tiempo"
        )
      );

      fila.append(datos, crearElemento("span", "estado", "Finalizado"));
      contenedorHistorial.append(fila);
    });
  }
}

/* =========================================================
   RESUMEN Y ESTADÍSTICAS
   ========================================================= */

function renderizarResumen() {
  const total = estado.libros.length;

  const prestados = obtenerPrestamosActivos().length;

  const vencidos = obtenerPrestamosActivos()
    .filter(estaVencido).length;

  const disponibles = estado.libros.filter(libro =>
    !libro.coleccion && !buscarPrestamoActivo(libro.id)
  ).length;

  const estadisticas = [
    ["Total de libros", total],
    ["Disponibles", disponibles],
    ["Prestados", prestados],
    ["Vencidos", vencidos]
  ];

  const tarjetas = $("tarjetas-resumen");
  limpiar(tarjetas);

  estadisticas.forEach(([titulo, valor]) => {
    const tarjeta = crearElemento("article", "tarjeta-resumen");
    tarjeta.append(
      crearElemento("span", "", titulo),
      crearElemento("strong", "", valor)
    );
    tarjetas.append(tarjeta);
  });

  const contenedorGeneros = $("resumen-generos");
  limpiar(contenedorGeneros);

  const generos = [
    ...new Set(estado.libros.map(libro => libro.genero))
  ].sort((a, b) => a.localeCompare(b, "es"));

  if (generos.length === 0) {
    contenedorGeneros.append(
      crearElemento("p", "texto-secundario", "No hay libros registrados.")
    );
  }

  generos.forEach(genero => {
    const cantidad = estado.libros.filter(
      libro => libro.genero === genero
    ).length;

    const fila = crearElemento("div", "fila-genero");
    const barraFondo = crearElemento("div", "barra-fondo");
    const barraValor = crearElemento("div", "barra-valor");

    const porcentaje = total ? (cantidad / total) * 100 : 0;
    barraValor.style.width = `${porcentaje}%`;

    barraFondo.append(barraValor);

    fila.append(
      crearElemento("span", "", genero),
      barraFondo,
      crearElemento("strong", "", cantidad)
    );

    contenedorGeneros.append(fila);
  });

  $("nombre-usuario").value = estado.nombreUsuario || "";
}

/* =========================================================
   ELIMINAR LIBROS CON DIÁLOGO PERSONALIZADO
   ========================================================= */

function abrirConfirmacion(titulo, texto, accion) {
  $("titulo-confirmacion").textContent = titulo;
  $("texto-confirmacion").textContent = texto;
  accionPendiente = accion;
  $("dialogo-confirmacion").showModal();
}

function eliminarLibro(id) {
  const libro = buscarLibro(id);

  if (!libro) return;

  if (buscarPrestamoActivo(id)) {
    mostrarNotificacion("No puedes eliminar un libro con préstamo activo.");
    return;
  }

  abrirConfirmacion(
    "Eliminar libro",
    `¿Quieres eliminar «${libro.titulo}» y su historial de préstamos? Esta acción no se puede deshacer.`,
    () => {
      estado.libros = estado.libros.filter(item => item.id !== Number(id));

      estado.prestamos = estado.prestamos.filter(
        prestamo => prestamo.idLibro !== Number(id)
      );

      guardarEstado();
      actualizarEncabezado();
      renderizarCatalogo();
      renderizarPrestamos();
      renderizarResumen();

      mostrarNotificacion("Libro e historial eliminados.");
    }
  );
}

document.querySelectorAll("[data-cerrar-confirmacion]").forEach(boton => {
  boton.addEventListener("click", () => {
    $("dialogo-confirmacion").close();
  });
});

$("confirmar-accion").addEventListener("click", () => {
  const accion = accionPendiente;
  accionPendiente = null;

  $("dialogo-confirmacion").close();

  if (accion) accion();
});

/* =========================================================
   ACCIONES DE LAS TARJETAS
   ========================================================= */

function manejarAccionTarjeta(evento) {
  const boton = evento.target.closest("[data-accion]");

  if (!boton) return;

  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "prestar") {
    abrirDialogoPrestamo(id);
  }

  if (accion === "devolver") {
    registrarDevolucion(id);
  }

  if (accion === "editar") {
    const libro = buscarLibro(id);

    if (libro) {
      prepararFormulario(libro);
      cambiarVista("formulario");
    }
  }

  if (accion === "eliminar") {
    eliminarLibro(id);
  }
}

$("lista-libros").addEventListener("click", manejarAccionTarjeta);
$("lista-activos").addEventListener("click", manejarAccionTarjeta);

/* =========================================================
   PREFERENCIAS DEL USUARIO
   ========================================================= */

$("guardar-nombre").addEventListener("click", () => {
  estado.nombreUsuario = $("nombre-usuario").value.trim().slice(0, 40);

  guardarEstado();
  actualizarEncabezado();

  mostrarMensaje("mensaje-ajustes", "Nombre guardado correctamente.");
  mostrarNotificacion("Preferencias guardadas.");
});

/* =========================================================
   RESTABLECER LOS DATOS
   ========================================================= */

$("restablecer-biblioteca").addEventListener("click", () => {
  abrirConfirmacion(
    "Restablecer biblioteca",
    "Se eliminarán los libros, préstamos y preferencias guardadas. Se restaurarán los datos de ejemplo.",
    () => {
      const temaActual = estado.temaOscuro;

      estado = crearDatosIniciales();
      estado.temaOscuro = temaActual;

      $("busqueda-libros").value = "";
      $("filtro-genero").value = "todos";
      $("filtro-estado").value = "todos";
      $("orden-catalogo").value = estado.orden;

      prepararFormulario();
      guardarEstado();
      actualizarEncabezado();
      renderizarCatalogo();
      renderizarPrestamos();
      renderizarResumen();

      mostrarNotificacion("Biblioteca restablecida.");
    }
  );
});

/* =========================================================
   TECLA ESCAPE Y CIERRE DE DIÁLOGOS
   ========================================================= */

document.addEventListener("keydown", evento => {
  if (
    evento.key === "Escape" &&
    !$("dialogo-prestamo").open &&
    !$("dialogo-confirmacion").open &&
    vistaActual === "formulario"
  ) {
    prepararFormulario();
    cambiarVista("catalogo");
  }
});

[$("dialogo-prestamo"), $("dialogo-confirmacion")].forEach(dialogo => {
  dialogo.addEventListener("click", evento => {
    if (evento.target === dialogo) {
      dialogo.close();
    }
  });
});

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function iniciarAplicacion() {
  actualizarEncabezado();
  actualizarOpcionesGenero();

  $("orden-catalogo").value = estado.orden;

  prepararFormulario();
  renderizarCatalogo();
  renderizarPrestamos();
  renderizarResumen();
}

iniciarAplicacion();
