export function logout() {
  // 🔥 Borrar datos del usuario
  localStorage.removeItem("usuario_id");
  localStorage.removeItem("usuario_email");
  localStorage.removeItem("usuario_nombre");
  localStorage.removeItem("usuario_rol");
  localStorage.removeItem("usuario_is_admin");
  localStorage.removeItem("authToken");

  // 🔥 Borrar carritos persistentes del usuario actual
  // cart_userId, cart_email, etc.
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (k.startsWith("cart_")) localStorage.removeItem(k);
      if (k.startsWith("favorites_")) localStorage.removeItem(k);
    });
  } catch {/*noop*/}

  // 🔥 Emitir evento global (CartProvider ya está preparado)
  window.dispatchEvent(new CustomEvent("auth:changed"));

  // Redirigir al home
  window.location.href = "#/";
}
