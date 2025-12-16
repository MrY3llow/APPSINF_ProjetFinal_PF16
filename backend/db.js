const utils = require('./utils.js');
const ObjectId = require('mongodb').ObjectId;



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
    "address",
    "image",
    "category",
    "date",
    "filter"
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
   * @param {number} [options.price=null] - Le prix en €
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
   *   price: 150,
   *   quantity: 1
   * });
   */
  create : async function(dbo, options) {
    this.checkSellsOptions(options);

    // Convertis les nombres de String en Number
    options.price = Number(options.price);
    options.quantity = Number(options.quantity);
    await dbo.collection('sells').insertOne(options);
    
    await user.addPoints(dbo, options.owner, 25);
  },

  /**
   * Met à jour une vente existante dans la base de données.
   * Seuls les champs fournis seront mis à jour.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {ObjectId} sellId - L'identifiant de la vente à mettre à jour
   * @param {Object} options - Les options de mise à jour. Dictionnaire
   * @param {string} [options.title] - Le titre de la vente
   * @param {string} [options.description] - La description de la vente
   * @param {string} [options.owner] - Le propriétaire de la vente
   * @param {number} [options.price] - Le prix en €
   * @param {number} [options.quantity] - La quantité disponible
   * @param {string} [options.location] - La localisation
   * @param {string} [options.image] - L'URL de l'image
   * @param {string} [options.categorie] - La catégorie
   * @return {Promise<Object>} Le résultat de la mise à jour
   * @throws {Error} Si la requête à la base de données échoue ou si la vente n'existe pas
   * @example
   * await db.sells.update(dbo, new ObjectId(507f1f77bcf86cd799439011), {
   *   price: 120,
   *   quantity: 2
   * });
   */
  update: async function(dbo, sellId, options) {
    this.checkSellsOptions(options);

    // Convertis les nombres de String en Number si présents
    if (options.price !== undefined) {
      options.price = Number(options.price);
    }
    if (options.quantity !== undefined) {
      options.quantity = Number(options.quantity);
    }
    
    const result = await dbo.collection('sells')
                            .updateOne({ _id: new ObjectId(sellId) },
                                       { $set: options }
                                      );
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

  /**
   * Vérifie qu'une vente peut être achetée.
   * Conditions :
   * - la quantité doit être supérieure à 1
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {Object} id - L'id de la vente
   * @throws {Error} Si la requête à la base de données échoue
   */
  isPurchasable : async function (dbo, id) {
    try {
      sell = await dbo.collection('sells').findOne({ _id: id });
      return (sell.quantity > 0);
    } catch (err) {
      throw err;
    }
  },

  /**
   * Réalise l'achat d'une vente d'un utilisateur.
   * La quantité disponible diminue de 1, et l'argent est transféré de l'acheteur au vendeur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {Object} id - L'id de la vente
   * @param {string} username - le nom de l'utilisateur qui achète.
   * @throws {Error} Si la requête à la base de données échoue
   */
  buy : async function (dbo, id, username) {
    if (this.isPurchasable(dbo, id)) {
      await dbo.collection('sells').updateOne(
        { _id: id }, 
        { 
          $inc: { quantity: -1 },
          $push: { buyers: { username: username, date: new Date() } }
        }
      );
      // Fait payer l'utilisateur
      await user.pay(dbo, username, sell.owner, sell.price);
      
      await user.addPoints(dbo, username, 75);
      await user.addPoints(dbo, sell.owner, 100);

    } else {
      throw new Error(`La vente n'est pas achetable.`);
    }
  },

  /**
   * Ajoute une review dans la base de donnée.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {Object} id - L'id de la vente
   * @param {string} username - le nom de l'utilisateur qui achète.
   * @param {number} rating - Le rating entre 1 et 5
   */
  rate: async function (dbo, id, username, rating) {
    try {
      const result = await dbo.collection('sells').updateOne(
        { 
          _id: id,
          "buyers.username": username,
        },
        { 
          $set: { 'buyers.$.rating': rating }
        })
    } catch (err) {
        throw err;
      }
      await user.addPoints(dbo, username, 25);
      
      let sell = await dbo.collection('sells').findOne({ _id: id});
      let sellOwner = sell.owner;

      if (rating ==5 ) {
        await user.addPoints(dbo, sellOwner, 50);
      }
      if (rating ==4 ) {
        await user.addPoints(dbo, sellOwner, 40);
      }
      if (rating ==3 ) {
        await user.addPoints(dbo, sellOwner, 30);
      }
      if (rating ==1 ) {
        await user.addPoints(dbo, sellOwner, -10);
      }
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
      points: 0,
      balance: 0,
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
   * Obtiens le dictionnaire de l'utilisateur depuis la base de donnée à partir du nom d'utilisateur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @return {Object} Le dictionnaire de l'utilisateur
   * @throws {Error} Si la requête à la base de données échoue
   * @exemple ```
   * let user = await user.getUserFromUsername(dbo, "Mr_Yellow_")
   * > user = {username: "Nathan", ...}
   * ```
   */
  getUserFromUsername : async function(dbo, username) {
    return await dbo.collection('users').findOne({
      username: username
    })
  },

  /**
   * Retourne la listes des ventes que l'utilisateur à achetée, dans l'ordre de leur achat.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   */
  getPurchaseHistory : async function(dbo, username) {
    let sells = await dbo.collection('sells')
      .find({
        buyers: { $elemMatch: { username: username } }
      })
      .sort({ 'buyers.date': -1 })
      .toArray();
    return sells;
  },

    /**
   * Retourne la listes des ventes que l'utilisateur à publiée, dans l'ordre de leur vente.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   */
  getSaleHistory : async function(dbo, username) {
    let sells = await dbo.collection('sells')
      .find({ owner : username })
      .sort({ date: -1 })
      .toArray();
    return sells;
  },

  /**
   * Renvois les points d'un utilisateur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   */
  getPoints : async function (dbo, username) {
    return await dbo.collection('users').findOne({ username: username }).points;
  },

  /**
   * Ajoute des points à un utilisateur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @param {number} add - Nombre de points à ajouter
   */
  addPoints: async function (dbo, username, add) {
    await dbo.collection('users').updateOne(
      {username : username }, 
      { $inc: { points: add } });
  },

  
  /**
   * Change la photo de l'utilisateur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @param {Object} photo - La photo à stocker dans la base de donnée.
   */
  changeUserPhoto(dbo, username, photo) {
    dbo.collection('users').updateOne(
      { username: username },
      { $set: { photo: photo } }
    )
  },


  /**
   * Retourne l'argent d'un utilisateur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   */
  getBalance : async function (dbo, username) {
    if (!username) { return 0 }
    let user = await dbo.collection('users').findOne({ username: username });
    if (!user) { return 0 }
    let balance = user.balance || 0;
    return balance;
  },


  /**
   * Modifie le montant des fonds de l'utilisateur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @param {number} amount - Le montant (positif ou négatif) à ajouter à la valeur actuelle.
   */
  addBalance: async function(dbo, username, amount) {  // ✅ async function
    await dbo.collection('users').updateOne(
      { username: username },
      { $inc: { balance: amount } }
    );
  },

  /**
   * Transfer money from an account to another.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} usernameFrom - Le nom d'utilisateur qui paye
   * @param {string} usernameTo - Le nom d'utilisateur qui recoit.
   * @param {string} amount - Le montant à transférer
   */
  pay : async function(dbo, usernameFrom, usernameTo, amount) {
    // Vérification que usernameFrom à le montant nécessaire
    let user = await dbo.collection('users').findOne({ username: usernameFrom });
    if (!user.balance || user.balance < amount) {
      throw(new Error("L'utilisateur n'a pas assez de fonds."));
    }

    await dbo.collection('users').updateOne(
      { username: usernameFrom },
      { $inc: { balance: -amount } }
    );
    await dbo.collection('users').updateOne(
      { username: usernameTo },
      { $inc: { balance: amount } }
    );
  },


  /**
   * Change le mot de passe d'un utilisateur
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   * @param {string} newPassword - Le nouveau mot de passe en clair
   */
  changePassword : async function(dbo, username, newPassword) {
    const hashedPassword = utils.hashString(newPassword);
    await dbo.collection('users').updateOne(
      { username: username },
      { $set: { passwordHash: hashedPassword } }
    );
  },

  /**
  * Calcule la moyenne des notes reçues en tant que vendeur.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   * @param {string} username - Le nom d'utilisateur
   */
  getReviewAverage : async function (dbo, username) {
    const sells = await dbo.collection('sells').find({owner: username, buyers: { $exists: true, $ne: [] }}).toArray();
    let total = 0;
    let count = 0;
  
    for (const sell of sells) {
      for (const buyer of sell.buyers) {
        if (buyer.rating) {
          total += Number(buyer.rating);
          count += 1;
        }
      }
    }
    if (count === 0) {
      return null;
    }
    return total / count;
  },

}



//   +-----------------+
//   |   LEADERBOARD   |
//   +-----------------+

const leaderboard = {

  /**
   * Retourne les 5 premiers membres du classement.
   * Utilise la fonction getFirst(dbo, 5). Permet de rendre le numéro 5 le nombre par défaut.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   */
  getFirst(dbo) {
    this.getFirst(dbo, 5);
  },

  /**
   * Retourne les X premiers membres du classement.
   * @async
   * @param {Object} dbo - L'objet de la base de donnée MongoDB
   */
  getFirst(dbo, number) {
    return dbo.collection('users')
      .find()
      .sort({ points: -1 })
      .limit(parseInt(number, 10))
      .toArray();
  },

}


module.exports = {
  user: user,
  sells: sells,
  leaderboard: leaderboard,
}
