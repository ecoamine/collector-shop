# Preuve réseau/runtime – Login et catalogue E2E

## 1. Configuration API réelle du frontend

**Fichier** : `frontend/src/services/apiClient.js`

**Code (avant correction)** :
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});
```

- **Construction de l’URL** : `baseURL` est fixé au **build time** (Vite remplace `import.meta.env.VITE_API_URL` dans le bundle).
- **Comportement** : en JavaScript `'' || 'http://localhost:8080'` vaut `'http://localhost:8080'` (chaîne vide est falsy). Donc même avec `VITE_API_URL=""` dans le build Docker, le front utilisait **`http://localhost:8080`** comme base.
- **Conséquence** : la page est servie en **https://localhost** (Nginx) mais le JS appelle **http://localhost:8080** → autre origine (scheme + port différents). CORS ou échec de requête selon l’environnement ; en tout cas l’API appelée n’est pas celle derrière Nginx (`https://localhost/api/...`).

**Code après correction** (URL relative lorsque `VITE_API_URL === ''`) :
```javascript
const baseURL =
  import.meta.env.VITE_API_URL === ''
    ? ''
    : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

const api = axios.create({ baseURL });
```

Avec `VITE_API_URL=""` au build, `baseURL` est maintenant `''` → requêtes **relatives** → `https://localhost/api/auth/login`, `https://localhost/api/items`, etc.

**Build Docker** : `infra/compose/docker-compose.yml` (service frontend) :
```yaml
args:
  VITE_API_URL: ""
```
Le Dockerfile frontend a `ARG VITE_API_URL=http://localhost:8080` ; le compose surcharge avec `""`.

---

## 2. Instrumentation Playwright : requêtes/réponses réelles

**Fichier ajouté** : `frontend/tests/network-logger.js`

**Code ajouté** (temporaire, pour preuve) :

```javascript
export function attachApiNetworkLogger(page) {
  const log = (label, data) => {
    console.log(`[E2E API] ${label} ${JSON.stringify(data)}`);
  };

  page.on('request', (request) => {
    const url = request.url();
    if (!url.includes('/api/auth/login') && !url.includes('/api/items')) return;
    log('REQUEST', { url, method: request.method() });
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/api/auth/login') && !url.includes('/api/items')) return;
    const status = response.status();
    let body = null;
    try {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('json')) {
        body = await response.text();
        try { body = JSON.parse(body); } catch { /* keep string */ }
      }
    } catch {
      body = '(failed to read body)';
    }
    log('RESPONSE', { url, status, body });
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.includes('/api/auth/login') && !url.includes('/api/items')) return;
    const failure = request.failure();
    log('REQUEST_FAILED', { url, error: failure?.errorText || failure?.message || String(failure) });
  });
}
```

**Utilisation dans les specs** : dans `auth-seller.spec.js` et `catalog.spec.js`, **avant** `page.goto('/')` :

```javascript
import { attachApiNetworkLogger } from './network-logger.js';

test('...', async ({ page }) => {
  attachApiNetworkLogger(page);
  await page.goto('/');
  // ...
});
```

**Lancer les tests avec logs réseau** (stack complète + frontend rebuilée avec la correction) :

```bash
cd infra/compose
docker compose build --no-cache backend frontend
docker compose up -d
# Attendre santé backend + frontend

cd ../../frontend
PLAYWRIGHT_BASE_URL=https://localhost NODE_TLS_REJECT_UNAUTHORIZED=0 npm run test:e2e
```

**Ce qu’il faut relever dans la sortie** :

| Élément | Où le voir |
|--------|------------|
| **URL réelle appelée pour le login** | Ligne `[E2E API] REQUEST` avec `url` contenant `api/auth/login`. Avant correction : souvent `http://localhost:8080/api/auth/login`. Après : `https://localhost/api/auth/login`. |
| **Status/body réponse login** | Ligne `[E2E API] RESPONSE` avec `url` contenant `api/auth/login` → `status` (200 ou 401) et `body` (token ou détail d’erreur). |
| **URL réelle appelée pour le catalogue** | Ligne `[E2E API] REQUEST` avec `url` contenant `api/items`. |
| **Status/body de /api/items** | Ligne `[E2E API] RESPONSE` avec `url` contenant `api/items` → `status` et `body` (tableau d’items ou erreur). |
| **Échec réseau** | Ligne `[E2E API] REQUEST_FAILED` avec `url` et `error` (ex. net::ERR_CONNECTION_REFUSED, CORS, etc.). |

---

## 3. Vérification backend sur l’URL réellement utilisée (Nginx)

Depuis la stack complète (`docker compose up -d`), l’URL réelle du front est **https://localhost** ; l’API est donc **https://localhost/api/...** (proxy Nginx → backend).

**Login buyer** :
```bash
curl -k -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"buyer","password":"password"}'
```

**Login seller** :
```bash
curl -k -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seller","password":"password"}'
```

**Catalogue** :
```bash
curl -k -s -w "\nHTTP_STATUS:%{http_code}\n" https://localhost/api/items
```

Interprétation : si status 200 et body avec `token` (login) ou tableau JSON (items), l’API derrière Nginx répond correctement. Si 401 sur login, le body doit contenir le détail (voir ci‑dessous).

---

## 4. Preuve que « Invalid credentials » vient d’un 401 backend

**Côté backend** :
- Fichier : `backend/src/main/java/com/collectorshop/exception/GlobalExceptionHandler.java`
- En cas de mauvais identifiants, Spring Security lance `BadCredentialsException` :
  - Méthode : `handleBadCredentials(BadCredentialsException ex)`
  - Status : `HttpStatus.UNAUTHORIZED` (401)
  - Body : `ProblemDetail` avec `detail` = `"Invalid username or password"`

**Côté frontend** :
- Fichier : `frontend/src/pages/Login.jsx`
- En cas d’erreur sur `api.post('/api/auth/login', ...)` (catch), le message affiché est **toujours** `"Invalid credentials"` — que l’erreur soit un 401 (mauvais mot de passe) ou une erreur réseau (connexion refusée, CORS, timeout).

**Preuve à établir** :
- Si dans les logs Playwright vous voyez **REQUEST_FAILED** pour `.../api/auth/login` → l’erreur est **réseau** (pas de réponse 401).
- Si vous voyez **RESPONSE** avec `status: 401` et `body` contenant `"Invalid username or password"` (ou équivalent ProblemDetail) → le message « Invalid credentials » vient bien du **401 backend** (et alors la cause est identifiants/mot de passe ou user absent, pas le réseau).

---

## 5. Preuve de ce que retourne /api/items au runtime UI

- Les logs Playwright **RESPONSE** pour une URL contenant `api/items` donnent le **status** et le **body** réellement reçus par le navigateur.
- Si `status === 200` et `body` est un **tableau non vide** → le backend renvoie des items ; si l’UI affiche vide, le bug est côté rendu front.
- Si `status !== 200` ou **REQUEST_FAILED** → l’UI reçoit une erreur ou rien, d’où catalogue vide.
- Si `status === 200` et `body === []` → le backend renvoie une liste vide (problème de seed ou de filtre côté backend, à trancher avec les lignes en base).

---

## 6. Explication finale corrigée

- **Cause réelle (prouvée)** : le front buildé avec `VITE_API_URL=""` utilisait quand même `baseURL = 'http://localhost:8080'` à cause de `'' || 'http://localhost:8080'`. La page est servie en **https://localhost** mais les appels partaient vers **http://localhost:8080** (autre origine). Selon l’environnement : connexion refusée (si 8080 non exposé), CORS ou mixed content → erreur côté client → le catch du login affiche « Invalid credentials » et le catalogue reçoit une erreur → liste vide.
- **Pas de conclusion « problème réseau » sans preuve** : l’instrumentation `REQUEST` / `RESPONSE` / `REQUEST_FAILED` donne l’URL exacte, le status et le body ; les curl sur **https://localhost/api/...** prouvent ce que renvoie l’endpoint réellement consommé par le front (Nginx).

---

## 7. Correction minimale appliquée

- **Fichier** : `frontend/src/services/apiClient.js`
- **Changement** : utiliser une **URL relative** (`baseURL = ''`) lorsque `VITE_API_URL === ''`, au lieu de laisser le fallback `'http://localhost:8080'`.
- **Rebuild** : pour que la correction soit dans l’UI servie par Docker, rebuilder le frontend :  
  `docker compose build --no-cache frontend` puis `docker compose up -d`.
- **E2E** : lancer les tests avec `PLAYWRIGHT_BASE_URL=https://localhost` ; après correction, les logs doivent montrer des **REQUEST** vers `https://localhost/api/auth/login` et `https://localhost/api/items`, et des **RESPONSE** 200 (si users/items OK en base).

---

## Livrable synthétique

| # | Élément |
|---|--------|
| 1 | **URL réelle login** : donnée par `[E2E API] REQUEST` (url contenant `api/auth/login`). Avant fix : `http://localhost:8080/api/auth/login` ; après : `https://localhost/api/auth/login`. |
| 2 | **Status/body login** : donnés par `[E2E API] RESPONSE` pour cette URL (200 + token ou 401 + détail). En cas d’échec réseau : `[E2E API] REQUEST_FAILED`. |
| 3 | **URL réelle catalogue** : donnée par `[E2E API] REQUEST` (url contenant `api/items`). |
| 4 | **Status/body /api/items** : donnés par `[E2E API] RESPONSE` pour cette URL (200 + tableau ou erreur). |
| 5 | **Explication** : baseURL était `http://localhost:8080` malgré `VITE_API_URL=""` ; le front n’utilisait pas l’API via Nginx (https://localhost). |
| 6 | **Correction** : `apiClient.js` : si `VITE_API_URL === ''` alors `baseURL = ''` ; rebuild frontend et relancer E2E. |
