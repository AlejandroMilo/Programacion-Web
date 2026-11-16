// Capa de acceso a la API de PocketBase usando fetch, como en clase.
// No se usa el SDK: todas las peticiones son HTTP normales.

const URL_POR_DEFECTO = `${window.location.protocol}//${window.location.hostname}:8090`

export const URL_BASE = (
  import.meta.env.VITE_POCKETBASE_URL || URL_POR_DEFECTO
).replace(/\/+$/, "")

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0, datos = null) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.datos = datos
  }
}

function extraerMensaje(datos) {
  if (!datos) return ''

  const detalles = datos.data
    ? Object.values(datos.data)
        .map((campo) => campo?.message)
        .filter(Boolean)
        .join(' ')
    : ''

  return detalles || datos.message || ''
}

async function pedir(ruta, opciones = {}) {
  let respuesta

  try {
    respuesta = await fetch(URL_BASE + ruta, opciones)
  } catch (error) {
    if (error.name === 'AbortError') throw error

    throw new ErrorApi(
      'No se pudo conectar con PocketBase. Comprueba que el servidor esté encendido en ' +
        URL_BASE +
        '.',
    )
  }

  if (!respuesta.ok) {
    let datos = null

    try {
      datos = await respuesta.json()
    } catch {
      // La respuesta de error no era JSON.
    }

    throw new ErrorApi(
      extraerMensaje(datos) || `La petición falló (${respuesta.status}).`,
      respuesta.status,
      datos,
    )
  }

  if (respuesta.status === 204) return null

  return respuesta.json()
}

function consulta(parametros) {
  const partes = Object.entries(parametros)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${clave}=${encodeURIComponent(valor)}`)

  return partes.length > 0 ? `?${partes.join('&')}` : ''
}

// ------------------------------------------------------------------
// Clientes
// ------------------------------------------------------------------

export function listarClientes(signal) {
  return pedir(
    '/api/collections/clientes/records' +
      consulta({ sort: 'nombre', perPage: 200 }),
    { signal },
  )
}

export function obtenerCliente(id, signal) {
  return pedir(`/api/collections/clientes/records/${id}`, { signal })
}

export function crearCliente(datos) {
  return pedir('/api/collections/clientes/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
}

export function actualizarCliente(id, cambios) {
  return pedir(`/api/collections/clientes/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios),
  })
}

// ------------------------------------------------------------------
// Órdenes
// ------------------------------------------------------------------

export function listarOrdenes({ signal, clienteId } = {}) {
  return pedir(
    '/api/collections/ordenes/records' +
      consulta({
        sort: '-created',
        perPage: 200,
        expand: 'cliente',
        filter: clienteId ? `cliente="${clienteId}"` : undefined,
      }),
    { signal },
  )
}

export function obtenerOrden(id, signal) {
  return pedir(
    `/api/collections/ordenes/records/${id}` + consulta({ expand: 'cliente' }),
    { signal },
  )
}

export function crearOrden({ cliente, equipo, problema, fotos = [] }) {
  const formulario = new FormData()

  formulario.append('cliente', cliente)
  formulario.append('equipo', equipo)
  formulario.append('problema', problema)
  formulario.append('estado', 'solicitada')

  for (const foto of fotos) {
    formulario.append('fotos', foto)
  }

  return pedir('/api/collections/ordenes/records', {
    method: 'POST',
    body: formulario,
  })
}

export function actualizarOrden(id, cambios) {
  return pedir(`/api/collections/ordenes/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios),
  })
}

export function agregarFotosOrden(id, fotos) {
  const formulario = new FormData()

  for (const foto of fotos) {
    formulario.append('fotos+', foto)
  }

  return pedir(`/api/collections/ordenes/records/${id}`, {
    method: 'PATCH',
    body: formulario,
  })
}

export function urlArchivo(registro, nombreArchivo) {
  const coleccion = registro.collectionId || 'ordenes'

  return `${URL_BASE}/api/files/${coleccion}/${registro.id}/${nombreArchivo}`
}

// ------------------------------------------------------------------
// Eventos (historial)
// ------------------------------------------------------------------

export function listarEventos(ordenId, signal) {
  return pedir(
    '/api/collections/eventos/records' +
      consulta({
        filter: `orden="${ordenId}"`,
        sort: 'created,id',
        perPage: 200,
      }),
    { signal },
  )
}

// ------------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------------

export function esCancelacion(error) {
  return error?.name === 'AbortError'
}
