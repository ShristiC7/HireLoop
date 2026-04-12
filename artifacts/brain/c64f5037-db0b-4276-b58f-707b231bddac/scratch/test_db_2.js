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
    
    console.log("Checking for 'users' table...");
    const tableCheck = await client.query("SELECT to_regclass('public.users') as exists");
    console.log("Table 'users' exists:", tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
        console.log("Attempting to CREATE TABLE test_verify (id serial primary key)");
        await client.query("CREATE TABLE IF NOT EXISTS test_verify (id serial primary key)");
        console.log("Successfully created test_verify table");
        const verify = await client.query("SELECT to_regclass('public.test_verify') as exists");
        console.log("Verification check:", verify.rows[0].exists);
    }
    
    await client.end();
  } catch (err) {
    console.error("Diagnostic failed:", err.message);
    if (err.detail) console.error("Detail:", err.detail);
  }
}

test();
