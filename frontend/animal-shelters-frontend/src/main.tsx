import { createRoot } from 'react-dom/client'
import { createTheme, ThemeProvider } from "@mui/material/styles";
import "leaflet/dist/leaflet.css";
import './index.css'
import App from './App.tsx'

const theme = createTheme({
  palette: {
    primary: { main: "#1565c0" },
    secondary: { main: "#388e3c" },
  },
});

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
)
