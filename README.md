# Portfolio — Adam Boulkhedert

Développeur full stack · Paris

Mon portfolio, conçu et codé de A à Z : un univers de dessin technique et d'atelier métal, clin d'œil à ma formation en chaudronnerie.

Site en ligne : à venir.

## Ce qu'on y trouve

- **Une intro pilotée par le défilement.** Un plan technique sur lequel le monogramme « AB » est soudé trait par trait, avant que les deux lettres viennent se poser sur le logo.
- **Cinq sections** : présentation, parcours (présenté comme une gamme de fabrication), compétences (l'établi et ses tiroirs), projets (avec une fiche détaillée pour chacun) et contact.
- **Un formulaire de contact adaptatif.** Les champs changent selon le type de demande, la ville est proposée à partir du code postal (API publique geo.api.gouv.fr) et une correction est suggérée en cas de faute de frappe dans l'email.
- **Une API qui ne fait pas confiance au navigateur.** Elle revérifie chaque donnée, contrôle que le domaine de l'email existe vraiment, puis transmet le message par email.
- **Des pages légales et une page 404**, avec React Router.

## Stack technique

| Partie | Technologies |
| --- | --- |
| Front | React 19, Vite, React Router, CSS sans framework |
| Back | Node.js, Express 5, Nodemailer, express-rate-limit |
| Qualité | ESLint, une branche Git par fonctionnalité et des Pull Requests |

## Quelques choix techniques

**Des animations sans bibliothèque.** Pour l'intro, le JavaScript ne fait qu'une chose : calculer l'avancement du défilement (de 0 à 1) et l'écrire dans une variable CSS. Tout le reste est du CSS et du SVG : `stroke-dasharray` pour tracer les traits, un masque pour révéler le cordon de soudure, `offset-path` pour faire suivre la torche.

**La sécurité du formulaire.** Tout ce que vérifie le navigateur peut être contourné, donc le serveur refait chaque contrôle lui-même :

- les mêmes règles que le formulaire (champs obligatoires, longueurs maximales, email, code postal) ;
- une vérification DNS : le domaine de l'email doit pouvoir recevoir du courrier ;
- une limite de 3 messages par tranche de 5 minutes ;
- un champ piège, invisible pour un humain, que les robots remplissent ;
- un corps de requête limité à 10 Ko ;
- les identifiants d'envoi dans un fichier `.env`, jamais versionné.

**La vie privée.** L'adresse email n'est jamais écrite en clair dans la page, et une politique de confidentialité explique ce que deviennent les données du formulaire. Les polices et les logos sont hébergés par le site lui-même : afficher une page n'envoie rien à un service extérieur.

**L'accessibilité.** Les fenêtres modales sont annoncées comme telles aux lecteurs d'écran et se ferment avec Échap. Les animations sont coupées pour les personnes qui ont activé « réduire les animations » dans leur système.

## Structure du projet

```
PortFolio/
├── index.html
├── public/             favicon, logos des technologies et captures des projets (en WebP)
├── images-source/      les captures d'origine, avant conversion
├── scripts/            deux scripts : convertir les captures, télécharger les logos
├── src/
│   ├── components/     les composants React (Intro, Hero, Navbar, ContactForm…)
│   ├── pages/          accueil, mentions légales, confidentialité, 404
│   ├── data/           le contenu en JSON (projets, compétences, parcours)
│   ├── App.jsx         les routes et la mise en page commune
│   └── index.css       tous les styles, rangés par sections numérotées
└── server/             l'API Express du formulaire de contact
    ├── index.js        les routes et la limite d'envois
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

Le fichier `.env` attend quatre valeurs :

| Variable | Rôle |
| --- | --- |
| `PORT` | le port du serveur |
| `MAIL_USER` | le compte Gmail qui envoie les emails |
| `MAIL_PASS` | son mot de passe d'application |
| `MAIL_TO` | l'adresse qui reçoit les demandes |

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
