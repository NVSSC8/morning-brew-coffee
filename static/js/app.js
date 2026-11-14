/* ============================================================
   AURORA MORNING BREW - FRONTEND APPLICATION LOGIC
   Auth, Dynamic Menu, Cart Management, Orders & Modals
   ============================================================ */

let currentUser = null;
let cart = [];
let allMenuItems = [];

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    checkAuthState();
    loadMenu("all");
    loadCartFromStorage();
});

// ------------------------------------------------------------
// AUTHENTICATION STATE & UI UPDATES
// ------------------------------------------------------------
async function checkAuthState() {
    try {
        const response = await fetch("/api/me");
        const data = await response.json();
        currentUser = data.user;
        updateAuthUI();
    } catch (err) {
        console.warn("Could not check authentication status:", err);
    }
}

function updateAuthUI() {
    const authActions = document.getElementById("auth-actions");
    const viewOrdersBtn = document.getElementById("view-orders-btn");

    if (currentUser) {
        authActions.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.85rem; font-weight:600; color:var(--espresso-dark);">
                    ☀️ ${currentUser.username}
                </span>
                <button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="handleLogout()">
                    Log Out
                </button>
            </div>
        `;
        if (viewOrdersBtn) viewOrdersBtn.classList.remove("hidden");
    } else {
        authActions.innerHTML = `
            <button class="btn btn-outline" onclick="openAuthModal('login')">
                <span class="btn-icon">👤</span> Sign In
            </button>
        `;
        if (viewOrdersBtn) viewOrdersBtn.classList.add("hidden");
    }
}

// ------------------------------------------------------------
// MENU LOADING & FILTERING
// ------------------------------------------------------------
async function loadMenu(category = "all") {
    const grid = document.getElementById("menu-grid");
    grid.innerHTML = `
        <div class="menu-loading" style="grid-column: 1/-1; text-align:center; padding:40px;">
            <p>Brewing fresh coffee selections...</p>
        </div>
    `;

    try {
        const url = category === "all" ? "/api/menu" : `/api/menu?category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        const data = await res.json();
        allMenuItems = data.items || [];
        renderMenu(allMenuItems);
    } catch (err) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; color:#ef4444; padding:40px;">
                <p>Failed to load the morning menu. Please refresh.</p>
            </div>
        `;
    }
}

function filterMenu(category, element) {
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    if (element) element.classList.add("active");
    loadMenu(category);
}

function renderMenu(items) {
    const grid = document.getElementById("menu-grid");
    if (!items || items.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center;">No morning items found in this category.</p>`;
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="menu-card">
            <div>
                <div class="card-top">
                    <div class="card-emoji-box">${item.image_emoji}</div>
                    <span class="roast-pill">${item.roast_level}</span>
                </div>
                <h3 class="card-title">${item.name}</h3>
                <p class="card-desc">${item.description}</p>
            </div>
            <div class="card-bottom">
                <span class="card-price">$${item.price.toFixed(2)}</span>
                <button class="btn-add-cart" onclick="addToCart(${item.id})">
                    + Add to Basket
                </button>
            </div>
        </div>
    `).join("");
}

// ------------------------------------------------------------
// CART MANAGEMENT
// ------------------------------------------------------------
function addToCart(itemId) {
    const item = allMenuItems.find(i => i.id === itemId);
    if (!item) return;

    const existingIndex = cart.findIndex(c => c.id === itemId);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image_emoji: item.image_emoji,
            quantity: 1
        });
    }

    saveCartToStorage();
    renderCart();
    showToast(`Added "${item.name}" to your morning basket! ☕`, "success");
}

function updateCartQuantity(itemId, delta) {
    const itemIndex = cart.findIndex(c => c.id === itemId);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }

    saveCartToStorage();
    renderCart();
}

function renderCart() {
    const container = document.getElementById("cart-items-container");
    const countBadge = document.getElementById("cart-count");
    const subtotalEl = document.getElementById("cart-subtotal");
    const taxEl = document.getElementById("cart-tax");
    const totalEl = document.getElementById("cart-total");

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    countBadge.textContent = totalCount;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-state">
                <span class="empty-icon">☕</span>
                <p>Your basket is currently empty.</p>
                <small>Select some morning coffees to get started!</small>
            </div>
        `;
        subtotalEl.textContent = "$0.00";
        taxEl.textContent = "$0.00";
        totalEl.textContent = "$0.00";
        return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-icon">${item.image_emoji}</div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                    <span style="font-weight:700; min-width:18px; text-align:center;">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
    }).join("");

    const tax = subtotal * 0.08;
    const grandTotal = subtotal + tax;

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxEl.textContent = `$${tax.toFixed(2)}`;
    totalEl.textContent = `$${grandTotal.toFixed(2)}`;
}

function toggleCartDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const backdrop = document.getElementById("cart-backdrop");
    drawer.classList.toggle("open");
    backdrop.classList.toggle("open");
}

function saveCartToStorage() {
    try {
        localStorage.setItem("aurora_cart", JSON.stringify(cart));
    } catch (e) {}
}

function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem("aurora_cart");
        if (saved) {
            cart = JSON.parse(saved);
            renderCart();
        }
    } catch (e) {}
}

// ------------------------------------------------------------
// ORDER PLACEMENT
// ------------------------------------------------------------
async function submitOrder() {
    if (!currentUser) {
        toggleCartDrawer();
        openAuthModal("login");
        showToast("Please sign in or create an account to complete your order.", "error");
        return;
    }

    if (cart.length === 0) {
        showToast("Your morning basket is empty!", "error");
        return;
    }

    const checkoutBtn = document.getElementById("checkout-btn");
    const note = document.getElementById("order-note").value;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Brewing Order...";

    try {
        const payload = {
            items: cart.map(c => ({ item_id: c.id, quantity: c.quantity })),
            delivery_note: note
        };

        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to place order.");
        }

        // Order placed successfully
        cart = [];
        saveCartToStorage();
        renderCart();
        toggleCartDrawer();

        showToast("Order placed! Barista is preparing your morning brew ☕", "success");
        openOrdersModal();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Place Morning Order ☀️";
    }
}

// ------------------------------------------------------------
// ORDER HISTORY MODAL
// ------------------------------------------------------------
async function openOrdersModal() {
    const modal = document.getElementById("orders-modal");
    const listContainer = document.getElementById("orders-list-container");
    modal.style.display = "flex";

    listContainer.innerHTML = `<p style="text-align:center; padding:20px;">Fetching your past morning orders...</p>`;

    try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding:30px; color:var(--text-muted);">
                    <p>No past orders found.</p>
                    <small>Your first freshly brewed cup awaits!</small>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = orders.map(order => `
            <div class="order-history-card">
                <div class="order-history-header">
                    <div>
                        <strong>Order #${order.id}</strong>
                        <span style="font-size:0.8rem; color:var(--text-muted); margin-left:8px;">${order.created_at}</span>
                    </div>
                    <span class="order-status-badge">${order.status}</span>
                </div>
                <div class="order-items-summary">
                    ${order.items.map(i => `${i.quantity}x ${i.item_name} ($${i.subtotal.toFixed(2)})`).join(" • ")}
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--espresso-light);">
                    <span>Note: ${order.delivery_note}</span>
                    <strong>Total: $${order.total_price.toFixed(2)}</strong>
                </div>
            </div>
        `).join("");
    } catch (err) {
        listContainer.innerHTML = `<p style="color:#ef4444; text-align:center;">Could not load orders.</p>`;
    }
}

function closeOrdersModal() {
    document.getElementById("orders-modal").style.display = "none";
}

// ------------------------------------------------------------
// AUTHENTICATION MODAL & LOGIC
// ------------------------------------------------------------
function openAuthModal(tab = "login") {
    const modal = document.getElementById("auth-modal");
    modal.style.display = "flex";
    switchAuthTab(tab);
}

function closeAuthModal() {
    document.getElementById("auth-modal").style.display = "none";
}

function switchAuthTab(tab) {
    const loginTabBtn = document.getElementById("login-tab-btn");
    const registerTabBtn = document.getElementById("register-tab-btn");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (tab === "login") {
        loginTabBtn.classList.add("active");
        registerTabBtn.classList.remove("active");
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
    } else {
        registerTabBtn.classList.add("active");
        loginTabBtn.classList.remove("active");
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById("login-identifier").value.trim();
    const password = document.getElementById("login-password").value;
    const submitBtn = document.getElementById("login-submit-btn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying Credentials...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Login failed");
        }

        currentUser = data.user;
        updateAuthUI();
        closeAuthModal();
        showToast(data.message, "success");
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In to Morning Brew";
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const submitBtn = document.getElementById("register-submit-btn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Account...";

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Registration failed");
        }

        currentUser = data.user;
        updateAuthUI();
        closeAuthModal();
        showToast(data.message, "success");
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
    }
}

async function handleLogout() {
    try {
        await fetch("/api/logout", { method: "POST" });
        currentUser = null;
        updateAuthUI();
        showToast("Logged out successfully. Have a wonderful morning!", "success");
    } catch (err) {
        console.error("Logout error:", err);
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}

// ------------------------------------------------------------
// TOAST SYSTEM
// ------------------------------------------------------------
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${type === "success" ? "✓" : "⚠️"}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
