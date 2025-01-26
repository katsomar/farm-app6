let products = []; 
let cart = [];
let sales = [];
let editIndex = -1;

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadSales();
    loadTrackingData();
    updateProductList();
    addNewBusinessDayDate();
    console.log('Page loaded and tracking table updated');
});

// Add product to the product list
function addProduct() {
    const productName = document.getElementById('productName').value;
    const unitPrice = document.getElementById('unitPrice').value;
    const openingStock = document.getElementById('openingStock').value;

    if (productName && unitPrice && openingStock) {
        const product = {
            name: productName,
            price: unitPrice,
            openingStock: parseInt(openingStock, 10),
            quantity: parseInt(openingStock, 10), // Set initial quantity equal to opening stock
            replenishments: [],
            totalSales: 0
        };

        if (editIndex === -1) {
            products.push(product);
        } else {
            products[editIndex] = product;
            editIndex = -1;
        }

        updateProductList();
        saveProducts();
        clearForm();
    } else {
        alert('Please fill in all fields');
    }
    saveProducts(); // Save products to localStorage
}

// Update the product list in both admin and vendor forms
function updateProductList() {
    const productList = document.getElementById('productList');
    const productSelect = document.getElementById('productSelect');
    
    if (productList) {
        productList.innerHTML = '';
        products.forEach((product, index) => {
            const totalReplenishments = product.replenishments.reduce((a, b) => a + b.quantity, 0);
            const initialQuantity = product.openingStock + totalReplenishments; // Initial quantity based on opening stock and replenishments
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>UGX ${product.price}</td>
                <td>${product.openingStock}</td>
                <td>${product.quantity}</td>
                <td>
                    <button onclick="editProduct(${index})">Edit</button>
                    <button onclick="deleteProduct(${index})">Delete</button>
                    <button onclick="replenishProduct(${index})">Replenish</button>
                </td>
            `;
            productList.appendChild(row);
        });
    }
    
    if (productSelect) {
        productSelect.innerHTML = '';
        products.forEach((product, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${product.name} - UGX ${product.price} (Qty: ${product.quantity})`;
            productSelect.appendChild(option);
        });
    }
}

function editProduct(index) {
    const product = products[index];
    document.getElementById('productName').value = product.name;
    document.getElementById('unitPrice').value = product.price;
    document.getElementById('quantity').value = product.quantity;
    editIndex = index;
    saveProducts(); // Save products to localStorage
}

function deleteProduct(index) {
    products.splice(index, 1);
    updateProductList();
    saveProducts();
}

function clearForm() {
    document.getElementById('productName').value = '';
    document.getElementById('unitPrice').value = '';
    document.getElementById('quantity').value = '';
}

// Function to generate a random sales order number
function generateSalesOrderNumber() {
    return 'SO-' + Math.floor(Math.random() * 1000000);
}

// Add selected product to the cart
function addToCart() {
    const productIndex = document.getElementById('productSelect').value;
    const quantitySold = parseInt(document.getElementById('quantitySold').value);
    
    const product = products[productIndex];

    if (quantitySold > product.quantity) {
        alert('Not enough stock');
        return;
    }

    const cartItem = {
        name: product.name,
        price: product.price,
        quantity: quantitySold
    };

    cart.push(cartItem);
    product.quantity -= quantitySold;
    product.totalSales = (product.totalSales || 0) + quantitySold; // Update total sales for the product
    updateProductList();
    saveProducts();

    // Check for low stock and display warning
    if (product.quantity <= 5) {
        alert(`Warning: Only ${product.quantity} items left of ${product.name}. Please replenish the stock.`);
    }

    updateCart();
    document.getElementById('salesOrderNumber').value = generateSalesOrderNumber();
    saveProducts(); // Save products to localStorage
    saveSales(); // Save sales to localStorage
}

function toggleCashInput() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const cashAmountContainer = document.getElementById('cashAmountContainer');
    console.log(`Payment method selected: ${paymentMethod}`); // Debugging line
    if (paymentMethod === 'cash') {
        cashAmountContainer.style.display = 'block';
    } else {
        cashAmountContainer.style.display = 'none';
    }
}

function updatePaymentDetails() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentDetails = document.getElementById('paymentDetails');
    let details = '';

    switch (paymentMethod) {
        case 'airtel_money':
            details = 'Pay to Airtel merchant code- 6345768';
            break;
        case 'mtn_money':
            details = 'Pay to MOMO - 186508';
            break;
        case 'bank':
            details = 'Pay to Bank - Equity 1010xxxxxx450';
            break;
        default:
            details = '';
            break;
    }

    paymentDetails.textContent = details;
}

function confirmPayment() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amountPaid = parseFloat(document.getElementById('amountPaid').value);
    const totalCost = parseFloat(document.getElementById('totalCost').textContent);
    const balance = amountPaid - totalCost;
    let paymentDetails = '';

    switch (paymentMethod) {
        case 'cash':
            paymentDetails = `Cash`;
            break;
        case 'airtel_money':
            paymentDetails = `Airtel merchant code- 6345768`;
            break;
        case 'mtn_money':
            paymentDetails = `MOMO - 186508'`;
            break;
        case 'bank':
            paymentDetails = `Bank - Equity 1010xxxxxx450`;
            break;
    }

    const salesOrderNumber = document.getElementById('salesOrderNumber').value;

    const sale = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        products: [...cart],
        totalCost: totalCost,
        amountPaid: amountPaid,
        balance: balance,
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails,
        salesOrderNumber: salesOrderNumber
    };

    if (amountPaid < totalCost) {
        document.getElementById('debtorDetails').style.display = 'block';
        return;
    } else {
        generateReceipt(sale);
    }

    sales.push(sale);
    saveSales();

    cart.forEach(cartItem => {
        const product = products.find(p => p.name === cartItem.name);
        if (product) {
            product.totalSales = (product.totalSales || 0) + cartItem.quantity; // Update total sales for the product
        }
    });

    cart = [];
    updateCart();
    updateProductList();
    saveSales(); // Save sales to localStorage
    saveProducts(); // Save products to localStorage
}

function confirmDebtorDetails() {
    const debtorName = document.getElementById('debtorName').value;
    const debtorContact = document.getElementById('debtorContact').value;
    const amountPaid = parseFloat(document.getElementById('amountPaid').value);
    const totalCost = parseFloat(document.getElementById('totalCost').textContent);
    const balance = amountPaid - totalCost;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentDetails = document.getElementById('paymentDetails').textContent;
    const salesOrderNumber = document.getElementById('salesOrderNumber').value;

    const sale = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        products: [...cart],
        totalCost: totalCost,
        amountPaid: amountPaid,
        balance: balance,
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails,
        salesOrderNumber: salesOrderNumber,
        debtorName: debtorName,
        debtorContact: debtorContact
    };

    generateDemandingForm(sale);

    sales.push(sale);
    saveSales();

    cart = [];
    updateCart();
    document.getElementById('debtorDetails').style.display = 'none';
    saveSales(); // Save sales to localStorage
    saveProducts(); // Save products to localStorage
}

function generateReceipt(sale) {
    let receipt = `
        <div class="receipt">
            <h2>Receipt</h2>
            <p><strong>Sales Order Number:</strong> ${sale.salesOrderNumber}</p>
            <p><strong>Total Cost:</strong> UGX ${sale.totalCost}</p>
            <p><strong>Balance:</strong> UGX ${sale.balance}</p>
            <p><strong>Payment Method:</strong> ${sale.paymentDetails}</p>
            <h3>Products:</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>`;
    sale.products.forEach(item => {
        receipt += `
                    <tr>
                        <td>${item.name}</td>
                        <td>UGX ${item.price}</td>
                        <td>${item.quantity}</td>
                        <td>UGX ${item.price * item.quantity}</td>
                    </tr>`;
    });
    receipt += `
                </tbody>
            </table>
        </div>`;

    const receiptContainer = document.getElementById('receiptContainer');
    receiptContainer.innerHTML = receipt;
}

function generateDemandingForm(sale) {
    const amountDemanded = sale.totalCost - sale.amountPaid;
    let demandingForm = `
        <div class="demanding-form">
            <h2>Demanding Form</h2>
            <p><strong>Sales Order Number:</strong> ${sale.salesOrderNumber}</p>
            <p><strong>Debtor's Name:</strong> ${sale.debtorName}</p>
            <p><strong>Debtor's Contact:</strong> ${sale.debtorContact}</p>
            <p><strong>Total Cost:</strong> UGX ${sale.totalCost}</p>
            <p><strong>Amount Paid:</strong> UGX ${sale.amountPaid}</p>
            <p><strong>Amount Demanded:</strong> UGX ${amountDemanded}</p>
            <h3>Products:</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>`;
    sale.products.forEach(item => {
        demandingForm += `
                    <tr>
                        <td>${item.name}</td>
                        <td>UGX ${item.price}</td>
                        <td>${item.quantity}</td>
                        <td>UGX ${item.price * item.quantity}</td>
                    </tr>`;
    });
    demandingForm += `
                </tbody>
            </table>
        </div>`;

    const demandingFormContainer = document.getElementById('demandingFormContainer');
    demandingFormContainer.innerHTML = demandingForm;
}

function printDemandingForm() {
    const demandingFormContent = document.getElementById('demandingFormContainer').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = demandingFormContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
}

// Update the cart list and total cost
function updateCart() {
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = '';

    let totalCost = 0;

    cart.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - UGX ${item.price} x ${item.quantity}`;
        cartList.appendChild(li);
        totalCost += item.price * item.quantity;
    });

    document.getElementById('totalCost').textContent = totalCost;
}

// Load products from localStorage
function loadProducts() {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    updateProductList(); // Ensure the product list is updated after loading products
}

// Save products to localStorage
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Load sales from localStorage
function loadSales() {
    const savedSales = localStorage.getItem('sales');
    if (savedSales) {
        sales = JSON.parse(savedSales);
    }
}

// Save sales to localStorage
function saveSales() {
    localStorage.setItem('sales', JSON.stringify(sales));
}

// Load tracking data from localStorage
function loadTrackingData() {
    const trackingRecords = JSON.parse(localStorage.getItem('trackingRecords')) || [];
    trackingRecords.forEach(record => {
        createNewTrackingTable(record.date, record.products);
    });
}

// Save tracking data to localStorage
function saveTrackingData() {
    const trackingData = { date: new Date().toLocaleDateString(), products };
    let trackingRecords = JSON.parse(localStorage.getItem('trackingRecords')) || [];
    const existingRecordIndex = trackingRecords.findIndex(record => record.date === trackingData.date);
    if (existingRecordIndex !== -1) {
        trackingRecords[existingRecordIndex] = trackingData;
    } else {
        trackingRecords.push(trackingData);
    }
    localStorage.setItem('trackingRecords', JSON.stringify(trackingRecords));
}

// Function to format date to DD/MM/YYYY
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to check if it's 7:30 PM E.A.T and calculate total sales and display summary
function checkEndOfDay() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Check if it's 7:30 PM E.A.T (19:30)
    if (hours === 19 && minutes === 30) {
        calculateTotalSales();
        displaySalesSummary();
    }
}

// Function to add the date of the new business day at the top of the sales records
function addNewBusinessDayDate() {
    const now = new Date();
    const dateRow = document.createElement('tr');
    dateRow.innerHTML = `
        <td colspan="9"><strong>Business Day: ${now.toDateString()}</strong></td>
    `;
    const salesTableBody = document.getElementById('salesTableBody');
    if (salesTableBody) {
        salesTableBody.insertBefore(dateRow, salesTableBody.firstChild);
    } else {
        console.error('Element with ID salesTableBody not found');
    }
}

// Function to create a new table for the new business day
function createNewBusinessDayTable() {
    const salesTableBody = document.getElementById('salesTableBody');
    const newTable = document.createElement('table');
    newTable.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Sales Order Number</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Cost (UGX)</th>
                <th>Amount Paid (UGX)</th>
                <th>Balance (UGX)</th>
                <th>Payment Method</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody id="salesTableBody">
            <!-- Sales data will be dynamically inserted here -->
        </tbody>
    `;
    salesTableBody.parentNode.replaceChild(newTable, salesTableBody);
}

// Function to check if it's 5 AM E.A.T and add the new business day date and create new table
function checkNewBusinessDay() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Check if it's 5 AM E.A.T (05:00)
    if (hours === 5 && minutes === 0) {
        products.forEach(product => {
            product.openingStock = product.quantity; // Set opening stock to current quantity at the start of the day
            product.totalSales = 0; // Reset total sales for the new day
            product.replenishments = []; // Reset replenishments for the new day
        });
        addNewBusinessDayDate();
        createNewBusinessDayTable();
    }
}

// Set an interval to check the time every minute
setInterval(checkEndOfDay, 60000);
setInterval(checkNewBusinessDay, 60000);

// Load products, sales, and tracking data when the page loads
window.onload = function() {
    loadProducts();
    loadSales();
    loadTrackingData();
    addNewBusinessDayDate();
};

function printReceipt() {
    const receiptContent = document.getElementById('receiptContainer').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = receiptContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
}

function clearCart() {
    // Restore product quantities
    cart.forEach(cartItem => {
        const product = products.find(p => p.name === cartItem.name);
        if (product) {
            product.quantity += cartItem.quantity;
        }
    });

    // Clear the cart
    cart = [];
    updateCart();
    updateProductList();
    saveProducts();
    saveProducts(); // Save products to localStorage
}

function updateButtonColor(date) {
    const formattedDate = formatDate(date);
    const dropdownButton = document.querySelector(`#section-${formattedDate} button`);
    const salesForDate = sales.filter(sale => sale.date === date);
    if (salesForDate.some(sale => sale.amountPaid < sale.totalCost)) {
        dropdownButton.classList.add('warning-button');
    } else {
        dropdownButton.classList.remove('warning-button');
    }
}

function clearReplenishments(index) {
    const totalReplenishments = products[index].replenishments.reduce((a, b) => a + b.quantity, 0);
    products[index].quantity -= totalReplenishments;
    products[index].replenishments = [];
    updateProductList();
    saveProducts();
    saveTrackingData(); // Save changes
    console.log(`Replenishments cleared for product index: ${index}`); // Debugging line
    saveProducts(); // Save products to localStorage
    saveTrackingData(); // Save tracking data to localStorage
}

function clearSales(index) {
    products[index].totalSales = 0;
    updateProductList();
    saveProducts();
    saveTrackingData(); // Save changes
    console.log(`Sales cleared for product index: ${index}`); // Debugging line
    saveProducts(); // Save products to localStorage
    saveTrackingData(); // Save tracking data to localStorage
}

function replenishProduct(index) {
    const quantity = parseInt(prompt('Enter quantity to replenish:'), 10);
    if (!isNaN(quantity) && quantity > 0) {
        products[index].quantity += quantity;
        products[index].replenishments.push({ quantity });
        updateProductList();
        saveProducts();
    } else {
        alert('Invalid quantity');
    }
    saveProducts(); // Save products to localStorage
    saveTrackingData(); // Save tracking data to localStorage
}
