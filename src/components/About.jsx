import SectionTitle from "./SectionTitle";

function About() {
  return (
    <section id="about">
      <SectionTitle
        label="À propos"
        title="Du métal au code,"
        accent="le goût du travail bien fait."
      />
      <p className="about-text">
        Je suis un développeur passionné par la création d'applications web
        et mobiles. J'aime apprendre de nouvelles technologies et relever des
        défis techniques.
      </p>
    </section>
  );
}

export default About;