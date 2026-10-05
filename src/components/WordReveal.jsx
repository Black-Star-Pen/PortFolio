// Un texte qui apparaît mot par mot, avec deux façons de mettre un mot en valeur :
//   **mot** → doré, avec un éclat de soudure classique
//   __mot__ → bleu acier, avec un éclat de soudure TIG (blanc bleuté)
//
// text  : le texte, par ex. "avec **React** et la __sécurité__"
// delay : le moment (en secondes) où apparaît le premier mot
// step  : l'écart (en secondes) entre deux mots
function WordReveal({ text, delay = 0, step = 0.03 }) {
  // 1. On sépare les morceaux normaux, ceux entre ** et ceux entre __.
  //    Les parenthèses dans l'expression gardent les morceaux trouvés, marqueurs compris.
  const parts = text.split(/(\*\*.+?\*\*|__.+?__)/);

  // 2. Pour chaque morceau : son style, puis on le découpe en mots ET en espaces.
  //    split(/(\s+)/) garde les espaces : "React" puis "," restent collés, comme dans le texte.
  const pieces = [];
  let plainText = ""; // le texte sans les marqueurs, pour les lecteurs d'écran

  parts.forEach((part) => {
    let variant = "";
    let content = part;

    if (part.startsWith("**") && part.endsWith("**")) {
      variant = "reveal-word-highlight";
      content = part.slice(2, -2); // on retire les 2 caractères du début et de la fin
    } else if (part.startsWith("__") && part.endsWith("__")) {
      variant = "reveal-word-steel";
      content = part.slice(2, -2);
    }

    plainText += content;
    content
      .split(/(\s+)/)
      .filter((piece) => piece !== "")
      .forEach((piece) => pieces.push({ piece, variant }));
  });

  let wordIndex = 0; // compte seulement les mots (pas les espaces) pour le décalage

  return (
    <>
      <span className="sr-only">{plainText}</span>

      <span aria-hidden="true">
        {pieces.map(({ piece, variant }, index) => {
          // Un espace : on le laisse tel quel, le navigateur peut y passer à la ligne
          if (/^\s+$/.test(piece)) return piece;

          const delayForThisWord = delay + wordIndex * step;
          wordIndex += 1;

          return (
            <span
              key={index}
              className={`reveal-word ${variant}`}
              style={{ "--word-delay": `${delayForThisWord}s` }}
            >
              {piece}
            </span>
          );
        })}
      </span>
    </>
  );
}

export default WordReveal;