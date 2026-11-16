import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

function claseEnlace({ isActive }) {
  return isActive ? 'menu__enlace menu__enlace--activo' : 'menu__enlace'
}

function temaInicial() {
  try {
    const guardado = localStorage.getItem('tema')

    if (guardado === 'oscuro' || guardado === 'claro') {
      return guardado
    }
  } catch {
    // localStorage no disponible: se usa la preferencia del sistema.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'oscuro'
    : 'claro'
}

export default function Layout() {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.tema = tema

    try {
      localStorage.setItem('tema', tema)
    } catch {
      // Sin persistencia, pero el tema sigue funcionando en esta sesión.
    }

    document.documentElement.classList.add('tema-animando')

    const temporizador = setTimeout(() => {
      document.documentElement.classList.remove('tema-animando')
    }, 300)

    return () => clearTimeout(temporizador)
  }, [tema])

  const oscuro = tema === 'oscuro'

  return (
    <div className="app">
      <header className="cabecera">
        <div className="cabecera__contenido">
          <Link to="/" className="marca">
            <span className="marca__icono" aria-hidden="true">
              TF
            </span>
            <span className="marca__texto">
              <strong>TecnoFix</strong>
              <small>Taller de reparaciones</small>
            </span>
          </Link>

          <nav className="menu" aria-label="Navegación principal">
            <NavLink to="/" end className={claseEnlace}>
              Inicio
            </NavLink>
            <NavLink to="/ordenes" className={claseEnlace}>
              Órdenes
            </NavLink>
            <NavLink to="/clientes" className={claseEnlace}>
              Clientes
            </NavLink>
          </nav>

          <button
            type="button"
            className="boton-tema"
            onClick={() => setTema(oscuro ? 'claro' : 'oscuro')}
            aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {oscuro ? (
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>

          <Link to="/ordenes/nueva" className="boton boton--primario cabecera__accion">
            + Nueva orden
          </Link>
        </div>
      </header>

      <main className="contenido">
        <Outlet />
      </main>

      <footer className="pie">
        <p>TecnoFix · Taller de reparaciones de equipos electrónicos</p>
      </footer>
    </div>
  )
}
