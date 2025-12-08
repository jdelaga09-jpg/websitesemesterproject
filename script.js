// ===========================
// TechHub Website JavaScript
// ===========================

// ===========================
// JAVASCRIPT OBJECT - Cart Item
// A class that makes objects to hold product info
// ===========================
class CartItem {
    constructor(productName, price, quantity = 1) {
        this.productName = productName;
        this.price = parseFloat(price); /* turn text number into real number */
        this.quantity = quantity;
        this.id = Date.now(); /* use current time as unique id */
    }

    getTotal() {
        return this.price * this.quantity;
    }

    toJSON() {
        /* turn object into text format to save */
        return {
            id: this.id,
            productName: this.productName,
            price: this.price,
            quantity: this.quantity
        };
    }
}

// ===========================
// SHOPPING CART OBJECT
// An object that stores and manages shopping cart stuff
// ===========================
const ShoppingCart = {
    items: [], /* array to hold all items */
    taxRate: 0.10, /* 10 percent tax */
    discountPercent: 0, /* no discount at start */
    promoCodes: {
        'SAVE10': 0.10, /* 10 percent off */
        'SUMMER20': 0.20, /* 20 percent off */
        'WELCOME5': 0.05 /* 5 percent off */
    },

    // Add item to cart
    addItem: function(productName, price) {
        const existingItem = this.items.find(item => item.productName === productName); /* look for same item already in cart */
        
        if (existingItem) {
            existingItem.quantity += 1; /* if already there, add one more */
        } else {
            this.items.push(new CartItem(productName, price)); /* if new, create new item */
        }
        
        this.saveToSessionStorage();
        this.updateCartBadge();
        this.showNotification(`${productName} added to cart!`);
    },

    // Remove item from cart
    removeItem: function(productId) {
        const index = this.items.findIndex(item => item.id === productId); /* find position of item */
        if (index > -1) {
            const itemName = this.items[index].productName;
            this.items.splice(index, 1); /* remove item from list */
            this.saveToSessionStorage();
            this.updateCartBadge();
            this.showNotification(`${itemName} removed from cart!`);
        }
    },

    // Update item quantity
    updateQuantity: function(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item && quantity > 0) {
            item.quantity = quantity;
            this.saveToSessionStorage();
        }
    },

    // Calculate subtotal
    getSubtotal: function() {
        return this.items.reduce((sum, item) => sum + item.getTotal(), 0); /* add up all item costs */
    },

    // Apply promo code
    applyPromoCode: function(code) {
        const upperCode = code.toUpperCase().trim(); /* change to uppercase and remove spaces */
        if (this.promoCodes[upperCode]) {
            this.discountPercent = this.promoCodes[upperCode];
            this.saveToSessionStorage();
            return {
                success: true,
                message: `Promo code ${upperCode} applied! You save ${this.getDiscountAmount().toFixed(2)}`
            };
        }
        return {
            success: false,
            message: 'Invalid promo code'
        };
    },

    // Get discount amount
    getDiscountAmount: function() {
        return this.getSubtotal() * this.discountPercent; /* multiply price by discount percent */
    },

    // Calculate tax
    getTax: function() {
        return (this.getSubtotal() - this.getDiscountAmount()) * this.taxRate;
    },

    // Calculate total
    getTotal: function() {
        return this.getSubtotal() - this.getDiscountAmount() + this.getTax();
    },

    // Save cart to session storage
    saveToSessionStorage: function() {
        /* save the cart info to the browser's memory while on this session */
        const cartData = {
            items: this.items.map(item => item.toJSON()), /* change items to text format */
            discountPercent: this.discountPercent,
            timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('techHubCart', JSON.stringify(cartData)); /* store as text */
    },

    // Load cart from session storage
    loadFromSessionStorage: function() {
        /* pull the saved cart info from the browser's memory */
        const cartData = sessionStorage.getItem('techHubCart');
        if (cartData) {
            try {
                const parsed = JSON.parse(cartData); /* change text back to objects */
                this.items = parsed.items.map(item => 
                    new CartItem(item.productName, item.price, item.quantity)
                );
                this.discountPercent = parsed.discountPercent || 0;
            } catch (e) {
                console.error('Error loading cart from session storage:', e);
            }
        }
    },

    // Clear cart
    clearCart: function() {
        this.items = [];
        this.discountPercent = 0;
        sessionStorage.removeItem('techHubCart'); /* delete saved cart from memory */
        this.updateCartBadge();
        this.showNotification('Cart cleared!');
    },

    // Update cart badge
    updateCartBadge: function() {
        const badge = document.getElementById('cartBadge'); /* find the badge element on page */
        if (badge) {
            badge.textContent = this.items.length; /* show how many items in cart */
        }
    },

    // Show notification
    showNotification: function(message) {
        const notification = document.createElement('div'); /* make new popup message */
        notification.className = 'alert alert-success';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.style.animation = 'slideIn 0.3s ease';
        
        document.body.appendChild(notification); /* add message to page */
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300); /* delete message after 3 seconds */
        }, 3000);
    }
};

// ===========================
// DOM INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    /* run this code after page loads */
    // Load cart from session storage
    ShoppingCart.loadFromSessionStorage();
    ShoppingCart.updateCartBadge();

    // Setup event listeners
    setupAddToCartButtons();
    setupContactForm();
    setupCheckoutForm();
    setupPromoCodeButton();
    
    // Update cart display if on cart page
    if (document.getElementById('cartItems')) {
        displayCartItems();
    }
});

// ===========================
// ADD TO CART FUNCTIONALITY
// ===========================
function setupAddToCartButtons() {
    const buttons = document.querySelectorAll('.add-to-cart'); /* find all add buttons */
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            /* when button is clicked */
            const productName = this.getAttribute('data-product');
            const price = this.getAttribute('data-price');
            ShoppingCart.addItem(productName, price);
            
            // Add visual feedback
            const originalText = this.textContent;
            this.textContent = '✓ Added!';
            this.classList.add('disabled');
            
            setTimeout(() => {
                this.textContent = originalText;
                this.classList.remove('disabled');
            }, 2000);
        });
    });
}

// ===========================
// DISPLAY CART ITEMS
// ===========================
function displayCartItems() {
    const container = document.getElementById('cartItems'); /* find where to show items */
    
    if (ShoppingCart.items.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                You didn't pick anything yet. <a href="products.html">Go look at our stuff</a>
            </div>
        `;
        updateCartTotals();
        return;
    }

    container.innerHTML = ShoppingCart.items.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h5>${item.productName}</h5>
                <p>Price: $${item.price.toFixed(2)} × <input 
                    type="number" 
                    min="1" 
                    value="${item.quantity}" 
                    class="qty-input" 
                    data-id="${item.id}"
                    style="width: 50px; padding: 3px;">
                </p>
            </div>
            <div class="cart-item-price">$${item.getTotal().toFixed(2)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
    `).join('');

    // Setup quantity input listeners
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const quantity = parseInt(this.value) || 1;
            const id = parseInt(this.getAttribute('data-id'));
            ShoppingCart.updateQuantity(id, quantity);
            displayCartItems();
            updateCartTotals();
        });
    });

    updateCartTotals();
}

// ===========================
// REMOVE FROM CART
// ===========================
function removeFromCart(itemId) {
    ShoppingCart.removeItem(itemId);
    displayCartItems();
}

// ===========================
// UPDATE CART TOTALS
// ===========================
function updateCartTotals() {
    const subtotal = ShoppingCart.getSubtotal();
    const discount = ShoppingCart.getDiscountAmount();
    const tax = ShoppingCart.getTax();
    const total = ShoppingCart.getTotal();

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('tax').textContent = tax.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);

    // Show discount if applied
    if (ShoppingCart.discountPercent > 0) {
        const discountPercent = (ShoppingCart.discountPercent * 100).toFixed(0);
        const existingDiscount = document.querySelector('.discount-row');
        if (existingDiscount) {
            existingDiscount.innerHTML = `
                <div class="col-6">Discount (${discountPercent}%):</div>
                <div class="col-6 text-end text-success">-$${discount.toFixed(2)}</div>
            `;
        }
    }
}

// ===========================
// PROMO CODE FUNCTIONALITY
// ===========================
function setupPromoCodeButton() {
    const applyBtn = document.getElementById('applyPromo');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const codeInput = document.getElementById('promoCode');
            const code = codeInput.value.trim();
            
            if (!code) {
                alert('Please enter a promo code');
                return;
            }

            const result = ShoppingCart.applyPromoCode(code);
            
            if (result.success) {
                alert(result.message);
                codeInput.value = '';
                
                // Add discount row to summary
                const summaryCard = document.querySelector('.card-body');
                if (summaryCard && !document.querySelector('.discount-row')) {
                    const discountPercent = (ShoppingCart.discountPercent * 100).toFixed(0);
                    const discountRow = document.createElement('div');
                    discountRow.className = 'discount-row row mb-2 text-success';
                    discountRow.innerHTML = `
                        <div class="col-6">Discount (${discountPercent}%):</div>
                        <div class="col-6 text-end">-$${ShoppingCart.getDiscountAmount().toFixed(2)}</div>
                    `;
                    const taxRow = summaryCard.querySelector('.row:nth-child(2)');
                    taxRow.parentNode.insertBefore(discountRow, taxRow);
                }
                
                updateCartTotals();
            } else {
                alert(result.message);
            }
        });
    }
}

// ===========================
// CHECKOUT FORM
// ===========================
function setupCheckoutForm() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cancelCheckoutBtn = document.getElementById('cancelCheckout');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutSection = document.getElementById('checkoutSection');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (ShoppingCart.items.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            checkoutSection.style.display = 'block';
            checkoutBtn.style.display = 'none';
            window.scrollTo({ top: checkoutSection.offsetTop - 100, behavior: 'smooth' });
        });
    }

    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', function() {
            checkoutSection.style.display = 'none';
            checkoutBtn.style.display = 'block';
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zip: document.getElementById('zip').value,
                cardName: document.getElementById('cardName').value,
                orderDate: new Date().toISOString(),
                total: ShoppingCart.getTotal(),
                items: ShoppingCart.items.map(item => item.toJSON())
            };

            // Save order to session storage
            let orders = JSON.parse(sessionStorage.getItem('techHubOrders')) || [];
            orders.push(formData);
            sessionStorage.setItem('techHubOrders', JSON.stringify(orders));

            // Show success message
            alert(`Thank you for your order, ${formData.firstName}! Total: $${formData.total.toFixed(2)}`);
            
            // Clear cart and form
            ShoppingCart.clearCart();
            this.reset();
            checkoutSection.style.display = 'none';
            checkoutBtn.style.display = 'block';
            
            // Redirect to home after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
    }
}

// ===========================
// CONTACT FORM HANDLER
// ===========================
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value || 'Not provided',
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value,
                subscribe: document.getElementById('subscribe').checked,
                submittedAt: new Date().toISOString()
            };

            // Save to session storage
            let contacts = JSON.parse(sessionStorage.getItem('techHubContacts')) || [];
            contacts.push(formData);
            sessionStorage.setItem('techHubContacts', JSON.stringify(contacts));

            // Show success message
            const messageDiv = document.getElementById('formMessage');
            messageDiv.style.display = 'block';
            messageDiv.className = 'alert alert-success';
            messageDiv.innerHTML = `
                <h5>Message Sent Successfully!</h5>
                <p>Thank you, ${formData.fullName}! We've received your message and will get back to you soon.</p>
                <p>A confirmation has been sent to: ${formData.email}</p>
            `;

            // Reset form
            this.reset();

            // Scroll to message
            messageDiv.scrollIntoView({ behavior: 'smooth' });

            // Hide message after 5 seconds
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        });
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Get cart summary for display
function getCartSummary() {
    return {
        itemCount: ShoppingCart.items.length,
        subtotal: ShoppingCart.getSubtotal(),
        tax: ShoppingCart.getTax(),
        discount: ShoppingCart.getDiscountAmount(),
        total: ShoppingCart.getTotal()
    };
}

// Smooth scroll to element
function smoothScroll(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Log cart data (for debugging)
function logCartData() {
    console.log('=== Cart Summary ===');
    console.log('Items:', ShoppingCart.items);
    console.log('Subtotal:', ShoppingCart.getSubtotal());
    console.log('Discount:', ShoppingCart.getDiscountAmount());
    console.log('Tax:', ShoppingCart.getTax());
    console.log('Total:', ShoppingCart.getTotal());
}

// Export cart data
function exportCartData() {
    const cartData = {
        cart: ShoppingCart.items,
        summary: getCartSummary(),
        timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(cartData, null, 2));
    return cartData;
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================
document.addEventListener('keydown', function(e) {
    // Ctrl+K to focus search (can be added later)
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
    }
    
    // Ctrl+L to go to cart
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        window.location.href = 'cart.html';
    }
});

// ===========================
// PAGE LOAD ANIMATIONS
// ===========================
window.addEventListener('load', function() {
    // Add fade-in animation to page
    document.body.style.animation = 'fadeIn 0.5s ease';
    
    // Log session info
    console.log('TechHub Website Loaded');
    console.log('Cart items:', ShoppingCart.items.length);
});
