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


## System architecture overview

The Collector Shop application follows a three-tier web architecture composed of:

- a React frontend responsible for user interaction
- a Spring Boot backend exposing REST APIs
- a PostgreSQL database for persistence
- a containerized runtime environment using Docker Compose
- a CI pipeline using GitHub Actions

This architecture ensures separation of concerns, scalability and ease of deployment.

---

## Main application flows

### Public catalog browsing
User → React frontend → Spring Boot API → PostgreSQL

### Authentication
User → Login form → API → JWT generation → secured API access

### Item publication
Seller → React frontend → secured REST endpoint → persistence in PostgreSQL

### Category management
Admin → secured frontend route → secured backend endpoint → database update

---

## Security architecture

Security is integrated at multiple levels:

- JWT authentication mechanism
- role-based authorization (BUYER, SELLER, ADMIN)
- protected API endpoints
- input validation using Bean Validation
- container isolation using Docker
- health monitoring via Spring Boot Actuator

Future improvements include:
- HTTPS termination via reverse proxy
- vulnerability scanning in CI pipeline
- rate limiting and API gateway integration

---

## Deployment architecture

The application is deployed locally using Docker Compose:

- PostgreSQL container
- Spring Boot backend container
- React frontend container

This setup provides:

- reproducible environment
- simplified demonstration setup
- preparation for orchestration with Kubernetes

---

## Observability

Basic observability is ensured through:

- Spring Boot Actuator health endpoint
- application logs
- future integration with metrics and monitoring tools

---

## Architectural rationale

This architecture was chosen to:

- ensure modularity and maintainability
- allow rapid prototyping
- support future scalability
- align with modern DevOps practices