import Epure from "./Epure";
import RichText from "../shared/RichText";
import SectionTitle from "../shared/SectionTitle";
import Timeline from "./Timeline";
import { useLanguage } from "../../i18n/LanguageContext";

function About() {
  const { t } = useLanguage();

  return (
    <section id="about">
      {/* Le fond de la section : une épure technique qui se trace (voir Epure.jsx) */}
      <Epure />

      {/* Sur grand écran, .about-layout met ses deux enfants côte à côte : la présentation à gauche
          (.about-intro), le parcours à droite (Timeline). Sur petit écran, ils s'empilent. Voir le CSS. */}
      <div className="about-layout">
        <div className="about-intro">
          <SectionTitle label={t.about.label} title={t.about.title} accent={t.about.accent} />

          {/* Un <div> et plusieurs <p> : un paragraphe par étape du parcours.
              Les textes sont dans src/i18n/texts.js. Dans chacun, deux passages entre ** passent en doré
              (RichText, comme dans les fiches projet) : d'où je viens, et ce que j'en ai gardé. */}
          <div className="about-text">
            {t.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>
        </div>

        <Timeline />
      </div>
    </section>
  );
}

export default About;
