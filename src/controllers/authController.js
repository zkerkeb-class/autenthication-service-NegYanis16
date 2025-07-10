const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { recordAuthAttempt, recordAuthDuration } = require('../middleware/metrics');
const DB_SERVICE_URL = 'http://localhost:3006/api/v1';

exports.register = async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, password, niveau, classe, nom, prenom } = req.body;

    // Vérifier si l'utilisateur existe déjà via le service BDD
    const existing = await axios.get(`${DB_SERVICE_URL}/users/email/${email}`);
    if (existing.data) {
      recordAuthAttempt('register', false, 'local');
      recordAuthDuration('register', 'local', (Date.now() - startTime) / 1000);
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    // Créer l'utilisateur via le service BDD
    const { data: user } = await axios.post(`${DB_SERVICE_URL}/users`, {
      nom, prenom, email, password, niveau, classe, authProvider: 'local'
    });

    // Envoyer l'email de bienvenue
    try {
      const response = await fetch(`${process.env.NOTIFICATION_SERVICE_URL}/api/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NOTIF_API_KEY
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.prenom,
          lastName: user.nom
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', errorData);
      } else {
        console.log('Email de bienvenue envoyé avec succès à:', user.email);
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailError.message);
      // On ne fait pas échouer l'inscription si l'email échoue
    }

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '24h' }
    );

    // Enregistrer le succès de l'inscription
    recordAuthAttempt('register', true, 'local');
    recordAuthDuration('register', 'local', (Date.now() - startTime) / 1000);

    res.status(201).json({ 
      token,
      message: 'Inscription réussie ! Un email de bienvenue vous a été envoyé.'
    });
  } catch (error) {
    // Enregistrer l'échec de l'inscription
    recordAuthAttempt('register', false, 'local');
    recordAuthDuration('register', 'local', (Date.now() - startTime) / 1000);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.login = async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur via le service BDD
    const { data: user } = await axios.get(`${DB_SERVICE_URL}/users/email/${email}`);
    if (!user) {
      recordAuthAttempt('login', false, 'local');
      recordAuthDuration('login', 'local', (Date.now() - startTime) / 1000);
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Vérifier le mot de passe via le service BDD
    const { data: result } = await axios.post(`${DB_SERVICE_URL}/users/${user._id}/verify-password`, { password });
    if (!result.valid) {
      recordAuthAttempt('login', false, 'local');
      recordAuthDuration('login', 'local', (Date.now() - startTime) / 1000);
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Enregistrer le succès de la connexion
    recordAuthAttempt('login', true, 'local');
    recordAuthDuration('login', 'local', (Date.now() - startTime) / 1000);

    res.json({ token });
  } catch (error) {
    // Enregistrer l'échec de la connexion
    recordAuthAttempt('login', false, 'local');
    recordAuthDuration('login', 'local', (Date.now() - startTime) / 1000);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.logout = (req, res) => {
  // Pour JWT stateless, le logout se fait côté client (suppression du token)
  // Ici, on peut juste renvoyer un message de succès
  recordAuthAttempt('logout', true, 'local');
  res.json({ message: 'Déconnexion réussie' });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Nouvelle méthode pour vérifier le statut du profil
exports.getProfileStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isComplete = user.isProfileComplete();
    
    res.json({
      profileCompleted: isComplete,
      missingFields: isComplete ? [] : getMissingFields(user),
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        niveau: user.niveau,
        classe: user.classe,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Fonction utilitaire pour identifier les champs manquants
function getMissingFields(user) {
  const missing = [];
  
  if (!user.nom) missing.push('nom');
  if (!user.prenom) missing.push('prenom');
  if (!user.niveau) missing.push('niveau');
  if (!user.classe) missing.push('classe');
  
  return missing;
} 