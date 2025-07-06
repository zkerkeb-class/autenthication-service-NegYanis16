const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
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

// Mettre à jour les informations de base (nom, prénom, niveau, classe)
exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, niveau, classe } = req.body;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs autorisés
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (niveau) {
      if (!['lycée', 'collège'].includes(niveau)) {
        return res.status(400).json({ message: 'Niveau invalide. Doit être "lycée" ou "collège"' });
      }
      user.niveau = niveau;
    }
    if (classe) {
      const classesValides = ['6ème', '5ème', '4ème', '3ème', '2nd', '1ère', 'Terminale'];
      if (!classesValides.includes(classe)) {
        return res.status(400).json({ message: 'Classe invalide' });
      }
      user.classe = classe;
    }

    await user.save();
    
    // Retourner l'utilisateur sans le mot de passe
    const userUpdated = await User.findById(user._id).select('-password');
    res.json({ 
      message: 'Profil mis à jour avec succès', 
      user: userUpdated 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Changer l'email
exports.updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Vérifier si le nouvel email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.userData.userId) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Mettre à jour l'email
    user.email = email;
    await user.save();
    
    const userUpdated = await User.findById(user._id).select('-password');
    res.json({ 
      message: 'Email mis à jour avec succès', 
      user: userUpdated 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Changer le mot de passe
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer le compte
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Mot de passe requis pour supprimer le compte' });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(req.userData.userId);
    
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.updateTokens = async (req, res) => {
  try {
    const { jetons, operation } = req.body;
    const { userId } = req.userData;

    if (jetons === undefined || typeof jetons !== 'number') {
      return res.status(400).json({ message: 'Le nombre de jetons est requis et doit être un nombre.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const currentJetons = user.jetons || 0;
    let newJetons;

    const invalidAmount = jetons <= 0 && operation !== 'set';

    if (operation) {
      if (invalidAmount) {
        return res.status(400).json({ message: 'Le nombre de jetons doit être strictement positif.' });
      }

      switch (operation) {
        case 'add':
          newJetons = currentJetons + jetons;
          break;

        case 'subtract':
          if (currentJetons < jetons) {
            return res.status(400).json({ message: 'Jetons insuffisants.' });
          }
          newJetons = currentJetons - jetons;
          break;

        case 'set':
          if (jetons < 0) {
            return res.status(400).json({ message: 'Le nombre de jetons ne peut pas être négatif.' });
          }
          newJetons = jetons;
          break;

        default:
          return res.status(400).json({ message: 'Opération invalide. Utilisez "add", "subtract" ou "set".' });
      }
    } else {
      // Par défaut, on considère une opération "set"
      if (jetons < 0) {
        return res.status(400).json({ message: 'Le nombre de jetons ne peut pas être négatif.' });
      }
      newJetons = jetons;
    }

    const ancienJetons = user.jetons;
    user.jetons = newJetons;
    await user.save();

    const { password, ...userSansMotDePasse } = user.toObject();

    res.json({
      message: 'Jetons mis à jour avec succès.',
      user: userSansMotDePasse,
      ancienJetons,
      nouveauxJetons: newJetons,
    });
  } catch (error) {
    console.error('[updateTokens] Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};


