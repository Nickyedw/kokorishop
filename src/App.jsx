// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Menu from "./pages/Menu";
import AdminPedidos from './pages/AdminPedidos';
import DetallePedido from './pages/DetallePedido'; // ✅ nuevo componente

function App() {
  return (
    <Router> {/* ✅ Agrega el Router aquí para habilitar navegación */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/admin/pedidos" element={<AdminPedidos />} />
        <Route path="/admin/pedidos/:id" element={<DetallePedido />} /> {/* ✅ nueva ruta */}
      </Routes>
    </Router>
  );
}

export default App;
