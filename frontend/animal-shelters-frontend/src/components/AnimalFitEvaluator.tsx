import React, { useEffect, useMemo, useState } from "react";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import PsychologyIcon from "@mui/icons-material/Psychology";
import PetsIcon from "@mui/icons-material/Pets";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  ageMonths: number;
  temperament?: string[];
  shelter?: { name: string; city: string; region: string };
}

interface FitResult {
  fitScore: number;
  fitLabelSl: string;
  summarySl: string;
  behaviorMatchSl: string;
  risksSl: string[];
  recommendationsSl: string[];
}

const API = "http://localhost:4000/api";

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

export const AnimalFitEvaluator: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fitResult, setFitResult] = useState<FitResult | null>(null);

  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [loadingFit, setLoadingFit] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Lifestyle inputs
  const [form, setForm] = useState({
    livingSituation: "",
    activityLevel: "",
    experienceLevel: "",
    hasChildren: "",
    hasOtherPets: "",
    timeAvailablePerDay: "",
  });

  const onFormChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Load animals
  useEffect(() => {
    const load = async () => {
      setLoadingAnimals(true);
      setError(null);
      try {
        const res = await fetch(`${API}/animals`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = (await res.json()) as Animal[];
        setAnimals(data);
      } catch (e) {
        console.error(e);
        setError("Prišlo je do napake pri nalaganju živali. Preveri backend in konzolo.");
        setAnimals([]);
      } finally {
        setLoadingAnimals(false);
      }
    };
    load();
  }, []);

  const selectedAnimal = useMemo(
    () => animals.find((a) => a.id === selectedId),
    [animals, selectedId]
  );

  const canSubmit = useMemo(() => {
    // keep it permissive, but require animal selection
    return Boolean(selectedId) && !loadingFit;
  }, [selectedId, loadingFit]);

  // Submit LLM request
  const handleSubmit = async () => {
    if (!selectedId) return;

    setLoadingFit(true);
    setFitResult(null);
    setError(null);

    try {
      const response = await fetch(`${API}/animal-fit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animalId: selectedId, ...form }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = (await response.json()) as FitResult;
      setFitResult(data);
    } catch (e) {
      console.error(e);
      setError("Prišlo je do napake pri AI ocenjevanju. Preveri backend/LLM endpoint.");
      setFitResult(null);
    } finally {
      setLoadingFit(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
      {/* HERO (same structure/template as other pages) */}
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
            backgroundImage: "url('/assets/img/cat-2.jpg')",
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
              "#f7c4bf",
              0.25
            )} 70%)`,
          }}
        />

        <Container sx={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={1.5}>
            <Chip
              icon={<PsychologyIcon />}
              label="AI ocena primernosti"
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
              Preveri ujemanje z živaljo
            </Typography>

            <Typography sx={{ color: "rgba(255,255,255,0.92)", maxWidth: 900 }}>
              Izberi žival, opiši svoj življenjski slog in pridobi jasno AI oceno ujemanja (povzetek, tveganja,
              priporočila).
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip
                icon={<PetsIcon />}
                label={loadingAnimals ? "Nalagam..." : `Živali: ${animals.length}`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              <Chip
                icon={<AutoAwesomeIcon />}
                label="LLM analiza"
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* LEFT: select animal */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                bgcolor: theme.glass,
                borderRadius: 3,
                boxShadow: 4,
                overflow: "hidden",
              }}
            >
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
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                      1) Izberi žival
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Najprej izberi žival, ki jo želiš oceniti.
                    </Typography>
                  </Box>
                </Stack>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Žival</InputLabel>
                  <Select
                    label="Žival"
                    value={selectedId}
                    onChange={(e) => setSelectedId(String(e.target.value))}
                    disabled={loadingAnimals}
                  >
                    {animals.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name} — {a.species} ({a.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {loadingAnimals && (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress />
                  </Box>
                )}

                {selectedAnimal && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.secondary, 0.25),
                      border: `1px solid ${alpha(theme.primary, 0.12)}`,
                    }}
                  >
                    <Stack spacing={0.7}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        {selectedAnimal.name}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                        <Chip size="small" label={`${selectedAnimal.species}`} />
                        <Chip size="small" label={`${selectedAnimal.breed}`} />
                        <Chip size="small" label={`Starost: ${formatAge(selectedAnimal.ageMonths)}`} />
                        {selectedAnimal.sex && <Chip size="small" label={`${selectedAnimal.sex}`} />}
                      </Stack>

                      {selectedAnimal.shelter && (
                        <Box sx={{ mt: 0.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LocationOnOutlinedIcon sx={{ fontSize: 18, color: theme.primary }} />
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {selectedAnimal.shelter.name}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {selectedAnimal.shelter.city} • {selectedAnimal.shelter.region}
                          </Typography>
                        </Box>
                      )}

                      {selectedAnimal.temperament?.length ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mt: 0.5 }}>
                          {selectedAnimal.temperament.slice(0, 6).map((t) => (
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
                    </Stack>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT: lifestyle form */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                bgcolor: theme.glass,
                borderRadius: 3,
                boxShadow: 4,
                overflow: "hidden",
              }}
            >
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
                    <PsychologyIcon sx={{ color: theme.primary }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                      2) Opis tvojega življenjskega sloga
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Vnesi podatke — AI bo izračunal ujemanje in predlagal priporočila.
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Bivalna situacija"
                      placeholder="stanovanje, hiša z vrtom..."
                      value={form.livingSituation}
                      onChange={(e) => onFormChange("livingSituation", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Aktivnost"
                      placeholder="nizka, srednja, visoka"
                      value={form.activityLevel}
                      onChange={(e) => onFormChange("activityLevel", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Izkušnje z živalmi"
                      placeholder="začetnik, srednje, visoke"
                      value={form.experienceLevel}
                      onChange={(e) => onFormChange("experienceLevel", e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Otroci</InputLabel>
                      <Select
                        value={form.hasChildren}
                        label="Otroci"
                        onChange={(e) => onFormChange("hasChildren", String(e.target.value))}
                      >
                        <MenuItem value="da">Da</MenuItem>
                        <MenuItem value="ne">Ne</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Druge živali</InputLabel>
                      <Select
                        value={form.hasOtherPets}
                        label="Druge živali"
                        onChange={(e) => onFormChange("hasOtherPets", String(e.target.value))}
                      >
                        <MenuItem value="da">Da</MenuItem>
                        <MenuItem value="ne">Ne</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Čas na voljo (ure/dan)"
                      value={form.timeAvailablePerDay}
                      onChange={(e) => onFormChange("timeAvailablePerDay", e.target.value)}
                      inputProps={{ min: 0, max: 24 }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    startIcon={loadingFit ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
                    sx={{
                      bgcolor: theme.primary,
                      fontWeight: 900,
                      px: 2.5,
                      "&:hover": { bgcolor: theme.primaryDark },
                    }}
                  >
                    {loadingFit ? "Ocenjujem..." : "Oceni primernost"}
                  </Button>

                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Namig: čim bolj konkretno opiši situacijo (npr. “2x sprehod/dan”, “majhno stanovanje”, …).
                  </Typography>

                  <Box sx={{ flexGrow: 1 }} />

                  <Chip
                    icon={<CheckCircleOutlineIcon />}
                    label={selectedId ? "Žival izbrana" : "Izberi žival"}
                    sx={{
                      bgcolor: selectedId ? alpha("#66bb6a", 0.14) : alpha("#bdbdbd", 0.18),
                      color: selectedId ? "#2e7d32" : "text.secondary",
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* RESULT */}
        {loadingFit && (
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {fitResult && (
          <Card
            sx={{
              mt: 3,
              borderRadius: 3,
              boxShadow: 4,
              overflow: "hidden",
              border: `1px solid ${alpha(theme.primary, 0.12)}`,
            }}
          >
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
                  <AutoAwesomeIcon sx={{ color: theme.primary }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                    Rezultati AI analize
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Povzetek, ujemanje vedenja, tveganja in priporočila.
                  </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Chip
                  label={`${fitResult.fitLabelSl} (${fitResult.fitScore * 10} / 10)`}
                  sx={{
                    bgcolor: alpha(theme.primary, 0.1),
                    color: theme.primaryDark,
                    fontWeight: 900,
                    fontSize: 15
                  }}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.secondary, 0.22),
                      height: "100%",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, mb: 0.8 }}>Povzetek</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {fitResult.summarySl}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.secondary, 0.22),
                      height: "100%",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, mb: 0.8 }}>Ujemanje vedenja</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {fitResult.behaviorMatchSl}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ m: 6 }} />

              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha("#ffcc80", 0.22),
                      border: `1px solid ${alpha("#fb8c00", 0.18)}`,
                      height: "100%",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <WarningAmberOutlinedIcon sx={{ color: "#ef6c00" }} />
                      <Typography sx={{ fontWeight: 900 }}>Možna tveganja</Typography>
                    </Stack>

                    <Stack spacing={1}>
                      {fitResult.risksSl.map((r, i) => (
                        <Paper
                          key={i}
                          elevation={0}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: `${alpha("#ef6c00", 0.20)}`,
                            border: `1px solid ${alpha("#ef6c00", 0.12)}`,
                          }}
                        >
                          <Typography variant="body2">{r}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha("#81c784", 0.18),
                      border: `1px solid ${alpha("#2e7d32", 0.14)}`,
                      height: "100%",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircleOutlineIcon sx={{ color: "#2e7d32" }} />
                      <Typography sx={{ fontWeight: 900 }}>Priporočila</Typography>
                    </Stack>

                    <Stack spacing={1}>
                      {fitResult.recommendationsSl.map((r, i) => (
                        <Paper
                          key={i}
                          elevation={0}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: `${alpha("#2e7d32", 0.20)}`,
                            border: `1px solid ${alpha("#2e7d32", 0.12)}`,
                          }}
                        >
                          <Typography variant="body2">{r}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};
