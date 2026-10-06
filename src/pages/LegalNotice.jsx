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
        {/* Les coordonnées de l'hébergeur sont celles qu'il publie dans ses conditions d'utilisation
            (render.com/terms), relevées le 6 octobre 2026. À revérifier si le site change d'hébergeur. */}
        <p>
          Hébergeur du site : <strong>Render Services, Inc.</strong>
          <br />
          Adresse : 525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis
          <br />
          Téléphone : +1 415 319 8186
          <br />
          Site : render.com
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