// Le bord du haut du pied de page : au lieu d'un trait droit, une tôle découpée, avec une languette
// au milieu et son trou de fixation. La forme est dessinée deux fois : une fois pleine, de la couleur
// du pied de page (elle le prolonge vers le haut), et une fois en trait doré, qui suit son bord.
// Sa place et sa taille sont dans le CSS (voir .footer-edge, section 17).
function FooterEdge() {
  return (
    // Un dessin très large (3000) dont on ne voit que le milieu (« slice ») : la languette garde ainsi
    // sa taille, quelle que soit la largeur de l'écran. aria-hidden : un décor.
    <svg
      className="footer-edge"
      viewBox="0 0 3000 30"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        {/* Le dégradé du trait doré : lumineux au milieu, il s'estompe à 750 de chaque côté, la longueur
            d'un cordon de soudure (1500). offset = la position le long du trait, de 0 à 1. */}
        <linearGradient id="footer-edge-gold" gradientUnits="userSpaceOnUse" x1="750" x2="2250">
          <stop offset="0" stopColor="#d6bf94" stopOpacity="0" />
          <stop offset="0.15" stopColor="#d6bf94" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#d6bf94" />
          <stop offset="0.85" stopColor="#d6bf94" stopOpacity="0.25" />
          <stop offset="1" stopColor="#d6bf94" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* M = le départ, H = un trait horizontal, L = un trait en biais : la languette monte de 28 */}
      <path className="footer-edge-fill" d="M0 29 H1310 L1332 1 H1668 L1690 29 H3000 V30 H0 Z" />
      <path
        className="footer-edge-line"
        stroke="url(#footer-edge-gold)"
        d="M0 29 H1310 L1332 1 H1668 L1690 29 H3000"
      />
      {/* Le trou de fixation de la languette */}
      <circle className="footer-edge-hole" cx="1500" cy="15" r="5" />
    </svg>
  );
}

export default FooterEdge;
