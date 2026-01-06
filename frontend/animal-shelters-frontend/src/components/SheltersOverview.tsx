import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  Paper,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  alpha,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ClearIcon from "@mui/icons-material/Clear";
import PetsIcon from "@mui/icons-material/Pets";
import EventIcon from "@mui/icons-material/Event";
import NavigationIcon from "@mui/icons-material/Navigation";
import MapIcon from "@mui/icons-material/Map";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Leaflet icons fix (Vite/React)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API = "http://localhost:4000/api";

// Theme colors matching #9c27b0
const theme = {
  primary: "#9c27b0",
  primaryLight: "#ba68c8",
  primaryDark: "#7b1fa2",
  secondary: "#e1bee7",
  accent: "#ab47bc",
  success: "#66bb6a",
  info: "#42a5f5",
};

type Shelter = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lon?: number;
  latitude?: string;
  longitude?: string;
};

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  ageMonths: number;
  adoptionFee: number;
  neutered: boolean;
  shelterId?: string;
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  description: string;
  shelterId?: string;
};

function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 12), { duration: 0.8 });
  }, [lat, lon, map]);
  return null;
}

function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function slovenianAge(ageMonths: number) {
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  const yearText = (n: number) => {
    if (n === 1) return "leto";
    if (n === 2) return "leti";
    if (n === 3 || n === 4) return "leta";
    return "let";
  };

  const monthText = (n: number) => {
    if (n === 1) return "mesec";
    if (n === 2) return "meseca";
    if (n === 3 || n === 4) return "mesece";
    return "mesecev";
  };

  const parts = [];

  if (years > 0) parts.push(`${years} ${yearText(years)}`);
  if (months > 0) parts.push(`${months} ${monthText(months)}`);

  return parts.join(" ");
}

export default function SheltersOverview() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(
    null
  );
  const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [onlyNearby, setOnlyNearby] = useState<boolean>(false);

  const [search, setSearch] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/osm/shelters-enriched`).then((r) => r.json()),
      fetch(`${API}/events`).then((r) => r.json()),
      fetch(`${API}/animals`).then((r) => r.json()),
    ])
      .then(([s, e, a]) => {
        setShelters(s);
        setEvents(e);
        setAnimals(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedShelter = useMemo(
    () =>
      selectedShelterId
        ? shelters.find((s) => s.id === selectedShelterId)
        : null,
    [selectedShelterId, shelters]
  );

  const sheltersWithCoords = useMemo(
    () => shelters.filter((s) => Number(s.lat) && Number(s.lon)),
    [shelters]
  );

  const searchedShelters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sheltersWithCoords;
    return sheltersWithCoords.filter((s) => {
      const hay = `${s.name} ${s.city} ${s.address}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search, sheltersWithCoords]);

  const nearbyShelters = useMemo(() => {
    if (!myPos) return searchedShelters;
    return searchedShelters.filter((s) => {
      const d = haversineKm(myPos, { lat: Number(s.lat), lon: Number(s.lon) });
      return d <= radiusKm;
    });
  }, [myPos, radiusKm, searchedShelters]);

  const visibleShelters = onlyNearby ? nearbyShelters : searchedShelters;

  const visibleAnimals = useMemo(() => {
    if (!selectedShelterId) return animals;
    return animals.filter(
      (a: any) => String(a.shelterId) === String(selectedShelterId)
    );
  }, [animals, selectedShelterId]);

  const visibleEvents = useMemo(() => {
    if (!selectedShelterId) return events;
    return events.filter(
      (e: any) => String(e.shelterId) === String(selectedShelterId)
    );
  }, [events, selectedShelterId]);

  const requestMyLocation = () => {
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError("Geolokacija ni podprta v tem brskalniku.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setOnlyNearby(true);
      },
      () => setGeoError("Dostop do lokacije ni dovoljen ali ni na voljo.")
    );
  };

  const mapCenter: [number, number] =
    selectedShelter?.lat && selectedShelter?.lon
      ? [Number(selectedShelter.lat), Number(selectedShelter.lon)]
      : [46.0569, 14.5058];

  const openOSMSearch = (s: Shelter) => {
    const q = encodeURIComponent(`${s.address}, ${s.city}, Slovenia`);
    window.open(`https://www.openstreetmap.org/search?query=${q}`, "_blank");
  };

  const openGoogleNav = (s: Shelter) => {
    if (!s.lat || !s.lon) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${Number(
        s.lat
      )},${Number(s.lon)}`,
      "_blank"
    );
  };

  // if (loading) {
  //   return (
  //     <Box
  //       sx={{
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         minHeight: "100vh",
  //         minWidth: "100%",
  //         bgcolor: "#fafafa",
  //       }}
  //     >
  //       <Box sx={{ textAlign: "center" }}>
  //         <Box
  //           sx={{
  //             width: 100,
  //             height: 100,
  //             borderRadius: "50%",
  //             border: `4px solid ${alpha(theme.primary, 0.2)}`,
  //             borderTopColor: theme.primary,
  //             animation: "spin 1s linear infinite",
  //             mx: "auto",
  //             mb: 3,
  //             "@keyframes spin": {
  //               "0%": { transform: "rotate(0deg)" },
  //               "100%": { transform: "rotate(360deg)" },
  //             },
  //           }}
  //         />
  //         <Typography
  //           variant="h5"
  //           sx={{ color: theme.primary, fontWeight: 600 }}
  //         >
  //           Nalaganje podatkov...
  //         </Typography>
  //       </Box>
  //     </Box>
  //   );
  // }

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh", width: "100vw" }}>
      {/* HERO */}
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
            backgroundImage: "url('/assets/img/dog.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.55)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(155deg, ${alpha(
              theme.primary,
              0.55
            )} 0%, ${alpha("#f7c4bfff", 0.25)} 70%)`,
          }}
        />

        <Container sx={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={1.5} sx={{ textAlign: { xs: "left", md: "left" } }}>
            <Chip
              label="OpenStreetMap"
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
              Zavetišča v Sloveniji
            </Typography>

            <Typography sx={{ color: "rgba(255,255,255,0.92)", maxWidth: 850 }}>
              Interaktivna mapa zavetišč, dogodkov in živali na posvojitev
            </Typography>

            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip
                icon={<PlaceIcon />}
                label={`${visibleShelters.length} zavetišč`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              <Chip
                icon={<EventIcon />}
                label={`${visibleEvents.length} dogodkov`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              <Chip
                icon={<PetsIcon />}
                label={`${visibleAnimals.length} živali`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Filter Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: `2px solid ${alpha(theme.primary, 0.1)}`,
            bgcolor: "white",
          }}
        >
          {geoError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {geoError}
            </Alert>
          )}

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Išči zavetišče"
                placeholder="Ime, kraj, naslov..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: theme.primary }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.primary,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.primary,
                  },
                }}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<MyLocationIcon />}
                onClick={requestMyLocation}
                fullWidth
                sx={{
                  borderColor: theme.primary,
                  color: theme.primary,
                  "&:hover": {
                    borderColor: theme.primaryDark,
                    bgcolor: alpha(theme.primary, 0.05),
                  },
                }}
              >
                Najdi me
              </Button>
            </Grid>

            <Grid item xs={6} md={3}>
              <FormControl
                size="small"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: theme.primary,
                    },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.primary,
                  },
                }}
              >
                <InputLabel>Radij</InputLabel>
                <Select
                  label="Radij"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                >
                  <MenuItem value={10}>10 km</MenuItem>
                  <MenuItem value={25}>25 km</MenuItem>
                  <MenuItem value={50}>50 km</MenuItem>
                  <MenuItem value={100}>100 km</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <Button
                variant={onlyNearby ? "contained" : "outlined"}
                onClick={() => setOnlyNearby((p) => !p)}
                disabled={!myPos}
                fullWidth
                sx={{
                  bgcolor: onlyNearby ? theme.primary : "transparent",
                  borderColor: theme.primary,
                  color: onlyNearby ? "white" : theme.primary,
                  "&:hover": {
                    bgcolor: onlyNearby
                      ? theme.primaryDark
                      : alpha(theme.primary, 0.05),
                    borderColor: theme.primaryDark,
                  },
                }}
              >
                {onlyNearby ? "Bližnja" : "Vsa"}
              </Button>
            </Grid>

            {selectedShelterId && (
              <Grid item xs={6} md={2}>
                <Button
                  variant="text"
                  startIcon={<ClearIcon />}
                  onClick={() => setSelectedShelterId(null)}
                  fullWidth
                  sx={{
                    color: theme.primary,
                    "&:hover": {
                      bgcolor: alpha(theme.primary, 0.05),
                    },
                  }}
                >
                  Počisti
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Map + Sidebar Layout */}
        <Grid container spacing={3}>
          {/* Map */}
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                height: 600,
                border: `1px solid ${alpha(theme.primary, 0.1)}`,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: "100%",
                  "& .leaflet-container": { height: "100%", width: "100%" },
                }}
              >
                <MapContainer
                  center={mapCenter}
                  zoom={8}
                  scrollWheelZoom
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {selectedShelter?.lat && selectedShelter?.lon && (
                    <FlyTo
                      lat={Number(selectedShelter.lat)}
                      lon={Number(selectedShelter.lon)}
                    />
                  )}

                  {myPos && (
                    <>
                      <Marker position={[myPos.lat, myPos.lon]}>
                        <Popup>Moja lokacija</Popup>
                      </Marker>
                      <Circle
                        center={[myPos.lat, myPos.lon]}
                        radius={radiusKm * 1000}
                        color={theme.primary}
                        fillOpacity={0.1}
                      />
                    </>
                  )}

                  {visibleShelters.map((s) => (
                    <Marker
                      key={s.id}
                      position={[Number(s.lat), Number(s.lon)]}
                      eventHandlers={{
                        click: () => setSelectedShelterId(s.id),
                      }}
                    >
                      <Popup>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {s.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mb: 1 }}
                          >
                            {s.address}, {s.city}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            fullWidth
                            onClick={() => setSelectedShelterId(s.id)}
                          >
                            Prikaži podrobnosti
                          </Button>
                        </Box>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Shelter Details Sidebar */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                p: 3,
                height: 350,
                overflow: "auto",
                border: `1px solid ${alpha(theme.primary, 0.1)}`,
                bgcolor: "white",
              }}
            >
              {!selectedShelter ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.primary, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                    }}
                  >
                    <HomeIcon sx={{ fontSize: 40, color: theme.primary }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 1, color: theme.primary }}
                  >
                    Izberi zavetišče
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Klikni na marker na mapi za več podrobnosti
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: theme.primary }}
                    >
                      {selectedShelter.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedShelterId(null)}
                      sx={{
                        color: theme.primary,
                        "&:hover": { bgcolor: alpha(theme.primary, 0.1) },
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        alignItems: "flex-start",
                        p: 2,
                        bgcolor: alpha(theme.secondary, 0.3),
                        borderRadius: 2,
                      }}
                    >
                      <PlaceIcon
                        sx={{ fontSize: 20, color: theme.primary, mt: 0.2 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedShelter.address}, {selectedShelter.city}
                      </Typography>
                    </Box>

                    {selectedShelter.phone && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          alignItems: "center",
                          pl: 2,
                        }}
                      >
                        <PhoneIcon
                          sx={{ fontSize: 20, color: theme.primary }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedShelter.phone}
                        </Typography>
                      </Box>
                    )}

                    {selectedShelter.email && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          alignItems: "center",
                          pl: 2,
                        }}
                      >
                        <EmailIcon
                          sx={{ fontSize: 20, color: theme.primary }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedShelter.email}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MapIcon />}
                      onClick={() => openOSMSearch(selectedShelter)}
                      fullWidth
                      sx={{
                        borderColor: theme.primary,
                        color: theme.primary,
                        "&:hover": {
                          borderColor: theme.primaryDark,
                          bgcolor: alpha(theme.primary, 0.05),
                        },
                      }}
                    >
                      OSM
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<NavigationIcon />}
                      onClick={() => openGoogleNav(selectedShelter)}
                      disabled={!selectedShelter.lat || !selectedShelter.lon}
                      fullWidth
                      sx={{
                        bgcolor: theme.primary,
                        "&:hover": {
                          bgcolor: theme.primaryDark,
                        },
                      }}
                    >
                      Navigacija
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Chip
                      icon={<PetsIcon />}
                      label={`${visibleAnimals.length} živali`}
                      sx={{
                        bgcolor: alpha(theme.primary, 0.1),
                        color: theme.primary,
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      icon={<EventIcon />}
                      label={`${visibleEvents.length} dogodkov`}
                      sx={{
                        bgcolor: alpha(theme.info, 0.1),
                        color: theme.info,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs Section */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.primary, 0.1)}`,
            overflow: "hidden",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{
              bgcolor: alpha(theme.primary, 0.03),
              px: 2,
              "& .MuiTab-root": {
                fontWeight: 600,
                color: "text.secondary",
                "&.Mui-selected": {
                  color: theme.primary,
                },
              },
              "& .MuiTabs-indicator": {
                bgcolor: theme.primary,
                height: 3,
              },
            }}
          >
            <Tab
              icon={<EventIcon />}
              label={`Dogodki (${visibleEvents.length})`}
              iconPosition="start"
            />
            <Tab
              icon={<PetsIcon />}
              label={`Živali (${visibleAnimals.length})`}
              iconPosition="start"
            />
          </Tabs>

          {/* Events Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 4 }}>
              {visibleEvents.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.info, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                    }}
                  >
                    <EventIcon sx={{ fontSize: 40, color: theme.info }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: "text.secondary", fontWeight: 600, mb: 1 }}
                  >
                    {selectedShelter
                      ? "Ni dogodkov za izbrano zavetišče"
                      : "Izberi zavetišče za prikaz dogodkov"}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {visibleEvents.map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.id}>
                      <Card
                        elevation={0}
                        sx={{
                          border: `1px solid ${alpha(theme.primary, 0.1)}`,
                          borderRadius: 2,
                          height: "100%",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: `0 8px 24px ${alpha(
                              theme.primary,
                              0.15
                            )}`,
                            borderColor: theme.primary,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: alpha(theme.info, 0.1),
                                borderRadius: 2,
                              }}
                            >
                              <EventIcon
                                sx={{ color: theme.info, fontSize: 28 }}
                              />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  mb: 1,
                                  color: theme.primaryDark,
                                }}
                              >
                                {event.title}
                              </Typography>
                              <Chip
                                label={event.date}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.primary, 0.1),
                                  color: theme.primary,
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", lineHeight: 1.6 }}
                          >
                            {event.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Animals Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 4 }}>
              {visibleAnimals.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.primary, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                    }}
                  >
                    <PetsIcon sx={{ fontSize: 40, color: theme.primary }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ color: "text.secondary", fontWeight: 600, mb: 1 }}
                  >
                    {selectedShelter
                      ? "Ni živali za izbrano zavetišče"
                      : "Izberi zavetišče za prikaz živali"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.primary, 0.05) }}>
                        <TableCell
                          sx={{ fontWeight: 700, color: theme.primaryDark }}
                        >
                          Ime
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: theme.primaryDark }}
                        >
                          Vrsta
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: theme.primaryDark }}
                        >
                          Pasma
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: theme.primaryDark }}
                        >
                          Spol
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: theme.primaryDark }}
                        >
                          Starost
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: theme.primaryDark }}
                        >
                          Cena
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: theme.primaryDark }}
                        >
                          Kastriran
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visibleAnimals.map((animal, index) => (
                        <TableRow
                          key={animal.id}
                          sx={{
                            "&:hover": { bgcolor: alpha(theme.primary, 0.03) },
                            bgcolor:
                              index % 2 === 0
                                ? "white"
                                : alpha(theme.secondary, 0.1),
                            transition: "background-color 0.2s ease",
                          }}
                        >
                          <TableCell
                            sx={{ fontWeight: 600, color: theme.primary }}
                          >
                            {animal.name}
                          </TableCell>
                          <TableCell>{animal.species}</TableCell>
                          <TableCell>{animal.breed}</TableCell>
                          <TableCell>{animal.sex}</TableCell>
                          <TableCell>
                            {slovenianAge(animal.ageMonths)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {animal.adoptionFee} €
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={animal.neutered ? "Da" : "Ne"}
                              size="small"
                              sx={{
                                bgcolor: animal.neutered
                                  ? alpha(theme.success, 0.1)
                                  : alpha("#bdbdbd", 0.2),
                                color: animal.neutered
                                  ? theme.success
                                  : "text.secondary",
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
