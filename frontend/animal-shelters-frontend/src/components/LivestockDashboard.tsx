import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface LivestockEntry {
  num: string;
  "KATEGORIJE ŽIVINE": string;
  OBČINE: string;
  LETO: string;
  MERITVE: string;
}

interface Shelter {
  city: string;
  latitude: number;
  longitude: number;
}

const cleanName = (s: string) => s.replace(/^\s*\d+(\.\d+)*\s*/, "").trim();

export const LivestockDashboard: React.FC = () => {
  const [rows, setRows] = useState<LivestockEntry[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);

  // --- Load livestock data ---
  useEffect(() => {
    fetch("http://localhost:4000/api/livestock")
      .then((r) => r.json())
      .then((j) => setRows(j.data))
      .catch((e) => console.error(e));
  }, []);

  // --- Load shelters.xml ---
  useEffect(() => {
    fetch("/assets/data/shelters.xml")
      .then((r) => r.text())
      .then((xmlText) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");
        const nodes = Array.from(xml.getElementsByTagName("shelter"));
        const parsed = nodes.map((n) => ({
          city: n.getElementsByTagName("city")[0]?.textContent || "",
          latitude: parseFloat(
            n.getElementsByTagName("latitude")[0]?.textContent || "0"
          ),
          longitude: parseFloat(
            n.getElementsByTagName("longitude")[0]?.textContent || "0"
          ),
        }));
        setShelters(parsed);
      })
      .catch((e) => console.error("Error parsing XML:", e));
  }, []);

  const animals = useMemo(
    () => rows.filter((d) => d["MERITVE"].toLowerCase().includes("živali")),
    [rows]
  );

  const latestYear = useMemo(() => {
    const years = Array.from(new Set(animals.map((d) => d["LETO"]))).map(
      Number
    );
    return years.length ? Math.max(...years) : undefined;
  }, [animals]);

  // === Filter livestock only in municipalities that have shelters ===
  const municipalitiesWithShelters = useMemo(
    () => new Set(shelters.map((s) => s.city.toLowerCase())),
    [shelters]
  );

  const animalsNearShelters = useMemo(
    () =>
      animals.filter((d) =>
        municipalitiesWithShelters.has(cleanName(d["OBČINE"]).toLowerCase())
      ),
    [animals, municipalitiesWithShelters]
  );

  // === Line chart (Livestock in shelter municipalities over years) ===
  const yearsSorted = Array.from(
    new Set(animalsNearShelters.map((d) => d["LETO"]))
  ).sort((a, b) => Number(a) - Number(b));

  const trends = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    animalsNearShelters.forEach((d) => {
      const m = cleanName(d["OBČINE"]);
      const y = d["LETO"];
      const n = Number(d.num);
      if (!map[m]) map[m] = {};
      map[m][y] = (map[m][y] || 0) + n;
    });
    return map;
  }, [animalsNearShelters]);

  const lineData = {
    labels: yearsSorted,
    datasets: Object.entries(trends).map(([m, vals], i) => ({
      label: m,
      data: yearsSorted.map((y) => vals[y] ?? 0),
      borderColor: ["#1976d2", "#d32f2f", "#388e3c", "#fbc02d", "#7b1fa2"][
        i % 5
      ],
      borderWidth: 2,
      tension: 0.35,
      fill: false,
    })),
  };

  const lineOptions: ChartOptions<"line"> = {
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 12 } } },
    },
    scales: {
      x: { ticks: { font: { size: 10 } } },
      y: { ticks: { font: { size: 10 } }, beginAtZero: true },
    },
  };

  // === Bar – Top 10 municipalities (no SLOVENIJA)
  const topMunicipalities = useMemo(() => {
    const map: Record<string, number> = {};
    animals.forEach((d) => {
      const m = cleanName(d["OBČINE"]);
      if (m === "SLOVENIJA") return;
      map[m] = (map[m] || 0) + Number(d.num);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [animals]);

  const barData = {
    labels: topMunicipalities.map(([m]) => m),
    datasets: [
      {
        label: "Skupno število živali",
        data: topMunicipalities.map(([, v]) => v),
        backgroundColor: "rgba(255,159,64,0.75)",
        borderRadius: 6,
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: true, position: "bottom" },
      datalabels: {
        color: "#000",
        anchor: "end",
        align: "top",
        formatter: (val: number) => val.toLocaleString("sl-SI"),
        font: { size: 10 },
      },
    },
    scales: {
      x: { ticks: { font: { size: 10 } } },
      y: { ticks: { font: { size: 10 } }, beginAtZero: true },
    },
  };

  // === Pie – Structure by category (no SLOVENIJA, aggregated per municipality)
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    animals
      .filter((d) => d["OBČINE"] === "SLOVENIJA")
      .filter((d) => (latestYear ? Number(d["LETO"]) === latestYear : true))
      .forEach((d) => {
        const cat = cleanName(d["KATEGORIJE ŽIVINE"]);
        map[cat] = (map[cat] || 0) + Number(d.num);
      });
    return map;
  }, [animals, latestYear]);

  const pieData = {
    labels: Object.keys(byCategory),
    datasets: [
      {
        label: `Delež živali po kategorijah (${latestYear ?? ""})`,
        data: Object.values(byCategory),
        backgroundColor: [
          "rgba(25,118,210,0.7)",
          "rgba(56,142,60,0.7)",
          "rgba(255,193,7,0.7)",
          "rgba(244,67,54,0.7)",
          "rgba(156,39,176,0.7)",
          "rgba(0,188,212,0.7)",
          "rgba(233,30,99,0.7)",
          "rgba(121,85,72,0.7)",
        ],
      },
    ],
  };

  const pieOptions: ChartOptions<"pie"> = {
    plugins: {
      legend: { position: "top", labels: { font: { size: 10 }, boxWidth: 16 } },
      datalabels: {
        color: "#fff",
        formatter: (val: number, ctx: any) => {
          const total = (ctx?.dataset?.data as number[]).reduce(
            (a, b) => a + b,
            0
          );
          const pct = total ? (val / total) * 100 : 0;
          return `${pct.toFixed(1)}%`;
        },
        font: { size: 9 },
      },
    },
  };

  // === Slovenia map (markers for shelters) ===
  const geoUrl = "/assets/data/si.json";

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%)",
        py: 6,
      }}
    >
      <Container maxWidth="xl">
        {/* --- Intro --- */}
        <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mb: 2, color: "#2e7d32" }}
          >
            🐄 Statistika živine v občinah z zavetišči
          </Typography>
          <Typography sx={{ color: "#424242" }}>
            Ta analiza prikazuje število živine v občinah, kjer se nahajajo
            slovenska zavetišča za živali. Ti podatki pomagajo razumeti, kako
            lahko zavetišča prilagodijo svoje programe glede na okolico – na
            primer, kje so primerne kampanje za posvojitev delovnih psov ali
            mačk za kmetije.
          </Typography>
        </Paper>

        {/* --- Map of Slovenia --- */}
        <Paper elevation={3} sx={{ p: 3, mb: 6, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#1565c0" }}>
            🗺️ Lokacije zavetišč in razpored živine
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 6500, center: [14.6, 46.2] }}
              width={500}
              height={300}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#e0e0e0"
                      stroke="#bdbdbd"
                    />
                  ))
                }
              </Geographies>

              {shelters.map((s, i) => (
                <Marker key={i} coordinates={[s.longitude, s.latitude]}>
                  <circle
                    r={2.5}
                    fill="#d32f2f"
                    stroke="#fff"
                    strokeWidth={1}
                  />
                  <text
                    textAnchor="middle"
                    y={-5}
                    style={{
                      fontFamily: "Arial",
                      fontSize: "6px",
                      fill: "#424242",
                    }}
                  >
                    {s.city}
                  </text>
                </Marker>
              ))}
            </ComposableMap>
          </Box>
        </Paper>

        {/* --- Line Chart --- */}
        <Paper elevation={3} sx={{ p: 3, mb: 5, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📈 Število živali po letih (občine z zavetišči)
          </Typography>
          <Line data={lineData} options={lineOptions} height={100} />
        </Paper>

        {/* --- Bar + Pie Centered --- */}
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="flex-start"
          sx={{ mb: 6 }}
        >
          <Grid item xs={false} md={1} />
          <Grid item xs={10} md={5}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mt: 13 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🏙️ Top 10 občin z največ živine
              </Typography>
              <Bar data={barData} options={barOptions} height={180} />
            </Paper>
          </Grid>
          <Grid item xs={10} md={5}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🐖 Struktura živine po kategorijah
              </Typography>
              <Pie data={pieData} options={pieOptions} height={200} />
            </Paper>
          </Grid>
          <Grid item xs={false} md={1} /> {/* right spacer */}
        </Grid>
      </Container>
    </Box>
  );
};
