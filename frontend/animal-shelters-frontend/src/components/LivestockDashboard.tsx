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
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import AgricultureIcon from "@mui/icons-material/Agriculture";
import PetsIcon from "@mui/icons-material/Pets";
import InsightsIcon from "@mui/icons-material/Insights";
import FilterListIcon from "@mui/icons-material/FilterList";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

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

interface ShelterApiItem {
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  // allow additional unknown fields
  [key: string]: any;
}

interface Shelter {
  city: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  ageMonths: number;
  neutered: boolean;
  adoptionFee: number;
  temperament?: string[];
  shelter?: { name: string; city: string; region: string };
}

const API = "http://localhost:4000/api";

const theme = {
  primary: "#9c27b0",
  primaryDark: "#7b1fa2",
  secondary: "#e1bee7",
  glass: "rgba(255,255,255,0.95)",
};

const stripCategoryPrefix = (s: string) =>
  String(s ?? "").replace(/^\s*\d+\s+/, "").trim();

const stripMunicipalityPrefix = (s: string) =>
  String(s ?? "").replace(/^\s*[\d.]+\s+/, "").trim();

const cleanForMatch = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .replaceAll("č", "c")
    .replaceAll("š", "s")
    .replaceAll("ž", "z")
    .replace(/\s+/g, " ")
    .trim();

function safeNum(v: string | number) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatAge(ageMonths: number) {
  if (!Number.isFinite(ageMonths)) return "—";
  if (ageMonths < 12) return `${ageMonths} m`;
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months === 0 ? `${years} let` : `${years} let ${months} m`;
}

function moneyEUR(v: number) {
  if (!Number.isFinite(v)) return "—";
  return `${v} €`;
}

function farmFitScore(a: Animal): { score: number; label: string; reasons: string[] } {
  const t = (a.temperament ?? []).map((x) => x.toLowerCase());
  const reasons: string[] = [];
  let score = 0;

  if (a.species === "Pes") {
    score += 4;
    reasons.push("Pes je pogosto primeren za zunanje okolje (varovanje/spremljevalec).");
  } else if (a.species === "Mačka") {
    score += 4;
    reasons.push("Mačka je lahko odlična za “barn-cat” vlogo (nadzor glodavcev).");
  } else if (a.species === "Zajec") {
    score += 1;
    reasons.push("Zajec je lahko primeren v mirnem kmetijskem okolju (odvisno od pogojev).");
  }

  const has = (kw: string) => t.some((x) => x.includes(kw));
  if (has("lovski nagon")) {
    score += 2;
    reasons.push("Prisoten lovski nagon (lahko plus za “barn-cat” vlogo).");
  }
  if (has("opozorilen") || has("opozorilna")) {
    score += 2;
    reasons.push("Opozorilen temperament (koristno za zunanje okolje).");
  }
  if (has("mirn")) {
    score += 1;
    reasons.push("Mirnejši značaj (stabilno vedenje na kmetiji).");
  }
  if (has("prijazen") || has("družaben")) {
    score += 1;
    reasons.push("Prijazen/družaben (lažje sobivanje z ljudmi/okoljem).");
  }

  if (has("plasen") || has("plašen")) score -= 2;
  if (has("ne mara hrupa")) score -= 2;
  if (has("glasen")) score -= 1;

  if (a.ageMonths >= 12) score += 1;
  if (a.ageMonths < 6) score -= 1;

  score = Math.max(0, Math.min(10, score));

  let label = "Morda (z oprezom)";
  if (score >= 7) label = "Odličen kandidat";
  else if (score >= 5) label = "Dober kandidat";

  return { score, label, reasons };
}

export const LivestockDashboard: React.FC = () => {
  const [rows, setRows] = useState<LivestockEntry[]>([]);
  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);

  const [loadingLivestock, setLoadingLivestock] = useState(false);
  const [loadingShelters, setLoadingShelters] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  const [errorLivestock, setErrorLivestock] = useState<string | null>(null);
  const [errorShelters, setErrorShelters] = useState<string | null>(null);
  const [errorAnimals, setErrorAnimals] = useState<string | null>(null);

  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");

  // --- Load livestock data (API returns { metadata, data }) ---
  useEffect(() => {
    const load = async () => {
      setLoadingLivestock(true);
      setErrorLivestock(null);
      try {
        const res = await fetch(`${API}/livestock`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();

        const arr =
          Array.isArray(json) ? json :
          Array.isArray(json?.data) ? json.data :
          Array.isArray(json?.rows) ? json.rows :
          Array.isArray(json?.result) ? json.result :
          [];

        setRows(arr);
      } catch (e) {
        console.error(e);
        setRows([]);
        setErrorLivestock("Podatkov o živini ni bilo mogoče naložiti.");
      } finally {
        setLoadingLivestock(false);
      }
    };
    load();
  }, []);

  // --- Load shelters (prefer backend; fallback to empty) ---
  useEffect(() => {
    const load = async () => {
      setLoadingShelters(true);
      setErrorShelters(null);
      try {
        const res = await fetch(`${API}/shelters`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = (await res.json()) as ShelterApiItem[];

        const parsed: Shelter[] = (Array.isArray(json) ? json : [])
          .map((s) => ({
            city: String(s.city ?? ""),
            region: s.region ? String(s.region) : undefined,
            latitude: typeof s.latitude === "number" ? s.latitude : undefined,
            longitude: typeof s.longitude === "number" ? s.longitude : undefined,
          }))
          .filter((s) => s.city.trim() !== "");

        setShelters(parsed);
      } catch (e) {
        console.error(e);
        setShelters([]);
        setErrorShelters("Podatkov o zavetiščih ni bilo mogoče naložiti (preskakujem filtriranje po občinah).");
      } finally {
        setLoadingShelters(false);
      }
    };
    load();
  }, []);

  // --- Load animals for farm suggestions ---
  useEffect(() => {
    const load = async () => {
      setLoadingAnimals(true);
      setErrorAnimals(null);
      try {
        const res = await fetch(`${API}/animals`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = (await res.json()) as Animal[];
        setAnimals(Array.isArray(json) ? json : []);
      } catch (e) {
        console.error(e);
        setAnimals([]);
        setErrorAnimals("Predlogov živali ni bilo mogoče naložiti (preveri /api/animals).");
      } finally {
        setLoadingAnimals(false);
      }
    };
    load();
  }, []);

  // === Keep only rows that represent number of animals (MERITVE contains 'živali')
  const animalCountRows = useMemo(() => {
    return safeRows.filter((d) => cleanForMatch(d.MERITVE).includes("zivali"));
  }, [safeRows]);

  const yearsSorted = useMemo(() => {
    const set = new Set<string>();
    animalCountRows.forEach((d) => d.LETO && set.add(d.LETO));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [animalCountRows]);

  const latestYear = yearsSorted.length ? yearsSorted[yearsSorted.length - 1] : "";

  // === Municipalities with shelters (for filtering)
  const municipalitiesWithShelters = useMemo(() => {
    const set = new Set<string>();
    shelters.forEach((s) => set.add(cleanForMatch(s.city)));
    return set;
  }, [shelters]);

  // === Dropdown municipalities (from dataset, cleaned & sorted by display name)
  const municipalityOptions = useMemo(() => {
    const set = new Set<string>();
    animalCountRows
      .filter((d) => d.OBČINE && cleanForMatch(d.OBČINE) !== "slovenija")
      .forEach((d) => set.add(d.OBČINE));

    return Array.from(set).sort((a, b) =>
      stripMunicipalityPrefix(a).localeCompare(stripMunicipalityPrefix(b), "sl")
    );
  }, [animalCountRows]);

  // === Apply municipality filter (optional), and shelter filter if shelters exist
  const filteredRows = useMemo(() => {
    const base = animalCountRows.filter((d) => d.OBČINE && d.LETO);

    const byMun = selectedMunicipality
      ? base.filter((d) => d.OBČINE === selectedMunicipality)
      : base;

    // If we have shelters loaded, filter to municipalities with shelters (by cleaned name)
    if (shelters.length > 0) {
      return byMun.filter((d) =>
        municipalitiesWithShelters.has(cleanForMatch(stripMunicipalityPrefix(d.OBČINE)))
      );
    }
    return byMun;
  }, [animalCountRows, selectedMunicipality, shelters.length, municipalitiesWithShelters]);

  // === Line chart: top 5 municipalities (or selected) over time
  const lineData = useMemo(() => {
    const yearLabels = yearsSorted;

    // If selected municipality, show just that one dataset
    const municipalityKeys = new Set<string>();
    filteredRows.forEach((d) => municipalityKeys.add(d.OBČINE));

    let municipalitiesToPlot: string[] = Array.from(municipalityKeys);

    // If no selection, keep it readable: top 5 municipalities in latest year (exclude SLOVENIJA)
    if (!selectedMunicipality) {
      const totals = new Map<string, number>();
      filteredRows
        .filter((d) => d.LETO === latestYear && cleanForMatch(d.OBČINE) !== "slovenija")
        .forEach((d) => {
          totals.set(d.OBČINE, (totals.get(d.OBČINE) ?? 0) + safeNum(d.num));
        });

      municipalitiesToPlot = Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([m]) => m);
    }

    const datasets = municipalitiesToPlot.map((mun, i) => {
      const series = yearLabels.map((y) =>
        filteredRows
          .filter((d) => d.OBČINE === mun && d.LETO === y)
          .reduce((acc, d) => acc + safeNum(d.num), 0)
      );

      const palette = ["#1976d2", "#d32f2f", "#388e3c", "#fbc02d", "#7b1fa2"];
      return {
        label: stripMunicipalityPrefix(mun),
        data: series,
        borderColor: palette[i % palette.length],
        borderWidth: 2,
        tension: 0.35,
        fill: false as const,
        pointRadius: 2,
      };
    });

    return { labels: yearLabels, datasets };
  }, [filteredRows, yearsSorted, selectedMunicipality, latestYear]);

  const lineOptions: ChartOptions<"line"> = {
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 12 } } },
      datalabels: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { ticks: { font: { size: 11 } } },
      y: { ticks: { font: { size: 11 } }, beginAtZero: true },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // === Bar chart: top 10 municipalities by total animals (latest year)
  const barData = useMemo(() => {
    const totals = new Map<string, number>();
    filteredRows
      .filter((d) => d.LETO === latestYear && cleanForMatch(d.OBČINE) !== "slovenija")
      .forEach((d) => {
        totals.set(d.OBČINE, (totals.get(d.OBČINE) ?? 0) + safeNum(d.num));
      });

    const top = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: top.map(([m]) => stripMunicipalityPrefix(m)),
      datasets: [
        {
          label: `Skupno število živali (${latestYear || "—"})`,
          data: top.map(([, v]) => v),
          backgroundColor: alpha(theme.primary, 0.65),
          borderColor: theme.primary,
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }, [filteredRows, latestYear]);

  const barOptions: ChartOptions<"bar"> = {
    plugins: {
      legend: { display: true, position: "bottom" },
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (v: any) => (Number(v) ? Math.round(Number(v)).toLocaleString("sl-SI") : ""),
        font: { weight: "bold", size: 10 },
      },
    },
    scales: {
      x: { ticks: { font: { size: 11 } } },
      y: { ticks: { font: { size: 11 } }, beginAtZero: true },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // === Pie chart: structure by category (Slovenija, latest year)
  const pieData = useMemo(() => {
    const byCat = new Map<string, number>();

    animalCountRows
      .filter((d) => cleanForMatch(d.OBČINE) === "slovenija")
      .filter((d) => (latestYear ? d.LETO === latestYear : true))
      .forEach((d) => {
        const rawCat = d["KATEGORIJE ŽIVINE"];
        byCat.set(rawCat, (byCat.get(rawCat) ?? 0) + safeNum(d.num));
      });

    const labelsRaw = Array.from(byCat.keys());
    const values = labelsRaw.map((k) => byCat.get(k) ?? 0);
    const labels = labelsRaw.map(stripCategoryPrefix);

    return {
      labels,
      datasets: [
        {
          label: `Delež živali po kategorijah (${latestYear || "—"})`,
          data: values,
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
          borderWidth: 1,
        },
      ],
    };
  }, [animalCountRows, latestYear]);

  const pieOptions: ChartOptions<"pie"> = {
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 14 } },
      datalabels: {
        color: "#fff",
        formatter: (val: number, ctx: any) => {
          const total = (ctx?.dataset?.data as number[]).reduce((a, b) => a + b, 0) || 1;
          const pct = (val / total) * 100;
          return pct >= 6 ? `${pct.toFixed(0)}%` : "";
        },
        font: { weight: "bold", size: 10 },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const insights = useMemo(() => {
    if (!latestYear) return null;

    const totalsLatest = new Map<string, number>();
    filteredRows
      .filter((d) => d.LETO === latestYear && cleanForMatch(d.OBČINE) !== "slovenija")
      .forEach((d) => totalsLatest.set(d.OBČINE, (totalsLatest.get(d.OBČINE) ?? 0) + safeNum(d.num)));

    const topMun = Array.from(totalsLatest.entries()).sort((a, b) => b[1] - a[1])[0];

    const catLatest = new Map<string, number>();
    animalCountRows
      .filter((d) => d.LETO === latestYear && cleanForMatch(d.OBČINE) === "slovenija")
      .forEach((d) => catLatest.set(d["KATEGORIJE ŽIVINE"], (catLatest.get(d["KATEGORIJE ŽIVINE"]) ?? 0) + safeNum(d.num)));
    const topCat = Array.from(catLatest.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      topMunicipality: topMun ? { name: stripMunicipalityPrefix(topMun[0]), value: topMun[1] } : null,
      topCategory: topCat ? { name: stripCategoryPrefix(topCat[0]), value: topCat[1] } : null,
      shelters: shelters.length,
      rows: safeRows.length,
    };
  }, [latestYear, filteredRows, animalCountRows, shelters.length, safeRows.length]);

  const farmSuggestions = useMemo(() => {
    const scored = animals.map((a) => ({ animal: a, ...farmFitScore(a) }));

    const filtered =
      selectedMunicipality.trim() === ""
        ? scored
        : scored.filter(({ animal }) => {
            // best-effort matching: compare selected municipality (display name) to animal shelter city/region
            const sel = cleanForMatch(stripMunicipalityPrefix(selectedMunicipality));
            const city = cleanForMatch(animal.shelter?.city ?? "");
            const region = cleanForMatch(animal.shelter?.region ?? "");
            return city.includes(sel) || region.includes(sel) || sel.includes(city);
          });

    return filtered.sort((a, b) => b.score - a.score).slice(0, 6);
  }, [animals, selectedMunicipality]);

  const anyLoading = loadingLivestock || loadingShelters || loadingAnimals;

  const resetFilters = () => setSelectedMunicipality("");

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
      {/* HERO (consistent template) */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 260, md: 320 },
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/assets/img/livestock.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.55)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(155deg, ${alpha(theme.primary, 0.55)} 0%, ${alpha("#f7c4bf", 0.25)} 70%)`,
          }}
        />

        <Container sx={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={1.5}>
            <Chip
              icon={<AgricultureIcon />}
              label="Livestock dashboard"
              sx={{
                width: "fit-content",
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 800,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            />

            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontWeight: 900,
                textShadow: "0 6px 22px rgba(0,0,0,0.35)",
                lineHeight: 1.1,
              }}
            >
              Statistika živine & “farm-friendly” posvojitve
            </Typography>

            <Typography sx={{ color: "rgba(255,255,255,0.92)", maxWidth: 980 }}>
              Prikaz trendov živinoreje po občinah (zavetišča) ter primeri živali iz sistema, ki so bolj primerne za
              kmetijsko okolje.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip icon={<InsightsIcon />} label={`Zapisi: ${safeRows.length}`} sx={{ bgcolor: "rgba(255,255,255,0.9)" }} />
              <Chip icon={<LocationOnOutlinedIcon />} label={`Zavetišča: ${shelters.length}`} sx={{ bgcolor: "rgba(255,255,255,0.9)" }} />
              <Chip icon={<PetsIcon />} label={`Živali: ${animals.length}`} sx={{ bgcolor: "rgba(255,255,255,0.9)" }} />
              <Chip icon={<FilterListIcon />} label={selectedMunicipality ? `Občina: ${stripMunicipalityPrefix(selectedMunicipality)}` : "Občina: vse"} sx={{ bgcolor: "rgba(255,255,255,0.9)" }} />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Errors */}
        {(errorLivestock || errorShelters || errorAnimals) && (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {errorLivestock && <Alert severity="error">{errorLivestock}</Alert>}
            {errorShelters && <Alert severity="warning">{errorShelters}</Alert>}
            {errorAnimals && <Alert severity="warning">{errorAnimals}</Alert>}
          </Stack>
        )}

        {/* Filter + insights */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: theme.glass, borderRadius: 3, boxShadow: 4 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: alpha(theme.primary, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FilterListIcon sx={{ color: theme.primary }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                      Filtri
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Občine so urejene po abecedi (brez številčnih prefiksov). Filtriranje vpliva na grafe in predloge.
                    </Typography>
                  </Box>

                  <Box sx={{ flexGrow: 1 }} />

                  <Button
                    variant="outlined"
                    onClick={resetFilters}
                    startIcon={<RestartAltIcon />}
                    sx={{
                      borderColor: theme.primary,
                      color: theme.primary,
                      fontWeight: 800,
                      "&:hover": { borderColor: theme.primaryDark, bgcolor: alpha(theme.primary, 0.05) },
                    }}
                  >
                    Počisti
                  </Button>
                </Stack>

                {loadingLivestock ? (
                  <Skeleton variant="rounded" height={44} />
                ) : (
                  <FormControl fullWidth size="small">
                    <InputLabel>Občina</InputLabel>
                    <Select
                      label="Občina"
                      value={selectedMunicipality}
                      onChange={(e) => setSelectedMunicipality(String(e.target.value))}
                    >
                      <MenuItem value="">Vse občine</MenuItem>
                      {municipalityOptions.map((m) => (
                        <MenuItem key={m} value={m}>
                          {stripMunicipalityPrefix(m)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: theme.glass, borderRadius: 3, boxShadow: 4, height: "100%" }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: alpha(theme.primary, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <InsightsIcon sx={{ color: theme.primary }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    HitrI vpogled
                  </Typography>
                </Stack>

                {anyLoading ? (
                  <Stack spacing={1}>
                    <Skeleton variant="rounded" height={34} />
                    <Skeleton variant="rounded" height={34} />
                    <Skeleton variant="rounded" height={34} />
                  </Stack>
                ) : !insights ? (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Ni dovolj podatkov za izračun.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    <Chip
                      icon={<LocationOnOutlinedIcon />}
                      label={
                        insights.topMunicipality
                          ? `Top občina (${latestYear}): ${insights.topMunicipality.name}`
                          : `Top občina (${latestYear}): —`
                      }
                      sx={{ justifyContent: "flex-start" }}
                    />
                    <Chip
                      icon={<AgricultureIcon />}
                      label={
                        insights.topCategory ? `Top kategorija (${latestYear}): ${insights.topCategory.name}` : `Top kategorija (${latestYear}): —`
                      }
                      sx={{ justifyContent: "flex-start" }}
                    />
                    <Chip
                      icon={<PetsIcon />}
                      label={`Predlogi: ${farmSuggestions.length}`}
                      sx={{ justifyContent: "flex-start" }}
                    />
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Intro */}
        <Card sx={{ bgcolor: "white", borderRadius: 3, boxShadow: 4, mb: 3, border: `1px solid ${alpha(theme.primary, 0.12)}` }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              Kaj gledam?
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.8 }}>
              Grafi so izračunani iz podatkov <strong>/api/livestock</strong> (upošteva se meritev “Število živali” in stolpec
              <strong> num</strong> kot vrednost). Če so podatki o zavetiščih uspešno naloženi, se grafi privzeto filtrirajo na občine,
              kjer obstaja zavetišče. Filter občine dodatno zoži prikaz.
            </Typography>
          </CardContent>
        </Card>

        {/* Farm suggestions */}
        <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 3, border: `1px solid ${alpha(theme.primary, 0.12)}` }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha(theme.primary, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PetsIcon sx={{ color: theme.primary }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  Predlogi živali za kmetijsko okolje
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Predlogi temeljijo na heuristiki (vrsta + temperament + starost) in so primerni kot demonstracija. Kasneje se lahko zamenja z backend oznako (npr. <code>environmentTags: [\"farm\"]</code>).
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              {loadingAnimals ? <CircularProgress size={20} /> : null}
            </Stack>

            {loadingAnimals ? (
              <Grid container spacing={2}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid item key={i} xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${alpha(theme.primary, 0.12)}` }}>
                      <CardContent sx={{ p: 2.2 }}>
                        <Skeleton variant="rounded" height={26} />
                        <Skeleton variant="text" sx={{ mt: 1 }} />
                        <Skeleton variant="rounded" height={78} sx={{ mt: 1.5 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : farmSuggestions.length === 0 ? (
              <Alert severity="info">Ni predlogov (poskusi “Vse občine”).</Alert>
            ) : (
              <Grid container spacing={2}>
                {farmSuggestions.map(({ animal, score, label, reasons }) => (
                  <Grid item key={animal.id} xs={12} sm={6} md={4} lg={3}>
                    <Card
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        overflow: "hidden",
                        border: `1px solid ${alpha(theme.primary, 0.12)}`,
                        transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: `0 10px 28px ${alpha(theme.primary, 0.16)}`,
                          borderColor: alpha(theme.primary, 0.45),
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              bgcolor: alpha(theme.primary, 0.1),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <PetsIcon sx={{ color: theme.primary }} />
                          </Box>

                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 900,
                                lineHeight: 1.1,
                                mb: 0.5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={animal.name}
                            >
                              {animal.name}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={`${animal.breed} • ${animal.species}`}
                            >
                              {animal.breed} • {animal.species}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={`${label} • ${score}/10`}
                            sx={{
                              bgcolor: alpha(theme.primary, 0.1),
                              color: theme.primaryDark,
                              fontWeight: 900,
                            }}
                          />
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          {animal.sex && <Chip size="small" label={animal.sex} />}
                          <Chip size="small" label={`Starost: ${formatAge(animal.ageMonths)}`} />
                          <Chip size="small" label={`Cena: ${moneyEUR(animal.adoptionFee)}`} sx={{ bgcolor: alpha(theme.secondary, 0.35) }} />
                        </Stack>

                        {animal.temperament?.length ? (
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mt: 1.2 }}>
                            {animal.temperament.slice(0, 4).map((t) => (
                              <Chip
                                key={t}
                                size="small"
                                label={t}
                                sx={{
                                  bgcolor: alpha(theme.primary, 0.1),
                                  color: theme.primaryDark,
                                  fontWeight: 700,
                                }}
                              />
                            ))}
                          </Stack>
                        ) : null}

                        <Paper
                          elevation={0}
                          sx={{
                            mt: 1.6,
                            p: 1.4,
                            borderRadius: 2,
                            bgcolor: alpha(theme.secondary, 0.25),
                            border: `1px solid ${alpha(theme.primary, 0.08)}`,
                          }}
                        >
                          <Typography sx={{ fontWeight: 900, mb: 0.6 }} variant="body2">
                            Zakaj predlog?
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {reasons[0] ?? "—"}
                          </Typography>

                          {animal.shelter?.city || animal.shelter?.region ? (
                            <Box sx={{ mt: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <LocationOnOutlinedIcon sx={{ fontSize: 18, color: theme.primary }} />
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                  {animal.shelter?.city ?? "—"} • {animal.shelter?.region ?? "—"}
                                </Typography>
                              </Stack>
                            </Box>
                          ) : null}
                        </Paper>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 4, height: 460 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                  Število živali po letih {selectedMunicipality ? `(${stripMunicipalityPrefix(selectedMunicipality)})` : "(top občine)"}
                </Typography>

                {loadingLivestock ? (
                  <Skeleton variant="rounded" height={360} />
                ) : lineData.labels.length === 0 ? (
                  <Alert severity="info">Ni podatkov za prikaz (preveri filtre ali zavetišča).</Alert>
                ) : (
                  <Box sx={{ height: 380 }}>
                    <Line data={lineData} options={lineOptions} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 4, height: 440 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                  Top 10 občin z največ živine {latestYear ? `(${latestYear})` : ""}
                </Typography>

                {loadingLivestock ? (
                  <Skeleton variant="rounded" height={340} />
                ) : (barData.datasets[0]?.data as number[]).length === 0 ? (
                  <Alert severity="info">Ni podatkov za prikaz.</Alert>
                ) : (
                  <Box sx={{ height: 350 }}>
                    <Bar data={barData} options={barOptions} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 4, height: 440 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                  Struktura živine po kategorijah {latestYear ? `(${latestYear})` : ""}
                </Typography>

                {loadingLivestock ? (
                  <Skeleton variant="rounded" height={340} />
                ) : (pieData.datasets[0]?.data as number[]).length === 0 ? (
                  <Alert severity="info">Ni podatkov za prikaz.</Alert>
                ) : (
                  <Box sx={{ height: 350 }}>
                    <Pie data={pieData} options={pieOptions} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Opomba: Če <strong>/api/shelters</strong> ni na voljo, se grafi ne filtrirajo na občine z zavetišči (prikaže se širši nabor).
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
