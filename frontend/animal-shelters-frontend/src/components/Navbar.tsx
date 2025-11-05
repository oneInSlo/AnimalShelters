import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PetsIcon from "@mui/icons-material/Pets";
import AgricultureIcon from "@mui/icons-material/Agriculture";

export const Navbar: React.FC = () => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <img
            src="/logo.png"
            alt="logo"
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
          Zavetišča in Živina
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
            to="/animals"
            startIcon={<PetsIcon />}
            sx={{ marginRight: 2 }}
          >
            Zavetišča
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/livestock"
            startIcon={<AgricultureIcon />}
          >
            Živina
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
