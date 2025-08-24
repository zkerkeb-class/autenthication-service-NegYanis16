// Mock dotenv avant l'import
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const { config } = require('dotenv');

describe('Env Config - Tests Complets', () => {
  let originalConsoleWarn;

  beforeEach(() => {
    originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  test('devrait charger le module env sans erreur', () => {
    const env = require('../src/config/env');
    
    expect(env).toBeDefined();
    expect(typeof env).toBe('object');
  });

  test('devrait avoir les propriétés de base définies', () => {
    const env = require('../src/config/env');
    
    expect(env).toHaveProperty('PORT');
    expect(env).toHaveProperty('NODE_ENV');
    expect(env).toHaveProperty('CORS_ORIGIN');
    expect(env).toHaveProperty('DB_SERVICE_URL');
    expect(env).toHaveProperty('FRONTEND_URL');
  });

  test('devrait avoir des valeurs par défaut', () => {
    const env = require('../src/config/env');
    
    expect(env.PORT).toBe(3001);
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000');
    expect(env.DB_SERVICE_URL).toBe('http://localhost:3006/api/v1');
    expect(env.FRONTEND_URL).toBe('http://localhost:3000');
  });

  test('devrait être un objet avec les bonnes propriétés', () => {
    const env = require('../src/config/env');
    
    expect(env).toEqual(expect.objectContaining({
      PORT: expect.any(Number),
      NODE_ENV: expect.any(String),
      CORS_ORIGIN: expect.any(String),
      DB_SERVICE_URL: expect.any(String),
      FRONTEND_URL: expect.any(String)
    }));
  });
});
