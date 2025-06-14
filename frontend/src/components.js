import React, { useState, useEffect, useContext, createContext } from 'react';
import { ShoppingCart, User, Search, Star, Plus, Minus, Trash2, Package, CreditCard, Truck, Shield } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://www.dribble-sports.com';
const API_URL = `${API_BASE}/api`;

// Context for global state
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  // Authentication
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
      const { access_token, user: newUser } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(newUser);
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/cart`, { headers });
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, color, size, quantity = 1) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(`${API_URL}/cart/add`, {
        product_id: productId,
        color,
        size,
        quantity
      }, { headers });
      
      await fetchCart();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const removeFromCart = async (productId, color, size) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.delete(`${API_URL}/cart/remove/${productId}?color=${color}&size=${size}`, { headers });
      await fetchCart();
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove from cart');
    }
  };

  // Initialize user on app load
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
      login, register, logout,
      addToCart, removeFromCart, fetchCart
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

// Header Component
export const Header = () => {
  const { user, cart, logout } = useApp();
  const [showCart, setShowCart] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex justify-between items-center py-2 text-sm">
          <div>
            <span>🏆 Premium Sports Apparel for Athletes</span>
          </div>
          <div className="flex gap-4">
            <span>📞 +91 98765 43210</span>
            <span>📧 orders@dribble-sports.com</span>
          </div>
        </div>
        
        {/* Main header */}
        <div className="border-t border-blue-500 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-3xl font-bold">
                <span className="text-yellow-300">DRIBBLE</span>
                <span className="text-white">.com</span>
              </h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="hover:text-yellow-300 transition-colors">Home</a>
                <a href="#products" className="hover:text-yellow-300 transition-colors">Products</a>
                <a href="#about" className="hover:text-yellow-300 transition-colors">About</a>
                <a href="#contact" className="hover:text-yellow-300 transition-colors">Contact</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 placeholder-white/70 text-white"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
              </div>
              
              {/* Cart */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cart.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              
              {/* User */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <User className="w-6 h-6" />
                  <span className="hidden md:block">{user ? user.full_name : 'Login'}</span>
                </button>
                
                {/* User dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {user ? (
                    <div className="py-2">
                      <div className="px-4 py-2 border-b">
                        <p className="font-semibold">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <a href="#orders" className="block px-4 py-2 hover:bg-gray-100">My Orders</a>
                      <a href="#profile" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
                      {user.is_admin && (
                        <a href="#admin" className="block px-4 py-2 hover:bg-gray-100">Admin Panel</a>
                      )}
                      <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <LoginForm />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cart Sidebar */}
      {showCart && <CartSidebar onClose={() => setShowCart(false)} />}
    </div>
  );
};

// Product Categories Navigation
export const CategoryNavigation = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="bg-gray-100 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category, index) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                index % 6 === 0 ? 'bg-red-500 text-white' :
                index % 6 === 1 ? 'bg-blue-500 text-white' :
                index % 6 === 2 ? 'bg-green-500 text-white' :
                index % 6 === 3 ? 'bg-purple-500 text-white' :
                index % 6 === 4 ? 'bg-orange-500 text-white' :
                'bg-pink-500 text-white'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Hero Section
export const HeroSection = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Premium Sports Apparel for <span className="text-blue-600">Champions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Wholesale manufacturer in India with huge ready stock. Perfect for sports teams, 
              printing businesses, and bulk orders. Premium quality blank apparel for DTG, 
              screen printing, and embroidery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Shop Now
              </button>
              <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Bulk Orders
              </button>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">5,00,000+</div>
                <div className="text-sm text-gray-600">Pieces Sold</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">15+</div>
                <div className="text-sm text-gray-600">Product Types</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-600">Quality Assured</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1716369786631-b8b9c7ac1dc4" 
              alt="Premium Sports Apparel"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="font-semibold">4.9/5</span>
                <span className="text-gray-600">Customer Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Grid
export const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products?limit=20`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading products...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12" id="products">
      <h2 className="text-3xl font-bold text-center mb-12">Our Product Collection</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

// Product Card Component
export const ProductCard = ({ product }) => {
  const { addToCart } = useApp();
  const [selectedColor, setSelectedColor] = useState(product.variants[0]?.color || '');
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size || '');
  const [quantity, setQuantity] = useState(1);

  const availableColors = [...new Set(product.variants.map(v => v.color))];
  const availableSizes = [...new Set(product.variants.filter(v => v.color === selectedColor).map(v => v.size))];

  const selectedVariant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
  const inStock = selectedVariant && selectedVariant.stock_quantity > 0;

  const handleAddToCart = () => {
    if (inStock) {
      addToCart(product.id, selectedColor, selectedSize, quantity);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
      <div className="relative overflow-hidden">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {product.gsm}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Bulk: ₹{product.bulk_price}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-blue-600">₹{product.base_price}</span>
            <span className="text-sm text-gray-500">Bulk: ₹{product.bulk_price}</span>
          </div>
          <p className="text-xs text-gray-500">15+ pieces get bulk pricing</p>
        </div>
        
        {/* Color Selection */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex gap-2">
            {availableColors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-3 py-1 text-xs rounded-full border ${
                  selectedColor === color 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
        
        {/* Size Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
          <div className="flex gap-2">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1 text-xs rounded border ${
                  selectedSize === size 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quantity and Add to Cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-center border rounded-lg">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 min-w-[50px] text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              inStock 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
        
        {selectedVariant && (
          <p className="text-xs text-gray-500 mt-2">
            Stock: {selectedVariant.stock_quantity} pieces
          </p>
        )}
      </div>
    </div>
  );
};

// Cart Sidebar
export const CartSidebar = ({ onClose }) => {
  const { cart, removeFromCart } = useApp();

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    // Navigate to checkout
    onClose();
    toast.success('Proceeding to checkout...');
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <img 
                    src={item.product_image} 
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.product_name}</h3>
                    <p className="text-xs text-gray-500">{item.color} • {item.size}</p>
                    <p className="text-sm font-semibold">₹{item.unit_price} × {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id, item.color, item.size)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total: ₹{cart.total}</span>
            </div>
            <button
              onClick={proceedToCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Login Form Component
export const LoginForm = () => {
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
    if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await register(formData);
    }
  };

  return (
    <div className="p-4 w-80">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`px-4 py-2 ${isLogin ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`px-4 py-2 ${!isLogin ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            Register
          </button>
        </div>
        
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
    </div>
  );
};

// Features Section
export const FeaturesSection = () => {
  const features = [
    {
      icon: <Package className="w-8 h-8 text-blue-600" />,
      title: "Bulk Orders",
      description: "Special pricing for orders of 15+ pieces. Perfect for teams and businesses."
    },
    {
      icon: <CreditCard className="w-8 h-8 text-green-600" />,
      title: "Secure Payments",
      description: "Multiple payment options including cards, UPI, and net banking."
    },
    {
      icon: <Truck className="w-8 h-8 text-orange-600" />,
      title: "Fast Shipping",
      description: "Quick delivery across India. Free shipping on orders above ₹500."
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Quality Assured",
      description: "Premium materials and strict quality control for every product."
    }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose DRIBBLE?</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Footer Component
export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-yellow-300">DRIBBLE</span>.com
            </h3>
            <p className="text-gray-400 mb-4">
              Premium sports apparel manufacturer in India. Quality you can trust, 
              prices you'll love.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">f</div>
              <div className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center">📷</div>
              <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center">t</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">T-Shirts</a></li>
              <li><a href="#" className="hover:text-white">Polo Shirts</a></li>
              <li><a href="#" className="hover:text-white">Hoodies</a></li>
              <li><a href="#" className="hover:text-white">Sports Wear</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Bulk Orders</a></li>
              <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-gray-400">
              <p>📞 +91 98765 43210</p>
              <p>📧 orders@dribble-sports.com</p>
              <p>📍 Mumbai, Maharashtra, India</p>
              <p>🕒 Mon-Sat: 9AM-6PM IST</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 DRIBBLE Sports. All rights reserved. | Made in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
};
