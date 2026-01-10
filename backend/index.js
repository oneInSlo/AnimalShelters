import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import iconv from "iconv-lite";
import { spawn } from "child_process";
import { createRequire } from "module";

import createLlmRoutes from "./llm/llm.js";
import createMapsRoutes from "./maps/maps.js";
import { grpcClient } from "./grpcClient.js";
import { sendPipeRequest } from "./pipes/pipeClient.js";
import { exportJson, exportXml } from "./utils/export.js";

import { publishEvent, consumeEvents } from "./rabbitmq/rabbitmq.js";

import { db } from "./db/db.js";

// DB repos
import { getAllShelters } from "./repo/sheltersRepo.js";
import { getAnimals } from "./repo/animalsRepo.js";
import { getAllEvents } from "./repo/eventsRepo.js";
import { getHorjulAnimals } from "./repo/scrapedRepo.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

const require = createRequire(import.meta.url);
global._ = require("underscore");
const PX = require("./lib/px.cjs");

const PX_URL =
  "https://pxweb.stat.si/SiStatData/Resources/PX/Databases/Data/15P1201S.PX";

const HORJUL_JSON_PATH = path.resolve("scraper/horjul_animals.json");
const HORJUL_SCRIPT_PATH = path.resolve("scraper/scrape_horjul.js");

let horjulJob = {
  running: false,
  lastUpdated: null,
  lastCount: 0,
  lastError: null,
};

function getDataSnapshot() {
  return {
    shelters: getAllShelters(),
    animals: getAnimals({}),
    events: getAllEvents(),
  };
}

let DATA = getDataSnapshot();

// maps
app.use("/api", createMapsRoutes({ getData: () => DATA }));

// OSM Nominatim search
async function nominatimSearch(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query);

  const r = await fetch(url, {
    headers: { "User-Agent": "AnimalShelters/1.0 (student project)" },
  });
  if (!r.ok) return null;

  const arr = await r.json();
  if (!Array.isArray(arr) || arr.length === 0) return null;

  return {
    lat: Number(arr[0].lat),
    lon: Number(arr[0].lon),
    display_name: arr[0].display_name,
  };
}

// Import Horjul JSON into SQLite (upsert by link)
function upsertHorjulIntoDb(items) {
  if (!Array.isArray(items)) return 0;

  const insertAnimal = db.prepare(`
    INSERT INTO scraped_animals (
      source, link, name, image, daysInShelter, dateOfAcceptance, foundLocation,
      status, temperament, sex, size, ageAtIntake, weightAtIntake, vetCare,
      felvFiv, felvFivResult, description, shelterId
    ) VALUES (
      @source, @link, @name, @image, @daysInShelter, @dateOfAcceptance, @foundLocation,
      @status, @temperament, @sex, @size, @ageAtIntake, @weightAtIntake, @vetCare,
      @felvFiv, @felvFivResult, @description, @shelterId
    )
    ON CONFLICT(link) DO UPDATE SET
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
      shelterId=excluded.shelterId
  `);

  const selectIdByLink = db.prepare(
    `SELECT id FROM scraped_animals WHERE link = ?`
  );
  const deleteGallery = db.prepare(
    `DELETE FROM scraped_animal_gallery WHERE scrapedAnimalId = ?`
  );
  const insertGallery = db.prepare(`
    INSERT OR IGNORE INTO scraped_animal_gallery (scrapedAnimalId, imgUrl)
    VALUES (?, ?)
  `);

  const tx = db.transaction((rows) => {
    let count = 0;

    for (const raw of rows) {
      if (!raw?.link) continue;

      const record = {
        source: "horjul",
        link: String(raw.link),
        name: raw.name ?? null,
        image: raw.image ?? null,
        daysInShelter: raw.daysInShelter ?? null,
        dateOfAcceptance: raw.dateOfAcceptance ?? null,
        foundLocation: raw.foundLocation ?? null,
        status: raw.status ?? null,
        temperament: raw.temperament ?? null,
        sex: raw.sex ?? null,
        size: raw.size ?? null,
        ageAtIntake: raw.ageAtIntake ?? null,
        weightAtIntake: raw.weightAtIntake ?? null,
        vetCare: raw.vetCare ?? null,
        felvFiv: raw.felvFiv ?? null,
        felvFivResult: raw.felvFivResult ?? null,
        description: raw.description ?? null,
        shelterId: raw.shelterId ?? null,
      };

      insertAnimal.run(record);

      const row = selectIdByLink.get(record.link);
      if (row?.id) {
        // simplest: replace gallery each refresh for that animal
        deleteGallery.run(row.id);
        const gallery = Array.isArray(raw.galleryImgs) ? raw.galleryImgs : [];
        for (const imgUrl of gallery) {
          if (imgUrl) insertGallery.run(row.id, String(imgUrl));
        }
      }

      count += 1;
    }

    return count;
  });

  return tx(items);
}

// Core DB endpoints

app.get("/api/shelters", (req, res) => {
  try {
    res.json(getAllShelters());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load shelters" });
  }
});

app.get("/api/animals", (req, res) => {
  try {
    const { species, sex, shelterId, neutered } = req.query;

    const filters = {
      species: species ? String(species) : undefined,
      sex: sex ? String(sex) : undefined,
      shelterId: shelterId ? String(shelterId) : undefined,
      neutered:
        neutered === undefined || neutered === ""
          ? undefined
          : String(neutered).toLowerCase() === "true" ||
            String(neutered) === "1",
    };

    res.json(getAnimals(filters));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load animals" });
  }
});

app.get("/api/events", (req, res) => {
  try {
    res.json(getAllEvents());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load events" });
  }
});

app.post("/api/export", (req, res) => {
  try {
    const { species, city, region, neutered, maxFee } = req.body ?? {};

    let results = getAnimals({
      species: species ? String(species) : undefined,
      neutered:
        neutered === undefined || neutered === ""
          ? undefined
          : String(neutered).toLowerCase() === "true" ||
            String(neutered) === "1",
    });

    if (city) {
      const c = String(city).toLowerCase();
      results = results.filter(
        (a) => (a.shelter?.city ?? "").toLowerCase() === c
      );
    }
    if (region) {
      const r = String(region).toLowerCase();
      results = results.filter(
        (a) => (a.shelter?.region ?? "").toLowerCase() === r
      );
    }
    if (maxFee) {
      const mf = Number(maxFee);
      if (Number.isFinite(mf))
        results = results.filter((a) => Number(a.adoptionFee ?? 0) <= mf);
    }

    exportJson(results);
    exportXml(results);

    res.json({ message: "Filtered export successful!", count: results.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Export failed" });
  }
});

app.get("/api/livestock", async (req, res) => {
  try {
    const response = await fetch(PX_URL);
    const buffer = await response.arrayBuffer();
    const pxText = iconv.decode(Buffer.from(buffer), "win1250");

    const pxInstance = new PX(pxText);
    const variables = pxInstance.variables();
    const entries = pxInstance.entries();

    res.json({ metadata: variables, data: entries });
  } catch (err) {
    console.error("Error parsing PC-AXIS file:", err);
    res.status(500).json({ error: "Failed to parse PX data" });
  }
});

app.get("/api/grpc/shelters", (req, res) => {
  grpcClient.ListShelters({}, (err, response) => {
    if (err) {
      console.error("gRPC error (ListShelters):", err);
      return res
        .status(500)
        .json({ error: "Napaka pri pridobivanju zavetišč." });
    }
    res.json(response.shelters);
  });
});

app.get("/api/grpc/animals", (req, res) => {
  grpcClient.ListAllAnimals({}, (err, response) => {
    if (err) {
      console.error("gRPC error (ListAllAnimals):", err);
      return res.status(500).json({ error: "Napaka pri pridobivanju živali." });
    }
    res.json(response.animals);
  });
});

app.get("/api/grpc/shelters/:id/animals", (req, res) => {
  grpcClient.GetAnimalsByShelter(
    { shelterId: req.params.id },
    (err, response) => {
      if (err) {
        console.error("gRPC error (GetAnimalsByShelter):", err);
        return res
          .status(500)
          .json({ error: "Napaka pri pridobivanju živali za zavetišče." });
      }
      res.json(response.animals);
    }
  );
});

app.get("/api/grpc/animals/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const stream = grpcClient.StreamAnimalUpdates({});

  stream.on("data", (animal) => {
    res.write(`data: ${JSON.stringify(animal)}\n\n`);
  });

  stream.on("end", () => {
    res.write("event: end\ndata: Stream končan.\n\n");
    res.end();
  });

  stream.on("error", (err) => {
    console.error("gRPC streaming error:", err);
    res.write(`event: error\ndata: Napaka v pretakanju.\n\n`);
  });

  req.on("close", () => {
    stream.cancel();
    res.end();
  });
});

app.use("/api", createLlmRoutes(DATA));

app.get("/api/pipe/stats", async (req, res) => {
  try {
    const response = await sendPipeRequest({ command: "getStats" });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err?.message ?? err });
  }
});

app.get("/api/pipe/shelter/:id", async (req, res) => {
  try {
    const response = await sendPipeRequest({
      command: "shelterOverview",
      shelterId: req.params.id,
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err?.message ?? err });
  }
});

app.get("/api/osm/geocode", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Missing q" });
    const result = await nominatimSearch(q);
    res.json({ query: q, result });
  } catch (e) {
    console.error("OSM geocode error:", e.message);
    res.status(500).json({ error: "Failed to geocode" });
  }
});

app.get("/api/osm/shelters-enriched", async (req, res) => {
  try {
    const shelters = getAllShelters();

    const enriched = [];
    for (const s of shelters) {
      let lat = Number(s.latitude);
      let lon = Number(s.longitude);

      if (!lat || !lon) {
        const q = `${s.address ?? ""}, ${s.postalCode ?? ""} ${
          s.city ?? ""
        }, Slovenia`;
        const geo = await nominatimSearch(q);
        if (geo) {
          lat = geo.lat;
          lon = geo.lon;
        }
      }

      enriched.push({ ...s, lat, lon });
    }

    res.json(enriched);
  } catch (e) {
    console.error("OSM shelters-enriched error:", e.message);
    res.status(500).json({ error: "Failed to enrich shelters" });
  }
});

app.get("/api/horjul", (req, res) => {
  try {
    const data = getHorjulAnimals();
    res.json({
      meta: {
        running: horjulJob.running,
        lastUpdated: horjulJob.lastUpdated,
        lastCount: horjulJob.lastCount,
        lastError: horjulJob.lastError,
      },
      data,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to read Horjul animals from DB" });
  }
});

app.get("/api/horjul/status", (req, res) => {
  res.json(horjulJob);
});

app.post("/api/horjul/refresh", async (req, res) => {
  if (horjulJob.running) {
    return res.status(409).json({ error: "Scrape already running" });
  }

  horjulJob = {
    running: true,
    lastUpdated: horjulJob.lastUpdated,
    lastCount: horjulJob.lastCount,
    lastError: null,
  };

  console.log("🟡 Horjul scrape started.");
  const child = spawn("node", [HORJUL_SCRIPT_PATH], { stdio: "inherit" });

  const startTs = Date.now();

  await publishEvent({
    type: "HORJUL_REFRESH.STARTED",
    status: "INFO",
    timestamp: new Date().toISOString(),
  });

  const heartbeat = setInterval(() => {
    publishEvent({
      type: "HORJUL_REFRESH.PROGRESS",
      status: "INFO",
      elapsedMs: Date.now() - startTs,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error("RabbitMQ heartbeat publish failed:", err));
  }, 5000);

  const stopHeartbeat = () => {
    if (heartbeat) clearInterval(heartbeat);
  };

  child.on("close", async () => {
    stopHeartbeat();

    try {
      const raw = fs.readFileSync(HORJUL_JSON_PATH, "utf-8");
      const scraped = JSON.parse(raw);

      const importedCount = upsertHorjulIntoDb(scraped);

      horjulJob = {
        running: false,
        lastUpdated: new Date().toISOString(),
        lastCount: importedCount,
        lastError: null,
      };

      DATA = getDataSnapshot();

      console.log("🟢 Horjul scrape finished. Imported:", importedCount);

      await publishEvent({
        type: "HORJUL_REFRESH.DONE",
        status: "DONE",
        importedCount,
        elapsedMs: Date.now() - startTs,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      horjulJob = {
        running: false,
        lastUpdated: null,
        lastCount: 0,
        lastError: "Failed to parse/import Horjul JSON",
      };

      console.log("🔴 Horjul scrape finished with error:", horjulJob.lastError);
      console.error(e);

      await publishEvent({
        type: "HORJUL_REFRESH.ERROR",
        status: "ERROR",
        error: horjulJob.lastError,
        elapsedMs: Date.now() - startTs,
        timestamp: new Date().toISOString(),
      });
    }
  });

  child.on("error", async (e) => {
    stopHeartbeat();

    horjulJob = {
      running: false,
      lastUpdated: null,
      lastCount: 0,
      lastError: e.message,
    };

    console.log("🔴 Horjul scrape process error:", e.message);

    try {
      await publishEvent({
        type: "HORJUL_REFRESH.ERROR",
        status: "ERROR",
        error: e.message,
        elapsedMs: Date.now() - startTs,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("RabbitMQ error publish failed:", err);
    }
  });

  return res.status(202).json({ message: "Scrape started" });
});

app.get("/api/db/health", (req, res) => {
  const shelters = db.prepare("SELECT COUNT(*) AS c FROM shelters").get().c;
  const animals = db.prepare("SELECT COUNT(*) AS c FROM animals").get().c;
  const events = db.prepare("SELECT COUNT(*) AS c FROM events").get().c;
  const scraped = db
    .prepare("SELECT COUNT(*) AS c FROM scraped_animals")
    .get().c;

  res.json({ ok: true, shelters, animals, events, scraped });
});

// rabbitmq
const clients = new Set();

app.get("/api/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`event: connected\ndata: ok\n\n`);
  clients.add(res);

  req.on("close", () => clients.delete(res));
});

function broadcast(event) {
  const payload = `event: rabbit\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

consumeEvents(async (event) => {
  console.log("📨 RabbitMQ event:", event);
  broadcast(event);
});

app.listen(PORT, () => console.log("--- Backend on http://localhost:4000"));
