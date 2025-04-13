import React from 'react';
import { Link } from 'react-router-dom';

const AccountDeleted: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg 
            className="mx-auto h-16 w-16 text-green-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Successfully Deleted</h1>
        
        <p className="text-gray-600 mb-8">
          Your account and all associated data have been permanently deleted from our system. 
          Thank you for using Writify. We hope to see you again in the future!
        </p>
        
        <Link 
          to="/login" 
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default AccountDeleted;
