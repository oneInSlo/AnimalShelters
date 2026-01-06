import fs from "fs";
import path from "path";
import { db } from "./db.js";

const schemaPath = path.resolve(process.cwd(), "db", "schema.sql");
const sql = fs.readFileSync(schemaPath, "utf-8");

db.exec(sql);
console.log("✅ DB migrated (schema applied).");
