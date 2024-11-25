import React, { useState } from 'react';
import { fetchAssessmentsByEmail } from '../utils/airtable';
import ClimbingAnalysis from './ClimbingAnalysis';
import AskAI from './AskAI'; // Import the AskAI component
import { Bug } from 'lucide-react';

const ClientPortal = () => {
  const [email, setEmail] = useState('');
  const [assessments, setAssessments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchAssessmentsByEmail(email);
      setAssessments(data);
      if (data.length === 0) {
        setError('No assessments found for this email.');
      }
    } catch (err) {
      setError(err.message);
      setAssessments(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-pink-900 mb-8 text-center">
          Climbing Performance Analysis
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
            <div className="flex-grow w-full md:w-96">
              <label className="block text-sm font-medium text-pink-700 mb-1">
                Enter your email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Loading...' : 'View Assessments'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>

      {assessments && assessments.length > 0 && (
        <div className="space-y-6">
          {/* Debug Panel Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-pink-600 hover:text-pink-800 bg-pink-50 rounded-md"
            >
              <Bug size={16} />
              {showDebug ? 'Hide' : 'Show'} Debug Panel
            </button>
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 overflow-x-auto">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Raw Data (Debug)</h3>
              <pre className="text-xs text-gray-600">
                {JSON.stringify(assessments, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Analysis Section */}
            <div className="flex-1">
              <ClimbingAnalysis assessments={assessments} />
            </div>
            
            {/* Chat Section */}
            <div className="w-full md:w-1/3 min-w-[300px]">
              <AskAI assessments={assessments} latestAssessment={assessments[0]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
