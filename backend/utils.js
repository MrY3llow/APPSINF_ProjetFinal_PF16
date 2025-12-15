const crypto = require('crypto');
const { documentSort } = require('./document-search.js');

/**
 * Convertis un string en hash (sha256)
 * @param {string} str - Le string a convertir
 * @param {string} [algorithm='sha256'] - L'algorithme de hachage à utiliser (sha256, md5, sha512, etc.)
 * @return {string} Le hash du str
 * @exemple
 * // Hash avec l'algorithme par défaut (sha256)
 * const hash = hashString('monMotDePasse');
 * // Retourne: '9c5c4c8f5c65c8f4d8a7b9c5d4e3f2a1...'
 */
function hashString(str, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(str).digest('hex');
}

/**
 * Convertis un objet de type Date en String selon différents formats.
 * 
 * Formats :
 * 
 * - `format="short"` : "DD/MM/YYYY"
 * - `format="long"` : "DD month YYYY"
 * 
 * - `clock=true` : ajoute la date. Si `format="long"`, ajoute un "à" entre le jour et l'heure.
 * - `clock=false` : n'ajoute pas la date
 * 
 * @param {Date} date - La date en objet Date a convertir en string
 * @param {string} format - Indique la structure de sortie pour la date
 * @param {boolean} clock - Indique s'il l'heure doit être affichée ou pas
 * @return {string} L'heure dans le format demandé.
 */
function renderDateToString(date, format="short", clock=true) {
  switch (format) {

    default: { // "long" aussi
      let options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      if (clock) {
        options.hour = '2-digit'
        options.minute = '2-digit'
      }
  
      return new Date().toLocaleString('fr-FR', options);
    }

    case "short": {
      let options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      if (clock) {
        options.hour = '2-digit'
        options.minute = '2-digit'
      }

      return date.toLocaleString('fr-FR', options).replace(',', '');
    }
  }
}

/**
 * Fonction de recherche d'un input dans une liste de vente. L'input peut être une suite de mots, des nombres, ...
 * Utilisé dans la page d'acceuil pour recherche un terme parmis les ventes disponibles.
 * @param {Array<Object>} sells - Liste des dictionnaires des ventes.
 * @param {string} input - Le terme de recherche.
 */
function search(sells, input) {

  /**
   * Convertis un dictionnaire d'une vente en un string.
   * Utilisé pour la fonction de recherche.
   * @param {Object} sell - Dictionnaire de la vente.
   * @return {string} Un string contenant les valeurs du dictionnaires pour toutes les clés, sauf pour les clés "image", "buyers" et "_id".
   */
  function convertSellToString(sell) {
    let result = "";
    
    for (let key in sell) {
      if (key !== "image" && key !== "buyers" && key !== "_id") {
        if (result !== "") {
          result += " | ";
        }
        result += sell[key];
      }
    }
    return result;
  }

  /**
   * Changer l'ordre d'une liste de vente sur base d'une liste de vente en format String.
   * L'ordre des dictionnaires des ventes est réorganiser sur bases du même ordre des ventes
   * en format String généré par la fonction convertSellToString(sell).
   * @param {Array<Object>} sells - La liste de dictionnaire des ventes
   * @param {Array<string>} sellsString - La liste des String des ventes (généré par la fonction convertSellToString(sell))
   * @return {Array<Ovject>} La listes de dictionnaire de ventes de bases avec le bon ordre.
   */
  function orderSellsBaseOnString(sells, sellsString) {
    let result = []
    for (let sellString of sellsString) {
      for (let sell of sells) {
        if (sellString == convertSellToString(sell)) {
          result.push(sell);
        }
      }
    }
    return result;
  }


  // Convertions des ventes en String.
  let sellsString = [];
  for (let sell of sells) {
    sellsString.push(convertSellToString(sell));
  }

  // Recherche dans la liste des string
  sellsStringSearched = documentSort(input, sellsString)

  // Réorganisation des ventes sur bases des String recherché et donc réorganisé.
  sellsSearched = orderSellsBaseOnString(sells, sellsStringSearched)
  
  
  return sellsSearched
}


/**
 * Trie une liste de vente selon un critère.
 * Critères possibles : 
 * └─ "price-asc"  ──>  Le prix croissant. Les ventes les moins chères en premières.
 * └─ "price-desc"  ─>  Le prix décroissant. Les ventes les plus chères en premières.
 * └─ "rating"  ─────>  Les ventes des vendeurs avec le meilleur rating en premières.
 * └─ "date-asc"  ───>  La date croissante. Les ventes les plus veilles en premières.
 * └─ "date-desc"  ──>  La date décroissante. Les ventes les plus récentes en premières.
 * @param {Array<Object>} sells - La liste des dictionnaires des ventes.
 * @param {string} type - Le type de la vente.
 */
function sort(sells, type) {
  const sorted = sells.slice();
  
  switch(type) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    
    case "rating":
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    case "date-asc":
      return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    case "date-desc":
      return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    default:
      return sorted;
  }
}




module.exports = {
    hashString: hashString,
    renderDateToString: renderDateToString,
    search: search,
    sort: sort,
}