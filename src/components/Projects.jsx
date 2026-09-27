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
  // Un nom inconnu dans l'adresse (?projet=nimportequoi) : find renvoie undefined, pas de modale
  const selectedProject = projectsData.find((project) => project.slug === selectedSlug);

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
        {projectsData.map((project) => (
          <ProjectCard
            key={project.id}
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
        <ProjectModal project={selectedProject} onClose={() => changeProject(null)} />
      )}
    </section>
  );
}

export default Projects;