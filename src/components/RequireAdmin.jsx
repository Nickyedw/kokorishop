// src/components/RequireAdmin.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequireAdmin({ children }) {
  const token =
    localStorage.getItem('authToken') || localStorage.getItem('token');
  const esAdmin = localStorage.getItem('es_admin') === 'true';

  if (!token) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/" replace />; // o /menu

  return children;
}
