import { useLocation, useNavigate, useSearchParams } from "react-router";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import SectionTitle from "./SectionTitle";
import { useLanguage } from "../i18n/LanguageContext";

function Projects() {
  // Les textes de la section et la liste des projets, dans la langue en cours
  const { t, data } = useLanguage();
  const projectsData = data.projects;

  // Le projet ouvert est écrit dans l'adresse : /?projet=askvera
  // Au rechargement, React relit l'adresse et rouvre la même modale.
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hash } = useLocation();

  const selectedSlug = searchParams.get("projet");
  const selectedIndex = projectsData.findIndex((project) => project.slug === selectedSlug);
  const selectedProject = projectsData[selectedIndex]; // index -1 → undefined : pas de modale

  // Le projet d'avant et celui d'après dans la liste, pour passer de l'un à l'autre sans fermer la modale.
  // On tourne en rond : avant le premier vient le dernier, après le dernier revient le premier.
  // (% = le reste de la division : avec 3 projets, la position 3 redevient 0. On ajoute « total »
  // avant de diviser pour que -1 devienne 2, et pas un nombre négatif.)
  const total = projectsData.length;
  const previousProject = projectsData[(selectedIndex - 1 + total) % total];
  const nextProject = projectsData[(selectedIndex + 1) % total];

  // Ouvre un projet (slug) ou ferme la modale (null) en changeant l'adresse.
  // - on repart des paramètres déjà présents, pour garder la langue (?lang=en) s'il y en a une
  // - replace : on remplace l'adresse au lieu d'en ajouter une à l'historique
  // - hash : on garde l'ancre (#projects), sinon ScrollToTop remonterait en haut de la page
  function changeProject(slug) {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("projet", slug);
    else params.delete("projet");

    const search = params.toString();
    navigate({ search: search ? `?${search}` : "", hash }, { replace: true });
  }

  return (
    <section id="projects">
      {/* La lampe d'atelier : sa lumière tombe du cordon de soudure, en haut de la section, sur le titre
          et les cartes (voir .section-lamp dans le CSS). aria-hidden : un décor, les lecteurs d'écran l'ignorent. */}
      <span className="section-lamp" aria-hidden="true" />

      <SectionTitle
        label={t.projects.label}
        title={t.projects.title}
        accent={t.projects.accent}
        subtitle={t.projects.subtitle}
      />

      <div className="projects-grid">
        {projectsData.map((project, index) => (
          <ProjectCard
            key={project.id}
            number={index + 1}
            title={project.title}
            category={project.category}
            description={project.description}
            technos={project.technos}
            image={project.image}
            onClick={() => changeProject(project.slug)}
          />
        ))}
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          number={selectedIndex + 1}
          total={total}
          previousProject={previousProject}
          nextProject={nextProject}
          onPrevious={() => changeProject(previousProject.slug)}
          onNext={() => changeProject(nextProject.slug)}
          onClose={() => changeProject(null)}
        />
      )}
    </section>
  );
}

export default Projects;
