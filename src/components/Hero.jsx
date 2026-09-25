function Hero({ onContactClick }) {
  return (
    <section className="hero">
      <span className="badge">2 ans · Développeur Full-Stack · Paris</span>

      <h1>
        Je transforme des idées en{" "}
        <span className="accent">applications web</span> concrètes.
      </h1>

      <p>
        De la maquette à la mise en production, je conçois des applications web
        avec React, Node.js et bien d'autres technologies.
      </p>

      <div className="hero-actions">
        <a href="#projects" className="btn btn-primary">
          Voir mes projets
        </a>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onContactClick}
        >
          Me contacter
        </button>
      </div>
    </section>
  );
}

export default Hero;
