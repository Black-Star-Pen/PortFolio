import { useEffect, useRef } from "react";
import ContactForm from "./ContactForm";
import ContactLinks from "./ContactLinks";
import { startSmoothScrollIn } from "../../utils/smoothScroll";
import { useDialog } from "../../hooks/useDialog";
import { useLanguage } from "../../i18n/LanguageContext";

function ContactModal({ onClose }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose, 'input[name="firstName"]');

  // Le défilement fluide à l'intérieur de la modale, le même que celui de la page (voir startSmoothScrollIn)
  useEffect(() => startSmoothScrollIn(dialogRef.current), []);



  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* data-lenis-prevent : dans la modale, la molette fait défiler la modale (voir ProjectModal.jsx) */}
      <div
        className="contact-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        tabIndex={-1}
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
