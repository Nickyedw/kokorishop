// src/App.jsx
import React from "react";
import { Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Menu from "./pages/Menu";
import AdminPedidos from './pages/AdminPedidos';
import DetallePedido from './pages/DetallePedido';
import ProductAdmin from './pages/ProductAdmin'; // ✅ nuevo
import EditarProducto from './pages/EditarProducto'; // ✅ nuevo

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/admin/pedidos" element={<AdminPedidos />} />
      <Route path="/admin/pedidos/:id" element={<DetallePedido />} />
      <Route path="/admin/productos" element={<ProductAdmin />} />
      <Route path="/admin/productos/:id" element={<EditarProducto />} />
    </Routes>
  );
}

export default App;
