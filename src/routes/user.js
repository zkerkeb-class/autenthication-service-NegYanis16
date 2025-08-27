const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Récupérer le profil de l'utilisateur connecté
router.get('/profile', userController.getProfile);

// Mettre à jour les informations de base (nom, prénom, niveau, classe)
router.put('/profile', userController.updateProfile);

// Changer l'email
router.put('/email', userController.updateEmail);

// Changer le mot de passe
router.put('/password', userController.updatePassword);

// Supprimer le compte
router.delete('/account', userController.deleteAccount);

// Mettre à jour le nombre de jetons
router.put('/tokens', userController.updateTokens);

module.exports = router; 