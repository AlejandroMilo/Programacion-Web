import { Link, NavLink, Outlet } from 'react-router'

function claseEnlace({ isActive }) {
  return isActive ? 'menu__enlace menu__enlace--activo' : 'menu__enlace'
}

export default function Layout() {
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
