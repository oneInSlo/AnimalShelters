import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PetsIcon from "@mui/icons-material/Pets";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import { Filter, Help, Notifications } from "@mui/icons-material";

export const Navbar: React.FC = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#9c27b0" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          Slovenska zavetišča
        </Typography>

        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ marginRight: 2 }}
          >
            Domov
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/overview"
            startIcon={<PetsIcon />}
            sx={{ marginRight: 2 }}
          >
            Zavetišča
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/live-animals"
            startIcon={<Notifications />}
            sx={{ marginRight: 2 }}
          >
            Aktualne živali
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/animals"
            startIcon={<Filter />}
            sx={{ marginRight: 2 }}
          >
            Filtriranje
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/animal-fit"
            startIcon={<Help />}
            sx={{ marginRight: 2 }}
          >
            AI pomoč
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/livestock"
            startIcon={<AgricultureIcon />}
          >
            Statistika živine
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
