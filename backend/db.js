// backend/db.js
const { Pool } = require('pg');

const useConnString = !!process.env.DATABASE_URL;

const baseCfg = useConnString
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Neon
    }
  : {
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT || 5432),
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      // Para local normalmente NO hace falta SSL:
      ssl: false,
    };

const pool = new Pool(baseCfg);

pool.on('connect', () => console.log('✅ DB pool connected'));
pool.on('error', (err) => console.error('❌ DB pool error', err));

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
