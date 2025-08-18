const winston = require('winston');
const env = require('./env');

// Configuration des niveaux de log personnalisés
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Configuration des couleurs pour chaque niveau
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Ajouter les couleurs à winston
winston.addColors(colors);

// Format personnalisé pour les logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Configuration des transports
const transports = [
  // Console (toujours actif, adapté selon l'environnement)
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' 
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.json() // Format JSON pour Render
        )
      : format, // Format coloré pour le développement
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
];

// Ajouter les transports fichiers seulement en développement
// Render ne permet pas l'écriture de fichiers persistants
if (env.NODE_ENV !== 'production') {
  transports.push(
    // Fichier pour les erreurs (développement seulement)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    
    // Fichier pour tous les logs (développement seulement)
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Créer le logger
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  transports,
  // Désactiver les exceptions non gérées en production pour éviter les crashs
  exitOnError: env.NODE_ENV !== 'production',
});

// Fonction utilitaire pour logger les requêtes HTTP
logger.logRequest = (req, res, responseTime) => {
  const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms - ${req.ip}`;
  
  if (res.statusCode >= 400) {
    logger.error(message);
  } else {
    logger.http(message);
  }
};

// Fonction utilitaire pour logger les authentifications
logger.logAuth = (action, success, provider, email, details = '') => {
  const status = success ? 'SUCCESS' : 'FAILED';
  const message = `AUTH ${action.toUpperCase()} ${status} - Provider: ${provider} - Email: ${email || 'unknown'} ${details}`;
  
  if (success) {
    logger.info(message);
  } else {
    logger.warn(message);
  }
};

// Fonction utilitaire pour logger les erreurs avec contexte
logger.logError = (error, context = '') => {
  const message = `ERROR ${context ? `[${context}]` : ''}: ${error.message}`;
  logger.error(message, {
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
