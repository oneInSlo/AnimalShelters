import { db } from "../db/db.js";

export function getAllEvents() {
  return db.prepare("SELECT * FROM events ORDER BY date DESC, title ASC").all();
}
