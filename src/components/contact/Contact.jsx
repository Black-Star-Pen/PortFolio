import SectionTitle from "../shared/SectionTitle";
import ContactForm from "./ContactForm";
import ContactLinks from "./ContactLinks";
import GoldDust from "./GoldDust";
import { useLanguage } from "../../i18n/LanguageContext";

function Contact() {
  const { t } = useLanguage();

  return (
    <section id="contact">
      {/* Le fond de la section : la poussière d'or (voir GoldDust.jsx) */}
      <GoldDust />

      {/* Le titre est écrit en JSX (et pas en simple texte) pour pouvoir mettre un seul mot en valeur :
          « poste » (« role » en anglais) passe en doré, comme « Applications Web » dans le titre du Hero,
          et il est souligné à la main, de deux coups de crayon. Le titre est donc en trois morceaux dans
          src/i18n/texts.js : ce qui précède le mot, le mot, ce qui le suit.
          Le soulignage est un petit dessin SVG posé sous le mot (voir .title-underline dans le CSS).
          pathLength="1" dit au navigateur de compter la longueur de chaque trait comme valant 1 :
          le CSS peut alors le tracer de 0 à 1 sans connaître sa vraie longueur.
          aria-hidden : c'est un décor, un lecteur d'écran n'a pas à l'annoncer. */}
      <SectionTitle
        label={t.contact.label}
        title={
          <>
            {t.contact.titleBefore}
            <span className="accent title-underline">
              {t.contact.titleWord}
              <svg viewBox="0 0 100 13" aria-hidden="true">
                <path pathLength="1" d="M2 5.5 C 30 2.5, 66 3.5, 98 5" />
                <path pathLength="1" d="M12 10.5 C 40 8, 68 9.5, 90 9.5" />
              </svg>
            </span>
            {t.contact.titleAfter}
          </>
        }
        accent={t.contact.accent}
        subtitle={t.contact.subtitle}
      />

      <ContactForm />

      <p className="contact-divider">{t.contact.divider}</p>

      <ContactLinks />
    </section>
  );
}

export default Contact;
