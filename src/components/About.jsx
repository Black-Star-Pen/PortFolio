import SectionTitle from "./SectionTitle";
import Timeline from "./Timeline";

function About() {
  return (
    <section id="about">
      <SectionTitle
        label="À propos"
        title="Du métal au code,"
        accent="le goût du travail bien fait."
      />

      {/* Un <div> et plusieurs <p> : un paragraphe par étape du parcours */}
      <div className="about-text">
        <p>
          J'ai commencé par un BTS en chaudronnerie industrielle : lire un plan, respecter une
          cote au millimètre, ne rien laisser au hasard. Sans alternance, j'aurais dû quitter
          l'école en décembre ; grâce à mes résultats, elle m'a gardé jusqu'en avril.
        </p>
        <p>
          J'ai ensuite passé trois ans dans l'hôtellerie 4 et 5 étoiles, où j'ai appris le
          travail en équipe, la gestion des priorités et l'exigence du détail.
        </p>
        <p>
          Depuis 2024, je mets cette rigueur au service du code : je conçois des applications
          web de bout en bout, de la maquette à la mise en ligne, avec la même règle qu'à
          l'atelier : une pièce n'est finie que lorsqu'elle est juste.
        </p>
      </div>

      <Timeline />
    </section>
  );
}

export default About;