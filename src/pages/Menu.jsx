// src/pages/Menu.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaClipboardList,
  FaBoxes,
  FaTachometerAlt,
  FaUserPlus,
  FaUserShield
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const Menu = () => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const nombreUsuario = usuario?.nombre || 'Invitado';
  const esAdmin = usuario?.es_admin === true;

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-yellow-800 p-6">
      <h1 className="text-3xl font-bold mb-6">Menú Principal</h1>
      <p className="mb-6">👋 Hola, <strong>{nombreUsuario}</strong></p>
      <ul className="space-y-4">

        <li>
          <Link to="/" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100">
            🏠 <span>Ir a la Tienda</span>
          </Link>
        </li>

        <li>
          <Link to="/configuracion" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100">
            <FaCog className="text-yellow-600" />
            <span>Configuración de Perfil</span>
          </Link>
        </li>
{/* Footer 
        <li>
          <Link to="/register" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100">
            <FaUserPlus className="text-yellow-600" />
            <span>Registrarse</span>
          </Link>
        </li>*/}

        <li>
          <Link to="/mis-pedidos" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100">
            <FaClipboardList className="text-yellow-600" />
            <span>Mis Pedidos</span>
          </Link>
        </li>

        {esAdmin && (
          <>
            <li>
              <Link to="/admin" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100">
                <FaTachometerAlt className="text-yellow-600" />
                <span>Panel Administrativo</span>
              </Link>
            </li>
          </>
        )}

        <li>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100 w-full text-left"
          >
            <FaSignOutAlt className="text-yellow-600" />
            <span>Cerrar Sesión</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Menu;
