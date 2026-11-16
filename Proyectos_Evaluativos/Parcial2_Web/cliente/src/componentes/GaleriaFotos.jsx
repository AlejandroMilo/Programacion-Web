import { urlArchivo } from '../api/pocketbase'

export default function GaleriaFotos({ orden, fotos }) {
  if (!fotos || fotos.length === 0) {
    return <p className="texto-suave">Esta orden todavía no tiene fotos.</p>
  }

  return (
    <ul className="galeria">
      {fotos.map((foto) => (
        <li key={foto} className="galeria__item">
          <a
            href={urlArchivo(orden, foto)}
            target="_blank"
            rel="noreferrer"
            title="Abrir foto en tamaño completo"
          >
            <img
              src={urlArchivo(orden, foto)}
              alt={'Foto del equipo: ' + orden.equipo}
              loading="lazy"
            />
          </a>
        </li>
      ))}
    </ul>
  )
}
