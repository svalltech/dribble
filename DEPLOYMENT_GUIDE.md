# DRIBBLE E-Commerce Platform - Deployment Guide

## 🚀 Complete E-Commerce Platform Ready for Production

### Platform Overview
DRIBBLE is a fully functional e-commerce platform for sports apparel wholesale business with:

- ✅ Complete React frontend with shopping cart, user authentication
- ✅ Full FastAPI backend with MongoDB database
- ✅ Stripe payment gateway integration
- ✅ Admin panel for product/order management
- ✅ Inventory management with stock tracking
- ✅ Bulk pricing for 15+ pieces
- ✅ Responsive design for all devices
- ✅ Production-ready with comprehensive security

## 🔧 Pre-Deployment Setup

### 1. Domain Configuration
```bash
# Update domain in frontend .env
REACT_APP_BACKEND_URL=https://www.dribble-sports.com
```

### 2. Required API Keys
Before going live, you MUST obtain and configure these API keys:

#### Stripe Payment Gateway
```bash
# Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

#### Email Configuration (Optional)
```bash
# For order confirmation emails
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

#### Security Configuration
```bash
# Change default JWT secret
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-2025
```

### 3. Database Setup
```bash
# MongoDB connection (update as needed)
MONGO_URL=mongodb://localhost:27017
DB_NAME=dribble_ecommerce
```

## 📦 Quick Deployment Steps

### Step 1: Update Environment Variables
```bash
# Backend (.env)
MONGO_URL="your_mongodb_connection_string"
DB_NAME="dribble_ecommerce"
JWT_SECRET_KEY="your-secure-jwt-secret"
STRIPE_SECRET_KEY="sk_live_your_stripe_secret"
STRIPE_PUBLIC_KEY="pk_live_your_stripe_public"
EMAIL_FROM="orders@dribble-sports.com"

# Frontend (.env)
REACT_APP_BACKEND_URL=https://www.dribble-sports.com
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
cd /app/backend
pip install -r requirements.txt

# Frontend dependencies  
cd /app/frontend
yarn install
```

### Step 3: Seed Database
```bash
cd /app/backend
python seed_data.py
```

### Step 4: Build Frontend
```bash
cd /app/frontend
yarn build
```

### Step 5: Start Services
```bash
# Development
sudo supervisorctl restart all

# Production (with process manager)
pm2 start ecosystem.config.js
```

## 🔐 Default Admin Access

**Admin Panel Access:**
- Email: `admin@dribble-sports.com`
- Password: `admin123`

**Test User:**
- Email: `test@dribble-sports.com`  
- Password: `test123`

⚠️ **IMPORTANT:** Change default passwords before going live!

## 💳 Payment Gateway Configuration

### Stripe Integration
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard > Developers > API Keys
3. Configure webhook endpoints for order updates
4. Update environment variables with live keys

### Supported Payment Methods
- Credit/Debit Cards (Visa, Mastercard, Amex)
- UPI Payments (India)
- Net Banking
- Digital Wallets

## 🛡️ Security Checklist

- [ ] Update JWT secret key
- [ ] Change default admin password
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Enable CORS for production domain only
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

## 📊 Features Overview

### Customer Features
- ✅ Product browsing with categories
- ✅ Advanced product search and filters
- ✅ Shopping cart with session persistence
- ✅ User registration and authentication
- ✅ Bulk pricing (15+ pieces get discounted rates)
- ✅ Secure checkout with multiple payment options
- ✅ Order tracking and history
- ✅ Responsive mobile design

### Admin Features
- ✅ Complete dashboard with analytics
- ✅ Product management (CRUD operations)
- ✅ Inventory tracking and low stock alerts
- ✅ Order management and status updates
- ✅ Customer management
- ✅ Sales analytics and reporting
- ✅ Payment transaction monitoring

### Technical Features
- ✅ RESTful API with comprehensive endpoints
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Database indexing for performance
- ✅ Error handling and logging
- ✅ API documentation (FastAPI auto-docs)
- ✅ Modular architecture for scalability

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/{id}` - Update product (Admin)

### Cart & Orders
- `GET /api/cart` - Get cart contents
- `POST /api/cart/add` - Add item to cart
- `DELETE /api/cart/remove/{id}` - Remove from cart
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders

### Payments
- `POST /api/payments/stripe/create-session` - Create payment session
- `GET /api/payments/stripe/status/{id}` - Check payment status

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/analytics/sales` - Sales analytics
- `GET /api/admin/products/low-stock` - Low stock alerts

## 🔧 Customization Guide

### Adding New Product Categories
```python
# In seed_data.py or via API
new_category = Category(
    name="New Category",
    description="Category description",
    image="category_image_url",
    sort_order=6
)
```

### Modifying Pricing Rules
```python
# In server.py - calculate_order function
# Change bulk pricing threshold (currently 15+ pieces)
is_bulk_order = total_quantity >= 15  # Modify this number
```

### Custom Email Templates
```python
# Add email templates in backend/templates/
# Configure SMTP settings in .env
# Implement email sending in order processing
```

## 📈 Performance Optimization

### Database Indexing
```javascript
// MongoDB indexes for performance
db.products.createIndex({ "name": "text", "description": "text" })
db.products.createIndex({ "category": 1, "is_active": 1 })
db.orders.createIndex({ "user_id": 1, "created_at": -1 })
```

### Caching Strategy
- Implement Redis for session storage
- Cache product listings and categories
- Use CDN for static assets

## 🔍 Monitoring & Analytics

### Built-in Analytics
- Sales dashboard with charts
- Product performance tracking
- Customer analytics
- Revenue reports

### Integration Options
- Google Analytics for web traffic
- Stripe Analytics for payment insights
- Custom reporting dashboard

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check MongoDB status
sudo systemctl status mongod
# Restart if needed
sudo systemctl restart mongod
```

**Payment Gateway Errors:**
- Verify API keys are correct
- Check webhook configurations
- Ensure test/live mode consistency

**Frontend Build Issues:**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Database backups (daily)
- [ ] Security updates (weekly)
- [ ] Performance monitoring
- [ ] Log file rotation
- [ ] SSL certificate renewal

### Support Contacts
- Technical Support: tech@dribble-sports.com
- Business Support: orders@dribble-sports.com
- Emergency: +91 98765 43210

---

## 🎉 Ready to Launch!

Your DRIBBLE e-commerce platform is fully configured and ready for production. Follow the deployment steps above and you'll be selling within minutes!

**Test thoroughly before going live with real payments and customers.**

Good luck with your sports apparel business! 🏆
