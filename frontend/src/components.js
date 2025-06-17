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
      login, logout, fetchCart,
      addToCart, removeFromCart
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

// Navigation Component - EXACT replica with dynamic product switching
export const Navigation = ({ onCategorySelect }) => {
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
          { id: 1, name: "Oversize 210gsm", color: "bg-red-500" },
          { id: 2, name: "Oversize 240gsm", color: "bg-orange-500" },
          { id: 3, name: "Kids Kneck", color: "bg-yellow-500" },
          { id: 4, name: "Oversize 190gsm", color: "bg-green-500" },
          { id: 5, name: "Tue Bio Kneck", color: "bg-blue-500" },
          { id: 6, name: "Bio Kneck", color: "bg-purple-500" },
          { id: 7, name: "Polo Shirts", color: "bg-pink-500" },
          { id: 8, name: "Sublimation", color: "bg-indigo-500" },
          { id: 9, name: "Premium Polo", color: "bg-red-600" },
          { id: 10, name: "Cotton Polo", color: "bg-orange-600" },
          { id: 11, name: "Hoodie 320gsm", color: "bg-yellow-600" },
          { id: 12, name: "Hoodie 270gsm", color: "bg-green-600" },
          { id: 13, name: "Sweatshirt", color: "bg-blue-600" },
          { id: 14, name: "Varsity", color: "bg-purple-600" },
          { id: 15, name: "Dropship Hoodie 430gsm", color: "bg-pink-600" },
          { id: 16, name: "Shorts", color: "bg-indigo-600" },
          { id: 17, name: "Gym vest", color: "bg-red-700" },
          { id: 18, name: "Activework OS", color: "bg-orange-700" },
          { id: 19, name: "Activework BF", color: "bg-yellow-700" }
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
    <div className="bg-gray-100 p-2">
      <div className="container mx-auto">
        <div className="flex flex-wrap gap-1 justify-center">
          {categories.map((category, index) => (
            <button
              key={category.id || index}
              onClick={() => handleCategoryClick(category)}
              className={`${category.color || 'bg-gray-500'} text-white px-3 py-1 text-xs rounded hover:opacity-80 transition-opacity focus:ring-2 focus:ring-white`}
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

// Size Chart Component - With inventory management and stock validation
export const SizeChart = ({ productId, selectedCategory }) => {
  const { addToCart } = useApp();
  const [sizeChartData, setSizeChartData] = useState({
    colors: ['Black', 'White', 'Lavender', 'Beige', 'Red', 'Sage Green', 'Brown', 'Maroon', 'Orange', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    pricing: {
      bulk: { quantity: "15pcs", price: "279₹" },
      regular: { quantity: "15pcs", price: "319₹" }
    }
  });

  const [quantities, setQuantities] = useState({});
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState({});

  useEffect(() => {
    // Fetch product data based on selected category
    const fetchProductData = async () => {
      try {
        let productToLoad = null;
        
        if (selectedCategory) {
          // Fetch product by category
          const response = await axios.get(`${API_URL}/products?category=${encodeURIComponent(selectedCategory)}&limit=1`);
          if (response.data && response.data.length > 0) {
            productToLoad = response.data[0];
          }
        }
        
        // Fallback to first product if no category match
        if (!productToLoad) {
          const response = await axios.get(`${API_URL}/products?limit=1`);
          if (response.data && response.data.length > 0) {
            productToLoad = response.data[0];
          }
        }

        if (productToLoad) {
          setProduct(productToLoad);
          
          // Build inventory map from product variants
          const inventoryMap = {};
          if (productToLoad.variants) {
            productToLoad.variants.forEach(variant => {
              const key = `${variant.color}-${variant.size}`;
              inventoryMap[key] = variant.stock_quantity || 0;
            });
          }
          setInventory(inventoryMap);
          
          // Fetch size chart data
          try {
            const sizeChartResponse = await axios.get(`${API_URL}/products/${productToLoad.id}/sizechart`);
            setSizeChartData(sizeChartResponse.data);
          } catch (error) {
            console.log('Using default size chart data');
          }
        } else {
          // Create fallback product for demo
          const fallbackProduct = {
            id: 'demo-product-1',
            name: selectedCategory || 'Oversized Drop-shoulder, 210gsm, Terry cotton/Longjohit Heavy Gauge, 100% Cotton',
            category: selectedCategory || 'Oversize 210gsm',
            base_price: 319,
            bulk_price: 279,
            variants: []
          };
          
          // Generate random inventory for demo
          const demoInventory = {};
          sizeChartData.colors.forEach(color => {
            sizeChartData.sizes.forEach(size => {
              const key = `${color}-${size}`;
              // Randomly assign 0-50 pieces (10% chance of 0 stock)
              demoInventory[key] = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 50) + 1;
            });
          });
          
          setProduct(fallbackProduct);
          setInventory(demoInventory);
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        // Create demo inventory even on error
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
    // Clear quantities when switching products
    setQuantities({});
  }, [productId, selectedCategory]);

  const handleQuantityChange = (color, size, quantity) => {
    const key = `${color}-${size}`;
    const numQuantity = parseInt(quantity) || 0;
    const availableStock = inventory[key] || 0;
    
    // Don't allow quantities greater than available stock
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

  // Calculate total quantity and pricing
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
      }
    } catch (error) {
      toast.error('Failed to add items to cart');
    }
  };

  const total = calculateTotal();

  return (
    <div className="container mx-auto p-4">
      {/* Product Title */}
      {product && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <h3 className="text-lg font-bold text-blue-800">
            Current Product: {product.name}
          </h3>
          <p className="text-sm text-blue-600">Category: {product.category}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="border border-gray-300 p-3 text-left font-bold">
                {sizeChartData.chart_code || 'OS210'}
              </th>
              {sizeChartData.sizes.map(size => (
                <th key={size} className="border border-gray-300 p-3 text-center font-bold">{size}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeChartData.colors.map((color, index) => (
              <tr key={color} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 p-3 font-semibold text-center">{color}</td>
                {sizeChartData.sizes.map(size => {
                  const key = `${color}-${size}`;
                  const stockQuantity = inventory[key] || 0;
                  const isOutOfStock = stockQuantity === 0;
                  
                  return (
                    <td key={size} className="border border-gray-300 p-3 text-center relative">
                      {isOutOfStock ? (
                        <div className="w-16 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
                          <span className="text-red-600 font-bold text-lg">✕</span>
                        </div>
                      ) : (
                        <>
                          <input 
                            type="number" 
                            min="0"
                            max={stockQuantity}
                            className="w-16 h-8 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={quantities[key] || ''}
                            onChange={(e) => handleQuantityChange(color, size, e.target.value)}
                            placeholder="0"
                            title={`Stock: ${stockQuantity} pieces`}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Stock: {stockQuantity}
                          </div>
                        </>
                      )}
                    </td>
                  );
                })}
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

          {/* Real-time Calculation Summary */}
          {total.totalQuantity > 0 && (
            <div className="bg-white p-4 rounded-lg mb-4 border-2 border-blue-300">
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
                  {!total.isBulk && total.totalQuantity > 0 && (
                    <div className="text-sm text-green-600">
                      Bulk price would be: ₹{total.totalQuantity * total.bulkPrice}
                    </div>
                  )}
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
            
            {total.totalQuantity > 0 && (
              <button
                onClick={handleAddToCart}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-bold"
              >
                Add {total.totalQuantity} items to Cart (₹{total.totalPrice})
              </button>
            )}
          </div>

          {/* Detailed breakdown */}
          {total.totalQuantity > 0 && (
            <div className="mt-4 pt-4 border-t border-yellow-300">
              <h4 className="font-semibold mb-2">Items breakdown:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(quantities).map(([key, qty]) => {
                  if (qty > 0) {
                    const [color, size] = key.split('-');
                    const stockAvailable = inventory[key] || 0;
                    return (
                      <div key={key} className="bg-gray-100 p-2 rounded">
                        <span className="font-medium">{color} {size}:</span> {qty} pcs
                        <div className="text-xs text-gray-500">Available: {stockAvailable}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
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