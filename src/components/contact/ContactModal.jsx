import { useEffect, useRef } from "react";
import ContactForm from "./ContactForm";
import ContactLinks from "./ContactLinks";
import { lockPageScroll, startSmoothScrollIn, unlockPageScroll } from "../../utils/smoothScroll";
import { useLanguage } from "../../i18n/LanguageContext";

function ContactModal({ onClose }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);

  // Le défilement fluide à l'intérieur de la modale, le même que celui de la page (voir startSmoothScrollIn)
  useEffect(() => startSmoothScrollIn(dialogRef.current), []);

  useEffect(() => {
    // 1. On mémorise le bouton qui a ouvert la modale
    const previousFocus = document.activeElement;

    // 2. On bloque le scroll de la page
    lockPageScroll();

    // 3. On place le curseur dans le champ Prénom, le premier où l'on écrit.
    //    On le vise par son nom, et pas « le premier input venu » : le tout premier de la feuille est
    //    le champ piège anti-robots, invisible. Le clavier s'ouvrait alors sur lui : on tapait dans le vide,
    //    et un message écrit ainsi aurait été pris pour celui d'un robot.
    dialogRef.current.querySelector('input[name="firstName"]')?.focus();

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
          <p id="contact-modal-title">{t.contact.modalTitle}</p>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t.common.close}>
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