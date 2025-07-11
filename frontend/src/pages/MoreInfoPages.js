import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useApp } from '../components';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com'}/api`;

// About Us Component
export const AboutUsModal = ({ onClose }) => {
  const [aboutInfo, setAboutInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutInfo();
  }, []);

  const fetchAboutInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/info/about-us`);
      setAboutInfo(response.data);
    } catch (error) {
      console.error('Error fetching about info:', error);
      toast.error('Failed to load about information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">Loading about information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">About DRIBBLE</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {aboutInfo && (
          <div className="space-y-6">
            {/* Company Overview */}
            <div className="text-center bg-yellow-50 p-6 rounded-lg">
              <h1 className="text-3xl font-bold text-yellow-600 mb-2">{aboutInfo.company_name}</h1>
              <p className="text-lg text-gray-700 italic">{aboutInfo.tagline}</p>
              <p className="text-gray-600 mt-4">{aboutInfo.about}</p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-blue-600 mb-3">Our Mission</h3>
                <p className="text-gray-700">{aboutInfo.mission}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-green-600 mb-3">Our Vision</h3>
                <p className="text-gray-700">{aboutInfo.vision}</p>
              </div>
            </div>

            {/* Company Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Founded:</strong> {aboutInfo.founded}</div>
                <div><strong>Location:</strong> {aboutInfo.location}</div>
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Why Choose DRIBBLE?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aboutInfo.key_features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Our Certifications</h3>
              <div className="space-y-2">
                {aboutInfo.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center bg-blue-50 p-3 rounded">
                    <span className="text-blue-500 mr-2">🏆</span>
                    <span className="text-gray-700">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Pricing Component
export const PricingModal = ({ onClose }) => {
  const [pricingInfo, setPricingInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingInfo();
  }, []);

  const fetchPricingInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/info/pricing-info`);
      setPricingInfo(response.data);
    } catch (error) {
      console.error('Error fetching pricing info:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">Loading pricing information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Pricing Information</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {pricingInfo && (
          <div className="space-y-6">
            {/* Minimum Order */}
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <h3 className="text-xl font-bold text-yellow-600 mb-2">Minimum Order Quantity</h3>
              <p className="text-3xl font-bold text-yellow-800">{pricingInfo.minimum_order} pieces</p>
            </div>

            {/* Pricing Tiers */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Volume-Based Pricing Tiers</h3>
              <div className="space-y-3">
                {pricingInfo.pricing_tiers.map((tier, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-800">{tier.label}</h4>
                        <p className="text-sm text-gray-600">
                          {tier.min_qty} - {tier.max_qty || '∞'} pieces
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-green-600">{tier.discount}</span>
                        <p className="text-sm text-gray-600">discount</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Products */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Sample Product Pricing</h3>
              <div className="space-y-3">
                {pricingInfo.sample_products.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-800">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 line-through">₹{product.regular_price}</div>
                        <div className="text-lg font-bold text-green-600">₹{product.bulk_price}</div>
                        <div className="text-sm text-green-600">Save ₹{product.savings}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-blue-800 mb-3">Additional Information</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div><strong>GST:</strong> {pricingInfo.additional_info.gst}</div>
                <div><strong>Shipping:</strong> {pricingInfo.additional_info.shipping}</div>
                <div><strong>Payment Terms:</strong> {pricingInfo.additional_info.payment_terms}</div>
                <div><strong>Delivery Time:</strong> {pricingInfo.additional_info.delivery_time}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Videos Component
export const VideosModal = ({ onClose }) => {
  const [videos] = useState([
    {
      id: 1,
      title: "Product Quality Overview",
      description: "Learn about our premium cotton quality and manufacturing process",
      thumbnail: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=300&h=200&fit=crop",
      duration: "3:45"
    },
    {
      id: 2,
      title: "Size Chart Guide",
      description: "How to choose the right size for your bulk order",
      thumbnail: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=200&fit=crop",
      duration: "2:30"
    },
    {
      id: 3,
      title: "Printing Guidelines",
      description: "Best practices for DTG, Screen, and DTF printing on our t-shirts",
      thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop",
      duration: "5:20"
    },
    {
      id: 4,
      title: "Order Process Walkthrough",
      description: "Step-by-step guide to placing your bulk order",
      thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop",
      duration: "4:15"
    }
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Product Videos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <button className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-colors">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2">{video.title}</h3>
                <p className="text-sm text-gray-600">{video.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Click on any video to watch. More videos coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

// Suggestions Component
export const SuggestionsModal = ({ onClose }) => {
  const { user } = useApp();
  const [formData, setFormData] = useState({
    category: 'product',
    message: '',
    name: user?.full_name || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/info/suggestions`, formData);
      toast.success('Thank you for your suggestion! We appreciate your feedback.');
      setFormData({ category: 'product', message: '', name: user?.full_name || '', email: user?.email || '' });
    } catch (error) {
      console.error('Error sending suggestion:', error);
      toast.error('Failed to send suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Send Suggestion</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="product">Product Suggestion</option>
              <option value="website">Website Improvement</option>
              <option value="service">Service Enhancement</option>
              <option value="other">Other</option>
            </select>
          </div>

          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Suggestion</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us how we can improve..."
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Orders/Bills/Tracking Component
export const OrdersTrackingModal = ({ onClose }) => {
  const { user } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/orders`, { headers });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = () => {
    if (trackingId.trim()) {
      toast.info(`Tracking order: ${trackingId}. Feature coming soon!`);
    } else {
      toast.error('Please enter a valid order ID');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Orders & Tracking</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {!user ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please log in to view your orders</p>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Track Order Without Login</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Order ID"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleTrackOrder}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Track
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-8">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">Order #{order.id.slice(-8)}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">₹{order.total_amount.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      {item.product_name} - {item.color} {item.size} × {item.quantity}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// FAQ Modal Component (separate from main FAQ)
export const FAQModal = ({ onClose }) => {
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
    },
    {
      question: "Do you provide samples before bulk orders?",
      answer: "Yes, we provide samples for quality check. Sample cost is ₹200 per piece which is adjustable against bulk orders."
    },
    {
      question: "What are your delivery timelines?",
      answer: "Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available for major cities at additional cost."
    },
    {
      question: "Do you offer customization services?",
      answer: "We provide blank apparel. However, we can recommend trusted printing partners for customization services."
    },
    {
      question: "What is your return and exchange policy?",
      answer: "We offer 7-day return policy for manufacturing defects and 15-day exchange policy for size issues on unused products."
    }
  ];

  const handleFAQClick = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Frequently Asked Questions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
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
                <div className="p-4 pt-0 text-gray-600 border-t border-gray-200">
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