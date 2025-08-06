// src/pages/AdminUsuarios.jsx

import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaEdit, FaFileExcel, FaFilePdf, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminCrearUsuario from './AdminCrearUsuario';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [rol, setRol] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    telefono: '',
    direccion: '',
    es_admin: false,
  });

  const obtenerUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/usuarios/admin/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      toast.error('Error al cargar usuarios');
    }
  };

  const eliminarUsuario = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/usuarios/admin/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Usuario eliminado');
      obtenerUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('No se pudo eliminar el usuario');
    }
  };

  const abrirModalEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setForm({
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo,
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || '',
      es_admin: usuario.es_admin,
    });
  };

  const cerrarModal = () => {
    setUsuarioEditando(null);
    setForm({
      nombre_completo: '',
      correo: '',
      telefono: '',
      direccion: '',
      es_admin: false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleActualizar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/usuarios/admin/usuarios/${usuarioEditando.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Usuario actualizado correctamente');
      cerrarModal();
      obtenerUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('No se pudo actualizar el usuario');
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const usuariosFiltrados = usuarios
    .filter((u) =>
      u.nombre_completo.toLowerCase().includes(filtro.toLowerCase()) ||
      u.correo.toLowerCase().includes(filtro.toLowerCase())
    )
    .filter((u) => {
      if (rol === 'admins') return u.es_admin;
      if (rol === 'clientes') return !u.es_admin;
      return true;
    });

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const indiceInicio = (paginaActual - 1) * usuariosPorPagina;
  const usuariosPagina = usuariosFiltrados.slice(indiceInicio, indiceInicio + usuariosPorPagina);

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(usuariosFiltrados);
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'usuarios.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Usuarios', 14, 10);
    doc.autoTable({
      startY: 15,
      head: [['Nombre', 'Correo', 'Teléfono', '¿Admin?', 'Creado']],
      body: usuariosFiltrados.map(u => [
        u.nombre_completo,
        u.correo,
        u.telefono,
        u.es_admin ? 'Sí' : 'No',
        new Date(u.creado_en).toLocaleString()
      ])
    });
    doc.save('usuarios.pdf');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Usuarios</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          className="flex-1 p-2 border rounded"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <select value={rol} onChange={(e) => setRol(e.target.value)} className="p-2 border rounded">
          <option value="todos">Todos</option>
          <option value="admins">Solo Admins</option>
          <option value="clientes">Solo Clientes</option>
        </select>
        <button onClick={exportarExcel} className="bg-green-500 text-white px-3 py-2 rounded flex items-center gap-2">
          <FaFileExcel /> Excel
        </button>
        <button onClick={exportarPDF} className="bg-red-500 text-white px-3 py-2 rounded flex items-center gap-2">
          <FaFilePdf /> PDF
        </button>
        <button onClick={() => setModalCrear(true)} className="bg-blue-500 text-white px-3 py-2 rounded flex items-center gap-2">
          <FaUserPlus /> Crear Usuario
        </button>
      </div>

      <table className="min-w-full border border-gray-300 rounded-md overflow-hidden">
        <thead className="bg-yellow-100 text-left">
          <tr>
            <th className="p-3">Nombre</th>
            <th className="p-3">Correo</th>
            <th className="p-3">Teléfono</th>
            <th className="p-3">¿Admin?</th>
            <th className="p-3">Creado</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosPagina.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-3">{u.nombre_completo}</td>
              <td className="p-3">{u.correo}</td>
              <td className="p-3">{u.telefono}</td>
              <td className="p-3">{u.es_admin ? '✅' : '❌'}</td>
              <td className="p-3">{new Date(u.creado_en).toLocaleString()}</td>
              <td className="p-3 space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => abrirModalEdicion(u)}>
                  <FaEdit />
                </button>
                <button className="text-red-600 hover:underline" onClick={() => eliminarUsuario(u.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-center gap-4">
        <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)} className="px-4 py-2 bg-gray-200 rounded">
          Anterior
        </button>
        <span className="px-2 py-1">Página {paginaActual} de {totalPaginas}</span>
        <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)} className="px-4 py-2 bg-gray-200 rounded">
          Siguiente
        </button>
      </div>

      {/* MODAL EDITAR */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Editar Usuario</h3>
            <form onSubmit={handleActualizar} className="space-y-3">
              <input type="text" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} placeholder="Nombre completo" className="w-full p-2 border rounded" required />
              <input type="email" name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" className="w-full p-2 border rounded" required />
              <input type="text" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full p-2 border rounded" />
              <input type="text" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" className="w-full p-2 border rounded" />
              <label className="flex items-center gap-2">
                <input type="checkbox" name="es_admin" checked={form.es_admin} onChange={handleChange} />
                <span>¿Es administrador?</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={cerrarModal} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl relative">
            <button onClick={() => setModalCrear(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
            <AdminCrearUsuario
              onClose={() => setModalCrear(false)}
              onSuccess={() => {
                setModalCrear(false);
                obtenerUsuarios();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
