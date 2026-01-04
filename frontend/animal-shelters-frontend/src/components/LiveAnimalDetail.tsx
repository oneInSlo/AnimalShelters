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
  Dialog,
  Divider,
  IconButton,
  Stack,
  Typography,
  Grid,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import PetsIcon from "@mui/icons-material/Pets";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import StraightenIcon from "@mui/icons-material/Straighten";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ScaleIcon from "@mui/icons-material/Scale";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import PlaceIcon from "@mui/icons-material/Place";

import { useNavigate, useParams } from "react-router-dom";
import { QuestionMark } from "@mui/icons-material";

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
    lastUpdated: string | null;
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

function parseHorjulDate(dateStr?: string) {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function formatSlDate(dateStr?: string) {
  const d = parseHorjulDate(dateStr);
  if (!d) return "—";
  return new Intl.DateTimeFormat("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function sexIcon(sex?: string) {
  const s = (sex || "").toLowerCase();
  if (s.includes("ž") || s.includes("zens") || s.includes("female"))
    return <FemaleIcon sx={{ fontSize: 34 }} />;
  if (s.includes("m") || s.includes("mos") || s.includes("male"))
    return <MaleIcon sx={{ fontSize: 34 }} />;
  return <PetsIcon sx={{ fontSize: 34 }} />;
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        height: "100%",
        bgcolor: "rgba(255,255,255,0.95)",
        boxShadow: 3,
        transition: "transform .18s ease, box-shadow .18s ease",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 8 },
      }}
    >
      <CardContent sx={{ p: 3, textAlign: "center" }}>
        <Box
          sx={{
            width: 78,
            height: 78,
            mx: "auto",
            borderRadius: "50%",
            bgcolor: "#9c27b0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            mb: 2,
          }}
        >
          {icon}
        </Box>

        <Typography
          sx={{
            letterSpacing: 3,
            fontSize: 12,
            color: "text.secondary",
            mb: 1,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>

        <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function LiveAnimalDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [resp, setResp] = useState<HorjulResponse | null>(null);

  // carousel + fullscreen
  const [imgIndex, setImgIndex] = useState(0);
  const [fullOpen, setFullOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/horjul`)
      .then((r) => r.json())
      .then((json) => setResp(json));
  }, []);

  const animal = useMemo(() => {
    if (!resp || !slug) return null;
    return resp.data.find((a) => getSlugFromLink(a.link) === slug) || null;
  }, [resp, slug]);

  const images = useMemo(() => {
    if (!animal) return [];
    const all = [animal.image, ...(animal.galleryImgs || [])].filter(
      Boolean
    ) as string[];
    return Array.from(new Set(all));
  }, [animal]);

  useEffect(() => {
    setImgIndex(0);
  }, [slug]);

  const currentImg = images[imgIndex] || "";

  const canPrev = imgIndex > 0;
  const canNext = imgIndex < images.length - 1;
  const goPrev = () => setImgIndex((i) => Math.max(0, i - 1));
  const goNext = () => setImgIndex((i) => Math.min(images.length - 1, i + 1));

  if (!resp) {
    return (
      <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
        <Container maxWidth={false} sx={{ py: 4 }}>
          <Typography>Nalaganje…</Typography>
        </Container>
      </Box>
    );
  }

  if (!animal) {
    return (
      <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
        <Container maxWidth={false} sx={{ py: 4 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Žival ni bila najdena.
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/live-animals")}
          >
            Nazaj
          </Button>
        </Container>
      </Box>
    );
  }

  const accepted = formatSlDate(animal.dateOfAcceptance);

  // theme accent (matches your navbar/purple vibe)
  const primary = "#9c27b0";

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 260, md: 320 },
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "#ba68c8",
          }}
        />

        <Container
          maxWidth="xl"
          sx={{ position: "relative", zIndex: 1, py: 4 }}
        >
          <Stack
            direction="row"
            spacing={1}
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/live-animals")}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.5)",
                fontWeight: 800,
              }}
            >
              Nazaj
            </Button>

            <Button
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(animal.link, "_blank")}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.5)",
                fontWeight: 800,
              }}
            >
              Odpri original
            </Button>
          </Stack>

          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontWeight: 900,
                textShadow: "0 6px 22px rgba(0,0,0,0.35)",
              }}
            >
              {animal.name}
            </Typography>

            <Typography
              sx={{ color: "rgba(255,255,255,0.92)", mt: 1, maxWidth: 900 }}
            >
              Sprejet/a: <b>{accepted}</b>
              {animal.daysInShelter ? ` • ${animal.daysInShelter}` : ""}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
              {animal.sex && (
                <Chip
                  label={animal.sex}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
                />
              )}
              {animal.size && (
                <Chip
                  label={animal.size}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
                />
              )}
              {animal.temperament && (
                <Chip
                  label={animal.temperament}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
                />
              )}
              {animal.status && (
                <Chip
                  label={animal.status}
                  sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
                />
              )}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* CONTENT */}
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Grid container spacing={2} alignItems="stretch">
          {/* Image carousel card */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.95)",
                boxShadow: 4,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 320, md: 520 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: currentImg ? "zoom-in" : "default",
                }}
                onClick={() => currentImg && setFullOpen(true)}
                title={currentImg ? "Klikni za celozaslonski prikaz" : ""}
              >
                {currentImg ? (
                  <Box sx={{ width: "100%", cursor: "zoom-in" }}>
                    <Box
                      component="img"
                      src={currentImg}
                      alt={animal.name}
                      sx={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                ) : (
                  <Stack
                    alignItems="center"
                    spacing={1}
                    sx={{ color: "text.secondary" }}
                  >
                    <PetsIcon />
                    <Typography>Ni slike</Typography>
                  </Stack>
                )}

                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      disabled={!canPrev}
                      sx={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "rgba(255,255,255,0.85)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>

                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      disabled={!canNext}
                      sx={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        bgcolor: "rgba(255,255,255,0.85)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>

                    <Chip
                      label={`${imgIndex + 1} / ${images.length}`}
                      sx={{
                        position: "absolute",
                        bottom: 14,
                        left: "50%",
                        transform: "translateX(-50%)",
                        bgcolor: "rgba(255,255,255,0.9)",
                        fontWeight: 800,
                      }}
                    />
                  </>
                )}
              </Box>

              {images.length > 1 && (
                <Box
                  sx={{
                    p: 1.5,
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    borderTop: "1px solid #eee",
                    bgcolor: "#fff",
                  }}
                >
                  {images.map((img, idx) => (
                    <Box
                      key={img}
                      component="img"
                      src={img}
                      alt={`${animal.name} ${idx + 1}`}
                      onClick={() => setImgIndex(idx)}
                      sx={{
                        height: 74,
                        width: 120,
                        objectFit: "cover",
                        borderRadius: 2,
                        cursor: "pointer",
                        border:
                          idx === imgIndex
                            ? "2px solid #F6A43B"
                            : "1px solid #ddd",
                      }}
                    />
                  ))}
                </Box>
              )}
            </Card>
          </Grid>

          {/* Details card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.95)",
                boxShadow: 4,
                height: "100%",
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 5 } }}>
                <Stack spacing={3}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      Podrobnosti
                    </Typography>
                  </Stack>

                  <Divider />

                  {animal.foundLocation && (
                    <Typography sx={{ fontSize: 18, textAlign: "left" }}>
                      <PlaceIcon sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      <b>Najden/a:</b>{" "}
                      <Chip
                        label={animal.foundLocation}
                        sx={{ bgcolor: primary, color: "white" }}
                      />
                    </Typography>
                  )}

                  {animal.status && (
                    <Typography
                      sx={{ fontSize: 18, textAlign: "left", lineHeight: 1.6 }}
                    >
                      <QuestionMark sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      <b>Status:</b>{" "}
                      <Chip
                        label={animal.status}
                        sx={{ bgcolor: primary, color: "white" }}
                      />
                    </Typography>
                  )}

                  <Divider />

                  {animal.description && (
                    <Typography
                      sx={{
                        fontSize: 18,
                        textAlign: "left",
                        lineHeight: 1.7,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {animal.description}
                    </Typography>
                  )}

                  {!animal.foundLocation &&
                    !animal.status &&
                    !animal.description && (
                      <Typography
                        sx={{ color: "text.secondary", textAlign: "left" }}
                      >
                        Ni dodatnih informacij.
                      </Typography>
                    )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* BASIC INFO */}
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              textAlign: "center",
              mb: 0.5,
              color: "black",
            }}
          >
            Osnovne informacije
          </Typography>
          <Typography
            sx={{ color: "text.secondary", textAlign: "center", mb: 3 }}
          >
            Hiter pregled ključnih podatkov o živali.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <InfoTile
                icon={<PetsIcon sx={{ fontSize: 34 }} />}
                label="Temperament"
                value={animal.temperament || "—"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoTile
                icon={sexIcon(animal.sex)}
                label="Spol"
                value={animal.sex || "—"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoTile
                icon={<StraightenIcon sx={{ fontSize: 34 }} />}
                label="Velikost"
                value={animal.size || "—"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoTile
                icon={<AccessTimeIcon sx={{ fontSize: 34 }} />}
                label="Starost ob sprejemu"
                value={animal.ageAtIntake || "—"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoTile
                icon={<ScaleIcon sx={{ fontSize: 34 }} />}
                label="Teža ob sprejemu"
                value={animal.weightAtIntake || "—"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InfoTile
                icon={<MedicalServicesIcon sx={{ fontSize: 34 }} />}
                label="Veterinarska oskrba"
                value={animal.vetCare || "—"}
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Klikni sliko za celozaslonski prikaz. Če ima žival več slik, jih
            lahko preklapljaš s puščicami ali s thumbnaili.
          </Typography>
        </Box>
      </Container>

      {/* FULLSCREEN IMAGE MODAL */}
      <Dialog
        open={fullOpen}
        onClose={() => setFullOpen(false)}
        fullScreen
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.92)" } }}
      >
        <Box sx={{ position: "relative", height: "100vh", width: "100vw" }}>
          <IconButton
            onClick={() => setFullOpen(false)}
            sx={{
              position: "absolute",
              top: 14,
              right: 14,
              color: "#fff",
              zIndex: 2,
            }}
          >
            <CloseIcon />
          </IconButton>

          {images.length > 1 && (
            <>
              <IconButton
                onClick={goPrev}
                disabled={!canPrev}
                sx={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#fff",
                  zIndex: 2,
                }}
              >
                <ChevronLeftIcon fontSize="large" />
              </IconButton>

              <IconButton
                onClick={goNext}
                disabled={!canNext}
                sx={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#fff",
                  zIndex: 2,
                }}
              >
                <ChevronRightIcon fontSize="large" />
              </IconButton>

              <Chip
                label={`${imgIndex + 1} / ${images.length}`}
                sx={{
                  position: "absolute",
                  bottom: 18,
                  left: "50%",
                  transform: "translateX(-50%)",
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.35)",
                  fontWeight: 800,
                  zIndex: 2,
                }}
              />
            </>
          )}

          <Box
            sx={{
              height: "100%",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            {currentImg ? (
              <Box
                component="img"
                src={currentImg}
                alt={animal.name}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : null}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
