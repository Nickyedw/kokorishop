// backend/db.js
const { Pool } = require('pg');

const useConnString = !!process.env.DATABASE_URL;

const pool = new Pool(
  useConnString
    ? {
        connectionString: process.env.DATABASE_URL,
        // Neon requiere TLS:
        ssl: { rejectUnauthorized: false }, // <- clave
      }
    : {
        host: process.env.PG_HOST,
        port: Number(process.env.PG_PORT || 5432),
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
        // Si usas las variables sueltas, también fuerza TLS:
        ssl: { rejectUnauthorized: false }, // <- clave
      }
);

pool.on('connect', () => console.log('✅ DB pool connected'));
pool.on('error', (err) => console.error('❌ DB pool error', err));

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
