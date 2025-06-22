const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, password, niveau, classe } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    // Créer un nouvel utilisateur
    user = new User({
      email,
      password,
      niveau,
      classe
    });

    await user.save();

    // Créer le token JWT
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
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