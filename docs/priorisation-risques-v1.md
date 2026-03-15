# Priorisation des risques V1 – Collector.shop

Document préparatoire pour l’étape 9.2 de la soutenance technique : classification des risques identifiés dans l’audit final, **sans modification du projet**. Exploitable pour le plan de remédiation (étape suivante) et pour démontrer une analyse architecturale raisonnée.

**Référence :** [Audit final des risques et limites V1](audit-final-risques-limites-v1.md)

---

## Légende

| Champ | Signification |
|-------|----------------|
| **Impact métier** | Gravité des conséquences si le risque se réalise (Faible / Moyen / Élevé / Critique) |
| **Probabilité** | Vraisemblance d’occurrence dans le contexte V1 (Faible / Moyenne / Élevée) |
| **Priorité** | Niveau dérivé impact × probabilité (P1 = critique, P2 = important, P3 = à traiter, P4 = accepté / hors scope) |

---

## 1. Risques critiques (à corriger avant une mise en production)

Risques dont la réalisation compromet la sécurité, l’intégrité des données ou la conformité en environnement de production. **Bloquants pour un déploiement réel.**

### R1 – Secrets et identifiants par défaut en clair

| Attribut | Détail |
|----------|--------|
| **Description** | Valeurs par défaut pour `JWT_SECRET`, `SPRING_DATASOURCE_*`, `APP_CORS_ALLOWED_ORIGIN` dans les fichiers de configuration. En prod, un oubli de surcharge laisse des secrets prévisibles. |
| **Impact métier** | **Critique** – Compromission de l’authentification (JWT) et accès direct à la base de données. |
| **Probabilité** | **Moyenne** – Erreur de déploiement ou copier-coller d’une config dev vers prod. |
| **Priorité** | **P1** |
| **Justification technique** | En production, aucun secret ne doit résider dans le code ou des valeurs par défaut. Usage d’un secret manager ou de variables d’environnement injectées (sans défaut sensible) est une pratique standard. |

---

### R2 – Scans de vulnérabilités non bloquants

| Attribut | Détail |
|----------|--------|
| **Description** | OWASP Dependency Check, npm audit et Trivy sont exécutés mais en `continue-on-error` / `--exit-code 0`. Des CVE connues peuvent être présentes sans faire échouer le pipeline. |
| **Impact métier** | **Élevé** – Mise en production avec dépendances ou images vulnérables, exposition à des attaques connues. |
| **Probabilité** | **Moyenne** – Les rapports existent mais ne sont pas systématiquement traités avant un release. |
| **Priorité** | **P1** |
| **Justification technique** | En prod, un gate « 0 vulnérabilité critique » (ou seuil défini) doit bloquer le déploiement. Les scans doivent être intégrés au critère de passage du pipeline. |

---

### R3 – Absence de stratégie de backup et de restauration

| Attribut | Détail |
|----------|--------|
| **Description** | Aucune stratégie documentée ni automatisée de sauvegarde PostgreSQL ; pas de procédure de restauration ni de test de reprise. |
| **Impact métier** | **Critique** – Perte définitive des données en cas de panne disque, erreur humaine ou corruption. |
| **Probabilité** | **Faible** à court terme, **élevée** sur la durée de vie d’un système. |
| **Priorité** | **P1** |
| **Justification technique** | Toute base de données en production doit avoir des sauvegardes régulières, une rétention définie et des tests de restauration. C’est un prérequis opérationnel minimal. |

---

### R4 – Certificat HTTPS non reconnu en production

| Attribut | Détail |
|----------|--------|
| **Description** | En démo, certificat auto-signé (Nginx) ; pas d’intégration Let’s Encrypt / ACME ni de renouvellement automatisé. En prod publique, les utilisateurs feraient face à des avertissements de sécurité. |
| **Impact métier** | **Élevé** – Perte de confiance, risque de phishing si les utilisateurs contournent l’avertissement, non-conformité aux attentes (HTTPS fiable). |
| **Probabilité** | **Élevée** – Inévitable si on déploie en prod avec l’état actuel. |
| **Priorité** | **P1** |
| **Justification technique** | Une prod exposée sur Internet exige un certificat émis par une CA reconnue et un processus de renouvellement (ACME ou équivalent). |

---

### R5 – Absence de rate limiting (brute-force et sur-appel)

| Attribut | Détail |
|----------|--------|
| **Description** | Pas de limitation du nombre de requêtes par IP ou par utilisateur ; endpoints d’authentification et API exposés sans throttle. |
| **Impact métier** | **Élevé** – Brute-force sur le login, déni de service par sur-appel, dégradation pour tous les utilisateurs. |
| **Probabilité** | **Moyenne** – Dès que l’application est exposée, des scripts automatisés peuvent tenter des attaques. |
| **Priorité** | **P1** |
| **Justification technique** | Le rate limiting (au minimum sur `/api/auth/login` et idéalement sur l’API) est une mesure de base pour limiter les abus et les attaques par force brute. |

---

## 2. Risques importants (à corriger à court terme)

Risques qui dégradent la sécurité, l’exploitabilité ou la maintenabilité. **À traiter rapidement après une première mise en production ou en phase de préparation prod.**

### R6 – Exposition publique de Swagger et des endpoints Actuator

| Attribut | Détail |
|----------|--------|
| **Description** | Swagger (doc API) et Actuator (health, info, metrics, prometheus) sont en `permitAll()`. En prod, cela expose la structure de l’API, les versions et des métriques JVM à toute personne ayant l’URL. |
| **Impact métier** | **Moyen** – Fuite d’informations utiles à un attaquant ; non-aligné avec le principe du moindre privilège. |
| **Probabilité** | **Élevée** – Exposition dès que l’app est en ligne. |
| **Priorité** | **P2** |
| **Justification technique** | En prod, restreindre ces endpoints (réseau interne, VPN, ou authentification) ou les désactiver pour Swagger réduit la surface d’attaque. La propriété `app.swagger.enabled` existe déjà et peut être exploitée. |

---

### R7 – JWT en localStorage (vol par XSS)

| Attribut | Détail |
|----------|--------|
| **Description** | Le token JWT est stocké dans `localStorage` ; en cas de faille XSS, un script peut le récupérer et usurper la session. |
| **Impact métier** | **Élevé** – Usurpation de compte utilisateur si une XSS est introduite (dépendance front, bug). |
| **Probabilité** | **Faible** à **moyenne** – Dépend de l’existence d’une XSS ; le risque augmente avec la surface du frontend. |
| **Priorité** | **P2** |
| **Justification technique** | Les bonnes pratiques recommandent des mécanismes moins exposés (httpOnly cookie, refresh token court en mémoire). Pour une V1 démo, le risque est souvent accepté ; pour une prod avec données sensibles, il doit être traité. |

---

### R8 – Pas de révocation des tokens JWT

| Attribut | Détail |
|----------|--------|
| **Description** | Un token valide jusqu’à expiration reste utilisable après déconnexion ou changement de rôle ; pas de blacklist ni de durée très courte. |
| **Impact métier** | **Moyen** – Impossible d’invalider une session immédiatement (vol de token, licenciement, changement de rôle). |
| **Probabilité** | **Moyenne** – Cas réels en gestion d’utilisateurs et en conformité. |
| **Priorité** | **P2** |
| **Justification technique** | En contexte entreprise, la révocation (blacklist, store de tokens révoqués, ou tokens à courte durée + refresh) est attendue pour la maîtrise des accès. |

---

### R9 – Absence d’alerting opérationnel

| Attribut | Détail |
|----------|--------|
| **Description** | Aucune règle d’alerte (Alertmanager, notification) ; la santé est consultable mais personne n’est prévenu en cas de panne ou de dégradation. |
| **Impact métier** | **Moyen** – Détection tardive des incidents, indisponibilité prolongée ou dégradation non vue. |
| **Probabilité** | **Élevée** – Sans alerte, tout incident dépend d’une vérification manuelle. |
| **Priorité** | **P2** |
| **Justification technique** | Un minimum d’alerting (health down, erreurs 5xx, latence) permet de réagir rapidement et est attendu dès qu’un service est exploité en continu. |

---

### R10 – Logs non structurés et pas de masquage des données sensibles

| Attribut | Détail |
|----------|--------|
| **Description** | Logs en texte, pas de JSON ni de champs standardisés (traceId, userId) ; pas de politique explicite de masquage (mots de passe, tokens). |
| **Impact métier** | **Moyen** – Difficile de diagnostiquer en production, risque de fuite de données sensibles dans les logs. |
| **Probabilité** | **Moyenne** – Les logs sont souvent exportés ou partagés pour le support. |
| **Priorité** | **P2** |
| **Justification technique** | Logs structurés (JSON) et masquage des champs sensibles facilitent l’exploitation et la conformité (RGPD, audit). |

---

### R11 – Pas de Quality Gate bloquant (couverture, Sonar)

| Attribut | Détail |
|----------|--------|
| **Description** | JaCoCo produit un rapport mais ne fait pas échouer le build en cas de couverture insuffisante ; Sonar peut être configuré côté cloud mais n’est pas nécessairement bloquant dans GitHub. |
| **Impact métier** | **Moyen** – Régressions ou dette technique qui s’accumulent sans garde-fou automatique. |
| **Probabilité** | **Moyenne** – Sans gate, la qualité peut dériver au fil des livraisons. |
| **Priorité** | **P2** |
| **Justification technique** | Des seuils bloquants (couverture ≥ X %, 0 bug critique Sonar, 0 vulnérabilité critique) alignent la livraison sur les objectifs qualité et évitent de livrer du code sous le seuil défini. |

---

### R12 – Pas de distinction d’environnements (dev / recette / prod)

| Attribut | Détail |
|----------|--------|
| **Description** | Une seule stack type « démo » ; pas de profils ou de configs distincts pour dev, recette et prod (secrets, URLs, feature flags). |
| **Impact métier** | **Moyen** – Confusion, déploiement accidentel avec une config inadaptée, difficulté à valider avant prod. |
| **Probabilité** | **Élevée** – Dès qu’on ajoute un environnement de recette ou une prod. |
| **Priorité** | **P2** |
| **Justification technique** | Des profils Spring et des variables d’environnement par environnement permettent de séparer clairement les contextes et de réduire les erreurs de déploiement. |

---

## 3. Risques acceptables pour une V1

Risques connus et documentés, dont l’acceptation est cohérente avec le périmètre d’une V1 (démo, soutenance, premier déploiement limité). **Pas bloquants pour la soutenance ni pour une démo contrôlée.**

### R13 – Pas de politique de mot de passe (complexité, historique)

| Attribut | Détail |
|----------|--------|
| **Description** | Aucune règle de complexité ni d’historique des mots de passe côté backend. |
| **Impact métier** | **Faible** à **moyen** – Comptes plus faciles à deviner ou à réutiliser. |
| **Probabilité** | **Faible** dans un contexte démo / utilisateurs limités. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Pour une V1 à visée démo et périmètre restreint, une politique stricte n’est pas obligatoire. Elle devient importante dès qu’on ouvre à un public large ou à des données sensibles. |

---

### R14 – Autorisation par rôle uniquement (pas de « propriétaire de l’item »)

| Attribut | Détail |
|----------|--------|
| **Description** | Contrôle d’accès basé sur BUYER / SELLER / ADMIN ; pas de vérification « propriétaire de la ressource » au-delà du rôle. |
| **Impact métier** | **Faible** – Dans le scope actuel (un vendeur gère ses items via un endpoint dédié), le rôle suffit. |
| **Probabilité** | **Faible** – Les endpoints sont déjà séparés par rôle. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | La granularité par ressource devient nécessaire si on introduit des scénarios du type « modifier uniquement mes annonces ». Pour la V1, le modèle rôle est cohérent avec les user stories. |

---

### R15 – Couverture mesurée mais non bloquante

| Attribut | Détail |
|----------|--------|
| **Description** | Objectif ≥ 70 % documenté ; JaCoCo en artifact uniquement, pas de fail du build si la couverture est insuffisante. |
| **Impact métier** | **Faible** – Risque de régressions non détectées si la couverture baisse. |
| **Probabilité** | **Moyenne** – Dépend des pratiques de l’équipe. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Pour une V1, la mesure et la démonstration de la couverture suffisent à montrer la démarche qualité. Un gate bloquant est un renforcement logique pour la préparation prod (déjà en P2). |

---

### R16 – E2E sensibles à l’environnement (délais, seed)

| Attribut | Détail |
|----------|--------|
| **Description** | Les tests E2E dépendent de la stack Docker, des utilisateurs seed et des délais de démarrage ; possibilité de flakiness en CI. |
| **Impact métier** | **Faible** – Faux échecs ou maintenance des tests, sans impact direct sur la fonctionnalité en production. |
| **Probabilité** | **Moyenne** – Fréquent avec des E2E sur environnement complet. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Pour une V1, avoir des E2E qui valident le parcours critique (login, catalogue, rôles) est suffisant. Les stabiliser (retries, attentes robustes) relève du court terme (P2/P1 selon criticité). |

---

### R17 – Pas de tests de charge dans le pipeline

| Attribut | Détail |
|----------|--------|
| **Description** | L’objectif « temps de réponse < 500 ms » est documenté mais pas vérifié automatiquement (pas de JMeter ou équivalent dans la CI). |
| **Impact métier** | **Faible** pour une V1 – Comportement sous charge inconnu. |
| **Probabilité** | **Faible** – Peu pertinent tant que la charge attendue reste limitée (démo, petit nombre d’utilisateurs). |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Les tests de charge sont un renforcement pour la montée en charge et la prod ; pour une V1 à périmètre restreint, ils sont hors scope opérationnel immédiat. |

---

### R18 – Pas de couverture de code frontend (Istanbul)

| Attribut | Détail |
|----------|--------|
| **Description** | Seuls ESLint et les E2E couvrent le frontend ; pas de mesure de couverture (Istanbul) dans le pipeline. |
| **Impact métier** | **Faible** – Moins de visibilité sur la qualité du code React. |
| **Probabilité** | **Faible** – Les E2E couvrent déjà des parcours clés. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Pour une V1, la combinaison lint + E2E est un niveau raisonnable ; la couverture frontend est un plus pour la maintenabilité à plus long terme. |

---

### R19 – Prometheus / Grafana sans persistance ni dashboards prêts

| Attribut | Détail |
|----------|--------|
| **Description** | Métriques exposées et Prometheus/Grafana en place, mais pas de volume persistant pour Prometheus, pas de dashboards ni d’alertes pré-configurés. |
| **Impact métier** | **Faible** – Observabilité « disponible » mais à configurer manuellement ; perte des métriques au redémarrage. |
| **Probabilité** | **Élevée** – État actuel. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Pour une démo et une première approche observabilité, l’exposition des métriques et la possibilité de les consulter dans Grafana suffisent. Persistance et dashboards/alertes sont des évolutions court terme (liées à R9). |

---

### R20 – Architecture monolithique, une instance backend et une DB

| Attribut | Détail |
|----------|--------|
| **Description** | Un seul backend, une seule instance PostgreSQL ; pas de réplication, pas de load balancer, pas de cache applicatif. |
| **Impact métier** | **Faible** pour la V1 – Inadapté à une forte charge ou à une haute disponibilité. |
| **Probabilité** | **Faible** – La charge cible V1 est limitée. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Pour un projet étudiant et une démo, une architecture simple est adaptée. La scalabilité et la résilience deviennent des objectifs lorsque la charge et le SLA l’exigent. |

---

### R21 – Gestion d’erreur login générique côté frontend

| Attribut | Détail |
|----------|--------|
| **Description** | Message « Invalid credentials » pour toute erreur (réseau, 401, 500) ; peu de détail pour le diagnostic. |
| **Impact métier** | **Faible** – Expérience utilisateur et support dégradés, pas de faille de sécurité directe. |
| **Probabilité** | **Moyenne** – Les erreurs réseau ou serveur restent possibles. |
| **Priorité** | **P3 – Accepté V1** |
| **Justification technique** | Du point de vue sécurité, un message générique évite de divulguer si l’email existe ; affiner le message côté support (logs, codes erreur) peut être fait en court terme sans bloquer la V1. |

---

## 4. Risques hors scope de la V1

Risques dont le traitement dépasse le périmètre raisonnable d’une V1 (projet étudiant, démo, premier livrable). **Ils peuvent être cités en soutenance comme évolutions possibles.**

### R22 – Secret manager (Vault, AWS Secrets Manager, etc.)

| Attribut | Détail |
|----------|--------|
| **Description** | Pas d’intégration à un secret manager centralisé ; secrets gérés par variables d’environnement ou fichiers. |
| **Impact métier** | **Moyen** en prod à grande échelle. |
| **Probabilité** | N/A – Choix d’architecture. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | Un secret manager est une brique d’industrialisation (multi-env, rotation, audit). Pour une V1, externaliser les secrets via des variables d’environnement (sans valeur par défaut sensible) est un niveau acceptable ; le secret manager relève d’une phase d’industrialisation. |

---

### R23 – Refresh token et rotation JWT

| Attribut | Détail |
|----------|--------|
| **Description** | Pas de refresh token ni de rotation ; token unique jusqu’à expiration. |
| **Impact métier** | **Moyen** – Confort et sécurité à long terme. |
| **Probabilité** | N/A – Choix de conception. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | Mécanisme standard pour les applications à sessions longues. Pour une V1 avec périmètre limité, un JWT à durée raisonnable (ex. 1 h) est souvent suffisant ; l’évolution peut être planifiée en remédiation. |

---

### R24 – Réplication PostgreSQL et failover

| Attribut | Détail |
|----------|--------|
| **Description** | Une seule instance PostgreSQL ; pas de réplication ni de bascule automatique. |
| **Impact métier** | **Élevé** en prod à haute disponibilité. |
| **Probabilité** | **Faible** pour la V1. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | La réplication et le failover sont des exigences de disponibilité (SLA élevé). Hors scope pour une V1 à visée démo et premier déploiement ; à envisager avec la stratégie de backup (R3) en phase d’industrialisation. |

---

### R25 – Load balancing et scaling horizontal

| Attribut | Détail |
|----------|--------|
| **Description** | Pas de load balancer devant le backend ; une seule instance ; pas de scaling horizontal (Compose ou K8s). |
| **Impact métier** | **Moyen** à **élevé** en cas de montée en charge. |
| **Probabilité** | **Faible** pour la V1. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | Pertinent lorsque la charge ou la disponibilité le justifient. Pour une V1, une instance unique est un choix assumé ; l’architecture documentée (architecture.md) prévoit une évolution vers K8s. |

---

### R26 – Cache applicatif (Redis) et cache HTTP (Nginx)

| Attribut | Détail |
|----------|--------|
| **Description** | Pas de cache pour les sessions, le catalogue ou les réponses ; pas de cache HTTP documenté côté Nginx. |
| **Impact métier** | **Faible** à **moyen** – Performance sous charge. |
| **Probabilité** | **Faible** – Charge V1 limitée. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | Le cache est une optimisation pour la performance et la charge. Pour une V1, la simplicité prime ; à considérer lorsque les temps de réponse ou le volume le justifient. |

---

### R27 – Centralisation des logs (ELK, Loki) et traceId distribué

| Attribut | Détail |
|----------|--------|
| **Description** | Pas de stack de centralisation des logs ; pas de traceId pour la corrélation entre requêtes et services. |
| **Impact métier** | **Moyen** pour le diagnostic en environnement distribué. |
| **Probabilité** | N/A – Architecture actuelle monolithique. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | La centralisation des logs et le tracing sont des atouts pour les architectures distribuées et les équipes d’exploitation. Pour une V1 monolithique et une démo, les logs locaux et la structure des logs (R10) suffisent en priorité. |

---

### R28 – Déploiement automatisé (registry, K8s, CD)

| Attribut | Détail |
|----------|--------|
| **Description** | Le pipeline fait build, tests et analyses ; pas d’étape de push d’images vers un registry ni de déploiement automatique vers un environnement cible. |
| **Impact métier** | **Moyen** – Livraison plus lente et plus manuelle. |
| **Probabilité** | N/A – Choix de périmètre CI/CD. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | La CD (Continuous Deployment) est une évolution naturelle après stabilisation de la CI et des Quality Gates. Pour une V1, la CI (build, test, analyse, artifacts) démontre déjà le cycle DevSecOps ; le déploiement automatisé peut être présenté comme prochaine étape. |

---

### R29 – Audit de licences des dépendances

| Attribut | Détail |
|----------|--------|
| **Description** | Pas de vérification des licences (Maven, npm) dans le pipeline ; risque si une dépendance à licence restrictive est introduite. |
| **Impact métier** | **Moyen** à **élevé** en contexte commercial. |
| **Probabilité** | **Faible** pour un projet étudiant à stack standard. |
| **Priorité** | **P4 – Hors scope V1** |
| **Justification technique** | Pratique recommandée en entreprise pour la conformité juridique. Pour une V1 pédagogique, le risque est limité ; l’audit de licences peut être ajouté en phase d’industrialisation ou de passage en production réelle. |

---

## Synthèse pour la soutenance

### Répartition par catégorie

| Catégorie | Nombre de risques | Message clé |
|-----------|-------------------|-------------|
| **Critiques (P1)** | 5 | À traiter avant toute mise en production réelle : secrets, scans bloquants, backup, HTTPS fiable, rate limiting. |
| **Importants (P2)** | 7 | À planifier à court terme : exposition endpoints, JWT (stockage/révocation), alerting, logs, Quality Gates, environnements. |
| **Acceptables V1 (P3)** | 9 | Connus et documentés ; cohérents avec le périmètre démo / premier livrable. |
| **Hors scope V1 (P4)** | 8 | Évolutions d’industrialisation : secret manager, refresh token, HA DB, LB, cache, centralisation logs, CD, licences. |

### Ordre de priorité pour le plan de remédiation

1. **Avant prod** : R1, R2, R3, R4, R5 (secrets, gates, backup, certificat, rate limiting).
2. **Court terme** : R6 à R12 (endpoints, JWT, alerting, logs, Quality Gates, environnements).
3. **Amélioration continue** : risques P3 à traiter selon contexte (politique mot de passe, couverture bloquante, stabilisation E2E, etc.).
4. **Roadmap** : risques P4 comme évolutions (secret manager, HA, cache, CD, etc.).

Ce document peut être utilisé tel quel en soutenance pour montrer la capacité d’analyse architecturale et pour enchaîner sur le plan de remédiation détaillé (étape 9.3).
