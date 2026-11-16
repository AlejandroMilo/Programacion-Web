export default function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <p className="vacio__titulo">{titulo}</p>
      {children && <div className="vacio__texto">{children}</div>}
    </div>
  )
}
