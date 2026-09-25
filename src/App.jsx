import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Skills from "./components/Skills";

function App() {
  return (
    <>
    <Navbar />
    <main>
      <Hero />
      <About />
      <Skills/>
      <Projects />
    </main>
    </>
  );
}

export default App;