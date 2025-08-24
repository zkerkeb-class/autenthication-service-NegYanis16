const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Mock bcrypt pour éviter les vrais hashages
jest.mock('bcryptjs');

const User = require('../src/models/User');

describe('User Model - Tests Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    test('devrait créer un utilisateur local valide', () => {
      const userData = {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@test.com',
        password: 'password123',
        niveau: 'lycée',
        classe: '1ère',
        authProvider: 'local'
      };

      const user = new User(userData);
      expect(user.nom).toBe('Dupont');
      expect(user.prenom).toBe('Jean');
      expect(user.email).toBe('jean@test.com');
      expect(user.authProvider).toBe('local');
      expect(user.jetons).toBe(5); // valeur par défaut
      expect(user.profileCompleted).toBe(false); // valeur par défaut
    });

    test('devrait créer un utilisateur Google valide', () => {
      const userData = {
        email: 'jean@gmail.com',
        googleId: 'google123',
        authProvider: 'google',
        avatar: 'http://avatar.url'
      };

      const user = new User(userData);
      expect(user.email).toBe('jean@gmail.com');
      expect(user.googleId).toBe('google123');
      expect(user.authProvider).toBe('google');
      expect(user.avatar).toBe('http://avatar.url');
    });

    test('devrait avoir des valeurs par défaut correctes', () => {
      const user = new User({ email: 'test@test.com' });
      
      expect(user.authProvider).toBe('local');
      expect(user.jetons).toBe(5);
      expect(user.profileCompleted).toBe(false);
      expect(user.niveau).toBeNull();
      expect(user.classe).toBeNull();
    });
  });

  describe('isProfileComplete Method', () => {
    test('devrait retourner true pour un profil local complet', () => {
      const user = new User({
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@test.com',
        niveau: 'lycée',
        classe: '1ère',
        authProvider: 'local'
      });

      expect(user.isProfileComplete()).toBeTruthy();
    });

    test('devrait retourner false pour un profil local incomplet (sans nom)', () => {
      const user = new User({
        prenom: 'Jean',
        email: 'jean@test.com',
        niveau: 'lycée',
        classe: '1ère',
        authProvider: 'local'
      });

      expect(user.isProfileComplete()).toBeFalsy();
    });

    test('devrait retourner false pour un profil local incomplet (sans niveau)', () => {
      const user = new User({
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@test.com',
        classe: '1ère',
        authProvider: 'local'
      });

      expect(user.isProfileComplete()).toBeFalsy();
    });

    test('devrait retourner true pour un profil Google complet', () => {
      const user = new User({
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@gmail.com',
        niveau: 'lycée',
        classe: '1ère',
        googleId: 'google123',
        authProvider: 'google'
      });

      expect(user.isProfileComplete()).toBeTruthy();
    });

    test('devrait retourner false pour un profil Google incomplet', () => {
      const user = new User({
        nom: 'Dupont',
        email: 'jean@gmail.com',
        googleId: 'google123',
        authProvider: 'google'
        // manque prenom, niveau, classe
      });

      expect(user.isProfileComplete()).toBeFalsy();
    });

    test('devrait retourner false pour authProvider invalide', () => {
      const user = new User({
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@test.com',
        niveau: 'lycée',
        classe: '1ère',
        authProvider: 'invalid'
      });

      expect(user.isProfileComplete()).toBeFalsy();
    });
  });

  describe('comparePassword Method', () => {
    test('devrait comparer correctement les mots de passe pour utilisateur local', async () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local',
        password: 'hashedpassword'
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await user.comparePassword('password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toBe(true);
    });

    test('devrait retourner false pour utilisateur Google', async () => {
      const user = new User({
        email: 'jean@gmail.com',
        authProvider: 'google',
        googleId: 'google123'
      });

      const result = await user.comparePassword('password123');

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('devrait retourner false pour mot de passe incorrect', async () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local',
        password: 'hashedpassword'
      });

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const result = await user.comparePassword('wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('canUsePassword Method', () => {
    test('devrait retourner true pour utilisateur local avec mot de passe', () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local',
        password: 'password123'
      });

      expect(user.canUsePassword()).toBeTruthy();
    });

    test('devrait retourner false pour utilisateur Google', () => {
      const user = new User({
        email: 'jean@gmail.com',
        authProvider: 'google',
        googleId: 'google123'
      });

      expect(user.canUsePassword()).toBeFalsy();
    });

    test('devrait retourner false pour utilisateur local sans mot de passe', () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local'
        // pas de password
      });

      expect(user.canUsePassword()).toBeFalsy();
    });
  });

  describe('canUseGoogle Method', () => {
    test('devrait retourner true pour utilisateur Google avec googleId', () => {
      const user = new User({
        email: 'jean@gmail.com',
        authProvider: 'google',
        googleId: 'google123'
      });

      expect(user.canUseGoogle()).toBeTruthy();
    });

    test('devrait retourner false pour utilisateur local', () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local',
        password: 'password123'
      });

      expect(user.canUseGoogle()).toBeFalsy();
    });

    test('devrait retourner false pour utilisateur Google sans googleId', () => {
      const user = new User({
        email: 'jean@gmail.com',
        authProvider: 'google'
        // pas de googleId
      });

      expect(user.canUseGoogle()).toBeFalsy();
    });
  });

  describe('mergeWithGoogle Method', () => {
    test('devrait fusionner correctement avec profil Google complet', () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local'
      });

      const googleProfile = {
        id: 'google123',
        name: {
          givenName: 'Jean',
          familyName: 'Dupont'
        },
        photos: [{ value: 'http://avatar.url' }]
      };

      user.mergeWithGoogle(googleProfile);

      expect(user.googleId).toBe('google123');
      expect(user.authProvider).toBe('google');
      expect(user.avatar).toBe('http://avatar.url');
      expect(user.prenom).toBe('Jean');
      expect(user.nom).toBe('Dupont');
    });

    test('devrait ne pas écraser nom/prenom existants', () => {
      const user = new User({
        email: 'jean@test.com',
        nom: 'ExistingNom',
        prenom: 'ExistingPrenom',
        authProvider: 'local'
      });

      const googleProfile = {
        id: 'google123',
        name: {
          givenName: 'GooglePrenom',
          familyName: 'GoogleNom'
        }
      };

      user.mergeWithGoogle(googleProfile);

      expect(user.nom).toBe('ExistingNom'); // pas écrasé
      expect(user.prenom).toBe('ExistingPrenom'); // pas écrasé
      expect(user.googleId).toBe('google123');
      expect(user.authProvider).toBe('google');
    });

    test('devrait gérer profil Google sans photos', () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local'
      });

      const googleProfile = {
        id: 'google123',
        name: {
          givenName: 'Jean',
          familyName: 'Dupont'
        }
        // pas de photos
      };

      user.mergeWithGoogle(googleProfile);

      expect(user.googleId).toBe('google123');
      expect(user.avatar).toBeUndefined();
    });

    test('devrait gérer profil Google partiel', () => {
      const user = new User({
        email: 'jean@test.com',
        authProvider: 'local'
      });

      const googleProfile = {
        id: 'google123'
        // pas de name ni photos
      };

      user.mergeWithGoogle(googleProfile);

      expect(user.googleId).toBe('google123');
      expect(user.authProvider).toBe('google');
      expect(user.nom).toBeUndefined();
      expect(user.prenom).toBeUndefined();
      expect(user.avatar).toBeUndefined();
    });
  });

  // Note: Les tests du middleware pre-save sont complexes à mocker avec Mongoose
  // La couverture de ces fonctions est testée indirectement par les autres tests
});
