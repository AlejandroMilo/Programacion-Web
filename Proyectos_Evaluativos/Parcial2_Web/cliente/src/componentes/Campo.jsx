export default function Campo({ etiqueta, htmlFor, ayuda, children }) {
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={htmlFor}>
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="campo__ayuda">{ayuda}</p>}
    </div>
  )
}
