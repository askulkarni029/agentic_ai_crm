/* ========================================
   Database Layer - LocalStorage
   ======================================== */

const DB = {
    // Database keys
    KEYS: {
        PRODUCTS: 'inventory_products',
        CATEGORIES: 'inventory_categories',
        SUPPLIERS: 'inventory_suppliers',
        STOCK_MOVEMENTS: 'inventory_stock_movements',
        USERS: 'inventory_users',
        SETTINGS: 'inventory_settings'
    },

    // Initialize database with sample data
    init() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            this.set(this.KEYS.USERS, [
                { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' }
            ]);
        }

        if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
            this.set(this.KEYS.CATEGORIES, [
                { id: 1, name: 'Electronics', description: 'Electronic devices and accessories', icon: 'fa-microchip', color: '#6366f1' },
                { id: 2, name: 'Clothing', description: 'Apparel and fashion items', icon: 'fa-shirt', color: '#22d3ee' },
                { id: 3, name: 'Furniture', description: 'Home and office furniture', icon: 'fa-couch', color: '#10b981' },
                { id: 4, name: 'Food & Beverages', description: 'Consumable products', icon: 'fa-utensils', color: '#f59e0b' }
            ]);
        }

        if (!localStorage.getItem(this.KEYS.SUPPLIERS)) {
            this.set(this.KEYS.SUPPLIERS, [
                { id: 1, name: 'Tech Solutions Inc.', contact: 'John Smith', email: 'john@techsolutions.com', phone: '+1 234 567 890', address: '123 Tech Street, Silicon Valley' },
                { id: 2, name: 'Fashion World Ltd.', contact: 'Jane Doe', email: 'jane@fashionworld.com', phone: '+1 234 567 891', address: '456 Fashion Ave, New York' },
                { id: 3, name: 'Home Comfort Co.', contact: 'Bob Wilson', email: 'bob@homecomfort.com', phone: '+1 234 567 892', address: '789 Comfort Blvd, Chicago' }
            ]);
        }

        if (!localStorage.getItem(this.KEYS.PRODUCTS)) {
            this.set(this.KEYS.PRODUCTS, [
                { id: 1, name: 'Wireless Headphones', sku: 'WH-001', categoryId: 1, supplierId: 1, price: 79.99, quantity: 45, minStock: 10, description: 'Premium wireless headphones with noise cancellation' },
                { id: 2, name: 'Smart Watch Pro', sku: 'SW-002', categoryId: 1, supplierId: 1, price: 199.99, quantity: 8, minStock: 15, description: 'Advanced smartwatch with health tracking' },
                { id: 3, name: 'Cotton T-Shirt', sku: 'CT-001', categoryId: 2, supplierId: 2, price: 24.99, quantity: 120, minStock: 30, description: '100% cotton comfortable t-shirt' },
                { id: 4, name: 'Denim Jeans', sku: 'DJ-001', categoryId: 2, supplierId: 2, price: 59.99, quantity: 75, minStock: 20, description: 'Classic fit denim jeans' },
                { id: 5, name: 'Office Chair', sku: 'OC-001', categoryId: 3, supplierId: 3, price: 249.99, quantity: 12, minStock: 5, description: 'Ergonomic office chair with lumbar support' },
                { id: 6, name: 'Wooden Desk', sku: 'WD-001', categoryId: 3, supplierId: 3, price: 349.99, quantity: 5, minStock: 8, description: 'Solid wood desk with cable management' },
                { id: 7, name: 'Bluetooth Speaker', sku: 'BS-001', categoryId: 1, supplierId: 1, price: 49.99, quantity: 3, minStock: 10, description: 'Portable Bluetooth speaker' },
                { id: 8, name: 'Laptop Stand', sku: 'LS-001', categoryId: 1, supplierId: 1, price: 39.99, quantity: 25, minStock: 10, description: 'Adjustable aluminum laptop stand' }
            ]);
        }

        if (!localStorage.getItem(this.KEYS.STOCK_MOVEMENTS)) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            this.set(this.KEYS.STOCK_MOVEMENTS, [
                { id: 1, productId: 1, type: 'in', quantity: 50, date: yesterday, reference: 'PO-001', notes: 'Initial stock' },
                { id: 2, productId: 2, type: 'in', quantity: 20, date: yesterday, reference: 'PO-001', notes: 'Initial stock' },
                { id: 3, productId: 1, type: 'out', quantity: 5, date: today, reference: 'SO-001', notes: 'Customer order' },
                { id: 4, productId: 3, type: 'in', quantity: 100, date: today, reference: 'PO-002', notes: 'Restocking' }
            ]);
        }

        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            this.set(this.KEYS.SETTINGS, {
                theme: 'dark',
                lowStockThreshold: 10
            });
        }
    },

    // Get data from localStorage
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Set data to localStorage
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Generate unique ID
    generateId(key) {
        const items = this.get(key) || [];
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    },

    // CRUD Operations for Products
    products: {
        getAll() {
            return DB.get(DB.KEYS.PRODUCTS) || [];
        },
        getById(id) {
            const products = this.getAll();
            return products.find(p => p.id === id);
        },
        add(product) {
            const products = this.getAll();
            product.id = DB.generateId(DB.KEYS.PRODUCTS);
            product.createdAt = new Date().toISOString();
            products.push(product);
            DB.set(DB.KEYS.PRODUCTS, products);
            return product;
        },
        update(id, data) {
            let products = this.getAll();
            const index = products.findIndex(p => p.id === id);
            if (index !== -1) {
                products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() };
                DB.set(DB.KEYS.PRODUCTS, products);
                return products[index];
            }
            return null;
        },
        delete(id) {
            let products = this.getAll();
            products = products.filter(p => p.id !== id);
            DB.set(DB.KEYS.PRODUCTS, products);
        },
        search(query) {
            const products = this.getAll();
            const lowerQuery = query.toLowerCase();
            return products.filter(p => 
                p.name.toLowerCase().includes(lowerQuery) ||
                p.sku.toLowerCase().includes(lowerQuery)
            );
        },
        getByCategory(categoryId) {
            const products = this.getAll();
            return products.filter(p => p.categoryId === categoryId);
        },
        getLowStock() {
            const products = this.getAll();
            return products.filter(p => p.quantity <= p.minStock);
        },
        updateQuantity(id, quantityChange) {
            const product = this.getById(id);
            if (product) {
                const newQuantity = product.quantity + quantityChange;
                this.update(id, { quantity: Math.max(0, newQuantity) });
            }
        }
    },

    // CRUD Operations for Categories
    categories: {
        getAll() {
            return DB.get(DB.KEYS.CATEGORIES) || [];
        },
        getById(id) {
            const categories = this.getAll();
            return categories.find(c => c.id === id);
        },
        add(category) {
            const categories = this.getAll();
            category.id = DB.generateId(DB.KEYS.CATEGORIES);
            categories.push(category);
            DB.set(DB.KEYS.CATEGORIES, categories);
            return category;
        },
        update(id, data) {
            let categories = this.getAll();
            const index = categories.findIndex(c => c.id === id);
            if (index !== -1) {
                categories[index] = { ...categories[index], ...data };
                DB.set(DB.KEYS.CATEGORIES, categories);
                return categories[index];
            }
            return null;
        },
        delete(id) {
            let categories = this.getAll();
            categories = categories.filter(c => c.id !== id);
            DB.set(DB.KEYS.CATEGORIES, categories);
        },
        getProductCount(categoryId) {
            const products = DB.products.getAll();
            return products.filter(p => p.categoryId === categoryId).length;
        }
    },

    // CRUD Operations for Suppliers
    suppliers: {
        getAll() {
            return DB.get(DB.KEYS.SUPPLIERS) || [];
        },
        getById(id) {
            const suppliers = this.getAll();
            return suppliers.find(s => s.id === id);
        },
        add(supplier) {
            const suppliers = this.getAll();
            supplier.id = DB.generateId(DB.KEYS.SUPPLIERS);
            suppliers.push(supplier);
            DB.set(DB.KEYS.SUPPLIERS, suppliers);
            return supplier;
        },
        update(id, data) {
            let suppliers = this.getAll();
            const index = suppliers.findIndex(s => s.id === id);
            if (index !== -1) {
                suppliers[index] = { ...suppliers[index], ...data };
                DB.set(DB.KEYS.SUPPLIERS, suppliers);
                return suppliers[index];
            }
            return null;
        },
        delete(id) {
            let suppliers = this.getAll();
            suppliers = suppliers.filter(s => s.id !== id);
            DB.set(DB.KEYS.SUPPLIERS, suppliers);
        },
        getProductCount(supplierId) {
            const products = DB.products.getAll();
            return products.filter(p => p.supplierId === supplierId).length;
        }
    },

    // CRUD Operations for Stock Movements
    stockMovements: {
        getAll() {
            return DB.get(DB.KEYS.STOCK_MOVEMENTS) || [];
        },
        add(movement) {
            const movements = this.getAll();
            movement.id = DB.generateId(DB.KEYS.STOCK_MOVEMENTS);
            movement.createdAt = new Date().toISOString();
            movements.push(movement);
            DB.set(DB.KEYS.STOCK_MOVEMENTS, movements);

            // Update product quantity
            const quantityChange = movement.type === 'in' ? movement.quantity : -movement.quantity;
            DB.products.updateQuantity(movement.productId, quantityChange);

            return movement;
        },
        getByProduct(productId) {
            const movements = this.getAll();
            return movements.filter(m => m.productId === productId);
        },
        getByType(type) {
            const movements = this.getAll();
            return movements.filter(m => m.type === type);
        },
        getByDateRange(startDate, endDate) {
            const movements = this.getAll();
            return movements.filter(m => {
                const date = new Date(m.date);
                return date >= new Date(startDate) && date <= new Date(endDate);
            });
        },
        getRecent(limit = 5) {
            const movements = this.getAll();
            return movements.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
        }
    },

    // User Authentication
    users: {
        authenticate(username, password) {
            const users = DB.get(DB.KEYS.USERS) || [];
            return users.find(u => u.username === username && u.password === password);
        },
        getCurrentUser() {
            const userData = sessionStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        },
        setCurrentUser(user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        },
        logout() {
            sessionStorage.removeItem('currentUser');
        }
    },

    // Settings
    settings: {
        get() {
            return DB.get(DB.KEYS.SETTINGS) || { theme: 'dark', lowStockThreshold: 10 };
        },
        update(data) {
            const settings = this.get();
            DB.set(DB.KEYS.SETTINGS, { ...settings, ...data });
        }
    },

    // Analytics helpers
    analytics: {
        getTotalProducts() {
            return DB.products.getAll().length;
        },
        getTotalStock() {
            const products = DB.products.getAll();
            return products.reduce((sum, p) => sum + p.quantity, 0);
        },
        getTotalCategories() {
            return DB.categories.getAll().length;
        },
        getLowStockCount() {
            return DB.products.getLowStock().length;
        },
        getInventoryValue() {
            const products = DB.products.getAll();
            return products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        },
        getCategoryDistribution() {
            const categories = DB.categories.getAll();
            const products = DB.products.getAll();
            
            return categories.map(cat => ({
                name: cat.name,
                count: products.filter(p => p.categoryId === cat.id).length,
                value: products.filter(p => p.categoryId === cat.id).reduce((sum, p) => sum + (p.price * p.quantity), 0)
            }));
        },
        getStockByCategory() {
            const categories = DB.categories.getAll();
            const products = DB.products.getAll();
            
            return categories.map(cat => ({
                name: cat.name,
                stock: products.filter(p => p.categoryId === cat.id).reduce((sum, p) => sum + p.quantity, 0)
            }));
        }
    }
};

// Initialize database on load
DB.init();
