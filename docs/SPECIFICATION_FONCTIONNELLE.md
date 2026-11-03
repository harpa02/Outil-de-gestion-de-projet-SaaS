# Spécification Fonctionnelle — SaaS Project Manager (Partie I)

## 1. Contexte du Projet

Dans le cadre du lancement d'une startup SaaS B2B, l'outil **SaaS Project Manager** a été conçu pour répondre aux besoins d'organisation et de collaboration des entreprises modernes, inspiré des standards du marché (Trello, Notion, ClickUp).

L'application permet à différentes entreprises d'héberger leurs projets et de gérer le cycle de vie de leurs tâches au sein d'un environnement unifié, tout en garantissant une étanchéité logicielle absolue entre organisations clientes.

---

## 2. Rôles et Acteurs

Au sein d'une entreprise donnée, trois niveaux de rôles sont disponibles :
- **Administrateur (`admin`)** : Contrôle complet de l'espace de travail, gestion des membres, suppression et configuration des projets.
- **Manager (`manager`)** : Création et modification des projets, attribution des membres, supervision des tâches et des priorités.
- **Membre (`member`)** : Consultation des projets auxquels il est assigné, création et mise à jour de ses tâches, modification de l'état des tâches sur le Kanban.

---

## 3. Matrice des Fonctionnalités

### 3.1. Gestion des Entreprises (Multi-Tenancy)
- **Création d'une entreprise** : Formulaire comprenant le nom, un identifiant URL unique (slug automatique), une description et le choix d'un plan commercial (`Starter`, `Pro`, `Enterprise`).
- **Isolation stricte** : Aucune donnée (collaborateurs, projets, tâches) n'est partagée ni visible entre deux entreprises différentes.
- **Sélection d'espace & portail d'authentification** : L'utilisateur sélectionne son entreprise, puis choisit son profil ou crée immédiatement un premier compte administrateur.
- **Suppression d'entreprise en cascade** : La suppression d'une entreprise entraîne automatiquement et proprement la suppression de tous ses membres, projets et tâches associées.

### 3.2. Gestion des Collaborateurs (Utilisateurs)
- **Ajout d'un collaborateur** : Définition du nom complet, de l'adresse email professionnelle et du rôle. Un avatar unique est automatiquement généré à partir des initiales.
- **Contrôle d'unicité** : L'email doit être unique au sein de l'entreprise.
- **Modification & Suppression** : Possibilité de modifier les coordonnées et rôles. La suppression d'un membre désassigne automatiquement ses tâches en cours et le retire des projets sans corrompre les données.

### 3.3. Gestion des Projets
- **Création de projet** : Titre, description détaillée, statut initial (`Planification`, `En cours`, `Terminé`, `Archivé`) et assignation de membres d'équipe de l'entreprise.
- **Indicateur de progression temps réel** : Calcul automatique du pourcentage d'avancement selon le ratio de tâches complétées (`status === 'done'`).
- **Suppression de projet** : La suppression d'un projet entraîne la suppression de toutes les tâches qui y sont rattachées.

### 3.4. Gestion des Tâches & Tableau Kanban
- **Visualisation Kanban en 4 colonnes** :
  1. **À faire** (`todo`)
  2. **En cours** (`in_progress`)
  3. **En revue** (`review`)
  4. **Terminé** (`done`)
- **Filtres et recherche** : Filtrage par projet ou affichage global de toutes les tâches de l'entreprise.
- **Cartes de tâches enrichies** :
  - Titre et description.
  - Badge de priorité coloré (`Bas`, `Moyen`, `Élevé`, `Urgent`).
  - Badge du projet d'appartenance.
  - Date d'échéance avec mise en évidence visuelle des retards.
  - Avatar de l'utilisateur assigné.
  - Sélecteur de transition rapide de statut.
- **Actions rapides** : Bouton d'ajout direct dans chaque colonne Kanban pour un flux de travail rapide.

### 3.5. Tableau de Bord Analytique (Dashboard)
- Synthèse des indicateurs clés pour l'entreprise connectée :
  - Taux global de complétion des tâches.
  - Nombre de projets actifs.
  - Nombre de tâches en cours, en revue et terminées.
  - Effectif de l'équipe.
- Liste des tâches urgentes nécessitant une attention immédiate.
- Liste des projets récents avec barres de progression interactives.

---

## 4. Données de Démonstration (Seed Automatique)

Pour faciliter l'évaluation immédiate du projet dès l'exécution de `docker compose up -d --build`, deux entreprises complètes sont automatiquement injectées si la base est vide :
1. **Acme Innovation SaaS** (Plan Enterprise, 3 membres, 2 projets, 5 tâches).
2. **Nova Studio Digital** (Plan Pro, 2 membres, 1 projet, 1 tâche).

Cela permet de tester immédiatement l'étanchéité : en se connectant sur Nova Studio, aucune donnée d'Acme Innovation n'est accessible.
