import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
  TableContainer,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Container,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import StreamIcon from "@mui/icons-material/Stream";
import HomeIcon from "@mui/icons-material/Home";
import PetsIcon from "@mui/icons-material/Pets";

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  ageMonths: number;
  adoptionFee: number;
  neutered: boolean;
  shelterId: string;
}

interface Shelter {
  id: string;
  name: string;
  city: string;
  region: string;
}

export const GrpcAnimalsLive: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [streamAnimals, setStreamAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [shelterAnimals, setShelterAnimals] = useState<Animal[]>([]);
  const [selectedShelter, setSelectedShelter] = useState("");
  const [loadingShelterAnimals, setLoadingShelterAnimals] = useState(false);

  // Load shelters automatically
  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:4000/api/grpc/shelters");
      const data = await res.json();
      setShelters(data);
    })();
  }, []);

  const fetchGrpcAnimals = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:4000/api/grpc/animals");
    const data = await res.json();
    setAnimals(data);
    setLoading(false);
  };

  const fetchAnimalsByShelter = async () => {
    if (!selectedShelter) return;

    setLoadingShelterAnimals(true);
    const res = await fetch(
      `http://localhost:4000/api/grpc/shelters/${selectedShelter}/animals`
    );
    const data = await res.json();
    setShelterAnimals(data);
    setLoadingShelterAnimals(false);
  };

  const startStream = () => {
    setStreaming(true);
    const source = new EventSource(
      "http://localhost:4000/api/grpc/animals/live"
    );

    source.onmessage = (event) => {
      const animal: Animal = JSON.parse(event.data);
      setStreamAnimals((prev) => [animal, ...prev].slice(0, 20));
    };

    source.onerror = () => {
      console.warn("SSE povezava prekinjena.");
      source.close();
      setStreaming(false);
    };
  };

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
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 2 }}>
            <StorageIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              gRPC Podatkovna Povezava
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "1.05rem", opacity: 0.95 }}>
            Pridobivanje in pretakanje podatkov o živalih prek gRPC protokola
          </Typography>
        </Paper>

        <Grid container spacing={4}>
          {/* CARD 1 – All Animals */}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <PetsIcon sx={{ color: "#1976d2", fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1976d2" }}>
                  Vse živali (RPC klic)
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                Pridobi celoten seznam živali, prebran prek gRPC povezave.
              </Typography>

              <Button
                variant="contained"
                onClick={fetchGrpcAnimals}
                disabled={loading}
                sx={{ mb: 3, alignSelf: "flex-start" }}
              >
                {loading ? "Nalaganje..." : "Pridobi živali preko gRPC"}
              </Button>

              {loading && (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && animals.length > 0 && (
                <>
                  <Chip
                    label={`Skupaj: ${animals.length} živali`}
                    color="primary"
                    sx={{ mb: 2, alignSelf: "flex-start" }}
                  />
                  <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: "#e3f2fd" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Ime</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Vrsta</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Pasma</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Spol</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Starost (m)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {animals.map((a) => (
                          <TableRow
                            key={a.id}
                            hover
                            sx={{
                              "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                            }}
                          >
                            <TableCell>{a.id}</TableCell>
                            <TableCell>{a.name}</TableCell>
                            <TableCell>{a.species}</TableCell>
                            <TableCell>{a.breed}</TableCell>
                            <TableCell>{a.sex}</TableCell>
                            <TableCell>{a.ageMonths}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          </Grid>

          {/* CARD 2 – Shelters */}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <HomeIcon sx={{ color: "#388e3c", fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#388e3c" }}>
                  Seznam zavetišč (RPC klic)
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                Samodejno pridobljeno s pomočjo gRPC.
              </Typography>

              {shelters.length > 0 && (
                <>
                  <Chip
                    label={`Skupaj: ${shelters.length} zavetišč`}
                    color="success"
                    sx={{ mb: 2, alignSelf: "flex-start" }}
                  />
                  <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: "#e8f5e9" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Ime</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Mesto</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Regija</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shelters.map((s) => (
                          <TableRow
                            key={s.id}
                            hover
                            sx={{
                              "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                            }}
                          >
                            <TableCell>{s.id}</TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.city}</TableCell>
                            <TableCell>{s.region}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          </Grid>

          {/* CARD 3 – Animals by Shelter */}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <HomeIcon sx={{ color: "#f57c00", fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#f57c00" }}>
                  Živali po zavetišču
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                Izberi zavetišče iz seznama in pridobi njegove živali.
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Izberi zavetišče</InputLabel>
                <Select
                  value={selectedShelter}
                  label="Izberi zavetišče"
                  onChange={(e) => setSelectedShelter(e.target.value)}
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

              <Button
                variant="contained"
                onClick={fetchAnimalsByShelter}
                disabled={!selectedShelter || loadingShelterAnimals}
                sx={{ mb: 3, alignSelf: "flex-start" }}
              >
                {loadingShelterAnimals ? "Nalaganje..." : "Pridobi živali"}
              </Button>

              {loadingShelterAnimals && (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              )}

              {!loadingShelterAnimals && shelterAnimals.length > 0 && (
                <>
                  <Chip
                    label={`Skupaj: ${shelterAnimals.length} živali`}
                    sx={{ mb: 2, alignSelf: "flex-start", backgroundColor: "#fff3e0" }}
                  />
                  <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: "#fff3e0" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Ime</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Vrsta</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Pasma</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shelterAnimals.map((a) => (
                          <TableRow
                            key={a.id}
                            hover
                            sx={{
                              "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                            }}
                          >
                            <TableCell>{a.id}</TableCell>
                            <TableCell>{a.name}</TableCell>
                            <TableCell>{a.species}</TableCell>
                            <TableCell>{a.breed}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {!loadingShelterAnimals && selectedShelter && shelterAnimals.length === 0 && (
                <Typography sx={{ color: "gray", textAlign: "center", py: 4 }}>
                  Ni živali v tem zavetišču.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* CARD 4 – Streaming */}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <StreamIcon sx={{ color: "#d32f2f", fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#d32f2f" }}>
                  Pretakanje v realnem času
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                Spremljanje živali v živo, ki prihajajo v zavetišče.
              </Typography>

              <Button
                variant="contained"
                color="error"
                onClick={startStream}
                disabled={streaming}
                sx={{ mb: 3, alignSelf: "flex-start" }}
              >
                {streaming ? "🔴 Pretakanje aktivno" : "Začni s pretakanjem"}
              </Button>

              {streamAnimals.length > 0 && (
                <>
                  <Chip
                    label={`Prejeto: ${streamAnimals.length} posodobitev`}
                    color="error"
                    sx={{ mb: 2, alignSelf: "flex-start" }}
                  />
                  <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: "#ffebee" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Ime</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Vrsta</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Pasma</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Spol</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {streamAnimals.map((a, i) => (
                          <TableRow
                            key={i}
                            hover
                            sx={{
                              "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                            }}
                          >
                            <TableCell>{a.id}</TableCell>
                            <TableCell>{a.name}</TableCell>
                            <TableCell>{a.species}</TableCell>
                            <TableCell>{a.breed}</TableCell>
                            <TableCell>{a.sex}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {streamAnimals.length === 0 && !streaming && (
                <Typography sx={{ color: "gray", textAlign: "center", py: 4 }}>
                  Še ni prejetih podatkov. Klikni gumb za začetek pretakanja.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};