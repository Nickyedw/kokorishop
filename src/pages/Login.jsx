// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensajeError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error en el inicio de sesión');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario_id', data.usuario.id); // ✅ guardamos también el ID del usuario

      navigate('/menu'); // Redirigir al menú principal
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">Iniciar Sesión</h2>

        {mensajeError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {mensajeError}
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
        ¿No tienes cuenta? <Link to="/register" className="text-yellow-600 hover:underline">Regístrate aquí</Link>
        </p>


        <label className="block mb-2 text-sm font-medium">Correo electrónico:</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 text-sm font-medium">Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-semibold"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default Login;
