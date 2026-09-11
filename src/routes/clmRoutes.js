// src/routes/clmRoutes.js
// -----------------------------------------------------------------------------
// Rutas del modulo CLM: login/logout (publicas) + CRUD completo de
// empresas/contratos/clausulas (protegido por sesion).
//
// El orden de "router.use(...)" importa: Express recorre las rutas en el
// orden en que se declaran, asi que todo lo que este ANTES de
// "router.use(requireAuthApi)" queda publico, y todo lo que este DESPUES
// requiere sesion.
// -----------------------------------------------------------------------------

const { Router } = require('express');
const clmController = require('../controllers/clmController');
const clmAuthController = require('../controllers/clmAuthController');
const { requireAuthApi } = require('../middleware/clmAuth');
const { validate } = require('../middleware/errorHandler');
const { clmValidators } = require('../validators');

const router = Router();

// --- Publicas: sin sesion ----------------------------------------------------
router.post('/auth/login', clmValidators.login, validate, clmAuthController.login);
router.post('/auth/logout', clmAuthController.logout);

// --- A partir de aqui, TODO requiere sesion valida (cookie clm_token) -------
router.use(requireAuthApi);

router.get('/auth/me', clmAuthController.me);

router.get('/health', clmController.health);

router.get('/empresas', clmController.empresas);
router.post('/empresas', clmValidators.createEmpresa, validate, clmController.createEmpresa);
router.put('/empresas/:id', clmValidators.idParam, clmValidators.updateEmpresa, validate, clmController.updateEmpresa);
router.delete('/empresas/:id', clmValidators.idParam, validate, clmController.deleteEmpresa);

router.get('/contratos', clmController.contratos);
router.post('/contratos', clmValidators.createContrato, validate, clmController.createContrato);
router.put('/contratos/:id', clmValidators.idParam, clmValidators.updateContrato, validate, clmController.updateContrato);
router.delete('/contratos/:id', clmValidators.idParam, validate, clmController.deleteContrato);

router.get('/clausulas', clmController.clausulas);
router.post('/clausulas', clmValidators.createClausula, validate, clmController.createClausula);
router.put('/clausulas/:id', clmValidators.idParam, clmValidators.updateClausula, validate, clmController.updateClausula);
router.delete('/clausulas/:id', clmValidators.idParam, validate, clmController.deleteClausula);

module.exports = router;
