import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { crearCliente, esCancelacion, listarClientes } from '../api/pocketbase'
import Campo from '../componentes/Campo'
import Cargando from '../componentes/Cargando'
import MensajeError from '../componentes/MensajeError'
import Vacio from '../componentes/Vacio'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)
  const [busqueda, setBusqueda] = useState('')

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [errorFormulario, setErrorFormulario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const controlador = new AbortController()

    listarClientes(controlador.signal)
      .then((respuesta) => setClientes(respuesta.items))
      .catch((fallo) => {
        if (!esCancelacion(fallo)) setError(fallo.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return clientes.filter(
      (cliente) =>
        texto === '' ||
        cliente.nombre.toLowerCase().includes(texto) ||
        cliente.telefono.toLowerCase().includes(texto),
    )
  }, [clientes, busqueda])

  async function registrar(evento) {
    evento.preventDefault()
    setErrorFormulario('')
    setMensaje('')

    if (!nombre.trim() || !telefono.trim()) {
      setErrorFormulario('Escribe el nombre y el teléfono del cliente.')
      return
    }

    setGuardando(true)

    try {
      const cliente = await crearCliente({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      })

      setClientes((actuales) => [...actuales, cliente])
      setNombre('')
      setTelefono('')
      setMensaje(`Cliente «${cliente.nombre}» registrado.`)
    } catch (fallo) {
      setErrorFormulario(fallo.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="pagina">
      <div className="pagina__cabecera">
        <div>
          <p className="pagina__saludo">Taller</p>
          <h1>Clientes</h1>
          <p className="texto-suave">
            {cargando ? 'Cargando…' : `${visibles.length} cliente(s)`}
          </p>
        </div>
      </div>

      <MensajeError
        mensaje={error}
        onReintentar={() => {
          setCargando(true)
          setError('')
          setRecarga((valor) => valor + 1)
        }}
      />

      <div className="dos-columnas">
        <section className="tarjeta">
          <div className="bloque__cabecera">
            <h2>Listado</h2>
            <div className="campo campo--en-linea">
              <label className="solo-lectores" htmlFor="buscar-cliente">
                Buscar cliente
              </label>
              <input
                id="buscar-cliente"
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar nombre o teléfono"
              />
            </div>
          </div>

          {cargando ? (
            <Cargando texto="Cargando clientes…" />
          ) : error ? null : visibles.length === 0 ? (
            <Vacio titulo="No hay clientes con esa búsqueda">
              <p>Prueba con otro nombre o teléfono.</p>
            </Vacio>
          ) : (
            <ul className="lista-clientes">
              {visibles.map((cliente) => (
                <li key={cliente.id}>
                  <Link to={`/clientes/${cliente.id}`} className="cliente-fila">
                    <span className="cliente-fila__avatar" aria-hidden="true">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span className="cliente-fila__datos">
                      <strong>{cliente.nombre}</strong>
                      <span className="texto-suave">{cliente.telefono}</span>
                    </span>
                    <span className="cliente-fila__flecha" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta">
          <h2>Registrar un cliente</h2>
          <p className="texto-suave">
            Los clientes no inician sesión: el taller guarda sus datos al recibir
            un equipo.
          </p>

          <form className="formulario formulario--compacto" onSubmit={registrar}>
            <MensajeError mensaje={errorFormulario} />

            <Campo etiqueta="Nombre" htmlFor="cliente-nombre">
              <input
                id="cliente-nombre"
                type="text"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Ej. Ana Torres"
              />
            </Campo>

            <Campo etiqueta="Teléfono" htmlFor="cliente-telefono">
              <input
                id="cliente-telefono"
                type="tel"
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
                placeholder="Ej. 300 123 4567"
              />
            </Campo>

            <button
              type="submit"
              className="boton boton--primario"
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar cliente'}
            </button>

            {mensaje && (
              <div className="aviso aviso--exito" role="status">
                <p>{mensaje}</p>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}
