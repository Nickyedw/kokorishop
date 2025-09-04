// src/components/admin/AdminSidebar.jsx
import React, { memo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaBoxOpen,
  FaUsers,
  FaHistory,
  FaTimes,
  FaHome,
  FaSignOutAlt,
} from "react-icons/fa";

/**
 * Sidebar responsivo (móvil + desktop)
 * - Móvil: drawer con overlay (no ocupa layout ni ensancha el viewport)
 * - Desktop (md+): aside fijo de 256px a la izquierda
 */
export const AdminSidebar = memo(function AdminSidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const LinkItem = ({ to, icon: IconComp, children }) => (
    <NavLink
      to={to}
      // cerrar el drawer en móvil
      onClick={onClose}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2 rounded-lg transition",
          "text-sm",
          isActive
            ? "bg-yellow-100 text-yellow-900"
            : "hover:bg-gray-100 text-gray-700",
        ].join(" ")
      }
      end
    >
      {IconComp ? <IconComp className="shrink-0 text-yellow-700" /> : null}
      <span className="truncate">{children}</span>
    </NavLink>
  );

  const ButtonRow = () => (
    <div className="mt-auto space-y-2">
      <button
        onClick={() => {
          onClose?.();
          navigate("/");
        }}
        className="w-full inline-flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
      >
        <FaHome />
        Ir a la Tienda
      </button>
      <button
        onClick={() => {
          // limpiar sesión y salir
          localStorage.removeItem("token");
          localStorage.removeItem("usuario_id");
          localStorage.removeItem("usuario_nombre");
          onClose?.();
          navigate("/login");
        }}
        className="w-full inline-flex items-center gap-3 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
      >
        <FaSignOutAlt />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      {/* ===== Drawer móvil ===== */}
      <div
        className={[
          "fixed inset-0 z-[60] md:hidden",
          "transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden={!open}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Panel drawer */}
        <aside
          className={[
            "absolute left-0 top-0 h-full",
            // evita overflow horizontal en móvil y limita ancho
            "w-[min(84vw,320px)] bg-white shadow-xl",
            "p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
            "transform transition-transform duration-200 will-change-transform",
            open ? "translate-x-0" : "-translate-x-full",
            "overflow-y-auto flex flex-col",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de administración"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Menú de Admin</h2>
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <FaTimes />
            </button>
          </div>

          <nav className="space-y-1">
            <LinkItem to="/admin/pedidos" icon={FaClipboardList}>
              Panel de Pedidos
            </LinkItem>
            <LinkItem to="/admin/productos" icon={FaBoxOpen}>
              Gestión de Productos
            </LinkItem>
            {/* usa la ruta de tu listado de usuarios */}
            <LinkItem to="/admin/usuarios" icon={FaUsers}>
              Gestión de Usuarios
            </LinkItem>
            <LinkItem to="/admin/reposiciones" icon={FaHistory}>
              Historial de Reposición
            </LinkItem>
          </nav>

          <div className="mt-6 border-t pt-2 text-xs text-gray-500 truncate">
            {location.pathname}
          </div>

          <ButtonRow />
        </aside>
      </div>

      {/* ===== Sidebar fijo (md+) ===== */}
      <aside
        className={[
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64",
          "bg-white border-r z-[50] p-4",
          // scroll interno para no empujar el contenido
          "overflow-y-auto",
          // “safe areas” para iOS
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        ].join(" ")}
      >
        <h2 className="font-semibold text-lg mb-3">Menú de Admin</h2>

        <nav className="space-y-1">
          <LinkItem to="/admin/pedidos" icon={FaClipboardList}>
            Panel de Pedidos
          </LinkItem>
          <LinkItem to="/admin/productos" icon={FaBoxOpen}>
            Gestión de Productos
          </LinkItem>
          <LinkItem to="/admin/usuarios" icon={FaUsers}>
            Gestión de Usuarios
          </LinkItem>
          <LinkItem to="/admin/reposiciones" icon={FaHistory}>
            Historial de Reposición
          </LinkItem>
        </nav>

        <div className="mt-6 border-t pt-2 text-xs text-gray-500 truncate">
          {location.pathname}
        </div>

        <ButtonRow />
      </aside>
    </>
  );
});
