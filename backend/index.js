import express from "express";
import cors from "cors";
import { loadData } from "./xmlStore.js";
import { exportJson, exportXml } from "./utils/export.js";

const app = express();
app.use(cors());
app.use(express.json());

let DATA = loadData();

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


app.listen(4000, () => console.log("--- Backend on http://localhost:4000"));
