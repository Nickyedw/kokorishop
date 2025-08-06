// src/pages/HistorialReposiciones.jsx
import { useEffect, useState } from 'react';
import { FaFilePdf, FaFileExcel, FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HistorialReposiciones() {
  const [reposiciones, setReposiciones] = useState([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/productos/historial-reposiciones', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('No autorizado');
        const data = await res.json();
        setReposiciones(data);
      } catch (err) {
        console.error('❌ Error al cargar historial:', err.message);
      }
    };

    cargarHistorial();
  }, []);

  const reposicionesFiltradas = (reposiciones || []).filter(r =>
    (r.producto_nombre?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
    (r.usuario_nombre?.toLowerCase() || '').includes(filtro.toLowerCase())
  );

  const exportarExcel = () => {
    const data = reposicionesFiltradas.map(r => ({
      Producto: r.producto_nombre,
      Cantidad: r.cantidad_agregada,
      'Stock Anterior': r.stock_anterior,
      'Stock Nuevo': r.stock_nuevo,
      Usuario: r.usuario_nombre,
      Fecha: new Date(r.fecha).toLocaleString()
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    XLSX.writeFile(wb, 'historial_reposiciones.xlsx');
  };

const exportarPDF = () => {
  const doc = new jsPDF();
  doc.text('Historial de Reposición de Stock', 14, 10);
  autoTable(doc, {
    startY: 15,
    head: [['Producto', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Usuario', 'Fecha']],
    body: reposicionesFiltradas.map(r => [
      r.producto_nombre,
      r.cantidad_agregada,
      r.stock_anterior,
      r.stock_nuevo,
      r.usuario_nombre,
      new Date(r.fecha).toLocaleString()
    ])
  });
  doc.save('historial_reposiciones.pdf');
};


  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-yellow-900">Historial de Reposiciones</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
        <div className="relative w-full">
          <FaSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por producto o usuario"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded shadow-sm focus:ring-yellow-400 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow"
          >
            <FaFileExcel /> Excel
          </button>
          <button
            onClick={exportarPDF}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 shadow"
          >
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow-md">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-center">Cantidad</th>
              <th className="p-3 text-center">Stock Anterior</th>
              <th className="p-3 text-center">Stock Nuevo</th>
              <th className="p-3 text-center">Usuario</th>
              <th className="p-3 text-center">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {reposicionesFiltradas.map((r, idx) => (
              <tr key={idx} className="text-center border-t hover:bg-yellow-50">
                <td className="p-2 text-left font-medium">{r.producto_nombre}</td>
                <td className="p-2">{r.cantidad_agregada}</td>
                <td className="p-2">{r.stock_anterior}</td>
                <td className="p-2">{r.stock_nuevo}</td>
                <td className="p-2">{r.usuario_nombre}</td>
                <td className="p-2">{new Date(r.fecha).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reposicionesFiltradas.length === 0 && (
          <div className="text-center text-gray-500 p-6">No hay reposiciones registradas.</div>
        )}
      </div>
    </div>
  );
}
