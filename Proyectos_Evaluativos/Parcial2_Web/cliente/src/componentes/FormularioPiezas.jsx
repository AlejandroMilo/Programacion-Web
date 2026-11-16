import { formatearPrecio } from '../constantes/estados'

export default function FormularioPiezas({ piezas, onCambiar, onAgregar, onQuitar }) {
  return (
    <div className="piezas">
      <div className="piezas__cabecera">
        <span>Piezas utilizadas</span>
        <button type="button" className="boton boton--secundario" onClick={onAgregar}>
          + Agregar pieza
        </button>
      </div>

      {piezas.length === 0 && (
        <p className="texto-suave">Sin piezas. El presupuesto puede ser solo mano de obra.</p>
      )}

      {piezas.map((pieza) => {
        const subtotal = Number(pieza.cantidad || 0) * Number(pieza.precio || 0)

        return (
          <div className="piezas__fila" key={pieza._id}>
            <div className="piezas__campo piezas__campo--descripcion">
              <label htmlFor={`descripcion-${pieza._id}`}>Descripción</label>
              <input
                id={`descripcion-${pieza._id}`}
                type="text"
                value={pieza.descripcion}
                onChange={(evento) =>
                  onCambiar(pieza._id, 'descripcion', evento.target.value)
                }
                placeholder="Ej. Pantalla LCD"
              />
            </div>

            <div className="piezas__campo">
              <label htmlFor={`cantidad-${pieza._id}`}>Cantidad</label>
              <input
                id={`cantidad-${pieza._id}`}
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={pieza.cantidad}
                onChange={(evento) =>
                  onCambiar(pieza._id, 'cantidad', evento.target.value)
                }
              />
            </div>

            <div className="piezas__campo">
              <label htmlFor={`precio-${pieza._id}`}>Precio unitario</label>
              <input
                id={`precio-${pieza._id}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={pieza.precio}
                onChange={(evento) =>
                  onCambiar(pieza._id, 'precio', evento.target.value)
                }
              />
            </div>

            <div className="piezas__subtotal">
              <span>Subtotal</span>
              <strong>{formatearPrecio(subtotal)}</strong>
            </div>

            <button
              type="button"
              className="boton boton--peligro boton--icono"
              onClick={() => onQuitar(pieza._id)}
              aria-label={'Quitar pieza ' + (pieza.descripcion || 'sin descripción')}
              title="Quitar pieza"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
