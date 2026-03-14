# Cycle DevSecOps et pipeline CI/CD

Ce document décrit le cycle de vie de développement et le pipeline CI/CD mis en place pour Collector.shop.

## Objectif

Le processus DevSecOps vise à garantir la qualité, la sécurité et la fiabilité de l'application tout au long de son cycle de vie, depuis le développement jusqu'au déploiement.

---

## 1. Cycle de vie DevSecOps

### 1. Planification
- définition du backlog V1
- priorisation des user stories
- définition des critères d’acceptation

### 2. Développement
- développement par fonctionnalité sur branches Git
- commits réguliers
- revue de code avant fusion

### 3. Tests automatisés
- tests unitaires backend avec Maven
- tests end-to-end frontend avec Playwright

### 4. Contrôle qualité et sécurité
- vérification de la compilation
- exécution des tests automatisés
- scan de vulnérabilités des dépendances
- contrôle des erreurs de build

### 5. Intégration continue
- exécution automatique du pipeline à chaque push et pull request
- validation du backend et du frontend
- échec du pipeline si une étape critique échoue

### 6. Livraison
- construction des images Docker
- validation du bon démarrage de l’application dans l’environnement conteneurisé

### 7. Déploiement
- déploiement local via Docker Compose
- possibilité d’extension vers Kubernetes

### 8. Supervision
- supervision de la santé applicative avec `/actuator/health`
- exploitation des logs applicatifs
- préparation de la mesure des performances via tests de charge

---

## 2. Pipeline GitHub Actions

Workflow utilisé : `.github/workflows/ci.yml`

Déclencheurs :
- push
- pull request

### Job backend

Le job backend s’exécute sur `ubuntu-latest`.

Étapes :
1. récupération du code source
2. installation de Java 21 avec cache Maven
3. exécution des tests backend avec `mvn test`

Résultat attendu :
- le backend compile
- les tests unitaires passent
- la qualité minimale du socle applicatif est validée

### Job frontend

Le job frontend dépend du job backend.

Étapes :
1. récupération du code source
2. installation de Node.js
3. installation des dépendances NPM
4. build du frontend avec `npm run build`
5. démarrage de la stack applicative avec Docker Compose
6. attente de disponibilité du backend via `/actuator/health`
7. installation des navigateurs Playwright
8. exécution des tests end-to-end
9. arrêt de la stack Docker Compose

Résultat attendu :
- le frontend compile
- l’application fonctionne dans un environnement proche de l’exécution réelle
- les scénarios métier E2E passent

### Règle de validation

Le pipeline est en échec si :
- les tests Maven échouent
- le build frontend échoue
- le backend ne devient pas disponible
- les tests Playwright échouent

---

## 3. Intégration de la sécurité

La sécurité est intégrée dans la démarche DevSecOps selon les principes suivants :
- authentification et autorisation gérées côté backend
- contrôle des accès selon les rôles
- validation automatique du comportement applicatif par les tests
- scan des dépendances à intégrer au pipeline pour détecter les vulnérabilités connues
- exécution de l’application dans des conteneurs isolés

---

## 4. Lien avec les métriques qualité

Le pipeline contribue au suivi des métriques définies dans `docs/quality-metrics.md` :

- couverture de tests : mesurée côté backend
- taux de succès du pipeline : mesuré par GitHub Actions
- vulnérabilités critiques : mesurées par les scans de dépendances
- temps de réponse API : mesuré lors des tests de charge hors pipeline principal

---

## 5. Évolutions prévues

À court terme, le pipeline peut être enrichi avec :
- rapport de couverture JaCoCo
- scan OWASP Dependency Check
- build et publication des images Docker
- déploiement automatisé vers un environnement de recette