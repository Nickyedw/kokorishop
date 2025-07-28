import React from 'react';

import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaClipboardList,
  FaBoxes,
  FaTachometerAlt,
  FaUserPlus
} from 'react-icons/fa';

const Menu = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-yellow-800 p-6">
      <h1 className="text-3xl font-bold mb-6">Menú Principal</h1>
      <ul className="space-y-4">

        <li>
          <Link to="/perfil" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100 cursor-pointer">
            <FaUser className="text-yellow-600" />
            <span>Mi Perfil</span>
          </Link>
        </li>

        <li>
          <Link to="/configuracion" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100 cursor-pointer">
            <FaCog className="text-yellow-600" />
            <span>Configuración</span>
          </Link>
        </li>

        <li>
          <Link to="/register" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100 cursor-pointer">
            <FaUserPlus className="text-yellow-600" />
            <span>Registrarse</span>
          </Link>
        </li>

        <li>
          <Link to="/mis-pedidos" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100 cursor-pointer">
            <FaClipboardList className="text-yellow-600" />
            <span>Mis Pedidos</span>
          </Link>
        </li>

        <li>
          <Link to="/admin" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100 cursor-pointer">
            <FaTachometerAlt className="text-yellow-600" />
            <span>Panel Administrativo</span>
          </Link>
        </li>

        <li>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-md hover:bg-yellow-100 cursor-pointer w-full text-left"
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
