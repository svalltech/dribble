import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { 
  AppProvider,
  Header, 
  Navigation, 
  ProductInfo, 
  SizeChart, 
  ContentSection,
  FAQ,
  Footer 
} from './components';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminPanel } from './pages/AdminPanel';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com'}/api`;

const Home = () => {
  const [currentProductId, setCurrentProductId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    // Fetch the first product to display in size chart
    const fetchDefaultProduct = async () => {
      try {
        const response = await axios.get(`${API_URL}/products?limit=1`);
        if (response.data && response.data.length > 0) {
          setCurrentProductId(response.data[0].id);
          setSelectedCategory(response.data[0].category);
        }
      } catch (error) {
        console.error('Error fetching default product:', error);
        // Set default category for demo
        setSelectedCategory('Oversize 210gsm');
      }
    };
    fetchDefaultProduct();
  }, []);

  const handleCategorySelection = (categoryName) => {
    setSelectedCategory(categoryName);
    // Clear current product ID to force refetch
    setCurrentProductId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation onCategorySelect={handleCategorySelection} selectedCategory={selectedCategory} />
      <ProductInfo />
      <SizeChart productId={currentProductId} selectedCategory={selectedCategory} />
      <ContentSection />
      <FAQ />
      <Footer />
    </div>
  );
};

// Payment Success Page
const PaymentSuccessPage = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const location = window.location;
  
  useEffect(() => {
    // Get order details from navigation state or URL params
    const state = location.state;
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = state?.orderId || urlParams.get('order_id');
    const paymentId = state?.paymentId || urlParams.get('payment_id');
    
    if (orderId) {
      setOrderDetails({ 
        id: orderId,
        paymentId: paymentId,
        timestamp: new Date().toLocaleString()
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order! Your payment has been processed successfully.
          </p>
          
          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Order Details:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Order ID:</span> #{orderDetails.id.slice(-8)}</p>
                {orderDetails.paymentId && (
                  <p><span className="font-medium">Payment ID:</span> {orderDetails.paymentId.slice(-10)}</p>
                )}
                <p><span className="font-medium">Date:</span> {orderDetails.timestamp}</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📧 A confirmation email will be sent to your registered email address with order details and tracking information.
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
            <button 
              onClick={() => window.location.href = '/orders'}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Payment Cancel Page
const PaymentCancelPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled or failed to process. Don't worry, no charges have been made to your account.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              💡 Your cart items are still saved. You can complete your purchase anytime.
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/checkout'}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Payment Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            <Route path="/admin-ui/dashboard" element={<AdminPanel />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  );
}

export default App;