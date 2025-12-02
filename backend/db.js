const utils = require('./utils.js');
const { documentSearch } = require('./document-search.js');


//   +-----------+
//   |   SELLS   |
//   +-----------+

const sells = {
  
  // Listes des entrées acceptées pour les ventes dans la base de donnée.
  allowedFields : [
    "title",
    "description",
    "owner",
    "price",
    "quantity",
    "location",
    "image",
    "categorie",
    "date",
    "data"
  ],


  /**
   * Vérifie si les valeurs d'une liste correspondent aux entrée autorisée pour les ventes
   * de la base de donnée
   * @param {Array<string>} options Liste de mots clés
   * @throws {Error} `Invalid option: ${option}` si une valeur n'est pas acceptée
   * @example ```
   * // Ok ne retourne rien et ne lance aucune erreur.
   * checkSellsOptions({
   *   "title",
   *   "description"
   * })
   * 
   * // ERREUR Lance l'erreur `Invalid option: wrongValue`
   * checkSellsOptions({
   *   "title",
   *   "wrongValue"
   * })
   * ```
   */
  checkSellsOptions : function(options) {
    for (let option in options) {
      if (!this.allowedFields.includes(option)) {
        throw new Error(`Invalid option: ${option}`);
      }
    }
  },


  /**
   * Crée une nouvelle vente dans la base de donnée.
   * Les données vides ne seront pas enregistré dans la base de donnée.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {Object} options - Les options de la vente. Dictionnaire
   * @param {string} [options.title=null] - Le titre de la vente
   * @param {string} [options.description=null] - La description de la vente
   * @param {string} [options.owner=null] - Le propriétaire de la vente
   * @param {Array<number|string>} [options.price=null] - Le prix au format [montant, devise]
   * @param {number} [options.quantity=null] - La quantité disponible
   * @param {string} [options.location=null] - La localisation
   * @param {string} [options.image=null] - L'URL de l'image
   * @param {string} [options.categorie=null] - La catégorie
   * @param {Date} [options.date=new Date()] - La date de création
   * @return {Promise<Object>} L'objet inséré dans la base de données
   * @throws {Error} Si la requête à la base de données échoue
   * @example
   * await db.sells.create(dbo, {
   *   title: "Vélo",
   *   owner: "John",
   *   price: [150, "EUR"],
   *   quantity: 1
   * });
   */
  create : async function(dbo, options) {
    this.checkSellsOptions(options);
    await dbo.collection('sells').insertOne(options);
  },

  /**
   * 
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {Object} id - L'id de la vente
   * @param {*} options - Dictionnaire des valeurs a changer. Seuls les valeurs de la liste sells.allowedFields sont acceptées.
   * @throws {Error} `Invalid option: ${option}` si une valeur n'est pas acceptée
   * @exemple ```
   * // Change la vente avec l'id sellId et indique comme titre "Voiture" et comme description "Voiture en bonne état".
   * await db.sells.change(dbo, sellId, {
   *   title: "Voiture",
   *   description: "Voiture rouge en bonne état"
   * });
   * ```
   * 
   */
  change : async function(dbo, id, options) {
    this.checkSellsOptions(options);
    await dbo.collection('sells').updateOne({ _id: id }, { $set: options });
  },

  /**
   * Récupère toutes les ventes de la base de données.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @return {Array} Un tableau de tous les incidents.
   * @throws {Error} Si la requête à la base de données échoue
   * @exemple ```
   * const allSells = await db.sells.getAll(dbo);
   * ```
   */
  getAll : async function(dbo) {
    return await dbo.collection('sells')
      .find()
      .toArray();
  },



}


//   +----------+
//   |   USER   |
//   +----------+
const user = {

  /**
   * Crée un nouvel utilisateur dans la base de donnée
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @param {string} password - Le mot de passe en clair (sera haché)
   * @param {string} fullname - Le nom complet de l'utilisateur
   * @param {string} email - L'adresse email de l'utilisateur
   * @throws {Error} Si la requête à la base de données échoue
   * @exemple ```
   * await user.create(dbo, 'jdoe', 'motdepasse123', 'John Doe', 'john@example.com');
   * ```
   */
  create : async function(dbo, username, password, fullname, email) {
    await dbo.collection('users').insertOne({
      username: username,
      passwordHash: utils.hashString(password),
      fullname: fullname,
      email: email,
    })
  },

  /**
   * Vérifie si un mot de passe correspond bien a un username (Passe par le système de hash)
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @param {string} password - Le mot de passe en clair (sera haché pour être comparé)
   * @return {boolean} true ou false selon si le mot de passe est valide
   * @throws {Error} Si la requête à la base de données échoue
   * @exemple ```
   * const isValid = await user.checkLogin(dbo, 'jdoe', 'motdepasse123')
   * ```
   */
  checkLogin : async function(dbo, username, password) {
    let result = await dbo.collection('users').findOne({
      username: username,
      passwordHash: utils.hashString(password)
    })
    if (result) return true;
    else return false;
  },

  /**
   * Vérifie qu'un NOM d'UTILISATEUR est libre, ou s'il est déjà utilisé
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur a vérifier
   * @return {boolean} True si l'username est libre. False s'il est déjà utilisé.
   * @throws {Error} Si la requête à la base de données échoue
   * @exemple ```
   * const isFree = await user.isUsernameFree(dbo, "jdoe")
   * ```
   */
  isUsernameFree : async function(dbo, username) {
    let result = await dbo.collection('users').findOne({
      username: username
    })
    if (result) return false;
    else return true;
  },

  /**
   * Vérifie qu'un EMAIL est libre, ou s'il est déjà utilisé
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} email - L'email a vérifier
   * @return {boolean} True si l'email est libre. False s'il est déjà utilisé.
   * @throws {Error} Si la requête à la base de données échoue
   * @exemple ```
   * const isFree = await user.isEmailFree(dbo, "jdoe@gmail.com")
   * ```
   */
  isEmailFree : async function(dbo, email) {
    let result = await dbo.collection('users').findOne({
      email: email
    })
    if (result) return false;
    else return true;
  },


  /**
   * Obtiens le nom complet d'un utilisateur en de du nom d'utilisateur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @return {string} Le nom complet de l'utilisateur
   * @throws {Error} Si la requête à la base de données échoue
   * @exemple ```
   * let fullName = await user.getNameFromUsername(dbo, "Mr_Yellow_")
   * > fullName = "Nathan Cobut"
   * ```
   */
  getNameFromUsername : async function(dbo, username) {
    let result = await dbo.collection('users').findOne({
      username: username
    })
    return result.fullname;
  }

}


module.exports = {
  user: user,
  sells: sells,
}