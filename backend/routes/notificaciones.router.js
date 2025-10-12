const express = require('express');
const router = express.Router();
const { enviarAlertaStockBajo } = require('../services/notificaciones');

// body parser por si el app.js no lo tiene global
const ensureJson = (req, res, next) => express.json()(req, res, next);

// --- Cooldown simple en memoria (opcional) ---
// Evita enviar el mismo correo repetidamente por producto/stock dentro de una ventana.
// Clave: `${nombreProducto}:${stock_actual}`
const COOLDOWN_MS = 1000 * 60 * 60 * 6; // 6 horas
const cache = new Map();
function onCooldown(key) {
  const now = Date.now();
  const exp = cache.get(key);
  if (exp && exp > now) return true;
  cache.set(key, now + COOLDOWN_MS);
  return false;
}

router.post('/stock-bajo', ensureJson, async (req, res) => {
  try {
    const { nombreProducto, stock_actual, stock_minimo } = req.body || {};
    if (!nombreProducto || stock_actual == null || stock_minimo == null) {
      return res.status(400).json({ ok: false, error: 'Faltan campos' });
    }

    const key = `${nombreProducto}:${stock_actual}`;
    if (onCooldown(key)) {
      // Ya se envió recientemente esta misma alerta → no spamear
      return res.json({ ok: true, skipped: true, reason: 'cooldown' });
    }

    await enviarAlertaStockBajo(nombreProducto, Number(stock_actual), Number(stock_minimo));
    return res.json({ ok: true });
  } catch (e) {
    console.error('Error alerta stock bajo:', e);
    return res.status(500).json({ ok: false });
  }
});

module.exports = router;
