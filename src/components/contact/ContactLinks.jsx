import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

// L'adresse est découpée : elle n'apparaît jamais en entier dans la page (anti-bot)
const EMAIL_USER = "adam.boulkhedert03";
const EMAIL_DOMAIN = "gmail.com";

function ContactLinks({ compact = false }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    const email = `${EMAIL_USER}@${EMAIL_DOMAIN}`;

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <div className={`contact-links ${compact ? "compact" : ""}`}>
      <p className="contact-links-title">{compact ? t.links.compactTitle : t.links.title}</p>

      <div className="contact-links-list">
        <a
          href="https://github.com/Black-Star-Pen"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-small"
        >
          <img
            className="link-icon"
            src="/icons/github.svg"
            alt=""
            width="18"
            height="18"
          />
          GitHub
        </a>

        <a
          href="https://www.linkedin.com/in/adam-boulkhedert"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-small"
        >
          <span className="icon-in" aria-hidden="true">
            in
          </span>
          LinkedIn
        </a>

        <div className="copy-email">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={copyEmail}
          >
            <svg
              className="link-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            {copied ? t.links.copied : t.links.copy}
          </button>

          {!compact && (
            <span className="annotation" aria-hidden="true">
              <svg
                viewBox="0 0 60 30"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M58 24 C 42 28, 20 24, 6 10" />
                <path d="M6 10 L 8 19 M6 10 L 15 11" />
              </svg>
              <span>{t.links.antiBot}</span>
            </span>
          )}
        </div>
      </div>

      {/* Le code de ce portfolio est public : un lien direct vers son dépôt GitHub, sous les boutons
          (pas dans la modale, plus compacte). */}
      {!compact && (
        <p className="contact-links-note">
          <span aria-hidden="true">&lt;/&gt;</span>{" "}
          <a href="https://github.com/Black-Star-Pen/Portfolio" target="_blank" rel="noreferrer">
            {t.links.source} <span aria-hidden="true">↗</span>
            <span className="sr-only">{t.common.newTab}</span>
          </a>
        </p>
      )}
    </div>
  );
}

export default ContactLinks;
