import { useState, useRef, useEffect } from "react";
import SectionTitle from "./SectionTitle";
import SkillPanel from "./SkillPanel";
import Weld from "./Weld";
import skillsData from "../data/skillsData.json";

function Skills() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef(null);
  const activeSkill = skillsData[activeIndex];

  function updateScrollState() {
    const tabs = tabsRef.current;
    if (!tabs) return;

    setCanScrollLeft(tabs.scrollLeft > 0);
    setCanScrollRight(
      tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 1,
    );
  }

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  function scrollTabs(direction) {
    tabsRef.current.scrollBy({ left: direction * 160, behavior: "smooth" });
  }

  return (
    <section id="skills">
      <SectionTitle
        label="Compétences"
        title="Une boîte à outils"
        accent="pour chaque étape d'un projet."
        subtitle="Ouvre un tiroir de l'établi pour découvrir les outils que j'utilise."
      />

      <div className="blueprint">
        <div className="skills-tabs-wrapper">
          {canScrollLeft && (
            <button
              className="tabs-arrow tabs-arrow-left"
              onClick={() => scrollTabs(-1)}
              aria-label="Voir les onglets précédents"
            >
              <span>‹</span>
            </button>
          )}

          <div
            className="skills-tabs"
            role="tablist"
            ref={tabsRef}
            onScroll={updateScrollState}
          >
            {skillsData.map((skill, index) => (
              <button
                key={skill.id}
                className={`skills-tab ${index === activeIndex ? "active" : ""}`}
                onClick={() => setActiveIndex(index)}
                role="tab"
                aria-selected={index === activeIndex}
              >
                {index === activeIndex && <Weld />}
                <span className="skills-tab-ref">
                  REF. {String(index + 1).padStart(2, "0")}
                </span>
                {skill.title}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button
              className="tabs-arrow tabs-arrow-right"
              onClick={() => scrollTabs(1)}
              aria-label="Voir les onglets suivants"
            >
              <span>›</span>
            </button>
          )}
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
