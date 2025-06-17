import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
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

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <ProductInfo />
      <SizeChart />
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