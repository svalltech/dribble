import React, { useState } from 'react';

// Header Component
export const Header = () => {
  const [currentQuantity, setCurrentQuantity] = useState("2,56,352");
  
  return (
    <div className="bg-yellow-300 p-4">
      <div className="container mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black">BulkPlainTshirt.com</h1>
          <p className="text-sm text-gray-700">bulk t-shirts for Brands & Agency</p>
          <div className="mt-2">
            <span className="text-sm text-gray-700">~ {currentQuantity} pcs sold in previous month ~</span>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <button className="bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 transition-colors">
              Pricing
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 transition-colors">
              🛒 Cart
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition-colors">
              Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
export const Navigation = () => {
  const categories = [
    { name: "Oversize 210gsm", color: "bg-red-500" },
    { name: "Oversize 240gsm", color: "bg-orange-500" },
    { name: "Kids Kneck", color: "bg-yellow-500" },
    { name: "Oversize 190gsm", color: "bg-green-500" },
    { name: "Tue Bio Kneck", color: "bg-blue-500" },
    { name: "Bio Kneck", color: "bg-purple-500" },
    { name: "Polo Shirts", color: "bg-pink-500" },
    { name: "Sublimation", color: "bg-indigo-500" },
    { name: "Premium Polo", color: "bg-red-600" },
    { name: "Cotton Polo", color: "bg-orange-600" },
    { name: "Hoodie 320gsm", color: "bg-yellow-600" },
    { name: "Hoodie 270gsm", color: "bg-green-600" },
    { name: "Sweatshirt", color: "bg-blue-600" },
    { name: "Varsity", color: "bg-purple-600" },
    { name: "Dropship Hoodie 430gsm", color: "bg-pink-600" },
    { name: "Shorts", color: "bg-indigo-600" },
    { name: "Gym vest", color: "bg-red-700" },
    { name: "Activework OS", color: "bg-orange-700" },
    { name: "Activework BF", color: "bg-yellow-700" }
  ];

  return (
    <div className="bg-gray-100 p-2">
      <div className="container mx-auto">
        <div className="flex flex-wrap gap-1 justify-center">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`${category.color} text-white px-3 py-1 text-xs rounded hover:opacity-80 transition-opacity`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="text-center mt-2">
          <button className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition-colors">
            Plugins available
          </button>
          <span className="ml-2 text-sm text-gray-600">Add to cart</span>
        </div>
      </div>
    </div>
  );
};

// Product Info Component
export const ProductInfo = () => {
  return (
    <div className="bg-yellow-100 p-4">
      <div className="container mx-auto text-center">
        <h2 className="text-lg font-bold text-black mb-2">
          Oversized Drop-shoulder, 210gsm, Terry cotton/Longjohit Heavy Gauge, 100% Cotton
        </h2>
        <p className="text-sm text-gray-700">
          Super fine stitched Premium Quality Red Lable Fabric
        </p>
      </div>
    </div>
  );
};

// Size Chart Component
export const SizeChart = () => {
  const colors = ['Black', 'White', 'Lavender', 'Beige', 'Red', 'Sage Green', 'Brown', 'Maroon', 'Orange', 'Navy'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="p-3 text-left">Color</th>
              {sizes.map(size => (
                <th key={size} className="p-3 text-center">{size}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((color, index) => (
              <tr key={color} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-3 font-semibold">{color}</td>
                {sizes.map(size => (
                  <td key={size} className="p-3 text-center">
                    <input type="checkbox" className="w-4 h-4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="bg-yellow-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold">Size</span>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="font-bold">More than 15pcs</div>
                <div className="text-lg font-bold">279₹</div>
              </div>
              <div className="text-center">
                <div className="font-bold">Less than 15pcs</div>
                <div className="text-lg font-bold">319₹</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors mr-2">
              Product
            </button>
            <button className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors">
              Live/Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hero Image Component
export const HeroSection = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-8 text-center">
        <img 
          src="https://images.unsplash.com/photo-1716369786631-b8b9c7ac1dc4" 
          alt="Bulk Plain T-shirts"
          className="w-full max-w-2xl mx-auto rounded-lg shadow-lg mb-6"
        />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Wholesale plain t-shirts manufacturer in India with huge ready stock.
        </h2>
        <p className="text-lg text-gray-700 mb-2">
          Perfect for t-shirt printing businesses and bulk orders.
        </p>
        <p className="text-lg text-gray-700">
          Premium quality blank t-shirts and plain hoodies for DTG, Screen and DTF printing.
        </p>
      </div>
    </div>
  );
};

// Product Gallery Component
export const ProductGallery = () => {
  const products = [
    {
      image: "https://images.unsplash.com/photo-1604898426743-ed3d1ace7bf6",
      title: "Premium Plain T-shirts",
      description: "High-quality cotton t-shirts available in bulk"
    },
    {
      image: "https://images.unsplash.com/photo-1618354691714-7d92150909db",
      title: "Wholesale Collection",
      description: "Wide range of colors and sizes"
    },
    {
      image: "https://images.unsplash.com/photo-1610502778270-c5c6f4c7d575",
      title: "Ready for Printing",
      description: "Perfect for DTG and screen printing"
    },
    {
      image: "https://images.pexels.com/photos/6046231/pexels-photo-6046231.jpeg",
      title: "Quality Fabric",
      description: "100% cotton premium quality"
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{product.title}</h3>
              <p className="text-gray-600 text-sm">{product.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// FAQ Component
export const FAQ = () => {
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
    }
  ];

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4 bg-white rounded-lg shadow">
              <button
                className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <span className="font-semibold text-gray-800">{faq.question}</span>
                <span className="text-2xl text-gray-500">
                  {openFAQ === index ? '−' : '+'}
                </span>
              </button>
              {openFAQ === index && (
                <div className="p-4 pt-0 text-gray-600">
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

// Footer Component
export const Footer = () => {
  const links = [
    "Privacy Policy",
    "Shipping and Delivery Policy", 
    "Return and Refund Policy",
    "Terms and Conditions",
    "Disclaimer",
    "Sitemap"
  ];

  return (
    <footer className="bg-yellow-200 py-6">
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {links.map((link, index) => (
            <a 
              key={index}
              href="#" 
              className="text-sm text-gray-700 hover:text-gray-900 hover:underline transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="text-center text-sm text-gray-600">
          <p>Made in India</p>
          <p className="mt-2">© 2025 BulkPlainTshirt.com - All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

// Contact Info Component
export const ContactInfo = () => {
  return (
    <div className="bg-blue-50 py-6">
      <div className="container mx-auto p-4 text-center">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Get in Touch</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2">WhatsApp</h4>
            <p className="text-green-600">+91 98765 43210</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2">Email</h4>
            <p className="text-blue-600">orders@bulkplaintshirt.com</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2">Support</h4>
            <p className="text-purple-600">24/7 Customer Service</p>
          </div>
        </div>
      </div>
    </div>
  );
};
