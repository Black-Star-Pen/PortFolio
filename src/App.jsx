import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import ContactModal from "./components/ContactModal";

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
      <Navbar onContactClick={openContact} />
      <main>
        <Hero onContactClick={openContact} />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>

      {isContactOpen && <ContactModal onClose={closeContact} />}
    </>
  );
}

export default App;
