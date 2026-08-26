// src/db/postgres.js
// -----------------------------------------------------------------------------
// Conexion a PostgreSQL para el modulo CLM (empresa_cliente, contrato, clausula).
//
// Este proyecto ya tenia una "base de datos" propia en src/db/store.js (un
// archivo JSON en disco) para contactos/grupos/usuarios de la agenda. NO la
// tocamos: ese modulo sigue funcionando igual que antes. Este archivo es una
// conexion NUEVA e independiente, solo para las tablas del CLM que viven en
// PostgreSQL de verdad.
//
// Por que un "Pool" y no una conexion (Client) unica? Un Pool mantiene varias
// conexiones abiertas y las reutiliza entre peticiones, en vez de abrir/cerrar
// una conexion nueva (handshake TCP + autenticacion) en cada request. Es el
// patron estandar al usar el paquete "pg" en Node.js.
// -----------------------------------------------------------------------------

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'clm_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL (modulo CLM):', err.message);
});

module.exports = { pool };
