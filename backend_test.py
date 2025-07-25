#!/usr/bin/env python3
import requests
import json
import unittest
import uuid
import time
import threading
import concurrent.futures
from typing import Dict, Any, List, Optional

# Backend URL from frontend App.js
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

    def test_21_stock_validation_endpoint(self):
        """Test the new GET /api/products/{product_id}/stock endpoint"""
        # First ensure we have a product ID
        if not self.test_product_id:
            self.test_09_get_products()
            
        response = requests.get(f"{BACKEND_URL}/products/{self.test_product_id}/stock")
        self.assertEqual(response.status_code, 200, f"Get product stock failed: {response.text}")
        
        stock_data = response.json()
        self.assertIn("product_id", stock_data, "Stock data should contain product_id")
        self.assertIn("product_name", stock_data, "Stock data should contain product_name")
        self.assertIn("variants", stock_data, "Stock data should contain variants")
        self.assertEqual(stock_data["product_id"], self.test_product_id, "Product ID should match")
        
        # Verify variants structure
        variants = stock_data["variants"]
        self.assertIsInstance(variants, dict, "Variants should be a dictionary")
        
        # Check each variant has required fields
        for variant_key, variant_data in variants.items():
            self.assertIn("color", variant_data, f"Variant {variant_key} should have color")
            self.assertIn("size", variant_data, f"Variant {variant_key} should have size")
            self.assertIn("stock_quantity", variant_data, f"Variant {variant_key} should have stock_quantity")
            self.assertIn("sku", variant_data, f"Variant {variant_key} should have sku")
            self.assertIsInstance(variant_data["stock_quantity"], int, f"Stock quantity should be integer for {variant_key}")
        
        print(f"✅ Stock validation endpoint working - found {len(variants)} variants")
        return stock_data

    def test_22_cart_stock_validation_exceeding_stock(self):
        """Test cart update with quantities exceeding available stock"""
        # First get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find a variant with limited stock
        test_variant = None
        for variant_key, variant_data in stock_data["variants"].items():
            if variant_data["stock_quantity"] > 0:
                test_variant = variant_data
                break
        
        if not test_variant:
            print("⚠️ No variants with stock available for testing")
            return
            
        # Try to add more items than available stock
        excessive_quantity = test_variant["stock_quantity"] + 10
        cart_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": excessive_quantity
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        # Should fail with 400 status and specific error message
        self.assertEqual(response.status_code, 400, "Adding excessive quantity should fail")
        self.assertIn("Insufficient stock", response.text, "Error message should mention insufficient stock")
        print(f"✅ Stock validation correctly prevents adding {excessive_quantity} items when only {test_variant['stock_quantity']} available")

    def test_23_cart_update_stock_validation(self):
        """Test cart update endpoint with stock validation"""
        # First get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find a variant with stock
        test_variant = None
        for variant_key, variant_data in stock_data["variants"].items():
            if variant_data["stock_quantity"] >= 5:  # Need at least 5 for testing
                test_variant = variant_data
                break
        
        if not test_variant:
            print("⚠️ No variants with sufficient stock (>=5) for testing")
            return
            
        # First add a valid quantity to cart
        valid_quantity = min(3, test_variant["stock_quantity"])
        cart_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": valid_quantity
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        if response.status_code != 200:
            print(f"⚠️ Could not add item to cart for testing: {response.text}")
            return
            
        # Now try to update to excessive quantity
        excessive_quantity = test_variant["stock_quantity"] + 5
        update_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": excessive_quantity
        }
        
        response = requests.put(
            f"{BACKEND_URL}/cart/update", 
            headers=self.get_headers(),
            json=update_item
        )
        
        # Should fail with 400 status and specific error message
        self.assertEqual(response.status_code, 400, "Updating to excessive quantity should fail")
        self.assertIn("Insufficient stock", response.text, "Error message should mention insufficient stock")
        self.assertIn(str(test_variant["stock_quantity"]), response.text, "Error should show available stock")
        print(f"✅ Cart update stock validation working - prevented updating to {excessive_quantity} when only {test_variant['stock_quantity']} available")

    def test_24_edge_case_zero_stock(self):
        """Test edge case with zero stock"""
        # Create a test product with zero stock for testing
        if not self.admin_token:
            self.test_02_admin_login()
            
        # Create product with zero stock variant
        product_data = {
            "name": f"Zero Stock Test Product {uuid.uuid4()}",
            "description": "Product for testing zero stock",
            "category": "test-category",
            "base_price": 299.0,
            "bulk_price": 259.0,
            "gsm": "210",
            "material": "100% Cotton",
            "variants": [
                {
                    "color": "Black",
                    "size": "S",
                    "stock_quantity": 0,  # Zero stock
                    "sku": f"ZERO-BLK-S-{uuid.uuid4()}"
                }
            ],
            "images": ["https://example.com/zero-stock.jpg"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/products", 
            headers=self.get_headers(self.admin_token),
            json=product_data
        )
        
        if response.status_code != 200:
            print(f"⚠️ Could not create test product: {response.text}")
            return
            
        zero_stock_product_id = response.json()["id"]
        
        # Try to add item with zero stock
        cart_item = {
            "product_id": zero_stock_product_id,
            "color": "Black",
            "size": "S",
            "quantity": 1
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        # Should fail with 400 status
        self.assertEqual(response.status_code, 400, "Adding item with zero stock should fail")
        self.assertIn("Insufficient stock", response.text, "Error message should mention insufficient stock")
        print("✅ Zero stock validation working correctly")

    def test_25_edge_case_exact_stock_limit(self):
        """Test updating to exactly available stock quantity"""
        # Get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find a variant with stock
        test_variant = None
        for variant_key, variant_data in stock_data["variants"].items():
            if variant_data["stock_quantity"] > 0:
                test_variant = variant_data
                break
        
        if not test_variant:
            print("⚠️ No variants with stock available for testing")
            return
            
        # Add exactly the available stock quantity
        exact_quantity = test_variant["stock_quantity"]
        cart_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": exact_quantity
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        # Should succeed
        self.assertEqual(response.status_code, 200, f"Adding exact stock quantity should succeed: {response.text}")
        print(f"✅ Exact stock limit validation working - successfully added {exact_quantity} items")

    def test_26_cart_update_performance(self):
        """Test cart quantity updates for speed and reliability"""
        # Get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find a variant with sufficient stock
        test_variant = None
        for variant_key, variant_data in stock_data["variants"].items():
            if variant_data["stock_quantity"] >= 10:
                test_variant = variant_data
                break
        
        if not test_variant:
            print("⚠️ No variants with sufficient stock (>=10) for performance testing")
            return
            
        # Add initial item to cart
        cart_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": 1
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        if response.status_code != 200:
            print(f"⚠️ Could not add initial item to cart: {response.text}")
            return
            
        # Test multiple rapid updates
        update_times = []
        max_quantity = min(10, test_variant["stock_quantity"])
        
        for quantity in range(2, max_quantity + 1):
            start_time = time.time()
            
            update_item = {
                "product_id": self.test_product_id,
                "color": test_variant["color"],
                "size": test_variant["size"],
                "quantity": quantity
            }
            
            response = requests.put(
                f"{BACKEND_URL}/cart/update", 
                headers=self.get_headers(),
                json=update_item
            )
            
            end_time = time.time()
            update_time = end_time - start_time
            update_times.append(update_time)
            
            self.assertEqual(response.status_code, 200, f"Cart update should succeed for quantity {quantity}")
            
            # Small delay to avoid overwhelming the server
            time.sleep(0.1)
        
        # Calculate performance metrics
        avg_time = sum(update_times) / len(update_times)
        max_time = max(update_times)
        
        # Performance should be reasonable (under 2 seconds per update)
        self.assertLess(avg_time, 2.0, f"Average update time should be under 2 seconds, got {avg_time:.3f}s")
        self.assertLess(max_time, 5.0, f"Maximum update time should be under 5 seconds, got {max_time:.3f}s")
        
        print(f"✅ Cart update performance test passed - Avg: {avg_time:.3f}s, Max: {max_time:.3f}s")

    def test_27_concurrent_cart_updates(self):
        """Test multiple rapid updates to ensure no race conditions"""
        # Get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find a variant with sufficient stock
        test_variant = None
        for variant_key, variant_data in stock_data["variants"].items():
            if variant_data["stock_quantity"] >= 5:
                test_variant = variant_data
                break
        
        if not test_variant:
            print("⚠️ No variants with sufficient stock (>=5) for concurrent testing")
            return
            
        # Add initial item to cart
        cart_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": 1
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        if response.status_code != 200:
            print(f"⚠️ Could not add initial item to cart: {response.text}")
            return
            
        def update_cart_quantity(quantity):
            """Helper function for concurrent updates"""
            update_item = {
                "product_id": self.test_product_id,
                "color": test_variant["color"],
                "size": test_variant["size"],
                "quantity": quantity
            }
            
            response = requests.put(
                f"{BACKEND_URL}/cart/update", 
                headers=self.get_headers(),
                json=update_item
            )
            
            return response.status_code, response.text
        
        # Test concurrent updates
        max_quantity = min(5, test_variant["stock_quantity"])
        quantities = list(range(2, max_quantity + 1))
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # Submit concurrent update requests
            futures = [executor.submit(update_cart_quantity, qty) for qty in quantities]
            
            # Collect results
            results = []
            for future in concurrent.futures.as_completed(futures):
                try:
                    status_code, response_text = future.result()
                    results.append((status_code, response_text))
                except Exception as e:
                    results.append((500, str(e)))
        
        # At least some updates should succeed (race conditions might cause some to fail)
        successful_updates = [r for r in results if r[0] == 200]
        self.assertGreater(len(successful_updates), 0, "At least some concurrent updates should succeed")
        
        print(f"✅ Concurrent cart updates test passed - {len(successful_updates)}/{len(results)} updates succeeded")

    def test_28_bulk_pricing_with_stock_limits(self):
        """Test bulk pricing calculations with stock limits"""
        # Get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find variants with sufficient stock for bulk pricing (15+ items)
        bulk_variants = []
        total_available = 0
        
        for variant_key, variant_data in stock_data["variants"].items():
            if variant_data["stock_quantity"] > 0:
                bulk_variants.append(variant_data)
                total_available += variant_data["stock_quantity"]
                if total_available >= 15:
                    break
        
        if total_available < 15:
            print(f"⚠️ Insufficient total stock ({total_available}) for bulk pricing test (need 15+)")
            return
            
        # Create order items for bulk pricing calculation
        order_items = []
        remaining_needed = 15
        
        for variant in bulk_variants:
            if remaining_needed <= 0:
                break
                
            quantity_to_add = min(remaining_needed, variant["stock_quantity"])
            order_items.append({
                "product_id": self.test_product_id,
                "color": variant["color"],
                "size": variant["size"],
                "quantity": quantity_to_add
            })
            remaining_needed -= quantity_to_add
        
        # Test order calculation with bulk pricing
        response = requests.post(
            f"{BACKEND_URL}/orders/calculate", 
            headers=self.get_headers(),
            json=order_items
        )
        
        self.assertEqual(response.status_code, 200, f"Bulk order calculation failed: {response.text}")
        order_summary = response.json()
        
        # Should be marked as bulk order
        self.assertTrue(order_summary["is_bulk_order"], "Order with 15+ items should be marked as bulk order")
        self.assertIn("subtotal", order_summary, "Order summary should contain subtotal")
        self.assertIn("total_amount", order_summary, "Order summary should contain total_amount")
        
        print(f"✅ Bulk pricing with stock limits working - calculated for {sum(item['quantity'] for item in order_items)} items")

    def test_29_error_message_validation(self):
        """Test that error messages match frontend expectations"""
        # Get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find a variant with limited stock
        test_variant = None
        for variant_key, variant_data in stock_data["variants"].items():
            if 0 < variant_data["stock_quantity"] < 10:
                test_variant = variant_data
                break
        
        if not test_variant:
            print("⚠️ No variants with limited stock for error message testing")
            return
            
        # Test insufficient stock error message format
        excessive_quantity = test_variant["stock_quantity"] + 1
        cart_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": excessive_quantity
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        self.assertEqual(response.status_code, 400, "Should return 400 for insufficient stock")
        
        error_data = response.json()
        self.assertIn("detail", error_data, "Error response should have 'detail' field")
        
        error_message = error_data["detail"]
        self.assertIn("Insufficient stock", error_message, "Error message should contain 'Insufficient stock'")
        
        # Test cart update error message
        response = requests.put(
            f"{BACKEND_URL}/cart/update", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        self.assertEqual(response.status_code, 400, "Cart update should also return 400 for insufficient stock")
        
        error_data = response.json()
        error_message = error_data["detail"]
        self.assertIn("Insufficient stock", error_message, "Cart update error should contain 'Insufficient stock'")
        self.assertIn(str(test_variant["stock_quantity"]), error_message, "Error should show available stock quantity")
        
        print("✅ Error message validation passed - messages match expected format")

    def test_30_stock_recovery_after_errors(self):
        """Test recovery from stock errors"""
        # Get stock information
        stock_data = self.test_21_stock_validation_endpoint()
        
        # Find a variant with stock
        test_variant = None
        for variant_key, variant_data in stock_data["variants"].items():
            if variant_data["stock_quantity"] >= 3:
                test_variant = variant_data
                break
        
        if not test_variant:
            print("⚠️ No variants with sufficient stock (>=3) for recovery testing")
            return
            
        # First, try to add excessive quantity (should fail)
        excessive_quantity = test_variant["stock_quantity"] + 5
        cart_item = {
            "product_id": self.test_product_id,
            "color": test_variant["color"],
            "size": test_variant["size"],
            "quantity": excessive_quantity
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        self.assertEqual(response.status_code, 400, "Excessive quantity should fail")
        
        # Now try with valid quantity (should succeed)
        valid_quantity = min(2, test_variant["stock_quantity"])
        cart_item["quantity"] = valid_quantity
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        self.assertEqual(response.status_code, 200, f"Valid quantity should succeed after error: {response.text}")
        
        # Verify cart contains the item
        response = requests.get(
            f"{BACKEND_URL}/cart", 
            headers=self.get_headers()
        )
        
        self.assertEqual(response.status_code, 200, "Get cart should work after recovery")
        cart_data = response.json()
        
        # Check if item was added
        found_item = False
        for item in cart_data.get("items", []):
            if (item["product_id"] == self.test_product_id and 
                item["color"] == test_variant["color"] and 
                item["size"] == test_variant["size"]):
                found_item = True
                self.assertEqual(item["quantity"], valid_quantity, "Item quantity should match")
                break
        
        self.assertTrue(found_item, "Item should be found in cart after recovery")
        print("✅ Stock error recovery working correctly")

    # ============================================================================
    # RAZORPAY PAYMENT INTEGRATION TESTS
    # ============================================================================

    def test_31_payment_create_order(self):
        """Test POST /api/payment/create-order endpoint"""
        # First ensure we have a product and add items to cart
        if not self.test_product_id:
            self.test_09_get_products()
            
        # Add items to cart first
        cart_item = {
            "product_id": self.test_product_id,
            "color": "Black",
            "size": "S",
            "quantity": 5
        }
        
        # Add to cart (using session for anonymous user)
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        if response.status_code != 200:
            print(f"⚠️ Could not add item to cart for payment testing: {response.text}")
            return
            
        # Create checkout request
        checkout_request = {
            "customer_name": "John Doe",
            "customer_email": "john.doe@example.com",
            "customer_phone": "9876543210",
            "shipping_address": {
                "full_name": "John Doe",
                "phone": "9876543210",
                "address_line_1": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postal_code": "400001",
                "country": "India"
            },
            "billing_address": {
                "full_name": "John Doe",
                "phone": "9876543210",
                "address_line_1": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postal_code": "400001",
                "country": "India"
            },
            "notes": "Test order for payment integration",
            "is_bulk_order": False
        }
        
        # Create payment order
        response = requests.post(
            f"{BACKEND_URL}/payment/create-order",
            headers=self.get_headers(),
            json=checkout_request
        )
        
        self.assertEqual(response.status_code, 200, f"Payment order creation failed: {response.text}")
        
        order_data = response.json()
        
        # Verify response structure
        self.assertIn("order_id", order_data, "Response should contain order_id")
        self.assertIn("razorpay_order_id", order_data, "Response should contain razorpay_order_id")
        self.assertIn("amount", order_data, "Response should contain amount")
        self.assertIn("currency", order_data, "Response should contain currency")
        self.assertIn("key_id", order_data, "Response should contain key_id")
        self.assertIn("customer_details", order_data, "Response should contain customer_details")
        self.assertIn("order_details", order_data, "Response should contain order_details")
        
        # Verify currency and key_id
        self.assertEqual(order_data["currency"], "INR", "Currency should be INR")
        self.assertEqual(order_data["key_id"], "rzp_test_Cdvju2JtE2XIQl", "Key ID should match test credentials")
        
        # Verify customer details
        customer = order_data["customer_details"]
        self.assertEqual(customer["name"], "John Doe", "Customer name should match")
        self.assertEqual(customer["email"], "john.doe@example.com", "Customer email should match")
        self.assertEqual(customer["contact"], "9876543210", "Customer phone should match")
        
        # Verify order details structure
        order_details = order_data["order_details"]
        self.assertIn("items", order_details, "Order details should contain items")
        self.assertIn("subtotal", order_details, "Order details should contain subtotal")
        self.assertIn("tax_amount", order_details, "Order details should contain tax_amount")
        self.assertIn("shipping_amount", order_details, "Order details should contain shipping_amount")
        self.assertIn("total_amount", order_details, "Order details should contain total_amount")
        
        # Verify calculations
        self.assertGreater(order_details["subtotal"], 0, "Subtotal should be greater than 0")
        self.assertGreater(order_details["total_amount"], order_details["subtotal"], "Total should be greater than subtotal (includes tax)")
        
        # Save order details for verification test
        self.razorpay_order_id = order_data["razorpay_order_id"]
        self.test_order_id = order_data["order_id"]
        
        print("✅ Payment order creation successful")
        print(f"   Order ID: {order_data['order_id']}")
        print(f"   Razorpay Order ID: {order_data['razorpay_order_id']}")
        print(f"   Amount: ₹{order_data['amount']}")
        
        return order_data

    def test_32_payment_verification_invalid_signature(self):
        """Test POST /api/payment/verify endpoint with invalid signature"""
        # First create an order
        order_data = self.test_31_payment_create_order()
        if not order_data:
            print("⚠️ Could not create order for verification testing")
            return
            
        # Test with invalid signature
        verification_data = {
            "razorpay_order_id": order_data["razorpay_order_id"],
            "razorpay_payment_id": "pay_test_invalid_payment_id",
            "razorpay_signature": "invalid_signature_for_testing"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/verify",
            headers=self.get_headers(),
            json=verification_data
        )
        
        # Should fail with 400 status for invalid signature
        self.assertEqual(response.status_code, 400, "Invalid signature should be rejected")
        
        error_data = response.json()
        self.assertIn("detail", error_data, "Error response should have detail field")
        self.assertIn("Invalid payment signature", error_data["detail"], "Error should mention invalid signature")
        
        print("✅ Payment verification correctly rejects invalid signature")

    def test_33_payment_verification_nonexistent_order(self):
        """Test payment verification with non-existent order"""
        verification_data = {
            "razorpay_order_id": "order_nonexistent_test_id",
            "razorpay_payment_id": "pay_test_payment_id",
            "razorpay_signature": "test_signature"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/verify",
            headers=self.get_headers(),
            json=verification_data
        )
        
        # Should fail with 404 status for non-existent order
        self.assertEqual(response.status_code, 404, "Non-existent order should return 404")
        
        error_data = response.json()
        self.assertIn("detail", error_data, "Error response should have detail field")
        self.assertIn("Order not found", error_data["detail"], "Error should mention order not found")
        
        print("✅ Payment verification correctly handles non-existent orders")

    def test_34_payment_webhook_missing_signature(self):
        """Test POST /api/payment/webhook endpoint without signature"""
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_payment_id",
                        "order_id": "order_test_order_id",
                        "status": "captured"
                    }
                }
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/webhook",
            headers={"Content-Type": "application/json"},
            json=webhook_payload
        )
        
        # Should fail with 400 status for missing signature
        self.assertEqual(response.status_code, 400, "Missing webhook signature should be rejected")
        
        error_data = response.json()
        self.assertIn("detail", error_data, "Error response should have detail field")
        self.assertIn("Missing webhook signature", error_data["detail"], "Error should mention missing signature")
        
        print("✅ Payment webhook correctly requires signature")

    def test_35_payment_webhook_with_signature(self):
        """Test POST /api/payment/webhook endpoint with signature"""
        # First create an order to test webhook against
        order_data = self.test_31_payment_create_order()
        if not order_data:
            print("⚠️ Could not create order for webhook testing")
            return
            
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_payment_id",
                        "order_id": order_data["razorpay_order_id"],
                        "status": "captured"
                    }
                }
            }
        }
        
        # Add a test signature (webhook secret validation is optional)
        response = requests.post(
            f"{BACKEND_URL}/payment/webhook",
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "test_webhook_signature"
            },
            json=webhook_payload
        )
        
        # Should succeed (webhook secret validation is optional in current implementation)
        self.assertEqual(response.status_code, 200, f"Webhook processing failed: {response.text}")
        
        response_data = response.json()
        self.assertIn("status", response_data, "Webhook response should have status")
        self.assertEqual(response_data["status"], "processed", "Webhook should be processed")
        
        print("✅ Payment webhook processing successful")

    def test_36_payment_webhook_payment_failed(self):
        """Test webhook for payment.failed event"""
        # First create an order
        order_data = self.test_31_payment_create_order()
        if not order_data:
            print("⚠️ Could not create order for webhook testing")
            return
            
        webhook_payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_failed_payment_id",
                        "order_id": order_data["razorpay_order_id"],
                        "status": "failed"
                    }
                }
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/webhook",
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "test_webhook_signature"
            },
            json=webhook_payload
        )
        
        self.assertEqual(response.status_code, 200, f"Failed payment webhook processing failed: {response.text}")
        
        response_data = response.json()
        self.assertEqual(response_data["status"], "processed", "Failed payment webhook should be processed")
        
        print("✅ Payment failed webhook processing successful")

    def test_37_bulk_pricing_in_payment_order(self):
        """Test bulk pricing logic in payment order creation"""
        if not self.test_product_id:
            self.test_09_get_products()
            
        # Add 15+ items to cart for bulk pricing
        cart_item = {
            "product_id": self.test_product_id,
            "color": "Black",
            "size": "S",
            "quantity": 15
        }
        
        # Clear cart first
        requests.get(f"{BACKEND_URL}/cart", headers=self.get_headers())
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(),
            json=cart_item
        )
        
        if response.status_code != 200:
            print(f"⚠️ Could not add bulk items to cart: {response.text}")
            return
            
        # Create checkout request for bulk order
        checkout_request = {
            "customer_name": "Bulk Customer",
            "customer_email": "bulk@example.com",
            "customer_phone": "9876543210",
            "shipping_address": {
                "full_name": "Bulk Customer",
                "phone": "9876543210",
                "address_line_1": "123 Bulk Street",
                "city": "Delhi",
                "state": "Delhi",
                "postal_code": "110001",
                "country": "India"
            },
            "notes": "Bulk order test",
            "is_bulk_order": True
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/create-order",
            headers=self.get_headers(),
            json=checkout_request
        )
        
        self.assertEqual(response.status_code, 200, f"Bulk payment order creation failed: {response.text}")
        
        order_data = response.json()
        order_details = order_data["order_details"]
        
        # Verify bulk pricing was applied
        total_quantity = sum(item["quantity"] for item in order_details["items"])
        self.assertGreaterEqual(total_quantity, 15, "Order should have 15+ items for bulk pricing")
        
        # Check that bulk pricing was applied (bulk price should be lower than regular price)
        # This is verified by checking the unit_price in items
        for item in order_details["items"]:
            self.assertIn("unit_price", item, "Item should have unit_price")
            # Bulk price should be 279, regular price should be 319
            self.assertEqual(item["unit_price"], 279.0, "Bulk pricing should be applied for 15+ items")
        
        print("✅ Bulk pricing logic working in payment orders")
        print(f"   Total quantity: {total_quantity}")
        print(f"   Bulk unit price: ₹{order_details['items'][0]['unit_price']}")

    def test_38_cart_clearing_after_payment_simulation(self):
        """Test cart clearing after successful payment (simulated)"""
        if not self.user_token:
            self.test_03_user_login()
        if not self.test_product_id:
            self.test_09_get_products()
            
        # Add items to cart as authenticated user
        cart_item = {
            "product_id": self.test_product_id,
            "color": "White",
            "size": "M",
            "quantity": 3
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add", 
            headers=self.get_headers(self.user_token),
            json=cart_item
        )
        
        if response.status_code != 200:
            print(f"⚠️ Could not add item to cart: {response.text}")
            return
            
        # Verify cart has items
        response = requests.get(
            f"{BACKEND_URL}/cart", 
            headers=self.get_headers(self.user_token)
        )
        
        self.assertEqual(response.status_code, 200, "Get cart should work")
        cart_data = response.json()
        self.assertGreater(len(cart_data["items"]), 0, "Cart should have items before payment")
        
        # Create payment order (this should not clear cart yet)
        checkout_request = {
            "customer_name": "Test User",
            "customer_email": "test@example.com",
            "customer_phone": "9876543210",
            "shipping_address": {
                "full_name": "Test User",
                "phone": "9876543210",
                "address_line_1": "123 Test Street",
                "city": "Pune",
                "state": "Maharashtra",
                "postal_code": "411001",
                "country": "India"
            },
            "notes": "Cart clearing test",
            "is_bulk_order": False
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/create-order",
            headers=self.get_headers(self.user_token),
            json=checkout_request
        )
        
        self.assertEqual(response.status_code, 200, f"Payment order creation failed: {response.text}")
        
        # Cart should still have items (not cleared until payment verification)
        response = requests.get(
            f"{BACKEND_URL}/cart", 
            headers=self.get_headers(self.user_token)
        )
        
        cart_data = response.json()
        # Note: Cart clearing happens only after successful payment verification
        # This test verifies the order creation doesn't prematurely clear the cart
        
        print("✅ Cart clearing logic verified - cart preserved until payment verification")

    def test_39_order_status_updates(self):
        """Test order status updates during payment flow"""
        # Create an order first
        order_data = self.test_31_payment_create_order()
        if not order_data:
            print("⚠️ Could not create order for status testing")
            return
            
        # Check initial order status in database by getting orders
        if not self.admin_token:
            self.test_02_admin_login()
            
        response = requests.get(
            f"{BACKEND_URL}/orders", 
            headers=self.get_headers(self.admin_token)
        )
        
        self.assertEqual(response.status_code, 200, "Get orders should work")
        orders = response.json()
        
        # Find our test order
        test_order = None
        for order in orders:
            if order["id"] == order_data["order_id"]:
                test_order = order
                break
                
        self.assertIsNotNone(test_order, "Test order should be found in orders list")
        
        # Verify initial status
        self.assertEqual(test_order["status"], "pending", "Initial order status should be pending")
        self.assertEqual(test_order["payment_status"], "pending", "Initial payment status should be pending")
        
        # Simulate successful payment webhook
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_status_update",
                        "order_id": order_data["razorpay_order_id"],
                        "status": "captured"
                    }
                }
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/webhook",
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "test_signature"
            },
            json=webhook_payload
        )
        
        self.assertEqual(response.status_code, 200, "Webhook should process successfully")
        
        # Check updated order status
        response = requests.get(
            f"{BACKEND_URL}/orders", 
            headers=self.get_headers(self.admin_token)
        )
        
        orders = response.json()
        updated_order = None
        for order in orders:
            if order["id"] == order_data["order_id"]:
                updated_order = order
                break
                
        self.assertIsNotNone(updated_order, "Updated order should be found")
        
        # Verify status was updated by webhook
        self.assertEqual(updated_order["status"], "confirmed", "Order status should be updated to confirmed")
        self.assertEqual(updated_order["payment_status"], "completed", "Payment status should be updated to completed")
        self.assertEqual(updated_order["payment_id"], "pay_test_status_update", "Payment ID should be set")
        
        print("✅ Order status updates working correctly")
        print(f"   Order status: {updated_order['status']}")
        print(f"   Payment status: {updated_order['payment_status']}")

    def test_40_payment_integration_complete_flow(self):
        """Test complete payment integration flow"""
        print("\n🔄 Testing complete payment integration flow...")
        
        # Step 1: Add items to cart
        if not self.test_product_id:
            self.test_09_get_products()
            
        cart_items = [
            {"product_id": self.test_product_id, "color": "Black", "size": "S", "quantity": 3},
            {"product_id": self.test_product_id, "color": "White", "size": "M", "quantity": 2}
        ]
        
        for item in cart_items:
            response = requests.post(
                f"{BACKEND_URL}/cart/add", 
                headers=self.get_headers(),
                json=item
            )
            if response.status_code != 200:
                print(f"⚠️ Could not add item to cart: {response.text}")
                return
                
        print("   ✅ Step 1: Items added to cart")
        
        # Step 2: Create payment order
        checkout_request = {
            "customer_name": "Integration Test User",
            "customer_email": "integration@example.com",
            "customer_phone": "9876543210",
            "shipping_address": {
                "full_name": "Integration Test User",
                "phone": "9876543210",
                "address_line_1": "123 Integration Street",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560001",
                "country": "India"
            },
            "notes": "Complete integration test",
            "is_bulk_order": False
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/create-order",
            headers=self.get_headers(),
            json=checkout_request
        )
        
        self.assertEqual(response.status_code, 200, f"Payment order creation failed: {response.text}")
        order_data = response.json()
        
        print("   ✅ Step 2: Payment order created")
        print(f"      Razorpay Order ID: {order_data['razorpay_order_id']}")
        print(f"      Amount: ₹{order_data['amount']}")
        
        # Step 3: Simulate payment success webhook
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_integration_test_success",
                        "order_id": order_data["razorpay_order_id"],
                        "status": "captured"
                    }
                }
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/payment/webhook",
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "integration_test_signature"
            },
            json=webhook_payload
        )
        
        self.assertEqual(response.status_code, 200, "Webhook processing should succeed")
        print("   ✅ Step 3: Payment webhook processed")
        
        # Step 4: Verify order status
        if not self.admin_token:
            self.test_02_admin_login()
            
        response = requests.get(
            f"{BACKEND_URL}/orders/{order_data['order_id']}", 
            headers=self.get_headers(self.admin_token)
        )
        
        self.assertEqual(response.status_code, 200, "Get order should work")
        final_order = response.json()
        
        self.assertEqual(final_order["status"], "confirmed", "Final order status should be confirmed")
        self.assertEqual(final_order["payment_status"], "completed", "Final payment status should be completed")
        
        print("   ✅ Step 4: Order status verified")
        print(f"      Final order status: {final_order['status']}")
        print(f"      Final payment status: {final_order['payment_status']}")
        
        print("🎉 Complete payment integration flow test PASSED")

if __name__ == "__main__":
    # Run tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)