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
  
  useEffect(() => {
    // Get order ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    
    if (orderId) {
      // Fetch order details if needed
      setOrderDetails({ id: orderId });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">Thank you for your order. You will receive a confirmation email shortly.</p>
          {orderDetails && (
            <p className="text-sm text-gray-500 mb-4">Order ID: {orderDetails.id.slice(-8)}</p>
          )}
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
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
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">Your payment was cancelled. You can try again or continue shopping.</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = '/checkout'}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
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