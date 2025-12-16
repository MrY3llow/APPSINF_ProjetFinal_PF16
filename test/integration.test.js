// server.test.js
const request = require('supertest');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

// Configuration de test
const TEST_DB_NAME = 'LouvainLaVente_Test';
let app, client, dbo;

// Setup avant tous les tests
beforeAll(async () => {
  // Connexion à MongoDB de test
  client = new MongoClient('mongodb://localhost:27017/');
  await client.connect();
  dbo = client.db(TEST_DB_NAME);
  
  // Définir la variable d'environnement pour utiliser la DB de test
  process.env.MONGO_DB_NAME = TEST_DB_NAME;
  
  // Charger l'application (sans démarrer le serveur)
  delete require.cache[require.resolve('../server.js')];
  app = require('../server.js');
  
  // Attendre que l'app soit prête
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Nettoyage après tous les tests
afterAll(async () => {
  if (client) {
    // Supprimer la base de données de test
    await dbo.dropDatabase();
    await client.close();
  }
});

// Nettoyage avant chaque test
beforeEach(async () => {
  // Vider les collections
  const collections = await dbo.listCollections().toArray();
  for (const collection of collections) {
    await dbo.collection(collection.name).deleteMany({});
  }
});

describe('Tests des routes publiques', () => {
  
  test('GET / - Page d\'accueil retourne 200', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Louvain-la-Vente');
  });

  test('GET /login - Page de connexion retourne 200', async () => {
    const response = await request(app).get('/login');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Identification');
  });

  test('GET /signup - Page d\'inscription retourne 200', async () => {
    const response = await request(app).get('/signup');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Création de compte');
  });

  test('GET /leaderboard - Page leaderboard retourne 200', async () => {
    const response = await request(app).get('/leaderboard');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Leaderboard');
  });
});

describe('Tests d\'authentification', () => {
  
  test('POST /signup - Création de compte valide', async () => {
    const response = await request(app)
      .post('/signup')
      .send({
        username: 'testuser',
        password: 'Password123',
        passwordCopy: 'Password123',
        fullname: 'Test User',
        email: 'test@example.com'
      });
    
    expect(response.status).toBe(302); // Redirection
    expect(response.headers.location).toBe('/');
    
    // Vérifier que l'utilisateur existe dans la DB
    const user = await dbo.collection('users').findOne({ username: 'testuser' });
    expect(user).toBeTruthy();
    expect(user.email).toBe('test@example.com');
  });

  test('POST /signup - Username déjà utilisé', async () => {
    // Créer un utilisateur
    await dbo.collection('users').insertOne({
      username: 'existing',
      password: 'hashedpass',
      email: 'existing@example.com',
      points: 0,
      balance: 0
    });
    
    const response = await request(app)
      .post('/signup')
      .send({
        username: 'existing',
        password: 'Password123',
        passwordCopy: 'Password123',
        fullname: 'Test User',
        email: 'new@example.com'
      });
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Ce nom d\'utilisateur est déjà utilisé');
  });

  test('POST /signup - Mots de passe non correspondants', async () => {
    const response = await request(app)
      .post('/signup')
      .send({
        username: 'testuser',
        password: 'Password123',
        passwordCopy: 'DifferentPass123',
        fullname: 'Test User',
        email: 'test@example.com'
      });
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Les deux mots de passe ne correspondent pas');
  });

  test('POST /login - Connexion réussie', async () => {
    // Créer un utilisateur avec le bon hash de mot de passe
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    await dbo.collection('users').insertOne({
      username: 'logintest',
      password: hashedPassword,
      email: 'login@example.com',
      points: 0,
      balance: 100
    });
    
    const response = await request(app)
      .post('/login')
      .send({
        username: 'logintest',
        password: 'Password123'
      });
    
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  test('POST /login - Identifiants incorrects', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        username: 'wronguser',
        password: 'wrongpass'
      });
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Identifiants incorrects');
  });

  test('GET /logout - Déconnexion', async () => {
    const agent = request.agent(app);
    
    // Se connecter d'abord
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    await dbo.collection('users').insertOne({
      username: 'logouttest',
      password: hashedPassword,
      email: 'logout@example.com',
      points: 0,
      balance: 100
    });
    
    await agent.post('/login').send({
      username: 'logouttest',
      password: 'Password123'
    });
    
    // Se déconnecter
    const response = await agent.get('/logout');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });
});

describe('Tests de création d\'annonce', () => {
  let authenticatedAgent;
  
  beforeEach(async () => {
    // Créer un utilisateur authentifié pour les tests
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    await dbo.collection('users').insertOne({
      username: 'seller',
      password: hashedPassword,
      email: 'seller@example.com',
      points: 0,
      balance: 500
    });
    
    authenticatedAgent = request.agent(app);
    await authenticatedAgent.post('/login').send({
      username: 'seller',
      password: 'Password123'
    });
  });

  test('GET /annonce-creation - Accès page création (connecté)', async () => {
    const response = await authenticatedAgent.get('/annonce-creation');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Création d\'une vente');
  });

  test('GET /annonce-creation - Redirection si non connecté', async () => {
    const response = await request(app).get('/annonce-creation');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('POST /annonce-creation - Création annonce valide avec image', async () => {
    const response = await authenticatedAgent
      .post('/annonce-creation')
      .field('title', 'Vélo de course')
      .field('description', 'Un excellent vélo en bon état')
      .field('price', '150')
      .field('quantity', '1')
      .field('category', 'Véhicule')
      .field('address', 'Louvain-la-Neuve')
      .attach('image', Buffer.from('fake-image-data'), 'test.jpg');
    
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    
    // Vérifier que l'annonce existe
    const sell = await dbo.collection('sells').findOne({ title: 'Vélo de course' });
    expect(sell).toBeTruthy();
    expect(sell.owner).toBe('seller');
    expect(sell.price).toBe('150');
  });

  test('POST /annonce-creation - Erreur sans image', async () => {
    const response = await authenticatedAgent
      .post('/annonce-creation')
      .field('title', 'Vélo sans image')
      .field('description', 'Description')
      .field('price', '100')
      .field('quantity', '1')
      .field('category', 'Véhicule')
      .field('address', 'Louvain-la-Neuve');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Une image est requise');
  });

  test('POST /annonce-creation - Erreur champs manquants', async () => {
    const response = await authenticatedAgent
      .post('/annonce-creation')
      .field('title', '')
      .field('description', '')
      .attach('image', Buffer.from('fake-image-data'), 'test.jpg');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('error-message');
  });
});

describe('Tests de page produit et achat', () => {
  let sellId;
  let buyerAgent, sellerAgent;
  
  beforeEach(async () => {
    // Créer vendeur
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    await dbo.collection('users').insertOne({
      username: 'seller',
      password: hashedPassword,
      email: 'seller@example.com',
      points: 0,
      balance: 100
    });
    
    // Créer acheteur
    await dbo.collection('users').insertOne({
      username: 'buyer',
      password: hashedPassword,
      email: 'buyer@example.com',
      points: 0,
      balance: 500
    });
    
    // Créer une vente
    const result = await dbo.collection('sells').insertOne({
      owner: 'seller',
      title: 'Produit test',
      description: 'Description test',
      price: 100,
      quantity: 5,
      category: 'Électronique',
      address: 'Louvain-la-Neuve',
      date: new Date(),
      image: {
        contentType: 'image/jpeg',
        data: Buffer.from('fake-image').toString('base64')
      }
    });
    sellId = result.insertedId;
    
    // Authentifier acheteur
    buyerAgent = request.agent(app);
    await buyerAgent.post('/login').send({
      username: 'buyer',
      password: 'Password123'
    });
    
    // Authentifier vendeur
    sellerAgent = request.agent(app);
    await sellerAgent.post('/login').send({
      username: 'seller',
      password: 'Password123'
    });
  });

  test('GET /product/:id - Afficher page produit', async () => {
    const response = await request(app).get(`/product/${sellId}`);
    expect(response.status).toBe(200);
    expect(response.text).toContain('Produit test');
    expect(response.text).toContain('100 €');
  });

  test('POST /sell/:id/buy - Achat réussi', async () => {
    const response = await buyerAgent.post(`/sell/${sellId}/buy`);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/purchase-history');
    
    // Vérifier que la quantité a diminué
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    expect(sell.quantity).toBe(4);
    
    // Vérifier que l'acheteur a été ajouté
    expect(sell.buyers).toContainEqual(
      expect.objectContaining({ username: 'buyer' })
    );
    
    // Vérifier le solde
    const buyer = await dbo.collection('users').findOne({ username: 'buyer' });
    expect(buyer.balance).toBe(400); // 500 - 100
  });

  test('POST /sell/:id/buy - Le vendeur ne peut pas acheter son produit', async () => {
    const response = await sellerAgent.post(`/sell/${sellId}/buy`);
    expect(response.status).toBe(200);
    expect(response.text).toContain('Vous ne pouvez pas acheter ceci');
  });

  test('GET /image/sell/:id - Récupérer image de vente', async () => {
    const response = await request(app).get(`/image/sell/${sellId}`);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/jpeg');
  });

  test('POST /product/:id/update - Mise à jour par le vendeur', async () => {
    const response = await sellerAgent
      .post(`/product/${sellId}/update`)
      .send({
        title: 'Produit modifié',
        description: 'Nouvelle description',
        price: 120,
        quantity: 3,
        category: 'Électronique',
        address: 'Bruxelles'
      });
    
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/sale-history');
    
    // Vérifier la mise à jour
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    expect(sell.title).toBe('Produit modifié');
    expect(sell.price).toBe(120);
  });
});

describe('Tests de profil utilisateur', () => {
  let userAgent;
  
  beforeEach(async () => {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    await dbo.collection('users').insertOne({
      username: 'profiletest',
      password: hashedPassword,
      email: 'profile@example.com',
      points: 50,
      balance: 200
    });
    
    userAgent = request.agent(app);
    await userAgent.post('/login').send({
      username: 'profiletest',
      password: 'Password123'
    });
  });

  test('GET /profile - Accès profil connecté', async () => {
    const response = await userAgent.get('/profile');
    expect(response.status).toBe(200);
    expect(response.text).toContain('profiletest');
    expect(response.text).toContain('200 €');
  });

  test('GET /profile - Redirection si non connecté', async () => {
    const response = await request(app).get('/profile');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('POST /profile/addBalance - Ajouter des fonds', async () => {
    const response = await userAgent.post('/profile/addBalance/100');
    expect(response.status).toBe(302);
    
    const user = await dbo.collection('users').findOne({ username: 'profiletest' });
    expect(user.balance).toBe(300); // 200 + 100
  });

  test('POST /profile/PasswordChange - Changer mot de passe valide', async () => {
    const response = await userAgent
      .post('/profile/PasswordChange')
      .send({
        newPassword: 'NewPassword123',
        copyNewPassword: 'NewPassword123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('succès');
  });

  test('POST /profile/PasswordChange - Mots de passe non identiques', async () => {
    const response = await userAgent
      .post('/profile/PasswordChange')
      .send({
        newPassword: 'NewPassword123',
        copyNewPassword: 'DifferentPass123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('ne correspondent pas');
  });

  test('GET /image/user/:username - Image par défaut si pas de photo', async () => {
    const response = await request(app).get('/image/user/profiletest');
    expect(response.status).toBe(200);
  });
});

describe('Tests d\'historique', () => {
  let userAgent;
  let sellId;
  
  beforeEach(async () => {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    await dbo.collection('users').insertOne({
      username: 'historytest',
      password: hashedPassword,
      email: 'history@example.com',
      points: 0,
      balance: 500
    });
    
    // Créer une vente
    const result = await dbo.collection('sells').insertOne({
      owner: 'historytest',
      title: 'Vente historique',
      description: 'Test',
      price: 50,
      quantity: 1,
      category: 'Autre',
      address: 'Test',
      date: new Date()
    });
    sellId = result.insertedId;
    
    userAgent = request.agent(app);
    await userAgent.post('/login').send({
      username: 'historytest',
      password: 'Password123'
    });
  });

  test('GET /sale-history - Afficher historique de vente', async () => {
    const response = await userAgent.get('/sale-history');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Mon historique de ventes');
    expect(response.text).toContain('Vente historique');
  });

  test('GET /purchase-history - Afficher historique d\'achat', async () => {
    const response = await userAgent.get('/purchase-history');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Mon historique d\'achats');
  });

  test('POST /rating/:id/:rating - Noter un achat', async () => {
    // Simuler un achat
    await dbo.collection('sells').updateOne(
      { _id: sellId },
      { 
        $push: { 
          buyers: { username: 'historytest', date: new Date() } 
        } 
      }
    );
    
    const response = await userAgent.post(`/rating/${sellId}/5`);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/purchase-history');
    
    // Vérifier que la note a été ajoutée
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    expect(sell.buyers[0].rating).toBe('5');
  });
});

describe('Tests de recherche et filtres', () => {
  
  beforeEach(async () => {
    // Créer plusieurs ventes pour tester la recherche
    await dbo.collection('sells').insertMany([
      {
        owner: 'user1',
        title: 'Vélo rouge',
        description: 'Un beau vélo',
        price: 100,
        quantity: 1,
        category: 'Véhicule',
        address: 'Louvain',
        date: new Date('2024-01-01')
      },
      {
        owner: 'user2',
        title: 'Ordinateur portable',
        description: 'PC gaming',
        price: 800,
        quantity: 2,
        category: 'Électronique',
        address: 'Bruxelles',
        date: new Date('2024-02-01')
      },
      {
        owner: 'user3',
        title: 'Chaise de bureau',
        description: 'Confortable',
        price: 50,
        quantity: 3,
        category: 'Mobilier',
        address: 'Mons',
        date: new Date('2024-03-01')
      }
    ]);
  });

  test('GET / - Recherche par terme', async () => {
    const response = await request(app).get('/?search=vélo');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Vélo rouge');
    expect(response.text).not.toContain('Ordinateur');
  });

  test('GET / - Filtre par prix minimum', async () => {
    const response = await request(app).get('/?priceMin=100');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Vélo rouge');
    expect(response.text).toContain('Ordinateur');
    expect(response.text).not.toContain('Chaise');
  });

  test('GET / - Filtre par prix maximum', async () => {
    const response = await request(app).get('/?priceMax=100');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Vélo rouge');
    expect(response.text).toContain('Chaise');
    expect(response.text).not.toContain('Ordinateur');
  });

  test('GET / - Filtre par catégorie', async () => {
    const response = await request(app).get('/?category=Électronique');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Ordinateur');
    expect(response.text).not.toContain('Vélo');
  });

  test('GET / - Tri par prix croissant', async () => {
    const response = await request(app).get('/?sort=price-asc');
    expect(response.status).toBe(200);
    // Vérifier que les produits apparaissent dans le bon ordre
    const chairIndex = response.text.indexOf('Chaise');
    const bikeIndex = response.text.indexOf('Vélo rouge');
    const pcIndex = response.text.indexOf('Ordinateur');
    
    expect(chairIndex).toBeLessThan(bikeIndex);
    expect(bikeIndex).toBeLessThan(pcIndex);
  });
});

describe('Tests de sécurité', () => {
  
  test('Routes protégées redirigent vers login', async () => {
    const protectedRoutes = [
      '/annonce-creation',
      '/profile',
      '/purchase-history',
      '/sale-history'
    ];
    
    for (const route of protectedRoutes) {
      const response = await request(app).get(route);
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/login');
    }
  });

  test('Validation des données utilisateur', async () => {
    // Username invalide (trop court)
    const response1 = await request(app)
      .post('/signup')
      .send({
        username: 'ab',
        password: 'Password123',
        passwordCopy: 'Password123',
        fullname: 'Test',
        email: 'test@test.com'
      });
    expect(response1.text).toContain('n\'est pas valide');
    
    // Mot de passe trop court
    const response2 = await request(app)
      .post('/signup')
      .send({
        username: 'validuser',
        password: 'short',
        passwordCopy: 'short',
        fullname: 'Test',
        email: 'test@test.com'
      });
    expect(response2.text).toContain('n\'est pas valide');
  });
});

describe('Tests de routes inexistantes', () => {
  
  test('Route inexistante redirige vers /', async () => {
    const response = await request(app).get('/route-inexistante');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });
});