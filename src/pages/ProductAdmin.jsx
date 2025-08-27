// src/components/ProductAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import ProductList from "../components/ProductList";
import ProductForm from "../components/ProductForm";
import { getProductos, deleteProducto } from "../services/productService"; //⬅️ asegúrate de exportarlo

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
    <div className="p-4">
      {/* Header controles */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <input
            className="w-full max-w-3xl border rounded px-3 py-2"
            placeholder="Buscar por nombre, descripción o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full border ${
                filter === "all" ? "bg-purple-600 text-white border-purple-600" : "bg-white"
              }`}
              title="Todos"
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter("oferta")}
              className={`px-3 py-1 rounded-full border ${
                filter === "oferta" ? "bg-pink-600 text-white border-pink-600" : "bg-white"
              }`}
              title="En oferta"
            >
              💥 Oferta ({stats.oferta})
            </button>
            <button
              onClick={() => setFilter("destacados")}
              className={`px-3 py-1 rounded-full border ${
                filter === "destacados" ? "bg-yellow-500 text-white border-yellow-500" : "bg-white"
              }`}
              title="Destacados"
            >
              ⭐ Destacados ({stats.destacados})
            </button>
            <button
              onClick={() => setFilter("bajo")}
              className={`px-3 py-1 rounded-full border ${
                filter === "bajo" ? "bg-red-600 text-white border-red-600" : "bg-white"
              }`}
              title="Stock bajo"
            >
              ⚠️ Stock bajo ({stats.bajo})
            </button>

            <button
              onClick={cargarProductos}
              className="ml-auto px-3 py-1 rounded border hover:bg-gray-50"
              title="Refrescar"
            >
              ↻ Refrescar
            </button>
          </div>
        </div>

        <Motion.button
          onClick={handleAgregar}
          className="self-start md:self-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
          title="Agregar nuevo producto"
          whileTap={{ scale: 0.98 }}
        >
          ➕ Nuevo
        </Motion.button>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="mt-4 text-sm text-gray-500">Cargando productos…</div>
      )}

      {/* Lista */}
      <ProductList
        productos={filtered}
        cargarProductos={cargarProductos}
        onEdit={handleEdit}
        onDelete={handleDelete} // ✅ ahora sí elimina
      />

      {/* Modal formulario */}
      {openForm && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] grid place-items-center p-4"
          onClick={() => setOpenForm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-3">
              {productoEdit ? "Editar producto" : "Nuevo producto"}
            </h2>

            <ProductForm
              key={productoEdit?.id || "nuevo"} // fuerza remount entre crear/editar
              productoEdit={productoEdit}
              categorias={categorias}
              onSaved={() => {
                setOpenForm(false);
                cargarProductos();
              }}
            />

            <div className="mt-3 flex justify-end">
              <button
                className="px-3 py-2 rounded bg-gray-200"
                onClick={() => setOpenForm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante con pulso (opcional) */}
      <Motion.button
        onClick={handleAgregar}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-full text-2xl z-50 shadow-lg"
        title="Agregar nuevo producto"
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 0 rgba(0,0,0,0)",
            "0 0 20px rgba(34,197,94,0.5)",
            "0 0 0 rgba(0,0,0,0)",
          ],
        }}
        transition={{ repeat: Infinity, repeatType: "loop", duration: 2 }}
      >
        ➕
      </Motion.button>
    </div>
  );
}
