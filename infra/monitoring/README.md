# Observabilité – Prometheus + Grafana (démo)

Stack minimale pour la soutenance : métriques backend Spring Boot exposées via Actuator/Prometheus, scrapées par Prometheus, visualisables dans Grafana.

## Fichiers

- **prometheus/prometheus.yml** : configuration Prometheus (scrape `backend:8080/actuator/prometheus`).
- **grafana/provisioning/datasources/datasources.yml** : source Prometheus préconfigurée au démarrage de Grafana.

## Lancer la stack

À partir de `infra/compose` (certificats Nginx déjà générés si HTTPS) :

```bash
cd infra/compose
docker compose up -d --build
```

Tous les services (backend, prometheus, etc.) sont sur le réseau explicite `collector-shop-net` pour que Prometheus résolve le nom `backend`. Après modification du compose (réseau, services), faire `docker compose down` puis `docker compose up -d` pour recréer le réseau.

## URLs

| Service    | URL (local)              |
|-----------|---------------------------|
| App (HTTPS) | https://localhost        |
| Prometheus  | http://localhost:9090   |
| Grafana     | http://localhost:3000   |

**Grafana** : identifiants par défaut `admin` / `admin`. La source Prometheus est déjà configurée (provisioning).

## Démo rapide

1. **Prometheus** : http://localhost:9090 → onglet **Status > Targets** : target `backend` doit être UP.
2. **Prometheus** : onglet **Graph** → requête ex. `jvm_memory_used_bytes` ou `http_server_requests_seconds_count`.
3. **Grafana** : http://localhost:3000 → login admin/admin → **Explore** (icône boussole) → choisir Prometheus → requête ex. `jvm_memory_used_bytes`.
4. Créer un dashboard : **Dashboard > New > Add visualization** → Prometheus → métriques JVM ou HTTP.

## Validation

- **Actuator** (backend écoute en **HTTP** sur 8080 ; utiliser `http://` pas `https://` pour éviter « Invalid character found in method name ») :  
  `curl -s http://localhost:8080/actuator/health` → JSON avec `"status":"UP"`.  
  `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/prometheus` → attendu `200`.
- **Prometheus targets** : http://localhost:9090/targets → job `backend` doit être **UP**.
- **Grafana datasource** : http://localhost:3000 → Configuration → Data sources → Prometheus → **Save & test**.
