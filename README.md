# Portfolio — Adam Boulkhedert

Développeur full stack · Paris

[![Le monogramme « AB » en cours de soudure sur un plan technique, à côté du nom Adam Boulkhedert, développeur full stack](public/og-image.jpg)](https://adam-boulkhedert.onrender.com)

Mon portfolio, conçu et codé de A à Z : un univers de dessin technique et d'atelier métal, clin d'œil à ma formation en chaudronnerie.

Site en ligne : https://adam-boulkhedert.onrender.com

## Ce qu'on y trouve

- **Une intro pilotée par le défilement.** Un plan technique sur lequel le monogramme « AB », d'abord tracé en pointillés, est soudé trait par trait, avant que les deux lettres viennent se poser sur le logo. Sur grand écran, la soudure est un film qui avance avec la molette, avec un crépitement à activer.
- **Cinq sections** : présentation, parcours (présenté comme une gamme de fabrication), compétences (l'établi et ses tiroirs), projets (avec une fiche détaillée pour chacun) et contact.
- **Un formulaire de contact adaptatif.** Les champs changent selon le type de demande, la ville est proposée à partir du code postal (API publique geo.api.gouv.fr) et une correction est suggérée en cas de faute de frappe dans l'email.
- **Une API qui ne fait pas confiance au navigateur.** Elle revérifie chaque donnée, contrôle que le domaine de l'email existe vraiment, puis transmet le message par email.
- **Deux thèmes et deux langues.** Sombre ou clair, français ou anglais : le choix du visiteur est gardé dans son navigateur.
- **Des pages légales et une page 404**, avec React Router.

## Stack technique

| Partie | Technologies |
| --- | --- |
| Front | React 19, Vite, React Router, GSAP (ScrollTrigger), Lenis (défilement fluide), Canvas, Web Audio, CSS sans framework |
| Back | Node.js, Express 5, Nodemailer en local et Resend en ligne, express-rate-limit, helmet, cors |
| Hébergement | Render : le site en fichiers statiques, l'API en service Node (configuration dans `render.yaml`) |
| Qualité | ESLint, une branche Git par fonctionnalité et des Pull Requests, contrôlées par GitHub Actions |

## Quelques choix techniques

**Une intro pilotée par GSAP, en deux versions.** Le déroulé de l'intro est une timeline GSAP, que ScrollTrigger fait avancer avec le défilement en lissant le mouvement. La soudure existe en deux versions, qui suivent les mêmes tracés au même rythme :

- **Sur grand écran, un film.** 152 images au fond transparent, affichées une à une dans un `<canvas>` selon la position de la page, et fondues l'une dans l'autre entre deux positions. Elles sont téléchargées compressées, puis décodées en avance et en tâche de fond (`createImageBitmap`), seulement autour de l'image affichée : le défilement reste fluide sans garder tout le film en mémoire. Ce film a été généré par IA à partir d'une animation de référence codée image par image, pour lui imposer le tracé exact, puis détouré par calcul pour laisser voir le plan derrière.
- **Sur mobile, ou tant que le film n'est pas chargé, du CSS et du SVG.** La timeline ne change que des variables CSS : `stroke-dasharray` trace les traits, un masque révèle le cordon de soudure, `offset-path` fait suivre la torche.

Le plan autour (cadre, cartouche, annotations, cotes) et le raccord des lettres avec le logo sont communs aux deux. Un bouton active un crépitement de soudure, fabriqué par le navigateur avec l'API Web Audio (aucun fichier son), dont le volume suit le défilement.

Les autres animations du site (apparition des sections, soudures du parcours et du footer) n'utilisent aucune bibliothèque.

**La sécurité du formulaire.** Tout ce que vérifie le navigateur peut être contourné, donc le serveur refait chaque contrôle lui-même :

- les mêmes règles que le formulaire (champs obligatoires, longueurs maximales, email, code postal) ;
- une vérification DNS : le domaine de l'email doit pouvoir recevoir du courrier ;
- des champs nettoyés de tout caractère invisible avant de partir dans l'email ;
- une limite de 3 messages par tranche de 5 minutes, comptée par visiteur même derrière l'hébergeur ;
- un champ piège, invisible pour un humain, que les robots remplissent ;
- un corps de requête limité à 10 Ko ;
- seul le site a le droit d'appeler l'API (CORS, et un contrôle de l'origine côté serveur) ;
- les en-têtes de sécurité recommandés, posés par `helmet` ;
- aucun nom ni adresse dans les journaux du serveur ;
- les identifiants d'envoi dans un fichier `.env`, jamais versionné.

**La vie privée.** L'adresse email n'est jamais écrite en clair dans la page, et une politique de confidentialité explique ce que deviennent les données du formulaire. Les polices et les logos sont hébergés par le site lui-même : afficher une page n'envoie rien à un service extérieur.

**L'accessibilité.** Les fenêtres modales sont annoncées comme telles aux lecteurs d'écran et se ferment avec Échap. Les animations sont coupées pour les personnes qui ont activé « réduire les animations » dans leur système. Le son de l'intro est coupé par défaut : c'est le visiteur qui choisit de l'entendre.

## Structure du projet

```
PortFolio/
├── index.html
├── render.yaml         la configuration de l'hébergement : les deux services et les en-têtes de sécurité du site
├── .github/workflows/  le contrôle automatique : lint, construction du site et démarrage de l'API à chaque Pull Request
├── public/             icônes du site, logos des technologies, captures des projets, images du film de l'intro (en WebP) et image de partage
├── images-source/      les captures d'origine, avant conversion
├── scripts/            quatre outils : convertir les captures, télécharger les logos, dessiner l'image de partage, dessiner l'icône du site
├── src/
│   ├── components/     les composants React et leur CSS, un dossier par partie du site
│   │   ├── layout/     ce qui entoure toutes les pages : navbar, pied de page, thème, langue, apparitions au défilement
│   │   ├── intro/      l'intro et son film
│   │   ├── hero/       les cinq sections de l'accueil : hero/, about/, skills/, projects/ et contact/
│   │   └── shared/     les briques communes à plusieurs sections : titre de section, soudure, texte mis en forme
│   ├── pages/          accueil, mentions légales, confidentialité, 404
│   ├── data/           le contenu en JSON, en français et en anglais (projets, compétences, parcours)
│   ├── i18n/           les deux langues : les textes de l'interface et le choix de la langue
│   ├── hooks/          le titre de l'onglet
│   ├── utils/          les outils sans affichage : défilement fluide, thème, étincelles, son de l'intro, adresse de l'API
│   ├── styles/         les styles communs à tout le site : variables des deux thèmes, base, boutons, modale, petits écrans
│   ├── App.jsx         les routes et la mise en page commune
│   └── index.css       la liste des fichiers de styles, dans l'ordre où ils sont lus
└── server/             l'API Express du formulaire de contact
    ├── index.js          les routes, la limite d'envois et les protections
    ├── validation.js     la vérification des données
    ├── emailTemplate.js  le contenu et la mise en page de l'email reçu
    └── mailer.js         l'envoi des emails
```

## Lancer le projet en local

Il faut Node.js 22.12 ou plus récent (Node 22 est utilisé en CI et chez Render).

### Le site

```bash
git clone https://github.com/Black-Star-Pen/PortFolio.git
cd PortFolio
npm install
npm run dev
```

Le site est alors disponible sur http://localhost:5173.

### L'API (dans un second terminal)

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

L'API écoute sur http://localhost:3001. En développement, Vite lui transmet toutes les requêtes qui commencent par `/api`.

Le fichier `.env` configure l'API. Pour Resend, renseigne `RESEND_API_KEY` et `MAIL_TO` ;
pour Gmail, renseigne `MAIL_USER`, `MAIL_PASS` et `MAIL_TO`.
En mode test Resend (`MAIL_FROM` vide), `MAIL_TO` doit être l'adresse du compte Resend.
Pour un expéditeur personnalisé, utilise une adresse d'un domaine vérifié dans Resend.

| Variable | Rôle |
| --- | --- |
| `PORT` | le port du serveur |
| `NODE_ENV` | `development` en local, `production` chez l'hébergeur |
| `MAIL_USER` | le compte Gmail qui envoie les emails |
| `MAIL_PASS` | son mot de passe d'application |
| `MAIL_TO` | l'adresse qui reçoit les demandes |
| `RESEND_API_KEY` | la clé Resend, en local ou en ligne ; dès qu'elle est remplie, l'envoi passe par Resend au lieu de Gmail |
| `MAIL_FROM` | en ligne : l'expéditeur des emails envoyés par Resend (facultatif) |
| `CORS_ORIGIN` | origines autorisées, séparées par des virgules ; vide en développement = localhost:5173 et 127.0.0.1:5173 ; obligatoire en production, en HTTPS |
| `TRUST_PROXY` | en ligne : le nombre d'intermédiaires devant le serveur, 3 chez Render (vide en local) |
| `TURNSTILE_SECRET_KEY` | clé secrète Cloudflare Turnstile ; obligatoire en production, clé de test officielle par défaut en développement |

Sans l'API, le site s'affiche normalement : seul l'envoi du formulaire échoue.

L'API refuse de démarrer si la configuration des emails est incomplète ou si les origines et
le nombre de proxys sont invalides. Le fichier `.env` local n'est pas chargé par Render :
renseigne ses variables dans le service API. N'ajoute jamais une clé privée à une variable `VITE_`.

Les tests de l'API se lancent avec `npm test --prefix server`. Ils vérifient la validation,
les restrictions d'origine, les limites d'envoi et les erreurs HTTP sans envoyer d'email.

### Protection anti-bots avec Turnstile

Le formulaire utilise [Cloudflare Turnstile Free](https://developers.cloudflare.com/turnstile/plans/).
La vérification est obligatoire côté serveur avant la validation du formulaire et l'envoi de l'email.
Le serveur vérifie aussi le domaine d'origine du jeton et l'action `contact` ; un jeton absent,
expiré ou déjà utilisé est refusé. Une panne de vérification bloque l'envoi et propose le contact direct.

Pour activer la protection en ligne :

1. Dans Cloudflare → Turnstile, créer un widget **Managed** sur l'offre **Free**.
2. Autoriser `adam-boulkhedert.onrender.com` comme hostname (sans `https://` ni chemin).
   Laisser la prévalidation « pre-clearance » désactivée.
3. Dans Render, service **site statique**, définir `VITE_TURNSTILE_SITE_KEY` avec la **sitekey publique**.
4. Dans Render, service **API**, définir `TURNSTILE_SECRET_KEY` avec la **clé secrète** du même widget.
5. Reconstruire le site statique et redéployer l'API. Les variables figurent aussi dans `render.yaml`.

En production, l'API refuse de démarrer sans vraie clé secrète. Sans sitekey publique, le formulaire
affiche que la vérification est indisponible et ne permet pas l'envoi. Définir les deux clés avant
de déployer cette version ; ne pas utiliser de clés de test en production.

En local, aucune inscription n'est nécessaire pour essayer l'intégration : `npm run dev` utilise
la sitekey de test officielle et l'API utilise la clé secrète de test tant que `NODE_ENV` n'est pas
`production` et que `TURNSTILE_SECRET_KEY` est vide. Ces clés testent le fonctionnement du formulaire,
sans bloquer réellement les robots. L'accès à Cloudflare reste nécessaire.

Pour employer de vraies clés en local, copier le fichier `.env.example` de la racine en `.env.local`,
y définir `VITE_TURNSTILE_SITE_KEY`, et renseigner `TURNSTILE_SECRET_KEY` dans `server/.env`.
Il faut alors un widget de développement autorisant `localhost` et/ou `127.0.0.1`.
Utiliser un widget distinct pour la production. Redémarrer les deux serveurs après modification.

### Les autres commandes

| Commande | Effet |
| --- | --- |
| `npm run build` | construit la version de production dans `dist/` |
| `npm run preview` | sert cette version en local, pour la vérifier |
| `npm run lint` | vérifie le code avec ESLint |
| `npm run images` | convertit les captures de `images-source/projects/` en WebP dans `public/projects/`, en trois largeurs |
| `npm run icons` | télécharge dans `public/icons/` les logos listés dans `src/data/technoIcons.js` |

## Contact

Par le formulaire du site, ou sur [LinkedIn](https://www.linkedin.com/in/adam-boulkhedert).
