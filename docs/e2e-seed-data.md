# Données E2E – Collector.shop

Données de seed créées par Flyway (V1–V5) pour les tests Playwright et la démo. Garanties après chaque `docker compose up --build`.

## Identifiants E2E exacts

| Username | Password | Rôle   |
|----------|----------|--------|
| **seller** | `password` | SELLER |
| **buyer**  | `password` | BUYER  |
| **admin**  | `password` | ADMIN  |

Hash BCrypt (strength 10) : `$2a$10$6Gom9nVqetRlkyEFh2FlfOr2DYVzoki5LOlTNcqN5k5uuHJgFzBNC` (vérifié par `E2ESeedPasswordTest`).

## Données garanties

- **Catégories** (V1) : Cards, Figures, Comics (ids 1, 2, 3).
- **Items** (V1 + V2) : au moins un item (Sample Item + 3 autres).
- **Utilisateurs** (V3 + V5) : seller, buyer, admin avec mot de passe `password` (V4/V5 assurent le bon hash).

## Commandes de validation locale

```bash
# 1. Démarrer la stack
cd infra/compose && docker compose up -d --build
# Attendre ~30 s

# 2. Health backend
curl -k -s https://localhost/actuator/health
# Attendu : "status":"UP"

# 3. Catalogue (au moins un item)
curl -k -s https://localhost/api/items
# Attendu : JSON avec au moins un objet contenant "id"

# 4. Login seller
curl -k -s -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seller","password":"password"}'
# Attendu : {"token":"..."}

# 5. Login admin
curl -k -s -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
# Attendu : {"token":"..."}

# 6. E2E Playwright (depuis frontend/)
PLAYWRIGHT_BASE_URL=https://localhost NODE_TLS_REJECT_UNAUTHORIZED=0 npm run test:e2e
```

## Migrations

- **V1** : schéma, catégories, 1 item (seller_id=1).
- **V2** : images + 3 items.
- **V3** : users seller, buyer.
- **V4** : UPDATE password pour seller, buyer, admin.
- **V5** : INSERT … ON CONFLICT DO UPDATE pour seller, buyer, admin (garantie idempotente).
