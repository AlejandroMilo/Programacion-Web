import { etiquetaEstado, formatearFecha } from '../constantes/estados'

export default function Historial({ eventos }) {
  if (!eventos || eventos.length === 0) {
    return (
      <p className="texto-suave">
        Todavía no hay cambios de etapa registrados para esta orden.
      </p>
    )
  }

  return (
    <ol className="linea-tiempo">
      {eventos.map((evento) => (
        <li key={evento.id} className="linea-tiempo__item">
          <span className="linea-tiempo__punto" aria-hidden="true" />
          <div className="linea-tiempo__contenido">
            <p className="linea-tiempo__cambio">
              <span>{etiquetaEstado(evento.de)}</span>
              <span aria-hidden="true"> → </span>
              <strong>{etiquetaEstado(evento.a)}</strong>
            </p>
            <time className="texto-suave" dateTime={evento.created}>
              {formatearFecha(evento.created)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  )
}
