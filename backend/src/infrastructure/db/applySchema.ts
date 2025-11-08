import { readFileSync } from 'fs';
import { Client } from 'pg';
import 'dotenv/config';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function applySchema() {
  try {
    await client.connect();
    const schema = readFileSync('./database/schema.sql', 'utf-8');
    await client.query(schema);
    console.log('✅ Schema applied successfully');
  } catch (error) {
    console.error('❌ Error applying schema:', error);
  } finally {
    await client.end();
  }
}

applySchema();