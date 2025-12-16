# Projet AppSinf - Préparatoire

**Cours**: LINFO1212 - Projet d'approfondissement en sciences informatiques  
**Groupe**: PF16 (Lionel Hanon, Aktouf Anes, Nathan Cobut)

# Description

## Objectif

Le but est de réaliser un site web qui permet à des utilisateurs de vendre divers bien, et de les acheter.

## Structure du code

### Les pages webs

Nous utilisons une structure de layout. Pour charger une page, le code charge la page `./views/layout.ejs` avec comme argument le titre de la page et le fichier à charger. 
Ensuite `layout.ejs` vient tout seul indiquer les métadonnées, le header qui se trouve dans `/views/partials/header.ejs` et charge la page passée en argument.
Nous avons le même système pour les cartes de ventes. Elles sont codées une seule fois dans `/views/partials/product-card.ejs` et réutilisé dans la page d'accueil, l'historique des ventes et d'achat.

Ceci nous évite de devoir copier-coller du code sur plusieurs pages.

### Les fichiers codes .JS

1. `./server.js`
C'est le fichier principal qui contient le squelette du serveur. Il y a les routes et connecte tous les autres codes.

2. `./backend/….js`
Ce sont les fichiers qui travaillent des données pures.
Exemple : `db.js`, `check-input.js`, `document-search.js`, `utils.js`, `filter.js`

3. Les tests `./tests/….test.js`

# Installation

## 1. Création de la clé https
Avec openssl d'installé, faire cette commande dans votre terminal :
> `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365`

La clé de sécurité doit être "secretPasswordNoOneShouldHave".
Appuyez ENTREE pour toutes les autres valeurs

## 2. Installation du serveur NodeJS

> `npm install`
Installe les modules nécessaires.

## 3. Setup les bases de donnée
Si vous êtes sur linux, démarrer le serveur mongodb dans un terminal qui devra rester ouvert. `mongod --dbpath db/`

Nous utilisons la base de donnée `LouvainLaVente` comme base de donnée principale et `LouvainLaVente_TEST` pour lancer nos batteries de tests.

1. Setup de la base de donnée de base avec quelques données d'exemples.

> `mongoimport --db=LouvainLaVente --collection=users --file=./setup-data/users.json --jsonArray`
> Le mot de passe des utilisateurs préconfiguré est password.

> `mongoimport --db=LouvainLaVente --collection=sells --file=./setup-data/sells.json --jsonArray`


# 3. Utilisation

Le serveur peut se lancer avec la commande `node .\server.js`. Le site sera ensuite consultable en local sur `https://127.0.0.1:8080/`.

## Les tests

Les tests sont utilisables avec la commande `npm test`. Elle testera les codes backend, les routes, la base de données et grâce à Selenium l'interface sera testée.

Les tests créent leur propre base de données pour éviter que les erreurs impactent les données de la base de données de base.

Pour utiliser Selenium, Chrome devra être installé.
