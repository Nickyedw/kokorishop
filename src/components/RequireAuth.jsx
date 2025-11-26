// src/components/RequireAuth.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children }) => {
  // Mira primero authToken y, si no hay, intenta con token (compatibilidad)
  const token =
    localStorage.getItem('authToken') || localStorage.getItem('token');

  return token ? children : <Navigate to="/login" replace />;
};

export default RequireAuth;
