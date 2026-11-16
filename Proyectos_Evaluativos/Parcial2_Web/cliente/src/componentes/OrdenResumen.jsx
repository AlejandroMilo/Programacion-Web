import { Link } from 'react-router'
import EstadoBadge from './EstadoBadge'
import { calcularTotal, formatearFecha, formatearPrecio } from '../constantes/estados'

export default function OrdenResumen({ orden, mostrarCliente = true }) {
  const cliente = orden.expand?.cliente

  return (
    <Link to={`/ordenes/${orden.id}`} className="orden-resumen">
      <div className="orden-resumen__principal">
        <div className="orden-resumen__titulo">
          <strong>{orden.equipo}</strong>
          <EstadoBadge estado={orden.estado} />
        </div>
        <p className="texto-suave orden-resumen__problema">{orden.problema}</p>
        <div className="orden-resumen__meta">
          {mostrarCliente && (
            <span>Cliente: {cliente?.nombre || 'Sin cliente'}</span>
          )}
          <span>Ingreso: {formatearFecha(orden.created)}</span>
          {orden.estado === 'presupuestada' && (
            <span>
              Presupuesto:{' '}
              {formatearPrecio(calcularTotal(orden.piezas, orden.manoObra))}
            </span>
          )}
        </div>
      </div>
      <span className="orden-resumen__flecha" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
