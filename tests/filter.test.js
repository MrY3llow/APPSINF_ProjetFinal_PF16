// charger le fichier  filtrer.js pour le tester
const { categoryData, getCategoryFilter } = require('../backend/filter.js');

describe("Category data structure", () => {

    test("Category 'Véhicule' should exist", () => {
        expect(categoryData["Véhicule"]).toBeDefined();
    });

    test("Category 'Véhicule' should be an array", () => {
        expect(Array.isArray(categoryData["Véhicule"])).toBeTruthy();
    });

    test("Category 'Véhicule' should not be empty", () => {
        expect(categoryData["Véhicule"].length).toBeGreaterThan(0);
    });

});


//  les filtres de la catégorie véhicule

describe("Véhicule filters content", () => {

    test("Véhicule should contain all expected filters", () => {
        const filters = categoryData["Véhicule"];
        const filterNames = filters.map(f => f.name);

        expect(filterNames).toContain("Marque");
        expect(filterNames).toContain("Couleur");
        expect(filterNames).toContain("Carburant");
        expect(filterNames).toContain("Année");
        expect(filterNames).toContain("Nombre de roue");
        expect(filterNames).toContain("Kilométrage");
    });

    test("Select filters should have values", () => {
        const filters = categoryData["Véhicule"];

        for (let filter of filters) {
            if (filter.type === "select") {
                expect(Array.isArray(filter.values)).toBeTruthy();
                expect(filter.values.length).toBeGreaterThan(0);
            }
        }
    });

    test("Number filters should not have values array", () => {
        const filters = categoryData["Véhicule"];

        for (let filter of filters) {
            if (filter.type === "number") {
                expect(filter.values).toBeUndefined();
            }
        }
    });

});


describe("getCategoryFilter()", () => {

    let validInputs = [ 
        "Véhicule"
    ];

    let invalidInputs = [ 
        "voiture",          
        "InvalidCategory", 
        "",                
        " ",             
        null,              
        undefined,         
        0,               
        {},                
        []  
    ];

    for (let input of validInputs) {
        test("Category '" + input + "' should return filter names", () => {
            let result = getCategoryFilter(input);

            expect(Array.isArray(result)).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain("Marque");
            expect(result).toContain("Couleur");
            expect(result).toContain("Carburant");
        });
    }

    for (let input of invalidInputs) {
        test("Category '" + input + "' should not be valid", () => {
            expect(() => getCategoryFilter(input)).toThrow();
        });
    }
});