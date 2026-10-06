# Portfolio — Adam Boulkhedert

Développeur full stack · Paris

Mon portfolio, conçu et codé de A à Z : un univers de dessin technique et d'atelier métal, clin d'œil à ma formation en chaudronnerie.

Site en ligne : à venir.

## Ce qu'on y trouve

- **Une intro pilotée par le défilement.** Un plan technique sur lequel le monogramme « AB », d'abord tracé en pointillés, est soudé trait par trait, avant que les deux lettres viennent se poser sur le logo. Sur grand écran, la soudure est un film qui avance avec la molette, avec un crépitement à activer.
- **Cinq sections** : présentation, parcours (présenté comme une gamme de fabrication), compétences (l'établi et ses tiroirs), projets (avec une fiche détaillée pour chacun) et contact.
- **Un formulaire de contact adaptatif.** Les champs changent selon le type de demande, la ville est proposée à partir du code postal (API publique geo.api.gouv.fr) et une correction est suggérée en cas de faute de frappe dans l'email.
- **Une API qui ne fait pas confiance au navigateur.** Elle revérifie chaque donnée, contrôle que le domaine de l'email existe vraiment, puis transmet le message par email.
- **Des pages légales et une page 404**, avec React Router.

## Stack technique

| Partie | Technologies |
| --- | --- |
| Front | React 19, Vite, React Router, GSAP (ScrollTrigger), Canvas, Web Audio, CSS sans framework |
| Back | Node.js, Express 5, Nodemailer, express-rate-limit, helmet, cors |
| Qualité | ESLint, une branche Git par fonctionnalité et des Pull Requests |

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
├── public/             favicon, logos des technologies, captures des projets et images du film de l'intro (en WebP)
├── images-source/      les captures d'origine, avant conversion
├── scripts/            deux scripts : convertir les captures, télécharger les logos
├── src/
│   ├── components/     les composants React (Intro, Hero, Navbar, ContactForm…)
│   ├── pages/          accueil, mentions légales, confidentialité, 404
│   ├── data/           le contenu en JSON (projets, compétences, parcours)
│   ├── App.jsx         les routes et la mise en page commune
│   └── index.css       tous les styles, rangés par sections numérotées
└── server/             l'API Express du formulaire de contact
    ├── index.js        les routes, la limite d'envois et les protections
    ├── validation.js   la vérification des données
    └── mailer.js       l'envoi des emails
```

## Lancer le projet en local

Il faut Node.js 20.6 ou plus récent.

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

Le fichier `.env` attend quatre valeurs, et deux de plus pour la mise en ligne :

| Variable | Rôle |
| --- | --- |
| `PORT` | le port du serveur |
| `MAIL_USER` | le compte Gmail qui envoie les emails |
| `MAIL_PASS` | son mot de passe d'application |
| `MAIL_TO` | l'adresse qui reçoit les demandes |
| `CORS_ORIGIN` | en ligne : l'adresse du site autorisé à appeler l'API (vide en local) |
| `TRUST_PROXY` | en ligne : le nombre d'intermédiaires devant le serveur, 1 le plus souvent (vide en local) |

Sans l'API, le site s'affiche normalement : seul l'envoi du formulaire échoue.

### Les autres commandes

| Commande | Effet |
| --- | --- |
| `npm run build` | construit la version de production dans `dist/` |
| `npm run preview` | sert cette version en local, pour la vérifier |
| `npm run lint` | vérifie le code avec ESLint |
| `npm run images` | convertit les captures de `images-source/projects/` en WebP dans `public/projects/` |
| `npm run icons` | télécharge dans `public/icons/` les logos listés dans `src/data/technoIcons.js` |

## Contact

Par le formulaire du site, ou sur [LinkedIn](https://www.linkedin.com/in/adam-boulkhedert).
