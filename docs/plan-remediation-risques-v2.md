# Plan de remédiation des risques – Roadmap V2 (Collector.shop)

Document préparatoire pour l’étape 9.3 de la soutenance technique : plan d’actions structuré pour traiter les risques identifiés et priorisés, **sans modification du code existant**. Support direct pour la démonstration de capacité d’industrialisation et pour une roadmap crédible face à un jury.

**Références :**
- [Audit final des risques et limites V1](audit-final-risques-limites-v1.md)
- [Priorisation des risques V1](priorisation-risques-v1.md)

---

## Vue d’ensemble

Le plan est organisé en trois horizons :

| Horizon | Périmètre | Risques ciblés | Objectif |
|---------|-----------|----------------|----------|
| **Court terme** | Avant mise en production réelle | P1 (R1–R5) | Rendre le déploiement acceptable d’un point de vue sécurité et opérationnel. |
| **Moyen terme** | Amélioration continue (post-go-live) | P2 (R6–R12) + sélection P3 | Renforcer la sécurité, l’observabilité et la maintenabilité au quotidien. |
| **Long terme** | Industrialisation complète | P4 (R22–R29) + évolutions | Aligner l’architecture et les processus avec une exploitation professionnelle. |

**Légende des efforts :** S = petit (quelques heures à 1 jour), M = moyen (2–5 jours), L = large (1–2 semaines), XL = très large (plusieurs semaines, dépend du contexte).

---

# 1. Plan court terme (avant production)

Objectif : **ne pas mettre en production sans avoir traité ces cinq axes**. Chaque action correspond à un risque critique P1.

---

## Action CT1 – Sécuriser la gestion des secrets (R1)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Supprimer ou neutraliser les valeurs par défaut sensibles dans `application.yml` et `application-docker.yml` pour les environnements de type production. Pour la prod : ne plus avoir de défaut pour `JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_URL`. Utiliser des profils Spring (`prod`) où ces propriétés n’ont pas de valeur par défaut (le démarrage échoue si les variables d’environnement sont absentes). Documenter la liste des variables obligatoires et le moyen de les fournir (fichier .env non versionné, variables d’environnement du runtime). |
| **Objectif** | Éviter qu’un déploiement en prod utilise par erreur des secrets prévisibles (JWT, base de données). |
| **Effort estimé** | **S** (0,5–1 jour) |
| **Impact attendu** | Réduction du risque de compromission en cas d’oubli de configuration ; conformité aux bonnes pratiques « aucun secret par défaut en prod ». |
| **Priorité** | P1 |
| **Dépendances** | Aucune. Prérequis pour un déploiement prod. |

---

## Action CT2 – Rendre les scans de vulnérabilités bloquants (R2)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Dans le workflow OWASP Dependency Check : retirer `continue-on-error: true` et configurer `failBuildOnAnyVulnerability: true` (ou un seuil strict, ex. fail sur critique/high). Dans le workflow principal CI : pour `npm audit`, retirer `continue-on-error: true` ou n’accepter que les niveaux « low » / « moderate » selon politique. Pour Trivy : utiliser `--exit-code 1` (ou 2 pour les vulnérabilités UNKNOWN) afin que la présence de CVE critiques/high fasse échouer le job. Définir une règle simple (ex. « 0 vulnérabilité critique ») et documenter la procédure de dérogation temporaire (ex. issue + ticket de remédiation). |
| **Objectif** | Empêcher la livraison d’artefacts ou d’images contenant des vulnérabilités critiques connues. |
| **Effort estimé** | **S** à **M** (1–2 jours, incluant le traitement des éventuelles CVE déjà présentes) |
| **Impact attendu** | La pipeline devient un gate de sécurité ; toute livraison respecte un seuil minimal de vulnérabilités. |
| **Priorité** | P1 |
| **Dépendances** | Aucune. Peut nécessiter de mettre à jour ou remplacer des dépendances pour passer le gate. |

---

## Action CT3 – Mettre en place une stratégie de backup et de restauration (R3)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Documenter et automatiser les sauvegardes PostgreSQL : utiliser `pg_dump` (ou outil équivalent) avec une fréquence définie (ex. quotidienne), stocker les sauvegardes sur un support distinct du serveur (volume, stockage objet, autre machine). Définir une rétention (ex. 7 jours, 4 semaines). Rédiger une procédure de restauration (restore depuis un dump) et la tester au moins une fois (environnement de recette). Si le déploiement est sur Docker Compose : script ou job planifié (cron) pour lancer le dump et l’archivage. |
| **Objectif** | Garantir la possibilité de récupérer les données après une panne, une erreur humaine ou une corruption. |
| **Effort estimé** | **M** (2–3 jours pour script, documentation et test de restauration) |
| **Impact attendu** | Réduction du risque de perte définitive des données ; conformité aux attentes minimales d’exploitation. |
| **Priorité** | P1 |
| **Dépendances** | Aucune. Recommandé avant tout déploiement contenant des données persistantes. |

---

## Action CT4 – Certificat HTTPS reconnu et renouvellement (R4)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Pour un déploiement exposé sur Internet : utiliser un certificat émis par une CA reconnue (Let’s Encrypt ou fournisseur commercial). Intégrer un mécanisme de renouvellement automatique (ex. Certbot avec cron, ou renouvellement ACME intégré au reverse proxy). Adapter la configuration Nginx pour charger le certificat et la clé (fichiers ou chemin fournis par Certbot). Documenter l’installation et le renouvellement pour l’environnement cible (VM, hébergement). Pour une démo en local, conserver le certificat auto-signé et le documenter comme tel. |
| **Objectif** | Offrir un HTTPS fiable en production (confiance navigateur, pas d’avertissement) et éviter l’expiration du certificat. |
| **Effort estimé** | **M** (1–2 jours selon environnement et expérience avec Certbot/ACME) |
| **Impact attendu** | Conformité aux attentes utilisateur et aux bonnes pratiques ; réduction du risque de phishing lié à l’acceptation d’un certificat non reconnu. |
| **Priorité** | P1 |
| **Dépendances** | Accès à un nom de domaine et à la configuration DNS (pour Let’s Encrypt). Déploiement sur un environnement exposé (pas uniquement local). |

---

## Action CT5 – Mise en place du rate limiting (R5)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Introduire une limitation du nombre de requêtes par IP (et éventuellement par utilisateur authentifié) sur au minimum l’endpoint de login (`POST /api/auth/login`) pour limiter le brute-force. Options : filtre Spring (bucket4j, resilience4j, ou filtre custom basé sur un cache en mémoire / Redis), ou rate limiting au niveau du reverse proxy (Nginx `limit_req_zone`). Définir des seuils raisonnables (ex. 5 tentatives par minute par IP pour le login) et documenter la configuration. Étendre ensuite à l’API globale si nécessaire (ex. 100 req/min par IP pour les endpoints publics). |
| **Objectif** | Réduire le risque de brute-force sur l’authentification et de déni de service par sur-appel. |
| **Effort estimé** | **M** (1–2 jours pour implémentation, tests et réglage des seuils) |
| **Impact attendu** | Limitation des abus et des attaques automatisées ; meilleure résilience face à des pics de requêtes. |
| **Priorité** | P1 |
| **Dépendances** | Aucune. Peut être fait en parallèle des autres actions court terme. |

---

### Synthèse court terme

| Action | Risque | Effort | Ordre suggéré |
|--------|--------|--------|----------------|
| CT1 – Secrets sans défaut en prod | R1 | S | 1 |
| CT2 – Scans bloquants | R2 | S–M | 2 |
| CT3 – Backup et restauration | R3 | M | 3 |
| CT4 – Certificat HTTPS reconnu | R4 | M | 4 (si déploiement public) |
| CT5 – Rate limiting | R5 | M | 5 |

**Message pour le jury :** « Avant toute mise en production, nous traitons les cinq risques critiques : secrets, gates de vulnérabilités, backup, HTTPS fiable et rate limiting. C’est le minimum pour un déploiement responsable. »

---

# 2. Plan moyen terme (amélioration continue)

Objectif : **renforcer la sécurité, l’observabilité et la maintenabilité** après la première mise en production ou en phase de préparation au go-live. Correspond aux risques P2 et à une sélection de P3.

---

## Action MT1 – Restreindre l’exposition de Swagger et Actuator en prod (R6)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Utiliser la propriété `app.swagger.enabled` pour désactiver ou restreindre l’exposition de Swagger en production (ex. `APP_SWAGGER_ENABLED=false` en prod). Dans `SecurityConfig`, conditionner l’autorisation des chemins Swagger et Actuator (metrics, prometheus) à cette propriété ou à un profil (ex. ne permettre l’accès anonyme qu’en dev/demo). En prod : soit désactiver Swagger, soit le protéger (réseau interne, VPN, ou authentification basique). Pour Actuator : restreindre metrics/prometheus au réseau interne ou à un utilisateur dédié (actuator user). |
| **Objectif** | Réduire la surface d’attaque et la fuite d’informations (structure API, versions, métriques JVM). |
| **Effort estimé** | **S** (0,5–1 jour) |
| **Impact attendu** | Alignement avec le principe du moindre privilège ; moins d’informations exposées à des tiers. |
| **Priorité** | P2 |
| **Dépendances** | Profils ou variables d’environnement par environnement (lié à MT7). |

---

## Action MT2 – Sécuriser le stockage du JWT côté frontend (R7)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Éviter `localStorage` pour le token. Options : stocker le JWT dans un cookie `httpOnly` (émis par le backend en réponse au login, lu automatiquement par le navigateur) ou utiliser un token court en mémoire avec refresh token en httpOnly. Implémentation typique : backend renvoie un cookie `Set-Cookie` avec le JWT (ou un refresh token) en httpOnly, secure, sameSite=strict ; le frontend n’accède plus au token via JavaScript, ce qui limite le vol par XSS. Adapter le client Axios pour envoyer les requêtes avec `credentials: 'include'` et ne plus gérer un header `Authorization` depuis le stockage. |
| **Objectif** | Réduire le risque de vol de session par XSS (le token n’est plus lisible par un script). |
| **Effort estimé** | **M** (2–3 jours, incluant tests et gestion des cas cross-origin si nécessaire) |
| **Impact attendu** | Meilleure résilience face à des failles XSS ; alignement avec les recommandations OWASP. |
| **Priorité** | P2 |
| **Dépendances** | Compatibilité CORS et configuration des cookies (origine, domaine). Peut être combiné avec MT3 (refresh token). |

---

## Action MT3 – Révocation des tokens JWT (R8)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Introduire un mécanisme d’invalidation des tokens : soit une blacklist (store en mémoire ou Redis des jti révoqués jusqu’à leur expiration), soit des tokens à courte durée (ex. 15 min) avec refresh token. À la déconnexion (ou changement de rôle), révoquer le token courant (blacklist) ou invalider le refresh token. Le filtre JWT doit vérifier la blacklist à chaque requête (ou ne délivrer de nouveaux access tokens que si le refresh token est valide et non révoqué). Documenter la durée de vie des tokens et le comportement en cas de déconnexion. |
| **Objectif** | Permettre d’invalider une session immédiatement (déconnexion, vol de token, changement de rôle). |
| **Effort estimé** | **M** à **L** (2–5 jours selon choix : blacklist simple vs refresh token) |
| **Impact attendu** | Contrôle des accès en temps réel et meilleure conformité aux exigences de gestion des sessions. |
| **Priorité** | P2 |
| **Dépendances** | Store partagé (Redis ou DB) si plusieurs instances backend ; sinon blacklist en mémoire suffit pour une instance. |

---

## Action MT4 – Alerting opérationnel (R9)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Mettre en place un minimum d’alertes à partir des métriques déjà exposées (Prometheus) : alerte « instance down » (target backend absent ou health en erreur), alerte sur taux d’erreurs HTTP 5xx, éventuellement alerte sur latence élevée. Utiliser Prometheus Alertmanager ou l’intégration native de Grafana (alerting) pour envoyer des notifications (email, Slack, etc.). Configurer des seuils réalistes et documenter la procédure de réaction. Optionnel : dashboard Grafana dédié « santé » avec les métriques clés. |
| **Objectif** | Détecter rapidement les pannes ou dégradations et permettre une réaction (investigation, rollback, communication). |
| **Effort estimé** | **M** (1–2 jours pour règles + canal de notification + test) |
| **Impact attendu** | Réduction du temps de détection des incidents ; exploitation plus professionnelle. |
| **Priorité** | P2 |
| **Dépendances** | Prometheus et Grafana déjà en place (V1). Optionnel : persistance Prometheus (volume) pour éviter de perdre les métriques au redémarrage. |

---

## Action MT5 – Logs structurés et masquage des données sensibles (R10)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Configurer Logback pour produire des logs en JSON (layout JSON avec champs : timestamp, level, logger, message, thread). Ajouter un champ de corrélation (traceId ou requestId) via un filtre ou un MDC (ex. filtre qui lit un header X-Request-Id ou génère un UUID par requête). Définir une règle de masquage pour les champs sensibles (mot de passe, token, email si nécessaire) dans les messages de log (pattern ou custom converter). Documenter le format et les champs pour faciliter l’exploitation (recherche, agrégation). |
| **Objectif** | Faciliter le diagnostic en production et éviter la fuite de données sensibles dans les logs (conformité, RGPD). |
| **Effort estimé** | **M** (1–2 jours pour configuration Logback, tests et revue des messages existants) |
| **Impact attendu** | Logs exploitables par des outils (recherche, dashboards) et plus sûrs. |
| **Priorité** | P2 |
| **Dépendances** | Aucune. Prérequis utile pour une future centralisation des logs (long terme). |

---

## Action MT6 – Quality Gates bloquants (R11)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Dans le pipeline Maven : configurer JaCoCo pour faire échouer le build si la couverture est en dessous d’un seuil (ex. 70 %) avec la règle `check` du plugin JaCoCo. Dans GitHub Actions : s’assurer que le statut SonarCloud (Quality Gate) est pris en compte (branch protection ou étape qui vérifie le statut de l’analyse Sonar). Configurer côté SonarCloud un Quality Gate exigeant (ex. 0 bug critique, 0 vulnérabilité critique, couverture ≥ 70 %). Documenter les seuils et la procédure en cas d’échec (correction ou dérogation temporaire avec ticket). |
| **Objectif** | Empêcher la fusion ou la livraison de code ne respectant pas les objectifs qualité (couverture, bugs, vulnérabilités). |
| **Effort estimé** | **S** à **M** (0,5–1 jour pour JaCoCo + configuration Sonar ; peut nécessiter d’augmenter la couverture si le seuil n’est pas atteint) |
| **Impact attendu** | Stabilisation de la qualité et limitation de la dette technique. |
| **Priorité** | P2 |
| **Dépendances** | Aucune. Peut révéler des écarts de couverture à combler (tests supplémentaires). |

---

## Action MT7 – Distinction des environnements dev / recette / prod (R12)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Définir des profils Spring (ex. `dev`, `recette`, `prod`) et des fichiers ou variables d’environnement par profil : URLs de base, activation/désactivation de Swagger, niveau de log, secrets (injectés, pas de défaut en prod). Documenter la matrice environnement × configuration (quelle URL, quels secrets, quelles features). Pour le frontend : utiliser des variables de build (ex. `VITE_API_URL`) différentes par environnement (build recette vs build prod). Optionnel : pipeline ou scripts de déploiement par environnement avec les bonnes variables. |
| **Objectif** | Éviter les confusions et les déploiements avec une configuration inadaptée ; permettre une validation en recette avant prod. |
| **Effort estimé** | **M** (2–3 jours pour profils, documentation et éventuels scripts) |
| **Impact attendu** | Clarté opérationnelle et réduction des erreurs de déploiement. |
| **Priorité** | P2 |
| **Dépendances** | Aucune. Renforce CT1 (secrets) et MT1 (Swagger/Actuator par env). |

---

## Action MT8 – Politique de mot de passe (R13 – P3)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Ajouter des règles de complexité côté backend (longueur minimale, présence de majuscule, minuscule, chiffre, caractère spécial) via Bean Validation sur le DTO d’inscription ou dans le service d’enregistrement. Optionnel : historique des mots de passe (stocker des hash des N derniers mots de passe et refuser la réutilisation). Documenter la politique pour les utilisateurs (message d’erreur clair). |
| **Objectif** | Renforcer la robustesse des comptes face au guessing et à la réutilisation de mots de passe. |
| **Effort estimé** | **S** (0,5–1 jour pour règles de base) |
| **Impact attendu** | Meilleure résistance aux attaques par dictionnaire et conformité aux recommandations courantes. |
| **Priorité** | P3 (amélioration continue) |
| **Dépendances** | Aucune. |

---

## Action MT9 – Stabilisation des tests E2E (R16 – P3)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Réduire la flakiness des E2E : augmenter la robustesse des attentes (ex. `waitFor` sur des éléments stables plutôt que des délais fixes), utiliser des sélecteurs résilients (data-testid), éventuellement ajouter des retries ciblés pour les étapes sensibles (health, login). Documenter l’environnement requis (Compose, seed) et la durée typique des tests. Optionnel : exécuter les E2E sur un environnement dédié en CI avec des timeouts et des ressources suffisantes. |
| **Objectif** | Avoir des E2E fiables en CI et faciles à maintenir. |
| **Effort estimé** | **M** (1–2 jours selon état actuel des tests) |
| **Impact attendu** | Moins de faux échecs, plus de confiance dans le pipeline. |
| **Priorité** | P3 |
| **Dépendances** | Aucune. |

---

## Action MT10 – Persistance Prometheus et dashboards de base (R19 – P3)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Monter un volume persistant pour le répertoire de stockage Prometheus dans Docker Compose (ou l’environnement cible) pour conserver les métriques entre redémarrages. Créer un ou deux dashboards Grafana prêts à l’emploi : santé de l’application (health, taux d’erreurs, latence), utilisation JVM (mémoire, threads). Exporter les dashboards en JSON versionnés dans le dépôt (provisioning Grafana) pour reproductibilité. |
| **Objectif** | Rendre l’observabilité exploitable au quotidien et conserver l’historique des métriques. |
| **Effort estimé** | **S** à **M** (1 jour pour volume + 1 dashboard minimal) |
| **Impact attendu** | Meilleure visibilité opérationnelle et continuité des métriques. |
| **Priorité** | P3 |
| **Dépendances** | Complète MT4 (alerting) pour un usage cohérent. |

---

### Synthèse moyen terme

| Action | Risque | Effort | Ordre suggéré |
|--------|--------|--------|----------------|
| MT1 – Restreindre Swagger/Actuator | R6 | S | 1 |
| MT6 – Quality Gates bloquants | R11 | S–M | 2 |
| MT7 – Environnements dev/recette/prod | R12 | M | 3 |
| MT5 – Logs structurés et masquage | R10 | M | 4 |
| MT4 – Alerting | R9 | M | 5 |
| MT2 – JWT hors localStorage | R7 | M | 6 |
| MT3 – Révocation JWT | R8 | M–L | 7 |
| MT8 – Politique mot de passe | R13 | S | 8 |
| MT9 – Stabilisation E2E | R16 | M | 9 |
| MT10 – Persistance Prometheus + dashboards | R19 | S–M | 10 |

**Message pour le jury :** « En moyen terme, nous renforçons la sécurité (endpoints, JWT, politique mot de passe), l’observabilité (alerting, logs structurés, dashboards) et la maintenabilité (Quality Gates, environnements, E2E stables). »

---

# 3. Plan long terme (industrialisation complète)

Objectif : **aligner l’architecture et les processus avec une exploitation professionnelle** (multi-env, haute disponibilité, déploiement automatisé, conformité). Correspond aux risques P4 et à des évolutions structurelles.

---

## Action LT1 – Intégration d’un secret manager (R22)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Introduire un secret manager (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, ou équivalent) pour stocker et distribuer les secrets (JWT, credentials DB, clés API). Le backend charge les secrets au démarrage ou à la volée via le client du secret manager (variables d’environnement pointant vers des ressources Vault, ou SDK). Documenter l’onboarding, la rotation des secrets et les droits d’accès par environnement. |
| **Objectif** | Centraliser et sécuriser la gestion des secrets ; permettre la rotation sans redéploiement manuel. |
| **Effort estimé** | **L** (1–2 semaines selon produit et environnement) |
| **Impact attendu** | Meilleure sécurité et traçabilité ; alignement avec les pratiques des grandes organisations. |
| **Priorité** | P4 |
| **Dépendances** | Environnement d’exploitation (cloud ou on-prem) avec accès au secret manager. CT1 et MT7 déjà en place. |

---

## Action LT2 – Refresh token et rotation JWT (R23)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Mettre en place un couple access token (courte durée, ex. 15 min) + refresh token (longue durée, stocké en httpOnly ou côté serveur). Endpoint dédié pour renouveler l’access token à partir du refresh token. Révocation du refresh token à la déconnexion. Optionnel : rotation du refresh token à chaque utilisation. Adapter le frontend pour gérer le renouvellement transparent (intercepteur Axios qui détecte 401 et appelle l’endpoint refresh avant de réessayer). |
| **Objectif** | Améliorer le confort utilisateur (sessions longues sans re-login) et la maîtrise des sessions (révocation, rotation). |
| **Effort estimé** | **L** (1–2 semaines incluant backend, frontend et tests) |
| **Impact attendu** | Expérience utilisateur et sécurité des sessions renforcées. |
| **Priorité** | P4 |
| **Dépendances** | Peut s’appuyer sur MT2 (cookie httpOnly) et MT3 (révocation). |

---

## Action LT3 – Réplication PostgreSQL et stratégie de failover (R24)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Mettre en place une réplication PostgreSQL (streaming replication) avec une ou plusieurs répliques en lecture. Documenter la procédure de bascule (promotion d’une réplica en primary) en cas de panne. Optionnel : outil de gestion du failover (Patroni, Stolon) ou service managé (RDS, Cloud SQL) avec réplication et bascule automatique. Adapter la configuration du backend (URL de connexion, read réplicas pour les requêtes en lecture seule si pertinent). |
| **Objectif** | Réduire le risque d’indisponibilité prolongée et permettre la reprise après panne du nœud principal. |
| **Effort estimé** | **XL** (plusieurs semaines selon compétences et cible : self-hosted vs managé) |
| **Impact attendu** | Haute disponibilité de la base de données ; alignement avec des SLA exigeants. |
| **Priorité** | P4 |
| **Dépendances** | CT3 (backup) déjà en place. Infrastructure adaptée (plusieurs nœuds ou service managé). |

---

## Action LT4 – Load balancing et scaling horizontal (R25)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Introduire un load balancer (Nginx, HAProxy, ou équivalent cloud) devant plusieurs instances du backend. Déployer l’application sur une plateforme permettant le scaling horizontal (Kubernetes avec HPA, ou Compose avec plusieurs réplicas backend + LB). Configurer les healthchecks et le drainage des connexions pour les mises à jour sans coupure. Documenter la topologie et les critères de montée en charge (CPU, requêtes/s). |
| **Objectif** | Répartir la charge et augmenter la capacité et la résilience (plusieurs instances). |
| **Effort estimé** | **L** à **XL** (1–3 semaines selon cible : Compose multi-instances vs K8s) |
| **Impact attendu** | Montée en charge et tolérance aux pannes améliorées. |
| **Priorité** | P4 |
| **Dépendances** | MT3 (révocation JWT) si blacklist partagée (Redis) pour plusieurs instances. Architecture documentée (architecture.md) prévoit une évolution K8s. |

---

## Action LT5 – Cache applicatif et cache HTTP (R26)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Introduire un cache (ex. Redis) pour des données fréquemment lues (catalogue, catégories) ou pour la blacklist de tokens si multi-instances. Configurer un cache HTTP côté Nginx pour les ressources statiques du frontend et éventuellement pour des réponses API idempotentes et cacheables (ex. GET catalogue avec en-têtes Cache-Control). Mesurer l’impact sur la latence et la charge backend. |
| **Objectif** | Réduire la charge sur la base et le backend ; améliorer les temps de réponse. |
| **Effort estimé** | **L** (1–2 semaines pour Redis + intégration backend + cache Nginx) |
| **Impact attendu** | Meilleure performance et capacité à absorber des pics de charge. |
| **Priorité** | P4 |
| **Dépendances** | Optionnel mais cohérent avec LT4 (plusieurs instances partageant un cache). |

---

## Action LT6 – Centralisation des logs et traceId (R27)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Déployer une stack de centralisation des logs (ELK, Loki + Promtail, ou service managé) et configurer l’envoi des logs applicatifs (push ou pull). S’assurer que chaque requête a un traceId (déjà préparé en MT5) et que celui-ci est propagé (header, logs). Optionnel : tracing distribué (Sleuth, OpenTelemetry) si l’architecture devient multi-services. Documenter les rétentions et les droits d’accès aux logs. |
| **Objectif** | Centraliser les logs pour recherche, analyse et audit ; faciliter le diagnostic sur des flux complets. |
| **Effort estimé** | **L** (1–2 semaines pour déploiement et configuration) |
| **Impact attendu** | Exploitation et débogage plus efficaces ; conformité et audit facilités. |
| **Priorité** | P4 |
| **Dépendances** | MT5 (logs structurés et traceId) facilite l’intégration. |

---

## Action LT7 – Déploiement automatisé (registry, CD) (R28)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Ajouter au pipeline une étape de push des images Docker vers un registry (GitHub Container Registry, Docker Hub, ou registry privé). Créer un workflow ou une chaîne de déploiement (CD) qui, après validation de la CI et des Quality Gates, déploie sur un environnement cible (recette puis prod) : déploiement sur VM (Compose pull + up), ou sur Kubernetes (kubectl/Helm/ArgoCD). Introduire des garde-fous (approbation manuelle pour la prod, rollback automatique si health check échoue). Documenter la stratégie de déploiement (blue/green, rolling, etc.). |
| **Objectif** | Réduire le temps et les erreurs de mise en production ; livraisons reproductibles et traçables. |
| **Effort estimé** | **L** à **XL** (2–4 semaines selon cible et niveau d’automatisation) |
| **Impact attendu** | Livraisons plus rapides et plus sûres ; démarche DevOps complète. |
| **Priorité** | P4 |
| **Dépendances** | MT7 (environnements), CT2 (gates). Infrastructure cible (VM, K8s, registry) disponible. |

---

## Action LT8 – Audit de licences des dépendances (R29)

| Attribut | Détail |
|----------|--------|
| **Description technique** | Intégrer dans le pipeline un outil d’audit de licences (ex. license-maven-plugin pour Maven, license-checker ou FOSSA pour npm) pour détecter les dépendances à licence restrictive (GPL, AGPL, etc.) ou non conformes à la politique de l’organisation. Définir une liste de licences autorisées et faire échouer le build ou remonter une alerte en cas de dépassement. Documenter la politique et la procédure d’exception. |
| **Objectif** | Garantir la conformité juridique des dépendances et éviter l’introduction de licences non souhaitées. |
| **Effort estimé** | **S** à **M** (1–2 jours pour intégration et définition de la politique) |
| **Impact attendu** | Conformité et maîtrise du risque juridique en contexte commercial. |
| **Priorité** | P4 |
| **Dépendances** | Aucune. Peut être fait tôt dans la roadmap long terme. |

---

### Synthèse long terme

| Action | Risque | Effort | Ordre suggéré |
|--------|--------|--------|----------------|
| LT8 – Audit de licences | R29 | S–M | 1 |
| LT1 – Secret manager | R22 | L | 2 |
| LT2 – Refresh token / rotation JWT | R23 | L | 3 |
| LT6 – Centralisation logs + traceId | R27 | L | 4 |
| LT5 – Cache (Redis + HTTP) | R26 | L | 5 |
| LT4 – Load balancing et scaling | R25 | L–XL | 6 |
| LT3 – Réplication PostgreSQL | R24 | XL | 7 |
| LT7 – CD (registry + déploiement auto) | R28 | L–XL | 8 |

**Message pour le jury :** « À long terme, nous visons une industrialisation complète : gestion des secrets, sessions avancées, haute disponibilité (DB, scaling), cache, centralisation des logs, déploiement automatisé et conformité des licences. L’ordre peut être ajusté selon les priorités métier et l’infrastructure disponible. »

---

# Récapitulatif et support pour la soutenance

## Enchaînement logique à présenter

1. **Audit (9.1)** : nous avons identifié les risques et limites de la V1 (sécurité, qualité, observabilité, performance, déploiement).
2. **Priorisation (9.2)** : nous les avons classés en critiques (P1), importants (P2), acceptables V1 (P3) et hors scope V1 (P4).
3. **Plan de remédiation (9.3)** : nous avons défini une roadmap en trois horizons :
   - **Court terme** : cinq actions bloquantes avant production (secrets, scans, backup, HTTPS, rate limiting).
   - **Moyen terme** : dix actions d’amélioration continue (sécurité, observabilité, Quality Gates, environnements, E2E, logs, JWT).
   - **Long terme** : huit actions d’industrialisation (secret manager, refresh token, HA DB, LB, cache, logs centralisés, CD, licences).

## Tableau de bord rapide

| Horizon | Nombre d’actions | Effort global indicatif | Risques traités |
|---------|------------------|--------------------------|-----------------|
| Court terme | 5 | ~1–2 semaines | R1–R5 (P1) |
| Moyen terme | 10 | ~3–5 semaines | R6–R12 (P2) + R13, R16, R19 (P3) |
| Long terme | 8 | ~2–3 mois | R22–R29 (P4) |

## Formulation type pour le jury

« La V1 nous a permis de démontrer le cycle DevSecOps (CI, tests, scans, HTTPS, observabilité de base). Les risques restants ont été audités et priorisés. Le plan de remédiation que nous proposons est réaliste : avant toute production, nous traitons les cinq risques critiques ; en moyen terme, nous renforçons la sécurité et l’observabilité ; à long terme, nous visons l’industrialisation (secret manager, HA, scaling, CD, conformité). Chaque action est décrite avec un objectif, un effort estimé et un impact attendu, ce qui permet d’ajuster la roadmap en fonction des priorités et des moyens. »

---

*Document à utiliser tel quel en soutenance ; aucune modification du code n’est effectuée dans le cadre de ce plan.*
