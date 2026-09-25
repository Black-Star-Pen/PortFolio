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
      <p className="about-text">
        Avant d'écrire du code, je lisais des plans et je façonnais du métal.
        L'hôtellerie de luxe m'a ensuite appris l'exigence du service et le
        souci du détail. Aujourd'hui, je mets cette rigueur au profit du
        développement d'applications web, de la conception à la mise en ligne.
      </p>
      <Timeline />
    </section>
  );
}

export default About;
