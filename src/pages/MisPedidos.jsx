// src/pages/MisPedidos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_APP = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PASOS_ESTADO = [
  "pendiente",
  "pago confirmado",
  "listo para entrega",
  "pedido enviado",
  "pedido entregado",
];

// helpers estado (normaliza y clampa)
const norm = (s = "") => s.toString().toLowerCase().trim();
const pasoIndex = (estado = "") => {
  const i = PASOS_ESTADO.findIndex((p) => norm(p) === norm(estado));
  return Math.min(Math.max(i, 0), PASOS_ESTADO.length - 1);
};

const chipEstado = (estado = "") => {
  switch (norm(estado)) {
    case "pendiente":
      return "bg-yellow-100 text-yellow-800";
    case "pago confirmado":
      return "bg-green-100 text-green-800";
    case "listo para entrega":
      return "bg-blue-100 text-blue-800";
    case "pedido enviado":
      return "bg-indigo-100 text-indigo-800";
    case "pedido entregado":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const S = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const toFullImg = (raw) => {
  if (!raw) return "/img/no-image.png";
  let s = String(raw).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  const upIdx = s.toLowerCase().indexOf("/uploads/");
  if (upIdx >= 0) s = s.slice(upIdx);
  if (!s.startsWith("/")) s = `/${s}`;
  return `${API_APP}${s}`;
};

// helpers fechas
const toInputDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const stripTime = (d) => new Date(new Date(d).toDateString());

export default function MisPedidos() {
  const usuario_nombre = localStorage.getItem("usuario_nombre") || "Invitado";
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // filtros + paginación (con persistencia)
  const [query, setQuery] = useState(
    () => localStorage.getItem("mispedidos_query") || ""
  );
  const [dateFrom, setDateFrom] = useState(
    () => localStorage.getItem("mispedidos_from") || ""
  );
  const [dateTo, setDateTo] = useState(
    () => localStorage.getItem("mispedidos_to") || ""
  );
  const [page, setPage] = useState(() => {
    const p = parseInt(localStorage.getItem("mispedidos_page") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const perPage = 5;

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoSel, setPedidoSel] = useState(null);
  const [cargandoModal, setCargandoModal] = useState(false);

  // Persistencia en localStorage
  useEffect(() => {
    localStorage.setItem("mispedidos_query", query);
  }, [query]);
  useEffect(() => {
    localStorage.setItem("mispedidos_from", dateFrom);
  }, [dateFrom]);
  useEffect(() => {
    localStorage.setItem("mispedidos_to", dateTo);
  }, [dateTo]);
  useEffect(() => {
    localStorage.setItem("mispedidos_page", String(page));
  }, [page]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const token = localStorage.getItem("token");
      const usuario_id = localStorage.getItem("usuario_id");
      const res = await fetch(
        `${API_APP}/api/pedidos?usuario_id=${usuario_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Formato de datos inválido");
      const normData = data
        .map((p) => ({
          ...p,
          total: Number(p.total || 0),
          productos: (p.productos || []).map((d) => ({
            ...d,
            subtotal: Number(d.subtotal || 0),
          })),
        }))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setPedidos(normData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al obtener pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  // ---- filtro + paginación
  const pedidosFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromOk = dateFrom ? stripTime(dateFrom) : null;
    const toOk = dateTo
      ? new Date(stripTime(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1)
      : null;

    return pedidos.filter((p) => {
      // buscar texto
      const enTexto =
        !q ||
        `#${p.id}`.includes(q) ||
        String(p.id).includes(q) ||
        (p.estado || "").toLowerCase().includes(q) ||
        (p.comentario_pago || "").toLowerCase().includes(q) ||
        (p.productos || []).some((it) =>
          (it.producto_nombre || "").toLowerCase().includes(q)
        );

      if (!enTexto) return false;

      // rango fechas
      if (!fromOk && !toOk) return true;
      const t = new Date(p.fecha).getTime();
      if (fromOk && t < fromOk.getTime()) return false;
      if (toOk && t > toOk.getTime()) return false;
      return true;
    });
  }, [pedidos, query, dateFrom, dateTo]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(pedidosFiltrados.length / perPage)
  );
  const pedidosPagina = useMemo(() => {
    const start = (page - 1) * perPage;
    return pedidosFiltrados.slice(start, start + perPage);
  }, [pedidosFiltrados, page]);

  // reset a página 1 cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [query, dateFrom, dateTo]);

  // Modal detalle
  const abrirModal = async (pedidoId) => {
    try {
      setCargandoModal(true);
      setModalAbierto(true);
      const res = await fetch(`${API_APP}/api/pedidos/${pedidoId}`);
      const data = await res.json();
      const normData = {
        ...data,
        total: Number(data.total || 0),
        productos: (data.productos || []).map((d) => ({
          ...d,
          subtotal: Number(d.subtotal || 0),
        })),
      };
      setPedidoSel(normData);
    } catch (e) {
      console.error(e);
      setPedidoSel(null);
    } finally {
      setCargandoModal(false);
    }
  };
  const cerrarModal = () => {
    setModalAbierto(false);
    setPedidoSel(null);
  };

  const limpiarFiltros = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-purple-50 text-purple-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-purple-50/90 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            📦 Tus Pedidos, {usuario_nombre}
          </h1>
          <button
            onClick={() => navigate("/")}
            className="shrink-0 rounded-full px-4 py-2 bg-purple-600 text-white text-sm hover:bg-purple-700 shadow"
          >
            ← Volver a la Tienda
          </button>
        </div>

        {/* Toolbar: buscador + rango fechas */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto,auto] gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Buscar por #ID, estado, producto o comentario…"
              aria-label="Buscar pedidos"
            />
            <input
              type="date"
              value={toInputDate(dateFrom)}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2"
              aria-label="Desde"
            />
            <input
              type="date"
              value={toInputDate(dateTo)}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2"
              aria-label="Hasta"
            />
            <button
              onClick={limpiarFiltros}
              className="px-3 py-2 rounded-lg border hover:bg-gray-100"
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-4 pb-16">
        {loading && (
          <p className="text-center text-gray-500">Cargando pedidos…</p>
        )}

        {errorMsg && (
          <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded mb-4">
            {errorMsg}
          </div>
        )}

        {!loading && pedidosFiltrados.length === 0 && (
          <p className="text-center text-gray-500">
            No hay resultados para los filtros aplicados.
          </p>
        )}

        {/* Cards de pedidos (página actual) */}
        <div className="space-y-4">
          {pedidosPagina.map((p) => {
            const idx = pasoIndex(p.estado || "");
            return (
              <article
                key={p.id}
                className="bg-white rounded-2xl border shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Pedido #{p.id}</h3>
                    <div className="text-xs text-gray-500">
                      {new Date(p.fecha).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${chipEstado(
                      p.estado || ""
                    )}`}
                  >
                    {p.estado || "pendiente"}
                  </span>
                </div>

                {/* Progreso por etapas */}
                <div className="mt-3">
                  {/* barras */}
                  <div className="grid grid-cols-5 gap-2">
                    {PASOS_ESTADO.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full ${
                          i <= idx ? "bg-purple-600" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  {/* etiquetas */}
                  <div className="grid grid-cols-5 gap-2 mt-1 text-[10px] text-gray-600">
                    {PASOS_ESTADO.map((et, i) => (
                      <span
                        key={et}
                        className={`text-center truncate ${
                          i === idx ? "text-purple-700 font-semibold" : ""
                        }`}
                        title={et}
                      >
                        {et}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-700">
                  Total: <strong>{S(p.total)}</strong> — Fecha:{" "}
                  {new Date(p.fecha).toLocaleDateString()}
                  <br />
                  <span className="text-gray-600">💬 Comentario de pago:</span>{" "}
                  <em>{p.comentario_pago || "—"}</em>
                </p>

                <ul className="mt-2 text-sm text-gray-800 list-disc pl-5">
                  {(p.productos || []).map((it) => (
                    <li key={it.id}>
                      {it.producto_nombre} × {it.cantidad} — {S(it.subtotal)}
                    </li>
                  ))}
                </ul>

                <div className="text-right mt-3">
                  <button
                    onClick={() => abrirModal(p.id)}
                    className="text-purple-600 hover:underline text-sm"
                  >
                    Ver detalles →
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Paginación */}
        {pedidosFiltrados.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-sm">
              Página {page} de {totalPaginas} —{" "}
              <span className="text-gray-500">
                {pedidosFiltrados.length} resultado(s)
              </span>
            </span>
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              disabled={page === totalPaginas}
              onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente
            </button>
          </div>
        )}
      </main>

      {/* Modal detalle */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="text-lg font-semibold">
                Detalle del Pedido {pedidoSel ? `#${pedidoSel.id}` : ""}
              </h3>
              <button
                onClick={cerrarModal}
                className="rounded hover:bg-gray-100 px-2 py-1"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-auto">
              {cargandoModal && <p>Cargando detalle…</p>}

              {!cargandoModal && pedidoSel && (
                <>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-3">
                    <span>
                      <strong>Cliente:</strong> {pedidoSel.cliente}
                    </span>
                    <span>
                      <strong>Fecha:</strong>{" "}
                      {new Date(pedidoSel.fecha).toLocaleString()}
                    </span>
                    <span>
                      <strong>Total:</strong> {S(pedidoSel.total)}
                    </span>
                    <span>
                      <strong>Estado:</strong> {pedidoSel.estado}
                    </span>
                  </div>

                  <p className="text-sm mb-4">
                    <strong>Comentario de Pago:</strong>{" "}
                    {pedidoSel.comentario_pago || "—"}
                  </p>

                  <div className="space-y-3">
                    {(pedidoSel.productos || []).map((pr) => (
                      <div
                        key={pr.id}
                        className="flex items-center gap-3 border rounded-lg p-2"
                      >
                        <img
                          src={toFullImg(pr.producto_imagen_url)}
                          alt={pr.producto_nombre}
                          className="w-14 h-14 object-cover rounded-md border"
                          onError={(e) =>
                            (e.currentTarget.src = "/img/no-image.png")
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {pr.producto_nombre}
                          </div>
                          <div className="text-xs text-gray-600">
                            Cant: {pr.cantidad} · PU: {S(pr.precio_unitario)} ·
                            Subtotal: {S(pr.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={cerrarModal}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
