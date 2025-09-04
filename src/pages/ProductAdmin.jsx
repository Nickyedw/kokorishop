// src/pages/ProductAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";
import { getProductos, deleteProducto } from "../services/productService";
import AdminShell from "../components/admin/AdminShell";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ProductAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | oferta | destacados | bajo
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [productoEdit, setProductoEdit] = useState(null);

  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categorias`, { cache: "no-store" });
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCategorias([]);
    }
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await getProductos();
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudo cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);

  const handleAgregar = () => {
    setProductoEdit(null);
    setOpenForm(true);
  };

  const handleEdit = (p) => {
    setProductoEdit(p);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProducto(id);
      toast.success("🗑️ Producto eliminado");
      await cargarProductos();
    } catch (err) {
      console.error(err);
      toast.error("❌ No se pudo eliminar");
    }
  };

  const stats = useMemo(() => {
    const total = productos.length;
    const oferta = productos.filter((p) => p.en_oferta).length;
    const destacados = productos.filter((p) => p.destacado).length;
    const bajo = productos.filter(
      (p) =>
        typeof p.stock_actual === "number" &&
        typeof p.stock_minimo === "number" &&
        p.stock_actual <= p.stock_minimo
    ).length;
    return { total, oferta, destacados, bajo };
  }, [productos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = productos;

    if (filter === "oferta") arr = arr.filter((p) => !!p.en_oferta);
    if (filter === "destacados") arr = arr.filter((p) => !!p.destacado);
    if (filter === "bajo")
      arr = arr.filter(
        (p) =>
          typeof p.stock_actual === "number" &&
          typeof p.stock_minimo === "number" &&
          p.stock_actual <= p.stock_minimo
      );

    if (!q) return arr;

    return arr.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q) ||
        p.categoria_nombre?.toLowerCase().includes(q)
    );
  }, [productos, search, filter]);

  return (
    <AdminShell title="Gestión de Productos">
      {/* Toolbar sticky; edge-to-edge sin provocar overflow */}
      <div
        className="
    sticky top-1 md:top-0 z-30 bg-gray-50/80 backdrop-blur
    -mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8
    pt-2 md:pt-3 pb-3 md:pb-4   /* ⬅️ más padding inferior */
    shadow-sm border-b
        "
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            className="flex-1 min-w-[220px] border rounded px-3 py-2"
            placeholder="Buscar por nombre, descripción o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={cargarProductos}
              className="rounded px-3 py-2 border hover:bg-gray-100"
              title="Refrescar"
            >
              ↻ Refrescar
            </button>
            <button
              onClick={handleAgregar}
              className="rounded px-3 py-2 bg-green-600 text-white hover:bg-green-700"
              title="Nuevo producto"
            >
              Nuevo
            </button>
          </div>
        </div>

{/* Filtros — se acomodan a cualquier ancho (wrap) */}
<div className="mt-2">
  <div className="flex flex-wrap items-center gap-2">
    <button
      onClick={() => setFilter("all")}
      className={`px-3 py-1 rounded-full border whitespace-nowrap ${
        filter === "all"
          ? "bg-purple-600 text-white border-purple-600"
          : "bg-white"
      }`}
      title="Todos"
    >
      Todos ({stats.total})
    </button>

    <button
      onClick={() => setFilter("oferta")}
      className={`px-3 py-1 rounded-full border whitespace-nowrap ${
        filter === "oferta"
          ? "bg-pink-600 text-white border-pink-600"
          : "bg-white"
      }`}
      title="En oferta"
    >
      💥 Oferta ({stats.oferta})
    </button>

    <button
      onClick={() => setFilter("destacados")}
      className={`px-3 py-1 rounded-full border whitespace-nowrap ${
        filter === "destacados"
          ? "bg-yellow-500 text-white border-yellow-500"
          : "bg-white"
      }`}
      title="Destacados"
    >
      ⭐ Destacados ({stats.destacados})
    </button>

    <button
      onClick={() => setFilter("bajo")}
      className={`px-3 py-1 rounded-full border whitespace-nowrap ${
        filter === "bajo"
          ? "bg-red-600 text-white border-red-600"
          : "bg-white"
      }`}
      title="Stock bajo"
    >
      ⚠️ Stock bajo ({stats.bajo})
    </button>
  </div>
</div>
      </div>

      {/* separador para que el primer card no quede pegado al borde de la toolbar */}
      <div className="h-4 md:h-8" />

      {/* Estado de carga */}
      {loading && <div className="mt-2 text-sm text-gray-500">Cargando productos…</div>}

      {/* Lista (tabla en md+, cards en móvil dentro de ProductList) */}
      <div className="px-0 md:px-0 lg:px-0">
        <ProductList
          productos={filtered}
          cargarProductos={cargarProductos}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

{/* Modal formulario */}
{openForm && (
  <div
    className="fixed inset-0 z-[60] bg-black/60 p-3 grid place-items-center"
    onClick={() => setOpenForm(false)}
  >
    <div
      className="
        w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl
        bg-white rounded-2xl shadow-2xl
        max-h-[92vh] overflow-y-auto
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header sticky para que el título y el botón queden visibles al hacer scroll */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-5 py-3 rounded-t-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {productoEdit ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300"
            onClick={() => setOpenForm(false)}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Contenido con padding; el scroll ocurre en el contenedor padre */}
      <div className="px-5 pb-4 pt-3">
        <ProductForm
          key={productoEdit?.id || "nuevo"}
          productoEdit={productoEdit}
          categorias={categorias}
          onSaved={() => {
            setOpenForm(false);
            cargarProductos();
          }}
        />

        {/* Footer con separación del contenido */}
        <div className="mt-4 flex justify-end">
          <button
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setOpenForm(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      {/* FAB solo en móvil */}
      <Motion.button
        onClick={handleAgregar}
        className="
          md:hidden
          fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))]
          bg-green-600 hover:bg-green-700 text-white px-5 py-4
          rounded-full text-2xl z-[70] shadow-lg
        "
        title="Agregar nuevo producto"
        whileTap={{ scale: 0.98 }}
      >
        ➕
      </Motion.button>
    </AdminShell>
  );
}
