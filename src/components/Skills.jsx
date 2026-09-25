import { useState } from "react";
import SectionTitle from "./SectionTitle";
import SkillPanel from "./SkillPanel";
import skillsData from "../data/skillsData.json";

function Skills() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSkill = skillsData[activeIndex];

  return (
    <section id="skills">
      <SectionTitle
        label="Compétences"
        title="Une boîte à outils"
        accent="pour chaque étape du projet."
        subtitle="Ouvre un tiroir de l'établi pour découvrir les outils que j'utilise."
      />

      <div className="blueprint">
        <div className="skills-tabs" role="tablist">
          {skillsData.map((skill, index) => (
            <button
              key={skill.id}
              className={`skills-tab ${index === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(index)}
              role="tab"
              aria-selected={index === activeIndex}
            >
              <span className="skills-tab-ref">
                REF. {String(index + 1).padStart(2, "0")}
              </span>
              {skill.title}
            </button>
          ))}
        </div>

        <SkillPanel
          key={activeSkill.id}
          skill={activeSkill}
          reference={activeIndex + 1}
        />
      </div>
    </section>
  );
}

export default Skills;
