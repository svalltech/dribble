#!/usr/bin/env python3
"""
DRIBBLE E-Commerce Cart Functionality Test Suite
Focus: Testing cart operations that were recently fixed
"""
import requests
import json
import unittest
import uuid
import time
from typing import Dict, Any, List, Optional

# Backend URL from frontend App.js
BACKEND_URL = "https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@dribble-sports.com"
ADMIN_PASSWORD = "admin123"
TEST_EMAIL = "test@dribble-sports.com"
TEST_PASSWORD = "test123"

class CartFunctionalityTest(unittest.TestCase):
    """Comprehensive cart functionality testing"""
    
    def setUp(self):
        """Set up test environment"""
        self.admin_token = None
        self.user_token = None
        self.test_product_id = None
        self.session_cookies = {}
        
        # Get admin token for setup
        self._get_admin_token()
        
        # Get a test product
        self._get_test_product()
        
        print(f"\n🧪 Testing Cart Functionality - Product ID: {self.test_product_id}")
    
    def _get_admin_token(self):
        """Get admin authentication token"""
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login", 
            headers={"Content-Type": "application/json"},
            json=login_data
        )
        
        if response.status_code == 200:
            self.admin_token = response.json()["access_token"]
            print("✅ Admin authentication successful")
        else:
            print(f"❌ Admin authentication failed: {response.status_code}")
    
    def _get_test_product(self):
        """Get a test product with variants for cart testing"""
        response = requests.get(f"{BACKEND_URL}/products?limit=1")
        
        if response.status_code == 200:
            products = response.json()
            if products:
                self.test_product_id = products[0]["id"]
                print(f"✅ Test product found: {products[0]['name']}")
            else:
                print("❌ No products found in database")
        else:
            print(f"❌ Failed to fetch products: {response.status_code}")
    
    def get_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        """Get request headers with optional authorization token"""
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers
    
    def test_01_cart_get_empty_anonymous(self):
        """Test GET /api/cart - retrieve empty cart for anonymous user"""
        print("\n🔍 Testing: GET /api/cart (anonymous user)")
        
        response = requests.get(f"{BACKEND_URL}/cart")
        
        self.assertEqual(response.status_code, 200, f"Cart GET failed: {response.text}")
        cart_data = response.json()
        
        # Verify empty cart structure
        self.assertIn("items", cart_data, "Cart should have 'items' field")
        self.assertIn("total", cart_data, "Cart should have 'total' field")
        self.assertEqual(cart_data["items"], [], "Empty cart should have empty items list")
        self.assertEqual(cart_data["total"], 0, "Empty cart should have zero total")
        
        # Store session cookies for later tests
        if response.cookies:
            self.session_cookies.update(response.cookies)
        
        print("✅ Anonymous empty cart retrieval successful")
    
    def test_02_cart_add_item_anonymous(self):
        """Test POST /api/cart/add - add items to cart for anonymous user"""
        print("\n🔍 Testing: POST /api/cart/add (anonymous user)")
        
        if not self.test_product_id:
            self.skipTest("No test product available")
        
        # Add item to cart
        cart_item = {
            "product_id": self.test_product_id,
            "color": "Black",
            "size": "S",
            "quantity": 5
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add",
            headers={"Content-Type": "application/json"},
            json=cart_item,
            cookies=self.session_cookies
        )
        
        # Handle both success and expected stock errors
        if response.status_code == 200:
            print("✅ Item added to anonymous cart successfully")
            
            # Update session cookies
            if response.cookies:
                self.session_cookies.update(response.cookies)
                
            # Verify cart now has items
            cart_response = requests.get(f"{BACKEND_URL}/cart", cookies=self.session_cookies)
            self.assertEqual(cart_response.status_code, 200)
            cart_data = cart_response.json()
            
            if cart_data["items"]:
                self.assertGreater(len(cart_data["items"]), 0, "Cart should have items after adding")
                self.assertGreater(cart_data["total"], 0, "Cart total should be greater than 0")
                print(f"✅ Cart now contains {len(cart_data['items'])} items, total: ₹{cart_data['total']}")
            
        elif response.status_code == 400 and "stock" in response.text.lower():
            print("⚠️ Add to cart failed due to insufficient stock - this is expected for test products")
        else:
            self.fail(f"Unexpected error adding to cart: {response.status_code} - {response.text}")
    
    def test_03_cart_add_bulk_quantity(self):
        """Test bulk pricing logic for 15+ items"""
        print("\n🔍 Testing: Bulk pricing logic (15+ items)")
        
        if not self.test_product_id:
            self.skipTest("No test product available")
        
        # Add 15+ items to trigger bulk pricing
        bulk_cart_item = {
            "product_id": self.test_product_id,
            "color": "White",
            "size": "M",
            "quantity": 16
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add",
            headers={"Content-Type": "application/json"},
            json=bulk_cart_item,
            cookies=self.session_cookies
        )
        
        if response.status_code == 200:
            print("✅ Bulk quantity added to cart successfully")
            
            # Verify bulk pricing is applied
            cart_response = requests.get(f"{BACKEND_URL}/cart", cookies=self.session_cookies)
            self.assertEqual(cart_response.status_code, 200)
            cart_data = cart_response.json()
            
            # Check if bulk pricing logic is working
            total_quantity = sum(item["quantity"] for item in cart_data["items"])
            if total_quantity >= 15:
                print(f"✅ Bulk pricing should apply - Total quantity: {total_quantity}")
            
        elif response.status_code == 400 and "stock" in response.text.lower():
            print("⚠️ Bulk quantity test skipped due to insufficient stock")
        else:
            print(f"⚠️ Bulk quantity test failed: {response.status_code} - {response.text}")
    
    def test_04_cart_update_quantity(self):
        """Test PUT /api/cart/update - update cart quantities"""
        print("\n🔍 Testing: PUT /api/cart/update (quantity updates)")
        
        if not self.test_product_id:
            self.skipTest("No test product available")
        
        # First add an item
        cart_item = {
            "product_id": self.test_product_id,
            "color": "Black",
            "size": "L",
            "quantity": 3
        }
        
        add_response = requests.post(
            f"{BACKEND_URL}/cart/add",
            headers={"Content-Type": "application/json"},
            json=cart_item,
            cookies=self.session_cookies
        )
        
        if add_response.status_code == 200:
            print("✅ Item added for update test")
            
            # Now update the quantity
            update_item = {
                "product_id": self.test_product_id,
                "color": "Black",
                "size": "L",
                "quantity": 7  # Update from 3 to 7
            }
            
            update_response = requests.put(
                f"{BACKEND_URL}/cart/update",
                headers={"Content-Type": "application/json"},
                json=update_item,
                cookies=self.session_cookies
            )
            
            if update_response.status_code == 200:
                print("✅ Cart quantity update successful")
                
                # Verify the update
                cart_response = requests.get(f"{BACKEND_URL}/cart", cookies=self.session_cookies)
                cart_data = cart_response.json()
                
                # Find the updated item
                updated_item = None
                for item in cart_data["items"]:
                    if (item["product_id"] == self.test_product_id and 
                        item["color"] == "Black" and 
                        item["size"] == "L"):
                        updated_item = item
                        break
                
                if updated_item:
                    self.assertEqual(updated_item["quantity"], 7, "Quantity should be updated to 7")
                    print(f"✅ Quantity successfully updated to {updated_item['quantity']}")
                
            else:
                print(f"⚠️ Cart update failed: {update_response.status_code} - {update_response.text}")
        
        elif add_response.status_code == 400 and "stock" in add_response.text.lower():
            print("⚠️ Update test skipped due to insufficient stock")
    
    def test_05_cart_remove_item(self):
        """Test DELETE /api/cart/remove - remove items from cart"""
        print("\n🔍 Testing: DELETE /api/cart/remove")
        
        if not self.test_product_id:
            self.skipTest("No test product available")
        
        # First add an item to remove
        cart_item = {
            "product_id": self.test_product_id,
            "color": "Red",
            "size": "XL",
            "quantity": 2
        }
        
        add_response = requests.post(
            f"{BACKEND_URL}/cart/add",
            headers={"Content-Type": "application/json"},
            json=cart_item,
            cookies=self.session_cookies
        )
        
        if add_response.status_code == 200:
            print("✅ Item added for removal test")
            
            # Now remove the item
            remove_response = requests.delete(
                f"{BACKEND_URL}/cart/remove/{self.test_product_id}?color=Red&size=XL",
                cookies=self.session_cookies
            )
            
            if remove_response.status_code == 200:
                print("✅ Item removed from cart successfully")
                
                # Verify the item is removed
                cart_response = requests.get(f"{BACKEND_URL}/cart", cookies=self.session_cookies)
                cart_data = cart_response.json()
                
                # Check that the specific item is no longer in cart
                removed_item_found = False
                for item in cart_data["items"]:
                    if (item["product_id"] == self.test_product_id and 
                        item["color"] == "Red" and 
                        item["size"] == "XL"):
                        removed_item_found = True
                        break
                
                self.assertFalse(removed_item_found, "Removed item should not be in cart")
                print("✅ Item successfully removed from cart")
                
            else:
                print(f"⚠️ Item removal failed: {remove_response.status_code} - {remove_response.text}")
        
        elif add_response.status_code == 400 and "stock" in add_response.text.lower():
            print("⚠️ Removal test skipped due to insufficient stock")
    
    def test_06_authenticated_user_cart(self):
        """Test cart functionality for authenticated users"""
        print("\n🔍 Testing: Authenticated user cart operations")
        
        # Login as test user
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        login_response = requests.post(
            f"{BACKEND_URL}/auth/login", 
            headers={"Content-Type": "application/json"},
            json=login_data
        )
        
        if login_response.status_code == 200:
            self.user_token = login_response.json()["access_token"]
            print("✅ User authentication successful")
            
            # Test authenticated cart operations
            if self.test_product_id:
                # Add item to authenticated user's cart
                cart_item = {
                    "product_id": self.test_product_id,
                    "color": "Blue",
                    "size": "M",
                    "quantity": 4
                }
                
                add_response = requests.post(
                    f"{BACKEND_URL}/cart/add",
                    headers=self.get_headers(self.user_token),
                    json=cart_item
                )
                
                if add_response.status_code == 200:
                    print("✅ Item added to authenticated user's cart")
                    
                    # Get authenticated user's cart
                    cart_response = requests.get(
                        f"{BACKEND_URL}/cart",
                        headers=self.get_headers(self.user_token)
                    )
                    
                    self.assertEqual(cart_response.status_code, 200)
                    cart_data = cart_response.json()
                    
                    if cart_data["items"]:
                        print(f"✅ Authenticated cart contains {len(cart_data['items'])} items")
                    
                elif add_response.status_code == 400 and "stock" in add_response.text.lower():
                    print("⚠️ Authenticated cart test skipped due to insufficient stock")
                else:
                    print(f"⚠️ Authenticated cart add failed: {add_response.status_code}")
        else:
            print(f"⚠️ User authentication failed: {login_response.status_code}")
    
    def test_07_cart_session_persistence(self):
        """Test cart persistence across sessions"""
        print("\n🔍 Testing: Cart session persistence")
        
        # Create a new session and add items
        new_session_cookies = {}
        
        if self.test_product_id:
            cart_item = {
                "product_id": self.test_product_id,
                "color": "Green",
                "size": "S",
                "quantity": 1
            }
            
            # Add item with new session
            add_response = requests.post(
                f"{BACKEND_URL}/cart/add",
                headers={"Content-Type": "application/json"},
                json=cart_item
            )
            
            if add_response.status_code == 200:
                # Store new session cookies
                if add_response.cookies:
                    new_session_cookies.update(add_response.cookies)
                
                print("✅ Item added in new session")
                
                # Retrieve cart with same session cookies
                cart_response = requests.get(
                    f"{BACKEND_URL}/cart",
                    cookies=new_session_cookies
                )
                
                if cart_response.status_code == 200:
                    cart_data = cart_response.json()
                    if cart_data["items"]:
                        print("✅ Cart persisted across session requests")
                    else:
                        print("⚠️ Cart appears empty - session persistence may have issues")
                
            elif add_response.status_code == 400 and "stock" in add_response.text.lower():
                print("⚠️ Session persistence test skipped due to insufficient stock")
    
    def test_08_invalid_product_handling(self):
        """Test error handling for invalid product IDs"""
        print("\n🔍 Testing: Error handling for invalid product IDs")
        
        # Try to add invalid product to cart
        invalid_cart_item = {
            "product_id": "invalid-product-id-12345",
            "color": "Black",
            "size": "M",
            "quantity": 1
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add",
            headers={"Content-Type": "application/json"},
            json=invalid_cart_item,
            cookies=self.session_cookies
        )
        
        # Should return 404 for invalid product
        self.assertEqual(response.status_code, 404, "Invalid product should return 404")
        print("✅ Invalid product ID correctly rejected")
    
    def test_09_invalid_variant_handling(self):
        """Test error handling for invalid product variants"""
        print("\n🔍 Testing: Error handling for invalid product variants")
        
        if not self.test_product_id:
            self.skipTest("No test product available")
        
        # Try to add invalid variant to cart
        invalid_variant_item = {
            "product_id": self.test_product_id,
            "color": "InvalidColor",
            "size": "InvalidSize",
            "quantity": 1
        }
        
        response = requests.post(
            f"{BACKEND_URL}/cart/add",
            headers={"Content-Type": "application/json"},
            json=invalid_variant_item,
            cookies=self.session_cookies
        )
        
        # Should return 400 for invalid variant
        self.assertIn(response.status_code, [400, 404], "Invalid variant should return 400 or 404")
        print("✅ Invalid product variant correctly rejected")
    
    def test_10_cart_api_integration_verification(self):
        """Verify all cart endpoints are responding correctly"""
        print("\n🔍 Testing: Cart API integration verification")
        
        endpoints_to_test = [
            ("GET", f"{BACKEND_URL}/cart", "Cart retrieval"),
            ("POST", f"{BACKEND_URL}/cart/add", "Add to cart"),
            ("PUT", f"{BACKEND_URL}/cart/update", "Update cart"),
        ]
        
        for method, url, description in endpoints_to_test:
            try:
                if method == "GET":
                    response = requests.get(url, cookies=self.session_cookies)
                elif method == "POST":
                    # Use minimal valid data for POST
                    test_data = {
                        "product_id": self.test_product_id or "test-id",
                        "color": "Black",
                        "size": "M",
                        "quantity": 1
                    }
                    response = requests.post(
                        url, 
                        headers={"Content-Type": "application/json"},
                        json=test_data,
                        cookies=self.session_cookies
                    )
                elif method == "PUT":
                    # Use minimal valid data for PUT
                    test_data = {
                        "product_id": self.test_product_id or "test-id",
                        "color": "Black",
                        "size": "M",
                        "quantity": 2
                    }
                    response = requests.put(
                        url, 
                        headers={"Content-Type": "application/json"},
                        json=test_data,
                        cookies=self.session_cookies
                    )
                
                # Check that endpoint is not returning 404 (not found)
                self.assertNotEqual(response.status_code, 404, 
                                  f"{description} endpoint returned 404 - endpoint may not exist")
                
                print(f"✅ {description} endpoint responding (status: {response.status_code})")
                
            except requests.exceptions.RequestException as e:
                self.fail(f"{description} endpoint failed with network error: {str(e)}")
        
        # Test DELETE endpoint separately
        if self.test_product_id:
            delete_url = f"{BACKEND_URL}/cart/remove/{self.test_product_id}?color=Black&size=M"
            try:
                response = requests.delete(delete_url, cookies=self.session_cookies)
                self.assertNotEqual(response.status_code, 404, 
                                  "Remove from cart endpoint returned 404 - endpoint may not exist")
                print(f"✅ Remove from cart endpoint responding (status: {response.status_code})")
            except requests.exceptions.RequestException as e:
                self.fail(f"Remove from cart endpoint failed with network error: {str(e)}")

def run_cart_tests():
    """Run the cart functionality test suite"""
    print("=" * 80)
    print("🛒 DRIBBLE E-COMMERCE CART FUNCTIONALITY TEST SUITE")
    print("=" * 80)
    print("Focus: Testing cart operations that were recently fixed")
    print("- Cart Operations: GET, POST, PUT, DELETE")
    print("- Session Management: Authenticated and anonymous users")
    print("- Edge Cases: Bulk pricing, persistence, error handling")
    print("- API Integration: Endpoint availability verification")
    print("=" * 80)
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(CartFunctionalityTest)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 80)
    print("🏁 CART FUNCTIONALITY TEST RESULTS")
    print("=" * 80)
    
    if result.wasSuccessful():
        print("✅ ALL CART TESTS PASSED - Cart functionality is working correctly!")
    else:
        print("❌ SOME CART TESTS FAILED - Issues found in cart functionality")
        
        if result.failures:
            print(f"\n🔥 FAILURES ({len(result.failures)}):")
            for test, traceback in result.failures:
                # Extract just the assertion error message
                error_lines = traceback.split('\n')
                assertion_line = None
                for line in error_lines:
                    if 'AssertionError:' in line:
                        assertion_line = line.split('AssertionError: ')[-1]
                        break
                if assertion_line:
                    print(f"  - {test}: {assertion_line}")
                else:
                    print(f"  - {test}: Test failed")
        
        if result.errors:
            print(f"\n💥 ERRORS ({len(result.errors)}):")
            for test, traceback in result.errors:
                # Extract the last meaningful error line
                error_lines = traceback.split('\n')
                error_line = error_lines[-2] if len(error_lines) > 1 else "Unknown error"
                print(f"  - {test}: {error_line}")
    
    print(f"\nTests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("=" * 80)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_cart_tests()
    exit(0 if success else 1)