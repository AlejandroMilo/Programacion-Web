// Endpoint sencillo para comprobar que el servidor de El Pistón está activo.
routerAdd("GET", "/api/el-piston/health", (e) => {
  return e.json(200, {
    aplicacion: "El Pistón",
    estado: "activo",
    mensaje: "API del taller disponible"
  });
});
