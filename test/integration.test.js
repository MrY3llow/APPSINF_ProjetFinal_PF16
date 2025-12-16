const request = require("supertest");
const { MongoClient, ObjectId } = require('mongodb');
const db = require('../backend/db.js');

let connection;
let dbo;
let app;

beforeAll(async () => {
  process.env.MONGO_DB_NAME = "LouvainLaVente_TEST";
  process.env.PORT = 8081;
  process.env.NODE_ENV = 'test';
  
  app = require("../server.js");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  connection = await MongoClient.connect('mongodb://localhost:27017/');
  dbo = connection.db("LouvainLaVente_TEST");
  
  await db.user.create(dbo, 'testuser', 'password123', 'Test User', 'test@example.com');
  await db.user.addBalance(dbo, 'testuser', 100);
  
  await db.user.create(dbo, 'buyer', 'password123', 'Buyer User', 'buyer@example.com');
  await db.user.addBalance(dbo, 'buyer', 200);
}, 10000);

afterAll(async () => {
  await dbo.dropDatabase();
  await connection.close();
}, 10000);

beforeEach(async () => {
  await dbo.collection('sells').deleteMany({});
});


describe("POST /login", () => {

  it("Should login with correct credentials", async() => {
    const res = await request(app)
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  it("Should reject login with wrong username", async() => {
    const res = await request(app)
      .post('/login')
      .send({username: 'wronguser', password: 'password123'});
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Identifiants incorrects");
  });
  
  it("Should reject login with wrong password", async() => {
    const res = await request(app)
      .post('/login')
      .send({username: 'testuser', password: 'wrongpassword'});
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Identifiants incorrects");
  });
});


describe("POST /signup", () => {
  
  beforeEach(async () => {
    await dbo.collection('users').deleteMany({ 
      username: { $nin: ['testuser', 'buyer'] } 
    });
  });
  
  it("Should create new user with valid credentials", async() => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        password: 'validpass123',
        passwordCopy: 'validpass123',
        fullname: 'New User',
        email: 'newuser@test.com'
      });
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
    
    const userExists = await db.user.isUsernameFree(dbo, 'newuser');
    expect(userExists).toBe(false);
  });
  
  it("Should reject signup with existing username", async() => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'testuser',
        password: 'newpass123',
        passwordCopy: 'newpass123',
        fullname: 'Another User',
        email: 'another@test.com'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Ce nom d'utilisateur est déjà utilisé");
  });
  
  it("Should reject signup when passwords don't match", async() => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'newuser2',
        password: 'password123',
        passwordCopy: 'password456',
        fullname: 'Test User',
        email: 'test2@test.com'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Les deux mots de passe ne correspondent pas");
  });
  
  it("Should reject signup with invalid password", async() => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'newuser3',
        password: 'short',
        passwordCopy: 'short',
        fullname: 'Test User',
        email: 'test3@test.com'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Le mot de passe n'est pas valide");
  });

  it("Should reject signup with existing email", async() => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'newuser4',
        password: 'validpass123',
        passwordCopy: 'validpass123',
        fullname: 'Test User',
        email: 'test@example.com'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Cet email est déjà utilisé");
  });
});


describe("GET /annonce-creation", () => {
  
  it("Should redirect to login when not authenticated", async() => {
    const res = await request(app).get('/annonce-creation');
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
  
  it("Should show creation page when authenticated", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent.get('/annonce-creation');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Créer une annonce");
  });
});


describe("POST /annonce-creation", () => {
  
  it("Should create sell with valid data and image", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent
      .post('/annonce-creation')
      .field('title', 'Test Product')
      .field('description', 'This is a test product description')
      .field('price', '25.50')
      .field('quantity', '5')
      .field('category', 'Électronique')
      .field('address', '123 Rue de Test, Louvain-la-Neuve')
      .attach('image', Buffer.from('fake image data'), 'test.jpg');
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
    
    const sells = await dbo.collection('sells').find().toArray();
    expect(sells).toHaveLength(1);
    expect(sells[0].title).toBe('Test Product');
    expect(sells[0].owner).toBe('testuser');
    expect(sells[0].price).toBe(25.5);
  });
  
  it("Should reject sell without title", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent
      .post('/annonce-creation')
      .field('title', '')
      .field('description', 'Description')
      .field('price', '25')
      .field('quantity', '5')
      .field('category', 'Électronique')
      .field('address', '123 Rue de Test, Louvain-la-Neuve')
      .attach('image', Buffer.from('fake image'), 'test.jpg');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Le titre doit faire au moins 3 caractères");
  });
  
  it("Should reject sell without image", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent
      .post('/annonce-creation')
      .field('title', 'Test Product')
      .field('description', 'Description')
      .field('price', '25')
      .field('quantity', '5')
      .field('category', 'Électronique')
      .field('address', '123 Rue de Test, Louvain-la-Neuve');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Une image est requise");
  });
  
  it("Should reject sell with invalid price", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent
      .post('/annonce-creation')
      .field('title', 'Test Product')
      .field('description', 'Description')
      .field('price', '-5')
      .field('quantity', '5')
      .field('category', 'Électronique')
      .field('address', '123 Rue de Test, Louvain-la-Neuve')
      .attach('image', Buffer.from('fake image'), 'test.jpg');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Le prix doit être positif");
  });

  it("Should reject sell with invalid quantity", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent
      .post('/annonce-creation')
      .field('title', 'Test Product')
      .field('description', 'Description')
      .field('price', '25')
      .field('quantity', '0')
      .field('category', 'Électronique')
      .field('address', '123 Rue de Test, Louvain-la-Neuve')
      .attach('image', Buffer.from('fake image'), 'test.jpg');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("La quantité doit être");
  });
});


describe("POST /sell/:id/buy", () => {
  
  let sellId;
  
  beforeEach(async () => {
    const result = await dbo.collection('sells').insertOne({
      owner: 'testuser',
      title: 'Test Product',
      description: 'Test description',
      price: 20,
      quantity: 5,
      category: 'Électronique',
      address: 'Test Address',
      image: {
        data: Buffer.from('fake').toString('base64'),
        contentType: 'image/jpeg'
      },
      date: new Date(),
      buyers: []
    });
    
    sellId = result.insertedId;
  });
  
  it("Should successfully buy a product when logged in with sufficient balance", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'buyer', password: 'password123'});
    
    const res = await agent
      .post(`/sell/${sellId}/buy`);
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/purchase-history');
    
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    expect(sell.quantity).toBe(4);
    expect(sell.buyers.some(b => b.username === 'buyer')).toBe(true);
  });
  
  it("Should reject purchase when not logged in", async() => {
    const res = await request(app)
      .post(`/sell/${sellId}/buy`);
    
    expect(res.statusCode).toBe(401);
  });
});


describe("GET /profile", () => {
  
  it("Should redirect to login when not authenticated", async() => {
    const res = await request(app).get('/profile');
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
  
  it("Should show profile page when authenticated", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent.get('/profile');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('testuser');
  });
});


describe("POST /profile/addBalance/:value", () => {
  
  it("Should add balance when authenticated", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent
      .post('/profile/addBalance/50');
    
    expect(res.statusCode).toBe(302);
    
    const balance = await db.user.getBalance(dbo, 'testuser');
    expect(balance).toBeGreaterThan(100);
  });
  
  it("Should not allow negative balance", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const initialBalance = await db.user.getBalance(dbo, 'testuser');
    
    await agent.post(`/profile/addBalance/-${initialBalance + 50}`);
    
    const finalBalance = await db.user.getBalance(dbo, 'testuser');
    expect(finalBalance).toBe(0);
  });
});


describe("GET /sale-history", () => {
  
  it("Should show sale history when authenticated", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent.get('/sale-history');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Mon historique de ventes");
  });
});


describe("GET /", () => {
  
  it("Should display homepage with sells", async() => {
    const res = await request(app).get('/');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Produits disponibles");
  });
  
  it("Should filter by price", async() => {
    await dbo.collection('sells').insertMany([
      {
        owner: 'testuser',
        title: 'Cheap Product',
        description: 'Test',
        price: 10,
        quantity: 1,
        category: 'Électronique',
        address: 'Address',
        date: new Date()
      },
      {
        owner: 'testuser',
        title: 'Expensive Product',
        description: 'Test',
        price: 100,
        quantity: 1,
        category: 'Électronique',
        address: 'Address',
        date: new Date()
      }
    ]);
    
    const res = await request(app).get('/?priceMin=50');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Expensive Product");
    expect(res.text).not.toContain("Cheap Product");
  });
  
  it("Should search by term", async() => {
    await dbo.collection('sells').insertOne({
      owner: 'testuser',
      title: 'Laptop Computer',
      description: 'Test',
      price: 500,
      quantity: 1,
      category: 'Électronique',
      address: 'Address',
      date: new Date()
    });
    
    const res = await request(app).get('/?search=Laptop');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Laptop Computer");
  });
});


describe("GET /logout", () => {
  
  it("Should logout and redirect to homepage", async() => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({username: 'testuser', password: 'password123'});
    
    const res = await agent.get('/logout');
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});