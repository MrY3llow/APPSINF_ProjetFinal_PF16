const { categoryData, filter } = require('../backend/filter.js');

describe('categoryData', () => {
  test('contient toutes les catégories attendues', () => {
    expect(categoryData).toHaveProperty('Véhicule');
    expect(categoryData).toHaveProperty('Immobilier');
    expect(categoryData).toHaveProperty('Électronique');
    expect(categoryData).toHaveProperty('Vêtements');
    expect(categoryData).toHaveProperty('Divers');
  });

  test('la catégorie Véhicule contient les bons champs', () => {
    expect(categoryData.Véhicule).toHaveLength(6);
    expect(categoryData.Véhicule[0].name).toBe('Marque');
    expect(categoryData.Véhicule[0].type).toBe('select');
  });

  test('la catégorie Divers est vide', () => {
    expect(categoryData.Divers).toEqual([]);
  });
});

describe('filter function', () => {
  const mockSells = [
    { id: 1, category: 'Véhicule', price: 15000, filter: { Marque: 'Toyota', Couleur: 'Rouge' } },
    { id: 2, category: 'Véhicule', price: 25000, filter: { Marque: 'Tesla', Couleur: 'Blanc' } },
    { id: 3, category: 'Immobilier', price: 200000, filter: { Type: 'Appartement' } },
    { id: 4, category: 'Électronique', price: 800, filter: { Marque: 'Apple', État: 'Neuf' } },
    { id: 5, category: 'Vêtements', price: 50, filter: { Type: 'Pantalon', Taille: 'M' } },
    { id: 6, category: 'Véhicule', price: 10000, filter: { Marque: 'Renaud', Couleur: 'Bleu' } },
  ];

  describe('sans aucun filtre', () => {
    test('retourne toutes les ventes', () => {
      const result = filter(mockSells);
      expect(result).toHaveLength(6);
      expect(result).toEqual(mockSells);
    });
  });

  describe('filtre par catégorie', () => {
    test('filtre les véhicules uniquement', () => {
      const result = filter(mockSells, undefined, undefined, 'Véhicule');
      expect(result).toHaveLength(3);
      expect(result.every(s => s.category === 'Véhicule')).toBe(true);
    });

    test('filtre l\'immobilier uniquement', () => {
      const result = filter(mockSells, undefined, undefined, 'Immobilier');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    test('retourne un tableau vide si aucune vente correspond', () => {
      const result = filter(mockSells, undefined, undefined, 'Divers');
      expect(result).toEqual([]);
    });
  });

  describe('filtre par prix minimum', () => {
    test('filtre les ventes avec prix >= 15000', () => {
      const result = filter(mockSells, 15000);
      expect(result).toHaveLength(3);
      expect(result.every(s => s.price >= 15000)).toBe(true);
    });

    test('filtre les ventes avec prix >= 1000', () => {
      const result = filter(mockSells, 1000);
      expect(result).toHaveLength(4);
      expect(result.map(s => s.id).sort()).toEqual([1, 2, 3, 6]);
    });
  });

  describe('filtre par prix maximum', () => {
    test('filtre les ventes avec prix <= 1000', () => {
      const result = filter(mockSells, undefined, 1000);
      expect(result).toHaveLength(2);
      expect(result.every(s => s.price <= 1000)).toBe(true);
    });

    test('filtre les ventes avec prix <= 15000', () => {
      const result = filter(mockSells, undefined, 15000);
      expect(result).toHaveLength(4);
    });
  });

  describe('filtre par fourchette de prix', () => {
    test('filtre les ventes entre 1000 et 20000', () => {
      const result = filter(mockSells, 1000, 20000);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id).sort()).toEqual([1, 6]);
    });

    test('filtre les ventes entre 100 et 1000', () => {
      const result = filter(mockSells, 100, 1000);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(4);
    });
  });

  describe('filtre par catégorie et prix', () => {
    test('combine catégorie Véhicule et prix max 20000', () => {
      const result = filter(mockSells, undefined, 20000, 'Véhicule');
      expect(result).toHaveLength(2);
      expect(result.every(s => s.category === 'Véhicule' && s.price <= 20000)).toBe(true);
    });

    test('combine catégorie et fourchette de prix', () => {
      const result = filter(mockSells, 10000, 20000, 'Véhicule');
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id).sort()).toEqual([1, 6]);
    });
  });

  describe('filtre par propriétés spécifiques de catégorie', () => {
    test('filtre par Marque Toyota', () => {
      const categoryFilters = { Marque: ['Toyota'] };
      const result = filter(mockSells, undefined, undefined, 'Véhicule', categoryFilters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('filtre par plusieurs marques', () => {
      const categoryFilters = { Marque: ['Toyota', 'Tesla'] };
      const result = filter(mockSells, undefined, undefined, 'Véhicule', categoryFilters);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id).sort()).toEqual([1, 2]);
    });

    test('filtre par couleur Blanc', () => {
      const categoryFilters = { Couleur: ['Blanc'] };
      const result = filter(mockSells, undefined, undefined, 'Véhicule', categoryFilters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test('filtre par plusieurs propriétés (Marque ET Couleur)', () => {
      const categoryFilters = { Marque: ['Toyota'], Couleur: ['Rouge'] };
      const result = filter(mockSells, undefined, undefined, 'Véhicule', categoryFilters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('retourne vide si propriété non présente dans la vente', () => {
      const categoryFilters = { Carburant: ['Essence'] };
      const result = filter(mockSells, undefined, undefined, 'Véhicule', categoryFilters);
      expect(result).toEqual([]);
    });

    test('retourne vide si valeur ne correspond pas', () => {
      const categoryFilters = { Marque: ['Volovo'] };
      const result = filter(mockSells, undefined, undefined, 'Véhicule', categoryFilters);
      expect(result).toEqual([]);
    });
  });

  describe('combinaison de tous les filtres', () => {
    test('filtre catégorie + prix + propriétés spécifiques', () => {
      const categoryFilters = { Marque: ['Toyota', 'Renaud'] };
      const result = filter(mockSells, 10000, 20000, 'Véhicule', categoryFilters);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id).sort()).toEqual([1, 6]);
    });

    test('aucune vente ne correspond à tous les critères', () => {
      const categoryFilters = { Marque: ['Tesla'] };
      const result = filter(mockSells, 10000, 20000, 'Véhicule', categoryFilters);
      expect(result).toEqual([]);
    });
  });

  describe('cas limites', () => {
    test('tableau de ventes vide', () => {
      const result = filter([]);
      expect(result).toEqual([]);
    });

    test('vente sans propriété filter', () => {
      const sells = [{ id: 1, category: 'Véhicule', price: 15000 }];
      const categoryFilters = { Marque: ['Toyota'] };
      const result = filter(sells, undefined, undefined, 'Véhicule', categoryFilters);
      expect(result).toEqual([]);
    });

    test('prix minimum égal au prix de la vente', () => {
      const result = filter(mockSells, 15000, undefined, undefined);
      expect(result.some(s => s.price === 15000)).toBe(true);
    });

    test('prix maximum égal au prix de la vente', () => {
      const result = filter(mockSells, undefined, 15000, undefined);
      expect(result.some(s => s.price === 15000)).toBe(true);
    });

    test('categoryFilters vide retourne toutes les ventes de la catégorie', () => {
      const result = filter(mockSells, undefined, undefined, 'Véhicule', {});
      expect(result).toHaveLength(3);
    });
  });
});