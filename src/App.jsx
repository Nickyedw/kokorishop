// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts
import CartLayout from "./layouts/CartLayout";
import SiteLayout from "./layouts/SiteLayout";

// Páginas públicas / cliente
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
import RequireAdmin from "./components/RequireAdmin";

function App() {
  return (
    <>
      <CartLayout>
        <Routes>
          {/* ============================== */}
          {/*     RUTAS CON LAYOUT DE SITIO   */}
          {/* ============================== */}
          <Route element={<SiteLayout />}>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recuperar" element={<Recuperar />} />
            <Route path="/reestablecer" element={<Reestablecer />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/cart" element={<Cart />} />

            {/* 🔐 Rutas protegidas para cliente */}
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
          </Route>

          {/* ============================== */}
          {/*       RUTAS ADMIN (PROTEGIDAS) */}
          {/* ============================== */}

          {/* Redirección base admin */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Navigate to="/admin/productos" replace />
              </RequireAdmin>
            }
          />

          <Route
            path="/admin/pedidos"
            element={
              <RequireAdmin>
                <AdminPedidos />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/pedidos/:id"
            element={
              <RequireAdmin>
                <DetallePedido />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/productos"
            element={
              <RequireAdmin>
                <ProductAdmin />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/productos/:id"
            element={
              <RequireAdmin>
                <EditarProducto />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RequireAdmin>
                <AdminUsuarios />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/crear-usuario"
            element={
              <RequireAdmin>
                <AdminCrearUsuario />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/reposiciones"
            element={
              <RequireAdmin>
                <HistorialReposiciones />
              </RequireAdmin>
            }
          />

          {/* Alias opcionales en inglés */}
          <Route
            path="/admin/products"
            element={
              <RequireAdmin>
                <ProductAdmin />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RequireAdmin>
                <AdminPedidos />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <AdminCrearUsuario />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/restocks"
            element={
              <RequireAdmin>
                <HistorialReposiciones />
              </RequireAdmin>
            }
          />

          {/* Redirección desde URL antiguas */}
          <Route path="/kokoshop/*" element={<Navigate to="/" replace />} />

          {/* 404 */}
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
