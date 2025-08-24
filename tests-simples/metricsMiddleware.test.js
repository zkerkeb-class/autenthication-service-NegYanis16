// Mock prometheus avant l'import
jest.mock('prom-client', () => {
  const mockHistogram = {
    labels: jest.fn().mockReturnThis(),
    observe: jest.fn()
  };
  const mockCounter = {
    labels: jest.fn().mockReturnThis(),
    inc: jest.fn()
  };
  const mockGauge = {
    set: jest.fn(),
    labels: jest.fn().mockReturnThis()
  };

  return {
    register: { clear: jest.fn() },
    Histogram: jest.fn(() => mockHistogram),
    Counter: jest.fn(() => mockCounter),
    Gauge: jest.fn(() => mockGauge)
  };
});

const metricsModule = require('../src/middleware/metrics');

describe('Metrics Middleware - Tests Complets', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test',
      route: { path: '/test' }
    };
    res = {
      statusCode: 200,
      on: jest.fn()
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('metricsMiddleware', () => {
    test('devrait configurer le middleware correctement', () => {
      metricsModule.metricsMiddleware(req, res, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(next).toHaveBeenCalled();
    });

    test('devrait enregistrer les métriques HTTP quand la réponse se termine', () => {
      metricsModule.metricsMiddleware(req, res, next);

      // Simuler l'événement finish
      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(metricsModule.httpRequestDurationMicroseconds.labels).toHaveBeenCalledWith('GET', '/test', 200);
      expect(metricsModule.httpRequestTotal.labels).toHaveBeenCalledWith('GET', '/test', 200);
    });

    test('devrait utiliser req.path si req.route n\'existe pas', () => {
      req.route = undefined;
      req.path = '/fallback';

      metricsModule.metricsMiddleware(req, res, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(metricsModule.httpRequestDurationMicroseconds.labels).toHaveBeenCalledWith('GET', '/fallback', 200);
    });
  });

  describe('recordAuthAttempt', () => {
    test('devrait enregistrer une tentative d\'authentification réussie', () => {
      metricsModule.recordAuthAttempt('login', true, 'local');

      expect(metricsModule.authAttemptsTotal.labels).toHaveBeenCalledWith('login', 'true', 'local');
      expect(metricsModule.authAttemptsTotal.inc).toHaveBeenCalled();
    });

    test('devrait enregistrer une tentative d\'authentification échouée', () => {
      metricsModule.recordAuthAttempt('register', false, 'google');

      expect(metricsModule.authAttemptsTotal.labels).toHaveBeenCalledWith('register', 'false', 'google');
      expect(metricsModule.authAttemptsTotal.inc).toHaveBeenCalled();
    });

    test('devrait utiliser "local" comme provider par défaut', () => {
      metricsModule.recordAuthAttempt('login', true);

      expect(metricsModule.authAttemptsTotal.labels).toHaveBeenCalledWith('login', 'true', 'local');
    });
  });

  describe('recordAuthDuration', () => {
    test('devrait enregistrer la durée d\'authentification', () => {
      metricsModule.recordAuthDuration('login', 'local', 1.5);

      expect(metricsModule.authDurationSeconds.labels).toHaveBeenCalledWith('login', 'local');
      expect(metricsModule.authDurationSeconds.observe).toHaveBeenCalledWith(1.5);
    });

    test('devrait utiliser "local" comme provider par défaut', () => {
      metricsModule.recordAuthDuration('register', undefined, 2.3);

      expect(metricsModule.authDurationSeconds.labels).toHaveBeenCalledWith('register', 'local');
      expect(metricsModule.authDurationSeconds.observe).toHaveBeenCalledWith(2.3);
    });
  });

  describe('updateActiveUsers', () => {
    test('devrait mettre à jour le nombre d\'utilisateurs actifs', () => {
      metricsModule.updateActiveUsers(42);

      expect(metricsModule.activeUsers.set).toHaveBeenCalledWith(42);
    });

    test('devrait accepter zéro utilisateur actif', () => {
      metricsModule.updateActiveUsers(0);

      expect(metricsModule.activeUsers.set).toHaveBeenCalledWith(0);
    });
  });

  describe('Module exports', () => {
    test('devrait exporter tous les éléments nécessaires', () => {
      expect(metricsModule.register).toBeDefined();
      expect(metricsModule.metricsMiddleware).toBeDefined();
      expect(metricsModule.recordAuthAttempt).toBeDefined();
      expect(metricsModule.recordAuthDuration).toBeDefined();
      expect(metricsModule.updateActiveUsers).toBeDefined();
      expect(metricsModule.httpRequestDurationMicroseconds).toBeDefined();
      expect(metricsModule.httpRequestTotal).toBeDefined();
      expect(metricsModule.authAttemptsTotal).toBeDefined();
      expect(metricsModule.authDurationSeconds).toBeDefined();
      expect(metricsModule.activeUsers).toBeDefined();
    });
  });
});
