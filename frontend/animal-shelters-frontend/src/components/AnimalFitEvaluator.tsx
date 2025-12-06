import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Alert,
} from "@mui/material";

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

export const AnimalFitEvaluator: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [loading, setLoading] = useState(false);

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
    fetch("http://localhost:4000/api/animals")
      .then((r) => r.json())
      .then((j) => setAnimals(j));
  }, []);

  // Submit LLM request
  const handleSubmit = async () => {
    if (!selectedId) return;

    setLoading(true);
    setFitResult(null);

    const response = await fetch("http://localhost:4000/api/animal-fit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animalId: selectedId, ...form }),
    });

    const data = await response.json();
    setFitResult(data);
    setLoading(false);
  };

  const selectedAnimal = animals.find((a) => a.id === selectedId);

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
        {/* HEADER */}
        <Paper
          elevation={3}
          sx={{ p: 4, mb: 5, borderRadius: 3, textAlign: "center" }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            🧠 AI Ocena Primernosti Živali
          </Typography>
          <Typography sx={{ color: "#616161" }}>
            Izberi žival, vnesi svoj življenjski slog in preveri, kako dobro se
            ujemata.
          </Typography>
        </Paper>

        {/* FORM + ANIMAL SELECTION */}
        <Grid container spacing={4}>
          {/* LEFT: select animal */}
          <Grid item xs={12} md={5}>
            <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                1️⃣ Izberi žival
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>ID živali</InputLabel>
                <Select
                  label="ID živali"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {animals.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.id} — {a.name} ({a.species})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedAnimal && (
                <Paper
                  elevation={2}
                  sx={{ p: 2, mt: 2, backgroundColor: "#f4f6f8" }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedAnimal.name}
                  </Typography>
                  <Typography variant="body2">
                    Vrsta: {selectedAnimal.species}
                  </Typography>
                  <Typography variant="body2">
                    Pasma: {selectedAnimal.breed}
                  </Typography>
                  <Typography variant="body2">
                    Starost: {selectedAnimal.ageMonths} mesecev
                  </Typography>
                  <Typography variant="body2">
                    Spol: {selectedAnimal.sex}
                  </Typography>
                </Paper>
              )}
            </Paper>
          </Grid>

          {/* RIGHT: lifestyle form */}
          <Grid item xs={12} md={7}>
            <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                2️⃣ Opis tvojega življenjskega sloga
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bivalna situacija"
                    placeholder="stanovanje, hiša z vrtom..."
                    value={form.livingSituation}
                    onChange={(e) =>
                      onFormChange("livingSituation", e.target.value)
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Aktivnost uporabnika"
                    placeholder="nizka, srednja, visoka"
                    value={form.activityLevel}
                    onChange={(e) =>
                      onFormChange("activityLevel", e.target.value)
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Izkušnje z živalmi"
                    placeholder="začetnik, srednje, visoke"
                    value={form.experienceLevel}
                    onChange={(e) =>
                      onFormChange("experienceLevel", e.target.value)
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Otroci</InputLabel>
                    <Select
                      value={form.hasChildren}
                      label="Otroci"
                      onChange={(e) =>
                        onFormChange("hasChildren", e.target.value)
                      }
                    >
                      <MenuItem value="da">Da</MenuItem>
                      <MenuItem value="ne">Ne</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Druge živali</InputLabel>
                    <Select
                      value={form.hasOtherPets}
                      label="Druge živali"
                      onChange={(e) =>
                        onFormChange("hasOtherPets", e.target.value)
                      }
                    >
                      <MenuItem value="da">Da</MenuItem>
                      <MenuItem value="ne">Ne</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Čas na voljo (ure/dan)"
                    value={form.timeAvailablePerDay}
                    onChange={(e) =>
                      onFormChange("timeAvailablePerDay", e.target.value)
                    }
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                sx={{ mt: 3 }}
                disabled={!selectedId || loading}
                onClick={handleSubmit}
              >
                {loading ? "Pošiljanje..." : "Oceni primernost"}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* RESULT */}
        {loading && (
          <Box textAlign="center" sx={{ mt: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {fitResult && (
          <Paper
            elevation={4}
            sx={{ p: 4, mt: 6, borderRadius: 3, backgroundColor: "#e3f2fd" }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              🟩 Rezultati AI analize
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Ocena:</strong> {fitResult.fitLabelSl} ({fitResult.fitScore})
            </Typography>

            <Typography sx={{ mb: 2 }}>
              <strong>Povzetek:</strong> {fitResult.summarySl}
            </Typography>

            <Typography sx={{ mb: 2 }}>
              <strong>Ujemanje vedenja:</strong> {fitResult.behaviorMatchSl}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: 600 }}>⚠️ Možna tveganja:</Typography>
            <ul>
              {fitResult.risksSl.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            <Typography sx={{ fontWeight: 600, mt: 2 }}>
              ✅ Priporočila:
            </Typography>
            <ul>
              {fitResult.recommendationsSl.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </Paper>
        )}
      </Container>
    </Box>
  );
};
