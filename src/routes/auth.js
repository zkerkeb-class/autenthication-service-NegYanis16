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

module.exports = router; 