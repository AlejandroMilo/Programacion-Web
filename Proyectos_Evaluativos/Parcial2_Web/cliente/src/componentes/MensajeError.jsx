export default function MensajeError({ mensaje, onReintentar }) {
  if (!mensaje) return null

  return (
    <div className="aviso aviso--error" role="alert">
      <p>{mensaje}</p>
      {onReintentar && (
        <button type="button" className="boton boton--secundario" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}
