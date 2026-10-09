import { Link } from "react-router";
import SectionTitle from "../components/shared/SectionTitle";
import { usePageTitle } from "../hooks/usePageTitle";
import { useLanguage } from "../i18n/LanguageContext";

// Le texte de la politique de confidentialité, en français. C'est la version qui fait foi.
function FrenchPolicy() {
  return (
    <>
      <p className="legal-updated">Dernière mise à jour : octobre 2026</p>

      <h3>Responsable du traitement</h3>
      <p>
        Adam Boulkhedert, joignable via le <Link to="/#contact">formulaire de contact</Link>.
      </p>

      <h3>Données collectées</h3>
      <p>Ce site ne collecte des données que lorsque vous remplissez le formulaire de contact :</p>
      <ul>
        <li>vos prénom, nom et adresse email ;</li>
        <li>le type de votre demande et votre message ;</li>
        <li>
          pour une offre d'emploi : le nom de l'entreprise, l'intitulé du poste, le type de
          contrat, le mode de travail, la ville et le code postal.
        </li>
      </ul>
      <p>Aucun compte n'est créé et aucun cookie de suivi ou de publicité n'est utilisé.</p>
      <p>
        Vos réglages (thème clair ou sombre, langue) sont gardés dans votre navigateur uniquement,
        pour votre prochaine visite : ils ne sont envoyés à personne. Une seule exception : quand
        vous envoyez le formulaire, la langue dans laquelle vous lisez le site est jointe à votre
        message, pour que je vous réponde dans la bonne langue.
      </p>

      <h3>Pourquoi ces données</h3>
      <p>
        Uniquement pour répondre à votre demande et, pour une offre d'emploi, pour vous envoyer
        mon CV. Elles ne sont jamais revendues, ni utilisées pour de la prospection.
      </p>

      <h3>Destinataires et services utilisés</h3>
      <ul>
        <li>
          Le site et le serveur qui reçoit le formulaire sont hébergés par <strong>Render</strong>{" "}
          (États-Unis). Le serveur du formulaire se trouve à Francfort, en Allemagne.
        </li>
        <li>
          Votre message m'est transmis par email par le service <strong>Resend</strong>{" "}
          (États-Unis), puis il est stocké dans ma boîte de réception <strong>Gmail</strong>{" "}
          (Google).
        </li>
        <li>
          Pour éviter les abus, le serveur limite le nombre d'envois par adresse IP. Cette adresse
          n'est gardée que quelques minutes, le temps du comptage, puis elle est oubliée.
        </li>
        <li>
          Pour vérifier la ville, le code postal saisi est envoyé au service public{" "}
          <strong>geo.api.gouv.fr</strong> (État français).
        </li>
        <li>
          Les polices d'écriture et les logos des technologies sont hébergés sur ce site : leur
          affichage n'envoie aucune information à un service extérieur.
        </li>
      </ul>

      <h3>Durée de conservation</h3>
      <p>
        Les messages sont conservés au maximum <strong>12 mois</strong> après notre dernier
        échange, puis supprimés.
      </p>

      <h3>Vos droits</h3>
      <p>
        Vous pouvez demander à consulter, corriger ou supprimer vos données, ou vous opposer à
        leur utilisation, en me contactant via le <Link to="/#contact">formulaire</Link>. Si
        vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à
        la <strong>CNIL</strong> (cnil.fr).
      </p>
    </>
  );
}

// Sa traduction anglaise : les mêmes rubriques, dans le même ordre. Si le texte français change,
// celui-ci doit changer aussi.
function EnglishPolicy() {
  return (
    <>
      <p className="legal-updated">Last updated: October 2026</p>

      <h3>Data controller</h3>
      <p>
        Adam Boulkhedert, who can be reached through the <Link to="/#contact">contact form</Link>.
      </p>

      <h3>Data collected</h3>
      <p>This site only collects data when you fill in the contact form:</p>
      <ul>
        <li>your first name, last name and email address;</li>
        <li>the type of your request and your message;</li>
        <li>
          for a job offer: the company name, the job title, the contract type, the work
          arrangement, the city and the postcode.
        </li>
      </ul>
      <p>No account is created and no tracking or advertising cookie is used.</p>
      <p>
        Your settings (light or dark theme, language) are kept in your browser only, for your next
        visit: they are not sent to anyone. One exception: when you send the form, the language
        you are reading the site in is attached to your message, so that I can reply in the right
        language.
      </p>

      <h3>Why this data</h3>
      <p>
        Only to reply to your request and, for a job offer, to send you my CV. It is never sold,
        nor used for marketing.
      </p>

      <h3>Recipients and services used</h3>
      <ul>
        <li>
          The site and the server that receives the form are hosted by <strong>Render</strong>{" "}
          (United States). The form server is located in Frankfurt, Germany.
        </li>
        <li>
          Your message is forwarded to me by email by the <strong>Resend</strong> service (United
          States), then stored in my <strong>Gmail</strong> inbox (Google).
        </li>
        <li>
          To prevent abuse, the server limits the number of submissions per IP address. That address
          is only kept for a few minutes, the time needed for the count, then it is forgotten.
        </li>
        <li>
          To check the city, the postcode you enter is sent to the public service{" "}
          <strong>geo.api.gouv.fr</strong> (French State).
        </li>
        <li>
          The fonts and the technology logos are hosted on this site: displaying them sends no
          information to any outside service.
        </li>
      </ul>

      <h3>Retention period</h3>
      <p>
        Messages are kept for a maximum of <strong>12 months</strong> after our last exchange, then
        deleted.
      </p>

      <h3>Your rights</h3>
      <p>
        You can ask to access, correct or delete your data, or object to its use, by contacting me
        through the <Link to="/#contact">form</Link>. If you believe your rights are not being
        respected, you can lodge a complaint with the <strong>CNIL</strong>, the French data
        protection authority (cnil.fr).
      </p>
    </>
  );
}

function PrivacyPolicy() {
  const { lang, t } = useLanguage();
  usePageTitle(t.privacy.pageTitle);

  return (
    <section className="legal-page">
      <SectionTitle label={t.privacy.label} title={t.privacy.title} accent={t.privacy.accent} />

      <article className="legal-content">{lang === "en" ? <EnglishPolicy /> : <FrenchPolicy />}</article>
    </section>
  );
}

export default PrivacyPolicy;
