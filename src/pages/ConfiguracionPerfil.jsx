// src/pages/ConfiguracionPerfil.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// 🔑 Base de la API desde .env (.env.development / .env.production)
const API_APP = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ConfiguracionPerfil = () => {
  const navigate = useNavigate();
  const usuario_id = localStorage.getItem('usuario_id');
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    telefono: '',
    direccion: '',
    password: '',
    confirmPassword: ''
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await fetch(`${API_APP}/api/usuarios/${usuario_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setFormData({
            nombre_completo: data.nombre_completo || '',
            correo: data.correo || '',
            telefono: data.telefono?.replace('+51', '') || '',
            direccion: data.direccion || '',
            password: '',
            confirmPassword: ''
          });
        } else {
          throw new Error(data.error || 'Error al cargar perfil');
        }
      } catch (error) {
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, [usuario_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const { password, confirmPassword } = formData;
    if (mostrarPassword && password && password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    const datosActualizados = {
      ...formData,
      telefono: '+51' + formData.telefono.replace(/^\+?51/, '')
    };
    if (!mostrarPassword) {
      delete datosActualizados.password;
    }
    delete datosActualizados.confirmPassword;

    try {
      const res = await fetch(`${API_APP}/api/usuarios/${usuario_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosActualizados)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');

      toast.success('✅ Perfil actualizado con éxito');
      localStorage.setItem('usuario_nombre', formData.nombre_completo);
      navigate('/menu');
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

    const handleCancelarConfirmado = () => {
    setMostrarModal(false);
    navigate('/menu');
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-yellow-800">Configuración de Perfil</h2>

        {loading && <p className="text-center text-sm text-gray-600">Cargando datos...</p>}
        {errorMsg && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{errorMsg}</div>
        )}

        {!loading && (
          <>
            <label className="block mb-2 text-sm font-medium">Nombre completo:</label>
            <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} className="w-full px-4 py-2 mb-4 border rounded" required />

            <label className="block mb-2 text-sm font-medium">Correo electrónico:</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-4 py-2 mb-4 border rounded" required />

            <label className="block mb-2 text-sm font-medium">Teléfono (+51):</label>
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 mb-4 border rounded" required pattern="[0-9]{9}" />

            <label className="block mb-2 text-sm font-medium">Dirección:</label>
            <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-4 py-2 mb-4 border rounded" required />

            <div className="flex items-center mb-4">
              <input type="checkbox" id="togglePassword" checked={mostrarPassword} onChange={(e) => setMostrarPassword(e.target.checked)} className="mr-2" />
              <label htmlFor="togglePassword" className="text-sm">¿Deseas cambiar tu contraseña?</label>
            </div>

            {mostrarPassword && (
              <>
                <label className="block mb-2 text-sm font-medium">Nueva Contraseña:</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 mb-4 border rounded" />

                <label className="block mb-2 text-sm font-medium">Confirmar Contraseña:</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 mb-6 border rounded" />
              </>
            )}

            <div className="flex justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setMostrarModal(true)}
                    className="w-1/2 bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded font-semibold"
                >
                    Cancelar
                </button>
              <button
                type="submit"
                className="w-1/2 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded font-semibold"
              >
                Guardar Cambios
              </button>
            </div>
          </>
        )}
      </form>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-gray-800 mb-4">¿Cancelar cambios?</h2>
            <p className="text-sm text-gray-600 mb-6">Perderás los cambios no guardados.</p>
            <div className="flex justify-end gap-2">
                <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
                >
                Volver
                </button>
                <button
                onClick={handleCancelarConfirmado}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                >
                Sí, cancelar
                </button>
            </div>
            </div>
        </div>
        )}
        
    </div>
  );
};



export default ConfiguracionPerfil;
