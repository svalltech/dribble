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

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://e6320fa4-c3c3-4462-8bde-d717fd5efcd4.preview.emergentagent.com'}/api`;

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
      <Navigation onCategorySelect={handleCategorySelection} />
      <ProductInfo />
      <SizeChart productId={currentProductId} selectedCategory={selectedCategory} />
      <ContentSection />
      <FAQ />
      <Footer />
    </div>
  );
};

// Checkout Page Component
const CheckoutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-center text-gray-600">
            Checkout functionality will be implemented with payment gateway integration.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Payment Success Page
const PaymentSuccessPage = () => {
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
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
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
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Admin Panel Component
const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">DRIBBLE Admin Dashboard</h1>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Products</h3>
            <p className="text-gray-600">Manage product inventory and pricing</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Orders</h3>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Analytics</h3>
            <p className="text-gray-600">View sales and performance metrics</p>
          </div>
        </div>
      </div>
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