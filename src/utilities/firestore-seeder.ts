/**
 * Firestore Database Seeder
 * 
 * This utility allows seeding the Firestore database with sample data
 * for testing and development purposes.
 */

import { 
  productsDB, 
  salesDB, 
  purchasesDB, 
  customersDB, 
  inventoryDB, 
  invoicesDB, 
  settingsDB 
} from '../services/database';

// Sample product data
const sampleProducts = [
  {
    name: 'Espresso',
    description: 'Rich, concentrated coffee served in a small cup',
    price: 3.50,
    cost: 1.20,
    category: 'Coffee',
    stock: 100,
    minStock: 20,
    unit: 'cup',
    supplier: 'Local Coffee Roasters',
    lastRestockDate: new Date().toISOString(),
    isInventoryTracked: false
  },
  {
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam',
    price: 4.50,
    cost: 1.75,
    category: 'Coffee',
    stock: 100,
    minStock: 20,
    unit: 'cup',
    supplier: 'Local Coffee Roasters',
    lastRestockDate: new Date().toISOString(),
    isInventoryTracked: false
  },
  {
    name: 'Latte',
    description: 'Espresso with steamed milk',
    price: 4.25,
    cost: 1.65,
    category: 'Coffee',
    stock: 100,
    minStock: 20,
    unit: 'cup',
    supplier: 'Local Coffee Roasters',
    lastRestockDate: new Date().toISOString(),
    isInventoryTracked: false
  },
  {
    name: 'Croissant',
    description: 'Buttery, flaky pastry',
    price: 3.25,
    cost: 1.15,
    category: 'Bakery',
    stock: 20,
    minStock: 5,
    unit: 'piece',
    supplier: 'Artisan Bakery',
    lastRestockDate: new Date().toISOString(),
    isInventoryTracked: true
  },
  {
    name: 'Chocolate Muffin',
    description: 'Rich chocolate muffin',
    price: 3.75,
    cost: 1.25,
    category: 'Bakery',
    stock: 15,
    minStock: 5,
    unit: 'piece',
    supplier: 'Artisan Bakery',
    lastRestockDate: new Date().toISOString(),
    isInventoryTracked: true
  }
];

// Sample customer data
const sampleCustomers = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-123-4567',
    address: '123 Main St, Anytown, USA',
    loyaltyPoints: 150,
    loyaltyTier: 'silver',
    lastOrderDate: new Date().toISOString(),
    totalSpent: 350.75,
    totalOrders: 15,
    notes: 'Prefers decaf coffee'
  },
  {
    name: 'Emily Johnson',
    email: 'emily.j@example.com',
    phone: '555-987-6543',
    address: '456 Oak Ave, Anytown, USA',
    loyaltyPoints: 320,
    loyaltyTier: 'gold',
    lastOrderDate: new Date().toISOString(),
    totalSpent: 720.50,
    totalOrders: 28,
    notes: 'Allergic to nuts'
  }
];

// Sample sales data (orders)
const sampleSales = [
  {
    date: new Date().toISOString(),
    items: [
      {
        productId: '1', // Will be replaced with actual ID after products are created
        productName: 'Espresso',
        quantity: 2,
        pricePerUnit: 3.50,
        total: 7.00,
      },
      {
        productId: '4', // Will be replaced with actual ID after products are created
        productName: 'Croissant',
        quantity: 1,
        pricePerUnit: 3.25,
        total: 3.25,
      }
    ],
    subtotal: 10.25,
    tax: 0.82,
    discount: 0,
    totalAmount: 11.07,
    paymentMethod: 'credit',
    paymentStatus: 'paid',
    customerId: '1', // Will be replaced after customers are created
    notes: 'Regular customer',
    staffName: 'Sarah',
    orderType: 'dine-in',
    payments: [
      {
        method: 'credit',
        amount: 11.07,
        cardType: 'Visa',
        cardLast4: '4242'
      }
    ]
  }
];

// Sample purchases (inventory purchases)
const samplePurchases = [
  {
    date: new Date().toISOString(),
    supplier: 'Local Coffee Roasters',
    items: [
      {
        productId: '1', // Will be replaced with actual ID after products are created
        productName: 'Coffee Beans (Espresso Blend)',
        quantity: 10,
        pricePerUnit: 15.00,
        total: 150.00
      }
    ],
    totalAmount: 150.00,
    paymentStatus: 'paid',
    invoiceNumber: 'INV-123456',
    notes: 'Monthly coffee bean order'
  }
];

// Sample invoices
const sampleInvoices = [
  {
    invoiceNumber: 'INV-001',
    customerId: '1', // Will be replaced after customers are created
    customerName: 'John Smith',
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
    items: [
      {
        description: 'Catering Services - Office Meeting',
        quantity: 1,
        price: 250.00,
        total: 250.00
      }
    ],
    subtotal: 250.00,
    tax: 20.00,
    total: 270.00,
    paidAmount: 0,
    balance: 270.00,
    status: 'unpaid',
    notes: 'Net 30 terms'
  }
];

// Sample business settings
const sampleSettings = {
  businessName: "Renee's Artisinal Café",
  address: "123 Café Street, Coffee Town, CT 12345",
  phone: "555-COFFEE",
  email: "info@renees-artisinal.com",
  taxRate: 8.0,
  currency: "USD",
  receiptMessage: "Thank you for visiting Renee's Artisinal Café!",
  logoUrl: "/logo.png",
  businessHours: "Mon-Fri: 7am-7pm, Sat-Sun: 8am-5pm",
  defaultTheme: "light",
  enableLoyaltyProgram: true,
  loyaltyPointsPerDollar: 1,
  pointsForFreeDrink: 100
};

/**
 * Seed a collection with sample data
 * @param db Database service instance
 * @param data Array of sample data objects
 * @returns Array of created document IDs
 */
async function seedCollection(db: any, data: any[]) {
  const createdIds: string[] = [];
  
  for (const item of data) {
    try {
      const result = await db.add(item);
      createdIds.push(result.id);
    } catch (error) {
      console.error('Error seeding item:', error);
    }
  }
  
  return createdIds;
}

/**
 * Seed the entire database with sample data
 */
export async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // First seed products
    console.log('Seeding products...');
    const productIds = await seedCollection(productsDB, sampleProducts);
    console.log(`Created ${productIds.length} products`);
    
    // Seed customers
    console.log('Seeding customers...');
    const customerIds = await seedCollection(customersDB, sampleCustomers);
    console.log(`Created ${customerIds.length} customers`);
    
    // Update sales with actual product and customer IDs
    if (productIds.length > 0 && customerIds.length > 0) {
      sampleSales[0].items[0].productId = productIds[0];
      sampleSales[0].items[1].productId = productIds[3];
      sampleSales[0].customerId = customerIds[0];
      
      // Update purchases with actual product IDs
      samplePurchases[0].items[0].productId = productIds[0];
      
      // Update invoices with actual customer IDs
      sampleInvoices[0].customerId = customerIds[0];
    }
    
    // Seed sales
    console.log('Seeding sales...');
    const salesIds = await seedCollection(salesDB, sampleSales);
    console.log(`Created ${salesIds.length} sales`);
    
    // Seed purchases
    console.log('Seeding purchases...');
    const purchaseIds = await seedCollection(purchasesDB, samplePurchases);
    console.log(`Created ${purchaseIds.length} purchases`);
    
    // Seed invoices
    console.log('Seeding invoices...');
    const invoiceIds = await seedCollection(invoicesDB, sampleInvoices);
    console.log(`Created ${invoiceIds.length} invoices`);
    
    // Seed settings
    console.log('Seeding settings...');
    await settingsDB.add(sampleSettings);
    console.log('Settings created');
    
    console.log('Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}

/**
 * Seed a specific collection with sample data
 */
export async function seedCollection2(collectionName: string) {
  console.log(`Seeding ${collectionName} collection...`);
  
  try {
    switch (collectionName.toLowerCase()) {
      case 'products':
        await seedCollection(productsDB, sampleProducts);
        break;
      case 'customers':
        await seedCollection(customersDB, sampleCustomers);
        break;
      case 'sales':
        await seedCollection(salesDB, sampleSales);
        break;
      case 'purchases':
        await seedCollection(purchasesDB, samplePurchases);
        break;
      case 'invoices':
        await seedCollection(invoicesDB, sampleInvoices);
        break;
      case 'settings':
        await settingsDB.add(sampleSettings);
        break;
      default:
        throw new Error(`Unknown collection: ${collectionName}`);
    }
    
    console.log(`${collectionName} collection seeded successfully!`);
    return true;
  } catch (error) {
    console.error(`Error seeding ${collectionName}:`, error);
    return false;
  }
} 