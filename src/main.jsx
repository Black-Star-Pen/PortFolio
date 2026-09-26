import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* BrowserRouter permet d'avoir plusieurs pages avec de vraies adresses */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);