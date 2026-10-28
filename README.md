# HILOUW — Site et CMS

Site Next.js App Router + Payload CMS + PostgreSQL, destiné au serveur Debian derrière Apache. Le CMS gère le catalogue, les actualités, l’équipe, les médias et les textes des pages. Le frontend comprend l’accueil, le catalogue et ses fiches, le journal et ses articles, l’équipe, le contact, les CGV et les mentions légales. Aucune fonction de panier ou paiement.

## Prérequis

- Node.js 24.22.2 (voir `.nvmrc`) et npm.
- Docker Engine et Docker Compose pour PostgreSQL.
- Les secrets sont privés : ne jamais commiter `.env`, les sauvegardes ou les clés.

## Développement local

1. Copier `.env.example` vers `.env`.
2. Générer deux secrets distincts avec `openssl rand -hex 32` ou un gestionnaire de mots de passe. Remplacer `POSTGRES_PASSWORD` et `PAYLOAD_SECRET`, et reporter le mot de passe dans `DATABASE_URL`. Utiliser un mot de passe hexadécimal pour éviter les caractères à encoder dans l’URL.
3. Installer et lancer la base :

```bash
npm ci
docker compose -f compose.dev.yaml up -d --wait
npm run migrate
npm run bootstrap:admin
npm run dev
```

Le site est sur `http://localhost:3000` et le CMS sur `/admin`. La commande d’initialisation demande les identifiants et deux saisies masquées du mot de passe. Elle refuse une confirmation différente et n’ajoute pas de compte si un utilisateur existe déjà. Le formulaire public de création du premier compte est bloqué. Les administrateurs créent ensuite les autres comptes dans le CMS. Aucun mot de passe par défaut.

### Récupération administrateur depuis SSH

Si les emails ne sont pas encore configurés ou si le compte est verrouillé, utiliser sur le serveur :

```bash
sudo docker compose --profile tools run --rm manage npm run reset:admin-password
```

La commande demande l’email puis deux saisies masquées du nouveau mot de passe. Elle ne cible que les comptes administrateurs existants, ne modifie aucun compte si la confirmation diffère, réinitialise le compteur d’échecs, supprime les anciens jetons de réinitialisation et ferme les sessions précédentes. Ne jamais transmettre le mot de passe dans les arguments, les variables d’environnement ou le chat. Après une mise à jour du code des commandes, reconstruire l’image de gestion avec `sudo docker compose --profile tools build manage`.

Le nom `/admin` désigne l’espace CMS ; les gestionnaires du catalogue et les éditeurs s’y connectent aussi. Resend sert au contact et aux emails du CMS, dont la récupération de mot de passe, une fois `RESEND_API_KEY` et `CONTACT_FROM` configurés. Sans ces variables, les envois sont désactivés et aucun contenu d’email ou jeton de réinitialisation n’est écrit dans les logs.

## Rôles et utilisation du CMS

| Action | Administrateur | Gestionnaire du catalogue | Éditeur |
| --- | --- | --- | --- |
| Créer, modifier, publier et archiver les produits | Oui | Oui | Non |
| Créer, modifier et publier les actualités et l’équipe | Oui | Non | Oui |
| Modifier et publier l’accueil, la page équipe et la page contact | Oui | Non | Oui |
| Modifier les CGV, mentions légales et réglages du site | Oui | Non | Non |
| Gérer les comptes et attribuer les rôles | Oui | Non | Non |
| Supprimer définitivement les produits, articles et membres | Oui | Non | Non |
| Modifier/supprimer les médias de l’espace Catalogue | Oui | Oui | Non |
| Modifier/supprimer les médias de l’espace Éditorial | Oui | Non | Oui |

Tous les utilisateurs connectés peuvent consulter la médiathèque pour réutiliser des médias, et modifier leur propre compte sans modifier leur rôle. Les restrictions sont appliquées côté serveur, sur les collections, les champs et les API ; masquer un bouton n’est pas la protection.

Pour autoriser une personne : se connecter comme administrateur, ouvrir **Utilisateurs**, créer un compte et lui attribuer **Gestionnaire du catalogue**. La personne pourra ensuite ouvrir **Produits → Créer**, saisir le nom et le slug, ajouter ses photos et enregistrer un brouillon. La publication exige une description, les informations sur les allergènes et une galerie avec au moins une image. Le prix est facultatif, en centimes (1250 = 12,50 EUR). Le bouton configurable exige un libellé et une destination HTTPS ou interne.

L’ordre numérique trie les produits et membres ; la case « Mettre en avant » les sélectionne pour l’accueil. **Archiver** masque un produit sans détruire ses informations. Les slugs sont uniques, sans accents ni espaces. Aucun produit, prix, membre ou article réel n’est prérempli.

Les articles disposent d’un éditeur riche, d’une couverture, d’une galerie d’images/vidéos et d’un lien YouTube/Vimeo facultatif. Une date future empêche la lecture publique avant cette date. Les champs texte riche n’acceptent pas de médias imbriqués : utiliser les galeries explicites pour maintenir le contrôle de diffusion des fichiers.

Les contenus éditoriaux et produits disposent de brouillons et d’un historique limité à 25 versions. Une lecture publique ne renvoie que les publications ; l’accès aux brouillons et à l’historique exige les droits correspondants. Les CGV et mentions légales démarrent vides avec le statut **Provisoire — à faire valider**, affiché dans une bannière publique. Le statut « Validé par le propriétaire » reste une indication éditoriale, pas une certification juridique.

## Frontend et publication des contenus

Toutes les pages lisent le CMS côté serveur en appliquant les permissions publiques, même pour un visiteur déjà connecté au CMS. Les lectures sont dynamiques : publication, retrait et archivage sont visibles sans reconstruction. Les données CMS sont mémorisées uniquement pendant la requête React, pas dans un cache partagé avec les brouillons. Les fiches inconnues, non publiées et archivées répondent avec un vrai statut 404.

L’accueil affiche les produits et membres marqués « Mettre en avant », ainsi que les dernières actualités publiées. Une seule création bénéficie d’une composition dédiée ; les sections sans contenu ne créent pas de cartes fictives. Les listes gèrent la pagination. Les pages vides proposent un état d’attente. Le logo et les liens se règlent dans « Identité du site » ; le reste de l’accueil se publie dans « Accueil ».

Les polices Cormorant Garamond et DM Sans sont auto-hébergées. Les images ont des dimensions explicites et des variantes responsive ; le visuel principal est chargé en priorité. Le menu mobile gère le clavier, Échap et le focus. La galerie respecte le mouvement réduit. Les vidéos externes nécessitent un clic avant connexion à YouTube/Vimeo. Aucun outil de suivi n’est ajouté.

Les métadonnées, URL canoniques, partages sociaux et données structurées produit utilisent les contenus publiés. `SITE_INDEXABLE=false` conserve le site hors indexation, avec `robots.txt` restrictif et sitemap vide. Passer à `true` seulement lorsque les contenus réels et les informations légales sont prêts. Les réglages SEO « Exclure » du CMS restent prioritaires. L’exclusion des moteurs n’est pas un contrôle d’accès ; les pages publiées restent accessibles.

### Visuels temporaires locaux

Les images fournies dans `media/` sont ignorées par Git. `npm run preview:media` importe les huit fichiers numérotés dans une base locale dont le nom finit par `_test`, puis publie uniquement les images du hero et du savoir-faire. Les visuels portent la légende « Visuel d’ambiance temporaire » ; aucun produit, prix, témoignage ou membre fictif n’est créé. Le script refuse une base de production et un site indexable. Il supprime le compte technique éphémère éventuellement créé pour l’import. Les originaux ne sont pas supprimés.

Pour le logo : le téléverser dans la médiathèque, puis le sélectionner dans « Identité du site → Logo ». Il sera utilisé dans l’en-tête et le pied de page. Les fichiers de la médiathèque et la base doivent être transférés ou les médias téléversés à nouveau lors du passage au serveur ; un `git pull` seul ne transfère pas les données locales.

## Formulaire de contact et Resend

Configurer `RESEND_API_KEY`, `CONTACT_FROM` (adresse d’expédition vérifiée chez Resend) et `CONTACT_TO` (destinataire). Les clés ne sont jamais transmises au navigateur. En production, configurer aussi le header Apache décrit plus bas et `TRUST_PROXY=true`. Sans ces éléments, le formulaire affiche son indisponibilité et ne prétend pas envoyer de message. Les coordonnées publiques, distinctes du destinataire technique, se règlent dans le CMS.

Le formulaire valide les champs côté client et serveur, exige la prise de connaissance du traitement des données, contrôle l’origine et le type de contenu, limite la requête à 16 Ko et utilise un champ piège antispam. Les messages sont envoyés en texte brut ; le champ email validé sert de Reply-To. La confirmation est affichée seulement après réception de l’identifiant d’acceptation Resend. Cela confirme la prise en charge par le fournisseur, pas la livraison finale.

La limitation est atomique dans PostgreSQL, partagée entre instances : 5 tentatives par client sur 15 minutes et 50 par heure au total. Seule une empreinte HMAC de l’adresse IP est stockée, avec un compteur et une échéance ; les entrées expirées depuis plus de 24 heures sont nettoyées lors des demandes suivantes. Aucun nom, email ou texte de message n’est enregistré dans la base du site. Le fournisseur email et la boîte destinataire peuvent conserver les messages : compléter l’information de la page Contact et définir leur conservation avant ouverture du formulaire.

Le domaine d’envoi doit être vérifié chez Resend. Ajouter uniquement les enregistrements DNS qu’il fournit, en conservant les MX OVH et sans créer plusieurs enregistrements SPF concurrents. Ne jamais coller les clés dans le dépôt ou les captures d’écran.

## Médiathèque et stockage

Les images JPEG, PNG et WebP sont limitées à 10 Mo et 40 millions de pixels ; les vidéos MP4/WebM à 25 Mo. Le format réel est vérifié, les SVG sont refusés, les noms de fichiers sont générés et les imports depuis une URL sont désactivés. Les images produisent des variantes 480/960/1600 px sans agrandissement et sans conserver les métadonnées de la photo. Une description accessible est requise pour chaque média.

Les fichiers sont privés tant qu’ils ne sont pas référencés par un produit non archivé, un article arrivé à sa date de publication, un membre ou une page publiés. Les médias de l’identité du site (logo et image SEO) deviennent publics lors de l’enregistrement de ces réglages. Les fichiers et leurs variantes sont servis via les contrôles d’accès Payload avec `Cache-Control: private, no-store`. L’inventaire anonyme de la médiathèque est refusé ; les relations des contenus publiés restent peuplées. Un fichier déjà téléchargé ne peut pas être révoqué sur l’appareil d’un visiteur.

Sans configuration S3, le serveur utilise le volume persistant **media_data**, monté dans `/app/media`, en dehors de `public/`. Il faut sauvegarder ce volume en plus de PostgreSQL. En développement, les fichiers vont dans le dossier ignoré `media/`. Le conteneur de gestion partage le même volume ; ne pas exposer ce répertoire directement via Apache.

Pour utiliser S3, renseigner `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID` et `S3_SECRET_ACCESS_KEY`. Pour un service compatible S3, ajouter `S3_ENDPOINT` et éventuellement `S3_FORCE_PATH_STYLE=true`. Le bucket doit rester privé ; ne pas utiliser de politique publique, d’URL publique ou de CDN contournant Payload. L’adaptateur est inclus même lorsqu’il est désactivé, afin de garder le même schéma entre stockage local et S3. Changer de stockage ne transfère pas automatiquement les fichiers existants : prévoir une migration de fichiers avant un changement en production.

## Vérifications

```bash
npm run generate:types
npm run generate:importmap
npm run typecheck
npm test
npm run build
npm run test:integration
npx playwright install chromium
npm run test:e2e
```

Le build ne doit pas dépendre d’une base active : les pages reliées au CMS sont dynamiques. `/api/health` vérifie une requête réelle à PostgreSQL et retourne 503 en cas d’indisponibilité, sans détails internes. Le site reste exclu de l’indexation jusqu’à sa finalisation.

Les tests d’intégration exigent une base dédiée sans comptes dont le nom finit par `_test`. Ils démarrent un serveur de production local sur `127.0.0.1:3100`, créent des comptes et contenus fictifs puis les suppriment. Ils couvrent les rôles, les uploads, les médias privés, la publication, les brouillons, l’archivage, les articles futurs, les pages légales, les 404 et les limites d’envoi concurrentes. Ne pas les exécuter contre une base contenant des données réelles. Le runner utilise `--test-force-exit` après la fin des tests, car l’adaptateur PostgreSQL Payload 3.92.1 garde un client de reconnexion après `destroy()`.

Les tests Chromium utilisent le port 3200 et couvrent 375/768/1440 px, l’absence de débordement, le menu au clavier, la galerie, la navigation vers Contact, la validation et les erreurs d’envoi, ainsi que le mouvement réduit. Les réponses email y sont simulées dans le navigateur : aucun email réel n’est envoyé. La livraison réelle Resend et le stockage S3 doivent être vérifiés avec vos services configurés.

### État des dépendances

Les correctifs `sharp 0.35.5`, `dompurify 3.4.17` et `happy-dom 21.0.4` sont verrouillés pour éliminer les alertes élevées et critiques présentes dans les versions initiales. Après ajout des adaptateurs S3 et Resend, l’audit compte 10 alertes faibles via `deepmerge` dans Payload et ses adaptateurs, et 5 modérées via l’ancien outil de migration Drizzle/esbuild. Aucun `npm audit fix --force` : npm propose une rétrogradation incompatible de Payload. Ces alertes restent ouvertes ; revoir les versions et leur applicabilité avant la mise en production des contenus.

## Migrations

Le mode de synchronisation automatique du schéma est désactivé. Après un changement de modèle : `npm run migrate:create -- nom-de-la-modification`, inspecter la migration puis `npm run migrate`. Les migrations sont commitées. En production, elles sont également appliquées automatiquement à l’initialisation de Payload ; une erreur empêche la disponibilité de l’application. Effectuer une sauvegarde avant chaque mise à jour comportant des migrations et ne démarrer qu’une seule instance pendant leur application.

## Serveur Debian — préparation sans modifier Apache

Après intégration et validation via les PR `backend → develop → main`, cloner le dépôt sur le serveur (ne pas inscrire de token dans l’URL). Copier `.env.production.example` vers `.env`, remplacer les deux secrets puis protéger ce fichier avec `chmod 600 .env`.

```bash
docker compose build
docker compose up -d db --wait
docker compose --profile tools run --rm manage npm run migrate
docker compose --profile tools run --rm manage npm run bootstrap:admin
docker compose up -d app --wait
curl http://127.0.0.1:3000/api/health
```

Attendre `{"status":"ok"}` et vérifier la connexion CMS avant de remplacer la page temporaire. PostgreSQL n’a aucun port publié ; Next.js est lié uniquement à `127.0.0.1:3000`. Ne pas rouvrir les ports 3000 ou 5432 dans UFW ou la Freebox.

### Raccordement Apache (après validation seulement)

Sauvegarder les fichiers des virtual hosts actuels. Dans le virtual host HTTPS généré par Certbot (`hilouw-le-ssl.conf`), conserver les directives de certificat et ajouter :

```apache
ProxyRequests Off
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
RequestHeader unset X-Hilouw-Client-IP
RequestHeader set X-Hilouw-Client-IP "expr=%{REMOTE_ADDR}"
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

Conserver le virtual host HTTP et sa redirection HTTPS. Les directives `X-Hilouw-Client-IP` remplacent toute valeur fournie par un visiteur par l’adresse observée par Apache ; Next.js ne doit rester accessible que sur loopback. Activer ensuite `TRUST_PROXY=true` dans `.env` pour le contact. Vérifier `sudo apache2ctl configtest` avant `sudo systemctl reload apache2`. Tester le site, `/api/health`, la connexion `/admin` et `sudo certbot renew --dry-run`. Le remplacement du site temporaire n’est pas effectué par ce dépôt. En cas de problème, restaurer la configuration Apache sauvegardée et la recharger.

## Sauvegardes et mises à jour

Le volume nommé `postgres_data` conserve la base après recréation des conteneurs. Il ne constitue pas une sauvegarde. `docker compose down -v` détruirait les données : ne pas l’utiliser en production.

Exemple de sauvegarde manuelle, avant migration et avant d’ajouter de vraies données :

```bash
mkdir -p backups
chmod 700 backups
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/hilouw-$(date +%F-%H%M%S).dump"
```

Copier les sauvegardes chiffrées sur un autre support et tester leur restauration dans une base séparée. Une procédure automatique, sa rétention et les sauvegardes médias seront à finaliser avant production.

Pour les mises à jour : sauvegarder, récupérer la version validée de `main`, reconstruire les images et exécuter les migrations avant de redémarrer l’application. Un retour à une ancienne image n’annule pas une migration de base.

La migration `neutral_brand_copy` met à jour les anciennes mentions dans les textes éditoriaux du CMS, les descriptions SEO, les textes alternatifs et les versions enregistrées. Les liens, slugs et noms de fichiers restent stables. Le retour arrière du schéma ne restaure pas les anciens textes : conserver la sauvegarde avant migration.

## Git

Développement sur `backend`, `data` ou `frontend`, PR vers `develop`, puis PR `develop → main`. Aucun push direct sur `main` ni `develop`. Les contrôles de provenance existants sont conservés.
