import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  actualizarOrden,
  agregarFotosOrden,
  esCancelacion,
  listarEventos,
  obtenerOrden,
} from '../api/pocketbase'
import {
  ESTADOS_FINALES,
  calcularTotal,
  etiquetaEstado,
  formatearFecha,
  formatearPrecio,
} from '../constantes/estados'
import Cargando from '../componentes/Cargando'
import MensajeError from '../componentes/MensajeError'
import EstadoBadge from '../componentes/EstadoBadge'
import AccionesOrden from '../componentes/AccionesOrden'
import FormularioPresupuesto from '../componentes/FormularioPresupuesto'
import GaleriaFotos from '../componentes/GaleriaFotos'
import Historial from '../componentes/Historial'

const MAX_FOTOS = 3

export default function DetalleOrden() {
  const { id } = useParams()

  const [orden, setOrden] = useState(null)
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [recarga, setRecarga] = useState(0)

  const [actualizando, setActualizando] = useState(false)
  const [nuevasFotos, setNuevasFotos] = useState([])
  const [subiendoFotos, setSubiendoFotos] = useState(false)
  const [errorFotos, setErrorFotos] = useState('')
  const fotosRef = useRef(null)

  useEffect(() => {
    const controlador = new AbortController()

    Promise.all([
      obtenerOrden(id, controlador.signal),
      listarEventos(id, controlador.signal),
    ])
      .then(([ordenCargada, eventosCargados]) => {
        setOrden(ordenCargada)
        setEventos(eventosCargados.items)
      })
      .catch((fallo) => {
        if (!esCancelacion(fallo)) setError(fallo.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [id, recarga])

  // El total no se guarda: sale siempre de la mano de obra y las piezas.
  const total = useMemo(
    () => calcularTotal(orden?.piezas, orden?.manoObra),
    [orden],
  )

  async function guardarCambios(cambios, textoExito) {
    setActualizando(true)
    setError('')
    setMensaje('')

    try {
      await actualizarOrden(id, cambios)
      setMensaje(textoExito)
      setRecarga((valor) => valor + 1)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setActualizando(false)
    }
  }

  function cambiarEstado(destino) {
    guardarCambios(
      { estado: destino },
      'La orden pasó a la etapa «' + etiquetaEstado(destino) + '».',
    )
  }

  function guardarPresupuesto(cambios) {
    guardarCambios(cambios, 'Presupuesto registrado. Ya no se puede modificar.')
  }

  function manejarFotos(evento) {
    const seleccionadas = Array.from(evento.target.files || [])
    const yaTiene = orden?.fotos?.length || 0

    if (yaTiene + seleccionadas.length > MAX_FOTOS) {
      setErrorFotos(`La orden admite como máximo ${MAX_FOTOS} fotos en total.`)
      evento.target.value = ''
      setNuevasFotos([])
      return
    }

    const noSonImagen = seleccionadas.find(
      (foto) => !foto.type.startsWith('image/'),
    )

    if (noSonImagen) {
      setErrorFotos('Solo se permiten imágenes (JPEG, PNG o WebP).')
      evento.target.value = ''
      setNuevasFotos([])
      return
    }

    setErrorFotos('')
    setNuevasFotos(seleccionadas)
  }

  async function subirFotos(evento) {
    evento.preventDefault()

    if (nuevasFotos.length === 0) return

    setSubiendoFotos(true)
    setErrorFotos('')
    setMensaje('')

    try {
      await agregarFotosOrden(id, nuevasFotos)
      setNuevasFotos([])

      if (fotosRef.current) fotosRef.current.value = ''

      setMensaje('Fotos agregadas a la orden.')
      setRecarga((valor) => valor + 1)
    } catch (fallo) {
      setErrorFotos(fallo.message)
    } finally {
      setSubiendoFotos(false)
    }
  }

  // Solo se muestra la orden cuando coincide con el id de la URL.
  const ordenVisible = orden && orden.id === id ? orden : null

  if (!ordenVisible && (cargando || !error)) {
    return (
      <div className="pagina">
        <Cargando texto="Cargando la orden…" />
      </div>
    )
  }

  if (!ordenVisible) {
    return (
      <div className="pagina">
        <MensajeError mensaje={error || 'No se encontró la orden.'} />
        <Link to="/ordenes" className="boton boton--secundario">
          Volver a las órdenes
        </Link>
      </div>
    )
  }

  const cliente = orden.expand?.cliente
  const cerrada = ESTADOS_FINALES.includes(orden.estado)
  const fotos = orden.fotos || []
  const hayPresupuesto =
    orden.diagnostico !== '' ||
    Number(orden.manoObra) > 0 ||
    (orden.piezas && orden.piezas.length > 0)

  return (
    <div className="pagina">
      <nav className="migas" aria-label="Migas de pan">
        <Link to="/ordenes">Órdenes</Link>
        <span aria-hidden="true"> / </span>
        <span>{orden.equipo}</span>
      </nav>

      <div className="pagina__cabecera">
        <div>
          <p className="pagina__saludo">Orden {orden.id}</p>
          <h1>{orden.equipo}</h1>
          <div className="fila-etiquetas">
            <EstadoBadge estado={orden.estado} />
            <span className="texto-suave">
              Ingresó el {formatearFecha(orden.created)}
            </span>
          </div>
        </div>
        <Link to="/ordenes" className="boton boton--secundario">
          Volver
        </Link>
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
            <h2>Datos del equipo</h2>
            <dl className="datos">
              <div>
                <dt>Equipo</dt>
                <dd>{orden.equipo}</dd>
              </div>
              <div>
                <dt>Problema reportado</dt>
                <dd className="texto-conservado">{orden.problema}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{formatearFecha(orden.updated)}</dd>
              </div>
            </dl>
          </section>

          <section className="tarjeta">
            <h2>Presupuesto</h2>

            {!hayPresupuesto ? (
              <p className="texto-suave">
                El presupuesto se registra al terminar el diagnóstico. El total
                se calcula con la mano de obra y las piezas, no se guarda.
              </p>
            ) : (
              <>
                <dl className="datos">
                  <div>
                    <dt>Diagnóstico</dt>
                    <dd className="texto-conservado">{orden.diagnostico}</dd>
                  </div>
                  <div>
                    <dt>Mano de obra</dt>
                    <dd>{formatearPrecio(orden.manoObra)}</dd>
                  </div>
                </dl>

                {orden.piezas && orden.piezas.length > 0 ? (
                  <div className="tabla-envoltorio">
                    <table className="tabla tabla--compacta">
                      <thead>
                        <tr>
                          <th scope="col">Pieza</th>
                          <th scope="col" className="tabla__numero">
                            Cantidad
                          </th>
                          <th scope="col" className="tabla__numero">
                            Precio
                          </th>
                          <th scope="col" className="tabla__numero">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden.piezas.map((pieza, indice) => (
                          <tr key={`${pieza.descripcion}-${indice}`}>
                            <td>{pieza.descripcion}</td>
                            <td className="tabla__numero">{pieza.cantidad}</td>
                            <td className="tabla__numero">
                              {formatearPrecio(pieza.precio)}
                            </td>
                            <td className="tabla__numero">
                              {formatearPrecio(
                                Number(pieza.cantidad) * Number(pieza.precio),
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="texto-suave">Sin piezas: solo mano de obra.</p>
                )}

                <p className="total">
                  <span>Total</span>
                  <strong>{formatearPrecio(total)}</strong>
                </p>
              </>
            )}

            {orden.estado === 'en_diagnostico' && (
              <div className="formulario-presupuesto">
                <h3>Registrar el presupuesto</h3>
                <p className="texto-suave">
                  Al guardarlo, la orden pasa a «Presupuestada» y el presupuesto
                  queda congelado.
                </p>
                <FormularioPresupuesto
                  orden={orden}
                  onGuardar={guardarPresupuesto}
                  guardando={actualizando}
                />
              </div>
            )}

            {!cerrada && orden.estado !== 'en_diagnostico' && hayPresupuesto && (
              <p className="texto-suave">
                El presupuesto ya no se puede modificar.
              </p>
            )}
          </section>

          <section className="tarjeta">
            <h2>Fotos</h2>
            <GaleriaFotos orden={orden} fotos={fotos} />

            {!cerrada && (
              <form className="formulario formulario--compacto" onSubmit={subirFotos}>
                {fotos.length < MAX_FOTOS ? (
                  <>
                    <p className="texto-suave">
                      Quedan {MAX_FOTOS - fotos.length} espacio(s) para fotos.
                    </p>
                    <input
                      ref={fotosRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={manejarFotos}
                    />
                    <MensajeError mensaje={errorFotos} />
                    <button
                      type="submit"
                      className="boton boton--secundario"
                      disabled={subiendoFotos || nuevasFotos.length === 0}
                    >
                      {subiendoFotos ? 'Subiendo…' : 'Agregar fotos'}
                    </button>
                  </>
                ) : (
                  <p className="texto-suave">La orden ya tiene el máximo de fotos.</p>
                )}
              </form>
            )}
          </section>

          <section className="tarjeta">
            <h2>Historial</h2>
            <Historial eventos={eventos} />
          </section>
        </div>

        <aside className="detalle__lateral">
          <section className="tarjeta">
            <h2>Acciones</h2>

            {orden.estado === 'en_diagnostico' && (
              <p className="texto-suave">
                Completa el presupuesto en la sección «Presupuesto» para
                avanzar a la siguiente etapa.
              </p>
            )}

            <AccionesOrden
              orden={orden}
              onCambiarEstado={cambiarEstado}
              actualizando={actualizando}
            />
          </section>

          <section className="tarjeta">
            <h2>Cliente</h2>
            {cliente ? (
              <>
                <p className="cliente__nombre">{cliente.nombre}</p>
                <p className="texto-suave">{cliente.telefono}</p>
                <Link to={`/clientes/${cliente.id}`} className="enlace">
                  Ver ficha del cliente
                </Link>
              </>
            ) : (
              <p className="texto-suave">No se pudo cargar el cliente.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
