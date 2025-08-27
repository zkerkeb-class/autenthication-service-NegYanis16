const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: function() { 
      // Requis seulement si pas d'authentification Google
      return !this.googleId; 
    },
    trim: true
  },
  prenom: {
    type: String,
    required: function() { 
      return !this.googleId; 
    },
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() { 
      // Requis seulement si pas d'authentification Google
      return !this.googleId; 
    },
    minlength: 6
  },
  // Nouveaux champs pour Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true // Permet null/undefined pour les utilisateurs non-Google
  },
  avatar: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  // Champs existants - maintenant optionnels pour permettre l'inscription Google
  niveau: {
    type: String,
    enum: ['lycée', 'collège', null, undefined],
    default: null
  },
  classe: {
    type: String,
    enum: ['6ème', '5ème', '4ème', '3ème', '2nd', '1ère', 'Terminale', null, undefined],
    default: null
  },
  // Nouveau champ pour indiquer si le profil est complet
  profileCompleted: {
    type: Boolean,
    default: false
  },
  jetons: {
    type: Number,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validation personnalisée pour vérifier si le profil est complet
userSchema.methods.isProfileComplete = function() {
  // Pour les utilisateurs locaux, niveau et classe sont requis
  if (this.authProvider === 'local') {
    return this.nom && this.prenom && this.niveau && this.classe;
  }
  
  // Pour les utilisateurs Google, niveau et classe sont requis pour utiliser l'app
  if (this.authProvider === 'google') {
    return this.nom && this.prenom && this.niveau && this.classe;
  }
  
  return false;
};

// Middleware pour mettre à jour profileCompleted automatiquement
userSchema.pre('save', async function(next) {
  // Si c'est un utilisateur Google, pas besoin de hasher le mot de passe
  if (this.authProvider === 'google') {
    // Mettre à jour profileCompleted
    this.profileCompleted = this.isProfileComplete();
    return next();
  }
  
  if (!this.isModified('password')) {
    // Mettre à jour profileCompleted
    this.profileCompleted = this.isProfileComplete();
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // Mettre à jour profileCompleted
    this.profileCompleted = this.isProfileComplete();
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe (seulement pour les utilisateurs locaux)
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Si c'est un utilisateur Google, pas de comparaison de mot de passe
  if (this.authProvider === 'google') {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour vérifier si l'utilisateur peut se connecter avec mot de passe
userSchema.methods.canUsePassword = function() {
  return this.authProvider === 'local' && this.password;
};

// Méthode pour vérifier si l'utilisateur peut se connecter avec Google
userSchema.methods.canUseGoogle = function() {
  return this.authProvider === 'google' && this.googleId;
};

// Méthode pour fusionner un compte Google avec un compte existant
userSchema.methods.mergeWithGoogle = function(googleProfile) {
  this.googleId = googleProfile.id;
  this.authProvider = 'google';
  this.avatar = googleProfile.photos?.[0]?.value;
  
  // Si les champs nom/prenom ne sont pas remplis, les prendre de Google
  if (!this.nom && googleProfile.name?.familyName) {
    this.nom = googleProfile.name.familyName;
  }
  if (!this.prenom && googleProfile.name?.givenName) {
    this.prenom = googleProfile.name.givenName;
  }
  
  // Mettre à jour profileCompleted
  this.profileCompleted = this.isProfileComplete();
};

module.exports = mongoose.model('User', userSchema); 