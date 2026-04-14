import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.blomqowhgrfgkbeamqiw:hireloop123%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function test() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected successfully");
    const res = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
    console.log("Tables in public schema:", res.rows.map(r => r.tablename));
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
  }
}

test();
