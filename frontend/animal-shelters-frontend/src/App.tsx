import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { FilterAnimals } from "./components/FilterAnimals";
import { LivestockDashboard } from "./components/LivestockDashboard";
import { GrpcAnimalsLive } from "./components/GrpcAnimalsLive";
import { AnimalFitEvaluator } from "./components/AnimalFitEvaluator";

import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import AgricultureIcon from "@mui/icons-material/Agriculture";

const Home: React.FC = () => {
  return (
    <Box
      sx={{
        position: "relative",
        backgroundImage: "url('/assets/img/dog-wp.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        color: "white",
        width: "100vw",
      }}
    >
      {/* Overlay for readability */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(0,0,0,0.45)",
          zIndex: 1,
        }}
      />

      {/* MAIN CONTENT */}
      <Container sx={{ position: "relative", zIndex: 2, textAlign: "center", mt: 20 }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: "bold",
            textShadow: "2px 2px 8px rgba(0,0,0,0.6)",
            mb: 2,
          }}
        >
          Slovenska zavetišča in živina
        </Typography>

        <Typography
          variant="h6"
          sx={{
            mb: 8,
            maxWidth: "1000px",
            mx: "auto",
            textShadow: "1px 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          Odkrijte podatke o živalih v slovenskih zavetiščih in analizirajte
          statistiko živine po občinah.
        </Typography>

        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          {/* Zavetišča card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 3,
                boxShadow: 4,
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardMedia
                component="img"
                height="220"
                image="/assets/img/dog.jpg"
                alt="Zavetišča"
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  🐕 Pregled zavetišč
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Filtriraj in išči živali v slovenskih zavetiščih glede na
                  vrsto, spol, regijo in ceno posvojitve.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/animals"
                  startIcon={<PetsIcon />}
                  sx={{ px: 3, py: 1 }}
                >
                  Odpri zavetišča
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Živina card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 3,
                boxShadow: 4,
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardMedia
                component="img"
                height="220"
                image="/assets/img/livestock.jpg"
                alt="Živina"
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  🐄 Statistika živine
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Vizualiziraj podatke o številu živine po občinah in letih ter
                  jih primerjaj z drugimi regijami s pomočjo interaktivnih
                  grafov.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/livestock"
                  startIcon={<AgricultureIcon />}
                  sx={{ px: 3, py: 1 }}
                >
                  Odpri živino
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* gRPC card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 3,
                boxShadow: 4,
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardMedia
                component="img"
                height="220"
                image="/assets/img/cat.jpg"
                alt="Živina"
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  🐈 gRPC podatkovna povezava
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Pridobi podatke o živalih prek gRPC protokola 
                  in preveri posodobljene živali v realnem času.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/grpc-live"
                  startIcon={<PetsIcon />}
                  sx={{ px: 3, py: 1 }}
                >
                  Odpri povezavo
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Animal fit card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 3,
                boxShadow: 4,
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 8,
                },
              }}
            >
              <CardMedia
                component="img"
                height="220"
                image="/assets/img/cat.jpg"
                alt="Živina"
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  🐈 gRPC podatkovna povezava
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Preveri povezanost tebe in živali.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/animal-fit"
                  startIcon={<PetsIcon />}
                  sx={{ px: 3, py: 1 }}
                >
                  Odpri povezavo
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* FEATURES SECTION */}
        <Box sx={{ py: 8, mt: 15 }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 6 }}
          >
            Kaj omogoča platforma?
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {[
              {
                title: "Iskanje po zavetiščih",
                desc: "Preiščite vse slovenske zavetišča in poiščite ljubljenčke po meri.",
                icon: "🐶",
              },
              {
                title: "Analiza živine",
                desc: "Interaktivni grafi prikazujejo trende živinoreje po občinah in letih.",
                icon: "📊",
              },
              {
                title: "Povezani podatki",
                desc: "Uporaba javnih odprtih podatkov OPSI in drugih virov za transparentnost.",
                icon: "🔗",
              },
            ].map((f) => (
              <Grid item xs={12} md={4} key={f.title}>
                <Card
                  sx={{
                    textAlign: "center",
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    boxShadow: 3,
                    transition: "0.3s",
                    "&:hover": { boxShadow: 6, transform: "translateY(-4px)" },
                  }}
                >
                  <Typography variant="h3" gutterBottom>
                    {f.icon}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.desc}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
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
        <Route path="/grpc-live" element={<GrpcAnimalsLive />} />
        <Route path="/animal-fit" element={<AnimalFitEvaluator />} />
      </Routes>
    </Router>
  );
}
