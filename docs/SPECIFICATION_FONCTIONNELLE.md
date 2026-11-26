# Spécification Fonctionnelle - AgencyOS (TD1 Partie I)

## 1. Objectif

AgencyOS est un outil SaaS de gestion de projet multi-entreprises. Il permet de gérer des entreprises, utilisateurs, services, projets, tâches, clients et factures avec isolation stricte des données par entreprise.

## 2. Rôles

Trois rôles existent : **CEO** (`ceo`), **Manager** (`manager`) et **Salarié** (`employee`).

- **CEO** : contrôle total sur son entreprise. Il modifie tous les paramètres (nom, description, offre, **TVA**), crée/modifie/supprime les services, modifie tous les rôles **sauf le sien**, gère toutes les affectations et traite toutes les demandes de changement de service. Il est le seul à pouvoir approuver/refuser les demandes d'adhésion et à supprimer l'entreprise (en tant que créateur).
- **Manager** : modifie uniquement la **description** de l'entreprise. Il peut promouvoir un **Salarié en Manager** (et uniquement cela), fixer le service et le poste de ses Salariés, renseigner son propre service managé, et approuver les demandes de changement de service de ses Salariés.
- **Salarié** : lecture seule sur l'entreprise. Son service et son poste sont fixés par un Manager ou le CEO. Il crée des projets et des factures, qui restent « en attente de validation par un manager / CEO ».

Règles de rôles appliquées côté serveur :

- **Un seul CEO par entreprise** : le créateur reste CEO; les anciens administrateurs non créateurs deviennent Managers. Le rôle du CEO ne peut jamais être modifié, y compris par lui-même.
- Un utilisateur ne peut pas modifier son propre rôle.
- Le Manager ne peut pas rétrograder un Manager ni nommer un CEO.
- **Suppression d'utilisateur** : uniquement par l'utilisateur lui-même.
- **Suppression d'entreprise** : uniquement par son créateur (CEO), avec suppression en cascade.
- **Un utilisateur = une entreprise** : un compte ne peut appartenir qu'à une seule entreprise; le parcours « rejoindre » crée un compte en attente d'approbation.

## 3. Fonctionnalités

### 3.1 Authentification et onboarding

- Inscription avec prénom, nom, email, mot de passe; le nouveau compte est `employee` sans entreprise.
- Connexion par email/mot de passe (JWT, durée 7 jours).
- **Création d'entreprise centralisée dans l'onboarding** : le formulaire est centré dans la page, l'utilisateur devient CEO et accède immédiatement au tableau de bord. Aucun formulaire de création dans l'onglet Entreprises.
- Demande d'adhésion à une entreprise existante depuis l'onboarding : le compte passe en `pending_approval` et attend l'approbation du CEO. Un refus remet le compte sans entreprise.

### 3.2 Entreprises et services

- Onglet Entreprises : consultation pour tous; modification réservée au CEO (tous les champs, dont la TVA) et au Manager (description uniquement); lecture seule pour le Salarié.
- Suppression par le créateur CEO uniquement, avec suppression en cascade des projets, tâches, clients, factures, services et membres.
- Services / départements : création, renommage et suppression par le CEO uniquement. La suppression d'un service retire l'affectation des membres concernés. Un service « CEO » est créé avec l'entreprise et le créateur y est affecté ; ce service ne peut être ni renommé ni supprimé tant que le CEO y est affecté.
- La **TVA est globale** : définie par le CEO dans les paramètres de l'entreprise, utilisée pour calculer le TTC de toutes les factures créées ensuite.

### 3.3 Profil et fiches membres

- Page Profil (`/profile`) : prénom, nom, e-mail et téléphone modifiables; service et service managé affichés **en lecture seule**. Le bouton « Supprimer mon compte » se trouve ici (et non plus dans la page Membres).
- Bouton « Demander un changement » : le Salarié/Manager choisit un service; la demande est validée (ou refusée) par son supérieur hiérarchique (Manager pour un Salarié, CEO pour tous). Une demande en attente peut être annulée par l'intéressé.
- Page Membres : fiches regroupées par **département**, affichant prénom, nom, poste et département. Libellé compact : « Prénom I. - Nom du service » pour un Salarié, « Prénom I. - Manager - Nom du service » pour un Manager. Le sous-titre évite le doublon « CEO · CEO » : le CEO du service « CEO » affiche simplement « CEO ».
- Bouton « Voir plus » présent sur chaque fiche, pour tous les rôles : détails complets (e-mail, téléphone, poste, service, service managé) et, selon les permissions, affectation (service, poste, service managé).

### 3.4 Projets et tâches

- Tout membre actif, y compris le Salarié, peut créer un projet.
- Les projets créés par un Salarié portent, à côté de leur nom, le badge « En attente de validation par un manager / CEO » jusqu'à validation par un Manager ou le CEO.
- Tâches : CRUD, assignation à un utilisateur, statut, priorité, échéance, visualisation Kanban.

### 3.5 Clients

- Fiche contact complète : entreprise (obligatoire), **nom du contact (obligatoire)**, fonction du contact, téléphone du contact, e-mail et adresse.
- Création, modification, suppression et fiche détaillée avec statistiques de facturation (en attente, payé, en retard).

### 3.6 Facturation

- TVA globale de l'entreprise (modifiable par le CEO uniquement), appliquée à la création des factures.
- Création d'une facture par n'importe quel membre actif; validation par un Manager ou le CEO pour les factures créées par un Salarié.
- Tri possible par : client A→Z, date récente→ancienne, date ancienne→récente, montant croissant, montant décroissant.
- Filtres : client et statut de paiement.
- Les totaux affichés (HT, TTC, nombre de factures) portent sur **toutes** les factures, indépendamment des filtres actifs.

### 3.7 Compléments

- Recherche globale et indicateurs du dashboard (activité, échéances, facturation).

## 4. Isolation multi-tenant

- Chaque document métier contient `companyId`.
- L'API applique le filtre `companyId` issu du JWT et vérifie les permissions côté serveur.
- Aucune donnée d'une entreprise n'est accessible depuis une autre entreprise.

## 5. Contraintes techniques respectées

- MongoDB comme base de données.
- Application et base démarrables via Docker Compose.
- Connexion MongoDB configurable par variable d'environnement (`MONGODB_URI`) sans modification du code, pour préparer réplication/sharding.
- Démarrage attendu : `docker compose up -d --build` depuis la racine du dépôt (le fichier `compose.yml` s'y trouve, à côté de `Dockerfile`).
