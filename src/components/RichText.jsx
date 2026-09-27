// Affiche un texte en mettant en valeur les mots entourés de ** (comme en Markdown).
// Exemple dans le JSON : "avec l'aide de **Claude Code**"
//
// Pourquoi pas du HTML directement dans le JSON (avec dangerouslySetInnerHTML) ?
// Parce que React insèrerait ce HTML tel quel : si un jour le texte vient d'ailleurs
// (un formulaire, une API), quelqu'un pourrait y glisser du code malveillant (faille XSS).
// Ici, on découpe le texte nous-mêmes : React n'affiche que du texte, jamais du code.
function RichText({ text }) {
  if (!text) return null;

  // split avec des parenthèses dans l'expression garde aussi les morceaux trouvés :
  // "a **b** c".split(/\*\*(.+?)\*\*/) → ["a ", "b", " c"]
  // Les morceaux aux positions impaires (1, 3, 5…) sont donc ceux entre ** **.
  const parts = text.split(/\*\*(.+?)\*\*/);

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="highlight">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

export default RichText;