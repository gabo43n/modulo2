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
//
// -----------------------------------------------------------------------------
// Dos formas de conectarse, elegibles por variables de entorno (ver .env.example):
//
//   1) DATABASE_URL   -> una sola cadena de conexion "postgresql://user:pass@host:port/db"
//                         Es el formato que te da Supabase (Project Settings > Database >
//                         Connection string). Tambien sirve para cualquier otro Postgres
//                         que te de una URL asi.
//
//   2) PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD -> variables sueltas.
//                         Pensado para un PostgreSQL instalado en tu propia PC.
//
// Si DATABASE_URL esta definida, tiene prioridad (se usa esa). Si no, se arma
// la conexion con las variables sueltas. Asi puedes cambiar de Supabase a
// local (o viceversa) solo editando el .env, sin tocar este archivo ni el
// resto del codigo.
// -----------------------------------------------------------------------------

require('dotenv').config();
const { Pool } = require('pg');

const usaUrlDeConexion = Boolean(process.env.DATABASE_URL);

// Por que SSL con Supabase y no con un Postgres local? Supabase es un
// servidor en internet: la conexion viaja por redes que no controlas, asi
// que debe ir cifrada. Un Postgres en tu propia PC (localhost) nunca sale
// de tu maquina, por eso ahi no hace falta SSL.
// "rejectUnauthorized: false" evita que Node rechace el certificado de
// Supabase por no reconocer la cadena de certificacion completa; no es lo
// mas estricto posible, pero es la configuracion estandar para conectarse
// desde apps sencillas (mismo enfoque que usan los ejemplos oficiales de
// Supabase con "pg"). PGSSL=true te deja forzar SSL tambien contra un
// Postgres local si alguna vez lo necesitas (por ejemplo, uno remoto).
const necesitaSsl = usaUrlDeConexion || process.env.PGSSL === 'true';

const configuracionBase = usaUrlDeConexion
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'clm_db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
    };

const pool = new Pool({
  ...configuracionBase,
  ssl: necesitaSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL (modulo CLM):', err.message);
});

console.log(
  `[CLM] conectando via ${usaUrlDeConexion ? 'DATABASE_URL (Supabase u otra URL)' : 'PGHOST/PGPORT (Postgres local)'}` +
  ` — SSL: ${necesitaSsl ? 'activado' : 'desactivado'}`
);

module.exports = { pool };
