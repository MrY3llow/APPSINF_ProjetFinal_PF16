const categoryData = {
  "Véhicule" : [
    {"name": "Marque", "type": "select", "values": ["Toyota", "Renaud", "Volovo", "Tesla"]},
    {"name": "Couleur", "type": "select", "values": ["Rouge", "Bleu", "Noir", "Blanc", "Gris", "Vert", "Jaune", "Orange"]},
    {"name": "Carburant", "type": "select", "values": ["Essence", "Diesel", "Electrique"]},
    {"name": "Année", "type": "number"},
    {"name": "Nombre de roue", "type": "number"},
    {"name": "Kilométrage", "type": "number"},
  ],
}


function getCategoryFilter(category) {
  filters = []
  for (let filter of categoryData[category]) {
    filters.push(filter.name)
  }
  return filters
}


module.exports = {
  categoryData: categoryData
}