import { Link } from "react-router";
import SectionTitle from "../components/SectionTitle";
import { usePageTitle } from "../hooks/usePageTitle";

function LegalNotice() {
  usePageTitle("Mentions légales");

  return (
    <section className="legal-page">
      <SectionTitle label="Informations" title="Mentions" accent="légales." />

      <article className="legal-content">
        <h3>Éditeur du site</h3>
        <p>
          Ce site est le portfolio personnel d'Adam Boulkhedert, développeur full stack. Il est
          édité à titre non professionnel.
        </p>
        <p>
          Directeur de la publication : Adam Boulkhedert.
          <br />
          Contact : via le <Link to="/#contact">formulaire de contact</Link>.
        </p>

        <h3>Hébergement</h3>
        {/* ⚠️ À COMPLÉTER lors de la mise en ligne, avec les informations exactes de l'hébergeur */}
        <p>
          Hébergeur du site : <strong>[nom de l'hébergeur]</strong>
          <br />
          Adresse : <strong>[adresse postale de l'hébergeur]</strong>
          <br />
          Téléphone : <strong>[numéro de téléphone de l'hébergeur]</strong>
        </p>

        <h3>Propriété intellectuelle</h3>
        <p>
          Les textes, le design et le code de ce site sont la propriété d'Adam Boulkhedert, sauf
          mention contraire. Les logos des technologies appartiennent à leurs propriétaires
          respectifs et sont affichés via Simple Icons.
        </p>

        <h3>Données personnelles</h3>
        <p>
          Les informations sur la collecte et l'utilisation de vos données sont détaillées dans la{" "}
          <Link to="/confidentialite">politique de confidentialité</Link>.
        </p>
      </article>
    </section>
  );
}

export default LegalNotice;