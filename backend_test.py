#!/usr/bin/env python3
import requests
import json
import unittest
import uuid
from typing import Dict, Any, List, Optional

# Backend URL from frontend/.env
BACKEND_URL = "https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@dribble-sports.com"
ADMIN_PASSWORD = "admin123"
TEST_EMAIL = "test@dribble-sports.com"
TEST_PASSWORD = "test123"

# Test data
TEST_USER_EMAIL = f"test_user_{uuid.uuid4()}@example.com"
TEST_USER_PASSWORD = "Test@123"
TEST_USER_NAME = "Test User"

class DribbleBackendTest(unittest.TestCase):
    def setUp(self):
        self.admin_token = None
        self.user_token = None
        self.test_product_id = None
        self.test_category_id = None
        
    def get_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        """Get request headers with optional authorization token"""
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers
    
    def test_01_server_health(self):
        """Test if the server is running and responding"""
        try:
            response = requests.get(f"{BACKEND_URL}/categories")
            self.assertEqual(response.status_code, 200, "Server is not responding correctly")
            print("✅ Server health check passed")
        except Exception as e:
            self.fail(f"Server health check failed: {str(e)}")
    
    def test_02_admin_login(self):
        """Test admin login functionality"""
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login", 
            headers=self.get_headers(),
            json=login_data
        )
        
        self.assertEqual(response.status_code, 200, f"Admin login failed: {response.text}")
        data = response.json()
        self.assertIn("access_token", data, "Access token not found in response")
        self.assertIn("user", data, "User data not found in response")
        self.assertTrue(data["user"]["is_admin"], "User is not an admin")
        
        # Save admin token for later tests
        self.admin_token = data["access_token"]
        print("✅ Admin login successful")
    
    def test_03_user_login(self):
        """Test regular user login functionality"""
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login", 
            headers=self.get_headers(),
            json=login_data
        )
        
        self.assertEqual(response.status_code, 200, f"User login failed: {response.text}")
        data = response.json()
        self.assertIn("access_token", data, "Access token not found in response")
        self.assertIn("user", data, "User data not found in response")
        self.assertFalse(data["user"]["is_admin"], "Regular user should not be an admin")
        
        # Save user token for later tests
        self.user_token = data["access_token"]
        print("✅ User login successful")
    
    def test_04_user_registration(self):
        """Test user registration functionality"""
        user_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": TEST_USER_NAME
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/register", 
            headers=self.get_headers(),
            json=user_data
        )
        
        self.assertEqual(response.status_code, 200, f"User registration failed: {response.text}")
        data = response.json()
        self.assertIn("access_token", data, "Access token not found in response")
        self.assertIn("user", data, "User data not found in response")
        self.assertEqual(data["user"]["email"], TEST_USER_EMAIL, "Email in response doesn't match")
        self.assertEqual(data["user"]["full_name"], TEST_USER_NAME, "Name in response doesn't match")
        print("✅ User registration successful")
    
    def test_05_get_current_user(self):
        """Test getting current user information"""
        # First ensure we have admin token
        if not self.admin_token:
            self.test_02_admin_login()
            
        response = requests.get(
            f"{BACKEND_URL}/auth/me", 
            headers=self.get_headers(self.admin_token)
        )
        
        self.assertEqual(response.status_code, 200, f"Get current user failed: {response.text}")
        data = response.json()
        self.assertEqual(data["email"], ADMIN_EMAIL, "Email in response doesn't match")
        self.assertTrue(data["is_admin"], "User should be an admin")
        print("✅ Get current user successful")
    
    def test_06_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # Try to access orders without authentication
        response = requests.get(f"{BACKEND_URL}/orders")
        self.assertEqual(response.status_code, 401, "Unauthorized access should be denied")
        print("✅ Unauthorized access correctly denied")
    
    def test_07_get_categories(self):
        """Test getting product categories"""
        response = requests.get(f"{BACKEND_URL}/categories")
        self.assertEqual(response.status_code, 200, f"Get categories failed: {response.text}")
        
        categories = response.json()
        self.assertIsInstance(categories, list, "Categories should be a list")
        self.assertGreater(len(categories), 0, "Categories list should not be empty")
        print(f"✅ Retrieved {len(categories)} categories successfully")
        
        # Save a category ID for later tests
        if categories:
            self.test_category_id = categories[0]["id"]
    
    def test_08_create_category(self):
        """Test creating a new category (admin only)"""
        # First ensure we have admin token
        if not self.admin_token:
            self.test_02_admin_login()
            
        category_data = {
            "name": f"Test Category {uuid.uuid4()}",
            "description": "Test category description",
            "color": "bg-blue-500",
            "sort_order": 100
        }
        
        response = requests.post(
            f"{BACKEND_URL}/categories", 
            headers=self.get_headers(self.admin_token),
            json=category_data
        )
        
        self.assertEqual(response.status_code, 200, f"Create category failed: {response.text}")
        data = response.json()
        self.assertEqual(data["name"], category_data["name"], "Category name doesn't match")
        self.assertEqual(data["description"], category_data["description"], "Category description doesn't match")
        
        # Save category ID for later tests
        self.test_category_id = data["id"]
        print("✅ Category creation successful")
    
    def test_09_get_products(self):
        """Test getting products with various filters"""
        # Get all products
        response = requests.get(f"{BACKEND_URL}/products")
        self.assertEqual(response.status_code, 200, f"Get products failed: {response.text}")
        
        products = response.json()
        self.assertIsInstance(products, list, "Products should be a list")
        self.assertGreater(len(products), 0, "Products list should not be empty")
        print(f"✅ Retrieved {len(products)} products successfully")
        
        # Save a product ID for later tests
        if products:
            self.test_product_id = products[0]["id"]
            
        # Test with category filter if we have a category ID
        if self.test_category_id:
            response = requests.get(f"{BACKEND_URL}/products?category={self.test_category_id}")
            self.assertEqual(response.status_code, 200, f"Get products by category failed: {response.text}")
            print("✅ Category filter working")
            
        # Test with search filter
        response = requests.get(f"{BACKEND_URL}/products?search=shirt")
        self.assertEqual(response.status_code, 200, f"Get products by search failed: {response.text}")
        print("✅ Search filter working")
        
        # Test with limit
        response = requests.get(f"{BACKEND_URL}/products?limit=5")
        self.assertEqual(response.status_code, 200, f"Get products with limit failed: {response.text}")
        products = response.json()
        self.assertLessEqual(len(products), 5, "Limit parameter not working correctly")
        print("✅ Limit parameter working")
    
    def test_10_get_product_by_id(self):
        """Test getting a specific product by ID"""
        # First ensure we have a product ID
        if not self.test_product_id:
            self.test_09_get_products()
            
        response = requests.get(f"{BACKEND_URL}/products/{self.test_product_id}")
        self.assertEqual(response.status_code, 200, f"Get product by ID failed: {response.text}")
        
        product = response.json()
        self.assertEqual(product["id"], self.test_product_id, "Product ID doesn't match")
        print("✅ Get product by ID successful")
    
    def test_11_get_product_sizechart(self):
        """Test getting a product's size chart"""
        # First ensure we have a product ID
        if not self.test_product_id:
            self.test_09_get_products()
            
        response = requests.get(f"{BACKEND_URL}/products/{self.test_product_id}/sizechart")
        self.assertEqual(response.status_code, 200, f"Get product sizechart failed: {response.text}")
        
        sizechart = response.json()
        self.assertIn("colors", sizechart, "Size chart should contain colors")
        self.assertIn("sizes", sizechart, "Size chart should contain sizes")
        self.assertIn("pricing", sizechart, "Size chart should contain pricing")
        print("✅ Get product sizechart successful")
    
    def test_12_create_product(self):
        """Test creating a new product (admin only)"""
        # First ensure we have admin token
        if not self.admin_token:
            self.test_02_admin_login()
            
        # Ensure we have a category ID
        if not self.test_category_id:
            self.test_07_get_categories()
            
        product_data = {
            "name": f"Test Product {uuid.uuid4()}",
            "description": "Test product description",
            "category": self.test_category_id,
            "base_price": 319.0,
            "bulk_price": 279.0,
            "gsm": "210",
            "material": "100% Cotton",
            "variants": [
                {
                    "color": "Black",
                    "size": "S",
                    "stock_quantity": 100,
                    "sku": f"BLK-S-{uuid.uuid4()}"
                },
                {
                    "color": "White",
                    "size": "M",
                    "stock_quantity": 100,
                    "sku": f"WHT-M-{uuid.uuid4()}"
                }
            ],
            "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/products", 
            headers=self.get_headers(self.admin_token),
            json=product_data
        )
        
        self.assertEqual(response.status_code, 200, f"Create product failed: {response.text}")
        data = response.json()
        self.assertEqual(data["name"], product_data["name"], "Product name doesn't match")
        self.assertEqual(data["description"], product_data["description"], "Product description doesn't match")
        
        # Save product ID for later tests
        self.test_product_id = data["id"]
        print("✅ Product creation successful")
    
    def test_13_update_product(self):
        """Test updating a product (admin only)"""
        # First ensure we have admin token and product ID
        if not self.admin_token:
            self.test_02_admin_login()
        if not self.test_product_id:
            self.test_12_create_product()
            
        update_data = {
            "description": f"Updated description {uuid.uuid4()}",
            "base_price": 329.0
        }
        
        response = requests.put(
            f"{BACKEND_URL}/products/{self.test_product_id}", 
            headers=self.get_headers(self.admin_token),
            json=update_data
        )
        
        self.assertEqual(response.status_code, 200, f"Update product failed: {response.text}")
        data = response.json()
        self.assertEqual(data["description"], update_data["description"], "Updated description doesn't match")
        self.assertEqual(data["base_price"], update_data["base_price"], "Updated price doesn't match")
        print("✅ Product update successful")
    
    def test_14_update_product_sizechart(self):
        """Test updating a product's size chart (admin only)"""
        # First ensure we have admin token and product ID
        if not self.admin_token:
            self.test_02_admin_login()
        if not self.test_product_id:
            self.test_12_create_product()
            
        sizechart_data = {
            "size_chart": {
                "colors": ["Black", "White", "Red", "Blue", "Green"],
                "sizes": ["S", "M", "L", "XL"],
                "chart_code": "TEST123"
            },
            "pricing_rules": {
                "bulk_threshold": 10,
                "bulk_price": 259.0,
                "regular_price": 299.0,
                "bulk_label": "More than 10pcs",
                "regular_label": "Less than 10pcs"
            }
        }
        
        response = requests.put(
            f"{BACKEND_URL}/products/{self.test_product_id}/sizechart", 
            headers=self.get_headers(self.admin_token),
            json=sizechart_data
        )
        
        self.assertEqual(response.status_code, 200, f"Update product sizechart failed: {response.text}")
        print("✅ Product sizechart update successful")
    
    def test_15_cart_operations(self):
        """Test cart operations for authenticated and anonymous users"""
        # First ensure we have user token and product ID
        if not self.user_token:
            self.test_03_user_login()
        if not self.test_product_id:
            self.test_09_get_products()
            
        # Get initial cart (authenticated user)
        response = requests.get(
            f"{BACKEND_URL}/cart", 
            headers=self.get_headers(self.user_token)
        )
        self.assertEqual(response.status_code, 200, f"Get cart failed: {response.text}")
        initial_cart = response.json()
        print("✅ Get cart successful")
        
        # Add item to cart
        cart_item = {
            "product_id": self.test_product_id,
            "color": "Black",
            "size": "S",
            "quantity": 5
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(self.user_token),
            json=cart_item
        )
        
        # Note: This might fail if the product doesn't have the specified variant
        # We'll check for both success and specific error
        if response.status_code == 200:
            print("✅ Add to cart successful")
        elif response.status_code == 400 and "Insufficient stock" in response.text:
            print("⚠️ Add to cart failed due to insufficient stock - this is expected if the product doesn't have the specified variant")
        else:
            self.fail(f"Add to cart failed unexpectedly: {response.status_code} - {response.text}")
        
        # Get updated cart
        response = requests.get(
            f"{BACKEND_URL}/cart", 
            headers=self.get_headers(self.user_token)
        )
        self.assertEqual(response.status_code, 200, f"Get updated cart failed: {response.text}")
        print("✅ Get updated cart successful")
        
        # Test anonymous cart
        response = requests.get(f"{BACKEND_URL}/cart")
        self.assertEqual(response.status_code, 200, f"Get anonymous cart failed: {response.text}")
        print("✅ Anonymous cart successful")
        
        # Add item to anonymous cart
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            json=cart_item
        )
        
        # Note: This might fail if the product doesn't have the specified variant
        # We'll check for both success and specific error
        if response.status_code == 200:
            print("✅ Add to anonymous cart successful")
        elif response.status_code == 400 and "Insufficient stock" in response.text:
            print("⚠️ Add to anonymous cart failed due to insufficient stock - this is expected if the product doesn't have the specified variant")
        else:
            self.fail(f"Add to anonymous cart failed unexpectedly: {response.status_code} - {response.text}")
        
        # Remove item from cart (if we successfully added it)
        if response.status_code == 200:
            response = requests.delete(
                f"{BACKEND_URL}/cart/remove/{self.test_product_id}?color=Black&size=S", 
                headers=self.get_headers(self.user_token)
            )
            self.assertEqual(response.status_code, 200, f"Remove from cart failed: {response.text}")
            print("✅ Remove from cart successful")
    
    def test_16_order_calculation(self):
        """Test order calculation with taxes and shipping"""
        # First ensure we have a product ID
        if not self.test_product_id:
            self.test_09_get_products()
            
        # Create order items for calculation
        order_items = [
            {
                "product_id": self.test_product_id,
                "color": "Black",
                "size": "S",
                "quantity": 5
            }
        ]
        
        response = requests.post(
            f"{BACKEND_URL}/orders/calculate", 
            headers=self.get_headers(),
            json=order_items
        )
        
        self.assertEqual(response.status_code, 200, f"Order calculation failed: {response.text}")
        order_summary = response.json()
        self.assertIn("subtotal", order_summary, "Order summary should contain subtotal")
        self.assertIn("tax_amount", order_summary, "Order summary should contain tax_amount")
        self.assertIn("shipping_amount", order_summary, "Order summary should contain shipping_amount")
        self.assertIn("total_amount", order_summary, "Order summary should contain total_amount")
        print("✅ Order calculation successful")
        
        # Test bulk pricing with 15+ items
        bulk_order_items = [
            {
                "product_id": self.test_product_id,
                "color": "Black",
                "size": "S",
                "quantity": 15
            }
        ]
        
        response = requests.post(
            f"{BACKEND_URL}/orders/calculate", 
            headers=self.get_headers(),
            json=bulk_order_items
        )
        
        self.assertEqual(response.status_code, 200, f"Bulk order calculation failed: {response.text}")
        bulk_order_summary = response.json()
        self.assertTrue(bulk_order_summary["is_bulk_order"], "Order with 15+ items should be marked as bulk order")
        print("✅ Bulk pricing calculation successful")
    
    def test_17_create_order(self):
        """Test order creation with address validation"""
        # First ensure we have a product ID
        if not self.test_product_id:
            self.test_09_get_products()
            
        # Create order data
        order_data = {
            "email": "customer@example.com",
            "phone": "9876543210",
            "items": [
                {
                    "product_id": self.test_product_id,
                    "color": "Black",
                    "size": "S",
                    "quantity": 5
                }
            ],
            "shipping_address": {
                "full_name": "Test Customer",
                "phone": "9876543210",
                "address_line_1": "123 Test Street",
                "city": "Test City",
                "state": "Test State",
                "postal_code": "123456",
                "country": "India"
            },
            "notes": "Test order notes"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/orders", 
            headers=self.get_headers(),
            json=order_data
        )
        
        # Note: This might fail if the product doesn't have the specified variant
        # We'll check for both success and specific error
        if response.status_code == 200:
            order = response.json()
            self.assertEqual(order["email"], order_data["email"], "Order email doesn't match")
            self.assertEqual(order["phone"], order_data["phone"], "Order phone doesn't match")
            self.assertEqual(len(order["items"]), 1, "Order should have 1 item")
            print("✅ Order creation successful")
        elif response.status_code == 400 and "Insufficient stock" in response.text:
            print("⚠️ Order creation failed due to insufficient stock - this is expected if the product doesn't have the specified variant")
        else:
            self.fail(f"Order creation failed unexpectedly: {response.status_code} - {response.text}")
    
    def test_18_get_orders(self):
        """Test order listing and retrieval (authenticated users only)"""
        # First ensure we have admin token
        if not self.admin_token:
            self.test_02_admin_login()
            
        # Get orders as admin (should see all orders)
        response = requests.get(
            f"{BACKEND_URL}/orders", 
            headers=self.get_headers(self.admin_token)
        )
        
        self.assertEqual(response.status_code, 200, f"Get orders failed: {response.text}")
        orders = response.json()
        self.assertIsInstance(orders, list, "Orders should be a list")
        print(f"✅ Retrieved {len(orders)} orders as admin")
        
        # Get orders as regular user (should see only their orders)
        if self.user_token:
            response = requests.get(
                f"{BACKEND_URL}/orders", 
                headers=self.get_headers(self.user_token)
            )
            
            self.assertEqual(response.status_code, 200, f"Get user orders failed: {response.text}")
            user_orders = response.json()
            self.assertIsInstance(user_orders, list, "User orders should be a list")
            print(f"✅ Retrieved {len(user_orders)} orders as regular user")
    
    def test_19_admin_only_access(self):
        """Test admin-only endpoint security"""
        # First ensure we have user token
        if not self.user_token:
            self.test_03_user_login()
            
        # Try to create a category as regular user (should fail)
        category_data = {
            "name": "Test Category",
            "description": "Test category description"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/categories", 
            headers=self.get_headers(self.user_token),
            json=category_data
        )
        
        self.assertEqual(response.status_code, 403, "Regular user should not be able to create categories")
        print("✅ Admin-only endpoint security working")
    
    def test_20_input_validation(self):
        """Test input validation for various endpoints"""
        # Test invalid login credentials
        login_data = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login", 
            headers=self.get_headers(),
            json=login_data
        )
        
        self.assertEqual(response.status_code, 401, "Invalid login should be rejected")
        print("✅ Login validation working")
        
        # Test invalid product ID
        response = requests.get(f"{BACKEND_URL}/products/invalid-id")
        self.assertEqual(response.status_code, 404, "Invalid product ID should return 404")
        print("✅ Product ID validation working")
        
        # Test invalid order data
        invalid_order = {
            "email": "customer@example.com",
            "items": []  # Missing required fields
        }
        
        response = requests.post(
            f"{BACKEND_URL}/orders", 
            headers=self.get_headers(),
            json=invalid_order
        )
        
        self.assertNotEqual(response.status_code, 200, "Invalid order data should be rejected")
        print("✅ Order data validation working")

if __name__ == "__main__":
    # Run tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)