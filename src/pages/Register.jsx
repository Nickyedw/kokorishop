// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [nombre_completo, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMensajeError('');

  const telefonoConPrefijo = telefono.startsWith('+51')
  ? telefono
  : '+51' + telefono.replace(/^0+/, ''); // elimina ceros iniciales si los hay

    if (telefono.length !== 9) {
    setMensajeError('El teléfono debe tener exactamente 9 dígitos');
    return;
    }

    if (password !== confirmPassword) {
      setMensajeError('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_completo, correo, telefono: telefonoConPrefijo, direccion, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al registrar');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario_id', data.usuario.id);
      localStorage.setItem('usuario_nombre', data.usuario.nombre);

      toast.success('🎉 ¡Registro exitoso!');
      navigate('/'); // o si prefieres: navigate('/menu')
    } catch (error) {
      toast.error(error.message);
      setMensajeError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">Crear Cuenta</h2>

        {mensajeError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {mensajeError}
          </div>
        )}

        <form onSubmit={handleRegister}>
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
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded"
            required
          />

          <label className="block mb-2 text-sm font-medium">Nro. de Celular:</label>
          <div className="flex">
            <span className="px-3 py-2 bg-gray-200 border border-r-0 rounded-l text-gray-700">+51</span>
            <input
              type="tel"
              autoComplete="tel"
              maxLength={9}
              pattern="\d{9}"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))} // solo números
              className="w-full px-4 py-2 border border-l-0 rounded-r"
              required
            />
          </div>
          
          <div className="mb-4"></div>
          <label className="block mb-2 text-sm font-medium">Dirección:</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded"
            required
          />

          <label className="block mb-2 text-sm font-medium">Contraseña:</label>
          <input
            type="password"
            autoComplete="new-password"
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
        </form>

        <div className="mt-4 flex flex-col gap-2 text-center text-sm text-gray-600">
          <span>¿Ya tienes cuenta?</span>
          <Link to="/login" className="text-yellow-600 hover:underline">Inicia sesión</Link>
          <Link to="/" className="text-purple-600 hover:underline">← Volver a la Tienda</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
