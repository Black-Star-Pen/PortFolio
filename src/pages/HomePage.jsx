import Hero from "../components/Hero";
import About from "../components/About";
import Skills from "../components/Skills";
import Projects from "../components/Projects";
import Contact from "../components/Contact";
import { usePageTitle } from "../hooks/usePageTitle";

// La page d'accueil : les sections qui étaient avant directement dans App
function HomePage({ onContactClick }) {
  // Le titre de l'onglet : celui du site, dans la langue en cours
  usePageTitle();

  return (
    <>
      <Hero onContactClick={onContactClick} />
      <About />
      <Skills />
      <Projects />
      <Contact />
    </>
  );
}

export default HomePage;
