# Métriques Qualité – Collector.shop

## Objectif

Ces métriques permettent de piloter la qualité logicielle conformément au modèle ISO 25010 et de limiter l'accumulation de dette technique.

---

## 1. Couverture de tests

- Indicateur : taux de couverture du code backend
- Seuil cible : ≥ 70 %
- Outil : JaCoCo
- ISO 25010 : Fiabilité
- Dette technique évitée : régressions non détectées

---

## 2. Taux de succès du pipeline CI

- Indicateur : pipelines réussis / pipelines totaux
- Seuil cible : ≥ 95 %
- Outil : GitHub Actions
- ISO 25010 : Maintenabilité
- Dette technique évitée : intégration instable

---

## 3. Vulnérabilités critiques

- Indicateur : nombre de vulnérabilités critiques détectées
- Seuil cible : 0
- Outil : OWASP Dependency Check
- ISO 25010 : Sécurité
- Dette technique évitée : exposition aux attaques

---

## 4. Temps de réponse API

- Indicateur : temps de réponse moyen
- Seuil cible : < 500 ms
- Outil : JMeter
- ISO 25010 : Performance
- Dette technique évitée : dégradation UX