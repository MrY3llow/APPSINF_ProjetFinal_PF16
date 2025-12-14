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
const { error } = require('console');
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

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
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

      let searchInput = req.query.search; // Input de la barre de recherche
      // let filterInfo = req.query.filter // Donnée de filtre
      // let sortType = req.query.sort; // Type de tri

      let sells = await db.sells.getAll(dbo); // Liste contenant le dictionnaire de toutes les ventes

      // // FILTRE
      // // Si un filtre est indiqué, retirer les éléments qui ne correspondent pas
      // if (filterInfo) {
      //   sells = utils.filter(sells, filterInfo)
      // }

      // BARRE DE RECHERCHE
      if (searchInput == "leaderboardPassword") {
        res.redirect('/leaderboard')
        return;
      }
      // // Si une recherche a été effectué, tri les ventes selon le terme de recherche
      // if (searchInput) { 
      //   sells = utils.search(sells, searchInput)
      // }

      // // TRI
      // // Applique le tri (date, prix)
      // sells = utils.sort(sells, sortType)


      res.render("layout", {  // Rendu de la page
        title: "Acceuil",
        page: "pages/index",
        username: req.session.username,
        sells: sells,
      })
    })





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
        });
      
      // Aucune erreur > Charge la page d'acceuil en étant connecté
      } else {
        req.session.username = username,
        res.redirect('/');
      }
    });


    // Get PROFILE
    app.get('/profile', async function(req, res) {
      res.render("layout", {
        title: "Inscription",
        page: "pages/profile",
        username: req.session.username,
        error: undefined,
      })
    });


    // Get ANNONCE CREATION
    app.get('/annonce-creation', function(req, res) {
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
      let filter = req.body.filter;
      let address = req.body.address;

      let error = "";

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
      if (!checkUserInput.isValidSellTitle(title)) {
        error += "Le titre doit faire au moins 3 caractères.\n"
      }

      if (!checkUserInput.isValidSellDescription(description)) {
        error += "La description doit faire au moins 10 caractères.\n"
      }

      if (!req.file) {
        error += "Une image est requise.\n";
      }
      else if (req.file.size > 5 * 1024 * 1024) {
        error += "L'image ne doit pas dépasser 5 MB.\n";
      }

      if (!checkUserInput.isValidSellAddress(address)) {
        error += "L'adresse doit faire au moins 15 caractères.\n";
      }

      if (!checkUserInput.isValidSellPrice(price)) {
        error += "Le prix doit être positif.\n"
      }

      if (!checkUserInput.isValidSellQuantity(quantity)) {
        error += "La quantité doit être un nombre positif sans virgule.\n"
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
            filter: filter,
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
          error: error,
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
      })
    });


    // Get PURCHASE HISTORY
    app.get('/purchase-history', async function(req, res) {
      res.render("layout", {
        title: "Historique d'achat", // Titre qui est affiché dans l'onglet du naviguateur chrome
        page: "pages/purchase-history",
        username: req.session.username,
      })
    });


    // Get SELL MODIFICATION
    app.get('/sell-modification/:sellId', async function(req, res) {
      // Page de démo pour l'instant
      // Variable pas encore utiliser.
      const sellId = req.params.sellId;

      res.render("layout", {
        title: "Moddification d'une vente", // Titre qui est affiché dans l'onglet du naviguateur chrome
        page: "pages/sell-modification",
        username: req.session.username,
      })
    });


    // Get PRODUCT PAGE
    app.get('/product/:sellId', async function(req, res) {
      // Page de démo pour l'instant
      // Variable pas encore utiliser.
      const sellId = req.params.sellId;
      const sell = await dbo.collection('sells').findOne({ _id: new ObjectId(sellId) });

      res.render("layout", {
        title: "Vente", // Titre qui est affiché dans l'onglet du naviguateur chrome
        page: "pages/product-page",
        username: req.session.username,
        sell: sell,
        error: null,
      })
    });

    // Post BUY PRODUCT
    app.post('/sell/:id/buy', (req, res) => {
      const sellId = req.params.id;
      const username = req.session.username;
      console.log(username);

      try {
        db.sells.buy(dbo, new ObjectId(sellId), username)
      } catch (err) {
        let error = "";
        if (err.message == "La vente n'est pas achetable.") {
          error += "Vous ne pouvez pas acheter ceci.\n";
        } else {
          error += "Une erreur est survenue avec la base de donnée.\n";
        }
        res.render("layout", {
          title: "Vente", // Titre qui est affiché dans l'onglet du naviguateur chrome
          page: "pages/product-page",
          username: req.session.username,
          sell: sell,
          error: error,
        })
        return;
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
    app.get('/image/profile/:username', async function(req, res) {
      try {
        const username = req.params.username;
        
        // Récupérer l'utilisateur depuis la base de données
        const profile = await dbo.collection('sells').findOne({ username: username });
        
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




    // // Page inexistante, redirection vers la page principale
    // app.use((req, res) => {
    //   res.redirect("/");
    // });



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