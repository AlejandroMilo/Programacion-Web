# El Pistón — Sistema web de gestión de taller automotriz

Aplicación web para informatizar el trabajo diario de un taller mecánico: clientes, vehículos, órdenes de trabajo, mecánicos, repuestos, inventario, pagos y reportes.

El proyecto tiene dos partes:

- **Servidor:** PocketBase (autenticación, base de datos, relaciones y API).
- **Cliente:** HTML, CSS y JavaScript con el SDK oficial de PocketBase.

Interfaz oscura con detalles en naranja, adaptable a ordenador y móvil.

---

## 1. Requisitos

- Windows 10/11, Linux o macOS.
- PocketBase **v0.26.x** con soporte para migraciones JavaScript.
- Navegador moderno.
- Python (para el servidor estático del cliente) **o** Visual Studio Code con Live Server.
- Conexión a Internet la primera vez, para cargar el SDK desde jsDelivr.

## 2. Estructura del proyecto

```text
El_Piston_Web/
├── cliente/
│   ├── index.html
│   ├── css/estilos.css
│   ├── js/app.js
│   └── assets/capturas/      # logo e imágenes de la interfaz
├── servidor/
│   ├── pb_migrations/        # crear colecciones, ampliar y sembrar datos de prueba
│   ├── pb_hooks/main.pb.js
│   └── pb_data/              # base de datos y archivos (NO se versiona)
├── Capturas de pantallas/    # capturas reales de la web en uso
├── IMPLEMENTACION.md
└── README.md
```

El ejecutable `pocketbase.exe` **no está dentro del proyecto**; se usa una copia compartida de herramientas:

```text
E:\Cosas Universidad\ProyectosVisual\Pocketbases\pocketbase.exe
```

En otro equipo, descarga PocketBase v0.26.x y ajusta esa ruta (o coloca el ejecutable donde prefieras y actualiza los comandos).

`servidor/pb_data/` contiene la base de datos, credenciales y el superusuario: **no debe subirse a un repositorio**. Añade un `.gitignore` que excluya `pb_data/` y las copias `pb_data_respaldo_*` antes de versionar.

## 3. Puesta en marcha paso a paso

Se necesitan **dos terminales abiertas**: una para PocketBase y otra para el cliente web.

### Paso 1 — Iniciar el servidor (PocketBase, puerto 8091)

Abre PowerShell y ejecuta:

```powershell
& "E:\Cosas Universidad\ProyectosVisual\Pocketbases\pocketbase.exe" serve --http=127.0.0.1:8091 --dir "E:\Cosas Universidad\ProyectosVisual\Programacion-Web\Proyectos_Evaluativos\El_Piston_Web\servidor\pb_data" --migrationsDir "E:\Cosas Universidad\ProyectosVisual\Programacion-Web\Proyectos_Evaluativos\El_Piston_Web\servidor\pb_migrations" --hooksDir "E:\Cosas Universidad\ProyectosVisual\Programacion-Web\Proyectos_Evaluativos\El_Piston_Web\servidor\pb_hooks"
```

Mantén la terminal abierta mientras uses la aplicación.

**Solo la primera vez** (si `pb_data` está vacío): PocketBase abre el instalador en `http://127.0.0.1:8091/_/` para crear el **superusuario** del panel administrativo. Ese superusuario administra la base de datos; **no** es una cuenta de acceso a la aplicación web.

Al arrancar, las migraciones de `pb_migrations` se aplican automáticamente (crean las colecciones y siembran los datos de prueba). Si PocketBase ya estaba ejecutándose cuando añadiste migraciones o hooks, **reinícialo** para que se apliquen.

Direcciones del servidor:

| Servicio | Dirección |
|---|---|
| Panel administrativo | http://127.0.0.1:8091/_/ |
| API | http://127.0.0.1:8091/api/ |
| Salud | http://127.0.0.1:8091/api/health |

Comprobar que escucha (en otra terminal):

```powershell
Test-NetConnection 127.0.0.1 -Port 8091
```

Debe aparecer `TcpTestSucceeded : True`.

### Paso 2 — Iniciar el cliente web (puerto 5500)

**Opción A — Python.** En una segunda terminal:

```powershell
cd "E:\Cosas Universidad\ProyectosVisual\Programacion-Web\Proyectos_Evaluativos\El_Piston_Web\cliente"
py -m http.server 5500
```

Abre http://127.0.0.1:5500

**Opción B — Live Server (VS Code).** Abre la carpeta del proyecto en VS Code y usa "Open with Live Server" sobre `cliente/index.html`. La URL queda como http://127.0.0.1:5500/cliente/

El cliente apunta por defecto a PocketBase en:

```text
http://127.0.0.1:8091
```

Puede cambiarse desde la página **Configuración**; recarga la página tras cambiarla. El SDK se carga así:

```javascript
import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.26.2/dist/pocketbase.es.mjs';
```

### Paso 3 — Iniciar sesión

En la pantalla de login escribe uno de estos usuarios y su contraseña:

| Usuario | Rol | Contraseña |
|---|---|---|
| `admin` | Administrador | `admin123` |
| `recepcion` | Recepcionista | `recepcion123` |
| `mecanico` | Mecánico | `mecanico123` |

Estas cuentas ya existen en la colección Auth `users` (las crea la migración de siembra). El cliente traduce cada nombre a su correo (`admin@elpiston.local`, `recepcion@elpiston.local`, `mecanico@elpiston.local`) y autentica por email contra PocketBase; **no existe un campo `username`**. Los valores de `role` son `admin`, `recepcionista` y `mecanico`.

Son credenciales de desarrollo/prueba: cámbialas antes de publicar.

## 4. Datos de prueba (siembra automática)

La migración `1794000002_sembrar_datos_prueba_el_piston.js` carga al arrancar el mismo conjunto de datos de demostración que usa la app Android, para que web y móvil muestren el mismo estado:

- 2 mecánicos, 3 usuarios, 6 clientes, 7 vehículos, 12 repuestos.
- 12 órdenes, 13 trabajos (mano de obra), 13 líneas de repuestos consumidos.
- 6 pagos, 25 movimientos de inventario, 5 claves de configuración.

Es **idempotente** (no duplica registros si ya existen) y **reversible** (`migrate down`). Tras la siembra, el saldo pendiente total es 502 y quedan 4 repuestos bajo stock, igual que en Android.

Si prefieres una instalación limpia sin demostración, registra tus propios datos en este orden: clientes → vehículos → repuestos → órdenes → trabajos → repuestos de la orden → pagos → movimientos de inventario.

## 5. Colecciones

Al iniciar deben aparecer en Collections:

| Colección | Función |
|---|---|
| `users` (Auth) | Cuentas del personal; campos extra `nombre` y `role` |
| `clientes` | Datos de los clientes |
| `vehiculos` | Vehículos de cada cliente |
| `ordenes` | Órdenes de trabajo |
| `trabajos` | Mano de obra / servicios de cada orden |
| `repuestos` | Inventario |
| `orden_repuestos` | Repuestos consumidos por orden |
| `pagos` | Cobros de las órdenes |
| `movimientos_inventario` | Entradas, salidas y ajustes |
| `mecanicos` | Mecánicos del taller |
| `configuracion` | Preferencias (tema, nombre/teléfono/dirección del taller, umbral) |

Relaciones clave: un cliente tiene varios vehículos; un vehículo tiene varias órdenes; una orden tiene trabajos, repuestos consumidos y pagos; cada orden puede asignar un mecánico.

## 6. Roles y permisos

- **Administrador:** gestión general y de usuarios.
- **Recepcionista:** clientes, vehículos, órdenes y pagos.
- **Mecánico:** consulta y actualización de sus órdenes y trabajos.

La interfaz oculta opciones según el rol, pero la seguridad real la aplican las **reglas de acceso de PocketBase** en el servidor.

## 7. Solución de problemas

- **La página no abre:** comprueba que el servidor del cliente (Paso 2) sigue corriendo y abre la URL correcta (`:5500` o `:5500/cliente/` según Live Server).
- **PocketBase no responde:** `Test-NetConnection 127.0.0.1 -Port 8091`; si falla, inicia PocketBase (Paso 1).
- **El login no funciona:** verifica que PocketBase está activo, que existen los tres usuarios, que escribes `recepcion` (no `recepcio`) y que la contraseña coincide.
- **El panel aparece vacío:** comprueba que la migración de siembra se aplicó (reinicia PocketBase si añadiste migraciones con el servidor corriendo); revisa reglas de acceso y la consola del navegador.
- **El servidor se detuvo:** vuelve a ejecutar PocketBase; los datos de `pb_data` se conservan al cerrar normalmente.

## 8. Seguridad y antes de publicar
clear
- No versionar `pb_data/` ni respaldos (contienen credenciales y superusuario).
- Cambiar las contraseñas de demo y la del superusuario.
- Configurar HTTPS y reglas de acceso en todas las colecciones.
- Hacer copias de seguridad de `pb_data`.
- Proteger en el servidor las operaciones sensibles (p. ej. descuento de existencias).
- Sustituir `127.0.0.1` por la dirección pública del despliegue.

## 9. Capturas de pantallas

- `Capturas de pantallas/`: capturas reales de la web funcionando con los datos de prueba (escritorio y móvil).