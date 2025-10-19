import { useEffect, useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Paper,
  Grid,
  Box,
  TableContainer,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
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
  shelter: { name: string; city: string; region: string };
}

export default function App() {
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

  const fetchAnimals = async () => {
    setLoading(true);
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v)
    );
    const res = await fetch(`http://localhost:4000/api/animals?${params}`);
    const data = await res.json();
    setAnimals(data);
    setLoading(false);

    // populate dropdowns
    const speciesSet = new Set<string>();
    const citySet = new Set<string>();
    const regionSet = new Set<string>();
    data.forEach((a: Animal) => {
      if (a.species) speciesSet.add(a.species);
      if (a.shelter?.city) citySet.add(a.shelter.city);
      if (a.shelter?.region) regionSet.add(a.shelter.region);
    });
    setOptions({
      species: Array.from(speciesSet).sort(),
      city: Array.from(citySet).sort(),
      region: Array.from(regionSet).sort(),
    });
  };

  useEffect(() => {
    fetchAnimals();
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
      const res = await fetch("http://localhost:4000/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      alert(
        `Successfully exported! See map 'output' in ./backend.`
      );
    } catch (err) {
      console.error("Export failed:", err);
      alert("Error exporting data. Check your console.");
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
        width: "100vw",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(90deg, #1565c0 0%, #42a5f5 100%)",
        }}
      >
        <Toolbar sx={{ mx: "auto", width: "95%" }}>
          <PetsIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Slovenska zavetišča — Filtriranje živali
          </Typography>
          <Tooltip title="Ponastavi filtre in ponovno naloži">
            <IconButton
              color="inherit"
              onClick={() => {
                clearFilters();
                fetchAnimals();
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main full-width content */}
      <Box
        sx={{
          px: { xs: 2, sm: 4, md: 8 },
          py: 4,
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        {/* Filter Panel */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            backgroundColor: "#ffffff",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
            🔍 Filtriraj po lastnostih
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vrsta</InputLabel>
                <Select
                  label="Vrsta"
                  value={filters.species}
                  onChange={(e) =>
                    setFilters({ ...filters, species: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFilters({ ...filters, city: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFilters({ ...filters, region: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFilters({ ...filters, neutered: e.target.value })
                  }
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
                inputProps={{ min: 0, max: 1000 }}
                value={filters.maxFee}
                onChange={(e) =>
                  setFilters({ ...filters, maxFee: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} mt={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={fetchAnimals}
                >
                  Filtriraj
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    clearFilters();
                    fetchAnimals();
                  }}
                >
                  Počisti
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    saveFiltering();
                  }}
                >
                  Izvozi podatke
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Results */}
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
          >
            Rezultati ({animals.length})
          </Typography>

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          ) : animals.length === 0 ? (
            <Typography sx={{ color: "gray", textAlign: "center", py: 4 }}>
              Ni rezultatov za prikaz.
            </Typography>
          ) : (
            <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#e3f2fd" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ime</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Vrsta</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Pasma</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Spol</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Starost (m)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Cena (€)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Kastriran/Steriliziran
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Zavetišče</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mesto</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Regija</TableCell>
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
                      <TableCell>{a.adoptionFee}</TableCell>
                      <TableCell>{a.neutered ? "✅" : "❌"}</TableCell>
                      <TableCell>{a.shelter?.name}</TableCell>
                      <TableCell>{a.shelter?.city}</TableCell>
                      <TableCell>{a.shelter?.region}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
