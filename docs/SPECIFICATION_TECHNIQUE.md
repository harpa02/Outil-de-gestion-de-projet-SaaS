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
- Les permissions (rôles, paramètres entreprise, services, affectations) sont appliquées côté serveur, pas seulement dans l'interface.
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
  "vatRate": 20,
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
  "passwordHash": "<bcrypt hash>",
  "role": "ceo",
  "status": "active",
  "phone": "06 00 00 00 00",
  "jobTitle": "CEO",
  "departmentId": { "$oid": "..." }, // service « CEO » de l'entreprise
  "managedDepartmentId": null,
  "departmentChangeRequest": null,
  "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Alice%20Martin",
  "companyId": { "$oid": "..." },
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

`status`: `active | pending_approval | rejected`.  
`role`: `ceo | manager | employee` (un seul CEO par entreprise, rôle intouchable).  
`departmentChangeRequest`: `{ departmentId, departmentName, requestedAt, status: 'pending' }` ou `null`.

### 4.3 departments

```json
{
  "_id": { "$oid": "..." },
  "companyId": { "$oid": "..." },
  "name": "Marketing",
  "createdBy": { "$oid": "..." },
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

### 4.4 projects

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

### 4.5 tasks

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

### 4.6 clients

```json
{
  "_id": { "$oid": "..." },
  "companyId": { "$oid": "..." },
  "companyName": "Client SAS",
  "contactName": "Jean Dupont",
  "contactRole": "Directeur achats",
  "contactPhone": "06 00 00 00 00",
  "email": "jean@client.fr",
  "address": "10 rue de Paris",
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

`contactName` est obligatoire à la création et à la modification.

### 4.7 invoices

```json
{
  "_id": { "$oid": "..." },
  "companyId": { "$oid": "..." },
  "clientId": { "$oid": "..." },
  "clientName": "Client SAS",
  "ref": "FAC-2026-001",
  "amountHT": 1000,
  "vatRate": 20,
  "vatAmount": 200,
  "totalTTC": 1200,
  "status": "pending",
  "approvalStatus": "pending",
  "date": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

`vatRate` est copié depuis `companies.vatRate` au moment de la création; les factures existantes conservent leur TVA d'origine.

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
departments.createIndex({ companyId: 1, name: 1 })
clients.createIndex({ companyId: 1, createdAt: -1 })
invoices.createIndex({ companyId: 1, date: -1 })
```

## 6. API principale

### Auth
- `POST /api/auth/register` - Créer un compte utilisateur
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil connecté

### Companies
- `GET /api/companies` - Lister entreprises
- `POST /api/companies` - Créer entreprise depuis l'onboarding (créateur = CEO)
- `POST /api/companies/join/:id` - Demande d'adhésion (une seule entreprise par compte)
- `PUT /api/companies/:id` - Modifier (CEO : tous les champs dont TVA ; Manager : description)
- `DELETE /api/companies/:id` - Supprimer (créateur CEO uniquement, cascade)
- `GET /api/companies/members` - Membres/pending (CEO/Manager)
- `PATCH /api/companies/members/:id/approve` - Approuver une adhésion (CEO)
- `DELETE /api/companies/members/:id/reject` - Refuser une adhésion (CEO)
- `PATCH /api/companies/members/:id/role` - Modifier rôle (matrice CEO/Manager, CEO intouchable)
- `PATCH /api/companies/members/:id/assignment` - Service, poste, service managé (CEO/Manager)
- `PATCH /api/companies/members/:id/department-request` - Traiter une demande de service (supérieur hiérarchique)

### Departments
- `GET /api/departments` - Lister les services de l'entreprise
- `POST /api/departments` - Créer un service (CEO)
- `PUT /api/departments/:id` - Renommer un service (CEO, sauf service CEO assigné)
- `DELETE /api/departments/:id` - Supprimer un service (CEO, sauf service CEO assigné)

### Users
- `GET /api/users` - Lister membres de l'entreprise
- `GET /api/users/:id` - Détail
- `PUT /api/users/:id` - Modifier son propre profil (dont `phone`)
- `PATCH /api/users/:id/department-request` - Demander/annuler un changement de service
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

### Clients et factures
- `GET /api/clients`, `POST /api/clients`, `PUT /api/clients/:id`, `DELETE /api/clients/:id`
- `GET /api/invoices`, `POST /api/invoices` (TVA globale de l'entreprise)
- `PATCH /api/invoices/:id/approve` (CEO/Manager)
- `PATCH /api/invoices/:id/status`, `DELETE /api/invoices/:id`

## 7. Migration des données

`server/migrate.js` est exécuté au démarrage avant le seed. Il est idempotent et :

- convertit `admin` → `ceo` et `member` → `employee`;
- garantit un seul CEO par entreprise (créateur conservé, autres admins → `manager`);
- crée (si absent) le service « CEO » et y affecte le CEO (`jobTitle: "CEO"`);
- initialise `phone`, `jobTitle`, `departmentId`, `managedDepartmentId`, `departmentChangeRequest` et `vatRate` (20 %) pour les documents existants.

## 8. Docker

- `compose.yml` et `Dockerfile` sont à la **racine du dépôt Git**.
- `compose.yml`: MongoDB 7 + app Node.
- `Dockerfile`: build Vite puis image runtime Node.
- Healthcheck MongoDB avant démarrage app.
- Démarrage depuis la racine du dépôt: `docker compose up -d --build`.
