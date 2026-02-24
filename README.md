## Collector Shop

Collector Shop is a sample full-stack application for managing collectible items, sellers, and related catalog data. It consists of a Spring Boot backend, a Vite/React frontend, and supporting infrastructure and CI configuration.

### Repository structure

```text
collector-shop/
  backend/             # Spring Boot API
  frontend/            # Vite + React frontend
  infra/
    compose/           # Docker Compose stack
    k8s/               # (placeholder) Kubernetes manifests
  docs/                # Architecture, testing, security, CI/CD docs
  .github/workflows/   # GitHub Actions workflows
```

### Stack overview

- **Backend**: Spring Boot 3 (Java 21), Maven, PostgreSQL, Flyway, Spring Security, Spring Data JPA, Spring Validation, Spring Actuator, Springdoc OpenAPI, Testcontainers, JUnit Jupiter, Mockito, Lombok.
- **Frontend**: Vite + React (JavaScript), React Router, Axios, Playwright (E2E testing).
- **Infrastructure**: Docker Compose for local development, Kubernetes manifests (skeleton) under `infra/k8s`.
- **CI/CD**: GitHub Actions workflow skeleton under `.github/workflows`.

### Local development

- **Backend**
  - Requirements: Java 21, Maven, PostgreSQL.
  - Configure a local PostgreSQL instance (or use Docker) with:
    - URL: `jdbc:postgresql://localhost:5432/collector_shop`
    - User: `collector_shop`
    - Password: `collector_shop`
  - Commands:
    ```bash
    cd backend
    mvn test
    mvn spring-boot:run
    ```

- **Frontend**
  - Requirements: Node.js and npm.
  - Commands:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
  - By default the frontend expects the API at `http://localhost:8080`. Override with:
    ```bash
    VITE_API_URL=http://localhost:8080 npm run dev
    ```

### Docker setup

From the repository root:

```bash
cd infra/compose
docker compose up --build
```

Services:
- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:8080`
- Frontend: `http://localhost:5173`

### Testing commands

- **Backend unit/integration tests**
  ```bash
  mvn -f backend/pom.xml test
  ```

- **Frontend E2E tests (Playwright)**
  ```bash
  cd frontend
  npm run test:e2e       # headless
  npm run test:e2e:ui    # Playwright UI mode
  ```

### API endpoints (summary)

- Public:
  - `GET /api/items`
  - `GET /api/items/{id}`
  - `GET /api/categories`
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login` (returns JWT)
- Seller (`ROLE_SELLER`):
  - `POST /api/seller/items`
- Admin (`ROLE_ADMIN`):
  - `POST /api/admin/categories`
  - `DELETE /api/admin/categories/{id}`

