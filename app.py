import os
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from config import Config
from models import db, User, MenuItem, Order, OrderItem

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)

def seed_menu_items():
    """Seed sample morning-themed coffee and bakery items if table is empty."""
    if MenuItem.query.first() is None:
        sample_items = [
            MenuItem(
                name="Sunrise Caramel Macchiato",
                category="hot",
                description="Freshly steamed milk with vanilla-flavored syrup, marked with espresso and golden caramel drizzle.",
                price=4.95,
                roast_level="Light Dawn Roast",
                image_emoji="☕"
            ),
            MenuItem(
                name="Golden Dawn Double Espresso",
                category="hot",
                description="Rich golden crema with vibrant floral and citrus honey notes, pulled fresh from single-origin beans.",
                price=3.25,
                roast_level="Ethiopian Yirgacheffe",
                image_emoji="☕"
            ),
            MenuItem(
                name="Morning Mist Vanilla Latte",
                category="hot",
                description="Velvety microfoam poured over double espresso infused with pure organic Madagascar vanilla.",
                price=4.75,
                roast_level="Medium Sunrise Roast",
                image_emoji="☕"
            ),
            MenuItem(
                name="Amber Honey Oat Cappuccino",
                category="hot",
                description="Thick frothy oat foam dusted with Ceylon cinnamon, gently sweetened with local wildflower honey.",
                price=4.95,
                roast_level="Smooth Blonde Roast",
                image_emoji="🍯"
            ),
            MenuItem(
                name="First Light Cold Brew",
                category="iced",
                description="Steeped for 18 hours in filtered cold water for an ultra-smooth, low-acid chocolatey morning lift.",
                price=4.50,
                roast_level="Slow-Steeped Dark Blend",
                image_emoji="🧊"
            ),
            MenuItem(
                name="Sunburst Cinnamon Iced Mocha",
                category="iced",
                description="Single-origin artisan dark chocolate blended with espresso, whole milk, and cold cream foam.",
                price=5.25,
                roast_level="Artisan Dark Roast",
                image_emoji="🧊"
            ),
            MenuItem(
                name="Morning Glow Blueberry Scone",
                category="bakery",
                description="Crumbly golden pastry loaded with fresh wild blueberries and finished with a morning citrus glaze.",
                price=3.75,
                roast_level="Baked Fresh Daily at 5 AM",
                image_emoji="🫐"
            ),
            MenuItem(
                name="Artisan Sunrise Butter Croissant",
                category="bakery",
                description="Flaky French croissant laminated with cultured Normandy butter, warm and crisp out of the oven.",
                price=3.50,
                roast_level="French Patisserie",
                image_emoji="🥐"
            ),
        ]
        db.session.bulk_save_objects(sample_items)
        db.session.commit()
        print(">> Morning Brew: Initial coffee menu seeded successfully.")

# Create database tables and seed menu on startup
with app.app_context():
    db.create_all()
    seed_menu_items()


# -------------------------------------------------------------
# Frontend Route
# -------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


# -------------------------------------------------------------
# Health Check (Essential for AWS EC2 ALB & Kubernetes / EKS)
# -------------------------------------------------------------
@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "morning-brew-coffee-api"}), 200


# -------------------------------------------------------------
# Authentication Endpoints (Logic in Backend)
# -------------------------------------------------------------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username is already taken. Please choose another."}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Log user in via session
    session["user_id"] = user.id
    session["username"] = user.username

    return jsonify({
        "message": f"Welcome to Morning Brew, {user.username}! Your account was created.",
        "user": user.to_dict()
    }), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip()  # can be username or email
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Please provide your username/email and password."}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password. Please try again."}), 401

    # Store user identity in server session
    session["user_id"] = user.id
    session["username"] = user.username

    return jsonify({
        "message": f"Good morning, {user.username}!",
        "user": user.to_dict()
    }), 200


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "You have been logged out. Have a wonderful morning!"}), 200


@app.route("/api/me", methods=["GET"])
def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None}), 200

    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return jsonify({"user": None}), 200

    return jsonify({"user": user.to_dict()}), 200


# -------------------------------------------------------------
# Coffee Menu API
# -------------------------------------------------------------
@app.route("/api/menu", methods=["GET"])
def get_menu():
    category = request.args.get("category")
    query = MenuItem.query.filter_by(available=True)
    if category and category != "all":
        query = query.filter_by(category=category)

    items = query.all()
    return jsonify({"items": [item.to_dict() for item in items]}), 200


# -------------------------------------------------------------
# Order Management API
# -------------------------------------------------------------
@app.route("/api/orders", methods=["POST"])
def place_order():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Please log in to place your morning coffee order."}), 401

    data = request.get_json() or {}
    cart_items = data.get("items", [])
    delivery_note = data.get("delivery_note", "Pickup at Counter").strip()

    if not cart_items or not isinstance(cart_items, list):
        return jsonify({"error": "Your coffee basket is empty. Please select coffee items."}), 400

    total_price = 0.0
    order_items_to_create = []

    # Validate items and calculate backend total securely
    for cart_entry in cart_items:
        item_id = cart_entry.get("item_id")
        quantity = int(cart_entry.get("quantity", 1))

        if quantity <= 0:
            continue

        menu_item = db.session.get(MenuItem, item_id)
        if not menu_item or not menu_item.available:
            return jsonify({"error": f"Item #{item_id} is currently out of stock."}), 400

        item_subtotal = menu_item.price * quantity
        total_price += item_subtotal

        order_items_to_create.append(
            OrderItem(
                menu_item_id=menu_item.id,
                item_name=menu_item.name,
                quantity=quantity,
                unit_price=menu_item.price
            )
        )

    if not order_items_to_create:
        return jsonify({"error": "No valid items selected."}), 400

    # Create Order object
    new_order = Order(
        user_id=user_id,
        total_price=total_price,
        delivery_note=delivery_note,
        status="Brewing with Care ☕"
    )
    new_order.items = order_items_to_create

    db.session.add(new_order)
    db.session.commit()

    return jsonify({
        "message": "Order placed successfully! The barista is preparing your morning brew.",
        "order": new_order.to_dict()
    }), 201


@app.route("/api/orders", methods=["GET"])
def get_orders():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Please log in to view order history."}), 401

    user_orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify({"orders": [order.to_dict() for order in user_orders]}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") != "production"
    app.run(host="0.0.0.0", port=port, debug=debug)
