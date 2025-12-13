const checkuserInput = {

    /**
     * Vérifie qu'un String respecte bien les conditions d'un NOM D'UTILISATEUR.
     *
     * Conditions :
     * - faire plus de 6 caractères
     * @param {string} input - Le nom d'utilisateur à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidUsername : function(input) {
        // BEGIN STRIP
        if(input.length >= 5){
            return true;
        }
        return false;
        // END STRIP

    },

    /**
     * Vérifie qu'un String respecte bien les conditions d'un MOTS DE PASSE.
     * 
     * Conditions :
     * - faire plus de 8 caractères
     * @param {string} input - Le mot de passe à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidPassword : function(input) {
        if(input.length >= 8){
            return true;
        }
        return false;

    },

    /**
     * Vérifie qu'un String respecte bien les conditions d'une ADDRESSE.
     * 
     * Conditions :
     * - faire au moins 15 caractères
     * @param {string} input - L'ADDRESSE à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidSellAddress : function(input) {
        return (input.length >= 15);
    },

    /**
     * Vérifie qu'un String respecte bien les conditions d'un TITRE.
     * 
     * Conditions :
     * - faire au moins 3 caractères
     * @param {string} input - Le TITRE à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidSellTitle : function(input) {
        return (input.length >= 3);
    },

    /**
     * Vérifie qu'un String respecte bien les conditions d'une DESCRIPTION.
     * 
     * Conditions :
     * - faire au moins 10 caractères
     * @param {string} input - La DESCRIPTION à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidSellDescription : function(input) {
        return (input.length >= 10);
    },

    /**
     * Vérifie qu'un String respecte bien les conditions d'un PRIX.
     * Pourquoi un String et pas un Number ? Parce que le formulaire renvois un String. La DB
     * s'occupe de convertir en Number.
     * 
     * Conditions :
     * - faire au moins 1 caractère
     * - Être plus grand que 0
     * - Être un nombre
     * @param {string} input - Le PRIX à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidSellPrice: function(input) {
        return (
            input.length >= 1 &&
            typeof Number(input) != NaN &&
            Number(input) > 0
        );
    },

    /**
     * Vérifie qu'un String respecte bien les conditions d'une QUANTITE.
     * Pourquoi un String et pas un Number ? Parce que le formulaire renvois un String. La DB
     * s'occupe de convertir en Number.
     * 
     * Conditions :
     * - faire au moins 1 caractère
     * - Être plus grand que 0
     * - Être un nombre sans virgule
     * @param {string} input - La QUANTITE à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidSellQuantity: function(input) {
        return (
            input.length >= 1 &&
            typeof Number(input) != NaN &&
            Number(input) > 0 &&
            Number.isInteger(Number(input))
        );
    }

}

module.exports = {
    checkUserInput: checkuserInput
}