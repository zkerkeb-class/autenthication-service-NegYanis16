// Mock logger
jest.mock('../src/config/logger', () => ({
  http: jest.fn(),
  logRequest: jest.fn()
}));

const requestLogger = require('../src/middleware/requestLogger');
const logger = require('../src/config/logger');

describe('RequestLogger Middleware - Tests Complets', () => {
  let req, res, next, originalSend;

  beforeEach(() => {
    originalSend = jest.fn();
    req = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1'
    };
    res = {
      statusCode: 200,
      send: originalSend
    };
    next = jest.fn();
    
    jest.clearAllMocks();
    
    // Reset NODE_ENV
    delete process.env.NODE_ENV;
  });

  test('devrait logger les requêtes normales', () => {
    requestLogger(req, res, next);

    expect(logger.http).toHaveBeenCalledWith('GET /test - 127.0.0.1');
    expect(next).toHaveBeenCalled();
  });

  test('ne devrait pas logger les requêtes health', () => {
    req.originalUrl = '/health';
    
    requestLogger(req, res, next);

    expect(logger.http).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('ne devrait pas logger les requêtes metrics', () => {
    req.originalUrl = '/metrics';
    
    requestLogger(req, res, next);

    expect(logger.http).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('devrait modifier la méthode send pour logger le temps de réponse', () => {
    requestLogger(req, res, next);

    expect(typeof res.send).toBe('function');
    expect(res.send).not.toBe(originalSend);
  });

  describe('Response logging', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('devrait logger en développement', () => {
      process.env.NODE_ENV = 'development';
      
      requestLogger(req, res, next);
      
      // Simuler le passage du temps
      jest.advanceTimersByTime(500);
      
      res.send('test data');

      expect(logger.logRequest).toHaveBeenCalledWith(req, res, 500);
      expect(originalSend).toHaveBeenCalledWith('test data');
    });

    test('devrait logger les erreurs en production', () => {
      process.env.NODE_ENV = 'production';
      res.statusCode = 500;
      
      requestLogger(req, res, next);
      
      jest.advanceTimersByTime(100);
      
      res.send('error');

      expect(logger.logRequest).toHaveBeenCalledWith(req, res, 100);
    });

    test('devrait logger les requêtes lentes en production', () => {
      process.env.NODE_ENV = 'production';
      
      requestLogger(req, res, next);
      
      jest.advanceTimersByTime(1500); // > 1000ms
      
      res.send('slow response');

      expect(logger.logRequest).toHaveBeenCalledWith(req, res, 1500);
    });

    test('devrait logger les requêtes auth en production', () => {
      process.env.NODE_ENV = 'production';
      req.originalUrl = '/auth/login';
      
      requestLogger(req, res, next);
      
      jest.advanceTimersByTime(200);
      
      res.send('auth response');

      expect(logger.logRequest).toHaveBeenCalledWith(req, res, 200);
    });

    test('ne devrait pas logger les requêtes rapides et normales en production', () => {
      process.env.NODE_ENV = 'production';
      res.statusCode = 200;
      req.originalUrl = '/api/data';
      
      requestLogger(req, res, next);
      
      jest.advanceTimersByTime(500); // < 1000ms
      
      res.send('normal response');

      expect(logger.logRequest).not.toHaveBeenCalled();
      expect(originalSend).toHaveBeenCalledWith('normal response');
    });

    test('devrait logger les codes de statut 4xx en production', () => {
      process.env.NODE_ENV = 'production';
      res.statusCode = 404;
      
      requestLogger(req, res, next);
      
      jest.advanceTimersByTime(300);
      
      res.send('not found');

      expect(logger.logRequest).toHaveBeenCalledWith(req, res, 300);
    });

    test('devrait préserver le contexte this lors de l\'appel à send', () => {
      requestLogger(req, res, next);
      
      const mockThis = { test: 'context' };
      res.send = res.send.bind(mockThis);
      
      res.send('test');

      expect(originalSend).toHaveBeenCalled();
    });
  });
});
