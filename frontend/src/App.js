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

  useEffect(() => {
    // Fetch the first product to display in size chart
    const fetchDefaultProduct = async () => {
      try {
        const response = await axios.get(`${API_URL}/products?limit=1`);
        if (response.data && response.data.length > 0) {
          setCurrentProductId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching default product:', error);
      }
    };
    fetchDefaultProduct();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <ProductInfo />
      <SizeChart productId={currentProductId} />
      <ContentSection />
      <FAQ />
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
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  );
}

export default App;