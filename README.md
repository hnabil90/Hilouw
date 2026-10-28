# HILOUW — Fondations

Site Next.js App Router + Payload CMS + PostgreSQL, destiné au serveur Debian derrière Apache. Cette étape livre une page d’attente administrable et les comptes CMS. Le catalogue, les médias S3, les actualités, le formulaire Resend et le design final seront ajoutés aux étapes suivantes.

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

Le site est sur `http://localhost:3000` et le CMS sur `/admin`. La commande d’initialisation demande les identifiants dans le terminal, masque le mot de passe et refuse d’ajouter un compte si un utilisateur existe déjà. Le formulaire public de création du premier compte est bloqué. Les administrateurs créent ensuite les autres comptes dans le CMS. Aucun mot de passe par défaut.

Le CMS expose « Identité du site » et les utilisateurs. Les éditeurs peuvent consulter et modifier leur propre compte mais ne peuvent pas se donner le rôle administrateur, créer des comptes ou modifier l’identité du site. Aucun service d’email n’est configuré à cette étape ; la récupération de mot de passe par email sera activée avec le service transactionnel.

## Vérifications

```bash
npm run generate:types
npm run generate:importmap
npm run typecheck
npm test
npm run build
npm run test:integration
```

Le build ne doit pas dépendre d’une base active : les pages reliées au CMS sont dynamiques. `/api/health` vérifie une requête réelle à PostgreSQL et retourne 503 en cas d’indisponibilité, sans détails internes. Le site reste exclu de l’indexation jusqu’à sa finalisation.

Les tests d’intégration exigent une base vide dont le nom finit par `_test`. Ils démarrent un serveur de production local sur `127.0.0.1:3100`, créent des comptes fictifs puis les suppriment. Ne pas les exécuter contre une base contenant des données réelles. Le runner utilise `--test-force-exit` après la fin des tests, car l’adaptateur PostgreSQL Payload 3.92.1 garde un client de reconnexion après `destroy()`.

### État des dépendances

Les correctifs `sharp 0.35.5`, `dompurify 3.4.17` et `happy-dom 21.0.4` sont verrouillés pour éliminer les alertes élevées et critiques présentes dans les versions initiales. L’audit reste à surveiller : 7 alertes faibles via `deepmerge` dans Payload et 5 modérées via l’ancien outil de migration Drizzle/esbuild. Aucun `npm audit fix --force` : npm propose une rétrogradation incompatible de Payload. Ces alertes restent ouvertes ; revoir les versions et leur applicabilité avant la mise en production des contenus.

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
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

Conserver le virtual host HTTP et sa redirection HTTPS. Vérifier `sudo apache2ctl configtest` avant `sudo systemctl reload apache2`. Tester le site, `/api/health`, la connexion `/admin` et `sudo certbot renew --dry-run`. Le remplacement du site temporaire n’est pas effectué par ce dépôt. En cas de problème, restaurer la configuration Apache sauvegardée et la recharger.

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

## Git

Développement sur `backend`, `data` ou `frontend`, PR vers `develop`, puis PR `develop → main`. Aucun push direct sur `main` ni `develop`. Les contrôles de provenance existants sont conservés.
