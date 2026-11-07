migrate((app) => {
  const staff = '@request.auth.id != ""';
  const admin = '@request.auth.role = "admin"';
  const col = (name) => app.findCollectionByNameOrId(name);

  const addField = (collection, field) => {
    if (!collection.fields.getByName(field.name)) {
      collection.fields.add(field);
    }
  };

  const ensureAutoDates = (collection) => {
    addField(collection, new AutodateField({ name: "created", onCreate: true, onUpdate: false }));
    addField(collection, new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  };

  const saveWithAutoDates = (name) => {
    const collection = col(name);
    ensureAutoDates(collection);
    app.save(collection);
    return collection;
  };

  const mecanicos = col("mecanicos");
  addField(mecanicos, new TextField({ name: "nombre", required: true, min: 2, max: 100 }));
  addField(mecanicos, new TextField({ name: "telefono", max: 30 }));
  addField(mecanicos, new TextField({ name: "especialidad", max: 120 }));
  addField(mecanicos, new BoolField({ name: "activo", default: true }));
  ensureAutoDates(mecanicos);
  mecanicos.listRule = staff;
  mecanicos.viewRule = staff;
  mecanicos.createRule = staff;
  mecanicos.updateRule = staff;
  mecanicos.deleteRule = admin;
  app.save(mecanicos);

  const configuracion = col("configuracion");
  addField(configuracion, new TextField({ name: "clave", required: true, max: 100 }));
  addField(configuracion, new TextField({ name: "valor", max: 1000 }));
  ensureAutoDates(configuracion);
  configuracion.indexes = ["CREATE UNIQUE INDEX idx_configuracion_clave ON configuracion (clave)"];
  configuracion.listRule = staff;
  configuracion.viewRule = staff;
  configuracion.createRule = admin;
  configuracion.updateRule = admin;
  configuracion.deleteRule = admin;
  app.save(configuracion);

  for (const name of ["clientes", "vehiculos", "ordenes", "trabajos", "repuestos", "orden_repuestos", "pagos", "movimientos_inventario"]) {
    saveWithAutoDates(name);
  }

  const now = new Date();
  const AHORA = now.toISOString();
  const day = (n) => new Date(now.getFullYear(), now.getMonth(), n, 0, 0, 0, 0).toISOString();
  const D1 = day(1);
  const D2 = day(2);
  const D3 = day(3);
  const D4 = day(4);
  const D5 = day(5);

  const find = (name, filter) => {
    const rows = app.findRecordsByFilter(name, filter, "-created", 1, 0);
    return rows && rows.length ? rows[0] : null;
  };

  const upsert = (name, filter, data) => {
    let record = find(name, filter);
    if (!record) {
      record = new Record(col(name));
    }
    for (const key in data) {
      record.set(key, data[key]);
    }
    app.save(record);
    return record;
  };

  const adminUser = find("users", "email = 'admin@elpiston.local'");
  const recepcionUser = find("users", "email = 'recepcion@elpiston.local'");
  const mecanicoUser = find("users", "email = 'mecanico@elpiston.local'");

  if (adminUser) {
    adminUser.set("nombre", "Alejandro Pérez");
    adminUser.set("name", "Alejandro Pérez");
    adminUser.set("role", "admin");
    app.save(adminUser);
  }
  if (recepcionUser) {
    recepcionUser.set("nombre", "María Gómez");
    recepcionUser.set("name", "María Gómez");
    recepcionUser.set("role", "recepcionista");
    app.save(recepcionUser);
  }
  if (mecanicoUser) {
    mecanicoUser.set("nombre", "Pedro Ramírez");
    mecanicoUser.set("name", "Pedro Ramírez");
    mecanicoUser.set("role", "mecanico");
    app.save(mecanicoUser);
  }

  const pedro = upsert("mecanicos", "nombre = 'Pedro Ramírez'", {
    nombre: "Pedro Ramírez",
    telefono: "555-1001",
    especialidad: "Motor y transmisión",
    activo: true
  });
  const luis = upsert("mecanicos", "nombre = 'Luis Fernández'", {
    nombre: "Luis Fernández",
    telefono: "555-1002",
    especialidad: "Frenos y suspensión",
    activo: true
  });

  const clientSpecs = [
    ["Carlos Mendoza", "555-1234", "Av. Central 123"],
    ["Lucía Torres", "555-5678", "Calle 5 #45"],
    ["Jorge Ramírez", "555-9012", ""],
    ["Ana Beltrán", "555-3456", "Boulevard Norte 89"],
    ["Miguel Santos", "555-7890", "Calle Los Pinos 12"],
    ["Rosa Herrera", "555-2345", ""]
  ];
  const clients = {};
  for (const [nombre, telefono, direccion] of clientSpecs) {
    clients[nombre] = upsert("clientes", `nombre = '${nombre}'`, { nombre, telefono, direccion, activo: true });
  }

  const vehicleSpecs = [
    ["ABC-123", "Toyota", "Corolla", 2018, 85400, "Carlos Mendoza"],
    ["XYZ-789", "Honda", "Civic", 2020, 42300, "Carlos Mendoza"],
    ["DEF-456", "Nissan", "Sentra", 2016, 120500, "Lucía Torres"],
    ["GHI-012", "Chevrolet", "Aveo", 2019, 76500, "Jorge Ramírez"],
    ["JKL-345", "Ford", "Ranger", 2021, 35200, "Ana Beltrán"],
    ["MNO-678", "Hyundai", "Tucson", 2017, 97800, "Miguel Santos"],
    ["PQR-901", "Kia", "Rio", 2022, 21200, "Rosa Herrera"]
  ];
  const vehicles = {};
  for (const [matricula, marca, modelo, anio, kilometraje, cliente] of vehicleSpecs) {
    vehicles[matricula] = upsert("vehiculos", `matricula = '${matricula}'`, {
      cliente: clients[cliente].id,
      matricula,
      marca,
      modelo,
      anio,
      kilometraje,
      activo: true
    });
  }

  const partSpecs = [
    ["ACE-10W40", "Aceite sintético 10W-40 (5L)", 35, 28, 8],
    ["FIL-ACE", "Filtro de aceite", 12, 18, 6],
    ["FIL-AIR", "Filtro de aire", 15, 4, 6],
    ["BUM-FRE", "Pastillas de freno delanteras", 48, 9, 4],
    ["DIS-FRE", "Disco de freno", 65, 2, 4],
    ["BUI-NGK", "Bujía NGK", 8, 36, 10],
    ["COR-ALT", "Correa de alternador", 22, 7, 3],
    ["REF-ANT", "Refrigerante anticongelante (1L)", 10, 16, 5],
    ["AMO-DEL", "Amortiguador delantero", 85, 1, 3],
    ["BAT-12V", "Batería 12V 60Ah", 120, 5, 2],
    ["LIM-PAR", 'Limpiaparabrisas 22"', 9, 1, 4],
    ["ACE-TRA", "Aceite de transmisión", 28, 10, 4]
  ];
  const parts = {};
  const initialStock = {
    "ACE-10W40": 30,
    "FIL-ACE": 20,
    "FIL-AIR": 6,
    "BUM-FRE": 10,
    "DIS-FRE": 4,
    "BUI-NGK": 40,
    "COR-ALT": 8,
    "REF-ANT": 18,
    "AMO-DEL": 3,
    "BAT-12V": 6,
    "LIM-PAR": 1,
    "ACE-TRA": 10
  };
  for (const [codigo, nombre, precio_venta, existencias, minimo] of partSpecs) {
    parts[codigo] = upsert("repuestos", `codigo = '${codigo}'`, {
      nombre,
      codigo,
      precio_venta,
      existencias,
      minimo,
      activo: true
    });
    upsert("movimientos_inventario", `repuesto = '${parts[codigo].id}' && tipo = 'entrada' && motivo = 'Existencia inicial'`, {
      repuesto: parts[codigo].id,
      tipo: "entrada",
      cantidad: initialStock[codigo],
      motivo: "Existencia inicial",
      fecha: AHORA
    });
  }

  const stateMap = {
    recibida: "recibida",
    enDiagnostico: "diagnostico",
    enReparacion: "reparacion",
    listaParaEntregar: "lista",
    entregada: "entregada",
    cancelada: "cancelada"
  };

  const orderSpecs = [
    ["OS-00001", "Carlos Mendoza", "ABC-123", pedro, D1, "entregada", 84000, D1, "Cambio de aceite y revisión general.", 87, 87],
    ["OS-00002", "Lucía Torres", "DEF-456", luis, D2, "entregada", 119000, D2, "Ruido y vibración al frenar.", 248, 198],
    ["OS-00003", "Jorge Ramírez", "GHI-012", pedro, D3, "entregada", 76000, D3, "Mantenimiento de 80.000 km.", 174, 174],
    ["OS-00004", "Ana Beltrán", "JKL-345", luis, D4, "listaParaEntregar", 35000, null, "La suspensión delantera golpea al pasar por baches.", 300, 0],
    ["OS-00005", "Miguel Santos", "MNO-678", pedro, D4, "enReparacion", 97500, null, "El motor se recalentó y perdió refrigerante.", 97, 0],
    ["OS-00006", "Rosa Herrera", "PQR-901", luis, D4, "enDiagnostico", 21000, null, "Vibración en el volante al frenar.", 20, 0],
    ["OS-00007", "Carlos Mendoza", "XYZ-789", null, D4, "recibida", 42300, null, "El aire acondicionado no enfría.", 0, 0],
    ["OS-00008", "Lucía Torres", "DEF-456", luis, AHORA, "enReparacion", 120500, null, "El vehículo no enciende, posible batería descargada.", 135, 100],
    ["OS-00009", "Jorge Ramírez", "GHI-012", null, AHORA, "recibida", 76500, null, "Revisión general antes de un viaje.", 0, 0],
    ["OS-00010", "Ana Beltrán", "JKL-345", pedro, D1, "cancelada", 34600, D1, "Presupuesto de pintura completa.", 0, 0],
    ["OS-00011", "Rosa Herrera", "PQR-901", luis, D5, "entregada", 20800, D5, "Cambio de limpiaparabrisas y revisión.", 25, 25],
    ["OS-00012", "Miguel Santos", "MNO-678", pedro, D4, "entregada", 96000, D4, "Alineación y balanceo después de cambio de neumáticos.", 45, 45]
  ];
  const orders = {};
  for (const [codigo, cliente, matricula, mechanic, fecha_entrada, estadoAndroid, kilometraje_entrada, fecha_cierre, problema, total, pagado] of orderSpecs) {
    const data = {
      codigo,
      vehiculo: vehicles[matricula].id,
      cliente: clients[cliente].id,
      fecha_entrada,
      problema,
      estado: stateMap[estadoAndroid],
      kilometraje_entrada,
      total,
      pagado
    };
    if (mechanic) {
      data.mecanico_taller = mechanic.id;
    }
    if (fecha_cierre) {
      data.fecha_cierre = fecha_cierre;
    }
    orders[codigo] = upsert("ordenes", `codigo = '${codigo}'`, data);
  }

  const workSpecs = [
    ["OS-00001", "Cambio de aceite y filtro", 25, pedro, D1],
    ["OS-00001", "Revisión general de 20 puntos", 15, pedro, D1],
    ["OS-00002", "Cambio de pastillas delanteras", 40, luis, D2],
    ["OS-00002", "Rectificación de discos", 30, luis, D2],
    ["OS-00003", "Mantenimiento programado", 80, pedro, D3],
    ["OS-00004", "Cambio de amortiguadores delanteros", 100, luis, D4],
    ["OS-00004", "Alineación y balanceo", 30, luis, D4],
    ["OS-00005", "Diagnóstico de sistema de enfriamiento", 20, pedro, D4],
    ["OS-00005", "Cambio de correa de alternador", 35, pedro, D4],
    ["OS-00006", "Diagnóstico de frenos", 20, luis, D4],
    ["OS-00008", "Instalación de batería nueva", 15, luis, AHORA],
    ["OS-00011", "Cambio de limpiaparabrisas", 10, luis, D5],
    ["OS-00012", "Alineación y balanceo", 45, pedro, D4]
  ];
  for (const [codigo, descripcion, precio, mechanic, fecha] of workSpecs) {
    upsert("trabajos", `orden = '${orders[codigo].id}' && descripcion = '${descripcion}'`, {
      orden: orders[codigo].id,
      descripcion,
      precio,
      mecanico: mechanic.id,
      fecha
    });
  }

  const usedPartSpecs = [
    ["OS-00001", "ACE-10W40", 1, 35, D1],
    ["OS-00001", "FIL-ACE", 1, 12, D1],
    ["OS-00002", "BUM-FRE", 1, 48, D2],
    ["OS-00002", "DIS-FRE", 2, 65, D2],
    ["OS-00003", "ACE-10W40", 1, 35, D3],
    ["OS-00003", "FIL-ACE", 1, 12, D3],
    ["OS-00003", "FIL-AIR", 1, 15, D3],
    ["OS-00003", "BUI-NGK", 4, 8, D3],
    ["OS-00004", "AMO-DEL", 2, 85, D4],
    ["OS-00005", "COR-ALT", 1, 22, D4],
    ["OS-00005", "REF-ANT", 2, 10, D4],
    ["OS-00008", "BAT-12V", 1, 120, AHORA],
    ["OS-00011", "FIL-AIR", 1, 15, D5]
  ];
  for (const [codigo, partCode, cantidad, precio_unitario, fecha] of usedPartSpecs) {
    const order = orders[codigo];
    const part = parts[partCode];
    upsert("orden_repuestos", `orden = '${order.id}' && repuesto = '${part.id}'`, {
      orden: order.id,
      repuesto: part.id,
      cantidad,
      precio_unitario,
      fecha
    });
    upsert("movimientos_inventario", `repuesto = '${part.id}' && orden = '${order.id}' && tipo = 'salida' && cantidad = ${cantidad}`, {
      repuesto: part.id,
      orden: order.id,
      tipo: "salida",
      cantidad,
      motivo: "Consumo en orden",
      fecha: AHORA
    });
  }

  const paymentSpecs = [
    ["OS-00001", 87, "efectivo", D1, ""],
    ["OS-00002", 198, "tarjeta", D2, "Abono inicial"],
    ["OS-00003", 174, "transferencia", D3, ""],
    ["OS-00008", 100, "efectivo", AHORA, "Abono"],
    ["OS-00011", 25, "efectivo", D5, ""],
    ["OS-00012", 45, "tarjeta", D4, ""]
  ];
  for (const [codigo, importe, metodo, fecha, nota] of paymentSpecs) {
    const data = {
      orden: orders[codigo].id,
      importe,
      fecha,
      metodo,
      nota
    };
    if (recepcionUser) {
      data.registrado_por = recepcionUser.id;
    }
    upsert("pagos", `orden = '${orders[codigo].id}' && importe = ${importe} && metodo = '${metodo}'`, data);
  }

  const configSpecs = [
    ["tema", "oscuro"],
    ["taller_nombre", "El Pistón"],
    ["taller_telefono", "555-0100"],
    ["taller_direccion", "Av. de los Mecánicos 45"],
    ["umbral_inventario", "5"]
  ];
  for (const [clave, valor] of configSpecs) {
    upsert("configuracion", `clave = '${clave}'`, { clave, valor });
  }
}, (app) => {
  const find = (name, filter) => {
    try {
      const rows = app.findRecordsByFilter(name, filter, "-created", 1, 0);
      return rows && rows.length ? rows[0] : null;
    } catch (_) {
      return null;
    }
  };

  const deleteWhere = (name, filter) => {
    const record = find(name, filter);
    if (record) {
      app.delete(record);
    }
  };

  for (const codigo of ["OS-00001", "OS-00002", "OS-00003", "OS-00004", "OS-00005", "OS-00006", "OS-00007", "OS-00008", "OS-00009", "OS-00010", "OS-00011", "OS-00012"]) {
    const order = find("ordenes", `codigo = '${codigo}'`);
    if (order) {
      for (const name of ["pagos", "orden_repuestos", "trabajos", "movimientos_inventario"]) {
        try {
          const rows = app.findRecordsByFilter(name, `orden = '${order.id}'`, "-created", 500, 0);
          for (const row of rows) app.delete(row);
        } catch (_) {}
      }
      app.delete(order);
    }
  }

  for (const codigo of ["ACE-10W40", "FIL-ACE", "FIL-AIR", "BUM-FRE", "DIS-FRE", "BUI-NGK", "COR-ALT", "REF-ANT", "AMO-DEL", "BAT-12V", "LIM-PAR", "ACE-TRA"]) {
    const part = find("repuestos", `codigo = '${codigo}'`);
    if (part) {
      try {
        const rows = app.findRecordsByFilter("movimientos_inventario", `repuesto = '${part.id}'`, "-created", 500, 0);
        for (const row of rows) app.delete(row);
      } catch (_) {}
      app.delete(part);
    }
  }

  for (const matricula of ["ABC-123", "XYZ-789", "DEF-456", "GHI-012", "JKL-345", "MNO-678", "PQR-901"]) {
    deleteWhere("vehiculos", `matricula = '${matricula}'`);
  }
  for (const nombre of ["Carlos Mendoza", "Lucía Torres", "Jorge Ramírez", "Ana Beltrán", "Miguel Santos", "Rosa Herrera"]) {
    deleteWhere("clientes", `nombre = '${nombre}'`);
  }
  for (const nombre of ["Pedro Ramírez", "Luis Fernández"]) {
    deleteWhere("mecanicos", `nombre = '${nombre}'`);
  }
  for (const clave of ["tema", "taller_nombre", "taller_telefono", "taller_direccion", "umbral_inventario"]) {
    deleteWhere("configuracion", `clave = '${clave}'`);
  }
});
