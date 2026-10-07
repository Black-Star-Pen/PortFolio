import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import Weld from "./Weld";
import { scrollToSiteTop } from "../utils/siteTop";

const navLinks = [
  { href: "/#about", label: "À propos" },
  { href: "/#skills", label: "Compétences" },
  { href: "/#projects", label: "Projets" },
  { href: "/#contact", label: "Contact" },
];

function Footer() {
  const year = new Date().getFullYear();
  const cartoucheRef = useRef(null);
  const [isWelded, setIsWelded] = useState(false);

  // La soudure se rejoue à chaque fois que le cartouche revient à l'écran
  useEffect(() => {
    const cartouche = cartoucheRef.current;
    if (!cartouche) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          // 60 % visible : on soude
          setIsWelded(true);
        } else if (!entry.isIntersecting) {
          // Complètement sorti de l'écran : on retire la soudure pour la prochaine fois
          setIsWelded(false);
        }
      },
      { threshold: [0, 0.6] } // prévient à 0 % et à 60 % de visibilité
    );

    observer.observe(cartouche);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* La signature */}
          <div className="footer-brand">
            {/* Comme le logo de la navbar : il ramène au Hero, même quand l'adresse ne change pas */}
            <Link to="/" className="navbar-logo" onClick={scrollToSiteTop}>
              ADAM <span className="accent">BOULKHEDERT</span>
            </Link>
            <p>Développeur full stack. Du métal au code, le goût du travail bien fait.</p>

            {/* Les remerciements, sous la signature.
                Ce lien n'a pas « noreferrer », contrairement aux autres liens externes : le site d'Octaforge
                peut ainsi voir que la visite vient de ce portfolio. « noopener » suffit à la sécurité :
                la page ouverte dans le nouvel onglet ne peut pas agir sur celle-ci. */}
            <p className="footer-thanks">
              Petite mention honorable, merci pour tout à Cédric, développeur et fondateur d'
              <a href="https://octaforge.fr/" target="_blank" rel="noopener">
                Octaforge <span aria-hidden="true">↗</span>
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </p>
          </div>

          {/* La navigation */}
          <nav className="footer-col" aria-label="Navigation du pied de page">
            <p className="footer-col-title">Plan du site</p>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* Les liens externes et légaux */}
          <div className="footer-col">
            <p className="footer-col-title">Liens</p>
            <a href="https://github.com/Black-Star-Pen" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a href="https://www.linkedin.com/in/adam-boulkhedert" target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
          </div>
        </div>

        {/* Le cartouche, comme en bas d'un plan technique */}
        <div className="footer-cartouche" ref={cartoucheRef}>
          <span>© {year} Adam Boulkhedert</span>
          <span>Conçu et soudé à la main</span>
          <span>React · Express</span>
          <span>RÉV. {year}</span>
          {/* En dernier, pour ne pas décaler les :nth-child du CSS mobile */}
          {isWelded && <Weld variant="blue" />}
        </div>
      </div>
    </footer>
  );
}

export default Footer;