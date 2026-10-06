import { useState, useEffect } from "react";
import { Link } from "react-router";
import { scrollToSiteTop } from "../utils/siteTop";

const links = [
  { href: "/#about", label: "À propos" },
  { href: "/#skills", label: "Compétences" },
  { href: "/#projects", label: "Projets" },
  { href: "/#contact", label: "Contact" },
];

function Navbar({ onContactClick }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  // Le logo ramène toujours au Hero.
  // Le lien seul ne suffit pas : si on est déjà sur « / » sans ancre, l'adresse ne change pas,
  // ScrollToTop ne se déclenche donc pas et rien ne bouge. On fait défiler nous-mêmes.
  function goToHero() {
    closeMenu();
    scrollToSiteTop();
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Les deux initiales ont leur propre <span> : à la fin de l'intro, le « A » et le « B » soudés
            viennent se poser dessus (voir Intro.jsx). data-text sert au reflet qui balaie le nom (CSS). */}
        <Link to="/" className="navbar-logo" data-text="ADAM BOULKHEDERT" onClick={goToHero}>
          <span className="logo-initial">A</span>DAM{" "}
          <span className="accent">
            <span className="logo-initial">B</span>OULKHEDERT
          </span>
        </Link>

        <nav className={`navbar-links ${isOpen ? "open" : ""}`}>
          {links.map((link, index) => (
            <a key={link.href} href={link.href} onClick={closeMenu} style={{ "--i": index }}>
              <span className="navbar-link-number">{String(index + 1).padStart(2, "0")}</span>
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="btn btn-primary btn-small navbar-cta"
          onClick={onContactClick}
        >
          Me contacter
        </button>

        <button
          type="button"
          className={`navbar-burger ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;