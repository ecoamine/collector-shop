# Testing Strategy

This document describes the testing strategy for the Collector Shop application.

## Backend

- **Unit tests**
  - Service layer tested with JUnit 5 and Mockito.
  - Example: `ItemServiceTest`, `CategoryServiceTest`.
  - Command:
    - `mvn -f backend/pom.xml test`

- **Integration tests**
  - Repository and API integration tests use Testcontainers PostgreSQL.
  - Example: `ItemListingRepositoryIT`, `ItemApiIntegrationTest`.
  - Testcontainers are disabled when Docker is not available.

## Frontend

- **E2E tests**
  - Playwright tests execute against a running frontend and backend:
    - `frontend/tests/catalog.spec.js`: catalog loads and item details open.
    - `frontend/tests/auth-seller.spec.js`: login as SELLER and create listing.
    - `frontend/tests/admin-access.spec.js`: admin page forbidden for non-admin.
  - Commands (from `frontend`):
    - `npm run test:e2e`
    - `npm run test:e2e:ui`

## Combined flows

- CI pipeline (GitHub Actions) runs:
  - `mvn test` for backend.
  - `npm run build` and Playwright tests for frontend against the Docker Compose stack.


