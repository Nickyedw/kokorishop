// src/pages/AdminUsuarios.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaTrash,
  FaEdit,
  FaFileExcel,
  FaFilePdf,
  FaUserPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import AdminShell from "../components/admin/AdminShell";
import AdminCrearUsuario from "./AdminCrearUsuario"; // 👈 IMPORTANTE

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminUsuarios() {
  // datos
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros / búsqueda
  const [filtro, setFiltro] = useState("");
  const [rol, setRol] = useState("todos");

  // paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;

  // edición / creación
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    direccion: "",
    es_admin: false,
  });

  const obtenerUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/usuarios/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  // ---- derivados
  const usuariosFiltrados = useMemo(() => {
    const base = (usuarios || [])
      .filter(
        (u) =>
          u.nombre_completo?.toLowerCase().includes(filtro.toLowerCase()) ||
          u.correo?.toLowerCase().includes(filtro.toLowerCase())
      )
      .filter((u) => {
        if (rol === "admins") return !!u.es_admin;
        if (rol === "clientes") return !u.es_admin;
        return true;
      });

    return base;
  }, [usuarios, filtro, rol]);

  const totalPaginas =
    Math.max(1, Math.ceil(usuariosFiltrados.length / usuariosPorPagina)) || 1;

  const usuariosPagina = useMemo(() => {
    const start = (paginaActual - 1) * usuariosPorPagina;
    return usuariosFiltrados.slice(start, start + usuariosPorPagina);
  }, [usuariosFiltrados, paginaActual]);

  // ---- acciones
  const eliminarUsuario = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/usuarios/admin/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Usuario eliminado");
      obtenerUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error("No se pudo eliminar el usuario");
    }
  };

  const abrirModalEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setForm({
      nombre_completo: usuario.nombre_completo || "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || "",
      direccion: usuario.direccion || "",
      es_admin: !!usuario.es_admin,
    });
  };

  const cerrarModalEdicion = () => {
    setUsuarioEditando(null);
    setForm({
      nombre_completo: "",
      correo: "",
      telefono: "",
      direccion: "",
      es_admin: false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleActualizar = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/api/usuarios/admin/usuarios/${usuarioEditando.id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Usuario actualizado correctamente");
      cerrarModalEdicion();
      obtenerUsuarios();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast.error("No se pudo actualizar el usuario");
    }
  };

  // exports (carga diferida)
  const exportarExcel = async () => {
    const XLSX = await import("xlsx");
    const data = usuariosFiltrados.map((u) => ({
      Nombre: u.nombre_completo,
      Correo: u.correo,
      Teléfono: u.telefono || "",
      Dirección: u.direccion || "",
      Admin: u.es_admin ? "Sí" : "No",
      Creado: u.creado_en ? new Date(u.creado_en).toLocaleString() : "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "usuarios.xlsx");
  };

const exportarPDF = async () => {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.text("Lista de Usuarios", 14, 10);

  autoTable(doc, {
    startY: 15,
    head: [["Nombre", "Correo", "Teléfono", "¿Admin?", "Creado"]],
    body: usuariosFiltrados.map((u) => [
      u.nombre_completo,
      u.correo,
      u.telefono || "",
      u.es_admin ? "Sí" : "No",
      u.creado_en ? new Date(u.creado_en).toLocaleString() : "",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [243, 244, 246], textColor: 33 },
  });

  doc.save("usuarios.pdf");
};


  // ---------- UI ----------
  return (
    <AdminShell title="Gestión de Usuarios">
      {/* Toolbar sticky, edge-to-edge sin overflow */}
      <div
        className="
          sticky top-1 md:top-0 z-30 bg-gray-50/80 backdrop-blur
          -mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8
          pt-2 md:pt-3 pb-3 md:pb-4 shadow-sm border-b
        "
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Buscar por nombre o correo…"
            className="flex-1 min-w-[220px] border rounded px-3 py-2"
            value={filtro}
            onChange={(e) => {
              setPaginaActual(1);
              setFiltro(e.target.value);
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rol}
              onChange={(e) => {
                setPaginaActual(1);
                setRol(e.target.value);
              }}
              className="border rounded px-3 py-2"
            >
              <option value="todos">Todos</option>
              <option value="admins">Solo Admins</option>
              <option value="clientes">Solo Clientes</option>
            </select>

            <button
              onClick={exportarExcel}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
              title="Exportar Excel"
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={exportarPDF}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
              title="Exportar PDF"
            >
              <FaFilePdf /> PDF
            </button>
            <button
              onClick={() => {
                setModalCrear(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
              title="Crear usuario"
            >
              <FaUserPlus /> Crear Usuario
            </button>
          </div>
        </div>
      </div>

      {/* separador para que no se pegue la primera card/tabla */}
      <div className="h-3 md:h-4" />

      {/* Cards móvil */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="text-sm text-gray-500">Cargando usuarios…</div>
        )}
        {!loading &&
          usuariosPagina.map((u) => (
            <div key={u.id} className="bg-white rounded-xl shadow-sm border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold break-words">
                    {u.nombre_completo}
                  </div>
                  <div className="text-sm text-gray-600 break-words">
                    {u.correo}
                  </div>
                  <div className="text-xs text-gray-500">
                    {u.es_admin ? "Admin" : "Cliente"} • {u.telefono || "—"}
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {u.creado_en ? new Date(u.creado_en).toLocaleString() : ""}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-400 hover:bg-yellow-300 text-white text-sm"
                  onClick={() => abrirModalEdicion(u)}
                  title="Editar"
                >
                  <FaEdit /> Editar
                </button>
                <button
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                  onClick={() => eliminarUsuario(u.id)}
                  title="Eliminar"
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Tabla md+ */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[860px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Correo</th>
              <th className="p-3 text-left">Teléfono</th>
              <th className="p-3 text-center">¿Admin?</th>
              <th className="p-3 text-left whitespace-nowrap">Creado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-3" colSpan={6}>
                  Cargando usuarios…
                </td>
              </tr>
            )}
            {!loading &&
              usuariosPagina.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{u.nombre_completo}</td>
                  <td className="p-3">{u.correo}</td>
                  <td className="p-3">{u.telefono || "—"}</td>
                  <td className="p-3 text-center">{u.es_admin ? "✅" : "❌"}</td>
                  <td className="p-3">
                    {u.creado_en ? new Date(u.creado_en).toLocaleString() : ""}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="px-3 py-1.5 rounded bg-yellow-400 hover:bg-yellow-300 text-white"
                        onClick={() => abrirModalEdicion(u)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => eliminarUsuario(u.id)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
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
          onClick={() => setPaginaActual((n) => Math.min(totalPaginas, n + 1))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* MODAL EDITAR */}
      {usuarioEditando && (
        <div
          className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4"
          onClick={cerrarModalEdicion}
        >
          <div
            className="bg-white w-full max-w-lg rounded-xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Editar usuario</h3>
              <button
                onClick={cerrarModalEdicion}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleActualizar} className="space-y-3">
              <input
                type="text"
                name="nombre_completo"
                value={form.nombre_completo}
                onChange={handleChange}
                placeholder="Nombre completo"
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="Correo"
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Dirección"
                className="w-full p-2 border rounded"
              />
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="es_admin"
                  checked={form.es_admin}
                  onChange={handleChange}
                />
                <span>¿Es administrador?</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModalEdicion}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR */}
      {modalCrear && (
        <div
          className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4"
          onClick={() => setModalCrear(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-xl shadow-xl p-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalCrear(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
              title="Cerrar"
            >
              ✕
            </button>

            {AdminCrearUsuario ? (
              <AdminCrearUsuario
                onClose={() => setModalCrear(false)}
                onSuccess={() => {
                  setModalCrear(false);
                  obtenerUsuarios();
                }}
              />
            ) : (
              <div className="text-sm text-gray-600">
                No se encontró el componente de creación. Revisa el import.
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
