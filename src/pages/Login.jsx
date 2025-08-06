// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

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

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('usuario_id', data.usuario.id);
      localStorage.setItem('usuario_nombre', data.usuario.nombre);
      localStorage.setItem('es_admin', data.usuario.es_admin ? 'true' : 'false');

      toast.success(`¡Bienvenido, ${data.usuario.nombre}!`);
      navigate('/menu');
    } catch (error) {
      toast.error(error.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-purple-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">Iniciar Sesión</h2>

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

        <p className="text-center text-sm text-gray-600 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-yellow-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </form>

      <p className="text-center text-sm text-gray-600 mt-2">
        <Link to="/recuperar" className="text-purple-600 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <button
        onClick={() => navigate('/')}
        className="mt-4 text-purple-600 hover:underline text-sm"
      >
        ← Volver a la tienda
      </button>
    </div>
  );
};

export default Login;
