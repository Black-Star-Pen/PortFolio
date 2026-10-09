import { useState, useRef, useEffect } from "react";
import Pegboard from "./Pegboard";
import SectionTitle from "../shared/SectionTitle";
import SkillPanel from "./SkillPanel";
import Weld from "../shared/Weld";
import { useLanguage } from "../../i18n/LanguageContext";

function Skills() {
  // Les textes de la section et la liste des tiroirs, dans la langue en cours
  const { t, data } = useLanguage();
  const skillsData = data.skills;
  const [activeIndex, setActiveIndex] = useState(0);
  // Les tiroirs déjà ouverts une fois. Leur encadré a eu sa soudure : quand on y revient,
  // on l'affiche déjà en place au lieu de la rejouer depuis le début.
  const [weldedIds, setWeldedIds] = useState([]);
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

  function openDrawer(index) {
    if (index === activeIndex) return;

    // Le tiroir qu'on quitte a eu sa soudure : on s'en souvient avant d'ouvrir l'autre
    setWeldedIds((ids) => (ids.includes(activeSkill.id) ? ids : [...ids, activeSkill.id]));
    setActiveIndex(index);
  }

  return (
    <section id="skills">
      {/* Le fond de la section : le panneau perforé de l'atelier (voir Pegboard.jsx) */}
      <Pegboard />

      <SectionTitle
        label={t.skills.label}
        title={t.skills.title}
        accent={t.skills.accent}
        subtitle={t.skills.subtitle}
      />

      <div className="blueprint">
        <div className="skills-tabs-wrapper">
          {canScrollLeft && (
            <button
              className="tabs-arrow tabs-arrow-left"
              onClick={() => scrollTabs(-1)}
              aria-label={t.skills.previousTabs}
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
                onClick={() => openDrawer(index)}
                role="tab"
                aria-selected={index === activeIndex}
                // --i : le rang du tiroir, pour qu'ils arrivent l'un après l'autre (voir reveal-drawers)
                style={{ "--i": index }}
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
              aria-label={t.skills.nextTabs}
            >
              <span>›</span>
            </button>
          )}
        </div>

        <SkillPanel
          key={activeSkill.id}
          skill={activeSkill}
          reference={activeIndex + 1}
          isWelded={weldedIds.includes(activeSkill.id)}
          // Tant qu'on n'a changé de tiroir aucune fois, c'est le panneau présent à l'arrivée de la boîte
          isFirst={weldedIds.length === 0}
        />
      </div>
    </section>
  );
}

export default Skills;
