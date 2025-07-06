const express = require('express');
const router = express.Router();
const { generarComprobantePDF, generarTicketPDF } = require('../controllers/comprobante');

router.get('/comprobante/a4/:pedidoId', (req, res) => {
    generarComprobantePDF(parseInt(req.params.pedidoId), res);
  });
  
  router.get('/comprobante/ticket/:pedidoId', (req, res) => {
    generarTicketPDF(parseInt(req.params.pedidoId), res);
  });
module.exports = router;
