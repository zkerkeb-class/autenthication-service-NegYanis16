const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    // Utilisation de l'URI MongoDB depuis les variables d'environnement
    const uri = env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI n\'est pas définie dans les variables d\'environnement');
    }
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connexion à MongoDB établie avec succès');
  } catch (err) {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
