//   +-------------------------------+
//   |   LIBRAIRIES & IMPORTATIONS   |
//   +-------------------------------+

var express = require('express');
var session = require('express-session');
var path = require('path');
var bodyParser = require("body-parser");
var app = express();
var https = require('https');
var fs = require('fs');
const { checkUserInput } = require('./backend/check-input.js');
const db = require('./backend/db.js');
const utils = require('./backend/utils.js');
const filter = require('./backend/filter.js');
const multer = require('multer'); // Permet de gérer les upload d'iamge
const ObjectId = require('mongodb').ObjectId;

MongoClient = require('mongodb').MongoClient;

// Configuration de multer pour stocker les fichiers en mémoire
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5 MB
});


//   +--------------------------------+
//   |   PARAMÈTRES & CONFIGURATION   |
//   +--------------------------------+

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true, charset: 'utf-8' })); 
app.use(bodyParser.json({ charset: 'utf-8' }));
app.use(session({
  secret: "secretPasswordNoOneShouldHave",
  resave: false,
  saveUninitialized: true,
  cookie: { 
    path: '/', 
    httpOnly: true, 
    maxAge: 3600000,
  }
}));
app.use(express.static(path.join(__dirname, 'static')));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  next();
});


// Fonction MAIN asynchrone pour pouvoir charger la base de données
async function main() {
  //   +--------------+
  //   |   SETUP DB   |
  //   +--------------+
  const dbName = process.env.MONGO_DB_NAME || 'LouvainLaVente';
  const client = new MongoClient('mongodb://localhost:27017/');
  try { 
    await client.connect();
    console.log(`Connected to MongoDB (database: ${dbName}).`);
    const dbo = client.db(dbName);


    //   +------------+
    //   |   ROUTES   |
    //   +------------+

    // GET Page principale (+ barre de recherche)
    app.get('/', async function(req, res) {

      let sells = await db.sells.getAll(dbo); // Liste contenant le dictionnaire de toutes les ventes
      
      // FILTRE
      let priceMin = Number(req.query.priceMin);
      let priceMax = Number(req.query.priceMax);
      let category = req.query.category;
      
      // Parser manuellement les categoryFilters
      let categoryFilters = {};
      for (let key in req.query) {
        if (key.startsWith('categoryFilters[') && key.endsWith(']')) {
          // Extraire le nom du champ entre les crochets
          const fieldName = key.slice(16, -1); // Enlever "categoryFilters[" et "]"
          
          // Vérifier si c'est un champ min ou max
          if (fieldName.endsWith('_min') || fieldName.endsWith('_max')) {
            const baseName = fieldName.slice(0, -4); // Enlever "_min" ou "_max"
            if (!categoryFilters[baseName]) {
              categoryFilters[baseName] = {};
            }
            if (fieldName.endsWith('_min')) {
              categoryFilters[baseName].min = req.query[key];
            } else if (fieldName.endsWith('_max')) {
              categoryFilters[baseName].max = req.query[key];
            }
          }
          // Pour les autres champs (select), split par les virgules
          else {
            categoryFilters[fieldName] = req.query[key].split(',');
          }
        }
      }

      // Si un filtre est indiqué, retirer les éléments qui ne correspondent pas
      if (categoryFilters) {
        sells = filter.filter(sells, priceMin, priceMax, category, categoryFilters);
      }
        

      
      // BARRE DE RECHERCHE
      let searchInput = req.query.search; // Input de la barre de recherche
      if (searchInput == "leaderboardPassword") {
        res.redirect('/leaderboard')
        return;
      }
      // Si une recherche a été effectué, tri les ventes selon le terme de recherche
      if (searchInput) { 
        sells = utils.search(sells, searchInput)
      }

      // // TRI
      // // Applique le tri (date, prix)
      let sortType = req.query.sort;
      if (sortType) {
        sells = utils.sort(sells, sortType)
      }


      res.render("layout", {  // Rendu de la page
        title: "Acceuil",
        page: "pages/index",
        username: req.session.username,
        sells: sells,
        categoryData: filter.categoryData,
        userBalance: await db.user.getBalance(dbo, req.session.username),
      })
    });


    // Get LOGOUT
    app.get('/logout', function(req, res) {
      req.session.username = undefined;
      res.redirect('/');
    });


    // Get LOGIN 
    app.get('/login', async function(req, res) {
      if(req.session.username) {
        res.redirect('/');
      }

      else {
        res.render("layout", {
          title: "Connection",
          page: "pages/login",
          username: undefined,
          usernameInput: req.query.username,
          error: req.session.loginErrorMessage,
          userBalance: await db.user.getBalance(dbo, req.session.username),
        })
      }
    });

    // Post LOGIN
    app.post('/login', async function(req, res) {
      let username = req.body.username;
      let password = req.body.password;

      if (await db.user.checkLogin(dbo, username, password)) {
        req.session.username = username;
        delete req.session.loginErrorMessage;
        if (req.session.previousPageBeforeLoginPage != undefined) {
          res.redirect(req.session.previousPageBeforeLoginPage);
          delete req.session.previousPageBeforeLoginPage
        } else {
          res.redirect('/');
        }
      } else {
        req.session.loginErrorMessage = "Identifiants incorrects";
        res.render("layout", {
          title: "Connection",
          page: "pages/login",
          username: req.session.username,
          usernameInput: username,
          error: req.session.loginErrorMessage,
          userBalance: await db.user.getBalance(dbo, req.session.username),
        });
      }
    });


    // Get SIGNUP
    app.get('/signup', async function(req, res) {
      res.render("layout", {
        title: "Inscription",
        page: "pages/signup",
        usernameInput: null,
        emailInput: null,
        fullnameInput: null,
        username: req.session.username,
        error: undefined,
        userBalance: await db.user.getBalance(dbo, req.session.username),
      })
    });

    // Post SIGNUP
    app.post('/signup', async function(req, res) {
      let username = req.body.username;
      let password = req.body.password;
      let passwordCopy = req.body.passwordCopy;
      let fullname = req.body.fullname;
      let email = req.body.email;

      delete req.session.signupErrorMessage;

      // Vérification des conditions de création d'un compte
      if (!checkUserInput.isValidUsername(username)) { // Est-ce que l'username est valide
        req.session.signupErrorMessage = "Le nom d'utilisateur n'est pas valide."
      }
      else if (!await db.user.isUsernameFree(dbo, username)) { // Est-ce que l'username est libre
        req.session.signupErrorMessage = "Ce nom d'utilisateur est déjà utilisé."
      }
      else if (!await db.user.isEmailFree(dbo, email)) { // Est-ce que l'email est libre
        req.session.signupErrorMessage = "Cet email est déjà utilisé."
      }
      else if (password != passwordCopy) { // Est-ce que les deux password complété correspondent
        req.session.signupErrorMessage = "Les deux mots de passe ne correspondent pas."
      } 
      else if (!checkUserInput.isValidPassword(password)) {  // Est-ce que le mot de passe est valide
        req.session.signupErrorMessage = "Le mot de passe n'est pas valide. Il doit :\n- faire plus de 8 caractères"
      }

      // Si les conditions sont OK, tentative de création de compte dans la database
      if (req.session.signupErrorMessage == undefined) {
        try {
          await db.user.create(dbo, username, password, username, email)
        } catch (err) {
          req.session.signupErrorMessage = "Une erreur est survenue avec la base de données."
        }
      }

      // Erreur > Rechargement de la page signup avec les inputs précomplété (pour
      // les données non sensibles) et affiche le message d'erreur.
      if (req.session.signupErrorMessage) {
        res.render("layout", {
          title: "Connection",
          page: "pages/signup",
          usernameInput: username,
          fullnameInput: fullname,
          emailInput: email,
          error: req.session.signupErrorMessage,
          username: req.session.username,
          userBalance: await db.user.getBalance(dbo, req.session.username),
        });
      
      // Aucune erreur > Charge la page d'acceuil en étant connecté
      } else {
        req.session.username = username,
        res.redirect('/');
      }
    });


    // Get PROFILE
    app.get('/profile', async function(req, res) {
      if (!req.session.username) {
        req.session.loginErrorMessage = "Une connexion est nécessaire pour voir son profil.";
        req.session.previousPageBeforeLoginPage = '/profile';
        res.redirect('/login');
      }
      else {
        res.render("layout", {
          title: "Inscription",
          page: "pages/profile",
          username: req.session.username,
          user: await db.user.getUserFromUsername(dbo, req.session.username),
          error: undefined,
          userBalance: await db.user.getBalance(dbo, req.session.username),
          reviewAverage: await db.user.getReviewAverage(dbo, req.session.username),
        })
      };
    });

    // POST pour mettre à jour la photo de profile
    app.post('/profile/updateImage', upload.single('image'), async function(req, res) {
      // Vérifier si l'utilisateur est connecté
      if (!req.session.username) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      let error = "";

      // Récupérer l'image uploadée
      let imageData = null;
      if (req.file) {
        imageData = {
          contentType: req.file.mimetype, // 'image/jpeg', 'image/png', etc.
          data: req.file.buffer.toString('base64'), // Conversion en Base64
          size: req.file.size,
          filename: req.file.originalname,
          userBalance: await db.user.getBalance(dbo, req.session.username),
        };
      }

      // Vérification des conditions
      if (!req.file) {
        error += "Une image est requise.\n";
      }
      else if (req.file.size > 5 * 1024 * 1024) {
        error += "L'image ne doit pas dépasser 5 MB.\n";
      }

      if (error) {
        return res.status(400).json({ error: error });
      }

      // Mettre à jour la photo de profil dans la base de données
      try {
        await db.user.changeUserPhoto(dbo, req.session.username, imageData);
        
        res.json({ success: true, message: "Photo de profil mise à jour avec succès" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Une erreur est survenue avec la base de données" });
      }
    });


    // Post Ajout de fonds
    app.post('/profile/addBalance/:value', async function(req, res) {
      // Vérifier si l'utilisateur est connecté
      if (!req.session.username) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      let amount = Number(req.params.value);
      let balance = await db.user.getBalance(dbo, req.session.username);
      if (balance + amount < 0) {
        amount = -balance;
      }
      await db.user.addBalance(dbo, req.session.username, amount);
      res.redirect('/profile');
    });


    // Get ANNONCE CREATION
    app.get('/annonce-creation', async function(req, res) {
      if(req.session.username == undefined) {
        req.session.loginErrorMessage = "Une connexion est nécessaire pour créer une annonce.";
        req.session.previousPageBeforeLoginPage = '/annonce-creation';
        res.redirect('/login');
      }
      else {
        res.render("layout", {
          title: "Création d'une vente",
          page: "pages/annonce-creation",
          categoryData: filter.categoryData,
          username: req.session.username,
          error: null,
          titleInput: null,
          descriptionInput: null,
          priceInput: null,
          quantityInput: null,
          categoryInput: null,
          filterInput: null,
          addressInput: null,
          userBalance: await db.user.getBalance(dbo, req.session.username),
        })
      }
    });

    // Post ANNONCE CREATION
    app.post('/annonce-creation', upload.single('image'), async function(req, res) {
      let title = req.body.title;
      let description = req.body.description;
      let price = req.body.price;
      let quantity = req.body.quantity;
      let category = req.body.category;
      let filterInputWrongEncode = req.body.filter;
      let address = req.body.address;
      
      // Correction des accents et caractères spéciaux mal encodés
      let filterInput = {}
      if (filterInputWrongEncode) {
        for (let key in filterInputWrongEncode) {
            let newKey = key.replace(/Ã©/g, 'é')
                            .replace(/Ã¨/g, 'è')
                            .replace(/Ã /g, 'à')
            filterInput[newKey] = filterInputWrongEncode[key]
        }
      }

      
      // Récupérer l'image uploadée
      let imageData = null;
      if (req.file) {
        imageData = {
          contentType: req.file.mimetype, // 'image/jpeg', 'image/png', etc.
          data: req.file.buffer.toString('base64'), // Conversion en Base64
          size: req.file.size,
          filename: req.file.originalname
        };
      }
      
      
      // Vérification des conditions
      let error = utils.annonceCreationGetErrorMessage(title, description, address, price, quantity, category);
      if (!req.file) {
        error += "Une image est requise.\n";
      }
      else if (req.file.size > 5 * 1024 * 1024) {
        error += "L'image ne doit pas dépasser 5 MB.\n";
      }

      if(!error) { // Si pas d'erreur, tentative de création de l'élément dans la base de donnée.
        try {
          await db.sells.create(dbo, {
            owner: req.session.username,
            title: title,
            description: description,
            price: price,
            quantity: quantity,
            category: category,
            address: address,
            image: imageData,
            filter: filterInput,
            date: new Date(),
          })
        } catch (err) {
          console.error(err);
          error = +"Une erreur est survenue avec la base de donnée.";
        }
      }

      if (error) { // S'il y a une erreur, réaffiche la page avec les données précomplétée et le message d'erreur.
        res.render("layout", {
          title: "Création d'une vente",
          page: "pages/annonce-creation",
          categoryData: filter.categoryData,
          username: req.session.username,
          error: error,
          titleInput: title,
          descriptionInput: description,
          priceInput: price,
          quantityInput: quantity,
          categoryInput: category,
          addressInput: address,
          filterInput: filterInput,
          error: error,
          userBalance: await db.user.getBalance(dbo, req.session.username),
        });
      } else { // Aucune erreur, alors charge la page d'acceuil.
        res.redirect("/");
      }
    });


    // Get LEADERBOARD
    app.get('/leaderboard', async function(req, res) {
      res.render("layout", {
        title: "Leaderboard", // Titre qui est affiché dans l'onglet du naviguateur chrome
        page: "pages/leaderboard",
        username: req.session.username,
        leaderboard: await db.leaderboard.getFirst(dbo),
        userBalance: await db.user.getBalance(dbo, req.session.username),
      })
    });


    // Get PURCHASE HISTORY
      app.get('/purchase-history', async function(req, res) {
        if (!req.session.username) {
          req.session.loginErrorMessage = "Une connexion est nécessaire pour voir son historique d'achat.";
          req.session.previousPageBeforeLoginPage = '/purchase-history';
          res.redirect('/login');
          return;
        }
        
        const sells = await db.user.getPurchaseHistory(dbo, req.session.username);
        res.render("layout", {
        title: "Historique d'achat", // Titre qui est affiché dans l'onglet du naviguateur chrome
        page: "pages/purchase-history",
        username: req.session.username,
        sells: sells,
        userBalance: await db.user.getBalance(dbo, req.session.username),
      })
    });

    // Get SALE HISTORY
    app.get('/sale-history', async function(req, res) {
      const sells = await db.user.getSaleHistory(dbo, req.session.username);
      res.render("layout", {
        title: "Historique de vente", // Titre qui est affiché dans l'onglet du naviguateur chrome
        page: "pages/sale-history",
        username: req.session.username,
        sells: sells,
        userBalance: await db.user.getBalance(dbo, req.session.username),
      })
    });


    // Get PRODUCT PAGE
    app.get('/product/:sellId', async function(req, res) {
      const sellId = req.params.sellId;
      const sell = await dbo.collection('sells').findOne({ _id: new ObjectId(sellId) });

      res.render("layout", {
        title: "Vente",
        page: "pages/product-page",
        username: req.session.username,
        sell: sell,
        error: null,
        userBalance: await db.user.getBalance(dbo, req.session.username),
        categoryData: filter.categoryData,

        titleInput: sell.title,
        descriptionInput: sell.description,
        priceInput: sell.price,
        quantityInput: sell.quantity,
        categoryInput: sell.category,
        filterInput: sell.filter,
        addressInput: sell.address,
        userBalance: await db.user.getBalance(dbo, req.session.username),
      })
    });

    // Post BUY PRODUCT
    app.post('/sell/:id/buy', async function (req, res) {
      const sellId = req.params.id;
      const username = req.session.username;

      if (!username) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      try {
        await db.sells.buy(dbo, new ObjectId(sellId), username)
      } catch (err) {
        console.error(err);
        
        // Récupérer la vente
        const sell = await dbo.collection('sells').findOne({ _id: new ObjectId(sellId) });
        
        let error = "";
        if (err.message == "La vente n'est pas achetable.") {
          error += "Vous ne pouvez pas acheter ceci.\n";
        } else {
          error += "Une erreur est survenue avec la base de donnée.\n";
        }
        res.render("layout", {
          title: "Vente",
          page: "pages/product-page",
          username: req.session.username,
          sell: sell,
          error: error,
          userBalance: await db.user.getBalance(dbo, req.session.username),
          categoryData: filter.categoryData,
        })
        return;
      }
      res.redirect('/purchase-history');

    });

    // Post PRODUCT UPDATE
    app.post('/product/:sellId/update', async function(req, res) {
      let title = req.body.title;
      let description = req.body.description;
      let price = req.body.price;
      let quantity = req.body.quantity;
      let category = req.body.category;
      let filterInputWrongEncode = req.body.filter;
      let address = req.body.address;
      
      // Correction des accents et caractères spéciaux mal encodés
      let filterInput = {}
      if (filterInputWrongEncode) {
        for (let key in filterInputWrongEncode) {
            let newKey = key.replace(/Ã©/g, 'é')
                            .replace(/Ã¨/g, 'è')
                            .replace(/Ã /g, 'à')
            filterInput[newKey] = filterInputWrongEncode[key]
        }
      }

      
      
      // Vérification des conditions
      let error = "";
      error = utils.annonceCreationGetErrorMessage(title, description, address, price, quantity, category)
      
      if(!error) { // Si pas d'erreur, tentative d'update de l'élément dans la base de donnée.
        try {
          await db.sells.update(dbo, new ObjectId(req.params.sellId), {
            title: title,
            description: description,
            price: price,
            quantity: quantity,
            category: category,
            address: address,
            filter: filterInput,
          })
        } catch (err) {
          console.error(err);
          error = +"Une erreur est survenue avec la base de donnée.";
        }
      }

      if (error) { // S'il y a une erreur, réaffiche la page avec les données précomplétée et le message d'erreur.
        const sellId = req.params.sellId;
        const sell = await dbo.collection('sells').findOne({ _id: new ObjectId(sellId) });

        res.render("layout", {
          title: "Vente",
          page: "pages/product-page",
          username: req.session.username,
          sell: sell,
          error: error,
          categoryData: filter.categoryData,

          titleInput: sell.title,
          descriptionInput: sell.description,
          priceInput: sell.price,
          quantityInput: sell.quantity,
          categoryInput: sell.category,
          filterInput: sell.filter,
          addressInput: sell.address,
          userBalance: await db.user.getBalance(dbo, req.session.username),

        })
      } else { // Aucune erreur, alors charge la page du produit
        res.redirect("/sale-history");
      }
    });


    // Post RATE PRODUCT
    app.post('/rating/:id/:rating', async function(req, res) {
      const sellId = req.params.id;
      const rating = req.params.rating;
      const username = req.session.username;

      try {
        await db.sells.rate(dbo, new ObjectId(sellId), username, rating)
      } catch (err) {
        console.error(err);
      }
      res.redirect('/purchase-history');

    });


    // Get une image de vente
    app.get('/image/sell/:sellId', async function(req, res) {
      try {
        const sellId = req.params.sellId;
        
        // Récupérer la vente depuis la base de données
        const sell = await dbo.collection('sells').findOne({ _id: new ObjectId(sellId) });
        
        if (!sell || !sell.image || !sell.image.data) {
          return res.status(404).send('Image non trouvée'); // Erreur lorsque l'image n'est pas trouvée, ou qu'elle n'existe pas.
        }
        
        // Converti l'image de Base64 à Buffer ()
        const imageBuffer = Buffer.from(sell.image.data, 'base64');
        
        // Définir le type de contenu
        res.set('Content-Type', sell.image.contentType); // On envoit le même type de contenu que le type de l'image
        res.send(imageBuffer);
        
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'image:', err);
        res.status(500).send('Erreur serveur');
      }
    });

    // Get une photo de profile
    app.get('/image/user/:username', async function(req, res) {
      try {
        const username = req.params.username;
        
        // Récupérer l'utilisateur depuis la base de données
        const profile = await db.user.getUserFromUsername(dbo, username);

        // Erreur lorsque l'image n'est pas trouvée, ou qu'elle n'existe pas.
        if (!profile) { 
          return res.status(404).send('Image non trouvée'); 
        }

        // Si l'utilisateur n'a pas d'image, retourner l'image par défaut
        else if (!profile.photo || !profile.photo.data) {
          return res.sendFile(path.join(__dirname, 'static', 'defaultUserProfile.png'));
        }
        
        // Converti l'image de Base64 à Buffer ()
        const imageBuffer = Buffer.from(profile.photo.data, 'base64');
        
        // Définir le type de contenu
        res.set('Content-Type', profile.photo.contentType);
        res.send(imageBuffer);
        
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'image:', err);
        // En cas d'erreur serveur, retourner aussi l'image par défaut
        res.sendFile(path.join(__dirname, 'static', 'defaultUserProfile.png'));
      }
    });

  app.post('/profile/PasswordChange', async function(req, res) {
    const username = req.session.username;
    const newPassword = req.body.newPassword;
    const copyNewPassword = req.body.copyNewPassword;

    let error;

    // Vérification des conditions
    if (newPassword != copyNewPassword) {
      error = "Les deux mots de passe ne correspondent pas"
    } 
    else if (!checkUserInput.isValidPassword(newPassword)) {
      error = "Le mot de passe n'est pas valide. Il doit faire plus de 8 caractères"
    }

    if (error) {
      // Retourne une erreur 400 avec le message d'erreur
      return res.status(400).json({ error: error });
    }

    try {
      await db.user.changePassword(dbo, username, newPassword);
      // Retourne un statut succès avec un message de confirmation
      return res.status(200).json({ message: "Mot de passe changé avec succès ✅" });
    } catch (err) {
      console.error(err);
      // Erreur serveur
      return res.status(500).json({ error: "Une erreur est survenue avec la base de données" });
    }
  });


    // Page inexistante, redirection vers la page principale
    app.use((req, res) => {
      res.redirect("/");
    });



    //   +------------------+
    //   |   End > ROUTES   |
    //   +------------------+



    // Création du serveur avec protocol HTTPS
    const PORT = process.env.PORT || 8080;
    https.createServer({
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem'),
      passphrase: 'secretPasswordNoOneShouldHave'
    }, app).listen(PORT, function () {
      console.log(`Server is running on port ${PORT}...`);
    });

  // Erreur lors de connection à la base de donnée
  } catch (err) {
      console.error("ERROR connecting to MongoDB:", err);
      process.exit(1); // Cut le serveur (il ne sert a rien sans db)
  }
}


main().catch(console.error);

module.exports = app;