import { useState } from "react";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import SectionTitle from "./SectionTitle";
import projectsData from "../data/projectsdata.json";

function Projects() {
  const [selectedProject, setSelectedProject] = useState(null);

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
            onClick={() => setSelectedProject(project)}
          />
        ))}
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}

export default Projects;
