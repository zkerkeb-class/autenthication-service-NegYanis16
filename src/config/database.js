const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const uri = `mongodb+srv://yanis:yanis2001@cluster1.osxbdyf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('Connexion à MongoDB établie avec succès');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
