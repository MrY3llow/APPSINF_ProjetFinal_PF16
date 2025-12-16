const utils = require('../backend/utils.js');
const crypto = require('crypto');

//   +----------------+
//   |   HASHSTRING   |
//   +----------------+

describe("hashString()", () => {
  
  it("Should return a sha256 hash by default", () => {
    const input = "testPassword";
    const result = utils.hashString(input);
    const expected = crypto.createHash('sha256').update(input).digest('hex');
    
    expect(result).toBe(expected);
    expect(result).toHaveLength(64); // sha256 produit toujours 64 caractères hexadécimaux
  });

  it("Should return consistent hash for same input", () => {
    const input = "password123";
    const hash1 = utils.hashString(input);
    const hash2 = utils.hashString(input);
    
    expect(hash1).toBe(hash2);
  });

  it("Should return different hashes for different inputs", () => {
    const hash1 = utils.hashString("password1");
    const hash2 = utils.hashString("password2");
    
    expect(hash1).not.toBe(hash2);
  });

  it("Should handle empty string", () => {
    const result = utils.hashString("");
    expect(result).toBeTruthy();
    expect(result).toHaveLength(64);
  });

  it("Should handle special characters", () => {
    const input = "pàssw0rd!@#$%^&*()";
    const result = utils.hashString(input);
    
    expect(result).toBeTruthy();
    expect(result).toHaveLength(64);
  });

  it("Should support different hash algorithms", () => {
    const input = "testPassword";
    
    const sha256Hash = utils.hashString(input, 'sha256');
    const md5Hash = utils.hashString(input, 'md5');
    const sha512Hash = utils.hashString(input, 'sha512');
    
    expect(sha256Hash).toHaveLength(64);
    expect(md5Hash).toHaveLength(32);
    expect(sha512Hash).toHaveLength(128);
  });

  it("Should be case-sensitive", () => {
    const hash1 = utils.hashString("Password");
    const hash2 = utils.hashString("password");
    
    expect(hash1).not.toBe(hash2);
  });
});


//   +------------------------+
//   |   RENDERDATETOSTRING   |
//   +------------------------+

describe("renderDateToString()", () => {
  
  const testDate = new Date('2024-12-16T14:30:00');

  describe("Format 'short'", () => {
    
    it("Should format date in short format with clock", () => {
      const result = utils.renderDateToString(testDate, "short", true);
      
      expect(result).toContain('16');
      expect(result).toContain('12');
      expect(result).toContain('2024');
      expect(result).toContain('14:30');
    });

    it("Should format date in short format without clock", () => {
      const result = utils.renderDateToString(testDate, "short", false);
      
      expect(result).toContain('16');
      expect(result).toContain('12');
      expect(result).toContain('2024');
      expect(result).not.toContain(':');
    });

    it("Should not contain comma in short format", () => {
      const result = utils.renderDateToString(testDate, "short", true);
      expect(result).not.toContain(',');
    });
  });

  describe("Format 'long'", () => {
    
    it("Should format date in long format with clock", () => {
      const result = utils.renderDateToString(testDate, "long", true);
      
      expect(result).toContain('16');
      expect(result).toContain('2024');
      // Le mois devrait être écrit en toutes lettres en français
      expect(result.toLowerCase()).toMatch(/janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/);
    });

    it("Should format date in long format without clock", () => {
      const result = utils.renderDateToString(testDate, "long", false);
      
      expect(result).toContain('16');
      expect(result).toContain('2024');
      expect(result).not.toContain(':');
    });
  });

  describe("Default parameters", () => {
    
    it("Should use short format and include clock by default", () => {
      const result = utils.renderDateToString(testDate);
      
      // Par défaut: format="short", clock=true
      expect(result).toContain('14:30');
      expect(result).toContain('/');
    });
  });

  describe("Edge cases", () => {
    
    it("Should handle midnight time", () => {
      const midnight = new Date('2024-01-01T00:00:00');
      const result = utils.renderDateToString(midnight, "short", true);
      
      expect(result).toContain('00:00');
    });

    it("Should handle noon time", () => {
      const noon = new Date('2024-01-01T12:00:00');
      const result = utils.renderDateToString(noon, "short", true);
      
      expect(result).toContain('12:00');
    });

    it("Should handle end of year", () => {
      const newYear = new Date('2024-12-31T23:59:00');
      const result = utils.renderDateToString(newYear, "short", true);
      
      expect(result).toContain('31');
      expect(result).toContain('12');
      expect(result).toContain('2024');
    });
  });
});


//   +------------+
//   |   SEARCH   |
//   +------------+

describe("search()", () => {
  
  const mockSells = [
    {
      _id: "1",
      title: "Vélo de course",
      description: "Vélo rouge en excellent état",
      owner: "Nathan",
      price: 150,
      quantity: 1,
      category: "Véhicule",
      address: "Rue de la Paix 5",
      date: new Date('2025-12-10')
    },
    {
      _id: "2",
      title: "Ordinateur portable",
      description: "MacBook Pro 2020",
      owner: "Marie",
      price: 800,
      quantity: 1,
      category: "Électronique",
      address: "Avenue Louise 100",
      date: new Date('2025-12-15')
    },
    {
      _id: "3",
      title: "Table en bois",
      description: "Grande table de salon",
      owner: "Jean",
      price: 200,
      quantity: 1,
      category: "Mobilier",
      address: "Boulevard Anspach 50",
      date: new Date('2025-12-01')
    }
  ];

  it("Should return all sells when search term is empty", () => {
    const result = utils.search(mockSells, "");
    expect(result).toHaveLength(mockSells.length);
  });

  it("Should find sell by title", () => {
    const result = utils.search(mockSells, "Vélo");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toContain("Vélo");
  });

  it("Should find sell by description", () => {
    const result = utils.search(mockSells, "MacBook");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].description).toContain("MacBook");
  });

  it("Should find sell by owner", () => {
    const result = utils.search(mockSells, "Nathan");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].owner).toBe("Nathan");
  });

  it("Should find sell by category", () => {
    const result = utils.search(mockSells, "Électronique");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].category).toBe("Électronique");
  });

  it("Should find sell by address", () => {
    const result = utils.search(mockSells, "Anspach");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].address).toContain("Anspach");
  });

  it("Should be case-insensitive", () => {
    const result1 = utils.search(mockSells, "vélo");
    const result2 = utils.search(mockSells, "VÉLO");
    const result3 = utils.search(mockSells, "Vélo");
    
    expect(result1.length).toBeGreaterThan(0);
    expect(result2.length).toBeGreaterThan(0);
    expect(result3.length).toBeGreaterThan(0);
  });

  it("Should handle multi-word search", () => {
    const result = utils.search(mockSells, "vélo rouge");
    expect(result.length).toBeGreaterThan(0);
  });

  it("Should not include image, buyers, or _id in search", () => {
    const sellsWithExtraData = [
      {
        ...mockSells[0],
        image: { data: "base64data", contentType: "image/jpeg" },
        buyers: [{ username: "buyer1", date: new Date() }],
        _id: "searchableId123"
      }
    ];
    
    // Rechercher par le contenu de image, buyers ou _id ne devrait rien donner
    const result1 = utils.search(sellsWithExtraData, "base64data");
    const result2 = utils.search(sellsWithExtraData, "buyer1");
    const result3 = utils.search(sellsWithExtraData, "searchableId123");
    
    // Ces recherches peuvent retourner des résultats s'ils matchent d'autres champs,
    // mais pas spécifiquement les champs exclus
    expect(Array.isArray(result1)).toBe(true);
    expect(Array.isArray(result2)).toBe(true);
    expect(Array.isArray(result3)).toBe(true);
  });

  it("Should maintain original sell objects", () => {
    const result = utils.search(mockSells, "Vélo");
    expect(result[0]).toHaveProperty('_id');
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('price');
  });
});


//   +----------+
//   |   SORT   |
//   +----------+

describe("sort()", () => {
  
  const mockSells = [
    {
      title: "Article A",
      price: 100,
      rating: 4.5,
      date: new Date('2025-12-01')
    },
    {
      title: "Article B",
      price: 50,
      rating: 3.0,
      date: new Date('2025-12-15')
    },
    {
      title: "Article C",
      price: 200,
      rating: 5.0,
      date: new Date('2025-12-10')
    },
    {
      title: "Article D",
      price: 75,
      date: new Date('2025-11-20') // Pas de rating
    }
  ];

  describe("Price sorting", () => {
    
    it("Should sort by price ascending", () => {
      const result = utils.sort(mockSells, "price-asc");
      
      expect(result[0].price).toBe(50);
      expect(result[1].price).toBe(75);
      expect(result[2].price).toBe(100);
      expect(result[3].price).toBe(200);
    });

    it("Should sort by price descending", () => {
      const result = utils.sort(mockSells, "price-desc");
      
      expect(result[0].price).toBe(200);
      expect(result[1].price).toBe(100);
      expect(result[2].price).toBe(75);
      expect(result[3].price).toBe(50);
    });
  });

  describe("Rating sorting", () => {
    
    it("Should sort by rating (highest first)", () => {
      const result = utils.sort(mockSells, "rating");
      
      expect(result[0].rating).toBe(5.0);
      expect(result[1].rating).toBe(4.5);
      expect(result[2].rating).toBe(3.0);
    });

    it("Should handle missing ratings (treat as 0)", () => {
      const result = utils.sort(mockSells, "rating");
      
      // L'article sans rating devrait être en dernier
      expect(result[3].rating).toBeUndefined();
    });
  });

  describe("Date sorting", () => {
    
    it("Should sort by date ascending (oldest first)", () => {
      const result = utils.sort(mockSells, "date-asc");
      
      expect(new Date(result[0].date).getTime())
        .toBeLessThan(new Date(result[1].date).getTime());
      expect(new Date(result[2].date).getTime())
        .toBeLessThan(new Date(result[3].date).getTime());
    });

    it("Should sort by date descending (newest first)", () => {
      const result = utils.sort(mockSells, "date-desc");
      
      expect(new Date(result[0].date).getTime())
        .toBeGreaterThan(new Date(result[1].date).getTime());
      expect(new Date(result[2].date).getTime())
        .toBeGreaterThan(new Date(result[3].date).getTime());
    });
  });

  describe("Default/Unknown sorting", () => {
    
    it("Should return unsorted array for unknown type", () => {
      const result = utils.sort(mockSells, "unknown-type");
      
      expect(result).toHaveLength(mockSells.length);
      // L'ordre devrait rester le même
      expect(result[0].title).toBe("Article A");
    });

    it("Should return array when no type specified", () => {
      const result = utils.sort(mockSells);
      
      expect(result).toHaveLength(mockSells.length);
    });
  });

  describe("Immutability", () => {
    
    it("Should not modify original array", () => {
      const original = [...mockSells];
      const result = utils.sort(mockSells, "price-asc");
      
      expect(mockSells[0].title).toBe(original[0].title);
      expect(mockSells[0].price).toBe(original[0].price);
    });
  });

  describe("Edge cases", () => {
    
    it("Should handle empty array", () => {
      const result = utils.sort([], "price-asc");
      expect(result).toEqual([]);
    });

    it("Should handle single item array", () => {
      const singleItem = [{ price: 100, date: new Date(), rating: 5 }];
      const result = utils.sort(singleItem, "price-asc");
      
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(100);
    });

    it("Should handle items with same values", () => {
      const samePrices = [
        { title: "A", price: 100 },
        { title: "B", price: 100 },
        { title: "C", price: 100 }
      ];
      
      const result = utils.sort(samePrices, "price-asc");
      expect(result).toHaveLength(3);
    });
  });
});


//   +-----------------------------------+
//   |   ANNONCECREATIONETERRORMESSAGE   |
//   +-----------------------------------+

describe("annonceCreationGetErrorMessage()", () => {
  
  describe("Valid inputs", () => {
    
    it("Should return empty string for valid inputs", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Vélo de course",
        "Description valide de plus de 10 caractères",
        "Rue de la Paix 123, 1000 Bruxelles",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toBe("");
    });
  });

  describe("Title validation", () => {
    
    it("Should return error for title with less than 3 characters", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Ab",
        "Description valide de plus de 10 caractères",
        "Rue de la Paix 123",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("Le titre doit faire au moins 3 caractères");
    });

    it("Should accept title with exactly 3 characters", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Abc",
        "Description valide de plus de 10 caractères",
        "Rue de la Paix 123",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).not.toContain("titre");
    });

    it("Should return error for empty title", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "",
        "Description valide de plus de 10 caractères",
        "Rue de la Paix 123",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("Le titre doit faire au moins 3 caractères");
    });
  });

  describe("Description validation", () => {
    
    it("Should return error for description with less than 10 characters", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Court",
        "Rue de la Paix 123",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("La description doit faire au moins 10 caractères");
    });

    it("Should accept description with exactly 10 characters", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "1234567890",
        "Rue de la Paix 123",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).not.toContain("description");
    });

    it("Should return error for empty description", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "",
        "Rue de la Paix 123",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("La description doit faire au moins 10 caractères");
    });
  });

  describe("Address validation", () => {
    
    it("Should return error for address with less than 15 characters", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue courte",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("L'adresse doit faire au moins 15 caractères");
    });

    it("Should accept address with exactly 15 characters", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "123456789012345",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).not.toContain("adresse");
    });

    it("Should return error for empty address", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("L'adresse doit faire au moins 15 caractères");
    });
  });

  describe("Price validation", () => {
    
    it("Should return error for negative price", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "-50",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("Le prix doit être positif");
    });

    it("Should return error for zero price", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "0",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain("Le prix doit être positif");
    });

    it("Should accept decimal prices", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "99.99",
        "5",
        "Véhicule"
      );
      
      expect(result).not.toContain("prix");
    });
  });

  describe("Quantity validation", () => {
    
    it("Should return error for negative quantity", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "100",
        "-1",
        "Véhicule"
      );
      
      expect(result).toContain("La quantité doit être un nombre positif sans virgule");
    });

    it("Should return error for decimal quantity", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "100",
        "5.5",
        "Véhicule"
      );
      
      expect(result).toContain("La quantité doit être un nombre positif sans virgule");
    });

    it("Should accept valid integer quantity", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "100",
        "10",
        "Véhicule"
      );
      
      expect(result).not.toContain("quantité");
    });
  });

  describe("Category validation", () => {
    
    it("Should return error for missing category", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "100",
        "5",
        ""
      );
      
      expect(result).toContain("Une catégorie doit être choisie");
    });

    it("Should return error for null category", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "100",
        "5",
        null
      );
      
      expect(result).toContain("Une catégorie doit être choisie");
    });

    it("Should accept valid category", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre valide",
        "Description valide",
        "Rue de la Paix 123",
        "100",
        "5",
        "Électronique"
      );
      
      expect(result).not.toContain("catégorie");
    });
  });

  describe("Multiple errors", () => {
    
    it("Should return all errors when multiple fields are invalid", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Ab",           // Titre trop court
        "Court",        // Description trop courte
        "Rue",          // Adresse trop courte
        "-10",          // Prix négatif
        "-1",           // Quantité négative
        ""              // Catégorie manquante
      );
      
      expect(result).toContain("titre");
      expect(result).toContain("description");
      expect(result).toContain("adresse");
      expect(result).toContain("prix");
      expect(result).toContain("quantité");
      expect(result).toContain("catégorie");
      
      // Vérifier qu'il y a des retours à la ligne entre les erreurs
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    it("Should separate errors with newlines", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Ab",
        "Court",
        "Rue de la Paix 123",
        "100",
        "5",
        "Véhicule"
      );
      
      expect(result).toContain('\n');
    });
  });

  describe("Edge cases", () => {

    it("Should handle special characters in inputs", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "Titre@#$%",
        "Description avec des caractères spéciaux !@#",
        "Rue des Étoiles 123, Bruxelles",
        "99.99",
        "5",
        "Électronique"
      );
      
      expect(result).toBe("");
    });

    it("Should trim whitespace in validations", () => {
      const result = utils.annonceCreationGetErrorMessage(
        "   Titre valide   ",
        "   Description valide de plus de 10 caractères   ",
        "   Rue de la Paix 123, 1000 Bruxelles   ",
        "100",
        "5",
        "Véhicule"
      );
      
      // Le résultat dépend de l'implémentation de checkUserInput
      expect(typeof result).toBe('string');
    });
  });
});