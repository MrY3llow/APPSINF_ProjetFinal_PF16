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
     * Vérifie qu'un String respecte bien les conditions d'une DESCRIPTION D'ACCIDENT.
     * 
     * Conditions :
     * - faire plus de 20 caractères
     * @param {string} input - La description à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidIncidentDescription : function(input) {
        if (input.length >= 20) {
            return true;
        }
        return false;
    },

    /**
     * Vérifie qu'un String respecte bien les conditions d'une ADDRESSE.
     * 
     * Conditions :
     * - faire plus de 15 caractères
     * @param {string} input - L'ADDRESSE à vérifier
     * @return {boolean} True s'il est valide. False s'il n'est pas valide
     */
    isValidIncidentAddress : function(input) {
        return (input.length > 15);
    }

}

module.exports = {
    checkUserInput: checkuserInput
}