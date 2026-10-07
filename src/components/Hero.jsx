import HeroBackground from "./HeroBackground";
import WeldText from "./WeldText";
import WordReveal from "./WordReveal";

function Hero({ onContactClick }) {
  return (
    <>
      {/* Le fond du Hero : le plan en perspective. Il est posé juste AVANT la section, pas dedans
          (voir HeroBackground.jsx), et s'arrête au cordon de soudure de la section suivante. */}
      <HeroBackground />

      <section className="hero">
        {/* .hero-pin regroupe tout le contenu : après l'intro, c'est lui qui reste « épinglé »
            à l'écran pendant quelques instants de défilement (voir .hero-pin dans le CSS) */}
        <div className="hero-pin">
          <span className="badge badge-available hero-reveal" style={{ "--reveal-delay": "0.7s" }}>
            <span className="badge-status">Disponible</span> · Développeur full stack · Paris
          </span>

          {/* Le titre et le paragraphe sont regroupés : le paragraphe prend la largeur du titre */}
          <div className="hero-intro">
            <h1 className="hero-reveal" style={{ "--reveal-delay": "0.9s" }}>
              Je transforme des idées en{" "}
              <span className="accent">
                <WeldText text="Applications Web" delay={1.5} />
              </span>{" "}
              concrètes.
            </h1>

            {/* Le paragraphe apparaît mot par mot ; les technos entre ** passent en doré */}
            <p>
              <WordReveal
                text="De la maquette à la mise en ligne, je conçois des applications web complètes avec **React**, **TypeScript**, **Node.js** et **PostgreSQL**, en gardant la __sécurité__ et la __qualité__ du code au cœur du travail."
                delay={1.1}
              />
            </p>
          </div>

          <div className="hero-actions hero-reveal" style={{ "--reveal-delay": "2s" }}>
            {/* btn-metal : le contour en laiton poli, le même que le bouton « Me contacter » de la navbar */}
            <a href="#projects" className="btn btn-primary btn-metal">
              Voir mes projets
            </a>
            {/* btn-metal-blue : le même contour, en acier bleui (le bleu de « sécurité » et « qualité ») */}
            <button type="button" className="btn btn-metal btn-metal-blue" onClick={onContactClick}>
              Me contacter
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default Hero;
