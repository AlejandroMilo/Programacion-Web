import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { esCancelacion, listarOrdenes } from '../api/pocketbase'
import {
  ESTADOS_ACTIVOS,
  ORDEN_ESTADOS,
  calcularTotal,
  formatearPrecio,
} from '../constantes/estados'
import Cargando from '../componentes/Cargando'
import MensajeError from '../componentes/MensajeError'
import ResumenEstados from '../componentes/ResumenEstados'
import OrdenResumen from '../componentes/OrdenResumen'
import Vacio from '../componentes/Vacio'

export default function Inicio() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()

    listarOrdenes({ signal: controlador.signal })
      .then((respuesta) => setOrdenes(respuesta.items))
      .catch((fallo) => {
        if (!esCancelacion(fallo)) setError(fallo.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  // Los conteos y la lista de pendientes se calculan solo cuando cambian las órdenes.
  const conteos = useMemo(() => {
    const resultado = {}

    for (const estado of ORDEN_ESTADOS) {
      resultado[estado] = 0
    }

    for (const orden of ordenes) {
      resultado[orden.estado] = (resultado[orden.estado] || 0) + 1
    }

    return resultado
  }, [ordenes])

  const indicadores = useMemo(() => {
    const activas = ordenes.filter((orden) =>
      ESTADOS_ACTIVOS.includes(orden.estado),
    )
    const porDecidir = activas.filter(
      (orden) => orden.estado === 'presupuestada',
    )
    const listas = activas.filter((orden) => orden.estado === 'lista')
    const valorPresupuestos = porDecidir.reduce(
      (total, orden) => total + calcularTotal(orden.piezas, orden.manoObra),
      0,
    )

    return { activas, porDecidir, listas, valorPresupuestos }
  }, [ordenes])

  return (
    <div className="pagina">
      <section className="portada">
        <div>
          <p className="portada__saludo">Panel del taller</p>
          <h1>Todo el trabajo, en un solo lugar</h1>
          <p className="portada__texto">
            Registra los equipos que llegan, sigue cada reparación y consulta el
            historial completo de una orden.
          </p>
        </div>
        <Link to="/ordenes/nueva" className="boton boton--primario boton--grande">
          Registrar un equipo
        </Link>
      </section>

      <MensajeError
        mensaje={error}
        onReintentar={() => {
          setCargando(true)
          setError('')
          setRecarga((valor) => valor + 1)
        }}
      />

      {cargando ? (
        <Cargando texto="Cargando el panel…" />
      ) : (
        !error && (
          <>
            <section className="indicadores" aria-label="Resumen del taller">
              <div className="indicador">
                <span className="indicador__valor">{indicadores.activas.length}</span>
                <span className="indicador__etiqueta">Órdenes activas</span>
              </div>
              <div className="indicador">
                <span className="indicador__valor">
                  {indicadores.porDecidir.length}
                </span>
                <span className="indicador__etiqueta">
                  Presupuestos por decidir
                </span>
                <span className="indicador__detalle">
                  {formatearPrecio(indicadores.valorPresupuestos)}
                </span>
              </div>
              <div className="indicador">
                <span className="indicador__valor">{indicadores.listas.length}</span>
                <span className="indicador__etiqueta">Listas para entregar</span>
              </div>
              <div className="indicador">
                <span className="indicador__valor">{conteos.entregada || 0}</span>
                <span className="indicador__etiqueta">Equipos entregados</span>
              </div>
            </section>

            <section className="bloque">
              <div className="bloque__cabecera">
                <h2>Órdenes por etapa</h2>
                <Link to="/ordenes" className="enlace">
                  Ver todas
                </Link>
              </div>
              <ResumenEstados conteos={conteos} />
            </section>

            <section className="bloque">
              <div className="bloque__cabecera">
                <h2>Trabajo pendiente</h2>
                <Link to="/ordenes" className="enlace">
                  Gestionar órdenes
                </Link>
              </div>

              {indicadores.activas.length === 0 ? (
                <Vacio titulo="No hay órdenes activas">
                  <p>Registra el próximo equipo que llegue al taller.</p>
                  <Link to="/ordenes/nueva" className="boton boton--primario">
                    Registrar un equipo
                  </Link>
                </Vacio>
              ) : (
                <div className="lista-ordenes">
                  {indicadores.activas.slice(0, 5).map((orden) => (
                    <OrdenResumen key={orden.id} orden={orden} />
                  ))}
                </div>
              )}
            </section>
          </>
        )
      )}
    </div>
  )
}
