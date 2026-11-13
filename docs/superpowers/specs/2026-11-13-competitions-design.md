# Contexte de compétition dans Fanpo

## Objectif

Permettre au client API, aux commandes CLI et aux opérations de données et
d'analyse de choisir une compétition, notamment le Nations Championship.
L'option doit être une propriété cohérente du contexte des requêtes et du cache.

## Constat vérifié

Le site utilise `GET /api/jeux` pour découvrir les compétitions accessibles et
`X-PB-Jeu: <id>` sur les mêmes routes pour choisir un jeu secondaire. Le compte
testé voit le jeu principal TOP14 (1) et NC (2). Avec le jeu 2,
`GET /api/feuilles` renvoie la J5, dix nations annoncées et 230 joueurs.
Les identifiants et les limites de sélection viennent de l'API, pas d'une
table de correspondance codée en dur.

## Approches

1. Ajouter le header à la seule commande teamsheets : insuffisant, car joueurs,
   composition, budget et analyses resteraient dans un autre contexte.
2. Dupliquer le client pour l'international : mêmes endpoints et transport,
   duplication sans bénéfice.
3. Introduire un contexte de compétition partagé : approche proposée. Un seul
   transport applique le header ; toutes les opérations en héritent et le cache
   est isolé par compétition.

Le choix technique proposé par l'agent est la troisième approche.

## Interface proposée

- `FantasyClient({ baseUrl, token, competition?: Competition, fetch? })` ;
  contexte nommé, résolu via la découverte des jeux et appliqué par le transport.
- `client.getGames()` pour découvrir les compétitions et leurs métadonnées.
- `--nationchampionship` disponible pour toutes les commandes concernées, y compris
  `sync`, `data`, `analyze` et `compare`.
- Pas de variable qui change implicitement la compétition : Top 14 par défaut.
- Sans option ni variable, le jeu principal conserve le comportement actuel.
- Commande `games` et commandes neutres `competition standings/matches` ;
  conservation des commandes historiques `top14` pour compatibilité, avec
  documentation claire du contexte sélectionné.
- Exemples : `deno task cli games`, `deno task cli teamsheets --nationchampionship`,
  `deno task cli sync --nationchampionship`, `deno task cli analyze lineup --nationchampionship`.

## Refactorisation

Regrouper les modèles et requêtes de découverte des jeux dans un module API
de fonctionnalité. Centraliser la validation et la propagation du contexte dans
le transport et la configuration, sans ajouter des headers dans chaque endpoint.
Les méthodes publiques existantes et les chemins upstream restent compatibles.
La découverte des jeux est indépendante du jeu sélectionné.

Propager le même identifiant à la fabrique du client, aux opérations et au
stockage, y compris en mode hors ligne. Rendre le contexte visible dans les
sorties d'analyse et de statut pour éviter les confusions J5/J10.

Étendre la portée SQLite avec la compétition. Préserver la lecture des données
historiques du jeu principal et empêcher qu'une compétition secondaire réutilise
ou écrase ces données. La normalisation de la portée doit être déterministe,
indépendante de l'ordre des propriétés et testée avec une base existante.
L'identification explicite du jeu principal et le mode implicite doivent être
traités de façon documentée, sans attribuer des données anciennes au NC.

Utiliser les contraintes renvoyées par la composition (budget, club_limit,
format) aussi pour les nations. Ne pas prétendre que le modèle de prévision,
conçu initialement pour le championnat, est validé pour l'international :
conserver les avertissements et les projections non résolues si les données ou
formats requis manquent.

## Vérification

Tests du header sur toutes les familles de routes, de la découverte des jeux,
de la sélection explicite via la CLI, des identifiants invalides, du mode offline
sans token et de l'isolation des snapshots et entités entre compétitions.
Régression du fonctionnement sans option et du cache existant. Exécuter les
contrôles Deno et les tests du projet. Vérification réelle en lecture seule :
découverte des jeux puis feuilles Top 14 et NC sans modifier d'équipe.

## Périmètre

Pas de nouvel algorithme de scoring, de modification d'équipe sur le site,
de remplacement des changements de travail existants ni de commit automatique.
Documentation et exemples seront mis à jour avec l'implémentation.

## Décision utilisateur

Le 13 novembre, choix explicite de `--nationchampionship`, Top 14 par défaut.
Les identifiants numériques ne sont pas demandés à l’utilisateur.

## Précisions issues de la vérification réelle

L'API peut ignorer X-PB-Jeu pour une ressource identifiée : `/api/compos/1`
retourne l'équipe Top 14 même dans le contexte NC. Le client découvre donc
les ligues via `/api/ligues/mes-ligues`, choisit par défaut la ligue normale
trading globale/officielle et refuse les IDs étrangers au contexte NC.
Les fiches individuelles NC sont également vérifiées contre son catalogue.
Le mode hors ligne résout la ligue dans le snapshot local, sans authentification.
Les anciennes portées Top 14 de différents ordres de propriétés sont migrées
transactionnellement ; les observations brutes sont conservées.
