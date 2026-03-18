import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SSL config: use BYU cert if available, otherwise use standard SSL for external DBs (e.g. Render)
let sslConfig = false;
const certPath = path.join(__dirname, '../../bin', 'byuicse-psql-cert.pem');
try {
  if (fs.existsSync(certPath)) {
    const caCert = fs.readFileSync(certPath);
    sslConfig = {
      ca: caCert,
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined,
    };
  } else {
    sslConfig = { rejectUnauthorized: false };
  }
} catch {
  sslConfig = { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: sslConfig,
});

let db = null;

if (process.env.NODE_ENV?.includes('dev') && process.env.ENABLE_SQL_LOGGING === 'true') {
  db = {
    async query(text, params) {
      try {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query:', {
          text: text.replace(/\s+/g, ' ').trim(),
          duration: `${duration}ms`,
          rows: res.rowCount,
        });
        return res;
      } catch (error) {
        console.error('Error in query:', {
          text: text.replace(/\s+/g, ' ').trim(),
          error: error.message,
        });
        throw error;
      }
    },
    async close() {
      await pool.end();
    },
  };
} else {
  db = pool;
}

export default db;
