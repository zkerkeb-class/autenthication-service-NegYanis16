const express = require('express');
const passport = require('./src/config/passeport');
const session = require('express-session');
const cors = require('cors');
const connectDB = require('./src/config/database');

// Configuration des variables d'environnement
// On charge le fichier env.dev par défaut pour le développement


// Import de la configuration d'environnement
const env = require('./src/config/env');

// Import du logger Winston
const logger = require('./src/config/logger');
const requestLogger = require('./src/middleware/requestLogger');

// Import du middleware de métriques
const { metricsMiddleware } = require('./src/middleware/metrics');

const app = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Middleware de logging des requêtes (avant les métriques)
app.use(requestLogger);

// Middleware de métriques (doit être placé avant les routes)
app.use(metricsMiddleware);

// Configuration des sessions (AVANT Passport)
app.use(session({
  secret: env.SESSION_SECRET || 'votre_session_secret_tres_long_et_complexe',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true en production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Connexion à MongoDB
connectDB();

// Initialisation de Passport (APRÈS les sessions)
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/user', require('./src/routes/user'));
app.use('/api/google', require('./src/routes/googleRoutes'));

// Route de métriques Prometheus
app.use('/metrics', require('./src/routes/metrics'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API en ligne' });
});

// Route de santé pour Render (sans logs excessifs)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'auth-service'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  logger.logError(err, 'EXPRESS_ERROR_HANDLER');
  res.status(500).json({ message: 'Une erreur est survenue', error: err.message });
});

// Port
const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
  logger.info(`🌍 Environnement: ${env.NODE_ENV}`);
  logger.info(`🔗 CORS Origin: ${env.CORS_ORIGIN}`);
  logger.info(`📊 MongoDB URI configurée: ${env.MONGODB_URI ? '✅' : '❌'}`);
  logger.info(`🔐 JWT Secret configuré: ${env.JWT_SECRET ? '✅' : '❌'}`);
  logger.info(`🔑 Session Secret configuré: ${process.env.SESSION_SECRET ? '✅' : '❌'}`);
  logger.info(`📈 Métriques Prometheus disponibles sur: http://localhost:${PORT}/metrics`);
}); 