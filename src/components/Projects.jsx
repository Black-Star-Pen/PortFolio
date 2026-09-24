import ProjectCard from "./ProjectCard";
import projectsData from "../data/projectsdata.json";

function Projects() {
    return (
        <section>
            <h2>Mes projets</h2>

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
