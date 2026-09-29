import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../.pgdata');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const pg = new EmbeddedPostgres({
  databaseDir: dbDir,
  port: 5432,
  user: 'postgres',
  password: 'password',
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: (msg) => {
    if (msg.includes('ready to accept connections')) {
      console.log('⚡ PostgreSQL is running and ready on port 5432 (UTF-8)!');
    }
  },
});

async function main() {
  console.log('🚀 Initializing Embedded PostgreSQL database on port 5432...');
  try {
    await pg.initialise();
  } catch (err) {
    // If already initialized, proceed to start
  }

  console.log('Starting PostgreSQL server...');
  await pg.start();

  try {
    const client = pg.getPgClient();
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'pulsechat'");
    if (res.rowCount === 0) {
      await client.query("CREATE DATABASE pulsechat WITH ENCODING 'UTF8'");
      console.log('Created database "pulsechat" with UTF-8 encoding');
    }
    await client.end();
  } catch (err) {
    console.log('Database pulsechat check/create note:', err.message);
  }

  console.log('========================================================');
  console.log('  Embedded PostgreSQL is active!');
  console.log('  URL: postgresql://postgres:password@localhost:5432/pulsechat?schema=public');
  console.log('  Press Ctrl+C to stop.');
  console.log('========================================================');
}

main().catch((err) => {
  console.error('Failed to start Embedded PostgreSQL:', err);
  process.exit(1);
});
