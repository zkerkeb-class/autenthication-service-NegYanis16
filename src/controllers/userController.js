const axios = require('axios');
const DB_SERVICE_URL = 'http://localhost:3006/api/v1';

// Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.userData;
    const { data: user } = await axios.get(`${DB_SERVICE_URL}/users/${userId}`);
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
    const { userId } = req.userData;
    const { data: user } = await axios.put(`${DB_SERVICE_URL}/users/${userId}`, req.body);
    res.json({ message: 'Profil mis à jour avec succès', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Changer l'email
exports.updateEmail = async (req, res) => {
  try {
    const { userId } = req.userData;
    const { email, password } = req.body;

    // Vérifier le mot de passe
    const { data: result } = await axios.post(`${DB_SERVICE_URL}/users/${userId}/verify-password`, { password });
    if (!result.valid) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Vérifier si le nouvel email existe déjà
    const { data: existingUser } = await axios.get(`${DB_SERVICE_URL}/users/email/${email}`);
    if (existingUser && existingUser._id !== userId) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Mettre à jour l'email
    const { data: user } = await axios.put(`${DB_SERVICE_URL}/users/${userId}`, { email });
    res.json({ message: 'Email mis à jour avec succès', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Changer le mot de passe
exports.updatePassword = async (req, res) => {
  try {
    const { userId } = req.userData;
    const { currentPassword, newPassword } = req.body;

    // Vérifier le mot de passe actuel
    const { data: result } = await axios.post(`${DB_SERVICE_URL}/users/${userId}/verify-password`, { password: currentPassword });
    if (!result.valid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    await axios.put(`${DB_SERVICE_URL}/users/${userId}`, { password: newPassword });
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer le compte
exports.deleteAccount = async (req, res) => {
  try {
    const { userId } = req.userData;
    const { password } = req.body;

    // Vérifier le mot de passe
    const { data: result } = await axios.post(`${DB_SERVICE_URL}/users/${userId}/verify-password`, { password });
    if (!result.valid) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Supprimer l'utilisateur
    await axios.delete(`${DB_SERVICE_URL}/users/${userId}`);
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour les jetons
exports.updateTokens = async (req, res) => {
  try {
    const { userId } = req.userData;
    const { data } = await axios.patch(`${DB_SERVICE_URL}/users/${userId}/tokens`, req.body);
    // Récupérer l'utilisateur à jour
    const { data: user } = await axios.get(`${DB_SERVICE_URL}/users/${userId}`);
    // Régénérer le JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, jetons: user.jetons, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ ...data, user, token });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};


