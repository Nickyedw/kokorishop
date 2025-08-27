// src/components/MobileMenu.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaShoppingBag,
  FaHome,
  FaTimes,
  FaUser,
  FaShieldAlt,
  FaSignOutAlt
} from "react-icons/fa";

export default function MobileMenu({
  isOpen,
  onClose,
  usuarioNombre = "Invitado",
  favCount = 0,
  cartCount = 0,
  isAdmin = false,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

    const handleLogout = () => {
  // Limpia claves de auth (las que uses en tu app)
  const authKeys = [
    "token",
    "auth_token",
    "usuario_nombre",
    "usuario_rol",
    "usuario_is_admin",
    "is_admin",
    "es_admin",
  ];
  authKeys.forEach((k) => localStorage.removeItem(k));

  // 🔹 Limpia carrito y favoritos para invitado (y legacy, por si quedó)
  try {
    localStorage.setItem("cart:guest", "[]");   // carrito invitado vacío
    localStorage.removeItem("cart");            // legacy
    localStorage.setItem("favorites:guest", "[]");
    localStorage.removeItem("favorites");       // legacy
  } catch (err) {
  console.warn("Error leyendo carrito guest:", err);
}
  onClose?.();
  // Redirige y fuerza refresco para resetear estado en memoria
  navigate("/");
  window.location.reload();
};
    // Si en tu app hay mucho estado en memoria, puedes forzar un refresco:
    // window.location.reload();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50" onClick={onClose} />

      {/* Panel */}
      <aside
        className="fixed left-0 top-0 h-full w-[80%] max-w-[320px] bg-white z-50 shadow-2xl
                   flex flex-col animate-[slideInLeft_.25s_ease-out]"
        style={{ animation: "slideInLeft .25s ease-out" }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Bienvenido</p>
            <p className="text-sm font-semibold text-purple-800 truncate max-w-[220px]">
              {usuarioNombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-700 hover:text-purple-900 p-2 rounded-full"
            aria-label="Cerrar menú"
            title="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <MenuItem to="/" icon={<FaHome />} label="Inicio" onClick={onClose} />
          <MenuItem to="/favorites" icon={<FaHeart />} label="Favoritos" badge={favCount} onClick={onClose} />
          <MenuItem to="/Cart" icon={<FaShoppingBag />} label="Carrito" badge={cartCount} onClick={onClose} />
          <MenuItem to="/menu" icon={<FaUser />} label="Perfil / Menú" onClick={onClose} />

          {isAdmin && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administración
              </div>
              <MenuItem to="/admin" icon={<FaShieldAlt />} label="Panel Admin" onClick={onClose} />
            </>
          )}
        </nav>

        {/* Acciones inferiores */}
        <div className="border-t border-gray-200 p-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              navigate("/Cart?checkout=1");
              onClose?.();
            }}
            className="w-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-2 text-sm font-semibold shadow hover:shadow-md"
          >
            Ir a Pagar
          </button>

          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full
                       border border-red-500 text-red-600 hover:bg-red-50
                       px-4 py-2 text-sm font-semibold"
            title="Cerrar sesión"
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

function MenuItem({ to, icon, label, badge = 0, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-purple-800 hover:bg-purple-50 transition"
    >
      <span className="text-purple-700">{icon}</span>
      <span className="font-medium">{label}</span>
      {badge > 0 && (
        <span className="ml-auto bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
