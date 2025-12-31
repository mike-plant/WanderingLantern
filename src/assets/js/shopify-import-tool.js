/**
 * Shopify Import Tool
 * Compares Ingram orders against Shopify inventory and generates import CSV
 */

class ShopifyImportTool {
  constructor() {
    this.shopifyProducts = new Map(); // ISBN -> product data
    this.processedISBNs = new Set(); // ISBNs already imported
    this.backorderedISBNs = new Map(); // ISBN -> {title, author, dateAdded}
    this.ingramOrders = [];
    this.newProducts = [];
    this.loadProgress();
  }

  /**
   * Load saved progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('shopify-import-progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.processedISBNs = new Set(data.processedISBNs || []);

        // Load backordered items
        if (data.backorderedISBNs) {
          this.backorderedISBNs = new Map(Object.entries(data.backorderedISBNs));
        }

        console.log(`Loaded ${this.processedISBNs.size} previously processed ISBNs`);
        console.log(`Loaded ${this.backorderedISBNs.size} backordered ISBNs`);
      }
    } catch (e) {
      console.warn('Could not load progress:', e);
    }
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    try {
      const data = {
        processedISBNs: Array.from(this.processedISBNs),
        backorderedISBNs: Object.fromEntries(this.backorderedISBNs),
        lastUpdate: new Date().toISOString()
      };
      localStorage.setItem('shopify-import-progress', JSON.stringify(data));
      console.log(`Saved ${this.processedISBNs.size} processed ISBNs`);
      console.log(`Saved ${this.backorderedISBNs.size} backordered ISBNs`);
    } catch (e) {
      console.warn('Could not save progress:', e);
    }
  }

  /**
   * Mark ISBNs as processed
   */
  markAsProcessed(isbns) {
    for (const isbn of isbns) {
      if (isbn) {
        this.processedISBNs.add(isbn);
      }
    }
    this.saveProgress();
  }

  /**
   * Add backorders to tracking
   */
  trackBackorders(items) {
    for (const item of items) {
      if (item.isBackordered && item.isbn) {
        this.backorderedISBNs.set(item.isbn, {
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          dateAdded: new Date().toISOString()
        });
      }
    }
    this.saveProgress();
  }

  /**
   * Remove items from backorder tracking (when they've arrived)
   */
  removeFromBackorders(isbns) {
    for (const isbn of isbns) {
      this.backorderedISBNs.delete(isbn);
    }
    this.saveProgress();
  }

  /**
   * Get current backorder list
   */
  getBackorders() {
    return Array.from(this.backorderedISBNs.entries()).map(([isbn, data]) => ({
      isbn,
      ...data
    }));
  }

  /**
   * Clear all progress
   */
  clearProgress() {
    this.processedISBNs.clear();
    this.backorderedISBNs.clear();
    localStorage.removeItem('shopify-import-progress');
    console.log('Progress cleared');
  }

  /**
   * Parse Shopify export CSV
   */
  parseShopifyCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);

    const barcodeIdx = headers.indexOf('Variant Barcode');
    const titleIdx = headers.indexOf('Title');
    const handleIdx = headers.indexOf('Handle');

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i]);
      const isbn = row[barcodeIdx]?.trim();

      if (isbn) {
        this.shopifyProducts.set(isbn, {
          title: row[titleIdx],
          handle: row[handleIdx],
          isbn: isbn
        });
      }
    }

    console.log(`Loaded ${this.shopifyProducts.size} unique ISBNs from Shopify`);
  }

  /**
   * Parse Ingram order CSV and consolidate quantities by ISBN
   * Includes backordered items with quantity = 0
   */
  parseIngramCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);

    const eanIdx = headers.indexOf('EAN');
    const titleIdx = headers.indexOf('Title');
    const authorIdx = headers.indexOf('Author');
    const bindingIdx = headers.indexOf('Binding');
    const publisherIdx = headers.indexOf('Publisher');
    const priceIdx = headers.indexOf('Price');
    const statusIdx = headers.indexOf('Confirmation Status');
    const qtyShippedIdx = headers.indexOf('Quantity Shipped');
    const qtyBackorderedIdx = headers.indexOf('Quantity Backordered');

    // Use a Map to consolidate by ISBN
    const itemsByISBN = new Map();

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i]);

      const status = row[statusIdx]?.trim().toUpperCase();
      const qtyShipped = parseInt(row[qtyShippedIdx]) || 0;
      const qtyBackordered = parseInt(row[qtyBackorderedIdx]) || 0;

      // Include shipped items AND backordered items (exclude cancelled)
      const isRelevant = qtyShipped > 0 ||
                        qtyBackordered > 0 ||
                        status.includes('STOCKED & SHIPPED') ||
                        status.includes('PRIMARY STANDARD SERVICE') ||
                        status.includes('OUT OF STOCK, B/O') ||
                        status.includes('NYR - B/O');

      // Skip cancelled items
      const isCancelled = status.includes('NOT STOCKED THIS WAREHOUSE') ||
                         status.includes('CANCELLED');

      if (isRelevant && !isCancelled) {
        const isbn = row[eanIdx]?.trim();
        const qty = qtyShipped > 0 ? qtyShipped : 0; // 0 for backordered items

        if (itemsByISBN.has(isbn)) {
          // Add to existing quantity (shipped items only)
          itemsByISBN.get(isbn).quantity += qty;
        } else {
          // New item
          itemsByISBN.set(isbn, {
            isbn: isbn,
            title: row[titleIdx],
            author: row[authorIdx],
            binding: row[bindingIdx],
            publisher: row[publisherIdx],
            price: parseFloat(row[priceIdx]) || 0,
            status: status,
            quantity: qty,
            isBackordered: qty === 0 && qtyBackordered > 0
          });
        }
      }
    }

    const items = Array.from(itemsByISBN.values());
    console.log(`Found ${items.length} unique products from Ingram order`);
    return items;
  }

  /**
   * Compare Ingram orders against Shopify and find new products
   */
  findNewProducts(ingramItems) {
    const newProducts = [];
    const alreadyInShopify = [];
    const alreadyProcessed = [];

    for (const item of ingramItems) {
      if (!item.isbn) continue;

      if (this.shopifyProducts.has(item.isbn)) {
        alreadyInShopify.push(item);
      } else if (this.processedISBNs.has(item.isbn)) {
        alreadyProcessed.push(item);
      } else {
        newProducts.push(item);
      }
    }

    console.log(`New products (not in Shopify): ${newProducts.length}`);
    console.log(`Already in Shopify: ${alreadyInShopify.length}`);
    console.log(`Already processed (pending import): ${alreadyProcessed.length}`);

    this.newProducts = newProducts;
    return { newProducts, alreadyInShopify, alreadyProcessed };
  }

  /**
   * Generate Shopify import CSV
   */
  generateShopifyImportCSV() {
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
      'Published', 'Option1 Name', 'Option1 Value', 'Option1 Linked To',
      'Option2 Name', 'Option2 Value', 'Option2 Linked To',
      'Option3 Name', 'Option3 Value', 'Option3 Linked To',
      'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
      'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
      'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
      'Unit Price Total Measure', 'Unit Price Total Measure Unit',
      'Unit Price Base Measure', 'Unit Price Base Measure Unit',
      'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text',
      'Gift Card', 'SEO Title', 'SEO Description',
      'Book Authors (product.metafields.app-ibp-book.authors)',
      'Book Binding (product.metafields.app-ibp-book.binding)',
      'Book Categories (product.metafields.app-ibp-book.categories)',
      'Book Condition (product.metafields.app-ibp-book.condition)',
      'Book Dimensions (product.metafields.app-ibp-book.dimensions)',
      'Book Language (product.metafields.app-ibp-book.language)',
      'Book Pages (product.metafields.app-ibp-book.pages)',
      'Book Publication Date (product.metafields.app-ibp-book.publication_date)',
      'Book Publication Year (product.metafields.app-ibp-book.publication_year)',
      'Book Publisher (product.metafields.app-ibp-book.publisher)',
      'Age group (product.metafields.shopify.age-group)',
      'Book cover type (product.metafields.shopify.book-cover-type)',
      'Color (product.metafields.shopify.color-pattern)',
      'Earring design (product.metafields.shopify.earring-design)',
      'Genre (product.metafields.shopify.genre)',
      'Jewelry material (product.metafields.shopify.jewelry-material)',
      'Jewelry type (product.metafields.shopify.jewelry-type)',
      'Language version (product.metafields.shopify.language-version)',
      'Target audience (product.metafields.shopify.target-audience)',
      'Target gender (product.metafields.shopify.target-gender)',
      'Variant Image', 'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Status'
    ];

    const rows = [headers];

    for (const product of this.newProducts) {
      const handle = this.createHandle(product.title);

      rows.push([
        handle, // Handle
        product.title, // Title
        '', // Body (HTML) - empty for now
        'The Wandering Lantern', // Vendor
        'Media > Books > Print Books', // Product Category
        '', // Type
        '', // Tags
        'true', // Published
        'Title', // Option1 Name
        'Default Title', // Option1 Value
        '', // Option1 Linked To
        '', '', '', '', '', '', // Option2 and Option3
        product.isbn, // Variant SKU
        '0.0', // Variant Grams
        'shopify', // Variant Inventory Tracker
        product.quantity.toString(), // Variant Inventory Qty (from Ingram order)
        'deny', // Variant Inventory Policy
        'manual', // Variant Fulfillment Service
        product.price.toFixed(2), // Variant Price
        '', // Variant Compare At Price
        'true', // Variant Requires Shipping
        'true', // Variant Taxable
        '', '', '', '', // Unit price fields
        product.isbn, // Variant Barcode
        '', // Image Src
        '', // Image Position
        '', // Image Alt Text
        'false', // Gift Card
        '', // SEO Title
        '', // SEO Description
        product.author, // Book Authors metafield
        product.binding, // Book Binding metafield
        '', // Book Categories
        '', // Book Condition
        '', // Book Dimensions
        'en', // Book Language
        '', // Book Pages
        '', // Book Publication Date
        '', // Book Publication Year
        product.publisher, // Book Publisher metafield
        '', '', '', '', '', '', '', '', '', '', // Other metafields
        '', // Variant Image
        'lb', // Variant Weight Unit
        '', // Variant Tax Code
        '', // Cost per item
        'active' // Status
      ]);
    }

    return rows.map(row =>
      row.map(cell => this.escapeCSVCell(cell)).join(',')
    ).join('\n');
  }

  /**
   * Generate inventory update CSV for products already in Shopify
   * Excludes backordered items (can't add 0 to inventory)
   */
  generateInventoryUpdateCSV(alreadyInShopify) {
    // Filter out backordered items - can't add 0 to inventory
    const itemsToUpdate = alreadyInShopify.filter(item => !item.isBackordered && item.quantity > 0);

    if (itemsToUpdate.length === 0) {
      return '';
    }

    const lines = ['ISBN,Title,Quantity to Add,Current Action'];

    for (const item of itemsToUpdate) {
      lines.push([
        item.isbn,
        this.escapeCSVCell(item.title),
        item.quantity,
        'Manually update in Shopify'
      ].join(','));
    }

    return lines.join('\n');
  }

  /**
   * Create a URL-friendly handle from title
   */
  createHandle(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 100); // Limit length
  }

  /**
   * Parse a single CSV line (handles quoted fields)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Escape CSV cell (add quotes if needed)
   */
  escapeCSVCell(cell) {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

// Export for use in the app
window.ShopifyImportTool = ShopifyImportTool;
