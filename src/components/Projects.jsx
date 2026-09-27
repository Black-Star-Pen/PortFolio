import { useLocation, useNavigate, useSearchParams } from "react-router";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import SectionTitle from "./SectionTitle";
import projectsData from "../data/projectsData.json";

function Projects() {
  // Le projet ouvert est écrit dans l'adresse : /?projet=askvera
  // Au rechargement, React relit l'adresse et rouvre la même modale.
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hash } = useLocation();

  const selectedSlug = searchParams.get("projet");
  const selectedIndex = projectsData.findIndex((project) => project.slug === selectedSlug);
  const selectedProject = projectsData[selectedIndex]; // index -1 → undefined : pas de modale

  // Ouvre un projet (slug) ou ferme la modale (null) en changeant l'adresse.
  // - replace : on remplace l'adresse au lieu d'en ajouter une à l'historique
  // - hash : on garde l'ancre (#projects), sinon ScrollToTop remonterait en haut de la page
  function changeProject(slug) {
    navigate({ search: slug ? `?projet=${slug}` : "", hash }, { replace: true });
  }

  return (
    <section id="projects">
      <SectionTitle
        label="Réalisations"
        title="Des idées devenues"
        accent="des projets concrets."
        subtitle="Quelques projets conçus et développés de la maquette à la mise en ligne."
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
          onClose={() => changeProject(null)}
        />
      )}
    </section>
  );
}

export default Projects;