const { documentSort } = require('../backend/document-search.js');

describe('documentSort', () => {
  describe('Cas basiques', () => {
    test('devrait retourner un tableau vide pour une liste de documents vide', () => {
      const input = "test";
      const docList = [];
      const result = documentSort(input, docList);
      expect(result).toEqual([]);
    });

    test('devrait retourner le seul document disponible', () => {
      const input = "test";
      const docList = ["Document unique"];
      const result = documentSort(input, docList);
      expect(result).toEqual(["Document unique"]);
    });

    test('devrait gérer une entrée vide', () => {
      const input = "";
      const docList = ["Doc 1", "Doc 2"];
      const result = documentSort(input, docList);
      expect(result).toHaveLength(2);
    });
  });

  describe('Correspondance exacte de mots', () => {
    test('devrait prioriser le document avec le plus de mots correspondants', () => {
      const input = "pomme poire";
      const docList = [
        "J'aime les pommes",
        "J'aime les pommes et les poires",
        "J'aime les bananes"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toBe("J'aime les pommes et les poires");
    });

    test('devrait ignorer les mots vides (stopwords)', () => {
      const input = "le chat mange une souris";
      const docList = [
        "Le chat",
        "Chat souris",
        "La souris"
      ];
      const result = documentSort(input, docList);
      // "Chat souris" devrait être en tête car contient 2 mots significatifs
      expect(result[0]).toBe("Chat souris");
    });
  });

  describe('Gestion des accents et casse', () => {
    test('devrait traiter les accents de manière équivalente', () => {
      const input = "élève";
      const docList = [
        "Un élève studieux",
        "Un eleve normal",
        "Un professeur"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toMatch(/élève|eleve/);
      expect(result[2]).toBe("Un professeur");
    });

    test('devrait ignorer la casse', () => {
      const input = "ORDINATEUR";
      const docList = [
        "Mon ordinateur",
        "Une voiture",
        "UN ORDINATEUR PUISSANT"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toMatch(/ordinateur/i);
      expect(result[2]).toBe("Une voiture");
    });

    test('devrait gérer différents types d\'accents français', () => {
      const input = "être là où ça coûte cher";
      const docList = [
        "Être là",
        "ou ca coute",
        "Documentation"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toBe("Être là");
      expect(result[1]).toBe("ou ca coute");
    });
  });

  describe('Similarité et distance de Levenshtein', () => {
    test('devrait reconnaître des mots similaires avec fautes de frappe', () => {
      const input = "ordinateur";
      const docList = [
        "Un ordinater cassé",
        "Une voiture",
        "Un ordinnateur"
      ];
      const result = documentSort(input, docList);
      // Les deux premiers devraient contenir des variations d'ordinateur
      expect(result[2]).toBe("Une voiture");
    });

    test('devrait utiliser le seuil de similarité de 0.8', () => {
      const input = "chat";
      const docList = [
        "Le chat miaule",
        "Le char roule",
        "Le chien aboie"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toBe("Le chat miaule");
    });
  });

  describe('Cas d\'exemple de la documentation', () => {
    test('devrait reproduire l\'exemple fourni dans la documentation', () => {
      const input = "J'ai mangé des saucisses à la compote et maintenant j'ai mal au ventre aie !";
      const docList = [
        "Les compotes de pommes sont-elles une opération extraterrestre pour pourrire nos dents ?",
        "Les saucisses de l'archiduchesse sont-elles sèches ? Archisèches !",
        "Ma compote de poire pue le caca boudin.",
      ];
      const result = documentSort(input, docList);
      
      // Le document avec "compotes" devrait être prioritaire
      expect(result[0]).toContain("saucisses de l'archiduchesse");
    });
  });

  describe('Gestion des caractères spéciaux', () => {
    test('devrait gérer les tirets comme espaces', () => {
      const input = "arc-en-ciel";
      const docList = [
        "Un arc en ciel",
        "Une voiture",
        "Un arc-en-ciel"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toMatch(/arc/);
      expect(result[2]).toBe("Une voiture");
    });

    test('devrait gérer les apostrophes', () => {
      const input = "aujourd'hui";
      const docList = [
        "Aujourd'hui il pleut",
        "Demain il fera beau",
        "Aujourd hui"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toMatch(/Aujourd/);
    });

    test('devrait ignorer les caractères non alphanumériques', () => {
      const input = "test@#$%";
      const docList = [
        "Un test important",
        "Documentation",
        "Test!!! Super!!!"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toMatch(/test/i);
    });
  });

  describe('Pondération TF-IDF', () => {
    test('devrait favoriser les mots rares', () => {
      const input = "mot rare spécifique";
      const docList = [
        "Un mot commun",
        "Un mot rare et spécifique",
        "Un mot commun encore"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toBe("Un mot rare et spécifique");
    });

    test('devrait gérer plusieurs occurrences d\'un même mot', () => {
      const input = "important";
      const docList = [
        "C'est important",
        "Très important, vraiment important, super important",
        "Documentation"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toContain("important");
    });
  });

  describe('Cas limites', () => {
    test('devrait gérer les documents avec uniquement des stopwords', () => {
      const input = "voiture rouge";
      const docList = [
        "le la les un une des",
        "Une voiture rouge",
        "et ou mais donc"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toBe("Une voiture rouge");
    });

    test('devrait gérer les nombres dans les documents', () => {
      const input = "test 123";
      const docList = [
        "Test numéro 123",
        "Test numéro 456",
        "Documentation"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toBe("Test numéro 123");
    });

    test('devrait gérer les documents très longs', () => {
      const input = "recherche";
      const longDoc = "mot ".repeat(100) + "recherche " + "mot ".repeat(100);
      const docList = [
        longDoc,
        "Recherche simple",
        "Autre document"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toMatch(/recherche/i);
    });

    test('devrait gérer les tabulations et retours à la ligne', () => {
      const input = "test document";
      const docList = [
        "test\tdocument",
        "test\ndocument",
        "autre chose"
      ];
      const result = documentSort(input, docList);
      expect(result[0]).toMatch(/test/);
      expect(result[2]).toBe("autre chose");
    });
  });

  describe('Ordre de tri', () => {
    test('devrait trier par ordre décroissant de pertinence', () => {
      const input = "chat chien";
      const docList = [
        "Documentation générale",
        "Le chat et le chien",
        "Le chat"
      ];
      const result = documentSort(input, docList);
      const scores = result.map((doc, index) => index);
      
      // Le document avec les deux mots devrait être en premier
      expect(result[0]).toBe("Le chat et le chien");
      expect(result[1]).toBe("Le chat");
      expect(result[2]).toBe("Documentation générale");
    });
  });
});