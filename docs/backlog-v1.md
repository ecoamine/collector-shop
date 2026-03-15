# Backlog V1 – Collector.shop

## Objectif de la V1

La version 1 de Collector.shop vise à démontrer la faisabilité technique d’une plateforme de vente d’objets de collection entre particuliers.  
Le prototype se concentre sur les fonctionnalités essentielles permettant la consultation et la publication d’articles avec authentification et gestion des rôles.

---

## Périmètre inclus

- consultation publique des articles
- inscription utilisateur
- authentification avec JWT
- publication d’un article par un vendeur
- gestion des catégories par un administrateur

---

## Hors périmètre V1

- paiement en ligne
- chat temps réel
- notifications email
- système de recommandation
- détection automatisée de fraude
- internationalisation

---

## User Stories

### US1 – Consulter les articles

En tant que visiteur  
Je veux consulter la liste des articles  
Afin de parcourir le catalogue sans être authentifié

#### Critères d’acceptation

- l’API retourne la liste des articles publiés
- aucun login requis
- chaque article contient titre, description, prix, catégorie
- réponse HTTP cohérente

---

### US2 – Inscription et connexion

En tant qu’utilisateur  
Je veux créer un compte et me connecter  
Afin d’accéder aux fonctionnalités de la plateforme

#### Critères d’acceptation

- inscription avec email et mot de passe
- connexion génère un JWT
- accès aux routes protégées nécessite un token valide
- erreurs gérées proprement

---

### US3 – Publier un article

En tant que vendeur authentifié  
Je veux publier un article  
Afin de proposer un objet à la vente

#### Critères d’acceptation

- rôle vendeur requis
- validation des champs obligatoires
- persistance en base PostgreSQL
- article visible dans le catalogue

---

### US4 – Gestion des catégories

En tant qu’administrateur  
Je veux gérer les catégories  
Afin d’organiser le catalogue

#### Critères d’acceptation

- rôle admin requis
- création / suppression possible
- catégories disponibles pour les articles