import React, { useState, useEffect } from 'react';
import { fetchAssessmentsByEmail } from '../utils/airtable';
import ClimbingAnalysis from './ClimbingAnalysis';
import CoachDashboard from './CoachDashboard';
import AskAI from './AskAI'; 
import { Bug } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { isCoach } from '../utils/auth';

function ClientPortal() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isCoachUser, setIsCoachUser] = useState(false);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          setError('No email found');
          setLoading(false);
          return;
        }

        setUserEmail(email);
        setIsCoachUser(isCoach(email));

        if (!isCoach(email)) {
          const data = await fetchAssessmentsByEmail(email);
          setAssessments(data);
        }
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {isCoachUser ? (
        <CoachDashboard />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {assessments.length > 0 ? (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-1 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200"
                >
                  <Bug size={16} />
                  {showDebug ? 'Hide Debug Panel' : 'Show Debug Panel'}
                </button>
              </div>

              {showDebug && (
                <div className="mb-8 p-4 bg-indigo-700 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                    <Bug size={20} />
                    Raw Data (Debug)
                  </h3>
                  <pre className="text-xs overflow-auto bg-white p-4 rounded border border-indigo-800 text-gray-800">
                    {JSON.stringify(assessments, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6">
                {/* Analysis Section */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
                  <ClimbingAnalysis 
                    assessments={assessments} 
                    isCoach={localStorage.getItem('isCoach') === 'true'} 
                  />
                </div>
                
                {/* Chat Section */}
                <div className="w-full md:w-1/3 min-w-[300px]">
                  <AskAI assessments={assessments} latestAssessment={assessments[0]} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600">No assessments found for this email.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientPortal;
