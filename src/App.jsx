// src/App.jsx
import React from "react";
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Páginas principales
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Menu from "./pages/Menu";
import MisPedidos from './pages/MisPedidos';
import DetalleClientePedido from './pages/DetalleClientePedido';
import Login from './pages/Login';
import Register from './pages/Register';

// Paneles Admin
import AdminPedidos from './pages/AdminPedidos';
import DetallePedido from './pages/DetallePedido';
import ProductAdmin from './pages/ProductAdmin';
import EditarProducto from './pages/EditarProducto';
import Dashboard from './pages/Dashboard';

// 🔐 Componente para proteger rutas
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/menu" element={<RequireAuth><Menu /></RequireAuth>} />
        <Route path="/mis-pedidos" element={<RequireAuth><MisPedidos /></RequireAuth>} />
        <Route path="/mis-pedidos/:id" element={<RequireAuth><DetalleClientePedido /></RequireAuth>} />

        <Route path="/admin" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/pedidos" element={<RequireAuth><AdminPedidos /></RequireAuth>} />
        <Route path="/admin/pedidos/:id" element={<RequireAuth><DetallePedido /></RequireAuth>} />
        <Route path="/admin/productos" element={<RequireAuth><ProductAdmin /></RequireAuth>} />
        <Route path="/admin/productos/:id" element={<RequireAuth><EditarProducto /></RequireAuth>} />
      </Routes>

      {/* Contenedor de notificaciones */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastClassName="rounded-2xl shadow-lg p-4 font-medium text-sm animate-fade-in"
        bodyClassName="flex items-center gap-2"
      />
    </>
  );
}

export default App;
