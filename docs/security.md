# Security

This document outlines the security considerations and controls for the Collector Shop application.

## Authentication and authorization

- **Authentication**
  - Implemented using JWT tokens issued by the backend.
  - `/api/auth/register` and `/api/auth/login` endpoints return a signed JWT.
  - Tokens are expected in the `Authorization: Bearer <token>` header.

- **Roles**
  - Role model is based on three roles:
    - `BUYER`
    - `SELLER`
    - `ADMIN`
  - Role is stored on the `User` domain object and embedded as a claim in the JWT.

- **Authorization**
  - Method-level security (e.g. `@PreAuthorize`) is used for role-based access:
    - `ROLE_SELLER` can create items via `/api/seller/items`.
    - `ROLE_ADMIN` can manage categories via `/api/admin/categories`.
  - Public endpoints:
    - `GET /api/items`, `GET /api/items/{id}`, `GET /api/categories`.

## Token handling

- Backend:
  - JWTs are signed with an HMAC secret configured via `jwt.secret`.
  - Tokens are validated by a custom JWT filter and a stateless security configuration.

- Frontend:
  - JWT is stored in `localStorage` and attached to all Axios requests.
  - Simple route guards restrict access to seller and admin pages.

## Dependency scan

- **Backend (Maven)** : scan **OWASP Dependency Check** dans un workflow GitHub Actions dédié (`.github/workflows/dependency-check.yml`), déclenché sur push `main`/`master`, exécution manuelle ou planifiée. Rapport HTML publié en artifact. Ce scan est volontairement séparé du pipeline principal pour garder la CI rapide et stable ; le rapport reste disponible pour la soutenance et l’audit.
- **Frontend (npm)** : scan automatique en CI avec **npm audit** dans le pipeline principal. Rapport texte publié en artifact pour analyse des vulnérabilités connues (CVE).
- **Images Docker** : scan automatique en CI avec **Trivy** sur les images backend et frontend construites par le pipeline. Rapports (tableau) publiés en artifact.

## Other controls

- **Input validation**:
  - `@Valid` and Bean Validation are used on request DTOs.

- **Security endpoints**:
  - Health endpoint exposed at `/actuator/health` for monitoring.


