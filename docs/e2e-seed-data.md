# Données E2E – Collector.shop

## Causes racines exactes (diagnostic final)

### 1. Login buyer/seller échoue alors que les users existent en base

- **Table lue** : `users` (repository `UserRepository.findByUsername(username)`).
- **Champ de connexion** : `username` (pas email). `LoginRequest` et front envoient bien `{ username, password }`.
- **PasswordEncoder** : `BCryptPasswordEncoder()` dans `SecurityConfig` ; hash en base = BCrypt strength 10, compatible.
- **Pas de champ** `enabled` / `active` / `verified` dans le code ; aucun blocage côté métier.

**Cause racine** : les requêtes API du navigateur **n’atteignent pas le backend**. Avec le front en dev (`npm run dev` sur 5173), `apiClient.js` utilise `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'`. Or le backend dans Docker n’avait que `expose: 8080` (aucun `ports: 8080:8080`) : depuis l’hôte, `localhost:8080` n’est pas joignable. Connexion refusée → le front reçoit une erreur réseau → message type « Invalid credentials » ou échec silencieux.

**Preuve** : en stack complète, l’UI est servie par Nginx à `https://localhost/` et le front conteneurisé est buildé avec `VITE_API_URL=""` → requêtes en relatif → `https://localhost/api/...` → Nginx proxy vers `backend:8080` → OK. En dev local avec baseURL par défaut, les appels partent vers `http://localhost:8080` qui n’est pas exposé.

**Correction** : utiliser la stack complète à **https://localhost** pour E2E/démo ; backend expose maintenant aussi `ports: 8080:8080` pour accès direct depuis l’hôte (validation curl, front dev si besoin).

---

### 2. Catalogue UI vide alors que `item_listings` contient 4 lignes

- **Endpoint** : `GET /api/items` (front : `api.get('/api/items')` dans `Home.jsx`).
- **Backend** : `ItemController.getItems()` → `ItemService.getAllItems()` → `itemListingRepository.findAll()` ; **aucun filtre** (pas de status, approved, stock, etc.).
- **Schéma** : pas de colonne status/approved/published ; les 4 lignes sont éligibles côté code.

**Cause racine** : identique au login. Si le front est servi depuis une autre origine (ex. dev 5173) et appelle `http://localhost:8080/api/items`, le backend n’est pas joignable depuis l’hôte → erreur réseau → liste vide affichée. Ce n’est pas un filtre métier ni une incohérence des lignes en base.

**Preuve** : avec la stack complète et `https://localhost`, `curl -k https://localhost/api/items` renvoie bien les items si la base en contient.

---

### 3. V5 et V6 absentes de `flyway_schema_history`

- **Fichiers** : V5 et V6 existent dans `backend/src/main/resources/db/migration/` (convention Flyway respectée).
- **Build** : `Dockerfile` fait `COPY src ./src` puis `mvn package` → les resources sont inclus dans le JAR.
- **Config** : `application-docker.yml` définit `spring.flyway.locations: classpath:db/migration` et Flyway activé.

**Cause racine** : la base a été migrée par une **instance backend qui n’avait que V1–V4** (image Docker construite avant l’ajout de V5/V6, ou cache Docker réutilisant une couche sans ces fichiers). Flyway n’applique que les migrations présentes dans le JAR au moment du run ; une fois V1–V4 enregistrées, les runs suivants avec un JAR à jour appliquent V5 puis V6. Si l’image reste ancienne, V5/V6 ne sont jamais exécutées.

**Correction** : en CI et en local pour repartir propre, **rebuild backend sans cache** : `docker compose build --no-cache backend` puis `docker compose up -d`. Pour une base déjà existante, redémarrer le backend avec l’image à jour : au démarrage, Flyway appliquera les migrations en attente (V5, V6).

---

## Corrections appliquées (résumé)

- Rebuild backend **sans cache** en CI (`docker compose build --no-cache backend`).
- **Diagnostic DB** en CI après health : historique Flyway + effectifs `users`, `categories`, `item_listings`.
- Flyway **explicitement activé** en profil docker avec `locations: classpath:db/migration`.
- **Backend exposé sur l’hôte** : `ports: "8080:8080"` dans `docker-compose.yml` pour accès direct (validation, front dev) sans changer le flux Nginx pour E2E.
- **Preuve réseau** : avec `VITE_API_URL=""`, l’ancien code utilisait quand même `baseURL = 'http://localhost:8080'` (`'' || 'http://localhost:8080'`). Correction dans `frontend/src/services/apiClient.js` : si `VITE_API_URL === ''` alors `baseURL = ''` (requêtes relatives → https://localhost/api/...). Voir **docs/e2e-network-proof.md** (instrumentation Playwright, curl sur https://localhost, preuve 401/catalogue).

## Identifiants E2E finaux

| Username | Password | Rôle   |
|----------|----------|--------|
| **seller** | `password` | SELLER |
| **buyer**  | `password` | BUYER  |
| **admin**  | `password` | ADMIN  |

Hash BCrypt (strength 10) : `$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC` (aligné avec `E2ESeedPasswordTest` et `SecurityConfig`).

## Commandes de validation locale

**E2E et démo** : toujours utiliser **https://localhost** (stack complète avec Nginx) pour que le front conteneurisé appelle l’API en relatif (`/api/...`). Avec `ports: 8080:8080`, vous pouvez en plus valider l’API en direct sur `http://localhost:8080` depuis l’hôte.

```bash
# 1. Démarrer (rebuild backend sans cache pour reproduire la CI)
cd infra/compose
docker compose build --no-cache backend
docker compose up -d
# Attendre ~30 s

# 2. Health (via Nginx ou direct)
curl -k -s https://localhost/actuator/health
curl -s http://localhost:8080/actuator/health

# 3. Diagnostic DB (même principe qu’en CI)
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT installed_rank, version FROM flyway_schema_history ORDER BY installed_rank;"
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT username, role FROM users;"
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT count(*) FROM categories;"
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT count(*) FROM item_listings;"

# 4. Catalogue (via Nginx ou direct)
curl -k -s https://localhost/api/items
curl -s http://localhost:8080/api/items

# 5. Logins (via Nginx ou direct)
curl -k -s -X POST https://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"seller","password":"password"}'
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"buyer","password":"password"}'

# 6. E2E Playwright (depuis frontend/) — base URL = https://localhost
cd ../../frontend
PLAYWRIGHT_BASE_URL=https://localhost NODE_TLS_REJECT_UNAUTHORIZED=0 npm run test:e2e
```

## Requêtes SQL de contrôle (conteneur DB)

À lancer dans le conteneur Postgres (`docker compose exec db psql -U collector_shop -d collector_shop`) ou en une ligne avec `-c` :

```sql
-- Migrations appliquées
SELECT installed_rank, version, description FROM flyway_schema_history ORDER BY installed_rank;

-- Utilisateurs
SELECT id, username, role, left(password, 20) AS pwd_prefix FROM users;

-- Effectifs
SELECT (SELECT count(*) FROM users) AS users_count,
       (SELECT count(*) FROM categories) AS categories_count,
       (SELECT count(*) FROM item_listings) AS items_count;
```

## Migrations

- **V1** : schéma (users, categories, item_listings), catégories, 1 item (seller_id=1).
- **V2** : images + items supplémentaires.
- **V3–V5** : users E2E (historique).
- **V6** : seed E2E/demo idempotent (seller, buyer, admin + catégories + au moins un item si vide).

---

## Livrable final (soutenance)

| # | Élément |
|---|--------|
| **1** | **Cause racine login** : requêtes API du navigateur n’atteignent pas le backend (port 8080 non exposé sur l’hôte quand front en dev avec baseURL `http://localhost:8080`). |
| **2** | **Cause racine catalogue vide** : même cause — appel `GET /api/items` en erreur réseau, pas de filtre métier côté backend. |
| **3** | **Cause racine V5/V6 absentes** : base migrée par une image backend qui ne contenait que V1–V4 (cache ou build antérieur) ; rebuild sans cache pour embarquer tout le JAR. |
| **4** | **Fichiers modifiés** : `infra/compose/docker-compose.yml` (ajout `ports: "8080:8080"` backend), `docs/e2e-seed-data.md` (diagnostic + validation). |
| **5** | **Code exact** : dans `docker-compose.yml`, section `backend`, ajout de `ports: "8080:8080"` sous `depends_on`. |
| **6** | **Validation locale** : `docker compose build --no-cache backend && docker compose up -d` puis curl health/login/items (voir blocs ci-dessus). |
| **7** | **Requêtes SQL** : voir section « Requêtes SQL de contrôle » ci-dessus. |
| **8** | **Identifiants E2E** : seller / buyer / admin, mot de passe `password` (table ci-dessus). |
