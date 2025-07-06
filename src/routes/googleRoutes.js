const express = require('express');
const router = express.Router();
const googleController = require('../controllers/googleController');
const { requireAuth } = require('../middleware/authMiddleware');

// Routes d'authentification avec Google
router.get('/google', googleController.googleAuth);
router.get('/google/callback', googleController.googleCallback);

// Route de déconnexion (uniquement en POST pour suivre les bonnes pratiques REST)
router.post('/logout', googleController.logout);

// Route pour vérifier le statut d'authentification
router.get('/status', googleController.getAuthStatus);

// Route pour récupérer les données de l'utilisateur connecté
router.get('/user', requireAuth, googleController.getUserData);

// Route pour compléter le profil utilisateur
router.post('/complete-profile', requireAuth, googleController.completeProfile);

module.exports = router;