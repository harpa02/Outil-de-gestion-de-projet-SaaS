# Spécification Technique - AgencyOS (TD1 Partie I)

## 1. Architecture

- **Frontend**: React 19, Vite 8, React Router, SPA servie par Express en production.
- **Backend**: Node.js, Express 5, API REST JSON.
- **Base de données**: MongoDB 7, driver officiel `mongodb`.
- **Conteneurisation**: Docker Compose avec services `mongodb` et `app`.
- **Authentification**: JWT Bearer, mot de passe hashé avec `bcrypt`.

## 2. Configuration et évolutivité (Partie II)

La connexion MongoDB est configurable sans modification du code:

- `MONGODB_URI` dans `compose.yml` / `.env`.
- `server/db.js` lit `process.env.MONGODB_URI`.

Exemples:

```env
# Standalone
MONGODB_URI=mongodb://mongodb:27017/saas_pm

# Replica set / sharding (Partie II)
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/saas_pm?replicaSet=rs0
```

Le champ `companyId` est présent dans les collections métier et indexé pour préparer la co-localisation/sharding par entreprise.

## 3. Isolation multi-tenant

- Middleware `requireAuth` vérifie le JWT, charge l'utilisateur et injecte `req.user` et `req.companyId`.
- Les routes métier filtrent par `req.companyId`.
- Les routes de création/lecture/édition/suppression utilisent `companyId` dans les filtres MongoDB.
- La suppression d'une entreprise supprime en cascade ses données liées.

## 4. Structures JSON (MongoDB)

### 4.1 companies

```json
{
  "_id": { "$oid": "..." },
  "name": "Acme Innovation",
  "slug": "acme-innovation",
  "description": "Entreprise de services numériques",
  "plan": "Pro",
  "createdBy": { "$oid": "..." },
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

### 4.2 users

```json
{
  "_id": { "$oid": "..." },
  "firstName": "Alice",
  "lastName": "Martin",
  "email": "alice@acme.com",
  "password": "<bcrypt hash>",
  "role": "admin",
  "status": "active",
  "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Alice%20Martin",
  "companyId": { "$oid": "..." },
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

`status`: `active | pending_approval | rejected`.  
`role`: `admin | manager | member`.

### 4.3 projects

```json
{
  "_id": { "$oid": "..." },
  "companyId": { "$oid": "..." },
  "name": "Refonte site",
  "description": "Nouveau site vitrine",
  "status": "in_progress",
  "memberIds": [{ "$oid": "..." }],
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

### 4.4 tasks

```json
{
  "_id": { "$oid": "..." },
  "companyId": { "$oid": "..." },
  "projectId": { "$oid": "..." },
  "title": "Maquette page accueil",
  "description": "Créer la maquette desktop/mobile",
  "status": "todo",
  "priority": "high",
  "assignedUserId": { "$oid": "..." },
  "dueDate": { "$date": "2026-01-15T00:00:00.000Z" },
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

`status`: `todo | in_progress | review | done`.

## 5. Index MongoDB

Créés au démarrage dans `server/db.js`:

```js
companies.createIndex({ slug: 1 }, { unique: true })
users.createIndex({ companyId: 1, email: 1 }, { unique: true })
users.createIndex({ email: 1 }, { unique: true })
projects.createIndex({ companyId: 1, createdAt: -1 })
projects.createIndex({ companyId: 1, status: 1 })
tasks.createIndex({ companyId: 1, projectId: 1, status: 1 })
tasks.createIndex({ companyId: 1, assignedUserId: 1 })
tasks.createIndex({ companyId: 1, status: 1 })
```

## 6. API principale

### Auth
- `POST /api/auth/register` - Créer un compte utilisateur
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil connecté

### Companies
- `GET /api/companies` - Lister entreprises
- `POST /api/companies` - Créer entreprise (créateur = admin)
- `POST /api/companies/join/:id` - Demande d'adhésion
- `PUT /api/companies/:id` - Modifier (créateur uniquement)
- `DELETE /api/companies/:id` - Supprimer (créateur uniquement, cascade)
- `GET /api/companies/members` - Membres/pending (admin/manager)
- `PATCH /api/companies/members/:id/approve` - Approuver (admin)
- `DELETE /api/companies/members/:id/reject` - Refuser (admin)
- `PATCH /api/companies/members/:id/role` - Modifier rôle (admin)

### Users
- `GET /api/users` - Lister membres de l'entreprise
- `GET /api/users/:id` - Détail
- `PUT /api/users/:id` - Modifier (soi-même/admin selon champs)
- `DELETE /api/users/:id` - Supprimer **son propre compte uniquement**

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`

## 7. Docker

- `compose.yml`: MongoDB 7 + app Node.
- `Dockerfile`: build Vite puis image runtime Node.
- Healthcheck MongoDB avant démarrage app.
- Démarrage: `docker compose up -d --build`.
