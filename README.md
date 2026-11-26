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

- Authentification JWT (inscription, connexion) et onboarding centralisé: création d'entreprise à l'inscription ou demande d'adhésion en attente d'approbation.
- Multi-tenant strict: toutes les données métier sont filtrées par `companyId` issu du JWT. **Un utilisateur appartient à une seule entreprise**.
- Rôles: **CEO**, **Manager**, **Salarié** (`ceo`, `manager`, `employee`). Un seul CEO par entreprise; le rôle du CEO est intouchable.
  - Le CEO modifie tous les rôles sauf le sien, tous les paramètres de l'entreprise (dont la TVA), les services et les affectations.
  - Le Manager promeut uniquement un Salarié en Manager, modifie la description de l'entreprise et gère les affectations de ses Salariés.
  - Le Salarié est en lecture seule sur l'entreprise; son service est fixé par un supérieur.
- Services/départements: création, renommage et suppression réservés au CEO. Fiches membres regroupées par service avec coordonnées complètes.
- Profil: prénom, nom, e-mail et téléphone modifiables; service en lecture seule avec demande de changement validée par le supérieur hiérarchique.
- Projets: CRUD; les projets créés par un Salarié portent le badge « En attente de validation par un manager / CEO » et sont validés par un Manager ou le CEO.
- Tâches: CRUD, assignation à un utilisateur, statut, priorité, échéance, visualisation Kanban.
- Clients: fiche contact complète (entreprise, nom du contact obligatoire, fonction, téléphone, e-mail, adresse).
- Facturation: TVA globale de l'entreprise configurable par le CEO, tri (client, date, montant) et filtres (client, statut), validation par Manager/CEO.
- Fonctionnalités supplémentaires: recherche globale, indicateurs d'échéance/dashboard.

## Utilisation rapide

1. Lancer `docker compose up -d --build`.
2. Ouvrir http://localhost:3000.
3. Créer un compte.
4. Dans l'onboarding, créer une entreprise (vous devenez CEO) ou demander à rejoindre une entreprise existante (statut `pending_approval`, approbation par le CEO).
5. Une fois actif dans une entreprise, accéder aux projets, tâches, Kanban, membres, clients et facturation.

## Isolation multi-tenant

- L'identité et `companyId` proviennent du token JWT (`requireAuth`).
- Les routes métier filtrent systématiquement par `companyId`; les permissions sont appliquées côté serveur.
- La suppression d'entreprise (créateur CEO uniquement) supprime en cascade utilisateurs, projets, tâches, clients, factures et services liés à cette entreprise.
- Une migration idempotente (`server/migrate.js`) convertit les anciens rôles (`admin` → `ceo`, `member` → `employee`) et initialise les nouveaux champs au démarrage.

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
