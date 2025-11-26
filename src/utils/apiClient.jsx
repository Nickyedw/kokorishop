// src/utils/apiClient.js
import { toast } from "react-toastify";
import { logout } from "./logout";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * apiFetch: wrapper genérico para llamar al backend.
 * - Agrega token automáticamente (Authorization: Bearer ...).
 * - Si recibe 401 => muestra toast, hace logout y lanza error.
 * - Si la respuesta no es OK => lanza error con el mensaje.
 * - Si es OK => devuelve JSON parseado (o texto si no es JSON).
 */
export async function apiFetch(path, options = {}) {
  // 🔑 Prioriza la clave real de tu token: access_token
  const token =
    localStorage.getItem("access_token") || // <- la importante
    localStorage.getItem("authToken") ||
    localStorage.getItem("token");

  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      // Para JSON normal
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // 🔐 401 => sesión caducada
  if (res.status === 401) {
    toast.warning("Tu sesión ha caducado, vuelve a iniciar sesión 💜", {
      position: "top-center",
    });
    logout(); // limpia localStorage + redirige (ya lo tienes hecho)
    throw new Error("Sesión expirada");
  }

  // ❗ Otros errores HTTP
  if (!res.ok) {
    const text = await res.text();
    // intenta usar el mensaje del backend si viene en JSON
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || json.error || text || "Error en la petición");
    } catch {
      throw new Error(text || "Error en la petición");
    }
  }

  // ✅ Respuesta OK
  const text = await res.text();
  if (!text) return null; // sin cuerpo

  try {
    return JSON.parse(text);
  } catch {
    return text; // por si es texto plano
  }
}
