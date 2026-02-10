const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',          // your pg username
  host: 'localhost',
  database: 'little_innovators',  // database name from pgAdmin
  password: 'KWESH',
  port: 5432
});

module.exports = pool;
pool.query('SELECT NOW()')
  .then(res => {
    console.log('✅ PostgreSQL connected successfully!');
    console.log('Server time:', res.rows[0].now);
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed');
    console.error(err.message);
  });


