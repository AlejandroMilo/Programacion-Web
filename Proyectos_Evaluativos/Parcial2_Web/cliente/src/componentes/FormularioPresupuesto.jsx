import { useMemo, useState } from 'react'
import FormularioPiezas from './FormularioPiezas'
import Campo from './Campo'
import MensajeError from './MensajeError'
import { calcularTotal, formatearPrecio } from '../constantes/estados'

let contadorPiezas = 0

function nuevoId() {
  contadorPiezas += 1
  return `pieza-${contadorPiezas}`
}

function piezaVacia() {
  return { _id: nuevoId(), descripcion: '', cantidad: '1', precio: '' }
}

function piezasIniciales(piezas) {
  if (!Array.isArray(piezas) || piezas.length === 0) {
    return [piezaVacia()]
  }

  return piezas.map((pieza) => ({
    _id: nuevoId(),
    descripcion: pieza.descripcion || '',
    cantidad: String(pieza.cantidad ?? 1),
    precio: String(pieza.precio ?? ''),
  }))
}

export default function FormularioPresupuesto({ orden, onGuardar, guardando }) {
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico || '')
  const [manoObra, setManoObra] = useState(
    orden.manoObra === 0 ? '' : String(orden.manoObra ?? ''),
  )
  const [piezas, setPiezas] = useState(() => piezasIniciales(orden.piezas))
  const [error, setError] = useState('')

  // El total se recalcula solo cuando cambian las piezas o la mano de obra.
  const total = useMemo(
    () => calcularTotal(piezas, manoObra),
    [piezas, manoObra],
  )

  function cambiarPieza(id, campo, valor) {
    setPiezas((actuales) =>
      actuales.map((pieza) =>
        pieza._id === id ? { ...pieza, [campo]: valor } : pieza,
      ),
    )
  }

  function agregarPieza() {
    setPiezas((actuales) => [...actuales, piezaVacia()])
  }

  function quitarPieza(id) {
    setPiezas((actuales) => actuales.filter((pieza) => pieza._id !== id))
  }

  function enviar(evento) {
    evento.preventDefault()
    setError('')

    const diagnosticoLimpio = diagnostico.trim()

    if (!diagnosticoLimpio) {
      setError('Escribe el diagnóstico del equipo antes de presupuestar.')
      return
    }

    if (manoObra !== '' && (Number.isNaN(Number(manoObra)) || Number(manoObra) < 0)) {
      setError('La mano de obra debe ser un número igual o mayor que cero.')
      return
    }

    const usadas = piezas.filter(
      (pieza) =>
        pieza.descripcion.trim() !== '' ||
        pieza.precio !== '' ||
        pieza.cantidad !== '1',
    )

    for (const pieza of usadas) {
      if (!pieza.descripcion.trim()) {
        setError('Cada pieza debe tener una descripción.')
        return
      }

      if (Number.isNaN(Number(pieza.cantidad)) || Number(pieza.cantidad) < 0) {
        setError('La cantidad de cada pieza debe ser un número igual o mayor que cero.')
        return
      }

      if (Number.isNaN(Number(pieza.precio)) || Number(pieza.precio) < 0) {
        setError('El precio de cada pieza debe ser un número igual o mayor que cero.')
        return
      }
    }

    onGuardar({
      estado: 'presupuestada',
      diagnostico: diagnosticoLimpio,
      manoObra: Number(manoObra || 0),
      piezas: usadas.map((pieza) => ({
        descripcion: pieza.descripcion.trim(),
        cantidad: Number(pieza.cantidad),
        precio: Number(pieza.precio),
      })),
    })
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <MensajeError mensaje={error} />

      <Campo
        etiqueta="Diagnóstico"
        htmlFor="diagnostico"
        ayuda="Qué falla y qué se va a hacer. Queda congelado al presupuestar."
      >
        <textarea
          id="diagnostico"
          rows="4"
          value={diagnostico}
          onChange={(evento) => setDiagnostico(evento.target.value)}
          placeholder="Ej. La placa de carga está sulfatada..."
          autoFocus
        />
      </Campo>

      <Campo
        etiqueta="Mano de obra"
        htmlFor="manoObra"
        ayuda="Solo el valor de la mano de obra, sin las piezas."
      >
        <input
          id="manoObra"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={manoObra}
          onChange={(evento) => setManoObra(evento.target.value)}
          placeholder="0"
        />
      </Campo>

      <FormularioPiezas
        piezas={piezas}
        onCambiar={cambiarPieza}
        onAgregar={agregarPieza}
        onQuitar={quitarPieza}
      />

      <div className="presupuesto__total">
        <span>Total del presupuesto</span>
        <strong>{formatearPrecio(total)}</strong>
      </div>

      <button type="submit" className="boton boton--primario" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Registrar presupuesto'}
      </button>
    </form>
  )
}
