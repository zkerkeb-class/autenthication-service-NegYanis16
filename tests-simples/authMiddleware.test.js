const jwt = require('jsonwebtoken');

// Mock des dépendances
jest.mock('jsonwebtoken');
jest.mock('../src/config/env', () => ({
  JWT_SECRET: 'test-jwt-secret'
}));

const authMiddleware = require('../src/middleware/authMiddleware');

describe('AuthMiddleware - Tests Complets', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      isAuthenticated: jest.fn(),
      userData: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    
    // Reset des mocks
    jest.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    test('devrait passer si utilisateur authentifié via Google', () => {
      req.isAuthenticated.mockReturnValue(true);

      authMiddleware.isAuthenticated(req, res, next);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('devrait rejeter si utilisateur non authentifié', () => {
      req.isAuthenticated.mockReturnValue(false);

      authMiddleware.isAuthenticated(req, res, next);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentification Google requise' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireJWT', () => {
    test('devrait passer avec un token JWT valide', () => {
      req.headers.authorization = 'Bearer valid-jwt-token';
      const mockDecodedToken = { userId: 'user123' };
      
      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);

      authMiddleware.requireJWT(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'test-jwt-secret');
      expect(req.userData).toEqual({ userId: 'user123' });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('devrait rejeter si aucun header authorization', () => {
      req.headers = {};

      authMiddleware.requireJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token JWT requis' });
      expect(next).not.toHaveBeenCalled();
    });

    test('devrait rejeter si token JWT invalide', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware.requireJWT(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-jwt-secret');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token JWT requis' });
      expect(next).not.toHaveBeenCalled();
    });

    test('devrait rejeter si format authorization incorrect', () => {
      req.headers.authorization = 'InvalidFormat';

      authMiddleware.requireJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token JWT requis' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    test('devrait passer avec authentification Google', () => {
      req.isAuthenticated.mockReturnValue(true);

      authMiddleware.requireAuth(req, res, next);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('devrait passer avec token JWT valide si pas Google auth', () => {
      req.isAuthenticated.mockReturnValue(false);
      req.headers.authorization = 'Bearer valid-jwt-token';
      const mockDecodedToken = { userId: 'user123' };
      
      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);

      authMiddleware.requireAuth(req, res, next);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'test-jwt-secret');
      expect(req.userData).toEqual({ userId: 'user123' });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('devrait rejeter si ni Google ni JWT valides', () => {
      req.isAuthenticated.mockReturnValue(false);
      req.headers = {};

      authMiddleware.requireAuth(req, res, next);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentification requise (JWT ou Google)' });
      expect(next).not.toHaveBeenCalled();
    });

    test('devrait rejeter si Google auth false et token JWT invalide', () => {
      req.isAuthenticated.mockReturnValue(false);
      req.headers.authorization = 'Bearer invalid-token';
      
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware.requireAuth(req, res, next);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-jwt-secret');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentification requise (JWT ou Google)' });
      expect(next).not.toHaveBeenCalled();
    });

    test('devrait rejeter si Google auth false et aucun token', () => {
      req.isAuthenticated.mockReturnValue(false);
      req.headers.authorization = undefined;

      authMiddleware.requireAuth(req, res, next);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentification requise (JWT ou Google)' });
      expect(next).not.toHaveBeenCalled();
    });

    test('devrait gérer authorization header malformé', () => {
      req.isAuthenticated.mockReturnValue(false);
      req.headers.authorization = 'Bearer';

      authMiddleware.requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentification requise (JWT ou Google)' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
