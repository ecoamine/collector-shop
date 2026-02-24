# Local validation and Docker commands

## 1) Local validation commands

Run from the **repository root** (e.g. `collector-shop/`). Ensure Java 21, Maven, Node 22, and (for backend integration tests) Docker are available.

```bash
cd "D:\MAALSI\M2\Ressources Pédagogiques-BLOC03\Evaluation Individuelle\collector-shop"

mvn -f backend/pom.xml -B test

cd frontend
npm ci
npm run build
npx playwright install --with-deps
npm run test:e2e
cd ..
```

Single copy-paste block (PowerShell, from repo root):

```powershell
cd "D:\MAALSI\M2\Ressources Pédagogiques-BLOC03\Evaluation Individuelle\collector-shop"
mvn -f backend/pom.xml -B test
cd frontend; npm ci; npm run build; npx playwright install --with-deps; npm run test:e2e; cd ..
```

Note: Backend integration tests use Testcontainers (PostgreSQL). If Docker is not running, those tests are skipped. Frontend E2E starts the dev server by default; for E2E against a running stack (e.g. Docker), set `PLAYWRIGHT_BASE_URL` and `CI=true` and do not start the dev server.

---

## 2) Docker local commands

From the **repository root**:

**Build and start (prod-like):**
```bash
cd infra/compose
docker compose up -d --build
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Backend health: http://localhost:8080/actuator/health

**Stop and remove:**
```bash
cd infra/compose
docker compose down -v
```

**Run Playwright against the running stack:**
```bash
cd frontend
set CI=true
set PLAYWRIGHT_BASE_URL=http://localhost:5173
npm run test:e2e
```

---

## 3) GitHub Actions verification

The pipeline (`.github/workflows/ci.yml`) runs on push/PR to `main`:

- **backend**: Java 21, Maven cache, `mvn -B test` (unit + integration with Testcontainers).
- **frontend**: Node 22, npm cache, `npm ci`, `npm run build`, then `docker compose up --build`, wait for health, `npm run test:e2e` (Playwright).
- **docker-build**: Builds images, runs stack, smoke tests (curl backend health and frontend), tears down.

Pipeline fails if any job fails.

---

## 4) Commit & push commands

Do **not** push from this environment. Run locally:

```bash
cd "D:\MAALSI\M2\Ressources Pédagogiques-BLOC03\Evaluation Individuelle\collector-shop"
git status
git add -A
git status
git commit -m "ci: full pipeline, Docker prod-like, E2E seed users and docs"
```

Then push to trigger the pipeline (run this yourself when ready):

```bash
git push origin main
```

(Or your branch name if you use a different branch; the workflow triggers on push to `main` and on PRs targeting `main`.)
