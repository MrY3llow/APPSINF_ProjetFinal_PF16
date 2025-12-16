const categoryData = {
  "Véhicule" : [
    {"name": "Marque", "type": "select", "values": ["Toyota", "Renaud", "Volovo", "Tesla"]},
    {"name": "Couleur", "type": "select", "values": ["Rouge", "Bleu", "Noir", "Blanc", "Gris", "Vert", "Jaune", "Orange"]},
    {"name": "Carburant", "type": "select", "values": ["Essence", "Diesel", "Electrique"]},
    {"name": "Année", "type": "number"},
    {"name": "Nombre de roue", "type": "number"},
    {"name": "Kilométrage", "type": "number"},
  ],
  "Immobilier" : [
    {"name": "Type", "type": "select", "values": ["Appartement", "Maison", "Studio", "Duplex", "Villa"]},
    {"name": "Nombre de pièces", "type": "number"},
    {"name": "Surface (m²)", "type": "number"},
    {"name": "Étage", "type": "number"},
    {"name": "État", "type": "select", "values": ["Neuf", "Bon état", "À rénover"]},
    {"name": "Chauffage", "type": "select", "values": ["Gaz", "Electrique", "Fuel", "Pompe à chaleur"]},
  ],
  "Électronique" : [
    {"name": "Type", "type": "select", "values": ["Smartphone", "Ordinateur portable", "Tablette", "Console", "Télévision"]},
    {"name": "Marque", "type": "select", "values": ["Apple", "Samsung", "Sony", "Microsoft", "LG", "HP", "Dell"]},
    {"name": "État", "type": "select", "values": ["Neuf", "Comme neuf", "Bon état", "Satisfaisant"]},
    {"name": "Année d'achat", "type": "number"},
    {"name": "Capacité stockage (Go)", "type": "number"},
  ],
  "Vêtements" : [
    {"name": "Type", "type": "select", "values": ["Pantalon", "T-shirt", "Robe", "Veste", "Chaussures", "Accessoire"]},
    {"name": "Taille", "type": "select", "values": ["XS", "S", "M", "L", "XL", "XXL"]},
    {"name": "Couleur", "type": "select", "values": ["Rouge", "Bleu", "Noir", "Blanc", "Gris", "Vert", "Jaune", "Orange", "Rose", "Violet"]},
    {"name": "Marque", "type": "select", "values": ["Zara", "H&M", "Nike", "Adidas", "Uniqlo", "Autre"]},
    {"name": "État", "type": "select", "values": ["Neuf avec étiquette", "Neuf sans étiquette", "Excellent état", "Bon état"]},
  ],
  "Divers" : [],
}

/**
 * Filtres des ventes selons différentes données.
 * Chaque valeur n'est pas obligatoire
 * Filtres possibles :
 * - prix max et min
 * - la catégorie
 * - les propriété spécifique de cette catégorie. La catégorie doit impérativement être configuré.
 * @param {object|undefined} sels - l'objet de la vente
 * @param {object|undefined} priceMin - le nombre minimum
 * @param {object|undefined} priceMax- le nombre maximum
 * @param {Array<object>|undefined} categoryFilters - dictionnaire contenant les filtres spécifique à la catégorie
 */
function filter(sells, priceMin, priceMax, category, categoryFilters) {
  let result = [];

  for (let sell of sells) {
    let accept = true;

    // 1. Vérification de la catégorie
    if (category != undefined &&sell.category != category) {
      accept = false;
    }
    
    // 2. Vérification du prix
    if (accept && ((priceMin != undefined && sell.price < priceMin) || (priceMax != undefined && sell.price > priceMax))) {
      accept = false;
    }

    // 3. Vérification des filtres spécifiques à la catégorie
    if (accept && categoryFilters) {
      for (let filter in categoryFilters) {
        if (sell.filter != undefined && sell.filter.hasOwnProperty(filter)) {
          if (!categoryFilters[filter].includes(sell.filter[filter])) {
            accept = false;
            break;
          }
        } else { 
          accept = false;
          break;
        }
      }
    }

    // S'il est accepté, on l'ajoute.
    if (accept) {
      result.push(sell);
    }
  }
  return result;
}

module.exports = {
  categoryData: categoryData,
  filter: filter,
}