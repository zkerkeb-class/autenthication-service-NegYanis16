const passport = require('passport');
const env = require('../config/env');
const User = require('../models/User');




/**
 * Initialise l'authentification Google
 */
exports.googleAuth = passport.authenticate('google');

/**
 * Callback après l'authentification Google
 */
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('Erreur lors de l\'authentification Google:', err);
      return res.redirect(`${env.FRONTEND_URL}/login?error=authentication_failed`);
    }
    
    if (!user) {
      console.error('Aucun utilisateur retourné par Google');
      return res.redirect(`${env.FRONTEND_URL}/login?error=no_user`);
    }
    
    req.login(user, (err) => {
      if (err) {
        console.error('Erreur lors de la connexion de session:', err);
        return res.redirect(`${env.FRONTEND_URL}/login?error=session_error`);
      }
      
      // Récupérer le token JWT de l'utilisateur
      const token = user.token;
      
      // Vérifier si le profil est complet (a niveau et classe)
      const isProfileComplete = user.niveau && user.classe;
      
      // Rediriger selon le statut du profil
      const redirectUrl = isProfileComplete 
        ? `${env.FRONTEND_URL}/dashboard?token=${token}`
        : `${env.FRONTEND_URL}/complete-profile?token=${token}`;
      
      res.redirect(redirectUrl);
    });
  })(req, res, next);
};

/**
 * Déconnexion de l'utilisateur
 */
exports.logout = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Aucun utilisateur connecté' });
  }

  req.logout((err) => {
    if (err) {
      console.error('Erreur lors de la déconnexion:', err);
      return res.status(500).json({ success: false, message: 'Erreur lors de la déconnexion' });
    }
    
    // Destruction de la session
    req.session.destroy((err) => {
      if (err) {
        console.error('Erreur lors de la destruction de la session:', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la destruction de la session' });
      }
      
      // Clear du cookie de session
      res.clearCookie('connect.sid');
      
      // Envoi d'une réponse JSON
      res.status(200).json({ success: true, message: 'Déconnexion réussie' });
    });
  });
};

/**
 * Vérifie le statut d'authentification actuel
 */
exports.getAuthStatus = (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      isAuthenticated: true,
      user: req.user
    });
  }
  
  res.json({
    isAuthenticated: false,
    user: null
  });
};

/**
 * Récupère les données de l'utilisateur actuel
 * Nécessite une authentification préalable
 */
exports.getUserData = (req, res) => {
  res.json({
    user: req.user
  });
};

/**
 * Complète le profil de l'utilisateur Google
 * Permet d'ajouter niveau et classe
 */
exports.completeProfile = async (req, res) => {
  try {
    const { niveau, classe } = req.body;
    
    // Récupérer l'ID utilisateur selon le type d'authentification
    let userId;
    if (req.isAuthenticated()) {
      // Authentification Google (sessions)
      userId = req.user._id;
    } else if (req.userData) {
      // Authentification JWT
      userId = req.userData.userId;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Validation des données
    if (!niveau || !classe) {
      return res.status(400).json({
        success: false,
        message: 'Le niveau et la classe sont obligatoires'
      });
    }

    // Validation des valeurs
    const niveauxValides = ['collège', 'lycée'];
    const classesValides = ['6ème', '5ème', '4ème', '3ème', '2nd', '1ère', 'Terminale'];
    
    if (!niveauxValides.includes(niveau)) {
      return res.status(400).json({
        success: false,
        message: 'Niveau invalide'
      });
    }
    
    if (!classesValides.includes(classe)) {
      return res.status(400).json({
        success: false,
        message: 'Classe invalide'
      });
    }

    // Mise à jour du profil utilisateur avec seulement les champs nécessaires
    const updateData = {
      niveau: niveau,
      classe: classe,
      profileCompleted: true
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Générer un nouveau token JWT avec les informations mises à jour
    const jwt = require('jsonwebtoken');
    const newToken = jwt.sign(
      { 
        userId: updatedUser._id,
        email: updatedUser.email,
        authProvider: updatedUser.authProvider
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Profil complété avec succès',
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        niveau: updatedUser.niveau,
        classe: updatedUser.classe,
        authProvider: updatedUser.authProvider,
        avatar: updatedUser.avatar,
        profileCompleted: updatedUser.profileCompleted
      },
      token: newToken
    });

  } catch (error) {
    console.error('Erreur lors de la complétion du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la complétion du profil'
    });
  }
};
