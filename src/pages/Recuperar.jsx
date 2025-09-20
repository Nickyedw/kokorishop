// src/pages/Recuperar.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// 🔑 Base de la API desde .env (.env.development / .env.production)
const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Recuperar = () => {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  const handleEnviar = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_APP}/api/auth/recuperar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      });

      if (!res.ok) throw new Error('No se pudo enviar el código');

      toast.success('📩 Código enviado al correo');
      setEnviado(true);

      // Redirigir a la pantalla para ingresar el código y nueva contraseña
      setTimeout(() => {
        navigate('/reestablecer', { state: { correo } });
      }, 1500); // Espera 1.5 segundos para mostrar mensaje

    } catch (err) {
      toast.error(err.message || 'Error al enviar');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 p-4">
      <form onSubmit={handleEnviar} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-purple-800 mb-4">Recuperar Contraseña</h2>

        <label className="block mb-2 text-sm font-medium">Correo registrado:</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
          Enviar código
        </button>

        {enviado && (
          <p className="text-green-600 text-center mt-4 text-sm">
            ✅ Código enviado. Serás redirigido...
          </p>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Recordaste tu contraseña?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-purple-700 hover:underline"
          >
            Volver al Login
          </button>
        </p>
      </form>
    </div>
  );
};

export default Recuperar;
