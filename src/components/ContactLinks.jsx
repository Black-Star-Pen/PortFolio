import { useState } from "react";

// L'adresse est découpée : elle n'apparaît jamais en entier dans la page (anti-bot)
const EMAIL_USER = "adam.boulkhedert03";
const EMAIL_DOMAIN = "gmail.com";

function ContactLinks({ compact = false }) {
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
      <p className="contact-links-title">
        {compact ? "Ou directement" : "Contact direct"}
      </p>

      <div className="contact-links-list">
        <a
          href="https://github.com/Black-Star-Pen"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-small"
        >
          <img
            className="link-icon"
            src="https://cdn.simpleicons.org/github/d6bf94"
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
            {copied ? "Email copié ✓" : "Copier mon email"}
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
              <span>Anti-bot : l'adresse n'est jamais écrite en clair</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactLinks;
