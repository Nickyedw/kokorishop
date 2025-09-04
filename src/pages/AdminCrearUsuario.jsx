// src/pages/AdminCrearUsuario.jsx
import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaWandMagicSparkles } from "react-icons/fa6";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminCrearUsuario({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    direccion: "",
    password: "",
    es_admin: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const genPassword = () => {
    // Genera una contraseña simple de 10 caracteres
    const s = Math.random().toString(36).slice(-6)
            + Math.random().toString(36).toUpperCase().slice(-4);
    setForm((f) => ({ ...f, password: s }));
    toast.info("Contraseña generada");
  };

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validar = () => {
    if (!form.nombre_completo.trim()) return "Ingresa el nombre completo";
    if (!form.correo.trim()) return "Ingresa el correo";
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) return "Correo no válido";
    if (!form.password || form.password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres";
    return null;
  };

  const crear = async (e) => {
    e.preventDefault();
    const msg = validar();
    if (msg) {
      toast.warn(msg);
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/api/usuarios/admin/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre_completo: form.nombre_completo.trim(),
          correo: form.correo.trim(),
          telefono: form.telefono.trim(),
          direccion: form.direccion.trim(),
          password: form.password,       // <-- IMPORTANTE
          es_admin: !!form.es_admin,
        }),
      });

      if (!res.ok) {
        // intenta leer detalle de error del backend
        let detalle = "";
        try {
          const j = await res.json();
          detalle = j?.message || j?.error || "";
        } catch {/* noop */}
        if (res.status === 409) {
          throw new Error(detalle || "El correo ya está registrado");
        }
        if (res.status === 400) {
          throw new Error(detalle || "Datos inválidos");
        }
        throw new Error(detalle || `Error del servidor (${res.status})`);
      }

      toast.success("Usuario creado correctamente");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "No se pudo crear el usuario");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={crear} className="space-y-3">
      <h3 className="text-lg font-semibold">Crear nuevo usuario</h3>

      <input
        name="nombre_completo"
        value={form.nombre_completo}
        onChange={onChange}
        placeholder="Nombre completo"
        className="w-full p-2 border rounded"
      />
      <input
        name="correo"
        type="email"
        value={form.correo}
        onChange={onChange}
        placeholder="Correo electrónico"
        className="w-full p-2 border rounded"
      />
      <input
        name="telefono"
        value={form.telefono}
        onChange={onChange}
        placeholder="Teléfono"
        className="w-full p-2 border rounded"
      />
      <input
        name="direccion"
        value={form.direccion}
        onChange={onChange}
        placeholder="Dirección"
        className="w-full p-2 border rounded"
      />

      <div className="relative">
        <input
          name="password"
          type={showPass ? "text" : "password"}
          value={form.password}
          onChange={onChange}
          placeholder="Contraseña"
          className="w-full p-2 pr-24 border rounded"
        />
        <button
          type="button"
          onClick={() => setShowPass((s) => !s)}
          className="absolute right-10 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-600 hover:text-gray-800"
          title={showPass ? "Ocultar" : "Mostrar"}
        >
          {showPass ? <FaEyeSlash /> : <FaEye />}
        </button>
        <button
          type="button"
          onClick={genPassword}
          className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
          title="Generar contraseña"
        >
          <FaWandMagicSparkles />
        </button>
      </div>

      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          name="es_admin"
          checked={form.es_admin}
          onChange={onChange}
        />
        ¿Es administrador?
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
