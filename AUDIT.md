# Revue du portfolio — 20 octobre 2026

Revue du frontend React, de l'API Express, du formulaire et de ses emails, des dépendances,
des réglages Render et de la CI. Les corrections sont locales ; elles ne sont pas encore déployées.
Les essais d'envoi utilisent un fournisseur simulé : aucun email réel n'a été envoyé.

## Corrections

| Zone | Problème traité | Correction |
| --- | --- | --- |
| API | Corps JSON `null` et tableaux | Refus explicite avec une réponse 400, sans erreur interne. |
| Validation | Appels DNS/géographiques pour des champs déjà invalides | Contrôles locaux et longueurs vérifiés avant les appels externes. |
| Recrutement | Ville vide acceptée en cas d'indisponibilité du service géographique | Ville obligatoire indépendamment du service externe. |
| Emails | Formats email incomplets et domaines annonçant un MX nul | Contrôle des composants de l'adresse et prise en compte du MX nul. |
| CORS | Configuration vide permissive pour la route d'envoi | Origines locales par défaut ; origine HTTPS obligatoire en production. |
| Anti-spam | Parsing effectué avant la limite d'envoi | Origine et limite vérifiées avant la lecture du JSON ; corps compressés refusés. |
| Volume | Certains messages Unicode de 5 000 caractères dépassaient 10 Ko | Plafond HTTP de 32 Ko ; limite métier de 5 000 caractères conservée. |
| Configuration | Réglages invalides détectés seulement à l'envoi | Contrôle du destinataire, des identifiants email, des origines, du port et des proxys au démarrage. |
| Délais | Attentes SMTP longues et minuteurs DNS non libérés | Délais SMTP explicites, minuteurs DNS nettoyés, réception HTTP bornée. |
| Formulaire | Réponse HTML 200 pouvant annoncer un faux succès | Succès uniquement avec une réponse JSON `201` et `ok: true`. |
| Formulaire | Soumissions concurrentes et recherches de ville obsolètes | Verrou de soumission, annulation des requêtes au démontage et rejet des résultats obsolètes. |
| Recherche de ville | Chargement sans délai maximal | Délai de 8 secondes, puis saisie manuelle en cas d'échec. |
| Anti-spam frontend | `Retry-After` inaccessible depuis le site sur une autre origine | En-tête exposé par CORS et délai vérifié avant le compte à rebours. |
| Navigation | Une ancre invalide pouvait casser un sélecteur CSS | Recherche par identifiant et décodage protégé. |
| Modales | Le clavier pouvait quitter la fenêtre et le focus était réinitialisé lors des changements de projet | Focus maintenu dans la modale, arrière-plan inerte et retour sur le déclencheur à la fermeture. |
| Défilement | Plusieurs fenêtres pouvaient débloquer la page l'une de l'autre | Comptage des verrous et restauration du style initial. |
| Menu mobile | Défilement bloqué après passage sur grand écran | Fermeture à Échap et au passage au-dessus de 900 px. |
| Compétences | Onglets sans navigation clavier complète ni relation explicite avec leur panneau | Flèches, Début/Fin, focus et attributs ARIA associés ; projets lus dans la langue active. |
| Secrets | Seul `.env` était ignoré | Variantes `.env.*` ignorées, exemple conservé. |
| CI | Absence de tests de régression de l'API | Suite `node --test` ajoutée et exécutée par GitHub Actions ; droits du workflow limités en lecture. |

L'API est séparée en `app.js` (routes), `config.js` (configuration) et `index.js` (démarrage)
pour tester les routes avec un transport email simulé, sans charger les secrets locaux.

## Vérification

- `npm run lint` : réussi.
- `npm run build` : réussi. Vite signale encore un bundle principal supérieur à 500 Ko avant compression.
- `npm test --prefix server` : 31 tests réussis, incluant les requêtes malformées, CORS,
  les tailles UTF-8, le piège anti-robots, la limite d'envoi, l'échappement HTML, Resend simulé
  et la validation obligatoire des jetons Turnstile.
- Essais Chromium locaux : formulaire avec succès et réponse HTML inattendue, clavier des modales
  et des onglets, ancres invalides, menu mobile, pages légales et page introuvable.
- Essais Turnstile supplémentaires : blocage avant vérification, expiration, renouvellement après
  refus du serveur, deux formulaires simultanés, reprise après erreur et affichage mobile.
  Le widget officiel et Siteverify ont aussi été vérifiés avec les clés de test Cloudflare.
- `npm audit --json`, à la racine et dans `server/` : aucune vulnérabilité connue signalée.
- Configuration de `server/.env` chargée et contrôlée sans afficher ses secrets : valide en mode Resend.
- Contrôle des fichiers actuellement suivis par Git : aucun `.env` privé suivi ; aucun motif de clé
  Resend, de jeton GitHub ou de clé privée détecté. Ce contrôle ciblé ne parcourt pas l'historique Git.

## Mise en ligne

Redémarrer l'API locale après récupération des changements. Sur Render, configurer le service API :

```env
NODE_ENV=production
CORS_ORIGIN=https://adam-boulkhedert.onrender.com
TRUST_PROXY=3
MAIL_TO=adresse_destinataire
RESEND_API_KEY=cle_privee_resend
TURNSTILE_SECRET_KEY=cle_secrete_cloudflare
```

Les trois dernières valeurs sont à saisir dans l'environnement du service, jamais dans Git ni dans
une variable `VITE_`. Le fichier `render.yaml` définit déjà `NODE_ENV`, l'origine et le nombre de proxys.
Sans domaine vérifié, laisser `MAIL_FROM` vide et utiliser l'adresse du compte Resend comme destinataire
pour les tests. La réception des emails du formulaire a été confirmée.

Le site statique doit également recevoir `VITE_TURNSTILE_SITE_KEY` (clé publique du même widget)
avant sa reconstruction. Le code de protection est intégré ; son activation en production attend
les clés du compte Cloudflare. Le développement utilise les clés de test officielles, qui ne filtrent
pas réellement les robots. La configuration complète est décrite dans le README.

`TRUST_PROXY=3` reprend la topologie documentée dans le dépôt. Elle doit être vérifiée si le chemin
réseau change : un nombre de proxys incorrect peut fausser l'adresse IP utilisée par la limite d'envoi.
Voir [Express derrière des proxys](https://expressjs.com/en/guide/behind-proxies/).

## Évolutions proposées

- **Déduplication des envois Resend** : une clé d'idempotence permettrait de retenter une demande
  dont la confirmation a été perdue, en évitant un second email. Il faut définir la durée et
  la réutilisation de cette clé pour permettre aussi deux demandes volontaires identiques.
  Voir les [clés d'idempotence Resend](https://resend.com/changelog/idempotency-keys).
- **Chargement différé de certains composants** : peut réduire le JavaScript initial, avec mesure
  du gain et vérification des états de chargement. L'avertissement de taille de Vite motive cette piste.

Ces évolutions ne sont pas incluses dans les corrections. La limite par IP reste en mémoire dans
un seul processus ; elle se réinitialise au redémarrage et n'arrête pas une attaque distribuée.
CORS contrôle les navigateurs, sans authentifier les requêtes de scripts externes.
Cette revue et les tests couvrent les défauts identifiés ; ils ne constituent pas une garantie
d'absence de vulnérabilité ni un test d'intrusion de l'infrastructure en production.
