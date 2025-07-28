import React, { useState } from 'react';
import ProductAdmin from './ProductAdmin';
import AdminPedidos from './AdminPedidos';
import { FaClipboardList, FaBoxes } from 'react-icons/fa';

export default function Dashboard() {
  const [vistaActiva, setVistaActiva] = useState('productos');

  const renderVista = () => {
    switch (vistaActiva) {
      case 'pedidos':
        return <AdminPedidos />;
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
          className={`flex items-center gap-2 px-4 py-3 rounded transition-all duration-200 hover:bg-yellow-100 ${
            vistaActiva === 'productos' ? 'bg-yellow-200 text-yellow-900 font-semibold' : 'text-yellow-800'
          }`}
        >
          <FaBoxes className="text-yellow-600" />
          Gestión de Productos
        </button>
      </aside>

      {/* Panel principal */}
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        {renderVista()}
      </main>
    </div>
  );
}
