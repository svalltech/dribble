import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { 
  AppProvider,
  Header, 
  CategoryNavigation, 
  HeroSection, 
  ProductGrid, 
  FeaturesSection,
  Footer 
} from './components';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <CategoryNavigation />
      <HeroSection />
      <ProductGrid />
      <FeaturesSection />
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
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  );
}

export default App;
