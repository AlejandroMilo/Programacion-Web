

migrate((app) => {
  // 1. Colección CLIENTES
  const clientes = new Collection({
    type: "base",
    name: "clientes",
    fields: [
      { name: "nombre", type: "text", required: true },
      { name: "telefono", type: "text", required: true },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });

  app.save(clientes);

  // 2. Colección ORDENES
  const clientesGuardados = app.findCollectionByNameOrId("clientes");

  const ordenes = new Collection({
    type: "base",
    name: "ordenes",
    fields: [
      {
        name: "cliente",
        type: "relation",
        required: true,
        collectionId: clientesGuardados.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "equipo", type: "text", required: true },
      { name: "problema", type: "text", required: true },
      {
        name: "estado",
        type: "select",
        required: true,
        maxSelect: 1,
        values: [
          "solicitada",
          "en_diagnostico",
          "presupuestada",
          "aprobada",
          "rechazada",
          "en_reparacion",
          "lista",
          "entregada",
          "cancelada",
        ],
      },
      { name: "diagnostico", type: "text" },
      { name: "manoObra", type: "number", min: 0 },
      { name: "piezas", type: "json" },
      {
        name: "fotos",
        type: "file",
        maxSelect: 3,
        mimeTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
        ],
      },
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: null,
  });

  app.save(ordenes);

  // 3. Colección EVENTOS
  const ordenesGuardadas = app.findCollectionByNameOrId("ordenes");

  const eventos = new Collection({
    type: "base",
    name: "eventos",
    fields: [
      {
        name: "orden",
        type: "relation",
        required: true,
        collectionId: ordenesGuardadas.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "de", type: "text", required: true },
      { name: "a", type: "text", required: true },
    ],
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  app.save(eventos);
}, (app) => {
  // Reversión: eliminar primero las colecciones dependientes
  app.delete(app.findCollectionByNameOrId("eventos"));
  app.delete(app.findCollectionByNameOrId("ordenes"));
  app.delete(app.findCollectionByNameOrId("clientes"));
});

