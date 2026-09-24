import ProjectCard from "./ProjectCard";
import projectsData from "../data/projectsdata.json";
import SectionTitle from "./SectionTitle";

function Projects() {
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
            link={project.link}
          />
        ))}
      </div>
    </section>
  );
}

export default Projects;