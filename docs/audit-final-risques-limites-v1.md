# Audit final – Risques et limites de la V1 (Collector.shop)

Document préparatoire pour l’étape 9.1 de la soutenance technique : état des lieux des risques et limites de la V1, **sans modification du projet**. Exploitable pour le plan de remédiation et la démonstration de recul critique.

---

## 1. Risques sécurité restants

### 1.1 Secrets et gestion de la configuration

- **Valeurs par défaut en clair** : `application.yml` contient des valeurs par défaut pour `JWT_SECRET`, `SPRING_DATASOURCE_*`, `APP_CORS_ALLOWED_ORIGIN`. En cas d’oubli de surcharge en environnement sensible, le secret JWT et les identifiants DB restent prévisibles.
- **Pas de gestion centralisée des secrets** : pas d’intégration à un secret manager (Vault, AWS Secrets Manager, variables secrètes GitHub utilisées pour la config runtime). Les secrets en CI (ex. Sonar) sont les seuls gérés via GitHub Secrets.
- **Risque** : exposition du secret JWT ou de la base en dev/démo, réutilisation en prod si les mêmes fichiers sont déployés.

### 1.2 JWT et authentification

- **Stockage du token** : le JWT est stocké dans `localStorage` côté frontend. Vulnérable au vol par XSS ; pas de refresh token ni de mécanisme de rotation.
- **Révocation** : pas de blacklist ni de durée courte ; un token valide jusqu’à expiration reste utilisable même après déconnexion ou changement de rôle.
- **Secret partagé** : un seul secret HMAC pour signer tous les tokens ; compromission du secret = compromission de tous les comptes.

### 1.3 Rôles et autorisation

- **Rôle à l’inscription** : le rôle est bien forcé à `BUYER` côté backend (pas d’injection de rôle). En revanche, la création d’utilisateurs ADMIN/SELLER reste possible uniquement via les migrations ou des accès directs à la base (pas d’endpoint dédié ni de processus documenté).
- **Granularité** : autorisation par rôle uniquement (BUYER, SELLER, ADMIN) ; pas de notion de ressource (ex. « propriétaire de l’item ») au-delà du rôle.
- **Swagger / Actuator** : Swagger et les endpoints Actuator (health, info, metrics, prometheus) sont en `permitAll()` ; en production, exposition de la doc et des métriques sans authentification peut être indésirable.

### 1.4 Exposition des endpoints techniques

- **Actuator** : health, info, metrics, prometheus sont exposés et publics. En prod, metrics/prometheus devraient idéalement être restreints (réseau interne ou auth).
- **Swagger** : `/swagger-ui`, `/v3/api-docs` publics ; la propriété `app.swagger.enabled` existe mais n’est pas utilisée pour restreindre l’accès dans SecurityConfig.
- **Risque** : fuite d’informations sur les versions, dépendances ou métriques JVM si l’application est exposée sur Internet.

### 1.5 HTTPS et certificats

- **Certificat auto-signé** : en démo, Nginx utilise un certificat généré localement (`gen-cert.sh`). Pas de chaîne de confiance ; les navigateurs affichent un avertissement. Acceptable pour une démo, inadapté pour une prod publique.
- **Pas de renouvellement automatique** : pas d’intégration Let’s Encrypt / ACME ; en prod il faudrait un processus de renouvellement et un certificat reconnu.

### 1.6 Scans dépendances et images

- **OWASP Dependency Check** : exécuté dans un workflow séparé (main/master, manuel, planifié), avec `continue-on-error: true` et `failBuildOnAnyVulnerability: false`. Les vulnérabilités ne bloquent pas le pipeline ; le rapport est en artifact mais pas de gate qualité.
- **npm audit** : en `continue-on-error: true` ; idem, pas de blocage en cas de vulnérabilités.
- **Trivy** : `--exit-code 0` ; les images ne font pas échouer le build en cas de CVE.
- **Limite** : les scans sont présents et démontrables, mais aucun n’est bloquant ; une V1 « propre » en soutenance peut tout de même contenir des dépendances ou couches d’image vulnérables.

### 1.7 Limites globales de la sécurité actuelle

- Pas de rate limiting ni d’API Gateway ; exposition au brute-force sur login et au sur-appel.
- Pas de politique de mot de passe (complexité, historique) côté backend.
- Logs non structurés ; pas de masquage systématique des données sensibles dans les logs.
- CORS configurable mais une seule origine ; pas de liste multi-origines pour plusieurs frontends.

---

## 2. Risques qualité et maintenabilité

### 2.1 Dette technique potentielle

- **Couverture cible** : objectif ≥ 70 % (quality-metrics.md) ; pas de seuil bloquant dans le pipeline (JaCoCo en artifact uniquement). Le build peut rester vert avec une couverture faible.
- **Tests E2E** : dépendance à la stack Docker et aux utilisateurs seed (buyer, seller) ; sensibilité aux délais (health, migrations). Une instabilité réseau ou ressource en CI peut faire flaker les E2E.
- **Pas de tests de charge** : le temps de réponse API (objectif < 500 ms) n’est pas vérifié automatiquement dans le pipeline.

### 2.2 Qualité de couverture

- **Backend** : couverture mesurée par JaCoCo ; certaines branches ou cas d’erreur peuvent être peu ou pas couverts (controllers, services, sécurité).
- **Frontend** : pas de couverture de code (type Istanbul) dans le pipeline ; seule la lint (ESLint) et les E2E Playwright sont exécutés.
- **Intégration** : les tests avec Testcontainers couvrent une partie du flux réel (DB), mais pas tous les chemins métier.

### 2.3 Limites SonarQube

- **Sonar Cloud** : exécuté après backend et frontend ; les Quality Gates (seuils de bugs, vulnérabilités, couverture) peuvent être configurés côté SonarCloud mais ne sont pas forcément bloquants dans le workflow GitHub (dépend de la config du projet).
- **Duplication / dette** : si les règles Sonar sont souples, de la duplication ou de la dette peut s’accumuler sans faire échouer le pipeline.

### 2.4 Dépendances sensibles

- **Versions** : certaines dépendances sont en version fixe (ex. springdoc, jjwt, Flyway) ; d’autres héritent du BOM Spring Boot. Pas de politique explicite de mise à jour (Dependabot, Renovate) ni de gate sur les majors.
- **Licences** : pas d’audit de licences dans le pipeline ; risque légal si des dépendances à licence restrictive sont introduites.

### 2.5 Points de fragilité du code

- **Frontend** : gestion d’erreur générique (catch sans détail) sur le login ; message « Invalid credentials » pour toute erreur (réseau, 401, 500), ce qui complique le diagnostic.
- **Backend** : exceptions métier mappées en ProblemDetail ; cohérent mais pas de traçabilité (corrélation request, traceId) pour le débogage distribué.
- **Single point of failure** : un seul backend, une seule base ; pas de redondance ni de bascule.

---

## 3. Risques d’exploitation et observabilité

### 3.1 Limites des logs

- **Niveau** : `logging.level.root: INFO` ; pas de réglage par package (ex. debug pour un module précis).
- **Format** : logs texte classique (Logback par défaut), non structurés (pas de JSON) ; difficile à parser par un outil type ELK/Loki sans parsing ad hoc.
- **Contenu** : pas de convention de champs (traceId, userId, action) ; pas de masquage explicite des données sensibles.
- **Consultation** : en Docker, `docker compose logs` ; pas de centralisation ni de rétention configurée.

### 3.2 Limites du monitoring

- **Actuator** : health, info, metrics, prometheus exposés ; suffisant pour une démo et un premier niveau de supervision.
- **Prometheus** : une seule cible (backend) ; pas de scrape du frontend (pas d’export métriques côté React), ni de Nginx, ni de PostgreSQL.
- **Grafana** : datasource Prometheus provisionnée ; pas de dashboards pré-configurés ni d’alertes. L’observabilité est « disponible » mais nécessite une configuration manuelle pour être exploitable au quotidien.

### 3.3 Absence d’alerting

- Aucune règle d’alerte (Prometheus Alertmanager, PagerDuty, etc.) ; pas de notification en cas de down, dégradation ou seuil dépassé.
- La santé est consultable (health, targets Prometheus) mais personne n’est notifié automatiquement en cas d’incident.

### 3.4 Limites Prometheus / Grafana en l’état

- **Rétention** : stockage Prometheus par défaut dans le conteneur ; pas de volume persistant en Compose ; les métriques sont perdues au redémarrage du conteneur.
- **Scalabilité** : une seule instance Prometheus et une seule Grafana ; pas de haute disponibilité ni de fédération.
- **Usage** : adapté à la démo et à l’exploration manuelle ; pas à un runbook ou à une on-call production.

---

## 4. Risques performance et scalabilité

### 4.1 Limites de l’architecture actuelle

- **Monolithe** : un seul service backend ; toute montée en charge passe par la verticale (plus de CPU/RAM) ou le déploiement de plusieurs instances derrière un load balancer non présent aujourd’hui.
- **Frontend** : SPA servie en statique ; pas de SSR ni de cache HTTP configuré (Nginx peut être configuré pour du cache statique mais ce n’est pas documenté comme en place).

### 4.2 Limites Docker Compose

- **Orchestration** : Compose gère le démarrage et les healthchecks mais pas le redémarrage automatique en cas de panne (restart policy possible mais pas de politique documentée), ni le scaling horizontal.
- **Réseau** : un seul réseau bridge ; pas de segmentation (front/back/DB) pour une isolation renforcée.
- **Volumes** : données PostgreSQL et éventuellement Prometheus ; pas de stratégie de backup documentée.

### 4.3 Absence de cache et de load balancing

- Pas de cache applicatif (ex. Redis) pour les sessions, les catalogues ou les résultats de requêtes.
- Pas de load balancer devant le backend ; une seule instance. Pas de répartition de charge ni de gestion de pics.

### 4.4 Limites base de données

- **Une seule instance PostgreSQL** : pas de réplication, pas de failover ; panne = indisponibilité complète.
- **Connexions** : pool HikariCP par défaut ; pas de tuning documenté (max pool size, timeouts) pour la charge attendue.
- **Migrations** : Flyway en mode classique ; pas de stratégie de rollback ou de migration zero-downtime documentée.

### 4.5 Montée en charge

- Aucun test de charge (JMeter ou autre) dans le pipeline ; l’objectif « temps de réponse < 500 ms » n’est pas validé automatiquement.
- Comportement sous charge (10, 100, 1000 utilisateurs concourants) inconnu ; risque de saturation CPU, mémoire ou connexions DB.

---

## 5. Risques déploiement et industrialisation

### 5.1 Adapté à la démo, pas à une prod réelle

- **Environnement** : une stack unique (dev/démo) ; pas de distinction claire dev / recette / prod (profils, configs, secrets).
- **Certificats** : auto-signés ; en prod il faudrait des certificats reconnus et un renouvellement automatisé.
- **Scans** : non bloquants ; en prod on attendrait des gates (0 vulnérabilité critique, seuils de couverture).
- **Pipeline** : pas d’étape de déploiement automatique (build d’images, push registry, déploiement K8s ou autre) ; tout est « build + test + analyse ».

### 5.2 Points à renforcer avant une mise en production réelle

- **Secrets** : utiliser un secret manager et ne plus avoir de valeurs sensibles par défaut dans les fichiers.
- **Sécurité** : rate limiting, durcissement des endpoints (restreindre Swagger/Actuator ou les mettre derrière auth), politique de mots de passe, éventuellement refresh token.
- **Observabilité** : logs structurés (JSON), centralisation (Loki ou équivalent), alerting (Alertmanager ou intégration à un outil de monitoring).
- **Résilience** : redondance backend et DB (réplication, failover), healthchecks et restart policies explicites.
- **CI/CD** : Quality Gates bloquants (Sonar, couverture, vulnérabilités), déploiement automatisé vers un environnement de recette puis prod avec validation.
- **Backup / DR** : stratégie de sauvegarde PostgreSQL et de restauration documentée et testée.

---

## 6. Résumé final

### 6.1 Liste claire des limites de la V1

| Domaine | Limites principales |
|--------|---------------------|
| **Sécurité** | Secrets par défaut en clair ; JWT en localStorage, pas de révocation ; endpoints techniques (Swagger, Actuator) publics ; certificat auto-signé ; scans non bloquants ; pas de rate limiting. |
| **Qualité** | Pas de gate sur la couverture ; E2E sensibles à l’environnement ; pas de tests de charge ; pas d’audit de licences. |
| **Observabilité** | Logs non structurés, pas de centralisation ; pas d’alerting ; Prometheus/Grafana sans persistance ni dashboards/alertes prêts. |
| **Performance / Scalabilité** | Une seule instance backend et DB ; pas de cache, pas de LB ; pas de test de charge ; comportement sous charge inconnu. |
| **Déploiement** | Pas d’environnements multiples ; pas de déploiement automatisé ; pas de stratégie backup/DR. |

### 6.2 Formulation exploitable pour le plan de remédiation

- **Court terme (soutenance / démo)** : la V1 est cohérente pour démontrer le cycle DevSecOps (CI, tests, scans, HTTPS, observabilité de base). Les limites ci-dessus peuvent être présentées comme connues et acceptées pour le périmètre V1.
- **Moyen terme (préparation prod)** : prioriser (1) gestion des secrets et durcissement des endpoints techniques, (2) scans et Quality Gates bloquants, (3) logs structurés et alerting minimal, (4) stratégie de backup et redondance DB.
- **Long terme (industrialisation)** : introduire des environnements (recette/prod), déploiement automatisé, tests de charge, cache et load balancing, et renforcement continu de la sécurité (rate limiting, politique mots de passe, évolution JWT).

Ce document peut être cité tel quel en soutenance pour montrer la prise de recul sur les risques et limites de la V1 et pour enchaîner sur un plan de remédiation priorisé.
