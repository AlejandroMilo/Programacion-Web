import { ETIQUETAS_ACCION, transicionesDesde } from '../constantes/estados'

const CONFIRMACIONES = {
  cancelada:
    '¿Cancelar la orden? Solo se puede hacer antes de iniciar la revisión.',
  rechazada: '¿Registrar que el cliente rechazó el presupuesto? La orden se cerrará.',
  entregada: '¿Confirmar que el equipo fue entregado al cliente? La orden se cerrará.',
}

export default function AccionesOrden({ orden, onCambiarEstado, actualizando }) {
  const transiciones = transicionesDesde(orden.estado)

  if (transiciones.length === 0) {
    return (
      <div className="aviso aviso--cerrada">
        <p>Esta orden está cerrada y ya no admite cambios.</p>
      </div>
    )
  }

  // Al presupuestar se usa el formulario, no un botón simple.
  const simples = transiciones.filter(
    (destino) => !(orden.estado === 'en_diagnostico' && destino === 'presupuestada'),
  )

  if (simples.length === 0) return null

  function manejarClick(destino) {
    if (CONFIRMACIONES[destino] && !window.confirm(CONFIRMACIONES[destino])) {
      return
    }

    onCambiarEstado(destino)
  }

  return (
    <div className="acciones">
      {simples.map((destino) => {
        const peligrosa = destino === 'cancelada' || destino === 'rechazada'

        return (
          <button
            key={destino}
            type="button"
            className={
              'boton ' + (peligrosa ? 'boton--peligro' : 'boton--primario')
            }
            onClick={() => manejarClick(destino)}
            disabled={actualizando}
          >
            {ETIQUETAS_ACCION[destino] || destino}
          </button>
        )
      })}
    </div>
  )
}
