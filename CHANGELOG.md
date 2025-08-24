# Changelog - Service d'Authentification

Toutes les modifications notables du service d'authentification seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Ajout d’un logger avancé pour le debug
- Ajout de la gestion des variables d’environnement (`.env`) améliorée
- Ajout de tests supplémentaires pour stabiliser le code

### Modifié
- Amélioration du workflow CI/CD avec GitHub Actions
- Ajustements pour la branche `staging`

---

## [1.1.0] - 2025-01-24

### Ajouté
- Configuration du système de versioning automatique
- Scripts npm pour la gestion des versions (`patch`, `minor`, `major`)
- Workflow GitHub Actions pour les releases automatiques
- Documentation CHANGELOG complète
- Configuration de Dependabot pour mises à jour automatiques

### Modifié
- Migration d'Express de `4.21.2` à `5.1.0`
- Mise à jour de `bcryptjs` vers `3.0.2`
- Mise à jour de `axios` vers `1.11.0`
- Mise à jour de `dotenv` vers `17.2.1`
- Mise à jour de `mongoose` vers `8.18.0`

### Sécurité
- Mise à jour des dépendances critiques pour corriger des vulnérabilités
- Amélioration du hachage des mots de passe

---

## [1.0.0] - 2024-07-10

### Ajouté
- Authentification JWT (génération et validation des tokens)
- Inscription et connexion des utilisateurs
- Système de métriques Prometheus
- Tests unitaires initiaux
- Logging avancé avec Winston
- Configuration des variables d'environnement

---

## [0.1.0] - 2024-06-17

### Ajouté
- Commit initial avec structure Express.js
- Routes d’authentification de base
- MongoDB + Mongoose
- Gestion des profils utilisateur
- Authentification Google OAuth
