# TecnoFix — Sistema de gestión de reparaciones

Aplicación web para administrar un taller de reparación de equipos electrónicos (teléfonos, laptops, televisores, consolas…). Sustituye la libreta del taller: registra los equipos que llegan, sigue cada reparación etapa por etapa, guarda el historial completo de cada orden y muestra una visión de conjunto del trabajo.

**Tecnologías:** React (Vite, JavaScript) + React Router en el cliente, y PocketBase como servidor. Las peticiones se hacen con `fetch`; no se usa el SDK de PocketBase ni librerías de componentes o de estado.

> Proyecto del segundo parcial de Programación Web.

---

## 1. Qué hace el sistema

- **Órdenes de reparación:** al recibir un equipo se crea una orden con el cliente, el equipo, el problema reportado y hasta 3 fotos.
- **Flujo por etapas:** cada orden avanza por etapas fijas (solicitada → en_diagnostico → presupuestada → aprobada → en_reparacion → lista → entregada) con dos salidas: rechazada y cancelada. No se pueden saltar etapas.
- **Presupuestos:** diagnóstico, mano de obra y piezas (descripción, cantidad y precio). El total se calcula y no se guarda. Una vez registrado, el presupuesto no se modifica.
- **Historial:** cada cambio de etapa queda registrado con su fecha y nadie puede editarlo ni borrarlo.
- **Panel de control:** indicadores de órdenes activas, presupuestos por decidir, equipos listos para entregar y un resumen por etapa.
- **Clientes:** ficha con sus datos de contacto, sus órdenes y un resumen de su actividad.
- **Tema claro y oscuro:** la interfaz recuerda la preferencia del usuario y respeta la del sistema en la primera visita.

El sistema **no tiene autenticación**: lo usa únicamente el personal del taller (lo pide el enunciado). Los clientes son datos que el taller registra.

## 2. Estructura del proyecto

```text
Parcial2_Web/
├── cliente/                  # Interfaz con React + Vite
│   ├── src/
│   │   ├── api/              # Peticiones fetch a PocketBase
│   │   ├── componentes/      # Componentes reutilizables
│   │   ├── constantes/       # Etapas, transiciones y formatos
│   │   ├── paginas/          # Una página por ruta
│   │   ├── App.jsx           # Rutas de React Router
│   │   └── main.jsx          # Punto de entrada
│   ├── index.html
│   └── package.json
├── servidor/                 # PocketBase
│   ├── pb_hooks/
│   │   └── main.pb.js        # Validaciones e historial (lógica del servidor)
│   ├── pb_migrations/        # Esquema y datos de prueba
│   │   ├── 1794842381_crear_colecciones_taller.js
│   │   ├── 1794850600_ajustar_esquema_taller.js
│   │   └── 1794850700_sembrar_datos_prueba.js
│   └── pb_data/              # Base de datos local (se crea al arrancar, no se sube al repo)
└── README.md
```

## 3. Requisitos

- **Node.js 20 o superior** (probado con Node 24).
- **PocketBase v0.40.x** (el ejecutable **no** se incluye en el repositorio; se descarga en el paso 3).
- Un navegador moderno.
- Conexión a Internet solo la primera vez (para instalar dependencias de npm).

## 4. Cómo levantar el proyecto desde cero

### 4.1 Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Programacion-Web/Proyectos_Evaluativos/Parcial2_Web
```

### 4.2 Descargar PocketBase

Descarga el ejecutable de PocketBase v0.40.x para tu sistema operativo desde <https://github.com/pocketbase/pocketbase/releases> y descomprímelo dentro de la carpeta `servidor/`, de modo que quede así:

```text
servidor/
├── pb_hooks/
├── pb_migrations/
└── pocketbase.exe        # (o "pocketbase" en Linux/macOS)
```

### 4.3 Arrancar el servidor

Abre una terminal en `servidor/` y ejecuta:

```bash
# Windows
.\pocketbase.exe serve

# Linux / macOS
./pocketbase serve
```

La primera vez PocketBase:

1. Crea la base de datos en `servidor/pb_data/`.
2. Aplica automáticamente las tres migraciones: crea las colecciones (`clientes`, `ordenes`, `eventos`), ajusta las reglas de acceso y **siembra los datos de prueba** (sección 5).
3. Te pide crear un administrador del panel (correo y contraseña, opcional para probar, pero recomendado para inspeccionar las colecciones).

El servidor queda escuchando en **http://127.0.0.1:8090** y el panel de administración en **http://127.0.0.1:8090/_/**. Déjalo corriendo.

### 4.4 Arrancar el cliente

En otra terminal:

```bash
cd cliente
npm install
npm run dev
```

Abre **http://localhost:5173**. El cliente se comunica solo con PocketBase: por defecto usa `http://<hostname>:8090` (sección 7).

### 4.5 Verificar que todo funciona

Al entrar a la aplicación deberías ver el panel con los datos de prueba: **2 clientes y 4 órdenes en etapas distintas**. Regístrate un equipo nuevo desde «+ Nueva orden» y comprueba que la orden aparece en «Solicitada» y que cada cambio de etapa se anota en su historial.

## 5. Datos de prueba

Los datos de prueba los prepara la migración `1794850700_sembrar_datos_prueba.js`, que se ejecuta sola en el primer arranque. Es **idempotente**: usa ids fijos y solo crea los registros si no existen, así que puedes reiniciar el servidor sin duplicarlos.

| Colección | Registros |
|---|---|
| `clientes` | María López (300 123 4567) · Carlos Pérez (310 987 6543) |
| `ordenes` | 4 órdenes en etapas distintas, con su historial de eventos |

Las órdenes sembradas:

| Orden | Equipo | Etapa |
|---|---|---|
| `ord000000000001` | iPhone 13 (no enciende) | solicitada |
| `ord000000000002` | Laptop HP Pavilion 15 (no carga la batería) | en_diagnostico |
| `ord000000000003` | Televisor Samsung 55" (líneas horizontales) | presupuestada, con presupuesto completo |
| `ord000000000004` | PlayStation 5 (se apaga sola) | lista, con historial completo |

**Para empezar de cero:** detén el servidor, borra la carpeta `servidor/pb_data/` y vuelve a ejecutar `serve`. PocketBase recreará la base y aplicará todas las migraciones de nuevo.

## 6. Reglas del negocio (implementadas en el servidor)

La interfaz **no** es la medida de seguridad: las reglas se validan en los hooks de PocketBase (`servidor/pb_hooks/main.pb.js`), de modo que se cumplen aunque alguien hable directamente con la API.

- Toda orden nace en `solicitada`, sin diagnóstico, mano de obra ni piezas.
- Las únicas transiciones permitidas son:

  | De | A |
  |---|---|
  | solicitada | en_diagnostico, cancelada |
  | en_diagnostico | presupuestada |
  | presupuestada | aprobada, rechazada |
  | aprobada | en_reparacion |
  | en_reparacion | lista |
  | lista | entregada |

- Una orden solo se cancela mientras está `solicitada`.
- `rechazada`, `cancelada` y `entregada` son estados finales: la orden no cambia más.
- El presupuesto (diagnóstico, mano de obra y piezas) se registra al pasar a `presupuestada` y queda congelado.
- El total del presupuesto se calcula (mano de obra + cantidad × precio de cada pieza) y **no se guarda**.
- Cada cambio de etapa genera un evento en `eventos` con su fecha automática. La API no puede crear, editar ni borrar eventos: solo los escribe el hook.
- Las reglas de acceso bloquean lo que nunca debe ocurrir: borrar clientes, borrar órdenes y tocar eventos.

## 7. Configuración opcional

- **URL del servidor:** si PocketBase no está en la misma máquina o usa otro puerto, copia `cliente/.env.example` como `cliente/.env` y ajusta:

  ```env
  VITE_POCKETBASE_URL=http://192.168.1.50:8090
  ```

  y reinicia `npm run dev`. Sin este archivo se usa `http://<hostname>:8090`.

- **Puertos:** PocketBase usa el 8090 por defecto (`pocketbase serve --http=127.0.0.1:8090`) y Vite el 5173 (`npm run dev -- --port 5173`).

## 8. Comandos útiles

```bash
cd cliente
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # compilar para producción (carpeta dist/)
npm run preview   # probar la compilación de producción
npm run lint      # revisar el código con ESLint
```

## 9. Notas para la evaluación

- Los nombres de colecciones y campos son exactamente los del modelo de datos: `clientes` (nombre, telefono), `ordenes` (cliente, equipo, problema, estado, diagnostico, manoObra, piezas, fotos) y `eventos` (orden, de, a, created).
- El esquema vive en `pb_migrations/` y la lógica en `pb_hooks/`; ambos están dentro del repositorio.
- Sin autenticación por diseño: las reglas de acceso no distinguen quién hace la petición, solo bloquean lo que nunca debe ocurrir; los hooks validan el resto.
- El cliente usa `fetch`, sin SDK de PocketBase ni librerías de componentes o de estado.
- `useMemo` se usa para los cálculos derivados que conviene no repetir en cada render (conteos por etapa, filtros de búsqueda, totales del presupuesto). No se usa `useCallback` porque ninguna función necesita identidad estable. `useRef` guarda la referencia al campo que recibe el foco y a los `input` de archivos para poder limpiarlos.
