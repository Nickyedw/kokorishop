require('dotenv').config();
const {
  enviarCorreoPedido,
  enviarWhatsappPedidoInicial,
  enviarNotificacionConfirmacionPago
} = require('./services/notificaciones');

(async () => {
  try {
    // Prueba de correo
    await enviarCorreoPedido('egonzalesedwin@gmail.com', 'Jenny', 'PED123');

    // Prueba de WhatsApp
    await enviarWhatsappPedidoInicial('+51977546073', 'Jenny', 'PED123', '2025-06-12', 89.90);

    // Prueba de confirmación combinada
    await enviarNotificacionConfirmacionPago({
      correo_cliente: 'egonzalesedwin@gmail.com',
      nombre_cliente: 'Jenny',
      numero_pedido: 'PED123',
      telefono: '+51977546073'
    });

    console.log('✅ Pruebas completadas.');
  } catch (err) {
    console.error('❌ Error en pruebas:', err);
  }
})();
