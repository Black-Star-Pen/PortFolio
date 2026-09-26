import { Link } from "react-router";
import SectionTitle from "../components/SectionTitle";

function PrivacyPolicy() {
  return (
    <section className="legal-page">
      <SectionTitle label="Vos données" title="Politique de" accent="confidentialité." />

      <article className="legal-content">
        <p className="legal-updated">Dernière mise à jour : septembre 2026</p>

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

        <h3>Pourquoi ces données</h3>
        <p>
          Uniquement pour répondre à votre demande et, pour une offre d'emploi, pour vous envoyer
          mon CV. Elles ne sont jamais revendues, ni utilisées pour de la prospection.
        </p>

        <h3>Destinataires et services utilisés</h3>
        <ul>
          <li>
            Votre message m'est transmis par email via <strong>Gmail</strong> (Google). Vos données
            sont donc stockées dans ma boîte de réception.
          </li>
          <li>
            Pour vérifier la ville, le code postal saisi est envoyé au service public{" "}
            <strong>geo.api.gouv.fr</strong> (État français).
          </li>
          <li>
            Les polices d'écriture (Google Fonts) et les logos des technologies (Simple Icons) sont
            chargés depuis des serveurs externes, qui reçoivent à cette occasion l'adresse IP de
            votre appareil.
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
      </article>
    </section>
  );
}

export default PrivacyPolicy;