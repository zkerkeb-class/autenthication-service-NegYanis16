const axios = require('axios');
const jwt = require('jsonwebtoken');

// Mock des dépendances
jest.mock('axios');
jest.mock('jsonwebtoken');
jest.mock('../src/models/User');
jest.mock('../src/middleware/metrics');
jest.mock('../src/config/logger');

// Mock global fetch
global.fetch = jest.fn();

const authController = require('../src/controllers/authController');
const User = require('../src/models/User');
const { recordAuthAttempt, recordAuthDuration } = require('../src/middleware/metrics');
const logger = require('../src/config/logger');

describe('AuthController - Tests Complets', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {},
      userData: {},
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    
    // Reset des mocks
    jest.clearAllMocks();
    
    // Mock axios par défaut
    axios.get = jest.fn();
    axios.post = jest.fn();
    
    // Mock fetch par défaut
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({})
    });

    // Mock logger
    logger.logAuth = jest.fn();
    logger.logError = jest.fn();
    logger.info = jest.fn();
    logger.error = jest.fn();
  });

  describe('register', () => {
    test('devrait enregistrer un nouvel utilisateur avec succès', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'password123',
        niveau: 'lycée',
        classe: '1ère',
        nom: 'Test',
        prenom: 'User'
      };
      req.body = userData;

      // Mock : utilisateur n'existe pas (axios.get retourne data: null)
      axios.get.mockResolvedValue({ data: null });
      
      // Mock : création utilisateur réussie
      const createdUser = { _id: '123', email: 'test@test.com', nom: 'Test', prenom: 'User' };
      axios.post.mockResolvedValue({ data: createdUser });

      // Mock JWT
      jwt.sign = jest.fn().mockReturnValue('fake-token');

      await authController.register(req, res);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          nom: 'Test',
          prenom: 'User',
          email: 'test@test.com',
          authProvider: 'local'
        })
      );
      expect(jwt.sign).toHaveBeenCalled();
      expect(recordAuthAttempt).toHaveBeenCalledWith('register', true, 'local');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'fake-token'
      }));
    });

    test('devrait retourner une erreur si utilisateur existe déjà', async () => {
      req.body = { email: 'existing@test.com' };

      // Mock : utilisateur existe
      axios.get.mockResolvedValue({ data: { email: 'existing@test.com' } });

      await authController.register(req, res);

      expect(recordAuthAttempt).toHaveBeenCalledWith('register', false, 'local');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cet utilisateur existe déjà' });
    });

    test('devrait gérer les erreurs de création utilisateur', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };

      // Mock : utilisateur n'existe pas
      axios.get.mockResolvedValue({ data: null });
      
      // Mock : erreur lors de la création
      const error = new Error('Erreur base de données');
      axios.post.mockRejectedValue(error);

      await authController.register(req, res);

      expect(recordAuthAttempt).toHaveBeenCalledWith('register', false, 'local');
      expect(logger.logAuth).toHaveBeenCalledWith('register', false, 'local', 'test@test.com', expect.any(String));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Erreur base de données' 
      });
    });
  });

  describe('login', () => {
    test('devrait connecter un utilisateur avec succès', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };

      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        nom: 'Test',
        prenom: 'User'
      };

      // Mock : utilisateur trouvé
      axios.get.mockResolvedValue({ data: mockUser });
      
      // Mock : vérification mot de passe réussie
      axios.post.mockResolvedValue({ data: { valid: true } });

      // Mock JWT
      jwt.sign = jest.fn().mockReturnValue('fake-token');

      await authController.login(req, res);

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/users/email/test@test.com'));
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/users/123/verify-password'),
        { password: 'password123' }
      );
      expect(jwt.sign).toHaveBeenCalled();
      expect(recordAuthAttempt).toHaveBeenCalledWith('login', true, 'local');
      expect(res.json).toHaveBeenCalledWith({ token: 'fake-token' });
    });

    test('devrait rejeter un utilisateur inexistant', async () => {
      req.body = { email: 'nonexistent@test.com', password: 'password123' };

      // Mock : utilisateur non trouvé
      axios.get.mockResolvedValue({ data: null });

      await authController.login(req, res);

      expect(recordAuthAttempt).toHaveBeenCalledWith('login', false, 'local');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Identifiants invalides' });
    });

    test('devrait rejeter un mot de passe incorrect', async () => {
      req.body = { email: 'test@test.com', password: 'wrongpassword' };

      const mockUser = { _id: '123', email: 'test@test.com' };
      axios.get.mockResolvedValue({ data: mockUser });
      
      // Mock : mot de passe invalide
      axios.post.mockResolvedValue({ data: { valid: false } });

      await authController.login(req, res);

      expect(recordAuthAttempt).toHaveBeenCalledWith('login', false, 'local');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Identifiants invalides' });
    });

    test('devrait gérer les erreurs de connexion', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };

      // Mock : erreur lors de la vérification
      const error = new Error('Erreur service');
      axios.get.mockRejectedValue(error);

      await authController.login(req, res);

      expect(recordAuthAttempt).toHaveBeenCalledWith('login', false, 'local');
      expect(logger.logAuth).toHaveBeenCalledWith('login', false, 'local', 'test@test.com', expect.any(String));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Erreur service' 
      });
    });
  });

  describe('logout', () => {
    test('devrait déconnecter un utilisateur avec succès', async () => {
      req.userData = { email: 'test@test.com' };

      await authController.logout(req, res);

      expect(logger.logAuth).toHaveBeenCalledWith('logout', true, 'local', 'test@test.com');
      expect(recordAuthAttempt).toHaveBeenCalledWith('logout', true, 'local');
      expect(res.json).toHaveBeenCalledWith({ message: 'Déconnexion réussie' });
    });

    test('devrait gérer le cas où userData n\'est pas défini', async () => {
      req.userData = undefined;

      await authController.logout(req, res);

      expect(logger.logAuth).toHaveBeenCalledWith('logout', true, 'local', 'unknown');
      expect(recordAuthAttempt).toHaveBeenCalledWith('logout', true, 'local');
      expect(res.json).toHaveBeenCalledWith({ message: 'Déconnexion réussie' });
    });
  });

  describe('me', () => {
    test('devrait retourner les données utilisateur', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        nom: 'Test',
        prenom: 'User'
      };
      req.userData = { userId: '123' };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.me(req, res);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('devrait retourner 404 si utilisateur non trouvé', async () => {
      req.userData = { userId: '123' };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authController.me(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur non trouvé' });
    });

    test('devrait gérer les erreurs', async () => {
      req.userData = { userId: '123' };
      const error = new Error('Database error');

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      await authController.me(req, res);

      expect(logger.logError).toHaveBeenCalledWith(error, 'AUTH_ME');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Erreur serveur', 
        error: 'Database error' 
      });
    });
  });

  describe('getProfileStatus', () => {
    test('devrait retourner le statut du profil complet', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        nom: 'Test',
        prenom: 'User',
        niveau: 'lycée',
        classe: '1ère',
        authProvider: 'local',
        isProfileComplete: jest.fn().mockReturnValue(true)
      };
      req.userData = { userId: '123' };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.getProfileStatus(req, res);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(mockUser.isProfileComplete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        profileCompleted: true,
        missingFields: [],
        user: expect.objectContaining({
          id: '123',
          email: 'test@test.com'
        })
      }));
    });

    test('devrait retourner le statut du profil incomplet avec champs manquants', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        nom: null,
        prenom: 'User',
        niveau: null,
        classe: '1ère',
        authProvider: 'local',
        isProfileComplete: jest.fn().mockReturnValue(false)
      };
      req.userData = { userId: '123' };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authController.getProfileStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        profileCompleted: false,
        missingFields: ['nom', 'niveau']
      }));
    });

    test('devrait retourner 404 si utilisateur non trouvé', async () => {
      req.userData = { userId: '123' };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authController.getProfileStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur non trouvé' });
    });
  });
});