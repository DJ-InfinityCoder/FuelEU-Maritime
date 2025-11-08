// src/infrastructure/db/connection.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import 'dotenv/config';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  console.error('\n💡 Troubleshooting:');
  console.error('  1. Check if PostgreSQL is running');
  console.error('  2. Verify DATABASE_URL in .env file');
  console.error('  3. Ensure database "fueleu" exists');
  console.error('  4. Run: createdb -U postgres fueleu');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Closing database connection...');
  await pool.end();
  console.log('✅ Database connection closed');
  process.exit(0);
});

// Test the connection
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection test passed');
  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\n📋 Quick Fix Steps:');
    console.error('  1. Check if PostgreSQL is running:');
    console.error('     Windows: Get-Service postgresql*');
    console.error('     Docker: docker ps');
    console.error('  2. Create database if missing:');
    console.error('     createdb -U postgres fueleu');
    console.error('  3. Run schema:');
    console.error('     psql -U postgres -d fueleu -f database/schema.sql');
    console.error('  4. Check .env file has correct DATABASE_URL\n');
    
    // Don't exit in development, allow retry
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Run test on import
testConnection();

// Initialize Drizzle ORM with the Postgres pool
export const db = drizzle(pool);
export { pool };

