import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import PipeIcon from "@mui/icons-material/Cable";
import BarChartIcon from "@mui/icons-material/BarChart";
import HomeIcon from "@mui/icons-material/Home";
import PetsIcon from "@mui/icons-material/Pets";

interface GeneralStats {
  totalAnimals: number;
  neutered: number;
  notNeutered: number;
  avgFee: number;
  speciesCount: Record<string, number>;
}

interface ShelterOverview {
  shelterId: string;
  totalAnimals: number;
  dogs: number;
  cats: number;
  avgFee: number;
}

interface Shelter {
  id: string;
  name: string;
  city: string;
  region: string;
}

export const NamedPipesDashboard: React.FC = () => {
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [shelterStats, setShelterStats] = useState<ShelterOverview | null>(
    null
  );
  const [loading, setLoading] = useState<{
    general: boolean;
    shelter: boolean;
  }>({
    general: false,
    shelter: false,
  });
  const [error, setError] = useState<string>("");

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelterId, setSelectedShelterId] = useState("");

  React.useEffect(() => {
    fetch("http://localhost:4000/api/shelters")
      .then((res) => res.json())
      .then((data) => {
        console.log("Shelters loaded:", data);
        setShelters(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error loading shelters:", err);
        setShelters([]);
      });
  }, []);

  const fetchGeneralStats = async () => {
    setLoading({ ...loading, general: true });
    setError("");

    try {
      const response = await fetch("http://localhost:4000/api/pipe/stats");

      if (!response.ok) {
        throw new Error("Pipe server ni dosegljiv");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneralStats(data);
    } catch (err: any) {
      setError(err.message || "Napaka pri pridobivanju statistike");
      setGeneralStats(null);
    } finally {
      setLoading({ ...loading, general: false });
    }
  };

  const fetchShelterStats = async () => {
    if (!selectedShelterId) {
      setError("Prosim izberi zavetišče");
      return;
    }

    setLoading({ ...loading, shelter: true });
    setError("");

    try {
      const response = await fetch(
        `http://localhost:4000/api/pipe/shelter/${selectedShelterId}`
      );

      if (!response.ok) {
        throw new Error("Pipe server ni dosegljiv");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setShelterStats(data);
    } catch (err: any) {
      setError(err.message || "Napaka pri pridobivanju statistike zavetišča");
      setShelterStats(null);
    } finally {
      setLoading({ ...loading, shelter: false });
    }
  };

  const selectedShelter = Array.isArray(shelters)
    ? shelters.find((s) => s.id === selectedShelterId)
    : null;

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
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 5,
            borderRadius: 3,
            textAlign: "center",
            background: "linear-gradient(135deg, #6a1b9a 0%, #9c27b0 100%)",
            color: "white",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <PipeIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Named Pipes (Poimenovane Cevi)
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "1.05rem", opacity: 0.95 }}>
            Medprocesna komunikacija za pridobivanje statističnih podatkov v
            realnem času
          </Typography>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Info Card */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            backgroundColor: "#f3e5f5",
            borderLeft: "6px solid #9c27b0",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 1, color: "#6a1b9a" }}
          >
            ℹ️ O Named Pipes tehnologiji
          </Typography>
          <Typography variant="body2" sx={{ color: "#555", lineHeight: 1.7 }}>
            Named pipes omogočajo <strong>medprocesno komunikacijo</strong> med
            različnimi procesi na istem računalniku ali omrežju. V tej
            aplikaciji uporabljamo poimenovano cev{" "}
            <code>\\.\pipe\animalStatsPipe</code> za komunikacijo med Node.js
            Express strežnikom in ločenim pipe strežnikom, ki obdeluje
            statistične poizvedbe.
            <br />
            <br />
            <strong>Prednosti:</strong> Hitrost, učinkovitost, varnost lokalnih
            povezav, podpora za sinhrono in asinhrono komunikacijo.
          </Typography>
        </Paper>

        <Grid container spacing={4}>
          {/* CARD 1 - General Statistics */}
          <Grid item xs={12} lg={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <BarChartIcon sx={{ color: "#9c27b0", fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#9c27b0" }}
                >
                  Splošna Statistika Živali
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                Pridobi splošno statistiko vseh živali v sistemu preko Named
                Pipe komunikacije.
              </Typography>

              <Button
                variant="contained"
                onClick={fetchGeneralStats}
                disabled={loading.general}
                sx={{
                  mb: 3,
                  alignSelf: "flex-start",
                  backgroundColor: "#9c27b0",
                  "&:hover": { backgroundColor: "#7b1fa2" },
                }}
                startIcon={
                  loading.general ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PipeIcon />
                  )
                }
              >
                {loading.general
                  ? "Pridobivam..."
                  : "Pridobi statistiko (Pipe)"}
              </Button>

              {generalStats && (
                <Box>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card
                        sx={{
                          backgroundColor: "#e1bee7",
                          textAlign: "center",
                          p: 2,
                        }}
                      >
                        {/* <PetsIcon
                          sx={{ fontSize: 32, color: "#6a1b9a", mb: 1 }}
                        /> */}
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {generalStats.totalAnimals}
                        </Typography>
                        <Typography variant="body2">Skupaj živali</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={6}>
                      <Card
                        sx={{
                          backgroundColor: "#c5e1a5",
                          textAlign: "center",
                          p: 2,
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {generalStats.avgFee.toFixed(2)} €
                        </Typography>
                        <Typography variant="body2">Povprečna cena</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={6}>
                      <Card
                        sx={{
                          backgroundColor: "#b3e5fc",
                          textAlign: "center",
                          p: 2,
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {generalStats.neutered}
                        </Typography>
                        <Typography variant="body2">Kastrirani</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={6}>
                      <Card
                        sx={{
                          backgroundColor: "#ffccbc",
                          textAlign: "center",
                          p: 2,
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {generalStats.notNeutered}
                        </Typography>
                        <Typography variant="body2">Nekastrirani</Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Vrste živali:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {Object.entries(generalStats.speciesCount).map(
                        ([species, count]) => (
                          <Chip
                            key={species}
                            label={`${species}: ${count}`}
                            color="primary"
                            variant="outlined"
                          />
                        )
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {!generalStats && !loading.general && (
                <Typography
                  sx={{
                    color: "gray",
                    textAlign: "center",
                    py: 4,
                    fontStyle: "italic",
                  }}
                >
                  Klikni gumb za pridobitev statistike preko Named Pipe...
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* CARD 2 - Shelter Specific Statistics */}
          <Grid item xs={12} lg={6}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <HomeIcon sx={{ color: "#f57c00", fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#f57c00" }}
                >
                  Statistika po Zavetišču
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                Izberi zavetišče in pridobi podrobno statistiko preko Named Pipe
                komunikacije.
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Izberi zavetišče</InputLabel>
                <Select
                  value={selectedShelterId}
                  label="Izberi zavetišče"
                  onChange={(e) => setSelectedShelterId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Izberi...</em>
                  </MenuItem>
                  {shelters.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedShelter && (
                <Paper
                  elevation={1}
                  sx={{ p: 2, mb: 2, backgroundColor: "#fff3e0" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    📍 {selectedShelter.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {selectedShelter.city}, {selectedShelter.region}
                  </Typography>
                </Paper>
              )}

              <Button
                variant="contained"
                onClick={fetchShelterStats}
                disabled={!selectedShelterId || loading.shelter}
                sx={{
                  mb: 3,
                  alignSelf: "flex-start",
                  backgroundColor: "#f57c00",
                  "&:hover": { backgroundColor: "#e65100" },
                }}
                startIcon={
                  loading.shelter ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PipeIcon />
                  )
                }
              >
                {loading.shelter
                  ? "Pridobivam..."
                  : "Pridobi statistiko (Pipe)"}
              </Button>

              {shelterStats && (
                <Box>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Card
                        sx={{
                          backgroundColor: "#fff3e0",
                          textAlign: "center",
                          p: 2,
                        }}
                      >
                        <HomeIcon
                          sx={{ fontSize: 32, color: "#f57c00", mb: 1 }}
                        />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {shelterStats.totalAnimals}
                        </Typography>
                        <Typography variant="body2">
                          Skupaj živali v tem zavetišču
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={4}>
                      <Card
                        sx={{
                          backgroundColor: "#e1f5fe",
                          textAlign: "center",
                          p: 1.5,
                        }}
                      >
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {shelterStats.dogs}
                        </Typography>
                        <Typography variant="body2">Psi</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={4}>
                      <Card
                        sx={{
                          backgroundColor: "#f3e5f5",
                          textAlign: "center",
                          p: 1.5,
                        }}
                      >
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {shelterStats.cats}
                        </Typography>
                        <Typography variant="body2">Mačke</Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={4}>
                      <Card
                        sx={{
                          backgroundColor: "#fff9c4",
                          textAlign: "center",
                          p: 1.5,
                        }}
                      >
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {shelterStats.avgFee.toFixed(2)} €
                        </Typography>
                        <Typography variant="body2">Avg. cena</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {!shelterStats && !loading.shelter && (
                <Typography
                  sx={{
                    color: "gray",
                    textAlign: "center",
                    py: 4,
                    fontStyle: "italic",
                  }}
                >
                  Izberi zavetišče in klikni gumb za pridobitev statistike...
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Technical Details */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mt: 4,
            borderRadius: 3,
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            🔧 Tehnične Podrobnosti
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Pipe Server (pipeServer.js)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", fontSize: "0.9rem" }}
                >
                  • Uporablja Node.js <code>net</code> modul
                  <br />• Posluša na: <code>\\.\pipe\animalStatsPipe</code>
                  <br />• Obdeluje ukaze: <code>getStats</code>,{" "}
                  <code>shelterOverview</code>
                  <br />• Zaganja se ločeno: <code>node pipeServer.js</code>
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, height: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Pipe Client (pipeClient.js)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", fontSize: "0.9rem" }}
                >
                  • Vzpostavi povezavo na Named Pipe
                  <br />
                  • Pošlje JSON zahtevo z ukazom
                  <br />
                  • Prejme in parsira JSON odgovor
                  <br />• Integriran v Express API: <code>/api/pipe/*</code>
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};
