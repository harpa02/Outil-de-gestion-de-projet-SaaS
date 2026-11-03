# Spécification Technique — SaaS Project Manager (Partie I)

## 1. Vue d'ensemble de l'Architecture

L'application **SaaS Project Manager** est une solution multi-entreprises (multi-tenant) basée sur une architecture logicielle isolée :
- **Frontend** : Application Single Page (SPA) développée en React 19 et Vite 8, stylisée en CSS moderne et responsive, servie de manière statique en production par Node.js.
- **Backend API** : Node.js avec Express 5 exposant une API RESTful avec middleware d'isolation multi-tenant obligatoire (`requireCompany`).
- **Base de données** : MongoDB 7 configurée via le driver natif `mongodb` officiel (sans ORM/ODM lourd pour un contrôle maximal des index et requêtes).
- **Conteneurisation** : Orchestrée via Docker Compose (`compose.yml`), intégrant MongoDB et l'application dans un réseau isolé avec healthcheck.

---

## 2. Modèle d'Isolation Multi-Tenant

L'isolation logicielle stricte est garantie au niveau applicatif et au niveau de la persistance :
1. Chaque requête cliente vers les ressources privées (`/api/users`, `/api/projects`, `/api/tasks`) transmet l'identifiant de l'entreprise via le header HTTP `X-Company-Id`.
2. Le middleware `requireCompany` valide systématiquement :
   - La présence de l'identifiant.
   - La conformité au format BSON `ObjectId`.
   - L'existence de l'entreprise dans la collection `companies`.
3. Chaque collection métier (`users`, `projects`, `tasks`) contient obligatoirement le champ discriminant `companyId: ObjectId(...)`.
4. Toutes les requêtes en lecture, écriture et suppression filtrent obligatoirement par `{ companyId: req.companyId }`.
5. La suppression d'une entreprise entraîne une suppression en cascade automatique de ses utilisateurs, projets et tâches.

---

## 3. Préparation à la Montée en Charge et au Sharding (Partie II)

Conformément aux exigences du sujet pour l'évolution vers un cluster distribué avec réplication et sharding :
- **Connexion configurable sans modification de code** : L'URL de connexion est pilotée exclusivement par la variable d'environnement `MONGODB_URI` déclarée dans `compose.yml` (ex: `mongodb://mongodb:27017/saas_pm` en standalone, ou chaîne de connexion Replica Set / mongos pour le sharding).
- **Clé de partitionnement (Shard Key)** : Le champ `companyId` est intégré dans tous les index composites. Dans un cluster sharder, `companyId` (ou un couple `{ companyId: 1, _id: 1 }`) sera utilisé comme Shard Key pour assurer la co-localisation des données d'une même entreprise sur le même shard (évite les requêtes cross-shard coûteuses et garantit l'étanchéité physique/logique).

### Index créés automatiquement au démarrage (`server/db.js`) :
```javascript
// Entreprises
companies.createIndex({ slug: 1 }, { unique: true })

// Utilisateurs : unicité de l'email au sein de l'entreprise + recherche par tenant
users.createIndex({ companyId: 1, email: 1 }, { unique: true })
users.createIndex({ companyId: 1 })

// Projets : recherche par tenant et tri chronologique / statut
projects.createIndex({ companyId: 1, createdAt: -1 })
projects.createIndex({ companyId: 1, status: 1 })

// Tâches : requêtes Kanban optimisées et filtres par assigné / projet
tasks.createIndex({ companyId: 1, projectId: 1, status: 1 })
tasks.createIndex({ companyId: 1, assignedUserId: 1 })
tasks.createIndex({ companyId: 1, status: 1 })
```

---

## 4. Structures de Données JSON (Schémas BSON)

### 4.1. Collection `companies`
Représente les entreprises clientes du SaaS.

```json
{
  "_id": { "$oid": "6aea1f4e00295fe861675581" },
  "name": "Acme Innovation SaaS",
  "slug": "acme-innovation",
  "description": "Startup spécialisée dans les solutions Cloud & SaaS B2B.",
  "plan": "Enterprise",
  "createdAt": { "$date": "2026-11-03T17:52:14.576Z" },
  "updatedAt": { "$date": "2026-11-03T17:52:14.576Z" }
}
```

### 4.2. Collection `users`
Représente les collaborateurs rattachés à une entreprise.

```json
{
  "_id": { "$oid": "6aea1f4e00295fe861675583" },
  "companyId": { "$oid": "6aea1f4e00295fe861675581" },
  "name": "Alice Martin",
  "email": "alice@acme.com",
  "role": "admin",
  "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Alice%20Martin",
  "createdAt": { "$date": "2026-11-03T17:52:14.580Z" },
  "updatedAt": { "$date": "2026-11-03T17:52:14.580Z" }
}
```

### 4.3. Collection `projects`
Représente les projets d'une entreprise avec liste des membres associés.

```json
{
  "_id": { "$oid": "6aea1f4e00295fe861675588" },
  "companyId": { "$oid": "6aea1f4e00295fe861675581" },
  "name": "Refonte Plateforme Web v2",
  "description": "Migration complète vers architecture micro-services et nouveau tableau de bord.",
  "status": "in_progress",
  "memberIds": [
    { "$oid": "6aea1f4e00295fe861675583" },
    { "$oid": "6aea1f4e00295fe861675584" }
  ],
  "createdAt": { "$date": "2026-11-03T17:52:14.585Z" },
  "updatedAt": { "$date": "2026-11-03T17:52:14.585Z" }
}
```

### 4.4. Collection `tasks`
Représente les tâches au sein d'un projet, visualisables sur le Kanban.

```json
{
  "_id": { "$oid": "6aea1f4e00295fe86167558b" },
  "companyId": { "$oid": "6aea1f4e00295fe861675581" },
  "projectId": { "$oid": "6aea1f4e00295fe861675588" },
  "title": "Implémentation du Tableau Kanban interactif",
  "description": "Permettre le drag & drop ou le déplacement direct des tâches entre colonnes de statut.",
  "status": "in_progress",
  "priority": "urgent",
  "assignedUserId": { "$oid": "6aea1f4e00295fe861675584" },
  "dueDate": { "$date": "2026-11-07T17:52:14.588Z" },
  "createdAt": { "$date": "2026-11-03T17:52:14.588Z" },
  "updatedAt": { "$date": "2026-11-03T17:52:14.588Z" }
}
```

---

## 5. Endpoints de l'API REST

| Méthode | Route | Description | Header Requis |
|---------|-------|-------------|---------------|
| `GET` | `/api/health` | Vérification de santé (status app & Mongo) | Aucun |
| `GET` | `/api/companies` | Liste des entreprises avec compteurs | Aucun |
| `POST` | `/api/companies` | Créer une entreprise | Aucun |
| `PUT` | `/api/companies/:id` | Modifier une entreprise | Aucun |
| `DELETE` | `/api/companies/:id` | Supprimer entreprise + cascade | Aucun |
| `GET` | `/api/users` | Liste des utilisateurs du tenant | `X-Company-Id` |
| `POST` | `/api/users` | Créer un utilisateur pour le tenant | `X-Company-Id` |
| `PUT` | `/api/users/:id` | Modifier un utilisateur | `X-Company-Id` |
| `DELETE` | `/api/users/:id` | Supprimer un utilisateur | `X-Company-Id` |
| `GET` | `/api/projects` | Liste des projets enrichis (progression) | `X-Company-Id` |
| `POST` | `/api/projects` | Créer un projet avec membres | `X-Company-Id` |
| `PUT` | `/api/projects/:id` | Modifier un projet | `X-Company-Id` |
| `DELETE` | `/api/projects/:id` | Supprimer projet + ses tâches | `X-Company-Id` |
| `GET` | `/api/tasks` | Liste des tâches (filtres statut, projet, user) | `X-Company-Id` |
| `POST` | `/api/tasks` | Créer une tâche | `X-Company-Id` |
| `PATCH` | `/api/tasks/:id/status` | Changer le statut d'une tâche (Kanban) | `X-Company-Id` |
| `PUT` | `/api/tasks/:id` | Modifier une tâche | `X-Company-Id` |
| `DELETE` | `/api/tasks/:id` | Supprimer une tâche | `X-Company-Id` |
