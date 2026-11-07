migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const userFields = [
    new TextField({ name: "nombre", required: true, min: 2, max: 100 }),
    new SelectField({ name: "role", required: true, maxSelect: 1, values: ["admin", "recepcionista", "mecanico"] }),
  ];
  for (const f of userFields) {
    if (!users.fields.getByName(f.name)) users.fields.add(f);
  }
  users.listRule = '@request.auth.id != ""';
  users.viewRule = '@request.auth.id != ""';
  users.createRule = '@request.auth.role = "admin"';
  users.updateRule = '@request.auth.role = "admin"';
  users.deleteRule = '@request.auth.role = "admin"';
  app.save(users);

  const staff = '@request.auth.id != ""';
  const admin = '@request.auth.role = "admin"';
  const make = (name, fields, indexes = []) => {
    const c = new Collection({
      type: "base", name, fields,
      indexes,
      listRule: staff, viewRule: staff,
      createRule: staff, updateRule: staff, deleteRule: admin,
    });
    app.save(c);
  };

  const clientes = new Collection({ type:"base", name:"clientes", fields:[
    {name:"nombre",type:"text",required:true,min:2,max:120},
    {name:"telefono",type:"text",required:true,max:30},
    {name:"direccion",type:"text",max:250},
  ], listRule:staff, viewRule:staff, createRule:staff, updateRule:staff, deleteRule:admin });
  app.save(clientes);

  const vehiculos = new Collection({ type:"base", name:"vehiculos", fields:[
    {name:"cliente",type:"relation",required:true,collectionId:clientes.id,maxSelect:1,cascadeDelete:false},
    {name:"matricula",type:"text",required:true,max:20},
    {name:"marca",type:"text",required:true,max:60},
    {name:"modelo",type:"text",required:true,max:80},
    {name:"anio",type:"number",required:true,min:1950,max:2100,onlyInt:true},
    {name:"kilometraje",type:"number",min:0},
  ], indexes:["CREATE UNIQUE INDEX idx_vehiculos_matricula ON vehiculos (matricula)"],
  listRule:staff,viewRule:staff,createRule:staff,updateRule:staff,deleteRule:admin });
  app.save(vehiculos);

  const ordenes = new Collection({type:"base",name:"ordenes",fields:[
    {name:"codigo",type:"text",required:true, max:30},
    {name:"vehiculo",type:"relation",required:true,collectionId:vehiculos.id,maxSelect:1},
    {name:"fecha_entrada",type:"date",required:true},
    {name:"problema",type:"text",required:true,max:2000},
    {name:"mecanico",type:"relation",collectionId:users.id,maxSelect:1},
    {name:"estado",type:"select",required:true,maxSelect:1,values:["recibida","diagnostico","reparacion","lista","entregada","cancelada"]},
    {name:"total",type:"number",min:0},
    {name:"pagado",type:"number",min:0},
  ],indexes:["CREATE UNIQUE INDEX idx_ordenes_codigo ON ordenes (codigo)"],
  listRule:staff,viewRule:staff,createRule:staff,updateRule:staff,deleteRule:admin});
  app.save(ordenes);

  make("trabajos",[
    {name:"orden",type:"relation",required:true,collectionId:ordenes.id,maxSelect:1,cascadeDelete:true},
    {name:"descripcion",type:"text",required:true,max:250},
    {name:"precio",type:"number",required:true,min:0},
  ]);

  const repuestos = new Collection({type:"base",name:"repuestos",fields:[
    {name:"nombre",type:"text",required:true,max:120},
    {name:"codigo",type:"text",required:true,max:40},
    {name:"precio_venta",type:"number",required:true,min:0},
    {name:"existencias",type:"number",required:true,min:0,onlyInt:true},
    {name:"minimo",type:"number",min:0,onlyInt:true},
  ],indexes:["CREATE UNIQUE INDEX idx_repuestos_codigo ON repuestos (codigo)"],
  listRule:staff,viewRule:staff,createRule:staff,updateRule:staff,deleteRule:admin});
  app.save(repuestos);

  make("orden_repuestos",[
    {name:"orden",type:"relation",required:true,collectionId:ordenes.id,maxSelect:1,cascadeDelete:true},
    {name:"repuesto",type:"relation",required:true,collectionId:repuestos.id,maxSelect:1},
    {name:"cantidad",type:"number",required:true,min:1,onlyInt:true},
    {name:"precio_unitario",type:"number",required:true,min:0},
  ]);

  make("pagos",[
    {name:"orden",type:"relation",required:true,collectionId:ordenes.id,maxSelect:1,cascadeDelete:true},
    {name:"importe",type:"number",required:true,min:0.01},
    {name:"fecha",type:"date",required:true},
    {name:"metodo",type:"select",required:true,maxSelect:1,values:["efectivo","transferencia","tarjeta"]},
    {name:"registrado_por",type:"relation",collectionId:users.id,maxSelect:1},
  ]);

  make("movimientos_inventario",[
    {name:"repuesto",type:"relation",required:true,collectionId:repuestos.id,maxSelect:1},
    {name:"tipo",type:"select",required:true,maxSelect:1,values:["entrada","salida","ajuste"]},
    {name:"cantidad",type:"number",required:true,min:1,onlyInt:true},
    {name:"motivo",type:"text",max:250},
    {name:"orden",type:"relation",collectionId:ordenes.id,maxSelect:1},
  ]);
}, (app) => {
  for (const name of ["movimientos_inventario","pagos","orden_repuestos","repuestos","trabajos","ordenes","vehiculos","clientes"]) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
  }
  const users = app.findCollectionByNameOrId("users");
  for (const name of ["nombre","role"]) {
    try { users.fields.removeByName(name); } catch (_) {}
  }
  app.save(users);
});
