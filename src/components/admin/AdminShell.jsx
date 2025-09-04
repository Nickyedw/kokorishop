// src/components/admin/AdminShell.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { FaBars } from "react-icons/fa";

export default function AdminShell({ title = "Menú de Admin", children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Bloquear scroll de fondo cuando el drawer está abierto (móvil)
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.classList.add("overflow-hidden");
    else root.classList.remove("overflow-hidden");
    return () => root.classList.remove("overflow-hidden");
  }, [open]);

  const handleLogout = () => {
    try {
      // limpia lo que usas para la sesión
      localStorage.removeItem("token");
      localStorage.removeItem("usuario_nombre");
      localStorage.removeItem("usuario_id");
      // agrega aquí cualquier otra clave que uses…
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-[100svh] bg-gray-50 text-gray-800 flex overflow-x-hidden">
      {/* Sidebar (drawer en móvil, fijo en md+) */}
      <AdminSidebar
        open={open}
        onClose={() => setOpen(false)}
        onLogout={handleLogout}
      />

      {/* Columna derecha: header + contenido */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header (solo móvil) */}
        <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
          <div className="h-14 px-4 flex items-center justify-between">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="p-2 rounded-md hover:bg-gray-100 active:scale-95 transition"
            >
              <FaBars />
            </button>
            <h1 className="font-semibold truncate">{title}</h1>
            <div className="w-8" />
          </div>
        </header>

        {/* Contenido principal */}
        <main
          role="main"
          className="
            flex-1 w-full
            px-3 sm:px-5 lg:px-8
            pt-3 md:pt-6
            pb-24 md:pb-10
            overflow-x-hidden
            min-h-[calc(100svh-56px)] md:min-h-screen
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
