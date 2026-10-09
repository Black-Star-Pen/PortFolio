import Hero from "../components/hero/Hero";
import About from "../components/about/About";
import Skills from "../components/skills/Skills";
import Projects from "../components/projects/Projects";
import Contact from "../components/contact/Contact";
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
