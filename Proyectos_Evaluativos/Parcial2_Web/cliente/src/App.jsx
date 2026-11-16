import { Route, Routes } from 'react-router'
import Layout from './componentes/Layout'
import Inicio from './paginas/Inicio'
import Ordenes from './paginas/Ordenes'
import NuevaOrden from './paginas/NuevaOrden'
import DetalleOrden from './paginas/DetalleOrden'
import Clientes from './paginas/Clientes'
import DetalleCliente from './paginas/DetalleCliente'
import NoEncontrada from './paginas/NoEncontrada'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="ordenes" element={<Ordenes />} />
        <Route path="ordenes/nueva" element={<NuevaOrden />} />
        <Route path="ordenes/:id" element={<DetalleOrden />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<DetalleCliente />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
