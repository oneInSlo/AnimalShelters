import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { FilterAnimals } from "./components/FilterAnimals";
import { LivestockDashboard } from "./components/LivestockDashboard";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import AgricultureIcon from "@mui/icons-material/Agriculture";

const Home: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundImage: "url('/animals-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "90vh",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        backgroundColor: "#f8f9fa",
        py: 6,
      }}
    >
      <Container>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          Dobrodošli v platformi za zavetišča in živinorejo
        </Typography>
        <Typography
          variant="h6"
          align="center"
          sx={{ mb: 6, textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}
        >
          Odkrijte podatke o živalih v slovenskih zavetiščih in analizirajte
          statistiko živine po občinah.
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: 3,
                textAlign: "center",
                transition: "0.3s",
                "&:hover": { transform: "scale(1.03)" },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image="/animals-bg.jpg"
                alt="Zavetišča"
              />
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  🐕 Pregled zavetišč
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtriraj in išči živali v slovenskih zavetiščih glede na
                  vrsto, spol, regijo in ceno posvojitve.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/animals"
                  startIcon={<PetsIcon />}
                  sx={{ mt: 2 }}
                >
                  Odpri zavetišča
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card
              sx={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: 3,
                textAlign: "center",
                transition: "0.3s",
                "&:hover": { transform: "scale(1.03)" },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image="/livestock-bg.jpg"
                alt="Živina"
              />
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  🐄 Statistika živine
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vizualiziraj podatke o številu živine po občinah in letih.
                  Uporabi grafične prikaze za analizo.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/livestock"
                  startIcon={<AgricultureIcon />}
                  sx={{ mt: 2 }}
                >
                  Odpri živino
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/animals" element={<FilterAnimals />} />
        <Route path="/livestock" element={<LivestockDashboard />} />
      </Routes>
    </Router>
  );
}
