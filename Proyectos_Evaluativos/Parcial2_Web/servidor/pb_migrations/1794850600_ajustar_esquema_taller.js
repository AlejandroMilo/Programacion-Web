/// <reference path="../pb_data/types.d.ts" />

/**
 * Ajustes al esquema del taller.
 *
 * - Agrega los campos automáticos created/updated que exige el historial
 *   (la fecha de cada evento) y que permiten ordenar las órdenes por fecha.
 * - Refuerza las reglas de acceso: nadie puede borrar clientes ni modificar
 *   o borrar eventos desde la API (los eventos solo los crea el hook).
 * - Agrega índices a las relaciones para las consultas más frecuentes.
 *
 * Las reglas de listar/ver/crear/actualizar de clientes y órdenes siguen
 * abiertas porque el sistema no tiene autenticación (lo pide el enunciado).
 */
migrate((app) => {
  // 1. Fechas automáticas en las tres colecciones.
  const nombres = ["clientes", "ordenes", "eventos"];

  for (const nombre of nombres) {
    const coleccion = app.findCollectionByNameOrId(nombre);

    if (!coleccion.fields.getByName("created")) {
      coleccion.fields.add(
        new AutodateField({
          name: "created",
          onCreate: true,
          onUpdate: false,
        })
      );
    }

    if (!coleccion.fields.getByName("updated")) {
      coleccion.fields.add(
        new AutodateField({
          name: "updated",
          onCreate: true,
          onUpdate: true,
        })
      );
    }

    app.save(coleccion);
  }

  // 2. Reglas: borrar clientes queda reservado al panel de administración.
  //    Los eventos ya tienen create/update/delete en null (solo el servidor
  //    los crea) y las órdenes ya tienen delete en null.
  const clientes = app.findCollectionByNameOrId("clientes");
  clientes.deleteRule = null;
  app.save(clientes);

  // 3. Índices para las relaciones y el historial.
  const ordenes = app.findCollectionByNameOrId("ordenes");
  ordenes.indexes.push(
    "CREATE INDEX `idx_ordenes_cliente` ON `ordenes` (`cliente`)"
  );
  app.save(ordenes);

  const eventos = app.findCollectionByNameOrId("eventos");
  eventos.indexes.push(
    "CREATE INDEX `idx_eventos_orden_created` ON `eventos` (`orden`, `created`)"
  );
  app.save(eventos);
}, (app) => {
  // Reversión: quitar los índices y los campos agregados.
  const ordenes = app.findCollectionByNameOrId("ordenes");
  ordenes.indexes = ordenes.indexes.filter(
    (indice) => !indice.includes("idx_ordenes_cliente")
  );
  app.save(ordenes);

  const eventos = app.findCollectionByNameOrId("eventos");
  eventos.indexes = eventos.indexes.filter(
    (indice) => !indice.includes("idx_eventos_orden_created")
  );
  app.save(eventos);

  const clientes = app.findCollectionByNameOrId("clientes");
  clientes.deleteRule = "";
  app.save(clientes);

  for (const nombre of ["clientes", "ordenes", "eventos"]) {
    const coleccion = app.findCollectionByNameOrId(nombre);
    coleccion.fields.removeByName("created");
    coleccion.fields.removeByName("updated");
    app.save(coleccion);
  }
});
