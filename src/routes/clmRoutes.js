// src/routes/clmRoutes.js
// -----------------------------------------------------------------------------
// Rutas del modulo CLM. A diferencia de contactRoutes/groupRoutes, aqui NO se
// aplica el middleware "authenticate": este modulo es de solo lectura, para
// visualizar datos de otra base de datos (Postgres) mientras se hace la
// practica. En un proyecto real, si estas rutas expusieran datos sensibles de
// contratos, si deberian ir detras de autenticacion (igual que /api/contacts).
// -----------------------------------------------------------------------------

const { Router } = require('express');
const clmController = require('../controllers/clmController');

const router = Router();

router.get('/health', clmController.health);
router.get('/empresas', clmController.empresas);
router.get('/contratos', clmController.contratos);
router.get('/clausulas', clmController.clausulas);

module.exports = router;
