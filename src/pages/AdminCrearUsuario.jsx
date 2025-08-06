// src/pages/AdminCrearUsuario.jsx

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AdminCrearUsuario({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    telefono: '',
    direccion: '',
    password: '',
    es_admin: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/api/usuarios/admin/usuarios', form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Usuario creado correctamente');

      // Limpiar formulario
      setForm({
        nombre_completo: '',
        correo: '',
        telefono: '',
        direccion: '',
        password: '',
        es_admin: false,
      });

      // Cerrar modal y recargar lista desde AdminUsuarios
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast.error('Hubo un error al crear el usuario');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Crear Nuevo Usuario</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="nombre_completo" placeholder="Nombre completo" value={form.nombre_completo} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
        <input type="email" name="correo" placeholder="Correo electrónico" value={form.correo} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
        <input type="text" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        <input type="text" name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} className="w-full p-3 border rounded-lg" />
        <input type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} className="w-full p-3 border rounded-lg" required />

        <label className="flex items-center space-x-2">
          <input type="checkbox" name="es_admin" checked={form.es_admin} onChange={handleChange} />
          <span className="text-sm">¿Es administrador?</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
          <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl">
            Crear Usuario
          </button>
        </div>
      </form>
    </div>
  );
}
