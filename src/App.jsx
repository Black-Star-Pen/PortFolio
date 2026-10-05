import { useState } from "react";
import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer.jsx";
import ContactModal from "./components/ContactModal";
import ScrollToTop from "./components/ScrollToTop";
import ScrollReveal from "./components/ScrollReveal";
import Intro from "./components/Intro";
import HomePage from "./pages/HomePage";
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

function App() {
  // L'état est "remonté" ici : Navbar et Hero peuvent tous les deux ouvrir la modale
  const [isContactOpen, setIsContactOpen] = useState(false);

  function openContact() {
    setIsContactOpen(true);
  }

  function closeContact() {
    setIsContactOpen(false);
  }

  return (
    <>
      {/* Composants « invisibles » : ils n'affichent rien, ils agissent sur la page */}
      <ScrollToTop />
      <ScrollReveal />

      {/* L'écran d'intro : le plan qui se trace (une fois par visite) */}
      <Intro />

      <Navbar onContactClick={openContact} />

      <main>
        {/* Chaque adresse affiche une page différente */}
        <Routes>
          <Route path="/" element={<HomePage onContactClick={openContact} />} />
          <Route path="/mentions-legales" element={<LegalNotice />} />
          <Route path="/confidentialite" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      {isContactOpen && <ContactModal onClose={closeContact} />}
    </>
  );
}

export default App;