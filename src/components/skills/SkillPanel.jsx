import technoIcons from "../../data/technoIcons";
import projectsData from "../../data/projectsData.json";
import Weld from "../shared/Weld";
import { useLanguage } from "../../i18n/LanguageContext";

// isWelded : ce tiroir a déjà été ouvert, son encadré est donc déjà soudé (voir Skills.jsx)
// isFirst : c'est le panneau affiché quand la boîte à outils apparaît. Lui seul joue l'animation
//           d'arrivée (voir reveal-drawers dans le CSS) ; les suivants s'affichent normalement.
function SkillPanel({ skill, reference, isWelded, isFirst }) {
  const { t } = useLanguage();
  const refNumber = String(reference).padStart(2, "0");

  return (
    <div className={`skill-panel ${isFirst ? "skill-panel-first" : ""}`} role="tabpanel">
      <Weld isDone={isWelded} />
      <div className="cartouche-header">
        <span>REF. {refNumber}</span>
        <h3>{skill.title}</h3>
      </div>

      <p className="skill-panel-description">{skill.description}</p>

      <ul className="tool-grid">
        {skill.technos.map((techno, index) => {
          const slug = technoIcons[techno];
          const usedIn = projectsData.filter((project) =>
            project.technos.includes(techno),
          );

          return (
            // --i : le rang de l'outil, pour qu'ils se posent l'un après l'autre (voir tool-drop dans le CSS)
            <li key={techno} className="tool-tile" style={{ "--i": index }}>
              {slug && (
                <img
                  src={`/icons/${slug}.svg`}
                  alt=""
                  width="32"
                  height="32"
                />
              )}
              <span className="tool-name">{techno}</span>
              <span className="tool-usage">
                {usedIn.length > 0
                  ? usedIn.map((project) => project.title).join(" · ")
                  : t.skills.upcoming}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="cartouche-footer">
        <span>{t.skills.scale}</span>
        <span>
          {t.skills.tools} : {skill.technos.length}
        </span>
        <span>{t.skills.revision} 2026</span>
      </div>
    </div>
  );
}

export default SkillPanel;
