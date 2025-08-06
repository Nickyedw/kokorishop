// src/pages/AdminPedidos.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmarPagoButton from '../components/ConfirmarPagoButton';
import { Link } from 'react-router-dom';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';
import { format, isWithinInterval, parseISO } from 'date-fns';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const estadosDisponibles = [
  'pendiente',
  'pago confirmado',
  'listo para entrega',
  'pedido enviado',
  'pedido entregado'
];

const AdminPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 5;

  const [filtroCliente, setFiltroCliente] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const obtenerPedidos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/pedidos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPedidos(res.data);
    } catch (error) {
      console.error('❌ Error al obtener pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (idPedido, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:3001/api/pedidos/${idPedido}/estado`, { estado: nuevoEstado });
      obtenerPedidos();
    } catch (error) {
  console.error('Error al actualizar estado:', error);
  alert('Error al actualizar estado');
  }
  };

  useEffect(() => {
    obtenerPedidos();
  }, []);

  const pedidosFiltrados = pedidos
    .filter(p => p.cliente?.toLowerCase().includes(busqueda.toLowerCase()) || p.id?.toString().includes(busqueda))
    .filter(p => estadoFiltro === 'todos' || p.estado === estadoFiltro);

  const pedidosPaginados = pedidosFiltrados.slice((paginaActual - 1) * pedidosPorPagina, paginaActual * pedidosPorPagina);
  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina);

  const exportarExcel = (datos) => {
    const data = datos.map(p => ({
      ID: p.id,
      Cliente: p.cliente,
      Estado: p.estado,
      Comentario: p.comentario_pago || '',
      Fecha: format(new Date(p.fecha), 'yyyy-MM-dd HH:mm')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, 'pedidos_filtrados.xlsx');
  };

const exportarPDF = (datos) => {
  const doc = new jsPDF();
  doc.text('Pedidos', 14, 10);
  autoTable(doc, {
    startY: 15,
    head: [['ID', 'Cliente', 'Estado', 'Comentario', 'Fecha']],
    body: datos.map(p => [
      `#${p.id}`,
      p.cliente,
      p.estado,
      p.comentario_pago || '',
      format(new Date(p.fecha), 'yyyy-MM-dd HH:mm')
    ])
  });
  doc.save('pedidos_filtrados.pdf');
};


  const pedidosFiltradosExport = pedidosFiltrados.filter(p => {
    const fecha = parseISO(p.fecha);
    const matchFecha = (!fechaInicio || !fechaFin || isWithinInterval(fecha, { start: new Date(fechaInicio), end: new Date(fechaFin) }));
    const matchCliente = filtroCliente === '' || p.cliente?.toLowerCase().includes(filtroCliente.toLowerCase());
    return matchFecha && matchCliente;
  });

  const pedidosPorEstado = estadosDisponibles.map(estado => ({
    name: estado,
    value: pedidos.filter(p => p.estado === estado).length
  })).filter(d => d.value > 0);

  const pedidosPorMes = pedidos.reduce((acc, p) => {
    const mes = format(new Date(p.fecha), 'yyyy-MM');
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {});

  const datosPorMes = Object.keys(pedidosPorMes).map(mes => ({ mes, pedidos: pedidosPorMes[mes] }));
  const colores = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

  if (loading) return <p className="p-4">⏳ Cargando...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📦 Panel de Administración de Pedidos</h2>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Pedidos por Estado</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pedidosPorEstado} dataKey="value" nameKey="name" outerRadius={80} label>
                {pedidosPorEstado.map((entry, index) => <Cell key={index} fill={colores[index % colores.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Pedidos por Mes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosPorMes}>
              <XAxis dataKey="mes" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="pedidos" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input placeholder="Buscar cliente o ID..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="p-2 border rounded w-full md:w-1/3" />
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="p-2 border rounded">
          <option value="todos">Todos</option>
          {estadosDisponibles.map(estado => <option key={estado}>{estado}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white rounded shadow">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="px-3 py-2 border-b">ID</th>
              <th className="px-3 py-2 border-b">Cliente</th>
              <th className="px-3 py-2 border-b">Estado</th>
              <th className="px-3 py-2 border-b">Comentario</th>
              <th className="px-3 py-2 border-b">Fecha</th>
              <th className="px-3 py-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosPaginados.map(pedido => (
              <tr key={pedido.id} className="text-center hover:bg-gray-50 text-sm">
                <td className="border px-2 py-1">
                  <Link to={`/admin/pedidos/${pedido.id}`} className="text-blue-600 hover:underline">#{pedido.id}</Link>
                </td>
                <td className="border px-2 py-1">{pedido.cliente}</td>
                <td className="border px-2 py-1">
                  <select value={pedido.estado} onChange={(e) => actualizarEstado(pedido.id, e.target.value)} className="text-sm border rounded px-2 py-1">
                    {estadosDisponibles.map(estado => <option key={estado} value={estado}>{estado}</option>)}
                  </select>
                </td>
                <td className="border px-2 py-1 text-left">{pedido.comentario_pago || '—'}</td>
                <td className="border px-2 py-1">{format(new Date(pedido.fecha), 'yyyy-MM-dd HH:mm')}</td>
                <td className="border px-2 py-1">
                  <ConfirmarPagoButton pedidoId={pedido.id} pagoConfirmado={pedido.pago_confirmado} recargarPedidos={obtenerPedidos} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center mt-4 gap-3">
        <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)} className="px-4 py-2 bg-gray-200 rounded">Anterior</button>
        <span>Página {paginaActual} de {totalPaginas}</span>
        <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)} className="px-4 py-2 bg-gray-200 rounded">Siguiente</button>
      </div>

      {/* Exportación filtrada */}
      <div className="mt-8 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Exportar por Rango de Fecha o Cliente</h3>
        <div className="flex flex-col md:flex-row gap-4 mb-3">
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="p-2 border rounded" />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="p-2 border rounded" />
          <input placeholder="Cliente (opcional)" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} className="p-2 border rounded flex-1" />
          <button onClick={() => exportarExcel(pedidosFiltradosExport)} className="bg-green-500 text-white px-4 py-2 rounded">Excel</button>
          <button onClick={() => exportarPDF(pedidosFiltradosExport)} className="bg-red-500 text-white px-4 py-2 rounded">PDF</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPedidos;
