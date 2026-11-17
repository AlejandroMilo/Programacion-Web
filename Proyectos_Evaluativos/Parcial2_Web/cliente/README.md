# TecnoFix — cliente web

Interfaz en React + Vite del sistema de gestión de reparaciones TecnoFix. Consume la API REST de PocketBase con `fetch` (sin SDK) y usa `react-router` para las rutas.

## Comandos

```bash
npm install
npm run dev     # servidor de desarrollo en http://localhost:5173
npm run build   # compilación de producción en dist/
npm run lint    # revisión con ESLint
```

Antes de arrancar la interfaz debe estar corriendo PocketBase en el puerto 8090. Si el servidor está en otra dirección, crea un archivo `.env` con:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

La documentación completa (instalación, datos de prueba, reglas del negocio y estructura del proyecto) está en el [README principal](../README.md).
