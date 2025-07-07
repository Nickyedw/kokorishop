// src/pages/EditarProducto.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

function EditarProducto() {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Editar producto {id}</h2>
      {/* Aquí luego puedes poner un formulario para editar */}
    </div>
  );
}

export default EditarProducto;
