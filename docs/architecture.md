# Architecture

Ce document décrit l’architecture technique de haut niveau de l’application Collector.shop.

## Architecture logicielle interne

### Backend

- `controller` : couche API HTTP exposant les endpoints REST pour les articles, les catégories et l’authentification.
- `service` : services métiers orchestrant la logique applicative, la validation et l’accès aux repositories.
- `repository` : repositories Spring Data JPA pour les entités `User`, `Category` et `ItemListing`.
- `domain` : entités JPA et énumérations représentant le modèle métier.
- `dto` : objets de transfert de données utilisés pour les requêtes et réponses API.
- `mapper` : composants de transformation entre entités métier et DTO.
- `security` : gestion de l’authentification JWT, filtres de sécurité et configuration Spring Security.
- `exception` : exceptions métiers et gestion globale des erreurs via `ProblemDetail`.

### Frontend

- `pages` : pages principales (catalogue, détail d’article, connexion, inscription, publication d’annonce vendeur, gestion des catégories administrateur).
- `components` : composants UI réutilisables.
- `services` : clients API (Axios) et logique d’accès aux services backend.
- `routes` : gestion des routes protégées et contrôle des rôles.
- `hooks` : hooks réutilisables (gestion de l’authentification, état global).

### Infrastructure

- `infra/compose` : configuration Docker Compose pour PostgreSQL, backend et frontend.
- `infra/k8s` : emplacement prévu pour les manifests Kubernetes dans une évolution future.

---

## Flux de données applicatifs

1. Le frontend communique avec le backend via Axios en utilisant l’URL définie par `VITE_API_URL`.
2. Les contrôleurs valident les entrées (`@Valid`) puis délèguent aux services.
3. Les services manipulent les entités métier et accèdent aux repositories.
4. Les réponses API sont construites via les DTO.
5. La sécurité est assurée via une authentification JWT et une autorisation basée sur les rôles (BUYER, SELLER, ADMIN).

---

## Vue d’ensemble de l’architecture système

L’application Collector.shop repose sur une architecture web en trois couches composée de :

- un frontend développé en React assurant l’interface utilisateur
- un backend développé avec Spring Boot exposant une API REST
- une base de données PostgreSQL assurant la persistance des données
- une infrastructure conteneurisée via Docker Compose
- une chaîne d’intégration continue basée sur GitHub Actions

Cette architecture permet une séparation claire des responsabilités, une bonne maintenabilité et une préparation à l’industrialisation.

---

## Flux applicatifs principaux

### Consultation du catalogue public

Utilisateur → Frontend React → API Spring Boot → PostgreSQL

### Authentification

Utilisateur → Formulaire de connexion → API → Génération JWT → Accès sécurisé aux endpoints

### Publication d’un article

Vendeur → Frontend React → Endpoint sécurisé → Enregistrement en base PostgreSQL

### Gestion des catégories

Administrateur → Route frontend sécurisée → Endpoint backend sécurisé → Mise à jour base de données

---

## Architecture de sécurité

La sécurité est intégrée à plusieurs niveaux :

- authentification basée sur JWT
- autorisation basée sur les rôles (BUYER, SELLER, ADMIN)
- protection des endpoints sensibles
- validation des entrées via Bean Validation
- isolation des services via conteneurs Docker
- supervision de la santé applicative via Spring Boot Actuator

Améliorations envisagées :

- terminaison HTTPS via reverse proxy
- scan automatique des vulnérabilités dans le pipeline CI
- mise en place de mécanismes de rate limiting ou d’un API Gateway

---

## Architecture de déploiement

L’application est déployée localement via Docker Compose comprenant :

- un conteneur PostgreSQL
- un conteneur backend Spring Boot
- un conteneur frontend React

Cette approche permet :

- un environnement reproductible
- une démonstration simplifiée
- une préparation à une future orchestration Kubernetes

---

## Observabilité

Une observabilité minimale est assurée via :

- endpoint `/actuator/health`
- journaux applicatifs
- préparation à l’intégration d’outils de monitoring (Prometheus, Grafana)

---

## Justification des choix architecturaux

Cette architecture a été choisie afin de :

- garantir la modularité et la maintenabilité
- permettre un prototypage rapide
- faciliter l’industrialisation future
- s’aligner avec les pratiques DevOps modernes