# Nginx reverse proxy + TLS (démo)

## Fichiers créés / modifiés

| Fichier | Rôle |
|---------|------|
| `infra/nginx/nginx.conf` | Config Nginx : HTTP→HTTPS, proxy `/` → frontend, `/api/` et `/actuator/` → backend |
| `infra/nginx/certs/` | Dossier des certificats (cert.pem, key.pem générés localement) |
| `infra/nginx/gen-cert.sh` | Script de génération du certificat auto-signé |
| `infra/nginx/README.md` | Ce fichier |
| `infra/compose/docker-compose.yml` | Service `nginx` ajouté, frontend en VITE_API_URL="", CORS https://localhost, ports 80/443 exposés |

---

## 1. Certificat auto-signé (à faire une fois)

Générer le certificat dans `certs/` **avant** le premier `docker compose up` :

**Linux / macOS / Git Bash (Windows) :**
```bash
cd infra/nginx
chmod +x gen-cert.sh
./gen-cert.sh
```

**Ou à la main (OpenSSL) :**
```bash
cd infra/nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/CN=localhost/O=CollectorShop Demo"
```

**Windows (PowerShell), si OpenSSL est installé :**
```powershell
cd infra\nginx\certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem -subj "/CN=localhost/O=CollectorShop Demo"
```

---

## 2. Commandes pour lancer la stack HTTPS

À la **racine du projet** (où se trouve le dossier `infra/`) :

```bash
# Générer le certificat (une seule fois)
cd infra/nginx && ./gen-cert.sh && cd ../..

# Lancer toute la stack (db, backend, frontend, nginx)
docker compose -f infra/compose/docker-compose.yml up --build
```

Puis ouvrir dans le navigateur : **https://localhost** et accepter le certificat auto-signé (avertissement normal en démo).

---

## 3. URL pour la démo

| Usage | URL |
|-------|-----|
| **Application (frontend + API)** | **https://localhost** |
| Health check API | https://localhost/actuator/health |

Le port 80 (HTTP) redirige automatiquement vers HTTPS (301).

---

## 4. Résumé des changements

- **Nginx** : nouveau service qui écoute sur 80 (redir. HTTPS) et 443 (TLS). Proxy vers `frontend:80` pour `/` et vers `backend:8080` pour `/api/` et `/actuator/`.
- **Frontend** : build avec `VITE_API_URL=""` pour que les appels API soient en relatif (même origine que le proxy), plus d’appel direct à `localhost:8080`.
- **Backend** : CORS mis à `https://localhost` pour accepter les requêtes depuis la page servie en HTTPS.
- **Ports** : seuls 80 et 443 sont exposés sur l’hôte ; backend et frontend ne sont plus exposés directement (accès uniquement via Nginx).

---

## 5. Points de validation manuelle

1. **Certificat** : après `./gen-cert.sh`, vérifier la présence de `infra/nginx/certs/cert.pem` et `infra/nginx/certs/key.pem`.
2. **Démarrage** : `docker compose -f infra/compose/docker-compose.yml up --build` doit faire tourner db, backend, frontend, nginx sans erreur.
3. **HTTP → HTTPS** : ouvrir http://localhost → doit rediriger vers https://localhost.
4. **Page d’accueil** : https://localhost affiche le frontend (Collector Shop).
5. **Login / Register** : créer un compte ou se connecter ; les appels API passent par https://localhost/api/...
6. **Health** : https://localhost/actuator/health renvoie du JSON (status UP).
7. **Navigateur** : accepter l’avertissement « certificat non fiable » (auto-signé) pour localhost.
