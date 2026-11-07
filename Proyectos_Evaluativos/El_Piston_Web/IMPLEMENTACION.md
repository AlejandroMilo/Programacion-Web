# Estado de implementación

- [x] Cliente web HTML/CSS/JavaScript responsive.
- [x] Inicio de sesión con PocketBase Auth.
- [x] Panel principal con indicadores y alertas de inventario.
- [x] Pantallas de órdenes, clientes, vehículos, inventario, pagos, historial, reportes y mecánicos.
- [x] Gestión básica de usuarios (rol administrador).
- [x] Migración de colecciones y relaciones.
- [x] Hook de comprobación de salud.
- [x] README y pantallas de referencia en `capturas/`.

## Prueba funcional recomendada antes de entregar

1. Arrancar PocketBase y confirmar que todas las colecciones aparecen.
2. Crear un usuario administrador en `users`.
3. Abrir el cliente mediante servidor estático e iniciar sesión.
4. Crear cliente, vehículo y orden.
5. Añadir trabajo, repuesto y pago parcial.
6. Comprobar que el stock disminuye y que el saldo pendiente cambia.
7. Revisar el historial y los reportes.

**Nota:** el entorno de ejecución no tiene una instancia PocketBase conectada, por lo que no se ha podido ejecutar una prueba integral contra una base de datos real. El código y las migraciones quedan preparados para esa verificación local.
