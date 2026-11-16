import { ESTADOS } from '../constantes/estados'

export default function EstadoBadge({ estado }) {
  const meta = ESTADOS[estado]

  return (
    <span className={'estado ' + (meta?.clase || 'estado--desconocido')}>
      {meta?.etiqueta || estado}
    </span>
  )
}
