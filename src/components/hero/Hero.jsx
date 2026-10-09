import { useRef } from "react";
import HeroBackground from "./HeroBackground";
import WeldText from "./WeldText";
import WordReveal from "./WordReveal";
import { useLanguage } from "../../i18n/LanguageContext";
import { useReplayOnReturn } from "../../hooks/useReplayOnReturn";

// Quand on revient sur le Hero, son arrivée se rejoue (voir useReplayOnReturn). La première fois, elle
// attend 0,7 s que l'intro ait fini de se poser. Au retour, on saute ce temps mort : le premier élément
// repart presque aussitôt, et les suivants gardent leurs écarts.
const REPLAY_SKIP = 0.6;

function Hero({ onContactClick }) {
  const { lang, t } = useLanguage();
  // Le bloc épinglé : c'est lui qu'on surveille, et ce sont ses animations qu'on relance
  const pinRef = useRef(null);
  useReplayOnReturn(pinRef, REPLAY_SKIP);

  return (
    <>
      {/* Le fond du Hero : le plan en perspective. Il est posé juste AVANT la section, pas dedans
          (voir HeroBackground.jsx), et s'arrête au cordon de soudure de la section suivante. */}
      <HeroBackground />

      <section className="hero">
        {/* .hero-pin regroupe tout le contenu : après l'intro, c'est lui qui reste « épinglé »
            à l'écran pendant quelques instants de défilement (voir .hero-pin dans le CSS) */}
        <div className="hero-pin" ref={pinRef}>
          <span className="badge badge-available hero-reveal" style={{ "--reveal-delay": "0.7s" }}>
            <span className="badge-status">{t.hero.badgeStatus}</span>
            {t.hero.badgeRest}
          </span>

          {/* Le titre et le paragraphe sont regroupés : le paragraphe prend la largeur du titre.
              key={lang} : quand la langue change, React recrée ce bloc, et son apparition (les lettres
              soudées du titre, le paragraphe mot par mot) se rejoue avec le nouveau texte. */}
          <div className="hero-intro" key={lang}>
            <h1 className="hero-reveal" style={{ "--reveal-delay": "0.9s" }}>
              {t.hero.titleBefore}
              <span className="accent">
                <WeldText text={t.hero.titleWeld} delay={1.5} />
              </span>
              {t.hero.titleAfter}
            </h1>

            {/* Le paragraphe apparaît mot par mot ; les technos entre ** passent en doré */}
            <p>
              <WordReveal text={t.hero.lead} delay={1.1} />
            </p>
          </div>

          <div className="hero-actions hero-reveal" style={{ "--reveal-delay": "2s" }}>
            {/* btn-metal : le contour en laiton poli, le même que le bouton « Me contacter » de la navbar */}
            <a href="#projects" className="btn btn-primary btn-metal">
              {t.hero.seeProjects}
            </a>
            {/* btn-metal-blue : le même contour, en acier bleui (le bleu de « sécurité » et « qualité ») */}
            <button type="button" className="btn btn-metal btn-metal-blue" onClick={onContactClick}>
              {t.hero.contact}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default Hero;
