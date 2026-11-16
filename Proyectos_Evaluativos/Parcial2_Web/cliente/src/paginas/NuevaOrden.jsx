import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  crearCliente,
  crearOrden,
  esCancelacion,
  listarClientes,
} from '../api/pocketbase'
import Campo from '../componentes/Campo'
import Cargando from '../componentes/Cargando'
import MensajeError from '../componentes/MensajeError'

const MAX_FOTOS = 3

export default function NuevaOrden() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [recarga, setRecarga] = useState(0)
  const [parametros] = useSearchParams()
  const navegar = useNavigate()

  const [clienteId, setClienteId] = useState(parametros.get('cliente') || '')
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '' })

  const [equipo, setEquipo] = useState('')
  const [problema, setProblema] = useState('')
  const [fotos, setFotos] = useState([])

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const equipoRef = useRef(null)
  const fotosRef = useRef(null)

  useEffect(() => {
    const controlador = new AbortController()

    listarClientes(controlador.signal)
      .then((respuesta) => {
        setClientes(respuesta.items)

        if (respuesta.items.length === 0) {
          setCreandoCliente(true)
        } else {
          setClienteId((actual) => actual || respuesta.items[0].id)
        }
      })
      .catch((fallo) => {
        if (!esCancelacion(fallo)) setErrorCarga(fallo.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  // Al terminar de cargar los clientes, el foco pasa al campo del equipo.
  useEffect(() => {
    if (!cargando) equipoRef.current?.focus()
  }, [cargando])

  function manejarFotos(evento) {
    const seleccionadas = Array.from(evento.target.files || [])

    if (seleccionadas.length > MAX_FOTOS) {
      setError(`Puedes adjuntar como máximo ${MAX_FOTOS} fotos.`)
      evento.target.value = ''
      setFotos([])
      return
    }

    const noSonImagen = seleccionadas.find(
      (foto) => !foto.type.startsWith('image/'),
    )

    if (noSonImagen) {
      setError('Solo se permiten imágenes (JPEG, PNG o WebP).')
      evento.target.value = ''
      setFotos([])
      return
    }

    setError('')
    setFotos(seleccionadas)
  }

  function limpiarFotos() {
    setFotos([])

    if (fotosRef.current) {
      fotosRef.current.value = ''
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    setError('')

    if (creandoCliente) {
      if (!nuevoCliente.nombre.trim() || !nuevoCliente.telefono.trim()) {
        setError('Escribe el nombre y el teléfono del cliente.')
        return
      }
    } else if (!clienteId) {
      setError('Selecciona un cliente.')
      return
    }

    if (!equipo.trim()) {
      setError('Escribe el equipo que se va a reparar.')
      return
    }

    if (!problema.trim()) {
      setError('Describe el problema que reporta el cliente.')
      return
    }

    setGuardando(true)

    try {
      let clienteFinal = clienteId

      if (creandoCliente) {
        const cliente = await crearCliente({
          nombre: nuevoCliente.nombre.trim(),
          telefono: nuevoCliente.telefono.trim(),
        })
        clienteFinal = cliente.id
      }

      const orden = await crearOrden({
        cliente: clienteFinal,
        equipo: equipo.trim(),
        problema: problema.trim(),
        fotos,
      })

      navegar(`/ordenes/${orden.id}`)
    } catch (fallo) {
      setError(fallo.message)
      setGuardando(false)
    }
  }

  return (
    <div className="pagina pagina--estrecha">
      <div className="pagina__cabecera">
        <div>
          <p className="pagina__saludo">Órdenes</p>
          <h1>Registrar un equipo</h1>
          <p className="texto-suave">
            La orden empieza en la etapa «Solicitada».
          </p>
        </div>
        <Link to="/ordenes" className="boton boton--secundario">
          Volver
        </Link>
      </div>

      <MensajeError
        mensaje={errorCarga}
        onReintentar={() => {
          setCargando(true)
          setErrorCarga('')
          setRecarga((valor) => valor + 1)
        }}
      />

      {cargando ? (
        <Cargando texto="Cargando clientes…" />
      ) : errorCarga ? null : (
        <form className="formulario tarjeta" onSubmit={enviar}>
          <section className="seccion-formulario">
            <h2>Cliente</h2>

            {!creandoCliente ? (
              <>
                <Campo etiqueta="Cliente registrado" htmlFor="cliente">
                  <select
                    id="cliente"
                    value={clienteId}
                    onChange={(evento) => setClienteId(evento.target.value)}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} · {cliente.telefono}
                      </option>
                    ))}
                  </select>
                </Campo>

                <button
                  type="button"
                  className="enlace"
                  onClick={() => setCreandoCliente(true)}
                >
                  + Registrar un cliente nuevo
                </button>
              </>
            ) : (
              <>
                <p className="texto-suave">
                  El cliente todavía no está registrado. Completa sus datos y se
                  guardará junto con la orden.
                </p>

                <div className="rejilla-dos">
                  <Campo etiqueta="Nombre" htmlFor="nuevo-nombre">
                    <input
                      id="nuevo-nombre"
                      type="text"
                      value={nuevoCliente.nombre}
                      onChange={(evento) =>
                        setNuevoCliente((actual) => ({
                          ...actual,
                          nombre: evento.target.value,
                        }))
                      }
                      placeholder="Ej. Ana Torres"
                    />
                  </Campo>

                  <Campo etiqueta="Teléfono" htmlFor="nuevo-telefono">
                    <input
                      id="nuevo-telefono"
                      type="tel"
                      value={nuevoCliente.telefono}
                      onChange={(evento) =>
                        setNuevoCliente((actual) => ({
                          ...actual,
                          telefono: evento.target.value,
                        }))
                      }
                      placeholder="Ej. 300 123 4567"
                    />
                  </Campo>
                </div>

                {clientes.length > 0 && (
                  <button
                    type="button"
                    className="enlace"
                    onClick={() => setCreandoCliente(false)}
                  >
                    Usar un cliente ya registrado
                  </button>
                )}
              </>
            )}
          </section>

          <section className="seccion-formulario">
            <h2>Equipo</h2>

            <Campo etiqueta="Equipo" htmlFor="equipo">
              <input
                id="equipo"
                ref={equipoRef}
                type="text"
                value={equipo}
                onChange={(evento) => setEquipo(evento.target.value)}
                placeholder="Ej. Laptop Lenovo IdeaPad 3"
              />
            </Campo>

            <Campo etiqueta="Problema reportado" htmlFor="problema">
              <textarea
                id="problema"
                rows="4"
                value={problema}
                onChange={(evento) => setProblema(evento.target.value)}
                placeholder="Qué le pasa al equipo según el cliente"
              />
            </Campo>
          </section>

          <section className="seccion-formulario">
            <h2>Fotos</h2>
            <p className="texto-suave">
              Hasta {MAX_FOTOS} imágenes del equipo (opcional).
            </p>

            <Campo etiqueta="Fotos del equipo" htmlFor="fotos" ayuda="JPEG, PNG o WebP.">
              <input
                id="fotos"
                ref={fotosRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={manejarFotos}
              />
            </Campo>

            {fotos.length > 0 && (
              <div className="fotos-seleccionadas">
                <p>
                  {fotos.length} foto(s) seleccionada(s):
                </p>
                <ul>
                  {fotos.map((foto) => (
                    <li key={foto.name}>{foto.name}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="boton boton--secundario boton--pequeno"
                  onClick={limpiarFotos}
                >
                  Quitar fotos
                </button>
              </div>
            )}
          </section>

          <MensajeError mensaje={error} />

          <div className="formulario__acciones">
            <button
              type="submit"
              className="boton boton--primario"
              disabled={guardando}
            >
              {guardando ? 'Registrando…' : 'Registrar orden'}
            </button>
            <Link to="/ordenes" className="boton boton--secundario">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
