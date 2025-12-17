/**
 * Purchase Orders Management System
 * Google Sheets Backend Integration
 */

// CONFIGURATION - UPDATE THESE VALUES AFTER SETUP
const CONFIG = {
    GOOGLE_CLIENT_ID: '840809159678-bubvnupcou022o8sud1tv9m4gllo8b89.apps.googleusercontent.com',
    SPREADSHEET_ID: '12X_Za5Ps1IaK8bqObtg9UYKtPHCj6H5KJt_2rpJiy8I',
    SHEET_NAME: 'Orders',
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email'
};

// Global state
let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;
let tokenExpiry = null;
let orders = [];
let currentSort = { column: 'neededBy', direction: 'asc' };

// Column mapping (matches Google Sheet structure)
const COLUMNS = {
    orderId: 0,        // A
    requestDate: 1,    // B
    customerName: 2,   // C
    phone: 3,          // D
    email: 4,          // E
    bookTitle: 5,      // F
    author: 6,         // G
    isbn: 7,           // H
    neededBy: 8,       // I
    status: 9,         // J
    preferredSupplier: 10, // K
    actualSupplier: 11,    // L
    orderDate: 12,     // M
    trackingInfo: 13,  // N
    cost: 14,          // O
    notes: 15,         // P
    lastUpdated: 16    // Q
};

/**
 * Save token to localStorage
 */
function saveToken(token, expiresIn) {
    const expiry = Date.now() + (expiresIn * 1000);
    localStorage.setItem('orders_access_token', token);
    localStorage.setItem('orders_token_expiry', expiry.toString());
}

/**
 * Load token from localStorage
 */
function loadToken() {
    const token = localStorage.getItem('orders_access_token');
    const expiry = localStorage.getItem('orders_token_expiry');

    if (!token || !expiry) return null;

    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
        clearToken();
        return null;
    }

    return token;
}

/**
 * Clear saved token
 */
function clearToken() {
    localStorage.removeItem('orders_access_token');
    localStorage.removeItem('orders_token_expiry');
    accessToken = null;
}

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the orders page
    if (!document.querySelector('.orders-container')) return;

    // Try to load saved token
    const savedToken = loadToken();
    if (savedToken) {
        accessToken = savedToken;
    }

    // Wait for Google APIs to load
    waitForGoogleAPIs();
});

/**
 * Wait for Google APIs to be ready
 */
function waitForGoogleAPIs() {
    const checkInterval = setInterval(() => {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
            clearInterval(checkInterval);
            initializeGoogleAPIs();
        }
    }, 100);
}

/**
 * Initialize Google API and Identity Services
 */
function initializeGoogleAPIs() {
    gapi.load('client', initializeGapiClient);
    google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        scope: CONFIG.SCOPES,
        callback: (tokenResponse) => {
            accessToken = tokenResponse.access_token;
            gisInited = true;
            maybeEnableButtons();
        },
    });

    gisInited = true;
    maybeEnableButtons();
}

/**
 * Initialize GAPI client
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: '', // Not needed with OAuth
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Enable sign-in button when ready
 */
async function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('signin-button').disabled = false;
        setupEventListeners();

        // Auto-sign in if we have a valid token
        if (accessToken) {
            await autoSignIn();
        }
    }
}

/**
 * Auto sign in with saved token
 */
async function autoSignIn() {
    try {
        gapi.client.setToken({ access_token: accessToken });

        // Verify token is still valid by getting user info
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            // Token is invalid, clear it
            clearToken();
            return;
        }

        const userInfo = await response.json();
        document.getElementById('user-email').textContent = userInfo.email;
        document.getElementById('signin-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';

        // Load orders
        await loadOrders();
    } catch (err) {
        console.error('Auto sign-in failed:', err);
        clearToken();
    }
}

/**
 * Handle Google Sign-In response
 */
function handleCredentialResponse(response) {
    // This is for Google Identity Services
    // We'll use OAuth token flow instead
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Sign in/out
    document.getElementById('signin-button').addEventListener('click', handleSignIn);
    document.getElementById('signout-button').addEventListener('click', handleSignOut);

    // Main actions
    document.getElementById('new-order-button').addEventListener('click', openNewOrderModal);
    document.getElementById('refresh-button').addEventListener('click', loadOrders);

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-button').addEventListener('click', closeModal);
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);

    // Filters
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('supplier-filter').addEventListener('change', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);

    // Needed-by date change for supplier recommendation
    document.getElementById('needed-by').addEventListener('change', updateSupplierRecommendation);

    // Table sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => handleSort(th.dataset.sort));
        th.style.cursor = 'pointer';
    });

    // Close modal on outside click
    document.getElementById('order-modal').addEventListener('click', (e) => {
        if (e.target.id === 'order-modal') closeModal();
    });

    // Initialize inventory tab
    initInventoryTab();
}

/**
 * Handle sign in
 */
function handleSignIn() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Sign in error:', resp);
            alert('Sign in failed. Please try again.');
            return;
        }

        accessToken = resp.access_token;
        const expiresIn = resp.expires_in || 3600; // Default to 1 hour

        // Save token to localStorage
        saveToken(accessToken, expiresIn);

        gapi.client.setToken({ access_token: accessToken });

        // Get user info using fetch
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user info');
            }

            const userInfo = await response.json();
            document.getElementById('user-email').textContent = userInfo.email;
            document.getElementById('signin-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';

            // Load orders
            await loadOrders();
        } catch (err) {
            console.error('Error getting user info:', err);
            alert('Failed to get user information. Check console for details.');
        }
    };

    if (accessToken === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

/**
 * Handle sign out
 */
function handleSignOut() {
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken);
        gapi.client.setToken(null);
    }

    // Clear saved token
    clearToken();

    document.getElementById('signin-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    orders = [];
}

/**
 * Load orders from Google Sheets
 */
async function loadOrders() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: `${CONFIG.SHEET_NAME}!A2:Q`, // Skip header row
        });

        const rows = response.result.values || [];

        // Convert rows to order objects, filtering out empty rows
        // IMPORTANT: Calculate rowIndex BEFORE filtering to maintain correct sheet row numbers
        const allOrders = rows.map((row, index) => ({
            orderId: row[COLUMNS.orderId] || '',
            requestDate: row[COLUMNS.requestDate] || '',
            customerName: row[COLUMNS.customerName] || '',
            phone: row[COLUMNS.phone] || '',
            email: row[COLUMNS.email] || '',
            bookTitle: row[COLUMNS.bookTitle] || '',
            author: row[COLUMNS.author] || '',
            isbn: row[COLUMNS.isbn] || '',
            neededBy: row[COLUMNS.neededBy] || '',
            status: row[COLUMNS.status] || 'Requested',
            preferredSupplier: row[COLUMNS.preferredSupplier] || '',
            actualSupplier: row[COLUMNS.actualSupplier] || '',
            orderDate: row[COLUMNS.orderDate] || '',
            trackingInfo: row[COLUMNS.trackingInfo] || '',
            cost: row[COLUMNS.cost] || '',
            notes: row[COLUMNS.notes] || '',
            lastUpdated: row[COLUMNS.lastUpdated] || '',
            rowIndex: index + 2 // +2 because: 0-indexed + skip header
        }));

        // Filter out empty rows (keep rowIndex from original position)
        orders = allOrders.filter(order => order.customerName && order.customerName.trim() !== '');

        console.log('Loaded orders:', orders);
        renderOrders();
        updateStats();

    } catch (err) {
        console.error('Error loading orders:', err);
        alert('Failed to load orders. Check console for details.');
    }
}

/**
 * Render orders table
 */
function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    const emptyState = document.getElementById('empty-state');

    if (orders.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const html = orders.map(order => {
        const isUrgent = isOrderUrgent(order.neededBy);
        const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');

        return `
            <tr data-order-id="${order.orderId}">
                <td>${order.orderId}</td>
                <td>
                    <span class="status-badge status-${statusClass}">${order.status}</span>
                    ${isUrgent ? '<span class="urgent-badge">URGENT</span>' : ''}
                </td>
                <td>
                    <strong>${order.customerName}</strong><br>
                    <small>${order.phone}</small>
                </td>
                <td>
                    <strong>${order.bookTitle}</strong>
                    ${order.author ? `<br><small>by ${order.author}</small>` : ''}
                </td>
                <td>${formatDate(order.neededBy)}</td>
                <td>${order.actualSupplier || order.preferredSupplier || '-'}</td>
                <td>${formatDate(order.requestDate)}</td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="editOrder('${order.orderId}')" title="Edit">
                        ✏️
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
}

/**
 * Update statistics
 */
function updateStats() {
    const total = orders.length;
    const urgent = orders.filter(o => isOrderUrgent(o.neededBy) && !['Picked Up', 'Cancelled'].includes(o.status)).length;
    const pending = orders.filter(o => ['Requested', 'Sourced'].includes(o.status)).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-urgent').textContent = urgent;
    document.getElementById('stat-pending').textContent = pending;
}

/**
 * Check if order is urgent (needed within 7 days)
 */
function isOrderUrgent(neededByDate) {
    if (!neededByDate) return false;
    const needed = new Date(neededByDate);
    const today = new Date();
    const daysUntil = Math.ceil((needed - today) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Open new order modal
 */
function openNewOrderModal() {
    document.getElementById('modal-title').textContent = 'New Order';
    document.getElementById('order-form').reset();
    document.getElementById('edit-order-id').value = '';
    document.getElementById('status').value = 'Requested';

    // Set default needed-by date to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    document.getElementById('needed-by').value = defaultDate.toISOString().split('T')[0];

    updateSupplierRecommendation();
    document.getElementById('order-modal').style.display = 'flex';
}

/**
 * Edit existing order
 */
window.editOrder = function(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    document.getElementById('modal-title').textContent = 'Edit Order';
    document.getElementById('edit-order-id').value = orderId;

    // Populate form
    document.getElementById('customer-name').value = order.customerName;
    document.getElementById('customer-phone').value = order.phone;
    document.getElementById('customer-email').value = order.email;
    document.getElementById('book-title').value = order.bookTitle;
    document.getElementById('book-author').value = order.author;
    document.getElementById('book-isbn').value = order.isbn;
    document.getElementById('needed-by').value = order.neededBy;
    document.getElementById('status').value = order.status;
    document.getElementById('preferred-supplier').value = order.preferredSupplier;
    document.getElementById('actual-supplier').value = order.actualSupplier;
    document.getElementById('order-date').value = order.orderDate;
    document.getElementById('tracking-info').value = order.trackingInfo;
    document.getElementById('cost').value = order.cost;
    document.getElementById('notes').value = order.notes;

    updateSupplierRecommendation();
    document.getElementById('order-modal').style.display = 'flex';
};

/**
 * Delete order
 */
window.deleteOrder = async function(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    try {
        // Delete the row in Google Sheets
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // Assuming first sheet
                            dimension: 'ROWS',
                            startIndex: order.rowIndex - 1,
                            endIndex: order.rowIndex
                        }
                    }
                }]
            }
        });

        await loadOrders();
    } catch (err) {
        console.error('Error deleting order:', err);
        alert('Failed to delete order.');
    }
};

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('order-modal').style.display = 'none';
}

/**
 * Handle order form submission
 */
async function handleOrderSubmit(e) {
    e.preventDefault();

    const editOrderId = document.getElementById('edit-order-id').value;
    const isEdit = !!editOrderId;

    const orderData = {
        customerName: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        email: document.getElementById('customer-email').value,
        bookTitle: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        isbn: document.getElementById('book-isbn').value,
        neededBy: document.getElementById('needed-by').value,
        status: document.getElementById('status').value,
        preferredSupplier: document.getElementById('preferred-supplier').value,
        actualSupplier: document.getElementById('actual-supplier').value,
        orderDate: document.getElementById('order-date').value,
        trackingInfo: document.getElementById('tracking-info').value,
        cost: document.getElementById('cost').value,
        notes: document.getElementById('notes').value,
    };

    try {
        if (isEdit) {
            await updateOrder(editOrderId, orderData);
            console.log('Order updated:', editOrderId, orderData);
        } else {
            await createOrder(orderData);
            console.log('Order created:', orderData);
        }

        closeModal();

        // Small delay to ensure Google Sheets has processed the update
        await new Promise(resolve => setTimeout(resolve, 500));

        await loadOrders();
        console.log('Orders reloaded');
    } catch (err) {
        console.error('Error saving order:', err);
        alert('Failed to save order. Check console for details.');
    }
}

/**
 * Create new order in Google Sheets
 */
async function createOrder(orderData) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Generate OrderID: find highest existing ID and increment
    let nextOrderId = 1001;
    if (orders.length > 0) {
        const orderIds = orders.map(o => parseInt(o.orderId)).filter(id => !isNaN(id));
        if (orderIds.length > 0) {
            nextOrderId = Math.max(...orderIds) + 1;
        }
    }

    const row = [
        nextOrderId, // OrderID (generate ourselves instead of relying on formula)
        today, // RequestDate
        orderData.customerName,
        orderData.phone,
        orderData.email,
        orderData.bookTitle,
        orderData.author,
        orderData.isbn,
        orderData.neededBy,
        orderData.status,
        orderData.preferredSupplier,
        orderData.actualSupplier,
        orderData.orderDate,
        orderData.trackingInfo,
        orderData.cost,
        orderData.notes,
        now // LastUpdated (generate ourselves instead of relying on formula)
    ];

    // Find next empty row by checking column C (CustomerName) for actual data
    const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        range: `${CONFIG.SHEET_NAME}!C:C`, // Check CustomerName column to find rows with real data
    });

    const existingRows = response.result.values || [];
    // Filter out empty cells (formulas return empty string, not undefined)
    const nonEmptyRows = existingRows.filter(row => row && row[0] && row[0].trim() !== '');
    const nextRow = nonEmptyRows.length + 1; // +1 for header row

    // Write directly to the specific row
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        range: `${CONFIG.SHEET_NAME}!A${nextRow}:Q${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [row]
        }
    });
}

/**
 * Update existing order in Google Sheets
 */
async function updateOrder(orderId, orderData) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) throw new Error('Order not found');

    const row = [
        orderId,
        order.requestDate, // Keep original request date
        orderData.customerName,
        orderData.phone,
        orderData.email,
        orderData.bookTitle,
        orderData.author,
        orderData.isbn,
        orderData.neededBy,
        orderData.status,
        orderData.preferredSupplier,
        orderData.actualSupplier,
        orderData.orderDate,
        orderData.trackingInfo,
        orderData.cost,
        orderData.notes,
        new Date().toISOString() // Update timestamp
    ];

    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        range: `${CONFIG.SHEET_NAME}!A${order.rowIndex}:Q${order.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [row]
        }
    });
}

/**
 * Update supplier recommendation based on needed-by date
 */
function updateSupplierRecommendation() {
    const neededBy = document.getElementById('needed-by').value;
    if (!neededBy) {
        document.getElementById('supplier-recommendation').style.display = 'none';
        return;
    }

    const needed = new Date(neededBy);
    const today = new Date();
    const daysUntil = Math.ceil((needed - today) / (1000 * 60 * 60 * 24));

    const recommendation = document.getElementById('supplier-recommendation');
    const supplierText = document.getElementById('recommended-supplier');

    if (daysUntil <= 7) {
        supplierText.innerHTML = '<strong>Ingram</strong> (40% discount, faster delivery for urgent orders)';
        recommendation.className = 'supplier-recommendation urgent';
    } else {
        supplierText.innerHTML = '<strong>Faire</strong> (50% discount, better pricing for non-urgent orders)';
        recommendation.className = 'supplier-recommendation';
    }

    recommendation.style.display = 'block';
}

/**
 * Apply filters
 */
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const supplierFilter = document.getElementById('supplier-filter').value;

    const filtered = orders.filter(order => {
        // Search filter
        const matchesSearch = !searchTerm ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.bookTitle.toLowerCase().includes(searchTerm) ||
            order.author.toLowerCase().includes(searchTerm) ||
            order.phone.includes(searchTerm);

        // Status filter
        const matchesStatus = !statusFilter || order.status === statusFilter;

        // Supplier filter
        const matchesSupplier = !supplierFilter ||
            order.actualSupplier === supplierFilter ||
            order.preferredSupplier === supplierFilter;

        return matchesSearch && matchesStatus && matchesSupplier;
    });

    // Temporarily replace orders for rendering
    const originalOrders = orders;
    orders = filtered;
    renderOrders();
    orders = originalOrders;
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('supplier-filter').value = '';
    renderOrders();
}

/**
 * Handle table sorting
 */
function handleSort(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    orders.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle dates
        if (column.includes('Date') || column === 'neededBy') {
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
        }

        // Handle numbers
        if (column === 'orderId' || column === 'cost') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        }

        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderOrders();

    // Update sort indicators
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    const sortedTh = document.querySelector(`th[data-sort="${column}"]`);
    if (sortedTh) {
        sortedTh.classList.add(`sort-${currentSort.direction}`);
    }
}

/**
 * ==================== INVENTORY MANAGEMENT ====================
 */

// Inventory state
let inventory = []; // Array of inventory items from Google Sheets

// Add Inventory sheet name to config
const INVENTORY_SHEET_NAME = 'Inventory';

// Inventory column mapping
const INV_COLUMNS = {
    po: 0,          // A - PO Number
    orderDate: 1,   // B - Order Date
    isbn: 2,        // C - ISBN
    title: 3,       // D - Title
    author: 4,      // E - Author
    price: 5,       // F - Price
    status: 6,      // G - Status (Shipped/Backordered/InStock)
    receivedDate: 7 // H - Received Date
};

/**
 * Initialize inventory tab functionality
 */
function initInventoryTab() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            switchTab(tab);
        });
    });

    // Import button
    document.getElementById('import-ingram-button').addEventListener('click', handleIngramImport);

    // Search
    const searchInput = document.getElementById('inventory-search');
    searchInput.addEventListener('input', debounce(handleInventorySearch, 300));

    // PO filter
    document.getElementById('po-filter').addEventListener('change', loadReceivingList);
    document.getElementById('shipment-status-filter').addEventListener('change', loadReceivingList);

    // Export button
    document.getElementById('export-shopify-button').addEventListener('click', exportToShopify);

    // Load inventory on startup
    loadInventory();
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // Load data for inventory tab
    if (tabName === 'inventory') {
        loadInventory();
    }
}

/**
 * Parse Ingram order confirmation text
 */
function parseIngramOrder(text) {
    const lines = text.split('\n');
    const books = [];
    let poNumber = null;
    let orderDate = null;
    let currentSection = null;

    // Extract PO number
    const poMatch = text.match(/Purchase Order\s*:?\s*(\d+)/i);
    if (poMatch) {
        poNumber = poMatch[1];
    }

    // Extract order date
    const dateMatch = text.match(/Date Ordered:\s*(.+)/i);
    if (dateMatch) {
        orderDate = new Date(dateMatch[1].trim()).toISOString().split('T')[0];
    }

    // Parse books by section
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect section headers
        if (line.match(/^STOCKED & SHIPPED/)) {
            currentSection = 'Shipped';
        } else if (line.match(/^OUT OF STOCK, B\/O/)) {
            currentSection = 'Backordered';
        } else if (line.match(/^SECD, STOCKED & SHIPPED/)) {
            currentSection = 'Shipped';
        } else if (line.match(/^SECD, B\/O/)) {
            currentSection = 'Backordered';
        } else if (line.match(/^NYR - B\/O/)) {
            currentSection = 'Backordered';
        } else if (line.match(/^Secondary standard service/)) {
            currentSection = 'Shipped';
        } else if (line.match(/^-{10,}/) || line.match(/^={10,}/) || line.match(/^Totals for Purchase/)) {
            // Section dividers - skip
            continue;
        }

        // Parse book lines (format: "Title - Author")
        if (currentSection && line.includes(' - ') && !line.startsWith('EAN') && !line.startsWith('Order') && !line.startsWith('Notes')) {
            const parts = line.split(' - ');
            if (parts.length >= 2) {
                const title = parts[0].trim();
                const author = parts.slice(1).join(' - ').trim();

                // Next line should have ISBN and price
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1];
                    const eanMatch = nextLine.match(/EAN\/Product Code\s*:\s*(\d+)/);
                    const priceMatch = nextLine.match(/US SRP\s*:\s*\$?([\d.]+)/);

                    const isbn = eanMatch ? eanMatch[1] : '';
                    const price = priceMatch ? priceMatch[1] : '';

                    books.push({
                        po: poNumber,
                        orderDate,
                        isbn,
                        title,
                        author,
                        price,
                        status: currentSection
                    });
                }
            }
        }
    }

    return {
        poNumber,
        orderDate,
        books,
        totalBooks: books.length
    };
}

/**
 * Handle Ingram import
 */
async function handleIngramImport() {
    const textarea = document.getElementById('ingram-import-text');
    const statusDiv = document.getElementById('import-status');
    const text = textarea.value.trim();

    if (!text) {
        showImportStatus('Please paste Ingram order confirmation text.', 'error');
        return;
    }

    try {
        // Parse the text
        const parsed = parseIngramOrder(text);

        if (!parsed.poNumber) {
            showImportStatus('Could not find PO number in text. Please check the format.', 'error');
            return;
        }

        if (parsed.books.length === 0) {
            showImportStatus('No books found in order. Please check the format.', 'error');
            return;
        }

        // Save to Google Sheets
        await saveInventoryToSheets(parsed.books);

        // Clear textarea
        textarea.value = '';

        // Show success
        showImportStatus(`Successfully imported ${parsed.books.length} books from PO #${parsed.poNumber}`, 'success');

        // Reload inventory
        await loadInventory();
        loadReceivingList();

    } catch (err) {
        console.error('Error importing order:', err);
        showImportStatus('Failed to import order: ' + err.message, 'error');
    }
}

/**
 * Show import status message
 */
function showImportStatus(message, type) {
    const statusDiv = document.getElementById('import-status');
    statusDiv.textContent = message;
    statusDiv.className = `import-status ${type}`;
    statusDiv.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Save inventory items to Google Sheets
 */
async function saveInventoryToSheets(books) {
    // Prepare rows for Google Sheets
    const rows = books.map(book => [
        book.po,
        book.orderDate,
        book.isbn,
        book.title,
        book.author,
        book.price,
        book.status,
        '' // receivedDate - empty initially
    ]);

    // Append to Inventory sheet
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        range: `${INVENTORY_SHEET_NAME}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: rows
        }
    });
}

/**
 * Load inventory from Google Sheets
 */
async function loadInventory() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: `${INVENTORY_SHEET_NAME}!A2:H`, // Skip header
        });

        const rows = response.result.values || [];

        inventory = rows.map((row, index) => ({
            po: row[INV_COLUMNS.po] || '',
            orderDate: row[INV_COLUMNS.orderDate] || '',
            isbn: row[INV_COLUMNS.isbn] || '',
            title: row[INV_COLUMNS.title] || '',
            author: row[INV_COLUMNS.author] || '',
            price: row[INV_COLUMNS.price] || '',
            status: row[INV_COLUMNS.status] || 'Shipped',
            receivedDate: row[INV_COLUMNS.receivedDate] || '',
            rowIndex: index + 2
        }));

        // Update PO filter dropdown
        updatePOFilter();

    } catch (err) {
        console.error('Error loading inventory:', err);
    }
}

/**
 * Update PO filter dropdown
 */
function updatePOFilter() {
    const poFilter = document.getElementById('po-filter');
    const uniquePOs = [...new Set(inventory.map(item => item.po))].filter(po => po);

    // Clear and rebuild
    poFilter.innerHTML = '<option value="">All POs</option>';
    uniquePOs.sort((a, b) => b - a).forEach(po => {
        const option = document.createElement('option');
        option.value = po;
        option.textContent = `PO #${po}`;
        poFilter.appendChild(option);
    });
}

/**
 * Handle inventory search
 */
function handleInventorySearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const resultsDiv = document.getElementById('inventory-search-results');

    if (!query) {
        resultsDiv.innerHTML = '';
        return;
    }

    // Search across title, author, ISBN
    const results = inventory.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.isbn.includes(query)
    );

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p style="color: var(--muted-gold); padding: 1rem;">No books found matching your search.</p>';
        return;
    }

    // Render results
    const html = results.map(item => `
        <div class="inventory-result-item">
            <div class="book-title">${item.title}</div>
            <div class="book-author">by ${item.author}</div>
            <div class="book-meta">
                <span><strong>ISBN:</strong> ${item.isbn}</span>
                <span><strong>PO #:</strong> ${item.po}</span>
                <span><strong>Status:</strong> ${item.status}</span>
                <span><strong>Price:</strong> $${item.price}</span>
                ${item.receivedDate ? `<span><strong>Received:</strong> ${item.receivedDate}</span>` : ''}
            </div>
        </div>
    `).join('');

    resultsDiv.innerHTML = html;
}

/**
 * Load receiving list
 */
function loadReceivingList() {
    const poFilter = document.getElementById('po-filter').value;
    const statusFilter = document.getElementById('shipment-status-filter').value;
    const listDiv = document.getElementById('receiving-list');

    // Filter inventory
    let filtered = inventory;

    if (poFilter) {
        filtered = filtered.filter(item => item.po === poFilter);
    }

    if (statusFilter) {
        if (statusFilter === 'Shipped') {
            filtered = filtered.filter(item => item.status === 'Shipped' && !item.receivedDate);
        } else if (statusFilter === 'InStock') {
            filtered = filtered.filter(item => item.status === 'InStock' || item.receivedDate);
        }
    }

    if (filtered.length === 0) {
        listDiv.innerHTML = '<p style="color: var(--muted-gold); padding: 1rem;">No items to receive.</p>';
        return;
    }

    // Render receiving items
    const html = filtered.map(item => `
        <div class="receiving-item ${item.receivedDate ? 'received' : ''}" data-row="${item.rowIndex}">
            <input type="checkbox" ${item.receivedDate ? 'checked' : ''} onchange="toggleReceived('${item.rowIndex}', this.checked)">
            <div class="receiving-item-content">
                <div class="book-title">${item.title}</div>
                <div class="book-author">by ${item.author}</div>
                <div class="book-meta">
                    <span><strong>ISBN:</strong> ${item.isbn}</span>
                    <span><strong>PO #:</strong> ${item.po}</span>
                    <span><strong>Price:</strong> $${item.price}</span>
                    ${item.receivedDate ? `<span><strong>Received:</strong> ${item.receivedDate}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    listDiv.innerHTML = html;
}

/**
 * Toggle received status
 */
window.toggleReceived = async function(rowIndex, isReceived) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const receivedDate = isReceived ? today : '';
        const status = isReceived ? 'InStock' : 'Shipped';

        // Update Google Sheets
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: `${INVENTORY_SHEET_NAME}!G${rowIndex}:H${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[status, receivedDate]]
            }
        });

        // Reload inventory
        await loadInventory();
        loadReceivingList();

    } catch (err) {
        console.error('Error updating received status:', err);
        alert('Failed to update status');
    }
};

/**
 * Export to Shopify CSV
 */
function exportToShopify() {
    // Get all items that are InStock or have receivedDate
    const receivedItems = inventory.filter(item => item.status === 'InStock' || item.receivedDate);

    if (receivedItems.length === 0) {
        alert('No received books to export. Please mark books as received first.');
        return;
    }

    // Create Shopify CSV format
    const headers = [
        'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags',
        'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU',
        'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
        'Variant Inventory Policy', 'Variant Fulfillment Service',
        'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping',
        'Variant Taxable', 'Variant Barcode', 'Image Src', 'Image Position',
        'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
        'Google Shopping / Google Product Category', 'Google Shopping / Gender',
        'Google Shopping / Age Group', 'Google Shopping / MPN',
        'Google Shopping / AdWords Grouping', 'Google Shopping / AdWords Labels',
        'Google Shopping / Condition', 'Google Shopping / Custom Product',
        'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1',
        'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3',
        'Google Shopping / Custom Label 4', 'Variant Image', 'Variant Weight Unit',
        'Variant Tax Code', 'Cost per item'
    ];

    const rows = receivedItems.map(item => {
        const handle = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return [
            handle,                    // Handle
            item.title,                // Title
            `<p>${item.title} by ${item.author}</p>`, // Body
            item.author,               // Vendor (Author)
            'Books',                   // Type
            'books',                   // Tags
            'TRUE',                    // Published
            'Title',                   // Option1 Name
            'Default Title',           // Option1 Value
            item.isbn,                 // Variant SKU
            '400',                     // Variant Grams (approx)
            'shopify',                 // Variant Inventory Tracker
            '1',                       // Variant Inventory Qty
            'deny',                    // Variant Inventory Policy
            'manual',                  // Variant Fulfillment Service
            item.price,                // Variant Price
            '',                        // Variant Compare At Price
            'TRUE',                    // Variant Requires Shipping
            'TRUE',                    // Variant Taxable
            item.isbn,                 // Variant Barcode
            '',                        // Image Src
            '',                        // Image Position
            '',                        // Image Alt Text
            'FALSE',                   // Gift Card
            item.title,                // SEO Title
            `${item.title} by ${item.author}`, // SEO Description
            ...Array(28).fill(''),     // Google Shopping fields
            'lb',                      // Variant Weight Unit
            '',                        // Variant Tax Code
            item.price                 // Cost per item
        ];
    });

    // Convert to CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopify-import-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    // Show stats
    const statsDiv = document.getElementById('export-stats');
    statsDiv.textContent = `Exported ${receivedItems.length} books to Shopify CSV`;
    statsDiv.style.display = 'block';

    setTimeout(() => {
        statsDiv.style.display = 'none';
    }, 5000);
}

/**
 * Debounce helper
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
