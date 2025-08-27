# Service d'Authentification

## 📋 Description

Microservice d'authentification et de gestion des utilisateurs pour la plateforme éducative. Gère l'authentification locale, Google OAuth, les sessions utilisateur et la sécurité des accès.

## 🏗️ Architecture

- **Type** : Microservice Node.js
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : Passport.js + JWT
- **OAuth** : Google OAuth 2.0
- **Sessions** : Express-session + Redis (optionnel)
- **API** : REST API Express.js

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 16+
- MongoDB 5+
- npm ou yarn
- Compte Google Developer (pour OAuth)

### Installation
```bash
# Cloner le repository
git clone [url-du-repo]

# Installer les dépendances
cd autenthication-service-NegYanis16
npm install

# Configuration des variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres
```

### Variables d'environnement
```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/auth_service
MONGODB_URI_TEST=mongodb://localhost:27017/auth_service_test

# Sécurité
JWT_SECRET=votre_secret_jwt_super_securise
SESSION_SECRET=votre_secret_session_super_securise

# Google OAuth
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_CALLBACK_URL=http://localhost:3002/auth/google/callback

# Serveur
PORT=3002
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Démarrage
```bash
# Mode développement
npm run dev

# Mode production
npm start

# Tests
npm test
```

## 🔐 Fonctionnalités d'Authentification

### Authentification Locale
- **Inscription** : Création de compte avec validation
- **Connexion** : Authentification par email/mot de passe
- **Mot de passe oublié** : Réinitialisation sécurisée
- **Validation email** : Confirmation de compte

### OAuth Google
- **Connexion Google** : Authentification via Google
- **Fusion de comptes** : Lien avec compte local
- **Profil Google** : Récupération des informations

### Gestion des Sessions
- **JWT Tokens** : Tokens d'accès sécurisés
- **Refresh Tokens** : Renouvellement automatique
- **Sessions Express** : Gestion des sessions serveur
- **Déconnexion** : Invalidation des tokens

## 🔌 API Endpoints

### Authentification
- `POST /auth/register` - Inscription utilisateur
- `POST /auth/login` - Connexion utilisateur
- `POST /auth/logout` - Déconnexion
- `POST /auth/refresh` - Renouvellement de token
- `POST /auth/forgot-password` - Mot de passe oublié
- `POST /auth/reset-password` - Réinitialisation mot de passe

### Utilisateurs
- `GET /auth/profile` - Profil utilisateur connecté
- `PUT /auth/profile` - Modification du profil
- `DELETE /auth/profile` - Suppression de compte
- `GET /auth/users` - Liste des utilisateurs (admin)

### Google OAuth
- `GET /auth/google` - Redirection vers Google
- `GET /auth/google/callback` - Callback Google OAuth

### Métriques
- `GET /metrics` - Métriques Prometheus
- `GET /health` - Santé du service

## 🧪 Tests

### Structure des tests
```
tests-simples/
├── auth.test.js            # Tests d'authentification
├── controllers.test.js      # Tests des contrôleurs
├── routes.test.js          # Tests des routes
├── middleware.test.js       # Tests des middlewares
└── config.test.js          # Tests de configuration
```

### Exécution des tests
```bash
# Tous les tests
npm test

# Tests en mode watch
npx jest --watch

# Tests avec couverture
npx jest --coverage
```

## 🔒 Sécurité

### Mesures OWASP implémentées
- ✅ **Injection** : Validation des entrées + sanitisation
- ✅ **Authentification** : Passport.js + JWT sécurisés
- ✅ **Exposition de données** : Champs sensibles masqués
- ✅ **Contrôles d'accès** : Middleware d'autorisation
- ✅ **Configuration** : Variables d'environnement sécurisées
- ✅ **XSS** : En-têtes de sécurité + validation
- ✅ **Sessions** : Sessions sécurisées + JWT
- ✅ **Logging** : Traçabilité des authentifications

### Middlewares de sécurité
- Helmet (en-têtes de sécurité)
- CORS configuré et sécurisé
- Rate limiting par IP et utilisateur
- Validation des entrées avec express-validator
- Sanitisation des données
- Protection CSRF

### Gestion des mots de passe
- Hashage bcrypt avec salt
- Politique de complexité
- Expiration des mots de passe
- Historique des mots de passe

## 📊 Modèles de Données

### User (Utilisateur)
- **Informations de base** : nom, prénom, email
- **Authentification** : mot de passe hashé, tokens
- **Profil** : avatar, préférences, statut
- **Sécurité** : tentatives de connexion, verrouillage

### Session
- **Données de session** : utilisateur, tokens, expiration
- **Métadonnées** : IP, user-agent, date de création
- **Sécurité** : validation et rotation des tokens

## 📈 Performance et Monitoring

### Métriques Prometheus
- `auth_attempts_total` - Tentatives d'authentification
- `auth_success_total` - Authentifications réussies
- `auth_failure_total` - Échecs d'authentification
- `auth_duration_seconds` - Temps de réponse

### Optimisations
- Cache Redis pour les sessions
- Index MongoDB optimisés
- Pool de connexions configuré
- Rate limiting intelligent

## 🚨 Dépannage

### Problèmes courants
1. **Connexion MongoDB** : Vérifier l'URI et les permissions
2. **Google OAuth** : Vérifier les credentials Google
3. **Variables d'environnement** : S'assurer que .env est configuré
4. **CORS** : Vérifier les origines autorisées
5. **Tests qui échouent** : Nettoyer le cache Jest

### Logs
Les logs sont disponibles dans :
- Console (développement)
- Fichiers (production)
- Winston (structurés)
- Métriques Prometheus

## 🔄 Déploiement

### Environnements
- **Development** : `npm run dev`
- **Production** : `npm start`
- **Test** : `npm test`

### Docker (optionnel)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

## 📞 Support

- **Documentation** : Ce README
- **Issues** : Repository GitHub
- **Tests** : Suite de tests complète
- **Logs** : Winston + Console
- **Métriques** : Prometheus

## 📝 Changelog

### Version 1.0.0
- ✅ Authentification locale complète
- ✅ OAuth Google intégré
- ✅ Gestion des sessions JWT
- ✅ Tests unitaires
- ✅ Sécurité OWASP
- ✅ Documentation

---

**Développé avec ❤️ par NegYanis16** 