import SectionTitle from "./SectionTitle";
import ContactForm from "./ContactForm";
import ContactLinks from "./ContactLinks";
import GoldDust from "./GoldDust";

function Contact() {
  return (
    <section id="contact">
      {/* Le fond de la section : la poussière d'or (voir GoldDust.jsx) */}
      <GoldDust />

      {/* Le titre est écrit en JSX (et pas en simple texte) pour pouvoir mettre un seul mot en valeur :
          « poste » passe en doré, comme « Applications Web » dans le titre du Hero, et il est souligné
          à la main, de deux coups de crayon.
          Le soulignage est un petit dessin SVG posé sous le mot (voir .title-underline dans le CSS).
          pathLength="1" dit au navigateur de compter la longueur de chaque trait comme valant 1 :
          le CSS peut alors le tracer de 0 à 1 sans connaître sa vraie longueur.
          aria-hidden : c'est un décor, un lecteur d'écran n'a pas à l'annoncer.
          &nbsp; est une espace insécable : sur un écran étroit, le « ? » ne se retrouve pas seul à la ligne. */}
      <SectionTitle
        label="Contact"
        title={
          <>
            Un{" "}
            <span className="accent title-underline">
              poste
              <svg viewBox="0 0 100 13" aria-hidden="true">
                <path pathLength="1" d="M2 5.5 C 30 2.5, 66 3.5, 98 5" />
                <path pathLength="1" d="M12 10.5 C 40 8, 68 9.5, 90 9.5" />
              </svg>
            </span>{" "}
            ou un projet&nbsp;?
          </>
        }
        accent="Parlons-en."
        subtitle="Une idée, une mission ou une offre de poste : remplissez l'ordre de fabrication ou écrivez-moi directement, je vous réponds sous 48 heures."
      />

      <ContactForm />

      <p className="contact-divider">ou contactez-moi directement</p>

      <ContactLinks />
    </section>
  );
}

export default Contact;