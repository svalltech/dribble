import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  DeliveryDetailsModal, 
  ShippingCalculatorModal, 
  LiveStockModal, 
  ContactUsModal 
} from './pages/InfoPages';
import { 
  AboutUsModal, 
  PricingModal, 
  VideosModal, 
  SuggestionsModal, 
  OrdersTrackingModal, 
  FAQModal 
} from './pages/MoreInfoPages';

// API Configuration
// Configure axios to include credentials (cookies) with requests
axios.defaults.withCredentials = true;

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com';
const API_URL = `${API_BASE}/api`;

// Context for global state
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  // Authentication functions
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      setUser(userData);
      await fetchCart();
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { access_token, user: userResponse } = response.data;
      localStorage.setItem('token', access_token);
      setUser(userResponse);
      await fetchCart();
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart({ items: [], total: 0 });
    toast.success('Logged out successfully');
  };

  // Cart operations
  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_URL}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, color, size, quantity) => {
    try {
      // Get product details for immediate UI update
      const productResponse = await axios.get(`${API_URL}/products?limit=100`);
      const product = productResponse.data.find(p => p.id === productId);
      
      if (!product) {
        toast.error('Product not found');
        return false;
      }
      
      // Calculate pricing for immediate display
      const currentCartQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalQuantityAfterAdd = currentCartQuantity + quantity;
      const unitPrice = totalQuantityAfterAdd >= 15 ? product.bulk_price : product.base_price;
      
      // Create new cart item for immediate UI update
      const newCartItem = {
        product_id: productId,
        color,
        size,
        quantity,
        product_name: product.name,
        product_image: product.images?.[0],
        unit_price: unitPrice,
        total_price: unitPrice * quantity
      };
      
      // Update cart state immediately for instant UI feedback
      const updatedCart = { ...cart };
      
      // Check if item already exists in cart
      const existingItemIndex = updatedCart.items.findIndex(item => 
        item.product_id === productId && 
        item.color === color && 
        item.size === size
      );
      
      if (existingItemIndex !== -1) {
        // Update existing item
        updatedCart.items[existingItemIndex].quantity += quantity;
        updatedCart.items[existingItemIndex].total_price = updatedCart.items[existingItemIndex].unit_price * updatedCart.items[existingItemIndex].quantity;
      } else {
        // Add new item
        updatedCart.items.push(newCartItem);
      }
      
      // Recalculate total for bulk pricing
      const newTotalQuantity = updatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
      const isBulkOrder = newTotalQuantity >= 15;
      
      // Update all item prices based on bulk pricing
      updatedCart.items.forEach(item => {
        const itemProduct = productResponse.data.find(p => p.id === item.product_id);
        if (itemProduct) {
          item.unit_price = isBulkOrder ? itemProduct.bulk_price : itemProduct.base_price;
          item.total_price = item.unit_price * item.quantity;
        }
      });
      
      // Calculate new total
      updatedCart.total = updatedCart.items.reduce((sum, item) => sum + item.total_price, 0);
      
      // Update cart state immediately
      setCart(updatedCart);
      
      // Show success message immediately
      toast.success('Added to cart!');
      
      // Trigger cart update events immediately
      window.dispatchEvent(new Event('cartUpdated'));
      localStorage.setItem('cartUpdate', Date.now().toString());
      
      // Send to backend in background
      const response = await axios.post(`${API_URL}/cart/add`, {
        product_id: productId,
        color,
        size,
        quantity
      });
      
      if (response.data) {
        // Sync with backend after a short delay
        setTimeout(() => fetchCart(), 200);
        return true;
      } else {
        // Revert on backend failure
        await fetchCart();
        toast.error('Failed to add to cart');
        return false;
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Revert cart state on error
      await fetchCart();
      
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('stock')) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(error.response?.data?.detail || 'Failed to add to cart');
      }
      return false;
    }
  };

  const updateCartQuantity = async (productId, color, size, quantity) => {
    try {
      const response = await axios.put(`${API_URL}/cart/update`, {
        product_id: productId,
        color,
        size,
        quantity: parseInt(quantity)
      });
      
      if (response.data) {
        // Don't wait for fetchCart - update locally first for instant UI
        const updatedCart = { ...cart };
        
        // Find and update the item in local cart
        const itemIndex = updatedCart.items.findIndex(item => 
          item.product_id === productId && 
          item.color === color && 
          item.size === size
        );
        
        if (itemIndex !== -1) {
          if (quantity <= 0) {
            // Remove item if quantity is 0
            updatedCart.items.splice(itemIndex, 1);
          } else {
            // Update quantity and recalculate totals
            updatedCart.items[itemIndex].quantity = quantity;
            updatedCart.items[itemIndex].total_price = updatedCart.items[itemIndex].unit_price * quantity;
          }
          
          // Recalculate cart total
          updatedCart.total = updatedCart.items.reduce((sum, item) => sum + item.total_price, 0);
          
          // Update cart state immediately
          setCart(updatedCart);
        }
        
        // Trigger cart update events immediately
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdate', Date.now().toString());
        
        // Fetch from server in background to sync
        setTimeout(() => fetchCart(), 100);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      
      // Refresh cart on error to ensure consistency
      await fetchCart();
      toast.error(error.response?.data?.detail || 'Failed to update quantity');
      throw error; // Re-throw to allow proper error handling in components
    }
  };

  const removeFromCart = async (productId, color, size) => {
    try {
      // Update UI immediately
      const updatedCart = { ...cart };
      const itemIndex = updatedCart.items.findIndex(item => 
        item.product_id === productId && 
        item.color === color && 
        item.size === size
      );
      
      if (itemIndex !== -1) {
        // Remove item from local cart
        updatedCart.items.splice(itemIndex, 1);
        
        // Recalculate total
        updatedCart.total = updatedCart.items.reduce((sum, item) => sum + item.total_price, 0);
        
        // Update cart state immediately
        setCart(updatedCart);
        
        // Show success message immediately
        toast.success('Removed from cart');
        
        // Trigger cart update events
        window.dispatchEvent(new Event('cartUpdated'));
        localStorage.setItem('cartUpdate', Date.now().toString());
      }
      
      // Send to backend
      await axios.delete(`${API_URL}/cart/remove/${productId}?color=${color}&size=${size}`);
      
      // Sync with backend after short delay
      setTimeout(() => fetchCart(), 200);
      
    } catch (error) {
      console.error('Error removing from cart:', error);
      
      // Revert on error
      await fetchCart();
      toast.error('Failed to remove from cart');
    }
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => {
        setUser(response.data);
        fetchCart();
      }).catch(() => {
        localStorage.removeItem('token');
      });
    } else {
      fetchCart();
    }
  }, []);

  return (
    <AppContext.Provider value={{
      user, cart, loading,
      login, logout, register, fetchCart,
      addToCart, updateCartQuantity, removeFromCart
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Header Component - EXACT replica with cart counter and menu
export const Header = () => {
  const { cart, fetchCart } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState("2,86,352");
  
  const totalItems = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const cartTotal = cart.total || 0;

  // Force cart refresh when component mounts or updates
  useEffect(() => {
    fetchCart();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCart();
    };
    
    // Set up multiple listeners for cart updates
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Also listen for storage events for cross-tab updates
    const handleStorageChange = (e) => {
      if (e.key === 'cartUpdate') {
        fetchCart();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // More frequent refresh to ensure cart stays in sync
    const intervalId = setInterval(() => {
      fetchCart();
    }, 3000); // Every 3 seconds
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [fetchCart]);

  return (
    <>
      <div className="bg-yellow-300 p-4 relative">
        <div className="container mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black">DRIBBLE</h1>
            <p className="text-sm text-gray-700">bulk t-shirts for Brands & Agency</p>
            <div className="mt-2">
              <span className="text-sm text-gray-700">~ {currentQuantity} pcs sold in previous month ~</span>
            </div>
            <div className="flex justify-center gap-4 mt-3">
              <button 
                onClick={() => setShowPricing(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => setShowCart(true)}
                className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 transition-colors relative"
              >
                🛒 Cart
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <button 
                onClick={() => window.location.href = '/checkout'}
                className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition-colors"
              >
                Order Now
              </button>
            </div>
          </div>
          
          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="absolute top-4 left-4 bg-gray-600 text-white p-2 rounded hover:bg-gray-700 transition-colors"
          >
            <div className="grid grid-cols-3 gap-1 w-4 h-4">
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white rounded"></div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Side Menu Overlay */}
      {showMenu && <SideMenu onClose={() => setShowMenu(false)} />}
      
      {/* Cart Modal */}
      {showCart && <CartModal onClose={() => setShowCart(false)} />}
      
      {/* Pricing Modal */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </>
  );
};

// Cart Modal Component
export const CartModal = ({ onClose }) => {
  const { cart, removeFromCart, fetchCart, updateCartQuantity } = useApp();
  const [localQuantities, setLocalQuantities] = useState({});
  const [stockInfo, setStockInfo] = useState({});
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalData, setStockModalData] = useState(null);
  const updateTimeouts = useRef({});

  useEffect(() => {
    fetchCart();
  }, []);

  // Initialize local quantities when cart loads
  useEffect(() => {
    if (cart.items) {
      const quantities = {};
      cart.items.forEach(item => {
        const key = `${item.product_id}-${item.color}-${item.size}`;
        quantities[key] = item.quantity;
      });
      setLocalQuantities(quantities);
      
      // Fetch stock info for all cart items
      fetchStockInfo();
    }
  }, [cart.items]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const fetchStockInfo = async () => {
    if (!cart.items || cart.items.length === 0) return;
    
    const stockData = {};
    for (const item of cart.items) {
      try {
        const response = await axios.get(`${API_URL}/products/${item.product_id}/stock`);
        const variantKey = `${item.color}-${item.size}`;
        if (response.data.variants[variantKey]) {
          const key = `${item.product_id}-${item.color}-${item.size}`;
          stockData[key] = response.data.variants[variantKey].stock_quantity;
        }
      } catch (error) {
        console.error('Error fetching stock info:', error);
      }
    }
    setStockInfo(stockData);
  };

  const handleRemoveItem = async (productId, color, size) => {
    try {
      await removeFromCart(productId, color, size);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const handleQuantityChange = (item, newQuantity) => {
    const key = `${item.product_id}-${item.color}-${item.size}`;
    let quantity = parseInt(newQuantity) || 0;
    
    // Ensure minimum quantity is 1 (except for explicit 0 to remove)
    if (quantity < 0) quantity = item.quantity; // Revert invalid input
    
    const availableStock = stockInfo[key] || 999;
    
    // Check if quantity exceeds available stock
    if (quantity > availableStock && quantity > 0) {
      setStockModalData({
        productName: item.product_name,
        color: item.color,
        size: item.size,
        availableStock: availableStock,
        requestedQuantity: quantity
      });
      setShowStockModal(true);
      return; // Don't update if exceeds stock
    }
    
    // Update local state immediately for instant UI response
    setLocalQuantities(prev => ({ ...prev, [key]: quantity }));
    
    // Clear any existing timeout for this item
    if (updateTimeouts.current[key]) {
      clearTimeout(updateTimeouts.current[key]);
    }
    
    // Set up immediate update for UI, delayed sync with backend
    updateTimeouts.current[key] = setTimeout(async () => {
      try {
        if (quantity === 0) {
          // Remove item completely
          await removeFromCart(item.product_id, item.color, item.size);
        } else {
          // Update quantity
          await updateCartQuantity(item.product_id, item.color, item.size, quantity);
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
        
        // Check if it's a stock error
        if (error.response?.status === 400 && error.response?.data?.detail?.includes('stock')) {
          const stockMatch = error.response.data.detail.match(/Only (\d+) units available/);
          const availableStock = stockMatch ? parseInt(stockMatch[1]) : 0;
          
          setStockModalData({
            productName: item.product_name,
            color: item.color,
            size: item.size,
            availableStock: availableStock,
            requestedQuantity: quantity
          });
          setShowStockModal(true);
        }
        
        // Revert to original quantity on error
        setLocalQuantities(prev => ({ ...prev, [key]: item.quantity }));
      }
      
      delete updateTimeouts.current[key];
    }, 150); // Very short delay for responsive feel
  };

  const handleQuantityBlur = (item) => {
    const key = `${item.product_id}-${item.color}-${item.size}`;
    const newQuantity = localQuantities[key];
    
    // Ensure we have a valid quantity on blur
    if (newQuantity === undefined || newQuantity === null || newQuantity === '') {
      setLocalQuantities(prev => ({ ...prev, [key]: item.quantity }));
      return;
    }
    
    // Clear any pending timeout and trigger immediate update
    if (updateTimeouts.current[key]) {
      clearTimeout(updateTimeouts.current[key]);
      delete updateTimeouts.current[key];
      
      // Trigger immediate update
      const quantity = parseInt(newQuantity) || item.quantity;
      if (quantity !== item.quantity) {
        handleQuantityChange(item, quantity);
      }
    }
  };

  const handleCheckout = () => {
    if (cart.items && cart.items.length > 0) {
      window.location.href = '/checkout';
    } else {
      toast.error('Your cart is empty');
    }
  };

  const cartItems = cart.items || [];
  const cartTotal = cart.total || 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl relative max-h-[85vh] overflow-hidden mx-4">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Shopping Cart</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <button 
                  onClick={onClose}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item, index) => {
                  const key = `${item.product_id}-${item.color}-${item.size}`;
                  const currentQuantity = localQuantities[key] ?? item.quantity;
                  const availableStock = stockInfo[key] || 0;
                  
                  return (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{item.product_name || 'Product'}</h3>
                          <p className="text-sm text-gray-600">{item.color} - {item.size}</p>
                          <p className="text-sm font-medium text-green-600">₹{item.unit_price} per piece</p>
                          {availableStock > 0 && (
                            <p className="text-xs text-blue-600">Stock: {availableStock} units available</p>
                          )}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              max={availableStock}
                              value={currentQuantity}
                              onChange={(e) => handleQuantityChange(item, e.target.value)}
                              onBlur={() => handleQuantityBlur(item)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* Item Total */}
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{(item.unit_price * currentQuantity).toFixed(2)}</p>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.product_id, item.color, item.size)}
                            className="text-red-500 hover:text-red-700 px-3 py-2 rounded-lg border border-red-500 hover:bg-red-50 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-3xl font-bold text-blue-600">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Availability Modal */}
      {showStockModal && stockModalData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowStockModal(false)}></div>
          <div className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-md w-full relative">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Limited Stock Available</h3>
              <p className="text-gray-600 mb-4">
                <span className="font-medium">{stockModalData.productName}</span><br />
                <span className="text-sm">Color: {stockModalData.color} | Size: {stockModalData.size}</span>
              </p>
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <p className="text-orange-800">
                  <span className="font-bold">Only {stockModalData.availableStock} units</span> are available in stock.
                </p>
                <p className="text-orange-600 text-sm mt-1">
                  You requested {stockModalData.requestedQuantity} units.
                </p>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Got it, I'll adjust the quantity
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Side Menu Component - EXACT replica of the popup menu
export const SideMenu = ({ onClose }) => {
  const { user, login, logout } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [showModal, setShowModal] = useState('');

  const openModal = (modalType) => {
    setShowModal(modalType);
  };

  const closeModal = () => {
    setShowModal('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="w-80 bg-slate-600 h-full shadow-xl relative text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Close
          </button>
          
          <div className="p-6 pt-16">
            {/* User Section */}
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-slate-500 rounded-full flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                {user ? (
                  <div>
                    <p className="font-semibold">{user.full_name}</p>
                    <button onClick={logout} className="text-sm text-gray-300 hover:text-white">Logout</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <div 
                onClick={() => openModal('delivery')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                Delivery Details
              </div>
              <div 
                onClick={() => openModal('orders')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                Orders/Bills/Tracking
              </div>
              <div 
                onClick={() => openModal('shipping')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                Shipping Calculator
              </div>
              <div 
                onClick={() => openModal('stock')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer flex items-center"
              >
                Live Stock <span className="ml-2 w-2 h-2 bg-green-400 rounded-full"></span>
              </div>
              <div 
                onClick={() => openModal('pricing')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                Pricing
              </div>
              <div 
                onClick={() => openModal('videos')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                Videos
              </div>
              <div 
                onClick={() => openModal('suggestions')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                Suggestions
              </div>
              <div 
                onClick={() => openModal('contact')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                Contact us
              </div>
              <div 
                onClick={() => openModal('about')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                About us
              </div>
              <div 
                onClick={() => openModal('faq')}
                className="text-white py-3 px-4 hover:bg-slate-500 rounded cursor-pointer"
              >
                FAQ
              </div>
            </div>

            {/* Weather */}
            <div className="mt-8 flex items-center text-orange-400">
              <span className="text-2xl mr-2">☀️</span>
              <span>30°C</span>
            </div>
          </div>
        </div>
        
        {/* Login Modal */}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>

      {/* Modal Components */}
      {showModal === 'delivery' && <DeliveryDetailsModal onClose={closeModal} />}
      {showModal === 'orders' && <OrdersTrackingModal onClose={closeModal} />}
      {showModal === 'shipping' && <ShippingCalculatorModal onClose={closeModal} />}
      {showModal === 'stock' && <LiveStockModal onClose={closeModal} />}
      {showModal === 'pricing' && <PricingModal onClose={closeModal} />}
      {showModal === 'videos' && <VideosModal onClose={closeModal} />}
      {showModal === 'suggestions' && <SuggestionsModal onClose={closeModal} />}
      {showModal === 'contact' && <ContactUsModal onClose={closeModal} />}
      {showModal === 'about' && <AboutUsModal onClose={closeModal} />}
      {showModal === 'faq' && <FAQModal onClose={closeModal} />}
    </>
  );
};

// Login Modal Component
export const LoginModal = ({ onClose }) => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = isLogin 
      ? await login(formData.email, formData.password)
      : await register(formData);
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isLogin ? 'Login' : 'Register'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Navigation Component - EXACT replica with highlighting and proper layout
export const Navigation = ({ onCategorySelect, selectedCategory }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories with exact original names
        setCategories([
          { id: 1, name: "Oversize 210gsm", color: "bg-red-500" },
          { id: 2, name: "Oversize 240gsm", color: "bg-orange-500" },
          { id: 3, name: "Kids Rneck", color: "bg-yellow-500" },
          { id: 4, name: "Oversize 180gsm", color: "bg-green-500" },
          { id: 5, name: "True Bio Rneck", color: "bg-blue-500" },
          { id: 6, name: "Bio Rneck", color: "bg-purple-500" },
          { id: 7, name: "Non Bio Rneck", color: "bg-pink-500" },
          { id: 8, name: "Sublimation tshirt", color: "bg-indigo-500" },
          { id: 9, name: "Premium Polo", color: "bg-red-600" },
          { id: 10, name: "Cotton Polo", color: "bg-orange-600" },
          { id: 11, name: "Hoodie 320gsm-1", color: "bg-yellow-600" },
          { id: 12, name: "Hoodie 320gsm-2", color: "bg-green-600" },
          { id: 13, name: "Sweatshirt", color: "bg-blue-600" },
          { id: 14, name: "Varsity", color: "bg-purple-600" },
          { id: 15, name: "Dropsho Hoodie 430gsm", color: "bg-pink-600" },
          { id: 16, name: "Shorts", color: "bg-indigo-600" },
          { id: 17, name: "Gym vest", color: "bg-red-700" },
          { id: 18, name: "AcidWash OS", color: "bg-orange-700" },
          { id: 19, name: "AcidWash RF", color: "bg-yellow-700" }
        ]);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category.name);
    }
  };

  return (
    <div className="bg-gray-100 px-4 py-2">
      <div className="container mx-auto">
        <div className="flex flex-wrap gap-1 justify-center">
          {categories.map((category, index) => {
            const isSelected = selectedCategory === category.name;
            return (
              <button
                key={category.id || index}
                onClick={() => handleCategoryClick(category)}
                className={`px-3 py-1 text-xs font-semibold transition-all ${
                  isSelected 
                    ? 'bg-purple-600 text-white' 
                    : `${category.color || 'bg-gray-500'} text-white hover:opacity-80`
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
        
        {/* Right side buttons - exactly like original */}
        <div className="flex justify-end mt-2 gap-2">
          <button className="bg-blue-600 text-white px-3 py-1 text-xs rounded">#Photos</button>
          <button className="bg-purple-600 text-white px-3 py-1 text-xs rounded">#SizeChart</button>
          <button className="bg-green-600 text-white px-3 py-1 text-xs rounded">Add to cart</button>
        </div>
      </div>
    </div>
  );
};

// Product Info Component - EXACT replica
export const ProductInfo = () => {
  const [productInfo, setProductInfo] = useState({
    title: "Oversized Drop-shoulder, 210gsm, Terry cotton/Longjohit Heavy Gauge, 100% Cotton",
    subtitle: "Super fine stitched Premium Quality Red Lable Fabric"
  });

  return (
    <div className="bg-yellow-100 p-4">
      <div className="container mx-auto text-center">
        <h2 className="text-lg font-bold text-black mb-2">
          {productInfo.title}
        </h2>
        <p className="text-sm text-gray-700">
          {productInfo.subtitle}
        </p>
      </div>
    </div>
  );
};

// Size Chart Component - EXACT compact layout like original website
export const SizeChart = ({ productId, selectedCategory }) => {
  const { addToCart } = useApp();
  const [sizeChartData, setSizeChartData] = useState({
    colors: ['Black', 'White', 'Lavender', 'Beige', 'Red', 'Sage Green', 'Brown', 'Off-white', 'Orange', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    pricing: {
      bulk: { quantity: "15pcs", price: "175₹" },
      regular: { quantity: "15pcs", price: "210₹" }
    }
  });

  const [quantities, setQuantities] = useState({});
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState({});

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        let productToLoad = null;
        
        if (selectedCategory) {
          console.log('Fetching product for category:', selectedCategory);
          const response = await axios.get(`${API_URL}/products?category=${encodeURIComponent(selectedCategory)}&limit=1`);
          if (response.data && response.data.length > 0) {
            productToLoad = response.data[0];
            console.log('Loaded product for category:', productToLoad.name);
          }
        }
        
        if (!productToLoad) {
          console.log('Fetching default product...');
          const response = await axios.get(`${API_URL}/products?limit=1`);
          if (response.data && response.data.length > 0) {
            productToLoad = response.data[0];
            console.log('Loaded default product:', productToLoad.name);
          }
        }

        if (productToLoad) {
          setProduct(productToLoad);
          
          const inventoryMap = {};
          if (productToLoad.variants) {
            productToLoad.variants.forEach(variant => {
              const key = `${variant.color}-${variant.size}`;
              inventoryMap[key] = variant.stock_quantity || 0;
            });
          }
          setInventory(inventoryMap);
          
          try {
            const sizeChartResponse = await axios.get(`${API_URL}/products/${productToLoad.id}/sizechart`);
            setSizeChartData(sizeChartResponse.data);
          } catch (error) {
            console.log('Using default size chart data');
          }
        } else {
          console.log('No product found, using fallback');
          const fallbackProduct = {
            id: 'demo-product-1',
            name: selectedCategory || 'Oversized Drop-shoulder, 210gsm, Terry cotton/Loopknit Heavy Gauge, 100% Cotton',
            category: selectedCategory || 'Oversize 210gsm',
            base_price: 319,
            bulk_price: 279,
            variants: []
          };
          
          const demoInventory = {};
          sizeChartData.colors.forEach(color => {
            sizeChartData.sizes.forEach(size => {
              const key = `${color}-${size}`;
              demoInventory[key] = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 50) + 1;
            });
          });
          
          setProduct(fallbackProduct);
          setInventory(demoInventory);
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        
        // Set fallback product to prevent "Product not loaded" error
        const fallbackProduct = {
          id: 'demo-product-1',
          name: selectedCategory || 'Oversized Drop-shoulder, 210gsm, Terry cotton/Loopknit Heavy Gauge, 100% Cotton',
          category: selectedCategory || 'Oversize 210gsm',
          base_price: 319,
          bulk_price: 279,
          variants: []
        };
        
        setProduct(fallbackProduct);
        
        const demoInventory = {};
        sizeChartData.colors.forEach(color => {
          sizeChartData.sizes.forEach(size => {
            const key = `${color}-${size}`;
            demoInventory[key] = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 50) + 1;
          });
        });
        setInventory(demoInventory);
      }
    };
    
    fetchProductData();
    setQuantities({});
  }, [productId, selectedCategory]);

  const handleQuantityChange = (color, size, quantity) => {
    const key = `${color}-${size}`;
    const numQuantity = parseInt(quantity) || 0;
    const availableStock = inventory[key] || 0;
    
    if (numQuantity > availableStock) {
      toast.error(`Only ${availableStock} pieces available for ${color} ${size}`);
      return;
    }
    
    setQuantities(prev => {
      const updated = { ...prev };
      if (numQuantity === 0) {
        delete updated[key];
      } else {
        updated[key] = numQuantity;
      }
      return updated;
    });
  };

  const calculateTotal = () => {
    const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    if (totalQuantity === 0) return { totalQuantity: 0, totalPrice: 0, isBulk: false, pricePerItem: 0 };
    
    const bulkThreshold = parseInt(sizeChartData.pricing.bulk.quantity.replace(/[^\d]/g, ''));
    const isBulk = totalQuantity >= bulkThreshold;
    
    const bulkPrice = parseFloat(sizeChartData.pricing.bulk.price.replace('₹', ''));
    const regularPrice = parseFloat(sizeChartData.pricing.regular.price.replace('₹', ''));
    
    const pricePerItem = isBulk ? bulkPrice : regularPrice;
    const totalPrice = totalQuantity * pricePerItem;
    
    return {
      totalQuantity,
      totalPrice,
      isBulk,
      pricePerItem,
      bulkPrice,
      regularPrice,
      bulkThreshold
    };
  };

  const handleAddToCart = async () => {
    if (!product) {
      toast.error('Product not loaded');
      return;
    }

    const quantityEntries = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    if (quantityEntries.length === 0) {
      toast.error('Please enter quantities for at least one size and color combination');
      return;
    }

    try {
      let totalAdded = 0;
      for (const [key, quantity] of quantityEntries) {
        const [color, size] = key.split('-');
        const success = await addToCart(product.id, color, size, quantity);
        if (success) {
          totalAdded += quantity;
        }
      }
      
      if (totalAdded > 0) {
        setQuantities({});
        toast.success(`Added ${totalAdded} items to cart!`);
        
        // Trigger multiple update mechanisms
        setTimeout(() => {
          window.dispatchEvent(new Event('cartUpdated'));
          localStorage.setItem('cartUpdate', Date.now().toString());
          
          // Force a direct app context update
          window.dispatchEvent(new CustomEvent('forceCartRefresh'));
        }, 100);
      }
    } catch (error) {
      toast.error('Failed to add items to cart');
    }
  };

  const total = calculateTotal();

  return (
    <div className="container mx-auto px-4 py-2">
      {/* Product Description - EXACT like original */}
      <div className="bg-yellow-100 p-3 text-center mb-1">
        <h2 className="text-lg font-bold text-black">
          {product ? product.name : 'Oversized Drop-shoulder, 210gsm, Terry cotton/Loopknit Heavy Gauge, 100% Cotton'}
        </h2>
        <p className="text-sm text-gray-700">Supercombed Premium Quality Red Lable Fabric</p>
      </div>
      
      {/* Size Chart Table - COMPACT DESIGN */}
      <div className="bg-white border border-gray-300">
        <table className="w-full" style={{borderCollapse: 'collapse'}}>
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="border border-gray-300 py-2 px-3 text-left font-bold text-sm">
                {sizeChartData.chart_code || 'OS210'}
              </th>
              {sizeChartData.sizes.map(size => (
                <th key={size} className="border border-gray-300 py-2 px-3 text-center font-bold text-sm bg-red-500">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeChartData.colors.map((color, index) => (
              <tr key={color}>
                <td className="border border-gray-300 py-1 px-3 font-semibold text-center text-sm bg-gray-50">
                  {color}
                </td>
                {sizeChartData.sizes.map(size => {
                  const key = `${color}-${size}`;
                  const stockQuantity = inventory[key] || 0;
                  const isOutOfStock = stockQuantity === 0;
                  
                  return (
                    <td key={size} className="border border-gray-300 p-1 text-center">
                      {isOutOfStock ? (
                        <div className="w-full h-8 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">✕</span>
                        </div>
                      ) : (
                        <input 
                          type="number" 
                          min="0"
                          max={stockQuantity}
                          className="w-full h-8 text-center border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          value={quantities[key] || ''}
                          onChange={(e) => handleQuantityChange(color, size, e.target.value)}
                          placeholder=""
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pricing Section - EXACT like original */}
        <div className="bg-yellow-200 border-t border-gray-300">
          <table className="w-full" style={{borderCollapse: 'collapse'}}>
            <tbody>
              <tr>
                <td className="border border-gray-300 py-2 px-3 font-bold text-center">Size</td>
                <td className="border border-gray-300 py-2 px-3 font-bold text-center">More than 15pcs</td>
                <td className="border border-gray-300 py-2 px-3 font-bold text-center">Less than 15pcs</td>
              </tr>
              <tr>
                <td className="border border-gray-300 py-2 px-3 font-bold text-center">S to XXL</td>
                <td className="border border-gray-300 py-2 px-3 font-bold text-center text-green-600">
                  {sizeChartData.pricing.bulk.price}
                </td>
                <td className="border border-gray-300 py-2 px-3 font-bold text-center text-red-600">
                  {sizeChartData.pricing.regular.price}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="bg-purple-100 p-2 text-center border-t border-gray-300">
          <button className="bg-purple-600 text-white px-4 py-1 text-sm font-semibold hover:bg-purple-700 transition-colors mr-2">
            Photos
          </button>
          <button className="bg-purple-600 text-white px-4 py-1 text-sm font-semibold hover:bg-purple-700 transition-colors">
            SizeChart
          </button>
        </div>
      </div>

      {/* Order Summary - Show only when items selected */}
      {total.totalQuantity > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-200">
          <h3 className="font-bold text-lg mb-2">Order Summary:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between">
                <span>Total Quantity:</span>
                <span className="font-bold">{total.totalQuantity} pieces</span>
              </div>
              <div className="flex justify-between">
                <span>Pricing Tier:</span>
                <span className={`font-bold ${total.isBulk ? 'text-green-600' : 'text-orange-600'}`}>
                  {total.isBulk ? 'Bulk Rate' : 'Regular Rate'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price per piece:</span>
                <span className="font-bold">₹{total.pricePerItem}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">
                {total.isBulk ? 
                  `Bulk rate applied (${total.totalQuantity} ≥ ${total.bulkThreshold})` : 
                  `Need ${total.bulkThreshold - total.totalQuantity} more for bulk rate`
                }
              </div>
              <div className="text-2xl font-bold text-blue-600">
                Total: ₹{total.totalPrice}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={handleAddToCart}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Add {total.totalQuantity} items to Cart (₹{total.totalPrice})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Content Section - EXACT replica
export const ContentSection = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-8 text-center min-h-[300px] flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Wholesale plain t-shirts manufacturer in India with huge ready stock.
        </h2>
        <p className="text-lg text-gray-700 mb-2">
          Perfect for t-shirt printing businesses and bulk orders.
        </p>
        <p className="text-lg text-gray-700">
          Premium quality blank t-shirts and plain hoodies for DTG, Screen and DTF printing.
        </p>
      </div>
    </div>
  );
};

// FAQ Component - EXACT replica
export const FAQ = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  
  const faqs = [
    {
      question: "What is your minimum order quantity (MOQ)?",
      answer: "Our minimum order quantity is 15 pieces per design. For orders less than 15 pieces, different pricing applies."
    },
    {
      question: "Request form and shipping method?",
      answer: "We accept orders through our website, email, and WhatsApp. We ship via professional courier services across India."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept bank transfers, UPI payments, credit/debit cards, and for regular customers, we also provide credit terms."
    },
    {
      question: "What products do you manufacture and sell?",
      answer: "We manufacture and sell a wide range of blank apparel including oversized t-shirts, polo shirts, hoodies, sweatshirts, shorts, and activewear in various GSM options."
    }
  ];

  const handleFAQClick = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4 bg-white rounded-lg shadow">
              <button
                className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => handleFAQClick(index)}
              >
                <span className="font-semibold text-gray-800">{faq.question}</span>
                <span className="text-2xl text-gray-500">
                  {openFAQ === index ? '−' : '+'}
                </span>
              </button>
              {openFAQ === index && (
                <div className="p-4 pt-0 text-gray-600 animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Footer Component - EXACT replica
export const Footer = () => {
  const links = [
    "Privacy Policy",
    "Shipping and Delivery Policy", 
    "Return and Refund Policy",
    "Terms and Conditions",
    "Disclaimer",
    "Sitemap"
  ];

  return (
    <footer className="bg-yellow-200 py-6">
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {links.map((link, index) => (
            <a 
              key={index}
              href="#" 
              className="text-sm text-gray-700 hover:text-gray-900 hover:underline transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="text-center text-sm text-gray-600">
          <p>Made in India</p>
          <p className="mt-2">© 2025 DRIBBLE - All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

// Admin Login Component
export const AdminLogin = () => {
  const { login } = useApp();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData.email, formData.password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};