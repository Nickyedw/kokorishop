// src/pages/HistorialReposiciones.jsx
import { useEffect, useMemo, useState } from "react";
import { FaFilePdf, FaFileExcel, FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdminShell from "../components/admin/AdminShell";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function HistorialReposiciones() {
  const [reposiciones, setReposiciones] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔢 paginación
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `${API_BASE}/api/productos/historial-reposiciones`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setReposiciones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error al cargar historial:", err);
        setReposiciones([]);
      } finally {
        setLoading(false);
      }
    };
    cargarHistorial();
  }, []);

  // 🧮 filtro
  const reposicionesFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return reposiciones;
    return reposiciones.filter(
      (r) =>
        (r.producto_nombre || "").toLowerCase().includes(q) ||
        (r.usuario_nombre || "").toLowerCase().includes(q)
    );
  }, [reposiciones, filtro]);

  // 👉 resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setPagina(1);
  }, [filtro]);

  // 🧩 página actual
  const totalPaginas =
    Math.max(1, Math.ceil(reposicionesFiltradas.length / porPagina)) || 1;
  const inicio = (pagina - 1) * porPagina;
  const reposicionesPagina = useMemo(
    () => reposicionesFiltradas.slice(inicio, inicio + porPagina),
    [reposicionesFiltradas, inicio, porPagina]
  );

  // 📤 exportaciones (usan TODO el filtro, no solo la página)
  const exportarExcel = () => {
    const data = reposicionesFiltradas.map((r) => ({
      Producto: r.producto_nombre,
      Cantidad: r.cantidad_agregada,
      "Stock Anterior": r.stock_anterior,
      "Stock Nuevo": r.stock_nuevo,
      Usuario: r.usuario_nombre,
      Fecha: new Date(r.fecha).toLocaleString(),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, "historial_reposiciones.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Historial de Reposición de Stock", 14, 10);
    autoTable(doc, {
      startY: 15,
      head: [["Producto", "Cantidad", "Stock Anterior", "Stock Nuevo", "Usuario", "Fecha"]],
      body: reposicionesFiltradas.map((r) => [
        r.producto_nombre,
        r.cantidad_agregada,
        r.stock_anterior,
        r.stock_nuevo,
        r.usuario_nombre,
        new Date(r.fecha).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [243, 244, 246], textColor: 33 },
    });
    doc.save("historial_reposiciones.pdf");
  };

  return (
    <AdminShell title="Historial de Reposición">
      {/* Toolbar sticky, edge-to-edge y sin overflow */}
      <div
        className="
          sticky top-1 md:top-0 z-30 bg-gray-50/80 backdrop-blur
          -mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8
          pt-2 md:pt-3 pb-3 md:pb-4 border-b shadow-sm
        "
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto o usuario…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportarExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-flex items-center gap-2"
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={exportarPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded inline-flex items-center gap-2"
            >
              <FaFilePdf /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* separador para que el 1er bloque no “pegue” con la toolbar */}
      <div className="h-3 md:h-4" />

      {/* Estado de carga */}
      {loading && (
        <div className="text-sm text-gray-500 mb-2">Cargando historial…</div>
      )}

      {/* ===== Vista móvil: Cards ===== */}
      <div className="md:hidden space-y-3">
        {reposicionesPagina.map((r, idx) => (
          <div
            key={`${r.id || idx}-${r.fecha}`}
            className="bg-white rounded-xl shadow-sm border p-3"
          >
            <div className="font-semibold">{r.producto_nombre}</div>
            <div className="text-xs text-gray-500">
              {new Date(r.fecha).toLocaleString()}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Cantidad</div>
                <div className="font-medium">{r.cantidad_agregada}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Usuario</div>
                <div className="font-medium">{r.usuario_nombre}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Stock anterior</div>
                <div className="font-medium">{r.stock_anterior}</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Stock nuevo</div>
                <div className="font-medium">{r.stock_nuevo}</div>
              </div>
            </div>
          </div>
        ))}

        {!loading && reposicionesPagina.length === 0 && (
          <div className="text-center text-gray-500 py-6">
            No hay reposiciones registradas.
          </div>
        )}
      </div>

      {/* ===== Vista md+: Tabla ===== */}
      <div className="hidden md:block overflow-x-auto bg-white rounded shadow-md">
        <table className="min-w-[860px] w-full text-sm text-gray-700">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-center">Cantidad</th>
              <th className="p-3 text-center">Stock Anterior</th>
              <th className="p-3 text-center">Stock Nuevo</th>
              <th className="p-3 text-center">Usuario</th>
              <th className="p-3 text-center whitespace-nowrap">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {reposicionesPagina.map((r, idx) => (
              <tr
                key={`${r.id || idx}-${r.fecha}`}
                className="text-center border-t hover:bg-gray-50"
              >
                <td className="p-2 text-left font-medium">{r.producto_nombre}</td>
                <td className="p-2">{r.cantidad_agregada}</td>
                <td className="p-2">{r.stock_anterior}</td>
                <td className="p-2">{r.stock_nuevo}</td>
                <td className="p-2">{r.usuario_nombre}</td>
                <td className="p-2 whitespace-nowrap">
                  {new Date(r.fecha).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && reposicionesPagina.length === 0 && (
          <div className="text-center text-gray-500 p-6">
            No hay reposiciones registradas.
          </div>
        )}
      </div>

      {/* 🔁 Controles de paginación (comunes para ambas vistas) */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          disabled={pagina === 1}
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm">
          Página {pagina} de {totalPaginas}
        </span>
        <button
          disabled={pagina === totalPaginas}
          onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </AdminShell>
  );
}
