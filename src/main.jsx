import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
// Les polices sont installées dans le projet (paquets @fontsource) : le site les sert lui-même,
// sans passer par Google Fonts. « Variable » = un seul fichier contient toutes les graisses.
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/newsreader/wght-italic.css"; // Newsreader n'est utilisée qu'en italique
import "./index.css";
import App from "./App.jsx";
import LanguageProvider from "./i18n/LanguageProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* BrowserRouter permet d'avoir plusieurs pages avec de vraies adresses */}
    <BrowserRouter>
      {/* LanguageProvider met la langue (français ou anglais) à disposition de toute l'application */}
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
