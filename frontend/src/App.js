import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { 
  Header, 
  Navigation, 
  ProductInfo, 
  SizeChart, 
  HeroSection, 
  ProductGallery, 
  FAQ, 
  Footer, 
  ContactInfo 
} from './components';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      <ProductInfo />
      <SizeChart />
      <HeroSection />
      <ProductGallery />
      <ContactInfo />
      <FAQ />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
