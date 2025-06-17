import React, { useState, useEffect, useContext, createContext } from 'react';
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

  // Authentication functions (same as before)
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

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart({ items: [], total: 0 });
    toast.success('Logged out successfully');
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
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
      return false;
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
      login, logout, fetchCart
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

// Header Component - EXACT replica of original
export const Header = () => {
  const [currentQuantity, setCurrentQuantity] = useState("2,56,352");
  
  return (
    <div className="bg-yellow-300 p-4">
      <div className="container mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black">DRIBBLE</h1>
          <p className="text-sm text-gray-700">bulk t-shirts for Brands & Agency</p>
          <div className="mt-2">
            <span className="text-sm text-gray-700">~ {currentQuantity} pcs sold in previous month ~</span>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <button className="bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 transition-colors">
              Pricing
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 transition-colors">
              🛒 Cart
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition-colors">
              Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Component - EXACT replica with editable categories
export const Navigation = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories if API fails
        setCategories([
          { name: "Oversize 210gsm", color: "bg-red-500" },
          { name: "Oversize 240gsm", color: "bg-orange-500" },
          { name: "Kids Kneck", color: "bg-yellow-500" },
          { name: "Oversize 190gsm", color: "bg-green-500" },
          { name: "Tue Bio Kneck", color: "bg-blue-500" },
          { name: "Bio Kneck", color: "bg-purple-500" },
          { name: "Polo Shirts", color: "bg-pink-500" },
          { name: "Sublimation", color: "bg-indigo-500" },
          { name: "Premium Polo", color: "bg-red-600" },
          { name: "Cotton Polo", color: "bg-orange-600" },
          { name: "Hoodie 320gsm", color: "bg-yellow-600" },
          { name: "Hoodie 270gsm", color: "bg-green-600" },
          { name: "Sweatshirt", color: "bg-blue-600" },
          { name: "Varsity", color: "bg-purple-600" },
          { name: "Dropship Hoodie 430gsm", color: "bg-pink-600" },
          { name: "Shorts", color: "bg-indigo-600" },
          { name: "Gym vest", color: "bg-red-700" },
          { name: "Activework OS", color: "bg-orange-700" },
          { name: "Activework BF", color: "bg-yellow-700" }
        ]);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="bg-gray-100 p-2">
      <div className="container mx-auto">
        <div className="flex flex-wrap gap-1 justify-center">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`${category.color || 'bg-gray-500'} text-white px-3 py-1 text-xs rounded hover:opacity-80 transition-opacity`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="text-center mt-2">
          <button className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition-colors">
            Plugins available
          </button>
          <span className="ml-2 text-sm text-gray-600">Add to cart</span>
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

// Size Chart Component - EXACT replica with working cart functionality
export const SizeChart = ({ productId }) => {
  const { addToCart } = useApp();
  const [sizeChartData, setSizeChartData] = useState({
    colors: ['Black', 'White', 'Lavender', 'Beige', 'Red', 'Sage Green', 'Brown', 'Maroon', 'Orange', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    pricing: {
      bulk: { quantity: "15pcs", price: "279₹" },
      regular: { quantity: "15pcs", price: "319₹" }
    }
  });

  const [selectedItems, setSelectedItems] = useState({});
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Fetch size chart data for specific product
    const fetchSizeChart = async () => {
      try {
        if (productId) {
          const response = await axios.get(`${API_URL}/products/${productId}/sizechart`);
          setSizeChartData(response.data);
        }
        
        // Also fetch product details for cart operations
        const productResponse = await axios.get(`${API_URL}/products`);
        if (productResponse.data && productResponse.data.length > 0) {
          setProduct(productResponse.data[0]); // Use first product for demo
        }
      } catch (error) {
        console.error('Error fetching size chart:', error);
      }
    };
    fetchSizeChart();
  }, [productId]);

  const handleCheckboxChange = (color, size) => {
    const key = `${color}-${size}`;
    setSelectedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculate total selected items and pricing
  const calculateTotal = () => {
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    if (selectedCount === 0) return { count: 0, total: 0, isBulk: false };
    
    const isBulk = selectedCount >= parseInt(sizeChartData.pricing.bulk.quantity.replace('pcs', ''));
    const pricePerItem = isBulk ? 
      parseFloat(sizeChartData.pricing.bulk.price.replace('₹', '')) : 
      parseFloat(sizeChartData.pricing.regular.price.replace('₹', ''));
    
    return {
      count: selectedCount,
      total: selectedCount * pricePerItem,
      isBulk,
      pricePerItem
    };
  };

  const handleAddToCart = async () => {
    if (!product) {
      toast.error('Product not loaded');
      return;
    }

    const selectedKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
    if (selectedKeys.length === 0) {
      toast.error('Please select at least one size and color combination');
      return;
    }

    try {
      // Add each selected combination to cart
      for (const key of selectedKeys) {
        const [color, size] = key.split('-');
        await addToCart(product.id, color, size, 1);
      }
      
      // Clear selections after adding to cart
      setSelectedItems({});
      toast.success(`Added ${selectedKeys.length} items to cart!`);
    } catch (error) {
      toast.error('Failed to add items to cart');
    }
  };

  const total = calculateTotal();

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="border border-gray-300 p-3 text-left font-bold">OS210</th>
              {sizeChartData.sizes.map(size => (
                <th key={size} className="border border-gray-300 p-3 text-center font-bold">{size}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeChartData.colors.map((color, index) => (
              <tr key={color} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 p-3 font-semibold text-center">{color}</td>
                {sizeChartData.sizes.map(size => (
                  <td key={size} className="border border-gray-300 p-3 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer"
                      checked={selectedItems[`${color}-${size}`] || false}
                      onChange={() => handleCheckboxChange(color, size)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="bg-yellow-200 p-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="font-bold text-lg">Size</span>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="font-bold">More than {sizeChartData.pricing.bulk.quantity}</div>
                <div className="text-lg font-bold text-green-600">{sizeChartData.pricing.bulk.price}</div>
              </div>
              <div className="text-center">
                <div className="font-bold">Less than {sizeChartData.pricing.regular.quantity}</div>
                <div className="text-lg font-bold text-red-600">{sizeChartData.pricing.regular.price}</div>
              </div>
            </div>
          </div>

          {/* Selection Summary */}
          {total.count > 0 && (
            <div className="bg-white p-4 rounded-lg mb-4 border-2 border-blue-300">
              <h3 className="font-bold text-lg mb-2">Selection Summary:</h3>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-700">Selected: </span>
                  <span className="font-bold">{total.count} items</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({total.isBulk ? 'Bulk' : 'Regular'} pricing)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">₹{total.pricePerItem} per item</div>
                  <div className="text-xl font-bold text-blue-600">
                    Total: ₹{total.total}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors">
                Product
              </button>
              <button className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors">
                Live/Cart
              </button>
            </div>
            
            {total.count > 0 && (
              <button
                onClick={handleAddToCart}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-bold"
              >
                Add {total.count} items to Cart (₹{total.total})
              </button>
            )}
          </div>
        </div>
      </div>
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