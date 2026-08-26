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

module.exports = { authValidators, contactValidators, groupValidators, phoneSchema };
