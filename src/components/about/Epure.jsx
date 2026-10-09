import { useRef } from "react";
import { useReplayOnReturn } from "../../hooks/useReplayOnReturn";

// L'épure : le fond de la section À propos. Un dessin technique de chaudronnier, tracé en traits fins :
// à droite une bride vue de face (ses cercles, ses huit trous, ses axes, ses cotes), à gauche le
// développé d'un tronc de cône (deux arcs et leurs génératrices).
// Le dessin se trace quand la section arrive à l'écran (voir « L'épure » dans le CSS, about.css),
// puis ne bouge plus : il reste discret derrière le texte. Il se retrace chaque fois qu'on revient
// sur la section après l'avoir quittée (voir useReplayOnReturn).
//
// Tout est dessiné dans un cadre de 1600 × 900 (le viewBox du SVG). Les formes sont calculées
// ci-dessous à partir de quelques mesures, plutôt qu'écrites point par point.

const FLANGE = { x: 1330, y: 470, outer: 250, bolts: 190, holes: 8 }; // la bride : centre et rayons
const CONE = { x: 120, y: 130, inner: 260, outer: 430, from: 8, to: 82, lines: 7 }; // le développé du cône

// Un point sur un cercle : son centre, son rayon, et l'angle en degrés (0 = à droite, 90 = en bas).
// Renvoie « x y », arrondi au dixième, prêt à écrire dans un tracé SVG.
function pointOn(center, radius, degrees) {
  const angle = (degrees * Math.PI) / 180;
  const x = center.x + radius * Math.cos(angle);
  const y = center.y + radius * Math.sin(angle);
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

// Les huit trous de la bride, répartis sur le cercle de perçage
const holes = Array.from({ length: FLANGE.holes }, (_, index) =>
  pointOn(FLANGE, FLANGE.bolts, 22.5 + (index * 360) / FLANGE.holes).split(" ")
);

// Les génératrices du cône : des traits droits, de l'arc intérieur à l'arc extérieur, à angles réguliers
const generators = Array.from({ length: CONE.lines }, (_, index) => {
  const degrees = CONE.from + (index * (CONE.to - CONE.from)) / (CONE.lines - 1);
  return `M${pointOn(CONE, CONE.inner, degrees)} L${pointOn(CONE, CONE.outer, degrees)}`;
});

// Un arc du cône, du premier angle au dernier (A = arc de cercle : rayon, rayon, puis son arrivée)
function coneArc(radius) {
  return `M${pointOn(CONE, radius, CONE.from)} A${radius} ${radius} 0 0 1 ${pointOn(CONE, radius, CONE.to)}`;
}

// Les classes du dessin (voir le CSS) :
//   epure-shape : les formes, en doré        epure-line : un trait qui se trace (pathLength="1")
//   epure-axis  : les axes, en trait mixte   epure-fade : un groupe qui apparaît en fondu
//   epure-dim   : les cotes, en bleu         --i : l'ordre de passage (plus il est grand, plus c'est tard)
function Epure() {
  const rootRef = useRef(null);
  useReplayOnReturn(rootRef);

  return (
    // aria-hidden : un décor, les lecteurs d'écran l'ignorent
    <div className="section-bg" aria-hidden="true" ref={rootRef}>
      {/* La « vue » reste à l'écran pendant qu'on parcourt la section (voir .section-bg-view) */}
      <div className="section-bg-view">
        {/* xMaxYMid slice : le dessin remplit la vue en gardant ses proportions. Sur un écran étroit,
            c'est son côté droit (la bride) qui reste visible. */}
        <svg className="epure" viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMid slice">
          <defs>
            {/* La pointe de flèche des cotes */}
            <marker
              id="epure-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path className="epure-arrow" d="M0 1 L10 5 L0 9 Z" />
            </marker>
          </defs>

          {/* Les formes : la bride, puis le cône */}
          <g className="epure-shape">
            {[FLANGE.outer, 128, 110].map((radius, index) => (
              <circle
                key={radius}
                className="epure-line"
                style={{ "--i": index }}
                pathLength="1"
                cx={FLANGE.x}
                cy={FLANGE.y}
                r={radius}
              />
            ))}
            {holes.map(([x, y], index) => (
              <circle
                key={`${x}-${y}`}
                className="epure-line"
                style={{ "--i": 3 + index * 0.3 }}
                pathLength="1"
                cx={x}
                cy={y}
                r="16"
              />
            ))}

            <path className="epure-line" style={{ "--i": 1 }} pathLength="1" d={coneArc(CONE.outer)} />
            <path className="epure-line" style={{ "--i": 2 }} pathLength="1" d={coneArc(CONE.inner)} />
            {generators.map((line, index) => (
              <path
                key={line}
                className="epure-line"
                style={{ "--i": 3 + index * 0.25 }}
                pathLength="1"
                d={line}
              />
            ))}
          </g>

          {/* Les axes : ceux de la bride et son cercle de perçage, le sommet du cône, et trois repères en croix */}
          <g className="epure-axis epure-fade" style={{ "--i": 0 }}>
            <path d={`M${FLANGE.x - 290} ${FLANGE.y} H${FLANGE.x + 290} M${FLANGE.x} ${FLANGE.y - 290} V${FLANGE.y + 290}`} />
            <circle cx={FLANGE.x} cy={FLANGE.y} r={FLANGE.bolts} />
            <path
              d={`M${CONE.x} ${CONE.y} L${pointOn(CONE, CONE.inner, CONE.from)} M${CONE.x} ${CONE.y} L${pointOn(CONE, CONE.inner, CONE.to)}`}
            />
            <path d="M788 190 H812 M800 178 V202 M788 700 H812 M800 688 V712 M648 470 H672 M660 458 V482" />
          </g>

          {/* Les cotes de la bride : son diamètre, et le perçage */}
          <g className="epure-dim epure-fade" style={{ "--i": 2 }}>
            <path d={`M${FLANGE.x - FLANGE.outer} ${FLANGE.y} V792 M${FLANGE.x + FLANGE.outer} ${FLANGE.y} V792`} />
            <path
              d={`M${FLANGE.x - FLANGE.outer} 776 H${FLANGE.x + FLANGE.outer}`}
              markerStart="url(#epure-arrow)"
              markerEnd="url(#epure-arrow)"
            />
            <text x={FLANGE.x} y="768" textAnchor="middle">
              Ø 500
            </text>
            <path d={`M${holes[7].join(" ")} L1562 332 H1592`} />
            <text x="1556" y="322" textAnchor="end">
              8 × Ø 32
            </text>
          </g>

          {/* Les cotes du cône : son rayon et son angle. Elles sont écrites dans la marge de gauche,
              hors de la colonne de texte, pour ne pas se mêler aux paragraphes. */}
          <g className="epure-dim epure-fade" style={{ "--i": 3 }}>
            <text x="64" y="600">R 430</text>
            <text x="196" y="222">74°</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default Epure;
