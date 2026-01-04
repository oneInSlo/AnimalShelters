// backend/maps/maps.js
import express from "express";

export default function createMapsRoutes({ getData }) {
  const router = express.Router();

  const OSM_UA =
    process.env.OSM_USER_AGENT || "AnimalShelters/1.0 (FERI student project)";
  const geocodeCache = new Map();
  const GEOCODE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

  async function nominatimSearch(q) {
    const key = q.trim().toLowerCase();
    const cached = geocodeCache.get(key);
    if (cached && Date.now() - cached.ts < GEOCODE_TTL_MS) return cached.data;

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      q
    )}`;

    const resp = await fetch(url, {
      headers: {
        "User-Agent": OSM_UA,
        "Accept-Language": "sl",
      },
    });

    if (!resp.ok) throw new Error(`Nominatim error: ${resp.status}`);
    const json = await resp.json();

    const best = json?.[0]
      ? {
          displayName: json[0].display_name,
          lat: Number(json[0].lat),
          lon: Number(json[0].lon),
        }
      : null;

    geocodeCache.set(key, { ts: Date.now(), data: best });
    return best;
  }

  // GET /api/osm/geocode?q=...
  router.get("/osm/geocode", async (req, res) => {
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

  // GET /api/osm/shelters-enriched
  router.get("/osm/shelters-enriched", async (req, res) => {
    try {
      const DATA = getData();
      const shelters = DATA.shelters;

      const enriched = [];
      for (const s of shelters) {
        let lat = Number(s.latitude);
        let lon = Number(s.longitude);

        if (!lat || !lon) {
          const q = `${s.address}, ${s.postalCode} ${s.city}, Slovenia`;
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

  return router;
}
