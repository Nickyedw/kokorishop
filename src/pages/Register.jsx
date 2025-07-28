// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [nombre_completo, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMensajeError('');

    // Validación básica
    if (password !== confirmPassword) {
      setMensajeError('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_completo, correo, telefono, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al registrar');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario_id', data.usuario.id); // ✅ importante

      navigate('/menu'); // Redirige tras registro
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 p-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">Crear Cuenta</h2>

        {mensajeError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {mensajeError}
          </div>
        )}

        <label className="block mb-2 text-sm font-medium">Nombre completo:</label>
        <input
          type="text"
          value={nombre_completo}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 text-sm font-medium">Correo electrónico:</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 text-sm font-medium">Teléfono:</label>
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 text-sm font-medium">Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 text-sm font-medium">Confirmar Contraseña:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-semibold"
        >
          Registrarse
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          ¿Ya tienes cuenta? <Link to="/login" className="text-yellow-600 hover:underline">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
