import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node apply-sql.mjs <sql-directory>");
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or DATABASE_MIGRATION_URL required");
  process.exit(1);
}

const root = path.resolve(process.cwd(), dir);
const files = (await fs.readdir(root)).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString });
await client.connect();

try {
  for (const file of files) {
    const sql = await fs.readFile(path.join(root, file), "utf8");
    console.log(`Applying ${dir}/${file}...`);
    await client.query(sql);
  }
  console.log("Done.");
} finally {
  await client.end();
}
