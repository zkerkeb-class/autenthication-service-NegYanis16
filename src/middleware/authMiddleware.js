const jwt = require('jsonwebtoken');
const env = require('../config/env');


// Middleware pour l'authentification Google (sessions Passport)
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentification Google requise' });
};

// Middleware pour l'authentification JWT (votre système existant)
exports.requireJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, env.JWT_SECRET);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token JWT requis' });
  }
};

// Middleware hybride qui accepte soit JWT soit Google Auth
exports.requireAuth = (req, res, next) => {
  // Essayer d'abord l'authentification Google
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Sinon, essayer l'authentification JWT
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decodedToken = jwt.verify(token, env.JWT_SECRET);
      req.userData = { userId: decodedToken.userId };
      return next();
    }
  } catch (error) {
    // Continue vers l'erreur
  }
  
  res.status(401).json({ message: 'Authentification requise (JWT ou Google)' });
}; 