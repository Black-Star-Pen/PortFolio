import { useState } from "react";
import HeroBackground from "./HeroBackground";

// MODE TEST (temporaire) : pour comparer les fonds du Hero sur le vrai site. Ce fichier sera supprimé
// une fois le fond choisi, et le Hero affichera directement <HeroBackground />.
//
// Le panneau n'apparaît que :
// - en développement (npm run dev) ;
// - ou sur le site en ligne, si l'adresse contient « ?fond » (ex. : …onrender.com/?fond).
// Un visiteur normal ne voit donc ni le panneau ni aucun fond : le site reste comme avant.
const isTesting =
  import.meta.env.DEV || new URLSearchParams(window.location.search).has("fond");

const BACKGROUNDS = [
  { id: "none", label: "Aucun" },
  { id: "spot", label: "Projecteurs" },
  { id: "aurora", label: "Halos" },
  { id: "dust", label: "Poussière d'or" },
  { id: "grid", label: "Dalles" },
];

// La mémoire de l'onglet : le fond choisi reste le même si on recharge la page pendant le test
const STORAGE_KEY = "hero-fond-test";

// Hors du mode test, on n'affiche rien et on ne touche à rien (pas même à la mémoire de l'onglet)
function HeroBackgroundTest() {
  return isTesting ? <BackgroundPicker /> : null;
}

function BackgroundPicker() {
  const [variant, setVariant] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? "spot");

  function choose(id) {
    setVariant(id);
    sessionStorage.setItem(STORAGE_KEY, id);
  }

  const current = BACKGROUNDS.find((background) => background.id === variant) ?? BACKGROUNDS[0];

  return (
    <>
      <HeroBackground variant={current.id} />

      <div className="hero-bg-test">
        <p>
          Fond du Hero (test) : <strong>{current.label}</strong>
        </p>
        <div>
          {BACKGROUNDS.map((background, index) => (
            <button
              key={background.id}
              type="button"
              className={background.id === current.id ? "is-active" : ""}
              onClick={() => choose(background.id)}
              aria-pressed={background.id === current.id}
              aria-label={background.label}
              title={background.label}
            >
              {index}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default HeroBackgroundTest;
