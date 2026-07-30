import { query } from './db.js';
import { SCHEMA_SQL } from './schema.js';

export default async function handler(req, res) {
  try {
    await query(SCHEMA_SQL);
    return res.status(200).json({ success: true, message: 'Neon DB Schema initialized successfully.' });
  } catch (err) {
    console.error('Init DB error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
