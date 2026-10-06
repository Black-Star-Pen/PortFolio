import SectionTitle from "./SectionTitle";
import ContactForm from "./ContactForm";
import ContactLinks from "./ContactLinks";

function Contact() {
  return (
    <section id="contact">
      {/* &nbsp; est une espace insécable : sur un écran étroit, le « ? » ne se retrouve pas seul à la ligne */}
      <SectionTitle
        label="Contact"
        title="Un poste ou un projet&nbsp;?"
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