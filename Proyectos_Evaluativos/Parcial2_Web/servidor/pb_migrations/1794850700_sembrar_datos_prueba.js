/// <reference path="../pb_data/types.d.ts" />

/**
 * Datos de prueba para arrancar el proyecto en una máquina limpia:
 * 2 clientes y 4 órdenes en etapas distintas (solicitada, en_diagnostico,
 * presupuestada y lista), con su historial de cambios.
 *
 * La migración es idempotente: los registros usan ids fijos y solo se crean
 * si todavía no existen.
 */
migrate((app) => {
  function buscar(coleccion, id) {
    try {
      return app.findRecordById(coleccion, id);
    } catch (error) {
      return null;
    }
  }

  function crear(coleccion, id, datos) {
    if (buscar(coleccion, id)) {
      return;
    }

    const registro = new Record(app.findCollectionByNameOrId(coleccion));
    registro.set("id", id);
    for (const campo in datos) {
      registro.set(campo, datos[campo]);
    }
    app.save(registro);
  }

  // ---------------------------------------------------------------
  // Clientes
  // ---------------------------------------------------------------
  crear("clientes", "cli000000000001", {
    nombre: "María López",
    telefono: "300 123 4567",
  });

  crear("clientes", "cli000000000002", {
    nombre: "Carlos Pérez",
    telefono: "310 987 6543",
  });

  // ---------------------------------------------------------------
  // Órdenes
  // ---------------------------------------------------------------
  // 1. Recién recibida: todavía no se ha revisado.
  crear("ordenes", "ord000000000001", {
    cliente: "cli000000000001",
    equipo: "iPhone 13",
    problema: "No enciende y se calienta al conectarlo al cargador.",
    estado: "solicitada",
    diagnostico: "",
    manoObra: 0,
    piezas: [],
  });

  // 2. En revisión: el diagnóstico y el presupuesto aún no se registran.
  crear("ordenes", "ord000000000002", {
    cliente: "cli000000000002",
    equipo: "Laptop HP Pavilion 15",
    problema: "No carga la batería y la luz del cargador parpadea.",
    estado: "en_diagnostico",
    diagnostico: "",
    manoObra: 0,
    piezas: [],
  });

  // 3. Presupuesto entregado: espera la decisión del cliente.
  crear("ordenes", "ord000000000003", {
    cliente: "cli000000000001",
    equipo: "Televisor Samsung 55\"",
    problema: "Enciende, pero la pantalla muestra líneas horizontales.",
    estado: "presupuestada",
    diagnostico:
      "Falla en la placa T-Con. Se reemplaza la placa y el cable flex dañado.",
    manoObra: 60,
    piezas: [
      { descripcion: "Placa T-Con", cantidad: 1, precio: 45 },
      { descripcion: "Cable flex", cantidad: 1, precio: 8 },
    ],
  });

  // 4. Reparación terminada: lista para entregar al cliente.
  crear("ordenes", "ord000000000004", {
    cliente: "cli000000000002",
    equipo: "Consola PlayStation 5",
    problema: "Se apaga sola a los pocos minutos de jugar.",
    estado: "lista",
    diagnostico:
      "Pasta térmica seca y ventilador obstruido. Se limpia y se cambia la pasta térmica.",
    manoObra: 40,
    piezas: [
      { descripcion: "Pasta térmica", cantidad: 1, precio: 12 },
    ],
  });

  // ---------------------------------------------------------------
  // Historial de las órdenes que ya avanzaron
  // ---------------------------------------------------------------
  const eventos = [
    ["evt000000000001", "ord000000000002", "solicitada", "en_diagnostico"],
    ["evt000000000002", "ord000000000003", "solicitada", "en_diagnostico"],
    ["evt000000000003", "ord000000000003", "en_diagnostico", "presupuestada"],
    ["evt000000000004", "ord000000000004", "solicitada", "en_diagnostico"],
    ["evt000000000005", "ord000000000004", "en_diagnostico", "presupuestada"],
    ["evt000000000006", "ord000000000004", "presupuestada", "aprobada"],
    ["evt000000000007", "ord000000000004", "aprobada", "en_reparacion"],
    ["evt000000000008", "ord000000000004", "en_reparacion", "lista"],
  ];

  for (const [id, orden, de, a] of eventos) {
    crear("eventos", id, { orden, de, a });
  }
}, (app) => {
  // Reversión: primero los eventos, luego las órdenes y por último los clientes.
  const eventos = [
    "evt000000000001",
    "evt000000000002",
    "evt000000000003",
    "evt000000000004",
    "evt000000000005",
    "evt000000000006",
    "evt000000000007",
    "evt000000000008",
  ];
  const ordenes = [
    "ord000000000001",
    "ord000000000002",
    "ord000000000003",
    "ord000000000004",
  ];
  const clientes = ["cli000000000001", "cli000000000002"];

  for (const [coleccion, ids] of [
    ["eventos", eventos],
    ["ordenes", ordenes],
    ["clientes", clientes],
  ]) {
    for (const id of ids) {
      try {
        app.delete(app.findRecordById(coleccion, id));
      } catch (error) {
        // El registro ya no existía.
      }
    }
  }
});
