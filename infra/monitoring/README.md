# Observabilité – Prometheus + Grafana (démo)

Stack minimale pour la soutenance : métriques backend Spring Boot exposées via Actuator/Prometheus, scrapées par Prometheus, visualisables dans Grafana.

## Fichiers

- **prometheus/prometheus.yml** : configuration Prometheus (scrape `backend:8080/actuator/prometheus`).
- **grafana/provisioning/datasources/datasources.yml** : source Prometheus préconfigurée au démarrage de Grafana.

## Lancer la stack

À la racine du projet (avec certificats Nginx déjà générés si vous utilisez HTTPS) :

```bash
cd infra/compose
docker compose up -d --build
```

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

- Backend expose : http://localhost:8080/actuator/prometheus (si backend exposé) ou via Nginx https://localhost/actuator/prometheus si proxy configuré pour actuator.
- Prometheus scrape : http://localhost:9090/targets → backend doit être UP.
- Grafana : datasource Prometheus testée (Settings > Data sources > Prometheus > Save & test).
