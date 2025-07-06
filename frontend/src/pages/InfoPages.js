import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useApp } from '../components';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://aa4f6fe3-4ad0-49ff-bf5e-4f672779c6bd.preview.emergentagent.com'}/api`;

// Delivery Details Component
export const DeliveryDetailsModal = ({ onClose }) => {
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryInfo();
  }, []);

  const fetchDeliveryInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/info/delivery-details`);
      setDeliveryInfo(response.data);
    } catch (error) {
      console.error('Error fetching delivery info:', error);
      toast.error('Failed to load delivery information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">Loading delivery information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Delivery Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {deliveryInfo && (
          <div className="space-y-6">
            {/* Delivery Policies */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Delivery Policies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Free Shipping:</strong> Orders above ₹{deliveryInfo.policies.free_shipping_threshold}
                </div>
                <div>
                  <strong>Express Delivery:</strong> ₹{deliveryInfo.policies.express_delivery_cost} extra
                </div>
                <div>
                  <strong>COD Charges:</strong> ₹{deliveryInfo.policies.cod_charges}
                </div>
                <div>
                  <strong>Return Policy:</strong> {deliveryInfo.policies.return_policy_days} days
                </div>
              </div>
            </div>

            {/* Delivery Zones */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Delivery Zones</h3>
              <div className="space-y-3">
                {deliveryInfo.zones.map((zone, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <strong>{zone.city}, {zone.state}</strong><br />
                        PIN: {zone.pincode_range}
                      </div>
                      <div>
                        Delivery: {zone.delivery_days} days<br />
                        Cost: ₹{zone.shipping_cost}
                      </div>
                      <div>
                        COD: {zone.is_cod_available ? '✅ Available' : '❌ Not Available'}
                      </div>
                      <div>
                        Express: {zone.is_express_available ? '✅ Available' : '❌ Not Available'}
                      </div>
                    </div>
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

// Shipping Calculator Component
export const ShippingCalculatorModal = ({ onClose }) => {
  const [pincode, setPincode] = useState('');
  const [weight, setWeight] = useState(1);
  const [isExpress, setIsExpress] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateShipping = async () => {
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/info/shipping-calculator`, {
        pincode,
        weight: parseFloat(weight),
        is_express: isExpress
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast.error('Failed to calculate shipping cost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Shipping Calculator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter 6-digit pincode"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="express"
              checked={isExpress}
              onChange={(e) => setIsExpress(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="express" className="text-sm text-gray-700">Express Delivery</label>
          </div>

          <button
            onClick={calculateShipping}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Shipping'}
          </button>

          {result && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Shipping Details</h3>
              <div className="space-y-1 text-sm text-green-700">
                <div>Pincode: {result.pincode}</div>
                <div>Weight: {result.weight} kg</div>
                <div>Base Shipping: ₹{result.base_shipping_cost}</div>
                {result.express_cost > 0 && <div>Express Charges: ₹{result.express_cost}</div>}
                <div className="font-semibold">Total Cost: ₹{result.total_shipping_cost}</div>
                <div>Delivery: {result.delivery_days} days</div>
                <div>COD: {result.is_cod_available ? 'Available' : 'Not Available'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Live Stock Component
export const LiveStockModal = ({ onClose }) => {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      const response = await axios.get(`${API_URL}/info/live-stock`);
      setStockData(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to load stock information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">Loading stock information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Live Stock Status</h2>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Last updated: {stockData ? new Date(stockData.summary.last_updated).toLocaleString() : 'Loading...'}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {stockData && (
          <div className="space-y-6">
            {/* Stock Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stockData.summary.total_variants}</div>
                <div className="text-sm text-blue-800">Total Variants</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stockData.summary.in_stock}</div>
                <div className="text-sm text-green-800">In Stock</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{stockData.summary.low_stock}</div>
                <div className="text-sm text-yellow-800">Low Stock</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{stockData.summary.out_of_stock}</div>
                <div className="text-sm text-red-800">Out of Stock</div>
              </div>
            </div>

            {/* Product Stock Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Stock Details</h3>
              <div className="space-y-4">
                {stockData.products.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">{product.product_name}</h4>
                    <p className="text-sm text-gray-600 mb-3">Category: {product.category}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {product.variants.map((variant, vIndex) => (
                        <div key={vIndex} className={`p-2 rounded text-center text-xs ${
                          variant.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                          variant.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          <div className="font-semibold">{variant.color} {variant.size}</div>
                          <div>{variant.stock_quantity} pcs</div>
                        </div>
                      ))}
                    </div>
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

// Contact Us Component
export const ContactUsModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/info/contact-info`);
      setContactInfo(response.data);
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/info/contact`, formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Contact Us</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Get in touch</h3>
            {contactInfo && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Contact Details</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>📧 {contactInfo.email}</div>
                    <div>📞 {contactInfo.phone}</div>
                    <div>💬 WhatsApp: {contactInfo.whatsapp}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Office Address</h4>
                  <div className="text-sm text-gray-600">
                    {contactInfo.address.line1}<br />
                    {contactInfo.address.line2}<br />
                    {contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.pincode}<br />
                    {contactInfo.address.country}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Business Hours</h4>
                  <div className="text-sm text-gray-600">{contactInfo.business_hours}</div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Follow Us</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Instagram: {contactInfo.social_media.instagram}</div>
                    <div>Facebook: {contactInfo.social_media.facebook}</div>
                    <div>LinkedIn: {contactInfo.social_media.linkedin}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};