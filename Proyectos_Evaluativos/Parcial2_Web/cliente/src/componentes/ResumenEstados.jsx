import { Link } from 'react-router'
import { ORDEN_ESTADOS, ESTADOS, etiquetaEstado } from '../constantes/estados'

export default function ResumenEstados({ conteos }) {
  return (
    <div className="resumen">
      {ORDEN_ESTADOS.map((estado) => (
        <Link
          key={estado}
          to={`/ordenes?estado=${estado}`}
          className={'resumen__tarjeta ' + ESTADOS[estado].clase}
        >
          <span className="resumen__numero">{conteos[estado] || 0}</span>
          <span className="resumen__etiqueta">{etiquetaEstado(estado)}</span>
        </Link>
      ))}
    </div>
  )
}
