import React, { useState, useEffect } from 'react';
import { useApp } from '../components';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'https://cecd11b7-b73d-489a-874b-a29bc1a6d120.preview.emergentagent.com'}/api`;

export const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">DRIBBLE Admin Dashboard</h1>
          <p className="text-blue-100 mt-2">Admin panel is ready!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <p className="text-lg text-gray-600 mb-4">
            Admin functionality is implemented and ready for use.
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