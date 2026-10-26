# Checkup du portfolio — 26 octobre 2026

## Corrections

| Zone | Problème | Correction |
| --- | --- | --- |
| Formulaire | L'apparition était relancée à chaque retour tant que les champs étaient vides. | L'apparition se joue une seule fois par affichage de la page, que le formulaire soit vide ou rempli. |
| Boîte à outils | WebKit interpolait incorrectement les départs implicites du tracé : le cordon restait derrière l'étincelle. | Départs explicites des animations de chaque côté ; la pointe termine aussi le dernier côté au même rythme que le trait. |
| Boîte à outils | Les dimensions minimales des colonnes poussaient le panneau et sa soudure hors du cadre sur petit écran. | Colonnes rétractables et retour à la ligne des noms d'outils. Les onglets actifs affichent un cadre déjà soudé. |
| À propos | Le dessin dépendait de la normalisation SVG de la longueur des cercles et du redimensionnement du viewport mobile. | Longueur réelle des tracés mesurée avant l'affichage ; hauteur stable avec `svh` et centrage du fond sans transformation de son conteneur sticky. |
| Retours dans les sections | Les marges verticales en pourcentage d'IntersectionObserver étaient calculées sur la largeur. La zone de retour pouvait devenir vide en paysage ou sur écran ultralarge. | Marges calculées sur la hauteur en pixels et recalculées au redimensionnement. |
| Apparitions | Un bloc plus haut que l'écran pouvait avoir un seuil de visibilité impossible à atteindre. La fin d'une ancienne animation pouvait aussi marquer un nouveau passage comme terminé. | Seuil adapté à la hauteur disponible ; recalcul après changement de taille ; suivi distinct de chaque passage. |
| Défilement | ScrollTrigger pouvait restaurer un `scroll-behavior: smooth` inline, qui se superposait à Lenis. | Le mode natif reste désactivé quand Lenis pilote le défilement. La préférence de réduction des animations désactive aussi le défilement doux. |
| Petits écrans | Les cartes projet imposaient 300 px minimum ; le nom dans la navbar passait sur deux lignes à 320 px. | Grille limitée à la largeur disponible et taille du logo adaptée. |
| Modale de contact | La hauteur maximale ne suivait pas la hauteur réellement disponible sur téléphone. | Ajout de `dvh`, avec conservation du repli en `vh`. |
| Dépendances | Cinq alertes npm au total sur le site et l'API. | Mises à jour compatibles de Vite, Zod, body-parser, ip-address et Nodemailer dans les fichiers de verrouillage. Aucun signalement après correction. |

## Vérifications

- `npm run lint` : réussi.
- `npm run build` : réussi.
- `npm test --prefix server` : 31 tests réussis, sans envoi réel d'email.
- `npm run test:browser` : 42 tests réussis, soit sept parcours sur Chromium, Firefox et WebKit, chacun en mobile et bureau.

Les scénarios couvrent le formulaire vide et rempli, les quatre côtés de la soudure et leur
synchronisation avec l'étincelle, les changements de tiroir, les retours rapides, le décor
d'À propos, les pages légales, les écrans de 320 px, le paysage, l'écran ultralarge, le
formulaire recrutement, les modales, le thème, la langue et la réduction des animations.
Ils vérifient aussi l'absence d'erreur JavaScript. Les services anti-bot et de santé sont simulés.

## Limites

WebKit est le moteur de Safari, exécuté ici sous Linux. Les tests ne remplacent pas un essai
sur un véritable iPhone pour le clavier virtuel, les gestes, la barre d'adresse et les anciennes
versions d'iOS. L'envoi d'un email et la vérification Cloudflare en production ne sont pas testés
avec de vrais services.

La construction signale encore un fichier JavaScript principal d'environ 510 ko avant compression
(170 ko en gzip). C'est une piste d'optimisation du chargement sur réseau mobile lent ; la construction
réussit. Ce checkup couvre les parcours ci-dessus et ne garantit pas l'absence de tout bug possible.
