# Données E2E – Collector.shop

## Cause racine (hypothèse principale)

En CI, l’image backend pouvait être **servie par le cache Docker** (couche `COPY src` + `RUN mvn package` inchangée d’un run à l’autre). Une image ancienne sans les migrations V3–V6 (ou avec un JAR antérieur) conduit à une base sans users/items après Flyway, d’où « Invalid credentials » et catalogue vide.

**Corrections appliquées :**
- Rebuild backend **sans cache** en CI (`docker compose build --no-cache backend`).
- **Diagnostic DB** en CI après health : historique Flyway + effectifs `users`, `categories`, `item_listings`.
- Flyway **explicitement activé** en profil docker avec `locations: classpath:db/migration`.

## Identifiants E2E finaux

| Username | Password | Rôle   |
|----------|----------|--------|
| **seller** | `password` | SELLER |
| **buyer**  | `password` | BUYER  |
| **admin**  | `password` | ADMIN  |

Hash BCrypt (strength 10) : `$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC` (aligné avec `E2ESeedPasswordTest` et `SecurityConfig`).

## Commandes de validation locale

```bash
# 1. Démarrer (rebuild backend sans cache pour reproduire la CI)
cd infra/compose
docker compose build --no-cache backend
docker compose up -d
# Attendre ~30 s

# 2. Health
curl -k -s https://localhost/actuator/health

# 3. Diagnostic DB (même principe qu’en CI)
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT installed_rank, version FROM flyway_schema_history ORDER BY installed_rank;"
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT username, role FROM users;"
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT count(*) FROM categories;"
docker compose exec -T db psql -U collector_shop -d collector_shop -t -A -c "SELECT count(*) FROM item_listings;"

# 4. Catalogue
curl -k -s https://localhost/api/items

# 5. Logins
curl -k -s -X POST https://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"seller","password":"password"}'
curl -k -s -X POST https://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"buyer","password":"password"}'

# 6. E2E Playwright (depuis frontend/)
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
