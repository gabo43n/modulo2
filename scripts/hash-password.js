#!/usr/bin/env node
// scripts/hash-password.js
// -----------------------------------------------------------------------------
// Genera el hash bcrypt de una contraseña, para pegarlo en
// CLM_ADMIN_PASSWORD_HASH dentro de tu .env.
//
// Uso:
//   npm run clm:hash-password -- "tu-contraseña-nueva"
//
// (El "--" es necesario para que npm le pase el argumento al script en vez
// de intentar interpretarlo como una opcion de npm.)
// -----------------------------------------------------------------------------

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Uso: npm run clm:hash-password -- "tu-contraseña"');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));
