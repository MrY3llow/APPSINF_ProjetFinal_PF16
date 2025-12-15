const { hashString, renderDateToString } = require('../../APPSINF_ProjetPreparatoire_A14-main (4)/APPSINF_ProjetPreparatoire_A14-main/backend/utils.js');

describe("hashString()", () => {

    test("Should return a string and not an empty value", () => {
        let result = hashString("password");
        expect(typeof result).toBe("string");
    });

    test("Same input = same hash", () => {
        let hash1 = hashString("password");
        let hash2 = hashString("password");
        expect(hash1).toBe(hash2);
    });

    test("Different input = different hash", () => {
        let hash1 = hashString("password");
        let hash2 = hashString("password2");
        expect(hash1).not.toBe(hash2);
    });

});
//a