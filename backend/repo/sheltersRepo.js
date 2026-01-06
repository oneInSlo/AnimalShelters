import { db } from "../db/db.js";

export function getAllShelters() {
  return db.prepare("SELECT * FROM shelters ORDER BY name").all();
}
