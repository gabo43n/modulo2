// src/routes/clmRoutes.js
// -----------------------------------------------------------------------------
// Rutas del modulo CLM (lectura + creacion de empresas/contratos/clausulas).
// A diferencia de contactRoutes/groupRoutes, aqui NO se aplica el middleware
// "authenticate": es un modulo de practica para visualizar y cargar datos de
// otra base de datos (Postgres) sin necesidad de loguearte primero. En un
// proyecto real, si estas rutas expusieran datos sensibles de contratos, si
// deberian ir detras de autenticacion (igual que /api/contacts).

const { Router } = require('express');
const clmController = require('../controllers/clmController');
const { validate } = require('../middleware/errorHandler');
const { clmValidators } = require('../validators');

const router = Router();

router.get('/health', clmController.health);
router.get('/empresas', clmController.empresas);
router.get('/contratos', clmController.contratos);
router.get('/clausulas', clmController.clausulas);

router.post('/empresas', clmValidators.createEmpresa, validate, clmController.createEmpresa);
router.post('/contratos', clmValidators.createContrato, validate, clmController.createContrato);
router.post('/clausulas', clmValidators.createClausula, validate, clmController.createClausula);

module.exports = router;
