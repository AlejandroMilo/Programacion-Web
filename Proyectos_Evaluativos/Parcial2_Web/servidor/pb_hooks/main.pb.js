/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// TECNOFIX · Taller de reparaciones
// Lógica de servidor para la colección "ordenes".
//
// La interfaz no es una medida de seguridad: estas validaciones
// se aplican aunque alguien llame directamente a la API.
// ============================================================

// ============================================================
// 1. Al crear una orden
// Toda orden nace en "solicitada" y sin presupuesto.
// ============================================================
onRecordCreateRequest((e) => {
  e.record.set("estado", "solicitada");
  e.record.set("diagnostico", "");
  e.record.set("manoObra", 0);
  e.record.set("piezas", []);

  e.next();
}, "ordenes");

// ============================================================
// 2. Al actualizar una orden
// - Solo se permiten las transiciones de la tabla.
// - Una orden cerrada no cambia más.
// - El presupuesto se registra al presupuestar y no se toca después.
// ============================================================
onRecordUpdateRequest((e) => {
  // Los hooks de PocketBase no comparten el ámbito global del archivo:
  // las constantes y funciones auxiliares se declaran dentro del hook.
  const ESTADOS_FINALES = ["rechazada", "cancelada", "entregada"];

  const TRANSICIONES = {
    solicitada: ["en_diagnostico", "cancelada"],
    en_diagnostico: ["presupuestada"],
    presupuestada: ["aprobada", "rechazada"],
    aprobada: ["en_reparacion"],
    en_reparacion: ["lista"],
    lista: ["entregada"],
    rechazada: [],
    cancelada: [],
    entregada: [],
  };

  function esNumeroValido(valor) {
    return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
  }

  // Los campos JSON llegan desde la base de datos como una lista de bytes.
  // Esta función los convierte a un valor de JavaScript normal.
  function decodificarJson(valor) {
    if (
      Array.isArray(valor) &&
      valor.every((elemento) => typeof elemento === "number")
    ) {
      let texto = "";

      for (let i = 0; i < valor.length; i++) {
        texto += String.fromCharCode(valor[i]);
      }

      try {
        return JSON.parse(texto);
      } catch (error) {
        return null;
      }
    }

    if (typeof valor === "string") {
      try {
        return JSON.parse(valor);
      } catch (error) {
        return valor;
      }
    }

    return valor;
  }

  // Convierte un valor JSON a texto con las claves ordenadas, para
  // comparar presupuestos sin depender del orden de las propiedades.
  function jsonEstable(valor) {
    if (Array.isArray(valor)) {
      return "[" + valor.map(jsonEstable).join(",") + "]";
    }

    if (valor !== null && typeof valor === "object") {
      const claves = Object.keys(valor).sort();
      return (
        "{" +
        claves
          .map(
            (clave) => JSON.stringify(clave) + ":" + jsonEstable(valor[clave])
          )
          .join(",") +
        "}"
      );
    }

    return JSON.stringify(valor === undefined ? null : valor);
  }

  const original = e.record.original();
  const anterior = original.getString("estado");
  const nuevo = e.record.getString("estado");

  // Una orden rechazada, cancelada o entregada no cambia más.
  if (ESTADOS_FINALES.includes(anterior)) {
    throw new BadRequestError(
      "La orden está cerrada (" + anterior + ") y no admite más cambios."
    );
  }

  // Orden del proceso: no se pueden saltar etapas.
  if (anterior !== nuevo) {
    const permitidas = TRANSICIONES[anterior] || [];

    if (!permitidas.includes(nuevo)) {
      throw new BadRequestError(
        "No se permite pasar de '" + anterior + "' a '" + nuevo + "'."
      );
    }
  }

  const diagnosticoAnterior = original.getString("diagnostico");
  const diagnosticoNuevo = e.record.getString("diagnostico");
  const manoObraAnterior = original.get("manoObra");
  const manoObraNueva = e.record.get("manoObra");
  const piezasAnteriores = jsonEstable(
    decodificarJson(original.get("piezas"))
  );
  const piezasNuevas = jsonEstable(decodificarJson(e.record.get("piezas")));

  const presupuestoCambio =
    diagnosticoAnterior !== diagnosticoNuevo ||
    jsonEstable(manoObraAnterior) !== jsonEstable(manoObraNueva) ||
    piezasAnteriores !== piezasNuevas;

  const seEstaPresupuestando =
    anterior === "en_diagnostico" && nuevo === "presupuestada";

  // El presupuesto solo se escribe al pasar a "presupuestada".
  // Después de eso queda congelado.
  if (presupuestoCambio && !seEstaPresupuestando) {
    throw new BadRequestError(
      "El presupuesto solo se registra al pasar a 'presupuestada' y no se modifica después."
    );
  }

  // Al presupuestar se validan y limpian los datos del presupuesto.
  if (seEstaPresupuestando) {
    const diagnostico = diagnosticoNuevo.trim();

    if (diagnostico === "") {
      throw new BadRequestError(
        "Debes registrar el diagnóstico antes de presupuestar."
      );
    }

    if (!esNumeroValido(manoObraNueva)) {
      throw new BadRequestError(
        "La mano de obra debe ser un número igual o mayor que cero."
      );
    }

    const piezas = decodificarJson(e.record.get("piezas"));

    if (!Array.isArray(piezas)) {
      throw new BadRequestError("Las piezas deben enviarse como una lista.");
    }

    if (piezas.length > 100) {
      throw new BadRequestError("El presupuesto no puede tener más de 100 piezas.");
    }

    const piezasLimpias = [];

    for (let i = 0; i < piezas.length; i++) {
      const pieza = piezas[i];

      if (
        pieza === null ||
        typeof pieza !== "object" ||
        typeof pieza.descripcion !== "string" ||
        pieza.descripcion.trim() === ""
      ) {
        throw new BadRequestError(
          "Cada pieza debe tener una descripción."
        );
      }

      if (!esNumeroValido(pieza.cantidad)) {
        throw new BadRequestError(
          "La cantidad de cada pieza debe ser un número igual o mayor que cero."
        );
      }

      if (!esNumeroValido(pieza.precio)) {
        throw new BadRequestError(
          "El precio de cada pieza debe ser un número igual o mayor que cero."
        );
      }

      piezasLimpias.push({
        descripcion: pieza.descripcion.trim(),
        cantidad: pieza.cantidad,
        precio: pieza.precio,
      });
    }

    e.record.set("diagnostico", diagnostico);
    e.record.set("piezas", piezasLimpias);
  }

  e.next();
}, "ordenes");

// ============================================================
// 3. Historial
// Cada cambio de etapa se guarda en "eventos" con su fecha
// automática. La API no permite crear, editar ni borrar eventos:
// solo este hook, que corre en el servidor.
// ============================================================
onRecordAfterUpdateSuccess((e) => {
  const anterior = e.record.original().getString("estado");
  const nuevo = e.record.getString("estado");

  if (anterior !== nuevo) {
    const coleccion = $app.findCollectionByNameOrId("eventos");
    const evento = new Record(coleccion);

    evento.set("orden", e.record.id);
    evento.set("de", anterior);
    evento.set("a", nuevo);

    $app.save(evento);
  }

  e.next();
}, "ordenes");
