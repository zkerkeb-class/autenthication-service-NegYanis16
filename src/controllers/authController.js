const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, password, niveau, classe, nom, prenom } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    // Créer un nouvel utilisateur
    user = new User({
      nom,
      prenom,
      email,
      password,
      niveau,
      classe
    });

    await user.save();

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

    res.status(201).json({ 
      token,
      message: 'Inscription réussie ! Un email de bienvenue vous a été envoyé.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    console.log(process.env.JWT_SECRET);
    // Créer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.logout = (req, res) => {
  // Pour JWT stateless, le logout se fait côté client (suppression du token)
  // Ici, on peut juste renvoyer un message de succès
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