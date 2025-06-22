const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/database');

// Configuration des variables d'environnement
// On charge le fichier env.dev par défaut pour le développement
dotenv.config({ path: './env.dev' });

// Import de la configuration d'environnement
const env = require('./src/config/env');

const app = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Connexion à MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./src/routes/auth'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API en ligne' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue', error: err.message });
});

// Port
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${env.NODE_ENV}`);
  console.log(`🔗 CORS Origin: ${env.CORS_ORIGIN}`);
  console.log(`📊 MongoDB URI configurée: ${env.MONGODB_URI ? '✅' : '❌'}`);
  console.log(`🔐 JWT Secret configuré: ${env.JWT_SECRET ? '✅' : '❌'}`);
}); 