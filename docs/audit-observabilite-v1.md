# Audit observabilité V1 – état des lieux

Document d’audit de l’observabilité existante pour la soutenance technique DevOps / DevSecOps. **Aucune modification du projet** ; état des lieux uniquement.

---

## 1. Spring Boot Actuator

### 1.1 Configuration dans les fichiers applicatifs

**Fichiers concernés :**
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-docker.yml`

**Extrait `application.yml` (lignes 34–37) :**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
```

**Extrait `application-docker.yml` (lignes 11–15) :**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
```

Aucune surcharge d’`management` dans le profil Docker : même exposition que le profil par défaut.

### 1.2 Endpoints exposés

| Endpoint | Exposé ? | Remarque |
|----------|----------|----------|
| `/actuator/health` | Oui | Inclus dans `include: health,info` |
| `/actuator/info`   | Oui | Idem |
| `/actuator/metrics` | Non | Non listé dans `include` |
| `/actuator/prometheus` | Non | Non listé ; pas de dépendance `micrometer-registry-prometheus` dans le `pom.xml` |
| Autres (env, beans, mappings, etc.) | Non | Non exposés |

Seuls **health** et **info** sont exposés via la config. Aucun autre endpoint Actuator (metrics, prometheus, etc.) n’est activé.

### 1.3 Endpoints publics vs protégés (SecurityConfig)

**Fichier :** `backend/src/main/java/com/collectorshop/config/SecurityConfig.java`

**Extrait (lignes 45–50) :**
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/actuator/health", "/actuator/info").permitAll()
    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/items/**", "/api/categories").permitAll()
    .anyRequest().authenticated()
)
```

- **Publics (sans JWT) :** `/actuator/health`, `/actuator/info`.
- **Protégés :** tout le reste, dont d’éventuels autres endpoints Actuator non exposés actuellement (`.anyRequest().authenticated()`).

En pratique, seuls health et info sont à la fois exposés et autorisés en accès anonyme.

---

## 2. Healthchecks Docker / Compose

**Fichier :** `infra/compose/docker-compose.yml`

### 2.1 Configuration par service

| Service   | Healthcheck présent ? | Commande | Intervalle | Timeout | Retries |
|-----------|------------------------|----------|------------|---------|---------|
| **db**    | Oui                   | `pg_isready -U collector_shop -d collector_shop` | 10s | 5s | 5 |
| **backend** | Oui                 | `curl -f http://localhost:8080/actuator/health \|\| exit 1` | 30s | 5s | 5 |
| **frontend** | Oui                | `wget -qO- http://localhost/ \|\| exit 1` | 30s | 5s | 5 |
| **nginx** | Oui                   | `nginx -t` (test de config uniquement) | 10s | 3s | 3 |

### 2.2 Extraits

**db (lignes 12–16) :**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U collector_shop -d collector_shop"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**backend (lignes 34–38) :**
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
  interval: 30s
  timeout: 5s
  retries: 5
```

**frontend (lignes 51–55) :**
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost/ || exit 1"]
  interval: 30s
  timeout: 5s
  retries: 5
```

**nginx (lignes 69–73) :**
```yaml
healthcheck:
  test: ["CMD-SHELL", "nginx -t"]
  interval: 10s
  timeout: 3s
  retries: 3
```

### 2.3 Dépendances et impact

- **backend** : `depends_on: db` avec `condition: service_healthy` → le backend ne démarre qu’une fois la base prête.
- **frontend** : `depends_on: backend` avec `condition: service_healthy` → le frontend attend que le healthcheck backend soit vert.
- **nginx** : `depends_on: frontend, backend` avec `condition: service_healthy` → Nginx ne démarre qu’après backend et frontend sains.

En exécution : ordre de démarrage contrôlé (db → backend → frontend → nginx) et statut « healthy » visible avec `docker compose ps` / `docker ps`.

---

## 3. Logs applicatifs (backend)

### 3.1 Configuration

**Fichier :** `backend/src/main/resources/application.yml` (lignes 39–41)

```yaml
logging:
  level:
    root: INFO
```

- Aucun fichier `logback-spring.xml` ou `logback.xml` dans le projet : configuration par défaut Spring Boot (Logback).
- Pas de configuration logging dans `application-docker.yml` : même niveau en Docker.

### 3.2 Niveau de log

- **root** : `INFO`.
- Pas de réglage par package ou par logger (pas de `logging.level.com.collectorshop`, etc.).
- En dev : `show-sql: false` dans JPA ; pas de logs SQL par défaut.

### 3.3 Format des logs

- Logs **non structurés** (format texte classique Logback/Console).
- Pas de format JSON, pas de champs structurés pour un outil type ELK/Loki.

### 3.4 Où les consulter

- **En local (sans Docker) :** sortie console du processus Spring Boot (stdout).
- **Avec Docker Compose :**  
  `docker compose logs backend` ou `docker compose logs -f backend` (depuis `infra/compose`).  
  Les logs du backend sont ceux du conteneur `backend` (stdout du processus Java).

---

## 4. Monitoring technique déjà disponible

### 4.1 `/actuator/health`

- **Exposé :** oui (config + SecurityConfig).
- **Accès :** public (pas de JWT).
- **Contenu typique :** statut global (UP/DOWN) et, selon la config Spring Boot par défaut, détails (ex. `db` pour la datasource) en format JSON.
- **Utilité :** santé de l’application et de la dépendance DB ; utilisé par le healthcheck Docker et par le proxy Nginx (démo).

### 4.2 `/actuator/info`

- **Exposé :** oui (config + SecurityConfig).
- **Accès :** public.
- **Contenu :** vide par défaut tant qu’aucun `InfoContributor` ou `application.yml` (section `info:`) n’est configuré. Peut servir à version / nom d’appli si on l’enrichit plus tard.

### 4.3 `/actuator/metrics`

- **Exposé :** non.  
- **Raison :** non inclus dans `management.endpoints.web.exposure.include` (seuls `health` et `info` le sont).  
- Même si on l’ajoutait, il faudrait aussi l’autoriser dans SecurityConfig (actuellement tout sauf health/info est protégé).

### 4.4 `/actuator/prometheus`

- **Exposé :** non.  
- **Raison :** pas dans `include` et **pas de dépendance** `micrometer-registry-prometheus` dans `backend/pom.xml`. Seul `spring-boot-starter-actuator` est présent.

### 4.5 Autres indicateurs

- **Swagger / OpenAPI :** `/v3/api-docs`, `/swagger-ui`, `/swagger-ui.html` sont publics ; utiles pour la doc et la démo, pas pour du monitoring temps réel.
- **CI/CD :** le pipeline (ex. `.github/workflows/ci.yml`) utilise déjà `/actuator/health` pour attendre que le backend soit prêt (et éventuellement pour des smoke tests). Aucun autre endpoint Actuator n’est utilisé dans l’audit des fichiers.

---

## 5. Observabilité côté Nginx

**Fichier :** `infra/nginx/nginx.conf`

### 5.1 Logs d’accès et d’erreur

- Aucune directive `access_log` ni `error_log` dans la config : **Nginx utilise donc les paramètres par défaut de l’image**.
- En pratique (image `nginx:1.27-alpine`) :  
  - **access_log** : généralement `/var/log/nginx/access.log` (format combined par défaut).  
  - **error_log** : généralement `/var/log/nginx/error.log` (niveau `warn` par défaut).

### 5.2 Configuration utile pour l’observabilité

- Pas de personnalisation des chemins de logs, du format (ex. JSON), ni du niveau dans `nginx.conf`.
- Les logs sont **dans le conteneur** ; consultables avec `docker compose logs nginx` (stdout/stderr selon la config de l’image) ou en entrant dans le conteneur pour lire les fichiers sous `/var/log/nginx/` si l’image les y envoie.
- Pas de `proxy_set_header` dédiés à la traçabilité (ex. request-id) dans la config actuelle ; uniquement Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto pour le proxy.

---

## 6. Observabilité côté frontend

### 6.1 Logs navigateur

- **ErrorBoundary :** un seul point de log explicite repéré :  
  **Fichier :** `frontend/src/components/ErrorBoundary.jsx` (ligne 13)  
  `console.error('ErrorBoundary caught:', error, errorInfo);`  
  Donc en cas d’erreur React non gérée, un message est envoyé à la console du navigateur.
- Aucune autre instrumentation (pas de service de logging centralisé, pas de rapport d’erreurs vers un backend ou un outil externe).
- Pas de configuration de niveau de log ou de désactivation des logs en production dans les fichiers audités.

### 6.2 Synthèse

- Observabilité frontend limitée à la **console navigateur** et à ce `console.error` dans l’ErrorBoundary.
- Pas de métriques front (performance, erreurs) exposées ni agrégées côté serveur.

---

## 7. Résumé final

### 7.1 Ce qui existe déjà

| Domaine | Existant |
|--------|----------|
| **Actuator** | Endpoints `health` et `info` exposés et publics ; utilisés par les healthchecks et le proxy. |
| **Healthchecks Docker** | Tous les services (db, backend, frontend, nginx) ont un healthcheck ; ordre de démarrage et statut « healthy » exploitables. |
| **Logs backend** | Niveau INFO, sortie console ; consultables via `docker compose logs backend`. |
| **Logs Nginx** | Comportement par défaut de l’image (accès et erreur dans le conteneur / stdout). |
| **Frontend** | ErrorBoundary qui log les erreurs React en console. |
| **CI/CD** | Utilisation de `/actuator/health` pour attendre le backend et pour les smoke tests. |
| **Proxy** | Actuator (health, info) accessible via Nginx (ex. https://localhost/actuator/health en démo HTTPS). |

### 7.2 Ce qui manque pour une démo d’observabilité plus convaincante

- **Métriques :** pas d’exposition `/actuator/metrics` ni `/actuator/prometheus` ; pas de Prometheus / Grafana.
- **Logs structurés :** pas de format JSON ni de champs structurés pour agrégation ou recherche.
- **Centralisation des logs :** pas de collecte (ex. Loki, ELK) ; consultation uniquement par conteneur ou console.
- **Traces :** pas de tracing distribué (Sleuth, OpenTelemetry, etc.).
- **Info Actuator :** endpoint `/actuator/info` présent mais vide (pas de version, nom d’appli, etc.).
- **Nginx :** logs non personnalisés (format, niveau, chemin) et non exposés de façon homogène (dépend du driver de logging de l’image).

### 7.3 Ce qui peut être montré facilement à la soutenance

- **Health global :** appel à `https://localhost/actuator/health` (ou `http://localhost:8080/actuator/health` si accès direct au backend) et explication du rôle pour le load balancer / orchestration.
- **Démarrage ordonné :** `docker compose up -d` puis `docker compose ps` pour montrer les healthchecks et l’ordre db → backend → frontend → nginx.
- **Logs backend :** `docker compose logs backend` (éventuellement `-f`) pour montrer les logs applicatifs en temps réel.
- **Logs Nginx :** `docker compose logs nginx` pour les accès et erreurs proxy.
- **ErrorBoundary :** déclencher une erreur côté React et montrer le message dans la console du navigateur (F12).
- **Pipeline CI :** montrer l’utilisation de `/actuator/health` dans le workflow (attente de santé, smoke test) comme base d’observabilité dans la CI.

---

**Fichiers cités dans cet audit (sans modification) :**

- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-docker.yml`
- `backend/src/main/java/com/collectorshop/config/SecurityConfig.java`
- `backend/pom.xml`
- `infra/compose/docker-compose.yml`
- `infra/nginx/nginx.conf`
- `frontend/src/components/ErrorBoundary.jsx`
