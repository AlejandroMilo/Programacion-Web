import { Link } from 'react-router'

export default function NoEncontrada() {
  return (
    <div className="pagina pagina--centrada">
      <p className="error-404">404</p>
      <h1>Esta página no existe</h1>
      <p className="texto-suave">
        La dirección que abriste no corresponde a ninguna pantalla del taller.
      </p>
      <Link to="/" className="boton boton--primario">
        Volver al inicio
      </Link>
    </div>
  )
}
