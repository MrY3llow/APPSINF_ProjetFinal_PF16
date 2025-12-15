const categoryData = {
  "Véhicule" : [
    {"name": "Marque", "type": "select", "values": ["Toyota", "Renaud", "Volovo", "Tesla"]},
    {"name": "Couleur", "type": "select", "values": ["Rouge", "Bleu", "Noir", "Blanc", "Gris", "Vert", "Jaune", "Orange"]},
    {"name": "Carburant", "type": "select", "values": ["Essence", "Diesel", "Electrique"]},
    {"name": "Année", "type": "number"},
    {"name": "Nombre de roue", "type": "number"},
    {"name": "Kilométrage", "type": "number"},
  ],
  "Miam" : [
    {"name": "Typede mial", "type": "select", "values": ["Burger", "Pizza", "Sushi"]},
    {"name": "Couleur", "type": "select", "values": ["Rouge", "Bleu", "Noir", "Blanc", "Gris", "Vert", "Jaune", "Orange"]},
    {"name": "Kilo", "type": "number"},
  ],
  "Divers" : [],
}

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
          console.log(sell.filter[filter])
          if (!categoryFilters[filter].includes(sell.filter[filter])) {
            accept = false;
            break;
          }
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