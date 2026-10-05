// Des étincelles de soudure : un petit « système de particules » dessiné sur un <canvas>.
// Il sert à deux endroits : la soudure de l'intro (Intro.jsx) et les cordons entre les sections
// (ScrollReveal.jsx). Le moteur est le même, chacun lui passe son « style » pour changer le caractère.
//
// Chaque étincelle est un objet : sa position (x, y), sa vitesse (vx, vy), son âge et sa durée de vie.
// À chaque image, on la déplace (elle garde son élan, l'air la freine, la gravité la tire vers le bas),
// puis on la dessine comme un trait lumineux entre sa position précédente et sa position actuelle :
// c'est ce trait qui donne l'impression de vitesse. En vieillissant, elle change de couleur.

// Le style par défaut, celui de l'intro : une vraie soudure, vive, qui refroidit du blanc au rouge sombre.
// Les réglages à deux valeurs se lisent [le minimum, ce que le hasard ajoute au plus].
const DEFAULT_STYLE = {
  maxSparks: 340, // au-delà, on n'en crée plus : le dessin doit rester fluide
  gravity: 640, // en unités du dessin par seconde, chaque seconde
  drag: 1.5, // le freinage de l'air : plus il est grand, plus l'étincelle ralentit vite
  spread: Math.PI * 1.5, // l'ouverture de la gerbe autour de la verticale, en radians (π = un demi-tour)
  speed: [36, 310], // la vitesse de départ
  life: [0.3, 0.8], // la durée de vie, en secondes
  size: [0.3, 0.5], // l'épaisseur du trait
  splitChance: 0.14, // la part des étincelles qui éclatent en vol, comme de vraies étincelles
  // La couleur selon l'âge (0 = vient de naître, 1 = s'éteint) : [âge, rouge, vert, bleu]
  colors: [
    [0, 255, 252, 236],
    [0.22, 255, 226, 138],
    [0.55, 255, 152, 54],
    [1, 168, 52, 16],
  ],
};

// Trouve la couleur entre deux étapes du tableau (par exemple, à 0,4 : entre la 2e et la 3e)
function colorAt(colors, age) {
  for (let i = 1; i < colors.length; i += 1) {
    const [end, ...to] = colors[i];
    if (age <= end) {
      const [start, ...from] = colors[i - 1];
      const mix = (age - start) / (end - start);
      return from.map((value, channel) => Math.round(value + (to[channel] - value) * mix));
    }
  }
  return colors[colors.length - 1].slice(1);
}

// style : les réglages à changer par rapport à DEFAULT_STYLE (rien = les étincelles de l'intro)
export function createSparks(canvas, style) {
  const { maxSparks, gravity, drag, spread, speed, life, size, splitChance, colors } = {
    ...DEFAULT_STYLE,
    ...style,
  };
  const ctx = canvas.getContext("2d");
  let sparks = [];
  let width = 0;
  let height = 0;

  // Règle la taille de la toile sur celle qu'elle a à l'écran. Sur un écran très dense (téléphone,
  // Retina), on double le nombre de pixels pour que les traits restent nets.
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Fait jaillir « count » étincelles du point (x, y).
  // unit = la taille d'une unité du dessin à l'écran : les étincelles gardent ainsi les mêmes
  // proportions sur un téléphone que sur un grand écran. (1 = on compte directement en pixels.)
  function emit(x, y, count, unit) {
    for (let i = 0; i < count && sparks.length < maxSparks; i += 1) {
      // La direction : autour de la verticale, vers le haut.
      // (Sur un écran, l'axe vertical descend : un angle négatif part donc vers le haut.)
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      // La vitesse : beaucoup d'étincelles lentes, quelques-unes très rapides (d'où le « au carré »)
      const velocity = (speed[0] + speed[1] * Math.random() ** 2) * unit;

      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        age: 0,
        life: life[0] + Math.random() * life[1],
        size: (size[0] + Math.random() * size[1]) * unit,
        unit,
        canSplit: Math.random() < splitChance,
      });
    }
  }

  // Une étincelle qui éclate en projette trois petites, dans des directions au hasard
  function split(parent) {
    const children = [];
    for (let i = 0; i < 3; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (50 + Math.random() * 90) * parent.unit;
      children.push({
        x: parent.x,
        y: parent.y,
        vx: parent.vx * 0.4 + Math.cos(angle) * velocity,
        vy: parent.vy * 0.4 + Math.sin(angle) * velocity,
        age: 0,
        life: 0.14 + Math.random() * 0.2,
        size: parent.size * 0.6,
        unit: parent.unit,
        canSplit: false,
      });
    }
    return children;
  }

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Avance la simulation de « dt » secondes, puis redessine toutes les étincelles.
  // Renvoie le nombre d'étincelles encore allumées (0 = il n'y a plus rien à dessiner).
  function update(dt) {
    ctx.clearRect(0, 0, width, height);
    if (sparks.length === 0) return 0;

    // « lighter » : là où deux traits se croisent, leurs lumières s'additionnent
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    const born = [];
    sparks = sparks.filter((spark) => {
      spark.age += dt;
      if (spark.age >= spark.life) return false; // éteinte : on la retire de la liste

      // La physique : le freinage réduit la vitesse, la gravité ajoute de la vitesse vers le bas
      spark.vx -= spark.vx * drag * dt;
      spark.vy += (gravity * spark.unit - spark.vy * drag) * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;

      const age = spark.age / spark.life; // de 0 à 1
      if (spark.canSplit && age > 0.45) {
        spark.canSplit = false;
        born.push(...split(spark));
      }

      const [red, green, blue] = colorAt(colors, age);
      const alpha = 1 - age * age; // elle reste vive longtemps, puis s'éteint vite
      // La traînée : d'où elle venait il y a 3 centièmes de seconde
      const tailX = spark.x - spark.vx * 0.03;
      const tailY = spark.y - spark.vy * 0.03;

      // Deux passes : un trait large et pâle (le halo), puis un trait fin et vif (le cœur)
      ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.2})`;
      ctx.lineWidth = spark.size * 3.4;
      drawLine(tailX, tailY, spark.x, spark.y);
      ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      ctx.lineWidth = spark.size;
      drawLine(tailX, tailY, spark.x, spark.y);

      return true;
    });
    sparks.push(...born);
    return sparks.length;
  }

  resize();
  return { resize, emit, update };
}
