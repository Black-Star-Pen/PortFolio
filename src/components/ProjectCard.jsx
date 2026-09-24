function ProjectCard({ title, description, technos, image, link }) {
    return (
        <article>
            <h3>{title}</h3>
            <p>{description}</p>
            <p>{technos.join(" . ")}</p>
            <img src={image} alt={title} />
            <a href={link} target="_blank" rel="noreferrer">Voir le projet sur GitHub</a>


        </article>
    )
}

export default ProjectCard;