import { useEffect } from "react";
import { replayAnimations, watchReturn } from "../utils/replay";

// Rejoue les animations d'arrivée d'un bloc chaque fois qu'on revient dessus après l'avoir quitté
// (en remontant la page, ou en redescendant).
//
// ref  : la référence du bloc à surveiller, celle qu'on donne à son attribut ref
// skip : le temps (en secondes) à sauter au début des animations, voir replayAnimations
//
// Toute la mécanique est dans src/utils/replay.js : ce hook ne fait que la brancher sur un composant,
// et la débrancher quand il disparaît.
export function useReplayOnReturn(ref, skip = 0) {
  useEffect(() => {
    const element = ref.current;
    // watchReturn renvoie sa fonction d'arrêt : en la renvoyant à notre tour, React l'appellera
    // quand le composant quittera la page
    return watchReturn(element, () => replayAnimations(element, skip));
  }, [ref, skip]);
}
