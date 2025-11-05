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
import { Bar, Line, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Box, Container, Typography, Grid } from "@mui/material";

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
  "OBČINE": string;
  "LETO": string;
  "MERITVE": string;
}

const cleanName = (s: string) => s.replace(/^\s*\d+(\.\d+)*\s*/, "").trim();

export const LivestockDashboard: React.FC = () => {
  const [rows, setRows] = useState<LivestockEntry[]>([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/livestock")
      .then((r) => r.json())
      .then((j) => setRows(j.data))
      .catch((e) => console.error(e));
  }, []);

  const animals = useMemo(
    () => rows.filter((d) => d["MERITVE"].toLowerCase().includes("živali")),
    [rows]
  );

  const latestYear = useMemo(() => {
    const years = Array.from(new Set(animals.map((d) => d["LETO"]))).map(Number);
    return years.length ? Math.max(...years) : undefined;
  }, [animals]);

  // === 1️⃣ Line Chart – Top 5 municipalities over time (without SLOVENIJA)
  const top5Municipalities = useMemo(() => {
    const map: Record<string, number> = {};
    animals
      .filter((d) => d["LETO"] === String(latestYear))
      .filter((d) => d["OBČINE"] !== "SLOVENIJA")
      .forEach((d) => {
        const name = cleanName(d["OBČINE"]);
        map[name] = (map[name] || 0) + Number(d.num);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([m]) => m);
  }, [animals, latestYear]);

  const municipalityTrends = useMemo(() => {
    const series: Record<string, Record<string, number>> = {};
    animals.forEach((d) => {
      const m = cleanName(d["OBČINE"]);
      if (!top5Municipalities.includes(m)) return;
      const y = d["LETO"];
      const n = Number(d.num);
      if (!series[m]) series[m] = {};
      series[m][y] = (series[m][y] || 0) + n;
    });
    return series;
  }, [animals, top5Municipalities]);

  const yearsSorted = Array.from(new Set(animals.map((d) => d["LETO"])))
    .sort((a, b) => Number(a) - Number(b));

  const lineData = {
    labels: yearsSorted,
    datasets: Object.entries(municipalityTrends).map(([m, vals], i) => ({
      label: m,
      data: yearsSorted.map((y) => vals[y] ?? 0),
      borderColor: ["#e53935", "#43a047", "#fb8c00", "#8e24aa", "#00acc1"][i],
      borderWidth: 1.8,
      tension: 0.35,
      fill: false,
    })),
  };

  const lineOptions: ChartOptions<"line"> = {
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 11 } } },
    },
    scales: {
      x: { ticks: { font: { size: 10 } } },
      y: { ticks: { font: { size: 10 } }, beginAtZero: true },
    },
  };

  // === 2️⃣ Bar – Top 10 municipalities (no SLOVENIJA)
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

  // === 3️⃣ Pie – Structure by category (no SLOVENIJA, aggregated per municipality)
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
          const total = (ctx?.dataset?.data as number[]).reduce((a, b) => a + b, 0);
          const pct = total ? (val / total) * 100 : 0;
          return `${pct.toFixed(1)}%`;
        },
        font: { size: 9 },
      },
    },
  };

  // === 4️⃣ Extra chart – Category comparison (Top 5 municipalities)
  const byCategoryTopMunicipalities = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    animals
      .filter((d) => top5Municipalities.includes(cleanName(d["OBČINE"])))
      .filter((d) => (latestYear ? Number(d["LETO"]) === latestYear : true))
      .forEach((d) => {
        const cat = cleanName(d["KATEGORIJE ŽIVINE"]);
        const m = cleanName(d["OBČINE"]);
        if (!map[cat]) map[cat] = {};
        map[cat][m] = (map[cat][m] || 0) + Number(d.num);
      });
    return map;
  }, [animals, top5Municipalities, latestYear]);

  const categoryBarData = {
    labels: Object.keys(byCategoryTopMunicipalities),
    datasets: top5Municipalities.map((m, i) => ({
      label: m,
      data: Object.keys(byCategoryTopMunicipalities).map(
        (cat) => byCategoryTopMunicipalities[cat][m] || 0
      ),
      backgroundColor: [
        "#e53935",
        "#43a047",
        "#fb8c00",
        "#8e24aa",
        "#00acc1",
      ][i],
    })),
  };

  const categoryBarOptions: ChartOptions<"bar"> = {
    plugins: {
      legend: { position: "top", labels: { font: { size: 10 } } },
    },
    scales: {
      x: { ticks: { font: { size: 9 } } },
      y: { ticks: { font: { size: 9 } }, beginAtZero: true },
    },
  };

  // === 5️⃣ Extra chart – Average livestock per municipality
  const avgPerMunicipality = useMemo(() => {
    const map: Record<string, number[]> = {};
    animals.forEach((d) => {
      const m = cleanName(d["OBČINE"]);
      if (m === "SLOVENIJA") return;
      const n = Number(d.num);
      if (!map[m]) map[m] = [];
      map[m].push(n);
    });
    return Object.entries(map).map(([m, arr]) => [m, arr.reduce((a, b) => a + b, 0) / arr.length]);
  }, [animals]);

  const avgData = {
    labels: avgPerMunicipality.map(([m]) => m as string).slice(0, 15),
    datasets: [
      {
        label: "Povprečno število živali na občino",
        data: avgPerMunicipality.map(([, v]) => v as number).slice(0, 15),
        backgroundColor: "rgba(33,150,243,0.7)",
      },
    ],
  };

  const avgOptions: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { font: { size: 9 } } },
      y: { ticks: { font: { size: 9 } }, beginAtZero: true },
    },
  };

  // === Render ===
  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        color: "#212121",
        py: 6,
      }}
    >
      <Container maxWidth="xl">
        {/* --- Introduction --- */}
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          🐄 Statistika živine po občinah in letih
        </Typography>
        <Typography sx={{ mb: 4, color: "#424242" }}>
          Ta analiza povezuje število živine po slovenskih občinah z delovanjem
          živalskih zavetišč. Na območjih, kjer je več živine (npr. govedo, ovce,
          koze), lahko zavetišča pripravijo posebne dogodke ali kampanje za
          posvojitve delovnih psov in mačk, ki so primerni za kmetijska okolja
          (npr. psi, ki čuvajo živino, ali mačke, ki zmanjšujejo populacijo
          glodalcev). Vizualizacije spodaj pomagajo prepoznati regije, kjer bi
          sodelovanje med kmeti in zavetišči lahko prineslo največ koristi.
        </Typography>

        {/* --- First chart --- */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            📈 Število živali po letih (vodilne občine)
          </Typography>
          <Line data={lineData} options={lineOptions} height={120} />
        </Box>

        {/* --- Second + Third side by side --- */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              🏙️ Top 10 občin z največ živine
            </Typography>
            <Bar data={barData} options={barOptions} height={180} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              🐖 Struktura živine po kategorijah ({latestYear})
            </Typography>
            <Pie data={pieData} options={pieOptions} height={200} />
          </Grid>
        </Grid>

        {/* --- Fourth chart --- */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            🐕 Primerjava vrst živine v vodilnih občinah ({latestYear})
          </Typography>
          <Bar data={categoryBarData} options={categoryBarOptions} height={180} />
        </Box>

        {/* --- Fifth chart --- */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            📊 Povprečno število živali na občino
          </Typography>
          <Bar data={avgData} options={avgOptions} height={160} />
        </Box>
      </Container>
    </Box>
  );
};
