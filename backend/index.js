import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import iconv from "iconv-lite";
import createLlmRoutes from "./llm/llm.js";
import { loadData } from "./xmlStore.js";
import { exportJson, exportXml } from "./utils/export.js";
import { createRequire } from "module";
import { grpcClient } from "./grpcClient.js";

const app = express();
app.use(cors());
app.use(express.json());

const require = createRequire(import.meta.url);
global._ = require("underscore");
const PX = require("./lib/px.cjs");

const PORT = 4000;

let DATA = loadData();

const PX_URL = "https://pxweb.stat.si/SiStatData/Resources/PX/Databases/Data/15P1201S.PX";


app.get("/api/animals", (req, res) => {
  const { species, city, neutered, maxFee, region } = req.query;
  let results = DATA.animals;

  if (species)
    results = results.filter(
      (a) => a.species.toLowerCase() === species.toLowerCase()
    );
  if (city)
    results = results.filter(
      (a) => a.shelter?.city.toLowerCase() === city.toLowerCase()
    );
  if (region)
    results = results.filter(
      (a) => a.shelter?.region.toLowerCase() === region.toLowerCase()
    );
  if (neutered !== undefined && neutered !== "") {
    const normalized = String(neutered).toLowerCase().trim();
    const boolVal = normalized === "true";
    results = results.filter((a) => a.neutered === boolVal);
  }
  if (maxFee) results = results.filter((a) => a.adoptionFee <= Number(maxFee));

  console.table(
    results.map((a) => ({
      id: a.id,
      name: a.name,
      city: a.shelter?.city,
      fee: a.adoptionFee,
      neutered: a.neutered,
    }))
  );

  res.json(results);
});

// backend endpoint for use on frontend
app.post("/api/export", (req, res) => {
  const { species, city, region, neutered, maxFee } = req.body;
  let results = DATA.animals;

  if (species)
    results = results.filter((a) => a.species.toLowerCase() === species.toLowerCase());
  if (city)
    results = results.filter((a) => a.shelter?.city.toLowerCase() === city.toLowerCase());
  if (region)
    results = results.filter((a) => a.shelter?.region.toLowerCase() === region.toLowerCase());
  if (neutered !== undefined && neutered !== "") {
    const boolVal = String(neutered).toLowerCase().trim() === "true";
    results = results.filter((a) => a.neutered === boolVal);
  }
  if (maxFee)
    results = results.filter((a) => a.adoptionFee <= Number(maxFee));

  exportJson(results);
  exportXml(results);
  res.json({
    message: "Filtered export successful!",
    count: results.length,
  });
});

// livestock endpoint (.px file)
app.get("/api/livestock", async (req, res) => {
  try {
    // download .px file dynamically from URL
    const response = await fetch(PX_URL);
    const buffer = await response.arrayBuffer();
    const pxText = iconv.decode(Buffer.from(buffer), "win1250");

    // parse using Px.js
    const pxInstance = new PX(pxText);
    const variables = pxInstance.variables();
    const entries = pxInstance.entries();

    res.json({ metadata: variables, data: entries });
  } catch (err) {
    console.error("Error parsing PC-AXIS file:", err);
    res.status(500).json({ error: "Failed to parse PX data" });
  }
});

// gRPC endpoints
app.get("/api/grpc/shelters", (req, res) => {
  grpcClient.ListShelters({}, (err, response) => {
    if (err) {
      console.error("gRPC error (ListShelters):", err);
      return res.status(500).json({ error: "Napaka pri pridobivanju zavetišč." });
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
        return res.status(500).json({ error: "Napaka pri pridobivanju živali za zavetišče." });
      }
      res.json(response.animals);
    }
  );
});

app.get("/api/grpc/animals/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

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

// LLM
app.use("/api", createLlmRoutes(DATA));

app.listen(PORT, () => console.log("--- Backend on http://localhost:4000"));
