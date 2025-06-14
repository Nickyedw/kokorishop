// src/App.jsx

import React from "react";
import { Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Menu from "./pages/Menu";
import AdminPedidos from './pages/AdminPedidos';
import DetallePedido from './pages/DetallePedido'; // ✅ nuevo componente

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/admin/pedidos" element={<AdminPedidos />} />
      <Route path="/admin/pedidos/:id" element={<DetallePedido />} />
    </Routes>
  );
}

export default App;

