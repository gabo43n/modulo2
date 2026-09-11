const { body, param, query } = require('express-validator');

const phoneSchema = body('phones.*').optional();

const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  updateProfile: [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  changePassword: [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
};

const contactValidators = {
  create: [
    body('firstName').trim().notEmpty().withMessage('El nombre es requerido'),
    body('lastName').optional().trim(),
    body('company').optional().trim(),
    body('email').optional({ values: 'null' }).isEmail().normalizeEmail(),
    body('address').optional().trim(),
    body('notes').optional().trim(),
    body('photoUrl').optional().isURL(),
    body('isFavorite').optional().isBoolean(),
    body('phones').optional().isArray(),
    body('phones.*.type').optional().isIn(['mobile', 'home', 'work', 'other']),
    body('phones.*.number').optional().notEmpty(),
    body('phones.*.isPrimary').optional().isBoolean(),
    body('groupIds').optional().isArray(),
    body('groupIds.*').optional().isInt(),
  ],
  update: [
    param('id').isInt(),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim(),
    body('company').optional().trim(),
    body('email').optional({ values: 'null' }).isEmail().normalizeEmail(),
    body('address').optional().trim(),
    body('notes').optional().trim(),
    body('photoUrl').optional().isURL(),
    body('isFavorite').optional().isBoolean(),
    body('phones').optional().isArray(),
    body('phones.*.type').optional().isIn(['mobile', 'home', 'work', 'other']),
    body('phones.*.number').optional().notEmpty(),
    body('phones.*.isPrimary').optional().isBoolean(),
    body('groupIds').optional().isArray(),
    body('groupIds.*').optional().isInt(),
  ],
  id: [param('id').isInt()],
  list: [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('favorite').optional().isBoolean(),
    query('groupId').optional().isInt(),
    query('sortBy').optional().isIn(['firstName', 'lastName', 'createdAt', 'updatedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  sync: [
    query('since').isISO8601().withMessage('Fecha "since" debe ser ISO 8601'),
  ],
};

const groupValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('El nombre del grupo es requerido'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color debe ser hexadecimal (#RRGGBB)'),
  ],
  update: [
    param('id').isInt(),
    body('name').optional().trim().notEmpty(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  id: [param('id').isInt()],
};


// Validadores del modulo CLM. Mismo patron que contactValidators/groupValidators:
// arrays de reglas de express-validator que se ejecutan ANTES del controller
// (ver el middleware "validate" en src/middleware/errorHandler.js).
const clmValidators = {
  createEmpresa: [
    body('razon_social').trim().notEmpty().withMessage('razon_social es requerido'),
    body('nit').trim().notEmpty().withMessage('nit es requerido'),
    body('direccion_fiscal').optional().trim(),
    body('pais').trim().notEmpty().withMessage('pais es requerido'),
    body('activo').optional().isBoolean(),
  ],
  createContrato: [
    body('id_empresa').isUUID().withMessage('id_empresa debe ser un UUID valido'),
    body('titulo').trim().notEmpty().withMessage('titulo es requerido'),
    body('contraparte_nombre').trim().notEmpty().withMessage('contraparte_nombre es requerido'),
    body('estado').optional().isIn(['Borrador', 'Negociacion', 'Validez_Legal', 'Anulado', 'Expirado']),
    body('fecha_inicio_vigencia').optional({ values: 'null' }).isISO8601(),
    body('fecha_fin_vigencia').optional({ values: 'null' }).isISO8601(),
    body('valor_contrato').optional({ values: 'null' }).isFloat({ min: 0 }),
    body('moneda').optional({ values: 'null' }).isLength({ min: 3, max: 3 }),
  ],
  createClausula: [
    body('id_contrato').isUUID().withMessage('id_contrato debe ser un UUID valido'),
    body('orden').isInt({ min: 1 }).withMessage('orden debe ser un entero mayor a 0'),
    body('titulo').trim().notEmpty().withMessage('titulo es requerido'),
    body('contenido').trim().notEmpty().withMessage('contenido es requerido'),
    body('tipo_clausula').optional().trim(),
    body('es_modificable').optional().isBoolean(),
  ],

  // Validadores de "id" en la URL (:id). Se usan en PUT y DELETE.
  idParam: [param('id').isUUID().withMessage('id invalido en la URL (debe ser un UUID)')],

  // Los de "update" son iguales a los de "create" pero con TODO opcional:
  // un PUT puede mandar solo los campos que cambian (ver COALESCE en
  // clmService.js). isUUID()/isIn()/etc solo corren si el campo llega.
  updateEmpresa: [
    body('razon_social').optional().trim().notEmpty(),
    body('nit').optional().trim().notEmpty(),
    body('direccion_fiscal').optional().trim(),
    body('pais').optional().trim().notEmpty(),
    body('activo').optional().isBoolean(),
  ],
  updateContrato: [
    body('titulo').optional().trim().notEmpty(),
    body('contraparte_nombre').optional().trim().notEmpty(),
    body('estado').optional().isIn(['Borrador', 'Negociacion', 'Validez_Legal', 'Anulado', 'Expirado']),
    body('fecha_inicio_vigencia').optional({ values: 'null' }).isISO8601(),
    body('fecha_fin_vigencia').optional({ values: 'null' }).isISO8601(),
    body('valor_contrato').optional({ values: 'null' }).isFloat({ min: 0 }),
    body('moneda').optional({ values: 'null' }).isLength({ min: 3, max: 3 }),
  ],
  updateClausula: [
    body('orden').optional().isInt({ min: 1 }),
    body('titulo').optional().trim().notEmpty(),
    body('contenido').optional().trim().notEmpty(),
    body('tipo_clausula').optional().trim(),
    body('es_modificable').optional().isBoolean(),
  ],

  // Login del dashboard (no tiene nada que ver con authValidators.login: ese
  // es para /api/auth de la agenda telefonica, con email; este es el admin
  // fijo del modulo CLM, con username).
  login: [
    body('username').trim().notEmpty().withMessage('username es requerido'),
    body('password').notEmpty().withMessage('password es requerido'),
  ],
};

module.exports = { authValidators, contactValidators, groupValidators, clmValidators, phoneSchema };
