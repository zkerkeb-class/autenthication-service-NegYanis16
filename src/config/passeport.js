const passport = require('passport');
const { Strategy: OpenIDConnectStrategy } = require('passport-openidconnect');
const User = require('../models/User');
const jwt = require('jsonwebtoken');


const env = require('./env');

// Configuration de la stratégie OpenID Connect pour Google
passport.use('google', new OpenIDConnectStrategy({
  issuer: 'https://accounts.google.com',
  clientID: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenURL: 'https://oauth2.googleapis.com/token',
  userInfoURL: 'https://openidconnect.googleapis.com/v1/userinfo',
  callbackURL: `${env.BASE_URL}/api/google/google/callback`,
  scope: ['profile', 'email']
}, async (issuer, profile, done) => {
  try {
    console.log('Profile Google reçu:', profile);
    
    // Chercher si l'utilisateur existe déjà
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    if (user) {
      // Utilisateur existe - mise à jour si nécessaire
      if (!user.googleId) {
        // Utilisateur existant avec email/password, ajouter Google
        user.mergeWithGoogle(profile);
        await user.save();
        console.log('Compte fusionné avec Google:', user.email);
      }
    } else {
      // Créer un nouvel utilisateur Google
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        nom: profile.name.familyName,
        prenom: profile.name.givenName,
        avatar: profile.photos?.[0]?.value,
        authProvider: 'google',
        // Valeurs par défaut pour niveau/classe (à compléter plus tard)
        niveau: null,
        classe: null
      });
      await user.save();
      console.log('Nouvel utilisateur Google créé:', user.email);
    }

    // Générer un token JWT pour l'utilisateur
    const token = jwt.sign(
      { userId: user._id },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner l'utilisateur avec le token
    const userWithToken = {
      ...user.toObject(),
      token: token
    };

    return done(null, userWithToken);
  } catch (error) {
    console.error('Erreur lors de la gestion de l\'utilisateur Google:', error);
    return done(error);
  }
}));

// Sérialisation de l'utilisateur pour la session
passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

// Désérialisation de l'utilisateur à partir de la session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;