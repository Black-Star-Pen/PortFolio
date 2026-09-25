import technoIcons from "../data/technoIcons";
import projectsData from "../data/projectsData.json";
import Weld from "./Weld";

function SkillPanel({ skill, reference }) {
  const refNumber = String(reference).padStart(2, "0");

  return (
    <div className="skill-panel" role="tabpanel">
      <Weld />
      <div className="cartouche-header">
        <span>REF. {refNumber}</span>
        <h3>{skill.title}</h3>
      </div>

      <p className="skill-panel-description">{skill.description}</p>

      <ul className="tool-grid">
        {skill.technos.map((techno) => {
          const slug = technoIcons[techno];
          const usedIn = projectsData.filter((project) =>
            project.technos.includes(techno),
          );

          return (
            <li key={techno} className="tool-tile">
              {slug && (
                <img
                  src={`https://cdn.simpleicons.org/${slug}/d6bf94`}
                  alt=""
                  width="32"
                  height="32"
                />
              )}
              <span className="tool-name">{techno}</span>
              <span className="tool-usage">
                {usedIn.length > 0
                  ? usedIn.map((project) => project.title).join(" · ")
                  : "Projets à venir"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="cartouche-footer">
        <span>ÉCH. 1:1</span>
        <span>OUTILS : {skill.technos.length}</span>
        <span>RÉV. 2026</span>
      </div>
    </div>
  );
}

export default SkillPanel;
