import React, { useState, useEffect } from 'react';
import { useApp } from '../components';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com'}/api`;

export const CheckoutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Checkout</h1>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-lg text-gray-600 mb-4">
            Checkout functionality is ready! This is the checkout page.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};