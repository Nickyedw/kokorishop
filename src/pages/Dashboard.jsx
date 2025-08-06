// src/pages/Dashboard.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductAdmin from './ProductAdmin';
import AdminPedidos from './AdminPedidos';
import AdminUsuarios from './AdminUsuarios';
import HistorialReposiciones from './HistorialReposiciones';
import {
  FaClipboardList,
  FaBoxes,
  FaUserCog,
  FaArrowLeft,
  FaHistory
} from 'react-icons/fa';

export default function Dashboard() {
  const [vistaActiva, setVistaActiva] = useState('productos');
  const [recargarUsuarios, setRecargarUsuarios] = useState(false);
  const navigate = useNavigate();

  const renderVista = () => {
    switch (vistaActiva) {
      case 'pedidos':
        return <AdminPedidos />;
      case 'usuarios':
        return <AdminUsuarios recargar={recargarUsuarios} setRecargar={setRecargarUsuarios} />;
      case 'reposiciones':
        return <HistorialReposiciones />;
      case 'productos':
      default:
        return <ProductAdmin />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-md p-4 flex flex-col">
        <h2 className="text-lg font-bold text-yellow-800 mb-6">Menú de Admin</h2>

        <button
          onClick={() => setVistaActiva('pedidos')}
          className={`flex items-center gap-2 px-4 py-3 mb-2 rounded transition-all duration-200 hover:bg-yellow-100 ${
            vistaActiva === 'pedidos' ? 'bg-yellow-200 text-yellow-900 font-semibold' : 'text-yellow-800'
          }`}
        >
          <FaClipboardList className="text-yellow-600" />
          Panel de Pedidos
        </button>

        <button
          onClick={() => setVistaActiva('productos')}
          className={`flex items-center gap-2 px-4 py-3 mb-2 rounded transition-all duration-200 hover:bg-yellow-100 ${
            vistaActiva === 'productos' ? 'bg-yellow-200 text-yellow-900 font-semibold' : 'text-yellow-800'
          }`}
        >
          <FaBoxes className="text-yellow-600" />
          Gestión de Productos
        </button>

        <button
          onClick={() => setVistaActiva('usuarios')}
          className={`flex items-center gap-2 px-4 py-3 mb-2 rounded transition-all duration-200 hover:bg-yellow-100 ${
            vistaActiva === 'usuarios' ? 'bg-yellow-200 text-yellow-900 font-semibold' : 'text-yellow-800'
          }`}
        >
          <FaUserCog className="text-yellow-600" />
          Gestión de Usuarios
        </button>

        <button
          onClick={() => setVistaActiva('reposiciones')}
          className={`flex items-center gap-2 px-4 py-3 mb-2 rounded transition-all duration-200 hover:bg-yellow-100 ${
            vistaActiva === 'reposiciones' ? 'bg-yellow-200 text-yellow-900 font-semibold' : 'text-yellow-800'
          }`}
        >
          <FaHistory className="text-yellow-600" />
          Historial de Reposición
        </button>

        <div className="mt-auto pt-4 border-t">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            <FaArrowLeft /> Volver al Menú Principal
          </button>
        </div>
      </aside>

      {/* Panel principal */}
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        {renderVista()}
      </main>
    </div>
  );
}
