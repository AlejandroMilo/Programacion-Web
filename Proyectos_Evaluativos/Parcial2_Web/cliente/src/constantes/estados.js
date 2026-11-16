// Etapas de una orden y utilidades de presentación.
// Las transiciones coinciden con la tabla del enunciado y con el hook del servidor.

export const ESTADOS = {
  solicitada: {
    etiqueta: 'Solicitada',
    descripcion: 'Equipo recibido, pendiente de revisión.',
    clase: 'estado--solicitada',
    transiciones: ['en_diagnostico', 'cancelada'],
  },
  en_diagnostico: {
    etiqueta: 'En diagnóstico',
    descripcion: 'El taller está revisando el equipo.',
    clase: 'estado--diagnostico',
    transiciones: ['presupuestada'],
  },
  presupuestada: {
    etiqueta: 'Presupuestada',
    descripcion: 'Presupuesto entregado, pendiente de la decisión del cliente.',
    clase: 'estado--presupuestada',
    transiciones: ['aprobada', 'rechazada'],
  },
  aprobada: {
    etiqueta: 'Aprobada',
    descripcion: 'El cliente aceptó el presupuesto.',
    clase: 'estado--aprobada',
    transiciones: ['en_reparacion'],
  },
  rechazada: {
    etiqueta: 'Rechazada',
    descripcion: 'El cliente no aceptó el presupuesto. Orden cerrada.',
    clase: 'estado--rechazada',
    transiciones: [],
  },
  en_reparacion: {
    etiqueta: 'En reparación',
    descripcion: 'El equipo está en reparación.',
    clase: 'estado--reparacion',
    transiciones: ['lista'],
  },
  lista: {
    etiqueta: 'Lista',
    descripcion: 'Reparación terminada, pendiente de entrega.',
    clase: 'estado--lista',
    transiciones: ['entregada'],
  },
  entregada: {
    etiqueta: 'Entregada',
    descripcion: 'El equipo fue entregado al cliente. Orden cerrada.',
    clase: 'estado--entregada',
    transiciones: [],
  },
  cancelada: {
    etiqueta: 'Cancelada',
    descripcion: 'Orden cancelada antes de iniciar la revisión.',
    clase: 'estado--cancelada',
    transiciones: [],
  },
}

export const ORDEN_ESTADOS = [
  'solicitada',
  'en_diagnostico',
  'presupuestada',
  'aprobada',
  'en_reparacion',
  'lista',
  'entregada',
  'rechazada',
  'cancelada',
]

export const ESTADOS_ACTIVOS = [
  'solicitada',
  'en_diagnostico',
  'presupuestada',
  'aprobada',
  'en_reparacion',
  'lista',
]

export const ESTADOS_FINALES = ['rechazada', 'cancelada', 'entregada']

export const ETIQUETAS_ACCION = {
  en_diagnostico: 'Iniciar diagnóstico',
  presupuestada: 'Registrar presupuesto',
  aprobada: 'El cliente aprobó',
  rechazada: 'El cliente rechazó',
  en_reparacion: 'Iniciar reparación',
  lista: 'Marcar como lista',
  entregada: 'Entregar equipo',
  cancelada: 'Cancelar orden',
}

export function etiquetaEstado(estado) {
  return ESTADOS[estado]?.etiqueta || estado
}

export function transicionesDesde(estado) {
  return ESTADOS[estado]?.transiciones || []
}

export function calcularTotal(piezas, manoObra) {
  const lista = Array.isArray(piezas) ? piezas : []
  const totalPiezas = lista.reduce(
    (total, pieza) =>
      total + Number(pieza.cantidad || 0) * Number(pieza.precio || 0),
    0,
  )

  return totalPiezas + Number(manoObra || 0)
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatearFecha(valor) {
  if (!valor) return '—'

  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return '—'

  return formatoFecha.format(fecha)
}

export function formatearPrecio(valor) {
  return '$ ' + formatoPrecio.format(Number(valor || 0))
}
