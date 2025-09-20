// src/pages/Reestablecer.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// 🔑 Base de la API desde .env (.env.development / .env.production)
const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Reestablecer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const correo = location.state?.correo || '';

  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!correo || !codigo || !nuevaPassword || !confirmarPassword) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch(`${API_APP}/api/auth/reestablecer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, codigo, nueva_password: nuevaPassword })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al reestablecer');

      toast.success('Contraseña actualizada ✅');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">Reestablecer Contraseña</h2>

        <p className="text-sm text-gray-500 mb-4 text-center">📩 Se enviará al correo: <strong>{correo}</strong></p>

        <label className="block mb-2 text-sm font-medium">Código de recuperación:</label>
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 text-sm font-medium">Nueva contraseña:</label>
        <input
          type="password"
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 text-sm font-medium">Confirmar contraseña:</label>
        <input
          type="password"
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-semibold"
        >
          Confirmar
        </button>
      </form>
    </div>
  );
};

export default Reestablecer;
