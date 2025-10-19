import { loadData } from "./xmlStore.js";
import { exportJson, exportXml } from "./utils/export.js";

// STEP 1: read all XML files and convert to objects (function in xmlStore.js)
const { shelters, animals, events } = loadData();
console.log("XML files successfully loaded.");
console.log(`Shelters: ${shelters.length}, Animals: ${animals.length}, Events: ${events.length}`);

// STEP 2: join data (already done in xmlStore.js via shelterId)
console.log("\nAnimals (example linked data):");
console.table(
  animals.slice(0, 5).map((a) => ({
    ID: a.id,
    Name: a.name,
    Shelter: a.shelter?.name || "-",
    City: a.shelter?.city || "-",
  }))
);

// STEP 3: data filtering

// Ex.01: all animals that are not neutered
const notNeutered = animals.filter(
    (a) => a.neutered === false
);

// Ex.02: all dogs with adoption fee under 20
const cheapDogs = animals.filter(
    (a) => (a.species === "Pes" && a.adoptionFee < 20)
);

// Ex.03: all events happening in Ljubljana
const ljubljanaEvents = events.filter(
  (e) => e.city && e.city.toLowerCase() === "ljubljana"
);

const filtered1 = notNeutered;
const filtered2 = cheapDogs;
const filtered3 = ljubljanaEvents;

// STEP 4: print data in console table 
console.log("\nFiltered results:");
console.table(
  filtered1.map((a) => ({
    ID: a.id,
    Name: a.name,
    Species: a.species,
    Neutered: a.neutered,
    Fee: a.adoptionFee,
    Shelter: a.shelter?.name,
    City: a.shelter?.city,
  }))
);

// STEP 5: export
exportJson(filtered1, "filtrirano.json");
exportXml(filtered1, "filtrirano.xml");

console.log("\nFiltered results exported to:");
console.log(" - output/filtrirano.json");
console.log(" - output/filtrirano.xml");
