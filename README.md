# AgencyOS - SaaS Project Manager (TD1 Partie I)

Application de gestion de projet multi-entreprises (SaaS), inspirée de Trello / Notion / ClickUp.

## Stack

- Frontend: React 19 + Vite 8
- Backend: Node.js + Express 5 (API REST)
- Base de données: MongoDB 7 (driver officiel `mongodb`)
- Conteneurisation: Docker + Docker Compose

## Démarrage (livrable)

Prérequis: Docker et Docker Compose.

```bash
docker compose up -d --build
```

Application: http://localhost:3000

Aucune installation de dépendances ni configuration manuelle supplémentaire n'est nécessaire. Les variables ont des valeurs par défaut fonctionnelles dans `compose.yml`.

## Configuration

La connexion MongoDB est configurable sans modifier le code source via `MONGODB_URI`.

Fichier de configuration fourni: `.env.example`.

Variables:

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3000` | Port exposé par l'application |
| `NODE_ENV` | `production` | Mode Node |
| `MONGODB_URI` | `mongodb://mongodb:27017/saas_pm` | URI MongoDB (standalone, replica set, mongos) |
| `JWT_SECRET` | `dev-secret-change-me` | Secret JWT (à changer en production) |

Exemple pour la Partie II (réplication/sharding), sans modifier le code:

```env
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/saas_pm?replicaSet=rs0
```

## Fonctionnalités (TD1 Partie I)

- Authentification JWT (inscription, connexion).
- Multi-tenant strict: toutes les données métier sont filtrées par `companyId` issu du JWT.
- Entreprises: création, modification, suppression. **Seul le créateur de l'entreprise peut la modifier ou la supprimer**. Suppression en cascade des données de l'entreprise.
- Utilisateurs: inscription, demande d'adhésion à une entreprise, approbation/rejet par admin, modification de profil/rôle, **suppression possible uniquement par l'utilisateur lui-même**.
- Projets: CRUD, assignation d'utilisateurs, statut, progression.
- Tâches: CRUD, assignation à un utilisateur, statut, priorité, échéance, visualisation Kanban.
- Fonctionnalités supplémentaires: clients, facturation, recherche globale, indicateurs d'échéance/dashboard.

## Utilisation rapide

1. Lancer `docker compose up -d --build`.
2. Ouvrir http://localhost:3000.
3. Créer un compte.
4. Créer une entreprise ou demander à rejoindre une entreprise existante.
5. Une fois actif dans une entreprise, accéder aux projets, tâches, Kanban, membres.

## Isolation multi-tenant

- L'identité et `companyId` proviennent du token JWT (`requireAuth`).
- Les routes métier filtrent systématiquement par `companyId`.
- La suppression d'entreprise supprime en cascade utilisateurs, projets, tâches, clients et factures liés à cette entreprise.

## Commandes utiles

```bash
docker compose up -d --build
docker compose logs -f app
docker compose down
docker compose down -v  # supprime aussi les données Mongo
```

## Livrables

- [Spécification technique](docs/SPECIFICATION_TECHNIQUE.md)
- [Spécification fonctionnelle](docs/SPECIFICATION_FONCTIONNELLE.md)
- `Dockerfile`
- `compose.yml`
- `.env.example`
- `README.md`
