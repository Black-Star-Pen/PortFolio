import { Link } from "react-router";
import SectionTitle from "../components/SectionTitle";
import { usePageTitle } from "../hooks/usePageTitle";
import { useLanguage } from "../i18n/LanguageContext";

// Le texte des mentions légales, en français. C'est la version qui fait foi.
function FrenchNotice() {
  return (
    <>
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
    </>
  );
}

// Sa traduction anglaise : les mêmes rubriques, dans le même ordre. Si le texte français change,
// celui-ci doit changer aussi.
function EnglishNotice() {
  return (
    <>
      <h3>Site publisher</h3>
      <p>
        This site is the personal portfolio of Adam Boulkhedert, full stack developer. It is
        published on a non-professional basis.
      </p>
      <p>
        Publication director: Adam Boulkhedert.
        <br />
        Contact: through the <Link to="/#contact">contact form</Link>.
      </p>

      <h3>Hosting</h3>
      <p>
        Site host: <strong>Render Services, Inc.</strong>
        <br />
        Address: 525 Brannan Street, Suite 300, San Francisco, CA 94107, United States
        <br />
        Phone: +1 415 319 8186
        <br />
        Website: render.com
      </p>

      <h3>Intellectual property</h3>
      <p>
        The texts, design and code of this site are the property of Adam Boulkhedert, unless
        stated otherwise. The technology logos belong to their respective owners and are displayed
        through Simple Icons.
      </p>

      <h3>Personal data</h3>
      <p>
        Information on how your data is collected and used is detailed in the{" "}
        <Link to="/confidentialite">privacy policy</Link>.
      </p>
    </>
  );
}

function LegalNotice() {
  const { lang, t } = useLanguage();
  usePageTitle(t.legal.pageTitle);

  return (
    <section className="legal-page">
      <SectionTitle label={t.legal.label} title={t.legal.title} accent={t.legal.accent} />

      <article className="legal-content">{lang === "en" ? <EnglishNotice /> : <FrenchNotice />}</article>
    </section>
  );
}

export default LegalNotice;
