# Tests Simples pour le Service d'Authentification

## 🎯 Objectif
Tests basiques et organisés pour vérifier que le service d'authentification fonctionne correctement.

## 📁 Structure des tests

```
tests-simples/
├── auth.test.js           # Tests d'authentification générale
├── controllers.test.js     # Tests des contrôleurs
├── routes.test.js         # Tests des routes
├── middleware.test.js      # Tests des middlewares
└── config.test.js         # Tests de configuration et services
```

## 🚀 Exécution

```bash
npm install
npm test
```

## ✅ Ce qui est testé

### 🔐 **Authentification (auth.test.js)**
- Validation des tokens JWT
- Validation des mots de passe
- Validation des emails
- Sécurité des sessions
- Validation des routes
- Gestion des erreurs
- Configuration de sécurité

### 🎮 **Contrôleurs (controllers.test.js)**
- Import des contrôleurs d'authentification
- Import des contrôleurs utilisateur
- Import des contrôleurs Google
- Structure des contrôleurs

### 🛣️ **Routes (routes.test.js)**
- Import des routes d'authentification
- Import des routes utilisateur
- Import des routes Google
- Structure des routes

### 🔧 **Middlewares (middleware.test.js)**
- Middleware d'authentification
- Passport et stratégies
- Configuration des sessions
- Options CORS
- Limitation de taux

### ⚙️ **Configuration (config.test.js)**
- Variables d'environnement
- Services d'authentification
- Configuration MongoDB
- Métriques Prometheus
- En-têtes de sécurité

## 💡 Avantages

1. **Organisé** - Chaque type de test dans son fichier
2. **Simple** - Tests basiques et compréhensibles
3. **Rapide** - Exécution sans base de données
4. **Maintenable** - Facile à modifier et étendre
5. **Sécurisé** - Tests des aspects de sécurité

## 🔧 Prérequis
- Node.js installé
- `npm install` exécuté (installe Jest automatiquement)

## 🎉 Résultat attendu
```
PASS tests-simples/auth.test.js
PASS tests-simples/controllers.test.js
PASS tests-simples/routes.test.js
PASS tests-simples/middleware.test.js
PASS tests-simples/config.test.js

✓ 5 test suites
✓ ~50 tests
```

## 🚨 Tests de sécurité inclus
- Validation des tokens JWT
- Sécurité des sessions
- En-têtes de sécurité
- Configuration CORS
- Limitation de taux
- Validation des mots de passe 