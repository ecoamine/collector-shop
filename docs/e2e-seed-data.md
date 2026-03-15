# Données E2E – Collector.shop

Seed garanties par la migration Flyway **V6__e2e_demo_seed_idempotent.sql** (idempotent, base vide ou existante). Compatible `docker compose up --build` et CI.

## Identifiants E2E finaux

| Username | Password | Rôle   | Usage test |
|----------|----------|--------|------------|
| **seller** | `password` | SELLER | auth-seller.spec.js |
| **buyer**  | `password` | BUYER  | admin-access.spec.js |
| **admin**  | `password` | ADMIN  | (vérification CI) |

Hash BCrypt (strength 10) : `$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC` — aligné avec `E2ESeedPasswordTest` et `SecurityConfig` (BCryptPasswordEncoder).

## Données garanties après V6

- **Users** : seller, buyer, admin avec mot de passe `password`.
- **Catégories** : au moins Cards, Figures, Comics (ids 1, 2, 3) — formulaire seller `categoryId`.
- **Catalogue** : au moins un item (V1 ou V6) — `catalog.spec.js` (item-title).

## Commandes de validation locale exactes

```bash
# 1. Stack
cd infra/compose && docker compose up -d --build
# Attendre ~30 s

# 2. Health
curl -k -s https://localhost/actuator/health

# 3. Catalogue (≥1 item)
curl -k -s https://localhost/api/items

# 4. Login seller
curl -k -s -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seller","password":"password"}'

# 5. Login buyer
curl -k -s -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"buyer","password":"password"}'

# 6. Login admin
curl -k -s -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# 7. E2E Playwright (depuis frontend/)
PLAYWRIGHT_BASE_URL=https://localhost NODE_TLS_REJECT_UNAUTHORIZED=0 npm run test:e2e
```

## Migrations

- **V1** : schéma, catégories, 1 item (seller_id=1).
- **V2** : images + items supplémentaires.
- **V3–V5** : users E2E (historique).
- **V6** : seed E2E/demo idempotent — garantit users (seller, buyer, admin), catégories, et au moins un item si catalogue vide.
