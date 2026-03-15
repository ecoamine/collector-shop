# Données de seed E2E (Collector.shop)

Données créées par Flyway pour les tests end-to-end et la démo locale. Garanties après chaque `docker compose up --build` (migrations V1 à V5).

## Utilisateurs de test

| Username | Password | Rôle   | Usage E2E |
|----------|----------|--------|------------|
| **seller** | `password` | SELLER | Connexion, création d’annonce (auth-seller.spec.js) |
| **buyer**  | `password` | BUYER  | Connexion, accès refusé à /admin (admin-access.spec.js) |
| **admin**  | `password` | ADMIN  | Connexion, gestion des catégories (vérification CI) |

Hash BCrypt (strength 10) utilisé : vérifié par `E2ESeedPasswordTest` dans le backend.

## Catégories

Créées en V1 : **Cards**, **Figures**, **Comics** (ids 1, 2, 3).

## Items (catalogue)

- V1 : 1 item « Sample Item » (catégorie Cards, seller_id=1).
- V2 : 3 items supplémentaires (Vintage Trading Card, Action Figure, Classic Comic).

Au moins un item est toujours présent après migrations ; le catalogue E2E (`catalog.spec.js`) et le formulaire vendeur (sélection `categoryId` 1) en dépendent.

## Points de validation manuelle

1. **Stack démarrée**  
   `cd infra/compose && docker compose up -d --build` puis attendre ~30 s.

2. **Backend et seed**  
   - Health : `curl -k -s https://localhost/actuator/health` → `"status":"UP"`.
   - Catalogue : `curl -k -s https://localhost/api/items` → JSON avec au moins un objet contenant `"id"`.
   - Login seller :  
     `curl -k -s -X POST https://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"seller","password":"password"}'`  
     → réponse avec `"token"`.
   - Login admin : idem avec `"username":"admin"`.

3. **E2E Playwright**  
   Depuis `frontend/` :  
   `PLAYWRIGHT_BASE_URL=https://localhost NODE_TLS_REJECT_UNAUTHORIZED=0 npm run test:e2e`  
   (certificat auto-signé : accepter ou utiliser `ignoreHTTPSErrors` en CI.)

## Migrations concernées

- **V1** : schéma, catégories, premier item (seller_id=1).
- **V2** : images et items supplémentaires.
- **V3** : utilisateurs seller, buyer (seed initial).
- **V4** : mise à jour du mot de passe pour seller, buyer, admin.
- **V5** : garantie des trois utilisateurs E2E (upsert seller, buyer, admin avec mot de passe `password`).

En CI, le job frontend attend que le catalogue renvoie au moins un item et vérifie le login seller et admin avant de lancer Playwright.
