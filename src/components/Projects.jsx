import ProjectCard from "./ProjectCard";
import projectsData from "../data/projectsdata.json";
import SectionTitle from "./SectionTitle";

function Projects() {
    return (
        <section id="projects">
            <SectionTitle
            label="Réalisations"
            title="Des idées devenues "
            accent="des projets concrets"
            subtitle="Quelques projets conçus et développés de la maquette à la mise en ligne."
            />

            {projectsData.map((project) => (
                <ProjectCard
                    key={project.id}
                    title={project.title}
                    description={project.description}
                    technos={project.technos}
                    image={project.image}
                    link={project.link}
                />
            ))}
        </section>      
    );
}

export default Projects;
