import React, { useState, useEffect } from 'react';
import { useApp } from '../components';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com'}/api`;

export const CheckoutPage = () => {
  const { cart, fetchCart } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);
  
  // Customer form state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  // Address form state
  const [shippingAddress, setShippingAddress] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });
  
  const [billingAddressSame, setBillingAddressSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India'
  });

  useEffect(() => {
    fetchCart();
    calculateOrderSummary();
  }, []);

  useEffect(() => {
    calculateOrderSummary();
  }, [cart]);

  const calculateOrderSummary = () => {
    if (!cart.items || cart.items.length === 0) return;
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const taxAmount = subtotal * 0.18; // 18% GST
    const shippingAmount = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const totalAmount = subtotal + taxAmount + shippingAmount;
    
    setOrderSummary({
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  };

  const validateForm = () => {
    const errors = [];
    
    if (!customerInfo.name.trim()) errors.push('Name is required');
    if (!customerInfo.email.trim()) errors.push('Email is required');
    if (!customerInfo.phone.trim()) errors.push('Phone is required');
    
    if (!shippingAddress.address_line_1.trim()) errors.push('Address is required');
    if (!shippingAddress.city.trim()) errors.push('City is required');
    if (!shippingAddress.state.trim()) errors.push('State is required');
    if (!shippingAddress.postal_code.trim()) errors.push('Postal code is required');
    
    if (errors.length > 0) {
      toast.error(errors[0]);
      return false;
    }
    
    return true;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    if (!cart.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }

      // Create order
      const checkoutData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: shippingAddress,
        billing_address: billingAddressSame ? shippingAddress : billingAddress,
        notes: customerInfo.notes
      };

      const response = await axios.post(`${API_URL}/payment/create-order`, checkoutData);
      const orderData = response.data;

      // Configure Razorpay options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency,
        name: "DRIBBLE",
        description: `Order for ${orderSummary.itemCount} items`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        theme: {
          color: "#3B82F6"
        },
        handler: async function (response) {
          try {
            // Verify payment
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const verifyResponse = await axios.post(`${API_URL}/payment/verify`, verificationData);
            
            if (verifyResponse.data.status === 'success') {
              toast.success('Payment successful!');
              
              // Clear cart and redirect
              await fetchCart();
              navigate('/payment/success', { 
                state: { 
                  orderId: verifyResponse.data.order_id,
                  paymentId: response.razorpay_payment_id
                }
              });
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
            navigate('/payment/cancel');
          }
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
            setLoading(false);
          }
        }
      };

      // Open Razorpay checkout
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart before checkout.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Checkout</h1>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Customer Information & Address */}
          <div className="space-y-6">
            
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special instructions for your order"
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={shippingAddress.address_line_1}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, address_line_1: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="House/Flat number, Street name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={shippingAddress.address_line_2}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, address_line_2: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Landmark, Area (Optional)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="State"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PIN Code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={billingAddressSame}
                    onChange={(e) => setBillingAddressSame(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Billing address same as shipping address</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.product_name}</h3>
                      <p className="text-sm text-gray-600">{item.color} - {item.size}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{(item.unit_price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">₹{item.unit_price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Price Breakdown */}
            {orderSummary && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Price Breakdown</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({orderSummary.itemCount} items)</span>
                    <span>₹{orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (GST 18%)</span>
                    <span>₹{orderSummary.taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>
                      {orderSummary.shippingAmount === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${orderSummary.shippingAmount.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">₹{orderSummary.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {orderSummary.shippingAmount === 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">🎉 You qualify for FREE shipping!</p>
                  </div>
                )}
                
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full mt-6 bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay ₹${orderSummary.totalAmount.toFixed(2)}`
                  )}
                </button>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Secure payment powered by Razorpay
                  </p>
                  <div className="flex justify-center mt-2 space-x-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">💳 Cards</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">📱 UPI</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">🏦 Net Banking</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">💰 Wallets</span>
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