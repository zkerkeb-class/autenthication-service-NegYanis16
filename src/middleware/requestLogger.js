const logger = require('../config/logger');

/**
 * Middleware pour logger toutes les requêtes HTTP
 * Optimisé pour les déploiements cloud (Render)
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Logger la requête entrante seulement si ce n'est pas une route de santé
  if (!req.originalUrl.includes('/health') && !req.originalUrl.includes('/metrics')) {
    logger.http(`${req.method} ${req.originalUrl} - ${req.ip}`);
  }
  
  // Capturer la fin de la réponse pour logger le temps de traitement
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - start;
    
    // Logger seulement les requêtes importantes en production
    if (process.env.NODE_ENV !== 'production' || 
        res.statusCode >= 400 || 
        responseTime > 1000 || 
        req.originalUrl.includes('/auth/')) {
      logger.logRequest(req, res, responseTime);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
