// src/pages/AdminPedidos.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { format, isWithinInterval, parseISO } from "date-fns";
import { toast } from "react-toastify";
import ConfirmarPagoButton from "../components/ConfirmarPagoButton";
import AdminShell from "../components/admin/AdminShell";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ESTADOS = [
  "pendiente",
  "pago confirmado",
  "listo para entrega",
  "pedido enviado",
  "pedido entregado",
];

export default function AdminPedidos() {
  // datos
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 5;

  // detalle (impresión)
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const printRef = useRef(null);

  const obtenerPedidos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPedidos(res.data);
    } catch (err) {
      console.error("❌ Error al obtener pedidos:", err);
      toast.error("No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (idPedido, nuevoEstado) => {
    try {
      await axios.put(`${API_BASE}/api/pedidos/${idPedido}/estado`, {
        estado: nuevoEstado,
      });
      await obtenerPedidos();
    } catch (err) {
      console.error("❌ Error al actualizar estado:", err);
      toast.error("No se pudo actualizar el estado");
    }
  };

  useEffect(() => {
    obtenerPedidos();
  }, []);

  // ---- derivados / métricas
  const pedidosFiltrados = useMemo(() => {
    const base = pedidos
      .filter(
        (p) =>
          p.cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
          String(p.id).includes(busqueda)
      )
      .filter((p) => (estadoFiltro === "todos" ? true : p.estado === estadoFiltro));
    return base;
  }, [pedidos, busqueda, estadoFiltro]);

  const pedidosPaginados = useMemo(() => {
    const start = (paginaActual - 1) * pedidosPorPagina;
    return pedidosFiltrados.slice(start, start + pedidosPorPagina);
  }, [pedidosFiltrados, paginaActual]);

  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina) || 1;

  const pedidosFiltradosExport = useMemo(() => {
    return pedidosFiltrados.filter((p) => {
      const fecha = parseISO(p.fecha);
      const matchFecha =
        !fechaInicio ||
        !fechaFin ||
        isWithinInterval(fecha, {
          start: new Date(fechaInicio),
          end: new Date(fechaFin),
        });
      const matchCliente =
        filtroCliente === "" ||
        p.cliente?.toLowerCase().includes(filtroCliente.toLowerCase());
      return matchFecha && matchCliente;
    });
  }, [pedidosFiltrados, fechaInicio, fechaFin, filtroCliente]);

  // métricas para charts
  const pedidosPorEstado = useMemo(() => {
    const arr = ESTADOS.map((estado) => ({
      name: estado,
      value: pedidos.filter((p) => p.estado === estado).length,
    })).filter((d) => d.value > 0);
    return arr;
  }, [pedidos]);

  const datosPorMes = useMemo(() => {
    const acum = pedidos.reduce((acc, p) => {
      const mes = format(new Date(p.fecha), "yyyy-MM");
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(acum).map((mes) => ({ mes, pedidos: acum[mes] }));
  }, [pedidos]);

  const colores = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

  // detalle
  const abrirDetalle = async (idPedido) => {
    try {
      setCargandoDetalle(true);
      setMostrarDetalle(true);
      const res = await axios.get(`${API_BASE}/api/pedidos/${idPedido}`);
      setDetalle(res.data);
    } catch (err) {
      console.error("❌ Error cargando detalle:", err);
      setDetalle(null);
    } finally {
      setCargandoDetalle(false);
    }
  };
  const cerrarDetalle = () => {
    setMostrarDetalle(false);
    setDetalle(null);
  };
  const imprimirDetalle = () => {
    if (!printRef.current) return;
    const contenido = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`
      <html><head><meta charset="utf-8">
      <title>Detalle del Pedido</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial;}
        h2{margin:0 0 8px 0}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{border:1px solid #ddd;padding:6px;text-align:center;font-size:12px}
        th{background:#f3f4f6}
      </style></head>
      <body>${contenido}</body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  // exportaciones
  const exportarExcel = async (datos) => {
    const XLSX = await import("xlsx");
    const data = datos.map((p) => ({
      ID: p.id,
      Cliente: p.cliente,
      Estado: p.estado,
      Comentario: p.comentario_pago || "",
      Fecha: format(new Date(p.fecha), "yyyy-MM-dd HH:mm"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, "pedidos_filtrados.xlsx");
  };

  const exportarPDF = async (datos) => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.text("Pedidos", 14, 10);
    autoTable(doc, {
      startY: 15,
      head: [["ID", "Cliente", "Estado", "Comentario", "Fecha"]],
      body: datos.map((p) => [
        `#${p.id}`,
        p.cliente,
        p.estado,
        p.comentario_pago || "",
        format(new Date(p.fecha), "yyyy-MM-dd HH:mm"),
      ]),
    });
    doc.save("pedidos_filtrados.pdf");
  };

  /* =========================
     LOADER GUARD (usa `loading`)
     ========================= */
  if (loading) {
    return (
      <AdminShell title="Panel de Pedidos">
        <div className="animate-pulse space-y-4">
          <div className="
            sticky top-14 md:top-0 z-30 bg-gray-50/80 backdrop-blur
            -mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8
            pb-3 pt-2 md:pt-3 border-b
          ">
            <div className="h-10 w-full max-w-md bg-gray-200 rounded" />
          </div>
          <div className="h-56 bg-white rounded-xl shadow-sm border" />
          <div className="h-56 bg-white rounded-xl shadow-sm border" />
          <div className="h-40 bg-white rounded-xl shadow-sm border" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Panel de Pedidos">
      {/* Toolbar sticky */}
      <div
        className="
          sticky top-1 md:top-0 z-30 bg-gray-50/80 backdrop-blur
          -mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8
          pb-3 pt-2 md:pt-3 shadow-sm border-b
        "
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            className="flex-1 min-w-[220px] border rounded px-3 py-2"
            placeholder="Buscar cliente o ID…"
            value={busqueda}
            onChange={(e) => {
              setPaginaActual(1);
              setBusqueda(e.target.value);
            }}
          />
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-3 py-2"
              value={estadoFiltro}
              onChange={(e) => {
                setPaginaActual(1);
                setEstadoFiltro(e.target.value);
              }}
            >
              <option value="todos">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button
              className="rounded px-3 py-2 border hover:bg-gray-100"
              onClick={obtenerPedidos}
              title="Refrescar"
            >
              ↻ Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* separador para que no “pegue” el primer bloque */}
      <div className="h-3 md:h-4" />

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-2">Pedidos por Estado</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pedidosPorEstado}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {pedidosPorEstado.map((entry, i) => (
                    <Cell key={i} fill={colores[i % colores.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-2">Pedidos por Mes</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
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
      </div>

      {/* Cards móvil */}
      <div className="md:hidden space-y-3">
        {pedidosPaginados.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border p-3">
            <div className="flex items-baseline justify-between gap-3">
              <button
                className="text-blue-600 font-semibold"
                onClick={() => abrirDetalle(p.id)}
                title="Ver detalle"
              >
                #{p.id}
              </button>
              <span className="text-xs text-gray-500">
                {format(new Date(p.fecha), "yyyy-MM-dd HH:mm")}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-800">
              <div className="font-medium">{p.cliente}</div>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={p.estado}
                onChange={(e) => actualizarEstado(p.id, e.target.value)}
                className="border rounded px-2 py-1"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>

              <ConfirmarPagoButton
                pedidoId={p.id}
                pagoConfirmado={p.pago_confirmado}
                recargarPedidos={obtenerPedidos}
              />
            </div>

            {p.comentario_pago && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">Comentario: </span>
                {p.comentario_pago}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabla md+ */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[920px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border-b">ID</th>
              <th className="px-3 py-2 border-b">Cliente</th>
              <th className="px-3 py-2 border-b">Estado</th>
              <th className="px-3 py-2 border-b">Comentario</th>
              <th className="px-3 py-2 border-b whitespace-nowrap">Fecha</th>
              <th className="px-3 py-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosPaginados.map((p) => (
              <tr key={p.id} className="text-center hover:bg-gray-50">
                <td className="border px-2 py-2">
                  <button
                    onClick={() => abrirDetalle(p.id)}
                    className="text-blue-600 hover:underline"
                  >
                    #{p.id}
                  </button>
                </td>
                <td className="border px-2 py-2">{p.cliente}</td>
                <td className="border px-2 py-2">
                  <select
                    value={p.estado}
                    onChange={(e) => actualizarEstado(p.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border px-2 py-2 text-left">
                  {p.comentario_pago || "—"}
                </td>
                <td className="border px-2 py-2 whitespace-nowrap">
                  {format(new Date(p.fecha), "yyyy-MM-dd HH:mm")}
                </td>
                <td className="border px-2 py-2">
                  <ConfirmarPagoButton
                    pedidoId={p.id}
                    pagoConfirmado={p.pago_confirmado}
                    recargarPedidos={obtenerPedidos}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
        <button
          disabled={paginaActual === 1}
          onClick={() => setPaginaActual((n) => Math.max(1, n - 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm">
          Página {paginaActual} de {totalPaginas}
        </span>
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() =>
            setPaginaActual((n) => Math.min(totalPaginas, n + 1))
          }
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Exportación */}
      <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-3">Exportar por fecha / cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            placeholder="Cliente (opcional)"
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="p-2 border rounded md:col-span-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => exportarExcel(pedidosFiltradosExport)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
            >
              Excel
            </button>
            <button
              onClick={() => exportarPDF(pedidosFiltradosExport)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded w-full"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detalle */}
      {mostrarDetalle && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={cerrarDetalle}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
              onClick={cerrarDetalle}
              title="Cerrar"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">🧾 Detalle del Pedido</h2>

            {cargandoDetalle && <p>Cargando…</p>}
            {!cargandoDetalle && !detalle && (
              <p className="text-red-600">No se pudo cargar el detalle.</p>
            )}

            {!cargandoDetalle && detalle && (
              <>
                <div ref={printRef}>
                  <h3 className="text-lg font-semibold mb-2">
                    Pedido #{detalle.id}
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <strong>Cliente:</strong> {detalle.cliente}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {new Date(detalle.fecha).toLocaleString()}
                    </p>
                    <p>
                      <strong>Estado:</strong> {detalle.estado}
                    </p>
                    <p>
                      <strong>Total:</strong> S/{" "}
                      {Number(detalle.total || 0).toFixed(2)}
                    </p>
                    <p>
                      <strong>Comentario de pago:</strong>{" "}
                      {detalle.comentario_pago || "—"}
                    </p>
                  </div>

                  <table className="mt-4 w-full text-sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detalle.productos || []).map((item) => (
                        <tr key={item.id} className="text-center">
                          <td>{item.producto_nombre}</td>
                          <td>{item.cantidad}</td>
                          <td>S/ {Number(item.precio_unitario).toFixed(2)}</td>
                          <td>S/ {Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={imprimirDetalle}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                  >
                    Imprimir
                  </button>
                  <button
                    onClick={cerrarDetalle}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
