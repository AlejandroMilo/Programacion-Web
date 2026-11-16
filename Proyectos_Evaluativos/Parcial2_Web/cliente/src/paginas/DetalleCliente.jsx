import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  actualizarCliente,
  esCancelacion,
  listarOrdenes,
  obtenerCliente,
} from '../api/pocketbase'
import { ESTADOS_ACTIVOS } from '../constantes/estados'
import Campo from '../componentes/Campo'
import Cargando from '../componentes/Cargando'
import EstadoBadge from '../componentes/EstadoBadge'
import MensajeError from '../componentes/MensajeError'
import OrdenResumen from '../componentes/OrdenResumen'
import Vacio from '../componentes/Vacio'

export default function DetalleCliente() {
  const { id } = useParams()

  const [cliente, setCliente] = useState(null)
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [errorFormulario, setErrorFormulario] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()

    Promise.all([
      obtenerCliente(id, controlador.signal),
      listarOrdenes({ clienteId: id, signal: controlador.signal }),
    ])
      .then(([clienteCargado, ordenesCargadas]) => {
        setCliente(clienteCargado)
        setOrdenes(ordenesCargadas.items)
        setNombre(clienteCargado.nombre)
        setTelefono(clienteCargado.telefono)
      })
      .catch((fallo) => {
        if (!esCancelacion(fallo)) setError(fallo.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [id])

  async function guardar(evento) {
    evento.preventDefault()
    setErrorFormulario('')
    setMensaje('')

    if (!nombre.trim() || !telefono.trim()) {
      setErrorFormulario('Escribe el nombre y el teléfono del cliente.')
      return
    }

    setGuardando(true)

    try {
      const actualizado = await actualizarCliente(id, {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      })

      setCliente(actualizado)
      setMensaje('Datos del cliente actualizados.')
      setEditando(false)
    } catch (fallo) {
      setErrorFormulario(fallo.message)
    } finally {
      setGuardando(false)
    }
  }

  // Solo se muestra el cliente cuando coincide con el id de la URL.
  const clienteVisible = cliente && cliente.id === id ? cliente : null

  if (!clienteVisible && (cargando || !error)) {
    return (
      <div className="pagina">
        <Cargando texto="Cargando el cliente…" />
      </div>
    )
  }

  if (!clienteVisible) {
    return (
      <div className="pagina">
        <MensajeError mensaje={error || 'No se encontró el cliente.'} />
        <Link to="/clientes" className="boton boton--secundario">
          Volver a los clientes
        </Link>
      </div>
    )
  }

  const activas = ordenes.filter((orden) => ESTADOS_ACTIVOS.includes(orden.estado))

  return (
    <div className="pagina">
      <nav className="migas" aria-label="Migas de pan">
        <Link to="/clientes">Clientes</Link>
        <span aria-hidden="true"> / </span>
        <span>{cliente.nombre}</span>
      </nav>

      <div className="pagina__cabecera">
        <div>
          <p className="pagina__saludo">Ficha del cliente</p>
          <h1>{cliente.nombre}</h1>
          <p className="texto-suave">{cliente.telefono}</p>
        </div>
        <div className="fila-botones">
          <Link
            to={`/ordenes/nueva?cliente=${cliente.id}`}
            className="boton boton--primario"
          >
            + Nueva orden
          </Link>
          <Link to="/clientes" className="boton boton--secundario">
            Volver
          </Link>
        </div>
      </div>

      <MensajeError mensaje={error} />

      {mensaje && (
        <div className="aviso aviso--exito" role="status">
          <p>{mensaje}</p>
        </div>
      )}

      <div className="detalle">
        <div className="detalle__principal">
          <section className="tarjeta">
            <div className="bloque__cabecera">
              <h2>Órdenes del cliente</h2>
              <span className="texto-suave">
                {activas.length} activa(s) de {ordenes.length}
              </span>
            </div>

            {ordenes.length === 0 ? (
              <Vacio titulo="Este cliente todavía no tiene órdenes">
                <Link
                  to={`/ordenes/nueva?cliente=${cliente.id}`}
                  className="boton boton--primario"
                >
                  Registrar un equipo
                </Link>
              </Vacio>
            ) : (
              <div className="lista-ordenes">
                {ordenes.map((orden) => (
                  <OrdenResumen
                    key={orden.id}
                    orden={orden}
                    mostrarCliente={false}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="detalle__lateral">
          <section className="tarjeta">
            <div className="bloque__cabecera">
              <h2>Datos de contacto</h2>
              {!editando && (
                <button
                  type="button"
                  className="enlace"
                  onClick={() => setEditando(true)}
                >
                  Editar
                </button>
              )}
            </div>

            {editando ? (
              <form className="formulario formulario--compacto" onSubmit={guardar}>
                <MensajeError mensaje={errorFormulario} />

                <Campo etiqueta="Nombre" htmlFor="editar-nombre">
                  <input
                    id="editar-nombre"
                    type="text"
                    value={nombre}
                    onChange={(evento) => setNombre(evento.target.value)}
                  />
                </Campo>

                <Campo etiqueta="Teléfono" htmlFor="editar-telefono">
                  <input
                    id="editar-telefono"
                    type="tel"
                    value={telefono}
                    onChange={(evento) => setTelefono(evento.target.value)}
                  />
                </Campo>

                <div className="fila-botones">
                  <button
                    type="submit"
                    className="boton boton--primario"
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={() => {
                      setEditando(false)
                      setNombre(cliente.nombre)
                      setTelefono(cliente.telefono)
                      setErrorFormulario('')
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <dl className="datos">
                <div>
                  <dt>Nombre</dt>
                  <dd>{cliente.nombre}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{cliente.telefono}</dd>
                </div>
              </dl>
            )}
          </section>

          <section className="tarjeta">
            <h2>Resumen</h2>
            <ul className="resumen-cliente">
              <li>
                <span>Órdenes totales</span>
                <strong>{ordenes.length}</strong>
              </li>
              <li>
                <span>En curso</span>
                <strong>{activas.length}</strong>
              </li>
              <li>
                <span>Entregadas</span>
                <strong>
                  {ordenes.filter((orden) => orden.estado === 'entregada').length}
                </strong>
              </li>
            </ul>
            {ordenes.length > 0 && (
              <div className="fila-etiquetas">
                {ordenes.slice(0, 3).map((orden) => (
                  <EstadoBadge key={orden.id} estado={orden.estado} />
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
