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

MongoClient = require('mongodb').MongoClient;


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

      res.render("layout", {  // Rendu de la page
        title: "Acceuil",
        page: "pages/index",
        username: req.session.username,
        incidents: incidents,
        currentDate: currentDateString,
      })
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