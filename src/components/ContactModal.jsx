import { useEffect, useRef } from "react";
import ContactForm from "./ContactForm";
import ContactLinks from "./ContactLinks";
import { lockPageScroll, unlockPageScroll } from "../utils/smoothScroll";

function ContactModal({ onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    // 1. On mémorise le bouton qui a ouvert la modale
    const previousFocus = document.activeElement;

    // 2. On bloque le scroll de la page
    lockPageScroll();

    // 3. On place le curseur dans le premier champ
    dialogRef.current.querySelector("input")?.focus();

    // 4. Échap ferme la modale
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    // Nettoyage : on remet tout comme avant
    return () => {
      unlockPageScroll();
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* data-lenis-prevent : dans la modale, la molette fait défiler la modale (voir ProjectModal.jsx) */}
      <div
        className="contact-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        data-lenis-prevent
        onClick={(event) => event.stopPropagation()}
      >
        <div className="contact-modal-bar">
          <p id="contact-modal-title">Demande express</p>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <ContactForm />
        <ContactLinks compact />
      </div>
    </div>
  );
}

export default ContactModal;