# Spécification Fonctionnelle - AgencyOS (TD1 Partie I)

## 1. Objectif

AgencyOS est un outil SaaS de gestion de projet multi-entreprises. Il permet de gérer des entreprises, utilisateurs, projets et tâches avec isolation stricte des données par entreprise.

## 2. Rôles

- **Administrateur (`admin`)**: gestion des membres, approbation des demandes d'adhésion, gestion des projets/tâches, changement de rôles.
- **Manager (`manager`)**: gestion opérationnelle des projets/tâches et visibilité membres selon permissions.
- **Membre (`member`)**: accès aux projets/tâches de son entreprise, mise à jour de ses informations.

Règles demandées:
- **Suppression d'utilisateur**: uniquement par l'utilisateur lui-même.
- **Suppression/modification d'entreprise**: uniquement par le créateur de l'entreprise.

## 3. Fonctionnalités

### 3.1 Authentification et onboarding
- Inscription avec prénom, nom, email, mot de passe.
- Connexion par email/mot de passe.
- Après connexion: création d'entreprise ou demande d'adhésion à une entreprise existante.
- Une demande d'adhésion passe en attente jusqu'à validation admin.

### 3.2 Entreprises
- Créer une entreprise.
- Modifier une entreprise (créateur uniquement).
- Supprimer une entreprise (créateur uniquement), avec suppression en cascade des données associées.
- Isolation stricte: un utilisateur n'accède qu'aux données de son entreprise.

### 3.3 Utilisateurs
- Liste des membres de l'entreprise.
- Approbation/refus des demandes d'adhésion (admin).
- Modification du profil.
- Modification de rôle (admin, selon règles).
- Suppression du compte: action disponible uniquement sur son propre compte.

### 3.4 Projets
- Créer, modifier, supprimer un projet.
- Assigner des utilisateurs à un projet (`memberIds`).
- Statut de projet et suivi de progression.

### 3.5 Tâches et Kanban
- Créer, modifier, supprimer une tâche dans un projet.
- Assigner une tâche à un utilisateur.
- Définir statut, priorité, échéance.
- Visualiser et déplacer les tâches dans un tableau Kanban (Todo, In progress, Review, Done).

### 3.6 Fonctionnalités complémentaires
- Gestion clients et facturation.
- Recherche globale.
- Indicateurs dashboard (activité, échéances, facturation).

## 4. Isolation multi-tenant

- Chaque document métier contient `companyId`.
- L'API applique le filtre `companyId` issu du JWT.
- Aucune donnée d'une entreprise n'est accessible depuis une autre entreprise.

## 5. Contraintes techniques respectées

- MongoDB comme base de données.
- Application et base démarrables via Docker Compose.
- Connexion MongoDB configurable par variable d'environnement (`MONGODB_URI`) sans modification du code, pour préparer réplication/sharding.
- Démarrage attendu: `docker compose up -d --build`.
