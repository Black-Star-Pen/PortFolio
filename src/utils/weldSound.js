// Le son de la soudure de l'intro : un crépitement (de petits claquements secs sur un souffle léger),
// dont le volume suit le défilement (voir Intro.jsx).
// Il n'y a pas de fichier son : le navigateur le fabrique lui-même, avec l'API « Web Audio ».
//
// Un navigateur n'autorise un site à faire du son qu'après un geste du visiteur (un clic, une touche).
// C'est pourquoi le son est coupé au départ, et que cette fonction n'est appelée qu'au clic sur le
// bouton « Son » : c'est ce clic qui donne l'autorisation.

// Le volume maximum, de 0 à 1
const VOLUME = 0.5;

// Du « bruit rose » : un souffle, comme une radio entre deux stations, mais plus doux à l'oreille que le
// bruit blanc (moins d'aigus). On tire des nombres au hasard, puis trois petits filtres les adoucissent.
function createNoise(context, seconds) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;

  for (let index = 0; index < length; index++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    samples[index] = (b0 + b1 + b2 + white * 0.1848) * 0.25;
  }
  return buffer;
}

// Les claquements : quatre secondes de silence, parsemées de très courtes rafales de bruit
// (2 à 8 millièmes de seconde), à intervalles irréguliers (de 20 à 110 millièmes de seconde).
// Chaque rafale a sa propre force et s'éteint aussitôt : c'est ce qui donne un « tac » sec.
function createCrackle(context, seconds) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let position = 0;

  while (position < length) {
    position += Math.floor(context.sampleRate * (0.02 + Math.random() * 0.09));
    const burst = Math.floor(context.sampleRate * (0.002 + Math.random() * 0.006));
    const strength = 0.25 + Math.random() * 0.75;
    for (let index = 0; index < burst && position + index < length; index++) {
      samples[position + index] = (Math.random() * 2 - 1) * strength * (1 - index / burst);
    }
  }
  return buffer;
}

// Un son qui tourne en boucle
function loop(context, buffer) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// Un filtre : il ne laisse passer qu'une partie des sons (les aigus, les graves, ou une bande entre les deux)
function filter(context, type, frequency, quality) {
  const node = context.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  if (quality) node.Q.value = quality;
  return node;
}

// Un réglage de volume
function volume(context, value) {
  const node = context.createGain();
  node.gain.value = value;
  return node;
}

// Fabrique le son et le lance, en silence. Renvoie de quoi régler son niveau, et l'arrêter.
export function createWeldSound() {
  // AudioContext = la « table de mixage » du navigateur. Elle est créée ici, tout de suite après le clic.
  const context = new AudioContext();
  // Le volume général : c'est lui que le défilement fait monter et descendre
  const master = volume(context, 0);
  master.connect(context.destination);

  // 1. Les claquements : on ne garde que leurs aigus (au-dessus de 1 800 Hz), pour qu'ils restent secs
  const crackle = loop(context, createCrackle(context, 4));
  const crackleHighs = filter(context, "highpass", 1800);
  const crackleVolume = volume(context, 0.5);
  crackle.connect(crackleHighs);
  crackleHighs.connect(crackleVolume);
  crackleVolume.connect(master);

  // 2. Le souffle, en fond : du bruit rose resserré autour de 1 800 Hz, sans ses aigus les plus durs
  const hiss = loop(context, createNoise(context, 3));
  const hissBand = filter(context, "bandpass", 1800, 0.7);
  const hissSoft = filter(context, "lowpass", 4000);
  const hissVolume = volume(context, 0.9 * 0.25);
  hiss.connect(hissBand);
  hissBand.connect(hissSoft);
  hissSoft.connect(hissVolume);
  hissVolume.connect(master);

  // Le souffle « respire » : un oscillateur très lent (0,7 fois par seconde) fait varier un peu son volume
  const breath = context.createOscillator();
  breath.frequency.value = 0.7;
  const breathDepth = volume(context, 0.12 * 0.25);
  breath.connect(breathDepth);
  breathDepth.connect(hissVolume.gain);

  const sources = [crackle, hiss, breath];
  sources.forEach((source) => source.start());

  return {
    // level : de 0 (silence) à 1 (plein volume).
    // setTargetAtTime fait glisser le volume vers sa cible en 0,15 seconde environ : jamais de coupure sèche.
    setLevel(level) {
      master.gain.setTargetAtTime(level * VOLUME, context.currentTime, 0.15);
    },
    close() {
      sources.forEach((source) => source.stop());
      context.close();
    },
  };
}
