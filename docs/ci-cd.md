# CI/CD

This document describes the continuous integration and continuous delivery pipeline for the Collector Shop application.

## GitHub Actions

- Workflow: `.github/workflows/ci.yml`.

### Backend job

- Runs on `ubuntu-latest`.
- Steps:
  - Checkout code.
  - Set up Java 21 with Maven cache.
  - Run `mvn test` in the `backend` directory.

### Frontend job

- Depends on backend job.
- Steps:
  - Checkout code.
  - Set up Node.js and install NPM dependencies in `frontend`.
  - Build the frontend with `npm run build`.
  - Start Docker Compose stack from `infra/compose` (PostgreSQL, backend, frontend).
  - Wait for backend health at `/actuator/health`.
  - Install Playwright browsers and run E2E tests.
  - Tear down the Docker Compose stack.

The pipeline fails if any Maven or Playwright tests fail.


