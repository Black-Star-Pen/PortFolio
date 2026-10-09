// Un texte dont les lettres sont « soudées » une par une :
// d'abord tracées au trait (comme sur un plan), puis chauffées à blanc, puis refroidies en doré.
//
// text  : le texte à animer
// delay : le moment (en secondes) où la première lettre est soudée
function WeldText({ text, delay = 0 }) {
  // [...text] découpe le texte en caractères : "web" → ["w", "e", "b"]
  const characters = [...text];

  return (
    <span className="weld-text">
      {/* Les lecteurs d'écran lisent le mot entier, pas une lettre à la fois */}
      <span className="sr-only">{text}</span>

      <span aria-hidden="true">
        {characters.map((character, index) =>
          character === " " ? (
            // Un vrai espace (pas dans un <span>) : le navigateur peut passer à la ligne ici
            " "
          ) : (
            <span
              key={index}
              className="weld-letter"
              // --i : la position de la lettre, utilisée par le CSS pour décaler chaque soudure
              style={{ "--i": index, "--weld-delay": `${delay}s` }}
            >
              {character}
            </span>
          )
        )}
      </span>
    </span>
  );
}

export default WeldText;