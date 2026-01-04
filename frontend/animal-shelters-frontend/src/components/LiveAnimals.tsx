import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Grid,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PetsIcon from "@mui/icons-material/Pets";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:4000/api";

type HorjulAnimal = {
  name: string;
  link: string;
  image?: string;
  galleryImgs?: string[];
  daysInShelter?: string;
  dateOfAcceptance?: string;
  foundLocation?: string;
  status?: string;
  temperament?: string;
  sex?: string;
  size?: string;
  ageAtIntake?: string;
  weightAtIntake?: string;
  vetCare?: string;
  description?: string;
};

type HorjulResponse = {
  meta: {
    running: boolean;
    lastUpdated: string | null; // ISO
    lastCount: number;
    lastError: string | null;
  };
  data: HorjulAnimal[];
};

function getSlugFromLink(link: string) {
  try {
    const u = new URL(link);
    return u.pathname.replace(/^\/|\/$/g, "");
  } catch {
    return link.replace(/^\/|\/$/g, "");
  }
}

function formatSlDateTimeFromISO(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return `${date} ob ${time}`;
}

function parseHorjulDate(dateStr?: string) {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  return new Date(year, month, day);
}

function formatSlDateOnlyFromHorjul(dateStr?: string) {
  const d = parseHorjulDate(dateStr);
  if (!d) return "—";
  return new Intl.DateTimeFormat("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function parseDaysInShelter(v?: string) {
  if (!v) return null;
  const n = Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}

type SortMode = "name_asc" | "days_desc" | "accepted_desc";

export default function LiveAnimals() {
  const navigate = useNavigate();

  const [resp, setResp] = useState<HorjulResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // UI filters
  const [q, setQ] = useState("");
  const [sex, setSex] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("accepted_desc");

  const loadData = async () => {
    const r = await fetch(`${API}/horjul`);
    const json = (await r.json()) as HorjulResponse;
    setResp(json);
  };

  useEffect(() => {
    loadData();
  }, []);

  const startRefresh = async () => {
    setConfirmOpen(false);
    setLoading(true);

    // Start scraping
    await fetch(`${API}/horjul/refresh`, { method: "POST" });

    // Poll status
    const poll = setInterval(async () => {
      const s = await fetch(`${API}/horjul/status`).then((r) => r.json());

      setResp((prev) =>
        prev ? { ...prev, meta: { ...prev.meta, ...s } } : { meta: s, data: [] }
      );

      if (!s.running) {
        clearInterval(poll);
        await loadData();
        setLoading(false);
      }
    }, 1500);
  };

  const animals = resp?.data ?? [];

  const uniqueSex = useMemo(() => {
    const set = new Set<string>();
    for (const a of animals) if (a.sex) set.add(a.sex);
    return Array.from(set).sort();
  }, [animals]);

  const uniqueSize = useMemo(() => {
    const set = new Set<string>();
    for (const a of animals) if (a.size) set.add(a.size);
    return Array.from(set).sort();
  }, [animals]);

  const uniqueStatus = useMemo(() => {
    const set = new Set<string>();
    for (const a of animals) if (a.status) set.add(a.status);
    return Array.from(set).sort();
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    const query = q.trim().toLowerCase();

    return animals.filter((a) => {
      const hay = `${a.name ?? ""} ${a.description ?? ""} ${a.foundLocation ?? ""}`.toLowerCase();
      const matchesQuery = !query || hay.includes(query);
      const matchesSex = sex === "all" || (a.sex ?? "").toLowerCase() === sex.toLowerCase();
      const matchesSize = size === "all" || (a.size ?? "").toLowerCase() === size.toLowerCase();
      const matchesStatus =
        status === "all" || (a.status ?? "").toLowerCase() === status.toLowerCase();

      return matchesQuery && matchesSex && matchesSize && matchesStatus;
    });
  }, [animals, q, sex, size, status]);

  const sortedAnimals = useMemo(() => {
    const arr = [...filteredAnimals];

    switch (sort) {
      case "name_asc":
        arr.sort((a, b) => (a.name || "").localeCompare(b.name || "", "sl"));
        break;

      case "days_desc":
        arr.sort((a, b) => {
          const da = parseDaysInShelter(a.daysInShelter) ?? -1;
          const db = parseDaysInShelter(b.daysInShelter) ?? -1;
          return db - da;
        });
        break;

      case "accepted_desc":
      default:
        arr.sort((a, b) => {
          const da = parseHorjulDate(a.dateOfAcceptance)?.getTime() ?? 0;
          const db = parseHorjulDate(b.dateOfAcceptance)?.getTime() ?? 0;
          return db - da;
        });
        break;
    }

    return arr;
  }, [filteredAnimals, sort]);

  const isRunning = !!resp?.meta?.running;
  const lastUpdatedLabel = formatSlDateTimeFromISO(resp?.meta?.lastUpdated ?? null);

  // Simple theme tokens to match your App / Overview feel
  const theme = {
    primary: "#9c27b0",
    primaryDark: "#7b1fa2",
    glass: "rgba(255,255,255,0.95)",
  };

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
      {/* HERO */}
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
            backgroundImage: "url('/assets/img/cat.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.55)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(155deg, ${alpha(theme.primary, 0.55)} 0%, ${alpha(
              "#f7c4bfff",
              0.25
            )} 70%)`,
          }}
        />

        <Container sx={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={1.5} sx={{ textAlign: { xs: "left", md: "left" } }}>
            <Chip
              label="Web scraping (aktualni podatki)"
              sx={{
                width: "fit-content",
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 700,
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
              Aktualne živali
            </Typography>

            <Typography sx={{ color: "rgba(255,255,255,0.92)", maxWidth: 850 }}>
              Ta stran prikazuje živali pridobljene iz spletnega vira (scraping). Podatke lahko osvežiš ročno, vmes pa
              vidiš status izvajanja in čas zadnje posodobitve.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<AccessTimeIcon />}
                label={`Zadnja posodobitev: ${lastUpdatedLabel}`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              <Chip
                icon={<PetsIcon />}
                label={`Živali: ${resp?.meta?.lastCount ?? animals.length}`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              {isRunning ? (
                <Chip
                  color="warning"
                  icon={<WarningAmberIcon />}
                  label="Scraping poteka…"
                  sx={{ fontWeight: 700 }}
                />
              ) : (
                <Chip
                  color="success"
                  icon={<CheckCircleOutlineIcon />}
                  label="Pripravljeno"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container sx={{ py: 4 }} maxWidth="xl">
        {/* TOP BAR */}
        <Card
          sx={{
            bgcolor: theme.glass,
            borderRadius: 3,
            boxShadow: 4,
            mb: 3,
          }}
        >
          {isRunning && <LinearProgress />}

          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  label="Išči po imenu / opisu / lokaciji"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.7 }} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Spol</InputLabel>
                  <Select label="Spol" value={sex} onChange={(e) => setSex(String(e.target.value))}>
                    <MenuItem value="all">Vsi</MenuItem>
                    {uniqueSex.map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Velikost</InputLabel>
                  <Select label="Velikost" value={size} onChange={(e) => setSize(String(e.target.value))}>
                    <MenuItem value="all">Vse</MenuItem>
                    {uniqueSize.map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={status} onChange={(e) => setStatus(String(e.target.value))}>
                    <MenuItem value="all">Vsi</MenuItem>
                    {uniqueStatus.map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={1}>
                <FormControl fullWidth>
                  <InputLabel>
                    <SortIcon sx={{ fontSize: 18 }} />
                  </InputLabel>
                  <Select
                    label=" "
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                  >
                    <MenuItem value="accepted_desc">Najprej nove</MenuItem>
                    <MenuItem value="days_desc">Najdlje v zavetišču</MenuItem>
                    <MenuItem value="name_asc">Ime A–Ž</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Typography sx={{ color: "text.secondary" }}>
                Prikazanih: <strong>{sortedAnimals.length}</strong> / {animals.length}
              </Typography>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => setConfirmOpen(true)}
                disabled={loading || isRunning}
                sx={{
                  whiteSpace: "nowrap",
                  bgcolor: theme.primary,
                  fontWeight: 800,
                  "&:hover": { bgcolor: theme.primaryDark },
                }}
              >
                {loading || isRunning ? "Osveževanje…" : "Osveži podatke"}
              </Button>
            </Stack>

            {resp?.meta?.lastError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {resp.meta.lastError}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* EMPTY STATE */}
        {sortedAnimals.length === 0 && (
          <Alert severity="info">
            Ni zadetkov za izbrane filtre. Poskusi odstraniti filtre ali spremeniti iskanje.
          </Alert>
        )}

        {/* GRID: max 3/row desktop, responsive */}
        <Grid container spacing={2}>
          {sortedAnimals.map((a) => {
            const slug = getSlugFromLink(a.link);
            const img = a.image || a.galleryImgs?.[0] || "";
            const accepted = formatSlDateOnlyFromHorjul(a.dateOfAcceptance);
            const days = parseDaysInShelter(a.daysInShelter);

            return (
              <Grid item key={slug} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    bgcolor: theme.glass,
                    borderRadius: 3,
                    boxShadow: 3,
                    overflow: "hidden",
                    transition: "transform .18s ease, box-shadow .18s ease",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: 8 },
                  }}
                >
                  <CardActionArea onClick={() => navigate(`/live-animals/${slug}`)} sx={{ height: "100%" }}>
                    {img ? (
                      <CardMedia
                        component="img"
                        height="300"
                        image={img}
                        alt={a.name}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 210,
                          bgcolor: alpha(theme.primary, 0.08),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PetsIcon sx={{ fontSize: 46, color: alpha(theme.primary, 0.6) }} />
                      </Box>
                    )}

                    <CardContent sx={{ p: 2.2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.6 }}>
                        {a.name || "Neznano ime"}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        {a.sex && <Chip size="small" label={a.sex} />}
                        {a.size && <Chip size="small" label={a.size} />}
                        {a.status && <Chip size="small" label={a.status} />}
                        {days != null && <Chip size="small" label={`${days} dni`} />}
                      </Stack>

                      <Typography sx={{ color: "text.secondary", mb: 1 }}>
                        Sprejem: <strong>{accepted}</strong>
                      </Typography>

                      {/* {!!a.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {a.description}
                        </Typography>
                      )} */}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Opomba: Podatki se pridobijo z web scrapingom. Za demonstracijo ažurnosti uporabi gumb “Osveži podatke”.
          </Typography>
        </Box>
      </Container>

      {/* CONFIRM DIALOG */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Osveži podatke?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            Osvežitev sproži web scraping. Med izvajanjem bo gumb onemogočen, status pa bo prikazan na vrhu.
          </Typography>
          <Alert severity="info">
            Po koncu se seznam samodejno posodobi – strani ni treba ročno osveževati.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="text" sx={{ fontWeight: 700 }}>
            Prekliči
          </Button>
          <Button onClick={startRefresh} variant="contained" sx={{ fontWeight: 800 }}>
            Začni osvežitev
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
