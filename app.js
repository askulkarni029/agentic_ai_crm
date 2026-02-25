/* ========================================
   Inventory Pro - Main Application
   ======================================== */

// App State
const App = {
    currentPage: 'dashboard',
    charts: {},

    // Initialize Application
    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadSettings();
    },

    // Check Authentication
    checkAuth() {
        const user = DB.users.getCurrentUser();
        if (user) {
            this.showApp();
            this.loadDashboard();
        } else {
            this.showLogin();
        }
    },

    // Show Login Screen
    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    // Show Main App
    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        const user = DB.users.getCurrentUser();
        if (user) {
            document.getElementById('displayUsername').textContent = user.name;
        }
    },

    // Load Settings
    loadSettings() {
        const settings = DB.settings.get();
        if (settings.theme === 'light') {
            document.body.classList.add('light-theme');
        }
    },

    // Bind All Events
    bindEvents() {
        // Login Form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Sidebar Toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Mobile Toggle
        document.getElementById('mobileToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        // Navigation Items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Modal Close
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });

        // Add Product Button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.showProductForm();
        });

        // Add Category Button
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.showCategoryForm();
        });

        // Add Supplier Button
        document.getElementById('addSupplierBtn').addEventListener('click', () => {
            this.showSupplierForm();
        });

        // Stock In/Out Buttons
        document.getElementById('stockInBtn').addEventListener('click', () => {
            this.showStockMovementForm('in');
        });

        document.getElementById('stockOutBtn').addEventListener('click', () => {
            this.showStockMovementForm('out');
        });

        // Export Products
        document.getElementById('exportProductsBtn').addEventListener('click', () => {
            this.exportProducts();
        });

        // Filters
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.loadProducts();
        });

        document.getElementById('productSearch').addEventListener('input', () => {
            this.loadProducts();
        });

        document.getElementById('movementTypeFilter').addEventListener('change', () => {
            this.loadStockMovements();
        });

        document.getElementById('movementDateFilter').addEventListener('change', () => {
            this.loadStockMovements();
        });

        // Global Search
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });

        // Notification Button
        document.getElementById('notificationBtn').addEventListener('click', () => {
            this.showNotifications();
        });
    },

    // Handle Login
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const user = DB.users.authenticate(username, password);

        if (user) {
            DB.users.setCurrentUser(user);
            this.showApp();
            this.loadDashboard();
            this.showToast('Welcome back, ' + user.name + '!', 'success');
        } else {
            this.showToast('Invalid credentials. Please try again.', 'error');
        }
    },

    // Handle Logout
    handleLogout() {
        DB.users.logout();
        this.showLogin();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        this.showToast('Logged out successfully', 'info');
    },

    // Navigate to Page
    navigateTo(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Hide all pages, show selected
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page + 'Page').classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            products: 'Products',
            categories: 'Categories',
            suppliers: 'Suppliers',
            stock: 'Stock Movements',
            reports: 'Reports'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        // Load page data
        this.currentPage = page;
        this.loadPageData(page);

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('active');
    },

    // Load Page Data
    loadPageData(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'suppliers':
                this.loadSuppliers();
                break;
            case 'stock':
                this.loadStockMovements();
                break;
        }
    },

    // Toggle Theme
    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        DB.settings.update({ theme: isLight ? 'light' : 'dark' });

        const icon = document.querySelector('#themeToggle i');
        icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';

        // Update charts if on dashboard
        if (this.currentPage === 'dashboard') {
            this.updateCharts();
        }
    },

    // ========================================
    // Dashboard
    // ========================================
    loadDashboard() {
        // Update Stats
        document.getElementById('totalProducts').textContent = DB.analytics.getTotalProducts();
        document.getElementById('totalStock').textContent = DB.analytics.getTotalStock().toLocaleString();
        document.getElementById('totalCategories').textContent = DB.analytics.getTotalCategories();

        const lowStockCount = DB.analytics.getLowStockCount();
        document.getElementById('lowStockCount').textContent = lowStockCount;
        document.getElementById('lowStockBadge').textContent = lowStockCount;
        document.getElementById('alertBadge').textContent = lowStockCount;

        // Load Low Stock Table
        this.loadLowStockTable();

        // Load Recent Movements
        this.loadRecentMovements();

        // Load Charts
        this.loadCharts();

        // Populate category filter
        this.populateCategoryFilter();
    },

    loadLowStockTable() {
        const lowStockProducts = DB.products.getLowStock();
        const tbody = document.getElementById('lowStockTable');

        if (lowStockProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>All products have adequate stock</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = lowStockProducts.map(product => `
            <tr>
                <td>${this.escapeHtml(product.name)}</td>
                <td>${this.escapeHtml(product.sku)}</td>
                <td>${product.quantity}</td>
                <td>
                    <span class="status-badge ${product.quantity === 0 ? 'danger' : 'warning'}">
                        ${product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    loadRecentMovements() {
        const movements = DB.stockMovements.getRecent(5);
        const tbody = document.getElementById('recentMovementsTable');

        if (movements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-exchange-alt"></i>
                        <p>No recent movements</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = movements.map(movement => {
            const product = DB.products.getById(movement.productId);
            return `
                <tr>
                    <td>${product ? this.escapeHtml(product.name) : 'Unknown'}</td>
                    <td>
                        <span class="movement-${movement.type}">
                            <i class="fas fa-arrow-${movement.type === 'in' ? 'down' : 'up'}"></i>
                            ${movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </span>
                    </td>
                    <td>${movement.quantity}</td>
                    <td>${this.formatDate(movement.date)}</td>
                </tr>
            `;
        }).join('');
    },

    loadCharts() {
        const isLight = document.body.classList.contains('light-theme');
        const textColor = isLight ? '#0f172a' : '#f8fafc';
        const gridColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

        // Stock Overview Chart
        const stockData = DB.analytics.getStockByCategory();
        const stockCtx = document.getElementById('stockChart').getContext('2d');

        if (this.charts.stock) {
            this.charts.stock.destroy();
        }

        this.charts.stock = new Chart(stockCtx, {
            type: 'bar',
            data: {
                labels: stockData.map(d => d.name),
                datasets: [{
                    label: 'Stock Quantity',
                    data: stockData.map(d => d.stock),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(34, 211, 238, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgb(99, 102, 241)',
                        'rgb(34, 211, 238)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 158, 11)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor
                        }
                    }
                }
            }
        });

        // Category Distribution Chart
        const categoryData = DB.analytics.getCategoryDistribution();
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(d => d.name),
                datasets: [{
                    data: categoryData.map(d => d.count),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(34, 211, 238, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: 'transparent',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: textColor,
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },

    updateCharts() {
        if (this.currentPage === 'dashboard') {
            this.loadCharts();
        }
    },

    // ========================================
    // Products
    // ========================================
    loadProducts() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchQuery = document.getElementById('productSearch').value;

        let products = DB.products.getAll();

        // Apply category filter
        if (categoryFilter) {
            products = products.filter(p => p.categoryId === parseInt(categoryFilter));
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.sku.toLowerCase().includes(query)
            );
        }

        const tbody = document.getElementById('productsTableBody');

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No products found</h3>
                        <p>Add your first product to get started</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => {
            const category = DB.categories.getById(product.categoryId);
            const supplier = DB.suppliers.getById(product.supplierId);
            const isLowStock = product.quantity <= product.minStock;

            return `
                <tr>
                    <td>
                        <strong>${this.escapeHtml(product.name)}</strong>
                        ${product.description ? `<br><small style="color: var(--text-muted)">${this.escapeHtml(product.description.substring(0, 50))}...</small>` : ''}
                    </td>
                    <td><code>${this.escapeHtml(product.sku)}</code></td>
                    <td>${category ? this.escapeHtml(category.name) : '-'}</td>
                    <td>₹${product.price.toFixed(2)}</td>
                    <td>
                        <span class="status-badge ${isLowStock ? (product.quantity === 0 ? 'danger' : 'warning') : 'success'}">
                            ${product.quantity}
                        </span>
                    </td>
                    <td>${supplier ? this.escapeHtml(supplier.name) : '-'}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-action btn-edit" onclick="App.editProduct(${product.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="App.deleteProduct(${product.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    populateCategoryFilter() {
        const categories = DB.categories.getAll();
        const select = document.getElementById('categoryFilter');
        select.innerHTML = '<option value="">All Categories</option>' +
            categories.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
    },

    showProductForm(product = null) {
        const categories = DB.categories.getAll();
        const suppliers = DB.suppliers.getAll();
        const isEdit = product !== null;

        document.getElementById('modalTitle').textContent = isEdit ? 'Edit Product' : 'Add New Product';
        document.getElementById('modalBody').innerHTML = `
            <form id="productForm">
                <div class="form-group">
                    <label for="productName">Product Name *</label>
                    <input type="text" id="productName" required value="${isEdit ? this.escapeHtml(product.name) : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productSku">SKU *</label>
                        <input type="text" id="productSku" required value="${isEdit ? this.escapeHtml(product.sku) : ''}">
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Price (₹) *</label>
                        <input type="number" id="productPrice" step="0.01" min="0" required value="${isEdit ? product.price : ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productCategory">Category</label>
                        <select id="productCategory">
                            <option value="">Select Category</option>
                            ${categories.map(c => `<option value="${c.id}" ${isEdit && product.categoryId === c.id ? 'selected' : ''}>${this.escapeHtml(c.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="productSupplier">Supplier</label>
                        <select id="productSupplier">
                            <option value="">Select Supplier</option>
                            ${suppliers.map(s => `<option value="${s.id}" ${isEdit && product.supplierId === s.id ? 'selected' : ''}>${this.escapeHtml(s.name)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productQuantity">Initial Quantity</label>
                        <input type="number" id="productQuantity" min="0" value="${isEdit ? product.quantity : '0'}" ${isEdit ? 'disabled' : ''}>
                        ${isEdit ? '<small style="color: var(--text-muted)">Use Stock Movements to update quantity</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label for="productMinStock">Min Stock Level</label>
                        <input type="number" id="productMinStock" min="0" value="${isEdit ? product.minStock : '10'}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="productDescription">Description</label>
                    <textarea id="productDescription">${isEdit ? this.escapeHtml(product.description || '') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Product</button>
                </div>
            </form>
        `;

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct(isEdit ? product.id : null);
        });

        this.openModal();
    },

    saveProduct(id = null) {
        const productData = {
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSku').value,
            price: parseFloat(document.getElementById('productPrice').value),
            categoryId: document.getElementById('productCategory').value ? parseInt(document.getElementById('productCategory').value) : null,
            supplierId: document.getElementById('productSupplier').value ? parseInt(document.getElementById('productSupplier').value) : null,
            quantity: parseInt(document.getElementById('productQuantity').value) || 0,
            minStock: parseInt(document.getElementById('productMinStock').value) || 10,
            description: document.getElementById('productDescription').value
        };

        if (id) {
            DB.products.update(id, productData);
            this.showToast('Product updated successfully', 'success');
        } else {
            DB.products.add(productData);
            this.showToast('Product added successfully', 'success');
        }

        this.closeModal();
        this.loadProducts();
        this.loadDashboard();
    },

    editProduct(id) {
        const product = DB.products.getById(id);
        if (product) {
            this.showProductForm(product);
        }
    },

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            DB.products.delete(id);
            this.showToast('Product deleted successfully', 'success');
            this.loadProducts();
            this.loadDashboard();
        }
    },

    exportProducts() {
        const products = DB.products.getAll();
        const categories = DB.categories.getAll();
        const suppliers = DB.suppliers.getAll();

        let csv = 'Name,SKU,Category,Supplier,Price,Quantity,Min Stock,Description\n';
        products.forEach(p => {
            const category = categories.find(c => c.id === p.categoryId);
            const supplier = suppliers.find(s => s.id === p.supplierId);
            csv += `"${p.name}","${p.sku}","${category?.name || ''}","${supplier?.name || ''}",${p.price},${p.quantity},${p.minStock},"${p.description || ''}"\n`;
        });

        this.downloadFile(csv, 'products_export.csv', 'text/csv');
        this.showToast('Products exported successfully', 'success');
    },

    // ========================================
    // Categories
    // ========================================
    loadCategories() {
        const categories = DB.categories.getAll();
        const grid = document.getElementById('categoriesGrid');

        if (categories.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-tags"></i>
                    <h3>No categories yet</h3>
                    <p>Create your first category to organize products</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = categories.map(category => {
            const productCount = DB.categories.getProductCount(category.id);
            const products = DB.products.getByCategory(category.id);
            const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

            return `
                <div class="category-card">
                    <div class="category-card-header">
                        <div class="category-icon" style="background: ${category.color || 'linear-gradient(135deg, var(--primary), var(--secondary))'}">
                            <i class="fas ${category.icon || 'fa-folder'}"></i>
                        </div>
                        <div class="category-actions">
                            <button class="btn btn-sm btn-secondary" onclick="App.editCategory(${category.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="App.deleteCategory(${category.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <h3>${this.escapeHtml(category.name)}</h3>
                    <p>${this.escapeHtml(category.description || '')}</p>
                    <div class="category-stats">
                        <div class="category-stat">
                            <span>${productCount}</span>
                            <span>Products</span>
                        </div>
                        <div class="category-stat">
                            <span>₹${totalValue.toFixed(2)}</span>
                            <span>Total Value</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    showCategoryForm(category = null) {
        const isEdit = category !== null;
        const icons = ['fa-microchip', 'fa-shirt', 'fa-couch', 'fa-utensils', 'fa-car', 'fa-book', 'fa-football', 'fa-gem', 'fa-heart', 'fa-home'];
        const colors = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

        document.getElementById('modalTitle').textContent = isEdit ? 'Edit Category' : 'Add New Category';
        document.getElementById('modalBody').innerHTML = `
            <form id="categoryForm">
                <div class="form-group">
                    <label for="categoryName">Category Name *</label>
                    <input type="text" id="categoryName" required value="${isEdit ? this.escapeHtml(category.name) : ''}">
                </div>
                <div class="form-group">
                    <label for="categoryDescription">Description</label>
                    <textarea id="categoryDescription">${isEdit ? this.escapeHtml(category.description || '') : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Icon</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${icons.map(icon => `
                            <button type="button" class="btn btn-sm ${isEdit && category.icon === icon ? 'btn-primary' : 'btn-secondary'}" 
                                    onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('btn-primary'));this.classList.add('btn-primary');document.getElementById('categoryIcon').value='${icon}'">
                                <i class="fas ${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="categoryIcon" value="${isEdit ? category.icon : icons[0]}">
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${colors.map(color => `
                            <button type="button" style="width: 36px; height: 36px; background: ${color}; border: ${isEdit && category.color === color ? '3px solid white' : 'none'}; border-radius: 8px; cursor: pointer;"
                                    onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.style.border='none');this.style.border='3px solid white';document.getElementById('categoryColor').value='${color}'">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="categoryColor" value="${isEdit ? category.color : colors[0]}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Category</button>
                </div>
            </form>
        `;

        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory(isEdit ? category.id : null);
        });

        this.openModal();
    },

    saveCategory(id = null) {
        const categoryData = {
            name: document.getElementById('categoryName').value,
            description: document.getElementById('categoryDescription').value,
            icon: document.getElementById('categoryIcon').value,
            color: document.getElementById('categoryColor').value
        };

        if (id) {
            DB.categories.update(id, categoryData);
            this.showToast('Category updated successfully', 'success');
        } else {
            DB.categories.add(categoryData);
            this.showToast('Category added successfully', 'success');
        }

        this.closeModal();
        this.loadCategories();
        this.populateCategoryFilter();
    },

    editCategory(id) {
        const category = DB.categories.getById(id);
        if (category) {
            this.showCategoryForm(category);
        }
    },

    deleteCategory(id) {
        const productCount = DB.categories.getProductCount(id);
        if (productCount > 0) {
            this.showToast('Cannot delete category with products. Move products first.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this category?')) {
            DB.categories.delete(id);
            this.showToast('Category deleted successfully', 'success');
            this.loadCategories();
            this.populateCategoryFilter();
        }
    },

    // ========================================
    // Suppliers
    // ========================================
    loadSuppliers() {
        const suppliers = DB.suppliers.getAll();
        const tbody = document.getElementById('suppliersTableBody');

        if (suppliers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-truck"></i>
                        <h3>No suppliers yet</h3>
                        <p>Add your first supplier</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = suppliers.map(supplier => {
            const productCount = DB.suppliers.getProductCount(supplier.id);

            return `
                <tr>
                    <td><strong>${this.escapeHtml(supplier.name)}</strong></td>
                    <td>${this.escapeHtml(supplier.contact || '-')}</td>
                    <td>${this.escapeHtml(supplier.email || '-')}</td>
                    <td>${this.escapeHtml(supplier.phone || '-')}</td>
                    <td><span class="status-badge info">${productCount}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-action btn-edit" onclick="App.editSupplier(${supplier.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="App.deleteSupplier(${supplier.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showSupplierForm(supplier = null) {
        const isEdit = supplier !== null;

        document.getElementById('modalTitle').textContent = isEdit ? 'Edit Supplier' : 'Add New Supplier';
        document.getElementById('modalBody').innerHTML = `
            <form id="supplierForm">
                <div class="form-group">
                    <label for="supplierName">Company Name *</label>
                    <input type="text" id="supplierName" required value="${isEdit ? this.escapeHtml(supplier.name) : ''}">
                </div>
                <div class="form-group">
                    <label for="supplierContact">Contact Person</label>
                    <input type="text" id="supplierContact" value="${isEdit ? this.escapeHtml(supplier.contact || '') : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="supplierEmail">Email</label>
                        <input type="email" id="supplierEmail" value="${isEdit ? this.escapeHtml(supplier.email || '') : ''}">
                    </div>
                    <div class="form-group">
                        <label for="supplierPhone">Phone</label>
                        <input type="tel" id="supplierPhone" value="${isEdit ? this.escapeHtml(supplier.phone || '') : ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="supplierAddress">Address</label>
                    <textarea id="supplierAddress">${isEdit ? this.escapeHtml(supplier.address || '') : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Supplier</button>
                </div>
            </form>
        `;

        document.getElementById('supplierForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSupplier(isEdit ? supplier.id : null);
        });

        this.openModal();
    },

    saveSupplier(id = null) {
        const supplierData = {
            name: document.getElementById('supplierName').value,
            contact: document.getElementById('supplierContact').value,
            email: document.getElementById('supplierEmail').value,
            phone: document.getElementById('supplierPhone').value,
            address: document.getElementById('supplierAddress').value
        };

        if (id) {
            DB.suppliers.update(id, supplierData);
            this.showToast('Supplier updated successfully', 'success');
        } else {
            DB.suppliers.add(supplierData);
            this.showToast('Supplier added successfully', 'success');
        }

        this.closeModal();
        this.loadSuppliers();
    },

    editSupplier(id) {
        const supplier = DB.suppliers.getById(id);
        if (supplier) {
            this.showSupplierForm(supplier);
        }
    },

    deleteSupplier(id) {
        const productCount = DB.suppliers.getProductCount(id);
        if (productCount > 0) {
            this.showToast('Cannot delete supplier with products. Update products first.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this supplier?')) {
            DB.suppliers.delete(id);
            this.showToast('Supplier deleted successfully', 'success');
            this.loadSuppliers();
        }
    },

    // ========================================
    // Stock Movements
    // ========================================
    loadStockMovements() {
        const typeFilter = document.getElementById('movementTypeFilter').value;
        const dateFilter = document.getElementById('movementDateFilter').value;

        let movements = DB.stockMovements.getAll();

        // Apply type filter
        if (typeFilter) {
            movements = movements.filter(m => m.type === typeFilter);
        }

        // Apply date filter
        if (dateFilter) {
            movements = movements.filter(m => m.date === dateFilter);
        }

        // Sort by date descending
        movements.sort((a, b) => new Date(b.date) - new Date(a.date));

        const tbody = document.getElementById('stockMovementsTableBody');

        if (movements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-exchange-alt"></i>
                        <h3>No stock movements found</h3>
                        <p>Record stock in/out to track inventory changes</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = movements.map(movement => {
            const product = DB.products.getById(movement.productId);

            return `
                <tr>
                    <td>${this.formatDate(movement.date)}</td>
                    <td>${product ? this.escapeHtml(product.name) : 'Unknown Product'}</td>
                    <td>
                        <span class="status-badge ${movement.type === 'in' ? 'success' : 'danger'}">
                            <i class="fas fa-arrow-${movement.type === 'in' ? 'down' : 'up'}"></i>
                            ${movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </span>
                    </td>
                    <td><strong>${movement.quantity}</strong></td>
                    <td><code>${this.escapeHtml(movement.reference || '-')}</code></td>
                    <td>${this.escapeHtml(movement.notes || '-')}</td>
                </tr>
            `;
        }).join('');
    },

    showStockMovementForm(type) {
        const products = DB.products.getAll();

        document.getElementById('modalTitle').textContent = type === 'in' ? 'Record Stock In' : 'Record Stock Out';
        document.getElementById('modalBody').innerHTML = `
            <form id="stockMovementForm">
                <div class="form-group">
                    <label for="movementProduct">Product *</label>
                    <select id="movementProduct" required>
                        <option value="">Select Product</option>
                        ${products.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)} (Current: ${p.quantity})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="movementQuantity">Quantity *</label>
                        <input type="number" id="movementQuantity" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="movementDate">Date *</label>
                        <input type="date" id="movementDate" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="movementReference">Reference Number</label>
                    <input type="text" id="movementReference" placeholder="e.g., PO-001, SO-001">
                </div>
                <div class="form-group">
                    <label for="movementNotes">Notes</label>
                    <textarea id="movementNotes" placeholder="Additional notes..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn ${type === 'in' ? 'btn-success' : 'btn-danger'}">
                        <i class="fas fa-arrow-${type === 'in' ? 'down' : 'up'}"></i>
                        Record ${type === 'in' ? 'Stock In' : 'Stock Out'}
                    </button>
                </div>
            </form>
        `;

        document.getElementById('stockMovementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStockMovement(type);
        });

        this.openModal();
    },

    saveStockMovement(type) {
        const productId = parseInt(document.getElementById('movementProduct').value);
        const quantity = parseInt(document.getElementById('movementQuantity').value);
        const product = DB.products.getById(productId);

        // Validate stock out
        if (type === 'out' && product && quantity > product.quantity) {
            this.showToast('Insufficient stock! Available: ' + product.quantity, 'error');
            return;
        }

        const movementData = {
            productId: productId,
            type: type,
            quantity: quantity,
            date: document.getElementById('movementDate').value,
            reference: document.getElementById('movementReference').value,
            notes: document.getElementById('movementNotes').value
        };

        DB.stockMovements.add(movementData);
        this.showToast('Stock movement recorded successfully', 'success');

        this.closeModal();
        this.loadStockMovements();
        this.loadDashboard();
    },

    // ========================================
    // Reports
    // ========================================
    showNotifications() {
        const lowStock = DB.products.getLowStock();

        document.getElementById('modalTitle').textContent = 'Low Stock Alerts';

        if (lowStock.length === 0) {
            document.getElementById('modalBody').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle" style="color: var(--success)"></i>
                    <h3>All Clear!</h3>
                    <p>No low stock alerts at this time</p>
                </div>
            `;
        } else {
            document.getElementById('modalBody').innerHTML = `
                <div style="max-height: 400px; overflow-y: auto;">
                    ${lowStock.map(p => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--border-color);">
                            <div>
                                <strong>${this.escapeHtml(p.name)}</strong>
                                <br><small style="color: var(--text-muted)">SKU: ${this.escapeHtml(p.sku)}</small>
                            </div>
                            <span class="status-badge ${p.quantity === 0 ? 'danger' : 'warning'}">
                                ${p.quantity} / ${p.minStock} min
                            </span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.openModal();
    },

    // ========================================
    // Utility Functions
    // ========================================
    openModal() {
        document.getElementById('modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        document.getElementById('modal').classList.remove('active');
        document.body.style.overflow = '';
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    handleGlobalSearch(query) {
        if (query.length < 2) return;

        const products = DB.products.search(query);
        if (products.length > 0) {
            this.navigateTo('products');
            document.getElementById('productSearch').value = query;
            this.loadProducts();
        }
    }
};

// Report Functions (Global)
function generateInventoryReport() {
    const products = DB.products.getAll();
    const categories = DB.categories.getAll();

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(p => {
        const cat = categories.find(c => c.id === p.categoryId);
        return `
                        <tr>
                            <td>${App.escapeHtml(p.name)}</td>
                            <td>${App.escapeHtml(p.sku)}</td>
                            <td>${cat ? App.escapeHtml(cat.name) : '-'}</td>
                            <td>₹${p.price.toFixed(2)}</td>
                            <td>${p.quantity}</td>
                            <td>₹${(p.price * p.quantity).toFixed(2)}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4"><strong>Total</strong></td>
                    <td><strong>${products.reduce((s, p) => s + p.quantity, 0)}</strong></td>
                    <td><strong>₹${DB.analytics.getInventoryValue().toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportTitle').textContent = 'Inventory Summary Report';
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportOutput').classList.remove('hidden');
}

function generateMovementReport() {
    const movements = DB.stockMovements.getAll().sort((a, b) => new Date(b.date) - new Date(a.date));
    const products = DB.products.getAll();

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reference</th>
                </tr>
            </thead>
            <tbody>
                ${movements.map(m => {
        const prod = products.find(p => p.id === m.productId);
        return `
                        <tr>
                            <td>${App.formatDate(m.date)}</td>
                            <td>${prod ? App.escapeHtml(prod.name) : 'Unknown'}</td>
                            <td><span class="status-badge ${m.type === 'in' ? 'success' : 'danger'}">${m.type === 'in' ? 'IN' : 'OUT'}</span></td>
                            <td>${m.quantity}</td>
                            <td>${m.reference || '-'}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('reportTitle').textContent = 'Stock Movement Report';
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportOutput').classList.remove('hidden');
}

function generateLowStockReport() {
    const lowStock = DB.products.getLowStock();

    let html = lowStock.length === 0 ? '<p style="text-align:center; padding: 2rem;">No low stock products!</p>' : `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${lowStock.map(p => `
                    <tr>
                        <td>${App.escapeHtml(p.name)}</td>
                        <td>${App.escapeHtml(p.sku)}</td>
                        <td>${p.quantity}</td>
                        <td>${p.minStock}</td>
                        <td><span class="status-badge ${p.quantity === 0 ? 'danger' : 'warning'}">${p.quantity === 0 ? 'OUT OF STOCK' : 'LOW'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('reportTitle').textContent = 'Low Stock Report';
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportOutput').classList.remove('hidden');
}

function generateValuationReport() {
    const data = DB.analytics.getCategoryDistribution();
    const total = DB.analytics.getInventoryValue();

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Value</th>
                    <th>% of Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(d => `
                    <tr>
                        <td>${App.escapeHtml(d.name)}</td>
                        <td>${d.count}</td>
                        <td>₹${d.value.toFixed(2)}</td>
                        <td>${total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${data.reduce((s, d) => s + d.count, 0)}</strong></td>
                    <td><strong>₹${total.toFixed(2)}</strong></td>
                    <td><strong>100%</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportTitle').textContent = 'Inventory Valuation Report';
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportOutput').classList.remove('hidden');
}

function exportReport() {
    const title = document.getElementById('reportTitle').textContent;
    const table = document.getElementById('reportContent').querySelector('table');

    if (!table) {
        App.showToast('No report data to export', 'error');
        return;
    }

    let csv = '';
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const values = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`);
        csv += values.join(',') + '\n';
    });

    App.downloadFile(csv, title.replace(/\s+/g, '_').toLowerCase() + '.csv', 'text/csv');
    App.showToast('Report exported successfully', 'success');
}

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
