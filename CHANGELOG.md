# Changelog - Service d'Authentification

Toutes les modifications notables du service d'authentification seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Configuration du système de versioning automatique
- Scripts npm pour la gestion des versions
- Documentation CHANGELOG

### Modifié
- Amélioration de la structure du projet

## [1.0.0] - 2025-07-24

### Ajouté
- **Authentification JWT** : Génération et validation des tokens
- **Inscription utilisateur** : Création de comptes avec validation
- **Connexion utilisateur** : Authentification avec email/mot de passe
- **Authentification Google OAuth** : Connexion via Google
- **Middleware d'authentification** : Protection des routes
- **Gestion des profils** : Récupération et mise à jour des données utilisateur
- **Validation des données** : Contrôles de sécurité sur les entrées
- **Logging** : Système de logs avec Winston
- **Métriques** : Monitoring avec Prometheus
- **Tests unitaires** : Couverture des fonctionnalités principales
- **Sécurité** : Hashage des mots de passe avec bcrypt
- **CORS** : Configuration pour les requêtes cross-origin
- **Variables d'environnement** : Configuration flexible

### Fonctionnalités principales
- **Endpoints d'authentification**
  - `POST /api/auth/register` - Inscription
  - `POST /api/auth/login` - Connexion
  - `GET /api/auth/me` - Profil utilisateur
  - `POST /api/auth/logout` - Déconnexion
  
- **Endpoints Google OAuth**
  - `GET /api/google/google` - Initiation OAuth
  - `POST /api/google/complete-profile` - Finalisation du profil
  
- **Endpoints utilisateur**
  - `GET /api/user/profile` - Récupération du profil
  - `PUT /api/user/profile` - Mise à jour du profil

### Architecture
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : JWT + Passport.js
- **Structure MVC** : Controllers, Models, Routes séparés
- **Middleware** : Authentification, logging, métriques
- **Configuration** : Variables d'environnement centralisées

### Sécurité
- Hashage des mots de passe (bcrypt)
- Tokens JWT sécurisés
- Validation des entrées utilisateur
- Protection CORS configurée
- Sessions sécurisées

---

## Format des versions

- **MAJOR** : Changements incompatibles de l'API
- **MINOR** : Ajout de fonctionnalités rétrocompatibles  
- **PATCH** : Corrections de bugs rétrocompatibles

### Types de modifications
- `Ajouté` : nouvelles fonctionnalités
- `Modifié` : changements dans les fonctionnalités existantes
- `Déprécié` : fonctionnalités bientôt supprimées
- `Supprimé` : fonctionnalités supprimées
- `Corrigé` : corrections de bugs
- `Sécurité` : vulnérabilités corrigées
