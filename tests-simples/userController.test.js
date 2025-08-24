const axios = require('axios');
const jwt = require('jsonwebtoken');

// Mock des dépendances
jest.mock('axios');
jest.mock('jsonwebtoken');

// Mock process.env
process.env.JWT_SECRET = 'test-jwt-secret';

const userController = require('../src/controllers/userController');

describe('UserController - Tests Complets', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      userData: { userId: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    
    // Reset des mocks
    jest.clearAllMocks();
    
    // Mock axios par défaut
    axios.get = jest.fn();
    axios.post = jest.fn();
    axios.put = jest.fn();
    axios.patch = jest.fn();
    axios.delete = jest.fn();
  });

  describe('getProfile', () => {
    test('devrait retourner le profil utilisateur', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        nom: 'Test',
        prenom: 'User'
      };

      axios.get.mockResolvedValue({ data: mockUser });

      await userController.getProfile(req, res);

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/users/user123'));
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('devrait retourner 404 si utilisateur non trouvé', async () => {
      axios.get.mockResolvedValue({ data: null });

      await userController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur non trouvé' });
    });

    test('devrait gérer les erreurs', async () => {
      const error = new Error('Database error');
      axios.get.mockRejectedValue(error);

      await userController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Database error' 
      });
    });
  });

  describe('updateProfile', () => {
    test('devrait mettre à jour le profil avec succès', async () => {
      const updatedUser = { _id: 'user123', nom: 'Updated', prenom: 'User' };
      req.body = { nom: 'Updated', prenom: 'User' };

      axios.put.mockResolvedValue({ data: updatedUser });

      await userController.updateProfile(req, res);

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123'),
        { nom: 'Updated', prenom: 'User' }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      });
    });

    test('devrait gérer les erreurs de mise à jour', async () => {
      req.body = { nom: 'Updated' };
      const error = new Error('Update failed');
      axios.put.mockRejectedValue(error);

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Update failed' 
      });
    });
  });

  describe('updateEmail', () => {
    test('devrait mettre à jour l\'email avec succès', async () => {
      req.body = { email: 'new@test.com', password: 'password123' };
      const updatedUser = { _id: 'user123', email: 'new@test.com' };

      // Mock : mot de passe valide
      axios.post.mockResolvedValue({ data: { valid: true } });
      // Mock : email n'existe pas
      axios.get.mockResolvedValue({ data: null });
      // Mock : mise à jour réussie
      axios.put.mockResolvedValue({ data: updatedUser });

      await userController.updateEmail(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123/verify-password'),
        { password: 'password123' }
      );
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/users/email/new@test.com'));
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123'),
        { email: 'new@test.com' }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email mis à jour avec succès',
        user: updatedUser
      });
    });

    test('devrait rejeter si mot de passe incorrect', async () => {
      req.body = { email: 'new@test.com', password: 'wrongpassword' };

      axios.post.mockResolvedValue({ data: { valid: false } });

      await userController.updateEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Mot de passe incorrect' });
    });

    test('devrait rejeter si email déjà utilisé', async () => {
      req.body = { email: 'existing@test.com', password: 'password123' };

      axios.post.mockResolvedValue({ data: { valid: true } });
      axios.get.mockResolvedValue({ data: { _id: 'otheruser', email: 'existing@test.com' } });

      await userController.updateEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cet email est déjà utilisé' });
    });

    test('devrait permettre de garder le même email', async () => {
      req.body = { email: 'same@test.com', password: 'password123' };
      const updatedUser = { _id: 'user123', email: 'same@test.com' };

      axios.post.mockResolvedValue({ data: { valid: true } });
      axios.get.mockResolvedValue({ data: { _id: 'user123', email: 'same@test.com' } });
      axios.put.mockResolvedValue({ data: updatedUser });

      await userController.updateEmail(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Email mis à jour avec succès',
        user: updatedUser
      });
    });

    test('devrait gérer les erreurs', async () => {
      req.body = { email: 'new@test.com', password: 'password123' };
      const error = new Error('Service error');
      axios.post.mockRejectedValue(error);

      await userController.updateEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Service error' 
      });
    });
  });

  describe('updatePassword', () => {
    test('devrait mettre à jour le mot de passe avec succès', async () => {
      req.body = { currentPassword: 'oldpass', newPassword: 'newpass123' };

      axios.post.mockResolvedValue({ data: { valid: true } });
      axios.put.mockResolvedValue({ data: {} });

      await userController.updatePassword(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123/verify-password'),
        { password: 'oldpass' }
      );
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123'),
        { password: 'newpass123' }
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Mot de passe mis à jour avec succès' });
    });

    test('devrait rejeter si mot de passe actuel incorrect', async () => {
      req.body = { currentPassword: 'wrongpass', newPassword: 'newpass123' };

      axios.post.mockResolvedValue({ data: { valid: false } });

      await userController.updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Mot de passe actuel incorrect' });
    });

    test('devrait gérer les erreurs', async () => {
      req.body = { currentPassword: 'oldpass', newPassword: 'newpass123' };
      const error = new Error('Update error');
      axios.post.mockRejectedValue(error);

      await userController.updatePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Update error' 
      });
    });
  });

  describe('deleteAccount', () => {
    test('devrait supprimer le compte avec succès', async () => {
      req.body = { password: 'password123' };

      axios.post.mockResolvedValue({ data: { valid: true } });
      axios.delete.mockResolvedValue({ data: {} });

      await userController.deleteAccount(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123/verify-password'),
        { password: 'password123' }
      );
      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/users/user123'));
      expect(res.json).toHaveBeenCalledWith({ message: 'Compte supprimé avec succès' });
    });

    test('devrait rejeter si mot de passe incorrect', async () => {
      req.body = { password: 'wrongpassword' };

      axios.post.mockResolvedValue({ data: { valid: false } });

      await userController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Mot de passe incorrect' });
    });

    test('devrait gérer les erreurs', async () => {
      req.body = { password: 'password123' };
      const error = new Error('Delete error');
      axios.post.mockRejectedValue(error);

      await userController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Delete error' 
      });
    });
  });

  describe('updateTokens', () => {
    test('devrait mettre à jour les jetons avec succès', async () => {
      req.body = { jetons: 5, operation: 'add' };
      const tokenData = { jetons: 15 };
      const updatedUser = { _id: 'user123', email: 'test@test.com', jetons: 15 };

      axios.patch.mockResolvedValue({ data: tokenData });
      axios.get.mockResolvedValue({ data: updatedUser });
      jwt.sign = jest.fn().mockReturnValue('new-jwt-token');

      await userController.updateTokens(req, res);

      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123/tokens'),
        { jetons: 5, operation: 'add' }
      );
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/users/user123'));
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', jetons: 15, email: 'test@test.com' },
        'test-jwt-secret',
        { expiresIn: '24h' }
      );
      expect(res.json).toHaveBeenCalledWith({
        ...tokenData,
        user: updatedUser,
        token: 'new-jwt-token'
      });
    });

    test('devrait gérer les erreurs', async () => {
      req.body = { jetons: 5, operation: 'add' };
      const error = new Error('Token update error');
      axios.patch.mockRejectedValue(error);

      await userController.updateTokens(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur.', 
        error: 'Token update error' 
      });
    });
  });
});
