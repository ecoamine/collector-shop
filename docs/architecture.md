# Architecture

This document describes the high-level architecture of the Collector Shop application.

## Layers

- **Backend**
  - `controller`: HTTP API layer exposing REST endpoints for items, categories and authentication.
  - `service`: business services orchestrating domain logic, validation and repository access.
  - `repository`: Spring Data JPA repositories for `User`, `Category`, and `ItemListing`.
  - `domain`: JPA entities and enums representing the core model.
  - `dto`: data transfer objects used for request/response payloads.
  - `mapper`: mappers to convert between domain entities and DTOs.
  - `security`: JWT handling and filters, plus security configuration.
  - `exception`: domain-specific exceptions and global exception handling using `ProblemDetail`.

- **Frontend**
  - `pages`: top-level pages for catalog, item details, login, registration, seller listing creation, and admin category management.
  - `components`: shared UI components (to be extended).
  - `services`: API clients (Axios) and shared infrastructure.
  - `routes`: route guards for authenticated and role-based access.
  - `hooks`: reusable hooks like authentication state management.

- **Infrastructure**
  - `infra/compose`: Docker Compose stack wiring PostgreSQL, backend and frontend.
  - `infra/k8s`: placeholder for Kubernetes manifests for future deployment.

## Data flow

1. The frontend calls the backend via Axios using the `VITE_API_URL` base URL.
2. Controllers validate input (`@Valid`), delegate to services, which interact with repositories.
3. Services operate on domain entities and use mappers to return DTOs.
4. Security is enforced via JWT-based authentication and role-based authorization (BUYER, SELLER, ADMIN).


