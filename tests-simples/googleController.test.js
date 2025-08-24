const passport = require('passport');

// Mock des dépendances
jest.mock('passport', () => ({
  authenticate: jest.fn(() => jest.fn())
}));
jest.mock('../src/config/logger');

const googleController = require('../src/controllers/googleController');
const logger = require('../src/config/logger');

describe('GoogleController - Tests Complets', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      session: {
        destroy: jest.fn()
      },
      login: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    
    // Reset des mocks
    jest.clearAllMocks();

    // Mock logger
    logger.logError = jest.fn();
    logger.logAuth = jest.fn();
    logger.warn = jest.fn();
  });

  describe('googleAuth', () => {
    test('devrait être une fonction', () => {
      // googleAuth est directement exports.googleAuth = passport.authenticate('google');
      // Avec notre mock, passport.authenticate retourne une fonction
      expect(typeof googleController.googleAuth).toBe('function');
    });
  });

  describe('googleCallback', () => {
    test('devrait rediriger vers le dashboard pour un profil complet', () => {
      const mockUser = {
        email: 'test@test.com',
        niveau: 'lycée',
        classe: '1ère',
        token: 'fake-jwt-token'
      };

      // Mock passport.authenticate qui retourne une fonction
      const mockAuthFunction = jest.fn((req, res, next) => {
        // Simuler le callback avec succès
        const callback = passport.authenticate.mock.calls[0][1];
        callback(null, mockUser, null);
      });
      
      passport.authenticate = jest.fn().mockReturnValue(mockAuthFunction);

      // Mock req.login qui appelle son callback avec succès
      req.login = jest.fn((user, callback) => callback(null));

      googleController.googleCallback(req, res, next);

      expect(passport.authenticate).toHaveBeenCalledWith('google', expect.any(Function));
      expect(req.login).toHaveBeenCalledWith(mockUser, expect.any(Function));
      expect(logger.logAuth).toHaveBeenCalledWith(
        'google_callback', 
        true, 
        'google', 
        'test@test.com',
        expect.stringContaining('Profile complete: 1ère')
      );
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/dashboard?token=fake-jwt-token'));
    });

    test('devrait rediriger vers complete-profile pour un profil incomplet', () => {
      const mockUser = {
        email: 'test@test.com',
        niveau: null,
        classe: null,
        token: 'fake-jwt-token'
      };

      const mockAuthFunction = jest.fn((req, res, next) => {
        const callback = passport.authenticate.mock.calls[0][1];
        callback(null, mockUser, null);
      });
      
      passport.authenticate = jest.fn().mockReturnValue(mockAuthFunction);
      req.login = jest.fn((user, callback) => callback(null));

      googleController.googleCallback(req, res, next);

      expect(logger.logAuth).toHaveBeenCalledWith(
        'google_callback', 
        true, 
        'google', 
        'test@test.com',
        expect.stringContaining('Profile complete: null')
      );
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/complete-profile?token=fake-jwt-token'));
    });

    test('devrait gérer les erreurs d\'authentification', () => {
      const error = new Error('Authentication failed');

      const mockAuthFunction = jest.fn((req, res, next) => {
        const callback = passport.authenticate.mock.calls[0][1];
        callback(error, null, null);
      });
      
      passport.authenticate = jest.fn().mockReturnValue(mockAuthFunction);

      googleController.googleCallback(req, res, next);

      expect(logger.logError).toHaveBeenCalledWith(error, 'GOOGLE_AUTH_ERROR');
      expect(logger.logAuth).toHaveBeenCalledWith(
        'google_callback', 
        false, 
        'google', 
        'unknown',
        expect.stringContaining('Error: Authentication failed')
      );
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/login?error=authentication_failed'));
    });

    test('devrait gérer l\'absence d\'utilisateur', () => {
      const mockAuthFunction = jest.fn((req, res, next) => {
        const callback = passport.authenticate.mock.calls[0][1];
        callback(null, null, null);
      });
      
      passport.authenticate = jest.fn().mockReturnValue(mockAuthFunction);

      googleController.googleCallback(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith('Aucun utilisateur retourné par Google OAuth');
      expect(logger.logAuth).toHaveBeenCalledWith(
        'google_callback', 
        false, 
        'google', 
        'unknown',
        '- No user returned'
      );
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/login?error=no_user'));
    });

    test('devrait gérer les erreurs de session', () => {
      const mockUser = { email: 'test@test.com', token: 'fake-token' };
      const sessionError = new Error('Session error');

      const mockAuthFunction = jest.fn((req, res, next) => {
        const callback = passport.authenticate.mock.calls[0][1];
        callback(null, mockUser, null);
      });
      
      passport.authenticate = jest.fn().mockReturnValue(mockAuthFunction);
      req.login = jest.fn((user, callback) => callback(sessionError));

      googleController.googleCallback(req, res, next);

      expect(logger.logError).toHaveBeenCalledWith(sessionError, 'GOOGLE_SESSION_ERROR');
      expect(logger.logAuth).toHaveBeenCalledWith(
        'google_session', 
        false, 
        'google', 
        'test@test.com',
        expect.stringContaining('Session error: Session error')
      );
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/login?error=session_error'));
    });
  });

  describe('logout', () => {
    test('devrait déconnecter un utilisateur avec succès', () => {
      req.user = { email: 'test@test.com' };
      req.logout = jest.fn((callback) => callback(null));
      req.session.destroy = jest.fn((callback) => callback(null));

      googleController.logout(req, res, next);

      expect(req.logout).toHaveBeenCalled();
      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Déconnexion réussie' 
      });
    });

    test('devrait retourner 401 si aucun utilisateur connecté', () => {
      req.user = null;

      googleController.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: 'Aucun utilisateur connecté' 
      });
    });

    test('devrait gérer les erreurs de déconnexion', () => {
      req.user = { email: 'test@test.com' };
      const logoutError = new Error('Logout error');
      req.logout = jest.fn((callback) => callback(logoutError));

      googleController.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: 'Erreur lors de la déconnexion' 
      });
    });

    test('devrait gérer les erreurs de destruction de session', () => {
      req.user = { email: 'test@test.com' };
      req.logout = jest.fn((callback) => callback(null));
      const sessionError = new Error('Session destroy error');
      req.session.destroy = jest.fn((callback) => callback(sessionError));

      googleController.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        success: false, 
        message: 'Erreur lors de la destruction de la session' 
      });
    });
  });

  describe('getAuthStatus', () => {
    test('devrait retourner le statut authentifié', () => {
      const mockUser = { email: 'test@test.com', nom: 'Test' };
      req.user = mockUser;
      req.isAuthenticated = jest.fn().mockReturnValue(true);

      googleController.getAuthStatus(req, res);

      expect(req.isAuthenticated).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        isAuthenticated: true,
        user: mockUser
      });
    });

    test('devrait retourner le statut non authentifié', () => {
      req.isAuthenticated = jest.fn().mockReturnValue(false);

      googleController.getAuthStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        isAuthenticated: false,
        user: null
      });
    });
  });
});
