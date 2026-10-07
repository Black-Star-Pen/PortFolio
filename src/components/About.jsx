import Epure from "./Epure";
import SectionTitle from "./SectionTitle";
import Timeline from "./Timeline";

function About() {
  return (
    <section id="about">
      {/* Le fond de la section : une épure technique qui se trace (voir Epure.jsx) */}
      <Epure />

      {/* Sur grand écran, .about-layout met ses deux enfants côte à côte : la présentation à gauche
          (.about-intro), le parcours à droite (Timeline). Sur petit écran, ils s'empilent. Voir le CSS. */}
      <div className="about-layout">
        <div className="about-intro">
          <SectionTitle
            label="À propos"
            title="Du métal au code,"
            accent="le goût du travail bien fait."
          />

          {/* Un <div> et plusieurs <p> : un paragraphe par étape du parcours.
              Dans chacun, deux passages en doré (classe « highlight », la même que dans les fiches projet) :
              d'où je viens, et ce que j'en ai gardé.
              &nbsp; est une espace insécable : elle empêche un « : » ou un tiret de se retrouver seul
              en début ou en fin de ligne. */}
          <div className="about-text">
            <p>
              Mon parcours a débuté en{" "}
              <strong className="highlight">chaudronnerie industrielle</strong>&nbsp;: déchiffrer un
              plan technique, respecter une cote au millimètre et ne rien laisser au hasard. Cet
              atelier m'a inculqué le sens de la structure, de la précision et de la{" "}
              <strong className="highlight">rigueur d'exécution</strong>.
            </p>
            <p>
              J'ai ensuite exercé pendant trois ans dans l'
              <strong className="highlight">hôtellerie 4 et 5 étoiles</strong>. Ce milieu m'a appris
              la réactivité sous pression, la coordination d'équipe et le{" "}
              <strong className="highlight">sens aigu du service</strong>, où chaque détail compte
              pour l'expérience finale.
            </p>
            <p>
              Depuis 2024, je transpose ces exigences dans le{" "}
              <strong className="highlight">développement web</strong>. Je conçois des applications
              de bout en bout —&nbsp;de la maquette au déploiement&nbsp;— avec le même principe
              directeur qu'à l'atelier&nbsp;: une pièce n'est achevée que lorsqu'elle est{" "}
              <strong className="highlight">parfaitement juste</strong>.
            </p>
          </div>
        </div>

        <Timeline />
      </div>
    </section>
  );
}

export default About;
