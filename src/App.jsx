// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ⬇️ Layout global que pinta MiniCart + CartFab en toda la app
import CartLayout from "./layouts/CartLayout";

// Páginas principales
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Menu from "./pages/Menu";
import MisPedidos from "./pages/MisPedidos";
import DetalleClientePedido from "./pages/DetalleClientePedido";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfiguracionPerfil from "./pages/ConfiguracionPerfil";
import Recuperar from "./pages/Recuperar";
import Reestablecer from "./pages/Reestablecer";
import Catalogo from "./pages/Catalogo";

// Paneles Admin
import AdminPedidos from "./pages/AdminPedidos";
import DetallePedido from "./pages/DetallePedido";
import ProductAdmin from "./pages/ProductAdmin";
import EditarProducto from "./pages/EditarProducto";
import AdminCrearUsuario from "./pages/AdminCrearUsuario";
import HistorialReposiciones from "./pages/HistorialReposiciones";
import AdminUsuarios from "./pages/AdminUsuarios";

// 🔐 Rutas protegidas
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <>
      {/* El CartLayout envuelve TODAS las rutas y dibuja el MiniCart + CartFab */}
      <CartLayout>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/reestablecer" element={<Reestablecer />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/favorites" element={<Favorites />} />

          {/* Protegidas (cliente) */}
          <Route
            path="/cart"
            element={
              <RequireAuth>
                <Cart />
              </RequireAuth>
            }
          />
          <Route
            path="/menu"
            element={
              <RequireAuth>
                <Menu />
              </RequireAuth>
            }
          />
          <Route
            path="/mis-pedidos"
            element={
              <RequireAuth>
                <MisPedidos />
              </RequireAuth>
            }
          />
          <Route
            path="/mis-pedidos/:id"
            element={
              <RequireAuth>
                <DetalleClientePedido />
              </RequireAuth>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RequireAuth>
                <ConfiguracionPerfil />
              </RequireAuth>
            }
          />

          {/* Admin: redirigir raíz del admin a productos */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Navigate to="/admin/productos" replace />
              </RequireAuth>
            }
          />

          {/* Admin secciones */}
          <Route
            path="/admin/pedidos"
            element={
              <RequireAuth>
                <AdminPedidos />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/pedidos/:id"
            element={
              <RequireAuth>
                <DetallePedido />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/productos"
            element={
              <RequireAuth>
                <ProductAdmin />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/productos/:id"
            element={
              <RequireAuth>
                <EditarProducto />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RequireAuth>
                <AdminUsuarios />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/crear-usuario"
            element={
              <RequireAuth>
                <AdminCrearUsuario />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/reposiciones"
            element={
              <RequireAuth>
                <HistorialReposiciones />
              </RequireAuth>
            }
          />

          {/* Alias en inglés (opcionales) */}
          <Route
            path="/admin/products"
            element={
              <RequireAuth>
                <ProductAdmin />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RequireAuth>
                <AdminPedidos />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAuth>
                <AdminCrearUsuario />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/restocks"
            element={
              <RequireAuth>
                <HistorialReposiciones />
              </RequireAuth>
            }
          />

          {/* Redirección desde la ruta antigua */}
          <Route path="/kokoshop/*" element={<Navigate to="/" replace />} />

          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartLayout>

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
