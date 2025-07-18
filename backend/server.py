from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import hmac
import hashlib
import json

# Import local modules using absolute imports
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import *
from auth import *
from simple_info_routes import info_router

# Import payment integrations
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client setup
razorpay_client = razorpay.Client(auth=(
    os.environ.get('RAZORPAY_KEY_ID'),
    os.environ.get('RAZORPAY_KEY_SECRET')
))

# Payment clients
stripe_client = StripeCheckout(api_key=os.getenv("STRIPE_SECRET_KEY", ""))

# Create the main app
app = FastAPI(title="DRIBBLE E-Commerce API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database
async def get_database() -> AsyncIOMotorDatabase:
    return db

# Dependency injection for auth
async def get_current_user_db(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    database: AsyncIOMotorDatabase = Depends(get_database)
) -> Optional[User]:
    """Get current user from JWT token with database access."""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    
    user = await get_user_by_email(database, email)
    if user is None:
        return None
    
    # Convert to User (remove hashed_password)
    return User(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at
    )

# Removed get_current_user_with_db function as it's no longer needed

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, database: AsyncIOMotorDatabase = Depends(get_database)):
    # Check if user already exists
    existing_user = await get_user_by_email(database, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_in_db = UserInDB(
        **user_data.dict(exclude={"password"}),
        hashed_password=hashed_password
    )
    
    # Insert into database
    await database.users.insert_one(user_in_db.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    # Convert to User for response
    user = User(**user_in_db.dict(exclude={"hashed_password"}))
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin, database: AsyncIOMotorDatabase = Depends(get_database)):
    user = await authenticate_user(database, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    # Convert to User for response
    user_response = User(**user.dict(exclude={"hashed_password"}))
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user_db)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

# ============================================================================
# PRODUCT ROUTES
# ============================================================================

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    filter_query = {"is_active": True}
    
    if category:
        filter_query["category"] = category
    
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await database.products.find(filter_query).limit(limit).to_list(length=limit)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, database: AsyncIOMotorDatabase = Depends(get_database)):
    product = await database.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.get("/products/{product_id}/sizechart")
async def get_product_sizechart(product_id: str, database: AsyncIOMotorDatabase = Depends(get_database)):
    """Get size chart and pricing for a specific product."""
    product = await database.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "colors": product.get("size_chart", {}).get("colors", ["Black", "White", "Lavender", "Beige", "Red", "Sage Green", "Brown", "Maroon", "Orange", "Navy"]),
        "sizes": product.get("size_chart", {}).get("sizes", ["S", "M", "L", "XL", "XXL"]),
        "chart_code": product.get("size_chart", {}).get("chart_code", "OS210"),
        "pricing": {
            "bulk": {
                "quantity": product.get("pricing_rules", {}).get("bulk_label", "More than 15pcs"),
                "price": f"{product.get('pricing_rules', {}).get('bulk_price', 279)}₹"
            },
            "regular": {
                "quantity": product.get("pricing_rules", {}).get("regular_label", "Less than 15pcs"),
                "price": f"{product.get('pricing_rules', {}).get('regular_price', 319)}₹"
            }
        }
    }

@api_router.put("/products/{product_id}/sizechart")
async def update_product_sizechart(
    product_id: str,
    size_chart_data: dict,
    database: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(lambda db=Depends(get_database): require_admin_with_db(db))
):
    """Update size chart and pricing for a specific product (Admin only)."""
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {
        "size_chart": size_chart_data.get("size_chart", {}),
        "pricing_rules": size_chart_data.get("pricing_rules", {}),
        "updated_at": datetime.utcnow()
    }
    
    result = await database.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Size chart and pricing updated successfully"}

@api_router.post("/products", response_model=Product)
async def create_product(
    product_data: ProductCreate,
    database: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(lambda db=Depends(get_database): require_admin_with_db(db))
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product = Product(**product_data.dict())
    await database.products.insert_one(product.dict())
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    database: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(lambda db=Depends(get_database): require_admin_with_db(db))
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in product_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await database.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await database.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    database: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(lambda db=Depends(get_database): require_admin_with_db(db))
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await database.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# ============================================================================
# CATEGORY ROUTES
# ============================================================================

@api_router.get("/categories", response_model=List[Category])
async def get_categories(database: AsyncIOMotorDatabase = Depends(get_database)):
    categories = await database.categories.find({"is_active": True}).sort("sort_order").to_list(length=100)
    return [Category(**category) for category in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(
    category_data: CategoryCreate,
    database: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(lambda db=Depends(get_database): require_admin_with_db(db))
):
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = Category(**category_data.dict())
    await database.categories.insert_one(category.dict())
    return category

# ============================================================================
# CART ROUTES
# ============================================================================

def get_session_id(request: Request) -> str:
    session_id = request.cookies.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id

@api_router.get("/cart")
async def get_cart(
    request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user_db),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    if current_user:
        cart = await database.carts.find_one({"user_id": current_user.id})
    else:
        session_id = get_session_id(request)
        response.set_cookie("session_id", session_id, max_age=30*24*3600)  # 30 days
        cart = await database.carts.find_one({"session_id": session_id})
    
    if not cart:
        return {"items": [], "total": 0}
    
    # Calculate cart total
    total = 0
    enriched_items = []
    
    for item in cart["items"]:
        product = await database.products.find_one({"id": item["product_id"]})
        if product:
            # Determine price based on total quantity
            total_quantity = sum(cart_item["quantity"] for cart_item in cart["items"] if cart_item["product_id"] == item["product_id"])
            price = product["bulk_price"] if total_quantity >= 15 else product["base_price"]
            
            item_total = price * item["quantity"]
            total += item_total
            
            enriched_items.append({
                **item,
                "product_name": product["name"],
                "product_image": product["images"][0] if product["images"] else None,
                "unit_price": price,
                "total_price": item_total
            })
    
    return {"items": enriched_items, "total": total}

@api_router.post("/cart/add")
async def add_to_cart(
    cart_item: CartAdd,
    request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user_db),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verify product exists and has stock
    product = await database.products.find_one({"id": cart_item.product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    variant = next((v for v in product["variants"] if v["color"] == cart_item.color and v["size"] == cart_item.size), None)
    if not variant or variant["stock_quantity"] < cart_item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    if current_user:
        cart = await database.carts.find_one({"user_id": current_user.id})
        cart_filter = {"user_id": current_user.id}
    else:
        session_id = get_session_id(request)
        response.set_cookie("session_id", session_id, max_age=30*24*3600)
        cart = await database.carts.find_one({"session_id": session_id})
        cart_filter = {"session_id": session_id}
    
    if cart:
        # Update existing cart
        existing_item = next((item for item in cart["items"] if 
                            item["product_id"] == cart_item.product_id and 
                            item["color"] == cart_item.color and 
                            item["size"] == cart_item.size), None)
        
        if existing_item:
            existing_item["quantity"] += cart_item.quantity
        else:
            cart["items"].append(cart_item.dict())
        
        await database.carts.update_one(
            cart_filter,
            {"$set": {"items": cart["items"], "updated_at": datetime.utcnow()}}
        )
    else:
        # Create new cart
        new_cart = Cart(
            user_id=current_user.id if current_user else None,
            session_id=session_id if not current_user else None,
            items=[cart_item.dict()]
        )
        await database.carts.insert_one(new_cart.dict())
    
    return {"message": "Item added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(
    cart_item: CartAdd,
    request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user_db),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update quantity of an item in cart"""
    try:
        # First validate stock availability
        product = await database.products.find_one({"id": cart_item.product_id, "is_active": True})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if variant exists and get stock quantity
        variant = next((v for v in product["variants"] if v["color"] == cart_item.color and v["size"] == cart_item.size), None)
        if not variant:
            raise HTTPException(status_code=400, detail="Product variant not found")
        
        # Check stock availability
        if cart_item.quantity > variant["stock_quantity"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock. Only {variant['stock_quantity']} units available"
            )
        
        # Get session ID
        session_id = get_session_id(request)
        
        if current_user:
            cart_filter = {"user_id": current_user.id}
        else:
            cart_filter = {"session_id": session_id}
        
        # Find existing cart
        cart = await database.carts.find_one(cart_filter)
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")
        
        # Find the item to update
        updated = False
        for item in cart["items"]:
            if (item["product_id"] == cart_item.product_id and 
                item["color"] == cart_item.color and 
                item["size"] == cart_item.size):
                
                if cart_item.quantity <= 0:
                    # Remove item if quantity is 0 or negative
                    cart["items"].remove(item)
                else:
                    # Update quantity
                    item["quantity"] = cart_item.quantity
                updated = True
                break
        
        if not updated and cart_item.quantity > 0:
            # Add new item if it doesn't exist and quantity > 0
            # Calculate pricing
            total_quantity = sum(item["quantity"] for item in cart["items"]) + cart_item.quantity
            unit_price = product["bulk_price"] if total_quantity >= 15 else product["base_price"]
            
            new_item = {
                "product_id": cart_item.product_id,
                "color": cart_item.color,
                "size": cart_item.size,
                "quantity": cart_item.quantity,
                "product_name": product["name"],
                "product_image": product.get("images", [None])[0],
                "unit_price": unit_price,
                "total_price": unit_price * cart_item.quantity
            }
            cart["items"].append(new_item)
        
        # Recalculate all prices (bulk pricing might have changed)
        total_quantity = sum(item["quantity"] for item in cart["items"])
        for item in cart["items"]:
            product = await database.products.find_one({"id": item["product_id"]})
            if product:
                unit_price = product["bulk_price"] if total_quantity >= 15 else product["base_price"]
                item["unit_price"] = unit_price
                item["total_price"] = unit_price * item["quantity"]
        
        # Update cart in database
        await database.carts.update_one(
            cart_filter,
            {"$set": {"items": cart["items"], "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Cart updated successfully"}
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: str,
    color: str,
    size: str,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_db),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    if current_user:
        cart_filter = {"user_id": current_user.id}
    else:
        session_id = get_session_id(request)
        cart_filter = {"session_id": session_id}
    
    cart = await database.carts.find_one(cart_filter)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart["items"] = [item for item in cart["items"] if not (
        item["product_id"] == product_id and 
        item["color"] == color and 
        item["size"] == size
    )]
    
    await database.carts.update_one(
        cart_filter,
        {"$set": {"items": cart["items"], "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Item removed from cart"}

@api_router.get("/products/{product_id}/stock")
async def get_product_stock(
    product_id: str,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get stock information for a specific product"""
    product = await database.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get stock information for all variants
    stock_info = {}
    for variant in product["variants"]:
        key = f"{variant['color']}-{variant['size']}"
        stock_info[key] = {
            "color": variant["color"],
            "size": variant["size"],
            "stock_quantity": variant["stock_quantity"],
            "sku": variant["sku"]
        }
    
    return {
        "product_id": product_id,
        "product_name": product["name"],
        "variants": stock_info
    }

# ============================================================================
# ORDER ROUTES
# ============================================================================

@api_router.post("/orders/calculate", response_model=OrderSummary)
async def calculate_order(
    items: List[CartItem],
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    subtotal = 0
    total_quantity = sum(item.quantity for item in items)
    is_bulk_order = total_quantity >= 15
    
    for item in items:
        product = await database.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        price = product["bulk_price"] if is_bulk_order else product["base_price"]
        subtotal += price * item.quantity
    
    tax_amount = subtotal * 0.18  # 18% GST
    shipping_amount = 0 if subtotal > 500 else 50  # Free shipping above ₹500
    total_amount = subtotal + tax_amount + shipping_amount
    
    return OrderSummary(
        subtotal=subtotal,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        total_amount=total_amount,
        is_bulk_order=is_bulk_order
    )

@api_router.post("/orders", response_model=Order)
async def create_order(
    order_data: OrderCreate,
    current_user: Optional[User] = Depends(get_current_user_db),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    # Calculate order totals
    subtotal = 0
    order_items = []
    total_quantity = sum(item.quantity for item in order_data.items)
    is_bulk_order = total_quantity >= 15
    
    for item in order_data.items:
        product = await database.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        # Check stock
        variant = next((v for v in product["variants"] if v["color"] == item.color and v["size"] == item.size), None)
        if not variant or variant["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        price = product["bulk_price"] if is_bulk_order else product["base_price"]
        total_price = price * item.quantity
        subtotal += total_price
        
        order_items.append(OrderItem(
            product_id=item.product_id,
            product_name=product["name"],
            color=item.color,
            size=item.size,
            quantity=item.quantity,
            unit_price=price,
            total_price=total_price
        ))
    
    tax_amount = subtotal * 0.18
    shipping_amount = 0 if subtotal > 500 else 50
    total_amount = subtotal + tax_amount + shipping_amount
    
    # Create shipping address
    shipping_address = Address(**order_data.shipping_address.dict(), user_id="")
    
    # Create order
    order = Order(
        email=order_data.email,
        phone=order_data.phone,
        items=order_items,
        subtotal=subtotal,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        total_amount=total_amount,
        shipping_address=shipping_address,
        billing_address=Address(**order_data.billing_address.dict(), user_id="") if order_data.billing_address else None,
        notes=order_data.notes
    )
    
    await database.orders.insert_one(order.dict())
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    current_user: Optional[User] = Depends(get_current_user_db),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user.is_admin:
        orders = await database.orders.find().sort("created_at", -1).to_list(length=100)
    else:
        orders = await database.orders.find({"user_id": current_user.id}).sort("created_at", -1).to_list(length=100)
    
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    database: AsyncIOMotorDatabase = Depends(get_database),
    current_user: Optional[User] = Depends(get_current_user_db)
):
    order = await database.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permissions
    if current_user and (current_user.is_admin or order["user_id"] == current_user.id):
        return Order(**order)
    elif not current_user:
        # Allow anonymous access with email verification could be added here
        return Order(**order)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

# ============================================================================
# PAYMENT ROUTES (RAZORPAY)
# ============================================================================

@api_router.post("/payment/create-order")
async def create_razorpay_order(
    checkout_request: CheckoutRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_db),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create Razorpay order for payment"""
    try:
        # Get cart items from current session
        if current_user:
            cart_filter = {"user_id": current_user.id}
        else:
            session_id = request.cookies.get("session_id")
            if not session_id:
                raise HTTPException(status_code=400, detail="No cart session found")
            cart_filter = {"session_id": session_id}
        
        cart = await database.carts.find_one(cart_filter)
        if not cart or not cart["items"]:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Calculate order total
        subtotal = 0
        total_quantity = sum(item["quantity"] for item in cart["items"])
        is_bulk_order = total_quantity >= 15
        
        order_items = []
        for item in cart["items"]:
            product = await database.products.find_one({"id": item["product_id"]})
            if not product:
                continue
            
            unit_price = product["bulk_price"] if is_bulk_order else product["base_price"]
            total_price = unit_price * item["quantity"]
            subtotal += total_price
            
            order_items.append({
                "product_id": item["product_id"],
                "product_name": product["name"],
                "color": item["color"],
                "size": item["size"],
                "quantity": item["quantity"],
                "unit_price": unit_price,
                "total_price": total_price
            })
        
        # Calculate taxes and shipping
        tax_amount = subtotal * 0.18  # 18% GST
        shipping_amount = 0 if subtotal > 500 else 50  # Free shipping above ₹500
        total_amount = subtotal + tax_amount + shipping_amount
        
        # Create order in our database first
        order_id = str(uuid.uuid4())
        receipt_id = f"order_{int(datetime.utcnow().timestamp())}"
        
        order_data = {
            "id": order_id,
            "user_id": current_user.id if current_user else None,
            "email": checkout_request.customer_email,
            "phone": checkout_request.customer_phone,
            "items": order_items,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "shipping_amount": shipping_amount,
            "total_amount": total_amount,
            "shipping_address": checkout_request.shipping_address.dict(),
            "billing_address": checkout_request.billing_address.dict() if checkout_request.billing_address else checkout_request.shipping_address.dict(),
            "status": "pending",
            "payment_status": "pending",
            "notes": checkout_request.notes,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": int(total_amount * 100),  # Amount in paise
            "currency": "INR",
            "receipt": receipt_id,
            "payment_capture": 1
        })
        
        # Update order with Razorpay details
        order_data["razorpay_order_id"] = razorpay_order["id"]
        order_data["razorpay_receipt"] = receipt_id
        
        # Save order to database
        await database.orders.insert_one(order_data)
        
        # Return order details for frontend
        return {
            "order_id": order_id,
            "razorpay_order_id": razorpay_order["id"],
            "amount": total_amount,
            "currency": "INR",
            "key_id": os.environ.get('RAZORPAY_KEY_ID'),
            "customer_details": {
                "name": checkout_request.customer_name,
                "email": checkout_request.customer_email,
                "contact": checkout_request.customer_phone
            },
            "order_details": {
                "items": order_items,
                "subtotal": subtotal,
                "tax_amount": tax_amount,
                "shipping_amount": shipping_amount,
                "total_amount": total_amount
            }
        }
        
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@api_router.post("/payment/verify")
async def verify_payment(
    verification: PaymentVerification,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Verify Razorpay payment signature"""
    try:
        # Verify payment signature
        generated_signature = hmac.new(
            os.environ.get('RAZORPAY_KEY_SECRET').encode(),
            f"{verification.razorpay_order_id}|{verification.razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != verification.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Find and update order
        order = await database.orders.find_one({"razorpay_order_id": verification.razorpay_order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status
        await database.orders.update_one(
            {"razorpay_order_id": verification.razorpay_order_id},
            {
                "$set": {
                    "payment_status": "completed",
                    "status": "confirmed",
                    "payment_id": verification.razorpay_payment_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Clear the cart after successful payment
        if order.get("user_id"):
            await database.carts.delete_one({"user_id": order["user_id"]})
        
        return {
            "status": "success",
            "order_id": order["id"],
            "payment_id": verification.razorpay_payment_id,
            "message": "Payment verified successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification failed")

@api_router.post("/payment/webhook")
async def razorpay_webhook(
    request: Request,
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Handle Razorpay webhooks"""
    try:
        # Get webhook signature
        signature = request.headers.get("X-Razorpay-Signature")
        if not signature:
            raise HTTPException(status_code=400, detail="Missing webhook signature")
        
        # Get request body
        body = await request.body()
        
        # Verify webhook signature (if webhook secret is configured)
        webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
        if webhook_secret:
            generated_signature = hmac.new(
                webhook_secret.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            
            if generated_signature != signature:
                raise HTTPException(status_code=400, detail="Invalid webhook signature")
        
        # Parse webhook payload
        payload = json.loads(body.decode())
        event = payload.get("event")
        
        if event == "payment.captured":
            # Payment was captured successfully
            payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_data.get("order_id")
            payment_id = payment_data.get("id")
            
            if order_id and payment_id:
                await database.orders.update_one(
                    {"razorpay_order_id": order_id},
                    {
                        "$set": {
                            "payment_status": "completed",
                            "status": "confirmed",
                            "payment_id": payment_id,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
        
        elif event == "payment.failed":
            # Payment failed
            payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_data.get("order_id")
            
            if order_id:
                await database.orders.update_one(
                    {"razorpay_order_id": order_id},
                    {
                        "$set": {
                            "payment_status": "failed",
                            "status": "cancelled",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
        
        return {"status": "processed"}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# Include all routers
app.include_router(api_router)
app.include_router(info_router)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
