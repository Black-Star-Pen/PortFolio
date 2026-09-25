import { useState, useEffect } from "react";

const links = [
  { href: "#about", label: "À propos" },
  { href: "#projects", label: "Projets" },
  { href: "#contact", label: "Contact" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="#" className="navbar-logo" onClick={closeMenu}>
          ADAM <span className="accent">BOULKHEDERT</span>
        </a>

        <nav className={`navbar-links ${isOpen ? "open" : ""}`}>
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              style={{ "--i": index }}
            >
              <span className="navbar-link-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className="btn btn-primary btn-small navbar-cta">
          Me contacter
        </a>
        <button
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
