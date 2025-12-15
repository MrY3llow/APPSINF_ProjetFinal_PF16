const { checkUserInput } = require('../../APPSINF_ProjetPreparatoire_A14-main (4)/APPSINF_ProjetPreparatoire_A14-main/backend/check-input.js');


describe("Username validation", () => {

    test("Valid username", () => {
        let result = checkUserInput.isValidUsername("Anes1");
        expect(result).toBeTruthy();
    });
    test("Valid username", () => {
        let result = checkUserInput.isValidUsername("Anesa");
        expect(result).toBeTruthy();
    });
    test("Valid username", () => {
        let result = checkUserInput.isValidUsername("12345");
        expect(result).toBeTruthy();
    });

    test("Invalid username", () => {
        let result = checkUserInput.isValidUsername("yooo");
        expect(result).toBeFalsy();
    });
    test("Invalid username", () => {
        let result = checkUserInput.isValidUsername("1234");
        expect(result).toBeFalsy();
    });
    test("Invalid username", () => {
        let result = checkUserInput.isValidUsername("");
        expect(result).toBeFalsy();
    });

});


describe("Password validation", () => {

    test("Valid password", () => {
        let result = checkUserInput.isValidPassword("12345678");
        expect(result).toBeTruthy();
    });
    test("Valid password", () => {
        let result = checkUserInput.isValidPassword("anesanes");
        expect(result).toBeTruthy();
    });

    test("Invalid password", () => {
        let result = checkUserInput.isValidPassword("1234");
        expect(result).toBeFalsy();
    });
    test("Invalid password", () => {
        let result = checkUserInput.isValidPassword("Anes");
        expect(result).toBeFalsy();
    });
    test("Invalid password", () => {
        let result = checkUserInput.isValidPassword("");
        expect(result).toBeFalsy();
    });
    test("Invalid password", () => {
        let result = checkUserInput.isValidPassword("azertyu");
        expect(result).toBeFalsy();
    });
    test("Invalid password", () => {
        let result = checkUserInput.isValidPassword("1234567");
        expect(result).toBeFalsy();
    });
    test("Invalid password", () => {
        let result = checkUserInput.isValidPassword(" ");
        expect(result).toBeFalsy();
    });
});


describe("Sell address validation", () => {

    test("Valid address", () => {
        let result = checkUserInput.isValidSellAddress(
            "Rue de Bruyère 10, 1348 Louvain la neuve"
        );
        expect(result).toBeTruthy();
    });

    test("Invalid address", () => {
        let result = checkUserInput.isValidSellAddress("Rue");
        expect(result).toBeFalsy();
    });
    test("Invalid address", () => {
        let result = checkUserInput.isValidSellAddress("Avenue 10");
        expect(result).toBeFalsy();
    });
    test("Invalid address", () => {
        let result = checkUserInput.isValidSellAddress("10");
        expect(result).toBeFalsy();
    });
    test("Invalid address", () => {
        let result = checkUserInput.isValidSellAddress("1348");
        expect(result).toBeFalsy();
    });
    test("Invalid address", () => {
        let result = checkUserInput.isValidSellAddress("a");
        expect(result).toBeFalsy();
    });

});


describe("Sell title validation", () => {

    test("Valid title", () => {
        let result = checkUserInput.isValidSellTitle("Velo");
        expect(result).toBeTruthy();
    });

    test("Invalid title", () => {
        let result = checkUserInput.isValidSellTitle("");
        expect(result).toBeFalsy();
    });
    test("Invalid title", () => {
        let result = checkUserInput.isValidSellTitle(" ");
        expect(result).toBeFalsy();
    });
    test("Invalid title", () => {
        let result = checkUserInput.isValidSellTitle("5");
        expect(result).toBeFalsy();
    });
    test("Invalid title", () => {
        let result = checkUserInput.isValidSellTitle("@");
        expect(result).toBeFalsy();
    });
});


describe("Sell description validation", () => {

    test("Valid description", () => {
        let result = checkUserInput.isValidSellDescription(
            "Très bon vélo en parfait état"
        );
        expect(result).toBeTruthy();
    });
    test("Valid description", () => {
        let result = checkUserInput.isValidSellDescription(
            "vélo en très bon état"
        );
        expect(result).toBeTruthy();
    });
    test("Valid description", () => {
        let result = checkUserInput.isValidSellDescription(
            "vélo en mauvais état"
        );
        expect(result).toBeTruthy();
    });


    test("Invalid description", () => {
        let result = checkUserInput.isValidSellDescription("");
        expect(result).toBeFalsy();
    });
    test("Invalid description", () => {
        let result = checkUserInput.isValidSellDescription(" ");
        expect(result).toBeFalsy();
    });
    test("Invalid description", () => {
        let result = checkUserInput.isValidSellDescription("aaaaaa");
        expect(result).toBeFalsy();
    });

});


describe("Sell price validation", () => {

    test("Valid price", () => {
        let result = checkUserInput.isValidSellPrice("150");
        expect(result).toBeTruthy();
    });

    test("Invalid price", () => {
        let result = checkUserInput.isValidSellPrice("0");
        expect(result).toBeFalsy();
    });

});


describe("Sell quantity validation", () => {

    test("Valid quantity", () => {
        let result = checkUserInput.isValidSellQuantity("3");
        expect(result).toBeTruthy();
    });

    test("Invalid quantity", () => {
        let result = checkUserInput.isValidSellQuantity("3.5");
        expect(result).toBeFalsy();
    });
    test("Invalid quantity", () => {
        let result = checkUserInput.isValidSellQuantity("0");
        expect(result).toBeFalsy();
    });

});