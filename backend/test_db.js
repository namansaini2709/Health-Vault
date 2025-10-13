const { Pool } = require('pg');

const pool = new Pool({
  user: 'testuser',
  host: 'localhost',
  database: 'healthvault',
  password: 'testpassword',
  port: 5432,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Connected to the database!');
    const { rows } = await client.query('SELECT NOW()');
    console.log('Query result:', rows[0]);
    client.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    pool.end();
  }
}

testConnection();