import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  Button,
} from "@mui/material";

import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FilterListIcon from "@mui/icons-material/FilterList";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

type EventItem = {
  id?: string;
  type: string; 
  status?: "DONE" | "ERROR" | "INFO";
  timestamp?: string; 
  [key: string]: any;
};

const API = "http://localhost:4000/api";

const theme = {
  primary: "#9c27b0",
  primaryDark: "#7b1fa2",
  secondary: "#e1bee7",
  glass: "rgba(255,255,255,0.95)",
};

function fmtSlDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("sl-SI", { day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("sl-SI", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return `${date} ob ${time}`;
}

function statusChip(status?: string) {
  const s = (status || "INFO").toUpperCase();
  if (s === "DONE") return { label: "DONE", icon: <CheckCircleOutlineIcon />, sx: { bgcolor: alpha("#66bb6a", 0.14), color: "#2e7d32" } };
  if (s === "ERROR") return { label: "ERROR", icon: <ErrorOutlineIcon />, sx: { bgcolor: alpha("#ef5350", 0.14), color: "#c62828" } };
  return { label: "INFO", icon: <WarningAmberOutlinedIcon />, sx: { bgcolor: alpha("#047ffb", 0.14), color: "#070a99d1" } };
}

export const EventFeed: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Connect SSE
  useEffect(() => {
    setError(null);

    // SSE endpoint: /api/events/stream
    const es = new EventSource(`${API}/events/stream`);

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onerror = () => {
      setConnected(false);
      setError("Povezava do dogodkovnega vodila ni uspela (SSE). Preveri backend + RabbitMQ.");
    };

    es.addEventListener("rabbit", (msg) => {
        try {
            const parsed = JSON.parse((msg as MessageEvent).data) as EventItem;
            setEvents((prev) => [parsed, ...prev].slice(0, 200));
        } catch {
            // ignore
        }
    });


    return () => {
      es.close();
    };
  }, []);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.type && set.add(e.type));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return events;
    return events.filter((e) => e.type === typeFilter);
  }, [events, typeFilter]);

  const lastEventAt = useMemo(() => {
    const iso = events[0]?.timestamp;
    return fmtSlDateTime(iso);
  }, [events]);

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
            backgroundImage: "url('/assets/img/bunny.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.55)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(155deg, ${alpha(theme.primary, 0.55)} 0%, ${alpha("#f7c4bf", 0.25)} 70%)`,
          }}
        />

        <Container sx={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={1.5}>
            <Chip
              icon={<DynamicFeedIcon />}
              label="Dogodkovno vodilo (RabbitMQ)"
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
              Event Feed (v živo)
            </Typography>

            <Typography sx={{ color: "rgba(255,255,255,0.92)", maxWidth: 900 }}>
              Dogodki iz backend-a prihajajo asinhrono (brez osveževanja strani). Uporabno za dokaz “event-driven”
              arhitekture v nalogi.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip
                icon={<AccessTimeIcon />}
                label={`Zadnji dogodek: ${lastEventAt}`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />
              <Chip
                icon={<FilterListIcon />}
                label={`Dogodki: ${events.length}`}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              />

              {connected ? (
                <Chip
                  icon={<CheckCircleOutlineIcon />}
                  label="Povezano"
                  sx={{ bgcolor: alpha("#66bb6a", 0.8), color: "#fff", fontWeight: 800 }}
                />
              ) : (
                <Chip
                  icon={<WarningAmberOutlinedIcon />}
                  label="Ni povezave"
                  sx={{ bgcolor: alpha("#ffb300", 0.8), color: "#fff", fontWeight: 800 }}
                />
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Card sx={{ bgcolor: theme.glass, borderRadius: 3, boxShadow: 4, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter po tipu</InputLabel>
                  <Select
                    label="Filter po tipu"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(String(e.target.value))}
                  >
                    <MenuItem value="all">Vsi tipi</MenuItem>
                    {uniqueTypes.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={() => setEvents([])}
                    sx={{
                      borderColor: theme.primary,
                      color: theme.primary,
                      fontWeight: 800,
                      "&:hover": { borderColor: theme.primaryDark, bgcolor: alpha(theme.primary, 0.05) },
                      whiteSpace: "nowrap",
                    }}
                  >
                    Počisti feed
                  </Button>

                  <Box sx={{ flexGrow: 1 }} />

                  <Typography sx={{ color: "text.secondary" }}>
                    Prikazanih: <strong>{filtered.length}</strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Namig: sproži dogodek z gumbom “Osveži podatke” na strani <strong>Aktualne živali</strong>, ali s klicem{" "}
              <code>POST /api/horjul/refresh</code>. Feed se mora posodobiti brez refresh-a.
            </Typography>
          </CardContent>
        </Card>

        {/* Feed */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: `1px solid ${alpha(theme.primary, 0.12)}`,
            bgcolor: "white",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: alpha(theme.primary, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DynamicFeedIcon sx={{ color: theme.primary }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                  Dogodki (zadnji na vrhu)
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Real-time prikaz (SSE) — demonstracija asinhrone arhitekture.
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={connected ? "LIVE" : "OFFLINE"}
              sx={{
                bgcolor: connected ? alpha("#66bb6a", 0.12) : alpha("#bdbdbd", 0.18),
                color: connected ? "#2e7d32" : "text.secondary",
                fontWeight: 900,
              }}
            />
          </Stack>

          {filtered.length === 0 ? (
            <Alert severity="info">Ni dogodkov (še). Sproži akcijo v aplikaciji ali počakaj na event.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {filtered.map((e, idx) => {
                const st = statusChip(e.status);
                return (
                  <Card
                    key={`${e.type}-${e.timestamp}-${idx}`}
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.primary, 0.10)}`,
                      transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 10px 28px ${alpha(theme.primary, 0.14)}`,
                        borderColor: alpha(theme.primary, 0.35),
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.2 }}>
                      <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
                        <Chip
                          label={e.type}
                          sx={{
                            bgcolor: alpha(theme.primary, 0.10),
                            color: theme.primaryDark,
                            fontWeight: 900,
                          }}
                        />
                        <Chip icon={st.icon as any} label={st.label} sx={{ fontWeight: 900, ...st.sx }} />
                        <Chip
                          icon={<AccessTimeIcon />}
                          label={fmtSlDateTime(e.timestamp)}
                          sx={{ bgcolor: alpha("#000", 0.04), color: "text.secondary" }}
                        />
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        <strong>Payload:</strong>
                      </Typography>

                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          p: 1.4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.secondary, 0.20),
                          border: `1px solid ${alpha(theme.primary, 0.08)}`,
                          overflowX: "auto",
                        }}
                      >
                        <pre style={{ margin: 0, fontSize: 12 }}>
                          {JSON.stringify(e, null, 2)}
                        </pre>
                      </Paper>
                    </CardContent>
                  </Card>
                );
              })}
              <div ref={bottomRef} />
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
