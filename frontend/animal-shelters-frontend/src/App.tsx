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
  Stack,
  Chip,
  Paper,
  alpha,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MapIcon from "@mui/icons-material/Map";
import PetsIcon from "@mui/icons-material/Pets";
import FilterListIcon from "@mui/icons-material/FilterList";
import PsychologyIcon from "@mui/icons-material/Psychology";
import BarChartIcon from "@mui/icons-material/BarChart";
import CodeIcon from "@mui/icons-material/Code";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { NamedPipesDashboard } from "./components/NamedPipesDashboard";
import SheltersOverview from "./components/SheltersOverview";
import LiveAnimals from "./components/LiveAnimals";
import LiveAnimalDetail from "./components/LiveAnimalDetail";
import { LocationOnOutlined } from "@mui/icons-material";

const featureCards = [
  {
    title: "Zavetišča na zemljevidu",
    desc: "Interaktivna karta z OpenStreetMap in filtriranjem po zavetišču",
    to: "/overview",
    img: "/assets/img/dog.jpg",
    icon: MapIcon,
    color: "#1976d2",
  },
  {
    title: "Aktualne živali",
    desc: "Sveži podatki iz spletnega vira z možnostjo osvežitve",
    to: "/live-animals",
    img: "/assets/img/cat.jpg",
    icon: PetsIcon,
    color: "#2e7d32",
  },
  {
    title: "Filtriranje živali",
    desc: "Napredni filtri za iskanje popolnega spremljevalca",
    to: "/animals",
    img: "/assets/img/dog-2.jpg",
    icon: FilterListIcon,
    color: "#ed6c02",
  },
  {
    title: "AI pomoč pri izbiri",
    desc: "Gemini LLM oceni primernost živali glede na vaše potrebe",
    to: "/animal-fit",
    img: "/assets/img/cat-2.jpg",
    icon: PsychologyIcon,
    color: "#9c27b0",
  },
  {
    title: "Statistika",
    desc: "Vizualizacije PC-Axis podatkov za širši kontekst",
    to: "/livestock",
    img: "/assets/img/livestock.jpg",
    icon: BarChartIcon,
    color: "#d32f2f",
  },
  {
    title: "Tehnološki demo",
    desc: "gRPC in Named Pipes integracije v živo",
    to: "/grpc-live",
    img: "/assets/img/bunny.jpg",
    icon: CodeIcon,
    color: "#0288d1",
  },
];

const technologies = [
  "OpenStreetMap",
  "Web Scraping",
  "PC-Axis",
  "Gemini AI",
  "gRPC",
  "Named Pipes",
];

const Home: React.FC = () => {
  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
      {/* HERO SECTION */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "80vh", md: "96vh" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Background Image */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/assets/img/dog-wp.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.5)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(155deg, ${alpha(
              "#9c27b0", 
              0.3
            )} 0%, ${alpha("#f7c4bfff", 0.3)} 70%)`,
          }}
        />

        <Container
          maxWidth="lg"
          sx={{ position: "relative", zIndex: 1, py: 8 }}
        >
          <Box sx={{ textAlign: "center" }}>
            {/* Badge */}
            <Chip
              label="Slovenska zavetišča"
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 600,
                mb: 3,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            />

            <Typography
              variant="h1"
              sx={{
                color: "white",
                fontWeight: 800,
                fontSize: { xs: "3.5rem", sm: "4.5rem", md: "5.5rem" },
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                mb: 3,
                textShadow: "0 5px 20px rgba(0,0,0,0.3)",
              }}
            >
              Najdi svojega
              <br />
              novega najboljšega prijatelja!
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "rgba(255,255,255,0.95)",
                fontWeight: 400,
                maxWidth: 700,
                mx: "auto",
                mb: 4,
                lineHeight: 1.6,
                fontSize: { xs: "1rem", md: "1.25rem" },
              }}
            >
              Interaktivna platforma za pregled zavetišč, dogodkov in živali z
              AI pomočjo, statistiko in real-time podatki
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Button
                component={Link}
                to="/overview"
                variant="contained"
                size="large"
                endIcon={<LocationOnOutlined />}
                sx={{
                  bgcolor: "white",
                  color: "#9c27b0",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Začni z zemljevidom
              </Button>

              <Button
                component={Link}
                to="/live-animals"
                variant="outlined"
                size="large"
                endIcon={<PetsIcon />}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.5)",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Aktualne živali
              </Button>
            </Stack>

            {/* Tech Stack */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              {technologies.map((tech) => (
                <Chip
                  key={tech}
                  label={tech}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    fontWeight: 500,
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* FEATURES SECTION */}
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 6, md: 10 },
        }}
      >
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: "black",
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: "2rem", md: "2.5rem" },
            }}
          >
            Vse funkcionalnosti na enem mestu
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "text.secondary", maxWidth: 700, mx: "auto" }}
          >
            Raziskuj zavetišča, filtriraj živali, pridobi AI priporočila in več
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {featureCards.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Grid item key={feature.to} xs={12} sm={6} md={4}>
                <Card
                  component={Link}
                  to={feature.to}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    textDecoration: "none",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 6,
                      borderColor: feature.color,
                      "& .feature-icon": {
                        transform: "scale(1.1) rotate(5deg)",
                      },
                      "& .feature-image": {
                        transform: "scale(1.05)",
                      },
                    },
                  }}
                >
                  <Box sx={{ position: "relative", overflow: "hidden" }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={feature.img}
                      alt={feature.title}
                      className="feature-image"
                      sx={{ transition: "transform 0.3s ease" }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        bgcolor: "white",
                        borderRadius: 2,
                        p: 1,
                        boxShadow: 2,
                      }}
                    >
                      <IconComponent
                        className="feature-icon"
                        sx={{
                          color: feature.color,
                          fontSize: 28,
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.6 }}
                    >
                      {feature.desc}
                    </Typography>

                    <Button
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        mt: 2,
                        fontWeight: 700,
                        color: feature.color,
                        p: 0,
                        minWidth: 0,
                        "&:hover": {
                          bgcolor: "transparent",
                          "& .MuiSvgIcon-root": {
                            transform: "translateX(4px)",
                          },
                        },
                        "& .MuiSvgIcon-root": {
                          transition: "transform 0.2s ease",
                        },
                      }}
                    >
                      Odpri
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* HOW IT WORKS */}
      <Box sx={{ bgcolor: "white", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "2rem", md: "2.5rem" },
                color: "black"
              }}
            >
              Kako deluje
            </Typography>
            <Typography variant="h6" sx={{ color: "text.secondary" }}>
              Tri preproste korake do tvojega novega prijatelja
            </Typography>
          </Box>

          <Grid container spacing={4} marginBlockEnd={8}>
            {[
              {
                step: "01",
                title: "Izberi zavetišče",
                desc: "Na interaktivnem zemljevidu izberi zavetišče in filtriraj dogodke ter živali po lokaciji",
                color: "#1976d2",
              },
              {
                step: "02",
                title: "Preveri živali",
                desc: "Osveži podatke in preglej aktualne živali z detajlnimi informacijami in fotografijami",
                color: "#2e7d32",
              },
              {
                step: "03",
                title: "Uporabi AI",
                desc: "Vnesi svoje preference in pridobi personalizirano AI priporočilo za najboljše ujemanje",
                color: "#9c27b0",
              },
            ].map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: "100%",
                    borderRadius: 3,
                    border: "2px solid",
                    borderColor: "divider",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: item.color,
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      color: item.color,
                      mb: 2,
                      opacity: 0.3,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                    {item.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* DATA SOURCES & CTA */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={4} alignItems="stretch" marginBlockEnd={8}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                Podatkovni viri in tehnologije
              </Typography>

              <Stack spacing={2}>
                {[
                  {
                    title: "OpenStreetMap Nominatim",
                    desc: "Geokodiranje lokacij zavetišč",
                  },
                  {
                    title: "Web Scraping",
                    desc: "Real-time podatki o živalih",
                  },
                  {
                    title: "PC-Axis (SURS)",
                    desc: "Statistični podatki in vizualizacije",
                  },
                  {
                    title: "Google Gemini AI",
                    desc: "Pametna priporočila in ocenjevanje",
                  },
                  {
                    title: "gRPC & Named Pipes",
                    desc: "Napredne integracijske tehnologije",
                  },
                ].map((source, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    <CheckCircleOutlineIcon
                      sx={{ color: "success.main", mt: 0.5 }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {source.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {source.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: "100%",
                borderRadius: 3,
                bgcolor: "#9c27b0",
                color: "white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  Pripravljeni začeti?
                </Typography>
                <Typography sx={{ mb: 4, opacity: 0.9, lineHeight: 1.7 }}>
                  Odkrijte interaktivni zemljevid zavetišč ali si oglejte
                  aktualne živali, ki iščejo nov dom.
                </Typography>

                <Stack spacing={2}>
                  <Button
                    component={Link}
                    to="/overview"
                    variant="contained"
                    size="large"
                    fullWidth
                    endIcon={<LocationOnOutlined />}
                    sx={{
                      bgcolor: "white",
                      color: "#9c27b0",
                      fontWeight: 700,
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.9)",
                      },
                    }}
                  >
                    Zemljevid zavetišč
                  </Button>

                  <Button
                    component={Link}
                    to="/live-animals"
                    variant="outlined"
                    size="large"
                    fullWidth
                    endIcon={<PetsIcon />}
                    sx={{
                      borderColor: "rgba(255,255,255,0.5)",
                      color: "white",
                      fontWeight: 700,
                      py: 1.5,
                      "&:hover": {
                        borderColor: "white",
                        bgcolor: "rgba(255,255,255,0.1)",
                      },
                    }}
                  >
                    Aktualne živali
                  </Button>
                </Stack>
              </Box>

              <Typography
                variant="caption"
                sx={{ mt: 4, opacity: 0.7, display: "block" }}
              >
                Projekt: Tehnologije integracije in digitalizacije storitev
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* FOOTER */}
      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "white",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              © {new Date().getFullYear()} Slovenska zavetišča · Študijski
              projekt
            </Typography>
            <Stack direction="row" spacing={2}>
              {["Zemljevid", "Živali", "AI pomoč"].map((link) => (
                <Typography
                  key={link}
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    cursor: "pointer",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
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
        <Route path="/named-pipes" element={<NamedPipesDashboard />} />
        <Route path="/overview" element={<SheltersOverview />} />
        <Route path="/live-animals" element={<LiveAnimals />} />
        <Route path="/live-animals/:slug" element={<LiveAnimalDetail />} />
      </Routes>
    </Router>
  );
}
