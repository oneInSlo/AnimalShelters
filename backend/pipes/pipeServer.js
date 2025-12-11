import net from "net";
import { loadData } from "../xmlStore.js";

// Windows named pipe
const PIPE_NAME = "\\\\.\\pipe\\animalStatsPipe";

// Load XML data
let DATA = loadData();

console.log("🐶 Pipe server started. Waiting for requests...");
console.log(`📡 Listening on named pipe: ${PIPE_NAME}`);

// Create a server using the 'net' module
const server = net.createServer((stream) => {
  console.log("🔗 Client connected to pipe.");

  let buffer = "";
  let processed = false;

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    
    // Check if we have a complete request (ends with newline)
    if (buffer.includes("\n") && !processed) {
      processed = true;
      
      try {
        const request = JSON.parse(buffer.trim());
        console.log("📥 Received request:", request);

        const response = handleRequest(request);
        const json = JSON.stringify(response) + "\n";

        console.log("📤 Sending response:", response);
        
        // Write response immediately
        stream.write(json, (err) => {
          if (err) {
            console.error("⚠ Error writing response:", err.code);
          } else {
            console.log("✅ Response sent successfully");
          }
          
          // Close after a small delay to ensure client receives it
          setTimeout(() => {
            if (!stream.destroyed) {
              stream.end();
            }
          }, 10);
        });
        
      } catch (err) {
        console.error("❌ Error processing request:", err);
        if (!stream.destroyed) {
          stream.write(JSON.stringify({ error: err.message }) + "\n");
          stream.end();
        }
      }
    }
  });

  stream.on("end", () => {
    console.log("🔌 Client disconnected");
  });

  stream.on("error", (err) => {
    // EPIPE is normal when client disconnects
    if (err.code !== "EPIPE") {
      console.error("⚠ Pipe stream error:", err.code);
    }
  });
});

// Start pipe server
server.listen(PIPE_NAME, () => {
  console.log("🚀 Named pipe server listening...");
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
  process.exit(1);
});

// ------------------------------------------------------------
// BUSINESS LOGIC
// ------------------------------------------------------------

function handleRequest(req) {
  switch (req.command) {
    case "getStats":
      return generateGeneralStats();

    case "shelterOverview":
      return shelterOverview(req.shelterId);

    case "speciesDistribution":
      return speciesDistribution();

    default:
      return { error: "Unknown command" };
  }
}

// ----------------------
// STATS FUNCTIONS
// ----------------------

function generateGeneralStats() {
  const animals = DATA.animals;

  return {
    totalAnimals: animals.length,
    neutered: animals.filter((a) => a.neutered).length,
    notNeutered: animals.filter((a) => !a.neutered).length,
    avgFee: avg(animals.map((a) => a.adoptionFee)),
    speciesCount: speciesDistribution(),
  };
}

function shelterOverview(id) {
  const animals = DATA.animals.filter((a) => a.shelter?.id === id);

  return {
    shelterId: id,
    totalAnimals: animals.length,
    dogs: animals.filter((a) => a.species.toLowerCase() === "pes").length,
    cats: animals.filter((a) => a.species.toLowerCase() === "mačka").length,
    avgFee: avg(animals.map((a) => a.adoptionFee)),
  };
}

function speciesDistribution() {
  const animals = DATA.animals;
  const out = {};

  for (const a of animals) {
    out[a.species] = (out[a.species] || 0) + 1;
  }

  return out;
}

// average
function avg(arr) {
  const nums = arr.filter((n) => typeof n === "number" && !isNaN(n));
  if (!nums.length) return 0;
  return (
    Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
  );
}