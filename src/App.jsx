import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ClimbingAnalysis from './components/ClimbingAnalysis';
import Login from './components/Login';
import ClientPortal from './components/ClientPortal';
import { verifyEmail } from './utils/auth';
import './App.css'

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isCoach: false,
    assessments: [],
    email: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        const result = await verifyEmail(storedEmail);
        setAuthState({
          isAuthenticated: result.isAuthenticated,
          isCoach: result.isCoach,
          assessments: result.assessments,
          email: storedEmail
        });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (result) => {
    setAuthState({
      isAuthenticated: true,
      isCoach: result.isCoach,
      assessments: result.assessments,
      email: localStorage.getItem('userEmail')
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isCoach');
    setAuthState({
      isAuthenticated: false,
      isCoach: false,
      assessments: [],
      email: null
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      {authState.isAuthenticated ? (
        <div className="min-h-screen bg-gray-100">
          <div className="bg-indigo-700 shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-white">Climbing Performance Analysis</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white">{authState.email}</span>
                {authState.isCoach && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Coach
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-white text-xs font-medium rounded text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          <div className="py-6">
            <ClientPortal />
          </div>
        </div>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
