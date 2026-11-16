import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { esCancelacion, listarOrdenes } from '../api/pocketbase'
import {
  ORDEN_ESTADOS,
  calcularTotal,
  etiquetaEstado,
  formatearFecha,
  formatearPrecio,
} from '../constantes/estados'
import Cargando from '../componentes/Cargando'
import MensajeError from '../componentes/MensajeError'
import EstadoBadge from '../componentes/EstadoBadge'
import Vacio from '../componentes/Vacio'

function tienePresupuesto(estado) {
  return !['solicitada', 'en_diagnostico', 'cancelada'].includes(estado)
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [parametros, setParametros] = useSearchParams()

  const filtroEstado = parametros.get('estado') || 'todas'

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

  // Filtrado por etapa y búsqueda de texto: se repite solo si cambian los datos o los filtros.
  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return ordenes.filter((orden) => {
      const coincideEstado =
        filtroEstado === 'todas' || orden.estado === filtroEstado
      const cliente = orden.expand?.cliente?.nombre || ''
      const coincideTexto =
        texto === '' ||
        orden.equipo.toLowerCase().includes(texto) ||
        orden.problema.toLowerCase().includes(texto) ||
        cliente.toLowerCase().includes(texto) ||
        orden.id.toLowerCase().includes(texto)

      return coincideEstado && coincideTexto
    })
  }, [ordenes, filtroEstado, busqueda])

  function cambiarFiltro(evento) {
    const valor = evento.target.value

    if (valor === 'todas') {
      setParametros({})
    } else {
      setParametros({ estado: valor })
    }
  }

  return (
    <div className="pagina">
      <div className="pagina__cabecera">
        <div>
          <p className="pagina__saludo">Taller</p>
          <h1>Órdenes</h1>
          <p className="texto-suave">
            {cargando ? 'Cargando…' : `${visibles.length} orden(es) en la vista`}
          </p>
        </div>
        <Link to="/ordenes/nueva" className="boton boton--primario">
          + Nueva orden
        </Link>
      </div>

      <MensajeError
        mensaje={error}
        onReintentar={() => {
          setCargando(true)
          setError('')
          setRecarga((valor) => valor + 1)
        }}
      />

      <div className="barra-filtros">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="buscar">
            Buscar
          </label>
          <input
            id="buscar"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Equipo, cliente, problema o número de orden"
          />
        </div>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="estado">
            Etapa
          </label>
          <select id="estado" value={filtroEstado} onChange={cambiarFiltro}>
            <option value="todas">Todas las etapas</option>
            {ORDEN_ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {etiquetaEstado(estado)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargando ? (
        <Cargando texto="Cargando órdenes…" />
      ) : error ? null : visibles.length === 0 ? (
        <Vacio titulo="No hay órdenes con esos filtros">
          <p>Prueba con otra etapa o borra el texto de búsqueda.</p>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => {
              setBusqueda('')
              setParametros({})
            }}
          >
            Limpiar filtros
          </button>
        </Vacio>
      ) : (
        <div className="tabla-envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Equipo</th>
                <th scope="col">Cliente</th>
                <th scope="col">Etapa</th>
                <th scope="col">Ingreso</th>
                <th scope="col" className="tabla__numero">
                  Presupuesto
                </th>
                <th scope="col">
                  <span className="solo-lectores">Abrir</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((orden) => (
                <tr key={orden.id}>
                  <td>
                    <Link to={`/ordenes/${orden.id}`} className="tabla__enlace">
                      {orden.equipo}
                    </Link>
                    <span className="tabla__secundario">{orden.id}</span>
                  </td>
                  <td>{orden.expand?.cliente?.nombre || '—'}</td>
                  <td>
                    <EstadoBadge estado={orden.estado} />
                  </td>
                  <td>{formatearFecha(orden.created)}</td>
                  <td className="tabla__numero">
                    {tienePresupuesto(orden.estado)
                      ? formatearPrecio(calcularTotal(orden.piezas, orden.manoObra))
                      : '—'}
                  </td>
                  <td className="tabla__accion">
                    <Link
                      to={`/ordenes/${orden.id}`}
                      className="boton boton--secundario boton--pequeno"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
