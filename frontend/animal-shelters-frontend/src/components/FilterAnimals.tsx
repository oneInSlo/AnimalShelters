import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DownloadIcon from "@mui/icons-material/Download";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  ageMonths: number;
  adoptionFee: number;
  neutered: boolean;
  shelter: { name: string; city: string; region: string };
}

const API = "http://localhost:4000/api";

// Theme tokens consistent with other pages
const theme = {
  primary: "#9c27b0",
  primaryDark: "#7b1fa2",
  secondary: "#e1bee7",
  glass: "rgba(255,255,255,0.95)",
};

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

export const FilterAnimals: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    species: "",
    city: "",
    region: "",
    neutered: "",
    maxFee: "",
  });

  const [options, setOptions] = useState({
    species: [] as string[],
    city: [] as string[],
    region: [] as string[],
  });

  const [error, setError] = useState<string | null>(null);

  const fetchAnimals = async () => {
    setLoading(true);
    setError(null);

    try {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => String(v).trim() !== "")
  );

  const res = await fetch(`${API}/animals?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = (await res.json()) as Animal[];

  setAnimals(data);

  // populate dropdowns from returned data (your original behavior)
  const speciesSet = new Set<string>();
  const citySet = new Set<string>();
  const regionSet = new Set<string>();

  data.forEach((a) => {
    if (a.species) speciesSet.add(a.species);
    if (a.shelter?.city) citySet.add(a.shelter.city);
    if (a.shelter?.region) regionSet.add(a.shelter.region);
  });


      setOptions({
        species: Array.from(speciesSet).sort(),
        city: Array.from(citySet).sort(),
        region: Array.from(regionSet).sort(),
      });
    } catch (e: any) {
      console.error(e);
      setError("Prišlo je do napake pri nalaganju podatkov. Preveri backend in konzolo.");
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () =>
    setFilters({
      species: "",
      city: "",
      region: "",
      neutered: "",
      maxFee: "",
    });

  const saveFiltering = async () => {
    try {
      const res = await fetch(`${API}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      if (!res.ok) throw new Error(`Export error: ${res.status}`);
      await res.json();
      alert("Successfully exported! See map 'output' in ./backend.");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Error exporting data. Check your console.");
    }
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((v) => String(v).trim() !== "").length;
  }, [filters]);

  const activeChips = useMemo(() => {
    const chips: { key: keyof typeof filters; label: string }[] = [];
    if (filters.species) chips.push({ key: "species", label: `Vrsta: ${filters.species}` });
    if (filters.city) chips.push({ key: "city", label: `Mesto: ${filters.city}` });
    if (filters.region) chips.push({ key: "region", label: `Regija: ${filters.region}` });
    if (filters.neutered)
      chips.push({
        key: "neutered",
        label: `Kastriran: ${filters.neutered === "true" ? "Da" : "Ne"}`,
      });
    if (filters.maxFee) chips.push({ key: "maxFee", label: `Cena ≤ ${filters.maxFee} €` });
    return chips;
  }, [filters]);

  const removeFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
      {/* HERO (same template style as other pages) */}
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
            backgroundImage: "url('/assets/img/dog-2.jpg')",
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
              icon={<FilterListIcon />}
              label="Napredni filtri"
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
              Filtriranje živali
            </Typography>

            <Typography sx={{ color: "rgba(255,255,255,0.92)", maxWidth: 900 }}>
              Izberi kriterije (vrsta, mesto, regija, kastracija, cena) in hitro najdi pravega spremljevalca.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip
                icon={<PetsIcon />}
                label={`Rezultati: ${animals.length}`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              <Chip
                icon={<FilterListIcon />}
                label={`Aktivni filtri: ${activeFilterCount}`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              <Chip
                icon={<CheckCircleOutlineIcon />}
                label="Kartični prikaz"
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container sx={{ py: 4 }} maxWidth="xl">
        {/* FILTER PANEL */}
        <Card
          sx={{
            bgcolor: theme.glass,
            borderRadius: 3,
            boxShadow: 4,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vrsta</InputLabel>
                  <Select
                    label="Vrsta"
                    value={filters.species}
                    onChange={(e) => setFilters({ ...filters, species: String(e.target.value) })}
                  >
                    <MenuItem value="">Vse</MenuItem>
                    {options.species.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mesto</InputLabel>
                  <Select
                    label="Mesto"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: String(e.target.value) })}
                  >
                    <MenuItem value="">Vsa mesta</MenuItem>
                    {options.city.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Regija</InputLabel>
                  <Select
                    label="Regija"
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: String(e.target.value) })}
                  >
                    <MenuItem value="">Vse regije</MenuItem>
                    {options.region.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Kastriran/Steriliziran</InputLabel>
                  <Select
                    label="Kastriran/Steriliziran"
                    value={filters.neutered}
                    onChange={(e) => setFilters({ ...filters, neutered: String(e.target.value) })}
                  >
                    <MenuItem value="">Vsi</MenuItem>
                    <MenuItem value="true">Da</MenuItem>
                    <MenuItem value="false">Ne</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  type="number"
                  label="Maks. cena (€)"
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, max: 100000 }}
                  value={filters.maxFee}
                  onChange={(e) => setFilters({ ...filters, maxFee: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={9}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                  <Button
                    variant="contained"
                    onClick={fetchAnimals}
                    disabled={loading}
                    startIcon={<FilterListIcon />}
                    sx={{
                      bgcolor: theme.primary,
                      fontWeight: 800,
                      "&:hover": { bgcolor: theme.primaryDark },
                    }}
                  >
                    Filtriraj
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => {
                      clearFilters();
                      // keep behavior: immediately refresh after clearing
                      setTimeout(fetchAnimals, 0);
                    }}
                    startIcon={<RestartAltIcon />}
                    sx={{
                      borderColor: theme.primary,
                      color: theme.primary,
                      fontWeight: 800,
                      "&:hover": {
                        borderColor: theme.primaryDark,
                        bgcolor: alpha(theme.primary, 0.05),
                      },
                    }}
                  >
                    Počisti
                  </Button>

                  {/* <Button
                    variant="contained"
                    color="success"
                    onClick={saveFiltering}
                    startIcon={<DownloadIcon />}
                    sx={{ fontWeight: 800, whiteSpace: "nowrap" }}
                  >
                    Izvozi podatke
                  </Button> */}

                  <Box sx={{ flexGrow: 1 }} />

                  <Typography sx={{ color: "text.secondary" }}>
                    Prikazanih: <strong>{animals.length}</strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            {/* ACTIVE FILTER CHIPS */}
            {activeChips.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {activeChips.map((c) => (
                    <Chip
                      key={c.key}
                      label={c.label}
                      onDelete={() => removeFilter(c.key)}
                      deleteIcon={<CloseIcon />}
                      sx={{
                        bgcolor: alpha(theme.primary, 0.1),
                        color: theme.primaryDark,
                        fontWeight: 700,
                        "& .MuiChip-deleteIcon": { color: theme.primary },
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>

        {/* RESULTS */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: `1px solid ${alpha(theme.primary, 0.12)}`,
            bgcolor: "white",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: alpha(theme.primary, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PetsIcon sx={{ color: theme.primary }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                  Rezultati
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Kartice z osnovnimi podatki + zavetišče
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<FilterListIcon />}
              label={`${animals.length} zadetkov`}
              sx={{ bgcolor: alpha(theme.primary, 0.1), color: theme.primaryDark, fontWeight: 800 }}
            />
          </Stack>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="240px">
              <CircularProgress />
            </Box>
          ) : animals.length === 0 ? (
            <Alert severity="info">Ni rezultatov za izbrane filtre. Poskusi odstraniti filtre ali spremeniti kriterije.</Alert>
          ) : (
            <Grid container spacing={2}>
              {animals.map((a) => (
                <Grid item key={a.id} xs={12} sm={6} md={4} lg={3}>
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
                            title={a.name}
                          >
                            {a.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={`${a.breed} • ${a.species}`}
                          >
                            {a.breed} • {a.species}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={moneyEUR(a.adoptionFee)}
                          sx={{
                            bgcolor: alpha(theme.primary, 0.1),
                            color: theme.primaryDark,
                            fontWeight: 900,
                          }}
                        />
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                        {!!a.sex && <Chip size="small" label={a.sex} />}
                        <Chip size="small" label={`Starost: ${formatAge(a.ageMonths)}`} />
                        <Chip
                          size="small"
                          label={a.neutered ? "Kastriran: Da" : "Kastriran: Ne"}
                          sx={{
                            bgcolor: a.neutered ? alpha("#66bb6a", 0.12) : alpha("#bdbdbd", 0.18),
                            color: a.neutered ? "#2e7d32" : "text.secondary",
                            fontWeight: 700,
                          }}
                        />
                      </Stack>

                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1.8,
                          p: 1.4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.secondary, 0.25),
                          border: `1px solid ${alpha(theme.primary, 0.08)}`,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocationOnOutlinedIcon sx={{ fontSize: 18, color: theme.primary }} />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              color: "text.primary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={a.shelter?.name}
                          >
                            {a.shelter?.name ?? "—"}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.3 }}>
                          {a.shelter?.city ?? "—"} • {a.shelter?.region ?? "—"}
                        </Typography>
                      </Paper>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Namig: Za “hitro resetiranje” uporabi gumb <strong>Počisti</strong>. Za izvoz trenutnih filtrov klikni{" "}
            <strong>Izvozi podatke</strong>.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
