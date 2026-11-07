migrate((app) => {
    const staff = '@request.auth.id != ""';
    const admin = '@request.auth.role = "admin"';

    const obtener = (nombre) => app.findCollectionByNameOrId(nombre);

    const agregar = (coleccion, campo) => {
        if (!coleccion.fields.getByName(campo.name)) {
            coleccion.fields.add(campo);
        }
    };

    // Mecánicos del taller, independientes de los usuarios de acceso.
    let mecanicos;

    try {
        mecanicos = obtener("mecanicos");
    } catch (_) {
        mecanicos = new Collection({
            type: "base",
            name: "mecanicos",
            fields: [
                new TextField({ name: "nombre", required: true, min: 2, max: 100 }),
                new TextField({ name: "telefono", max: 30 }),
                new TextField({ name: "especialidad", max: 120 }),
                new BoolField({ name: "activo", default: true })
            ],
            listRule: staff,
            viewRule: staff,
            createRule: staff,
            updateRule: staff,
            deleteRule: admin
        });
        app.save(mecanicos);
    }

    // Configuración del taller.
    let configuracion;

    try {
        configuracion = obtener("configuracion");
    } catch (_) {
        configuracion = new Collection({
            type: "base",
            name: "configuracion",
            fields: [
                new TextField({ name: "clave", required: true, max: 100 }),
                new TextField({ name: "valor", max: 1000 })
            ],
            indexes: [
                "CREATE UNIQUE INDEX idx_configuracion_clave ON configuracion (clave)"
            ],
            listRule: staff,
            viewRule: staff,
            createRule: admin,
            updateRule: admin,
            deleteRule: admin
        });
        app.save(configuracion);
    }

    // Clientes.
    const clientes = obtener("clientes");
    agregar(clientes, new BoolField({ name: "activo", default: true }));
    app.save(clientes);

    // Vehículos.
    const vehiculos = obtener("vehiculos");
    agregar(vehiculos, new BoolField({ name: "activo", default: true }));
    app.save(vehiculos);

    // Órdenes.
    const ordenes = obtener("ordenes");

    // Se conserva el campo antiguo "mecanico".
    // El nuevo campo apunta a la colección de mecánicos.
    agregar(ordenes, new RelationField({
        name: "mecanico_taller",
        collectionId: mecanicos.id,
        maxSelect: 1,
        cascadeDelete: false
    }));

    agregar(ordenes, new RelationField({
        name: "cliente",
        collectionId: clientes.id,
        maxSelect: 1,
        cascadeDelete: false
    }));

    agregar(ordenes, new NumberField({
        name: "kilometraje_entrada",
        min: 0
    }));

    agregar(ordenes, new DateField({
        name: "fecha_cierre"
    }));

    agregar(ordenes, new TextField({
        name: "notas",
        max: 1000
    }));

    app.save(ordenes);

    // Trabajos.
    const trabajos = obtener("trabajos");

    agregar(trabajos, new RelationField({
        name: "mecanico",
        collectionId: mecanicos.id,
        maxSelect: 1,
        cascadeDelete: false
    }));

    agregar(trabajos, new DateField({
        name: "fecha"
    }));

    app.save(trabajos);

    // Repuestos.
    const repuestos = obtener("repuestos");
    agregar(repuestos, new BoolField({ name: "activo", default: true }));
    app.save(repuestos);

    // Repuestos utilizados en órdenes.
    const ordenRepuestos = obtener("orden_repuestos");
    agregar(ordenRepuestos, new DateField({ name: "fecha" }));
    app.save(ordenRepuestos);

    // Pagos.
    const pagos = obtener("pagos");
    agregar(pagos, new TextField({ name: "nota", max: 500 }));
    app.save(pagos);

    // Movimientos de inventario.
    const movimientos = obtener("movimientos_inventario");

    agregar(movimientos, new DateField({
        name: "fecha"
    }));

    agregar(movimientos, new RelationField({
        name: "usuario",
        collectionId: obtener("users").id,
        maxSelect: 1,
        cascadeDelete: false
    }));

    app.save(movimientos);

}, (app) => {
    const quitar = (nombre, campos) => {
        try {
            const c = app.findCollectionByNameOrId(nombre);

            for (const campo of campos) {
                try {
                    c.fields.removeByName(campo);
                } catch (_) {}
            }

            app.save(c);
        } catch (_) {}
    };

    quitar("ordenes", [
        "mecanico_taller",
        "cliente",
        "kilometraje_entrada",
        "fecha_cierre",
        "notas"
    ]);

    quitar("clientes", ["activo"]);
    quitar("vehiculos", ["activo"]);
    quitar("trabajos", ["mecanico", "fecha"]);
    quitar("repuestos", ["activo"]);
    quitar("orden_repuestos", ["fecha"]);
    quitar("pagos", ["nota"]);
    quitar("movimientos_inventario", ["fecha", "usuario"]);

    for (const nombre of ["configuracion", "mecanicos"]) {
        try {
            app.delete(app.findCollectionByNameOrId(nombre));
        } catch (_) {}
    }
});