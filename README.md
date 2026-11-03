# SaaS Project Manager

Outil de gestion de projet multi-entreprises inspiré de Trello / Notion / ClickUp, développé dans le cadre du **TD1 – Architecture MongoDB & SaaS**.

## Stack technique

| Couche     | Technologie                        |
|------------|------------------------------------|
| Frontend   | React 19 + Vite 8 (SPA)           |
| Backend    | Node.js + Express 5 (API REST)     |
| Base de données | MongoDB 7 (driver officiel)  |
| Conteneurisation | Docker + Docker Compose      |

---

## Démarrage en une seule commande

```bash
docker compose up -d --build
```

L'application est ensuite accessible sur : **http://localhost:3000**

> Aucune installation de dépendances ni configuration manuelle supplémentaire n'est nécessaire, à l'exception de **Docker** et **Docker Compose**.

---

## Configuration

La connexion MongoDB est entièrement configurable via la variable d'environnement `MONGODB_URI` dans le fichier `compose.yml`, sans modifier le code source :

```yaml
environment:
  - MONGODB_URI=mongodb://mongodb:27017/saas_pm
```

Pour pointer vers un Replica Set ou un cluster sharder (Partie II), il suffit de modifier cette valeur :

```yaml
  - MONGODB_URI=mongodb://rs1:27017,rs2:27017,rs3:27017/saas_pm?replicaSet=rs0
```

---

## Fonctionnalités principales

- ✅ **Multi-tenant strict** : isolation par `companyId` sur toutes les collections
- ✅ **Gestion des entreprises** : création, modification, suppression en cascade
- ✅ **Gestion des projets** : CRUD, assignation de membres, suivi de progression
- ✅ **Gestion des utilisateurs** : CRUD, rôles (admin / manager / membre)
- ✅ **Tableau Kanban** : visualisation et déplacement des tâches entre 4 colonnes
- ✅ **Tâches** : création, assignation, priorité, date d'échéance, statut
- ✅ **Données de démo** : 2 entreprises pré-peuplées au premier démarrage

---

## Architecture Docker

```
compose.yml
├── mongodb   (mongo:7, port 27017, volume persistant)
└── app       (build Dockerfile multi-stage, port 3000)
```

Le service `app` attend que le healthcheck de `mongodb` soit validé avant de démarrer.

---

## Données de démonstration

Au premier démarrage (base vide), deux entreprises sont injectées automatiquement pour tester l'étanchéité multi-tenant :

| Entreprise            | Plan       | Membres | Projets |
|-----------------------|------------|---------|---------|
| Acme Innovation SaaS  | Enterprise | 3       | 2       |
| Nova Studio Digital   | Pro        | 2       | 1       |

---

## Livrables TD1

- 📄 [Spécification Technique (Architecture MongoDB & Schémas JSON)](docs/SPECIFICATION_TECHNIQUE.md)
- 📋 [Spécification Fonctionnelle (Fonctionnalités & Rôles)](docs/SPECIFICATION_FONCTIONNELLE.md)
- 🐳 `Dockerfile` + `compose.yml` (Démarrage 1 commande via `docker compose up -d --build`)

