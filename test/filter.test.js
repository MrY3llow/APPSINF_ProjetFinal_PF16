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
    expect(categoryData.Véhicule[0]).toEqual({
      name: "Marque",
      type: "select",
      values: ["Toyota", "Renaud", "Volovo", "Tesla"]
    });
  });

  test('la catégorie Divers est vide', () => {
    expect(categoryData.Divers).toEqual([]);
  });
});

describe('filter', () => {
  const mockSells = [
    { id: 1, category: "Véhicule", price: 15000, filter: { Marque: "Toyota", Couleur: "Rouge" } },
    { id: 2, category: "Véhicule", price: 25000, filter: { Marque: "Tesla", Couleur: "Blanc" } },
    { id: 3, category: "Immobilier", price: 200000, filter: { Type: "Appartement" } },
    { id: 4, category: "Électronique", price: 800, filter: { Marque: "Apple" } },
    { id: 5, category: "Véhicule", price: 18000, filter: { Marque: "Renaud", Couleur: "Noir" } },
  ];

  describe('sans aucun filtre', () => {
    test('retourne toutes les ventes', () => {
      const result = filter(mockSells);
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockSells);
    });
  });

  describe('filtrage par catégorie', () => {
    test('filtre correctement par catégorie Véhicule', () => {
      const result = filter(mockSells, undefined, undefined, "Véhicule");
      expect(result).toHaveLength(3);
      expect(result.every(sell => sell.category === "Véhicule")).toBe(true);
    });

    test('filtre correctement par catégorie Immobilier', () => {
      const result = filter(mockSells, undefined, undefined, "Immobilier");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    test('retourne un tableau vide pour une catégorie inexistante', () => {
      const result = filter(mockSells, undefined, undefined, "NonExistant");
      expect(result).toHaveLength(0);
    });
  });

  describe('filtrage par prix', () => {
    test('filtre avec prix minimum uniquement', () => {
      const result = filter(mockSells, 20000);
      expect(result).toHaveLength(2);
      expect(result.every(sell => sell.price >= 20000)).toBe(true);
    });

    test('filtre avec prix maximum uniquement', () => {
      const result = filter(mockSells, undefined, 18000);
      expect(result).toHaveLength(3);
      expect(result.every(sell => sell.price <= 18000)).toBe(true);
    });

    test('filtre avec prix minimum et maximum', () => {
      const result = filter(mockSells, 15000, 20000);
      expect(result).toHaveLength(3);
      expect(result.every(sell => sell.price >= 15000 && sell.price <= 20000)).toBe(true);
    });

    test('retourne un tableau vide si aucun prix ne correspond', () => {
      const result = filter(mockSells, 300000, 400000);
      expect(result).toHaveLength(0);
    });
  });

  describe('filtrage par propriétés de catégorie', () => {
    test('filtre par une seule propriété', () => {
      const result = filter(
        mockSells,
        undefined,
        undefined,
        "Véhicule",
        { Marque: ["Toyota", "Tesla"] }
      );
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual([1, 2]);
    });

    test('filtre par plusieurs propriétés', () => {
      const result = filter(
        mockSells,
        undefined,
        undefined,
        "Véhicule",
        { Marque: ["Toyota", "Renaud"], Couleur: ["Rouge"] }
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('retourne un tableau vide si aucune vente ne correspond aux filtres', () => {
      const result = filter(
        mockSells,
        undefined,
        undefined,
        "Véhicule",
        { Marque: ["BMW"] }
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('combinaison de filtres', () => {
    test('filtre par catégorie et prix', () => {
      const result = filter(mockSells, 15000, 20000, "Véhicule");
      expect(result).toHaveLength(3);
      expect(result.every(s => s.category === "Véhicule" && s.price >= 15000 && s.price <= 20000)).toBe(true);
    });

    test('filtre par catégorie, prix et propriétés', () => {
      const result = filter(
        mockSells,
        10000,
        20000,
        "Véhicule",
        { Marque: ["Toyota", "Renaud"] }
      );
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id).sort()).toEqual([1, 5]);
    });
  });

  describe('cas limites', () => {
    test('gère un tableau de ventes vide', () => {
      const result = filter([]);
      expect(result).toEqual([]);
    });

    test('gère les ventes sans propriété filter', () => {
      const sellsWithoutFilter = [
        { id: 1, category: "Véhicule", price: 15000 },
        { id: 2, category: "Immobilier", price: 200000 }
      ];
      const result = filter(sellsWithoutFilter, undefined, undefined, "Véhicule", { Marque: ["Toyota"] });
      expect(result).toHaveLength(0);
    });

    test('gère les prix à zéro', () => {
      const sellsWithZero = [
        { id: 1, category: "Divers", price: 0 }
      ];
      const result = filter(sellsWithZero, 0, 100);
      expect(result).toHaveLength(1);
    });

    test('gère categoryFilters undefined', () => {
      const result = filter(mockSells, undefined, undefined, "Véhicule", undefined);
      expect(result).toHaveLength(3);
    });

    test('gère categoryFilters vide', () => {
      const result = filter(mockSells, undefined, undefined, "Véhicule", {});
      expect(result).toHaveLength(3);
    });
  });
});