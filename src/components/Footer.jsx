import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import FooterEdge from "./FooterEdge";
import Weld from "./Weld";
import { scrollToSiteTop } from "../utils/siteTop";
import { useLanguage } from "../i18n/LanguageContext";

// Les liens du plan du site : leur ancre, et le nom de leur texte dans t.nav (voir src/i18n/texts.js)
const navLinks = [
  { href: "/#about", name: "about" },
  { href: "/#skills", name: "skills" },
  { href: "/#projects", name: "projects" },
  { href: "/#contact", name: "contact" },
];

function Footer() {
  const { t } = useLanguage();
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
      {/* Le bord du haut du pied de page : une tôle découpée, avec sa languette (voir FooterEdge.jsx) */}
      <FooterEdge />

      <div className="footer-inner">
        <div className="footer-grid">
          {/* La signature */}
          <div className="footer-brand">
            {/* Comme le logo de la navbar : il ramène au Hero, même quand l'adresse ne change pas */}
            <Link to="/" className="navbar-logo" onClick={scrollToSiteTop}>
              ADAM <span className="accent">BOULKHEDERT</span>
            </Link>
            <p>{t.footer.tagline}</p>

            {/* Les remerciements, sous la signature.
                Ce lien n'a pas « noreferrer », contrairement aux autres liens externes : le site d'Octaforge
                peut ainsi voir que la visite vient de ce portfolio. « noopener » suffit à la sécurité :
                la page ouverte dans le nouvel onglet ne peut pas agir sur celle-ci. */}
            <p className="footer-thanks">
              {t.footer.thanks}
              <a href="https://octaforge.fr/" target="_blank" rel="noopener">
                Octaforge <span aria-hidden="true">↗</span>
                <span className="sr-only">{t.common.newTab}</span>
              </a>
            </p>
          </div>

          {/* La navigation */}
          <nav className="footer-col" aria-label={t.footer.navLabel}>
            <p className="footer-col-title">{t.footer.siteMap}</p>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {t.nav[link.name]}
              </a>
            ))}
          </nav>

          {/* Les liens externes et légaux */}
          <div className="footer-col">
            <p className="footer-col-title">{t.footer.links}</p>
            <a href="https://github.com/Black-Star-Pen" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a href="https://www.linkedin.com/in/adam-boulkhedert" target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <Link to="/mentions-legales">{t.footer.legal}</Link>
            <Link to="/confidentialite">{t.footer.privacy}</Link>
          </div>
        </div>

        {/* Le cartouche, comme en bas d'un plan technique */}
        <div className="footer-cartouche" ref={cartoucheRef}>
          <span>© {year} Adam Boulkhedert</span>
          <span>{t.footer.handmade}</span>
          <span>React · Express</span>
          <span>
            {t.footer.revision} {year}
          </span>
          {/* En dernier, pour ne pas décaler les :nth-child du CSS mobile */}
          {isWelded && <Weld variant="blue" />}
        </div>
      </div>
    </footer>
  );
}

export default Footer;