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

        // Convert rows to order objects
        orders = rows.map((row, index) => ({
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
                    <button class="btn-icon" onclick="deleteOrder('${order.orderId}')" title="Delete">
                        🗑️
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

    const row = [
        '', // OrderID (auto-generated by formula)
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
        '' // LastUpdated (auto-generated by formula)
    ];

    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        range: `${CONFIG.SHEET_NAME}!A:Q`,
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
