const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Route protégée (exemple)
router.get('/profile', auth, (req, res) => {
  res.json({ message: 'Route protégée', userId: req.userData.userId });
});

// Infos utilisateur connecté
router.get('/me', auth, authController.me);

// Déconnexion
router.post('/logout', authController.logout);

// Route pour vérifier si le profil est complet
router.get('/profile-status', auth, authController.getProfileStatus);

module.exports = router; 