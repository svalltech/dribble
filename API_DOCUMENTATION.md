# DRIBBLE E-Commerce Platform - API Documentation

## Base URL
```
Production: https://www.dribble-sports.com/api
Development: http://localhost:8000/api
```

## Authentication
All authenticated endpoints require Bearer token in header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this structure:
```json
{
  "data": {},
  "message": "Success message",
  "error": null,
  "status_code": 200
}
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+91 9876543210"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+91 9876543210",
    "is_active": true,
    "is_admin": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## 👕 Product Endpoints

### List Products
```http
GET /products?category=Oversized&search=cotton&limit=20
```

**Query Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search in name/description
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
[
  {
    "id": "product_id",
    "name": "Oversized Sports T-shirt 210gsm",
    "description": "Premium quality oversized t-shirt...",
    "category": "Oversized T-shirts",
    "base_price": 319.0,
    "bulk_price": 279.0,
    "gsm": "210gsm",
    "material": "100% Cotton Terry",
    "variants": [
      {
        "color": "Black",
        "size": "M",
        "stock_quantity": 100,
        "sku": "DRB-OS-210-BLK-M"
      }
    ],
    "images": ["image_url_1", "image_url_2"],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### Get Product Details
```http
GET /products/{product_id}
```

### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "category": "T-Shirts",
  "base_price": 299.0,
  "bulk_price": 249.0,
  "gsm": "180gsm",
  "material": "100% Cotton",
  "variants": [
    {
      "color": "Black",
      "size": "M",
      "stock_quantity": 50,
      "sku": "PROD-001-BLK-M"
    }
  ],
  "images": ["image_url"]
}
```

### Update Product (Admin Only)
```http
PUT /products/{product_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "base_price": 349.0
}
```

---

## 📂 Category Endpoints

### List Categories
```http
GET /categories
```

**Response:**
```json
[
  {
    "id": "category_id",
    "name": "Oversized T-shirts",
    "description": "Premium oversized t-shirts for sports",
    "image": "category_image_url",
    "is_active": true,
    "sort_order": 1
  }
]
```

### Create Category (Admin Only)
```http
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Category",
  "description": "Category description",
  "image": "image_url",
  "sort_order": 5
}
```

---

## 🛒 Cart Endpoints

### Get Cart
```http
GET /cart
Authorization: Bearer <token> (optional)
```

**Response:**
```json
{
  "items": [
    {
      "product_id": "product_id",
      "product_name": "Product Name",
      "color": "Black",
      "size": "M",
      "quantity": 2,
      "unit_price": 279.0,
      "total_price": 558.0,
      "product_image": "image_url"
    }
  ],
  "total": 558.0
}
```

### Add to Cart
```http
POST /cart/add
Authorization: Bearer <token> (optional)
Content-Type: application/json

{
  "product_id": "product_id",
  "color": "Black",
  "size": "M",
  "quantity": 2
}
```

### Remove from Cart
```http
DELETE /cart/remove/{product_id}?color=Black&size=M
Authorization: Bearer <token> (optional)
```

---

## 📦 Order Endpoints

### Calculate Order Total
```http
POST /orders/calculate
Content-Type: application/json

{
  "items": [
    {
      "product_id": "product_id",
      "color": "Black",
      "size": "M",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "subtotal": 558.0,
  "tax_amount": 100.44,
  "shipping_amount": 0,
  "total_amount": 658.44,
  "is_bulk_order": false
}
```

### Create Order
```http
POST /orders
Content-Type: application/json

{
  "email": "customer@example.com",
  "phone": "+91 9876543210",
  "items": [
    {
      "product_id": "product_id",
      "color": "Black",
      "size": "M",
      "quantity": 2
    }
  ],
  "shipping_address": {
    "full_name": "John Doe",
    "phone": "+91 9876543210",
    "address_line_1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India"
  },
  "notes": "Special delivery instructions"
}
```

### List Orders
```http
GET /orders
Authorization: Bearer <token>
```

### Get Order Details
```http
GET /orders/{order_id}
Authorization: Bearer <token> (optional)
```

---

## 💳 Payment Endpoints

### Create Stripe Payment Session
```http
POST /payments/stripe/create-session
Content-Type: application/json

{
  "order_id": "order_id",
  "amount": 658.44,
  "currency": "INR"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_stripe_session_id"
}
```

### Check Payment Status
```http
GET /payments/stripe/status/{session_id}
```

**Response:**
```json
{
  "status": "complete",
  "payment_status": "paid",
  "amount": 658.44,
  "currency": "INR",
  "order_id": "order_id"
}
```

### List Payment Transactions
```http
GET /payments/transactions
Authorization: Bearer <token>
```

---

## 👑 Admin Endpoints

### Dashboard Statistics
```http
GET /admin/dashboard
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "orders": {
    "total": 1250,
    "this_week": 45,
    "this_month": 180
  },
  "revenue": {
    "total": 2500000.0,
    "this_week": 125000.0,
    "average_order_value": 2000.0
  },
  "products": {
    "total": 50,
    "low_stock": 5,
    "top_selling": [
      {
        "_id": "product_id",
        "product_name": "Product Name",
        "total_sold": 150,
        "revenue": 41850.0
      }
    ]
  },
  "customers": {
    "total": 850,
    "new_this_week": 25
  }
}
```

### Sales Analytics
```http
GET /admin/analytics/sales?days=30
Authorization: Bearer <admin_token>
```

### List All Products (Admin)
```http
GET /admin/products?include_inactive=true
Authorization: Bearer <admin_token>
```

### Low Stock Products
```http
GET /admin/products/low-stock?threshold=5
Authorization: Bearer <admin_token>
```

### Update Product Stock
```http
PUT /admin/products/{product_id}/stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "color": "Black",
  "size": "M",
  "new_quantity": 100
}
```

### List All Orders (Admin)
```http
GET /admin/orders?status=pending&limit=50
Authorization: Bearer <admin_token>
```

### Update Order Status
```http
PUT /admin/orders/{order_id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "new_status": "shipped"
}
```

### List All Users (Admin)
```http
GET /admin/users?limit=100
Authorization: Bearer <admin_token>
```

### Update User Status
```http
PUT /admin/users/{user_id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "is_active": false
}
```

---

## 📊 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Invalid input format |
| 500 | Internal Server Error |

## 🔄 Status Enums

### Order Status
- `pending` - Order created, awaiting payment
- `confirmed` - Payment received
- `processing` - Order being prepared
- `shipped` - Order dispatched
- `delivered` - Order delivered
- `cancelled` - Order cancelled

### Payment Status
- `pending` - Payment initiated
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

### Product Sizes
- `XS`, `S`, `M`, `L`, `XL`, `XXL`

---

## 🚀 Rate Limits
- **General API**: 100 requests per minute
- **Authentication**: 5 login attempts per minute
- **Payment**: 10 payment attempts per minute

## 📝 Notes
- All timestamps are in UTC ISO 8601 format
- All prices are in Indian Rupees (INR)
- Bulk pricing applies to orders of 15+ pieces of any combination
- Free shipping on orders above ₹500
- 18% GST is applied to all orders

For more details, visit the interactive API documentation at:
`https://www.dribble-sports.com/docs` (FastAPI auto-generated docs)
