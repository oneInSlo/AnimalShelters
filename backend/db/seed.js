// backend/db/seed.js
import fs from "fs";
import path from "path";
import { db } from "./db.js";
import { readXml } from "../utils/xml.js";

/**
 * Seed order:
 * 1) shelters (parent)
 * 2) animals (child of shelters) + join tables
 * 3) events  (child of shelters)
 * 4) scraped_animals (child of shelters) + gallery
 *
 * Run from backend/:  node db/seed.js or npm run db:seed
 */

const HORJUL_JSON_PATH = path.resolve(process.cwd(), "scraper", "horjul_animals.json");

function normalize(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function safeText(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function safeInt(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function safeReal(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBoolInt(v) {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === 1 || v === "1") return 1;
  if (v === 0 || v === "0") return 0;
  if (v == null) return 0;
  const s = String(v).toLowerCase().trim();
  return s === "true" ? 1 : 0;
}

function readHorjulJson() {
  if (!fs.existsSync(HORJUL_JSON_PATH)) return [];
  try {
    const raw = fs.readFileSync(HORJUL_JSON_PATH, "utf-8");
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.warn("⚠️ Failed to parse horjul_animals.json:", e?.message || e);
    return [];
  }
}

function main() {
  console.log("🟡 Seeding DB…");

  // ---- Parse XML (uses ../utils/xml.js which reads from ../../data) ----
  const sheltersDoc = readXml("shelters.xml");
  const animalsDoc = readXml("animals.xml");
  const eventsDoc = readXml("events.xml");

  const shelters = normalize(sheltersDoc?.shelters?.shelter).map((s) => ({
    id: String(s.id),
    region: safeText(s.region),
    name: String(s.name ?? ""),
    city: safeText(s.city),
    postalCode: safeText(s.postalCode), // schema is TEXT
    address: safeText(s.address),
    latitude: safeReal(s.latitude),
    longitude: safeReal(s.longitude),
    capacity: safeInt(s.capacity),
    phone: safeText(s.phone),
    email: safeText(s.email),
    established: safeText(s.established),
  }));

  const sheltersById = new Set(shelters.map((s) => s.id));

  const animals = normalize(animalsDoc?.animals?.animal).map((a) => {
    const shelterId = safeText(a.shelterId);
    return {
      id: String(a.id),
      species: safeText(a.species),
      name: String(a.name ?? ""),
      breed: safeText(a.breed),
      sex: safeText(a.sex),
      ageMonths: safeInt(a.ageMonths),
      weightKg: safeReal(a.weightKg),
      neutered: toBoolInt(a.neutered),
      adoptionFee: safeReal(a.adoptionFee),
      intakeDate: safeText(a.intakeDate),
      shelterId: shelterId && sheltersById.has(shelterId) ? shelterId : null,
      microchip: safeText(a.microchip?.number ?? null),
      colors: normalize(a.colors?.color).map((c) => String(c)),
      vaccinations: normalize(a.vaccinations?.vaccine).map((v) => String(v)),
      temperament: normalize(a.temperament?.behavior).map((t) => String(t)),
    };
  });

  const events = normalize(eventsDoc?.events?.event).map((e) => {
    const shelterId = safeText(e.shelterId);
    // schema has entry TEXT; store fee or text if present
    const entry =
      safeText(e.entry?.fee ?? null) ??
      safeText(e.entry ?? null) ??
      null;

    return {
      id: String(e.id),
      type: safeText(e.type),
      title: String(e.title ?? ""),
      date: safeText(e.date),
      city: safeText(e.city),
      shelterId: shelterId && sheltersById.has(shelterId) ? shelterId : null,
      startTime: safeText(e.startTime),
      endTime: safeText(e.endTime),
      location: safeText(e.location),
      description: safeText(e.description),
      status: safeText(e.status),
      audience: safeText(e.audience),
      entry,
    };
  });

  const horjulAnimals = readHorjulJson();

  // ---- Prepare statements ----
  function clearTables() {
    db.exec(`
        DELETE FROM animal_colors;
        DELETE FROM animal_vaccinations;
        DELETE FROM animal_temperament;
        DELETE FROM scraped_animal_gallery;

        DELETE FROM animals;
        DELETE FROM events;
        DELETE FROM scraped_animals;
        DELETE FROM shelters;
    `);
    }


  const upsertShelter = db.prepare(`
    INSERT INTO shelters
      (id, region, name, city, postalCode, address, latitude, longitude, capacity, phone, email, established)
    VALUES
      (@id, @region, @name, @city, @postalCode, @address, @latitude, @longitude, @capacity, @phone, @email, @established)
    ON CONFLICT(id) DO UPDATE SET
      region=excluded.region,
      name=excluded.name,
      city=excluded.city,
      postalCode=excluded.postalCode,
      address=excluded.address,
      latitude=excluded.latitude,
      longitude=excluded.longitude,
      capacity=excluded.capacity,
      phone=excluded.phone,
      email=excluded.email,
      established=excluded.established;
  `);

  const upsertAnimal = db.prepare(`
    INSERT INTO animals
      (id, species, name, breed, sex, ageMonths, weightKg, neutered, adoptionFee, intakeDate, shelterId, microchip)
    VALUES
      (@id, @species, @name, @breed, @sex, @ageMonths, @weightKg, @neutered, @adoptionFee, @intakeDate, @shelterId, @microchip)
    ON CONFLICT(id) DO UPDATE SET
      species=excluded.species,
      name=excluded.name,
      breed=excluded.breed,
      sex=excluded.sex,
      ageMonths=excluded.ageMonths,
      weightKg=excluded.weightKg,
      neutered=excluded.neutered,
      adoptionFee=excluded.adoptionFee,
      intakeDate=excluded.intakeDate,
      shelterId=excluded.shelterId,
      microchip=excluded.microchip;
  `);

  const insertColor = db.prepare(`
    INSERT OR IGNORE INTO animal_colors (animalId, color)
    VALUES (?, ?);
  `);

  const insertVaccination = db.prepare(`
    INSERT OR IGNORE INTO animal_vaccinations (animalId, vaccine)
    VALUES (?, ?);
  `);

  const insertTemperament = db.prepare(`
    INSERT OR IGNORE INTO animal_temperament (animalId, trait)
    VALUES (?, ?);
  `);

  const upsertEvent = db.prepare(`
    INSERT INTO events
      (id, type, title, date, city, shelterId, startTime, endTime, location, description, status, audience, entry)
    VALUES
      (@id, @type, @title, @date, @city, @shelterId, @startTime, @endTime, @location, @description, @status, @audience, @entry)
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,
      title=excluded.title,
      date=excluded.date,
      city=excluded.city,
      shelterId=excluded.shelterId,
      startTime=excluded.startTime,
      endTime=excluded.endTime,
      location=excluded.location,
      description=excluded.description,
      status=excluded.status,
      audience=excluded.audience,
      entry=excluded.entry;
  `);

  const upsertScrapedAnimal = db.prepare(`
    INSERT INTO scraped_animals
      (source, link, name, image, daysInShelter, dateOfAcceptance, foundLocation, status, temperament, sex, size, ageAtIntake, weightAtIntake, vetCare, felvFiv, felvFivResult, description, shelterId)
    VALUES
      (@source, @link, @name, @image, @daysInShelter, @dateOfAcceptance, @foundLocation, @status, @temperament, @sex, @size, @ageAtIntake, @weightAtIntake, @vetCare, @felvFiv, @felvFivResult, @description, @shelterId)
    ON CONFLICT(link) DO UPDATE SET
      source=excluded.source,
      name=excluded.name,
      image=excluded.image,
      daysInShelter=excluded.daysInShelter,
      dateOfAcceptance=excluded.dateOfAcceptance,
      foundLocation=excluded.foundLocation,
      status=excluded.status,
      temperament=excluded.temperament,
      sex=excluded.sex,
      size=excluded.size,
      ageAtIntake=excluded.ageAtIntake,
      weightAtIntake=excluded.weightAtIntake,
      vetCare=excluded.vetCare,
      felvFiv=excluded.felvFiv,
      felvFivResult=excluded.felvFivResult,
      description=excluded.description,
      shelterId=excluded.shelterId;
  `);

  const selectScrapedIdByLink = db.prepare(`
    SELECT id FROM scraped_animals WHERE link = ?;
  `);

  const deleteGalleryForScraped = db.prepare(`
    DELETE FROM scraped_animal_gallery WHERE scrapedAnimalId = ?;
  `);

  const insertGalleryImg = db.prepare(`
    INSERT OR IGNORE INTO scraped_animal_gallery (scrapedAnimalId, imgUrl)
    VALUES (?, ?);
  `);

  // ---- Seed in a single transaction ----
  const seedTx = db.transaction(() => {
    // wipe
    clearTables();

    // shelters
    for (const s of shelters) upsertShelter.run(s);

    // animals + join tables
    for (const a of animals) {
      upsertAnimal.run(a);

      for (const c of a.colors) insertColor.run(a.id, c);
      for (const v of a.vaccinations) insertVaccination.run(a.id, v);
      for (const t of a.temperament) insertTemperament.run(a.id, t);
    }

    // events
    for (const e of events) upsertEvent.run(e);

    // scraped horjul
    for (const raw of horjulAnimals) {
      const record = {
        source: "horjul",
        link: safeText(raw.link) ?? "",
        name: safeText(raw.name),
        image: safeText(raw.image),
        daysInShelter: safeText(raw.daysInShelter),
        dateOfAcceptance: safeText(raw.dateOfAcceptance),
        foundLocation: safeText(raw.foundLocation),
        status: safeText(raw.status),
        temperament: safeText(raw.temperament),
        sex: safeText(raw.sex),
        size: safeText(raw.size),
        ageAtIntake: safeText(raw.ageAtIntake),
        weightAtIntake: safeText(raw.weightAtIntake),
        vetCare: safeText(raw.vetCare),
        felvFiv: safeText(raw.felvFiv),
        felvFivResult: safeText(raw.felvFivResult),
        description: safeText(raw.description),
        shelterId: null, // you can map this later if you want (Horjul isn’t in your shelters.xml)
      };

      if (!record.link) continue;

      upsertScrapedAnimal.run(record);

      const row = selectScrapedIdByLink.get(record.link);
      if (!row?.id) continue;

      const scrapedId = row.id;

      // Replace gallery with latest scrape
      deleteGalleryForScraped.run(scrapedId);

      const gallery = normalize(raw.galleryImgs).map((x) => safeText(x)).filter(Boolean);
      for (const imgUrl of gallery) insertGalleryImg.run(scrapedId, imgUrl);
    }
  });

  seedTx();

  console.log("✅ Seed complete:");
  console.log("  shelters:", shelters.length);
  console.log("  animals:", animals.length);
  console.log("  events:", events.length);
  console.log("  horjul scraped:", horjulAnimals.length);
}

try {
  main();
} catch (e) {
  console.error("❌ Seed failed:", e?.message || e);
  process.exit(1);
}
