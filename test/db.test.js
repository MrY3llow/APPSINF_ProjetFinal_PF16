const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const db = require('../backend/db.js');
const utils = require('../backend/utils.js');

let connection;
let dbo;

// Setup avant tous les tests
beforeAll(async () => {
  connection = await MongoClient.connect('mongodb://localhost:27017/');
  dbo = connection.db("LouvainLaVente_TEST");
});

// Nettoyage après tous les tests
afterAll(async () => {
  await dbo.dropDatabase();
  await connection.close();
});

// Réinitialisation avant chaque test
beforeEach(async () => {
  await dbo.collection('users').deleteMany({});
  await dbo.collection('sells').deleteMany({});
});


//   +-----------+
//   |   SELLS   |
//   +-----------+

describe("sells.checkSellsOptions()", () => {
  
  it("Should not throw error with valid options", () => {
    expect(() => {
      db.sells.checkSellsOptions({ title: "Test", price: 100 });
    }).not.toThrow();
  });

  it("Should throw error with invalid option", () => {
    expect(() => {
      db.sells.checkSellsOptions({ title: "Test", invalidField: "value" });
    }).toThrow("Invalid option: invalidField");
  });

  it("Should accept all allowed fields", () => {
    const validOptions = {
      title: "Test",
      description: "Description",
      owner: "user1",
      price: 100,
      quantity: 5,
      address: "123 Street",
      image: "image.jpg",
      category: "Electronics",
      date: new Date(),
      filter: {}
    };
    
    expect(() => {
      db.sells.checkSellsOptions(validOptions);
    }).not.toThrow();
  });
});


describe("sells.create()", () => {
  
  it("Should create a new sell with all fields", async () => {
    const testDate = new Date('2025-12-16T10:00:00');
    await db.sells.create(dbo, {
      title: "Vélo",
      description: "Vélo en bon état",
      owner: "Nathan",
      price: "150",
      quantity: "1",
      address: "Rue de la Paix 5",
      category: "Véhicule",
      date: testDate
    });

    const sells = await dbo.collection('sells').find().toArray();
    
    expect(sells).toHaveLength(1);
    expect(sells[0].title).toBe("Vélo");
    expect(sells[0].owner).toBe("Nathan");
    expect(sells[0].price).toBe(150);
    expect(sells[0].quantity).toBe(1);
    expect(sells[0].date).toEqual(testDate);
  });

  it("Should convert string prices to numbers", async () => {
    await db.sells.create(dbo, {
      title: "Test",
      price: "99.99",
      quantity: "5"
    });

    const sells = await dbo.collection('sells').find().toArray();
    expect(typeof sells[0].price).toBe("number");
    expect(sells[0].price).toBe(99.99);
    expect(typeof sells[0].quantity).toBe("number");
    expect(sells[0].quantity).toBe(5);
  });

  it("Should create sell with filter object", async () => {
    await db.sells.create(dbo, {
      title: "Voiture",
      owner: "Nathan",
      price: "5000",
      quantity: "1",
      filter: {
        Carburant: "Diesel",
        Année: "2020",
        Kilométrage: "50000"
      }
    });

    const sells = await dbo.collection('sells').find().toArray();
    expect(sells[0].filter).toEqual({
      Carburant: "Diesel",
      Année: "2020",
      Kilométrage: "50000"
    });
  });
});


describe("sells.update()", () => {
  
  let sellId;

  beforeEach(async () => {
    await db.sells.create(dbo, {
      title: "Original Title",
      description: "Original description",
      price: "100",
      quantity: "5"
    });
    
    const sell = await dbo.collection('sells').findOne();
    sellId = sell._id;
  });

  it("Should update price and quantity", async () => {
    await db.sells.update(dbo, sellId, {
      price: "120",
      quantity: "3"
    });

    const updated = await dbo.collection('sells').findOne({ _id: sellId });
    expect(updated.price).toBe(120);
    expect(updated.quantity).toBe(3);
    expect(updated.title).toBe("Original Title");
  });

  it("Should update only specified fields", async () => {
    await db.sells.update(dbo, sellId, {
      description: "Updated description"
    });

    const updated = await dbo.collection('sells').findOne({ _id: sellId });
    expect(updated.description).toBe("Updated description");
    expect(updated.title).toBe("Original Title");
    expect(updated.price).toBe(100);
  });

  it("Should convert string numbers to numbers", async () => {
    await db.sells.update(dbo, sellId, {
      price: "250"
    });

    const updated = await dbo.collection('sells').findOne({ _id: sellId });
    expect(typeof updated.price).toBe("number");
    expect(updated.price).toBe(250);
  });
});


describe("sells.getAll()", () => {
  
  it("Should return empty array when no sells exist", async () => {
    const result = await db.sells.getAll(dbo);
    expect(result).toEqual([]);
  });

  it("Should return all sells", async () => {
    await db.sells.create(dbo, { title: "Sell 1", price: "10", quantity: "1" });
    await db.sells.create(dbo, { title: "Sell 2", price: "20", quantity: "2" });
    await db.sells.create(dbo, { title: "Sell 3", price: "30", quantity: "3" });

    const result = await db.sells.getAll(dbo);
    expect(result).toHaveLength(3);
  });
});


describe("sells.isPurchasable()", () => {
  
  let sellId;

  it("Should return true when quantity > 0", async () => {
    await db.sells.create(dbo, { title: "Test", price: "10", quantity: "5" });
    const sell = await dbo.collection('sells').findOne();
    
    const result = await db.sells.isPurchasable(dbo, sell._id);
    expect(result).toBe(true);
  });

  it("Should return false when quantity = 0", async () => {
    await db.sells.create(dbo, { title: "Test", price: "10", quantity: "0" });
    const sell = await dbo.collection('sells').findOne();
    
    const result = await db.sells.isPurchasable(dbo, sell._id);
    expect(result).toBe(false);
  });
});


describe("sells.buy()", () => {
  
  let sellId;

  beforeEach(async () => {
    // Créer deux utilisateurs
    await db.user.create(dbo, "buyer", "pass", "Buyer User", "buyer@test.com");
    await db.user.create(dbo, "seller", "pass", "Seller User", "seller@test.com");
    
    // Ajouter du solde à l'acheteur
    await db.user.addBalance(dbo, "buyer", 1000);
    
    // Créer une vente
    await db.sells.create(dbo, {
      title: "Product",
      owner: "seller",
      price: "100",
      quantity: "3"
    });
    
    const sell = await dbo.collection('sells').findOne();
    sellId = sell._id;
  });

  it("Should decrease quantity by 1 after purchase", async () => {
    await db.sells.buy(dbo, sellId, "buyer");
    
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    expect(sell.quantity).toBe(2);
  });

  it("Should add buyer to buyers array", async () => {
    await db.sells.buy(dbo, sellId, "buyer");
    
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    expect(sell.buyers).toHaveLength(1);
    expect(sell.buyers[0].username).toBe("buyer");
    expect(sell.buyers[0].date).toBeInstanceOf(Date);
  });

  it("Should transfer money from buyer to seller", async () => {
    const buyerBalanceBefore = await db.user.getBalance(dbo, "buyer");
    const sellerBalanceBefore = await db.user.getBalance(dbo, "seller");
    
    await db.sells.buy(dbo, sellId, "buyer");
    
    const buyerBalanceAfter = await db.user.getBalance(dbo, "buyer");
    const sellerBalanceAfter = await db.user.getBalance(dbo, "seller");
    
    expect(buyerBalanceAfter).toBe(buyerBalanceBefore - 100);
    expect(sellerBalanceAfter).toBe(sellerBalanceBefore + 100);
  });
});


describe("sells.rate()", () => {
  
  let sellId;

  beforeEach(async () => {
    await db.user.create(dbo, "buyer", "pass", "Buyer", "buyer@test.com");
    await db.user.create(dbo, "seller", "pass", "Seller", "seller@test.com");
    await db.user.addBalance(dbo, "buyer", 1000);
    
    await db.sells.create(dbo, {
      title: "Product",
      owner: "seller",
      price: "50",
      quantity: "5"
    });
    
    const sell = await dbo.collection('sells').findOne();
    sellId = sell._id;
    
    // Effectuer un achat
    await db.sells.buy(dbo, sellId, "buyer");
  });

  it("Should add rating to buyer's purchase", async () => {
    await db.sells.rate(dbo, sellId, "buyer", 5);
    
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    const buyerRecord = sell.buyers.find(b => b.username === "buyer");
    
    expect(buyerRecord.rating).toBe(5);
  });

  it("Should update existing rating", async () => {
    await db.sells.rate(dbo, sellId, "buyer", 3);
    await db.sells.rate(dbo, sellId, "buyer", 5);
    
    const sell = await dbo.collection('sells').findOne({ _id: sellId });
    const buyerRecord = sell.buyers.find(b => b.username === "buyer");
    
    expect(buyerRecord.rating).toBe(5);
  });
});


//   +----------+
//   |   USER   |
//   +----------+

describe("user.create()", () => {
  
  it("Should create user with initial balance and points", async () => {
    await db.user.create(dbo, "testuser", "pass123", "Test User", "test@example.com");
    
    const user = await dbo.collection('users').findOne({ username: "testuser" });
    expect(user.points).toBe(0);
    expect(user.balance).toBe(0);
  });

  it("Should hash password", async () => {
    await db.user.create(dbo, "user1", "mypassword", "User One", "user1@test.com");
    
    const user = await dbo.collection('users').findOne({ username: "user1" });
    expect(user.passwordHash).not.toBe("mypassword");
    expect(user.passwordHash).toBe(utils.hashString("mypassword"));
  });
});


describe("user.checkLogin()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "logintest", "correctpass", "Login Test", "login@test.com");
  });

  it("Should return true with correct credentials", async () => {
    const result = await db.user.checkLogin(dbo, "logintest", "correctpass");
    expect(result).toBe(true);
  });

  it("Should return false with wrong password", async () => {
    const result = await db.user.checkLogin(dbo, "logintest", "wrongpass");
    expect(result).toBe(false);
  });

  it("Should return false with non-existent username", async () => {
    const result = await db.user.checkLogin(dbo, "nonexistent", "anypass");
    expect(result).toBe(false);
  });
});


describe("user.getUserFromUsername()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "nathan", "pass", "Nathan Cobut", "nathan@test.com");
  });

  it("Should return user object", async () => {
    const user = await db.user.getUserFromUsername(dbo, "nathan");
    
    expect(user).not.toBeNull();
    expect(user.username).toBe("nathan");
    expect(user.fullname).toBe("Nathan Cobut");
    expect(user.email).toBe("nathan@test.com");
  });

  it("Should return null for non-existent user", async () => {
    const user = await db.user.getUserFromUsername(dbo, "nonexistent");
    expect(user).toBeNull();
  });
});


describe("user.getPurchaseHistory()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "buyer", "pass", "Buyer", "buyer@test.com");
    await db.user.create(dbo, "seller1", "pass", "Seller 1", "seller1@test.com");
    await db.user.create(dbo, "seller2", "pass", "Seller 2", "seller2@test.com");
    await db.user.addBalance(dbo, "buyer", 10000);
  });

  it("Should return empty array for user with no purchases", async () => {
    const history = await db.user.getPurchaseHistory(dbo, "buyer");
    expect(history).toEqual([]);
  });

  it("Should return purchases in chronological order", async () => {
    // Créer des ventes
    await db.sells.create(dbo, { title: "Product 1", owner: "seller1", price: "10", quantity: "5" });
    await db.sells.create(dbo, { title: "Product 2", owner: "seller2", price: "20", quantity: "5" });
    
    const sells = await dbo.collection('sells').find().toArray();
    
    // Acheter dans un ordre spécifique
    await db.sells.buy(dbo, sells[0]._id, "buyer");
    await new Promise(resolve => setTimeout(resolve, 100));
    await db.sells.buy(dbo, sells[1]._id, "buyer");
    
    const history = await db.user.getPurchaseHistory(dbo, "buyer");
    
    expect(history).toHaveLength(2);
    expect(history[0].title).toBe("Product 2"); // Le plus récent en premier
  });
});


describe("user.getSaleHistory()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "seller", "pass", "Seller", "seller@test.com");
  });

  it("Should return empty array for user with no sales", async () => {
    const history = await db.user.getSaleHistory(dbo, "seller");
    expect(history).toEqual([]);
  });

  it("Should return all sales by user", async () => {
    await db.sells.create(dbo, { title: "Sale 1", owner: "seller", price: "10", quantity: "1", date: new Date('2025-12-01') });
    await db.sells.create(dbo, { title: "Sale 2", owner: "seller", price: "20", quantity: "2", date: new Date('2025-12-10') });
    await db.sells.create(dbo, { title: "Sale 3", owner: "other", price: "30", quantity: "3", date: new Date('2025-12-15') });
    
    const history = await db.user.getSaleHistory(dbo, "seller");
    
    expect(history).toHaveLength(2);
    expect(history[0].title).toBe("Sale 2"); // Plus récent en premier
    expect(history[1].title).toBe("Sale 1");
  });
});


describe("user.getBalance()", () => {
  
  it("Should return 0 for non-existent user", async () => {
    const balance = await db.user.getBalance(dbo, "nonexistent");
    expect(balance).toBe(0);
  });

  it("Should return 0 for null username", async () => {
    const balance = await db.user.getBalance(dbo, null);
    expect(balance).toBe(0);
  });

  it("Should return user balance", async () => {
    await db.user.create(dbo, "richuser", "pass", "Rich User", "rich@test.com");
    await db.user.addBalance(dbo, "richuser", 500);
    
    const balance = await db.user.getBalance(dbo, "richuser");
    expect(balance).toBe(500);
  });
});


describe("user.addBalance()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "testuser", "pass", "Test User", "test@test.com");
  });

  it("Should add positive amount to balance", async () => {
    await db.user.addBalance(dbo, "testuser", 100);
    
    const balance = await db.user.getBalance(dbo, "testuser");
    expect(balance).toBe(100);
  });

  it("Should subtract negative amount from balance", async () => {
    await db.user.addBalance(dbo, "testuser", 200);
    await db.user.addBalance(dbo, "testuser", -50);
    
    const balance = await db.user.getBalance(dbo, "testuser");
    expect(balance).toBe(150);
  });

  it("Should accumulate multiple additions", async () => {
    await db.user.addBalance(dbo, "testuser", 100);
    await db.user.addBalance(dbo, "testuser", 50);
    await db.user.addBalance(dbo, "testuser", 25);
    
    const balance = await db.user.getBalance(dbo, "testuser");
    expect(balance).toBe(175);
  });
});


describe("user.pay()", () => {
  
  beforeEach(async () => {
    await dbo.collection('users').deleteMany({});
    await db.user.create(dbo, "payer", "pass", "Payer", "payer@test.com");
    await db.user.create(dbo, "receiver", "pass", "Receiver", "receiver@test.com");
    await db.user.addBalance(dbo, "payer", 500);
  });

  it("Should transfer money between users", async () => {
    await db.user.pay(dbo, "payer", "receiver", 100);
    
    const payerBalance = await db.user.getBalance(dbo, "payer");
    const receiverBalance = await db.user.getBalance(dbo, "receiver");
    
    expect(payerBalance).toBe(400);
    expect(receiverBalance).toBe(100);
  });

  it("Should throw error if insufficient funds", async () => {
    await expect(
      db.user.pay(dbo, "payer", "receiver", 600)
    ).rejects.toThrow("L'utilisateur n'a pas assez de fonds.");
  });

  it("Should handle exact balance payment", async () => {
    await db.user.pay(dbo, "payer", "receiver", 500);
    
    const payerBalance = await db.user.getBalance(dbo, "payer");
    expect(payerBalance).toBe(0);
  });
});


describe("user.changePassword()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "testuser", "oldpass", "Test User", "test@test.com");
  });

  it("Should update password hash", async () => {
    await db.user.changePassword(dbo, "testuser", "newpass");
    
    const user = await dbo.collection('users').findOne({ username: "testuser" });
    expect(user.passwordHash).toBe(utils.hashString("newpass"));
    expect(user.passwordHash).not.toBe(utils.hashString("oldpass"));
  });

  it("Should allow login with new password", async () => {
    await db.user.changePassword(dbo, "testuser", "newpass");
    
    const canLoginWithNew = await db.user.checkLogin(dbo, "testuser", "newpass");
    const canLoginWithOld = await db.user.checkLogin(dbo, "testuser", "oldpass");
    
    expect(canLoginWithNew).toBe(true);
    expect(canLoginWithOld).toBe(false);
  });
});


describe("user.getReviewAverage()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "seller", "pass", "Seller", "seller@test.com");
    await db.user.create(dbo, "buyer1", "pass", "Buyer 1", "buyer1@test.com");
    await db.user.create(dbo, "buyer2", "pass", "Buyer 2", "buyer2@test.com");
    await db.user.addBalance(dbo, "buyer1", 1000);
    await db.user.addBalance(dbo, "buyer2", 1000);
  });

  it("Should return null for seller with no reviews", async () => {
    const average = await db.user.getReviewAverage(dbo, "seller");
    expect(average).toBeNull();
  });

  it("Should calculate average of ratings", async () => {
    // Créer une vente et recevoir des avis
    await db.sells.create(dbo, { title: "Product", owner: "seller", price: "50", quantity: "10" });
    const sell = await dbo.collection('sells').findOne();
    
    await db.sells.buy(dbo, sell._id, "buyer1");
    await db.sells.rate(dbo, sell._id, "buyer1", 5);
    
    await db.sells.buy(dbo, sell._id, "buyer2");
    await db.sells.rate(dbo, sell._id, "buyer2", 3);
    
    const average = await db.user.getReviewAverage(dbo, "seller");
    expect(average).toBe(4); // (5 + 3) / 2
  });

  it("Should ignore purchases without ratings", async () => {
    await db.sells.create(dbo, { title: "Product", owner: "seller", price: "50", quantity: "10" });
    const sell = await dbo.collection('sells').findOne();
    
    await db.sells.buy(dbo, sell._id, "buyer1");
    await db.sells.rate(dbo, sell._id, "buyer1", 5);
    
    await db.sells.buy(dbo, sell._id, "buyer2");
    // buyer2 ne met pas d'avis
    
    const average = await db.user.getReviewAverage(dbo, "seller");
    expect(average).toBe(5); // Seul l'avis de buyer1 compte
  });
});


//   +-----------------+
//   |   LEADERBOARD   |
//   +-----------------+

describe("leaderboard.getFirst()", () => {
  
  beforeEach(async () => {
    await db.user.create(dbo, "user1", "pass", "User 1", "user1@test.com");
    await db.user.create(dbo, "user2", "pass", "User 2", "user2@test.com");
    await db.user.create(dbo, "user3", "pass", "User 3", "user3@test.com");
    await db.user.create(dbo, "user4", "pass", "User 4", "user4@test.com");
    
    // Ajouter des points
    await dbo.collection('users').updateOne({ username: "user1" }, { $set: { points: 100 } });
    await dbo.collection('users').updateOne({ username: "user2" }, { $set: { points: 50 } });
    await dbo.collection('users').updateOne({ username: "user3" }, { $set: { points: 75 } });
    await dbo.collection('users').updateOne({ username: "user4" }, { $set: { points: 25 } });
  });

  it("Should return top users sorted by points", async () => {
    const top = await db.leaderboard.getFirst(dbo, 3);
    
    expect(top).toHaveLength(3);
    expect(top[0].username).toBe("user1"); // 100 points
    expect(top[1].username).toBe("user3"); // 75 points
    expect(top[2].username).toBe("user2"); // 50 points
  });

  it("Should limit results to specified number", async () => {
    const top = await db.leaderboard.getFirst(dbo, 2);
    expect(top).toHaveLength(2);
  });

  it("Should return all users if number exceeds total", async () => {
    const top = await db.leaderboard.getFirst(dbo, 10);
    expect(top).toHaveLength(4);
  });
});


//   +------------------------+
//   |   TESTS D'INTÉGRATION  |
//   +------------------------+

describe("Integration: Complete purchase workflow", () => {
  
  it("Should handle full purchase and rating workflow", async () => {
    // Créer les utilisateurs
    await db.user.create(dbo, "buyer", "pass", "Buyer User", "buyer@test.com");
    await db.user.create(dbo, "seller", "pass", "Seller User", "seller@test.com");
    
    // Donner de l'argent à l'acheteur
    await db.user.addBalance(dbo, "buyer", 1000);
    
    // Créer une vente
    await db.sells.create(dbo, {
      title: "Laptop",
      description: "Excellent condition",
      owner: "seller",
      price: "500",
      quantity: "2",
      category: "Électronique"
    });
    
    const sell = await dbo.collection('sells').findOne();
    
    // Vérifier que c'est achetable
    expect(await db.sells.isPurchasable(dbo, sell._id)).toBe(true);
    
    // Effectuer l'achat
    await db.sells.buy(dbo, sell._id, "buyer");
    
    // Vérifier les soldes
    expect(await db.user.getBalance(dbo, "buyer")).toBe(500);
    expect(await db.user.getBalance(dbo, "seller")).toBe(500);
    
    // Vérifier l'historique d'achat
    const buyerHistory = await db.user.getPurchaseHistory(dbo, "buyer");
    expect(buyerHistory).toHaveLength(1);
    expect(buyerHistory[0].title).toBe("Laptop");
    
    // Vérifier l'historique de vente
    const sellerHistory = await db.user.getSaleHistory(dbo, "seller");
    expect(sellerHistory).toHaveLength(1);
    
    // Ajouter un avis
    await db.sells.rate(dbo, sell._id, "buyer", 5);
    
    // Vérifier la moyenne des avis du vendeur
    const average = await db.user.getReviewAverage(dbo, "seller");
    expect(average).toBe(5);
  });

  it("Should handle multiple purchases from same sell", async () => {
    await db.user.create(dbo, "buyer1", "pass", "Buyer 1", "buyer1@test.com");
    await db.user.create(dbo, "buyer2", "pass", "Buyer 2", "buyer2@test.com");
    await db.user.create(dbo, "seller", "pass", "Seller", "seller@test.com");
    
    await db.user.addBalance(dbo, "buyer1", 1000);
    await db.user.addBalance(dbo, "buyer2", 1000);
    
    await db.sells.create(dbo, {
      title: "Book",
      owner: "seller",
      price: "20",
      quantity: "3"
    });
    
    const sell = await dbo.collection('sells').findOne();
    
    // Deux achats
    await db.sells.buy(dbo, sell._id, "buyer1");
    await db.sells.buy(dbo, sell._id, "buyer2");
    
    // Vérifier la quantité
    const updatedSell = await dbo.collection('sells').findOne({ _id: sell._id });
    expect(updatedSell.quantity).toBe(1);
    
    // Vérifier le solde du vendeur
    expect(await db.user.getBalance(dbo, "seller")).toBe(40); // 20 * 2
  });
});