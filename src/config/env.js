const { config } = require('dotenv');

// On récupère l'environnement dans lequel on se trouve
const environment = process.env.NODE_ENV || 'development';

let envFile;

// On détermine le fichier .env à utiliser en fonction de l'environnement
switch (environment) {
  case 'development':
    envFile = './.env.dev';
    break;
  case 'production':
    envFile = './.env.prod';
    break;
  default:
    envFile = './.env.dev';
    break;
}

// On charge les variables d'environnement du fichier .env
config({ path: envFile });

// Récupération de toutes les variables d'environnement
const env = {
  // Configuration MongoDB
  MONGODB_URI: process.env.MONGODB_URI,
  
  // Configuration JWT
  JWT_SECRET: process.env.JWT_SECRET,
  
  // Configuration du serveur
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Configuration CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Autres variables d'environnement
  ...process.env
};

// Vérification des variables obligatoires
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️ Variables d'environnement manquantes: ${missingVars.join(', ')}`);
  console.warn('Assurez-vous que ces variables sont définies dans votre fichier d\'environnement');
}

// Export de toutes les variables d'environnement
module.exports = env;
