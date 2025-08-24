// Mock winston et env
jest.mock('winston', () => {
  const mockTransport = jest.fn();
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    http: jest.fn(),
    debug: jest.fn()
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    addColors: jest.fn(),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
      json: jest.fn()
    },
    transports: {
      Console: mockTransport,
      File: mockTransport
    }
  };
});

jest.mock('../src/config/env', () => ({
  NODE_ENV: 'test'
}));

const winston = require('winston');

describe('Logger Config - Tests Complets', () => {
  let logger;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear module cache pour forcer un nouveau require
    delete require.cache[require.resolve('../src/config/logger')];
  });

  describe('Configuration de base', () => {
    test('devrait charger le module logger sans erreur', () => {
      const logger = require('../src/config/logger');
      
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    test('devrait avoir les bonnes méthodes de logging', () => {
      const logger = require('../src/config/logger');

      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('http');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('logRequest');
      expect(logger).toHaveProperty('logAuth');
      expect(logger).toHaveProperty('logError');
    });
  });

  describe('Fonctions utilitaires', () => {
    beforeEach(() => {
      logger = require('../src/config/logger');
    });

    describe('logRequest', () => {
      test('devrait logger les requêtes réussies en http', () => {
        const req = {
          method: 'GET',
          originalUrl: '/api/test',
          ip: '127.0.0.1'
        };
        const res = { statusCode: 200 };
        const responseTime = 150;

        logger.logRequest(req, res, responseTime);

        expect(logger.http).toHaveBeenCalledWith('GET /api/test - 200 - 150ms - 127.0.0.1');
        expect(logger.error).not.toHaveBeenCalled();
      });

      test('devrait logger les erreurs 4xx en error', () => {
        const req = {
          method: 'POST',
          originalUrl: '/api/login',
          ip: '192.168.1.1'
        };
        const res = { statusCode: 404 };
        const responseTime = 50;

        logger.logRequest(req, res, responseTime);

        expect(logger.error).toHaveBeenCalledWith('POST /api/login - 404 - 50ms - 192.168.1.1');
        expect(logger.http).not.toHaveBeenCalled();
      });

      test('devrait logger les erreurs 5xx en error', () => {
        const req = {
          method: 'PUT',
          originalUrl: '/api/update',
          ip: '10.0.0.1'
        };
        const res = { statusCode: 500 };
        const responseTime = 2000;

        logger.logRequest(req, res, responseTime);

        expect(logger.error).toHaveBeenCalledWith('PUT /api/update - 500 - 2000ms - 10.0.0.1');
      });
    });

    describe('logAuth', () => {
      test('devrait logger les authentifications réussies en info', () => {
        logger.logAuth('login', true, 'local', 'test@example.com', '- User details');

        expect(logger.info).toHaveBeenCalledWith(
          'AUTH LOGIN SUCCESS - Provider: local - Email: test@example.com - User details'
        );
        expect(logger.warn).not.toHaveBeenCalled();
      });

      test('devrait logger les authentifications échouées en warn', () => {
        logger.logAuth('register', false, 'google', 'fail@example.com', '- Error details');

        expect(logger.warn).toHaveBeenCalledWith(
          'AUTH REGISTER FAILED - Provider: google - Email: fail@example.com - Error details'
        );
        expect(logger.info).not.toHaveBeenCalled();
      });

      test('devrait gérer les emails undefined', () => {
        logger.logAuth('logout', true, 'local', undefined);

        expect(logger.info).toHaveBeenCalledWith(
          'AUTH LOGOUT SUCCESS - Provider: local - Email: unknown '
        );
      });

      test('devrait gérer les détails vides', () => {
        logger.logAuth('login', false, 'local', 'test@example.com');

        expect(logger.warn).toHaveBeenCalledWith(
          'AUTH LOGIN FAILED - Provider: local - Email: test@example.com '
        );
      });

      test('devrait convertir l\'action en majuscules', () => {
        logger.logAuth('password_reset', true, 'local', 'test@example.com');

        expect(logger.info).toHaveBeenCalledWith(
          'AUTH PASSWORD_RESET SUCCESS - Provider: local - Email: test@example.com '
        );
      });
    });

    describe('logError', () => {
      test('devrait logger les erreurs avec contexte', () => {
        const error = new Error('Test error message');
        error.stack = 'Error stack trace';

        logger.logError(error, 'AUTH_SERVICE');

        expect(logger.error).toHaveBeenCalledWith(
          'ERROR [AUTH_SERVICE]: Test error message',
          expect.objectContaining({
            stack: 'Error stack trace',
            context: 'AUTH_SERVICE',
            timestamp: expect.any(String)
          })
        );
      });

      test('devrait logger les erreurs sans contexte', () => {
        const error = new Error('Generic error');
        error.stack = 'Generic stack';

        logger.logError(error);

        expect(logger.error).toHaveBeenCalledWith(
          'ERROR : Generic error',
          expect.objectContaining({
            stack: 'Generic stack',
            context: '',
            timestamp: expect.any(String)
          })
        );
      });

      test('devrait inclure un timestamp ISO', () => {
        const error = new Error('Time test');
        const fixedTime = '2023-01-01T12:00:00.000Z';
        
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(fixedTime);

        logger.logError(error, 'TIME_TEST');

        expect(logger.error).toHaveBeenCalledWith(
          'ERROR [TIME_TEST]: Time test',
          expect.objectContaining({
            timestamp: fixedTime
          })
        );

        Date.prototype.toISOString.mockRestore();
      });
    });
  });
});
