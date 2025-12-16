const { checkUserInput } = require('../backend/check-input.js');

describe('checkUserInput', () => {
  
  describe('isValidUsername', () => {
    test('devrait retourner true pour un nom d\'utilisateur de 5 caractères', () => {
      expect(checkUserInput.isValidUsername('abcde')).toBe(true);
    });

    test('devrait retourner true pour un nom d\'utilisateur de plus de 5 caractères', () => {
      expect(checkUserInput.isValidUsername('username123')).toBe(true);
    });

    test('devrait retourner false pour un nom d\'utilisateur de 4 caractères', () => {
      expect(checkUserInput.isValidUsername('abcd')).toBe(false);
    });

    test('devrait retourner false pour un nom d\'utilisateur vide', () => {
      expect(checkUserInput.isValidUsername('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    test('devrait retourner true pour un mot de passe de 8 caractères', () => {
      expect(checkUserInput.isValidPassword('password')).toBe(true);
    });

    test('devrait retourner true pour un mot de passe de plus de 8 caractères', () => {
      expect(checkUserInput.isValidPassword('motdepasse123')).toBe(true);
    });

    test('devrait retourner false pour un mot de passe de 7 caractères', () => {
      expect(checkUserInput.isValidPassword('passwor')).toBe(false);
    });

    test('devrait retourner false pour un mot de passe vide', () => {
      expect(checkUserInput.isValidPassword('')).toBe(false);
    });
  });

  describe('isValidSellAddress', () => {
    test('devrait retourner true pour une adresse de 15 caractères', () => {
      expect(checkUserInput.isValidSellAddress('123 Rue Example')).toBe(true);
    });

    test('devrait retourner true pour une adresse de plus de 15 caractères', () => {
      expect(checkUserInput.isValidSellAddress('123 Rue de la République')).toBe(true);
    });

    test('devrait retourner false pour une adresse de 14 caractères', () => {
      expect(checkUserInput.isValidSellAddress('123 Rue Examp')).toBe(false);
    });

    test('devrait retourner false pour une adresse vide', () => {
      expect(checkUserInput.isValidSellAddress('')).toBe(false);
    });
  });

  describe('isValidSellTitle', () => {
    test('devrait retourner true pour un titre de 3 caractères', () => {
      expect(checkUserInput.isValidSellTitle('abc')).toBe(true);
    });

    test('devrait retourner true pour un titre de plus de 3 caractères', () => {
      expect(checkUserInput.isValidSellTitle('Mon Titre')).toBe(true);
    });

    test('devrait retourner false pour un titre de 2 caractères', () => {
      expect(checkUserInput.isValidSellTitle('ab')).toBe(false);
    });

    test('devrait retourner false pour un titre vide', () => {
      expect(checkUserInput.isValidSellTitle('')).toBe(false);
    });
  });

  describe('isValidSellDescription', () => {
    test('devrait retourner true pour une description de 10 caractères', () => {
      expect(checkUserInput.isValidSellDescription('1234567890')).toBe(true);
    });

    test('devrait retourner true pour une description de plus de 10 caractères', () => {
      expect(checkUserInput.isValidSellDescription('Ceci est une description valide')).toBe(true);
    });

    test('devrait retourner false pour une description de 9 caractères', () => {
      expect(checkUserInput.isValidSellDescription('123456789')).toBe(false);
    });

    test('devrait retourner false pour une description vide', () => {
      expect(checkUserInput.isValidSellDescription('')).toBe(false);
    });
  });

  describe('isValidSellPrice', () => {
    test('devrait retourner true pour un prix valide (nombre positif)', () => {
      expect(checkUserInput.isValidSellPrice('10.50')).toBe(true);
    });

    test('devrait retourner true pour un prix entier positif', () => {
      expect(checkUserInput.isValidSellPrice('100')).toBe(true);
    });

    test('devrait retourner false pour un prix de 0', () => {
      expect(checkUserInput.isValidSellPrice('0')).toBe(false);
    });

    test('devrait retourner false pour un prix négatif', () => {
      expect(checkUserInput.isValidSellPrice('-10')).toBe(false);
    });

    test('devrait retourner false pour une chaîne vide', () => {
      expect(checkUserInput.isValidSellPrice('')).toBe(false);
    });

    test('devrait retourner false pour une chaîne non numérique', () => {
      expect(checkUserInput.isValidSellPrice('abc')).toBe(false);
    });
  });

  describe('isValidSellQuantity', () => {
    test('devrait retourner true pour une quantité entière positive', () => {
      expect(checkUserInput.isValidSellQuantity('5')).toBe(true);
    });

    test('devrait retourner true pour une grande quantité entière', () => {
      expect(checkUserInput.isValidSellQuantity('1000')).toBe(true);
    });

    test('devrait retourner false pour une quantité décimale', () => {
      expect(checkUserInput.isValidSellQuantity('5.5')).toBe(false);
    });

    test('devrait retourner false pour une quantité de 0', () => {
      expect(checkUserInput.isValidSellQuantity('0')).toBe(false);
    });

    test('devrait retourner false pour une quantité négative', () => {
      expect(checkUserInput.isValidSellQuantity('-5')).toBe(false);
    });

    test('devrait retourner false pour une chaîne vide', () => {
      expect(checkUserInput.isValidSellQuantity('')).toBe(false);
    });

    test('devrait retourner false pour une chaîne non numérique', () => {
      expect(checkUserInput.isValidSellQuantity('abc')).toBe(false);
    });
  });

});